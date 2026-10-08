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
  // ── build mechanics (docs/design/BUILD_TREE.md §1)
  /** M5: effects that fire on a normal hit / a critical / being hit */
  procs?: Proc[];
  /** M6: % chance per normal attack to curse yourself (10 s: LUK 0, move −30%) */
  selfCurse?: number;
  /** M7: status resistance %, 100 = immune */
  statusRes?: Partial<Record<StatusKind, number>>;
  /** M12: % damage per skill id */
  skillDmg?: Record<string, number>;
  /** hunter falcon: extra auto-blitz chance %, extra hits, splash radius (world units) */
  autoBlitzPct?: number; blitzHits?: number; blitzRadius?: number;
  /** M3: % attack speed while bare-handed */
  unarmedAspdPct?: number;
  /** % more zeny spent by zeny-costing skills */
  zenyCostPct?: number;
  // ── RO skill alignment (docs/design/SKILLS_RO.md)
  /** mastery ATK (sword/spear/katar/mace mastery): added after DEF on every hit, not multiplied by skill % (RO) */
  masteryAtk?: number;
  /** flat ATK per hit against a race, after DEF (demon bane, beast bane) */
  raceAtk?: Pct<Race>;
  /** flat damage taken off each hit from a race, after DEF (divine protection) */
  raceFlatRes?: Pct<Race>;
  /** % VIT DEF (angelus +, auto berserk −) */
  vitDefPct?: number;
  /** riding: spears deal 100% to medium monsters */
  mountSpear?: number;
}

export type StatusKind = 'stun' | 'freeze' | 'poison' | 'blind' | 'curse' | 'sleep' | 'stone' | 'silence';
/** M5: an item/card effect that fires by chance */
export interface Proc {
  on: 'attack' | 'crit' | 'hit';
  /** where it comes from, when a skill cares (맹독 누적 doesn't layer the poison of 맹독 부여's own procs) */
  tag?: string;
  /** % per trigger */
  chance: number;
  /** cast this skill for free at this level (on the target, or on yourself for heals/buffs) */
  cast?: { skill: string; lv: number };
  /** put a status on the target */
  status?: { kind: 'stun' | 'freeze' | 'poison' | 'blind'; dur: number };
  /** heal yourself by this % of max HP */
  healPct?: number;
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
  /** awakened card form (data/cardstars.ts): ★2 / ★3 */
  star?: 2 | 3;
}

export interface EquipInst {
  uid: number;
  id: string;
  refine: number;
  slots: number;
  cards: (string | null)[];
  /** gear grade (gear.ts; absent = 일반), item level and rolled random options (ENDGAME.md §4) */
  grade?: string;
  ilvl?: number;
  opts?: Bonus[];
  /** dropped in the rift at this tier (rift.ts): its item level also lifts the base ATK / DEF */
  rift?: number;
  /** 미감정 (RO unidentified): options hidden and it can't be worn until appraised (상인 감정 or 돋보기) */
  unid?: boolean;
}

/** 균열 (rift.ts, ENDGAME.md §3): one planned run — its rules are rolled before entering so the line-up can be picked */
export interface RiftPlan {
  tier: number;
  seed: number;
  /** random rules plus, from tier 10, the decade's fixed rule */
  rules: string[];
  fixed?: string;
  /** 원소 편중: the element every monster takes */
  element?: Element;
  theme: string;
  tint: string;
  /** monster species of this run (drawn from the whole bestiary by tier band) */
  pool: string[];
  /** the boss the guardian is modelled on, and its rift mechanic */
  guardian: string;
  mech: string;
}

export interface RiftSave {
  /** best tier cleared, how fast, when, and the 3-hero line-up that did it */
  best: number;
  bestMs?: number;
  bestAt?: number;
  bestParty?: { name: string; cls: ClassId; lv: number; build?: string }[];
  /** highest tier that may be started (clears open +1/+2/+3) */
  open: number;
  /** tier picked on the entry screen (auto-retry off) */
  pick?: number;
  /** tiers already cleared once (first-clear rewards) */
  firsts: number[];
  /** auto-retry: off = back to town after a run · push = always the highest open tier · farm = one below the best */
  auto: 'off' | 'push' | 'farm';
  /** the next run, rolled ahead so the entry screen can show its rules */
  next?: RiftPlan;
  runs: number;
  clears: number;
  last?: { tier: number; ok: boolean; ms: number; adv: number; why: string };
}

