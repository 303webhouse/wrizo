# Deploy — Writer Studio on Railway (W3)

The web build deploys to Railway as a single Node service that serves the built
renderer and the `/auth` + `/api` endpoints, backed by a Railway Postgres.

> **Secrets rule:** secret *values* live only in Railway env vars and an untracked
> `apps/server/.env` for local dev. Never write a secret value into any file in
> this repo, commit, log, or doc. This file lists env vars by **name only**.

## Project layout on Railway

- **Project:** `writer-studio` (a NEW project on the owner's account — never the
  trading-hub / pandoras-box project, and never a service inside it).
- **Services:**
  - `Postgres` — a NEW Railway Postgres instance (provisioned via `railway add -d postgres`).
  - `writer-studio-app` — the Node web service built from this repo.

## Build & start (config-as-code)

`railway.json` at the repo root drives the app service:

- **Builder:** NIXPACKS (auto-detects pnpm from `pnpm-lock.yaml`; pnpm pinned via
  the root `packageManager` field).
- **Build command:**
  `pnpm install --prod=false && pnpm --filter @writer-studio/desktop build:web && pnpm --filter @writer-studio/server build`
  (`--prod=false` forces devDependencies — vite/typescript — to install even though
  `NODE_ENV=production` is set for runtime.)
  - `build:web` emits `apps/desktop/dist-web` (Electron's `dist/` is untouched).
  - the server build emits `apps/server/dist`.
- **Start command:** `node apps/server/dist/index.js`
  - serves `apps/desktop/dist-web` at `/` with SPA fallback, plus `/auth/*`,
    `/api/*`, and `/healthz`.
- **Healthcheck path:** `/healthz`.

Migrations run automatically on boot when the `users` table is absent
(`apps/server/migrations/001_init.sql`).

## Environment variables (set on the `writer-studio-app` service)

| Name | Notes |
|---|---|
| `DATABASE_URL` | Reference the Postgres service's internal URL: `${{Postgres.DATABASE_URL}}`. Not a typed-in secret. |
| `SESSION_SECRET` | 32+ random bytes. Generate, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. **Owner-set secret.** |
| `INVITE_CODES` | The registration gate handed to testers — a comma-separated list. **Owner-set secret.** |
| `NODE_ENV` | `production` (enables secure cookies + `trust proxy` + Postgres TLS). |

`PORT` is provided automatically by Railway; the server reads `process.env.PORT`.

## Steps performed / to perform

1. **Create project + Postgres** (done): `railway init --name writer-studio`,
   then `railway add -d postgres`.
2. **Create the app service** (done): `railway add --service writer-studio-app`.
3. **Set non-secret env** (done): `NODE_ENV=production`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
4. **Set secret env** (owner): `SESSION_SECRET`, `INVITE_CODES` — via the Railway
   dashboard or `railway variables --service writer-studio-app --set NAME=VALUE`.
5. **Deploy:** `railway up --service writer-studio-app` (uploads the repo;
   `node_modules`, `dist`, `dist-web`, and `.env` are gitignored and not uploaded —
   Railway installs and builds fresh).
6. **Public domain:** `railway domain` generates `https://<app>.up.railway.app`.
7. **Verify:** `GET /healthz` returns 200; register with the invite code; write a
   sprint on mobile data; confirm the row in Postgres.

## Local dev against this database

`apps/server/.env` (untracked) holds `DATABASE_URL` (the Postgres **public** proxy
URL, `DATABASE_PUBLIC_URL`), a local `SESSION_SECRET`, a local `INVITE_CODES`,
`PORT=3000`, and `NODE_ENV=development`. Run `pnpm --filter @writer-studio/server build`
then `node apps/server/dist/index.js`.

## Ship checklist (per deploy) — the definition of ready

The setup above is one-time; this is the recurring gate for every ship. Deploy is
always Nick's separate word ("DEPLOY WHEN READY" is standing for the P-waves).

1. **Merged + verified at the merge HEAD:** `tsc` ×2 (app + node) EXIT 0, then **rebuild
   `build:web` FIRST** — never run the suite against a stale `dist-web` — then the full
   historic suite read to completion **BOTH `HARNESS_PARKED` settings** (via the committed
   `apps/desktop/scripts/run-suite.mjs`). **A suite-of-record claim MUST name the tree SHA +
   the served bundle asset hash** (`index-<hash>.js` / `.css`), so any suite claim can be
   re-examined against the exact build that produced it. *(The item-82 lesson, 2026-07-31: a
   control whose served bundle was recorded nowhere and later overwritten reported clean
   `main` RED — a claim that could never be re-examined. `bd0b4a0`'s fresh, hash-named build
   of the same tree is 52/52 CLEAN both settings. The original reds remain unattributed —
   item 82, watch-class. This rule exists so no suite claim is ever unfalsifiable again.)*
2. **Manifest enumerated** — a records commit naming EVERYTHING in the target SHA (every
   merged-but-undeployed ticket, per the stamp law), docs range attested zero-src outside
   the named arcs.
3. **Rollback target named BEFORE ship** — the current live SHA (`git <sha> · railway <id>`),
   ratcheted forward each deploy. Rolling to a superseded deploy resurrects its env (e.g. a
   pre-rotation key), so the ratchet is explicit.
4. **Push before deploy** — production must never run a SHA that isn't on origin (the orphan
   class). Order: re-merge → verify → **push main** → `railway up` → stamp → ledger.
