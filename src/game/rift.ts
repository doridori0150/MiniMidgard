// 균열 — the rift (docs/design/ENDGAME.md §3): endless tiers of a generated map. Each run rolls 1–2 random rules (plus,
// from tier 10, the decade's fixed rule) that test the build axes of ENDGAME.md §1, so the 3-hero line-up is picked per
// run from the roster. Kills fill a progress bar (elite packs fill more); a full bar calls the rift guardian (an MVP
// variant with a mechanic). Ten minutes on the clock; a fast clear opens +1/+2/+3 tiers. Monsters scale HP ×1.12 and
// ATK ×1.08 per tier and gain a level per tier. Rewards: gear with grades up to 고대/태초 and an item level from the
// tier (gear.ts), 균열 정수 for 재련 and card awakening, first-clear rewards and a best-tier record with its line-up.
// DOM-free: world.ts runs the run, tools/rift-check.ts plays it headless.
import type { ClassId, Element, EquipInst, GameState, Hero, ItemDef, RiftPlan, RiftSave } from './types.ts';
import { MONSTERS, mobExpAt, type MonsterDef } from './data/monsters.ts';
import { ITEMS, SHOPS } from './data/items.ts';
import { CLASSES, lineage } from './data/classes.ts';
import { PROFILES, type BuildProfile } from './data/builds.ts';
import { ELEMENT_KO } from './data/elements.ts';
import type { ZoneDef, ZoneTheme } from './data/zones.ts';
import { applyGrade, type Grade } from './gear.ts';
import { addItem, allHeroes, canEquip, heroRole, removeStack, sendOut } from './state.ts';
import { nextStarId } from './data/cardstars.ts';

type Rng = () => number;

// ───────────────────────── currency
/** 균열 정수: pays for 재련 (option re-roll) and card awakening; never auto-sold (rarity) */
export const ESSENCE = 'q_riftessence';
ITEMS[ESSENCE] = {
  id: ESSENCE, name: '균열 정수', kind: 'etc', price: 0, rarity: 'rare', icon: { glyph: 'gem', color: '#b48aff' },
  desc: '균열 수호자와 정예 무리가 남기는 보랏빛 결정. 손바닥 위에서 아직도 조금씩 갈라진다.\n재련(옵션 다시 굴리기)과 카드 각성에 쓴다. 고대·태초 장비의 재련은 정수로만 할 수 있다.',
};
export function essence(s: GameState) { return s.stacks[ESSENCE] ?? 0; }

// ───────────────────────── rules
export type RiftRuleId = 'steel' | 'reflect' | 'ward' | 'fog' | 'swift' | 'vital' | 'swarm' | 'giant' | 'large'
  | 'element' | 'undead' | 'formless' | 'siege' | 'cursed' | 'toxic';
