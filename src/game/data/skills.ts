// Skills — classic (pre-renewal) RO trees for every 1st and 2nd job (docs/design/SKILLS_RO.md stage 1): the full lists
// incl. quest skills, RO max levels and prerequisites (rAthena pre-re skill_tree), RO ratios / hits / SP / statuses
// (RateMyServer pre-re). Cast and delay times are scaled to the idle pace (about half of RO's). Names are original
// Korean (the repo is public): no RO-coined names for new skills. Utility skills follow the idle adaptations of §0.
// The blacksmith's own skills are left exactly as they were (the user excluded the blacksmith from stage 1).
import type { Bonus, ClassId, Element, IconSpec, StatKey, WeaponType } from '../types.ts';

export type SkillKind =
  | 'passive' | 'melee' | 'ranged' | 'bolt' | 'aoe' | 'selfAoe'
  | 'heal' | 'buff' | 'selfBuff' | 'debuff' | 'selfHeal' | 'revive'
  /** a placed ground effect (fire wall, sanctuary, quagmire…) */
  | 'ground'
  /** a hunter trap (or fire pillar): placed on the ground, goes off when a monster steps in */
  | 'trap'
  /** removes a status from an ally */
  | 'cure'
  /** teleport, warp, aqua benedicta, find stone… */
  | 'utility'
  /** auto counter: a short stance */
  | 'stance';

/** what the auto AI uses a slotted skill for */
export type AutoRole = 'attack' | 'aoe' | 'heal' | 'buff' | 'tank' | 'cc' | 'revive' | 'support' | 'none';

export type StatusKind = 'stun' | 'freeze' | 'blind' | 'sleep' | 'stone' | 'silence';
/** inputs for fixed-damage skills (traps, falcon, fire pillar) */
export interface FixedCtx { dex: number; int: number; luk: number; baseLv: number; skills: Record<string, number>; matk: number }
/** what a passive may look at besides its level and the weapon: the stats the player put in (`base`, without job or
 *  gear bonuses) and the buffs up right now (build signature skills, SKILLS_META.md) */
export interface PassiveCtx {
  skills: Record<string, number>; baseLv: number; mounted: boolean; dual: boolean; second: boolean;
  base: Record<StatKey, number>; buffs: Set<string>;
}

export interface BuffSpec {
  id: string;
  name: string;
  dur: (lv: number) => number;
  bonus: (lv: number) => Bonus;
  /** every party member (angelus, magnificat, gloria) */
  party?: boolean;
  /** one ally the caster picks (blessing, increase agi, kyrie, impositio…) — RO's "friend" target */
  ally?: boolean;
  /** percent modifiers applied after flat stats (e.g. improve concentration) */
  statPct?: (lv: number) => Partial<Record<'agi' | 'dex', number>>;
  /** damage barrier as % of each target's max HP (kyrie) */
  shieldPct?: (lv: number) => number;
  /** the barrier also breaks after this many hits (kyrie: 5 + lv/2) */
  shieldHits?: (lv: number) => number;
}

/** a placed effect on the field (world.ts GroundFx) */
export interface GroundSpec {
  /** radius (circle) or half-length (line) in world px */
  r: (lv: number) => number;
  dur: (lv: number) => number;
  /** tick interval (ms) */
  every?: number;
  /** blocks / hits it holds */
  charges?: (lv: number) => number;
  shape?: 'circle' | 'line';
  /** where the AI puts it */
  where: 'target' | 'ally' | 'self' | 'between';
}

export interface SkillDef {
  id: string;
  name: string;
  cls: ClassId;
  maxLv: number;
  kind: SkillKind;
  icon: IconSpec;
  req?: Record<string, number>;
  /** RO quest skill: no skill point; needs this job level and a fee (the quest's turn-in) */
  quest?: { job: number; zeny: number };
  /** not in classic RO (stage 2, kept from earlier versions) */
  extra?: boolean;
  sp?: (lv: number) => number;
  hpCost?: (lv: number) => number;
  zeny?: (lv: number) => number;
  /** consumed per cast (gemstones, traps, holy water); `from` = only from that level up */
  catalyst?: { id: string; n: number; from?: number };
  cast?: (lv: number) => number;
  delay?: (lv: number) => number;
  cd?: (lv: number) => number;
  range?: number;
  radius?: number;
  magic?: boolean;
  element?: Element;
  hits?: (lv: number) => number;
  mult?: (lv: number) => number;
  hitBonus?: (lv: number) => number;
  weapon?: WeaponType[];
  passive?: (lv: number, w: WeaponType, c: PassiveCtx) => Bonus;
  /** a passive part that reads the final stats (LUK → crit, DEX → hit): derived numbers only (crit, hit, range, flee…) */
  post?: (lv: number, total: Record<StatKey, number>, w: WeaponType) => Bonus;
  /** a build signature skill (SKILLS_META.md): the build id it belongs to (shown as 「빌드: ○○」) */
  build?: string;
  /** a passive the player can switch off (riding, auto berserk, cart look) */
  toggle?: boolean;
  buff?: BuffSpec;
  ground?: GroundSpec;
  /** traps / grounds this caster may have out at once */
  maxActive?: number;
  /** fixed damage per hit that ignores DEF and FLEE */
  fixed?: (lv: number, c: FixedCtx) => number;
  /** status inflicted on each target hit */
  status?: (lv: number) => { kind: StatusKind; chance: number; dur: number };
  /** knockback in cells (world CELL px each) */
  knock?: (lv: number) => number;
  /** extra multiplier against undead/demon targets */
  vsUndead?: number;
  /** only undead-element and demon-race monsters take it (magnus) */
  undeadOnly?: boolean;
  /** the damage is divided among everything it hits (napalm beat, venom splasher) */
  split?: boolean;
  /** pierce-style: hit count depends on target size */
  bySize?: boolean;
  /** HP ratio restored by revive */
  revivePct?: (lv: number) => number;
  /** usable only while hidden (grimtooth) / mounted (brandish) / with Sight up (sightrasher) */
  needs?: 'hidden' | 'mounted' | 'sight';
  /** reveals hidden monsters within this radius (sight, ruwach, detect, improve concentration) */
  reveal?: (lv: number) => number;
  auto: AutoRole;
  fx: string;
  desc: (lv: number) => string;
}

const L = (f: (lv: number) => number) => f;
const fixed = (n: number) => () => n;
/** a per-level table (index lv-1) */
const T = (a: number[]) => (lv: number) => a[Math.max(0, Math.min(a.length - 1, lv - 1))];
/** world px per RO cell (areas and knockback) */
export const CELL = 22;

export const SKILLS: Record<string, SkillDef> = {};
function def(s: SkillDef) { SKILLS[s.id] = s; }

const Q1 = { job: 35, zeny: 3000 };
const Q2 = { job: 40, zeny: 12000 };

// ═════════ Novice
def({
  id: 'basic', name: '기본기', cls: 'novice', maxLv: 9, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'book', color: '#c9a36b' },
  passive: (lv) => ({ hpRegenPct: lv * 2 }),
  desc: (lv) => `모험의 기초. 9레벨이 되면 1차 전직이 가능합니다.\nHP 회복 +${lv * 2}%`,
});
def({
  id: 'first_aid', name: '응급처치', cls: 'novice', maxLv: 1, kind: 'selfHeal', auto: 'heal', fx: 'heal',
  icon: { glyph: 'cross', color: '#6fd06f' }, sp: fixed(3), delay: fixed(800), quest: { job: 1, zeny: 0 },
  desc: () => 'HP를 5 회복합니다. (SP 3)',
});
def({
  id: 'play_dead', name: '죽은 척', cls: 'novice', maxLv: 1, kind: 'selfBuff', auto: 'support', fx: 'endure',
  icon: { glyph: 'spirit', color: '#b8b0a0' }, sp: fixed(5), quest: { job: 7, zeny: 0 },
  buff: { id: 'playdead', name: '죽은 척', dur: fixed(6000), bonus: () => ({}) },
  desc: () => '쓰러진 척 엎드립니다. 보스가 아닌 몬스터는 흥미를 잃고 떠납니다.\n그동안은 움직이지도 공격하지도 못합니다. (방치형: HP가 25% 아래이고 몬스터가 붙었을 때 최대 6초)\nSP 5 · 초보자 퀘스트',
});

// ═════════ Swordsman
def({
  id: 'sword_mastery', name: '한손검 수련', cls: 'swordsman', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'sword', color: '#8fb0e0' },
  passive: (lv, w) => (w === 'sword' || w === 'dagger' ? { masteryAtk: lv * 4 } : {}),
  desc: (lv) => `한손검·단검 장착 시 수련 공격력 +${lv * 4}\n(방어를 무시하고 매 타격에 더해집니다)`,
});
def({
  id: 'twohand_mastery', name: '양손검 수련', cls: 'swordsman', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'sword2', color: '#7da0d8' }, req: { sword_mastery: 1 },
  passive: (lv, w) => (w === 'sword2h' ? { masteryAtk: lv * 4 } : {}),
  desc: (lv) => `양손검 장착 시 수련 공격력 +${lv * 4}\n(방어를 무시하고 매 타격에 더해집니다)`,
});
def({
  id: 'hp_recovery', name: 'HP 회복력 향상', cls: 'swordsman', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'heart', color: '#ff6b6b' },
  passive: (lv) => ({ hpRegen: lv * 5, potionPct: lv * 10 }),
  desc: (lv) => `HP 자연 회복 +${lv * 5}, 회복 아이템 효과 +${lv * 10}%`,
});
def({
  id: 'bash', name: '강타', cls: 'swordsman', maxLv: 10, kind: 'melee', auto: 'attack', fx: 'bash',
  icon: { glyph: 'burst', color: '#ffb347' },
  sp: L((lv) => (lv <= 5 ? 8 : 15)), mult: L((lv) => 100 + lv * 30), hitBonus: L((lv) => lv * 5), delay: fixed(300),
  desc: (lv) => `대상에게 강력한 일격. ATK ${100 + lv * 30}%, 명중 +${lv * 5}%\n${lv >= 6 ? '급소 강타를 익히면 기절 확률이 붙습니다.\n' : ''}SP ${lv <= 5 ? 8 : 15}`,
});
def({
  id: 'magnum_break', name: '폭렬검', cls: 'swordsman', maxLv: 10, kind: 'selfAoe', auto: 'aoe', fx: 'magnum',
  icon: { glyph: 'flame', color: '#ff7a3d' }, req: { bash: 5 }, element: 'fire', knock: fixed(2),
  sp: fixed(30), hpCost: L((lv) => 21 - Math.ceil(lv / 2)), mult: L((lv) => 100 + lv * 20), hitBonus: L((lv) => lv * 10), radius: 66, delay: fixed(500), cd: fixed(2000),
  buff: { id: 'magnum', name: '폭렬', dur: fixed(10000), bonus: () => ({ eleDmg: {} }) },
  desc: (lv) => `주위(5×5)의 적을 불꽃으로 날려버립니다. 불속성 ATK ${100 + lv * 20}%, 명중 +${lv * 10}%, 2칸 밀침\n이후 10초간 공격에 불꽃 추가 피해 20%.\nHP ${21 - Math.ceil(lv / 2)} · SP 30`,
});
def({
  id: 'provoke', name: '도발', cls: 'swordsman', maxLv: 10, kind: 'debuff', auto: 'tank', fx: 'provoke',
  icon: { glyph: 'shout', color: '#ff5050' }, range: 180,
  sp: L((lv) => 3 + lv), cd: fixed(1000), delay: fixed(200),
  desc: (lv) => `주변 적의 시선을 끌어 자신을 공격하게 합니다.\n대상 DEF -${5 + lv * 5}%, 대상 ATK +${2 + lv * 3}% (30초)\n불사·보스에게는 약화가 통하지 않고 시선만 끕니다.\nSP ${3 + lv}`,
});
def({
  id: 'endure', name: '인내', cls: 'swordsman', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'endure',
  icon: { glyph: 'shield', color: '#c0a060' }, req: { provoke: 5 }, sp: fixed(10), cd: fixed(10000),
  buff: { id: 'endure', name: '인내', dur: L((lv) => 7000 + lv * 3000), bonus: (lv) => ({ mdef: lv, dmgReducePct: lv }) },
  desc: (lv) => `${7 + lv * 3}초간 맞아도 움찔하지 않습니다 (몬스터 7타까지). MDEF +${lv}\n방치형: 그동안 받는 피해 -${lv}%, 시전이 밀리지 않습니다.\nSP 10 · 재사용 10초`,
});
def({
  id: 'moving_hp', name: '이동 중 회복', cls: 'swordsman', maxLv: 1, kind: 'passive', auto: 'none', fx: '', quest: Q1,
  icon: { glyph: 'boot', color: '#ff8a8a' },
  passive: () => ({}),
  desc: () => '걷는 동안에도 HP가 자연 회복됩니다 (서 있을 때의 절반).\n보통은 걷는 동안 HP 자연 회복이 멈춥니다.\n검사 퀘스트',
});
def({
  id: 'fatal_blow', name: '급소 강타', cls: 'swordsman', maxLv: 1, kind: 'passive', auto: 'none', fx: '', quest: Q1,
  icon: { glyph: 'burst', color: '#ffe060' }, req: { bash: 5 },
  passive: () => ({}),
  desc: () => '강타 6레벨 이상: 5% × (강타 레벨 − 5) × 베이스 레벨/50 확률로 대상을 기절시킵니다.\n검사 퀘스트',
});
def({
  id: 'auto_berserk', name: '자동 광폭', cls: 'swordsman', maxLv: 1, kind: 'passive', auto: 'none', fx: '', quest: Q1, toggle: true,
  icon: { glyph: 'shout', color: '#ff2a2a' },
  passive: () => ({}),
  desc: () => 'HP가 25% 아래로 떨어지면 자신에게 도발 10레벨: ATK +32%, VIT 방어 -55%.\nHP가 25%를 넘으면 풀립니다. (켜고 끌 수 있음)\n검사 퀘스트',
});

