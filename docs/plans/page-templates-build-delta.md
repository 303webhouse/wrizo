# page-templates: build delta (against the approved plan `docs/plans/page-templates.md` @ e618fefd and Fable's rulings)

**Branch:** `page-templates` (off `main` @ 5dffd1f6). **Author:** INK. Rulings built as given: Q1 small structured editor for the Title Page; Q2 an empty Screenplay converts in place; Q3 the chip persists, captioned "Opened as a new page · Back"; Q4 numbers in exports; Q5 Custom dropped; Q6 and Q7 as written. No column, no migration, no server change (a source pin says so).

## What was built, by slice
- **S1** the text: `store/outlineText.ts` (levels = leading tabs, 3 levels, effective level clamped to previous + 1; numbers derived, never stored; Tab / Shift+Tab over the rows a selection touches; the Enter prefix; the plain and Markdown bodies), `store/titlePage.ts` (five fields <-> canonical text, parsed by structure, declines on anything else), `store/bibliographyText.ts`; `pageSettings.template` (optional, absent never null); the two export seams (`pageBodyFormatted` / `pageBodyPlain`, which Copy shares) branch on it.
- **S2** the picker: five rows with page sketches (`components/TemplateSketch.tsx`), the lexicon (Arbor Templates / Font, Blank, Screenplay, Outline, Title Page, Bibliography; Flux Presets / Typeface, Raw, Script, Spine, Cover, Sources), `?template=` on the address (`UnbornDescriptor.template`; PB1 holds: no row until the first word), the generalized `applyTemplate` (empty page: in place; words or ink: a new page), an empty Screenplay converting in place, the chip caption on both editors.
- **S3 + S4** the lenses: one wrapper per line in the ONE decoration funnel (`lensHtml` in `store/draftDecoration.ts`); the Outline's number is a `data-ol` attribute drawn by `::before` (in no DOM text, selection or copy), a Bibliography entry is a hanging-indent inline-block; Tab / Shift+Tab / Enter on the Outline through `ForwardOnlyEditor`'s `onLensKey`.
- **S5** `components/TitlePageSheet.tsx`: five fields over the canonical text, through the host's one `onChange`.
- **S6** `scripts/evidence/page-templates-frames.mjs` (4 combos x 5 frames; unrun).

## Where the build departs from the plan, or found something the plan did not (for review)
1. **Found in S0, closed before the key existed:** "Set as my default" copies the open page's settings into every future page (the item-114 trap). `store/pageDefaults.ts` `dressOnly` strips `template` as it strips `kind`; a mutant proves it.
2. **The item-158 Tab machine would have fought the Outline.** It indents the whole PARAGRAPH on a Tab tap (applied on release), and an outline is one unbroken paragraph. While an Outline is in Draft the machine stands aside (a ref read at press time, above the early return so the hooks guards hold), and the Outline's own Tab acts on the row. Not in the plan.
3. **The unborn slot now follows the address on one thing**: its template (`UnbornProvider` re-registers the slot when the descriptor's template changes), so the picker's brass and the lens read the choice before the page is born.
4. **Naming:** the structured editor's fields type is `TitleSheetFields`, because `types/index.ts` already has a `TitlePageFields` for the (dormant) screenplay title page.
5. **Revise draws the lens too** (Draft and Revise are the free-edit modes); Free Write's forward-only runway never does. The Outline's keys act in Draft only.
6. **Instrument changes (reads, not assertions):** the harness reads of the picker rows added beside the old reads.

## Parks (park, never edit; counted programmatically per file, not remembered)
**16** in all, each kept verbatim under a SUPERSEDED header with a live successor: `ab2` 2 (S4 + its record), `item211` 4 (C2, "pressing them", C3's heading, C2's record + a new C3 record), `item83f` 2, `item87` 2, `page-templates.mjs` 4 (the roster, "one live template", the grayed placeholders, the chip's text), `drawers-p1` 2 (D2b: the Templates block is rebuilt on purpose; D1a: the typing surface now differs from main ONLY by the lens, pinned line by line with its own mutants).

## Proof
- `scripts/harness/page-templates-r2.mjs`: PART 1 browserless **84/84** (the text modules with golden strings, the lens funnel run for real, the export / copy bodies, the defaults strip, source pins; 15 mutants all landed and killed). PART 2 (X1 to X11 on the real app: the picker per theme, in place vs a new page, the chip and its Back, Screenplay in both directions, the Outline's keys and numbers, the Bibliography's hanging indent, the Title Page's fields and a reload) is **written but not run; it needs Chat 1's box grant.**
- All 25 browserless harnesses in `scripts/harness/` exit 0 on this tree (counted by walking the directory); `tsc` clean; `build:web` ok; `seed-guard`, `hooks-order`, `hooks-order-ast` green.
- **Not yet proven, and why**: nothing here has been seen in a browser. The risk spots for the full pair: the Title Page sheet replacing the flowing editor (every `editorRef` use was read and is null-guarded, but warm-start and the invite overlays are untested against it), the Outline's Tab (the item-158 interaction above), and the unborn slot's template follow.
- A full pair before merge, as ruled.
