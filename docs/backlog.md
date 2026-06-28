# Backlog / Build Log

Reverse-chronological log of shipped tickets (newest first). One line per ticket; link the brief where one exists.

## Cleanup batch 2: Changes 3/4/5 — shipped
- **Change 5 — revised forward-only runway.** Every backspace STRIKES (never deletes), escalating with consecutive presses: char → char → rest-of-word → previous-word → rest-of-sentence → locked (nudge after a couple of no-ops); typing resets to step 1. New strike engine in `forwardOnly.ts` (`strikeStep`/`strikeTail` + word/sentence helpers); the active word is flushed on the first press so all strikes hit committed runs. `derivedText` already filters by `run.struck`, so the clean-save guarantee holds at **every** granularity (char/word/sentence) — verified: struck content stays visible, derived excludes it exactly.
- **Change 3 — name at signup + Desk letterhead.** Added a `name` column to `users` (idempotent `add column if not exists` on boot — picks up on the live DB without a migration runner); `apiRegister(email, password, name)`; the account step gains a "your name" field; `currentUser` module holds the authed user (set in App on /auth/me + sign-in, cleared on logout). Desk headline → top-left letterhead: **[Name]'s** in Crimson Pro over **Writing Desk** in Figtree (swappable slot); subheading → "Scribble, draft, plot, revise, or share (coming soon)".
- **Change 4 — resume routing de-confused.** "Keep writing" no longer drops into the exact last step: a project opens its **overview** (`/project/{id}`, not `/sprint` or `/beat`); a standalone journal page opens that page; whichever was touched most recently wins. ProjectHome's primary resume action gets a "↩ you last wrote here" marker when there's existing writing.

## Cleanup: Bug 1 (mobile IME) + Bug 2 (New page) — shipped
- **Bug 1 (mobile text vanishing) — fixed.** `ForwardOnlyEditor` had no IME/composition handling: `beforeinput` preventDefault clobbered soft-keyboard/swipe/autocorrect composition, so mobile-typed text vanished. Fix: (1) hand off to the IME during composition — skip preventDefault on `insertCompositionText`/`isComposing`, commit the finalized text on `compositionend`; (2) render the editable via `innerHTML` (dangerouslySetInnerHTML) so each render fully replaces the DOM — the post-composition render wipes the browser's draft nodes (no duplication), and React skips the update when the html string is unchanged (an unrelated re-render mid-composition can't clobber the composing text); (3) don't re-anchor the caret mid-composition. Verified in-harness with **real CDP composition events** (`Input.imeSetComposition` + commit): composed text lands, mixed keyboard+IME appends, runway still strikes. *Real-device confirmation still wise, but the CDP path mirrors mobile IME.*
- **Bug 2 (New page opened previous writing) — fixed.** `/sprint` with no project reuses the shared `'scratch'` draft, so "New page" reseeded the last text. Desk's "New page" now `clearDraft('scratch')` before navigating → blank every time ("Keep writing" still resumes it). Proper per-document persistence (unique page ids, no data loss) is the deferred big-architecture work.
- Harness gained an `ime()` helper (CDP composition) for future mobile-input testing.

