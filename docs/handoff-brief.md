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
| 3 | **W1** server + auth | ✅ In tree (`apps/server`): Express + cookie-session auth (`/auth/*`), `/healthz`, bcrypt, rate limiter, Postgres migrations on boot, static + SPA fallback. Not yet runtime-verified here or deployed (W3). |
| 4 | **W2** sync engine | ✅ In tree: client engine (`store/sync.ts` — full-pull on login, 20s + `online`/`visibilitychange`, silent backoff, last-write-wins reconcile) and the `/api/sync` endpoint; **login gate** wired in `App.tsx` (`apiMe()`→`LoginScreen`). Consequence: the static bundle can't reach any screen without the running server — see the runtime-verification note in §10. (`store/sync.ts`'s `stampMap` still lists only projects/storyPlans/sessions/drafts — `journalEntries` not yet added; minor follow-up, not addressed here.) |
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

**Runtime verification convention:** UI tickets are verified at runtime with the in-repo harness (`apps/desktop/scripts/runtime-verify.mjs`), which boots the built bundle past the W2 login gate via a dependency-free auth/sync test-double (Node built-ins + CDP + headless Edge/Chrome, no added deps — §8). `pnpm --filter @writer-studio/desktop verify:runtime` runs its self-test; per-ticket scenarios `import { withHarness }`.

1. Full `docs/release-checklist.md` smoke tests (both paths) **in a phone browser and a desktop browser**.
2. Airplane-mode round trip: write 100+ words offline on the phone → reconnect → verify in Postgres.
3. Two-device session: laptop + phone, same account, edits converge.
4. Visual sanity per ui-redesign-spec D8 (fonts offline, one brass per screen, reduced-motion, contrast).
5. Run `docs/demo-script.md` on the owner first; A9 should answer "time to first words" automatically.
6. Then add new checks learned here to `docs/release-checklist.md` and hand the URL + invite code to testers.

## 10. Stream J — Journal substrate & sprint rewards

*Added as a new arc; not yet placed in the §7 sequencing — slot it among the existing 14 at your discretion. Builds on **A2** (storage adapter) and **A1** (drafts under `projectId ?? 'scratch'`); inherits the in-memory cache, dirty-queue, soft-delete, and the never-block-on-network rule for free. Order within the arc: **J1 → (J2, J4)**; **J3** is independent and low-risk; **J5** is last and owner-gated. Protect the words, protect the momentum.*

> **Runtime UI verification requires an auth test-double.** The W2 login gate (`apiMe()` → `LoginScreen`) is wired in `App.tsx`, so the static bundle can't reach any screen without a running `/auth` server. Verifying any UI ticket at runtime (J3, J4, J5, and future surfaces) means driving the rendered bundle past that gate. Use the in-repo harness — `apps/desktop/scripts/runtime-verify.mjs` (`import { withHarness }`): a dependency-free auth/sync test-double + CDP/headless-Edge driver, Node built-ins only, no added deps (§8). Smoke-check it with `pnpm --filter @writer-studio/desktop verify:runtime`.

### J1 — Journal collection + commit-on-sprint (DO THIS FIRST; foundation for the arc)

**Problem:** Quick Sprint autosaves drafts through the adapter under `drafts[projectId ?? 'scratch']`, but that buffer is volatile in-flight protection — a finished sprint's text is never preserved as a permanent, timestamped, retrievable record. Ember needs a Journal: every completed sprint becomes a durable entry that belongs to no project by default — the substrate from which projects are later cultivated.

**Investigate first (decides the implementation):** Before writing code, read `types/index.ts` and `store/persistence.ts` and determine what the `sessions` collection currently stores — (a) does a session persist the sprint's full *text* or only metadata; (b) can a session be project-less or is it always project-bound; (c) does it carry a stable creation timestamp set once and never mutated.
- If `sessions` already holds the text **and** cleanly supports permanent, project-optional, timestamped records → implement the Journal as a *read-model/view over `sessions`*; do **not** create a duplicate collection.
- Otherwise → add a new `journalEntries` collection to the adapter, linked to its session via `sessionId`.
- If genuinely ambiguous, pause and ask the owner. State the chosen path and why in the commit summary.

