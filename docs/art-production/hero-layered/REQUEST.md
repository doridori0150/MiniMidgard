상태: 의뢰 (2026-10-11). 사용자 승인: "그래 그리고 이어서 진행해봐". 파이프라인 `docs/art/PIPELINE_LAYERED.md` ② 컨셉. 규격 `docs/art-production/hero-layered/spec.json`.

# 층 조립 영웅 ② 컨셉 — 남자 맨몸 대기 + 어새신 레고 머리 + 어새신 겉옷 + 카타르 (대기 1장)

## 사용자 말 (그대로)
- "이 스타일로 한 번 해보자. 도깨비의 세계란 게임이고. 보니까 몸통/얼굴/ 겉 의상을 따로 만들어서 합체 하는 형식으로 제작했네."
- "얼굴도 보니까 레고 머리처럼 되어 있어."
- "저 게임은 8방향이긴 한데 우린 일단 2방향 (좌/ 우)"
- "스프라이트는 기본 4장으로 동작이 크게 변경되는 부분을 기준으로."
- "무기와 이펙트는 레이어 추가하는 형태로."
- "96. 같은 키. 선명해야 뭐가 보이지"
- "다시 캐릭터부터 가자. 또 실수하지말고."
- 그림 규칙 세 가지:
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것

---

## REQUEST (for Codex)

Read `docs/art/PIPELINE_LAYERED.md` and `docs/art-production/hero-layered/spec.json` first. They are the spec; follow them exactly.

Make **one idle frame** of the new layered hero. Each layer is a separate image on the same 256×240 canvas, with the feet on (128,224) and the lowest foot row at y = 223. Draw the layers one at a time, in this order, and check each against the previous one before going on:

1. **Male bare body** (`bodies/male/idle/1_base/`)
   - Files: `body.png`, `near_arm.png`, `pose.json`.
   - Content: a slim young male figure, 96 px from crown to feet, standing idle, 3/4 view facing right.
   - Wears only a plain, tight, dark-grey base bodysuit. Skin shows at the neck and hands.
   - Leave the head out. Draw the neck up to its top, and give its top centre as `head.point` in pose.json.
   - The arm nearest the viewer goes in `near_arm.png`, not in `body.png`.
   - Every class of this build will wear clothes over this body, so keep it clean and simple.
2. **Assassin lego head** (`heads/assassin_male/front.png` + `pivot.json`)
   - One piece: face, hair and mask, no neck.
   - Size: **about 38 px from crown to chin** (40% of 96, about 2.5 heads), **no wider than 50 px** with the hair.
   - Look:
     - large amber eyes with one white highlight;
     - a dark cloth mask over the nose and mouth;
     - round, fluffy platinum hair with curved bangs, drawn in the four hair key colours `#faf0d7 #e1cdb8 #b49b91 #49342f` only (the game swaps them).
   - `pivot.json`: the point of the head that lands on `head.point`. The head covers the top 2 px of the neck.
3. **Assassin outfit** (`outfits/assassin_male/idle/1_base/`)
   - Files: `outfit.png` (torso, legs, far sleeve) and `outfit_arm.png` (near sleeve and glove).
   - Items: thin dark-brown sleeveless vest with V-shaped brass trim, navy scarf, two navy cloth tails hanging from the waist, dark gloves, dark boots.
   - Fit it to the body exactly. Do not change the body's outline, pose or feet. Clothes only.
4. **Katar** (`weapons/katar/idle/1_base/`)
   - Files: `weapon.png` and `grip.png`.
   - A wide-bladed punch dagger held in the near hand: the blade points forward from the fist.
   - Give the grip point, tip and angle in the body frame's `pose.json` (`weapon`), with `z`.
5. **Composite** (`concept/assassin_male_idle/`)
   - `composite.png` and `composite_4x.png`, stacked in the spec's layer order.
   - `layers_4x.png`: each layer alone, side by side, then the composite.

Attachments, in this order:
1. **Style reference: 도깨비의세계 (a released game) — two screenshots**
   - `reference/dokkaebi-style/01-front-pets.png` (front 3/4, idle)
   - `reference/dokkaebi-style/02-back-walk.png` (back 3/4, walking)

   Take the style only: chibi pixel sprite about 2.5 heads tall; clean outline; soft cel shading, 3 tones + highlight; big expressive eyes; hard pixel edges. Do not copy its character, its costume or any pixels.
2. **Our Assassin's design: what he wears and his face** (`docs/art/ssot/ssot96_assassin_idle_4x.png`, approved by the user)
   - Keep his items: face, mask, hair, vest, scarf, waist tails, katar.
   - Not his proportions. That image is about 2 heads tall; the new spec is about 2.5.
3. **An outside-tool test of the same description by the user** (`reference/pixellab/01-idle-8dir/montage_8dir_4x.png`, 58 px tall). It shows the direction this look can take in this style. It is not a pixel source; draw at our spec size.

Checks to report in `NOTES.md`, one line each:
- crown y, chin y, head height and head width (with hair) as placed;
- feet x ranges on row 223;
- that every layer is 256×240 with binary alpha;
- that the composite equals the layer stack;
- that `outfit.png` changes neither the body's outline nor its feet: count body pixels left visible outside the outfit where the outfit should cover.

Then give the images generated and rejected, with a reason for each rejection.

Deliver everything under `docs/art-production/hero-layered/`. Keep generation sources in a `sources/` folder next to each layer; it is not committed. Copy no reference image into the repo. Do not change `src/`, anything outside `docs/art-production/hero-layered/`, or commit or push. End with a short Korean summary.
