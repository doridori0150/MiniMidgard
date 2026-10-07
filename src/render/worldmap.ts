// Illustrated world map (continent, regions, roads, fog over locked zones).
import { ZONES, type ZoneDef } from '../game/data/zones.ts';
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

export const ROADS: [string, string][] = [
  ['town', 'meadow'], ['town', 'forest'], ['forest', 'cave'], ['town', 'desert'], ['desert', 'snow'], ['cave', 'snow'],
];

export function drawWorldMap(c: HTMLCanvasElement, unlocked: Set<string>, t: number) {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const W = c.clientWidth, H = c.clientHeight;
  if (!W || !H) return;
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = rng(1234);
  const P = (z: ZoneDef) => ({ x: z.map[0] / 100 * W, y: z.map[1] / 100 * H });
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
  for (const z of ZONES) {
    const p = P(z);
    const reg = REGION[z.theme] ?? REGION.meadow;
    const rr = reg.r * S * 1.6;
    const g = ctx.createRadialGradient(p.x, p.y, rr * 0.2, p.x, p.y, rr);
    g.addColorStop(0, reg.color); g.addColorStop(0.7, rgba(reg.color, 0.85)); g.addColorStop(1, rgba(reg.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.fill();
  }
  // decorations per region
  for (const z of ZONES) {
    const p = P(z);
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
    const open = unlocked.has(a) && unlocked.has(b);
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

  // fog over locked regions
  for (const z of ZONES) {
    if (unlocked.has(z.id)) continue;
    const p = P(z);
    const rr = (REGION[z.theme]?.r ?? 0.15) * S * 1.35;
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + t / 6000;
      const fx = p.x + Math.cos(a) * rr * 0.35, fy = p.y + Math.sin(a) * rr * 0.25;
      const g = ctx.createRadialGradient(fx, fy, 2, fx, fy, rr * 0.75);
      g.addColorStop(0, 'rgba(70,80,100,0.38)'); g.addColorStop(1, 'rgba(70,80,100,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, rr * 0.75, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();

  // compass
  ctx.save(); ctx.translate(W - 26, H - 30);
  ctx.fillStyle = 'rgba(255,250,230,0.9)'; ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c03a3a'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(4, 0); ctx.lineTo(-4, 0); ctx.fill();
  ctx.fillStyle = '#3a3a4a'; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(4, 0); ctx.lineTo(-4, 0); ctx.fill();
  ctx.fillStyle = '#3a2a1a'; ctx.font = "bold 8px 'Galmuri9', sans-serif"; ctx.textAlign = 'center'; ctx.fillText('N', 0, -16);
  ctx.restore();
}
