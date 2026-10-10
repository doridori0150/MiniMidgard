// 미니 미드가르 기본 이펙트(PXF 그래프, pxf.graph@1). 용사주식회사 PXF 공방(https://suile-21173.web.app/hero-inc/pxf)의 엔진으로 렌더합니다.
// 틀은 PXF 기본 라이브러리와 같습니다: 생성 노드 몇 개 → max 합성 → 5단 팔레트 → 가장 어두운 색 외곽선 → 끝 프레임 투명 → hard 알파, 64px.
// 색은 회색 기준색 5단(KEY)으로 그립니다. 게임이 KEY를 속성 색 램프(src/render/fxlib.ts RAMPS)로 바꿔 입힙니다(머리 키 색과 같은 방식).
// 그래프는 우리가 직접 쓴 것입니다. PXF 프리셋·공유 작품을 복제하지 않습니다(PXF 규칙: 배포 허가 없는 작품·프리셋 재현 금지).
// 사용: node tools/fx/pxf-graphs.mjs → src/assets/fx/pxf/<id>.pxf.json. 시트(PNG)는 PXF 엔진으로 렌더해 src/assets/fx/sheets/<id>.png에 둡니다.

export const KEY = ['#303030', '#606060', '#909090', '#c0c0c0', '#f0f0f0'];

/** nodes: [{id, type, params, in?: [id for port 0, id for port 1]}]; the last node is the shape that gets the shared tail */
export function graph(name, { frames, fps = 30, size = 64, loop = false, logical = 100, impact = 0, outline = true }, nodes) {
  const out = [], links = [];
  nodes.forEach((n, i) => {
    out.push({ id: n.id, type: n.type, x: 40 + (n.in ? 240 : 0) * Math.min(3, i), y: 40 + i * 120, params: n.params ?? {} });
    (n.in ?? []).forEach((f, p) => f && links.push({ f, t: n.id, p }));
  });
  let cur = nodes[nodes.length - 1].id;
  const add = (id, type, params) => { out.push({ id, type, x: 900 + out.length * 10, y: 40, params }); links.push({ f: cur, t: id, p: 0 }); cur = id; };
  add('pal', 'Palette', { colors: KEY, cutoff: 0.13, mode: 'bands', key: 'alpha' });
  if (outline) add('ol', 'Outline', { color: KEY[0], threshold: 0.5, width: 1 });
  if (!loop) add('cut', 'Tint', { amount: 0, opacity: { k: [[0, 1], [frames - 2, 1], [frames - 1, 0]] } });
  add('out', 'Output', { alpha: 'hard', threshold: 0.5 });
  return { format: 'pxf.graph@1', name, settings: { size, frames, fps, loop }, nodes: out, links, game: { pivot: [0.5, 0.5], logicalSize: logical, blend: 'normal', impactFrame: impact } };
}
const max = (id, a, b) => ({ id, type: 'Blend', params: { mode: 'max' }, in: [a, b] });

