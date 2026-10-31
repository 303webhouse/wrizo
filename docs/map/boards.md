# Boards

**What lives here:** boards and their boxes (text, pin, ink), cards, connectors, pinned pages, and the pen.
**Owner (proposal):** INK for the pen and graphics, TOOLS for the rest. **Back to** [MAP](../MAP.md).

## Entry files
- `components/BoardEditor.tsx`: geometry constants, the three box renderers, `BoardCardPopup`, then `BoardEditor` (gestures, autosave, selection, connectors, menus).
- `components/InkStratum.tsx` and `store/ink.ts`: the pen layer and inks.
- `store/boxTombstones.ts`, `store/boardMode.ts`, `store/boardKind.ts`, `store/boardStructure.ts`, `decks/rowFit.ts` (deck rows).
- Board storage lives in `store/persistence.ts` (boards, page links, pins).

## Seams and hooks
`window.wrizoBoard`, `window.wrizoPinPageToBoard`, `window.wrizoStoredBoxes`, `window.wrizoCopyCardToBoard`,
`window.wrizoSetPinDisplayed`, `window.wrizoApplyRemoteBoard`, `window.wrizoBoardMode`, `window.wrizoStructure`.

## Full pair
Gesture and pen code is gesture-latency territory, and board saves are save/sync: both run the full pair.

## Covering harnesses (start here)
`board-context-menu.mjs`, `j4.mjs`, `ab4.mjs`, `fx5.mjs`, `fx7.mjs`, `guided-w1.mjs`, `guided-w3-part2.mjs`, `b1.mjs`.

## Known traps
- **`penStroke` y is a fraction of HEIGHT; the stored y is a fraction of WIDTH.** Convert, never copy.
- **A gesture leaves a selection, and a native drag then cancels the next gesture.** Clear the board selection; portal the overlays.
- **Board population matters:** item 118's repro needed a populated board, not a different pointer type.
- **Release where the writer releases:** gesture checks also release outside the element.
- **Cards and boards keep the same geometry in every skin** (law 2).
