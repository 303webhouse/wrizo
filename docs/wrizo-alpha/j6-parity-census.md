# J6 S3 — the parity census

**What this is.** Every capability `pages/JournalEntry.tsx` (1,289 lines)
provides that `pages/PageEditor.tsx` (734 lines, plus its `BoardEditor.tsx`/
`ScriptEditor.tsx` delegates) does not, and vice versa — read from the code
itself, not from the brief's own summary. The brief's known-starting-set is a
floor: every item on it is verified below, several are corrected or narrowed
against what the code actually does, and the list is extended with items the
brief didn't name. **No code changed to produce this document.** This is
what J7 — the eventual "should `JournalEntry.tsx` exist at all" ticket —
gets briefed from.

**Method.** Both files read in full, plus every hook/component they each
pull in that the other doesn't (`ForwardOnlyEditor.tsx`, `ModeStage.tsx`,
`WritingIncentives.tsx`, `useChromeDissolve.ts`, `useTypewriterFade.ts`,
`store/textUndo.ts`, `store/ink.ts`, `store/milestones.ts`, `ModeStrip.tsx`).
Every claim below was traced to an actual line, not inferred from a
docstring — several places where the two surfaces LOOK identical at a
glance turned out to differ in a real, user-visible way once the shared
helper's own call-site arguments were compared (the undo story and the
Progress-metric story below are the two biggest surprises).

---

## 1. What JournalEntry.tsx has that PageEditor.tsx does not

### 1.1 The ink layer — strokes, eraser, pen-only capture
**What it is:** a stylus-only (pen `pointerType` only; palm/finger/mouse
fall through untouched) canvas layer over the sheet — committed + active
canvases, hardware-eraser-tip detection (`buttons & 32`), an eraser-ring
hover preview, OS-handwriting suppression (blur + `contenteditable=false`
for the stroke's duration, J0/I0's own hardening), and a thumbnail renderer
(`store/ink.ts`) reused by `Spread.tsx`'s grid.
**Where it lives:** `JournalEntry.tsx` lines ~293-479 (the whole
pointer-event effect), `entry.strokes: Stroke[]`, `store/ink.ts`
(`inkColor`, `renderStroke`, `ERASER_WIDTH`, `renderThumbnail`).
**Equivalent on PageEditor?** None. No ink import anywhere in
`PageEditor.tsx`, `BoardEditor.tsx`, or `ScriptEditor.tsx`.
**Recommendation: needs its own ticket** (matches the brief's own
non-goal verbatim). This is a real feature investment — a page-kind home,
a DeskFrame anchor, and a storage-shape decision (does every `pageType`
get ink, or only some?) — not a mechanical port.

### 1.2 The sprint/quick-project routing machinery
**What it is:** "Send this page to…" (`sendToProject` — appends the
entry's text into a project's `sprintText` via `setProjectSprintText`,
stamps a `routedProjectIds` marker so a second send to the same project is
flagged) and "Start something new" (`promoteToNew` —
`createQuickSprintProject`, promotes a loose capture into its own project).
**Where it lives:** `JournalEntry.tsx` lines ~707-720, `store/persistence.ts`'s
`setProjectSprintText`/`createQuickSprintProject`.
**Equivalent on PageEditor?** No — a `PageEditor.tsx` page is already
either filed into a specific project or sitting loose; there is no
"scrap I haven't decided where it belongs yet" state on that surface to
route out of.
**Recommendation: retire (for the flip), not port.** The Places panel
(AB3) already generalizes "send this loose entry somewhere" for every
`PageEditor.tsx` page — the same door `AddToSheet` retired in favor of on
that surface (§1.4 below). Porting a second, parallel "route to project"
mechanism instead of extending Places would recreate the exact
two-doors-to-one-destination problem AB3 S4 already closed once.

