# Writer Studio — Reimagining Handoff Brief

**You are a fresh Claude Code agent. Read this document in full before touching anything.**

**Read order:** (1) this brief, (2) `AGENTS.md`, (3) `docs/ui-redesign-spec.md`, (4) `docs/north-star.md`. Skim `docs/roadmap-stage2.md` and `docs/release-checklist.md`.

**Precedence:** This brief > AGENTS.md > ui-redesign-spec.md.
⚠️ **`PROJECT_RULES.md` is VOID for this repository.** It was copied from a different project and instructs pushing to `github.com/303webhouse/pandoras-box` on `main`. Do not follow it. Do not push to that repo. This repo's workflow is branch-per-ticket, local merges to `m1-creative-flow` (see §3). Never reuse credentials, env vars, databases, or Railway services belonging to the pandoras-box / trading-hub project anywhere in this work.

---

## 1. Orientation

**The product:** Writer Studio — a writing studio for writers with ADHD that keeps you moving one step at a time. It does not write for you. Momentum-first: the default path is always Next Action → Draft/Sprint. Planning is opt-in and timeboxed. Read `docs/north-star.md`; its guardrails are law.

**Current state:** Milestone M1 complete on branch `m1-creative-flow`. Seven screens (Session Launcher, Create Project, Project Home, Structure Wizard, Beat Wizard, Structure Board, Quick Sprint) in a pnpm monorepo: Electron + Vite + React + TypeScript at `apps/desktop`. All persistence is synchronous `localStorage` via `apps/desktop/src/store/persistence.ts`. Three story frameworks live as JSON in `packages/modules-writing/data/frameworks/`.

**The pivot (new):** The owner is tester #1 and writes on the move. **The web is now the primary target for the testing phase.** The app deploys to Railway (owner's paid account) with Postgres, served to phone and desktop browsers as an installable PWA. The Electron shell is **parked, not deleted** — leave `main.ts`/`preload.ts`/dev scripts intact and untouched; everything we build lives in the renderer + a new server, so Electron can be revived later by pointing it at the same code.

**Why offline-first is non-negotiable:** the single worst failure this app can have is losing words written on a train platform. Every write lands locally first and syncs in the background. The network is never allowed to block, delay, or interrupt writing. No scary connectivity errors — offline is a normal, quiet state.

**Three work streams:**
- **A-tickets** — app behavior fixes (autosave, resume, beat completion, sprint improvements)
- **W-tickets** — web platform (server, Postgres, sync, Railway deploy, PWA, responsive)
- **D-tickets** — the visual redesign, fully specified in `docs/ui-redesign-spec.md` (applies to the web build unchanged)

---

## 2. Target architecture

```
[Browser / PWA on phone & desktop]
  React app (existing Vite renderer, HashRouter — works on static hosting)
  └─ storage adapter (A2): in-memory cache + localStorage write-ahead
       └─ sync engine (W2): background push/pull, last-write-wins
            └─ HTTPS ──> [Railway service: Node/Express]
                           ├─ serves built static app
                           ├─ /auth/* (session cookie)
                           └─ /api/sync (bulk upsert + delta pull)
                                └─ [Railway Postgres — NEW instance, never the trading hub's]
```

Key properties:
- The existing renderer **is already a web app** (Electron just loads the Vite dev server). No rewrite — the web build is `vite build` of what exists.
- One swap point: `persistence.ts` becomes an adapter. Every page keeps its current synchronous read calls — the adapter hydrates an in-memory cache at boot and reads from it synchronously, so **zero call-site refactors** are needed.
- Sync is record-level last-write-wins on `updatedAt` (single-user accounts; conflicts are rare and low-stakes). Server timestamp breaks ties.
- Auth is deliberately boring: email + password (bcrypt), httpOnly session cookie, registration gated by an `INVITE_CODE` env var the owner hands to testers. No OAuth, no email verification, no password reset in v1 (owner resets via SQL if needed).

---

## 3. Working agreement (every session)

