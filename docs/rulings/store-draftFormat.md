# Rulings: `apps/desktop/src/store/draftFormat.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[draftFormat §n]` points here.

## draftFormat §1

From `apps/desktop/src/store/draftFormat.ts`, line 3 at `e2898deb` (the comment that stays: "Draft's tools: pure string transforms on `entry.text` (markdown conventions, no rich-text state) given a selection's linear offsets; the caller owns the DOM").

```ts
// AB2 S3 — Draft's tools, operating as markdown conventions directly on
// `entry.text` (S0's ruling: no separate rich-text state). Pure string
// transforms given the full text + a selection's linear character offsets
// (store/caretOffset.ts's getSelectionOffsets) — the caller (PageEditor.tsx)
// owns the DOM/selection side; this module only ever touches strings.
```

## draftFormat §2

From `apps/desktop/src/store/draftFormat.ts`, line 20 at `e2898deb` (the comment that stays: "FORMAT_MARK: one source for the marker characters (bold, italic, `__underline__`, `~~strike~~`), so forward-only insertion and a Draft wrap never drift; plain-text honest, export-stripped").

```ts
// FX7 S2 — the two markdown marks Free Write's own forward-only rail can
// ALSO reuse (PageEditor.tsx's applyFreeWriteFormat) — a single source of
// truth for the literal marker characters, so a forward-only insertion and
// a Draft-mode selection-wrap can never drift onto different conventions.
// ITEM 83 M4 (R1 + F2) — Underline joins the founder's set. Nick overruled
// Chamber 1's "nothing else" for Free Write by name: "I would like to add
// buttons for bolding, italicizing, and underlining."
//
// THE CONVENTION, per F2's stated default: `__word__`. Markdown reads that as
// a bold alternate; Wrizo drops that reading in-house, which is lawful because
// the frozen set was always the FOUNDER's set — his word extends it, exactly as
// the freeze provided. It stays plain-text honest (the storage law), the
// dimmed-syntax register renders the markers as craft, and export strips them
// like every other convention. One word from Nick re-tokens it.
// ITEM 122 — strikethrough joins the frozen set on Nick's ruling. `~~` is the
// conventional pair and, unlike `_`, the tilde carries no ordinary role in
// prose, so a single `~` needs no special defence the way a single
// underscore did.
```

## draftFormat §3

From `apps/desktop/src/store/draftFormat.ts`, line 152 at `e2898deb` (the comment that stays: "an empty pair is stored only when the reader reads it back as an empty run of this mark; otherwise nothing is written and the mark is held pending (an empty italic pair would read as a stray `**`)").

```ts
      // THE STRAY `**` (item 211, owner's queue): an empty ITALIC pair is two stars, which the one reader cannot tell from a lone bold
      // marker - so it was never a run, never hidden, and stayed on the page as literal `**` if the writer moved away without typing.
      // An empty pair is stored only when the reader reads it back as an empty run of this mark (`****` for bold, `***|***` inside an
      // empty bold, `____`, `~~~~`); otherwise nothing is written and the mark is held PENDING for the next text typed here.
```

## draftFormat §4

From `apps/desktop/src/store/draftFormat.ts`, line 292 at `e2898deb` (the comment that stays: "H is a toggle (adds `## `, or removes any level); + and - step toward h1 and h6, clamped; the token is read where the one lead reader puts it, never assumed at column 0").

