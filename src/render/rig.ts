// Painted cut-out rig: heroes assembled from Codex-painted parts by the manifest Codex designed with them
// (docs/art/rig-codex: PLAN.md, manifest.json, schema minimidgard.cutout/1). A node tree with slots, pivots and
// anchors, keyed animations per state. This is a port of the reference assembler docs/art/rig-codex/verify.py —
// keep the two in step, so what Codex verified is what the game draws.
import type { WeaponType } from '../game/types.ts';
import { BOW_RELEASE, MELEE_CONTACT } from '../game/world.ts';
import type { HeroLookDraw, Pose } from './hero.ts';
import { drawSprite, loadSprites, spriteBounds, spriteSupports } from './sprite.ts';
import { drawWhole, loadWhole, wholeSupports } from './whole.ts';
import { drawPixel, loadPixel, pixelSupports } from './pixel.ts';
export { spriteBounds as rigBounds };

type V2 = [number, number];
interface PartDef { file: string; size: V2; pivot: V2; anchors: Record<string, V2>; z: number }
interface NodeDef { parent: string | null; offset?: V2; part?: string; slot?: string; anchor?: string; angle?: number; worldAngle?: number; scale?: V2; visible?: boolean; z?: number }
interface Anim { duration: number; loop: boolean; keys: { time: number; nodes: Record<string, Partial<NodeDef>> }[]; events?: { time: number; name: string }[] }
interface Manifest {
  canvas: { origin: V2; referenceHeight: number };
  parts: Record<string, PartDef>;
  nodes: Record<string, NodeDef>;
  outfits: Record<string, Record<string, string>>;
  animations: Record<string, Anim>;
}

