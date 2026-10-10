#!/usr/bin/env node
// 도트 영웅 모션 검사: 동작마다 연속 장 겹침(튐·같은 장)과 hitFrame 대 최대 뻗음을 잽니다. 측정 코드는 tools/art/lib/motion-metrics.mjs(공방 검사판과 같은 코드).
// 실루엣 = 뒷머리 + 몸 + 앞머리(무기 제외: 무기는 잔상 장에서 크게 바뀌는 것이 정상).
// 사용: node tools/art/motion-check.mjs [--only merchant_female_p2,…] [--anims attack,walk] [--json 출력.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { figureMask, sequenceMetrics, contactCheck } from './lib/motion-metrics.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { decodePng } = await import(path.resolve(root, '../asset-kit/tools/lib/png.mjs'));
const A = path.join(root, 'src/assets/pixel');
const M = JSON.parse(fs.readFileSync(path.join(A, 'manifest.json'), 'utf8'));
const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const only = opt('--only')?.split(','), anims = opt('--anims')?.split(','), jsonOut = opt('--json');
const [W, H] = M.canvas.size, footX = M.canvas.origin[0];

const cache = new Map();
const png = (rel) => { if (!rel) return null; if (!cache.has(rel)) cache.set(rel, decodePng(fs.readFileSync(path.join(A, rel)))); return cache.get(rel); };
const report = [];
for (const [id, c] of Object.entries(M.characters)) {
  if (only && !only.includes(id)) continue;
  const style = c.defaultHair ?? c.hairStyles?.[0], table = c.animations ?? M.animations;
  for (const [name, a] of Object.entries(table)) {
    if (anims && !anims.includes(name)) continue;
    if (a.frames.length < 2) continue;
    const masks = a.frames.map((f) => {
      const fr = c.frames[f], hp = style ? M.hair[style]?.poses?.[fr.head.pose] : null, [hx, hy] = fr.head.point;
      const at = (img, ox, oy) => img && { data: img.data, width: img.width, height: img.height, ox, oy };
      return figureMask([at(png(hp?.back), hx, hy), at(png(fr.image), 0, 0), at(png(hp?.front), hx, hy)], W, H);
    });
    const seq = sequenceMetrics(masks, { loop: !!a.loop });
    const tips = a.frames.map((f) => c.frames[f].weapon?.tipPoint ?? null);
    const contact = contactCheck(a.hitFrame, tips, footX);
    report.push({ id, anim: name, frames: a.frames.length, ...seq, contact });
  }
}
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2) + '\n');
for (const r of report) {
  const flags = [r.jumps.length && `튐 ${r.jumps.map((i) => `${i}→${i + 1}`).join(' ')}`, r.same.length && `같은 장 ${r.same.map((i) => `${i}→${i + 1}`).join(' ')}`, r.contact && r.contact.off && `접촉 hitFrame ${r.contact.hitFrame} / 뻗음 ${r.contact.reachFrame}`].filter(Boolean);
  if (flags.length) console.log(`${r.id} ${r.anim} (${r.frames}장): ${flags.join(' · ')}  [겹침 ${r.iou.join(' ')}]`);
}
console.log(`동작 ${report.length}개 검사, 걸린 것 ${report.filter((r) => r.jumps.length || r.same.length || r.contact?.off).length}개`);
