import type { Bonus, ClassId, Element, IconSpec, WeaponType } from '../types.ts';

export type SkillKind =
  | 'passive' | 'melee' | 'ranged' | 'bolt' | 'aoe' | 'selfAoe'
  | 'heal' | 'buff' | 'selfBuff' | 'debuff' | 'selfHeal' | 'revive';

export type AutoRole = 'attack' | 'aoe' | 'heal' | 'buff' | 'tank' | 'cc' | 'revive' | 'none';

export type StatusKind = 'stun' | 'freeze' | 'blind';
/** inputs for fixed-damage skills (traps, falcon) */
export interface FixedCtx { dex: number; int: number; luk: number; baseLv: number; skills: Record<string, number> }

export interface BuffSpec {
  id: string;
  name: string;
  dur: (lv: number) => number;
  bonus: (lv: number) => Bonus;
  party?: boolean;
  /** percent modifiers applied after flat stats (e.g. improve concentration) */
  statPct?: (lv: number) => Partial<Record<'agi' | 'dex', number>>;
  /** damage barrier as % of each target's max HP (kyrie) */
  shieldPct?: (lv: number) => number;
}

export interface SkillDef {
  id: string;
  name: string;
  cls: ClassId;
  maxLv: number;
  kind: SkillKind;
  icon: IconSpec;
  req?: Record<string, number>;
  sp?: (lv: number) => number;
  hpCost?: (lv: number) => number;
  zeny?: (lv: number) => number;
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
  passive?: (lv: number, w: WeaponType) => Bonus;
  buff?: BuffSpec;
  /** fixed damage per hit that ignores DEF and FLEE */
  fixed?: (lv: number, c: FixedCtx) => number;
  /** status inflicted on each target hit */
  status?: (lv: number) => { kind: StatusKind; chance: number; dur: number };
  /** extra multiplier against undead/demon targets */
  vsUndead?: number;
  /** pierce-style: hit count depends on target size */
  bySize?: boolean;
  /** HP ratio restored by revive */
  revivePct?: (lv: number) => number;
  auto: AutoRole;
  fx: string;
  desc: (lv: number) => string;
}

const L = (f: (lv: number) => number) => f;
const fixed = (n: number) => () => n;

export const SKILLS: Record<string, SkillDef> = {};
function def(s: SkillDef) { SKILLS[s.id] = s; }

// ───────── Novice
def({
  id: 'basic', name: '기본기', cls: 'novice', maxLv: 9, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'book', color: '#c9a36b' },
  passive: (lv) => ({ hpRegenPct: lv * 2 }),
  desc: (lv) => `모험의 기초. 9레벨이 되면 1차 전직이 가능합니다.\nHP 회복 +${lv * 2}%`,
});
def({
  id: 'first_aid', name: '응급처치', cls: 'novice', maxLv: 1, kind: 'selfHeal', auto: 'heal', fx: 'heal',
  icon: { glyph: 'cross', color: '#6fd06f' }, sp: fixed(3), delay: fixed(800),
  desc: () => 'HP를 5 회복합니다. (SP 3)',
});

// ───────── Swordsman
def({
  id: 'sword_mastery', name: '한손검 수련', cls: 'swordsman', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'sword', color: '#8fb0e0' },
  passive: (lv, w) => (w === 'sword' || w === 'dagger' ? { atk: lv * 4 } : {}),
  desc: (lv) => `한손검·단검 장착 시 공격력 +${lv * 4}`,
});
def({
  id: 'twohand_mastery', name: '양손검 수련', cls: 'swordsman', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'sword2', color: '#7da0d8' }, req: { sword_mastery: 1 },
  passive: (lv, w) => (w === 'sword2h' ? { atk: lv * 4 } : {}),
  desc: (lv) => `양손검 장착 시 공격력 +${lv * 4}`,
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
  desc: (lv) => `대상에게 강력한 일격. ATK ${100 + lv * 30}%, 명중 +${lv * 5}%\nSP ${lv <= 5 ? 8 : 15}`,
});
def({
  id: 'magnum_break', name: '폭렬검', cls: 'swordsman', maxLv: 10, kind: 'selfAoe', auto: 'aoe', fx: 'magnum',
  icon: { glyph: 'flame', color: '#ff7a3d' }, req: { bash: 5 }, element: 'fire',
  sp: fixed(30), mult: L((lv) => 100 + lv * 20), radius: 78, delay: fixed(500), cd: fixed(2000),
  buff: { id: 'magnum', name: '폭렬', dur: fixed(10000), bonus: () => ({ eleDmg: {} }) },
  desc: (lv) => `주위의 적을 불꽃으로 날려버립니다. 불속성 ATK ${100 + lv * 20}%\n이후 10초간 공격에 불꽃 추가 피해 20%.\nSP 30`,
});
def({
  id: 'provoke', name: '도발', cls: 'swordsman', maxLv: 10, kind: 'debuff', auto: 'tank', fx: 'provoke',
  icon: { glyph: 'shout', color: '#ff5050' }, range: 180,
  sp: L((lv) => 4 + lv), cd: fixed(5000), delay: fixed(200),
  desc: (lv) => `주변 적의 시선을 끌어 자신을 공격하게 합니다.\n대상 DEF -${5 + lv * 5}%, 대상 ATK +${2 + lv * 3}% (30초)\nSP ${4 + lv}`,
});
def({
  id: 'endure', name: '인내', cls: 'swordsman', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'endure',
  icon: { glyph: 'shield', color: '#c0a060' }, req: { provoke: 5 }, sp: fixed(10), cd: fixed(10000),
  buff: { id: 'endure', name: '인내', dur: L((lv) => 10000 + lv * 3000), bonus: (lv) => ({ mdef: lv, dmgReducePct: lv * 2 }) },
  desc: (lv) => `${10 + lv * 3}초간 받는 피해 -${lv * 2}%, MDEF +${lv}\nSP 10`,
});

