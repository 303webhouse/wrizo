# Backlog / Build Log

Reverse-chronological log of shipped tickets (newest first). One line per ticket; link the brief where one exists.

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
