// Painterly zone grounds (pre-rendered once per zone) + y-sorted props.
import type { ZoneDef } from '../game/data/zones.ts';
import { shade, rgba } from './color.ts';

// ───── image kits: painted ground tiles + props per theme (src/assets/kits/<theme>/), used when loaded
const KIT_FILES = import.meta.glob('../assets/kits/*/*.{png,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
interface Kit { tiles: Record<string, HTMLImageElement>; props: Record<string, HTMLImageElement> }
const kits = new Map<string, Kit>();
let kitVer = 0;
/** bumps whenever a kit finishes loading, so the field rebuilds its pre-rendered ground */
export function kitVersion() { return kitVer; }
/** world-unit heights of kit props (a hero is ~72 tall) */
const KIT_PROP_H: Record<string, number> = { tree: 100, pine: 112, bush: 30, rock: 25, flowers: 16, stump: 24, fence: 28, sign: 44 };
/** painted ground tiles are drawn at this scale so tufts stay small next to the heroes */
const KIT_TILE_SCALE = 0.55;
function kitPattern(ctx: CanvasRenderingContext2D, img: HTMLImageElement): CanvasPattern {
  const p = ctx.createPattern(img, 'repeat')!;
  p.setTransform(new DOMMatrix().scale(KIT_TILE_SCALE));
  return p;
}

/** load every kit under src/assets/kits; resolves when all images are decoded */
export function loadKits(): Promise<void> {
  const jobs: Promise<void>[] = [];
  for (const [path, url] of Object.entries(KIT_FILES)) {
    const m = path.match(/kits\/([^/]+)\/([^/.]+)\.(png|jpg)$/);
    if (!m) continue;
    const [, theme, name] = m;
    const kit = kits.get(theme) ?? { tiles: {}, props: {} };
    kits.set(theme, kit);
    const img = new Image();
    img.src = url;
    const bag = name === 'grass' || name === 'dirt' ? kit.tiles : kit.props;
    jobs.push(img.decode().then(() => { bag[name] = img; }, () => {}));
  }
  return Promise.all(jobs).then(() => { kitVer++; });
}
export function kitFor(theme: string): Kit | undefined {
  const k = kits.get(theme);
  return k && k.tiles.grass ? k : undefined;
}
/** occlusion box of a kit-drawn prop (for the see-through fade), or null for code-drawn props */
export function kitPropBox(p: Prop): { r: number; h: number } | null {
  const h = p.kit ? KIT_PROP_H[p.kind] : undefined;
  return h ? { r: h * 0.3 * p.s, h: h * 0.9 * p.s } : null;
}

export interface Prop { x: number; y: number; kind: string; v: number; s: number; label?: string; npc?: string; /** drawn from this theme's image kit */ kit?: string }
export interface Light { x: number; y: number; r: number; color: string; flicker: boolean }
export interface ZoneArt { ground: HTMLCanvasElement; scale: number; props: Prop[]; lights: Light[]; theme: string }

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softBlob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function buildZoneArt(z: ZoneDef, hiDpi: boolean): ZoneArt {
  const scale = hiDpi ? 2 : 1.25;
  const c = document.createElement('canvas');
  c.width = Math.ceil(z.w * scale);
  c.height = Math.ceil(z.h * scale);
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  const R = rng(z.id.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
  const props: Prop[] = [];
  const lights: Light[] = [];
  const W = z.w, H = z.h;
  const edgeProps = (kind: string, n: number, inset: number, vmax: number, smin = 0.9, smax = 1.3) => {
    for (let i = 0; i < n; i++) {
      const side = i % 4;
      const u = R();
      const x = side === 0 ? u * W : side === 1 ? u * W : side === 2 ? R() * inset : W - R() * inset;
      const y = side === 0 ? R() * inset + 30 : side === 1 ? H - R() * inset * 0.6 + 10 : 40 + u * (H - 40);
      props.push({ x, y, kind, v: Math.floor(R() * vmax), s: smin + R() * (smax - smin) });
    }
  };

  const kit = kitFor(z.theme);
  if (z.theme === 'meadow') {
    if (kit) { ctx.fillStyle = kitPattern(ctx, kit.tiles.grass); ctx.fillRect(0, 0, W, H); }
    else {
      ctx.fillStyle = '#86c45e'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 160; i++) softBlob(ctx, R() * W, R() * H, 40 + R() * 90, R() < 0.5 ? '#a4d872' : '#679e44', 0.32);
    }
    // pond
    const px = W * 0.74, py = H * 0.28;
    ctx.save(); ctx.translate(px, py);
    ctx.fillStyle = kit ? '#d9c9a0' : '#c8b88a'; ctx.beginPath(); ctx.ellipse(0, 0, 84, 46, 0.1, 0, Math.PI * 2); ctx.fill();
    if (kit) {
      // flat cartoon water with an ink outline, like the painted props
      ctx.fillStyle = '#8fcfe6'; ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(0, 0, 76, 40, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b4e2f0'; ctx.beginPath(); ctx.ellipse(-12, -10, 40, 14, 0.1, 0, Math.PI * 2); ctx.fill();
    } else {
      const pg = ctx.createRadialGradient(-10, -8, 6, 0, 0, 80); pg.addColorStop(0, '#9fe0f4'); pg.addColorStop(1, '#3e9ac8');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(0, 0, 76, 40, 0.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(-30 + R() * 60, -15 + R() * 30, 8 + R() * 10, 2, 0.1, 0, Math.PI); ctx.stroke(); }
    ctx.fillStyle = '#5aa04a';
    for (let i = 0; i < 5; i++) { const lx = -50 + R() * 100, ly = -20 + R() * 40; ctx.beginPath(); ctx.arc(lx, ly, 5, 0.4, Math.PI * 2 - 0.1); ctx.lineTo(lx, ly); ctx.fill(); }
    ctx.restore();
    props.push({ x: px - 70, y: py + 22, kind: 'reeds', v: 0, s: 1 }, { x: px + 66, y: py - 10, kind: 'reeds', v: 1, s: 0.9 });
    // dirt road
    const road = () => { ctx.beginPath(); ctx.moveTo(-20, H * 0.62); ctx.bezierCurveTo(W * 0.25, H * 0.45, W * 0.45, H * 0.78, W * 0.62, H * 0.6); ctx.bezierCurveTo(W * 0.78, H * 0.45, W * 0.9, H * 0.7, W + 20, H * 0.55); };
    ctx.lineCap = 'round';
    if (kit) {
      road(); ctx.strokeStyle = 'rgba(150,120,70,0.25)'; ctx.lineWidth = 54; ctx.stroke();
      road(); ctx.strokeStyle = kitPattern(ctx, kit.tiles.dirt); ctx.lineWidth = 48; ctx.stroke();
    } else {
      road(); ctx.strokeStyle = 'rgba(150,120,70,0.35)'; ctx.lineWidth = 58; ctx.stroke();
      road(); ctx.strokeStyle = '#d9c38e'; ctx.lineWidth = 44; ctx.stroke();
      road(); ctx.strokeStyle = 'rgba(240,225,180,0.6)'; ctx.lineWidth = 18; ctx.stroke();
    }
    for (let i = 0; i < (kit ? 0 : 260); i++) {
      // texture on everything
      const x = R() * W, y = R() * H;
      ctx.fillStyle = rgba('#3e7a2e', 0.5); ctx.fillRect(x, y, 1.2, 3 + R() * 3);
      ctx.fillRect(x + 2, y + 1, 1.2, 2 + R() * 3);
    }
    const flowers = ['#ffffff', '#ffe060', '#ff9ac0', '#c8a0ff', '#ff7a6a'];
    for (let i = 0; i < (kit ? 0 : 70); i++) {
      const cx = R() * W, cy = R() * H, col = flowers[Math.floor(R() * flowers.length)];
      for (let j = 0; j < 6; j++) {
        const x = cx + (R() - 0.5) * 40, y = cy + (R() - 0.5) * 24;
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f0b030'; ctx.fillRect(x - 0.4, y - 0.4, 0.8, 0.8);
      }
    }
    for (let i = 0; i < (kit ? 0 : 40); i++) { ctx.fillStyle = rgba('#8a8070', 0.6); ctx.beginPath(); ctx.ellipse(R() * W, R() * H, 2 + R() * 2, 1.4, 0, 0, Math.PI * 2); ctx.fill(); }
    edgeProps('tree', 34, 70, 3);
    const roadY = (x: number) => {
      // rough sample of the bezier road so props avoid it
      const t = Math.max(0, Math.min(1, x / W));
      return H * (0.62 - 0.1 * Math.sin(t * Math.PI * 2) * (t < 0.62 ? 1 : 0.6));
    };
    const free = (x: number, y: number) => Math.hypot((x - px) / 100, (y - py) / 60) > 1.15 && Math.abs(y - roadY(x)) > 46;
    const place = (n: number, kind: string, vmax: number, smin: number, smax: number, inset = 60) => {
      for (let i = 0, tries = 0; i < n && tries < n * 20; tries++) {
        const x = inset + R() * (W - inset * 2), y = inset + 40 + R() * (H - inset * 2 - 40);
        if (!free(x, y)) continue;
        props.push({ x, y, kind, v: Math.floor(R() * vmax), s: smin + R() * (smax - smin) });
        i++;
      }
    };
    place(6, 'tree', 3, 0.9, 1.2, 120);
    place(18, 'bush', 3, 0.7, 1.2);
    place(10, 'rock', 3, 0.6, 1.2);
    props.push({ x: 90, y: H * 0.6 - 30, kind: 'sign', v: 0, s: 1 });
    if (kit) {
      // the painted fence piece is a whole section; a few of them and some flower patches
      for (let i = 0; i < 3; i++) props.push({ x: W * 0.3 + i * 48, y: H * 0.2, kind: 'fence', v: i, s: 1 });
      place(12, 'flowers', 2, 0.8, 1.2);
      place(4, 'stump', 2, 0.85, 1.1);
      place(3, 'pine', 2, 0.85, 1.05, 120);
    } else for (let i = 0; i < 5; i++) props.push({ x: W * 0.3 + i * 22, y: H * 0.2, kind: 'fence', v: 0, s: 1 });
  } else if (z.theme === 'forest') {
    ctx.fillStyle = '#4f8a3a'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 180; i++) softBlob(ctx, R() * W, R() * H, 40 + R() * 80, R() < 0.5 ? '#6aa64a' : '#3a6a2c', 0.35);
    const path = () => { ctx.beginPath(); ctx.moveTo(W * 0.5, -20); ctx.bezierCurveTo(W * 0.3, H * 0.3, W * 0.7, H * 0.55, W * 0.45, H + 20); };
    ctx.lineCap = 'round';
    path(); ctx.strokeStyle = 'rgba(80,50,30,0.35)'; ctx.lineWidth = 46; ctx.stroke();
    path(); ctx.strokeStyle = '#9a7a52'; ctx.lineWidth = 34; ctx.stroke();
    path(); ctx.strokeStyle = 'rgba(190,160,110,0.5)'; ctx.lineWidth = 12; ctx.stroke();
    const leaves = ['#c8a040', '#a06a30', '#d8c060', '#6a9a3a'];
    for (let i = 0; i < 500; i++) { ctx.fillStyle = rgba(leaves[Math.floor(R() * 4)], 0.7); ctx.beginPath(); ctx.ellipse(R() * W, R() * H, 2, 1, R() * 3, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 300; i++) { ctx.fillStyle = rgba('#2a5a20', 0.55); const x = R() * W, y = R() * H; ctx.fillRect(x, y, 1.2, 4); ctx.fillRect(x + 2, y + 1, 1.2, 3); }
    edgeProps('pine', 46, 80, 2, 1, 1.5);
    for (let i = 0; i < 14; i++) props.push({ x: 100 + R() * (W - 200), y: 120 + R() * (H - 220), kind: R() < 0.5 ? 'pine' : 'tree', v: Math.floor(R() * 3), s: 1 + R() * 0.4 });
    for (let i = 0; i < 22; i++) props.push({ x: R() * W, y: 60 + R() * (H - 60), kind: 'fern', v: Math.floor(R() * 2), s: 0.8 + R() * 0.5 });
    for (let i = 0; i < 8; i++) props.push({ x: R() * W, y: 60 + R() * (H - 60), kind: 'shroom', v: Math.floor(R() * 2), s: 0.8 + R() * 0.5 });
    for (let i = 0; i < 5; i++) props.push({ x: 80 + R() * (W - 160), y: 100 + R() * (H - 160), kind: R() < 0.5 ? 'log' : 'stump', v: 0, s: 1 });
    for (let i = 0; i < 8; i++) props.push({ x: R() * W, y: 60 + R() * (H - 60), kind: 'rock', v: 3, s: 0.7 + R() * 0.6 });
  } else if (z.theme === 'cave') {
    ctx.fillStyle = '#4a403c'; ctx.fillRect(0, 0, W, H);
    // stone tiles
    for (let y = 0; y < H; y += 26) {
      for (let x = (y / 26) % 2 ? -14 : 0; x < W; x += 30) {
        const col = shade('#6a5e56', (R() - 0.5) * 0.25);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.roundRect(x + 1 + R() * 2, y + 1 + R() * 2, 26 + R() * 3, 22 + R() * 2, 4); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x + 3, y + 3, 20, 2);
      }
    }
    for (let i = 0; i < 120; i++) softBlob(ctx, R() * W, R() * H, 40 + R() * 80, R() < 0.5 ? '#2a2026' : '#6a5a50', 0.35);
    ctx.strokeStyle = 'rgba(20,10,10,0.55)'; ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) { let x = R() * W, y = R() * H; ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (R() - 0.5) * 30; y += (R() - 0.5) * 20; ctx.lineTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < 10; i++) { const x = R() * W, y = R() * H; const g = ctx.createRadialGradient(x, y, 2, x, y, 30); g.addColorStop(0, 'rgba(90,120,160,0.45)'); g.addColorStop(1, 'rgba(90,120,160,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 30, 12, 0, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 50; i++) { ctx.strokeStyle = 'rgba(230,220,190,0.6)'; ctx.lineWidth = 1.6; const x = R() * W, y = R() * H, a = R() * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 3); ctx.stroke(); }
    edgeProps('stalag', 40, 60, 3, 0.9, 1.5);
    for (let i = 0; i < 10; i++) {
      const x = 80 + R() * (W - 160), y = 100 + R() * (H - 180);
      const v = Math.floor(R() * 2);
      props.push({ x, y, kind: 'crystal', v, s: 0.8 + R() * 0.6 });
      lights.push({ x, y: y - 10, r: 70, color: v ? '#a060ff' : '#60c0ff', flicker: false });
    }
    for (let i = 0; i < 8; i++) {
      const x = 60 + R() * (W - 120), y = 80 + R() * (H - 140);
      props.push({ x, y, kind: 'torch', v: 0, s: 1 });
      lights.push({ x, y: y - 26, r: 120, color: '#ffa040', flicker: true });
    }
    for (let i = 0; i < 6; i++) props.push({ x: R() * W, y: 60 + R() * (H - 60), kind: R() < 0.5 ? 'skulls' : 'pillar', v: 0, s: 0.9 + R() * 0.3 });
  } else if (z.theme === 'desert') {
    // the harbour's sandy maps (a beach, a treasure island) reuse the desert ground with palms and rocks instead of cacti and ruins
    const shore = z.region === '푸른 항구 지방';
    ctx.fillStyle = '#e6c983'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) softBlob(ctx, R() * W, R() * H, 50 + R() * 100, R() < 0.5 ? '#f4dca0' : '#c8a464', 0.35);
    // dune ridges
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const x = R() * W, y = R() * H, w = 80 + R() * 160;
      ctx.strokeStyle = 'rgba(170,120,60,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x, y - 18 - R() * 14, x + w / 2, y + 4); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,200,0.45)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x - w / 2, y - 2); ctx.quadraticCurveTo(x, y - 20 - R() * 14, x + w / 2, y + 2); ctx.stroke();
    }
    // cracked flats
    ctx.strokeStyle = 'rgba(140,100,50,0.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) { let x = R() * W, y = R() * H; ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (R() - 0.5) * 26; y += (R() - 0.5) * 14; ctx.lineTo(x, y); } ctx.stroke(); }
    // oasis
    const ox = W * 0.2, oy = H * 0.3;
    ctx.fillStyle = '#9ac060'; ctx.beginPath(); ctx.ellipse(ox, oy, 96, 54, 0, 0, Math.PI * 2); ctx.fill();
    const og = ctx.createRadialGradient(ox - 10, oy - 8, 6, ox, oy, 76); og.addColorStop(0, '#a8f0f4'); og.addColorStop(1, '#3aa0c0');
    ctx.fillStyle = og; ctx.beginPath(); ctx.ellipse(ox, oy, 70, 36, 0, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy] of [[-86, -10], [80, 6], [-40, 40], [50, -38]]) props.push({ x: ox + dx, y: oy + dy + 20, kind: 'palm', v: Math.floor(R() * 2), s: 0.9 + R() * 0.3 });
    const freeD = (x: number, y: number) => Math.hypot((x - ox) / 110, (y - oy) / 70) > 1.1;
    for (let i = 0, tries = 0; i < 26 && tries < 400; tries++) {
      const x = 40 + R() * (W - 80), y = 70 + R() * (H - 110);
      if (!freeD(x, y)) continue;
      const r = R();
      props.push({ x, y, kind: shore ? (r < 0.4 ? 'palm' : 'rock') : r < 0.7 ? 'cactus' : 'rock', v: Math.floor(R() * 3), s: 0.7 + R() * 0.5 }); i++;
    }
    edgeProps('dune', 24, 60, 2, 0.9, 1.4);
    for (let i = 0; i < 5; i++) {
      const x = 100 + R() * (W - 200), y = 120 + R() * (H - 200), r = R();
      props.push({ x, y, kind: shore ? 'rock' : r < 0.6 ? 'ruin' : 'skulls', v: 0, s: 0.9 + R() * 0.3 });
    }
  } else if (z.theme === 'snow') {
    ctx.fillStyle = '#e8f0f8'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 150; i++) softBlob(ctx, R() * W, R() * H, 50 + R() * 90, R() < 0.55 ? '#ffffff' : '#bcd0e8', 0.4);
    // frozen lake
    const lx = W * 0.62, ly = H * 0.42;
    const lg = ctx.createRadialGradient(lx - 20, ly - 10, 10, lx, ly, 120); lg.addColorStop(0, '#d8f4ff'); lg.addColorStop(1, '#8ac0e8');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(lx, ly, 120, 62, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { let x = lx + (R() - 0.5) * 160, y = ly + (R() - 0.5) * 70; ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 3; j++) { x += (R() - 0.5) * 40; y += (R() - 0.5) * 18; ctx.lineTo(x, y); } ctx.stroke(); }
    // footprints & sparkle
    for (let i = 0; i < 160; i++) { ctx.fillStyle = 'rgba(150,180,220,0.35)'; ctx.beginPath(); ctx.ellipse(R() * W, R() * H, 2.4, 1.2, R(), 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 200; i++) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(R() * W, R() * H, 1.2, 1.2); }
    const freeS = (x: number, y: number) => Math.hypot((x - lx) / 140, (y - ly) / 80) > 1.1;
    edgeProps('snowpine', 44, 80, 2, 1, 1.5);
    for (let i = 0, tries = 0; i < 16 && tries < 400; tries++) {
      const x = 80 + R() * (W - 160), y = 100 + R() * (H - 170);
      if (!freeS(x, y)) continue;
      props.push({ x, y, kind: R() < 0.55 ? 'snowpine' : 'icerock', v: Math.floor(R() * 2), s: 0.8 + R() * 0.5 }); i++;
    }
    for (let i = 0; i < 6; i++) { const x = 80 + R() * (W - 160), y = 100 + R() * (H - 170); if (freeS(x, y)) props.push({ x, y, kind: 'crystal', v: 0, s: 0.8 + R() * 0.4 }); }
  } else {
    // town
    ctx.fillStyle = '#86b860'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) softBlob(ctx, R() * W, R() * H, 50 + R() * 60, '#a4d070', 0.3);
    ctx.save();
    ctx.beginPath(); ctx.roundRect(60, 150, W - 120, H - 200, 60); ctx.clip();
    ctx.fillStyle = '#c8bca8'; ctx.fillRect(0, 0, W, H);
    for (let y = 150; y < H; y += 16) {
      for (let x = (y / 16) % 2 ? 52 : 60; x < W; x += 22) {
        ctx.fillStyle = shade('#d8ccb6', (R() - 0.5) * 0.18);
        ctx.beginPath(); ctx.roundRect(x + 1, y + 1, 20, 14, 4); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x + 3, y + 2, 14, 2);
      }
    }
    ctx.restore();
    ctx.strokeStyle = '#9a8a70'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(60, 150, W - 120, H - 200, 60); ctx.stroke();
    // plaza circle
    ctx.fillStyle = '#e4dac6'; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.58, 120, 74, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b0a080'; ctx.lineWidth = 2; ctx.stroke();
    props.push({ x: W / 2, y: H * 0.58, kind: 'fountain', v: 0, s: 1 });
    const houses = [[110, 130, 0], [250, 118, 1], [W - 250, 118, 2], [W - 110, 130, 0]];
    for (const [x, y, v] of houses) props.push({ x, y, kind: 'house', v, s: 1 });
    const npcs: [number, number, string, string][] = [
      [W / 2 - 200, H * 0.48, 'tool', '도구상인 펨'],
      [W / 2 - 130, H * 0.36, 'weapon', '무기상인 그란'],
      [W / 2 + 130, H * 0.36, 'armor', '방어구상인 엘라'],
      [W / 2 + 200, H * 0.48, 'refine', '정련사 바르크'],
      [W / 2 - 150, H * 0.78, 'stylist', '미용사 루루'],
      [W / 2 + 150, H * 0.78, 'job', '전직 교관 레온'],
    ];
    for (const [x, y, npc, label] of npcs) props.push({ x, y, kind: 'npc', v: 0, s: 1, npc, label });
    for (const [x, y] of [[180, 300], [W - 180, 300], [180, H - 120], [W - 180, H - 120]]) props.push({ x, y, kind: 'lamp', v: 0, s: 1 });
    for (let i = 0; i < 8; i++) props.push({ x: 40 + R() * (W - 80), y: H - 20 - R() * 30, kind: 'bush', v: Math.floor(R() * 3), s: 0.8 + R() * 0.3 });
    for (let i = 0; i < 6; i++) props.push({ x: R() < 0.5 ? 30 : W - 30, y: 200 + R() * (H - 260), kind: 'tree', v: Math.floor(R() * 3), s: 1 });
    props.push({ x: 110, y: H * 0.58, kind: 'flag', v: 0, s: 1 }, { x: W - 110, y: H * 0.58, kind: 'flag', v: 1, s: 1 });
  }
  // dark rim so the border reads as "edge of map"
  const rim = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, z.theme === 'cave' ? 'rgba(0,0,0,0.6)' : z.theme === 'desert' ? 'rgba(90,50,10,0.3)' : z.theme === 'snow' ? 'rgba(40,70,120,0.25)' : 'rgba(10,30,10,0.35)');
  ctx.fillStyle = rim; ctx.fillRect(0, 0, W, H);
  props.sort((a, b) => a.y - b.y);
  if (kit) for (const p of props) if (kit.props[p.kind]) p.kit = z.theme;
  // a map's own mood over the shared theme (e.g. a grey quarry on desert sand, a darker lower floor)
  if (z.tint) { ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.globalAlpha = 0.28; ctx.fillStyle = z.tint; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  return { ground: c, scale, props, lights, theme: z.theme };
}

