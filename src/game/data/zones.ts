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
  /** other zones whose field boss also opens this one (roads between home regions: any one is enough) */
  alsoBy?: string[];
  /** open from the very start (the beginner field of a first job's home region) */
  start?: boolean;
  w: number;
  h: number;
  desc: string;
  /** position on the world map, % of map width/height */
  map: [number, number];
  /** region this map belongs to (world-map grouping), e.g. '햇살 평원 지방' */
  region?: string;
  kind?: 'field' | 'dungeon';
  /** optional colour tint over the theme (e.g. a darker dungeon floor) */
  tint?: string;
  /** sealed / hidden maps: conditions instead of (or on top of) unlockBy */
  gate?: ZoneGate;
  /** what the map is for (world-map tags, sim map choice): exp = 경험치, loot = 득템, ore = 광석, zeny = 제니, mvp = MVP 층 */
  role?: ZoneRole[];
  /** item ids the map is known for (특산품) — shown on the map card */
  specialty?: string[];
}

export type ZoneRole = 'exp' | 'loot' | 'ore' | 'zeny' | 'mvp';

/** what it takes to find and open a sealed or hidden map; every `need` must hold */
export interface ZoneGate {
  /** cryptic rumour shown on the world map before it opens ("…라는 소문이 있다") */
  hint: string;
  /** not on the map at all until discovered (clue item obtained, or the first need is met) */
  hidden?: boolean;
  /** item whose first pickup reveals the map (an old map scrap, a strange key…) */
  clue?: string;
  need: GateNeed[];
  /** log/announce line when the seal opens */
  openText?: string;
}

export type GateNeed =
  /** carry N of an item; consume = offered once to break the seal for good */
  | { kind: 'item'; id: string; qty: number; consume?: boolean }
  /** cumulative kills of a monster (monster book) */
  | { kind: 'kills'; mob: string; n: number }
  /** this boss / MVP defeated at least once */
  | { kind: 'boss'; mob: string }
  /** this monster's card found at least once */
  | { kind: 'card'; mob: string }
  /** highest party base level */
  | { kind: 'level'; lv: number }
  /** someone in the party has reached this job tier (1 = first job, 2 = second job) */
  | { kind: 'job'; tier: 1 | 2 }
  /** someone in the party is wearing this piece of equipment */
  | { kind: 'equip'; id: string }
  /** only open during these local-clock hours (from → to, may wrap past midnight: 22 → 4) */
  | { kind: 'hours'; from: number; to: number };

