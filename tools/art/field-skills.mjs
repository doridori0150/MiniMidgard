#!/usr/bin/env node
// 필드에서 실제로 스킬을 쓰는 장면을 잡습니다: ?qa 파티(저장 안 함)를 사냥시키고, 스킬이 발동된 지 110~220ms(타격 무렵)인 화면을 찍습니다.
// 스킬 모션이 게임 안에서 그 스킬로 재생되는지(pose.skill) 함께 적습니다.
// 사용: node tools/art/field-skills.mjs --party knight,hunter,priest [--lv 60] [--equip 1:w_pike,2:w_bow] [--n 8] [--out-dir 폴더]
import fs from 'node:fs';
import path from 'node:path';
import { chromium, DEV } from './playwright.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const party = opt('--party', 'knight,knight,knight'), lv = opt('--lv', '60'), n = Number(opt('--n', '8')), outDir = opt('--out-dir', 'field-skills');
const equip = (opt('--equip', '') || '').split(',').filter(Boolean).map((s) => s.split(':'));
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(`${DEV}/?qa&party=${party}&lv=${lv}&zone=meadow&band=closed&art=d&bg=hd`); await p.waitForTimeout(1500);
await p.evaluate(async (equip) => {
  const st = await import('/src/game/state.ts'); const g = window.__game;
  for (const [i, item] of equip) { const inst = st.addItem(g.s, item); if (inst) st.equip(g.s, g.s.heroes[Number(i)], inst.uid); }
  g.s.stacks.am_arrow = 999; for (const h of g.s.heroes) st.equipAmmo?.(g.s, h, 'am_arrow');
  g.world.syncParty?.(); g.notify();
}, equip);
const shots = await p.evaluate((n) => new Promise((done) => {
  const g = window.__game; const cv = document.querySelector('canvas'); const out = []; const seen = new Set(); const t0 = performance.now();
  const tick = () => {
    const rt = g.world.renderTime;
    for (const h of g.world.heroes) {
      const sa = h.skillAnim; if (!sa) continue;
      const k = h.uid + ':' + sa.at, dt = rt - sa.at;
      if (!seen.has(k) && dt >= 110 && dt <= 220) { seen.add(k); out.push({ skill: sa.id, dt: Math.round(dt), poseSkill: g.renderer.lastPose?.get(h.uid)?.skill ?? null, cls: h.cls ?? h.d?.cls, img: cv.toDataURL('image/png') }); }
    }
    if (out.length >= n || performance.now() - t0 > 40000) done(out); else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), n);
shots.forEach((s, i) => { fs.writeFileSync(path.join(outDir, `${i}-${s.skill}.png`), Buffer.from(s.img.split(',')[1], 'base64')); delete s.img; });
for (const s of shots) console.log(`${s.skill}\t${s.dt}ms\t재생 모션: ${s.poseSkill ?? '(일반 동작)'}`);
console.log(errs.length ? '페이지 오류: ' + errs.join('\n') : '페이지 오류 없음');
await b.close();
