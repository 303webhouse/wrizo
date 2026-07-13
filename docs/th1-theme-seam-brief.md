# TH1 — the theme seam (build brief)

**Place at:** `docs/th1-theme-seam-brief.md`. Fable, 2026-07-13. Canon:
`docs/flux-theme-canon.md` §1, §3–§4, §6, §11. Branch: `th1-theme-seam`, off
current `main`. **This is infrastructure only — Plateau must be visually
unchanged when TH1 ships.** Flux itself is TH2.

## Goal

A theme-agnostic seam such that a theme is a data file: token pack + lexicon
map + font-slot values + effect parameters. Flux (TH2), Volant, and Nomad
plug in without touching components.

## Slices

**Slice 0 — token audit and ThemeProvider.**
Enumerate the CSS custom properties in `apps/desktop/src/index.css` and map
them to the canon's semantic slots. Add the two new slots every theme gets:
`line-active` and `signal-live` (Plateau values: pick quiet in-family
defaults; they may go unused there). Theme selection via a `data-theme`
attribute at the app root with per-theme token blocks — zero runtime cost, no
component changes. Plateau is the default block and must be byte-equivalent
to today's values.

> **Slice 0 warm-start (Fable, post-M1 spot-check @ 7f4bc6b):** M1 added
> zero new custom properties — the audit baseline is unchanged. Plateau's
> existing token vocabulary is material-named (`--brass`, `--brass-press`,
> `--sage`, `--ink-border-strong`, `--font-mono`, ...): the audit's
> deliverable is a material-name -> canon-slot map. Recommended mechanism:
> keep material names as the component-facing layer and have theme packs
> re-point them under `[data-theme]` (zero component edits); mint new vars
> only for slots with no existing carrier (`line-active`, `signal-live`).
> Anchor: `--brass` is the orange invariant, theme-stable by definition.
> M1's new selectors (`.mode-milestone*`, `.status-dot.celebrate`) consume
> existing tokens only and re-skin for free; `pfill-celebrate`'s color
> remains B4's authority, out of TH scope. Do not move `.mode-milestone`'s
> inline `pointer-events:none` into CSS — inline IS the invariant.

**Slice 1 — lexicon projection.**
`themeLexicon.ts`: single source keyed by canonical term IDs (page, shelf,
drawer, binder, box, board, notebook, journal, plan, milestone, freewrite,
home, voicewall, publish, script), themes provide overrides, default falls
through to Plateau terms. A `t(term)`/`useLexicon()` accessor; sweep
user-facing noun strings to route through it. **Display projection only:**
data, schema, routes, sync, and search keep canonical nouns — a search for
"drawer" must still work under any theme. Zero-schema.

**Slice 2 — font slots.**
Four slots per theme: `chromeLabel`, `contentLabel`, `proseSerif`,
`proseSans` (canon §4). Add fontsource packages for Rajdhani and Chakra Petch
(S1's Courier Prime precedent — pin versions, no CDN at runtime). Define
Plateau's four slot values (Figtree / Figtree / Crimson Pro / Figtree unless
Nick words otherwise — flag in the ship report).

**Slice 3 — cross-theme preference matrix.**
Three prefs, persisted per the W1 toggle pattern, surviving theme switches:
Voice (serif | sans), Page (dark | light), Fade (on | off). Each theme
supplies values; the prefs select within them. Includes the Plateau debt:
define Plateau's dark-paper pair here (or land a flagged stub with the debt
recorded in the ship report and the ledger).

**Slice 4 — effects scaffold.**
One compositor layer component: absolutely positioned behind the page,
`pointer-events: none`, transform/opacity animation only, zero layout
participation. Two ambient classes wired per canon §6: TEXTURE (fast-damp
~0.45s / slow-return ~9s CSS pattern keyed on the existing typing state;
schedulers expose a `busy()` check) and RESPONSE (persists; sputter pauses on
typing). A jittered-timer scheduler utility with per-event caps. Ambiance
dial pref (0–100) scaling rates/opacities; `prefers-reduced-motion` forces 0.
**Plateau runs this layer empty.**

## Constraints

S0 hard gates, zero-schema, read-only projections, token seams — all
unconditional. W1's fixed-track grid must not perceive the effects layer;
W2's restore must not be fought (no focus/scroll theft). Propose-never-ship
on any config or permissions change. Report = push.

## Harness — `scripts/harness/th1.mjs` (committed with the ticket)

1. Theme switch applies the expected token values (spot-check per slot).
2. Lexicon projection maps every term ID; unknown/missing falls through to
   canonical; canonical nouns still resolve in routes and search.
3. Prefs persist across reload; prefs survive a theme switch.
4. Reduced-motion forces dial to 0; dial 0 yields zero scheduled events.
5. Effects layer contributes no layout size (fixed-track grid unchanged with
   the layer mounted).
6. Plateau default-theme regression: rendered token values byte-equal to
   pre-TH1 `main` where measurable.

## DoD

All slices green + harness green and stable across 3 runs + Fable review +
Nick's merge word. Expected zero-schema deploy (client-only; confirm no
server files touched in the ship report). Hardware-gate items defer to TH2 —
TH1's only feel-check is that Plateau is visually unchanged.

## Out of scope

Flux itself (TH2). The anti-paste rail. Any Volant/Nomad content. The
wordmark-replacement feature from horizon item 14.
