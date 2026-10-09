상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude. 제작·판단: Codex(아스트라). 결과물: `docs/art-production/pixel-knight-r14/`.

# 14라운드 — 기사 공격 모션을 다르게 (레퍼런스 GIF 참고)

## 사용자 말 (그대로)
- 13라운드 기사를 보고: **"공격 모션을 다르게 해줘. 참고할 만한 GIF 좀 찾아봐"**
- 13라운드를 맡길 때 한 말 (이번에도 같은 방식):
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것 (다음 그림을 그리기 전에 이전 그림을 체크해서 연결되게)

## 13라운드 기사 공격이 다르지 않았던 점
- 뒤로 치켜들기 → 머리 위 → 앞으로 큰 호 → 맞는 순간 → 복귀.
- 쿠키(검사)의 내려베기와 거의 같은 동작이라, 기사만의 공격으로 보이지 않습니다.

## Claude가 찾은 레퍼런스 GIF
공개 페이지의 미리보기 GIF를 프레임 단위로 풀어 본 것입니다. 저장소에는 저장하지 않았습니다. 아스트라도 페이지를 직접 열어 보세요.

1. **2타 콤보** — [Pixel Knight Animated Character (lotus_garden)](https://lotus-garden.itch.io/pixel-knight-animated-character). 32px 꼬마 기사, 13장.
   - 1~7장: 검을 뒤위로 치켜듦 → 몸 앞으로 큰 초승달 내려베기 → 몸을 낮춘 채 멈춤.
   - 8~13장: 그 자세에서 낮게 깔린 가로 올려베기. 넓고 납작한 잔상이 바닥 높이로 지나갑니다.
   - 두 번 치는 리듬이 분명합니다.
2. **가로 휩쓸기 + 망토** — [FREE Knight 2D Pixel Art (Mattz Art)](https://xzany.itch.io/free-knight-2d-pixel-art). 32px 기사, 공격 6·5·6장.
   - 검을 머리 위로 든 뒤, 허리 아래 높이로 긴 가로 잔상을 남기며 휩쓸어 벱니다.
   - 망토가 동작보다 한 박자 늦게 크게 펄럭입니다.
3. **돌진 찌르기** — 같은 Mattz Art 기사의 다른 공격, 그리고 [Knight Pixel Art v2 (Pixel Moon)](https://pixel-moon-studio.itch.io/knight-pixel-art)의 찌르기(8장, 100ms씩).
   - 몸을 낮추고 앞발을 크게 내디디며 검을 앞으로 곧게 찌릅니다.
   - 망토와 머리카락은 뒤로 날립니다.
   - 라그나로크 기사가 창으로 찌르는 이미지(피어스)와도 통합니다.
- 참고: 우리 모션 자료 `docs/art/MOTION_REFERENCE.md`. 장 수와 시간, 맞는 순간에 멈추기 등이 정리돼 있습니다.

---

## REQUEST (for Codex)

The user wants **a different attack motion for the Knight** of round 13 (`docs/art-production/pixel-knight-r13/`). Their words: "공격 모션을 다르게 해줘. 참고할 만한 GIF 좀 찾아봐". Round 13's attack is the same overhead slash as 쿠키's, so it does not read as the knight's own.

Look at the reference GIFs listed above (open the pages yourself, and save none of their images here). Choose the attack that suits this knight best, or combine ideas. You decide the frame count and timing. Keep the user's three rules from round 13:
1. Same proportion, style and size.
2. Check the references.
3. Plan the motion first, then draw one frame at a time, checking the previous frame before drawing the next so they connect.

The sword stays in the same hand throughout.

Keep the knight's design and every other action from round 13 unchanged. Only the attack is redone; adjust idle only if the attack needs a cleaner return. Copy round 13 into `docs/art-production/pixel-knight-r14/` without `source/`, replace the attack there, and update `manifest.json` (keep `minimidgard.pixel/1`, character `knight_female_p2`, and `hitFrame` on the contact frame).

Deliver:
- `attack_1x.gif`, `attack_4x.gif` and `attack_contact_sheet.png`;
- a side-by-side GIF of the old (r13) and new attack;
- `NOTES.md`, short: which reference you chose and why, the plan, and your checks between frames.

Write only inside `docs/art-production/pixel-knight-r14/`. Do not change `src/` or other folders. Do not commit or push. End with a short Korean summary.