// ═════════ Mage
const spRec = (id: string, cls: ClassId) => def({
  id, name: 'SP 회복력 향상', cls, maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'drop', color: '#5aa0ff' },
  passive: (lv) => ({ spRegen: lv * 3 }),
  desc: (lv) => `SP 자연 회복 +${lv * 3}`,
});
spRec('sp_recovery', 'mage');
def({
  id: 'napalm_beat', name: '염 폭발', cls: 'mage', maxLv: 10, kind: 'aoe', auto: 'attack', fx: 'soul', magic: true, element: 'ghost', split: true,
  icon: { glyph: 'spirit', color: '#d0a0ff' }, range: 210, radius: 36,
  sp: T([9, 9, 9, 12, 12, 12, 15, 15, 15, 18]), hits: fixed(1), mult: L((lv) => 70 + lv * 10), cast: fixed(500),
  delay: T([800, 800, 800, 720, 720, 640, 640, 560, 480, 400]),
  desc: (lv) => `대상 주변(3×3)에 염속성 MATK ${70 + lv * 10}%. 맞은 수만큼 피해가 나뉩니다.\n시전 0.5초 · SP ${T([9, 9, 9, 12, 12, 12, 15, 15, 15, 18])(lv)}`,
});
def({
  id: 'soul_strike', name: '영혼 강타', cls: 'mage', maxLv: 10, kind: 'bolt', auto: 'attack', fx: 'soul', magic: true, element: 'ghost',
  icon: { glyph: 'spirit', color: '#b8f0ff' }, range: 210, req: { napalm_beat: 4 },
  sp: T([18, 14, 24, 20, 30, 26, 36, 32, 42, 38]), hits: L((lv) => Math.ceil(lv / 2)), mult: fixed(100),
  cast: fixed(500), delay: T([720, 600, 840, 720, 960, 840, 1080, 960, 1200, 1080]),
  desc: (lv) => `염속성 영혼탄 ${Math.ceil(lv / 2)}발. 각 MATK 100%\n불사에게 추가 피해 +${lv * 5}%\nSP ${T([18, 14, 24, 20, 30, 26, 36, 32, 42, 38])(lv)}`,
});
const safetyWall = (id: string, cls: ClassId, req: Record<string, number>) => def({
  id, name: '수호벽', cls, maxLv: 10, kind: 'ground', auto: 'support', fx: 'safetywall', element: 'ghost', req,
  icon: { glyph: 'shield', color: '#ff9ad8' }, range: 210, catalyst: { id: 'k_bluegem', n: 1 }, maxActive: 2,
  sp: T([30, 30, 30, 35, 35, 35, 40, 40, 40, 40]), cast: T([2000, 1750, 1750, 1250, 1000, 750, 500, 500, 500, 500]), delay: fixed(400),
  ground: { r: fixed(18), dur: L((lv) => lv * 5000), charges: L((lv) => lv + 1), where: 'ally' },
  desc: (lv) => `한 칸에 분홍빛 벽을 세웁니다. 안에 선 동료는 근접 공격 ${lv + 1}번을 막습니다 (${lv * 5}초).\n방치형: 근접 몬스터에게 물린 후열 동료 발밑에 자동으로 세웁니다.\n푸른 마석 1 · SP ${T([30, 30, 30, 35, 35, 35, 40, 40, 40, 40])(lv)}`,
});
safetyWall('safety_wall', 'mage', { napalm_beat: 7, soul_strike: 5 });
const bolt = (id: string, name: string, el: Element, glyph: string, color: string, fx: string) => def({
  id, name, cls: 'mage', maxLv: 10, kind: 'bolt', auto: 'attack', fx, magic: true, element: el,
  icon: { glyph, color }, range: 210,
  sp: L((lv) => 10 + lv * 2), hits: L((lv) => lv), mult: fixed(100),
  cast: L((lv) => 400 + lv * 280), delay: L((lv) => 700 + lv * 100),
  desc: (lv) => `${lv}발의 ${name.replace(' 화살', '')} 화살. 각 MATK 100% (${el === 'fire' ? '불' : el === 'water' ? '물' : '바람'}속성)\n시전 ${((400 + lv * 280) / 1000).toFixed(1)}초 · SP ${10 + lv * 2}`,
});
bolt('fire_bolt', '화염 화살', 'fire', 'flame', '#ff6a3d', 'firebolt');
bolt('cold_bolt', '냉기 화살', 'water', 'ice', '#6ac4ff', 'coldbolt');
bolt('lightning_bolt', '번개 화살', 'wind', 'bolt', '#ffe45a', 'lightning');
def({
  id: 'frost_diver', name: '빙결', cls: 'mage', maxLv: 10, kind: 'bolt', auto: 'attack', fx: 'frost', magic: true, element: 'water',
  icon: { glyph: 'snow', color: '#9fe8ff' }, req: { cold_bolt: 5 }, range: 210,
  sp: L((lv) => 26 - lv), hits: fixed(1), mult: L((lv) => 100 + lv * 10), cast: fixed(800), delay: fixed(1200),
  desc: (lv) => `물속성 MATK ${100 + lv * 10}%. ${35 + lv * 3}% 확률로 ${(lv * 1.5).toFixed(1)}초간 대상을 얼립니다 (불사·보스 제외).\n얼어붙은 적은 물속성이 됩니다 — 번개 화살이 175%!\n얼음은 피해를 받으면 깨집니다 (한 번의 스킬은 끝까지 얼음 위에 들어갑니다).\nSP ${26 - lv}`,
});
def({
  id: 'stone_curse', name: '석화', cls: 'mage', maxLv: 10, kind: 'debuff', auto: 'cc', fx: 'stone', magic: true, element: 'earth',
  icon: { glyph: 'ore', color: '#a8a090' }, range: 66, catalyst: { id: 'k_redgem', n: 1 },
  sp: L((lv) => 26 - lv), cast: fixed(500), delay: fixed(400),
  status: (lv) => ({ kind: 'stone', chance: 20 + lv * 4, dur: 12000 }),
  desc: (lv) => `${20 + lv * 4}% 확률로 대상을 돌로 만듭니다 (12초, 보스 제외). 돌이 된 적은 땅속성, DEF -50%, MDEF +25%, 5초마다 최대 HP 1% 감소.\n붉은 마석 1${lv >= 6 ? ' (성공했을 때만)' : ''} · SP ${26 - lv} · 사거리 3칸`,
});
def({
  id: 'fire_ball', name: '화염구', cls: 'mage', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'fireball', magic: true, element: 'fire',
  icon: { glyph: 'fireball', color: '#ff8a3d' }, req: { fire_bolt: 4 }, range: 210, radius: 64,
  sp: fixed(25), hits: fixed(1), mult: L((lv) => 70 + lv * 10), cast: L((lv) => (lv <= 5 ? 1500 : 1000)), delay: L((lv) => (lv <= 5 ? 1300 : 900)),
  desc: (lv) => `대상 주변(5×5)을 불덩이로 폭발. 불속성 MATK ${70 + lv * 10}%\nSP 25`,
});
def({
  id: 'fire_wall', name: '화염벽', cls: 'mage', maxLv: 10, kind: 'ground', auto: 'cc', fx: 'firewall', magic: true, element: 'fire',
  icon: { glyph: 'flame', color: '#ff4a20' }, req: { fire_ball: 5, sight: 1 }, range: 210, maxActive: 3, knock: fixed(2),
  sp: fixed(40), cast: L((lv) => Math.round((2150 - lv * 150) / 2)), delay: fixed(400), mult: fixed(50),
  ground: { r: fixed(36), dur: L((lv) => (4 + lv) * 1000), every: 160, charges: L((lv) => 3 * (4 + lv)), shape: 'line', where: 'between' },
  desc: (lv) => `세 칸짜리 불의 벽. 들어선 적에게 불속성 MATK 50%, 2칸 밀침. 칸마다 ${4 + lv}번 (${4 + lv}초).\n방치형: 후열에게 달려드는 몬스터 앞에 세웁니다.\nSP 40`,
});
def({
  id: 'sight', name: '탐지의 불', cls: 'mage', maxLv: 1, kind: 'selfBuff', auto: 'support', fx: 'sight', element: 'fire',
  icon: { glyph: 'flame', color: '#ffd060' }, sp: fixed(10),
  buff: { id: 'sight', name: '탐지의 불', dur: fixed(10000), bonus: () => ({}) },
  reveal: fixed(80),
  desc: () => '10초간 주위를 도는 불꽃이 숨은 몬스터를 드러냅니다 (7×7).\n화염 폭산은 이 불꽃이 있어야 쓸 수 있습니다.\nSP 10',
});
def({
  id: 'thunderstorm', name: '뇌우', cls: 'mage', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'storm', magic: true, element: 'wind',
  icon: { glyph: 'storm', color: '#ffe45a' }, req: { lightning_bolt: 4 }, range: 210, radius: 64,
  sp: L((lv) => 24 + lv * 5), hits: L((lv) => lv), mult: fixed(80), cast: L((lv) => 600 + lv * 250), delay: fixed(1200),
  desc: (lv) => `대상 지역(5×5)에 벼락 ${lv}회. 각 바람속성 MATK 80%\nSP ${24 + lv * 5}`,
});
def({
  id: 'energy_coat', name: '마력 갑주', cls: 'mage', maxLv: 1, kind: 'selfBuff', auto: 'buff', fx: 'amp', quest: Q1,
  icon: { glyph: 'shield', color: '#80b0ff' }, sp: fixed(30), cast: fixed(2500),
  buff: { id: 'ecoat', name: '마력 갑주', dur: fixed(300000), bonus: () => ({}) },
  desc: () => '5분간 SP로 몸을 감쌉니다. 남은 SP에 따라 물리 피해 감소:\nSP 81%↑ 30% · 61%↑ 24% · 41%↑ 18% · 21%↑ 12% · 그 아래 6%\n맞을 때마다 최대 SP의 1~3%가 줄어듭니다.\nSP 30 · 마법사 퀘스트',
});

// ═════════ Archer
def({
  id: 'owls_eye', name: '올빼미의 눈', cls: 'archer', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'eye', color: '#d9b86a' },
  passive: (lv) => ({ dex: lv }),
  desc: (lv) => `DEX +${lv}`,
});
def({
  id: 'vultures_eye', name: '매의 눈', cls: 'archer', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'eye2', color: '#9ad06a' }, req: { owls_eye: 3 },
  passive: (lv, w) => (w === 'bow' ? { hit: lv, range: lv * 8 } : {}),
  desc: (lv) => `활 장착 시 명중 +${lv}, 사거리 +${lv}칸`,
});
def({
  id: 'improve_conc', name: '집중력 향상', cls: 'archer', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'conc',
  icon: { glyph: 'focus', color: '#7fe0a0' }, req: { vultures_eye: 1 },
  sp: L((lv) => 20 + lv * 5), cd: fixed(3000), reveal: fixed(70),
  buff: { id: 'conc', name: '집중', dur: L((lv) => 40000 + lv * 20000), bonus: () => ({}), statPct: (lv) => ({ agi: 2 + lv, dex: 2 + lv }) },
  desc: (lv) => `${40 + lv * 20}초간 AGI·DEX +${2 + lv}%. 쓰는 순간 주위의 숨은 몬스터를 드러냅니다.\nSP ${20 + lv * 5}`,
});
def({
  id: 'double_strafe', name: '이중 사격', cls: 'archer', maxLv: 10, kind: 'ranged', auto: 'attack', fx: 'strafe',
  icon: { glyph: 'arrows', color: '#ffd27a' }, weapon: ['bow'],
  sp: fixed(12), hits: fixed(2), mult: L((lv) => 90 + lv * 10), delay: fixed(400),
  desc: (lv) => `화살 2발을 연속 발사. 각 ATK ${90 + lv * 10}% (합계 ${180 + lv * 20}%)\n(활 필요) SP 12`,
});
def({
  id: 'arrow_shower', name: '화살비', cls: 'archer', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'shower',
  icon: { glyph: 'rain', color: '#c8e07a' }, req: { double_strafe: 5 }, weapon: ['bow'], radius: 60, knock: fixed(2),
  sp: fixed(15), hits: fixed(1), mult: L((lv) => 75 + lv * 5), delay: fixed(600), cd: fixed(1000),
  desc: (lv) => `대상 지역에 화살비. ATK ${75 + lv * 5}%, 2칸 밀침\n(활 필요) SP 15`,
});
def({
  id: 'arrow_craft', name: '화살 제작', cls: 'archer', maxLv: 1, kind: 'utility', auto: 'none', fx: '', quest: Q1,
  icon: { glyph: 'arrows', color: '#c0a070' },
  desc: () => '잡템을 깎아 속성 화살통을 만듭니다. (스킬 창에서 재료를 골라 제작)\n궁수 퀘스트',
});
def({
  id: 'arrow_repel', name: '밀어내는 화살', cls: 'archer', maxLv: 1, kind: 'ranged', auto: 'cc', fx: 'strafe', quest: Q1,
  icon: { glyph: 'arrows', color: '#80d0ff' }, weapon: ['bow'], knock: fixed(6),
  sp: fixed(15), hits: fixed(1), mult: fixed(150), cast: fixed(750), delay: fixed(400),
  desc: () => 'ATK 150%의 화살로 6칸 밀어냅니다.\n방치형: 바짝 붙은 근접 몬스터를 떼어 냅니다.\n(활 필요) 시전 0.75초 · SP 15 · 궁수 퀘스트',
});

// ═════════ Acolyte
def({
  id: 'divine_protection', name: '신의 가호', cls: 'acolyte', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'shield', color: '#f0e6a0' },
  passive: (lv, _w, c) => { const n = lv * 3 + Math.floor(0.04 * (c.baseLv + 1)); return { raceFlatRes: { undead: n, demon: n } }; },
  desc: (lv) => `불사·악마형에게 받는 피해 -${lv * 3} (+베이스 레벨×0.04, 방어 후)`,
});
def({
  id: 'demon_bane', name: '악마 퇴치', cls: 'acolyte', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'mace', color: '#f0c050' }, req: { divine_protection: 3 },
  passive: (lv, _w, c) => { const n = lv * 3 + Math.floor(0.05 * (c.baseLv + 1)); return { raceAtk: { undead: n, demon: n } }; },
  desc: (lv) => `불사·악마형을 칠 때 공격력 +${lv * 3} (+베이스 레벨×0.05, 방어 무시)`,
});
def({
  id: 'ruwach', name: '성광', cls: 'acolyte', maxLv: 1, kind: 'selfBuff', auto: 'support', fx: 'sight', element: 'holy', magic: true,
  icon: { glyph: 'sun', color: '#fff0a0' }, sp: fixed(10), reveal: fixed(60),
  buff: { id: 'ruwach', name: '성광', dur: fixed(10000), bonus: () => ({}) },
  desc: () => '10초간 주위(5×5)를 비추는 빛. 숨은 몬스터를 드러내고 성속성 MATK 145% 피해를 줍니다.\nSP 10',
});
def({
  id: 'teleport', name: '순간이동', cls: 'acolyte', maxLv: 2, kind: 'utility', auto: 'support', fx: 'teleport',
  icon: { glyph: 'wing', color: '#c0e0ff' }, req: { ruwach: 1 }, sp: L((lv) => (lv === 1 ? 10 : 9)), delay: fixed(600),
  desc: (lv) => `방치형: 근처에 사냥할 몬스터가 없으면 파티와 함께 맵 안의 다른 몬스터 곁으로 순간이동합니다.${lv >= 2 ? '\n2레벨: 위험 몹이 바짝 쫓아오면 순간이동으로 따돌립니다.' : ''}\nSP ${lv === 1 ? 10 : 9}`,
});
def({
  id: 'warp_portal', name: '차원문', cls: 'acolyte', maxLv: 4, kind: 'utility', auto: 'support', fx: 'warp',
  icon: { glyph: 'halo', color: '#a0c8ff' }, req: { teleport: 2 }, sp: T([35, 32, 29, 26]), catalyst: { id: 'k_bluegem', n: 1 }, cast: fixed(500),
  desc: (lv) => `방치형: 사냥 중 퀵슬롯 물약이 바닥나면 차원문으로 파티를 마을에 데려가 물약을 채웁니다.${lv >= 2 ? `\n${lv}레벨: 기억해 둔 사냥터로 곧장 돌아옵니다.` : '\n1레벨은 마을까지만 (돌아오는 길은 직접).'}\n푸른 마석 1 · SP ${T([35, 32, 29, 26])(lv)}`,
});
def({
  id: 'pneuma', name: '장막', cls: 'acolyte', maxLv: 1, kind: 'ground', auto: 'support', fx: 'pneuma',
  icon: { glyph: 'wind', color: '#e8f4ff' }, req: { warp_portal: 4 }, sp: fixed(10), range: 210, delay: fixed(400), maxActive: 1,
  ground: { r: fixed(36), dur: fixed(10000), where: 'ally' },
  desc: () => '3×3 구름 장막. 안에 선 동료는 원거리 물리 공격을 받지 않습니다 (10초).\n방치형: 원거리 몬스터에게 맞는 동료 발밑에 자동으로 칩니다.\nSP 10',
});
def({
  id: 'heal', name: '힐', cls: 'acolyte', maxLv: 10, kind: 'heal', auto: 'heal', fx: 'heal', magic: true, element: 'holy',
  icon: { glyph: 'cross', color: '#7fff9a' }, range: 200,
  sp: L((lv) => 10 + lv * 3), delay: fixed(600),
  desc: (lv) => `아군 HP 회복: ⌊(레벨+INT)/8⌋ × ${4 + lv * 8}\n불사 속성 적에게 쓰면 절반만큼 성속성 피해 (자동)\nSP ${10 + lv * 3}`,
});
def({
  id: 'increase_agi', name: '속도 증가', cls: 'acolyte', maxLv: 10, kind: 'buff', auto: 'buff', fx: 'agi',
  icon: { glyph: 'boot', color: '#8ff0ff' }, req: { heal: 3 }, range: 220,
  sp: L((lv) => 15 + lv * 3), hpCost: fixed(15), delay: fixed(500),
  buff: { id: 'agi_up', name: '속도 증가', ally: true, dur: L((lv) => 40000 + lv * 20000), bonus: (lv) => ({ agi: 2 + lv, moveSpd: 25 }) },
  desc: (lv) => `동료 한 명에게 ${40 + lv * 20}초간 AGI +${2 + lv}, 이동속도 +25%\nHP 15 · SP ${15 + lv * 3}`,
});
def({
  id: 'decrease_agi', name: '속도 감소', cls: 'acolyte', maxLv: 10, kind: 'debuff', auto: 'cc', fx: 'decagi',
  icon: { glyph: 'boot', color: '#8090a0' }, req: { increase_agi: 1 }, range: 210, sp: L((lv) => 13 + lv * 2), cast: fixed(500), delay: fixed(500),
  desc: (lv) => `${40 + lv * 2}% (+(베이스 레벨+INT)/5)의 확률로 대상의 AGI -${2 + lv}, 이동속도 -25% (${30 + lv * 10}초).\n보스에게는 통하지 않습니다. 방치형: 날쌘 몹·정예·후열을 쫓는 몹에게 겁니다.\nSP ${13 + lv * 2}`,
});
def({
  id: 'aqua_benedicta', name: '성수 만들기', cls: 'acolyte', maxLv: 1, kind: 'utility', auto: 'support', fx: 'heal',
  icon: { glyph: 'drop', color: '#c8f0ff' }, sp: fixed(10), cast: fixed(500),
  desc: () => '물을 떠 성수 1병을 만듭니다 (성수 세례의 촉매).\n방치형: 싸움이 없을 때 성수가 10병보다 적으면 하나씩 만듭니다.\nSP 10',
});
def({
  id: 'signum_crucis', name: '성호', cls: 'acolyte', maxLv: 10, kind: 'debuff', auto: 'cc', fx: 'crucis',
  icon: { glyph: 'cross', color: '#fff8c0' }, req: { demon_bane: 3 }, sp: fixed(35), cast: fixed(250), delay: fixed(1000), radius: 320,
  desc: (lv) => `화면 안의 불사·악마형 적의 DEF -${10 + lv * 4}% (죽을 때까지).\n확률 ${23 + lv * 4}% + 베이스 레벨 − 대상 레벨\nSP 35`,
});
def({
  id: 'angelus', name: '천사의 가호', cls: 'acolyte', maxLv: 10, kind: 'buff', auto: 'buff', fx: 'angelus',
  icon: { glyph: 'halo', color: '#ffffff' }, req: { divine_protection: 3 }, range: 220,
  sp: L((lv) => 20 + lv * 3), cast: fixed(250), delay: fixed(500),
  buff: { id: 'angelus', name: '천사의 가호', party: true, dur: L((lv) => lv * 30000), bonus: (lv) => ({ vitDefPct: lv * 5 }) },
  desc: (lv) => `파티 전원 ${lv * 30}초간 VIT 방어 +${lv * 5}%\nSP ${20 + lv * 3}`,
});
def({
  id: 'blessing', name: '축복', cls: 'acolyte', maxLv: 10, kind: 'buff', auto: 'buff', fx: 'blessing',
  icon: { glyph: 'wing', color: '#ffe680' }, req: { divine_protection: 5 }, range: 220,
  sp: L((lv) => 24 + lv * 4), delay: fixed(500),
  buff: { id: 'blessing', name: '축복', ally: true, dur: L((lv) => 40000 + lv * 20000), bonus: (lv) => ({ str: lv, int: lv, dex: lv }) },
  desc: (lv) => `동료 한 명에게 ${40 + lv * 20}초간 STR·INT·DEX +${lv}. 저주를 풉니다.\nSP ${24 + lv * 4}`,
});
def({
  id: 'cure', name: '치료', cls: 'acolyte', maxLv: 1, kind: 'cure', auto: 'support', fx: 'heal',
  icon: { glyph: 'cross', color: '#a0e0ff' }, req: { heal: 2 }, sp: fixed(15), range: 220, delay: fixed(500),
  desc: () => '동료의 실명·혼란·침묵을 풉니다.\nSP 15',
});
def({
  id: 'holy_light', name: '성스러운 빛', cls: 'acolyte', maxLv: 1, kind: 'bolt', auto: 'attack', fx: 'holy', magic: true, element: 'holy', quest: Q1,
  icon: { glyph: 'sun', color: '#fff3a0' }, range: 200,
  sp: fixed(15), hits: fixed(1), mult: fixed(125), cast: fixed(1000), delay: fixed(900),
  desc: () => '성속성 빛의 창. MATK 125%\n불사·암흑에게 특히 강합니다. 시전 1초 · SP 15 · 성직자 퀘스트',
});
// battle priests had no weapon skill (BUILD_TREE.md 2.4: 철퇴 사제 · 광휘 크리 사제) — a holy two-hit swing (stage 2, not RO)
def({
  id: 'holy_strike', name: '성스러운 일격', cls: 'acolyte', maxLv: 5, kind: 'melee', auto: 'attack', fx: 'bash', element: 'holy', extra: true,
  icon: { glyph: 'cross', color: '#ffe680' },
  sp: L((lv) => 6 + lv * 2), hits: fixed(2), mult: L((lv) => 100 + lv * 20), hitBonus: L((lv) => lv * 4), delay: fixed(550),
  desc: (lv) => `둔기에 성스러운 힘을 실어 두 번 내려친다. 성속성 ATK ${100 + lv * 20}% ×2, 명중 +${lv * 4}%\n불사·악마에게 특히 강하다. SP ${6 + lv * 2}`,
});

