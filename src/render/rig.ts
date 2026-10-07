// Painted cut-out rig: heroes assembled from Codex-painted parts (src/assets/rig/<set>/*.png) and animated
// with the same pose curves as the code-drawn hero. Headgear and weapons hang off fixed joints, so any
// accessory works for every class and every frame once its anchor is set here.
import type { WeaponType } from '../game/types.ts';
import { HAIR_COLORS } from '../game/state.ts';
import { computePose, type HeroLookDraw, type Pose } from './hero.ts';
import { J } from './rigTemplate.ts';

const FILES = import.meta.glob('../assets/rig/*/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const parts = new Map<string, HTMLImageElement>();
let ready = false;

// v2: parts cut from one template-aligned painting (tools/rig-cut.html) — offsets in template pixels
const R2_FILES = import.meta.glob('../assets/rig2/*/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const R2_META = import.meta.glob('../assets/rig2/*/parts.json', { eager: true, import: 'default' }) as Record<string, Record<string, { x: number; y: number }>>;
interface Piece { img: HTMLImageElement; x: number; y: number }
const sets2 = new Map<string, Record<string, Piece>>();
const SET2: Partial<Record<string, string>> = { novice: 'novice', swordsman: 'swordsman', knight: 'swordsman' };

export function loadRig(): Promise<void> {
  const v2: Promise<void>[] = [];
  for (const [path, url] of Object.entries(R2_FILES)) {
    const m = path.match(/rig2\/([^/]+)\/([^/.]+)\.png$/);
    if (!m) continue;
    const [, set, name] = m;
    const meta = R2_META[`../assets/rig2/${set}/parts.json`]?.[name];
    if (!meta) continue;
    const img = new Image(); img.src = url;
    v2.push(img.decode().then(() => {
      const bag = sets2.get(set) ?? {};
      bag[name] = { img, x: meta.x, y: meta.y };
      sets2.set(set, bag);
    }, () => {}));
  }
  return Promise.all([loadRigV1(), ...v2]).then(() => {});
}

function loadRigV1(): Promise<void> {
  const jobs: Promise<void>[] = [];
  for (const [path, url] of Object.entries(FILES)) {
    const m = path.match(/rig\/([^/]+)\/([^/.]+)\.png$/);
    if (!m) continue;
    const img = new Image();
    img.src = url;
    jobs.push(img.decode().then(() => { parts.set(m[2], img); }, () => {}));
  }
  return Promise.all(jobs).then(() => { ready = parts.has('head'); });
}
export function rigReady() { return ready; }

/** classes that have painted outfit parts so far */
const OUTFIT: Partial<Record<string, { torso: string; armF: string; armB: string }>> = {
  novice: { torso: 'torso', armF: 'armF', armB: 'armB' },
  swordsman: { torso: 'torso_sw', armF: 'arm_sw', armB: 'arm_sw' },
  knight: { torso: 'torso_sw', armF: 'arm_sw', armB: 'arm_sw' },
};
export function rigSupports(L: HeroLookDraw) {
  const s2 = SET2[L.cls];
  return (!!s2 && !!sets2.get(s2)?.torso) || (ready && !!OUTFIT[L.cls]);
}

const WEAPON: Partial<Record<WeaponType, string>> = { dagger: 'dagger', sword: 'sword', sword2h: 'sword', katar: 'dagger' };
/** headgear looks with painted parts: [part, joint, x, y, width] in sheet px relative to the head centre-top */
const HEADGEAR: Record<string, [string, number, number, number]> = {
  leaf: ['leaf', 4, -8, 120],
  hairpin: ['hairpin', 70, 70, 110],
  cap: ['beret', 6, 18, 250],
};

// ── tinting & shading caches (hair colour by multiply, back limbs one shade darker)
const cache = new Map<string, HTMLCanvasElement>();
function variant(name: string, key: string, paint: (c: CanvasRenderingContext2D, img: HTMLImageElement) => void): CanvasImageSource | undefined {
  const img = parts.get(name);
  if (!img) return undefined;
  const k = name + '|' + key;
  let c = cache.get(k);
  if (!c) {
    c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d')!;
    x.drawImage(img, 0, 0);
    paint(x, img);
    cache.set(k, c);
  }
  return c;
}
const hair = (name: string, color: string) => variant(name, color, (x, img) => {
  x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, img.width, img.height);
  x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0);
});
const shaded = (name: string) => variant(name, 'shade', (x, img) => {
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(30,20,50,0.22)'; x.fillRect(0, 0, img.width, img.height);
});

// ── skeleton, in sheet pixels with the origin at the feet
/** per-part scale fixes: the painter drew parts at slightly different scales (matched against its own reference) */
const PART_SCALE: Record<string, number> = { head: 1.3, hairF: 1.3, hairB: 1.3, torso: 1.12, torso_sw: 1.04, armF: 0.9, armB: 0.9, arm_sw: 0.9, legF: 0.92, legB: 0.92 };
const SHEET_H = 640;                      // assembled height used for the field-unit factor
const HAND = [0.44, 0.84];                // fist position inside an arm part (fraction of w, h)
const DEG = Math.PI / 180;
/** for dev tools: assembled height in sheet px and the sheet→field-unit factor drawRigHero applies */
export const RIG_METRICS = { height: 640, sheetToUnits: 640 / 76 };

