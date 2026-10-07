# Round 2 스타일 방향 보드

내장 `image_gen` 도구로 각 보드를 개별 생성했다. CLI/API 경로는 사용하지 않았다. 다섯 PNG는 모두 1536×1024이며, 새로 작성한 프로젝트 파일은 이 폴더의 PNG 5개와 이 문서뿐이다.

각 보드에 생성·수정 합계 3회씩 사용했다. A·B·C·E는 세 번째 결과, D는 동일 캐스트 보존이 더 나은 두 번째 결과를 채택했다. 생성된 이미지를 그대로 복사했으며 별도 픽셀 보정이나 리사이즈는 하지 않았다.

입력 참조: `../../ref/current-lineup.png`는 비례·개성의 기준, `../round1/02_first_jobs.png`는 피해야 할 반려 스타일이다. C·E에는 A의 채택 이미지도 캐스트 연속성 참조로 사용했다. 수정 호출에는 직전 생성 결과를 입력했다. 아래 프롬프트는 실제 사용한 영문 원문이며, 설명·제작 계획·평가는 한국어로 기록했다.

## A — 종이 인형 정제

파일: [A_paper_refined.png](A_paper_refined.png)

### 채택 이미지의 기반 생성 프롬프트

```text
Use case: stylized-concept. Create ONE concept comparison board for Mini Midgard, original mobile fantasy RPG. Output landscape 1536 x 1024 PNG. No text, letters, labels, logos, watermarks, UI or borders.
Reference image 1 is the APPROVED personality/proportion reference: chunky 2.5-head paper-doll adventurers, simple faces, bold silhouette, separately bounded body parts. Reference image 2 is REJECTED, a negative reference ONLY: DO NOT imitate its glossy modern generic anime illustration, elaborate costumes or long bodies.
Same fixed cast, left to right, all full body in three-quarter view facing RIGHT, all limbs readable:
1) Novice girl: ivory short bob with one bent cowlick, small blue eyes, smug crooked mouth with one eyebrow raised. Ochre simple tunic with one patched sleeve, brown shorts and boots, mismatched short socks. Small dagger held out to the right, free hand on hip.
2) Swordsman boy: chunky cobalt-blue angular short hair, small eyes and determined angled brows, closed serious mouth. Steel-blue tunic, a single simple light gray breastplate, brown boots, no accessory clutter. Round blue shield on viewer-left arm, straight sword on viewer-right, feet braced.
3) Mage girl: lilac hair in a compact high bun with a short angled fringe, sleepy half-lidded eyes and small neutral mouth. Simple violet robe and short dark-violet cape, a single ochre trim, brown shoes. Wooden staff held upright on viewer-right with a solid cyan-blue orb (matte, NO glow).
4) Original round pink jelly-slime: asymmetrical bean-round body with a tiny folded fin on top, two separated stubby flipper feet, offset small dot eyes and a sideways flat mouth. Its distinct little folded fin and flipper feet must make this an original creature, NOT Ragnarok Poring.
Humans exactly 2.5–3 heads tall, huge heads and short chunky bodies. Distinct personality and pose for each; same designs in both rows. Clear boundaries between head, hair front/back, torso, arms, legs, weapons, shield, cape; no parts melting together. Plenty of space between four subjects, no cropping.
Composition: an upper main lineup of those four and a bottom strip showing exactly the same four designs/poses again, each human about 80 actual image pixels tall, monster proportionally smaller. Keep bottom strip visually tiny, not another full-size row.
Hard avoids: glossy highlights, sparkle eyes, rim light, bloom/glow, sparkles, airbrushed blush/shading, belt/pouch/buckle clutter, gacha key-art sheen, generic cute smiles, any existing game characters or copied sprites. Maintain original designs. Only medium-natural tonal variation; no digital airbrush. This is a distinctive medium study, not polished mainstream AI anime.

BOARD A — Refined current paper-doll style. Stay extremely close to reference 1's flat code-drawn look and simple face construction, not illustration 2. Deliberately assembled flat cut-paper shapes, thicker dark brown outer silhouette contours and thin inner joins. Four or five dominant flat colors per character, at most ONE flat shadow tone. No gradients, shading ramps, soft shadows, volume rendering or gloss. Subtle matte paper texture only. Small eyes, graphic irregular hair chunks. Patched sleeve and mismatched socks are readable asymmetry. Flat pale cool gray-green background, no parchment and no ground shadows. Upper human figures about 400 pixels tall, monster about 200 pixels tall; main baseline about y=680. Tiny bottom comparison row baseline about y=930. Bold humble paper puppets with crafted expressive silhouettes.
CORRECTION TO PREVIOUS DRAFT: The previous output's bottom figures were roughly 180 pixels tall, which is too large. This is an exact scale-check board, so the bottom human row MUST be 80 pixels tall measured from highest hair point to sole on the 1536x1024 canvas, occupying ONLY y=840 to y=920. The main humans must be 400 pixels tall from highest hair point to sole, occupying y=240 to y=640. Preserve generous empty space rather than filling the canvas with figures. These are essential. Remove any white shine dot on the blue orb and use a single flat cyan fill. Each human 2.5 heads tall (head 40% of body height). Flat uniform pale gray-green background, subtle texture inside cut-paper pieces only. Do not render soft tonal shading in skin.
```

### 최종 수정 프롬프트

```text
Edit this paper-doll concept board. Preserve the four large characters exactly and preserve the 1536x1024 canvas. Only change the bottom comparison strip: shrink the entire bottom group of four characters to 55% of its CURRENT width and height, centered horizontally at the same bottom baseline. The three small humans should now measure about 80 pixels tall instead of the current 146 pixels. Fill their old area seamlessly with the existing pale gray-green background. Preserve the same tiny figures' designs. No new objects, text, labels or shadows. Remove any light shine dot from the small mage's blue orb: flat cyan. The upper lineup remains unchanged.
```

### 차별점

굵은 외곽선과 얇은 부위 경계, 큰 색면으로 현재 종이 인형의 조립감을 유지했다.
초보자의 자신만만한 입, 검사의 찌푸린 눈썹, 마법사의 졸린 눈을 구분하고 소매 패치와 짝짝이 양말을 넣었다.

레이어 제작: 머리·앞뒤 머리카락·몸통·상하완·손·양다리·무기·방패·망토를 독립 RGBA 파츠로 다시 정리하고 관절 아래 겹침 여유를 만든다.

## B — 90년대 셀 애니

파일: [B_90s_cel.png](B_90s_cel.png)

### 채택 이미지의 기반 생성 프롬프트

```text
Use case: stylized-concept. Create ONE concept comparison board for Mini Midgard, original mobile fantasy RPG. Output landscape 1536 x 1024 PNG. No text, letters, labels, logos, watermarks, UI or borders.
Reference image 1 is the APPROVED personality/proportion reference: chunky 2.5-head paper-doll adventurers, simple faces, bold silhouette, separately bounded body parts. Reference image 2 is REJECTED, a negative reference ONLY: DO NOT imitate its glossy modern generic anime illustration, elaborate costumes or long bodies.
Same fixed cast, left to right, all full body in three-quarter view facing RIGHT, all limbs readable:
1) Novice girl: ivory short bob with one bent cowlick, small blue eyes, smug crooked mouth with one eyebrow raised. Ochre simple tunic with one patched sleeve, brown shorts and boots, mismatched short socks. Small dagger held out to the right, free hand on hip.
2) Swordsman boy: chunky cobalt-blue angular short hair, small eyes and determined angled brows, closed serious mouth. Steel-blue tunic, a single simple light gray breastplate, brown boots, no accessory clutter. Round blue shield on viewer-left arm, straight sword on viewer-right, feet braced.
3) Mage girl: lilac hair in a compact high bun with a short angled fringe, sleepy half-lidded eyes and small neutral mouth. Simple violet robe and short dark-violet cape, a single ochre trim, brown shoes. Wooden staff held upright on viewer-right with a solid cyan-blue orb (matte, NO glow).
4) Original round pink jelly-slime: asymmetrical bean-round body with a tiny folded fin on top, two separated stubby flipper feet, offset small dot eyes and a sideways flat mouth. Its distinct little folded fin and flipper feet must make this an original creature, NOT Ragnarok Poring.
Humans exactly 2.5–3 heads tall, huge heads and short chunky bodies. Distinct personality and pose for each; same designs in both rows. Clear boundaries between head, hair front/back, torso, arms, legs, weapons, shield, cape; no parts melting together. Plenty of space between four subjects, no cropping.
Composition: an upper main lineup of those four and a bottom strip showing exactly the same four designs/poses again, each human about 80 actual image pixels tall, monster proportionally smaller. Keep bottom strip visually tiny, not another full-size row.
Hard avoids: glossy highlights, sparkle eyes, rim light, bloom/glow, sparkles, airbrushed blush/shading, belt/pouch/buckle clutter, gacha key-art sheen, generic cute smiles, any existing game characters or copied sprites. Maintain original designs. Only medium-natural tonal variation; no digital airbrush. This is a distinctive medium study, not polished mainstream AI anime.

BOARD B. Paint this as photographed hand-painted acetate cels from a 1990s fantasy OVA SD gag segment. This is NOT paper cutout art: reference 1 informs only chunky proportions and character charm. Figure surfaces are smooth opaque cel paint with NO paper grain, NO mottled texture on costumes or hair. Uniform black ink contours slightly thick but far less heavy than reference 1, subtly imperfect hand tracing. Exactly ONE crisp hard-edged shadow tone per base color. No gradients, no shine ribbons. Draw angular hair clumps, small oval eyes with a single tiny highlight, expressive hand-drawn brows. Three-quarter right-facing poses, with visible ear and asymmetric face construction. Muted warm ochre, dusty blue and faded violet colors. A little analog film grain over the whole image, slightly soft scanned contours. Distinct cel animation drafting, NOT modern digital anime, NOT vector sticker art, NOT cut-paper.
Background: a very SIMPLE separate painted backdrop card: pale gouache sky above a SINGLE flat sage green grassy horizon. No village, castle, props, rocks or foreground grass detail. Keep background quiet.
COMPOSITION: upper cast has 2.5-head tall human bodies occupying about 450px height. Bottom duplicate comparison strip humans must be about 80px tall (from y=850 to y=930); this is tiny, only 8% of canvas height. Only four main figures and four tiny duplicates. Nothing else. Preserve novice's smug mouth, swordsman's determined scowl and mage's sleepy expression. Matte blue orb, gray breastplate without shine. The difference from board A should be unmistakably real cel animation ink/paint and one crisp shadow shape, rather than textured paper pieces.
```

