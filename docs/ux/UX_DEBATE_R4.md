# UX 토론 4라운드 — A단계 재검수 의뢰

## REQUEST (for Codex)
Claude fixed your round-3 must-fix list (`docs/ux/codex_r3.md` §3, the five bundles) in commit `84f9ae1`. The diff is in `git show 84f9ae1`; the previous fix `dedb88c` blocks the QA first save.

- **New automated check:** `tools/ui-check.html` drives the real app in a 390×844 iframe (`?qa`) through 21 scripted scenarios: navigation, back order, detail stack, inert background, single execution, badges, skill states, and no save writes.
  - Run it headless: `chrome --headless=new --dump-dom http://localhost:4200/tools/ui-check.html`. The dev server is on :4200.
  - Current result: 21/21 PASS.
- **Screenshot:** `docs/ux/phaseA/g-fix.png`, the 성장/스킬 page at 390×844, 390×600 (the band auto-folds) and 360×800.

Write `docs/ux/codex_r4.md` (Korean):
1. Pass/fail per round-3 item R1–R8 and per bundle, with evidence.
2. Anything still blocking phase B. Distinguish true blockers from polish.
3. Go/no-go for phase B. If go, list the phase B order you recommend (from codex_r2 §3).

Review only: do not modify any file except `docs/ux/codex_r4.md`.
