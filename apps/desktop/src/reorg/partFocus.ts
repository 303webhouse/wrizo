// A PART OPENED BY HER OWN MOVE TAKES HER CARET (Fable, Nov 22, 3:20 pm: MONDAY BLOCKER from POLISH's writing audit, R1: after the next-Part arrow, the Part foot's line or a row of the Parts list the top rail's Part name drops,
// the new Part opened with nothing focused and her letters went nowhere: PageEditor focuses only an EMPTY page, and a move just opened the page). The doors that are her own move between the Parts of the Doc she is writing in say
// which Part they are opening (wantPartFocus) before they navigate; the page that opens takes the note (takePartFocus) and puts the focus in its editor, the caret at the START of a Draft Part, at the end of a Free Write one.
// Nothing else sets the note, so a page opened any other way (the Desk, a link, the browser's back) is left as it was. The note is by Part id and lives a few seconds: a move that never reached its page leaves nothing behind.
const LIFE_MS = 4000;
let want: { id: string; at: number } | null = null;

/** her own move to Part `id`: the page that opens for it takes the focus */
export function wantPartFocus(id: string): void { want = { id, at: Date.now() }; }

/** true once, for the page that opens for the Part she moved to (and false for any other page, or after the note's life) */
export function takePartFocus(id: string): boolean {
  if (!want) return false;
  const mine = want.id === id && Date.now() - want.at < LIFE_MS;
  if (mine || Date.now() - want.at >= LIFE_MS) want = null;
  return mine;
}
