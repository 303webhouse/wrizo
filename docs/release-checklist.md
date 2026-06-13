# Release Checklist (M1)

## Smoke test: Creative plotter path
- New Project -> Creative -> Project Home loads
- Structure Wizard: framework recommendation shows
- Beat list is clearly preview-only in Wizard
- Start Structure Wizard -> Beat Wizard opens
- Save Notes shows Saved
- Structure Board shows notes and Set as Next Beat works
- Restart app -> notes persist

## Smoke test: Pantser path
- Session Launcher -> Start Writing (Quick Sprint)
- Timer optional: can write/save/finish without starting timer
- Custom timer works when enabled
- Nudges: manual only, max 3; no auto-rotation
- Stuck? hint is non-animated and based on no-typing, not no sentence
- Finish -> Save as Project creates project and retains sprint text
- Restart app -> sprint text persists

## Brand sanity
- Ember "e" favicon shows in the tab; apple-touch / PWA install icons show the "e" on the ink tile; the mark reads at 16px
- Wordmark lockup ("e" + "Ember") on launcher and login; no "Writer Studio" anywhere
- UI sans is Mulish; Newsreader for display/prose; Courier Prime for counters
- One brass action per screen; orange only on live/finish states (timer hairline, finish count) — never a control
- Lamplit atmosphere on every screen (warm pool, vignette, faint grain, glints); reduced-motion clean (nothing animates but the timer hairline + the one finish count-up)
- Glowing hero logo is threshold-only (launcher/login/splash) — never glowing inside the working chrome (sprint/beat/board)

## Tech sanity
- pnpm install succeeds
- pnpm dev launches window reliably
- .gitignore excludes node_modules/, .claude/, nul
