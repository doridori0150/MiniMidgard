// Gear grades (ENDGAME.md §4): RO's items keep their names and slots; on top of that every dropped piece rolls a grade
// and, from 고급 up, random options whose size follows the item level (the level of whatever dropped it, later the
// rift tier). 고대·태초 come from the rift. Options are re-rolled one at a time (재련).
import type { Bonus, Element, EquipInst, ItemDef, Race, Size } from './types.ts';
import { ELEMENTS } from './data/elements.ts';

export type Grade = 'normal' | 'magic' | 'rare' | 'legend' | 'ancient' | 'primal';
export const GRADE_KO: Record<Grade, string> = { normal: '일반', magic: '고급', rare: '희귀', legend: '전설', ancient: '고대', primal: '태초' };
const GRADE_OPTS: Record<Grade, number> = { normal: 0, magic: 1, rare: 2, legend: 1, ancient: 3, primal: 3 };
/** extra base ATK / DEF for the grade */
const GRADE_BASE: Record<Grade, number> = { normal: 0, magic: 0, rare: 0.05, legend: 0.1, ancient: 0.3, primal: 0.5 };

export function gradeOf(inst: EquipInst | undefined): Grade { return (inst?.grade as Grade | undefined) ?? 'normal'; }
/** rift gear (rift.ts): its item level lifts the base ATK / DEF as well, +0.5% per item level over 60 */
export function ilvlBase(inst: EquipInst | undefined): number { return inst?.rift && inst.ilvl ? Math.max(0, inst.ilvl - 60) * 0.005 : 0; }
export function gradeBase(inst: EquipInst | undefined): number { return GRADE_BASE[gradeOf(inst)] + ilvlBase(inst); }
export const GRADE_ORDER: Grade[] = ['normal', 'magic', 'rare', 'legend', 'ancient', 'primal'];

