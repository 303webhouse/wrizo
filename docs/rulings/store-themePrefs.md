# Rulings: `apps/desktop/src/store/themePrefs.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[themePrefs §n]` points here.

## themePrefs §1

From `apps/desktop/src/store/themePrefs.ts`, line 29 at `e2898deb` (the comment that stays: "a raw localStorage read is untrusted: each field is validated against its enum, so a bad value falls to its default instead of reaching a data-* attribute").

```ts
// Fable's A2 (TH1 review, folded in TH2) — a raw localStorage read is
// untrusted input (hand-edited, a stale shape from a future version, or
// simply corrupted); each field is validated against its own enum before
// use rather than spread in verbatim, so a bad stored value falls through
// to that field's default instead of ever reaching `applyAttributes` (which
// would otherwise write a garbage `data-*` value straight onto <html>).
```
