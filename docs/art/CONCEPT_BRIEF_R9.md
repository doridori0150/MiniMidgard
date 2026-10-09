상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude. 제작: Codex(아스트라). 결과물: `docs/art/concepts/round9/`.

# 9라운드 — 2등신 도트 쿠키의 외형 품질 (시안 3개)

## 사용자 말 (그대로)
- 8라운드(`docs/art-production/pixel-hero-r8/`)를 게임에서 보고: "도트 2등신이 가장 어울리는 거 같은데. 문제는 이제
  1. 캐릭터 퀄리티 확보
  2. 액션 동작의 퀄리티 (지금은 이상하게 칼을 휘두르는데 위치의 문제가 아니라 그냥 동작이 이상함)
  이 두 가지가 문제네. 퀄리티(모습)나 컨셉은 저 스타일로 외형을 좀 잘 보여줬으면 좋겠는데."
- "저 스타일"은 도깨비의 세계(슈퍼캣, 2026)의 도트 캐릭터입니다.

## 8라운드가 밋밋했던 이유 (Claude 확인)
- 8라운드는 `build.py`가 다각형·선으로 몸을 조립했습니다.
  - 팔은 굵은 선 두 마디, 몸통은 고정된 다각형입니다.
  - 그래서 얼굴과 옷이 기하학적이고, 머리카락 덩어리·옷 주름·빛이 없습니다.
- 이번 라운드는 **외형만** 다룹니다. 동작은 시안이 정해진 다음 라운드에서 따로 고칩니다.

---

## REQUEST (for Codex)

The user picked the **2-head pixel proportion** (round 8's P2) and now wants **character quality**: 쿠키 should look as good as the in-game pixel characters of **도깨비의 세계 (World of Dokkaebi)**.
- First describe that look in your own words in `NOTES.md`; you may look at its public showcase videos.
- Copy none of its characters or costumes and save none of its images.

Round 8 was built from code polygons and lines, which made it flat and geometric. Do not do that again. **Paint real pixel art.**
- Use your image generation to make pixel-art sprites (prompt for crisp pixel art, a limited palette, a 1 px outline, chibi about 2–2.3 heads).
- Then snap each result to its true pixel grid: sample one colour per cell, lock the palette to at most 32 colours, keep alpha 0/255.
- Clean by hand: stray pixels, broken outlines, muddy clusters, eyes that read at 1×.
- Hand pixel edits are welcome. Code may only clean up and assemble; it does not draw the character.

Quality targets at 1× (standing about 46–50 px):
- A big, appealing head: a hair silhouette with volume and two or three clear locks, a highlight band, and expressive eyes (2–3 px, with a highlight pixel).
- Clean 3-step shading on the hair, skin, tunic and metal. A dark outline that is coloured by the area it bounds.
- The armour reads as metal: a bright highlight pixel and a dark edge. The red sash and boots read at a glance.
- The silhouette is readable on grass at 1×.

Outfit (ours):
- light silver breastplate with small pauldrons over a blue tunic;
- red waist sash;
- brown belt, gloves and boots;
- white trousers;
- one-handed sword;
- cream/light shoulder-length hair. The game recolours the hair, so keep it a light neutral.

Facing right, 3/4 view.

Make **three design candidates** (A, B and C) that differ in face and hair shape, armour amount and colour handling, all in that quality. For each one deliver:
- `r9<a|b|c>_idle.png`: the idle sprite at 1× on transparency, plus `r9<a|b|c>_idle_6x.png` (nearest).
- `r9<a|b|c>_pose.png`: one action key pose at 1× and 6×, the moment of a sword slash's impact with a bold swoosh.
  - The swoosh is a thick bright crescent in front of the body, from upper back to lower front.
  - The body lunges forward, the sword arm is extended, and the sword sits at the end of the arc.
  - This is only to judge how the design reads in action.
- `r9<a|b|c>_field.png`: the idle and the pose at 1× and 2× on a softly lit grass ground (a quick backdrop is fine), next to a small slime.

Also deliver `r9_compare.png` with all three side by side at 6× and at 2×, plus `NOTES.md` and `PROMPTS.json` (the prompts actually used).

Look at every sprite yourself before finishing:
- Is it crisp pixel art, not a blurry downscale?
- Do the eyes read?
- Is the outline clean?
- Is the palette within limits?

Write only inside `docs/art/concepts/round9/`. Do not change `src/` or other files. Do not commit or push. End with a short Korean summary.
