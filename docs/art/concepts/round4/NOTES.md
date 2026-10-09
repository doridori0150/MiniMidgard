# 컨셉 라운드 4 — 쿠키

제작일: 2026-10-09  
요청서: `docs/art/CONCEPT_BRIEF_R4.md`  
제작 방식: 내장 `image_gen.imagegen`으로 원화·분리표·동작·숲·투명 인물 제작. Swift/AppKit은 필드 보드의 크기 조정, 합성, 글자 배치에만 사용했다.

## 결과물

| 방향 | 전신 원화 | 부위 분리표 | 휴대폰 필드 | 네 동작 |
|---|---|---|---|---|
| A · 동화풍 | [r4a_hero.png](r4a_hero.png) | [r4a_parts.png](r4a_parts.png) | [r4a_field.png](r4a_field.png) | [r4a_motion.png](r4a_motion.png) |
| B · 부드러운 사실풍 | [r4b_hero.png](r4b_hero.png) | [r4b_parts.png](r4b_parts.png) | [r4b_field.png](r4b_field.png) | [r4b_motion.png](r4b_motion.png) |

A는 약 4–4.5등신을 목표로 둥근 실루엣, 두꺼운 옷감, 풍부한 청색과 적색, 잎 문양 테두리와 둥근 버클을 사용했다. B는 약 6등신을 목표로 가는 체형, 긴 천 패널, 절제한 밝은 테두리, 별 형태의 갑옷 장식, 부드러운 빛을 사용했다. 등신은 머리카락 부피와 잔머리를 제외한 두개골 정수리–턱 기준의 시각적 근사치다.

두 방향 모두 어깨 길이의 밝은 크림/애시 금발, 잔머리 한 가닥, 파란 눈, 청색 튜닉, 밝은 은색 흉갑·견갑, 붉은 허리띠, 갈색 벨트·장갑·부츠, 흰 바지를 유지했다. 가는 유색 경계와 불투명한 붓 터치를 사용했다. 원화와 동작의 검은 가까운 쪽 오른손에 한 자루로 정리했다. 정면에 가까운 대기 포즈에서는 그 손이 화면 왼쪽 허리에 보이며, 타격 때 같은 팔이 화면 오른쪽으로 뻗는다.

## 파츠와 동작

각 파츠 보드는 얼굴만 있는 머리, 뒷머리, 앞머리, 몸통, 골반/치마, 상완 2개, 전완 2개, 손 2개, 허벅지 2개, 정강이+부츠 2개, 검의 **16개 파츠**를 보여 준다. 각 파츠의 주 연결 피벗은 작은 청록색 점으로 표시했다. 몸통에는 팔 아래에 가려질 어깨 연결면과 머리 아래에 가려질 목을 채웠고, 중복 견갑을 제거했다. 팔꿈치·손목·엉덩이·무릎 끝은 겹침에 사용할 재질색으로 마감했다. R/L 표기는 캐릭터의 신체 기준이다.

분리표는 동일한 디자인 원화를 참조해 생성 편집한 **분리 설계 시안**이다. 원화의 모든 픽셀을 그대로 절단한 레이어 파일은 아니며, 분리 과정에서 일부 붓 자국·장식·윤곽은 재해석되었다. 따라서 픽셀 동일 분할 또는 실제 뼈대 재조립의 무봉합 검증을 완료했다고 주장하지 않는다. 요청서의 다음 단계인 방향 선택 후에는 확정 원화의 실제 레이어 분리와 회전 시험이 필요하다. 이 점은 이번 결과의 제한이다.

모션 보드는 대기, 보행 접지, 공격 준비, 공격 타격 순서다. 보행의 앞발 뒤꿈치/뒷발 발끝, 준비의 뒤로 실린 체중, 타격의 전진 런지와 머리·허리띠의 지연을 서로 다르게 표현했다. 모션은 실제 리그를 재생해 캡처한 것이 아니라 이미지 생성으로 그린 네 키 포즈다.

## 휴대폰 크기와 권장 방향

**3인 영웅과 여러 몬스터가 함께 나오는 세로형 방치 RPG에는 A를 권장한다.** 큰 머리, 두꺼운 팔·다리, 짧은 튜닉과 강한 색 덩어리가 축소 시에도 남는다. 단점은 넓은 실루엣이 옆 캐릭터와 겹치기 쉬우며, 금색 문양은 작게 표시할 때 단순화가 필요하다는 점이다.

B는 성장한 기사, 캐릭터 상세 화면과 큰 연출에서 우아한 인상이 강하다. 다만 얇은 장식과 얼굴이 작아지면 빠르게 소실되어 필드에서 같은 정보량을 전달하려면 더 큰 표시 높이가 필요하다. 큰 캐릭터 세 명과 여러 적을 390px 폭 안에 배치하면 전후열의 간격 확보가 더 어렵다.

| 항목 | A | B |
|---|---|---|
| 이번 필드 표시 높이 | 144px | 168px |
| 권장 최소 높이 · 제작 판단 | 약 140px | 약 168px |
| 일반 전투 권장 범위 | 140–160px | 168–190px |
| 120px 비교 | 머리·갑옷·붉은 띠 구분 가능, 세부 문양 소실 | 실루엣과 색은 남지만 얼굴·장식 판독 약함 |
| 200px 비교 | 표정과 장식 감상에 여유 | 얼굴·천·갑옷 표현에 더 적합 |

높이는 잔머리 끝부터 부츠 밑창까지의 인물 영역을 기준으로 한다. 수치는 이번 정지 이미지를 직접 축소해 본 제작 판단이며 사용자 테스트 결과나 엔진 성능 측정값은 아니다. 120px은 하한 비교 표본이고, 권장 기본 크기로 고른 값은 아니다.

