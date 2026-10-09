상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude가 그대로 전달. 제작: Codex(아스트라). 결과물: `docs/art/concepts/round6/`.

# 컨셉 6라운드 — 5라운드 수정: 3~4등신, 약간의 도트 느낌, 6~8장 모션

## 사용자 말 (그대로)
- 5라운드(`docs/art/concepts/round5/`)를 보고: "괜찮은데 등신대가 너무 커. 조금 등신대를 낮추면 좋겠어. 3~4등신?"
- "저기에 약간 도트 느낌을 추가하면 좋겠어."
- "그리고 모션은 최소 6~8장은 써야 할 거 같아."

기준은 5라운드 그림입니다. 바꾸는 것은 위 세 가지뿐이고, 나머지(트리 오브 세이비어 캐릭터 화풍, 얼굴, 선, 채색, 의상 디자인)는 5라운드 그대로 둡니다. 이 문서의 다른 말보다 사용자 말이 우선합니다.

---

## REQUEST (for Codex)

Revise round 5 (`docs/art/concepts/round5/`: `r5_lineup.png`, `r5_field.png`, `r5_turn.png`, `NOTES.md`). Change only these three things the user asked for; keep everything else (the Tree of Savior character look, faces, line, colouring, our costume designs):

1. **Lower the head-to-body ratio to about 3–4 heads** ("등신대를 낮추면 좋겠어. 3~4등신?").
2. **Add a slight pixel-art feel** ("약간 도트 느낌").
   - First write in `NOTES.md` how you read "slight": what changes, and what stays painterly.
   - Then show it at **three strengths** on 쿠키 at actual game size (about 80 px tall) and at 3× nearest-neighbour: none / light / medium.
   - The user picks one.
3. **Motions of at least 6–8 frames** ("모션은 최소 6~8장").
   - For 쿠키 make a **walk cycle of 8 frames** and an **attack of 6–8 frames** (wind-up → strike → follow-through → recover). Use the light pixel strength, or the one you think best.
   - All frames are the same character at the same size and scale: same face, hair, costume and sword.
   - The sword stays in the same hand in every frame. It never jumps to the other hand.
   - The body faces the same way in every frame (3/4 view facing right). The torso does not twist the other way.
   - In the walk, the leading foot alternates: the first and second halves of the cycle mirror each other's legs.
   - The far arm never crosses in front of the chest. No stray specks on the face or under the feet.

Deliver into `docs/art/concepts/round6/`:
- `r6_lineup.png`: 쿠키, the female mage, the male archer and the slime at 3–4 heads, same layout as `r5_lineup.png`.
- `r6_dot_strength.png`: the three pixel strengths side by side, at 1× and 3×.
- `r6_walk.png` and `r6_attack.png`: the frames in a row, numbered, on a plain background, each frame on the same canvas with the feet at the same ground line.
- `r6_walk.gif` and `r6_attack.gif`: the motions played at game size (about 80 px tall, 3× nearest-neighbour). Walk about 90 ms per frame; attack timed so the strike frame lands about 140 ms in.
- `r6_field.png`: the 390×844 phone mock again, with the new proportions and pixel feel.
- `NOTES.md` (the pixel-feel reading first) and `PROMPTS.json` (prompts actually used).

Look at every frame yourself before finishing. Check the hand, the facing, the alternating feet and the size. Redo frames that drift.

Do not save any of that game's screenshots or art into this repository (it is public); copy no logos, UI or class costumes. Write only inside `docs/art/concepts/round6/`. Do not change `src/` or other files. Do not commit or push. End with a short Korean summary.
