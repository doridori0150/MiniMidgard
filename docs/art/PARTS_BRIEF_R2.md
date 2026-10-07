# 미니 미드가르 — 장비 외형 교체 샘플: 부품 시트 의뢰서 (B·C·D)

## 요약 (사람용)
- **목적:** "장비를 바꿔 끼우면 외형이 쉽게 바뀌는가"를 확인한다. 방어구가 아니라 **머리 액세서리**(머리핀, 풀잎 등)로 검증한다.
- **대상 스타일:** 2차 컨셉 중 B(90년대 셀), C(만화 펜선 + 수채), D(도트 스프라이트)에서 하나씩 만든다.
- **시트 구성:** 3×3 칸. 0번은 액세서리 없는 몸, 1~8번은 액세서리 단품이다.
- **합성 확인:** `tools/style-lab.html`이 시트를 잘라 몸 위에 액세서리를 얹어 본다.

---

## REQUEST (for Codex)

Use your **image generation tool** to make **3 part sheets** that test whether a style supports easy equipment swapping, the way a classic 2D MMORPG layers headgear sprites on top of a body sprite.

The style references are the boards you already made:
- `docs/art/concepts/round2/B_90s_cel.png` → `parts_B.png`
- `docs/art/concepts/round2/C_manga_watercolor.png` → `parts_C.png`
- `docs/art/concepts/round2/D_pixel_sprite.png` → `parts_D.png`

Match each board's style exactly: the same Novice girl design, palette, line and texture.

### Layout (identical for all three)
- **Format:** square 1536×1536. An invisible **3×3 grid of 512×512 cells**, left to right and top to bottom.
- **Background:** the entire background is **pure flat magenta `#FF00FF`**. No texture, gradient, shadow, vignette, paper grain, borders or grid lines on the background. The magenta is used as a cut-out key.
- **Cell 0 — the body:**
  - the **Novice girl** from the board, full body, 3/4 view facing right
  - **no headgear or accessory of any kind**, just her hair
  - fills about 85% of the cell height and stands on the cell's bottom area
  - no ground shadow
- **Cells 1–8 — accessories alone.** One per cell, centred, with no character and no shadow. Each is drawn **at exactly the size it would have when worn by the girl in cell 0**; do not enlarge an accessory to fill its cell, so most accessories will look small in their cells. Angle each one to match her 3/4 head turned to the right.
  1. **hairpin**: two crossed hair clips with a small star gem
  2. **leaf sprout**: a two-leaf green sprout on a short stem, as if growing from the top of the head; the stem end is at the bottom
  3. **ribbon**: a big bow worn on top of the head
  4. **flower**: a single flower worn at the side of the head
  5. **cat-ear headband**
  6. **round glasses**
  7. **grass blade**: a long grass blade held in the mouth (풀피리)
  8. **beret**: tilted, as worn
- Every accessory must be a **self-contained piece** with its own outline, as it would appear in that style, so it can be cut out and placed on top of the hair.

### Per-style notes
- **parts_B** (90s cel): even ink lines, flat cel paint with exactly one hard shadow tone, a slightly muted palette, a subtle grain allowed **inside the drawn shapes only**.
- **parts_C** (pen + watercolour): dip-pen ink lines and watercolour washes inside the shapes. Leave white paper highlights **inside** the shapes. The background stays flat magenta, with no paper texture outside the shapes.
- **parts_D** (pixel):
  - true pixel art: the body is about 80 px tall at native resolution, and accessories use the same pixel grid
  - the whole sheet is that native art scaled up with nearest-neighbour, so every art pixel is a crisp square block of identical size across all cells
  - no anti-aliasing and no blur
  - selective dark outline, limited palette

### Process
- Generate each sheet separately. Before accepting it, check that:
  - the background is flat magenta everywhere
  - each subject sits inside its own cell
  - the body has no accessory
  - the accessories are at worn size, not enlarged
  - the style matches the board

  Regenerate up to 3 times if needed.
- Save the files as `docs/art/concepts/round2/parts_B.png`, `parts_C.png` and `parts_D.png`.
- Append a short Korean section to `docs/art/concepts/round2/notes.md` about the part sheets: the prompts used and any known issues, such as accessory scale or cell overflow.
- Do not modify any other files. Finish with a short Korean summary.
