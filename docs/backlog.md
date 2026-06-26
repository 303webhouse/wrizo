# Backlog / Build Log

Reverse-chronological log of shipped tickets (newest first). One line per ticket; link the brief where one exists.

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