### 최종 수정 프롬프트

```text
Edit this board, keeping its 1536x1024 canvas and the upper four cel-painted characters and painted backdrop unchanged. The ONLY change: reduce the entire bottom group of four characters to HALF its current width and HALF its current height. Each small human currently measures about 160px high; it MUST now be about 80px high. Center this reduced bottom group on x=768, baseline y=965, occupying only y=885..965. Fill the vacated area with matching green field. Do not change the main row. Do not redraw the tiny characters larger. No text or new objects.
```

### 차별점

A보다 가는 잉크선과 각진 머리 덩어리, 경계가 선명한 그림자로 셀 애니 쪽으로 이동했다.
단순한 하늘·들판 배경과 저채도 색, 스캔 입자가 시대감을 만든다. 첫 시안의 종이 질감이 강해 다시 생성했다.

레이어 제작: 셀의 선화·기본색·그림자를 각 신체 파츠에 묶고 배경 카드를 별도 레이어로 두며, 필름 입자는 전체 화면에 일관되게 적용한다.

## C — 펜선과 수채

파일: [C_manga_watercolor.png](C_manga_watercolor.png)

### 채택 이미지의 기반 생성 프롬프트

```text
Use case: stylized-concept. Create ONE concept comparison board for Mini Midgard, original mobile fantasy RPG. Output landscape 1536 x 1024 PNG. No text, letters, labels, logos, watermarks, UI or borders.
Reference image 1 is the APPROVED personality/proportion reference: chunky 2.5-head paper-doll adventurers, simple faces, bold silhouette, separately bounded body parts. Reference image 2 is REJECTED, a negative reference ONLY: DO NOT imitate its glossy modern generic anime illustration, elaborate costumes or long bodies.
Same fixed cast, left to right, all full body in three-quarter view facing RIGHT, all limbs readable:
1) Novice girl: ivory short bob with one bent cowlick, small blue eyes, smug crooked mouth with one eyebrow raised. Ochre simple tunic with one patched sleeve, brown shorts and boots, mismatched short socks. Small dagger held out to the right, free hand on hip.
2) Swordsman boy: chunky cobalt-blue angular short hair, small eyes and determined angled brows, closed serious mouth. Steel-blue tunic, a single simple light gray breastplate, brown boots, no accessory clutter. Round blue shield on viewer-left arm, straight sword on viewer-right, feet braced.
3) Mage girl: lilac hair in a compact high bun with a short angled fringe, sleepy half-lidded eyes and small neutral mouth. Simple violet robe and short dark-violet cape, a single ochre trim, brown shoes. Wooden staff held upright on viewer-right with a solid cyan-blue orb (matte, NO glow).
4) Original round pink jelly-slime: asymmetrical bean-round body with a tiny folded fin on top, two separated stubby flipper feet, offset small dot eyes and a sideways flat mouth. Its distinct little folded fin and flipper feet must make this an original creature, NOT Ragnarok Poring.
Humans exactly 2.5–3 heads tall, huge heads and short chunky bodies. Distinct personality and pose for each; same designs in both rows. Clear boundaries between head, hair front/back, torso, arms, legs, weapons, shield, cape; no parts melting together. Plenty of space between four subjects, no cropping.
Composition: an upper main lineup of those four and a bottom strip showing exactly the same four designs/poses again, each human about 80 actual image pixels tall, monster proportionally smaller. Keep bottom strip visually tiny, not another full-size row.
Hard avoids: glossy highlights, sparkle eyes, rim light, bloom/glow, sparkles, airbrushed blush/shading, belt/pouch/buckle clutter, gacha key-art sheen, generic cute smiles, any existing game characters or copied sprites. Maintain original designs. Only medium-natural tonal variation; no digital airbrush. This is a distinctive medium study, not polished mainstream AI anime.

Reference image 3 is the approved cast design in direction A: preserve its ivory bob novice, blue-haired swordsman, lilac-bun mage and pink flipper-foot slime identities, simple costumes and distinct expressions. Translate the MEDIUM completely as specified; do NOT carry paper texture or cut-paper rendering into this board.
BOARD C — Manga color-page drawn with real DIP-PEN INK and TRANSPARENT WATERCOLOR on white cold-press paper. Push the physical medium boldly: tapering, swelling black nib lines; broken contour segments; small pooled black ink corners; a few confident hatches. NOT clean uniform digital outlines. Uneven watery violet, ochre, blue, pink pigment with visible blooms, tide marks and bleeds just outside contours. Large patches of untouched PAPER WHITE inside lit parts, dry brush skips. Sparse dot screentone in a few garment shadow shapes. Faces lively and economical hand ink; small expressive eyes, no glossy shine or cute generic smiles. Strictly simple costumes and 2.5-head proportions. Main figures retain clearly bounded arms, torso, legs, cape, hair and props despite the loose washes. Rough charming tankobon color sketch, not finished anime promo art. Background plain cool white cold-press watercolor paper, no parchment, no scenic backdrop. Upper four human/monster lineup and an exceptionally TINY bottom strip of the same four. Each human in bottom strip approximately 80 pixels high on 1536x1024, only 1/12 of canvas height; the full strip should be only about 280 pixels wide, centered at bottom. Lots of white space around tiny row. Main human row ~450px tall. No ground cast shadows. All three humans 3/4 facing right.
```

### 중간 수정 프롬프트

```text
Edit only the bottom tiny comparison row of this 1536x1024 watercolor board. Preserve the four large watercolor characters, their ink lines and all background exactly. Shrink the ENTIRE bottom group to 55% of its CURRENT width and height, keeping it centered. Current small humans are 136 pixels high; target is 75 to 80 pixels high. Bottom group's final bounding box must be only about 240 pixels wide and 80 pixels tall, centered x=768 with soles at y=955. Remove the previous larger bottom group and fill seamlessly with white watercolor paper. Do not add labels, text or objects. Preserve watercolor medium and same figures. This is a scale correction only.
```

### 최종 수정 프롬프트

```text
Preserve this whole watercolor board except the bottom four miniature figures. Shrink the bottom miniature GROUP to 75% of its current width and height: humans currently around106px tall become80px tall. Keep group centered with soles at y945. Fill vacated space with white paper. Nothing else changes. Output same1536x1024. Tiny strip overall about240px wide and80px high. Keep large artwork intact. No labels.
```

### 차별점

끊어지고 굵기가 바뀌는 잉크선, 색 번짐과 종이 흰색이 남은 면으로 매체를 드러냈다.
검사 옷과 마법사 로브의 일부 점묘 그림자가 수채와 만화 인쇄 표현을 연결한다.

레이어 제작: 각 파츠에 수채 텍스처와 잉크선을 함께 고정하고 번짐 여백을 알파에 포함하며, 관절 겹침에서 흰 틈이 생기지 않도록 숨은 면을 보충한다.

## D — 도트 방향

파일: [D_pixel_sprite.png](D_pixel_sprite.png)

### 채택 이미지의 기반 생성 프롬프트

```text
Use case: stylized-concept. Create ONE concept comparison board for Mini Midgard, original mobile fantasy RPG. Output landscape 1536 x 1024 PNG. No text, letters, labels, logos, watermarks, UI or borders.
Reference image 1 is the APPROVED personality/proportion reference: chunky 2.5-head paper-doll adventurers, simple faces, bold silhouette, separately bounded body parts. Reference image 2 is REJECTED, a negative reference ONLY: DO NOT imitate its glossy modern generic anime illustration, elaborate costumes or long bodies.
Same fixed cast, left to right, all full body in three-quarter view facing RIGHT, all limbs readable:
1) Novice girl: ivory short bob with one bent cowlick, small blue eyes, smug crooked mouth with one eyebrow raised. Ochre simple tunic with one patched sleeve, brown shorts and boots, mismatched short socks. Small dagger held out to the right, free hand on hip.
2) Swordsman boy: chunky cobalt-blue angular short hair, small eyes and determined angled brows, closed serious mouth. Steel-blue tunic, a single simple light gray breastplate, brown boots, no accessory clutter. Round blue shield on viewer-left arm, straight sword on viewer-right, feet braced.
3) Mage girl: lilac hair in a compact high bun with a short angled fringe, sleepy half-lidded eyes and small neutral mouth. Simple violet robe and short dark-violet cape, a single ochre trim, brown shoes. Wooden staff held upright on viewer-right with a solid cyan-blue orb (matte, NO glow).
4) Original round pink jelly-slime: asymmetrical bean-round body with a tiny folded fin on top, two separated stubby flipper feet, offset small dot eyes and a sideways flat mouth. Its distinct little folded fin and flipper feet must make this an original creature, NOT Ragnarok Poring.
Humans exactly 2.5–3 heads tall, huge heads and short chunky bodies. Distinct personality and pose for each; same designs in both rows. Clear boundaries between head, hair front/back, torso, arms, legs, weapons, shield, cape; no parts melting together. Plenty of space between four subjects, no cropping.
Composition: an upper main lineup of those four and a bottom strip showing exactly the same four designs/poses again, each human about 80 actual image pixels tall, monster proportionally smaller. Keep bottom strip visually tiny, not another full-size row.
Hard avoids: glossy highlights, sparkle eyes, rim light, bloom/glow, sparkles, airbrushed blush/shading, belt/pouch/buckle clutter, gacha key-art sheen, generic cute smiles, any existing game characters or copied sprites. Maintain original designs. Only medium-natural tonal variation; no digital airbrush. This is a distinctive medium study, not polished mainstream AI anime.

D — STRICT LOW RESOLUTION SPRITE SHEET. Reference images are ONLY character personality guidance, NOT layout guidance. Generate a 1536x1024 landscape sheet of original hand-pixelled fantasy sprites. Entire background a perfectly uniform flat desaturated sage color, no texture or gradient. A lot of blank background is REQUIRED. All main sprites must be SMALL on this large sheet: each upper human exactly 240 pixels tall, derived from an 80px native sprite enlarged 3x. Upper main row occupies y=330..570, with centers x=380, 640, 900, 1160. Bottom row occupies y=840..920, humans 80 pixels tall, same exact native sprite at 1x. Upper/bottom height ratio exactly THREE, never four, five or six. Slime half human height. Do not enlarge characters to fill the canvas. Total sheet mostly empty sage.
Pure hard-edged SQUARE pixel clusters. Each upper source pixel a 3x3 square solid color. Exactly 16 or fewer solid colors for each sprite; 1 native pixel selective dark colored outline, lighter segments on lit edges. NO dithering unless absolutely useful, no banded gradients, no painted shading. Few-pixel faces: small flat eyes and one-pixel mouth. Hard flat color clusters. This MUST be real low-resolution pixel-art appearance, not raster illustration with a mosaic filter, not painterly pixels or smooth anti-aliased outlines. No grain, blurry pixels, glow, glossy highlight, lighting vignette, text, labels, ground shadows or borders. Keep the ivory-bob smug novice, cobalt-haired determined swordsman, sleepy lilac-bun violet mage and original folded-fin/flipper-foot pink jelly slime. Props and limbs separately legible. 2.5-head tall proportions. The sparse correct 240px/80px composition is more important than filling the board.
```

