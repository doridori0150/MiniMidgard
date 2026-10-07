# UX 토론 1라운드 — Codex 독립 검토 의뢰

## REQUEST (for Codex)

You are the UX lead reviewing **Mini Midgard**, a mobile-portrait single-player idle RPG with a Ragnarok-Online feel. Claude (the engineer) and you will debate the UX and agree on a plan; Claude then implements it and you review the result. This is round 1: give your **independent** review. Claude is writing its own review in parallel, and you'll exchange and critique each other next round.

### The game in one paragraph
- A party of up to 3 heroes (slots unlock at Lv 10 / 22) auto-hunts on a field map: walking, fighting mobs, picking up loot, levelling, and calling bosses and MVPs.
- The player's job is decisions:
  - stat and skill points, job changes;
  - gear, refining, cards in slots;
  - which map to hunt, including sealed/hidden maps with entry conditions;
  - party tactics (target/position/skills/chase per hero; pull count and rest threshold);
  - quick-slot consumables.
- Offline time is simulated on return.
- The user's priorities, in their words:
  - keep the **original RO feel** over idle-genre conveniences: many maps, map-specific loot, cards and accessories, the joy of hunting for them;
  - class-specific party AI is the top system priority;
  - mobile portrait;
  - the user wants the screen UX improved "a lot".

### Inputs
- **Screenshots** of every main screen, 500×900 CSS px at 2×: `docs/ux/shots/`
  - field, status, skills, equip, cards, bag, map, town, party, settings.
  - They were taken in a dev QA boot (Lv 30 swordsman / acolyte / mage, at the start of a map, so the field is calm).
- **UI code:** `src/ui/`
  - `Hud.tsx`: top bar, party rail, nav;
  - `FieldView.tsx`;
  - `panels/*`;
  - `WorldMap.tsx`;
  - `Shop.tsx`;
  - `styles.css`.
- **Game rules:** `docs/CONTENT.md` and `src/game/` if you need them.
- **Quality bar:** `~/Projects/RiftLoopPrototype/docs/퀄리티 가이드.md` covers event delivery: 접수→준비→실행→접촉→결과→정착, intensity by frequency, and reward flow.

### What to deliver: `docs/ux/codex_r1.md` (Korean)
1. **Top issues, ranked by player impact (10–15).** For each:
   - the screen;
   - what's wrong, with concrete evidence from a screenshot or code;
   - why it matters to an idle RPG player on a phone.
2. **Proposals for each issue.** Make each concrete enough to implement: layout, interaction, states, copy. Include a rough ASCII wireframe for any layout change, and an effort estimate (S/M/L).
3. **Structural recommendations**, if any. Examples: how panels relate to the field (sheet heights, whether the field should stay visible), navigation model, information hierarchy of the field HUD, first-session onboarding, and what the player should see when returning after being offline.
4. **What NOT to change**, because it already works.
5. **Open questions** where you are unsure and want Claude's view.

### Constraints
- Review only: **do not modify any files except `docs/ux/codex_r1.md`**.
- Be specific and opinionated. "Improve readability" is not useful; "the panel title bar at y≈300 is covered by the party rail, so …" is.