// Region spots on the world map (mean of their maps' pins): 미드가르 [48,57] · 햇살 평원 [50,82] · 속삭이는 숲 [13,53]
// · 잿빛 광산 [24,27] · 안개 호수 [46,33] · 작열하는 사막 [80,65] · 푸른 항구 [26,77] · 얼어붙은 설원 [62,15]
// · 하늘 유적 [85,14] (a floating island off the north-east coast). Maps cluster around their region's spot.
// The list is sorted by entry level (the wipe-retreat prefers the strongest easier map); `region` groups maps.
//
// v0.4: every first job has a home region (REGION_INFO) whose beginner field is open from the start (`start`),
// each home has its own boss ladder to about Lv 40, and the ladders cross into the mid regions through `alsoBy`.
//
// Gate authoring rules (see docs/CONTENT.md · 숨겨진 장소):
//  · hidden maps are revealed by their `clue` item or by the FIRST non-`hours` need → put that need first;
//  · the checklist shows met needs + the next one, so order needs as a story;
//  · `hours` windows are ≥ 4 h; every clue / offering item is a rare etc item with lore in its description;
//  · every gate has its own `openText`.
export const ZONES: ZoneDef[] = [
  {
    id: 'town', name: '미드가르 성', theme: 'town', lv: [1, 99], bgm: 'town', mobs: [], maxMobs: 0,
    bossGauge: 0, mvpGauge: 0, w: 760, h: 620, region: '미드가르',
    desc: '모험가들의 쉼터. 사냥은 하지 않고 HP·SP를 빠르게 회복합니다.', map: [48, 57],
  },
  {
    id: 'meadow', name: '햇살 평원', theme: 'meadow', lv: [1, 12], bgm: 'field', region: '햇살 평원 지방', kind: 'field', role: ['exp'], start: true,
    mobs: [{ id: 'jelly', w: 34 }, { id: 'wriggle', w: 22 }, { id: 'hornbun', w: 22 }, { id: 'sporelet', w: 14 }, { id: 'toxjelly', w: 10 }, { id: 'pup', w: 10 }],
    maxMobs: 12, boss: 'bunchief', bossGauge: 90, mvpGauge: 0, w: 900, h: 760,
    specialty: ['w_knife', 'h_flower', 'h_bunny'],
    desc: '성 바로 밖의 따뜻한 들판. 말랑이들이 한가롭게 뛰논다. 뿔토끼 대장을 쓰러뜨리면 언덕·수로·수도원 묘지로 길이 열린다.', map: [50, 79],
  },
  {
    id: 'lakeshore', name: '호숫가 풀밭', theme: 'meadow', tint: '#7ad0d0', lv: [1, 12], bgm: 'field', region: '안개 호수 지방', kind: 'field', role: ['exp'], start: true,
    mobs: [{ id: 'jelly', w: 28 }, { id: 'wriggle', w: 16 }, { id: 'hornbun', w: 16 }, { id: 'dragonfly', w: 18 }, { id: 'sporelet', w: 10 }, { id: 'minnow', w: 14 }],
    maxMobs: 12, boss: 'catfish', bossGauge: 90, mvpGauge: 0, w: 900, h: 760,
    specialty: ['w_willowrod', 'h_lilypad', 'x_mistmirror'],
    desc: '안개가 낮게 깔린 호숫가. 실잠자리가 날고 피라미가 물가로 튀어 오른다. 수염 메기를 쓰러뜨리면 안개 늪과 마도탑으로 길이 열린다.', map: [42, 40],
  },
  {
    id: 'beach', name: '파도 해변', theme: 'desert', tint: '#fff4d8', lv: [1, 12], bgm: 'field', region: '푸른 항구 지방', kind: 'field', role: ['exp'], start: true,
    mobs: [{ id: 'jelly', w: 28 }, { id: 'wriggle', w: 14 }, { id: 'hermit', w: 20 }, { id: 'gull', w: 18 }, { id: 'hornbun', w: 8 }, { id: 'minnow', w: 12 }],
    maxMobs: 12, boss: 'kingcrab', bossGauge: 90, mvpGauge: 0, w: 900, h: 760,
    specialty: ['w_shipaxe', 'h_sailor', 'e_pearl'],
    desc: '항구 옆 하얀 모래사장. 소라게가 기어 다니고 갈매기가 먹이를 노린다. 대왕 집게를 쓰러뜨리면 등대 곶과 난파선으로 길이 열린다.', map: [34, 76],
  },
  {
    id: 'woodedge', name: '숲 어귀', theme: 'forest', tint: '#d8f0a0', lv: [2, 12], bgm: 'forest', region: '속삭이는 숲 지방', kind: 'field', role: ['exp'], start: true,
    mobs: [{ id: 'jelly', w: 28 }, { id: 'wriggle', w: 18 }, { id: 'hornbun', w: 18 }, { id: 'sporelet', w: 14 }, { id: 'owlet', w: 14 }, { id: 'pup', w: 10 }],
    maxMobs: 12, boss: 'owlchief', bossGauge: 90, mvpGauge: 0, w: 900, h: 760,
    specialty: ['h_owlwing', 'am_wind', 'w_composite'],
    desc: '햇살이 아직 드는 숲의 가장자리. 아기 부엉이와 꼬마 늑대가 사는 궁수들의 연습장. 부엉이 대장을 쓰러뜨리면 버섯 골짜기와 속삭이는 숲으로 길이 열린다.', map: [22, 52],
  },
  {
    id: 'dunes', name: '모래 언덕 변두리', theme: 'desert', tint: '#fff0b8', lv: [3, 13], bgm: 'field', region: '작열하는 사막 지방', kind: 'field', role: ['exp'], start: true,
    mobs: [{ id: 'jelly', w: 24 }, { id: 'wriggle', w: 16 }, { id: 'hornbun', w: 18 }, { id: 'cactling', w: 18 }, { id: 'fennec', w: 14 }, { id: 'toxjelly', w: 10 }],
    maxMobs: 12, boss: 'foxchief', bossGauge: 90, mvpGauge: 0, w: 900, h: 760,
    specialty: ['w_dunedagger', 'h_foxears', 'x_brooch'],
    desc: '사막이 시작되는 낮은 모래 언덕. 꼬마 선인장과 사막여우가 사는 도둑들의 놀이터. 사막여우 두목이 도적 소굴의 입구를 알고 있다.', map: [72, 58],
  },
  {
    id: 'wheatfield', name: '황금 밀밭', theme: 'meadow', tint: '#ffd860', lv: [4, 14], bgm: 'field', region: '햇살 평원 지방', kind: 'field', role: ['exp'], start: true,
    mobs: [{ id: 'hornbun', w: 22 }, { id: 'wriggle', w: 16 }, { id: 'sporelet', w: 14 }, { id: 'grasshopper', w: 22 }, { id: 'toxjelly', w: 12 }, { id: 'pup', w: 14 }],
    maxMobs: 15, bossGauge: 0, mvpGauge: 0, w: 900, h: 760,
    specialty: ['x_workglove', 'w_flail', 'h_bandana'],
    desc: '성 동쪽의 끝없는 밀밭. 비선공 몬스터가 어느 들판보다 빽빽해 한꺼번에 몰아 베기 좋다(검사의 땅). 메뚜기 카드는 회피를, 일꾼들이 잃어버린 밭일 장갑은 명중을 메운다.', map: [58, 74],
  },
  {
    id: 'clover', name: '네잎 언덕', theme: 'meadow', tint: '#fff2b0', lv: [8, 18], bgm: 'field', region: '햇살 평원 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'ladybug', w: 26 }, { id: 'sprout', w: 24 }, { id: 'puffball', w: 20 }, { id: 'hornbun', w: 20 }, { id: 'jelly', w: 10 }],
    maxMobs: 11, bossGauge: 0, mvpGauge: 0, unlockBy: 'meadow', w: 900, h: 760,
    specialty: ['h_leaf', 'm_hairpin', 'x_clover'],
    desc: '바람개비가 도는 낮은 언덕. 새싹 정령의 풀잎, 무당벌레가 숨긴 머리핀, 네잎클로버를 찾아보자. 바람·땅속성이 섞여 있다.', map: [61, 86],
  },
  {
    id: 'mushvale', name: '버섯 골짜기', theme: 'forest', tint: '#a888d0', lv: [9, 19], bgm: 'forest', region: '속삭이는 숲 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'toadstool', w: 28 }, { id: 'sprout', w: 18 }, { id: 'mandra', w: 16 }, { id: 'puffball', w: 16 }, { id: 'shroom', w: 14 }],
    maxMobs: 11, bossGauge: 0, mvpGauge: 0, unlockBy: 'woodedge', w: 920, h: 780,
    specialty: ['x_mushcharm', 'h_mushroom', 'w_wand'],
    desc: '포자가 반짝이며 떠다니는 축축한 골짜기. 독버섯(독)·새싹(땅)·홀씨(바람)가 섞여 있다. 버섯 모자와 버섯 부적의 산지.', map: [8, 48],
  },
  {
    id: 'mistmarsh', name: '안개 늪', theme: 'forest', tint: '#9ab8b8', lv: [10, 20], bgm: 'forest', region: '안개 호수 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'mandra', w: 24 }, { id: 'mistwisp', w: 22 }, { id: 'leech', w: 16 }, { id: 'drownjelly', w: 14 }, { id: 'minnow', w: 12 }, { id: 'toxjelly', w: 10 }],
    maxMobs: 11, bossGauge: 0, mvpGauge: 0, unlockBy: 'lakeshore', w: 920, h: 780,
    specialty: ['x_mistmirror', 'a_silk', 'h_ribbon'],
    desc: '한낮에도 안개가 걷히지 않는 늪. 뿌리박은 맨드라 꽃(땅)에는 불 주문을, 물것들에는 번개를 — 마법사의 땅. 안개 정령이 품은 작은 거울은 호수 어딘가를 비춘다고.', map: [52, 39],
  },
  {
    id: 'lighthouse', name: '등대 곶', theme: 'meadow', tint: '#a8d8e8', lv: [10, 20], bgm: 'field', region: '푸른 항구 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'lamplight', w: 26 }, { id: 'puffball', w: 18 }, { id: 'leech', w: 16 }, { id: 'rat', w: 14 }, { id: 'gull', w: 12 }, { id: 'hermit', w: 8 }],
    maxMobs: 11, bossGauge: 0, mvpGauge: 0, unlockBy: 'beach', w: 920, h: 780,
    specialty: ['x_seaglass', 'g_sailcloth', 'am_fire'],
    desc: '바닷바람이 거센 곶 끝의 하얀 등대. 등대 불빛(불)·홀씨(바람)·거머리(물)가 섞여 있다. 바다 유리 펜던트와 돛천 망토가 나온다.', map: [18, 72],
  },
  {
    id: 'culvert', name: '물레방아 수로', theme: 'cave', tint: '#3a6a7a', lv: [12, 20], bgm: 'dungeon', region: '햇살 평원 지방', kind: 'dungeon', role: ['exp', 'zeny'],
    mobs: [{ id: 'rat', w: 30 }, { id: 'leech', w: 24 }, { id: 'coinbug', w: 22 }, { id: 'toxjelly', w: 12 }],
    maxMobs: 12, boss: 'ratking', bossGauge: 100, mvpGauge: 0, unlockBy: 'meadow', w: 900, h: 760,
    specialty: ['e_coin', 'w_gauche', 'a_jacket'],
    desc: '평원 물레방아 아래로 이어진 축축한 수로 1층. 동전벌레가 모아 둔 녹슨 동전이 짭짤하다. 수로 쥐왕이 아래층 수문을 지킨다.', map: [41, 73],
  },
  {
    id: 'thiefden', name: '도적 소굴', theme: 'cave', tint: '#8a6a40', lv: [13, 24], bgm: 'dungeon', region: '작열하는 사막 지방', kind: 'dungeon', role: ['exp', 'zeny'],
    mobs: [{ id: 'thiefbug', w: 30 }, { id: 'coinbug', w: 20 }, { id: 'dustbat', w: 20 }, { id: 'rat', w: 18 }],
    maxMobs: 12, boss: 'shadowboss', bossGauge: 100, mvpGauge: 0, unlockBy: 'dunes', w: 900, h: 760,
    specialty: ['w_dirk', 'l_bandit', 'a_thief'],
    desc: '모래 언덕 밑에 판 도적들의 굴. 좀도둑 벌레가 훔친 금화를 끌어모은다. 그림자 두목을 쓰러뜨리면 붉은 바위 협곡과 채석장으로 가는 뒷길이 열린다.', map: [86, 76],
  },
  {
    id: 'abbeyyard', name: '수도원 묘지', theme: 'forest', tint: '#6a6a90', lv: [14, 24], bgm: 'title', region: '햇살 평원 지방', kind: 'field', role: ['exp'],
    mobs: [{ id: 'boneling', w: 30 }, { id: 'candlewisp', w: 20 }, { id: 'dustbat', w: 16 }, { id: 'wolf', w: 14 }, { id: 'rat', w: 10 }, { id: 'mossjelly', w: 10 }],
    maxMobs: 12, bossGauge: 0, mvpGauge: 0, unlockBy: 'meadow', w: 920, h: 780,
    specialty: ['a_saint', 'x_rosary', 'am_silver'],
    desc: '버려진 수도원 뒤편의 묘지. 꼬마 해골(불사)과 촛불 망령(염)이 떠돈다. 성스러운 힘이나 속성 공격이 없으면 촛불 망령이 잘 안 죽는다 — 성직자의 숙제.', map: [40, 88],
  },
  {
    id: 'forest', name: '속삭이는 숲', theme: 'forest', lv: [15, 25], bgm: 'forest', region: '속삭이는 숲 지방', kind: 'field', role: ['exp'],
    mobs: [{ id: 'wolf', w: 26 }, { id: 'stingbee', w: 22 }, { id: 'mandra', w: 16 }, { id: 'shroom', w: 18 }, { id: 'mossjelly', w: 18 }],
    maxMobs: 11, boss: 'silverfang', bossGauge: 110, mvpGauge: 0, unlockBy: 'woodedge', w: 960, h: 800,
    specialty: ['w_saber', 'w_stiletto', 'h_cat'],
    desc: '바람이 나뭇잎 사이로 속삭이는 숲. 늑대 무리를 조심하자. 은빛 늑대왕을 쓰러뜨리면 깊은 숲·고목·채석장으로 길이 열린다.', map: [19, 54],
  },
  {
    id: 'culvert2', name: '수로 깊은 곳', theme: 'cave', tint: '#2a4a6a', lv: [17, 26], bgm: 'dungeon', region: '햇살 평원 지방', kind: 'dungeon', role: ['loot', 'mvp'],
    mobs: [{ id: 'drownjelly', w: 26 }, { id: 'eel', w: 22 }, { id: 'coinbug', w: 18 }, { id: 'leech', w: 14 }, { id: 'rat', w: 10 }],
    maxMobs: 11, mvp: 'jellyking', bossGauge: 0, mvpGauge: 400, unlockBy: 'culvert', w: 920, h: 780,
    specialty: ['w_harpoon', 'h_ribbon', 'h_crown'],
    desc: '물이 무릎까지 차오르는 수로 밑바닥. 물속성 일색이라 바람 무기가 좋다. 가장 깊은 곳에 왕관 쓴 말랑이 산다.', map: [35, 80],
  },
  {
    id: 'magetower1', name: '마도탑 1층', theme: 'cave', tint: '#5a5ab0', lv: [18, 28], bgm: 'dungeon', region: '안개 호수 지방', kind: 'dungeon', role: ['exp'],
    mobs: [{ id: 'spellbook', w: 34 }, { id: 'runegolem', w: 26 }, { id: 'candlewisp', w: 22 }],
    maxMobs: 12, boss: 'grimoire', bossGauge: 110, mvpGauge: 0, unlockBy: 'lakeshore', w: 900, h: 760,
    specialty: ['h_wizard', 'w_staff', 'x_earring'],
    desc: '호수 한가운데 솟은 마도탑의 서고. 떠도는 마법서와 룬 골렘이 견습생들을 기다린다. 금서를 봉인하면 위층과 채석장으로 가는 길이 열린다.', map: [46, 31],
  },
  {
    id: 'wreck', name: '난파선', theme: 'cave', tint: '#3a6070', lv: [18, 28], bgm: 'dungeon', region: '푸른 항구 지방', kind: 'dungeon', role: ['exp', 'zeny'],
    mobs: [{ id: 'piratebones', w: 30 }, { id: 'eel', w: 18 }, { id: 'parrot', w: 20 }, { id: 'drownjelly', w: 16 }],
    maxMobs: 12, boss: 'ghostcaptain', bossGauge: 110, mvpGauge: 0, unlockBy: 'beach', w: 920, h: 780,
    specialty: ['w_cutlass', 'm_piratepatch', 'e_doubloon'],
    desc: '암초에 걸려 반쯤 가라앉은 해적선. 해골 해적이 아직도 금화를 세고 있다. 유령 선장을 쓰러뜨리면 산호 동굴과 채석장으로 가는 물길이 열린다.', map: [22, 80],
  },
  {
    id: 'deepforest', name: '깊은 숲', theme: 'forest', tint: '#2a4a2a', lv: [23, 32], bgm: 'forest', region: '속삭이는 숲 지방', kind: 'field', role: ['loot', 'ore'],
    mobs: [{ id: 'firefly', w: 24 }, { id: 'bear', w: 22 }, { id: 'stump', w: 20 }, { id: 'wolf', w: 16 }, { id: 'mossjelly', w: 10 }],
    maxMobs: 11, bossGauge: 0, mvpGauge: 0, unlockBy: 'forest', w: 960, h: 800,
    specialty: ['a_wooden', 'a_bearhide', 'r_elu'],
    desc: '햇빛이 들지 않는 숲 안쪽. 그루터기에서 수호석·나무 갑옷·활이, 꿀곰에게서 곰가죽 갑옷이 나온다. 반딧불이(불)는 물로.', map: [10, 45],
  },
  {
    id: 'jellyrealm', name: '말랑말랑 왕국', theme: 'meadow', tint: '#ffc8e8', lv: [24, 34], bgm: 'field', region: '햇살 평원 지방', kind: 'field', role: ['exp', 'loot'],
    mobs: [{ id: 'rainbowjelly', w: 40 }, { id: 'drownjelly', w: 14 }, { id: 'mossjelly', w: 12 }, { id: 'angeljelly', w: 12 }, { id: 'devjelly', w: 12 }],
    maxMobs: 13, boss: 'jellyqueen', bossGauge: 110, mvpGauge: 0, w: 900, h: 760,
    specialty: ['h_jelly', 'x_jellyring', 'm_jellyblush'],
    gate: {
      hidden: true, clue: 'q_rainbowdrop',
      hint: '말랑이를 수백 마리 터뜨려 본 사람만 듣는다더라. 수로 밑바닥 왕관 쓴 말랑이 무지개 너머를 지킨다고.',
      need: [{ kind: 'kills', mob: 'jelly', n: 300 }, { kind: 'boss', mob: 'jellyking' }],
      openText: '말랑 대왕이 쓰러진 자리에 무지개 웅덩이가 일렁인다… 말랑말랑 왕국으로 가는 길이 열렸다!',
    },
    desc: '무지개 웅덩이 너머, 말랑이들만 사는 나라. 말랑이는 잡기 쉽고 경험치가 짭짤하며, 말랑 모자가 이곳에서 가장 잘 나온다. 날개 말랑(성)과 뿔 말랑(암흑)을 조심.', map: [62, 93],
  },
  {
    id: 'moonpath', name: '달그림자 오솔길', theme: 'forest', tint: '#3a3a8a', lv: [26, 38], bgm: 'title', region: '속삭이는 숲 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'moonbun', w: 30 }, { id: 'nightmoth', w: 26 }, { id: 'foxfire', w: 18 }, { id: 'wolf', w: 14 }],
    maxMobs: 11, boss: 'moonfox', bossGauge: 110, mvpGauge: 0, w: 940, h: 780,
    specialty: ['m_moonpin', 'x_bell', 'h_moonbunny'],
    gate: {
      hidden: true, clue: 'q_moonfur',
      hint: '밤이 되면 숲의 늑대들이 한쪽으로만 운다더군. 달이 높을 때 말이야.',
      need: [{ kind: 'boss', mob: 'silverfang' }, { kind: 'kills', mob: 'wolf', n: 200 }, { kind: 'hours', from: 20, to: 2 }],
      openText: '품속의 늑대털이 은빛으로 타오르더니, 달그림자 사이로 좁은 오솔길이 드러났다.',
    },
    desc: '달이 높을 때만 보이는 숲속 오솔길. 달토끼의 머리핀, 밤나방의 은방울, 여우불의 카드가 있다. 날이 밝으면 길이 사라진다.', map: [12, 64],
  },
  {
    id: 'magetower2', name: '마도탑 2층', theme: 'cave', tint: '#7a4ab0', lv: [26, 36], bgm: 'dungeon', region: '안개 호수 지방', kind: 'dungeon', role: ['loot'],
    mobs: [{ id: 'firebook', w: 26 }, { id: 'icebook', w: 24 }, { id: 'gargoyle', w: 22 }, { id: 'runegolem', w: 14 }],
    maxMobs: 11, boss: 'magephantom', bossGauge: 120, mvpGauge: 0, unlockBy: 'magetower1', w: 920, h: 780,
    specialty: ['w_runestaff', 'g_mageshawl', 'a_silk'],
    desc: '불꽃·얼음 마법서가 날아다니는 실험실. 불(물로)·물(바람으로)·땅(불로) 숙제가 한꺼번에 나온다. 수석 마도사의 환영이 꼭대기 계단과 철광 능선 쪽 창을 지킨다.', map: [48, 29],
  },
  {
    id: 'quarry', name: '잿빛 채석장', theme: 'desert', tint: '#a0a0a8', lv: [27, 36], bgm: 'field', region: '잿빛 광산 지방', kind: 'field', role: ['exp'],
    mobs: [{ id: 'pebble', w: 30 }, { id: 'rockworm', w: 26 }, { id: 'fangbat', w: 18 }],
    maxMobs: 12, boss: 'quarrygolem', bossGauge: 120, mvpGauge: 0, unlockBy: 'forest', alsoBy: ['magetower1', 'thiefden', 'wreck'], w: 940, h: 800,
    specialty: ['w_mace', 'w_pike', 'h_helm'],
    desc: '바위를 깎아 내던 채석장. 땅속성·무형뿐이라 불속성 무기가 빛난다. 숲·마도탑·도적 소굴·난파선에서 길이 모인다. 채석장 거인이 광산과 사막으로 가는 길을 막고 있다.', map: [34, 35],
  },
  {
    id: 'coralcave', name: '산호 동굴', theme: 'cave', tint: '#ff88a8', lv: [28, 38], bgm: 'dungeon', region: '푸른 항구 지방', kind: 'dungeon', role: ['loot'],
    mobs: [{ id: 'coralcrab', w: 28 }, { id: 'pufferfish', w: 26 }, { id: 'anemone', w: 20 }, { id: 'fangbat', w: 12 }],
    maxMobs: 11, boss: 'coralgolem', bossGauge: 120, mvpGauge: 0, unlockBy: 'wreck', w: 920, h: 780,
    specialty: ['w_anchor', 'x_coralring', 's_coralshield'],
    desc: '썰물 때만 입구가 드러나는 분홍빛 동굴. 산호게·말미잘(물)과 가시복어(독)가 섞여 있다. 산호 골렘이 심층으로 내려가는 물길을 막고 있다.', map: [30, 78],
  },
  {
    id: 'grove', name: '고목의 심장', theme: 'cave', tint: '#4a5a2a', lv: [30, 40], bgm: 'dungeon', region: '속삭이는 숲 지방', kind: 'dungeon', role: ['mvp'],
    mobs: [{ id: 'dryad', w: 30 }, { id: 'beetle', w: 28 }, { id: 'stump', w: 20 }],
    maxMobs: 11, mvp: 'treant', bossGauge: 0, mvpGauge: 450, unlockBy: 'forest', w: 920, h: 780,
    specialty: ['w_staff', 's_buckler', 'h_angel'],
    desc: '천 년 묵은 고목의 텅 빈 속. 나무 요정(바람)과 사슴벌레(땅)가 지키고, 가장 안쪽에 고목 정령이 잠들어 있다.', map: [7, 56],
  },
  {
    id: 'mine1', name: '버려진 광산 1층', theme: 'cave', tint: '#6a5a40', lv: [30, 38], bgm: 'dungeon', region: '잿빛 광산 지방', kind: 'dungeon', role: ['ore', 'loot'],
    mobs: [{ id: 'skelminer', w: 30 }, { id: 'orejelly', w: 26 }, { id: 'fangbat', w: 14 }, { id: 'rockworm', w: 14 }],
    maxMobs: 11, boss: 'foreman', bossGauge: 120, mvpGauge: 0, unlockBy: 'quarry', w: 920, h: 780,
    specialty: ['r_ori', 'w_battleaxe', 'm_minergog'],
    desc: '광부들이 떠난 갱도. 해골 광부와 광석 말랑에게서 별철·수호석이 나온다. 막다른 갱도에 룬이 새겨진 석문이 있다는데…', map: [18, 21],
  },
  {
    id: 'redcanyon', name: '붉은 바위 협곡', theme: 'desert', tint: '#d06a40', lv: [30, 42], bgm: 'field', region: '작열하는 사막 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'canyonhawk', w: 28 }, { id: 'rockworm', w: 22 }, { id: 'pebble', w: 18 }, { id: 'fangbat', w: 14 }, { id: 'beetle', w: 10 }],
    maxMobs: 11, bossGauge: 0, mvpGauge: 0, unlockBy: 'thiefden', w: 960, h: 800,
    specialty: ['w_hawktalon', 'x_hawkfeather', 'f_boots'],
    desc: '붉은 절벽 사이로 매가 맴도는 협곡. 붉은 매(바람)·사슴벌레(땅)·송곳니 박쥐(암흑)가 섞여 있다. 매발톱 카타르와 명중 부적이 나온다.', map: [70, 50],
  },
  {
    id: 'mirrorlake', name: '거울 호수', theme: 'snow', tint: '#8ab0e0', lv: [32, 42], bgm: 'title', region: '안개 호수 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'mirrorjelly', w: 34 }, { id: 'swan', w: 30 }, { id: 'dryad', w: 20 }],
    maxMobs: 11, boss: 'swanqueen', bossGauge: 110, mvpGauge: 0, w: 920, h: 780,
    specialty: ['h_swanwing', 'w_lakewand', 'x_mistmirror'],
    gate: {
      hidden: true,
      hint: '안개 거울을 건 사람이 새벽 안개 속 호숫가에 서면, 물에 비친 또 하나의 호숫가로 걸어 들어갈 수 있다더라.',
      need: [{ kind: 'equip', id: 'x_mistmirror' }, { kind: 'hours', from: 4, to: 10 }],
      openText: '목에 건 안개 거울이 호수와 똑같이 빛나자, 물에 비친 호숫가가 발밑으로 이어졌다. 거울 호수가 열렸다!',
    },
    desc: '물에 비친 쪽의 호숫가. 거울 말랑과 백조가 사는 고요한 은빛 호수다. 새벽 안개가 걷히면 길이 사라진다. 백조 여왕은 물속성이라 바람이 잘 든다.', map: [41, 33],
  },
  {
    id: 'cave', name: '망자의 동굴', theme: 'cave', lv: [33, 44], bgm: 'dungeon', region: '잿빛 광산 지방', kind: 'dungeon', role: ['exp'],
    mobs: [{ id: 'skeleton', w: 28 }, { id: 'shambler', w: 22 }, { id: 'bonearcher', w: 18 }, { id: 'wisp', w: 16 }, { id: 'fangbat', w: 10 }],
    maxMobs: 11, boss: 'boneknight', bossGauge: 130, mvpGauge: 0, unlockBy: 'mine1', w: 940, h: 800,
    specialty: ['w_tsurugi', 'h_apple', 'h_bonehelm'],
    desc: '광산 2층과 이어진 죽은 자들의 동굴. 불사·악마뿐이라 성스러운 힘과 불속성이 필수. 해골 기사가 아래층을 지킨다.', map: [24, 27],
  },
  {
    id: 'magetower3', name: '마도탑 꼭대기', theme: 'cave', tint: '#3a3a80', lv: [34, 44], bgm: 'dungeon', region: '안개 호수 지방', kind: 'dungeon', role: ['mvp'],
    mobs: [{ id: 'gargoyle', w: 28 }, { id: 'icebook', w: 20 }, { id: 'firebook', w: 18 }, { id: 'wisp', w: 18 }, { id: 'phantom', w: 12 }],
    maxMobs: 11, mvp: 'towerlord', bossGauge: 0, mvpGauge: 480, unlockBy: 'magetower2', w: 940, h: 800,
    specialty: ['w_mistrod', 'h_sagehat', 'w_arcwand'],
    desc: '별이 가장 가까운 탑의 꼭대기. 가고일이 지키는 천문대에 안개의 대현자가 산다. 대현자는 무속성이라 어떤 속성이든 고르게 들어간다.', map: [47, 26],
  },
  {
    id: 'ironridge', name: '철광 능선', theme: 'desert', tint: '#7a7a88', lv: [34, 44], bgm: 'field', region: '잿빛 광산 지방', kind: 'field', role: ['exp'],
    mobs: [{ id: 'ironbun', w: 32 }, { id: 'irongolem', w: 28 }, { id: 'rockworm', w: 14 }, { id: 'orejelly', w: 12 }, { id: 'beetle', w: 14 }],
    maxMobs: 12, bossGauge: 0, mvpGauge: 0, unlockBy: 'quarry', alsoBy: ['magetower2'], w: 960, h: 800,
    specialty: ['w_hammer', 'h_helm', 'f_boots'],
    desc: '쇳빛 바위가 이어진 능선. 철갑 뿔토끼와 무쇠 골렘 모두 땅속성이라 불속성 무기 하나면 된다. 채석장과 마도탑 창문 양쪽에서 내려올 수 있다.', map: [26, 31],
  },
  {
    id: 'abyss', name: '산호 동굴 심층', theme: 'cave', tint: '#1a2a6a', lv: [36, 46], bgm: 'dungeon', region: '푸른 항구 지방', kind: 'dungeon', role: ['mvp'],
    mobs: [{ id: 'deepfish', w: 30 }, { id: 'pufferfish', w: 20 }, { id: 'anemone', w: 18 }, { id: 'coralcrab', w: 14 }],
    maxMobs: 11, mvp: 'abyssdragon', bossGauge: 0, mvpGauge: 480, unlockBy: 'coralcave', w: 940, h: 800,
    specialty: ['w_trident', 'h_coralcrown', 'x_coralring'],
    desc: '빛이 닿지 않는 바다 밑 동굴. 초롱아귀의 불빛만 깜박인다. 가장 깊은 곳에 심연의 해룡이 똬리를 틀었다. 물속성이라 바람이 잘 든다.', map: [28, 84],
  },
  {
    id: 'sealedvein', name: '봉인된 광맥', theme: 'cave', tint: '#7a5ad0', lv: [38, 48], bgm: 'dungeon', region: '잿빛 광산 지방', kind: 'dungeon', role: ['ore', 'loot'],
    mobs: [{ id: 'crystalgolem', w: 32 }, { id: 'gemjelly', w: 26 }, { id: 'orejelly', w: 16 }, { id: 'rockworm', w: 12 }],
    maxMobs: 11, boss: 'veinguard', bossGauge: 120, mvpGauge: 0, w: 920, h: 780,
    specialty: ['x_minerglove', 'w_runeblade', 'r_ori'],
    gate: {
      hidden: true, clue: 'q_runeshard',
      hint: '광산 막다른 갱도에 룬이 새겨진 석문이 있다더라. 해골 광부들이 그 조각을 주워 간다고.',
      need: [{ kind: 'item', id: 'q_runeshard', qty: 5, consume: true }],
      openText: '다섯 개의 룬 조각을 홈에 끼우자 석문이 낮게 울리며 갈라졌다. 보랏빛 광맥이 숨 쉬고 있다!',
    },
    desc: '룬 석문 너머 보랏빛 수정이 자라는 광맥. 별철·수호석이 어느 맵보다 많이 나온다. 불사가 없어 성직자 없는 파티도 편하다.', map: [13, 30],
  },
  {
    id: 'cave3', name: '망령의 갱도', theme: 'cave', tint: '#3a2a5a', lv: [40, 50], bgm: 'dungeon', region: '잿빛 광산 지방', kind: 'dungeon', role: ['mvp'],
    mobs: [{ id: 'bonehound', w: 28 }, { id: 'phantom', w: 22 }, { id: 'bonearcher', w: 18 }, { id: 'wisp', w: 14 }],
    maxMobs: 11, mvp: 'wraith', bossGauge: 0, mvpGauge: 480, unlockBy: 'cave', w: 940, h: 800,
    specialty: ['g_ragcape', 'w_katar', 'h_horns'],
    desc: '광산 가장 깊은 갱도(3층). 갱도 망령(염)에는 속성 공격을, 해골 사냥개에는 성·불을. 망령 군주가 산다.', map: [29, 18],
  },
  {
    id: 'desert', name: '작열하는 사막', theme: 'desert', lv: [44, 54], bgm: 'field', region: '작열하는 사막 지방', kind: 'field', role: ['exp'],
    mobs: [{ id: 'sandjelly', w: 30 }, { id: 'scorpion', w: 26 }, { id: 'jackal', w: 24 }, { id: 'sandgolem', w: 20 }],
    maxMobs: 12, boss: 'scorpking', bossGauge: 140, mvpGauge: 0, unlockBy: 'quarry', w: 980, h: 820,
    specialty: ['w_jur', 'w_huntbow', 'w_bloodfang'],
    desc: '태양이 모든 것을 태우는 사막. 불속성(전갈·자칼)은 물로, 땅속성(말랑·골렘)은 불로 공략하자. 모래바람에 낡은 지도 조각이 날려 온다고.', map: [79, 62],
  },
  {
    id: 'oasis', name: '신기루 오아시스', theme: 'desert', tint: '#7ad0c0', lv: [46, 56], bgm: 'field', region: '작열하는 사막 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'crab', w: 24 }, { id: 'cactus', w: 22 }, { id: 'mirage', w: 20 }, { id: 'sandjelly', w: 18 }, { id: 'jackal', w: 12 }],
    maxMobs: 11, bossGauge: 0, mvpGauge: 0, unlockBy: 'quarry', w: 960, h: 800,
    specialty: ['m_oasisglass', 'm_piratepatch', 's_crabshield'],
    desc: '사막 동쪽의 물가. 땅(선인장)·물(게)·바람(신기루)이 뒤섞여 무기 하나로는 버겁다. 선글라스와 해적 안대, 게딱지 방패가 나온다.', map: [88, 54],
  },
  {
    id: 'pirateisle', name: '해적의 보물섬', theme: 'desert', tint: '#ffe090', lv: [46, 58], bgm: 'field', region: '푸른 항구 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'treasurecrab', w: 32 }, { id: 'seadog', w: 32 }, { id: 'crab', w: 18 }, { id: 'deepfish', w: 14 }],
    maxMobs: 11, boss: 'pirateking', bossGauge: 150, mvpGauge: 0, w: 940, h: 800,
    specialty: ['x_pirate', 'h_piratehat', 'w_seasaber'],
    gate: {
      hidden: true, clue: 'q_compass',
      hint: '유령 선장의 나침반은 북쪽이 아니라 보물을 가리킨다더라. 다만 풋내기 선원들만 태우고는 그 섬에 닿을 수 없다고.',
      need: [{ kind: 'item', id: 'q_compass', qty: 1 }, { kind: 'job', tier: 2 }],
      openText: '노련한 동료가 키를 잡자 나침반 바늘이 멈췄다. 안개 너머로 야자수 섬이 떠올랐다 — 해적의 보물섬이 열렸다!',
    },
    desc: '나침반만이 아는 남쪽 바다의 섬. 금화를 짊어진 보물게와 해골 갑판장이 보물을 지킨다. 해적왕의 망령은 암흑속성이라 성속성이 잘 든다.', map: [24, 72],
  },
  {
    id: 'pyramid', name: '피라미드 1층', theme: 'cave', tint: '#c8a050', lv: [50, 58], bgm: 'dungeon', region: '작열하는 사막 지방', kind: 'dungeon', role: ['exp', 'loot'],
    mobs: [{ id: 'mummy', w: 30 }, { id: 'scarab', w: 26 }, { id: 'tombguard', w: 22 }],
    maxMobs: 11, boss: 'mummylord', bossGauge: 140, mvpGauge: 0, unlockBy: 'desert', w: 940, h: 800,
    specialty: ['x_scarab', 'l_bandmask', 'a_priest'],
    desc: '사막 남쪽의 거대한 무덤. 불사(미라·파수꾼)와 곤충(풍뎅이)이 섞여 있다. 붕대 대신관이 지하 계단을 막고 있다.', map: [73, 72],
  },
  {
    id: 'pinetrail', name: '침엽수 눈길', theme: 'snow', tint: '#5a9a78', lv: [52, 62], bgm: 'title', region: '얼어붙은 설원 지방', kind: 'field', role: ['exp'],
    mobs: [{ id: 'snowowl', w: 30 }, { id: 'sandgolem', w: 24 }, { id: 'snowjelly', w: 26 }, { id: 'frostwolf', w: 12 }],
    maxMobs: 12, bossGauge: 0, mvpGauge: 0, unlockBy: 'desert', w: 960, h: 800,
    specialty: ['g_feather', 'a_hunter', 'x_brooch'],
    desc: '사막의 북쪽 끝에서 설원으로 오르는 침엽수 숲길. 모래 골렘(땅)이 눈 속까지 따라 올라왔다. 눈올빼미의 깃털 망토가 나온다.', map: [68, 26],
  },
  {
    id: 'sunkentemple', name: '모래에 묻힌 신전', theme: 'cave', tint: '#e0b040', lv: [54, 66], bgm: 'dungeon', region: '작열하는 사막 지방', kind: 'dungeon', role: ['loot'],
    mobs: [{ id: 'sandlion', w: 28 }, { id: 'cobra', w: 26 }, { id: 'sandwraith', w: 24 }, { id: 'scarab', w: 10 }],
    maxMobs: 11, boss: 'sunpriest', bossGauge: 150, mvpGauge: 0, w: 940, h: 800,
    specialty: ['h_sunwing', 'x_scarab', 'w_sunblade'],
    gate: {
      hidden: true, clue: 'q_mapscrap',
      hint: '모래바람에 실려 온 낡은 지도 조각. 조각을 다 맞추면 사막 한가운데 묻힌 무언가를 가리킨다더라.',
      need: [{ kind: 'item', id: 'q_mapscrap', qty: 4, consume: true }, { kind: 'boss', mob: 'scorpking' }],
      openText: '지도 조각을 맞추자 X 표시가 전갈왕의 둥지를 가리켰다. 모래를 걷어 내니 금빛 계단이 나타났다!',
    },
    desc: '모래 아래 잠든 태양 신전. 모래사자·황금 코브라·모래 망령이 지키고, 제단에는 태양의 신관이 있다. 신관은 성속성이라 암흑 무기가 잘 든다.', map: [90, 68],
  },
  {
    id: 'pyramid2', name: '피라미드 지하', theme: 'cave', tint: '#8a6a2a', lv: [56, 66], bgm: 'dungeon', region: '작열하는 사막 지방', kind: 'dungeon', role: ['mvp'],
    mobs: [{ id: 'anubis', w: 26 }, { id: 'cursedmummy', w: 26 }, { id: 'tombguard', w: 22 }, { id: 'scarab', w: 12 }],
    maxMobs: 11, mvp: 'pharaoh', bossGauge: 0, mvpGauge: 520, unlockBy: 'pyramid', w: 940, h: 800,
    specialty: ['w_goldmace', 'w_bloodfang', 'a_wizard'],
    desc: '파라오가 잠든 지하 묘실. 무덤 자칼은 암흑, 저주받은 미라는 불사. 모래의 파라오가 깨어나기를 기다린다.', map: [80, 79],
  },
  {
    id: 'snow', name: '얼어붙은 설원', theme: 'snow', lv: [58, 68], bgm: 'title', region: '얼어붙은 설원 지방', kind: 'field', role: ['exp'],
    mobs: [{ id: 'snowjelly', w: 28 }, { id: 'frostwolf', w: 26 }, { id: 'yeti', w: 22 }, { id: 'icewisp', w: 18 }],
    maxMobs: 12, boss: 'yetiking', bossGauge: 150, mvpGauge: 0, unlockBy: 'desert', w: 980, h: 820,
    specialty: ['g_feather', 'a_knight', 'w_titanaxe'],
    desc: '눈보라가 그치지 않는 북쪽 끝. 물속성 일색이라 바람속성이 최고의 무기. 설원의 군주가 얼음 동굴 입구를 지킨다.', map: [62, 17],
  },
  {
    id: 'glacier', name: '빙하 협곡', theme: 'snow', tint: '#a0c8ff', lv: [62, 72], bgm: 'title', region: '얼어붙은 설원 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'snowbun', w: 26 }, { id: 'iceworm', w: 22 }, { id: 'blizzard', w: 22 }, { id: 'yeti', w: 14 }, { id: 'frostwolf', w: 10 }],
    maxMobs: 11, bossGauge: 0, mvpGauge: 0, unlockBy: 'desert', w: 960, h: 800,
    specialty: ['l_snowscarf', 'w_stormbow', 's_mirror'],
    desc: '빙하가 갈라진 협곡. 물속성 사이에 눈보라 정령(바람)이 섞여 바람 무기 하나로는 막힌다. 눈꽃 목도리와 폭풍의 활이 나온다.', map: [75, 23],
  },
  {
    id: 'icecave', name: '얼음 동굴', theme: 'cave', tint: '#80c0ff', lv: [68, 76], bgm: 'dungeon', region: '얼어붙은 설원 지방', kind: 'dungeon', role: ['exp', 'ore'],
    mobs: [{ id: 'icebat', w: 28 }, { id: 'icegolem', w: 24 }, { id: 'frosttroll', w: 22 }, { id: 'icewisp', w: 16 }],
    maxMobs: 11, boss: 'frostwyrm', bossGauge: 150, mvpGauge: 0, unlockBy: 'snow', w: 940, h: 800,
    specialty: ['w_icekatar', 'w_lance', 'w_glacierblade'],
    desc: '고드름이 숲을 이룬 동굴. 전부 물속성이라 바람 무기로 몰아치자. 서리 비룡이 심층으로 가는 길목에 똬리를 틀었다.', map: [52, 12],
  },
  {
    id: 'starlake', name: '별이 잠든 호수', theme: 'snow', tint: '#2a2a6a', lv: [72, 84], bgm: 'title', region: '얼어붙은 설원 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'starjelly', w: 30 }, { id: 'aurora', w: 26 }, { id: 'icewisp', w: 16 }, { id: 'blizzard', w: 14 }],
    maxMobs: 11, boss: 'lakeguardian', bossGauge: 160, mvpGauge: 0, w: 940, h: 800,
    specialty: ['h_aurora', 'x_starring', 'w_aurorabow'],
    gate: {
      hint: '얼음 정령의 마음을 품은 자가 빙하 끝 호숫가에 서면, 얼음 아래 별빛이 길을 낸다는 전설.',
      need: [{ kind: 'level', lv: 70 }, { kind: 'card', mob: 'icewisp' }],
      openText: '품속의 카드가 차갑게 빛나자 얼음 아래 별빛이 길을 그렸다. 별이 잠든 호수가 열렸다.',
    },
    desc: '빙하 끝, 별이 가라앉은 호수. 별빛 말랑과 파수꾼은 성속성(암흑 무기), 오로라 정령은 바람(땅 무기). 끝판의 장신구와 머리 장비가 잠들어 있다.', map: [69, 8],
  },
  {
    id: 'icecave2', name: '얼음 동굴 심층', theme: 'cave', tint: '#4a7ad0', lv: [74, 84], bgm: 'dungeon', region: '얼어붙은 설원 지방', kind: 'dungeon', role: ['mvp'],
    mobs: [{ id: 'frostknight', w: 26 }, { id: 'icewraith', w: 24 }, { id: 'frosttroll', w: 18 }, { id: 'iceworm', w: 16 }],
    maxMobs: 11, mvp: 'frostwitch', bossGauge: 0, mvpGauge: 560, unlockBy: 'icecave', w: 940, h: 800,
    specialty: ['w_frostbrand', 'w_icefang', 'w_frostrod'],
    desc: '얼어붙은 기사단이 잠든 동굴 맨 아래. 서리 마녀가 설원을 영원한 겨울로 묶어 두고 있다. 마녀가 쓰러지면 하늘로 가는 계단이 내려온다는 전설이 있다.', map: [46, 7],
  },
  {
    id: 'cloudstair', name: '구름 계단', theme: 'snow', tint: '#c8b8ff', lv: [80, 90], bgm: 'title', region: '하늘 유적 지방', kind: 'field', role: ['exp'],
    mobs: [{ id: 'cloudjelly', w: 34 }, { id: 'windbird', w: 30 }, { id: 'sentinel', w: 24 }],
    maxMobs: 12, boss: 'cloudgiant', bossGauge: 160, mvpGauge: 0, w: 980, h: 820,
    specialty: ['g_cloudcape', 'w_thunderaxe', 'w_skybreaker'],
    gate: {
      hint: '서리 마녀가 쓰러지는 날, 얼어붙은 구름 위로 끝없는 계단이 내려온다는 전설.',
      need: [{ kind: 'boss', mob: 'frostwitch' }],
      openText: '서리 마녀의 마지막 숨결이 하늘로 흩어지자, 구름 사이로 끝없는 계단이 내려왔다. 하늘 유적이 열렸다!',
    },
    desc: '하늘에 떠 있는 유적으로 오르는 구름 계단. 구름 말랑과 폭풍 매가 모두 바람속성이라 땅 무기가 좋다. 구름 거인이 신전과 정원으로 가는 문을 지킨다.', map: [81, 17],
  },
  {
    id: 'windtemple', name: '바람의 신전', theme: 'cave', tint: '#f0e0a0', lv: [84, 94], bgm: 'dungeon', region: '하늘 유적 지방', kind: 'dungeon', role: ['exp', 'loot'],
    mobs: [{ id: 'galespirit', w: 28 }, { id: 'scripture', w: 26 }, { id: 'sentinel', w: 24 }, { id: 'windbird', w: 16 }],
    maxMobs: 11, boss: 'stormking', bossGauge: 160, mvpGauge: 0, unlockBy: 'cloudstair', w: 960, h: 800,
    specialty: ['w_galeblade', 'h_windwing', 'w_windkatar'],
    desc: '바람이 기도문을 읽는 하얀 신전. 질풍 정령(바람)과 바람의 경전(성)이 함께 나와 무기 하나로는 버겁다. 폭풍 수리왕이 성소의 문을 지킨다.', map: [87, 11],
  },
  {
    id: 'skygarden', name: '하늘 정원', theme: 'meadow', tint: '#fff0b0', lv: [88, 98], bgm: 'field', region: '하늘 유적 지방', kind: 'field', role: ['loot'],
    mobs: [{ id: 'cherub', w: 30 }, { id: 'skyflower', w: 26 }, { id: 'windbird', w: 22 }, { id: 'cloudjelly', w: 14 }],
    maxMobs: 11, bossGauge: 0, mvpGauge: 0, unlockBy: 'cloudstair', w: 960, h: 800,
    specialty: ['w_skybow', 'w_skyfang', 'f_windboots'],
    desc: '구름 위에 가꾼 금빛 정원. 깃털 말랑(성)·천상화(땅)·폭풍 매(바람)가 섞여 있다. 하늘의 무기들이 이곳에서 가장 잘 나온다.', map: [89, 20],
  },
  {
    id: 'sanctum', name: '천공 성소', theme: 'cave', tint: '#fffbe0', lv: [92, 99], bgm: 'dungeon', region: '하늘 유적 지방', kind: 'dungeon', role: ['mvp'],
    mobs: [{ id: 'skyknight', w: 30 }, { id: 'scripture', w: 24 }, { id: 'cherub', w: 22 }, { id: 'galespirit', w: 18 }],
    maxMobs: 11, mvp: 'skykeeper', bossGauge: 0, mvpGauge: 600, unlockBy: 'windtemple', w: 960, h: 800,
    specialty: ['w_skyrod', 'h_skycrown', 'x_skyring'],
    desc: '하늘 유적의 가장 높은 곳. 천공 기사들이 지키는 왕좌에 천공의 파수신이 앉아 있다. 파수신은 성속성이라 암흑 무기가 잘 든다.', map: [85, 10],
  },
];

