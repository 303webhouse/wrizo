// ITEM 211 - THE EDITOR'S RULES FOR MARKS THAT NEVER SHOW.
//
// The page hides every emphasis marker and every bullet and heading token (draftDecoration.ts), but the stored text still holds
// them, and the browser's own caret walks raw characters. FIX's probe (scripts/writing-hidden-marker-probe.mjs) measured what
// that does without rules: arrows stop on invisible characters, one Backspace eats one `*` and leaves a broken pair on the page,
// a one-letter bold word deleted leaves `****`, and two caret positions that look identical type into different styles.
//
// Everything here is computed on the raw text through markRuns.ts (readMarks / readLead), the same reader the decorator paints
// from, so the editor and the page cannot disagree about which characters are hidden. Pure: text and offsets in, text and
// offsets out. ForwardOnlyEditor.tsx owns the DOM, the undo stack and the events.
//
// WHAT IS HIDDEN, exactly as the decorator hides it: every marker of every run readMarks accepts on a line's text, and the lead
// tokens of kind bullet / bullet-circle / bullet-square / heading. Tabs are the indent itself, and the alignment, quote and block
// tokens still show while the caret touches them, so the caret treats those as visible characters.
import { readLead, readMarks, type LeadToken } from './markRuns';

export interface AbsRun { mark: string; open: number; close: number }

interface LineInfo {
  start: number;
  end: number;              // index of the line's '\n', or text.length
  leadEnd: number;          // absolute end of the whole lead
  tokens: LeadToken[];      // absolute positions
  runs: AbsRun[];           // absolute positions
  hidden: Uint8Array;       // per character of the line: 0 visible, 1 hidden lead token, 2 hidden inline marker
}

const HIDDEN_LEAD = new Set(['bullet', 'bullet-circle', 'bullet-square', 'heading']);
const isWs = (c: string | undefined) => c !== undefined && c !== '\n' && /\s/.test(c);

function lineAt(text: string, p: number): LineInfo {
  const start = p <= 0 ? 0 : text.lastIndexOf('\n', p - 1) + 1;
  const nl = text.indexOf('\n', start);
  const end = nl === -1 ? text.length : nl;
  const line = text.slice(start, end);
  const lead = readLead(line);
  const hidden = new Uint8Array(line.length);
  const tokens = lead.tokens.map(t => ({ ...t, start: t.start + start, end: t.end + start }));
  for (const t of lead.tokens) if (HIDDEN_LEAD.has(t.kind)) for (let i = t.start; i < t.end; i++) hidden[i] = 1;
  const runs = readMarks(line.slice(lead.length)).map(r => ({ mark: r.mark, open: r.open + lead.length + start, close: r.close + lead.length + start }));
  for (const r of runs) {
    for (let k = 0; k < r.mark.length; k++) { hidden[r.open - start + k] = 2; hidden[r.close - start + k] = 2; }
  }
  return { start, end, leadEnd: start + lead.length, tokens, runs, hidden };
}

function allRuns(text: string): AbsRun[] {
  const out: AbsRun[] = [];
  let p = 0;
  for (;;) {
    const li = lineAt(text, p);
    out.push(...li.runs);
    if (li.end >= text.length) break;
    p = li.end + 1;
  }
  return out;
}

const hid = (li: LineInfo, i: number) => (i >= li.start && i < li.end ? li.hidden[i - li.start] : 0);
const isEmptyInterior = (li: LineInfo, p: number) => li.runs.some(r => r.close === r.open + r.mark.length && p === r.close);

/** Rule 1. The caret sits directly after the nearest visible character to its left, or at the line's start - where "start" is
 *  after the line's hidden bullet or heading token, since typing in front of it would turn the token into text. The one other
 *  stop is between the two marks of an EMPTY pair: that is where a Bold pressed at a bare caret leaves the writer, so the next
 *  letter is bold. */
