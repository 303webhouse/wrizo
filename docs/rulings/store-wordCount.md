# Rulings: `apps/desktop/src/store/wordCount.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[wordCount §n]` points here.

## wordCount §1

From `apps/desktop/src/store/wordCount.ts`, line 3 at `7f1c6a84` (the comment that stays: "the ONE word counter: text is read through withoutFontMarks first (a span's inner space would count); the server counts the same way (polish10-wordcount.mjs holds them equal)").

```ts
/** POLISH #10 item 4 (Fable, Oct 28): the ONE word counter of the app's desktop side. A style span's marks are not words - a span that carries both a face
 *  and a size writes `]{.font-lora .size-14}`, whose inner space would count as one - so the text is read through withoutFontMarks first. The server's
 *  sync counts the same way (apps/server/src/wordCount.ts); scripts/harness/polish10-wordcount.mjs holds the two equal. */
```
