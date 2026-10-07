# 조립형 캐릭터 에셋 제작 리서치 (리그 v3 제안)

작성일 2026-10-07. 대상: `RIG_BRIEF.md`(v1 부품 시트), `RIG_BRIEF_V2.md`(템플릿 전신), `src/render/rig.ts`, `src/render/rigTemplate.ts`, `tools/rig-cut.html`과 그 결과물. 출처는 문서 끝에 모았고 본문에는 [번호]로 표시한다.

## 0. 결론 먼저

**추천: "한 장 그리고, 코드로 맞추고, 편집으로 퍼뜨리는" 하이브리드 컷아웃.**

1. **몸은 v2 방향이 맞다.** 직업당 전신 원화 한 장을 템플릿 자세로 받아 고정 마스크로 자른다. 모델은 캐릭터 한 장은 잘 그리지만, 따로 그린 부품끼리 배율을 맞추지는 못한다(v1 실패).
2. **좌표는 프롬프트로 맞추지 않는다.** 숫자 좌표를 줘도 30~45px씩 어긋났다(v2 notes).
   - 기준 원화 1장을 **우리 코드로 템플릿에 강제 정렬**해 `base_doll.png`를 만든다.
   - 이후 모든 변형(의상·머리·표정·머리장식)은 이 그림을 편집 대상으로 넣고 "X만 바꾸고 나머지는 그대로"로 요청한다.
   - 근거: v2 Swordsman 편집본은 9개 관절 중 7개가 Novice와 같은 위치였고, 견갑을 새로 그린 어깨 2곳만 6px 이내로 달랐다(육안 추정치).
3. **머리 유닛은 강체.** 머리·얼굴·앞뒤 머리카락·머리장식은 RO·메이플처럼 1장씩이고 목 앵커로 몸에 붙는다. 머리장식 30종은 PNG 1장 + 앵커 1개씩이면 된다.
4. **장비 위치는 "착용 상태로 그린 뒤 차분 추출"로 얻는다.** 기준 그림에 모자를 씌운 편집본과 원본의 차이가 곧 모자 부품이고, 그 위치가 곧 앵커 오프셋이다. 메이플이 모든 장비를 기준 몸에 대고 그리는 것과 같은 원리다.
5. **회전으로 안 되는 자세만 부품을 교체한다.** 앉은 다리, 시전·내려치기의 든 팔이 대상이다(Blightbound 방식 [10]). 전체 프레임을 다시 그리는 RO 방식은 그림 수가 직업 × 상태 × 프레임으로 늘고, 프레임마다 얼굴·의상이 흔들려 AI 생산에 맞지 않는다.

---

## 1. 출시된 2D MMO의 레이어 아바타

### 1.1 메이플스토리: origin + 이름 붙은 맵 포인트 + z 레이어 이름 [1][2]

WZ 덤프(XML)를 직접 열어 확인한 내용이다.

- **몸(`00002000.img`)**: 동작당 프레임이 아주 적다.
  - `stand1` 3장(500ms), `walk1` 4장(180ms), `swingO1` 3장(300/150/350ms), `stabO1` 2장, `sit`·`dead` 1장.
  - 프레임마다 `body`, `arm`(일부 `lHand`/`rHand`) 캔버스가 있고, 각자 `origin`과 `map`(`neck`, `navel`, `hand`, `handMove`)을 가진다.
- **머리(`00012000.img`)**: 방향별 1장이고 `map`은 `neck`, `brow`, `earOverHead`, `earBelowHead`다. 머리의 `neck`을 몸 프레임의 `neck`에 맞추므로 몸 프레임이 바뀌어도 다시 그리지 않는다.
- **머리카락·얼굴·모자**: 모두 `brow`에 맞춘다.
  - 머리카락은 `hairOverHead`, `hair`, `backHair`, `backHairBelowCap` 등 여러 z 레이어로 나뉜다.
  - 머리 색은 같은 구조의 별도 이미지 세트다(`00030000`~`00030007`, 끝자리가 색).
- **상의·무기**
  - 상의(`Coat/01040002.img`)는 몸 프레임마다 `mail`(가슴)과 `mailArm`(소매)을 그리고 `navel`로 맞춘다. 캔버스 161개 중 상당수는 `uol` 링크로 재사용한다.
  - 무기도 프레임마다 그림이 있고 `hand`로 맞춘다.
- **z 순서와 숨김은 데이터다.**
  - `zmap.img`는 약 120개 레이어 이름을 앞→뒤로 나열한다. 예: `weaponOverHand` … `armOverHair` … `capOverHair`, `hairOverHead`, `cap`, `hair`, `face`, `head` … `armBelowHead`, `mailChest`, `pants`, `body` … `backHair`.
  - 아이템의 `vslot`은 어떤 레이어를 가릴지 정한다. 예: 모자 `CpH1H5`는 머리카락 일부를 숨긴다.
  - 같은 팔도 프레임마다 `armBelowHead` ↔ `armOverHair`로 z가 바뀐다.

**교훈**: 정렬은 "모든 부품이 같은 이름의 점을 공유한다"로 보장된다. 머리 장비는 `brow` 하나, 손 장비는 `hand` 하나면 된다.

### 1.2 라그나로크 온라인: 몸 스프라이트 + 머리 스프라이트 + ACT 앵커 [3][4][5]

- **스프라이트 단위**
  - 몸: 직업·성별마다 하나이고 의상이 그려져 있다.
  - 머리(`머리통/<성별>/<번호>`): 헤어스타일마다 하나로 얼굴과 머리카락이 한 장이다. 머리 색은 팔레트(`.pal`) 교체로 바꾼다.
  - 머리장식(`악세사리/…`): 아이템마다 하나다.
  - 무기: 직업 × 무기 외형마다 몸 프레임에 맞춘 전체 애니메이션이다.