export function snapCaret(text: string, p: number): number {
  p = Math.max(0, Math.min(text.length, p));
  const li = lineAt(text, p);
  if (p <= li.leadEnd) {
    let h = p;
    while (h < li.leadEnd && hid(li, h) === 1) h++;
    return h;
  }
  if (isEmptyInterior(li, p)) return p;
  let q = p;
  while (q > li.leadEnd && hid(li, q - 1) === 2) q--;
  return q;
}

/** NICK'S LIVE BUG (2026-10-06): a click in the space right of a line that ENDS in a styled word landed just after that word's hidden
 *  closing marks, and `snapCaret` (the keyboard rule: sit after the nearest VISIBLE character) pulled it back inside the run - so the
 *  strip lit B and the next letter typed bold, though the writer had clicked past the word. A CLICK keeps the side of the closing
 *  marks it landed on: inside or just after a group of closing marks, the caret goes to the group's END. Every other position takes
 *  `snapCaret` as before; the keyboard is unchanged. (An empty pair's interior is not a closing group: a press made it to be typed into.) */
export function snapCaretAfterClick(text: string, p: number): number {
  p = Math.max(0, Math.min(text.length, p));
  const li = lineAt(text, p);
  let end = -1;
  for (let moved = true; moved;) {
    moved = false;
    const from = end === -1 ? p : end;
    for (const r of li.runs) {
      const ml = r.mark.length;
      if (r.close === r.open + ml) continue;
      if (from >= r.close && from <= r.close + ml && r.close + ml > end) { end = r.close + ml; moved = true; }
    }
    if (end === from) moved = false;
  }
  return end === -1 ? snapCaret(text, p) : end;
}

/** Rule 2, rightward: past any hidden marks, over one visible character (a newline counts), then snapped. */
export function stepRight(text: string, p: number): number {
  let q = Math.max(0, Math.min(text.length, p));
  const li = lineAt(text, q);
  while (q < li.end && hid(li, q) !== 0) q++;
  if (q < text.length) q++;
  return snapCaret(text, q);
}

/** Rule 2, leftward: back over hidden marks, over one visible character, then snapped. */
export function stepLeft(text: string, p: number): number {
  let q = Math.max(0, Math.min(text.length, p));
  const li = lineAt(text, q);
  while (q > li.start && hid(li, q - 1) !== 0) q--;
  if (q > 0) q--;
  const s = snapCaret(text, q);
  return s >= p ? snapCaret(text, p) : s;
}

export interface EditResult { text: string; caret: number; structural: boolean }

// ---- THE REPAIR: an edit never leaves a pair broken or emptied --------------------------------------------------------------

interface Expected { mark: string; open: number; close: number; wasEmpty: boolean; dead?: boolean }

class Doc {
  constructor(public text: string, public caret: number, public expected: Expected[]) {}
  structural = false;
  splice(s: number, e: number, ins: string, caretAt?: number) {
    const d = ins.length - (e - s);
    this.text = this.text.slice(0, s) + ins + this.text.slice(e);
    for (const x of this.expected) {
      for (const k of ['open', 'close'] as const) {
        if (x[k] >= e) x[k] += d;
        else if (x[k] >= s) x.dead = true;
      }
    }
    if (caretAt !== undefined) this.caret = caretAt;
    else if (this.caret >= e) this.caret += d;
    else if (this.caret > s) this.caret = s;
  }
}

