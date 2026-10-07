# 초보자 관절 리그 시험 시트 검토

## 결과

- 파일: `rig_novice.png`, RGB PNG, **1536×1536 px**.
- 생성 도구: 내장 `image_gen`. 최초 생성 1회 + 재생성 3회, 총 4회. 최종 4차 결과를 시험 산출물로 저장했다.
- 도구 원본은 요청과 달리 매번 **1254×1254 px**였다. 선택한 원본을 `sips`로 가로·세로 같은 비율로 1536×1536에 맞춰 저장했다. 실제 고해상도 재생성이 아니라 확대이며, 부품 재배치·재채색·배경 교체는 하지 않았다.
- **판정: REQUEST 전체 충족 실패. 승인 가능한 완성 리그가 아니라, 생성 방식의 한계를 확인하는 시험 이미지다.**
- 프로젝트에는 요청한 PNG와 이 문서만 작성했다. 원본 레퍼런스와 브리프는 변경하지 않았다.

## 브리프 자체의 치수 충돌

384×384 셀 하나에 높이 약 640 px의 조립 캐릭터를 같은 배율로 넣으면서 가장자리 여백까지 확보할 수는 없다. 생성 프롬프트에서는 부품의 원래 배율을 우선하고, 셀 15만 50% 축소한 높이 약 320 px의 참고도로 요청했다. 이는 브리프의 “셀 15도 같은 배율” 조건에 대한 **명시적 미충족 사항**이다. 문서나 브리프를 임의로 수정하지 않았다. 최종 그림은 이 50% 배율조차 정확히 지키지 않았다.

## 검수 방법

저장된 최종 PNG를 다시 열어 육안으로 확인하고, PNG 픽셀을 읽어 크기·색 분포·부품 경계상자를 측정했다. 픽셀 검사용 Python은 읽기 전용이며 이미지를 편집하지 않았다.

경계상자는 `R>210, G<45, B>210`을 근사 배경으로 제외한 뒤 연결된 전경 영역으로 측정했다. 좌표는 왼쪽 위 기준이며 오른쪽·아래 끝은 포함하지 않는다. 안티앨리어싱 때문에 경계가 약간 달라질 수 있다. 셀마다 잘라서 측정하면 이웃 셀에서 넘어온 부품이 섞이므로, 아래 수치는 각 연결된 부품 자체를 기준으로 했다.

| 셀 | 부품 | 최종 경계상자 (x0,y0,x1,y1) | 폭×높이 |
|---|---|---|---|
| 0 | 머리 | 85,157,302,376 | 217×219 |
| 1 | 앞머리 | 415,84,709,384 | 294×300 |
| 2 | 뒷머리 | 821,144,1083,386 | 262×242 |
| 3 | 초보자 몸통 | 1231,160,1427,376 | 196×216 |
| 4 | 초보자 앞팔 | 147,466,253,737 | 106×271 |
| 5 | 초보자 뒷팔 | 525,465,634,737 | 109×272 |
| 6 | 앞다리 | 863,464,1001,745 | 138×281 |
| 7 | 뒷다리 | 1244,463,1383,745 | 139×282 |
| 8 | 검사 몸통 | 95,822,313,1063 | 218×241 |
| 9 | 검사 팔 | 518,820,630,1082 | 112×262 |
| 10 | 단검 | 789,898,1047,990 | 258×92 |
| 11 | 검 | 1111,895,1507,996 | 396×101 |
| 12 | 새싹 | 125,1247,300,1362 | 175×115 |
| 13 | 별 머리핀 | 497,1248,659,1341 | 162×93 |
| 14 | 베레모 | 802,1205,1050,1383 | 248×178 |
| 15 | 조립 참고 캐릭터 | 1225,1121,1441,1465 | 216×344 |

## 알려진 문제

### 셀 분리와 여백: 실패

- 지정된 16종의 항목은 순서대로 존재한다.
- 앞머리는 첫 행 아래 경계에 붙어 여백이 없다. 뒷머리는 y=384 경계를 약 2 px 넘는다.
- 검 손잡이는 셀 11의 시작 x=1152보다 약 41 px 왼쪽에 있어 셀 10을 침범한다. 검 자체 폭도 396 px여서 384 px 셀에 들어갈 수 없다.
- 셀 15의 아호게가 y=1152보다 약 31 px 위로 올라가 셀 11을 침범한다.
- 머리와 초보자 몸통의 아래 여백은 약 8 px뿐이며 여러 부품이 셀 중앙에 정확히 놓이지 않았다.
- 따라서 384×384 고정 셀로 그대로 자르면 일부 부품이 잘리거나 다른 셀에 섞인다.

