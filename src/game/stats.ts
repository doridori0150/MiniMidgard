import type { Bonus, Element, EquipInst, EquipSlot, GameState, Hero, StatKey, WeaponType } from './types.ts';
import { STAT_KEYS } from './types.ts';
import { CLASSES, jobBonusStats } from './data/classes.ts';
import { SKILLS } from './data/skills.ts';
import { ITEMS } from './data/items.ts';

export interface ActiveBuff {
  id: string;
  name: string;
  lv: number;
  until: number;
  bonus: Bonus;
  statPct?: Partial<Record<'agi' | 'dex', number>>;
  /** remaining damage this barrier can absorb */
  shield?: number;
  /** what the barrier started with, so the ring and the HP bar can show how much is left */
  shieldMax?: number;
}

export interface Derived {
  base: Record<StatKey, number>;
  plus: Record<StatKey, number>;
  total: Record<StatKey, number>;
  maxHp: number;
  maxSp: number;
  statusAtk: number;
  watk: number;
  wlv: number;
  refineAtk: number;
  overRefine: number;
  masteryAtk: number;
  ammoAtk: number;
  bonusAtk: number;
  matkMin: number;
  matkMax: number;
  def: number;
  vitDef: number;
  mdef: number;
  intMdef: number;
  hit: number;
  flee: number;
  crit: number;
  pdodge: number;
  aspd: number;
  delay: number;
  castMul: number;
  range: number;
  moveSpd: number;
  wtype: WeaponType;
  ranged: boolean;
  weaponElement: Element;
  armorElement: Element;
  hpRegen: number;
  spRegen: number;
  b: Bonus;
}

export const EQUIP_SLOTS: EquipSlot[] = ['headTop', 'headMid', 'headLow', 'armor', 'weapon', 'shield', 'garment', 'shoes', 'acc1', 'acc2'];
export const WEAPON_SAFE = [7, 6, 5, 4];
export const ARMOR_SAFE = 4;
const REFINE_ATK = [2, 3, 5, 7];
const OVER_ATK = [3, 5, 8, 13];

export function addBonus(t: Bonus, s: Bonus | undefined, mul = 1) {
  if (!s) return t;
  for (const k of Object.keys(s) as (keyof Bonus)[]) {
    const v = s[k];
    if (v === undefined) continue;
    if (Array.isArray(v)) { // procs add up as a list
      ((t as Record<string, unknown[]>)[k] ??= []).push(...v);
    } else if (typeof v === 'number') {
      (t as Record<string, number>)[k] = ((t as Record<string, number>)[k] ?? 0) + v * mul;
    } else if (typeof v === 'string') {
      (t as Record<string, string>)[k] = v;
    } else {
      const dst = ((t as Record<string, Record<string, number>>)[k] ??= {});
      for (const [kk, vv] of Object.entries(v as Record<string, number>)) dst[kk] = (dst[kk] ?? 0) + vv * mul;
    }
  }
  return t;
}

export function findEquip(s: GameState, uid: number | undefined): EquipInst | undefined {
  if (uid === undefined) return undefined;
  return s.equips.find((e) => e.uid === uid);
}

export function heroEquip(s: GameState, h: Hero, slot: EquipSlot): EquipInst | undefined {
  return findEquip(s, h.equip[slot]);
}

export function weaponType(s: GameState, h: Hero): WeaponType {
  const w = heroEquip(s, h, 'weapon');
  return w ? ITEMS[w.id].wtype ?? 'none' : 'none';
}

export interface PartyPerks { discount: number; overcharge: number; dropPct: number; refineBonus: number; oreDrop: number }

export function partyPerks(s: GameState): PartyPerks {
  let discount = 0, overcharge = 0, dropPct = 0, refineBonus = 0, oreDrop = 0;
  for (const h of s.heroes) {
    const d = h.skills.discount ?? 0, o = h.skills.overcharge ?? 0, p = h.skills.pushcart ?? 0;
    if (d) discount = Math.max(discount, 5 + d * 2);
    if (o) overcharge = Math.max(overcharge, 5 + o * 2);
    if (p) dropPct = Math.max(dropPct, p * 3);
    refineBonus = Math.max(refineBonus, h.skills.refine_mastery ?? 0);
    oreDrop = Math.max(oreDrop, (h.skills.ore_discovery ?? 0) * 20);
  }
  return { discount, overcharge, dropPct, refineBonus, oreDrop };
}

