# Rulings: `apps/desktop/src/store/caretOffset.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[caretOffset §n]` points here.

## caretOffset §1

From `apps/desktop/src/store/caretOffset.ts`, line 1 at `7f1c6a84` (the comment that stays: "a linear character offset within a text container, via a TreeWalker over text nodes, so it works for one text node or many").

```ts
// W2 — a generic "linear character offset within a text container" pair,
// shared by every writing surface that needs to save/restore a caret
// position across an unmount (the way back). Works via a TreeWalker over
// text nodes, so it's agnostic to whether the container is a single text
// node (JournalEntry's plaintext-only sheet) or many (ForwardOnlyEditor's
// per-run spans) — the same shape `placeCaretEnd`/`lastBlockRange` already
// use elsewhere in this codebase, generalized to an arbitrary offset.
//
// Fable W2-review advisories (2026-07-13), noted here for the future rather
// than fixed now — neither is a live problem at current scale:
//   A1 — useWayBack calls getCaretOffset on every `selectionchange` (i.e. on
//        every keystroke), walking the TreeWalker from the editor's start
//        each time. Negligible at current node counts (µs-scale). If a
//        future editor structure multiplies text nodes (per-word spans,
//        heavy run-splitting), switch to tracking anchorNode/anchorOffset
//        directly and resolving the linear offset only once, at capture.
//   A2 — setCaretOffset calls el.focus() AFTER addRange (below). Correct in
//        Chromium/Electron — the harness proves the restored offsets land
//        exactly — but if a non-Chromium target ever matters, the safer
//        order is focus-then-range.
```
