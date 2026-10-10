// asset-kit 에셋 무대 (asset-stage.html): the workshop's "게임 무대" tab. One pixel hero on a plain field, drawn by the game's own
// renderer (src/render/pixel.ts through rig.drawRigHero), plays the motion picked in the workshop with the game's timing: a skill
// motion through its skill (pose.skill, the wind-up fitted into SKILL_CONTACT), the attack over the swing the field uses, the cast
// with its lead-in. The player's save is never read or written.
// Protocol (asset-kit README "게임 저장소에 붙이기"):
// in  asset-stage:show {id, kind}, :play {id, action, loop, speed}, :options {loop, speed}, :tuning (ignored), :film {req, id, action, speed, fps}
// out asset-stage:ready {heroes, tunables, defaults, actions, film}, :subject {id, frameMs, cells}, :played {id, action}, :status {text},
//     :filmed {req, film | error}; window.AssetStageFilm = {ready, record} (asset-kit tools/film.mjs)
import manifest from '../assets/pixel/manifest.json';
import type { ClassId, WeaponType } from '../game/types.ts';
import { BOW_RELEASE, MELEE_CONTACT, SKILL_CONTACT } from '../game/world.ts';
import type { HeroLookDraw, Pose } from '../render/hero.ts';
import { attackContact, pixelFrame, setPixelEnabled } from '../render/pixel.ts';
import { drawRigHero, loadRig } from '../render/rig.ts';
import { setWholeEnabled } from '../render/whole.ts';
import { timelines } from '../render/timeline.ts';
import { validateTimeline, type Timeline } from '../render/vendor/asset-kit-timeline.js';

interface Anim { frames: string[]; durations: number[]; duration: number; loop: boolean; hitFrame?: number }
interface Char { class: string; gender: string; defaultWeapon?: string; animations?: Record<string, Anim>; skillMotions?: Record<string, string> }
const M = manifest as unknown as { canvas: { bodyHeight?: number }; animations: Record<string, Anim>; characters: Record<string, Char> };

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const note = document.getElementById('note')!;
const ctx = canvas.getContext('2d')!;
const embedded = parent !== window;
const tell = (msg: Record<string, unknown>) => { if (embedded) parent.postMessage(msg, '*'); };
const say = (text: string) => { note.textContent = text; tell({ type: 'asset-stage:status', text }); };

