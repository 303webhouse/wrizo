# TH-Machina build plan

**STATUS: PLAN ONLY.** No product code. Written against `origin/main` at
`7381136b`, after the typewriter-scope fix, per Nick's arming word (Oct 21,
10:35am: "Let's also get the Machina build going") and Fable's routing.
Owner: **TOOLS**. Reviewed by Fable; build starts only after **(a)**
big-projects 1a, 2 and 3 have merged (Machina skins the new shell, so it
isn't built twice) and **(b)** Nick approves Cursor's own Machina mockups.
Runs in parallel with the Flux v2 build (INK), on separate branches, with
`theme.ts`/the lexicons/`index.css` rebased carefully between them.

**Sources, read in full:**
- `docs/theme-foundations/machina/machina-foundations.md` — LOCKED 2026-07-14,
  design source. Section numbers below (`§n`) refer to this document.
- `docs/theme-foundations/machina/machina-b4-instrument.html` — the normative
  visual reference (RC). **Where this plan and the RC disagree, the RC
  wins**, except where the RC predates the shell changes named below.
- `docs/flux-theme-canon.md` — the TH-arc's own general law: *"a theme is
  four maps and zero forks: token remap + lexicon map + effects layer + font
  slots, riding the existing CSS-variable seam. No parallel components."*
  Machina rides the exact same seam Flux already proved.
- `C:\Users\nickh\Downloads\machina-build-brief.md` — Nick's arming brief,
  2026-10-21 (the "what's new since July" list this plan integrates).
- `C:\Users\nickh\Downloads\theme-menu-brief.md` — the theme-picker redesign
  (brand cards), which lands *with* this build because Machina is the third
  card.
- `C:\Users\nickh\Downloads\machina-words-pass.md` — Nick, Oct 21 12:16pm.
  **Overrules the foundations' own §9** ("zero renames") — Machina's real
  lexicon map (§1c below).
- `C:\Users\nickh\Downloads\icons-v3.html` / `.png` — the Machina corporate-
  instrument icon set AND Arbor's own new garden set, drawn directly by
  Fable (§1c-icons below), pending Nick's look.
- `e7d50613` (`cursor/machina-theme-644d`) — **prior art only, never
  approved, not merged, not a base.** Its own file list (`index.css`,
  `theme.ts`, `themePrefs.ts`, `themeLexicon.ts`, `deskLexicon.ts`,
  `themeTerritories.ts`, `ModeStage.tsx`, `WritingIncentives.tsx`,
  `CascadePanels.tsx`, `main.tsx`, `package.json`, three harness files) is a
  useful cross-check against the file list below, nothing more — it skinned
  the OLD shell and predates Run/the brand-card picker/big-projects.

---

## 0. What's different from a straight re-skin

Machina is TH1/TH2's third theme, so the MECHANICAL seam (data-theme
attribute, CSS custom properties, the lexicon's CANONICAL/OVERRIDES pattern,
`ThemeEffectsLayer`'s `registerThemeFx` seam) is already proven twice over —
this plan is mostly **data**, not new machinery. Three things make it NOT a
copy-paste of Flux's own build, named up front so they aren't rediscovered
mid-build:

1. **CAST is a second, theme-scoped preference dimension**, not a single
   token swap. Flux has one token pack; Machina has two — COOL (default) and
   NEUTRAL — switched by a control that must not leak into other themes'
   settings surfaces (§3, §11).
2. **The foundations predate the new shell.** Big-projects' Rail A, the
   Pages/Boards pop-outs, the redesigned side-panels, and per-theme
   light/dark are all newer than the RC. The RC is still authoritative for
   *Machina's own values* (colors, type, CAST, the mark, effects); it is
   silent on *where those values land* in the new layout. This plan's own
   file list (§2) targets the shell as it exists after big-projects 2/3,
   not the RC's own `<aside class="rail">`.
3. **Two deliverables are "mocked first" and gate the build, not follow it**
   (brief §1): the per-theme icon set and the per-theme splash. The icon set
   is further along than "mocked" already suggests — Fable drew it directly
   (`icons-v3.html`/`.png`, §1c-icons below), skipping the Cursor-redraw step
   the brief originally named; it still needs Nick's own look before this
   plan treats it as locked. The splash has not moved past "to be mocked."
   Neither blocks writing THIS plan (the token pack, lexicon, and effects are
   specified directly from the locked foundations + the locked words pass),
   but both block the BUILD itself reaching those two surfaces.

---

## 1. The four maps

### 1a. Token remap (`index.css`)

Ride TH1 Slice 0 exactly: a `[data-theme="machina"]` block re-pointing the
same semantic slots Flux's own block re-points, nested `[data-cast="cool"]`
/ `[data-cast="neutral"]` sub-blocks under it (RC pattern:
`body[data-cast="cool"]{ ... }`, ported to `:root[data-theme="machina"][data-cast="..."]`
to match this codebase's own `:root`-scoped convention rather than the RC's
demo-only `body[...]` selectors). Cool is the default — written as the BASE
`[data-theme="machina"]` block's own values, with `[data-cast="neutral"]`
as the override layer, mirroring how `[data-theme="flux"][data-page="dark"]`
already layers over the theme's own base.

Values, straight from §4 (COOL is the base block; NEUTRAL only lists what
changes):

| Slot | COOL (base) | NEUTRAL (override) |
|---|---|---|
| `--ink-950` (ground) | `#0A0B0E` | `#0A0A0A` |
| `--chrome-surface` | `#12141A` | `#121212` |
| `--rail-surface` | `#0E1015` | `#0E0E0E` |
| `--ink-border` (line) | `#252933` | `#242424` |
| `--ink-border-strong` (line-strong) | `#343A46` | `#333333` |
| `--line-active` | `#7FA0BC` (steel) | `#FF9800` (= accent) |
| `--signal-live` | `#9DA5B4` | `#A3A3A3` |
| `--brass` (accent, invariant) | `#FF9800` | `#FF9800` |

Page pairs (§4's own scoping law, already how Flux's own
`[data-page='dark'/'light']` blocks work — **page ink is independent of
room ink**, the Page pref flips only `--paper`/`--paper-border`/
`--ink-on-paper`):

| Slot | COOL dark | COOL light | NEUTRAL dark | NEUTRAL light |
|---|---|---|---|---|
| `--paper` | `#16181F` | `#F8F9FC` | `#161616` | `#FAFAFA` |
| `--paper-border` | `#2F3541` | `#D3D8E1` | `#2E2E2E` | `#D6D6D6` |
| `--ink-on-paper` | `#E6E9F1` | `#13161C` | `#E9E9E9` | `#141414` |
| `--ink-on-paper-low` (meta) | `#878E9C` | — (derive, see note) | `#8A8A8A` | — |

Note: the RC gives one `meta`/`muted` pair per cast, not per page-tone; Flux's
own `--ink-on-paper-low` is a *light-page-specific* darkened step (faint-text-sweep
measured it against `--paper`/`--card-stock` for the 4.5:1 floor — see
`index.css`'s own Flux block and the faint-text-sweep ticket). Machina's
light-page meta value needs the SAME contrast measurement against ITS OWN
`--paper`/light pair before being pinned — **do not reuse the dark-page
value verbatim on light paper without measuring it; this is a build-time
task, not a plan-time guess.**

`--muted`: `#6C7482` (cool) / `#6F6F6F` (neutral) — the RC's own `muted`
slot (button borders, dimmer labels); maps to whichever existing muted-tier
token Flux's own block uses at that same semantic position (confirm the
exact token name against `index.css` at build time — Flux's naming for this
tier has shifted at least once this arc, per faint-text-sweep).

**Square corners and solid borders throughout** — already the v1 floor
every theme wears; no override needed.

**Hairline law (§8):** every active marker in Machina's own chrome is 1px —
confirm this is ALREADY true generically (it should be, since `--ink-border`-
driven borders are already 1px house-wide) rather than adding a Machina-only
override; if any existing active-marker rule hardcodes a thicker border for
a different theme's own look, Machina must not inherit it.

### 1b. Font slots (four, per canon §4 / foundations §6)

| Slot | Face | Weight/style |
|---|---|---|
| chromeLabel | IBM Plex Mono | 500 |
| contentLabel | IBM Plex Sans | 400/500/600 |
| proseSerif | IBM Plex Serif | 400, 500, italic 400 |
| proseSans | Atkinson Hyperlegible | 400/700 |

Prose size **11pt both voices** (document-world units, not px — confirm how
the existing `--font-proseSerif`/`--font-proseSans` slots express size today;
if they're px-only, this is the first theme needing a point-based prose
size and the seam may need a small, deliberate extension — flag to Fable
rather than silently coercing pt to px). Titles 17pt serif / 15pt sans.
Serif line-height 1.75, sans 1.8. **Fallback notch:** if Atkinson reads big
at 11pt on the hardware gate, 10.5pt — Nick's own device verdict decides,
never the build agent.

Fontsource packages (confirm availability at build time, per every prior
theme's own practice): `@fontsource/ibm-plex-mono`, `@fontsource/ibm-plex-sans`,
`@fontsource/ibm-plex-serif`, `@fontsource/atkinson-hyperlegible`. The RC's
Google-CDN `<link>` is a standalone-demo-only convenience and is never
carried into the build.

### 1c. Lexicon registration — SUPERSEDED: a real override map, not identity

**§9 of the foundations is overruled.** Nick, Oct 21 12:16pm
(`machina-words-pass.md`): *"The menu labels are all supposed to be
different for Machina, too (wherever possible)."* Machina gets its own
corporate/mechanical vocabulary, the same shape as Flux's — this plan no
longer treats §9's "zero renames" as governing; it is superseded in full,
the way `docs/plans/typewriter-scope-plan.md` superseded a stale comment
mid-arc rather than silently drifting from it.

**The locked map** (`machina-words-pass.md`'s own proposal table, as
AMENDED by Nick's later same-day locking pass — the two are reconciled
below, item by item, since the file on disk still shows Fable's proposal
and the lock arrived as a terse verbal list; where they differ, Nick's
locked list wins and the reconciliation is shown so it can be checked):

| Canonical (Arbor) | Machina | Locked, changed from the proposal? |
|---|---|---|
| Drawer (place) | **Project** | — |
| Top Drawer | **Inbox** | — |
| Set | **Folder** | — |
| Section | **Part** | — |
| Pages | **Files** | — |
| Boards | **Plans** | **changed** (proposal: Charts) |
| Box / card (on a board) | **Block** / **Blocks** | — |
| Journal | **Notebook** | **changed** (proposal: Ledger) |
| Milestone | **Deliverable** | — |
| Home | **HQ** | — |
| Voice Wall | **Compliance** | — |
| Publish | **Finalize** | **changed** (proposal: Release) |
| Templates / Presets | **Forms** | — |
| Grafts / the knob | **Assets** / **Asset** | — (Nick, Oct 21, already locked ahead of this pass) |
| Settings | **Controls** | — |
| Theme menu | **Theme** | — (Nick, Oct 21, already locked) |
| Tutor | **Consultant** | **changed** (proposal: Analyst) |
| Progress | **Run** | — (cleared Oct 21) |
| Trash, Delete for good | plain | — (destructive places stay plain everywhere) |

**Mode tabs** (not in the proposal table at all — a separate, same-day
instruction):
- **Draft → Build**, **Revise → Edit** (Nick's locked list: "modes: Build /
  Edit"). **Workshop has no given Machina word** — left plain pending Nick's
  word; do not guess one into existence.
- **Free Write → Sprint.** Reconciled against the proposal the same way as
  the table above: Fable's proposal was "First Pass"; Nick's locked list
  says "Sprint" instead. **Flagged, not silently accepted:** this reuses an
  EXISTING, different app concept's name (`QuickSprint`, the sprint-bar/
  goal-tracking feature, already present in every theme) for Machina's own
  Free Write mode label. This may be deliberate (Machina's whole register is
  "output," and Free Write *is* a sprint in that register) or may be an
  oversight worth a one-line confirm before the lexicon ships — naming it
  here rather than building it silently either way.
- **Plan (the mode tab) → inherits canonical, does not get a Machina-specific
  override.** Nick's locked list names it literally as `"Plan →"` — read as
  "no change for Machina" rather than a literal word, because the SAME
  instruction batch separately renames the Arbor-canonical term for this tab
  from **"Plan →" to "Boards →"** (ledger note: this is exactly why that
  canonical rename exists — Machina's own Boards-content-type word just
  became **"Plans"** in this same pass, and leaving the MODE TAB as
  "Plan →" next to a content type called "Plans" is the collision the
  rename resolves). Once the Arbor-canonical rename lands, Machina's own tab
  reads **"Boards →"** automatically, with no Machina-specific entry
  required. This is this plan's own reasoned reading of a terse relay, not
  a quote — confirm before building if there is any doubt.

**Registration**, same two files Flux already proved, now carrying REAL
deltas instead of identity no-ops:
- `store/deskLexicon.ts` — `OVERRIDES.machina` gets every key above that
  deskLexicon owns (the desk-rail/chrome-facing terms).
- `store/themeLexicon.ts` — `OVERRIDES.machina` gets every key above that
  themeLexicon owns (the content-noun terms: Pages/Boards/Journal/Publish/
  etc., matching the shape Flux's own `Docs`/`Circuits`/`Logs`/`Uplink` rows
  already take there).
- **Clean-up parallel to Flux's own words-pass (`flux-words-pass.md` §C):**
  any string that still says "Board"/"Journal"/"Page" literally inside a
  big-projects surface (`sectionsNewBoard`, `sectionsEmptyBoards`, "Moved to
  the Journal…", etc.) needs a Machina row too, not just the rail-level
  terms — audit these call sites the same way the Flux pass did rather than
  assuming the rail alone covers it.

The Voice Wall's own blocking copy becomes **"COMPLIANCE ▪ PASTE BLOCKED"**
(canonical event-name format, Machina's own noun substituted) — confirm the
chip component already reads its copy through the lexicon seam (it should,
per Flux's "FIREWALL ▪ PASTE BLOCKED" precedent) rather than hardcoding
Plateau's string.

#### Icons (`icons-v3.html`/`.png`, read directly — the source of record, not a description of it)

Two sets ship in this same build, both already drawn (Fable), pending
Nick's look — not yet "approved" the way Flux's icons v2 were:

- **Machina · Corporate Instrument set** — a precise square-cut line
  register. **Nine of the twenty locked words have a drawn glyph today:**
  Project (briefcase), Files (spec sheet), **Charts** (org chart), **Ledger**
  (ruled ledger book), Controls (gauge), Theme (calibration swatch), Assets
  (cube), Folder (hanging folder), Trash (plain bin — kept recognizable
  cross-theme, same as every other theme's Trash glyph).
  **Two of those nine are now stale labels, not stale glyphs:** the sheet
  reads "Charts" and "Ledger" because it was drawn against Fable's
  *proposal*, before Nick's same-day locking pass changed Boards→**Plans**
  and Journal→**Notebook** (§1c above). The words-pass doc's own closing
  line governs: *"If a word changes, that icon is redrawn."* This is a
  relabel-the-sheet ask back to Fable/Cursor, not a build-time code fix —
  flagging it here so it isn't silently built against the stale word.
  **Eleven locked words have no drawn glyph yet** (Inbox, Part, Block(s),
  Deliverable, HQ, Compliance, Finalize, Sprint, Consultant, and the two mode
  tabs Build/Edit) — confirm with Fable whether these reuse an existing
  rail-icon concept (several already exist cross-theme: Trash, the graft/
  Asset knob) or need their own ask before the build's own icon-wiring step
  is called done.
- **Arbor · Garden set** (new, same sheet, same build — Fable's instruction
  this round, approved by Nick per `theme-menu-brief.md`'s 12:34pm note):
  soft hand-drawn strokes, Arbor's own PLAIN words unchanged (Drawer, Pages,
  Boards, Journal, **Mood** — the already-locked theme-menu label, Settings,
  Trash, Graft, Set) — nine glyphs, one-for-one with Arbor's own current
  rail roster. This is Arbor's FIRST theme-specific icon set (it has used a
  generic/shared glyph set until now); wiring it in is the same per-theme
  icon-swap mechanism Machina's own set needs, built once and reused by
  both, not two separate mechanisms.

### 1d. Effects registration (§10)

- **TEXTURE class: empty.** No events register for Machina — confirm the
  `ThemeEffectsLayer`/`registerThemeFx` seam (Flux's own
  `store/fluxThemeFx.ts`) tolerates a theme with NO texture registration at
  all without special-casing (it should, per canon §1: "Volant and Nomad
  join later as pure data files, no new committee pass required" implies
  an empty registration is already a supported shape — confirm, don't
  assume, before relying on it).
- **RESPONSE class: the one celebration**, skinned gray→orange per §10's own
  constants table (sweep .55s, fill handoff .35s ease signal-live→accent,
  8-tick burst at ~26° steps/.6s/20ms stagger, ≈1.15s total hard-capped
  1.6s, celebrate-summon 2.5s, reduced motion = crossfade only, notch pulse
  1.8s/opacity 1↔.4). This is the SAME one-celebration-grammar every theme
  shares (canon §9) — Machina supplies constants, not new behavior.
- **Carriers:** the prose caret and the Run metric's own notch/unit-in-
  progress both take `--brass`/accent directly (already how every theme's
  caret works); no new carrier machinery.
- **Wall chip:** canonical copy (§1c above), Machina's own border/chrome
  token values, no new timing (`.18s` show per canon §12 — unchanged).
- **Chrome fade:** cross-theme invariant, Machina's own constants are
  IDENTICAL to canon's base (typing fades to .05 opacity over .7s, idle
  return 4.2s, pointer/edge-dwell summons immediately, FADE·OFF disables) —
  no Machina-specific override expected; confirm nothing here needs one.

### 1e. Sparks — the one Machina-specific interaction detail

Two sites, NEUTRAL-only (§5), both already-existing surfaces taking a
conditional value rather than new machinery:
- **Selection wash:** `rgba(255,152,0,.22)` dark paper / `.28` light, under
  `[data-theme="machina"][data-cast="neutral"]`; COOL reverts to the
  existing gray selection the house default already uses.
- **The way-back glyph** (`◂`, the return chip): orange under NEUTRAL, gray
  under COOL — the SAME chip Flux/Plateau already render; only its color
  token resolution gains a cast-aware branch.
Both are CSS-only (a color token swap conditioned on `[data-cast]`); neither
needs new React logic if the existing components already read these colors
from CSS custom properties rather than hardcoding them.

### 1f. The mark (§7) — a launch-branding item, NOT this build

The O-square wordmark treatment is explicitly scoped OUT of the build plan
by the foundations themselves ("a launch-branding item... not a build-plan
concern"). The PRODUCTION mark stays the hand-drawn logo for Machina too,
same as every other theme. Nothing to build here; noted so it isn't
accidentally picked up.

---

## 2. CAST — the storage seam (§3, §11)

CAST is **Machina-scoped**: cool | neutral, default cool, persisted, and
must not render in — or leak a meaning into — any other theme's settings
surface. This is the one genuinely NEW preference shape Machina introduces
(Flux introduced none; its whole surface is the existing cross-theme Voice/
Page/Fade matrix).

**Proposed seam**, modeled directly on `store/writingSettings.ts`'s own
established pattern for a value that only SOME contexts care about
(`typewriterForPage`'s page-scoped read, landed this same week) and on
`store/themePrefs.ts`'s own existing Voice/Page/Fade storage:

- A new store, e.g. `store/themeCast.ts` (or a field added to
  `themePrefs.ts` if its own shape already tolerates a theme-conditional
  field cleanly — confirm which is less invasive by reading `themePrefs.ts`
  at build time; this plan does not pre-decide a file that doesn't exist
  yet without reading its neighbor first).
- `getCast()`/`setCast(value)`/`useCast()` — the SAME
  `useSyncExternalStore`-or-equivalent reactive pattern every other
  per-device preference in this codebase already uses (`store/theme.ts`
  itself, `store/writingSettings.ts`).
- **Rendered only when `useTheme() === 'machina'`** — every call site that
  reads CAST (the token-pack attribute setter, the settings-panel control)
  must gate on the active theme; CAST's own getter returns a fixed default
  when read under a non-Machina theme rather than ever surfacing a stale
  value from a PRIOR Machina session (the exact class of cross-context leak
  typewriter-scope just fixed for a different preference — CAST's own build
  must not reintroduce that shape).
- **Reflected onto the DOM** the same way `theme`/`data-theme` already is:
  a `data-cast` attribute on `<html>` (or wherever `data-theme` itself is
  set — `main.tsx`'s `initTheme()`, per the prior-art branch's own file
  list), set/read synchronously before first paint for the same "no flash"
  reason `initTheme()` already runs before `ReactDOM...render()`.

**Zero-schema** (brief + foundations §13.5): CAST is a local preference,
localStorage only. If the settings model's own persistence pattern
(`apps/desktop/src/store/persistence.ts`) turns out to need ANY server/sync
touch for this to work correctly, **the plan stops and asks Nick** — schema
decisions never get a default, per both the brief and this codebase's own
standing law.

---

## 3. Integrating "what's new since July" (brief §1-8)

The foundations' own values apply onto the CURRENT shell, not the RC's. Per
item, what Machina's build must do (none of this is new DESIGN — it's
locating where the existing token/lexicon/effects maps land on each new
surface):

1. **Big-projects layout** (Rail A, Pages/Boards pop-outs with sets and
   sections, Grafts with the knob, the "…" page menu): skin via the SAME
   token remap already specified (§1a) — these are new COMPONENTS, not new
   COLOR CONCEPTS; they read the same `--chrome-surface`/`--rail-surface`/
   `--line-active` etc. tokens every other piece of chrome does. No new
   token needed unless build-time reading of these specific components
   turns up a literal (non-token) color — flag any such finding rather than
   silently adding a one-off override.
2. **Side-panels redesign** (details card from the title, Tutor with Ask on
   top): same treatment — token remap only.
3. **Light and dark for every theme:** Machina's own page pairs (§1a's
   table) already cover this; confirm the CHROME stays dark in light mode
   (foundations' own instruction: "the PAGE is light; the chrome may stay
   dark") — i.e. the Page pref must be scoped to `--paper`/`--ink-on-paper`
   only, never to `--chrome-surface`/`--rail-surface`, matching §4's own
   "page ink is independent of room ink" law.
4. **Per-theme icon set:** drawn (`icons-v3.html`/`.png` — §1c-icons above,
   both the Machina set and Arbor's new garden set), pending Nick's look.
   Not specified further here; the build's own job once it's cleared is
   wiring a per-theme icon-swap seam, not drawing.
5. **Per-theme splash:** **mocked first** (Cursor), same gate. Prior art:
   this exact seam was just built for Flux/Arbor (`SplashMark.tsx`,
   `ArborMark`/`FluxMark`) — Machina adds a third mark function to the same
   file following the identical per-theme-asset pattern, once its own
   mockup/cut assets exist.
6. **Progress = Run** (cleared Oct 21, `cursor/machina-progress-mockup` @
   `c17b4551`): twenty identical units (one-twentieth of the goal each),
   gray when finished with an orange notch on the in-progress unit, the
   whole strip goes orange only when the batch closes, footer-right
   placement with the count once after the bar. This REPLACES the thin
   sprint bar **for Machina specifically** — confirm with Fable whether Run
   is Machina-exclusive (the brief's own phrasing, "replaces the thin
   sprint bar," reads as scoped to this theme, matching Machina's own
   "output owns it" thesis) before generalizing it elsewhere; building it
   cross-theme without that confirmation would be scope creep this plan
   does not authorize. Implementation surface: `WritingIncentives.tsx`
   (where the sprint bar/`TypewriterToggle`/celebration live today) gains a
   Machina-conditional render path, not a parallel component (canon §1: "no
   parallel components").
7. **Theme menu "Theme" label + brand cards:** per
   `theme-menu-brief.md` — lands WITH this build (Machina is the third
   card). Scope: the rail-foot label resolves through the lexicon seam
   already (§1c's own mechanism — this is just another entry in the
   identity/label map, labelled "Theme" for Machina specifically, "Mood"
   for Arbor, "Skin" for Flux per the brief's own table); the picker itself
   becomes brand cards (large, palette+mark+small world-detail, never a UI
   screenshot) — a new presentational component replacing the current
   button-list picker, built once (not per-theme), reading each theme's own
   new "card" assets. Machina's own card: "steel instrument lines, with
   Run's orange notch" (brief's own description) — needs its own small
   illustration asset, likely from the SAME mockup pass as the icon
   set/splash (item 4/5 above) rather than a fourth separate asset request;
   raise this consolidation opportunity to Fable rather than silently
   deciding it.
8. **Brass through-line + word-diet/minimal-interface laws:** standing,
   cross-theme, already enforced generically — nothing Machina-specific to
   add; confirm Machina's own token choices don't accidentally violate the
   brass invariant (they don't — `--brass`/accent stays `#FF9800` in both
   CAST variants, per §4's own table).

---

## 4. Harness (`scripts/harness/th-machina.mjs`)

Per foundations §13.6, committed alongside the build (house law: harness
scenarios are committed artifacts, landing in the same commit as what they
verify). Checks, modeled on `th2.mjs`'s own structure (Flux's harness) plus
Machina-specific additions:

- **Token spot-checks**, both CAST values: ground, line, line-active
  (steel vs orange), signal-live, the accent invariant unchanged, page
  dark/light pairs (both casts) — the same pattern `th2.mjs` check 1
  already runs for Flux, doubled for CAST.
- **CAST switch round-trip:** cool→neutral→cool is lossless (prefs survive,
  per canon §11's own cross-theme guarantee — same shape as `th2.mjs`'s own
  A3 Flux↔Plateau round-trip check); CAST does NOT render/read on a
  non-Machina theme (a check that switching to Plateau or Flux while CAST
  was "neutral" never surfaces a stray cast-scoped value anywhere).
- **Caret/notch carriers:** prose caret `caret-color` resolves to accent
  under BOTH casts (the "only color in the room" claim); Run's own
  in-progress notch is orange in both casts (positions are a non-CAST-
  conditional orange site per §5).
- **Sparks (NEUTRAL only):** selection wash and the way-back glyph read
  orange under neutral, gray under cool — a real selection made via a
  trusted pointer drag (this codebase's own "nothing uses page-side
  .click()" standing law), not a CSS-only read.
- **Celebration timing caps:** total ≤1.6s hard cap, reduced-motion =
  crossfade only (no sweep, no burst) — same technique `th2.mjs`'s own
  check 5/6 and splash.mjs's own S17 already use (MutationObserver/
  timestamp recording, never a blind sleep-then-sample).
- **Reduced-motion fallbacks:** texture N/A (empty layer — confirm the
  layer mounts with zero children and stays that way, not merely "no
  events fire"), celebration crossfade, notch pulse animation absent.
- **Fade constants:** chrome fade timing matches canon's own cross-theme
  invariant (no Machina-specific drift) — a regression guard, since nothing
  Machina-specific SHOULD differ here.
- **1px hairline assertions:** every active marker (tab underline, rail
  active edge) computes to 1px — the foundations' own explicit ruling
  (§8), worth a literal assertion since it's a single, easily-regressed
  number.
- **Lexicon override assertions:** a representative sweep of the LOCKED
  words (Journal→Notebook, Pages→Files, Boards→Plans, Publish→Finalize,
  Tutor→Consultant, the Voice Wall chip reading "COMPLIANCE ▪ PASTE
  BLOCKED") render verbatim under Machina — proving the real override map
  actually took effect, not merely that nothing crashed. This supersedes
  what an earlier draft of this plan called "identity assertions," written
  before §9's "zero renames" was itself overruled (§1c).
- **CAST persistence/zero-schema guard:** confirms CAST never reaches
  `apps/server/src/sync.ts` (a static source check, same shape as this
  codebase's own sync-completeness law elsewhere) — if the build ever
  needs to touch sync for this, that is the stop-and-ask-Nick trigger
  named in §2 above, and this guard is what would catch an accidental
  drift into schema territory.

Two touched-but-not-new harnesses, per the prior-art branch's own file list
(confirm still relevant against the CURRENT shell, not assumed): `cd2.mjs`
and `hb1.mjs` both read theme-conditional state somewhere in their own
existing checks and may need a Machina-aware branch added rather than a
rewrite.

---

## 5. File list (best current estimate; confirm each against the tree at
build time — this is a plan, not a diff)

| File | Change |
|---|---|
| `apps/desktop/src/store/theme.ts` | `ThemeId` gains `'machina'`; `REGISTERED` gains it; `THEME_CONFIG.machina` already has its own marked slot (`typewriterDefault: false`) waiting — confirmed present on main today, no guess needed |
| `apps/desktop/src/index.css` | `[data-theme="machina"]` token block (§1a), nested CAST sub-blocks, page-pair blocks, spark CSS (§1e) |
| `apps/desktop/src/store/deskLexicon.ts` | `OVERRIDES.machina` real-word entries (§1c — locked map, not identity) |
| `apps/desktop/src/store/themeLexicon.ts` | `OVERRIDES.machina` real-word entries (§1c), including the rail-foot "Theme" label (§3.7) and the mode-tab words (Build/Edit/Sprint) |
| `apps/desktop/src/components/<icon component(s)>` (name TBD — confirm current file) | per-theme icon-swap seam serving BOTH the Machina set and Arbor's new garden set (§1c-icons) |
| `apps/desktop/src/store/themeCast.ts` (new, name TBD — see §2) | CAST storage seam |
| `apps/desktop/src/components/ThemeEffectsLayer.tsx` / `store/fluxThemeFx.ts`-equivalent | confirm empty-registration is already a supported shape for Machina; register the one celebration's Machina-specific constants |
| `apps/desktop/src/components/WritingIncentives.tsx` | Run (Machina-conditional, §3.6); celebration skin constants |
| `apps/desktop/src/components/SplashMark.tsx` | third mark function, once the splash mockup lands (§3.5) |
| theme-picker component (name TBD — confirm current file) | brand-card redesign (§3.7, shared with the theme-menu-brief work) |
| `apps/desktop/package.json` | four fontsource packages |
| `apps/desktop/src/main.tsx` | CAST reflected onto the DOM before first render, alongside `initTheme()` |
| `apps/desktop/scripts/harness/th-machina.mjs` (new) | §4 |
| `apps/desktop/scripts/harness/cd2.mjs`, `hb1.mjs` | confirm/extend existing theme-conditional checks |

---

## 6. Sequencing (restated from the brief, as the gate this plan itself respects)

1. Cursor mocks Machina on the current shell (frames, icon sheet, splash) —
   Fable clears, Nick approves. *(Independent of this plan's own review.)*
2. **This plan** — written now, reviewed by Fable.
3. Build starts only after big-projects 1a/2/3 merge AND item 1's approval
   lands. Runs parallel to Flux v2 (INK) on a separate branch; `theme.ts`/
   the lexicons/`index.css` rebase carefully against whichever lands first.
4. Box: PART 2s, the touched harnesses, a full pair; Fable's clear; Nick's
   word — standard ship gate, nothing Machina-specific.

## 7. Open questions for Fable (not decided by this plan)

- Is Run (§3.6) Machina-exclusive, or does it generalize? Building it
  cross-theme without this answer is scope creep.
- `themeCast.ts` vs. extending `themePrefs.ts` — a build-time read of the
  current `themePrefs.ts` decides this; naming it here would be a guess.
- The light-page meta/muted contrast values (§1a's own note) need measuring
  against Machina's own `--paper`/light pair, not inherited from the dark
  pair or guessed from Flux's analogous value.
- Whether the theme-card illustration (§3.7) rides the same mockup pass as
  the icon set/splash, or needs its own ask.
- **Confirm this plan's own reading of "Plan →" in the locked word list**
  (§1c) — that it means "no Machina-specific override; inherits whatever
  Arbor's canonical says, which this same pass renames to 'Boards →'" —
  before the lexicon ships. A terse relay, read carefully, but not a quote.
- **Confirm Free Write → "Sprint"** is deliberate (§1c flags the name
  collision with the existing `QuickSprint` feature) rather than carried
  over from a different list by mistake.
- **Workshop's own Machina word** — the locked list gives Build (Draft) and
  Edit (Revise) but names no third mode word; confirm whether Workshop
  stays plain or still needs one.
- **The two stale icon labels** ("Charts"/"Ledger" in `icons-v3.html`, §1c-
  icons) need a relabel pass back to Fable/Cursor before the sheet is
  treated as locked — the glyphs likely still read correctly; only the two
  printed words are behind the latest lock.
- **The eleven locked words with no drawn glyph yet** (§1c-icons) — confirm
  which reuse an existing icon concept vs. need their own ask.