export interface RiftRule {
  id: RiftRuleId;
  name: string;
  icon: string;
  /** the build axis it tests (ENDGAME.md §1) */
  axis: '피해' | '명중' | '범위' | '상성' | '생존';
  /** what it does, as a combat rule */
  text: string;
  /** who it favours / punishes, in the words of builds.ts matchups() */
  good: string;
  bad: string;
  /** at most one rule per group in a run (a swarm can't also be giants) */
  group?: 'area' | 'kind';
  /** +1 = this build profile likes the rule, −1 = it suffers */
  fit: (p: BuildProfile) => number;
}
const has = (p: BuildProfile, t: NonNullable<BuildProfile['tags']>[number]) => !!p.tags?.includes(t);
export const RULES: Record<RiftRuleId, RiftRule> = {
  steel: { id: 'steel', name: '강철', icon: '🛡', axis: '피해', text: '몬스터 DEF +35 (물리 피해가 크게 준다)', good: '마법·고정 피해', bad: '물리 피해', fit: (p) => (p.dmg === 'phys' ? -1 : 1) },
  reflect: { id: 'reflect', name: '반사', icon: '🔮', axis: '피해', text: '마법 피해의 25%가 시전자에게 되돌아온다 (한 번에 최대 HP의 8%)', good: '물리·고정 피해', bad: '마법 피해', fit: (p) => (p.dmg === 'magic' ? -1 : 0) },
  ward: { id: 'ward', name: '결계', icon: '✴️', axis: '피해', text: '고정 피해(블리츠·덫·독·금화 강타) −50%', good: '물리·마법 피해', bad: '고정 피해·독', fit: (p) => (p.dmg === 'fixed' || has(p, 'poison') ? -1 : 0) },
  fog: { id: 'fog', name: '안개', icon: '☁️', axis: '명중', text: '아군 HIT −40', good: '크리·필중(마법·고정)', bad: 'DEX 명중', fit: (p) => (p.hit === 'dex' ? -1 : 1) },
  swift: { id: 'swift', name: '날쌘 무리', icon: '💨', axis: '명중', text: '몬스터 FLEE +50', good: '크리·필중(마법·고정)', bad: 'DEX 명중', fit: (p) => (p.hit === 'dex' ? -1 : 1) },
  vital: { id: 'vital', name: '급소 보호', icon: '🎯', axis: '명중', text: '몬스터 크리 저항 +50%', good: 'DEX 명중·필중', bad: '크리', fit: (p) => (p.hit === 'crit' ? -1 : 0) },
  swarm: { id: 'swarm', name: '떼', icon: '🐜', axis: '범위', group: 'area', text: '작고 약한 몬스터가 세 배로 몰려온다 (HP 35%·소형)', good: '광역', bad: '단일', fit: (p) => (p.area === 'aoe' ? 1 : -1) },
  giant: { id: 'giant', name: '거인', icon: '🗿', axis: '범위', group: 'area', text: '큰 몬스터가 적게 나온다 (HP ×3·대형)', good: '단일', bad: '광역·소형 특화', fit: (p) => (p.area === 'single' ? 1 : -1) - (has(p, 'smallOnly') ? 1 : 0) },
  large: { id: 'large', name: '대형만', icon: '🐘', axis: '상성', group: 'area', text: '모든 몬스터가 대형 (단검은 절반, 창·양손검은 그대로)', good: '창·양손검·크기 무시', bad: '단검·소형 특화', fit: (p) => (has(p, 'smallOnly') ? -1 : 0) },
  element: { id: 'element', name: '원소 편중', icon: '🌀', axis: '상성', group: 'kind', text: '모든 몬스터가 한 속성', good: '속성을 갈아 끼우는 빌드', bad: '그 속성에 약한 무기', fit: (p) => (has(p, 'element') ? 1 : 0) },
  undead: { id: 'undead', name: '불사 행렬', icon: '💀', axis: '상성', group: 'kind', text: '모든 몬스터가 불사형·불사 속성 (힐이 피해가 된다, 독·빙결 무효)', good: '성속성·퇴마', bad: '독·빙결', fit: (p) => (has(p, 'holy') ? 1 : 0) - (has(p, 'poison') ? 1 : 0) },
  formless: { id: 'formless', name: '무형', icon: '⬡', axis: '상성', group: 'kind', text: '모든 몬스터가 무형 (독이 듣지 않는다)', good: '독 아닌 빌드', bad: '독', fit: (p) => (has(p, 'poison') ? -1 : 0) },
  siege: { id: 'siege', name: '포위', icon: '⚔️', axis: '생존', text: '모든 몬스터가 선공, 둘러싸일 때 회피 감소 ×2', good: '체력(VIT) 빌드', bad: '회피 빌드', fit: (p) => (p.survive === 'dodge' ? -1 : p.survive === 'hp' ? 1 : 0) },
  cursed: { id: 'cursed', name: '저주받은 땅', icon: '☠️', axis: '생존', text: '회복 −50% (힐·물약·자연 회복·흡혈)', good: '체력·회피 빌드', bad: '회복 의존', fit: (p) => (p.survive === 'heal' ? -1 : 0) },
  toxic: { id: 'toxic', name: '맹독 안개', icon: '☣️', axis: '생존', text: '2초마다 최대 HP의 1.5% 피해 (쓰러지지는 않는다)', good: '회복 빌드', bad: '회피 빌드', fit: (p) => (p.survive === 'heal' ? 1 : p.survive === 'dodge' ? -1 : 0) },
};
export const RULE_IDS = Object.keys(RULES) as RiftRuleId[];
/** the fixed rule of each decade (tier 10–19, 20–29 …); the list turns once a week (주간 시즌) */
export const FIXED_ORDER: RiftRuleId[] = ['steel', 'swift', 'cursed', 'reflect', 'vital', 'siege', 'ward', 'fog'];
const BIAS_ELEMENTS: Element[] = ['fire', 'water', 'earth', 'wind', 'shadow', 'holy', 'ghost', 'poison'];