export const GRAPHS = {
  // 근접 평타·베기 스킬: 앞으로 내려 긋는 초승달 궤적 + 안쪽 칼날 빛 + 짧은 불티
  slash: graph('MM 참격', { frames: 13, logical: 104, impact: 2 }, [
    { id: 'arc', type: 'Arc', params: { radius: 23, thick: 8, start: -95, sweep: 150, head: { a: 0.07, b: 1.35, e: 'out3', t0: 0, t1: 0.84 }, tail: 0.5, taper: 1.4, aspect: 0.62, rot: -15, intensity: { a: 1, b: 0.15, e: 'in', t0: 0.4, t1: 1 } } },
    { id: 'edge', type: 'Arc', params: { radius: 21, thick: 3, start: -95, sweep: 150, head: { a: 0.07, b: 1.35, e: 'out3', t0: 0, t1: 0.84 }, tail: 0.3, taper: 2, aspect: 0.62, rot: -15, intensity: { a: 1, b: 0, e: 'in', t0: 0.1, t1: 0.6 } } },
    { id: 'sp', type: 'Particles', params: { count: 6, seed: 211, life: 0.5, lifeVar: 0.35, area: 'ring', aw: 18, ah: 10, dirMode: 'outward', speed: 1.2, speedVar: 0.5, gravity: 0.04, drag: 0.12, sizeA: 1.5, sizeB: 0.5, pshape: 'streak', stretch: 0.8 } },
    max('m1', 'arc', 'edge'), max('m', 'm1', 'sp'),
  ]),
  // 창·단검 찌르기: 앞으로 뻗는 가는 섬광 + 끝 반짝임 + 뒤로 흐르는 기류
  thrust: graph('MM 찌르기', { frames: 8, logical: 140, impact: 1 }, [
    { id: 'blade', type: 'Shape', params: { shape: 'diamond', x: { a: 0.5, b: 0.66, e: 'out', t0: 0, t1: 0.3 }, size: { k: [[0, 7], [2, 18, 'out'], [7, 3]] }, aspect: 0.16, falloff: 0.65, intensity: { k: [[0, 0.75], [1, 1, 'out'], [7, 0.35]] } } },
    { id: 'glint', type: 'Shape', params: { shape: 'star', points: 4, x: 0.74, size: { k: [[0, 0], [1, 6, 'out'], [2, 8], [4, 0]] }, size2: 0.2 } },
    { id: 'sp', type: 'Particles', params: { count: 8, seed: 57, life: 0.7, lifeVar: 0.3, area: 'point', x: 0.55, dirMode: 'fixed', angle: 180, spread: 30, speed: 0.9, speedVar: 0.5, drag: 0.12, sizeA: 1.5, sizeB: 0.5, pshape: 'streak', stretch: 0.8 } },
    max('m1', 'blade', 'glint'), max('m', 'm1', 'sp'),
  ]),
  // 명중: 4갈래 별 + 납작한 고리 + 사방 파편
  impact: graph('MM 강타', { frames: 12, logical: 90, impact: 1 }, [
    { id: 'star', type: 'Shape', params: { shape: 'star', points: 4, rot: 45, size: { k: [[0, 5], [1, 14, 'out'], [11, 2]] }, size2: 0.22, falloff: 0.4, intensity: { k: [[0, 0.7], [2, 1, 'out'], [11, 0.2]] } } },
    { id: 'ring', type: 'Shape', params: { shape: 'ring', size: { a: 3, b: 25, e: 'out' }, size2: { a: 0.3, b: 0.06, e: 'out' }, aspect: 0.6, falloff: 0.35, intensity: { a: 0.85, b: 0.25, e: 'in', t0: 0.15, t1: 1 } } },
    { id: 'sp', type: 'Particles', params: { count: 18, seed: 31, life: 0.8, lifeVar: 0.25, area: 'point', dirMode: 'outward', speed: 2.2, speedVar: 0.55, gravity: 0.06, drag: 0.12, sizeA: 1.5, sizeB: 0.5, pshape: 'diamond', brightVar: 0.3 } },
    max('m1', 'star', 'ring'), max('m', 'm1', 'sp'),
  ]),
  // 폭발: 일그러진 불덩이 + 납작한 충격 고리 + 튀는 불똥
  explosion: graph('MM 폭발', { frames: 21, logical: 138, impact: 1 }, [
    { id: 'ball', type: 'Shape', params: { shape: 'circle', size: { a: 3, b: 23, e: 'out3', t0: 0, t1: 0.45 }, falloff: 0.75, intensity: { a: 1, b: 0.12, e: 'in', t0: 0.25, t1: 1 } } },
    { id: 'nz', type: 'Noise', params: { type: 'fbm', scaleX: 6, scaleY: 6, seed: 77, contrast: 1.3 } },
    { id: 'dp', type: 'Displace', params: { mode: 'radial', amount: 6 }, in: ['ball', 'nz'] },
    { id: 'ring', type: 'Shape', params: { shape: 'ring', size: { a: 3, b: 27, e: 'out' }, size2: { a: 0.3, b: 0.045, e: 'out' }, aspect: 0.55, falloff: 0.35, intensity: { a: 0.85, b: 0, e: 'in', t0: 0.15, t1: 0.8 } } },
    { id: 'sp', type: 'Particles', params: { count: 22, seed: 404, life: 0.7, lifeVar: 0.35, area: 'point', dirMode: 'outward', speed: 2.0, speedVar: 0.55, gravity: 0.12, drag: 0.14, sizeA: 1.6, sizeB: 0.5, pshape: 'square', brightVar: 0.3 } },
    max('m1', 'dp', 'ring'), max('m', 'm1', 'sp'),
  ]),
  // 땅 충격파(범위 공격 발밑): 납작하게 퍼지는 고리 + 흙 알갱이
  shockwave: graph('MM 충격파', { frames: 16, logical: 160, impact: 1 }, [
    { id: 'ring', type: 'Shape', params: { shape: 'ring', y: 0.6, size: { a: 4, b: 25, e: 'out' }, size2: { a: 0.35, b: 0.05, e: 'out' }, aspect: 0.35, falloff: 0.35, intensity: { a: 0.9, b: 0.1, e: 'in', t0: 0.2, t1: 1 } } },
    { id: 'sp', type: 'Particles', params: { count: 14, seed: 88, life: 0.55, lifeVar: 0.3, area: 'ring', y: 0.6, aw: 18, ah: 6, dirMode: 'outward', speed: 0.8, speedVar: 0.5, gravity: 0.06, drag: 0.1, sizeA: 2, sizeB: 0.5, pshape: 'square', bright: 0.8 } },
    max('m', 'ring', 'sp'),
  ]),
  // 화염: 흔들리는 불꽃 혀 두 갈래 + 올라가는 불티
  fire: graph('MM 화염', { frames: 24, fps: 26, logical: 96 }, [
    { id: 'f1', type: 'Shape', params: { shape: 'shard', y: 0.66, size: { k: [[0, 6], [2, 20], [23, 2]] }, size2: 0.6, falloff: 0.8, intensity: { k: [[0, 0.55], [3, 1, 'out'], [23, 0]] } } },
    { id: 'f2', type: 'Shape', params: { shape: 'shard', x: 0.42, y: 0.7, rot: -14, size: { k: [[0, 0], [3, 13], [21, 2]] }, size2: 0.6, falloff: 0.8, intensity: { k: [[0, 0], [4, 0.8, 'out'], [21, 0]] } } },
    max('fm', 'f1', 'f2'),
    { id: 'nz', type: 'Noise', params: { type: 'fbm', scaleX: 4, scaleY: 6, seed: 12, scrollY: -2 } },
    { id: 'dp', type: 'Displace', params: { mode: 'dir', amount: 5, angle: 0 }, in: ['fm', 'nz'] },
    { id: 'sp', type: 'Particles', params: { count: 22, seed: 9, emit: 'stream', life: 0.35, lifeVar: 0.35, area: 'point', y: 0.7, dirMode: 'fixed', angle: -90, spread: 40, speed: 1.2, speedVar: 0.55, gravity: -0.02, drag: 0.12, sizeA: 1.6, sizeB: 0.5, pshape: 'square' } },
    max('m', 'dp', 'sp'),
  ]),
  // 얼음: 바닥에서 솟는 얼음 가시 셋 + 바닥 고리 + 튀는 얼음 조각
  ice: graph('MM 얼음', { frames: 24, fps: 24, logical: 96, impact: 2 }, [
    { id: 's1', type: 'Spike', params: { x0: 0.5, y0: 0.76, x1: 0.5, y1: 0.3, width: 13, grow: { k: [[0, 0.25], [3, 1, 'out'], [20, 1], [23, 0]] }, facet: 0.3, ridge: 0.2, intensity: 0.96 } },
    { id: 's2', type: 'Spike', params: { x0: 0.4, y0: 0.77, x1: 0.28, y1: 0.49, width: 10, grow: { k: [[0, 0], [1, 0], [4, 1, 'out'], [20, 1], [23, 0]] }, facet: 0.3, ridge: 0.2, intensity: 0.96 } },
    { id: 's3', type: 'Spike', params: { x0: 0.6, y0: 0.77, x1: 0.73, y1: 0.44, width: 10, grow: { k: [[0, 0], [2, 0], [5, 1, 'out'], [20, 1], [23, 0]] }, facet: -0.3, ridge: 0.2, intensity: 0.96 } },
    { id: 'ring', type: 'Shape', params: { shape: 'ring', y: 0.76, size: { a: 4, b: 24, e: 'out' }, size2: { a: 0.3, b: 0.045, e: 'out' }, aspect: 0.4, falloff: 0.35, intensity: { a: 0.85, b: 0, e: 'in', t0: 0.15, t1: 0.8 } } },
    { id: 'sp', type: 'Particles', params: { count: 14, seed: 5, start: 0.5, life: 0.35, lifeVar: 0.35, area: 'point', y: 0.52, dirMode: 'fixed', angle: -90, spread: 110, speed: 1.6, speedVar: 0.55, gravity: 0.18, drag: 0.12, sizeA: 2.5, sizeB: 0.5, pshape: 'diamond' } },
    max('m1', 's1', 's2'), max('m2', 'm1', 's3'), max('m3', 'm2', 'ring'), max('m', 'm3', 'sp'),
  ]),
  // 번개: 하늘에서 내리치는 번개 + 바닥 섬광 고리 + 불꽃
  lightning: graph('MM 번개', { frames: 12, logical: 120, impact: 1 }, [
    { id: 'bolt', type: 'Lightning', params: { x0: 0.5, y0: 0.1, x1: 0.5, y1: 0.8, detail: 5, jag: 0.4, branch: 0.3, seed: 9, rate: 2, thick: 2, grow: { k: [[0, 0.4], [1, 1, 'out3'], [11, 1]] }, intensity: { k: [[0, 1], [5, 1], [11, 0.15, 'in']] } } },
    { id: 'ring', type: 'Shape', params: { shape: 'ring', y: 0.8, size: { k: [[0, 2], [1, 4], [11, 22, 'out']] }, size2: { a: 0.3, b: 0.06, e: 'out' }, aspect: 0.35, falloff: 0.35, intensity: { k: [[0, 0.6], [1, 0.9], [11, 0.15, 'in']] } } },
    { id: 'sp', type: 'Particles', params: { count: 12, seed: 21, start: 0.08, life: 0.5, lifeVar: 0.3, area: 'point', y: 0.8, dirMode: 'fixed', angle: -90, spread: 140, speed: 1.5, speedVar: 0.55, gravity: 0.12, drag: 0.12, sizeA: 1.5, sizeB: 0.5, pshape: 'streak', stretch: 0.8 } },
    max('m1', 'bolt', 'ring'), max('m', 'm1', 'sp'),
  ]),
  // 시전 마법진(반복): 바닥 원 + 도는 육각별 + 올라가는 빛 알갱이
  cast: graph('MM 마법진', { frames: 24, fps: 24, logical: 100, loop: true }, [
    { id: 'r1', type: 'Shape', params: { shape: 'ring', y: 0.66, size: 22, size2: 0.08, aspect: 0.4, intensity: { k: [[0, 0.8], [12, 1, 'inout'], [23, 0.8]] } } },
    { id: 'st', type: 'Shape', params: { shape: 'star', points: 6, y: 0.66, size: 16, size2: 0.55, aspect: 0.4, rot: { k: [[0, 0], [23, 57.5]] }, stroke: 1, intensity: 0.75 } },
    { id: 'sp', type: 'Particles', params: { count: 18, seed: 3, emit: 'stream', life: 0.5, lifeVar: 0.35, area: 'ring', y: 0.65, aw: 22, ah: 8, dirMode: 'fixed', angle: -90, spread: 10, speed: 0.8, speedVar: 0.55, drag: 0.12, sizeA: 2, sizeB: 0.5, pshape: 'square', loop: true } },
    max('m1', 'r1', 'st'), max('m', 'm1', 'sp'),
  ]),
  // 버프: 발밑에서 올라오는 고리 + 다이아 빛 알갱이
  buff: graph('MM 버프', { frames: 24, fps: 18, logical: 90 }, [
    { id: 'ring', type: 'Shape', params: { shape: 'ring', y: { a: 0.76, b: 0.4, e: 'out' }, size: { k: [[0, 6], [3, 22], [23, 15]] }, size2: 0.08, aspect: 0.4, intensity: { k: [[0, 0.6], [3, 1, 'out'], [18, 0.8], [23, 0.15]] } } },
    { id: 'sp', type: 'Particles', params: { count: 18, seed: 14, emit: 'stream', span: 0.75, life: 0.5, lifeVar: 0.35, area: 'ring', y: 0.74, aw: 20, ah: 7, dirMode: 'fixed', angle: -90, spread: 10, speed: 0.8, speedVar: 0.55, drag: 0.12, sizeA: 2, sizeB: 0.5, pshape: 'diamond' } },
    max('m', 'ring', 'sp'),
  ]),
  // 힐: 떠오르는 큰 십자 알갱이 + 발밑 고리
  heal: graph('MM 힐', { frames: 24, fps: 20, logical: 88 }, [
    { id: 'sp', type: 'Particles', params: { count: 9, seed: 44, emit: 'stream', span: 0.7, life: 0.45, lifeVar: 0.35, area: 'box', y: 0.6, aw: 26, ah: 14, dirMode: 'fixed', angle: -90, spread: 8, speed: 0.7, speedVar: 0.55, drag: 0.12, sizeA: 4.5, sizeB: 1.5, pshape: 'plus' } },
    { id: 'ring', type: 'Shape', params: { shape: 'ring', y: 0.75, size: { a: 3, b: 24, e: 'out' }, size2: { a: 0.3, b: 0.045, e: 'out' }, aspect: 0.33, falloff: 0.35, intensity: { a: 0.85, b: 0, e: 'in', t0: 0.15, t1: 0.8 } } },
    max('m', 'sp', 'ring'),
  ]),
  // 빛기둥(축복·신성): 내려와 머무는 가는 기둥 + 발밑 고리 + 올라가는 빛
  pillar: graph('MM 빛기둥', { frames: 20, fps: 24, logical: 110 }, [
    { id: 'core', type: 'Shape', params: { shape: 'square', y: 0.47, size: { k: [[0, 1], [2, 3, 'out3'], [13, 3], [19, 1]] }, aspect: 7, falloff: 0.9, intensity: { k: [[0, 1], [12, 1], [19, 0.2, 'in']] } } },
    { id: 'rays', type: 'Particles', params: { count: 18, seed: 61, emit: 'stream', span: 0.75, life: 0.3, lifeVar: 0.3, area: 'box', y: 0.62, aw: 12, ah: 20, dirMode: 'fixed', angle: -90, spread: 0, speed: 1.8, speedVar: 0.4, sizeA: 1, sizeB: 0.5, pshape: 'streak', stretch: 4, brightVar: 0.4 } },
    { id: 'ring', type: 'Shape', params: { shape: 'ring', y: 0.77, size: { a: 4, b: 20, e: 'out' }, size2: { a: 0.3, b: 0.06, e: 'out' }, aspect: 0.35, falloff: 0.35, intensity: { a: 0.9, b: 0.1, e: 'in', t0: 0.2, t1: 1 } } },
    max('m1', 'core', 'rays'), max('m', 'm1', 'ring'),
  ]),
  // 흙먼지: 발밑에서 양옆으로 퍼지는 먼지 덩어리(외곽선 없음)
  dust: graph('MM 흙먼지', { frames: 12, logical: 90, outline: false }, [
    { id: 'puff', type: 'Shape', params: { shape: 'circle', y: 0.76, size: { k: [[0, 6], [3, 10, 'out'], [7, 0]] }, aspect: 0.55, falloff: 0.6, intensity: { k: [[0, 0.8], [7, 0]] } } },
    { id: 'sp', type: 'Particles', params: { count: 12, seed: 7, life: 0.95, lifeVar: 0.15, area: 'line', y: 0.75, dirMode: 'fixed', angle: -90, spread: 150, speed: 0.55, speedVar: 0.55, gravity: -0.008, drag: 0.1, sizeA: 4, sizeB: 0.5, pshape: 'circle' } },
    max('m', 'puff', 'sp'),
  ]),
  // 마법탄(반복): 빛나는 구슬 + 뒤로 끌리는 꼬리 + 흩날리는 알갱이
  bolt: graph('MM 마법탄', { frames: 12, fps: 24, logical: 80, loop: true }, [
    { id: 'orb', type: 'Shape', params: { shape: 'circle', x: 0.6, size: { k: [[0, 7], [6, 8, 'wave'], [11, 7]] }, falloff: 0.6 } },
    { id: 'tail', type: 'Shape', params: { shape: 'diamond', x: 0.46, size: 18, aspect: 0.25, falloff: 0.8, intensity: 0.7 } },
    { id: 'sp', type: 'Particles', params: { count: 10, seed: 19, emit: 'stream', life: 0.4, area: 'point', x: 0.58, dirMode: 'fixed', angle: 180, spread: 30, speed: 0.8, sizeA: 1.5, sizeB: 0.5, pshape: 'square', loop: true } },
    max('m1', 'orb', 'tail'), max('m', 'm1', 'sp'),
  ]),
};

