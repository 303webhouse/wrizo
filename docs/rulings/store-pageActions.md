# Rulings: `apps/desktop/src/store/pageActions.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[pageActions §n]` points here.

## pageActions §1

From `apps/desktop/src/store/pageActions.ts`, line 6 at `7f1c6a84` (the comment that stays: "the left drawer's actions on a Draft page; every verb calls something that already exists, so the drawer stays presentational and PageEditor adds one call").

```ts
// PHASE 1 (docs/plans/phase1-drawers.md 3.5) - THE ACTIONS the left drawer offers on a Draft page: Tags, Copy, Delete, Header/Footer
// (Nick, Oct 9). Every verb calls something that already exists; this module only wires them, so the drawer component stays
// presentational and PageEditor.tsx (whose typing path is off limits) adds ONE call instead of four handlers.
//
//   Copy           the host's own copy (PageEditor's doCopy, which awaits the clipboard and toasts success or failure);
//   Tags           the host's own addTag/removeTag (the Page face uses the same two);
//   Header/Footer  the page's stored headers + footers flags, both together (they are stored settings; they do not paint on screen);
//   Delete         a SOFT delete to the Trash board - never a hard delete - behind an in-page confirm (the confirm is the component's);
//                  afterwards the writer goes to their most recent surface, or the front door if there is none.
```