/** weeks since Monday 2026-01-05 (the weekly turn of the fixed rules) */
export function riftWeek(d: Date) { return Math.max(0, Math.floor((d.getTime() - new Date(2026, 0, 5).getTime()) / (7 * 86400000))); }
export function fixedRule(tier: number, week: number): RiftRuleId | undefined {
  if (tier < 10) return undefined;
  return FIXED_ORDER[(Math.floor(tier / 10) - 1 + week) % FIXED_ORDER.length];
}
export function ruleName(plan: Pick<RiftPlan, 'element'>, id: string) {
  const r = RULES[id as RiftRuleId];
  return id === 'element' && plan.element ? `${r.name}(${ELEMENT_KO[plan.element]})` : r.name;
}

// ───────────────────────── guardian & elites
export type GuardianMech = 'burst' | 'enrage' | 'barrier';
export const MECHS: Record<GuardianMech, { name: string; text: string }> = {
  burst: { name: '균열 폭발', text: '14초마다 주변을 크게 터뜨린다 (피할 수 없는 피해)' },
  enrage: { name: '광폭화', text: 'HP 30% 아래에서 공격력 ×1.6, 공격·이동이 빨라진다' },
  barrier: { name: '수호막', text: 'HP 70%·35%에서 하수인 넷을 부르고, 하수인이 남아 있는 동안 받는 피해 −90%' },
};
export type EliteAffix = 'fast' | 'armored' | 'vampiric' | 'exploding' | 'frenzied';
export const AFFIXES: Record<EliteAffix, { name: string; text: string }> = {
  fast: { name: '쾌속', text: '이동 ×1.5, 공격 간격 ×0.65' },
  armored: { name: '철갑', text: 'DEF·MDEF +25' },
  vampiric: { name: '흡혈', text: '준 피해의 25%를 회복' },
  exploding: { name: '폭발', text: '쓰러지면 1초 뒤 주변이 터진다' },
  frenzied: { name: '광폭', text: '공격력 ×1.4' },
};
export const AFFIX_IDS = Object.keys(AFFIXES) as EliteAffix[];

// ───────────────────────── scaling
export const RIFT_MAX = 150;
export const RIFT_MS = 10 * 60 * 1000;
/**
 * Tier 1 monsters: the Lv 60 stat curve × these (tools/rift-check.ts tunes them so a Lv 60–65 2nd-job party starts
 * around tier 1–5 and meets its first wall around tier 15–25 without 고대 gear). Then ×1.12 HP / ×1.08 ATK per tier.
 */
export const RIFT_REF_LV = 60;
export const RIFT_HP = 0.18;
export const RIFT_ATK = 0.55;
/** monster level: tier 1 = Lv 46, one more per tier (hit, flee and EXP follow it) */
export function riftLevel(tier: number) { return Math.min(98, 45 + tier); }
export function tierHp(tier: number) { return Math.pow(1.12, tier - 1); }
export function tierAtk(tier: number) { return Math.pow(1.08, tier - 1); }
/** the stat curve the bestiary follows (tools/audit.ts curve): HP ≈ 1.6·Lv² after the idle trim, ATK ≈ Lv·(1.6 + 0.045·Lv) */
const trim = (lv: number) => (lv >= 45 ? 0.75 : lv >= 28 ? 0.65 : lv >= 14 ? 0.8 : 1);
const hpCurve = (lv: number) => 1.6 * lv * lv * trim(lv);
const atkCurve = (lv: number) => lv * (1.6 + 0.045 * lv);
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
/** a normal monster's share of the progress bar (%); elites fill more, swarms less, giants more */
export const PROGRESS = { normal: 1.25, leader: 8, minion: 2.5 };

