# Rulings: `apps/desktop/src/components/DestructiveConfirm.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[DestructiveConfirm §n]` points here.

## DestructiveConfirm §1

From `apps/desktop/src/components/DestructiveConfirm.tsx`, line 6 at `e2898deb` (the comment that stays: "the typed confirmation that opens the destructive paths: it unlocks only on the writer's own trusted input (every input event since empty, and the press, must be isTrusted)").

```ts
// DELETE FOR GOOD (Fable's change 1, Oct 18) - the in-app typed confirmation that opens the account-wide destructive paths (store/destructiveGate.ts)
// for this page session. Mounted once (App.tsx), portalled to <body> like the "Send to Trash?" dialog, in its look.
//
// IT UNLOCKS ONLY ON THE WRITER'S OWN INPUT. A page script can fill the field and click the button, but those events carry isTrusted: false. So:
// the field's value counts as typed only while every input event since it was last empty (or wholly replaced by a trusted keystroke) was trusted,
// and the press must be trusted too. submitDestructiveConfirm refuses anything less.
```
