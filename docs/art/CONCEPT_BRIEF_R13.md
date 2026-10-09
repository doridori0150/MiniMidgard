상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude가 그대로 전달. 제작·판단: Codex(아스트라). 결과물: `docs/art-production/pixel-knight-r13/`.

# 13라운드 — 기사 직업 하나 (도트 2등신)

## 사용자 말 (그대로)
> 기사 직업 하나 그려봐.
>
> 1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
> 2. 레퍼런스를 체크할 것
> 3. 스프라이트 애니메이션을 사전에 어떤 동작을 할 지 고려하여, 1장씩 생성하고, 연결할 것
>    1. 즉, 다음 그림을 그리기 전에 이전 그림을 체크해서 연결되게.
>
> 기존 기사를 참고하지 말고. 그려보라고 해봐.

## 맞출 기준 (1번)
- 등신·컨셉·크기는 지금 게임에 들어간 쿠키(검사 계열, 2등신 도트)에 맞춥니다.
  - `docs/art-production/pixel-hero-r12/`: 대기 키 48px, 캔버스 128×120, 발 기준점 (64,112), 오른쪽 3/4.
  - 디자인 원본은 `docs/art/concepts/round9/` 시안 C입니다. 사용자가 고른 것입니다.
- 스타일 기준 게임: 도깨비의 세계(슈퍼캣, 2026)의 도트 캐릭터.

## 참고하지 말 것
**"기존 기사를 참고하지 말고"** — 아래는 열어 보지 않습니다.
- `docs/art/concepts/round3/class_lineup.png`의 기사
- `src/render/hero.ts`·`src/render/rig.ts`의 기사
- `docs/art/sprites/`, `docs/art-production/hero-sprites/`의 검사·기사

---

## REQUEST (for Codex)

The user asks you to draw **one Knight** (the 2nd job after Swordsman) as a 2-head pixel hero. Their instructions, verbatim, are quoted above. Follow them:
1. **Match** the proportions, concept style and overall size of the hero now in the game, 쿠키 in `docs/art-production/pixel-hero-r12/` (design C from round 9: idle 48 px tall, canvas 128×120, feet at (64,112), 3/4 view facing right).
2. **Check references** before drawing:
   - 도깨비의 세계's in-game pixel characters (public showcase material; save none of it here);
   - our 쿠키 (r9 C, r12);
   - `docs/art/MOTION_REFERENCE.md` for motion.
   - Do **not** look at our existing knight art (listed above). Design a new knight.
3. **Plan the animation first.** Decide which actions you will make and their key poses and timing. Then **generate one frame at a time**. Before drawing each next frame, check the previous one so the frames connect: same character, same size, same hand on the weapon, continuous motion.

You decide the rest:
- the knight's look, gender and weapon;
- the frame counts;
- how you generate and clean the pixels.

Fixed:
- Original design only.
- Write only inside `docs/art-production/pixel-knight-r13/`. Do not change `src/` or other folders. Do not commit or push.
- Deliver a `manifest.json` in the `minimidgard.pixel/1` format, like r12, so I can put it in the game. Use character id `knight_<female|male>_p2`, with hair layers in the four hair key colours, a weapon layer, and `hitFrame` on the attack.

Deliver:
- the frames and the manifest;
- GIFs of each action at game size and at 4×;
- a contact sheet of all frames;
- `NOTES.md`, short: your plan, the references you checked and what you took from them, and your checks between frames.

Judge it yourself before finishing. End with a short Korean summary.
