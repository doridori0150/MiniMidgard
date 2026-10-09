상태: 준비 (2026-10-09). 9라운드에서 사용자가 시안을 고르면 의뢰합니다. 요청: 사용자 → Claude. 제작: Codex(아스트라). 결과물: `docs/art-production/pixel-hero-r10/`.

# 10라운드 — 고른 2등신 도트 쿠키의 전체 모션 (레퍼런스 기반)

## 사용자 말 (그대로)
- "액션 동작의 퀄리티 (지금은 이상하게 칼을 휘두르는데 위치의 문제가 아니라 그냥 동작이 이상함)"
- "모션의 경우 어디 사이트에서 레퍼런스라도 찾아서 만들었으면 좋겠어. 아니면 라그나로크, 트리오브세이비어를 참고하던가."

## 기준
- 디자인: 9라운드에서 사용자가 고른 시안 `<A|B|C>` (`docs/art/concepts/round9/`).
- 모션: **`docs/art/MOTION_REFERENCE.md`**를 따릅니다. 트리 오브 세이비어 공식 GIF, 라그나로크 스프라이트, Slynyrd 도트 근접 공격 튜토리얼에서 잰 장수와 시간을 담고 있습니다. 이 문서의 표가 이 요청서의 다른 말보다 우선합니다.

---

## REQUEST (for Codex)

Animate the round-9 design the user picked as genuine pixel art, following `docs/art/MOTION_REFERENCE.md` exactly:
- idle 4;
- walk 8;
- **sword attack 6** with `hitFrame: 4`;
- hurt 2, dead 4, sit 1.

Read the reference articles it links (Slynyrd Pixelblog 56 and 9, the itch.io sword slash tutorial) before you start, and note in `NOTES.md` what you took from them.

Method:
- **Pose the key frames first:** attack anticipation (0), impact (4) and recover (5); walk contacts (0 and 4).
- Then draw the in-betweens.
- Paint the frames as pixel art in the chosen design: same face, hair, outfit, palette and size in every frame.
- Use image generation on a single sheet for consistency, then grid-snap and hand-clean. Do not assemble limbs from code polygons and do not rotate an arm sprite.
- Paste the same head per pose, so the face never wobbles.

Check the attack against these rules:
- The body leads: the torso twist and weight shift come before the arm, and the sword follows a beat later.
- The blade turns one way only, from behind and above, over the head, to in front and down. It never flips backwards.
- Frames 1–3 have one continuous bold smear (2–3 px wide, bright to faint) in front of the body.
- Frame 4 has no smear. The arm is fully extended forward-down with the blade pushed 1 px further, a few wind bits at the tip, and the back foot on tiptoe.
- The sword stays in the near hand. The facing is the 3/4 right view, as in idle.

Layers and contract:
- Keep `minimidgard.pixel/1` with the canvas, origin, hair layers (front and back per pose, four key colours) and sword/grip layers, as in `docs/art-production/pixel-hero-r8/`.
- Put `hitFrame` in `animations.attack`.
- Use one character id, `swordsman_female_p2`, with its own hair styles: the default from the design, plus a ponytail.

Deliver into `docs/art-production/pixel-hero-r10/`:
- the manifest and PNGs;
- `verification/review.png`: all frames at 4× nearest, numbered, with durations;
- `verification/attack_keys.png`: attack frames 0–5 at 8×;
- `verification/play.gif`: idle, walk and attack at 3×, at real timing;
- `NOTES.md`, `PROMPTS.json` and the build/clean scripts.

Look at every frame yourself against the rules and redo the ones that drift. Write only inside `docs/art-production/pixel-hero-r10/`. Do not change `src/` or other files. Do not commit or push. End with a short Korean summary.
