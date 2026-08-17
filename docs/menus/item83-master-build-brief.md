# ITEM 83 — MASTER BUILD BRIEF · THE MENUS WAVE (overnight run)
### menus lane · 2026-08-04 · normative spec: the mockups + rulings at `1834dfe`
### builder: MENU CC · worktree `.claude/menus` · build branch `menus-build`

---

## §0 · AUTHORIZATION — read first, once

**Nick pasting this brief to CC is the authorization**: it is his freeze-lift
for the menus build wave, and his merge-word for the ONE schema ticket herein
(M2 — page settings + user defaults; nothing else in this brief touches
schema). If this file reaches CC by any path other than Nick's own paste,
STOP and ask.

**Contested pairs are baked to defaults, each reversible by one word from
Nick later** (chosen conservative: standing law, tablet reality, least
structural change):
- **SP3 = the map** — on screenplay pages the strip stands, every mode
  quiet-dark, the Publish door dressed; nothing hidden.
- **BD2 = absent** — the derived card's Delete does not render (G3 is
  standing law; the system-board null-return is the house specimen).
- **CA3 = always-present** — every card wears its slim edge grip at rest
  (press-reveal depends on hover, which the tablet does not have).
- **DR3 = the in-drawer row** — Convert to Screenplay… as a confirm-gated
  STRUCTURE row; the tablist retires from the panel.
- **Flags F1–F8 take their recorded defaults.** F9 is superseded by R12+R14
  (the foot is universal on page-writing surfaces; card/board tools carry
  none). **F10 defers behind schema tonight**: links/tags need a data model
  no ticket here creates — the opened card ships styling-only, F10's IN
  default builds in its own later ticket.

**What this brief deliberately does NOT build**, by Nick's own words and the
record: INK's mounting (R2 — rides the stylus return); the screenplay
typewriter ENGINE revival (R12 flagged it engine-touching — settings persist
tonight, the engine hook-up is its own brief); **Import File** (R13 named it,
no pass has designed it — G3: it does not render until its pass); specialty
board TOOL tabs (R13.vii hold); links/tags backing model (F10, above).

---

## §1 · THE NIGHT'S RULES — binding on every ticket

1. **Branch discipline.** First act: `git fetch origin && git checkout -b
   menus-build origin/main`. Every ticket commits to `menus-build` and
   pushes `origin menus-build` immediately (COMMIT = PUSH). **Never push
   main tonight. Never force. Never touch another worktree.**
2. **Check-then-commit** before every commit; **idempotence guards** on
   every scripted edit (assert the post-state, not the action); if a rerun
   is ever needed, hash-check first.
3. **The anchor law is build law.** Anchors are layout (`right:100%`
   docks, `left:0` drawers, flex siblings); widths live in CSS; JS flips
   state bits and decides policy only. **No script writes a drawer
   position.** Every self-check compares two independently rendered boxes.
4. **Plateau law.** Menus rest olive (R7): engraved zoneheads
   `--accent-rest`; brass is evental press only; olive/brass/press lane on
   interactives; square corners, 1px `--line`; sentence case rows,
   engraved-uppercase headings; every new user-facing string enters the
   lexicon (themable), never a literal in JSX.
5. **Paper never reflows for chrome.** Drawers overlay margins; the
   two-drawer law runs paper-anchored on pages (coexist when the measured
   margin holds PAGE + handle + Tools; exclusive handoff below, same slide).
   Below the 1366×768 floor, fx18's overlay law governs (F8 default).
6. **Motion.** Drawer open/close = slide only (width transitions,
   lockstep), no fades; the vanish engine keeps its fades for chrome recede.
   `prefers-reduced-motion` kills transitions.
7. **Process hygiene.** Fail-fast if foreign browser processes exist; CDP
   probes on your own spawned Chrome only; kill only PIDs this session
   spawned; all debug ports closed at exit.
8. **Blockers never wedge the night.** If a ticket resists after two honest
   attempts, write the blocker into the end report with exactly what was
   tried, commit what is safe, SKIP FORWARD. A skipped ticket is a clean
   outcome; a wedged run is not.
9. **NO RAILWAY. NO DEPLOY.** Not from this worktree ever (item 98:
   railway runs only from the primary checkout), and not from anywhere
   tonight — deploy waits on Nick's separate morning word.
