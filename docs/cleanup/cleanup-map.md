# Cleanup map: the read-only survey (POLISH, Oct 29, 2026)

**Measured at:** `origin/main` `bc6cf256` (deploy #10 live). **Branch:** `cleanup/survey` (this one file only).
**Nothing was edited, deleted or moved.** Every number below came from a script or grep run on that tree. None is remembered.
The scan scripts were throwaways in POLISH's scratchpad. Their method is described beside each number, so anyone can re-run it.

**Legend.** **DEAD**: unreachable and replaced, safe to delete once its harness references are parked.
**DORMANT**: built and hidden, possibly revived: **Nick's word**. **UNSURE**: the evidence is not conclusive.
⚠ marks an item that touches **behaviour, data or the page laws**: that is Fable's or Nick's call, not a cleanup lane's.

---

## 0. The shape in one screen

| Area | Files | Lines | Of which comments |
|---|---:|---:|---:|
| `apps/desktop/src` (all .ts/.tsx/.css) | 264 | 61,507 | **33%** |
| the 15 heavy files (below) | 15 | 30,061 | **39%** |
| `apps/desktop/scripts/harness` | 219 | ~80,000 | 33% |
| other `apps/desktop/scripts` | 63 | ~11,500 | n/a |
| `apps/server` | 28 | 4,333 | n/a |
| `packages/` | 3 JSON files | n/a | n/a |
| `docs/` | 3,207 | 276 MB on disk (262 MB is `docs/evidence`) | n/a |

**The biggest single finding:** a third of all source lines are comments, and most of them tell the history of rulings
("SUPERSEDED", "PARKED", who said what on which date) rather than what the code does. That history is the maze a new
lane walks through. The ledger and the git log already hold it. See §7 step (c2).

Other findings:
- **Folders.** `store/` is one flat folder of **133 files**. `packages/core` (required by `AGENTS.md`'s layout) does not exist.
  `packages/modules-writing` holds only three framework JSON files.
- **Branches.** **526 remote branches**, 164 of them not in `main`. Most are superseded `-r`, `-r2`, `-r3` rebases.
- **Worktrees.** **465 local worktrees** on the box. They are disk and `git` weight, not repo weight, but every lane trips over them.

---

## 1. The heavy files (> ~800 lines) and their proposed splits

| File | Lines | Comment % | What's inside | Proposed split (natural seams) |
|---|---:|---:|---|---|
| `src/index.css` | 7,462 | 47% | All styling: `:root` tokens (1–340), the Flux block (496–596), the Machina blocks (597–741), then ~6,700 lines of component rules. Theme rules are **interleaved**: 104 Flux-prefixed, 98 Machina, 5 Arbor rules are scattered through the component sections. 71 `@media`, 45 `@keyframes`. Biggest families: `wz-cascade` 80 rules, `wz-sliver` 74, `wz-tutor` 70, `desk-frame` 70, `wz-theme` 50, `deck-wizard` 48, `wz-graft` 45, help-* ~110. | See §7(b): first a **contiguous-chunk split** (byte-identical bundle), then a theme regroup that needs a computed-style proof. Target layout: `styles/tokens.css`, `styles/themes/{arbor,flux,machina}.css`, `styles/components/{page,mode-stage,cascade,sliver,tutor,board,drawers,rail,help,deck,splash,typewriter,…}.css`, all imported by `index.css` in the original order. |
| `components/BoardEditor.tsx` | 3,771 | 37% | Geometry constants (103–165); box renderers `BoardInkBox`/`BoardPinBox`/`BoardTextBox` (188–409); `BoardCardPopup` (410–902, ~500 lines); `BoardEditor` itself (905–3,771, one ~2,860-line component: gestures, autosave, selection, connectors, menus). | `board/geometry.ts` (constants + pure helpers), `board/BoardBoxes.tsx`, `board/BoardCardPopup.tsx`, and hooks pulled out of the main component: `useBoardGestures`, `useBoardAutosave`, `useBoardSelection`, `useBoardConnectors`. ⚠ the board gesture code is typing/gesture-latency territory: full pair. |
| `store/persistence.ts` | 3,677 | 42% | The cache + flush core (1–400); then **145 exports** by collection: projects/binders, fragments (the old spine model), story plans, drafts, boards & page links & pins (1,203–2,010), script docs, tutor threads, journal entries/pages/shelf/notebook (2,220–2,700), plan-board pairing, system boards, drawers, sync apply/reset, purge/trash (3,467–3,677). | Keep **one** cache module (`persistence/core.ts`: cache, dirty, flush, `upsert`, `durableSeam`), then one file per collection (`projects`, `storyPlans`, `drafts`, `boards`, `links`, `journal`, `drawers`, `systemBoards`, `syncApply`, `purge`), with `persistence.ts` kept as a **re-export barrel** so no import line anywhere changes. ⚠ save/sync: full pair. ⚠ The seeding law depends on the single cache: the split must not create a second one. |
| `store/deskLexicon.ts` | 2,500 | 29% | The `DeskTermId` union (19–783, **901 keys**), `CANONICAL` (784–1,986), `OVERRIDES` per theme (1,987–2,482), two accessors. | `lexicon/terms.ts` (the union), `lexicon/canonical/{chrome,cascade,board,tutor,typewriter,decks,help}.ts`, `lexicon/overrides/{flux,machina}.ts`, `deskLexicon.ts` = accessors + barrel. Typecheck proves completeness (`Record<DeskTermId,…>`). |
| `pages/PageEditor.tsx` | 1,828 | 44% | `PageEditorView` is one component from line 111 to 1,747 (~1,640 lines); `PageEditor` + `UnbornPage` wrappers. | Extract hooks (autosave, mode switching, glow/first-run, links dock, typewriter) and the two toolbar render blocks. ⚠ PageEditor is full-pair territory, and the page laws apply: no rect change, no unmount. |
| `components/Tutor.tsx` | 1,418 | 45% | Pure assembly helpers (delta, selection cap, bible: 85–200), dock geometry, presets/asks, then the `Tutor` component (308–). | `tutor/assemble.ts` (the pure helpers; easy unit proof), `tutor/presets.ts`, `Tutor.tsx`. Low risk. |
| `pages/JournalEntry.tsx` | 1,319 | 25% | The old single-page journal screen. **Not routed since FX14 S2; no file imports it.** | Not a split: **DEAD** (§2). |
| `components/ScriptEditor.tsx` | 1,309 | 33% | The screenplay surface (blocks, autocomplete, pagination glue, toolbar). | `script/` folder with the block model and the toolbar split from the editor. ⚠ typing path. |
| `components/Sliver.tsx` | 1,305 | 30% | The sliver: instruments, goal, typewriter settings, progress options. **Duplicates ModeStage's progress options** (§3). | Settings rows → shared `settings/` components used by both. |
| `store/rhizomeEngine.ts` | 1,017 | 20% | The M2 growth engine. **Replaced by `rhizomeGrowth.ts` (Oct 8); no file imports it.** | Not a split: **DEAD** (§2). |
| `components/CascadePanels.tsx` | 993 | 40% | All cascade panels in one file. | One file per panel (`cascade/{Pages,Boards,Journal,Drawers,Themes,Trash,Settings}Panel.tsx`). |
| `components/ModeStage.tsx` | 944 | 31% | The stage + the theme settings `Seg` control + **a second pen-ink table** (§3). | Move `Seg` and the settings rows to `settings/`; pen inks → `store/ink.ts`. ⚠ ModeStage: full pair. |
| `components/ForwardOnlyEditor.tsx` | 867 | 41% | The forward-only editor. | Keep whole (it is the typing path); trim comment history only. ⚠ |
| `types/index.ts` | 826 | **59%** | Every record type. More comment than code. | `types/{records,board,script,tutor,theme}.ts` + barrel. |
| `store/draftFormat.ts` | 810 | 31% | Import/format conversions. | Fine as is after comment trim. |

---

## 2. Dead or dormant code

**Method.** Three checks. (1) Every `src` file was checked for whether any other `src` file imports it (static, dynamic and side-effect imports, path-normalised).
(2) Every exported name was checked for whether it appears in any other `src` file with comments stripped.
(3) Every route was checked for whether anything links to it.

### 2a. Files nothing imports

| File | Lines | Mark | Why / what depends on it |
|---|---:|---|---|
| `pages/JournalEntry.tsx` | 1,319 | **DEAD** (⚠ harness) | Unrouted since FX14 S2 (`App.tsx` line 13 says so). Still *read as text* by `hide-workshop-source` (T3), `hooks-order`, `hooks-order-ast`, `revspell`, `th-machina-source`, `b1`, `cd2`, `j5`, `j6`, `pb1`. Those checks pin a file no writer can reach, so they need parks + successors before the delete (Fable). |
| `store/rhizomeEngine.ts` | 1,017 | **DEAD** (⚠ harness) | Its own header says it drives `RhizomeField.tsx`, but `RhizomeField` now imports `rhizomeGrowth.ts` (Fable, Oct 8). Its test seam `window.__wrizoRhizomeEngine` never mounts, so `m2`, `m3`, `m4`, `rhizome-goal`, `rhizome-goal-core` checks that read it test nothing live: park them. |
| `pages/Desk.tsx` | 164 | **DEAD** | Self-labelled "PARKED — HB1, 2026-07-16". Arrival replaced it. Its only consumer of `resumeVocab.ts` (71 lines) goes with it. |
| `components/HomeFlow.tsx` | 216 | **DEAD** (⚠ harness) | Self-labelled "PARKED — HB1, 2026-07-16; Arrival.tsx replaces its whole job". Named by `arrival-signin`, `flux-v2`. |
| `components/Wordmark.tsx` | 18 | **DEAD** | Plain-type wordmark. `WrizoMark` replaced it. Its CSS class `wordmark__mark` is also unused. |
| `store/testament.ts` | 138 | **DORMANT** | J3's "homepage testament" (words this week, days at the page). Never wired into the current home. |
| `store/tutorNudges.ts` | 41 | **DORMANT** | TU1 S4's Tutor nudges ("a starred page untouched for days"). Built, never called. Its lexicon keys and CSS are unused too. |
| `store/tutorDisclosure.ts` | 111 | **UNSURE** → Fable | The Tutor's one-time disclosure flag. `Tutor.tsx` keeps `showDisclosure` declared but never sets it (line 628). Its texts v1–v3 (`tutorDisclosureBody*`) and five `wz-tutor-disclosure-*` CSS rules are unused. Was the retirement final? |

### 2b. Reachable, but legacy (the old "workshop" cluster): **DORMANT**, ⚠ behaviour

`/project/:id` (`ProjectHome`) is still reachable through **two doors**: New project → **"Something else"** (`CreateProject.tsx:79`),
and a project row in the `/drawers` list (`DrawersTree.tsx:66`, reached from the narrow DeskRail). From `ProjectHome`, four more
screens are reachable: `StructureWizard` (`/wizard`), `BeatWizard` (`/beat`), `StructureBoard` (`/board`), `QuickSprint` (`/sprint`, also `/sprint` bare).
Together that is **1,581 lines** of pages, plus modules only they use: `store/ambient.ts` (153), and most of `store/frameworks.ts`
(which reads `packages/modules-writing`'s three JSON files). `milestones.ts` and `idleNudges.ts` are shared with live code and stay.
Removing the cluster changes what "Something else" does, so it is Nick's call. Fable picks the replacement door.

### 2c. Dead paths inside live files

| Item | Mark | Note |
|---|---|---|
| `persistence.ts`: `getFragments`, `appendText`, `toggleStruck`, `reorderSpine`, `linkFragments`, `setFragmentRole` | **DORMANT** ⚠ data | The old "spine" model: writing stored as ordered fragments inside the project record (`migrateFragments`). No caller left. Users' stored projects may still carry a `fragments` array, so a delete needs Fable to say whether the field is read on load or sync. |
| `persistence.ts`: `isPinDisplayed`, `getScriptDoc`, `getTutorThread` | DEAD | No caller anywhere (src or scripts). |
| `decks/helpMeChoose.ts`: `WALK_SHIPPED = true` | DEAD (branch) | The "walk not shipped" path of `q3Landing` can never run. |
| `DeskRail.tsx`: the **Library** item (`live: false`, route `/library` does not exist) | **DORMANT** | A rail slot for a Library that was never built. |
| `store/proofing.ts`: `getProofing`, `addProofingWord`, `removeProofingWord`, `setProofingDialect`, `syncProofing`, `subscribeProofing`, `setProofingIgnored` | **DORMANT** | Only `clearProofingLocal` is imported (by persistence). The rest (a personal word list + dialect for spell-proofing, item 204) is called only by the `item204-*` proof scripts. Built, not wired to any screen. |
| 17 more single-use exports ( `useChromeFade`, `getAssistResponse`, `matchesQuery`, `useFirstRunComplete`, `PROSE_BASE_PX`, `getForwardLock`, `kindLabel`, `useOpenDrawer`, `hydrateUserPageDefaults`, `useUserPageDefaults`, `totalLines`, `indentChFor`, `pageCount`, `subscribeStaleClient`, `resetLearnedLimit`, `getWritingGoal`, `hasStepContent`) | DEAD | Named once (their own declaration), by no src file and no script. |
| **339 exports** used only inside their own file | n/a | Not dead: the `export` keyword is surplus. Leave them alone; it isn't worth the churn. |

### 2d. CSS selectors no source names

1,088 classes are styled. **65** appear in no `.ts`/`.tsx` text, and **84 rules** style only those. 36 more look dynamically built (`…--${x}`) and were excluded.
Families: `wz-sliver-goal-*` (the retired goal editor, 8), `wz-placeface-*` (8), `wz-drawers-tile*/cluster*` (7), `wz-actions-confirm*` (5),
`wz-tutor-disclosure-*` (5), `wz-cascade-confirm-*` (4), `shelf-*` (7, the old Shelf list), `desk-corkboard-*` (3), `wz-recent-*` (3), and singles
(`btn-secondary`, `form-input`, `form-select`, `warning-text`, `hairline-timer*`, `board-text-editing`, `wz-journal-link`, `wz-desk-links`,
`fl-affordance`, `mode-settings-hint`, `wz-place-page-home`, `wz-sections-views`, `wz-help-door-glyph`, `wordmark__mark`).
**Mark: DEAD candidates, proved per family.** Removal is the one CSS change a computed-style diff can't fully prove (an unmatched rule paints nothing),
so the proof is "no element on any key screen in any theme matches the selector". The step (b) probe can report that.

### 2e. Lexicon keys no source names

901 `DeskTermId` keys; **258** are named by no other src file. Of those, **166** are deck/help copy (`deck…Body`, `help…`) that may be built from ids at
runtime: **UNSURE**, prove with a runtime key-use probe before deleting. Of the other **92**, most are DEAD leftovers of retired UI:
- the goal editor `goalEdit/Set/Clear`;
- the old cascade Plan panel `cascadePlan*`;
- the board delete confirm `cascadeBoardDelete*`;
- the typewriter menu `tw*`;
- the old footer `foot*`;
- `placeFace*`, the Tutor nudges and disclosure keys.

Three are named only by the dead `JournalEntry.tsx` (`journalRoute*`).
**Exception, already ruled:** `modeWorkshop` stays (Nick, Oct 23: the per-theme words wait for Workshop). It is **DORMANT-kept**, so don't touch it.

---

## 3. Duplicates

| Thing | Copies | Proposal |
|---|---|---|
| **Word counter** `trim → split(/\s+/)` | 7 identical private copies: `FirstRunGate`, `HomeFlow`, `ScriptEditor`, `Sliver`, `JournalEntry`, `PageEditor`, `QuickSprint` (+ `BeatWizard` inline, `Tutor`, `writingGoal`) | One `store/wordCount.ts`. ⚠ Check first whether each caller passes clean text (`derivedText`) or raw text with marks: the same function fed different inputs is the real risk, and a merge must not change any count. |
| **Mark / text stripping** | `forwardOnly.derivedText` (the clean model), `markRuns.stripLine`, `draftFormat.stripMarkdownConventions` | Different jobs, not true duplicates. Document which one is canonical in the MAP; no merge. |
| **Pen inks** | `ModeStage.tsx:51` `PEN_INKS` `#1a0f06/#b8231f/#1f4fb8` + per-theme maps (16 hex literals) vs `store/ink.ts` + `--ink-walnut/iron/oxblood/sea` (item 121's "four inks", `#1A1206`) | ⚠ Two ink systems. Which one is live for which surface is INK's and Fable's call. Merge only after that ruling. |
| **Theme settings rows** | `ModeStage.tsx:868` and `ThemePicker.tsx:133` both build the `Seg label="Page"` Light/Dark row; `ModeStage.tsx:814` and `Sliver.tsx:1255` both build `progressOpts` with a hard-coded `'Drawer'` | One `settings/` component set; the `'Drawer'` label goes through the lexicon. |
| **Lexicon words hard-coded** | `'Drawer'` ×2 (above), `label="Page"` ×2; the rest of the hits are in comments | Small: 4 sites. |
| **Theme token copies** | `ink.ts` reads `--ink-stroke` with a `'#1A1206'` fallback ×3 (`DEFAULT_INK_HEX`) | Fine (a fallback); name it once. |
| **Drawer / fade timing** | `FADE_MS = 700` in `ActionToast` and `VoiceWallWhisper`; other fades differ on purpose | Not worth a merge; note in the MAP. |

---

## 4. The harness

| Measure | Value |
|---|---:|
| files in `scripts/harness` | **219** (all `.mjs`; the suite runs **every** one: `run-suite.mjs:287`) |
| lines | ~80,000 (33% comment) |
| browser harnesses / browserless | 174 / 45 |
| files that print a `VERIFY` verdict | 209 |
| `ok`/`keep` checks (approx.) | ~5,870 |
| parked successor checks (`pok(`) | **356** |
| files carrying a PARKED record | **152** (1,874 PARKED mentions) |
| commented-out parked code lines | **~1,726** |
| files that read `src` **as text** (source-shape pins) | ~39 by regex, incl. 7 `*-source.mjs` |

- **No verdict line, mixed in with the real harnesses (capture/probe/helper candidates):** `arrival-signin-capture`, `splash-sweep-capture`,
  `templates-picker-capture`, `theme-leftovers-capture`, `tutor-drawer-probe`, `flux-screens`, `flux-v2-part2`, `guided-w2`, `guided-w2-part2`,
  `guided-w3-part2`. These run in every full suite. **UNSURE** for the `part2` and `guided-*` files: they may be helpers imported by their parent
  harness, so check before moving. The `*-capture`/`*-probe`/`flux-screens` files belong in `scripts/captures/`.
- **Pins on dead code (archive when §2's deletes land):** the source-readers that name `JournalEntry.tsx` (`hide-workshop-source` T3, `hooks-order`,
  `hooks-order-ast`, `revspell`, `th-machina-source`), the rhizome-engine set (`m2`, `m3`, `m4`, `rhizome-goal`, `rhizome-goal-core`), and the legacy-cluster
  readers (`b2-1`, `m1`, `logout-flush`, `fx7`, `j4`, `j5`, `j6`, `e1`, `s1`, `ab3`, `cd1`, `cd4`, `drawer-toggles`, `item112a`, `th2`, `w2`).
- **Archive candidates (parked checks with long-settled rulings):** the heaviest parked files are `ab2` 87 mentions, `ab1` 63, `cd2` 63, `ab3` 55,
  `ab4` 52, `fx3` 48, `b1` 45, `cd1` 44, `b2` 43, `fx5` 43, `fx1` 39, `fx4` 39, `item112a` 38, `m2` 33, `bg1` 31.
  Proposal ⚠ (Fable rules on harness law): a parked record whose successor has been green for **two deploys** moves, verbatim, to
  `scripts/harness/archive/<file>.parked.md`. The record survives word for word, and the live file loses the commented code. The `--parked` leg keeps
  running the successors. This keeps "park, never edit" and only changes where the parked text lives.
- **Source-shape pins (the S11 kind):** about 39 files read source text. Some pin a *behaviour* that has no DOM reach, which is legitimate (seed-guard, hooks-order).
  Others pin *shape*: an exact string or line in a file. Those break on any split in §7(c). Each needs triage **before** step (c), and the
  splits must re-anchor them through a park + successor.
- **Biggest harnesses:** `cd2` 1,519 lines, `fx5` 1,429, `ab2` 1,424, `b2` 1,265, `sc2` 1,228, `ab4` 1,040.

---

## 5. Docs weight

| Item | Size | Finding |
|---|---:|---|
| `docs/open-threads.md` (the ledger) | **27,146 lines, 2.6 MB, 771 sections** | Headings date from 5 (Jul), 43 (Aug), **480 (Sep)**, 237 (Oct). Sections are not in date order. ~218 headings say closed/shipped/merged/ratified; ~126 say open/held/waiting/parked. Most of the file is history. A lane reading it to find what's open pays for 2.6 MB. |
| `docs/evidence` | **262 MB, 2,674 files, 216 folders** | 233 MB is PNG, 12.5 MB JPG, 6.9 MB txt logs. `.railwayignore` already keeps it out of the deploy. The repo is public and history is never rewritten, so moving files out **shrinks the checkout and every lane's search, not the clone**. |
| stale briefs | 105 tracked files with "brief" in the name; 65 loose `.md` files at `docs/` root (e.g. `state-of-wrizo-2026-07.md`, last touched Jul 11) | Root files belong in folders: `docs/briefs/<arc>/`, `docs/reviews/`. |
| `docs/wrizo-alpha` / `docs/menus` | 3.5 MB / 4.8 MB | Mockups and arc briefs; folder them by arc, no deletion. |
| `AGENTS.md` | 210 lines, 15 KB | Overlaps `docs/page-primacy-canon.md` (PAGE IS PRIMARY is restated in full), the seeding law (its successor paragraph repeats "A real writer is immune" twice), and the lane rules that also live in each handoff. Its "Repo layout (required)" lists `packages/core`, which does not exist. |
| project docs | `docs/PHILOSOPHY.md`, `docs/north-star.md` (38 lines), `docs/page-primacy-canon.md` (129), `docs/j-arc-runbook.md`, `docs/theme-foundations/README.md` | Good anchors; the MAP should point at them rather than repeat them. |

**Proposals** (⚠ the ledger is Chat 1's; any evidence move is Nick's call):
- **Split the ledger.** Keep `docs/open-threads.md` for **open items only**, a few hundred lines, each linking to its history.
  Move closed sections to `docs/ledger/2026-07.md` … `2026-10.md`, verbatim, ordered by date.
- **Evidence.** Keep the **last two deploys'** evidence plus anything a parked record cites. Move the rest to an archive outside the repo
  (Nick picks where: a Drive folder or a release asset). Follow the Oct 15 rule (JPEG q80 ≤ 1400 px) from now on.
- **AGENTS.md.** Cut to the rules with a link to each canon (target ≤ 100 lines). Fix the layout section.

---

## 6. The map lanes need: `docs/MAP.md` (proposal, one page)

```
# Wrizo map (one page; read this, then only the README of the area you touch)

AREA            MAIN FILES                                                    OWNER (Fable assigns; proposal)   README
page / editor   pages/PageEditor, components/{ForwardOnlyEditor,ModeStage,     FIX (typing/save), POLISH (look)  src/pages/README.md
                ScriptEditor,Sliver,DeskFrame}, store/{forwardOnly,markRuns,
                draftFormat,entryText}
boards          components/BoardEditor (+ board/), store/{boxTombstones,       INK (pen, graphics), TOOLS         src/components/board/README.md
                grafts,ink}, persistence boards/links
drawers/places  components/{CascadePanels,DrawersTree,PlaceBlock,PlacesPanel},  TOOLS                             src/components/cascade/README.md
                store/{place,menusDrawers,drawerSet}
themes          styles/ (after the CSS split), store/{theme,themeCast,          POLISH (+ the theme lanes)        src/styles/README.md
                themeFontFaces,fontRoster}, components/ThemePicker
lexicon         store/deskLexicon (+ lexicon/), store/themeLexicon              whoever adds a word; POLISH audits src/store/lexicon/README.md
tutor           components/Tutor (+ tutor/), apps/server/src/tutor              TOOLS                             src/components/tutor/README.md
sync / server   store/{persistence,sync}, apps/server/src/*                     FIX; chat 1 deploys               apps/server/README.md
harness         scripts/harness, scripts/run-suite, box-take/box-grant          every lane; chat 1 runs trains    scripts/harness/README.md

THE FIVE LAWS (each links to its canon)
1. PAGE IS PRIMARY: nothing moves, resizes or unmounts the page; departures return exactly (page-primacy-canon.md).
2. NO NEW SAVED DATA without Nick's word: no field, column, mark or localStorage key.
3. SEED THROUGH THE SEAMS (window.wrizo*), never raw storage (AGENTS.md § harness).
4. CHECKS FIRST, PARK NEVER EDIT: red before green; a falsified check is parked verbatim with a successor.
5. ONE LANE, ONE WORKTREE, ONE BRANCH: never push main; the box only through box-take.

WHERE THINGS ARE DECIDED: Nick (product, data) -> Fable (architecture, rulings) -> chat 1 (merge, deploy, ledger).
```

- **The five laws are POLISH's proposal.** Fable may already hold a canonical five.
- **Each area README** (≤ 40 lines) lists: what lives here; the entry file; the seams and window hooks; the full-pair files; the
  harness files that cover it; and the area's known traps (one line each, linked to the ledger item).

---

## 7. The plan for deploy #13 (in order; each step behaviour-preserving and provable)

**Branch conflicts:** almost every open branch touches `index.css`. Of the branches active since Oct 24, at least 40 touch the heavy files:
`polish10-*` (+ `-r` … `-r4` rebases), `tools-11-*`, `tools-10-fontlist`, `walk-open-select`, `add-scenes`, `polish/arbor-*`.
Many of those are already-landed rebases. **Step 0, before anything:** Chat 1 lists which unmerged branches are still live. Every live branch lands
or is parked as a patch before (b) and (c) begin. **#13 is a freeze window:** nothing else merges while it is in flight.

| Step | What | Proof | Size | Conflicts / gates |
|---|---|---|---|---|
| **(a) map + archives** | `docs/MAP.md`, 8 area READMEs, ledger split (open vs monthly history, verbatim), `docs/` root briefs into folders, evidence trim (Nick's yes on where), AGENTS.md trim | Docs only: `git diff --stat` shows no `apps/` change; the ledger split is checked by a line-multiset compare (every old line exists exactly once in the new set) | S: ~1 day, ~1,000 lines new docs, moves only | Ledger = Chat 1's file (Chat 1 does or approves the split). No product conflict. |
| **(b1) CSS split, contiguous** | Cut `index.css` into ~25 files **in the existing order** (tokens, theme blocks, then component sections at their own banners), imported back in that order | **The built CSS asset must be byte-identical** (same hash, same bytes) before and after: the strongest proof, and it needs no box | S: half a day | Every open `index.css` branch (all of the above): do it in the freeze window. |
| **(b2) CSS regroup by theme** | Move the 104 Flux, 98 Machina and 5 Arbor rules that sit among component rules into their theme files | A moved rule changes cascade order against same-specificity rules that come after it, so this one **is not** byte-identical. Proof: a computed-style dump (every element, every property, plus `::before`/`::after`) on the key screens (Desk/arrival, writing page, board, each cascade panel, the screenplay page, Tutor docked) in **Arbor, Flux (dark + light page), Machina (cool + neutral)**: before == after, byte for byte. ~1 box turn per run. | M: 1–2 days | ⚠ Global CSS: full pair (Chat 1's train). |
| **(c1) big-file splits** | Per §1: `Tutor` assemble/presets, `deskLexicon` → `lexicon/`, `types/` → per-area files, `CascadePanels` → per panel, `BoardEditor` → `board/`, `persistence` → `persistence/` behind a barrel, `PageEditor` hooks | `tsc` clean; **import lines outside the moved file unchanged** (barrels); the full suite on both legs; the step (b2) computed-style probe as a smoke test. Source-shape pins (§4) are re-anchored through park + successor, never edited. | L: ~3–4 days; one PR per file family, smallest first (`Tutor`, lexicon, types, cascade, then board, persistence, PageEditor last) | ⚠ `persistence`, `PageEditor`, `ModeStage`, `BoardEditor` gestures = full pair. Conflicts with `polish10-format*`, `polish10-board*`, `polish10-linkdock*`, `tools-*`. |
| **(c2) comment diet** | In each file touched by (c1), move ruling history (SUPERSEDED/PARKED narration, who-said-when) into that area's README "history" section or a ledger link; keep the comments that say *why the code is shaped this way* | Comments only: the built JS bundle is byte-identical (after minification) | M: rides (c1), file by file | ⚠ Fable rules on the comment policy first. Some harnesses grep comments (§4): triage them. |
| **(d) dead-code removal** | Nick's approved list from §2 (plus the 65 CSS classes, the 92 lexicon keys, the 20 dead exports, `WALK_SHIPPED` branch), each delete preceded by the harness parks it needs | `tsc` clean; both legs; the step (b2) probe reports no element matches any deleted selector; the legacy cluster's routes return the agreed new behaviour | M: ~1–2 days | ⚠ The workshop cluster and fragments = Nick + Fable. Harness parks = Fable. |
| **(e) harness pruning** | Capture/probe scripts → `scripts/captures/` (out of the suite); settled parked records → `harness/archive/*.parked.md` verbatim; dead-code pins archived with (d) | The audit (`audit-parked-records.mjs`) counts records **before == after** (moved, not lost); suite file count drops by the moved files; both legs green | M: ~1–2 days | ⚠ Harness law = Fable. Run last, after (c) and (d) re-anchored what they touch. |

**Rough total:** 8–12 working days of lane time plus 3–4 full pairs. About **−4,000 lines** of src (dead files and rules) before the comment diet,
which could take off up to a third more. Docs weight drops by the ledger split, and evidence by whatever Nick approves.

---

## Appendix: method notes
- **Unused CSS.** A class counts as unused if its name appears in no `.ts`/`.tsx` text. Comments are included in the search on purpose (conservative), and so are dead files,
  so the real list grows after (d).
- **Unused exports.** An export counts as unused if its name, comments stripped, appears in no other src file. Scripts were checked separately.
- **Lexicon.** A key counts as named if a quoted `'key'`, `"key"` or `` `key` `` appears outside `deskLexicon.ts`. Keys built at runtime can't be seen this way, hence UNSURE for decks and help.
- **Harness kinds.** A "verdict" is a `VERIFY` print. A "source reader" is a `readFileSync` of a src path (a regex, so approximate).
