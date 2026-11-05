# Rulings: `apps/desktop/src/store/deleteGate.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[deleteGate §n]` points here.

## deleteGate §1

From `apps/desktop/src/store/deleteGate.ts`, line 3 at `e2898deb` (the comment that stays: ""Ask before deleting": every delete goes through requestDelete; the flag is per device (localStorage) - absent means ask; only an explicit '0' stops asking").

```ts
// BOARD CONTEXT MENU - "Ask before deleting" and the one gate every delete goes through (Nick, Oct 15).
//
//   Every delete - a card, a Page, a board, from a menu, from the Delete key, from a Drawers row - calls `requestDelete(run)`. If the writer still wants to be asked, the "Send to Trash?" dialog
//   (components/DeleteDialog.tsx) opens and `run` waits for its Delete; if they ticked "Don't ask me again" on an earlier confirmed Delete, `run` happens at once. ONE setting for every kind of delete,
//   reversible in Settings ("Ask before deleting"). Exempt (they never come here): an empty new card closing and discarding itself, and unlinks.
//
//   The flag is PER DEVICE (localStorage) - Fable's ruling: it would have needed the users.page_defaults jsonb, whose client store strips non-dress keys and replaces the whole object on save, so a flag
//   there would be wiped by "reset my defaults". Absent = ask (the safe default); only an explicit '0' stops asking.
```
