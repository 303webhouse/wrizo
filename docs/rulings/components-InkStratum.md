# Rulings: `apps/desktop/src/components/InkStratum.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[InkStratum §n]` points here.

## InkStratum §1

From `apps/desktop/src/components/InkStratum.tsx`, line 5 at `7f1c6a84` (the comment that stays: "the ink stratum renders in every mode; mode decides permission (edit in INK, inert in TEXT, movable in Draft and Revise); the sheet is the scroller's content wrapper, so ink scrolls with the text; routing lives on the sheet, never a pointer-events flip").

```ts
// ITEM 121 I2 — THE INK STRATUM. The Journal's J-series drawing layer
// (JournalEntry.tsx's own capture pipeline) ported onto the framed Free Write
// page, under R15's analog law: the page is a typewriter for text and a
// journal page / sketch pad for drawing, and this is the second half made
// real. Everything about HOW a stroke is captured, painted, erased, undone and
// persisted is the Journal's, unchanged in kind; what is new is that the page
// has a MODE.
//
// ITEM 126 (121-B) — THE STRATUM NOW RENDERS IN EVERY MODE, because the ink is
// THE PAGE'S, not Free Write's decoration. Item 121's sentence here used to read
// "this layer is inert unless the page says INK"; that was true of the surface
// it shipped on and is false now, so it is corrected rather than left to mislead
// the next reader. What varies by mode is no longer PRESENCE but PERMISSION:
//   edit    — Free Write / INK: draw, erase, undo (item 121, unchanged).
//   inert   — Free Write / TEXT: renders, intercepts nothing. RULED (Fable,
//             2026-09-08): R15 stands, and the asymmetry is the reason, not a
//             hole — in Free Write the sketch pad is one press away, so a
//             typewriter does not move ink; a sketch pad does.
//   movable — Draft and Revise: renders, and a double-click on ink arms a move.
//             There is no INK to switch to in these modes, which is exactly why
//             movable exists here and nowhere else.
// THE LISTENER THAT ARMS A MOVE MUST ATTACH UNDER `movable` ALONE — never
// "whenever the writer is not drawing", which would quietly extend the gesture
// into Free Write's TEXT half and reverse the ruling with nobody typing a word.
//
// ── THE SHEET, AND WHY IT IS NOT THE PAPER COLUMN ─────────────────────────
// The build brief said to mount at `inset:0` on the paper column. That was
// written from the Journal's geometry, where the sheet (`.entry-full`) GROWS
// with its text and the window scrolls, so `inset:0` genuinely covers the
// whole sheet forever. Free Write's paper is not shaped that way: `.mode-page`
// is a FIXED-HEIGHT box (`height:min(60vh,580px)`, `overflow:hidden`) with an
// inner scroller, `.mode-scroll`. A canvas at `inset:0` on the column or the
// page would cover only what is on screen — the writer would scroll, the text
// would move, and the ink would stay nailed to the viewport, so ink drawn
// beside a sentence on screen two would land on top of screen one's ink. That
// is not J9's sheet-anchoring tradeoff; it is a different and worse anchoring
// that no ruling asked for.
//
// So the SHEET here is the scroller's own content wrapper (PageEditor's
// `editorBody` wrap — already `position:relative`, already full-width, already
// growing with the editor), and this layer mounts as its absolutely positioned
// children at `inset:0`. The canvas fills the sheet BY LAYOUT, never by
// script — the anchor law holds, aimed at the right box — and the ink scrolls
// with the text as one sheet, which is what "a transparent sheet laid on the
// page" actually means. See docs/menus/item121-s0-survey.md §3.
//
// ── THE SHEET-ANCHORING TRADEOFF, PORTED KNOWINGLY (J9's own words) ───────
// "Ink anchors to the sheet, not to words — text reflows at another width, ink
// stays where it was drawn." That is inherited deliberately, not overlooked.
// Points are normalized 0..1 BY THE SHEET'S WIDTH and denormalized by the
// current width on BOTH axes (a circle stays a circle); `y` is unbounded above
// 1.0 because a long page is a tall sheet. Word-anchored ink would be a
// different feature and a different ruling.
//
// ── ROUTING LIVES ON THE SHEET, NOT THE CANVAS ────────────────────────────
// Both canvases are ALWAYS `pointer-events:none`, exactly as in the Journal.
// "In INK the layer intercepts everything on the paper" is a mode gate inside
// the sheet's own capture-phase listeners, NOT a `pointer-events` flip: the
// eraser's rubbing model paints onto the committed canvas mid-stroke and the
// hover ring reads positions continuously, and both break the moment a canvas
// starts swallowing events. In TEXT no listener is attached at all, so the
// surface is byte-identical to the page before this ticket.
```