1. Start each session: re-read §this brief's relevant ticket + `AGENTS.md`. One ticket per session. Stop at Definition of Done.
2. Branch per ticket off `m1-creative-flow`, named for the ticket (`a2-storage-adapter`, `w1-server`). Merge locally to `m1-creative-flow` when DoD is met. Commit messages follow repo history style: `A2 replace localStorage calls with storage adapter`.
3. Before declaring done: `pnpm install` succeeds, `pnpm dev` launches, and the ticket's own DoD checks pass. For W-tickets, also run the server locally against a local or Railway Postgres.
4. No new dependencies beyond the allowlist in §8. No refactors outside ticket scope. Style-only means style-only.
5. If two valid approaches exist and the brief doesn't decide, pause and ask the owner. Otherwise do not ask for approval on routine changes.

---

## 4. Stream A — App behavior tickets

### A2 — Storage adapter (DO THIS FIRST; foundation for everything)
**Problem:** Pages call `getProjects()` etc. synchronously against localStorage. We need a layer that (a) keeps those synchronous call sites untouched, (b) becomes the local half of offline-first sync.
**Spec:** Rework `store/persistence.ts` into a module with: an in-memory cache (`projects`, `storyPlans`, `sessions` arrays) hydrated from localStorage at module init; all existing getters read the cache synchronously (signatures unchanged); all setters update the cache, stamp `updatedAt` (ISO) and a client-generated `id` if new, mark the record dirty in a queue, and schedule a debounced (300ms) localStorage write per collection. Add `subscribe(listener)` so the future sync engine and React screens can react to external updates. Add a `dirty` registry API: `getDirtyRecords()`, `markClean(ids)`. Every record gets `updatedAt`; `Project` keeps its existing shape plus optional `deletedAt` (soft delete — never hard-delete rows that must sync).
**Files:** `store/persistence.ts`, `types/index.ts`. **Out of scope:** any network code.
**DoD:** App behaves identically to before; restart persists; typing rapidly produces at most ~3 localStorage writes/second; unit-testable by hand via devtools.

### A1 — Autosave everywhere
**Problem:** Quick Sprint holds `draftText` in React state until manual Save; Beat Wizard saves only on navigation. A crash mid-hyperfocus loses everything.
**Spec:** Quick Sprint: debounce 2s after last keystroke → write draft through the adapter (draft records live in the adapter under a `drafts` collection keyed by `projectId ?? 'scratch'`); also flush on blur, on route change, and on `visibilitychange → hidden` (critical on mobile — tab switches kill background pages). Beat Wizard: same debounce on the notes textarea. Indicator: reuse the quiet saved-stamp pattern (pre-D2: small `--color-success` text "Saved" fading after 2s; post-D2: `.saved-stamp`). Never a modal, never a sound.
**DoD:** Kill the app mid-sentence (close tab) → relaunch → the sentence is there, in both Sprint and Beat Wizard.

### A3 — Resume data layer (pairs with D3's launcher)
**Spec:** Add `lastActivityAt` + `lastActivityType: 'sprint' | 'beat'` to `Project`, stamped by the adapter on relevant writes. New helper `getResumeTarget()`: most recent project by `lastActivityAt` → `{ project, route, label, lastLine, daysAgo }` where `lastLine` = last non-empty line of `sprintText`, else the last bullet of the current beat's notes, else null. Launcher consumes it (visual treatment per design spec D3). Delete the disabled "Open Existing Project" button.
**DoD:** After writing in any project, the launcher's resume card routes to the exact screen and shows the true last line.

### A4 — Beat → Sprint bridge (the core loop)
**Problem:** The north star says Next Action → Draft, but Quick Sprint launched from a project ignores the story plan entirely. The two halves of M1 don't touch.
**Spec:** When `/project/:id/sprint` loads and the project has a story plan with a `currentBeatId`, render a pinned, read-only context strip above the writing surface: beat name (eyebrow style "DRAFTING · THE CATALYST") + its bullet notes, collapsible. The finish card gains a checkbox "Mark The Catalyst done" (default unchecked) which, on save, sets that beat's status to `complete` (see A5) and advances `currentBeatId` to the next beat. Sprint text continues appending to `project.sprintText` as today — per-beat draft storage is explicitly Stage 2, do not build it.
**DoD:** Plan → sprint → write → finish with checkbox → Board shows beat done and NEXT moved forward. The full loop in under a minute.