const heroes = Object.keys(M.characters);
const table = (id: string) => M.characters[id].animations ?? M.animations;
/** the game weapon each pixel weapon layer stands for (pixel.ts WEAPON, reversed) */
const GAME_WEAPON: Record<string, WeaponType> = { sword: 'sword', spear: 'spear', staff: 'staff', bow: 'bow', mace: 'mace', dagger: 'dagger', katar: 'katar', axe: 'axe' };
const look = (id: string): HeroLookDraw => {
  const c = M.characters[id];
  const w = new URLSearchParams(location.search).get('weapon') ?? c.defaultWeapon ?? 'none';
  return { cls: c.class as ClassId, gender: c.gender === 'male' ? 'm' : 'f', hair: 0, hairColor: 3, skin: 0, dye: 0, wtype: GAME_WEAPON[w] ?? 'none', refine: 0, shield: false };
};
/** the swing the field gives a hero's attack (field.ts drawHeroUnit): the hit lands at MELEE_CONTACT, a bow releases at BOW_RELEASE */
const swing = (w: WeaponType) => (w === 'bow' ? BOW_RELEASE / 0.6 : w === 'spear' ? MELEE_CONTACT / 0.47 : MELEE_CONTACT / 0.5);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** how a motion plays in the game: the pose at time t, how long it runs, and when its contact lands */
interface Plan { kind: string; pose: (t: number) => Pose; durationMs: number; contactMs: number | null; contactCell: number | null }
function plan(id: string, kind: string): Plan {
  const L = look(id), tb = table(id), c = M.characters[id];
  const a = tb[kind] ?? tb.idle;
  const hit = a.hitFrame != null ? sum(a.durations.slice(0, a.hitFrame)) : null;
  if (kind.startsWith('skill_')) {
    // through a skill that uses this motion, so the stage shows the game's own fitting of the wind-up into SKILL_CONTACT
    const skill = Object.entries(c.skillMotions ?? {}).find(([, v]) => v === kind)?.[0];
    if (skill) {
      return {
        kind, pose: (t) => ({ state: 'attack', t: 0, dur: swing(L.wtype), facing: 1, since: t, skill, skillT: t }),
        durationMs: hit ? SKILL_CONTACT + a.duration - hit : a.duration, contactMs: hit ? SKILL_CONTACT : null, contactCell: a.hitFrame ?? null,
      };
    }
    return { kind, pose: (t) => ({ state: 'idle', t, facing: 1, anim: kind }), durationMs: a.duration, contactMs: hit, contactCell: a.hitFrame ?? null };
  }
  if (kind === 'attack') {
    const d = swing(L.wtype);
    return { kind, pose: (t) => ({ state: 'attack', t: Math.min(t, d - 1), dur: d, facing: 1, since: t }), durationMs: d, contactMs: d * attackContact(L.wtype), contactCell: a.hitFrame ?? null };
  }
  if (kind === 'cast' || kind === 'cast_start') {
    const lead = tb.cast_start?.duration ?? 0;
    return { kind: 'cast', pose: (t) => ({ state: 'cast', t, facing: 1, since: t }), durationMs: lead + (tb.cast?.duration ?? 600) * 2, contactMs: null, contactCell: null };
  }
  if (kind === 'dead') return { kind, pose: (t) => ({ state: 'dead', t, facing: 1 }), durationMs: a.duration + 600, contactMs: null, contactCell: null };
  if (kind === 'hurt' || kind === 'sit') return { kind, pose: (t) => ({ state: kind, t, facing: 1 }), durationMs: Math.max(a.duration, 400), contactMs: null, contactCell: null };
  return { kind, pose: (t) => ({ state: kind === 'walk' ? 'walk' : 'idle', t, facing: 1 }), durationMs: a.duration * (a.loop ? 2 : 1), contactMs: null, contactCell: null };
}

// ── drawing: field units → CSS px chosen so the standing hero is about 40% of the stage height; feet at 72% down
let cssW = 0, cssH = 0, dpr = 1;
function resize() {
  dpr = Math.max(1, devicePixelRatio || 1); cssW = canvas.clientWidth; cssH = canvas.clientHeight;
  canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
}
const unitScale = () => Math.max(1, (cssH * 0.4) / 76);
const foot = () => [cssW / 2, cssH * 0.72] as const;
function paint(g: CanvasRenderingContext2D, pose: Pose, id: string, ground: boolean) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, cssW, cssH);
  const [fx, fy] = foot(), s = unitScale();
  if (ground) {
    const sky = g.createLinearGradient(0, 0, 0, cssH);
    sky.addColorStop(0, '#3d5a45'); sky.addColorStop(0.72, '#5f7f4f'); sky.addColorStop(0.721, '#6f8f58'); sky.addColorStop(1, '#4f6b3f');
    g.fillStyle = sky; g.fillRect(0, 0, cssW, cssH);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(fx, fy, 14 * s, 4 * s, 0, 0, Math.PI * 2); g.fill();
  }
  g.save(); g.translate(fx, fy); g.scale(s, s);
  drawRigHero(g, look(id), pose);
  g.restore();
}

