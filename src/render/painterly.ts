// Style probe (test only): Codex's original hand-painted watercolour look (docs/art/style-painterly), switched on with
// ?style=painterly. Two heroes (novice, swordsman line) as whole painted frames with the weapon painted in, and a
// matching meadow kit. Nothing here is loaded or drawn without the flag; the shipped look is unchanged.
import type { HeroLookDraw, Pose } from './hero.ts';

type V2 = [number, number];
interface Anim { frames: string[]; durations: number[]; loop: boolean }
interface Manifest { height: number; characters: Record<string, { canvas: V2; origin: V2; animations: Record<string, Anim> }> }

export const PAINTERLY = typeof location !== 'undefined' && new URLSearchParams(location.search).get('style') === 'painterly';

const MAN = import.meta.glob('../assets/painterly/manifest.json', { eager: true, import: 'default' }) as Record<string, Manifest>;
// lazy: the images are only fetched when the flag is on
const FILES = import.meta.glob('../assets/painterly/**/*.{png,jpg}', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;
const M: Manifest | undefined = Object.values(MAN)[0];
const imgs = new Map<string, HTMLImageElement>();
let ready = false;

/** field units the hero stands (matches the other hero renderers) */
const HEIGHT = 76;
const LINE: Partial<Record<string, string>> = { novice: 'novice', swordsman: 'swordsman', knight: 'swordsman' };

let loading: Promise<void> | undefined;
export function loadPainterly(): Promise<void> {
  if (!PAINTERLY || !M) return Promise.resolve();
  return loading ??= Promise.all(Object.entries(FILES).map(([path, load]) => load().then((url) => {
    const img = new Image(); img.src = url;
    return img.decode().then(() => { imgs.set(path.replace('../assets/painterly/', ''), img); }, () => {});
  }))).then(() => { ready = imgs.size > 0; });
}

/** the painted meadow kit (ground tiles + props), in the shape bg.ts keeps its kits */
export function painterlyKit(): { tiles: Record<string, HTMLImageElement>; props: Record<string, HTMLImageElement> } | undefined {
  if (!ready) return undefined;
  const tiles: Record<string, HTMLImageElement> = {}, props: Record<string, HTMLImageElement> = {};
  for (const [k, img] of imgs) {
    const m = k.match(/^kit\/([^/.]+)\./);
    if (m) (m[1] === 'grass' || m[1] === 'dirt' ? tiles : props)[m[1]] = img;
  }
  return tiles.grass ? { tiles, props } : undefined;
}

export function painterlySupports(L: HeroLookDraw) { return PAINTERLY && ready && !!LINE[L.cls]; }

function frameAt(a: Anim, time: number): string {
  const total = a.durations.reduce((x, y) => x + y, 0);
  let t = Math.max(0, Math.floor(time));
  t = a.loop ? t % total : Math.min(t, total - 1);
  for (let i = 0; i < a.frames.length; i++) { if (t < a.durations[i]) return a.frames[i]; t -= a.durations[i]; }
  return a.frames[a.frames.length - 1];
}

export function drawPainterly(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose): boolean {
  const line = LINE[L.cls];
  if (!PAINTERLY || !ready || !M || !line) return false;
  if (pose.state === 'dead') return false; // no lying frame in the probe: the regular sprite takes it
  const c = M.characters[line];
  const state = pose.state === 'walk' ? 'walk' : pose.state === 'attack' ? 'attack' : 'idle';
  const t = pose.state === 'attack' ? pose.t * 280 / Math.max(1, pose.dur ?? 280) : pose.state === 'walk' || pose.state === 'idle' ? pose.t : 0;
  const img = imgs.get(line + '/' + frameAt(c.animations[state], t));
  if (!img) return false;
  const k = HEIGHT / M.height;
  ctx.save();
  ctx.scale(pose.facing * k, k);
  ctx.drawImage(img, -c.origin[0], -c.origin[1]);
  ctx.restore();
  return true;
}
