# AGENTS.md — Working rules for agents

## Stage goal (current)
The **F-arc** ("from open to flow") is complete in code — F1 resume (the typed
pointer) → F2 mirror card → F3 Catch → F4 title-later create + the writing picker
→ F5 TTFK instrumentation → F6 first-line invitation — staged on `main` behind two
hardware gates (tablet: F2–F6; phone: I0 pen discipline). **TTFK** (time to first
keystroke) is the north-star metric, now instrumented per surface. Next queue:
**HOME verification** (first-run / anon-gate flow), the **anti-slop paste rail**
(the foreign-voice import wall, PHILOSOPHY.md § Voice Wall), and
**fragments-under-Pages** — with INK **I3** (unlink-to-movable-graphic) married to
that design pass. (See docs/north-star.md v0.2 for the as-built architecture.)

## Stack (do not change unless ticket says so)
- Windows
- pnpm workspace
- Electron + Vite + React + TypeScript

## Repo layout (required)
- apps/desktop
- packages/core
- packages/modules-writing
- docs/

## Hard rules
- Keep changes minimal. No refactors outside ticket scope.
- No new deps unless required by the ticket.
- Stop when Definition of Done is met.

## PAGE IS PRIMARY (ratified 2026-07-12, `docs/page-primacy-canon.md`)
While a writing surface is mounted, no tool, panel, menu, assistant, sheet,
or setting may move, resize, or unmount it. Tools orbit the page: they
collapse and expand inside fixed layout tracks, overlay without displacing,
and dissolve with the chrome. Only an explicit act of departure — opening
different work via wayfinding — may replace the page, and every departure
must offer a stateful one-tap return (the return chip: scroll, caret, and
mode restored).

Self-check for any ticket touching a writing surface:
1. Does the page's bounding rect change when your feature opens or closes?
2. Does the editor unmount at any point your feature is used as intended?
3. If the user leaves through your feature, does one tap return them to
   the exact writing state?

"Yes / yes / no" on any line fails the rule. Prior art: W1's fixed-track
grid (the rect half) and J5's Add to… sheet (the no-unmount half); W2's
return chip (the guaranteed-return half).

Category table for future self-checks — **tools/chrome** (never displace):
AI assist rail, settings gear, incentive row, format bar, Add to…/Port to…
sheets, toasts, any future panel or menu. **Navigation** (may replace, must
be return-faithful): DeskRail destinations, the notebook pager, Pages⟷Plan,
opening any document from any list.

**The one ruled exception (page-size, Oct 2026):** the Typewriter zoom changes the page's rect on purpose
(the same page transformed ~1.6x: no reflow, no unmount) and leaving returns the exact rect, scroll, caret
and text. Nothing else may claim it (`docs/page-primacy-canon.md`).

