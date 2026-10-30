# Train #12 — manifest (Chat 1, Oct 30 2026)

**Product tree `91ac7254`** (`train-12`, a fast-forward of `main` from `c40f7c8c`; `git diff 91ac7254 HEAD -- apps` is empty at every records commit after it). Rollback target: `git 39985bf1 · railway 9a3bb774` (deploy #11).

## In (merged in Fable's order, `--no-ff`, no conflicts)
| Lane | Branch @ sha | Merge |
|---|---|---|
| FIX | polish10-anchor-r7 `64f0580f` | `02322a3e` |
| FIX | polish10-caret-r7 `212fbc35` | `f216e0f0` |
| FIX | polish10-board-r6 `0437f48a` | `91ac7254` |

Product code in the train, measured by `git diff --name-only c40f7c8c 91ac7254 -- apps/desktop/src apps/server` (8 files, all `apps/desktop/src`): `components/BoardEditor.tsx`, `components/FluxBlockCaret.tsx`, `components/ModeStage.tsx`, `components/Tutor.tsx`, `components/useTypewriterFade.ts`, `index.css`, `store/menusDrawers.ts`, `store/pageScale.ts`. No `apps/server`, no migration. 19 files change in all; the rest are harness and docs.

## Out (-> #12b)
page, format, linkdock, TOOLS deck-rows.

## The runs
- `tsc` desktop 0, `tsc` server 0, `seed-guard` PASS 36.
- **GitHub Actions** full pair, run 41102448889 (`harness.yml` on `ci/actions-harness`, ref = the full sha, 8 shards per leg): **213/220 files OK on each leg; the 7 non-OK are the capture/probe tools with no verdict line** (`arrival-signin-capture`, `flux-screens`, `flux-v2-part2`, `polish10-14-frames`, `splash-sweep-capture`, `theme-leftovers-capture`, `tutor-drawer-probe`), identical on both legs: no real red. Stamp `tree=91ac7254 bundle=index-CwYswyvf.js/946238b` (`pair-*.log.txt`, `summary.md`).
- **Box**, INK's box-only list (12 files), both legs, same stamp as Actions (same asset name and bytes):
  - parked: **CLEAN, 12/12** (`box-parked.log.txt`).
  - default: **11/12; `rhizome-latency` red 1/14** (`box-default.log.txt`, `rhizome-latency-box-default-fail.txt`): check C, the fade median 25.4 ms against a rest median 19.7 ms (5.7 over a 5 ms budget); p95 and max inside budget.
- **The control for the `rhizome-latency` red** (Fable's method: no worse than main -> the flake). The file alone, default leg, same box, alternating checks:
  - train-12 `91ac7254`, 5 runs (the red above + `rl-train-1..4`): **2 red of 5**. Reds: C (rest 19.7 / fade 25.4) and B (rest 21.1 / flash 26.7). Fade medians 24.4–25.4 ms; rest medians 19.7–23.9 ms.
  - main `c40f7c8c`, 4 runs (`rl-main-1..4`): **1 red of 4**. Red: B (rest 20.8 / flash 26.2). Fade medians 24.1–25.9 ms; rest medians 20.8–22.5 ms.
  - Every red is a median-vs-rest miss of 5.4–5.7 ms on a 5 ms budget, with p95 and max inside budget; the fade medians are the same distribution on both trees (24.4–25.4 vs 24.1–25.9), so caret-r7's `useTypewriterFade.ts` change shows no latency effect. Not worse than main -> the known median-budget flake.
- Clear: Fable, Oct 30 (the Actions full pair + the box-only list on the box; the rhizome flake rule applies).
