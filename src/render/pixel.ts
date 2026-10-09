// Pixel-art heroes (trial, `minimidgard.pixel/1` — docs/art-requests/pixel-hero-trial.md): per frame one body sprite with the
// face and a close-cropped base hair; a hair style adds a back layer (behind the body) and a front layer (over it), placed at
// the frame's head point; the weapon is its own per-frame layer with a finger overlay. Hair colour swaps the four hair key
// colours for a ramp (a palette swap, as old MMOs did). Drawn without smoothing. 설정 → 캐릭터 그림 C.
import type { WeaponType } from '../game/types.ts';
import type { HeroLookDraw, Pose } from './hero.ts';
import { HAIR_TINT, LINE, clip, pickFrame } from './whole.ts';

type V2 = [number, number];
interface Frame { image: string; head: { point: V2; pose: string }; weapon?: { z: 'front' | 'behind'; visible: boolean }; grip?: string }
interface Manifest {
  canvas: { size: V2; origin: V2; bodyHeight?: number };
  animations: Record<string, { frames: string[]; durations: number[]; duration: number; loop: boolean }>;
  hairKeys: string[];
  characters: Record<string, {
    class: string; gender: string; defaultWeapon?: string; defaultHair?: string; frames: Record<string, Frame>;
    /** standing height in art pixels (proportion variants differ); falls back to canvas.bodyHeight */
    bodyHeight?: number;
    animations?: Manifest['animations'];
    hairStyles?: string[];
  }>;
  hair: Record<string, { gender?: string; pivot?: V2; poses: Record<string, { front?: string; back?: string; pivot?: V2 }> }>;
  weapons: Record<string, { frames: Record<string, Record<string, string>> }>;
}

const MAN = import.meta.glob('../assets/pixel/manifest.json', { eager: true, import: 'default' }) as Record<string, Manifest>;
const FILES = import.meta.glob('../assets/pixel/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const M: Manifest | undefined = Object.values(MAN)[0];
const imgs = new Map<string, HTMLImageElement>();
let ready = false;
let enabled = false;
/** proportion variant: 'p2' (about 2–2.5 heads) or 'p3' (about 3–4 heads); ids are <line>_<gender>_<variant> */
let variant = '';
const key = (file: string) => '../assets/pixel/' + file;

/** field units the hero stands (matches the other hero renderers) */
const HEIGHT = 76;
/** game weapon → pixel weapon set; null = empty-handed; missing = no pixel art for it yet (another renderer draws) */
const WEAPON: Partial<Record<WeaponType, string | null>> = { none: null, sword: 'sword', sword2h: 'sword' };
/** look.hair (0..7) picks a style by index among the character's gender's styles, in this order */
const STYLE_ORDER = ['ponytail', 'bob', 'long'].flatMap((n) => [n, n + '_p2', n + '_p3']);
/* hair colours: the same per-colour multipliers the B sprites use over their cream hair (whole.ts HAIR_TINT), applied to the four cream keys */

export function setPixelEnabled(on: boolean, v = '') { enabled = on; variant = v; }
export const pixelCharacters = () => {
  const seen = new Set<string>();
  return Object.values(M?.characters ?? {}).map((c) => ({ cls: c.class, gender: c.gender === 'male' || c.gender === 'm' ? 'm' : 'f' }))
    .filter((c) => !seen.has(c.cls + c.gender) && seen.add(c.cls + c.gender));
};
/** art pixels → field units: the tallest variant stands HEIGHT tall, every other one keeps the same pixel size (so a 2-head hero is shorter) */
const unitPerPx = () => HEIGHT / Math.max(1, ...Object.values(M?.characters ?? {}).map((c) => c.bodyHeight ?? M!.canvas.bodyHeight ?? 76));

export function loadPixel(): Promise<void> {
  if (!M) return Promise.resolve();
  return Promise.all(Object.entries(FILES).map(([path, url]) => {
    const img = new Image(); img.src = url;
    return img.decode().then(() => { imgs.set(path, img); }, () => {});
  })).then(() => { ready = imgs.size > 0; });
}

function character(L: HeroLookDraw): string | undefined {
  if (!M || !enabled) return undefined;
  const line = LINE[L.cls];
  if (!line) return undefined;
  const base = `${line}_${L.gender === 'm' ? 'male' : 'female'}`;
  for (const id of variant ? [`${base}_${variant}`, base] : [base]) if (M.characters[id]) return id;
  return undefined;
}
export function pixelSupports(L: HeroLookDraw) {
  const id = ready ? character(L) : undefined;
  if (!id || !(L.wtype in WEAPON)) return false;
  const w = WEAPON[L.wtype];
  return !w || !!M!.weapons[w]?.frames[id];
}

function styleFor(L: HeroLookDraw, c: Manifest['characters'][string]): string | undefined {
  // a character may list its own styles (proportion variants have their own hair pieces); else every style of its gender
  const names = c.hairStyles?.filter((n) => M!.hair[n]) ?? Object.keys(M!.hair).filter((n) => !M!.hair[n].gender || M!.hair[n].gender === c.gender);
  names.sort((a, b) => (STYLE_ORDER.indexOf(a) + 99) % 99 - (STYLE_ORDER.indexOf(b) + 99) % 99);
  return names.length ? names[L.hair % names.length] : undefined;
}

// ── hair palette swap: each of the four cream key colours × the hair colour's multipliers (so C matches B's hair colours)
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function ramp(color: number): number[][] | null {
  const t = HAIR_TINT[color % HAIR_TINT.length];
  if (!t) return null;
  return M!.hairKeys.map(hex).map((k) => k.map((v, i) => Math.round(v * t[i])));
}
const swapped = new Map<string, HTMLCanvasElement>();
function layer(file: string | undefined, color: number): CanvasImageSource | undefined {
  if (!file) return undefined;
  const img = imgs.get(key(file));
  const r = ramp(color);
  if (!img || !r) return img;
  const k = file + '#' + color;
  let c = swapped.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.drawImage(img, 0, 0);
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    const keys = M!.hairKeys.map(hex);
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const j = keys.findIndex((q) => q[0] === d[i] && q[1] === d[i + 1] && q[2] === d[i + 2]);
      if (j >= 0) d.set(r[j], i);
    }
    x.putImageData(im, 0, 0);
    swapped.set(k, c);
  }
  return c;
}