## InkStratum §2

From `apps/desktop/src/components/InkStratum.tsx`, line 108 at `7f1c6a84` (the comment that stays: "where the sheet's TEXT starts, in painted px below the sheet's top: 0 with no top padding (so no saved stroke moves); in the zoom a stroke above the first line has a negative y").

```ts
/** POLISH #10 item 5 (Nick, Oct 25) - where the sheet's TEXT starts, in painted px below the sheet's top: 0 wherever the sheet has no top padding (the
 *  normal view - every stroke already saved was measured from there, so none moves). In the zoom the sheet reaches up over the scroller's start offset
 *  with a matching padding (index.css), so the whole visible page takes the pen; strokes are still measured from the text, and one drawn above the
 *  first line simply has a negative y. */
```

## InkStratum §3

From `apps/desktop/src/components/InkStratum.tsx`, line 130 at `7f1c6a84` (the comment that stays: "measured from the text").

```ts
// POLISH #10 item 5 - measured from the text
```

## InkStratum §4

From `apps/desktop/src/components/InkStratum.tsx`, line 156 at `7f1c6a84` (the comment that stays: "undo is a snapshot of the whole strokes array before the last undoable act, so one mechanism reverses a stroke and a move").

```ts
  // ITEM 126 B4 — UNDO BECOMES A SNAPSHOT, and that GENERALIZES item 121 rather
  // than changing it. It used to be `slice(0, -1)` — drop the last stroke — which
  // cannot express "put that drawing back where it was". One level is unchanged;
  // what the level holds is now the whole strokes array as it stood before the
  // last undoable act, so one mechanism reverses a stroke AND a move. For a
  // stroke-add the observable result is identical to the slice it replaces.
```

## InkStratum §5

From `apps/desktop/src/components/InkStratum.tsx`, line 210 at `7f1c6a84` (the comment that stays: "capture attaches only under `edit`; capture-phase on the sheet, an ancestor, so it runs before ForwardOnlyEditor's pen seal and stops it only while the page is inking").

```ts
  // ── CAPTURE ───────────────────────────────────────────────────────────────
  // Attached ONLY under `edit`. Under `inert` and `movable` this effect returns
  // before adding anything, so Free Write's TEXT half behaves exactly as it did
  // before item 121 — including keeping ForwardOnlyEditor's I0 pen seal fully in
  // force — and Draft and Revise never gain a drawing pointer at all. Item 126
  // gives those two modes a MOVE gesture, not a pen (B3/B4); nothing here.
  //
  // In INK the listeners are capture-phase and non-passive on the SHEET (an
  // ANCESTOR of the editor). Capture runs root→target, so this fires BEFORE
  // ForwardOnlyEditor's own capture-phase `neutralizePen`, and stopPropagation
  // means that seal simply never runs while the page is inking. That is why
  // opening the seal needed no edit to ForwardOnlyEditor at all: nothing about
  // its behaviour changes, it just stops being reached on this one surface in
  // this one mode. R15 is the ruling that narrowed "ink is sealed in the
  // Journal" — see that file's own I0 comment, amended in place to say so.
```

## InkStratum §6

From `apps/desktop/src/components/InkStratum.tsx`, line 238 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
// POLISH #10 item 5
```

## InkStratum §7

From `apps/desktop/src/components/InkStratum.tsx`, line 239 at `7f1c6a84` (the comment that stays: "pressure is captured but not yet read by the renderer, so a later pressure slice has data").

```ts
      // Pressure is captured, as it always has been, and deliberately NOT read
      // by the renderer this wave (item 121 I5 ships pressure-blind; pressure
      // rides a later slice). Capturing it now means that slice has data.
```

## InkStratum §8

From `apps/desktop/src/components/InkStratum.tsx`, line 271 at `7f1c6a84` (the comment that stays: "measured from the text").

```ts
// POLISH #10 item 5 - measured from the text
```

## InkStratum §9

From `apps/desktop/src/components/InkStratum.tsx`, line 322 at `7f1c6a84` (the comment that stays: "the toggle is the guaranteed path; the eraser tip (buttons bit 32) is a bonus; the barrel button is left unread").

```ts
      // J2 — the toggle is the guaranteed path; the hardware eraser tip is a
      // bonus signal on top of it. Per the Pointer Events spec the eraser end
      // reports pointerType 'pen' with the eraser-button bit (32) set in
      // `buttons`. The barrel button is NOT read here: it stays
      // hardware-reserved by ruling, an open word this wave does not spend.
