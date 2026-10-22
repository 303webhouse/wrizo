# TH-Machina build plan

**STATUS: PLAN ONLY.** No product code. Written against `origin/main` at
`7381136b`, after the typewriter-scope fix, per Nick's arming word (Oct 21,
10:35am: "Let's also get the Machina build going") and Fable's routing.
Owner: **TOOLS**. Reviewed by Fable; build starts only after **(a)**
big-projects 1a, 2 and 3 have merged (Machina skins the new shell, so it
isn't built twice) and **(b)** Nick approves Cursor's own Machina mockups.
Runs in parallel with the Flux v2 build (INK), on separate branches, with
`theme.ts`/the lexicons/`index.css` rebased carefully between them.

**THE BUILD QUEUE (Fable, Oct 21 4:36pm), updated Oct 21 evening.** TOOLS'
Machina-arc work is now FOUR separately-branched steps, not one build:
**1. theme-unlock-count** — shipped separately (`theme-unlock-count` @
`815e0bc2`/`36e18bad`; accepted, queued on Chat 1's box — not this doc's
subject). **2. The theme picker** (brand cards, unlock states, per-theme
menu names, Flux's wordmark in Silkscreen) — **§8 below**. **3. Arbor's
garden icons + Arbor's "BOARDS →" tab** — **§9 below**. **4. Machina
itself** (CAST, tokens, lexicon, effects, Run) — **§§1-7, this plan's
original and still primary subject.** Steps 2-4 each start only after
big-projects step 3 merges; each is its own branch. Where §§1-7 below
describe the picker or Arbor's icons as "landing WITH" Machina's own
build, that framing is now superseded by this queue — see §8/§9 for the
current, authoritative scope of those two steps.

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
  (brand cards, unlock states, hover animations). Read in full across its
  four dated updates (10:35am menu labels, 11:57am mockup review, 12:16pm
  unlock-states spec, 12:34pm icon note). **No longer "lands with this
  build"** — ships as its own branch, step 2 of the queue above (§8).
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
- **Plan (the mode tab) → CORRECTED (Fable, Oct 22): a Machina-specific
  OVERRIDE keeping the literal word "Plan →", NOT an inherit-canonical that
  resolves to "Boards →".** This plan's own earlier reading (quoted below,
  struck, for the record) reasoned itself into the wrong answer from the
  same evidence it had: it read Nick's locked list naming it literally as
  `"Plan →"` as "no change FOR MACHINA" (i.e., Machina just inherits
  whatever Arbor's canonical tab says), on the theory that once Arbor's own
  canonical term renames "Plan →" → "Boards →" (§9b), Machina's tab would
  follow automatically with no override needed. **That inference is
  falsified by direct, approved build evidence**: `machina-build-brief.md`'s
  own Oct 21 round-3 mockup entry (`cursor/machina-v1-mockup` @ `360f3db3`,
  CLEARED by Fable, APPROVED by Nick 4:13pm, named as THE build reference)
  quotes the rendered strip verbatim — *"the mode strip SPRINT · BUILD ·
  EDIT · WORKSHOP · FINALIZE · PLAN →"* — Machina's own tab is **literally,
  approvedly, "PLAN →"**, not "Boards →" and not "Plans →" (its own
  Boards-content-type word, per §1c's locked map). If Machina genuinely
  inherited Arbor's canonical rename, the approved mockup would show
  "BOARDS →" or "PLANS →" here; it shows neither. So: Machina's `OVERRIDES`
  entry for this key is `'Plan →'`, explicit, keeping the pre-rename word on
  purpose even as Arbor's own canonical entry moves away from it — the
  opposite of "no override needed." **Confirmed, not open — drop from §7.**
  (Struck, kept for the record: ~~"Plan (the mode tab) → inherits canonical,
  does not get a Machina-specific override... Once the Arbor-canonical
  rename lands, Machina's own tab reads 'Boards →' automatically, with no
  Machina-specific entry required."~~)

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
  generic/shared glyph set until now — in fact a plain UNICODE CHARACTER per
  rail item today, not even an SVG; see §9a). **SUPERSEDED — wiring this in
  ships as its own branch (step 3 of the build queue above, §9), ahead of
  Machina's own build, not WITH it:** the icon-swap mechanism itself is
  INK's own `themeIcons.ts`/`ThemeIcon.tsx` registry (Flux v2, §9a); step 3
  registers Arbor's set into it and Machina's own step 4 registers its set
  the same way — neither builds a seam.

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
   **The icon-swap mechanism is INK's `themeIcons.ts`/`ThemeIcon.tsx`
   registry (Flux v2, §9a), not something either step 3 or Machina's own
   build constructs** — Machina's step 4 just registers its own svg set
   into it, the same way step 3 registers Arbor's.
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
7. **Theme menu "Theme" label + brand cards:** **SUPERSEDED — ships as its
   own branch (step 2 of the build queue above, §8), not WITH this build.**
   Machina's OWN lexicon entry ("Theme") and card illustration are still
   specified here since they're Machina's own data; the picker component,
   unlock states, hover animations and the other themes' cards are §8's
   scope, not this section's. Per `theme-menu-brief.md`: the rail-foot
   label resolves through the lexicon seam already (§1c's own mechanism —
   this is just another entry in the identity/label map, labelled "Theme"
   for Machina specifically, "Mood" for Arbor, "Skin" for Flux per the
   brief's own table); the picker itself becomes brand cards (large,
   palette+mark+small world-detail, never a UI screenshot) — a new
   presentational component (§8b) replacing the current button-list
   picker, built once (not per-theme), reading each theme's own new "card"
   assets. Machina's own card: "steel instrument lines, with Run's orange
   notch" (brief's own description) — needs its own small illustration
   asset, likely from the SAME mockup pass as the icon set/splash (item
   4/5 above) rather than a fourth separate asset request; raise this
   consolidation opportunity to Fable rather than silently deciding it.
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
| `apps/desktop/src/store/themeIcons.ts` (INK's registry, Flux v2) | **not built here** — Machina registers its own corporate-instrument set into INK's registry (§9a); no seam of its own |
| `apps/desktop/src/store/themeCast.ts` (new, name TBD — see §2) | CAST storage seam |
| `apps/desktop/src/components/ThemeEffectsLayer.tsx` / `store/fluxThemeFx.ts`-equivalent | confirm empty-registration is already a supported shape for Machina; register the one celebration's Machina-specific constants |
| `apps/desktop/src/components/WritingIncentives.tsx` | Run (Machina-conditional, §3.6); celebration skin constants |
| `apps/desktop/src/components/SplashMark.tsx` | third mark function, once the splash mockup lands (§3.5) |
| `apps/desktop/src/components/CascadePanels.tsx` / a new `ThemePicker.tsx` (§8b) | **built in step 2 (§8), not here** — Machina's own build supplies only its own card illustration + lexicon entry |
| `apps/desktop/package.json` | four fontsource packages |
| `apps/desktop/src/main.tsx` | CAST reflected onto the DOM before first render, alongside `initTheme()` |
| `apps/desktop/scripts/harness/th-machina.mjs` (new) | §4 |
| `apps/desktop/scripts/harness/cd2.mjs`, `hb1.mjs` | confirm/extend existing theme-conditional checks |

---

## 6. Sequencing (restated from the brief, as the gate this plan itself respects)

**Superseded by the build queue (header, Oct 21 4:36pm):** this section
described Machina's OWN sequencing only, written before the picker and
Arbor's icons were split into their own separately-branched steps. It
still governs step 4 (Machina itself) correctly; steps 2/3 have their own
sequencing in §8/§9.

1. Cursor mocks Machina on the current shell (frames, icon sheet, splash) —
   Fable clears, Nick approves. *(Independent of this plan's own review.)*
2. **This plan** — written now, reviewed by Fable.
3. Machina's OWN build (step 4 of the queue) starts only after big-projects
   1a/2/3 merge AND item 1's approval lands AND steps 2/3 have landed their
   own icon-swap seam (§9a) for step 4 to consume. Runs parallel to Flux v2
   (INK) on a separate branch; `theme.ts`/the lexicons/`index.css` rebase
   carefully against whichever lands first.
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
- ~~Confirm this plan's own reading of "Plan →" in the locked word list~~ —
  **RESOLVED**: Fable's second relay confirms it directly (§1c) — Arbor's
  mode tab renames "Plan →" → "Boards →" lexicon-wide, riding this build;
  Machina's own tab inherits "Boards →" with no separate override.
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
- Step 2's own open questions are in §8e; step 3's are in §9e — not
  repeated here since they're that step's own build-time confirms, not
  Machina's.

---

## 8. Step 2 — the theme picker (brand cards, unlock states, Silkscreen)

Ships as its OWN branch, per the build queue (header) — independent of
Machina's own CAST/token build (§§1-7), even though Machina supplies the
picker's third card (§3.7). Gated the same way: starts after big-projects
step 3 merges.

### 8a. Scope

Sources: `theme-menu-brief.md` in full (its four dated updates: the
10:35am menu-label table, the 11:57am mockup review, the 12:16pm
unlock-states spec, the 12:34pm icon note), plus theme-unlock-count's
already-shipped schema (`theme-unlock-count` @ `815e0bc2`/`36e18bad` —
`words_written`, `themes_opened`, `THEME_UNLOCK_THRESHOLDS`, `GET
/theme-unlock`, all live and accepted).

- **Per-theme menu names** resolve through the lexicon seam (§1c's own
  mechanism, already proven): Arbor "Mood", Machina "Theme", Flux "Skin"
  (supersedes its own earlier "Skins" lock), Nomad "Vibe" (on hold until
  built), Volant a wordless symbol with a hidden accessible name "Themes"
  (on hold until built).
- **Brand cards, not buttons**: large, one per BUILT theme — the
  absent-not-grayed law (`CascadePanels.tsx`'s own `THEME_OPTS` comment,
  §8b) already governs this and must keep governing it: Nomad/Volant
  never appear before they ship, never grayed-as-a-promise. Narrative
  order Arbor → Machina → Flux → Nomad → Volant. Each card: palette +
  materials + signature mark + a small world-detail, NEVER a UI
  screenshot. Wordmark in the theme's own type face — **Flux's wordmark is
  Silkscreen** (Nick's pick, this round); Arbor's and Machina's own
  wordmark faces are NOT yet specified — confirm before build rather than
  guessing one (§8e).
- **Unlock states**, the picker's first real consumer of theme-unlock-
  count's own schema: a theme is OPEN if ANY of —
  (1) `wordsWritten >= THEME_UNLOCK_THRESHOLDS[id]` (both already shipped,
  readable from `GET /theme-unlock`);
  (2) `themesOpened[id]` (ditto);
  (3) it's the theme CURRENTLY in use (pure client state, `useTheme()`'s
  own return value — no new server signal, per Fable's own ruling on the
  schema ticket: "it closes your Flux grandfather gap; no new signal
  needed"). Confirm at build time whether the client already has a
  fetch/cache seam for a GET-only account endpoint to extend
  (`page-defaults`/`proofing`'s own pattern in `sync.ts`) or whether this
  step builds the first one.
  - **Locked cards**: grayed, with a quiet note computed from the gap to
    threshold — e.g. "612 more words to open Flux" — never a toast, nag or
    badge (M1's "never a visible locked door" law is explicitly carved out
    for the picker ONLY, per Nick's own canon note in the brief; it still
    governs everywhere else).
  - **Hover** (unlocked cards only), each animating the theme's OWN
    progress idiom: Arbor's rhizome grows across the card and over the
    word "Arbor" (fuller/messier than the existing rhizome mark — Nick's
    own correction); Machina's Run units fill and the notch advances;
    Flux's Glitch tick fires. Reduced-motion/Ambiance 0: a still frame of
    the grown state, no animation.
  - **Once open, always open** needs no re-lock logic: both
    `themesOpened` and the threshold comparison only ever grow, already
    proven server-side (theme-unlock-count's own harness, its T5/"never
    subtracts" checks).
- **Interaction**: current theme marked by the brass outline (Flux keeps
  its own exception: cyan card + a thin orange bar on the LEFT edge, per
  Fable's round-1 mockup fix — not the bottom); the Dark/Light toggle
  stays BESIDE the picker, not inside a card; click = switch (unchanged);
  keyboard + focus work; 44px targets; each card a real `<button>` whose
  accessible name is the theme's own name (Volant: symbol + a hidden
  accessible name).

### 8b. Where this lands (confirmed at plan time, not "TBD")

`CascadePanels.tsx`'s own `CascadeThemePanel()` (≈ line 1083) is TODAY'S
button-list picker: `THEME_OPTS: [ThemeId, string][]` (≈ line 1081) mapped
to plain `<button>` rows, with its own absent-not-grayed comment already
in place (≈ line 1078: "future themes are ABSENT, not grayed... there is
no third entry to hide") — the law this step's own card list must keep.
Given the card redesign's own surface area (an illustration, a hover
animation and a locked/grayed state per theme), this plan recommends
EXTRACTING a new dedicated component (e.g. `components/ThemePicker.tsx`)
rather than growing `CascadeThemePanel()` in place — confirm this call at
build time against `CascadePanels.tsx`'s own size and convention (it is
already a large, multi-panel file).

### 8c. File list (best current estimate; confirm each against the tree at build time)

| File | Change |
|---|---|
| `apps/desktop/src/components/CascadePanels.tsx` | `CascadeThemePanel()` replaced by a call into the new picker component (§8b) |
| `apps/desktop/src/components/ThemePicker.tsx` (new, name TBD) | the brand-card grid: cards, per-theme hover animation, locked/grayed state + note text, Dark/Light toggle placement |
| per-theme card illustration assets (new) | Arbor "warm paper and the brass rhizome", Flux "cyan terminal glass, grid, glitch tick", Machina "steel instrument lines, Run's orange notch" (brief's own descriptions) — confirm these ride the SAME mockup pass as each theme's own icon set/splash rather than a separate ask |
| a `GET /theme-unlock` client read seam (new, name TBD) | fetch + cache the already-shipped endpoint; confirm against `page-defaults`/`proofing`'s existing client pattern (§8a) before inventing a new one |
| `apps/desktop/src/store/deskLexicon.ts` / `themeLexicon.ts` | the five per-theme menu-label entries (Mood/Theme/Skin/Vibe/symbol) |
| Flux wordmark font asset | Silkscreen — confirm fontsource package vs. static asset against this codebase's existing font-loading convention before adding a new package for a single wordmark use |

### 8d. Harness

A new `scripts/harness/theme-picker.mjs`. The unlock-state OR-logic and
the locked-note text are pure data/string computations, testable
browserless (no grant needed) following `theme-unlock-count-db.mjs`'s own
pattern; the card render, hover animation and keyboard/focus checks need
a real DOM, following `th2.mjs`/`fx16.mjs`'s own CDP convention. Checks:
absent-not-grayed (Nomad/Volant never render before they ship); grayed
cards show the correct word-gap note and are not clickable; the current-
card marks (brass outline; Flux's own cyan+left-bar exception); the hover
animation per theme (and its reduced-motion stillframe); keyboard
reachability + 44px targets; the three-way OR opens a theme via EACH path
independently (threshold alone, `themesOpened` alone, current-theme
alone) — mirroring `theme-unlock-count-db.mjs`'s own T-numbered proof
style.

### 8e. Open questions for Fable (this step, not Machina's — §7 is Machina's own)

- Arbor's and Machina's own wordmark type faces (Flux's alone is locked:
  Silkscreen).
- Whether the per-theme card illustrations ride the icon-set/splash
  mockup pass or need their own ask (already an open question for
  Machina's own card specifically in §7; this is the same question for
  Arbor's and Flux's cards).
- Whether a GET-only account-endpoint client fetch/cache seam already
  exists to extend, or needs to be built fresh for this step.

---

## 9. Step 3 — Arbor's garden icons, plus Arbor's "BOARDS →" tab

Ships as its OWN branch, per the build queue (header), after big-projects
step 3 and independent of both the picker (step 2) and Machina (step 4).
**The icon-swap mechanism itself is INK's, not this step's (§9a)** —
`store/themeIcons.ts` + `components/ThemeIcon.tsx`, built as part of
INK's Flux v2 work. This step and Machina's own step 4 each ADD a set to
that one registry; neither builds a seam.

### 9a. The actual mechanism — SUPERSEDED (Fable, Oct 21 evening)

**Correction, after this section was first written and the plan already
accepted:** this section originally found NO existing per-theme icon-swap
seam in the codebase (`DeskRail.tsx`'s own rail items render a literal
UNICODE CHARACTER per glyph today, `RailItem.glyph: string` — not even an
SVG — confirmed by reading the file directly, ≈ line 22-27/144) and
proposed building one here, modeled on `BeginningsRow.tsx`'s own
`GLYPH: Record<BeginningKey, ReactNode>` shape.

**That proposal is now moot: INK's Flux v2 build creates the GENERIC
registry this whole arc needs** — `store/themeIcons.ts` +
`components/ThemeIcon.tsx` (not yet merged at the time of this note;
confirm its exact shape when it lands before building against it). This
step does NOT build a seam. It ADDS Arbor's garden set to INK's registry,
the same way Machina's own step 4 adds its own corporate set to it —
**one registry, two themes' data, never two mechanisms.** The unicode-
character finding above still stands as the reason a seam was needed at
all; it's kept here as the diagnosis, not as this step's own build
target anymore.

### 9b. Scope

- **Arbor · Garden set** (`icons-v3.html`/`.png`, §1c-icons — the glyphs
  themselves are already drawn and need no further design work here):
  soft hand-drawn strokes, nine glyphs — Drawer, Pages, Boards, Journal,
  **Mood** (the already-locked theme-menu label, not "Themes"), Settings,
  Trash, Graft, Set — one-for-one with Arbor's current rail roster.
  Registered as data into INK's `themeIcons.ts` registry (§9a) and
  rendered through `ThemeIcon.tsx` wherever each of the nine already has
  (or gains) a render call — confirm the full call-site list against
  INK's own registry once it merges, rather than the pre-registry
  per-file hunt this section used to describe.
- **"Plan →" → "Boards →"**: a rename of ARBOR'S OWN CANONICAL mode-tab
  word — not an override. Arbor IS the canonical lexicon, so this edits
  the CANONICAL table directly. **CORRECTED (Fable, Oct 22): Machina's own
  entry does NOT inherit this rename** — §1c now carries a Machina-specific
  `OVERRIDES.machina` entry keeping the literal word `'Plan →'`, confirmed
  against the approved build mockup (`cursor/machina-v1-mockup` @
  `360f3db3`, §1c's own corrected note). So this step's rename is scoped
  to Arbor's canonical row alone; it must NOT remove or weaken Machina's
  own override, and this step's own harness (§9d) should confirm Machina
  still reads "Plan →" (not "Boards →") AFTER this rename lands, precisely
  because an override sitting on TOP of a canonical rename is exactly the
  shape a careless CANONICAL-table edit could silently break. Confirm
  the exact canonical key/string at build time (likely in
  `deskLexicon.ts`'s or `themeLexicon.ts`'s own `CANONICAL` object,
  alongside the other mode-tab words AGENTS.md's own "Pages⟷Plan"
  navigation reference names) and rename it in the ONE place canonical
  strings live, per the CANONICAL/OVERRIDES pattern §1c's own
  registration note already establishes — every theme that does NOT
  override this key (every theme but Machina) picks up "Boards →"
  automatically the moment this
  lands.

### 9c. File list (best current estimate; confirm each against the tree at build time)

| File | Change |
|---|---|
| `apps/desktop/src/store/themeIcons.ts` (INK's, Flux v2) | Arbor's nine garden glyphs registered as data (`THEME_ICONS.plateau`, `kind: 'svg'` — confirmed shape, read directly off flux-v2 @ `b4c38659`: `ThemeIconSpec = {kind:'pixels',rows} \| {kind:'svg',viewBox,paths}`), reading INK's own registry shape (confirm it once merged — not built here) |
| `apps/desktop/src/components/ThemeIcon.tsx` (INK's, Flux v2) | consumed, not built — **CONFIRMED (Fable Oct 22, read directly off flux-v2 @ `b4c38659`), not a future unknown:** six of this step's nine render sites already route through it (Cascade.tsx's strip: page/docs, plan/circuits, journal/log, settings/config, theme/skin, trash/trash; PlaceBlock.tsx's rack/log; SectionsPopout.tsx's rack/log and cartridge) — only Graft ('input') has **zero render sites anywhere today** (GraftPicker.tsx's dialog header renders text only, no icon) — a real gap, not a guess, raised to Fable/INK rather than silently routed around (see `arbor-garden-icons.mjs`'s own T9) |
| `apps/desktop/src/store/deskLexicon.ts` / `themeLexicon.ts` | the CANONICAL "Plan →" → "Boards →" rename, exact key confirmed: `pagePlanDoor: 'Plan'` (§9b) — the arrow itself is a decorative sibling span in `PageEditor.tsx` (`{dt('pagePlanDoor')} <span aria-hidden="true">→</span>`, two render sites), never part of the lexicon string |
| `apps/desktop/scripts/harness/arbor-garden-icons-source.mjs` (new, WRITTEN AND GREEN TODAY) | §9d's fast-lane half — browserless, no grant, proves the pre-rename baseline (`pagePlanDoor` is `'Plan'` today), the arrow's decorative-span shape, that no theme has an OVERRIDES entry for this key yet, and the CANONICAL/OVERRIDES resolver itself — 6/6 green, one mutant proving the rename-sequencing hazard this step must not fall into |
| `apps/desktop/scripts/harness/arbor-garden-icons.mjs` (new, WRITTEN, UNRUN) | §9d's CDP half — written against flux-v2's confirmed registry shape, syntax-checked only; cannot run until flux-v2 merges and Arbor's nine glyphs are actually registered (this step's own build work) |

### 9d. Harness

A new `scripts/harness/arbor-garden-icons.mjs` (CDP — rendering a real
glyph needs a DOM): the Arbor rail (and Settings/Trash/Graft/Set,
wherever they render) shows the NEW svg glyphs, not the old unicode
characters, under `data-theme="plateau"`; the mode tab reads "Boards →"
everywhere it used to read "Plan →". **CORRECTED (Fable, Oct 22):** the
Machina-side check is no longer "Machina ALSO reads Boards →" — it is
the opposite, and arguably the more important half, since an override
sitting on top of a freshly-renamed canonical is exactly the shape a
careless edit silently breaks: a check that a Machina-themed page STILL
reads **"Plan →"**, unchanged, specifically BECAUSE of its own
`OVERRIDES.machina` entry and despite Arbor's canonical row renaming out
from under it (§9b's own corrected note; §1c). This can only run once
Machina's own `ThemeId` entry exists in code (§5's own `theme.ts` row) —
decide at build time whether to write it now and leave it red-pending-
Machina, or defer it to step 4's own harness with a cross-reference back
here; either is honest, silence about the gap is not. (Browserless prep
for this exact pair — the lexicon's own OVERRIDES/CANONICAL source shape,
before any DOM exists to render it — is written now in
`scripts/harness/arbor-garden-icons-source.mjs`, this step's own fast-lane
half; see that file's own header for what it proves today vs. what waits
on Machina's `ThemeId`.)

### 9e. Open questions for Fable (this step, not Machina's — §7 is Machina's own)

- The icon-swap mechanism itself — **RESOLVED** (Fable, Oct 21 evening): it
  is INK's `themeIcons.ts`/`ThemeIcon.tsx` (Flux v2), not a seam this step
  builds (§9a). The only remaining build-time task is confirming that
  registry's exact shape once it merges and registering Arbor's nine
  glyphs into it — not a design question for Fable.
- **NEW (Fable Oct 22, found while writing this step's harness):** Graft's
  own icon id (`'input'`) has ZERO render sites anywhere in flux-v2 @
  `b4c38659` — `GraftPicker.tsx`'s dialog header renders text only, no
  icon at all. Arbor's ninth garden glyph (Graft) has nowhere to register
  INTO until one exists. Ask Fable/INK: does flux-v2 add this render site
  before step 3's own build starts, or does step 3 add it as its own small
  addition (a few lines in `GraftPicker.tsx`, following the exact
  `<ThemeIcon id="..." fallback={...} />` pattern the other eight sites
  already use)? Either is small; deciding silently is not — `arbor-garden-
  icons.mjs`'s own T9 documents the gap's current shape (0 render sites)
  rather than guessing a selector that doesn't exist yet.
