#!/usr/bin/env node
// 몸 그림에 남은 무기 조각 지우기: 몸 프레임(body/)에 무기 그림 일부가 함께 그려져 있으면, 무기를 빼거나 다른 무기를 들었을 때
// 그 조각이 허공에 뜹니다(위저드 지팡이, 어새신 카타르, 기사 검). 맨손 합성(몸 + 머리)에서 본체와 떨어진 작은 섬(< 12px) 가운데
// 그 캐릭터의 기본 무기 레이어가 완전히(알파 255) 덮는 것만 몸 프레임에서 지웁니다. 그래서 기본 무기를 든 모습은 한 픽셀도
// 바뀌지 않고(스스로 확인), 무기가 덮지 않는 점(공격 잔상 조각 등)과 쥐는 손(손가락 덮개 아래, 쥐는 점 5px 안)은 건드리지 않습니다.
// 다른 무기를 든 모습과 맨손은 떠 있던 무기 조각이 사라지는 만큼만 바뀝니다.
// 사용: node tools/art/clean-weapon-bits.mjs [--only knight_female_p2,…] [--dry]   (src/assets/pixel을 고침, 납품 폴더는 그대로)
// 납품을 다시 합치면(tools/art/merge-pixel.mjs) 이 정리도 다시 돌립니다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const kit = path.resolve(root, '../asset-kit/tools/lib/png.mjs');
const { decodePng, encodePng } = await import(kit);
const A = path.join(root, 'src/assets/pixel');
const M = JSON.parse(fs.readFileSync(path.join(A, 'manifest.json'), 'utf8'));
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const dry = args.includes('--dry');
// --near: also bits lying within 2 px of the weapon (a weapon copy baked a little off the layer); this changes the armed look
const near = args.includes('--near');
let offLayer = 0;
const nearWeapon = (wi, q) => { const x = q % W, y = (q / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && alpha(wi, ny * W + nx) >= 16) return true; } return false; };
const W = M.canvas.size[0], H = M.canvas.size[1], N = W * H;

const cache = new Map();
const img = (rel) => { if (!rel) return null; if (!cache.has(rel)) cache.set(rel, decodePng(fs.readFileSync(path.join(A, rel)))); return cache.get(rel); };
const alpha = (im, i) => im.data[i * 4 + 3];
function islands(layers) {
  const on = new Uint8Array(N);
  for (const L of layers) for (let i = 0; i < N; i++) if (alpha(L, i) >= 16) on[i] = 1;
  const seen = new Uint8Array(N), comps = [];
  for (let s = 0; s < N; s++) {
    if (seen[s] || !on[s]) continue;
    const st = [s], px = []; seen[s] = 1;
    while (st.length) { const q = st.pop(); px.push(q); const x = q % W, y = (q / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !seen[k] && on[k]) { seen[k] = 1; st.push(k); } } }
    comps.push(px);
  }
  const big = Math.max(0, ...comps.map((c) => c.length));
  return comps.filter((c) => c.length < big && c.length < 12);
}
function composite(layers) { const out = new Uint8Array(N * 4); for (const L of layers) for (let i = 0; i < N; i++) { const a = alpha(L, i); if (a) out.set(L.data.subarray(i * 4, i * 4 + 4), i * 4); } return out; }

let changedFrames = 0, cleared = 0;
for (const [id, c] of Object.entries(M.characters)) {
  if (only && !only.includes(id)) continue;
  const style = c.defaultHair ?? c.hairStyles?.[0], hair = style ? M.hair[style] : null;
  const dw = c.defaultWeapon;
  if (!dw || !M.weapons[dw]?.frames[id]) continue;
  let charCleared = 0;
  for (const [name, f] of Object.entries(c.frames)) {
    const body = img(f.image);
    const hp = hair?.poses?.[f.head.pose];
    // hair pieces at their head point (only canvas-aligned pieces matter here; shifted ones are rare and keep their bits)
    const hairs = (f.head.point[0] === 0 && f.head.point[1] === 0 ? [hp?.back, hp?.front] : []).map(img).filter(Boolean);
    const wi = img(M.weapons[dw].frames[id][name]);
    if (!wi || f.weapon?.visible === false || f.weapon?.byType?.[dw]?.visible === false) continue;
    const kill = [];
    // never the hand: a piece under the finger overlay or within 5 px of the grip point is the hand that holds the weapon
    const grip = f.grip ? img(f.grip) : null, gp = f.weapon?.gripPoint;
    const handish = (q) => (grip && alpha(grip, q) >= 16) || (gp && Math.hypot((q % W) - gp[0], ((q / W) | 0) - gp[1]) <= 5);
    for (const isl of islands([body, ...hairs])) {
      const bodyPx = isl.filter((q) => alpha(body, q) >= 16);
      if (bodyPx.some(handish)) continue;
      // covered by the weapon, or lying right along it (≤ 2 px): a copy of the weapon left in the body a little off its layer
      if (bodyPx.length && bodyPx.every((q) => alpha(wi, q) === 255)) kill.push(...bodyPx);
      else if (near && bodyPx.length && bodyPx.every((q) => nearWeapon(wi, q))) { kill.push(...bodyPx); offLayer += bodyPx.length; }
    }
    if (!kill.length) continue;
    // the look with the default weapon must stay exactly the same (the weapon covers what is removed)
    const before = composite([body, wi]);
    const next = { width: W, height: H, data: Buffer.from(body.data) };
    for (const q of kill) next.data.fill(0, q * 4, q * 4 + 4);
    const after = composite([next, wi]);
    if (!near) for (let i = 0; i < N * 4; i++) if (after[i] !== before[i]) throw new Error(`${id} ${name}: 기본 무기를 든 모습이 바뀝니다`);
    changedFrames++; cleared += kill.length; charCleared += kill.length;
    if (!dry) { fs.writeFileSync(path.join(A, f.image), encodePng(next)); cache.set(f.image, next); }
  }
  if (charCleared) console.log(`${id}: 몸 그림에서 무기 조각 ${charCleared}px 지움`);
}
console.log(`${dry ? '확인만: ' : ''}프레임 ${changedFrames}장, ${cleared}px${near ? ` (그중 무기 옆 ${offLayer}px: 무기를 든 모습도 그만큼 깨끗해짐)` : ''}`);
