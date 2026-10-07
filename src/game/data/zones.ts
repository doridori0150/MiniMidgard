export type ZoneTheme = 'meadow' | 'forest' | 'cave' | 'town' | 'desert' | 'snow';

export interface ZoneDef {
  id: string;
  name: string;
  theme: ZoneTheme;
  lv: [number, number];
  bgm: string;
  mobs: { id: string; w: number }[];
  maxMobs: number;
  boss?: string;
  mvp?: string;
  bossGauge: number;
  mvpGauge: number;
  /** previous zone whose field boss must be defeated */
  unlockBy?: string;
  w: number;
  h: number;
  desc: string;
  /** position on the world map, % of map width/height */
  map: [number, number];
}

export const ZONES: ZoneDef[] = [
  {
    id: 'town', name: '미드가르 성', theme: 'town', lv: [1, 99], bgm: 'town', mobs: [], maxMobs: 0,
    bossGauge: 0, mvpGauge: 0, w: 760, h: 620,
    desc: '모험가들의 쉼터. 사냥은 하지 않고 HP·SP를 빠르게 회복합니다.', map: [48, 56],
  },
  {
    id: 'meadow', name: '햇살 평원', theme: 'meadow', lv: [1, 15], bgm: 'field',
    mobs: [{ id: 'jelly', w: 34 }, { id: 'wriggle', w: 22 }, { id: 'hornbun', w: 22 }, { id: 'sporelet', w: 14 }, { id: 'toxjelly', w: 10 }, { id: 'pup', w: 10 }],
    maxMobs: 12, boss: 'bunchief', mvp: 'jellyking', bossGauge: 90, mvpGauge: 360, w: 900, h: 760,
    desc: '성 바로 밖의 따뜻한 들판. 말랑이들이 한가롭게 뛰논다.', map: [46, 79],
  },
  {
    id: 'forest', name: '속삭이는 숲', theme: 'forest', lv: [15, 30], bgm: 'forest',
    mobs: [{ id: 'wolf', w: 26 }, { id: 'stingbee', w: 22 }, { id: 'mandra', w: 16 }, { id: 'shroom', w: 18 }, { id: 'mossjelly', w: 18 }],
    maxMobs: 11, boss: 'silverfang', mvp: 'treant', bossGauge: 110, mvpGauge: 420, unlockBy: 'meadow', w: 960, h: 800,
    desc: '바람이 나뭇잎 사이로 속삭이는 숲. 늑대 무리를 조심하자.', map: [19, 58],
  },
  {
    id: 'cave', name: '망자의 동굴', theme: 'cave', lv: [30, 45], bgm: 'dungeon',
    mobs: [{ id: 'skeleton', w: 28 }, { id: 'fangbat', w: 20 }, { id: 'shambler', w: 20 }, { id: 'wisp', w: 14 }, { id: 'bonearcher', w: 18 }],
    maxMobs: 11, boss: 'boneknight', mvp: 'wraith', bossGauge: 130, mvpGauge: 480, unlockBy: 'forest', w: 940, h: 800,
    desc: '죽은 자들이 잠들지 못하는 동굴. 성스러운 힘과 속성 공략이 필수.', map: [27, 30],
  },
  {
    id: 'desert', name: '작열하는 사막', theme: 'desert', lv: [45, 60], bgm: 'field',
    mobs: [{ id: 'sandjelly', w: 24 }, { id: 'scorpion', w: 22 }, { id: 'jackal', w: 20 }, { id: 'mummy', w: 18 }, { id: 'sandgolem', w: 16 }],
    maxMobs: 11, boss: 'scorpking', mvp: 'pharaoh', bossGauge: 140, mvpGauge: 520, unlockBy: 'cave', w: 980, h: 820,
    desc: '태양이 모든 것을 태우는 사막. 불속성 몬스터가 많아 물속성 공격이 효과적이다.', map: [79, 62],
  },
  {
    id: 'snow', name: '얼어붙은 설원', theme: 'snow', lv: [60, 75], bgm: 'title',
    mobs: [{ id: 'snowjelly', w: 24 }, { id: 'frostwolf', w: 22 }, { id: 'icewisp', w: 16 }, { id: 'yeti', w: 20 }, { id: 'icegolem', w: 18 }],
    maxMobs: 11, boss: 'yetiking', mvp: 'frostwitch', bossGauge: 150, mvpGauge: 560, unlockBy: 'desert', w: 980, h: 820,
    desc: '눈보라가 그치지 않는 북쪽 끝. 물속성 일색이라 바람속성이 최고의 무기.', map: [66, 17],
  },
];

export function zone(id: string): ZoneDef {
  const z = ZONES.find((z) => z.id === id);
  if (!z) throw new Error('unknown zone ' + id);
  return z;
}
