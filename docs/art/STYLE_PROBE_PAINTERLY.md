# 화풍 테스트 — 손그림 수채풍 판타지 (Codex 의뢰)

## 요약 (사람용)
- 사용자는 트리 오브 세이비어 같은 감성을 게임 안에서 한번 보고 싶어 한다.
- 그 게임 에셋은 저작물이라 쓰지 않는다. 대신 **비슷한 화풍의 오리지널 그림**을 그려 테스트로 올린다.
  - 화풍: 손그림 동화책풍, 부드러운 수채 명암, 차분한 흙빛 팔레트, 가는 선.
  - 화풍은 저작권 대상이 아니지만, **그 게임의 캐릭터·의상·로고·UI를 베끼지 않는다.**
- 테스트 전용이다. 배포 기본값에 넣지 않고, 개발 모드 플래그(`?style=painterly`)로만 켠다.
- 결과물은 `docs/art/style-painterly/`에 둔다.

---

## REQUEST (for Codex)

The user wants to feel how the game would look in a **soft, hand-painted storybook fantasy style**: the look that games like Tree of Savior are known for. Make an **original** style probe in that direction.

**Do not reproduce any existing game's characters, costumes, logos, UI or assets.** Only the general art direction is the reference:
- delicate, thin, dark-sepia line art (not thick cartoon outlines);
- soft painterly / watercolour shading with gentle gradients and texture;
- muted, earthy, slightly desaturated palette with warm light;
- European storybook fantasy;
- small, slightly taller chibi proportions (about 2.5–3 heads);
- 3/4 view facing right.

### 1. Two original characters, as whole-figure sprites
Same game designs as our approved lineup (`docs/art/concepts/round3/class_lineup.png`), **re-imagined in this painterly style**:
1. **Novice, female:** cream bob with ahoge, tan tunic, brown boots, dagger.
2. **Swordsman, male:** short hair, blue tunic, silver breastplate, red sash, sword.

Frames; every frame is one complete painted figure (no part assembly):

| State | Frames | Notes |
|---|---|---|
| idle | 2 | breathing |
| walk | 4 | |
| attack | 3 | the contact frame shows at 140 ms of 280 ms; the blade points straight ahead |

- **Weapon:** paint it **into** each frame. This is a vibe test; no swapping needed.
- **Canvas:**
  - transparent PNG frames;
  - one fixed canvas size for all frames;
  - feet centre on a common ground point (state the origin);
  - character about 600 source px tall.

### 2. A matching meadow background kit
So the characters can be judged in a scene, paint one kit in the same style and **in the exact format our engine already cuts** (see `src/assets/kits/meadow/` for what the current kit looks like):
- **Top half:** two square seamless-ish ground textures side by side, grass (left) and dirt path (right).
- **Bottom half:** a 4×2 grid of props on a flat magenta key (#FF00FF):
  - tree
  - pine
  - bush
  - rock
  - flowers
  - stump
  - fence
  - sign
- One image, square (e.g. 1254×1254), no text.

### Deliverables, in `docs/art/style-painterly/`
- `chars/<novice|swordsman>/<state>_<n>.png`.
- `manifest.json`:
  ```json
  {
    "canvas": [w, h],
    "origin": [x, y],
    "height": <px>,
    "animations": {
      "idle": { "frames": [...], "durations": [...] }
    }
  }
  ```
  - `animations` holds per character: idle, walk, attack.
  - Durations: idle 800+800, walk 4×180, attack 100/80/100.
- `kit_meadow.png`: the background kit in the format above.
- `preview.png`: both characters (all frames) standing on a patch of the new ground with a few props, at 1× and at 80px tall. This shows the overall vibe.
- `NOTES.md` (Korean): the style decisions, plus honest notes on consistency between frames.

### Constraints
- Original work only; nothing copied from any game.
- Work only in `docs/art/style-painterly/`. Do not modify `src/`, `tools/` or other folders.
- Finish with a short Korean summary.
