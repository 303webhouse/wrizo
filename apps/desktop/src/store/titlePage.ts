// PAGE TEMPLATES, S1 (docs/plans/page-templates.md §1) - THE TITLE PAGE'S TEXT.
//
// A Title Page is five fields (the approved mockup's standard manuscript sheet): the writer's CONTACT block (top-left, any
// number of lines), a WORD line (top-right, e.g. "About 62,000 words"), the TITLE, the fixed word "by", and the AUTHOR (all
// three centred). They live in `entry.text` in the page dialect's own directives, in this fixed order:
//
//     Ada Marsh                     contact: left-aligned lines, 0..n
//     14 Quay Street
//     >> About 62,000 words         the word line: the FIRST right-aligned line
//                                   (a blank line)
//     >< The Late Ferry             the centred block: title,
//     >< by                         the fixed word,
//     >< Ada Marsh                  and author
//
// Written in the dialect (`>> ` right, `>< ` centre), so the text reads as itself in any editor, and an older client that
// has never heard of the template still draws the alignment. The title is stored as typed; the sheet's capitals and spacing
// are the lens's CSS. This is the same shape of module as `scriptText.ts`: a structured document with a prose shadow, pure,
// golden-string tested. A fresh Title Page is the EMPTY string (no words): `by` appears only once a title or author does.
//
// PARSE IS BY STRUCTURE, so a merge of any one field survives. It declines (returns null) when the text is not this shape - a
// stray line after the centred block, say - and the page then draws as plain Draft text. A decline loses nothing.

export interface TitlePageFields {
  contact: string[];
  words: string;
  title: string;
  author: string;
}

export const EMPTY_TITLE_PAGE: TitlePageFields = { contact: [], words: '', title: '', author: '' };

const RIGHT = '>> ';
const CENTRE = '>< ';

// A contact line must not read as a directive, or the parse would take it for the word line. The token is dropped from its front.
function plainContactLine(line: string): string {
  return line.replace(/^\s*(?:>>|><)\s?/, '').replace(/\s+$/, '');
}

export function serializeTitlePage(f: TitlePageFields): string {
  const contact = f.contact.map(plainContactLine);
  while (contact.length && !contact[contact.length - 1]) contact.pop();
  const words = f.words.trim();
  const title = f.title.trim();
  const author = f.author.trim();
  const out: string[] = [...contact];
  if (words || title || author) out.push(RIGHT + words);
  if (title || author) { out.push(''); out.push(CENTRE + title); out.push(CENTRE + 'by'); out.push(CENTRE + author); }
  return out.join('\n');
}

const isRight = (l: string) => l === '>>' || l.startsWith(RIGHT);
const isCentre = (l: string) => l === '><' || l.startsWith(CENTRE);
const after = (l: string, tok: string) => (l.length <= tok.length - 1 ? '' : l.slice(tok.length));

export function parseTitlePage(text: string): TitlePageFields | null {
  const t = text ?? '';
  if (!t.trim()) return { ...EMPTY_TITLE_PAGE, contact: [] };
  const lines = t.split('\n');
  const firstDirective = lines.findIndex((l) => isRight(l) || isCentre(l));
  const contactEnd = firstDirective === -1 ? lines.length : firstDirective;
  const contact = lines.slice(0, contactEnd);
  while (contact.length && !contact[contact.length - 1].trim()) contact.pop();
  if (contact.some((l) => isRight(l) || isCentre(l))) return null;
  if (firstDirective === -1) return { contact, words: '', title: '', author: '' };
  let i = firstDirective;
  let words = '';
  if (isRight(lines[i])) { words = after(lines[i], RIGHT).trim(); i += 1; }
  while (i < lines.length && !lines[i].trim()) i += 1; // the blank line(s) before the centred block
  const centred: string[] = [];
  while (i < lines.length && isCentre(lines[i])) { centred.push(after(lines[i], CENTRE).trim()); i += 1; }
  while (i < lines.length && !lines[i].trim()) i += 1; // trailing blank lines only
  if (i < lines.length) return null;                     // anything else is not this shape
  if (centred.length > 3) return null;
  if (centred.length >= 2 && centred[1].toLowerCase() !== 'by') return null;
  return { contact, words, title: centred[0] ?? '', author: centred[2] ?? '' };
}

/** True when the text is a Title Page the lens can draw (the empty page counts). */
export function isTitlePageText(text: string): boolean {
  return parseTitlePage(text) !== null;
}
