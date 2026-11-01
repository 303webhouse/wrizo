# Harness

**What lives here:** the browser checks every ticket lands with, the suite runner, the box grant, and the GitHub Actions runner.
**Owner (proposal):** every lane; Chat 1 runs trains. **Back to** [MAP](../MAP.md).

## Entry files
- `apps/desktop/scripts/harness/*.mjs`: one file per ticket. `ok()` is a live check, `pok()` a parked successor.
- `apps/desktop/scripts/run-suite.mjs`: runs them all (`--only`, `--parked`, `--no-rebuild`). `apps/desktop/scripts/runtime-verify.mjs`: one browser run.
- `apps/desktop/scripts/box-take.mjs` and `apps/desktop/scripts/box-grant.mjs`: the box turn. `apps/desktop/scripts/harness/seed-guard.mjs`: the seeding law, browserless.
- On Actions: `.github/workflows/harness.yml`, `.github/workflows/frames.yml`; the files that still need the box: `apps/desktop/scripts/ci-box-only.txt`.

## Seams and hooks
Seed through the `window.wrizo*` seams listed in [sync](sync.md). Each area page lists its own.

## Full pair
A full pair is both legs (default and `--parked`) of the whole suite, stamped. Chat 1 runs it for trains.

## Covering harnesses (start here)
`seed-guard.mjs`, `selftest-quiescence.mjs`, `audit-parked-records.mjs`.

## Known traps
- **A browser run needs the box grant:** `node apps/desktop/scripts/box-take.mjs take <lane>`, then release. Browserless checks need none.
- **Park, never edit:** a falsified check stays verbatim, marked SUPERSEDED, with a live successor after it. Audit the park COUNT, not just green.
- **Both legs always run** (`;`, never `&&`). The known-flake list is empty: a red means something is wrong.
- **Redirect harness output to a file,** never `$(node harness.mjs)`: the pipe can hang.
- **The minifier deletes spin loops:** a wait must exit on observable state.
- **Harness files are CRLF.** Splice with the file's own line ending.
- **Probe first:** a missing node fails a check; it must never crash the driver.
