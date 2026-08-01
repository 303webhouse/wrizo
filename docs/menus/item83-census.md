# ITEM 83 — Tool Pop-out Menus · Phase 1 CENSUS (the Two Hands arc)

Menus lane · lands with S0 · 2026-08-01 · read against `main` @ `3dc3d49`
(census performed by direct read of the branch-current files named below;
no browser harness, no build run — this is a paper census of the disk).

**Phase law: inventory only.** Nothing in this document proposes. Every
line is what the disk holds, quoted, with its truth-state named. The
committee pass (Phase 2) argues; this file only sees.

**Truth-states used below:**
- **BUILT** — live on `main`, provenance file named.
- **RATIFIED-UNBUILT** — Nick's word exists (a chamber, a ruling), no code
  yet. Law awaiting a build. Named with its source document.
- **LEGACY** — alive in the codebase for the <1100px / unframed world;
  outside the framed contexts but real.
- **INHERITED-OPEN** — a question this lane now owns, unanswered.

---

## 0 · Boot and provenance

Boot order executed as seeded, disk first: `docs/wrizo-alpha/hd-arc-seed.md`
(founding), `docs/wrizo-alpha/fx18-review-fable.md` (three-regime panel law,
constitutional), `docs/open-threads.md` (live band; item 78 quoted whole in
§8; the S0-push rule and one-checkout law govern this lane's own commits),
`docs/wrizo-alpha/batch-sitting-committee-pass.md` Chamber B (the charter),
`docs/wrizo-alpha/second-sitting-committee-pass.md` Chamber 1 (the ratified
per-mode strips — inherited as law, not input),
`docs/theme-foundations/plateau/plateau-foundations.md` (the olive/orange
laws), `docs/wrizo-alpha/device-sitting-agenda-v3.md` (the sitting gate).

Source files read for the inventory: `components/ModeStrip.tsx`,
`ModeSwitcher.tsx`, `DeskFrame.tsx`, `DeskRail.tsx`, `Sliver.tsx`,
`ModeStage.tsx` (SettingsPanel/ThemePanel), `DeskInstrument.tsx`,
`ChromeControls.tsx`, `Cascade.tsx`, `CascadePanels.tsx`, `Tutor.tsx`,
`ScriptEditor.tsx`, `BoardEditor.tsx`, `BeginningsRow.tsx`,
`PageFileMenu.tsx`, `pages/PageEditor.tsx`, `store/deskLexicon.ts`.

---

## 1 · The shared substrate every context mounts

**The frame.** `DeskFrame.tsx` (≥1100px gate) lays five tracks: wayfinding ·
strip · stage · corkboard · meter (meter ALWAYS empty/reserved — FX1 S5
killed "the dead bar" and nothing passes the `meter` prop; the progress
instrument's true home is the rhizome lane under the page, §1-foot). Prose
stage is `min(760px, 60ch)`; screenplay keeps its own courier measure; board
carries `.desk-frame-stage--board`.

**The two hands, as already built on the Page.** The **Sliver**
(`Sliver.tsx`) is the left hand: a slim grip riding the paper's left edge,
absolutely positioned inside the stage — *structurally cannot move the
paper's rect regardless of open/closed/dissolved state.* Toggle: grip click
or `Ctrl/Cmd+/` (`SLIVER_SHORTCUT_LABEL`). Grip aria: "Open hand tools" /
"Close hand tools". The grip never dissolves; the panel carries
`chrome-fade desk-dissolve` and rides the one vanishing engine. The
**Tutor** (`Tutor.tsx`) is the right hand, mirrored — two separate overlay
anchors (grip clamp-box vs. panel pinned to the stage's right edge; one
anchor empirically cannot serve both). Grip aria: "Open the Tutor" / "Close
the Tutor"; dock button "Close, keep dock" / "Reopen"; `DOCK_FLOOR_PX = 120`.

**The three-regime law (FX18 — constitutional for any panel geometry this
lane ever draws).** Panel width is set by a measure-effect from the TRUE
geometric margin — measured, never assumed; the +frame-gap overshoot (the
28px dip) is named and excluded. Regime 2 carries a downward discontinuity
at 280, which is why CSS clamp could not express it. Below the usable-panel
floor (FX18 S2) an open panel overlays the paper at natural open-width —
the *documented* narrow-screen degradation, deliberate, not a bug. The
board rule stays pure CSS (no fallback flash); the screenplay half-measure
companion prevents an 8.5in mis-measure. `fx18.mjs` asserts the regimes BY
NAME from measured margins, surface-dependent. Any geometry Phase 3 draws
is born inside this law.

**The cascade** (`Cascade.tsx` / `CascadePanels.tsx`) fills the strip
track: eight categories — `journal | page | plan | drawers | shelf | trash
| settings | theme` — opening layer-2 reach panels and layer-3 surveys
(stage overlays, paper-rect-immune). The strip JOINED the ambient dissolve
at FX10 S2 (amending CD2 S1's never-dissolving letter); layers 2–3 dissolve
by explicit state-reset on keydown (the AB3 Drawer's own proven mechanism),
with the dock behavior (panel collapses to width:0, category re-click
undocks). Settings category mounts `SyncIndicator` (speaks ONLY when
offline: "Offline — saved here") and `FullscreenToggle` ("Full screen" /
"Exit full screen").

**The foot (shared furniture on every framed writing surface — Sliver's
own).** The goal block: session timer numeral anchored to the FIRST
KEYSTROKE (not mount), the progress hairline (never labels itself with a
fraction), inline target edit — "Goal: N lines" / "Set a goal" / "Set" /
"Clear". The instruments row: `TypewriterToggle` (where the surface runs
it), the Writing-settings gear → `SettingsPanel` (**Progress:**
Words/Time/Off, plus Project only when the page's project has milestones —
silent degrade, no greyed states, M1 canon Q3; **Progress style:**
Bar|Rhizome, offered only framed+Progress:Words; **Fade depth**; **Timer**;
**Typewriter**) + `ThemePanel`; and the Instruments panel (**Show** On/Off ·
**Unit** Lines/Words/Time · target value — a second surface onto the SAME
goal, not an independent value). Under the page, `DeskInstrument.tsx` owns
the one instrument lane: RhizomeField or ProgressBar by the Bar|Rhizome
choice, plus the evental goal flare (carries no text, no number, outlives
nothing).

**The vanish engine.** One engine: `chrome-fade desk-dissolve` +
`data-chrome-receded`, keystroke recedes, approach summons. Grips persist
(the Sliver's, the Tutor's); panels and tracks dissolve. RATIFIED-UNBUILT
above it: Chamber 2's **A19 Staged Vanish Law** (PRESENT → GHOST → GONE,
line-based threshold ~8 fresh line-equivalents, drafted for ratification as
ticket V1) — the disk today has the two-state engine, not the three.

---

## 2 · Context: Page (prose) · Free Write (mode key `journal`, string "Free Write")

**BUILT — the mode strip** (`ModeStrip.tsx`, above the stage, ratified
exact strings, title case): **Free Write · Draft · Revise · Workshop ·
Publish.** Free Write and Draft are the only live EditorModes; Revise and
Workshop are deferred tabs flashing "`<label>` — coming soon"; Publish is
an ACTION (opens the Publish dialog), rendered as a tab. Roles: tablist
"Writing mode".

**BUILT — the Sliver's Free Write section** (`Sliver.tsx` +
`pages/PageEditor.tsx`'s `sliverContent`):
- **"Ink"** (journal-furniture pages only — `origin` null/`'journal'`): pen
  ink swatches ("Ink <color>"), the nib stub "nib · fine ▾" ("Nib styles —
  coming soon").
- **"Ink tool"** placeholder — unconditional, present-but-disabled,
  disclosed by its own tooltip: "Ink — coming soon outside the Journal"
  (FX7 S2's reasoned inert placeholder; the underlying draw-ink feature is
  neutralized on the Page by I0 pen discipline).
- **"Format"**: Bold, Italic — two-press BRACKET semantics (a forward-only
  surface can't wrap a selection; the button opens a mark, the second press
  closes it). Unconditional on origin (FX1 S3: Free Write the POSTURE, not
  the Journal the PLACE).
- **"Forward lock"** toggle (`railForwardLock` — note: Chamber 1's ruled
  RENAME of this label into the Typewriter cluster is not yet performed;
  see §9.7).
- **Capture items** (journal furniture only): "Spark deck" · "Fragments" ·
  "Send → Drawer" (`CAPTURE_ITEMS`).
- The shared foot (§1).

**BUILT — the rest of the room:** the cascade strip (§1); the Tutor (§2-C
below applies to every prose mode); `BeginningsRow` on the empty page
(`surface="page"`, Esc dismisses, container is pointer-events:none — the
caret is live underneath from the first frame); the crumb ("Location":
drawer / binder / page title, plus the "Imported" tag); the Publish dialog
(from the strip): download row — This page (.md) · This page (.txt) ·
Binder · Everything — then **"Copy My Words"** (conventions stripped to
honest plain text) and **"Copy Formatted"** (as stored, markdown travels),
the still-true coming-soon line, Close. Copy-out is Publish-only — law.

**BUILT — the Counsel side (all prose modes).** The Tutor panel: "The
Tutor"; conversation first ("Talk it through", composer "Ask a question…" /
"Send", the exchange reads as the main event); lenses as sections AROUND
the conversation — **"Consistency"** ("No repeated or near-duplicate names
found yet."), **"Structure"** (Thread language; the beats sentence is
dead, CD4), **"Fragments"** ("Recency and shared tags only — nothing
else."); **"The book's Bible"** LAST (the shelf at the back): "Note a fact
to remember…" / Add / Edit / Delete / Save / Cancel, `FACT_TEXT_CAP`,
assembled at send time only. Disclosure gate before the first ask
(`tutorDisclosureBodyV3` — Bible-aware), the cost meter lines ("This turn,
est.:" / "This session, est.:"). Nudges ASLEEP whole (FX12; the "Waiting
for you" strings sleep in the lexicon; return gate = ledger item 64,
content law before they wake). A12–A15 enforced architecturally: the
component receives `entry`/`project`/`pageText` and nothing that could
route a byte onto a writing surface.

**LEGACY (<1100px, unframed):** `ModeSwitcher.tsx` (three tabs "Free
write"/"Draft"/"Format" + trailing action tabs incl. Publish), the
mode-rail/mode-bar pen and format toolbars, the AI-sealed right rail
("AI sealed in <journal>") and collapsed "AI assist" drawer, "Copy <page>
text", `DeskRail` global nav (Catch "＋" with the bare-`n` shortcut,
the way-back chip "Return to: <preview>", Journal/Shelf/Drawers +
Library greyed). All byte-preserved below the gate; none of it mounts
framed.

---

## 3 · Context: Page (prose) · Draft (mode key `drafting`, string "Draft")

**BUILT — the Sliver's Draft section:** **"Format"**: **B** Bold ·
**I** Italic · **H** Heading · **¶** Spacing (`store/draftFormat.ts`;
line-rewrite semantics allowed here because Draft edits freely).
**"Structure"** tablist: **Prose | Screenplay** (`store/structureConvert.ts`
— mechanical, confirmed AI-free by grep at build), with the
Convert-to-Screenplay confirmation dialog. The shared foot (§1). Strip,
cascade, Tutor, crumb, Publish — as §2.

**RATIFIED-UNBUILT (Chamber 1, second sitting — law inherited whole):**
strikethrough (`~~`) joins the frozen markdown set — a plain-text-honest
amendment **requiring Nick's word by name** (the freeze was his ruling).
The em dash already rides (built).

---

## 4 · Context: Page (prose) · Revise

**BUILT:** the tab, deferred — flashes "Revise — coming soon." Nothing
else. There is no Revise strip, no Revise posture, no Revise code path.

**RATIFIED-UNBUILT (Chamber 1 — the whole context):** typography lands
here as PAGE-LEVEL presentation — font choice and size as the whole page's
dress; alignment/indentation deferred until a real need names itself.
**Custom font upload wakes here** from the parked user-authored-identity
cluster: progressive disclosure, *sought out inside Revise's type
controls, never offered.* The chamber's push-back of record, standing for
Nick's word: AGAINST span-level typography (`entry.text` cannot carry
font/size spans without a rich-text format — a schema-class decision
wearing a toolbar button's clothes; the iA lineage: one page, one voice).
An overrule reopens it as schema-flagged design, not a strip tweak.

**Census note:** `device-sitting-agenda-v3.md` Part 1 instructs walking
"Draft, then Revise — each mode gives what it promised." The disk's Revise
promises only a coming-soon flash. Whatever the sitting log says about
this divergence outranks this note.

---

## 5 · Context: Screenplay page

**BUILT — the strip:** `ModeStrip` with `freeWriteEnabled=false` — all
five strings shown, Draft the only live posture ("Draft law only").

**BUILT — the element engine (no styling toolbar, EVER — anti-Canva;
format is semantic, driven entirely by element type):** Enter advances by
`ENTER_MAP`; Tab by `TAB_MAP`; Shift+Tab cycles backward; **Ctrl/Cmd+1–8**
retypes by `TYPE_CYCLE`; autocomplete listbox; auto-CONT'D; scene
promotion. The Clock (SC2): derived pagination, 54-line body — an
instrument of the surface, not a control.

**BUILT — the Sliver on script** (S7 mirror, verbatim wiring):
`{ kind: 'draft', structure: 'screenplay', onSwitchStructure }` — the
tools section holds EXACTLY the **"Structure"** tablist (Prose |
Screenplay, i.e. convert back to prose, with its own confirm dialog). No
format actions — no B/I/H/¶ on script, by construction. The shared foot
(§1) rides; **the typewriter does not run on screenplay** (SC1 S3,
amended: the surface sets `data-typewriter="false"`, pending Nick's own
revision of typewriter mode).

**BUILT — the room's edges:** crumb; the binder-view toggle
(`sprint-toggle` tablist); **"Copy script text"** ("Copy the script's
plain text"); the Publish dialog; the Convert-to-Prose dialog. The Tutor
mounts with `pageKind="screenplay"` — same lens roster as prose today.

**RATIFIED-UNBUILT (Chamber B's Script row):** script-specific counsel
lenses — continuity, name-consistency ("which his own embedded testing
asked for by name"); element cycling / scene navigation as DESK-side
controls (today they are keyboard-only). **Seam law from the founding
seed: the screenplay surface is the SC arc's lane (item 62), not this
lane's** — this census records; the SC seam routes through Nick.

---

## 6 · Context: Board

**BUILT — the mode strip** (`board-mode-strip`, tablist "Board mode";
roles absent on system boards): **Open | Storyboard | Outline** (BM1),
plus the **Page door** ("Page →" — a DOOR, rendered beside the modes
under BM1's own law) and the telos line **"The plan serves the page."**
(non-system boards). System boards (Journal / Trash / Shelf) pin to Open
and carry their own home labels ("The Journal Board — has no drawer
home", etc.).

**BUILT — the Sliver's board section** (absent-not-disabled on system
boards — the controls are absences in the DOM, not inert clicks):
**"Add card"** · **"New page card"** (a real page, created AND pinned in
one act — FX6's board-side door) · **"Existing page…"** (pins an existing
page — membership, never filing) · **"From a deck…"** (DeckWizard
pop-out) · **"Show connections"** toggle (the connections footer,
per-board). The shared foot (§1). The Connect toggle RETIRED at FX4 S6 —
replaced by the handle-drag thread gesture.

**BUILT — the selection-gated action row** (`board-action-row`):
**"Edit copy"** (text card → the popup) · **"Restore"** (trashed page
card — a plain button, the FX5 precedent). Delete on a derived card is
INERT-whole, the button visibly present (B1 S3's ruled shape). Keyboard:
Esc deselects (the popup owns Esc while open); Delete/Backspace removes a
selected connection.

**BUILT — on the card, in place:** the pin grab ("Drag to connect" — the
thread gesture: double-click the selected card's resize handle, drag,
release inside a target); the layer control ("Bring to front" / "Send to
back"); the connections footer lines ("— thread: <label>", hidden whole
when the board's footer toggle is off); "From a page" badge on ported
cards.

**BUILT — beginnings:** empty non-system board renders `BeginningsRow`
(`surface="board"` — no Esc: it IS the empty canvas); STORYBOARD/OUTLINE
render it as `surface="projection"`. Door keys available to boards:
`newCard · newPageCard · loadDeck · connectPage · newLane`. Empty-canvas
string: "Nothing here yet — Add card, or New page card, from the tools."
Chamber B rules these doors live PERMANENTLY in the Board's Desk side
once the board has furniture — RATIFIED-SUGGESTED, unbuilt (today the
row unmounts the instant the board isn't empty).

**BUILT — the Counsel grip on boards:** the Tutor mounts; per FX18 it
overlays at natural width (the board rule, pure CSS). **The content law
stands: board counsel is DEFERRED to a ratified disclosure-v4 sentence —
no board text rides to a model until Nick ratifies that sentence.**
Programmatic board counsel (the Map: cards linked to no page, unpinned
pages — LISTED, never counted; empty-lane notes; a connections view) is
RATIFIED-SUGGESTED, unbuilt.

**INHERITED-OPEN:** item 78 — fit-to-content, §8.

---

## 7 · Context: Card (the popup — FX4 S5)

**BUILT — `BoardCardPopup`** over a blurred board (reduced-motion
honored; fixed overlay; focus-trapped; Esc closes): eyebrow **"Card"**;
tools **Bold · Italic**; the contenteditable text box; foot: **"Close"**
(btn-brass — "Done" retired whole at CD4.1; the close control is a door
word, not a completion word). Double-click opens a TEXT card straight
into the popup (Open mode only); a PAGE card's double-click travels to
its page instead.

**BUILT — absences, confirmed by grep at `3dc3d49`:** no rename field
(the first line IS the title — Chamber 3's ratified model), no card
colors (zero hits), no Duplicate, no priorities/statuses/due-anything
(Chamber 3's trims hold in code), no links UI inside the popup (threads
live on the board card), no per-card counsel of any kind.

**RATIFIED-SUGGESTED, unbuilt (Chamber B's Card row, tabled for Nick —
NOT final law):** Desk as the popup's LEFT EDGE — rename (the Naming
arc's territory, seam §10), color (in TENSION with Chamber 3's trim,
§9.3), links/the Thread made visible (linked pages listed, each a jump,
link/unlink), send to trash. Counsel as the RIGHT EDGE, programmatic
only in v1 — where this card lives, its siblings, its linked pages.
Proportionate mounting is sustained opposition-law: *the popup becomes
the card's desk* — never two full-height drawers on a card.

---

## 8 · Item 78 — inherited whole (INHERITED-OPEN)

Per the item-83 seed, the fit-to-content placement question is now this
lane's. The ledger's preserved mechanism stands untouched and is not
re-argued here: transient `viewScale`, `pageWidthPx = base × viewScale`,
fit factor `min(1, availClientH / ((maxBottom + 0.08) × base), clientW /
(maxRight × base))`, never above 1; NO CSS transform (pointer-coord
desync — FX17 S1's own bug class); NO touching `canvasOverrideW` (a
persisted document property — *a limit stops; it never relocates*).

**The open decision, verbatim from the ledger, for Nick's hardware — not
pre-empted here:** WHERE the control lives. `board-action-row` is
selection-gated and cannot host an always-available view control.
`board-mode-strip` is barred by BM1 — *"doors are doors, modes are
modes"* and a view control is neither; placing it there spends a ratified
law. The alternative named was the sliver's instrument foot (FX3 S5's
home for instruments), a larger change than the minimal reading implies.
This lane carries the question INTO the two-hands grammar at Phase 2; the
answer waits for the committee and the sitting.

---

## 9 · Divergences and tensions — named honestly, none resolved here

1. **Revise:** the seed's matrix includes it; the disk defers it
   (coming-soon tab, zero code); the sitting agenda walks it. Three
   truths on the record; the sitting log outranks.
2. **Ink/Image:** a full surface in the HD charter (Chamber B, hd-arc-
   seed), absent from this lane's six-context matrix. Recorded as
   remaining with the arc, outside this lane — not silently dropped.
3. **Card color:** Chamber B's table suggests it; Chamber 3's ratified
   trims oppose it ("no card colors … until a real writing need names
   it"). Both are on the record; Nick's ratification sheet decides.
4. **Card rename:** Chamber B's Card Desk names it; the Naming arc (SV4)
   owns editable names propagating by reference. The founding seed's own
   law: rule the seam explicitly with Nick, never two arcs building it.
5. **Progress Bar placement:** the July-17 note and Chamber 1 ruled a
   three-way preference (in-strip / disabled / docked at the foot); M4
   then ruled the bar's framed home is the ONE instrument lane under the
   page (bar|rhizome, two styles of one instrument). The three-way and
   the one-lane law must be reconciled at committee — both are Nick's
   words.
6. **TS1 overlap:** TS1 (strips + renames + strikethrough + Progress Bar
   placements + page-level type + font upload) is held for revisit and
   is substantially the Page's Desk side. Sequencing TS1 vs. HD build
   tickets is Nick's call at Phase 4; the census only notes the overlap.
7. **The Typewriter cluster as ruled vs. as built:** Chamber 1 ruled the
   Typewriter icon opens **Forward Momentum / Text Fade / Page Scroll**
   toggles, retiring "Controls" and "Forward lock" as labels. The disk
   today: "Forward lock" still labels the Free Write toggle; the
   TypewriterToggle sits in the foot; Fade depth lives in the gear. The
   ruled three-toggle cluster is not yet assembled as ruled —
   RATIFIED-UNBUILT delta, squarely inside this arc's Page Desk.
8. **A19 (staged vanish):** drafted for ratification (V1), unbuilt; the
   disk runs the two-state engine. Any grammar this lane writes must
   name which engine it assumes.

---

## 10 · Seams with other lanes (route through Nick and Fable's desk)

**Tutor lane (item 84, reserved):** inherits this lane's shared menu
grammar; divergences go to Nick, never fork silently. **SC arc (62):**
the screenplay surface is its lane; §5's rows are census, not claims.
**Naming arc (SV4):** card/header rename. **FX17-S4 → item 78:** now
here. **TS1:** §9.6. **Board Counsel:** gated on disclosure-v4, Nick's
sentence.

---

## 11 · Questions carried to the committee (questions, not proposals)

Where does the item-78 view control live inside the two-hands grammar?
Where do the ruled-but-unbuilt Chamber 1 deltas (strikethrough, Revise
typography, the Typewriter cluster's assembly) mount — and does Publish,
an action, keep its strip tab once the hands exist? When do the Card
popup's two edges appear — always, or on demand? What does a Board's
Counsel offer before disclosure-v4 (the programmatic set only)? May a
surface have a Desk side with no Counsel side? Does the cascade's
state-reset dissolve fold into the shared grammar as a named species, or
stay its own lawful mechanism? And the founding seed's own standing
question, still Nick's: the Desk-side / Counsel-side names themselves.

— the menus lane, opening the Two Hands arc · census closed at `3dc3d49`
