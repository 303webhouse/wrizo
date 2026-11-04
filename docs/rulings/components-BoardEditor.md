# Rulings: `apps/desktop/src/components/BoardEditor.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[BoardEditor §n]` points here.

## BoardEditor §1

From `apps/desktop/src/components/BoardEditor.tsx`, line 112 at `fd1f9f1b` (the comment that stays: "MIN_TEXT_H is about one line, persistence.ts's BOARD_LINE_H floor; a page-pin takes an aspect lock on RESIZE only, keyed to its pinned entry's kind (pinAspectFor)").

```ts
// AB4 S4 — a page-pin card resizes freeform on both axes (no aspect lock —
// it's not a drawing; no text-reflow — it's not live prose).
// ⚠ SUPERSEDED IN PART BY ITEM 138 (2026-09-24) — kept as written, marked here
// rather than rewritten, because the sentence was true when it was written and a
// reader tracing the freeform decision should find it. WHAT CHANGED: a page-pin
// DOES now take an aspect lock, on RESIZE only, and the aspect comes from the
// PINNED ENTRY's kind (page → vertical, board → horizontal) rather than from the
// card. The no-text-reflow half stands unchanged. See the `page-pin` branch in
// the resizing handler below, and `pinAspectFor` in store/persistence.ts.
// FX4 S4 — text now resizes freeform on both axes too (height was
// reflow-only before this ticket): MIN_TEXT_H is the same "about one
// line" floor persistence.ts's own BOARD_LINE_H already uses for a fresh
// port's height estimate — a card can never be dragged shorter than that,
// though in practice the reflow-as-minimum effect below usually grows it
// back up to fit real content well before this floor would bite.
```

## BoardEditor §2

From `apps/desktop/src/components/BoardEditor.tsx`, line 141 at `fd1f9f1b` (the comment that stays: "the canvas stops at three page-widths tall, in the board's own units so a window resize never moves the floor; the shared 0.08 margin makes the canvas stop on the frame the card stops").

```ts
// FX17 S3 (SV22) — THE STATED LIMIT. "The canvas extends downward — to a stated
// limit, then a hard stop with no stutter and no rubber-banding." This is that
// limit, and it is named here and in the ledger as the brief requires.
//
// THREE PAGE-WIDTHS TALL. Deliberately expressed in the board's OWN normalized
// coordinate system (every box's x/y/w/h is a fraction of pageWidthPx), not in
// pixels and not in screenfuls, for one concrete reason: a board's own extent
// must not change when the window does. A viewport-relative limit would mean the
// same board could be dragged further on a tall monitor than on a laptop, and a
// window resize would silently move the floor under saved cards. Three is
// generous — a canvas twice as tall as it is wide is already a large board — and
// it is one number, so a future ruling changes one line.
//
// THE BREATHING MARGIN is the same 0.08 the auto-height formula already adds
// below the lowest card. That shared term is what makes the stop exact rather
// than approximate: the drag clamp holds a card's BOTTOM at
// BOARD_MAX_Y - 0.08, at which point the height formula computes exactly
// (BOARD_MAX_Y - 0.08 + 0.08) * pageWidthPx = BOARD_MAX_Y * pageWidthPx. So the
// canvas reaches its limit at precisely the frame the card stops — no dead zone
// travelled before the stop, and nothing left to spring back from.
```

## BoardEditor §3

From `apps/desktop/src/components/BoardEditor.tsx`, line 214 at `fd1f9f1b` (the comment that stays: "a bounded notecard read (title + up to 3 lines, ~160 chars): it trims what the card's face shows, never what is stored").

```ts
// FX5 S3 (b) — shared with BoardPinBox below AND BoardTextBox's own ported-
// card face: a bounded notecard read (title + up to 3 lines, ~160 chars) of
// a longer text — "the Board organizes ideas, it doesn't read pages" (Nick's
// words), never a truncation of what's actually STORED, only of what's
// DISPLAYED on the card's own quiet face.
```

## BoardEditor §4

From `apps/desktop/src/components/BoardEditor.tsx`, line 220 at `fd1f9f1b` (the comment that stays: "a card's face is plain text - the same reader as every other derived title").

```ts
  // item 210: a card's face is plain text - the same reader as every other derived title
```

## BoardEditor §5

From `apps/desktop/src/components/BoardEditor.tsx`, line 227 at `fd1f9f1b` (the comment that stays: "a page-pin reads its entry LIVE each render, deleted-inclusive so a Trash card shows its real title (travel stays live-only); a board-card's drawer line comes from store/pageHome.ts").

```ts
// AB4 S2 — a page-pin card: MEMBERSHIP, not capture. Reads the referenced
// entry LIVE at every render (getJournalEntryIncludingDeleted, the same "no
// cached snapshot" discipline the cascade's own panels use) — so it can
// never go stale, and pin/unpin never touches the referenced entry's own
// record.
// B1 S4 — deliberately the DELETED-INCLUSIVE read (not getJournalEntry):
// the Trash Board pins every soft-deleted page on purpose (S2's own
// reconcile), and this card must show its REAL title/excerpt — "the Trash
// is a place, not a blank" — never the generic "Missing page" a
// deletion-filtered read would report for every single Trash card. Travel
// (BoardEditor's own travelToPin, below) stays on the live-only read, so a
// deleted page can be SEEN here but not travelled into — Restore is the one
// interactive act a Trash card offers, and this is a read-only face.
// PW2 S2 — a board-card's second line names the DRAWER it lives in, the same
// fact the Plan panel's board rows carry, so one board reads the same on both
// of its faces. A board with no drawer says so rather than borrowing a name.
// ITEM 163 — the local copy is GONE, not corrected in place. It returned the
// drawer name bare; the ruled form is "in <drawer>", and the same fact was spelled
// twice more in CascadePanels. All three now call the one reader in
// store/pageHome.ts, so the next change lands once.
```

## BoardEditor §6

From `apps/desktop/src/components/BoardEditor.tsx`, line 273 at `fd1f9f1b` (the comment that stays: "a nested board rides the same page-pin box; its face is the noun `Board` and its drawer, and a doubled edge (::before) shows the kind without spending a colour").

```ts
  // PW2 S2 (item 128) — THE BOARD-CARD. A nested board rides the SAME page-pin
  // box as a page; only its face differs, because the membership is the same
  // relation and there is no second model to learn (125 generalizes unchanged).
  //
  // SHAPE TEACHES THE KIND, and spends no colour doing it: a DOUBLED EDGE — a
  // thing that holds things — drawn as a `::before` offset behind the card
  // (Journey D's `.brdcard`). That keeps the Plateau ember ceiling untouched,
  // and it is the job Pass 5 had routed to item 96 as colour-as-kind-signal;
  // shape does it instead, so a third kind costs no accent.
  //
  // THE BADGE IS THE NOUN (CA1): it reads `Board` — never "From a page", never
  // the pin's own wording — because covering the badge must still leave you
  // knowing what you are holding. Second line names its DRAWER, the same fact
  // a board row's second line carries in the Plan panel, so the two faces of
  // one board agree.
```

## BoardEditor §7

From `apps/desktop/src/components/BoardEditor.tsx`, line 306 at `fd1f9f1b` (the comment that stays: "a read-only face (a double-click opens BoardCardPopup); a ported card (sourceEntryId) shows the bounded excerpt, so its full stored text cannot inflate the reflow floor").

```ts
// FX4 S5 — read-only prose ONLY now: inline contenteditable editing
// RETIRES whole (ab4.mjs's own inline-editing check parks per A4 — see
// fx4.mjs). Double-clicking a text card opens BoardCardPopup below instead
// (over a blurred board) — this component no longer has an "editing"
// branch or mode at all.
//
// FX5 S3 (b/c) — a genuine, diagnosed defect (found live via a seeded-box
// harness probe, not guessed): a PORTED page's box.text holds the FULL
// source content (Port's own "COPY, never move" law — untouched, nothing
// here ever truncates what's STORED), but rendering that full text verbatim
// on the card's own FACE made two things true at once, both matching the
// brief's own "content-minimum trap (full-text content inflating the
// reflow floor)" and Nick's "the Board organizes ideas, it doesn't read
// pages": (1) the initial estimated height (persistence.ts's
// estimateTextBoxHeight, proportional to the WHOLE source page's own line
// count) reached OVER SIX PAGE-WIDTHS TALL for a 60-line seed, measured
// live; (2) the reflow-as-minimum floor (FX4 S4's own law: it only ever
// GROWS, never shrinks) then permanently pins the card at whatever its own
// rendered DOM content's natural scrollHeight demands — for full raw text,
// that floor never comes down, so no amount of manual shrinking ever
// sticks. A card carrying `sourceEntryId` (i.e. genuinely PORTED from a
// page, not hand-typed via "Add card") now renders the SAME bounded
// notecard excerpt BoardPinBox already uses instead of the raw text — the
// reflow floor then measures against that SHORT excerpt's own natural
// height, "the clamp probably frees it," proven (see fx5.mjs's own S3
// section), not assumed. Hand-typed cards (no sourceEntryId) are
// completely untouched — their own organic grow-as-you-type is FX4 S4's
// intended, correct behavior, not a defect.
```

