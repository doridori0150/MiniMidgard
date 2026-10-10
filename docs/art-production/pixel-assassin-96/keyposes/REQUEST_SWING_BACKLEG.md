상태: 의뢰 (2026-10-11). 공방 검토 세션이 사용자 판정을 전하고 범위(휘두름 + 접촉 두 장)를 정함. 파이프라인 B-5-1 96px 시범, 공격 ④ 고치기(틀 T4). 기준 기록: `docs/art/ssot/assassin_male_p96.md`.

# 어새신 96px 공격 — 휘두름·접촉 두 장 뒷다리 고치기

## 사용자 말 (그대로)
- "어쌔신은 3번째 이미지인가에서 뒷발이 사라졌어."
  - 사용자가 본 그림은 판정판의 `side_by_side_attack`입니다. 순서는 준비·정점·휘두름·접촉·회수이고, 3번째는 휘두름 장입니다.
  - 접촉 장도 뒷발이 점처럼 보여 같은 판정을 받을 것이라, 공방 검토 세션이 두 장을 함께 고치기로 했습니다.
- 그림 규칙 세 가지:
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것

## 지금 상태 (Claude 측정)
- 휘두름(`attack_5_swing`)
  - 뒷발 부츠는 223행 x 105~114에 있습니다.
  - 몸 층에서 잔상이 지나가는 자리(199~212행, x 120~170)가 비어 있습니다. 허벅지와 엉덩이가 잘려 나간 형태입니다.
  - 게임 크기에서는 뒷다리가 몸과 끊어지고, 잔상 아래로 정강이와 발만 떠 보입니다.
- 접촉(`attack_3_contact`)
  - 뒷다리가 엉덩이에서 x 105까지 길고 가늘게(4~6px) 뻗어 있습니다.
  - 허리천 자락이 그 위에 겹칩니다.
  - 그래서 게임 크기에서는 발이 2~3px짜리 점처럼 읽힙니다.

---

## REQUEST (for Codex)

Redraw **the back leg only** in two attack frames, `keyposes/attack_5_swing/` and `keyposes/attack_3_contact/`. In each, the back leg must read as one solid leg, from the hip to a boot planted on the ground. It is the leg the body pushes off and leans on.

Keep everything else in both frames exactly as it is: head, face, hair layers, torso, both arms, the katar and its hand, the front leg.

Attachments, in this order:
1. **The 96 px Assassin idle — style and look reference** (`docs/art/ssot/ssot96_assassin_idle_4x.png`). Re-attach it for every image.
2. **The five attack poses in play order** (`keyposes/keyposes_attack_4x.png`: idle, wind-up, apex, swing, contact, recovery). Use the apex's back leg as the model of a back leg that reads well.
3. **The two current frames**: `keyposes/attack_5_swing/composite_4x.png` and `keyposes/attack_3_contact/composite_4x.png`.

### Swing (`attack_5_swing`)
- Draw the back leg whole in `body.png`, from the hip under the torso down to the boot. Its angle lies between the apex's and the contact's back leg. There must be no gap where the smear passes.
- The pale crescent smear stays on `katar.png`. It may cross the back thigh above the knee. It must not cover the back knee, shin or boot: zero smear pixels on rows 213–223 at x < 150. Bend only the smear's lower edge, and only if needed.

### Contact (`attack_3_contact`)
- The back leg is not a thin line stretched backward. Draw it as the planted leg that holds the lunge, about as thick as the apex's back leg, with the knee readable.
- The boot is a clear boot shape like the apex's: at least 8 px long on rows 216–223.
- The waist cloth tails must not cover the boot or the shin. Shorten or lift their ends if needed.
- The torso, the arms and the katar reach stay as they are. The contact is still the frame where the katar tip is furthest forward.

### Both frames
| What | Target |
|---|---|
| Back boot | planted on row 223; its rearmost pixel on rows 220–223 at **x = 105** (as in all five attack poses) |
| Unchanged | every pixel of `hair_back`, `hair_front` and `grip`; `body.png` outside the back-leg area (and, in the contact frame, the cloth tails' ends); `katar.png` except the swing smear's lower edge |

Deliver by replacing both folders. Move the old ones to `rejected/attack_5_swing_backleg_previous/` and `rejected/attack_3_contact_backleg_previous/`, each with a one-line reason.

Also:
- Rebuild `keyposes_attack.png` and its `_4x` version.
- Rebuild `side_by_side_attack.png`. The workshop review board shows this image to the user.
- In `NOTES.md`, one line per frame:
  - back boot x range on row 223 and its height in rows;
  - smear pixels on rows 213–223 at x < 150 (swing; should be 0);
  - changed pixels outside the back-leg area (should be 0, apart from the smear edge and the cloth ends).

  Then give the images generated and rejected.

Do not change any other frame, the idle, the walk, the assemblies, or `src/`. Do not commit or push. End with a short Korean summary.
