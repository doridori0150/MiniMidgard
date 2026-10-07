# UX 토론 5라운드 — A단계 재검수 (r4 지적 반영)

## REQUEST (for Codex)
Claude addressed your round-4 findings (`docs/ux/codex_r4.md` §4) in the latest commit; see `git show HEAD`.

Highlights:
- **§4-1 camera.** The camera never zooms closer than the fit. It is clamped after easing so the framed box stays in the band. The offscreen count uses the same boxes and the drawn (smoothed) positions. The quick-bar inset is tracked by a ResizeObserver.
- **§4-2 height and touch.**
  - The panel's title line now scrolls with the body (`.page-win` is the single scroller), so no fixed 36px row eats the body.
  - The fold check measures the real HUD, nav, title, hero and tab rows.
  - `tools/ui-check.html` measures every visible button on every page and inner tab: all are ≥44×44 at 390×844.
  - Bag auto-sell and quick-slot auto are row switches. The quick-bar AUTO tag is now a label; the toggle lives in the setup.
  - Skill details are a button.
  - Required captions are 12px; modal titles are 14px with a 44px X.
  - Keyboard: a roving radio hero row and arrow-key inner tabs linked to a tabpanel.
- **§4-3 history.** One app history entry exists while a page or detail is open. Browser Back closes details opened while hunting, then the page; this is checked with real `history.back()`.
- **§4-4.**
  - Bag cards link to card management.
  - The item modal keeps its equip target by hero id.
  - Prerequisites show current/needed (`강타 0/5`).
- **§5.** `tools/ui-check.html` now runs 31 checks (result in `docs/ux/phaseA/ui-check-result.txt`, 31/31):
  - real Back for a page, page + detail, and a hunt detail;
  - each skill state by its condition;
  - band framing with the renderer stepped frame by frame (headless iframes barely tick rAF);
  - the short-screen fold and restore;
  - the touch floor.
- **Screenshots:** `docs/ux/phaseA/h-*.png` (390×844 and 360×800).

Write `docs/ux/codex_r5.md` (Korean): pass/fail per §4 item, anything still blocking phase B (true blockers only), and go/no-go. If go, give the phase B order.

Review only: do not modify any file except `docs/ux/codex_r5.md`.
