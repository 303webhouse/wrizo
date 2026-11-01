# Tutor

**What lives here:** the Tutor dock, its asks and presets, the Bible, the cost meter, the free-write deck, and the server route that calls the model.
**Owner (proposal):** TOOLS. **Back to** [MAP](../MAP.md).

## Entry files
- `components/Tutor.tsx`: assembly helpers (delta, selection cap, Bible), dock geometry, presets, then the `Tutor` component.
- `store/tutorBible.ts`, `store/tutorMeter.ts`, `store/tutorFreeWriteDeck.ts`, `store/tutorLenses.ts`, `store/tutorHistory.ts`, `store/aiAssist.ts`.
- `apps/server/src/tutor.ts`: the server side.

## Seams and hooks
`window.wrizoBible`, `window.wrizoTutorFreeWriteDeck`, `window.wrizoTutorSessionCost`, `window.wrizoAssist`.

## Full pair
The client dock takes the default leg. `apps/server/src/tutor.ts` is server code: full pair, and Chat 1 deploys it.

## Covering harnesses (start here)
`tu1.mjs`, `tu2.mjs`, `tu5.mjs`, `fx10.mjs`, `item84.mjs`, `item84b.mjs`.

## Known traps
- **The Tutor is a tool, not a page:** the dock overlays, never displaces the page (law 1).
- **The Bible is the writer's alone** (ledger, the Bible ruling).
- **Item 113's prompt amendment** is specified, but nothing yet enforces the client and server mirror. Change both together.
- **The model key lives on Railway.** Check secrets by presence only, never by printing a value.
- **#13 step 12b** removes the Tutor nudges (`store/tutorNudges.ts`) ([brief](../cleanup/deploy-13-brief.md)).