## Harness scenarios persist
Every ticket's verification scenario is a committed artifact, not a throwaway:
`scripts/harness/<ticket>.mjs` (or the ticket's established harness location),
landing in the same commit as the build it verifies. Review fixes re-run the
ticket's scenario verbatim and extend it when a fix adds behavior. J4 is the
first citizen; J3/VW predate the rule and have no scripts to backfill.

**The harness seeding law.** A fixture that seeds state via raw `localStorage`
writes (bypassing the app's own `save*`/`upsert` functions, then `app.reload()`
to hydrate the cache) must do so while OFF any surface with a flush handler.
`persistence.ts`'s `flushNow()` re-serializes *every* collection from the
in-memory cache unconditionally, not just the ones with a pending write — a
raw seed made while such a surface is still mounted gets silently overwritten
when the reload's teardown fires that handler. Navigate to a route with no
flush handler (Desk works) first, seed, reload from there, then navigate to
the actual target. Discovered in M1 (`scripts/harness/m1.mjs`); load-bearing
for every future harness that seeds fixtures this way.

**SUCCESSOR, ratified 2026-08-01 (Fable), on item 82 fix 2's proven mechanism —
the ordering rule above stands verbatim; this supersedes it in strength:
SEEDING GOES THROUGH THE APP'S SEAMS, NEVER RAW STORAGE.** Use
`window.wrizoCreateJournalPage` (and its siblings) as ab3/b1/b2/fx1/th2/w1/w2
already do. **The reasoning, proven on the box rather than argued:** the ordering
rule protects against a flush firing while a *surface* is mounted — but the
hazard is not the surface, it is the CACHE. `persistence.ts` hydrates
`cache.journalEntries` **once**, at module init, never re-reads it, and no
`storage` listener exists anywhere in `apps/desktop/src`; `flush()` then
serializes that cache **wholesale**. So a row written to `localStorage` after
boot is invisible to the app and is **erased by the next flush of that
collection**, from any source — including one the fixture never touched.
Measured: a row injected from the Desk and then followed by a navigation to
`/journal` was destroyed within 100ms, because `JournalBoardGate` mints the
system board (`getOrCreateSystemBoard` -> `saveJournalEntry` -> `scheduleFlush`)
and the resulting flush wrote a cache that had never contained the row. A seed
made through the seam enters the cache, so no flush can erase it — the mechanism
is removed rather than out-timed. **A real writer is immune** (every product
write reaches storage through the cache); this is a harness-only hazard, which is
exactly why it went unnoticed. **A real writer is immune** — every product write
reaches storage through the cache — which is exactly why this stayed invisible.

### HOW TO SEED A FIXTURE (item 85-C, wave 1 landed 2026-09-11)

`scripts/harness/seed-guard.mjs` enforces all of this every suite run: it FAILS
on any file that newly writes a collection raw, on a baseline entry that has
stopped, on an annotation without a substantive reason, and on a malformed seam
call site. The population is measured, never remembered — 56 at item 85-B, **20
today** (18 files awaiting wave 2, plus 2 annotated deliberate).

**Seed through a seam. Never `localStorage.setItem` on a collection.**
`wrizoCreateJournalPage`, `wrizoPatchEntry`, `wrizoCreateProject`,
`wrizoCreateBinder`, `wrizoPatchProject`, `wrizoCreateStoryPlan`,
`wrizoCreateDrawer`, `wrizoSetProjectDrawer`, `wrizoPinPageToBoard`,
`wrizoFlushNow`.

**► THE DEBOUNCE, WHICH COST A STAMPED PAIR. A product write is DEBOUNCED
(`scheduleFlush`, 300ms); the raw write it replaces was SYNCHRONOUS.** A fixture
that seeds and then immediately `app.reload()`s discards the page — and the
cache holding the row — before the timer fires. The row never reaches storage
and the surface never mounts. This is not a race you can out-wait reliably and
it does not look like a seeding bug: 36 of 80 files died as NOVERDICT on wave
1's first leg, every one reporting nothing at all.

**The `window.wrizo*` seams above all flush before they return, so a seam-seeded
fixture is safe.** If you reach storage through any OTHER product path and then
reload, call `window.wrizoFlushNow()` first. Product code is untouched by this —
it calls the store functions directly and keeps its own debounced cadence.

**► CARRY `origin` AND `source` EXPLICITLY.** `createJournalPage` defaults
`origin: 'journal'` and hardcodes `source: 'page'`, so a row that OMITS either is
a DIFFERENT row: absent `source` is what makes an entry a raw capture
(`computeFragmentItems` filters `e.source !== 'page'`), and absent `origin` is
the pre-AB3 grandfather shape. Pass `origin: null` / `source: null` to seed a row
without that field. The absence of a key is a value; counting a key's presence
cannot see it — that mistake cost two of wave 1's three pairs.

## House rules for any lane (ratified 2026-09-30, after direct pushes to `main`)
This project is worked by more than one kind of agent — Claude-based build
lanes, Nick's Cursor sessions, Claude Code in the cloud, and whatever comes
next. Whatever runs here, on whatever tool:
- **One subject, one branch.** Don't fold an unrelated fix into a ticket's
  branch.
- **Never push or merge to `main`.** Chat 1 is the only lane that merges to
  `main` and the only one that deploys. Land your work on its own branch and
  say so; chat 1 verifies and merges.
- **No browser runs on the Windows box without chat 1's grant.** The grant
  file (`~/.wrizo/box-turn.json`, `apps/desktop/scripts/box-grant.mjs`) is the
  only announcement; a browserless check (`tsc`, `seed-guard.mjs`) needs no
  grant.
- **Chat 1 owns the grant file; a lane may take a FREE box only through the
  one-command guard** (`node apps/desktop/scripts/box-take.mjs take <lane>
  <token>` — it writes the grant only if none exists and says who holds it
  otherwise; `release <token>` removes it only if the token is yours). Never
  overwrite or clear a grant that is not yours, and name the turn (start and
  end, UTC) in your report. (Ratified 2026-10-22, Fable.)
  **The grant file holds only a HASH of the token** (Oct 23): the harness launcher
  matches the token in `WS_BOX_TURN` against that hash, so reading the file gives
  nothing to present. Prefer `box-take.mjs take <lane>` with no token: it draws a
  random one and prints it once - export it in the shell or script that runs the
  harness (any shell, nested scripts included). A token you pick by hand is weaker
  (guessable from its hash). Binding the turn to a process tree is OPTIONAL
  (`take --bind`, flat scripts only: msys breaks the parent link across nested
  forks). Every launch attempt, allowed or refused, is logged to
  `~/.wrizo/box-launches.log`.
- **The ledger (`docs/open-threads.md`) is chat 1's.** Report your work to it
  through chat 1, not by editing it yourself.
- **Fable reviews; Nick's ship word comes to chat 1.** Build lanes don't
  self-clear a build for deploy.

## Config changes: propose, never ship
Changes to CC's own permissions, harness configuration, or session settings
are proposed in a report and made only on Nick's explicit word — never shipped
inside a build. (First stated in docs/j-arc-runbook.md.)

### Running the harness on GitHub Actions (INK, Oct 29)
Any lane may run a harness file, a short list, or a full pair on a hosted runner while the box is busy: `gh workflow run harness.yml --ref ci/actions-harness -f ref=<your-branch> -f files=a.mjs,b.mjs` (or `-f files=pair -f shards=8`); screenshots of named screens in both page tones at 1366 and 1920: `gh workflow run frames.yml --ref ci/actions-harness -f ref=<your-branch>`. Alone it is **advisory**: not a stamped pair, and it clears nothing. **An Actions full pair plus the box-only list run on the box, together, clear a deploy** (Fable's ruling, Oct 29); the box stays the reference. It needs no box turn (a hosted job is its own machine) and never touches production. The files that still need the box are listed in `apps/desktop/scripts/ci-box-only.txt`; the full how-to, the security posture and how Chat 1 reads a pair are in docs/deploy.md "Harness on GitHub Actions".

## Commands you must run before saying done
- pnpm install
- pnpm dev

## Planning committees

Convene by name for non-trivial decisions; skip routine work. Each runs a double-pass: propose, then critique and trim, then a single recommendation. Product/design hand-off: Experts frame intent and the "why"; Architects shape the build and the "how"; both refine together. Marketing runs on built-in opposition (below). Keep deliberation proportional to the decision.

### The Experts - craft and cognition (guard the "why" and the user)
- Deleuzean philosopher: rhizomatics and divergence; guards "divergence is free, convergence is the product" and theme integrity (PHILOSOPHY.md).
- Cognitive scientist (ADHD, attention): flow, executive function, task initiation; the science under the momentum mechanics.
- Writing-craft pedagogue: generative vs revisional practice; guards the Two Minds (Middle Door, Trellis).
- Motivation psychologist: intrinsic motivation, habit, friction-as-commitment, anti-perfectionism without punishment.
- Professional editor: line and developmental editing; clarity, structure, cutting; the convergence and finishing standard.
- Discovery writer (pantser): emergence-first, writes to discover; momentum over plan; voice of the Middle Door user.
- Structural writer (plotter): outline-first, writes to execute and finish; control and revision; voice of the Trellis user.

### The Architects - build and feel (guard the "how"); roster set by the Experts
- Frontend/app architect: React/Electron/TypeScript; editor state, mode switching, writing-surface performance.
- Systems engineer: local-first, sync, Postgres; the clean-derivedText/struck model and offline durability; owns testing.
- Interaction designer: UX flows, motion, the push-back-to-writing engine (dissolve/glow/progress), accessibility.
- Visual/graphic designer: typography, color, the locked tokens, the four themes, the handwritten identity.

### Marketing - positioning and growth (runs on opposition)
Core tensions to convene against each other: reach vs principle, and metrics vs story. Then resolve to one move.
- Growth/acquisition marketer: reach, channels, funnel, experimentation; the scale pole.
- Brand/positioning strategist: differentiation, the anti-AI-slop identity, niche integrity, long-term equity; the principle pole and counterweight to growth.
- Narrative/content strategist: the founding story (e.g. the logo drawn in-app), voice, emotional hooks.
- Skeptical target-user advocate: the ADHD writer allergic to hype and marketing-speak; the customer's BS detector.

## Cursor Cloud specific instructions

- There is no lint script and no ESLint config. Typecheck with `pnpm --filter @writer-studio/desktop exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @writer-studio/server exec tsc --noEmit -p tsconfig.json`. Browserless harness checks such as `node apps/desktop/scripts/harness/seed-guard.mjs` need no box turn. Browser harnesses (`verify:runtime`, `verify:suite`) refuse unless `WS_BOX_TURN` matches `~/.wrizo/box-turn.json` (`apps/desktop/scripts/box-grant.mjs`); clear the grant when the run ends. `verify:suite` also refuses while another harness browser is on the machine.
- `.nvmrc` and `engines.node` say `18.x`. This image's Node is 22, `pnpm` warns, and install still succeeds (`engine-strict` is unset). Keep Node 22: `apps/desktop/scripts/runtime-verify.mjs` needs global `WebSocket`.
- `pnpm-workspace.yaml` lists `electron` under `ignoredBuiltDependencies`, so `pnpm install` does not download the Electron binary. `node apps/desktop/node_modules/electron/install.js` is idempotent and required before `pnpm dev` can open a window. Vite still starts without it.
- `pnpm dev` (see root `package.json`) serves Vite at `http://localhost:5173` on IPv6 only — `127.0.0.1:5173` refuses — then launches Electron. DBus and GPU errors in that log are non-fatal here; the window still loads. Routes are hash routes (`/#/`).
- The server has no watch script. Build with `pnpm --filter @writer-studio/server build`, then `pnpm --filter @writer-studio/server start`. Boot requires `DATABASE_URL` and `SESSION_SECRET` (`apps/server/.env`, gitignored; copy from `apps/server/.env.example`). `GET /healthz` does not touch Postgres; migrations on boot do. Vite proxies `/auth` and `/api` to port 3000.
- Postgres 16 is installed. systemd will not start it (`policy-rc.d` denies the service). Start the cluster with `sudo pg_ctlcluster 16 main start`. Local role `wrizo` / password `wrizo`, database `writer_studio`, URL `postgres://wrizo:wrizo@127.0.0.1:5432/writer_studio`.
- Arrival → Write does not need an account. The first keystroke creates the page in local storage.
