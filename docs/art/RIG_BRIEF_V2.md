# 미니 미드가르 — 조립용 전신 원화 의뢰 (리그 v2)

## 요약 (사람용)
- **1차 리그의 문제:** 부품을 따로 그리게 했더니 크기가 제각각이고 이음매 약속도 없어서, 조립 결과가 어색했다.
- **이번 방식:** 관절 위치를 표시한 **템플릿 위에 전신 한 장**만 정확히 맞춰 그리게 한다. 팔·다리·머리 분리는 우리 쪽에서 템플릿 경계로 자른다. 한 장에서 나온 부품이라 비율이 원화 그대로 맞는다.
- **의상 교체:** 직업마다 같은 템플릿·같은 자세로 그리면 의상을 바꿔 끼워도 맞는다.

## REQUEST (for Codex)

Use your **image generation tool**. The game assembles heroes from body parts that it rotates at fixed joints (a 2D cut-out rig). The joints are fixed by the attached **rig template** (`docs/art/rig-template/template.png`, 1024×1024). Instead of drawing separate parts, draw each character as **one full-body illustration placed exactly on this template**; we cut it into parts ourselves along the template's joints. So the **placement and pose must match the template precisely.**

Style: exactly the character art of the approved mock `docs/art/concepts/round2/scene_A.png`:
- flat colours with one flat shadow tone
- thick dark-brown outer outline, thinner inner lines
- big expressive face, about 3 heads tall

Use the Novice girl design from `docs/art/concepts/rig/rig_novice_v1.png` (cell 15 / the reference): white-cream bob with an ahoge, determined smug face, tan tunic with belt and patched sleeve, brown shorts, fingerless gloves, brown boots.

### Files
Each file is **1024×1024**: the character on a flat **pure magenta `#FF00FF`** background, with **no template marks, grid, text or ground shadow** visible.
1. `docs/art/rig-template/novice.png`: the Novice girl.
2. `docs/art/rig-template/swordsman.png`: the **same girl** (same face and hair, same body proportions, same pose) wearing the Swordsman outfit: steel-blue tunic, light silver breastplate, red sash, a small pauldron on the front shoulder, blue sleeves, brown boots.

### Pose and placement (match the template)
- **View:** 3/4 view facing right (viewer's right is the character's front side).
- **Head:** the head including the hair volume fills the grey ellipse. The chin sits just above the red **neck** dot.
- **Arms:** both arms hang **straight**, about 20° away from the body. The shoulders are at the blue dots and **empty closed fists at the orange dots**.
  - Arms must **not overlap the torso** except right at the shoulder.
  - Hands don't touch the body. Hold no weapon.
  - The front arm is on the viewer's right; the back arm is on the left, slightly darker.
- **Legs:** from the green **hip** dots down to the brown **foot** dots, in a slight A-stance with a visible gap between the legs. Boots stand on the green ground line.
  - The tunic or skirt hem covers the hip dots.
- **Hair:** ends **above the shoulders**, so it does not cover the arms.
- **Proportions:** the character fills the template silhouette (≈900 px tall). Don't shrink or move it.
- Keep every body part a clean separate shape where it meets another, so it can be cut apart.

### Process
- Generate `novice.png` first. Overlay it mentally on the template and check it before accepting:
  - head in the ellipse
  - shoulders, fists, hips and feet on the dots
  - arms clear of the torso
  - flat magenta
  - style matching `scene_A`

  Regenerate if it's off (up to 3 tries).
- Then generate `swordsman.png` using `novice.png` as the reference, so the face, hair, body and pose stay identical and only the outfit changes. Check the same points.
- Write `docs/art/rig-template/notes.md` in Korean: the prompts, and for each image how closely the joints match (estimate the pixel offsets).
- Do not modify other files. Finish with a short Korean summary.
