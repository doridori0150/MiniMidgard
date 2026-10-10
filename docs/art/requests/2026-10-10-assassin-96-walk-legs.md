상태: 의뢰 (2026-10-10). 공방 검토 세션 승인. 파이프라인 B-5-1 96px 시범, 걷기 ④ 사이 장 고치기(틀 T4). 기준 기록: `docs/art/ssot/assassin_male_p96.md`.

# 어새신 96px 걷기 — 디딘 발 거리 고치기 (다리만 6장)

## 사용자 말 (그대로)
- "앞쪽 지지발과 뒷쪽 발이 흔들려서 캐릭터 전체가 흔들려 보여."
- 그림 규칙 세 가지:
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것

## 왜 다시 하나 (Claude의 수치 오류)
- 지난 요청서에 '디딘 발은 접지에서 다음 접지까지 반 걸음(약 15px)을 고르게 뒤로'라고 적었습니다. 틀린 수치입니다.
- 제자리 걷기에서 디딘 발은 반 바퀴(4칸) 동안 앞 접지 자리에서 뒤 접지 자리까지, 곧 한 걸음 전체를 가야 합니다.
- 지금은 디딘 발이 15px만 밀리고, 다음 접지 칸에서 12~19px을 한 번에 튑니다.
  - 223행 발 가운데 x, 재생 순서: 가까운 발 142 → 141 → 132 → 127 → (접지) 108, 먼 발 139 → 137 → 129 → 124 → (접지) 112

---

## REQUEST (for Codex)

**Redraw the legs only** in six walk frames: down, passing and up, for each foot. The planted foot then moves backward **evenly**, about 8 px a frame, and the next contact no longer jumps.

Keep everything above the hips exactly as it is now: head, crown height, face, torso, arms, katar, cloth tails. Keep both contact frames (`walk_1`, `walk_3`) unchanged.

Attachments, in this order:
1. **The 96 px Assassin idle — style and look reference** (`docs/art/ssot/ssot96_assassin_idle_4x.png`).
2. **The current 8-frame walk in play order** (`keyposes/keyposes_walk_4x.png`).

Targets: the centre x of the planted foot on row 223, in play order.

| Frame | Folder | Planted foot | Centre x on row 223 now | **Target** |
|---|---|---|---|---|
| 1 contact (keep) | `walk_1_contact_near` | near, in front | 142 | 142 |
| 2 down | `walk_5_down_near` | near | ~141 | **134** |
| 3 passing | `walk_2_pass_near` | near, under the body | 132 | **125** |
| 4 up | `walk_6_up_near` | near, toes, pushing off | 127 | **117** |
| 5 contact (keep) | `walk_3_contact_far` | far in front; near is the back foot | near 108 | 108 |
| 6 down | `walk_7_down_far` | far | ~137 | **132** |
| 7 passing | `walk_4_pass_far` | far, under the body | 129 | **125** |
| 8 up | `walk_8_up_far` | far, toes, pushing off | 124 | **118** |
| 1 contact (keep) | `walk_1_contact_near` | near in front; far is the back foot | far 112 | 112 |

- The swinging (lifted) foot passes the planted one and reaches forward toward the next contact.
- Bend the knees to suit: the down frames keep their crown at 132, so the legs must get there from the new foot positions.
- The planted foot is always on row 223.

Deliver by replacing the six folders in `docs/art-production/pixel-assassin-96/keyposes/`. Move the replaced ones to `rejected/walk_legs_previous/`.

Also:
- `keyposes_walk.png` and `_4x`, in play order.
- In `NOTES.md`, one line per frame:
  - the planted-foot centre x on row 223;
  - whether anything above the hips changed. It should not.

  Then give the images generated and rejected.

Do not change the contacts, the idle, the attack, or `src/`. Do not commit or push. End with a short Korean summary.