export interface Look {
  gender: 'm' | 'f';
  hair: number;
  hairColor: number;
  skin: number;
  dye: number;
  costume: Partial<Record<CostumeSlot, number>>;
  /** painted-face features: type index per feature (absent = the default face) */
  eyes?: number; brows?: number; nose?: number; mouth?: number;
}

export interface AutoConfig {
  /** @deprecated per-skill auto on/off — replaced by Hero.skillSlots (migrated in state.ts load) */
  skills?: Record<string, boolean>;
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
/** what a hero does in the party: hold aggro, hit in melee, shoot, cast from the back, keep everyone alive */
export type HeroRole = 'tank' | 'melee' | 'ranged' | 'caster' | 'healer';
export interface Tactics {
  target: TacticTarget;
  /** auto = class default (melee front, ranged/casters mid/back, healer back) */
  position: TacticPosition;
  /** aggressive: spend SP freely · normal · conserve: offensive skills only while SP ≥ 50% (heals/buffs unaffected) */
  skills: TacticSkills;
  /** how far from the leader/party center this hero may chase: stay close / normal / free hunting */
  chase: TacticChase;
  /** auto = the class's natural role (an acolyte built on STR fights as a battle priest); or any role the class can play */
  role?: 'auto' | HeroRole;
}

/** party-wide orders (파티 작전) */
export interface PartyOrders {
  /** the leader stops pulling new mobs while this many are already engaged (99 = no limit) */
  pull: number;
  /** after a fight, the party sits to recover when any member's HP or SP % is below this (0 = never) */
  rest: number;
  /** M10: what the party does about a roaming danger monster on an expedition map (absent = avoid) */
  danger?: 'avoid' | 'fight';
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
  /** 스킬 슬롯: the 6 active skills the auto AI may use, left first = attack priority (passives always apply) */
  skillSlots: (string | null)[];
  /** toggle passives the player switched off (riding, auto berserk, cart look) */
  skillOff?: Record<string, boolean>;
  equip: Partial<Record<EquipSlot, number>>;
  /** equipped quiver (stack item id); quivers are never consumed */
  ammo?: string;
  auto: AutoConfig;
  tactics: Tactics;
  /** chosen build (data/builds.ts): 추천 분배 follows its stat axis */
  build?: string;
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
  /** retro pixel rendering of the field */
  pixel?: boolean;
  /** CRT monitor look over the whole game screen (scanlines, aperture grille, vignette); absent = on */
  crt?: boolean;
  /** desktop notifications for level ups, cards, rare gear, MVPs while the player is in another window */
  notify?: boolean;
  /** 저전력 모드: draw at ~30 fps (an unfocused window always drops to ~10 fps) */
  powerSave?: boolean;
}

export interface GameState {
  v: 1;
  created: number;
  lastSave: number;
  heroes: Hero[];
  partySlots: number;
  /** 동료 명단: recruited heroes waiting on the bench (ENDGAME.md §2); 3 go out, the rest train at 25% EXP */
  bench?: Hero[];
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
  /** hidden maps whose existence the player has discovered (gate.hidden) */
  discovered?: string[];
  /** 목표 핀: items being chased (have0 = owned when pinned, kills0 = source kills when pinned) */
  targets?: { id: string; since: number; have0: number; kills0: number }[];
  /** 균열 records, auto-retry and the next planned run (rift.ts) */
  rift?: RiftSave;
  /** the last ordinary hunting map: a rift entered from town hands its offline time back to it */
  lastHunt?: string;
  /** skill data version (SKILLS_RO.md): 2 = classic RO skill trees + skill slots */
  skillsV?: number;
  /** a one-time notice for the player (e.g. skill points refunded by the skill migration) */
  notice?: string;
}