```ts
// HEADINGS (Nick, 2026-10-06). H is a TOGGLE: on a line with no heading it adds `## ` (Heading 2 - the web editors' default for a
// new heading, since a post's title is its h1); on a heading line it removes whatever level is there ("all heading modifications
// should be undone"). + steps toward h1 and - toward h6, clamped at both ends, and do nothing on a line that is not a heading.
// The heading token is read where the ONE lead reader puts it (after tabs and line directives), never assumed at column 0.
```

## draftFormat §5

From `apps/desktop/src/store/draftFormat.ts`, line 327 at `e2898deb` (the comment that stays: "line-prefix directives (`>< ` centre, `>> ` right, a leading tab indents), not metadata: entry.text stays plain text with conventions; metadata would need a span model and a column").

```ts
// ITEM 83 M5 (R4 + F3) — LINE-PREFIX DIRECTIVES.
//
// Bullets and block quotes have plain-text conventions already (`- `, `> `).
// Indent and alignment do not, and F3's stated default is that they become
// line-prefix directives in the page's own dialect — plain-text honest,
// export-stripped like every other convention — rather than entry metadata.
// The concrete tokens, per the brief: `>< ` centres, `>> ` right-aligns,
// unmarked is left. Indent is a leading tab.
//
// WHY PREFIXES AND NOT METADATA. `entry.text` is plain text with conventions;
// that is the storage law the whole app rests on. Alignment held as metadata
// would need a span model and a schema column — a schema-class decision
// wearing a toolbar button's clothes, which is precisely the shape Chamber 1's
// ratified push-back rejected for typography. One word from Nick re-tokens
// these; nothing else changes if he does.
```

## draftFormat §6

From `apps/desktop/src/store/draftFormat.ts`, line 420 at `e2898deb` (the comment that stays: "the arrow indents a whole paragraph, repeatably; levels are counted in tabs, stored nowhere").

```ts
// ITEM 83 ERRATA E3 (2026-09-03) — THE ARROW INDENTS A WHOLE PARAGRAPH,
// REPEATABLY. Nick's walkthrough ruling, for outline use: the menu arrow
// applies to the paragraph containing the caret (or every paragraph the
// selection touches), not the line, and pressing again INCREASES the level.
//
// TAB-AS-INDENT IS ITEM 102'S AND IS NOT BUILT HERE. Nothing in this wave
// touches a key handler; the arrow is the only door.
//
// WHAT A PARAGRAPH IS, in a model that has no paragraphs. `entry.text` is
// plain text with conventions, and the only structural mark it has is the
// blank line `insertSpacing` writes. So a paragraph is a run of consecutive
// NON-BLANK lines, and the expansion below reads exactly that: from the first
// touched line, walk up while the line above has ink; from the last, walk down
// while the line below has ink. A selection spanning several paragraphs
// indents all of them and leaves the blank lines between them alone — a tab on
// a separator is invisible litter, never structure.
//
// LEVELS ARE COUNTED IN TABS, not stored anywhere. One press adds one leading
// tab to every line of the paragraph, so the level IS the tab count and it
// round-trips as plain text on F3's leading-tab convention with nothing to
// keep in step. `stripMarkdownConventions` already strips `^\t+` — plural,
// before this ticket — so multi-level indents export clean with no change.
//
// THE TOGGLE IS GONE, AND THAT IS THE POINT — AND THE COST. Until now `indent`
// ran through `toggleLinePrefix`, so a second press REMOVED the tab: the
// writer's way back was the button itself. Repeatability consumes that. There
// is no outdent partner in this drawer (FormatAction has no such member, and
// the only outdent controls in the app are the outline board's tree control
// and the legacy execCommand bar), so after this ticket the ways back are
// UNDO and undo alone — `applyRailFormat` records an atomic step into the
// editor's own undo stack for every rail click, so Ctrl+Z walks a level back
// reliably. That is a real way back, and it is not a dedicated one.
// **THE OUTDENT QUESTION IS SURFACED, NOT RESOLVED** — it is held for Nick's
// word, with a recommendation, in docs/menus/item83-errata-s0-survey.md (d).
// Nothing here invents the partner.
// ITEM 83 ERRATA E3, THE OUTDENT PARTNER (Nick's ruling) — the selection-to-
// paragraph expansion, lifted out of indentParagraphs UNCHANGED so the pair
// cannot drift. "The exact decrement" is a claim about SCOPE as much as about
// tabs: if the two computed their affected lines separately, one could later
// learn a rule the other did not and the pair would stop being a pair without
// anything failing. Sharing the code is the only version of that guarantee
// that survives the next edit.
```

## draftFormat §7

From `apps/desktop/src/store/draftFormat.ts`, line 479 at `e2898deb` (the comment that stays: "Enter makes no paragraph gap, so a line is a paragraph: the scope is the caret's line, or each selected line").

```ts
  // NICK'S RULING (2026-09-25, chat 1's flag): ENTER MAKES NO PARAGRAPH GAP, SO A LINE IS A PARAGRAPH. The scope used to walk up and
  // down across every consecutive inked line, so Tab on one of three lines indented all three. It is now the caret's own line - or,
  // with a selection, each selected line - and nothing beside it. (The two walks that stood here are removed, not disabled.)
