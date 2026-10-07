import type { Element, Race, Size } from '../types.ts';
import { expNext } from '../exp.ts';

export interface Drop { id: string; rate: number; slots?: number }

export type MobSkillKind = 'slam' | 'summon' | 'heal' | 'charge' | 'bolt' | 'roots' | 'howl';
export interface MobSkill {
  kind: MobSkillKind;
  cd: number;
  /** 0..1: only usable when hp ratio is below this */
  below?: number;
  mult?: number;
  radius?: number;
  summon?: string;
  count?: number;
  element?: Element;
}

export interface MonsterDef {
  id: string;
  name: string;
  lv: number;
  hp: number;
  atk: [number, number];
  def: number;
  mdef: number;
  agi: number;
  dex: number;
  luk: number;
  element: Element;
  race: Race;
  size: Size;
  exp: number;
  jexp: number;
  range: number;
  delay: number;
  speed: number;
  aggressive: boolean;
  boss?: 'field' | 'mvp';
  sprite: string;
  palette: string[];
  scale: number;
  drops: Drop[];
  skills?: MobSkill[];
  atkElement?: Element;
  immobile?: boolean;
  flying?: boolean;
  /** M1: share of critical chance this monster shrugs off (bosses default to 0.25 / MVPs 0.5) */
  critRes?: number;
  desc: string;
}

export const MONSTERS: Record<string, MonsterDef> = {};

type M = Omit<MonsterDef, 'exp' | 'jexp' | 'luk' | 'scale'> & { expMul?: number; luk?: number; scale?: number };
/**
 * Global pacing knobs. With several maps per level band a party always hunts at-level monsters (the old
 * single ladder made it out-level its zone), which levelled ~10% faster and reached the 2nd job ~20% sooner;
 * these bring tools/sim.ts back to the targets (2nd job ≈ 13 h for a healer party, content end ≈ 30 h).
 */
const EXP_RATE = 0.9;
const JOB_RATE = 0.66;
/**
 * Base EXP comes faster than job EXP up to Lv 40 (RO's rhythm: a level every few minutes, the job is the long road).
 * Job EXP keeps the old curve so the 2nd job stays ≈13 h; base EXP gets this multiplier on top.
 */
const baseBoost = (lv: number) => (lv <= 8 ? 1.8 : lv <= 22 ? 2.2 : lv <= 40 ? 2.2 - (lv - 22) * (1.2 / 18) : 1);
/**
 * Early monsters had about twice RO's AGI per level, so a Lv 10 hero hit same-level mobs ~55–65% (the user's "hit wall").
 * Up to Lv 40, ordinary monsters keep AGI ≈ 1.1 × Lv and DEX ≈ 1.2 × Lv; the naturally quick ones (they were ≥ 2.4 × Lv)
 * stay quick at 1.7 × Lv — those are the walls that hit patches (cards, gear) are for. Bosses a little above.
 */
function tame(m: M): M {
  if (m.lv > 40) return m;
  const quick = m.agi >= m.lv * 2.4;
  const agiCap = Math.round(m.lv * (m.boss ? 1.5 : quick ? 1.7 : 1.1) + 3);
  const dexCap = Math.round(m.lv * (m.boss ? 1.4 : 1.2) + 4);
  return { ...m, agi: Math.min(m.agi, agiCap), dex: Math.min(m.dex, dexCap) };
}
function mob(src: M) {
  const m = tame(src);
  // kills per level grow slower after Lv 15 so the idle loop keeps moving toward the 2nd job
  const div = m.lv <= 15 ? 8 + m.lv * 2.4 : 44 + (m.lv - 15) * 1.8 + Math.max(0, m.lv - 45) * 4;
  const raw = (expNext(m.lv) / div) * (m.expMul ?? 1);
  // mid/late monsters were spongy for idle pacing: trim HP by tier (bosses a little less)
  const hpMul = m.lv >= 45 ? (m.boss ? 0.85 : 0.75) : m.lv >= 28 ? (m.boss ? 0.8 : 0.65) : m.lv >= 14 ? (m.boss ? 0.9 : 0.8) : 1;
  MONSTERS[m.id] = { luk: 0, scale: 1, ...m, hp: Math.round(m.hp * hpMul), exp: Math.max(1, Math.round(raw * EXP_RATE * baseBoost(m.lv))), jexp: Math.max(1, Math.round(raw * JOB_RATE)) };
}

/**
 * Card drop rates. Measured with tools/sim.ts: a party levelling through a map kills ~150–350 of each
 * species per hour, so a map's normal cards show up a few times per visit; bosses ~2%, MVPs ~4%.
 * EXP maps are killed in bulk (lower rate), loot maps / dungeons / secrets a little higher.
 */
const CARD = { exp: 0.0025, loot: 0.0035, dng: 0.003, secret: 0.004, rare: 0.0015, boss: 0.02, sboss: 0.03, mvp: 0.04 };

// Drop table shape (RO-like): signature etc 40–60% · second etc / food · consumable · low-% equipment
// (sometimes a rarer slotted variant) · ores on specific mid mobs · the card.

// ═══════════════════════════ 햇살 평원 지방 (Lv 1–25)
// ── 햇살 평원 (EXP)
mob({
  id: 'jelly', name: '말랑', lv: 2, hp: 50, atk: [5, 8], def: 2, mdef: 5, agi: 1, dex: 6,
  element: 'water', race: 'plant', size: 'medium', range: 26, delay: 1600, speed: 46, aggressive: false,
  sprite: 'jelly', palette: ['#ffb3c7', '#ff7aa0', '#fff0f4'],
  drops: [{ id: 'e_jelly', rate: 0.7 }, { id: 'u_apple', rate: 0.12 }, { id: 'e_sticky', rate: 0.05 }, { id: 'u_red', rate: 0.03 }, { id: 'w_knife', rate: 0.006, slots: 3 }, { id: 'q_rainbowdrop', rate: 0.002 }, { id: 'h_jelly', rate: 0.0003 }, { id: 'c_jelly', rate: CARD.exp }],
  desc: '통통 튀는 말랑한 생물. 아무 생각이 없어 보인다.',
});
mob({
  id: 'hornbun', name: '뿔토끼', lv: 4, hp: 70, atk: [8, 12], def: 0, mdef: 0, agi: 14, dex: 8,
  element: 'neutral', race: 'brute', size: 'small', range: 24, delay: 1300, speed: 70, aggressive: false,
  sprite: 'bunny', palette: ['#fbf6ee', '#e8d8c8', '#ffb0b8'],
  drops: [{ id: 'e_fur', rate: 0.55 }, { id: 'e_horn', rate: 0.2 }, { id: 'u_apple', rate: 0.1 }, { id: 'u_meat', rate: 0.04 }, { id: 'h_flower', rate: 0.01 }, { id: 'f_sandals', rate: 0.006, slots: 1 }, { id: 'c_hornbun', rate: CARD.exp }],
  desc: '이마에 작은 뿔이 난 토끼. 의외로 아프게 들이받는다.',
});
mob({
  id: 'wriggle', name: '애벌레', lv: 3, hp: 78, atk: [6, 9], def: 0, mdef: 0, agi: 2, dex: 4,
  element: 'earth', race: 'insect', size: 'small', range: 22, delay: 1700, speed: 32, aggressive: false,
  sprite: 'worm', palette: ['#9ed36a', '#6fae46', '#e8f8c8'],
  drops: [{ id: 'e_shell', rate: 0.6 }, { id: 'e_sticky', rate: 0.15 }, { id: 'u_red', rate: 0.03 }, { id: 'a_cotton', rate: 0.008, slots: 1 }, { id: 'r_elu', rate: 0.0015 }, { id: 'c_wriggle', rate: CARD.exp }],
  desc: '꼬물꼬물 기어다니는 애벌레. 언젠가는 나비가 될까?',
});
mob({
  id: 'sporelet', name: '꼬마버섯', lv: 6, hp: 120, atk: [11, 16], def: 2, mdef: 8, agi: 5, dex: 10,
  element: 'earth', race: 'plant', size: 'small', range: 24, delay: 1500, speed: 40, aggressive: false,
  sprite: 'mushroom', palette: ['#ff6a5a', '#fff4e0', '#ffe8d0'],
  drops: [{ id: 'e_spore', rate: 0.55 }, { id: 'u_red', rate: 0.05 }, { id: 'h_mushroom', rate: 0.004 }, { id: 'r_phra', rate: 0.03 }, { id: 'r_ori', rate: 0.0008 }, { id: 'c_sporelet', rate: CARD.exp }],
  desc: '빨간 갓에 하얀 점박이. 먹으면 큰일 난다.',
});
mob({
  id: 'toxjelly', name: '독말랑', lv: 9, hp: 175, atk: [14, 19], def: 3, mdef: 10, agi: 8, dex: 16,
  element: 'poison', race: 'plant', size: 'medium', range: 26, delay: 1400, speed: 52, aggressive: false, atkElement: 'poison',
  sprite: 'jelly', palette: ['#b48aff', '#7e4fd6', '#efe4ff'],
  drops: [{ id: 'e_toxin', rate: 0.4 }, { id: 'e_jelly', rate: 0.5 }, { id: 'u_orange', rate: 0.03 }, { id: 'w_cutter', rate: 0.005, slots: 2 }, { id: 'e_gem', rate: 0.002 }, { id: 'q_rainbowdrop', rate: 0.002 }, { id: 'c_toxjelly', rate: CARD.exp }],
  desc: '독을 머금은 보라색 말랑. 맞으면 중독될 수 있다.',
});
mob({
  id: 'pup', name: '꼬마 늑대', lv: 11, hp: 250, atk: [20, 28], def: 4, mdef: 0, agi: 22, dex: 18,
  element: 'earth', race: 'brute', size: 'small', range: 24, delay: 1200, speed: 85, aggressive: false, scale: 0.78,
  sprite: 'wolf', palette: ['#d8b890', '#a8865e', '#fff2e0'],
  drops: [{ id: 'e_milktooth', rate: 0.3 }, { id: 'e_leather', rate: 0.2 }, { id: 'u_meat', rate: 0.12 }, { id: 'f_shoes', rate: 0.003 }, { id: 'r_phra', rate: 0.03 }, { id: 'c_pup', rate: CARD.exp }],
  desc: '숲에서 내려온 어린 늑대. 아직은 장난이 심할 뿐이다.',
});
mob({
  id: 'bunchief', name: '뿔토끼 대장', lv: 13, hp: 2200, atk: [34, 46], def: 8, mdef: 10, agi: 35, dex: 30, luk: 20,
  element: 'neutral', race: 'brute', size: 'medium', range: 30, delay: 1100, speed: 80, aggressive: true, boss: 'field', scale: 1.9, expMul: 22,
  sprite: 'bunny', palette: ['#fff2d8', '#e6c48a', '#ff9aa8'],
  skills: [{ kind: 'charge', cd: 7000, mult: 1.6 }, { kind: 'summon', cd: 14000, summon: 'hornbun', count: 3, below: 0.7 }],
  drops: [{ id: 'e_chiefhorn', rate: 1 }, { id: 'h_bunny', rate: 0.12 }, { id: 'u_orange', rate: 0.6 }, { id: 'f_shoes', rate: 0.08, slots: 1 }, { id: 'r_elu', rate: 0.08 }, { id: 'r_ori', rate: 0.06 }, { id: 'c_bunchief', rate: CARD.boss }],
  desc: '평원 토끼들의 우두머리. 돌진 공격을 조심하자. [필드 보스]',
});

// ── 네잎 언덕 (LOOT: 머리핀·풀잎·네잎클로버)
mob({
  id: 'ladybug', name: '무당벌레', lv: 9, hp: 130, atk: [15, 21], def: 6, mdef: 2, agi: 10, dex: 14, expMul: 0.85,
  element: 'wind', race: 'insect', size: 'small', range: 24, delay: 1400, speed: 60, aggressive: false, flying: true, scale: 0.85,
  sprite: 'bee', palette: ['#ff4a3a', '#1a1a1a', '#f0f6ff'],
  drops: [{ id: 'e_spotshell', rate: 0.5 }, { id: 'e_sticky', rate: 0.1 }, { id: 'u_apple', rate: 0.08 }, { id: 'm_hairpin', rate: 0.004 }, { id: 'x_clover', rate: 0.001 }, { id: 'c_ladybug', rate: CARD.loot }],
  desc: '반짝이는 것을 보면 등껍질 밑에 숨겨 둔다. 가끔 머리핀이 나온다.',
});
mob({
  id: 'sprout', name: '새싹 정령', lv: 11, hp: 190, atk: [19, 25], def: 3, mdef: 12, agi: 4, dex: 14, expMul: 0.85,
  element: 'earth', race: 'plant', size: 'small', range: 24, delay: 1500, speed: 30, aggressive: false, scale: 0.7,
  sprite: 'flower', palette: ['#b8f07a', '#4f9a3a', '#fff6a0'],
  drops: [{ id: 'e_sprout', rate: 0.5 }, { id: 'u_berry', rate: 0.08 }, { id: 'h_leaf', rate: 0.005 }, { id: 'h_leaf', rate: 0.0004, slots: 1 }, { id: 'w_wand', rate: 0.003 }, { id: 'c_sprout', rate: CARD.loot }],
  desc: '언덕 풀밭에서 아장아장 걷는 새싹. 머리에 달린 풀잎이 탐난다.',
});
mob({
  id: 'puffball', name: '민들레 홀씨', lv: 14, hp: 280, atk: [26, 34], def: 0, mdef: 10, agi: 30, dex: 20, expMul: 0.85,
  element: 'wind', race: 'plant', size: 'small', range: 26, delay: 1300, speed: 55, aggressive: false, flying: true, scale: 0.8,
  sprite: 'wisp', palette: ['#fffbe8', '#f0e090', '#ffffff'],
  drops: [{ id: 'e_fluff', rate: 0.5 }, { id: 'u_red', rate: 0.05 }, { id: 'g_hood', rate: 0.004, slots: 1 }, { id: 'x_clover', rate: 0.0025 }, { id: 'x_clover', rate: 0.0003, slots: 1 }, { id: 'c_puffball', rate: CARD.loot }],
  desc: '바람 따라 둥실둥실. 잘 맞지 않지만 맞으면 금방 흩어진다.',
});

// ── 물레방아 수로 (던전 B1, EXP·돈)
mob({
  id: 'rat', name: '수로 쥐', lv: 13, hp: 300, atk: [24, 31], def: 4, mdef: 0, agi: 26, dex: 20,
  element: 'neutral', race: 'brute', size: 'small', range: 24, delay: 1200, speed: 95, aggressive: false, scale: 0.6,
  sprite: 'wolf', palette: ['#8a7a6a', '#5a4a3a', '#d8c8b8'],
  drops: [{ id: 'e_rattail', rate: 0.5 }, { id: 'e_leather', rate: 0.12 }, { id: 'u_meat', rate: 0.06 }, { id: 'w_gauche', rate: 0.003, slots: 2 }, { id: 'h_bandana', rate: 0.003 }, { id: 'a_jacket', rate: 0.004, slots: 1 }, { id: 'c_rat', rate: CARD.dng }],
  desc: '물레방아 밑 수로에 사는 쥐. 반짝이는 건 뭐든 물어 간다.',
});
mob({
  id: 'leech', name: '수로 거머리', lv: 14, hp: 360, atk: [26, 34], def: 2, mdef: 5, agi: 6, dex: 18,
  element: 'water', race: 'insect', size: 'small', range: 22, delay: 1500, speed: 30, aggressive: false,
  sprite: 'worm', palette: ['#4a6a4a', '#2a3a2a', '#a0c0a0'],
  drops: [{ id: 'e_leech', rate: 0.5 }, { id: 'e_sticky', rate: 0.2 }, { id: 'u_orange', rate: 0.03 }, { id: 'r_phra', rate: 0.04 }, { id: 'x_necklace', rate: 0.0008 }, { id: 'c_leech', rate: CARD.dng }],
  desc: '물때 낀 벽을 기어 다닌다. 한번 붙으면 잘 안 떨어진다.',
});
mob({
  id: 'coinbug', name: '동전벌레', lv: 16, hp: 420, atk: [32, 41], def: 18, mdef: 2, agi: 24, dex: 26,
  element: 'earth', race: 'insect', size: 'small', range: 24, delay: 1200, speed: 80, aggressive: true, scale: 0.7,
  sprite: 'scorpion', palette: ['#4a4a5a', '#1a1a2a', '#d0b060'],
  drops: [{ id: 'e_coin', rate: 0.45 }, { id: 'u_orange', rate: 0.03 }, { id: 'r_emver', rate: 0.02 }, { id: 'h_cap', rate: 0.002 }, { id: 'w_smasher', rate: 0.0015 }, { id: 'a_adventure', rate: 0.003, slots: 1 }, { id: 'c_coinbug', rate: CARD.dng }],
  desc: '등껍질 밑에 옛날 동전을 숨겨 두는 벌레. 껍질이 단단하다.',
});
mob({
  id: 'ratking', name: '수로 쥐왕', lv: 20, hp: 7000, atk: [55, 72], def: 12, mdef: 10, agi: 35, dex: 40, luk: 20,
  element: 'neutral', race: 'brute', size: 'medium', range: 30, delay: 1100, speed: 90, aggressive: true, boss: 'field', scale: 1.3, expMul: 22,
  sprite: 'wolf', palette: ['#6a5a50', '#3a2a20', '#ffd040'],
  skills: [{ kind: 'charge', cd: 8000, mult: 1.5 }, { kind: 'summon', cd: 16000, summon: 'rat', count: 3, below: 0.8 }],
  drops: [{ id: 'e_ratking', rate: 1 }, { id: 'w_katana', rate: 0.06, slots: 3 }, { id: 'a_jacket', rate: 0.1, slots: 1 }, { id: 'h_bandana', rate: 0.2 }, { id: 'u_orange', rate: 0.6 }, { id: 'r_ori', rate: 0.1 }, { id: 'r_elu', rate: 0.1 }, { id: 'c_ratking', rate: CARD.boss }],
  desc: '금니를 번뜩이는 수로의 왕. 쥐 떼를 부른다. [필드 보스]',
});

