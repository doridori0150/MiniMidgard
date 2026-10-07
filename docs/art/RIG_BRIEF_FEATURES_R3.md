# 이목구비 v3 — 원본 감성 유지 + 종류별로 확실히 다르게 (Codex 의뢰)

## 요약 (사람용)
- v2에서 목 연결과 남녀 분리는 해결됐다. 하지만 이목구비가 문제다.
  - 눈이 작고 가늘어져서 **처음 승인한 얼굴의 감성(크고 파란 세로형 눈, 자신만만한 작은 미소, 결연한 눈썹)**이 사라졌다.
  - 여자 눈 3종이 거의 구분되지 않는다.
- 사용자 지시: **"처음 그 원본 감성은 유지하고"** 이목구비를 다시 그린다.
- 범위는 이목구비 PNG와, 필요하면 그 pivot만이다. 몸·머리형·헤어·목·계약 구조는 그대로 둔다.
- 엔진은 같은 manifest 구조를 그대로 읽으므로 코드 변경 없이 교체된다.

---

## REQUEST (for Codex)

Your v2 frame set (`docs/art/rig-frames2/`, `minimidgard.frames/2`) is in the game. The neck fix and the gender split are accepted. **The facial features are not:**
- The eyes became small and narrow, so the face lost the charm of the art the user approved.
- The three female eye types are nearly indistinguishable (see your own `preview_faces.png`).

The user's instruction: **redraw the features, and keep the original feel from the beginning.**

### The golden reference: "the original feel"
- **Your v1 face:** `docs/art/rig-frames/assets/faces/normal.png`, and how it reads in `docs/art/rig-frames/preview_vs_lineup.png`.
- **The approved lineup faces:** `docs/art/concepts/round3/class_lineup.png`.
  - Big vertical blue eyes with a dark top lash line and a white highlight.
  - Determined slanted brows.
  - A small smug closed smile.
  - A tiny nose mark.
- **Type 01 (female) must reproduce that original face**, at the same size and position relative to the head as in v1/lineup. It is the default, so the game's default look returns to the approved face.
- **Male 01** is the same family adapted:
  - straighter, thicker brows;
  - eyes slightly less tall but still big and readable, with no lash flick;
  - the same confident mouth.

### Types must be clearly different (both genders)
Each type must be recognisable **at the real in-game size (~80px tall character)**, not only at 3×. Suggested directions; adjust them if you have better ideas in the same style:

| Feature | 01 (original) | 02 | 03 |
|---|---|---|---|
| Eyes | Big vertical, determined (approved face) | Round, soft, larger iris, gentle | Sharp cat-like, upturned outer corner, narrower |
| Brows | Determined slant | Soft arch (calm) | Thick and straight (stern) |
| Mouth | Small smug smile | Open happy smile | Small neutral / "cat" mouth |
| Nose | Tiny mark | Small hook line | — |

- **Expression variants stay:**
  - eyes: normal / hurt (squint `> <`) / closed;
  - brows: normal / hurt;
  - mouth: normal / hurt / ko.
- The hurt and closed variants keep each type's character, e.g. type 02's closed eyes are softer curves than 03's.

### Constraints
- **Keep the contract.** Same `features` structure, file paths, `featureAnchors` and expressionMap. If a feature needs a different canvas or pivot, update only that entry's `pivot` and size in `manifest.json`.
  - Do not change body frames, head bases, hair, neck, headgear, weapons, timing or the player.
- **Before replacing, archive** the current v2 feature PNGs and manifest to `docs/art/rig-frames2/archive/features_v2/`.
- **Style:** flat colours, thick dark-brown outline where the original uses it, clean inner lines. No gradients, gloss or generic anime rendering.
- Work only in `docs/art/rig-frames2/`. Do not modify `src/`, `tools/` or other `docs` folders.

### Verification (in `docs/art/rig-frames2/verification/`)
1. `features_v3_catalog.png`: every type and expression on both head bases, at 3× **and** at real 80px character size.
2. `features_v3_vs_original.png`: female 01 (and male 01) next to the v1 face and the lineup faces, at the same scale.
3. **Distinctness metric:** for each gender and feature, the mean per-pixel difference between every pair of types in the normal variant, plus a downscaled 80px comparison. Report the numbers. Any pair that is visually too similar fails.
4. Re-run your seam, cut and anchor checks. They must still pass.
5. Update the previews: `preview_faces.png`, `preview_overview.png`, GIF.

Finish with a short Korean summary: what changed and honest remaining gaps.