// ───────── Mage
def({
  id: 'sp_recovery', name: 'SP 회복력 향상', cls: 'mage', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'drop', color: '#5aa0ff' },
  passive: (lv) => ({ spRegen: lv * 3 }),
  desc: (lv) => `SP 자연 회복 +${lv * 3}`,
});
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
  id: 'soul_strike', name: '영혼 강타', cls: 'mage', maxLv: 10, kind: 'bolt', auto: 'attack', fx: 'soul', magic: true, element: 'ghost',
  icon: { glyph: 'spirit', color: '#b8f0ff' }, range: 210,
  sp: L((lv) => 18 + Math.floor(lv / 2) * 3), hits: L((lv) => Math.ceil(lv / 2)), mult: fixed(100),
  cast: fixed(500), delay: L((lv) => 800 + lv * 80),
  desc: (lv) => `염속성 영혼탄 ${Math.ceil(lv / 2)}발. 각 MATK 100%\n불사형에게 추가 피해 +${lv * 5}%`,
});
def({
  id: 'frost_diver', name: '빙결', cls: 'mage', maxLv: 10, kind: 'bolt', auto: 'attack', fx: 'frost', magic: true, element: 'water',
  icon: { glyph: 'snow', color: '#9fe8ff' }, req: { cold_bolt: 5 }, range: 210,
  sp: L((lv) => 26 - lv), hits: fixed(1), mult: L((lv) => 110 + lv * 10), cast: fixed(800), delay: fixed(1200),
  desc: (lv) => `물속성 MATK ${110 + lv * 10}%. ${35 + lv * 3}% 확률로 ${lv * 1.5}초간 대상을 얼립니다.\n얼어붙은 적은 물속성이 됩니다 — 번개 화살이 175%!`,
});
def({
  id: 'fire_ball', name: '화염구', cls: 'mage', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'fireball', magic: true, element: 'fire',
  icon: { glyph: 'fireball', color: '#ff8a3d' }, req: { fire_bolt: 4 }, range: 210, radius: 64,
  sp: fixed(25), hits: fixed(1), mult: L((lv) => 70 + lv * 10), cast: L((lv) => (lv <= 5 ? 1500 : 1000)), delay: fixed(1300),
  desc: (lv) => `대상 주변을 불덩이로 폭발. 불속성 MATK ${70 + lv * 10}% (범위)\nSP 25`,
});
def({
  id: 'thunderstorm', name: '뇌우', cls: 'mage', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'storm', magic: true, element: 'wind',
  icon: { glyph: 'storm', color: '#ffe45a' }, req: { lightning_bolt: 4 }, range: 210, radius: 84,
  sp: L((lv) => 24 + lv * 5), hits: L((lv) => lv), mult: fixed(80), cast: L((lv) => 600 + lv * 250), delay: fixed(1500),
  desc: (lv) => `대상 지역에 벼락 ${lv}회. 각 바람속성 MATK 80% (범위)\nSP ${24 + lv * 5}`,
});

