# Train #12d — manifest (Chat 1, Oct 31 2026)

**Product tree `ce73d615`** (`train-12d`, a fast-forward of `main` from `2e516a23`; `git diff ce73d615 HEAD -- apps/desktop/src apps/server` is empty at every records commit after it). Rollback target: `git 175ab289 · railway e0b88ef0` (deploy #12c).

## In (merged in Fable's order, `--no-ff`, no conflicts)
| Lane | Branch @ sha | Merge | What |
|---|---|---|---|
| FIX | format-r9 `48bf073e` | `801e1d51` | the Tutor-wire fix on top of format-r7 (polish #10 item 4): orphan span marks are stripped only inside the writer's text, so the app's own `[partial: ...]` / `[latest stretch only ...]` headers keep their `[`; the four sync scratch compiles include `wordCount.ts` (the #12b `tu2` / `tu5` / `guided-*` / `item224a` reds) |
| FIX | page-r9 `fcd99d6a` | `33b494ae` | the ink move C4-C9 aims at the zoomed sheet's text box (the #12b `item126` red); `item121` record fix |
| TOOLS | tools-12e-width-gate `d99e42ce` | `ce73d615` | the reflow waits for the measured container width (`widthMeasured`, bug 32e); new `width-gate.mjs`; `reflow-open` off the box-only list |

Product code, measured by `git diff --name-only 2e516a23 ce73d615 -- apps/desktop/src apps/server` (27 files: 25 in `apps/desktop/src`, 2 in `apps/server/src`): the desktop set is `BoardEditor`, `ConnectionsDrawerPanel`, `DeskFrame`, `FirstRunGate`, `HomeFlow`, `InkStratum`, `ScriptEditor`, `Sliver`, `TypeControl`, `decks/library/fromMyPages`, `index.css`, `JournalEntry`, `PageEditor`, `QuickSprint`, `store/api`, `draftDecoration`, `draftFormat`, `grafts`, `lineEquivalents`, `markRuns`, `pageExport`, `persistence`, `tutorLenses`, `wordCount`, `writePlace`; the server set is `sync.ts` and `wordCount.ts` (the word counter, shared). No migration, no package change.

## Out
FIX `linkdock-r9` `974cabef` (rides only once Nick has seen the dock screens; Fable names it) -> the next train.

## The runs
- `tsc` desktop 0, `tsc` server 0, `seed-guard` PASS 36.
- **GitHub Actions** full pair, run 41172520109 (8 shards per leg, ref = the full sha): **default 224/231, parked 224/231; the 7 non-OK on each leg are the capture/probe tools with no verdict line** (`arrival-signin-capture`, `flux-screens`, `flux-v2-part2`, `polish10-14-frames`, `splash-sweep-capture`, `theme-leftovers-capture`, `tutor-drawer-probe`), identical on both legs: no real red. Stamp `tree=ce73d615 bundle=index-DVBlbeEn.js/953498b`. **`reflow-open` PASS 28 on BOTH legs** (check F green; it is no longer box-only, Fable's condition) and the new `width-gate` PASS 14 on both legs. The #12b reds (`tu2`, `tu5`, `item126`, `item121`, `guided-add-scenes`, `guided-w5`, `guided-w1`, `item224a`, `b2-1`) are all OK on both legs.
- **Box**, INK's box-only list (12 files) + `reflow-open`, 13 files, both legs: **CLEAN, 13/13 each** (`box-default.log.txt`, `box-parked.log.txt`); `rhizome-latency` PASS on both legs (no flake call needed). Stamp `tree=ce73d615 bundle=index-DVBlbeEn.js/953498b`, the same asset as Actions.
- Clear: Fable, Oct 30/31 ("#12d, pre-named ... Actions + box-only (move reflow-open back off box-only if TOOLS shows check F green on Actions). Green -> ship under my clear").