필드 보드 전체는 **930×960px**다. 왼쪽 `(32,80)`에 **390×844px의 실제 휴대폰 화면**이 있고, 오른쪽 별도 비교 패널에 **120px와 200px** 높이의 같은 인물을 넣었다. 화면 내부에는 숲, 쿠키, 단순화한 레인저·마법사 실루엣 두 명, 작은 슬라임 한 마리가 있다. 이 좌표는 PNG의 왼쪽 위 기준이다. 이미지를 100% 배율로 봐야 픽셀 크기를 비교할 수 있다.

별도 휴대폰 화면만 필요한 경우:
- [A · 390×844](sources/r4a_phone_390x844.png)
- [B · 390×844](sources/r4b_phone_390x844.png)

숲과 인물은 모두 이미지 생성 결과다. 인물의 투명 파생본은 배경 제거를 생성 편집한 결과이므로 고해상도에서는 원화와 미세한 얼굴·붓 터치 차이가 있다. 정확한 배치와 크기 산출은 [compose.swift](sources/compose.swift), [layout_metrics.json](sources/layout_metrics.json)에 남겼다. 알파 0.5 초과 영역의 경계로 자른 뒤 비율을 유지해 지정 높이로 축소했다.

## 직접 검수와 수정

8개 보드를 각각 눈으로 확인했다.

| 보드 | 확인한 내용 |
|---|---|
| A 원화 | 전신·검 끝 포함, 짧고 튼튼한 체형, 밝은 배경, 정체성 색상, 가까운 오른손 검 |
| B 원화 | 전신·검 끝 포함, A보다 가는 체형, 머리 비례 보정, 의상·머리색, 가까운 오른손 검 |
| A 파츠 | 16개 구성, 피벗 점, 얼굴과 머리카락 분리, 목·어깨 연결면, 몸통의 중복 견갑 제거 |
| B 파츠 | 16개 구성, 목 연결면 보완, 몸통 견갑 제거, 전완 피벗을 팔꿈치 쪽으로 수정 |
| A 필드 | 실제 390×844 화면, 영웅 144px, 두 동료와 슬라임, 120/200px 비교, 글자 겹침 없음 |
| B 필드 | 실제 390×844 화면, 영웅 168px, 두 동료와 슬라임, 120/200px 비교, 글자 겹침 없음 |
| A 동작 | 네 포즈 구분, 같은 의상, 모든 포즈에서 가까운 오른손의 단일 검 |
| B 동작 | 네 포즈 구분, 대기의 중복 검 제거, 오른손 일관성, 원화와 머리 비례 조정 |

초기 생성에서 길어진 등신, 파츠 몸통에 남은 중복 어깨 갑옷, B의 목 누락, 모션에서 바뀐 검 손과 중복 검을 발견해 해당 부분을 재생성·수정했다. 수정 후 다시 확인했다.

작업 파일은 이 `round4/` 폴더에만 작성했다. 게임 소스, 다른 문서 및 다른 아트는 수정하지 않았고, 커밋·푸시하지 않았다. 내장 생성 도구의 자동 저장 원본은 도구 기본 위치에 남아 있고, 사용 결과는 이 폴더로 복사했다.

## 실제 사용 프롬프트

[ PROMPTS.json ](PROMPTS.json)에 26회의 실제 생성·수정 호출을 기록했다. 최초 시안과 비례·관절·무기 보정도 포함한다. `selected`는 해당 호출 결과가 최종 그림 또는 합성 소스로 선택되었는지를 뜻한다. 아래는 같은 프롬프트 원문이며, 외부 회사·게임 이름은 사용하지 않았다. 병렬 호출은 읽기 쉽도록 의존 관계 순서로 정리했다.

<details>
<summary>1. heroA — 중간 시안 / 수정 입력 — r4a_hero.png</summary>

```text
Use case: stylized-concept. Original IP concept art for a phone idle RPG. Rich hand-painted high-resolution 2D cut-out/bone-animation game illustration: visible soft pigment brushwork, layered color and shadow, thin variable dark COLOURED contours, warm restrained rim light, matte natural skin, expressive natural face. European fantasy storybook mood, saturated harmonious colors. Never thick uniform black contours, never glossy airbrushed gacha/anime skin or sparkle eyes, never 3D, pixel art, flat vector or chibi. No existing franchise characters, costumes, logos, or assets. Character identity: Cookie, young adult female swordswoman, confident and kind, shoulder-length neutral cream/ash-blonde hair with one expressive stray ahoge-like lock, blue eyes; royal-blue tunic, light silver breastplate and two pauldrons, red waist sash, brown leather belt, gloves and boots, white trousers. One-handed sword held in the near anatomical RIGHT hand. Camera sees her right side, character faces screen RIGHT in 3/4 view. Costume panels, locks of hair and limb overlaps suitable for cutout rigging.
Direction A "storybook": exactly about 4.5 heads tall (head including cranium about 22% of anatomical full height), rounder sturdy forms, compact heroic legs, bold rich color, thick heavy fabric, ornamented stitched ivory-gold trims. Adult face, not a toddler or superdeformed chibi. Broad rounded pauldrons, short split blue tunic with simple wheat-vine border, small round belt buckle, red sash knot and tails at back. Cream hair with thick flowing painted locks.
Asset: r4a_hero.png. A SINGLE full-body master character painting, portrait canvas, 1024 pixels tall or greater, clean plain pale warm ivory background. Standing ready, balanced slightly separated feet, relaxed ready sword held in her near RIGHT hand angled diagonally toward screen right and down with entire blade visible. Full hair, feet, blade and sash within margins. No other figures, no inset, no typography, no furniture or ground scene. Figure fills 83-87% of canvas height. Paint all visible costume details thoughtfully. Make shoulder-length hair, facial blue eyes, brown gloves and white trousers unmistakable.
```

