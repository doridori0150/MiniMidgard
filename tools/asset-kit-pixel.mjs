#!/usr/bin/env node
// 미니 미드가르 도트 영웅 `minimidgard.pixel/1` (게임이 읽는 src/assets/pixel/manifest.json) → asset-kit 표준 납품 기록(kit 1, 낱장 프레임).
// 공방(asset-kit serve.mjs)이 asset-kit.json의 records(asset-records/)에서 이 기록을 읽어 동작 목록·검사·요청서를 만듭니다.
// 사용: node tools/asset-kit-pixel.mjs [--in src/assets/pixel/manifest.json] [--out asset-records/pixel-heroes/manifest.json]
//
// 대응 (asset-kit docs/납품-기록-형식.md):
// - 시트 하나 = 캐릭터 하나(id: knight_female_p2)의 애니메이션 하나(kind: idle, attack, skill_bless …). hitFrame과 그 동작을 쓰는 스킬 id도 적습니다.
// - 무기: 프레임마다 미리 그린 무기 레이어 → 덧그림 묶음 `weapon:<종류>` ({file, z}). 그 프레임에서 숨긴 무기는 넣지 않습니다.
// - 앞 손가락 덮개 → `grip`. 무기 종류별 덮개(byType.gripOverlay)는 무기 그림에 이미 합쳐져 있습니다(gripBakedIntoWeapon).
// - 머리: 고른 헤어의 뒤·앞 조각 → `hair_back`·`hair_front` 덧그림(render.order로 순서). 몸 프레임에는 머리가 없어 몸 밖 검사는 뺍니다(overlayGroups inside: false).
// - bodyHeight: 몸 + 머리 조각을 겹친 대기 첫 장의 선 키(게임에서 보이는 키). 공방은 이 값으로 시트를 키우므로 영웅마다 같은 기준이어야 합니다. 머리 위치가 (0,0)이 아닌 조각(쿠키 wavy_p2)은
//   캔버스 크기로 옮긴 사본을 asset-records/pixel-heroes/derived/에 씁니다.
// - 머리색: 게임은 네 키 색을 HAIR_TINT 배수로 바꿉니다. 표준 tints + tintLayers(앞·뒷머리 덧그림 전체에 base × tint, v0.4.3)로 옮깁니다.
//   몸 프레임에 남은 짧은 바탕 머리는 마스크를 만들지 않아 공방에서는 원색으로 보입니다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2); a[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; }
  return a;
}

// ── PNG (8-bit RGBA, non-interlaced: every pixel-hero layer is this) read and write, for the shifted hair copies
function readPng(file) {
  const b = fs.readFileSync(file);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  if (b[24] !== 8 || b[25] !== 6 || b[28] !== 0) throw new Error(`${file}: 8비트 RGBA(비인터레이스)가 아닙니다`);
  const idat = [];
  for (let o = 8; o < b.length;) { const n = b.readUInt32BE(o), t = b.toString('ascii', o + 4, o + 8); if (t === 'IDAT') idat.push(b.subarray(o + 8, o + 8 + n)); o += 12 + n; }
  const raw = zlib.inflateSync(Buffer.concat(idat)), row = w * 4, out = Buffer.alloc(row * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (row + 1)], src = raw.subarray(y * (row + 1) + 1, (y + 1) * (row + 1)), cur = out.subarray(y * row, (y + 1) * row), up = y ? out.subarray((y - 1) * row, y * row) : null;
    for (let x = 0; x < row; x++) {
      const a = x >= 4 ? cur[x - 4] : 0, u = up ? up[x] : 0, c = up && x >= 4 ? up[x - 4] : 0;
      const p = a + u - c, pa = Math.abs(p - a), pb = Math.abs(p - u), pc = Math.abs(p - c);
      cur[x] = (src[x] + [0, a, u, (a + u) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? u : c][f]) & 255;
    }
  }
  return { w, h, data: out };
}
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); }
function writePng(file, { w, h, data }) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