## DEFERRED from the cleanup brief (next batch)
- **Change 5 — revised forward-only runway** (every backspace strikes; char→char→word→word→sentence escalation; widen `derivedText` to exclude struck content at every granularity). Intricate editor rework — separate focused slice. (Note: `derivedText` already filters by `run.struck`, so it's granularity-agnostic *as long as* strike ops isolate struck content into struck runs — the work is mostly the escalation logic + char/sentence strike ops in `forwardOnly.ts`.)
- **Change 3 — name at signup** (needs a `name` column + migration on the users table, `apiRegister` + account form) **+ Desk headline** `[Name]'s Writing Desk` (Crimson name over Figtree "Writing Desk") + subheading "Scribble, draft, plot, revise, or share (coming soon)".
- **Change 4 — resume routing**: Keep writing → project *overview* (not the last step) with a "you last wrote here" marker; track last-active doc + project/step (intersects the persistence-durability gap).

## Gate idle-nudges — extracted to a shared hook + v6 pool
- **`store/idleNudges.ts` (new):** the re-tuned nudge cadence (3→2→1 min, ephemeral #1/#2, held #3, keystroke-reset, no-repeat) lifted out of QuickSprint into a reusable `useIdleNudges({ active, activityKey })` hook. Behaviour only; each surface dresses its own slip (Crimson italic) + reduced-motion.
- **Pool swapped to v6's canonical 25** (now the source of truth, superseding the interim SME set) — 4 implicit registers; sensory fragments unpunctuated. **US spelling locked** ("color", "traveled") — v6 had British ("colour"/"travelled"); flag for one-word confirm if UK is wanted (trivial flip).
- **QuickSprint** refactored onto the hook (no regression — manual "Take a nudge" pull intact). **HomeFlow gate** now mounts it (`.wz-nudge`, bottom-center, v6 style) — a stuck newcomer gets prompts toward the 50-word goal. Both verified in-harness with shortened timers; selftest green.

## Desk (authed home) + invite drop — closes the HOME arc seam
- **Invite dropped (decided):** removed the invite field from the account step, the `inviteCode` param from `apiRegister`, the server-side invite check + `INVITE_CODE` env requirement (`apps/server/src/auth.ts`, `env.ts`). Wrizo is open — the writing-gate is the membership filter. Account collects email + password for now (passwordless/email-first stays backlog).
- **Desk (`pages/Desk.tsx`, new) replaces `SessionLauncher`** as the authed home (`/`), in the v6 "launch" aesthetic (scoped `.wz-*`): bighead "You're ready to keep writing." (swappable Figtree slot), filled-orange **Keep writing** (resumes `getResumeTarget()` → else the latest journal entry → else a fresh `/sprint`), quiet **New page** / **Begin project**, grayed **Customize** + tooltip. Account-create AND returning sign-in both land here.
- **No returning-user regression:** the Desk preserves what SessionLauncher gave — a restyled recent-work list (projects + journal pages, newest first), the journal stays reachable, resume resumes. Harness-verified: account(no invite)→Desk, gate entry in recent, Keep writing → the entry, journal link present; selftest green (freshSprint now navigates the Desk).
- Deleted orphaned `LoginScreen.tsx` + `SessionLauncher.tsx` (`Wordmark.tsx` now unused — left in place). Harness `freshSprint`/selftest updated off the old "Start writing" button.

## HOME port — anon front door (v6) — branch `home-port`, NOT deployed
First slice of the HOME port ([home-port-brief.md](home-port-brief.md)), built from `wrizo-home-v6.html` (the feel source of truth). Held for the tablet pass per the brief.
- **`HomeFlow.tsx` (new):** landing → forced first-write gate → reward → account / sign-in, as a stage machine. The gate **mounts the existing `ForwardOnlyEditor`** (zero editor logic) — runway, strikethrough, struck-words-drop-from-derived, paste block all inherited. WORD_GOAL=50 (lowerable). Both progress signals (fill-track + ambient ember-grow 0.4→1.0). Goal → bloom + word-echo of the writer's own clean words; reduced-motion suppresses the bloom, keeps the echo.
- **Pre-auth content survival (non-negotiable):** on "Create my desk" the gate's clean derived prose is saved as the first journal entry (`saveJournalEntry`), then auth — harness-verified end to end (landing→gate→reward→account→register→authed app, entry present).
- **Visuals:** ported v6 verbatim — espresso ground `#110600`/lift `#150a04`, light ink `#f0e7d8`, square corners, solid borders (translucent-orange only on the secondary btn), Nick's hand-drawn logo (`public/brand/wrizo-logo.png`, extracted from v6). All scoped under `.wz-home`.
- **Wiring:** App's anon branch now renders `HomeFlow` (was `LoginScreen`, now orphaned). Harness gained a `WS_ANON=1` gate to drive the anon front door.
- **DEFERRED / flagged (NOT in this slice):**
  - **Gate idle-nudges** — the re-tuned cadence lives in QuickSprint; mounting it in the gate needs that system extracted into a shared hook. Follow-up.
  - **Desk / launchpad** (v6 "launch" screen as the authed home, replacing SessionLauncher; Keep writing / New page / Begin project / grayed Customize + tooltip). After account-create the user currently lands on the existing SessionLauncher.
  - **Auth model mismatch** — v6's account is email-only, but the shipped `apiRegister` needs **email + password + invite code**. The account step collects all three (styled to v6). A true email-only/passwordless, no-invite public front door needs a backend ticket — decision for Nick.
  - Bigheads are Figtree `.bighead` placeholders (hand-drawn art swaps later); v6's 25-prompt pool not yet adopted (the nudge system uses the canonical SME pool).

## Tablet tripwire — "Take a nudge" button (watch, decide on hardware)
The manual nudge pull is kept but de-emphasized (translucent `.btn-ghost`, surfaces on hover/focus — a tool for someone who needs it, not a treat that beckons). Manual pull and the auto-cadence are guarded so they can't fire two nudges at once. **Tablet watch:** do you reach for it to get *unstuck*, or to *avoid writing*? If it's avoidance, kill the button. That's the tripwire.

## Nudge pool reconciled to canonical (repo-claim 3 closed)
Replaced CC's improvised 25 with the canonical SME pool — verbatim, 4 balanced registers (sensory images / concrete moves / permission-giving / pre-1930 public-domain literary allusions). Cleared the `FIXME(home-port)`. Built + confirmed in bundle; old strings gone. Cadence/render unchanged (Crimson Pro italic). Not deployed (held with the pre-home tweaks for the tablet pass).

## Pre-HOME tweaks (v6-independent; branch `pre-home-tweaks`)
Two standalone tasks from the HOME port brief ([home-port-brief.md](home-port-brief.md)), done while the HOME shell stays gated on `wrizo-home-v6.html`. NOT deployed — held for the tablet pass per the brief.
- **Nudge re-tune (global mechanic):** replaced the single 60s budget-3 model with an escalating idle cadence — first nudge at 3 min, second +2 min, third +1 min then HOLDS. First two are ephemeral (dissolve after 10s); the third persists. Any keystroke resets to the 3-min countdown. Removed the old A6 budget/lockout. Nudge now renders in Crimson Pro italic (the writing voice) with an opacity-gated fade; reduced-motion → instant via the global reset. Verified the full state machine in-harness with shortened constants (ephemeral #1/#2, held #3, reset, manual). The gate inherits this automatically when it mounts `WritingSession`.
  - ⚠️ **Pool is NOT canonical** — still CC's 25 from the last ticket, flagged `FIXME(home-port)` in `QuickSprint.tsx`. Needs the canonical curated 25 (4 registers) from the prototype/transcript; the cadence is pool-agnostic so it's a one-array swap.
- **Structured-notes font cleanup:** `.form-input` / `.form-select` had no `font-family` → UA default. Set them (and made `.form-textarea` explicit) to `var(--font-ui)` = Figtree, so project-builder structure inputs (Setup field, beat notes) speak in the UI voice, never the prose serif.

## Brand paint — Ember → Wrizo (name, fonts, accent, ground)
**Branch:** `brand-paint` off `m1-creative-flow`. Brief: [brand-ticket-brief.md](brand-ticket-brief.md). Paint only — no structure.
- **Name:** Wordmark now renders the text **Wrizo** in Figtree, glyph removed (no `ember-hero.png`); tab `<title>` → Wrizo; PWA manifest `name`/`short_name` → Wrizo; testament line "tended Wrizo". Package names (`@writer-studio/*`) untouched, per scope.
- **Fonts:** Figtree (titles/UI via `--font-display`/`--font-ui`), Crimson Pro (body + writing surface via `--font-prose`, inherited by `.paper-page`/`ForwardOnlyEditor` — no logic touched). Installed `@fontsource-variable/crimson-pro`; wired `@fontsource-variable/figtree`. Removed Mulish/Newsreader/Courier Prime imports; `--font-mono` falls back to system mono.
- **Accent:** `--brass` → **#ff9800** (locked/invariant; token name kept to avoid a global rename). First application of the real orange (the `.btn-brass` action).
- **Ground:** `--ink-950` and `html`/`theme-color`/manifest bg → **#110600** deep espresso.
- **Verified:** tsc + build:web pass; build-log self-check inverts the font list (emits `figtree-*` + `crimson-pro-*`, no `mulish-*`/`newsreader-*`/`courier-prime-*`); harness selftest green; brand runtime check confirms title/wordmark = Wrizo, no "Ember" on screen, `--brass`=#ff9800, `--ink-950`=#110600, UI=Figtree, writing surface=Crimson Pro.
- **Note:** unused asset `public/brand/ember-hero.png` left in place (file removal is out of paint scope; remove at the hand-drawn wordmark pass).

## Deferred (logged, not scheduled)
- **Import-external-draft case** — the legitimate "draft started elsewhere, want to import it" exception to the paste block. Deferred per HOME brief.
- **Recurring reward mechanisms (Desk/journal)** — word-count / page / draft-completion rewards, with **customizable triggers** and **toggle-able** audio/visual. Separate from the one-time gate reward.
- **Milestone-gated user-handwriting customization** — users replace the logo + section headings with their own handwriting as a progression reward. The swappable heading/logo slot is being built in the HOME port; the gating is deferred.
- **Dark/light writing-mode toggle (Desk)** — post-gate; keep structure tokens theme-ready so it's cheap.
- **Paste block internal/external split + friction-gated disable** — the current block stops ALL paste; the brief wants internal copy/paste allowed, external blocked, and disabling behind friction + an AI-slop warning. Sub-build, non-blocking for HOME.
