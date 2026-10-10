상태: 의뢰 (2026-10-10). 공방 검토 세션 승인 — 요청서 실수(정수리 순서 반대)를 사용자가 판정하기 전에 바로잡으려고 바로 보냅니다.
파이프라인: B-5-1 96px 시범, 걷기 ④ 사이 장(틀 T4) + 통과 2장 다시 그리기. 기준 기록: `docs/art/ssot/assassin_male_p96.md`. 조립표: `docs/art-production/pixel-assassin-96/assembly_walk.json`.

# 어새신 96px 걷기 — 내려앉음·올라섬 4장 + 통과 2장 다시

## 사용자 말 (그대로)
- "모션은 최소 6~8장은 써야 할 거 같아."
- "앞쪽 지지발과 뒷쪽 발이 흔들려서 캐릭터 전체가 흔들려 보여."
- 그림 규칙 세 가지:
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것

## 왜 통과 2장을 다시 그리나 (Claude의 실수)
- 지난 요청서에 '통과 장 정수리가 가장 높고, 접지 장은 3px 낮게'라고 적었습니다. 라그나로크 걷기 분해와 반대입니다.
- 라그나로크 걷기 분해(`docs/art/motion-templates/assassin-walk.json`)의 정수리 높이는 올라섬 0 → 접지 1 → 내려앉음 3 → 통과 2입니다.
  - 가장 높은 것은 통과 뒤의 올라섬입니다.
  - 가장 낮은 것은 접지 뒤의 내려앉음입니다.
  - 통과는 접지보다 조금 낮습니다.
- 지금 그대로 사이 장을 넣으면 몸이 7px씩 출렁입니다. 그래서 통과 2장을 기준 높이로 다시 그리고, 사이 4장을 더합니다.

---

## REQUEST (for Codex)

Draw the walk's in-betweens and redraw its two passing poses, so that the 8-frame walk (90 ms a frame, 720 ms a cycle, walking in place) rises and falls like Ragnarok Online's.

Attachments, in this order:
1. **The 96 px Assassin idle — style and look reference** (`docs/art/ssot/ssot96_assassin_idle_4x.png`). Re-attach it for every image.
2. **The approved walk contacts**: `keyposes/walk_1_contact_near/composite_4x.png` and `keyposes/walk_3_contact_far/composite_4x.png`. Keep these two as they are.
3. **The current passing poses** (`keyposes/walk_2_pass_near/…`, `keyposes/walk_4_pass_far/…`), for the leg positions only.
4. **Motion reference — Ragnarok Online Assassin walk, south-east sheet**: order and rhythm only. Copy no pixels and save none of it here.

Crown heights. The contacts stay at crown y = 130.

| Frame | Role | Crown y | Feet |
|---|---|---|---|
| 1 | contact, near foot forward (keep `walk_1`) | 130 | both on row 223, about 30 px apart |
| 2 | **down, near foot planted** (new) | **132** | near foot planted on row 223 where frame 1 put it; knee bent; far foot just leaving the ground behind |
| 3 | **passing, near foot planted** (redraw `walk_2`) | **131** | near foot planted on row 223 under the body; far foot lifted and passing it |
| 4 | **up, near foot pushing off** (new) | **128** | near foot on its toes on row 223 behind; far foot swinging forward, not yet down |
| 5 | contact, far foot forward (keep `walk_3`) | 130 | the mirror of frame 1 |
| 6 | **down, far foot planted** (new) | **132** | the mirror of frame 2 |
| 7 | **passing, far foot planted** (redraw `walk_4`) | **131** | the mirror of frame 3 |
| 8 | **up, far foot pushing off** (new) | **128** | the mirror of frame 4 |

- The planted foot is on row 223 in every frame. The rise and fall is in the drawing; the game does not move the frames up or down.
- From contact to the next contact, the planted foot moves backward by about half the step (≈15 px), evenly across frames 2–4 and 6–8, so it does not slide.
- The katar stays on the near hand and swings opposite to the near leg. The cloth tails trail behind, as in the key poses.
- Same canvas, scale, layers and rules as the key poses: 256×240, feet on (128,224), head no wider than 60 px, real alpha.

Deliver into `docs/art-production/pixel-assassin-96/keyposes/`:
- new folders `walk_5_down_near/`, `walk_6_up_near/`, `walk_7_down_far/`, `walk_8_up_far/`;
- `walk_2_pass_near/` and `walk_4_pass_far/` replaced. Move the old ones to `rejected/` with a reason line.

Also:
- `keyposes_walk.png` and `_4x`: the 8 frames in play order.
- In `NOTES.md`, one line per frame: look differences vs attachment 1, crown y, planted-foot x range on row 223.
- The images generated and rejected.

Do not change the contacts, the idle, the attack, or `src/`. Do not commit or push. End with a short Korean summary.
