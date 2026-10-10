#!/usr/bin/env node
// 라그나로크 온라인 직업 모션 시트(레퍼런스 전용): 한 직업의 모든 동작을 남동 방향으로 한 장에 그립니다.
// 공개 렌더러 assets.latam-tools.com.br (ragassets)의 실제 클라이언트 스프라이트입니다. 동작만 참고하고 그림은 베끼지 않으며,
// 결과는 저장소 밖(기본 ${TMPDIR}/minimidgard-ro/)에 둡니다. 저장소에 라그나로크 그림을 넣지 않습니다.
// 사용: node tools/art/ro-sheet.mjs <job> <male|female> <weapon> [out.png]
//   job: 0 초보자 1 검사 2 마법사 3 궁수 4 복사 5 상인 6 도둑 7 기사 8 프리스트 9 위저드 10 블랙스미스 11 헌터 12 어새신
//   weapon(보이는 무기 번호): 1 단검 2 한손검 6 도끼 8 철퇴 10 지팡이 11 활 (창 4·카타르 16은 그려지지 않음)
//   action = 동작 종류 × 8 + 방향(7 남동): 0 대기 1 걷기 2 앉기 4 전투 대기 5 맨손 공격 6 피격 8 쓰러짐 10·11·12 무기 공격 1·2·3(12 = 캐스팅)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from './playwright.mjs';
const [job, gender, weapon, outArg] = process.argv.slice(2);
if (!job || !gender || !weapon) { console.error('사용: node tools/art/ro-sheet.mjs <job> <male|female> <weapon> [out.png]'); process.exit(2); }
const out = outArg || path.join(process.env.TMPDIR || os.tmpdir(), 'minimidgard-ro', `job${job}-${gender}-w${weapon}.png`);
fs.mkdirSync(path.dirname(out), { recursive: true });
const acts = [['idle', 0], ['walk', 1], ['sit', 2], ['standby', 4], ['attack(bare)', 5], ['hurt', 6], ['dead', 8], ['w-attack1', 10], ['w-attack2', 11], ['w-attack3 / cast', 12]];
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('https://assets.latam-tools.com.br/');
const png = await p.evaluate(async ({ job, gender, weapon, acts }) => {
  const rows = [];
  for (const [name, type] of acts) {
    const q = `job=${job}&gender=${gender}&weapon=${weapon}&action=${type * 8 + 7}`;
    try {
      const buf = await (await fetch('/gif?' + q)).arrayBuffer();
      const dec = new ImageDecoder({ data: buf, type: 'image/gif' }); await dec.tracks.ready;
      const n = dec.tracks.selectedTrack.frameCount; const frames = []; const durs = [];
      for (let i = 0; i < n; i++) { const { image } = await dec.decode({ frameIndex: i }); durs.push(Math.round((image.duration ?? 0) / 1000)); const c = document.createElement('canvas'); c.width = image.displayWidth; c.height = image.displayHeight; c.getContext('2d').drawImage(image, 0, 0); image.close(); frames.push(c); }
      rows.push({ name, frames, durs });
    } catch (e) { rows.push({ name, frames: [], durs: [], err: String(e) }); }
  }
  const S = 2, LAB = 120, cols = Math.max(...rows.map((r) => r.frames.length), 1);
  const cv = document.createElement('canvas'); cv.width = LAB + cols * 110 * S; cv.height = rows.length * (110 * S + 8);
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#e4eadc'; x.fillRect(0, 0, cv.width, cv.height);
  rows.forEach((r, ri) => {
    const y0 = ri * (110 * S + 8); x.fillStyle = '#222'; x.font = '14px sans-serif'; x.fillText(r.name, 6, y0 + 20); x.font = '11px sans-serif'; x.fillText(`${r.frames.length}f ${r.durs.reduce((a, b) => a + b, 0)}ms`, 6, y0 + 38);
    r.frames.forEach((f, i) => { const s = Math.min(S, (110 * S) / Math.max(f.width, f.height)); x.drawImage(f, LAB + i * 110 * S + (110 * S - f.width * s) / 2, y0 + (110 * S - f.height * s), f.width * s, f.height * s); x.fillStyle = '#a00'; x.font = '10px sans-serif'; x.fillText(String(i + 1), LAB + i * 110 * S + 2, y0 + 12); });
  });
  return cv.toDataURL('image/png');
}, { job, gender, weapon, acts });
fs.writeFileSync(out, Buffer.from(png.split(',')[1], 'base64')); await b.close();
console.log(out);
