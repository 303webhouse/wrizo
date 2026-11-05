# Rulings: `apps/desktop/src/store/boxTombstones.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[boxTombstones §n]` points here.

## boxTombstones §1

From `apps/desktop/src/store/boxTombstones.ts`, line 3 at `7f1c6a84` (the comment that stays: "card tombstones: a deleted card is stamped deletedAt in place (zero schema); liveBoxes is the one definition of hidden and mergeBoxLists the one merge; a connection is hidden while either endpoint is").

```ts
// BOARD CONTEXT MENU - card tombstones (Fable/Nick, Oct 15). A card deleted from a board is NOT removed from the board's `boxes`: it is stamped `deletedAt` IN PLACE (zero schema - `boxes` is jsonb and
// the server stores it as-is). This module is the one definition of what "hidden" means; every reader of a board's boxes goes through `liveBoxes`, and every merge goes through `mergeBoxLists`.
//
//   LIVE        no deletedAt, no purgedAt.                                         drawn, counted, linked, exported.
//   TOMBSTONED  `deletedAt` set (and `updatedAt` stamped with it).                 hidden everywhere; listed on the Trash board; Restore clears the flag (and stamps `updatedAt`).
//   PURGED      `{ id, kind, purgedAt }` and zeros - a marker, nothing else.       final. Permanently deleting from Trash replaces the box with one, so a stale save cannot resurrect it.
//   A CONNECTION box is hidden while EITHER endpoint is hidden - it is never edited or deleted when a card goes, so it comes back on Restore with no dangling line or footer.
//
// THE PER-BOX CHANGE TIME decides every merge (a stale tab's save, a sync pull): `changedAt(b)` = the latest of its updatedAt / deletedAt / purgedAt. A newer Restore beats an older tombstone and a
// newer tombstone beats an older live copy - and a box with no stamp at all (every card that predates this) counts as the oldest. A purged marker beats everything.
```
