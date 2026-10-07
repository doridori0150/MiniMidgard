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
  desc: string;
}

export const MONSTERS: Record<string, MonsterDef> = {};

type M = Omit<MonsterDef, 'exp' | 'jexp' | 'luk' | 'scale'> & { expMul?: number; luk?: number; scale?: number };
function mob(m: M) {
  // kills per level grow slower after Lv 15 so the idle loop keeps moving toward the 2nd job
  const div = m.lv <= 15 ? 8 + m.lv * 2.4 : 44 + (m.lv - 15) * 1.8 + Math.max(0, m.lv - 45) * 4;
  const base = Math.max(1, Math.round((expNext(m.lv) / div) * (m.expMul ?? 1)));
  // mid/late monsters were spongy for idle pacing: trim HP by tier (bosses a little less)
  const hpMul = m.lv >= 45 ? (m.boss ? 0.85 : 0.75) : m.lv >= 28 ? (m.boss ? 0.8 : 0.65) : m.lv >= 14 ? (m.boss ? 0.9 : 0.8) : 1;
  MONSTERS[m.id] = { luk: 0, scale: 1, ...m, hp: Math.round(m.hp * hpMul), exp: base, jexp: Math.round(base * 0.78) };
}

// ═════ 햇살 평원 (Lv 1–15)
mob({
  id: 'jelly', name: '말랑', lv: 2, hp: 50, atk: [5, 8], def: 2, mdef: 5, agi: 1, dex: 6,
  element: 'water', race: 'plant', size: 'medium', range: 26, delay: 1600, speed: 46, aggressive: false,
  sprite: 'jelly', palette: ['#ffb3c7', '#ff7aa0', '#fff0f4'],
  drops: [{ id: 'e_jelly', rate: 0.7 }, { id: 'u_apple', rate: 0.12 }, { id: 'e_sticky', rate: 0.05 }, { id: 'u_red', rate: 0.03 }, { id: 'w_knife', rate: 0.006, slots: 3 }, { id: 'h_jelly', rate: 0.0003 }, { id: 'c_jelly', rate: 0.001 }],
  desc: '통통 튀는 말랑한 생물. 아무 생각이 없어 보인다.',
});
mob({
  id: 'hornbun', name: '뿔토끼', lv: 4, hp: 70, atk: [8, 12], def: 0, mdef: 0, agi: 14, dex: 8,
  element: 'neutral', race: 'brute', size: 'small', range: 24, delay: 1300, speed: 70, aggressive: false,
  sprite: 'bunny', palette: ['#fbf6ee', '#e8d8c8', '#ffb0b8'],
  drops: [{ id: 'e_fur', rate: 0.55 }, { id: 'e_horn', rate: 0.2 }, { id: 'u_apple', rate: 0.1 }, { id: 'u_meat', rate: 0.04 }, { id: 'h_flower', rate: 0.01 }, { id: 'f_sandals', rate: 0.006, slots: 1 }, { id: 'c_hornbun', rate: 0.001 }],
  desc: '이마에 작은 뿔이 난 토끼. 의외로 아프게 들이받는다.',
});
mob({
  id: 'wriggle', name: '애벌레', lv: 3, hp: 78, atk: [6, 9], def: 0, mdef: 0, agi: 2, dex: 4,
  element: 'earth', race: 'insect', size: 'small', range: 22, delay: 1700, speed: 32, aggressive: false,
  sprite: 'worm', palette: ['#9ed36a', '#6fae46', '#e8f8c8'],
  drops: [{ id: 'e_shell', rate: 0.6 }, { id: 'e_sticky', rate: 0.15 }, { id: 'u_red', rate: 0.03 }, { id: 'a_cotton', rate: 0.008, slots: 1 }, { id: 'r_elu', rate: 0.0015 }, { id: 'c_wriggle', rate: 0.001 }],
  desc: '꼬물꼬물 기어다니는 애벌레. 언젠가는 나비가 될까?',
});
mob({
  id: 'sporelet', name: '꼬마버섯', lv: 6, hp: 120, atk: [11, 16], def: 2, mdef: 8, agi: 5, dex: 10,
  element: 'earth', race: 'plant', size: 'small', range: 24, delay: 1500, speed: 40, aggressive: false,
  sprite: 'mushroom', palette: ['#ff6a5a', '#fff4e0', '#ffe8d0'],
  drops: [{ id: 'e_spore', rate: 0.55 }, { id: 'u_red', rate: 0.05 }, { id: 'h_mushroom', rate: 0.004 }, { id: 'r_phra', rate: 0.03 }, { id: 'r_ori', rate: 0.0008 }, { id: 'c_sporelet', rate: 0.001 }],
  desc: '빨간 갓에 하얀 점박이. 먹으면 큰일 난다.',
});
mob({
  id: 'toxjelly', name: '독말랑', lv: 9, hp: 175, atk: [14, 19], def: 3, mdef: 10, agi: 8, dex: 16,
  element: 'poison', race: 'plant', size: 'medium', range: 26, delay: 1400, speed: 52, aggressive: false, atkElement: 'poison',
  sprite: 'jelly', palette: ['#b48aff', '#7e4fd6', '#efe4ff'],
  drops: [{ id: 'e_toxin', rate: 0.4 }, { id: 'e_jelly', rate: 0.5 }, { id: 'u_orange', rate: 0.03 }, { id: 'w_cutter', rate: 0.005, slots: 2 }, { id: 'e_gem', rate: 0.002 }, { id: 'c_toxjelly', rate: 0.001 }],
  desc: '독을 머금은 보라색 말랑. 맞으면 중독될 수 있다.',
});
mob({
  id: 'pup', name: '꼬마 늑대', lv: 11, hp: 250, atk: [20, 28], def: 4, mdef: 0, agi: 22, dex: 18,
  element: 'earth', race: 'brute', size: 'small', range: 24, delay: 1200, speed: 85, aggressive: false, scale: 0.78,
  sprite: 'wolf', palette: ['#d8b890', '#a8865e', '#fff2e0'],
  drops: [{ id: 'e_claw', rate: 0.25 }, { id: 'u_meat', rate: 0.12 }, { id: 'e_leather', rate: 0.2 }, { id: 'f_shoes', rate: 0.003 }, { id: 'r_phra', rate: 0.03 }, { id: 'c_pup', rate: 0.001 }],
  desc: '숲에서 내려온 어린 늑대. 아직은 장난이 심할 뿐이다.',
});
mob({
  id: 'bunchief', name: '뿔토끼 대장', lv: 13, hp: 2200, atk: [34, 46], def: 8, mdef: 10, agi: 35, dex: 30, luk: 20,
  element: 'neutral', race: 'brute', size: 'medium', range: 30, delay: 1100, speed: 80, aggressive: true, boss: 'field', scale: 1.9, expMul: 22,
  sprite: 'bunny', palette: ['#fff2d8', '#e6c48a', '#ff9aa8'],
  skills: [{ kind: 'charge', cd: 7000, mult: 1.6 }, { kind: 'summon', cd: 14000, summon: 'hornbun', count: 3, below: 0.7 }],
  drops: [{ id: 'h_bunny', rate: 0.12 }, { id: 'u_orange', rate: 0.6 }, { id: 'e_horn', rate: 1 }, { id: 'f_shoes', rate: 0.08, slots: 1 }, { id: 'r_elu', rate: 0.08 }, { id: 'r_ori', rate: 0.06 }, { id: 'c_bunchief', rate: 0.01 }],
  desc: '평원 토끼들의 우두머리. 돌진 공격을 조심하자. [필드 보스]',
});
mob({
  id: 'jellyking', name: '말랑 대왕', lv: 18, hp: 9500, atk: [70, 105], def: 15, mdef: 20, agi: 20, dex: 40, luk: 30,
  element: 'water', race: 'plant', size: 'large', range: 34, delay: 1300, speed: 44, aggressive: true, boss: 'mvp', scale: 2.6, expMul: 70,
  sprite: 'jelly', palette: ['#ffd36a', '#ffa83a', '#fff8d8'],
  skills: [{ kind: 'slam', cd: 6500, mult: 1.8, radius: 100 }, { kind: 'summon', cd: 12000, summon: 'jelly', count: 4 }, { kind: 'heal', cd: 20000, below: 0.4 }],
  drops: [{ id: 'h_crown', rate: 0.1 }, { id: 'e_kingjelly', rate: 1 }, { id: 'u_yellow', rate: 1 }, { id: 'r_ori', rate: 0.3 }, { id: 'r_elu', rate: 0.3 }, { id: 'x_clip', rate: 0.15, slots: 1 }, { id: 'h_jelly', rate: 0.05 }, { id: 'c_jellyking', rate: 0.02 }],
  desc: '왕관을 쓴 거대한 말랑. 내려찍기에 맞으면 아프다. [MVP]',
});

