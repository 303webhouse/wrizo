// WRITING-SURFACE S0 STEP 3 - THE ONE READER OF INLINE MARKS.
//
// Before this file the fact "which characters on a line are emphasis markers, and which pair with which" existed twice, and the
// two copies disagreed. The formatter (draftFormat.ts) paired ANY two single stars; the decorator (draftDecoration.ts) paired the
// leftmost marker of each kind and could not nest at all. So "2 * 3 * 4" showed literal stars on the page while the formatter
// treated them as a run - pressing Italic on the 3 deleted both stars the writer could see (undo restored them) - and
// `__*x*__`, which the formatter writes when Underline follows Italic, printed its underline markers as text. The PW desk fixed the
// same class of thing for the anchor reader in 163: one reader, every consumer.
//
// THE RULES (CommonMark's flanking rule, kept deliberately small - this is a plain-text convention, not a Markdown engine):
//  - An OPENING marker must be followed by a non-space character; a CLOSING marker must be preceded by one. So the stars in
//    "2 * 3 * 4" are text. A marker pair with nothing between it (`****`, the empty pair Bold inserts at a bare caret) is a run.
//  - Bold `**`, underline `__`, strike `~~` are exactly two characters; italic `*` is one. A star-run of three is BOTH: bold
//    outermost, italic inside (`***x***`), which is what lets Italic and Bold un-mark each other back out of it. A run of four is
//    an empty pair (`**` `**`). Any other length is text.
//  - Runs may nest and may sit side by side; two that would CROSS (`**a *b** c*`) cannot both stand, so the one that opens later
//    is dropped and its characters stay literal. Nothing is ever hidden that is not part of a run that renders.
export type MarkKind = 'bold' | 'italic' | 'underline' | 'strike';

export const MARK_OF: Record<MarkKind, string> = { bold: '**', italic: '*', underline: '__', strike: '~~' };

// FONT-SPAN (Nick's ruling, Oct 13; docs/font-span-plan.md): a font on HIGHLIGHTED words is a run too - `[the words]{.font-<slug>}`,
// the bracketed span Pandoc reads, the slug being the roster face's name lower-cased with hyphens for spaces. Its two marks DIFFER
// (`[` opens, `]{.font-<slug>}` closes), so a run carries its closing mark when it is not its opening one; every reader that measures
// a closing mark reads `closeMark(r)`, never `r.mark`. The marks hold no whitespace, so no word counter ever counts one.
export type RunKind = MarkKind | 'font';

export interface MarkRun {
  kind: RunKind;
  mark: string;
  /** index of the first character of the OPENING marker */
  open: number;
  /** index of the first character of the CLOSING marker */
  close: number;
  /** the CLOSING marker when it is not `mark` (a font span's `]{.font-<slug>}`); absent for emphasis, whose two marks are one string */
  cmark?: string;
  /** a font span's face, as its slug (store/fontRoster.ts faceForSlug turns it back into a face) */
  face?: string;
}

/** A run's closing marker: `mark` for emphasis, the `]{.font-<slug>}` for a font span. */
export const closeMark = (r: { mark: string; cmark?: string }): string => r.cmark ?? r.mark;

/** A font span's closing marker for a face slug. */
export const fontCloseMark = (slug: string): string => `]{.font-${slug}}`;
const FONT_CLOSE = /^\]\{\.font-([a-z0-9]+(?:-[a-z0-9]+)*)\}/;

// The font spans on one line. A `[` opens; `]{.font-<slug>}` closes the nearest open `[`. A PLAIN `]` closes the nearest `[` too, as a
// literal pair - so a writer's own `[sic]` inside a span keeps the brackets balanced and stays text. An unclosed `[`, and a closing
// mark with no `[` before it, are text.
function fontRuns(line: string): MarkRun[] {
  const out: MarkRun[] = [];
  const stack: number[] = [];
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '[') { stack.push(i); continue; }
    if (c !== ']') continue;
    const o = stack.pop();
    const m = FONT_CLOSE.exec(line.slice(i, i + 64));
    if (m && o !== undefined) { out.push({ kind: 'font', mark: '[', open: o, close: i, cmark: m[0], face: m[1] }); i += m[0].length - 1; }
  }
  return out;
}

interface Tok { ch: string; pos: number; len: number; canOpen: boolean; canClose: boolean }

const isSpace = (c: string | undefined): boolean => c === undefined || /\s/.test(c);

// ---- TYPED-LITERAL (Nick's ruling, Oct 16; docs/typed-literal-plan.md): a formatting character the writer TYPES (or pastes) has no
// formatting meaning. It is stored with Markdown's own escape - a backslash before it - so it never becomes markup, and a .md export
// shows the literal character in any Markdown reader. An ESCAPE is a backslash followed by one of these; the backslash is the escape's
// hidden mark (the page shows the character alone), and the character is plain text. `\\` is an escaped backslash, so in `\\*` the star
// is real markup again (Markdown's own rule). Saved text from before the ruling holds no escapes and reads exactly as it did.
export const ESCAPABLE = new Set(['\\', '*', '_', '~', '#', '-', '>', '[']);

