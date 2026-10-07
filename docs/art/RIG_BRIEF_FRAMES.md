# 캐릭터 애니메이션 v4 — 라인업 그림 그대로 움직이기 (Codex 의뢰)

## 요약 (사람용)
- 사용자는 `docs/art/concepts/round3/class_lineup.png`를 매우 마음에 들어 한다. 문제는 조립된 캐릭터가 그 그림처럼 보이지도 않고, 종이인형처럼 움직인다는 점이다.
- 방향은 메이플식이다.
  - 머리 유닛(얼굴·헤어·머리장식)은 한 장으로 모든 프레임에 재사용한다.
  - 몸은 자세마다 그린 프레임을 쓴다.
  - 무기와 머리장식은 프레임마다 앵커로 붙인다.
- 시범 범위는 초보자와 검사다. 게임 안에서 현재 컷아웃 리그와 나란히 비교한 뒤 전 직업으로 확장한다.
- 결과물은 `docs/art/rig-frames/`에 저장한다.

---

## REQUEST (for Codex)

You are again the technical artist. Your cut-out set in `docs/art/rig-codex/` works technically — the game draws it exactly as your verify.py does — but the user rejected how it looks and moves:
- **At rest it doesn't look like the approved art.** Short stub arms splayed out, weapon held up, stiff A-stance. Compare `docs/art/rig-codex/preview_assembled.png` with your own `docs/art/concepts/round3/class_lineup.png`.
- **In motion it reads as a paper puppet.** Rigid parts rotate, legs scissor, and the attack arm pops when it is swapped.

The user loves `class_lineup.png` and wants **exactly that art, moving like hand-drawn animation**, while equipment stays swappable. Our research (`docs/research/RIG_ASSET_RESEARCH.md`) and the shipped references (MapleStory, Ragnarok Online) point to this structure. You may improve it if you find something better, but explain why in PLAN.md.

### Recommended structure (MapleStory-like)
1. **Head unit, never redrawn per frame.**
   - Contents: face, hair back/front, and headgear on top.
   - It is one rigid unit attached at a per-frame `neck` anchor of the body frame, with optional small per-frame head tilt and offset.
   - Faces therefore can't drift between frames. Give it two face expressions besides normal: `hurt` (squint) and `ko` (closed eyes), drawn on the same head.
2. **Body frames painted per pose, per class, without the head.**
   - States and frame counts:
     - idle: 2 (breathing)
     - walk: 4
     - attack: 3 (wind-up / contact / follow-through)
     - cast: 2
     - sit: 1
     - hurt: 1
     - dead: 1 (lying)
   - The idle frame must be **the class_lineup body as drawn**, so the game at rest looks exactly like the lineup.
   - Each frame records:
     - `neck`, the head attach point and head angle;
     - `hand`, the weapon grip point and weapon angle;
     - z-order hints: does the weapon go in front of or behind the body in this frame?
   - Paint the fist so a weapon can sit in it. The weapon is not part of the body frame.
3. **Weapons: one image each**, attached at the frame's `hand` anchor and angle.
   - At the attack contact frame, the blade must point straight ahead, to the right.
4. **Headgear: one image each**, attached to **skull anchors on the face/head base** (`crown`, `brow`, `eyes`, `mouth`), never to the hair. Hair volume differs per style, so hair-based anchors would make headgear drift.
5. **Hair: the head base plus per-style hair front/back images**, painted cream for multiply tint like now.

### Pilot scope (deliver all of this)
- **Body frame sets:** Novice and Swordsman, all states above.
- **Heads:** the female face with hairstyle 01 (approved Novice bob) and hairstyle 02 (short spiky) from `round3/hair_faces.png`. Both are swapped on the same bodies, which proves hair swapping.
- **Headgear:** leaf (crown) and star hairpin (brow / side).
- **Weapons:** dagger and sword.

### Timing (must match the game simulation)
- **Melee attack:** a swing lasts 280 ms. The hit is applied at **140 ms**, so the contact frame must be on screen at 140 ms. Wind-up comes before it, follow-through after.
- **Walk:** a looping cycle. Choose the duration that reads naturally at the walking speed: about 1.4 body heights per second (105 field units/s for a 76-unit-tall hero).
- **Idle:** a slow breathing loop.
- **Cast:** loop the 2 frames while channelling.
- **Sit, hurt, dead:** hold their frame. The game decides when each starts and ends.
- Frames are shown without tweening by default. You may specify per-frame tweens if you judge they help.

### Production guidance (from our measurements — please read)
- Image generation is good at whole characters and weak at matching scale between separately drawn parts. It does not follow numeric coordinates; in our tests it was off by 30–45 px. Edits that use an existing image as the base preserve shape well.
- Suggestions:
  - Generate a class's pose frames **as edits of its lineup body**, in one sheet per class, with a simple pose guide if useful.
  - Normalise everything with your own script afterwards: key, palette-lock to flat colours, scale, and measure anchors.
- **Backgrounds:** the generator's "pure magenta" is not uniform. Magenta also collides with pink and purple outfits, so pick a key colour far from each asset's palette (e.g. green), or deliver transparent PNGs.
- Display size is about 80 px tall on a phone (drawn at 2–3× device pixels). Status-panel portraits show the head at about 3× that, so keep source resolution generous.

### Deliverables, in `docs/art/rig-frames/`
1. **`PLAN.md` (Korean):** the method and the contract. Cover the canvas, origin (feet centre on the ground), frame list, anchors, z rules, how heads, hair, headgear and weapons attach, timing, and how this scales to 13 classes × 8 hairstyles × 2 faces.
2. **Assets:** transparent PNGs for all body frames, heads/faces, hair, headgear and weapons.
3. **`manifest.json`:** everything a player needs. Name the schema (e.g. `minimidgard.frames/1`).
4. **A reference player script**, like your verify.py. It assembles any state/time/equipment combination from the manifest, and **the game will port it line by line**, so keep it simple and deterministic.
5. **Self-verification:**
   - `preview_frames.png`: every frame of both classes, assembled with heads, hair 01/02, both headgear and both weapons.
   - `preview_vs_lineup.png`: your idle frame at 80 px and at 3× next to the lineup characters.
   - An animated preview if you can (GIF or APNG) of idle, walk and attack.
   - Checks:
     - grip alignment;
     - blade forward at 140 ms;
     - head attach continuity (no jumping of the neck between frames);
     - no part outside the canvas.
   - Be honest about gaps.

### Constraints
- **Style:** exactly `class_lineup.png` — flat colours, one hard shadow tone, thick dark-brown outline, thinner inner lines. No gradients, no gloss, no generic anime rendering.
- Work only in `docs/art/rig-frames/` (scratch files are fine there). Do not modify `src/`, `tools/` or other `docs/art` folders.
- Finish with a short Korean summary: the method, what was delivered, and the verified quality.
