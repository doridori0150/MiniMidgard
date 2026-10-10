상태: 의뢰 (2026-10-10). 파이프라인 B-2 ④ 사이 장(틀 T4). 기준 기록: `docs/art/ssot/assassin_male_p2.md`(T0). 조립표: `docs/art-production/pixel-assassin-attack-keyposes/assembly.json`의 `between:1>2` 자리.

# 어새신 공격 — 잔상 사이 장 1장 (정점 → 접촉)

## 사용자 말 (그대로)
- 키포즈를 보고 한 판정: "예. 휘두르는 걸로 보이지만, 타격감이 좀 떨어져 보여. 동작이 단순해서 그런거 같은데. 그리고 앞쪽 지지발과 뒷쪽 발이 흔들려서 캐릭터 전체가 흔들려 보여."
- 그림 규칙 세 가지:
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것

## 왜 이 한 장인가
- 키포즈 4장(준비 → 정점 → 접촉 → 회수)은 외형 합격을 받았습니다.
- 정점에서 접촉으로 넘어가는 순간에 카타르가 몸 뒤에서 앞으로 한 번에 건너뜁니다. 그래서 휘두름이 '찍힘'처럼 보입니다.
- 라그나로크 어새신 공격도 이 자리(5번째 장)에 큰 가로 잔상 한 장을 둡니다. 기사 r15의 큰 부채꼴 잔상과 같은 역할입니다.

---

## REQUEST (for Codex)

Draw **one in-between frame**: the **swing** of our Assassin's attack, between key pose 2 (apex) and key pose 3 (contact). The four key poses are approved for look. This frame goes in the slot `between:1>2` of the assembly table.

Attachments, in this order:
1. **Look reference — our Assassin idle frame 0** (`docs/art/ssot/look_assassin_idle0_1x.png`, `_4x.png`). Keep its face, mask, hair (four hair key colours), outfit, navy cloth tails, brass trim, palette, and the katar on the near hand.
2. **Before — key pose 2, apex** (`docs/art-production/pixel-assassin-attack-keyposes/poses/2_apex/composite_4x.png`).
3. **After — key pose 3, contact** (`docs/art-production/pixel-assassin-attack-keyposes/poses/3_contact/composite_4x.png`).
4. **Style reference — Knight r15 idle frame 0** (`docs/art/ssot/style_knight_r15_idle0_4x.png`): pixel density, outline weight, shading only.
5. **Motion reference — Ragnarok Online Assassin (male, dagger), south-east sheet**, row "w-attack1", **frame 5** (the wide horizontal smear). Take the shape and placement of the swing only. Copy no pixels and save none of it here.

The frame:
- **Role:** the swing. The katar is halfway along its arc, from behind the body to in front of it, at waist height.
- **Smear:** a wide pale crescent trail behind the blade along that arc. Draw it on the **weapon layer** (`katar.png`), like the Knight r15 attack smear. The body has no smear.
- **Body:** halfway between attachments 2 and 3. The weight is moving onto the front foot, the front foot is planting, and the torso turns toward the target. Same face, hair and outfit as attachment 1.
- **Feet — the user saw the feet wobble:**
  - The **back foot does not move**: its rearmost pixel on rows 108–111 is at **x = 52**, the same as the idle.
  - The front foot lies between where it is in attachment 2 and in attachment 3, on row 111.
- Canvas 128×120, feet on (64,112), facing right 3/4, crouched height (about 41–44 px), head no wider than 30 px. Real alpha only.

Deliver into `docs/art-production/pixel-assassin-attack-keyposes/poses/5_swing/`: `body.png`, `hair_back.png`, `hair_front.png`, `katar.png` (with the smear), `grip.png`, `composite.png`, `composite_4x.png` and `pose.json`. `pose.json` has the same fields as the other poses, with `"role": "swing"`.

Add to `NOTES.md` one line saying whether anything differs from attachment 1 (face and mask, hair, vest, waist cloth, katar hand), and one line with the back foot's rearmost x on rows 108–111.

Do not change the four key poses. Do not assemble an animation, change `src/`, commit or push. End with a short Korean summary.