/** The positions of the escape backslashes on one line (each escapes the character right after it). */
export function readEscapes(line: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\' && i + 1 < line.length && ESCAPABLE.has(line[i + 1])) { out.push(i); i++; }
  }
  return out;
}

function tokenize(line: string): Tok[] {
  const toks: Tok[] = [];
  // TYPED-LITERAL: an escaped character is text - never a marker, and never part of a marker run beside it
  const escaped = new Set(readEscapes(line).map((e) => e + 1));
  const push = (ch: string, pos: number, len: number) => {
    toks.push({ ch, pos, len, canOpen: !isSpace(line[pos + len]), canClose: pos > 0 && !isSpace(line[pos - 1]) });
  };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch !== '*' && ch !== '_' && ch !== '~') continue;
    if (escaped.has(i)) continue;
    let j = i;
    while (j < line.length && line[j] === ch && !escaped.has(j)) j++;
    const n = j - i;
    if (ch === '*') {
      if (n >= 1 && n <= 3) push(ch, i, n);
      else if (n === 4) { push(ch, i, 2); push(ch, i + 2, 2); }
      else if (n === 6) { push(ch, i, 3); push(ch, i + 3, 3); }   // an empty bold-italic pair: `***` `***`
    } else if (n === 2) push(ch, i, 2);
    else if (n === 4) { push(ch, i, 2); push(ch, i + 2, 2); }
    i = j - 1;
  }
  return toks;
}

/** Every run of every kind on one line, non-crossing, ordered by where it opens (outer before inner). */
export function readMarks(line: string): MarkRun[] {
  const toks = tokenize(line);
  const found: MarkRun[] = [];

  const pairKind = (kind: MarkKind) => {
    const mark = MARK_OF[kind];
    // the tokens that can carry this kind, with the marker's own start for each ROLE (a three-star run splits differently
    // when it opens - bold first, italic inside - than when it closes - italic first, bold outside)
    const elig = toks.filter(t => (t.ch === (kind === 'underline' ? '_' : kind === 'strike' ? '~' : '*'))
      && (kind === 'bold' ? t.len === 2 || t.len === 3 : kind === 'italic' ? t.len === 1 || t.len === 3 : t.len === 2));
    const startAs = (t: Tok, role: 'open' | 'close'): number => {
      if (t.len !== 3) return t.pos;
      if (kind === 'bold') return role === 'open' ? t.pos : t.pos + 1;
      return role === 'open' ? t.pos + 2 : t.pos;
    };
    const stack: Tok[] = [];
    for (const t of elig) {
      if (t.canClose && stack.length > 0) {
        const o = stack.pop() as Tok;
        found.push({ kind, mark, open: startAs(o, 'open'), close: startAs(t, 'close') });
      } else if (t.canOpen) stack.push(t);
    }
  };
  pairKind('strike'); pairKind('underline'); pairKind('bold'); pairKind('italic');
  // FONT-SPAN: font spans join the same non-crossing rule - nested in, or apart from, every other run, or the later one is text
  found.push(...fontRuns(line));

  // outermost first; then accept a run only if it nests inside, or sits apart from, everything already accepted
  found.sort((a, b) => a.open - b.open || (b.close + closeMark(b).length) - (a.close + closeMark(a).length));
  const accepted: MarkRun[] = [];
  for (const r of found) {
    const rEnd = r.close + closeMark(r).length;
    const crosses = accepted.some(a => {
      const aEnd = a.close + closeMark(a).length;
      const apart = rEnd <= a.open || aEnd <= r.open;
      const nested = (a.open <= r.open && rEnd <= aEnd) || (r.open <= a.open && aEnd <= rEnd);
      return !apart && !nested;
    });
    if (!crosses) accepted.push(r);
  }
  return accepted;
}

/** The runs of one mark (`**`, `*`, `__`, `~~`) on a line - what the formatter toggles. */
export function runsOfMark(line: string, mark: string): Array<{ open: number; close: number }> {
  return readMarks(line).filter(r => r.kind !== 'font' && r.mark === mark).map(r => ({ open: r.open, close: r.close }));
}

// ---- THE LINE'S OWN STRUCTURE, read once (step 3) ------------------------------------------------------------------------
// A line's front is a run of structure tokens: leading tabs (the FIRST-LINE indent, one per level), the line directives
// (`>< ` centre, `>> ` right, `>| ` BLOCK indent - one per level, `> ` quote, `- ` bullet) in any order, and last of all a heading
// mark (`# `, `## `), after which the rest of the line is text. This used to be spelled four times (the formatter's two copies,
// the decorator's, and Copy My Words' regex chain); it is read here, with POSITIONS, and every consumer takes it from here.
export type LeadKind = 'tab' | 'align-center' | 'align-right' | 'block' | 'quote' | 'bullet' | 'bullet-circle' | 'bullet-square' | 'heading';
export interface LeadToken { kind: LeadKind; text: string; start: number; end: number }