type Rng = () => number;
const pick = <T,>(rng: Rng, a: readonly T[]) => a[Math.floor(rng() * a.length)];
const RACES: Race[] = ['formless', 'undead', 'brute', 'plant', 'insect', 'fish', 'demon', 'demihuman', 'angel', 'dragon'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const ELES: Element[] = ELEMENTS.filter((e) => e !== 'neutral');

/** one option: [weight, roll(ilvl, quality 0..1)]; quality 1 = the top of the range (태초) */
type Opt = [number, (lv: number, q: number, rng: Rng) => Bonus];
const r = (lo: number, hi: number, q: number) => Math.round(lo + (hi - lo) * q);
const stat = (k: 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk'): Opt => [3, (lv, q) => ({ [k]: r(1 + lv / 20, 2 + lv / 9, q) })];
const OFFENSE: Opt[] = [
  stat('str'), stat('agi'), stat('int'), stat('dex'), stat('luk'),
  [3, (lv, q) => ({ atkPct: r(2 + lv / 30, 5 + lv / 15, q) })],
  [2, (lv, q) => ({ matkPct: r(2 + lv / 30, 5 + lv / 15, q) })],
  [2, (lv, q) => ({ crit: r(2 + lv / 25, 5 + lv / 12, q) })],
  [2, (lv, q) => ({ critDmgPct: r(5 + lv / 12, 10 + lv / 6, q) })],
  [2, (lv, q) => ({ aspdPct: r(2, 5 + lv / 30, q) })],
  [1, (lv, q) => ({ castPct: r(3, 6 + lv / 25, q) })],
  [2, (lv, q) => ({ hit: r(3 + lv / 12, 8 + lv / 6, q) })],
  [3, (lv, q, rng) => ({ raceDmg: { [pick(rng, RACES)]: r(4 + lv / 20, 8 + lv / 10, q) } })],
  [2, (lv, q, rng) => ({ sizeDmg: { [pick(rng, SIZES)]: r(4 + lv / 20, 8 + lv / 10, q) } })],
  [2, (lv, q, rng) => ({ eleDmg: { [pick(rng, ELES)]: r(4 + lv / 20, 8 + lv / 10, q) } })],
];
const DEFENSE: Opt[] = [
  stat('vit'), stat('agi'), stat('int'), stat('luk'),
  [3, (lv, q) => ({ maxHp: r(20 + lv * 5, 40 + lv * 10, q) })],
  [2, (lv, q) => ({ maxHpPct: r(3 + lv / 30, 6 + lv / 15, q) })],
  [1, (lv, q) => ({ maxSpPct: r(3 + lv / 30, 6 + lv / 15, q) })],
  [2, (lv, q) => ({ flee: r(2 + lv / 15, 6 + lv / 8, q) })],
  [2, (lv, q) => ({ def: r(1 + lv / 30, 3 + lv / 15, q) })],
  [1, (lv, q) => ({ mdef: r(1 + lv / 30, 3 + lv / 15, q) })],
  [3, (lv, q, rng) => ({ raceRes: { [pick(rng, RACES)]: r(3 + lv / 25, 8 + lv / 12, q) } })],
  [2, (lv, q, rng) => ({ eleRes: { [pick(rng, ELES)]: r(4 + lv / 20, 10 + lv / 10, q) } })],
  [1, (lv, q) => ({ hpRegenPct: r(10, 25 + lv / 5, q) })],
  [1, (lv, q) => ({ potionPct: r(5, 15 + lv / 8, q) })],
];
function poolFor(d: ItemDef): Opt[] {
  if (d.loc === 'weapon') return OFFENSE;
  if (d.loc === 'acc') return [...OFFENSE, ...DEFENSE];
  return DEFENSE;
}
function rollOne(d: ItemDef, ilvl: number, grade: Grade, rng: Rng, taken: string[]): Bonus {
  const pool = poolFor(d);
  for (let tries = 0; tries < 12; tries++) {
    const total = pool.reduce((a, o) => a + o[0], 0);
    let x = rng() * total;
    let o = pool[0];
    for (const p of pool) { x -= p[0]; if (x <= 0) { o = p; break; } }
    const q = grade === 'primal' ? 1 : grade === 'ancient' ? 0.5 + rng() * 0.5 : rng();
    const b = o[1](ilvl, q, rng);
    const key = JSON.stringify(Object.keys(b)) + JSON.stringify(Object.values(b).map((v) => (typeof v === 'object' ? Object.keys(v as object) : '')));
    if (!taken.includes(key)) { taken.push(key); return b; }
  }
  return OFFENSE[0][1](ilvl, rng(), rng);
}

/** what a drop rolls (outside the rift): most pieces stay plain; bosses drop better; identity items are always 전설 */
export function rollGrade(d: ItemDef, src: { boss?: 'field' | 'mvp'; legend?: boolean }, rng: Rng): Grade {
  if (src.legend) return 'legend';
  const x = rng();
  if (src.boss === 'mvp') return x < 0.7 ? 'rare' : 'magic';
  if (src.boss === 'field') return x < 0.45 ? 'rare' : x < 0.9 ? 'magic' : 'normal';
  return x < 0.03 ? 'rare' : x < 0.18 ? 'magic' : 'normal';
}

/** stamp a grade, item level and its random options onto a fresh instance */
export function applyGrade(inst: EquipInst, d: ItemDef, grade: Grade, ilvl: number, rng: Rng) {
  if (grade === 'normal') return;
  inst.grade = grade;
  inst.ilvl = Math.max(1, Math.round(ilvl));
  const taken: string[] = [];
  inst.opts = Array.from({ length: GRADE_OPTS[grade] }, () => rollOne(d, inst.ilvl!, grade, rng, taken));
}

/** 재련: re-roll option i — zeny, or 균열 정수 (rift.ts). 고대·태초 are rift gear and take 정수 only */
export function rerollCost(inst: EquipInst) { return 500 + (inst.ilvl ?? 1) * 200; }
export function rerollEssence(inst: EquipInst) { return 2 + Math.floor((inst.ilvl ?? 1) / 25); }
export function rerollZenyOk(inst: EquipInst) { const g = gradeOf(inst); return g !== 'ancient' && g !== 'primal'; }
export function rerollOption(inst: EquipInst, d: ItemDef, i: number, rng: Rng) {
  if (!inst.opts?.[i]) return;
  const taken = inst.opts.filter((_, j) => j !== i).map((b) => JSON.stringify(Object.keys(b)) + JSON.stringify(Object.values(b).map((v) => (typeof v === 'object' ? Object.keys(v as object) : ''))));
  inst.opts[i] = rollOne(d, inst.ilvl ?? 1, gradeOf(inst), rng, taken);
}
