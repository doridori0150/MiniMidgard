// Painted frame sprites (character animation v4): per-class body frames painted per pose, one rigid head unit (hair back,
// head base, face expression, hair front, headgear on skull anchors) attached at each frame's neck, weapons at its hand.
// Codex designed the contract (docs/art/rig-frames2: PLAN.md, manifest.json); this is a line-by-line
// port of its reference player docs/art/rig-frames2/player.py (minimidgard.frames/2: genders, a neck layer behind the
// collar, and eyes / brows / nose / mouth as separate pickable features) — keep the two in step.
import type { WeaponType } from '../game/types.ts';
import type { HeroLookDraw, Pose } from './hero.ts';

type V2 = [number, number];
interface Frame {
  body: string; bodyPosition: V2; neck: { point: V2; angle: number }; hand: { point: V2; angle: number };
  weaponZ: 'behind' | 'front'; weaponVisible: boolean; expression: string; gripOverlay?: { file: string; position: V2 };
}
interface Manifest {
  canvas: { origin: V2; referenceHeight: number };
  classes: Record<string, { frames: Record<string, Frame>; defaultWeapon: string | null; defaultHairColor: string; defaultHair: Record<string, string> }>;
  animations: Record<string, { frames: string[]; durations: number[]; duration: number; loop: boolean }>;
  head: {
    neck: V2; neckLayer: string; bases: Record<string, string>; featureAnchors: Record<string, V2>; skullAnchors: Record<string, V2>;
    expressionMap: Record<string, Record<string, string>>;
  };
  hairStyles: Record<string, Record<string, { front: string; back: string }>>;
  features: Record<string, Record<string, Record<string, { pivot: V2; variants: Record<string, string> }>>>;
  defaultFeatures: Record<string, Record<string, string>>;
  headgear: Record<string, { file: string; anchor: string; offset: V2; pivot: V2 }>;
  weapons: Record<string, { file: string; grip: V2 }>;
}

const MAN = import.meta.glob('../assets/frames/manifest.json', { eager: true, import: 'default' }) as Record<string, Manifest>;
const FILES = import.meta.glob('../assets/frames/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const M: Manifest | undefined = Object.values(MAN)[0];
const imgs = new Map<string, HTMLImageElement>();
let ready = false;
/** manifest file paths are "assets/…" relative to the Codex folder; ours live under src/assets/frames/ */
const key = (file: string) => '../assets/frames/' + file.replace(/^assets\//, '');

/** field units the hero stands (matches the cut-out rig and the code-drawn hero) */
const HEIGHT = 76;

export function loadSprites(): Promise<void> {
  if (!M) return Promise.resolve();
  const jobs = Object.entries(FILES).map(([path, url]) => {
    const img = new Image(); img.src = url;
    return img.decode().then(() => { imgs.set(path, img); }, () => {});
  });
  return Promise.all(jobs).then(() => { ready = imgs.size > 0; });
}

const CLASS: Partial<Record<string, string>> = { novice: 'novice', swordsman: 'swordsman', knight: 'swordsman' };
const WEAPON: Partial<Record<WeaponType, string | null>> = { none: null, dagger: 'dagger', katar: 'dagger', sword: 'sword', sword2h: 'sword' };
const HEADGEAR: Record<string, string> = { leaf: 'leaf', hairpin: 'hairpin' };
/** game hair colour index (state.ts HAIR_COLORS order) → multiply tint over the cream hair; null = cream as painted */
const HAIR_TINT: (number[] | null)[] = [
  [0.42, 0.31, 0.27], [0.66, 0.39, 0.24], [0.93, 0.73, 0.38], null, [0.85, 0.32, 0.31],
  [0.39, 0.6, 0.79], [0.52, 0.69, 0.42], [0.67, 0.42, 0.77], [0.91, 0.53, 0.64], [0.35, 0.36, 0.38],
];

export function spriteSupports(L: HeroLookDraw) {
  const c = CLASS[L.cls];
  return ready && !!M && !!c && !!M.classes[c] && L.wtype in WEAPON;
}

// ── player.py: multiply / matrix / select_frame
type Mat = [number, number, number, number, number, number];
const multiply = (a: Mat, b: Mat): Mat => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
const matrix = (point: V2, angle = 0, pivot: V2 = [0, 0]): Mat => {
  const r = angle * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [c, s, -s, c, point[0] - c * pivot[0] + s * pivot[1], point[1] - s * pivot[0] - c * pivot[1]];
};
function selectFrame(m: Manifest, state: string, timeMs: number) {
  const a = m.animations[state] ?? m.animations.idle;
  let t = Math.max(0, Math.floor(timeMs));
  t = a.loop ? t % a.duration : Math.min(t, a.duration - 1);
  for (let i = 0; i < a.frames.length; i++) { if (t < a.durations[i]) return a.frames[i]; t -= a.durations[i]; }
  return a.frames[a.frames.length - 1];
}

/** game pose → animation state and time (the attack is 280ms with its hit frame at 140ms, same as the sim) */
function clip(pose: Pose): [string, number] {
  switch (pose.state) {
    case 'walk': return ['walk', pose.t];
    case 'attack': return ['attack', pose.t * 280 / Math.max(1, pose.dur ?? 280)];
    case 'cast': return ['cast', pose.t];
    case 'sit': return ['sit', 0];
    case 'hurt': return ['hurt', 0];
    case 'dead': return ['dead', pose.t];
    default: return ['idle', pose.t];
  }
}

// hair tint: multiply only pixels with red > 127, so the dark outline and alpha survive (renderContract.tint)
const tinted = new Map<string, HTMLCanvasElement>();
function hair(file: string, tint: number[] | null): CanvasImageSource | undefined {
  const img = imgs.get(key(file));
  if (!img || !tint) return img;
  const k = file + tint.join(',');
  let c = tinted.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.drawImage(img, 0, 0);
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 127) { d[i] *= tint[0]; d[i + 1] *= tint[1]; d[i + 2] *= tint[2]; }
    x.putImageData(im, 0, 0);
    tinted.set(k, c);
  }
  return c;
}