// ═════════ Thief
def({
  id: 'double_attack', name: '이중 공격', cls: 'thief', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'dagger2', color: '#c0a0ff' },
  passive: (lv, w) => (w === 'dagger' ? { hit: lv } : {}),
  desc: (lv) => `단검 공격 시 ${lv * 5}% 확률로 2회 타격, 명중 +${lv}`,
});
def({
  id: 'improve_dodge', name: '회피 향상', cls: 'thief', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'wind', color: '#a0f0d0' },
  passive: (lv, _w, c) => (c.second ? { flee: lv * 4, moveSpd: lv } : { flee: lv * 3 }),
  desc: (lv) => `FLEE +${lv * 3} (2차 직업은 +${lv * 4}, 이동 속도 +${lv}%)`,
});
def({
  id: 'steal', name: '훔치기', cls: 'thief', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'hand', color: '#ffd080' },
  passive: () => ({}),
  desc: (lv) => `공격 시 ${(lv * 1.2).toFixed(1)}% 확률로 대상의 전리품 하나를 훔칩니다.\n(몬스터당 1회, 카드·보스 제외) 방치형: 공격할 때 자동으로`,
});
def({
  id: 'hiding', name: '하이딩', cls: 'thief', maxLv: 10, kind: 'selfBuff', auto: 'support', fx: 'hide', req: { steal: 5 },
  icon: { glyph: 'spirit', color: '#8070a0' }, sp: fixed(10),
  buff: { id: 'hiding', name: '하이딩', dur: L((lv) => lv * 30000), bonus: () => ({}) },
  desc: (lv) => `땅속으로 숨습니다 (최대 ${lv * 30}초, ${4 + lv}초마다 SP 1). 곤충·악마·보스가 아닌 몬스터는 찾지 못합니다.\n숨은 동안은 공격할 수 없습니다.\n방치형: HP가 낮을 때 몬스터를 떼어 내고, 회복되면 나옵니다.\nSP 10`,
});
def({
  id: 'envenom', name: '맹독', cls: 'thief', maxLv: 10, kind: 'melee', auto: 'attack', fx: 'envenom', element: 'poison',
  icon: { glyph: 'poison', color: '#b070e0' },
  sp: fixed(12), mult: fixed(100), delay: fixed(300),
  desc: (lv) => `독속성 공격 + 추가 피해 ${lv * 15} (방어 무시). ${10 + lv * 4}% 확률로 중독\n(중독: DEF -25%, 지속 피해. 불사·보스 무효) SP 12`,
});
def({
  id: 'detoxify', name: '해독', cls: 'thief', maxLv: 1, kind: 'cure', auto: 'support', fx: 'heal', req: { envenom: 3 },
  icon: { glyph: 'poison', color: '#80e0a0' }, sp: fixed(10), range: 220, delay: fixed(400),
  desc: () => '동료의 중독을 풉니다.\nSP 10',
});
def({
  id: 'sand_attack', name: '모래 뿌리기', cls: 'thief', maxLv: 1, kind: 'melee', auto: 'attack', fx: 'sand', element: 'earth', quest: Q1,
  icon: { glyph: 'sand', color: '#d8b070' },
  sp: fixed(9), mult: fixed(130), delay: fixed(400), cd: fixed(3000),
  status: () => ({ kind: 'blind', chance: 20, dur: 8000 }),
  desc: () => '땅속성 ATK 130%. 20% 확률로 실명 (적 명중 -25%)\nSP 9 · 도둑 퀘스트',
});
def({
  id: 'back_slide', name: '뒤로 구르기', cls: 'thief', maxLv: 1, kind: 'utility', auto: 'support', fx: 'backslide', quest: Q1,
  icon: { glyph: 'wind', color: '#d0e0ff' }, sp: fixed(7), cd: fixed(2500),
  desc: () => '뒤로 5칸 굴러 물러납니다.\n방치형: 근접 몬스터에게 물린 후열이 거리를 벌릴 때 씁니다.\nSP 7 · 도둑 퀘스트',
});
def({
  id: 'find_stone', name: '돌 줍기', cls: 'thief', maxLv: 1, kind: 'utility', auto: 'support', fx: '', quest: Q1,
  icon: { glyph: 'ore', color: '#a8a8a0' }, sp: fixed(3), cast: fixed(250),
  desc: () => '던질 돌을 하나 줍습니다.\n방치형: 싸움이 없을 때 돌이 5개보다 적으면 줍습니다.\nSP 3 · 도둑 퀘스트',
});
def({
  id: 'throw_stone', name: '돌 던지기', cls: 'thief', maxLv: 1, kind: 'bolt', auto: 'attack', fx: 'stone', quest: Q1, req: { find_stone: 1 },
  icon: { glyph: 'ore', color: '#c0c0b0' }, sp: fixed(2), range: 154, catalyst: { id: 'k_stone', n: 1 }, delay: fixed(400),
  hits: fixed(1), fixed: () => 50, status: () => ({ kind: 'stun', chance: 3, dur: 3000 }),
  desc: () => '돌을 던져 고정 피해 50 (회피 무시). 3% 확률로 기절. 사거리 7칸\n돌 1개 · SP 2 · 도둑 퀘스트',
});

// ═════════ Merchant
def({
  id: 'enlarge_weight', name: '무게 증가', cls: 'merchant', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'cart', color: '#a0b0c0' },
  passive: () => ({}),
  desc: (lv) => `짐을 더 많이 듭니다. 방치형: 파티의 퀵슬롯 물약 회복량 +${lv}%, 카트 돌진 피해 +${lv * 10}%.`,
});
def({
  id: 'discount', name: '할인', cls: 'merchant', maxLv: 10, kind: 'passive', auto: 'none', fx: '', req: { enlarge_weight: 3 },
  icon: { glyph: 'tag', color: '#80e080' },
  passive: () => ({}),
  desc: (lv) => `상점 구매 가격 -${5 + lv * 2}% (파티 공유)`,
});
def({
  id: 'overcharge', name: '바가지', cls: 'merchant', maxLv: 10, kind: 'passive', auto: 'none', fx: '', req: { discount: 3 },
  icon: { glyph: 'coin', color: '#ffd24a' },
  passive: () => ({}),
  desc: (lv) => `상점 판매 가격 +${5 + lv * 2}% (파티 공유)`,
});
def({
  id: 'pushcart', name: '손수레', cls: 'merchant', maxLv: 10, kind: 'passive', auto: 'none', fx: '', req: { enlarge_weight: 5 },
  icon: { glyph: 'cart', color: '#d0a070' },
  passive: (lv) => ({ dropPct: lv * 3 }),
  desc: (lv) => `손수레를 끕니다. 방치형: 잡템 드롭률 +${lv * 3}% (파티 공유). 카트 돌진·노점의 선행 스킬.`,
});
def({
  id: 'item_appraisal', name: '감정', cls: 'merchant', maxLv: 1, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'eye', color: '#ffe0a0' },
  passive: () => ({}),
  desc: () => '미감정 장비(희귀 이상)를 감정합니다. 방치형: 파티에 있으면 줍는 즉시 자동 감정.\n(감정 전에는 옵션이 숨겨지고 입을 수 없습니다. 돋보기로도 감정할 수 있습니다)',
});
def({
  id: 'vending', name: '노점', cls: 'merchant', maxLv: 10, kind: 'passive', auto: 'none', fx: '', req: { pushcart: 3 },
  icon: { glyph: 'tag', color: '#ffb060' },
  passive: () => ({}),
  desc: (lv) => `노점을 엽니다. 방치형: 장비를 팔 때 +${lv * 3}% (파티 공유, 바가지와 함께)`,
});
def({
  id: 'mammonite', name: '금화 강타', cls: 'merchant', maxLv: 10, kind: 'melee', auto: 'attack', fx: 'mammonite',
  icon: { glyph: 'coins', color: '#ffd24a' },
  sp: fixed(5), zeny: L((lv) => lv * 100), mult: L((lv) => 100 + lv * 50), delay: fixed(300),
  desc: (lv) => `돈으로 때립니다. ATK ${100 + lv * 50}%\n소모: ${lv * 100} 제니, SP 5`,
});
def({
  id: 'cart_revolution', name: '카트 돌진', cls: 'merchant', maxLv: 1, kind: 'aoe', auto: 'aoe', fx: 'cart', quest: Q1,
  icon: { glyph: 'cart2', color: '#e0a050' }, req: { pushcart: 1 }, radius: 44, knock: fixed(2),
  sp: fixed(12), hits: fixed(1), mult: fixed(150), delay: fixed(500), cd: fixed(1000),
  desc: () => '손수레로 대상 주변(3×3)을 쓸어버립니다. ATK 150% + 무게 증가 레벨×10%, 2칸 밀침\nSP 12 · 상인 퀘스트 (손수레 필요)',
});
def({
  id: 'change_cart', name: '카트 교체', cls: 'merchant', maxLv: 1, kind: 'passive', auto: 'none', fx: '', quest: { job: 35, zeny: 1000 }, toggle: true, req: { pushcart: 1 },
  icon: { glyph: 'cart2', color: '#ff9ad8' },
  passive: () => ({}),
  desc: () => '손수레를 꽃무늬 손수레로 바꿉니다. (꾸미기, 켜고 끌 수 있음)\n상인 퀘스트',
});
def({
  id: 'loud_exclamation', name: '우렁찬 외침', cls: 'merchant', maxLv: 1, kind: 'buff', auto: 'buff', fx: 'endure', quest: Q1,
  icon: { glyph: 'shout', color: '#ffb040' }, sp: fixed(8), delay: fixed(400),
  buff: { id: 'loud', name: '우렁찬 외침', party: true, dur: fixed(300000), bonus: () => ({ str: 4 }) },
  desc: () => '힘찬 외침으로 주위 파티원의 STR +4 (5분).\nSP 8 · 상인 퀘스트',
});

