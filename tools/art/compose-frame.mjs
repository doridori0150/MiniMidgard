#!/usr/bin/env node
// 게임 도트 영웅 한 장을 게임과 같은 순서로 합쳐 PNG로 냅니다(뒷머리 → 뒤 무기 → 몸 → 앞머리 → 앞 무기 → 손가락 덮개). 요청서 첨부(SSOT)용.
// 사용: node tools/art/compose-frame.mjs <캐릭터 id> <프레임> <출력.png> [--scale 4] [--weapon katar|none]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { decodePng, encodePng } = await import(path.resolve(root, '../asset-kit/tools/lib/png.mjs'));
const A = path.join(root, 'src/assets/pixel');
const M = JSON.parse(fs.readFileSync(path.join(A, 'manifest.json'), 'utf8'));
const [id, frame, out] = process.argv.slice(2), args = process.argv.slice(2);
const S = args.includes('--scale') ? Number(args[args.indexOf('--scale') + 1]) : 1;
const c = M.characters[id], f = c.frames[frame];
const wtype = args.includes('--weapon') ? args[args.indexOf('--weapon') + 1] : c.defaultWeapon;
const [W, H] = M.canvas.size;
const rd = (rel) => (rel ? decodePng(fs.readFileSync(path.join(A, rel))) : null);
const hp = M.hair[c.defaultHair ?? c.hairStyles?.[0]]?.poses?.[f.head.pose];
const wf = wtype && wtype !== 'none' ? M.weapons[wtype]?.frames?.[id]?.[frame] : null;
const wz = f.weapon?.byType?.[wtype]?.z ?? f.weapon?.z ?? 'front', wvis = f.weapon?.byType?.[wtype]?.visible ?? f.weapon?.visible ?? true;
const [hx, hy] = f.head.point;
const layers = [[rd(hp?.back), hx, hy], wvis && wz === 'behind' ? [rd(wf), 0, 0] : null, [rd(f.image), 0, 0], [rd(hp?.front), hx, hy], wvis && wz !== 'behind' ? [rd(wf), 0, 0] : null, wvis && wz !== 'behind' && f.grip ? [rd(f.grip), 0, 0] : null].filter((l) => l && l[0]);
const o = { width: W * S, height: H * S, data: Buffer.alloc(W * S * H * S * 4) };
for (const [L, ox, oy] of layers) for (let y = 0; y < L.height; y++) for (let x = 0; x < L.width; x++) {
  const si = (y * L.width + x) * 4; if (L.data[si + 3] < 16) continue;
  const X = x + ox, Y = y + oy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
  for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) { const di = ((Y * S + dy) * W * S + X * S + dx) * 4; o.data[di] = L.data[si]; o.data[di + 1] = L.data[si + 1]; o.data[di + 2] = L.data[si + 2]; o.data[di + 3] = 255; }
}
fs.writeFileSync(out, encodePng(o)); console.log(out, `${W * S}×${H * S}`, wtype);
