# Rulings: `apps/desktop/src/store/lineRows.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[lineRows §n]` points here.

## lineRows §1

From `apps/desktop/src/store/lineRows.ts`, line 1 at `7f1c6a84` (the comment that stays: "each logical line is its own inline-block row (`wz-row`, contain: layout style) with the '\n' left between rows, so textContent, innerText and copied text are byte-identical to one block while a keystroke lays out one row").

```ts
// TYPING-LATENCY STEPS 2-4 (Fable, approved 2026-10-13; row shape F ruled 2026-10-14): THE PAGE'S ROWS AND ITS SHADOW LINES.
//
// THE ROWS. The page's free-edit surface (Draft, Revise) was ONE pre-wrap block holding every line, so a single typed character
// made the browser lay out, and the editor re-decorate, the whole page - at 50k words a keystroke cost about a second. Each logical
// line is now its own row: `<span class="wz-row">` (an INLINE-BLOCK, width 100%, `contain: layout style` - index.css), with the
// '\n' that separates two lines left BETWEEN the rows as a bare text node, exactly where today's text had it. That is the shape
// variant F measured (docs/evidence/latency-profile-eb27ea7c): textContent, innerText and the text a writer copies out are all
// byte-identical to the one-block page, so every reader of the editor - the product's and the 88 harness files' - reads the same
// characters it always did. (E's display:block rows were the other candidate: the innerText rules put a line break at every block
// boundary, so a writer's copied text would have gained a blank line per paragraph.) The EOF guard (draftDecoration.ts) lives INSIDE
// the trailing empty row, not after it: a guard after a width:100% inline-block is laid out at the right edge, so Enter paints the caret there.
//
// THE SHADOW LINES. `lines` mirrors the page's text, one string per row; `starts` holds each line's offset. A keystroke reads ONLY
// the rows its edit touched (the selection's lines, captured at beforeinput), and a caret offset is the edited row's own local walk
// plus that row's start - no pass from the top of the page. The shadow is a CACHE, never what gets saved: what is saved is still the
// text the editor reports through onChange, and a reader that cannot trust the map (an IME composition in flight, or the moment
// between a native edit and the re-render that follows it) falls back to today's whole-page walk, which is correct for any DOM.
// Harnesses set `window.__wzVerifyRows`: every render then compares the shadow with the DOM, logs `WZ-ROWS-MISMATCH` on any
// difference, and RESYNCS from the DOM, so typing carries on and the run reports it.
//
// THE BOARD CARD keeps today's single-block path: a card is small, and nothing here is attached to it.
```

## lineRows §2

From `apps/desktop/src/store/lineRows.ts`, line 82 at `7f1c6a84` (the comment that stays: "no content-visibility here: a skipped row carries no text for innerText, Ctrl+End left the caret off screen, and the way-back restored scroll over estimated rows").

```ts
// (content-visibility and the per-row size estimates it needed were REMOVED on Fable's ruling of Oct 16 - see index.css: a skipped row
// carries no text for innerText, Ctrl+End left the caret off screen, and the way-back restored the scroll over re-estimated rows.)
```