// ═════════ 2nd jobs
// ───────── Knight
def({
  id: 'spear_mastery', name: '창 수련', cls: 'knight', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'spear', color: '#8fb0e0' },
  passive: (lv, w, c) => (w === 'spear' ? { masteryAtk: lv * (c.mounted ? 5 : 4) } : {}),
  desc: (lv) => `창 장착 시 수련 공격력 +${lv * 4} (탑승 중 +${lv * 5}, 방어 무시)`,
});
def({
  id: 'pierce', name: '꿰뚫기', cls: 'knight', maxLv: 10, kind: 'melee', auto: 'attack', fx: 'pierce', bySize: true,
  icon: { glyph: 'spear', color: '#5aa0ff' }, req: { spear_mastery: 1 }, weapon: ['spear'],
  sp: fixed(7), mult: L((lv) => 100 + lv * 10), hitBonus: L((lv) => lv * 5), delay: fixed(400),
  desc: (lv) => `창으로 꿰뚫습니다. 소형 1회·중형 2회·대형 3회 타격, 각 ATK ${100 + lv * 10}%\n명중 +${lv * 5}% (창 필요) SP 7`,
});
def({
  id: 'spear_stab', name: '창 찌르기', cls: 'knight', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'pierce', req: { pierce: 5 }, weapon: ['spear'],
  icon: { glyph: 'spear', color: '#ffd070' }, range: 88, radius: 20, knock: fixed(6),
  sp: fixed(9), hits: fixed(1), mult: L((lv) => 100 + lv * 20), delay: fixed(500),
  desc: (lv) => `대상까지 일직선(4칸)의 적을 모두 찌르고 6칸 밀어냅니다. ATK ${100 + lv * 20}%\n(창 필요) SP 9`,
});
def({
  id: 'spear_boomerang', name: '창 던지기', cls: 'knight', maxLv: 5, kind: 'ranged', auto: 'attack', fx: 'boomerang', req: { pierce: 3 }, weapon: ['spear'],
  icon: { glyph: 'spear', color: '#a0e0a0' }, range: 0,
  sp: fixed(10), hits: fixed(1), mult: L((lv) => 100 + lv * 50), delay: fixed(600),
  desc: (lv) => `창을 던졌다 되받습니다. ATK ${100 + lv * 50}%, 사거리 ${1 + lv * 2}칸\n(창 필요) SP 10`,
});
def({
  id: 'brandish', name: '창 휘두르기', cls: 'knight', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'brandish', knock: fixed(2), needs: 'mounted',
  icon: { glyph: 'spear', color: '#ffb347' }, req: { riding: 1, spear_stab: 3 }, weapon: ['spear'], range: 60,
  sp: fixed(12), hits: fixed(1), mult: L((lv) => 100 + lv * 20), cast: fixed(350), delay: fixed(700), cd: fixed(1000),
  desc: (lv) => `탑승한 채 창을 크게 휘둘러 앞쪽(${Math.min(4, Math.ceil(lv / 3))}칸)을 쓸어버립니다. ATK ${100 + lv * 20}%, 2칸 밀침\n(창·탑승 필요) 시전 0.35초 · SP 12`,
});
def({
  id: 'twohand_quicken', name: '양손검 가속', cls: 'knight', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'quicken',
  icon: { glyph: 'sword2', color: '#ffd24a' }, req: { twohand_mastery: 1 }, weapon: ['sword2h'],
  sp: L((lv) => 10 + lv * 4), cd: fixed(2000),
  buff: { id: 'quicken', name: '양손검 가속', dur: L((lv) => lv * 30000), bonus: () => ({ aspdPct: 30 }) },
  desc: (lv) => `${lv * 30}초간 공격 속도 +30% (양손검 필요)\nSP ${10 + lv * 4}`,
});
def({
  id: 'auto_counter', name: '반격', cls: 'knight', maxLv: 5, kind: 'stance', auto: 'tank', fx: 'counter', req: { twohand_mastery: 1 },
  icon: { glyph: 'shield', color: '#ff6a6a' }, sp: fixed(3),
  desc: (lv) => `${(lv * 0.4).toFixed(1)}초간 반격 자세. 그동안 근접 공격을 한 번 막고 방어를 무시하는 크리티컬로 되받아칩니다.\n자세 중에는 움직이지 못합니다. 방치형: 근접 몬스터가 휘두르기 직전에 자세를 잡습니다.\nSP 3 (활 제외)`,
});
def({
  id: 'bowling_bash', name: '회전 강타', cls: 'knight', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'bowling', radius: 50,
  icon: { glyph: 'burst', color: '#ff8a3a' }, req: { bash: 10, magnum_break: 3, twohand_mastery: 5, twohand_quicken: 10, auto_counter: 5 },
  knock: T([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]),
  sp: L((lv) => 12 + lv), hits: fixed(2), mult: L((lv) => 100 + lv * 40), cast: fixed(350), delay: fixed(700), cd: fixed(1000),
  desc: (lv) => `적을 후려쳐 주변(3×3)까지 휩쓰는 2연타. 각 ATK ${100 + lv * 40}%, ${T([1, 1, 2, 2, 3, 3, 4, 4, 5, 5])(lv)}칸 밀침\n시전 0.35초 · SP ${12 + lv}`,
});
def({
  id: 'riding', name: '탑승', cls: 'knight', maxLv: 1, kind: 'passive', auto: 'none', fx: '', req: { endure: 1 }, toggle: true,
  icon: { glyph: 'bird', color: '#ffd060' },
  passive: (_lv, _w, c) => ({ moveSpd: 25, mountSpear: 1, aspdPct: -[100, 66.7, 42.9, 25, 11.1, 0][Math.min(5, c.skills.cavalier_mastery ?? 0)] }),
  desc: () => '커다란 질주새에 올라탑니다 (켜고 끌 수 있음).\n이동 속도 +25%, 창이 중형에게 100%, 창 수련 +1/레벨.\n공격 속도가 절반이 됩니다 — 기병 수련으로 되찾습니다.\n창 휘두르기는 탑승 중에만.',
});
def({
  id: 'cavalier_mastery', name: '기병 수련', cls: 'knight', maxLv: 5, kind: 'passive', auto: 'none', fx: '', req: { riding: 1 },
  icon: { glyph: 'bird', color: '#c0a040' },
  passive: () => ({}),
  desc: (lv) => `탑승 중 공격 속도가 평소의 ${50 + lv * 10}%`,
});
def({
  id: 'charge_attack', name: '돌격', cls: 'knight', maxLv: 1, kind: 'melee', auto: 'attack', fx: 'bash', quest: Q2, knock: fixed(2),
  icon: { glyph: 'boot', color: '#ff9050' }, range: 300, sp: fixed(40), cast: fixed(250), delay: fixed(500), cd: fixed(4000),
  desc: () => '멀리 있는 적에게 단숨에 달려들어 일격. 3칸마다 ATK +100% (100%~500%), 2칸 밀침\n방치형: 멀리 떨어진 대상을 칠 때 씁니다. SP 40 · 기사 퀘스트',
});

// ───────── Wizard
def({
  id: 'fire_pillar', name: '화염 기둥', cls: 'wizard', maxLv: 10, kind: 'trap', auto: 'aoe', fx: 'firepillar', element: 'fire', magic: true,
  icon: { glyph: 'flame', color: '#ff3a20' }, req: { fire_wall: 1 }, range: 210, maxActive: 5, catalyst: { id: 'k_bluegem', n: 1, from: 6 },
  sp: fixed(75), cast: L((lv) => Math.round((3300 - lv * 300) / 2)), delay: fixed(600),
  hits: L((lv) => lv + 2), fixed: (_lv, c) => Math.floor(50 + c.matk / 5),
  ground: { r: L((lv) => (lv <= 5 ? 36 : 60)), dur: fixed(30000), where: 'target' },
  desc: (lv) => `발밑의 불기둥. 밟은 적과 주변(${lv <= 5 ? '3×3' : '5×5'})에 ${lv + 2}회, 각 50 + MATK/5 (마법 방어 무시)\n${lv >= 6 ? '푸른 마석 1 · ' : ''}SP 75`,
});
def({
  id: 'sightrasher', name: '화염 폭산', cls: 'wizard', maxLv: 10, kind: 'selfAoe', auto: 'aoe', fx: 'magnum', magic: true, element: 'fire', needs: 'sight',
  icon: { glyph: 'fireball', color: '#ffb030' }, req: { lightning_bolt: 1, sight: 1 }, radius: 100, knock: fixed(5),
  sp: L((lv) => 33 + lv * 2), hits: fixed(1), mult: L((lv) => 100 + lv * 20), cast: fixed(250), delay: fixed(1200),
  desc: (lv) => `탐지의 불을 여덟 방향으로 터뜨립니다. 주위의 적에게 불속성 MATK ${100 + lv * 20}%, 5칸 밀침\n(탐지의 불이 켜져 있어야 함) SP ${33 + lv * 2}`,
});
def({
  id: 'meteor', name: '유성우', cls: 'wizard', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'meteor', magic: true, element: 'fire',
  icon: { glyph: 'fireball', color: '#ff5a2a' }, req: { sightrasher: 2, thunderstorm: 1 }, range: 220, radius: 100,
  sp: T([20, 24, 30, 34, 40, 44, 50, 54, 60, 64]), hits: T([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]), mult: fixed(125),
  cast: L((lv) => 1800 + lv * 250), delay: L((lv) => 1000 + lv * 250),
  status: (lv) => ({ kind: 'stun', chance: lv * 3, dur: 3000 }),
  desc: (lv) => `유성 ${T([2, 3, 3, 4, 4, 5, 5, 6, 6, 7])(lv)}개가 대상 지역(9×9)에 떨어집니다. 유성마다 7×7, ${T([1, 1, 2, 2, 3, 3, 4, 4, 5, 5])(lv)}타 × 불속성 MATK 125%\n${lv * 3}% 확률로 기절 · SP ${T([20, 24, 30, 34, 40, 44, 50, 54, 60, 64])(lv)}`,
});
def({
  id: 'jupitel', name: '뇌격구', cls: 'wizard', maxLv: 10, kind: 'bolt', auto: 'attack', fx: 'jupitel', magic: true, element: 'wind',
  icon: { glyph: 'bolt', color: '#7ad0ff' }, req: { napalm_beat: 1, lightning_bolt: 1 }, range: 220, knock: T([2, 3, 3, 4, 4, 5, 5, 6, 6, 7]),
  sp: L((lv) => 17 + lv * 3), hits: L((lv) => lv + 2), mult: fixed(100), cast: L((lv) => 500 + lv * 150), delay: fixed(700),
  desc: (lv) => `번개 구체가 ${lv + 2}연타. 각 바람속성 MATK 100%, ${T([2, 3, 3, 4, 4, 5, 5, 6, 6, 7])(lv)}칸 밀침\nSP ${17 + lv * 3}`,
});
def({
  id: 'lord_vermilion', name: '천둥왕의 심판', cls: 'wizard', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'lov', magic: true, element: 'wind',
  icon: { glyph: 'storm', color: '#ffe45a' }, req: { thunderstorm: 1, jupitel: 5 }, range: 220, radius: 116,
  sp: L((lv) => 56 + lv * 4), hits: fixed(4), mult: L((lv) => 80 + lv * 20), cast: L((lv) => 3500 + lv * 300), delay: fixed(3000),
  status: (lv) => ({ kind: 'blind', chance: lv * 4, dur: 8000 }),
  desc: (lv) => `하늘을 가르는 벼락 4파. 각 바람속성 MATK ${80 + lv * 20}% (가장 넓은 범위)\n${lv * 4}% 확률로 실명 · SP ${56 + lv * 4}`,
});
def({
  id: 'water_ball', name: '물의 구', cls: 'wizard', maxLv: 5, kind: 'bolt', auto: 'attack', fx: 'waterball', magic: true, element: 'water',
  icon: { glyph: 'drop', color: '#4a9aff' }, req: { cold_bolt: 1, lightning_bolt: 1 }, range: 210,
  sp: T([15, 20, 20, 25, 25]), hits: T([1, 8, 8, 24, 24]), mult: L((lv) => 100 + lv * 30), cast: L((lv) => lv * 500), delay: fixed(600),
  desc: (lv) => `물을 끌어올려 물방울을 쏩니다. 각 물속성 MATK ${100 + lv * 30}%\n물가 맵(호수·해변·늪·수로·바다·수도원)에서는 ${T([1, 8, 8, 24, 24])(lv)}발, 마른 땅에서는 1발\n시전 ${(lv * 0.5).toFixed(1)}초 · SP ${T([15, 20, 20, 25, 25])(lv)}`,
});
def({
  id: 'ice_wall', name: '얼음 벽', cls: 'wizard', maxLv: 10, kind: 'ground', auto: 'cc', fx: 'icewall', element: 'water',
  icon: { glyph: 'ice', color: '#bfefff' }, req: { stone_curse: 1, frost_diver: 1 }, range: 210, sp: fixed(20), delay: fixed(400), maxActive: 2,
  ground: { r: fixed(55), dur: L((lv) => (4 + lv * 4) * 1000), shape: 'line', where: 'between' },
  desc: (lv) => `다섯 칸짜리 얼음 벽. 몬스터가 지나가지 못합니다 (${4 + lv * 4}초).\n방치형: 후열에게 달려드는 몬스터 앞을 막습니다.\nSP 20`,
});
def({
  id: 'frost_nova', name: '서리 폭발', cls: 'wizard', maxLv: 10, kind: 'selfAoe', auto: 'cc', fx: 'frost', magic: true, element: 'water', req: { ice_wall: 1 },
  icon: { glyph: 'snow', color: '#e0f8ff' }, radius: 60,
  sp: L((lv) => 47 - lv * 2), hits: fixed(1), mult: L((lv) => 66 + lv * 7), cast: T([3000, 3000, 2750, 2750, 2500, 2500, 2250, 2250, 2000, 2000]), delay: fixed(600),
  status: (lv) => ({ kind: 'freeze', chance: 33 + lv * 5, dur: lv * 1500 }),
  desc: (lv) => `주위(5×5)를 얼립니다. 물속성 MATK ${66 + lv * 7}%, ${33 + lv * 5}% 확률로 ${(lv * 1.5).toFixed(1)}초 빙결 (이미 언 적은 피해 없음)\n방치형: 근접 몬스터에게 둘러싸였을 때 씁니다. SP ${47 - lv * 2}`,
});
def({
  id: 'storm_gust', name: '폭풍한설', cls: 'wizard', maxLv: 10, kind: 'ground', auto: 'aoe', fx: 'gust', magic: true, element: 'water',
  icon: { glyph: 'snow', color: '#9fe8ff' }, req: { frost_diver: 1, jupitel: 3 }, range: 220, radius: 100, knock: fixed(2),
  sp: fixed(78), mult: L((lv) => 100 + lv * 40), cast: L((lv) => 3000 + lv * 200), delay: fixed(2500),
  ground: { r: fixed(100), dur: fixed(4600), every: 460, charges: fixed(10), where: 'target' },
  desc: (lv) => `눈보라 (9×9). 0.5초마다 최대 10타, 각 물속성 MATK ${100 + lv * 40}%, 2칸 밀침\n세 번 맞은 적은 얼어붙고 더는 피해를 받지 않습니다 (불사·MVP 제외).\nSP 78`,
});
def({
  id: 'earth_spike', name: '대지 가시', cls: 'wizard', maxLv: 5, kind: 'bolt', auto: 'attack', fx: 'spike', magic: true, element: 'earth', req: { stone_curse: 1 },
  icon: { glyph: 'claw', color: '#c0a070' }, range: 210,
  sp: L((lv) => 10 + lv * 2), hits: L((lv) => lv), mult: fixed(100), cast: L((lv) => lv * 350), delay: L((lv) => 600 + lv * 120),
  desc: (lv) => `땅에서 가시 ${lv}개. 각 땅속성 MATK 100%\n시전 ${(lv * 0.35).toFixed(2)}초 · SP ${10 + lv * 2}`,
});
def({
  id: 'heavens_drive', name: '대지 진동', cls: 'wizard', maxLv: 5, kind: 'aoe', auto: 'aoe', fx: 'spike', magic: true, element: 'earth', req: { earth_spike: 3 },
  icon: { glyph: 'claw', color: '#e0b060' }, range: 210, radius: 60, reveal: fixed(60),
  sp: L((lv) => 24 + lv * 4), hits: L((lv) => lv), mult: fixed(100), cast: L((lv) => lv * 500), delay: fixed(600),
  desc: (lv) => `대상 지역(5×5)에 가시 ${lv}번. 각 땅속성 MATK 100%. 숨은 적도 맞습니다.\nSP ${24 + lv * 4}`,
});
def({
  id: 'quagmire', name: '늪', cls: 'wizard', maxLv: 5, kind: 'ground', auto: 'cc', fx: 'quagmire', element: 'earth', req: { heavens_drive: 1 },
  icon: { glyph: 'drop', color: '#8a6a3a' }, range: 210, sp: L((lv) => lv * 5), delay: fixed(600), maxActive: 3,
  ground: { r: fixed(60), dur: L((lv) => lv * 5000), every: 250, where: 'target' },
  desc: (lv) => `대상 지역(5×5)을 늪으로. 안의 적은 AGI·DEX -${lv * 10}%, 이동 속도 -50% (${lv * 5}초, 보스 제외)\nSP ${lv * 5}`,
});
def({
  id: 'sense', name: '간파', cls: 'wizard', maxLv: 1, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'eye2', color: '#c0a0ff' },
  passive: () => ({}),
  desc: () => '몬스터를 꿰뚫어 봅니다. 방치형: 몬스터 정보에 HP·방어·회피와 속성별 피해표가 보이고, 아직 못 잡은 위험 몹의 정체도 드러납니다.',
});
def({
  id: 'sight_blaster', name: '탐지 폭발', cls: 'wizard', maxLv: 1, kind: 'selfBuff', auto: 'buff', fx: 'sight', quest: Q2, element: 'fire', magic: true,
  icon: { glyph: 'fireball', color: '#ffd060' }, sp: fixed(40), cast: fixed(1000), knock: fixed(3),
  buff: { id: 'sblast', name: '탐지 폭발', dur: fixed(120000), bonus: () => ({}) },
  desc: () => '2분간 몸 주위에 불꽃이 돕니다. 처음 다가온 적(2칸)에게 터져 불속성 MATK 100%, 3칸 밀침.\nSP 40 · 위저드 퀘스트',
});
// not classic RO (stage 2, kept): the wizard's old mastery and burst
def({
  id: 'spell_mastery', name: '마력 수련', cls: 'wizard', maxLv: 10, kind: 'passive', auto: 'none', fx: '', extra: true,
  icon: { glyph: 'book', color: '#a080ff' },
  passive: (lv) => ({ matkPct: lv * 2, castPct: lv * 2 }),
  desc: (lv) => `MATK +${lv * 2}%, 시전 시간 -${lv * 2}%`,
});
def({
  id: 'mystic_amp', name: '마력 증폭', cls: 'wizard', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'amp', extra: true,
  icon: { glyph: 'spirit', color: '#d080ff' }, sp: L((lv) => 18 + lv * 2), cd: fixed(25000),
  buff: { id: 'amp', name: '마력 증폭', dur: fixed(15000), bonus: (lv) => ({ matkPct: lv * 5 }) },
  desc: (lv) => `15초간 MATK +${lv * 5}% (재사용 25초)`,
});

