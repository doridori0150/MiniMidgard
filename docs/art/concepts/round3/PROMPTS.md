# Round 3 이미지 생성 기록

## class_lineup.png 보정 프롬프트

디자인과 배치를 유지하면서 부드러운 명암을 단색 면으로 정리한다.

```text
Edit this class lineup sheet ONLY to enforce the flat-colour production style. Preserve all 13 characters, their exact proportions, body/head sizes, positions, silhouettes, costumes, weapons, poses, faces, Korean class labels, two-row/seven-column grid and empty bottom-left cell. Do NOT redesign anything.
Replace all smooth gradients, mottled texture and soft shaded patches with perfectly UNIFORM FLAT main colour plus at most ONE clearly bounded hard shadow colour per material. Especially flatten the cream hair, faces, coloured clothing, silver armour and weapons. Maintain the same main palette and thick dark brown outlines. No additional highlights, glossy shine, soft airbrushed shading or paper texture. Background must be a single uniform pale sage #E0E8C9, completely flat. Preserve exact Korean labels and every design/spacing invariant. This is a cleanup of colour rendering only.
```

## hair_faces.png 보정 프롬프트

첫 출력에서 남성형 일부의 옆머리가 짧아져, 같은 열의 앞·뒷머리 형태를 동일하게 맞추는 참조 편집을 수행한다.

```text
Edit this hair/face sheet with a single focused correction: the female/male pair in EVERY column must use IDENTICAL hair geometry and same skull size. Preserve the entire eight-column layout, all 16 heads, all Korean labels, the light cream palette and the exact three brown/blue/black tint locations. Currently the bottom male row omits the long side locks in columns 01, 05, 06, 07, 08. Restore those locks by using the TOP ROW hairstyle exactly in the corresponding bottom row. Also match top/bottom hair in columns 02,03,04; only existing brown/blue/black colours differ. Especially column 01 bottom must be the same approved complete bob as column 01 top, with no newly exposed ear.
The two FACE types must differ subtly but visibly: top row female faces have more softly arched thinner brows and slightly rounder simple vertical blue eyes; bottom male faces straighter thicker brows and slightly narrower blue eyes. Do not change face outline, size, ear/jaw geometry or feature positions between paired heads. Neither face gets eyelashes, makeup, blush or nose detail. Tiny friendly smiles remain.
Use SOLID FLAT fills and ONE HARD-EDGED shadow per material, including skin and tinted hair. Eliminate smooth gradients and texture. Dark brown thick outer lines, thin inner lines. Uniform solid pale sage background.
Column labels exactly: "01 기본 단발", "02 짧은 삐침", "03 옆가르마", "04 둥근 단발", "05 높은 묶음", "06 낮은 묶음", "07 작은 올림", "08 한쪽 땋음". Row labels "여성형", "남성형". Tint labels "갈색", "파랑", "검정". Keep three tint examples at bottom columns 02,03,04. Thirteen remaining heads cream. No bodies. No extra heads.
```

## hair_faces.png

