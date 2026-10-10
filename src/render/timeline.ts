// Skill presentation timelines (timeline@1, asset-kit docs/타임라인-형식.md) played on the field. The sim never waits for them:
// world.ts says when a skill is released (skillStart, with its contact and hit times), and the timeline adds the show around it —
// game effects at chosen moments, sounds, camera shake and zoom, hit-stop, flashes, dimming, body moves and screen cut-ins.
// Timelines live in src/assets/timelines/*.json (checked and registered by `npm run timelines`); `skills` names the skills that
// start each one. The body motion itself stays the hero's skill motion (pixel.ts fits its wind-up to the contact time).
import * as TL from './vendor/asset-kit-timeline.js';
import type { Active, Timeline } from './vendor/asset-kit-timeline.js';

const FILES = import.meta.glob('../assets/timelines/*.json', { eager: true, import: 'default' }) as Record<string, Timeline>;
const IMAGES = import.meta.glob('../assets/timelines/**/*.{png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** skill id → timeline */
const BY_SKILL = new Map<string, Timeline>();
for (const tl of Object.values(FILES)) for (const s of tl.skills ?? []) BY_SKILL.set(s, tl);
export const timelineFor = (skill: string) => BY_SKILL.get(skill);
export const timelines = () => [...new Set(BY_SKILL.values())];

/** what the field gives the player: where units are, which way they face, and the field's own shake / flash / stop / effects */
export interface TimelineHost {
  pos(uid: number): { x: number; y: number; h: number } | null;
  facing(uid: number): 1 | -1;
  /** the caster's current skill motion (null once it walks, swings or casts something else) */
  skillOf(uid: number): { id: string; at: number } | null;
  fireFx(name: string, from: number, to: number | undefined, at: { x: number; y: number }, params: Record<string, unknown>): void;
  sound(key: string, vol?: number, rate?: number): void;
  kick(shake: number, flash: number, color: string, stopMs: number): void;
  /** hold the screen shake at least this strong this frame (a shake clip follows its amp keys) */
  shakeTo(amp: number): void;
  reduced: boolean;
}

interface Run { tl: Timeline; t0: number; uid: number; to?: number; skill: string; lv: number; events: Record<string, number | number[]>; prev: number; cutAt: number | null; end: number }

const BODY = 48; // field units per "body height" (units: body), the pixel heroes' standing height
const FADE_MS = 150;
const STYLE_PX: Record<string, number> = { title: 30, subtitle: 20, lowerThird: 16, name: 18, label: 13 };

export class TimelinePlayer {
  runs: Run[] = [];
  /** the run that holds the camera when a timeline marks it exclusive */
  private cameraOwner: Run | null = null;
  /** per-unit draw offsets from move tracks, in field units */
  readonly offsets = new Map<number, { x: number; y: number }>();
  /** a zoom factor from camera zoom clips (1 = none) */
  zoom = 1;
  private imgs = new Map<string, HTMLImageElement>();
  constructor(private host: TimelineHost) {}

  start(e: { uid: number; skill: string; lv: number; to?: number; events: Record<string, number | number[]> }, now: number) {
    const tl = timelineFor(e.skill);
    if (!tl) return;
    // one timeline per caster: a new skill replaces the old one's remaining show
    this.runs = this.runs.filter((r) => r.uid !== e.uid);
    const events = { ...e.events, hits: [Number(e.events.contact)] };
    const run: Run = { tl, t0: now, uid: e.uid, to: e.to, skill: e.skill, lv: e.lv, events, prev: -1, cutAt: null, end: TL.duration(tl, TL.eventsOf(tl, events)) };
    this.runs.push(run);
  }
  hits(e: { uid: number; skill: string; hits: number[] }) {
    const r = this.runs.find((x) => x.uid === e.uid && x.skill === e.skill);
    if (!r) return;
    r.events.hits = e.hits;
    r.end = TL.duration(r.tl, TL.eventsOf(r.tl, r.events));
  }
  /** a timeline with gameFx 'replace' fires its skill's game effects itself, so the sim's own for that caster are skipped */
  replaces(from: number, fx: string) {
    return this.runs.some((r) => r.uid === from && r.tl.gameFx === 'replace' && (r.tl.tracks ?? []).some((t) => t.type === 'fx' && t.clips.some((c) => c.ref === 'game:' + fx)));
  }

  private opts(r: Run, busy: boolean, portrait: boolean): TL.Opts {
    const tier = r.tl.tier ?? 'skill';
    // the effect tiers (룰 R7): a basic skill never shakes or flashes; when several heroes cast at once, skills drop their extras too
    const drop = tier === 'basic' || busy ? [...(TL.TIER_DROP[tier] ?? [])] : [];
    if (r.tl.exclusive?.includes('camera') && this.cameraOwner && this.cameraOwner !== r) drop.push('camera');
    return { events: r.events, reduced: this.host.reduced, portrait, drop };
  }

  /** advance every run; one-shot clips (fx, sound, hit-stop) fire as their start passes */
  update(now: number, portrait: boolean) {
    this.offsets.clear();
    this.zoom = 1;
    const busy = this.runs.length > 2;
    for (const r of this.runs) {
      const ms = now - r.t0;
      // interrupted: the caster walked, swung or released something else
      if (r.cutAt == null) { const s = this.host.skillOf(r.uid); if (!s || s.id !== r.skill || s.at > r.t0 + 1) r.cutAt = ms; }
      if (r.tl.exclusive?.includes('camera') && !this.cameraOwner) this.cameraOwner = r;
      const o = this.opts(r, busy, portrait);
      for (const x of TL.crossed(r.tl, r.prev, ms, o, ['fx', 'sound', 'hitstop'])) {
        if (r.cutAt != null && x.start > r.cutAt && TL.interruptMode(x.track, x.clip) !== 'finish') continue;
        this.fire(r, x.track.type, x.clip as Record<string, any>, x.index);
      }
      for (const a of TL.activeClips(r.tl, ms, o)) {
        const k = this.keep(r, a, ms); if (!k) continue;
        if (a.track.type === 'camera') this.camera(a, k);
        if (a.track.type === 'move') this.move(r, a, k);
      }
      r.prev = ms;
    }
    this.runs = this.runs.filter((r) => now - r.t0 <= r.end + 50);
    if (this.cameraOwner && !this.runs.includes(this.cameraOwner)) this.cameraOwner = null;
  }

  /** how much of an active clip still shows (0 = gone): cut clips stop at the interruption, fade ones fade out */
  private keep(r: Run, a: Active, ms: number) {
    if (r.cutAt == null) return 1;
    const mode = TL.interruptMode(a.track, a.clip);
    if (mode === 'finish') return 1;
    if (mode === 'cut') return a.start <= r.cutAt && ms < r.cutAt ? 1 : 0;
    return Math.max(0, 1 - (ms - r.cutAt) / FADE_MS);
  }

  /** where an anchor is: caster / target(s), at mid-body (dy 0.5) or at the feet (dy 0, what the game's own effects expect) */
  private anchor(r: Run, name: unknown, dy = 0.5): { x: number; y: number }[] {
    const at = (uid: number | undefined) => { const p = uid != null ? this.host.pos(uid) : null; return p ? [{ x: p.x, y: p.y - p.h * dy }] : []; };
    return at(name === 'target' || name === 'targets' ? r.to ?? r.uid : r.uid);
  }
  private fire(r: Run, type: string, c: Record<string, any>, index: number) {
    if (type === 'sound' && typeof c.key === 'string') this.host.sound(c.key, c.vol, c.rate);
    if (type === 'hitstop') this.host.kick(0, 0, '#ffffff', c.dur ?? 60);
    if (type === 'fx' && typeof c.ref === 'string' && c.ref.startsWith('game:')) {
      const name = c.ref.slice(5);
      for (const p of this.anchor(r, c.anchor ?? 'target', 0)) this.host.fireFx(name, r.uid, r.to, p, { lv: r.lv, index, ...(c.params ?? {}) });
    }
  }
  private camera(a: Active, k: number) {
    const kind = a.clip.kind;
    if (kind === 'shake') this.host.shakeTo(Number(a.props.amp ?? 2) * k);
    if (kind === 'zoom') this.zoom *= 1 + (Number(a.props.value ?? 1) - 1) * k;
    // move and tilt: not on this field camera (tilt is optional by the format)
  }
  private move(r: Run, a: Active, k: number) {
    const uid = a.clip.actor === 'target' ? r.to ?? r.uid : r.uid;
    const mirror = a.clip.mirror === 'none' ? 1 : this.host.facing(r.uid);
    const o = this.offsets.get(uid) ?? { x: 0, y: 0 };
    o.x += Number(a.props.x ?? 0) * BODY * mirror * k; o.y += Number(a.props.y ?? 0) * BODY * k;
    this.offsets.set(uid, o);
  }

  /** field-space parts (local flashes), drawn with the camera transform after the field's own effects */
  drawField(ctx: CanvasRenderingContext2D, now: number, portrait: boolean) {
    const busy = this.runs.length > 2;
    for (const r of this.runs) for (const a of TL.activeClips(r.tl, now - r.t0, this.opts(r, busy, portrait))) {
      const k = this.keep(r, a, now - r.t0); if (!k || a.track.type !== 'flash' || a.clip.area === 'full') continue;
      for (const p of this.anchor(r, a.clip.anchor ?? 'caster')) {
        const op = Number(a.props.opacity ?? 0.5) * k, rad = Number(a.props.radius ?? 40);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, hexA(String(a.clip.color ?? '#ffffff'), op)); g.addColorStop(1, hexA(String(a.clip.color ?? '#ffffff'), 0));
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2); ctx.restore();
      }
    }
  }

  /** screen-space parts (dim, full flash, cut-in images, text), drawn in CSS px over the field */
  drawScreen(ctx: CanvasRenderingContext2D, now: number, W: number, H: number) {
    const portrait = H > W, busy = this.runs.length > 2;
    for (const r of this.runs) {
      const ref = (portrait && r.tl.stage?.portrait?.ref) || r.tl.stage?.ref || [W, H];
      const fit = r.tl.stage?.fit === 'cover' ? Math.max : Math.min;
      const s = fit(W / ref[0], H / ref[1]), ox = (W - ref[0] * s) / 2, oy = (H - ref[1] * s) / 2;
      const X = (v: number) => ox + v * ref[0] * s, Y = (v: number) => oy + v * ref[1] * s;
      for (const a of TL.activeClips(r.tl, now - r.t0, this.opts(r, busy, portrait))) {
        const k = this.keep(r, a, now - r.t0); if (!k) continue;
        const c = a.clip as Record<string, any>, op = Number(a.props.opacity ?? 1) * k;
        if (a.track.type === 'dim' || (a.track.type === 'flash' && c.area === 'full')) {
          ctx.fillStyle = hexA(String(c.color ?? (a.track.type === 'dim' ? '#000000' : '#ffffff')), Number(a.props.opacity ?? 0.4) * k);
          ctx.fillRect(0, 0, W, H);
        } else if (a.track.type === 'image') {
          const asset = r.tl.assets?.[String(c.asset)]; if (!asset) continue; const img = this.image(asset.file); if (!img.complete || !img.naturalWidth) continue;
          const sc = Number(a.props.scale ?? 1) * s, w = img.naturalWidth * sc, h = img.naturalHeight * sc, piv = asset.pivot ?? [0.5, 0.5];
          ctx.save(); ctx.globalAlpha = op; ctx.imageSmoothingEnabled = !asset.pixelated;
          ctx.translate(X(Number(a.props.x ?? 0.5)), Y(Number(a.props.y ?? 0.5))); ctx.rotate(Number(a.props.rotate ?? 0) * Math.PI / 180);
          ctx.drawImage(img, -w * piv[0], -h * piv[1], w, h); ctx.restore();
        } else if (a.track.type === 'text' && c.text) {
          const px = (STYLE_PX[String(c.style)] ?? 16) * Number(a.props.scale ?? 1) * Math.max(0.6, s);
          ctx.save(); ctx.globalAlpha = op; ctx.font = `700 ${px}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const tx = X(Number(a.props.x ?? 0.5)), ty = Y(Number(a.props.y ?? 0.8));
          ctx.lineWidth = Math.max(2, px / 7); ctx.strokeStyle = 'rgba(10,12,20,0.85)'; ctx.strokeText(String(c.text), tx, ty);
          ctx.fillStyle = '#fff6dc'; ctx.fillText(String(c.text), tx, ty); ctx.restore();
        }
      }
    }
  }

  private image(file: string) {
    let img = this.imgs.get(file);
    if (!img) {
      const url = IMAGES['../assets/timelines/' + file.replace(/^.*src\/assets\/timelines\//, '')];
      img = new Image(); if (url) img.src = url; this.imgs.set(file, img);
    }
    return img;
  }
}

function hexA(hex: string, a: number) {
  const h = hex.replace('#', ''), n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h.slice(0, 6);
  const v = parseInt(n, 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${Math.max(0, Math.min(1, a))})`;
}