- **ACT 구조**: 동작 → 프레임 → 레이어(조각, 위치·회전·배율·색). v2.3부터 프레임마다 앵커(attach point)가 있고, "모든 스프라이트는 몸에만 붙는다" [3].
  - 자식 위치 = 몸 앵커 − 자식 앵커. roBrowser는 `position − animation.pos[0]` [4], zrenderer는 `parentOffset − attachpoint`로 계산한다 [5].
- **동작과 방향**: 8방향 × {stand, move, sit, pickup, attackwait, attack, damage, damage2, dead, attack2, attack3, skill}. 서기·앉기의 머리는 고개 3방향 프레임뿐이고, 머리장식은 머리 프레임을 따라간다 [5].
- **그리기 순서**: 몸 → 머리 → 하·중·상단 장식 → 무기. 몸 `.imf`로 프레임별 "머리를 몸 뒤로"를 지정할 수 있다 [5].

**교훈**: 몸은 프레임으로, 머리와 장식은 방향별 1장 + 앵커로. 장식은 머리 앵커만 알고 머리는 몸 앵커만 알기 때문에 수천 종이 정렬된다.

### 1.3 다른 사례

- **Stardew Valley** [6][7]
  - 7개 레이어: 몸 → 바지 → 셔츠 → 액세서리 → 머리 → 모자 → 팔. 위치는 프레임별 오프셋으로 코드에 박혀 있다.
  - 모자는 방향별 20×20 4장이고, 머리카락을 "그대로/변형/숨김" 중에서 고르는 플래그가 있다.
- **LPC 생성기** [8]: 모든 레이어가 같은 프레임 격자를 쓴다. 아이템 하나를 전 프레임에 그려야 한다.
- **Soulbound** [9]: "한 번 확정하면 절대 바꿀 수 없었다." 모든 장비가 같은 골격·프레임 수·비율을 따른다. 기존 프레임을 재배열해 새 동작을 만들었다.
- **Blightbound** [10]: 스프라이트 시트는 캐릭터당 16MB에 장비 교체가 불가능했다. 부품 기반 + 프레임 교체로 바꾸자 부품 4,600개 전체가 65MB가 됐다.

### 1.4 수천 개 아이템의 정렬은 이렇게 보장된다

| 장치 | 메이플 | RO | 우리 적용 |
|---|---|---|---|
| 기준 몸에 대고 그림 | 모든 장비를 몸 프레임에 대고 제작 | 장식을 머리 프레임에 대고 제작 | `base_doll.png`를 편집 대상으로 고정 |
| 공유 앵커 이름 | `neck`/`navel`/`hand`/`brow` | 프레임당 앵커 1개 | `neck`/`crown`/`brow`/`eye`/`mouth`/`grip` |
| 아이템 = 이미지 + 기준점 | 캔버스 + `origin` + `map` | SPR + ACT | PNG + `parts.json` |
| z와 숨김을 데이터로 | `zmap`, `vslot` | 우선순위, `.imf` | `z` 표 + `hides` |
| 머리는 강체 | 방향별 1장 | 고개 3방향 | 1장(반대 방향은 좌우 반전) |
| 프레임 최소화 | 3~4장 | 동작당 몇 장 | 키 2~4개 + 부품 교체 |

---

## 2. 컷아웃 리그 원화 준비 (Spine · Live2D · Unity · Harmony)

- **분리 단위** [13][14]: Live2D는 머리카락(앞·옆·뒤), 얼굴(눈·눈썹·입·귀), 몸(목·몸통·상완·전완·손·다리·치마)으로 나누고, 선과 채색을 한 레이어에 둔다. 80px 꼬마에는 과하다. 머리·얼굴·앞머리·정수리 머리·뒷머리·몸통·팔 2·주먹 2·다리 2면 충분하다(메이플도 팔은 한 장).
- **숨은 부분도 그린다** [11][13]: 가려진 부분까지 그려야 움직일 때 빈틈이 안 보인다(Spine). 움직이면 드러날 영역을 여유 있게 칠한다(Live2D).
- **둥근 관절과 피벗** [11][15][16][17]
  - 두 원이 겹치는 관절이 가장 흔하다. 원 중심에서 회전하므로 이음매가 깨지지 않고, 피벗은 그 원의 중심이다 [16][17].
  - Spine: 겹치는 끝을 둥글게 끝내면 틈이 없고 회전 범위가 최대가 된다 [11].
  - Harmony: 관절 선을 덮는 색 패치를 별도 레이어로 둔다 [15].
- **기본 자세는 곧은 중립 자세** [11][14]: 곧은 이미지는 양쪽으로 굽힐 수 있다. 꼬마는 T자보다 팔을 15~25° 벌린 A자가 낫다. 팔이 몸통에 겹치지 않아 몸통이 온전히 남는다.
- **레이어·외곽선** [11]: 한 물체의 앞과 뒤에 동시에 오는 요소를 한 레이어에 그리지 않는다. 팔다리 양쪽에 외곽선을 둔다.
- **같은 캔버스·원점** [12][14]: Spine과 Unity는 PSD 레이어 위치를 그대로 가져와 조립한다. 우리 `parts.json {x,y}`(1024 템플릿 좌표)가 같은 역할이다.
- **이름은 부위를 따른다**: `head`이지 `red_head`가 아니다. 의상 교체는 같은 이름의 첨부물을 스킨에서 갈아 끼우는 일이다 [12].
- **뼈 개수**: 80px 꼬마는 10~12개면 된다(root, pelvis, torso, head, armF, armB, handF, handB, legF, legB, + hairFront 흔들림). 팔꿈치·무릎 대신 자세 교체 부품을 쓴다.
- **틈 없이 회전시키는 요령**
  1. 원형 관절
  2. 부모의 덮개(소매 끝·치마단·턱)
  3. 자식을 부모 밑으로 연장해 칠하기
  4. 상태별 그리기 순서 변경(Spine 그리기 순서 키, 메이플 `armOverHair`, RO `.imf`)
  5. 한계 각도를 넘으면 부품 교체 [10]

