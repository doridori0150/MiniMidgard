// Pixel-art heroes (trial, `minimidgard.pixel/1` — docs/art-requests/pixel-hero-trial.md): per frame one body sprite with the
// face and a close-cropped base hair; a hair style adds a back layer (behind the body) and a front layer (over it), placed at
// the frame's head point; the weapon is its own per-frame layer with a finger overlay. Hair colour swaps the four hair key
// colours for a ramp (a palette swap, as old MMOs did). Drawn without smoothing. 설정 → 캐릭터 그림 C.
import type { WeaponType } from '../game/types.ts';
import type { HeroLookDraw, Pose } from './hero.ts';
import { SKILL_CONTACT } from '../game/world.ts';
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
    /** skill id → animation name in `animations` (2nd-job skill motions) */
    skillMotions?: Record<string, string>;
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
const WEAPON: Partial<Record<WeaponType, string | null>> = {
  none: null, sword: 'sword', sword2h: 'sword', staff: 'staff', bow: 'bow', mace: 'mace', dagger: 'dagger', katar: 'dagger', axe: 'axe',
};
/** look.hair (0..7) picks a style by index among the character's gender's styles, in this order */
const STYLE_ORDER = ['ponytail', 'bob', 'long'].flatMap((n) => [n, n + '_p2', n + '_p3']);
/* hair colours: the same per-colour multipliers the B sprites use over their cream hair (whole.ts HAIR_TINT), applied to the four cream keys */

export function setPixelEnabled(on: boolean, v = '') { enabled = on; variant = v; }
export const pixelCharacters = () => {
  const seen = new Set<string>();
  return Object.values(M?.characters ?? {}).map((c) => ({ cls: c.class, gender: c.gender === 'male' || c.gender === 'm' ? 'm' : 'f' }))
    .filter((c) => !seen.has(c.cls + c.gender) && seen.add(c.cls + c.gender));
};
/** art pixels → field units: one fixed pixel size for every pixel hero (a 62 px figure stands HEIGHT tall), so a 2-head hero is shorter */
const unitPerPx = () => HEIGHT / 62;

export function loadPixel(): Promise<void> {
  if (!M) return Promise.resolve();
  return Promise.all(Object.entries(FILES).map(([path, url]) => {
    const img = new Image(); img.src = url;
    return img.decode().then(() => { imgs.set(path, img); }, () => {});
  })).then(() => { ready = imgs.size > 0; });
}

function character(L: HeroLookDraw): string | undefined {
  if (!M || !enabled) return undefined;
  const g = L.gender === 'm' ? 'male' : 'female';
  // a class's own art first (e.g. knight_female_p2), else its 1st-job line's (a knight wears the swordsman set)
  const ids = [L.cls, LINE[L.cls]].filter(Boolean).flatMap((k) => (variant ? [`${k}_${g}_${variant}`, `${k}_${g}`] : [`${k}_${g}`]));
  return ids.find((id) => M.characters[id]);
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
  // the design's own hair comes first (look.hair 0), the rest follow
  if (c.defaultHair && names.includes(c.defaultHair)) return [c.defaultHair, ...names.filter((n) => n !== c.defaultHair)][L.hair % names.length];
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
    // world.ts lands a sword hit at half the swing, a bow release at 0.6 and a spear thrust at 0.47 of it
    const contact = L.wtype === 'bow' ? 0.6 : L.wtype === 'spear' ? 0.47 : 0.5;
    t = pose.t / Math.max(1, pose.dur ?? 280) / contact * hit;
  }
  if (state === 'dead') t = pose.t; // play the fall, then hold the last frame
  const sm = pose.skill ? c.skillMotions?.[pose.skill] : undefined;
  if (sm && table[sm]) {
    // a skill's own motion, played once from its release; the sim lands the hit SKILL_CONTACT ms in, so the art's wind-up
    // (frames before `hitFrame`) is fitted into that and the follow-through plays at its own pace
    const a = table[sm] as typeof table.attack & { hitFrame?: number };
    const st = pose.skillT ?? 0;
    const hit = a.hitFrame != null ? a.durations.slice(0, a.hitFrame).reduce((x, y) => x + y, 0) : 0;
    const at = hit > 0 ? (st < SKILL_CONTACT ? st / SKILL_CONTACT * hit : hit + st - SKILL_CONTACT) : st;
    if (at < a.duration) { state = sm; t = at; }
  }
  if (state === 'cast' && table.cast_start) {
    // a one-shot lead-in (hands come together) before the looping cast; pose.t runs from when the cast began
    const since = pose.since ?? pose.t;
    if (since < table.cast_start.duration) { state = 'cast_start'; t = since; } else t = since - table.cast_start.duration;
  }
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
  const put = (src: CanvasImageSource | undefined, x = 0, y = 0) => { if (src) ctx.drawImage(src, x, y); };
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // crisp pixels: one art pixel covers a whole number of device pixels, and the sprite sits on the device pixel grid
  const m0 = ctx.getTransform(), dev = Math.hypot(m0.a, m0.b) || 1;
  const k = Math.max(1, Math.round(dev * unitPerPx())) / dev;
  ctx.scale(pose.facing * k, k);
  ctx.translate(-M!.canvas.origin[0], -M!.canvas.origin[1]);
  const m1 = ctx.getTransform();
  ctx.setTransform(m1.a, m1.b, m1.c, m1.d, Math.round(m1.e), Math.round(m1.f));
  put(layer(hp?.back, L.hairColor), hx, hy);
  if (showW && f.weapon?.z === 'behind') put(imgs.get(key(wfile!)));
  put(layer(f.image, L.hairColor));
  if (showW && f.weapon?.z !== 'behind') { put(imgs.get(key(wfile!))); put(f.grip ? imgs.get(key(f.grip)) : undefined); }
  put(layer(hp?.front, L.hairColor), hx, hy);
  ctx.restore();
  return true;
}
