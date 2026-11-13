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
// 문체: 엘든 링 · 브레스 오브 더 와일드처럼 설명 없이 옛 흔적(사물 묘사 한 줄 + 거기 적힌 글 「」)으로 짐작하게 한다(사용자 2026-11-13).
export const STORY_ARCS: StoryArc[] = [
  {
    id: 'bell', region: '햇살 평원 지방', title: '가라앉은 수도원의 종', hidden: 'belltower', boss: 'drownedabbot', setExp: 2,
    fragments: [
      {
        id: 'bell1', title: '들판 끝 이정표', zone: 'meadow',
        text: [
          '이끼 낀 돌 이정표. 한쪽 면에 칼끝으로 새긴 글씨가 남아 있다.',
          '「새벽종이 울리거든 양을 몰아라. 안개가 걷힌다.」',
          '그 아래, 다른 손으로 덧새긴 줄. 글씨가 얕다.',
          '「종이 울리지 않는 날엔 언덕을 넘지 말 것.」',
        ],
      },
      {
        id: 'bell2', title: '허수아비의 곡식 장부', zone: 'wheatfield',
        text: [
          '허수아비 품에 끼워 둔 장부. 빗물에 거의 번졌지만 마지막 장은 읽힌다.',
          '「보리 열두 섬, 수도원으로. 값은 늘 그렇듯 축복으로 받음.」',
          '「종에 금이 갔다고 한다. 올가을엔 종소리가 낮다. 밀이 덜 여물었다.」',
          '장부는 거기서 끝난다.',
        ],
      },
      {
        id: 'bell3', title: '어린 종지기의 일지', zone: 'clover',
        text: [
          '바람개비 밑동에 묻혀 있던 작은 일지. 첫 장에 서툰 글씨로 \'종지기\'라고 적혀 있다.',
          '「원장님은 밤에는 절대 종을 치지 말라 하셨다. 밤의 종은 깨우는 종이라고.」',
          '「무엇을 깨우느냐고 여쭈었더니, 원장님은 우물 쪽을 오래 보셨다.」',
          '「오늘도 새벽에만 쳤다. 줄을 당기면 종이 우는 소리가 난다.」',
        ],
      },
      {
        id: 'bell4', title: '수문 관리인의 기록', zone: 'culvert',
        text: [
          '녹슨 고리에 꿴 열쇠 다발과 젖은 판자 한 장. 판자에 숯으로 적은 글이 있다.',
          '「셋째 수문. 둘째 수문. 첫째 수문.」',
          '「내가 연 것이 아니다. 열쇠는 내 허리춤에 있었다. 문은 안에서 열렸다.」',
          '「그날 밤 종이 울렸다. 새벽이 아니었다.」',
        ],
      },
      {
        id: 'bell5', title: '빈 무덤', zone: 'abbeyyard',
        text: [
          '묘지 맨 끝, 가장 큰 비석. 이름이 있어야 할 자리를 누군가 깎아 냈다.',
          '「물을 지킨 이, 여기 눕지 않는다.」',
          '관 뚜껑은 열려 있고, 안에는 젖은 기도서 한 권뿐이다. 끝 장이 접혀 있다.',
          '「아래의 것이 잠들어 있는 한, 새벽은 온다.」',
        ],
      },
    ],
    ending: {
      title: '다시 울리는 새벽종',
      text: [
        '수문실의 물이 천천히 빠진다. 바닥에 수도원장의 지팡이가 남았다. 손잡이에 종을 묶던 끈이 감겨 있다.',
        '물 밑에서 무언가 한 번 뒤척이더니, 다시 조용해진다.',
        '그날 새벽, 가라앉은 종탑에서 종이 울렸다. 낮게 한 번, 그리고 또 한 번. 종탑 위에서 작은 그림자가 줄을 당기고 있었다.',
        '평원의 안개가 걷혔다. 목동들은 오랜만에 언덕을 넘었다.',
      ],
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
