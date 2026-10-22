# big-projects step 3 (Grafts): the file split with INK's step 1a

**Status: a proposal for INK. No code until INK agrees (Fable, Oct 19: "plan the file split with INK before coding").**
**Lanes:** FIX builds step 3 (`docs/plans/big-projects.md` section 3, step 3, and the graft-doors addendum, mockup `cursor/graft-doors-mockup` @ c4f34eb0) on branch `big-projects-3`. INK builds step 1a beside it.
**Base:** `main` @ e60da38d (delete-for-good merged, connector-b deployed). FIX rebases onto 1a when 1a lands.

## The rule I am working to (Fable)
FIX stays out of INK's files: `components/Cascade.tsx`, `components/CascadePanels.tsx` and `store/place.ts`. For place labels FIX reads drawer and binder names directly until 1a lands, then rebases.

## Drift from the plan, read on disk at e60da38d
1. **`patchPageSettings` is not a store seam.** It is a closure inside `pages/PageEditor.tsx` (line 1236): `saveJournalEntry({ ...entry, pageSettings: { ...base, ...next } })`. The Grafts panel lives in the right drawer (`components/Tutor.tsx` line 1337 mounts `ConnectionsDrawerPanel`), outside PageEditor, so it cannot reach that closure. Step 3's hide and unhide therefore need one store function that does the same spread. Same column, same shape: **schema change: none**, as cleared.
2. **The plan puts `searchGraftables`, the place labels and the shared-tags reader in `store/place.ts`.** Under Fable's rule they go in a NEW FIX file instead (below). After 1a lands, the place label switches to INK's `placeOfEntry`, a single call site.
3. **`ConnectionsDrawerPanel` is card-scoped today.** On a board it lists the selected card's peers; on a page it shows only the empty line. Step 3 gives it a subject: the open page, or the open board. The panel reads that itself, from the route and the board snapshot, so **`Tutor.tsx` (step 1c's file) is not touched.**

## Files FIX touches (step 3)
| File | What | Shared with 1a? |
|---|---|---|
| NEW `store/grafts.ts` | `searchGraftables(query, subjectId)`, `placeLabelOf(entry)` (drawer/binder names read directly; becomes `placeOfEntry` after 1a), `isGrafted`, the plan-card readers and the hide/unhide pair (`saveJournalEntry` over `pageSettings.hiddenPlanCards`), the shared-tags reader, Sources sorting (Q7) | no |
| NEW `components/GraftPicker.tsx` | "+ Graft..." picker: search, Cards / Pages / Boards, place labels, a check mark on grafted rows (inert, Q10), "Came from" top row (reads the router's `fromBoardId` / `fromBoardTitle` state itself) | no |
| `components/ConnectionsDrawerPanel.tsx` | "Connected to [subject]", the plan-board folded row, the groups, "+ Graft...", keeps connector-b's X / "Remove graft?" / tombstone | no |
| `components/BoardEditor.tsx` | the brass graft knob: `enterConnect` from a new origin point (`placeArm` / `cornerClient` / `onModeCircle` take an origin) | no (1a does not list it) |
| `store/pageDefaults.ts` | `dressOnly` strips `hiddenPlanCards` | no |
| `types/index.ts` | `PageSettings.hiddenPlanCards?: string[]` (a type only) | 1a may add types; different interface |
| `store/deskLexicon.ts` | step 3's Arbor terms, in ONE block placed directly after connector-b's `links*` keys (type union and object) | **yes: append-only, different anchors** |
| `index.css` | one block placed directly after the `.wz-links-*` rules (`.board-graft-knob`, the picker, the groups) | **yes: append-only, different anchors** |
| NEW `scripts/harness/big-projects-3.mjs` + its browserless half | checks first, red | no |

## Files FIX does NOT touch
`Cascade.tsx`, `CascadePanels.tsx`, `store/place.ts`, `store/persistence.ts` (all step 3 store code goes in `grafts.ts`, built on the exported readers `getPageLinksOf`, `getPageLinksTo`, `getLinkPeersOfCard`, `addPageLink`, `removePageLink`, `getPlanBoardId`, `getPairedPageId`, `saveJournalEntry`), `store/sync.ts`, `App.tsx`, `store/lastPlace.ts`, `components/LandingGate.tsx`, `PlaceBlock` / `PlaceSwitcher` / `SectionsPopout`, `DeskRail.tsx`, `Tutor.tsx`, `pages/PageEditor.tsx`.

## Asks of INK
1. Keep 1a out of `ConnectionsDrawerPanel.tsx`, `BoardEditor.tsx`, `store/pageDefaults.ts`, and the `PageSettings` interface.
2. In `deskLexicon.ts` and `index.css`, put 1a's additions in their own blocks, away from connector-b's `links*` keys and `.wz-links-*` rules, so the two branches cannot conflict.
3. **The knob's second landing target** is "a Pages / Boards pop-out row". The connector finds any element carrying `data-link-entry` (connector-b's rail contract, which 1a already keeps on its new rows), so step 3 needs nothing more from 1a. Before 1a the knob lands on today's rail thumbnails; after 1a, on the pop-out rows.
4. **`placeOfEntry`:** when 1a lands, FIX's `placeLabelOf` becomes a call to it. Its return shape (a label string, or `{ kind, name }`) is INK's call; FIX adapts on the rebase.
5. If 1a must touch any FIX file above, say which and why, and FIX will rebase around it instead.
