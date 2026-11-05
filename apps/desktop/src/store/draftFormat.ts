import { closeMark, fontCloseMark, spanCloseMark, readLead, readMarks, runsOfMark, stripLine, withoutFontMarks, BLOCK_TOKEN } from './markRuns';

// Draft's tools: pure string transforms on `entry.text` (markdown conventions, no rich-text state) given a selection's linear offsets; the caller owns the DOM [draftFormat §1]

// ITEM 83 M5 (R4) — Draft's roster grows by founder word: "it should have a
// lot more formatting options (bulleted lists, indention/block quote, line
// spacing, text alignment (right align, left align, center, etc.)". This
// supersedes Chamber 1's deferral of alignment/indentation ("until a real need
// names itself" — the founder just named it). Underline joins from R1.
export type FormatAction =
  | 'bold' | 'italic' | 'underline' | 'strike' | 'heading' | 'heading-up' | 'heading-down' | 'spacing'
  | 'bullet' | 'bullet-circle' | 'bullet-square' | 'quote' | 'indent' | 'outdent' | 'block-indent' | 'block-outdent'
  | 'align-left' | 'align-center' | 'align-right';
export type StructureKind = 'prose' | 'screenplay';

// FORMAT_MARK: one source for the marker characters (bold, italic, `__underline__`, `~~strike~~`), so forward-only insertion and a Draft wrap never drift; plain-text honest, export-stripped [draftFormat §2]
export const FORMAT_MARK: Record<'bold' | 'italic' | 'underline' | 'strike', string> =
  { bold: '**', italic: '*', underline: '__', strike: '~~' };