// 설정의 머리색 순서(src/game/state.ts HAIR_COLORS)와 같은 이름
const HAIR_NAMES = ['흑갈색', '적갈색', '금발', '백금(원색)', '빨강', '파랑', '초록', '보라', '분홍', '흑청'];
/** whole.ts HAIR_TINT (per-colour multipliers; null = the cream as drawn), read from the source so the two never drift */
export function hairTints(wholeTs) {
  const m = wholeTs.match(/HAIR_TINT[^=]*=\s*(\[[\s\S]*?\]);/);
  if (!m) return null;
  const list = JSON.parse(m[1].replace(/,\s*\]/g, ']'));
  return Object.fromEntries(list.map((t, i) => [HAIR_NAMES[i] ?? String(i), t ?? [1, 1, 1]]));
}

/** what a review looked at: each frame's body, default weapon and finger overlay files and its hand point */
export function reviewHash(sheet, sha) {
  const w = sheet.overlayDefaults?.weapon;
  const parts = sheet.frames.map((f) => [f.sha256 ?? sha(f.file), w && f.overlays['weapon:' + w] ? sha(f.overlays['weapon:' + w].file) : '', f.overlays.grip ? sha(f.overlays.grip) : '', JSON.stringify(f.anchors?.hand?.point ?? null)].join(':'));
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16);
}

