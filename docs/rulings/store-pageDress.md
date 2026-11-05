# Rulings: `apps/desktop/src/store/pageDress.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[pageDress §n]` points here.

## pageDress §1

From `apps/desktop/src/store/pageDress.ts`, line 42 at `e2898deb` (the comment that stays: "the margin is a multiple of the page-inch (the paper is a fixed letter page; the margin moves the text inside it); the multipliers keep the old ratio, and index.css turns them back into px off the letter page").

```ts
  // (BEFORE PAGE-SIZE, kept as the record:) A LENGTH, not a padding shorthand: the framed sheet multiplies its own
  // horizontal padding by --paper-scale (index.css), so handing it a finished
  // shorthand would silently drop that scaling at wide viewports — the exact
  // "two formulas for one number" failure this wave exists to remove. The var
  // carries only the base measure; CSS keeps ownership of the scale.
  // PAGE-SIZE (Fable's ruling b, Oct 23) - the margin is now a MULTIPLE OF THE PAGE-INCH, not a pixel length: the paper is fixed (it is a letter
  // page) and the margin choice moves the text inside it - narrow ~82 characters a line, normal 1in ~75, wide ~64. The multipliers keep the old
  // choices' own ratio to normal (26/38, 1, 58/38), so index.css turns them back into exactly 26/38/58px wherever the page is not a letter page
  // (`.desk-frame-stage .mode-page`'s 38px x this) and into letter-inches on the prose page (`--wz-letter-in` x this). index.css derives
  // `--wz-page-pad-x` from it - the ONE finished margin length TOOLS' scrollbar-flush cancels against - so it is never written inline here, where
  // it would override the stylesheet's own derivation.
```
