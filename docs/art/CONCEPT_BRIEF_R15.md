상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude. 제작·판단: Codex(아스트라). 결과물: `docs/art-production/pixel-knight-r15/`.

# 15라운드 — 기사 공격을 라그나로크 기사처럼

## 사용자 말 (그대로)
- 라그나로크 기사 공격 모션을 보고: **"기사처럼 해"**
- "앞으로 직업 모션은 라그나로크로 넘기던가, 트리 오브 세이비어로 넘기던가 해."
- 13라운드부터 지키는 세 가지:
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것 (다음 그림을 그리기 전에 이전 그림을 체크해서 연결되게)

## 레퍼런스
`docs/art/CLASS_MOTION_REFS.md`의 라그나로크 기사 한손검 공격입니다. 첨부한 프레임 분해 그림과, 렌더러 주소 `https://assets.latam-tools.com.br/gif?job=7&weapon=2&gender=female&action=87`도 같은 내용입니다.

| 장 | 자세 |
|---|---|
| 1 | 검을 몸 뒤쪽으로 겨눈 채 선 자세 |
| 2–3 | 몸을 틀며 검을 끌어당김 |
| 4 | 아주 큰 부채꼴 잔상이 뒤 위에서 앞 아래로 몸을 감싸듯 휩쓺 |
| 5 | 잔상이 앞 아래로 이어지고 몸이 내려앉기 시작 |
| 6–9 | 깊게 내디딘 낮은 자세로 검을 앞 아래로 뻗고 길게 멈춤 |

9장 × 100ms. 휘두르는 순간은 짧고 크게, 멈춤은 길게.

---

## REQUEST (for Codex)

Redo the attack of our knight (`docs/art-production/pixel-knight-r14/`, character `knight_female_p2`) **like the Ragnarok Online Knight's sword attack**. The user's words are "기사처럼 해".

Use the frame breakdown above and the attached sheets. They were rendered from the real RO client sprites through the public renderer listed in `docs/art/CLASS_MOTION_REFS.md`; open it yourself if you can.

Take the motion only: the poses, order, rhythm and the big fan-shaped smear. The art is ours. Do not copy the RO sprite's pixels, and save none of its images here.

Adapt the motion to our 2-head pixel knight and to the game: our hit lands near the middle of a short swing. You decide the exact frame count and timing, and set `hitFrame` on the frame where the smear lands.

Keep the user's three rules:
1. Same proportion, style and size.
2. Check the reference.
3. Plan first, then draw one frame at a time, checking the previous frame before drawing the next. The sword stays in the same hand.

Keep the knight's design and every other action unchanged.

- Copy round 14 into `docs/art-production/pixel-knight-r15/` without `generated/`, `normalized/` or the zip.
- Replace the attack there and update `manifest.json`, keeping `minimidgard.pixel/1` and `knight_female_p2`.

Deliver:
- `attack_1x.gif` and `attack_4x.gif`;
- `attack_contact_sheet.png`;
- a side-by-side GIF of the RO-style result next to round 14;
- `NOTES.md`, short: the plan, what you took from the reference, and your checks between frames.

Write only inside `docs/art-production/pixel-knight-r15/`. Do not change `src/` or other folders. Do not commit or push. End with a short Korean summary.