function at(ctx: CanvasRenderingContext2D, img: CanvasImageSource | undefined, w: number, h: number, ax: number, ay: number) {
  if (img) ctx.drawImage(img, -w * ax, -h * ay, w, h);
}
function size(name: string): [number, number] {
  const p = parts.get(name);
  const k = PART_SCALE[name] ?? 1;
  return p ? [p.width * k, p.height * k] : [0, 0];
}

export function drawRigHero(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose): boolean {
  const s2 = SET2[L.cls];
  const set = s2 ? sets2.get(s2) : undefined;
  if (set?.torso) { drawRig2(ctx, L, pose, set); return true; }
  const o = OUTFIT[L.cls];
  if (!ready || !o) return false;
  const P = computePose(pose, L.wtype);
  const k = 76 / SHEET_H;
  const U = SHEET_H / 74;                 // code-pose units → sheet px
  const hc = HAIR_COLORS[L.hairColor % HAIR_COLORS.length];
  ctx.save();
  ctx.scale(pose.facing * k, k);
  if (pose.state === 'dead') { ctx.translate(-30, -40); ctx.rotate(-Math.PI / 2 + 0.05); ctx.translate(0, 200); }
  ctx.translate(0, P.bob * U);
  ctx.rotate(P.lean * DEG);
  const sit = pose.state === 'sit';

  // layout from the (scaled) part sizes: short sturdy legs in an A-stance, the chin sunk into the collar
  const [lw, lh] = size('legF');
  const hipY = -lh * 0.8;
  const [tw, th] = size(o.torso);
  const torsoBottom = hipY + lh * 0.2;
  const torsoTop = torsoBottom - th;
  const [hw, hh] = size('head');
  const neckY = torsoTop + hh * 0.2;
  const headTop = neckY - hh;
  const shoulders = [[tw * 0.27, torsoTop + th * 0.17], [-tw * 0.3, torsoTop + th * 0.17]] as const;
  const relaxed = pose.state !== 'attack' && pose.state !== 'cast';
  const front = P.front + (relaxed ? 10 : 0), back = P.back - (relaxed ? 16 : 0); // weapon a bit forward, free hand out on the hip
  void lw;

  const limb = (name: string, img: CanvasImageSource | undefined, x: number, y: number, ang: number) => {
    const [w, h] = size(name);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-ang * DEG); at(ctx, img, w, h, 0.5, 0.06); ctx.restore();
  };
  const leg = (isFront: boolean) => {
    const name = isFront ? 'legF' : 'legB';
    const stance = isFront ? 7 : -7;
    const swing = (isFront ? P.legA : P.legB) * 5 + stance - (sit ? 70 : 0);
    const lift = pose.state === 'walk' ? Math.max(0, P.lift * (isFront ? 1 : -1)) * 14 : 0;
    const [w, h] = size(name);
    ctx.save(); ctx.translate(isFront ? 26 : -26, hipY - lift + (sit ? 90 : 0)); ctx.rotate(-swing * DEG);
    at(ctx, isFront ? parts.get(name) : shaded(name), w, h, 0.5, 0.02); ctx.restore();
  };
  const hand = (shoulder: readonly [number, number], ang: number, name: string): [number, number] => {
    const [w, h] = size(name);
    const lx = (HAND[0] - 0.5) * w, ly = HAND[1] * h - 0.06 * h;
    const a = -ang * DEG;
    return [shoulder[0] + lx * Math.cos(a) - ly * Math.sin(a), shoulder[1] + lx * Math.sin(a) + ly * Math.cos(a)];
  };

  // back layer
  limb(o.armB, shaded(o.armB), shoulders[1][0], shoulders[1][1], back);
  leg(false);
  const [hbw, hbh] = size('hairB');
  ctx.save(); ctx.translate(4, headTop - hbh * 0.1); at(ctx, hair('hairB', hc), hbw, hbh, 0.5, 0); ctx.restore();
  // body
  leg(true);
  ctx.save(); ctx.translate(0, torsoBottom); at(ctx, parts.get(o.torso), tw, th, 0.5, 1); ctx.restore();
  // head + hair + headgear
  ctx.save(); ctx.translate(8, neckY); at(ctx, parts.get('head'), hw, hh, 0.5, 1); ctx.restore();
  const [hfw, hfh] = size('hairF');
  ctx.save(); ctx.translate(12, headTop - hfh * 0.24); at(ctx, hair('hairF', hc), hfw, hfh, 0.5, 0); ctx.restore();
  for (const look of [L.headMid, L.headTop]) {
    const g = look ? HEADGEAR[look] : undefined;
    if (!g) continue;
    const [name, gx, gy, gw] = g;
    const [pw, ph] = size(name);
    const s = gw * 1.3 / pw;
    ctx.save(); ctx.translate(8 + gx * 1.3, headTop + gy * 1.3); at(ctx, parts.get(name), pw * s, ph * s, 0.5, 1); ctx.restore();
  }
  // front arm, then the weapon over the fist (an extended arm would otherwise hide a forward-pointing blade)
  limb(o.armF, parts.get(o.armF), shoulders[0][0], shoulders[0][1], front);
  const wname = WEAPON[L.wtype];
  if (wname && pose.state !== 'dead') {
    const [hx, hy] = hand(shoulders[0], front, o.armF);
    const [ww, wh] = size(wname);
    const ws = (wname === 'sword' ? 300 : 200) / ww;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(Math.PI / 2 - P.weapon * DEG);
    at(ctx, parts.get(wname), ww * ws, wh * ws, 0.1, 0.5);
    ctx.restore();
  }
  ctx.restore();
  return true;
}