// ───────── Hunter
def({
  id: 'beast_bane', name: '짐승 사냥', cls: 'hunter', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'arrows', color: '#c8a060' },
  passive: (lv) => ({ raceAtk: { brute: lv * 4, insect: lv * 4 } }),
  desc: (lv) => `동물·곤충형을 칠 때 공격력 +${lv * 4} (방어 무시)`,
});
def({
  id: 'falcon_eyes', name: '매 길들이기', cls: 'hunter', maxLv: 1, kind: 'passive', auto: 'none', fx: '', req: { beast_bane: 1 },
  icon: { glyph: 'bird', color: '#d0a060' },
  passive: () => ({}),
  desc: () => '매와 함께 다닙니다. 평타마다 LUK×0.3% 확률로 매가 덮칩니다 (오토 블리츠, 블리츠 비트 필요).\n오토 블리츠 타수 = ⌊(직업 레벨−1)/10⌋+1 (블리츠 비트 레벨까지)',
});
def({
  id: 'blitz_beat', name: '블리츠 비트', cls: 'hunter', maxLv: 5, kind: 'bolt', auto: 'attack', fx: 'falcon', element: 'neutral',
  icon: { glyph: 'bird', color: '#ffb84a' }, req: { falcon_eyes: 1 }, range: 220,
  sp: L((lv) => 7 + lv * 3), hits: L((lv) => lv), cast: fixed(800), delay: fixed(900),
  fixed: (_lv, c) => blitzPer(c),
  desc: (lv) => `매가 ${lv}연속 급강하. 각 (DEX/10 + INT/2 + 강철 발톱×3 + 40)×2 고정 피해 (방어 무시)\nSP ${7 + lv * 3}`,
});
def({
  id: 'steel_crow', name: '강철 발톱', cls: 'hunter', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'claw', color: '#c0c8d8' }, req: { blitz_beat: 5 },
  passive: () => ({}),
  desc: (lv) => `매 공격 1회당 피해 +${lv * 6}`,
});
def({
  id: 'detect', name: '탐지', cls: 'hunter', maxLv: 4, kind: 'selfBuff', auto: 'support', fx: 'sight', req: { improve_conc: 1, falcon_eyes: 1 },
  icon: { glyph: 'bird', color: '#a0d0ff' }, sp: fixed(8), reveal: L((lv) => (1 + lv * 2) * CELL),
  buff: { id: 'detect', name: '탐지', dur: fixed(4000), bonus: () => ({}) },
  desc: (lv) => `매가 주위(${1 + lv * 2}칸)를 훑어 숨은 몬스터와 덫을 드러냅니다.\nSP 8`,
});
/** one falcon dive (RO): (DEX/10 + INT/2 + steel crow×3 + 40)×2 — 맹금의 지혜 raises the INT part */
export function blitzPer(c: FixedCtx): number {
  return Math.floor((c.dex / 10 + c.int / 2 * (1 + (c.skills.raptor_wisdom ?? 0) * 0.08) + (c.skills.steel_crow ?? 0) * 3 + 40) * 2);
}
const TRAP = (n: number) => ({ id: 'k_trap', n });
const trapDesc = (n: number) => `덫 ${n}개`;
def({
  id: 'skid_trap', name: '미끄럼 덫', cls: 'hunter', maxLv: 5, kind: 'trap', auto: 'cc', fx: 'trap', catalyst: TRAP(1), range: 160, maxActive: 3,
  icon: { glyph: 'sand', color: '#d0e0ff' }, sp: fixed(10), delay: fixed(400), knock: L((lv) => 5 + lv),
  ground: { r: fixed(18), dur: fixed(40000), where: 'between' },
  desc: (lv) => `밟은 적을 ${5 + lv}칸 미끄러뜨립니다 (보스·식물 제외).\n${trapDesc(1)} · SP 10`,
});
def({
  id: 'land_mine', name: '지뢰', cls: 'hunter', maxLv: 5, kind: 'trap', auto: 'attack', fx: 'trap', element: 'earth', catalyst: TRAP(1), range: 160, maxActive: 3,
  icon: { glyph: 'burst', color: '#c0a070' }, sp: fixed(10), delay: fixed(400), hits: fixed(1),
  fixed: (lv, c) => Math.floor((c.dex + 75) * (1 + c.int / 100) * lv),
  status: (lv) => ({ kind: 'stun', chance: 30 + lv * 5, dur: 3000 }),
  ground: { r: fixed(14), dur: fixed(40000), where: 'target' },
  desc: (lv) => `밟은 적에게 땅속성 (DEX+75)×(1+INT/100)×${lv} 고정 피해, ${30 + lv * 5}% 확률로 기절\n${trapDesc(1)} · SP 10`,
});
def({
  id: 'ankle_snare', name: '앵클 스네어', cls: 'hunter', maxLv: 5, kind: 'trap', auto: 'cc', fx: 'snare', catalyst: TRAP(1), range: 160, maxActive: 3, req: { skid_trap: 1 },
  icon: { glyph: 'sand', color: '#a0c070' }, sp: fixed(12), delay: fixed(400),
  ground: { r: fixed(16), dur: fixed(40000), where: 'between' },
  desc: (lv) => `밟은 적을 묶습니다: ${lv * 5}/(대상 AGI×0.1)초, 최소 3초 (보스는 1/5)\n${trapDesc(1)} · SP 12`,
});
def({
  id: 'shockwave_trap', name: '충격파 덫', cls: 'hunter', maxLv: 5, kind: 'trap', auto: 'cc', fx: 'trap', catalyst: TRAP(2), range: 160, maxActive: 3, req: { ankle_snare: 1 },
  icon: { glyph: 'bolt', color: '#a0a0ff' }, sp: fixed(45), delay: fixed(400),
  ground: { r: fixed(36), dur: fixed(40000), where: 'target' },
  desc: (lv) => `밟은 적과 주위(3×3)의 기력을 ${5 + lv * 15}% 빼앗습니다.\n방치형: 몬스터 스킬의 재사용 대기 +${5 + lv * 15}%\n${trapDesc(2)} · SP 45`,
});
def({
  id: 'sandman', name: '수면 덫', cls: 'hunter', maxLv: 5, kind: 'trap', auto: 'cc', fx: 'trap', catalyst: TRAP(1), range: 160, maxActive: 3, req: { flasher: 1 },
  icon: { glyph: 'spirit', color: '#c0b0ff' }, sp: fixed(12), delay: fixed(400),
  status: (lv) => ({ kind: 'sleep', chance: 40 + lv * 10, dur: 12000 }),
  ground: { r: fixed(50), dur: fixed(40000), where: 'target' },
  desc: (lv) => `터지면 주위(5×5)를 ${40 + lv * 10}% 확률로 재웁니다 (12초, 맞으면 깸, 보스 제외).\n${trapDesc(1)} · SP 12`,
});
def({
  id: 'flasher', name: '섬광 덫', cls: 'hunter', maxLv: 5, kind: 'trap', auto: 'cc', fx: 'trap', catalyst: TRAP(2), range: 160, maxActive: 3, req: { skid_trap: 1 },
  icon: { glyph: 'sun', color: '#ffffa0' }, sp: fixed(12), delay: fixed(400),
  status: (lv) => ({ kind: 'blind', chance: 100, dur: 6000 + lv * 2000 }),
  ground: { r: fixed(36), dur: fixed(40000), where: 'target' },
  desc: (lv) => `터지면 주위(3×3)를 실명시킵니다 (${6 + lv * 2}초, 식물·MVP 제외).\n${trapDesc(2)} · SP 12`,
});
def({
  id: 'freezing_trap', name: '빙결 덫', cls: 'hunter', maxLv: 5, kind: 'trap', auto: 'aoe', fx: 'trap', element: 'water', catalyst: TRAP(2), range: 160, maxActive: 3, req: { flasher: 1 },
  icon: { glyph: 'ice', color: '#a0e0ff' }, sp: fixed(10), delay: fixed(400), mult: L((lv) => 25 + lv * 25),
  status: (lv) => ({ kind: 'freeze', chance: 100, dur: lv * 3000 }),
  ground: { r: fixed(36), dur: fixed(40000), where: 'target' },
  desc: (lv) => `터지면 주위(3×3)에 물속성 ATK ${25 + lv * 25}%, ${lv * 3}초 빙결 (보스 제외)\n${trapDesc(2)} · SP 10`,
});
def({
  id: 'blast_mine', name: '폭발 지뢰', cls: 'hunter', maxLv: 5, kind: 'trap', auto: 'aoe', fx: 'trap', element: 'wind', catalyst: TRAP(1), range: 160, maxActive: 3,
  icon: { glyph: 'burst', color: '#b0ffb0' }, req: { land_mine: 1, sandman: 1, freezing_trap: 1 }, sp: fixed(10), delay: fixed(400), hits: fixed(1),
  fixed: (lv, c) => Math.floor((50 + c.dex / 2) * (1 + c.int / 100) * lv),
  ground: { r: fixed(36), dur: L((lv) => (30 - lv * 5) * 1000), where: 'target' },
  desc: (lv) => `밟거나 ${30 - lv * 5}초가 지나면 터집니다. 주위(3×3)에 바람속성 (50+DEX/2)×(1+INT/100)×${lv} 고정 피해\n${trapDesc(1)} · SP 10`,
});
def({
  id: 'claymore_trap', name: '클레이모어 트랩', cls: 'hunter', maxLv: 5, kind: 'trap', auto: 'aoe', fx: 'trap', element: 'fire', catalyst: TRAP(2), range: 160, maxActive: 3,
  icon: { glyph: 'burst', color: '#ff6a3d' }, req: { shockwave_trap: 1, blast_mine: 1 }, sp: fixed(15), delay: fixed(400), hits: fixed(1),
  fixed: (lv, c) => Math.floor((75 + c.dex / 2) * (1 + c.int / 100) * lv),
  ground: { r: fixed(60), dur: fixed(40000), where: 'target' },
  desc: (lv) => `밟으면 주위(5×5)에 불꽃 폭발. 불속성 (75+DEX/2)×(1+INT/100)×${lv} 고정 피해\n${trapDesc(2)} · SP 15`,
});
def({
  id: 'remove_trap', name: '덫 회수', cls: 'hunter', maxLv: 1, kind: 'passive', auto: 'none', fx: '', req: { land_mine: 1 },
  icon: { glyph: 'hand', color: '#c0b090' },
  passive: () => ({}),
  desc: () => '터지지 않은 자기 덫을 거둬들입니다. 방치형: 시간이 다 되어 사라지는 덫의 재료를 돌려받습니다.',
});
def({
  id: 'spring_trap', name: '용수철 덫', cls: 'hunter', maxLv: 5, kind: 'passive', auto: 'none', fx: '', req: { remove_trap: 1, falcon_eyes: 1 },
  icon: { glyph: 'bird', color: '#e0c080' },
  passive: () => ({}),
  desc: (lv) => `매가 멀리 있는 덫을 쳐서 터뜨립니다. 방치형: 덫 근처(+${lv}칸)에 몬스터가 오면 매가 덫을 터뜨립니다.`,
});
def({
  id: 'talkie_box', name: '말하는 상자', cls: 'hunter', maxLv: 1, kind: 'passive', auto: 'none', fx: '', req: { shockwave_trap: 1, remove_trap: 1 }, toggle: true,
  icon: { glyph: 'book', color: '#ffe0a0' },
  passive: () => ({}),
  desc: () => '말을 녹음한 작은 상자를 둡니다. (꾸미기) 방치형: 카드나 귀한 장비를 주우면 상자가 그 자리에서 외칩니다.',
});
def({
  id: 'phantasmic', name: '환영의 화살', cls: 'hunter', maxLv: 1, kind: 'ranged', auto: 'attack', fx: 'strafe', quest: Q2, weapon: ['bow'], knock: fixed(3),
  icon: { glyph: 'arrows', color: '#d0a0ff' }, sp: fixed(10), hits: fixed(1), mult: fixed(150), delay: fixed(500),
  desc: () => '화살 없이 쏘는 환영의 화살. ATK 150%, 3칸 밀침\n(활 필요) SP 10 · 헌터 퀘스트',
});

