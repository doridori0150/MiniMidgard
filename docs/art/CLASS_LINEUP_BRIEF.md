# 직업 의상 컨셉 라인업 — Codex 의뢰 (컨펌용)

## 요약 (사람용)
- Novice 조립 샘플(`docs/art/rig-codex/`)이 엔진에서 그대로 재현되는 것까지 확인했다.
- 이제 나머지 12개 직업을 같은 방식으로 만들기 전에, **의상 디자인을 사용자에게 먼저 컨펌**받는다(컨셉 → 컨펌 → 제작 원칙).
- 그래서 이번 의뢰는 **라인업 이미지 2장 + 부품 분해 계획**만 요청한다. 부품 제작은 컨펌 후 별도 의뢰한다.
- 결과물은 `docs/art/concepts/round3/`에 저장한다.

---

## REQUEST (for Codex)

You already built the Novice cut-out set in `docs/art/rig-codex/` (PLAN.md, manifest.json, parts, verify.py). The game now draws heroes with a straight port of your verify.py, and the result matches your `preview_assembled.png`. Next, all 13 classes will be built with **your same contract**. Before producing parts, the user wants to approve the class designs. Your job now is the concept lineup only.

### Deliverables, in `docs/art/concepts/round3/`

1. **`class_lineup.png`**: all 13 classes standing in the rig's idle pose, facing right in 3/4 view.
   - Draw every class with exactly the Novice proportions from `docs/art/rig-codex/preview_assembled.png`: same head size, same short limbs, same height. They will be built from the same skeleton.
   - Layout:
     - Row 1: Novice, then the six first jobs.
     - Row 2: each second job directly under its first job.
   - Each class holds its signature weapon.
   - Alternate genders across the lineup so both face types are visible.
   - Put a small Korean label under each character.
2. **`hair_faces.png`**: 8 hairstyles × 2 face types (female, male), as heads only.
   - Use the same face construction as your `face.png` / `hair_front.png` / `hair_back.png`.
   - Paint the hair in the light cream base, because the engine tints hair by multiply.
   - Show 3 of the 16 heads tinted (brown, blue, black) to prove the tint reads well.
3. **`round3/PLAN.md`** (Korean). For each class:
   - which parts it needs under your contract (torso, arm_near, arm_far, arm_contact, legs or robe legs, extra layers);
   - anything the contract must gain, such as:
     - a robe or skirt that hides the legs;
     - a cape or garment layer behind the body;
     - hats that must hide the top of the hair;
     - a shield on the far arm;
     - katar worn on the fist;
     - a bow with a drawn string;
     - two-handed grips;
   - how you'll handle 4 skin tones and 4 dye colourways per class (your choice: palette masks, a separate skin layer, recolour at build time…);
   - and a production order with batching that keeps style drift low.

### Class identities (keep each palette family; designs are yours — original, not copied from any existing game)

| Class (ko) | id | Palette family (main / accent) | Signature weapon | Notes |
|---|---|---|---|---|
| 초보자 | novice | tan / cream | dagger | Done; keep as is |
| 검사 | swordsman | blue / red + silver plate | sword | Done; keep as is |
| 마법사 | mage | purple / gold | staff | Robe, so legs mostly hidden |
| 궁수 | archer | green / beige | bow | Quiver on back |
| 성직자 | acolyte | white / blue | mace | Robe; gentle holy look, **no religious crosses** |
| 도둑 | thief | dark grey-violet / violet | dagger | Light, agile; short scarf |
| 상인 | merchant | orange / cream | axe | Apron, practical |
| 기사 | knight | blue / red, heavier plate | spear (also two-handed sword) | Upgrade of the swordsman |
| 위저드 | wizard | navy / gold | staff | Upgrade of the mage; may wear a cape |
| 헌터 | hunter | forest green / tan | bow | The falcon is drawn separately by the engine; leave the shoulder clear |
| 프리스트 | priest | white / crimson | mace | Upgrade of the acolyte; robe |
| 어새신 | assassin | deep purple / crimson | katar | Long scarf; katar is worn over the fist |
| 블랙스미스 | blacksmith | brown / cream | axe | Heavy apron and gloves |

- A second job must read clearly as an upgrade of its first job: same palette family, more ornament and silhouette.
- At 80 px tall, every class must be told apart by silhouette and colour alone.

### Style and constraints
- **Style:** the approved `docs/art/concepts/round2/scene_A.png` character art, exactly as in your Novice parts:
  - flat colours with one hard shadow tone;
  - thick dark-brown outline;
  - thinner inner lines;
  - no gradients, no gloss, no generic anime rendering.
- **Rig-friendly design rules.** Every costume must work under your cut-out contract:
  - Sleeves hide the shoulder joints.
  - The torso hem hides the hips.
  - Nothing important crosses a joint, so it won't tear when limbs rotate.
  - Big accessories (capes, scarves, quivers) are separate layers.
- Work only in `docs/art/concepts/round3/`. Do not modify `src/`, `tools/`, or `docs/art/rig-codex/`.
- Finish with a short Korean summary.
