상태: 의뢰 (2026-10-11). ② 컨셉 사용자 판정에 따른 수정. 파이프라인 `docs/art/PIPELINE_LAYERED.md` §3 비율 표(체형 수치를 넣어 갱신함), 규격 `docs/art-production/hero-layered/spec.json`.

# 층 조립 영웅 ② 컨셉 수정 — 체형을 두툼하게, 머리는 앞으로 낮게

## 사용자 말 (그대로)
- 첫 컨셉을 보고:
  - "몸과 얼굴 비율이 안 맞잖아. 몸이 너무 가늘고. 도깨비 캐릭터 비율 감사해봐."
  - "높이 비율보다는 체형 비율이 안 맞네. 얼굴이 너무 뒤로 가 있어서 앞으로 낮춰야 하고. 체형은 너무 마른 상태네"
- 이전 말(그대로 유지):
  - "이 스타일로 한 번 해보자. 도깨비의 세계란 게임이고. 보니까 몸통/얼굴/ 겉 의상을 따로 만들어서 합체 하는 형식으로 제작했네."
  - "얼굴도 보니까 레고 머리처럼 되어 있어."
  - "96. 같은 키. 선명해야 뭐가 보이지"
  - "그리고 알몸 상태로 그려야 옷을 덮을 수 있는 거 아냐?"
- 그림 규칙 세 가지:
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것

## 왜 다시 하나 (Claude의 규격 누락)
첫 요청서에는 머리 크기만 적고 체형 수치를 넣지 않았습니다. 그래서 몸이 마른 마네킹처럼 나왔고, 다리는 길고, 목이 보이며 머리가 뒤로 물러나 있었습니다. 레퍼런스를 같은 키로 맞춰 잰 값을 아래 표에 넣었습니다.

---

## REQUEST (for Codex)

Re-read `docs/art/PIPELINE_LAYERED.md` §3; the build table there is new. Redo the ② concept idle with the build fixed. Keep the head drawing.

1. **Male bare body** (`bodies/male/idle/1_base/`): redraw it in a chunky chibi build, as in the reference.

   | Part | Target |
   |---|---|
   | Shoulder width, arms included | **32–34 px** (now 22–24). The shoulders are about as wide as the head. |
   | Chest width, without arms | about 24–26 px |
   | Torso, chin to hips | about 39 px: chin y ≈ 166, hips y ≈ 205 |
   | Legs, hips to soles | about 18–19 px (now 24): short and sturdy |
   | Each leg | **8–9 px wide** (now 6–9) |
   | Each arm | **6–7 px wide** (now 4–5) |
   | Feet | lowest row y = 223, standing evenly |

   - Pose: a neutral, relaxed idle. Arms hang slightly away from the body, hands loose at the hips.
   - No hand on the hip. Every class wears clothes over this body, so the base pose must be neutral.
   - **Bare skin, not a bodysuit.** Draw a smooth skin-tone mannequin in plain underwear shorts only, with no anatomical detail. This is the base every outfit covers: with short sleeves or shorts, skin must show, never a grey suit. Use one skin ramp (3 tones + highlight, darkest tone as the outline).
   - The near arm goes in `near_arm.png`.
2. **Head: reuse `heads/assassin_male/front.png` as it is.** Do not redraw it. Its height is right. Change only where it sits, through `head.point`:
   - **Lower:** no neck shows. The chin overlaps the collar / shoulder line by about 3 px. Crown at y ≈ 128, chin at y ≈ 166.
   - **Forward:** the head's centre is about 3 px ahead of the torso's centre, toward the facing side (right).
3. **Outfit** (`outfits/assassin_male/idle/1_base/`): refit the same design to the new body.
   - Items: dark-brown vest with V-shaped brass trim, navy scarf, two navy waist tails, dark gloves, dark boots.
   - Make the brass trim and the scarf read at game size, using the spec's 3 tones + highlight.
   - Change neither the body's outline nor its feet.
4. **Katar:** keep `weapons/katar/idle/1_base/` and place it in the new near hand. Update `weapon` in `pose.json`.
5. **Composite** (`concept/assassin_male_idle/`): rebuild `composite.png`, `composite_4x.png`, `layers_4x.png`.

Attachments, in this order:
1. **The build audit**: the reference character and our first concept at the same height. Red line = chin, blue = shoulders, green = hips/hem. Match the reference's build and the chin-to-shoulder overlap.
2. **Style reference 도깨비의세계** (`reference/dokkaebi-style/01-front-pets.png`). Style and build only; do not copy its character, costume or pixels.
3. **The first concept** (`concept/assassin_male_idle/composite_4x.png`). This is what to fix.

Before replacing, move the first concept's body, outfit, katar pose and composite to `rejected/concept_v1/`, with one reason line: "too thin, neck showing, head set back".

Report in `NOTES.md`, one line each:
- the measured shoulder width (arms included), chest width, chin y, hips y, leg length, each leg's width at y = 214, each arm's width;
- the head centre x and the torso centre x;
- that the chin covers the collar (pixels of neck visible: 0);
- that skin pixels are visible only where the outfit leaves skin bare (hands, face area under the head = none);
- feet ranges on row 223; binary alpha; composite = stack; body pixels uncovered by the outfit = 0.

Then give the images generated and rejected.

Write only under `docs/art-production/hero-layered/`. Keep sources in `sources/`. Copy no reference image into the repo. No `src/` change, no commit, no push. End with a short Korean summary.
