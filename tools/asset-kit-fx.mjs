#!/usr/bin/env node
// 기본 이펙트 시트(src/assets/fx/sheets, PXF 엔진으로 렌더한 64px 칸 가로 한 줄)를 에셋 공방 표준 기록으로 만듭니다.
// 공방에서 기본 이펙트 14종을 프레임 단위로 재생·검사합니다. 시트는 회색 기준색 5단(palette)이고, 공방은 fxTints의 램프로 정확히 바꿔 입힙니다(게임과 같은 ramps.json).
// 사용: node tools/asset-kit-fx.mjs (npm run asset:records가 함께 돌림) → asset-records/fx/manifest.json
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lib = JSON.parse(fs.readFileSync(path.join(root, 'src/assets/fx/library.json'), 'utf8'));
const ramps = JSON.parse(fs.readFileSync(path.join(root, 'src/assets/fx/ramps.json'), 'utf8'));
const sheets = [];
for (const [id, L] of Object.entries(lib)) {
  const file = `src/assets/fx/sheets/${id}.png`;
  const buf = fs.readFileSync(path.join(root, file));
  const dur = Math.round(1000 / L.fps);
  sheets.push({
    id: 'fx', kind: id, category: 'effect', title: L.name, file, sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    size: [L.cell * L.frames, L.cell], cell: [L.cell, L.cell], grid: [L.frames, 1], loop: L.loop, impactFrame: L.impact, palette: ramps.key,
    frames: Array.from({ length: L.frames }, (_, i) => ({ rect: [i * L.cell, 0, L.cell, L.cell], duration: dur })),
  });
}
const out = {
  kit: 1,
  source: 'src/assets/fx/library.json (tools/fx/pxf-graphs.mjs → PXF 엔진 렌더)',
  // PXF 계약: 64px 칸 가장자리 3~5px 여유
  checkRules: { guard: 3 },
  // the game's colour ramps (src/assets/fx/ramps.json): the workshop swaps each sheet's palette (the key greys) for one of these
  fxTints: ramps.ramps,
  display: { pixel: true },
  sheets,
};
fs.mkdirSync(path.join(root, 'asset-records/fx'), { recursive: true });
fs.writeFileSync(path.join(root, 'asset-records/fx/manifest.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`asset-records/fx/manifest.json: 기본 이펙트 ${sheets.length}종`);