// ───────── Archer
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
  desc: (lv) => `활 장착 시 명중 +${lv}, 사거리 +${lv * 8}`,
});
def({
  id: 'improve_conc', name: '집중력 향상', cls: 'archer', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'conc',
  icon: { glyph: 'focus', color: '#7fe0a0' }, req: { vultures_eye: 1 },
  sp: L((lv) => 20 + lv * 5), cd: fixed(3000),
  buff: { id: 'conc', name: '집중', dur: L((lv) => 40000 + lv * 20000), bonus: () => ({}), statPct: (lv) => ({ agi: 2 + lv, dex: 2 + lv }) },
  desc: (lv) => `${40 + lv * 20}초간 AGI·DEX +${2 + lv}%\nSP ${20 + lv * 5}`,
});
def({
  id: 'double_strafe', name: '이중 사격', cls: 'archer', maxLv: 10, kind: 'ranged', auto: 'attack', fx: 'strafe',
  icon: { glyph: 'arrows', color: '#ffd27a' }, weapon: ['bow'],
  sp: fixed(12), hits: fixed(2), mult: L((lv) => 100 + lv * 10), delay: fixed(400),
  desc: (lv) => `화살 2발을 연속 발사. 각 ATK ${100 + lv * 10}%\n(활 필요) SP 12`,
});
def({
  id: 'arrow_shower', name: '화살비', cls: 'archer', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'shower',
  icon: { glyph: 'rain', color: '#c8e07a' }, req: { double_strafe: 5 }, weapon: ['bow'], radius: 64,
  sp: L((lv) => 15 + Math.floor(lv / 3)), hits: fixed(1), mult: L((lv) => 80 + lv * 5), delay: fixed(600), cd: fixed(1000),
  desc: (lv) => `대상 지역에 화살비. ATK ${80 + lv * 5}% (범위)\n(활 필요)`,
});

// ───────── Acolyte
def({
  id: 'heal', name: '힐', cls: 'acolyte', maxLv: 10, kind: 'heal', auto: 'heal', fx: 'heal', magic: true, element: 'holy',
  icon: { glyph: 'cross', color: '#7fff9a' }, range: 200,
  sp: L((lv) => 10 + lv * 3), delay: fixed(600),
  desc: (lv) => `아군 HP 회복: ⌊(레벨+INT)/8⌋ × ${4 + lv * 8}\n불사형 적에게 쓰면 성속성 피해 (자동)\nSP ${10 + lv * 3}`,
});
def({
  id: 'divine_protection', name: '신의 가호', cls: 'acolyte', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'shield', color: '#f0e6a0' },
  passive: (lv) => ({ raceRes: { undead: lv * 3, demon: lv * 3 } }),
  desc: (lv) => `불사·악마형에게 받는 피해 -${lv * 3}%`,
});
def({
  id: 'demon_bane', name: '악마 퇴치', cls: 'acolyte', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'mace', color: '#f0c050' }, req: { divine_protection: 3 },
  passive: (lv) => ({ raceDmg: { undead: lv * 4, demon: lv * 4 } }),
  desc: (lv) => `불사·악마형에게 주는 물리 피해 +${lv * 4}%`,
});
def({
  id: 'blessing', name: '축복', cls: 'acolyte', maxLv: 10, kind: 'buff', auto: 'buff', fx: 'blessing',
  icon: { glyph: 'wing', color: '#ffe680' }, req: { divine_protection: 5 }, range: 220,
  sp: L((lv) => 24 + lv * 4), delay: fixed(500),
  buff: { id: 'blessing', name: '축복', party: true, dur: L((lv) => 40000 + lv * 20000), bonus: (lv) => ({ str: lv, int: lv, dex: lv }) },
  desc: (lv) => `파티 전원 ${40 + lv * 20}초간 STR·INT·DEX +${lv}\nSP ${24 + lv * 4}`,
});
def({
  id: 'increase_agi', name: '속도 증가', cls: 'acolyte', maxLv: 10, kind: 'buff', auto: 'buff', fx: 'agi',
  icon: { glyph: 'boot', color: '#8ff0ff' }, req: { heal: 3 }, range: 220,
  sp: L((lv) => 15 + lv * 3), hpCost: fixed(15), delay: fixed(500),
  buff: { id: 'agi_up', name: '속도 증가', party: true, dur: L((lv) => 40000 + lv * 20000), bonus: (lv) => ({ agi: 2 + lv, moveSpd: 25 }) },
  desc: (lv) => `파티 전원 ${40 + lv * 20}초간 AGI +${2 + lv}, 이동속도 +25%\nHP 15 · SP ${15 + lv * 3}`,
});
def({
  id: 'angelus', name: '천사의 가호', cls: 'acolyte', maxLv: 10, kind: 'buff', auto: 'buff', fx: 'angelus',
  icon: { glyph: 'halo', color: '#ffffff' }, req: { divine_protection: 3 }, range: 220,
  sp: L((lv) => 20 + lv * 3), delay: fixed(500),
  buff: { id: 'angelus', name: '천사의 가호', party: true, dur: L((lv) => lv * 30000), bonus: (lv) => ({ def: lv * 2 }) },
  desc: (lv) => `파티 전원 ${lv * 30}초간 DEF +${lv * 2}\nSP ${20 + lv * 3}`,
});
// battle priests had no weapon skill (BUILD_TREE.md 2.4: 철퇴 사제 · 광휘 크리 사제) — a holy two-hit swing
def({
  id: 'holy_strike', name: '성스러운 일격', cls: 'acolyte', maxLv: 5, kind: 'melee', auto: 'attack', fx: 'bash', element: 'holy',
  icon: { glyph: 'cross', color: '#ffe680' },
  sp: L((lv) => 3 + lv), hits: fixed(2), mult: L((lv) => 100 + lv * 25), hitBonus: L((lv) => lv * 4), delay: fixed(450),
  desc: (lv) => `둔기에 성스러운 힘을 실어 두 번 내려친다. 성속성 ATK ${100 + lv * 25}% ×2, 명중 +${lv * 4}%\n불사·악마에게 특히 강하다. SP ${3 + lv}`,
});
def({
  id: 'holy_light', name: '성스러운 빛', cls: 'acolyte', maxLv: 5, kind: 'bolt', auto: 'attack', fx: 'holy', magic: true, element: 'holy',
  icon: { glyph: 'sun', color: '#fff3a0' }, range: 200,
  sp: fixed(15), hits: fixed(1), mult: L((lv) => 110 + lv * 15), cast: fixed(900), delay: fixed(900),
  desc: (lv) => `성속성 빛의 창. MATK ${110 + lv * 15}%\n불사·암흑에게 특히 강합니다. SP 15`,
});

