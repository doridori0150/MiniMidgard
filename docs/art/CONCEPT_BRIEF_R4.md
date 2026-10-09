상태: 의뢰 (2026-10-09). 요청: Claude (미니 미드가르 세션). 제작: Codex. 결과물: `docs/art/concepts/round4/`.

# 컨셉 4라운드 — 새 화풍: 손으로 칠한 고해상도 2D + 뼈대 애니메이션

## 요약 (사람용)
- 사용자는 지금의 쿠키 스타일(굵은 외곽선 SD)을 도트로 옮긴 결과가 어색하다고 했습니다. **화풍부터 새로 정합니다.**
  - 사용자 말: "아예 새로운 컨셉으로 하자. 아트풍도 바꾸고. 13기병방위권이나 오딘스피어 같은 바닐라웨어풍."
- 그 게임들은 도트가 아닙니다. **손으로 칠한 고해상도 그림을 부위별로 나눠 뼈대로 움직이는(컷아웃) 방식**입니다.
  - 한 장의 원화에서 부위를 잘라 쓰기 때문에 이음매가 보이지 않습니다.
  - 숨쉬기·머리카락·옷자락이 부드럽게 흔들립니다.
- 그 회사의 캐릭터·의상·로고·배경은 베끼지 않습니다(공개 저장소, 오리지널 IP). **화풍의 특징만** 참고합니다.
  - 프롬프트에도 회사·게임 이름을 넣지 않고, 아래 특징으로만 적습니다.
- 이번 라운드는 **시안 비교**입니다. 사용자가 방향을 고르면, 그 방향으로 부위 분리와 뼈대 애니메이션 시험을 합니다.

---

## REQUEST (for Codex)

Produce an original concept round in a new art direction for the hero **쿠키, a female swordsman** (later a knight).

The target look is **richly hand-painted 2D game art built for cut-out (bone) animation**:
- painterly rendering with visible soft brushwork, layered light and shadow, warm rim light;
- fine coloured line work (dark coloured lines, not flat black cartoon outlines, no thick uniform outline);
- detailed costume (cloth folds, trims, leather straps, metal with soft highlights) and lush, flowing hair drawn as strands and locks;
- European fantasy storybook mood, saturated but harmonious palette;
- expressive, natural faces.

**Do not** use:
- glossy gacha-anime rendering (airbrushed gloss, sparkle eyes, plastic skin);
- 3D-render look;
- pixel art;
- chibi with thick black outlines (the current style the user wants to leave).

Never copy any existing game's characters, costumes, logos or assets. Do not name studios or games in prompts.

### The character (original redesign, keep the identity)
- Young female swordsman, confident, kind.
- Shoulder-length hair: cream/ash-blonde with an ahoge-like stray lock (hair colour will be recoloured in game, so keep the hair a light neutral that tints well).
- Blue eyes.
- Outfit:
  - blue tunic;
  - light silver breastplate with pauldrons;
  - red waist sash;
  - brown leather belt, gloves and boots;
  - white trousers.
- One-handed sword.
- Game view: **3/4 view facing right**, full body, standing ready.

### Two directions (one board each)
- **R4-A "storybook": about 4–4.5 heads tall.**
  - Rounder, sturdier forms.
  - Bold, rich colour.
  - Heavier fabric.
  - Ornamented trims.
- **R4-B "soft realism": about 6 heads tall.**
  - Slimmer, elegant proportions.
  - Softer, airier light.
  - Delicate detail.

For **each** direction deliver:
1. `r4<a|b>_hero.png`: the full-body hero on a plain light background, 1024 px tall or more.
2. `r4<a|b>_parts.png`: the **same painting** split into cut-out parts laid out on one sheet.
   - Parts: head (face only), hair back, hair front, torso, pelvis/skirt, upper arm ×2, forearm ×2, hand ×2, thigh ×2, shin+boot ×2, sword.
   - Hidden areas are painted in: the shoulder under the arm, the neck under the hair.
   - Mark each part's joint pivot with a small dot.
   - This shows that the art can be rigged without visible seams.
3. `r4<a|b>_field.png`: an **in-game scale mock** on a 390×844 phone screen.
   - Show a forest field, the hero at the size the game would use, two more party members as simple same-style silhouettes, and one small slime monster painted in the same style.
   - Add a second inset with the hero at 120 px and 200 px tall, so we can judge readability on a phone.
4. `r4<a|b>_motion.png`: four key poses drawn from the same design.
   - Poses: idle, walk contact, attack wind-up, attack strike.
   - These show how the parts will move.
   - The weapon is in the near (right-side) hand in all four.

Also write `NOTES.md` covering:
- what you did and the prompts actually used (also save them as `PROMPTS.json`);
- your recommendation between A and B for a phone idle RPG where three heroes and several monsters share the field;
- the minimum on-screen hero height you think this style needs.

Write only inside `docs/art/concepts/round4/`. Do not change `src/`, other docs or other art. Do not commit or push. End with a short Korean summary.
