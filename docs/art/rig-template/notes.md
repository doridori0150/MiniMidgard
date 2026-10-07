# 리그 v2 생성 및 검수 기록

## 결과와 판정

내장 image_gen 도구로 Novice 3회, Swordsman 2회 생성했다. Novice의 세 번째 결과와 이를 참조해 의상만 변경하고 견갑 위치를 수정한 Swordsman 두 번째 결과를 저장했다.

- `novice.png`: 1024×1024 RGB PNG.
- `swordsman.png`: 1024×1024 RGB PNG.
- 도구 원본은 1254×1254여서 macOS sips로 1024×1024 크기만 변환했다. 신체 위치 보정, 배경색 치환, 합성은 하지 않았다.
- **요청 완전 충족 아님 / 고정 관절 리그용 최종 승인 보류.** 재생성 후에도 머리·어깨·주먹 위치 오차, 미세한 배경색 변화, 재질 내부의 부드러운 음영이 남았다. 아래 수치를 확인한 뒤 사용해야 한다.
- 템플릿·기존 디자인·코드 등 다른 프로젝트 파일은 수정하지 않았다.

## 관절 위치 검수

최종 1024×1024 이미지 기준. 좌상단 원점, x는 오른쪽, y는 아래쪽이다. Δ는 생성 이미지 위치에서 템플릿 위치를 뺀 값이다. 관절 표식이 없는 일러스트이므로 신체 내부 회전 중심은 육안 추정이며 약 ±10~15px 불확실성이 있다. 발 위치는 부츠 밑창 중앙 부근을 기준으로 추정했다. 실제 분리 부품의 회전축을 측정한 값은 아니다.

| 지점 | 템플릿 (x,y) | Novice 추정 | Δ (px) | Swordsman 추정 | Δ (px) |
|---|---|---|---|---|---|
| 목 | (512,448) | (516,404) | (+4,-44) | (516,404) | (+4,-44) |
| 뒤 어깨 B / 화면 왼쪽 | (418,482) | (444,450) | (+26,-32) | (448,447) | (+30,-35) |
| 앞 어깨 F / 화면 오른쪽 | (600,478) | (593,449) | (-7,-29) | (595,443) | (-5,-35) |
| 뒤 주먹 B | (352,700) | (353,670) | (+1,-30) | (353,670) | (+1,-30) |
| 앞 주먹 F | (668,700) | (678,670) | (+10,-30) | (678,670) | (+10,-30) |
| 뒤 고관절 B / 옷 아래 추정 | (462,660) | (474,636) | (+12,-24) | (474,636) | (+12,-24) |
| 앞 고관절 F / 옷 아래 추정 | (560,660) | (570,636) | (+10,-24) | (570,636) | (+10,-24) |
| 뒤 발 B / 밑창 중앙 | (430,960) | (415,961) | (-15,+1) | (415,961) | (-15,+1) |
| 앞 발 F / 밑창 중앙 | (600,960) | (645,961) | (+45,+1) | (645,961) | (+45,+1) |

### 머리·자세·디자인

