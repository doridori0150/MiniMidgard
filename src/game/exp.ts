// Experience curves. Shared by monsters (exp yield) and heroes (level ups).

export const BASE_MAX = 99;

export function expNext(lv: number): number {
  if (lv >= BASE_MAX) return Infinity;
  return Math.round(9 * lv * lv + 0.42 * Math.pow(lv, 3.55));
}

export function jobExpNext(tier: 0 | 1 | 2, jlv: number, jobMax: number): number {
  if (jlv >= jobMax) return Infinity;
  if (tier === 0) return Math.round(8 + jlv * jlv * 9);
  const t1 = 7 * jlv * jlv + 0.5 * Math.pow(jlv + 4, 3.3);
  return Math.round(tier === 2 ? 40000 + t1 * 5.5 : t1);
}

/** stat points granted when reaching `lv` (from lv-1). */
export function statPointsFor(lv: number): number {
  return Math.floor((lv - 1) / 5) + 3;
}

export function statCost(cur: number): number {
  return Math.floor((cur - 1) / 10) + 2;
}

export const START_STAT_POINTS = 48;
