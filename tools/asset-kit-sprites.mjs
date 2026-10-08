#!/usr/bin/env node
// 참고용 변환기: 미니 미드가르 `minimidgard.sprites/1` → asset-kit 표준 납품 기록(낱장 프레임).
// 게임 저장소가 자기 tools/로 복사해 쓰고, 형식이 바뀌면 그쪽에서 고칩니다.
// 사용: node tools/asset-kit-sprites.mjs --root <MiniMidgard> [--in src/assets/sprites/manifest.json] --out <표준 manifest.json>
import fs from 'node:fs';
import path from 'node:path';
// copied from asset-kit v0.2 (adapters/minimidgard-sprites.mjs, ee8bd60); parseArgs inlined so it runs from this repo
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2); a[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; }
  return a;
}

export function convert(src, base) {
  if (src.schema !== 'minimidgard.sprites/1') throw new Error(`알 수 없는 형식: ${src.schema}`);
  const at = (p) => path.posix.join(base, p);
  const sheets = [];
  for (const [id, c] of Object.entries(src.characters || {})) {
    for (const [kind, a] of Object.entries(src.animations || {})) {
      const frames = a.frames.map((name, i) => {
        const f = c.frames[name];
        if (!f) throw new Error(`${id}: 프레임 ${name} 없음`);
        const anchors = {};
        for (const k of ['hand', 'crown', 'side']) if (f[k]) anchors[k] = { ...f[k] };
        return {
          name, file: at(f.image), pivot: src.canvas.origin, duration: a.durations[i], anchors,
          ...(f.hairMask ? { masks: { hair: at(f.hairMask) } } : {}),
          ...(f.gripOverlay ? { overlays: { grip: at(f.gripOverlay) } } : {}),
        };
      });
      sheets.push({ id, kind, category: 'motion', canvas: src.canvas.size, bodyHeight: src.canvas.referenceHeight, loop: !!a.loop, frames });
    }
  }
  const attachments = {};
  for (const [name, w] of Object.entries(src.weapons || {})) attachments[name] = { file: at(w.image), pivot: w.pivot, ...(w.tip ? { tip: w.tip } : {}), anchor: 'hand', slot: 'weapon' };
  for (const [name, h] of Object.entries(src.headgear || {})) attachments[name] = { file: at(h.image), pivot: h.pivot, anchor: h.anchor, slot: 'headgear' };
  return {
    kit: 1,
    source: { schema: src.schema, note: '변환기로 만든 표준 기록입니다. 원본은 게임 manifest입니다.' },
    sheets,
    attachments,
    tints: { hair: src.hairTints || {} },
    render: { order: ['weaponBehind', 'figure', 'weaponFront', 'grip', 'headgear'], tint: 'out = base × (1 − m + m × tint), tint는 0~1 배수' },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = parseArgs(process.argv.slice(2));
  const root = path.resolve(a.root || '.');
  const input = a.in || 'src/assets/sprites/manifest.json';
  if (!a.out) { console.error('사용: node adapters/minimidgard-sprites.mjs --root <MiniMidgard> [--in <원본 manifest>] --out <표준 manifest>'); process.exit(2); }
  const src = JSON.parse(fs.readFileSync(path.join(root, input), 'utf8'));
  const out = convert(src, path.posix.dirname(input));
  fs.mkdirSync(path.dirname(path.resolve(root, a.out)), { recursive: true });
  fs.writeFileSync(path.resolve(root, a.out), JSON.stringify(out, null, 2) + '\n');
  console.log(`시트 ${out.sheets.length}개 · 프레임 ${out.sheets.reduce((n, s) => n + s.frames.length, 0)}장 · 부속 ${Object.keys(out.attachments).length}개 → ${a.out}`);
}