**Spec:**
- Record shape (new collection or augmented session): stable client `id`; `text` in **the same serialization Quick Sprint already writes to the drafts buffer** (no lossy conversion); `createdAt` (ISO, set once, never mutated); `updatedAt`; `projectId` (nullable, default `null`); optional `sessionId`; `deletedAt` for soft-delete. Inherit the existing adapter machinery exactly — in-memory cache, dirty-queue, debounced localStorage write, `subscribe()`, sync eligibility. No bespoke persistence path; no new dependency.
- Commit moment: on **sprint completion**, commit the current draft buffer to a permanent Journal entry. Wire to every terminal path a sprint can end through (timer expiry *and* manual stop). No text → no entry (never commit an empty record).
- The live `drafts[projectId ?? 'scratch']` buffer stays exactly as A1 built it (in-flight crash protection). The Journal commit is an **additional, permanent** write, not a replacement. Document whether the volatile draft clears on commit or is left for the next sprint to overwrite.
- Provenance: set `projectId` to the sprint's project context, or `null` for a scratch sprint. A project-context sprint still produces a Journal entry — the Journal is the complete chronological record of all sprints. **Do not modify existing project/scene save behavior**; the entry is additive, and the resulting working-copy-plus-record double-storage is intended (protects the words).
- Read APIs for later tickets, cache-synchronous per A2: `getJournalEntries()` (newest-first, excluding soft-deleted) and `getJournalEntry(id)`.

