// asset-kit a98116a tools/lib/timeline.mjs 복사본 — 고치지 말고 asset-kit에서 고친 뒤 npm run timelines로 다시 복사합니다.
// 연출 타임라인 timeline@1 (docs/타임라인-형식.md). 스킬·필살기·컷인 연출을 트랙과 클립, 키프레임으로 적습니다.
// 이 파일은 순수 함수(Node·브라우저 공용)입니다: 시간 풀기, 키프레임 보간, 지금 재생 중인 클립, 지나간 사건, 검사.
// 그리기는 각 게임 런타임과 공방 무대가 합니다. 피해 시점은 게임 로직이 정하고 타임라인은 보여 주기만 합니다.

export const FORMAT = 'timeline@1';
export const TRACK_TYPES = ['scene', 'image', 'text', 'motion', 'move', 'fx', 'sound', 'camera', 'hitstop', 'flash', 'dim', 'ui', 'event'];
export const EASES = ['linear', 'hold', 'inQuad', 'outQuad', 'inOutQuad', 'inCubic', 'outCubic', 'inOutCubic', 'smooth', 'outBack', 'inBack', 'outElastic', 'outBounce'];
// v0.4.6 연출 등급(룰 R7): 화면이 바쁠 때 런타임이 등급별로 빼는 트랙 종류(기본값, 게임이 바꿔도 됨). exclusive 트랙은 한 번에 한 타임라인만.
export const TIERS = ['basic', 'skill', 'signature', 'ultimate'];
export const TIER_DROP = {
  basic: ['camera', 'flash', 'hitstop', 'dim', 'scene', 'image', 'text'],
  skill: ['dim', 'scene', 'image'],
  signature: ['scene'],
  ultimate: [],
};
export const MASKS = ['slant', 'rect', 'circle'];
export const INTERRUPTS = ['cut', 'finish', 'fade'];
// 표준 연출 모듈(module:<이름>). 게임 전용은 module:<게임>.<이름>(예: module:mm.castCircle)
export const MODULES = ['aimLine', 'triReticle', 'muzzleFlash', 'casings', 'riftShockwave'];

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
// 이징: x(0~1) → 진행(0~1, outBack·outElastic은 1을 넘었다 돌아옴)
export function ease(name = 'linear', x) {
  x = clamp01(x);
  switch (name) {
    case 'hold': return x < 1 ? 0 : 1;
    case 'inQuad': return x * x;
    case 'outQuad': return 1 - (1 - x) * (1 - x);
    case 'inOutQuad': return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
    case 'inCubic': return x * x * x;
    case 'outCubic': return 1 - (1 - x) ** 3;
    case 'inOutCubic': case 'smooth': return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
    case 'outBack': { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; }
    case 'inBack': { const c1 = 1.70158, c3 = c1 + 1; return c3 * x * x * x - c1 * x * x; }
    case 'outElastic': { if (x === 0 || x === 1) return x; const c4 = (2 * Math.PI) / 3; return 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1; }
    case 'outBounce': { const n1 = 7.5625, d1 = 2.75; if (x < 1 / d1) return n1 * x * x; if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75; if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375; return n1 * (x -= 2.625 / d1) * x + 0.984375; }
    default: return x;
  }
}

