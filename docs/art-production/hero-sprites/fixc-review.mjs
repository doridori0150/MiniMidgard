// Claude review after batch c (2026-10-09).
// 1. Hair masks: drop skin pixels and skin-outline blends (warm: r > 185, r−g ≥ 28, g−b ≥ 8) that leaked into the hair mask, so a hair
//    tint no longer stains the face with specks (swordsman♀ most frames, novice♀, merchant♀ walk_2, archer♂ 2 frames).
// 2. swordsman♀ walk_2: 7% taller than the other frames (331 px vs 309 idle, head ~4% larger) — scaled 0.96 about the feet
//    origin (220,360), figure + mask + grip + anchors together. Run once: node docs/art-production/hero-sprites/fixc-review.mjs
import fs from 'node:fs';
import path from 'node:path';
import { read, save, transform, components } from './raster.mjs';

const R = path.dirname(new URL(import.meta.url).pathname);
const M = JSON.parse(fs.readFileSync(path.join(R, 'game-manifest.json'), 'utf8'));
const skin = (d, i) => d[i] > 185 && d[i] - d[i + 1] >= 28 && d[i + 1] - d[i + 2] >= 8;

const log = { maskSkinRemoved: {}, scaled: [] };
const f = M.characters.swordsman_female.frames.walk_2;
if (!M.fixcReview) {
  const s = 0.96, [ox, oy] = M.canvas.origin;
  const m = [1 / s, 0, ox * (1 - 1 / s), 0, 1 / s, oy * (1 - 1 / s)];
  for (const file of [f.image, f.hairMask, f.gripOverlay].filter(Boolean)) {
    const im = read(path.join(R, file));
    save(path.join(R, file), transform(im, im.width, im.height, m));
  }
  const move = (a) => ({ ...a, point: [Math.round((ox + s * (a.point[0] - ox)) * 1000) / 1000, Math.round((oy + s * (a.point[1] - oy)) * 1000) / 1000] });
  f.hand = move(f.hand); f.crown = move(f.crown); f.side = move(f.side);
  f.uniform_scale = (f.uniform_scale ?? 1) * s;
  log.scaled.push({ id: 'swordsman_female', frame: 'walk_2', scale: s, origin: [ox, oy] });
}
for (const [id, c] of Object.entries(M.characters)) for (const [st, fr] of Object.entries(c.frames)) {
  const im = read(path.join(R, fr.image)), mk = read(path.join(R, fr.hairMask));
  let n = 0;
  for (let i = 0; i < im.data.length; i += 4) {
    if (mk.data[i] < 128 || im.data[i + 3] < 200 || !skin(im.data, i)) continue;
    mk.data[i] = mk.data[i + 1] = mk.data[i + 2] = 0; n++;
  }
  if (n) { save(path.join(R, fr.hairMask), mk); log.maskSkinRemoved[`${id}/${st}`] = n; }
}
// 3. cream specks painted on the face (a hair-coloured island in the mask whose 2px ring is mostly skin): repaint them with
//    the ring's average skin colour and drop them from the mask, so they neither show as light dots nor take the hair tint
log.faceSpecks = {};
for (const [id, c] of Object.entries(M.characters)) for (const [st, fr] of Object.entries(c.frames)) {
  const im = read(path.join(R, fr.image)), mk = read(path.join(R, fr.hairMask)), w = im.width;
  const islands = components(mk, (r) => r >= 128).filter((cc) => cc.pts.length < 200);
  let fixed = 0;
  for (const cc of islands) {
    const inside = new Set(cc.pts), ring = new Set();
    for (const p of cc.pts) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const q = p + dy * w + dx; if (!inside.has(q) && q >= 0 && q < w * im.height) ring.add(q);
    }
    const skinRing = [...ring].filter((q) => im.data[q * 4 + 3] > 200 && skin(im.data, q * 4));
    if (skinRing.length < ring.size * 0.5) continue;
    const avg = [0, 1, 2].map((k) => Math.round(skinRing.reduce((a, q) => a + im.data[q * 4 + k], 0) / skinRing.length));
    for (const p of cc.pts) { if (im.data[p * 4 + 3] > 200) im.data.set(avg, p * 4); mk.data.set([0, 0, 0], p * 4); }
    fixed += cc.pts.length;
  }
  if (fixed) { save(path.join(R, fr.image), im); save(path.join(R, fr.hairMask), mk); log.faceSpecks[`${id}/${st}`] = fixed; }
}
M.fixcReview = { date: '2026-10-09', ...(M.fixcReview ?? {}), ...log, scaled: [...(M.fixcReview?.scaled ?? []), ...log.scaled] };
fs.writeFileSync(path.join(R, 'game-manifest.json'), JSON.stringify(M, null, 2) + '\n');
console.log(JSON.stringify(log));
