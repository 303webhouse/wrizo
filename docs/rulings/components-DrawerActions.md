# Rulings: `apps/desktop/src/components/DrawerActions.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[DrawerActions §n]` points here.

## DrawerActions §1

From `apps/desktop/src/components/DrawerActions.tsx`, line 7 at `e2898deb` (the comment that stays: "the drawer's ACTIONS: Tags, Copy, Delete, Header/Footer, wired by store/pageActions.ts; Delete goes through the one "Send to Trash?" dialog every delete uses").

```ts
// PHASE 1 - the ACTIONS section of the left drawer (Draft): Tags, Copy, Delete, Header/Footer, in that order, as icons with a name.
//
// Presentational. What each one does is wired by store/pageActions.ts from the host's existing handlers. Two of the four open a small
// area INSIDE the drawer (never a dialog, never a route): Tags opens its editor, Delete opens its confirm. At most one is open at a
// time. A chosen/open one wears a brass OUTLINE and nothing else (no fill).
//
// DELETE IS A SOFT DELETE TO THE TRASH, AND ASKS FIRST - THROUGH THE ONE DIALOG (Nick/Fable, Oct 16): the Delete icon calls requestDelete(...), the same "Send to Trash?" (Cancel / Delete / "Don't ask me again") every
// other delete uses; with asking turned off (the one setting, "Ask before deleting") it sends the page to Trash at once. The in-page "Send this page to Trash?" confirm this section used to carry is RETIRED - one
// pop-up for every delete. Nothing is deleted until the dialog's Delete.
```