const MAN = import.meta.glob('../assets/cutout/manifest.json', { eager: true, import: 'default' }) as Record<string, Manifest>;
const FILES = import.meta.glob('../assets/cutout/parts/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const M: Manifest | undefined = Object.values(MAN)[0];
const imgs = new Map<string, HTMLImageElement>();
let ready = false;

/** field units the assembled hero stands (the code-drawn hero is ~74) */
const HEIGHT = 76;
/** for dev tools: assembled height in manifest px and the manifest→field-unit factor drawRigHero applies */
export const RIG_METRICS = { height: M?.canvas.referenceHeight ?? 236, sheetToUnits: (M?.canvas.referenceHeight ?? 236) / HEIGHT };

export function loadRig(): Promise<void> {
  const sprites = Promise.all([loadSprites(), loadWhole(), loadPixel()]).then(() => {});
  if (!M) return sprites;
  const jobs: Promise<void>[] = [];
  for (const [path, url] of Object.entries(FILES)) {
    const name = path.match(/parts\/([^/]+)\.png$/)?.[1];
    if (!name) continue;
    const img = new Image(); img.src = url;
    jobs.push(img.decode().then(() => { imgs.set(name, img); }, () => {}));
  }
  return Promise.all([...jobs, sprites]).then(() => { ready = Object.values(M.parts).every((p) => imgs.has(partName(p))); });
}
const partName = (p: PartDef) => p.file.replace(/^parts\//, '').replace(/\.png$/, '');

/** game class → manifest outfit (classes without painted outfits keep the code-drawn hero) */
const OUTFIT: Partial<Record<string, string>> = { novice: 'novice', swordsman: 'swordsman', knight: 'swordsman' };
/** game weapon → painted weapon part; null = empty-handed. Missing = no art yet, so the code hero is used */
const WEAPON: Partial<Record<WeaponType, string | null>> = { none: null, dagger: 'dagger', katar: 'dagger', sword: 'sword', sword2h: 'sword' };
/** game headgear looks with painted parts */
const HEADGEAR: Record<string, string> = { leaf: 'leaf', hairpin: 'hairpin' };

/** painted frame sprites (v4) win wherever they exist; the cut-out rig stays as the fallback and for comparison */
export function rigSupports(L: HeroLookDraw) {
  return pixelSupports(L) || wholeSupports(L) || spriteSupports(L) || cutoutSupports(L);
}
export function cutoutSupports(L: HeroLookDraw) {
  return ready && !!M && !!OUTFIT[L.cls] && !!M.outfits[OUTFIT[L.cls]!] && L.wtype in WEAPON;
}

// ── 2D affine matrices [a, b, c, d, e, f], angles clockwise degrees with y down (the canvas convention)
type Mat = [number, number, number, number, number, number];
const mul = (p: Mat, q: Mat): Mat => [
  p[0] * q[0] + p[2] * q[1], p[1] * q[0] + p[3] * q[1],
  p[0] * q[2] + p[2] * q[3], p[1] * q[2] + p[3] * q[3],
  p[0] * q[4] + p[2] * q[5] + p[4], p[1] * q[4] + p[3] * q[5] + p[5],
];
const mat = (x = 0, y = 0, angle = 0, sx = 1, sy = 1): Mat => {
  const r = angle * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [c * sx, s * sx, -s * sy, c * sy, x, y];
};

/** the node table at time t of an animation: linear numbers, slot/visible step at the key (verify.py `sample`) */
function sample(m: Manifest, state: string, t: number): Record<string, NodeDef> {
  const a = m.animations[state] ?? m.animations.idle;
  t = a.loop ? ((t % a.duration) + a.duration) % a.duration : Math.min(Math.max(0, t), a.duration);
  let lo = a.keys[0], hi = a.keys[a.keys.length - 1];
  for (let i = 0; i + 1 < a.keys.length; i++) if (a.keys[i].time <= t && t <= a.keys[i + 1].time) { lo = a.keys[i]; hi = a.keys[i + 1]; break; }
  const u = (t - lo.time) / Math.max(1, hi.time - lo.time);
  const out: Record<string, NodeDef> = {};
  for (const [name, rest] of Object.entries(m.nodes)) {
    const A = { ...rest, ...lo.nodes[name] }, B = { ...rest, ...hi.nodes[name] };
    if (u >= 1) { out[name] = B; continue; }
    const o: NodeDef = { ...A };
    const v2 = (k: 'offset' | 'scale', d: V2) => { const p = A[k] ?? d, q = B[k] ?? d; o[k] = [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]; };
    v2('offset', [0, 0]); v2('scale', [1, 1]);
    o.angle = (A.angle ?? 0) + ((B.angle ?? 0) - (A.angle ?? 0)) * u;
    if (A.worldAngle !== undefined && B.worldAngle !== undefined) o.worldAngle = A.worldAngle + (B.worldAngle - A.worldAngle) * u;
    out[name] = o;
  }
  return out;
}

/** game pose → manifest animation and time, lining the painted contact/release keys up with the sim's hit moment */
function clip(m: Manifest, pose: Pose, wtype: WeaponType): [string, number] {
  switch (pose.state) {
    case 'walk': return ['walk', pose.t];
    case 'attack': {
      const name = wtype === 'bow' ? 'bow' : 'melee';
      const a = m.animations[name];
      const ev = a.events?.[0]?.time ?? a.duration / 2;
      const hit = wtype === 'bow' ? BOW_RELEASE : MELEE_CONTACT;
      const dur = Math.max(hit + 1, pose.dur ?? hit * 2);
      const t = pose.t;
      return [name, t < hit ? t / hit * ev : ev + (t - hit) / (dur - hit) * (a.duration - ev)];
    }
    case 'cast': {
      // hold the channelling pose, swaying between the raise and release keys
      const ks = m.animations.cast.keys;
      return ['cast', (ks[1].time + ks[2].time) / 2 + Math.sin(pose.t / 220) * (ks[2].time - ks[1].time) / 2];
    }
    case 'sit': return ['sit', m.animations.sit.duration];
    case 'hurt': return ['hurt', m.animations.hurt.keys[1]?.time ?? 100];
    case 'dead': return ['dead', pose.t];
    default: return ['idle', pose.t];
  }
}

/** multiply tints over the cream hair per game hair colour (state.ts HAIR_COLORS order), lifted a step so the
 *  painted shading and outline survive the multiply; null = the painted cream as is */
const HAIR_TINT: (string | null)[] = ['#6a5048', '#a8643c', '#edbb60', null, '#d95250', '#5986d0', '#85af6c', '#aa6bc5', '#e886a4', '#59535d'];

// hair colour by multiply over the cream base, alpha restored (manifest renderRules.tint)
const tinted = new Map<string, HTMLCanvasElement>();
function tint(name: string, color: string): CanvasImageSource | undefined {
  const img = imgs.get(name);
  if (!img) return undefined;
  const k = name + color;
  let c = tinted.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d')!;
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0);
    tinted.set(k, c);
  }
  return c;
}