// 시간: 숫자(ms, 음수 가능: 시전 시작 castStart처럼 발동 전) | "사건 이름" | { event, offset, index }.
// events는 { 이름: ms | [ms, …] }(다중 타격 hits처럼 배열이면 index번째, 없으면 첫 번째, 음수는 뒤에서: -1 = 마지막 타격).
// 게임이 실제 값으로 덮어씁니다.
const pick = (v, index = 0) => (Array.isArray(v) ? v[index < 0 ? v.length + index : index] : index === 0 || index === -1 ? v : undefined);
export function resolveAt(at, events = {}) {
  if (typeof at === 'number') return at;
  if (typeof at === 'string') { if (!(at in events)) throw new Error(`모르는 사건: ${at}`); return pick(events[at]); }
  if (at && typeof at === 'object') {
    if (!(at.event in events)) throw new Error(`모르는 사건: ${at.event}`);
    const v = pick(events[at.event], at.index || 0);
    if (typeof v !== 'number') throw new Error(`사건 ${at.event}에 ${at.index}번째 시각이 없습니다`);
    return v + (at.offset || 0);
  }
  return 0;
}
// 클립이 시작하는 시각들: 보통 하나, repeat { event, offset }이면 그 사건 배열의 시각마다(타격마다 한 번).
// 게임이 넘긴 타격이 적어 { event, index }의 그 타격이 없으면 그 클립은 재생하지 않습니다(빈 목록).
export function startsOf(clip, events = {}) {
  const at = clip.at;
  if (!clip.repeat && at && typeof at === 'object' && at.event in events && Array.isArray(events[at.event]) && typeof pick(events[at.event], at.index || 0) !== 'number') return [];
  if (clip.repeat) {
    const ev = clip.repeat.event;
    if (!(ev in events)) throw new Error(`모르는 사건: ${ev}`);
    const list = Array.isArray(events[ev]) ? events[ev] : [events[ev]];
    return list.map((t, index) => ({ start: t + (clip.repeat.offset || 0), index }));
  }
  return [{ start: resolveAt(clip.at ?? 0, events), index: 0 }];
}
// 끊김(시전자가 걷기 시작하거나 다음 행동이 나감) 때 이 클립은: cut(바로 끊음) | finish(끝까지) | fade(짧게 사라짐).
// 클립 → 트랙 → 기본값(motion·move는 cut, 나머지는 finish). 건너뛰기(사용자가 누름)와는 다른 경우입니다.
export const interruptMode = (track, clip) => clip.onInterrupt || track.onInterrupt || (['motion', 'move'].includes(track.type) ? 'cut' : 'finish');

// 키프레임: [[클립 안 시간(ms), 값, 다음 키까지의 이징?], …]. 값은 숫자 또는 숫자 배열. 첫 키 전은 첫 값, 끝 키 뒤는 끝 값.
export function sampleKeys(keys, local) {
  if (typeof keys === 'number') return keys; // 값 하나 = 고정 값(문서 4절)
  if (!Array.isArray(keys) || !keys.length) return undefined;
  if (!Array.isArray(keys[0])) return keys; // 키가 아니라 고정 값
  if (local <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0, e] = keys[i], [t1, v1] = keys[i + 1];
    if (local < t1) {
      const p = ease(e || 'linear', (local - t0) / Math.max(1e-9, t1 - t0));
      return Array.isArray(v0) ? v0.map((v, j) => v + (v1[j] - v) * p) : v0 + (v1 - v0) * p;
    }
  }
  return keys[keys.length - 1][1];
}

// 사건 시각: 기본값 ← 구간별 값(ranges.<이름>.events, 예: 짧은판은 결정타가 더 일찍) ← 게임이 넘긴 실제 값
export const eventsOf = (tl, actual = {}, range) => ({ start: 0, ...(tl.events || {}), ...((range && tl.ranges?.[range]?.events) || {}), ...actual });

// 구간(range): { from, to }. 클립의 ranges에 그 구간 이름이 없으면 그 구간에서는 재생하지 않습니다(없으면 모든 구간).
export function rangeOf(tl, name = 'full', events = eventsOf(tl, {}, name)) {
  const r = tl.ranges?.[name];
  if (!r) return { from: 0, to: duration(tl, events) };
  return { from: resolveAt(r.from ?? 0, events), to: resolveAt(r.to ?? duration(tl, events), events) };
}
export function duration(tl, events = eventsOf(tl)) {
  let end = 0;
  for (const tr of tl.tracks || []) for (const c of tr.clips || []) for (const { start } of startsOf(c, events)) end = Math.max(end, start + (c.dur || 0));
  return end;
}

// 이 설정에서 클립을 재생하는가: 구간, 움직임 줄이기(reduced: skip|static|keep), 섬광 줄이기(flash: true인 클립),
// 런타임이 빼는 트랙 종류(drop, 예: 화면이 바쁠 때 TIER_DROP[tl.tier])
function plays(clip, opts = {}, track) {
  const { range = 'full', reduced = false, flashOff = false, drop = [] } = opts;
  if (track && drop.includes(track.type)) return false;
  if (clip.ranges && !clip.ranges.includes(range)) return false;
  if (reduced && (clip.reduced || 'keep') === 'skip') return false;
  if (flashOff && clip.flash) return false;
  return true;
}