export function computeDerived(s: GameState, h: Hero, buffs: ActiveBuff[] = [], now = 0): Derived {
  const cls = CLASSES[h.cls];
  const b: Bonus = {};
  const wInst = heroEquip(s, h, 'weapon');
  const wDef = wInst ? ITEMS[wInst.id] : undefined;
  const wtype: WeaponType = wDef?.wtype ?? 'none';
  let def = 0, mdef = 0;
  let watk = 0, refineAtk = 0, overRefine = 0, wlv = 0, ammoAtk = 0;
  let matkPct = 0;
  let weaponElement: Element = 'neutral';
  let armorElement: Element = 'neutral';

  const seen = new Set<number>();
  for (const slot of EQUIP_SLOTS) {
    const inst = heroEquip(s, h, slot);
    if (!inst || seen.has(inst.uid)) continue;
    seen.add(inst.uid);
    const d = ITEMS[inst.id];
    addBonus(b, d.bonus);
    for (const c of inst.cards) if (c) addBonus(b, ITEMS[c].bonus);
    if (slot === 'weapon') {
      wlv = d.wlv ?? 1;
      watk = d.atk ?? 0;
      refineAtk = inst.refine * REFINE_ATK[wlv - 1];
      const safe = WEAPON_SAFE[wlv - 1];
      overRefine = Math.max(0, inst.refine - safe) * OVER_ATK[wlv - 1];
      matkPct += d.matkPct ?? 0;
      if (d.element) weaponElement = d.element;
    } else {
      def += (d.def ?? 0) + (slot.startsWith('acc') ? 0 : inst.refine);
      mdef += d.mdef ?? 0;
    }
  }
  if (wtype === 'bow' && h.ammo && (s.stacks[h.ammo] ?? 0) > 0) {
    const a = ITEMS[h.ammo];
    ammoAtk = a.atk ?? 0;
    if (a.element && a.element !== 'neutral') weaponElement = a.element;
  }
  if (b.weaponElement) weaponElement = b.weaponElement;
  if (b.armorElement) armorElement = b.armorElement;

  // passives
  for (const [id, lv] of Object.entries(h.skills)) {
    const sk = SKILLS[id];
    if (sk?.passive && lv > 0) addBonus(b, sk.passive(lv, wtype));
  }
  const pct: Partial<Record<'agi' | 'dex', number>> = {};
  for (const bf of buffs) {
    if (bf.until <= now) continue;
    addBonus(b, bf.bonus);
    if (bf.statPct) for (const [k, v] of Object.entries(bf.statPct)) pct[k as 'agi'] = (pct[k as 'agi'] ?? 0) + v;
  }

  const jb = jobBonusStats(h.cls, h.jobLv);
  const plus = {} as Record<StatKey, number>;
  const total = {} as Record<StatKey, number>;
  for (const k of STAT_KEYS) {
    plus[k] = jb[k] + ((b[k] as number | undefined) ?? 0) + (b.allStats ?? 0);
    let t = h.stats[k] + plus[k];
    const p = pct[k as 'agi'];
    if (p) {
      const extra = Math.floor(t * p / 100);
      plus[k] += extra;
      t += extra;
    }
    total[k] = Math.max(1, t);
  }
  const { str, agi, vit, int, dex, luk } = total;
  const lv = h.baseLv;
  const ranged = wtype === 'bow';

  const hpBase = 35 + lv * cls.hpB + cls.hpA * lv * (lv + 1) / 2;
  const maxHp = Math.max(1, Math.floor((Math.floor(hpBase * (1 + vit / 100)) + (b.maxHp ?? 0)) * (1 + (b.maxHpPct ?? 0) / 100)));
  const spBase = 10 + lv * cls.spB;
  const maxSp = Math.max(1, Math.floor((Math.floor(spBase * (1 + int / 100)) + (b.maxSp ?? 0)) * (1 + (b.maxSpPct ?? 0) / 100)));

  const statusAtk = ranged
    ? dex + Math.floor(dex / 10) ** 2 + Math.floor(str / 5) + Math.floor(luk / 5)
    : str + Math.floor(str / 10) ** 2 + Math.floor(dex / 5) + Math.floor(luk / 5);
  matkPct += b.matkPct ?? 0;
  const matkMin = Math.floor((int + Math.floor(int / 7) ** 2) * (1 + matkPct / 100)) + (b.matk ?? 0);
  const matkMax = Math.floor((int + Math.floor(int / 5) ** 2) * (1 + matkPct / 100)) + (b.matk ?? 0);

  const baseAspd = cls.aspd[wtype] ?? cls.aspd.none ?? 150;
  let aspd = 200 - (200 - baseAspd) * (1 - (4 * agi + dex) / 1000);
  let delay = (200 - aspd) * 20 * (1 - ((b.aspdPct ?? 0) + (wtype === 'none' ? b.unarmedAspdPct ?? 0 : 0)) / 100);
  delay = Math.max(200, delay);
  aspd = 200 - delay / 20;

  const castMul = Math.max(0, (1 - dex / 150) * (1 - (b.castPct ?? 0) / 100));
  const range = (ranged ? 165 : 34) + (b.range ?? 0);
  const moveSpd = 105 * (1 + (b.moveSpd ?? 0) / 100);

  const hpRegen = (Math.max(1, Math.floor(maxHp / 200)) + Math.floor(vit / 5) + (b.hpRegen ?? 0)) * (1 + (b.hpRegenPct ?? 0) / 100);
  const spRegen = (1 + Math.floor(maxSp / 100) + Math.floor(int / 6) + (int >= 120 ? Math.floor(int / 2) - 56 : 0) + (b.spRegen ?? 0)) * (1 + (b.spRegenPct ?? 0) / 100);

  return {
    base: { ...h.stats }, plus, total,
    maxHp, maxSp, statusAtk, watk, wlv, refineAtk, overRefine,
    masteryAtk: 0, ammoAtk, bonusAtk: b.atk ?? 0,
    matkMin, matkMax,
    def: Math.min(90, def + (b.def ?? 0)), vitDef: Math.floor(vit * 0.5),
    mdef: Math.min(90, mdef + (b.mdef ?? 0)), intMdef: int + Math.floor(vit / 2),
    hit: lv + dex + (b.hit ?? 0),
    flee: lv + agi + (b.flee ?? 0),
    crit: (1 + luk * 0.3 + (b.crit ?? 0)) * (wtype === 'katar' ? 2 : 1),
    pdodge: 1 + luk * 0.1 + (b.pdodge ?? 0),
    aspd, delay, castMul, range, moveSpd,
    wtype, ranged, weaponElement, armorElement,
    hpRegen, spRegen, b,
  };
}

/** total ATK shown in the status window (RO style "a + b"). */
export function atkDisplay(d: Derived): [number, number] {
  return [d.statusAtk, d.watk + d.refineAtk + d.ammoAtk + d.bonusAtk];
}