// ───────── Thief
def({
  id: 'double_attack', name: '이중 공격', cls: 'thief', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'dagger2', color: '#c0a0ff' },
  passive: (lv, w) => (w === 'dagger' ? { hit: lv } : {}),
  desc: (lv) => `단검 공격 시 ${lv * 5}% 확률로 2회 타격, 명중 +${lv}`,
});
def({
  id: 'improve_dodge', name: '회피 향상', cls: 'thief', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'wind', color: '#a0f0d0' },
  passive: (lv) => ({ flee: lv * 3 }),
  desc: (lv) => `FLEE +${lv * 3}`,
});
def({
  id: 'steal', name: '훔치기', cls: 'thief', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'hand', color: '#ffd080' },
  passive: () => ({}),
  desc: (lv) => `공격 시 ${(lv * 1.2).toFixed(1)}% 확률로 대상의 전리품 하나를 훔칩니다.\n(몬스터당 1회, 카드 제외)`,
});
def({
  id: 'envenom', name: '맹독', cls: 'thief', maxLv: 10, kind: 'melee', auto: 'attack', fx: 'envenom', element: 'poison',
  icon: { glyph: 'poison', color: '#b070e0' },
  sp: fixed(12), mult: fixed(100), delay: fixed(300),
  desc: (lv) => `독속성 공격 + 추가 피해 ${lv * 15}. ${10 + lv * 4}% 확률로 중독\n(10초간 지속 피해) SP 12`,
});
def({
  id: 'sand_attack', name: '모래 뿌리기', cls: 'thief', maxLv: 5, kind: 'melee', auto: 'attack', fx: 'sand', element: 'earth',
  icon: { glyph: 'sand', color: '#d8b070' }, req: { improve_dodge: 3 },
  sp: fixed(9), mult: L((lv) => 110 + lv * 10), delay: fixed(400), cd: fixed(3000),
  desc: (lv) => `땅속성 ATK ${110 + lv * 10}%. ${15 + lv * 5}% 확률로 실명 (적 명중 -25%)`,
});