### 차별점

각진 외곽과 큰 색 덩어리로 직업 실루엣을 구분하며, 세 번째 시안보다 동일 캐스트의 비례를 잘 유지한 두 번째 시안을 선택했다.
단, 이 결과는 도트 스타일 컨셉이다. 요청한 진짜 64–80px 원본·정확한 3배 최근접 확대·16색 제한을 충족한 제작용 도트라고 할 수 없다.

레이어 제작: 64–80px 원본 캔버스에서 제한 팔레트로 직접 픽셀을 다시 배치하고, 부위별 도트 레이어 또는 프레임 스프라이트로 만든 뒤 최근접 3배 미리보기를 출력해야 한다.

## E — 점토 스톱모션

파일: [E_clay.png](E_clay.png)

### 채택 이미지의 기반 생성 프롬프트

```text
Use case: stylized-concept. Create ONE concept comparison board for Mini Midgard, original mobile fantasy RPG. Output landscape 1536 x 1024 PNG. No text, letters, labels, logos, watermarks, UI or borders.
Reference image 1 is the APPROVED personality/proportion reference: chunky 2.5-head paper-doll adventurers, simple faces, bold silhouette, separately bounded body parts. Reference image 2 is REJECTED, a negative reference ONLY: DO NOT imitate its glossy modern generic anime illustration, elaborate costumes or long bodies.
Same fixed cast, left to right, all full body in three-quarter view facing RIGHT, all limbs readable:
1) Novice girl: ivory short bob with one bent cowlick, small blue eyes, smug crooked mouth with one eyebrow raised. Ochre simple tunic with one patched sleeve, brown shorts and boots, mismatched short socks. Small dagger held out to the right, free hand on hip.
2) Swordsman boy: chunky cobalt-blue angular short hair, small eyes and determined angled brows, closed serious mouth. Steel-blue tunic, a single simple light gray breastplate, brown boots, no accessory clutter. Round blue shield on viewer-left arm, straight sword on viewer-right, feet braced.
3) Mage girl: lilac hair in a compact high bun with a short angled fringe, sleepy half-lidded eyes and small neutral mouth. Simple violet robe and short dark-violet cape, a single ochre trim, brown shoes. Wooden staff held upright on viewer-right with a solid cyan-blue orb (matte, NO glow).
4) Original round pink jelly-slime: asymmetrical bean-round body with a tiny folded fin on top, two separated stubby flipper feet, offset small dot eyes and a sideways flat mouth. Its distinct little folded fin and flipper feet must make this an original creature, NOT Ragnarok Poring.
Humans exactly 2.5–3 heads tall, huge heads and short chunky bodies. Distinct personality and pose for each; same designs in both rows. Clear boundaries between head, hair front/back, torso, arms, legs, weapons, shield, cape; no parts melting together. Plenty of space between four subjects, no cropping.
Composition: an upper main lineup of those four and a bottom strip showing exactly the same four designs/poses again, each human about 80 actual image pixels tall, monster proportionally smaller. Keep bottom strip visually tiny, not another full-size row.
Hard avoids: glossy highlights, sparkle eyes, rim light, bloom/glow, sparkles, airbrushed blush/shading, belt/pouch/buckle clutter, gacha key-art sheen, generic cute smiles, any existing game characters or copied sprites. Maintain original designs. Only medium-natural tonal variation; no digital airbrush. This is a distinctive medium study, not polished mainstream AI anime.

Reference image 3 is the approved cast design in direction A: preserve its ivory bob novice, blue-haired swordsman, lilac-bun mage and pink flipper-foot slime identities, simple costumes and distinct expressions. Translate the MEDIUM completely as specified; do NOT carry paper texture or cut-paper rendering into this board.
BOARD E — Actual HANDMADE PLASTICINE STOP-MOTION PUPPETS photographed on a plain pale gray felt/card sweep. This is a photographic medium translation, NOT drawings, NOT paper cutouts, NOT polished 3D renders. Fat 2.5-head clay figures, slightly lumpy asymmetrical sculpted forms, matte clay with clearly visible faint fingerprints, pressed seams and wooden sculpting tool marks. Sculpt each hair clump as a separate lump, tunics/cape/shield as thick separate clay slabs. Arms, legs and accessories visibly separate pieces with neat readable joins. Simple tiny black press-dot or matte bead eyes, brows made from little clay strips, mouths incised; smug novice, determined swordsman, sleepy mage. Tiny ears. Matte solid cyan clay orb, matte gray clay sword and breastplate, no shiny metal, no polished plastic. Soft wide studio light giving one gentle contact shadow, no rim light or bloom. Pink slime a lumpy round blob of matte pink plasticine with pinched folded fin and two separately attached flipper feet. Finger marks must be present on the main characters. Keep A's simple identity and costume palette.
Upper main lineup photographed full-body, 3/4 facing right; separate no overlap. Along bottom a tiny centered strip of the SAME four figures at game size: humans ONLY 80 pixels high on the 1536x1024 canvas, full tiny row about 280px wide, 80px high; lots of empty felt around this tiny row. Do not give bottom row another large set of puppets. Clean blank felt backdrop without scenery or props. The result should look like someone lovingly hand sculpted four funny slightly imperfect puppets and photographed them, never a smooth toy CGI render.
```

### 중간 수정 프롬프트

```text
Scale correction only. Keep the large clay figures and backdrop unchanged on this 1536x1024 image. Bottom comparison strip MUST consist of the same four much smaller figures. Reduce current bottom group to TWO THIRDS of its existing width and height. Current tiny humans roughly120px high; after edit they must be80px high. Center at x768 with baseline y950. The complete group bounding width about255px. Seamlessly restore empty felt where the previous group was. Do not move, resize or alter the upper four. Preserve matte clay fingerprints and tool marks. No text or new objects.
```

### 최종 수정 프롬프트

```text
Preserve this clay board except bottom miniature group. Scale bottom group to80% of current width and height so100px-tall humans become80px tall. Keep bottom baseline y944 and horizontal center x768. Refill old positions with the same gray felt. Main four figures and lighting remain unchanged. Same1536x1024. No other edits, no new text or objects.
```

### 차별점

작은 점 눈, 눌러 만든 눈썹과 입, 덩어리별 머리카락과 소품으로 점토 인형의 구조를 드러냈다.
무광 표면의 자국과 부드러운 접지 그림자로 다른 네 방향과 매체 차이가 가장 크다.

레이어 제작: 같은 조명·카메라 아래 부품별 정면/회전 이미지를 확보해 알파 파츠로 정리하고 관절 가림판을 보충하며, 접지 그림자는 별도 파츠로 분리한다.

## 솔직한 자체 평가

반려된 라운드 1의 긴 비례, 머리 광택띠, 다중 하이라이트 눈, 장비 과밀은 크게 줄었다. A는 현재 스타일과 연결되고, C와 E는 매체 차이가 즉시 보인다. 다만 A도 원본 코드 드로잉보다 머리 윤곽과 의상 표현이 복잡하고, B는 아주 강한 90년대 OVA 개성보다는 비교적 정돈된 SD 애니에 가깝다. A 배경과 색면에도 미세한 질감·톤 변화가 남아 엄격한 단색 제한을 완전히 지키지 못했다.

하단 네 캐릭터 스트립은 모두 넣었으나 생성 모델이 지정한 수치보다 크게 그리는 경향이 반복되었다. 1536×1024 원본을 눈으로 확인한 인간 캐릭터 높이는 대략 A 110px, B 95px, C 90px, D 125px, E 90px이다(픽셀 마스크를 통한 정밀 측정치는 아님). 따라서 특히 A·D는 요청한 약 80px 실게임 크기 검증을 완료했다고 볼 수 없다. 상·하단 역시 같은 디자인을 다시 그린 결과여서 정확히 동일한 원본의 축소 복사본은 아니다.

D는 가장 큰 미달 사항이다. 세 번 시도했지만 진짜 고정 픽셀 격자·16색 팔레트·정확한 3×/1× 표시를 얻지 못했다. 채택본은 상단 약 420px, 하단 약 125px로 보이고 경계에 중간색과 배경 톤 변화가 남는다. 따라서 도트 방향을 비교하는 자료로만 사용할 수 있으며, 의뢰서의 기술 조건을 충족한 보드로 승인할 수 없다. 세 번째 시안은 비례와 소품의 연속성이 더 나빠져 채택하지 않았다.