// ═════ 속삭이는 숲 (Lv 15–30)
mob({
  id: 'wolf', name: '회색 늑대', lv: 16, hp: 420, atk: [30, 40], def: 5, mdef: 0, agi: 32, dex: 26,
  element: 'earth', race: 'brute', size: 'medium', range: 26, delay: 1100, speed: 105, aggressive: true,
  sprite: 'wolf', palette: ['#9aa0aa', '#6c7280', '#e6e8ee'],
  drops: [{ id: 'e_claw', rate: 0.45 }, { id: 'u_meat', rate: 0.2 }, { id: 'e_leather', rate: 0.3 }, { id: 'w_saber', rate: 0.003, slots: 2 }, { id: 'x_brooch', rate: 0.0015 }, { id: 'c_wolf', rate: 0.001 }],
  desc: '무리 지어 사냥하는 늑대. 빠르고 공격적이다.',
});
mob({
  id: 'stingbee', name: '꿀벌 병정', lv: 18, hp: 380, atk: [33, 44], def: 4, mdef: 5, agi: 44, dex: 32,
  element: 'wind', race: 'insect', size: 'small', range: 26, delay: 1000, speed: 95, aggressive: true, flying: true, atkElement: 'wind',
  sprite: 'bee', palette: ['#ffd23a', '#3a2a1a', '#e8f6ff'],
  drops: [{ id: 'e_stinger', rate: 0.45 }, { id: 'u_honey', rate: 0.1 }, { id: 'w_stiletto', rate: 0.003, slots: 2 }, { id: 'x_glove', rate: 0.0015 }, { id: 'r_emver', rate: 0.03 }, { id: 'c_stingbee', rate: 0.001 }],
  desc: '숲의 꿀을 지키는 벌. 침이 날카롭다.',
});
mob({
  id: 'mandra', name: '맨드라 꽃', lv: 15, hp: 480, atk: [24, 34], def: 2, mdef: 25, agi: 1, dex: 34,
  element: 'earth', race: 'plant', size: 'medium', range: 70, delay: 1300, speed: 0, aggressive: true, immobile: true, atkElement: 'earth',
  sprite: 'flower', palette: ['#ff8ad0', '#5fae5a', '#fff0a0'],
  drops: [{ id: 'e_petal', rate: 0.55 }, { id: 'e_root', rate: 0.3 }, { id: 'w_wand', rate: 0.004, slots: 2 }, { id: 'x_earring', rate: 0.0015 }, { id: 'c_mandra', rate: 0.001 }],
  desc: '땅에 뿌리박고 덩굴로 후려친다. 움직이지 않는다.',
});
mob({
  id: 'shroom', name: '큰버섯', lv: 20, hp: 660, atk: [38, 50], def: 8, mdef: 15, agi: 10, dex: 26,
  element: 'earth', race: 'plant', size: 'medium', range: 26, delay: 1500, speed: 42, aggressive: false,
  sprite: 'mushroom', palette: ['#c8a0ff', '#fff4e0', '#ffe8d0'],
  scale: 1.35,
  drops: [{ id: 'e_spore', rate: 0.7 }, { id: 'h_mushroom', rate: 0.01 }, { id: 'u_orange', rate: 0.06 }, { id: 'a_mantle', rate: 0.003, slots: 1 }, { id: 'r_ori', rate: 0.002 }, { id: 'c_shroom', rate: 0.001 }],
  desc: '사람만 한 보라색 버섯. 느긋하지만 단단하다.',
});
mob({
  id: 'mossjelly', name: '이끼 말랑', lv: 22, hp: 700, atk: [42, 56], def: 10, mdef: 20, agi: 16, dex: 30,
  element: 'wind', race: 'plant', size: 'medium', range: 26, delay: 1300, speed: 54, aggressive: false,
  sprite: 'jelly', palette: ['#8fd46a', '#4f9a3a', '#e8ffd8'],
  drops: [{ id: 'e_moss', rate: 0.5 }, { id: 'e_jelly', rate: 0.5 }, { id: 'u_honey', rate: 0.03 }, { id: 'g_muffler', rate: 0.004, slots: 1 }, { id: 'r_elu', rate: 0.002 }, { id: 'c_mossjelly', rate: 0.001 }],
  desc: '이끼를 뒤집어쓴 말랑. 숲에 숨어 있으면 보이지 않는다.',
});
mob({
  id: 'silverfang', name: '은빛 늑대왕', lv: 28, hp: 14000, atk: [90, 120], def: 20, mdef: 15, agi: 70, dex: 60, luk: 30,
  element: 'earth', race: 'brute', size: 'large', range: 32, delay: 900, speed: 120, aggressive: true, boss: 'field', scale: 1.7, expMul: 22,
  sprite: 'wolf', palette: ['#dfe6f4', '#9fb0d0', '#ffffff'],
  skills: [{ kind: 'howl', cd: 15000, summon: 'wolf', count: 3 }, { kind: 'charge', cd: 6000, mult: 1.7 }],
  drops: [{ id: 'e_silverfur', rate: 1 }, { id: 'h_cat', rate: 0.1 }, { id: 'g_manteau', rate: 0.08, slots: 1 }, { id: 'x_brooch', rate: 0.1 }, { id: 'r_ori', rate: 0.25 }, { id: 'u_white', rate: 0.6 }, { id: 'c_silverfang', rate: 0.01 }],
  desc: '숲의 왕. 울부짖으면 늑대들이 모여든다. [필드 보스]',
});
mob({
  id: 'treant', name: '고목 정령', lv: 34, hp: 42000, atk: [140, 200], def: 30, mdef: 40, agi: 20, dex: 70, luk: 40,
  element: 'earth', race: 'plant', size: 'large', range: 40, delay: 1500, speed: 34, aggressive: true, boss: 'mvp', scale: 2.4, expMul: 70,
  sprite: 'treant', palette: ['#7a5a3a', '#5aa04a', '#c8f0a0'],
  skills: [{ kind: 'roots', cd: 7000, mult: 1.6, radius: 80 }, { kind: 'heal', cd: 18000, below: 0.5 }, { kind: 'summon', cd: 16000, summon: 'mandra', count: 2 }],
  drops: [{ id: 'e_branch', rate: 1 }, { id: 'h_angel', rate: 0.06 }, { id: 'w_gakkung', rate: 0.1, slots: 1 }, { id: 'w_arcwand', rate: 0.1, slots: 2 }, { id: 'r_ori', rate: 0.5 }, { id: 'r_elu', rate: 0.5 }, { id: 'u_royal', rate: 0.5 }, { id: 'c_treant', rate: 0.02 }],
  desc: '숲만큼 오래 산 나무의 정령. 뿌리가 땅을 뚫고 솟는다. [MVP]',
});