// ── 물레방아 수로 깊은 곳 (던전 B2, LOOT·MVP)
mob({
  id: 'drownjelly', name: '물먹은 말랑', lv: 19, hp: 600, atk: [40, 52], def: 6, mdef: 15, agi: 12, dex: 26,
  element: 'water', race: 'plant', size: 'medium', range: 26, delay: 1400, speed: 44, aggressive: false,
  sprite: 'jelly', palette: ['#7ac8f0', '#3a88c0', '#e8f8ff'],
  drops: [{ id: 'e_wetjelly', rate: 0.5 }, { id: 'e_jelly', rate: 0.4 }, { id: 'u_orange', rate: 0.04 }, { id: 'h_ribbon', rate: 0.003 }, { id: 'x_earring', rate: 0.001 }, { id: 'q_rainbowdrop', rate: 0.004 }, { id: 'c_drownjelly', rate: CARD.dng }],
  desc: '수로 물을 잔뜩 먹고 부풀었다. 찰랑찰랑 소리가 난다.',
});
mob({
  id: 'eel', name: '수로 장어', lv: 21, hp: 720, atk: [44, 57], def: 8, mdef: 10, agi: 30, dex: 34,
  element: 'water', race: 'fish', size: 'medium', range: 28, delay: 1200, speed: 70, aggressive: true, scale: 1.25,
  sprite: 'worm', palette: ['#3a6a8a', '#1a3a5a', '#e0d080'],
  drops: [{ id: 'e_eelskin', rate: 0.45 }, { id: 'u_meat', rate: 0.1 }, { id: 'w_harpoon', rate: 0.004 }, { id: 'w_harpoon', rate: 0.0008, slots: 2 }, { id: 'r_emver', rate: 0.025 }, { id: 'c_eel', rate: CARD.dng }],
  desc: '어두운 물속에서 번개처럼 튀어나온다. 구우면 맛있다는 소문.',
});
mob({
  id: 'jellyking', name: '말랑 대왕', lv: 25, hp: 24000, atk: [95, 130], def: 18, mdef: 25, agi: 20, dex: 55, luk: 30,
  element: 'water', race: 'plant', size: 'large', range: 34, delay: 1300, speed: 44, aggressive: true, boss: 'mvp', scale: 2.6, expMul: 70,
  sprite: 'jelly', palette: ['#ffd36a', '#ffa83a', '#fff8d8'],
  skills: [{ kind: 'slam', cd: 6500, mult: 1.8, radius: 100 }, { kind: 'summon', cd: 12000, summon: 'drownjelly', count: 3 }, { kind: 'heal', cd: 20000, below: 0.4 }],
  drops: [{ id: 'e_kingjelly', rate: 1 }, { id: 'h_crown', rate: 0.1 }, { id: 'u_yellow', rate: 1 }, { id: 'x_clip', rate: 0.15, slots: 1 }, { id: 'h_jelly', rate: 0.05 }, { id: 'r_ori', rate: 0.3 }, { id: 'r_elu', rate: 0.3 }, { id: 'c_jellyking', rate: CARD.mvp }],
  desc: '수로 밑바닥에 사는 왕관 쓴 말랑. 내려찍기에 맞으면 아프다. [MVP]',
});

// ═══════════════════════════ 속삭이는 숲 지방 (Lv 15–38)
// ── 속삭이는 숲 (EXP)
mob({
  id: 'wolf', name: '회색 늑대', lv: 16, hp: 420, atk: [30, 40], def: 5, mdef: 0, agi: 32, dex: 26,
  element: 'earth', race: 'brute', size: 'medium', range: 26, delay: 1100, speed: 105, aggressive: true,
  sprite: 'wolf', palette: ['#9aa0aa', '#6c7280', '#e6e8ee'],
  drops: [{ id: 'e_claw', rate: 0.45 }, { id: 'e_leather', rate: 0.3 }, { id: 'u_meat', rate: 0.2 }, { id: 'w_saber', rate: 0.003, slots: 2 }, { id: 'x_brooch', rate: 0.0015 }, { id: 'q_moonfur', rate: 0.004 }, { id: 'c_wolf', rate: CARD.exp }],
  desc: '무리 지어 사냥하는 늑대. 빠르고 공격적이다.',
});
mob({
  id: 'stingbee', name: '꿀벌 병정', lv: 18, hp: 380, atk: [33, 44], def: 4, mdef: 5, agi: 44, dex: 32,
  element: 'wind', race: 'insect', size: 'small', range: 26, delay: 1000, speed: 95, aggressive: true, flying: true, atkElement: 'wind',
  sprite: 'bee', palette: ['#ffd23a', '#3a2a1a', '#e8f6ff'],
  drops: [{ id: 'e_stinger', rate: 0.45 }, { id: 'u_honey', rate: 0.1 }, { id: 'w_stiletto', rate: 0.003, slots: 2 }, { id: 'x_glove', rate: 0.0015 }, { id: 'r_emver', rate: 0.03 }, { id: 'c_stingbee', rate: CARD.exp }],
  desc: '숲의 꿀을 지키는 벌. 침이 날카롭다.',
});
mob({
  id: 'mandra', name: '맨드라 꽃', lv: 15, hp: 480, atk: [24, 34], def: 2, mdef: 25, agi: 1, dex: 34,
  element: 'earth', race: 'plant', size: 'medium', range: 70, delay: 1300, speed: 0, aggressive: true, immobile: true, atkElement: 'earth',
  sprite: 'flower', palette: ['#ff8ad0', '#5fae5a', '#fff0a0'],
  drops: [{ id: 'e_petal', rate: 0.55 }, { id: 'e_root', rate: 0.3 }, { id: 'u_berry', rate: 0.06 }, { id: 'w_wand', rate: 0.004, slots: 2 }, { id: 'x_earring', rate: 0.0015 }, { id: 'c_mandra', rate: CARD.exp }],
  desc: '땅에 뿌리박고 덩굴로 후려친다. 움직이지 않는다.',
});
mob({
  id: 'shroom', name: '큰버섯', lv: 20, hp: 660, atk: [38, 50], def: 8, mdef: 15, agi: 10, dex: 26,
  element: 'earth', race: 'plant', size: 'medium', range: 26, delay: 1500, speed: 42, aggressive: false,
  sprite: 'mushroom', palette: ['#c8a0ff', '#fff4e0', '#ffe8d0'],
  scale: 1.35,
  drops: [{ id: 'e_bigspore', rate: 0.55 }, { id: 'u_orange', rate: 0.06 }, { id: 'h_mushroom', rate: 0.01 }, { id: 'a_mantle', rate: 0.003, slots: 1 }, { id: 'r_ori', rate: 0.002 }, { id: 'c_shroom', rate: CARD.exp }],
  desc: '사람만 한 보라색 버섯. 느긋하지만 단단하다.',
});
mob({
  id: 'mossjelly', name: '이끼 말랑', lv: 22, hp: 700, atk: [42, 56], def: 10, mdef: 20, agi: 16, dex: 30,
  element: 'wind', race: 'plant', size: 'medium', range: 26, delay: 1300, speed: 54, aggressive: false,
  sprite: 'jelly', palette: ['#8fd46a', '#4f9a3a', '#e8ffd8'],
  drops: [{ id: 'e_moss', rate: 0.5 }, { id: 'e_jelly', rate: 0.5 }, { id: 'u_honey', rate: 0.03 }, { id: 'g_muffler', rate: 0.004, slots: 1 }, { id: 'r_elu', rate: 0.002 }, { id: 'c_mossjelly', rate: CARD.exp }],
  desc: '이끼를 뒤집어쓴 말랑. 숲에 숨어 있으면 보이지 않는다.',
});
mob({
  id: 'silverfang', name: '은빛 늑대왕', lv: 27, hp: 11000, atk: [85, 112], def: 18, mdef: 15, agi: 60, dex: 60, luk: 30,
  element: 'earth', race: 'brute', size: 'large', range: 32, delay: 950, speed: 120, aggressive: true, boss: 'field', scale: 1.7, expMul: 22,
  sprite: 'wolf', palette: ['#dfe6f4', '#9fb0d0', '#ffffff'],
  skills: [{ kind: 'howl', cd: 20000, summon: 'wolf', count: 2, below: 0.85 }, { kind: 'charge', cd: 7000, mult: 1.6 }],
  drops: [{ id: 'e_silverfur', rate: 1 }, { id: 'q_moonfur', rate: 0.25 }, { id: 'h_cat', rate: 0.1 }, { id: 'g_manteau', rate: 0.08, slots: 1 }, { id: 'x_brooch', rate: 0.1 }, { id: 'r_ori', rate: 0.25 }, { id: 'u_white', rate: 0.6 }, { id: 'c_silverfang', rate: CARD.boss }],
  desc: '숲의 왕. 울부짖으면 늑대들이 모여든다. [필드 보스]',
});

// ── 깊은 숲 (LOOT: 수호석·나무 갑옷·활)
mob({
  id: 'firefly', name: '반딧불이', lv: 24, hp: 850, atk: [56, 70], def: 2, mdef: 20, agi: 48, dex: 40, expMul: 0.85,
  element: 'fire', race: 'insect', size: 'small', range: 26, delay: 1100, speed: 85, aggressive: true, flying: true, scale: 0.8,
  sprite: 'bee', palette: ['#e8ff70', '#3a4a1a', '#fffbe0'],
  drops: [{ id: 'e_glowdust', rate: 0.45 }, { id: 'u_honey', rate: 0.04 }, { id: 'a_tights', rate: 0.002, slots: 1 }, { id: 'x_glove', rate: 0.0012 }, { id: 'x_glove', rate: 0.0002, slots: 1 }, { id: 'c_firefly', rate: CARD.loot }],
  desc: '깊은 숲을 밝히는 불빛 무리. 불씨를 품고 있어 물에 약하다.',
});
mob({
  id: 'bear', name: '꿀곰', lv: 27, hp: 1500, atk: [80, 100], def: 15, mdef: 5, agi: 20, dex: 40, expMul: 0.85,
  element: 'earth', race: 'brute', size: 'large', range: 30, delay: 1500, speed: 60, aggressive: false, scale: 0.9,
  sprite: 'yeti', palette: ['#b07a4a', '#7a4a2a', '#3a2a1a'],
  drops: [{ id: 'e_honeypaw', rate: 0.45 }, { id: 'u_honey', rate: 0.15 }, { id: 'u_berry', rate: 0.15 }, { id: 'a_bearhide', rate: 0.0015 }, { id: 'x_necklace', rate: 0.0012 }, { id: 'x_necklace', rate: 0.0002, slots: 1 }, { id: 'c_bear', rate: CARD.loot }],
  desc: '꿀만 있으면 순하다. 건드리면 앞발 한 방이 무겁다.',
});
mob({
  id: 'stump', name: '그루터기', lv: 29, hp: 1700, atk: [76, 94], def: 22, mdef: 15, agi: 5, dex: 40, expMul: 0.85,
  element: 'earth', race: 'plant', size: 'medium', range: 28, delay: 1600, speed: 24, aggressive: false, scale: 0.6,
  sprite: 'treant', palette: ['#8a6a4a', '#7aa05a', '#d0f0a0'],
  drops: [{ id: 'e_oldbark', rate: 0.5 }, { id: 'e_root', rate: 0.25 }, { id: 'r_elu', rate: 0.006 }, { id: 'a_wooden', rate: 0.003, slots: 1 }, { id: 'w_composite', rate: 0.003, slots: 2 }, { id: 'w_greatbow', rate: 0.001, slots: 1 }, { id: 'c_stump', rate: CARD.loot }],
  desc: '베어진 고목의 그루터기가 걸어 다닌다. 나무 장비와 수호석을 품고 있다.',
});

// ── 고목의 심장 (던전, MVP)
mob({
  id: 'dryad', name: '나무 요정', lv: 32, hp: 1500, atk: [86, 108], def: 5, mdef: 35, agi: 50, dex: 60, expMul: 0.9,
  element: 'wind', race: 'plant', size: 'small', range: 90, delay: 1400, speed: 70, aggressive: true, flying: true, atkElement: 'wind',
  sprite: 'wisp', palette: ['#c8ffb0', '#5ab04a', '#ffffff'],
  drops: [{ id: 'e_dew', rate: 0.45 }, { id: 'u_blue', rate: 0.02 }, { id: 'u_berry', rate: 0.1 }, { id: 'w_staff', rate: 0.002, slots: 2 }, { id: 'w_gakkung', rate: 0.0006 }, { id: 'x_earring', rate: 0.0012 }, { id: 'x_earring', rate: 0.0002, slots: 1 }, { id: 'c_dryad', rate: CARD.dng }],
  desc: '고목 안에 깃든 요정. 잎사귀 바람을 쏘아 보낸다.',
});
mob({
  id: 'beetle', name: '사슴벌레', lv: 33, hp: 2000, atk: [92, 116], def: 35, mdef: 5, agi: 25, dex: 50, expMul: 0.9,
  element: 'earth', race: 'insect', size: 'medium', range: 28, delay: 1300, speed: 60, aggressive: true,
  sprite: 'scorpion', palette: ['#5a3a2a', '#2a1a10', '#c09060'],
  drops: [{ id: 'e_beetlehorn', rate: 0.45 }, { id: 'u_yellow', rate: 0.03 }, { id: 's_buckler', rate: 0.002, slots: 1 }, { id: 'w_hammer', rate: 0.001 }, { id: 'r_ori', rate: 0.003 }, { id: 'c_beetle', rate: CARD.dng }],
  desc: '고목 수액을 지키는 커다란 집게. 껍질이 매우 단단하다.',
});
mob({
  id: 'treant', name: '고목 정령', lv: 38, hp: 70000, atk: [150, 210], def: 30, mdef: 40, agi: 20, dex: 80, luk: 40,
  element: 'earth', race: 'plant', size: 'large', range: 40, delay: 1500, speed: 34, aggressive: true, boss: 'mvp', scale: 2.4, expMul: 70,
  sprite: 'treant', palette: ['#7a5a3a', '#5aa04a', '#c8f0a0'],
  skills: [{ kind: 'roots', cd: 7000, mult: 1.6, radius: 80 }, { kind: 'heal', cd: 18000, below: 0.5 }, { kind: 'summon', cd: 16000, summon: 'dryad', count: 2 }],
  drops: [{ id: 'e_branch', rate: 1 }, { id: 'h_angel', rate: 0.06 }, { id: 'w_gakkung', rate: 0.1, slots: 1 }, { id: 'w_arcwand', rate: 0.1, slots: 2 }, { id: 'u_royal', rate: 0.5 }, { id: 'r_ori', rate: 0.5 }, { id: 'r_elu', rate: 0.5 }, { id: 'c_treant', rate: CARD.mvp }],
  desc: '숲만큼 오래 산 나무의 정령. 고목의 심장 가장 안쪽에 산다. [MVP]',
});

// ═══════════════════════════ 잿빛 광산 지방 (Lv 27–50)
// ── 잿빛 채석장 (EXP, 땅·무형 → 불속성)
mob({
  id: 'pebble', name: '조약돌 골렘', lv: 28, hp: 1300, atk: [72, 90], def: 30, mdef: 10, agi: 10, dex: 36, expMul: 1.1,
  element: 'earth', race: 'formless', size: 'small', range: 26, delay: 1600, speed: 40, aggressive: false, scale: 0.6,
  sprite: 'golem', palette: ['#a8a8a0', '#6a6a64', '#e0e0d8'],
  drops: [{ id: 'e_pebble', rate: 0.5 }, { id: 'r_phra', rate: 0.05 }, { id: 'r_emver', rate: 0.03 }, { id: 'u_yellow', rate: 0.02 }, { id: 'w_mace', rate: 0.002, slots: 3 }, { id: 'c_pebble', rate: CARD.exp }],
  desc: '굴러다니는 돌이 뭉쳐 일어섰다. 단단하지만 불에 잘 부서진다.',
});
mob({
  id: 'rockworm', name: '바위 지렁이', lv: 30, hp: 1500, atk: [80, 98], def: 20, mdef: 5, agi: 15, dex: 40,
  element: 'earth', race: 'insect', size: 'medium', range: 26, delay: 1500, speed: 36, aggressive: false, scale: 1.3,
  sprite: 'worm', palette: ['#9a8a7a', '#5a4a3a', '#d8c8a8'],
  drops: [{ id: 'e_rockskin', rate: 0.45 }, { id: 'e_sticky', rate: 0.2 }, { id: 'u_yellow', rate: 0.03 }, { id: 'f_boots', rate: 0.0015 }, { id: 'r_ori', rate: 0.002 }, { id: 'c_rockworm', rate: CARD.exp }],
  desc: '바위를 갉아 먹으며 자란 지렁이. 지나간 자리에 굴이 남는다.',
});
mob({
  id: 'fangbat', name: '송곳니 박쥐', lv: 28, hp: 900, atk: [62, 82], def: 5, mdef: 5, agi: 64, dex: 50,
  element: 'shadow', race: 'brute', size: 'small', range: 24, delay: 900, speed: 110, aggressive: true, flying: true,
  sprite: 'bat', palette: ['#5a4a6a', '#3a2a4a', '#ff5a7a'],
  drops: [{ id: 'e_batwing', rate: 0.55 }, { id: 'u_orange', rate: 0.05 }, { id: 'f_boots', rate: 0.002, slots: 1 }, { id: 'x_necklace', rate: 0.0015 }, { id: 'c_fangbat', rate: CARD.exp }],
  desc: '동굴 천장에 매달려 있다가 덮친다. 매우 빠르다.',
});
mob({
  id: 'quarrygolem', name: '채석장 거인', lv: 36, hp: 22000, atk: [150, 190], def: 45, mdef: 20, agi: 15, dex: 70, luk: 20,
  element: 'earth', race: 'formless', size: 'large', range: 34, delay: 1600, speed: 40, aggressive: true, boss: 'field', scale: 1.6, expMul: 22,
  sprite: 'golem', palette: ['#8a8a84', '#5a5a54', '#ffb040'],
  skills: [{ kind: 'slam', cd: 7500, mult: 1.8, radius: 90 }, { kind: 'summon', cd: 16000, summon: 'pebble', count: 2, below: 0.6 }],
  drops: [{ id: 'e_heartstone', rate: 1 }, { id: 'w_pike', rate: 0.08, slots: 2 }, { id: 'w_hammer', rate: 0.08 }, { id: 'h_helm', rate: 0.1 }, { id: 'u_white', rate: 0.6 }, { id: 'r_ori', rate: 0.4 }, { id: 'r_elu', rate: 0.3 }, { id: 'c_quarrygolem', rate: CARD.boss }],
  desc: '채석장의 바위산이 통째로 일어섰다. 광산과 사막으로 가는 길을 막고 있다. [필드 보스]',
});

// ── 버려진 광산 1층 (던전, 광석 맵)
mob({
  id: 'skelminer', name: '해골 광부', lv: 32, hp: 1700, atk: [88, 110], def: 18, mdef: 8, agi: 25, dex: 45,
  element: 'undead', race: 'undead', size: 'medium', range: 28, delay: 1300, speed: 60, aggressive: true,
  sprite: 'skeleton', palette: ['#e0d8c0', '#a89878', '#8a7a6a'],
  drops: [{ id: 'e_pickaxe', rate: 0.4 }, { id: 'q_runeshard', rate: 0.02 }, { id: 'r_ori', rate: 0.008 }, { id: 'r_elu', rate: 0.006 }, { id: 'w_battleaxe', rate: 0.003, slots: 3 }, { id: 'm_minergog', rate: 0.002 }, { id: 'w_gladius', rate: 0.0015, slots: 1 }, { id: 'c_skelminer', rate: CARD.dng }],
  desc: '죽어서도 곡괭이질을 멈추지 않는다. 별철과 수호석을 주워 모은다.',
});
mob({
  id: 'orejelly', name: '광석 말랑', lv: 31, hp: 1600, atk: [84, 104], def: 25, mdef: 20, agi: 15, dex: 40,
  element: 'earth', race: 'plant', size: 'medium', range: 26, delay: 1500, speed: 40, aggressive: false,
  sprite: 'jelly', palette: ['#a0a8b8', '#606878', '#e8f0ff'],
  drops: [{ id: 'e_orejelly', rate: 0.45 }, { id: 'e_jelly', rate: 0.3 }, { id: 'r_emver', rate: 0.04 }, { id: 'r_ori', rate: 0.004 }, { id: 'e_gem', rate: 0.004 }, { id: 'x_ring', rate: 0.001 }, { id: 'c_orejelly', rate: CARD.dng }],
  desc: '광석 가루를 먹고 사는 말랑. 몸속에서 가끔 반짝이는 게 보인다.',
});
mob({
  id: 'foreman', name: '해골 십장', lv: 38, hp: 24000, atk: [160, 205], def: 30, mdef: 15, agi: 30, dex: 80, luk: 20,
  element: 'undead', race: 'undead', size: 'large', range: 36, delay: 1300, speed: 60, aggressive: true, boss: 'field', scale: 1.4, expMul: 22,
  sprite: 'skeleton_knight', palette: ['#d8d0b8', '#7a6a50', '#d07030'],
  skills: [{ kind: 'slam', cd: 7500, mult: 1.8, radius: 85 }, { kind: 'summon', cd: 15000, summon: 'skelminer', count: 2 }],
  drops: [{ id: 'e_whistle', rate: 1 }, { id: 'q_runeshard', rate: 1 }, { id: 'w_morning', rate: 0.08, slots: 1 }, { id: 'w_bastard', rate: 0.08, slots: 2 }, { id: 'l_foremanpipe', rate: 0.1 }, { id: 'x_ring', rate: 0.1 }, { id: 'r_ori', rate: 0.5 }, { id: 'c_foreman', rate: CARD.boss }],
  desc: '광부들을 부리던 십장. 호루라기 소리에 해골들이 일어선다. [필드 보스]',
});

