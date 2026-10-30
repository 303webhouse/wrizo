# Train #11c — manifest (Chat 1, Oct 30 2026)

**Product tree `2dbb6752`** (`train-11c`, a fast-forward of `main` from `bc6cf256`; `git diff 2dbb6752 HEAD -- apps` is empty at every records commit after it). Rollback target: `git fc9e82ea · railway 750250dd` (deploy #10).

## In (merged in Fable's order, `--no-ff`, no conflicts)
| Lane | Branch @ sha | What |
|---|---|---|
| INK | 12-r2 `e5a537ab` | Flux marks a card's first line by colour only (item 12); BD1/F13 parked verbatim with successors; wrap-card harness waits for the theme face |
| INK | 13-r `1c079a71` | Outline clear of the stage's chevron tab; Storyboard lane box + cards square; row text gap (item 13) |
| INK | 14-r `84619c33` | Flux rail shows only the place name (item 14, Nick's Oct 28 ruling) |
| INK | 15-r `c46f3eca` | Tutor's Fragments list skips an entry whose whole text repeats one already listed (item 15) |
| TOOLS | tools-11-intake-r2 `90f8ae19` | help-choose-census C10 + mutant parked with successors; intake E2 comparison |
| TOOLS | tools-11-mark-files `6de8286c` | Machina's board button reads Start Files; WRIZ wordmark block follows the active carrier |
| FIX | polish10-card-r2 `9c12abab` | card grip (MC1 mutant moved 32px) |
| FIX | polish10-timing-r4 `68c93175` | item 21: a closed drawer fades on the drawer token |
| Chat 1 | sample-seed `65737100` | scripts + harness only: the sample-account seed, with `account-tools-r4` `239ec9fc` under it (account-state, create-account, safety-copy, set-password). No `apps/desktop/src`, no `apps/server/src`, no migration. |

Product code in the train, measured by `git diff --name-only bc6cf256 2dbb6752` (6 files, all `apps/desktop/src`): `components/DeckWizard.tsx`, `components/HelpMeChoose.tsx`, `components/PlaceBlock.tsx`, `index.css`, `store/deskLexicon.ts`, `store/tutorLenses.ts`. No `apps/server/src`, no migration; everything else is harness, scripts and docs.

## Out (-> #12)
FIX `polish10-caret-r3` `60e22a37` (owns `fx1` S1 C2), `polish10-board-r3` `d880796c` (owns `polish10-ground` G2 and the `guided-w1` parked count), `polish10-anchor-r4` `fda64ea5` (owns `fx5` S1 c and `polish10-ground` G1); page, format, linkdock.

## The runs
1. **train-11** `c60e211d` (12 branches, anchor-r3), box, 227 files per leg: default 219/227, parked 216/227, NOT CLEAN (`train11-first-pair-*`). anchor-r3 carried page-r's commits.
2. **train-11b** `f25a5731` (anchor-r4 for r3): the red files re-run both legs (`train11b-reds-*`): `item121`, `item126`, `polish10-page` fixed; `flux-v2`, `fx1`, `fx5`, `polish10-ground` still red, `guided-w1` red parked, `rhizome-latency` default red once.
3. **Bisect** at main + the 12 merge points (`bisect-p00..p12-*`): flux-v2 -> INK 12 (harness stale, fixed by 12-r2), fx1 -> caret-r3, polish10-ground + guided-w1 parked -> board-r3, fx5 + polish10-ground G1 -> anchor-r4. sample-seed adds no red.
4. **train-11c `2dbb6752`** (Fable's cut: without caret, board, anchor):
   - **GitHub Actions** full pair, run 41009878391 (`harness.yml` on `ci/actions-harness`, ref = the full sha, 8 shards per leg): **208/215 files OK on each leg; the 7 non-OK are the capture/probe tools with no verdict line** (`arrival-signin-capture`, `flux-screens`, `flux-v2-part2` capture half, `polish10-14-frames`, `splash-sweep-capture`, `theme-leftovers-capture`, `tutor-drawer-probe`), identical on both legs: no real red. Stamp `tree=2dbb6752+2dirty` (the CI patch overlay) `bundle=index-BAzt_2ne.js/943809b` (`pair-*.log.txt`, `summary.md`).
   - **Box**, INK's box-only list + `flux-v2` + `polish10-12-part2`, 14 files, both legs: **CLEAN, 14/14 each** (`box-default.log.txt`, `box-parked.log.txt`). Stamp `tree=2dbb6752 bundle=index-BAzt_2ne.js/943809b`. `rhizome-latency` PASS 14 on both legs (no flake call needed).
   - 215 + 12 box-only = the 227 files of the pair; the Actions and box bundles are the same asset (same name, same bytes).
   - `tsc` desktop 0, `tsc` server 0, `seed-guard` PASS 36.
5. Clear: Fable, Oct 29/30 ("my clear covers BOTH runs together: the Actions full pair + the box-only list on the box; this overrides the docs' advisory line").
