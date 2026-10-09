상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude. 제작: Codex(아스트라), **한 번에 한 장씩**. 검수: 매 장 Claude. 결과물: `docs/art-production/pixel-hero-r11/`.

# 11라운드 — 쿠키 평타 6장을 장별로 만들어 합성

## 사용자 말 (그대로)
- 10라운드 평타를 보고: "어택 1, 2가 검이 반대 손에 있어 (몸통 뒷쪽)."
- "이거 한 번에 하지 말고, 스프라이트 6장에 대해서 장별로 만들어서 합성하는 걸로 하자. 이거 한 번에 만드니까 계속 찐빠나네."

## 10라운드에서 틀린 점 (Claude 확인)
- 검수 그림: `docs/art-production/pixel-hero-r10/verification/claude-review/fix1_attack_arms.png` (위: 몸만, 아래: 몸+검, 빨간 점 = 손잡이 기준점)
- attack_0·attack_1에서 검을 든 팔이 **몸통 뒤쪽(화면 왼쪽) 어깨에서** 올라옵니다.
- 정작 앞쪽(화면 오른쪽) 팔은 빈 주먹으로 허리 앞에 있습니다.
- attack_2부터는 검이 다시 앞쪽 팔로 돌아옵니다. 그래서 휘두르는 사이에 손이 바뀌어 보입니다.

## 진행 방식
- 실행 한 번에 **평타 한 장(`FRAME`)만** 만듭니다. Claude가 검수하고 통과시키면 다음 장을 의뢰합니다.
- 바탕은 10라운드 납품입니다. 대기·걷기·피격·쓰러짐·앉기와 머리카락 레이어·머리 그림은 그대로 둡니다.
- 이미 통과한 장은 `docs/art-production/pixel-hero-r11/APPROVED.md`에 적혀 있습니다. 이 장들은 바꾸지 않고, 이어지는 자세의 기준으로 씁니다.

## 장별 자세 (`docs/art/MOTION_REFERENCE.md` 평타 6장)

| 장 | 시간 | 자세 |
|---|---|---|
| 0 준비 | 110 | 몸을 뒤로 젖히고 몸통을 뒤로 비틂. 뒷발을 돌려 무게를 뒤로 실음. **앞쪽 팔(검 든 팔)을 위로·뒤로 들어 손이 머리 위 앞쪽에 오고, 칼날은 머리 뒤로 비스듬히 누움.** 먼 쪽 팔은 아래로 몸 뒤에 주먹. 잔상 없음 |
| 1 휘두름 1 | 40 | 몸통이 앞으로 돌기 시작. 앞쪽 팔이 머리 위에서 앞으로 넘어오기 시작. 칼은 머리 위에서 거의 수직. 칼 자리에 굵은 잔상(2~3px, 밝음 → 옅음) |
| 2 휘두름 2 | 40 | 몸이 앞으로 기욺. 앞쪽 팔이 가슴 앞으로 내려옴. 잔상이 몸 앞을 지나 사선 아래로 |
| 3 휘두름 3 | 40 | 앞발을 크게 내디딤(3~4px). 칼이 앞아래로, 잔상 끝이 앞아래에 닿음 |
| 4 맞는 순간 | 130 | 앞쪽 팔을 앞아래로 쭉 뻗음. 칼을 목표 쪽으로 1px 더 밈. **잔상 없음.** 칼끝에 바람 조각 2~3개. 뒷발 까치발 |
| 5 복귀 | 70 | 몸을 세우며 칼을 전투 대기 자세 쪽으로 거둠. 바람 조각이 흩어짐 |

### 모든 장에 공통
- **검은 늘 앞쪽 팔에 있습니다.** 10라운드 attack_2~4와 대기에서 검을 쥔 그 팔입니다. 몸 앞쪽(화면 오른쪽) 어깨에서 나오고, 몸통 위에 그려집니다.
- 앞쪽 팔이 머리 위로 올라가면, 팔과 손은 **머리 앞(얼굴 쪽 가장자리 위)**에 그립니다. 머리카락 뒤로 숨기지 않습니다.
- 먼 쪽 팔은 몸 뒤나 옆에만 둡니다. 검을 잡지 않고, 가슴 앞을 가로지르지 않습니다.
- 몸 방향은 대기와 같은 오른쪽 3/4입니다. 얼굴과 머리는 10라운드 머리 그림(`head`)을 그대로 붙입니다.
- 키와 발 위치는 대기와 같은 비율입니다. 발바닥은 y=112에 둡니다.

---

## REQUEST (for Codex)

The user wants the six attack frames made **one at a time and then composited**. This run makes **only attack frame `FRAME`** (given in the command).

1. Copy `docs/art-production/pixel-hero-r10/` to `docs/art-production/pixel-hero-r11/` if the r11 folder does not exist yet. Copy everything except `source/`. Create `APPROVED.md` there listing nothing.
   - Otherwise work in the existing r11 folder. Never change frames listed in `APPROVED.md`.
2. Paint attack frame `FRAME` to the table above. In particular:
   - The sword is held by the **near arm**, the one that holds it in idle and in r10 `attack_2`–`attack_4`. It comes from the front shoulder (screen right) and is drawn over the torso.
   - When raised above the head, that arm and hand are drawn **in front of the head's face-side edge**, not hidden behind the hair.
   - The far arm stays down behind the body.

   Method:
   - Generate this one pose as pixel art. Attach the design-C idle, the r10 head, and the previous approved frame (or idle for frame 0) as references.
   - Grid-snap it and paste the r10 head for the pose.
   - Clean by hand. Split the layers exactly like r10: body with the base hair, sword layer, grip overlay, and hair front/back via the existing hair pieces. Set `weapon.gripPoint`, `tipPoint` and `angleDegrees`.
   - Keep the r10 palette, size and feet line.
3. Update only this frame's entries in `manifest.json`. Keep `hitFrame: 4` and the durations from the table.
4. Write `verification/attack_<FRAME>_check.png`. It holds these, at 8× nearest with the grip point marked in red:
   - this frame's body only and body+sword;
   - next to it, the previous frame and r10's `idle_0`, so the arm continuity is visible.
5. Look at the check image yourself and verify:
   - the sword is in the near arm from the front shoulder;
   - the far arm is behind;
   - the facing matches idle;
   - the head is the pasted r10 head;
   - there are no specks.
   - If it fails, redo it (at most 2 retries). Then write the result into `NOTES.md` under `## attack_<FRAME>`.

Write only inside `docs/art-production/pixel-hero-r11/`. Do not change `src/`, r10, or other files. Do not commit or push. End with a short Korean summary of this one frame.