/** monster tiers by band of ten: the band picks which part of the bestiary shows up (stats are re-scaled anyway) */
export function bandRange(tier: number): [number, number] {
  const b = Math.ceil(tier / 10);
  return b <= 1 ? [36, 62] : b === 2 ? [46, 72] : b === 3 ? [56, 82] : b === 4 ? [66, 92] : [72, 98];
}
export function bandPool(tier: number): MonsterDef[] {
  const [lo, hi] = bandRange(tier);
  return Object.values(MONSTERS).filter((m) => !m.boss && !m.danger && !m.immobile && m.lv >= lo && m.lv <= hi);
}
export function guardianPool(tier: number): MonsterDef[] {
  const [lo, hi] = bandRange(tier);
  return Object.values(MONSTERS).filter((m) => m.boss && !m.danger && m.lv >= lo - 25 && m.lv <= hi + 8);
}

export type RiftRole = 'normal' | 'leader' | 'minion' | 'guardian' | 'add';
/**
 * A per-unit copy of a monster for this run: stats re-targeted to the rift curve, tier multipliers, the run's rules
 * (DEF, FLEE, crit resistance, size, race, element, swarm / giants) and the role (elite pack, guardian, its adds).
 * Equipment drops are dropped from its table — rift gear comes from rift.ts instead; etc items and the card stay.
 */
export function riftMonster(base: MonsterDef, plan: RiftPlan, role: RiftRole, affix?: EliteAffix): MonsterDef {
  const t = plan.tier, lv = riftLevel(t);
  const boss = role === 'guardian';
  const hpR = boss ? 1 : clamp(base.hp / hpCurve(base.lv), 0.6, 1.8);
  const atkR = boss ? 1 : clamp((base.atk[0] + base.atk[1]) / 2 / atkCurve(base.lv), 0.75, 1.3);
  const spread = base.atk[1] / Math.max(1, (base.atk[0] + base.atk[1]) / 2);
  let hp = hpR * hpCurve(RIFT_REF_LV) * RIFT_HP * tierHp(t);
  let atk = atkR * atkCurve(RIFT_REF_LV) * RIFT_ATK * tierAtk(t);
  const roleHp = { normal: 1, leader: 4, minion: 1.6, guardian: 20, add: 0.8 }[role];
  const roleAtk = { normal: 1, leader: 1.3, minion: 1.05, guardian: 1.6, add: 0.9 }[role];
  hp *= roleHp; atk *= roleAtk;
  const lvShift = (lv - base.lv) * 1.1;
  const m: MonsterDef = {
    ...base,
    lv: boss ? lv + 3 : lv,
    agi: Math.max(1, Math.round(base.agi + lvShift)),
    dex: Math.max(1, Math.round(base.dex + lvShift)),
    def: base.def, mdef: base.mdef,
    drops: base.drops.filter((d) => ITEMS[d.id]?.kind !== 'equip'),
    boss: boss ? 'mvp' : undefined,
    danger: undefined,
    skills: boss ? base.skills : role === 'add' ? undefined : base.skills?.filter((s) => s.kind !== 'summon' && s.kind !== 'howl'),
    scale: base.scale * (role === 'leader' ? 1.3 : boss ? 1.15 : 1),
    aggressive: base.aggressive || role !== 'normal',
    name: boss ? `${base.name}의 그림자` : base.name,
  };
  for (const r of plan.rules) {
    switch (r as RiftRuleId) {
      case 'steel': m.def = Math.min(90, m.def + 35); break;
      case 'swift': m.agi += 50; break;
      case 'vital': m.critRes = Math.min(0.9, (m.critRes ?? (boss ? 0.5 : 0)) + 0.5); break;
      case 'swarm': if (!boss) { hp *= 0.35; atk *= 0.6; m.size = 'small'; m.scale *= 0.8; } break;
      case 'giant': if (!boss) { hp *= 3; atk *= 1.35; m.size = 'large'; m.scale *= 1.3; m.speed *= 0.85; } break;
      case 'large': m.size = 'large'; if (!boss) m.scale *= 1.15; break;
      case 'element': if (plan.element) { m.element = plan.element; m.atkElement = plan.element; } break;
      case 'undead': m.race = 'undead'; m.element = 'undead'; m.atkElement = 'shadow'; break;
      case 'formless': m.race = 'formless'; break;
      case 'siege': m.aggressive = true; break;
    }
  }
  if (affix) {
    switch (affix) {
      case 'fast': m.speed *= 1.5; m.delay = Math.round(m.delay * 0.65); break;
      case 'armored': m.def = Math.min(90, m.def + 25); m.mdef = Math.min(90, m.mdef + 25); break;
      case 'frenzied': atk *= 1.4; break;
      default: break; // vampiric / exploding act in world.ts
    }
  }
  if (boss) m.critRes = Math.max(m.critRes ?? 0, 0.5);
  m.hp = Math.max(1, Math.round(hp));
  // EXP follows the effort: a monster of the rift's level, by how tough it is against that level's curve (no free EXP at
  // the soft low tiers), a little more per tier, and the role (an elite leader is worth four)
  const { exp, jexp } = mobExpAt(lv);
  const effort = clamp(hp / roleHp / hpCurve(lv), 0.3, 1.5);
  const expK = effort * (1 + 0.01 * t) * { normal: 1, leader: 4, minion: 1.5, guardian: 25, add: 0.3 }[role];
  m.exp = Math.round(exp * expK); m.jexp = Math.round(jexp * expK);
  m.atk = [Math.max(1, Math.round(atk * (2 - spread))), Math.max(1, Math.round(atk * spread))];
  return m;
}