/**
 * 지금(ms) 재생 중인 클립과 그 순간의 키프레임 값.
 * opts: { range, events(실제 사건 ms), reduced, flashOff, portrait, drop(뺄 트랙 종류) }
 * 반환: [{ track, clip, start, index, local, p(0~1), props }] — props는 keys를 그 순간 값으로 푼 것(세로 화면이면 portrait.keys가 덮어씀).
 * repeat 클립은 겹치는 타격마다 하나씩 나옵니다(index = 몇 번째 타격).
 */
export function activeClips(tl, ms, opts = {}) {
  const events = eventsOf(tl, opts.events, opts.range), out = [];
  for (const track of tl.tracks || []) {
    for (const clip of track.clips || []) {
      if (!plays(clip, opts, track)) continue;
      const dur = clip.dur || 0;
      for (const { start, index } of startsOf(clip, events)) {
        if (ms < start || ms >= start + Math.max(dur, 1)) continue;
        const local = ms - start;
        const keys = { ...(clip.keys || {}), ...(opts.portrait ? clip.portrait?.keys || {} : {}) };
        const props = {};
        for (const [k, v] of Object.entries(keys)) props[k] = opts.reduced && clip.reduced === 'static' ? sampleKeys(v, dur) : sampleKeys(v, local);
        out.push({ track, clip, start, index, local, p: dur ? local / dur : 1, props });
      }
    }
  }
  return out;
}