## BoardEditor §8

From `apps/desktop/src/components/BoardEditor.tsx`, line 359 at `fd1f9f1b` (the comment that stays: "the resting card renders through the popup's decoration engine with no caret, so every marker collapses; escHtml keeps the HTML safe, and font-size:0 keeps the stored text in textContent").

```ts
  // ITEM 118 (a-ii) — THE RESTING CARD RENDERS THROUGH THE DECORATION ENGINE.
  // This returned `{initialText}` as a bare text node, so decoration only ever
  // ran inside the opened popup: on the board itself every markdown marker was
  // literal and nothing was styled, bold and italic alike. That is the "NO
  // styling applied" half of Nick's own walkthrough report.
  //
  // The repair is not a new renderer — it is the popup's OWN engine
  // (decorateMarkdownForCard, already imported above for BoardCardPopup),
  // called with a NULL caret. The card register is reveal-adjacent-to-caret;
  // a resting card has no caret, so nothing is adjacent to anything and every
  // marker collapses to `.md-mark-hidden`. The writer gets words, not syntax —
  // FX5 S6's own recorded verdict ("asterisks visible on a card is a bug, not
  // a style choice"), which was written for the popup and applies with more
  // force to the card sitting in plain view.
  //
  // dangerouslySetInnerHTML is safe here for the same reason it is safe in
  // decorateEditorFor, which writes this identical HTML into a live
  // contenteditable: every text slice goes through escHtml (draftDecoration.ts
  // :13) and the only tags the engine can emit are its own <span class="md-*">.
  //
  // STORAGE IS UNTOUCHED. The marks are collapsed via `font-size:0`, never
  // display/visibility, so they remain real rendered characters — this
  // element's textContent still carries the stored text byte-for-byte. That
  // matters beyond tidiness: draftDecoration.ts's header records that an
  // always-hidden marker vanishes from innerText, which is how markdown
  // characters would get silently stripped out of a writer's saved words.
  //
  // Card auto-sizing is one-directional (the measure effect returns the box
  // unchanged unless measured > stored), so shorter decorated text can never
  // shrink a card. Asserted in item118.mjs rather than left as reasoning.
```

## BoardEditor §9

From `apps/desktop/src/components/BoardEditor.tsx`, line 400 at `fd1f9f1b` (the comment that stays: "the card editor reuses Draft's engine (applyFormat, decorateMarkdown) on box.text, bold and italic only; Tab is trapped as in UnlockCeremony, and the paste wall stands").

```ts
// FX4 S5 — the card popup editor, over a blurred board (the mockup's
// treatment — board-card-studies.html's own `.editor`). Bold/Italic ONLY
// (S0's own frozen markdown set does not unfreeze in a fix ticket) —
// reuses store/draftFormat.ts's applyFormat and store/draftDecoration.ts's
// decorateMarkdown/decorateEditorFor verbatim, the SAME engine Draft mode
// already uses on entry.text, applied here to box.text instead (S0's own
// "no separate rich-text state" ruling extends naturally). No typewriter,
// no progress, anywhere in here — Nick's own word, and there is simply no
// code path here that could mount either (this component doesn't import
// useTypewriterFade or any progress instrument at all).
//
// Focus trap: hb1.1's own UnlockCeremony.tsx pattern, reused verbatim (Tab
// contained within the dialog's own focusable elements while it's open).
// Voice Wall stands: foreign paste/drop is blocked + whispered; an allowed
// own-ink paste proceeds natively (Draft's own law, unchanged here).
```

## BoardEditor §10

From `apps/desktop/src/components/BoardEditor.tsx`, line 419 at `fd1f9f1b` (the comment that stays: "INLINE: the Walk's card IS this editor, mounted in place (no portal, backdrop, dock or Esc - Esc belongs to the Walk); autoFocus puts the caret in the card on every step").

```ts
  // W1 - INLINE: the Walk's card IS this editor (the ordinary card writing engine: decoration, undo, hidden marks, the paste wall) mounted in place - no portal, no backdrop, no dock, no Esc-to-close (Esc belongs to the Walk,
  // which leaves for the board's last shown view). It takes the caret when asked (autoFocus): the Walk asks on every mount, so the caret lands in the card on opening and on stepping (Nick, Oct 25); the arrows then step only while the card is empty (store/walk.ts keyMaySteps).
```

## BoardEditor §11

From `apps/desktop/src/components/BoardEditor.tsx`, line 439 at `fd1f9f1b` (the comment that stays: "the styling dock starts closed (the Sliver's useState(false) at card scale); declared with the hooks, above any early return").

```ts
  // ITEM 159 — THE STYLING DOCK STARTS CLOSED, like the Page's and the Board's.
  // Nick: "The styling tab starts open when a card is opened -- it should be
  // closed by default just like on the Page and Board."
  //
  // It had no open state AT ALL: the dock was always rendered, so there was no
  // flag to flip — the closed state had to be built. `Sliver` is the pattern
  // being matched, and it is `useState(false)` behind a grip; this is the same
  // shape at card scale, not a second mechanism.
  //
  // Declared HERE, with the other hooks, and not beside the dock markup it
  // serves — item 133's lesson, written into the code that learned it: state
  // belongs with the HOOKS, because proximity to its own feature is the pull
  // that puts it below an early return.
```

## BoardEditor §12

From `apps/desktop/src/components/BoardEditor.tsx`, line 453 at `fd1f9f1b` (the comment that stays: "FONT-SPAN: whether words are highlighted in the card, and their face - the dock's Typeface scopes and brass read it; declared with the hooks").

```ts
  // FONT-SPAN: whether words are highlighted in the card, and their face - the dock's Typeface scopes and brass read it. Declared
  // with the hooks (item 133's lesson, above).
```

## BoardEditor §13

From `apps/desktop/src/components/BoardEditor.tsx`, line 791 at `fd1f9f1b` (the comment that stays: "a size for the HIGHLIGHTED words of this card only - the face's own road").

```ts
  // POLISH #10 item 4 (Nick ruled A, Oct 25): a size for the HIGHLIGHTED words of this card only - the face's own road
```

## BoardEditor §14

From `apps/desktop/src/components/BoardEditor.tsx`, line 809 at `fd1f9f1b` (the comment that stays: "the Whole card SIZE - the card's spans' sizes go (one undo step), then the card's size").

```ts
  // POLISH #10 item 4: the Whole card SIZE - the card's spans' sizes go (one undo step), then the card's size
```

## BoardEditor §15

From `apps/desktop/src/components/BoardEditor.tsx`, line 838 at `fd1f9f1b` (the comment that stays: "the backdrop is portalled to <body>: inside .desk-frame-stage (isolation:isolate) its z-index ranked only within the stage, and the rail painted over it").

```ts
  // card-close-x (Fable, 2026-10-13): "While a pop-up is open, nothing behind it should be clickable." The backdrop is fixed at
  // z-index 210, but it rendered INSIDE `.desk-frame-stage`, whose `isolation:isolate` (FX4 S2) makes it a stacking context - so 210
  // only ranked within the stage, and the fixed rail (`.desk-frame-strip`, z-index 1 in the ROOT context) painted over the whole
  // stage, backdrop included: an outside click landed on the rail's own buttons (chat 1's run: elementFromPoint -> wz-strip, which
  // holds "Remove"). Portalled to <body>, the backdrop ranks in the root context, above the rail and the page's chrome (toasts and the stale-client banner
  // still sit above it, as they should). Nothing in this
  // component reads its DOM ancestors, its colours are :root tokens, and React events still bubble through the component tree.
```

