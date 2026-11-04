# Rulings: `apps/desktop/src/store/destructiveGate.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[destructiveGate §n]` points here.

## destructiveGate §1

From `apps/desktop/src/store/destructiveGate.ts`, line 1 at `f079d49e` (the comment that stays: "the gate on the account-wide destructive paths: they refuse unless the in-app typed confirmation completed this page session with trusted input; the unlock is memory only; the harness unlock works only on a local host").

```ts
// DELETE FOR GOOD (docs/plans/delete-for-good.md; Fable's change 1, Oct 18) - THE GATE on the account-wide destructive paths (window.wrizoDelete,
// window.wrizoSeed): they refuse unless the writer completed the IN-APP typed confirmation in this same page session.
//
//   - The confirmation is the app's own dialog (components/DestructiveConfirm.tsx), opened by requestDestructiveConfirm. It unlocks only when the
//     writer TYPES the exact phrase and PRESSES the button: the dialog reports whether each was trusted (a person's input, not a page script's -
//     a script can fill the field and click the button, but those events carry isTrusted: false), and submitDestructiveConfirm refuses unless both
//     were. A bare console call to a gated path refuses outright.
//   - The unlock lives in this module's memory only - never in storage - so a reload (a new page session) locks it again.
//   - The harness has its own test-only unlock, which works ONLY on a local host (127.0.0.1 / localhost): a deployed origin can never take it.
```
