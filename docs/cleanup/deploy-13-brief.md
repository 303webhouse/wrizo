# Deploy #13 brief: the codebase cleanup, step by step

**From:** POLISH, Oct 29, 2026, on Fable's rulings of the same day. **Source:** `docs/cleanup/cleanup-map.md` (accepted), measured at `bc6cf256`.
**Shape:** one step = one branch = one proof. Every step preserves behaviour. Each step's proof is named before the work starts, and the proof is
run red-capable: it must be able to fail, and that is shown, before it is used to say green.
**Freeze window (accepted):** from step 1 to the #13 deploy, only #13 branches merge to `main`. Hot fixes go through Chat 1 and are rebased into the next step.

## Fable's rulings (Oct 29) that this brief carries
1. **Comments.** A comment stays only if it explains **why** non-obvious code is as it is, and it cites the ruling id (e.g. `// page-size §2`).
   Ruling histories (SUPERSEDED / PARKED narration, who said what and when) move, verbatim, to `docs/rulings/`.
2. **Ledger.** It becomes open items + monthly archives. Chat 1 executes.
3. **AGENTS.md.** Fix the `packages/core` line: the layout section must match the tree.
4. **Branches.** Delete merged remote branches. Tag each unmerged one `archive/<name>` before deleting it. Prune merged worktrees.
5. **MAP.md's five laws:**
   1. the page is identical in every skin and never moves when a panel opens (the Typewriter zoom excepted);
   2. cards and boards keep the same geometry in every skin;
   3. square edges, no shadows, contrast floors 13.9 / 4.5 / 7;
   4. no new saved field, mark or key without Nick's word;
   5. theme words only via the lexicon.

   **Process:** harness first; the recede rule.
6. **Freeze window:** accepted.
7. **The dormant list (Nick, Oct 29, relayed by Fable):**
   - **DELETE:**
     1. the old project screens (ProjectHome, Structure Wizard, Beat Wizard, Structure Board, Quick Sprint), with their routes and doors;
     2. the homepage "testament";
     3. the Tutor nudges;
     4. the narrow rail's Library slot.
   - **Fragments:** delete the code, and leave the stored data and the column untouched.
   - **KEEP** the custom dictionary, hidden.

   **Every harness that reads a deleted file is parked BEFORE the delete** (step 12).

## The common contract (every step)
- **Branch** `c13-<n>-<slug>` off the current `origin/main`, pinned by SHA in the report. Own worktree.
  When rebasing, push a new name (`-r`) and never force-push.
- **No product behaviour change.** No new saved field, mark or key. No rect change on any writing surface, and no unmount.
- **Proof first.** The proof script lands in the same branch (`scripts/harness/c13-<n>-*.mjs`, or `apps/desktop/scripts/c13/` for browserless tools).
  It is shown **red on a planted mutant** before it is shown green on the step.
