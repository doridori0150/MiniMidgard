# 미니 미드가르 — 캐릭터 관절 리그 부품 시트 (시험 1장)

## 요약 (사람용)
- **배경:** 프로토타입에서 배경은 Codex 그림을 그대로 썼지만, 캐릭터는 코드 도형 그림이라 목업 품질과 차이가 컸다.
- **목표:** 목업(scene_A) 수준의 캐릭터를 **부품 그림 + 엔진 관절 애니메이션**으로 만들 수 있는지 한 캐릭터로 검증한다.
- **장비 교체 원리:** 머리 부품의 기준점이 고정되므로, 머리 장식은 기준점에 한 번만 맞추면 모든 동작·직업에 붙는다.
- **이번 시트에 담는 것:** 초보자 소녀 부품 + 검사 몸통·팔 (의상 교체 시험) + 머리장식 3종 + 무기 2종

---

## REQUEST (for Codex)

The client approved the visual style of `docs/art/concepts/round2/scene_A.png` (flat cartoon, thick dark-brown outline, one flat shadow tone, soft pastel palette). The game must assemble characters from **separate body parts animated in code** (a 2D cut-out rig, like Spine). This lets equipment swap freely. Use your **image generation tool** to make ONE rig part sheet that matches the character art of `scene_A.png` / `A_paper_refined.png` exactly, in the same quality.

### File
`docs/art/concepts/rig/rig_novice.png`: square 1536×1536 on **flat pure magenta `#FF00FF`**, with no texture, gradient or shadow on the magenta. An invisible **4×4 grid of 384×384 cells**, read left to right, top to bottom. Each cell holds one part, centred, with clear magenta space around it. Nothing touches a cell edge.

### Scale and view
- Everything belongs to **one character drawn at one consistent scale**: when assembled she would be about **640 px tall**, with a head about **250 px wide**.
- All parts are seen in the same **3/4 view facing right**.
- Draw each part as a **complete, closed shape with its own outline**, including the parts that will be hidden under other layers. Overlap areas need to be painted too, so joints don't show gaps when limbs rotate.
- Same line weight (thick outer contour) on every part.

### Cells
0. **Head (no hair):** the face of the Novice girl from the board — determined smug expression, big dark-blue eyes, brows — with ears and a short neck stub at the bottom centre (the neck end is the pivot). Include the skin of the top of the head under where the hair goes.
1. **Hair, front layer:** her white/cream bob fringe and side locks plus the ahoge, sized to sit on the head in cell 0.
2. **Hair, back layer:** the back volume of the bob, drawn behind the head.
3. **Torso, novice:** tan tunic with belt and a shoulder patch, neck opening at the top centre (pivot), hips at the bottom. No arms.
4. **Upper arm + forearm + hand, novice sleeve (front arm):** one piece hanging straight down; shoulder at the top centre (pivot); the hand at the bottom is a fist with a hole-grip that can hold a weapon handle.
5. **Same arm, back arm:** a slightly darker shadow tone version.
6. **Leg, front:** shorts and leg, plus boot; hip at the top centre (pivot); foot at the bottom pointing right.
7. **Leg, back:** same, darker shadow tone.
8. **Torso, swordsman outfit:** steel-blue tunic with a light silver breastplate and a red sash, in the same body shape and size as cell 3 (for outfit swapping).
9. **Arm, swordsman sleeve (front):** same shape as cell 4 with a blue sleeve and a small pauldron.
10. **Dagger:** horizontal, handle on the left (the grip point), blade to the right, at the scale of her hand.
11. **Sword:** same orientation and grip convention, longer.
12. **Leaf sprout headgear:** two-leaf sprout on a short stem; the stem bottom is the attach point.
13. **Star hairpin:** crossed clips with a star gem.
14. **Beret:** tilted, as worn, sized for her head.
15. **Reference:** the fully assembled character (head + hair + novice torso + arms + legs + dagger, no headgear) standing idle. This lets the parts' scale be checked; it must use exactly the same scale as the parts.

### Style rules
- Match `scene_A.png`'s characters: flat colours, at most one flat shadow tone, a thick dark-brown outer outline with thinner inner lines, clean shapes, charming personality.
- No gradients, no gloss, no sparkle eyes, no airbrush, no texture on the magenta.

### Process
- Generate the sheet. Before accepting it, check that:
  - every part is in its own cell and inside the cell
  - the magenta is flat
  - parts share one scale: compare the head in cell 0 with the reference in cell 15
  - the style matches `scene_A`

  Regenerate up to 3 times.
- Save it as `docs/art/concepts/rig/rig_novice.png`. Write `docs/art/concepts/rig/notes.md` in Korean: the prompt, known issues (scale mismatches, missing overlaps), and an honest assessment of whether this cut-out approach can reach `scene_A` quality.
- Do not modify other files. Finish with a short Korean summary.
