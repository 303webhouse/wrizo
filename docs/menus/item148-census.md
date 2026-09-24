# ITEM 148 — THE SEAM CENSUS, RE-DERIVED (tools lane; branch `item147-148-guards`, main @ 5f0691f)
### Census only. No guard built yet. ERRATA's offer (`origin/item148-seam-durability`, 41 seams / 23 files) was read for reasoning; every number below was re-measured on the current tree.

**Population:** 40 `wrizo*` seams attached by `window` cast / `seams.` / `.wrizoX =` across **21 files**, plus 2 `__wrizo*` (`__wrizoRhizomeEngine`, `__wrizoRouteForEntry`, both read-only). `seed-guard.mjs`'s durability check opens **`persistence.ts` only** and matches the verb prefix `Create|Patch|Set|Pin`.

**persistence.ts, 20 seams (measured by brace-matched body):**
- DURABLE (route through `durableSeam`/`durable`): 14 — `CreateJournalPage, SetPinDisplayed, CopyCardToBoard, PinPageToBoard, SetPageHome, PatchEntry, CreateProject, CreateBinder, PatchProject, CreateStoryPlan, SetCurrentBeat, SetBeatStatus, CreateDrawer, SetProjectDrawer`. (14 + FlushNow + TouchInOrder + Notebook/Derived/Dirty + Pairing = 20.)
- `wrizoFlushNow` — *is* the flush.
- `wrizoTouchInOrder` — **invisible to the guard by verb (`Touch`)**, and flushes by a direct `flushNow()` at its end. Lawful today; the guard cannot see that it is, and would red it if it were in scope (it does not say `durable(`).
- Read-only: `wrizoNotebook`, `wrizoDerived`, `wrizoDirty`.
- **`wrizoPairing` (namespace): `birth` / `pair` / `unpair` WRITE** (`saveJournalEntry` → `scheduleFlush`, debounced) and nothing flushes them. The seam's name carries no verb, so the guard has never seen it. `bm1` drives it.

**Outside persistence.ts (20 seams, 20 files never opened):**
- **`wrizoBible` (`tutorBible.ts`): `add` / `edit` / `delete` WRITE via `saveProject` (debounced, unflushed)** — a real durability footgun in a file the guard never reads.
- Sync `localStorage` writers of their own key (immediate; lawful): `wrizoTheme.set`, `wrizoThemePrefs.set`, `wrizoAmbiance`, `wrizoSectionFold`, `wrizoBoardMode`, `wrizoPlanTrail.rememberLastPlanBoard`.
- Everything else read-only or in-memory (`wrizoBoard, wrizoStructure, wrizoResume, wrizoVocab, wrizoLexicon, wrizoDeskLexicon, wrizoDecks, wrizoAssist, wrizoFluxFx, wrizoThemeFx, wrizoFirstLineInvite, wrizoTutorFreeWriteDeck, wrizoTutorSessionCost`) — each still owes a checked claim, not an assumed one.

**Three ways the current guard is blind, each with a live instance:** by verb (`wrizoTouchInOrder`), by file (`wrizoBible`), by shape (`wrizoPairing`'s members). ERRATA's diagnosis stands on the current tree. `wrizoCopyCardToBoard` (which ERRATA's merge-order note was about) is on main and durable — no table-entry ordering constraint remains.

**Proposed guard (not built):** invert it — every seam in every file is durable or a named exemption with a written reason, and each exemption's claim is checked: "read-only" must reach no debounced writer (derived as a fixpoint from `scheduleFlush()` callers, never a listed set), "sync-write" must write its own key and reach no debounced writer, a namespace lists every member as writer or reader. Must-shows once writers flush: `bm1`, `item97`, `tu5`, `b2`, `fx9`, `item85c`. Fix candidates the guard will force: wrap `wrizoPairing`'s three writers and `wrizoBible`'s three (`durable()` each), and let `wrizoTouchInOrder`'s direct `flushNow()` count as durable.

**Wrapping the two unflushed namespaces changes product code's test seams only** (window-attached test seams; no app code calls them). No browser run has happened.