### 순수 마젠타 배경: 실패

육안으로는 마젠타 단색처럼 보이지만 **정확한 #FF00FF 단색이 아니다.** 최종 파일에서 가장 많은 색은 RGB(251,3,250), 즉 #FB03FA였다. 근사 마젠타로 분류한 1,919,922개 픽셀 중 정확한 RGB(255,0,255)는 27개뿐이며, 이 범위에 8,063가지 색이 있었다. 가장자리의 혼합색뿐 아니라 넓은 배경에도 미세한 색 변화가 있다. 원본 생성 이미지 단계에서도 이 문제가 있었으므로 확대만의 문제는 아니다. 단일 색상 일치 방식으로 배경을 제거할 수 있는 파일이라고 볼 수 없다.

### 배율과 의상 교체: 실패

- 셀 0 머리 폭은 목표 약 250 px보다 작은 217 px다.
- 초보자 몸통 196×216과 검사 몸통 218×241은 크기와 실루엣이 다르다. 같은 피벗에 그대로 교체할 수 있다는 근거가 없다.
- 앞·뒷팔 및 앞·뒷다리는 서로 비슷한 크기지만, 전체 캐릭터에 맞춘 정확한 공통 배율은 확보하지 못했다. 검사 팔도 초보자 팔과 길이·윤곽이 다르다.
- 참고 캐릭터 높이는 344 px로, 원래 요구한 640 px와도, 수정 프롬프트의 320 px와도 다르다. 참고 캐릭터의 머리·머리카락 역시 셀 0·1의 정확한 50% 복사본이 아니다. 머리카락 폭은 눈으로 약 170 px로 추정되어 앞머리 부품 폭 294 px의 절반과 맞지 않는다.
- 단검 258 px, 검 396 px로 무기 크기가 크게 생성됐다. 손잡이 두께와 주먹 구멍의 실제 끼움 관계도 검증되지 않았다.
- 새싹과 별 머리핀도 요청한 작은 장식 비율보다 크다.

### 부품 완결성과 겹침: 미검증·수정 필요

- 머리의 두피와 짧은 목, 대체로 닫힌 부품 윤곽, 칠해진 팔·다리 윗부분, 무기 장착용 주먹 구멍은 표현됐다.
- 앞머리 왼쪽에 귀처럼 읽히는 내부 윤곽이 남아 있어 순수 앞머리 레이어인지 정리가 필요하다.
- 뒷머리에서 중복 아호게는 마지막 생성으로 제거됐지만, 앞·뒷머리의 정확한 맞물림은 보장되지 않는다.
- 몸통의 어깨 단면은 입체적인 구멍처럼 보이고 관절 회전을 고려한 넉넉한 덮임 영역은 명확하지 않다. 상완·허벅지의 둥근 연결 여유분도 충분하다고 확인할 수 없다.
- 목 스텁과 목 구멍의 중심, 어깨·고관절 기준점은 좌표로 맞추지 않았다. 회전 시 틈이나 이중 외곽선이 드러날 가능성이 있다.
- 셀 15는 생성 모델이 다시 그린 완성 캐릭터이며, 앞의 부품들을 실제로 합성한 검증 결과가 아니다. 이 그림만으로 조립 성공이나 숨은 겹침을 입증할 수 없다.
- 엔진 관절 애니메이션이나 장비 교체 테스트는 수행하지 않았다.

### 승인 스타일과의 일치: 부분 충족

크림색 단발과 아호게, 장난스러운 표정, 청색 눈, 황갈색 의상, 굵은 갈색 윤곽과 작은 체형은 레퍼런스의 정체성을 상당 부분 유지한다. 그러나 피부·머리·의상 등에 미세한 명암 변화와 질감이 남아 “평면색 + 하나의 평면 그림자” 규칙을 엄밀히 충족하지 않는다. 부품 크기가 제각각이어서 조립 후 선 굵기의 일관성도 보장되지 않는다. 검사 띠는 선명한 빨강보다 탁한 주황빛이며, 별 장식에는 하이라이트처럼 읽히는 색면이 있다. scene_A와 **정확히 같은 품질을 달성했다고 평가하지 않는다.**