// ───────── Priest
spRec('pr_sp_recovery', 'priest');
def({
  id: 'mace_mastery', name: '둔기 수련', cls: 'priest', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'mace', color: '#e0c080' },
  passive: (lv, w) => (w === 'mace' ? { masteryAtk: lv * 3 } : {}),
  desc: (lv) => `둔기 장착 시 수련 공격력 +${lv * 3} (방어 무시)`,
});
def({
  id: 'impositio', name: '성스러운 손길', cls: 'priest', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'angelus',
  icon: { glyph: 'hand', color: '#ffd080' }, range: 220, sp: L((lv) => 10 + lv * 3), delay: fixed(1500),
  buff: { id: 'impositio', name: '성스러운 손길', ally: true, dur: fixed(60000), bonus: (lv) => ({ atk: lv * 5 }) },
  desc: (lv) => `동료 한 명의 무기 공격력 +${lv * 5} (60초)\nSP ${10 + lv * 3}`,
});
def({
  id: 'suffragium', name: '기도', cls: 'priest', maxLv: 3, kind: 'buff', auto: 'buff', fx: 'blessing', req: { impositio: 2 },
  icon: { glyph: 'book', color: '#fff0c0' }, range: 220, sp: fixed(8), delay: fixed(1000),
  buff: { id: 'suffragium', name: '기도', ally: true, dur: L((lv) => (40 - lv * 10) * 1000), bonus: (lv) => ({ castPct: lv * 15 }) },
  desc: (lv) => `다른 동료가 다음에 외우는 주문 하나의 시전 시간 -${lv * 15}% (${40 - lv * 10}초)\nSP 8`,
});
def({
  id: 'aspersio', name: '성수 세례', cls: 'priest', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'blessing', req: { aqua_benedicta: 1, impositio: 3 },
  icon: { glyph: 'drop', color: '#fff8d0' }, range: 220, sp: L((lv) => 10 + lv * 4), delay: fixed(1000), catalyst: { id: 'k_holywater', n: 1 },
  buff: { id: 'aspersio', name: '성수 세례', ally: true, dur: L((lv) => (30 + lv * 30) * 1000), bonus: () => ({ weaponElement: 'holy' }) },
  desc: (lv) => `동료 한 명의 무기를 ${30 + lv * 30}초간 성속성으로.\n방치형: 불사·암흑 몬스터와 싸울 때 물리 딜러에게.\n성수 1 · SP ${10 + lv * 4}`,
});
def({
  id: 'sacrament', name: '성체 강복', cls: 'priest', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'angelus', req: { gloria: 3, aspersio: 5 },
  icon: { glyph: 'shield', color: '#fffbe0' }, range: 220, sp: fixed(20), delay: fixed(1000),
  buff: { id: 'sacrament', name: '성체 강복', party: true, dur: L((lv) => lv * 40000), bonus: () => ({ armorElement: 'holy' }) },
  desc: (lv) => `파티 전원의 갑옷을 ${lv * 40}초간 성속성으로 (성·암흑 공격에 강함).\n방치형: 그런 몬스터에게 맞을 때.\nSP 20`,
});
def({
  id: 'sanctuary', name: '성역', cls: 'priest', maxLv: 10, kind: 'ground', auto: 'heal', fx: 'sanctuary', element: 'holy', req: { heal: 1 },
  icon: { glyph: 'cross', color: '#a0ffb0' }, range: 210, catalyst: { id: 'k_bluegem', n: 1 }, maxActive: 1, knock: fixed(2),
  sp: L((lv) => 12 + lv * 3), cast: fixed(2500), delay: fixed(600),
  ground: { r: fixed(60), dur: L((lv) => 3900 + (lv - 1) * 3000), every: 1000, charges: L((lv) => 6 + lv * 2), where: 'ally' },
  desc: (lv) => `5×5 성역. 1초마다 안의 동료 HP +${T([100, 200, 300, 400, 500, 600, 777, 777, 777, 777])(lv)} (${(3.9 + (lv - 1) * 3).toFixed(1)}초, ${6 + lv * 2}번까지).\n불사·악마는 그 절반만큼 성 피해를 입고 밀려납니다.\n푸른 마석 1 · SP ${12 + lv * 3}`,
});
def({
  id: 'slow_poison', name: '해독 지연', cls: 'priest', maxLv: 4, kind: 'cure', auto: 'support', fx: 'heal',
  icon: { glyph: 'poison', color: '#c0ffc0' }, range: 220, sp: L((lv) => 4 + lv * 2), delay: fixed(400),
  desc: (lv) => `중독된 동료의 독 피해를 ${lv * 10}초간 멈춥니다.\nSP ${4 + lv * 2}`,
});
def({
  id: 'status_recovery', name: '상태 회복', cls: 'priest', maxLv: 1, kind: 'cure', auto: 'support', fx: 'heal',
  icon: { glyph: 'cross', color: '#ffd0a0' }, range: 220, sp: fixed(5), delay: fixed(1000),
  desc: () => '동료의 빙결·석화·기절을 풉니다. 방치형: 저주와 실명도 풉니다.\nSP 5',
});
def({
  id: 'kyrie', name: '수호의 장막', cls: 'priest', maxLv: 10, kind: 'buff', auto: 'buff', fx: 'kyrie', req: { angelus: 2 },
  icon: { glyph: 'shield', color: '#bfe8ff' }, range: 220,
  sp: T([20, 20, 20, 25, 25, 25, 30, 30, 30, 35]), cast: fixed(1000), delay: fixed(1000),
  buff: { id: 'kyrie', name: '수호의 장막', ally: true, dur: fixed(120000), bonus: () => ({}), shieldPct: (lv) => 10 + lv * 2, shieldHits: (lv) => 5 + Math.floor(lv / 2) },
  desc: (lv) => `동료 한 명에게 최대 HP의 ${10 + lv * 2}%만큼, 또는 ${5 + Math.floor(lv / 2)}번까지 피해를 막는 보호막 (2분)\n방치형: 몬스터에게 맞는 동료(탱커 우선)에게.\nSP ${T([20, 20, 20, 25, 25, 25, 30, 30, 30, 35])(lv)}`,
});
def({
  id: 'magnificat', name: '영혼의 찬가', cls: 'priest', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'blessing',
  icon: { glyph: 'drop', color: '#8ab8ff' }, range: 220, sp: fixed(40), cast: fixed(2000), delay: fixed(1000),
  buff: { id: 'magnificat', name: '영혼의 찬가', party: true, dur: L((lv) => 15000 + lv * 15000), bonus: () => ({ spRegenPct: 100, hpRegenPct: 100 }) },
  desc: (lv) => `파티 전원 ${15 + lv * 15}초간 HP·SP 자연 회복 2배\n시전 2초 · SP 40`,
});
def({
  id: 'gloria', name: '영광송', cls: 'priest', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'blessing',
  icon: { glyph: 'sun', color: '#ffe680' }, req: { kyrie: 4, magnificat: 3 }, range: 220, sp: fixed(20), delay: fixed(1000),
  buff: { id: 'gloria', name: '영광송', party: true, dur: L((lv) => 5000 + lv * 5000), bonus: () => ({ luk: 30 }) },
  desc: (lv) => `파티 전원 ${5 + lv * 5}초간 LUK +30\nSP 20`,
});
def({
  id: 'lex_divina', name: '침묵의 율법', cls: 'priest', maxLv: 10, kind: 'debuff', auto: 'cc', fx: 'lex', req: { ruwach: 1 },
  icon: { glyph: 'book', color: '#c0c0ff' }, range: 120, sp: T([20, 20, 20, 20, 20, 18, 16, 14, 12, 10]), delay: fixed(1500),
  status: (lv) => ({ kind: 'silence', chance: 85, dur: T([30, 35, 40, 45, 50, 60, 60, 60, 60, 60])(lv) * 1000 }),
  desc: (lv) => `대상을 침묵시켜 스킬을 못 쓰게 합니다 (${T([30, 35, 40, 45, 50, 60, 60, 60, 60, 60])(lv)}초, 보스 제외).\n방치형: 스킬을 쓰는 몬스터에게.\nSP ${T([20, 20, 20, 20, 20, 18, 16, 14, 12, 10])(lv)}`,
});
def({
  id: 'turn_undead', name: '정화', cls: 'priest', maxLv: 10, kind: 'bolt', auto: 'attack', fx: 'holy', magic: true, element: 'holy', req: { resurrection: 1, lex_divina: 3 },
  icon: { glyph: 'cross', color: '#ffffff' }, range: 120, sp: fixed(20), cast: fixed(500), delay: fixed(1500), hits: fixed(1),
  desc: (lv) => `불사 속성 몬스터를 단숨에 정화합니다. 확률 (${lv * 20} + LUK + INT + 베이스 레벨 + (1−HP 비율)×200)/10%, 최대 70%\n실패하면 성속성 (베이스 레벨 + INT + ${lv * 10}) 피해. 보스는 정화되지 않습니다.\nSP 20`,
});
def({
  id: 'lex_aeterna', name: '영원의 율법', cls: 'priest', maxLv: 1, kind: 'debuff', auto: 'cc', fx: 'lex', req: { lex_divina: 5 },
  icon: { glyph: 'book', color: '#ff80a0' }, range: 210, sp: fixed(10), delay: fixed(1500),
  desc: () => '대상이 다음에 받는 피해 한 번(스킬은 그 스킬 전체)이 두 배가 됩니다.\n방치형: 보스·정예·위험 몹에게 큰 공격 직전에. SP 10',
});
def({
  id: 'magnus', name: '대퇴마', cls: 'priest', maxLv: 10, kind: 'ground', auto: 'aoe', fx: 'magnus', magic: true, element: 'holy', undeadOnly: true,
  icon: { glyph: 'cross', color: '#fff3a0' }, req: { pr_safety_wall: 1, lex_aeterna: 1, turn_undead: 3 }, range: 220, radius: 80, catalyst: { id: 'k_bluegem', n: 1 },
  sp: L((lv) => 38 + lv * 2), mult: L((lv) => lv * 100), cast: L((lv) => 2000 + lv * 250), delay: fixed(2200), maxActive: 1,
  ground: { r: fixed(80), dur: L((lv) => (Math.floor((4 + lv) / 3) + 1) * 1500 - 100), every: 1500, where: 'target' },
  desc: (lv) => `7×7 성스러운 십자가 결계. 1.5초마다 한 파, 파마다 성속성 MATK 100% × ${lv}타 (${Math.floor((4 + lv) / 3) + 1}파)\n불사 속성·악마형만 맞습니다.\n푸른 마석 1 · SP ${38 + lv * 2}`,
});
def({
  id: 'resurrection', name: '부활', cls: 'priest', maxLv: 4, kind: 'revive', auto: 'revive', fx: 'revive', range: 260,
  icon: { glyph: 'wing', color: '#fff3a0' }, req: { status_recovery: 1, pr_sp_recovery: 4 }, catalyst: { id: 'k_bluegem', n: 1 },
  sp: fixed(60), cast: L((lv) => [6000, 4000, 2000, 400][lv - 1]), delay: L((lv) => [0, 500, 1000, 1500][lv - 1]),
  revivePct: (lv) => [10, 30, 50, 80][lv - 1],
  desc: (lv) => `쓰러진 동료를 HP ${[10, 30, 50, 80][lv - 1]}%로 일으킵니다. 시전 ${[6, 4, 2, 0.4][lv - 1]}초\n푸른 마석 1 · SP 60`,
});
safetyWall('pr_safety_wall', 'priest', { aspersio: 4, sanctuary: 3 });
def({
  id: 'redemptio', name: '속죄', cls: 'priest', maxLv: 1, kind: 'revive', auto: 'revive', fx: 'revive', quest: Q2,
  icon: { glyph: 'wing', color: '#ffb0b0' }, sp: fixed(400), cast: fixed(2000), delay: fixed(1000),
  desc: () => '자신을 바쳐 쓰러진 동료 모두를 HP 50%로 일으킵니다. 자신은 쓰러집니다.\n방치형: 동료 둘 이상이 쓰러졌을 때. SP 400 · 프리스트 퀘스트',
});

// ───────── Assassin
def({
  id: 'katar_mastery', name: '카타르 수련', cls: 'assassin', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'dagger2', color: '#c080ff' },
  passive: (lv, w) => (w === 'katar' ? { masteryAtk: lv * 3 } : {}),
  desc: (lv) => `카타르 장착 시 수련 공격력 +${lv * 3} (방어 무시). (카타르는 크리티컬 확률 2배)`,
});
def({
  id: 'right_hand', name: '오른손 수련', cls: 'assassin', maxLv: 5, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'sword', color: '#d0a0ff' },
  passive: () => ({}),
  desc: (lv) => `양손에 무기를 들었을 때 오른손 피해 ${50 + lv * 10}% (기본 50%). 카타르 제외`,
});
def({
  id: 'left_hand', name: '왼손 수련', cls: 'assassin', maxLv: 5, kind: 'passive', auto: 'none', fx: '', req: { right_hand: 2 },
  icon: { glyph: 'sword', color: '#a080d0' },
  passive: () => ({}),
  desc: (lv) => `양손에 무기를 들었을 때 왼손 피해 ${30 + lv * 10}% (기본 30%). 카타르 제외\n왼손 무기는 장비 창의 방패 칸(왼손)에 단검·한손검·도끼를 끼웁니다.`,
});
def({
  id: 'cloaking', name: '은신 이동', cls: 'assassin', maxLv: 10, kind: 'selfBuff', auto: 'support', fx: 'hide', req: { hiding: 2 },
  icon: { glyph: 'spirit', color: '#6a5a90' }, sp: fixed(15),
  buff: { id: 'cloak', name: '은신 이동', dur: fixed(600000), bonus: (lv) => ({ moveSpd: lv >= 3 ? -21 + (lv - 3) * 3 : -30 }) },
  desc: (lv) => `모습을 감춘 채 움직입니다 (${T([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9])(lv)}초마다 SP 1). 곤충·악마·보스가 아닌 몬스터는 찾지 못합니다.\n평타를 치면 풀립니다. 그림자 송곳니는 은신 중에만 쓸 수 있습니다.\nSP 15`,
});
def({
  id: 'sonic_blow', name: '음속 연격', cls: 'assassin', maxLv: 10, kind: 'melee', auto: 'attack', fx: 'sonic',
  icon: { glyph: 'dagger2', color: '#ff5a8a' }, req: { katar_mastery: 4 }, weapon: ['katar'],
  sp: L((lv) => 14 + lv * 2), hits: fixed(8), mult: L((lv) => (400 + lv * 40) / 8), delay: fixed(900),
  status: (lv) => ({ kind: 'stun', chance: 10 + lv * 2, dur: 3000 }),
  desc: (lv) => `눈에 보이지 않는 8연타. 총 ATK ${400 + lv * 40}%, ${10 + lv * 2}% 확률로 기절 (카타르 필요)\nSP ${14 + lv * 2}`,
});
def({
  id: 'grimtooth', name: '그림자 송곳니', cls: 'assassin', maxLv: 5, kind: 'aoe', auto: 'aoe', fx: 'grimtooth', radius: 36, needs: 'hidden',
  icon: { glyph: 'claw', color: '#8a5ad0' }, req: { cloaking: 2, sonic_blow: 5 }, weapon: ['katar'], range: 0,
  sp: fixed(3), mult: L((lv) => 100 + lv * 20), delay: fixed(300),
  desc: (lv) => `숨은 채로 땅 밑에서 칼날을 솟구칩니다. ATK ${100 + lv * 20}% (3×3), 사거리 ${2 + lv}칸\n하이딩·은신 이동 중에만 (쓴 뒤에도 숨은 채) · 카타르 필요 · SP 3`,
});
def({
  id: 'enchant_poison', name: '맹독 부여', cls: 'assassin', maxLv: 10, kind: 'buff', auto: 'buff', fx: 'poisonbuff', req: { envenom: 1 },
  icon: { glyph: 'poison', color: '#b070e0' }, sp: fixed(20), range: 40, delay: fixed(500),
  buff: { id: 'edp', name: '맹독 부여', dur: L((lv) => 15000 + lv * 15000), bonus: (lv) => ({ weaponElement: 'poison', procs: [{ on: 'attack', chance: 2.5 + lv * 0.5, status: { kind: 'poison', dur: 10000 }, tag: 'edp' }] }) },
  desc: (lv) => `${15 + lv * 15}초간 무기를 독속성으로. 평타마다 ${(2.5 + lv * 0.5).toFixed(1)}% 확률로 중독\nSP 20`,
});
def({
  id: 'poison_react', name: '독 반격', cls: 'assassin', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'poisonbuff', req: { enchant_poison: 3 },
  icon: { glyph: 'poison', color: '#e070b0' }, sp: T([25, 30, 35, 40, 45, 50, 55, 60, 45, 45]),
  buff: { id: 'preact', name: '독 반격', dur: L((lv) => (15 + lv * 5) * 1000), bonus: () => ({}) },
  desc: (lv) => `${15 + lv * 5}초간: 독속성 근접 공격을 받으면 ATK ${100 + lv * 30}% 독속성으로 되받아칩니다.\n다른 근접 공격엔 50% 확률로 맹독 반격 (최대 ${T([1, 1, 2, 2, 3, 3, 4, 4, 5, 6])(lv)}번).\nSP ${T([25, 30, 35, 40, 45, 50, 55, 60, 45, 45])(lv)}`,
});
def({
  id: 'venom_dust', name: '독 안개', cls: 'assassin', maxLv: 10, kind: 'ground', auto: 'aoe', fx: 'venomdust', element: 'poison', req: { enchant_poison: 5 },
  icon: { glyph: 'poison', color: '#9a50d0' }, range: 50, catalyst: { id: 'k_redgem', n: 1 }, sp: fixed(20), delay: fixed(500), maxActive: 2,
  ground: { r: fixed(36), dur: L((lv) => lv * 5000), every: 500, where: 'target' },
  desc: (lv) => `발밑에 독 안개 (${lv * 5}초). 들어선 적은 중독됩니다 (불사·보스 제외).\n붉은 마석 1 · SP 20`,
});
def({
  id: 'venom_splasher', name: '독 폭발', cls: 'assassin', maxLv: 10, kind: 'debuff', auto: 'aoe', fx: 'splasher', element: 'poison', req: { poison_react: 5, venom_dust: 5 },
  icon: { glyph: 'burst', color: '#c050ff' }, range: 40, catalyst: { id: 'k_redgem', n: 1 }, split: true, radius: 60,
  sp: L((lv) => 10 + lv * 2), mult: L((lv) => 500 + lv * 50), cast: fixed(500), delay: fixed(500), cd: L((lv) => Math.round((7 + lv * 0.5) * 600)),
  desc: (lv) => `중독되어 HP가 3/4 아래인 적에게 독 폭탄을 심습니다. ${((4.5 + lv * 0.5) / 2).toFixed(2)}초 뒤 주위(5×5)에 ATK ${500 + lv * 50}% (맞은 수로 나눔, 회피 무시). 보스 제외\n붉은 마석 1 · SP ${10 + lv * 2}`,
});
def({
  id: 'sonic_accel', name: '음속 가속', cls: 'assassin', maxLv: 1, kind: 'passive', auto: 'none', fx: '', quest: Q2,
  icon: { glyph: 'dagger2', color: '#ffa0c0' },
  passive: () => ({ skillDmg: { sonic_blow: 10 } }),
  desc: () => '음속 연격의 명중 +50%, 피해 +10%\n어새신 퀘스트',
});
def({
  id: 'venom_knife', name: '독 단검 던지기', cls: 'assassin', maxLv: 1, kind: 'ranged', auto: 'attack', fx: 'strafe', element: 'poison', quest: Q2,
  icon: { glyph: 'dagger2', color: '#a0e080' }, weapon: ['dagger'], range: 198, sp: fixed(15), hits: fixed(1), mult: fixed(100), delay: fixed(500),
  desc: () => '독 묻은 단검을 던집니다. 독속성 ATK 100%, 높은 확률로 중독. 사거리 9칸\n(단검 필요) SP 15 · 어새신 퀘스트',
});
def({
  id: 'shadow_step', name: '그림자 걸음', cls: 'assassin', maxLv: 10, kind: 'passive', auto: 'none', fx: '', extra: true,
  icon: { glyph: 'wind', color: '#8a7ab0' },
  passive: (lv) => ({ flee: lv * 2, pdodge: Math.floor(lv / 2), moveSpd: lv * 2 }),
  desc: (lv) => `FLEE +${lv * 2}, 완전 회피 +${Math.floor(lv / 2)}, 이동 속도 +${lv * 2}%`,
});