```

## draftFormat §8

From `apps/desktop/src/store/draftFormat.ts`, line 492 at `e2898deb` (the comment that stays: "outdent, the exact decrement of indent on the same scope: one tab per press, floored at zero per line").

```ts
// THE OUTDENT PARTNER — the exact decrement of indentParagraphs below, on the
// SAME paragraph scope (shared above) and the same F3 leading-tab convention:
// the level IS the tab count, so one press removes one tab.
//
// FLOORED AT ZERO, and the floor is per LINE, not per press. A line with no
// leading tab is returned untouched rather than borrowing from a neighbour, so
// a paragraph whose lines sit at different levels flattens toward zero without
// any line going negative or losing real text. A press that finds nothing to
// remove is a no-op that still records an undo step — harmless, and cheaper
// than teaching the rail which presses "count".
//
// WHY THIS EXISTS, recorded because the cost was argued before the partner was
// ruled: `indent` used to run through toggleLinePrefix, so a second press
// removed the tab and the writer's way back WAS the button. E3 made indent
// repeatable, which spent that — and a repeatable one-way door is a door this
// drawer BUILDS, not merely one it finds. Undo walked a level back reliably
// (applyRailFormat records an atomic step per rail click, FX6 S1), but undo is
// a general way back, not a dedicated one, and it is not discoverable here.
```

## draftFormat §9

From `apps/desktop/src/store/draftFormat.ts`, line 562 at `e2898deb` (the comment that stays: "the block indent: one `>| ` token per level at the front of every line of the paragraph, so a wrapped line follows; outdent removes one").

```ts
// STEP 3 - THE BLOCK INDENT (Nick: "TAB + 1 indents the whole paragraph"). One `>| ` token per level at the front of every line of
// the paragraph (the same paragraph scope the tab indent uses, shared above), so a wrapped line follows the block. Outdent removes
// ONE token, floored at zero. Read and painted through the same line reader as every other structure token.
```

## draftFormat §10

From `apps/desktop/src/store/draftFormat.ts`, line 582 at `e2898deb` (the comment that stays: "what the caret is inside, pure (text in, flags out) so it is testable without a browser").

```ts
// ITEM 122 — WHAT THE CARET IS INSIDE. Draft's rail had NO active state at all
// before this: its format prop was `{ onFormat }` and nothing else, so there was
// never a stuck highlight to unstick on Draft — there was no highlight. (The
// stuck one Nick saw lives on Free Write, whose rail carries `boldOn` and whose
// two-press bracket leaves it armed by design. That surface's styling is being
// removed under item 121, so this is the state that replaces it, built caret-
// derived from the start rather than toggled.)
//
// PURE, AND DELIBERATELY SO: text in, flags out, no DOM. That makes the rule
// testable without a browser and keeps the one interesting decision explicit —
// A RUN COUNTS AS ACTIVE WHEN THE CARET IS ANYWHERE WITHIN IT, ITS MARKERS
// INCLUDED. That is the same boundary `decorateInlineForCard`'s reveal-adjacent
// rule already uses to un-collapse the marks, so the button lights at exactly
// the moment the writer can see the syntax they are inside. Two rules that
// disagreed about "inside" would be worse than either alone.
```

## draftFormat §11

From `apps/desktop/src/store/draftFormat.ts`, line 598 at `e2898deb` (the comment that stays: "one reader: a mark is active when the character to the caret's LEFT carries it (the rule typing follows), so a caret past a styled word's closing marks lights nothing; an empty pair just made counts").

```ts
  // ONE READER (Nick's live bug, 2026-10-06: "I can't click on the line next to 'BOLD'... It seems to just activate the strip menu").
  // This used to pair markers by `indexOf` across the WHOLE text - a fifth copy of the mark reader, which counted a caret just past a
  // run's closing marks as inside it. It now asks store/markRuns.ts for the caret's own line, and a mark is active exactly when the
  // character to the caret's LEFT carries it - the same left-character rule typing follows - so a caret placed after a styled word's
  // closing marks (a click past the line's end) lights nothing. An EMPTY pair a press just made counts, since typing takes it.
