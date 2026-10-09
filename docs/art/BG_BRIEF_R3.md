상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude. 제작: Codex(아스트라). 결과물: `docs/art-production/kit-meadow-hd/`. 게임 연결: Claude.

# 배경 3라운드 — 햇살 평원을 레이어로 나눈 2.5D 키트

## 사용자 말 (그대로)
- 도깨비의 세계(슈퍼캣, 2026) 화면을 보고: "저런 느낌을 하고 싶었어 … 저런 감성?"
- "배경은 3D로 하기는 힘들고 저 감성을 낼 수 있는 정도의 레이어 분리를 할 수 있을까?"
- 시험 제안에: "둘 다 해보자"

## 기준: 도깨비의 세계 배경 (Claude가 플레이 영상에서 본 것)
- 3D로 만든 마을·담장·나무·통·벤치를 위에서 약 45° 비스듬히 내려다봅니다.
- 질감은 손으로 칠한 듯 풍부하지만 사실적이고, 해가 한쪽에서 비칩니다. 물체 아래에 부드러운 그림자와 접지 그늘(AO)이 있습니다.
- 흙길·잔디·돌길이 자연스럽게 섞이고, 잔디는 짧은 결이 촘촘합니다.
- 작은 도트 캐릭터가 그 위에서 또렷하게 보입니다. 배경은 캐릭터보다 채도·대비가 조금 낮습니다.
- 우리 세계는 조선이 아니라 지금 게임의 판타지 평원입니다. 그 게임의 지형·건물·이미지는 베끼지 않고, 렌더링 느낌만 가져옵니다.

## 지금 게임 구조 (`src/render/bg.ts`, `src/render/field.ts`)
- 테마별 키트를 씁니다(`src/assets/kits/<theme>/`). `grass.jpg`·`dirt.jpg` 바닥 타일은 0.55배로 깔리고, 소품 PNG는 정해진 높이(아래 표)로 그려집니다.
- 바닥은 구역마다 한 장으로 미리 그려 둡니다. 소품·영웅·몬스터는 발(y) 순서로 앞뒤가 정해집니다.
- 영웅이 큰 소품 뒤에 들어가면 소품이 반투명해집니다. 그 뒤에 조명 패스가 덮입니다.
- 지금 키트는 굵은 외곽선 만화풍이라 이번에 바꿉니다.

| 소품 | 게임 높이(단위) | 메모 |
|---|---|---|
| tree | 100 | 영웅 키 ≈ 72 |
| pine | 112 | |
| bush | 30 | |
| rock | 25 | |
| flowers | 16 | |
| stump | 24 | |
| fence | 28 | |
| sign | 44 | |

---

## REQUEST (for Codex)

Repaint the meadow kit so the field reads like the rendered, softly lit 2.5D look of **도깨비의 세계** (World of Dokkaebi) backgrounds:
- a high three-quarter view from about 45° above;
- rich but realistic painted texture;
- sun from the upper left;
- soft cast shadows and contact shading;
- slightly lower saturation and contrast than the characters.

Write first in `NOTES.md`, in your own words, what that background look is. Our world stays a fantasy meadow; copy no terrain, buildings or images from that game, and save none of its images.

The layers the game will draw, in this order:
1. Ground tiles: `grass.jpg`, `dirt.jpg` and a new `path.jpg` (stone/packed path).
   - Seamless 512×512, viewed from above.
   - Short dense grass blades, small pebbles, soft value variation.
   - No baked large shadows.
2. Soft shadow sprites `<prop>_shadow.png`.
   - Each is a black shape with alpha only (about 35–55% at its core, feathered edge), cast toward the lower right.
   - The shadow's foot point is the same as the prop's.
3. Props `<prop>.png`: tree, pine, bush, rock, flowers, stump, fence, sign.
   - Add `well.png`, `cart.png` and `haystack.png`. Their heights are 60, 40 and 34 units.
   - Same names, transparent background, drawn from the high 3/4 view. Both the top and the front face show.
   - Lit from the upper left, with a darker contact zone at the base.
   - Feet at the bottom centre. Height in pixels about 2.3× the game height in the table, so the tree is about 230 px.
4. Canopies `<prop>_top.png` for tree and pine.
   - The leafy crown alone, on the same canvas and in the same place as the full prop. The game draws it over the heroes when they walk under the tree.
5. `foreground_branch.png`: an out-of-focus leafy branch for a screen corner, with soft edges, 600 px wide.
6. `grade.json`: a colour grade for the field, e.g. `{ "shadowTint": "#2a3a5a", "lightTint": "#fff2d0", "saturation": 0.92, "vignette": 0.18 }`. The game applies it after lighting.

Deliver into `docs/art-production/kit-meadow-hd/`:
- the kit files;
- `preview_field.png`: a 390×844 portrait mock that assembles the kit the way the game will, with three small heroes (simple placeholders are fine) and a slime for scale;
- `preview_sheet.png`: all props with their shadows on a grass tile;
- `NOTES.md`, `PROMPTS.json` and any build script.

Check yourself:
- The tiles tile without seams.
- Props and shadows share their foot points.
- The canopy lines up with its tree exactly.
- Everything shares one light direction and one view angle.

Write only inside `docs/art-production/kit-meadow-hd/`. Do not change `src/` or other files. Do not commit or push. End with a short Korean summary.
