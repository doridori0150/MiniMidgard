#!/usr/bin/env node
// 도트 영웅 시간 규격: 같은 파티가 함께 걷고 숨 쉴 때 박자가 맞도록, 반복 동작의 한 바퀴 길이를 모든 영웅에서 같게 맞춥니다.
// 장마다의 비율(예: 상인 대기 440/280/120)은 그대로 두고 전체 길이만 늘이거나 줄입니다(10ms 단위, 합은 정확히 맞춤).
// 규격: 걷기 한 바퀴 720ms(두 걸음, 기사·쿠키 8장 × 90ms 기준), 대기 한 바퀴 840ms. 공격·스킬은 게임이 타격 시각에 맞춰 늘이므로 건드리지 않습니다.
// 사용: node tools/art/normalize-timing.mjs [--dry]   (tools/art/merge-pixel.mjs가 합친 뒤 자동으로 돌림)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LOOP_MS = { walk: 720, idle: 840 };

/** scale an animation's durations to `total` ms, keeping their proportions (10 ms steps, the sum exact) */
export function fitDurations(durations, total) {
  const sum = durations.reduce((a, b) => a + b, 0);
  const out = durations.map((d) => Math.max(10, Math.round((d * total) / sum / 10) * 10));
  let diff = total - out.reduce((a, b) => a + b, 0);
  for (let i = 0; diff !== 0; i = (i + 1) % out.length) { const step = diff > 0 ? 10 : -10; if (out[i] + step >= 10) { out[i] += step; diff -= step; } }
  return out;
}

export function normalizeTiming(manifest) {
  const changed = [];
  for (const [id, c] of Object.entries(manifest.characters)) {
    const table = c.animations ?? manifest.animations;
    for (const [anim, total] of Object.entries(LOOP_MS)) {
      const a = table[anim];
      if (!a || a.duration === total) continue;
      const before = a.duration;
      a.durations = fitDurations(a.durations, total);
      a.duration = total;
      changed.push(`${id} ${anim} ${before}→${total}ms`);
    }
  }
  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/assets/pixel/manifest.json');
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  const changed = normalizeTiming(m);
  if (!process.argv.includes('--dry') && changed.length) fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n');
  console.log(changed.length ? changed.join('\n') : '이미 규격에 맞습니다');
}