```text
Use case: identity-preserve / stylized-concept.
Using the attached approved Novice part atlas as exact face/hair construction reference and the assembled preview as scale/style reference, create a hair and face concept sheet. This edits and expands the original single head design into a catalog, not a production atlas.

Deliver one high-resolution WIDE landscape sheet, about 2800 x 1000, uniform pale warm sage background, EXACTLY 16 HEADS ONLY, arranged in TWO ROWS of EIGHT evenly spaced columns. Row one all FEMALE faces; row two all MALE faces. Each column repeats the SAME hairstyle with the same geometry on both face types, proving interchangeable face and hair parts. Both genders share identical round face silhouette, identical jaw/ear position, skull width and height, identical hairline and eye locations. Female face: gently sloped brows and slightly rounder vertical blue eyes. Male face: a little straighter thicker brows and slightly narrower vertical blue eyes. Both subtle, cute, no nose rendering, tiny smile, no lipstick or blush or beard. All face RIGHT mild 3/4 just like the atlas. No necks, no bodies, no shoulders, no clothing, no hats.

Strict style: match the atlas head: thick dark BROWN outer line, thin inner lines, SIMPLE FLAT colours and ONE hard-edged shadow tone. No gradient, shine, smooth shading, texture, glossy hair or anime detail. Keep hair as a few broad solid clumps, rig-friendly front and back separated at ear and temple. All sixteen faces remain the same light warm skin colour and blue eyes.

Eight hairstyles left to right, IDENTICAL hair silhouette in female/male pair:
01 "기본 단발": exact approved ivory Novice bob, asymmetric chunky front locks, small single top ahoge, chin length.
02 "짧은 삐침": short crop, three broad chunky spikes toward crown/right, ears readable.
03 "옆가르마": smooth short side part, broad diagonal fringe, tapered short back.
04 "둥근 단발": round chin-length blunt bob, broad gently divided fringe, no ahoge.
05 "높은 묶음": compact high ponytail tied behind crown, one broad tail, side fringe; don't enlarge skull.
06 "낮은 묶음": low short ponytail behind head at nape on viewer-left, soft side part.
07 "작은 올림": compact rounded high bun behind crown, two short face-framing locks.
08 "한쪽 땋음": short side braid behind viewer-left ear, only three large braid segments, sweeping front locks, no accessory.

Exactly THIRTEEN heads have LIGHT CREAM BASE HAIR (#fff4d8 main and #e4cba5 single flat shadow). Exactly THREE of the sixteen existing heads are tint demonstrations (do NOT add extra heads):
- male row, column 02: brown multiply target #9f6339;
- male row, column 03: blue multiply target #5986d0;
- male row, column 04: black multiply target #59535d.
These three must look like the SAME cream hair tinted by RGB multiplication, flat colour plus one darker shadow, retaining readable broad shape. No pure featureless black fill. All other hair cream.
Place small clear Korean column titles above the eight columns, exact numbered labels: "01 기본 단발", "02 짧은 삐침", "03 옆가르마", "04 둥근 단발", "05 높은 묶음", "06 낮은 묶음", "07 작은 올림", "08 한쪽 땋음". Small row labels at far left: "여성형" for top, "남성형" for bottom. Small labels below ONLY the three tinted heads: "갈색", "파랑", "검정". No title, no swatches, no decorative graphics. All heads large enough to compare face differences and simple line construction. Exactly eight aligned pairs and no missing or additional head.
```

방식: 내장 `image_gen` 도구. 승인된 조립 프리뷰를 확장하는 참조 편집 방식이며, 아래 프롬프트로 컨셉 시트만 생성한다. 실제 부품은 제작하지 않는다.

## class_lineup.png

