# Rulings: `apps/desktop/src/store/hiddenMarksEditing.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[hiddenMarksEditing §n]` points here.

## hiddenMarksEditing §1

From `apps/desktop/src/store/hiddenMarksEditing.ts`, line 75 at `7f1c6a84` (the comment that stays: "a caret a CLICK placed is honoured until it moves, so the selectionchange after it does not re-snap it inside the run").

```ts
  // A caret a CLICK placed is honoured until the caret moves elsewhere: the selectionchange that follows must not re-snap it with the
  // keyboard rule and pull it back inside the run the writer clicked past (Nick's live bug, 2026-10-06).
```

## hiddenMarksEditing §2

From `apps/desktop/src/store/hiddenMarksEditing.ts`, line 123 at `7f1c6a84` (the comment that stays: "a typed insertion lands where the caret SETTLES, so whether the async settle ran before the key never changes the text").

```ts
    // SYNCHRONOUS SETTLING (Nick's ruling 2, Oct 16): a typed insertion at a collapsed caret lands where the caret SETTLES (rule 1, or
    // the click's own side), not wherever the browser held it - so whether the asynchronous settle on selectionchange ran before the key
    // no longer changes the text. The same keys give the same text at any speed.
```

## hiddenMarksEditing §3

From `apps/desktop/src/store/hiddenMarksEditing.ts`, line 152 at `7f1c6a84` (the comment that stays: "a paste or drop is captured like typing, so its text is escaped on input").

```ts
    // TYPED-LITERAL (Nick, Oct 16: pasted ** is literal too): a paste or drop is captured like typing, so its text is escaped on input
```