export function zone(id: string): ZoneDef {
  const z = ZONES.find((z) => z.id === id);
  if (!z) throw new Error('unknown zone ' + id);
  return z;
}

/** every zone whose field boss opens `z` (its own `unlockBy` first, then the cross-region roads) */
export function openers(z: ZoneDef): string[] {
  return [...(z.unlockBy ? [z.unlockBy] : []), ...(z.alsoBy ?? [])];
}

/**
 * Per-region extras for the world map. `home` = the first jobs that start here ("○○의 고향" on the region card);
 * `theme` / `icon` override the look a region would get from its maps (a home of tower floors shouldn't read as a cave).
 */
export const REGION_INFO: Record<string, { home?: string; theme?: ZoneTheme; icon?: string }> = {
  '햇살 평원 지방': { home: '검사 · 성직자' },
  '속삭이는 숲 지방': { home: '궁수' },
  '안개 호수 지방': { home: '마법사', theme: 'meadow', icon: '💧' },
  '작열하는 사막 지방': { home: '도둑' },
  '푸른 항구 지방': { home: '상인', theme: 'desert', icon: '⚓' },
  '하늘 유적 지방': { theme: 'snow', icon: '☁️' },
};

export interface RegionInfo { id: string; name: string; theme: ZoneTheme; x: number; y: number; zones: ZoneDef[] }
/** maps grouped by region for the world map: centre = mean of the maps' pins, theme = most of its maps (or REGION_INFO) */
export function regions(): RegionInfo[] {
  const out: RegionInfo[] = [];
  for (const z of ZONES) {
    const id = z.region ?? z.id;
    let r = out.find((x) => x.id === id);
    if (!r) { r = { id, name: z.region ?? z.name, theme: z.theme, x: 0, y: 0, zones: [] }; out.push(r); }
    r.zones.push(z);
  }
  for (const r of out) {
    r.x = r.zones.reduce((a, z) => a + z.map[0], 0) / r.zones.length;
    r.y = r.zones.reduce((a, z) => a + z.map[1], 0) / r.zones.length;
    // the region looks like most of its maps (a desert-themed quarry shouldn't paint the mine region sandy)
    const count = new Map<ZoneTheme, number>();
    for (const z of r.zones) count.set(z.theme, (count.get(z.theme) ?? 0) + 1);
    r.theme = REGION_INFO[r.name]?.theme ?? [...count].sort((a, b) => b[1] - a[1])[0][0];
  }
  return out;
}
export function regionOf(zoneId: string): RegionInfo | undefined {
  return regions().find((r) => r.zones.some((z) => z.id === zoneId));
}
