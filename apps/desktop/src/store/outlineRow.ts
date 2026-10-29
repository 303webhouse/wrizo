// The Outline row's reading of a card's text (BM1 S7, repaired Oct 25 - deploy #8's data bug). A card's text is `Title\nbody`: the Outline row is an <input>, which cannot hold a newline, so it shows the TITLE (the first line)
// and the text after it sits beside the input, read-only. Pure functions, no imports - the editing rule lives here so it can be proved without a browser.

/** The card's title (its first line) and its text (everything after the first newline, verbatim). */
export function splitOutlineText(text: string | undefined): { title: string; body: string } {
  const t = text ?? '';
  const nl = t.indexOf('\n');
  return nl < 0 ? { title: t, body: '' } : { title: t.slice(0, nl), body: t.slice(nl + 1) };
}

/** What a blur in an Outline row should write: NULL when the typed title is the title already (write nothing - the old handler wrote the input's value, newline-less, over the card every time), otherwise the typed
 *  title (one line: a stray newline becomes a space) followed by the card's text exactly as it was. */
export function outlineTitleEdit(text: string | undefined, typedTitle: string): string | null {
  const { title, body } = splitOutlineText(text);
  const clean = typedTitle.replace(/[\r\n]+/g, ' ');
  if (clean === title) return null;
  const nl = (text ?? '').indexOf('\n');
  return nl < 0 ? clean : clean + '\n' + body;
}

/** The Outline number of a row from its path in the tree (zero-based indices): [4] -> "5", [4, 0] -> "5.1". A Deck's Outline shows these (the mockup: 5 Midpoint Reversal, 5.1 / 5.2 / 5.3 its scenes); a plain Board keeps its bullets. */
export function outlineNumber(path: readonly number[]): string {
  return path.map((i) => i + 1).join('.');
}