---

## 3. 프레임 방식 vs 컷아웃: 우리 조건에서

조건: AI 생성 원화. 의상 13 × 헤어 8 × 색 10 × 얼굴 2 × 머리장식 약 30 × 무기 10. 상태 8개(idle, ready, walk, attack, cast, sit, hurt, dead). 표시 높이 약 80 CSS px.

| 항목 | A. RO식 프레임 | B. 순수 컷아웃 | **C. 하이브리드 (추천)** |
|---|---|---|---|
| 직업당 그림 수 | 상태×프레임 약 16장 + 무기 프레임 | 전신 1장 | 전신 1 + 숨은 영역 패스 2 + 교체 부품 2~3 |
| AI 일관성 위험 | 높음: 프레임 간 얼굴·의상 흔들림 [21] | 낮음 | 낮음 (편집으로 파생) |
| 장비 교체 | 머리장식은 쉬움, 무기는 프레임마다 | 쉬움 | 쉬움 (앵커) |
| 관절 품질 | 문제없음 | 큰 회전에서 이음매 노출 | 허용 범위 안에서만 회전, 밖은 교체 부품 |
| 동작의 맛 | 가장 좋음 | 종이인형 느낌 | 키 자세는 그린 부품이 담당 |

**C의 규칙**
- 머리 유닛은 강체다. 회전 허용 범위(코드 규약: 0 = 아래, + = 앞)는 어깨 −40°~+100°, 고관절 ±30°, 머리 ±8°.
- 그 밖의 자세는 같은 템플릿 위에서 그린 교체 부품을 쓴다. 필수는 `armF@raise`, `legF@sit`, `legB@sit`, 선택은 `armF@thrust`(접촉 자세용). dead는 전체 회전 + 얼굴 교체로 처리한다.

**현재 코드·시도와의 차이**
- `computePose`의 검 공격은 앞팔을 −150° → −338°로 한 바퀴 돌린다. 컷아웃에서는 어깨 이음매가 반드시 드러나므로, 들어 올린 자세는 `armF@raise`로 바꿔야 한다.
- `docs/art/rig-codex/`의 자율 시도도 같은 방향이다(짧은 팔다리, 가려지는 관절, 접촉 팔 교체). 다만 머리장식 앵커를 `hair_front`에 건 점은 고쳐야 한다. 헤어마다 부피가 달라 장식이 흔들리므로, 메이플처럼 머리 골격(`brow`/`crown`)에 걸어야 한다.

---

## 4. AI 이미지 생성: 사실, 실패, 요령

### 4.1 알려진 사실

- **OpenAI 공식 한계** [18]: 반복 캐릭터의 일관성을 가끔 못 지키고, 배치가 중요한 구성에서는 요소를 정확히 놓기 어렵다.
- **마스크는 안내일 뿐이다** [19][20][22]
  - 마스크는 프롬프트 수준으로 해석돼 모양이 보장되지 않는다. 편집 결과도 전체가 다시 생성되므로 마스크 밖 픽셀이 바뀐다.
  - 정확한 마스크가 필요하면 분할 모델을 쓰라고 쿡북이 권한다 [19].
  - `input_fidelity=high`는 세부 보존이 좋아지지만 비용이 늘고, 편집을 거듭하면 품질이 떨어진다는 보고가 있다 [20].
- **Codex 내장 `image_gen`** [22][23]: 마스크·크기·`background`·`input_fidelity`를 노출하지 않는다(API 키가 있는 CLI 경로에서만 가능). 편집 대상은 대화에 보이는 이미지여야 한다.
  - 권장 사항: 입력 이미지마다 번호와 역할을 적고, "change only X; keep Y unchanged"를 매번 다시 쓰고, 한 번에 하나만 고친다.
- **투명 배경**: gpt-image-2 계열은 투명 출력이 안 된다는 보고가 있다. 단색 크로마키 + 제거 스크립트(soft matte, despill)가 표준 우회로다 [23].
- **우리 실측**: 출력 크기가 요청과 달리 1254×1254였다. "정확한 #FF00FF"이라고 해도 최빈색은 `#FB03FA`/`#FC03FA`였고 배경 영역에 230~8,063가지 색이 섞였다. "그라데이션 금지"라고 해도 미세한 명암·질감이 남았다.

### 4.2 실패 사례

| 사례 | 증상 | 원인 | 대응 |
|---|---|---|---|
| v1 부품 시트 | 머리 폭 217px(목표 250), 몸통 196×216 vs 218×241, 셀 침범 | 부품을 '칸 채우는 아이콘'으로 그림 | 부품을 따로 그리게 하지 않는다 |
| v1 조립 | 작은 머리, 긴 다리, 막대 팔, 목 노출 | 부품 간 공통 기준 없음 | 전신 한 장에서 자른다 |
| v2 전신 | 목 −44, 어깨 −30, 주먹 −30, 앞발 +45px, 정면에 가까운 몸 | 좌표 지시를 따르지 못함 [18] | 코드로 정렬한 뒤 편집으로 전파 |
| v2 Swordsman 편집 | 관절 9곳 중 7곳이 Novice와 같음(성공) | 편집 대상이 형태를 붙잡음 | 모든 변형을 편집으로 |
| 좌우 혼동 | 견갑을 반대 어깨에 그림 | "front shoulder"가 모호함 | "그림 오른쪽(x>512)"처럼 화면 기준으로 지시 |
| 분해 도구 See-through [24] | 포니테일이 뒷머리에 합쳐짐, 신발 레이어 누락 [25] | 학습 분류에 없는 부위 | 출발점으로만 쓰고 정리는 손으로 |
| 마젠타 키 | 분홍·보라 의상, 장식과 충돌 | 키 색이 팔레트와 가까움 | 에셋별로 먼 키 색 선택(§5.1) |