5. **Stamp both identifiers** — `git <sha> · railway <deployment-id>`, verified LIVE:
   `/healthz` 200, the new asset hash served, `/auth/me` 401. An env-only change (e.g. a key
   rotation) needs a `railway redeploy` to take effect and gets its own append-only stamp
   annotation (same git SHA, new railway id).

6. **The upload leaves out what does not belong in it** — the root `.railwayignore` lists
   `docs/evidence/` (hundreds of MB of captures) and Nick's untracked
   `docs/theme-foundations/flux/Flux Word Picker.html`; `railway up` honours it (together
   with `.gitignore`). Nothing is moved aside or restored around a deploy any more (until
   deploy #9 the evidence folder and that file were moved out by hand).

### Shipping during a RED-suite state — pre-ruled house law (Fable, 2026-07-31)

A green full suite is the normal gate (step 1). When clean `main`'s suite is standing RED
(e.g. item 82), a green suite is unavailable, so a **hotfix may ship ONLY on ALL THREE, and
NEVER silently**:

- **(a) targeted spec green** for the changed surface — the fix's own harness passes;
- **(b) the red set UNCHANGED in identity** — no NEW reds (same files, same failures); a new
  red halts the ship;
- **(c) Nick's explicit word** naming the standing reds as a recorded exception for this ship.

All three, recorded in the manifest. The burden shifts from "full suite green" to
targeted-green + red-set-invariance + the founder's named exception.

## Harness on GitHub Actions (INK, Oct 29)

The live harness and a screenshot job run on GitHub-hosted runners, so any lane can run any harness file (or a full pair) in parallel while the Windows box is busy. **The box stays the reference machine**, and an Actions run is never a stamped pair. **What clears a deploy (Fable's ruling, Oct 29):** an Actions full pair (both legs, every file not on the box-only list) **together with** the box-only list run on the box clear a deploy. Actions alone is advisory and clears nothing.

**Security (the repo is PUBLIC, so every log line is public).** Both workflows are `workflow_dispatch` only: no push, no `pull_request`, no `pull_request_target`, no fork trigger. `permissions: contents: read`. No secret is referenced anywhere. The harness needs no database: `runtime-verify.mjs` serves `dist-web` itself with an in-process auth/sync double, so nothing in a job can reach production (this replaces the brief's throwaway Postgres: there is nothing for it to serve). Inputs are validated and passed through env, never put into a shell line. Third-party actions are pinned to full SHAs. Only suite logs, merged logs and frames are uploaded (14 days), never `docs/evidence`.

**How a lane runs it** (`--ref ci/actions-harness` picks the workflow and tooling until this reaches `main`; `ref` is the tree that is tested, so your branch needs neither the workflow nor the CI patch):

- One or a few files: `gh workflow run harness.yml --ref ci/actions-harness -f ref=<your-branch> -f files=a.mjs,b.mjs -f leg=both`
- A whole pair, 8 shards per leg (about 15 minutes): `gh workflow run harness.yml --ref ci/actions-harness -f ref=<branch-or-full-sha> -f files=pair -f leg=both -f shards=8`
- Compare to a box log of the same tree: add `-f box_default=docs/evidence/<dir>/<default>.log.txt -f box_parked=docs/evidence/<dir>/<parked>.log.txt`.
- Frames (named screens, both page tones, 1366 and 1920): `gh workflow run frames.yml --ref ci/actions-harness -f ref=<your-branch> [-f screens=blank-page,journal] [-f themes=plateau,flux] [-f widths=1366] [-f screens_file=<path in your branch>]`. Built-in screens: front-door, blank-page, blank-page-draft, page-with-words, page-drawer, journal. The manifest flags a light frame byte-identical to its dark twin (a theme that ignores the page tone).

**How Chat 1 reads a pair.** Open the run page: the **Pair summary** lists every non-OK file per leg and, with the box-log inputs, the parity table (file, box verdict, Actions verdict). The `pair-merged` artifact holds `pair-default.log.txt` and `pair-parked.log.txt` in run-suite's own line shape, headed "ADVISORY: not a box-stamped pair". Per-shard logs and per-file output are the `suite-<leg>-<n>` artifacts. A file red on Actions and green on the box is a parity finding, not a verdict: read its per-file output before trusting either side.

**What matches the box.** Chrome for Testing 156 (the box's Edge is major 156), Node 24.13.0, `TZ=America/Denver`, `en_US`, a full-history checkout with a CRLF working tree (`core.autocrlf=true`, as on the box), the bundled `@fontsource` set. Hosted Linux only adds `--no-sandbox --disable-dev-shm-usage`, gated by `WS_CI_RUNNER=1` + Linux + `GITHUB_ACTIONS` + `RUNNER_ENVIRONMENT=github-hosted` (`box-grant.mjs isGithubHostedRunner`; impossible on the box, proven by `harness/ci-runner-guard.mjs`). A hosted job is its own throwaway machine, so it takes no box turn.

**Which files stay box-only** (`apps/desktop/scripts/ci-box-only.txt`; the workflow refuses them and leaves them out of `pair`; they leave the list only after a repeated parity run shows the file holds on a hosted runner):
- Timing budgets a shared cloud VM cannot promise: `glitch-meter`, `rhizome-latency`, `typing-latency-scroll`.
- Windows-bound (they test the box's own tooling: PowerShell/WMI process table, `taskkill`, `C:\` and USERPROFILE paths): `box-holder`, `box-token-hash`, `item99`, `item139`.
- Animation/timing-sensitive, red on a hosted runner in at least one leg of the sharded pair: `rhizome-goal`, `splash`, `typewriter-fade` (the last flipped between two runs of the same tree).
- `item140`: a box-guard test that runs `run-suite` inside itself; on a hosted runner the guard is bypassed by design, and the nested suite leaves browsers that void its shard.
- `polish10-12-part2`: green on the box, 4 of 21 red on the runner, the same 4 every run. **Measured on both machines (Oct 30):** card g4's body line wraps to the same three lines on the box and on the runner ("...every " / "light."), so it is NOT a text-width difference. The difference is the card's height: the box leaves it at 152.3px (scrollHeight 150), the runner's board grew it to 167.9px. BoardEditor's reflow effect only ever GROWS a card (`h` = the largest `scrollHeight` it has seen), so a transient overflow during load is kept for good; on the runner something overflows for a moment in Flux and Machina only (their writing faces load lazily; a guess) and on the box it does not. Why is not yet measured (the next probe polls `scrollHeight` from page load). Product note for Fable: that ratchet makes a card's final height depend on load timing.
- `reflow-open`: Check F (a card's height with late fonts equals prompt fonts) is flaky on the runner's PARKED leg only (red 2 of 28 in the pair, 1 of 28 solo; the default leg passed both times; the failing values look shifted between decks, a stale read under runner load) and 6/6 PASS 28 checks on the box (3 per leg). No main control exists (the file is new with TOOLS #12). Moved to the box-only list on Fable's ruling (Oct 30).

**Parity, measured (full pair, the box's own tree 8dc5394b, Oct 30).** 8 shards per leg finish in about 13 minutes of wall time (box: about 115 minutes of file time per leg). Against the box's deploy #10 logs: default leg 191 identical verdict lines, **0 files green on the box and red on Actions** after the box-only list above; the files that differ are ones red on the box's older pair tree and green here, or capture scripts that return NOVERDICT on both. Two runner-only differences were found and fixed, both worth knowing: a shallow checkout fails files that run `git show` or merge-base diffs (the job uses full history), and source-text anchors written for CRLF fail on a Linux LF checkout (the job restores the tree through `core.autocrlf=true`, as on the box). Not yet shown: viewports other than each file's own, fonts beyond the bundled `@fontsource` set, and any ms-budget file. **Text on the runner (Oct 30, measured):** Chrome there already lays text out unhinted with fractional widths (the same 279.83px for one bundled-face string under every hinting, subpixel and fontconfig setting tried; only a forced full hinting changes it), so no rendering flag is pinned. `s1`'s 1px was not text at all: its R1 check read the popover gap from integer `offsetTop`/`offsetHeight`, and a sheet whose scale lands on a fraction (probably the narrower Linux scrollbar; not measured) reads -1 while the real gap is exactly 0; R1 is parked verbatim with a rect-based successor and `s1` is green on Actions (87 checks, both legs).
