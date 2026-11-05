# Wrizo map

Read this page first, then only the page for the area you touch (`docs/map/`). Measured at `dadb7196` (Oct 31, 2026).

## The five laws (Fable, Oct 29)
1. The page is identical in every skin and never moves when a panel opens (the Typewriter zoom excepted).
2. Cards and boards keep the same geometry in every skin.
3. Imply, never literal. Each theme suggests its place (a study, a garden, a desert, an instrument) without on-the-nose props. Contrast floors: page text ≥ 13.9:1, labels ≥ 4.5:1, names ≥ 7:1.
4. No new saved field, mark or key without Nick's word.
5. Theme words only via the lexicon.

**Process:** harness first; the recede rule.

**The recede rule (this page is its source):** While typing, everything off the page goes to opacity 0, except the page, progress strips that are on, and docked panels.

The canon behind them: [page primacy](page-primacy-canon.md), [philosophy](PHILOSOPHY.md), [north star](north-star.md), [Flux](flux-theme-canon.md).
House rules for lanes (branches, the box, `main`): [AGENTS.md](../AGENTS.md).

## Areas

| Area | Main files (under `apps/desktop/src/` unless shown) | Owner (proposal; Fable assigns) | Page |
|---|---|---|---|
| Page / editor | `pages/PageEditor.tsx`, `components/ForwardOnlyEditor.tsx`, `components/ModeStage.tsx`, `components/ScriptEditor.tsx`, `components/Sliver.tsx`, `components/DeskFrame.tsx` | FIX (typing, save), POLISH (look) | [page](map/page.md) |
| Boards | `components/BoardEditor.tsx`, `components/InkStratum.tsx`, `store/ink.ts`, `store/boxTombstones.ts` | INK (pen, graphics), TOOLS | [boards](map/boards.md) |
| Drawers / places | `components/CascadePanels.tsx`, `components/DrawersTree.tsx`, `components/PlacesPanel.tsx`, `store/place.ts`, `store/menusDrawers.ts` | TOOLS | [drawers](map/drawers.md) |
| Themes | `index.css` + `styles/`, `store/theme.ts`, `store/themeCast.ts`, `store/themePrefs.ts`, `store/fontRoster.ts` | POLISH, plus the theme lanes (ARBOR, Machina) | [themes](map/themes.md) |
| Lexicon | `store/deskLexicon.ts`, `store/themeLexicon.ts` | whoever adds a word; POLISH audits | [lexicon](map/lexicon.md) |
| Tutor | `components/Tutor.tsx`, `store/tutorBible.ts`, `store/tutorMeter.ts`, `apps/server/src/tutor.ts` | TOOLS | [tutor](map/tutor.md) |
| Sync / server | `store/persistence.ts`, `store/sync.ts`, `apps/server/src/` | FIX; Chat 1 deploys | [sync](map/sync.md) |
| Harness | `apps/desktop/scripts/harness/`, `scripts/run-suite.mjs`, `scripts/box-take.mjs` | every lane; Chat 1 runs trains | [harness](map/harness.md) |

**Full-pair files** (a change here needs Chat 1's full pair): global CSS (`index.css`, `styles/`), `store/persistence.ts` and anything on save or sync,
`pages/PageEditor.tsx`, `components/ModeStage.tsx`, the typing path (`components/ForwardOnlyEditor.tsx`), and `apps/server/`.

## Who decides
Nick (product, data) → Fable (architecture, rulings, reviews) → Chat 1 (merges, deploys, the ledger `docs/open-threads.md`).
Contracts between Wrizo and its siblings live in `docs/contracts/`; ruling histories moved out of the code live in [docs/rulings](rulings/README.md). The cleanup in progress: [the map](cleanup/cleanup-map.md), [the #13 brief](cleanup/deploy-13-brief.md).

## The shape, in numbers (dadb7196)

| What | Size |
|---|---|
| `apps/desktop/src` (.ts, .tsx, .css) | 268 files, 62,501 lines, 33% comments |
| The 16 heaviest files | 31,141 lines, 39% comments; `index.css` 7,527, `BoardEditor` 3,925, `persistence` 3,679, `deskLexicon` 2,517, `PageEditor` 1,855 |
| `store/` | 135 files, one flat folder |
| `apps/desktop/scripts/harness` | 246 files, 83,454 lines |
| `apps/server/src` | 14 files, 1,933 lines |
| The ledger | 27,249 lines |
| `docs/` | 549 tracked files; the evidence folder (2,832 files, 257 MB) lives in git history since #13 step 4c ([the list](cleanup/c13-4c-evidence-removed.tsv)); new evidence committed is text box logs only ([deploy](deploy.md), "What evidence is committed") |
| `window.wrizo*` hooks | 67, in 32 files (33 in `store/persistence.ts`) |
