상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude. 제작: Codex(아스트라). 결과물: `docs/art-production/pixel-hero-r8/`.

# 8라운드 — 도깨비의 세계 감성의 도트 쿠키 (2~2.5등신 / 3~4등신 둘 다)

## 사용자 말 (그대로)
- 도깨비의 세계(슈퍼캣, 2026) 게임 화면을 보고: "저런 느낌을 하고 싶었어. 지금까지 계속 도트 트오세 이야기를 했던 게. 도트가 아니어도 상관은 없는데. 저런 감성?"
- 등신을 2~2.5(도깨비의 세계)로 할지 3~4로 할지 묻자: **"둘 다 해보자"**

## 기준: 도깨비의 세계 캐릭터 (Claude가 플레이 영상에서 본 것)
- 진짜 도트로 그린 작은 꼬마 캐릭터입니다.
  - 머리가 큰 2~2.5등신입니다.
  - 외곽선이 또렷하고 어둡습니다.
  - 얼굴은 눈·눈썹·입만 있는 단순한 얼굴입니다.
  - 색 단계가 적고 밝은 면과 그림자가 분명합니다.
- 머리장식·무기를 바꿔 끼우는 방식입니다(라그나로크처럼).
- 화면에서는 작게 보이고, 빛과 그림자가 들어간 3D 배경 위에서 또렷하게 튀어 보입니다. 이 대비가 사용자가 말한 "감성"입니다.
- 아스트라도 공개된 쇼케이스 영상·기사를 직접 찾아봐도 됩니다. 단, 그 게임의 캐릭터·의상·이미지를 베끼거나 저장소에 저장하지 않습니다.

## 지난 도트가 실패한 이유 (반복 금지)
- 7월의 SD 쿠키와 6라운드 쿠키를 도트로 만들 때 큰 그림을 줄이기만 했습니다.
- 사용자는 "도트가 그냥 화질이 깨진 느낌"이라고 했습니다.
- **이번에는 처음부터 도트로 그립니다.**

---

## REQUEST (for Codex)

The reference is the in-game character look of **도깨비의 세계 (World of Dokkaebi, Supercat, 2026)**:
- small hand-pixelled chibi heroes with crisp dark outlines, simple faces, few colour steps;
- shown against richly lit backgrounds.

First write in `NOTES.md`, in your own words, what that character look is; you may look at its public showcase videos and articles. Copy none of its characters or costumes and save none of its images.

Make **쿠키, our female swordsman**, as genuine pixel art in **two proportions** (the user said "둘 다 해보자"):
- **P2:** about 2–2.5 heads (that game's proportion). Standing height about 44–48 px.
- **P3:** about 3–4 heads. Standing height about 60–64 px.

Her outfit is ours:
- light silver breastplate over a blue tunic;
- red waist sash;
- brown belt, gloves and boots;
- white trousers;
- one-handed sword;
- cream/light hair at shoulder length.

### Pixel rules
- Draw at native size: one image pixel is one art pixel. Use a 1 px dark outline (it may be coloured by the area it bounds) and no semi-transparent pixels.
- **No downscaling of a painted image.** If you start from a generated image, it must already be pixel art. Detect its pixel grid, sample one colour per cell, reduce to a fixed palette (at most 32 colours per character) and clean stray pixels and broken curves by hand.
- The face is simple and readable at 1×: eyes and a small mouth.

### Layers (same contract as `docs/art-production/pixel-hero/`, schema `minimidgard.pixel/1`)
- **Body per frame:** face, body, outfit and a close-cropped base hair. Paste the same head per pose (`up` / `hurt` / `down`) so the face never wobbles. Record `head.point` per frame.
- **Hair as a separate layer:** at least two styles, the default shoulder-length bob and one more (a ponytail). Each has front and back pieces per pose, in the four hair key colours `#F8F0E0 #E8D0B0 #C8A880 #8A6A50`, which the game palette-swaps.
- **Sword as a per-frame layer**, plus a finger overlay where the hand wraps the grip.
- Canvas 128×120 for both proportions, feet at (64,112), facing right (3/4).

### Motions
Follow `docs/art/MOTION_SPEC.md` (frame counts, key poses and timing):
- **idle 4, walk 8, attack 8, hurt 2, dead 4, sit 1.**
- Cast reuses idle in the manifest.

Rules from earlier reviews:
- The sword stays in the same hand in every frame.
- The body faces the same way; the torso never twists the other way.
- The far arm never crosses the chest.
- The walk alternates feet: the near leg is lighter. The arms swing and the body bobs (1–2 px at native size).
- Attack: hold on the wind-up peak and on the impact; never lift the sword again once it has come down.
- No specks.

### Deliver into `docs/art-production/pixel-hero-r8/`
- `manifest.json`: `minimidgard.pixel/1` with two characters, `swordsman_female_p2` and `swordsman_female_p3`. Each has its own `bodyHeight` and the animation table above. Include `hair` and `weapons`.
- `body/`, `hair/`, `weapons/` and `grips/` PNGs.
- Under `verification/`:
  - `review_p2.png` and `review_p3.png`: every frame at 4× nearest, sword and default hair on, numbered.
  - `play_p2.gif` and `play_p3.gif`: idle, walk and attack at 3× nearest.
  - `hair_swap.png`: both proportions × both styles × brown/black/pink, in a few poses.
  - `game_size.png`: both proportions side by side at 1× and 2× on a grass background.
- `NOTES.md` (the reference description first), `PROMPTS.json` and the build script.

Look at every frame yourself against the rules before finishing. Redo the frames that drift. Write only inside `docs/art-production/pixel-hero-r8/`. Do not change `src/` or other files. Do not commit or push. End with a short Korean summary.