</details>

<details>
<summary>2. heroB — 중간 시안 / 수정 입력 — r4b_hero.png</summary>

```text
Use case: stylized-concept. Original IP concept art for a phone idle RPG. Rich hand-painted high-resolution 2D cut-out/bone-animation game illustration: visible soft pigment brushwork, layered color and shadow, thin variable dark COLOURED contours, warm restrained rim light, matte natural skin, expressive natural face. European fantasy storybook mood, saturated harmonious colors. Never thick uniform black contours, never glossy airbrushed gacha/anime skin or sparkle eyes, never 3D, pixel art, flat vector or chibi. No existing franchise characters, costumes, logos, or assets. Character identity: Cookie, young adult female swordswoman, confident and kind, shoulder-length neutral cream/ash-blonde hair with one expressive stray ahoge-like lock, blue eyes; royal-blue tunic, light silver breastplate and two pauldrons, red waist sash, brown leather belt, gloves and boots, white trousers. One-handed sword held in the near anatomical RIGHT hand. Camera sees her right side, character faces screen RIGHT in 3/4 view. Costume panels, locks of hair and limb overlaps suitable for cutout rigging.
Direction B "soft realism": exactly about 6 heads tall (head including cranium about 16.7% of anatomical full height), slimmer elegant proportions, softer airy diffuse light, delicate restrained detail. Adult natural face. Slim gently pointed pauldrons, fitted blue tunic with divided tapering cloth tails and fine ivory piping, narrow brown belt with an oval clasp, soft narrow red waist sash trailing at back. Airy locks of neutral ash-blonde hair.
Asset: r4b_hero.png. A SINGLE full-body master character painting, portrait canvas, 1024 pixels tall or greater, clean plain pale warm ivory background. Standing ready, balanced slightly separated feet, relaxed ready sword held in her near RIGHT hand angled diagonally toward screen right and down with entire blade visible. Full hair, feet, blade and sash within margins. No other figures, no inset, no typography, no furniture or ground scene. Figure fills 83-87% of canvas height. Paint all visible costume details thoughtfully. Make shoulder-length hair, facial blue eyes, brown gloves and white trousers unmistakable.
```

</details>

<details>
<summary>3. heroA_proportion_fix — 중간 시안 / 수정 입력 — r4a_hero.png</summary>

```text
Edit the supplied original character painting. Use case: stylized-concept. Original IP concept art for a phone idle RPG. Rich hand-painted high-resolution 2D cut-out/bone-animation game illustration: visible soft pigment brushwork, layered color and shadow, thin variable dark COLOURED contours, warm restrained rim light, matte natural skin, expressive natural face. European fantasy storybook mood, saturated harmonious colors. Never thick uniform black contours, never glossy airbrushed gacha/anime skin or sparkle eyes, never 3D, pixel art, flat vector or chibi. No existing franchise characters, costumes, logos, or assets. Character identity: Cookie, young adult female swordswoman, confident and kind, shoulder-length neutral cream/ash-blonde hair with one expressive stray ahoge-like lock, blue eyes; royal-blue tunic, light silver breastplate and two pauldrons, red waist sash, brown leather belt, gloves and boots, white trousers. One-handed sword held in the near anatomical RIGHT hand. Camera sees her right side, character faces screen RIGHT in 3/4 view. Costume panels, locks of hair and limb overlaps suitable for cutout rigging.
Direction A "storybook": exactly about 4.5 heads tall (head including cranium about 22% of anatomical full height), rounder sturdy forms, compact heroic legs, bold rich color, thick heavy fabric, ornamented stitched ivory-gold trims. Adult face, not a toddler or superdeformed chibi. Broad rounded pauldrons, short split blue tunic with simple wheat-vine border, small round belt buckle, red sash knot and tails at back. Cream hair with thick flowing painted locks.
CRITICAL CORRECTION: source is too tall, approximately seven heads tall. Rebuild proportions to 4.5 heads tall: head crown to chin must be 22% of crown-to-sole height; enlarge head substantially, shorten thighs and shins and shorten torso, widen sturdy body and boots. This is a squat adult storybook heroine with a mature kind face, not a child, with chunky rounded forms.
Preserve the original costume design, near anatomical right-hand sword, 3/4 facing screen right, shoulder-length light neutral hair, blue eyes, all specified colors and ready pose. Push the finish toward hand-painted gouache: visible broad soft strokes and layered matte pigment, less slick digital detail. Plain warm light background. Full body and entire blade within margins, portrait high-resolution character-only master painting. No text, no grid, no extra views.
```

</details>

<details>
<summary>4. heroB_proportion_fix — 중간 시안 / 수정 입력 — r4b_hero.png</summary>