캐스트의 큰 특징은 유지되지만 매체 사이의 소매·방패 테두리·망토 형태에는 차이가 있다. 일부 얼굴은 우측 3/4보다 정면에 가깝고 슬라임의 먼 쪽 눈이 생략되는 경우도 있다. C의 종이 흰색이 구슬·금속에서 광택처럼 읽힐 수 있으며, 반복 수정 뒤 일부 잉크선이 겹쳐 보인다. E는 무광과 제작 자국이 있으나 덩어리들이 다소 균일하여 더 거칠고 비대칭적인 손맛을 밀어붙일 여지가 있다.

각 이미지의 신체 경계는 대체로 읽히지만 실제 분리 레이어가 들어 있는 파일은 아니다. 최종 방향 선택 후 가려진 관절 면을 포함한 파츠 제작이 필요하다. 이번 제출은 5개 스타일 비교안과 그 한계의 기록이며, REQUEST의 모든 조건을 정확히 충족했다고 주장하지 않는다.


## 부품 시트 B·C·D — 2026-10-07

내장 이미지 생성 도구로 스타일별 최초 1회와 수정 3회씩, 총 12회 생성했다. 저장 파일은 [parts_B.png](parts_B.png), [parts_C.png](parts_C.png), [parts_D.png](parts_D.png). **REQUEST를 완전히 충족한 제작용 시트는 아니다.** B·D는 4번째 결과, C는 몸이 칸을 넘지 않는 2번째 결과를 보관했다. C의 3·4번째 결과는 몸 크기를 고치려다 첫 행 아래로 넘쳐 제외했다.

생성 요청은 공통으로 1536×1536, 보이지 않는 3×3 격자, 순수 #FF00FF 배경, 장비 없는 노비스와 착용 크기의 8종 단품이었다. B는 균일한 먹선·한 단계 셀 그림자, C는 펜선·형태 안쪽 수채와 흰 하이라이트, D는 256×256 원본의 6배 최근접 확대를 지시했다. 재시도에서는 몸의 칸 침범, 과대한 액세서리, 배경 색 편차와 픽셀 격자를 수정하도록 요청했다. 실제 전송한 공통·스타일·수정 프롬프트는 아래에 보존한다.

검사 결과 세 파일 모두 **1254×1254**로 반환되어 512px 셀 조건을 충족하지 못했다. 실제 3등분 셀은 418×418이다. 빈 배경 외곽 30px 띠에서도 B 254색, C 238색, D 255색이 검출되었으며 대표값은 (251,3,250), (252,3,250) 등이다. 따라서 배경은 정확한 #FF00FF 단색이 아니다. 별도 색 보정·리사이즈 없이 생성 원본을 저장했다.

마젠타 유사색을 제외한 근사 실루엣 검사에서 선택본의 피사체는 각 418px 셀 안에 있고, 몸에 머리 장식은 없다. 몸 높이는 B 약363px(셀의87%), C 약235px(56%), D 약304px(73%)다. C는 몸이 작아 상대적으로 머리핀·꽃·안경이 특히 크며, B·D도 장식 크기와 3/4 착용 각도가 완전히 맞지는 않는다. 일부 풀잎은 가는 풀피리보다 넓은 잎처럼 보인다. 실제 합성 적합성은 미검증이다.

B는 셀 느낌을 유지하지만 단일 그림자색을 엄격히 보장할 수 없다. C는 수정 과정에서 선과 수채가 원본 보드보다 정돈되었다. D는 도트 외관은 유지했으나 **고정 크기 정사각 픽셀·무안티앨리어싱·제한 팔레트 조건에 미달**한다. D 전체 RGB 색 수는 48,918개이며 배경 편차와 경계 중간색도 포함한다. 동일 격자의 실제 약80px 원본 스프라이트를 확보했다고 볼 수 없다.

<details>
<summary>사용 프롬프트 원문: 공통 본문, 스타일별 추가 지시, 수정 1~3회</summary>

공통 최초 생성 본문(각 스타일 추가 지시와 이어 붙여 전송):

```text
Use case: stylized-concept. Asset: production 2D MMORPG equipment-swapping part sheet. Generate ONE square PNG exactly 1536x1536 pixels. The attached board is STYLE AND CHARACTER REFERENCE ONLY. Draw the same blonde Novice girl (leftmost character) design, clothing, palette and rendering style. Do not reproduce the board composition, other characters, scenery, or tiny previews.

CRITICAL LAYOUT: invisible 3x3 grid, nine 512x512 cells, numbered conceptually row-major 0..8. No drawn grid, borders, labels or text. Entire empty background must be precisely pure flat saturated magenta RGB(255,0,255) #FF00FF, with absolutely no texture, grain, shadows, gradients, paper or vignette outside the drawn silhouettes. No ground shadows. Every object fully contained in its cell.

CELL 0 (x0-511,y0-511): ONLY the Novice girl, full body 3/4 view facing viewer's right. Same short cream-blonde bob and natural hair tuft, blue eyes, tan tunic, cream short sleeves, brown shorts, fingerless gloves and brown boots from reference. No headgear, no hair clip, no accessory of any kind; just her natural hair. Empty hands, no dagger, no weapon, no equipment. Approximately 430px tall, feet at y470, horizontally centered. Her head including hair is about 200px wide. 
CELLS 1-8: accessories ALONE, one self-contained outlined item per cell, each centered at cell center. No body parts, faces, hair, mannequins or shadows. Accessories must be EXACT WORN SIZE relative to girl in cell0, deliberately SMALL surrounded by lots of flat magenta. All match the girl's 3/4 head facing right.
CELL 1 center(768,256): two crossed hair clips with small star gem, combined about 55px wide.
CELL 2 center(1280,256): two-leaf green sprout on short stem, stem end at bottom, about 70px wide and 65px high.
CELL 3 center(256,768): big bow ribbon worn on top of head, about 125px wide.
CELL 4 center(768,768): a SINGLE flower worn at side of head, about 65px wide.
CELL 5 center(1280,768): cat-ear headband, about 190px wide sized to fit girl's hair.
CELL 6 center(256,1280): round glasses with two round lenses and bridge in matching 3/4 angle, about 105px wide.
CELL 7 center(768,1280): a long grass blade held in mouth (grass whistle), about 115px long, single blade with narrow bite end, no mouth, face or lips.
CELL 8 center(1280,1280): tilted beret as worn, about 195px wide to fit girl's head.
No additional objects or repeated thumbnails. Do not enlarge small accessories to fill their cells. Every accessory has its own complete outline for easy cutout and layering.
```

### B — 최초 생성 추가 지시

참조: B_90s_cel.png

```text
STYLE B: match attached B_90s_cel board exactly: 1990s anime cel illustration, even dark brown ink lines, flat cel paint, exactly ONE hard-edged shadow tone per base color, slightly muted palette. Subtle grain permitted INSIDE drawn shapes only. Preserve simple expressive face, squat chibi proportions and the reference Novice clothing design. Absolutely uniform #FF00FF background.
```

B 수정 1 (직전 생성물을 참조):

```text
Edit this part sheet only. Preserve the character and accessory designs and cel rendering. Output EXACTLY 1536x1536 pixels. Correct layout and accessory SCALE: imagine a 3x3 grid with 512px cells. The girl must fit ENTIRELY inside TOP LEFT cell, head top y40 feet y470, total height430px. ALL accessories are currently MUCH TOO LARGE: reduce hairpin to 55px width, sprout70px width, bow125px width, flower65px width, cat ears190px width, glasses105px width, grass115px width, beret195px width. These must be tiny wearable pieces, not enlarged catalog icons. Keep each accessory centered in its respective cell (x768,y256 hairpin;1280,256 sprout;256,768 bow;768,768 flower;1280,768 ears;256,1280 glasses;768,1280 grass;1280,1280 beret). Most of each cell must remain empty magenta. Background precisely solid RGB255,0,255 everywhere outside artwork. No shadows, no text, no grid. No new elements. Smaller objects is the essential correction.
```

B 수정 2 (직전 생성물을 참조):

```text
Correct this sheet while keeping B cel style and all nine subjects. A square image with equal 3x3 invisible cells. Girl stays in top-left but move her upward by 20 pixels so boots fully inside top third; do not change her size. Accessory centers must be EXACT cell centers: first row at 1/6 image height, middle row at1/2 image height, bottom row at5/6 image height. Columns at1/6,1/2,5/6 image width. Hairpin and sprout currently too low: move up to first-row vertical center. Reduce only crossed hairpin to55% current size; flower to65%; glasses to70%; ribbon to80%; grass to80%. Keep headband, sprout and beret sizes. Preserve full self-contained outlines. Girl wears no accessories. Pure perfectly uniform flat RGB(255,0,255) background without a single variation outside art. Requested final image resolution 1536x1536 PNG. No grid, text or shadows.
```

B 수정 3 (직전 생성물을 참조):

```text
Final technical correction of this sprite part sheet. Deliver 1536x1536 pixels. Preserve all nine illustrations and their sizes, with only three tiny changes: move girl slightly up so her feet have a 20px magenta gap above the first horizontal cell boundary at one third canvas height; move top-row accessories upward to exact first-row cell centers at one sixth canvas height; make all background pixels precisely #FF00FF, no noise, grain or variation. No grain on background. Objects remain inside same cells. No drawn lines or text. Do not enlarge anything. Keep all outlines and style.
```

### C — 최초 생성 추가 지시

참조: C_manga_watercolor.png

```text
STYLE C: Match attached C_manga_watercolor board exactly: irregular expressive dip-pen ink contours, patchy hand painted watercolor washes contained inside outlined shapes, little white paper highlights INSIDE shapes. No white halo or paper background; exterior is flat solid #FF00FF. Same Novice girl's squat chibi proportions and mischievous eyebrows. Canvas is square1536x1536. Girl MUST remain inside top-left third of width and top third of height. Accessory scale is essential: sprout is just one third the girl's head width, hairpin one quarter head width, flower one quarter head width, ribbon half head width, headband and beret one head width, glasses half head width. Most of every accessory cell is empty magenta. These are wearable sprite pieces, NOT enlarged standalone icon illustrations.
```

C 수정 1 (직전 생성물을 참조):

