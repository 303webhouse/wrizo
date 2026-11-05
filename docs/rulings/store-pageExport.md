# Rulings: `apps/desktop/src/store/pageExport.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[pageExport §n]` points here.

## pageExport §1

From `apps/desktop/src/store/pageExport.ts`, line 111 at `7f1c6a84` (the comment that stays: "the .txt reads the words").

```ts
// POLISH #10 item 4: the .txt reads the words
```

## pageExport §2

From `apps/desktop/src/store/pageExport.ts`, line 146 at `7f1c6a84` (the comment that stays: "the .txt strips the cards' conventions and style spans to their words").

```ts
// POLISH #10 item 4: the .txt strips the cards' conventions and style spans to their words
```

## pageExport §3

From `apps/desktop/src/store/pageExport.ts`, line 260 at `7f1c6a84` (the comment that stays: "the Trash rides along: every soft-deleted page, after the live pages under "## From the Trash"; read-only (nothing is resurrected); system boards excluded").

```ts
  // S3 (E1.1) — the Trash rides along (Nick's word, ratified 2026-07-23).
  // Every soft-deleted page, rendered by the SAME pageBlock machinery as a
  // live page, clearly separated AFTER the live pages under an honest
  // "## From the Trash" marker — never silently vanished from the writer's
  // vacation insurance, and never RESURRECTED either: getDeletedEntries is a
  // read-only enumeration (clones only; nothing here clears deletedAt or
  // mutates a trashed row). System Boards stay excluded from BOTH lists
  // (derived membership mirrors, zero unique words). Chronological, same as
  // the live pages.
```
