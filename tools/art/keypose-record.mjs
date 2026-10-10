#!/usr/bin/env node
// 키포즈 후보를 공방 기록에 붙입니다: docs/art-production/pixel-<직업>-<동작>-keyposes/poses/<n>_<역할>/ 납품을
// asset-records/pixel-heroes/manifest.json에 후보 시트(kind keyposes_<동작>, candidate: true) 하나로 더합니다.
// 공방은 후보 시트에 같은 장·튐 판정을 하지 않고(자세 후보라서) 뻗음만 보며, 목록에 "후보" 배지를 붙입니다(asset-kit v0.4.16).
// 사용: node tools/art/keypose-record.mjs (npm run asset:records가 asset-kit-pixel.mjs 뒤에 돌림)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const recFile = path.join(root, 'asset-records/pixel-heroes/manifest.json');
const rec = JSON.parse(fs.readFileSync(recFile, 'utf8'));
const game = JSON.parse(fs.readFileSync(path.join(root, 'src/assets/pixel/manifest.json'), 'utf8'));
const prodDir = path.join(root, 'docs/art-production');
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let added = 0;
for (const dir of fs.readdirSync(prodDir).filter((d) => /^pixel-[a-z]+-[a-z_]+-keyposes$/.test(d))) {
  const [, cls, action] = dir.match(/^pixel-([a-z]+)-([a-z_]+)-keyposes$/);
  const id = Object.keys(game.characters).find((c) => game.characters[c].class === cls);
  if (!id) { console.warn(`${dir}: ${cls} 영웅이 게임에 없습니다`); continue; }
  const posesDir = path.join(prodDir, dir, 'poses');
  if (!fs.existsSync(posesDir)) continue;
  const weapon = game.characters[id].defaultWeapon;
  const frames = fs.readdirSync(posesDir).filter((d) => fs.existsSync(path.join(posesDir, d, 'pose.json'))).sort().map((d) => {
    const P = path.join(posesDir, d), pose = JSON.parse(fs.readFileSync(path.join(P, 'pose.json'), 'utf8')), w = pose.weapon ?? {};
    const has = (f) => fs.existsSync(path.join(P, f)) && fs.statSync(path.join(P, f)).size > 0;
    const overlays = {};
    if (has(`${weapon}.png`)) overlays[`weapon:${weapon}`] = { file: rel(path.join(P, `${weapon}.png`)), z: w.z ?? 'front' };
    if (has('grip.png')) overlays.grip = rel(path.join(P, 'grip.png'));
    if (has('hair_back.png')) overlays.hair_back = rel(path.join(P, 'hair_back.png'));
    if (has('hair_front.png')) overlays.hair_front = rel(path.join(P, 'hair_front.png'));
    return {
      name: `${d} (${pose.role ?? ''})`, file: rel(path.join(P, 'body.png')), sha256: sha(path.join(P, 'body.png')), pivot: pose.origin ?? [64, 112], duration: 300,
      anchors: {
        ...(w.gripPoint ? { hand: { point: w.gripPoint, angle: w.angleDegrees ?? 0, z: w.z ?? 'front', visible: true } } : {}),
        ...(w.tipPoint ? { tip: { point: w.tipPoint, visible: true } } : {}),
      },
      overlays,
    };
  });
  if (!frames.length) continue;
  const kind = `keyposes_${action}`;
  rec.sheets = rec.sheets.filter((s) => !(s.id === id && s.kind === kind));
  rec.sheets.push({
    id, kind, category: 'motion', layout: 'frames', canvas: [128, 120], bodyHeight: 48, gameHeight: 48, loop: true, candidate: true,
    overlayDefaults: { weapon }, source: rel(path.join(prodDir, dir)), frames,
  });
  added++;
  console.log(`후보 시트: ${id} · ${kind} (${frames.length}장) ← ${dir}`);
  // the assembly table (assembly@1) next to the keyposes: one more candidate sheet, kind <action>_candidate
  const asmFile = path.join(prodDir, dir, 'assembly.json');
  if (fs.existsSync(asmFile)) {
    const asm = JSON.parse(fs.readFileSync(asmFile, 'utf8')), k2 = `${action}_candidate`;
    rec.sheets = rec.sheets.filter((s) => !(s.id === id && s.kind === k2));
    const { _: note, hit, anchor, ...assembly } = asm;
    rec.sheets.push({ id, kind: k2, category: 'motion', layout: 'frames', canvas: [128, 120], bodyHeight: 48, loop: false, candidate: true, overlayDefaults: { weapon }, note, hit, anchor, assembly, frames: [] });
    console.log(`조립 후보: ${id} · ${k2} (${asm.frames.length}칸) ← ${rel(asmFile)}`);
  }
}
// the style reference every candidate is compared with (pipeline B-1: Knight r15 idle key 0); the workshop shows it beside the candidate
rec.styleRef = { id: 'knight_female_p2', kind: 'idle', frame: 0 };
fs.writeFileSync(recFile, JSON.stringify(rec, null, 2) + '\n');