const FEATURES = ['eyes', 'brows', 'nose', 'mouth'] as const;
export type FeatureKind = typeof FEATURES[number];
/** how many painted types each face feature has for a gender (0 while the sprites are missing) — drives the pickers */
export function featureTypes(gender: 'm' | 'f'): Record<FeatureKind, number> {
  const f = M?.features[gender === 'm' ? 'male' : 'female'];
  return { eyes: Object.keys(f?.eyes ?? {}).length, brows: Object.keys(f?.brows ?? {}).length, nose: Object.keys(f?.nose ?? {}).length, mouth: Object.keys(f?.mouth ?? {}).length };
}
/** game hair style index → this gender's painted styles (until all eight exist) */
const HAIR_IDS: Record<string, string[]> = { female: ['01', '05'], male: ['02', '03'] };

export function drawSprite(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose): boolean {
  if (!spriteSupports(L) || !M) return false;
  const cfg = M.classes[CLASS[L.cls]!];
  const [state, t] = clip(pose);
  const f = cfg.frames[selectFrame(M, state, t)];
  if (!f) return false;
  const h = M.head;
  const gender = L.gender === 'm' ? 'male' : 'female';
  const ids = HAIR_IDS[gender].filter((id) => M.hairStyles[gender]?.[id]);
  const style = M.hairStyles[gender]?.[ids[L.hair % Math.max(1, ids.length)] ?? cfg.defaultHair[gender]];
  const base = h.bases[gender];
  if (!style || !base) return false;
  const weapon = WEAPON[L.wtype] ?? null;
  const tint = HAIR_TINT[L.hairColor % HAIR_TINT.length];
  const gear = [L.headTop, L.headMid, L.headLow].map((x) => (x ? HEADGEAR[x] : undefined)).filter((x): x is string => !!x && !!M.headgear[x]);
  // idle blinks for a beat every few seconds
  const phase = (L.hairColor * 977 + L.hair * 613 + (L.gender === 'm' ? 1500 : 0) + (L.eyes ?? 0) * 211) % 3700; // party members blink out of step
  const expression = f.expression === 'normal' && state === 'idle' && (pose.t + phase) % 3700 < 130 ? 'blink' : f.expression;
  const variants = h.expressionMap[expression] ?? h.expressionMap.normal;
  const draws: [CanvasImageSource | undefined, Mat][] = [];
  const add = (src: CanvasImageSource | undefined, m: Mat) => draws.push([src, m]);
  const weaponDraw = () => {
    if (weapon && f.weaponVisible) { const w = M.weapons[weapon]; add(imgs.get(key(w.file)), matrix(f.hand.point, f.hand.angle, w.grip)); }
  };
  const headmat = matrix(f.neck.point, f.neck.angle, h.neck);
  const head = (src: CanvasImageSource | undefined, p: V2 = [0, 0]) => add(src, multiply(headmat, matrix(p)));
  if (f.weaponZ === 'behind') weaponDraw();
  head(imgs.get(key(h.neckLayer)));          // the neck tucks under the collar
  head(hair(style.back, tint));
  add(imgs.get(key(f.body)), matrix(f.bodyPosition));
  head(imgs.get(key(base)));
  const pick: Record<string, number | undefined> = { eyes: L.eyes, brows: L.brows, nose: L.nose, mouth: L.mouth };
  for (const kind of FEATURES) {
    const types = M.features[gender]?.[kind] ?? {};
    const keys = Object.keys(types);
    const typ = pick[kind] !== undefined && keys.length ? keys[pick[kind]! % keys.length] : M.defaultFeatures[gender][kind];
    const feature = types[typ];
    if (!feature) continue;
    const a = h.featureAnchors[kind];
    head(imgs.get(key(feature.variants[variants[kind]] ?? feature.variants.normal)), [a[0] - feature.pivot[0], a[1] - feature.pivot[1]]);
  }
  head(hair(style.front, tint));
  for (const id of gear) {
    const item = M.headgear[id], a = h.skullAnchors[item.anchor];
    head(imgs.get(key(item.file)), [a[0] + item.offset[0] - item.pivot[0], a[1] + item.offset[1] - item.pivot[1]]);
  }
  if (f.weaponZ === 'front') {
    weaponDraw();
    if (weapon && f.weaponVisible && f.gripOverlay) add(imgs.get(key(f.gripOverlay.file)), matrix(f.gripOverlay.position));
  }

  const k = HEIGHT / M.canvas.referenceHeight;
  ctx.save();
  ctx.scale(pose.facing * k, k); // mirror the whole assembly around the origin for facing left
  ctx.translate(-M.canvas.origin[0], -M.canvas.origin[1]);
  for (const [src, m] of draws) {
    if (!src) continue;
    ctx.save(); ctx.transform(...m); ctx.drawImage(src, 0, 0); ctx.restore();
  }
  ctx.restore();
  return true;
}