// prev < t ≤ ms 사이에 시작한 클립(소리·사건·히트스톱처럼 한 번만 일어나는 것). 배속·낮은 FPS에서도 건너뛰지 않고 한 번만.
export function crossed(tl, prevMs, ms, opts = {}, types = ['sound', 'event', 'hitstop']) {
  const events = eventsOf(tl, opts.events, opts.range), out = [];
  for (const track of tl.tracks || []) {
    if (!types.includes(track.type)) continue;
    for (const clip of track.clips || []) {
      if (!plays(clip, opts, track)) continue;
      for (const { start, index } of startsOf(clip, events)) if (start > prevMs && start <= ms) out.push({ track, clip, start, index });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

// 검사: 형식·사건·구간·트랙 종류·클립 시간·키 순서·이징·자산 참조. 반환: 오류 문장 목록(빈 배열이면 통과)
export function validateTimeline(tl) {
  const e = [];
  if (!tl || typeof tl !== 'object') return ['타임라인이 객체가 아닙니다'];
  if (tl.format !== FORMAT) e.push(`format은 "${FORMAT}"이어야 합니다`);
  if (!tl.id) e.push('id가 없습니다');
  if (tl.fps != null && !(tl.fps > 0)) e.push('fps는 양수여야 합니다');
  const events = eventsOf(tl);
  const isTime = (v) => typeof v === 'number' || (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'number'));
  for (const [k, v] of Object.entries(tl.events || {})) if (!isTime(v)) e.push(`사건 ${k}의 기본 시각은 숫자(ms)나 숫자 배열이어야 합니다`);
  if (tl.tier != null && !TIERS.includes(tl.tier)) e.push(`tier는 ${TIERS.join('·')}`);
  if (tl.exclusive != null && !(Array.isArray(tl.exclusive) && tl.exclusive.every((x) => TRACK_TYPES.includes(x)))) e.push('exclusive는 트랙 종류 배열');
  for (const [name, r] of Object.entries(tl.ranges || {})) {
    const ev = eventsOf(tl, {}, name);
    for (const [k, v] of Object.entries(r.events || {})) if (!isTime(v)) e.push(`구간 ${name}의 사건 ${k}는 숫자(ms)나 숫자 배열이어야 합니다`);
    try { const a = resolveAt(r.from ?? 0, ev), b = resolveAt(r.to ?? 0, ev); if (!(b > a)) e.push(`구간 ${name}: 끝이 시작보다 뒤여야 합니다`); } catch (x) { e.push(`구간 ${name}: ${x.message}`); }
  }
  const ids = new Set();
  (tl.tracks || []).forEach((tr, i) => {
    const at = `tracks[${i}]${tr.id ? `(${tr.id})` : ''}`;
    if (tr.id) { if (ids.has(tr.id)) e.push(`${at}: 트랙 id 중복`); ids.add(tr.id); }
    if (!TRACK_TYPES.includes(tr.type)) e.push(`${at}: 모르는 트랙 종류 ${tr.type}`);
    if (tr.onInterrupt && !INTERRUPTS.includes(tr.onInterrupt)) e.push(`${at}: onInterrupt는 ${INTERRUPTS.join('·')}`);
    (tr.clips || []).forEach((c, j) => {
      const cat = `${at}.clips[${j}]`;
      try { startsOf(c, events); } catch (x) { e.push(`${cat}: ${x.message}`); }
      if (c.onInterrupt && !INTERRUPTS.includes(c.onInterrupt)) e.push(`${cat}: onInterrupt는 ${INTERRUPTS.join('·')}`);
      if (c.mask && !MASKS.includes(c.mask.type)) e.push(`${cat}: mask.type은 ${MASKS.join('·')}`);
      if (c.mirror && !['caster', 'none'].includes(c.mirror)) e.push(`${cat}: mirror는 caster·none`);
      if (tr.type === 'hitstop' && c.scope && !['field', 'stage', 'all'].includes(c.scope)) e.push(`${cat}: hitstop scope는 field·stage·all`);
      if (tr.type === 'fx' && c.ref != null) {
        const m = /^(game|sheet|module):([\w.-]+)$/.exec(c.ref);
        if (!m) e.push(`${cat}: fx ref는 game:·sheet:·module:<이름>`);
        else if (m[1] === 'module' && !m[2].includes('.') && !MODULES.includes(m[2])) e.push(`${cat}: 표준 모듈이 아닙니다(${m[2]}). 게임 전용은 module:<게임>.<이름>`);
      }
      if (c.align) { if (!(c.align.cell === 'hitFrame' || Number.isInteger(c.align.cell))) e.push(`${cat}: align.cell은 hitFrame이나 칸 번호`); try { resolveAt(c.align.at, events); } catch (x) { e.push(`${cat}: align.at ${x.message}`); } }
      if (c.dur != null && !(c.dur >= 0)) e.push(`${cat}: dur는 0 이상(ms)`);
      for (const r of c.ranges || []) if (tl.ranges && !(r in tl.ranges)) e.push(`${cat}: 없는 구간 ${r}`);
      if (c.reduced && !['skip', 'static', 'keep'].includes(c.reduced)) e.push(`${cat}: reduced는 skip·static·keep`);
      if (tr.type === 'image' && c.asset && !tl.assets?.[c.asset]) e.push(`${cat}: 없는 자산 ${c.asset}`);
      for (const [k, keys] of Object.entries({ ...(c.keys || {}), ...(c.portrait?.keys || {}) })) {
        if (typeof keys === 'number' || (Array.isArray(keys) && keys.length && keys.every((v) => typeof v === 'number'))) continue; // 고정 값
        if (!Array.isArray(keys) || !keys.length || !keys.every((kf) => Array.isArray(kf) && typeof kf[0] === 'number')) { e.push(`${cat}.keys.${k}: 숫자 하나, 숫자 배열, [[시간, 값, 이징?], …] 중 하나여야 합니다`); continue; }
        let last = -Infinity;
        for (const kf of keys) {
          if (!(kf[0] >= last)) e.push(`${cat}.keys.${k}: 키 시간이 앞으로만 가야 합니다`);
          if (kf[2] && !EASES.includes(kf[2])) e.push(`${cat}.keys.${k}: 모르는 이징 ${kf[2]}`);
          if (c.dur != null && kf[0] > c.dur) e.push(`${cat}.keys.${k}: 키 시간 ${kf[0]}이 클립 길이 ${c.dur}를 넘습니다`);
          last = kf[0];
        }
      }
    });
  });
  return e;
}