// ───────── Blacksmith — unchanged (excluded from the RO alignment by the user)
def({
  id: 'weaponry_research', name: '무기 연구', cls: 'blacksmith', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'mace', color: '#d0a070' },
  passive: (lv) => ({ atk: lv * 2, hit: lv * 2 }),
  desc: (lv) => `ATK +${lv * 2}, 명중 +${lv * 2}`,
});
def({
  id: 'adrenaline', name: '아드레날린 러쉬', cls: 'blacksmith', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'adrenaline',
  icon: { glyph: 'heart', color: '#ff6a3a' }, range: 220, sp: L((lv) => 20 + lv * 3), delay: fixed(500),
  buff: { id: 'adrenaline', name: '아드레날린', party: true, dur: L((lv) => lv * 30000), bonus: (lv) => ({ aspdPct: 20 + lv * 2 }) },
  desc: (lv) => `파티 전원 ${lv * 30}초간 공격 속도 +${20 + lv * 2}%`,
});
def({
  id: 'weapon_perfection', name: '무기 완벽화', cls: 'blacksmith', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'adrenaline',
  icon: { glyph: 'sword', color: '#ffe080' }, req: { weaponry_research: 2, adrenaline: 2 }, range: 220, sp: L((lv) => 18 - lv), delay: fixed(500),
  buff: { id: 'perfection', name: '무기 완벽화', party: true, dur: L((lv) => lv * 20000), bonus: () => ({ ignoreSize: 1 }) },
  desc: (lv) => `파티 전원 ${lv * 20}초간 무기 크기 보정 무시 (모든 크기에 100%)`,
});
def({
  id: 'over_thrust', name: '과신', cls: 'blacksmith', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'adrenaline',
  icon: { glyph: 'flame', color: '#ff9a3a' }, req: { adrenaline: 2 }, range: 220, sp: L((lv) => 14 + lv * 4), delay: fixed(500),
  buff: { id: 'overthrust', name: '과신', party: true, dur: L((lv) => lv * 20000), bonus: (lv) => ({ atkPct: lv * 5 }) },
  desc: (lv) => `파티 전원 ${lv * 20}초간 물리 피해 +${lv * 5}%`,
});
def({
  id: 'hammer_fall', name: '해머 낙하', cls: 'blacksmith', maxLv: 5, kind: 'aoe', auto: 'aoe', fx: 'hammer', radius: 64,
  icon: { glyph: 'hammer', color: '#c0a080' }, weapon: ['axe', 'mace'],
  sp: fixed(10), mult: fixed(100), delay: fixed(700), cd: fixed(3000),
  status: (lv) => ({ kind: 'stun', chance: 20 + lv * 10, dur: 3000 }),
  desc: (lv) => `땅을 내리쳐 주변을 ${20 + lv * 10}% 확률로 기절 (도끼·둔기 필요)`,
});
def({
  id: 'refine_mastery', name: '정련 숙련', cls: 'blacksmith', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'hammer', color: '#ffd24a' },
  passive: () => ({}),
  desc: (lv) => `안전 정련 이후 성공 확률 +${lv}%p (파티 공유)`,
});
def({
  id: 'ore_discovery', name: '광석 탐지', cls: 'blacksmith', maxLv: 5, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'ore', color: '#90b8d8' },
  passive: () => ({}),
  desc: (lv) => `정련석·별철·수호석 드롭률 +${lv * 20}% (파티 공유)`,
});