/** hero-side effects of the rules (the monster-side ones are baked into riftMonster) */
export interface RiftMods {
  /** HIT added to every hero */
  heroHit: number;
  /** fixed damage (falcon, traps, poison, 금화 강타) multiplier */
  fixedMul: number;
  /** healing multiplier (heals, potions, regen, life steal) */
  healMul: number;
  /** share of magic damage reflected to the caster */
  reflect: number;
  /** crowd penalty factor on FLEE (1 = the usual −10% per attacker from the third) */
  crowdK: number;
  /** toxic mist: % max HP every 2 s */
  toxic: number;
}
export function riftMods(plan: RiftPlan): RiftMods {
  const on = (id: RiftRuleId) => plan.rules.includes(id);
  return {
    heroHit: on('fog') ? -40 : 0,
    fixedMul: on('ward') ? 0.5 : 1,
    healMul: on('cursed') ? 0.5 : 1,
    reflect: on('reflect') ? 0.25 : 0,
    crowdK: on('siege') ? 2 : 1,
    toxic: on('toxic') ? 1.5 : 0,
  };
}

const THEMES: ZoneTheme[] = ['meadow', 'forest', 'cave', 'desert', 'snow'];
const TINTS = ['#7a5ad0', '#a04a9a', '#3a6ab8', '#5a3a9a', '#b0406a'];
const pick = <T,>(rng: Rng, a: readonly T[]) => a[Math.floor(rng() * a.length)];

/** roll a run: rules, monster species, map look, guardian */
export function planRift(tier: number, rng: Rng, week: number): RiftPlan {
  tier = clamp(Math.round(tier), 1, RIFT_MAX);
  const fixed = fixedRule(tier, week);
  const n = tier < 5 ? 1 : tier >= 30 ? 2 : rng() < 0.5 ? 2 : 1;
  const rules: RiftRuleId[] = fixed ? [fixed] : [];
  for (let guard = 0; rules.length < n + (fixed ? 1 : 0) && guard < 50; guard++) {
    const r = pick(rng, RULE_IDS);
    if (rules.includes(r)) continue;
    if (RULES[r].group && rules.some((x) => RULES[x].group === RULES[r].group)) continue;
    rules.push(r);
  }
  // the decade rule last: the random ones are what changes from run to run
  if (fixed) { rules.shift(); rules.push(fixed); }
  const pool = bandPool(tier);
  const species: string[] = [];
  for (let guard = 0; species.length < Math.min(5, pool.length) && guard < 60; guard++) {
    const m = pick(rng, pool);
    if (!species.includes(m.id)) species.push(m.id);
  }
  const g = pick(rng, guardianPool(tier));
  return {
    tier, seed: Math.floor(rng() * 1e9), rules, fixed,
    element: rules.includes('element') ? pick(rng, BIAS_ELEMENTS) : undefined,
    theme: pick(rng, THEMES), tint: pick(rng, TINTS), pool: species, guardian: g.id, mech: pick(rng, Object.keys(MECHS) as GuardianMech[]),
  };
}