export function convert(src, { base, derivedDir, canvasFor = (p) => readPng(p), measure = null, hairTint = null }) {
  if (!src.canvas || !src.characters) throw new Error('minimidgard.pixel/1 형식이 아닙니다');
  const at = (p) => path.posix.join(base, p);
  const [CW, CH] = src.canvas.size;
  const derived = new Map();
  const blank = (file) => { const d = canvasFor(at(file)).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return false; return true; };
  // a hair piece drawn at (dx, dy): canvas-sized at (0,0) is used as is, anything else gets a canvas-sized copy
  const placed = (file, dx, dy) => {
    const p = at(file), img = canvasFor(p);
    if (!dx && !dy && img.w === CW && img.h === CH) return p;
    const out = path.posix.join(derivedDir, file.replace(/\.png$/, `@${dx}_${dy}.png`));
    if (!derived.has(out)) {
      const data = Buffer.alloc(CW * CH * 4);
      for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
        const tx = x + dx, ty = y + dy;
        if (tx >= 0 && ty >= 0 && tx < CW && ty < CH) img.data.copy(data, (ty * CW + tx) * 4, (y * img.w + x) * 4, (y * img.w + x) * 4 + 4);
      }
      derived.set(out, { w: CW, h: CH, data });
    }
    return out;
  };
  const weaponTypes = Object.keys(src.weapons || {});
  // union of several canvas-sized layers (shifted hair copies come from the derived map), measured like one frame
  const figureHeight = (files) => {
    const imgs = files.map((f) => derived.get(f) ?? canvasFor(f));
    const data = Buffer.alloc(CW * CH * 4);
    for (const im of imgs) for (let i = 3; i < data.length; i += 4) if (im.data[i] > data[i]) data[i] = im.data[i];
    return measureImg({ w: CW, h: CH, data });
  };
  // the check measures the standing height on the body frame alone, and our body frames carry no hair (it is its own layer),
  // so each character's bodyHeight here is its first idle body frame's painted height (no hair); the game's 48 px includes the hair
  const measureImg = (img) => {
    if (measure) return measure(img); // asset-kit's own measure (small detached bits set aside), so the check compares like with like
    let top = -1, bottom = -1;
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3]) { if (top < 0) top = y; bottom = y; break; }
    return top < 0 ? 0 : bottom - top + 1;
  };
  const sheets = [];
  for (const [id, c] of Object.entries(src.characters)) {
    const table = c.animations ?? src.animations;
    const style = c.defaultHair ?? c.hairStyles?.[0];
    const hair = style ? src.hair?.[style] : undefined;
    // standing height of the whole figure as the game draws it: body + its hair pieces (idle_0). The workshop scales every
    // sheet by bodyHeight, so this must be the same kind of height for every hero or they show at different sizes
    const idle0 = c.frames[(c.animations ?? src.animations).idle?.frames[0]];
    let bodyHeight = c.bodyHeight ?? src.canvas.bodyHeight;
    if (idle0) {
      const hp = hair?.poses?.[idle0.head.pose], piv = hp?.pivot ?? hair?.pivot ?? [0, 0];
      const dx = idle0.head.point[0] - piv[0], dy = idle0.head.point[1] - piv[1];
      const parts = [at(idle0.image), ...[hp?.back, hp?.front].filter(Boolean).map((f) => placed(f, dx, dy))];
      bodyHeight = figureHeight(parts);
    }
    const skillsOf = (anim) => Object.entries(c.skillMotions || {}).filter(([, v]) => v === anim).map(([k]) => k);
    for (const [kind, a] of Object.entries(table)) {
      const frames = a.frames.map((name, i) => {
        const f = c.frames[name];
        if (!f) throw new Error(`${id}: 프레임 ${name} 없음`);
        const overlays = {};
        for (const w of weaponTypes) {
          const file = src.weapons[w].frames[id]?.[name];
          if (!file) continue;
          const bt = f.weapon?.byType?.[w];
          if ((bt?.visible ?? f.weapon?.visible) === false) continue;
          overlays['weapon:' + w] = { file: at(file), z: bt?.z ?? f.weapon?.z ?? 'front' };
        }
        if (f.grip && !blank(f.grip)) overlays.grip = at(f.grip); // an empty finger overlay (the weapon thrown away) is left out
        const hp = hair?.poses?.[f.head.pose];
        if (hp) {
          const piv = hp.pivot ?? hair.pivot ?? [0, 0], dx = f.head.point[0] - piv[0], dy = f.head.point[1] - piv[1];
          // an empty piece (쿠키's idle and attack draw no back hair) is left out rather than listed as an empty overlay
          if (hp.back && !blank(hp.back)) overlays.hair_back = placed(hp.back, dx, dy);
          if (hp.front && !blank(hp.front)) overlays.hair_front = placed(hp.front, dx, dy);
        }
        const w = f.weapon;
        const anchors = w?.gripPoint ? { hand: { point: w.gripPoint, angle: w.angleDegrees ?? 0, z: w.z ?? 'front', visible: w.visible !== false } } : {};
        return { name, file: at(f.image), pivot: src.canvas.origin, duration: a.durations[i], anchors, overlays };
      });
      const skills = skillsOf(kind);
      sheets.push({
        id, kind, category: 'motion', layout: 'frames', canvas: src.canvas.size, bodyHeight, gameHeight: c.bodyHeight ?? src.canvas.bodyHeight, loop: !!a.loop,
        ...(a.hitFrame != null ? { hitFrame: a.hitFrame } : {}), ...(skills.length ? { skills } : {}),
        // the weapon the workshop picks first for this hero (asset-kit v0.4.3), when its frames have that layer
        ...(c.defaultWeapon && frames.some((f) => f.overlays['weapon:' + c.defaultWeapon]) ? { overlayDefaults: { weapon: c.defaultWeapon } } : {}),
        frames,
      });
    }
  }
  return {
    record: {
      kit: 1,
      source: { format: 'minimidgard.pixel/1', file: path.posix.join(base, 'manifest.json'), converter: 'tools/asset-kit-pixel.mjs' },
      // weapon: the per-frame weapon to show (one at a time). hair_back / hair_front are plain overlays (no "묶음:종류" key, so no
      // chooser); listing them inside: false only tells the check they lie outside the body frame by design (it has no hair)
      overlayGroups: { weapon: { label: '무기', default: 'sword', inside: false }, hair_back: { label: '뒷머리', inside: false }, hair_front: { label: '앞머리', inside: false } },
      // hair colour: the game multiplies the four hair key colours by HAIR_TINT; the workshop tints the hair overlays the same way
      // (asset-kit v0.4.3 tintLayers). The body frame's close-cropped base hair is not masked yet, so it stays cream there.
      tintLayers: { hair: ['hair_back', 'hair_front'] },
      // the check measures standing height on the body with these overlays on (asset-kit v0.4.8), the same figure as bodyHeight
      figureOverlays: ['hair_back', 'hair_front'],
      // feet sit at y 112 of a 120 canvas, so whatever touches the ground (a fallen body, a staff tip, a blade in the earth) lies
      // in the default 8 px bottom margin; only the last 2 rows count as clipping risk there (asset-kit v0.4.9)
      checkRules: { guard: { bottom: 2 } },
      ...(hairTint ? { tints: { hair: hairTint } } : {}),
      render: { order: ['overlay:hair_back', 'weaponBehind', 'figure', 'weaponFront', 'grip', 'overlay:hair_front'] },
      // 게임에서 선 자세 몸 높이: 48 그림 px × (76 / 62) 필드 단위(src/render/pixel.ts unitPerPx), 기본 줌 1
      display: { bodyPx: Math.round((src.canvas.bodyHeight ?? 48) * 76 / 62) },
      sheets,
    },
    derived,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = parseArgs(process.argv.slice(2));
  const root = path.resolve(a.root || '.');
  const inRel = a.in || 'src/assets/pixel/manifest.json', outRel = a.out || 'asset-records/pixel-heroes/manifest.json';
  const derivedDir = path.posix.join(path.posix.dirname(outRel), 'derived');
  const src = JSON.parse(fs.readFileSync(path.join(root, inRel), 'utf8'));
  // asset-kit's frame measure when the kit sits next to this repo (as the workshop scripts expect), else a plain bounding box
  const kit = await import(path.join(root, '..', 'asset-kit', 'tools', 'lib', 'analyze.mjs')).catch(() => null);
  const measure = kit?.measureFrame ? (img) => kit.measureFrame({ width: img.w, height: img.h, data: img.data }, [0, 0, img.w, img.h], { despeck: true, guard: 8, pivotAlpha: 16, pivotBand: 0.12 }).height : null;
  const hairTint = hairTints(fs.readFileSync(path.join(root, 'src/render/whole.ts'), 'utf8'));
  const { record, derived } = convert(src, { base: path.posix.dirname(inRel), derivedDir, canvasFor: (p) => readPng(path.join(root, p)), measure, hairTint });
  fs.rmSync(path.join(root, derivedDir), { recursive: true, force: true });
  for (const [file, img] of derived) writePng(path.join(root, file), img);
  // sha256 last, so the derived copies are hashed as written
  const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex');
  for (const s of record.sheets) for (const f of s.frames) f.sha256 = sha(f.file);
  // 사람 검토(asset-records/pixel-heroes/reviews.json): 눈으로 보고 괜찮다고 판단한 시트는 그 경고 검사를 끕니다. 검토할 때의 그림
  // (몸·기본 무기·손 덮개·손 기준점) 해시가 지금과 같을 때만 적용하므로, 그림이 바뀌면 검사가 다시 켜집니다.
  const reviewsPath = path.join(root, path.posix.dirname(outRel), 'reviews.json');
  const reviews = fs.existsSync(reviewsPath) ? JSON.parse(fs.readFileSync(reviewsPath, 'utf8')).reviews ?? [] : [];
  let applied = 0, stale = [];
  for (const s of record.sheets) {
    s.reviewHash = reviewHash(s, sha);
    const rv = reviews.find((r) => r.id === s.id && r.kind === s.kind);
    if (!rv) continue;
    if (rv.hash !== s.reviewHash) { stale.push(`${s.id}·${s.kind}`); continue; }
    const rules = {};
    if (rv.checks.includes('hand')) rules.anchorSide = []; // hand side / jump / outlier / hidden-weapon checks
    if (rv.checks.includes('grip')) rules.overlayFree = ['weapon', 'hair_back', 'hair_front', 'grip'];
    s.checkRules = { ...(s.checkRules ?? {}), ...rules };
    s.review = { by: rv.by, date: rv.date, checks: rv.checks, note: rv.note };
    applied++;
  }
  if (reviews.length) console.log(`사람 검토 ${applied}개 적용${stale.length ? ` · 그림이 바뀌어 다시 봐야 할 것 ${stale.length}개: ${stale.join(', ')}` : ''}`);
  fs.mkdirSync(path.dirname(path.join(root, outRel)), { recursive: true });
  fs.writeFileSync(path.join(root, outRel), JSON.stringify(record, null, 1) + '\n');
  console.log(`${outRel}: 시트 ${record.sheets.length}개 (캐릭터 ${new Set(record.sheets.map((s) => s.id)).size}), 옮긴 머리 조각 ${derived.size}개`);
}