// ───────── Merchant
def({
  id: 'discount', name: '할인', cls: 'merchant', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'tag', color: '#80e080' },
  passive: () => ({}),
  desc: (lv) => `상점 구매 가격 -${5 + lv * 2}% (파티 공유)`,
});
def({
  id: 'overcharge', name: '바가지', cls: 'merchant', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'coin', color: '#ffd24a' },
  passive: () => ({}),
  desc: (lv) => `상점 판매 가격 +${5 + lv * 2}% (파티 공유)`,
});
def({
  id: 'pushcart', name: '손수레', cls: 'merchant', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'cart', color: '#d0a070' },
  passive: (lv) => ({ dropPct: lv * 3 }),
  desc: (lv) => `잡템 드롭률 +${lv * 3}% (파티 공유). 카트 돌진의 선행 스킬.`,
});
def({
  id: 'mammonite', name: '금화 강타', cls: 'merchant', maxLv: 10, kind: 'melee', auto: 'attack', fx: 'mammonite',
  icon: { glyph: 'coins', color: '#ffd24a' },
  sp: fixed(5), zeny: L((lv) => lv * 100), mult: L((lv) => 100 + lv * 50), delay: fixed(300),
  desc: (lv) => `돈으로 때립니다. ATK ${100 + lv * 50}%\n소모: ${lv * 100} 제니, SP 5`,
});
def({
  id: 'cart_revolution', name: '카트 돌진', cls: 'merchant', maxLv: 5, kind: 'aoe', auto: 'aoe', fx: 'cart',
  icon: { glyph: 'cart2', color: '#e0a050' }, req: { pushcart: 5 }, radius: 56,
  sp: fixed(12), hits: fixed(1), mult: L((lv) => 150 + lv * 20), delay: fixed(500), cd: fixed(1000),
  desc: (lv) => `손수레로 대상 주변을 쓸어버립니다. ATK ${150 + lv * 20}% (범위)`,
});

// ═════════ 2nd jobs
// ───────── Knight
def({
  id: 'spear_mastery', name: '창 수련', cls: 'knight', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'spear', color: '#8fb0e0' },
  passive: (lv, w) => (w === 'spear' ? { atk: lv * 4, hit: lv } : {}),
  desc: (lv) => `창 장착 시 공격력 +${lv * 4}, 명중 +${lv}`,
});
def({
  id: 'pierce', name: '꿰뚫기', cls: 'knight', maxLv: 10, kind: 'melee', auto: 'attack', fx: 'pierce', bySize: true,
  icon: { glyph: 'spear', color: '#5aa0ff' }, req: { spear_mastery: 1 }, weapon: ['spear'],
  sp: fixed(7), mult: L((lv) => 100 + lv * 10), hitBonus: L((lv) => lv * 5), delay: fixed(400),
  desc: (lv) => `창으로 꿰뚫습니다. 소형 1회·중형 2회·대형 3회 타격, 각 ATK ${100 + lv * 10}%\n명중 +${lv * 5}% (창 필요) SP 7`,
});
def({
  id: 'brandish', name: '창 휘두르기', cls: 'knight', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'brandish', radius: 66,
  icon: { glyph: 'spear', color: '#ffb347' }, req: { pierce: 3 }, weapon: ['spear'],
  sp: fixed(12), mult: L((lv) => 120 + lv * 30), delay: fixed(700), cd: fixed(1200),
  desc: (lv) => `창을 크게 휘둘러 대상 주변을 쓸어버립니다. ATK ${120 + lv * 30}% (범위, 창 필요)`,
});
def({
  id: 'bowling_bash', name: '회전 강타', cls: 'knight', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'bowling', radius: 72,
  icon: { glyph: 'burst', color: '#ff8a3a' }, req: { bash: 5, magnum_break: 3 },
  sp: L((lv) => 13 + lv), hits: fixed(2), mult: L((lv) => 100 + lv * 40), delay: fixed(700), cd: fixed(1000),
  desc: (lv) => `적을 후려쳐 주변까지 휩쓰는 2연타. 각 ATK ${100 + lv * 40}% (범위)\nSP ${13 + lv}`,
});
def({
  id: 'twohand_quicken', name: '양손검 가속', cls: 'knight', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'quicken',
  icon: { glyph: 'sword2', color: '#ffd24a' }, req: { twohand_mastery: 1 }, weapon: ['sword2h'],
  sp: L((lv) => 10 + lv * 4), cd: fixed(2000),
  buff: { id: 'quicken', name: '양손검 가속', dur: L((lv) => lv * 30000), bonus: () => ({ aspdPct: 30 }) },
  desc: (lv) => `${lv * 30}초간 공격 속도 +30% (양손검 필요)\nSP ${10 + lv * 4}`,
});
def({
  id: 'auto_counter', name: '반격', cls: 'knight', maxLv: 5, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'shield', color: '#ff6a6a' },
  passive: () => ({}),
  desc: (lv) => `근접 공격을 받으면 ${lv * 6}% 확률로 즉시 크리티컬 반격`,
});