## BoardEditor §16

From `apps/desktop/src/components/BoardEditor.tsx`, line 990 at `fd1f9f1b` (the comment that stays: "non-null only while this board has no row yet: the first box writes the row; a titled board is born at once").

```ts
  // PB1 (item 71) — non-null only while this board has no row yet. "A board is
  // born when it has a box": the two untitled create-board doors now open an
  // unborn surface, and the FIRST BOX writes the row. A titled board never
  // arrives here unborn — a name is content (ruling 3), so it is born at once.
```

## BoardEditor §17

From `apps/desktop/src/components/BoardEditor.tsx`, line 998 at `fd1f9f1b` (the comment that stays: "a system board and a page's paired Plan board take no part in the way-back (the slot keeps the page's own departure); decided once per mount").

```ts
  // W2 — route + mount identity only (S1: a Board's own view state — pan,
  // zoom, selection — already persists through its own store; no scroll/
  // caret to capture here).
  // B1 — a system Board doesn't participate in the way-back mechanism at
  // all (useWayBack.ts's own header comment carries the full race
  // diagnosis: the Journal Board sitting between a departure and the
  // writer's chip-click return would otherwise clobber the very
  // information that return needed, the moment its own arrival became
  // chip-visible). An ordinary Board's own behavior is untouched.
  // PAGE -> PLAN -> BACK (live bug, Oct 13): a page's PLAN board sits BETWEEN the page's departure and the writer's return, exactly as the Journal Board once did (B1 above) -
  // and an ordinary board that participates CAPTURES ON UNMOUNT, so leaving the Plan overwrote the one-slot store (which held the PAGE's scroll and caret) with the
  // BOARD's own entry. The page then mounted, found a slot naming someone else, and restored nothing: the writer landed at the top. A board that is a page's paired
  // Plan face takes no part in the way-back at all (the slot keeps the PAGE's own departure), decided ONCE per mount so a later unpairing cannot fire a stray capture.
```

## BoardEditor §18

From `apps/desktop/src/components/BoardEditor.tsx`, line 1121 at `fd1f9f1b` (the comment that stays: "connection mode: threadArmedFrom is the card whose corner square was double- or right-clicked; these are the rest of its render state (the card under the arm, the flash after a link or unlink)").

```ts
  // CONNECTOR-A (Nick's approved mockup v6): `threadArmedFrom` IS connection mode now - the card whose corner square was double-clicked or right-clicked. These are the rest of its
  // render state: the card the arm is over (its circle shows), and the brief flash after a link or unlink.
```

## BoardEditor §19

From `apps/desktop/src/components/BoardEditor.tsx`, line 1162 at `fd1f9f1b` (the comment that stays: "click-to-create: a click on empty board makes a card, a click-drag sizes it first; refs, because the canvas's native pointer listeners must read the current answer").

```ts
  // BOARD CLICK-TO-CREATE (Fable, Oct 14) - a click on EMPTY board space makes a card there; a click-drag sizes it first, with a ghost outline following the pointer; on release the card
  // pop-up opens, and a card made this way and closed while still empty is discarded. OPEN projection on an ordinary board only (STORYBOARD/OUTLINE have their own card doors, a system
  // board's cards are derived). These are refs because the gesture lives in the canvas's native pointer listeners (below), which must read the CURRENT answer, not a stale closure.
```

## BoardEditor §20

From `apps/desktop/src/components/BoardEditor.tsx`, line 1178 at `fd1f9f1b` (the comment that stays: "the box being resized now: the auto-grow effect skips it mid-drag, so the pointer alone sets w/h, and the content floor is reconciled once when the drag ends").

```ts
  // FX7 S7 — root-caused live (not guessed): the auto-grow effect below
  // (the "reflow floor" FX4 S4/FX5 S3 established — it only ever GROWS a
  // box's stored h, never shrinks it) re-runs on EVERY box change,
  // including every intermediate `setBoxes` call `onMove` (below) fires
  // WHILE a resize drag is still held. Dragging a corner handle changes
  // width AND height together, and narrowing the width can force the SAME
  // text to wrap into an extra line — which the auto-grow effect then
  // immediately measures and grows `h` right back up, mid-drag, fighting
  // the writer's own shrink in real time. Confirmed live with a genuinely
  // trusted step-by-step drag (intermediate reads, not just start/end):
  // `h` visibly reversed direction (shrank, then grew back) partway
  // through a single continuous downsize gesture on a card whose body
  // text needs more than one line at the narrower width — exactly Nick's
  // "once a card is upsized... it doesn't seem like it can be downsized."
  // This ref tracks whichever box id is ACTIVELY being resized right now
  // (set in beginResize, cleared in finish, below) so the effect can skip
  // touching it mid-drag — the writer's own pointer position is the ONLY
  // authority over w/h while a resize is held; the content-minimum floor
  // still applies (this ticket's own invariant: text is never clipped),
  // just reconciled ONCE, cleanly, the instant the drag ends, rather than
  // fighting every intermediate frame.
```

## BoardEditor §21

From `apps/desktop/src/components/BoardEditor.tsx`, line 1202 at `fd1f9f1b` (the comment that stays: "when the last resize or move ended, so the canvas's double-click can tell a gesture's own second click from a request to edit").

```ts
  // CARD-RESIZE-RELOCK (Nick, 2026-10-13: "after a card resize, an immediate second resize or a click on the corner does nothing").
  // When the last resize or move ENDED (performance.now()), so the canvas's double-click can tell a gesture's own second click from
  // a request to edit - see onDoubleClick below.
```

## BoardEditor §22

From `apps/desktop/src/components/BoardEditor.tsx`, line 1256 at `fd1f9f1b` (the comment that stays: "describePageHome knows nothing of system boards, so their home label comes from the lexicon here (trash, shelf, journal)").

```ts
  // Independent review fix (2026-07-19) — describePageHome (pageHome.ts)
  // has never heard of origin:'system'; both system Boards fell through to
  // its generic else-branch and reported "In the Journal" as their OWN
  // home — flatly false for the Trash Board (S1: "no project home"), and
  // self-referential for the Journal Board. Overridden here, scoped to
  // system Boards only (pageHome.ts and every ordinary page's home label
  // stay byte-identical) — the SAME "told truthfully" law this function's
  // own header comment names, now honored for system Boards too.
  // B2 S1 — 'shelf' joins the systemKind->term lookup, the same 3-way shape
  // B1's own journal/trash pair already established.
```

## BoardEditor §23

From `apps/desktop/src/components/BoardEditor.tsx`, line 1308 at `fd1f9f1b` (the comment that stays: "while a drawer narrows the board, the canvas keeps the width the board has with the drawers shut, so no card shrinks or moves - the board scrolls instead").

```ts
    // POLISH #10 item 1: while a drawer narrows the board, the canvas keeps the width the board has with the drawers shut (its natural width less the
    // wrap's own border and gutter), so no card shrinks or moves - the board scrolls instead
```

## BoardEditor §24

From `apps/desktop/src/components/BoardEditor.tsx`, line 1372 at `fd1f9f1b` (the comment that stays: "drawers never cover a board's cards: the board area narrows to the room beside the open drawers while the canvas keeps its natural width (the board scrolls); the CSS reads --board-l / --board-r").

```ts
  // POLISH #10 item 1 (Nick, Oct 25) - DRAWERS NEVER COVER A BOARD'S CARDS. The board area (min(100%, 1100px), centred) narrows to the room beside the
  // open drawers: the Tools drawer needs DRAWER_MIN (200px, its tab included) clear of the strip on the left, the Tutor | Grafts drawer its tab + its
  // open width on the right. The side that already has the room keeps its margin; only a side that is short pulls in. The CANVAS keeps its width - it is
  // measured from the board's natural width, not the narrowed one - so no card shrinks or moves on it; the board scrolls to reach them. The drawers are
  // flush to the board (index.css reads --board-l / --board-r), and its tabs ride its edges. The both-or-one rule is menusDrawers' own.
```

## BoardEditor §25

From `apps/desktop/src/components/BoardEditor.tsx`, line 1568 at `fd1f9f1b` (the comment that stays: "FIT TO TEXT: drops sizedByHand and fits the card to its content on the reflow's own floors; a dealt deck's rows follow (rowFit)").