```text
Edit the supplied original character painting. Use case: stylized-concept. Original IP concept art for a phone idle RPG. Rich hand-painted high-resolution 2D cut-out/bone-animation game illustration: visible soft pigment brushwork, layered color and shadow, thin variable dark COLOURED contours, warm restrained rim light, matte natural skin, expressive natural face. European fantasy storybook mood, saturated harmonious colors. Never thick uniform black contours, never glossy airbrushed gacha/anime skin or sparkle eyes, never 3D, pixel art, flat vector or chibi. No existing franchise characters, costumes, logos, or assets. Character identity: Cookie, young adult female swordswoman, confident and kind, shoulder-length neutral cream/ash-blonde hair with one expressive stray ahoge-like lock, blue eyes; royal-blue tunic, light silver breastplate and two pauldrons, red waist sash, brown leather belt, gloves and boots, white trousers. One-handed sword held in the near anatomical RIGHT hand. Camera sees her right side, character faces screen RIGHT in 3/4 view. Costume panels, locks of hair and limb overlaps suitable for cutout rigging.
Direction B "soft realism": exactly about 6 heads tall (head including cranium about 16.7% of anatomical full height), slimmer elegant proportions, softer airy diffuse light, delicate restrained detail. Adult natural face. Slim gently pointed pauldrons, fitted blue tunic with divided tapering cloth tails and fine ivory piping, narrow brown belt with an oval clasp, soft narrow red waist sash trailing at back. Airy locks of neutral ash-blonde hair.
CRITICAL CORRECTION: source is too tall, approximately seven heads tall. Rebuild proportions to 6 heads tall: crown to chin must be 1/6 of crown-to-sole height; enlarge the head by about 18% relative to body and shorten legs a little, retaining elegant slender adult build.
Preserve the original costume design, near anatomical right-hand sword, 3/4 facing screen right, shoulder-length light neutral hair, blue eyes, all specified colors and ready pose. Push the finish toward hand-painted gouache: visible broad soft strokes and layered matte pigment, less slick digital detail. Plain warm light background. Full body and entire blade within margins, portrait high-resolution character-only master painting. No text, no grid, no extra views.
```

</details>

<details>
<summary>5. heroA_final_proportions — 중간 시안 / 수정 입력 — r4a_hero.png</summary>

```text
Use case: stylized-concept. Paint a full-body ORIGINAL young adult female swordswoman for a hand-painted 2D storybook game. Very compact FOUR AND A HALF HEADS TALL stylized adult anatomy: BIG expressive head, SHORT broad torso, SHORT thick thighs and calves, chunky boots, sturdy round shapes. Total figure = head + only 3.5 head lengths beneath the chin. Head is almost as wide as the chest. Not realistic human proportions. Not tall. Strongly stylized miniature adventure heroine; adult facial features, not a baby. On a 1024x1536 canvas, head crown around y=220, chin y=460, belt y=760, knees y=1040 and soles y=1300.
Shoulder-length cream/ash-blonde neutral light hair with one curved stray lock, BLUE eyes, kind confident natural face. She stands ready full body in 3/4 view facing screen RIGHT, sword in near anatomical RIGHT hand, blade points screen right-down. Costume: blue tunic, light silver breastplate with pauldrons, red sash, brown belt gloves boots, white trousers. Heavy blue fabric, round pauldrons with wheat-leaf engraving, gold-ivory wheat-leaf ornamented short tunic trims, round sun buckle, heavy red sash. Bold rich cobalt and crimson.
VISIBLE MATTE GOUACHE BRUSHWORK, soft chunky painted strokes and layered pigments, warm rim light, fine variable dark colored lines, flowing locks. Natural expressive face, no plastic skin, no airbrushed gloss, no sparkling anime eyes, no 3D, no pixel art, NO thick black outlines, no flat vector. Entire figure and sword within plain warm ivory portrait canvas. Character only, no text or scale lines. At least 1024px tall. Do not name or copy any existing game or studio.
```

</details>

<details>
<summary>6. heroB_final_proportions — 중간 시안 / 수정 입력 — r4b_hero.png</summary>

```text
Use case: stylized-concept. Paint a full-body ORIGINAL young adult female swordswoman for a hand-painted 2D storybook game. SIX HEADS TALL elegant stylized adult anatomy, moderately large expressive head, slim body but intentionally shorter legs than fashion illustration. Total figure = head + exactly five head lengths beneath chin. On 1024x1536 canvas: crown y=180, chin y=390, waist y=680, knees y=1090, soles y=1440.
Shoulder-length cream/ash-blonde neutral light hair with one curved stray lock, BLUE eyes, kind confident natural face. She stands ready full body in 3/4 view facing screen RIGHT, sword in near anatomical RIGHT hand, blade points screen right-down. Costume: blue tunic, light silver breastplate with pauldrons, red sash, brown belt gloves boots, white trousers. Thin elegant blue tunic panels with delicate ivory piping, gently pointed pauldrons with modest star motif, oval leaf buckle, narrow flowing red sash. Soft airy light and muted harmonious royal blue.
VISIBLE MATTE GOUACHE BRUSHWORK, soft chunky painted strokes and layered pigments, warm rim light, fine variable dark colored lines, flowing locks. Natural expressive face, no plastic skin, no airbrushed gloss, no sparkling anime eyes, no 3D, no pixel art, NO thick black outlines, no flat vector. Entire figure and sword within plain warm ivory portrait canvas. Character only, no text or scale lines. At least 1024px tall. Do not name or copy any existing game or studio.
```

</details>

<details>
<summary>7. heroA_shorten_body — 중간 시안 / 수정 입력 — r4a_hero.png</summary>

```text
Edit this painting ONLY to correct body proportions. Preserve head and hair at EXACTLY the same size, face identity, costume painting, brush texture and right-facing pose. The figure BELOW THE CHIN MUST BECOME 35% SHORTER: compress torso, arms and both legs vertically to 65% of their current height. Do NOT shrink the head. Final character is squat, short, sturdy, exactly 4 to 4.5 head lengths from crown to sole, NOT six or seven heads. Head remains large, mature young adult face. Short stout thighs and boots. Keep the sword in the same near anatomical right hand. All design and palette unchanged. Place the compact resulting full-body figure centrally on a plain light portrait background. Do not stretch it tall again to fill the canvas. Rich matte hand-painted 2D, no text.
```

