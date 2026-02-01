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

## Tech sanity
- pnpm install succeeds
- pnpm dev launches window reliably
- .gitignore excludes node_modules/, .claude/, nul
