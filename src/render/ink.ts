// Thick ink contour around a whole sprite (hero, monster): draw it offscreen at device resolution,
// stamp a tinted silhouette in 8 directions behind it, then the sprite on top. One pass gives every
// class, hair style and headgear the same chunky cartoon outline as the painted props.

const INK = '#3a2618';
let off: HTMLCanvasElement | null = null, sil: HTMLCanvasElement | null = null;
/** glows met while painting offscreen: replayed on top so they never get an ink contour */
let deferring: { ctx: CanvasRenderingContext2D; list: { m: DOMMatrix; alpha: number; draw: (c: CanvasRenderingContext2D) => void }[] } | null = null;

/** draw a soft glow / aura; inside an inked() paint it is deferred and drawn over the contoured sprite */
export function glow(ctx: CanvasRenderingContext2D, draw: (c: CanvasRenderingContext2D) => void) {
  if (deferring && deferring.ctx === ctx) { deferring.list.push({ m: ctx.getTransform(), alpha: ctx.globalAlpha, draw }); return; }
  draw(ctx);
}

function canvas(c: HTMLCanvasElement | null, w: number, h: number) {
  const k = c ?? document.createElement('canvas');
  if (k.width < w || k.height < h) { k.width = Math.max(k.width, w); k.height = Math.max(k.height, h); }
  return k;
}

/**
 * Draw `paint` (in sprite units, origin at the feet) inside a box of `w`×`h` units whose origin sits at
 * (`ox`, `oy`) units from the box's top-left, with an ink contour `px` units thick.
 */
export function inked(ctx: CanvasRenderingContext2D, w: number, h: number, ox: number, oy: number, px: number, paint: (c: CanvasRenderingContext2D) => void) {
  const m = ctx.getTransform();
  const sc = Math.hypot(m.a, m.b);
  if (sc < 0.2) { paint(ctx); return; }
  const pw = Math.ceil(w * sc) + 8, ph = Math.ceil(h * sc) + 8;
  off = canvas(off, pw, ph); sil = canvas(sil, pw, ph);
  const o = off.getContext('2d')!, s = sil.getContext('2d')!;
  o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, pw, ph);
  o.setTransform(sc, 0, 0, sc, ox * sc + 4, oy * sc + 4);
  const prev = deferring;
  const pass = { ctx: o, list: [] as { m: DOMMatrix; alpha: number; draw: (c: CanvasRenderingContext2D) => void }[] };
  deferring = pass;
  try { paint(o); } finally { deferring = prev; }
  const glows = pass.list;
  s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, pw, ph);
  s.globalCompositeOperation = 'source-over'; s.drawImage(off, 0, 0);
  s.globalCompositeOperation = 'source-in'; s.fillStyle = INK; s.fillRect(0, 0, pw, ph);
  s.globalCompositeOperation = 'source-over';
  const r = Math.max(1, px * sc);
  const x = m.e - ox * sc - 4, y = m.f - oy * sc - 4;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ctx.drawImage(sil, 0, 0, pw, ph, x + Math.cos(a) * r, y + Math.sin(a) * r, pw, ph);
  }
  ctx.drawImage(off, 0, 0, pw, ph, x, y, pw, ph);
  const base = ctx.globalAlpha;
  for (const g of glows) {
    ctx.setTransform(new DOMMatrix([1, 0, 0, 1, x, y]).multiply(g.m));
    ctx.globalAlpha = base * g.alpha;
    ctx.save(); g.draw(ctx); ctx.restore();
  }
  ctx.restore();
}
