// 기본 이펙트 조립기: PXF 공방에서 만든 기본 이펙트 시트(src/assets/fx/sheets, 64px 칸 가로 한 줄)를 색·크기·회전·반복·속도를 바꿔 그립니다.
// 시트는 회색 기준색 5단(KEY)으로만 그려져 있어 RAMPS의 5색으로 정확히 바꿔 입힙니다(머리 키 색과 같은 방식).
// 어떤 스킬이 어떤 기본 이펙트를 어떻게 쓰는지는 src/assets/fx/assembly.json(조립 데이터)에 있습니다. 새 스킬은 그림이 아니라 조립 데이터로 만듭니다.
// 기본 이펙트 원본 그래프: src/assets/fx/pxf/<id>.pxf.json(tools/fx/pxf-graphs.mjs). 표: src/assets/fx/library.json.
import type { Element } from '../game/types.ts';

const FILES = import.meta.glob('../assets/fx/sheets/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const JSONS = import.meta.glob('../assets/fx/{library,assembly,ramps}.json', { eager: true, import: 'default' }) as Record<string, unknown>;

interface LibEntry { name: string; frames: number; fps: number; loop: boolean; cell: number; logical: number; impact: number; anchor: number }
const LIBRARY = (JSONS['../assets/fx/library.json'] ?? {}) as Record<string, LibEntry>;
export const fxInfo = (id: string): LibEntry | undefined => LIBRARY[id];
/** the base effect ids, in library order */
export const FX_IDS = Object.keys(LIBRARY);

/** 5 colours, dark (outline) → light, for the five key greys */
const RAMP_FILE = (JSONS['../assets/fx/ramps.json'] ?? { key: [], ramps: {} }) as { key: string[]; ramps: Record<string, string[]> };
export const RAMPS: Record<string, string[]> = RAMP_FILE.ramps;
export const ELEMENT_RAMP: Record<Element, string> = {
  neutral: 'steel', fire: 'fire', water: 'ice', wind: 'bolt', earth: 'earth', poison: 'poison', holy: 'holy', shadow: 'dark', ghost: 'ghost', undead: 'dark',
};

const KEY = RAMP_FILE.key.map((h) => parseInt(h.slice(1, 3), 16));
const images = new Map<string, HTMLImageElement>();
const tinted = new Map<string, HTMLCanvasElement>();
function image(id: string): HTMLImageElement | null {
  let img = images.get(id);
  if (!img) {
    const url = FILES[`../assets/fx/sheets/${id}.png`];
    if (!url) return null;
    img = new Image(); img.src = url; images.set(id, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}
/** the sheet of `id` in `ramp` (cached); null until the image has loaded */
export function fxSheet(id: string, ramp: string): HTMLCanvasElement | null {
  const k = id + '|' + ramp;
  const hit = tinted.get(k);
  if (hit) return hit;
  const img = image(id);
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d')!;
  x.drawImage(img, 0, 0);
  const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
  const R = (RAMPS[ramp] ?? RAMPS.steel).map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    let b = 0;
    for (let j = 1; j < 5; j++) if (Math.abs(d[i] - KEY[j]) < Math.abs(d[i] - KEY[b])) b = j;
    d[i] = R[b][0]; d[i + 1] = R[b][1]; d[i + 2] = R[b][2];
  }
  x.putImageData(im, 0, 0);
  tinted.set(k, c);
  return c;
}

/** one played base effect */
export interface FxPlay { id: string; ramp: string; scale?: number; rot?: number; flip?: boolean; speed?: number; hold?: number; alpha?: number }
/** how long it shows (ms); a loop shows for `hold` */
export function fxDuration(p: FxPlay): number {
  const L = LIBRARY[p.id];
  if (!L) return 0;
  const once = (L.frames / L.fps) * 1000 / (p.speed ?? 1);
  return L.loop ? p.hold ?? once : once;
}
/** draws frame `age` ms in, with the effect's anchor on (x, y); world units are hero pixels (a hero is 48 tall) */
export function drawFx(ctx: CanvasRenderingContext2D, p: FxPlay, x: number, y: number, age: number): void {
  const L = LIBRARY[p.id];
  if (!L || age < 0) return;
  const sheet = fxSheet(p.id, p.ramp);
  if (!sheet) return;
  let f = Math.floor((age * L.fps * (p.speed ?? 1)) / 1000);
  if (L.loop) f %= L.frames; else if (f >= L.frames) return;
  const s = (L.logical / L.cell) * (p.scale ?? 1);
  ctx.save();
  ctx.translate(x, y);
  if (p.rot) ctx.rotate(p.rot);
  ctx.scale(p.flip ? -s : s, s);
  ctx.imageSmoothingEnabled = false;
  if (p.alpha !== undefined) ctx.globalAlpha *= p.alpha;
  ctx.drawImage(sheet, f * L.cell, 0, L.cell, L.cell, -L.cell / 2, -L.cell * L.anchor, L.cell, L.cell);
  ctx.restore();
}

// ───────── assembly (조립 데이터)
/** one layer of an assembled effect: which base effect, where, in which colour, how big, when */
export interface FxLayer {
  fx: string;
  /** ramp name, or '$element' (the skill's element), '$hit' (element, steel when neutral) */
  ramp?: string;
  /** target / caster: the unit's feet ('feet') or body middle ('body'); point: the skill's ground point */
  at?: 'target' | 'caster' | 'point';
  on?: 'feet' | 'body';
  dx?: number; dy?: number; scale?: number; rot?: number; rotJitter?: number;
  /** 'source': mirrored when the source stands to the right of the target */
  flip?: 'source' | boolean;
  speed?: number; delay?: number; hold?: number; layer?: 'ground' | 'top';
  /** keep following the unit */
  follow?: boolean;
  /** repeat: count (or 'hits' = the skill's hit count) every `gap` ms, scattered within `scatter` px (or 'radius') */
  repeat?: number | 'hits'; gap?: number; scatter?: number | 'radius';
}
export const ASSEMBLY = (JSONS['../assets/fx/assembly.json'] ?? { hits: {}, crit: [], skills: {} }) as { hits: Record<string, FxLayer[]>; crit: FxLayer[]; skills: Record<string, FxLayer[]>; cast?: FxLayer };
export function rampOf(r: string | undefined, element: Element): string {
  if (!r || r === '$hit') return element === 'neutral' ? 'steel' : ELEMENT_RAMP[element];
  if (r === '$element') return ELEMENT_RAMP[element];
  return r;
}

/** one base effect of an expanded assembly: what to draw, when (ms after the event), on whom and where on them */
export interface FxInstance { play: FxPlay; delay: number; dur: number; layer: 'ground' | 'top'; at: 'target' | 'caster' | 'point'; on: 'feet' | 'body'; dx: number; dy: number; follow: boolean }
/**
 * expands assembly layers into scheduled base effects (repeats, scatter, jitter, colour). The field (field.ts playAsm) and the
 * workshop stage (src/stage/asset-stage.ts) both place the result, so the workshop shows exactly what the game draws.
 * sourceRight: the source stands to the right of the target (layers with flip 'source' mirror).
 */
export function expandAssembly(layers: FxLayer[], c: { element: Element; hits?: number; radius?: number; sourceRight?: boolean; maxRepeat?: number }, rand = Math.random): FxInstance[] {
  const out: FxInstance[] = [];
  for (const L of layers) {
    const info = LIBRARY[L.fx];
    if (!info) continue;
    let n = L.repeat === 'hits' ? Math.max(1, c.hits ?? 1) : L.repeat ?? 1;
    if (c.maxRepeat) n = Math.min(n, c.maxRepeat);
    const scatter = L.scatter === 'radius' ? (c.radius ?? 60) * 0.8 : L.scatter ?? 0;
    for (let i = 0; i < n; i++) {
      const play: FxPlay = {
        id: L.fx, ramp: rampOf(L.ramp, c.element), scale: L.scale, speed: L.speed, hold: L.hold,
        rot: (((L.rot ?? 0) + (L.rotJitter ? (rand() * 2 - 1) * L.rotJitter : 0)) * Math.PI) / 180,
        flip: L.flip === 'source' ? !!c.sourceRight : !!L.flip,
      };
      out.push({
        play, delay: (L.delay ?? 0) + i * (L.gap ?? 0), dur: fxDuration(play), layer: L.layer ?? 'top', at: L.at ?? 'target',
        on: L.on ?? (info.anchor === 0.5 ? 'body' : 'feet'), follow: !!L.follow,
        dx: (L.dx ?? 0) + (scatter ? (rand() * 2 - 1) * scatter : 0), dy: (L.dy ?? 0) + (scatter ? (rand() * 2 - 1) * scatter * 0.5 : 0),
      });
    }
  }
  return out;
}