### 4.3 잘 되는 요령

1. **전신 한 장 → 편집 파생.** 1번 = 편집 대상 `base_doll.png`, 2번 = 스타일 참조, 3번 = 디자인 참조. 불변 조건은 매번 다시 쓴다 [22].
2. **차분 추출.** 원본과 편집본을 팔레트로 평탄화하고 관심 영역(ROI) 안에서 색 인덱스가 바뀐 픽셀만 남긴다. 모폴로지 열기·닫기로 잡티를 지운 뒤 가장 큰 연결 성분을 취하고, ROI 밖 변화가 2%를 넘으면 버린다.
3. **팔레트 고정·평탄화.** 승인 팔레트(재질당 기본색 + 그림자 1단 + 외곽선 `#3a2418` 계열)로 최근접 양자화한다. 평면 화풍이라 손실이 거의 없고 잔여 그라데이션도 사라진다.
4. **측정·정규화.** 모델이 그린 절대 크기는 믿지 않는다. 정수리·턱·밑창(실루엣)과 주먹·치마단(색 덩어리)을 측정해 전체 배율과 위치를 맞추고, 남은 오차는 부품 단위 강체 이동(±20px, ±5°)으로 템플릿에 맞춘다.
5. **숨은 영역 패스.** "팔을 지우고 그 자리의 몸통을 이어 그려라" 같은 편집본에서 해당 부품 마스크 안만 가져온다.
6. **선택: 분해 모델**
   - See-through(애니 일러스트 → 최대 23층, 가림 영역 인페인트 [24])나 Qwen-Image-Layered [26]가 숨은 영역 패스를 대신할 수 있다. 다만 정면 애니 그림 위주로 학습돼 3/4 평면 꼬마에는 검증이 필요하고, GPU가 필요하다.
   - `spine-parts`가 See-through 결과를 Spine 부품으로 바꾼 사례다 [27]. 상용 "리깅 시트" 생성기(Scenario 등 [29])는 방법이 공개돼 있지 않다.
7. **포즈 키포인트 생성.** PixelLab 같은 골격 키포인트 기반 재포즈 도구 [28]는 교체 부품을 만드는 대안이다.

### 4.4 프롬프트 틀 (영어, Codex 전달용)

모든 요청은 첫 줄에 이미지 역할을 적고, 끝에 불변 조건을 반복한다. `<KEY>`는 §5.1의 키 색이다.

**T1. 기준 원화 (최초 1회)**
```text
Use case: stylized-concept. Image 1: placement guide (grey mannequin) — trace its silhouette. Image 2: style reference (characters only). Image 3: design reference.
One full-body chibi girl painted OVER image 1's mannequin, same framing, three-quarter view facing the right side of the picture.
Head+hair fill the big grey head shape; chin rests on the collar (no visible neck). Both arms straight, hanging about 20° away from the body,
empty closed fists at the ends of the grey arm capsules; legs straight, slight A-stance, gap between legs; boot soles on the mannequin's feet.
Sleeves end in a ROUND puffed cap with an outline around each shoulder; tunic hem covers the tops of both thighs.
Both arms the SAME colours (do not darken one arm). Hair ends above the shoulders.
Style: flat fills, one hard-edged shadow tone per material, thick dark-brown outer outline, thinner inner lines; no gradient, texture or gloss.
Background: one flat key colour <KEY>. No marks, text, grid, ground line or shadow.
```

**T2. 직업 의상 (편집)**
```text
Use case: identity-preserve. Image 1: EDIT TARGET (base_doll.png). Image 2: style reference. Image 3: outfit concept for <CLASS>.
Change ONLY the clothing to: <outfit>. Sleeves keep the round shoulder cap; hem still covers the thigh tops.
Keep unchanged: head, face, hair, skin, hands, proportions, pose, every outline position, boot positions, background colour. Do not move, scale or rotate anything.
```

**T3. 숨은 영역 패스 (편집, 의상마다 2장)**
```text
(a) Image 1: EDIT TARGET. Change ONLY: remove both arms completely; paint the torso, collar and sleeve openings as if the arms were not there,
    continuing the existing shapes, colours and outlines. Keep everything else unchanged.
(b) Change ONLY: remove the tunic skirt below the belt; paint the complete upper legs / shorts up to the waist. Keep everything else unchanged.
```

**T4~T7. 머리 · 표정 · 헤어 · 머리장식 (편집)**
```text
T4: Change ONLY: remove all hair; paint a smooth bald scalp, same skin colour and outline, ear visible. Keep the face and everything else unchanged.
T5: Change ONLY the facial expression to <blink | angry attack | hurt (>_<) | dead (x x) | relaxed>. Keep head shape, hair and everything else unchanged.
T6: Image 1: EDIT TARGET (bald reference). Change ONLY: give her hairstyle <desc>, hair painted light cream #F2EEE6 with one shadow tone.
T7: Image 1: EDIT TARGET (base_doll.png). Change ONLY: she wears <item> on her <top of head | eyes | mouth>, sized and placed as worn. Keep hair and face unchanged.
```