**Files:** `store/persistence.ts`, `types/index.ts`, and the Quick Sprint component/store where sprint completion is handled. **Out of scope:** Journal browse UI (J4); routing into projects (J2); homepage/victory changes (J3); ambient feedback (J5); any W-stream sync-engine change (the entry must be sync-*eligible* by inheriting the adapter pattern, but don't touch sync code).

**DoD:** Complete a sprint, write a sentence, end it → relaunch → the entry persists with a correct `createdAt`, retrievable via `getJournalEntries()` in devtools. Killing the tab mid-sprint still recovers the in-flight draft (A1 unbroken). An empty sprint produces no entry. No new dependencies; no refactors outside scope; the app behaves identically everywhere else.

### J1a — Honor Discard (closes out J1)

**Problem:** J1 commits the Journal entry at `enterFinish`, before the Save/Discard choice, so a discarded sprint leaves a live entry — the brick "Discard" doesn't fully discard. That overrides the writer's explicit intent and undermines trust in the Journal as a safe place for vents and false starts (and it's inconsistent with §8's "Brick = Discard only"). Capture-by-default is the rule; an explicit Discard is the writer's override of it and must be honored.

**Spec:** In `handleDiscard` (`apps/desktop/src/pages/QuickSprint.tsx`), soft-delete the committed entry (if any) before clearing the draft:

```ts
const handleDiscard = () => {
  suppressFlushRef.current = true;
  const entryId = journalEntryIdRef.current;
  if (entryId) {
    const entry = getJournalEntry(entryId);
    if (entry) saveJournalEntry({ ...entry, deletedAt: new Date().toISOString() });
  }
  clearDraft(draftId);
  localStorage.removeItem(getDraftKey(id));
  navigate(id ? `/project/${id}` : '/');
};
```

Rides the existing soft-delete model — `getJournalEntries()` already excludes soft-deleted. No persistence/types changes, no new dependency, no signature changes. Leave Save and Keep-going untouched.

**Files:** `apps/desktop/src/pages/QuickSprint.tsx` only. **Out of scope:** everything else; the entry shape and adapter wiring stay as J1 built them.

**DoD (this session also discharges J1's deferred runtime verification — do both the typecheck and the click-through):**
- Typecheck passes (`tsc --noEmit` / the repo's typecheck script) — the esbuild web build does not catch type errors.
- In a running app (dev shell + devtools):
  - Sprint with text → Finish → **Discard** → `getJournalEntries()` does **not** include it.
  - Sprint with text → Finish → **Save** → entry present, `createdAt` stable, `sessionId` linked.
  - Finish → **Keep going** → finish again → still **one** entry (same id), text refreshed.
  - **Empty/whitespace** sprint → no entry.
  - **Relaunch** after a saved sprint → entry persists with its `createdAt`.
- No new deps; no out-of-scope changes; `build:web` compiles.

**Branch:** `j1a-honor-discard` off `m1-creative-flow`; merge when DoD met.

### J1b — Register journalEntries in the sync stampMap (completes J1's sync eligibility)

**Problem:** J1 added the `journalEntries` collection and it pushes on sync, but `sync.ts`'s `stampMap` lists only `projects/storyPlans/sessions/drafts` — `journalEntries` is missing, so entries are never `markClean`'d after a successful push and the entire (ever-growing) journal re-uploads every 20s cycle. Idempotent upsert means no corruption, but it's unbounded waste on the substrate collection and degrades the mobile/flaky-connection case. This is the one gap in J1's "sync-eligible by inheriting the adapter pattern" intent.

**Spec:** Add `'journalEntries'` to the `stampMap` collection list in `apps/desktop/src/store/sync.ts` so entries `markClean` after a successful push exactly like the sibling collections. Match the existing pattern; no other changes.

**Files:** `apps/desktop/src/store/sync.ts` only. **Out of scope:** any other sync changes; the J1 entry shape / adapter wiring (unchanged); the harness.

**DoD:**
- Typecheck passes.
- Via `verify:runtime`: save a journal entry, run a sync cycle, confirm it pushes once and is not re-queued/re-pushed on the next cycle (it's `markClean`'d like its siblings); sibling collections' clean behavior unchanged.
- No new deps; no out-of-scope changes; `build:web` compiles.

**Branch:** `j1b-journal-sync-stamp` off `m1-creative-flow`; merge when DoD met.

### J4 — Journal browse + retrieval (the notebook surface)  *(depends on J1; first of the J4→J2 push)*

**Problem:** Every sprint lands in the journal, but a writer has no way to see it — the substrate is a write-only black box from their side. J4 makes it a visible, browsable, searchable place: a notebook to flip through and pull from, not an inbox to clear.

**Investigate first:** (a) Locate the router config (HashRouter) to add a `/journal` route and a quiet affordance to reach it from `SessionLauncher` (the home). (b) Find the existing Tiptap plain-text extraction helper (the word-count / testament path almost certainly has one) and reuse it for first-line labels, snippets, and search — no new dependency, no reinventing extraction. (c) Confirm `getJournalEntries()` (newest-first, excludes soft-deleted) is the read source.

**Spec:**
- Route + entry point: a `/journal` route, reachable from home via a quiet affordance (secondary link, not a brass button) — the home's single brass action (Start writing / Resume) stays intact.
- Chronological browse: entries newest-first, grouped by time (the spine). Each row shows a first-line-derived label (entries have no titles — derive from the opening non-empty line), a short snippet, and the timestamp.
- Read view: tapping a row opens the full text, read-only. This view reserves a single primary-action slot for routing — J4 leaves it empty (or a disabled placeholder); J2 fills it. This is the seam.
- Local full-text search: filters entries by content via substring/token match over the in-memory cache (extracted text) — instant, offline, no network, no new dependency.
- Resurfacing: a user-invoked "surface a past entry" control that shows one random past entry (flip-to-a-page). Invoked only — nothing auto-rotates or animates on its own (§8).
- Presentation — notebook, not inbox: no unread counter, no backlog meter, no entry-count badge. Cozy and chronological, on the lamplit tokens.
- Soft-deleted (discarded) entries never appear.

**Files:** new journal route component(s) (e.g., `pages/Journal.tsx` + an entry read-view), `SessionLauncher.tsx` (quiet affordance), router config. **Out of scope:** all J2 routing logic (J4 only reserves the slot); semantic/AI search (local full-text is the deliverable; semantic is a future online-only enhancement); star/tag emergent organization (a later small follow-up); editing or resuming an entry into a sprint; any sync changes.

**DoD** (verify behavior via `verify:runtime`, real bundle, seeded entries, past the login gate):
- `/journal` reachable from home via a quiet affordance; the home's one brass action preserved.
- Entries newest-first with a time spine; each shows a first-line label, snippet, timestamp.
- Read view opens the full text and reserves one empty primary-action slot for routing.
- Search filters by content, instant and offline, no new dependency.
- Resurfacing surfaces a random past entry, user-invoked only; nothing auto-rotates/animates (§8).
- Discarded entries never appear; notebook presentation (no counters/badges).
- Typecheck + `build:web` pass; read-only; no new dependency; no out-of-scope changes.

**Branch:** `j4-journal-browse` off `m1-creative-flow`.

### J2 — Pull-based routing: scrap → project  *(depends on J4's seam; second of the push)*

**Problem:** The journal is the soil; projects are what you cultivate from it. J2 lets a writer take a scrap they're browsing and develop it — into an existing project or a new one — without damaging the original. Capture stays whole; routing is a branch, not a move.

**Investigate first:** (a) Read the project/scene structure and how a new scene is created/added (reuse the existing path if one exists). (b) Decide placement for a routed scrap; confirm least-surprising against the real structure, flag if ambiguous (§5). (c) Confirm the content shape accepts the entry's text serialization unchanged. (d) Reuse J4's first-line-derivation helper for titles.

**Resolved (data model — owner-approved):** This codebase has **no `chapters[]`/`scenes[]` model** — a project's prose is the single `Project.sprintText` string; there is no scene shape, `wordCountGoal`, or `status`, and no rich-text/Tiptap (entries are plain text). So routing maps onto the existing model: **send to existing project** appends the scrap to the target project's `sprintText` under a clear demarcation header (`— from the journal —`), with **no leading separator when the draft is blank**; **promote to a new project** reuses `createQuickSprintProject(text, title)` (title = first-line label). No new types/collection/sync changes; reuses `setProjectSprintText` / `createQuickSprintProject` / `getProjects`.

**Spec:**
- The action lives in the slot J4 reserved in the entry read-view — a quiet, invoked routing control. It is the entry view's single brass action ("Send to a project"); the project picker is a transient selection, not a competing persistent action.
- Send to existing project: user picks a project; the scrap's text is appended to that project's `sprintText` draft under the `— from the journal —` header (no leading separator if the draft is blank). The journal entry is untouched.
- Promote to a new project: create a new project whose draft is the scrap; working title from the first-line label (editable later). The journal entry is untouched.
- Branch-copy invariant: the routed draft is an independent record (separate `projects` collection) — later edits to it don't change the journal entry, and vice versa. Rides the existing projects sync (already in stampMap); no sync changes.
- §8: user-invoked only (no auto-routing); one brass action per screen.

**Files:** the entry read-view (fill the reserved slot + a small project-picker UI) and the existing project/draft write paths (reused, not extended). No `types`/`persistence` additions were needed — the existing `sprintText` model covers it. **Out of scope:** any change to how journal entries are stored (read, never modified — the invariant); a "routed" provenance marker on the entry (a later follow-up); semantic search; star/tag; sync changes; building a discrete chapters/scenes model (its own future ticket).

**DoD** (verify via `verify:runtime`, real bundle, seeded entries + a seeded project):
- From an entry's read-view, "Send to a project" → pick a project → the scrap appears in that project's draft, demarcated and placed per the blank/non-blank rule; the journal entry is still present and byte-identical.
- "Promote to a new project" → a new project created with the scrap as its draft and a working title from the first line; the journal entry unchanged.
- Independence: editing the routed draft doesn't alter the journal entry (and vice versa); no orphaned records.
- New records ride the existing projects sync (no sync changes); typecheck + `build:web` pass; journal-stays-whole invariant holds; no new dependency; no out-of-scope changes.

**Branch:** `j2-scrap-routing` off `m1-creative-flow`.

### J3 — Homepage testament  *(independent of J1; reads `sessions` only)*

**Problem:** The home/landing page doesn't reflect the writer's accumulating work. A returning writer should be met with evidence of what they've built — testament that lowers the activation energy of starting again — not a blank slate or a target to hit.

**Investigate first:** Locate the existing home/landing route component (the one navigated to as `/`) and the sessions read API. `SessionLog` rows are written only on sprint *save* (`recordSession` in QuickSprint), so `sessions` already excludes discarded sprints — the homepage will never credit thrown-away work. Fields per row: `words` (net words added that session, ≥0), `startedAt`, `firstKeystrokeAt`, `endedAt`, `durationSec`, `projectId`, `updatedAt` (soft-delete via `deletedAt`). Use the existing sessions getter; add a minimal one only if absent, and it must exclude soft-deleted (mirroring `getJournalEntries`).

**Spec:**
- Add a pure aggregation helper (e.g., `computeTestament(sessions, now)`) — no writes, no new collection, no new dependency — deriving: lifetime net words (sum `words`); net words in the last 7 days (sum `words` where `endedAt` within 7 days); sprint count total and last-7-days; and a consistency signal (distinct calendar days with ≥1 session in the last 30; current run of consecutive active days).
- Render **one** quiet testament line on the home page, drawn from a pool of framings whose underlying value is currently meaningful, e.g.: "{n} words that didn't exist before this week" (last-7-days words > 0); "{n} words since you started" (lifetime words > 0); "You've tended Ember {n} times this week" (last-7-days sprints > 0); "{n} days at the page this month" / a return-run framing (consistency).
- **Selection: pick one valid framing at mount and render it statically.** It MAY vary between visits (e.g., random among the currently-valid framings on load), but it is **not** an auto-rotating carousel and **nothing animates on its own** — honoring §8 ("nothing auto-rotates"; "nothing animates without user action").
- **Quiet-week / fresh-start resilience (required):** if there are no sessions in the last 7 days, fall back to a lifetime or consistency framing — never render "0 words this week" or any low-number rebuke. If there are no sessions at all (fresh install), show a gentle first-run invitation with no numbers. Testament, never targets: no goal bar, no number-to-beat.
- The page's primary action stays the warm re-entry into a sprint and remains the **one brass action** on the screen (the testament line is quiet text, not a competing CTA). Match the lamplit aesthetic and existing tokens (`--ink-*`, `--brass`, `--ember`, `--font-prose`/`--font-ui`/`--font-mono`).

**Files:** the home/landing route component and a small helper module (e.g., `store/testament.ts`); a minimal sessions getter only if one doesn't already exist. **Out of scope:** J1/J2/J4/J5; any write path; any change to how sessions are recorded; the Journal browse surface (J4).

**DoD:**
- Home page shows a testament line computed from real `sessions`; reloading can surface a different valid framing; no animation and no auto-rotation (verify against §8).
- No sessions in the last 7 days → a lifetime/consistency framing appears, never "0 words this week."
- Fresh install (no sessions) → gentle invitation, no numbers, no rebuke.
- Reads only; no new dependency; no out-of-scope changes; typecheck + `build:web` pass; the single brass action (start a sprint) is preserved.

**Branch:** `j3-homepage-testament` off `m1-creative-flow`.

### J5 — Ambient sprint feedback (the felt layer)  *(owner has authorized the §8 exception — build it, don't re-ask)*

**Problem:** A sprint should feel like the room responding to your writing — warmth that builds as you write — with nothing you look at and nothing that breaks flow. This is the piece deliberately parked until the rest of the experience existed; it now does. It is the sanctioned third exception to §8's "nothing animates without user action (except the timer hairline and the one finish moment)."

**Investigate first:** (a) Locate the sprint writing surface and timer in `QuickSprint` — the drift attaches to the writing surface and responds to typing activity. (b) Identify the lamplit palette tokens (`--ember`, `--ink-*`) and the existing reduced-motion handling (D8). (c) Check for an existing audio path (likely none — prefer the Web Audio API, no new dependency; flag if a sound asset would be needed).

**Spec — build the mechanism; exact values are tuned later during use:**
- Slow continuous drift only, no discrete events. As the writer types, the writing surface's ambient warmth builds slowly and continuously (e.g., background color-temperature drifts warmer over tens of seconds of sustained writing); a lull settles it back gently. Never a pop/flash/flicker — it must read as a felt state, not a noticed event.
- Optional ambient sound bed as the primary "felt" channel (it doesn't compete with the visual field): a faint bed that swells almost imperceptibly with sustained writing, via Web Audio (no dependency). Off by default, behind a quiet toggle; flag if it needs more than built-ins.
- Juice deferred to the finish moment. No payoff mid-sprint; anything celebratory lands at the existing finish moment only (coordinate with J7's echo there).
- Conservative defaults + exposed knobs. Ship subtle defaults and expose calibration as CSS variables (the `--lockup-lift` pattern) and/or a small settings control, so felt-vs-diverting is dialed live.
- Respect reduced-motion (required, D8): with the OS reduced-motion preference set, visual drift is disabled and audio defaults off. The §8 exception does not override accessibility.
- Scope the exception strictly to the sprint surface's drift + the deferred finish juice; everything else stays under §8.

**Files:** the `QuickSprint` writing-surface component + a small ambient module (drift + optional audio); design tokens/CSS; reduced-motion handling. **No new dependency.** **Out of scope:** any change to capture/journal/sync; discrete animations anywhere; J6; the echo's content (J7).

**DoD** (verify the mechanism via `verify:runtime` — not the subjective feel, which is tuned during use):
- Sustained typing produces a gradual, continuous warmth drift (verifiable: color changes frame-to-frame are gradual, never a step); a lull settles it back; no discrete visual events.
- Calibration is changeable via CSS variables / a settings knob without code edits.
- With reduced-motion set, visual drift is off and audio defaults off.
- No payoff fires mid-sprint; any lands at the finish moment only.
- Exception scoped to the sprint surface; nothing else animates or auto-rotates.
- Typecheck + `build:web` pass; no new dependency; no out-of-scope changes.

**Branch:** `j5-ambient-feedback` off `m1-creative-flow`.

### J6 — Journal entry metadata: star, tags, routed-marker  *(independent; consolidates J4's and J2's deferred bits)*

**Problem:** J4 shipped browse/retrieval but deferred the emergent-organization metadata, and J2 deferred a "routed" provenance marker. Together these are the light, optional, never-forced metadata that makes the journal navigable and stops accidental double-routing: star a scrap, tag it, and see at a glance which scraps you've already sent to a project.

**Investigate first:** (a) Read the `JournalEntry` shape and the `saveJournalEntry` write path — confirm adding optional `starred?`, `tags?: string[]`, and a routed-marker (`routedAt?` or `routedProjectIds?`) is purely additive and rides the existing `journalEntries` sync (in stampMap per J1b). (b) Locate J4's browse + read-view components (where star/tag controls and the routed indicator surface) and J2's routing action (where the marker gets stamped). (c) Reuse the `entryText` helper; no new dependency.

**Spec:**
- Star: a quiet toggle in the read-view (and/or browse) to star/unstar; a subtle marker on starred entries in browse; optionally a "starred only" filter. Unobtrusive, never forced.
- Tags: lightweight retroactive free-text tags (add/remove) on an entry; tags shown subtly in browse; a filter-by-tag. Keep the UI minimal — emergent organization, not a taxonomy you're made to fill. (This is the heaviest of the three; if it balloons, flag per §5.)
- Routed-marker: when J2's routing sends a scrap to a project, stamp the entry so the journal shows it's been cultivated; a subtle "routed" indicator in browse/read-view. Closes the double-route gap. (Touches J2's routing action.)
- All three are additive optional fields written via `saveJournalEntry`, synced via the existing path. All user-invoked; no animation. Notebook presentation preserved — quiet markers/filters, no counts or badges.

**Files:** `types` (additive `JournalEntry` fields); `persistence` only if a setter is needed (prefer reusing `saveJournalEntry`); J4's browse + read-view (surface markers/filters); J2's routing action (set the marker). **Out of scope:** any change to capture/sync mechanics; semantic search; J5/J7; storing entries differently beyond the additive fields.

**DoD** (verify via `verify:runtime`):
- Star an entry → marked in browse, persists across reload; "starred" filter (if built) narrows correctly.
- Add/remove tags → persist across reload; tag filter narrows the list.
- Route a scrap → entry shows a "routed" marker afterward; a repeat route is visibly indicated.
- Fields sync via the existing `journalEntries` path; soft-deleted entries still excluded; notebook presentation intact.
- Typecheck + `build:web` pass; additive only; no new dependency; no out-of-scope changes.

**Branch:** `j6-entry-metadata` off `m1-creative-flow`.

### J7 — Post-sprint echo (reflect the writer's own line back)  *(touches the finish moment — coordinate with J5)*

**Problem:** At the end of a sprint, the most intrinsic reward available is the writer's own words — surfacing one of their own lines back quietly says "you wrote that." The micro counterpart to J3's macro testament; part of the original design, never ticketed.

**Investigate first:** (a) Locate the sprint finish moment in `QuickSprint` (the §8-permitted finish state where options/summary appear — where J5's deferred juice also lands); the echo renders here, alongside J5. (b) Reuse `entryText` to pull lines from the just-written sprint. (c) Confirm the completed sprint's text is available at the finish moment (it's what gets committed to the journal).

**Spec:**
- At the finish moment, reflect one line from the writer's own just-written sprint back, quietly and affirmingly (e.g., "You wrote:" + the line).
- Selection is simple and local — pick the first substantial line/sentence (skip empty/very-short ones), or a random substantial one. No AI/generation — this is reflection, consistent with §8's no-AI rule.
- Skip gracefully when there's no substantial line (very short sprint): no echo rather than an awkward fragment.
- Quiet, on the lamplit tokens; part of the finish moment, not a mid-sprint interruption; coexists with J5's finish-moment behavior.

**Files:** the `QuickSprint` finish-moment component; reuse `entryText`. **No new dependency.** **Out of scope:** any generated/AI commentary on the writing (reflection only); J5's drift; any change to capture/journal.

**DoD** (verify via `verify:runtime`):
- After a sprint with substantial text, the finish moment shows one of the writer's own lines, quietly.
- A short / no-substantial-line sprint shows no echo (graceful skip).
- The line is the writer's own (from the just-written sprint), not generated.
- Coexists with J5's finish-moment behavior without conflict.
- Typecheck + `build:web` pass; no new dependency; no out-of-scope changes.

**Branch:** `j7-post-sprint-echo` off `m1-creative-flow`.

*End of brief. When in doubt: protect the words, protect the momentum, keep the lamp warm.*