// ───────── Wizard
def({
  id: 'spell_mastery', name: '마력 수련', cls: 'wizard', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'book', color: '#a080ff' },
  passive: (lv) => ({ matkPct: lv * 2, castPct: lv * 2 }),
  desc: (lv) => `MATK +${lv * 2}%, 시전 시간 -${lv * 2}%`,
});
def({
  id: 'mystic_amp', name: '마력 증폭', cls: 'wizard', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'amp',
  icon: { glyph: 'spirit', color: '#d080ff' }, sp: L((lv) => 18 + lv * 2), cd: fixed(25000),
  buff: { id: 'amp', name: '마력 증폭', dur: fixed(15000), bonus: (lv) => ({ matkPct: lv * 5 }) },
  desc: (lv) => `15초간 MATK +${lv * 5}% (재사용 25초)`,
});
def({
  id: 'jupitel', name: '뇌격구', cls: 'wizard', maxLv: 10, kind: 'bolt', auto: 'attack', fx: 'jupitel', magic: true, element: 'wind',
  icon: { glyph: 'bolt', color: '#7ad0ff' }, req: { lightning_bolt: 1 }, range: 220,
  sp: L((lv) => 20 + lv * 3), hits: L((lv) => lv + 2), mult: fixed(100), cast: L((lv) => 500 + lv * 150), delay: fixed(700),
  desc: (lv) => `번개 구체가 ${lv + 2}연타. 각 바람속성 MATK 100%`,
});
def({
  id: 'meteor', name: '유성우', cls: 'wizard', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'meteor', magic: true, element: 'fire',
  icon: { glyph: 'fireball', color: '#ff5a2a' }, req: { fire_ball: 3, thunderstorm: 1 }, range: 220, radius: 92,
  sp: L((lv) => 20 + lv * 4), hits: L((lv) => Math.ceil(lv / 2) + 1), mult: fixed(125), cast: L((lv) => 1800 + lv * 250), delay: fixed(1800),
  status: (lv) => ({ kind: 'stun', chance: lv * 3, dur: 3000 }),
  desc: (lv) => `유성 ${Math.ceil(lv / 2) + 1}개가 떨어집니다. 각 불속성 MATK 125% (범위)\n${lv * 3}% 확률로 기절`,
});
def({
  id: 'storm_gust', name: '폭풍한설', cls: 'wizard', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'gust', magic: true, element: 'water',
  icon: { glyph: 'snow', color: '#9fe8ff' }, req: { frost_diver: 1, jupitel: 3 }, range: 220, radius: 104,
  sp: L((lv) => 60 + lv * 3), hits: fixed(5), mult: L((lv) => 60 + lv * 20), cast: L((lv) => 3000 + lv * 200), delay: fixed(2500),
  status: (lv) => ({ kind: 'freeze', chance: 20 + lv * 5, dur: 4000 }),
  desc: (lv) => `눈보라 5연타. 각 물속성 MATK ${60 + lv * 20}% (넓은 범위)\n${20 + lv * 5}% 확률로 빙결 → 바람 마법 175%!`,
});
def({
  id: 'lord_vermilion', name: '천둥왕의 심판', cls: 'wizard', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'lov', magic: true, element: 'wind',
  icon: { glyph: 'storm', color: '#ffe45a' }, req: { thunderstorm: 1, jupitel: 5 }, range: 220, radius: 116,
  sp: L((lv) => 60 + lv * 4), hits: fixed(4), mult: L((lv) => 80 + lv * 20), cast: L((lv) => 3500 + lv * 300), delay: fixed(3000),
  status: (lv) => ({ kind: 'blind', chance: lv * 4, dur: 8000 }),
  desc: (lv) => `하늘을 가르는 벼락 4연타. 각 바람속성 MATK ${80 + lv * 20}% (가장 넓은 범위)`,
});