## 이 방식으로 scene_A 품질에 도달할 수 있는가

**컷아웃 리그라는 방식 자체는 가능성이 있다. 그러나 이번 단일 생성 시트는 그 가능성을 검증하는 데 실패했다.** scene_A의 작은 화면상 캐릭터는 단순한 색면과 명료한 실루엣이 중심이므로, 제대로 설계된 그림 부품을 사용하면 그 인상을 유지할 수 있다. 전제는 동일 배율로 실제 조립한 원화를 기준으로 부품을 나누고, 가려지는 관절 영역까지 그린 뒤, 피벗을 맞춰 회전과 의상 교체를 확인하는 것이다.

이번 결과를 바로 엔진에 넣으면 셀 잘림·배율 차이·겹침 부족이 먼저 드러날 것이다. 고정 크기 셀에 맞춘 재배치, 배경 정리, 몸통과 팔의 실루엣 통일, 머리 레이어 정리, 실제 조립과 회전 검사가 필요하다. 한 덩어리 팔·다리만으로는 팔꿈치·무릎 굽힘의 표현도 제한된다. 이는 컷아웃 방식 전체의 한계라기보다 이번 부품 분할 및 자동 생성 결과의 한계다.

## 생성 프롬프트와 반복 기록

레퍼런스 역할은 매번 동일하게 지정했다. scene_A는 승인 화풍, A_paper_refined는 왼쪽 초보자 소녀의 정체성 참고다. 배경이나 다른 캐릭터를 옮기지 않도록 했다.

프롬프트의 한국어 요지:

- 1536×1536, 순수 #FF00FF 불투명 배경, 보이지 않는 384×384의 4×4 셀.
- 오른쪽을 보는 3/4 시점, 갈색 굵은 외곽선, 파스텔 평면색, 그림자는 색당 한 단계, 질감·그라데이션·문자·격자·바닥 그림자 금지.
- 조립 시 640 px, 머리 폭 250 px를 기준으로 한 배율. 몸통 약 175×205, 팔 70×210, 다리 80×225. 장식은 셀을 채우도록 확대하지 않기.
- 셀 0~15에 민머리, 앞머리, 뒷머리, 초보자 몸통, 초보자 앞팔·뒷팔, 앞다리·뒷다리, 검사 몸통·팔, 왼쪽 손잡이의 수평 단검·검, 새싹, 별 머리핀, 베레모, 단검을 든 완성 참고도를 지정.
- 모든 부품은 닫힌 윤곽과 칠해진 숨은 겹침 영역을 갖추기. 몸통에 팔을 포함하지 않기. 의상 교체 몸통과 팔의 모양·크기·관절 위치를 일치시키기.
- 셀 15에 한해 물리적 치수 충돌 때문에 50% 축소한 높이 320 px로 요청.
- 마지막 수정에서는 셀 중심 좌표와 경계 여백을 명시하고 검의 왼쪽 침범, 뒷머리의 중복 아호게, 앞머리의 귀, 배경색 변동을 구체적으로 수정 요청.

| 회차 | 요청 및 관찰 |
|---|---|
| 1차 | 상세한 셀별 사양과 두 원본 레퍼런스로 생성. 정체성은 읽히지만 큰 부품, 몸통 소매, 셀 침범, 1254 px 출력 확인. |
| 2차 | 1차 이미지를 추가 참조해 크기·여백·민소매 몸통·평면색 교정 요청. 주요 결함 지속. |
| 3차 | 원본 두 장만 사용하고 사양을 짧게 다시 구성. 몸통이 개선됐지만 뒷머리에 아호게가 중복되고 검의 셀 침범과 배경색 변동 지속. |
| 4차 | 3차 이미지를 추가 참조해 셀 중심·절대 치수·순수 배경색·머리 레이어를 재지정. 뒷머리 중복 아호게는 개선됐으나 정밀 조건 실패. 허용된 재생성 3회를 소진하여 이 결과를 시험 자료로 보존. |

### 최종 도구 입력 원문

아래는 마지막 생성에 실제 사용한 영어 프롬프트다. 위 한국어 요지와 검수 판정을 함께 보아야 하며, 이 프롬프트가 출력에서 충족됐다는 뜻은 아니다.

