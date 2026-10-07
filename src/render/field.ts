// Field renderer: camera, y-sorted sprites, skill effects, damage numbers, lighting.
import type { World, FxEvent, HeroUnit, MobUnit, GroundItem, FieldChest } from '../game/world.ts';
import type { Element, Hero, GameState } from '../game/types.ts';
import { buildZoneArt, drawProp, kitPropBox, kitVersion, type ZoneArt, type Prop } from './bg.ts';
import { inked } from './ink.ts';
import { drawRigHero, rigBounds, rigSupports } from './rig.ts';

const REDUCED_MOTION = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
import { drawHero, drawFalcon, type HeroLookDraw, type Pose } from './hero.ts';
import { drawMob, mobHeight, mobShadow } from './monster.ts';
import { MELEE_CONTACT, BOW_RELEASE } from '../game/world.ts';
import { drawNumber, type DmgNum, warmFont } from './dmgfont.ts';
import { ELEMENT_COLOR } from '../game/data/elements.ts';
import { ITEMS } from '../game/data/items.ts';
import { MONSTERS } from '../game/data/monsters.ts';
import { findEquip } from '../game/stats.ts';
import { itemIcon } from './icons.ts';
import { rgba } from './color.ts';

interface Particle {
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  g: number; life: number; age: number; size: number; color: string;
  kind: 'glow' | 'spark' | 'star' | 'smoke' | 'shard' | 'feather' | 'coin' | 'leaf';
  add: boolean; rot: number; vr: number; drag: number;
}
interface Effect { t0: number; dur: number; layer: 'ground' | 'top'; draw: (ctx: CanvasRenderingContext2D, p: number, age: number) => void }
interface Shot { from: number; to: number; fx: number; fy: number; t0: number; dur: number; kind: string; element: Element; lastX: number; lastY: number }
interface Bubble { uid: number; text: string; color: string; t0: number; big?: boolean }
interface Smooth { x: number; y: number }

const glowCache = new Map<string, HTMLCanvasElement>();
function glow(color: string): HTMLCanvasElement {
  let c = glowCache.get(color);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, rgba(color, 0.95));
    g.addColorStop(0.5, rgba(color, 0.35));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    glowCache.set(color, c);
  }
  return c;
}

export const NPC_LOOKS: Record<string, HeroLookDraw> = {
  tool: { cls: 'merchant', gender: 'f', hair: 4, hairColor: 2, skin: 0, dye: 1, wtype: 'none', refine: 0, shield: false, headTop: 'bandana' },
  weapon: { cls: 'swordsman', gender: 'm', hair: 0, hairColor: 9, skin: 2, dye: 2, wtype: 'sword2h', refine: 7, shield: false, headLow: 'scarf' },
  armor: { cls: 'swordsman', gender: 'f', hair: 2, hairColor: 4, skin: 0, dye: 1, wtype: 'none', refine: 0, shield: true, headTop: 'helm' },
  refine: { cls: 'merchant', gender: 'm', hair: 5, hairColor: 3, skin: 3, dye: 0, wtype: 'mace', refine: 10, shield: false, headMid: 'goggles', headLow: 'pipe' },
  stylist: { cls: 'acolyte', gender: 'f', hair: 3, hairColor: 8, skin: 0, dye: 3, wtype: 'none', refine: 0, shield: false, headTop: 'ribbon', headMid: 'blush' },
  job: { cls: 'mage', gender: 'm', hair: 6, hairColor: 3, skin: 1, dye: 3, wtype: 'staff', refine: 0, shield: false, headTop: 'witch', headMid: 'glasses' },
};

export function heroLookDraw(s: GameState, h: Hero): HeroLookDraw {
  const eq = (slot: keyof Hero['equip']) => findEquip(s, h.equip[slot]);
  const cos = (slot: 'headTop' | 'headMid' | 'headLow' | 'garment') => findEquip(s, h.look.costume[slot]);
  const look = (slot: 'headTop' | 'headMid' | 'headLow') => {
    const c = cos(slot);
    if (c) return ITEMS[c.id].look;
    const e = eq(slot);
    if (!e) return undefined;
    const d = ITEMS[e.id];
    // a top+mid helm equipped into mid slot shouldn't double-draw
    if (slot !== 'headTop' && d.loc === 'headTop') return undefined;
    return d.look;
  };
  const w = eq('weapon');
  const wd = w ? ITEMS[w.id] : undefined;
  const g = cos('garment') ?? eq('garment');
  const gcolors: Record<string, string> = { g_hood: '#a89070', g_muffler: '#c84a4a', g_manteau: '#3a5aa0' };
  return {
    cls: h.cls, gender: h.look.gender, hair: h.look.hair, hairColor: h.look.hairColor, skin: h.look.skin, dye: h.look.dye,
    eyes: h.look.eyes, brows: h.look.brows, nose: h.look.nose, mouth: h.look.mouth,
    headTop: look('headTop'), headMid: look('headMid'), headLow: look('headLow'),
    wtype: wd?.wtype ?? 'none', weaponColor: wd?.icon.color, refine: w?.refine ?? 0,
    shield: !!eq('shield'),
    garment: g ? gcolors[g.id] ?? '#8a6a4a' : undefined,
    ammoColor: h.ammo ? ITEMS[h.ammo].icon.color : undefined,
  };
}