```ts
  // BUG 32d - FIT TO TEXT (Nick, Oct 30): the small icon on a hand-sized card. A click removes sizedByHand and fits the card to its content (the same floors as the reflow: a dealt card never below the deal's own
  // card height, a freeform card never below MIN_TEXT_H); a dealt deck's rows follow it (rowFit), and the card is the writer's acted-on card from here, so it stays fitted as its words change.
```

## BoardEditor §26

From `apps/desktop/src/components/BoardEditor.tsx`, line 1602 at `fd1f9f1b` (the comment that stays: "a fontFace patch of `undefined` CLEARS the card's face (the key goes; absent = Default), it never stores an empty one").

```ts
    // TOOLS #10 item 10: a fontFace patch of `undefined` CLEARS the card's face (the key goes; absent = Default), it never stores an empty one
```

## BoardEditor §27

From `apps/desktop/src/components/BoardEditor.tsx`, line 1659 at `fd1f9f1b` (the comment that stays: "a removed card takes its hairlines in one undo snapshot; inert on a system board (its cards are derived); a deleted card is a tombstone (deletedAt), saved first so a fresh card is in storage to stamp").

```ts
  // AB4 S3 — removing a card also drops any hairline that referenced it (an
  // orphaned connection would point at nothing); one snapshot covers both,
  // so Undo restores the card AND its connections together.
  // B1 S3 — "hand-delete derived cards (Delete on one must be an inert
  // quiet no-op, harness-asserted)": on a system Board, EVERY visible card
  // is a derived page-pin (S3's own "may NOT Add cards" already makes any
  // other kind unreachable there), so Delete is inert here, whole — a quiet
  // early return, no undo snapshot, no removal. The action row's own Remove
  // button stays visibly present (the brief's own wording: "Delete ON ONE
  // must be an inert quiet no-op" describes the CLICK's effect, not the
  // button's presence) — clicking it on a system Board simply does nothing.
  //
  // BOARD CONTEXT MENU (Nick, Oct 15): a deleted card is a TOMBSTONE. The editor's own state drops it (and its connection boxes - they leave the VIEW, but stay in storage: liveBoxes hides a connection
  // whose endpoint is hidden, so they come back with Restore); storage keeps the card stamped deletedAt. The board is saved FIRST so a card made a moment ago is in storage to be stamped.
```

## BoardEditor §28

From `apps/desktop/src/components/BoardEditor.tsx`, line 1770 at `fd1f9f1b` (the comment that stays: "the label is the card's WORDS - its hidden marks (a style span's included) are dropped before it is read").

```ts
      // POLISH #10 item 4: the label is the card's WORDS - its hidden marks (a style span's included) are dropped before it is read
```

## BoardEditor §29

From `apps/desktop/src/components/BoardEditor.tsx`, line 1839 at `fd1f9f1b` (the comment that stays: "New page card: a real loose page, pinned here in one act; the pin is APPENDED to this component's live boxes (never replaced by the store's copy), so the unmount save neither erases it nor drops unsaved cards").

```ts
  // FX6 S2b — "New page card": the board-side door Nick reached for and
  // couldn't find. A blank card that starts a card is one thing (onAddCard,
  // above); this instead creates a REAL page and pins its own card to THIS
  // board in one act. Normal homing laws, untouched: createLooseHomePage
  // is the SAME "give me a blank page, no assumptions about where it
  // files" door Arrival.tsx's own Write door already uses (AB3 S4 — `loose`
  // is a legitimate, permanent home, never nudged to file) — a pin is
  // membership, not filing (AB4's own law, S3 below closes the self-pin
  // gap in the SAME spirit), so the new page's OWN home is independent of
  // the board it lands on; pinPageToBoard never touches it. Opens at
  // `/page/:id` (PageEditor, mode-aware) — the SAME editing surface every
  // other page in a project/board context already opens into, not the
  // Journal's own distinct capture UI. Travels straight to the fresh page
  // — matching Nick's own DoD wording, "makes a page-card on a board in
  // one act."
  //
  // ITEM 92 — THE CARD USED TO BE WRITTEN AND THEN ERASED BY THIS COMPONENT.
  // `pinPageToBoard` writes the BOARD's row in the STORE. This component holds
  // its cards in local state that is initialized once (`useState` above) and, on
  // a user board, never re-read — the `subscribe()` that would refresh it lives
  // inside the system-board-only reconcile effect. So after pinning, local
  // `boxes` still held the PRE-PIN array, and the unmount cleanup below
  // (`saveBoardBoxes(id, boxesRef.current)`) wrote that stale array straight back
  // over the pin — on the very `navigate` this handler performs. The card was
  // created and then destroyed by the surface that created it.
  //
  // This is the hazard the deck-wizard comment above already names: card
  // creation goes through the component's own state so a later save cannot
  // clobber it. The pin BOX itself is still built by `pinPageToBoard` — that
  // function owns stacking placement, the idempotent already-pinned check, and
  // the self-pin / system-board guards, and forking any of that into this
  // handler would be a second source of truth for what a pin is. What was
  // missing is the other half: telling this component what the store now says.
  //
  // The pin is APPENDED to this component's own live boxes — never assigned
  // from the store's copy. That distinction is the difference between a fix and
  // a second data-loss bug, and it was caught by staging item 92's actual
  // precondition: at the moment this door is used, local `boxes` may hold cards
  // the 2s autosave has not written yet, so the STORE's array is a strict subset
  // of the truth. Replacing local state with `updated.boxes` would have silently
  // dropped every unsaved card the writer had just placed. Appending to
  // `boxesRef.current` — "this component's own live boxes, not a fresh store
  // read", in the deck-wizard comment's own words — keeps both.
  //
  // `boxesRef.current` is assigned directly rather than only through `setBoxes`,
  // because it is assigned during RENDER and this handler batches its update
  // with a `navigate` that unmounts the component: there may be no further
  // render, and the unmount guard reads the REF. `lastSavedRef` is deliberately
  // left alone so that guard still sees a difference and writes the merged
  // array on the way out.
  //
  // `pinPageToBoard` still builds the box — it owns stacking placement, the
  // idempotent already-pinned check and the self-pin / system-board guards, and
  // forking those here would be a second definition of what a pin is. Its
  // placement is computed against the store's boxes, so a pin can land under an
  // unsaved neighbour; that is cosmetic and movable, and strictly better than
  // the alternatives (losing the card, or duplicating the placement rules).
```

## BoardEditor §30

From `apps/desktop/src/components/BoardEditor.tsx`, line 2004 at `fd1f9f1b` (the comment that stays: "a gesture clears a text selection on the board as it starts and ends: left in place, the next press on the corner starts the browser's own text drag, which cancels the pointer").

```ts
    // CARD RESIZE RELOCK, THE SECOND CAUSE (chat 1's run, 2026-10-13): a resize or a move drags the mouse across the board, and the
    // browser selects the text it passes over. The next ordinary press inside that selection - on the corner, a moment later - starts
    // the browser's own drag of the selected text, which CANCELS the pointer: onCancel -> finish(false) reverts the resize, and the
    // corner looks locked until a click elsewhere clears the selection (Nick: "until he clicks another card"). Board text is never
    // selected for its own sake (a card is edited in its popup), so a gesture clears a selection that sits on the board when it starts
    // and when it ends. A selection anywhere else (the page beside a board) is left alone. The diagnosis is the harness's to prove,
    // not this comment's: card-resize-relock.mjs R4 (no selection left after a resize) and R5 (no dragstart / pointercancel).
```

## BoardEditor §31

From `apps/desktop/src/components/BoardEditor.tsx`, line 2023 at `fd1f9f1b` (the comment that stays: "connection mode, from the corner square or the graft knob: a brass line arms to another card and a release toggles the link; lines show only in this mode, and the arm moves imperatively, not per React render").