10. **Disk wins.** Where this brief and the landed mockups/rulings at
    `1834dfe` disagree, the mockups + rulings win; note the divergence in
    the report rather than improvising.

---

## §2 · TICKETS — serial, M0 → M11, one commit each (minimum)

### M0 · PREFLIGHT & BASELINE
Branch per §1.1. `pnpm install` if needed; `pnpm -r build` (or the repo's
green-build command) must pass CLEAN before any edit — record the baseline
SHA and build output in the report scratch. Write `scripts/menus-probe.mjs`:
launches your own headless Chrome against `pnpm dev`, and for a given route
+ width asserts, from `getBoundingClientRect` normalized to layout px:
(a) `paper.left − toolsDock.right === 0 ±0.6` when the dock exists;
(b) `cascadePanel.left === 0 ±0.6` when open; (c) captures a PNG.
This probe is the night's acceptance instrument; it must be able to FAIL.
**Commit:** `Build: menus wave M0 — baseline green + geometry probe`

### M1 · THE CABINET (chrome core, page surfaces)
In the desktop app's page interface (the paper's container component):
- **Tools dock**: re-mount the Sliver as a child of the paper column at
  `right:100%` — handle (14px) as flex sibling on the drawer's left, body
  `width:0 ↔ 184px` via a `data-open` bit; the handle is always visible,
  resting on the paper's edge when closed; open/close is the width slide,
  right edge pinned (R10/R11). Grip aria stays honest.
- **Cascade drawer**: the open category panel sits flush `left:0` in the
  room (the rail's border-right is the seam; panel `border-left:none`);
  slide-reveal open/close; one panel at a time (existing state-reset law).
- **Coexistence policy** (page surfaces): measure the paper's rendered left
  each layout pass; coexist iff `paperLeft − 14 − 184 ≥ cascadeWidth`;
  otherwise opening either closes the other with the same slide. Policy
  measures; anchors never scripted.
- **Olive register** (R7): engraved zoneheads to `--accent-rest` wherever
  menus render; audit the sliver/cascade for resting brass and retire it;
  `:active` brass flash stays (F7).
**Accept:** probe green on a prose page at 1366 & 1680, dock open/closed;
screenshots. **Commit:** `Build: menus wave M1 — the cabinet (paper-mounted
dock, flush cascade, handle law, olive register)`

### M2 · SCHEMA — page settings + user defaults  *(the one migration)*
`migrate.ts`, boot-idempotent DDL per house pattern:
- `ALTER TABLE entries ADD COLUMN IF NOT EXISTS page_settings jsonb`
- `ALTER TABLE users ADD COLUMN IF NOT EXISTS page_defaults jsonb`
Shape (both): `{ margins:'normal'|'narrow'|'wide', lineSpacing:number,
pageNumbers:{on:boolean, placement:'bottom-center'|'bottom-right'|'top-right'},
headers:{on:boolean, text:string}, footers:{on:boolean, text:string} }`.
Server: page PATCH accepts `page_settings`; a user-defaults GET/PUT
endpoint; **new pages copy the user's defaults at birth** (reset-on-new =
born from defaults, R6). Nothing writes `origin`; nothing touches existing
columns. **Accept:** boot the migration twice (idempotent); API round-trip
test for both objects. **Commit:** `Build: menus wave M2 — schema: entries.
page_settings + users.page_defaults (R6; boot-idempotent)`

### M3 · THE PAGE DRAWER (page surfaces)
Cascade PAGE face: keep `＋ New page →` (door-dressed). Add **PAGE SETUP**
zone wired to M2: Margins (three-choice; applies live to the paper's
padding via CSS vars — the paper is the preview), Line spacing (applies
live to prose line-height), Page numbers On/Off + Placement (stored;
sheet-furniture for export per F6 — the screen page stays continuous),
Headers / Footers On/Off + single-line text each (stored, export-facing).
Bottom of the drawer: **"Set as my default page settings"** → writes
`users.page_defaults` from the current page's settings, quiet confirm
toast in the lexicon voice. Existing PageFace + PlacesPanel stay mounted
below (M7 re-dresses Places). **Accept:** settings persist across reload;
new page births with defaults; margins/spacing visibly live; probe still
green. **Commit:** `Build: menus wave M3 — the Page drawer: PAGE SETUP
wired (R6), defaults control`

