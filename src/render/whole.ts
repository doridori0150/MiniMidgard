// Whole-figure sprites (character animation v6): every frame is one complete painted figure from the approved lineup;
// only weapons and headgear sit on per-frame anchors, and hair is recoloured through a per-frame mask. Codex designed
// the contract (docs/art/sprites: PLAN.md, manifest.json `minimidgard.sprites/1`); this is a line-by-line port of its
// reference player docs/art/sprites/player.py (select_frame / matrix / draw_list / tint) — keep the two in step.
import type { WeaponType } from '../game/types.ts';
import type { HeroLookDraw, Pose } from './hero.ts';

type V2 = [number, number];
interface Anchor { point: V2; angle: number }
interface Frame { image: string; hairMask: string; hand: Anchor & { z: 'front' | 'behind'; visible: boolean }; crown: Anchor; side: Anchor; gripOverlay?: string }
interface Manifest {
  canvas: { origin: V2; referenceHeight: number };
  animations: Record<string, { frames: string[]; durations: number[]; duration: number; loop: boolean }>;
  characters: Record<string, { class: string; gender: string; defaultWeapon: string | null; frames: Record<string, Frame> }>;
  weapons: Record<string, { image: string; pivot: V2 }>;
  headgear: Record<string, { image: string; anchor: 'crown' | 'side'; pivot: V2 }>;
}

const MAN = import.meta.glob('../assets/sprites/manifest.json', { eager: true, import: 'default' }) as Record<string, Manifest>;
const FILES = import.meta.glob('../assets/sprites/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const M: Manifest | undefined = Object.values(MAN)[0];
const imgs = new Map<string, HTMLImageElement>();
let ready = false;
const key = (file: string) => '../assets/sprites/' + file;

/** field units the hero stands (matches the other hero renderers) */
const HEIGHT = 76;

export function loadWhole(): Promise<void> {
  if (!M) return Promise.resolve();
  return Promise.all(Object.entries(FILES).map(([path, url]) => {
    const img = new Image(); img.src = url;
    return img.decode().then(() => { imgs.set(path, img); }, () => {});
  })).then(() => { ready = imgs.size > 0; });
}

/** game class line → painted character (2nd jobs wear their 1st job's set until they have their own) */
const LINE: Partial<Record<string, string>> = {
  novice: 'novice', swordsman: 'swordsman', knight: 'swordsman',
  mage: 'mage', wizard: 'mage', acolyte: 'acolyte', priest: 'acolyte', archer: 'archer', hunter: 'archer',
  thief: 'thief', assassin: 'thief', merchant: 'merchant', blacksmith: 'merchant',
};
const WEAPON: Partial<Record<WeaponType, string | null>> = {
  none: null, dagger: 'dagger', katar: 'dagger', sword: 'sword', sword2h: 'sword', staff: 'staff', mace: 'mace', bow: 'bow', axe: 'axe',
};
const HEADGEAR: Record<string, string> = { leaf: 'leaf', hairpin: 'hairpin' };
/** game hair colour index (state.ts HAIR_COLORS order) → RGB multipliers over the cream hair; null = as painted */
const HAIR_TINT: (number[] | null)[] = [
  [0.42, 0.31, 0.27], [0.66, 0.39, 0.24], [0.93, 0.73, 0.38], null, [0.85, 0.32, 0.31],
  [0.39, 0.6, 0.79], [0.52, 0.69, 0.42], [0.67, 0.42, 0.77], [0.91, 0.53, 0.64], [0.35, 0.36, 0.38],
];

/** A/B switch (설정 → 캐릭터 그림): off = every hero falls back to the assembled renderer */
let enabled = true;
export function setWholeEnabled(on: boolean) { enabled = on; }
/** the first-job lines × genders that have whole-figure frames (for the settings note) */
export const wholeCharacters = () => Object.values(M?.characters ?? {}).map((c) => ({ cls: c.class, gender: c.gender === 'male' ? 'm' : 'f' }));

function character(L: HeroLookDraw): string | undefined {
  if (!M || !enabled) return undefined;
  const line = LINE[L.cls];
  const want = `${line}_${L.gender === 'm' ? 'male' : 'female'}`;
  return line && M.characters[want] ? want : undefined;
}
export function wholeSupports(L: HeroLookDraw) { return ready && !!character(L) && L.wtype in WEAPON; }

// ── player.py
type Mat = [number, number, number, number, number, number];
const matrix = (p: V2, angle = 0, pivot: V2 = [0, 0]): Mat => {
  const r = angle * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [c, s, -s, c, p[0] - c * pivot[0] + s * pivot[1], p[1] - s * pivot[0] - c * pivot[1]];
};
function selectFrame(m: Manifest, state: string, time: number) {
  const a = m.animations[state] ?? m.animations.idle;
  let t = Math.max(0, Math.floor(time));
  t = a.loop ? t % a.duration : Math.min(t, a.duration - 1);
  for (let i = 0; i < a.frames.length; i++) { if (t < a.durations[i]) return a.frames[i]; t -= a.durations[i]; }
  return a.frames[a.frames.length - 1];
}
/** game pose → animation and time (the attack is 280 ms with its hit at 140 ms, as in the sim) */
function clip(pose: Pose): [string, number] {
  switch (pose.state) {
    case 'walk': return ['walk', pose.t];
    case 'attack': return ['attack', pose.t * 280 / Math.max(1, pose.dur ?? 280)];
    case 'cast': return ['cast', pose.t];
    case 'sit': return ['sit', 0];
    case 'hurt': return ['hurt', 0];
    case 'dead': return ['dead', 0];
    default: return ['idle', pose.t];
  }
}

// hair through the mask: out = base × (1 − m + m·tint), alpha kept (renderContract.hair)
const tinted = new Map<string, HTMLCanvasElement>();
function figure(f: Frame, tint: number[] | null): CanvasImageSource | undefined {
  const img = imgs.get(key(f.image));
  if (!img || !tint) return img;
  const k = f.image + tint.join(',');
  let c = tinted.get(k);
  if (!c) {
    const mask = imgs.get(key(f.hairMask));
    c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.drawImage(img, 0, 0);
    if (mask) {
      const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
      const mc = document.createElement('canvas'); mc.width = c.width; mc.height = c.height;
      const mx = mc.getContext('2d', { willReadFrequently: true })!; mx.drawImage(mask, 0, 0);
      const md = mx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < d.length; i += 4) {
        const m = md[i] / 255;
        if (!m) continue;
        d[i] = Math.round(d[i] * (1 - m + m * tint[0])); d[i + 1] = Math.round(d[i + 1] * (1 - m + m * tint[1])); d[i + 2] = Math.round(d[i + 2] * (1 - m + m * tint[2]));
      }
      x.putImageData(im, 0, 0);
    }
    tinted.set(k, c);
  }
  return c;
}