// ── playback
const state = { id: heroes[0], kind: 'idle', action: '', loop: true, speed: 1, start: 0, token: 0, plan: null as Plan | null };
function show(id: string, kind?: string) {
  if (!M.characters[id]) { say('알 수 없는 영웅: ' + id); return false; }
  if (state.id !== id) { state.id = id; state.plan = null; }
  if (kind) state.kind = kind;
  const tb = table(id);
  tell({ type: 'asset-stage:subject', id, frameMs: Object.fromEntries(Object.entries(tb).map(([k, a]) => [k, a.durations])), cells: Object.fromEntries(Object.entries(tb).map(([k, a]) => [k, a.frames])) });
  say(`${id} · ${state.kind} 준비됨`);
  return true;
}
function play(action: string) {
  const kind = action === 'selected' ? state.kind : action;
  state.action = action; state.plan = plan(state.id, kind); state.start = performance.now(); state.token++;
  say(`${state.id} · ${kind} 재생${state.plan.contactMs != null ? ` (접촉 ${Math.round(state.plan.contactMs)}ms)` : ''}`);
  tell({ type: 'asset-stage:played', id: state.id, action });
}
function frame(now: number) {
  const p = state.plan;
  let pose: Pose = { state: 'idle', t: now, facing: 1 };
  if (p) {
    const t = (now - state.start) * state.speed;
    if (t < p.durationMs) pose = p.pose(t);
    else if (state.loop && t > p.durationMs + 600) state.start = now; // a short rest in idle, then again
    else if (!state.loop && t >= p.durationMs) state.plan = null;
  }
  paint(ctx, pose, state.id, true);
  requestAnimationFrame(frame);
}

// ── 촬영 (asset-kit film): the motion painted frame by frame at even times, with the cell drawn and crops of the stage and of the hero alone
async function film({ id = state.id, action = 'selected', speed = 1, fps = 60, before = 120, after = 160, width = 200 }: { id?: string; action?: string; speed?: number; fps?: number; before?: number; after?: number; width?: number } = {}) {
  if (!show(id)) throw new Error('알 수 없는 영웅: ' + id);
  const kind = action === 'selected' ? state.kind : action;
  const p = plan(id, kind), L = look(id), sp = Math.min(2, Math.max(0.25, Number(speed) || 1)), dt = 1000 / fps;
  const anim = table(id)[p.kind] ?? table(id).idle;
  const main = document.createElement('canvas'), solo = document.createElement('canvas');
  for (const c of [main, solo]) { c.width = canvas.width; c.height = canvas.height; }
  const mg = main.getContext('2d')!, sg = solo.getContext('2d')!;
  const s = unitScale(), h = 76 * s * (M.canvas.bodyHeight ?? 48) / 62, [fx, fy] = foot();
  const box = { x: fx - h * 1.4, y: fy - h * 1.55, w: h * 2.8, h: h * 1.75 }; // wide enough for smears and long weapons
  const ow = width, oh = Math.round(width * box.h / box.w);
  const grab = (src: HTMLCanvasElement) => { const o = document.createElement('canvas'); o.width = ow; o.height = oh; o.getContext('2d')!.drawImage(src, box.x * dpr, box.y * dpr, box.w * dpr, box.h * dpr, 0, 0, ow, oh); return o.toDataURL('image/png'); };
  const total = p.durationMs / sp, frames = [];
  for (let k = -Math.ceil(before / dt); k <= Math.ceil((total + after) / dt); k++) {
    const t = k * dt, act = t >= 0 && t < total, at = t * sp;
    const pose = act ? p.pose(at) : { state: 'idle', t: 0, facing: 1 as const };
    paint(mg, pose, id, true); paint(sg, pose, id, false);
    const pf = act ? pixelFrame(L, pose) : null;
    frames.push({ t: Math.round(t * 10) / 10, phase: act ? 'act' : 'idle', age: act ? Math.round(t) : null, cell: pf && pf.anim === p.kind ? pf.index : null, motion: null, crop: grab(main), solo: grab(solo) });
  }
  return {
    kit: 1, game: 'Mini Midgard', subject: id, name: id, action: p.kind, art: 'pixel frames (src/assets/pixel)', speed: sp, fps, frameMs: +dt.toFixed(3),
    durationMs: Math.round(total), contactMs: p.contactMs == null ? null : Math.round(p.contactMs / sp * 10) / 10, contactCell: p.contactCell,
    cellNames: anim.frames, cells: anim.frames.length, crop: { width: ow, height: oh, bodyPx: Math.round(h * ow / box.w), scale: +(ow / box.w).toFixed(4), follow: false }, frames,
  };
}