export function drawRigHero(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose): boolean {
  // pixel heroes when 설정 picks C, else whole-figure sprites (the lineup art, one painted figure per frame), then the assembled sets
  if (drawPixel(ctx, L, pose)) return true;
  if (drawWhole(ctx, L, pose)) return true;
  if (drawSprite(ctx, L, pose)) return true;
  return drawCutout(ctx, L, pose);
}
export function drawCutout(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose): boolean {
  if (!cutoutSupports(L) || !M) return false;
  const outfit = M.outfits[OUTFIT[L.cls]!];
  const look: Record<string, string | null> = {
    weapon: WEAPON[L.wtype] ?? null,
    head_top: L.headTop && HEADGEAR[L.headTop] || null,
    head_mid: L.headMid && HEADGEAR[L.headMid] || null,
    head_low: L.headLow && HEADGEAR[L.headLow] || null,
  };
  const [state, t] = clip(M, pose, L.wtype);
  const nodes = sample(M, state, t);
  const mats = new Map<string, Mat>(), chosen = new Map<string, string | null>();
  const draws: { part: string; m: Mat; z: number; node: string }[] = [];
  const visit = (name: string): Mat => {
    const done = mats.get(name);
    if (done) return done;
    const n = nodes[name];
    const pm = n.parent ? visit(n.parent) : mat();
    const pid = n.parent ? chosen.get(n.parent) : null;
    const id = n.slot ? (n.slot in outfit ? outfit[n.slot] : look[n.slot] ?? null) : n.part ?? null;
    chosen.set(name, id);
    let [x, y] = n.offset ?? [0, 0];
    if (n.anchor && pid) {
      const pp = M.parts[pid], a = pp.anchors[n.anchor];
      if (a) { x += a[0] - pp.pivot[0]; y += a[1] - pp.pivot[1]; }
    }
    const [sx, sy] = n.scale ?? [1, 1];
    let m = mul(pm, mat(x, y, n.angle ?? 0, sx, sy));
    if (n.worldAngle !== undefined) m = mat(m[4], m[5], n.worldAngle, Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3]));
    mats.set(name, m);
    if (id && n.visible !== false && M.parts[id]) {
      const p = M.parts[id];
      draws.push({ part: id, m: mul(m, mat(-p.pivot[0], -p.pivot[1])), z: n.z ?? p.z, node: name });
    }
    return m;
  };
  for (const name of Object.keys(nodes)) visit(name);
  draws.sort((a, b) => a.z - b.z || (a.node < b.node ? -1 : a.node > b.node ? 1 : 0));

  const hc = HAIR_TINT[L.hairColor % HAIR_TINT.length];
  const k = HEIGHT / M.canvas.referenceHeight;
  ctx.save();
  ctx.scale(pose.facing * k, k);                // the art faces right; mirror the whole figure for facing left
  ctx.translate(-M.canvas.origin[0], -M.canvas.origin[1]);
  for (const d of draws) {
    const p = M.parts[d.part];
    const src = hc && d.node.startsWith('hair_') ? tint(partName(p), hc) : imgs.get(partName(p));
    if (!src) continue;
    ctx.save();
    ctx.transform(...d.m);
    ctx.drawImage(src, 0, 0, p.size[0], p.size[1]);
    ctx.restore();
  }
  ctx.restore();
  return true;
}