```text
Use case: identity-preserve / stylized-concept.
Edit and expand the approved assembled character sheet (reference 1) into a class costume approval sheet. Reference 2 is the approved scene style; reference 3 is the exact original component atlas. Preserve the Novice and Swordsman costume designs and the EXACT body proportions of reference 1, especially its first and fourth large characters. Do not imitate the scene's action poses.

Deliver one wide, high-resolution landscape image, about 2800 x 1400, pale warm sage solid background, clean editorial spacing. Exactly THIRTEEN full-body characters in a strict TWO ROW, SEVEN COLUMN grid. Top row has seven; bottom row first column EMPTY and its other six characters directly beneath their corresponding first jobs. No title, no extra drawings, no colour swatches. Small legible dark brown Korean labels under each character, exact labels below.

All thirteen share the SAME skeleton: identical oversized head scale, round face, tiny torso, short arms, stubby legs, identical crown-to-sole height and baselines. Match the reference's approximately 2-head-tall cutout chibi, NOT longer-legged anime chibi. All face RIGHT in mild 3/4 view, both feet on ground, same neutral idle stance, far arm relaxed, near hand holding weapon. Heads must not become smaller for upgraded jobs. Flat fills and exactly ONE hard-edged shadow tone, thick dark-brown outer outlines, thinner inner lines, NO gradients, NO shine, NO texture, NO painterly shading. Eyes simple blue vertical shapes, small brows, tiny smile, no nose rendering, no eyelashes beyond one tiny optional corner. Alternate female/male facial construction across reading order; same head size, same body.

TOP ROW columns 1 through 7:
1. label "초보자": female. EXACT approved cream ahoge bob, tan short-sleeved split tunic, dark brown belt and wrist cuffs, short bare knees, brown boots, small silver dagger held diagonally up-right. Preserve approved appearance.
2. "검사": male face subtle brow variation only, exact approved blue bob and ahoge, silver chest plate and round silver shoulder caps over royal blue tunic, narrow red hanging waist tab, brown cuffs and boots, silver sword up-right. Preserve approved costume, no shield added to this approved class.
3. "마법사": female, cream compact high bun with side locks, purple simple A-line robe, broad gold opening border, short shoulder capelet as collar, boots barely visible, wooden staff with small round turquoise stone in near hand, diagonal up-right. Same body height as novice.
4. "궁수": male, cream short side-swept hair, green short tunic with beige short sleeves and a small triangular green shoulder mantle, brown belt/boots, small quiver behind back that stays off the head, plain small wooden bow held in near hand, taut straight undrawn string at idle.
5. "성직자": female, cream short rounded bob, white ankle-length robe with a single broad blue center panel and rounded blue collar, gentle face, short mace with rounded lobed silver head and blue ring. NO religious crosses, no cross designs anywhere.
6. "도둑": male, cream cropped tousled hair, dark grey-violet short tunic, violet short scarf with one small tail behind torso, slim belt and short boots, short silver dagger.
7. "상인": female, cream low side ponytail, orange short-sleeved tunic, cream waist apron ending above knees, small belt pouch, brown boots, small practical single-bit iron axe.

BOTTOM ROW column 1 remains EMPTY, columns 2 through 7:
2. "기사": male, cream short swept hair; unmistakable Swordsman upgrade. Same royal blue/red family with broader silver segmented shoulder caps and heavier silver chest plate, blue split hip plates, red short cape BEHIND body, silver short greaves; small blue silver-rimmed shield on far forearm, a spear with silver leaf blade held in near fist tilted up-right, no sword in this sheet. Torso/limbs/head still EXACT novice lengths and size.
3. "위저드": female, cream short hair under a low soft navy pointed wizard hat with broad gold band (hat is accessory; head stays same size), navy ankle robe, broader gold borders, purple lining visible in separate short back cape; staff has a simple gold open crescent/cradle enclosing blue stone. More elaborate than mage but few large shapes, no stars sprinkled everywhere.
4. "헌터": male, cream short swept hair, forest-green layered short tunic, tan chest/waist guard, wider split green hip hem, brown gloves and boots, larger angular wooden bow, quiver low on back. BOTH shoulders clear, no falcon or bird, no shoulder pet/perch and no high shoulder decoration.
5. "프리스트": female, cream compact braid tucked behind head, white broad ankle robe, crimson center panel and rounded crimson shoulder yoke, thin gold circular clasp, slightly wider split hem than acolyte, silver mace with petal-like head and crimson handle detail. NO religious cross or cross motifs.
6. "어새신": male, cream cropped hair, deep-purple fitted short tunic with simple separate hip guards, crimson long scarf with two broad tails behind torso, dark boots/cuffs. A KATAR is WORN OVER near clenched fist: short broad triangular silver blade projects forward up-right from a gauntlet frame around knuckles; NOT a dagger held by its handle, NOT a sword.
7. "블랙스미스": female, cream compact bun, cream rolled short sleeves over brown work tunic, heavy dark-brown long leather apron with large squared hem and copper rivets, bulky brown gloves, wide boots, heavier single-bit axe with a broad silver wedge head. Orange small belt detail links merchant lineage.

Costumes must be original. Sleeves cover shoulder pivots, torso hems cover hips, no diagonal garment connecting rotating limbs, large scarves/capes/quivers distinct behind-body shapes. Clear silhouettes and large colour areas must survive 80px display. Uniform spacing, ample weapon clearance, no overlap with adjacent columns. Labels exactly once below each of the thirteen characters. Do not add any other characters.
```
