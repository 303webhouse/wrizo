# Train #12f — manifest (Chat 1, Oct 31 2026)

**Product tree `6c58aa10`** (`train-12f`: main `504b959b` + one `--no-ff` merge; main is fast-forwarded to it; `git diff 6c58aa10 HEAD -- apps/desktop/src apps/server` is empty at every records commit after it). Rollback target: `git ce73d615 · railway 32000939` (deploy #12d).

## In
| Lane | Branch @ sha | Merge | What |
|---|---|---|---|
| FIX | polish10-linkdock-r10 `9e7f037d` | `6c58aa10` | Polish #10 item 24, the link dock: a linked card or page opens beside the page, read-only, one at a time, device-local, through the Tutor's own dock. r10 closes the three r9 reds: the reader reads a board's cards through `liveBoxes` (`box-tombstones` T11), and Flux and Machina each name the page in `graftDockAria` (`flux-v2` LX2). |

Clean merge, no conflict. Product code, 6 files, all `apps/desktop/src`: `components/ConnectionsDrawerPanel.tsx`, `components/LinkDockReader.tsx` (new), `components/Tutor.tsx`, `index.css`, `store/deskLexicon.ts`, `store/linkDock.ts` (new). No `apps/server`, no migration, no package change. Also in the merge: the ticket's harness, `scripts/harness/polish10-linkdock.mjs`.

## The runs
- `tsc` desktop 0, `tsc` server 0, `seed-guard` PASS 36.
- **GitHub Actions** full pair, run 41188152180 (8 shards per leg, ref = the full sha): **default 225/232 and parked 225/232; the 7 non-OK on each leg are the capture/probe tools with no verdict line** (`arrival-signin-capture`, `flux-screens`, `flux-v2-part2`, `polish10-14-frames`, `splash-sweep-capture`, `theme-leftovers-capture`, `tutor-drawer-probe`), identical on both legs: no real red. `cd2`, `pw1`, `box-tombstones`, `flux-v2` and `polish10-linkdock` are OK on both legs.
- **Box**, INK's box-only list (12 files) + `box-tombstones`, `flux-v2`, `cd2`, `polish10-linkdock` (16 files), both legs. Stamp `tree=6c58aa10 bundle=index-BkO2ydKf.js/956325b`. **14/16 on each leg; the two reds are both excused by their main controls:**
  - `typewriter-fade` (3/5 on the default leg: THE ORDER, THE OLDEST IS THE FAINTEST or THE NEWEST IS WHOLE): red on the box on every tree since ~06:47Z today, including the three deployed ones (ledger 164, 0 of 12 on `91ac7254`, `175ab289`, `ce73d615` and `3b083fc3`). Not the dock: the file never touches the dock.
  - `cd2` S2 ("a keystroke dissolves BOTH open layers"; `panelGone:false, surveyGone:false`), the one failing check of 53 on both legs: FAILS ON BARE MAIN on the box, 4 of 4 (FIX's control, Fable, Oct 31), so it is the box's state like `typewriter-fade`, not the dock. It is OK on Actions on both legs.
  - Newly green on the box against r9: `box-tombstones` PASS 32, `flux-v2` PASS 158, `polish10-linkdock` PASS 32 (63 renders). `rhizome-latency` PASS (14 checks), no flake call needed.
- Clear: Fable, Oct 31 ("Build the dock train from main 504b959b with r10: Actions full pair + box-only, with typewriter-fade and cd2 S2 excused by their main controls (ledger 164). Green -> SHIP the dock under my clear").
