#!/usr/bin/env node
// 게임 렌더러(src/render/rig.ts → pixel.ts)로 그린 도트 영웅 확인 시트. 납품을 합친 뒤 "게임에서 실제로 이렇게 보인다"를 한 장으로 봅니다.
// 사용: node tools/art/hero-sheet.mjs <캐릭터 id> [--weapon <게임 무기>] [--out 시트.png]
//       node tools/art/hero-sheet.mjs --lineup [--out 시트.png]      (모든 도트 영웅의 대기·걷기·평타·피격·쓰러짐)
//   캐릭터 시트: 줄 = 걷기·평타·시전 + 그 캐릭터의 스킬 모션 전부(그 모션을 쓰는 첫 스킬로 재생 → 게임과 같은 130ms 접촉 맞춤),
//   칸 = 발동 후 ms(130ms가 타격). 개발 서버(npm run dev)가 떠 있어야 하고, 새 PNG를 넣었으면 서버를 다시 띄웁니다.
import fs from 'node:fs';
import { chromium, DEV } from './playwright.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const lineup = args.includes('--lineup');
const id = args.find((a, i) => !a.startsWith('--') && !['--weapon', '--out'].includes(args[i - 1]));
if (!lineup && !id) { console.error('사용: node tools/art/hero-sheet.mjs <캐릭터 id> [--weapon w] [--out f.png] | --lineup'); process.exit(2); }
const out = opt('--out', lineup ? 'hero-lineup.png' : `${id}-sheet.png`);

const b = await chromium.launch(); const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(DEV + '/?nothing');
const png = await p.evaluate(async ({ id, lineup, weapon }) => {
  const rig = await import('/src/render/rig.ts'); const W = await import('/src/render/whole.ts'); const P = await import('/src/render/pixel.ts');
  const M = await (await fetch('/src/assets/pixel/manifest.json')).json();
  await rig.loadRig(); W.setWholeEnabled(true); P.setPixelEnabled(true, 'p2');
  const GW = { sword: 'sword', spear: 'spear', staff: 'staff', bow: 'bow', mace: 'mace', dagger: 'dagger', katar: 'katar', axe: 'axe' };
  const look = (cid, w) => { const c = M.characters[cid]; return { cls: c.class, gender: c.gender === 'male' ? 'm' : 'f', hair: 0, hairColor: 3, skin: 0, dye: 0, wtype: w || GW[c.defaultWeapon] || 'none', refine: 0, shield: false }; };
  const swing = (w) => (w === 'bow' ? 200 : w === 'spear' ? 298 : 280);
  let rows, cols;
  if (lineup) {
    cols = [['대기', (t) => ({ state: 'idle', t })], ['걷기', (t) => ({ state: 'walk', t })], ['걷기 270', (t) => ({ state: 'walk', t: 270 })], ['평타 40', () => ({ state: 'attack', t: 40 })], ['평타 90', () => ({ state: 'attack', t: 90 })], ['평타 135', () => ({ state: 'attack', t: 135 })], ['평타 160', () => ({ state: 'attack', t: 160 })], ['평타 210', () => ({ state: 'attack', t: 210 })], ['평타 260', () => ({ state: 'attack', t: 260 })], ['피격', () => ({ state: 'hurt', t: 0 })], ['쓰러짐', () => ({ state: 'dead', t: 900 })]];
    rows = Object.keys(M.characters).map((cid) => ({ label: cid, L: look(cid), pose: (col) => col[1](0) }));
    rows.forEach((r) => (r.pose = (col) => ({ ...col[1](0), dur: swing(r.L.wtype), facing: 1 })));
  } else {
    const c = M.characters[id]; if (!c) return 'unknown ' + id;
    const L = look(id, weapon), tb = c.animations ?? M.animations, d = swing(L.wtype);
    cols = [0, 50, 100, 130, 180, 260, 340, 420, 500, 600, 700].map((t) => [t + 'ms' + (t === 130 ? ' (타격)' : ''), t]);
    rows = [{ label: '걷기', pose: ([, t]) => ({ state: 'walk', t, facing: 1 }) }, { label: '평타 (칸 시간을 스윙에 맞춰 펼침)', pose: ([, t]) => ({ state: 'attack', t: t * d / 700, dur: d, facing: 1 }) }];
    if (tb.cast) rows.push({ label: '시전', pose: ([, t]) => ({ state: 'cast', t, since: t, facing: 1 }) });
    for (const anim of Object.keys(tb).filter((k) => k.startsWith('skill_'))) {
      const skill = Object.entries(c.skillMotions ?? {}).find(([, v]) => v === anim)?.[0];
      rows.push({ label: `${anim}${skill ? ' · ' + skill : ''}`, pose: ([, t]) => (skill ? { state: 'attack', t: 0, dur: d, facing: 1, skill, skillT: t } : { state: 'idle', t, facing: 1, anim }) });
    }
    rows.forEach((r) => (r.L = L));
  }
  const S = 2, CW = 84, CH = 92, LW = 170; const cv = document.createElement('canvas'); cv.width = (LW + CW * cols.length) * S; cv.height = (CH * rows.length + 16) * S;
  const x = cv.getContext('2d'); x.fillStyle = '#cfe0b8'; x.fillRect(0, 0, cv.width, cv.height); x.scale(S, S);
  x.fillStyle = '#223'; x.font = '9px sans-serif'; cols.forEach((c, i) => x.fillText(c[0], LW + i * CW + 4, 10));
  rows.forEach((r, ri) => {
    x.fillStyle = '#223'; x.font = '10px sans-serif'; x.fillText(r.label, 4, 16 + ri * CH + 50);
    cols.forEach((col, i) => { x.save(); x.translate(LW + i * CW + CW / 2, 16 + ri * CH + CH - 8); rig.drawRigHero(x, r.L, { facing: 1, ...r.pose(col) }); x.restore(); });
  });
  return cv.toDataURL('image/png');
}, { id, lineup, weapon: opt('--weapon', '') });
await b.close();
if (!png.startsWith('data:')) { console.error(png); process.exit(1); }
fs.writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
console.log(out + (errs.length ? '\n페이지 오류: ' + errs.join('\n') : ''));
