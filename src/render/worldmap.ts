// Illustrated world map (continent, regions, roads, fog over locked zones).
import { ZONES, regions, regionOf, type ZoneDef, type RegionInfo } from '../game/data/zones.ts';
import { shade, rgba } from './color.ts';

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

const REGION: Record<string, { color: string; r: number }> = {
  town: { color: '#b8d890', r: 0.13 },
  meadow: { color: '#9cd46a', r: 0.17 },
  forest: { color: '#4f9a44', r: 0.19 },
  cave: { color: '#8a8478', r: 0.17 },
  desert: { color: '#ecd08a', r: 0.2 },
  snow: { color: '#eef6ff', r: 0.19 },
};

/** regions that don't look like their theme: the v0.4 homes and the sky ruins (colour, blob size, decoration set) */
const REGION_STYLE: Record<string, { color: string; r: number; deco: 'lake' | 'harbour' | 'sky' }> = {
  '안개 호수 지방': { color: '#94d4bc', r: 0.15, deco: 'lake' },
  '푸른 항구 지방': { color: '#f2e2b0', r: 0.15, deco: 'harbour' },
  '하늘 유적 지방': { color: '#f2ecff', r: 0.11, deco: 'sky' },
};

/** roads between regions (any map id of each region; drawn between the region spots) */
export const ROADS: [string, string][] = [
  ['town', 'meadow'], ['town', 'forest'], ['forest', 'cave'], ['town', 'desert'], ['desert', 'snow'], ['cave', 'snow'],
  ['town', 'lakeshore'], ['lakeshore', 'cave'], ['town', 'beach'], ['beach', 'forest'], ['snow', 'cloudstair'],
];