// ── 망자의 동굴 (광산 2층, EXP·불사 → 성/불속성)
mob({
  id: 'skeleton', name: '해골 병사', lv: 34, hp: 1850, atk: [95, 120], def: 15, mdef: 10, agi: 30, dex: 48,
  element: 'undead', race: 'undead', size: 'medium', range: 28, delay: 1200, speed: 70, aggressive: true,
  sprite: 'skeleton', palette: ['#f0ecd8', '#b8b090', '#7a6a50'],
  drops: [{ id: 'e_bone', rate: 0.5 }, { id: 'u_yellow', rate: 0.04 }, { id: 'w_tsurugi', rate: 0.0015, slots: 1 }, { id: 'x_ring', rate: 0.0015 }, { id: 'r_ori', rate: 0.004 }, { id: 'c_skeleton', rate: CARD.exp }],
  desc: '녹슨 검을 든 해골. 성스러운 힘에 약하다.',
});
mob({
  id: 'shambler', name: '좀비', lv: 36, hp: 2700, atk: [100, 128], def: 5, mdef: 5, agi: 5, dex: 38,
  element: 'undead', race: 'undead', size: 'medium', range: 26, delay: 1600, speed: 36, aggressive: true,
  sprite: 'zombie', palette: ['#8fae7a', '#5a7a4a', '#7a5a8a'],
  drops: [{ id: 'e_zombienail', rate: 0.55 }, { id: 'u_white', rate: 0.02 }, { id: 'a_chain', rate: 0.002, slots: 1 }, { id: 'w_morning', rate: 0.0012 }, { id: 'r_elu', rate: 0.004 }, { id: 'c_shambler', rate: CARD.exp }],
  desc: '느리지만 끈질기다. 불과 성스러운 힘에 약하다.',
});
mob({
  id: 'wisp', name: '유령등불', lv: 38, hp: 1700, atk: [108, 135], def: 0, mdef: 40, agi: 55, dex: 64,
  element: 'ghost', race: 'demon', size: 'small', range: 30, delay: 1200, speed: 80, aggressive: true, flying: true, atkElement: 'ghost',
  sprite: 'wisp', palette: ['#c8f4ff', '#7ad0f0', '#ffffff'],
  drops: [{ id: 'e_ectoplasm', rate: 0.45 }, { id: 'u_blue', rate: 0.03 }, { id: 'a_silk', rate: 0.003, slots: 1 }, { id: 'x_rosary', rate: 0.0015 }, { id: 'e_gem', rate: 0.004 }, { id: 'c_wisp', rate: CARD.exp }],
  desc: '떠도는 혼불. 무속성 공격은 거의 통하지 않는다!',
});
mob({
  id: 'bonearcher', name: '해골 궁수', lv: 40, hp: 2200, atk: [118, 150], def: 10, mdef: 10, agi: 40, dex: 90,
  element: 'undead', race: 'undead', size: 'medium', range: 160, delay: 1500, speed: 60, aggressive: true,
  sprite: 'skeleton_archer', palette: ['#f0ecd8', '#b8b090', '#5a8a5a'],
  drops: [{ id: 'e_arrowhead', rate: 0.5 }, { id: 'am_silver', rate: 0.01 }, { id: 'h_apple', rate: 0.0012 }, { id: 'w_crossbow', rate: 0.002, slots: 2 }, { id: 'x_glove', rate: 0.0015 }, { id: 'r_ori', rate: 0.004 }, { id: 'c_bonearcher', rate: CARD.exp }],
  desc: '멀리서 화살을 쏜다. 후방을 노리니 조심.',
});
mob({
  id: 'boneknight', name: '해골 기사', lv: 44, hp: 32000, atk: [220, 290], def: 38, mdef: 20, agi: 40, dex: 95, luk: 30,
  element: 'undead', race: 'undead', size: 'large', range: 36, delay: 1250, speed: 70, aggressive: true, boss: 'field', scale: 1.7, expMul: 22,
  sprite: 'skeleton_knight', palette: ['#f0ecd8', '#8090a8', '#c03040'],
  skills: [{ kind: 'slam', cd: 7500, mult: 1.9, radius: 90 }, { kind: 'charge', cd: 9000, mult: 1.7 }, { kind: 'summon', cd: 16000, summon: 'skeleton', count: 2, below: 0.7 }],
  drops: [{ id: 'e_knightcrest', rate: 1 }, { id: 'h_bonehelm', rate: 0.08 }, { id: 'w_claymore', rate: 0.06, slots: 1 }, { id: 'a_plate', rate: 0.05, slots: 1 }, { id: 's_shield', rate: 0.08, slots: 1 }, { id: 'u_white', rate: 1 }, { id: 'r_ori', rate: 0.5 }, { id: 'c_boneknight', rate: CARD.boss }],
  desc: '죽어서도 검을 놓지 않은 기사. 갱도 아래층을 지킨다. [필드 보스]',
});

