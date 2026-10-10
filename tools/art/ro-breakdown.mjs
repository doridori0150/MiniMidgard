#!/usr/bin/env node
// 라그나로크 동작 분해표(숫자만): 공개 렌더러(assets.latam-tools.com.br)의 실제 클라이언트 GIF 하나를 브라우저 안에서 장별로 풀어,
// 장마다 시간·실루엣 상자·발 기준 이동·앞쪽 끝(무기 끝 근사)·잔상 여부·역할 추정을 JSON으로 적습니다. 그림은 저장하지 않습니다.
// 이 숫자가 조립표(assembly@1)의 ms 비율·dx·사이 장 자리의 기준입니다(asset-kit docs/이펙트-연출-파이프라인.md B-3-1).
// 사용: node tools/art/ro-breakdown.mjs <job> <male|female> <weapon> <action 종류> [이름]
//   job·weapon 번호는 tools/art/ro-sheet.mjs와 같습니다. action 종류: 1 걷기 10·11 무기 공격 1·2 12 캐스팅(방향은 남동 7 고정)
//   결과: docs/art/motion-templates/<이름 또는 job-action>.json
// 판정 방법(숫자로만):
//   발 기준점 = 그림자(아래쪽의 검은 타원) 가운데. 실루엣 = 그림자를 뺀 불투명 픽셀.
//   앞쪽 끝 = 남동을 보므로 실루엣의 가장 오른쪽 점(무기 끝의 근사).
//   잔상 = 옅고 밝은 픽셀(무기 궤적 색: 가장 어두운 채널 > 170, 채도 < 60)이 첫 장보다 40개 넘게 많은 장. 몸이 웅크리거나 망토가 퍼져 넓어진 장은 잔상이 아닙니다.
//   역할: 공격은 잔상 첫 장(없으면 앞쪽 끝이 가장 먼 장) = 타격, 그 앞 = 준비(키가 낮아지면 웅크림), 뒤는 잔상이 남으면 잔상, 같은 자세가 이어지면 멈춤, 아니면 회수.
//         걷기는 몸 오르내림(정수리 dy)으로: 가장 높은 장 = 올라섬, 그다음 = 접지, 가장 낮은 장 = 내려앉음, 그다음 = 통과(남동 시점은 두 다리가 겹쳐 발 벌어짐은 신호가 약함). footSpread는 참고로 남김. 캐스팅은 첫 장 대비 변화로 준비/유지.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from './playwright.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [job, gender, weapon, type, nameArg] = process.argv.slice(2);
if (!job || !gender || !weapon || !type) { console.error('사용: node tools/art/ro-breakdown.mjs <job> <male|female> <weapon> <action 종류> [이름]'); process.exit(2); }
const JOBS = { 0: 'novice', 1: 'swordsman', 2: 'mage', 3: 'archer', 4: 'acolyte', 5: 'merchant', 6: 'thief', 7: 'knight', 8: 'priest', 9: 'wizard', 10: 'blacksmith', 11: 'hunter', 12: 'assassin' };
const ACT = { 1: 'walk', 10: 'attack', 11: 'attack2', 12: 'cast' };
const action = Number(type) * 8 + 7;
const name = nameArg || `${JOBS[job] ?? 'job' + job}-${ACT[type] ?? 'action' + type}`;
const url = `https://assets.latam-tools.com.br/gif?job=${job}&gender=${gender}&weapon=${weapon}&action=${action}`;

const b = await chromium.launch();
const p = await b.newPage();
await p.goto('https://assets.latam-tools.com.br/');
const raw = await p.evaluate(async (q) => {
  const buf = await (await fetch('/gif?' + q)).arrayBuffer();
  const dec = new ImageDecoder({ data: buf, type: 'image/gif' }); await dec.tracks.ready;
  const n = dec.tracks.selectedTrack.frameCount, out = [];
  for (let i = 0; i < n; i++) {
    const { image } = await dec.decode({ frameIndex: i });
    const W = image.displayWidth, H = image.displayHeight, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.drawImage(image, 0, 0); const ms = Math.round((image.duration ?? 0) / 1000); image.close();
    const d = g.getImageData(0, 0, W, H).data;
    // shadow: dark, low-saturation pixels in the lower part; figure: every other opaque pixel
    const shadow = [], fig = []; let pale = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4; if (d[k + 3] < 32) continue;
      const r = d[k], gg = d[k + 1], bb = d[k + 2], mx = Math.max(r, gg, bb), mn = Math.min(r, gg, bb);
      if (mx < 40 && mx - mn < 16) shadow.push([x, y]); else { fig.push([x, y]); if (mn > 170 && mx - mn < 60) pale++; }
    }
    out.push({ W, H, ms, shadow, fig, pale });
  }
  return out.map(({ W, H, ms, shadow, fig, pale }) => {
    const box = (pts) => pts.length ? pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [1e9, 1e9, -1e9, -1e9]) : null;
    const sb = box(shadow), fb = box(fig);
    const front = fig.reduce((best, pt) => (!best || pt[0] > best[0] ? pt : best), null);
    const footY = sb ? Math.round((sb[1] + sb[3]) / 2) : fb ? fb[3] : 0;
    const low = fig.filter(([, y]) => y >= footY - 14 && y <= footY + 2), lb = box(low);
    return { W, H, ms, shadowBox: sb, figBox: fb, area: fig.length, front, pale, footSpread: lb ? lb[2] - lb[0] + 1 : 0 };
  });
}, `job=${job}&gender=${gender}&weapon=${weapon}&action=${action}`);
await b.close();

