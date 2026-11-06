# #13 step 11: the DEAD list (POLISH): step notes

Branch `c13-11-dead`, cut from `origin/main` **97261feb** (Nov 6). Fable's rulings (Nov 5): what the file deletes free is IN; `WALK_SHIPPED` is KEPT; the Tutor-disclosure family STAYS; the 166 deck/help keys are DEFERRED to their own branch with the runtime key-use probe; `md-h3`–`h6` stay; every park lean accepted as listed.

## Two commits, in order

1. **The parks** (`6ba919fd`). Every harness check the deletions falsify, parked verbatim with its successor or retirement record. Each successor holds before the delete and after it: a file is read only while it exists, and a deleted term is read as its word while it exists and as no word once gone. So the parks commit is green on main's tree, and the delete commit changes no verdict.
2. **The deletions**, below.

## What goes (the lists are the proof's input)

| What | Count | List |
|---|---:|---|
| Files nothing imports | 6 | [`c13-11-files.txt`](c13-11-files.txt): JournalEntry, rhizomeEngine, Desk + resumeVocab, HomeFlow, Wordmark |
| Exports no file names | 26 | [`c13-11-exports.txt`](c13-11-exports.txt): the map's 20, then the 6 the file deletes free |
| CSS classes no code names | 120 (161 rules dropped, 2 selector lists trimmed, 1 empty `@media`) | [`c13-11-css.txt`](c13-11-css.txt) |
| Lexicon keys no code names | 88 | [`c13-11-lexicon.txt`](c13-11-lexicon.txt) |

Also out:
- **Four private helpers the cut orphaned** (`MONTHS`, `getSnapshot` ×2, `subscribe`), found by `tsc --noUnusedLocals` against base: 62 such locals at base, 61 after, and none new (the one fewer is `Desk.tsx`'s own `doCatch`, deleted with its file).
- **24 comments whose only subject was a deleted rule.** Each was reviewed by hand. A comment that also explains a surviving rule stays, for example `ITEM 83 M6` above `.wz-place-page-list`'s cap.
- **The blank lines the deletions left**, folded back to one.

## What the census corrected

- **`md-h3`–`md-h6` are live.** `draftDecoration.ts` builds `md-h${level}`. The screens never show a level-3 heading, so the selector report could not see them; the source can.
- **The step 5 report's `matched` is a count, not a list.** The per-selector record carries the matches. A first census read the count as an empty list, so its "no candidate matched" was blind. The check now reads `perSelector` and refuses a report without it.
- **`WALK_SHIPPED` is a tested switch, not a dead branch** (`help-choose-census` C6, its parked record, a mutant): kept by ruling.

## Proof (browserless)

- `c13-11-dead-check.mjs --base 97261feb --selectors <the step 5 report>`: **9/9**.
  - The six files are gone and imported by nothing.
  - The 26 exports are declared and named nowhere.
  - The 120 classes are styled by no selector and named in no code.
  - **The CSS is 97261feb's minus exactly the 172 selectors that name a listed class**, with 2,160 rule-selectors kept and every body unchanged.
  - No selector the report saw match an element names a listed class, and the report saw every listed class.
  - Liveness: a planted live class is reported by D5, and a planted missing selector by D4.
- `c13-10c-lexicon.mjs --base 97261feb --gone c13-11-lexicon.txt` (the new `--gone` option): **9/9**.
  - The 88 keys were in the table and are gone in every theme.
  - **The other 858 keys × 4 theme readings are identical, in order.**
  - The inline read matches the base with the gone keys set aside.
  - Without `--gone` it fails.
- **`c13-4d-links check`:** PASS; its plants `unfix`, `ghost` and `perma` fail. The 23 links in `docs/menus/item121-s0-survey.md` to `JournalEntry.tsx` now point at the file at the survey's own commit (`73680bc2`), where its line anchors are true. ⚠ Step 4d's claim (2) needs a successor for those rows: parked verbatim, awaiting Fable's ruling.
- **List data, no check edited:**
  - the readers guard loses its four `JournalEntry` entries;
  - `c13-10f-wordcount` loses its `HomeFlow` line (its own header asks for this; `SURFACES` already skips absent files): PASS 7.
- **Also:** `tsc` clean; `build:web` clean; `seed-guard` 36/36; seams 17/17.

## Proof (box, on Chat 1's go)

- The step 5 snapshot and selector report at the parent, compared at the tip.
- The dead check against that report.
- The readers guard.
- The lane, both legs.

Gate: Chat 1's full pair (global CSS).
