# Rulings: `apps/desktop/src/store/api.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[api §n]` points here.

## api §1

From `apps/desktop/src/store/api.ts`, line 169 at `e2898deb` (the comment that stays: "the Tutor reads the WORDS: at this one wire call, style-span marks (and a span half cut off at an edge) and the page's typed-literal escapes are taken out; chat lines are the writer's own and are not unescaped").

```ts
    // FONT-SPAN (Fable's addition 1, Oct 15): the Tutor reads the WORDS - a font span's marks (`[`, `]{.font-<slug>}`) are taken out of
    // every text it is sent, here at the one wire call, so no prompt builder above can forget it. Every other convention is kept as
    // it always travelled; a text with no span is passed through untouched (and an absent key stays absent).
    // TYPED-LITERAL (Oct 16): and a typed formatting character's escape backslash (`\*`) is taken out of the PAGE's text (delta, bible,
    // selection) - AFTER the font marks, since an escaped `\[` is text, never a span. The chat lines are the writer's own, typed in the
    // Tutor's box and never escaped by the editor, so they are not unescaped.
    // POLISH #10 item 4: and a size span's marks (the same run), and the HALF of a span the delta's tail or the selection's edge cut off - an orphan
    // closing marker, or an opening `[` left without its closer (a typed bracket is stored escaped, so an unescaped `[` here is only ever a span's)
```