</details>

<details>
<summary>8. heroB_shorten_body — 중간 시안 / 수정 입력 — r4b_hero.png</summary>

```text
Edit this painting ONLY to correct body proportions. Preserve the head, hair, face identity, shoulders, torso, arms, costume design, palette and visible matte brushwork. Shorten BOTH legs below the waist by 30%, especially long boots and thighs, and enlarge head plus hair uniformly by 15% relative to torso. Final slender adult heroine should stand approximately SIX head lengths crown-to-sole, not eight. Keep elegant natural forms, white trousers, brown boots and sword in same near anatomical RIGHT hand. 3/4 facing screen right, full-body on plain light portrait background. Do not stretch her tall again to fill canvas. No text.
```

</details>

<details>
<summary>9. partsA — 중간 시안 / 수정 입력 — r4a_parts.png</summary>

```text
Use case: stylized-concept. Transform the supplied MASTER PAINTING into an exploded cut-out parts sheet of THE SAME PAINTING, not a redesigned character. Preserve original painted contours, colors, face, embroidery and brush marks wherever visible. Separate every piece with generous whitespace, never overlap pieces. 4 by 4 orderly grid, pale ivory background, 16 parts EXACTLY, labels in small restrained legible type. Read rows left to right:
Row1: "01 FACE" = head/face/ears ONLY with NO HAIR; "02 HAIR BACK" = complete back-hair mass; "03 HAIR FRONT" = front bangs with stray lock; "04 TORSO" = chest armor, tunic upper body, COMPLETE neck painted to under chin, shoulder sockets under removed arms painted in.
Row2: "05 PELVIS" = belt/red sash/blue skirt panels with hips painted under cloth; "06 UPPER ARM R" = near/right upper arm with pauldron; "07 UPPER ARM L" = far/left upper arm with pauldron; "08 FOREARM R" = near/right forearm wristless, without hand.
Row3: "09 FOREARM L" = far/left forearm without hand; "10 HAND R" = near/right brown glove gripping an EMPTY opening, NO sword attached; "11 HAND L" = far/left brown glove, NO forearm attached; "12 THIGH R" = white trouser thigh near/right, without shin.
Row4: "13 THIGH L" = white trouser thigh far/left; "14 SHIN + BOOT R" = entire near/right lower leg and brown boot; "15 SHIN + BOOT L" = entire far/left lower leg and boot; "16 SWORD" = full original blade, guard and handle, no glove.
All hidden overlap ends fully painted with rounded caps in matching materials: shoulder under arm, neck under hair, elbow/wrist/hip/knee. Do not leave white holes in pieces. Mark EACH of all sixteen parts with one SMALL CYAN DOT at its primary joint pivot (face and hair at neck/root attachment; torso near waist; pelvis center; arms shoulders/elbows/wrists; legs hip/knee; sword grip). A little dot, not large circles. All limbs separated, all pairs complete, all parts entirely in frame. Keep exact character design and original proportions. High-resolution landscape technical art board. No decorative extra figures. Hand-painted game art.
Direction A: Direction A "storybook": exactly about 4.5 heads tall (head including cranium about 22% of anatomical full height), rounder sturdy forms, compact heroic legs, bold rich color, thick heavy fabric, ornamented stitched ivory-gold trims. Adult face, not a toddler or superdeformed chibi. Broad rounded pauldrons, short split blue tunic with simple wheat-vine border, small round belt buckle, red sash knot and tails at back. Cream hair with thick flowing painted locks.. The supplied master image controls ALL design details, do not invent replacements.
```

</details>

<details>
<summary>10. partsB — 중간 시안 / 수정 입력 — r4b_parts.png</summary>

```text
Use case: stylized-concept. Transform the supplied MASTER PAINTING into an exploded cut-out parts sheet of THE SAME PAINTING, not a redesigned character. Preserve original painted contours, colors, face, embroidery and brush marks wherever visible. Separate every piece with generous whitespace, never overlap pieces. 4 by 4 orderly grid, pale ivory background, 16 parts EXACTLY, labels in small restrained legible type. Read rows left to right:
Row1: "01 FACE" = head/face/ears ONLY with NO HAIR; "02 HAIR BACK" = complete back-hair mass; "03 HAIR FRONT" = front bangs with stray lock; "04 TORSO" = chest armor, tunic upper body, COMPLETE neck painted to under chin, shoulder sockets under removed arms painted in.
Row2: "05 PELVIS" = belt/red sash/blue skirt panels with hips painted under cloth; "06 UPPER ARM R" = near/right upper arm with pauldron; "07 UPPER ARM L" = far/left upper arm with pauldron; "08 FOREARM R" = near/right forearm wristless, without hand.
Row3: "09 FOREARM L" = far/left forearm without hand; "10 HAND R" = near/right brown glove gripping an EMPTY opening, NO sword attached; "11 HAND L" = far/left brown glove, NO forearm attached; "12 THIGH R" = white trouser thigh near/right, without shin.
Row4: "13 THIGH L" = white trouser thigh far/left; "14 SHIN + BOOT R" = entire near/right lower leg and brown boot; "15 SHIN + BOOT L" = entire far/left lower leg and boot; "16 SWORD" = full original blade, guard and handle, no glove.
All hidden overlap ends fully painted with rounded caps in matching materials: shoulder under arm, neck under hair, elbow/wrist/hip/knee. Do not leave white holes in pieces. Mark EACH of all sixteen parts with one SMALL CYAN DOT at its primary joint pivot (face and hair at neck/root attachment; torso near waist; pelvis center; arms shoulders/elbows/wrists; legs hip/knee; sword grip). A little dot, not large circles. All limbs separated, all pairs complete, all parts entirely in frame. Keep exact character design and original proportions. High-resolution landscape technical art board. No decorative extra figures. Hand-painted game art.
Direction B: Direction B "soft realism": exactly about 6 heads tall (head including cranium about 16.7% of anatomical full height), slimmer elegant proportions, softer airy diffuse light, delicate restrained detail. Adult natural face. Slim gently pointed pauldrons, fitted blue tunic with divided tapering cloth tails and fine ivory piping, narrow brown belt with an oval clasp, soft narrow red waist sash trailing at back. Airy locks of neutral ash-blonde hair.. The supplied master image controls ALL design details, do not invent replacements.
```