```ts
    // ============================================================================================================================================================
    // CONNECTION MODE (connector-a; Nick's approved mockup v6, docs/mockups/connector on cursor/connector). It REPLACES the green tack and the thread-drag it armed.
    //   ENTER  double-click the selected card's corner square with the pointer unmoved between the clicks, or right-click it (the browser menu is suppressed only there). The square
    //          morphs to a 10px circle.
    //   ARM    a thin brass line from that circle to the pointer; over another card it snaps to THAT card's circle - open = not linked, solid = linked.
    //   COMMIT release on a card TOGGLES the link (a connection box, same board, stored exactly as before - no schema); a brief flash; then the lines hide.
    //   CANCEL Esc, or a release on empty board after a drag. Released AT the square without moving, the mode latches and a click finishes it.
    //   LINES  shown ONLY in this mode, only this card's own links (clipped to the board by the canvas itself); a click selects one, Delete removes it (the existing key handler).
    // The arm and the target circle move imperatively (no React render per pointermove, the preview line's old discipline); React only hears of the target card changing.
    // ============================================================================================================================================================
    // BIG PROJECTS STEP 3 (3a): `origin` - the door the mode was entered from. 'corner' is connector-a's square; 'knob' is the brass graft knob on the
    // card's right edge (the same mode, a second door: the arm and the origin circle sit at the knob instead of the corner).
```

## BoardEditor §32

From `apps/desktop/src/components/BoardEditor.tsx`, line 2208 at `fd1f9f1b` (the comment that stays: "the browser's click after a release on a rail thumbnail would travel to its page; a short beat swallows it, so making a link never leaves the board").

```ts
    // THE CLICK THAT FOLLOWS A RELEASE ON A RAIL THUMBNAIL (ledger 86, a real product bug). The browser fires `click` on the tile right after this pointerup, and the tile's own onClick travels
    // to its page - so the writer left the board the moment the link was made (page-primacy line 3: leaving is an explicit act, never a side effect of a tool). The thumbnail DRAG swallows its own
    // follow-up click the same way (above); a connector release on the rail does too, whichever path made it - a latched click on the thumbnail, or the held path (press the corner, release over
    // it). A short beat tied to the release itself, never a lock: the writer's next deliberate click on a thumbnail still travels.
```

## BoardEditor §33

From `apps/desktop/src/components/BoardEditor.tsx`, line 2263 at `fd1f9f1b` (the comment that stays: "a right-button release over a rail thumbnail fires that tile's contextmenu; stopped here in the capture phase, its menu never opens after a link gesture").

```ts
      // THE RAIL TILE'S OWN MENU (ledger 87): a held right-button release over a rail thumbnail fires `contextmenu` ON THAT TILE, whose own onContextMenu opens its "Delete board" menu - a destructive menu under the pointer
      // right after a link gesture, and the writer's next click is spent dismissing it. preventDefault only stops the browser's own menu; this listener is document-capture, so stopping propagation here keeps the event from
      // ever reaching the tile's handler. Only in the three cases this gesture owns (the mode is on, the beat after a right-drag lets go, the corner square).        
```

## BoardEditor §34

From `apps/desktop/src/components/BoardEditor.tsx`, line 2340 at `fd1f9f1b` (the comment that stays: "the lock's aspect comes from the PINNED ENTRY, never the box (a nested board's card is a page-pin box too and stays wide); deleted-inclusive so a Trash card keeps its shape").

```ts
      // ITEM 138 — the LOCK's aspect, resolved from the PINNED ENTRY, never from
      // the box. A nested board's card is the same `page-pin` box as a page's, so
      // keying on `box.kind` here would flip every board card to tall and undo
      // Nick's wide-board ruling (138's ratified exclusion clause).
      // `getJournalEntryIncludingDeleted` because a Trash card is still a card
      // whose shape must stay lawful while it is on the wall.
```

## BoardEditor §35

From `apps/desktop/src/components/BoardEditor.tsx`, line 2484 at `fd1f9f1b` (the comment that stays: "with a card selected, the FIRST empty-space press only deselects - it makes nothing; the next press, with nothing selected, is the one that creates").

```ts
        // RULING (Fable, Oct 14): with a card selected, the FIRST empty-space press only deselects - it makes nothing. The next press, with nothing selected, is the one that creates.
```

## BoardEditor §36

From `apps/desktop/src/components/BoardEditor.tsx`, line 2506 at `fd1f9f1b` (the comment that stays: "capture the pointer on the first pointerdown, not at the drag threshold: an uncaptured fast drag can hit-test outside the canvas and drop the gesture").

```ts
      // FX5 S4 (a) — the diagnosed drag-friction fix: capture the pointer
      // HERE, on the very first pointerdown, not only once the drag
      // threshold is crossed (the old code left `beginMove`/`beginResize`
      // as the ONLY setPointerCapture callers — found live by reading the
      // gesture state machine, not guessed). Between pointerdown and the
      // 6px MOUSE_DRAG_THRESHOLD being crossed, an uncaptured pointer's
      // move/up events route to whatever DOM element is actually under the
      // cursor at that instant, not necessarily this canvas — a fast real
      // drag can move far enough between two consecutive OS-delivered
      // pointermove events that hit-testing lands outside `.board-canvas`
      // (or over a DIFFERENT card, or past `.board-canvas-wrap`'s own
      // scrollable edge) before capture ever engages, silently dropping
      // the rest of the gesture — "cards can't easily be moved." A
      // synthetic harness dispatch (element.dispatchEvent on the origin
      // element for every step) can never reproduce this: it always
      // targets the origin node directly, bypassing the very hit-testing
      // capture exists to stabilize — this fix can only be PROVEN by
      // asserting capture engages immediately (see fx5.mjs's own S4
      // section), not by a synthetic full-gesture replay; real-hand
      // reliability rests on Nick's own hand, disclosed here per this
      // ticket's own standing discipline.
```

## BoardEditor §37

From `apps/desktop/src/components/BoardEditor.tsx`, line 2587 at `fd1f9f1b` (the comment that stays: "the right edge stops a drag as the bottom does: the canvas width never grows (x and w are fractions of it); clamped on the shared delta, and floored at 0 so a card already past the edge is never yanked back").

```ts
        // ITEM 118 (c) — THE RIGHT EDGE GETS THE SAME HARD STOP THE BOTTOM HAS.
        // FX17 S3 above fixed the DOWNWARD travel and said so in its own first
        // sentence — "the way the x-axis's own Math.max(0, …) does" — leaving
        // sideways travel with a lower bound and no upper one at all. Measured
        // on a populated board (item 118 S0 pass 3, Nick's own stage): a card
        // dragged 900px right ended up hanging 750px PAST the canvas, with the
        // canvas width unchanged at 1500. That is defect (c): "cards moved to
        // the board's edge begin to DISAPPEAR."
        //
        // WHY THE TWO AXES ARE NOT THE SAME BUG, measured rather than assumed.
        // The canvas HEIGHT is content-driven and grows to fit (the same probe
        // watched it go 1455 -> 2070px to contain a card dragged down, which is
        // why the bottom needed a far-away cap rather than a fitted one). The
        // WIDTH cannot grow: it is pageWidthPx, the container's width or the
        // writer's own canvasW override. So a card past the right edge is
        // outside a board that will never reach it — permanently clipped,
        // unreachable, and gone from the writer's view.
        //
        // The bound is therefore the canvas's own right edge, which in these
        // units is exactly 1 (x and w are both fractions of pageWidthPx).
        // Everything else here is FX17 S3's shape, deliberately: clamped on the
        // SHARED delta so a multi-card selection holds its shape instead of
        // deforming as its rightmost card lands, and floored at 0 so a card
        // already sitting past the edge — an older save, a deck load — is never
        // yanked back the instant the writer touches it. A stop, never a
        // correction; no card is relocated by the arrival of a limit.
```

## BoardEditor §38

From `apps/desktop/src/components/BoardEditor.tsx`, line 2627 at `fd1f9f1b` (the comment that stays: "a page-pin takes its kind's canonical aspect only inside a resize the writer performs - never on load or on a move: constrain forward, never snap").

```ts
          // ITEM 138 — A PAGE-PIN TAKES ITS KIND'S ASPECT THE MOMENT IT IS
          // RESIZED. This supersedes AB4 S4's freeform-both-axes for this box
          // kind (that comment is marked at its own site).
          //
          // CONSTRAIN FORWARD, NEVER SNAP — and this line is where the whole
          // distinction lives. The lock is applied ONLY here, inside a resize the
          // writer is performing: not on load, not on a move, not when a limit
          // arrives. An existing wide card opens exactly as it was left and keeps
          // its stored geometry indefinitely; it takes the shape at the moment the
          // writer themselves changes that shape. "Resized only" counts as
          // touched (Nick's ruling) — a move alone is not a touch, which is why
          // this is in the resizing branch and nowhere near the moving one.
          //
          // The aspect is the KIND's canonical one, not the card's own captured
          // aspect (which is what `ink` preserves above): the point is to bring a
          // hand-widened page card back to the page silhouette, not to preserve
          // whatever it currently is.
```