/** where the effect meets the world, as a fraction of the cell height: the feet line for ground effects, the middle for hits */
export const ANCHOR = { shockwave: 0.6, fire: 0.7, ice: 0.77, lightning: 0.8, cast: 0.66, buff: 0.76, heal: 0.75, pillar: 0.77, dust: 0.75 };

/** the game's table: one entry per base effect, read by src/render/fxlib.ts */
export function library() {
  return Object.fromEntries(Object.entries(GRAPHS).map(([id, g]) => [id, {
    name: g.name, frames: g.settings.frames, fps: g.settings.fps, loop: g.settings.loop, cell: g.settings.size,
    logical: g.game.logicalSize, impact: g.game.impactFrame, anchor: ANCHOR[id] ?? 0.5,
  }]));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const dir = new URL('../../src/assets/fx/pxf/', import.meta.url);
  fs.mkdirSync(dir, { recursive: true });
  for (const [id, g] of Object.entries(GRAPHS)) fs.writeFileSync(new URL(`${id}.pxf.json`, dir), JSON.stringify(g, null, 2) + '\n');
  fs.writeFileSync(new URL('../library.json', dir), JSON.stringify(library(), null, 2) + '\n');
  console.log(`그래프 ${Object.keys(GRAPHS).length}개 → src/assets/fx/pxf/, 표 → src/assets/fx/library.json`);
}