### 1.3 Notebook (loose-page) prev/next navigation
**What it is:** the `‹`/`›` paging chips (both framed and legacy headers)
plus the ArrowLeft/ArrowRight keyboard walk, all driven by
`getNotebookPages()`'s own notebook order — loose pages only.
**Where it lives:** `JournalEntry.tsx` lines ~255-273 (keyboard),
~1139-1156 and ~1222-1239 (chips, now both routed through `routeForEntry`
per this ticket's own S2).
**Equivalent on PageEditor?** No paging concept at all — the closest
relative is the Pages/Plan toggle (§2.6), a different axis (view mode
within one project, not walking a sequence of independent pages).
**Recommendation: port-later.** Cheap and mechanical, but only meaningful
for loose pages, which never open in `PageEditor.tsx` today — worth doing
alongside whatever eventually lets a loose page live there, not before.

### 1.4 AddToSheet ("Add to…" — Move/Copy/Link)
**What it is:** a legacy multi-destination dialog (`components/AddToSheet.tsx`)
offering Move/Copy/Link to a chapter, board, or new project — loose pages
only.
**Where it lives:** `JournalEntry.tsx`'s `addOpen` state + `modalsAndToast`.
**Equivalent on PageEditor?** `PageEditor.tsx`'s own header comment says
it plainly: *"Move/Copy (`addOpen`, AddToSheet) RETIRES: superseded by the
Places panel."* Both surfaces mount the same `useCascade(...)` hook and
get the same Places panel through the Page Face — so `JournalEntry.tsx`
today has **two** doors to the same kind of destination (its own legacy
AddToSheet, plus the shared Places panel), where `PageEditor.tsx` was
already cut down to one.
**Recommendation: retire.** Not a capability to port — a debt to close.
Dropping Journal's own `AddToSheet` (matching what PageEditor already did)
removes duplication without losing anything Places doesn't already cover.

### 1.5 One-level undo (↺), covering a text run OR an ink stroke
**What it is:** `lastActionRef` remembers exactly one prior action (a
typed run's pre-run text, or the last committed stroke) and reverts it via
an on-screen ↺ button. No keyboard shortcut. No redo.
**Where it lives:** `JournalEntry.tsx`'s `undo()` (lines ~754-780) and the
`ink-undo` button.
**Equivalent on PageEditor?** Nuanced — see §2.4, this is genuinely
three-way, not two-way. PageEditor's **Draft** mode has a full multi-step
Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y stack (`store/textUndo.ts`, FX6). PageEditor's
**Free Write** mode — the posture that actually corresponds to what
Journal is doing — has **no undo at all**, by the forward-only "no
take-backs" design (`ForwardOnlyEditor.tsx`'s own undo wiring is gated
`if (drafting)`, never reached in Free Write). So Journal's one-level,
button-only undo is actually **more forgiving** than PageEditor's own
nominally-equivalent posture, not less.
**Recommendation: needs its own ticket.** Whether Free Write should gain
Journal's one quiet undo, whether Journal should gain a keyboard binding,
or whether the asymmetry is intentional (Journal is capture, forgiveness
matters more there) is a product call, not something a routing ticket
should decide by accident while porting.

---

## 2. What PageEditor.tsx has that JournalEntry.tsx does not

### 2.1 The mode system (Free Write / Draft / Format) + ForwardOnlyEditor
**What it is:** a real, switchable posture (`ModeStrip`, `EditorMode`),
with Draft mode using the shared `ForwardOnlyEditor.tsx` component in
free-edit posture and Free Write using the same component in forward-only
posture. `JournalEntry.tsx` is ALWAYS forward-only, via its **own**,
independently hand-rolled `contenteditable` (word-granular backspace,
`onBeforeInput`/`onInput`/`onKeyDown` wiring, its own Voice Wall paste
guard) — not `ForwardOnlyEditor.tsx` at all. Two parallel implementations
of "forward-only text with a permanence rail," maintained separately.
**Where it lives:** `PageEditor.tsx`'s `mode`/`switchMode`, `ForwardOnlyEditor.tsx`
(717 lines).
**Equivalent on JournalEntry?** No — this IS the question the ticket's
authority (item 41 finding 1) actually asked: should `JournalEntry.tsx`
exist as its own writing surface, or should it be Free Write on the one
shared editor.
**Recommendation: needs its own ticket — this is the flip itself.** Not a
portable feature; it's J7's whole job. Collapsing the two forward-only
implementations into one is the single biggest cost item in this census
(see the closing section).

### 2.2 Draft formatting (Bold/Italic/Heading/Spacing rail)
**What it is:** `applyRailFormat`, operating on `entry.text` via markdown
conventions (`store/draftFormat.ts`), with a real undo-stack integration.
**Where it lives:** `PageEditor.tsx` lines ~374-392.
**Equivalent on JournalEntry?** None — Journal has no Draft mode to host
it in.
**Recommendation: port-later**, bundled with §2.1 — meaningless on its
own without Draft mode existing on Journal's surface first.

### 2.3 Free Write's own Bold/Italic (two-press bracket, FX7 S2)
**What it is:** `applyFreeWriteFormat`, inserting `FORMAT_MARK` via
`ForwardOnlyEditor`'s own `insertMarkerRef` escape hatch — the exact path
a real keystroke takes, so forward-lock stays honest.
**Where it lives:** `PageEditor.tsx` lines ~433-440, wired into the Free
Write sliver's `format` field.
**Equivalent on JournalEntry?** None. Journal's own sliver content is
`{ kind: 'freewrite', captureItems: CAPTURE_ITEMS }` only — no `format`
field at all (see §3.2 below for the fuller asymmetry this is one piece
of).
**Recommendation: port-later**, same bundle as §2.1/2.2 — Journal's text
posture would need to route through `ForwardOnlyEditor` first for this to
attach to anything.

### 2.4 Multi-step Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y undo+redo (Draft mode only)
Covered under §1.5 as the three-way undo finding. Recorded here too so
neither direction's own listing undersells it: this is **PageEditor's
Draft mode exclusively** — not shared with its own Free Write mode.

### 2.5 The first-run gate (HB1)
**What it is:** `FirstRunVeil`/`FirstRunGateBanner`/`UnlockCeremony`,
`useMonotonicWordCount`, the 100-word threshold, `firstRunGateRequested`
captured once from `location.state.firstRunGate`.
**Where it lives:** `PageEditor.tsx` lines ~140-165, 656-657;
`components/FirstRunGate.tsx`.
**Equivalent on JournalEntry?** Not applicable, not merely absent —
`Arrival.tsx`'s Write door always calls `createLooseHomePage()` and
navigates to `/page/:id`, so a first-run page structurally can never open
in `JournalEntry.tsx`. TU1's own non-goal ("the Tutor on the threshold")
already established the same posture for a different component.
**Recommendation: retire from consideration — not a gap.** Nothing to
port; the two surfaces simply never compete for this moment.

### 2.6 The Pages/Plan toggle
**What it is:** a tab pair switching between the binder's Page list view
and its Plan/board view — rendered whenever `project` is set.
**Where it lives:** `PageEditor.tsx` lines ~583-588 (framed), ~686-691
(legacy).
**Equivalent on JournalEntry?** None — even though `JournalEntry.tsx`
already computes `homeProject` for exactly this purpose (the Page Face's
home label) whenever a legacy untyped page happens to be filed into a
project (`entry.projectId != null` while `entry.pageType == null` — a
real, reachable state: `JournalEntry.tsx`'s own redirect guard only
bounces on `pageType`, never on `projectId`).
**Recommendation: port-now.** Cheap — `homeProject`/`project` is already
in hand — and it closes an inconsistency reachable TODAY, independent of
any larger flip: a legacy filed-but-untyped page currently has no way to
reach its own project's Plan view without leaving to `ProjectHome`
first.

### 2.7 Progress-metric awareness — words / time / project (milestones), session timer, page-turn readout
**What it is:** three things bundled behind one prop
(`ModeStage.tsx`'s `milestones`, threaded from `projectMilestones(id)`):
(a) `MilestoneBar` when a linked `StoryPlan` exists (Progress:Project,
with graceful fallback to word-progress when the writer picked "project"
but no plan exists yet); (b) a live session-timer readout
(`⏱ {elapsedClock}`) when `settings.timer` is on; (c) a page-turn counter
(`p.{pageNum + 1}`) tied to `ModeStage`'s own pagination. `JournalEntry.tsx`'s
own incentive row is word-count-only and ignores the writer's actual
Progress preference entirely — its `ProgressBar`'s `frac` is always
`useGoalProgress(words, WORD_GOAL)`, regardless of whether
`writingSettings.progress` is `'words'`, `'time'`, or `'project'`.
**Where it lives:** `ModeStage.tsx` lines ~272-276, ~460-489 vs.
`JournalEntry.tsx` lines ~919-940.
**Equivalent on JournalEntry?** Partial — the SAME `ProgressBar`/
`TypewriterToggle`/`AmbientGlow`/`useGoalProgress`/`WORD_GOAL` components
are imported and used directly by `JournalEntry.tsx` (this is genuinely
shared infrastructure, wired twice — see §3.1's correction to the brief's
own framing), but `MilestoneBar`, the timer readout, and the page-turn
readout are not.
**Recommendation: port-later.** Real value once Journal-hosted project
pages want full parity, moderate effort (thread `projectMilestones` +
timer state through), not urgent for a routing ticket.

### 2.8 A real Publish dialog (Copy My Words / Copy Formatted)
**What it is:** `showPublish`/`publishDialog` — a modal with two actions,
`copyText(stripMarkdownConventions(...))` and `copyText(text)` verbatim.
**Where it lives:** `PageEditor.tsx` lines ~533-551, mounted in both the
framed and legacy branches.
**Equivalent on JournalEntry?** Verified absent at **both** widths, not
just framed. `JournalEntry.tsx`'s `ModeStrip` call hardcodes
`mode="journal"` and wires `onPublish={() => setTabPrompt(true)}` — every
non-Free-Write tab, Publish included, just shows the generic "move this to
a Drawer or the Shelf" prompt (same for the legacy `mode-tabs` row, lines
~1257-1269: `Publish` is in the SAME `['Draft', 'Format', 'Workshop',
lex('publish')]` array as the deferred modes, all wired to the identical
`setTabPrompt(true)`). The only copy-out `JournalEntry.tsx` actually has
is a bare "Copy page text" button, and it exists **only** in the legacy
(`!framed`) metadata cluster — a framed Journal entry has no copy
affordance at all.
**Recommendation: port-now.** Cheap — `copyText` is already imported and
the clean text is already in hand (`pageTextRef.current`) — and it closes
a confirmed dead end: today, clicking "Publish" on a Journal entry (at any
width) does the same thing as clicking "Draft." No dependency on the mode
system.

### 2.9 Pagination (page-turn animation + "p.N" readout)
**What it is:** `ModeStage.tsx`'s own page-turn tracking (`pageNum`,
`data-page`, an animation + sound on turn) for a bounded, internally-
scrolling page.
**Where it lives:** `ModeStage.tsx` lines ~162-256, ~431.
**Equivalent on JournalEntry?** Structurally impossible as built — Journal
uses `useWindowScroll: true` specifically because the ink-anchored sheet
must be able to grow past the viewport (FX4 S1's own header comment,
`.entry-full`'s `overflow:hidden` reversion). There's no "page boundary"
to turn at.
**Recommendation: retire from consideration.** Porting this would mean
redesigning Journal's whole scroll model for a feature whose value doesn't
justify that cost. Not recommended.

### 2.10 Board/Script delegates
**What it is:** `PageEditor()`'s own dispatcher hands `pageType:'board'`/
`'script'` entries to `BoardEditor.tsx`/`ScriptEditor.tsx` before either
component's hooks run.
**Where it lives:** `PageEditor.tsx` lines ~726-733.
**Equivalent on JournalEntry?** Not applicable — `JournalEntry.tsx`'s own
redirect guard (`entry.pageType != null`) already sends every typed entry,
board/script included, to `/page/:id` before this question can even arise.
Recorded for completeness only; not a real gap.

---

## 3. Corrections to the brief's own starting list

The brief's known-starting-set named `useChromeDissolve` and
`useTypewriterFade`'s `JOURNAL_HOLD_BAND` as Journal capabilities — reading
both files' actual imports narrows this:

### 3.1 useChromeDissolve / useTypewriterFade are SHARED, not Journal-exclusive
`ModeStage.tsx` (mounted by `PageEditor.tsx`) imports and calls
`useChromeDissolve` itself (line 134) and `useTypewriterFade` itself (line
228, with its own `CONTAINER_HOLD_BAND` constant, `useTypewriterFade.ts`
line 48). Both are genuinely shared engines, each wired independently at
its own call site — not "Journal has it, PageEditor doesn't." The real,
narrower difference: `JournalEntry.tsx` runs `useTypewriterFade` in
**window-scroll mode** (`useWindowScroll: true`, needed because ink
anchors to the sheet's own growing height) with its own tuned
`JOURNAL_HOLD_BAND` (0.60), where `ModeStage.tsx` runs it in **container**
mode (a fixed-height `.mode-scroll` box) with `CONTAINER_HOLD_BAND`
(0.46) — a scroll-model branch plus a tuning difference, not a missing
mechanism. Same correction applies to the unframed incentive row
(`AmbientGlow`/`ProgressBar`/`TypewriterToggle`): `ModeStage.tsx` mounts
the identical trio itself (lines 333, 460-489) — `ab1-shell-inventory.md`
already recorded this exact fact during AB1 ("mounted by ModeStage's
incentive row + `JournalEntry.tsx`"), and this census independently
re-confirms it. What's actually exclusive to each side is narrower and
listed precisely above (§1.5's undo nuance, §2.7's milestone/timer/
page-turn trio) — not the shared engines themselves.

---

## 4. Duplication cost, beyond "missing" capabilities

Two items above are not "X has a capability Y lacks" so much as "the SAME
capability is built twice, independently, and has already drifted":

- **Forward-only text + Voice Wall, twice.** `ForwardOnlyEditor.tsx`
  (generic, used by both PageEditor postures) and `JournalEntry.tsx`'s own
  hand-rolled `contenteditable` wiring (word-granular backspace,
  `beforeinput`/`keydown` handling, its own `notePasteBlocked`/
  `shadowAllows`/`extractIncomingText` calls) both implement "forward-only
  permanence + block foreign paste," maintained as two separate call
  sites into the SAME `store/voiceWall.ts` — but with materially
  different undo behavior (§1.5) as proof the two have already diverged
  in practice, not just in code shape.
- **The routing predicate itself** — this was the SAME kind of
  duplication, now closed by this ticket's own S2 (`routeForEntry`). Left
  here as the model for what "closing a duplication cost" looks like
  versus "porting a capability": S2 was safe to do unilaterally because it
  changed no behavior; none of the items in §1/§2 above are, which is
  exactly why they're recommendations for a FUTURE ticket, not code
  changes in this one.

---

## 5. What the flip would cost, and what has to land first

The routing predicate itself is now one function (S2) — flipping
`routeForEntry` to send every entry through `PageEditor.tsx` is
genuinely a one-line change, exactly as the brief promised. **Retiring
`JournalEntry.tsx` as a file is a much larger and separate question**,
and this census is the evidence for why:

1. **Ink has nowhere to go yet** (§1.1) — its own ticket, its own
   page-kind-home decision, before anything else here can even be
   attempted honestly.
2. **Two independent forward-only implementations would need to become
   one** (§2.1, §4) — the single largest line-count item in either file,
   and the undo asymmetry (§1.5/§2.4) proves the two have already grown
   apart in ways nobody decided on purpose.
3. **Journal's own Free Write posture is, right now, DELIBERATELY
   sparser than PageEditor's Free Write mode** in some ways (no
   forward-lock toggle, no Bold/Italic, no pen-color chooser for text —
   §2.3) and **richer in others** (its own ink pen, §1.1; a forgiving
   one-level undo, §1.5) — flattening these into one posture means
   picking a winner for each, not just merging code.
4. **Two doors already exist where one should** (§1.2 vs. Places, §1.4
   vs. Places) — cheap to retire on their own, but retiring them changes
   what a writer coming from Journal's old muscle memory can reach, so
   they belong in the same conversation as the flip, not decided
   silently inside it.
5. **A handful of items are cheap and independent of the flip entirely**
   (§2.6 Pages/Plan toggle, §2.8 the Publish dialog) — these can land
   **before** any flip decision, as their own small tickets, and would
   make `JournalEntry.tsx` a fairer surface to migrate FROM regardless of
   what J7 eventually decides.

Nothing above is schema work, and nothing above requires a verdict today —
that's the point of writing it down rather than guessing at it, per the
brief's own reasoning for why this ticket doesn't flip the predicate.

— built for J6 — One Paper, 2026-07-21