</details>

<details>
<summary>11. motionA — 중간 시안 / 수정 입력 — r4a_motion.png</summary>

```text
Use case: stylized-concept. Create one landscape motion key-pose board from this exact master character painting. Preserve identity, proportions, shoulder-length neutral blonde hair, blue eyes, ALL costume panels/ornaments/buckle/armor/sash/boots, paint texture. FOUR full-body figures only, evenly spaced in four columns with generous blade clearance, light plain background, same scale. Left to right small captions exactly: "IDLE", "WALK CONTACT", "ATTACK WIND-UP", "ATTACK STRIKE". All face screen RIGHT in 3/4 game view with near anatomical RIGHT arm clearly visible. Sword ALWAYS in same NEAR RIGHT HAND, never pass it to far hand; far left hand open and not touching sword.
1 idle: relaxed planted feet, sword down-right.
2 walk contact: leading heel down in front toward right, rear toe behind left, opposing free-arm swing.
3 wind-up: weight back, bent knees, near right sword elbow folded raised near shoulder with blade swept up/back toward screen left, free far left arm balances low forward.
4 strike: strong forward lunge toward screen right, near right arm straightened forward in front of chest holding sword with entire blade extended right, far left arm trails behind, hair and sash lag to left.
No magic, no motion blur covering limbs, no extra limbs, no mirrored character, no duplicated swords, no cropped blade. Silhouette of each pose visibly distinct. These are riggable cutout-style articulated key poses, not four idle copies. Preserve matte hand-painted 2D style, fine colored contours, soft warm light.
Direction A "storybook": exactly about 4.5 heads tall (head including cranium about 22% of anatomical full height), rounder sturdy forms, compact heroic legs, bold rich color, thick heavy fabric, ornamented stitched ivory-gold trims. Adult face, not a toddler or superdeformed chibi. Broad rounded pauldrons, short split blue tunic with simple wheat-vine border, small round belt buckle, red sash knot and tails at back. Cream hair with thick flowing painted locks.. MASTER REFERENCE is authoritative, preserve its actual proportions.
```

</details>

<details>
<summary>12. motionB — 중간 시안 / 수정 입력 — r4b_motion.png</summary>

```text
Use case: stylized-concept. Create one landscape motion key-pose board from this exact master character painting. Preserve identity, proportions, shoulder-length neutral blonde hair, blue eyes, ALL costume panels/ornaments/buckle/armor/sash/boots, paint texture. FOUR full-body figures only, evenly spaced in four columns with generous blade clearance, light plain background, same scale. Left to right small captions exactly: "IDLE", "WALK CONTACT", "ATTACK WIND-UP", "ATTACK STRIKE". All face screen RIGHT in 3/4 game view with near anatomical RIGHT arm clearly visible. Sword ALWAYS in same NEAR RIGHT HAND, never pass it to far hand; far left hand open and not touching sword.
1 idle: relaxed planted feet, sword down-right.
2 walk contact: leading heel down in front toward right, rear toe behind left, opposing free-arm swing.
3 wind-up: weight back, bent knees, near right sword elbow folded raised near shoulder with blade swept up/back toward screen left, free far left arm balances low forward.
4 strike: strong forward lunge toward screen right, near right arm straightened forward in front of chest holding sword with entire blade extended right, far left arm trails behind, hair and sash lag to left.
No magic, no motion blur covering limbs, no extra limbs, no mirrored character, no duplicated swords, no cropped blade. Silhouette of each pose visibly distinct. These are riggable cutout-style articulated key poses, not four idle copies. Preserve matte hand-painted 2D style, fine colored contours, soft warm light.
Direction B "soft realism": exactly about 6 heads tall (head including cranium about 16.7% of anatomical full height), slimmer elegant proportions, softer airy diffuse light, delicate restrained detail. Adult natural face. Slim gently pointed pauldrons, fitted blue tunic with divided tapering cloth tails and fine ivory piping, narrow brown belt with an oval clasp, soft narrow red waist sash trailing at back. Airy locks of neutral ash-blonde hair.. MASTER REFERENCE is authoritative, preserve its actual proportions.
```

</details>

<details>
<summary>13. partsA_joint_fix — 최종 선택 — r4a_parts.png</summary>

```text
Edit this parts board, retaining all sixteen parts, their exact layout, captions, colors, textures, identities and blue pivot dots. Change ONLY cell 04 TORSO: REMOVE both pauldrons and ALL attached arms/sleeves from the torso (they already exist in cells 06/07); paint the underlying rounded blue-cloth shoulder sockets as smooth solid overlapping caps with no holes. Paint a FULL natural skin-colored neck extending up out of the tunic collar under the head/hair, with solid rounded top and no open hole. Torso must contain chest armor, blue upper tunic, neck and covered shoulder sockets only, no arms or pauldrons. Keep its waist pivot dot.  Everything else unchanged. Preserve the same hand-painted 2D source artwork, no new characters.
```

