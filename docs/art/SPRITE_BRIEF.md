# 통짜 스프라이트 — 라인업 그림 그대로 프레임 애니메이션 (Codex 의뢰)

## 요약 (사람용)
- 사용자 판단: "캐릭터가 영 엉망이다, 차라리 스프라이트로."
  - 머리·헤어·이목구비를 몸에 조립하는 방식은 승인 원화(`class_lineup.png`)의 맛을 계속 깎았다. v3 비교 이미지에서도 이중 외곽선, 넓어진 머리형, 밋밋한 얼굴이 보인다.
- 방향:
  - **프레임마다 캐릭터 전체를 한 장으로 그린다(조립 없음).**
  - 바꿔 끼워야 하는 것만 얹는다. 머리장식과 무기는 프레임별 기준점에 붙이고, 머리색은 프레임별 머리카락 마스크로 바꾼다.
  - 헤어 모양·이목구비 선택은 포기한다. 직업×성별마다 라인업 디자인 1종으로 간다.
- 시범 범위: 라인업의 **초보자(여)**와 **검사(남)**. 게임 안에서 지금 방식과 나란히 비교한 뒤 전 직업으로 확장한다.
- 결과물은 `docs/art/sprites/`에 저장한다.

---

## REQUEST (for Codex)

The user looked at the assembled heroes (your v2/v3 frame sets with a separate head unit, hair layers and feature layers) and judged them a mess next to the approved art. The assembled versions are visibly worse than `docs/art/concepts/round3/class_lineup.png`. See your own `docs/art/rig-frames2/verification/features_v3_vs_original.png`: doubled hair outline, wider head, flatter face. The decision now is **whole-figure sprites**.

### Goal
For each pilot character, **every animation frame is one complete painted figure** — head, hair, face, body and outfit together, with no assembly. The idle frame must look like the lineup character itself.

Pilot characters, from `class_lineup.png`:
1. **Novice, female:** the cream bob with ahoge, tan tunic.
2. **Swordsman, male:** use the lineup swordsman's design with a clearly male face, short hair, blue tunic and silver plate.

### Frames (same timing as the game uses now)
| State | Frames |
|---|---|
| idle | 2 (breathing) |
| walk | 4 |
| attack | 3; the **contact frame is shown at 140 ms** of a 280 ms swing, and the blade points straight ahead |
| cast | 2 |
| sit | 1 |
| hurt | 1 (squint face) |
| dead | 1 (lying, eyes closed) |

Facing right; the engine mirrors for facing left.

### What stays swappable, and how
- **Weapons:** keep them **separate** images (dagger, sword) attached per frame at a `hand` anchor (point, angle, in front of or behind the body). Paint empty fists that a grip can sit in, and provide a grip overlay for the front fingers if needed, as in your v1.
- **Headgear** (leaf sprout, star hairpin): separate images placed at per-frame head anchors.
  - `crown`: top of skull.
  - `side`: the hair at the temple, for pins.
  - Each anchor has a head angle, so items follow the head tilt in hurt and dead.
- **Hair colour:** a per-frame **hair mask** (white = hair pixels to tint, black elsewhere), aligned 1:1 with the frame. Paint hair in the light cream base so a multiply tint works, or keep the lineup colour and say how tinting should work.
- Nothing else is swappable: hairstyle and face are fixed per character.

### Consistency is the main risk — address it
- The same character must stay the same across frames: face, hair silhouette, outfit details and proportions.
- Suggested method:
  1. Generate a whole state sheet per character from the lineup figure as an edit, with a pose guide if you like.
  2. Normalise it with your own script: key, palette-lock to flat colours, scale to a fixed height, align feet on the ground.
- The method is yours.
- **Measure drift:** head size and position per frame, colour palette match against the lineup, and silhouette height. Report the numbers. Fix any frame that drifts visibly.

### Deliverables, in `docs/art/sprites/`
1. `PLAN.md` (Korean):
   - the method;
   - the contract: canvas, origin at feet centre on the ground, frame list, anchors, hair mask, timing;
   - how it scales to 13 classes × 2 genders;
   - honest limits.
2. Transparent PNG frames, hair masks, and weapon/headgear images.
3. `manifest.json` (schema `minimidgard.sprites/1`) and a small deterministic **reference player** that the game will port line by line.
4. **Verification:**
   - `preview_vs_lineup.png`: the idle frame next to the lineup character at 240px and 80px;
   - `preview_frames.png`: all frames, with and without weapon/headgear, and with 3 hair tints;
   - an animated GIF of idle, walk and attack;
   - anchor checks: grip alignment, blade forward at 140 ms, headgear riding the head in every frame;
   - the drift numbers.

### Constraints
- Match `class_lineup.png` exactly in style: flat colours, one hard shadow tone, thick dark-brown outline. No gradients, gloss or generic anime rendering.
- Work only in `docs/art/sprites/`. Do not modify `src/`, `tools/` or other `docs` folders.
- Finish with a short Korean summary.
