# Rulings: `apps/desktop/src/store/tutorConsistency.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[tutorConsistency §n]` points here.

## tutorConsistency §1

From `apps/desktop/src/store/tutorConsistency.ts`, line 85 at `f079d49e` (the comment that stays: "Consistency reads the words: style-span marks and typed escapes are taken out (marks first: an escaped `\[` is text)").

```ts
  // FONT-SPAN (Fable's addition 1): Consistency reads the words, never a font span's marks (`]{.font-eb-garamond}` would otherwise
  // harvest as a word); every other convention is read exactly as before.
  // TYPED-LITERAL (Oct 16): and a typed character's escape backslash is taken out - after the font marks (an escaped `\[` is text)
```
