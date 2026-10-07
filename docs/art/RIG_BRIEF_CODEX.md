# 캐릭터 조립 에셋 — Codex 자율 설계 의뢰

## 요약 (사람용)
- 앞선 두 번의 부품 의뢰는 우리가 형식을 정했는데 결과가 어색했다.
- 이번엔 **목표와 엔진 조건만 주고, 제작 방식은 Codex가 스스로 판단해 설계·제작·검증**하게 한다.
- 결과물은 `docs/art/rig-codex/`에 저장한다: 계획서, 부품 PNG, 기준점 manifest, 자체 조립 미리보기.

---

## REQUEST (for Codex)

You are the technical artist responsible for making our hero art **assemble-able in the game engine**. Decide the best production method yourself, then produce and verify the assets. You have full judgement over the approach; below are the goal, the engine's capabilities and what failed before.

### Goal
Game characters that look exactly like the approved mock `docs/art/concepts/round2/scene_A.png` (flat cartoon, thick dark-brown outline, ~3 heads tall chibi, 3/4 view facing right). They must be assembled at runtime so that equipment can be swapped freely:
- outfits for 13 classes
- 8 hairstyles × 10 hair colours
- 2 face types
- headgear in top, mid and low slots: leaf sprout, hairpin, beret, glasses, ribbons…
- 10 weapon types held in the hand

They must also animate:
- idle (breathing)
- walk
- melee swing: the blade must point forward at the contact frame
- bow draw and release
- cast
- sit
- hurt
- dead (lying down)

Sprites appear about **80 px tall** on a phone (drawn at 2–3× device pixels).

### What the engine can do (Canvas 2D)
- Draw image parts with any translate, rotate and scale, in any layer order.
- Tint parts by multiply, for hair colour.
- Read a JSON manifest with per-part pivot points and anchor points.
- Our current attempt is `src/render/rig.ts` + `src/render/rigTemplate.ts`, a joint template with a cut tool `tools/rig-cut.html`. You may propose a different contract. The engine will be adapted to **your** manifest.
- **Frame-based sprites are also acceptable** if you judge them better: painted frames per state plus anchor points per frame for headgear and weapons, like classic 2D MMOs. Choose what you think works best for AI-generated art plus heavy equipment swapping.

### What failed before (learn from it)
1. **v1** (`docs/art/RIG_BRIEF.md` → `docs/art/concepts/rig/rig_novice_v1.png`): separate parts on a sheet.
   - Inconsistent scales between parts.
   - The legs had their own shorts tops, duplicating the torso.
   - The arms had shoulder caps.
   - There were no joint positions.

   Our assembly looked wrong next to your own assembled reference: small head, long legs, stick-like arms, a visible neck. See `docs/art/prototype/5_rig_poses.png`.
2. **v2** (`docs/art/RIG_BRIEF_V2.md`, `docs/art/rig-template/template.png`): one full body drawn on a joint template, cut by us. In progress. Its first try placed the head and shoulders too high.

### What to deliver, in `docs/art/rig-codex/`
1. `PLAN.md` (Korean): your chosen method and why, the asset contract (canvas, origin, layers, pivots, anchors, naming), how outfits, hair, headgear and weapons attach, how each animation state is achieved, and how you keep the style and scale consistent.
2. **A working asset set for the Novice girl** (design: `docs/art/concepts/rig/rig_novice_v1.png` cell 15 and the mock), plus **the Swordsman outfit** swap, the **leaf sprout** and **hairpin** headgear, and a **dagger** and **sword**.
   - Transparent PNGs, not magenta, if you can produce or convert them. Otherwise a flat key colour, and say so.
3. `manifest.json`: everything the engine needs — for each part the file, size, pivot, anchor points, z-order and rest angle (or, for frames: per-frame anchors). Document it in `PLAN.md`.
4. **Self-verification:**
   - Assemble the character yourself from your parts according to your manifest, by any means available to you (a script, image composition…). Save `preview_assembled.png` showing idle, a walk step, the attack contact pose, Swordsman plus sword, and leaf plus hairpin.
   - Compare it with the approved mock in `PLAN.md`, and iterate until the assembled result matches the mock's proportions and quality.
   - Be honest about remaining gaps.

### Constraints
- Do not modify anything under `src/` or `tools/`. Work only in `docs/art/rig-codex/` (scratch files are fine there).
- Keep the approved style, with no gloss and no generic anime rendering.
- Finish with a short Korean summary: the method chosen, what's delivered, and verified quality.
