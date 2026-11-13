// 탐험 데이터 (docs/design/EXPLORATION.md): 맵 안의 발견 지점(이야기 흔적 · 석등 · 보물)과 지방 이야기.
// 맵은 EXPLORE_COLS × EXPLORE_ROWS 칸으로 나뉩니다. 칸 번호 = 줄 × EXPLORE_COLS + 열(왼쪽 위 0).
// 발견 지점은 파티나 탐험대가 그 칸을 밟고, 그 맵 탐험도가 `at`% 이상일 때 드러납니다.

import type { Bonus } from '../types.ts';

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
  /** what changes once the story has ended: a bonus while hunting on these maps, a danger monster that stops coming */
  effect: { zones: string[]; bonus: Bonus; quiet?: string; text: string };
  /** every lit field lantern of the region adds this % EXP on top (지방 세트) */
  setExp: number;
}

// 지방마다 이야기 한 줄기(EXPLORATION.md §3). 햇살 평원이 P1 시범, 나머지 일곱 지방이 P2(2026-11-13).
// ── 햇살 평원 지방 — 가라앉은 수도원의 종
// 문체: 엘든 링 · 브레스 오브 더 와일드처럼 설명 없이 옛 흔적(사물 묘사 한 줄 + 거기 적힌 글 「」)으로 짐작하게 한다(사용자 2026-11-13).
export const STORY_ARCS: StoryArc[] = [
  {
    id: 'bell', region: '햇살 평원 지방', title: '가라앉은 수도원의 종', hidden: 'belltower', boss: 'drownedabbot', setExp: 1,
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
    effect: { zones: ['sunkenabbey'], bonus: { hit: 5 }, quiet: 'bellghost', text: '새벽종이 다시 울린다. 가라앉은 수도원의 밤 유령은 이제 나타나지 않고, 그곳에서 사냥하는 동안 명중이 오른다.' },
  },
  // ── 안개 호수 지방 — 하나 더 있는 탑
  {
    id: 'mist', region: '안개 호수 지방', title: '하나 더 있는 탑', hidden: 'mirrortower', boss: 'mirrormage', setExp: 1,
    fragments: [
      { id: 'mist1', title: '뒤집힌 낚싯배', zone: 'lakeshore', text: [
        '물가에 뒤집힌 채 썩어 가는 낚싯배. 배 바닥 안쪽에 칼로 새긴 글이 있다.',
        '「안개 짙은 날엔 탑을 세지 마라. 하나가 더 보인다.」',
        '그 옆에 작은 글씨가 하나 더 있다. 누군가 세다 말았다.',
        '「하나. 둘.」',
      ] },
      { id: 'mist2', title: '측량 말뚝', zone: 'mistmarsh', text: [
        '늪 한가운데 박힌 말뚝. 붉은 칠이 벗겨진 자리에 글자가 남아 있다.',
        '「안개 경계. 이 너머는 탑의 것.」',
        '말뚝 밑동에는 더 오래된 글씨가 있다.',
        '「말뚝을 옮기지 말 것. 안개가 따라온다.」',
      ] },
      { id: 'mist3', title: '반납되지 않은 책의 대출 카드', zone: 'magetower1', text: [
        '서고 책상 서랍에 끼어 있던 대출 카드. 책 이름 칸에 「물에 비친 탑」이라고 적혀 있다.',
        '빌린 사람의 이름이 여럿 줄로 그어져 있고, 마지막 줄만 남아 있다.',
        '「대출자: 수석. 반납: ―」',
      ] },
      { id: 'mist4', title: '타다 남은 실험 일지', zone: 'magetower2', text: [
        '실험대 밑에서 찾은 일지 한 장. 가장자리가 타서 말려 있다.',
        '「안개는 가리개다. 가리는 동안에는 저쪽이 이쪽을 보지 못한다.」',
        '「누군가 저쪽에 남아 거울을 붙잡고 있어야 한다.」',
      ] },
      { id: 'mist5', title: '천문대 벽의 낙서', zone: 'magetower3', text: [
        '천문대 창 아래, 분필로 쓴 글이 반쯤 지워져 있다.',
        '「별은 위에 하나, 물에 하나.」',
        '「어느 쪽이 진짜냐고 묻는 견습생은 없었다. 다들 위만 보았으니까.」',
      ] },
    ],
    ending: { title: '엷어지는 안개', text: [
      '거울 속 마도사가 지팡이를 내려놓는다. 그의 등 뒤로 물에 비친 탑이 조금씩 흐려진다.',
      '「이제 세어도 된다.」 그가 처음이자 마지막으로 입을 연다.',
      '호숫가의 안개가 무릎 아래로 내려앉았다. 낚시꾼들은 탑을 세어 보았다. 하나였다.',
    ] },
    effect: { zones: ['lakeshore', 'mistmarsh'], bonus: { hit: 8 }, text: '안개가 엷어져 호숫가 풀밭과 안개 늪에서 명중이 오른다.' },
  },
  // ── 푸른 항구 지방 — 꺼진 등대
  {
    id: 'lamp', region: '푸른 항구 지방', title: '꺼진 등대', hidden: 'sunkenlight', boss: 'lampkeeper', setExp: 1,
    fragments: [
      { id: 'lamp1', title: '병 속의 쪽지', zone: 'beach', text: [
        '모래에 반쯤 묻힌 병. 마개를 뽑자 바닷물에 얼룩진 쪽지가 나온다.',
        '「불을 꺼뜨리지 마오. 돌아갈 길은 그 빛뿐이오.」',
        '쪽지 뒤에는 배 이름이 적혀 있었던 것 같다. 번져서 읽을 수 없다.',
      ] },
      { id: 'lamp2', title: '등대 문틀의 눈금', zone: 'lighthouse', text: [
        '등대 문틀에 칼로 그은 짧은 줄이 빼곡하다. 한 줄에 하루씩인 듯하다.',
        '줄 사이사이로 같은 글이 되풀이된다. 「기름 한 통. 기름 한 통. 기름 한 통.」',
        '맨 마지막 줄만 다르다.',
        '「기름이 떨어졌다. 의자를 태운다.」',
      ] },
      { id: 'lamp3', title: '외상 장부', zone: 'warehouse', text: [
        '창고 구석 금고 안, 곰팡이 핀 외상 장부.',
        '「등대 기름 외상. 선장이 돌아오면 갚겠다 함.」',
        '그 아래 붉은 잉크로 굵게 줄을 긋고 덧썼다. 「받을 길 없음.」',
      ] },
      { id: 'lamp4', title: '선장실의 항해일지', zone: 'wreck', text: [
        '기울어진 선장실 책상에 못 박힌 항해일지. 마지막 장만 젖지 않았다.',
        '「등대 불이 보이지 않는다. 암초가 어디쯤인지 아무도 모른다.」',
        '「불빛만 보이면 된다. 불빛만.」',
      ] },
      { id: 'lamp5', title: '산호에 휘감긴 등잔', zone: 'coralcave', text: [
        '산호가 자라 덮어 버린 낡은 등잔. 바다 밑인데도 심지 끝이 검게 그을려 있다.',
        '등잔 받침에 새긴 글.',
        '「배가 오지 않으면 내가 간다.」',
      ] },
    ],
    ending: { title: '다시 켜진 불', text: [
      '물에 잠긴 등대지기가 무릎을 꿇는다. 손에 쥔 등잔에 아직 불씨가 남아 있다.',
      '그는 바다 쪽을 한 번 보고, 물속으로 흩어진다.',
      '그날 밤 곶 끝의 등대에 불이 들어왔다. 아무도 기름을 붓지 않았는데.',
      '난파선의 해골 해적들이 금화 세기를 멈추고 불빛 쪽을 바라보았다.',
    ] },
    effect: { zones: ['wreck', 'coralcave', 'abyss'], bonus: { flee: 8 }, text: '곶 끝 등대에 불이 들어와 난파선 · 산호 동굴 · 심층에서 회피가 오른다.' },
  },
  // ── 속삭이는 숲 지방 — 숲이 부르는 이름
  {
    id: 'name', region: '속삭이는 숲 지방', title: '숲이 부르는 이름', hidden: 'whisperroot', boss: 'echotree', setExp: 1,
    fragments: [
      { id: 'name1', title: '키 재기 나무', zone: 'woodedge', text: [
        '숲 어귀 참나무 줄기에 키를 잰 눈금이 여럿 새겨져 있다. 눈금마다 이름이 있다.',
        '맨 아래 눈금 하나에만 키가 없다. 이름만 있다.',
        '「아린」',
      ] },
      { id: 'name2', title: '버섯 고리 안의 돌', zone: 'mushvale', text: [
        '버섯이 둥글게 자란 고리 한가운데 납작한 돌이 놓여 있다.',
        '「고리 안에서 이름을 부르지 말 것.」',
        '「숲이 대답한다.」',
      ] },
      { id: 'name3', title: '늑대 굴 앞의 목걸이', zone: 'forest', text: [
        '늑대 굴 앞에 걸린 뼈 목걸이. 작은 나무패가 매달려 있다.',
        '「아린에게. 늑대들이 데려다줄 거야.」',
        '나무패 뒤에 손톱으로 긁은 자국이 있다. 무언가를 세다 만 것 같다.',
      ] },
      { id: 'name4', title: '화살촉 박힌 그루터기', zone: 'deepforest', text: [
        '거대한 그루터기. 나이테 한가운데 녹슨 화살촉이 박혀 있다.',
        '옆에 선 나무 팻말. 「이 나무를 베지 마시오 ― 나무꾼 조합」',
        '팻말 뒷면에 칼로 덧새긴 글.',
        '「베었다. 숲이 울었다. 그 아이 이름으로.」',
      ] },
      { id: 'name5', title: '고목 속의 손자국', zone: 'grove', text: [
        '고목의 텅 빈 속, 안쪽 벽에 작은 손자국이 하나 찍혀 있다. 나무가 그 위로 자라 덮어 가고 있다.',
        '손자국 아래 아이 글씨.',
        '「다녀왔어.」',
      ] },
    ],
    ending: { title: '대답한 이름', text: [
      '고목의 메아리가 흩어지자 숲 전체가 한 번 크게 숨을 쉰다.',
      '나뭇잎 사이로 이름 하나가 지나간다. 이번에는 숲이 부르는 소리가 아니다. 대답하는 소리다.',
      '숲 어귀 참나무, 키가 비어 있던 눈금 위에 새 줄이 하나 그어져 있었다. 아무도 그은 적 없는 줄이.',
    ] },
    effect: { zones: ['woodedge', 'mushvale', 'forest', 'deepforest'], bonus: { crit: 5 }, text: '숲의 속삭임이 잦아들어 숲 어귀 · 버섯 골짜기 · 속삭이는 숲 · 깊은 숲에서 치명타가 오른다.' },
  },
  // ── 작열하는 사막 지방 — 물을 판 왕
  {
    id: 'water', region: '작열하는 사막 지방', title: '물을 판 왕', hidden: 'drycity', boss: 'dryking', setExp: 1,
    fragments: [
      { id: 'water1', title: '마른 두레박', zone: 'dunes', text: [
        '모래 언덕에 반쯤 묻힌 두레박. 줄은 삭아 없고, 바닥에 왕의 문장이 찍혀 있다.',
        '테두리를 따라 새긴 글.',
        '「우물은 왕의 것. 물 한 동이마다 세금을.」',
      ] },
      { id: 'water2', title: '훔친 금 접시', zone: 'thiefden', text: [
        '도적들이 쌓아 둔 장물 사이의 금 접시. 앞면은 반들반들한데 뒷면에 글이 있다.',
        '「물 한 동이에 금 한 접시. 왕의 시장.」',
        '그 아래 누군가 못으로 긁어 덧붙였다. 「다음 해엔 금 두 접시.」',
      ] },
      { id: 'water3', title: '절벽의 물결 무늬', zone: 'redcanyon', text: [
        '붉은 절벽 높은 곳에 물결 무늬가 줄지어 새겨져 있다. 손이 닿지 않는 높이다.',
        '가장 높은 물결 옆의 글.',
        '「여기까지 물이 찼었다. 아이들은 믿지 않는다.」',
      ] },
      { id: 'water4', title: '신기루 속의 성벽', zone: 'oasis', text: [
        '한낮의 신기루 속에서만 보이는 성벽. 성문 위 글귀가 아지랑이에 일렁인다.',
        '「물은 태양에게 바쳤다. 태양은 영원을 주었다.」',
        '해가 기울면 성벽도 글귀도 사라진다.',
      ] },
      { id: 'water5', title: '대신관의 석판', zone: 'pyramid', text: [
        '붕대 대신관이 지키던 계단 옆, 금이 간 석판.',
        '「왕은 마르지 않는다. 왕은 썩지 않는다.」',
        '맨 아래, 다른 끌로 얕게 새긴 한 줄.',
        '「왕은 마시지 못한다.」',
      ] },
    ],
    ending: { title: '돌아온 물', text: [
      '마른 왕의 몸에서 모래가 쏟아진다. 왕관 아래 바싹 마른 입술이 무언가를 말하려다 멈춘다.',
      '왕좌 뒤 마른 우물에서 물소리가 난다. 아주 작게, 아주 오래 걸려서.',
      '이튿날 아침 오아시스의 물이 한 뼘 불어 있었다. 대상들은 그해 처음으로 세금 없이 물을 길었다.',
    ] },
    effect: { zones: ['redcanyon', 'desert', 'oasis'], bonus: { eleRes: { fire: 10 } }, text: '물이 돌아와 붉은 바위 협곡 · 작열하는 사막 · 신기루 오아시스에서 받는 불속성 피해가 줄어든다.' },
  },
  // ── 잿빛 광산 지방 — 붉은 달의 기사
  {
    id: 'moon', region: '잿빛 광산 지방', title: '붉은 달의 기사', hidden: 'throneroom', boss: 'bloodlord', setExp: 1,
    fragments: [
      { id: 'moon1', title: '깎다 만 석상 받침', zone: 'quarry', text: [
        '채석장 구석의 깎다 만 석상 받침. 위에 서야 할 석상은 없다.',
        '받침 앞면. 「성주께 바침」',
        '성주의 이름이 있었을 자리는 정으로 쪼아 없앴다.',
      ] },
      { id: 'moon2', title: '갱도 벽의 분필 선', zone: 'mine1', text: [
        '막다른 갱도 벽에 분필로 그은 굵은 선.',
        '「여기서부터 성 밑. 파지 말 것 ― 십장」',
        '선 너머 벽은 이미 뚫려 있다. 분필이 다르다.',
        '「팠다.」',
      ] },
      { id: 'moon3', title: '감옥 벽의 긁힌 자국', zone: 'castlejail', text: [
        '가장 안쪽 감방, 벽 가득 손톱으로 긁은 줄. 그 사이에 글이 하나 있다.',
        '「붉은 달이 뜨는 밤마다 문이 열린다.」',
        '「나는 나가지 않는다. 열쇠는 내가 삼켰다.」',
      ] },
      { id: 'moon4', title: '부서진 방패', zone: 'cave', text: [
        '해골 기사가 쓰러진 자리에 남은 방패. 문장이 반쯤 깨졌다.',
        '남은 반쪽에 새긴 글. 「달을 지킨 자」',
        '방패 안쪽에는 붉은 칠로 덧그린 달이 있다. 누군가 문장을 덮으려 한 것 같다.',
      ] },
      { id: 'moon5', title: '무너진 망루의 경비 일지', zone: 'ironridge', text: [
        '능선 위 무너진 망루. 돌 틈에 경비 일지 한 장이 끼어 있다.',
        '「성이 무너진 날 밤, 달이 붉었다.」',
        '「성주는 알현실에서 나오지 않았다. 기사 하나가 감옥으로 내려갔다.」',
      ] },
    ],
    ending: { title: '꺼진 붉은 달', text: [
      '핏빛 성주가 왕좌에서 무너진다. 그가 쥔 홀 끝의 붉은 돌이 빛을 잃는다.',
      '아래층 감옥 어딘가에서 무거운 것이 내려앉는 소리가 난다. 열쇠가 바닥에 떨어지는 소리 같았다.',
      '그 뒤로 지하 감옥에서 핏빛 기사를 보았다는 사람은 없다. 가장 안쪽 감방의 문은 이제 열려 있다.',
    ] },
    effect: { zones: ['castlejail', 'cave', 'cave3'], bonus: { statusRes: { curse: 30 } }, quiet: 'bloodknight', text: '핏빛 기사가 잠들어 지하 감옥에 더는 나타나지 않고, 감옥 · 망자의 동굴 · 망령의 갱도에서 저주 저항이 오른다.' },
  },
  // ── 얼어붙은 설원 지방 — 봄을 기다린 기사단
  {
    id: 'spring', region: '얼어붙은 설원 지방', title: '봄을 기다린 기사단', hidden: 'wintercamp', boss: 'frostcommander', setExp: 1,
    fragments: [
      { id: 'spring1', title: '눈에 묻힌 이정표', zone: 'pinetrail', text: [
        '눈 속에서 끝만 내민 나무 이정표. 같은 자리에 같은 글을 여러 번 고쳐 새겼다.',
        '「봄까지 사흘」',
        '고친 자국을 세어 보면 백 번이 넘는다. 숫자는 한 번도 바뀌지 않았다.',
      ] },
      { id: 'spring2', title: '얼음 속 깃발', zone: 'snow', text: [
        '얼음 속에 곧게 선 깃발. 천은 얼어붙어 바람에도 흔들리지 않는다.',
        '깃대에 감긴 띠의 글.',
        '「겨울이 끝나면 돌아간다 ― 서리 기사단」',
      ] },
      { id: 'spring3', title: '협곡 벽의 쇠쐐기', zone: 'glacier', text: [
        '빙하 벽에 박힌 쇠쐐기가 위로 이어진다. 꼭대기 쐐기에 밧줄 조각과 쪽지가 매여 있다.',
        '「위로 갈수록 하늘이 가깝다. 그 여자는 거기서 내려왔다.」',
      ] },
      { id: 'spring4', title: '얼음에 갇힌 편지', zone: 'icecave', text: [
        '고드름 기둥 안에 접힌 편지가 갇혀 있다. 얼음 너머로 몇 줄이 읽힌다.',
        '「당신이 겨울을 붙잡아 두면 우리는 늙지 않는다.」',
        '「대신 봄은 오지 않는다. 기사단은 그 값을 치르기로 했다.」',
      ] },
      { id: 'spring5', title: '별빛 아래 얼음 비석', zone: 'starlake', text: [
        '호숫가의 얼음 비석. 표면에 별빛이 닿으면 글씨가 떠오른다.',
        '「약속은 지켰다.」',
        '「봄은 아직이다.」',
      ] },
    ],
    ending: { title: '사흘 뒤의 봄', text: [
      '서리 기사단장이 칼을 얼음 바닥에 꽂고 무릎을 꿇는다. 투구 안에서 숨이 하얗게 흩어진다.',
      '「사흘이면 된다.」 그가 말한다. 그 말을 백 년 넘게 해 왔다는 듯이.',
      '사흘 뒤, 침엽수 눈길의 이정표 아래 눈이 녹아 있었다. 그 자리에만 풀이 돋아 있었다.',
    ] },
    effect: { zones: ['pinetrail', 'snow', 'glacier'], bonus: { eleRes: { water: 10 } }, text: '설원의 추위가 누그러져 침엽수 눈길 · 얼어붙은 설원 · 빙하 협곡에서 받는 물속성 피해가 줄어든다.' },
  },
  // ── 하늘 유적 지방 — 떠난 하늘 사람들 (맵이 넷이라 조각 넷)
  {
    id: 'sky', region: '하늘 유적 지방', title: '떠난 하늘 사람들', hidden: 'cloudharbor', boss: 'skyferryman', setExp: 1,
    fragments: [
      { id: 'sky1', title: '반들반들한 난간', zone: 'cloudstair', text: [
        '구름 계단 난간이 한 군데만 반들반들하다. 수많은 손이 같은 자리를 짚고 내려간 듯하다.',
        '난간 밑에 새긴 글.',
        '「내려가는 자는 돌아보지 말 것.」',
      ] },
      { id: 'sky2', title: '마지막 장이 빈 경전', zone: 'windtemple', text: [
        '바람이 넘기는 경전. 다른 장에는 기도문이 빼곡한데 마지막 장만 비어 있다.',
        '빈 장 귀퉁이의 작은 글씨.',
        '「마지막 기도는 적지 않았다. 바람이 대신 외운다.」',
      ] },
      { id: 'sky3', title: '정원사의 가위', zone: 'skygarden', text: [
        '금빛 꽃밭 한가운데 꽂혀 있는 정원사의 가위. 날이 녹슬지 않았다.',
        '손잡이에 감긴 천 조각.',
        '「꽃은 두고 간다. 누군가 올라올 테니.」',
      ] },
      { id: 'sky4', title: '왕좌 뒤의 빈자리', zone: 'sanctum', text: [
        '파수신의 왕좌 뒤로, 의자가 놓였던 자국이 줄지어 있다. 의자는 하나도 남지 않았다.',
        '바닥에 새긴 글.',
        '「파수신은 남는다. 우리는 아래로 간다.」',
        '「아래가 어디인지는 바람만 안다.」',
      ] },
    ],
    ending: { title: '구름 아래의 항구', text: [
      '구름 항구의 사공이 노를 내려놓는다. 묶인 배는 한 척도 없다. 모두 아래로 떠났다.',
      '「너희가 그 아래에서 왔구나.」 사공이 처음으로 웃는다. 「그럼 다들 잘 내려갔군.」',
      '바람의 신전 경전, 비어 있던 마지막 장에 한 줄이 적혀 있었다. 바람의 글씨로.',
    ] },
    effect: { zones: ['cloudstair', 'windtemple', 'skygarden', 'sanctum'], bonus: { flee: 8 }, text: '바람이 길을 열어 하늘 유적 지방에서 회피가 오른다.' },
  },
];