```text
Edit this C watercolor sheet, keeping same nine designs and rendering. CRITICAL reduce each subject within its cell, don't resize entire sheet. Girl scale to85% current width/height centered in TOP LEFT CELL, with feet at31% image height, to fit fully above first-third boundary. Accessories too large: hairpin scale45% current dimensions, sprout45%, bow50%, flower40%, headband70%, glasses50%, grass55%, beret65%. Each tiny accessory centered precisely in its own cell: top row centers at (50%,16.67%) and(83.33%,16.67%); middle row at(16.67%,50%),(50%,50%),(83.33%,50%); bottom row at(16.67%,83.33%),(50%,83.33%),(83.33%,83.33%). These parts must fit when placed directly onto girl's head without any scaling. Preserve pen lines and watercolor ONLY inside silhouettes. Uniform exact RGB255,0,255 outside them. No ink splatter or ground shadows outside silhouettes. Output 1536x1536 PNG. Do not add anything.
```

C 수정 2 (직전 생성물을 참조):

```text
Keep this watercolor part sheet exactly except GIRL SIZE and tiny accessory scale adjustments. Increase ONLY the girl by 150 percent (1.5 times current width and height), inside top-left third cell, centered horizontally. Her full height must occupy85% of that cell height; hair top at4% total canvas height, feet at32% total canvas height. Do not grow beyond top-left cell. Accessories: reduce hairpin to60%, flower to70%, glasses to75% current sizes; keep all other accessory sizes unchanged. Keep each in current cell, center top-row parts at one sixth canvas height. Preserve existing watercolor and ink style with opaque white highlights INSIDE silhouettes. Flat uniform #FF00FF background, no noise, paper or stray ink outside objects. Resolution1536x1536. No grid or text.
```

C 수정 3 (직전 생성물을 참조):

```text
Final correction. Keep eight accessories unchanged. Shrink ONLY girl to85% of her current height and width, keep her hair top at same y position, so feet move UP and stay above one-third image height. Girl should be approx350px tall on this current1254px preview, absolutely no taller, fully in first cell. Shift her slightly left to top-left cell horizontal center. Preserve watercolor rendering and all designs. Background exact uniform #FF00FF with no noise or grain. Export final at1536x1536 PNG if possible. No grid, text or extra subjects.
```

### D — 최초 생성 추가 지시

참조: D_pixel_sprite.png

```text
STYLE D: match D_pixel_sprite board's Novice identity and limited palette but implement STRICT true pixel art. Construct the WHOLE SHEET at native256x256 resolution and upscale exactly6x with NEAREST NEIGHBOR to1536x1536: every art pixel becomes an exactly6x6 solid square with absolutely no antialiasing or blur. Girl is72 native pixels tall (approximately80), 432px displayed. Same6x6 grid for EVERY accessory. Native accessory widths: crossed hairpin9px, sprout12px, ribbon21px, flower11px, ears32px, glasses18px, grass20px, beret33px. Limited palette and selective dark contour. Flat pixel clusters, no subpixel details or smoothed diagonals. Native background RGB255,0,255 single solid color. IMPORTANT girl occupies only top-left third of sheet; accessories tiny wearable pieces with lots of empty magenta. Prioritize correct pixel lattice and native sprite construction over decorative complexity.
```

D 수정 1 (직전 생성물을 참조):

```text
Correct this pixel art sheet. Keep same nine designs but enforce native low resolution pixel grid. Output1536x1536 from256x256 native nearest-neighbor6x. Each colored pixel must be precisely a6x6 solid square; no smaller pixels, no antialiasing, no gradients. Girl must fit entirely inside top-left third: reduce girl to85% current dimensions and place her feet at31% of image height. Most accessories are too big: hairpin reduce to50%, sprout50%, ribbon55%, flower45%, headband75%, glasses50%, grass55%, beret70% current dimensions. Center each in its own equal3x3 cell; top row parts at16.67% height. Do not compensate by enlarging them. They are actual wearable sizes. EXACT uniform RGB255,0,255 background without any texture. Keep dark pixel outlines, limited palette, same blonde novice with no equipment and no headgear. Do not draw the grid or add text.
```

D 수정 2 (직전 생성물을 참조):

```text
Edit pixel part sheet. Move girl UP by40 pixels, same size, so entire body above first-third image boundary with margin. Reduce hairpin and flower and glasses to HALF current width/height. Reduce sprout and ribbon and grass to75% current width/height. Keep cat-ear headband and beret same size. Every accessory centered in its existing3x3 cell. Top row accessory centers need moving UP to one sixth image height. Enforce a single consistent coarse pixel grid on every subject: each source pixel a flat uniform square, no subpixel colors, gradients, antialiasing or blur. Use few solid colors per material. Same original pixel Novice style, no accessories on girl. Uniform exact pure #FF00FF background. Final PNG1536x1536. No text or grid.
```

D 수정 3 (직전 생성물을 참조):

```text
Final technical correction ONLY. Keep all nine subjects, arrangement, identities and worn accessory sizes exactly as in supplied image. Convert to strict native pixel art with a SINGLE common pixel lattice for girl AND every accessory:256x256 native sheet enlarged6x NEAREST NEIGHBOR to1536x1536. All source pixels become6x6 blocks. Solid colors only, limited palette, no antialiasing or blur, no tiny subpixel marks. Outside silhouettes fill EXACT RGB(255,0,255); eliminate all background color noise, texture and variation. Current magenta is near(251,3,250), which is wrong; it must be(255,0,255) everywhere empty. No changes to sizes or poses, no grid, text or extra objects. Final dimensions1536x1536.
```

</details>

## 배경 키트

2026-10-07. `docs/art/BG_BRIEF_R2.md`의 REQUEST에 따라 내장 `image_gen`으로 A·C·D의 키트와 전투 목업을 **각 파일별로 개별 생성·검수**했다. CLI/API는 사용하지 않았다. 각 키트 3회, scene_A·scene_C 각 2회, scene_D 3회로 파일당 최대 3회 한도를 지켰다. 생성 결과 중 아래 버전을 원본 그대로 복사했다. 별도 리사이즈·크로마키 보정·타일 합성은 하지 않았다. 이번 작업의 프로젝트 쓰기는 지정 PNG 6개와 이 문서에 한정했다. 기존 본문과 부품 시트 기록을 보존했다.

**요구사항을 완전히 충족한 제작용 키트로 승인할 수 없다.** 스타일 비교 이미지는 확보했지만, 세 키트 모두 요청한 1536×1536 대신 **1254×1254**로 반환되었다. 실제 상단 사분면은 627×627이고, 하단 셀도 384×384가 아니다. 재시도에서 출력 크기를 명시적으로 바로잡도록 요청했지만 해결되지 않았다. 순수 #FF00FF, 완전 무봉제 타일링, 정확한 소품 크기·접지점, D의 고정 픽셀 격자도 미달이다. 현재 파일을 768/384 고정 좌표로 잘라 사용하면 잘못 잘린다. `tools/style-lab.html`을 수정하거나 실제 엔진 조립 검증을 통과했다고 주장하지 않는다.

| 스타일 | 저장 파일 | 실제 크기 | 생성·수정 횟수 / 선택 |
|---|---|---|---|
| A | [bgkit_A.png](bgkit_A.png) | 1254×1254 | 3회 / 2번째 |
| A | [scene_A.png](scene_A.png) | 1024×1536 | 2회 / 2번째 |
| C | [bgkit_C.png](bgkit_C.png) | 1254×1254 | 3회 / 3번째 |
| C | [scene_C.png](scene_C.png) | 1024×1536 | 2회 / 2번째 |
| D | [bgkit_D.png](bgkit_D.png) | 1254×1254 | 3회 / 2번째 |
| D | [scene_D.png](scene_D.png) | 1024×1536 | 3회 / 3번째 |

### 검수 방법과 측정 결과

모든 생성 결과를 이미지로 확인하고 선택본 PNG를 읽기 전용으로 분석했다. 이미지 픽셀을 수정하지 않았다. 상단 좌우 텍스처의 양 끝 열/행 RGB 절대차 평균(MAE, 0–255)을 계산하고, 내부 인접 픽셀 차와 비교했다. 경계 픽셀의 완전 일치 자체가 자연스러운 타일의 충분조건은 아니지만, 경계 차이가 내부 차이보다 크게 뛰므로 무봉제 통과 판정을 할 수 없다. 실제 반복 배치에서 이어지는 풀잎·밝기와 눈에 띄는 반복 무늬도 추가 정리가 필요하다.

| 스타일 / 바닥 | 좌우 경계 MAE | 상하 경계 MAE | 내부 가로 인접 MAE |
|---|---:|---:|---:|
| A 초원 | 7.59 | 21.86 | 1.95 |
| A 흙 | 6.36 | 16.01 | 1.44 |
| C 초원 | 8.51 | 22.50 | 2.96 |
| C 흙 | 7.57 | 16.59 | 2.78 |
| D 초원 | 2.87 | 8.78 | 1.43 |
| D 흙 | 6.10 | 8.81 | 1.37 |

하단에서 R>230, G<25, B>230인 마젠타 계열 픽셀을 검사했다. 정확한 (255,0,255) 비율은 A 0%, C 0%, D 약 0.002%였다. 가장 흔한 값은 A (252,3,250), C·D (252,2,251)이며 미세한 색 변동이 있다. 눈에는 평평한 마젠타로 보이지만 정확한 단색 키는 아니다. 소품 밑에 뚜렷한 투사 그림자는 없으나 가장자리 혼색은 남는다.

상대적인 4×2 배열과 소품 8종의 순서는 세 키트 모두 들어 있다. A·C는 셀 안에 서로 분리되지만 하단 소품의 접지가 셀 바닥보다 높다. 색 임계값으로 추정한 A 소품 높이는 나무 228/226px, 덤불90px, 바위83px, 꽃60px, 그루터기75px, 울타리90px, 표지판153px이다. C는 나무241/240px, 덤불88px, 바위71px, 꽃54px, 그루터기73px, 울타리97px, 표지판165px이다. 이는 **1254 원본 좌표**의 근사 측정이며 요청한 단위 비율에 완전히 맞지 않는다. 특히 꽃과 표지판이 상대적으로 크고, 하단 기준점이 위로 뜬다. D에는 텍스처/마젠타 분할부의 한 줄 잔여색도 있어 셀 마스크 자동 측정을 그대로 신뢰할 수 없다.