**T8. 무기 (2단계)**
```text
(a) Image 1: EDIT TARGET. Change ONLY: the fist on the RIGHT side of the picture holds a <weapon>, handle gripped vertically, blade pointing up.
(b) The same <weapon> alone, horizontal, handle on the LEFT, tip on the RIGHT, complete handle visible, same size as in (a), flat <KEY> background.
```

---

## 5. 권장 제작 사양 (Mini Midgard 리그 v3)

### 5.1 캔버스·원점·배경

- **원화 마스터**
  - 1024×1024 템플릿 좌표(왼쪽 위가 원점, y는 아래로). 지면 `ground=968`, 스프라이트 원점은 발 중앙 `(515, 968)`으로 기존 `rigTemplate.ts`와 같다.
  - 캐릭터 높이는 약 908px(아호게 제외)이고, 게임에서는 `k = 80/908`로 줄인다.
- **런타임**: 마스터의 50%(높이 약 454px)로 아틀라스를 만든다. 기기 3배(240px)에서도 1.9배 여유가 있다.
- **모델 출력**: 1254px 등 어떤 크기로 오든 랜드마크를 측정해 1024 좌표로 정규화한다. 단순 리사이즈로는 안 된다.
- **배경 키 색**
  - 기본은 녹색 `#00FF00`(Codex 크로마키 관례 [23])이고, 녹색 장비(새싹 등)는 마젠타로 받는다.
  - 판정은 정확한 일치가 아니라 테두리 flood + 거리 임계값 + despill로 한다. 현 `rig-cut.html`의 방식이 맞다.

### 5.2 레이어와 z 순서 (뒤 → 앞, 오른쪽을 보는 3/4 시점)

| z | 레이어 | 붙는 곳 | 출처 | 비고 |
|---|---|---|---|---|
| 0 | `shadow` | origin | 코드 | 타원 |
| 5 | `garmentBack` | `back` | 장식 | 망토·날개 |
| 10 | `hairBack` | 머리 `brow` | 헤어 | 머리 뒤쪽 볼륨 |
| 12 | `headTopBack` | `crown` | 장식 | 머리 뒤로 넘어가는 챙(필요할 때만) |
| 20 | `armB` + `handB` | `shoulderB` | 의상 | 엔진에서 어둡게(`shaded`) |
| 25 | `weaponB` | `gripB` | 무기 | 활을 당기는 손 등 |
| 30 / 32 | `legB` / `legF` | `hipB` / `hipF` | 의상 | `legB`는 엔진에서 어둡게 |
| 40 | `torso` | pelvis(root) | 의상 | 치마단, 깃, 반바지 엉덩이 포함 |
| 42 | `shield` | `gripB` | 무기 | 몸통 앞, 앞팔 뒤 |
| 44 | `armF` | `shoulderF` | 의상 | 기본은 머리 아래(메이플 `armBelowHead`) |
| 46 | `weapon` | `gripF` | 무기 | 팔과 주먹 사이 |
| 48 | `handF` | `wristF` | 의상 | 손잡이를 덮는 주먹 |
| 50 | `head` | `neck` | 공통 | 피부, 귀, 숨은 목 |
| 52 | `face` | `brow` | 얼굴형 × 표정 | 눈, 눈썹, 입 |
| 54 | `headLow` | `mouth` | 장식 | 입 장식, 마스크 |
| 56 | `hairFront` | `brow` | 헤어 | 앞머리, 옆머리 |
| 58 | `hairTop` | `brow` | 헤어 | 정수리, 아호게. 모자가 `hides`로 숨김 |
| 60 | `headMid` | `eye` | 장식 | 안경 |
| 62 | `headTop` | `crown` | 장식 | 모자, 리본 |

**상태별 z 덮어쓰기** (RO `.imf`, 메이플 프레임별 z와 같은 장치): cast와 `armF@raise` 프레임에서는 `armF`, `weapon`, `handF`를 70/72/74로 올려 얼굴 앞에 둔다.

### 5.3 관절·앵커 (1024 템플릿 좌표, `rigTemplate.ts` 호환 확장)

**기존 값 그대로**: `neck` (512,448), `shoulderF` (600,478), `shoulderB` (418,482), `handF` (668,700) = `gripF`, `handB` (352,700) = `gripB`, `hipF` (560,660), `hipB` (462,660), `footF` (600,960), `footB` (430,960), `head` 타원 (520,255,210,195), `torso` 사각형.

**추가**

| 이름 | (x, y) | 소속 | 용도 · 허용 오차 |
|---|---|---|---|
| `skull` | 원 (525,272), r 168 | head | 대머리 머리통, 장식 기준 · ±8 |
| `chin` | (548,438) | head | 깃을 16px 이상 덮는다 · y 430~448 |
| `crown` | (522,104) | head | 모자 앵커(머리카락이 아니라 정수리) · ±8 |
| `brow` | (566,246) | head | 얼굴·앞머리·뒷머리 공통 기준(메이플 `brow`) · ±6 |
| `eye` / `mouth` | (578,300) / (588,384) | head | 중단 / 하단 장식 · ±6 |
| `ear` | (408,318) | head | 귀걸이, 머리띠 끝 |
| `hairTopCut` | y = `brow.y` − 46 | head | 이 선 위가 `hairTop` |
| `back` | (470,505) | torso | 망토 |
| `wristF` / `wristB` | (651,644) / (368,645) | arm | 어깨→주먹의 75% 지점, 주먹 피벗 |
| `hemY` | 700 ± 12 | torso | 고관절보다 35px 이상 아래 |

