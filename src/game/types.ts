// Core shared types. Game logic here must stay DOM-free so tools/sim.ts can run it in node.

export type Element =
  | 'neutral' | 'water' | 'earth' | 'fire' | 'wind'
  | 'poison' | 'holy' | 'shadow' | 'ghost' | 'undead';
export type Race =
  | 'formless' | 'undead' | 'brute' | 'plant' | 'insect'
  | 'fish' | 'demon' | 'demihuman' | 'angel' | 'dragon';
export type Size = 'small' | 'medium' | 'large';
export type StatKey = 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk';
export const STAT_KEYS: StatKey[] = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];

export type ClassId =
  | 'novice' | 'swordsman' | 'mage' | 'archer' | 'acolyte' | 'thief' | 'merchant'
  | 'knight' | 'wizard' | 'hunter' | 'priest' | 'assassin' | 'blacksmith';
export type WeaponType = 'none' | 'dagger' | 'sword' | 'sword2h' | 'spear' | 'staff' | 'bow' | 'mace' | 'axe' | 'katar';
export type EquipSlot =
  | 'headTop' | 'headMid' | 'headLow' | 'armor' | 'weapon'
  | 'shield' | 'garment' | 'shoes' | 'acc1' | 'acc2';
export type EquipLoc =
  | 'headTop' | 'headMid' | 'headLow' | 'armor' | 'weapon'
  | 'shield' | 'garment' | 'shoes' | 'acc' | 'ammo';
export type CardLoc = 'weapon' | 'armor' | 'shield' | 'garment' | 'shoes' | 'head' | 'acc';
export type CostumeSlot = 'headTop' | 'headMid' | 'headLow' | 'garment';

export type Pct<K extends string> = Partial<Record<K, number>>;

/** Every additive bonus an item, card, skill or buff can grant. */
export interface Bonus {
  str?: number; agi?: number; vit?: number; int?: number; dex?: number; luk?: number;
  allStats?: number;
  atk?: number; matk?: number; def?: number; mdef?: number;
  hit?: number; flee?: number; crit?: number; pdodge?: number;
  maxHp?: number; maxSp?: number; maxHpPct?: number; maxSpPct?: number;
  aspdPct?: number; matkPct?: number; castPct?: number; moveSpd?: number;
  /** % physical damage (over thrust, enchant poison) */
  atkPct?: number;
  /** 1 = weapon size penalty ignored (weapon perfection) */
  ignoreSize?: number;
  hpRegen?: number; spRegen?: number; hpRegenPct?: number; spRegenPct?: number;
  healPct?: number; potionPct?: number; rangedPct?: number; critDmgPct?: number;
  dmgReducePct?: number; lifeStealPct?: number;
  raceDmg?: Pct<Race>; sizeDmg?: Pct<Size>; eleDmg?: Pct<Element>;
  raceRes?: Pct<Race>; eleRes?: Pct<Element>;
  weaponElement?: Element; armorElement?: Element;
  dropPct?: number; zenyPct?: number; expPct?: number;
  range?: number;
}

export interface IconSpec {
  glyph: string;
  color?: string;
  color2?: string;
}

export type ItemKind = 'use' | 'etc' | 'equip' | 'card' | 'ammo';

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  icon: IconSpec;
  desc: string;
  price: number;
  // equip
  loc?: EquipLoc;
  /** extra head slots this headgear also occupies (e.g. a helm covering top+mid). */
  alsoHead?: ('headTop' | 'headMid' | 'headLow')[];
  wtype?: WeaponType;
  twoHand?: boolean;
  atk?: number;
  matkPct?: number;
  wlv?: 1 | 2 | 3 | 4;
  def?: number;
  mdef?: number;
  slots?: number;
  reqLv?: number;
  jobs?: ClassId[];
  bonus?: Bonus;
  element?: Element;
  look?: string;
  // use
  heal?: { hp?: [number, number]; sp?: [number, number] };
  /** timed party buff when used (attack-speed potions, element scrolls) */
  buff?: { id: string; name: string; dur: number; bonus: Bonus };
  // card
  cardLoc?: CardLoc;
  prefix?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'mvp';
}

