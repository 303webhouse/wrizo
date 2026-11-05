# Rulings: `apps/desktop/src/store/tutorLenses.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[tutorLenses §n]` points here.

## tutorLenses §1

From `apps/desktop/src/store/tutorLenses.ts`, line 48 at `7f1c6a84` (the comment that stays: "a title reads the words, never a style span's marks").

```ts
// POLISH #10 item 4: a title reads the words, never a style span's marks
```

## tutorLenses §2

From `apps/desktop/src/store/tutorLenses.ts`, line 59 at `7f1c6a84` (the comment that stays: "an entry whose whole text equals one already listed (or the open page's) is not listed again; empty text is never merged; display only").

```ts
  // POLISH #10 item 15 — the list shows only a title, and two different entries with the SAME words (a capture kept twice) read as one fragment twice. An entry whose whole text equals one already listed, or the open
  // page's own, is not listed again: the newest stands. Empty text (a photo, a voice note) is never merged. Display only - no entry is touched.
```