// ───────── props (cached sprites)
const spriteCache = new Map<string, HTMLCanvasElement>();

function cached(key: string, w: number, h: number, ox: number, oy: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  let c = spriteCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    const k = 2;
    c.width = w * k; c.height = h * k;
    const ctx = c.getContext('2d')!;
    ctx.scale(k, k);
    ctx.translate(ox, oy);
    draw(ctx);
    (c as HTMLCanvasElement & { ox: number; oy: number }).ox = ox;
    (c as HTMLCanvasElement & { ox: number; oy: number }).oy = oy;
    spriteCache.set(key, c);
  }
  return c as HTMLCanvasElement & { ox: number; oy: number };
}

function line(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, stroke: string, w = 1.2) {
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke();
}

function drawTree(ctx: CanvasRenderingContext2D, v: number) {
  const leaf = ['#5aa844', '#6ab84a', '#4a9a52'][v % 3];
  ctx.fillStyle = 'rgba(20,40,20,0.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-4, -18, -6, -30); ctx.lineTo(6, -30); ctx.quadraticCurveTo(4, -18, 6, 0); ctx.closePath();
  line(ctx, '#8a5a34', '#4a2a14');
  for (const [x, y, r] of [[-16, -42, 16], [15, -44, 15], [0, -58, 19], [-6, -40, 14], [8, -36, 13]]) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, 2, x, y, r);
    g.addColorStop(0, shade(leaf, 0.35)); g.addColorStop(0.7, leaf); g.addColorStop(1, shade(leaf, -0.25));
    line(ctx, g, shade(leaf, -0.5), 1.2);
  }
  if (v === 2) { ctx.fillStyle = '#ff5a5a'; for (const [x, y] of [[-10, -46], [8, -52], [14, -38], [-2, -62]]) { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill(); } }
}
function drawPine(ctx: CanvasRenderingContext2D, v: number) {
  const leaf = v ? '#2f6a3a' : '#3a7a40';
  ctx.fillStyle = 'rgba(10,30,10,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(-4, -14, 8, 14);
  for (let i = 0; i < 4; i++) {
    const y = -12 - i * 16, w = 26 - i * 5;
    ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(0, y - 26); ctx.lineTo(w, y); ctx.quadraticCurveTo(0, y + 5, -w, y);
    const g = ctx.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, shade(leaf, -0.2)); g.addColorStop(0.5, shade(leaf, 0.15)); g.addColorStop(1, shade(leaf, -0.3));
    line(ctx, g, shade(leaf, -0.55), 1.1);
  }
}

