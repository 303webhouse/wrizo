# Rulings: `apps/desktop/src/store/entryText.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[entryText §n]` points here.

## entryText §1

From `apps/desktop/src/store/entryText.ts`, line 7 at `f079d49e` (the comment that stays: "titles and excerpts are plain text: every derivation reads a line through the one reader (markRuns stripLine); a line that is only markup is skipped").

```ts
// ITEM 210 - TITLES AND EXCERPTS ARE PLAIN TEXT. A page's title, a card's excerpt, an echoed line and an exported heading are all
// DERIVED from `entry.text`, and that text carries the writer's own markup (`**bold**`, `# Heading`, `- bullet`, `>| ` block).
// Nick's screenshot: the title bar read "**TESTING** THE *DATABASE* SYNC". Every derivation now reads a line through the ONE reader
// (store/markRuns.ts stripLine: structure tokens out, and only the emphasis markers the page actually paints), so a title is what the
// page shows, and "2 * 3 * 4" is still "2 * 3 * 4". A line that is nothing but markup (`****`, `>| `) has nothing to read and is
// skipped, like a blank one.
```

## entryText §2

From `apps/desktop/src/store/entryText.ts`, line 22 at `f079d49e` (the comment that stays: "the opening non-empty line: entries have no titles, so this derives a label").

```ts
// The opening non-empty line — entries have no titles, so this derives a label. (Plain text since item 210.)
```

## entryText §3

From `apps/desktop/src/store/entryText.ts`, line 80 at `f079d49e` (the comment that stays: "the echoed line is shown to the writer, so it is plain text").

```ts
// item 210: the echoed line is shown to the writer, so it is plain text
```

## entryText §4

From `apps/desktop/src/store/entryText.ts`, line 94 at `f079d49e` (the comment that stays: "a calm, locale-independent stamp: short month, day, and time").

```ts
// Calm, locale-independent stamp like "Jun 14, 3:42 PM".
```
