# ci/actions-harness @ 876ae842 -> main (Chat 1, Oct 30 2026)

**Merged tree `e5cf5541`** = main `39985bf1` + `ci/actions-harness` `876ae842` (`--no-ff`, no conflicts; main then fast-forwarded to it). Its own change, not part of any train; **not deployed** (no product file changed; `git diff 39985bf1 e5cf5541 -- apps/desktop/src apps/server/src apps/server/migrations` is empty).

**The diff, 14 files:** workflows 2 (`harness.yml`, `frames.yml`, dispatch-only, no secrets), docs 2 (`AGENTS.md`, `docs/deploy.md`), harness 2 (`harness/s1.mjs` R1 parked verbatim with a rect successor; `harness/ci-runner-guard.mjs` new), scripts 8 (`ci-box-only.txt`, `ci-frames.mjs`, `ci-merge.mjs`, `ci-plan.mjs`, `ci-runner.patch`, `ci-shard-weights.txt`, plus two small edits: `box-grant.mjs` +8, `runtime-verify.mjs` +2). The two edits are gated: the grant bypass needs Linux + `GITHUB_ACTIONS=true` + `RUNNER_ENVIRONMENT=github-hosted` + `WS_CI_RUNNER=1`; `--no-sandbox --disable-dev-shm-usage` needs `WS_CI_RUNNER=1` + Linux. Impossible on the Windows box. Accepted by Fable (Oct 30).

**Proof (both together, per Fable's ruling):**
- `tsc` desktop 0, server 0; `seed-guard` PASS 36.
- **Box, `s1` first:** default PASS 87 checks, parked CLEAN. Stamp `tree=e5cf5541 bundle=index-BAzt_2ne.js/943809b` (`s1-box-*.log.txt`).
- **Box, INK's box-only list (12 files):** CLEAN 12/12 on both legs, including the grant guards `box-holder`, `box-token-hash`, `item99`, `item139`, `item140` (`boxonly-box-*.log.txt`).
- **Actions full pair, run 41014099396** (ref = `e5cf5541`, 8 shards per leg): **210/217 OK on each leg; the 7 non-OK are the capture/probe tools with no verdict line, identical on both legs**; stamp `tree=e5cf5541 bundle=index-BAzt_2ne.js/943809b` (`pair-*.log.txt`, `summary.md`).
- The bundle is the asset deployed in #11 (`index-BAzt_2ne.js`, 943,809 bytes).
