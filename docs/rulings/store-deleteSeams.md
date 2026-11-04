# Rulings: `apps/desktop/src/store/deleteSeams.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[deleteSeams §n]` points here.

## deleteSeams §1

From `apps/desktop/src/store/deleteSeams.ts`, line 1 at `f079d49e` (the comment that stays: "window.wrizoDelete and window.wrizoDestructive: each delete path is the app's own store function and flushes; every one refuses unless the in-app typed confirmation completed this page session").

```ts
// DELETE FOR GOOD - window.wrizoDelete, the seed's delete paths (docs/plans/delete-for-good.md section 3: the contract with
// scripts/seed/autism-economy.mjs), and window.wrizoDestructive, the in-app confirmation that opens them. Each delete path is the app's own store
// function and flushes before it returns. Every one REFUSES (throws "refused: ...") unless the writer completed the in-app typed confirmation in
// this page session (store/destructiveGate.ts - Fable's change 1): a bare console call can never empty an account.
```
