// 모션 측정(순수 함수, 파일·PNG 읽기 없음): 공방 검사판과 tools/art/motion-check.mjs가 같은 코드를 씁니다.
// 형식 검사(여백·알파·배율)가 못 보는 동작 품질을 숫자로 봅니다.
// - 연속 장 실루엣 겹침(IoU): 사이 장 없이 크게 튀는지(< JUMP), 거의 같은 장이 끼었는지(> SAME)
// - 접촉: hitFrame과 무기 끝이 가장 멀리 뻗은 장의 차이. 잔상 베기는 뻗기 전에 닿을 수 있으니 사람 판정의 참고값입니다.
// 기준값은 2026-10-10 도트 영웅 12명 측정에서 정했습니다(걷기는 대개 0.7~0.9, 사용자가 엉성하다고 본 공격은 0.46~0.6이 끼어 있음).

export const SAME = 0.97;
export const JUMP = 0.6;
export const ALPHA = 16;

/**
 * 실루엣 마스크: 레이어를 캔버스에 겹친 뒤 알파 ≥ ALPHA인 칸을 1로.
 * layers: [{ data: RGBA 배열(Uint8Array·Uint8ClampedArray·Buffer), width, height, ox?, oy? }] (몸·앞뒤 머리처럼 그리는 순서와 상관없음)
 */
export function figureMask(layers, W, H) {
  const m = new Uint8Array(W * H);
  for (const L of layers) {
    if (!L) continue;
    const ox = L.ox ?? 0, oy = L.oy ?? 0;
    for (let y = 0; y < L.height; y++) for (let x = 0; x < L.width; x++) {
      if (L.data[(y * L.width + x) * 4 + 3] < ALPHA) continue;
      const X = x + ox, Y = y + oy;
      if (X >= 0 && Y >= 0 && X < W && Y < H) m[Y * W + X] = 1;
    }
  }
  return m;
}

export function iou(a, b) {
  let i = 0, u = 0;
  for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; }
  return u ? i / u : 1;
}

/**
 * 연속 장 겹침. loop이면 마지막 → 첫 장도 셉니다(걷기·대기).
 * 결과: { iou: [i→i+1 값], same: [i…], jumps: [i…] } — same·jumps는 앞 장 번호(0부터)
 */
export function sequenceMetrics(masks, { loop = false } = {}) {
  const n = masks.length, pairs = loop ? n : n - 1, out = { iou: [], same: [], jumps: [] };
  for (let i = 0; i < pairs; i++) {
    const v = iou(masks[i], masks[(i + 1) % n]);
    out.iou.push(Math.round(v * 100) / 100);
    if (v > SAME) out.same.push(i);
    else if (v < JUMP) out.jumps.push(i);
  }
  return out;
}

/** 무기 끝이 몸 앞(오른쪽)으로 가장 멀리 뻗은 장. tips: [[x, y] | null], footX: 발 기준 x */
export function reachFrame(tips, footX) {
  let best = -1;
  tips.forEach((t, i) => { if (t && (best < 0 || t[0] > tips[best][0])) best = i; });
  return best < 0 ? null : { frame: best, reach: Math.round(tips[best][0] - footX) };
}

/** hitFrame 대 최대 뻗음. off = hitFrame − 뻗은 장(0이면 일치) */
export function contactCheck(hitFrame, tips, footX) {
  const r = reachFrame(tips, footX);
  if (hitFrame == null || !r) return null;
  return { hitFrame, reachFrame: r.frame, reach: r.reach, off: hitFrame - r.frame };
}
