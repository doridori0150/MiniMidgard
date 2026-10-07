// Painted cut-out rig: heroes assembled from Codex-painted parts (src/assets/rig/<set>/*.png) and animated
// with the same pose curves as the code-drawn hero. Headgear and weapons hang off fixed joints, so any
// accessory works for every class and every frame once its anchor is set here.
import type { WeaponType } from '../game/types.ts';
import { HAIR_COLORS } from '../game/state.ts';
import { computePose, type HeroLookDraw, type Pose } from './hero.ts';

const FILES = import.meta.glob('../assets/rig/*/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const parts = new Map<string, HTMLImageElement>();
let ready = false;

export function loadRig(): Promise<void> {
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
export function rigSupports(L: HeroLookDraw) { return ready && !!OUTFIT[L.cls]; }

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

// ── skeleton, in sheet pixels with the origin at the feet (the painted parts' own scale)
const SHEET_H = 640;                      // assembled height of the painted character
const HIP_Y = -246, NECK_Y = -420;
const LEG_X = [22, -20];                  // front, back
const SHOULDER = [[46, -398], [-52, -400]] as const;
const HAND = [0.44, 0.84];                // fist position inside an arm part (fraction of w, h)
const DEG = Math.PI / 180;

function at(ctx: CanvasRenderingContext2D, img: CanvasImageSource | undefined, w: number, h: number, ax: number, ay: number) {
  if (img) ctx.drawImage(img, -w * ax, -h * ay, w, h);
}
function size(name: string): [number, number] {
  const p = parts.get(name);
  return p ? [p.width, p.height] : [0, 0];
}

/**
 * Draw a painted hero. `scale` maps sheet pixels to field units (the code hero is ~74 units tall).
 * Returns false when this look has no painted parts yet (caller falls back to the code-drawn hero).
 */
export function drawRigHero(ctx: CanvasRenderingContext2D, L: HeroLookDraw, pose: Pose): boolean {
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

  const limb = (name: string, img: CanvasImageSource | undefined, x: number, y: number, ang: number) => {
    const [w, h] = size(name);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-ang * DEG); at(ctx, img, w, h, 0.5, 0.04); ctx.restore();
  };
  const leg = (front: boolean) => {
    const name = front ? 'legF' : 'legB';
    const swing = (front ? P.legA : P.legB) * 5 - (sit ? 70 : 0);
    const lift = pose.state === 'walk' ? Math.max(0, P.lift * (front ? 1 : -1)) * 14 : 0;
    const [w, h] = size(name);
    ctx.save(); ctx.translate(LEG_X[front ? 0 : 1], HIP_Y - lift + (sit ? 90 : 0)); ctx.rotate(-swing * DEG);
    at(ctx, front ? parts.get(name) : shaded(name), w, h, 0.5, 0.04); ctx.restore();
  };
  const hand = (shoulder: readonly [number, number], ang: number, name: string): [number, number] => {
    const [w, h] = size(name);
    const lx = (HAND[0] - 0.5) * w, ly = HAND[1] * h - 0.04 * h;
    const a = -ang * DEG;
    return [shoulder[0] + lx * Math.cos(a) - ly * Math.sin(a), shoulder[1] + lx * Math.sin(a) + ly * Math.cos(a)];
  };

  // back layer
  limb(o.armB, shaded(o.armB), SHOULDER[1][0], SHOULDER[1][1], P.back);
  leg(false);
  const [hbw, hbh] = size('hairB');
  ctx.save(); ctx.translate(4, NECK_Y - 228); at(ctx, hair('hairB', hc), hbw, hbh, 0.5, 0); ctx.restore();
  // body
  const [tw, th] = size(o.torso);
  ctx.save(); ctx.translate(0, HIP_Y + 22); at(ctx, parts.get(o.torso), tw, th, 0.5, 1); ctx.restore();
  leg(true);
  // head + hair + headgear
  const [hw, hh] = size('head');
  const headTop = NECK_Y - hh + 18;
  ctx.save(); ctx.translate(6, NECK_Y + 18); at(ctx, parts.get('head'), hw, hh, 0.5, 1); ctx.restore();
  const [hfw, hfh] = size('hairF');
  ctx.save(); ctx.translate(10, headTop - 72); at(ctx, hair('hairF', hc), hfw, hfh, 0.5, 0); ctx.restore();
  for (const look of [L.headMid, L.headTop]) {
    const g = look ? HEADGEAR[look] : undefined;
    if (!g) continue;
    const [name, gx, gy, gw] = g;
    const [pw, ph] = size(name);
    const s = gw / pw;
    ctx.save(); ctx.translate(6 + gx, headTop + gy); at(ctx, parts.get(name), pw * s, ph * s, 0.5, 1); ctx.restore();
  }
  // front arm, then the weapon over the fist (an extended arm would otherwise hide a forward-pointing blade)
  limb(o.armF, parts.get(o.armF), SHOULDER[0][0], SHOULDER[0][1], P.front);
  const wname = WEAPON[L.wtype];
  if (wname && pose.state !== 'dead') {
    const [hx, hy] = hand(SHOULDER[0], P.front, o.armF);
    const [ww, wh] = size(wname);
    const ws = (wname === 'sword' ? 300 : 200) / ww;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(Math.PI / 2 - P.weapon * DEG);
    at(ctx, parts.get(wname), ww * ws, wh * ws, 0.1, 0.5);
    ctx.restore();
  }

  ctx.restore();
  return true;
}