/** The block-indent token. `>| ` at the start of a line is the whole-paragraph indent: one token per level, the paragraph's lines all
 *  carry it, wrapped lines follow. Chosen because ordinary prose never starts a line with `>|` and a space - a quoted `>` is `> `,
 *  a shell redirect mid-line is not at the start - so no existing page parses as it. */
export const BLOCK_TOKEN = '>| ';

const DIRECTIVES: ReadonlyArray<{ kind: LeadKind; text: string }> = [
  { kind: 'align-center', text: '>< ' },
  { kind: 'align-right', text: '>> ' },
  { kind: 'block', text: BLOCK_TOKEN },
  { kind: 'quote', text: '> ' },
  // Longer than `- ` and listed first, so a hollow or square mark is not read as the round hyphen.
  { kind: 'bullet-circle', text: '-+ ' },
  { kind: 'bullet-square', text: '-= ' },
  { kind: 'bullet', text: '- ' },
];

export function readLead(line: string, opts: { headings?: boolean } = {}): { tokens: LeadToken[]; length: number } {
  const headings = opts.headings !== false;
  const tokens: LeadToken[] = [];
  let i = 0;
  for (;;) {
    if (line[i] === '\t') { tokens.push({ kind: 'tab', text: '\t', start: i, end: i + 1 }); i++; continue; }
    const d = DIRECTIVES.find(x => line.startsWith(x.text, i));
    if (d) { tokens.push({ kind: d.kind, text: d.text, start: i, end: i + d.text.length }); i += d.text.length; continue; }
    if (headings) {
      // HEADINGS, six levels (Nick, 2026-10-06: "whatever the standard is for WordPress or other web-based apps"): `#` to `######` and
      // a space, one-to-one with HTML h1-h6. Seven or more hashes are text, as in Markdown.
      const hm = /^(#{1,6}) /.exec(line.slice(i));
      const h = hm ? hm[0] : null;
      if (h) { tokens.push({ kind: 'heading', text: h, start: i, end: i + h.length }); i += h.length; }
    }
    break;
  }
  return { tokens, length: i };
}

/** `text` with the markers of `runs` taken out (positions from readMarks on that same text): what the page SHOWS, as plain text. */
export function removeMarkers(text: string, runs: MarkRun[], escapes: number[] = []): string {
  const cut = new Set<number>(escapes);
  for (const r of runs) {
    for (let k = 0; k < r.mark.length; k++) cut.add(r.open + k);
    const cm = closeMark(r);
    for (let k = 0; k < cm.length; k++) cut.add(r.close + k);
  }
  let out = '';
  for (let i = 0; i < text.length; i++) if (!cut.has(i)) out += text[i];
  return out;
}

/** One line as plain reading text: its structure tokens gone, its emphasis markers gone, and ONLY those the reader accepts - so
 *  "2 * 3 * 4" exports exactly as it is shown. (Copy My Words uses this; the decorator paints from the same two readers.) */
export function stripLine(line: string): string {
  const rest = line.slice(readLead(line).length);
  // TYPED-LITERAL: the escapes' backslashes go too - the reader sees the typed character itself
  return removeMarkers(rest, readMarks(rest), readEscapes(rest));
}

/** TYPED-LITERAL: the text with every escape's backslash taken out and EVERYTHING else kept (marks, structure) - the words a reader of the
 *  page's text is given (the Tutor's prompts, Consistency). */
export function unescapeTyped(text: string): string {
  if (!text.includes('\\')) return text;
  return text.split('\n').map((line) => {
    const esc = readEscapes(line);
    if (!esc.length) return line;
    const cut = new Set(esc);
    let out = '';
    for (let i = 0; i < line.length; i++) if (!cut.has(i)) out += line[i];
    return out;
  }).join('\n');
}

/** FONT-SPAN (Fable's addition 1, Oct 15): the text with every font span's two marks taken out and EVERYTHING else kept exactly - the
 *  emphasis, the structure tokens, the words. What the Tutor's prompts, Consistency and any reader of the words are given. */
export function withoutFontMarks(text: string): string {
  if (!text.includes('{.font-')) return text;
  return text.split('\n').map((line) => {
    const lead = readLead(line).length;
    const rest = line.slice(lead);
    const fonts = readMarks(rest).filter((r) => r.kind === 'font');
    return fonts.length ? line.slice(0, lead) + removeMarkers(rest, fonts) : line;
  }).join('\n');
}
