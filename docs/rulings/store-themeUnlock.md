# Rulings: `apps/desktop/src/store/themeUnlock.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[themeUnlock §n]` points here.

## themeUnlock §1

From `apps/desktop/src/store/themeUnlock.ts`, line 4 at `f079d49e` (the comment that stays: "a theme is OPEN if the server's precomputed `open` map says so, or it is the theme in use (the one clause the server cannot know); this file only reads").

```ts
// THEME PICKER (Fable, Oct 21 — theme-menu-brief.md / theme-rules.md §C / theme-unlock-count's
// own already-shipped schema). A theme is OPEN if ANY of: its lifetime word-count threshold is
// met, it's already in `themesOpened` (the grandfather set), or it's the theme currently in
// use — the third clause is pure client state and needs no server round-trip (Fable's own
// ruling on the schema ticket: "no new signal needed").
//
// SUPERSEDED (Fable's review of this ticket, Oct 21 1:09pm ruling): the first two clauses used
// to be computed HERE, client-side, from the raw wordsWritten/themesOpened/thresholds the server
// sent. Openness now DERIVES SERVER-SIDE (apps/server/src/sync.ts's own GET /theme-unlock) - the
// server returns a precomputed `open` map, and this module only adds the one clause the server
// cannot know (the current theme). No client write to themes_opened was ever added (confirmed:
// this file only ever reads).
//
// "Once open, always open" still falls out for free: wordsWritten only ever grows and
// themesOpened is append-only, so the server's own `open` map can never flip back to false once
// true for a given id.
```