// ── v2: template-space assembly (joints from rigTemplate.ts; every piece keeps its painted position)
const tinted = new Map<string, HTMLCanvasElement>();
function tint(p: Piece, color: string): CanvasImageSource {
  const k = p.img.src + '|' + color;
  let c = tinted.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = p.img.width; c.height = p.img.height;
    const x = c.getContext('2d')!;
    x.drawImage(p.img, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(p.img, 0, 0);
    tinted.set(k, c);
  }
  return c;
}
const HEADGEAR2: Record<string, [string, number, number, number, number]> = {
  // part, x, y (template px, anchor point), width, anchorY (0 top … 1 bottom)
  leaf: ['leaf', J.head.cx - 6, J.head.cy - J.head.ry + 16, 150, 1],
  hairpin: ['hairpin', J.head.cx + 118, J.head.cy - 96, 140, 0.5],
  cap: ['beret', J.head.cx + 14, J.head.cy - J.head.ry + 96, 330, 1],
};

function drawRig2(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose, set: Record<string, Piece>) {
  const P = computePose(pose, L.wtype);
  const top = J.head.cy - J.head.ry;
  const k = 80 / (J.ground - top);                // ≈ 900 template px → 80 field units
  const hc = HAIR_COLORS[L.hairColor % HAIR_COLORS.length];
  ctx.save();
  ctx.scale(pose.facing * k, k);
  if (pose.state === 'dead') { ctx.translate(-40, -50); ctx.rotate(-Math.PI / 2 + 0.05); ctx.translate(0, 300); }
  ctx.translate(0, P.bob / k);
  ctx.rotate(P.lean * DEG);
  ctx.translate(-J.originX, -J.ground);
  const sit = pose.state === 'sit';
  const piece = (name: string, pivot?: readonly [number, number], ang = 0, img?: CanvasImageSource) => {
    const p = set[name];
    if (!p) return;
    if (pivot && ang) { ctx.save(); ctx.translate(pivot[0], pivot[1]); ctx.rotate(-ang * DEG); ctx.translate(-pivot[0], -pivot[1]); }
    ctx.drawImage(img ?? p.img, p.x, p.y);
    if (pivot && ang) ctx.restore();
  };
  // code-pose angles are relative to its own rest (front 22°, back −12°): apply the difference to the painted rest
  const dF = P.front - 22, dB = P.back + 12;
  const legF = P.legA * 5 - (sit ? 70 : 0), legB = P.legB * 5 - (sit ? 70 : 0);
  if (sit) ctx.translate(0, 120);
  piece('armB', J.shoulderB, dB);
  piece('legB', J.hipB, legB);
  piece('legF', J.hipF, legF);
  piece('torso');
  piece('head');
  if (set.hair) piece('hair', undefined, 0, tint(set.hair, hc));
  for (const look of [L.headMid, L.headTop]) {
    const g = look ? HEADGEAR2[look] : undefined;
    const img = g ? parts.get(g[0]) : undefined;
    if (!g || !img) continue;
    const w = g[3], h = img.height * w / img.width;
    ctx.drawImage(img, g[1] - w / 2, g[2] - h * g[4], w, h);
  }
  piece('armF', J.shoulderF, dF);
  // weapon in the front fist (fist follows the arm's rotation about the shoulder)
  const wname = WEAPON[L.wtype];
  const wimg = wname ? parts.get(wname) : undefined;
  if (wimg && pose.state !== 'dead') {
    const a = -dF * DEG, sx = J.shoulderF[0], sy = J.shoulderF[1], hx = J.handF[0] - sx, hy = J.handF[1] - sy;
    const fx = sx + hx * Math.cos(a) - hy * Math.sin(a), fy = sy + hx * Math.sin(a) + hy * Math.cos(a);
    const len = wname === 'sword' ? 340 : 240, h = wimg.height * len / wimg.width;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.PI / 2 - P.weapon * DEG);
    ctx.drawImage(wimg, -len * 0.1, -h / 2, len, h);
    ctx.restore();
  }
  ctx.restore();
}
