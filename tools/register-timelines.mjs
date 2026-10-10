#!/usr/bin/env node
// 스킬 연출 타임라인(timeline@1, asset-kit docs/타임라인-형식.md)을 게임에 등록합니다.
// 1) asset-kit의 공통 함수(tools/lib/timeline.mjs)를 src/render/vendor/asset-kit-timeline.js로 복사합니다(게임은 이 저장소만으로 빌드되니까).
// 2) src/assets/timelines/*.json을 검사합니다: 공통 검사(validateTimeline) + 미니 미드가르 검사
//    - skills: 이 타임라인을 띄우는 스킬 id(필수, src/game/data/skills.ts에 있어야 함)
//    - fx game:<이름>은 src/render/field.ts의 이펙트 이름, sound key는 public/audio/manifest.json의 효과음
//    - motion anim은 subject 캐릭터(src/assets/pixel/manifest.json)의 애니메이션
// 사용: node tools/register-timelines.mjs [--kit ../asset-kit]   (npm run timelines)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const kit = path.resolve(root, args.includes('--kit') ? args[args.indexOf('--kit') + 1] : '../asset-kit');
const src = path.join(kit, 'tools/lib/timeline.mjs'), dst = path.join(root, 'src/render/vendor/asset-kit-timeline.js');
if (fs.existsSync(src)) {
  let rev = '?';
  try { rev = execSync('git rev-parse --short HEAD', { cwd: kit }).toString().trim(); } catch {}
  const body = fs.readFileSync(src, 'utf8');
  const head = `// asset-kit ${rev} tools/lib/timeline.mjs 복사본 — 고치지 말고 asset-kit에서 고친 뒤 npm run timelines로 다시 복사합니다.\n`;
  const old = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8') : '';
  if (old.slice(old.indexOf('\n') + 1) !== body) { fs.writeFileSync(dst, head + body); console.log(`복사: asset-kit ${rev} timeline.mjs → ${path.relative(root, dst)}`); }
} else if (!fs.existsSync(dst)) { console.error(`asset-kit을 찾지 못했습니다: ${kit}`); process.exit(1); }
const TL = await import(pathToFileURL(dst).href);

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const skillIds = new Set([...read('src/game/data/skills.ts').matchAll(/\bid: '([a-z0-9_]+)'/g)].map((m) => m[1]));
for (const m of read('src/game/data/skills.ts').matchAll(/^(?:bolt|safetyWall)\('([a-z0-9_]+)'/gm)) skillIds.add(m[1]);
const fxNames = new Set([...read('src/render/field.ts').matchAll(/case '([a-zA-Z0-9_]+)':/g)].map((m) => m[1]));
const sounds = new Set(Object.keys(JSON.parse(read('public/audio/manifest.json')).sfx));
const pixel = JSON.parse(read('src/assets/pixel/manifest.json'));

const dir = path.join(root, 'src/assets/timelines');
let bad = 0;
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const tl = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const e = TL.validateTimeline(tl);
  if (!Array.isArray(tl.skills) || !tl.skills.length) e.push('skills(이 타임라인을 띄우는 스킬 id)가 없습니다');
  for (const s of tl.skills ?? []) if (!skillIds.has(s)) e.push(`모르는 스킬 ${s}`);
  const ch = tl.subject && pixel.characters[tl.subject];
  if (tl.subject && !ch) e.push(`모르는 캐릭터 ${tl.subject}`);
  for (const tr of tl.tracks ?? []) for (const c of tr.clips ?? []) {
    if (tr.type === 'fx' && c.ref?.startsWith('game:') && !fxNames.has(c.ref.slice(5)) && !c.optional) e.push(`${tr.id}: 게임에 없는 이펙트 ${c.ref}`);
    if (tr.type === 'sound' && c.key && !sounds.has(c.key) && !c.optional) e.push(`${tr.id}: 없는 효과음 ${c.key}`);
    if (tr.type === 'motion' && ch && !(ch.animations ?? pixel.animations)[c.anim]) e.push(`${tr.id}: ${tl.subject}에 없는 애니메이션 ${c.anim}`);
  }
  if (e.length) { bad++; console.log(`✖ ${f}\n  - ${e.join('\n  - ')}`); }
  else console.log(`✔ ${f}: ${tl.skills.join(', ')} · ${tl.tier ?? 'skill'} · ${Math.round(TL.duration(tl))}ms · 트랙 ${tl.tracks.length}`);
}
process.exit(bad ? 1 : 0);