## BoardEditor §39

From `apps/desktop/src/components/BoardEditor.tsx`, line 2645 at `fd1f9f1b` (the comment that stays: "the card keeps its proportions and follows the pointer on both axes: the axis the pointer moved more drives the size, so the corner stays under the hand; MIN_PIN_H floors it").

```ts
            // CARD-RESIZE-AXIS (Nick, Oct 15 3:18am): the card KEEPS its proportions - only its size changes - but the size follows the pointer on BOTH axes. The lock used to read dx alone, so a
            // sideways drag grew the (tall) card mostly downward, a vertical drag did nothing, and the corner ran away from the pointer. Now: the corner's target is where the pointer has taken it
            // (the corner moves by dx, dy). THE AXIS THE POINTER HAS MOVED MORE DRIVES THE SIZE (Fable, round 2: projecting the drag onto the diagonal made a sideways drag sluggish - 140px right
            // gave +48px wide - so the corner lagged the hand): the width changes by dx, or by dy / aspect, whichever has the larger MAGNITUDE (its own sign - so a drag that is mostly up shrinks it even
            // while it also moves right); the height follows at the aspect. The corner then stays UNDER THE POINTER on the dominant axis, and exactly on it for a drag along the diagonal.
            // MIN_PIN_H and the min width both floor it (the height floor implies a width floor at this aspect).
```

## BoardEditor §40

From `apps/desktop/src/components/BoardEditor.tsx`, line 2653 at `fd1f9f1b` (the comment that stays: "a DELTA from the start size, so an outward drag never shrinks an older, differently shaped card: it takes its kind's shape at the first pixel and grows").

```ts
            // A DELTA from the start size, so an outward drag can never SHRINK an older, differently shaped card (item 138's grandfathered wide ones): it takes its kind's shape at the first pixel and grows.
```

## BoardEditor §41

From `apps/desktop/src/components/BoardEditor.tsx`, line 2754 at `fd1f9f1b` (the comment that stays: "Delete removes the selected card (a selected hairline takes the key first; never while typing or with a modifier); in connection mode the key belongs to the mode").

```ts
      // THE ROW IS GONE (Nick, Oct 15): the key is how a card is removed. A selected hairline takes the key first (above); typing anywhere editable never reaches this; a modified press is not a delete.
      // CONNECTOR-A: while connection mode is on the key belongs to the mode (a selected line, handled above) - it must never delete the card the mode is running from, or that card's links with it
```

## BoardEditor §42

From `apps/desktop/src/components/BoardEditor.tsx`, line 2775 at `fd1f9f1b` (the comment that stays: "the rename state lives with the other hooks, above the early return: hooks below `if (!initialEntry) return null` would change the hook count between renders").

```ts
  // ITEM 133 — THE RENAME STATE LIVES HERE, WITH EVERY OTHER HOOK, and above
  // the early return below. It was first written beside the `title` derivation
  // it serves — which reads better and is wrong: `if (!initialEntry) return
  // null` sits between, so on a render where the board's row is missing these
  // two useState calls would not run and React would see fewer hooks than the
  // render before. That is error #300 and the whole tree blanked — item 104's
  // class exactly. hooks-order.mjs caught it here rather than a writer finding
  // it when a board is deleted on another device mid-session.
  //
  // The lesson worth keeping beside the code: state belongs with the HOOKS,
  // not with the feature it describes. Proximity to its own feature is the
  // pull that put it in the wrong place.
```

## BoardEditor §43

From `apps/desktop/src/components/BoardEditor.tsx`, line 2860 at `fd1f9f1b` (the comment that stays: "connection and board-meta boxes are never positioned cards; a page-pin with onCanvas === false is withheld from the wall (absence means displayed, so older pins still render)").

```ts
  // AB4 S3 / FX4 S4 — connection and board-meta boxes are never positioned
  // cards: filtered out of the positioned-card render loop (they never
  // carry a real x/y/w/h) — connections draw as a separate SVG layer
  // (endpoints derived LIVE from the current boxes, so a drag/resize drags
  // the hairline with it for free); board-meta renders nothing at all (its
  // only job is carrying the canvas's own persisted dimensions).
  // PW1 S3 (item 125) — MEMBERSHIP IS NOT DISPLAY. A page-pin whose membership
  // is explicitly NOT displayed is withheld from the canvas here, at the one
  // gate every card already passes through. ABSENCE MEANS DISPLAYED: the test
  // is `=== false`, never falsiness, so every pin written before this field
  // existed (undefined) still renders — every already-arranged board reads
  // UNCHANGED on first launch, with no backfill and no migration. The card is
  // withheld from the WALL only; the membership itself is untouched and still
  // lists everywhere memberships list.
```

## BoardEditor §44

From `apps/desktop/src/components/BoardEditor.tsx`, line 2930 at `fd1f9f1b` (the comment that stays: "the card menu leads with the conditional actions (Ungroup, Edit copy, Restore, Pin to a Board…), then a separator and Delete; a right-click on empty board offers New Card and Delete board").

```ts
  // FX5 S3 — a selected, ported (sourceEntryId) text card gets an explicit
  // "Edit copy" action row button — double-click on its face now travels to
  // the source (below, matching page-pin's own affordance), so this is the
  // one remaining way to reach the popup that still edits the board's own
  // independent copy (Port's own "COPY, never move" law: the board's copy
  // stays fully editable, just not via the same gesture as a hand-typed
  // card anymore).
  // B1 S4 — the Trash Board's own Restore, joining the row's existing
  // conditional buttons exactly the way ungroup/Edit-copy already do.
  // THE ROW NEVER MOVES THE CANVAS (Fable, Oct 15; page-primacy applied to the board; its PLACE is superseded by the INTERIM note below - it now sits inside the canvas). It used to sit IN FLOW above the canvas, so selecting any card mounted it and pushed the canvas down
  // by its own height (about 45px: Chat 1 measured the new card landing 45px below the press). It is an OVERLAY now: absolutely positioned, right-aligned, growing UP from the canvas's top edge
  // out of a zero-height slot (boardBody, below), over the quiet gap above the canvas - it adds no height whether it is there or not. Its own ground keeps it legible over what it overlaps.
  // The "Remove" button is DELETED (Nick, Oct 15): removing a card is the Delete key now (and a context menu is coming). The row survives ONLY for the conditional actions that have no other door yet - Ungroup, Edit copy, Restore (Trash), Pin to a Board (Shelf) - so an ordinary card shows NO row at all.
  // BOARD CONTEXT MENU (Nick approved the mockup, Oct 15): the interim action row is DELETED. Its actions - Ungroup, Edit copy, Restore (Trash), Pin to a Board… (Shelf) - are the top of the CARD menu,
  // where they apply; a separator; Delete last. A right-click on empty board offers New Card and Delete board. A right-click on a card's corner square stays connection mode (the pointer effect owns it).
```

## BoardEditor §45

From `apps/desktop/src/components/BoardEditor.tsx`, line 3096 at `fd1f9f1b` (the comment that stays: "a survey row dropped on the canvas lands where dropped; only this board's own memberships are accepted, so a display act never becomes a card transfer").

```ts
          // PW1 S3 (item 125) — the DRAG half of the two display acts (Nick,
          // Q4): a membership row dragged from the rail's survey lands WHERE
          // DROPPED. The writer choosing the position is the whole reason
          // display is opt-in, so the drop point IS the act; nothing here
          // arranges on the writer's behalf.
          //
          // ONLY this board's own memberships are accepted. The payload names
          // its board, and a mismatch is ignored outright: dragging a row from
          // some OTHER board's survey onto this canvas would be moving a card
          // between boards, which is CARD TRANSFER (item 123, still unbuilt) —
          // and a display act must never quietly become one.
