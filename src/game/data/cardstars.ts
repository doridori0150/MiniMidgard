// Card awakening (ENDGAME.md §5): every card gets ★2 and ★3 forms. Three of a card awaken into one of the next star.
// ★2 = its effect ×1.5, ★3 = ×2 plus an awakening line that depends on where the card goes. Variant ids are
// `<card>~2` / `<card>~3`; they slot exactly like the base card.
import type { Bonus, ItemDef, Proc } from '../types.ts';
import { ITEMS } from './items.ts';

export type Star = 1 | 2 | 3;
export function starOf(id: string): Star { return (ITEMS[id]?.star ?? 1) as Star; }
export function baseCard(id: string): string { return id.replace(/~[23]$/, ''); }
export function nextStarId(id: string): string | null {
  const st = starOf(id);
  return st >= 3 ? null : `${baseCard(id)}~${st + 1}`;
}
/** zeny for one awakening (the rift's essence takes over later) */
export function awakenCost(id: string) { return starOf(id) === 1 ? 20000 : 120000; }

function scale(b: Bonus, k: number): Bonus {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(b)) {
    if (typeof v === 'number') out[key] = key === 'selfCurse' ? v : Math.round(v * k * 10) / 10;
    else if (Array.isArray(v)) out[key] = (v as Proc[]).map((p) => ({ ...p, chance: Math.min(100, Math.round(p.chance * k)) }));
    else if (v && typeof v === 'object') out[key] = Object.fromEntries(Object.entries(v as Record<string, number>).map(([kk, vv]) => [kk, Math.round(vv * k)]));
    else out[key] = v;
  }
  return out as Bonus;
}
/** the ★3 extra, by where the card is slotted */
const AWAKEN: Record<NonNullable<ItemDef['cardLoc']>, [Bonus, string]> = {
  weapon: [{ atkPct: 5 }, '물리 피해 +5%'],
  armor: [{ maxHpPct: 5 }, '최대 HP +5%'],
  shield: [{ dmgReducePct: 3 }, '받는 피해 -3%'],
  garment: [{ flee: 5 }, '회피 +5'],
  shoes: [{ moveSpd: 5, maxHp: 150 }, '이동 속도 +5%, 최대 HP +150'],
  head: [{ allStats: 1 }, '모든 스탯 +1'],
  acc: [{ allStats: 1 }, '모든 스탯 +1'],
};

for (const c of Object.values(ITEMS)) {
  if (c.kind !== 'card' || c.star) continue;
  for (const st of [2, 3] as const) {
    const k = st === 2 ? 1.5 : 2;
    const bonus = scale(c.bonus ?? {}, k);
    const extra = st === 3 && c.cardLoc ? AWAKEN[c.cardLoc] : null;
    if (extra) for (const [key, v] of Object.entries(extra[0])) (bonus as Record<string, number>)[key] = ((bonus as Record<string, number>)[key] ?? 0) + (v as number);
    const lines = c.desc.split('\n');
    const where = lines.pop();
    ITEMS[`${c.id}~${st}`] = {
      ...c, id: `${c.id}~${st}`, name: `${c.name} ${'★'.repeat(st)}`, star: st, bonus,
      rarity: st === 2 ? 'epic' : 'mvp', price: c.price * (st === 2 ? 4 : 16),
      desc: `${lines.join('\n')}\n각성 ${'★'.repeat(st)}: 효과 ×${k}${extra ? ` · 각성: ${extra[1]}` : ''}\n${where ?? ''}`,
    };
  }
}