씬은 모두 1024×1536, UI·문자 없이 세 영웅과 분홍 슬라임 3마리를 보여 준다. 영웅 높이는 육안 약150–170px로 화면 높이의 약1/10이다. 같은 키트의 나무·바위·울타리·표지판을 재현하지만 실제로 키트 비트맵을 코드로 복사 조립한 화면은 아니다. 나무 실루엣과 길 경계가 재해석되어 픽셀 단위 동일성은 없다. 하이 3/4 필드 구도는 읽히지만, 일부 나무·인물의 입면은 요구보다 정면에 가깝다.

### A — 제작 가능성 평가

**세 방향 중 제작 관리가 가장 수월해 보인다.** 단순한 실루엣, 갈색 외곽선, 종이 질감과 저채도 초록·베이지가 캐릭터 보드와 잘 연결된다. 두 번째 씬은 첫 씬보다 바닥 채도를 낮추고 나무를 키워 캐릭터 분리가 좋아졌다. 키트 세 번째 결과는 바닥이 다시 선명해져 톤이 더 차분한 두 번째를 선택했다.

타일링은 미완성이다. 위아래 경계의 밝기 차와 잘린 풀 무늬가 있어 반복용 원본의 경계를 정리해야 한다. 소품은 종류와 디자인 연속성이 좋지만 나뭇잎에 여러 명암 덩어리와 미세한 톤 변화가 남아 엄격한 ‘그림자색 한 단계’ 조건을 완전히 지키지는 못했다. 정확한 셀 크기, 꽃·바위 스케일, 하단 접지점과 순수 마젠타를 정리하면 다른 스타일보다 규칙적인 자산 제작으로 옮기기 쉬워 보인다. **현 결과는 톤 검증용이며 바로 잘라 쓰는 완성 키트는 아니다.**

### C — 제작 가능성 평가

수채 번짐, 종이 흰색, 소품의 끊긴 펜선이 캐릭터 C와 가장 뚜렷한 매체 일치를 보인다. 첫 키트는 바닥이 과밀해서 두 번째에서 옅고 성기게 만들었고, 세 번째에서 첫 줄 나무가 셀 경계를 넘던 문제를 줄였다. 씬에서도 보라·파랑·황토 캐릭터가 옅은 수채 바닥 위에 구분된다.

바닥 잉크선은 피했지만 수채 얼룩이 경계를 가로질러 이어지지 않고, 같은 얼룩이 반복되면 패턴이 보일 수 있다. 나무·덤불의 디테일이 캐릭터 크기에서 뭉칠 수 있고 씬의 나무는 키트보다 가지와 줄기가 늘어났다. 소품 간 워시 강도·선 밀도를 통일하는 추가 관리가 필요하다. **시각적 톤 매칭은 좋고 제작 가능성은 있으나, A보다 반복 타일과 소품 일관성 유지 비용이 높다.**

### D — 제작 가능성 평가

키트는 도트 실루엣과 반복 무늬의 방향만 확인한다. 세 번째 키트는 외곽이 더 굵고 대비가 높아져 두 번째를 선택했다. 씬의 두 번째 결과는 픽셀을 크게 만들면서 캐릭터 개성이 약해졌고, 세 번째에서 보드 D를 다시 참조해 머리·장비 특징을 일부 회복했다. 그래도 배경과 인물의 도트 크기 차이가 남고, 나무는 요구한 영웅 3배보다 작다.

**진짜 고정 격자 픽셀 아트 제작 검증은 실패했다.** 627px 사분면은 요청한 768px가 아니며, 32×32 원본 타일을 최근접 6배 확대한 동일한 4×4 복제본으로 볼 수 없다. 초원/흙 사분면의 고유 RGB 값은 각각 10,472 / 16,260개다. 선택한 scene_D는 134,263색이고, 원점에 맞춘 4×4 블록 98,304개 중 완전 단색인 블록은 15개뿐이다. 따라서 프롬프트의 32색·최근접 4배 씬도 성립하지 않는다. 배경 그라데이션·안티앨리어싱·미세한 중간색이 남아 있다.

원래 D 캐릭터 보드 자체도 기존 평가에 기록된 대로 정확한 네이티브 격자 원본이 아니다. 그러므로 ‘D 보드와 같은 픽셀 격자’의 엄밀한 기준부터 확정해야 한다. **이 결과만으로 배경까지 제작 가능한 도트 파이프라인을 검증했다고 말할 수 없다.** 네이티브 타일과 캐릭터·소품의 공통 격자 및 팔레트를 정해 별도로 제작해야 한다.

### 사용 프롬프트 원문

아래는 생략 없이 실제 호출에 전달한 프롬프트다. 첫 키트의 참조는 각 스타일 보드 하나다. 이후 키트 수정은 직전 결과를 참조했다. 첫 씬의 참조1은 위 표의 선택 키트, 참조2는 해당 스타일 보드다. scene_A 수정은 직전 씬+선택 키트, scene_C 수정은 직전 씬, scene_D 두 번째는 직전 씬+선택 키트, 세 번째는 직전 씬+원본 D 보드를 참조했다. 모든 호출의 transparent_background는 false였다.

#### bgkit_A.png

<details>
<summary>1번째 호출 — 생성</summary>

```text
Use case: stylized-concept. Generate ONE production background asset atlas for Mini Midgard, exactly square 1536x1536 PNG. The input image is STYLE reference only, not an edit target. No characters in this atlas. No labels, text, grid lines, borders, watermarks.
EXACT LAYOUT, edge-to-edge: upper left x0..767 y0..767 is seamless meadow ground texture; upper right x768..1535 y0..767 is seamless dirt/forest floor ground texture. Each quadrant must wrap perfectly left/right and top/bottom, with even edge colors, no edge frames, no lighting gradient, no vignette. Short pale grass with sparse tiny flowers/pebbles only, no large objects, no focal motif. Dirt is a continuous texture, NOT a path stripe.
Entire bottom x0..1535 y768..1535 is PERFECTLY SOLID pure RGB(255,0,255) #FF00FF, absolutely no noise, gradients, light effects or shadow. Eight distinct cutout props arranged in an invisible 4-column by 2-row grid with 384x384 cells. Row 1 y768..1151: round leafy tree; pine tree; bush; rock cluster. Row 2 y1152..1535: flower patch; tree stump; wooden fence segment; blank wooden signpost. No extra props, duplicates or plants around prop feet.
All props high 3/4 top-down classic 2D MMORPG camera, orthographic, canopy tops visible. No cast or contact shadows. Each centered horizontally within its own cell; contact point 18px above cell bottom (row baselines y1134,1518). Objects never cross cell boundaries. Scale: trees about 300px high (3 units), bush 100px (1 unit), rocks 70px (0.7), flower patch 40px (0.4), stump70px, fence100px, sign140px. Do NOT enlarge little props to fill cells. Trees less than 330px wide.
Background assets calmer and lower contrast than reference heroes. Harmonious muted palette, readable silhouettes. Avoid glossy AI landscapes, realistic grass, god rays, bloom, DOF, horizon, dramatic lighting.
STYLE A: closely match reference A's flat cut-paper shapes, a single dark brown silhouette outline, at most one flat shadow tone, subtle matte paper texture within colored shapes. Muted pastel sage meadow and pale warm beige earth. Brown outlines gentler than character outlines. Simple rounded chunky tree crowns, flat graphic overlapping foliage sections. No gradients or volumetric shading. Magenta remains untextured.
```

</details>

<details>
<summary>2번째 호출 — 수정</summary>

```text
Edit this A atlas only. Keep its exact 1536x1536 dimensions, upper 768px-high ground quadrants and the existing eight prop designs/order. Correct BOTTOM PROP SCALE and FLAT SHADING. Use pure #FF00FF flat background, no shadows. The tree heights must be 300px, bush100px, rock cluster70px, flower patch40px, stump70px, fence100px, sign140px. Current small objects are far too big. SHRINK them in place, allowing LOTS OF EMPTY MAGENTA. Horizontal centers192,576,960,1344. Ground-contact baselines EXACTLY y1134 for first row and y1518 for second row. All props remain within their original 384px cells. Keep tree tops high 3/4 overhead view. Tree foliage only base color and ONE flat shadow color, no third shade; very subtle paper texture. Props must not cast any shadow. Ground remains quiet and seamless on both axes; no new text or objects.
```

</details>

<details>
<summary>3번째 호출 — 수정</summary>

```text
Final correction of this A background atlas. Export PNG at EXACT1536x1536 actual pixels. The supplied image is1254x1254 and MUST NOT remain that size. Re-render at1536 square with quadrant split at x768/y768, bottom cells384x384. Preserve designs/order/style, no extra objects or text. Make both upper ground textures seamlessly wrap: opposite perimeter pixels match, motifs crossing an edge continue exactly on the opposite edge; no visible joins when repeated2x2. No lighting gradient. Subtle flat pastel paper texture. Bottom empty background exactRGB(255,0,255) everywhere, zero grain. Place all props wholly within respective cells. Ground contacts only18px above cell bottoms, at y1134/1518. Trees300px tall, bush100px, rocks70px, flower patch40px, stump70px, fence100px, sign140px. Keep small objects this SMALL, with ample magenta. Flat shape outlines and at most ONE flat shadow tone per material, no cast shadows.
```

</details>

#### scene_A.png

<details>
<summary>1번째 호출 — 생성</summary>

