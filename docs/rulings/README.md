# Rulings

Ruling histories moved verbatim out of the code by #13 (Fable's comment ruling, Oct 29). A comment that stays in the code says
why non-obvious code is as it is and cites its id; the history behind it lives here.

- `css-<file>.md` holds the histories from `apps/desktop/src/styles/<nn>-<file>.css` (step 7). A CSS comment ending in
  `[<file> §n]` points at the heading `## <file> §n` in that file, for example `[desk-frame §12]` in
  [css-desk-frame.md](css-desk-frame.md).
- Each entry names the line it came from and the commit it was moved from, then quotes the comment block whole.
- The proof that nothing was lost is `node apps/desktop/scripts/c13/c13-7-css-comments.mjs check --base <rev>`: every comment
  block removed from the CSS is here verbatim, and every citation resolves.
