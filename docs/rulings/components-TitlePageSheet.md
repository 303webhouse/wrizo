# Rulings: `apps/desktop/src/components/TitlePageSheet.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[TitlePageSheet §n]` points here.

## TitlePageSheet §1

From `apps/desktop/src/components/TitlePageSheet.tsx`, line 4 at `e2898deb` (the comment that stays: "the Title Page: a small form over the page's own text; every edit serializes to the canonical text (store/titlePage.ts), so save, birth, sync, export and copy are the page's own; "by" is drawn, never typed").

```ts
// PAGE TEMPLATES, S5 (docs/plans/page-templates.md section 1; Fable Oct 16, Q1: a small STRUCTURED editor). The Title Page is five fields on the standard manuscript
// sheet - contact top-left, the word line top-right, then the title, the fixed word "by" and the author centred lower (the approved mockup). A flowing text editor cannot
// put the word line on the same row as the first contact line, so this is a small form over the page's own text: every edit serializes to the CANONICAL text
// (store/titlePage.ts, pure and golden-tested, written in the page dialect's `>> ` and `>< ` directives) and goes through the host's one onChange, so saving, birth
// on the first word, sync, export and copy are the page's own - there is no second model and no column. The text it reads back is parsed by structure; the host only
// mounts this when the text parses (otherwise the page draws as plain Draft text and nothing is lost).
//
// The title is stored as typed; the sheet's capitals and letter-spacing are CSS. "by" is drawn, never typed, and is written into the text only once a title or
// author exists, so a fresh Title Page is the empty string (no words, nothing born).
```

## TitlePageSheet §2

From `apps/desktop/src/components/TitlePageSheet.tsx`, line 14 at `e2898deb` (the comment that stays: "spell-check on for the title (the writer's words), off for names, the contact block and the word line; the title carries no spellCheck attribute so only three deliberate `false` fields exist").

```ts
// SPELL-CHECK (Fable's ruling, Oct 17): ON for the title - it is the writer's own words, like the page - and OFF for the author, the contact block and the word line, which are
// names, addresses and a count the checker only underlines. The title carries NO spellCheck attribute at all (the browser's default is on), so the page-wide census in
// scripts/harness/revspell.mjs sees only the three deliberate `spellCheck={false}` fields and still finds no third host that turns the checker ON.
```

## TitlePageSheet §3

From `apps/desktop/src/components/TitlePageSheet.tsx`, line 38 at `e2898deb` (the comment that stays: "preventScroll: focusing the title must not scroll the sheet and clip its first row").

```ts
  // preventScroll: focusing the title must not scroll the sheet's scroller - it left the first row (contact and word line) clipped under the page's top edge (ledger 92, frame 04)
```