**관절 원 반지름 `capR`**: 어깨 42, 고관절 48, 손목 26, 목 44. 이 원 안은 자식 부품이 반드시 칠해져 있어야 한다.

**굵기 하한 (막대 팔 방지)**: 소매 64px, 전완 52px, 허벅지 72px, 종아리 62px. 외곽선은 9~13px(80px 표시에서 약 1px).

**템플릿 이미지 수정**: 모델 입력용 안내도에서는 글자와 점을 빼고, 위 굵기와 `capR`을 반영한 회색 마네킹(팔다리 캡슐, 둥근 어깨 캡, 치마단 선)만 남긴다. 점 표식은 사람 검수용 오버레이로만 쓴다.

### 5.4 겹침과 숨은 영역 규칙

1. **모든 관절은 쉬는 자세에서 덮여 있다.** 목은 턱·머리카락이, 고관절은 치마단이, 손목은 장갑·소매 끝이, 뒤 어깨는 몸통이 덮는다. 앞 어깨는 자기 소매 캡(둥근 외곽선의 원)이 덮는다.
2. **자식은 부모 밑까지 연장해 칠한다.** 다리 윗단은 고관절 위 `capR`까지(T3b에서 확보), 팔 윗단은 어깨 원 전체, 목은 턱 밑 40px 토막이다.
3. **부모의 가려진 부분도 칠한다.** 앞팔 캡 밑의 몸통 어깨는 T3a에서 가져온다.
4. **한 부위는 한 부품에만.** 반바지 엉덩이·치마단은 `torso`, 바짓가랑이는 `leg`, 소매는 `arm`에 둔다. v1의 반바지 중복을 막는 규칙이다.
5. **뒤쪽 팔다리도 같은 색으로 받는다.** 어둡게 하는 건 엔진이 한다. 모델이 칠하는 명암은 매번 다르다.
6. **회전은 §3 허용 범위 안에서만.** 넘으면 교체 부품을 쓴다.
7. **자르는 선은 그려진 이음매를 따른다.**
   - 소매 캡 외곽선, 치마단 선, 장갑 끝을 기준으로 하고, 공칭 선 ±12px 안의 가장 가까운 외곽선으로 스냅한다.
   - `rig-cut.html`의 거리 휴리스틱은 `rig-masks.svg`(부위별 다각형·원) + 스냅으로 바꾼다.

### 5.5 장착 방식

- **의상(13종)**: `torso`, `armF`, `armB`, `handF`, `handB`, `legF`, `legB` + 교체 부품(`armF@raise`, `legF@sit`, `legB@sit`, 선택 `armF@thrust`). 모두 같은 마스크로 자르므로 피벗이 같아 섞어 끼울 수 있다.
  - 로브 직업은 `torso`에 긴 치마를 넣고 다리는 발만 쓴다. 몸은 남녀 공용이고 성별은 얼굴형·헤어로 나타낸다.
- **얼굴(2형 × 표정 6종)**: normal, blink, attack, hurt, dead, relaxed. `face` PNG에 `brow` 기준 오프셋을 둔다.
- **헤어(8종)**: `hairBack`/`hairFront`/`hairTop` 세 장이고, 마스터는 밝은 크림 + 그림자 1단으로 그린다. 색은 multiply 대신 **팔레트 재매핑**을 권장한다. 마스터의 정확한 2~3색을 색별 램프로 바꾸는 방식으로 RO `.pal`과 같은 원리이며, 외곽선은 유지된다.
- **머리장식**: PNG + `{slot, anchor: crown|brow|eye|mouth|ear, offset, hides: [...]}`. 오프셋은 T7 차분 추출로 자동 계산된다.
- **무기(10종)**: PNG(가로, 끝이 오른쪽) + `{grip, tip, grip2?, hold: oneHand|twoHand|staff|bow|katar, restAngle}`. 크기·그립 위치는 T8a에서, 손잡이 전체 픽셀은 T8b에서 가져와 템플릿 매칭으로 맞춘다. 주먹 `handF`가 손잡이를 덮고, 구멍 난 주먹은 쓰지 않는다.

```json
{ "set": "swordsman", "canvas": 1024, "origin": [515, 968],
  "parts": { "armF": { "x": 560, "y": 440, "pivot": "shoulderF", "z": 44 },
             "armF@raise": { "x": 548, "y": 300, "pivot": "shoulderF", "z": 70 } },
  "headgear": { "beret": { "slot": "top", "anchor": "crown", "offset": [-4, 18], "hides": ["hairTop"] } } }
```

### 5.6 상태별 애니메이션

| 상태 | 방법 | 키 | 교체 · z | 얼굴 |
|---|---|---|---|---|
| idle | 몸통 scaleY 1→1.015, 머리 bob 2px, 팔 ±3° | 2키 루프 1.2s | | normal + 깜빡임 |
| ready | 숙임 5°, 무기 앞으로, bob | 2키 | | attack |
| walk | 다리 ±22°, 팔 반대로 ±15°, 접지 때 몸 −6px | 4키(메이플 4×180ms) | | normal |
| attack 찌르기·단검 | 준비 → 접촉(+95°) → 복귀 | 3키(메이플 300/150/350ms) | 접촉에 `armF@thrust`(선택) | attack |
| attack 검·도끼 | 들기 → 내려치기 접촉 → 복귀, 한 바퀴 회전 금지 | 3키 | 들기는 `armF@raise` z 70 | attack |
| cast | 두 팔 앞·위로, 지팡이 세움, 마법진 효과 | 2키 루프 | `armF@raise` z 70 | attack |
| sit | 몸을 내리고 앉은 다리로 교체 | 1키(메이플 1장) | `legF@sit`, `legB@sit` | relaxed |
| hurt | 뒤로 10°, 흰색 번쩍임, 넉백 | 1키 0.1s | | hurt |
| dead | 전체 −90° 회전, 바닥에 눕힘 | 1키 | | dead |