if (!raw.length || !raw[0].figBox) { console.error('프레임을 읽지 못했습니다: ' + url); process.exit(1); }
// one foot point for the whole action (the shadow is fixed under the sprite's anchor); fall back to the figure's bottom middle
const sb = raw.find((f) => f.shadowBox)?.shadowBox;
const foot = sb ? [Math.round((sb[0] + sb[2]) / 2), Math.round((sb[1] + sb[3]) / 2)] : [Math.round((raw[0].figBox[0] + raw[0].figBox[2]) / 2), raw[0].figBox[3]];
const rel = (x, y) => [x - foot[0], y - foot[1]];
const f0 = raw[0], h0 = f0.figBox[3] - f0.figBox[1] + 1;
const cx0 = (f0.figBox[0] + f0.figBox[2]) / 2, top0 = f0.figBox[1];
const frames = raw.map((f, i) => {
  const [x0, y0, x1, y1] = f.figBox, w = x1 - x0 + 1, h = y1 - y0 + 1;
  return {
    index: i, ms: f.ms, box: [...rel(x0, y0), ...rel(x1, y1)], width: w, height: h, area: f.area,
    dx: Math.round((x0 + x1) / 2 - cx0), dy: y0 - top0, front: rel(...f.front), pale: f.pale, footSpread: f.footSpread, smear: f.pale > f0.pale + 40,
  };
});
const kind = ACT[type] ?? 'other';
if (kind.startsWith('attack')) {
  const firstSmear = frames.findIndex((f) => f.smear);
  const reach = frames.reduce((b, f, i) => (f.front[0] > frames[b].front[0] ? i : b), 0);
  const hit = firstSmear >= 0 ? firstSmear : reach;
  frames.forEach((f, i) => {
    const prev = frames[i - 1], same = prev && prev.height === f.height && prev.front[0] === f.front[0] && prev.box.join() === f.box.join();
    f.role = i < hit ? (f.height < h0 - 2 ? '준비(웅크림)' : '준비') : i === hit ? '타격' : f.smear ? '잔상' : same && i > hit + 1 ? '멈춤' : '회수';
  });
  // the first frame of a held pose is part of the hold too
  frames.forEach((f, i) => { if (f.role === '회수' && frames[i + 1]?.role === '멈춤') f.role = '멈춤'; });
} else if (kind === 'walk') {
  // the body bob (crown height) is the clean signal in the diagonal view: highest = 올라섬, the step after (going down) = 접지,
  // lowest = 내려앉음, the step after (coming up) = 통과
  const n = frames.length, hi = Math.min(...frames.map((f) => f.dy)), lo = Math.max(...frames.map((f) => f.dy));
  frames.forEach((f) => { f.role = f.dy === hi ? '올라섬' : f.dy === lo ? '내려앉음' : '사이'; });
  frames.forEach((f, i) => { const prev = frames[(i - 1 + n) % n]; if (f.role === '사이') f.role = prev.role === '올라섬' ? '접지' : prev.role === '내려앉음' ? '통과' : '사이'; });
} else {
  frames.forEach((f, i) => { f.role = i === 0 ? '시작' : Math.abs(f.height - h0) > 2 || Math.abs(f.dx) > 2 ? '준비' : '유지'; });
}
const total = frames.reduce((s, f) => s + f.ms, 0);
const out = {
  format: 'ro-breakdown@1',
  source: { job: Number(job), class: JOBS[job], gender, weapon: Number(weapon), action, direction: 'SE', url, note: '라그나로크 공개 렌더러의 실제 클라이언트 스프라이트. 숫자만 기록하고 그림은 저장하지 않습니다.' },
  foot, figureHeight0: h0, totalMs: total, frameCount: frames.length,
  roles: frames.map((f) => f.role),
  // ms as a share of the whole, the number the assembly table copies
  rhythm: frames.map((f) => Math.round((f.ms / (total || 1)) * 1000) / 1000),
  frames,
};
const dir = path.join(root, 'docs/art/motion-templates');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(out, null, 2) + '\n');
console.log(`${name}: ${frames.length}장 ${total}ms · ${out.roles.join(' ')}`);