### A5 — Beat completion
**Problem:** `BeatNote.status` can never reach `'complete'`; the Board's progress system has no payoff. Project Home's "(2/8 beats with notes)" counts `started` as completed, which is misleading.
**Spec:** Add a complete toggle: on Board cards ("Mark done" / "Reopen" as a quiet action) and via A4's finish checkbox. `updateBeatNotes` no longer downgrades a `complete` beat to `started` when notes change. Project Home copy becomes "{started+complete} of {total} beats touched · {complete} done".
**DoD:** Status round-trips empty ↔ started ↔ complete correctly and persists.

### A6 — Nudge reset (fix the broken promise)
**Problem:** After 3 nudges the copy promises more after "3 minutes of writing," but nothing ever resets — locked for the session.
**Spec:** During lockout, accumulate active-typing time (keystroke within the last 10s counts the elapsed second). At 180 accumulated seconds AND ≥ 50 characters typed since lockout, reset `nudgesUsed` to 0 quietly (no toast). Copy per design spec §9: "Nudges return after a few minutes of writing."
**DoD:** Burn 3 nudges, type for 3 minutes, nudge button is live again; idling does not restore it.

### A7 — Sprint finish & timer behavior
**Spec:** Timer reaching zero no longer feels like an interruption: the finish card appears but the textarea stays editable and focused behind it; the card's primary action is **"Keep going (+5 min)"** (adds 5:00, restarts, dismisses card). Card shows `{n} words in {m} minutes` (words = whitespace-split count of text written this session: snapshot length at timer/sprint start). "Save to project" and "Discard" per design spec §9; Discard asks nothing but is styled `.btn-brick` and never sits adjacent to the primary.
**DoD:** Mid-word at 0:00 → keep typing without losing a character → one tap continues for 5 more minutes.

### A8 — Flow details
**Spec:** (1) Sprint textarea autofocuses on mount. (2) Idle hint: arm the 60s timer only after the first keystroke of the session, reset on typing — never show pre-writing. (3) Beat Wizard sentence warning becomes non-blocking: Save is always enabled; the warning is informational with "Keep anyway" dismissing it for that beat. (4) Suppress the `--:--` clock placeholder when no timer is set.
**DoD:** Open sprint → type immediately with zero clicks; warning never gates a save.

### A9 — Session log (testing instrumentation, lowest priority)
**Spec:** New `sessions` collection via the adapter: `{ id, projectId|null, startedAt, firstKeystrokeAt, endedAt, words, durationSec }`, recorded on sprint finish/save. Surfaces nowhere in the UI except the A7 finish stats. Purpose: `docs/demo-script.md` wants time-to-first-words measured — this makes it automatic (queryable in Postgres after W2).
**DoD:** Two test sprints produce two accurate session rows that sync.

---

## 5. Stream W — Web platform tickets