function repair(doc: Doc): void {
  for (let guard = 0; guard < 200; guard++) {
    doc.expected = doc.expected.filter(x => !x.dead);
    const now = allRuns(doc.text);
    let acted = false;
    for (const x of doc.expected) {
      const ml = x.mark.length;
      const found = now.some(r => r.mark === x.mark && r.open === x.open && r.close === x.close);
      // emptiness is read from the positions, not from the reader: an emptied italic `*` `*` is `**`, which pairs as nothing
      if (found || x.close === x.open + ml) {
        if (!x.wasEmpty && x.close === x.open + ml) {
          // rules 3 and 4: a pair the edit left empty goes, both marks at once
          const c = doc.caret;
          doc.splice(x.close, x.close + ml, '', c > x.close ? (c >= x.close + ml ? c - ml : x.close) : c);
          const c2 = doc.caret;
          doc.splice(x.open, x.open + ml, '', c2 > x.open ? (c2 >= x.open + ml ? c2 - ml : x.open) : c2);
          x.dead = true; doc.structural = true; acted = true; break;
        }
        continue;
      }
      // Broken: a space now touches a mark on its inner side, so the flanking rule no longer pairs it. Move the space outside the
      // pair. An empty pair the formatter made keeps the caret between its marks; anything else sends a space typed at a word's
      // end out past the closing mark, which is where the writer was looking.
      const inner = x.open + ml;
      let kc = 0; while (x.close - kc - 1 >= inner && isWs(doc.text[x.close - kc - 1])) kc++;
      let ko = 0; while (inner + ko < x.close && isWs(doc.text[inner + ko])) ko++;
      const fixOpen = () => {
        const ws = doc.text.slice(inner, inner + ko);
        const c = doc.caret;
        const at = c >= inner && c < inner + ko ? c - ml : c > x.open && c < inner ? x.open : c;
        doc.splice(x.open, inner + ko, ws + x.mark, at);
        x.open += ko; x.dead = false; acted = true;
      };
      const fixClose = () => {
        const ws = doc.text.slice(x.close - kc, x.close);
        const c = doc.caret;
        const at = c > x.close - kc && c <= x.close ? c + ml : c;
        const from = x.close - kc;
        doc.splice(from, x.close + ml, x.mark + ws, at);
        x.close = from; x.dead = false; acted = true;
      };
      if (x.wasEmpty && ko > 0) fixOpen();
      else if (kc > 0) fixClose();
      else if (ko > 0) fixOpen();
      else x.dead = true;
      if (acted) { doc.structural = true; break; }
    }
    if (!acted && doc.expected.every(x => !x.dead)) return;
    if (!acted) continue;
  }
}

/** Replace [s, e) with `ins`, keeping every mark whose partner survives the edit (a closer that loses its opener stays in front of
 *  the inserted text, an opener that loses its closer stays after it), then repair: a pair left empty is removed, a pair a space
 *  broke is re-closed with the space outside it. The caret lands after the inserted text. */
export function replaceRange(text: string, s: number, e: number, ins: string): EditResult {
  const runs = allRuns(text);
  // a marker the range cuts through is taken whole, never one star of it
  for (let moved = true; moved;) {
    moved = false;
    for (const r of runs) for (const m of [r.open, r.close]) {
      const me = m + r.mark.length;
      if (s > m && s < me) { s = m; moved = true; }
      if (e > m && e < me) { e = me; moved = true; }
    }
  }
  const inside = (m: number, ml: number) => m >= s && m + ml <= e;
  const closers: { pos: number; r: AbsRun }[] = [];
  const openers: { pos: number; r: AbsRun }[] = [];
  for (const r of runs) {
    const oi = inside(r.open, r.mark.length), ci = inside(r.close, r.mark.length);
    if (oi && !ci) openers.push({ pos: r.open, r });
    if (ci && !oi) closers.push({ pos: r.close, r });
  }
  closers.sort((a, b) => a.pos - b.pos);
  openers.sort((a, b) => a.pos - b.pos);
  const cs = closers.map(c => c.r.mark).join('');
  const os = openers.map(o => o.r.mark).join('');
  const total = cs.length + ins.length + os.length;
  const map = (m: number) => (m < s ? m : m - (e - s) + total);
  const keptAt = new Map<string, number>();
  let off = s;
  for (const c of closers) { keptAt.set(`c${c.pos}`, off); off += c.r.mark.length; }
  off = s + cs.length + ins.length;
  for (const o of openers) { keptAt.set(`o${o.pos}`, off); off += o.r.mark.length; }
  const expected: Expected[] = [];
  for (const r of runs) {
    const oi = inside(r.open, r.mark.length), ci = inside(r.close, r.mark.length);
    if (oi && ci) continue;
    expected.push({
      mark: r.mark,
      open: oi ? keptAt.get(`o${r.open}`)! : map(r.open),
      close: ci ? keptAt.get(`c${r.close}`)! : map(r.close),
      wasEmpty: r.close === r.open + r.mark.length,
    });
  }
  const doc = new Doc(text.slice(0, s) + cs + ins + os + text.slice(e), s + cs.length + ins.length, expected);
  doc.structural = cs.length + os.length > 0;
  repair(doc);
  return { text: doc.text, caret: snapCaret(doc.text, doc.caret), structural: doc.structural };
}