```

## InkStratum §10

From `apps/desktop/src/components/InkStratum.tsx`, line 331 at `7f1c6a84` (the comment that stays: "an eraser carries no tip, nib or ink: the geometry is the whole of it").

```ts
        // An eraser carries no tip, nib or ink — J2's geometry is the whole of
        // it, and the eraser is tip-agnostic AS BUILT (the pencil-only reading
        // is an open word for Nick; deliberately not built).
```

## InkStratum §11

From `apps/desktop/src/components/InkStratum.tsx`, line 341 at `7f1c6a84` (the comment that stays: "best effort only: move and release are heard on window, so a capture that fails or does not reroute can no longer lose a stroke").

```ts
      // BEST-EFFORT, AND NO LONGER LOAD-BEARING (item 126, measured): the
      // stroke's move and release are heard on WINDOW (below), so this call
      // failing — or succeeding and then not rerouting the release, which is
      // what a trusted mouse drag was measured doing — can no longer lose a
      // stroke. It stays for cursor and hover consistency only.
```

## InkStratum §12

From `apps/desktop/src/components/InkStratum.tsx`, line 466 at `7f1c6a84` (the comment that stays: "the move attaches only under `movable` (Draft and Revise), never "whenever not drawing", which would reach Free Write's TEXT half; it listens on the sheet so the text keeps every click").

```ts
  // ── ITEM 126 B4 · THE MOVE (permission: movable) ─────────────────────────
  //
  // Attached ONLY under `movable`, which is reachable ONLY from Draft and Revise
  // (PageEditor derives it by falling PAST Free Write). That is the ruling made
  // structural: a listener armed by "the writer is not drawing" would extend this
  // gesture into Free Write's TEXT half and reverse R15 with nobody typing a word.
  //
  // THE CANVAS STAYS INERT. Everything here listens on the SHEET, as item 121's
  // routing law requires — and it must, because the text underneath has to keep
  // receiving every click it would otherwise get.
```

## InkStratum §13

From `apps/desktop/src/components/InkStratum.tsx`, line 489 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
// POLISH #10 item 5
```

## InkStratum §14

From `apps/desktop/src/components/InkStratum.tsx`, line 517 at `7f1c6a84` (the comment that stays: "measured from the text").

```ts
// POLISH #10 item 5 - measured from the text
```

## InkStratum §15

From `apps/desktop/src/components/InkStratum.tsx`, line 535 at `7f1c6a84` (the comment that stays: "a double-click on ink arms its group; one on bare text does nothing at all, so the browser's word selection stands").

```ts
    // THE GESTURE. A double-click that lands ON INK arms its group; one that
    // lands on bare text does NOTHING AT ALL — no preventDefault, no
    // stopPropagation — so the browser's own word-selection happens exactly as
    // it always has. That miss-path is not politeness: it is Nick's "text is
    // only editable by standard in-line word processing led by a cursor",
    // and it is the clause an over-eager listener breaks first.
```

## InkStratum §16

From `apps/desktop/src/components/InkStratum.tsx`, line 603 at `7f1c6a84` (the comment that stays: "merged with live text by the host, exactly as a stroke is").

```ts
      // Merged with live text by the host, exactly as a stroke is (item 121 I2).
```

## InkStratum §17

From `apps/desktop/src/components/InkStratum.tsx`, line 665 at `7f1c6a84` (the comment that stays: "one level, the last stroke only: Free Write is forward-only, so typing is not undoable and does not consume it").

```ts
  // ── UNDO ─────────────────────────────────────────────────────────────────
  // One level, the last STROKE only. The Journal's undo is unified across a
  // typed run and a stroke because the Journal's own editable records typed
  // runs; Free Write's does not, and must not — it is FORWARD-ONLY, and the
  // undo/redo stack ForwardOnlyEditor carries (FX6 S1) is gated to the
  // free-edit modes (Draft, Revise) by that law. Inventing a typed-run undo
  // here to satisfy "unified" would breach forward-only permanence, which is a
  // far older ruling than this wave. So: the pen gets an undo, the typewriter
  // keeps its permanence, and the affordance lives with the ink — visible in
  // INK only. Typing does not consume it, because typing is not undoable here.
```
