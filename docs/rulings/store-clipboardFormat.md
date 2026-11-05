# Rulings: `apps/desktop/src/store/clipboardFormat.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[clipboardFormat §n]` points here.

## clipboardFormat §1

From `apps/desktop/src/store/clipboardFormat.ts`, line 1 at `e2898deb` (the comment that stays: "a copy puts two formats on the clipboard - plain characters for other apps and Wrizo's markup for Wrizo - both from the one reader (markRuns), line by line, so they cannot disagree").

```ts
// IN-APP-COPY-FORMAT, THE COPY HALF (Nick's ruling, Oct 16; docs/in-app-copy-format-plan.md @ f2a9f956). A copy from a writing surface
// puts TWO formats on the clipboard: the PLAIN characters for every other app, and Wrizo's own stored MARKUP for Wrizo (the paste half,
// which reads it back, is its own ticket). A native copy carried the hidden marks and typed-literal's escape backslashes - they are hidden
// with font-size 0, never display:none, so the browser copied them: a typed `*sigh*` reached an email as `\*sigh\*`.
// Both formats come from the ONE reader (store/markRuns.ts), line by line, so they cannot disagree:
//   - plain: each line's visible characters inside the selection - no structure token, no mark, no escape (what Copy My Words reads);
//   - fragment: the selection's stored markup, balanced. A run the selection cuts is closed and reopened at the cut (after a leading
//     space, before a trailing one: a mark beside a space does not pair); an edge never splits a mark or an escape; the first line's
//     structure tokens come only when the selection starts at that line's start (Q2, Fable, Oct 16).
// Every fragment line is checked against its source before it is written: if it would not read back as the same characters with the same
// styles, that line is written as literal text instead (escaped, so it can never become markup). Nothing styled is ever invented.
```

## clipboardFormat §2

From `apps/desktop/src/store/clipboardFormat.ts`, line 133 at `e2898deb` (the comment that stays: "write both formats and record the PLAIN text as the writer's own ink, so pasting it back passes the Voice Wall; no text/html is written").

```ts
/** Write a copy's two formats into a copy or cut event's clipboard (the caller prevents the native copy), and record the plain text as the
 *  writer's own ink: the Voice Wall's capture-phase observer has already recorded the DOM selection, hidden marks and all, and a paste
 *  carries the plain text - so the shadow must be the plain text, or pasting your own words back would be blocked. No text/html is written:
 *  other apps get the plain characters (the ruling). */
```

## clipboardFormat §3

From `apps/desktop/src/store/clipboardFormat.ts`, line 143 at `e2898deb` (the comment that stays: "the paste half: the Voice Wall runs first; Wrizo's markup is used only when the envelope reads and the markup shows exactly the characters a literal paste would, otherwise the paste is literal").

```ts
// ---- THE PASTE HALF (Fable, Oct 16: Wrizo's markup is used only when the paste passes the Voice Wall and the markup matches its plain
// text; otherwise the paste is literal). The Voice Wall stays the surface's own and runs FIRST: a paste it blocks never reaches here. Two
// trust tests follow: the envelope's (readEnvelope) and the page's (pasteEdit) - the markup must read, beside the text it lands in, as
// exactly the characters a literal paste would show, or the literal paste is what happens.
```