</details>

<details>
<summary>14. partsB_joint_fix — 최종 선택 — r4b_parts.png</summary>

```text
Edit this parts board, retaining all sixteen parts, their exact layout, captions, colors, textures, identities and blue pivot dots. Change ONLY cell 04 TORSO: REMOVE both pauldrons and ALL attached arms/sleeves from the torso (they already exist in cells 06/07); paint the underlying rounded blue-cloth shoulder sockets as smooth solid overlapping caps with no holes. Paint a FULL natural skin-colored neck extending up out of the tunic collar under the head/hair, with solid rounded top and no open hole. Torso must contain chest armor, blue upper tunic, neck and covered shoulder sockets only, no arms or pauldrons. Keep its waist pivot dot. Also move the small cyan pivot dots on 08 FOREARM R and 09 FOREARM L to their proximal ELBOW ends at the blue sleeves, instead of the distal wrist ends. Everything else unchanged. Preserve the same hand-painted 2D source artwork, no new characters.
```

</details>

<details>
<summary>15. spriteA — 중간 시안 / 수정 입력 — sources/r4a_hero_cutout.png</summary>

```text
Use case: background-extraction. Extract the entire character AND sword from this master painting onto REAL transparent background with alpha. Remove only ivory paper background and ground shadow. Do not redesign, repaint, change pose, change body proportions, recolor hair, change which hand holds sword or change costume. Preserve all original painted pixels and contours as closely as possible, entire hair stray lock, sash and blade. One full-body character only, same original scale, no text, no additions.
```

</details>

<details>
<summary>16. spriteB — 중간 시안 / 수정 입력 — sources/r4b_hero_cutout.png</summary>

```text
Use case: background-extraction. Extract the entire character AND sword from this master painting onto REAL transparent background with alpha. Remove only ivory paper background and ground shadow. Do not redesign, repaint, change pose, change body proportions, recolor hair, change which hand holds sword or change costume. Preserve all original painted pixels and contours as closely as possible, entire hair stray lock, sash and blade. One full-body character only, same original scale, no text, no additions.
```

</details>

<details>
<summary>17. forestA — 최종 선택 — sources/r4a_forest.png</summary>

```text
Use case: stylized-concept. Original hand-painted 2D mobile fantasy RPG forest field background for an EXACT 390x844 portrait phone viewport (render at twice that size if possible, same tall 195:422 aspect ratio). Rich European fantasy forest clearing: ancient tree trunks framing sides, atmospheric woodland path, soft brushwork on moss, layered foliage and grass, open low-detail readable warm ground through the middle-lower play area. Bold rich harmonious greens, chunky rounded trees, heavier matte gouache texture, golden dappled rim light, sturdy storybook shapes.
There are exactly TWO additional party members painted as SIMPLE low-detail colored silhouettes, with thin colored edges and matte shading matching the field: a hooded ranger in moss green at 12% canvas width, feet at 55% height, character height 13% of canvas; and a staff-bearing cloaked mage in muted plum at 26% width, feet at 65% height, character height 14% of canvas. Both face right; keep them subdued, simple faces without detail, NOT black solid blobs. ONE SMALL soft jade slime with simple face at 82% width, feet at 67% height, height only 5% of canvas, matte softly brushed body with subdued pale highlight, NOT shiny 3D. Leave center position at 48% width/67% height feet EMPTY: main heroine will be composited here later. NO other creatures or main heroine. No UI, text, letters, phone frame, inset, panels, watermark. Entire canvas is the forest field, no border. Original IP, do not copy any existing game's assets.
```

</details>

<details>
<summary>18. forestB — 최종 선택 — sources/r4b_forest.png</summary>

```text
Use case: stylized-concept. Original hand-painted 2D mobile fantasy RPG forest field background for an EXACT 390x844 portrait phone viewport (render at twice that size if possible, same tall 195:422 aspect ratio). Rich European fantasy forest clearing: ancient tree trunks framing sides, atmospheric woodland path, soft brushwork on moss, layered foliage and grass, open low-detail readable warm ground through the middle-lower play area. Soft airy hazy light, delicate foliage brushwork, muted harmonious sage/teal greens and cool distance, elegant softly realistic painted forms.
There are exactly TWO additional party members painted as SIMPLE low-detail colored silhouettes, with thin colored edges and matte shading matching the field: a hooded ranger in moss green at 12% canvas width, feet at 55% height, character height 13% of canvas; and a staff-bearing cloaked mage in muted plum at 26% width, feet at 65% height, character height 14% of canvas. Both face right; keep them subdued, simple faces without detail, NOT black solid blobs. ONE SMALL soft jade slime with simple face at 82% width, feet at 67% height, height only 5% of canvas, matte softly brushed body with subdued pale highlight, NOT shiny 3D. Leave center position at 48% width/67% height feet EMPTY: main heroine will be composited here later. NO other creatures or main heroine. No UI, text, letters, phone frame, inset, panels, watermark. Entire canvas is the forest field, no border. Original IP, do not copy any existing game's assets.
```

</details>

<details>
<summary>19. motionA_weapon_fix — 최종 선택 — r4a_motion.png</summary>

```text
Correct this exact four-pose board, preserving all faces, costumes, proportions, labels and painted style. CRITICAL: every figure must wield exactly ONE sword in the anatomical RIGHT hand, the arm CLOSEST to viewer. In the WALK CONTACT pose the sword hand at screen-left of torso is correct. Use that same anatomical near arm in ALL FOUR poses. In IDLE, remove the sword from the far arm at screen-right; put one sword into the near hand at screen-left of torso, angled down-right across front of legs, exactly matching the WALK CONTACT grip logic. The far hand hangs empty.  Preserve the good near-arm sword in walk, wind-up and strike. Increase exterior blank margins a little so attack strike blade TIP and all parts are fully inside the canvas with at least 40px breathing space. Wind-up and strike must retain dynamic shapes. No additional swords or scabbards. Do not flip or mirror figures.
```