export function drawWhole(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose): boolean {
  const id = character(L);
  if (!ready || !M || !id || !(L.wtype in WEAPON)) return false;
  const c = M.characters[id];
  const [state, t] = clip(pose);
  const f = c.frames[selectFrame(M, state, t)];
  if (!f) return false;
  const weapon = WEAPON[L.wtype] ?? null;
  const draws: [CanvasImageSource | undefined, Mat][] = [];
  const equipped = () => { const w = M.weapons[weapon!]; if (w) draws.push([imgs.get(key(w.image)), matrix(f.hand.point, f.hand.angle, w.pivot)]); };
  const visible = weapon !== null && f.hand.visible;
  if (visible && f.hand.z === 'behind') equipped();
  draws.push([figure(f, HAIR_TINT[L.hairColor % HAIR_TINT.length]), matrix([0, 0])]);
  if (visible && f.hand.z === 'front') {
    equipped();
    if (f.gripOverlay) draws.push([imgs.get(key(f.gripOverlay)), matrix([0, 0])]);
  }
  for (const look of [L.headTop, L.headMid, L.headLow]) {
    const g = look ? M.headgear[HEADGEAR[look] ?? ''] : undefined;
    if (g) draws.push([imgs.get(key(g.image)), matrix(f[g.anchor].point, f[g.anchor].angle, g.pivot)]);
  }
  const k = HEIGHT / M.canvas.referenceHeight;
  ctx.save();
  ctx.scale(pose.facing * k, k); // mirror the whole render about the origin for facing left
  ctx.translate(-M.canvas.origin[0], -M.canvas.origin[1]);
  for (const [src, m] of draws) {
    if (!src) continue;
    ctx.save(); ctx.transform(...m); ctx.drawImage(src, 0, 0); ctx.restore();
  }
  ctx.restore();
  return true;
}