/** The range a NATIVE edit touched, widened so it never splits a hidden token: a selection that starts in front of a line's hidden
 *  bullet or heading on that same line starts after it instead (the line keeps its list or heading), and an edit that joins two
 *  lines takes the joined line's whole lead with it (a `- ` in the middle of a line would be text). */
export function nativeRange(text: string, s: number, e: number): { s: number; e: number } {
  const ls = lineAt(text, s);
  if (s <= ls.leadEnd && e <= ls.end) {
    let h = s;
    while (h < ls.leadEnd && hid(ls, h) === 1) h++;
    if (h > s) { s = h; if (e < s) e = s; }
  }
  if (text.slice(s, e).includes('\n')) {
    const le = lineAt(text, e);
    if (e < le.leadEnd) e = le.leadEnd;
  } else {
    const le = lineAt(text, e);
    for (const t of le.tokens) if (HIDDEN_LEAD.has(t.kind) && e > t.start && e < t.end) e = t.end;
  }
  return { s, e };
}

/** Rule 3, Backspace at a collapsed caret. */
export function backspaceAt(text: string, p0: number): EditResult | null {
  const p = snapCaret(text, p0);
  const li = lineAt(text, p);
  let q = p;
  while (q > li.leadEnd && hid(li, q - 1) === 2) q--;
  if (q <= li.leadEnd) {
    // directly after a line token: the whole token goes, so the line stops being a bullet or a heading
    const tok = li.tokens.find(t => t.end === q && t.kind !== 'tab');
    if (tok) {
      const t2 = text.slice(0, tok.start) + text.slice(tok.end);
      return { text: t2, caret: snapCaret(t2, tok.start), structural: true };
    }
    if (q === li.start) {
      if (q === 0) return null;
      // joining onto the line above: this line's lead would become text in the middle of a line, so it goes with the newline
      return replaceRange(text, q - 1, li.leadEnd, '');
    }
  }
  return replaceRange(text, q - 1, q, '');
}

/** Rule 3, Delete at a collapsed caret. */
export function deleteAt(text: string, p0: number): EditResult | null {
  const p = snapCaret(text, p0);
  const li = lineAt(text, p);
  if (p < li.leadEnd) {
    const tok = li.tokens.find(t => t.start === p && t.kind !== 'tab');
    if (tok) {
      const t2 = text.slice(0, tok.start) + text.slice(tok.end);
      return { text: t2, caret: snapCaret(t2, tok.start), structural: true };
    }
  }
  let q = p;
  while (q < li.end && hid(li, q) !== 0) q++;
  if (q >= text.length) return null;
  if (q === li.end) {
    const next = lineAt(text, q + 1);
    const r = replaceRange(text, q, next.leadEnd, '');
    return { ...r, caret: snapCaret(r.text, Math.min(p, r.text.length)), structural: r.structural || next.leadEnd > q + 1 };
  }
  const r = replaceRange(text, q, q + 1, '');
  return { ...r, caret: snapCaret(r.text, p <= r.text.length ? p : r.text.length) };
}