/** the generated map of a run: an existing theme with a rift tint (bg.ts), no bosses of its own */
export function riftZone(plan: RiftPlan): ZoneDef {
  const swarm = plan.rules.includes('swarm'), giant = plan.rules.includes('giant');
  return {
    id: `rift:${plan.tier}:${plan.seed}`, name: `균열 ${plan.tier}단계`, theme: plan.theme as ZoneTheme, tint: plan.tint,
    lv: [riftLevel(plan.tier), riftLevel(plan.tier)], bgm: 'dungeon', kind: 'dungeon',
    mobs: plan.pool.map((id) => ({ id, w: 1 })), maxMobs: swarm ? 30 : giant ? 7 : 15,
    bossGauge: 0, mvpGauge: 0, w: 980, h: 820, map: [0, 0],
    desc: '균열 속에 비친 어딘가의 풍경. 모든 것이 조금씩 뒤틀려 있다.',
  };
}

/** progress per kill (%), by rules and role */
export function progressOf(plan: RiftPlan, role: RiftRole): number {
  if (role === 'guardian' || role === 'add') return 0;
  const k = plan.rules.includes('swarm') ? 0.4 : plan.rules.includes('giant') ? 3 : 1;
  return role === 'leader' ? PROGRESS.leader : role === 'minion' ? PROGRESS.minion * k : PROGRESS.normal * k;
}

/** how many tiers a clear opens: by time left on the clock (D3-style) */
export function clearAdvance(msLeft: number): 1 | 2 | 3 { return msLeft >= 4 * 60000 ? 3 : msLeft >= 2 * 60000 ? 2 : 1; }

// ───────────────────────── save, unlock, the tier to run
export function riftSave(s: GameState): RiftSave {
  return (s.rift ??= { best: 0, open: 1, firsts: [], auto: 'off', runs: 0, clears: 0 });
}
export const RIFT_UNLOCK_LV = 60;
/** opens once a hero (out hunting or on the bench) has a 2nd job and Lv 60 */
export function riftUnlocked(s: GameState): boolean {
  return allHeroes(s).some((h) => CLASSES[h.cls].tier === 2 && h.baseLv >= RIFT_UNLOCK_LV);
}
/** the tier the next run takes: the auto-retry choice, else the one picked on the entry screen */
export function desiredTier(rs: RiftSave): number {
  if (rs.auto === 'push') return rs.open;
  if (rs.auto === 'farm') return Math.max(1, rs.best - 1);
  return clamp(rs.pick ?? rs.open, 1, rs.open);
}
/** the planned next run for this tier (kept so the rules shown on the entry screen are the ones you get) */
export function ensurePlan(s: GameState, rng: Rng, week: number, tier = desiredTier(riftSave(s))): RiftPlan {
  const rs = riftSave(s);
  if (!rs.next || rs.next.tier !== tier) rs.next = planRift(tier, rng, week);
  return rs.next;
}