- 두 이미지 머리/머리카락 범위는 대략 x306~694, y34~416이다. 목표 타원 x310~730, y60~448에 비해 위쪽으로 치우치고 오른쪽 볼륨이 부족하다. 턱은 약 y388로 목 표식 바로 위에 오지 않는다.
- 밑창 최하단은 약 y970으로 목표 지면 y968과 약 +2px 차이다. 전체 높이는 약 936px로 목표 약 908px보다 크다.
- 두 팔은 펴져 있고 손은 비어 있으며, 몸통과 팔 사이 및 양다리 사이에 배경 틈이 보인다. 왼팔의 바깥 기울기는 목표보다 다소 크다.
- 머리카락은 어깨 부근에 가까우나 팔 전체를 가리지는 않는다. 어깨 연결부 근처에서 머리와 옷의 윤곽이 맞닿는 부분은 분리 시 주의가 필요하다.
- 고관절 표식 y660까지 Novice 튜닉이 충분히 덮이지 않는다. 짧은 바지와의 경계는 보이지만 템플릿 절단 위치와 일치하지 않는다.
- 크림색 단발·아호게, 파란 눈, 자신만만한 표정, 갈색 장갑과 부츠는 두 결과에서 육안상 거의 동일하다. 픽셀 단위 동일성은 보증하지 않는다.
- Swordsman은 청색 튜닉/소매, 은색 흉갑, 붉은 띠를 갖추었다. 첫 결과의 잘못된 왼쪽 견갑을 재생성으로 화면 오른쪽 견갑으로 수정했다.
- 굵은 갈색 외곽선과 단순한 얼굴은 참조에 가깝지만, 완전한 단색+한 단계 그림자 대신 미세한 그라데이션/질감이 남아 있다. 뒤팔만 확실히 어두운 표현도 충분하지 않다.
- 템플릿 선, 점, 글자, 무기, 지면 그림자는 보이지 않는다.

### 배경색 실측

PNG를 읽어 픽셀 값을 검사했다. 배경은 육안으로 마젠타지만 **균일한 순수 #FF00FF 조건을 충족하지 않는다.**

- Novice 전체 최빈 RGB: (252,3,250), 즉 #FC03FA. 166,229픽셀.
- Swordsman 전체 최빈 RGB: (251,3,250), 즉 #FB03FA. 184,282픽셀.
- 캐릭터가 없는 바깥 영역(x<250 또는 x>800 또는 y>990)에서도 각각 230종, 246종의 RGB가 검출되었다.
- 따라서 #FF00FF 완전 일치만으로 배경을 제거하는 파이프라인에 바로 투입하면 안 된다.

## 사용 프롬프트 원문

아래는 실제 도구에 전달한 영어 프롬프트다. 참조 순서는 각 프롬프트의 설명 및 아래 기록을 따른다.

### Novice 1차
참조: template.png → scene_A.png → rig_novice_v1.png. 머리·어깨가 위로 치우쳐 재생성했다.

```text
Use case: stylized-concept. Create ONE full-body 2D cut-out-rig game character, exactly 1024x1024 pixels.
Input 1 template.png is the STRICT placement/pose reference. Input 2 scene_A.png is the approved character-art style. Input 3 rig_novice_v1.png is the character design reference, specifically the assembled white-cream-haired Novice girl in the bottom right, not the parts sheet.
Draw the novice girl directly matching the template silhouette and joint locations. Output only the finished character on absolutely solid pure magenta RGB(255,0,255), #FF00FF. Remove every grid line, joint dot, label, green ground line and template shape. No ground shadow. No weapon or props. No other character. NOT a parts sheet.
STYLE: exactly the simple character art from scene_A: flat colors, just one hard-edged flat shadow tone per material, thick dark-brown external contour, thinner internal lines. No gradients, texture, glow, realistic lighting. Big expressive face, about three heads tall.
DESIGN: white-cream bob haircut with ahoge, blue eyes, determined smug small smile, tan tunic with brown belt and patched short sleeve, brown shorts, brown fingerless gloves and brown boots. Hair ends strictly ABOVE shoulder joints, leaving arms visible.
EXACT 1024x1024 COORDINATES from top-left:
Head including all hair and ahoge fills ellipse bounding box x310..730, y60..448; chin just above neck (512,448). Hair crown/ahoge at y60. Do not shrink head or body.
Back/left shoulder pivot (418,482); front/right shoulder pivot (600,478).
Back/left empty closed fist center (352,700); front/right empty closed fist center (668,700).
Back/left hip pivot (462,660); front/right hip pivot (560,660), covered by tunic hem near y700.
Back/left foot marker (430,960); front/right foot marker (600,960). Boot soles exactly at y968 on invisible baseline.
VIEW: three-quarter facing viewer's right. Viewer-right arm is front arm; viewer-left back arm slightly darker.
POSE: BOTH arms straight and relaxed pointing down/outward about 20 degrees from torso, from shoulder dots toward fist dots. No bent elbows, no hand on hip. Arms MUST have a visible magenta gap separating them from torso below the shoulder connections. Hands must not touch torso. Shoulder connections only may meet torso. Body narrowed enough to ensure arm clearance. Slight A-stance legs from hip dots to foot dots, with clear magenta gap between legs; do not shorten legs. Boots point right.
Character overall ~908 pixels high spanning y60..968. Keep crisp separate shape boundaries where shoulder sleeve joins torso, neck joins head, legs emerge under hem; suitable for later cutting and rotating body parts. Match the template positioning precisely, not the reference girl's combat pose. Output exactly 1024x1024.
```

