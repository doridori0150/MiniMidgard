상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude가 그대로 전달. 제작·판단: Codex(아스트라). 결과물: `docs/art-production/pixel-hero-r12/`.

# 12라운드 — 쿠키 공격 모션, 아스트라 판단으로

## 사용자 말 (그대로)
- "어택 1, 2가 검이 반대 손에 있어 (몸통 뒷쪽)"
- "이거 한 번에 하지 말고, 스프라이트 6장에 대해서 장별로 만들어서 합성하는 걸로 하자. 이거 한 번에 만드니까 계속 찐빠나네"
- 11라운드에서 장마다 Claude가 세세하게 고칠 점을 적어 보내 다시 그리게 했더니: **"아니 거지같이 그리고 있어. 프롬프트를 뭐 어떻게 보내는거야?? 아스트라가 알아서 판단해서 그리게 해봐"**

## 지금까지
- 원하는 그림: 도깨비의 세계(슈퍼캣) 같은 2등신 도트 캐릭터입니다. 사용자가 고른 디자인은 `docs/art/concepts/round9/` 시안 C입니다(`r9c_idle_6x.png`, `r9c_pose_6x.png`). 사용자는 시안 C의 베는 자세를 두고 "오른손 → 오른손 타격이 제대로 되어 있다"고 했습니다.
- 10라운드(`docs/art-production/pixel-hero-r10/`): 대기·걷기·공격·피격·쓰러짐을 한 번에 만들었습니다. 공격 앞 두 장에서 검이 몸 뒤쪽 팔로 넘어갔습니다.
- 11라운드(`docs/art-production/pixel-hero-r11/`): Claude가 장마다 자세 표와 픽셀 단위 수정 지시를 보냈습니다. 사용자는 결과가 나쁘다고 했습니다.
- 참고로 모아 둔 자료: `docs/art/MOTION_REFERENCE.md`. 트리 오브 세이비어·라그나로크·도트 튜토리얼에서 잰 장수와 시간입니다. 참고만 하고, 따를지는 아스트라가 정합니다.

---

## REQUEST (for Codex)

The user wants **you** to decide how to make 쿠키's sword attack look good. Their words: "아스트라가 알아서 판단해서 그리게 해봐".

The goal is a natural, good-looking basic sword attack for 쿠키 (round-9 design C, a 2-head pixel heroine). It should read well in the game at small size and match the feel of the reference game 도깨비의 세계. The user's earlier complaint was that the sword jumped to the other arm behind the body.

You decide everything about how:
- frame count and timing;
- the poses and the arc;
- how you generate and clean the pixels: one sheet, frame by frame, keyframes then in-betweens, whatever works;
- whether idle and walk should be redrawn so they match.

Look at round 9 C, round 10 and round 11, and at `docs/art/MOTION_REFERENCE.md` if useful. Treat them as material, not rules.

Only these are fixed:
- Original art. Copy no other game's characters or images, and save none of them here.
- Put everything in `docs/art-production/pixel-hero-r12/`. Do not change `src/` or other folders. Do not commit or push.
- So I can put it in the game, deliver a `manifest.json` in the round-10 format (`minimidgard.pixel/1`: body frames, a hair layer recoloured through the four hair key colours, a sword layer, and `hitFrame` on the attack). If you think a different structure would look better, do that instead and explain it in `NOTES.md`.

Deliver:
- the frames and the manifest;
- a GIF of the attack, and of idle and walk if you changed them, at game size and at 4×;
- `NOTES.md`: what you decided and why. Keep it short.

Judge the result yourself before finishing. End with a short Korean summary.
