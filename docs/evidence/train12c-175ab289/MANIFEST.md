# Train #12c — manifest (Chat 1, Oct 30 2026)

**Product tree `175ab289`** (`train-12c`, a fast-forward of `main` from `7d773589`; `git diff 175ab289 HEAD -- apps/desktop/src apps/server` is empty at every records commit after it). Rollback target: `git 91ac7254 · railway 98364995` (deploy #12).

## In
| Lane | Branch @ sha | What |
|---|---|---|
| TOOLS | tools-12d-fit-icon `27fcd98d` | the top of TOOLS' stack: deck-rows -> reflow-open -> sized-by-hand -> the Fit-to-text icon (bug 32d) |

Product code, measured by `git diff --name-only 7d773589 175ab289 -- apps/desktop/src apps/server` (5 files, all `apps/desktop/src`): `components/BoardEditor.tsx`, `decks/rowFit.ts`, `index.css`, `store/deskLexicon.ts`, `types/index.ts`. No `apps/server`, no migration, no package change.

## Out (-> #12d)
FIX `format-r7` `55b9c5e2` / `format-r8` `170b48d5` and `page-r7` `cf0e0898`, with linkdock. Why (the train-12b bisect, `train12b-bisect/`; box, Windows, both legs, so real reds, not Actions-only):
- **format-r7, harness only:** `guided-add-scenes`, `guided-w5`, `guided-w1`, `item224a-sync-integrity` ("Cannot find module './wordCount'": the four scratch compiles of `sync.ts` omitted the new `wordCount.ts`). Fixed in format-r8 `170b48d5` (not re-run).
- **format-r7, product:** `tu2` and `tu5` (one check each). `apps/desktop/src/store/api.ts` `orphans` removes every unescaped `[` from the page text sent to the Tutor, including the `[` of the truncation headers the app prepends itself (`tu5`: `bible` starts `partial:` not `[partial:`). format-r8 does not touch it. Needs a product fix.
- **page-r7, product:** `item126` (6/42: the ink-move checks C4-C9) on both legs; `item121`'s PARKED record red on the parked leg (FIX's page-r8 record fix).
- **TOOLS tip:** no red of its own. `b2-1` parked on Actions only (a page-eval ReferenceError in `seedProjectWithPlan`; PASS on the box at every point).
Fable's pre-authorisation: harness-only small reds are the owner's to fix; a real product red drops that branch to the next train.

## The runs
- `tsc` desktop 0, `tsc` server 0, `seed-guard` PASS 36.
- **GitHub Actions** full pair, run 41131669482 (8 shards per leg, ref = the full sha): **default 219/226 OK, the 7 non-OK the capture/probe tools with no verdict line** (`arrival-signin-capture`, `flux-screens`, `flux-v2-part2`, `polish10-14-frames`, `splash-sweep-capture`, `theme-leftovers-capture`, `tutor-drawer-probe`). **Parked 218/226: the same 7 plus `reflow-open` FAIL 2 of 28** (check F, Arbor and Machina). Stamp `tree=175ab289 bundle=index-DzynPyN7.js/949495b`.
- **`reflow-open`, the call** (Fable's ruling (a), Oct 30): TOOLS' own file, new with #12, no main control. Actions solo re-run, run 41133874126: default PASS 28, parked FAIL 1 of 28 (Machina F). The default leg passed both times; the harness has no parked-specific code; the failing readings look shifted between decks (Machina's "late" 0.1434 is Arbor's "prompt" value from the first failure), a stale read under runner load. Box: **6/6 PASS 28 checks** (3 per leg). Moved onto the box-only list (`ci-box-only.txt` + the `docs/deploy.md` bullet), reason in the file: check F flaky on the runner's parked leg, 6/6 on the box; the shipped code strictly improves on main.
- **Box**, INK's box-only list (12 files), both legs: **parked 12/12 CLEAN; default 11/12, `rhizome-latency` red once** (check B, flash median 26.7 vs rest 21.6, 5.1 ms over the 5 ms budget, p95 and max inside budget): the known median-budget flake (the #12 control: train 2/5 vs main 1/4, same distribution; `train12-91ac7254/`). Stamp `tree=175ab289 bundle=index-DzynPyN7.js/949495b`, the same asset as Actions.
- Clear: Fable, Oct 30 ("(a): SHIP #12c (TOOLS 27fcd98d alone) under my clear. Move reflow-open onto the box-only list").