### Novice 2차
참조: Novice 1차 생성 원본 → template.png → scene_A.png. 배치 오차가 남아 재생성했다.

```text
Use case: identity-preserve. Correct the first image (Novice render) using the second image (1024x1024 rig template) as exact placement target and third image (scene_A) as flat character style reference. Output ONE square image, exactly 1024x1024 pixels, single full-body novice girl on pure flat RGB(255,0,255) background.
Preserve her cream bob and ahoge, blue eyes, smug determined face, tan patched tunic, belt, shorts, fingerless gloves, boots and 3/4 facing right. Make the following precise placement corrections relative to the first render, measuring all coordinates on a 1024x1024 canvas: head top is currently near y25 and must move to y60; chin currently near y393 must be at y435, neck at (512,448). Fit entire hair+head into x310..730,y60..445 and END hair above shoulders. Shoulders are currently too high and must be at back/left(418,482), front/right(600,478). Fist centers must be back/left(352,700), front/right(668,700). Use straight arms with NO bent elbows, angled down/out ~20 degrees. Magenta gaps between each arm and torso except shoulder joint. Hips at (462,660),(560,660), tunic hem y700 covers hips. Slight A stance legs with visible gap, back boot contact centered around (430,960), front around (600,960); soles y968, not y978. Match the actual template silhouette EXACTLY. Do not draw its marks, grid, text, colored dots, baseline, or ground shadows.
Style correction: REMOVE all gradients, mottling and paper texture from the first render. Simple SOLID flat-color regions with ONE hard-edged flat shadow region per material, dark-brown thick outer lines and thinner inner lines, as in scene_A's character art. Back arm slightly darker. No props, no weapons, no holes in closed fists. Native 1024x1024 output requested.
```

### Novice 3차 — 저장본
참조: template.png → 1024×1024로 축소한 Novice 2차 검수본 → scene_A.png. 3회 시도 한도에서 종료했으며 정확 일치 판정은 하지 않았다.

```text
Use case: stylized-concept. Paint the character ON TOP OF IMAGE 1'S GREY MANNEQUIN, with exact tracing of its overall geometry. Image 1 is the mandatory canvas layout. Image 2 is design only; its anatomy placement is WRONG and must change. Image 3 is style. Single square 1024x1024 PNG on SOLID EXACT #FF00FF magenta. One whole Novice girl, no template lines, dots, text or shadows.
CRITICAL CORRECTION: in design image 2 the chin is at y390 but template demands y438. The shoulders at y445 must LOWER to y480. The fists at y668 must LOWER to y700. The head must get TALLER downwards, and the torso must be lower and SHORTER, with legs starting at y660. Preserve boot sole y968. Do NOT copy image 2's wrong head/body proportions. Follow image 1! Entire head + hair should cover the entire big grey ellipse from y60 through y445, x310 through730. Chin at (535,437), neck at (512,448). Cream bob ends above y455, ahoge at y60.
Shoulder pivot centers at left(418,482), right(600,478). Fists centers left(352,700), right(668,700). Straight arms splay downward just like template, separated from torso by magenta gap except shoulder join. Tunic extends down to y700 covering hip joints (462,660),(560,660). Legs slight A-stance with large visible gap, boots standing exactly at y968 at x430 and600.
Same cream bob with ahoge, blue eyes, determined smug face, tan belted patched-sleeve tunic, brown shorts, fingerless gloves, brown boots. Three-quarter right-facing. Left/back arm darker. Empty closed fists, no weapon.
Style exactly image 3 CHARACTER art: simple flat fills and a single solid shadow color, thick brown outer outline thinner inner lines. Absolutely NO gradient/shading transitions or paper texture.
Composition proportions expressed as percentages to avoid resolution confusion: top of hair 5.9% canvas height; chin42.7%; shoulders46.9%; fist centers68.36%; hips64.45%; boot soles94.53%. Head spans horizontally30.3%..71.3%. Back shoulder40.82%, front58.59%; fists34.38%,65.23%. Do not reframe or center/rebalance: trace the template layout.
```