// ── 망령의 갱도 (광산 3층, MVP)
mob({
  id: 'bonehound', name: '해골 사냥개', lv: 42, hp: 2800, atk: [130, 165], def: 18, mdef: 10, agi: 60, dex: 60,
  element: 'undead', race: 'undead', size: 'medium', range: 26, delay: 1000, speed: 115, aggressive: true,
  sprite: 'wolf', palette: ['#e8e0c8', '#a89878', '#ff5a3a'],
  drops: [{ id: 'e_bonefang', rate: 0.5 }, { id: 'u_white', rate: 0.02 }, { id: 'f_boots', rate: 0.0015, slots: 1 }, { id: 'x_necklace', rate: 0.0003, slots: 1 }, { id: 'c_bonehound', rate: CARD.dng }],
  desc: '뼈만 남은 사냥개. 냄새도 없이 달려든다.',
});
mob({
  id: 'phantom', name: '갱도 망령', lv: 45, hp: 2600, atk: [140, 175], def: 5, mdef: 45, agi: 55, dex: 75,
  element: 'ghost', race: 'demon', size: 'small', range: 30, delay: 1200, speed: 75, aggressive: true, flying: true, atkElement: 'ghost', scale: 0.6,
  sprite: 'wraith', palette: ['#4a4a6a', '#9a8ad0', '#80ffd0'],
  drops: [{ id: 'e_chain', rate: 0.4 }, { id: 'u_blue', rate: 0.03 }, { id: 'g_ragcape', rate: 0.002 }, { id: 'w_katar', rate: 0.0015, slots: 1 }, { id: 'w_damascus', rate: 0.0006 }, { id: 'c_phantom', rate: CARD.dng }],
  desc: '무너진 갱도에 갇힌 광부의 넋. 무속성 공격은 거의 통하지 않는다.',
});
mob({
  id: 'wraith', name: '망령 군주', lv: 50, hp: 130000, atk: [330, 480], def: 45, mdef: 60, agi: 60, dex: 120, luk: 50,
  element: 'undead', race: 'demon', size: 'large', range: 40, delay: 1300, speed: 60, aggressive: true, boss: 'mvp', scale: 2.2, expMul: 70, flying: true,
  sprite: 'wraith', palette: ['#3a2a5a', '#8a5ad0', '#ff5a8a'],
  skills: [{ kind: 'bolt', cd: 3500, mult: 1.5, element: 'shadow' }, { kind: 'slam', cd: 8000, mult: 2.2, radius: 110, element: 'shadow' }, { kind: 'summon', cd: 14000, summon: 'phantom', count: 3 }, { kind: 'heal', cd: 25000, below: 0.3 }],
  drops: [{ id: 'e_darkcrystal', rate: 1 }, { id: 'h_horns', rate: 0.05 }, { id: 'h_tiara', rate: 0.08 }, { id: 'w_damascus', rate: 0.08, slots: 2 }, { id: 'w_sage', rate: 0.08, slots: 1 }, { id: 'w_buster', rate: 0.06, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_wraith', rate: CARD.mvp }],
  desc: '광산 가장 깊은 곳의 지배자. 어둠의 마법을 쓴다. [MVP]',
});

// ═══════════════════════════ 작열하는 사막 지방 (Lv 44–66)
// ── 작열하는 사막 (EXP, 불 → 물속성 / 땅 → 불속성)
mob({
  id: 'sandjelly', name: '모래 말랑', lv: 45, hp: 3200, atk: [118, 148], def: 20, mdef: 20, agi: 30, dex: 60,
  element: 'earth', race: 'plant', size: 'medium', range: 26, delay: 1300, speed: 50, aggressive: false,
  sprite: 'jelly', palette: ['#f0d890', '#c89a48', '#fff8e0'],
  drops: [{ id: 'e_sand', rate: 0.5 }, { id: 'e_jelly', rate: 0.4 }, { id: 'u_yellow', rate: 0.05 }, { id: 'r_emver', rate: 0.04 }, { id: 'w_jamadhar', rate: 0.0015, slots: 2 }, { id: 'c_sandjelly', rate: CARD.exp }],
  desc: '모래를 뒤집어쓴 말랑. 뜨거운 햇볕에도 끄떡없다.',
});
mob({
  id: 'scorpion', name: '사막 전갈', lv: 48, hp: 3800, atk: [138, 172], def: 30, mdef: 10, agi: 45, dex: 70,
  element: 'fire', race: 'insect', size: 'small', range: 26, delay: 1100, speed: 80, aggressive: true, atkElement: 'poison',
  sprite: 'scorpion', palette: ['#d0603a', '#8a3020', '#ffd080'],
  drops: [{ id: 'e_stingtail', rate: 0.45 }, { id: 'u_yellow', rate: 0.05 }, { id: 'w_jur', rate: 0.0012, slots: 3 }, { id: 'r_ori', rate: 0.004 }, { id: 'q_mapscrap', rate: 0.0012 }, { id: 'c_scorpion', rate: CARD.exp }],
  desc: '독침을 치켜든 붉은 전갈. 먼저 덤벼든다. 물속성에 약하다.',
});
mob({
  id: 'jackal', name: '사막 자칼', lv: 50, hp: 4200, atk: [150, 185], def: 15, mdef: 10, agi: 72, dex: 72,
  element: 'fire', race: 'brute', size: 'medium', range: 26, delay: 950, speed: 115, aggressive: true,
  sprite: 'wolf', palette: ['#d8b070', '#a07840', '#fff0d0'],
  drops: [{ id: 'e_fang', rate: 0.45 }, { id: 'u_meat', rate: 0.2 }, { id: 'w_huntbow', rate: 0.0015 }, { id: 'f_greaves', rate: 0.001, slots: 1 }, { id: 'q_mapscrap', rate: 0.002 }, { id: 'c_jackal', rate: CARD.exp }],
  desc: '모래바람처럼 빠른 자칼. 무리 지어 다닌다.',
});
mob({
  id: 'sandgolem', name: '모래 골렘', lv: 55, hp: 7500, atk: [188, 236], def: 45, mdef: 20, agi: 10, dex: 50, scale: 1.1, expMul: 1.1,
  element: 'earth', race: 'formless', size: 'large', range: 30, delay: 1700, speed: 32, aggressive: false,
  sprite: 'golem', palette: ['#d0a860', '#8a6a3a', '#ffe0a0'],
  drops: [{ id: 'e_golemcore', rate: 0.5 }, { id: 'r_ori', rate: 0.008 }, { id: 'w_partizan', rate: 0.0012, slots: 1 }, { id: 'c_sandgolem', rate: CARD.exp }],
  desc: '사막의 돌이 뭉쳐 움직인다. 방어가 단단하니 불속성으로 공략하자.',
});
mob({
  id: 'scorpking', name: '전갈왕', lv: 56, hp: 46000, atk: [330, 420], def: 50, mdef: 30, agi: 60, dex: 110, luk: 30,
  element: 'fire', race: 'insect', size: 'large', range: 36, delay: 1150, speed: 85, aggressive: true, boss: 'field', scale: 2, expMul: 22, atkElement: 'poison',
  sprite: 'scorpion', palette: ['#ffb040', '#a05010', '#fff0a0'],
  skills: [{ kind: 'charge', cd: 7000, mult: 1.7 }, { kind: 'slam', cd: 8500, mult: 1.9, radius: 95, element: 'fire' }, { kind: 'summon', cd: 16000, summon: 'scorpion', count: 2, below: 0.7 }],
  drops: [{ id: 'e_kingstinger', rate: 1 }, { id: 'q_mapscrap', rate: 0.5 }, { id: 'w_bloodfang', rate: 0.03 }, { id: 'w_flamberge', rate: 0.06, slots: 1 }, { id: 'a_assassin', rate: 0.06, slots: 1 }, { id: 'u_white', rate: 1 }, { id: 'r_ori', rate: 0.6 }, { id: 'c_scorpking', rate: CARD.boss }],
  desc: '사막의 지배자. 집게로 내리찍고 독침을 꽂는다. [필드 보스]',
});

// ── 신기루 오아시스 (LOOT)
mob({
  id: 'cactus', name: '선인장 병정', lv: 47, hp: 3400, atk: [160, 200], def: 25, mdef: 15, agi: 5, dex: 70, expMul: 0.85,
  element: 'earth', race: 'plant', size: 'medium', range: 80, delay: 1500, speed: 0, aggressive: true, immobile: true, atkElement: 'earth',
  sprite: 'flower', palette: ['#7ac85a', '#3a7a2a', '#ffe070'],
  drops: [{ id: 'e_needle', rate: 0.45 }, { id: 'u_cactus', rate: 0.08 }, { id: 'x_glove', rate: 0.0012 }, { id: 'x_glove', rate: 0.0002, slots: 1 }, { id: 'q_mapscrap', rate: 0.0015 }, { id: 'c_cactus', rate: CARD.loot }],
  desc: '오아시스 둘레를 지키는 선인장. 가시를 쏘아 댄다.',
});
mob({
  id: 'crab', name: '오아시스 게', lv: 49, hp: 3800, atk: [170, 210], def: 40, mdef: 10, agi: 20, dex: 60, expMul: 0.85,
  element: 'water', race: 'fish', size: 'small', range: 26, delay: 1300, speed: 55, aggressive: false, scale: 0.8,
  sprite: 'scorpion', palette: ['#ff7a5a', '#a03a2a', '#ffe0c0'],
  drops: [{ id: 'e_crabshell', rate: 0.45 }, { id: 'u_meat', rate: 0.12 }, { id: 's_crabshield', rate: 0.0012 }, { id: 'm_piratepatch', rate: 0.002 }, { id: 'q_mapscrap', rate: 0.0015 }, { id: 'c_crab', rate: CARD.loot }],
  desc: '오아시스 물가를 옆으로 걷는 게. 물속성이라 바람에 약하다.',
});
mob({
  id: 'mirage', name: '신기루 정령', lv: 52, hp: 3600, atk: [180, 220], def: 5, mdef: 50, agi: 70, dex: 90, expMul: 0.85,
  element: 'wind', race: 'formless', size: 'small', range: 100, delay: 1500, speed: 75, aggressive: true, flying: true, atkElement: 'wind',
  sprite: 'wisp', palette: ['#ffe8a0', '#ffb040', '#ffffff'],
  drops: [{ id: 'e_mirage', rate: 0.4 }, { id: 'u_conv_earth', rate: 0.01 }, { id: 'm_oasisglass', rate: 0.002 }, { id: 'x_earring', rate: 0.0003, slots: 1 }, { id: 'c_mirage', rate: CARD.loot }],
  desc: '아지랑이가 모여 생긴 정령. 바람속성이라 땅속성 공격이 잘 든다.',
});

// ── 피라미드 1층 (던전, EXP·불사/곤충)
mob({
  id: 'mummy', name: '미라', lv: 52, hp: 5200, atk: [160, 200], def: 15, mdef: 20, agi: 20, dex: 60,
  element: 'undead', race: 'undead', size: 'medium', range: 26, delay: 1500, speed: 40, aggressive: true,
  sprite: 'zombie', palette: ['#e8dcc0', '#a89070', '#c8b090'],
  drops: [{ id: 'e_bandage', rate: 0.6 }, { id: 'u_white', rate: 0.04 }, { id: 'l_bandmask', rate: 0.002 }, { id: 'a_priest', rate: 0.0012, slots: 1 }, { id: 'r_elu', rate: 0.005 }, { id: 'c_mummy', rate: CARD.dng }],
  desc: '붕대에 감긴 고대인. 불과 성스러운 힘에 약하다.',
});
mob({
  id: 'scarab', name: '황금 풍뎅이', lv: 51, hp: 4200, atk: [180, 220], def: 45, mdef: 10, agi: 35, dex: 70,
  element: 'earth', race: 'insect', size: 'small', range: 24, delay: 1100, speed: 80, aggressive: true, scale: 0.65,
  sprite: 'scorpion', palette: ['#ffd24a', '#a07010', '#fff8c0'],
  drops: [{ id: 'e_scarab', rate: 0.45 }, { id: 'u_yellow', rate: 0.05 }, { id: 'e_gem', rate: 0.006 }, { id: 'x_scarab', rate: 0.0015 }, { id: 'x_scarab', rate: 0.0002, slots: 1 }, { id: 'w_goldmace', rate: 0.0004 }, { id: 'c_scarab', rate: CARD.dng }],
  desc: '피라미드 벽을 기어 다니는 황금빛 풍뎅이. 껍질이 금처럼 단단하다.',
});
mob({
  id: 'tombguard', name: '무덤 파수꾼', lv: 55, hp: 5400, atk: [210, 260], def: 40, mdef: 15, agi: 30, dex: 80,
  element: 'undead', race: 'undead', size: 'medium', range: 30, delay: 1300, speed: 55, aggressive: true,
  sprite: 'skeleton_knight', palette: ['#e0d0a0', '#a08040', '#40a0c0'],
  drops: [{ id: 'e_tombseal', rate: 0.4 }, { id: 'u_white', rate: 0.04 }, { id: 'w_claymore', rate: 0.0008 }, { id: 's_shield', rate: 0.0006, slots: 1 }, { id: 'f_greaves', rate: 0.0012 }, { id: 'c_tombguard', rate: CARD.dng }],
  desc: '왕의 무덤을 지키는 해골 병사. 방패를 내려놓는 법이 없다.',
});
mob({
  id: 'mummylord', name: '붕대 대신관', lv: 60, hp: 65000, atk: [300, 380], def: 35, mdef: 40, agi: 30, dex: 110, luk: 30,
  element: 'undead', race: 'undead', size: 'large', range: 40, delay: 1300, speed: 45, aggressive: true, boss: 'field', scale: 1.6, expMul: 22,
  sprite: 'zombie', palette: ['#f0e4c8', '#c0a070', '#ffd040'],
  skills: [{ kind: 'bolt', cd: 4000, mult: 1.4, element: 'shadow' }, { kind: 'summon', cd: 15000, summon: 'mummy', count: 2 }, { kind: 'heal', cd: 22000, below: 0.4 }],
  drops: [{ id: 'e_sacredcloth', rate: 1 }, { id: 'a_priest', rate: 0.06, slots: 1 }, { id: 'w_flamberge', rate: 0.04 }, { id: 'l_bandmask', rate: 0.15 }, { id: 'x_scarab', rate: 0.06, slots: 1 }, { id: 'r_ori', rate: 0.5 }, { id: 'r_elu', rate: 0.5 }, { id: 'c_mummylord', rate: CARD.boss }],
  desc: '파라오의 잠을 지키던 대신관. 지하로 내려가는 계단을 막고 있다. [필드 보스]',
});

// ── 피라미드 지하 (던전, MVP)
mob({
  id: 'anubis', name: '무덤 자칼', lv: 58, hp: 5200, atk: [230, 285], def: 25, mdef: 30, agi: 80, dex: 95,
  element: 'shadow', race: 'brute', size: 'medium', range: 26, delay: 1000, speed: 115, aggressive: true,
  sprite: 'wolf', palette: ['#2a2a3a', '#1a1a2a', '#ffd24a'],
  drops: [{ id: 'e_blackfur', rate: 0.45 }, { id: 'u_white', rate: 0.05 }, { id: 'a_assassin', rate: 0.0006 }, { id: 'x_brooch', rate: 0.0004, slots: 1 }, { id: 'w_bloodfang', rate: 0.0002 }, { id: 'c_anubis', rate: CARD.dng }],
  desc: '황금 목걸이를 건 검은 자칼. 무덤 도굴꾼을 끝까지 쫓는다.',
});
mob({
  id: 'cursedmummy', name: '저주받은 미라', lv: 60, hp: 6400, atk: [240, 300], def: 20, mdef: 25, agi: 20, dex: 80,
  element: 'undead', race: 'undead', size: 'medium', range: 26, delay: 1500, speed: 40, aggressive: true,
  sprite: 'zombie', palette: ['#b8a888', '#6a5a40', '#7a3a8a'],
  drops: [{ id: 'e_cursedcloth', rate: 0.5 }, { id: 'u_white', rate: 0.05 }, { id: 'w_buster', rate: 0.0008 }, { id: 'l_bandmask', rate: 0.002 }, { id: 'r_elu', rate: 0.006 }, { id: 'c_cursedmummy', rate: CARD.dng }],
  desc: '왕의 저주를 대신 짊어진 미라. 붕대 사이로 보랏빛이 샌다.',
});
mob({
  id: 'pharaoh', name: '모래의 파라오', lv: 66, hp: 260000, atk: [520, 700], def: 55, mdef: 70, agi: 60, dex: 140, luk: 50,
  element: 'shadow', race: 'demon', size: 'large', range: 40, delay: 1300, speed: 55, aggressive: true, boss: 'mvp', scale: 2.2, expMul: 70, flying: true,
  sprite: 'wraith', palette: ['#c8a040', '#ffd060', '#40e0ff'],
  skills: [{ kind: 'bolt', cd: 3200, mult: 1.6, element: 'shadow' }, { kind: 'slam', cd: 8000, mult: 2.3, radius: 115, element: 'shadow' }, { kind: 'summon', cd: 14000, summon: 'cursedmummy', count: 3 }, { kind: 'heal', cd: 25000, below: 0.3 }],
  drops: [{ id: 'e_pharaohmask', rate: 1 }, { id: 'w_goldmace', rate: 0.08, slots: 1 }, { id: 'w_sunblade', rate: 0.06, slots: 1 }, { id: 'a_wizard', rate: 0.08, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_pharaoh', rate: CARD.mvp }],
  desc: '피라미드 깊은 곳에서 깨어난 왕. 성속성이 잘 통한다. [MVP]',
});

// ═══════════════════════════ 얼어붙은 설원 지방 (Lv 58–84)
// ── 얼어붙은 설원 (EXP, 물 → 바람속성)
mob({
  id: 'snowjelly', name: '눈 말랑', lv: 60, hp: 6000, atk: [198, 240], def: 25, mdef: 30, agi: 40, dex: 80,
  element: 'water', race: 'plant', size: 'medium', range: 26, delay: 1300, speed: 50, aggressive: false,
  sprite: 'jelly', palette: ['#f4faff', '#a8d0f0', '#ffffff'],
  drops: [{ id: 'e_snowflake', rate: 0.5 }, { id: 'e_jelly', rate: 0.4 }, { id: 'u_white', rate: 0.05 }, { id: 'u_blue', rate: 0.02 }, { id: 'g_feather', rate: 0.0012, slots: 1 }, { id: 'c_snowjelly', rate: CARD.exp }],
  desc: '눈처럼 하얀 말랑. 차가워서 만지면 손이 시리다.',
});
mob({
  id: 'frostwolf', name: '서리 늑대', lv: 62, hp: 6800, atk: [220, 270], def: 25, mdef: 15, agi: 85, dex: 85,
  element: 'water', race: 'brute', size: 'medium', range: 26, delay: 900, speed: 120, aggressive: true, atkElement: 'water',
  sprite: 'wolf', palette: ['#c8e0f8', '#7aa0d0', '#ffffff'],
  drops: [{ id: 'e_frostfang', rate: 0.5 }, { id: 'u_meat', rate: 0.2 }, { id: 'a_hunter', rate: 0.0012, slots: 1 }, { id: 'r_ori', rate: 0.006 }, { id: 'c_frostwolf', rate: CARD.exp }],
  desc: '입김마저 얼어붙는 늑대. 바람속성에 약하다.',
});
mob({
  id: 'icewisp', name: '얼음 정령', lv: 64, hp: 6000, atk: [238, 288], def: 10, mdef: 60, agi: 70, dex: 100,
  element: 'water', race: 'formless', size: 'small', range: 30, delay: 1200, speed: 85, aggressive: true, flying: true, atkElement: 'water',
  sprite: 'wisp', palette: ['#d8f4ff', '#7ac0f0', '#ffffff'],
  drops: [{ id: 'e_icecore', rate: 0.35 }, { id: 'u_blue', rate: 0.04 }, { id: 'w_frostrod', rate: 0.0008, slots: 1 }, { id: 'e_gem', rate: 0.006 }, { id: 'c_icewisp', rate: CARD.loot }],
  desc: '얼음 결정이 모여 생긴 정령. 마법 방어가 높다. 그 마음을 품은 자에게 호수가 길을 연다는 전설이 있다.',
});
mob({
  id: 'yeti', name: '설인', lv: 66, hp: 9500, atk: [258, 318], def: 40, mdef: 20, agi: 30, dex: 80, scale: 1.1,
  element: 'water', race: 'brute', size: 'large', range: 30, delay: 1400, speed: 60, aggressive: false,
  sprite: 'yeti', palette: ['#f4f8ff', '#b8c8e0', '#6a8ab0'],
  drops: [{ id: 'e_yetifur', rate: 0.5 }, { id: 'u_white', rate: 0.06 }, { id: 'a_knight', rate: 0.0012, slots: 1 }, { id: 'r_elu', rate: 0.006 }, { id: 'c_yeti', rate: CARD.exp }],
  desc: '설원을 어슬렁거리는 거구. 화나게 하지 말자.',
});
mob({
  id: 'yetiking', name: '설원의 군주', lv: 72, hp: 120000, atk: [560, 700], def: 55, mdef: 40, agi: 50, dex: 130, luk: 30,
  element: 'water', race: 'brute', size: 'large', range: 38, delay: 1250, speed: 75, aggressive: true, boss: 'field', scale: 1.9, expMul: 22,
  sprite: 'yeti', palette: ['#ffffff', '#c8d8f0', '#3a5a9a'],
  skills: [{ kind: 'slam', cd: 7500, mult: 2.0, radius: 100, element: 'water' }, { kind: 'charge', cd: 9000, mult: 1.8 }, { kind: 'howl', cd: 18000, summon: 'frostwolf', count: 2, below: 0.8 }],
  drops: [{ id: 'e_kingfur', rate: 1 }, { id: 'w_titanaxe', rate: 0.06, slots: 1 }, { id: 'a_smith', rate: 0.06, slots: 1 }, { id: 'a_knight', rate: 0.06, slots: 1 }, { id: 'u_white', rate: 1 }, { id: 'r_ori', rate: 0.7 }, { id: 'c_yetiking', rate: CARD.boss }],
  desc: '설원의 우두머리. 울부짖으면 늑대가 모인다. 얼음 동굴 입구를 지킨다. [필드 보스]',
});

// ── 빙하 협곡 (LOOT, 물 + 바람 → 땅·바람을 섞어야)
mob({
  id: 'snowbun', name: '눈토끼', lv: 63, hp: 5600, atk: [250, 305], def: 15, mdef: 20, agi: 70, dex: 90, expMul: 0.85,
  element: 'water', race: 'brute', size: 'small', range: 24, delay: 1100, speed: 100, aggressive: false,
  sprite: 'bunny', palette: ['#f4faff', '#b8d8f0', '#a0d0ff'],
  drops: [{ id: 'e_snowfur', rate: 0.5 }, { id: 'u_white', rate: 0.05 }, { id: 'l_snowscarf', rate: 0.002 }, { id: 'x_brooch', rate: 0.0012 }, { id: 'h_bunny', rate: 0.0006 }, { id: 'c_snowbun', rate: CARD.loot }],
  desc: '눈밭과 구별이 안 되는 하얀 토끼. 털로 짠 목도리가 따뜻하다.',
});
mob({
  id: 'iceworm', name: '서리 지룡', lv: 66, hp: 7400, atk: [270, 330], def: 40, mdef: 25, agi: 40, dex: 95, expMul: 0.85,
  element: 'water', race: 'dragon', size: 'medium', range: 28, delay: 1300, speed: 60, aggressive: true, scale: 1.35,
  sprite: 'worm', palette: ['#a0d8ff', '#4a88c0', '#ffffff'],
  drops: [{ id: 'e_frostscale', rate: 0.45 }, { id: 'u_white', rate: 0.05 }, { id: 'w_frostbrand', rate: 0.0006 }, { id: 's_mirror', rate: 0.0006 }, { id: 'r_ori', rate: 0.006 }, { id: 'c_iceworm', rate: CARD.loot }],
  desc: '빙하 틈에 사는 어린 용. 비늘이 얼음처럼 차갑다.',
});
mob({
  id: 'blizzard', name: '눈보라 정령', lv: 68, hp: 6200, atk: [285, 345], def: 10, mdef: 55, agi: 80, dex: 110, expMul: 0.85,
  element: 'wind', race: 'formless', size: 'small', range: 100, delay: 1400, speed: 85, aggressive: true, flying: true, atkElement: 'wind',
  sprite: 'wisp', palette: ['#e8f0ff', '#9ab0d0', '#ffffff'],
  drops: [{ id: 'e_galecore', rate: 0.4 }, { id: 'u_blue', rate: 0.04 }, { id: 'u_conv_earth', rate: 0.01 }, { id: 'w_stormbow', rate: 0.0006 }, { id: 'g_feather', rate: 0.0006, slots: 1 }, { id: 'g_windbreak', rate: 0.0008 }, { id: 'g_windbreak', rate: 0.0001, slots: 1 }, { id: 'c_blizzard', rate: CARD.loot }],
  desc: '협곡을 휘감는 눈보라. 바람속성이라 바람 무기가 통하지 않는다.',
});

// ── 얼음 동굴 (던전, EXP)
mob({
  id: 'icegolem', name: '빙결 골렘', lv: 70, hp: 13000, atk: [298, 358], def: 60, mdef: 30, agi: 15, dex: 80, scale: 1.15, expMul: 1.1,
  element: 'water', race: 'formless', size: 'large', range: 30, delay: 1700, speed: 30, aggressive: false,
  sprite: 'golem', palette: ['#bfe4ff', '#6aa0d0', '#ffffff'],
  drops: [{ id: 'e_glacier', rate: 0.5 }, { id: 'r_ori', rate: 0.01 }, { id: 'r_elu', rate: 0.01 }, { id: 'w_lance', rate: 0.0008, slots: 1 }, { id: 'c_icegolem', rate: CARD.dng }],
  desc: '빙하가 깨어나 걷는다. 바람속성 공격이 잘 박힌다.',
});
mob({
  id: 'icebat', name: '서리 박쥐', lv: 69, hp: 6400, atk: [290, 350], def: 15, mdef: 20, agi: 95, dex: 110,
  element: 'water', race: 'brute', size: 'small', range: 24, delay: 950, speed: 120, aggressive: true, flying: true, atkElement: 'water',
  sprite: 'bat', palette: ['#a8c8f0', '#5a7aa8', '#ffffff'],
  drops: [{ id: 'e_frostwing', rate: 0.45 }, { id: 'u_white', rate: 0.05 }, { id: 'w_icekatar', rate: 0.0006 }, { id: 'f_greaves', rate: 0.0005, slots: 1 }, { id: 'x_glove', rate: 0.0003, slots: 1 }, { id: 'c_icebat', rate: CARD.dng }],
  desc: '얼음 고드름 사이를 날아다닌다. 무척 빠르다.',
});
mob({
  id: 'frosttroll', name: '얼음 트롤', lv: 72, hp: 10500, atk: [320, 390], def: 45, mdef: 15, agi: 30, dex: 100, scale: 1.15,
  element: 'water', race: 'brute', size: 'large', range: 30, delay: 1500, speed: 55, aggressive: false,
  sprite: 'yeti', palette: ['#a8c0d8', '#6a8aa8', '#2a4a6a'],
  drops: [{ id: 'e_trollhide', rate: 0.45 }, { id: 'u_white', rate: 0.06 }, { id: 'a_knight', rate: 0.0006, slots: 1 }, { id: 'a_smith', rate: 0.0006, slots: 1 }, { id: 'w_titanaxe', rate: 0.0005 }, { id: 'r_elu', rate: 0.008 }, { id: 'c_frosttroll', rate: CARD.dng }],
  desc: '얼음 동굴의 덩치. 상처가 금방 아문다.',
});
mob({
  id: 'frostwyrm', name: '서리 비룡', lv: 76, hp: 130000, atk: [460, 560], def: 50, mdef: 40, agi: 50, dex: 140, luk: 30,
  element: 'water', race: 'dragon', size: 'large', range: 40, delay: 1300, speed: 60, aggressive: true, boss: 'field', scale: 2.2, expMul: 22,
  sprite: 'worm', palette: ['#c8f0ff', '#5aa0e0', '#ffffff'],
  skills: [{ kind: 'bolt', cd: 4000, mult: 1.5, element: 'water' }, { kind: 'slam', cd: 8000, mult: 2.0, radius: 100, element: 'water' }, { kind: 'charge', cd: 9000, mult: 1.7 }],
  drops: [{ id: 'e_wyrmheart', rate: 1 }, { id: 'w_glacierblade', rate: 0.06 }, { id: 's_mirror', rate: 0.06, slots: 1 }, { id: 'l_snowscarf', rate: 0.2 }, { id: 'r_ori', rate: 0.7 }, { id: 'r_elu', rate: 0.7 }, { id: 'c_frostwyrm', rate: CARD.boss }],
  desc: '얼음 동굴 깊은 곳으로 가는 길목에 똬리를 튼 비룡. [필드 보스]',
});

// ── 얼음 동굴 심층 (던전, MVP)
mob({
  id: 'frostknight', name: '얼어붙은 기사', lv: 77, hp: 10500, atk: [380, 460], def: 50, mdef: 25, agi: 45, dex: 120,
  element: 'water', race: 'undead', size: 'medium', range: 30, delay: 1300, speed: 55, aggressive: true,
  sprite: 'skeleton_knight', palette: ['#c8e8ff', '#6a9ad0', '#2a5a9a'],
  drops: [{ id: 'e_frostemblem', rate: 0.4 }, { id: 'u_white', rate: 0.06 }, { id: 'w_frostbrand', rate: 0.0006 }, { id: 's_mirror', rate: 0.0008 }, { id: 'a_knight', rate: 0.0006, slots: 1 }, { id: 'c_frostknight', rate: CARD.dng }],
  desc: '마녀를 치러 왔다가 얼어붙은 기사단. 아직도 검을 쥐고 있다.',
});
mob({
  id: 'icewraith', name: '빙령', lv: 79, hp: 9000, atk: [395, 480], def: 15, mdef: 60, agi: 75, dex: 140,
  element: 'water', race: 'demon', size: 'small', range: 110, delay: 1500, speed: 70, aggressive: true, flying: true, atkElement: 'water', scale: 0.75,
  sprite: 'wraith', palette: ['#bfefff', '#5ab0e0', '#ffffff'],
  drops: [{ id: 'e_sigh', rate: 0.4 }, { id: 'u_blue', rate: 0.05 }, { id: 'w_icefang', rate: 0.0006 }, { id: 'w_frostrod', rate: 0.0005 }, { id: 'x_earring', rate: 0.0004, slots: 1 }, { id: 'c_icewraith', rate: CARD.dng }],
  desc: '마녀의 한숨에서 태어난 차가운 망령. 멀리서 얼음 화살을 쏜다.',
});
mob({
  id: 'frostwitch', name: '서리 마녀', lv: 84, hp: 450000, atk: [780, 980], def: 65, mdef: 80, agi: 80, dex: 170, luk: 60,
  element: 'water', race: 'demon', size: 'medium', range: 40, delay: 1200, speed: 60, aggressive: true, boss: 'mvp', scale: 2.1, expMul: 70, flying: true,
  sprite: 'wraith', palette: ['#5a8ac8', '#bfefff', '#ffffff'],
  skills: [{ kind: 'bolt', cd: 3000, mult: 1.7, element: 'water' }, { kind: 'slam', cd: 7500, mult: 2.4, radius: 120, element: 'water' }, { kind: 'summon', cd: 14000, summon: 'icewraith', count: 3 }, { kind: 'heal', cd: 25000, below: 0.3 }],
  drops: [{ id: 'e_frostheart', rate: 1 }, { id: 'w_frostrod', rate: 0.08, slots: 2 }, { id: 'w_lance', rate: 0.06, slots: 2 }, { id: 'g_feather', rate: 0.1, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_frostwitch', rate: CARD.mvp }],
  desc: '설원을 영원한 겨울로 만든 마녀. 바람속성이 잘 통한다. [MVP]',
});

// ═══════════════════════════ 숨겨진 장소
// ── 말랑말랑 왕국 (햇살 평원 지방, 숨김: 말랑 처치 + 말랑 대왕)
mob({
  id: 'rainbowjelly', name: '무지개 말랑', lv: 26, hp: 1100, atk: [66, 82], def: 8, mdef: 15, agi: 20, dex: 40, luk: 30,
  element: 'neutral', race: 'plant', size: 'medium', range: 26, delay: 1400, speed: 48, aggressive: false,
  sprite: 'jelly', palette: ['#ffa8e0', '#a080ff', '#fffbe0'],
  drops: [{ id: 'e_rainbow', rate: 0.45 }, { id: 'e_jelly', rate: 0.4 }, { id: 'u_orange', rate: 0.06 }, { id: 'm_jellyblush', rate: 0.003 }, { id: 'x_jellyring', rate: 0.0005 }, { id: 'h_jelly', rate: 0.0012 }, { id: 'c_rainbowjelly', rate: CARD.secret }],
  desc: '보는 각도마다 색이 바뀌는 말랑. 왕국의 평범한 백성.',
});
mob({
  id: 'angeljelly', name: '날개 말랑', lv: 30, hp: 1700, atk: [82, 100], def: 15, mdef: 40, agi: 40, dex: 60, luk: 50, expMul: 1.1,
  element: 'holy', race: 'angel', size: 'medium', range: 26, delay: 1400, speed: 60, aggressive: false, flying: true,
  sprite: 'jelly', palette: ['#fffbe8', '#e0d8a0', '#ffffff'],
  drops: [{ id: 'e_halo', rate: 0.35 }, { id: 'u_royal', rate: 0.01 }, { id: 'a_saint', rate: 0.002, slots: 1 }, { id: 'x_rosary', rate: 0.0004, slots: 1 }, { id: 'h_jelly', rate: 0.002 }, { id: 'c_angeljelly', rate: CARD.secret }],
  desc: '머리 위에 작은 고리를 띄운 하얀 말랑. 성속성이라 성스러운 힘이 통하지 않는다.',
});
mob({
  id: 'devjelly', name: '뿔 말랑', lv: 31, hp: 1850, atk: [92, 115], def: 15, mdef: 30, agi: 45, dex: 65, luk: 40, expMul: 1.1,
  element: 'shadow', race: 'demon', size: 'medium', range: 26, delay: 1300, speed: 62, aggressive: true, atkElement: 'shadow',
  sprite: 'jelly', palette: ['#4a3a6a', '#2a1a4a', '#ff5a7a'],
  drops: [{ id: 'e_devhorn', rate: 0.35 }, { id: 'u_orange', rate: 0.06 }, { id: 'a_thief', rate: 0.002, slots: 1 }, { id: 'x_brooch', rate: 0.0004, slots: 1 }, { id: 'h_jelly', rate: 0.002 }, { id: 'c_devjelly', rate: CARD.secret }],
  desc: '작은 뿔이 난 심술궂은 말랑. 먼저 덤벼든다.',
});
mob({
  id: 'jellyqueen', name: '말랑 여왕', lv: 34, hp: 22000, atk: [120, 155], def: 20, mdef: 30, agi: 30, dex: 80, luk: 50,
  element: 'neutral', race: 'plant', size: 'large', range: 34, delay: 1300, speed: 46, aggressive: true, boss: 'field', scale: 2.3, expMul: 22,
  sprite: 'jelly', palette: ['#ff9ac8', '#ff5a98', '#fff0f8'],
  skills: [{ kind: 'slam', cd: 7000, mult: 1.7, radius: 95 }, { kind: 'summon', cd: 14000, summon: 'rainbowjelly', count: 3 }, { kind: 'heal', cd: 22000, below: 0.4 }],
  drops: [{ id: 'e_queenjelly', rate: 1 }, { id: 'h_jelly', rate: 0.08 }, { id: 'x_jellyring', rate: 0.2 }, { id: 'x_jellyring', rate: 0.08, slots: 1 }, { id: 'u_royal', rate: 0.5 }, { id: 'r_ori', rate: 0.3 }, { id: 'r_elu', rate: 0.3 }, { id: 'c_jellyqueen', rate: CARD.sboss }],
  desc: '대왕의 짝. 무지개 웅덩이 너머 왕국을 다스린다. [필드 보스]',
});

// ── 달그림자 오솔길 (속삭이는 숲 지방, 숨김·밤 20~2시)
mob({
  id: 'moonbun', name: '달토끼', lv: 28, hp: 1300, atk: [74, 92], def: 8, mdef: 25, agi: 45, dex: 55, luk: 40,
  element: 'holy', race: 'brute', size: 'small', range: 24, delay: 1200, speed: 90, aggressive: false,
  sprite: 'bunny', palette: ['#e8e8ff', '#b0b0e0', '#ffe080'],
  drops: [{ id: 'e_moonfur', rate: 0.45 }, { id: 'u_moonmochi', rate: 0.06 }, { id: 'm_moonpin', rate: 0.003 }, { id: 'c_moonbun', rate: CARD.secret }],
  desc: '달빛 아래서 떡방아를 찧는 토끼. 낮에는 아무도 본 적이 없다.',
});
mob({
  id: 'nightmoth', name: '밤나방', lv: 30, hp: 1400, atk: [82, 100], def: 5, mdef: 20, agi: 60, dex: 60,
  element: 'wind', race: 'insect', size: 'small', range: 26, delay: 1100, speed: 85, aggressive: true, flying: true, atkElement: 'wind',
  sprite: 'bee', palette: ['#c8b8e0', '#4a3a6a', '#e8e0ff'],
  drops: [{ id: 'e_mothdust', rate: 0.45 }, { id: 'u_blue', rate: 0.02 }, { id: 'g_moonveil', rate: 0.002 }, { id: 'x_bell', rate: 0.0015 }, { id: 'c_nightmoth', rate: CARD.secret }],
  desc: '달빛을 따라 모여드는 나방. 날갯짓에 은빛 가루가 흩날린다.',
});
mob({
  id: 'foxfire', name: '여우불', lv: 33, hp: 1400, atk: [95, 118], def: 0, mdef: 50, agi: 55, dex: 70,
  element: 'ghost', race: 'formless', size: 'small', range: 90, delay: 1400, speed: 70, aggressive: true, flying: true, atkElement: 'ghost',
  sprite: 'wisp', palette: ['#a0b8ff', '#5a6ad0', '#ffffff'],
  drops: [{ id: 'e_foxflame', rate: 0.4 }, { id: 'u_blue', rate: 0.03 }, { id: 'x_bell', rate: 0.0004, slots: 1 }, { id: 'c_foxfire', rate: CARD.rare }],
  desc: '오솔길을 홀리는 푸른 불. 무속성 공격은 거의 통하지 않는다.',
});
mob({
  id: 'moonfox', name: '월광 여우', lv: 37, hp: 22000, atk: [150, 190], def: 20, mdef: 40, agi: 80, dex: 90, luk: 50,
  element: 'holy', race: 'brute', size: 'medium', range: 30, delay: 1000, speed: 120, aggressive: true, boss: 'field', scale: 1.4, expMul: 22,
  sprite: 'wolf', palette: ['#f4f4ff', '#b8c0f0', '#ffe880'],
  skills: [{ kind: 'charge', cd: 7000, mult: 1.6 }, { kind: 'summon', cd: 15000, summon: 'foxfire', count: 2 }, { kind: 'bolt', cd: 5000, mult: 1.3, element: 'ghost' }],
  drops: [{ id: 'e_moontail', rate: 1 }, { id: 'h_moonbunny', rate: 0.08 }, { id: 'x_bell', rate: 0.08, slots: 1 }, { id: 'g_moonveil', rate: 0.06, slots: 1 }, { id: 'u_moonmochi', rate: 0.6 }, { id: 'r_ori', rate: 0.3 }, { id: 'c_moonfox', rate: CARD.sboss }],
  desc: '달그림자 오솔길의 주인. 꼬리 끝에 달빛이 맺혀 있다. [필드 보스]',
});

// ── 봉인된 광맥 (잿빛 광산 지방, 숨김: 룬 문양 조각 5개를 바친다)
mob({
  id: 'crystalgolem', name: '수정 골렘', lv: 42, hp: 3200, atk: [130, 160], def: 40, mdef: 25, agi: 10, dex: 60,
  element: 'earth', race: 'formless', size: 'medium', range: 28, delay: 1600, speed: 38, aggressive: false, scale: 0.9,
  sprite: 'golem', palette: ['#c8a8ff', '#7a5ad0', '#ffffff'],
  drops: [{ id: 'e_vein', rate: 0.45 }, { id: 'r_ori', rate: 0.025 }, { id: 'r_elu', rate: 0.02 }, { id: 'r_emver', rate: 0.05 }, { id: 'e_gem', rate: 0.01 }, { id: 'x_minerglove', rate: 0.0012 }, { id: 'w_runeblade', rate: 0.0008 }, { id: 'c_crystalgolem', rate: CARD.secret }],
  desc: '광맥의 수정이 모여 걷는다. 몸 안에 별철과 수호석이 박혀 있다.',
});
mob({
  id: 'gemjelly', name: '보석 말랑', lv: 44, hp: 3000, atk: [140, 175], def: 20, mdef: 30, agi: 30, dex: 60, luk: 30,
  element: 'neutral', race: 'plant', size: 'medium', range: 26, delay: 1400, speed: 50, aggressive: false,
  sprite: 'jelly', palette: ['#ff8ad8', '#c04aa0', '#fff0ff'],
  drops: [{ id: 'e_gemjelly', rate: 0.45 }, { id: 'e_jelly', rate: 0.3 }, { id: 'e_gem', rate: 0.02 }, { id: 'u_white', rate: 0.03 }, { id: 'w_crystalwand', rate: 0.001 }, { id: 'x_ring', rate: 0.0003, slots: 1 }, { id: 'c_gemjelly', rate: CARD.secret }],
  desc: '보석을 삼키다 보석이 되어 버린 말랑.',
});
mob({
  id: 'veinguard', name: '광맥의 수호자', lv: 47, hp: 40000, atk: [230, 290], def: 50, mdef: 30, agi: 20, dex: 100, luk: 30,
  element: 'earth', race: 'formless', size: 'large', range: 36, delay: 1500, speed: 40, aggressive: true, boss: 'field', scale: 1.6, expMul: 22,
  sprite: 'golem', palette: ['#9a7ae0', '#4a2a90', '#ffe070'],
  skills: [{ kind: 'slam', cd: 7500, mult: 1.9, radius: 95 }, { kind: 'summon', cd: 16000, summon: 'crystalgolem', count: 2, below: 0.6 }],
  drops: [{ id: 'e_veincore', rate: 1 }, { id: 'x_minerglove', rate: 0.08, slots: 1 }, { id: 'w_runeblade', rate: 0.08, slots: 1 }, { id: 'w_crystalwand', rate: 0.06, slots: 2 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_veinguard', rate: CARD.sboss }],
  desc: '석문 너머 광맥을 지키는 보랏빛 거인. [필드 보스]',
});

// ── 모래에 묻힌 신전 (작열하는 사막 지방, 숨김: 낡은 지도 조각 → 전갈왕)
mob({
  id: 'sandlion', name: '모래사자', lv: 57, hp: 6000, atk: [235, 290], def: 35, mdef: 15, agi: 50, dex: 85,
  element: 'earth', race: 'brute', size: 'large', range: 30, delay: 1200, speed: 90, aggressive: true, scale: 1.25,
  sprite: 'wolf', palette: ['#e0b060', '#a07030', '#fff0c0'],
  drops: [{ id: 'e_lionmane', rate: 0.45 }, { id: 'u_meat', rate: 0.15 }, { id: 'h_cat', rate: 0.0015 }, { id: 'w_huntbow', rate: 0.0006, slots: 1 }, { id: 'f_greaves', rate: 0.0008, slots: 1 }, { id: 'c_sandlion', rate: CARD.secret }],
  desc: '신전 계단을 지키는 사자 석상이 살아 움직인다.',
});
mob({
  id: 'sandwraith', name: '모래 망령', lv: 59, hp: 4800, atk: [245, 300], def: 10, mdef: 55, agi: 65, dex: 100,
  element: 'shadow', race: 'demon', size: 'medium', range: 100, delay: 1500, speed: 70, aggressive: true, flying: true, atkElement: 'shadow', scale: 0.7,
  sprite: 'wraith', palette: ['#c8a060', '#8a6030', '#ff6a3a'],
  drops: [{ id: 'e_sandsoul', rate: 0.4 }, { id: 'u_blue', rate: 0.04 }, { id: 'w_sage', rate: 0.0005 }, { id: 'x_rosary', rate: 0.0004, slots: 1 }, { id: 'c_sandwraith', rate: CARD.secret }],
  desc: '모래 속에 묻힌 신관들의 넋. 성속성에 약하다.',
});
mob({
  id: 'cobra', name: '황금 코브라', lv: 58, hp: 5200, atk: [240, 295], def: 30, mdef: 20, agi: 55, dex: 90,
  element: 'poison', race: 'brute', size: 'medium', range: 28, delay: 1100, speed: 75, aggressive: true, atkElement: 'poison', scale: 1.15,
  sprite: 'worm', palette: ['#ffd24a', '#a07010', '#3a8a3a'],
  drops: [{ id: 'e_cobrafang', rate: 0.45 }, { id: 'u_white', rate: 0.04 }, { id: 'w_damascus', rate: 0.0006 }, { id: 'x_necklace', rate: 0.0004, slots: 1 }, { id: 'c_cobra', rate: CARD.secret }],
  desc: '신전 보물 위에 똬리를 튼 금빛 뱀. 독니를 조심하자.',
});
mob({
  id: 'sunpriest', name: '태양의 신관', lv: 64, hp: 85000, atk: [330, 420], def: 40, mdef: 60, agi: 50, dex: 130, luk: 40,
  element: 'holy', race: 'angel', size: 'large', range: 40, delay: 1300, speed: 55, aggressive: true, boss: 'field', scale: 2.0, expMul: 22, flying: true,
  sprite: 'wraith', palette: ['#fff0a0', '#ffb030', '#ff4030'],
  skills: [{ kind: 'bolt', cd: 3800, mult: 1.5, element: 'holy' }, { kind: 'slam', cd: 8500, mult: 2.0, radius: 105, element: 'fire' }, { kind: 'summon', cd: 15000, summon: 'sandwraith', count: 2 }, { kind: 'heal', cd: 24000, below: 0.3 }],
  drops: [{ id: 'e_sundisk', rate: 1 }, { id: 'h_sunwing', rate: 0.08 }, { id: 'w_sunblade', rate: 0.04 }, { id: 'x_scarab', rate: 0.1, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 0.6 }, { id: 'c_sunpriest', rate: CARD.sboss }],
  desc: '신전 제단에서 태양을 섬기던 신관. 성속성이라 암흑 무기가 잘 든다. [필드 보스]',
});

// ── 별이 잠든 호수 (얼어붙은 설원 지방, 봉인: 레벨 + 얼음 정령 카드)
mob({
  id: 'starjelly', name: '별빛 말랑', lv: 74, hp: 8800, atk: [350, 420], def: 30, mdef: 40, agi: 50, dex: 110, luk: 50, expMul: 1.05,
  element: 'holy', race: 'plant', size: 'medium', range: 26, delay: 1400, speed: 50, aggressive: false,
  sprite: 'jelly', palette: ['#3a4aa0', '#1a2a6a', '#fff8c0'],
  drops: [{ id: 'e_stardust', rate: 0.45 }, { id: 'u_royal', rate: 0.03 }, { id: 'w_starmace', rate: 0.0005 }, { id: 'x_starring', rate: 0.0008 }, { id: 'x_starring', rate: 0.0001, slots: 1 }, { id: 'c_starjelly', rate: CARD.secret }],
  desc: '몸속에 별을 품은 말랑. 호수 얼음 아래서 깜박인다.',
});
mob({
  id: 'aurora', name: '오로라 정령', lv: 77, hp: 8800, atk: [380, 460], def: 15, mdef: 60, agi: 85, dex: 130, luk: 40, expMul: 1.05,
  element: 'wind', race: 'angel', size: 'medium', range: 110, delay: 1500, speed: 75, aggressive: true, flying: true, atkElement: 'holy',
  sprite: 'wisp', palette: ['#80ffd0', '#a080ff', '#ffffff'],
  drops: [{ id: 'e_aurora', rate: 0.4 }, { id: 'u_blue', rate: 0.05 }, { id: 'w_aurorabow', rate: 0.0006 }, { id: 'g_feather', rate: 0.0008, slots: 1 }, { id: 'x_rosary', rate: 0.0005, slots: 1 }, { id: 'c_aurora', rate: CARD.secret }],
  desc: '하늘의 빛 커튼이 호수에 내려앉아 생긴 정령.',
});
mob({
  id: 'lakeguardian', name: '호수의 파수꾼', lv: 82, hp: 170000, atk: [520, 640], def: 60, mdef: 50, agi: 50, dex: 160, luk: 50,
  element: 'holy', race: 'formless', size: 'large', range: 38, delay: 1400, speed: 45, aggressive: true, boss: 'field', scale: 1.8, expMul: 22,
  sprite: 'golem', palette: ['#2a3a7a', '#1a2050', '#fff0a0'],
  skills: [{ kind: 'slam', cd: 8000, mult: 2.0, radius: 110 }, { kind: 'bolt', cd: 4500, mult: 1.5, element: 'holy' }, { kind: 'summon', cd: 16000, summon: 'starjelly', count: 2 }, { kind: 'heal', cd: 26000, below: 0.3 }],
  drops: [{ id: 'e_lakepearl', rate: 1 }, { id: 'h_aurora', rate: 0.1 }, { id: 'x_starring', rate: 0.06, slots: 1 }, { id: 'w_starmace', rate: 0.05 }, { id: 'w_aurorabow', rate: 0.05, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_lakeguardian', rate: CARD.sboss }],
  desc: '별빛을 지키는 밤하늘색 거인. 성속성이라 암흑 무기가 잘 든다. [필드 보스]',
});

// ═══════════════════════════ v0.4 — 직업별 고향과 초보존
// Beginner fields (open from the start) mix the old low monsters with one or two regional variants whose stats sit
// next to the meadow monster of the same level (so every home levels 1→15 at about the same pace), and each drops
// a small "patch" for an early wall: HIT (밭일 장갑 · 아기 부엉이 · 사막여우), FLEE (메뚜기 · 갈매기), HP (소라게 · 꼬마 선인장),
// SP/INT/DEX for casters (피라미 · 실잠자리).

// ── 황금 밀밭 (햇살 평원, 시작 필드)
mob({
  id: 'grasshopper', name: '메뚜기', lv: 7, hp: 140, atk: [12, 17], def: 2, mdef: 4, agi: 12, dex: 12,
  element: 'wind', race: 'insect', size: 'small', range: 24, delay: 1400, speed: 60, aggressive: false, flying: true, scale: 0.8,
  sprite: 'bee', palette: ['#9ad04a', '#3a6a1a', '#e8ffd0'],
  drops: [{ id: 'e_hopleg', rate: 0.55 }, { id: 'u_apple', rate: 0.1 }, { id: 'h_bandana', rate: 0.003 }, { id: 'w_flail', rate: 0.004, slots: 2 }, { id: 'x_workglove', rate: 0.0015 }, { id: 'x_workglove', rate: 0.0002, slots: 1 }, { id: 'c_grasshopper', rate: CARD.exp }],
  desc: '밀 이삭 사이를 뛰어다니는 메뚜기. 밭일꾼들이 잃어버린 장갑을 깔고 앉아 있곤 한다.',
});

// ── 수도원 묘지 (햇살 평원, 성직자의 숙제: 불사·염)
mob({
  id: 'boneling', name: '꼬마 해골', lv: 15, hp: 380, atk: [30, 38], def: 8, mdef: 5, agi: 14, dex: 24,
  element: 'undead', race: 'undead', size: 'small', range: 26, delay: 1300, speed: 55, aggressive: false, scale: 0.72,
  sprite: 'skeleton', palette: ['#f4f0e0', '#c0b898', '#8a7a5a'],
  drops: [{ id: 'e_smallbone', rate: 0.55 }, { id: 'u_red', rate: 0.04 }, { id: 'am_silver', rate: 0.01 }, { id: 'a_saint', rate: 0.0015 }, { id: 'a_saint', rate: 0.0003, slots: 1 }, { id: 'c_boneling', rate: CARD.exp }],
  desc: '수도원 묘지에서 깨어난 작은 해골. 성수 냄새를 맡으면 달그락거리며 도망친다.',
});
mob({
  id: 'candlewisp', name: '촛불 망령', lv: 18, hp: 400, atk: [38, 48], def: 0, mdef: 30, agi: 28, dex: 30,
  element: 'ghost', race: 'demon', size: 'small', range: 26, delay: 1300, speed: 65, aggressive: false, flying: true, atkElement: 'ghost', scale: 0.8,
  sprite: 'wisp', palette: ['#ffe0a0', '#ff9a40', '#fffbe0'],
  drops: [{ id: 'e_wax', rate: 0.5 }, { id: 'u_blue', rate: 0.01 }, { id: 'x_rosary', rate: 0.0012 }, { id: 'x_rosary', rate: 0.0002, slots: 1 }, { id: 'c_candlewisp', rate: CARD.exp }],
  desc: '꺼진 촛불에 남은 넋. 무속성 공격은 거의 통하지 않는다 — 성스러운 힘이나 속성 무기로.',
});

// ── 숲 어귀 (속삭이는 숲, 시작 필드)
mob({
  id: 'owlet', name: '아기 부엉이', lv: 8, hp: 155, atk: [13, 18], def: 3, mdef: 8, agi: 9, dex: 16,
  element: 'wind', race: 'brute', size: 'small', range: 24, delay: 1400, speed: 55, aggressive: false, flying: true, scale: 0.8,
  sprite: 'bird:owl', palette: ['#b08a5a', '#6a4a2a', '#fff0c8'],
  drops: [{ id: 'e_downfeather', rate: 0.55 }, { id: 'u_berry', rate: 0.08 }, { id: 'am_wind', rate: 0.008 }, { id: 'g_hood', rate: 0.003, slots: 1 }, { id: 'h_owlwing', rate: 0.0004 }, { id: 'c_owlet', rate: CARD.exp }],
  desc: '숲 어귀 나뭇가지에서 꾸벅꾸벅 조는 아기 부엉이. 눈이 아주 좋다.',
});
mob({
  id: 'owlchief', name: '부엉이 대장', lv: 13, hp: 2200, atk: [32, 44], def: 8, mdef: 15, agi: 34, dex: 32, luk: 20,
  element: 'wind', race: 'brute', size: 'medium', range: 30, delay: 1100, speed: 85, aggressive: true, boss: 'field', scale: 1.8, expMul: 22, flying: true,
  sprite: 'bird:owl', palette: ['#c8a070', '#7a5030', '#ffe080'],
  skills: [{ kind: 'charge', cd: 7000, mult: 1.6 }, { kind: 'summon', cd: 14000, summon: 'owlet', count: 3, below: 0.7 }],
  drops: [{ id: 'e_owlplume', rate: 1 }, { id: 'h_owlwing', rate: 0.12 }, { id: 'w_composite', rate: 0.08, slots: 2 }, { id: 'u_orange', rate: 0.6 }, { id: 'r_elu', rate: 0.08 }, { id: 'r_ori', rate: 0.06 }, { id: 'c_owlchief', rate: CARD.boss }],
  desc: '숲 어귀를 내려다보는 커다란 부엉이. 이 대장을 넘어야 속삭이는 숲에 들어갈 수 있다. [필드 보스]',
});

// ── 버섯 골짜기 (속삭이는 숲, LOOT)
mob({
  id: 'toadstool', name: '독버섯', lv: 13, hp: 270, atk: [24, 32], def: 4, mdef: 12, agi: 6, dex: 18, expMul: 0.85,
  element: 'poison', race: 'plant', size: 'small', range: 24, delay: 1500, speed: 38, aggressive: false, atkElement: 'poison',
  sprite: 'mushroom', palette: ['#8a4ad0', '#f0f0d0', '#c8ff70'],
  drops: [{ id: 'e_toadcap', rate: 0.5 }, { id: 'e_spore', rate: 0.2 }, { id: 'h_mushroom', rate: 0.006 }, { id: 'x_mushcharm', rate: 0.0012 }, { id: 'x_mushcharm', rate: 0.0002, slots: 1 }, { id: 'c_toadstool', rate: CARD.loot }],
  desc: '보랏빛 갓에 연두 점박이. 포자를 뿜어 독을 옮긴다. 갓 밑에 작은 부적을 품고 있기도 하다.',
});

// ── 호숫가 풀밭 (안개 호수, 시작 필드)
mob({
  id: 'dragonfly', name: '실잠자리', lv: 5, hp: 95, atk: [10, 14], def: 1, mdef: 3, agi: 12, dex: 10,
  element: 'wind', race: 'insect', size: 'small', range: 24, delay: 1400, speed: 60, aggressive: false, flying: true, scale: 0.75,
  sprite: 'bee', palette: ['#60c0ff', '#1a3a6a', '#e0f8ff'],
  drops: [{ id: 'e_dragonwing', rate: 0.55 }, { id: 'u_apple', rate: 0.08 }, { id: 'w_willowrod', rate: 0.003, slots: 2 }, { id: 'h_lilypad', rate: 0.0005 }, { id: 'c_dragonfly', rate: CARD.exp }],
  desc: '호숫가 갈대 끝에 앉아 있는 파란 실잠자리. 날개가 유리처럼 투명하다.',
});
mob({
  id: 'minnow', name: '은빛 피라미', lv: 10, hp: 210, atk: [17, 24], def: 3, mdef: 5, agi: 14, dex: 17,
  element: 'water', race: 'fish', size: 'small', range: 24, delay: 1300, speed: 60, aggressive: false,
  sprite: 'fish', palette: ['#c8d8e8', '#6a88a8', '#fff8e0'],
  drops: [{ id: 'e_scale', rate: 0.5 }, { id: 'u_meat', rate: 0.1 }, { id: 'x_earring', rate: 0.0008 }, { id: 'c_minnow', rate: CARD.exp }],
  desc: '물가로 펄떡 튀어 올라 지느러미로 걸어 다니는 피라미. 호수 물이 몸속에 출렁인다.',
});
mob({
  id: 'catfish', name: '수염 메기', lv: 13, hp: 2400, atk: [32, 44], def: 12, mdef: 10, agi: 22, dex: 30, luk: 20,
  element: 'water', race: 'fish', size: 'large', range: 32, delay: 1300, speed: 60, aggressive: true, boss: 'field', scale: 1.7, expMul: 22,
  sprite: 'fish:catfish', palette: ['#6a7a5a', '#3a4a2a', '#e8e0b0'],
  skills: [{ kind: 'slam', cd: 7500, mult: 1.6, radius: 80 }, { kind: 'summon', cd: 14000, summon: 'minnow', count: 3, below: 0.7 }],
  drops: [{ id: 'e_whisker', rate: 1 }, { id: 'h_lilypad', rate: 0.12 }, { id: 'w_willowrod', rate: 0.08, slots: 2 }, { id: 'x_mistmirror', rate: 0.1 }, { id: 'u_orange', rate: 0.6 }, { id: 'r_elu', rate: 0.08 }, { id: 'r_ori', rate: 0.06 }, { id: 'c_catfish', rate: CARD.boss }],
  desc: '호수 바닥의 진흙을 지키는 늙은 메기. 수염으로 안개를 읽는다고 한다. [필드 보스]',
});

// ── 안개 늪 (안개 호수, LOOT)
mob({
  id: 'mistwisp', name: '안개 정령', lv: 14, hp: 330, atk: [26, 34], def: 0, mdef: 25, agi: 22, dex: 24, expMul: 0.85,
  element: 'water', race: 'formless', size: 'small', range: 26, delay: 1400, speed: 60, aggressive: true, flying: true, atkElement: 'water', scale: 0.85,
  sprite: 'wisp', palette: ['#e0eef0', '#90b0b8', '#ffffff'],
  drops: [{ id: 'e_mist', rate: 0.45 }, { id: 'u_blue', rate: 0.008 }, { id: 'x_mistmirror', rate: 0.003 }, { id: 'x_mistmirror', rate: 0.0003, slots: 1 }, { id: 'a_silk', rate: 0.002, slots: 1 }, { id: 'c_mistwisp', rate: CARD.loot }],
  desc: '늪의 안개가 뭉쳐 생긴 정령. 가슴께에 작은 거울 조각이 반짝인다.',
});

// ── 마도탑 1층 (안개 호수, 던전 EXP)
mob({
  id: 'spellbook', name: '떠도는 마법서', lv: 20, hp: 600, atk: [44, 56], def: 6, mdef: 30, agi: 16, dex: 40,
  element: 'neutral', race: 'formless', size: 'small', range: 26, delay: 1500, speed: 45, aggressive: false, flying: true,
  sprite: 'book', palette: ['#8a5a3a', '#f0e8d0', '#6a4aff'],
  drops: [{ id: 'e_page', rate: 0.55 }, { id: 'u_blue', rate: 0.01 }, { id: 'w_staff', rate: 0.002, slots: 2 }, { id: 'h_wizard', rate: 0.0015 }, { id: 'x_earring', rate: 0.001 }, { id: 'c_spellbook', rate: CARD.dng }],
  desc: '주인을 잃고 서고를 떠도는 마법서. 책장을 펄럭이며 부딪쳐 온다.',
});
mob({
  id: 'runegolem', name: '룬 골렘', lv: 25, hp: 1200, atk: [62, 78], def: 28, mdef: 20, agi: 6, dex: 40, expMul: 1.1,
  element: 'neutral', race: 'formless', size: 'medium', range: 26, delay: 1600, speed: 34, aggressive: false, scale: 0.75,
  sprite: 'golem', palette: ['#8a90b0', '#4a5070', '#80c0ff'],
  drops: [{ id: 'e_runestone', rate: 0.5 }, { id: 'r_emver', rate: 0.03 }, { id: 'r_elu', rate: 0.003 }, { id: 'x_earring', rate: 0.0002, slots: 1 }, { id: 'c_runegolem', rate: CARD.dng }],
  desc: '견습생들의 연습 상대로 만든 돌 인형. 몸에 새긴 룬이 푸르게 빛난다.',
});
mob({
  id: 'grimoire', name: '금서', lv: 29, hp: 13000, atk: [85, 110], def: 15, mdef: 45, agi: 25, dex: 70, luk: 25,
  element: 'shadow', race: 'formless', size: 'large', range: 110, delay: 1400, speed: 40, aggressive: true, boss: 'field', scale: 1.8, expMul: 22, flying: true, atkElement: 'shadow',
  sprite: 'book:chained', palette: ['#3a2a4a', '#e0d8c0', '#ff4a8a'],
  skills: [{ kind: 'bolt', cd: 4000, mult: 1.4, element: 'shadow' }, { kind: 'summon', cd: 15000, summon: 'spellbook', count: 3, below: 0.8 }],
  drops: [{ id: 'e_forbiddenpage', rate: 1 }, { id: 'h_wizard', rate: 0.12 }, { id: 'w_staff', rate: 0.08, slots: 2 }, { id: 'x_earring', rate: 0.06, slots: 1 }, { id: 'u_blue', rate: 0.6 }, { id: 'r_ori', rate: 0.2 }, { id: 'r_elu', rate: 0.2 }, { id: 'c_grimoire', rate: CARD.boss }],
  desc: '쇠사슬로 묶여 있던 금지된 책. 펼쳐지는 순간 어둠의 주문이 쏟아진다. [필드 보스]',
});

// ── 마도탑 2층 (안개 호수, 던전 LOOT)
mob({
  id: 'firebook', name: '불꽃 마법서', lv: 29, hp: 1300, atk: [74, 90], def: 8, mdef: 40, agi: 22, dex: 55, expMul: 0.9,
  element: 'fire', race: 'formless', size: 'small', range: 100, delay: 1500, speed: 45, aggressive: true, flying: true, atkElement: 'fire',
  sprite: 'book', palette: ['#c03a1a', '#ffe8c0', '#ffb020'],
  drops: [{ id: 'e_burntpage', rate: 0.45 }, { id: 'u_blue', rate: 0.02 }, { id: 'u_conv_fire', rate: 0.008 }, { id: 'g_mageshawl', rate: 0.002 }, { id: 'w_runestaff', rate: 0.001 }, { id: 'c_firebook', rate: CARD.dng }],
  desc: '불의 주문만 적힌 마법서. 멀리서 불씨를 쏘아 보낸다. 물에 약하다.',
});
mob({
  id: 'icebook', name: '얼음 마법서', lv: 31, hp: 1450, atk: [86, 106], def: 8, mdef: 40, agi: 22, dex: 58, expMul: 0.9,
  element: 'water', race: 'formless', size: 'small', range: 100, delay: 1500, speed: 45, aggressive: false, flying: true, atkElement: 'water',
  sprite: 'book', palette: ['#2a6ab0', '#e8f4ff', '#80e0ff'],
  drops: [{ id: 'e_frostpage', rate: 0.45 }, { id: 'u_blue', rate: 0.02 }, { id: 'u_conv_water', rate: 0.008 }, { id: 'a_silk', rate: 0.002, slots: 1 }, { id: 'w_runestaff', rate: 0.001 }, { id: 'c_icebook', rate: CARD.dng }],
  desc: '서리가 낀 마법서. 얼음 화살을 쏜다. 바람에 약하다.',
});
mob({
  id: 'gargoyle', name: '석상 가고일', lv: 34, hp: 1900, atk: [100, 125], def: 32, mdef: 15, agi: 32, dex: 60, expMul: 0.9,
  element: 'earth', race: 'demon', size: 'medium', range: 26, delay: 1300, speed: 70, aggressive: true, flying: true, scale: 1.3,
  sprite: 'bat', palette: ['#9a9a90', '#5a5a54', '#ff6a3a'],
  drops: [{ id: 'e_stonewing', rate: 0.45 }, { id: 'u_yellow', rate: 0.04 }, { id: 's_buckler', rate: 0.0015, slots: 1 }, { id: 'r_ori', rate: 0.003 }, { id: 'g_mageshawl', rate: 0.0003, slots: 1 }, { id: 'c_gargoyle', rate: CARD.dng }],
  desc: '탑의 처마를 지키던 돌 괴물. 침입자를 보면 날개를 펴고 내려온다.',
});
mob({
  id: 'magephantom', name: '수석 마도사의 환영', lv: 37, hp: 22000, atk: [140, 180], def: 20, mdef: 50, agi: 45, dex: 90, luk: 30,
  element: 'shadow', race: 'demihuman', size: 'medium', range: 130, delay: 1300, speed: 55, aggressive: true, boss: 'field', scale: 1.6, expMul: 22, flying: true, atkElement: 'shadow',
  sprite: 'wraith', palette: ['#5a4ab0', '#a090ff', '#e0ffff'],
  skills: [{ kind: 'bolt', cd: 3800, mult: 1.5, element: 'fire' }, { kind: 'slam', cd: 8000, mult: 1.8, radius: 95, element: 'water' }, { kind: 'summon', cd: 15000, summon: 'firebook', count: 2, below: 0.7 }],
  drops: [{ id: 'e_phantomlens', rate: 1 }, { id: 'w_runestaff', rate: 0.08, slots: 1 }, { id: 'g_mageshawl', rate: 0.08, slots: 1 }, { id: 'h_wizard', rate: 0.1 }, { id: 'u_blue', rate: 1 }, { id: 'r_ori', rate: 0.4 }, { id: 'r_elu', rate: 0.3 }, { id: 'c_magephantom', rate: CARD.boss }],
  desc: '실험 중 사라진 수석 마도사가 남긴 환영. 불과 얼음을 번갈아 쓴다. 암흑속성이라 성스러운 힘이 잘 든다. [필드 보스]',
});

// ── 마도탑 꼭대기 (안개 호수, 던전 MVP)
mob({
  id: 'towerlord', name: '안개의 대현자', lv: 44, hp: 95000, atk: [250, 340], def: 35, mdef: 70, agi: 50, dex: 120, luk: 50,
  element: 'neutral', race: 'demihuman', size: 'large', range: 140, delay: 1300, speed: 50, aggressive: true, boss: 'mvp', scale: 2.1, expMul: 70, flying: true,
  sprite: 'wraith', palette: ['#d0d8e8', '#80a0ff', '#ffe060'],
  skills: [{ kind: 'bolt', cd: 3000, mult: 1.6, element: 'wind' }, { kind: 'slam', cd: 7500, mult: 2.1, radius: 115, element: 'fire' }, { kind: 'summon', cd: 14000, summon: 'icebook', count: 3 }, { kind: 'heal', cd: 24000, below: 0.3 }],
  drops: [{ id: 'e_sageorb', rate: 1 }, { id: 'w_mistrod', rate: 0.08, slots: 1 }, { id: 'h_sagehat', rate: 0.06 }, { id: 'w_arcwand', rate: 0.1, slots: 2 }, { id: 'x_earring', rate: 0.15, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 0.6 }, { id: 'c_towerlord', rate: CARD.mvp }],
  desc: '호수의 안개로 탑을 감춘 대현자. 백 년째 별을 읽고 있다. [MVP]',
});

// ── 모래 언덕 변두리 (작열하는 사막, 시작 필드)
mob({
  id: 'cactling', name: '꼬마 선인장', lv: 6, hp: 125, atk: [11, 16], def: 3, mdef: 6, agi: 4, dex: 10,
  element: 'earth', race: 'plant', size: 'small', range: 24, delay: 1500, speed: 34, aggressive: false, scale: 0.65,
  sprite: 'flower', palette: ['#ffd84a', '#5aa848', '#ff8a5a'],
  drops: [{ id: 'e_cactspine', rate: 0.55 }, { id: 'u_cactus', rate: 0.04 }, { id: 'a_cotton', rate: 0.006, slots: 1 }, { id: 'c_cactling', rate: CARD.exp }],
  desc: '머리에 노란 꽃을 피운 아기 선인장. 뒤뚱뒤뚱 걷다가 가시로 찌른다.',
});
mob({
  id: 'fennec', name: '사막여우', lv: 8, hp: 160, atk: [13, 18], def: 3, mdef: 2, agi: 12, dex: 16,
  element: 'fire', race: 'brute', size: 'small', range: 24, delay: 1300, speed: 75, aggressive: false, scale: 0.7,
  sprite: 'wolf', palette: ['#f0d8a8', '#c8a070', '#fff8ec'],
  drops: [{ id: 'e_fennecfur', rate: 0.5 }, { id: 'u_meat', rate: 0.08 }, { id: 'm_sunglasses', rate: 0.002 }, { id: 'w_dunedagger', rate: 0.003, slots: 2 }, { id: 'h_foxears', rate: 0.0005 }, { id: 'c_fennec', rate: CARD.exp }],
  desc: '귀가 커다란 사막여우. 모래 속 발소리까지 듣고 정확히 물어 온다.',
});
mob({
  id: 'foxchief', name: '사막여우 두목', lv: 13, hp: 2200, atk: [34, 46], def: 8, mdef: 10, agi: 38, dex: 34, luk: 25,
  element: 'fire', race: 'brute', size: 'medium', range: 30, delay: 1050, speed: 95, aggressive: true, boss: 'field', scale: 1.5, expMul: 22,
  sprite: 'wolf', palette: ['#ffd8a0', '#d09050', '#fff4e0'],
  skills: [{ kind: 'charge', cd: 7000, mult: 1.6 }, { kind: 'summon', cd: 14000, summon: 'fennec', count: 3, below: 0.7 }],
  drops: [{ id: 'e_foxtail', rate: 1 }, { id: 'h_foxears', rate: 0.12 }, { id: 'w_dunedagger', rate: 0.08, slots: 2 }, { id: 'x_brooch', rate: 0.06 }, { id: 'u_orange', rate: 0.6 }, { id: 'r_elu', rate: 0.08 }, { id: 'r_ori', rate: 0.06 }, { id: 'c_foxchief', rate: CARD.boss }],
  desc: '모래 언덕의 사막여우들을 거느리는 두목. 도적들에게 소굴 가는 길을 알려 주고 고기를 얻어먹는다. [필드 보스]',
});

// ── 도적 소굴 (작열하는 사막, 던전 EXP·제니)
mob({
  id: 'thiefbug', name: '좀도둑 벌레', lv: 15, hp: 400, atk: [30, 39], def: 14, mdef: 4, agi: 24, dex: 26,
  element: 'shadow', race: 'insect', size: 'small', range: 24, delay: 1150, speed: 85, aggressive: false, scale: 0.7,
  sprite: 'scorpion', palette: ['#3a3040', '#16101e', '#c0a050'],
  drops: [{ id: 'e_stolencoin', rate: 0.45 }, { id: 'u_orange', rate: 0.03 }, { id: 'w_dirk', rate: 0.0025, slots: 2 }, { id: 'l_bandit', rate: 0.002 }, { id: 'a_thief', rate: 0.002, slots: 1 }, { id: 'c_thiefbug', rate: CARD.dng }],
  desc: '도적들이 흘린 금화를 등에 지고 다니는 검은 벌레. 잡으면 짤랑 소리가 난다.',
});
mob({
  id: 'dustbat', name: '먼지 박쥐', lv: 18, hp: 400, atk: [38, 48], def: 4, mdef: 4, agi: 44, dex: 34,
  element: 'neutral', race: 'brute', size: 'small', range: 24, delay: 1000, speed: 100, aggressive: true, flying: true, scale: 0.85,
  sprite: 'bat', palette: ['#a08a6a', '#6a5a40', '#ffcc40'],
  drops: [{ id: 'e_dustwing', rate: 0.5 }, { id: 'u_orange', rate: 0.04 }, { id: 'f_shoes', rate: 0.003, slots: 1 }, { id: 'c_dustbat', rate: CARD.dng }],
  desc: '먼지 낀 굴 천장에 매달려 사는 박쥐. 날갯짓에 모래가 쏟아진다.',
});
mob({
  id: 'shadowboss', name: '그림자 두목', lv: 25, hp: 10000, atk: [75, 98], def: 15, mdef: 20, agi: 55, dex: 60, luk: 30,
  element: 'shadow', race: 'demihuman', size: 'medium', range: 30, delay: 950, speed: 110, aggressive: true, boss: 'field', scale: 1.3, expMul: 22, flying: true,
  sprite: 'wraith', palette: ['#4a3a2a', '#c8a060', '#ffd040'],
  skills: [{ kind: 'charge', cd: 6500, mult: 1.6 }, { kind: 'summon', cd: 15000, summon: 'thiefbug', count: 3, below: 0.8 }],
  drops: [{ id: 'e_bossmask', rate: 1 }, { id: 'l_bandit', rate: 0.15 }, { id: 'w_dirk', rate: 0.08, slots: 2 }, { id: 'a_thief', rate: 0.1, slots: 1 }, { id: 'w_hawktalon', rate: 0.02 }, { id: 'u_orange', rate: 0.6 }, { id: 'r_ori', rate: 0.15 }, { id: 'r_elu', rate: 0.15 }, { id: 'c_shadowboss', rate: CARD.boss }],
  desc: '얼굴을 본 사람이 없다는 도적단 두목. 두건 아래 눈만 번뜩인다. 소굴 뒤편 협곡과 채석장으로 빠지는 길을 안다. [필드 보스]',
});

// ── 붉은 바위 협곡 (작열하는 사막, LOOT)
mob({
  id: 'canyonhawk', name: '붉은 매', lv: 33, hp: 1300, atk: [88, 108], def: 6, mdef: 8, agi: 55, dex: 60, expMul: 0.85,
  element: 'wind', race: 'brute', size: 'small', range: 26, delay: 950, speed: 115, aggressive: true, flying: true,
  sprite: 'bird', palette: ['#c0603a', '#6a2a1a', '#ffe0b0'],
  drops: [{ id: 'e_hawkfeather', rate: 0.45 }, { id: 'u_meat', rate: 0.12 }, { id: 'x_hawkfeather', rate: 0.0012 }, { id: 'x_hawkfeather', rate: 0.0002, slots: 1 }, { id: 'w_hawktalon', rate: 0.0006 }, { id: 'w_hawktalon', rate: 0.0001, slots: 1 }, { id: 'c_canyonhawk', rate: CARD.loot }],
  desc: '붉은 절벽 위를 맴돌다 내리꽂히는 매. 발톱은 칼날처럼 날카롭다.',
});

// ── 파도 해변 (푸른 항구, 시작 필드)
mob({
  id: 'hermit', name: '소라게', lv: 4, hp: 80, atk: [7, 11], def: 4, mdef: 2, agi: 4, dex: 8,
  element: 'water', race: 'fish', size: 'small', range: 22, delay: 1500, speed: 40, aggressive: false, scale: 0.75,
  sprite: 'crab:hermit', palette: ['#ff8a5a', '#a04a2a', '#f0d8b0'],
  drops: [{ id: 'e_conch', rate: 0.55 }, { id: 'u_apple', rate: 0.08 }, { id: 'e_pearl', rate: 0.01 }, { id: 'f_sandals', rate: 0.004, slots: 1 }, { id: 'w_shipaxe', rate: 0.003, slots: 2 }, { id: 'c_hermit', rate: CARD.exp }],
  desc: '빌린 소라 껍데기를 지고 다니는 게. 껍데기 속에 진주를 숨겨 두기도 한다.',
});
mob({
  id: 'gull', name: '갈매기', lv: 7, hp: 130, atk: [12, 17], def: 1, mdef: 3, agi: 14, dex: 14,
  element: 'wind', race: 'brute', size: 'small', range: 24, delay: 1300, speed: 70, aggressive: false, flying: true, scale: 0.8,
  sprite: 'bird', palette: ['#ffffff', '#a8b8c8', '#ffb040'],
  drops: [{ id: 'e_gullfeather', rate: 0.55 }, { id: 'u_meat', rate: 0.06 }, { id: 'x_seaglass', rate: 0.0006 }, { id: 'h_sailor', rate: 0.0005 }, { id: 'c_gull', rate: CARD.exp }],
  desc: '항구의 생선을 노리는 갈매기. 휙 피하는 솜씨가 일품이다.',
});
mob({
  id: 'kingcrab', name: '대왕 집게', lv: 13, hp: 2300, atk: [32, 44], def: 18, mdef: 8, agi: 18, dex: 30, luk: 20,
  element: 'water', race: 'fish', size: 'large', range: 30, delay: 1300, speed: 55, aggressive: true, boss: 'field', scale: 1.8, expMul: 22,
  sprite: 'crab', palette: ['#e04a3a', '#802018', '#ffe0c0'],
  skills: [{ kind: 'slam', cd: 7000, mult: 1.6, radius: 80 }, { kind: 'summon', cd: 14000, summon: 'hermit', count: 3, below: 0.7 }],
  drops: [{ id: 'e_kingclaw', rate: 1 }, { id: 'h_sailor', rate: 0.12 }, { id: 'w_shipaxe', rate: 0.08, slots: 2 }, { id: 'e_pearl', rate: 0.3 }, { id: 'u_orange', rate: 0.6 }, { id: 'r_elu', rate: 0.08 }, { id: 'r_ori', rate: 0.06 }, { id: 'c_kingcrab', rate: CARD.boss }],
  desc: '해변의 바위만 한 게. 집게 한쪽이 유난히 크다. 등대와 난파선 가는 길목을 막고 있다. [필드 보스]',
});

// ── 등대 곶 (푸른 항구, LOOT)
mob({
  id: 'lamplight', name: '등대 불빛', lv: 15, hp: 360, atk: [30, 40], def: 0, mdef: 25, agi: 26, dex: 28, expMul: 0.85,
  element: 'fire', race: 'formless', size: 'small', range: 26, delay: 1300, speed: 65, aggressive: true, flying: true, atkElement: 'fire', scale: 0.85,
  sprite: 'wisp', palette: ['#fff080', '#ffa020', '#ffffff'],
  drops: [{ id: 'e_lampoil', rate: 0.5 }, { id: 'am_fire', rate: 0.01 }, { id: 'g_sailcloth', rate: 0.003 }, { id: 'g_sailcloth', rate: 0.0005, slots: 1 }, { id: 'x_seaglass', rate: 0.001 }, { id: 'x_seaglass', rate: 0.00015, slots: 1 }, { id: 'c_lamplight', rate: CARD.loot }],
  desc: '등대 램프에서 떨어져 나온 불씨. 밤바다를 비추려고 곶을 빙빙 돈다.',
});

// ── 난파선 (푸른 항구, 던전 EXP·제니)
mob({
  id: 'piratebones', name: '해골 해적', lv: 21, hp: 720, atk: [50, 64], def: 10, mdef: 8, agi: 20, dex: 36,
  element: 'undead', race: 'undead', size: 'medium', range: 28, delay: 1300, speed: 58, aggressive: false,
  sprite: 'skeleton', palette: ['#ece4d0', '#b0a088', '#c8302a'],
  drops: [{ id: 'e_doubloon', rate: 0.45 }, { id: 'u_orange', rate: 0.04 }, { id: 'w_cutlass', rate: 0.0025, slots: 2 }, { id: 'm_piratepatch', rate: 0.002 }, { id: 'q_compass', rate: 0.003 }, { id: 'c_piratebones', rate: CARD.dng }],
  desc: '가라앉은 배에서 아직도 금화를 세는 해골. 반짝이는 건 절대 놓지 않는다.',
});
mob({
  id: 'parrot', name: '해적 앵무새', lv: 23, hp: 640, atk: [56, 70], def: 4, mdef: 8, agi: 50, dex: 46,
  element: 'wind', race: 'brute', size: 'small', range: 26, delay: 1050, speed: 100, aggressive: true, flying: true,
  sprite: 'bird', palette: ['#4ad04a', '#d03030', '#ffd040'],
  drops: [{ id: 'e_parrotfeather', rate: 0.5 }, { id: 'u_apple', rate: 0.1 }, { id: 'h_bandana', rate: 0.003 }, { id: 'x_glove', rate: 0.0012 }, { id: 'c_parrot', rate: CARD.dng }],
  desc: '"보물! 보물!" 선장의 말버릇을 따라 하며 덤벼드는 앵무새.',
});
mob({
  id: 'ghostcaptain', name: '유령 선장', lv: 29, hp: 13000, atk: [90, 118], def: 20, mdef: 25, agi: 40, dex: 70, luk: 30,
  element: 'undead', race: 'undead', size: 'large', range: 34, delay: 1200, speed: 70, aggressive: true, boss: 'field', scale: 1.5, expMul: 22,
  sprite: 'skeleton_knight', palette: ['#e8e0c8', '#2a4a5a', '#3aa0a0'],
  skills: [{ kind: 'slam', cd: 7500, mult: 1.8, radius: 85 }, { kind: 'charge', cd: 9000, mult: 1.6 }, { kind: 'summon', cd: 15000, summon: 'piratebones', count: 2 }],
  drops: [{ id: 'e_epaulet', rate: 1 }, { id: 'q_compass', rate: 0.3 }, { id: 'w_cutlass', rate: 0.08, slots: 2 }, { id: 'm_piratepatch', rate: 0.15 }, { id: 'e_doubloon', rate: 0.4 }, { id: 'u_orange', rate: 0.6 }, { id: 'r_ori', rate: 0.2 }, { id: 'r_elu', rate: 0.2 }, { id: 'c_ghostcaptain', rate: CARD.boss }],
  desc: '배와 함께 가라앉은 해적선 선장. 품속의 나침반은 아직도 어딘가를 가리킨다. [필드 보스]',
});

// ── 산호 동굴 (푸른 항구, 던전 LOOT)
mob({
  id: 'coralcrab', name: '산호게', lv: 30, hp: 1500, atk: [86, 104], def: 35, mdef: 10, agi: 15, dex: 50, expMul: 0.9,
  element: 'water', race: 'fish', size: 'small', range: 24, delay: 1300, speed: 50, aggressive: false, scale: 0.9,
  sprite: 'crab', palette: ['#ff7aa0', '#b03a5a', '#ffe0e8'],
  drops: [{ id: 'e_coral', rate: 0.45 }, { id: 'u_yellow', rate: 0.04 }, { id: 'x_coralring', rate: 0.001 }, { id: 's_coralshield', rate: 0.0008 }, { id: 'w_anchor', rate: 0.0004 }, { id: 'c_coralcrab', rate: CARD.dng }],
  desc: '등에 산호를 키우는 게. 껍질이 산호처럼 단단하다.',
});
mob({
  id: 'pufferfish', name: '가시복어', lv: 33, hp: 1700, atk: [98, 120], def: 12, mdef: 15, agi: 28, dex: 55, expMul: 0.9,
  element: 'poison', race: 'fish', size: 'small', range: 24, delay: 1300, speed: 55, aggressive: false, atkElement: 'poison',
  sprite: 'fish:puffer', palette: ['#f0e070', '#a08a30', '#ffffff'],
  drops: [{ id: 'e_puffspine', rate: 0.45 }, { id: 'u_yellow', rate: 0.04 }, { id: 'e_pearl', rate: 0.01 }, { id: 'x_coralring', rate: 0.0005 }, { id: 'c_pufferfish', rate: CARD.dng }],
  desc: '건드리면 가시공처럼 부풀어 오르는 복어. 가시에 독이 있다.',
});
mob({
  id: 'anemone', name: '말미잘', lv: 35, hp: 2000, atk: [92, 114], def: 10, mdef: 30, agi: 1, dex: 70, expMul: 0.9,
  element: 'water', race: 'plant', size: 'medium', range: 70, delay: 1400, speed: 0, aggressive: true, immobile: true, atkElement: 'water',
  sprite: 'flower', palette: ['#ff5a8a', '#a03a6a', '#ffe070'],
  drops: [{ id: 'e_tentacle', rate: 0.45 }, { id: 'u_blue', rate: 0.02 }, { id: 'x_coralring', rate: 0.0002, slots: 1 }, { id: 'w_trident', rate: 0.0003 }, { id: 'c_anemone', rate: CARD.dng }],
  desc: '바위에 뿌리박은 말미잘. 촉수를 뻗어 멀리 있는 것도 쏜다. 움직이지 않는다.',
});
mob({
  id: 'coralgolem', name: '산호 골렘', lv: 39, hp: 24000, atk: [150, 195], def: 45, mdef: 25, agi: 15, dex: 70, luk: 20,
  element: 'water', race: 'formless', size: 'large', range: 34, delay: 1600, speed: 40, aggressive: true, boss: 'field', scale: 1.6, expMul: 22,
  sprite: 'golem', palette: ['#ff8aa8', '#a04a6a', '#80f0ff'],
  skills: [{ kind: 'slam', cd: 7500, mult: 1.8, radius: 90, element: 'water' }, { kind: 'summon', cd: 16000, summon: 'coralcrab', count: 2, below: 0.6 }],
  drops: [{ id: 'e_coralheart', rate: 1 }, { id: 'w_anchor', rate: 0.08, slots: 1 }, { id: 's_coralshield', rate: 0.08, slots: 1 }, { id: 'x_coralring', rate: 0.08, slots: 1 }, { id: 'u_white', rate: 0.6 }, { id: 'r_ori', rate: 0.4 }, { id: 'r_elu', rate: 0.3 }, { id: 'c_coralgolem', rate: CARD.boss }],
  desc: '천 년 동안 자란 산호초가 일어섰다. 심층으로 내려가는 물길을 막고 있다. [필드 보스]',
});

// ── 산호 동굴 심층 (푸른 항구, 던전 MVP)
mob({
  id: 'deepfish', name: '초롱아귀', lv: 40, hp: 2600, atk: [128, 158], def: 20, mdef: 20, agi: 30, dex: 70,
  element: 'water', race: 'fish', size: 'medium', range: 26, delay: 1300, speed: 50, aggressive: true, scale: 1.2,
  sprite: 'fish:angler', palette: ['#3a3a5a', '#1a1a30', '#a0ffe0'],
  drops: [{ id: 'e_lure', rate: 0.45 }, { id: 'u_yellow', rate: 0.04 }, { id: 'e_pearl', rate: 0.015 }, { id: 'w_trident', rate: 0.0005 }, { id: 'c_deepfish', rate: CARD.dng }],
  desc: '머리 위 초롱으로 먹이를 꾀는 심해어. 불빛을 따라가면 이빨이 기다린다.',
});
mob({
  id: 'abyssdragon', name: '심연의 해룡', lv: 46, hp: 120000, atk: [280, 370], def: 45, mdef: 50, agi: 50, dex: 120, luk: 40,
  element: 'water', race: 'dragon', size: 'large', range: 40, delay: 1300, speed: 60, aggressive: true, boss: 'mvp', scale: 2.4, expMul: 70,
  sprite: 'worm', palette: ['#2a5a8a', '#0a2a4a', '#80ffe0'],
  skills: [{ kind: 'bolt', cd: 3500, mult: 1.5, element: 'water' }, { kind: 'slam', cd: 8000, mult: 2.2, radius: 115, element: 'water' }, { kind: 'summon', cd: 14000, summon: 'deepfish', count: 3 }, { kind: 'heal', cd: 25000, below: 0.3 }],
  drops: [{ id: 'e_abysspearl', rate: 1 }, { id: 'w_trident', rate: 0.08, slots: 1 }, { id: 'h_coralcrown', rate: 0.06 }, { id: 'x_coralring', rate: 0.1, slots: 1 }, { id: 'w_anchor', rate: 0.06, slots: 2 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_abyssdragon', rate: CARD.mvp }],
  desc: '바다 밑바닥에 똬리를 튼 해룡. 항구의 배들이 사라지는 이유라고들 한다. [MVP]',
});

// ── 철광 능선 (잿빛 광산, EXP: 땅 → 불속성)
mob({
  id: 'ironbun', name: '철갑 뿔토끼', lv: 37, hp: 2200, atk: [112, 138], def: 30, mdef: 10, agi: 36, dex: 55,
  element: 'earth', race: 'brute', size: 'small', range: 24, delay: 1200, speed: 75, aggressive: false, scale: 1.15,
  sprite: 'bunny', palette: ['#b8b8c0', '#6a6a78', '#ff9aa8'],
  drops: [{ id: 'e_ironhorn', rate: 0.5 }, { id: 'u_yellow', rate: 0.04 }, { id: 'r_emver', rate: 0.03 }, { id: 'f_boots', rate: 0.0015, slots: 1 }, { id: 'h_bunny', rate: 0.0005 }, { id: 'c_ironbun', rate: CARD.exp }],
  desc: '쇳가루를 먹고 자라 털이 강철처럼 된 뿔토끼. 뿔토끼 시절의 버릇은 그대로다.',
});
mob({
  id: 'irongolem', name: '무쇠 골렘', lv: 41, hp: 3200, atk: [134, 162], def: 45, mdef: 15, agi: 8, dex: 60, expMul: 1.1,
  element: 'earth', race: 'formless', size: 'medium', range: 26, delay: 1600, speed: 34, aggressive: false, scale: 0.85,
  sprite: 'golem', palette: ['#7a7a80', '#3a3a40', '#ff9a3a'],
  drops: [{ id: 'e_ironore', rate: 0.5 }, { id: 'r_emver', rate: 0.04 }, { id: 'r_ori', rate: 0.004 }, { id: 'w_hammer', rate: 0.001 }, { id: 'h_helm', rate: 0.0008 }, { id: 'c_irongolem', rate: CARD.exp }],
  desc: '철광석이 뭉쳐 걷는다. 단단하지만 불에 달구면 금방 물러진다.',
});

// ── 침엽수 눈길 (얼어붙은 설원, EXP)
mob({
  id: 'snowowl', name: '눈올빼미', lv: 54, hp: 3700, atk: [205, 250], def: 15, mdef: 20, agi: 70, dex: 85,
  element: 'water', race: 'brute', size: 'small', range: 24, delay: 1100, speed: 95, aggressive: false, flying: true,
  sprite: 'bird:owl', palette: ['#f4f8ff', '#a8b8d0', '#ffd040'],
  drops: [{ id: 'e_owlfeather', rate: 0.5 }, { id: 'u_white', rate: 0.04 }, { id: 'g_feather', rate: 0.0012 }, { id: 'g_feather', rate: 0.0002, slots: 1 }, { id: 'a_hunter', rate: 0.0006, slots: 1 }, { id: 'x_brooch', rate: 0.001 }, { id: 'c_snowowl', rate: CARD.exp }],
  desc: '눈 덮인 소나무 가지에 앉은 하얀 올빼미. 깃털 하나하나가 눈송이처럼 가볍다.',
});

// ── 구름 계단 (하늘 유적, EXP: 바람 → 땅속성)
mob({
  id: 'cloudjelly', name: '구름 말랑', lv: 82, hp: 11000, atk: [400, 480], def: 30, mdef: 40, agi: 50, dex: 120, luk: 30,
  element: 'wind', race: 'plant', size: 'medium', range: 26, delay: 1300, speed: 50, aggressive: false,
  sprite: 'jelly', palette: ['#f6f8ff', '#c8d8f0', '#fff8e0'],
  drops: [{ id: 'e_cloudfluff', rate: 0.5 }, { id: 'e_jelly', rate: 0.3 }, { id: 'u_white', rate: 0.06 }, { id: 'g_cloudcape', rate: 0.0005 }, { id: 'c_cloudjelly', rate: CARD.exp }],
  desc: '구름을 뭉쳐 만든 것 같은 말랑. 밟으면 폭신하게 꺼진다.',
});
mob({
  id: 'windbird', name: '폭풍 매', lv: 85, hp: 9500, atk: [430, 520], def: 25, mdef: 30, agi: 90, dex: 140,
  element: 'wind', race: 'brute', size: 'medium', range: 26, delay: 1000, speed: 115, aggressive: false, flying: true, scale: 1.2,
  sprite: 'bird', palette: ['#a0b0e0', '#4a5a9a', '#ffe060'],
  drops: [{ id: 'e_stormfeather', rate: 0.45 }, { id: 'u_white', rate: 0.06 }, { id: 'f_windboots', rate: 0.0006 }, { id: 'w_skybow', rate: 0.0004 }, { id: 'c_windbird', rate: CARD.exp }],
  desc: '구름 계단을 오르내리며 바람을 타는 매. 날갯짓 한 번에 돌풍이 인다.',
});
mob({
  id: 'sentinel', name: '석상 파수병', lv: 87, hp: 15500, atk: [470, 560], def: 60, mdef: 30, agi: 15, dex: 120, expMul: 1.1,
  element: 'neutral', race: 'formless', size: 'large', range: 30, delay: 1700, speed: 30, aggressive: false,
  sprite: 'golem', palette: ['#f0ecd8', '#b8a888', '#ffd060'],
  drops: [{ id: 'e_marble', rate: 0.5 }, { id: 'r_ori', rate: 0.008 }, { id: 'r_elu', rate: 0.008 }, { id: 'w_thunderaxe', rate: 0.0003 }, { id: 'w_skybreaker', rate: 0.0003 }, { id: 'c_sentinel', rate: CARD.exp }],
  desc: '하늘 유적의 계단을 지키는 하얀 석상. 금빛 눈이 켜지면 움직인다.',
});
mob({
  id: 'cloudgiant', name: '구름 거인', lv: 90, hp: 220000, atk: [860, 1060], def: 60, mdef: 50, agi: 50, dex: 180, luk: 50,
  element: 'wind', race: 'brute', size: 'large', range: 38, delay: 1300, speed: 60, aggressive: true, boss: 'field', scale: 2.0, expMul: 22,
  sprite: 'yeti', palette: ['#f8f8ff', '#c8d0f0', '#8a7ab0'],
  skills: [{ kind: 'slam', cd: 7500, mult: 2.0, radius: 105, element: 'wind' }, { kind: 'charge', cd: 9000, mult: 1.8 }, { kind: 'summon', cd: 16000, summon: 'cloudjelly', count: 2, below: 0.7 }],
  drops: [{ id: 'e_cloudcore', rate: 1 }, { id: 'g_cloudcape', rate: 0.08, slots: 1 }, { id: 'w_thunderaxe', rate: 0.06 }, { id: 'w_skybreaker', rate: 0.05, slots: 1 }, { id: 'u_white', rate: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_cloudgiant', rate: CARD.boss }],
  desc: '구름 계단 꼭대기에 버티고 선 거인. 발을 구르면 천둥이 친다. [필드 보스]',
});

// ── 바람의 신전 (하늘 유적, 던전 EXP·LOOT)
mob({
  id: 'galespirit', name: '질풍 정령', lv: 88, hp: 9900, atk: [470, 565], def: 10, mdef: 60, agi: 85, dex: 150,
  element: 'wind', race: 'formless', size: 'small', range: 100, delay: 1400, speed: 85, aggressive: true, flying: true, atkElement: 'wind',
  sprite: 'wisp', palette: ['#d0fff0', '#60d0b0', '#ffffff'],
  drops: [{ id: 'e_galeheart', rate: 0.4 }, { id: 'u_blue', rate: 0.05 }, { id: 'w_windkatar', rate: 0.0004 }, { id: 'w_galeblade', rate: 0.0003 }, { id: 'f_windboots', rate: 0.0002, slots: 1 }, { id: 'c_galespirit', rate: CARD.dng }],
  desc: '신전 회랑을 휘몰아치는 바람의 정령. 멀리서 칼바람을 날린다.',
});
mob({
  id: 'scripture', name: '바람의 경전', lv: 90, hp: 12000, atk: [490, 585], def: 20, mdef: 60, agi: 45, dex: 150,
  element: 'holy', race: 'formless', size: 'small', range: 110, delay: 1500, speed: 45, aggressive: true, flying: true, atkElement: 'holy',
  sprite: 'book', palette: ['#f0f0ff', '#d0c080', '#fff0a0'],
  drops: [{ id: 'e_holypage', rate: 0.4 }, { id: 'u_blue', rate: 0.05 }, { id: 'w_halomace', rate: 0.0004 }, { id: 'w_skyrod', rate: 0.0002 }, { id: 'x_rosary', rate: 0.0005, slots: 1 }, { id: 'c_scripture', rate: CARD.dng }],
  desc: '바람이 넘기는 하얀 경전. 기도문이 빛의 화살이 되어 날아온다. 성속성이라 암흑 무기가 잘 든다.',
});
mob({
  id: 'stormking', name: '폭풍 수리왕', lv: 95, hp: 250000, atk: [900, 1120], def: 55, mdef: 50, agi: 90, dex: 200, luk: 60,
  element: 'wind', race: 'brute', size: 'large', range: 36, delay: 1100, speed: 110, aggressive: true, boss: 'field', scale: 2.2, expMul: 22, flying: true,
  sprite: 'bird', palette: ['#e0b860', '#8a6a2a', '#ffffff'],
  skills: [{ kind: 'charge', cd: 7000, mult: 1.9 }, { kind: 'slam', cd: 8000, mult: 2.1, radius: 110, element: 'wind' }, { kind: 'bolt', cd: 4500, mult: 1.5, element: 'wind' }],
  drops: [{ id: 'e_stormplume', rate: 1 }, { id: 'h_windwing', rate: 0.08 }, { id: 'w_galeblade', rate: 0.06, slots: 1 }, { id: 'w_windkatar', rate: 0.04 }, { id: 'w_skybow', rate: 0.05, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_stormking', rate: CARD.boss }],
  desc: '신전 지붕에 둥지를 튼 거대한 금빛 수리. 성소로 가는 문을 지킨다. [필드 보스]',
});

// ── 하늘 정원 (하늘 유적, LOOT)
mob({
  id: 'skyflower', name: '천상화', lv: 91, hp: 13000, atk: [500, 600], def: 30, mdef: 40, agi: 1, dex: 160, expMul: 0.85,
  element: 'earth', race: 'plant', size: 'medium', range: 80, delay: 1400, speed: 0, aggressive: true, immobile: true, atkElement: 'earth',
  sprite: 'flower', palette: ['#fff8ff', '#6ac080', '#ffd040'],
  drops: [{ id: 'e_skypetal', rate: 0.45 }, { id: 'u_royal', rate: 0.03 }, { id: 'f_windboots', rate: 0.0005 }, { id: 'w_halomace', rate: 0.0004 }, { id: 'c_skyflower', rate: CARD.loot }],
  desc: '구름 위에서만 피는 하얀 꽃. 꽃가루가 돌멩이처럼 날아온다. 움직이지 않는다.',
});
mob({
  id: 'cherub', name: '깃털 말랑', lv: 93, hp: 13800, atk: [520, 620], def: 30, mdef: 60, agi: 65, dex: 160, luk: 60, expMul: 0.85,
  element: 'holy', race: 'angel', size: 'medium', range: 26, delay: 1300, speed: 70, aggressive: true, flying: true,
  sprite: 'jelly', palette: ['#fff4c8', '#e8c870', '#ffffff'],
  drops: [{ id: 'e_goldfeather', rate: 0.45 }, { id: 'u_royal', rate: 0.03 }, { id: 'w_skyfang', rate: 0.0004 }, { id: 'w_skybow', rate: 0.0003 }, { id: 'x_skyring', rate: 0.0001 }, { id: 'c_cherub', rate: CARD.loot }],
  desc: '금빛 깃털이 돋은 말랑. 날개 말랑이 하늘까지 날아오르면 이렇게 된다는 이야기가 있다.',
});

// ── 천공 성소 (하늘 유적, 던전 MVP)
mob({
  id: 'skyknight', name: '천공 기사', lv: 96, hp: 16500, atk: [560, 670], def: 50, mdef: 50, agi: 55, dex: 180,
  element: 'holy', race: 'demihuman', size: 'medium', range: 30, delay: 1200, speed: 70, aggressive: true,
  sprite: 'skeleton_knight', palette: ['#f4f0e0', '#d8c070', '#4a80d0'],
  drops: [{ id: 'e_skyemblem', rate: 0.4 }, { id: 'u_white', rate: 0.06 }, { id: 'w_skylance', rate: 0.0003 }, { id: 'w_halomace', rate: 0.0003 }, { id: 's_mirror', rate: 0.0005, slots: 1 }, { id: 'c_skyknight', rate: CARD.dng }],
  desc: '투구 속은 텅 비고 빛만 남은 천공 기사단. 왕좌를 지키는 맹세만은 잊지 않았다.',
});
mob({
  id: 'skykeeper', name: '천공의 파수신', lv: 98, hp: 600000, atk: [1150, 1450], def: 60, mdef: 70, agi: 90, dex: 220, luk: 80,
  element: 'holy', race: 'angel', size: 'large', range: 40, delay: 1150, speed: 65, aggressive: true, boss: 'mvp', scale: 2.3, expMul: 70, flying: true,
  sprite: 'wraith', palette: ['#fff8e8', '#ffd860', '#60c0ff'],
  skills: [{ kind: 'bolt', cd: 2800, mult: 1.8, element: 'holy' }, { kind: 'slam', cd: 7000, mult: 2.5, radius: 125, element: 'wind' }, { kind: 'summon', cd: 14000, summon: 'skyknight', count: 3 }, { kind: 'heal', cd: 25000, below: 0.3 }],
  drops: [{ id: 'e_skyheart', rate: 1 }, { id: 'w_skyrod', rate: 0.06, slots: 2 }, { id: 'w_skylance', rate: 0.06, slots: 1 }, { id: 'w_halomace', rate: 0.06, slots: 1 }, { id: 'h_skycrown', rate: 0.05 }, { id: 'x_skyring', rate: 0.08, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_skykeeper', rate: CARD.mvp }],
  desc: '하늘 유적의 왕좌를 지키는 빛의 파수신. 날개 한 쌍이 성소를 다 덮는다. [MVP]',
});

// ── 해적의 보물섬 (푸른 항구, 숨김: 선장의 나침반 + 2차 전직한 동료)
mob({
  id: 'treasurecrab', name: '보물게', lv: 49, hp: 3800, atk: [175, 215], def: 45, mdef: 15, agi: 22, dex: 70, luk: 40,
  element: 'neutral', race: 'fish', size: 'small', range: 24, delay: 1300, speed: 50, aggressive: false, scale: 0.9,
  sprite: 'crab', palette: ['#ffd040', '#a07010', '#fff8c0'],
  drops: [{ id: 'e_goldshell', rate: 0.45 }, { id: 'e_doubloon', rate: 0.3 }, { id: 'e_pearl', rate: 0.04 }, { id: 'x_pirate', rate: 0.0006 }, { id: 'c_treasurecrab', rate: CARD.secret }],
  desc: '해적들이 묻은 금화를 껍데기 삼아 짊어진 게. 잡으면 금화가 쏟아진다.',
});
mob({
  id: 'seadog', name: '해골 갑판장', lv: 53, hp: 4500, atk: [200, 245], def: 25, mdef: 15, agi: 45, dex: 80,
  element: 'undead', race: 'undead', size: 'medium', range: 28, delay: 1200, speed: 70, aggressive: true,
  sprite: 'skeleton', palette: ['#e8dcc0', '#a8906a', '#2a2a3a'],
  drops: [{ id: 'e_rustyhook', rate: 0.45 }, { id: 'u_white', rate: 0.04 }, { id: 'm_piratepatch', rate: 0.002 }, { id: 'h_piratehat', rate: 0.001 }, { id: 'w_seasaber', rate: 0.0004 }, { id: 'c_seadog', rate: CARD.secret }],
  desc: '해적왕의 보물을 지키는 갑판장의 해골. 한 손에 녹슨 갈고리를 끼웠다.',
});
mob({
  id: 'pirateking', name: '해적왕의 망령', lv: 56, hp: 60000, atk: [330, 420], def: 40, mdef: 40, agi: 55, dex: 110, luk: 50,
  element: 'shadow', race: 'undead', size: 'large', range: 36, delay: 1150, speed: 75, aggressive: true, boss: 'field', scale: 1.8, expMul: 22,
  sprite: 'skeleton_knight', palette: ['#d8d0c0', '#1a1a2a', '#c8a020'],
  skills: [{ kind: 'charge', cd: 7000, mult: 1.7 }, { kind: 'slam', cd: 8500, mult: 1.9, radius: 95 }, { kind: 'summon', cd: 15000, summon: 'seadog', count: 2, below: 0.7 }],
  drops: [{ id: 'e_kingcoin', rate: 1 }, { id: 'x_pirate', rate: 0.2 }, { id: 'x_pirate', rate: 0.08, slots: 1 }, { id: 'h_piratehat', rate: 0.1 }, { id: 'w_seasaber', rate: 0.05, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 0.6 }, { id: 'c_pirateking', rate: CARD.sboss }],
  desc: '보물섬 동굴의 금화 더미 위에서 일어난 해적왕. 암흑속성이라 성속성이 잘 든다. [필드 보스]',
});

// ── 거울 호수 (안개 호수, 숨김: 안개 거울 착용 + 새벽 4~10시)
mob({
  id: 'mirrorjelly', name: '거울 말랑', lv: 34, hp: 1900, atk: [100, 124], def: 15, mdef: 30, agi: 30, dex: 60, luk: 30, expMul: 1.05,
  element: 'neutral', race: 'plant', size: 'medium', range: 26, delay: 1400, speed: 48, aggressive: false,
  sprite: 'jelly', palette: ['#e0e8f0', '#a0b0c8', '#ffffff'],
  drops: [{ id: 'e_mirrorjelly', rate: 0.45 }, { id: 'e_jelly', rate: 0.3 }, { id: 'u_blue', rate: 0.02 }, { id: 'x_mistmirror', rate: 0.002 }, { id: 'w_lakewand', rate: 0.0004 }, { id: 'c_mirrorjelly', rate: CARD.secret }],
  desc: '몸에 보는 사람이 비치는 은빛 말랑. 자기 얼굴과 눈이 마주치면 깜짝 놀란다.',
});
mob({
  id: 'swan', name: '백조', lv: 38, hp: 2200, atk: [118, 145], def: 15, mdef: 30, agi: 50, dex: 75, expMul: 1.05,
  element: 'water', race: 'brute', size: 'medium', range: 26, delay: 1100, speed: 90, aggressive: true, flying: true, atkElement: 'water', scale: 1.2,
  sprite: 'bird:swan', palette: ['#ffffff', '#d0d8e8', '#ff9a40'],
  drops: [{ id: 'e_whitefeather', rate: 0.45 }, { id: 'u_yellow', rate: 0.04 }, { id: 'w_lakewand', rate: 0.0006 }, { id: 'x_mistmirror', rate: 0.0003, slots: 1 }, { id: 'c_swan', rate: CARD.secret }],
  desc: '거울 호수에만 사는 백조. 우아하지만 날갯짓은 매섭다.',
});
mob({
  id: 'swanqueen', name: '백조 여왕', lv: 41, hp: 32000, atk: [160, 205], def: 30, mdef: 50, agi: 60, dex: 100, luk: 50,
  element: 'water', race: 'angel', size: 'large', range: 34, delay: 1200, speed: 85, aggressive: true, boss: 'field', scale: 1.8, expMul: 22, flying: true,
  sprite: 'bird:swan', palette: ['#fffaf0', '#c8e0ff', '#ffd040'],
  skills: [{ kind: 'bolt', cd: 4000, mult: 1.5, element: 'water' }, { kind: 'charge', cd: 8000, mult: 1.6 }, { kind: 'summon', cd: 16000, summon: 'swan', count: 2 }, { kind: 'heal', cd: 24000, below: 0.3 }],
  drops: [{ id: 'e_swanfeather', rate: 1 }, { id: 'h_swanwing', rate: 0.08 }, { id: 'x_mistmirror', rate: 0.08, slots: 1 }, { id: 'w_lakewand', rate: 0.06, slots: 2 }, { id: 'u_blue', rate: 0.6 }, { id: 'r_ori', rate: 0.3 }, { id: 'r_elu', rate: 0.3 }, { id: 'c_swanqueen', rate: CARD.sboss }],
  desc: '물에 비친 달을 왕관으로 쓴 백조. 거울 호수의 주인이다. 물속성이라 바람이 잘 든다. [필드 보스]',
});

export function monster(id: string): MonsterDef {
  const m = MONSTERS[id];
  if (!m) throw new Error('unknown monster ' + id);
  return m;
}