export class FieldRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  world: World;
  art: ZoneArt | null = null;
  artZone = '';
  cam = { x: 0, y: 0, zoom: 1 };
  cssW = 300; cssH = 300; dpr = 1;
  insetBottom = 84;
  /** management pages show the field as a small live band: frame the party (or the selected hero) and ignore taps */
  observe = false;
  /** hero id the observe camera falls back to when the party is too spread out to fit */
  focusHeroId = -1;
  /** heroes outside the band in the fallback framing (drawn as a small note) */
  offscreen = 0;
  private baseZoom = 1;
  shake = 0;
  flash = 0;
  flashColor = '#ffffff';
  /** climax hit-stop: the game loop holds the sim until then (ms, renderer clock) */
  hitstopUntil = 0;
  private kickAt = 0;

  /**
   * The one place for screen shake / flash / hit-stop, scaled to how often the event happens (quality guide §4):
   * decision = small capped shake with a cooldown, no flash; climax = shake + flash + a short freeze.
   * Frequent events (normal hits, crits, plain skills) stay local and never call this.
   */
  kick(tier: 'decision' | 'climax', shake: number, flash = 0, color = '#ffffff', stop = 0) {
    if (this.lowFx || REDUCED_MOTION) return;
    if (tier === 'decision') {
      if (this.now - this.kickAt < 600) return;
      this.kickAt = this.now;
      this.shake = Math.max(this.shake, Math.min(5, shake));
      return;
    }
    this.shake = Math.max(this.shake, shake);
    if (flash) { this.flash = Math.max(this.flash, flash); this.flashColor = color; }
    if (stop) this.hitstopUntil = Math.max(this.hitstopUntil, this.now + stop);
  }
  particles: Particle[] = [];
  effects: Effect[] = [];
  nums: (DmgNum & { uid: number; ox: number; oy: number })[] = [];
  shots: Shot[] = [];
  casts = new Map<number, { t0: number; dur: number; element: Element; name: string }>();
  bubbles: Bubble[] = [];
  smooth = new Map<number, Smooth>();
  dropVis = new Map<number, { t0: number; pickT?: number; to?: number }>();
  lowFx = false;
  showDamage = true;
  now = 0;
  lastFrame = 0;
  lookCache = new Map<number, { key: string; look: HeroLookDraw }>();
  onSound: (key: string) => void = () => {};
  onAnnounce: (text: string, kind: string) => void = () => {};
  onNpc: (npc: string) => void = () => {};
  onTapMob: (uid: number) => void = () => {};
  stateVersion = 0;

  constructor(canvas: HTMLCanvasElement, world: World) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.world = world;
    warmFont();
    canvas.addEventListener('pointerdown', (e) => this.onPointer(e));
  }

  /** 도트 모드: render at half a CSS pixel per canvas pixel and let the browser upscale without smoothing */
  pixelMode = false;

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return; // collapsed band: keep the last good buffer instead of a 0×0 canvas
    this.dpr = this.pixelMode ? 0.5 : Math.min(2.5, window.devicePixelRatio || 1);
    this.canvas.style.imageRendering = this.pixelMode ? 'pixelated' : '';
    this.cssW = r.width; this.cssH = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.baseZoom = Math.max(1, Math.min(2.1, Math.min(r.width / 330, r.height / 300)));
    if (!this.observe) this.cam.zoom = this.baseZoom;
  }

  private artKit = -1;
  private ensureArt() {
    const z = this.world.zone;
    if (this.artZone !== z.id || this.artKit !== kitVersion()) {
      const sameZone = this.artZone === z.id;
      this.art = buildZoneArt(z, this.dpr >= 1.5);
      this.artZone = z.id;
      this.artKit = kitVersion();
      if (sameZone) return; // painted kit arrived: swap the art, keep units/effects/camera
      this.particles = []; this.effects = []; this.nums = []; this.shots = []; this.casts.clear(); this.bubbles = [];
      this.smooth.clear(); this.dropVis.clear();
      const c = this.world.center();
      this.cam.x = c.x; this.cam.y = c.y;
    }
  }

  heroLook(h: HeroUnit): HeroLookDraw {
    const hero = h.hero;
    const key = JSON.stringify([hero.cls, hero.look, hero.equip, hero.ammo, this.stateVersion]);
    const c = this.lookCache.get(hero.id);
    if (c && c.key === key) return c.look;
    const look = heroLookDraw(this.world.s, hero);
    this.lookCache.set(hero.id, { key, look });
    return look;
  }

  // ───────── coordinates
  private viewW() { return this.cssW / this.cam.zoom; }
  private viewH() { return (this.cssH) / this.cam.zoom; }
  toScreen(x: number, y: number): [number, number] {
    return [(x - this.cam.x) * this.cam.zoom + this.cssW / 2, (y - this.cam.y) * this.cam.zoom + (this.cssH - this.insetBottom) / 2];
  }
  toWorld(sx: number, sy: number): [number, number] {
    return [(sx - this.cssW / 2) / this.cam.zoom + this.cam.x, (sy - (this.cssH - this.insetBottom) / 2) / this.cam.zoom + this.cam.y];
  }

  /** set by the UI while a detail (modal) is open */
  blockInput = false;
  private onPointer(e: PointerEvent) {
    if (this.observe || this.blockInput) return; // the band only watches; no focus-fire or NPC taps under a detail
    const r = this.canvas.getBoundingClientRect();
    const [wx, wy] = this.toWorld(e.clientX - r.left, e.clientY - r.top);
    if (this.world.zone.id === 'town' && this.art) {
      let best: Prop | null = null; let bd = 40;
      for (const p of this.art.props) if (p.kind === 'npc') { const d = Math.hypot(p.x - wx, p.y - 20 - wy); if (d < bd) { bd = d; best = p; } }
      if (best?.npc) { this.onNpc(best.npc); this.bubbles.push({ uid: -1, text: '어서 오세요!', color: '#fff', t0: this.now }); return; }
    }
    let best: MobUnit | null = null; let bd = 34;
    for (const m of this.world.mobs) {
      if (!this.world.alive(m)) continue;
      const h = mobHeight(m.m.sprite) * m.m.scale;
      const d = Math.hypot(m.x - wx, m.y - h / 2 - wy);
      if (d < bd + h * 0.3) { bd = d; best = m; }
    }
    if (best) { this.world.setFocus(best.uid); this.onTapMob(best.uid); this.onSound('click'); }
  }

  // ───────── events → visuals
  consume(events: FxEvent[]) {
    for (const e of events) this.handle(e);
    events.length = 0;
  }

  private pos(uid: number): { x: number; y: number; h: number } | null {
    const u = this.world.unit(uid);
    if (!u) return null;
    const sm = this.smooth.get(uid);
    const h = u.kind === 'mob' ? mobHeight(u.m.sprite) * u.m.scale : 48;
    return { x: sm?.x ?? u.x, y: sm?.y ?? u.y, h };
  }

  private handle(e: FxEvent) {
    const now = this.now;
    switch (e.t) {
      case 'sound': this.onSound(e.key); break;
      case 'dmg': {
        if (!this.showDamage && e.kind !== 'taken') break;
        const p = this.pos(e.uid);
        if (!p) break;
        const big = e.kind === 'crit' || e.kind === 'total';
        // stack numbers that land on the same target close together in time
        let recent = 0;
        for (const d of this.nums) if (d.uid === e.uid && now - d.t0 < 260) recent++;
        const side = recent % 2 ? 1 : -1;
        this.nums.push({
          uid: e.uid, x: p.x + side * Math.min(18, recent * 6), y: p.y - p.h - 4 - recent * 9 - (e.kind === 'total' ? 16 : 0), ox: 0, oy: 0,
          vx: (Math.random() - 0.5) * 18 + side * 10 + (e.kind === 'taken' ? -8 : 4), vy: big ? -120 : -95, t0: now, n: e.n, kind: e.kind, life: big ? 1250 : 1000,
        });
        if (this.nums.length > 90) this.nums.splice(0, this.nums.length - 90);
        break;
      }
      case 'hit': this.hitFx(e.uid, e.style, e.element, !!e.crit); break;
      case 'skill': this.skillFx(e); break;
      case 'cast': this.casts.set(e.uid, { t0: now, dur: e.dur, element: e.element, name: e.name }); break;
      case 'castEnd': this.casts.delete(e.uid); break;
      case 'shot': {
        const a = this.pos(e.from), b = this.pos(e.to);
        if (!a || !b) break;
        this.shots.push({ from: e.from, to: e.to, fx: a.x, fy: a.y - a.h * 0.55, t0: now, dur: e.dur, kind: e.kind, element: e.element, lastX: a.x, lastY: a.y });
        break;
      }
      case 'drop': this.dropVis.set(e.gid, { t0: now }); break;
      case 'pickup': {
        const d = this.dropVis.get(e.gid);
        if (d) { d.pickT = now; d.to = e.to; }
        // when the loot arrives at the hero, say what changed (bundled per hero so a pile reads as one line)
        this.later(380, () => this.lootTag(e.to, e.name, e.zeny));
        break;
      }
      case 'levelup': this.levelFx(e.uid, e.job); break;
      case 'die': {
        const p = this.pos(e.uid);
        if (!p) break;
        const u = this.world.unit(e.uid);
        if (u?.kind === 'mob') {
          this.burst(p.x, p.y - p.h * 0.4, 10, u.m.palette[0], 'smoke', 60, 0.8);
          if (u.m.boss || (u.danger && !u.vanish)) { this.kick('climax', 8, 0.3, '#ffffff', 120); this.burst(p.x, p.y - p.h * 0.5, 40, '#ffe080', 'star', 200, 1.4); }
        }
        break;
      }
      case 'spawn': {
        const p = this.pos(e.uid);
        if (p && !this.lowFx) this.burst(p.x, p.y - 8, 6, '#ffffff', 'glow', 30, 0.5);
        break;
      }
      case 'announce': this.onAnnounce(e.text, e.kind); break;
      case 'shake': this.kick(e.power >= 6 ? 'climax' : 'decision', e.power); break;
      case 'telegraph': {
        const { x, y, r, dur, color } = e;
        this.effects.push({
          t0: now, dur, layer: 'ground', draw: (ctx, p) => {
            ctx.save();
            ctx.globalAlpha = 0.35 + 0.25 * Math.sin(p * 30);
            ctx.fillStyle = rgba(color.length === 7 ? color : '#ff4040', 0.25);
            ctx.strokeStyle = color; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = rgba(color.length === 7 ? color : '#ff4040', 0.45);
            ctx.beginPath(); ctx.ellipse(x, y, r * p, r * 0.6 * p, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          },
        });
        break;
      }
      case 'buff': break;
      case 'status': this.bubbles.push({ uid: e.uid, text: e.text, color: e.color, t0: now }); break;
      case 'heal': {
        // potions heal: rising green, never the red of a hit
        const p = this.pos(e.uid);
        if (p) this.burst(p.x, p.y - 20, 6, '#8cff9a', 'glow', 26, 0.6, -40);
        break;
      }
    }
  }

  private pending: { at: number; fn: () => void }[] = [];
  /** run something a bit later on the renderer clock (works with stepped QA frames too) */
  private later(ms: number, fn: () => void) { this.pending.push({ at: this.now + ms, fn }); }

  private loot = new Map<number, { zeny: number; items: Map<string, number>; at: number }>();
  private lootTag(uid: number, name: string, zeny: number) {
    const b = this.loot.get(uid) ?? { zeny: 0, items: new Map<string, number>(), at: 0 };
    if (zeny) b.zeny += zeny; else b.items.set(name, (b.items.get(name) ?? 0) + 1);
    const flush = !b.at;
    b.at = this.now;
    this.loot.set(uid, b);
    if (!flush) return;
    // one quiet line a moment later: "+38z · 끈적한 점액 ×2 외 1"
    this.later(260, () => {
      const x = this.loot.get(uid);
      if (!x) return;
      this.loot.delete(uid);
      const parts: string[] = [];
      if (x.zeny) parts.push(`+${x.zeny.toLocaleString()}z`);
      const its = [...x.items];
      if (its.length) parts.push(`${its[0][0]}${its[0][1] > 1 ? ' ×' + its[0][1] : ''}${its.length > 1 ? ` 외 ${its.length - 1}` : ''}`);
      if (parts.length) this.bubbles.push({ uid, text: parts.join(' · '), color: x.zeny && !its.length ? '#ffd84a' : '#d8f4d0', t0: this.now });
    });
  }

  // ───────── particles
  private burst(x: number, y: number, n: number, color: string, kind: Particle['kind'], speed: number, life: number, vz = 0, add = true) {
    if (this.lowFx) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x, y, z: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 + vz + (kind === 'smoke' ? -20 : 0), vz: 0,
        g: kind === 'spark' || kind === 'coin' || kind === 'shard' ? 360 : kind === 'feather' || kind === 'leaf' ? 20 : 0,
        life: life * (0.6 + Math.random() * 0.6) * 1000, age: 0, size: kind === 'smoke' ? 6 + Math.random() * 6 : kind === 'glow' ? 8 + Math.random() * 8 : 2 + Math.random() * 2.5,
        color, kind, add: kind !== 'smoke' && kind !== 'coin' && kind !== 'feather' && kind !== 'leaf', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, drag: kind === 'smoke' ? 2 : 1,
      });
    }
    if (this.particles.length > 900) this.particles.splice(0, this.particles.length - 900);
  }

  private hitFx(uid: number, style: string, element: Element, crit: boolean) {
    const p = this.pos(uid);
    if (!p) return;
    const x = p.x + (Math.random() - 0.5) * 6, y = p.y - p.h * 0.5 + (Math.random() - 0.5) * 6;
    const now = this.now;
    const col = style === 'magic' ? ELEMENT_COLOR[element] : style === 'claw' ? '#ff5050' : element !== 'neutral' ? ELEMENT_COLOR[element] : '#ffffff';
    // crits are frequent: a local burst only (the crit star number carries the rest)
    if (crit) this.burst(x, y, 16, '#ffd060', 'spark', 220, 0.45);
    if (style === 'slash') {
      const ang = -0.6 + Math.random() * 0.4;
      this.effects.push({ t0: now, dur: 180, layer: 'top', draw: (ctx, q) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.globalAlpha = 1 - q; ctx.strokeStyle = col; ctx.lineWidth = 3.4 * (1 - q) + 0.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(-6, 8, 16, -1.6, -1.6 + Math.PI * 0.7 * Math.min(1, q * 3)); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      } });
      this.burst(x, y, 4, col, 'spark', 120, 0.3);
    } else if (style === 'blunt' || style === 'pierce') {
      const big = style === 'blunt' ? 1 : 0.7;
      this.effects.push({ t0: now, dur: 160, layer: 'top', draw: (ctx, q) => {
        ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 1 - q;
        const r = (8 + q * 10) * big * (crit ? 1.6 : 1);
        ctx.beginPath();
        for (let i = 0; i < 16; i++) { const rr = i % 2 ? r * 0.35 : r; const a = i / 16 * Math.PI * 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fillStyle = crit ? '#fff2a0' : '#ffffff'; ctx.fill();
        ctx.restore();
      } });
      this.burst(x, y, 4, col, 'spark', 140, 0.3);
    } else if (style === 'magic') {
      this.burst(x, y, 10, col, 'glow', 90, 0.5);
    } else if (style === 'claw') {
      this.effects.push({ t0: now, dur: 220, layer: 'top', draw: (ctx, q) => {
        ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 1 - q; ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (const o of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(-8 + o, -8); ctx.lineTo(-8 + o + 14 * Math.min(1, q * 4), 6); ctx.stroke(); }
        ctx.restore();
      } });
    }
  }

  private levelFx(uid: number, job: boolean) {
    const p = this.pos(uid);
    if (!p) return;
    const now = this.now;
    const col = job ? '#7ad0ff' : '#ffd84a';
    this.effects.push({ t0: now, dur: 1800, layer: 'top', draw: (ctx, q, age) => {
      const pp = this.pos(uid) ?? p;
      ctx.save(); ctx.translate(pp.x, pp.y);
      ctx.globalCompositeOperation = 'lighter';
      // light column
      const a = q < 0.2 ? q / 0.2 : 1 - (q - 0.2) / 0.8;
      const g = ctx.createLinearGradient(0, -110, 0, 0);
      g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.6, rgba(col, 0.35 * a)); g.addColorStop(1, rgba(col, 0.6 * a));
      ctx.fillStyle = g; ctx.fillRect(-14, -110, 28, 110);
      // rings rising
      for (let i = 0; i < 3; i++) {
        const rq = ((age / 700) + i / 3) % 1;
        ctx.globalAlpha = a * (1 - rq);
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, -rq * 70, 16 + rq * 6, 5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // wings
      ctx.globalAlpha = a;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 8, -66); ctx.scale(s, 1); ctx.rotate(-0.4 + Math.sin(age / 120) * 0.15);
        ctx.fillStyle = rgba('#ffffff', 0.85);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(10, -18, 26, -16, 28, -8); ctx.quadraticCurveTo(20, -6, 22, 0); ctx.quadraticCurveTo(14, 0, 14, 4); ctx.quadraticCurveTo(7, 2, 0, 4); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    } });
    this.bubbles.push({ uid, text: job ? 'JOB LEVEL UP' : 'LEVEL UP', color: col, t0: now, big: true });
    this.burst(p.x, p.y - 30, 26, col, 'star', 120, 1.2, -60);
  }

  private skillFx(e: Extract<FxEvent, { t: 'skill' }>) {
    const now = this.now;
    const { x, y } = e;
    const el = e.element ?? 'neutral';
    const col = ELEMENT_COLOR[el];
    const tgt = e.to !== undefined ? this.pos(e.to) : null;
    const ty = tgt ? tgt.y - tgt.h * 0.5 : y - 16;
    const add = (dur: number, layer: Effect['layer'], draw: Effect['draw']) => this.effects.push({ t0: now, dur, layer, draw });
    switch (e.fx) {
      case 'bash': {
        add(260, 'top', (ctx, q) => {
          ctx.save(); ctx.translate(x, ty); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - q;
          ctx.drawImage(glow('#ffb040'), -30 - q * 20, -30 - q * 20, 60 + q * 40, 60 + q * 40);
          ctx.restore();
        });
        this.burst(x, ty, 14, '#ffc060', 'spark', 220, 0.5);
        break;
      }
      case 'magnum': {
        const r = e.radius ?? 70;
        add(600, 'ground', (ctx, q) => {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - q;
          ctx.strokeStyle = '#ff7030'; ctx.lineWidth = 10 * (1 - q) + 2;
          ctx.beginPath(); ctx.ellipse(x, y, r * (0.3 + q * 0.8), r * 0.6 * (0.3 + q * 0.8), 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        });
        for (let i = 0; i < (this.lowFx ? 8 : 24); i++) {
          const a = i / 24 * Math.PI * 2;
          this.particles.push({ x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 6 - 6, z: 0, vx: Math.cos(a) * 160, vy: Math.sin(a) * 100 - 30, vz: 0, g: 0, life: 500, age: 0, size: 10, color: '#ff6020', kind: 'glow', add: true, rot: 0, vr: 0, drag: 2.5 });
        }
        break;
      }
      case 'provoke': {
        add(500, 'ground', (ctx, q) => {
          ctx.save(); ctx.globalAlpha = 1 - q; ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(x, y, (e.radius ?? 100) * q, (e.radius ?? 100) * 0.6 * q, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        });
        break;
      }
      case 'endure': case 'conc': case 'angelus': case 'blessing': case 'agi':
      case 'quicken': case 'amp': case 'poisonbuff': case 'adrenaline': case 'kyrie': {
        const AURA: Record<string, string> = { endure: '#ffcf60', conc: '#90ff90', agi: '#80f0ff', quicken: '#ffd84a', amp: '#d080ff', poisonbuff: '#b060e0', adrenaline: '#ff6a3a', kyrie: '#9fe0ff' };
        const c2 = AURA[e.fx] ?? '#ffffff';
        const uid = e.to ?? e.from;
        add(900, 'top', (ctx, q, age) => {
          const pp = this.pos(uid); if (!pp) return;
          ctx.save(); ctx.translate(pp.x, pp.y); ctx.globalCompositeOperation = 'lighter';
          const a = q < 0.2 ? q / 0.2 : 1 - (q - 0.2) / 0.8;
          ctx.globalAlpha = a;
          if (e.fx === 'angelus') {
            ctx.strokeStyle = '#fffbe0'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(0, -60 + q * 6, 12, 4, 0, 0, Math.PI * 2); ctx.stroke();
          }
          if (e.fx === 'agi') {
            for (let i = 0; i < 3; i++) { const rr = ((age / 400) + i / 3) % 1; ctx.strokeStyle = rgba(c2, 1 - rr); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -rr * 30, 14, 5, 0, 0, Math.PI * 2); ctx.stroke(); }
          } else {
            const g = ctx.createLinearGradient(0, -90, 0, 0); g.addColorStop(0, rgba(c2, 0)); g.addColorStop(1, rgba(c2, 0.5));
            ctx.fillStyle = g; ctx.fillRect(-12, -90, 24, 90);
          }
          ctx.restore();
        });
        const pp = this.pos(uid);
        if (pp) {
          if (e.fx === 'blessing') for (let i = 0; i < (this.lowFx ? 3 : 8); i++) this.particles.push({ x: pp.x + (Math.random() - 0.5) * 30, y: pp.y - 70 - Math.random() * 30, z: 0, vx: (Math.random() - 0.5) * 10, vy: 30, vz: 0, g: 0, life: 1200, age: 0, size: 3, color: '#ffffff', kind: 'feather', add: false, rot: Math.random() * 6, vr: 2, drag: 0 });
          else this.burst(pp.x, pp.y - 20, 10, c2, 'star', 60, 0.9, -50);
        }
        break;
      }
      case 'firebolt': case 'coldbolt': case 'lightning': case 'holy': {
        const hits = e.hits ?? 1;
        for (let i = 0; i < hits; i++) {
          const t0 = now + i * 150;
          const ox = (Math.random() - 0.5) * 14;
          this.effects.push({ t0, dur: 260, layer: 'top', draw: (ctx, q) => {
            const pp = (e.to !== undefined && this.pos(e.to)) || { x, y, h: 20 };
            const bx = pp.x + ox, by = pp.y - pp.h * 0.4;
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            if (e.fx === 'lightning') {
              ctx.globalAlpha = 1 - q;
              ctx.strokeStyle = '#fff8a0'; ctx.lineWidth = 3;
              ctx.beginPath(); let lx = bx, ly = by - 120; ctx.moveTo(lx, ly);
              for (let k = 0; k < 6; k++) { lx = bx + (Math.random() - 0.5) * 16; ly += 20; ctx.lineTo(lx, ly); }
              ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
              ctx.drawImage(glow('#ffe45a'), bx - 26, by - 26, 52, 52);
            } else if (e.fx === 'holy') {
              ctx.globalAlpha = 1 - q;
              const g = ctx.createLinearGradient(bx, by - 140, bx, by); g.addColorStop(0, 'rgba(255,255,220,0)'); g.addColorStop(1, 'rgba(255,250,200,0.9)');
              ctx.fillStyle = g; ctx.fillRect(bx - 9 * (1 - q * 0.5), by - 140, 18 * (1 - q * 0.5), 140);
              ctx.drawImage(glow('#fff3a0'), bx - 30, by - 30, 60, 60);
            } else {
              const fall = Math.min(1, q * 2.2);
              const cy = by - 110 * (1 - fall);
              const c2 = e.fx === 'firebolt' ? '#ff6a30' : '#7ad8ff';
              if (fall < 1) {
                ctx.strokeStyle = rgba(c2, 0.8); ctx.lineWidth = 6; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(bx + 18 * (1 - fall) + 6, cy - 30); ctx.lineTo(bx + 18 * (1 - fall), cy); ctx.stroke();
                ctx.drawImage(glow(c2), bx + 18 * (1 - fall) - 14, cy - 14, 28, 28);
              } else {
                ctx.globalAlpha = 1 - (q - 0.45) / 0.55;
                ctx.drawImage(glow(c2), bx - 26, by - 26, 52, 52);
              }
            }
            ctx.restore();
          } });
        }

        if (tgt) this.burst(tgt.x, ty, 10, col, e.fx === 'coldbolt' ? 'shard' : 'glow', 100, 0.6);
        break;
      }
      case 'soul': case 'jupitel': {
        const hits = e.hits ?? 1;
        const orb = e.fx === 'jupitel' ? '#7ad8ff' : '#9fe8ff';
        const from = this.pos(e.from);
        if (!from) break;
        for (let i = 0; i < hits; i++) {
          this.effects.push({ t0: now + i * 150, dur: 180, layer: 'top', draw: (ctx, q) => {
            const b = (e.to !== undefined && this.pos(e.to)) || { x, y, h: 20 };
            const px = from.x + (b.x - from.x) * q, py = from.y - 30 + (b.y - b.h * 0.5 - from.y + 30) * q - Math.sin(q * Math.PI) * (20 + i * 8);
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            ctx.drawImage(glow(orb), px - 12, py - 12, 24, 24);
            ctx.restore();
          } });
        }
        break;
      }
      case 'frost': {
        if (tgt) this.burst(tgt.x, tgt.y - 6, 18, '#bff0ff', 'shard', 140, 0.7);
        add(400, 'ground', (ctx, q) => {
          ctx.save(); ctx.globalAlpha = 1 - q; ctx.fillStyle = 'rgba(190,240,255,0.5)';
          for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 6, y + Math.sin(a) * 3); ctx.lineTo(x + Math.cos(a) * 30 * q, y + Math.sin(a) * 18 * q - 8); ctx.lineTo(x + Math.cos(a + 0.2) * 8, y + Math.sin(a + 0.2) * 4); ctx.fill(); }
          ctx.restore();
        });
        break;
      }
      case 'fireball': case 'storm': case 'shower': case 'cart': case 'slam': case 'darkslam': case 'roots':
      case 'bowling': case 'brandish': case 'hammer': case 'trap': case 'meteor': case 'gust': case 'lov': case 'magnus': case 'grimtooth': {
        const r = e.radius ?? 60;
        const AC: Record<string, string> = { fireball: '#ff7030', storm: '#ffe45a', lov: '#ffe45a', darkslam: '#a060ff', roots: '#90c050', slam: '#ff9050', meteor: '#ff5a2a', trap: '#ff7a3a', gust: '#9fe8ff', magnus: '#fff3a0', grimtooth: '#8a5ad0', bowling: '#ffcf80', brandish: '#bfe0ff', hammer: '#e0c080' };
        const c2 = AC[e.fx] ?? '#e0c080';
        const hits = e.hits ?? 1;
        if (e.fx === 'meteor') {
          for (let i = 0; i < hits; i++) {
            const bx = x + (Math.random() - 0.5) * r * 1.2, by = y + (Math.random() - 0.5) * r * 0.7;
            this.effects.push({ t0: now + i * 180, dur: 420, layer: 'top', draw: (ctx, q) => {
              ctx.save(); ctx.globalCompositeOperation = 'lighter';
              const fall = Math.min(1, q * 1.8);
              if (fall < 1) {
                const mx = bx + 60 * (1 - fall), my = by - 160 * (1 - fall);
                ctx.strokeStyle = 'rgba(255,140,60,0.7)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(mx + 26, my - 60); ctx.lineTo(mx, my); ctx.stroke();
                ctx.drawImage(glow('#ff8a3a'), mx - 22, my - 22, 44, 44);
              } else {
                ctx.globalAlpha = 1 - (q - 0.55) / 0.45;
                ctx.drawImage(glow('#ff5a2a'), bx - r * 0.6, by - r * 0.4, r * 1.2, r * 0.8);
              }
              ctx.restore();
            } });
            this.later(i * 180 + 230, () => { this.burst(bx, by - 8, 14, '#ff7a3a', 'glow', 150, 0.6, -40); this.kick('decision', 4); this.onSound('fire'); });
          }
        } else if (e.fx === 'gust') {
          for (let i = 0; i < (this.lowFx ? 14 : 40); i++) {
            const a0 = Math.random() * Math.PI * 2, rr = Math.random() * r;
            this.particles.push({ x: x + Math.cos(a0) * rr, y: y + Math.sin(a0) * rr * 0.6 - 20, z: 0, vx: 80 + Math.random() * 60, vy: 30 + Math.random() * 40, vz: 0, g: 0, life: 900 + Math.random() * 600, age: 0, size: 2 + Math.random() * 2, color: '#e8f8ff', kind: 'shard', add: true, rot: Math.random() * 6, vr: 6, drag: 0.5 });
          }
          add(1100, 'ground', (ctx, q) => {
            ctx.save(); ctx.globalAlpha = (1 - q) * 0.55; ctx.fillStyle = 'rgba(210,240,255,0.6)';
            ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          });
        } else if (e.fx === 'magnus') {
          for (let i = 0; i < hits * 2; i++) {
            const bx = x + (Math.random() - 0.5) * r * 1.4, by = y + (Math.random() - 0.5) * r * 0.8;
            this.effects.push({ t0: now + i * 110, dur: 500, layer: 'top', draw: (ctx, q) => {
              ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = q < 0.2 ? q / 0.2 : 1 - (q - 0.2) / 0.8;
              const g = ctx.createLinearGradient(bx, by - 120, bx, by); g.addColorStop(0, 'rgba(255,250,200,0)'); g.addColorStop(1, 'rgba(255,250,210,0.85)');
              ctx.fillStyle = g; ctx.fillRect(bx - 4, by - 120, 8, 120); ctx.fillRect(bx - 14, by - 92, 28, 7);
              ctx.restore();
            } });
          }
        } else if (e.fx === 'storm' || e.fx === 'lov') {
          const n = e.fx === 'lov' ? hits * 4 : hits * 2;
          for (let i = 0; i < n; i++) {
            const t0 = now + i * (e.fx === 'lov' ? 60 : 90);
            const bx = x + (Math.random() - 0.5) * r * 1.6, by = y + (Math.random() - 0.5) * r;
            this.effects.push({ t0, dur: 200, layer: 'top', draw: (ctx, q) => {
              ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - q;
              ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 2.4; ctx.beginPath(); let lx = bx, ly = by - 130; ctx.moveTo(lx, ly);
              for (let k = 0; k < 6; k++) { lx = bx + (Math.random() - 0.5) * 18; ly += 22; ctx.lineTo(lx, ly); } ctx.stroke();
              ctx.drawImage(glow('#ffe45a'), bx - 20, by - 20, 40, 40);
              ctx.restore();
            } });
          }

        } else if (e.fx === 'grimtooth') {
          for (let i = 0; i < 7; i++) {
            const a = i / 7 * Math.PI * 2, rr = r * (0.2 + Math.random() * 0.6);
            const bx = x + Math.cos(a) * rr, by = y + Math.sin(a) * rr * 0.6;
            this.effects.push({ t0: now + i * 25, dur: 380, layer: 'top', draw: (ctx, q) => {
              const hh = Math.sin(Math.min(1, q * 1.6) * Math.PI) * 22;
              ctx.save(); ctx.fillStyle = '#3a2a4a'; ctx.strokeStyle = '#c0a0ff'; ctx.lineWidth = 0.8;
              ctx.beginPath(); ctx.moveTo(bx - 3, by); ctx.lineTo(bx, by - hh); ctx.lineTo(bx + 3, by); ctx.closePath(); ctx.fill(); ctx.stroke();
              ctx.restore();
            } });
          }
        } else if (e.fx === 'shower') {
          for (let i = 0; i < (this.lowFx ? 6 : 16); i++) {
            const bx = x + (Math.random() - 0.5) * r * 1.6, by = y + (Math.random() - 0.5) * r;
            this.effects.push({ t0: now + Math.random() * 200, dur: 220, layer: 'top', draw: (ctx, q) => {
              ctx.save(); ctx.strokeStyle = '#f0e0c0'; ctx.lineWidth = 1.6; ctx.globalAlpha = q < 0.8 ? 1 : (1 - q) * 5;
              const cy = by - 80 * (1 - q);
              ctx.beginPath(); ctx.moveTo(bx + 20 * (1 - q) + 6, cy - 12); ctx.lineTo(bx + 20 * (1 - q), cy); ctx.stroke(); ctx.restore();
            } });
          }
        } else if (e.fx === 'roots') {
          for (let i = 0; i < 9; i++) {
            const a = i / 9 * Math.PI * 2, rr = r * (0.3 + Math.random() * 0.6);
            const bx = x + Math.cos(a) * rr, by = y + Math.sin(a) * rr * 0.6;
            this.effects.push({ t0: now + i * 30, dur: 700, layer: 'top', draw: (ctx, q) => {
              const h = Math.sin(Math.min(1, q * 1.5) * Math.PI) * 26;
              ctx.save(); ctx.fillStyle = '#6a4a2a'; ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(bx - 4, by); ctx.quadraticCurveTo(bx - 2, by - h * 0.6, bx + 1, by - h); ctx.quadraticCurveTo(bx + 2, by - h * 0.5, bx + 4, by); ctx.closePath(); ctx.fill(); ctx.stroke();
              ctx.restore();
            } });
          }
        }
        add(e.fx === 'fireball' ? 520 : 450, 'ground', (ctx, q) => {
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - q) * 0.9;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r * (0.5 + q * 0.6));
          g.addColorStop(0, rgba(c2, 0.7)); g.addColorStop(0.7, rgba(c2, 0.25)); g.addColorStop(1, rgba(c2, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r * (0.5 + q * 0.6), r * 0.6 * (0.5 + q * 0.6), 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = rgba(c2, 1 - q); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, r * q, r * 0.6 * q, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        });
        if (e.fx === 'fireball') { this.burst(x, y - 10, 24, '#ff7030', 'glow', 160, 0.6, -40); this.kick('decision', 2); }
        if (e.fx === 'cart') this.burst(x, y, 16, '#c8b090', 'smoke', 120, 0.6);
        if (e.fx === 'slam' || e.fx === 'darkslam') this.burst(x, y, 20, e.fx === 'darkslam' ? '#a060ff' : '#c0a080', 'smoke', 160, 0.7);
        break;
      }
      case 'heal': case 'revive': {
        const uid = e.to ?? e.from;
        add(e.fx === 'revive' ? 1200 : 800, 'top', (ctx, q, age) => {
          const pp = this.pos(uid); if (!pp) return;
          ctx.save(); ctx.translate(pp.x, pp.y); ctx.globalCompositeOperation = 'lighter';
          const a = q < 0.15 ? q / 0.15 : 1 - (q - 0.15) / 0.85;
          const c2 = e.fx === 'revive' ? '#ffe080' : '#9affb0';
          const g = ctx.createLinearGradient(0, -80, 0, 0); g.addColorStop(0, rgba(c2, 0)); g.addColorStop(1, rgba(c2, 0.55 * a));
          ctx.fillStyle = g; ctx.fillRect(-11, -80, 22, 80);
          ctx.globalAlpha = a;
          for (let i = 0; i < 4; i++) {
            const rq = ((age / 500) + i / 4) % 1;
            const cx = Math.sin(i * 2.3) * 10, cy = -10 - rq * 60;
            ctx.fillStyle = rgba('#ffffff', 1 - rq);
            ctx.fillRect(cx - 0.8, cy - 3, 1.6, 6); ctx.fillRect(cx - 3, cy - 0.8, 6, 1.6);
          }
          ctx.restore();
        });
        break;
      }
      case 'envenom': case 'sand': case 'mammonite': {
        const c2 = e.fx === 'envenom' ? '#b060e0' : e.fx === 'sand' ? '#d8b070' : '#ffd24a';
        this.burst(x, ty, e.fx === 'mammonite' ? 14 : 12, c2, e.fx === 'mammonite' ? 'coin' : e.fx === 'sand' ? 'smoke' : 'glow', 140, 0.6, -60);
        break;
      }
      case 'summon': this.burst(x, y - 10, 20, '#a080c0', 'smoke', 100, 0.9); break;
      case 'pierce': case 'sonic': {
        const n = e.fx === 'sonic' ? 8 : 3;
        for (let i = 0; i < n; i++) {
          const ang = e.fx === 'sonic' ? (i % 2 ? 0.8 : -0.8) + (Math.random() - 0.5) * 0.5 : -0.1 + (Math.random() - 0.5) * 0.2;
          this.effects.push({ t0: now + i * (e.fx === 'sonic' ? 70 : 120), dur: 200, layer: 'top', draw: (ctx, q) => {
            const pp = (e.to !== undefined && this.pos(e.to)) || { x, y, h: 20 };
            ctx.save(); ctx.translate(pp.x, pp.y - pp.h * 0.5); ctx.rotate(ang);
            ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - q;
            ctx.strokeStyle = e.fx === 'sonic' ? '#ff9ac0' : '#bfe0ff'; ctx.lineWidth = 3 * (1 - q) + 0.6; ctx.lineCap = 'round';
            const L = e.fx === 'sonic' ? 22 : 30;
            ctx.beginPath(); ctx.moveTo(-L * (1 - q * 0.3), 0); ctx.lineTo(L, 0); ctx.stroke();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore();
          } });
        }
        break;
      }
      case 'snare': {
        add(900, 'ground', (ctx, q) => {
          const pp = (e.to !== undefined && this.pos(e.to)) || { x, y, h: 20 };
          ctx.save(); ctx.globalAlpha = 1 - q * 0.6; ctx.strokeStyle = '#8ac060'; ctx.lineWidth = 2;
          for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + q; ctx.beginPath(); ctx.moveTo(pp.x + Math.cos(a) * 16, pp.y + Math.sin(a) * 6); ctx.lineTo(pp.x + Math.cos(a) * 5, pp.y + Math.sin(a) * 2 - 6); ctx.stroke(); }
          ctx.beginPath(); ctx.ellipse(pp.x, pp.y, 16, 6, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        });
        break;
      }
      case 'strafe': break;
    }
  }

  // ───────── frame
  private snapNext = true;
  private lastFocus = -1;
  /** each hero's pose as last drawn, so the observe camera can ask for the real painted bounds */
  private lastPose = new Map<number, Pose>();
  private deadSeen = new Set<number>();
  /** jump the observe camera to its target on the next frame (entering a page, switching hero) */
  snapCamera() { this.snapNext = true; }

  /** fit the living heroes plus the selected one (even if it lies dead far away) head-to-feet inside the band with an
   *  8px margin; if that needs a zoom below 0.75, fit the selected hero alone. Entering the band, a new selection or a
   *  revive jumps straight there so nobody starts cut off. No map-edge clamp here, so nobody gets cut at the border. */
  private observeCamera(dt: number) {
    const w = this.world;
    if (!w.heroes.length) return;
    const box = (list: HeroUnit[]) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const h of list) {
        const sm = this.smooth.get(h.uid) ?? h;
        // painted heroes: the pixels this pose really covers (lying body, ponytail, raised sword); the code-drawn hero:
        // a conservative figure box. Either way the name tag and bars below the feet are kept in view
        const pose = this.lastPose.get(h.uid);
        const r = pose ? rigBounds(this.heroLook(h), pose) : null;
        const lying = h.state === 'dead';
        const b = r ?? { x0: lying ? -40 : -26, x1: lying ? 40 : 26, y0: lying ? -36 : -96, y1: 0 };
        x0 = Math.min(x0, sm.x + b.x0 - 2); x1 = Math.max(x1, sm.x + b.x1 + 2);
        y0 = Math.min(y0, sm.y + b.y0 - 2); y1 = Math.max(y1, sm.y + Math.max(b.y1, 24));
      }
      return { x0, y0, x1, y1 };
    };
    const fit = (b: { x0: number; y0: number; x1: number; y1: number }) => Math.min((this.cssW - 16) / (b.x1 - b.x0), (this.cssH - 16) / (b.y1 - b.y0));
    const me = w.heroes.find((h) => h.hero.id === this.focusHeroId) ?? w.heroes[0];
    if (this.focusHeroId !== this.lastFocus) { this.lastFocus = this.focusHeroId; this.snapNext = true; }
    for (const h of w.heroes) {
      if (h.state === 'dead') this.deadSeen.add(h.uid);
      else if (this.deadSeen.delete(h.uid)) this.snapNext = true; // just revived
    }
    const group = [...new Set([...w.heroes.filter((h) => h.state !== 'dead'), me])];
    let b = box(group), z = fit(b);
    if (z < 0.75) { b = box([me]); z = fit(b); }
    z = Math.min(z, 2.1);
    const snap = this.snapNext || Math.abs(this.cam.zoom - z) > 1.2;
    this.snapNext = false;
    const k = snap ? 1 : 1 - Math.exp(-dt / 220);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    // ease in, but never closer than the fit and never so far off that the framed box leaves the band
    this.cam.zoom = Math.min(z, this.cam.zoom + (z - this.cam.zoom) * k);
    this.cam.x += (cx - this.cam.x) * k;
    this.cam.y += (cy - this.cam.y) * k;
    const m = 8 / this.cam.zoom, hw = this.cssW / this.cam.zoom / 2, hh = this.cssH / this.cam.zoom / 2;
    this.cam.x = Math.min(Math.max(this.cam.x, b.x1 - hw + m), b.x0 + hw - m);
    this.cam.y = Math.min(Math.max(this.cam.y, b.y1 - hh + m), b.y0 + hh - m);
    // who is wholly outside the band as drawn this frame (same boxes and rendered positions as the framing)
    this.offscreen = w.heroes.filter((h) => {
      if (h === me || h.state === 'dead') return false;
      const o = box([h]);
      return o.x1 < this.cam.x - hw || o.x0 > this.cam.x + hw || o.y1 < this.cam.y - hh || o.y0 > this.cam.y + hh;
    }).length;
  }

  frame(nowMs: number) {
    const dt = this.lastFrame ? Math.max(0, Math.min(100, nowMs - this.lastFrame)) : 16;
    this.lastFrame = Math.max(this.lastFrame, nowMs);
    this.now = Math.max(this.now, nowMs);
    nowMs = this.now;
    this.ensureArt();
    if (this.pending.length) {
      const due = this.pending.filter((p) => p.at <= nowMs);
      this.pending = this.pending.filter((p) => p.at > nowMs);
      for (const p of due) p.fn();
    }
    this.consume(this.world.events);
    const ctx = this.ctx;
    const w = this.world;
    const art = this.art!;
    // smoothing
    const k = 1 - Math.exp(-dt / 45);
    const live = new Set<number>();
    for (const u of [...w.heroes, ...w.mobs]) {
      live.add(u.uid);
      const sm = this.smooth.get(u.uid);
      if (!sm || Math.hypot(sm.x - u.x, sm.y - u.y) > 120) this.smooth.set(u.uid, { x: u.x, y: u.y });
      else { sm.x += (u.x - sm.x) * k; sm.y += (u.y - sm.y) * k; }
    }
    for (const id of this.smooth.keys()) if (!live.has(id)) this.smooth.delete(id);

    // camera
    const ck = 1 - Math.exp(-dt / 350);
    if (this.observe) this.observeCamera(dt);
    else {
      const c = w.center();
      this.cam.zoom += (this.baseZoom - this.cam.zoom) * (1 - Math.exp(-dt / 160));
      this.cam.x += (c.x - this.cam.x) * ck;
      this.cam.y += (c.y - 10 - this.cam.y) * ck;
      const vw = this.viewW(), vh = (this.cssH - this.insetBottom) / this.cam.zoom;
      this.cam.x = Math.max(vw / 2, Math.min(w.zone.w - vw / 2, this.cam.x));
      this.cam.y = Math.max(vh / 2, Math.min(w.zone.h - vh / 2 + this.insetBottom / this.cam.zoom * 0.0, this.cam.y));
      if (vw >= w.zone.w) this.cam.x = w.zone.w / 2;
    }

    let sx = 0, sy = 0;
    if (this.shake > 0.1) { sx = (Math.random() - 0.5) * this.shake; sy = (Math.random() - 0.5) * this.shake; this.shake *= Math.pow(0.001, dt / 1000); } else this.shake = 0;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = art.theme === 'cave' ? '#1a1416' : art.theme === 'forest' ? '#2a4a22' : art.theme === 'desert' ? '#b89058' : art.theme === 'snow' ? '#b8cce0' : '#5a8a40';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const z = this.cam.zoom * this.dpr;
    const ox = this.cssW / 2 * this.dpr - this.cam.x * z + sx * this.dpr;
    const oy = (this.cssH - this.insetBottom) / 2 * this.dpr - this.cam.y * z + sy * this.dpr;
    ctx.setTransform(z, 0, 0, z, ox, oy);
    // ground (visible region only)
    const x0 = Math.max(0, this.cam.x - this.viewW() / 2 - 20), y0 = Math.max(0, this.cam.y - this.viewH() - 20);
    const x1 = Math.min(w.zone.w, this.cam.x + this.viewW() / 2 + 20), y1 = Math.min(w.zone.h, this.cam.y + this.viewH() + 20);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(art.ground, x0 * art.scale, y0 * art.scale, (x1 - x0) * art.scale, (y1 - y0) * art.scale, x0, y0, x1 - x0, y1 - y0);

    // ground effects + cast circles + focus marker
    this.runEffects(ctx, 'ground');
    for (const [uid, cst] of this.casts) {
      const p = this.pos(uid);
      if (!p) { this.casts.delete(uid); continue; }
      this.magicCircle(ctx, p.x, p.y, cst.element, (nowMs - cst.t0) / Math.max(1, cst.dur), nowMs);
    }
    if (w.focus !== null) {
      const p = this.pos(w.focus);
      if (p) {
        ctx.save(); ctx.strokeStyle = 'rgba(255,80,80,0.9)'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -nowMs / 50;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 16, 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }

    // drops on the ground
    const drawables: { y: number; draw: () => void }[] = [];
    const vxMin = this.cam.x - this.viewW() / 2 - 80, vxMax = this.cam.x + this.viewW() / 2 + 80;
    const units = [...w.heroes, ...w.mobs.filter((m) => m.m.boss)];
    for (const p of art.props) {
      if (p.x < vxMin || p.x > vxMax) continue;
      const tall = p.kind === 'tree' || p.kind === 'pine' || p.kind === 'house' || p.kind === 'stalag' || p.kind === 'pillar' || p.kind === 'snowpine' || p.kind === 'palm' || p.kind === 'ruin';
      let fade = false;
      if (tall) {
        const kb = kitPropBox(p);
        const r = kb ? kb.r : (p.kind === 'house' ? 56 : 30) * p.s, hgt = kb ? kb.h : (p.kind === 'pine' ? 100 : p.kind === 'house' ? 100 : 80) * p.s;
        for (const u of units) {
          const sm = this.smooth.get(u.uid);
          if (sm && Math.abs(sm.x - p.x) < r && sm.y < p.y && sm.y > p.y - hgt) { fade = true; break; }
        }
      }
      drawables.push({ y: p.y, draw: () => {
        if (fade) { ctx.save(); ctx.globalAlpha = 0.42; }
        if (p.kind === 'npc') this.drawNpc(ctx, p, nowMs); else drawProp(ctx, p, nowMs);
        if (fade) ctx.restore();
      } });
    }
    for (const g of w.ground) drawables.push({ y: g.y - 1, draw: () => this.drawGroundItem(ctx, g, nowMs) });
    for (const c of w.chests) drawables.push({ y: c.y, draw: () => this.drawChest(ctx, c, nowMs) });
    for (const h of w.heroes) {
      const sm = this.smooth.get(h.uid)!;
      drawables.push({ y: sm.y, draw: () => this.drawHeroUnit(ctx, h, sm, nowMs) });
    }
    for (const m of w.mobs) {
      const sm = this.smooth.get(m.uid)!;
      if (sm.x < vxMin || sm.x > vxMax) continue;
      drawables.push({ y: sm.y + (m.m.flying ? 6 : 0), draw: () => this.drawMobUnit(ctx, m, sm, nowMs) });
    }
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();

    // projectiles
    this.drawShots(ctx, nowMs);
    this.runEffects(ctx, 'top');
    this.stepParticles(ctx, dt);

    // lighting
    if (art.theme === 'cave') this.caveLight(ctx, nowMs, z, ox, oy);
    if (art.theme === 'forest' && !this.lowFx) this.forestLight(ctx, nowMs);
    if (art.theme === 'snow' && !this.lowFx) this.snowfall(ctx, nowMs);
    if (art.theme === 'desert' && !this.lowFx) this.heat(ctx, nowMs);

    // overhead UI in screen space
    ctx.setTransform(this.dpr, 0, 0, this.dpr, sx * this.dpr, sy * this.dpr);
    this.drawOverheads(ctx, nowMs);
    this.drawNums(ctx, nowMs, dt);
    if (this.flash > 0.01) {
      ctx.fillStyle = rgba(this.flashColor, this.flash);
      ctx.fillRect(0, 0, this.cssW, this.cssH);
      this.flash *= Math.pow(0.0005, dt / 1000);
    }
    if (w.wipeUntil) {
      ctx.fillStyle = 'rgba(30,0,0,0.35)';
      ctx.fillRect(0, 0, this.cssW, this.cssH);
    }
  }

  private runEffects(ctx: CanvasRenderingContext2D, layer: Effect['layer']) {
    const now = this.now;
    for (const e of this.effects) {
      if (e.layer !== layer || now < e.t0) continue;
      const age = now - e.t0;
      if (age > e.dur) continue;
      e.draw(ctx, age / e.dur, age);
    }
    if (layer === 'top') this.effects = this.effects.filter((e) => now - e.t0 <= e.dur);
  }

  private magicCircle(ctx: CanvasRenderingContext2D, x: number, y: number, el: Element, p: number, now: number) {
    const col = ELEMENT_COLOR[el] ?? '#a0c0ff';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.5);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, p * 4) * 0.9;
    ctx.rotate(now / 900);
    ctx.strokeStyle = col; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const b = (i + 2) / 6 * Math.PI * 2; ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); ctx.lineTo(Math.cos(b) * 16, Math.sin(b) * 16); }
    ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.fillStyle = col; ctx.fillRect(Math.cos(a) * 19 - 1, Math.sin(a) * 19 - 1, 2, 2); }
    ctx.restore();
  }

  private hpBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, ratio: number, color: string, ratio2?: number) {
    ctx.fillStyle = 'rgba(10,10,20,0.75)';
    ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, ratio2 !== undefined ? 7 : 4);
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y, w * Math.max(0, Math.min(1, ratio)), 2.6);
    if (ratio2 !== undefined) {
      ctx.fillStyle = '#4a8cff';
      ctx.fillRect(x - w / 2, y + 3.4, w * Math.max(0, Math.min(1, ratio2)), 2);
    }
  }

  private drawHeroUnit(ctx: CanvasRenderingContext2D, h: HeroUnit, sm: Smooth, now: number) {
    const w = this.world;
    const look = this.heroLook(h);
    const rt = w.renderTime;
    const t = rt - h.stateT;
    const state = w.wipeUntil ? 'dead' : h.state === 'spawn' ? 'idle' : h.state;
    const flash = rt - h.hurtAt < 160 ? 1 - (rt - h.hurtAt) / 160 : 0;
    ctx.save();
    ctx.translate(sm.x, sm.y);
    // swing length chosen so the blade/spear/katar passes straight ahead at MELEE_CONTACT and the bow releases at BOW_RELEASE
    const dur = h.state === 'attack' ? (h.d.wtype === 'bow' ? BOW_RELEASE / 0.6 : h.d.wtype === 'spear' ? MELEE_CONTACT / 0.47 : MELEE_CONTACT / 0.5) : undefined;
    const pose = { state: flash > 0.5 && (state === 'idle' || state === 'ready') ? 'hurt' : state, t: state === 'idle' || state === 'ready' || state === 'walk' || state === 'cast' || state === 'sit' ? now : t, dur, facing: h.facing };
    this.lastPose.set(h.uid, pose);
    ctx.fillStyle = 'rgba(20,30,20,0.28)';
    ctx.beginPath(); ctx.ellipse(0, 0, state === 'dead' ? 17 : 11, 3.8, 0, 0, Math.PI * 2); ctx.fill();
    if (rigSupports(look)) {
      // painted cut-out rig (already inked by the painter)
      ctx.save();
      if (state === 'dead') ctx.globalAlpha *= 0.85;
      drawRigHero(ctx, look, pose);
      ctx.restore();
    } else if (this.lowFx) drawHero(ctx, look, pose, { flash, alpha: state === 'dead' ? 0.85 : 1, shadow: false });
    else inked(ctx, 120, 120, 60, 106, 1.25, (c) => drawHero(c, look, pose, { flash, alpha: state === 'dead' ? 0.85 : 1, shadow: false }));
    const sh = state === 'dead' ? [] : h.buffs.filter((b) => b.shield && b.shield > 0 && b.until > w.time);
    if (sh.length) {
      // the barrier thins as it soaks hits: fill fades and the bright rim shrinks to what is left
      const left = sh.reduce((a, b) => a + b.shield!, 0), max = sh.reduce((a, b) => a + (b.shieldMax ?? b.shield!), 0);
      const r = Math.max(0.08, Math.min(1, left / max));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.22 + Math.sin(now / 300) * 0.06;
      ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = 1; ctx.fillStyle = `rgba(150,210,255,${0.04 + 0.1 * r})`;
      ctx.beginPath(); ctx.ellipse(0, -24, 19, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.3 + 0.25 * r; ctx.lineWidth = 1 + 0.6 * r;
      ctx.beginPath(); ctx.ellipse(0, -24, 19, 28, 0, -Math.PI / 2 - Math.PI * r, -Math.PI / 2 + Math.PI * r); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    void now;
  }

  private drawMobUnit(ctx: CanvasRenderingContext2D, m: MobUnit, sm: Smooth, now: number) {
    const w = this.world;
    const rt = w.renderTime;
    const t = m.state === 'walk' || m.state === 'idle' ? now + m.uid * 137 : rt - m.stateT;
    const hurt = rt - m.hurtAt < 140 ? 1 - (rt - m.hurtAt) / 140 : 0;
    const spawn = m.state === 'spawn' ? Math.min(1, (rt - m.stateT) / 600) : 1;
    let dead = m.state === 'dead' ? Math.min(1, (rt - m.deadAt) / (m.m.boss ? 1600 : 900)) : 0;
    ctx.save();
    ctx.translate(sm.x, sm.y);
    if ((m.m.boss || m.danger) && !dead) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      // a danger monster (M10) burns red and pulses faster than a boss
      const col = m.danger ? '#ff2a3a' : m.m.boss === 'mvp' ? '#ffcc4a' : '#ff7050';
      ctx.globalAlpha = m.danger ? 0.45 + Math.sin(now / 120) * 0.18 : 0.35 + Math.sin(now / 200) * 0.12;
      ctx.drawImage(glow(col), -34 * m.m.scale / 1.6, -10, 68 * m.m.scale / 1.6, 20);
      ctx.restore();
    }
    // a danger monster leaving the map fades where it stands instead of collapsing
    if (m.vanish) { ctx.globalAlpha *= 1 - dead; dead = 0; }
    const mpose = { state: m.state === 'spawn' ? 'idle' : m.vanish ? 'idle' : m.state, t, facing: m.facing, hurt, frozen: m.frozenUntil > w.time, spawn, dead };
    if (this.lowFx) drawMob(ctx, m.m.sprite, m.m.palette, mpose, m.m.scale);
    else {
      if (!dead) mobShadow(ctx, m.m.sprite, m.m.scale);
      const bw = 80 * m.m.scale, bh = (mobHeight(m.m.sprite) + 30) * m.m.scale;
      inked(ctx, bw, bh, bw / 2, bh - 12 * m.m.scale, 1.2, (c) => drawMob(c, m.m.sprite, m.m.palette, mpose, m.m.scale, false, false));
    }
    if (m.stunUntil > w.time && !dead) {
      const hh = mobHeight(m.m.sprite) * m.m.scale + 6;
      ctx.fillStyle = '#ffe060';
      for (let i = 0; i < 3; i++) {
        const a = now / 260 + i * 2.1;
        const sx = Math.cos(a) * 9, sy = -hh + Math.sin(a) * 3;
        ctx.beginPath();
        for (let k = 0; k < 10; k++) { const rr = k % 2 ? 1.2 : 3; const aa = k / 10 * Math.PI * 2; ctx.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr); }
        ctx.fill();
      }
    }
    if (m.poisonUntil > w.time && !dead && Math.random() < 0.1) this.burst(sm.x, sm.y - 10, 1, '#a050e0', 'glow', 10, 0.6, -30);
    ctx.restore();
  }

  /** M10: a treasure chest on the field — it looks exactly like the map's trap chest asleep */
  private chestBurst = new Set<number>();
  private drawChest(ctx: CanvasRenderingContext2D, c: FieldChest, now: number) {
    const w = this.world, rt = w.renderTime;
    const trap = w.zone.chest ? MONSTERS[w.zone.chest.trap] : undefined;
    const pal = trap?.palette ?? ['#b07a3a', '#5a3a1a', '#ffd040'];
    const sc = trap?.scale ?? 1.2;
    const opening = c.openAt > 0 && !c.opened;
    const fade = c.opened ? Math.max(0, Math.min(1, (rt - c.opened - 900) / 700)) : 0;
    const pose = { state: c.opened ? 'open' : opening ? 'cast' : 'idle', t: opening ? rt - c.openAt + 900 : now + c.id * 97, facing: 1 as const, hurt: 0, frozen: false, spawn: Math.min(1, (rt - c.born) / 500), dead: 0 };
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.globalAlpha *= 1 - fade;
    if (!c.opened) {
      // a slow golden glint so a chest reads as treasure from across the map
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= 0.25 + Math.max(0, Math.sin(now / 420)) * 0.35;
      ctx.drawImage(glow('#ffd040'), -26, -34, 52, 40);
      ctx.restore();
    }
    if (this.lowFx) drawMob(ctx, 'chest', pal, pose, sc);
    else {
      mobShadow(ctx, 'chest', sc);
      const bw = 80 * sc, bh = (mobHeight('chest') + 30) * sc;
      inked(ctx, bw, bh, bw / 2, bh - 12 * sc, 1.2, (cc) => drawMob(cc, 'chest', pal, pose, sc, false, false));
    }
    ctx.restore();
    if (c.opened && !this.chestBurst.has(c.id)) {
      this.chestBurst.add(c.id);
      this.burst(c.x, c.y - 16, 16, '#ffd84a', 'star', 110, 1.0);
      this.burst(c.x, c.y - 12, 8, '#ffd84a', 'coin', 90, 0.9, 60);
    }
  }

  private drawNpc(ctx: CanvasRenderingContext2D, p: Prop, now: number) {
    const look = NPC_LOOKS[p.npc!];
    ctx.save();
    ctx.translate(p.x, p.y);
    drawHero(ctx, look, { state: 'idle', t: now + p.x * 10, facing: p.x < this.world.zone.w / 2 ? 1 : -1 });
    ctx.restore();
  }

  private drawGroundItem(ctx: CanvasRenderingContext2D, g: GroundItem, now: number) {
    const v = this.dropVis.get(g.gid);
    if (!v) return;
    const age = now - v.t0;
    const fly = Math.min(1, age / 420);
    let x = g.fromX + (g.x - g.fromX) * fly;
    let y = g.fromY + (g.y - g.fromY) * fly - Math.sin(fly * Math.PI) * 26;
    let alpha = 1, s = 1;
    if (v.pickT !== undefined) {
      const q = Math.min(1, (now - v.pickT) / 380);
      const to = v.to ? this.pos(v.to) : null;
      if (to) { x += (to.x - x) * q; y += (to.y - 30 - y) * q - Math.sin(q * Math.PI) * 14; }
      alpha = 1 - q; s = 1 - q * 0.5;
      if (q >= 1) return;
    }
    const def = ITEMS[g.id];
    const rare = def.kind === 'card' || g.rarity === 'mvp' || g.rarity === 'epic';
    ctx.save();
    ctx.globalAlpha = alpha;
    if (fly >= 1 && v.pickT === undefined) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (rare || def.kind === 'equip') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const col = def.kind === 'card' ? '#ffcc4a' : g.rarity === 'mvp' ? '#ffcc4a' : g.rarity === 'epic' ? '#d79bff' : '#7ec8ff';
      if (def.kind === 'card' || g.rarity === 'mvp') {
        const gg = ctx.createLinearGradient(0, y - 90, 0, y);
        gg.addColorStop(0, rgba(col, 0)); gg.addColorStop(1, rgba(col, 0.55 + Math.sin(now / 150) * 0.15));
        ctx.fillStyle = gg; ctx.fillRect(x - 7, y - 90, 14, 90);
      }
      ctx.drawImage(glow(col), x - 14, y - 22, 28, 28);
      ctx.restore();
    }
    const icon = itemIcon(g.id);
    if (icon) ctx.drawImage(icon, x - 8 * s, y - 16 * s, 16 * s, 16 * s);
    ctx.restore();
  }

  private drawShots(ctx: CanvasRenderingContext2D, now: number) {
    this.shots = this.shots.filter((sh) => now - sh.t0 <= sh.dur);
    for (const sh of this.shots) {
      const q = (now - sh.t0) / sh.dur;
      const b = this.pos(sh.to);
      const tx = b ? b.x : sh.lastX, ty = b ? b.y - b.h * 0.5 : sh.lastY;
      sh.lastX = tx; sh.lastY = ty;
      const x = sh.fx + (tx - sh.fx) * q;
      const y = sh.fy + (ty - sh.fy) * q - Math.sin(q * Math.PI) * (sh.kind === 'arrow' ? 10 : 4);
      const ang = Math.atan2(ty - sh.fy - Math.cos(q * Math.PI) * 10, tx - sh.fx);
      ctx.save();
      ctx.translate(x, y);
      if (sh.kind === 'arrow') {
        ctx.rotate(ang);
        if (sh.element !== 'neutral') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow(ELEMENT_COLOR[sh.element]), -14, -8, 20, 16); ctx.restore(); }
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(4, 0); ctx.stroke();
        ctx.fillStyle = '#e0e0e8'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(3, -2.2); ctx.lineTo(3, 2.2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-12, -2, 3, 1.2); ctx.fillRect(-12, 0.8, 3, 1.2);
      } else if (sh.kind === 'falcon') {
        ctx.scale(tx >= sh.fx ? 1 : -1, 1);
        drawFalcon(ctx, 0, 0, 1.5, now, true);
      } else {
        ctx.globalCompositeOperation = 'lighter';
        // magic orbs take their element's colour (a fire book's bolt glows orange); plain shadow stays violet
        const col = sh.kind === 'shadow' ? (sh.element === 'neutral' || sh.element === 'shadow' ? '#a060ff' : ELEMENT_COLOR[sh.element]) : '#90d050';
        ctx.drawImage(glow(col), -12, -12, 24, 24);
      }
      ctx.restore();
    }
  }

  private stepParticles(ctx: CanvasRenderingContext2D, dt: number) {
    const s = dt / 1000;
    const keep: Particle[] = [];
    for (const p of this.particles) {
      p.age += dt;
      if (p.age >= p.life) continue;
      p.vx *= 1 - p.drag * s * 0.8; p.vy *= 1 - p.drag * s * 0.8;
      p.vy += p.g * s;
      p.x += p.vx * s; p.y += p.vy * s;
      p.rot += p.vr * s;
      keep.push(p);
      const q = Math.max(0, Math.min(1, p.age / p.life));
      const a = 1 - q;
      const yy = p.y;
      ctx.save();
      ctx.globalAlpha = a;
      if (p.add) ctx.globalCompositeOperation = 'lighter';
      switch (p.kind) {
        case 'glow': { const r = p.size * (1 + q * 0.5); ctx.drawImage(glow(p.color), p.x - r, yy - r, r * 2, r * 2); break; }
        case 'spark': ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, yy  - p.size / 2, p.size, p.size); break;
        case 'star': {
          ctx.translate(p.x, yy ); ctx.rotate(p.rot); ctx.fillStyle = p.color;
          const r = p.size * 1.4; ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.35 : r; const ang = i / 8 * Math.PI * 2; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.fill();
          break;
        }
        case 'smoke': ctx.fillStyle = rgba(p.color.length === 7 ? p.color : '#cccccc', 0.4); ctx.beginPath(); ctx.arc(p.x, yy, Math.max(0.1, p.size * (1 + q)), 0, Math.PI * 2); ctx.fill(); break;
        case 'shard': ctx.translate(p.x, yy ); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(0, -p.size * 1.6); ctx.lineTo(p.size * 0.7, 0); ctx.lineTo(0, p.size * 1.6); ctx.lineTo(-p.size * 0.7, 0); ctx.fill(); break;
        case 'coin': ctx.fillStyle = '#ffd24a'; ctx.strokeStyle = '#8a5a10'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(p.x, yy , p.size * Math.abs(Math.cos(p.rot)) + 0.5, p.size, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break;
        case 'feather': case 'leaf': ctx.translate(p.x + Math.sin(p.age / 200) * 6, yy); ctx.rotate(Math.sin(p.age / 300)); ctx.fillStyle = p.kind === 'feather' ? '#ffffff' : '#c8a040'; ctx.beginPath(); ctx.ellipse(0, 0, 1.6, 4, 0, 0, Math.PI * 2); ctx.fill(); break;
      }
      ctx.restore();
    }
    this.particles = keep;
  }

  private caveLight(ctx: CanvasRenderingContext2D, now: number, z: number, ox: number, oy: number) {
    let lc = (this as unknown as { _lc?: HTMLCanvasElement })._lc;
    if (!lc) { lc = document.createElement('canvas'); (this as unknown as { _lc?: HTMLCanvasElement })._lc = lc; }
    const W = Math.ceil(this.canvas.width / 2), H = Math.ceil(this.canvas.height / 2);
    if (lc.width !== W || lc.height !== H) { lc.width = W; lc.height = H; }
    const l = lc.getContext('2d')!;
    l.setTransform(1, 0, 0, 1, 0, 0);
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = 'rgba(8,4,18,0.72)';
    l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'destination-out';
    l.setTransform(z / 2, 0, 0, z / 2, ox / 2, oy / 2);
    const hole = (x: number, y: number, r: number, a: number) => {
      const g = l.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = g; l.beginPath(); l.arc(x, y, r, 0, Math.PI * 2); l.fill();
    };
    const c = this.world.center();
    hole(c.x, c.y - 20, 190, 0.95);
    for (const L of this.art!.lights) hole(L.x, L.y, L.r * (L.flicker ? 1 + Math.sin(now / 90 + L.x) * 0.05 : 1), 0.9);
    for (const m of this.world.mobs) if (m.m.sprite === 'wisp' || m.m.sprite === 'wraith') hole(m.x, m.y - 26, 70, 0.7);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(lc, 0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    // colored glows
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const L of this.art!.lights) {
      const r = L.r * 0.7 * (L.flicker ? 1 + Math.sin(now / 70 + L.y) * 0.08 : 1);
      ctx.globalAlpha = 0.35;
      ctx.drawImage(glow(L.color), L.x - r, L.y - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  private snowfall(ctx: CanvasRenderingContext2D, now: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const W = this.world.zone.w, H = this.world.zone.h;
    for (let i = 0; i < 90; i++) {
      const sp = 18 + (i % 5) * 6;
      const x = ((i * 97.3 + Math.sin(now / 1400 + i) * 30 + now / 1000 * 12) % W + W) % W;
      const y = ((i * 61.7 + now / 1000 * sp) % H + H) % H;
      const r = 0.8 + (i % 3) * 0.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  private heat(ctx: CanvasRenderingContext2D, now: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const c = this.world.center();
    const g = ctx.createRadialGradient(c.x + 120, c.y - 220, 10, c.x + 120, c.y - 220, 260);
    g.addColorStop(0, `rgba(255,230,160,${0.18 + Math.sin(now / 1200) * 0.04})`); g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g; ctx.fillRect(c.x - 300, c.y - 500, 800, 700);
    ctx.restore();
  }

  private forestLight(ctx: CanvasRenderingContext2D, now: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x = (i * 260 + 80) % this.world.zone.w;
      const a = 0.06 + Math.sin(now / 1500 + i) * 0.03;
      ctx.fillStyle = `rgba(255,250,200,${a})`;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x + 170, this.world.zone.h); ctx.lineTo(x + 90, this.world.zone.h); ctx.fill();
    }
    // fireflies
    for (let i = 0; i < 14; i++) {
      const fx = (i * 137 + Math.sin(now / 1300 + i) * 40) % this.world.zone.w;
      const fy = (i * 211 + Math.cos(now / 1700 + i * 2) * 30) % this.world.zone.h;
      ctx.globalAlpha = 0.4 + Math.sin(now / 300 + i) * 0.4;
      ctx.drawImage(glow('#e8ff80'), fx - 5, fy - 5, 10, 10);
    }
    ctx.restore();
  }

  private drawOverheads(ctx: CanvasRenderingContext2D, now: number) {
    const w = this.world;
    ctx.font = "11px 'Galmuri11', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (const h of w.heroes) {
      const sm = this.smooth.get(h.uid); if (!sm) continue;
      const [x, y] = this.toScreen(sm.x, sm.y);
      if (h.state !== 'dead') this.hpBar(ctx, x, y + 6, 28, h.hp / h.d.maxHp, h.hp / h.d.maxHp < 0.3 ? '#ff4a4a' : '#4ae04a', h.sp / h.d.maxSp);
      // name tag
      ctx.font = "10px 'Galmuri9', 'Galmuri11', sans-serif";
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.fillStyle = '#ffffff';
      // half-resolution pixel mode can't hold Korean glyphs; the party rail shows names anyway
      if (!this.pixelMode) { ctx.strokeText(h.hero.name, x, y + 24); ctx.fillText(h.hero.name, x, y + 24); }
      if (h.state === 'dead' && !w.wipeUntil) {
        const left = Math.max(0, Math.ceil((h.deadUntil - w.time) / 1000));
        ctx.fillStyle = '#ffb0b0'; ctx.strokeText(`부활 ${left}s`, x, y - 30); ctx.fillText(`부활 ${left}s`, x, y - 30);
      }
      const cst = this.casts.get(h.uid);
      if (cst) {
        const q = Math.min(1, (now - cst.t0) / Math.max(1, cst.dur));
        ctx.fillStyle = 'rgba(10,10,20,0.8)'; ctx.fillRect(x - 20, y - 66 * this.cam.zoom / 1.2 - 2, 40, 6);
        ctx.fillStyle = '#7ad8ff'; ctx.fillRect(x - 19, y - 66 * this.cam.zoom / 1.2 - 1, 38 * q, 4);
      }
      if (h.sitting && h.state !== 'dead') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = "9px 'Galmuri9', sans-serif";
        const zz = Math.floor(now / 500) % 3;
        ctx.fillText('z'.repeat(zz + 1), x + 14, y - 46 * this.cam.zoom / 1.2);
      }
    }
    for (const m of w.mobs) {
      if (m.state === 'dead' || m.state === 'spawn') continue;
      const sm = this.smooth.get(m.uid); if (!sm) continue;
      const [x, y] = this.toScreen(sm.x, sm.y);
      if (x < -40 || x > this.cssW + 40) continue;
      const big = !!m.m.boss || !!m.danger;
      const showBar = m.hp < m.maxHp || big || w.focus === m.uid;
      if (showBar) this.hpBar(ctx, x, y + 5, big ? 46 : 26, m.hp / m.maxHp, m.danger ? '#ff2a3a' : m.m.boss ? '#ff6a3a' : '#ff4a6a');
      if (big) {
        const top = y - mobHeight(m.m.sprite) * m.m.scale * this.cam.zoom - 8;
        ctx.font = "bold 11px 'Galmuri11', sans-serif";
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.fillStyle = m.danger ? '#ff6a78' : m.m.boss === 'mvp' ? '#ffd84a' : '#ffa07a';
        const label = m.danger ? `⚠ ${m.m.name} Lv ${m.m.lv}` : `${m.m.boss === 'mvp' ? '[MVP] ' : '[BOSS] '}${m.m.name}`;
        ctx.strokeText(label, x, top); ctx.fillText(label, x, top);
      }
    }
    // bubbles (skill shouts, statuses)
    this.bubbles = this.bubbles.filter((b) => now - b.t0 < (b.big ? 1800 : 1100));
    const stack = new Map<number, number>();
    for (const b of this.bubbles) {
      const p = b.uid >= 0 ? this.pos(b.uid) : null;
      if (!p) continue;
      const age = now - b.t0;
      const k = stack.get(b.uid) ?? 0; stack.set(b.uid, k + 1);
      const [x, y] = this.toScreen(p.x, p.y - p.h - 8);
      const rise = b.big ? Math.min(1, age / 300) * 26 : age / 50;
      ctx.globalAlpha = age > (b.big ? 1300 : 800) ? Math.max(0, 1 - (age - (b.big ? 1300 : 800)) / 500) : 1;
      if (b.big) {
        ctx.font = "bold 15px 'Galmuri11', sans-serif";
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,20,0,0.85)';
        const g = ctx.createLinearGradient(0, y - rise - 30, 0, y - rise - 14);
        g.addColorStop(0, '#ffffff'); g.addColorStop(1, b.color);
        ctx.fillStyle = g;
        ctx.strokeText(b.text, x, y - rise - 18); ctx.fillText(b.text, x, y - rise - 18);
      } else {
        ctx.font = "11px 'Galmuri11', sans-serif";
        const tw = ctx.measureText(b.text).width;
        const by = y - 6 - k * 15 - rise;
        if (b.text.endsWith('!') && b.text.length > 2) {
          ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = 'rgba(60,60,90,0.9)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(x - tw / 2 - 5, by - 12, tw + 10, 15, 5); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#2a2a44'; ctx.fillText(b.text, x, by - 1);
        } else {
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.fillStyle = b.color;
          ctx.strokeText(b.text, x, by); ctx.fillText(b.text, x, by);
        }
      }
      ctx.globalAlpha = 1;
    }
    // town npc labels
    if (this.art?.theme === 'town') {
      for (const p of this.art.props) {
        if (p.kind !== 'npc' || !p.label) continue;
        const [x, y] = this.toScreen(p.x, p.y);
        ctx.font = "10px 'Galmuri9', sans-serif";
        const tw = ctx.measureText(p.label).width;
        ctx.fillStyle = 'rgba(20,30,60,0.75)'; ctx.beginPath(); ctx.roundRect(x - tw / 2 - 4, y + 4, tw + 8, 14, 4); ctx.fill();
        ctx.fillStyle = '#bfe0ff'; ctx.fillText(p.label, x, y + 15);
      }
    }
  }

  private drawNums(ctx: CanvasRenderingContext2D, now: number, dt: number) {
    const s = dt / 1000;
    const scale = Math.min(1, 0.6 + this.cam.zoom * 0.25);
    this.nums = this.nums.filter((d) => now - d.t0 < d.life);
    for (const d of this.nums) {
      const age = now - d.t0;
      d.ox += d.vx * s;
      d.vy += 260 * s;
      d.oy += d.vy * s;
      if (d.oy > 6 && d.vy > 0) { d.vy *= -0.35; d.oy = 6; }
      const [x, y] = this.toScreen(d.x, d.y);
      drawNumber(ctx, d, x + d.ox, y + d.oy, age, scale);
    }
  }
}