```

## BoardEditor §46

From `apps/desktop/src/components/BoardEditor.tsx`, line 3136 at `fd1f9f1b` (the comment that stays: "e.target is the canvas (it captured the pointer on the first press), so a fresh hit-test at the event's point finds the card that was double-clicked").

```ts
            // FX7 S5 — root-caused live (not guessed): `e.target` here is
            // NOT reliable — `onDown` below (FX5 S4(a)'s own drag-friction
            // fix) calls `canvas.setPointerCapture()` on the VERY FIRST
            // pointerdown of ANY card click, so by the time the second
            // click's native `dblclick` fires, the browser has already
            // retargeted it (and its own `mouseup`/`click` predecessors) to
            // THIS canvas element — never the card the writer actually
            // double-clicked. Confirmed with a genuinely trusted CDP
            // double-click (isTrusted:true): `e.target.closest('.board-box')`
            // resolved to null every time, on EVERY card (dealt or
            // hand-typed alike — not a deck-specific defect at all), which
            // is exactly Nick's "double clicking on them did nothing."
            // `document.elementFromPoint` sidesteps the retargeting
            // entirely with a fresh hit-test at the event's own
            // coordinates — the SAME technique this file's own
            // `finishThreadDrag` (above) already uses for the identical
            // reason.
```

## BoardEditor §47

From `apps/desktop/src/components/BoardEditor.tsx`, line 3154 at `fd1f9f1b` (the comment that stays: "a double-click on the resize corner opens nothing (it enters connection mode), and one within 100ms of a resize or move is that gesture's own click, never a request to edit").

```ts
            // CARD-RESIZE-RELOCK (Nick, 2026-10-13): a quick second press on the corner after a resize is, to the browser, the
            // second click of a double-click - and it lands HERE (the canvas holds the pointer). It opened the card's popup, and
            // with a popup open every board gesture stands down: the card read as "locked" until he clicked another card or
            // double-clicked in and out. So: a double-click on the resize corner opens nothing (CONNECTOR-A: the corner's double-click now
            // ENTERS CONNECTION MODE in the pointer effect, on the second pointerdown - so by the time the browser's dblclick lands here the mode has it, and this guard
            // REPLACES the old 'no action of its own' with 'the action is not an edit'), and a double-click whose second press made a resize or a move is that gesture's own
            // click, never a request to edit.
            // (The browser fires dblclick straight after its own second mouseup, so a gesture's own double-click arrives within
            // milliseconds of the gesture's end; 100ms catches it, and a writer's REAL double-click a moment after a drag - fx8 S3's
            // ~220ms, say - still opens the card.)
```

## BoardEditor §48

From `apps/desktop/src/components/BoardEditor.tsx`, line 3464 at `fd1f9f1b` (the comment that stays: "a system board's Add-family tools are ABSENT, never inert; the mode bar has its own .board-mode-* classes, and the PAGE door is every board's one exit, never a tab").

```ts
  // AB4 S5 / FX4 S6 — the board's own hand tool(s). Connect toggle RETIRES
  // (replaced by the handle-drag gesture above) — the sliver carries Add
  // card alone now.
  // FX5 S5 — a second control joins it: the per-board connections-footer
  // toggle ("Add card + this, two controls" — the brief's own words).
  // FX6 S2b — a THIRD control joins them: New page card.
  // B1 S3 — "Add cards (the sliver's Add action must be absent on system
  // boards)": on a system Board, neither onAddCard NOR onAddPageCard is
  // passed at all — Sliver.tsx's own SliverToolsBody renders each button
  // only when its handler is present (undefined, not a no-op function), so
  // the buttons are genuinely ABSENT from the DOM here, not merely inert
  // (matching the brief's own distinct wording for Add vs. Delete: Add's
  // own affordance "must be absent," Delete's own click "must be inert").
  // The footer toggle survives — arranging (including hiding the footer) is
  // explicitly permitted by S3's "full FX5 hand."
  // B3 S3 — "From a deck…" joins the sliver's own board tools, the SAME
  // absent-not-disabled law every other Add-family control here already
  // carries: on a system Board, onAddFromDeck is never passed at all.
  // BM1 S3 — the board's own mode bar + the PAGE → door + the telos line.
  // Three tabs in the page-bar's tab grammar, but a DISTINCT `.board-mode-*`
  // class (never the page's writing-posture `.mode-tabs`/`.desk-mode-strip` —
  // the projection axis is a genuinely different control from Free Write/Draft,
  // so w1.mjs's "a board page never renders the mode tabs" and ab1.mjs's
  // ".desk-mode-strip absent on board" both stay literally true; bm1.mjs adds
  // the successor asserting THIS new control). Tabs + telos: non-system boards
  // only. The PAGE → door is never role=tab / aria-selected — a door has no
  // current state; clicking always travels (paired → the paired page via
  // routeForEntry; unpaired → the FX10 named return `backTo`, unchanged).
  // CD4 S1 (2026-07-24, Fable's ruling amending the brief) resolves the overlap
  // the BM1 line below flagged: the Board's own "Done" is REMOVED (both render
  // paths further down), and PAGE → becomes the Board's only exit — on EVERY
  // board now, system boards included. A system board is a permanently-unpaired
  // board, so travelToPage's own unpaired branch (navigate `backTo`, which for
  // a system board is already '/' — see the backTo line above) IS its exit: the
  // cold-load fallback lands at Arrival, itself a page (HB1's "Page is home").
  // No new navigation logic — the existing unpaired branch, trusted-pointer
  // proven in bm1.mjs, is reused as-is.
```

## BoardEditor §49

From `apps/desktop/src/components/BoardEditor.tsx`, line 3502 at `fd1f9f1b` (the comment that stays: "an unpaired board's PAGE door opens an unborn page linked back: a pin on a user board, the belonging origin on a system board (Journal, Shelf); Trash keeps the exit").

```ts
  // ITEM 91 — AN UNPAIRED BOARD'S PAGE DOOR OPENS A PAGE, NOT AN EXIT.
  //
  // Nick's S11, verbatim: "board → Page rail lands on Wrizo landing (verdict:
  // New Page auto-linked back to the board)." The landing is literally what the
  // old `else` produced: `backTo` is `'/'` for a system board (see its own line
  // above), so the one universal control on the Board ejected the writer out of
  // the room instead of taking them to a page. CD4 S1 reasoned that an exit was
  // the honest behaviour for a permanently-unpaired board; Nick has overruled
  // that, and this is the successor. The b2.mjs assertions that encoded the old
  // ruling are PARKED with their originals quoted, never silently flipped.
  //
  // "Auto-linked back" means different things on the two kinds of board, and
  // getting that distinction wrong would fight a ruled law in one direction or
  // the other:
  //   - A USER board's membership is AUTHORED, so the link is a PIN, carried on
  //     the descriptor and applied by `birth()` (item 91's own seam). The board's
  //     binder rides along too, so a page made from a board inside a project is
  //     born in that project — Nick's "the board's binder/pin descriptor."
  //   - A SYSTEM board's membership is DERIVED and never authored (A16), and
  //     `reconcileSystemBoard` deletes any pin whose page does not qualify. So a
  //     pin here would be erased on the next reconcile — the exact class of
  //     defect item 92 is. The honest link is MEMBERSHIP: give the new page the
  //     origin that makes it belong, and the board adopts it by itself. Journal
  //     takes journal-origin; the Shelf takes loose (T3's own derivation).
  //   - TRASH has no creatable membership — a page cannot be authored already
  //     deleted — so it keeps the old exit. Named here rather than left to be
  //     rediscovered as a bug.
  //
  // Nothing is written by any of this: the door navigates to an UNBORN address,
  // so a writer who opens it and leaves still leaves no row behind (PB1).
```

## BoardEditor §50

From `apps/desktop/src/components/BoardEditor.tsx`, line 3580 at `fd1f9f1b` (the comment that stays: "the mode bar renders on every board, its tabs only on a non-system board (role=tablist only when they are present); nestChain is this board's crumb").

```ts
  // CD4 S1 — renders for EVERY board now (was `!isSystemBoard ? … : null`). The
  // mode TABS stay non-system only (a system board has no projections); the
  // PAGE → door is the one universal control (Fable's ruling: system boards
  // mount the same door, its unpaired branch IS their exit). role=tablist /
  // aria-label apply only when the tabs are present — a lone door is no tablist.
  // PW2 S2 — the nest chain for this board's own address (see the crumb below).