// ───────────────────────── rewards
export function riftIlvl(tier: number) { return 60 + 2 * tier; }
export type LootSource = 'trash' | 'elite' | 'guardian';
/** grade of a rift drop: 고대 is common from the guardian, 태초 only from tier 70 and very rare */
export function rollRiftGrade(tier: number, src: LootSource, legend: boolean, rng: Rng): Grade {
  const x = rng();
  const primal = tier >= 70 ? (src === 'guardian' ? Math.min(0.08, 0.02 + (tier - 70) * 0.001) : src === 'elite' ? 0.005 : 0.002) : 0;
  const ancient = src === 'guardian' ? Math.min(0.75, 0.35 + tier * 0.004) : src === 'elite' ? Math.min(0.45, 0.15 + tier * 0.003) : Math.min(0.2, 0.05 + tier * 0.001);
  if (x < primal) return 'primal';
  if (x < primal + ancient) return 'ancient';
  if (legend) return 'legend';
  const y = rng();
  if (src === 'trash') return y < 0.55 ? 'rare' : 'magic';
  return y < 0.85 ? 'rare' : 'magic';
}
export function essenceForClear(tier: number) { return 2 + Math.floor(tier / 5); }
export function essenceForElite(tier: number, rng: Rng) { return 1 + (tier >= 30 && rng() < 0.5 ? 1 : 0); }
export interface FirstClear { zeny: number; essence: number; gear?: 'ancient' | 'primal' }
/** first clear of a tier: zeny and 정수 every tier, a 고대 piece every 5th tier, a 태초 piece every 10th from tier 70 */
export function firstClearReward(tier: number): FirstClear {
  const r: FirstClear = { zeny: tier * 2000, essence: 3 + Math.floor(tier / 2) };
  if (tier >= 70 && tier % 10 === 0) r.gear = 'primal';
  else if (tier % 5 === 0) r.gear = 'ancient';
  return r;
}
/** rift gear is only ever these pieces: anything equippable except costumes */
let lootPool: ItemDef[] | null = null;
function riftLootPool(): ItemDef[] {
  if (lootPool) return lootPool;
  const costume = new Set(SHOPS.costume.items);
  lootPool = Object.values(ITEMS).filter((d) => d.kind === 'equip' && !!d.loc && d.loc !== 'ammo' && !costume.has(d.id));
  return lootPool;
}
const SLOT_W: [ItemDef['loc'], number][] = [['weapon', 30], ['armor', 14], ['shield', 6], ['garment', 10], ['shoes', 10], ['acc', 18], ['headTop', 6], ['headMid', 3], ['headLow', 3]];
function casterLike(h: Hero) {
  const root = lineage(h.cls).at(-2) ?? h.cls;
  return root === 'mage' || (root === 'acolyte' && h.stats.int >= h.stats.str);
}
/** smart loot: a piece for someone in the party, a slot they can wear, among the strongest bases for their level */
export function pickRiftBase(s: GameState, rng: Rng, who?: Hero): string | null {
  const heroes = s.heroes;
  if (!heroes.length) return null;
  const h = who ?? pick(rng, heroes);
  const total = SLOT_W.reduce((a, x) => a + x[1], 0);
  for (let tries = 0; tries < 6; tries++) {
    let x = rng() * total, loc: ItemDef['loc'] = 'weapon';
    for (const [l, w] of SLOT_W) { x -= w; if (x <= 0) { loc = l; break; } }
    const w = s.equips.find((e) => e.uid === h.equip.weapon);
    if (loc === 'shield' && w && ITEMS[w.id].twoHand) continue;
    let cands = riftLootPool().filter((d) => d.loc === loc && !canEquip(h, d.id));
    if (!cands.length) continue;
    if (loc === 'weapon') {
      const wt = w ? ITEMS[w.id].wtype : undefined;
      const same = cands.filter((d) => d.wtype === wt);
      if (same.length && rng() < 0.75) cands = same;
    }
    const score = (d: ItemDef) => (loc === 'weapon' ? (casterLike(h) ? (d.matkPct ?? 0) * 10 + (d.atk ?? 0) * 0.2 : d.atk ?? 0) : (d.def ?? 0) * 3 + (d.mdef ?? 0))
      + (d.slots ?? 0) * 4 + (d.reqLv ?? 1) * 0.15 + (d.bonus ? 6 : 0);
    cands.sort((a, b) => score(b) - score(a));
    return pick(rng, cands.slice(0, 4)).id;
  }
  return null;
}
/** make one piece of rift gear in the inventory */
export function makeRiftGear(s: GameState, tier: number, src: LootSource, rng: Rng, force?: Grade, who?: Hero): EquipInst | null {
  const id = pickRiftBase(s, rng, who);
  if (!id) return null;
  const d = ITEMS[id];
  const inst = addItem(s, id, 1, d.slots ?? 0)!;
  const grade = force ?? rollRiftGrade(tier, src, d.rarity === 'epic' || d.rarity === 'mvp', rng);
  applyGrade(inst, d, grade, riftIlvl(tier), rng);
  inst.rift = tier;
  return inst;
}