addEventListener('message', (ev) => {
  const m = (ev.data || {}) as Record<string, any>;
  if (m.type === 'asset-stage:show' && m.id) show(m.id, m.kind);
  if (m.type === 'asset-stage:play') {
    if (m.loop !== undefined) state.loop = !!m.loop;
    if (m.speed) state.speed = Math.min(2, Math.max(0.25, Number(m.speed) || 1));
    if (!m.id || show(m.id)) play(m.action || 'selected');
  }
  if (m.type === 'asset-stage:options') {
    if (m.loop !== undefined) state.loop = !!m.loop;
    if (m.speed) state.speed = Math.min(2, Math.max(0.25, Number(m.speed) || 1));
  }
  // timeline@1 (asset-kit 타임라인): checked with the shared validator; this bare stage plays the timeline's body motion only —
  // its effects, camera and cut-ins play on the field (game URL ?demo=<skill id>)
  if (m.type === 'asset-stage:timeline' && ev.source) {
    const src = ev.source as Window;
    const tl = (m.timeline as Timeline | undefined) ?? timelines().find((t) => t.id === m.id);
    const errors = tl ? validateTimeline(tl) : ['타임라인을 찾지 못했습니다: ' + (m.id ?? '')];
    if (tl && !errors.length) {
      const motion = tl.tracks.find((t) => t.type === 'motion')?.clips[0] as { anim?: string } | undefined;
      if (tl.subject && M.characters[tl.subject]) show(tl.subject, motion?.anim ?? state.kind);
      if (motion?.anim) play('selected');
    }
    src.postMessage({ type: 'asset-stage:timelined', req: m.req, ok: !errors.length, ...(errors.length ? { errors } : { event: 'motion', note: '무대는 몸 동작만 재생합니다. 이펙트·카메라·컷인은 게임 ?demo=<스킬 id>에서' }) }, '*');
  }
  if (m.type === 'asset-stage:film' && ev.source) {
    const src = ev.source as Window;
    film(m).then((f) => src.postMessage({ type: 'asset-stage:filmed', req: m.req, film: f }, '*'), (e) => src.postMessage({ type: 'asset-stage:filmed', req: m.req, error: String(e?.message ?? e) }, '*'));
  }
});

const AssetStageFilm = { ready: false, record: film };
Object.assign(window, { AssetStageFilm, MiniMidgardStage: { state, plan, film, show, play } });

(async () => {
  resize(); addEventListener('resize', resize);
  setWholeEnabled(true); setPixelEnabled(true, 'p2');
  await loadRig();
  const q = new URLSearchParams(location.search);
  show(q.get('hero') ?? heroes[0], q.get('kind') ?? 'idle');
  requestAnimationFrame(frame);
  AssetStageFilm.ready = true;
  const actions = [
    { id: 'selected', label: '고른 동작 재생' }, { id: 'attack', label: '평타' }, { id: 'cast', label: '시전' },
    { id: 'walk', label: '걷기' }, { id: 'hurt', label: '피격' }, { id: 'dead', label: '쓰러짐' },
  ];
  tell({ type: 'asset-stage:ready', heroes, tunables: {}, defaults: {}, actions, film: ['selected', 'attack', 'cast', 'walk'], timelines: timelines().map((t) => ({ id: t.id, skills: t.skills, subject: t.subject })) });
  show(state.id);
})().catch((e) => say('무대를 열지 못했습니다: ' + (e?.message ?? e)));