export function drawPixel(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose): boolean {
  if (!pixelSupports(L)) return false;
  const id = character(L)!;
  const c = M!.characters[id];
  const table = c.animations ?? M!.animations;
  let [state, t] = clip(pose);
  if (state === 'attack' && table.attack) {
    // the game swings in pose.dur with the hit at half of it; this art's hit is the 5th of 8 frames (MOTION_SPEC), so map half → its start
    // `hitFrame` (index) marks the contact frame (docs/art/MOTION_REFERENCE.md); round-8 art without it hits on its 5th of 8 frames
    const a = table.attack as typeof table.attack & { hitFrame?: number };
    const hi = a.hitFrame ?? (a.frames.length >= 8 ? 4 : -1);
    const hit = hi >= 0 ? a.durations.slice(0, hi).reduce((x, y) => x + y, 0) : a.duration / 2;
    t = pose.t / Math.max(1, pose.dur ?? 280) * 2 * hit;
  }
  if (state === 'dead') t = pose.t; // play the fall, then hold the last frame
  const name = pickFrame(table, state, t);
  const f = c.frames[name];
  if (!f) return false;
  const w = WEAPON[L.wtype];
  const wfile = w ? M!.weapons[w].frames[id]?.[name] : undefined;
  const showW = !!wfile && f.weapon?.visible !== false;
  const style = styleFor(L, c);
  const hp = style ? M!.hair[style].poses[f.head.pose] : undefined;
  const piv = hp?.pivot ?? (style ? M!.hair[style].pivot : undefined) ?? [0, 0];
  const hx = f.head.point[0] - piv[0], hy = f.head.point[1] - piv[1];
  const k = unitPerPx();
  const put = (src: CanvasImageSource | undefined, x = 0, y = 0) => { if (src) ctx.drawImage(src, x, y); };
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(pose.facing * k, k);
  ctx.translate(-M!.canvas.origin[0], -M!.canvas.origin[1]);
  put(layer(hp?.back, L.hairColor), hx, hy);
  if (showW && f.weapon?.z === 'behind') put(imgs.get(key(wfile!)));
  put(layer(f.image, L.hairColor));
  if (showW && f.weapon?.z !== 'behind') { put(imgs.get(key(wfile!))); put(f.grip ? imgs.get(key(f.grip)) : undefined); }
  put(layer(hp?.front, L.hairColor), hx, hy);
  ctx.restore();
  return true;
}