// ───────── Hunter
def({
  id: 'beast_bane', name: '짐승 사냥', cls: 'hunter', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'arrows', color: '#c8a060' },
  passive: (lv) => ({ raceDmg: { brute: lv * 4, insect: lv * 4 } }),
  desc: (lv) => `동물·곤충형에게 주는 피해 +${lv * 4}%`,
});
def({
  id: 'falcon_eyes', name: '매 길들이기', cls: 'hunter', maxLv: 5, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'bird', color: '#d0a060' },
  passive: (lv) => ({ hit: lv * 2 }),
  desc: (lv) => `매와 함께 다닙니다. 평타 시 (LUK/3 + ${lv})% 확률로 매가 자동 공격(오토 블리츠)\n명중 +${lv * 2}`,
});
def({
  id: 'blitz_beat', name: '블리츠 비트', cls: 'hunter', maxLv: 5, kind: 'bolt', auto: 'attack', fx: 'falcon', element: 'neutral',
  icon: { glyph: 'bird', color: '#ffb84a' }, req: { falcon_eyes: 1 }, range: 220,
  sp: L((lv) => 7 + lv * 3), hits: L((lv) => lv), cast: fixed(800), delay: fixed(900),
  fixed: (_lv, c) => Math.floor((c.dex / 10 + c.int / 2 + (c.skills.steel_crow ?? 0) * 6 + 40) * 2),
  desc: (lv) => `매가 ${lv}연속 급강하. 각 (DEX/10 + INT/2 + 40)×2 고정 피해 (방어 무시)`,
});
def({
  id: 'steel_crow', name: '강철 발톱', cls: 'hunter', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'claw', color: '#c0c8d8' }, req: { blitz_beat: 3 },
  passive: () => ({}),
  desc: (lv) => `매 공격 1회당 피해 +${lv * 12}`,
});
def({
  id: 'ankle_snare', name: '앵클 스네어', cls: 'hunter', maxLv: 5, kind: 'debuff', auto: 'cc', fx: 'snare',
  icon: { glyph: 'sand', color: '#a0c070' }, range: 190, sp: fixed(12), cd: fixed(4000), delay: fixed(400),
  status: (lv) => ({ kind: 'stun', chance: 100, dur: 2000 + lv * 1200 }),
  desc: (lv) => `덫으로 대상을 ${(2 + lv * 1.2).toFixed(1)}초간 묶습니다. (보스 제외)`,
});
def({
  id: 'claymore_trap', name: '클레이모어 트랩', cls: 'hunter', maxLv: 5, kind: 'aoe', auto: 'aoe', fx: 'trap', element: 'fire',
  icon: { glyph: 'burst', color: '#ff6a3d' }, req: { ankle_snare: 1 }, range: 190, radius: 70,
  sp: fixed(15), hits: fixed(1), delay: fixed(600), cd: fixed(2000),
  fixed: (lv, c) => Math.floor((60 + lv * 30) * (1 + c.dex / 60 + c.int / 120)),
  desc: (lv) => `불꽃 폭발 덫. (${60 + lv * 30}) × (1 + DEX/60 + INT/120) 고정 불속성 피해 (범위)`,
});

// ───────── Priest
def({
  id: 'kyrie', name: '수호의 장막', cls: 'priest', maxLv: 10, kind: 'buff', auto: 'buff', fx: 'kyrie',
  icon: { glyph: 'shield', color: '#bfe8ff' }, range: 220,
  sp: L((lv) => 20 + lv), cd: fixed(4000), delay: fixed(500),
  buff: { id: 'kyrie', name: '수호의 장막', party: true, dur: fixed(120000), bonus: () => ({}), shieldPct: (lv) => 10 + lv * 2 },
  desc: (lv) => `파티 전원에게 최대 HP의 ${10 + lv * 2}%만큼 피해를 막는 보호막 (2분)`,
});
def({
  id: 'magnificat', name: '영혼의 찬가', cls: 'priest', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'blessing',
  icon: { glyph: 'drop', color: '#8ab8ff' }, range: 220, sp: fixed(40), cast: fixed(800), delay: fixed(800),
  buff: { id: 'magnificat', name: '영혼의 찬가', party: true, dur: L((lv) => 20000 + lv * 10000), bonus: () => ({ spRegenPct: 100 }) },
  desc: (lv) => `파티 전원 ${20 + lv * 10}초간 SP 회복 2배`,
});
def({
  id: 'gloria', name: '영광송', cls: 'priest', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'blessing',
  icon: { glyph: 'sun', color: '#ffe680' }, req: { kyrie: 4, magnificat: 3 }, range: 220, sp: fixed(20), delay: fixed(600),
  buff: { id: 'gloria', name: '영광송', party: true, dur: L((lv) => 10000 + lv * 5000), bonus: () => ({ luk: 30 }) },
  desc: (lv) => `파티 전원 ${10 + lv * 5}초간 LUK +30`,
});
def({
  id: 'impositio', name: '성스러운 손길', cls: 'priest', maxLv: 5, kind: 'buff', auto: 'buff', fx: 'angelus',
  icon: { glyph: 'hand', color: '#ffd080' }, range: 220, sp: L((lv) => 10 + lv * 3), delay: fixed(500),
  buff: { id: 'impositio', name: '성스러운 손길', party: true, dur: fixed(60000), bonus: (lv) => ({ atk: lv * 5 }) },
  desc: (lv) => `파티 전원 60초간 ATK +${lv * 5}`,
});
def({
  id: 'resurrection', name: '부활', cls: 'priest', maxLv: 4, kind: 'revive', auto: 'revive', fx: 'revive', range: 260,
  icon: { glyph: 'wing', color: '#fff3a0' }, req: { increase_agi: 4 },
  sp: fixed(60), cast: L((lv) => [6000, 4000, 2000, 400][lv - 1]), delay: fixed(1000),
  revivePct: (lv) => [10, 30, 50, 80][lv - 1],
  desc: (lv) => `쓰러진 동료를 HP ${[10, 30, 50, 80][lv - 1]}%로 즉시 일으킵니다. 시전 ${[6, 4, 2, 0.4][lv - 1]}초`,
});
def({
  id: 'magnus', name: '대퇴마', cls: 'priest', maxLv: 10, kind: 'aoe', auto: 'aoe', fx: 'magnus', magic: true, element: 'holy', vsUndead: 1.6,
  icon: { glyph: 'cross', color: '#fff3a0' }, req: { resurrection: 1 }, range: 220, radius: 90,
  sp: L((lv) => 40 + lv * 2), hits: L((lv) => Math.min(6, lv)), mult: fixed(100), cast: L((lv) => 2000 + lv * 250), delay: fixed(2200),
  desc: (lv) => `성스러운 십자가가 ${Math.min(6, lv)}번 내리꽂힙니다. 각 성속성 MATK 100% (범위)\n불사·악마형에게는 1.6배`,
});