export const POIS: PoiDef[] = [
  // 석등은 필드 맵마다 하나(보스가 있는 맵은 그 보스로, 없는 맵은 사냥 수로 켜진다), 보물은 필드 맵 탐험도 100%에서 열린다.
  // ── 햇살 평원 지방
  { id: 'meadow:lore', zone: 'meadow', cell: 5, at: 25, kind: 'lore', name: '들판 끝 이정표', lore: 'bell1' },
  { id: 'meadow:shrine', zone: 'meadow', cell: 26, at: 50, kind: 'shrine', name: '평원의 석등', shrine: 'exp' },
  { id: 'meadow:chest', zone: 'meadow', cell: 12, at: 100, kind: 'chest', name: '목동의 궤짝', chest: { items: { u_orange: 5 }, zeny: 300 } },
  { id: 'wheatfield:lore', zone: 'wheatfield', cell: 29, at: 25, kind: 'lore', name: '허수아비', lore: 'bell2' },
  { id: 'wheatfield:shrine', zone: 'wheatfield', cell: 2, at: 50, kind: 'shrine', name: '밀밭의 석등', shrine: 'drop', charge: 120 },
  { id: 'wheatfield:chest', zone: 'wheatfield', cell: 18, at: 100, kind: 'chest', name: '일꾼들의 새참 바구니', chest: { items: { u_orange: 5, r_ori: 1 }, zeny: 500 } },
  { id: 'clover:lore', zone: 'clover', cell: 0, at: 25, kind: 'lore', name: '바람개비 밑', lore: 'bell3' },
  { id: 'clover:shrine', zone: 'clover', cell: 23, at: 50, kind: 'shrine', name: '언덕의 석등', shrine: 'zeny', charge: 120 },
  { id: 'clover:chest', zone: 'clover', cell: 3, at: 100, kind: 'chest', name: '네잎클로버 상자', chest: { items: { r_elu: 1 }, zeny: 800 } },
  { id: 'culvert:lore', zone: 'culvert', cell: 28, at: 25, kind: 'lore', name: '녹슨 수문', lore: 'bell4' },
  { id: 'abbeyyard:lore', zone: 'abbeyyard', cell: 10, at: 25, kind: 'lore', name: '수도원장의 무덤', lore: 'bell5' },
  { id: 'abbeyyard:shrine', zone: 'abbeyyard', cell: 24, at: 50, kind: 'shrine', name: '묘지의 석등', shrine: 'hp', charge: 120 },
  { id: 'abbeyyard:chest', zone: 'abbeyyard', cell: 5, at: 100, kind: 'chest', name: '부서진 성물함', chest: { items: { u_white: 3 }, zeny: 1200 } },
  { id: 'jellyrealm:shrine', zone: 'jellyrealm', cell: 14, at: 50, kind: 'shrine', name: '무지개 석등', shrine: 'sp' },
  { id: 'jellyrealm:chest', zone: 'jellyrealm', cell: 27, at: 100, kind: 'chest', name: '말랑 왕국의 보물단지', chest: { items: { u_orange: 5, u_blue: 2 }, zeny: 1500 } },
  // ── 안개 호수 지방
  { id: 'lakeshore:lore', zone: 'lakeshore', cell: 24, at: 25, kind: 'lore', name: '뒤집힌 낚싯배', lore: 'mist1' },
  { id: 'lakeshore:shrine', zone: 'lakeshore', cell: 5, at: 50, kind: 'shrine', name: '호숫가의 석등', shrine: 'exp' },
  { id: 'lakeshore:chest', zone: 'lakeshore', cell: 14, at: 100, kind: 'chest', name: '낚시꾼의 미끼통', chest: { items: { u_orange: 5 }, zeny: 300 } },
  { id: 'mistmarsh:lore', zone: 'mistmarsh', cell: 3, at: 25, kind: 'lore', name: '측량 말뚝', lore: 'mist2' },
  { id: 'mistmarsh:shrine', zone: 'mistmarsh', cell: 27, at: 50, kind: 'shrine', name: '늪의 석등', shrine: 'sp', charge: 120 },
  { id: 'mistmarsh:chest', zone: 'mistmarsh', cell: 12, at: 100, kind: 'chest', name: '늪에 빠진 짐 꾸러미', chest: { items: { u_orange: 5, u_blue: 2 }, zeny: 600 } },
  { id: 'magetower1:lore', zone: 'magetower1', cell: 9, at: 25, kind: 'lore', name: '서고 책상 서랍', lore: 'mist3' },
  { id: 'magetower2:lore', zone: 'magetower2', cell: 22, at: 25, kind: 'lore', name: '실험대 밑', lore: 'mist4' },
  { id: 'magetower3:lore', zone: 'magetower3', cell: 4, at: 25, kind: 'lore', name: '천문대 창 아래', lore: 'mist5' },
  { id: 'mirrorlake:shrine', zone: 'mirrorlake', cell: 17, at: 50, kind: 'shrine', name: '거울 호수의 석등', shrine: 'drop' },
  { id: 'mirrorlake:chest', zone: 'mirrorlake', cell: 0, at: 100, kind: 'chest', name: '은빛 조개 상자', chest: { items: { u_white: 3, r_elu: 1 }, zeny: 2500 } },
  // ── 푸른 항구 지방
  { id: 'beach:lore', zone: 'beach', cell: 26, at: 25, kind: 'lore', name: '모래 속의 병', lore: 'lamp1' },
  { id: 'beach:shrine', zone: 'beach', cell: 3, at: 50, kind: 'shrine', name: '해변의 석등', shrine: 'zeny' },
  { id: 'beach:chest', zone: 'beach', cell: 11, at: 100, kind: 'chest', name: '떠밀려 온 궤짝', chest: { items: { u_orange: 5 }, zeny: 300 } },
  { id: 'lighthouse:lore', zone: 'lighthouse', cell: 5, at: 25, kind: 'lore', name: '등대 문틀', lore: 'lamp2' },
  { id: 'lighthouse:shrine', zone: 'lighthouse', cell: 24, at: 50, kind: 'shrine', name: '곶의 석등', shrine: 'hp', charge: 120 },
  { id: 'lighthouse:chest', zone: 'lighthouse', cell: 15, at: 100, kind: 'chest', name: '등대지기의 연장통', chest: { items: { u_orange: 5, r_ori: 1 }, zeny: 600 } },
  { id: 'warehouse:lore', zone: 'warehouse', cell: 13, at: 25, kind: 'lore', name: '창고 금고', lore: 'lamp3' },
  { id: 'wreck:lore', zone: 'wreck', cell: 2, at: 25, kind: 'lore', name: '선장실 책상', lore: 'lamp4' },
  { id: 'coralcave:lore', zone: 'coralcave', cell: 28, at: 25, kind: 'lore', name: '산호 덤불', lore: 'lamp5' },
  { id: 'pirateisle:shrine', zone: 'pirateisle', cell: 9, at: 50, kind: 'shrine', name: '보물섬의 석등', shrine: 'exp' },
  { id: 'pirateisle:chest', zone: 'pirateisle', cell: 29, at: 100, kind: 'chest', name: '해적왕의 숨긴 상자', chest: { items: { u_white: 5, r_elu: 2 }, zeny: 5000 } },
  // ── 속삭이는 숲 지방
  { id: 'woodedge:lore', zone: 'woodedge', cell: 6, at: 25, kind: 'lore', name: '키 재기 나무', lore: 'name1' },
  { id: 'woodedge:shrine', zone: 'woodedge', cell: 23, at: 50, kind: 'shrine', name: '숲 어귀의 석등', shrine: 'sp' },
  { id: 'woodedge:chest', zone: 'woodedge', cell: 2, at: 100, kind: 'chest', name: '사냥꾼의 쉼터 상자', chest: { items: { u_orange: 5 }, zeny: 300 } },
  { id: 'mushvale:lore', zone: 'mushvale', cell: 20, at: 25, kind: 'lore', name: '버섯 고리', lore: 'name2' },
  { id: 'mushvale:shrine', zone: 'mushvale', cell: 4, at: 50, kind: 'shrine', name: '골짜기의 석등', shrine: 'drop', charge: 120 },
  { id: 'mushvale:chest', zone: 'mushvale', cell: 27, at: 100, kind: 'chest', name: '약초꾼의 바구니', chest: { items: { u_orange: 5, u_blue: 2 }, zeny: 600 } },
  { id: 'forest:lore', zone: 'forest', cell: 11, at: 25, kind: 'lore', name: '늑대 굴 앞', lore: 'name3' },
  { id: 'forest:shrine', zone: 'forest', cell: 24, at: 50, kind: 'shrine', name: '숲의 석등', shrine: 'exp' },
  { id: 'forest:chest', zone: 'forest', cell: 1, at: 100, kind: 'chest', name: '나무 구멍 속 상자', chest: { items: { u_white: 2, r_ori: 1 }, zeny: 1200 } },
  { id: 'deepforest:lore', zone: 'deepforest', cell: 29, at: 25, kind: 'lore', name: '화살촉 박힌 그루터기', lore: 'name4' },
  { id: 'deepforest:shrine', zone: 'deepforest', cell: 7, at: 50, kind: 'shrine', name: '깊은 숲의 석등', shrine: 'hp', charge: 160 },
  { id: 'deepforest:chest', zone: 'deepforest', cell: 18, at: 100, kind: 'chest', name: '나무꾼 조합의 궤짝', chest: { items: { u_white: 3, r_elu: 1 }, zeny: 2000 } },
  { id: 'moonpath:shrine', zone: 'moonpath', cell: 15, at: 50, kind: 'shrine', name: '달그림자 석등', shrine: 'zeny' },
  { id: 'moonpath:chest', zone: 'moonpath', cell: 5, at: 100, kind: 'chest', name: '여우불 상자', chest: { items: { u_white: 3, r_elu: 1 }, zeny: 2500 } },
  { id: 'grove:lore', zone: 'grove', cell: 16, at: 25, kind: 'lore', name: '고목 속 벽', lore: 'name5' },
  // ── 작열하는 사막 지방
  { id: 'dunes:lore', zone: 'dunes', cell: 28, at: 25, kind: 'lore', name: '마른 두레박', lore: 'water1' },
  { id: 'dunes:shrine', zone: 'dunes', cell: 1, at: 50, kind: 'shrine', name: '모래 언덕의 석등', shrine: 'hp' },
  { id: 'dunes:chest', zone: 'dunes', cell: 17, at: 100, kind: 'chest', name: '모래에 묻힌 짐', chest: { items: { u_orange: 5 }, zeny: 300 } },
  { id: 'thiefden:lore', zone: 'thiefden', cell: 8, at: 25, kind: 'lore', name: '장물 더미', lore: 'water2' },
  { id: 'redcanyon:lore', zone: 'redcanyon', cell: 0, at: 25, kind: 'lore', name: '절벽의 물결 무늬', lore: 'water3' },
  { id: 'redcanyon:shrine', zone: 'redcanyon', cell: 21, at: 50, kind: 'shrine', name: '협곡의 석등', shrine: 'sp', charge: 160 },
  { id: 'redcanyon:chest', zone: 'redcanyon', cell: 10, at: 100, kind: 'chest', name: '매 둥지 속 상자', chest: { items: { u_white: 3, r_elu: 1 }, zeny: 2500 } },
  { id: 'desert:shrine', zone: 'desert', cell: 26, at: 50, kind: 'shrine', name: '사막의 석등', shrine: 'exp' },
  { id: 'desert:chest', zone: 'desert', cell: 3, at: 100, kind: 'chest', name: '대상의 잃어버린 궤짝', chest: { items: { u_white: 5, r_elu: 2 }, zeny: 5000 } },
  { id: 'oasis:lore', zone: 'oasis', cell: 13, at: 25, kind: 'lore', name: '신기루 속 성문', lore: 'water4' },
  { id: 'oasis:shrine', zone: 'oasis', cell: 29, at: 50, kind: 'shrine', name: '오아시스의 석등', shrine: 'zeny', charge: 160 },
  { id: 'oasis:chest', zone: 'oasis', cell: 6, at: 100, kind: 'chest', name: '물가의 항아리', chest: { items: { u_white: 5, u_blue: 3 }, zeny: 5000 } },
  { id: 'pyramid:lore', zone: 'pyramid', cell: 21, at: 25, kind: 'lore', name: '금 간 석판', lore: 'water5' },
  // ── 잿빛 광산 지방
  { id: 'quarry:lore', zone: 'quarry', cell: 12, at: 25, kind: 'lore', name: '깎다 만 석상 받침', lore: 'moon1' },
  { id: 'quarry:shrine', zone: 'quarry', cell: 5, at: 50, kind: 'shrine', name: '채석장의 석등', shrine: 'drop' },
  { id: 'quarry:chest', zone: 'quarry', cell: 27, at: 100, kind: 'chest', name: '석공의 연장 궤짝', chest: { items: { u_white: 3, r_ori: 2 }, zeny: 2000 } },
  { id: 'mine1:lore', zone: 'mine1', cell: 25, at: 25, kind: 'lore', name: '갱도 벽', lore: 'moon2' },
  { id: 'castlejail:lore', zone: 'castlejail', cell: 4, at: 25, kind: 'lore', name: '가장 안쪽 감방', lore: 'moon3' },
  { id: 'cave:lore', zone: 'cave', cell: 19, at: 25, kind: 'lore', name: '부서진 방패', lore: 'moon4' },
  { id: 'ironridge:lore', zone: 'ironridge', cell: 1, at: 25, kind: 'lore', name: '무너진 망루', lore: 'moon5' },
  { id: 'ironridge:shrine', zone: 'ironridge', cell: 22, at: 50, kind: 'shrine', name: '능선의 석등', shrine: 'hp', charge: 160 },
  { id: 'ironridge:chest', zone: 'ironridge', cell: 16, at: 100, kind: 'chest', name: '광부의 비상 상자', chest: { items: { u_white: 3, r_elu: 2 }, zeny: 3000 } },
  // ── 얼어붙은 설원 지방
  { id: 'pinetrail:lore', zone: 'pinetrail', cell: 24, at: 25, kind: 'lore', name: '눈에 묻힌 이정표', lore: 'spring1' },
  { id: 'pinetrail:shrine', zone: 'pinetrail', cell: 3, at: 50, kind: 'shrine', name: '눈길의 석등', shrine: 'drop', charge: 200 },
  { id: 'pinetrail:chest', zone: 'pinetrail', cell: 14, at: 100, kind: 'chest', name: '눈 속의 보급 상자', chest: { items: { u_white: 5, u_blue: 3 }, zeny: 6000 } },
  { id: 'snow:lore', zone: 'snow', cell: 9, at: 25, kind: 'lore', name: '얼음 속 깃발', lore: 'spring2' },
  { id: 'snow:shrine', zone: 'snow', cell: 28, at: 50, kind: 'shrine', name: '설원의 석등', shrine: 'exp' },
  { id: 'snow:chest', zone: 'snow', cell: 2, at: 100, kind: 'chest', name: '기사단의 얼어붙은 궤짝', chest: { items: { u_white: 6, r_elu: 2 }, zeny: 8000 } },
  { id: 'glacier:lore', zone: 'glacier', cell: 5, at: 25, kind: 'lore', name: '협곡 벽의 쇠쐐기', lore: 'spring3' },
  { id: 'glacier:shrine', zone: 'glacier', cell: 18, at: 50, kind: 'shrine', name: '빙하의 석등', shrine: 'sp', charge: 200 },
  { id: 'glacier:chest', zone: 'glacier', cell: 25, at: 100, kind: 'chest', name: '얼음 틈의 배낭', chest: { items: { u_white: 6, r_elu: 3 }, zeny: 8000 } },
  { id: 'icecave:lore', zone: 'icecave', cell: 23, at: 25, kind: 'lore', name: '고드름 기둥', lore: 'spring4' },
  { id: 'starlake:lore', zone: 'starlake', cell: 2, at: 25, kind: 'lore', name: '얼음 비석', lore: 'spring5' },
  { id: 'starlake:shrine', zone: 'starlake', cell: 27, at: 50, kind: 'shrine', name: '별 호수의 석등', shrine: 'hp' },
  { id: 'starlake:chest', zone: 'starlake', cell: 13, at: 100, kind: 'chest', name: '별빛 상자', chest: { items: { u_white: 8, r_elu: 3 }, zeny: 10000 } },
  // ── 하늘 유적 지방
  { id: 'cloudstair:lore', zone: 'cloudstair', cell: 26, at: 25, kind: 'lore', name: '구름 계단 난간', lore: 'sky1' },
  { id: 'cloudstair:shrine', zone: 'cloudstair', cell: 4, at: 50, kind: 'shrine', name: '구름 계단의 석등', shrine: 'zeny' },
  { id: 'cloudstair:chest', zone: 'cloudstair', cell: 11, at: 100, kind: 'chest', name: '구름에 걸린 상자', chest: { items: { u_white: 8, r_elu: 3 }, zeny: 10000 } },
  { id: 'windtemple:lore', zone: 'windtemple', cell: 7, at: 25, kind: 'lore', name: '바람이 넘기는 경전', lore: 'sky2' },
  { id: 'skygarden:lore', zone: 'skygarden', cell: 29, at: 25, kind: 'lore', name: '정원사의 가위', lore: 'sky3' },
  { id: 'skygarden:shrine', zone: 'skygarden', cell: 0, at: 50, kind: 'shrine', name: '정원의 석등', shrine: 'exp', charge: 200 },
  { id: 'skygarden:chest', zone: 'skygarden', cell: 15, at: 100, kind: 'chest', name: '정원사의 도구 상자', chest: { items: { u_white: 8, u_blue: 5 }, zeny: 12000 } },
  { id: 'sanctum:lore', zone: 'sanctum', cell: 22, at: 25, kind: 'lore', name: '왕좌 뒤', lore: 'sky4' },
];

export const POI_BY_ZONE: Record<string, PoiDef[]> = {};
for (const p of POIS) (POI_BY_ZONE[p.zone] ??= []).push(p);
export const FRAGMENT: Record<string, { arc: StoryArc; frag: StoryFragment }> = {};
for (const arc of STORY_ARCS) for (const f of arc.fragments) FRAGMENT[f.id] = { arc, frag: f };
export const ARC: Record<string, StoryArc> = Object.fromEntries(STORY_ARCS.map((a) => [a.id, a]));
