# 미니 미드가르 — 배경 톤 검증 의뢰서 (A · C · D)

## 요약 (사람용)
- **목적:** 캐릭터 스타일 후보 A(종이풍 정제)·C(펜선+수채)·D(도트) 중, **배경까지 같은 톤으로 만들 수 있는 것**을 고른다. 배경을 못 만들면 의미가 없기 때문이다.
- **스타일마다 받는 것:**
  - **배경 키트:** 이음새 없는 바닥 타일 2종, 소품 8종(마젠타 배경)
  - **인게임 목업:** 1장
- **검증 방법:** `tools/style-lab.html`이 키트로 실제 필드를 조립하고, 그 위에 캐릭터를 올려 본다.

---

## REQUEST (for Codex)

The client is choosing between character styles **A, C and D** (your boards `docs/art/concepts/round2/A_paper_refined.png`, `C_manga_watercolor.png`, `D_pixel_sprite.png`). The deciding question is: **can the game's backgrounds be made in the same style and tone?** The game's field is a large scrolling map seen from a high 3/4 top-down camera (classic 2D MMORPG), built in code from **tileable ground textures + separate props** (trees, rocks…) that are y-sorted with the characters. Use your **image generation tool** to produce, for each of A, C and D, a background kit and a scene mock.

### 1. `bgkit_A.png`, `bgkit_C.png`, `bgkit_D.png` — square 1536×1536
- **Top-left 768×768:** a **seamless, tileable meadow ground texture**:
  - short grass with gentle variation, a few tiny flowers or pebbles
  - no large objects, no strong directional lighting
  - it must tile in both directions without visible seams or a repeating focal point
- **Top-right 768×768:** a **seamless, tileable dirt-path / forest-floor texture** in the same style.
- **Bottom half (1536×768):** a flat **pure magenta `#FF00FF`** background (used as a cut-out key, so no texture, gradient or shadow on the magenta) holding **8 separate props in a 4×2 grid** of 384×384 cells:
  1. round leafy tree
  2. pine tree
  3. bush
  4. rock cluster
  5. flower patch
  6. tree stump
  7. wooden fence segment
  8. wooden signpost
- **Prop view:** each prop is drawn from the same high 3/4 top-down angle as the field, with its ground contact at the bottom of the cell and **no cast shadow** (the game adds soft shadows).
- **Prop scale:** relative to a character about 1 unit tall, a tree is about 3 units, a bush about 1, rocks about 0.7, flowers about 0.4. Keep props smaller than their cells; don't enlarge them to fill the cell.
- **Tone:** backgrounds must be **calmer and lower-contrast than the characters**, so heroes and monsters pop. Keep the palette harmonious with the character board.

### 2. `scene_A.png`, `scene_C.png`, `scene_D.png` — portrait 1024×1536
- An in-game screenshot mock in that style. **No UI, no text.**
- A meadow field from the high 3/4 camera with a dirt path, a few of the props above, the same three characters (Novice girl, Swordsman, Mage) fighting 3 pink jelly slimes.
- Characters at **real game scale**: about 1/10 of the image height.
- It should look **as if assembled from the kit** — same textures and props, not a different painting.

### Per-style rules
- **A:** flat shapes, one dark outline, at most one flat shadow tone, a subtle matte paper texture, muted pastel ground so the characters' stronger colours stand out.
- **C:**
  - transparent watercolour washes with blooms and paper-white sparkle
  - dip-pen ink only on props, not on the ground textures
  - ground textures kept soft and pale
- **D:**
  - true pixel art: ground tiles built from 32×32 art-pixel tiles (the 768 quadrant = 4×4 tiles of the same seamless pattern scaled ×6 with nearest-neighbour)
  - props and characters on the **same pixel grid size** as the D character sprite
  - crisp blocks, no blur or anti-aliasing, limited palette

### Avoid
Generic glossy AI landscape art (painterly bloom, god rays, depth-of-field blur, photoreal grass), busy high-contrast grounds that swallow the characters, and anything that would not tile.

### Process
- Generate each file separately and check it before accepting:
  - ground quadrants tile without seams (imagine them repeated)
  - the magenta is flat
  - props sit in their own cells at the right relative scale
  - the scene matches the kit

  Up to 3 tries per file.
- Save to `docs/art/concepts/round2/` with exactly these names: `bgkit_A.png`, `bgkit_C.png`, `bgkit_D.png`, `scene_A.png`, `scene_C.png`, `scene_D.png`.
- Append a Korean section "배경 키트" to `docs/art/concepts/round2/notes.md` with the prompts used and an honest self-assessment, per style, of how producible the backgrounds are (tiling, prop consistency, tone match).
- Do not modify other files. Finish with a short Korean summary.
