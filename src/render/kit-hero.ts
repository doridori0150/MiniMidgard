// 에셋 공방 영웅 (asset-kit 회귀 용사 영웅 결, `minimidgard.kit-hero/1` — tools/art/import-kit-heroes.py): one whole figure
// per frame with the weapon drawn in the hand, facing right (left is mirrored). The workshop hands them over at its own size
// (about 130 px tall); the game fits them to the field (asset-kit rule B8) with one art-pixel size for every kit hero, so their
// heights keep their ratio. 설정 → 캐릭터 그림 D (시험). Motions not delivered yet show the battle idle; a fall falls back to
// the other renderers.
import type { HeroLookDraw, Pose } from './hero.ts';
import { clip } from './whole.ts';
import { attackContact } from './pixel.ts';

interface Anim { frames: string[]; durations: number[]; duration: number; loop: boolean; hitFrame?: number; size?: [number, number]; pivot?: [number, number] }
interface Char { class: string; gender: string; bodyHeight: number; size: [number, number]; pivot: [number, number]; animations: Record<string, Anim> }
interface Manifest { schema: string; characters: Record<string, Char> }

const MAN = import.meta.glob('../assets/kit-heroes/manifest.json', { eager: true, import: 'default' }) as Record<string, Manifest>;
const FILES = import.meta.glob('../assets/kit-heroes/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const M: Manifest | undefined = Object.values(MAN)[0];
const key = (file: string) => '../assets/kit-heroes/' + file;
const imgs = new Map<string, HTMLImageElement>();
let enabled = false;
let loading: Promise<void> | null = null;

/** field units per art pixel: today's heroes stand 59 units (pixel p2: 48 px × 76/62); the workshop's 134 px hero stands about 60 */
export const KIT_UNIT_PER_PX = 59 / 132;

export function setKitHeroEnabled(on: boolean) { enabled = on; if (on) loadKitHeroes(); }
/** `moving`: walk and attack delivered (the rest borrow the battle idle) */
export const kitCharacters = () => Object.values(M?.characters ?? {}).map((c) => ({ cls: c.class, gender: c.gender === 'male' ? 'm' : 'f', moving: !!(c.animations.walk && c.animations.attack) }));

/** decode the frames once, the first time the art is switched on */
export function loadKitHeroes(): Promise<void> {
  if (!M) return Promise.resolve();
  return (loading ??= Promise.all(Object.entries(FILES).map(([path, url]) => {
    const img = new Image(); img.src = url;
    return img.decode().then(() => { imgs.set(path, img); }, () => {});
  })).then(() => {}));
}

function character(L: HeroLookDraw): Char | undefined {
  if (!M || !enabled) return undefined;
  const c = M.characters[`${L.cls}_${L.gender === 'm' ? 'male' : 'female'}`];
  return c && c.animations.idle?.frames.every((f) => imgs.has(key(f))) ? c : undefined;
}
export const kitSupports = (L: HeroLookDraw) => !!character(L);

/** a frame scaled up by a whole number with no smoothing (cached): drawn smoothed from there, a non-integer size stays sharp */
const big = new Map<string, HTMLCanvasElement>();
function upscaled(file: string, img: HTMLImageElement, n: number): CanvasImageSource {
  if (n <= 1) return img;
  const k = file + '@' + n;
  let c = big.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = img.width * n; c.height = img.height * n;
    const x = c.getContext('2d')!;
    x.imageSmoothingEnabled = false;
    x.drawImage(img, 0, 0, c.width, c.height);
    big.set(k, c);
  }
  return c;
}

export function drawKitHero(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose): boolean {
  const c = character(L);
  if (!c) return false;
  let [state] = clip(pose);
  if (state === 'dead' && !c.animations.dead) return false;
  let t = pose.t;
  // the field's pose clocks (field.ts): idle / walk / cast / sit run on the shared clock, attack / dead on time in the state
  // (pose.t, = since). clip() pins hurt / dead / sit to 0 and squeezes attack into 280 ms, so the clocks are read here instead.
  if (state === 'attack' && c.animations.attack) {
    // as pixel.ts 'uniform' (the game today): the whole swing scaled so the contact frame (`hitFrame`) starts when world.ts
    // lands the hit (pose.dur × attackContact); without a hitFrame the middle of the motion meets it
    const a = c.animations.attack;
    const hit = a.hitFrame != null ? a.durations.slice(0, a.hitFrame).reduce((x, y) => x + y, 0) : a.duration / 2;
    t = (pose.t / (Math.max(1, pose.dur ?? 280) * attackContact(L.wtype))) * hit;
  } else if (state === 'cast' && c.animations.cast_start) {
    // a one-shot lead-in before the looping cast, timed from when the cast began
    const since = pose.since ?? pose.t, lead = c.animations.cast_start.duration;
    if (since < lead) { state = 'cast_start'; t = since; } else t = since - lead;
  } else if (state === 'sit' && c.animations.sit && !c.animations.sit.loop) t = pose.since ?? pose.t; // sit down once, then hold
  else if (state === 'hurt' && c.animations.hurt) t = 0; // the field shows hurt for 80 ms after a hit (no clock of its own yet): its first frame
  const a = c.animations[state] ?? c.animations.idle; // an undelivered motion borrows the idle (on the pose's clock)
  let rest = Math.max(0, Math.floor(t));
  rest = a.loop ? rest % a.duration : Math.min(rest, a.duration - 1);
  let i = a.frames.length - 1;
  for (let j = 0; j < a.frames.length; j++) { if (rest < a.durations[j]) { i = j; break; } rest -= a.durations[j]; }
  const file = a.frames[i];
  const img = imgs.get(key(file));
  if (!img) return false;
  const s = KIT_UNIT_PER_PX;
  const m = ctx.getTransform(), dev = Math.hypot(m.a, m.b) || 1;
  // sharp scaling: nearest up to the whole number just above the on-screen size, then the browser smooths down to it
  const n = Math.min(3, Math.max(1, Math.ceil(dev * s - 0.05)));
  ctx.save();
  ctx.scale(pose.facing, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const [w, h] = a.size ?? c.size, [px, py] = a.pivot ?? c.pivot; // each motion is cropped to its own box
  ctx.drawImage(upscaled(file, img, n), -px * s, -py * s, w * s, h * s);
  ctx.restore();
  return true;
}