export interface EquipInst {
  uid: number;
  id: string;
  refine: number;
  slots: number;
  cards: (string | null)[];
}

export interface Look {
  gender: 'm' | 'f';
  hair: number;
  hairColor: number;
  skin: number;
  dye: number;
  costume: Partial<Record<CostumeSlot, number>>;
}

export interface AutoConfig {
  skills: Record<string, boolean>;
  hpPotPct: number;
  spPotPct: number;
  healPct: number;
}

/** 행동 요령 — per-hero party behaviour; defaults come from the class role (defaultTactics) */
export type TacticTarget =
  | 'assist'   // 협공: the leader's / tank's target
  | 'protect'  // 아군 보호: mobs hitting a party member (backline first)
  | 'nearest'  // 가까운 적
  | 'weakest'  // 빈사 적 마무리: lowest HP% in reach
  | 'boss';    // 보스 우선 (falls back to assist)
export type TacticPosition = 'auto' | 'front' | 'mid' | 'back';
export type TacticSkills = 'aggressive' | 'normal' | 'conserve';
export type TacticChase = 'tight' | 'normal' | 'free';
export interface Tactics {
  target: TacticTarget;
  /** auto = class default (melee front, ranged/casters mid/back, healer back) */
  position: TacticPosition;
  /** aggressive: spend SP freely · normal · conserve: offensive skills only while SP ≥ 50% (heals/buffs unaffected) */
  skills: TacticSkills;
  /** how far from the leader/party center this hero may chase: stay close / normal / free hunting */
  chase: TacticChase;
}

/** party-wide orders (파티 작전) */
export interface PartyOrders {
  /** the leader stops pulling new mobs while this many are already engaged (99 = no limit) */
  pull: number;
  /** after a fight, the party sits to recover when any member's HP or SP % is below this (0 = never) */
  rest: number;
}

export interface Hero {
  id: number;
  name: string;
  cls: ClassId;
  look: Look;
  baseLv: number;
  baseExp: number;
  jobLv: number;
  jobExp: number;
  stats: Record<StatKey, number>;
  statPts: number;
  skills: Record<string, number>;
  skillPts: number;
  equip: Partial<Record<EquipSlot, number>>;
  /** equipped quiver (stack item id); quivers are never consumed */
  ammo?: string;
  auto: AutoConfig;
  tactics: Tactics;
}

/** mobile-style quick slot: a registered consumable, whether it fires automatically, and its trigger % */
export interface QuickSlot {
  id: string | null;
  auto: boolean;
  pct: number;
}

export const QUICK_SLOTS = 5;

export interface ZoneProgress {
  kills: number;
  bossGauge: number;
  mvpGauge: number;
  bossKills: number;
  mvpKills: number;
}

export interface Settings {
  bgm: number;
  sfx: number;
  muted: boolean;
  autoSellEtc: boolean;
  autoBoss: boolean;
  showDamage: boolean;
  lowFx: boolean;
}

export interface GameState {
  v: 1;
  created: number;
  lastSave: number;
  heroes: Hero[];
  partySlots: number;
  active: number;
  zeny: number;
  stacks: Record<string, number>;
  equips: EquipInst[];
  nextUid: number;
  nextHeroId: number;
  zone: string;
  unlocked: string[];
  progress: Record<string, ZoneProgress>;
  book: Record<string, { kills: number; card?: boolean }>;
  settings: Settings;
  totals: { kills: number; cards: number; refines: number; breaks: number; deaths: number; playMs: number };
  /** rolling per-zone hunt rate, used for offline rewards */
  rate: { zone: string; kills: number; ms: number; exp: number; jexp: number; zeny: number; deaths: number };
  tutorial: Record<string, boolean>;
  quick: QuickSlot[];
  orders: PartyOrders;
  /** totals.cards when the card tab was last opened (nav badge only for cards found since) */
  cardSeen?: number;
}