```text
Use case: stylized-concept. Create ONE in-game screenshot mock, portrait PNG EXACT1024x1536 pixels. Reference1 is the chosen BACKGROUND KIT: use its SAME ground colors, marks and eight prop designs, assembled as reusable 2D map assets. Reference2 is the CHARACTERS style/identity board. No UI, no text, no labels, no border.
Camera high3/4 top-down orthographic classic2D MMORPG, no horizon, no perspective vanishing point. Large scrolling meadow field, pale dirt path bending across it, a few repeated kit trees along map edges, one bush, rock cluster, little flowers, stump, short fence, blank signpost. Natural sparse map placement and broad playable open area; no dense decoration or dramatic landscape.
Exactly THREE small heroes fighting exactly THREE pink jelly slimes in the central open field. Real game scale: human hair-to-sole height only150px (ONE TENTH of1536), slime about70px. Do not enlarge heroes for illustration; field covers most of screenshot. Preserve each reference design: ivory-bob cowlick Novice girl in ochre tunic/brown shorts/mismatched socks lunging with tiny dagger toward one slime; spiky cobalt-haired Swordsman in blue tunic/gray breastplate, blue round shield and sword braced against second slime; sleepy lilac-bun Mage in violet/gold robe holding cyan-orb wooden staff toward third slime. Original slimes rounded asymmetrical pink jelly bodies, tiny folded top fin, two stubby flipper feet, little eyes and sideways mouth. Exactly three humans and three slimes, spatially separated with readable silhouettes, no duplicates. Combat poses, no large spell effects or particles. Trees about3 times hero height, bushes1, rocks0.7, flowers0.4. Consistent high3/4 ground contact and y-sort occlusion, soft tiny game-added contact shadows allowed.
Calm low-contrast background, heroes more saturated and darker outlined so readable. Looks assembled from provided kit, not new painterly scenery. Avoid bloom, god rays, glossy effects, DOF blur, photoreal grass.
STYLE A: Flat cut-paper shapes, one dark-brown outline, at most one flat shadow tone. Subtle matte paper texture, pale muted sage meadow and beige path exactly matching kit. Preserve characters' stronger ivory/ochre, cobalt and purple colors.
```

</details>

<details>
<summary>2번째 호출 — 수정</summary>

```text
Edit scene A, keep exact1024x1536 portrait output, all three150px heroes and exactly three70px slimes, existing combat poses/positions/identities, path and prop designs. Change ONLY background tone and tree scale. Ground is too saturated: match reference2 kit's muted pale gray-sage and pale beige exactly, reduce ground motif contrast by30%. Enlarge trees to450px tall (3times a hero), move toward frame edges as needed, allow edge cropping, never cover battle figures. Keep bushes100-150px, rocks100px, flowers60px. Flat cut-paper silhouettes with a single dark-brown outline and at most ONE flat shadow tone per material. Subtle matte paper texture; no gradients, glow or extra objects. Must feel like a map assembled from reference2. No text/UI.
```

</details>

#### bgkit_C.png

<details>
<summary>1번째 호출 — 생성</summary>

```text
Use case: stylized-concept. Generate ONE production background asset atlas for Mini Midgard, exactly square 1536x1536 PNG. The input image is STYLE reference only, not an edit target. No characters in this atlas. No labels, text, grid lines, borders, watermarks.
EXACT LAYOUT, edge-to-edge: upper left x0..767 y0..767 is seamless meadow ground texture; upper right x768..1535 y0..767 is seamless dirt/forest floor ground texture. Each quadrant must wrap perfectly left/right and top/bottom, with even edge colors, no edge frames, no lighting gradient, no vignette. Short pale grass with sparse tiny flowers/pebbles only, no large objects, no focal motif. Dirt is a continuous texture, NOT a path stripe.
Entire bottom x0..1535 y768..1535 is PERFECTLY SOLID pure RGB(255,0,255) #FF00FF, absolutely no noise, gradients, light effects or shadow. Eight distinct cutout props arranged in an invisible 4-column by 2-row grid with 384x384 cells. Row 1 y768..1151: round leafy tree; pine tree; bush; rock cluster. Row 2 y1152..1535: flower patch; tree stump; wooden fence segment; blank wooden signpost. No extra props, duplicates or plants around prop feet.
All props high 3/4 top-down classic 2D MMORPG camera, orthographic, canopy tops visible. No cast or contact shadows. Each centered horizontally within its own cell; contact point 18px above cell bottom (row baselines y1134,1518). Objects never cross cell boundaries. Scale: trees about 300px high (3 units), bush 100px (1 unit), rocks 70px (0.7), flower patch 40px (0.4), stump70px, fence100px, sign140px. Do NOT enlarge little props to fill cells. Trees less than 330px wide.
Background assets calmer and lower contrast than reference heroes. Harmonious muted palette, readable silhouettes. Avoid glossy AI landscapes, realistic grass, god rays, bloom, DOF, horizon, dramatic lighting.
STYLE C: match the supplied manga-watercolor board. Transparent watercolor washes, delicate pigment blooms and paper-white sparkle. Props have loose dip-pen dark-brown/black ink contours and a few broken interior ink lines; NO ink whatsoever on either ground texture. Very soft pale sage/mint meadow, pale warm buff dirt, extremely low contrast washes; colorful props still calmer than heroes. Watercolor edges and texture belong INSIDE prop silhouettes, never tint the perfectly solid #FF00FF key background. No smooth digital airbrush or glossy surfaces.
```

</details>

<details>
<summary>2번째 호출 — 수정</summary>

```text
Edit this C watercolor atlas, maintaining exact square1536x1536 layout and all eight prop identities in same cells. Two corrections:
1. Upper ground quadrants: make BOTH textures much paler, quieter and sparser. Reduce motif count to ONE QUARTER and contrast to ONE THIRD. Pale sage watercolor meadow with mostly bare pale wash and very few tiny grass sprigs, pale buff dirt with almost no twigs/leaves. NO ground ink outlines. Seamless opposite edges with uniform value and no perimeter border; gentle transparent washes and fine paper-white sparkle.
2. Bottom props: SHRINK to correct scale. On original1536x1536 canvas, tree300px tall, pine300px, bush100px, rocks70px, flowers40px, stump70px, fence100px, sign140px. Very small flowers/rocks required. Centers x192,576,960,1344, contact baselines y1134 and1518. Leave vast blank space above little props. Keep high3/4 angle, watercolor blooms and dip-pen ink on props ONLY, no cast/contact shadows. All empty bottom pixels exactly solid #FF00FF, no color variation. No text.
```

</details>

<details>
<summary>3번째 호출 — 수정</summary>

```text
Final technical correction to this C atlas. OUTPUT EXACT1536x1536 PNG, NOT1254x1254. Preserve the pale watercolor ground tones, eight prop designs and sizes, broken dip-pen ink on props ONLY. Correct prop anchors: the FIRST ROW trees/bush/rocks must end at74% of full image height, safely ABOVE the75% horizontal cell divider; the SECOND ROW props must end at98% of full image height. First row currently hangs over its75% cell boundary: move all four props upward accordingly. No grid lines. Keep first/second row props distinct. Target trees300px,bush100px,rock70px,flower40px,stump70px,fence100px,sign140px on1536 canvas. All empty lower half is one pure flatRGB255,0,255 color with no shadows or noise. Upper left768x768 meadow and upper right768x768 dirt must tile perfectly in both axes: opposite edges continuous and matching, no cropped motif discontinuities, no broad light/dark bias. Keep pale transparent washes and sparse tiny natural motifs; no ink on ground. No text or other changes.
```

</details>

#### scene_C.png

<details>
<summary>1번째 호출 — 생성</summary>

```text
Use case: stylized-concept. Create ONE in-game screenshot mock, portrait PNG EXACT1024x1536 pixels. Reference1 is the chosen BACKGROUND KIT: use its SAME ground colors, marks and eight prop designs, assembled as reusable 2D map assets. Reference2 is the CHARACTERS style/identity board. No UI, no text, no labels, no border.
Camera high3/4 top-down orthographic classic2D MMORPG, no horizon, no perspective vanishing point. Large scrolling meadow field, pale dirt path bending across it, a few repeated kit trees along map edges, one bush, rock cluster, little flowers, stump, short fence, blank signpost. Natural sparse map placement and broad playable open area; no dense decoration or dramatic landscape.
Exactly THREE small heroes fighting exactly THREE pink jelly slimes in the central open field. Real game scale: human hair-to-sole height only150px (ONE TENTH of1536), slime about70px. Do not enlarge heroes for illustration; field covers most of screenshot. Preserve each reference design: ivory-bob cowlick Novice girl in ochre tunic/brown shorts/mismatched socks lunging with tiny dagger toward one slime; spiky cobalt-haired Swordsman in blue tunic/gray breastplate, blue round shield and sword braced against second slime; sleepy lilac-bun Mage in violet/gold robe holding cyan-orb wooden staff toward third slime. Original slimes rounded asymmetrical pink jelly bodies, tiny folded top fin, two stubby flipper feet, little eyes and sideways mouth. Exactly three humans and three slimes, spatially separated with readable silhouettes, no duplicates. Combat poses, no large spell effects or particles. Trees about3 times hero height, bushes1, rocks0.7, flowers0.4. Consistent high3/4 ground contact and y-sort occlusion, soft tiny game-added contact shadows allowed.
Calm low-contrast background, heroes more saturated and darker outlined so readable. Looks assembled from provided kit, not new painterly scenery. Avoid bloom, god rays, glossy effects, DOF blur, photoreal grass.
STYLE C: Match the reference's transparent watercolor washes with pigment blooms and paper-white sparkle. Dip-pen ink on props and characters ONLY, NO ink lines on ground. Soft PALE ground, nearly white mint/sage meadow and pale cream buff dirt exactly as kit; tiny sparse motifs. Same inked kit tree canopies, pine, stump, fence, blank sign. Colors strongest on heroes, never glossy. Tree height450px versus human150px; place trees at frame edges to preserve open space. No other scene subjects.
```

</details>

<details>
<summary>2번째 호출 — 수정</summary>

```text
Edit this C watercolor screenshot, preserving exact1024x1536 portrait, same three150px heroes fighting same three70px pink slimes, all combat poses, identity, path route and camera. Only improve tree scale and background calmness: trees are too short, so enlarge the same kit trees to450px high, about3times a hero, push them to screen edges and crop them when needed so heroes/slimes stay fully visible. Keep transparent pale watercolor ground without ink outlines; decrease ground pigment contrast15% to let figures stand out, retain blooms and paper white. Use same kit tree/stump/fence/sign shapes and broken ink on props only. Preserve flowers, no extra objects, no text/UI.
```

</details>