```

## draftFormat §12

From `apps/desktop/src/store/draftFormat.ts`, line 626 at `e2898deb` (no comment stays: the code reads plainly).

```ts
  // The old cycle (none -> # -> ## -> none) is retired by Nick's ruling of 2026-10-06 and deleted, not kept: H is a toggle now.
```

## draftFormat §13

From `apps/desktop/src/store/draftFormat.ts`, line 637 at `e2898deb` (the comment that stays: "paragraph-scoped and repeatable (see indentParagraphs)").

```ts
  // ITEM 83 ERRATA E3 — paragraph-scoped and repeatable now, no longer a
  // single-line toggle. See indentParagraphs above for the whole reasoning,
  // including the way back and the outdent question held for Nick's word.
```

## draftFormat §14

From `apps/desktop/src/store/draftFormat.ts`, line 664 at `e2898deb` (the comment that stays: "a font on highlighted words, line by line: read each character's face, apply the pick, write one span per stretch of equal face (merge, split, never nest two font spans), and split at emphasis marks so they nest").

```ts
// ---- FONT-SPAN: a font on HIGHLIGHTED words (Nick's ruling, Oct 13; docs/font-span-plan.md, Fable's four additions) --------------
// A pick is one operation on the plain text, line by line (a selection across lines becomes one span per line, as Bold does):
//   1. every character's face is read off the line's font spans (none = the page's or card's own face);
//   2. the selected characters take the picked face (null = the page's own face: the spans there are simply removed);
//   3. the line is written back with ONE span per stretch of equal face - so neighbours of one face MERGE, a span the selection only
//      partly covered is SPLIT at the selection's edge, and a word is never inside two font spans (marks never stack);
//   4. a stretch that would cross a Bold/Italic/Underline/Strike run is split at that run's marks, so the two NEST and the reader never
//      drops one as crossing (a dropped span would leave its marks on the page as text).
// The selection comes back on the same words (the highlight stays, as the mockup has it). One call is one undo step for the caller.
```

## draftFormat §15

From `apps/desktop/src/store/draftFormat.ts`, line 674 at `e2898deb` (the comment that stays: "a character's STYLE is its face and its size: a stretch of one style is one span with both classes, so a face span and a size span never cross or stack").

```ts
// POLISH #10 item 4 (Nick ruled A, Oct 25): the same pick for a SIZE. A character's STYLE is its face and its size; a face pick changes the face and
// keeps the size, a size pick the other way round, and a stretch of one style is written as ONE span with both classes - so a face span and a size
// span never cross, and never stack.
```

## draftFormat §16

From `apps/desktop/src/store/draftFormat.ts`, line 769 at `e2898deb` (the comment that stays: "apply size `points` (null: the surface's own) to the highlighted text only, keeping each word's face").

```ts
/** POLISH #10 item 4 (Nick ruled A, Oct 25): apply size `points` (null: the page's or card's own size) to the highlighted text - ONLY to it, even one
 *  character - keeping each word's face. The selection comes back on the same words; a collapsed selection changes nothing. */
```

## draftFormat §17

From `apps/desktop/src/store/draftFormat.ts`, line 825 at `e2898deb` (the comment that stays: "the highlighted words' size: N when all share a span size, null when all wear the surface's own, 'mixed' otherwise").

```ts
/** POLISH #10 item 4: the size of the highlighted words - N when every word carries the same span size, null when every word wears the page's (or
 *  card's) own size, 'mixed' otherwise. A collapsed selection reads null. */
```

## draftFormat §18

From `apps/desktop/src/store/draftFormat.ts`, line 847 at `e2898deb` (the comment that stays: "the whole-document (whole-card) pick: only the FACES go - a span's size stays").

```ts
/** The whole-document (whole-card) pick, as the mockup has it: every font span on the text is removed - the new face is the page's.
 *  POLISH #10 item 4: only the FACES go - a span's size stays (its span keeps only the size class). */
```

## draftFormat §19

From `apps/desktop/src/store/draftFormat.ts`, line 854 at `e2898deb` (the comment that stays: "the whole-document (whole-card) SIZE pick: every span's size goes; the faces stay").

```ts
/** POLISH #10 item 4: the whole-document (whole-card) SIZE pick - every span's size goes (the new size is the page's); the faces stay. */
```