---

## 6. 이미지 모델 요청 워크플로 (순서대로)

각 단계는 **입력(순서·역할) → 프롬프트 → 자동 검사 → 실패 시 처리** 순서다. 재생성은 단계당 최대 3회이고, 넘으면 사람이 판단한다.

| 단계 | 요청 | 입력 이미지 | 검사 | 산출물 |
|---|---|---|---|---|
| 0 | (사람·코드) 마네킹 안내도 v3, 팔레트 표, `rig-masks.svg` | | 마네킹을 80px로 줄여 scene_A와 비교 | `guide_v3.png`, `palette.json` |
| 1 | T1 기준 원화(Novice) | 1 guide_v3, 2 scene_A 캐릭터 크롭, 3 디자인 참조 | 스타일·정체성 육안, 굵기 하한, 키 배경 | `novice_raw.png` |
| 2 | (코드) 키 제거 → 팔레트 양자화 → 랜드마크 측정 → 전체·부품 정렬 → 재합성 | | §5.3 허용 오차 전부, 외곽선 굵기 | **`base_doll.png`** (이후 모든 편집의 1번 입력) |
| 3 | T3a, T3b 숨은 영역 패스 | 1 base_doll | ROI 밖 변화 < 2%, 마스크 안이 빈틈없음 | `torso_full`, `legs_full` |
| 4 | (코드) 고정 마스크로 절단, 숨은 영역 합성, `parts.json` 작성 | | 재합성 대 원본 차이 평균 ≤ 1(spine-parts 방식 [27]) | 부품 세트 |
| 5 | T4 대머리, T5 표정 5종, 남성 얼굴형(+표정) | 1 base_doll | 얼굴 박스 밖 변화 < 2% | `head`, `face_*` |
| 6 | T6 헤어 8종 | 1 대머리 기준 | 차분 → 3장으로 분할, 2~3색 재매핑 확인 | `hair_<n>_*` |
| 7 | T2 의상 12종 → 3·4단계 반복 | 1 base_doll, 2 scene_A, 3 의상 컨셉 | 관절이 base_doll 대비 ±6px | 의상 세트 |
| 8 | 교체 부품: T2 변형("front arm raised overhead", "sitting legs") | 1 해당 의상 그림, 2 자세 안내도 | 피벗 원이 템플릿 원과 ±8px 안에서 일치 | `@raise`, `@sit`(, `@thrust`) |
| 9 | T7 머리장식 약 30종 | 1 base_doll | ROI는 머리 타원 + 60px, 차분으로 앵커 자동 산출 | `hg_*.png` + 메타 |
| 10 | T8a·T8b 무기 10종 | 1 base_doll / 없음 | a·b 정합 오차 ≤ 4px | `wp_*.png` + grip/tip |
| 11 | (코드) 조립 시트 렌더 | | 9개 상태 × 의상 × 장비 표본, 80px 실제 크기와 2배 확대 | `preview_*.png` |

- **핵심은 2단계 정렬 코드다.** 한 번 제대로 만들면, 이후 편집이 형태를 보존한다는 성질(§4.2)을 그대로 이용할 수 있다.
- 편집본이 조금 밀리면 전체를 다시 맞추지 말고, `base_doll`과 차이가 큰 영역만 부분 정렬한다.
- 모든 생성물은 원본·프롬프트·검사 수치와 함께 `docs/art/rig-v3/<단계>/`에 보존한다.

---

## 7. 수용 체크리스트

**전신 원화 / base_doll**
- [ ] 1024 좌표로 정규화한 뒤 정수리 y 60±10, 턱 y 430~448, 밑창 y 964~972
- [ ] 어깨 ±12, 주먹 ±15, 고관절 ±12, 발 ±15px, 치마단 688~712
- [ ] 머리(머리카락 포함)와 템플릿 타원의 IoU ≥ 0.85, 목이 보이지 않음
- [ ] 팔과 몸통 사이, 두 다리 사이에 배경 틈이 있음(어깨 접합부 제외)
- [ ] 굵기 하한(§5.3) 충족, 외곽선 9~13px
- [ ] 양자화 후 재질당 2색 + 외곽선, 원본 대비 ΔE 평균 ≤ 3
- [ ] 80px로 줄여 scene_A 캐릭터 옆에 놓았을 때 머리 비율과 인상이 같음

**부품**
- [ ] 모든 부품에 1024 좌표 `{x,y}`와 이름 붙은 피벗이 있음
- [ ] 관절 원(`capR`) 안이 자식 부품으로 빈틈없이 칠해짐
- [ ] 같은 부위가 두 부품에 중복되지 않음(반바지, 소매)
- [ ] 재합성 대 원본 차이 평균 ≤ 1, 덮이지 않은 구멍 0
- [ ] 뒤쪽 팔다리가 원화에서 앞쪽과 같은 색(어둡게는 엔진에서)

**머리 유닛과 장비**
- [ ] `head`/`face`/`hair*`/머리장식이 모두 머리 앵커(`brow`, `crown` 등) 기준이고, 머리카락에 건 앵커는 없음
- [ ] 헤어 마스터가 정확히 2~3색이고, 10색 재매핑에서 외곽선이 변하지 않음
- [ ] 모자를 쓰면 `hairTop`이 숨고, 헤어 8종 모두에서 모자가 머리에 붙어 보임
- [ ] 주먹이 손잡이를 덮고, 공격 접촉 프레임에서 칼끝이 앞(오른쪽)을 향함