#### bgkit_D.png

<details>
<summary>1번째 호출 — 생성</summary>

```text
Use case: stylized-concept. Generate ONE production background asset atlas for Mini Midgard, exactly square 1536x1536 PNG. The input image is STYLE reference only, not an edit target. No characters in this atlas. No labels, text, grid lines, borders, watermarks.
EXACT LAYOUT, edge-to-edge: upper left x0..767 y0..767 is seamless meadow ground texture; upper right x768..1535 y0..767 is seamless dirt/forest floor ground texture. Each quadrant must wrap perfectly left/right and top/bottom, with even edge colors, no edge frames, no lighting gradient, no vignette. Short pale grass with sparse tiny flowers/pebbles only, no large objects, no focal motif. Dirt is a continuous texture, NOT a path stripe.
Entire bottom x0..1535 y768..1535 is PERFECTLY SOLID pure RGB(255,0,255) #FF00FF, absolutely no noise, gradients, light effects or shadow. Eight distinct cutout props arranged in an invisible 4-column by 2-row grid with 384x384 cells. Row 1 y768..1151: round leafy tree; pine tree; bush; rock cluster. Row 2 y1152..1535: flower patch; tree stump; wooden fence segment; blank wooden signpost. No extra props, duplicates or plants around prop feet.
All props high 3/4 top-down classic 2D MMORPG camera, orthographic, canopy tops visible. No cast or contact shadows. Each centered horizontally within its own cell; contact point 18px above cell bottom (row baselines y1134,1518). Objects never cross cell boundaries. Scale: trees about 300px high (3 units), bush 100px (1 unit), rocks 70px (0.7), flower patch 40px (0.4), stump70px, fence100px, sign140px. Do NOT enlarge little props to fill cells. Trees less than 330px wide.
Background assets calmer and lower contrast than reference heroes. Harmonious muted palette, readable silhouettes. Avoid glossy AI landscapes, realistic grass, god rays, bloom, DOF, horizon, dramatic lighting.
STYLE D: TRUE low resolution pixel art matching reference D's chunky outlined sprite designs. Muted sage greens, dusty beige earth, low contrast background and limited solid-color palette. CRITICAL TECHNICAL CONSTRUCTION: each upper 768x768 quadrant must be EXACTLY a 4x4 repetition of ONE seamless 32x32 native art-pixel tile enlarged 6x using nearest-neighbor. Thus each tile 192x192 output pixels, each single art pixel is a solid 6x6 square, origin at canvas (0,0). All sixteen tile copies IDENTICAL, not sixteen variations. Both grass and earth use this same 6px art grid. Grass just a pale flat sage base with 2-3 tiny understated pixel tufts, earth a flat pale beige base with a few understated specks. No noisy texture.
Props likewise drawn on the same crisp 6x6 output pixel grid, one native pixel selective outline, restrained clusters, <=16 solid colors per prop. Native tree about50px high, bush17px, rocks12px, flowers7px. Crisp stair-step blocks only, no subpixel edges, blur, anti-aliasing, color gradients, painted texture, dithering, background variation or gloss. Pure magenta key is one exact uniform color. The supplied D image is identity/style reference, but remove its blurry nonuniform pixel defects.
```

</details>

<details>
<summary>2번째 호출 — 수정</summary>

```text
Correct this D atlas. REQUIRED OUTPUT FILE RESOLUTION exactly1536x1536 pixels, not1254x1254. Same layout: two768x768 ground quadrants above, eight props in384x384 cells below. This is technical pixel art, not a painted imitation. Remove all smooth background gradients and ALL antialiasing. Every art pixel exactly6x6 solid output pixels aligned to origin0,0. For grass make ONE32x32 art-pixel seamless tile in 4 solid colors (flat pale sage base, two muted grass colors, one tiny pale pebble) and repeat that IDENTICAL tile4x4 to fill768x768. Dirt similarly ONE32x32 tile, 4 solid pale buff colors, repeated4x4. No conspicuous white flowers repeating. No variation between repeated tiles or across base colors.
Keep the eight prop identities/order and high3/4 view. Use <=16 discrete solid colors each. Tree and pine300px tall, bush102px, rocks72px, flowers42px, stump72px, fence102px, sign138px. Centers x192,576,960,1344. Bottom contacts at y1134 first row and1518 second row. Tiny objects stay tiny within cells. Entire empty lower background exact solid RGB255,0,255. No shadows, text, gradients, filters or noise. Sharp square clusters like genuine native game sprites.
```

</details>

<details>
<summary>3번째 호출 — 수정</summary>

```text
Rebuild this D background atlas as TRUE PIXEL ART. Output PNG actual1536x1536, not1254. Keep composition and eight prop designs/order. TOP HALF: remove all existing smooth ground color variation. Replace grass with one perfectly UNIFORM SOLID pale sage field plus tiny muted pixel tufts; dirt perfectly UNIFORM SOLID buff plus tiny muted pixel flecks. Render each32x32 native tile only with4 exact solid colors, enlarge each pixel to6x6 hard square, repeat identical tile4x4 per768x768 quadrant. No blur, antialiasing, gradients or texture on any single art pixel. Repeated pattern and pixel grid must be mathematically identical, not hand-painted approximations.
BOTTOM: solid exact#FF00FF. Maintain single shared6px grid for every prop. Trees300px, bush102px, rocks72px, flowers42px, stump72px,fence102px,sign138px high. First-row bottom contacts at74% image height; second row98%. Each prop horizontally centered within own quarter-width cell. Keep silhouettes and high3/4 viewpoint. Each prop max16 solid colors. No shadows. No text. Entire artwork sharp pixel clusters only.
```

</details>

#### scene_D.png

<details>
<summary>1번째 호출 — 생성</summary>

```text
Use case: stylized-concept. Create ONE in-game screenshot mock, portrait PNG EXACT1024x1536 pixels. Reference1 is the chosen BACKGROUND KIT: use its SAME ground colors, marks and eight prop designs, assembled as reusable 2D map assets. Reference2 is the CHARACTERS style/identity board. No UI, no text, no labels, no border.
Camera high3/4 top-down orthographic classic2D MMORPG, no horizon, no perspective vanishing point. Large scrolling meadow field, pale dirt path bending across it, a few repeated kit trees along map edges, one bush, rock cluster, little flowers, stump, short fence, blank signpost. Natural sparse map placement and broad playable open area; no dense decoration or dramatic landscape.
Exactly THREE small heroes fighting exactly THREE pink jelly slimes in the central open field. Real game scale: human hair-to-sole height only150px (ONE TENTH of1536), slime about70px. Do not enlarge heroes for illustration; field covers most of screenshot. Preserve each reference design: ivory-bob cowlick Novice girl in ochre tunic/brown shorts/mismatched socks lunging with tiny dagger toward one slime; spiky cobalt-haired Swordsman in blue tunic/gray breastplate, blue round shield and sword braced against second slime; sleepy lilac-bun Mage in violet/gold robe holding cyan-orb wooden staff toward third slime. Original slimes rounded asymmetrical pink jelly bodies, tiny folded top fin, two stubby flipper feet, little eyes and sideways mouth. Exactly three humans and three slimes, spatially separated with readable silhouettes, no duplicates. Combat poses, no large spell effects or particles. Trees about3 times hero height, bushes1, rocks0.7, flowers0.4. Consistent high3/4 ground contact and y-sort occlusion, soft tiny game-added contact shadows allowed.
Calm low-contrast background, heroes more saturated and darker outlined so readable. Looks assembled from provided kit, not new painterly scenery. Avoid bloom, god rays, glossy effects, DOF blur, photoreal grass.
STYLE D: Genuine low resolution pixel art, matching reference D sprite silhouette and colors. ONE consistent native pixel grid across characters, props and ground, hard solid square clusters only. Render the whole scene at256x384 native art pixels and enlarge4x NEAREST NEIGHBOR to exact1024x1536. Hero height38 native pixels=152 output, tree114 native=456 output. Palette limited to32 total flat colors, each sprite<=16. NO smooth shading, gradients, blur, antialiasing, grain, painterly texture. Ground consists of exact repeated32x32 native grass tiles and dirt tiles based on kit, pale muted sage/buff, quiet small patterns. Use pixel-stair edges on path. Heroes stronger colors than background. Output should look like an actual pixel game screenshot, no modern illustrated rendering.
```

</details>

<details>
<summary>2번째 호출 — 수정</summary>

```text
Edit this D screenshot. Preserve exact1024x1536 canvas, three heroes and three slimes, their designs/combat poses/positions, same path route and same kit prop identities. Critical correction: render EVERY element on ONE identical4x4-output-pixel grid (native256x384). Characters currently have fine painted pixels inconsistent with large grass pixels. Rebuild their edges as crisp solid4px square clusters and simplify facial detail. NO antialiasing, smooth color gradients, blended edges or texture. Strict32-color global palette, solid flat sage ground and flat buff dirt with only few muted small pixel tufts. Ground palette exactly matches reference2 kit. Trees must be3times the150px heroes, about450px high, located near frame edges. Keep arena open. All pixel blocks same size on characters, props and ground. No text/UI/new creatures.
```

</details>

<details>
<summary>3번째 호출 — 수정</summary>

```text
Final edit of this D game screenshot, exact1024x1536. Reference1 is scene to edit, reference2 is original character identity reference. Keep scene layout and exactly3 heroes/3 slimes, humans150px tall. Correct render to real pixel art: only flat solid colors, no gradients or texture in grass, hair, wood or anywhere. Every pixel cluster composed of solid4x4px squares on a single fixed grid. Native256x384 image enlarged4x nearest neighbor. Max32 palette colors for whole image. Restore reference2's characteristic ivory-bob cowlick novice, spiky cobalt-haired determined swordsman with blue round shield, lilac-bun sleepy violet mage, folded-fin pink slimes with TWO flipper feet and tiny sideways mouths. Do not make featureless square-headed generic characters. Preserve simple costumes. Low contrast pale muted sage/buff kit background. Trees3times hero height, about450px; move large trees to frame edges and crop instead of shrinking. Keep silhouettes clear, no extra figures/text/UI.
```

</details>
