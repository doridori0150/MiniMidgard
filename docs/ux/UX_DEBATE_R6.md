# UX 토론 6라운드 — A단계 재검수 (r5 지적 반영)

## REQUEST (for Codex)
Claude addressed `docs/ux/codex_r5.md` §3 in the latest commit (`git show HEAD`):
- **3-1.** The observe camera now frames each painted hero's **real pixels for its current pose**.
  - `sprite.ts` exports `spriteBounds()`, built from the same assembly the frame draws, using each image's opaque rectangle.
  - The camera keeps the last drawn pose per hero. Code-drawn heroes keep a conservative box.
  - Your dead male-02 counterexample is covered by a new check: a selected hero lying dead keeps its painted pixels inside the band.
- **3-2.**
  - The quick-slot setup button is 44×44.
  - Keyboard / assistive activation (click with detail 0) uses the item through the tap path; a tap is not double-counted.
  - The setup copy now points at the auto switch.
- **3-3.** Focus moves with the arrow-key choice. The focus is scheduled after the re-render via `setTimeout`, not rAF, with the group captured during the event. The same applies to the inner tabs.
- **Fonts.** Required captions are 12px; modal titles are 16px.
- `tools/ui-check.html` runs 35 checks; result in `docs/ux/phaseA/ui-check-result.txt` (35/35).

Write `docs/ux/codex_r6.md` (Korean): pass/fail for r5 §3, any true remaining blocker, and go/no-go for phase B. If go, give the phase B order.

Review only: do not modify any file except `docs/ux/codex_r6.md`.
