// Claude review after fix 5 (2026-10-09): adopt the attempt-3 walk_2 candidates of thief♂ and merchant♀ (clean whole figures)
// in place of the leg-composite walk_2 kept from fix 4 (visible seam). The candidates closely match walk_0, so their
// anchors and grip overlay come from walk_0, moved by template matching: the hand patch of walk_0 is searched in the
// candidate (hand point + grip overlay shift with it), the head patch likewise for crown/side. Figure and hair mask are
// the candidate's own. Re-run: node docs/art-production/hero-sprites/adopt-walk2.mjs (reads the fix-4 frames from git)
import fs from 'node:fs';
import path from 'node:path';
import { read, save, blank } from './raster.mjs';

const R = path.dirname(new URL(import.meta.url).pathname);
const M = JSON.parse(fs.readFileSync(path.join(R, 'game-manifest.json'), 'utf8'));
const r3 = (v) => Math.round(v * 1000) / 1000;

/** offset (dx, dy) that best places the patch of `a` around `p` (half size `h`) onto `b`, searched within ±`range` */
function match(a, b, p, h, range) {
  let best = [0, 0], bestCost = Infinity;
  const px = Math.round(p[0]), py = Math.round(p[1]);
  for (let dy = -range; dy <= range; dy++) for (let dx = -range; dx <= range; dx++) {
    let cost = 0, n = 0;
    for (let y = py - h; y < py + h; y += 2) for (let x = px - h; x < px + h; x += 2) {
      const i = (y * a.width + x) * 4, j = ((y + dy) * b.width + (x + dx)) * 4;
      if (a.data[i + 3] < 128 && b.data[j + 3] < 128) continue;
      for (let k = 0; k < 4; k++) { const d = a.data[i + k] - b.data[j + k]; cost += d * d; }
      n++;
    }
    if (n && cost / n < bestCost) { bestCost = cost / n; best = [dx, dy]; }
  }
  return best;
}
function shifted(im, [dx, dy]) {
  const out = blank(im.width, im.height);
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    const sx = x - dx, sy = y - dy; if (sx < 0 || sy < 0 || sx >= im.width || sy >= im.height) continue;
    out.data.set(im.data.subarray((sy * im.width + sx) * 4, (sy * im.width + sx) * 4 + 4), (y * im.width + x) * 4);
  }
  return out;
}

/** the merchant candidate's mask misses the ponytail (left of the face, x < 190, y 120–245): add its cream pixels and their 1px rim */
function addPonytail(figFile, maskFile) {
  const fig = read(figFile), mask = read(maskFile), w = fig.width;
  const cream = (i) => fig.data[i + 3] > 128 && fig.data[i] > 236 && fig.data[i + 1] > 226 && fig.data[i + 2] > 198;
  const add = new Uint8Array(w * fig.height);
  for (let y = 120; y < 245; y++) for (let x = 40; x < 190; x++) if (cream((y * w + x) * 4)) add[y * w + x] = 1;
  for (let y = 121; y < 244; y++) for (let x = 41; x < 189; x++) {
    const p = y * w + x; if (add[p] || fig.data[p * 4 + 3] < 32) continue;
    if (add[p - 1] || add[p + 1] || add[p - w] || add[p + w]) add[p] = 2;
  }
  let n = 0;
  for (let p = 0; p < add.length; p++) if (add[p] && mask.data[p * 4] < 128) { mask.data.set([255, 255, 255, 255], p * 4); n++; }
  save(maskFile, mask);
  console.log('merchant walk_2 ponytail mask +', n, 'px');
}

const log = [];
for (const [id, line] of [['thief_male', 'thief'], ['merchant_female', 'merchant']]) {
  const f = M.characters[id].frames;
  const cand = (kind) => path.join(R, `rejected/fix5/${line}/attempt3/${kind}/${line}/walk_2.png`);
  const w0 = read(path.join(R, f.walk_0.image)), c = read(cand('frames'));
  const dHand = match(w0, c, f.walk_0.hand.point, 22, 40);
  const dHead = match(w0, c, [f.walk_0.crown.point[0], f.walk_0.crown.point[1] + 50], 45, 40);
  const before = { hand: f.walk_2.hand, crown: f.walk_2.crown, side: f.walk_2.side };
  fs.copyFileSync(cand('frames'), path.join(R, f.walk_2.image));
  fs.copyFileSync(cand('masks'), path.join(R, f.walk_2.hairMask));
  if (line === 'merchant') addPonytail(path.join(R, f.walk_2.image), path.join(R, f.walk_2.hairMask));
  save(path.join(R, f.walk_2.gripOverlay), shifted(read(path.join(R, f.walk_0.gripOverlay)), dHand));
  const move = (a, d) => ({ ...a, point: [r3(a.point[0] + d[0]), r3(a.point[1] + d[1])] });
  f.walk_2.hand = move(f.walk_0.hand, dHand);
  f.walk_2.crown = move(f.walk_0.crown, dHead);
  f.walk_2.side = move(f.walk_0.side, dHead);
  f.walk_2.source = `source/fix5/${line}-walk_2-attempt3.png`; f.walk_2.uniform_scale = f.walk_0.uniform_scale;
  log.push({ id, frame: 'walk_2', from: path.relative(R, cand('frames')), handShift: dHand, headShift: dHead, before, after: { hand: f.walk_2.hand, crown: f.walk_2.crown, side: f.walk_2.side } });
}
M.fix5.unresolved = (M.fix5.unresolved ?? []).filter((u) => u.frame !== 'walk_2');
M.fix5.claudeReview = { date: '2026-10-09', adopted: log, note: 'attempt-3 walk_2 adopted over the fix-4 leg composite (visible seam); grip overlay and anchors from walk_0 moved by template match. Which foot leads is not certain — accepted for 80px display' };
fs.writeFileSync(path.join(R, 'game-manifest.json'), JSON.stringify(M, null, 2) + '\n');
for (const l of log) console.log(l.id, 'hand shift', l.handShift, 'head shift', l.headShift);
