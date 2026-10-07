# 캐릭터 프레임 v2 — 목 틈 수정 · 남녀 분리 · 이목구비 분리 (Codex 의뢰)

## 요약 (사람용)
- 프레임 방식은 채택됐다. 다만 사용자가 지적한 대로 **얼굴과 몸 사이가 떨어져 빈 공간이 보인다.**
  - Codex의 원본 `player.py`로 그려도 똑같다(`docs/art/rig-frames/verification/cmp_idle_01.png`, `cmp_idle_02.png`).
  - 엔진 이식 문제가 아니라 에셋·계약 문제다.
- 추가 요구:
  - **남/여 분리**
  - **이목구비(눈·눈썹·코·입) 분리**: 캐릭터 생성 때 고를 수 있게 한다.
- 결과물은 `docs/art/rig-frames2/`에 둔다. v1은 비교용으로 남긴다.

---

## REQUEST (for Codex)

Your frame-sprite pilot (`docs/art/rig-frames/`, `minimidgard.frames/1`) was adopted. The game now plays it through a line-by-line port of your `player.py`. Three things must change. Again, you decide the production method, and you may change the contract (bump it to `minimidgard.frames/2`).

### 1. Fix: the head floats above the body (user-reported, highest priority)
- **What's wrong.** In every assembled frame there is a visible empty gap or white seam between the chin and the collar.
  - Hairstyle 02 also shows a hard straight cut on the left of the back hair, and the face base is patchy at the cut.
  - Reproduce with your own player:
    - `python3 player.py --class novice --state idle --hair 02`
    - `python3 player.py --class novice --state idle --hair 01`
  - The same happens in the game (the user's screenshot shows every pose of both classes).
- **Why your check missed it.** Your verification proved the anchor math, not the pixels.
- **The fix must make the join read as one character at any head angle.** The method is yours. Examples:
  - a neck stub in the head unit drawn **behind** the body collar (a new layer before the body);
  - head/neck overlap rules;
  - closing the collar opening in the body frames.
  - Hair layers must be complete shapes, with no clipped straight edges.
- **Add pixel-level checks to your verification and report them:**
  - **Seam check.** For every assembled frame, and with each face, hair and expression combination, mirrored too, sample the neck region between the chin and the collar. Fail on any transparent or background pixel inside the character silhouette there.
  - **Cut check.** Detect any straight alpha edge longer than ~12 source px inside hair and head layers that isn't the canvas edge.
  - **Visual sheet.** Save 3× close-ups of the neck join for all frames in `verification/neck_closeups.png`.

### 2. Male and female versions
- Provide **female and male** versions of the Novice and Swordsman sets: head base (face shape, jaw, ears), hairstyles and body frames.
  - The lineup (`docs/art/concepts/round3/class_lineup.png`) alternates genders. Use it as the design reference.
  - If you judge a body frame can be shared between genders without looking wrong, you may share it. Say which, and why, in PLAN.md.
- **Hairstyles for the pilot:**
  - female: 01 bob with ahoge, 05 high ponytail;
  - male: a short spiky style and a short side-part style.
  - Paint them cream for the engine's multiply tint, which tints only pixels with red > 127.
- The previous male faces in `round3/hair_faces.png` were almost identical to the female ones. The user wants them clearly different.
  - Male: thicker straight brows, narrower eyes, a slightly squarer jaw, no lashes.
  - Same art style.

### 3. Separate facial features, selectable in character creation
- Split the face into layers anchored to the head base:
  - **eyes** (one piece for 3/4 view is fine);
  - **brows**;
  - **nose**;
  - **mouth**.
- Each feature has **types** the player can pick, and the expressions change the variant:
  - **Eyes:** 3 types × {normal, hurt (squint), closed (ko / blink)}.
  - **Brows:** 3 types × {normal, hurt}.
  - **Nose:** 2 types.
  - **Mouth:** 3 types × {normal, hurt, ko}.
- Per-gender or shared feature sets: your call. Male-specific eyes and brows are probably needed for item 2.
- The body frame chooses the expression. The player's character chooses the types.
- **Anchors:** put them on the head base (eye line, brow line, nose, mouth). They must work for both genders' head bases.

### Deliverables, in `docs/art/rig-frames2/`
1. `PLAN.md` (Korean):
   - the neck fix and why it is robust;
   - gender handling;
   - the feature layer contract;
   - the layer order;
   - how it scales to 13 classes × 8 hairstyles × 2 genders.
2. Transparent PNG assets, `manifest.json` (`minimidgard.frames/2`) and an updated **reference player**, kept simple and deterministic. The game ports it line by line.
3. **Verification:**
   - the seam check, cut check and anchor checks above, reported in `verification/report.json`;
   - `preview_frames.png`: all frames, both classes, both genders, with 2 different feature combinations each;
   - `preview_faces.png`: every feature type and expression on both head bases;
   - `neck_closeups.png`;
   - an animated GIF of idle, walk and attack for both genders.
4. Be honest about remaining gaps.

### Constraints
- Keep the approved look: `class_lineup.png` and your v1 frames, which the user liked.
- **Do not redraw the body poses unless the fix needs it.**
- Flat colours, one hard shadow tone, thick dark-brown outline. No gradients, gloss or generic anime rendering.
- Work only in `docs/art/rig-frames2/`. Do not modify `src/`, `tools/` or other `docs` folders.
- Finish with a short Korean summary.