// ───────────────────────── line-up
/** a hero's build profile; heroes without a chosen build fight like their class's plain build */
const CLASS_PROFILE: Partial<Record<string, BuildProfile>> = {
  swordsman: { dmg: 'phys', hit: 'dex', area: 'single', survive: 'hp' },
  mage: { dmg: 'magic', hit: 'sure', area: 'aoe', survive: 'hp' },
  archer: { dmg: 'phys', hit: 'dex', area: 'single', survive: 'dodge' },
  acolyte: { dmg: 'magic', hit: 'sure', area: 'single', survive: 'heal', tags: ['holy'] },
  thief: { dmg: 'phys', hit: 'dex', area: 'single', survive: 'dodge' },
  merchant: { dmg: 'phys', hit: 'dex', area: 'single', survive: 'hp' },
};
export function heroProfile(h: Hero): { p: BuildProfile | undefined; own: boolean } {
  if (h.build && PROFILES[h.build]) return { p: PROFILES[h.build], own: true };
  return { p: CLASS_PROFILE[lineage(h.cls).at(-2) ?? h.cls], own: false };
}
/** how well a hero's build suits these rules: + = favoured, − = punished */
export function heroFit(h: Hero, rules: string[]): number {
  const { p } = heroProfile(h);
  if (!p) return 0;
  return rules.reduce((a, r) => a + (RULES[r as RiftRuleId]?.fit(p) ?? 0), 0);
}
/** the 3 recommended for this run from everyone recruited: build fit to the rules, level, and a working party (a healer, a front line, mixed damage) */
export function recommendLineup(s: GameState, plan: RiftPlan): Hero[] {
  const all = allHeroes(s);
  if (all.length <= 3) return all;
  const top = Math.max(...all.map((h) => h.baseLv));
  const one = (h: Hero) => heroFit(h, plan.rules) * 1.2 + (h.baseLv - top) * 0.2 + (CLASSES[h.cls].tier === 2 ? 0 : -3);
  let best: Hero[] = all.slice(0, 3), bs = -Infinity;
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) for (let k = j + 1; k < all.length; k++) {
    const team = [all[i], all[j], all[k]];
    const roles = team.map((h) => heroRole(h));
    const kinds = new Set(team.map((h) => heroProfile(h).p?.dmg ?? 'phys'));
    let sc = team.reduce((a, h) => a + one(h), 0);
    if (roles.includes('healer')) sc += 1.5;
    if (roles.includes('tank') || roles.includes('melee')) sc += 0.8;
    sc += (kinds.size - 1) * 0.4;
    // keep the current party when it is as good (fewer swaps)
    sc += team.filter((h) => s.heroes.includes(h)).length * 0.05;
    if (sc > bs) { bs = sc; best = team; }
  }
  return best;
}
/** swap the bench so exactly these heroes are out (the party keeps its order where it can) */
export function applyLineup(s: GameState, ids: number[]): string | null {
  for (const id of ids) {
    if (s.heroes.some((h) => h.id === id)) continue;
    const bi = (s.bench ?? []).findIndex((h) => h.id === id);
    if (bi < 0) return '없는 동료';
    const outIdx = s.heroes.length < s.partySlots ? undefined : s.heroes.findIndex((h) => !ids.includes(h.id));
    const e = sendOut(s, bi, outIdx === -1 ? undefined : outIdx);
    if (e) return e;
  }
  return null;
}

// ───────────────────────── paying with 정수
export function awakenEssence(id: string) { return nextStarId(id)?.endsWith('~3') ? 20 : 5; }
/** card awakening paid in 정수 instead of zeny (state.ts awakenCard keeps the zeny price) */
export function awakenCardEssence(s: GameState, id: string): string | null {
  const next = nextStarId(id);
  if (!next) return '이미 최고 각성입니다.';
  if ((s.stacks[id] ?? 0) < 3) return '같은 카드가 3장 필요합니다.';
  const cost = awakenEssence(id);
  if (essence(s) < cost) return `균열 정수가 부족합니다. (${cost}개)`;
  removeStack(s, ESSENCE, cost);
  removeStack(s, id, 3);
  s.stacks[next] = (s.stacks[next] ?? 0) + 1;
  return null;
}
export function recordParty(s: GameState): RiftSave['bestParty'] {
  return s.heroes.map((h) => ({ name: h.name, cls: h.cls as ClassId, lv: h.baseLv, build: h.build }));
}
export function fmtClock(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