// ───────── Assassin
def({
  id: 'katar_mastery', name: '카타르 수련', cls: 'assassin', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'dagger2', color: '#c080ff' },
  passive: (lv, w) => (w === 'katar' ? { atk: lv * 3 } : {}),
  desc: (lv) => `카타르 장착 시 공격력 +${lv * 3}. (카타르는 크리티컬 확률 2배)`,
});
def({
  id: 'sonic_blow', name: '음속 연격', cls: 'assassin', maxLv: 10, kind: 'melee', auto: 'attack', fx: 'sonic',
  icon: { glyph: 'dagger2', color: '#ff5a8a' }, req: { katar_mastery: 4 }, weapon: ['katar'],
  sp: L((lv) => 14 + lv * 2), hits: fixed(8), mult: L((lv) => Math.round((300 + lv * 50) / 8)), hitBonus: fixed(20), delay: fixed(800),
  desc: (lv) => `눈에 보이지 않는 8연타. 총 ATK ${300 + lv * 50}% (카타르 필요)\nSP ${14 + lv * 2}`,
});
def({
  id: 'grimtooth', name: '그림자 송곳니', cls: 'assassin', maxLv: 5, kind: 'aoe', auto: 'aoe', fx: 'grimtooth', range: 130, radius: 50,
  icon: { glyph: 'claw', color: '#8a5ad0' }, req: { sonic_blow: 5 }, weapon: ['katar'],
  sp: fixed(4), mult: L((lv) => 100 + lv * 20), delay: fixed(300),
  desc: (lv) => `땅 밑에서 솟는 칼날. ATK ${100 + lv * 20}% (사거리 길고 범위)`,
});
def({
  id: 'enchant_poison', name: '맹독 부여', cls: 'assassin', maxLv: 10, kind: 'selfBuff', auto: 'buff', fx: 'poisonbuff',
  icon: { glyph: 'poison', color: '#b070e0' }, sp: fixed(20), cd: fixed(2000),
  buff: { id: 'edp', name: '맹독 부여', dur: L((lv) => 30000 + lv * 15000), bonus: (lv) => ({ weaponElement: 'poison', atkPct: lv * 2 }) },
  desc: (lv) => `${30 + lv * 15}초간 무기를 독속성으로, 물리 피해 +${lv * 2}%`,
});
def({
  id: 'shadow_step', name: '그림자 걸음', cls: 'assassin', maxLv: 10, kind: 'passive', auto: 'none', fx: '',
  icon: { glyph: 'wind', color: '#8a7ab0' },
  passive: (lv) => ({ flee: lv * 2, pdodge: Math.floor(lv / 2), moveSpd: lv * 2 }),
  desc: (lv) => `FLEE +${lv * 2}, 완전 회피 +${Math.floor(lv / 2)}, 이동 속도 +${lv * 2}%`,
});

// ───────── Blacksmith
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

export function skillsOf(cls: ClassId): SkillDef[] {
  return Object.values(SKILLS).filter((s) => s.cls === cls);
}