### Swordsman 1차
참조: 저장된 novice.png → scene_A.png. 견갑이 화면 왼쪽에 생성되어 수정했다.

```text
Use case: identity-preserve. Edit IMAGE 1, the selected novice.png. Produce the SAME GIRL in Swordsman clothes. IMAGE 1 is the edit target and identity/pose lock. IMAGE 2 scene_A is the approved simple character illustration style.
CHANGE ONLY OUTFIT: steel-blue tunic, light silver breastplate, brown waist belt with a red sash hanging down over the tunic skirt, a small light-silver pauldron on the FRONT shoulder (viewer RIGHT), blue sleeves, brown boots. Keep brown fingerless gloves and empty closed fists. No sword, no shield, no other props. The back arm on viewer LEFT should be slightly darker.
PRESERVE all anatomy placement and the exact silhouette of face, hair, hands and legs from IMAGE 1. Absolutely identical white-cream bob, ahoge shape, blue eyes, determined smug smile, neck location, head size, body proportions, straight-arm A-pose, slight leg A-stance, right-facing three-quarter view. Do not shift, shrink, enlarge, recenter or rotate any body part. Boots remain at exactly the same locations and baseline. Hair ends above shoulders. Arms must remain separated from torso by visible magenta except right at shoulder joint. Legs remain separated by magenta gap. Maintain clean outlined boundaries at body part joins for cut-out rigging.
Final square 1024x1024 PNG, character on absolutely UNIFORM PURE MAGENTA RGB(255,0,255) #FF00FF. No template marks, grid, text, ground line or ground shadow.
Style: simple flat colored scene_A character art, thick dark-brown outer outlines and thinner inner lines. One solid flat shadow tone per material. No gradients, mottling, paper grain or texture. Preserve first image's character drawing exactly while changing clothing only.
```

### Swordsman 2차 — 저장본
참조: Swordsman 1차 생성 원본. 화면 오른쪽 견갑으로 변경했다.

```text
Use case: precise-object-edit. Edit this Swordsman image with ONE correction only. The silver pauldron is currently on the WRONG shoulder, on the LEFT side of the picture. MOVE the small silver pauldron to the RIGHT SIDE OF THE PICTURE, covering the blue shoulder cap on the arm that extends to the fist on the RIGHT. Remove the silver pauldron on the LEFT side of the picture and replace it with a plain steel-blue sleeve cap. Thus ONLY the arm on the RIGHT edge of the image has silver shoulder armor; the arm on the LEFT edge has NO silver armor. This is the character's front shoulder for this rig.
Everything else must remain pixel-aligned and visually unchanged: same cream bob/ahoge/head/face, neck, proportions, arm and leg pose, fists, breastplate, red sash, steel-blue tunic, brown gloves and boots, pure uniform #FF00FF background. Preserve all silhouette positions. One 1024x1024 square PNG. No props, text, shadows or template marks. Simple flat fills, one flat shadow tone, thick dark-brown outlines.
```

