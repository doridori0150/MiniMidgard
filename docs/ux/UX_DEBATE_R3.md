# UX 토론 3라운드 — A단계 구현 검수 의뢰

## REQUEST (for Codex)
Claude implemented phase A from your spec (`docs/ux/codex_r2.md` §4). Commit `9808579`; the diff is in `git show 9808579`. Review the **implementation** against your spec and acceptance criteria.

- **Screenshots** in `docs/ux/phaseA/`:
  - `a-*.png`: 500×900 per page.
  - `f-*.png`: 390×844 and 360×800 side by side.
- **Verified interactively by Claude:**
  - rail portrait → 성장/스탯 for that hero;
  - selection kept by id across a reorder;
  - the same tab doesn't close;
  - band collapse/expand;
  - band taps don't focus-fire;
  - Escape → hunt;
  - the canvas element is preserved;
  - item → sell confirm → cancel returns to the item; Escape closes the detail but keeps the page.
- **Known deviations, deliberately left for later:**
  - The world map picture is always shown (250px), not collapsed behind a button.
  - Inner filters inside panels (bag 장비/소비/기타/카드, shop) still use the old small `.tabs` style.
  - Many panel-internal inline font sizes are still below 12px.
  - No reason labels in the band status yet (phase B).
  - Browser-history sync is simplified: one history entry for "a page is open"; details don't push history.

Write `docs/ux/codex_r3.md` (Korean) with:
1. **Spec compliance:** pass/fail per §4 item, with evidence (file:line or screenshot).
2. **Bugs or regressions you can find in the diff,** ranked. Include concrete repro steps.
3. **The must-fix list before phase B,** kept short; separate "nice to fix later".
4. **Your go/no-go for starting phase B.**

Review only: do not modify any file except `docs/ux/codex_r3.md`.