// WRITING-SURFACE S0 STEP 2 - Ctrl/Cmd+B, +I, +U. The keyboard door to the SAME formatter the toolbar buttons call (the one
// map, here, so the page and the card popup cannot drift). Until now these keys did nothing at all (frames Draft-ctrl-b/i/u:
// stored text and DOM unchanged). Shift and Alt are excluded (Ctrl+Shift+U is a system unicode-entry chord on some
// platforms), and so is an IME composition, whose candidate window may use these keys itself.
export function formatShortcutAction(e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean; isComposing?: boolean }): 'bold' | 'italic' | 'underline' | null {
  if (e.isComposing || !(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return null;
  const k = e.key.toLowerCase();
  return k === 'b' ? 'bold' : k === 'i' ? 'italic' : k === 'u' ? 'underline' : null;
}

export interface FormatResult {
  text: string;
  start: number; // caret/selection to restore after the DOM is re-decorated
  end: number;
  /** A mark to wrap around the NEXT text typed at `start`, when an empty pair of it cannot be stored (see toggleInline). The text is
   *  unchanged; the editor holds the mark until the writer types there, or moves away. */
  pending?: string;
  /** card-held-italic: a mark whose run ENDS for the next text typed at `start` - the caret sat directly before the run's own closing
   *  mark when the writer pressed it off. The text is unchanged; the editor types what comes next OUTSIDE the closing mark. */
  exitPending?: string;
}

function lineBounds(text: string, at: number): { start: number; end: number } {
  const start = text.lastIndexOf('\n', at - 1) + 1;
  let end = text.indexOf('\n', at);
  if (end === -1) end = text.length;
  return { start, end };
}

// Bold/Italic wrap the selection (iA/Cmd+B convention). An empty (collapsed)
// selection inserts an empty marker pair with the caret parked between them,
// so the next characters typed land inside it.
function wrapSelection(text: string, start: number, end: number, marker: string): FormatResult {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);
  const next = `${before}${marker}${selected}${marker}${after}`;
  if (selected.length === 0) {
    const caret = start + marker.length;
    return { text: next, start: caret, end: caret };
  }
  return { text: next, start: start + marker.length, end: end + marker.length };
}

// WRITING-SURFACE S0 STEP 2 - THE INLINE MARKS TOGGLE, AND A SELECTION MAY CROSS LINES.
//
// WHAT THE WRITER HIT (measured, docs/evidence/writing-s0/frames.json): Bold pressed twice stored `****word****`; Italic
// pressed on an italic word stored `**word**` (a BOLD - the two single stars merged with the two the press added); and
// select-all then Bold stored ONE pair around the whole selection, `**line one\nline two**`, which the renderer (per line)
// never paints, so the asterisks stayed on the page. All three are one cause: `wrapSelection` only ever wrapped.
//
// THE RULES, in one place:
//  - A press is judged against the LINES the selection touches. Every non-blank line contributes one SEGMENT: the selected
//    part of it, with leading whitespace and the line's own prefixes (tabs, `- `, `> `, `>< `, `# `) left out - a mark placed
//    before `- ` would stop it being a bullet - and trailing whitespace trimmed.
//  - If EVERY segment is already carrying the mark, the press REMOVES it from all of them; otherwise it APPLIES it to all
//    (the word-processor rule: a mixed selection becomes uniformly marked, then a second press clears it).
//  - Applying to a segment first strips that mark from anything already inside it, so a run is never nested in itself.
//  - Removing from part of a run SPLITS it: `**abc**` with `b` selected becomes `**a**b**c**`; when the part touches the run's
//    edge the marker is dropped instead of leaving an empty pair.
//  - A collapsed caret inside a run removes that run's markers; inside an empty pair `****` it removes the pair; elsewhere it
//    inserts an empty pair with the caret between (unchanged).
//  - The selection afterwards is the CONTENT (markers excluded), so pressing the same button again reads the run as "inner"
//    and un-marks it - which is what makes the second press the inverse of the first.
interface MarkRun { open: number; close: number }

/** The runs of `mark` on one line: `open`/`close` are the indices of the two markers, the interior lies between. STEP 3: this is
 *  no longer a reader of its own - it asks store/markRuns.ts, the ONE reader the decorator paints from, so what the formatter
 *  toggles is exactly what the page shows as a run ("2 * 3 * 4" has no run in either, and `***x***` is both bold and italic in both). */
function runsOf(line: string, mark: string): MarkRun[] {
  return runsOfMark(line, mark);
}

/** How many leading characters of `line` are structure, not prose: tabs, line directives and a heading mark. Read by the ONE
 *  reader (store/markRuns.ts readLead), which the decorator and Copy My Words use too. */
function leadLength(line: string): number {
  return readLead(line).length;
}

interface Segment { a: number; b: number; ls: number; }

function selectedSegments(text: string, start: number, end: number): Segment[] {
  const out: Segment[] = [];
  let ls = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  if (start === 0) ls = 0;
  while (ls <= end) {
    let le = text.indexOf('\n', ls);
    if (le === -1) le = text.length;
    let a = Math.max(start, ls, ls + leadLength(text.slice(ls, le)));
    let b = Math.min(end, le);
    while (a < b && /\s/.test(text[a])) a++;
    while (b > a && /\s/.test(text[b - 1])) b--;
    if (b > a) out.push({ a, b, ls });
    if (le >= text.length) break;
    ls = le + 1;
  }
  return out;
}

function toggleInline(text: string, start: number, end: number, mark: string): FormatResult {
  const ml = mark.length;
  if (start === end) {
    // (An empty pair `**|**` is an ordinary run to the shared reader, so the caret-inside-a-run branch below removes it - and Italic
    // on that same caret finds no italic run, so it inserts its own pair INSIDE (`***|***`) instead of stripping one star from each
    // side of the bold pair, which the old adjacent-characters test did.)
    const ls = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    let le = text.indexOf('\n', start);
    if (le === -1) le = text.length;
    const at = start - ls;
    const run = runsOf(text.slice(ls, le), mark).find(r => at >= r.open && at <= r.close + ml);
    if (!run) {
      // an empty pair is stored only when the reader reads it back as an empty run of this mark; otherwise nothing is written and the mark is held pending (an empty italic pair would read as a stray `**`) [draftFormat §3]
      const w = wrapSelection(text, start, end, mark);
      const wls = w.text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      let wle = w.text.indexOf('\n', start);
      if (wle === -1) wle = w.text.length;
      const empty = runsOf(w.text.slice(wls, wle), mark).some(r => r.open === start - wls && r.close === r.open + ml);
      return empty ? w : { text, start, end, pending: mark };
    }
    // CARD-HELD-ITALIC (chat 1's card-port frames, C3a; the page did the same): a press with the caret DIRECTLY BEFORE this run's own
    // closing mark, the run holding text, is the writer turning the style OFF where they are typing - Ctrl+I, words, Ctrl+I, more words.
    // Removing the run there unwrapped the very words the held mark had just made. So the run stays, and the mark is held as an EXIT:
    // what is typed next lands after the closing mark (store/hiddenMarksEditing.ts). Anywhere else inside a run - the middle, the start
    // - the press removes the run, as it always has; an EMPTY pair (a press just made it) is not an exit either.
    if (at === run.close && run.close > run.open + ml) return { text, start, end, exitPending: mark };
    const o = ls + run.open;
    const c = ls + run.close;
    const next = text.slice(0, o) + text.slice(o + ml, c) + text.slice(c + ml);
    const caret = start <= o + ml ? o : start >= c ? c - ml : start - ml;
    return { text: next, start: caret, end: caret };
  }

  const segs = selectedSegments(text, start, end);
  if (segs.length === 0) return { text, start, end };

  interface Plan { a: number; b: number; inner: MarkRun | null; fulls: MarkRun[]; marked: boolean; ls: number }
  const plans: Plan[] = segs.map(sg => {
    const le0 = text.indexOf('\n', sg.ls);
    const line = text.slice(sg.ls, le0 === -1 ? text.length : le0);
    let A = sg.a - sg.ls;
    let B = sg.b - sg.ls;
    const runs = runsOf(line, mark);
    const inner = runs.find(r => r.open + ml <= A && B <= r.close) ?? null;
    if (!inner) {
      // A selection edge that lands inside a run pulls the whole run in, so a half-selected run is never left half-marked.
      for (const r of runs) {
        if (A > r.open && A < r.close + ml) A = r.open;
        if (B > r.open && B < r.close + ml) B = r.close + ml;
      }
      // ...and an edge that would cut ACROSS a different mark's run pulls that run in too, so a new mark lands OUTSIDE it
      // (`__*x*__`, never `*__x*__`). A segment lying wholly INSIDE another run stays where it is: that is honest nesting.
      for (const other of Object.values(FORMAT_MARK)) {
        if (other === mark) continue;
        for (const r of runsOf(line, other)) {
          const rEnd = r.close + other.length;
          const overlaps = A < rEnd && B > r.open;
          const inside = A >= r.open + other.length && B <= r.close;
          const covers = A <= r.open && B >= rEnd;
          if (overlaps && !inside && !covers) { A = Math.min(A, r.open); B = Math.max(B, rEnd); }
        }
      }
      // FONT-SPAN: a font span is a run too - an emphasis edge that would cut across one pulls it in, so the two nest
      for (const r of readMarks(line).filter(x => x.kind === 'font')) {
        const rEnd = r.close + closeMark(r).length;
        const overlaps = A < rEnd && B > r.open;
        const inside = A >= r.open + r.mark.length && B <= r.close;
        const covers = A <= r.open && B >= rEnd;
        if (overlaps && !inside && !covers) { A = Math.min(A, r.open); B = Math.max(B, rEnd); }
      }
    }
    const fulls = inner ? [] : runs.filter(r => A <= r.open && r.close + ml <= B);
    // The segment is MARKED when every word-character in it sits inside one of its own runs. Whitespace and the mark
    // characters themselves (`*`, `_`, `~` - another mark's markers) are not words, so a neighbouring mark never makes a
    // fully-marked segment look half-plain.
    let bare = 0;
    // FONT-SPAN: a font span's own marks (`[` and `]{.font-<slug>}`) are not words either
    const fontMarkAt = new Set<number>();
    for (const r of readMarks(line).filter(x => x.kind === 'font')) {
      fontMarkAt.add(r.open);
      for (let k = 0; k < closeMark(r).length; k++) fontMarkAt.add(r.close + k);
    }
    for (let i = A; i < B; i++) {
      if (/[\s*_~]/.test(line[i]) || fontMarkAt.has(i)) continue;
      if (!fulls.some(r => i >= r.open && i < r.close + ml)) bare++;
    }
    const marked = !!inner || (fulls.length > 0 && bare === 0);
    return { a: sg.ls + A, b: sg.ls + B, inner, fulls, marked, ls: sg.ls };
  });
  const removing = plans.every(pl => pl.marked);

  let out = '';
  let cursor = 0;
  let firstStart = -1;
  let lastEnd = -1;
  for (const pl of plans) {
    out += text.slice(cursor, pl.a);
    const seg = text.slice(pl.a, pl.b);
    // the segment's text with the markers of its OWN full runs taken out (relative offsets)
    let stripped = '';
    let from = 0;
    for (const r of pl.fulls) {
      const ro = pl.ls + r.open - pl.a;
      const rc = pl.ls + r.close - pl.a;
      stripped += seg.slice(from, ro) + seg.slice(ro + ml, rc);
      from = rc + ml;
    }
    stripped += seg.slice(from);

    let piece: string;
    let contentAt: number;   // offset of the content inside `piece`
    let contentLen: number;
    if (removing && pl.inner) {
      // split the run around the selected part; the run's own edges are consumed, not doubled
      const r = pl.inner;
      const io = pl.ls + r.open + ml;
      const ic = pl.ls + r.close;
      const before = text.slice(io, pl.a);
      const mid = text.slice(pl.a, pl.b);
      const after = text.slice(pl.b, ic);
      // this segment replaces the WHOLE run, so its range is widened to the run's markers
      out = out.slice(0, out.length - (pl.a - (pl.ls + r.open)));
      // what is left of the run on either side is re-wrapped only if it holds words; a bare neighbouring mark (the italic
      // inside a bold-italic, say) is kept as it is, not wrapped in a pair of its own
      const wrapBefore = /[^\s*_~]/.test(before);
      const wrapAfter = /[^\s*_~]/.test(after);
      piece = (wrapBefore ? mark + before + mark : before) + mid + (wrapAfter ? mark + after + mark : after);
      contentAt = wrapBefore ? ml + before.length + ml : before.length;
      contentLen = mid.length;
      const newStart = out.length + contentAt;
      if (firstStart === -1) firstStart = newStart;
      lastEnd = newStart + contentLen;
      out += piece;
      cursor = pl.ls + r.close + ml;
      continue;
    }
    if (removing) { piece = stripped; contentAt = 0; contentLen = stripped.length; }
    else if (pl.marked && pl.inner) { piece = seg; contentAt = 0; contentLen = seg.length; }   // already marked: leave it
    else { piece = mark + stripped + mark; contentAt = ml; contentLen = stripped.length; }
    const newStart = out.length + contentAt;
    if (firstStart === -1) firstStart = newStart;
    lastEnd = newStart + contentLen;
    out += piece;
    cursor = pl.b;
  }
  out += text.slice(cursor);
  return { text: out, start: firstStart, end: lastEnd };
}

// H is a toggle (adds `## `, or removes any level); + and - step toward h1 and h6, clamped; the token is read where the one lead reader puts it, never assumed at column 0 [draftFormat §4]
function headingAt(text: string, at: number): { ls: number; le: number; tok: { start: number; end: number; level: number } | null } {
  const { start: ls, end: le } = lineBounds(text, at);
  const t = readLead(text.slice(ls, le)).tokens.find(x => x.kind === 'heading');
  return { ls, le, tok: t ? { start: ls + t.start, end: ls + t.end, level: t.text.length - 1 } : null };
}
function setHeading(text: string, at: number, level: number | null): FormatResult {
  const { ls, le, tok } = headingAt(text, at);
  const ins = level === null ? '' : '#'.repeat(level) + ' ';
  const s = tok ? tok.start : ls + readLead(text.slice(ls, le), { headings: false }).length;
  const e = tok ? tok.end : s;
  const next = text.slice(0, s) + ins + text.slice(e);
  const delta = ins.length - (e - s);
  const caret = at >= e ? at + delta : at >= s ? s + ins.length : at;
  return { text: next, start: caret, end: caret };
}
/** The heading level (1-6) of the caret's line, or null. What lights the H button. */
export function headingLevelAt(text: string, at: number): number | null {
  return headingAt(text, at).tok?.level ?? null;
}


// Spacing inserts a paragraph break (a blank line) at the caret — the
// frozen convention's third and last mark (S0 rider 1).
function insertSpacing(text: string, start: number, end: number): FormatResult {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const next = `${before}\n\n${after}`;
  const caret = start + 2;
  return { text: next, start: caret, end: caret };
}

// line-prefix directives (`>< ` centre, `>> ` right, a leading tab indents), not metadata: entry.text stays plain text with conventions; metadata would need a span model and a column [draftFormat §5]
export const LINE_DIRECTIVE = {
  bullet: '- ',
  'bullet-circle': '-+ ',
  'bullet-square': '-= ',
  quote: '> ',
  indent: '\t',
  'align-center': '>< ',
  'align-right': '>> ',
} as const;

// WRITING-SURFACE S0 STEP 2 - the line tools act on EVERY line the selection touches, not only the caret's. Select a list and
// press Bullet and the first line alone used to change. A line's structure is a run of tokens at its front - tabs and the
// directives `>< `, `>> `, `> `, `- ` in any order - and a toggle finds its token ANYWHERE in that run (so Bullet still finds the
// `- ` behind a centring `>< `, and removes it), while a new token goes in AFTER the leading tabs (so Outdent still finds them).
// If every touched line already has the token the press removes it from all; otherwise it adds it to those that lack it.
// Alignment is exclusive: applying one drops the other, since a line cannot be both. Blank lines in a multi-line selection are
// left blank; a caret on a lone blank line still acts on it, so the level can be set before typing.
function leadTokens(line: string): { tokens: string[]; length: number } {
  const lead = readLead(line, { headings: false });
  return { tokens: lead.tokens.map(t => t.text), length: lead.length };
}

function touchedLines(text: string, start: number, end: number): Array<{ ls: number; le: number }> {
  const all: Array<{ ls: number; le: number }> = [];
  let ls = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
  for (;;) {
    let le = text.indexOf('\n', ls);
    if (le === -1) le = text.length;
    all.push({ ls, le });
    if (le >= end || le >= text.length) break;
    ls = le + 1;
  }
  // a selection that ends exactly ON a line's first character has not touched that line
  if (end > start && all.length > 1 && all[all.length - 1].ls === end) all.pop();
  if (all.length === 1) return all;
  return all.filter(l => text.slice(l.ls, l.le).trim().length > 0);
}

function toggleLines(text: string, start: number, end: number, token: string, exclusive: readonly string[] = []): FormatResult {
  const lines = touchedLines(text, start, end);
  const has = lines.map(l => leadTokens(text.slice(l.ls, l.le)).tokens.includes(token));
  const removing = lines.length > 0 && has.every(Boolean);
  return rewriteLeads(text, start, end, lines, (tokens) => {
    if (removing) return tokens.filter(t => t !== token);
    const kept = tokens.filter(t => !exclusive.includes(t));
    if (kept.includes(token)) return kept;
    let at = 0;
    while (at < kept.length && kept[at] === '\t') at++;
    return [...kept.slice(0, at), token, ...kept.slice(at)];
  });
}

/** Replace each touched line's leading tokens with `next(tokens)`, and carry the selection across the change. */
function rewriteLeads(text: string, start: number, end: number, lines: Array<{ ls: number; le: number }>, next: (tokens: string[]) => string[]): FormatResult {
  const edits: Array<{ at: number; del: number; ins: string }> = [];
  for (const l of lines) {
    const lead = leadTokens(text.slice(l.ls, l.le));
    const ins = next(lead.tokens).join('');
    if (ins !== text.slice(l.ls, l.ls + lead.length)) edits.push({ at: l.ls, del: lead.length, ins });
  }
  if (edits.length === 0) return { text, start, end };
  let out = '';
  let cursor = 0;
  for (const e of edits) { out += text.slice(cursor, e.at) + e.ins; cursor = e.at + e.del; }
  out += text.slice(cursor);
  // a position inside (or at the end of) a rewritten lead lands after the new lead; after it, it shifts by the change
  const map = (x: number): number => {
    let shift = 0;
    for (const e of edits) {
      if (x < e.at) break;
      if (x <= e.at + e.del) return e.at + shift + e.ins.length;
      shift += e.ins.length - e.del;
    }
    return x + shift;
  };
  return { text: out, start: map(start), end: map(end) };
}

// the arrow indents a whole paragraph, repeatably; levels are counted in tabs, stored nowhere [draftFormat §6]
function paragraphScope(lines: string[], selStart: number, selEnd: number) {
  const startsAt: number[] = [];
  let off = 0;
  for (const l of lines) { startsAt.push(off); off += l.length + 1; }
  const lineOf = (pos: number) => {
    let i = 0;
    while (i + 1 < lines.length && startsAt[i + 1] <= pos) i++;
    return i;
  };
  const hasInk = (i: number) => lines[i].trim().length > 0;

  let first = lineOf(selStart);
  let last = lineOf(selEnd);
  // A selection that ends exactly ON a line's first character has not touched
  // that line — the ordinary editor convention.
  if (selEnd > selStart && last > first && selEnd === startsAt[last]) last--;

  // Enter makes no paragraph gap, so a line is a paragraph: the scope is the caret's line, or each selected line [draftFormat §7]

  const affected = new Set<number>();
  for (let i = first; i <= last; i++) if (hasInk(i)) affected.add(i);
  // A caret alone on a blank line has no paragraph to indent. Act on that line
  // anyway, so a writer can set the level BEFORE typing into it.
  if (affected.size === 0) affected.add(first);

  return { affected, lineOf };
}

// outdent, the exact decrement of indent on the same scope: one tab per press, floored at zero per line [draftFormat §8]
function outdentParagraphs(text: string, selStart: number, selEnd: number): FormatResult {
  const lines = text.split('\n');
  const { affected, lineOf } = paragraphScope(lines, selStart, selEnd);

  const TAB = LINE_DIRECTIVE.indent;
  const removed = new Set<number>();
  const nextLines = lines.map((l, i) => {
    if (affected.has(i)) {
      const tab = readLead(l, { headings: false }).tokens.find(t => t.kind === 'tab');
      if (tab) { removed.add(i); return l.slice(0, tab.start) + l.slice(tab.end); }
    }
    return l;
  });
  const next = nextLines.join('\n');

  // The caret keeps the character it was sitting on, mirroring indent's own
  // shift — every tab removed at or above a position pulls it left by one.
  // Clamped to the line's NEW start, so a caret parked before a tab (or inside
  // the tab itself) lands at the start of its own line rather than on the
  // previous one. That clamp is the single place this is not a pure sign flip.
  const newStartsAt: number[] = [];
  let o = 0;
  for (const l of nextLines) { newStartsAt.push(o); o += l.length + 1; }
  const moved = (pos: number) => {
    const ln = lineOf(pos);
    let n = 0;
    for (const i of removed) if (i <= ln) n++;
    return Math.max(newStartsAt[ln], pos - n * TAB.length);
  };
  return { text: next, start: moved(selStart), end: moved(selEnd) };
}

function indentParagraphs(text: string, selStart: number, selEnd: number): FormatResult {
  const lines = text.split('\n');
  const { affected, lineOf } = paragraphScope(lines, selStart, selEnd);

  const TAB = LINE_DIRECTIVE.indent;
  // the tab goes AFTER any block-indent tokens (the block is outermost; the first-line tab sits inside it)
  const blockLen = (l: string) => { let n = 0; while (l.startsWith(BLOCK_TOKEN, n)) n += BLOCK_TOKEN.length; return n; };
  const next = lines.map((l, i) => (affected.has(i) ? l.slice(0, blockLen(l)) + TAB + l.slice(blockLen(l)) : l)).join('\n');
  // Every tab inserted at or above a position pushes it right by one, so the
  // caret keeps the character it was sitting on — including a caret parked at
  // the very start of an indented line, which lands after its new tab.
  const shift = (pos: number) => {
    const ln = lineOf(pos);
    let n = 0;
    for (const i of affected) if (i <= ln) n++;
    return n * TAB.length;
  };
  return { text: next, start: selStart + shift(selStart), end: selEnd + shift(selEnd) };
}

// the block indent: one `>| ` token per level at the front of every line of the paragraph, so a wrapped line follows; outdent removes one [draftFormat §9]
function blockShift(text: string, selStart: number, selEnd: number, dir: 1 | -1): FormatResult {
  const lines = text.split('\n');
  const { affected } = paragraphScope(lines, selStart, selEnd);
  const objs: Array<{ ls: number; le: number }> = [];
  let off = 0;
  lines.forEach((l, i) => { if (affected.has(i)) objs.push({ ls: off, le: off + l.length }); off += l.length + 1; });
  return rewriteLeads(text, selStart, selEnd, objs, (tokens) => {
    if (dir === 1) return [BLOCK_TOKEN, ...tokens];
    const at = tokens.indexOf(BLOCK_TOKEN);
    return at === -1 ? tokens : [...tokens.slice(0, at), ...tokens.slice(at + 1)];
  });
}

const ALIGN_PREFIXES = [LINE_DIRECTIVE['align-center'], LINE_DIRECTIVE['align-right']] as const;
// One list, one mark. A second style replaces the first instead of stacking beside it.
const BULLET_PREFIXES = [LINE_DIRECTIVE.bullet, LINE_DIRECTIVE['bullet-circle'], LINE_DIRECTIVE['bullet-square']] as const;

// what the caret is inside, pure (text in, flags out) so it is testable without a browser [draftFormat §10]
export function marksAt(text: string, caret: number): { bold: boolean; italic: boolean; underline: boolean; strike: boolean } {
  // one reader: a mark is active when the character to the caret's LEFT carries it (the rule typing follows), so a caret past a styled word's closing marks lights nothing; an empty pair just made counts [draftFormat §11]
  const ls = text.lastIndexOf('\n', Math.max(0, caret - 1)) + 1;
  let le = text.indexOf('\n', ls);
  if (le === -1) le = text.length;
  const line = text.slice(ls, le);
  const lead = readLead(line).length;
  const at = caret - ls - lead;
  const out = { bold: false, italic: false, underline: false, strike: false };
  for (const r of readMarks(line.slice(lead))) {
    if (r.kind === 'font') continue;   // FONT-SPAN: a face is not one of the strip's four styles (fontFaceAt reads it)
    const ml = r.mark.length;
    const empty = r.close === r.open + ml;
    if ((empty && at === r.close) || (at > r.open + ml && at <= r.close)) out[r.kind] = true;
  }
  return out;
}

export function applyFormat(text: string, selStart: number, selEnd: number, action: FormatAction): FormatResult {
  const start = Math.min(selStart, selEnd);
  const end = Math.max(selStart, selEnd);
  if (action === 'bold') return toggleInline(text, start, end, FORMAT_MARK.bold);
  if (action === 'italic') return toggleInline(text, start, end, FORMAT_MARK.italic);
  if (action === 'underline') return toggleInline(text, start, end, FORMAT_MARK.underline);
  if (action === 'strike') return toggleInline(text, start, end, FORMAT_MARK.strike);
  if (action === 'heading') { const cur = headingLevelAt(text, start); return setHeading(text, start, cur === null ? 2 : null); }
  if (action === 'heading-up' || action === 'heading-down') {
    const cur = headingLevelAt(text, start);
    if (cur === null) return { text, start, end };
    return setHeading(text, start, Math.max(1, Math.min(6, cur + (action === 'heading-up' ? -1 : 1))));
  }
  if (action === 'bullet') return toggleLines(text, start, end, LINE_DIRECTIVE.bullet, BULLET_PREFIXES);
  if (action === 'bullet-circle') return toggleLines(text, start, end, LINE_DIRECTIVE['bullet-circle'], BULLET_PREFIXES);
  if (action === 'bullet-square') return toggleLines(text, start, end, LINE_DIRECTIVE['bullet-square'], BULLET_PREFIXES);
  if (action === 'quote') return toggleLines(text, start, end, LINE_DIRECTIVE.quote);
  // paragraph-scoped and repeatable (see indentParagraphs) [draftFormat §13]
  if (action === 'indent') return indentParagraphs(text, start, end);
  if (action === 'outdent') return outdentParagraphs(text, start, end);
  if (action === 'block-indent') return blockShift(text, start, end, 1);
  if (action === 'block-outdent') return blockShift(text, start, end, -1);
  if (action === 'align-center') return toggleLines(text, start, end, LINE_DIRECTIVE['align-center'], ALIGN_PREFIXES);
  if (action === 'align-right') return toggleLines(text, start, end, LINE_DIRECTIVE['align-right'], ALIGN_PREFIXES);
  // 'align-left' is the UNMARKED state, not a third token: clearing both
  // alignment prefixes IS left. A `<< ` token would be a lie about the
  // default — every unmarked line in every page ever written is already left.
  if (action === 'align-left') return rewriteLeads(text, start, end, touchedLines(text, start, end), tokens => tokens.filter(t => !ALIGN_PREFIXES.includes(t as typeof ALIGN_PREFIXES[number])));
  return insertSpacing(text, start, end);
}

// S5 — "Copy My Words": the same frozen convention set, stripped back to
// honest plain reading text. Order matters (bold's `**` before italic's `*`,
// mirroring draftDecoration.ts's own inline-scan priority) so a bold run's
// asterisks are never left half-stripped by the italic pass.
export function stripMarkdownConventions(text: string): string {
  // STEP 3: per line, through the ONE reader (store/markRuns.ts stripLine): structure tokens in any order, then only the emphasis
  // markers the page actually paints - so "2 * 3 * 4" exports as it shows, `~~strike~~` is stripped like the rest (the old
  // regex copy never stripped it), and a `>| ` block token goes with the other structure.
  return text.split('\n').map(stripLine).join('\n');
}

// a font on highlighted words, line by line: read each character's face, apply the pick, write one span per stretch of equal face (merge, split, never nest two font spans), and split at emphasis marks so they nest [draftFormat §14]

// a character's STYLE is its face and its size: a stretch of one style is one span with both classes, so a face span and a size span never cross or stack [draftFormat §15]
interface Style { face: string | null; points: number | null }
const NO_STYLE: Style = { face: null, points: null };
const styleKey = (s: Style): string => `${s.face ?? ''}|${s.points ?? ''}`;
interface FontLine { lead: number; base: string; faces: (string | null)[]; styles: Style[]; toBase: number[] }

// a line's text with its font marks taken out (`base`), each base character's face, and raw -> base positions
function readFontLine(line: string): FontLine {
  const lead = readLead(line).length;
  const rest = line.slice(lead);
  const runs = readMarks(rest);
  const fonts = runs.filter(r => r.kind === 'font').sort((a, b) => a.open - b.open);
  const isMark = new Uint8Array(rest.length);
  for (const f of fonts) {
    isMark[f.open] = 1;
    for (let k = 0; k < closeMark(f).length; k++) isMark[f.close + k] = 1;
  }
  const toBase: number[] = new Array(rest.length + 1);
  let base = '';
  const rawStyle: Style[] = new Array(rest.length).fill(NO_STYLE);
  // inner spans overwrite outer - each of face and size on its own (a stale tab's face nested inside a size span keeps both)
  for (const f of fonts) for (let i = f.open + 1; i < f.close; i++) rawStyle[i] = { face: f.face ?? rawStyle[i].face, points: f.points ?? rawStyle[i].points };
  const styles: Style[] = [];
  for (let i = 0; i < rest.length; i++) {
    toBase[i] = base.length;
    if (isMark[i]) continue;
    base += rest[i];
    styles.push(rawStyle[i]);
  }
  toBase[rest.length] = base.length;
  return { lead, base, faces: styles.map((s) => s.face), styles, toBase };
}

// the stretches of equal non-empty style, split so none crosses an emphasis run of `base`
function fontStretches(base: string, styles: Style[]): Array<{ s: number; e: number; face: Style }> {
  const emph = readMarks(base).filter(r => r.kind !== 'font');
  const out: Array<{ s: number; e: number; face: Style }> = [];
  const queue: Array<{ s: number; e: number; face: Style }> = [];
  for (let i = 0; i < styles.length;) {
    const f = styles[i];
    let j = i + 1;
    while (j < styles.length && styleKey(styles[j]) === styleKey(f)) j++;
    if (f.face || f.points != null) queue.push({ s: i, e: j, face: f });
    i = j;
  }
  while (queue.length) {
    const seg = queue.shift()!;
    if (seg.e <= seg.s) continue;
    const cross = emph.find(r => {
      const ro = r.open, re = r.close + closeMark(r).length;
      return (seg.s < ro && seg.e > ro && seg.e < re) || (seg.s > ro && seg.s < re && seg.e > re);
    });
    if (!cross) {
      // the marks sit against words (plan: `[` on the first word, `]{.font-…}` on the last): a stretch's edge spaces take the page's
      // face - invisible - and a stretch of nothing but marks and spaces paints nothing, so no span is written for it
      let s0 = seg.s, e0 = seg.e;
      while (s0 < e0 && /\s/.test(base[s0])) s0++;
      while (e0 > s0 && /\s/.test(base[e0 - 1])) e0--;
      if (/\S/.test(base.slice(s0, e0).replace(/[*_~]/g, ''))) out.push({ s: s0, e: e0, face: seg.face });
      continue;
    }
    const ro = cross.open, ml = cross.mark.length, rc = cross.close, re = rc + closeMark(cross).length;
    if (seg.s < ro) {                       // starts before the run, ends inside it
      queue.push({ s: seg.s, e: ro, face: seg.face });
      queue.push({ s: ro + ml, e: Math.min(seg.e, rc), face: seg.face });
    } else {                                // starts inside the run, ends after it
      queue.push({ s: Math.max(seg.s, ro + ml), e: rc, face: seg.face });
      queue.push({ s: re, e: seg.e, face: seg.face });
    }
  }
  return out.sort((a, b) => a.s - b.s);
}

// write `base` back with the stretches' marks; `map(p)` gives a base position's place in the result (for the selection)
function writeFontLine(base: string, stretches: Array<{ s: number; e: number; face: Style }>): { rest: string; before: (p: number) => number; atOrBefore: (p: number) => number } {
  const ins: Array<{ at: number; text: string }> = [];
  for (const st of stretches) { ins.push({ at: st.s, text: '[' }); ins.push({ at: st.e, text: spanCloseMark(st.face) }); }
  ins.sort((a, b) => a.at - b.at || (a.text === '[' ? 1 : -1));   // at one position, a closing mark comes before an opening one
  let rest = '';
  let from = 0;
  for (const x of ins) { rest += base.slice(from, x.at) + x.text; from = x.at; }
  rest += base.slice(from);
  const before = (p: number) => p + ins.filter(x => x.at < p).reduce((n, x) => n + x.text.length, 0);
  const atOrBefore = (p: number) => p + ins.filter(x => x.at <= p).reduce((n, x) => n + x.text.length, 0);
  return { rest, before, atOrBefore };
}

/** Apply face `slug` (null: the page's or card's own face) to the highlighted text [selStart, selEnd). The selection comes back on the
 *  same words. A collapsed selection changes nothing (the whole-document pick is the host's, not the text's). */
export function applyFontPick(text: string, selStart: number, selEnd: number, slug: string | null): FormatResult {
  return applyStylePick(text, selStart, selEnd, (st) => ({ face: slug, points: st.points }));
}

// apply size `points` (null: the surface's own) to the highlighted text only, keeping each word's face [draftFormat §16]
export function applySizePick(text: string, selStart: number, selEnd: number, points: number | null): FormatResult {
  return applyStylePick(text, selStart, selEnd, (st) => ({ face: st.face, points }));
}

// the pick itself: each highlighted character's style changed by `to`, the line written back with one span per stretch of equal style
function applyStylePick(text: string, selStart: number, selEnd: number, to: (st: Style) => Style): FormatResult {
  const start = Math.min(selStart, selEnd);
  const end = Math.max(selStart, selEnd);
  if (start === end) return { text, start, end };
  const segs = selectedSegments(text, start, end);
  if (segs.length === 0) return { text, start, end };
  let out = '';
  let cursor = 0;
  let newStart = -1;
  let newEnd = -1;
  for (const sg of segs) {
    let le = text.indexOf('\n', sg.ls);
    if (le === -1) le = text.length;
    const line = text.slice(sg.ls, le);
    const fl = readFontLine(line);
    const a = fl.toBase[sg.a - sg.ls - fl.lead];
    const b = fl.toBase[sg.b - sg.ls - fl.lead];
    const styles = fl.styles.slice();
    for (let i = a; i < b; i++) styles[i] = to(styles[i]);
    const w = writeFontLine(fl.base, fontStretches(fl.base, styles));
    out += text.slice(cursor, sg.ls) + line.slice(0, fl.lead) + w.rest;
    const lineStart = out.length - w.rest.length - fl.lead;
    if (newStart < 0) newStart = lineStart + fl.lead + w.atOrBefore(a);
    newEnd = lineStart + fl.lead + w.before(b);
    cursor = le;
  }
  out += text.slice(cursor);
  return { text: out, start: newStart, end: newEnd };
}

/** The face of the highlighted words, for the picker's brass: the slug when every word carries the same span face, null when every
 *  word wears the page's (or card's) own face, 'mixed' otherwise (no brass is shown). A collapsed selection reads null. */
export function fontFaceAt(text: string, selStart: number, selEnd: number): string | null | 'mixed' {
  const start = Math.min(selStart, selEnd);
  const end = Math.max(selStart, selEnd);
  if (start === end) return null;
  const seen = new Set<string | null>();
  for (const sg of selectedSegments(text, start, end)) {
    let le = text.indexOf('\n', sg.ls);
    if (le === -1) le = text.length;
    const fl = readFontLine(text.slice(sg.ls, le));
    const a = fl.toBase[sg.a - sg.ls - fl.lead];
    const b = fl.toBase[sg.b - sg.ls - fl.lead];
    for (let i = a; i < b; i++) if (/[^\s*_~]/.test(fl.base[i])) seen.add(fl.faces[i]);
  }
  if (seen.size === 0) return null;
  return seen.size === 1 ? [...seen][0] : 'mixed';
}

// the highlighted words' size: N when all share a span size, null when all wear the surface's own, 'mixed' otherwise [draftFormat §17]
export function fontSizeAt(text: string, selStart: number, selEnd: number): number | null | 'mixed' {
  const start = Math.min(selStart, selEnd);
  const end = Math.max(selStart, selEnd);
  if (start === end) return null;
  const seen = new Set<number | null>();
  for (const sg of selectedSegments(text, start, end)) {
    let le = text.indexOf('\n', sg.ls);
    if (le === -1) le = text.length;
    const fl = readFontLine(text.slice(sg.ls, le));
    const a = fl.toBase[sg.a - sg.ls - fl.lead];
    const b = fl.toBase[sg.b - sg.ls - fl.lead];
    for (let i = a; i < b; i++) if (/[^\s*_~]/.test(fl.base[i])) seen.add(fl.styles[i].points);
  }
  if (seen.size === 0) return null;
  return seen.size === 1 ? [...seen][0] : 'mixed';
}

/** A size class anywhere in a span's braces: `{.size-14}` AND the combined `{.font-lora .size-14}`, whose `.size-` follows a space (a bare `{.size-` test missed it). */
const HAS_SIZE_SPAN = /\{[^}\n]*\.size-\d/;

// the whole-document (whole-card) pick: only the FACES go - a span's size stays [draftFormat §18]
export function clearFontSpans(text: string): string {
  if (!HAS_SIZE_SPAN.test(text)) return withoutFontMarks(text);
  return applyStylePick(text, 0, text.length, (st) => ({ face: null, points: st.points })).text;
}

// the whole-document (whole-card) SIZE pick: every span's size goes; the faces stay [draftFormat §19]
export function clearSizeSpans(text: string): string {
  if (!HAS_SIZE_SPAN.test(text)) return text;
  return applyStylePick(text, 0, text.length, (st) => ({ face: st.face, points: null })).text;
}