export function drawProp(ctx: CanvasRenderingContext2D, p: Prop, t: number) {
  const kimg = p.kit ? kits.get(p.kit)?.props[p.kind] : undefined;
  if (kimg) {
    // painted prop: ground contact at the bottom centre, a soft contact shadow, mirrored variants
    const h = KIT_PROP_H[p.kind] * p.s, w = kimg.width * h / kimg.height;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(40,50,20,0.18)';
    ctx.beginPath(); ctx.ellipse(0, -1, w * 0.36, Math.max(3, w * 0.09), 0, 0, Math.PI * 2); ctx.fill();
    if (p.kind === 'tree' || p.kind === 'pine') ctx.rotate(Math.sin(t / 1400 + p.x) * 0.012);
    if (p.v % 2) ctx.scale(-1, 1);
    ctx.drawImage(kimg, -w / 2, -h + h * 0.02, w, h);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.s, p.s);
  let spr: (HTMLCanvasElement & { ox: number; oy: number }) | null = null;
  switch (p.kind) {
    case 'tree': spr = cached('tree' + p.v, 80, 90, 40, 82, (c) => drawTree(c, p.v)); break;
    case 'pine': spr = cached('pine' + p.v, 64, 110, 32, 104, (c) => drawPine(c, p.v)); break;
    case 'bush': spr = cached('bush' + p.v, 44, 30, 22, 26, (c) => {
      const col = ['#5aa844', '#4a9a4a', '#6ab060'][p.v % 3];
      c.fillStyle = 'rgba(20,40,20,0.3)'; c.beginPath(); c.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2); c.fill();
      for (const [x, y, r] of [[-9, -7, 8], [8, -7, 8], [0, -12, 10]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); line(c, col, shade(col, -0.5)); }
      if (p.v === 1) { c.fillStyle = '#ffb0d0'; for (const [x, y] of [[-6, -12], [4, -16], [9, -9]]) { c.beginPath(); c.arc(x, y, 1.8, 0, Math.PI * 2); c.fill(); } }
    }); break;
    case 'rock': spr = cached('rock' + p.v, 40, 26, 20, 22, (c) => {
      const col = p.v === 3 ? '#8a8a80' : '#a8a498';
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(-14, -12, -3, -15); c.quadraticCurveTo(12, -14, 13, 0); c.closePath();
      const g = c.createLinearGradient(0, -15, 0, 0); g.addColorStop(0, shade(col, 0.25)); g.addColorStop(1, shade(col, -0.25));
      line(c, g, shade(col, -0.55));
      if (p.v === 3) { c.fillStyle = '#5a9a3a'; c.beginPath(); c.ellipse(-2, -13, 8, 3, 0, 0, Math.PI * 2); c.fill(); }
    }); break;
    case 'cactus': spr = cached('cactus' + p.v, 40, 52, 20, 48, (c) => {
      const col = ['#5aa050', '#4a9048', '#6ab05a'][p.v % 3];
      c.fillStyle = 'rgba(80,50,10,0.3)'; c.beginPath(); c.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2); c.fill();
      const arm = (x: number, y: number, h: number, dir: number) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * 7, y); c.quadraticCurveTo(x + dir * 9, y, x + dir * 9, y - 3); c.lineTo(x + dir * 9, y - h); c.stroke(); };
      c.lineCap = 'round';
      c.strokeStyle = shade(col, -0.5); c.lineWidth = 7.6; arm(0, -16, 10, -1); arm(0, -22, 8, 1);
      c.strokeStyle = col; c.lineWidth = 5.6; arm(0, -16, 10, -1); arm(0, -22, 8, 1);
      c.beginPath(); c.roundRect(-5, -40, 10, 40, 5); line(c, col, shade(col, -0.5));
      c.strokeStyle = shade(col, -0.25); c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -37); c.lineTo(0, -2); c.stroke();
      if (p.v === 2) { c.fillStyle = '#ff7aa0'; c.beginPath(); c.arc(0, -41, 2.6, 0, Math.PI * 2); c.fill(); }
    }); break;
    case 'palm': spr = cached('palm' + p.v, 70, 90, 35, 84, (c) => {
      c.fillStyle = 'rgba(40,60,20,0.3)'; c.beginPath(); c.ellipse(0, 0, 20, 6, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#7a5a34'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -30, -2 + p.v * 6, -60); c.stroke();
      c.strokeStyle = '#a07a48'; c.lineWidth = 1; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-2 + i * 0.6, -6 - i * 7); c.lineTo(3 + i * 0.4, -7 - i * 7); c.stroke(); }
      const top = { x: -2 + p.v * 6, y: -60 };
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.55;
        c.save(); c.translate(top.x, top.y); c.rotate(a + Math.PI / 2);
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -6, 26, 6); c.quadraticCurveTo(12, 2, 0, 3); c.closePath(); line(c, '#4aa04a', '#2a5a2a', 1);
        c.restore();
      }
      c.fillStyle = '#7a4a20'; c.beginPath(); c.arc(top.x - 2, top.y + 3, 2.4, 0, Math.PI * 2); c.arc(top.x + 2, top.y + 4, 2.4, 0, Math.PI * 2); c.fill();
    }); break;
    case 'dune': spr = cached('dune' + p.v, 110, 40, 55, 34, (c) => {
      c.beginPath(); c.moveTo(-52, 0); c.quadraticCurveTo(-10, -32 - p.v * 6, 52, 0); c.closePath();
      const g = c.createLinearGradient(-20, -30, 20, 0); g.addColorStop(0, '#f8e2a8'); g.addColorStop(1, '#c49a58');
      c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(255,245,210,0.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-40, -6); c.quadraticCurveTo(-10, -30 - p.v * 6, 20, -10); c.stroke();
    }); break;
    case 'ruin': spr = cached('ruin', 44, 64, 22, 60, (c) => {
      c.fillStyle = 'rgba(80,50,10,0.3)'; c.beginPath(); c.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-9, 0); c.lineTo(-9, -36); c.lineTo(-4, -44); c.lineTo(2, -38); c.lineTo(9, -46); c.lineTo(9, 0); c.closePath();
      const g = c.createLinearGradient(-9, 0, 9, 0); g.addColorStop(0, '#b89868'); g.addColorStop(0.5, '#e8d0a0'); g.addColorStop(1, '#a08050');
      line(c, g, '#6a5030');
      c.strokeStyle = 'rgba(100,70,30,0.45)'; c.lineWidth = 1; for (const y of [-10, -22, -32]) { c.beginPath(); c.moveTo(-9, y); c.lineTo(9, y); c.stroke(); }
      c.fillStyle = '#c8a870'; c.beginPath(); c.roundRect(-18, -6, 12, 6, 2); c.fill();
    }); break;
    case 'snowpine': spr = cached('snowpine' + p.v, 64, 110, 32, 104, (c) => {
      drawPine(c, p.v);
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        const y = -12 - i * 16, w = 26 - i * 5;
        c.beginPath(); c.moveTo(-w * 0.8, y - 3); c.quadraticCurveTo(-w * 0.3, y - 14, 0, y - 24); c.quadraticCurveTo(w * 0.2, y - 12, w * 0.7, y - 4); c.quadraticCurveTo(0, y - 8, -w * 0.8, y - 3); c.fill();
      }
    }); break;
    case 'icerock': spr = cached('icerock' + p.v, 48, 40, 24, 36, (c) => {
      c.fillStyle = 'rgba(60,90,140,0.25)'; c.beginPath(); c.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-16, 0); c.lineTo(-12, -16); c.lineTo(-4, -26); c.lineTo(6, -20); c.lineTo(14, -28 + p.v * 6); c.lineTo(17, 0); c.closePath();
      const g = c.createLinearGradient(-16, -26, 16, 0); g.addColorStop(0, '#f0fbff'); g.addColorStop(1, '#7ab0dc');
      line(c, g, '#4a7aa8');
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, -14); c.lineTo(-4, -23); c.stroke();
    }); break;
    case 'reeds': spr = cached('reeds', 30, 34, 15, 30, (c) => {
      for (let i = 0; i < 7; i++) { const x = -10 + i * 3.4; c.strokeStyle = '#4a8a3a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 2, -14, x - 1, -24 + (i % 3) * 3); c.stroke(); }
      c.fillStyle = '#7a4a2a'; for (const x of [-6, 1, 7]) { c.beginPath(); c.ellipse(x, -22, 1.8, 4, 0, 0, Math.PI * 2); c.fill(); }
    }); break;
    case 'sign': spr = cached('sign', 40, 46, 20, 42, (c) => {
      c.fillStyle = '#6a4428'; c.fillRect(-2, -30, 4, 30);
      c.beginPath(); c.roundRect(-17, -38, 34, 14, 3); line(c, '#c08a52', '#4a2a14');
      c.fillStyle = '#4a2a14'; c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillText('→ 숲', 0, -28.5);
    }); break;
    case 'fence': spr = cached('fence', 26, 22, 13, 20, (c) => {
      c.fillStyle = '#b08050'; c.strokeStyle = '#5a3a1a'; c.lineWidth = 1;
      for (const x of [-10, 8]) { c.beginPath(); c.rect(x, -16, 3.4, 16); c.fill(); c.stroke(); }
      c.beginPath(); c.rect(-12, -13, 24, 3); c.rect(-12, -7, 24, 3); c.fill(); c.stroke();
    }); break;
    case 'fern': spr = cached('fern' + p.v, 40, 26, 20, 24, (c) => {
      const col = p.v ? '#3a8a3a' : '#4a9a40';
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; c.strokeStyle = col; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a) * 10, Math.sin(a) * 14, Math.cos(a) * 17, Math.sin(a) * 14 + 6); c.stroke(); }
    }); break;
    case 'shroom': spr = cached('shroom' + p.v, 30, 26, 15, 24, (c) => {
      const col = p.v ? '#e05a4a' : '#c89a5a';
      for (const [x, s] of [[-5, 1], [6, 0.7]] as const) {
        c.fillStyle = '#f4ead8'; c.fillRect(x - 2 * s, -10 * s, 4 * s, 10 * s);
        c.beginPath(); c.ellipse(x, -10 * s, 8 * s, 5 * s, 0, Math.PI, Math.PI * 2); line(c, col, shade(col, -0.5));
      }
    }); break;
    case 'log': spr = cached('log', 60, 24, 30, 20, (c) => {
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 0, 26, 5, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.roundRect(-24, -14, 46, 12, 6); line(c, '#8a5a34', '#4a2a14');
      c.beginPath(); c.ellipse(22, -8, 4, 6, 0, 0, Math.PI * 2); line(c, '#d8b07a', '#4a2a14');
      c.fillStyle = '#5a9a3a'; c.beginPath(); c.ellipse(-8, -14, 9, 2.6, 0, 0, Math.PI * 2); c.fill();
    }); break;
    case 'stump': spr = cached('stump', 36, 26, 18, 22, (c) => {
      c.beginPath(); c.moveTo(-11, 0); c.lineTo(-9, -14); c.lineTo(9, -14); c.lineTo(11, 0); c.closePath(); line(c, '#8a5a34', '#4a2a14');
      c.beginPath(); c.ellipse(0, -14, 9, 3.4, 0, 0, Math.PI * 2); line(c, '#d8b07a', '#4a2a14');
    }); break;
    case 'stalag': spr = cached('stalag' + p.v, 36, 60, 18, 56, (c) => {
      const col = ['#6a5e56', '#5a504a', '#7a6c60'][p.v % 3];
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(-6, -20, -2, -48); c.lineTo(2, -48); c.quadraticCurveTo(7, -22, 12, 0); c.closePath();
      const g = c.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, shade(col, -0.3)); g.addColorStop(0.5, shade(col, 0.2)); g.addColorStop(1, shade(col, -0.35));
      line(c, g, shade(col, -0.6));
    }); break;
    case 'crystal': spr = cached('crystal' + p.v, 36, 40, 18, 36, (c) => {
      const col = p.v ? '#b080ff' : '#70d0ff';
      for (const [x, h, a] of [[-6, 22, -0.3], [2, 30, 0.05], [8, 18, 0.35]] as const) {
        c.save(); c.translate(x, 0); c.rotate(a);
        c.beginPath(); c.moveTo(-3.6, 0); c.lineTo(-3.6, -h + 6); c.lineTo(0, -h); c.lineTo(3.6, -h + 6); c.lineTo(3.6, 0); c.closePath();
        const g = c.createLinearGradient(-4, 0, 4, 0); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(1, shade(col, -0.3));
        line(c, g, shade(col, -0.5), 1);
        c.restore();
      }
    }); break;
    case 'skulls': spr = cached('skulls', 36, 22, 18, 18, (c) => {
      for (const [x, y] of [[-7, 0], [6, 0], [0, -6]]) {
        c.beginPath(); c.arc(x, y - 4, 5, 0, Math.PI * 2); line(c, '#ece6d0', '#6a6050', 1);
        c.fillStyle = '#2a2420'; c.beginPath(); c.arc(x - 1.6, y - 4.4, 1.3, 0, Math.PI * 2); c.arc(x + 1.8, y - 4.4, 1.3, 0, Math.PI * 2); c.fill();
      }
    }); break;
    case 'pillar': spr = cached('pillar', 34, 70, 17, 66, (c) => {
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-10, 0); c.lineTo(-9, -40); c.lineTo(-4, -46); c.lineTo(3, -38); c.lineTo(9, -44); c.lineTo(10, 0); c.closePath();
      const g = c.createLinearGradient(-10, 0, 10, 0); g.addColorStop(0, '#5a5058'); g.addColorStop(0.5, '#9a909a'); g.addColorStop(1, '#4a4048');
      line(c, g, '#2a2228');
      c.strokeStyle = 'rgba(0,0,0,0.3)'; for (const x of [-5, 0, 5]) { c.beginPath(); c.moveTo(x, -2); c.lineTo(x, -38); c.stroke(); }
    }); break;
    case 'house': spr = cached('house' + p.v, 120, 110, 60, 104, (c) => {
      const roof = ['#c8503a', '#3a6ab0', '#5a9a4a'][p.v % 3];
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 0, 54, 8, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.rect(-44, -52, 88, 52); line(c, '#f2e6cc', '#8a7050', 1.4);
      c.fillStyle = '#c8b090'; c.fillRect(-44, -10, 88, 10);
      c.beginPath(); c.moveTo(-54, -50); c.lineTo(0, -96); c.lineTo(54, -50); c.closePath();
      const g = c.createLinearGradient(0, -96, 0, -50); g.addColorStop(0, shade(roof, 0.2)); g.addColorStop(1, shade(roof, -0.25));
      line(c, g, shade(roof, -0.55), 1.4);
      c.strokeStyle = shade(roof, -0.35); c.lineWidth = 1; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-54 + i * 9, -50 - i * 7.6); c.lineTo(54 - i * 9, -50 - i * 7.6); c.stroke(); }
      c.beginPath(); c.roundRect(-8, -30, 16, 30, [8, 8, 0, 0]); line(c, '#8a5a34', '#4a2a14');
      for (const x of [-32, 18]) { c.beginPath(); c.rect(x, -40, 14, 12); line(c, '#9fd8f4', '#6a5038', 1.2); c.strokeStyle = '#6a5038'; c.beginPath(); c.moveTo(x + 7, -40); c.lineTo(x + 7, -28); c.stroke(); c.fillStyle = '#e05a7a'; c.fillRect(x - 1, -27, 16, 3); }
      c.beginPath(); c.arc(0, -66, 6, 0, Math.PI * 2); line(c, '#f2e6cc', '#8a7050');
    }); break;
    case 'lamp': spr = cached('lamp', 20, 60, 10, 56, (c) => {
      c.fillStyle = '#3a3a44'; c.fillRect(-1.6, -44, 3.2, 44); c.fillRect(-5, -2, 10, 2);
      c.beginPath(); c.moveTo(-6, -44); c.lineTo(6, -44); c.lineTo(4, -52); c.lineTo(-4, -52); c.closePath(); line(c, '#ffe8a0', '#3a3a44', 1.2);
    }); break;
    case 'flag': spr = cached('flag' + p.v, 40, 80, 8, 76, (c) => {
      c.fillStyle = '#5a4a3a'; c.fillRect(-1.5, -70, 3, 70);
      const col = p.v ? '#3a6ab0' : '#c8403a';
      c.beginPath(); c.moveTo(1, -68); c.lineTo(26, -64); c.lineTo(22, -56); c.lineTo(26, -48); c.lineTo(1, -50); c.closePath(); line(c, col, shade(col, -0.5));
      c.fillStyle = '#ffe080'; c.beginPath(); c.arc(11, -58, 3, 0, Math.PI * 2); c.fill();
    }); break;
  }
  if (spr) {
    ctx.drawImage(spr, -spr.ox, -spr.oy, spr.width / 2, spr.height / 2);
  } else if (p.kind === 'torch') {
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-2, -26, 4, 26);
    ctx.fillStyle = '#2a2018'; ctx.fillRect(-4, -28, 8, 4);
    const f = Math.sin(t / 70 + p.x) * 1.2;
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(-4, -28); ctx.quadraticCurveTo(-3 + f, -38, 0 + f, -42); ctx.quadraticCurveTo(3, -36, 4, -28); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(-2, -28); ctx.quadraticCurveTo(-1 + f, -34, f * 0.5, -37); ctx.quadraticCurveTo(2, -33, 2, -28); ctx.fill();
  } else if (p.kind === 'fountain') {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 4, 50, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, 46, 16, 0, 0, Math.PI * 2); line(ctx, '#d8d0c0', '#7a7060', 1.6);
    ctx.beginPath(); ctx.ellipse(0, -2, 40, 12, 0, 0, Math.PI * 2);
    const wg = ctx.createRadialGradient(0, -2, 4, 0, -2, 40); wg.addColorStop(0, '#bff0ff'); wg.addColorStop(1, '#4aa0d8');
    ctx.fillStyle = wg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const r = ((t / 900 + i / 3) % 1); ctx.globalAlpha = 1 - r; ctx.beginPath(); ctx.ellipse(0, -4, 8 + r * 30, 2 + r * 8, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#c8c0b0'; ctx.fillRect(-4, -30, 8, 26);
    ctx.beginPath(); ctx.ellipse(0, -30, 12, 4, 0, 0, Math.PI * 2); line(ctx, '#e0d8c8', '#7a7060');
    for (let i = 0; i < 6; i++) {
      const a = (t / 300 + i) % 1;
      const ang = i / 6 * Math.PI * 2;
      ctx.fillStyle = `rgba(200,240,255,${0.9 - a})`;
      ctx.beginPath(); ctx.arc(Math.cos(ang) * a * 14, -34 - Math.sin(a * Math.PI) * 10 + a * 26, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
