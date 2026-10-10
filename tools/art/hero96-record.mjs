#!/usr/bin/env node
// 96px 시범 영웅의 공방 기록: docs/art-production/pixel-<직업>-96/<동작>[_a|_b]/ 납품(층 PNG + pose.json, 256×240, 발 (128,224))을
// asset-records/pixel-heroes-96/manifest.json으로 만듭니다(파이프라인 B-5-1). 후보는 candidate: true, 사용자가 고른 쪽을 <동작>으로 바꿉니다.
// 사용: node tools/art/hero96-record.mjs (npm run asset:records가 함께 돌림)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const prodDir = path.join(root, 'docs/art-production');
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const game = JSON.parse(fs.readFileSync(path.join(root, 'src/assets/pixel/manifest.json'), 'utf8'));
const sheets = [];
for (const dir of fs.readdirSync(prodDir).filter((d) => /^pixel-[a-z]+-96$/.test(d))) {
  const cls = dir.match(/^pixel-([a-z]+)-96$/)[1];
  const id = Object.keys(game.characters).find((c) => game.characters[c].class === cls)?.replace(/_p2$/, '_p96') ?? `${cls}_p96`;
  const weapon = Object.values(game.characters).find((c) => c.class === cls)?.defaultWeapon;
  for (const sub of fs.readdirSync(path.join(prodDir, dir)).filter((d) => fs.existsSync(path.join(prodDir, dir, d, 'pose.json'))).sort()) {
    const P = path.join(prodDir, dir, sub), pose = JSON.parse(fs.readFileSync(path.join(P, 'pose.json'), 'utf8')), w = pose.weapon ?? {};
    const has = (f) => fs.existsSync(path.join(P, f)) && fs.statSync(path.join(P, f)).size > 0;
    const overlays = {};
    if (weapon && has(`${weapon}.png`)) overlays[`weapon:${weapon}`] = { file: rel(path.join(P, `${weapon}.png`)), z: w.z ?? 'front' };
    if (has('grip.png')) overlays.grip = rel(path.join(P, 'grip.png'));
    if (has('hair_back.png')) overlays.hair_back = rel(path.join(P, 'hair_back.png'));
    if (has('hair_front.png')) overlays.hair_front = rel(path.join(P, 'hair_front.png'));
    const candidate = /_[a-z]$/.test(sub);
    sheets.push({
      id, kind: sub, category: 'motion', layout: 'frames', canvas: [256, 240], bodyHeight: 96, gameHeight: 96, loop: true,
      ...(candidate ? { candidate: true } : {}), overlayDefaults: weapon ? { weapon } : undefined, source: rel(P),
      frames: [{
        name: `${sub}_0`, file: rel(path.join(P, 'body.png')), sha256: sha(path.join(P, 'body.png')), pivot: pose.origin ?? [128, 224], duration: 400,
        anchors: {
          ...((w.gripPoint ?? w.grip) ? { hand: { point: w.gripPoint ?? w.grip, angle: w.angleDegrees ?? w.angle ?? 0, z: w.z ?? 'front', visible: true } } : {}),
          ...((w.tipPoint ?? w.tip) ? { tip: { point: w.tipPoint ?? w.tip, visible: true } } : {}),
        },
        overlays,
      }],
    });
  }
}
// keyposes/<동작>_<n>_<역할>/ → candidate sheets keyposes_<동작> (frames in folder order; the idle sheet also starts with the approved idle)
// and assembly_<동작>.json next to them → candidate sheets <동작>_candidate (assembly@1)
for (const dir of fs.readdirSync(prodDir).filter((d) => /^pixel-[a-z]+-96$/.test(d))) {
  const cls = dir.match(/^pixel-([a-z]+)-96$/)[1];
  const id = Object.keys(game.characters).find((c) => game.characters[c].class === cls)?.replace(/_p2$/, '_p96') ?? `${cls}_p96`;
  const weapon = Object.values(game.characters).find((c) => c.class === cls)?.defaultWeapon;
  const kp = path.join(prodDir, dir, 'keyposes');
  const groups = {};
  if (fs.existsSync(kp)) for (const sub of fs.readdirSync(kp).filter((d) => fs.existsSync(path.join(kp, d, 'pose.json'))).sort()) (groups[sub.split('_')[0]] ??= []).push(path.join(kp, sub));
  if (groups.idle && fs.existsSync(path.join(prodDir, dir, 'idle', 'pose.json'))) groups.idle.unshift(path.join(prodDir, dir, 'idle'));
  for (const [action, folders] of Object.entries(groups)) {
    const frames = folders.map((P) => {
      const pose = JSON.parse(fs.readFileSync(path.join(P, 'pose.json'), 'utf8')), w = pose.weapon ?? {};
      const has = (f) => fs.existsSync(path.join(P, f)) && fs.statSync(path.join(P, f)).size > 0;
      const overlays = {};
      if (weapon && has(`${weapon}.png`)) overlays[`weapon:${weapon}`] = { file: rel(path.join(P, `${weapon}.png`)), z: w.z ?? 'front' };
      if (has('grip.png')) overlays.grip = rel(path.join(P, 'grip.png'));
      if (has('hair_back.png')) overlays.hair_back = rel(path.join(P, 'hair_back.png'));
      if (has('hair_front.png')) overlays.hair_front = rel(path.join(P, 'hair_front.png'));
      return {
        name: `${path.basename(P)} (${pose.role ?? ''})`, file: rel(path.join(P, 'body.png')), sha256: sha(path.join(P, 'body.png')), pivot: pose.origin ?? [128, 224], duration: 300,
        anchors: {
          ...((w.gripPoint ?? w.grip) ? { hand: { point: w.gripPoint ?? w.grip, angle: w.angleDegrees ?? w.angle ?? 0, z: w.z ?? 'front', visible: true } } : {}),
          ...((w.tipPoint ?? w.tip) ? { tip: { point: w.tipPoint ?? w.tip, visible: true } } : {}),
        },
        overlays,
      };
    });
    sheets.push({ id, kind: `keyposes_${action}`, category: 'motion', layout: 'frames', canvas: [256, 240], bodyHeight: 96, gameHeight: 96, loop: true, candidate: true, overlayDefaults: weapon ? { weapon } : undefined, source: rel(kp), frames });
  }
  for (const f of fs.readdirSync(path.join(prodDir, dir)).filter((f) => /^assembly_[a-z]+\.json$/.test(f))) {
    const action = f.match(/^assembly_([a-z]+)\.json$/)[1];
    if (!groups[action]) continue; // the key poses are not delivered yet
    const asm = JSON.parse(fs.readFileSync(path.join(prodDir, dir, f), 'utf8'));
    const { _: note, hit, anchor, loop, ...assembly } = asm;
    sheets.push({ id, kind: `${action}_candidate`, category: 'motion', layout: 'frames', canvas: [256, 240], bodyHeight: 96, loop: !!loop, candidate: true, overlayDefaults: weapon ? { weapon } : undefined, note, hit, anchor, assembly, frames: [] });
  }
}
const approved = sheets.find((s) => s.kind === 'idle' && !s.candidate);
const out = {
  kit: 1,
  source: 'docs/art-production/pixel-<직업>-96/ (96px 시범, 파이프라인 B-5-1)',
  // game size: twice today's 59 px body; pixel art is drawn without smoothing
  display: { bodyPx: 118, pixel: true },
  overlayGroups: { weapon: { label: '무기', inside: false }, hair_back: { label: '뒷머리', inside: false }, hair_front: { label: '앞머리', inside: false } },
  figureOverlays: ['hair_back', 'hair_front'],
  checkRules: { guard: { bottom: 2 } },
  // the 96 px style reference is the approved idle itself (until one is approved, none)
  ...(approved ? { styleRef: { id: approved.id, kind: 'idle', frame: 0 } } : {}),
  sheets,
};
fs.mkdirSync(path.join(root, 'asset-records/pixel-heroes-96'), { recursive: true });
fs.writeFileSync(path.join(root, 'asset-records/pixel-heroes-96/manifest.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`asset-records/pixel-heroes-96/manifest.json: 시트 ${sheets.length}개 (${sheets.map((s) => s.kind + (s.candidate ? '·후보' : '')).join(', ')})`);
