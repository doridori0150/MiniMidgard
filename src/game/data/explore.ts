// 탐험 데이터 (docs/design/EXPLORATION.md): 맵 안의 발견 지점(이야기 흔적 · 석등 · 보물)과 지방 이야기.
// 맵은 EXPLORE_COLS × EXPLORE_ROWS 칸으로 나뉩니다. 칸 번호 = 줄 × EXPLORE_COLS + 열(왼쪽 위 0).
// 발견 지점은 파티나 탐험대가 그 칸을 밟고, 그 맵 탐험도가 `at`% 이상일 때 드러납니다.

export const EXPLORE_COLS = 6;
export const EXPLORE_ROWS = 5;
export const EXPLORE_CELLS = EXPLORE_COLS * EXPLORE_ROWS;

/** what a lit shrine adds to the whole account (% each) */
export type ShrineKind = 'exp' | 'drop' | 'zeny' | 'hp' | 'sp';
export const SHRINE_TEXT: Record<ShrineKind, string> = { exp: '경험치 +1%', drop: '잡템·소모품 드롭 +1%', zeny: '판매 제니 +1%', hp: '최대 HP +1%', sp: '최대 SP +1%' };

export interface PoiDef {
  id: string;
  zone: string;
  /** the cell the party has to stand in (row × EXPLORE_COLS + column) */
  cell: number;
  /** the map's exploration % it needs */
  at: number;
  kind: 'lore' | 'shrine' | 'chest';
  name: string;
  /** lore: the story fragment it holds */
  lore?: string;
  /** shrine: its bonus; lit by the map's field boss, else by `charge` kills on the map after it was found */
  shrine?: ShrineKind;
  charge?: number;
  /** chest: opened once, on the spot */
  chest?: { items: Record<string, number>; zeny: number };
}

export interface StoryFragment { id: string; title: string; zone: string; text: string[] }
export interface StoryArc {
  id: string;
  region: string;
  title: string;
  fragments: StoryFragment[];
  /** the hidden dungeon that opens when every fragment is found (its gate needs { kind: 'story', arc }) */
  hidden: string;
  /** its hidden boss: the first kill opens the ending */
  boss: string;
  ending: { title: string; text: string[] };
  /** every lit field shrine of the region adds this % EXP on top (지방 세트) */
  setExp: number;
}

// ── P1 시범: 햇살 평원 지방 — 가라앉은 수도원의 종
// 이야기 본문은 개요 한 줄씩입니다(사용자 개요 승인 뒤 본문을 씁니다).
export const STORY_ARCS: StoryArc[] = [
  {
    id: 'bell', region: '햇살 평원 지방', title: '가라앉은 수도원의 종', hidden: 'belltower', boss: 'drownedabbot', setExp: 2,
    fragments: [
      { id: 'bell1', title: '들판 끝 이정표', zone: 'meadow', text: ['[개요] 이정표에 새긴 글귀. 새벽종이 울리면 평원 안개가 걷혔다는 목동들의 말.'] },
      { id: 'bell2', title: '허수아비의 곡식 장부', zone: 'wheatfield', text: ['[개요] 허수아비 품에 끼워진 수도원 곡식 장부. 마지막 장에 "종에 금이 갔다"는 메모.'] },
      { id: 'bell3', title: '어린 종지기의 일지', zone: 'clover', text: ['[개요] 바람개비 밑에 묻힌 일지. 수도원장이 "밤에는 절대 종을 치지 말라" 했다는 대목.'] },
      { id: 'bell4', title: '수문 관리인의 기록', zone: 'culvert', text: ['[개요] 녹슨 열쇠와 기록. 수도원이 잠긴 밤, 누군가 수문을 모두 열었다.'] },
      { id: 'bell5', title: '빈 무덤', zone: 'abbeyyard', text: ['[개요] 수도원장의 무덤. 비문은 있는데 관이 비어 있다.'] },
    ],
    ending: {
      title: '다시 울리는 새벽종',
      text: ['[개요] 수도원장은 물 아래 잠든 것을 깨우지 않으려고 스스로 수도원을 잠갔다. 종지기는 그 밤 종을 쳐 그를 부르려 했다. 새벽종이 다시 울리고, 가라앉은 수도원의 밤 유령은 잠잠해진다.'],
    },
  },
];

export const POIS: PoiDef[] = [
  // 햇살 평원
  { id: 'meadow:lore', zone: 'meadow', cell: 5, at: 25, kind: 'lore', name: '들판 끝 이정표', lore: 'bell1' },
  { id: 'meadow:shrine', zone: 'meadow', cell: 26, at: 50, kind: 'shrine', name: '평원의 석등', shrine: 'exp' },
  { id: 'meadow:chest', zone: 'meadow', cell: 12, at: 100, kind: 'chest', name: '목동의 궤짝', chest: { items: { u_orange: 5 }, zeny: 300 } },
  // 황금 밀밭
  { id: 'wheatfield:lore', zone: 'wheatfield', cell: 29, at: 25, kind: 'lore', name: '허수아비', lore: 'bell2' },
  { id: 'wheatfield:shrine', zone: 'wheatfield', cell: 2, at: 50, kind: 'shrine', name: '밀밭의 석등', shrine: 'drop', charge: 120 },
  { id: 'wheatfield:chest', zone: 'wheatfield', cell: 18, at: 100, kind: 'chest', name: '일꾼들의 새참 바구니', chest: { items: { u_orange: 5, r_ori: 1 }, zeny: 500 } },
  // 네잎 언덕
  { id: 'clover:lore', zone: 'clover', cell: 0, at: 25, kind: 'lore', name: '바람개비 밑', lore: 'bell3' },
  { id: 'clover:shrine', zone: 'clover', cell: 23, at: 50, kind: 'shrine', name: '언덕의 석등', shrine: 'zeny', charge: 120 },
  { id: 'clover:chest', zone: 'clover', cell: 3, at: 100, kind: 'chest', name: '네잎클로버 상자', chest: { items: { r_elu: 1 }, zeny: 800 } },
  // 물레방아 수로 (던전: 석등 · 보물 없음)
  { id: 'culvert:lore', zone: 'culvert', cell: 28, at: 25, kind: 'lore', name: '녹슨 수문', lore: 'bell4' },
  // 수도원 묘지
  { id: 'abbeyyard:lore', zone: 'abbeyyard', cell: 10, at: 25, kind: 'lore', name: '수도원장의 무덤', lore: 'bell5' },
  { id: 'abbeyyard:shrine', zone: 'abbeyyard', cell: 24, at: 50, kind: 'shrine', name: '묘지의 석등', shrine: 'hp', charge: 120 },
  { id: 'abbeyyard:chest', zone: 'abbeyyard', cell: 5, at: 100, kind: 'chest', name: '부서진 성물함', chest: { items: { u_white: 3 }, zeny: 1200 } },
];

export const POI_BY_ZONE: Record<string, PoiDef[]> = {};
for (const p of POIS) (POI_BY_ZONE[p.zone] ??= []).push(p);
export const FRAGMENT: Record<string, { arc: StoryArc; frag: StoryFragment }> = {};
for (const arc of STORY_ARCS) for (const f of arc.fragments) FRAGMENT[f.id] = { arc, frag: f };
export const ARC: Record<string, StoryArc> = Object.fromEntries(STORY_ARCS.map((a) => [a.id, a]));