// ═════ 망자의 동굴 (Lv 30–45)
mob({
  id: 'skeleton', name: '해골 병사', lv: 30, hp: 1400, atk: [75, 98], def: 15, mdef: 10, agi: 30, dex: 42,
  element: 'undead', race: 'undead', size: 'medium', range: 28, delay: 1200, speed: 70, aggressive: true,
  sprite: 'skeleton', palette: ['#f0ecd8', '#b8b090', '#7a6a50'],
  drops: [{ id: 'e_bone', rate: 0.5 }, { id: 'u_yellow', rate: 0.04 }, { id: 'w_tsurugi', rate: 0.0015, slots: 1 }, { id: 'x_ring', rate: 0.0015 }, { id: 'r_ori', rate: 0.004 }, { id: 'c_skeleton', rate: 0.001 }],
  desc: '녹슨 검을 든 해골. 성스러운 힘에 약하다.',
});
mob({
  id: 'fangbat', name: '송곳니 박쥐', lv: 28, hp: 900, atk: [62, 82], def: 5, mdef: 5, agi: 64, dex: 50,
  element: 'shadow', race: 'brute', size: 'small', range: 24, delay: 900, speed: 110, aggressive: true, flying: true,
  sprite: 'bat', palette: ['#5a4a6a', '#3a2a4a', '#ff5a7a'],
  drops: [{ id: 'e_batwing', rate: 0.55 }, { id: 'u_orange', rate: 0.05 }, { id: 'f_boots', rate: 0.002, slots: 1 }, { id: 'x_necklace', rate: 0.0015 }, { id: 'c_fangbat', rate: 0.001 }],
  desc: '동굴 천장에 매달려 있다가 덮친다. 매우 빠르다.',
});
mob({
  id: 'shambler', name: '좀비', lv: 32, hp: 2200, atk: [82, 105], def: 5, mdef: 5, agi: 5, dex: 32,
  element: 'undead', race: 'undead', size: 'medium', range: 26, delay: 1600, speed: 36, aggressive: true,
  sprite: 'zombie', palette: ['#8fae7a', '#5a7a4a', '#7a5a8a'],
  drops: [{ id: 'e_bandage', rate: 0.55 }, { id: 'u_white', rate: 0.02 }, { id: 'a_chain', rate: 0.002, slots: 1 }, { id: 'r_elu', rate: 0.004 }, { id: 'c_shambler', rate: 0.001 }],
  desc: '느리지만 끈질기다. 불과 성스러운 힘에 약하다.',
});
mob({
  id: 'wisp', name: '유령등불', lv: 34, hp: 1300, atk: [88, 112], def: 0, mdef: 40, agi: 52, dex: 60,
  element: 'ghost', race: 'demon', size: 'small', range: 30, delay: 1200, speed: 80, aggressive: true, flying: true, atkElement: 'ghost',
  sprite: 'wisp', palette: ['#c8f4ff', '#7ad0f0', '#ffffff'],
  drops: [{ id: 'e_ectoplasm', rate: 0.45 }, { id: 'u_blue', rate: 0.03 }, { id: 'a_silk', rate: 0.003, slots: 1 }, { id: 'x_rosary', rate: 0.0015 }, { id: 'e_gem', rate: 0.004 }, { id: 'c_wisp', rate: 0.001 }],
  desc: '떠도는 혼불. 무속성 공격은 거의 통하지 않는다!',
});
mob({
  id: 'bonearcher', name: '해골 궁수', lv: 36, hp: 1700, atk: [96, 126], def: 10, mdef: 10, agi: 40, dex: 82,
  element: 'undead', race: 'undead', size: 'medium', range: 160, delay: 1500, speed: 60, aggressive: true,
  sprite: 'skeleton_archer', palette: ['#f0ecd8', '#b8b090', '#5a8a5a'],
  drops: [{ id: 'e_bone', rate: 0.6 }, { id: 'am_silver', rate: 0.01 }, { id: 'h_apple', rate: 0.0012 }, { id: 'w_crossbow', rate: 0.002, slots: 2 }, { id: 'x_glove', rate: 0.0015 }, { id: 'r_ori', rate: 0.004 }, { id: 'c_bonearcher', rate: 0.001 }],
  desc: '멀리서 화살을 쏜다. 후방을 노리니 조심.',
});
mob({
  id: 'boneknight', name: '해골 기사', lv: 42, hp: 36000, atk: [220, 300], def: 40, mdef: 20, agi: 40, dex: 90, luk: 30,
  element: 'undead', race: 'undead', size: 'large', range: 36, delay: 1200, speed: 70, aggressive: true, boss: 'field', scale: 1.7, expMul: 22,
  sprite: 'skeleton_knight', palette: ['#f0ecd8', '#8090a8', '#c03040'],
  skills: [{ kind: 'slam', cd: 7000, mult: 2.0, radius: 90 }, { kind: 'charge', cd: 9000, mult: 1.8 }, { kind: 'summon', cd: 15000, summon: 'skeleton', count: 2 }],
  drops: [{ id: 'h_bonehelm', rate: 0.08 }, { id: 'w_claymore', rate: 0.06, slots: 1 }, { id: 'a_plate', rate: 0.05, slots: 1 }, { id: 's_shield', rate: 0.08, slots: 1 }, { id: 'r_ori', rate: 0.5 }, { id: 'u_white', rate: 1 }, { id: 'c_boneknight', rate: 0.01 }],
  desc: '죽어서도 검을 놓지 않은 기사. [필드 보스]',
});
mob({
  id: 'wraith', name: '망령 군주', lv: 50, hp: 130000, atk: [330, 480], def: 45, mdef: 60, agi: 60, dex: 120, luk: 50,
  element: 'undead', race: 'demon', size: 'large', range: 40, delay: 1300, speed: 60, aggressive: true, boss: 'mvp', scale: 2.2, expMul: 70, flying: true,
  sprite: 'wraith', palette: ['#3a2a5a', '#8a5ad0', '#ff5a8a'],
  skills: [{ kind: 'bolt', cd: 3500, mult: 1.5, element: 'shadow' }, { kind: 'slam', cd: 8000, mult: 2.2, radius: 110, element: 'shadow' }, { kind: 'summon', cd: 14000, summon: 'wisp', count: 3 }, { kind: 'heal', cd: 25000, below: 0.3 }],
  drops: [{ id: 'e_darkcrystal', rate: 1 }, { id: 'h_horns', rate: 0.05 }, { id: 'w_damascus', rate: 0.08, slots: 2 }, { id: 'w_sage', rate: 0.08, slots: 1 }, { id: 'w_buster', rate: 0.06, slots: 1 }, { id: 'h_tiara', rate: 0.08 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_wraith', rate: 0.02 }],
  desc: '동굴 깊은 곳의 지배자. 어둠의 마법을 쓴다. [MVP]',
});

// ═════ 작열하는 사막 (Lv 45–60)
mob({
  id: 'sandjelly', name: '모래 말랑', lv: 45, hp: 3200, atk: [118, 148], def: 20, mdef: 20, agi: 30, dex: 60,
  element: 'earth', race: 'plant', size: 'medium', range: 26, delay: 1300, speed: 50, aggressive: false,
  sprite: 'jelly', palette: ['#f0d890', '#c89a48', '#fff8e0'],
  drops: [{ id: 'e_sand', rate: 0.5 }, { id: 'e_jelly', rate: 0.4 }, { id: 'u_yellow', rate: 0.05 }, { id: 'r_emver', rate: 0.04 }, { id: 'w_jamadhar', rate: 0.0015, slots: 2 }, { id: 'c_sandjelly', rate: 0.001 }],
  desc: '모래를 뒤집어쓴 말랑. 뜨거운 햇볕에도 끄떡없다.',
});
mob({
  id: 'scorpion', name: '사막 전갈', lv: 48, hp: 3800, atk: [138, 172], def: 30, mdef: 10, agi: 45, dex: 70,
  element: 'fire', race: 'insect', size: 'small', range: 26, delay: 1100, speed: 80, aggressive: true, atkElement: 'poison',
  sprite: 'scorpion', palette: ['#d0603a', '#8a3020', '#ffd080'],
  drops: [{ id: 'e_stingtail', rate: 0.45 }, { id: 'u_yellow', rate: 0.05 }, { id: 'w_jur', rate: 0.0012, slots: 3 }, { id: 'r_ori', rate: 0.004 }, { id: 'c_scorpion', rate: 0.001 }],
  desc: '독침을 치켜든 붉은 전갈. 먼저 덤벼든다. 물속성에 약하다.',
});
mob({
  id: 'jackal', name: '사막 자칼', lv: 50, hp: 4200, atk: [150, 185], def: 15, mdef: 10, agi: 72, dex: 72,
  element: 'fire', race: 'brute', size: 'medium', range: 26, delay: 950, speed: 115, aggressive: true,
  sprite: 'wolf', palette: ['#d8b070', '#a07840', '#fff0d0'],
  drops: [{ id: 'e_fang', rate: 0.45 }, { id: 'u_meat', rate: 0.2 }, { id: 'w_huntbow', rate: 0.0015 }, { id: 'f_greaves', rate: 0.001, slots: 1 }, { id: 'c_jackal', rate: 0.001 }],
  desc: '모래바람처럼 빠른 자칼. 무리 지어 다닌다.',
});
mob({
  id: 'mummy', name: '미라', lv: 52, hp: 5200, atk: [160, 200], def: 15, mdef: 20, agi: 20, dex: 60,
  element: 'undead', race: 'undead', size: 'medium', range: 26, delay: 1500, speed: 40, aggressive: true,
  sprite: 'zombie', palette: ['#e8dcc0', '#a89070', '#c8b090'],
  drops: [{ id: 'e_bandage', rate: 0.6 }, { id: 'u_white', rate: 0.04 }, { id: 'a_priest', rate: 0.0012, slots: 1 }, { id: 'r_elu', rate: 0.005 }, { id: 'c_mummy', rate: 0.001 }],
  desc: '붕대에 감긴 고대인. 불과 성스러운 힘에 약하다.',
});
mob({
  id: 'sandgolem', name: '모래 골렘', lv: 55, hp: 7500, atk: [188, 236], def: 45, mdef: 20, agi: 10, dex: 50,
  element: 'earth', race: 'formless', size: 'large', range: 30, delay: 1700, speed: 32, aggressive: false, scale: 1.1,
  sprite: 'golem', palette: ['#d0a860', '#8a6a3a', '#ffe0a0'],
  drops: [{ id: 'e_golemcore', rate: 0.4 }, { id: 'e_sand', rate: 0.6 }, { id: 'r_ori', rate: 0.008 }, { id: 'w_partizan', rate: 0.0012, slots: 1 }, { id: 'c_sandgolem', rate: 0.001 }],
  desc: '사막의 돌이 뭉쳐 움직인다. 방어가 단단하니 바람속성으로 공략하자.',
});
mob({
  id: 'scorpking', name: '전갈왕', lv: 58, hp: 80000, atk: [380, 480], def: 50, mdef: 30, agi: 60, dex: 110, luk: 30,
  element: 'fire', race: 'insect', size: 'large', range: 36, delay: 1100, speed: 85, aggressive: true, boss: 'field', scale: 2, expMul: 22, atkElement: 'poison',
  sprite: 'scorpion', palette: ['#ffb040', '#a05010', '#fff0a0'],
  skills: [{ kind: 'charge', cd: 7000, mult: 1.8 }, { kind: 'slam', cd: 8000, mult: 2.0, radius: 95, element: 'fire' }, { kind: 'summon', cd: 15000, summon: 'scorpion', count: 3 }],
  drops: [{ id: 'w_bloodfang', rate: 0.03 }, { id: 'w_flamberge', rate: 0.06, slots: 1 }, { id: 'a_assassin', rate: 0.06, slots: 1 }, { id: 'r_ori', rate: 0.6 }, { id: 'u_white', rate: 1 }, { id: 'c_scorpking', rate: 0.01 }],
  desc: '사막의 지배자. 집게로 내리찍고 독침을 꽂는다. [필드 보스]',
});
mob({
  id: 'pharaoh', name: '모래의 파라오', lv: 66, hp: 260000, atk: [520, 700], def: 55, mdef: 70, agi: 60, dex: 140, luk: 50,
  element: 'shadow', race: 'demon', size: 'large', range: 40, delay: 1300, speed: 55, aggressive: true, boss: 'mvp', scale: 2.2, expMul: 70, flying: true,
  sprite: 'wraith', palette: ['#c8a040', '#ffd060', '#40e0ff'],
  skills: [{ kind: 'bolt', cd: 3200, mult: 1.6, element: 'shadow' }, { kind: 'slam', cd: 8000, mult: 2.3, radius: 115, element: 'shadow' }, { kind: 'summon', cd: 14000, summon: 'mummy', count: 3 }, { kind: 'heal', cd: 25000, below: 0.3 }],
  drops: [{ id: 'e_pharaohmask', rate: 1 }, { id: 'w_goldmace', rate: 0.08, slots: 1 }, { id: 'w_sunblade', rate: 0.06, slots: 1 }, { id: 'a_wizard', rate: 0.08, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_pharaoh', rate: 0.02 }],
  desc: '피라미드 깊은 곳에서 깨어난 왕. 성속성이 잘 통한다. [MVP]',
});

// ═════ 얼어붙은 설원 (Lv 60–75)
mob({
  id: 'snowjelly', name: '눈 말랑', lv: 60, hp: 6000, atk: [198, 240], def: 25, mdef: 30, agi: 40, dex: 80,
  element: 'water', race: 'plant', size: 'medium', range: 26, delay: 1300, speed: 50, aggressive: false,
  sprite: 'jelly', palette: ['#f4faff', '#a8d0f0', '#ffffff'],
  drops: [{ id: 'e_snowflake', rate: 0.5 }, { id: 'e_jelly', rate: 0.4 }, { id: 'u_white', rate: 0.05 }, { id: 'u_blue', rate: 0.02 }, { id: 'g_feather', rate: 0.0012, slots: 1 }, { id: 'c_snowjelly', rate: 0.001 }],
  desc: '눈처럼 하얀 말랑. 차가워서 만지면 손이 시리다.',
});
mob({
  id: 'frostwolf', name: '서리 늑대', lv: 62, hp: 6800, atk: [220, 270], def: 25, mdef: 15, agi: 85, dex: 85,
  element: 'water', race: 'brute', size: 'medium', range: 26, delay: 900, speed: 120, aggressive: true, atkElement: 'water',
  sprite: 'wolf', palette: ['#c8e0f8', '#7aa0d0', '#ffffff'],
  drops: [{ id: 'e_claw', rate: 0.5 }, { id: 'u_meat', rate: 0.2 }, { id: 'a_hunter', rate: 0.0012, slots: 1 }, { id: 'r_ori', rate: 0.006 }, { id: 'c_frostwolf', rate: 0.001 }],
  desc: '입김마저 얼어붙는 늑대. 바람속성에 약하다.',
});
mob({
  id: 'icewisp', name: '얼음 정령', lv: 64, hp: 6000, atk: [238, 288], def: 10, mdef: 60, agi: 70, dex: 100,
  element: 'water', race: 'formless', size: 'small', range: 30, delay: 1200, speed: 85, aggressive: true, flying: true, atkElement: 'water',
  sprite: 'wisp', palette: ['#d8f4ff', '#7ac0f0', '#ffffff'],
  drops: [{ id: 'e_icecore', rate: 0.35 }, { id: 'u_blue', rate: 0.04 }, { id: 'w_frostrod', rate: 0.0008, slots: 1 }, { id: 'e_gem', rate: 0.006 }, { id: 'c_icewisp', rate: 0.001 }],
  desc: '얼음 결정이 모여 생긴 정령. 마법 방어가 높다.',
});
mob({
  id: 'yeti', name: '설인', lv: 66, hp: 9500, atk: [258, 318], def: 40, mdef: 20, agi: 30, dex: 80,
  element: 'water', race: 'brute', size: 'large', range: 30, delay: 1400, speed: 60, aggressive: false, scale: 1.1,
  sprite: 'yeti', palette: ['#f4f8ff', '#b8c8e0', '#6a8ab0'],
  drops: [{ id: 'e_yetifur', rate: 0.5 }, { id: 'u_white', rate: 0.06 }, { id: 'a_knight', rate: 0.0012, slots: 1 }, { id: 'r_elu', rate: 0.006 }, { id: 'c_yeti', rate: 0.001 }],
  desc: '설원을 어슬렁거리는 거구. 화나게 하지 말자.',
});
mob({
  id: 'icegolem', name: '빙결 골렘', lv: 70, hp: 13000, atk: [298, 358], def: 60, mdef: 30, agi: 15, dex: 80,
  element: 'water', race: 'formless', size: 'large', range: 30, delay: 1700, speed: 30, aggressive: false, scale: 1.15,
  sprite: 'golem', palette: ['#bfe4ff', '#6aa0d0', '#ffffff'],
  drops: [{ id: 'e_icecore', rate: 0.5 }, { id: 'r_ori', rate: 0.01 }, { id: 'r_elu', rate: 0.01 }, { id: 'w_lance', rate: 0.0008, slots: 1 }, { id: 'c_icegolem', rate: 0.001 }],
  desc: '빙하가 깨어나 걷는다. 바람속성 공격이 잘 박힌다.',
});
mob({
  id: 'yetiking', name: '설원의 군주', lv: 74, hp: 160000, atk: [600, 760], def: 60, mdef: 40, agi: 50, dex: 130, luk: 30,
  element: 'water', race: 'brute', size: 'large', range: 38, delay: 1200, speed: 75, aggressive: true, boss: 'field', scale: 1.9, expMul: 22,
  sprite: 'yeti', palette: ['#ffffff', '#c8d8f0', '#3a5a9a'],
  skills: [{ kind: 'slam', cd: 7000, mult: 2.1, radius: 100, element: 'water' }, { kind: 'charge', cd: 9000, mult: 1.9 }, { kind: 'howl', cd: 15000, summon: 'frostwolf', count: 3 }],
  drops: [{ id: 'w_titanaxe', rate: 0.06, slots: 1 }, { id: 'a_smith', rate: 0.06, slots: 1 }, { id: 'a_knight', rate: 0.06, slots: 1 }, { id: 'r_ori', rate: 0.7 }, { id: 'u_white', rate: 1 }, { id: 'c_yetiking', rate: 0.01 }],
  desc: '설원의 우두머리. 울부짖으면 늑대가 모인다. [필드 보스]',
});
mob({
  id: 'frostwitch', name: '서리 마녀', lv: 82, hp: 450000, atk: [780, 980], def: 65, mdef: 80, agi: 80, dex: 170, luk: 60,
  element: 'water', race: 'demon', size: 'medium', range: 40, delay: 1200, speed: 60, aggressive: true, boss: 'mvp', scale: 2.1, expMul: 70, flying: true,
  sprite: 'wraith', palette: ['#5a8ac8', '#bfefff', '#ffffff'],
  skills: [{ kind: 'bolt', cd: 3000, mult: 1.7, element: 'water' }, { kind: 'slam', cd: 7500, mult: 2.4, radius: 120, element: 'water' }, { kind: 'summon', cd: 14000, summon: 'icewisp', count: 3 }, { kind: 'heal', cd: 25000, below: 0.3 }],
  drops: [{ id: 'e_frostheart', rate: 1 }, { id: 'w_frostrod', rate: 0.08, slots: 2 }, { id: 'w_lance', rate: 0.06, slots: 2 }, { id: 'g_feather', rate: 0.1, slots: 1 }, { id: 'r_ori', rate: 1 }, { id: 'r_elu', rate: 1 }, { id: 'c_frostwitch', rate: 0.02 }],
  desc: '설원을 영원한 겨울로 만든 마녀. 바람속성이 잘 통한다. [MVP]',
});

export function monster(id: string): MonsterDef {
  const m = MONSTERS[id];
  if (!m) throw new Error('unknown monster ' + id);
  return m;
}
