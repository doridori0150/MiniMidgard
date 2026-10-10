#!/usr/bin/env node
// 아스트라 납품(minimidgard.pixel/1 폴더)을 게임의 도트 영웅 manifest(src/assets/pixel/manifest.json)에 합칩니다.
// 사용: node tools/art/merge-pixel.mjs <납품 폴더> [--only skill_bless,walk] [--dry]
//   --only 없이: 납품의 캐릭터를 통째로 바꾸고(animations·frames·skillMotions·머리), 무기 레이어를 더합니다.
//   --only: 그 캐릭터의 그 애니메이션들과 그 프레임들만 바꿉니다(한 동작만 다시 그린 보강 납품).
// 지키는 것: 다른 캐릭터가 쓰는 머리 이름과 겹치면 멈춤(머리 이름에는 직업 접두어), 빠진 파일이 있으면 멈춤.
// 합친 뒤: npm run asset:records → 개발 서버 재시작(Vite가 옛 PNG를 줌) → tools/art/hero-sheet.mjs로 확인.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const dry = args.includes('--dry');
if (!dir) { console.error('사용: node tools/art/merge-pixel.mjs <납품 폴더> [--only anim,anim] [--dry]'); process.exit(2); }
const A = 'src/assets/pixel';
const game = JSON.parse(fs.readFileSync(path.join(A, 'manifest.json'), 'utf8'));
const del = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));

const files = new Set();
const collect = (o) => { if (typeof o === 'string') { if (o.endsWith('.png')) files.add(o); } else if (o && typeof o === 'object') Object.values(o).forEach(collect); };
const fail = (msg) => { console.error('멈춤: ' + msg); process.exit(1); };

for (const [id, c] of Object.entries(del.characters)) {
  if (only) {
    const g = game.characters[id];
    if (!g) fail(`${id}: 게임에 없는 캐릭터라 --only로 일부만 합칠 수 없습니다`);
    const table = c.animations ?? del.animations;
    g.animations ??= structuredClone(game.animations);
    for (const anim of only) {
      if (!table[anim]) fail(`${id}: 납품에 ${anim}이 없습니다`);
      g.animations[anim] = table[anim];
      for (const name of table[anim].frames) { if (!c.frames[name]) fail(`${id}: 프레임 ${name} 없음`); g.frames[name] = c.frames[name]; collect(c.frames[name]); }
      for (const [w, v] of Object.entries(del.weapons ?? {})) for (const name of table[anim].frames) {
        const f = v.frames[id]?.[name]; if (!f) continue;
        ((game.weapons[w] ??= { frames: {} }).frames[id] ??= {})[name] = f; files.add(f);
      }
      for (const [h, v] of Object.entries(del.hair ?? {})) for (const name of table[anim].frames) {
        const pose = c.frames[name].head.pose, p = v.poses?.[pose]; if (!p) continue;
        if (!game.hair[h]) fail(`머리 ${h}가 게임에 없습니다`);
        game.hair[h].poses[pose] = p; collect(p);
      }
    }
  } else {
    for (const h of Object.keys(del.hair ?? {})) {
      const users = Object.entries(game.characters).filter(([cid, gc]) => cid !== id && ((gc.hairStyles ?? []).includes(h) || gc.defaultHair === h)).map(([cid]) => cid);
      if (users.length) fail(`머리 이름 ${h}을 ${users.join(', ')}도 씁니다. 납품 쪽 이름에 직업 접두어를 붙여 주세요`);
    }
    if (game.characters[id]) console.log(`바꿈: ${id}`);
    game.characters[id] = c; collect(c);
    for (const [h, v] of Object.entries(del.hair ?? {})) { game.hair[h] = v; collect(v); }
    for (const [w, v] of Object.entries(del.weapons ?? {})) { (game.weapons[w] ??= { frames: {} }).frames[id] = v.frames[id] ?? {}; collect(v.frames[id]); }
  }
}
const missing = [...files].filter((f) => !fs.existsSync(path.join(dir, f)));
if (missing.length) fail(`납품에 없는 파일 ${missing.length}개: ${missing.slice(0, 5).join(', ')}`);
if (dry) { console.log(`확인만: 파일 ${files.size}개를 복사할 예정`); process.exit(0); }
for (const f of files) { fs.mkdirSync(path.dirname(path.join(A, f)), { recursive: true }); fs.copyFileSync(path.join(dir, f), path.join(A, f)); }
fs.writeFileSync(path.join(A, 'manifest.json'), JSON.stringify(game, null, 2) + '\n');
// the delivery folder keeps its sources and build caches out of git
const gi = path.join(dir, '.gitignore');
if (!fs.existsSync(gi)) fs.writeFileSync(gi, 'sources/\n.swift-module-cache/\n*.zip\n');
console.log(`합침: ${dir} → ${A} (파일 ${files.size}개${only ? `, 동작 ${only.join(', ')}` : ''})`);
