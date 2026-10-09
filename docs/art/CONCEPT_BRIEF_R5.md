상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude가 그대로 전달. 제작: Codex(아스트라). 결과물: `docs/art/concepts/round5/`.

# 컨셉 5라운드 — 트리 오브 세이비어 풍 그대로

## 사용자 말 (그대로)
- "아스트라한테 트리 오브 세이비어 풍 그대로 만들라고 지시해봐."
- "캐릭터 컨셉 잡는 게 왜 이렇게 힘들지?? 완벽한 레퍼런스가 있는데??"
- "자꾸 중간에 이상하게 전달하고 있는 거 아냐?"

## 지금까지 어긋난 것 (반복하지 말 것)
- 1라운드: 반짝이는 가챠 애니풍 → "AI 일러스트 같다"며 반려.
- 수채 동화풍 시험(`docs/art/style-painterly/`) → 기존보다 못하다며 반려.
  - 그때는 레퍼런스를 특징 단어로 풀어서 전달했습니다.
- 쿠키 SD를 도트로 옮긴 것 → 반려.
- 4라운드(`docs/art/concepts/round4/`): 서양 동화책 회화풍 → "둘 다 아니야"라며 반려.
  - 그때는 Claude가 레퍼런스를 자기 말로 풀어 쓰고 조건을 여럿 붙였습니다.

이번에는 Claude가 풀어 쓰지 않습니다. **기준은 트리 오브 세이비어(Tree of Savior, IMC Games) 게임 속 캐릭터 그림 그 자체**입니다. 이 문서의 다른 어떤 말보다 그 게임의 실제 모습이 우선합니다.

---

## REQUEST (for Codex)

The user wants the characters to look like **Tree of Savior's character art, as close as you can get** ("트리 오브 세이비어 풍 그대로"). Use your own knowledge of that game. You may name it in your image prompts. Where anything in this brief conflicts with how that game actually looks, follow the game.

1. **First, in `NOTES.md`, write in your own words what Tree of Savior character art looks like.** Cover:
   - proportions and head size;
   - face, eyes and mouth;
   - line work;
   - colouring and rendering;
   - palette;
   - how characters read at in-game size against its painted backgrounds;
   - how its character art differs from the round-4 boards in `docs/art/concepts/round4/` and from `docs/art/style-painterly/`.

   This is so the user can check that the reference was understood.
2. **Draw our heroes in that style.** Our designs are original, so do not copy that game's class costumes, characters, logos or UI; only the look.
   - 쿠키, female swordsman: shoulder-length light hair, blue tunic, light silver breastplate, red waist sash, brown belt/boots, one-handed sword.
   - Female mage: purple robe, staff with a blue orb.
   - Male archer: green hood/cape, leather, bow.
   - A small green slime monster in the same style.
3. Deliver into `docs/art/concepts/round5/`:
   - `r5_lineup.png`: the three heroes and the slime, full body, 3/4 view facing right, side by side on a plain light background, large.
   - `r5_field.png`: an in-game mock on a 390×844 portrait phone screen.
     - Use a painted field in the same style; the three heroes fight the slime.
     - Characters at the size that game would show them; state the pixel height.
   - `r5_turn.png`: 쿠키 in idle, walk, attack wind-up and attack strike, same design in all four, sword in the same hand.
   - `NOTES.md` (with item 1 first) and `PROMPTS.json` (the prompts actually used).
4. Look at your own boards before finishing. If they drift toward glossy gacha anime, western storybook painting or thick-outlined chibi, redo them.

Do not save any of that game's screenshots or art into this repository (it is public). Write only inside `docs/art/concepts/round5/`. Do not change `src/` or other files. Do not commit or push. End with a short Korean summary.
