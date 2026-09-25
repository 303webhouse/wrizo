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

export interface MarkRun {
  kind: MarkKind;
  mark: string;
  /** index of the first character of the OPENING marker */
  open: number;
  /** index of the first character of the CLOSING marker */
  close: number;
}

interface Tok { ch: string; pos: number; len: number; canOpen: boolean; canClose: boolean }

const isSpace = (c: string | undefined): boolean => c === undefined || /\s/.test(c);

function tokenize(line: string): Tok[] {
  const toks: Tok[] = [];
  const push = (ch: string, pos: number, len: number) => {
    toks.push({ ch, pos, len, canOpen: !isSpace(line[pos + len]), canClose: pos > 0 && !isSpace(line[pos - 1]) });
  };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch !== '*' && ch !== '_' && ch !== '~') continue;
    let j = i;
    while (j < line.length && line[j] === ch) j++;
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

  // outermost first; then accept a run only if it nests inside, or sits apart from, everything already accepted
  found.sort((a, b) => a.open - b.open || (b.close + b.mark.length) - (a.close + a.mark.length));
  const accepted: MarkRun[] = [];
  for (const r of found) {
    const rEnd = r.close + r.mark.length;
    const crosses = accepted.some(a => {
      const aEnd = a.close + a.mark.length;
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
  return readMarks(line).filter(r => r.mark === mark).map(r => ({ open: r.open, close: r.close }));
}
