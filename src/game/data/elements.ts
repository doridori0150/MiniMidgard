import type { Element, Race, Size, WeaponType, StatKey } from '../types.ts';

export const ELEMENTS: Element[] = ['neutral', 'water', 'earth', 'fire', 'wind', 'poison', 'holy', 'shadow', 'ghost', 'undead'];

export const ELEMENT_KO: Record<Element, string> = {
  neutral: '무', water: '물', earth: '땅', fire: '불', wind: '바람',
  poison: '독', holy: '성', shadow: '암흑', ghost: '염', undead: '불사',
};

export const ELEMENT_COLOR: Record<Element, string> = {
  neutral: '#b9b2a6', water: '#4aa8ff', earth: '#b8864a', fire: '#ff6a3d', wind: '#7bd96a',
  poison: '#a65fd6', holy: '#ffe27a', shadow: '#6a5a8c', ghost: '#9fd4e6', undead: '#7c8a6a',
};

/** attack element (row) vs defending element level 1 (col), percent. */
const T: Record<Element, number[]> = {
  //          neu  wat  ear  fir  win  poi  hol  sha  gho  und
  neutral: [100, 100, 100, 100, 100, 100, 100, 100, 25, 100],
  water:   [100, 25, 100, 150, 50, 100, 75, 100, 100, 100],
  earth:   [100, 100, 25, 50, 150, 100, 75, 100, 100, 100],
  fire:    [100, 50, 150, 25, 100, 100, 75, 100, 100, 125],
  wind:    [100, 175, 50, 100, 25, 100, 75, 100, 100, 100],
  poison:  [100, 100, 125, 125, 125, 0, 75, 50, 100, 50],
  holy:    [100, 100, 100, 100, 100, 100, 0, 125, 100, 150],
  shadow:  [100, 100, 100, 100, 100, 50, 125, 0, 100, 25],
  ghost:   [25, 100, 100, 100, 100, 100, 75, 75, 125, 100],
  undead:  [100, 100, 100, 100, 100, 50, 100, 0, 100, 0],
};

export function elementMod(atk: Element, def: Element): number {
  return T[atk][ELEMENTS.indexOf(def)] / 100;
}

export const RACE_KO: Record<Race, string> = {
  formless: '무형', undead: '불사', brute: '동물', plant: '식물', insect: '곤충',
  fish: '어패', demon: '악마', demihuman: '인간형', angel: '천사', dragon: '용족',
};

export const SIZE_KO: Record<Size, string> = { small: '소형', medium: '중형', large: '대형' };

export const WEAPON_KO: Record<WeaponType, string> = {
  none: '맨손', dagger: '단검', sword: '한손검', sword2h: '양손검', spear: '창', staff: '지팡이', bow: '활', mace: '둔기', axe: '도끼', katar: '카타르',
};

/** weapon size modifiers (small, medium, large) in percent. */
export const SIZE_MOD: Record<WeaponType, [number, number, number]> = {
  none: [100, 100, 100],
  dagger: [100, 75, 50],
  sword: [75, 100, 75],
  sword2h: [75, 75, 100],
  spear: [75, 75, 100],
  katar: [75, 100, 75],
  staff: [100, 100, 100],
  bow: [100, 100, 75],
  mace: [75, 100, 100],
  axe: [50, 75, 100],
};

export function sizeMod(w: WeaponType, s: Size): number {
  return SIZE_MOD[w][s === 'small' ? 0 : s === 'medium' ? 1 : 2] / 100;
}

export const STAT_KO: Record<StatKey, string> = { str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK' };
export const STAT_HELP: Record<StatKey, string> = {
  str: '근접 공격력, 무게. 10마다 보너스 공격력이 크게 오릅니다.',
  agi: '공격 속도와 회피율(FLEE).',
  vit: '최대 HP, HP 회복, 방어력(소프트 DEF).',
  int: '마법 공격력, 최대 SP, SP 회복, 마법 방어.',
  dex: '명중률(HIT), 시전 시간 감소, 활 공격력, 대미지 안정성.',
  luk: '크리티컬, 완전 회피, 약간의 공격력과 명중.',
};