/** The closing marks that begin exactly at `p`, innermost first, of runs that have content - what a space typed at `p` would sit
 *  in front of. */
export function closersAt(text: string, p: number): string {
  const li = lineAt(text, p);
  let q = p;
  let out = '';
  for (let r = li.runs.find(x => x.close === q && x.close > x.open + x.mark.length); r; r = li.runs.find(x => x.close === q && x.close > x.open + x.mark.length)) {
    out += r.mark;
    q += r.mark.length;
  }
  return out;
}

/** A space typed at the end of a styled word has to go outside the pair (a mark after a space does not close). When the very next
 *  character typed is not a space, the closing marks move back after it, so "two words" typed into a bold pair stays bold. `text`
 *  is the text with that character already typed at `wsEnd`. */
export function reabsorb(text: string, closeAt: number, closers: string, wsEnd: number): { text: string; caret: number } | null {
  const ws = text.slice(closeAt + closers.length, wsEnd);
  if (text.slice(closeAt, closeAt + closers.length) !== closers || ws.length === 0 || !/^[^\S\n]+$/.test(ws)) return null;
  const ch = text[wsEnd];
  if (ch === undefined || /\s/.test(ch)) return null;
  const next = text.slice(0, closeAt) + ws + ch + closers + text.slice(wsEnd + 1);
  const caret = closeAt + ws.length + 1;
  if (closersAt(next, caret) !== closers) return null;
  return { text: next, caret };
}

/** Enter. A run the caret is inside closes before the newline and opens again after it, so neither line shows a mark; a run the
 *  caret is at the END of simply stays on the first line. At a line's start the new line goes above, so a bullet stays a bullet. */
export function enterAt(text: string, s: number, e: number): EditResult {
  let base: EditResult = { text, caret: snapCaret(text, s), structural: false };
  if (e > s) { const r = nativeRange(text, s, e); base = replaceRange(text, r.s, r.e, ''); }
  const t = base.text;
  const c = base.caret;
  const li = lineAt(t, c);
  if (c <= li.leadEnd) {
    const t2 = t.slice(0, li.start) + '\n' + t.slice(li.start);
    return { text: t2, caret: c + 1, structural: base.structural };
  }
  let q = c;
  let containing = li.runs.filter(r => r.open + r.mark.length <= c && c <= r.close);
  for (let moved = true; moved;) {
    moved = false;
    const done = containing.find(r => r.close === q);
    if (done) { q += done.mark.length; containing = containing.filter(r => r !== done); moved = true; }
  }
  const inner = [...containing].sort((a, b) => a.close - b.close);
  const outer = [...containing].sort((a, b) => a.open - b.open);
  const cs = inner.map(r => r.mark).join('');
  const os = outer.map(r => r.mark).join('');
  const ins = cs + '\n' + os;
  const map = (m: number) => (m < q ? m : m + ins.length);
  const expected: Expected[] = [];
  for (const r of allRuns(t)) {
    const empty = r.close === r.open + r.mark.length;
    if (containing.some(x => x.open === r.open && x.close === r.close && x.mark === r.mark)) {
      let co = q; for (const x of inner) { if (x.open === r.open && x.mark === r.mark) break; co += x.mark.length; }
      let oo = q + cs.length + 1; for (const x of outer) { if (x.open === r.open && x.mark === r.mark) break; oo += x.mark.length; }
      expected.push({ mark: r.mark, open: r.open, close: co, wasEmpty: false });
      expected.push({ mark: r.mark, open: oo, close: map(r.close), wasEmpty: false });
    } else {
      expected.push({ mark: r.mark, open: map(r.open), close: map(r.close), wasEmpty: empty });
    }
  }
  const doc = new Doc(t.slice(0, q) + ins + t.slice(q), q + ins.length, expected);
  repair(doc);
  return { text: doc.text, caret: snapCaret(doc.text, doc.caret), structural: base.structural || doc.structural || cs.length > 0 };
}