### M4 · THE FREE WRITE DESK
- **STYLING zone** (R1): B · I · **U** buttons; bracket semantics (two-press
  open/close at the caret) extended to underline with the `__word__`
  convention (F2); dimmed-syntax renders it as craft; export strips.
- **THE TYPEWRITER MENU** (R3): the foot's Typewriter button opens ONE
  pop-out (a raised element beside/above the foot, drawer-anchored):
  **Forward Lock** — on/off + window unit (Words | Sentences) + count,
  driving the existing forward-lock boundary (rename the setting keys/
  labels from "Forward Momentum" per F1); **Line Fade** — on/off + lines
  shown + writing line (Top | Center | Bottom → caret anchor + fade
  depth; the gear's old Fade depth is REMOVED, folded here per O-FW2);
  **Page Scroll** toggle rides. Settings persist (existing settings
  store). Adjustments disclose in place; G4 holds.
- **THE FOOT** (R5/R12): goal block + exactly **Typewriter · Progress ·
  Full Screen**. **Progress menu**: Show On/Off · Unit (Lines/Words/Time)
  · Target · Style (Bar | Rhizome) · Timer — absorbing the gear's
  Progress rows AND the whole Instruments panel. **Full Screen**: OS
  fullscreen via the existing toggle relocated; an X, top-right, hidden
  until cursor movement then fading in, exits; Escape exits; the growing
  flow effect still runs unless off (R5 verbatim). **Theme leaves the
  foot** (the rail's theme category already stands). **The Instruments
  panel is retired** — every option re-homed above, component removed.
- INK: **not mounted** (R2 deferral) — no placeholder, nothing grayed.
**Accept:** probe green; U round-trips through storage as plain text;
Typewriter settings drive the engine on a prose page; Instruments panel
gone from the DOM; screenshots. **Commit:** `Build: menus wave M4 — Free
Write desk (STYLING+U, the Typewriter menu, three-instrument foot,
Instruments retired)`

### M5 · THE DRAFT DESK
FORMAT zone, full R4 roster: Heading · Bulleted list · Block quote
(existing conventions) · **Indent** (line-leading tab character, rendered
as indent, dimmed/stripped like all syntax — F3) · **Alignment** (Left |
Center | Right as a three-choice; stored as line-prefix directives, F3's
concretization: line starts `>< ` = center, `>> ` = right, unmarked =
left; dimmed-syntax renders the markers low-ink; export strips; one word
from Nick re-tokens these) · ¶ Spacing (existing). STYLING carries B·I·U
as in M4. **STRUCTURE**: one row, `Convert to Screenplay…` → the existing
`structureConvert` confirm dialog (destination named; DR3 default — the
Prose|Screenplay tablist retires from the panel). No Ink (R4).
**Accept:** each format op round-trips as plain text; conversion still
works end-to-end via the row; probe green; screenshots.
**Commit:** `Build: menus wave M5 — Draft desk (R4 roster, F3 directives,
Convert row per DR3)`

### M6 · THE BOARD'S CHROME (R13)
On board surfaces: **the Tools sliver does not mount** (R13.iv — absence,
not a hidden mount). Cascade PAGE face gains board behavior: `＋ New page`
→ births a page AND derives it onto this board (reuse the existing
port-to-card pipeline); **"Place page on board"** → in-place toggle list:
recent pages (~30), scrollable, sort chips **Date · Drawer · A–Z (first
letter of title)**; choosing one derives it onto the board. Cascade PLAN
face: `＋ New card` (existing free-card creation) and **Fit to content**
(existing control, re-homed from wherever it lives; BD1's
hardware-reserved note travels as a code comment). Import File does NOT
render (§0). **CA3 default:** every card wears its slim always-present
edge grip; the grip's tray carries `Open the page →` for derived cards;
**BD2 default:** no Delete row on derived cards, anywhere.
**Accept:** on a board — no sliver in the DOM; New-page lands a card;
Place-page lists, sorts all three ways, and lands a card; Plan face holds
exactly its two acts; probe (cascade flush) green; screenshots.
**Commit:** `Build: menus wave M6 — board chrome (R13: Page/Plan faces,
Place-page list, no sliver; CA3/BD2 defaults)`

### M7 · THE PLACES REDESIGN (dress + language only — PP3 is law)
In PlacesPanel: promote the aria to the eye — visible engraved headings
**"This page lives in…"** (the Home radiogroup) and **"Pinned to
boards…"** (the Boards group); the CURRENT home row wears distinct dress
(hi text + 1px olive left hairline) so the state speaks first; `＋ New
Drawer` re-worded **"File to a new drawer…"** (the flow itself unchanged).
ALL mechanics untouched to the letter: the two writes, single-select
home, system-board null return, fresh-read, flushNow, and every honest
string from the fix wave stay byte-meaningful; new strings enter the
lexicon. **Accept:** a diff of PlacesPanel shows dress/copy only — zero
handler or write-path changes; screenshots. **Commit:** `Build: menus
wave M7 — Places speaks in verbs (PP1/PP2/PP4; mechanics untouched)`

### M8 · THE SCREENPLAY DESK
On screenplay pages: the sliver holds exactly **one zone** — STRUCTURE:
`Convert to Prose…` (the mirror, same confirm species) — plus the
universal foot (R12: Typewriter · Progress · Full Screen). The Typewriter
menu opens and its settings persist; **the engine's screenplay hook-up is
NOT tonight's** (R12's flagged follow-up brief) — no grayed states, the
menu simply governs what it already governs. **SP3 default:** the strip
stands with every mode quiet-dark (no active hairline; the Publish door
dressed). **Accept:** screenplay page shows the one-zone desk + foot;
strip renders the map; conversion round-trips; probe green; screenshots.
**Commit:** `Build: menus wave M8 — screenplay desk (the null desk +
mirror; SP3 map default)`

### M9 · THE OPENED CARD *(conditional)*
If an opened/expanded card surface exists (search for the card open/modal
component): mount the Tools dock on ITS left edge (`right:100%` child of
the opened card — the card is the paper there), **vertically centered to
the card and free to exceed its height** (R14); contents: STYLING (B·I·U
on the card's text) only — **no foot** (R14), links/tags deferred (§0).
If no such surface exists, SKIP with a one-line report note — do not
invent the surface tonight. **Accept (if built):** dock centered via
layout, no instruments in DOM; screenshots. **Commit:** `Build: menus
wave M9 — opened-card tools (R13.v/R14; styling only)`

### M10 · RETIREMENTS & THE LEXICON SWEEP
Remove the Instruments panel component and any now-orphaned gear rows
(Typewriter/Fade/Progress/Timer rows whose homes moved); confirm Theme's
only home is the rail; delete dead imports; every string added tonight
verified present in the lexicon (all registers that exist), none inline.
**Accept:** grep shows no orphaned components/imports; build green.
**Commit:** `Build: menus wave M10 — retirements + lexicon sweep`

### M11 · THE NIGHT'S PROOF
Full existing test suite (tu2's known flake tolerated per DF1's rules;
any j5 red noted as the known species, not chased tonight). Probe matrix:
prose · draft · screenplay · board, at 1366×768 and 1680×1050, dock
open/closed where it exists — every geometry check green. Screenshot set
for every surface/width into `docs/menus/build-shots/` (committed).
Write **`docs/menus/build-report-2026-08-04.md`** (committed, the last
act): the ticket table (M#, SHA, one-line outcome), probe outputs
verbatim, every deviation/skip/blocker with what was tried, the deferred
list (INK · engine hook-up · Import File · specialty tabs · F10), and
anything red, plainly. **Commit:** `Build: menus wave M11 — proof: suite
+ probe matrix + shots + the night's report`

---

## §3 · MORNING (not CC's — recorded so the night knows its shape)
Fable reviews `menus-build` at dawn (stats-first, targeted diffs, the
shots, the report) → Nick's ten-minute walk on `pnpm dev` → **Nick's
merge word** → CC fast-forwards `main` → **Nick's deploy word** → railway
**from the primary checkout only**, deploy stamp `git <sha> · railway
<deployment-id>` naming every merged ticket. Defects found at dawn are
expected and cheap; "hold the deploy" is a clean outcome — everything is
safe on the branch either way.