**애니메이션·데이터**
- [ ] 9개 상태 렌더에서 어깨·고관절에 배경이 비치는 틈 0
- [ ] 허용 범위를 넘는 자세는 교체 부품을 씀(팔 한 바퀴 회전 없음)
- [ ] 의상 13 × 대표 무기 3 × 머리장식 3 조합 시트에서 어긋남 없음
- [ ] `parts.json` 스키마 검증 통과, 템플릿 버전과 단계별 원본·프롬프트·수치 기록

---

## 8. 출처

1. MapleStory WZ 덤프(BeiDou-Server): `Base.wz/zmap.img.xml`, `smap.img.xml`, `Character.wz/00002000`(몸), `00012000`(머리), `Hair/00030000~7`, `Cap/01002000`, `Coat/01040002`, `Weapon/01302000`, `Face/00020000` — https://github.com/BeiDouMS/BeiDou-Server/tree/master/gms-server/wz
2. RaGEZONE, "How does smap + vslot + z work?" — https://forum.ragezone.com/threads/how-does-smap-vslot-z-work.1144802/
3. Ragnarok Research Lab, ACT format — https://ragnarokresearchlab.github.io/file-formats/act/
4. roBrowserLegacy `EntityRender.js` — https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Entity/EntityRender.js
5. zrenderer(`source/sprite.d`, `resolver.d`) — https://github.com/zhad3/zrenderer
6. Stardew Valley Wiki, Modding:Farmer sprite — https://stardewvalleywiki.com/Modding:Farmer_sprite
7. Stardew Valley Wiki, Modding:Hat data — https://stardewvalleywiki.com/Modding:Hat_data
8. Universal LPC Spritesheet Character Generator — https://github.com/EttienneS/Universal-LPC-Spritesheet-Character-Generator
9. Soulbound, "How We Built A Pixel Art Character and Cosmetic System" — https://soulbound.game/news/how-we-built-a-pixel-art-character-and-cosmetic-system/
10. Game Developer(Ronimo), Blightbound 2D animation toolchain — https://www.gamedeveloper.com/programming/finding-a-suitable-toolchain-for-animating-blightbound-s-2d-characters
11. Esoteric Software, "How to cut your assets for animation" — https://en.esotericsoftware.com/blog/How-to-cut-your-assets-for-animation
12. Spine User Guide: Skins — https://en.esotericsoftware.com/spine-skins ; Images — http://esotericsoftware.com/spine-images ; Mix and match — https://en.esotericsoftware.com/spine-unity-mix-and-match
13. Live2D, Illustration Processing — https://docs.live2d.com/en/cubism-editor-tutorials/psd/ ; Material Separation — https://docs.live2d.com/en/cubism-editor-manual/divide-the-material
14. Unity 2D Animation, Preparing and importing artwork — https://docs.unity3d.com/Packages/com.unity.2d.animation@10.1/manual/PreparingArtwork.html
15. Toon Boom Harmony, Patch Articulation — https://docs.toonboom.com/help/harmony-11/workflow-network/Content/_CORE/_Workflow/020_Character_Building/071_H2_Patch_Articulation.html ; Rig a Cut-out Character — https://docs.toonboom.com/help/harmony-22/advanced/getting-started/character-building.html
16. Adobe Community, "Types of joints used in digital cutout animation" — https://community.adobe.com/questions-540/types-of-joints-used-in-digital-cutout-animation-106544
17. Tahoma2D, Creating Cutout Animation — https://tahoma2d.readthedocs.io/en/latest/creating_cutout_animation.html
18. OpenAI, Image generation guide — https://developers.openai.com/api/docs/guides/image-generation
19. OpenAI Cookbook, Generate and edit images with GPT Image — https://developers.openai.com/cookbook/examples/generate_images_with_gpt_image
20. OpenAI Community: 마스크·투명도 해석 — https://community.openai.com/t/understanding-how-gpt-image-models-on-edits-see-mask-and-transparency/1381752 ; high fidelity editing — https://community.openai.com/t/image-generation-high-fidelity-editing/1317649
21. Spritecook, "Animating sprite sheets — tips for consistency" — https://www.spritecook.ai/blog/animating-sprite-sheets-tips-for-consistency
22. openai/skills `imagegen`(SKILL.md, prompting.md, image-api.md) — https://github.com/openai/skills/tree/main/skills/.system/imagegen
23. D. Vaughan, Codex CLI visual workflows(gpt-image-2, 크로마키) — https://codex.danielvaughan.com/2026/06/04/codex-cli-visual-workflows-image-input-gpt-image-2-generation-asset-pipelines-v0137/
24. See-through: Single-image Layer Decomposition for Anime Characters — https://arxiv.org/abs/2602.03749 ; https://github.com/shitagaki-lab/see-through
25. lilting.ch, See-through 실사용 테스트 — https://lilting.ch/en/articles/see-through-anime-layer-decomposition
26. Qwen-Image-Layered — https://huggingface.co/Runware/Qwen-Image-Layered/blob/main/README.md
27. firejune/spine-parts — https://github.com/firejune/spine-parts
28. PixelLab, Animate with skeleton — https://www.pixellab.ai/docs/tools/animate-with-skeleton
29. Scenario, 2D Animation Rigging Sheet — https://www.scenario.com/apps/2d-animation-rigging-sheet

프로젝트 내부 근거: `docs/art/concepts/rig/notes.md`(v1 실측), `docs/art/rig-template/notes.md`(v2 실측·프롬프트 원문), `docs/art/prototype/5_rig_poses.png`, `docs/art/rig-codex/`(Codex 자율 시도).