### W1 — Server + database + auth
**Spec:** New workspace package `apps/server` (Express + TypeScript, listed in `pnpm-workspace.yaml`). Endpoints: `POST /auth/register` (requires body `inviteCode` === `process.env.INVITE_CODE`), `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`. Passwords via `bcryptjs` (cost 12). Sessions via `express-session` + `connect-pg-simple` (httpOnly, `secure` in production, `sameSite=lax`, 30-day rolling). Rate-limit `/auth/*` to 20/min/IP (tiny in-memory limiter, no new dep). Static: serve the built renderer (`apps/desktop/dist-web` — add a `build:web` script running `vite build --outDir dist-web` so Electron's `dist/` is untouched) with an SPA fallback to `index.html`. Health: `GET /healthz`.

**Schema (run as migration `apps/server/migrations/001_init.sql`):**
```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  pass_hash text not null,
  created_at timestamptz not null default now()
);
create table projects (
  id text primary key,            -- client-generated ids
  user_id uuid not null references users(id),
  title text not null,
  type text not null,
  sprint_text text,
  story_plan_id text,
  last_activity_at timestamptz,
  last_activity_type text,
  deleted_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
```

```sql
create table story_plans (
  id text primary key,
  user_id uuid not null references users(id),
  project_id text not null,
  framework_id text not null,
  current_beat_id text,
  beat_notes jsonb not null default '[]',
  deleted_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
create table sessions_log (
  id text primary key,
  user_id uuid not null references users(id),
  project_id text,
  started_at timestamptz, first_keystroke_at timestamptz, ended_at timestamptz,
  words int, duration_sec int,
  updated_at timestamptz not null
);
create table drafts (
  id text primary key,            -- projectId or 'scratch'
  user_id uuid not null references users(id),
  text text not null default '',
  updated_at timestamptz not null
);
create index on projects (user_id, updated_at);
create index on story_plans (user_id, updated_at);
```
**DoD:** Server runs locally against Postgres (`DATABASE_URL`); register with invite code, login, cookie persists across restart, `/healthz` returns 200, static app served at `/`.

### W2 — Sync engine (client + endpoint)
**Endpoint:** `POST /api/sync` (auth required). Request: `{ lastSyncAt: string|null, push: { projects: [], storyPlans: [], sessions: [], drafts: [] } }`. Server upserts each pushed record scoped to the session's `user_id` — a record wins only if its `updated_at` is newer than the stored row (last-write-wins; server clock stamps `synced_at` internally but never rewrites `updated_at`). Response: `{ serverTime, pull: { ...all records updated since lastSyncAt... } }`. Soft deletes travel as normal records with `deleted_at` set.
**Client (`store/sync.ts`):** On boot (after login) and then every 20s while the tab is visible, plus on `online` and `visibilitychange→visible` events: send dirty records from the adapter, apply pulled records into the cache (skip any local record that is currently dirty — local unsynced edits always win on-device), `markClean`, store `lastSyncAt`. Exponential backoff on failure, max 2 min, silent. **The sync engine may never block, debounce, or delay a local write, and may never surface a blocking error.** Status exposed as `'synced' | 'pending' | 'offline'` for a quiet indicator (styled later per design spec — a 3-word text state, no spinner).
**Login gate:** If no session, the app shows a minimal login/register screen (dark, single card, will be styled in D-stream; functional-plain is fine now). After login, hydrate adapter from localStorage AND immediately full-pull (`lastSyncAt: null`).
**DoD:** Two browsers, same account: write in one → appears in the other within ~20s. Airplane-mode test: write offline → reconnect → words arrive server-side untouched.

### W3 — Railway deploy (ship a URL early)
**Spec:** New Railway project (e.g., `writer-studio`) on the owner's account — **never** a service inside the trading-hub project. Provision a NEW Railway Postgres; set `DATABASE_URL`, `SESSION_SECRET` (generate 32+ random bytes), `INVITE_CODE`, `NODE_ENV=production`. Root build: `pnpm install && pnpm --filter @writer-studio/desktop build:web && pnpm --filter @writer-studio/server build`; start: `node apps/server/dist/index.js`. Migrations run on boot if `users` table absent (simple guard, fine at this scale). Document every step taken in `docs/deploy.md` (envs by NAME only — **never write secret values into any file in this repo**). The owner will click the Railway UI for account-level steps if the CLI needs login; ask rather than guess at credentials.
**DoD:** `https://<app>.up.railway.app` loads on a phone, owner registers with invite code, writes a sprint on mobile data, sees the row in Postgres.

### W4 — PWA + offline shell
**Spec:** Add `vite-plugin-pwa` to the desktop package's web build only: manifest (name "Writer Studio", standalone display, theme `#161210`, background `#161210`, maskable icons — generate a simple brass-on-ink monogram icon set into `public/`), service worker precaching the app shell with `autoUpdate` registration. Network-only for `/api/*` and `/auth/*` (the adapter is the offline layer — the SW must never cache API responses). Verify Electron build is unaffected (plugin applies only to the `build:web` config branch).
**DoD:** Install to a phone home screen; launch in airplane mode → app opens, prior writing visible, new writing accepted; reconnect → syncs.

### W5 — Responsive pass (extends ui-redesign-spec §7; do after D-tickets it touches)
**Spec:** Breakpoint 720px. Sprint: paper page edge-to-edge with `--space-4` gutters; top bar collapses to [timer chip · nudge button · clock]; bottom Save/Finish bar `position: sticky; bottom: 0` (sticky, not fixed — plays nicer with mobile keyboards); inputs ≥ 16px font (prevents iOS zoom); touch targets ≥ 44px. Launcher/Home/Wizard: single column, cards full-width. Beat rail: horizontally scrollable with edge fade. Board: single-column cards; "Set as next" always visible on touch devices (no hover reveal — detect via `@media (hover: none)`). Test with devtools device mode AND one real phone.
**DoD:** Every screen usable one-handed on a 390px viewport; writing flow feels native-app calm.

---

## 6. Stream D — Visual redesign

Fully specified in `docs/ui-redesign-spec.md` (tokens, type, components, per-screen specs D1–D8, microcopy, motion rules). It was written for the Electron build but applies to the web build verbatim — same renderer. Two amendments:
1. The login/register screen from W2 is an honorary D-ticket: one centered `.card` on `--ink-950`, wordmark eyebrow, Newsreader line "The page is ready when you are.", two fields, one `.btn-brass`. Style it during D3.
2. W5's responsive rules extend design-spec §7 and inherit all its guardrails (one brass per screen, motion rules, contrast).

---

## 7. Master execution order

| # | Ticket | Note |
|---|---|---|
| 1 | **A2** storage adapter | Foundation. Everything builds on it. |
| 2 | **A1** autosave | Words become loss-proof locally. |
| 3 | **W1** server + auth | |
| 4 | **W2** sync engine | |
| 5 | **W3** Railway deploy | 🚩 **MILESTONE: owner has a URL on his phone.** Ship this before polish — momentum applies to the build too. |
| 6 | **D1 + D2** tokens, fonts, components | Parallel-safe any time after A2. |
| 7 | **A8, A7, A6, A4 + D4** | The sprint screen, behavior + skin in one pass. |
| 8 | **A3 + D3** | Launcher: resume data + The Desk. |
| 9 | **A5 + D5 + D6** | Completion + workbench + corkboard. |
| 10 | **D7** | Wizard / Create / Home polish (incl. login styling). |
| 11 | **W4** PWA | |
| 12 | **W5** responsive | |
| 13 | **A9** session log | |
| 14 | **D8** sweep + a11y audit | Always last before validation. |

---

## 8. Hard guardrails

**Dependency allowlist (complete; nothing else without a new ticket from the owner):**
- Fonts: `@fontsource-variable/newsreader`, `@fontsource-variable/figtree`, `@fontsource/courier-prime`
- Server: `express`, `pg`, `bcryptjs`, `express-session`, `connect-pg-simple`, `dotenv` (+ their @types)
- Web build: `vite-plugin-pwa`
- Explicitly banned: Tailwind, UI kits, animation libraries, ORMs, state libraries (the adapter pattern replaces this need), websockets (20s polling is enough for v1).

**Security:**
- New Railway project, new Postgres, new secrets. Zero overlap with pandoras-box/trading-hub infrastructure, env vars, tokens, or databases.
- Secrets live only in Railway env vars and an untracked `.env` (confirm `.gitignore` covers `.env` before creating one). Never write a secret value into any committed file, log line, or doc.
- All `/api/*` queries scoped by the session's `user_id`. No user-supplied id is ever trusted for ownership.
- httpOnly + secure cookies; bcrypt cost 12; rate-limited auth; no client-side secrets.

**Product (from north-star — these outrank everything):**
- Momentum-first default path. No AI drafting. No prose generation. Planning stays opt-in and timeboxed.
- Nothing animates without user action (except the timer hairline and the one finish moment). Nothing auto-rotates. Hints are calm and manual.
- The network may never block or interrupt writing. Offline is a quiet, normal state.
- One brass-filled action per screen. Brick = Discard only. Paper = prose only.

**Process:** Electron files stay untouched and parked. Minimal change per AGENTS.md. Stop at DoD. Update `docs/release-checklist.md` only in the validation phase.

---

## 9. Validation gate (after #14, before inviting testers)

1. Full `docs/release-checklist.md` smoke tests (both paths) **in a phone browser and a desktop browser**.
2. Airplane-mode round trip: write 100+ words offline on the phone → reconnect → verify in Postgres.
3. Two-device session: laptop + phone, same account, edits converge.
4. Visual sanity per ui-redesign-spec D8 (fonts offline, one brass per screen, reduced-motion, contrast).
5. Run `docs/demo-script.md` on the owner first; A9 should answer "time to first words" automatically.
6. Then add new checks learned here to `docs/release-checklist.md` and hand the URL + invite code to testers.

*End of brief. When in doubt: protect the words, protect the momentum, keep the lamp warm.*