```text
Create a square 1536×1536 PNG sprite rig sheet on exact solid #FF00FF. Use attached images ONLY to match white-haired novice girl's identity and flat pastel cartoon style: bold dark brown outline, thin interior lines, one flat shadow, NO gradients or texture anywhere. All assets face right in 3/4 view. No words, lines, frames, numbers, shadows on background. ONE invisible 4×4 grid with 384px cells. Every item fully inside its own cell, generous magenta margin. Do not fill every cell with equally large icons: use the PIXEL DIMENSIONS below to preserve a common assembly scale. This is technical cut-out artwork, not a decorative icon set.
Part details by rows, left to right:
Row 1: [0] Complete bald head skin, ears, neck stub bottom-centre, smug face, dark blue eyes, head 250px wide. [1] Cream bob FRONT bangs+side locks+ahoge, no skin or ears, 275w×280h. [2] Cream bob BACK hair solid closed volume, no face or front bangs, 270w×240h. [3] SLEEVELESS tan novice torso ONLY, shoulder patch on torso itself, belt, tunic skirt to hips, 175w×205h. NO sleeves, no shorts, no arms.
Row 2: [4] Novice front arm as one complete closed piece from shoulder cap through tan short sleeve, forearm, brown cuff to fist with magenta grip hole. Straight down, 70w×210h. [5] Same arm in darker tones, exactly same 70w×210h shape. [6] Front leg with shorts, skin, sock and brown boot pointing right, closed hip cap at top, 80w×225h. [7] Identical leg in darker tones, 80w×225h.
Row 3: [8] SLEEVELESS steel-blue swordsman torso with silver breastplate and red sash, 175w×205h, EXACT SAME silhouette and joint locations as torso 3. [9] Swordsman arm with blue sleeve and small silver pauldron, shape and length exactly same as arm 4, 70w×210h, fist with grip hole. [10] Horizontal dagger 170px long, handle LEFT, blade RIGHT. [11] Horizontal sword 315px long, handle LEFT, blade RIGHT. Both weapon handles same thickness as fist holes.
Row 4: [12] Small two-leaf sprout on short stem, 110w×90h. [13] Small star gem hairpin on crossed clips, 85w×65h. [14] Tilted soft tan beret 255w×150h, sized for full-scale head. [15] Assembled novice girl standing idle holding dagger, same design as individual parts, no headgear, 320px high and bare head 125px wide. This reference is intentionally at HALF the individual parts' scale so it fits its cell; full-size assembly would be 640 high and cannot fit 384px.
Every part has a complete closed contour and opaque painted overlaps for rotating joints. Hair layers consist of hair ONLY. Full-size assembly proportions: head width250, height640. Keep parts substantially SMALLER than their 384px cells. All 16 cells distinct and spaced. Exact canvas 1536 x 1536.
FINAL CORRECTION PASS. Third reference is the draft to fix. It has incorrect spacing, size and part construction. Use true flat digital fills, NOT simulated painted colour. Empty background MUST be numerically RGB 255,0,255 throughout, not approximate magenta. Output EXACTLY 1536px square. Centre each object's bounding box on its exact cell centre (192,192),(576,192),(960,192),(1344,192); next row y576, next y960, final y1344. Object bounding boxes must never reach within 24 pixels of cell boundaries. Reduce front/back hair and move them up as needed to leave bottom margins; BACK HAIR MUST NOT HAVE AHOGE, only FRONT HAIR has ahoge. FRONT HAIR MUST NOT HAVE AN EAR OR SKIN, strictly cream hair. Dagger centre x960 y960 total length170; sword centre x1344 y960 total length315, so its handle begins AFTER x1186 and never spills left into dagger cell. Fully assembled character top MUST BE at y1184 or below and bottom no lower than1504; reference total height320. Preserve reference design, but all full-sized parts must be compatible with this exact reference at 2x. Make full-size head250wide. Torso3 and torso8 EXACT SAME 175x205 silhouette, no sleeve projections, no shorts, no legs. Swordsman sash must be RED. Arm length210, leg225. Paint round overlapping shoulder/hip caps. No gradient, lighting variation, texture or gloss on any object. Use sharply bounded flat colour shadow patches only. Prioritize correct separable assets, correct scale, and strict cell containment.
```

