// Pixel-art heroes (trial, `minimidgard.pixel/1` — docs/art-requests/pixel-hero-trial.md): per frame one body sprite with the
// face and a close-cropped base hair; a hair style adds a back layer (behind the body) and a front layer (over it), placed at
// the frame's head point; the weapon is its own per-frame layer with a finger overlay. Hair colour swaps the four hair key
// colours for a ramp (a palette swap, as old MMOs did). Drawn without smoothing. 설정 → 캐릭터 그림 C.
import type { WeaponType } from '../game/types.ts';
import type { HeroLookDraw, Pose } from './hero.ts';
import { LINE, clip, pickFrame } from './whole.ts';

type V2 = [number, number];
interface Frame { image: string; head: { point: V2; pose: string }; weapon?: { z: 'front' | 'behind'; visible: boolean }; grip?: string }
interface Manifest {
  canvas: { size: V2; origin: V2; bodyHeight: number };
  animations: Record<string, { frames: string[]; durations: number[]; duration: number; loop: boolean }>;
  hairKeys: string[];
  characters: Record<string, { class: string; gender: string; defaultWeapon?: string; defaultHair?: string; frames: Record<string, Frame> }>;
  hair: Record<string, { gender?: string; pivot?: V2; poses: Record<string, { front?: string; back?: string; pivot?: V2 }> }>;
  weapons: Record<string, { frames: Record<string, Record<string, string>> }>;
}

const MAN = import.meta.glob('../assets/pixel/manifest.json', { eager: true, import: 'default' }) as Record<string, Manifest>;
const FILES = import.meta.glob('../assets/pixel/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const M: Manifest | undefined = Object.values(MAN)[0];
const imgs = new Map<string, HTMLImageElement>();
let ready = false;
let enabled = false;
const key = (file: string) => '../assets/pixel/' + file;

/** field units the hero stands (matches the other hero renderers) */
const HEIGHT = 76;
/** game weapon → pixel weapon set; null = empty-handed; missing = no pixel art for it yet (another renderer draws) */
const WEAPON: Partial<Record<WeaponType, string | null>> = { none: null, sword: 'sword', sword2h: 'sword' };
/** look.hair (0..7) picks a style by index among the character's gender's styles, in this order */
const STYLE_ORDER = ['ponytail', 'bob', 'long'];
/** state.ts HAIR_COLORS, same order; index 3 (cream) keeps the painted keys */
const HAIR_HEX = ['#3a2a24', '#8a4a2a', '#e8c070', '#f4f0e8', '#d84a4a', '#4a6ad8', '#6ac46a', '#c46ad8', '#ff9ac0', '#2a2a3a'];

export function setPixelEnabled(on: boolean) { enabled = on; }
export const pixelCharacters = () => Object.values(M?.characters ?? {}).map((c) => ({ cls: c.class, gender: c.gender === 'male' ? 'm' : 'f' }));

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
  const want = `${line}_${L.gender === 'm' ? 'male' : 'female'}`;
  return line && M.characters[want] ? want : undefined;
}
export function pixelSupports(L: HeroLookDraw) {
  const id = ready ? character(L) : undefined;
  if (!id || !(L.wtype in WEAPON)) return false;
  const w = WEAPON[L.wtype];
  return !w || !!M!.weapons[w]?.frames[id];
}

function styleFor(L: HeroLookDraw, gender: string): string | undefined {
  const names = Object.keys(M!.hair).filter((n) => !M!.hair[n].gender || M!.hair[n].gender === gender);
  names.sort((a, b) => (STYLE_ORDER.indexOf(a) + 99) % 99 - (STYLE_ORDER.indexOf(b) + 99) % 99);
  return names.length ? names[L.hair % names.length] : undefined;
}

// ── hair palette swap: the four key colours → a light / mid / shadow / deep ramp of the chosen hair colour
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function ramp(color: number): number[][] | null {
  if (color % HAIR_HEX.length === 3) return null;
  const base = hex(HAIR_HEX[color % HAIR_HEX.length]);
  return [mix(base, [255, 255, 255], 0.35), base, mix(base, [0, 0, 0], 0.28), mix(base, [0, 0, 0], 0.55)];
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
  const [state, t] = clip(pose);
  const name = pickFrame(M!.animations, state, t);
  const f = c.frames[name];
  if (!f) return false;
  const w = WEAPON[L.wtype];
  const wfile = w ? M!.weapons[w].frames[id]?.[name] : undefined;
  const showW = !!wfile && f.weapon?.visible !== false;
  const style = styleFor(L, c.gender);
  const hp = style ? M!.hair[style].poses[f.head.pose] : undefined;
  const piv = hp?.pivot ?? (style ? M!.hair[style].pivot : undefined) ?? [0, 0];
  const hx = f.head.point[0] - piv[0], hy = f.head.point[1] - piv[1];
  const k = HEIGHT / M!.canvas.bodyHeight;
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