</details>

<details>
<summary>20. motionB_weapon_fix — 중간 시안 / 수정 입력 — r4b_motion.png</summary>

```text
Correct this exact four-pose board, preserving all faces, costumes, proportions, labels and painted style. CRITICAL: every figure must wield exactly ONE sword in the anatomical RIGHT hand, the arm CLOSEST to viewer. In the WALK CONTACT pose the sword hand at screen-left of torso is correct. Use that same anatomical near arm in ALL FOUR poses. In IDLE, remove the sword from the far arm at screen-right; put one sword into the near hand at screen-left of torso, angled down-right across front of legs, exactly matching the WALK CONTACT grip logic. The far hand hangs empty. The current IDLE has TWO swords; remove the far/screen-right sword completely. Preserve the good near-arm sword in walk, wind-up and strike. Increase exterior blank margins a little so attack strike blade TIP and all parts are fully inside the canvas with at least 40px breathing space. Wind-up and strike must retain dynamic shapes. No additional swords or scabbards. Do not flip or mirror figures.
```

</details>

<details>
<summary>21. heroA_near_hand_fix — 최종 선택 — r4a_hero.png</summary>

```text
Precise small edit to this original hero painting. Keep the entire painting, head, proportions, pose, costume, textures, brushwork and plain light background exactly unchanged EXCEPT the sword grip. Put the ONE sword in her anatomical RIGHT, near-side hand: the glove that is currently EMPTY at the SCREEN-LEFT side of her torso. The near arm and glove must overlap the body in front. Sword guard held at that screen-left hip; entire blade angles diagonally down-right across front of legs, no cropping. The far hand at SCREEN-RIGHT must be empty and relaxed. Remove the old sword from that far hand completely. Do not duplicate swords or add a scabbard. Same silver blade and golden guard. Adult swordswoman faces screen right in 3/4. Preserve current compact four-and-a-half-head proportions exactly.
```

</details>

<details>
<summary>22. heroB_near_hand_fix — 중간 시안 / 수정 입력 — r4b_hero.png</summary>

```text
Precise small edit to this original hero painting. Keep the entire painting, head, proportions, pose, costume, textures, brushwork and plain light background exactly unchanged EXCEPT the sword grip. Put the ONE sword in her anatomical RIGHT, near-side hand: the glove that is currently EMPTY at the SCREEN-LEFT side of her torso. The near arm and glove must overlap the body in front. Sword guard held at that screen-left hip; entire blade angles diagonally down-right across front of legs, no cropping. The far hand at SCREEN-RIGHT must be empty and relaxed. Remove the old sword from that far hand completely. Do not duplicate swords or add a scabbard. Same silver blade and golden guard. Adult swordswoman faces screen right in 3/4. Preserve current slender six-head proportions exactly.
```

</details>

<details>
<summary>23. heroB_head_scale — 최종 선택 — r4b_hero.png</summary>

```text
Edit only the HEAD AND HAIR of this painting: enlarge the complete head and hair group by 25 percent around the neck attachment point, keeping neck connection natural. Head must be visibly substantially larger. Do not change the torso, arms, legs, boots, sword, hands, waist, pose, background, costume design or colors at all. Current figure is close to seven heads tall; enlarged head must make it exactly about six heads tall. Preserve adult facial identity, natural blue eyes, light ash blonde shoulder-length hair, matte painted brush texture. No text.
```

</details>

<details>
<summary>24. spriteA_final — 최종 선택 — sources/r4a_hero_cutout.png</summary>

```text
Use case: background-extraction. Remove ONLY the cream paper background and ground shadow from this exact painting. Real transparent alpha, no colored backdrop, no glow or cast shadow. Preserve the compact four-and-a-half-head figure, visible matte brush marks, pose and ALL costume details exactly. Preserve ONE sword held by near anatomical right hand at screen-left hip, blade across legs toward lower screen-right; the far screen-right hand remains empty. Do not move either hand, resize body, smooth paint, crop sword or invent any details. Full-body original painted character on transparency.
```

</details>

<details>
<summary>25. spriteB_final — 최종 선택 — sources/r4b_hero_cutout.png</summary>

```text
Use case: background-extraction. Remove ONLY cream paper background and ground shadow from this supplied final painting, real transparent alpha. Preserve the six-head body proportions and the enlarged head EXACTLY; do not revert to a smaller head or longer legs. Keep original matte painted brushwork, face, costume, pose and sword. ONE sword in near right hand at SCREEN-LEFT hip with blade crossing front of legs down-right. Far screen-right hand empty. No glow, no cast shadow, no redesign, no cropped hair or sword, entire painted character.
```

</details>

<details>
<summary>26. motionB_head_scale — 최종 선택 — r4b_motion.png</summary>

```text
Edit ONLY the first supplied four-pose motion board to match the slightly larger head-to-body proportion in the SECOND supplied final master character. Enlarge each of the four figures' head-and-hair groups by 18% around their neck attachment, yielding about six-head adult proportions. Keep their faces consistent with the final master. Preserve ALL four body poses, exact costume design, hand positions, right/near hand sword grip, ONE sword per figure, other hand empty, cloth folds, sash, labels and painted texture. No other change. Do not swap weapons between hands. Make sure entire strike sword tip is inside frame; add a small blank margin if necessary.
```

</details>

