# Browserless checks

`.github/workflows/browserless.yml` is an advisory GitHub Actions job. It installs from `pnpm-lock.yaml`, typechecks `apps/desktop` and `apps/server`, runs `build:web`, then runs the twelve browserless scripts that passed on `main` at `a8dc256`. It does not deploy. It does not grant the Windows box, and it does not replace a stamped pair.

A red mark here is information. The workflow does not set branch protection, so it does not block a merge by itself.

## One measured run

On this Linux machine, Node 22.14, dependencies already present, `main` at `a8dc256`: **26 seconds** wall clock. That was `pnpm install --frozen-lockfile` (no new downloads), both `tsc --noEmit` runs, `build:web` (1.3s), and these scripts. `item135.mjs` was found after that clock and added 0.1s. A cold GitHub runner spends most of its time on the install. Budget **3 minutes** a run.

`engines.node` says `18.x`. The job uses Node 22, which is what this run was measured on. pnpm prints an unsupported-engine warning and continues.

## Minutes

A private repository's free pool is 2,000 minutes a month. At 3 minutes a run, 20 runs a day would use most of that. Docs-only commits on `main` are the common case, so the workflow runs only when `apps/`, `packages/`, the lockfile, or this workflow changes. Triggers:

- a pull request that touches those paths
- a push to `main` that touches those paths
- a manual run (`workflow_dispatch`)

A new push to the same ref cancels the run already in progress.

## Included

Run from `apps/desktop`. Each exited 0 on `a8dc256`.

| Script | What it is |
|---|---|
| `scripts/harness/hooks-order.mjs` | Static hook-order check. Needs that working directory (`src/`). |
| `scripts/harness/hooks-order-ast.mjs` | Same check, read from the syntax tree. |
| `scripts/harness/seed-guard.mjs` | Raw-storage seeding guard. |
| `scripts/harness/tutor-mirror.mjs` | Tutor prompt matches its record on disk. |
| `scripts/harness/item99.mjs` | Orphan-reaper decisions, on made-up process tables. |
| `scripts/harness/item135.mjs` | Sleep detector, pure arithmetic on two clocks. 0.1s, timed separately on the same tree. |
| `scripts/harness/item140.mjs` | Box-grant matching, on temporary files. |
| `scripts/harness/item141.mjs` | Settle-guard source check. |
| `scripts/writing-format-proof.mjs` | Formatter proof, 42 checks. |
| `scripts/writing-engine-audit.mjs` | Prints the format engine's stored-versus-visible rows and exits 0. It does not fail the job on a stray marker. |
| `scripts/sync-incremental-pull-proof.mjs` | Sync cursor proof. No browser, no Postgres. |
| `scripts/sync-chunked-push-proof.mjs` | Chunked-push proof. No browser, no Postgres. About 16 seconds of the 26. |

## Excluded

**Needs a browser and a box grant.** Each file imports `withHarness` from `runtime-verify.mjs`. That opens Chromium and refuses without chat 1's grant. Not run.

`apps/desktop/scripts/menus-probe.mjs`, `mockup170.mjs`, `selftest-quiescence.mjs`, `writing-s0-frames.mjs`, and every `apps/desktop/scripts/harness/*.mjs` that imports `withHarness` (the suite roster: `ab1` through `ab4`, `b1`, `b2`, `b2-1`, `b3`, `bg1`, `bg2`, `bm1`, `cd1`, `cd2`, `cd4`, `e1`, `e3`, `e4`, `fx1` through `fx18`, `hb1`, `hb2`, `item83e`, `item83f`, `item84`, `item84b`, `item85c`, `item87`, `item88`, `item89`, `item97`, `item104`, `item109`, `item112a`, `item118`, `item121`, `item126`, `item130`, `item133`, `item137`, `item158`, `item159`, `item170`, `item9192`, `j4`, `j5`, `j6`, `m1` through `m4`, `outdent`, `pb1`, `pw1`, `pw2`, `reveal`, `s1`, `sc1`, `sc2`, `strike`, `th1`, `th2`, `tp1`, `tu1`, `tu2`, `tu5`, `underline`, `vw1`, `w1`, `w2`, `writing-r1`, `writing-r2`).

**Launches that harness, or is the browser driver.**

| Script | Reason |
|---|---|
| `scripts/run-suite.mjs` | The stamped-pair runner. It rebuilds `dist-web` and drives the browser files above. |
| `scripts/runtime-verify.mjs` | The browser driver. `--selftest` opens Chrome. |

**Browserless, but not green on this `main`.**

| Script | Reason |
|---|---|
| `scripts/harness/item139.mjs` | Opens no browser, but it does not pass unless `WS_BOX_TURN` matches the grant file. On this tree, with no grant: `ITEM139 VERIFY: FAIL — 2/10 failed`. CI must not invent a grant. |
| `scripts/audit-parked-records.mjs` | No browser. Exits own exit is 1 on this `main` (`REVIEW no-key 7`). The ledger already records that non-zero exit. |

**Not checks.**

| Script | Reason |
|---|---|
| `scripts/dev.js`, `scripts/wait-and-electron.mjs` | Start Electron. |
| `scripts/gen-icons.mjs` | Writes icon files. |
| `scripts/box-grant.mjs`, `scripts/box-turn.mjs` | Read and write the box-grant file. Not a test. |
| `scripts/orphan-reaper.mjs`, `scripts/sleep-detect.mjs`, `scripts/trusted-point.mjs` | Libraries the harness imports. Running the file is not a check. |
