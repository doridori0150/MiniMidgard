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
/** what each stat does FOR THIS LINE (same RO formulas for everyone — weapons, HP/SP growth, job bonuses and skills
 *  are what make a stat matter more or less for a class) */
const LINE_STAT_HELP: Record<string, Partial<Record<StatKey, string>>> = {
  swordsman: {
    str: '검·창·양손검 공격력의 핵심. 10마다 보너스 공격력이 크게 오릅니다. 강타·꿰뚫기 피해도 여기서 나옵니다.',
    agi: '공격 속도와 회피. 질풍·크리 기사의 주력, 창기사는 조금만.',
    vit: '검사 계열은 HP 성장이 가장 커서 VIT의 HP 효과가 큽니다. 몰이·탱커 빌드의 주력.',
    int: '기사에게는 SP(강타·꿰뚫기 횟수)와 마법 방어 정도. 마검 기사가 아니면 낮게.',
    dex: '명중과 최소 피해. 크리 기사는 DEX를 버리고 크리 필중으로 명중을 해결합니다.',
    luk: '크리티컬. 광월 크리 기사의 주력이고, 크리는 회피를 무시합니다.',
  },
  mage: {
    str: '마법사에게는 거의 쓸모가 없습니다.',
    agi: '평타 속도와 회피. 마법사는 낮게.',
    vit: 'HP와 버티기. 인바탈 술사는 이걸로 솔로를 버팁니다.',
    int: '마법 공격력·최대 SP·SP 회복의 핵심. 볼트·광역기 피해가 모두 여기서 나옵니다.',
    dex: '시전 시간 감소(150이면 무영창). 인덱 학자의 두 번째 축.',
    luk: '마법사에게는 효과가 작습니다.',
  },
  archer: {
    str: '활을 쓰면 공격력이 조금만(5당 1) 오릅니다. 맨손(주먹 매)일 때는 공격력의 핵심.',
    agi: '활 공속과 회피. 명궁·주먹 매·몰이 매의 축.',
    vit: 'HP. 궁수는 HP 성장이 낮아 몰이 매·덫꾼은 VIT가 필요합니다.',
    int: '블리츠 비트 피해(INT/2)와 덫 피해, SP. 매 한 방·덫꾼의 주력.',
    dex: '활 공격력의 핵심이자 명중·시전. 블리츠 피해에도 조금 더해집니다.',
    luk: '오토 블리츠 확률(LUK/3 %)과 크리. 주먹 매·몰이 매의 주력.',
  },
  acolyte: {
    str: '둔기 공격력. 철퇴·광휘 크리 사제만 올립니다.',
    agi: '공속과 회피. 철퇴·광휘 사제의 축, 속도 증가로 더 오릅니다.',
    vit: 'HP와 버티기. 수호·방패 사제의 축.',
    int: '힐량((레벨+INT)/8 × 계수)·최대 SP·SP 회복. 힐은 불사에게 성 피해가 됩니다.',
    dex: '시전 시간과 명중. 퇴마 사제의 대퇴마 시전에 중요.',
    luk: '크리. 광휘 크리 사제는 영광송(LUK +30)과 함께 올립니다.',
  },
  thief: {
    str: '단검·카타르 공격력의 핵심.',
    agi: '공속과 회피. 도둑 계열은 회피 향상과 합쳐 회피 탱커가 됩니다.',
    vit: 'HP. 몰이(그림자 이빨)를 하면 필요합니다.',
    int: '도둑에게는 SP 정도.',
    dex: '명중·최소 피해. 음속 카타르·쌍단검은 빗나가지 않게 30~50.',
    luk: '크리 — 카타르는 크리가 2배라 치명 카타르의 주력.',
  },
  merchant: {
    str: '도끼·둔기 공격력과 금화 강타·카트 회전 피해의 핵심.',
    agi: '공속과 회피. 전투 대장장이의 축.',
    vit: 'HP. 상인 계열은 HP 성장이 좋아 카트 몰이에 잘 맞습니다.',
    int: '상인에게는 SP 정도.',
    dex: '명중과 최소 피해. 해머 제압·장인의 축.',
    luk: '크리와 약간의 공격력. 광석 사냥꾼이 올립니다.',
  },
};
const LINE_OF_CLASS: Record<string, string> = {
  swordsman: 'swordsman', knight: 'swordsman', mage: 'mage', wizard: 'mage', archer: 'archer', hunter: 'archer',
  acolyte: 'acolyte', priest: 'acolyte', thief: 'thief', assassin: 'thief', merchant: 'merchant', blacksmith: 'merchant',
};
export function statHelp(cls: string, k: StatKey): string {
  return LINE_STAT_HELP[LINE_OF_CLASS[cls] ?? '']?.[k] ?? STAT_HELP[k];
}

export const STAT_HELP: Record<StatKey, string> = {
  str: '근접 공격력, 무게. 10마다 보너스 공격력이 크게 오릅니다.',
  agi: '공격 속도와 회피율(FLEE).',
  vit: '최대 HP, HP 회복, 방어력(소프트 DEF).',
  int: '마법 공격력, 최대 SP, SP 회복, 마법 방어.',
  dex: '명중률(HIT), 시전 시간 감소, 활 공격력, 대미지 안정성.',
  luk: '크리티컬, 완전 회피, 약간의 공격력과 명중.',
};
