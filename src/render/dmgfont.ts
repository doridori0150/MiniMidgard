// RO-style damage numbers: chunky outlined digits pre-rendered into per-style atlases.
import type { DmgKind } from '../game/world.ts';

interface Style { top: string; bottom: string; stroke: string; size: number }
const STYLES: Record<string, Style> = {
  normal: { top: '#ffffff', bottom: '#d8dce8', stroke: '#141018', size: 26 },
  crit: { top: '#fff6a0', bottom: '#ffa020', stroke: '#4a1400', size: 32 },
  taken: { top: '#ffb0a0', bottom: '#e02828', stroke: '#2a0404', size: 24 },
  heal: { top: '#d8ffc8', bottom: '#30c040', stroke: '#042a08', size: 24 },
  sp: { top: '#d0e4ff', bottom: '#3a70ff', stroke: '#040c2a', size: 22 },
  total: { top: '#fff0a0', bottom: '#ffc020', stroke: '#3a2000', size: 30 },
  zero: { top: '#a8a8b0', bottom: '#78787e', stroke: '#141018', size: 22 },
  absorb: { top: '#e6f8ff', bottom: '#5ab8f0', stroke: '#06202e', size: 21 },
};
const GLYPHS = '0123456789+';
const glyph = (ch: string) => (ch === '+' ? 10 : ch.charCodeAt(0) - 48);

interface Atlas { canvas: HTMLCanvasElement; x: number[]; w: number[]; h: number; text: Map<string, HTMLCanvasElement> }
const atlases = new Map<string, Atlas>();
const FONT = "900 {s}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
const K = 2; // supersample

function makeAtlas(key: string): Atlas {
  const st = STYLES[key] ?? STYLES.normal;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const font = FONT.replace('{s}', String(st.size * K));
  ctx.font = font;
  const pad = 4 * K;
  const ws = GLYPHS.split('').map((g) => Math.ceil(ctx.measureText(g).width) + pad * 2);
  const h = Math.ceil(st.size * K * 1.25) + pad * 2;
  c.width = ws.reduce((a, b) => a + b, 0);
  c.height = h;
  const xs: number[] = [];
  let x = 0;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (let i = 0; i < GLYPHS.length; i++) {
    xs.push(x);
    const g = ctx.createLinearGradient(0, pad, 0, h - pad);
    g.addColorStop(0, st.top); g.addColorStop(1, st.bottom);
    ctx.lineWidth = 4.5 * K;
    ctx.strokeStyle = st.stroke;
    ctx.strokeText(GLYPHS[i], x + pad, h / 2);
    ctx.fillStyle = g;
    ctx.fillText(GLYPHS[i], x + pad, h / 2);
    x += ws[i];
  }
  return { canvas: c, x: xs, w: ws, h, text: new Map() };
}

function atlas(kind: string): Atlas {
  let a = atlases.get(kind);
  if (!a) { a = makeAtlas(kind); atlases.set(kind, a); }
  return a;
}

function textSprite(kind: string, text: string): HTMLCanvasElement {
  const a = atlas(kind);
  let c = a.text.get(text);
  if (c) return c;
  const st = STYLES[kind] ?? STYLES.normal;
  c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const font = FONT.replace('{s}', String(Math.round(st.size * K * 0.85)));
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 10 * K;
  c.width = w; c.height = a.h;
  ctx.font = font; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const g = ctx.createLinearGradient(0, 0, 0, a.h);
  g.addColorStop(0, st.top); g.addColorStop(1, st.bottom);
  ctx.lineWidth = 4.5 * K; ctx.strokeStyle = st.stroke; ctx.strokeText(text, 5 * K, a.h / 2);
  ctx.fillStyle = g; ctx.fillText(text, 5 * K, a.h / 2);
  a.text.set(text, c);
  return c;
}

export interface DmgNum { x: number; y: number; vx: number; vy: number; t0: number; n: number; kind: DmgKind; life: number }

/** draws in screen space; (x,y) is the anchor (bottom-center) */
export function drawNumber(ctx: CanvasRenderingContext2D, d: DmgNum, sx: number, sy: number, age: number, scale: number) {
  const p = age / d.life;
  const pop = age < 110 ? 1 + (1 - age / 110) * (d.kind === 'crit' || d.kind === 'total' ? 0.9 : 0.55) : 1;
  const shrink = 1 - Math.max(0, p - 0.55) * 0.5;
  const alpha = p < 0.7 ? 1 : Math.max(0, 1 - (p - 0.7) / 0.3);
  const s = scale * pop * shrink / K;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (d.kind === 'miss' || d.kind === 'lucky') {
    const spr = textSprite(d.kind === 'miss' ? 'zero' : 'heal', d.kind === 'miss' ? 'MISS' : 'LUCKY!');
    ctx.drawImage(spr, sx - spr.width * s / 2, sy - spr.height * s, spr.width * s, spr.height * s);
    ctx.restore();
    return;
  }
  const key = d.kind === 'normal' ? 'normal' : d.kind;
  const a = atlas(key);
  // recoveries read as gains, not hits: a leading "+" (the colour alone isn't the only cue)
  const str = (d.kind === 'heal' || d.kind === 'sp' ? '+' : '') + String(d.n);
  let total = 0;
  for (const ch of str) total += a.w[glyph(ch)] - 8 * K;
  let x = sx - (total * s) / 2;
  const y = sy - a.h * s;
  if (d.kind === 'crit') {
    // spiky red burst behind crits (RO flavor)
    const r = (total * s) / 2 + 10 * scale;
    ctx.save();
    ctx.translate(sx, y + a.h * s / 2);
    ctx.rotate(age / 600);
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const rr = i % 2 ? r * 0.62 : r;
      const ang = (i / 20) * Math.PI * 2;
      ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr * 0.72);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(220,30,30,0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,120,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
  for (const ch of str) {
    const i = glyph(ch);
    ctx.drawImage(a.canvas, a.x[i], 0, a.w[i], a.h, x - 4 * K * s, y, a.w[i] * s, a.h * s);
    x += (a.w[i] - 8 * K) * s;
  }
  ctx.restore();
}

export function warmFont() { for (const k of Object.keys(STYLES)) atlas(k); }