- **Both suite legs** (default + `--parked`) run green on the step's tip, quoted with their stamp, unless the step is docs-only.
- **Full pair (Chat 1's train)** wherever the step touches global CSS, persistence/save/sync, PageEditor, ModeStage, typing, or the server.
- **A harness check that a step falsifies** is parked verbatim with a successor and a record, never edited in place.
  Source-shape pins that a split re-anchors are handled the same way.
- **Report:** tip, proof result, both legs, any parks (old + successor names), box turn start and end in UTC.

---

## The steps

### Phase A: clear the ground (no product files)

**Step 1 · `c13-1-branches` · Chat 1 executes (outward-facing)**
- **What:**
  1. Tag every unmerged remote branch `archive/<name>` at its own tip, then delete it.
  2. Delete every merged remote branch.
  3. Prune local worktrees whose branch is merged (`git worktree remove`; never `--force` on a dirty one).
  4. List the rest.
- **Proof:** a browserless script that writes `docs/cleanup/c13-1-branches.log` with every remote branch: its SHA, merged yes or no, the archive tag's SHA, and the action taken. It asserts:
  - every deleted unmerged branch has `archive/<name>` at the **same** SHA (checked with `git ls-remote`);
  - no branch Chat 1 marked live was touched.

  Mutant: a tag pointing one commit back must make the script fail.
- **Gate:** step 0 is the live-branch census. Chat 1 names the branches still in flight, and they stay.
- **Size:** S. At survey time: 526 remote branches (164 unmerged) and 465 worktrees.

**Step 2 · `c13-2-map` · docs only**
- **What:**
  - `docs/MAP.md`, one page: the areas, main files and owners from cleanup-map §6, and the **five laws + process** exactly as ruled above.
  - Eight area READMEs, ≤ 40 lines each: what lives here, the entry file, seams and `window.wrizo*` hooks, the full-pair files, the covering harnesses, and the known traps.
  - `AGENTS.md`: fix the `packages/core` line, drop the repeated "A real writer is immune" sentence, and point at `MAP.md`.
- **Proof:** `git diff --stat origin/main` touches nothing outside `docs/`, `AGENTS.md` and the new `README.md` files. A link check (every path the MAP or a README names exists) is shown red on a planted bad path.
- **Size:** S, ~600 lines of new docs.

**Step 3 · `c13-3-ledger` · Chat 1 executes**
- **What:** `docs/open-threads.md` keeps **open items only**, each linking to its history. Closed sections move **verbatim** to `docs/ledger/2026-07.md` … `2026-10.md`, in date order.
- **Proof:** a line-multiset compare. Every line of the old ledger appears exactly once across the new files, and no new line exists except headers and links.
  Mutant: one dropped line must make it fail.
- **Size:** S to M (27,146 lines to sort; the work is classifying open vs closed).

**Step 4 · `c13-4-docs-fold` · docs only**
- **What:**
  - The 65 loose `docs/*.md` briefs and reviews move into `docs/briefs/<arc>/` and `docs/reviews/`.
  - The evidence trim: keep the last two deploys' evidence plus anything a parked record or the ledger cites. The rest moves to an archive outside the repo, and **Nick names where**.
- **Proof:** a moved-files manifest. A reference check finds zero dangling links to an old path anywhere in the repo (shown red on a planted stale link). The evidence move lists every removed file and its archive location.
- **Gate:** Nick's word on the evidence archive location. Without it, the brief moves still go and the evidence part waits.
- **Size:** S.

### Phase B: the instrument, then the CSS

**Step 5 · `c13-5-style-probe` · harness only (the instrument every later step uses)**
- **What:**
  - `scripts/harness/c13-style-snapshot.mjs` dumps every visible element's computed style (all properties, `::before` and `::after` included), its rect, and its class list.
  - Screens: arrival/Desk, the writing page, the screenplay page, a board, each cascade panel, Tutor docked, and the Typewriter zoom.
  - Skins: **Arbor, Flux dark-page, Flux light-page, Machina cool, Machina neutral.**
  - Writes a baseline set; `--compare <baseline>` reports every difference.
  - It also reports, per CSS selector, whether **any** element on any screen matches it. Step 11 needs that.
- **Proof:**
  - two runs on `main` compare identical;
  - a planted one-property change (a 1 px padding on one class) is reported;
  - a planted rect change on the page is reported.
- **Box:** about one turn. No full pair (it changes no product file).
- **Size:** M.

**Step 6 · `c13-6-css-split` · contiguous cut, global CSS**
- **What:** `index.css` is cut at its own section banners into ~25 files under `src/styles/`, **in the existing order** (tokens, theme blocks, component sections). `index.css` becomes an ordered list of `@import`s. No rule moves relative to another.
- **Proof:** the **built CSS asset is byte-identical** to `main`'s (same bytes, same hash), checked by a browserless script on two builds. Mutant: swapping two imports must make it fail. The step 5 probe also compares identical (smoke test).
- **Gate:** global CSS, so a full pair. All the open `index.css` branches must have landed or been parked first.
- **Size:** S.

**Step 7 · `c13-7-css-comments` · global CSS, comments only**
- **What:** apply the comment ruling to `src/styles/*`. Ruling histories go verbatim to `docs/rulings/<area>.md`, each linked by its ruling id from the comment that stays.
- **Proof:** the built CSS is byte-identical (comments are stripped at build). A **rulings ledger check** confirms every removed comment block appears verbatim in `docs/rulings/` (block-multiset compare; mutant: one dropped block).
  Harnesses that grep CSS comments are triaged first; any that break are parked with successors.
- **Size:** M (≈3,500 comment lines).

**Step 8 · `c13-8-css-themes` · the theme regroup, global CSS**
- **What:** the 104 Flux, 98 Machina and 5 Arbor rules that sit among component rules move into `styles/themes/{flux,machina,arbor}.css`.
- **The hazard:** moving a rule changes its cascade order against equal-specificity rules that came after it. So each moved rule is checked against every
  later rule with the same specificity and an overlapping property. A rule with a hazard either stays where it is (it is documented as such) or moves with its specificity raised.
  Raising the specificity is a decision for Fable, rule by rule.
- **Proof:** the step 5 snapshot compares **identical on every screen in all five skins.** Mutant: one moved rule placed after its rival must be reported.
- **Gate:** full pair.
- **Size:** M.

### Phase C: the TypeScript (smallest and safest first)

Each split keeps the old module path as a **barrel**, so **no import line outside the split file changes**. That is part of every step's proof
(`git diff` shows no edits to importers). Source-shape pins on a split file are re-anchored through park + successor.

**Step 9 · `c13-9-ts-comments-<area>` · one branch per area: store, components, pages, types**
- **What:** the comment ruling, applied to TS/TSX. Histories go to `docs/rulings/`.
- **Proof:** the **built JS asset is byte-identical** to the pre-step build, plus the rulings block-multiset check. Harnesses that grep comments are triaged first.
- **Gate:** the `pages` and `components` branches touch PageEditor and ModeStage text, but a byte-identical bundle proves no behaviour moved. Fable decides whether a full pair is still wanted (POLISH's lean: the default leg is enough when the bundle is identical).
- **Size:** M per area. ≈20,000 comment lines in total, perhaps half of them history.

**Step 10 · the splits, one branch each, in this order:**

| Branch | Split | Proof beyond tsc + both legs | Pair | Size |
|---|---|---|---|---|
| `c13-10a-tutor` | `tutor/assemble.ts` (pure helpers), `tutor/presets.ts` | the existing `tu1`/`tu2` checks unchanged and green | default leg | S |
| `c13-10b-types` | `types/{records,board,script,tutor,theme}.ts` + barrel | the type-only build is byte-identical JS | default leg | S |
| `c13-10c-lexicon` | `lexicon/terms.ts`, `lexicon/canonical/*.ts`, `lexicon/overrides/{flux,machina}.ts` | a browserless dump of `deskTerm(k, theme)` for **all 901 keys × every theme** compares identical | default leg | S |
| `c13-10d-cascade` | one file per panel | step 5 snapshot identical | default leg | S |
| `c13-10e-settings` | the duplicated settings rows (`Seg`, the Page Light/Dark row, `progressOpts`) → `settings/`; `'Drawer'` goes through the lexicon | step 5 snapshot identical (the panels in all skins) | full (ModeStage) | S |
| `c13-10f-wordcount` | one `store/wordCount.ts` for the 7 private copies | first, a table of each caller's input (clean `derivedText` vs raw); a browserless check that every caller's count is unchanged on a fixture set incl. marks and screenplay text | full (typing surfaces) | S |
| `c13-10g-board` | `board/geometry.ts`, `board/BoardBoxes.tsx`, `board/BoardCardPopup.tsx`, hooks out of `BoardEditor` | step 5 snapshot on boards identical, plus the board gesture harnesses | full | M |
| `c13-10h-persistence` | `persistence/core.ts` (the **one** cache, dirty, flush) + one file per collection, `persistence.ts` as barrel | the seeding law holds (`seed-guard`); a browserless check that only `core.ts` declares the cache; a full save/sync pair | full | M |
| `c13-10i-pageeditor` | hooks out of `PageEditorView` (autosave, mode switch, first-run glow, links dock, typewriter) | page rect, scroll and caret identical across every panel open and close (law 1); step 5 snapshot | full | M |
| `c13-10j-script` | `script/` folder for ScriptEditor's block model + toolbar | the screenplay harnesses; step 5 snapshot | full | M |

The **pen-ink duplicate** (`ModeStage` `PEN_INKS` vs `store/ink.ts`) is **not** in #13. It needs INK's and Fable's ruling on which system is live first.

### Phase D: removal

**Step 11 · `c13-11-dead` · the DEAD list (no Nick decision needed)**
- **What:**
  - delete `pages/JournalEntry.tsx`, `store/rhizomeEngine.ts`, `pages/Desk.tsx` (+ `store/resumeVocab.ts`), `components/HomeFlow.tsx` and `components/Wordmark.tsx`;
  - delete the 20 dead exports, the `WALK_SHIPPED` false branch, the 65 unmatched CSS classes (84 rules), and the ~92 unused lexicon keys;
  - the 166 deck/help keys are deleted **only** if a runtime key-use probe proves them unused;
  - **not here:** the lexicon keys and CSS that belong to step 12's deletions (nudges, the old screens, the Library slot) go with those branches.
    The custom dictionary's exports and `modeWorkshop` are **kept** (12e).
- **Before any delete:** each harness that reads a deleted file is parked verbatim with a successor or a retirement record (Fable rules which):
  - `hide-workshop-source` T3, `hooks-order`, `hooks-order-ast`, `revspell`, `th-machina-source`;
  - `m2`, `m3`, `m4`, `rhizome-goal`, `rhizome-goal-core`;
  - `arrival-signin`, `flux-v2`, and the JournalEntry readers.
- **Proof:**
  - `tsc` clean and both legs;
  - the step 5 selector report shows **no element matched any deleted selector** on any screen in any skin;
  - a lexicon dump shows every remaining key still resolves;
  - mutant: deleting one *live* class must be reported by the selector check.
- **Gate:** full pair (global CSS).
- **Size:** M (≈4,000 lines out).

**Step 12 · `c13-12<x>-*` · Nick's dormant answers (Oct 29): one branch per answer**

These rules apply to every 12x branch:
- **Commit 1 is the parks:** every harness check that reads, drives or greps a file this branch deletes is parked verbatim, with a successor or a
  retirement record (Fable rules which), and the suite runs green on that commit **before** the delete commit exists.
- **The census comes first, and it is the starting point, not the answer.** POLISH's grep found **26 candidate harness files** in all (list below).
  Each branch re-runs the census at its own branch point and audits **each site** (memory: "a syntactic census is candidates only"). It counts
  what the deletion *does*, not the strings it contains. `/project/new` (CreateProject) **stays**, so harnesses that only drive it are not in scope.
- **Proof** for every branch:
  - `tsc` clean;
  - both legs green;
  - the step 5 selector report shows no deleted selector matched anything;
  - the step 5 snapshot is identical on every screen the deletion does not touch.

**12a · `c13-12a-legacy-screens` · DELETE the old project screens, their routes and doors** ⚠ behaviour
- **Files out:** `pages/{ProjectHome,StructureWizard,BeatWizard,StructureBoard,QuickSprint}.tsx` (1,581 lines) and `store/ambient.ts` (used only by QuickSprint).
- **Routes out** (`App.tsx`): `/project/:id`, `/project/:id/sprint`, `/project/:id/wizard`, `/project/:id/beat`, `/project/:id/board`, and `/sprint`.
- **Route kept:** `/project/:id/import` is ImportDraft's and stays.
- **Doors** (⚠ Fable rules where each goes now; Nick ruled the doors deleted, so the default is *removed*, not repointed):
  1. **New project → "Something else"** (`CreateProject.tsx:79`, the `other` kind in `store/kindLabels.ts`). Default: the option is removed from the picker.
  2. **A project row in the `/drawers` list** (`DrawersTree.tsx:66`, `navigate('/project/' + id)`). The row still exists for binders, so Fable says
     what a click does: open the binder's first page, or nothing.
  3. **`wayBack.ts`**: the two `/sprint` patterns (lines 65–66) go.
  4. Any **return chip or resume target** that can point at a deleted route must resolve to a live surface. `resume.ts` imports `frameworks`, so audit it.
- **Code that follows the screens out:**
  - `persistence.ts` exports whose only callers were these pages or `JournalEntry`. Candidates: `createQuickSprintProject`, `setProjectSprintText`,
    `stampBeatActivity` and the story-plan beat setters. Check each, because `CascadePanels` and `forwardOnly` also call into the sprint-text helpers.
  - `store/frameworks.ts` **stays**: `AddToSheet`, `milestones` and `resume` use it. Trim only the functions the deleted pages alone called.
  - `packages/modules-writing`'s JSON stays while `frameworks.ts` reads it.
  - **No stored data is touched:** projects, story plans and `sprintText` all stay as stored.
- **Harness candidates:**
  - legacy routes and files: `ab3`, `b2-1`, `cd1`, `cd4`, `drawer-toggles`, `e1`, `fx7`, `hide-workshop-source` (T2's QuickSprint actions list),
    `item112a`, `j4`, `j5`, `j6`, `logout-flush`, `m1`, `resume-on-open`, `s1`, `th1`, `th2`, `w2`;
  - "Something else": `b2-1`, `b3`, `guided-w3`;
  - captures: `arrival-signin-capture`.
- **Proof, beyond the common proof:**
  - a new harness, `c13-12a-doors.mjs`, written first and **red on main**: every deleted route lands on a live surface rather than a blank screen, and none of the doors offers the deleted screens any more;
  - existing projects still open their pages from every remaining door;
  - a seeded project with `sprintText`, story plans and beat state is byte-identical in storage before and after a boot on the new build.
- **Gate:** full pair (`App.tsx` routes, `CreateProject`, `DrawersTree`, and the persistence exports).
- **Size:** M.

**12b · `c13-12b-testament-nudges` · DELETE the homepage testament and the Tutor nudges**
- **Files out:** `store/testament.ts` (138 lines; nothing imports it) and `store/tutorNudges.ts` (41 lines; nothing imports it).
- **Also out:** the `tutorNudgesTitle` / `tutorNudgesEmpty` lexicon keys, and any `wz-tutor-nudge*` CSS the step 5 report shows as unmatched.
- **Harness candidates:** `tu1` S4 (the nudge checks: a stale starred page and an empty board) is parked or retired. The A14 "the grip carries no badge, count or dot"
  check is a law, not a nudge feature, so its successor keeps asserting it.
- **Proof:** the common proof; `tu1`/`tu2` green with the parks.
- **Gate:** default leg (no product path imports either file).
- **Size:** S.

**12c · `c13-12c-library-slot` · DELETE the narrow rail's Library slot**
- **What:** remove the `library` item from `DeskRail.tsx` (line 29, `live: false`, `to: '/library'`; no such route exists), plus its comment lines 17 and 24 and any CSS for the greyed slot.
- **Not in scope:** `decks/library/` (the deck library) is a different thing and stays. Most `library` grep hits in the harness (`b3`, `big-projects-2`,
  `guided-add-scenes`, `guided-w3`, `help-choose-census`, `machina-forms-logic`) are probably the deck library. Audit each; park only the ones that read the rail slot.
- **Proof:** the common proof. At < 1100 px the rail shows Journal and Drawers only. The page rect is unchanged when the rail is open (law 1).
- **Gate:** default leg.
- **Size:** S.

**12d · `c13-12d-fragments-code` · DELETE the fragments code; the stored data and the column stay untouched** ⚠ data
- **Code out** (`persistence.ts`): `getFragments`, `appendText`, `toggleStruck`, `reorderSpine`, `linkFragments`, `setFragmentRole`,
  and their private helpers (`migrateFragments`, `nextSpineOrder`, `projectIdOfFragment`, `commitFragments`) once nothing else calls them.
- **What stays, by Nick's ruling:**
  - the `fragments` field on stored projects;
  - its type in `types/index.ts`, marked `// stored legacy data: no code reads or writes it (Nick, Oct 29)`;
  - the server column, and anything sync carries.
- **The real risk is not the delete but a silent drop:** no code path may rebuild a project record from a field list that omits `fragments`.
- **Proof, beyond the common proof:** a harness that is **red on a planted mutant that strips the field**. It seeds a project carrying a `fragments` array through the seam, then edits the project, saves it, reloads, and runs a sync push and pull round trip. It asserts that the `fragments` array is **byte-identical** in local storage and in the server row afterwards.
- **Census:** no harness calls the fragments API (0 hits). Re-check at the branch point.
- **Gate:** full pair (save/sync).
- **Size:** S.

**12e · KEEP the custom dictionary, hidden: no branch of its own**
- `store/proofing.ts` stays as it is.
- Step 2's `store` README records it: "the custom dictionary (personal word list + dialect, item 204): built, hidden on purpose (Nick, Oct 29); only `clearProofingLocal` is wired".
- Step 11 must **not** delete its unused exports (`getProofing`, `addProofingWord`, `removeProofingWord`, `setProofingDialect`, `syncProofing`, `subscribeProofing`, `setProofingIgnored`).
- The same goes for the `modeWorkshop` lexicon words (Nick, Oct 23).

**Fable's rulings on 12a and step 9 (Oct 29, brief accepted):**
- **"Something else"** is dropped from New project.
- **A project row in `/drawers`** opens the project's first page. If the project has no pages, it opens its Drawer's Pages pop-out.
- **A return chip or resume target that points at a deleted route** falls back to a live surface: the Drawer's last page, else home. Never a blank screen.
  `c13-12a-doors.mjs` asserts all three, red on main first.
- **Step 9:** the default leg only, provided the JS bundle is byte-identical and the source-reading checks pass. No full pair.
- **Lanes:** as proposed, to be confirmed at the start of #13.

**Order inside step 12:** 12b, then 12c (small, default leg), then 12d (full pair), then 12a (the biggest and the only one that changes a door).
**12d must not ride in the same train pair as 12a:** both touch `persistence.ts`, and a red must point at one cause.

### Phase E: the harness

**Step 13 · `c13-13-captures` · harness layout**
- **What:** move the capture/probe scripts out of `scripts/harness/` to `scripts/captures/`, so the suite stops running them:
  `arrival-signin-capture`, `splash-sweep-capture`, `templates-picker-capture`, `theme-leftovers-capture`, `tutor-drawer-probe`, `flux-screens`.
  First check `flux-v2-part2`, `guided-w2`, `guided-w2-part2` and `guided-w3-part2`: if a parent harness imports one, it stays.
- **Proof:** the suite's file count drops by exactly the moved set; both legs green; each moved script still runs from its new place (one dry start each, no box).
- **Size:** S.

**Step 14 · `c13-14-parked-archive` · harness law (Fable rules)**
- **What:** a parked record whose successor has been green for **two deploys** moves **verbatim** to `scripts/harness/archive/<file>.parked.md`. The live file keeps its successor and a one-line pointer.
- **Proof:**
  - `audit-parked-records.mjs` counts records **before == after** (moved, never lost);
  - a block-multiset compare shows every removed commented line appears verbatim in an archive file;
  - the `--parked` leg is green with the same successor count (356 `pok` at survey time, minus any retired in step 11, stated);
  - mutant: one dropped record must make it fail.
- **Size:** M (≈1,726 commented lines across 152 files).

**Step 15 · the #13 train · Chat 1**
- **What:** all of the above merged in order, then a full pair on the train tip and the deploy.
- **Proof:**
  - both legs green;
  - the step 5 snapshot of the train tip against step 5's `main` baseline is identical, except for the selectors step 11 deleted (which matched nothing) and the agreed step 12 changes;
  - the bundle served after deploy is diffed against the stamped bundle.

---

## Sizes and order at a glance

| Phase | Steps | Lane time | Box | Full pairs |
|---|---|---|---|---|
| A ground | 1–4 | ~2 days | none | 0 |
| B CSS | 5–8 | ~3 days | ~4 turns | 3 (6, 7, 8) |
| C TS | 9–10 | ~4–5 days | ~8 turns | 6 (10e–10j) |
| D removal | 11, 12a–12d | ~3–4 days | ~5 turns | 3 (11, 12a, 12d) |
| E harness | 13–14 | ~2 days | ~2 turns | 0 |
| train | 15 | Chat 1 | 1 pair | 1 |

**Expected result:** ≈4,000 dead lines out; roughly 10–15,000 history-comment lines moved to `docs/rulings/`; no source file over ~1,200 lines
except `ForwardOnlyEditor` (kept whole, as the typing path); a 1-page MAP; a ledger a lane can read in minutes; the harness down by the capture
scripts and the archived parked text.

**Lane assignment** is Fable's. POLISH's proposal:

| Lane | Steps |
|---|---|
| POLISH | 2, 4, 5–8, 9 (styles) |
| TOOLS | 10a, 10c, 10d, 10e, 13 |
| INK | 10g |
| FIX | 10f, 10h, 10i, 10j, 11 |
| Chat 1 | 1, 3, 15 |
| FIX | 12a, 12d (doors, routes, persistence) |
| TOOLS | 12b, 12c (Tutor and rail) |
| any lane, after Fable | 14 |