export function drawWorldMap(c: HTMLCanvasElement, unlocked: Set<string>, t: number) {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const W = c.clientWidth, H = c.clientHeight;
  if (!W || !H) return;
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = rng(1234);
  // one blob per region (its maps' pins averaged), so a region of many maps reads as one land
  const RG = regions();
  const P = (z: ZoneDef | RegionInfo) => { const r = 'zones' in z ? z : regionOf(z.id) ?? { x: z.map[0], y: z.map[1] }; return { x: r.x / 100 * W, y: r.y / 100 * H }; };
  const regionOpen = (r: RegionInfo) => r.zones.some((z) => unlocked.has(z.id));
  const S = Math.min(W, H);

  // sea
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#5aa8d8'); sea.addColorStop(1, '#3a7ab8');
  ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) {
    const x = R() * W, y = R() * H, off = Math.sin(t / 900 + i) * 3;
    ctx.beginPath(); ctx.moveTo(x - 8 + off, y); ctx.quadraticCurveTo(x + off, y - 3, x + 8 + off, y); ctx.stroke();
  }

  // landmass: organic blob around all zones
  ctx.save();
  ctx.beginPath();
  const cx = W * 0.5, cy = H * 0.52;
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wob = 1 + Math.sin(a * 3 + 1.3) * 0.05 + Math.sin(a * 7 + 0.4) * 0.035 + Math.sin(a * 13) * 0.015;
    const x = cx + Math.cos(a) * W * 0.47 * wob, y = cy + Math.sin(a) * H * 0.46 * wob;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.shadowColor = 'rgba(10,30,60,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#e8d8a8'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,250,230,0.8)'; ctx.stroke();
  ctx.clip();
  ctx.fillStyle = '#a8cc78'; ctx.fillRect(0, 0, W, H);

  // regions
  for (const z of RG) {
    const p = P(z);
    const st = REGION_STYLE[z.name];
    if (st?.deco === 'sky') continue; // floats off the coast, drawn after the landmass
    const reg = st ?? REGION[z.theme] ?? REGION.meadow;
    const rr = reg.r * S * 1.6;
    const g = ctx.createRadialGradient(p.x, p.y, rr * 0.2, p.x, p.y, rr);
    g.addColorStop(0, reg.color); g.addColorStop(0.7, rgba(reg.color, 0.85)); g.addColorStop(1, rgba(reg.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.fill();
  }
  // decorations per region
  for (const z of RG) {
    const p = P(z);
    const st = REGION_STYLE[z.name];
    if (st) { if (st.deco === 'lake') drawLake(ctx, p.x, p.y, S, t); if (st.deco === 'harbour') drawHarbourLand(ctx, p.x, p.y, S); continue; }
    const rr = (REGION[z.theme]?.r ?? 0.15) * S;
    const n = z.theme === 'town' ? 0 : 14;
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, d = rr * (0.45 + R() * 0.75);
      const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * 0.8;
      switch (z.theme) {
        case 'forest': case 'meadow': {
          const col = z.theme === 'forest' ? '#2f7a34' : '#5aa848';
          if (z.theme === 'meadow' && i % 2) { ctx.fillStyle = ['#fff', '#ffe070', '#ff9ac0'][i % 3]; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); break; }
          ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = shade(col, -0.25); ctx.fillRect(x - 0.8, y, 1.6, 4);
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - 2, 4.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = shade(col, 0.3); ctx.beginPath(); ctx.arc(x - 1.4, y - 3.6, 1.8, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'cave': case 'snow': {
          const h = 8 + R() * 8;
          ctx.fillStyle = z.theme === 'cave' ? '#6a6458' : '#9fb8d8';
          ctx.beginPath(); ctx.moveTo(x - h * 0.8, y + 3); ctx.lineTo(x, y - h); ctx.lineTo(x + h * 0.8, y + 3); ctx.closePath(); ctx.fill();
          ctx.fillStyle = z.theme === 'cave' ? '#8a8478' : '#ffffff';
          ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + h * 0.8, y + 3); ctx.lineTo(x + h * 0.15, y + 3); ctx.closePath(); ctx.fill();
          if (z.theme === 'snow') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - h * 0.3, y - h * 0.6); ctx.lineTo(x, y - h); ctx.lineTo(x + h * 0.3, y - h * 0.6); ctx.fill(); }
          break;
        }
        case 'desert': {
          if (i % 3 === 0) {
            ctx.fillStyle = '#5aa050'; ctx.fillRect(x - 1, y - 7, 2.2, 8); ctx.fillRect(x - 4, y - 4, 2, 4); ctx.fillRect(x + 2, y - 5, 2, 4);
          } else {
            ctx.strokeStyle = 'rgba(170,120,60,0.55)'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.quadraticCurveTo(x, y - 6, x + 9, y + 1); ctx.stroke();
          }
          break;
        }
      }
    }
  }
  // lake + river for flavour
  ctx.fillStyle = '#6ab8e0';
  ctx.beginPath(); ctx.ellipse(W * 0.38, H * 0.66, S * 0.05, S * 0.03, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6ab8e0'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W * 0.38, H * 0.66); ctx.bezierCurveTo(W * 0.3, H * 0.78, W * 0.32, H * 0.88, W * 0.24, H * 0.98); ctx.stroke();

  // roads
  ctx.setLineDash([5, 5]);
  ctx.lineCap = 'round';
  for (const [a, b] of ROADS) {
    const za = ZONES.find((z) => z.id === a)!, zb = ZONES.find((z) => z.id === b)!;
    const pa = P(za), pb = P(zb);
    const mx = (pa.x + pb.x) / 2 + (pb.y - pa.y) * 0.12, my = (pa.y + pb.y) / 2 - (pb.x - pa.x) * 0.12;
    const ra = regionOf(a), rb = regionOf(b);
    const open = !!ra && !!rb && regionOpen(ra) && regionOpen(rb);
    ctx.strokeStyle = open ? 'rgba(120,80,40,0.85)' : 'rgba(120,100,80,0.35)';
    ctx.lineWidth = open ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.quadraticCurveTo(mx, my, pb.x, pb.y); ctx.stroke();
  }
  ctx.setLineDash([]);

  // town castle
  const town = P(ZONES[0]);
  ctx.save(); ctx.translate(town.x, town.y - 6);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 12, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2e6cc'; ctx.strokeStyle = '#8a7050'; ctx.lineWidth = 1;
  ctx.fillRect(-14, -4, 28, 16); ctx.strokeRect(-14, -4, 28, 16);
  for (const x of [-16, 10]) { ctx.fillRect(x, -12, 6, 24); ctx.strokeRect(x, -12, 6, 24); }
  ctx.fillStyle = '#c8503a';
  for (const x of [-16, 10]) { ctx.beginPath(); ctx.moveTo(x - 1, -12); ctx.lineTo(x + 3, -20); ctx.lineTo(x + 7, -12); ctx.fill(); }
  ctx.fillStyle = '#3a6ab0'; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(0, -12); ctx.lineTo(6, -4); ctx.fill();
  ctx.fillStyle = '#8a5a34'; ctx.fillRect(-3, 4, 6, 8);
  ctx.restore();

  // fog over regions with no open map yet
  for (const z of RG) {
    if (regionOpen(z) || REGION_STYLE[z.name]?.deco === 'sky') continue;
    const p = P(z);
    const rr = (REGION_STYLE[z.name]?.r ?? REGION[z.theme]?.r ?? 0.15) * S * 1.35;
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + t / 6000;
      const fx = p.x + Math.cos(a) * rr * 0.35, fy = p.y + Math.sin(a) * rr * 0.25;
      const g = ctx.createRadialGradient(fx, fy, 2, fx, fy, rr * 0.75);
      g.addColorStop(0, 'rgba(70,80,100,0.38)'); g.addColorStop(1, 'rgba(70,80,100,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, rr * 0.75, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();

  // things that sit on the sea or in the sky: harbour boats, the floating sky ruins
  for (const z of RG) {
    const st = REGION_STYLE[z.name];
    const p = P(z);
    if (st?.deco === 'harbour') drawHarbourSea(ctx, p.x, p.y, S, t);
    if (st?.deco === 'sky') drawSkyIsland(ctx, p.x, p.y, S, t, regionOpen(z));
  }

  // compass
  ctx.save(); ctx.translate(W - 26, H - 30);
  ctx.fillStyle = 'rgba(255,250,230,0.9)'; ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c03a3a'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(4, 0); ctx.lineTo(-4, 0); ctx.fill();
  ctx.fillStyle = '#3a3a4a'; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(4, 0); ctx.lineTo(-4, 0); ctx.fill();
  ctx.fillStyle = '#3a2a1a'; ctx.font = "bold 8px 'Galmuri9', sans-serif"; ctx.textAlign = 'center'; ctx.fillText('N', 0, -16);
  ctx.restore();
}

/** mist lake: water with a pale rim, drifting mist, reeds and the mage tower on its islet */
function drawLake(ctx: CanvasRenderingContext2D, x: number, y: number, S: number, t: number) {
  const rx = S * 0.1, ry = S * 0.055, cy = y + S * 0.01;
  ctx.fillStyle = '#d8f0e8'; ctx.beginPath(); ctx.ellipse(x, cy, rx + 3, ry + 3, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5ab0d0'; ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a98c0'; ctx.beginPath(); ctx.ellipse(x + rx * 0.15, cy + ry * 0.35, rx * 0.75, ry * 0.5, -0.1, 0, Math.PI * 2); ctx.fill();
  // reeds
  ctx.strokeStyle = '#3f8a4a'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.15 + i * 0.09), rx2 = x + Math.cos(a) * (rx + 2), ry2 = cy + Math.sin(a) * (ry + 2);
    ctx.beginPath(); ctx.moveTo(rx2, ry2); ctx.lineTo(rx2 + Math.sin(t / 700 + i) * 1.2, ry2 - 6); ctx.stroke();
  }
  // tower islet
  const tx = x + rx * 0.45, ty = cy - ry * 0.15;
  ctx.fillStyle = '#9a9a8a'; ctx.beginPath(); ctx.ellipse(tx, ty + 2, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8d4e8'; ctx.fillRect(tx - 2.6, ty - 15, 5.2, 17);
  ctx.strokeStyle = '#6a6488'; ctx.lineWidth = 0.8; ctx.strokeRect(tx - 2.6, ty - 15, 5.2, 17);
  ctx.fillStyle = '#6a4ab0'; ctx.beginPath(); ctx.moveTo(tx - 4, ty - 15); ctx.lineTo(tx, ty - 23); ctx.lineTo(tx + 4, ty - 15); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe070'; ctx.fillRect(tx - 0.8, ty - 11, 1.6, 2);
  // mist bands drifting over the water
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const mx = x - rx * 0.6 + ((t / 90 + i * 37) % (rx * 1.2)), my = cy - ry * 0.4 + i * ry * 0.45;
    ctx.beginPath(); ctx.moveTo(mx - 8, my); ctx.quadraticCurveTo(mx, my - 3, mx + 8, my); ctx.stroke();
  }
}

/** harbour on land: a sandy beach and a striped lighthouse on the point */
function drawHarbourLand(ctx: CanvasRenderingContext2D, x: number, y: number, S: number) {
  ctx.fillStyle = 'rgba(255,248,220,0.9)';
  ctx.beginPath(); ctx.ellipse(x - S * 0.02, y + S * 0.05, S * 0.11, S * 0.05, -0.5, 0, Math.PI * 2); ctx.fill();
  // little houses
  for (const [dx, dy, roof] of [[0.03, -0.035, '#3a7ac8'], [0.055, -0.01, '#c8503a'], [0.02, 0.005, '#3a9a8a']] as const) {
    const hx = x + S * dx, hy = y + S * dy;
    ctx.fillStyle = '#f4ecd8'; ctx.fillRect(hx - 3.5, hy - 3, 7, 6);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(hx - 4.5, hy - 3); ctx.lineTo(hx, hy - 7); ctx.lineTo(hx + 4.5, hy - 3); ctx.closePath(); ctx.fill();
  }
  // lighthouse
  const lx = x - S * 0.075, ly = y - S * 0.04;
  ctx.fillStyle = '#8a8478'; ctx.beginPath(); ctx.ellipse(lx, ly + 1, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#d84a3a' : '#ffffff'; ctx.fillRect(lx - 2.4 + i * 0.2, ly - 4 - i * 3.5, 4.8 - i * 0.4, 3.6); }
  ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.arc(lx, ly - 17, 2.2, 0, Math.PI * 2); ctx.fill();
}

/** harbour at sea: a pier and two sailing boats bobbing off the coast */
function drawHarbourSea(ctx: CanvasRenderingContext2D, x: number, y: number, S: number, t: number) {
  ctx.fillStyle = '#8a5a34'; ctx.save(); ctx.translate(x - S * 0.1, y + S * 0.08); ctx.rotate(0.6); ctx.fillRect(-2, -1, S * 0.08, 3); ctx.restore();
  for (const [dx, dy, sail, ph] of [[-0.17, 0.1, '#ffffff', 0], [-0.05, 0.17, '#ffe8c0', 2]] as const) {
    const bx = x + S * dx + Math.sin(t / 1400 + ph) * 3, by = y + S * dy + Math.sin(t / 500 + ph) * 1.2;
    ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.moveTo(bx - 7, by); ctx.lineTo(bx + 7, by); ctx.lineTo(bx + 4, by + 3.5); ctx.lineTo(bx - 4, by + 3.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = sail; ctx.beginPath(); ctx.moveTo(bx, by - 1); ctx.lineTo(bx, by - 12); ctx.lineTo(bx + 6, by - 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - 13); ctx.stroke();
  }
}

/** the sky ruins: a floating island off the north-east coast with pillars and drifting clouds (clouded over until it opens) */
function drawSkyIsland(ctx: CanvasRenderingContext2D, x: number, y: number, S: number, t: number, open: boolean) {
  const bob = Math.sin(t / 900) * 2;
  const w = S * 0.11, h = S * 0.04, cy = y + bob;
  ctx.save();
  ctx.shadowColor = 'rgba(10,30,60,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 8;
  // rocky underside
  ctx.fillStyle = '#a89cc8';
  ctx.beginPath(); ctx.moveTo(x - w, cy); ctx.quadraticCurveTo(x - w * 0.5, cy + h * 1.6, x - w * 0.1, cy + h * 2.8); ctx.quadraticCurveTo(x + w * 0.4, cy + h * 1.7, x + w, cy); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#7e72a8';
  ctx.beginPath(); ctx.moveTo(x - w * 0.2, cy + h * 0.6); ctx.quadraticCurveTo(x, cy + h * 2, x - w * 0.1, cy + h * 2.8); ctx.quadraticCurveTo(x + w * 0.4, cy + h * 1.7, x + w, cy); ctx.closePath(); ctx.fill();
  // grassy gold top
  ctx.fillStyle = '#f6eab8'; ctx.beginPath(); ctx.ellipse(x, cy, w, h, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8d890'; ctx.beginPath(); ctx.ellipse(x + w * 0.1, cy + h * 0.3, w * 0.8, h * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  // ruined pillars + an arch
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#a89cc8'; ctx.lineWidth = 0.8;
  for (const [dx, hh] of [[-0.55, 12], [-0.3, 8], [0.35, 11], [0.6, 6]] as const) { ctx.fillRect(x + w * dx - 1.8, cy - hh, 3.6, hh); ctx.strokeRect(x + w * dx - 1.8, cy - hh, 3.6, hh); }
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(x + w * 0.02, cy - 4, 6, Math.PI, 0); ctx.stroke();
  // clouds drifting round it; a thick cloud bank while it is still sealed
  const clouds = open ? 3 : 7;
  for (let i = 0; i < clouds; i++) {
    const a = i / clouds * Math.PI * 2 + t / 7000;
    const cx = x + Math.cos(a) * w * (open ? 1.15 : 0.7), cyy = cy + h * 0.8 + Math.sin(a) * h * (open ? 1.6 : 1.1);
    ctx.fillStyle = open ? 'rgba(255,255,255,0.85)' : 'rgba(236,238,248,0.92)';
    for (const [ox, r] of [[-5, 4.5], [0, 6], [5, 4.5]] as const) { ctx.beginPath(); ctx.arc(cx + ox, cyy, r * (open ? 1 : 1.35), 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
