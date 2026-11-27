// A NOTE'S TITLE (the test version's "A title (optional)"). It is no new saved field: her title is the Card's FIRST LINE, which is already what the desk reads as a card's name (store/outlineRow splitOutlineText),
// and her note follows exactly as typed. With no title her words are untouched, byte for byte.
export function noteText(title: string, body: string): string {
  const head = title.replace(/[\r\n]+/g, ' ').trim();
  if (!head) return body;
  return body.trim() ? `${head}\n${body}` : head;
}