```

## BoardEditor §51

From `apps/desktop/src/components/BoardEditor.tsx`, line 3611 at `fd1f9f1b` (the comment that stays: "the telos line is not rendered (its lexicon entry stays): a board's pairing reads from its visible context").

```ts
  // ITEM word-diet (Nick, Oct 13): REMOVE — the narration line is gone
  // whole; the board's own pairing is read from its visible context now,
  // not a standing sentence. boardTelos's lexicon entry is untouched (text
  // still there for whoever reads deskLexicon.ts), simply never rendered.
```

## BoardEditor §52

From `apps/desktop/src/components/BoardEditor.tsx`, line 3798 at `fd1f9f1b` (the comment that stays: "the draft derives with an empty fallback, so a nameless board opens a nameless field, with no sentinel string to keep in step").

```ts
                // ITEM 133-B — THE DRAFT OPENS WITH AN EMPTY FALLBACK, so a nameless
                // board gives a nameless field. The first cut asked the question the
                // long way round: it derived the name with the crumb's own fallback
                // ('Untitled') and then compared the result against 'Untitled board'
                // to decide whether to open blank. Those two strings were the SAME
                // string when boardName() returned one stand-in for every caller; the
                // moment the fallback became a caller's parameter (which was itself a
                // correction — the crumb has always displayed plain 'Untitled') the
                // comparison could never be true again, and the open-blank branch went
                // dead. A writer naming a board for the first time found the stand-in
                // word sitting in the field, to be selected and deleted before they
                // could type their own.
                //
                // THE SENTINEL IS GONE RATHER THAN CORRECTED. Repairing the literal
                // would have left a magic string that has to be kept in step with a
                // fallback it cannot see — which is exactly the drift that produced
                // this, and item 136 is about to retire those stand-ins entirely.
                // Deriving with '' makes namelessness produce emptiness directly:
                // nothing to compare, nothing to keep in step.
```

## BoardEditor §53

From `apps/desktop/src/components/BoardEditor.tsx`, line 301 at `6221e3f0` (the comment that stays: "and its size").

```ts
// POLISH #10 item 4: and its size
```

## BoardEditor §54

From `apps/desktop/src/components/BoardEditor.tsx`, line 338 at `6221e3f0` (the comment that stays: "the Walk asks for it (autoFocus): the caret lands in the card on opening and on every step").

```ts
// the Walk asks for it (autoFocus): the caret lands in the card on opening and on every step (Nick, Oct 25)
```

## BoardEditor §55

From `apps/desktop/src/components/BoardEditor.tsx`, line 670 at `6221e3f0` (the comment that stays: "undefined = "Default": the card's face is cleared (fontFace absent = the theme's default)").

```ts
// undefined = "Default" (TOOLS #10 item 10): the card's face is cleared (fontFace absent = the theme's default)
```

## BoardEditor §56

From `apps/desktop/src/components/BoardEditor.tsx`, line 753 at `6221e3f0` (the comment that stays: "the pop-up closes from an X at the strip's right end; it keeps the old Close button's class, board-popup-done, so every driver still finds it; Esc and the backdrop are unchanged").

```ts
          {/* card-close-x (Nick's live test, 2026-10-13) - the pop-up closes from an X in its
              top-right corner (the strip's right end; the eyebrow's margin-right:auto puts it
              there). It replaces the foot's "Close" button and keeps that button's class,
              board-popup-done, so every driver that closes a card still finds it. Esc and the
              backdrop click are unchanged. */}
```

## BoardEditor §57

From `apps/desktop/src/components/BoardEditor.tsx`, line 2794 at `6221e3f0` (the comment that stays: "on an empty ordinary board the doors themselves stand in the room (gated on the render list, so a lone board-meta or connection box never counts); a system board shows no row").

```ts
          {/* BG1 S1 — the row REPLACES FX6 S2c's one-line pointer on an ordinary
              board: that line named two tools and pointed at the sliver; these are
              the doors themselves, in the room. Same gate (`sorted.length === 0`
              — the render list, so a lone board-meta/connection box never counts
              as furniture), same centered placement, same "gone the instant there
              is furniture." The fx6 check it falsifies is PARKED verbatim in
              fx6.mjs with its successor named in bg1.mjs (A4).
              B1 S3/B2 S2 are untouched: a system Board still shows no row at all,
              and the Shelf still carries its own one quiet fact. */}
```

## BoardEditor §58

From `apps/desktop/src/components/BoardEditor.tsx`, line 3209 at `6221e3f0` (the comment that stays: "the nav row recedes with the rest of the framed chrome").

```ts
        {/* ab1.1 R1 (Fable review) — the nav row was the one piece of framed
            chrome that never recessed with the rest of the room. */}
```

## BoardEditor §59

From `apps/desktop/src/components/BoardEditor.tsx`, line 3218 at `6221e3f0` (the comment that stays: "the nest chain, outermost first: each ancestor is pressable and travels straight there, so the way out is one press at any depth; boardNestChain's guarded walk keeps a cyclic graph finite").

```ts
            {/* PW2 S2 (item 128) — THE NEST CHAIN. Once containers hold
                containers, this line is the only thing that answers "where am
                I" without opening anything.

                THE PARENT SEGMENT IS THE DOOR OUT, and that is what keeps the
                recursive container's own test passing: the address stays ONE
                LINE and the way back stays ONE PRESS at any depth. Each
                ancestor is pressable and travels to that board directly, so
                escaping three levels is one press, not three.

                Ordered outermost-first so the line reads the way an address
                reads. `boardNestChain` walks the SAME guarded walker S1 built
                (`getBoardsConnecting`, `seen`-terminated), so a graph that
                arrives already cyclic renders a finite crumb instead of
                hanging the surface — the read-safety half of S1's law, and the
                reason the guard had to land first. */}
```

## BoardEditor §60

From `apps/desktop/src/components/BoardEditor.tsx`, line 3241 at `6221e3f0` (the comment that stays: "ancestors come before the name, and the name itself is the rename control").

```ts
            {/* MERGE NOTE (PW2 x item 133): the nest chain above and the rename
                control below are COMPLEMENTARY — ancestors come before the name,
                and the name itself is now the rename control. PW2's plain title
                span was superseded by item 133 and is dropped; neither side's
                intent is altered. */}
```

## BoardEditor §61

From `apps/desktop/src/components/BoardEditor.tsx`, line 3246 at `6221e3f0` (the comment that stays: "the name is edited where it is displayed: Enter or blur commits, Escape reverts, an empty name reverts; board.text is a pure label, so writing it IS the rename").

```ts
            {/* ITEM 133 — THE NAME IS EDITED WHERE IT IS DISPLAYED. Nick could not
                name a board because a board's name was written once at birth and
                no surface could reach it again. This is that surface: the name in
                the board's own crumb, clicked.
                Enter or blur COMMITS, Escape REVERTS, and an empty name reverts to
                the previous one — a board is never left nameless by a stray click,
                and "clear it to rename it" is not a thing a writer should have to
                discover. Zero schema: `board.text` is a pure label, so writing it
                IS the rename, through the same patchJournalEntry every other edit
                uses. */}
```

## BoardEditor §62

From `apps/desktop/src/components/BoardEditor.tsx`, line 3292 at `6221e3f0` (the comment that stays: "the board keeps its Tools sliver: it is the only home of Add card, New page card, Existing page…, From a deck… and the connections-footer toggle, until they have another").

```ts
        {/* ITEM 83 M11 — R13.iv IS DEFERRED, AND THIS IS WHY.
            M6 removed the board's Tools sliver on R13.iv ("no Tools sliver on
            boards"), because R13 moves the board's acts into the cascade's own
            PAGE and PLAN faces. The Place-page list (R13.ii) was built; the
            ACTS WERE NOT RE-HOMED. The sliver was the only home for Add card,
            New page card, Existing page…, From a deck… and the
            connections-footer toggle, so removing it deleted real capability
            rather than relocating it — and the suite said so immediately, in
            ten separate files (fx13, b1, b2, b3, fx4, fx5, fx6, fx7 S9, m2,
            m4), every one of them reaching for a board tool that no longer
            existed.
            Implementing half of a ruling is worse than deferring it: the
            ruling says the acts MOVE, and until they have somewhere to move
            to, the sliver is where they live. Restored deliberately, with the
            harnesses as the evidence. R13.iv should land in one ticket
            TOGETHER with the Plan face's `＋ New card` and the rest — the
            absence and the new home in the same commit, so no state of the
            tree is ever missing a board's own tools. */}
```
