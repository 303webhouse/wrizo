# Rulings: `apps/desktop/src/components/AddToSheet.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[AddToSheet §n]` points here.

## AddToSheet §1

From `apps/desktop/src/components/AddToSheet.tsx`, line 50 at `ded4321b` (the comment that stays: "the toast reads the ACTUAL outcome back after the write: a journal-origin page sent to the Shelf stays in the Journal, so the sheet never claims a move that did not happen").

```ts
  // B2 S3 (review fix, 2026-07-20) — a genuine truthfulness defect: this
  // toast used to unconditionally claim "moved; it left the Journal" for
  // EVERY page sent to the Shelf. Under S7's own pinned law (origin
  // 'journal' AND projectId null), a journal-origin page can never leave
  // Journal membership by un-filing alone — T3 also disqualifies it from
  // the Shelf while it stays journal-homed — so for the ONLY population
  // this sheet's two live call sites ever reach (Spread's bulk toolbar,
  // JournalEntry.tsx's legacy `.entry-add`, both drawn from the notebook
  // grid, which post-S3/S7 is always journal-origin or grandfathered-
  // journal-homed), this click became a genuine no-op that kept lying
  // about having moved the page (provable live: the page never actually
  // left the Spread grid or the Journal Board). The fix reads the ACTUAL
  // outcome back after the write and phrases the toast honestly either
  // way, rather than assuming — the same "one truth" discipline every
  // other B2 surface already follows. (A root-level "＋ New project" isn't
  // offered without a Drawer to file into first, so this stays the sheet's
  // only always-available root action; removing it outright would leave a
  // dead sheet whenever no Drawer yet exists — retiring the CLAIM, not the
  // control, is the fix that doesn't trade one defect for another.)
```

## AddToSheet §2

From `apps/desktop/src/components/AddToSheet.tsx`, line 74 at `ded4321b` (the comment that stays: "never a number directly before "Pages"; "these Pages" names the selection without one").

```ts
    // ITEM word-diet (Fable, review fix, Oct 13) — never a number directly
    // before "Pages"; "these Pages" names the selection without one.
```

## AddToSheet §3

From `apps/desktop/src/components/AddToSheet.tsx`, line 100 at `ded4321b` (the comment that stays: ""these Pages": the product noun is capitalized, with no number before it").

```ts
    // ITEM word-diet (Fable, review fix, Oct 13) — "these Pages" (capital P,
    // not a number, not lowercased — the product noun is capitalized like
    // Journal/Shelf/Drawer).
```

## AddToSheet §4

From `apps/desktop/src/components/AddToSheet.tsx`, line 185 at `ded4321b` (the comment that stays: ""a new Pages" drops the article; the product noun is capitalized").

```ts
        {/* ITEM word-diet (Fable, review fix, Oct 13) — "a new Pages" is
            banned (drop the article); the product noun is capitalized, not
            lowercased. */}
```
