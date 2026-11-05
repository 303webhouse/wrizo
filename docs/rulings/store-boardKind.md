# Rulings: `apps/desktop/src/store/boardKind.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[boardKind §n]` points here.

## boardKind §1

From `apps/desktop/src/store/boardKind.ts`, line 4 at `7f1c6a84` (the comment that stays: "board kinds and home views, pure: a Board or a Book; a Deck is a Board whose home view is the Walk; the Journal's kind is derived, never stored; no field = a Board opening in Open (no migration); the door chooses").

```ts
// W1 - BOARD KINDS AND HOME VIEWS (Nick's option C; brief docs/guided-paths/w1-walk-brief.md). Pure: reads and writes only the board-meta box inside a board's own `boxes`; nothing here touches a store or the DOM.
//
//   Two true kinds: a BOARD (Open / Storyboard / Outline / Walk) and a BOOK (Flip / Thumbnails / Open - Flux Playback / Index / Live). A DECK is a Board whose home view is the Walk, born from a Preset. The JOURNAL is a Book - its kind is DERIVED from
//   board-meta.systemKind === 'journal' and never stored on it. Saved data: `boardKind` and `homeView`, optional, additive, on board-meta (types/index.ts). No field = a Board that opens in Open: no migration.
//   The DOOR chooses, never a picker (doorHome): New Board -> Open; a Preset -> a Deck (Walk); New Journal -> a Book (Flip - no such door exists yet).
```

## boardKind §2

From `apps/desktop/src/store/boardKind.ts`, line 14 at `7f1c6a84` (the comment that stays: "a Book's views: Flip and Thumbnails, and Open (the Journal's own canvas of page-pins stays reachable); its home view stays Flip").

```ts
// a Book's views: Flip and Thumbnails, and OPEN - the Journal's own canvas of page-pins stays reachable (Fable, Oct 23). Its home view stays Flip.
```