// ═════════ Build signature skills (docs/design/SKILLS_META.md): one per meta build — two for the flagships (광월 크리,
// 매 한 방, 주먹 매, 몰이 매) — each amplifying its build's core mechanic. Ordinary 2nd-job skills (Lv 1–5) behind the build's
// key skill, so where the points go is the build. Their effects are conditional (DEX ≤ 10, bare hands, a katar, packs…),
// so another build that takes one gains little. Not classic RO: original names, counted apart from the RO trees.
// ───────── Knight
def({
  id: 'moon_art', name: '광월의 극의', cls: 'knight', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'kn_crit',
  icon: { glyph: 'sword2', color: '#ff6a7a', color2: '#ffe0e8' }, req: { twohand_mastery: 5 },
  passive: (lv, _w, c) => (c.base.dex <= 10 ? { critDmgPct: lv * 4 } : {}),
  post: (lv, t) => ({ crit: Math.floor(t.luk / 10) * 0.5 * lv }),
  desc: (lv) => `달이 차오르듯 운이 칼끝에 모입니다.\nLUK 10마다 크리티컬 +${(lv * 0.5).toFixed(1)}\n직접 찍은 DEX가 10 이하이면 크리티컬 피해 +${lv * 4}% — DEX를 버린 크리 기사의 보상\n(크리 저항이 있는 보스에게는 여전히 덜 들어갑니다)`,
});
def({
  id: 'moon_slash', name: '광월참', cls: 'knight', maxLv: 5, kind: 'melee', auto: 'attack', fx: 'moonslash', build: 'kn_crit',
  icon: { glyph: 'sword2', color: '#ffd0f0', color2: '#ff6a7a' }, req: { moon_art: 3 }, weapon: ['sword2h'],
  sp: fixed(18), hits: fixed(3), mult: L((lv) => lv * 15), delay: fixed(450), cd: fixed(8000),
  desc: (lv) => `초승달 세 줄기로 베는 3연타, 각 ATK (${lv * 15} + LUK×3)%\n직접 찍은 DEX가 10 이하이면 모두 확정 크리티컬(회피·방어 무시). 크리 저항이 있는 보스에게는 그만큼 크리가 빗나갑니다.\n운도 버리지 않고 DEX도 버리지 않은 검에는 그저 가벼운 세 번의 칼질\n(양손검 필요) SP 18 · 재사용 8초`,
});
def({
  id: 'gale_step', name: '질풍 보법', cls: 'knight', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'kn_agi',
  icon: { glyph: 'wind', color: '#9af0c0' }, req: { twohand_quicken: 3 },
  passive: (lv, w) => (w === 'sword2h' ? { flee: lv * 3, crit: -lv * 2 } : {}),
  desc: (lv) => `양손검을 든 채 바람처럼 비켜 섭니다.\n양손검 장착 시 FLEE +${lv * 3}, 대신 크리티컬 −${lv * 2} (몸을 빼느라 급소를 노리지 못함)\n공격을 피한 직후 다음 일격(크리티컬이 아닌 타격) +${lv * 16}% (3초 안)`,
});
def({
  id: 'iron_stance', name: '철벽 자세', cls: 'knight', maxLv: 5, kind: 'selfBuff', auto: 'buff', fx: 'endure', build: 'kn_vit',
  icon: { glyph: 'shield', color: '#a8c0e0', color2: '#5a7aa0' }, req: { pierce: 5 }, weapon: ['spear'],
  sp: L((lv) => 8 + lv), cd: fixed(3000),
  buff: { id: 'ironstance', name: '철벽 자세', dur: fixed(120000), bonus: (lv) => ({ def: lv * 4, moveSpd: -5, skillDmg: { pierce: lv * 20 } }) },
  desc: (lv) => `창을 땅에 박고 버티는 자세 (2분).\nDEF +${lv * 4}, 꿰뚫기 피해 +${lv * 20}%, 꿰뚫기 SP −1, 이동 속도 −5%\n(창 필요) SP ${8 + lv}`,
});
def({
  id: 'whirl_cut', name: '소용돌이 베기', cls: 'knight', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'kn_bowl',
  icon: { glyph: 'burst', color: '#ffb060', color2: '#a0b0c0' }, req: { bowling_bash: 5 },
  passive: () => ({}),
  desc: (lv) => `휘두르는 대검이 소용돌이를 일으킵니다.\n회전 강타가 대상 주위(범위 밖 ${Math.round((30 + lv * 12) / 22 * 10) / 10}칸까지)의 적을 끌어당긴 뒤 벱니다\n맞힌 대상이 1명 늘 때마다 피해 +${lv * 6}%, SP ${lv} 회복 (5명까지: 최대 +${lv * 24}%, SP ${lv * 4})`,
});
def({
  id: 'counter_oath', name: '역습의 맹세', cls: 'knight', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'kn_counter',
  icon: { glyph: 'shield', color: '#ff8a7a', color2: '#ffe0a0' }, req: { auto_counter: 3 },
  passive: () => ({}),
  desc: (lv) => `막는 순간이 곧 공격의 순간입니다.\n자세 없이도 근접 공격을 받을 때 ${(lv * 1.4).toFixed(1)}% 확률로 반격 (막고 크리티컬로 되받아침)\n반격의 크리티컬 피해 +${lv * 5}%, 반격당한 적은 10초간 이 기사만 노립니다 (도발)\n(활 제외)`,
});
def({
  id: 'element_shift', name: '속성 전환', cls: 'knight', maxLv: 3, kind: 'selfBuff', auto: 'buff', fx: 'amp', build: 'kn_ele',
  icon: { glyph: 'flame', color: '#c8a0ff', color2: '#7ad0ff' }, req: { magnum_break: 3 },
  sp: T([12, 10, 8]), cd: fixed(2000),
  buff: { id: 'eshift', name: '속성 전환', dur: fixed(60000), bonus: () => ({}) },
  desc: (lv) => `60초간 무기의 속성이 지금 대상의 약점 속성(불·물·땅·바람)으로 저절로 바뀝니다.\n상성 보너스는 ${30 + lv * 10}%까지만 실립니다 (예: 불 → 땅 150% → ${100 + (30 + lv * 10) / 2}%)\n속성 무기 여러 자루를 들고 다니던 속성검 기사의 기술. 약점이 없는 대상에게는 원래 속성 그대로\nSP ${T([12, 10, 8])(lv)}`,
});
def({
  id: 'mana_edge', name: '마력 부여', cls: 'knight', maxLv: 5, kind: 'selfBuff', auto: 'buff', fx: 'amp', build: 'kn_spell',
  icon: { glyph: 'sword', color: '#d0a0ff', color2: '#80c0ff' }, req: { magnum_break: 1 },
  sp: L((lv) => 10 + lv * 2), cd: fixed(2000),
  buff: { id: 'manaedge', name: '마력 부여', dur: L((lv) => 60000 + lv * 24000), bonus: () => ({}) },
  desc: (lv) => `${60 + lv * 24}초간 칼날에 마력을 두릅니다.\n근접 평타나 근접 스킬이 맞으면 무기 속성 마법 추가타 MATK ${30 + lv * 12}% (INT가 높을수록 강함)\nSP ${10 + lv * 2}`,
});
// ───────── Wizard
const BOLT3 = { fire_bolt: 5, cold_bolt: 5, lightning_bolt: 5 };
def({
  id: 'quick_chant', name: '고속 영창', cls: 'wizard', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'wz_intdex',
  icon: { glyph: 'book', color: '#ffd060', color2: '#ff6a3d' }, req: BOLT3,
  passive: () => ({}),
  desc: (lv) => `볼트 주문을 혀끝에 붙여 둡니다.\n화염·냉기·번개 화살의 시전 시간 −${lv * 7}%${lv >= 5 ? '\n5레벨: 볼트가 한 발 더 나갑니다' : '\n(5레벨이 되면 볼트가 한 발 더)'}`,
});
def({
  id: 'storm_eye', name: '폭풍의 눈', cls: 'wizard', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'wz_storm',
  icon: { glyph: 'storm', color: '#9fe8ff', color2: '#ffe45a' }, req: { storm_gust: 3 },
  passive: () => ({}),
  desc: (lv) => `폭풍의 한가운데에서 주문을 넓힙니다.\n광역 마법의 범위 +${lv * 6}%\n한 번에 맞힌 적이 2명을 넘으면 1명마다 피해 +${lv * 2}% (최대 +20%)`,
});
def({
  id: 'frost_thunder', name: '빙뢰 공명', cls: 'wizard', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'wz_freeze',
  icon: { glyph: 'bolt', color: '#bff0ff', color2: '#ffe45a' }, req: { frost_diver: 5 },
  passive: () => ({}),
  desc: (lv) => `얼음 속을 번개가 타고 흐릅니다.\n얼어 있는 대상에게 바람(번개) 마법 피해 +${lv * 15}%, SP −${lv * 8}%, 시전 시간·딜레이 −${lv * 5}%\n그 타격이 근처(5칸)의 다른 얼어 있는 적 1명에게 연쇄합니다`,
});
def({
  id: 'mana_barrier', name: '마력 장벽', cls: 'wizard', maxLv: 5, kind: 'selfBuff', auto: 'buff', fx: 'kyrie', build: 'wz_vit',
  icon: { glyph: 'shield', color: '#80b0ff', color2: '#d080ff' }, req: { energy_coat: 1 },
  sp: L((lv) => 8 + lv * 2), cast: fixed(500), cd: fixed(10000),
  buff: { id: 'mbarrier', name: '마력 장벽', dur: fixed(120000), bonus: () => ({}) },
  desc: (lv) => `SP를 엮어 몸 앞에 장벽을 칩니다 (2분).\n최대 SP의 ${lv * 8}%만큼 피해를 막습니다 (SP가 많을수록 두꺼운 장벽).\n장벽이 버티는 동안 맞아도 시전이 밀리지 않습니다.\nSP ${8 + lv * 2} · 재사용 10초 (방치형: SP가 절반 넘게 남았고 몬스터에게 쫓기거나 HP가 줄었을 때 칩니다)`,
});
def({
  id: 'soul_surge', name: '영혼 폭주', cls: 'wizard', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'wz_soul',
  icon: { glyph: 'spirit', color: '#b8f0ff', color2: '#8060ff' }, req: { soul_strike: 5 },
  passive: () => ({}),
  desc: (lv) => `영혼탄이 넋 있는 것을 알아봅니다.\n염·불사 대상에게 영혼 강타 +${lv >= 3 ? 1 : 0}발 (3레벨부터)\n영혼 강타 SP −${lv * 2}%`,
});
def({
  id: 'elem_resonance', name: '원소 공명', cls: 'wizard', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'wz_elem',
  icon: { glyph: 'drop', color: '#7ad0ff', color2: '#ff8a3d' }, req: { fire_bolt: 3, cold_bolt: 3, lightning_bolt: 3 },
  passive: () => ({}),
  desc: (lv) => `원소가 바뀔 때마다 마력이 공명합니다.\n직전과 다른 속성의 공격 마법을 쓰면 공명 1단계 (최대 3), 단계마다 마법 피해 +${lv * 4}% (최대 +${lv * 12}%)\n같은 속성을 이어 쓰면 공명이 풀립니다. 익히면 AI가 대상의 약점 쪽으로 볼트를 번갈아 씁니다.`,
});
// ───────── Hunter
def({
  id: 'archer_breath', name: '명궁의 호흡', cls: 'hunter', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'hu_dex',
  icon: { glyph: 'arrows', color: '#ffe08a', color2: '#7ad06a' }, req: { double_strafe: 5 },
  passive: (lv, w) => (w === 'bow' ? { skillDmg: { double_strafe: lv * 8 } } : {}),
  post: (_lv, t, w) => (w === 'bow' ? { hit: Math.floor(t.dex / 20), range: Math.floor(t.dex / 20) * 8 } : {}),
  desc: (lv) => `숨을 고르고 두 발을 한 호흡에.\n활 장착 시 이중 사격 피해 +${lv * 8}%\n활 평타가 맞으면 ${(lv * 1.6).toFixed(1)}% 확률로 SP 없이 이중 사격을 함께 쏩니다 (배운 레벨)\nDEX 20마다 사거리 +1칸, 명중 +1`,
});
def({
  id: 'falcon_strike', name: '매의 일격', cls: 'hunter', maxLv: 5, kind: 'bolt', auto: 'attack', fx: 'falconstrike', build: 'hu_intblitz',
  icon: { glyph: 'bird', color: '#ffe080', color2: '#ff6a3d' }, req: { blitz_beat: 3 }, range: 220,
  sp: fixed(12), hits: fixed(1), delay: fixed(700), cd: fixed(5000),
  fixed: (lv, c) => Math.floor(blitzPer(c) * (1.5 + lv * 0.3)),
  desc: (lv) => `매가 한 마리만 노리고 내리꽂힙니다.\n블리츠 비트 한 타 × ${(1.5 + lv * 0.3).toFixed(1)}배의 고정 피해 한 방 (방어·회피 무시, 주변에 퍼지지 않음)\n블리츠 비트 피해 보너스(장비)도 그대로 실립니다. 시전 없이 바로\nSP 12 · 재사용 5초`,
});
def({
  id: 'raptor_wisdom', name: '맹금의 지혜', cls: 'hunter', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'hu_intblitz',
  icon: { glyph: 'book', color: '#d0a060', color2: '#ffe080' }, req: { falcon_strike: 1 },
  passive: () => ({}),
  desc: (lv) => `매에게 사냥의 이치를 가르칩니다.\n블리츠 비트(오토 블리츠·매의 일격 포함)의 INT 계수 +${lv * 8}%\n(INT/2 → INT/2 × ${(1 + lv * 0.08).toFixed(2)})`,
});
def({
  id: 'falcon_bond', name: '매와 한 몸', cls: 'hunter', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'hu_fist',
  icon: { glyph: 'hand', color: '#e0b070', color2: '#ffb84a' }, req: { falcon_eyes: 1 },
  passive: (lv, w) => (w === 'none' ? { autoBlitzPct: lv, unarmedAspdPct: lv * 2 } : {}),
  desc: (lv) => `활을 내려놓은 주먹에 매가 맞춰 날아듭니다.\n맨손일 때만: 오토 블리츠 확률 +${lv}%, 공격 속도 +${lv * 2}%`,
});
def({
  id: 'bare_flurry', name: '맨주먹 연타', cls: 'hunter', maxLv: 3, kind: 'passive', auto: 'none', fx: '', build: 'hu_fist',
  icon: { glyph: 'hand', color: '#ff9a6a', color2: '#ffe080' }, req: { falcon_bond: 3 },
  passive: () => ({}),
  desc: (lv) => `매가 덮치는 틈에 주먹이 몰아칩니다.\n맨손 평타가 오토 블리츠를 일으키면 ${[0.4, 0.6, 0.8][lv - 1]}초간 평타 공격 속도 2배`,
});
def({
  id: 'falcon_circle', name: '매의 선회', cls: 'hunter', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'hu_mob',
  icon: { glyph: 'bird', color: '#ffd84a', color2: '#a0d0ff' }, req: { blitz_beat: 3 },
  passive: () => ({}),
  desc: (lv) => `평타에 맞춰 덮치는 매가 크게 원을 그립니다.\n오토 블리츠(평타로 매가 덮칠 때)의 범위 +${lv * 15}, 범위로 휩쓸린(대상이 아닌) 적에게 피해 +${lv * 15}%`,
});
def({
  id: 'drover_whistle', name: '몰이꾼의 호각', cls: 'hunter', maxLv: 3, kind: 'selfBuff', auto: 'buff', fx: 'provoke', build: 'hu_mob',
  icon: { glyph: 'shout', color: '#ffd84a', color2: '#c89060' }, req: { falcon_circle: 3 },
  sp: fixed(20), cd: fixed(12000), radius: 200,
  buff: { id: 'whistle', name: '몰이꾼의 호각', dur: fixed(10000), bonus: (lv) => ({ dmgReducePct: lv * 10 }) },
  desc: (lv) => `호각을 불어 주위(9칸)의 몬스터를 자신에게 끌어모읍니다.\n10초간 받는 피해 −${lv * 10}%\n방치형: 근처에 몰려올 몹이 둘 이상일 때 씁니다. SP 20 · 재사용 12초`,
});
def({
  id: 'trap_chain', name: '덫 연쇄', cls: 'hunter', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'hu_trap',
  icon: { glyph: 'burst', color: '#ff8a3d', color2: '#d0e0ff' }, req: { claymore_trap: 3 },
  passive: () => ({}),
  desc: (lv) => `덫과 덫 사이에 도화선을 잇습니다.\n덫이 터지면 근처(덫 범위 + 4칸)의 다른 내 덫도 함께 터집니다\n덫 피해 +${lv * 15}%`,
});
def({
  id: 'storm_arrows', name: '폭우의 화살', cls: 'hunter', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'hu_shower',
  icon: { glyph: 'rain', color: '#a0d0ff', color2: '#c8e07a' }, req: { arrow_shower: 5 },
  passive: (lv) => ({ skillDmg: { arrow_shower: lv * 20 } }),
  desc: (lv) => `하늘을 덮을 만큼 화살을 퍼붓습니다.\n화살비 피해 +${lv * 20}%, SP −${lv}${lv >= 5 ? '\n5레벨: 화살비가 한 번 더 쏟아집니다' : '\n(5레벨이 되면 화살비가 한 번 더)'}`,
});
def({
  id: 'steady_breath', name: '숨 고르기', cls: 'hunter', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'hu_snipe',
  icon: { glyph: 'eye2', color: '#ffe080', color2: '#ff6a3d' }, req: { vultures_eye: 5 },
  passive: () => ({}),
  desc: (lv) => `첫 발에 모든 것을 겁니다.\n활로 대상에게 처음 쏘는 공격(이중 사격의 첫 발 포함)의 크리티컬 확률 +${lv * 10}%, 그 크리티컬 피해 +${lv * 10}%\n보스에게 원거리 피해 +${lv * 5}%`,
});
// ───────── Priest
def({
  id: 'sanct_aura', name: '성역의 오라', cls: 'priest', maxLv: 5, kind: 'selfBuff', auto: 'buff', fx: 'angelus', build: 'pr_support',
  icon: { glyph: 'halo', color: '#fff3a0', color2: '#bfe8ff' }, req: { kyrie: 5 },
  sp: fixed(25), cd: fixed(2000),
  buff: { id: 'saura', name: '성역의 오라', dur: fixed(120000), bonus: () => ({}) },
  desc: (lv) => `몸에서 은은한 빛이 퍼집니다 (2분, 3초마다 SP 2).\n주위(10칸) 파티원이 받는 피해 −${lv * 3}% (자신 포함)\nSP 25`,
});
def({
  id: 'battle_prayer', name: '전투 기도', cls: 'priest', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'pr_battle',
  icon: { glyph: 'mace', color: '#ffe680', color2: '#ff9a3a' }, req: { mace_mastery: 5 },
  passive: (lv, w, c) => (w === 'mace' ? { aspdPct: lv * 2, atk: lv * 3 * ((c.buffs.has('blessing') ? 1 : 0) + (c.buffs.has('agi_up') ? 1 : 0)) } : {}),
  desc: (lv) => `기도하며 휘두르는 철퇴.\n둔기 장착 시: 공격 속도 +${lv * 2}%\n축복·속도 증가가 걸려 있으면 하나마다 ATK +${lv * 3}`,
});
def({
  id: 'radiance', name: '광휘', cls: 'priest', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'pr_crit',
  icon: { glyph: 'sun', color: '#fff0a0', color2: '#ff9ad8' }, req: { gloria: 3 },
  passive: () => ({}),
  desc: (lv) => `영광송이 날카로운 빛을 띱니다.\n내가 부른 영광송이 파티 전원에게 크리티컬 +${lv * 2}도 함께 줍니다`,
});
def({
  id: 'exorcist_vow', name: '퇴마의 서약', cls: 'priest', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'pr_exorcist',
  icon: { glyph: 'cross', color: '#fff3a0', color2: '#a0c8ff' }, req: { magnus: 5 },
  passive: (lv) => ({ skillDmg: { magnus: lv * 8 } }),
  desc: (lv) => `망자를 남김없이 보내겠다는 서약.\n대퇴마 피해 +${lv * 8}%, 시전 시간 −${lv * 8}%${lv >= 5 ? '\n5레벨: 대퇴마에 푸른 마석이 들지 않습니다' : '\n(5레벨이 되면 푸른 마석 없이 대퇴마)'}`,
});
def({
  id: 'reverse_life', name: '역류하는 생명', cls: 'priest', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'pr_heal',
  icon: { glyph: 'cross', color: '#7fff9a', color2: '#ffe680' }, req: { heal: 10 },
  passive: () => ({}),
  desc: (lv) => `생명이 넘쳐 죽은 것을 태웁니다.\n불사 속성 몬스터에게 힐 피해 +${lv * 15}%`,
});
def({
  id: 'bulwark', name: '성벽', cls: 'priest', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'pr_wall',
  icon: { glyph: 'shield', color: '#bfe8ff', color2: '#fff3a0' }, req: { kyrie: 5 },
  passive: () => ({}),
  desc: (lv) => `장막을 성벽처럼 두껍게 칩니다.\n내가 건 수호의 장막의 흡수량 +${lv * 10}%\n자신에게 건 수호의 장막은 지속 시간 +50%, 막는 횟수 +2`,
});
// ───────── Assassin
def({
  id: 'vital_stab', name: '급소 찌르기', cls: 'assassin', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'as_crit',
  icon: { glyph: 'dagger2', color: '#ff6a8a', color2: '#ffe080' }, req: { katar_mastery: 5 },
  passive: (lv, w, c) => (w === 'katar' && c.base.dex <= 10 ? { crit: lv * 0.8, critDmgPct: lv * 6 } : {}),
  desc: (lv) => `카타르 끝이 급소만 찾아 들어갑니다. DEX 없이 크리로 명중하는 카타르의 기술.\n카타르 장착, 직접 찍은 DEX 10 이하일 때: 크리티컬 +${(lv * 0.8).toFixed(1)} (카타르라 두 배로 적용), 크리티컬 피해 +${lv * 6}%`,
});
def({
  id: 'sonic_chain', name: '음속 연쇄', cls: 'assassin', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'as_sonic',
  icon: { glyph: 'dagger2', color: '#ff5a8a', color2: '#a0e0ff' }, req: { sonic_blow: 5 },
  passive: () => ({}),
  desc: (lv) => `칼이 멈추기 전에 다음 연격이 시작됩니다.\n음속 연격을 쓴 뒤 ${lv * 8}% 확률로 SP·재사용 대기 없이 한 번 더\n카타르 평타가 맞으면 ${(lv * 0.4).toFixed(1)}% 확률로 음속 연격이 저절로 터집니다 (SP 없이)`,
});
def({
  id: 'twin_dance', name: '쌍검무', cls: 'assassin', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'as_dagger',
  icon: { glyph: 'sword', color: '#c0a0ff', color2: '#ff9ad8' }, req: { left_hand: 3 },
  passive: () => ({}),
  desc: (lv) => `두 자루가 하나의 춤처럼 움직입니다.\n양손에 무기를 들었을 때 왼손 피해 +${lv * 5}%p\n이중 공격이 왼손 단검에서도 터집니다`,
});
def({
  id: 'shadow_clone', name: '그림자 분신', cls: 'assassin', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'as_dodge',
  icon: { glyph: 'spirit', color: '#8a7ab0', color2: '#ff9ad8' }, req: { improve_dodge: 5 },
  passive: () => ({}),
  desc: (lv) => `피한 자리에 남은 그림자가 칼을 휘두릅니다.\n공격을 피하면 ${lv * 8}% 확률로 그 적에게 반격 (평타 100%)`,
});
def({
  id: 'venom_stack', name: '맹독 누적', cls: 'assassin', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'as_poison',
  icon: { glyph: 'poison', color: '#c050ff', color2: '#80e080' }, req: { enchant_poison: 3 },
  passive: () => ({}),
  desc: (lv) => `독 위에 독을 덧바릅니다.\n맹독·독 안개·독 무기로 중독된 적을 다시 중독시키면 독이 겹칩니다 (최대 ${lv}겹). 한 겹마다 독 피해 +150%\n(맹독 부여의 평타 중독은 독속성 무기를 들었을 때만 겹칩니다)\n(불사·무형은 여전히 중독되지 않습니다)`,
});
def({
  id: 'dark_hunt', name: '어둠 사냥', cls: 'assassin', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'as_grim',
  icon: { glyph: 'claw', color: '#8a5ad0', color2: '#ff6a8a' }, req: { grimtooth: 3 },
  passive: (lv) => ({ skillDmg: { grimtooth: lv * 15 } }),
  desc: (lv) => `그림자 속에서 급소를 노립니다.\n그림자 송곳니 피해 +${lv * 15}%, SP −${Math.floor(lv / 2)}\n은신 이동 중에 쓴 그림자 송곳니는 크리티컬이 터질 수 있습니다`,
});
def({
  id: 'grand_thief', name: '대도', cls: 'assassin', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'as_steal',
  icon: { glyph: 'coins', color: '#ffd080', color2: '#8070a0' }, req: { steal: 5 },
  passive: () => ({}),
  desc: (lv) => `한 번 스친 주머니는 가벼워집니다.\n훔치기 확률 +${lv * 2}%p\n평타가 맞을 때 ${lv}% 확률로 제니를 낚아챕니다 (몬스터 레벨 × 4~8)`,
});
// ───────── Blacksmith (combat builds only — smithing stays out by the user's decision)
def({
  id: 'smith_fury', name: '대장장이의 분노', cls: 'blacksmith', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'bs_battle',
  icon: { glyph: 'hammer', color: '#ff6a3a', color2: '#ffe080' }, req: { adrenaline: 3 },
  passive: (lv, w, c) => (c.buffs.has('adrenaline') ? { crit: lv * 2, ...(w === 'axe' ? { atkPct: lv * 3 } : {}) } : {}),
  desc: (lv) => `망치질하던 분노를 도끼에 싣습니다.\n아드레날린 러쉬 중: 크리티컬 +${lv * 2}, 도끼 피해 +${lv * 3}%`,
});
def({
  id: 'cart_rush', name: '질주 카트', cls: 'blacksmith', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'bs_cart',
  icon: { glyph: 'cart2', color: '#ff9a3a', color2: '#e0a050' }, req: { cart_revolution: 1 },
  passive: () => ({}),
  desc: (lv) => `가득 실은 손수레가 멈추지 않습니다.\n카트 돌진 범위 +${lv * 10}%, 맞힌 대상 1명마다 피해 +${lv * 8}% (첫 대상 제외, 5명까지)\n맞힌 적을 밀쳐내지 않고 함께 끌고 갑니다 (몰이가 흩어지지 않음)`,
});
def({
  id: 'gold_storm', name: '황금 폭풍', cls: 'blacksmith', maxLv: 5, kind: 'aoe', auto: 'aoe', fx: 'goldstorm', build: 'bs_zeny',
  icon: { glyph: 'coins', color: '#ffe060', color2: '#ff9a3a' }, req: { mammonite: 5 }, radius: 80,
  sp: fixed(8), zeny: fixed(2000), mult: L((lv) => 600 * (1 + lv * 0.04)), delay: fixed(600), cd: fixed(1000),
  desc: (lv) => `금화를 한 움큼 쥐고 휘둘러 주위를 쓸어버립니다.\n대상 주변(반경 80)의 적 모두에게 배운 금화 강타의 ${100 + lv * 4}% 피해 (금화 강타 10레벨이면 ATK ${Math.round(600 * (1 + lv * 0.04))}%)\n소모: 금화 강타 제니의 두 배 (10레벨이면 2,000 제니), SP 8`,
});
def({
  id: 'thunder_hammer', name: '천둥의 망치질', cls: 'blacksmith', maxLv: 5, kind: 'passive', auto: 'none', fx: '', build: 'bs_hammer',
  icon: { glyph: 'hammer', color: '#ffe45a', color2: '#c0a080' }, req: { hammer_fall: 3 },
  passive: () => ({}),
  desc: (lv) => `망치 소리가 천둥처럼 땅을 흔듭니다.\n해머 낙하의 기절 시간 +${lv * 10}%, 기절한 적에게 주는 피해 +${lv * 5}%\n보스도 ${(0.5 + lv * 0.1).toFixed(1)}초 경직됩니다`,
});

/** the build signature skills (SKILLS_META.md) of a build, in the order the build card lists them */
export function signatureSkills(buildId: string): SkillDef[] {
  return Object.values(SKILLS).filter((s) => s.build === buildId);
}

export function skillsOf(cls: ClassId): SkillDef[] {
  return Object.values(SKILLS).filter((s) => s.cls === cls);
}

/** an active skill the auto AI may use — it needs a slot (passives always apply; manual utilities are used from the UI) */
export function slotable(sk: SkillDef | undefined): boolean {
  return !!sk && sk.kind !== 'passive' && sk.auto !== 'none';
}

export const SLOT_COUNT = 6;

