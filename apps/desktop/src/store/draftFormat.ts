import { runsOfMark } from './markRuns';

// AB2 S3 — Draft's tools, operating as markdown conventions directly on
// `entry.text` (S0's ruling: no separate rich-text state). Pure string
// transforms given the full text + a selection's linear character offsets
// (store/caretOffset.ts's getSelectionOffsets) — the caller (PageEditor.tsx)
// owns the DOM/selection side; this module only ever touches strings.

// ITEM 83 M5 (R4) — Draft's roster grows by founder word: "it should have a
// lot more formatting options (bulleted lists, indention/block quote, line
// spacing, text alignment (right align, left align, center, etc.)". This
// supersedes Chamber 1's deferral of alignment/indentation ("until a real need
// names itself" — the founder just named it). Underline joins from R1.
export type FormatAction =
  | 'bold' | 'italic' | 'underline' | 'strike' | 'heading' | 'spacing'
  | 'bullet' | 'quote' | 'indent' | 'outdent'
  | 'align-left' | 'align-center' | 'align-right';
export type StructureKind = 'prose' | 'screenplay';

// FX7 S2 — the two markdown marks Free Write's own forward-only rail can
// ALSO reuse (PageEditor.tsx's applyFreeWriteFormat) — a single source of
// truth for the literal marker characters, so a forward-only insertion and
// a Draft-mode selection-wrap can never drift onto different conventions.
// ITEM 83 M4 (R1 + F2) — Underline joins the founder's set. Nick overruled
// Chamber 1's "nothing else" for Free Write by name: "I would like to add
// buttons for bolding, italicizing, and underlining."
//
// THE CONVENTION, per F2's stated default: `__word__`. Markdown reads that as
// a bold alternate; Wrizo drops that reading in-house, which is lawful because
// the frozen set was always the FOUNDER's set — his word extends it, exactly as
// the freeze provided. It stays plain-text honest (the storage law), the
// dimmed-syntax register renders the markers as craft, and export strips them
// like every other convention. One word from Nick re-tokens it.
// ITEM 122 — strikethrough joins the frozen set on Nick's ruling. `~~` is the
// conventional pair and, unlike `_`, the tilde carries no ordinary role in
// prose, so a single `~` needs no special defence the way a single
// underscore did.
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

const LEAD_TOKENS: readonly string[] = ['>< ', '>> ', '> ', '- ', '# ', '## '];

/** How many leading characters of `line` are structure, not prose: tabs and line directives, in any order. */
function leadLength(line: string): number {
  let i = 0;
  for (;;) {
    if (line[i] === '\t') { i++; continue; }
    const tok = LEAD_TOKENS.find(t => line.startsWith(t, i));
    if (!tok) return i;
    i += tok.length;
  }
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
    if (!run) return wrapSelection(text, start, end, mark);
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
    }
    const fulls = inner ? [] : runs.filter(r => A <= r.open && r.close + ml <= B);
    // The segment is MARKED when every word-character in it sits inside one of its own runs. Whitespace and the mark
    // characters themselves (`*`, `_`, `~` - another mark's markers) are not words, so a neighbouring mark never makes a
    // fully-marked segment look half-plain.
    let bare = 0;
    for (let i = A; i < B; i++) {
      if (/[\s*_~]/.test(line[i])) continue;
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

// Heading cycles the caret's LINE (S0 rider 1's frozen set is `#`/`##`):
// none -> `# ` -> `## ` -> none. One rail control, both frozen levels.
function cycleHeading(text: string, at: number): FormatResult {
  const { start: ls, end: le } = lineBounds(text, at);
  const line = text.slice(ls, le);
  let nextLine: string;
  if (line.startsWith('## ')) nextLine = line.slice(3);
  else if (line.startsWith('# ')) nextLine = `#${line}`;
  else nextLine = `# ${line}`;
  const next = text.slice(0, ls) + nextLine + text.slice(le);
  const delta = nextLine.length - line.length;
  const caret = Math.max(ls, at + delta);
  return { text: next, start: caret, end: caret };
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

// ITEM 83 M5 (R4 + F3) — LINE-PREFIX DIRECTIVES.
//
// Bullets and block quotes have plain-text conventions already (`- `, `> `).
// Indent and alignment do not, and F3's stated default is that they become
// line-prefix directives in the page's own dialect — plain-text honest,
// export-stripped like every other convention — rather than entry metadata.
// The concrete tokens, per the brief: `>< ` centres, `>> ` right-aligns,
// unmarked is left. Indent is a leading tab.
//
// WHY PREFIXES AND NOT METADATA. `entry.text` is plain text with conventions;
// that is the storage law the whole app rests on. Alignment held as metadata
// would need a span model and a schema column — a schema-class decision
// wearing a toolbar button's clothes, which is precisely the shape Chamber 1's
// ratified push-back rejected for typography. One word from Nick re-tokens
// these; nothing else changes if he does.
export const LINE_DIRECTIVE = {
  bullet: '- ',
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
const DIRECTIVE_TOKENS: readonly string[] = ['>< ', '>> ', '> ', '- '];

function leadTokens(line: string): { tokens: string[]; length: number } {
  const tokens: string[] = [];
  let i = 0;
  for (;;) {
    if (line[i] === '\t') { tokens.push('\t'); i++; continue; }
    const tok = DIRECTIVE_TOKENS.find(t => line.startsWith(t, i));
    if (!tok) break;
    tokens.push(tok);
    i += tok.length;
  }
  return { tokens, length: i };
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

// ITEM 83 ERRATA E3 (2026-09-03) — THE ARROW INDENTS A WHOLE PARAGRAPH,
// REPEATABLY. Nick's walkthrough ruling, for outline use: the menu arrow
// applies to the paragraph containing the caret (or every paragraph the
// selection touches), not the line, and pressing again INCREASES the level.
//
// TAB-AS-INDENT IS ITEM 102'S AND IS NOT BUILT HERE. Nothing in this wave
// touches a key handler; the arrow is the only door.
//
// WHAT A PARAGRAPH IS, in a model that has no paragraphs. `entry.text` is
// plain text with conventions, and the only structural mark it has is the
// blank line `insertSpacing` writes. So a paragraph is a run of consecutive
// NON-BLANK lines, and the expansion below reads exactly that: from the first
// touched line, walk up while the line above has ink; from the last, walk down
// while the line below has ink. A selection spanning several paragraphs
// indents all of them and leaves the blank lines between them alone — a tab on
// a separator is invisible litter, never structure.
//
// LEVELS ARE COUNTED IN TABS, not stored anywhere. One press adds one leading
// tab to every line of the paragraph, so the level IS the tab count and it
// round-trips as plain text on F3's leading-tab convention with nothing to
// keep in step. `stripMarkdownConventions` already strips `^\t+` — plural,
// before this ticket — so multi-level indents export clean with no change.
//
// THE TOGGLE IS GONE, AND THAT IS THE POINT — AND THE COST. Until now `indent`
// ran through `toggleLinePrefix`, so a second press REMOVED the tab: the
// writer's way back was the button itself. Repeatability consumes that. There
// is no outdent partner in this drawer (FormatAction has no such member, and
// the only outdent controls in the app are the outline board's tree control
// and the legacy execCommand bar), so after this ticket the ways back are
// UNDO and undo alone — `applyRailFormat` records an atomic step into the
// editor's own undo stack for every rail click, so Ctrl+Z walks a level back
// reliably. That is a real way back, and it is not a dedicated one.
// **THE OUTDENT QUESTION IS SURFACED, NOT RESOLVED** — it is held for Nick's
// word, with a recommendation, in docs/menus/item83-errata-s0-survey.md (d).
// Nothing here invents the partner.
// ITEM 83 ERRATA E3, THE OUTDENT PARTNER (Nick's ruling) — the selection-to-
// paragraph expansion, lifted out of indentParagraphs UNCHANGED so the pair
// cannot drift. "The exact decrement" is a claim about SCOPE as much as about
// tabs: if the two computed their affected lines separately, one could later
// learn a rule the other did not and the pair would stop being a pair without
// anything failing. Sharing the code is the only version of that guarantee
// that survives the next edit.
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

  if (hasInk(first)) while (first > 0 && hasInk(first - 1)) first--;
  if (hasInk(last)) while (last < lines.length - 1 && hasInk(last + 1)) last++;

  const affected = new Set<number>();
  for (let i = first; i <= last; i++) if (hasInk(i)) affected.add(i);
  // A caret alone on a blank line has no paragraph to indent. Act on that line
  // anyway, so a writer can set the level BEFORE typing into it.
  if (affected.size === 0) affected.add(first);

  return { affected, lineOf };
}

// THE OUTDENT PARTNER — the exact decrement of indentParagraphs below, on the
// SAME paragraph scope (shared above) and the same F3 leading-tab convention:
// the level IS the tab count, so one press removes one tab.
//
// FLOORED AT ZERO, and the floor is per LINE, not per press. A line with no
// leading tab is returned untouched rather than borrowing from a neighbour, so
// a paragraph whose lines sit at different levels flattens toward zero without
// any line going negative or losing real text. A press that finds nothing to
// remove is a no-op that still records an undo step — harmless, and cheaper
// than teaching the rail which presses "count".
//
// WHY THIS EXISTS, recorded because the cost was argued before the partner was
// ruled: `indent` used to run through toggleLinePrefix, so a second press
// removed the tab and the writer's way back WAS the button. E3 made indent
// repeatable, which spent that — and a repeatable one-way door is a door this
// drawer BUILDS, not merely one it finds. Undo walked a level back reliably
// (applyRailFormat records an atomic step per rail click, FX6 S1), but undo is
// a general way back, not a dedicated one, and it is not discoverable here.
function outdentParagraphs(text: string, selStart: number, selEnd: number): FormatResult {
  const lines = text.split('\n');
  const { affected, lineOf } = paragraphScope(lines, selStart, selEnd);

  const TAB = LINE_DIRECTIVE.indent;
  const removed = new Set<number>();
  const nextLines = lines.map((l, i) => {
    if (affected.has(i) && l.startsWith(TAB)) { removed.add(i); return l.slice(TAB.length); }
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
  const next = lines.map((l, i) => (affected.has(i) ? TAB + l : l)).join('\n');
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

const ALIGN_PREFIXES = [LINE_DIRECTIVE['align-center'], LINE_DIRECTIVE['align-right']] as const;

// ITEM 122 — WHAT THE CARET IS INSIDE. Draft's rail had NO active state at all
// before this: its format prop was `{ onFormat }` and nothing else, so there was
// never a stuck highlight to unstick on Draft — there was no highlight. (The
// stuck one Nick saw lives on Free Write, whose rail carries `boldOn` and whose
// two-press bracket leaves it armed by design. That surface's styling is being
// removed under item 121, so this is the state that replaces it, built caret-
// derived from the start rather than toggled.)
//
// PURE, AND DELIBERATELY SO: text in, flags out, no DOM. That makes the rule
// testable without a browser and keeps the one interesting decision explicit —
// A RUN COUNTS AS ACTIVE WHEN THE CARET IS ANYWHERE WITHIN IT, ITS MARKERS
// INCLUDED. That is the same boundary `decorateInlineForCard`'s reveal-adjacent
// rule already uses to un-collapse the marks, so the button lights at exactly
// the moment the writer can see the syntax they are inside. Two rules that
// disagreed about "inside" would be worse than either alone.
export function marksAt(text: string, caret: number): { bold: boolean; italic: boolean; underline: boolean; strike: boolean } {
  const within = (mark: string): boolean => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf(mark, i);
      if (open === -1) return false;
      const close = text.indexOf(mark, open + mark.length);
      if (close === -1) return false; // unpaired: not a run, so nothing is inside it
      if (caret >= open && caret <= close + mark.length) return true;
      i = close + mark.length;
    }
    return false;
  };
  // Bold before italic, for the reason the renderer scans that way: `**` would
  // otherwise be read as two italic marks and every bold run would report as
  // italic. The flags are independent, so this ordering is about correctness of
  // the italic answer, not about precedence between them.
  const bold = within(FORMAT_MARK.bold);
  const italicRaw = within(FORMAT_MARK.italic);
  return {
    bold,
    italic: italicRaw && !bold,
    underline: within(FORMAT_MARK.underline),
    strike: within(FORMAT_MARK.strike),
  };
}

export function applyFormat(text: string, selStart: number, selEnd: number, action: FormatAction): FormatResult {
  const start = Math.min(selStart, selEnd);
  const end = Math.max(selStart, selEnd);
  if (action === 'bold') return toggleInline(text, start, end, FORMAT_MARK.bold);
  if (action === 'italic') return toggleInline(text, start, end, FORMAT_MARK.italic);
  if (action === 'underline') return toggleInline(text, start, end, FORMAT_MARK.underline);
  if (action === 'strike') return toggleInline(text, start, end, FORMAT_MARK.strike);
  if (action === 'heading') return cycleHeading(text, start);
  if (action === 'bullet') return toggleLines(text, start, end, LINE_DIRECTIVE.bullet);
  if (action === 'quote') return toggleLines(text, start, end, LINE_DIRECTIVE.quote);
  // ITEM 83 ERRATA E3 — paragraph-scoped and repeatable now, no longer a
  // single-line toggle. See indentParagraphs above for the whole reasoning,
  // including the way back and the outdent question held for Nick's word.
  if (action === 'indent') return indentParagraphs(text, start, end);
  if (action === 'outdent') return outdentParagraphs(text, start, end);
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
  const noHeadings = text
    .split('\n')
    .map(line => {
      // STEP 2: prefixes stack in any order (`\t- `, `- > `, `>< # `), so they are stripped as a LOOP, not one fixed chain.
      // Alignment is tried before quote for the reason given above (`>< ` and `>> ` both begin with `>`).
      let l = line;
      for (;;) {
        const n = l.replace(/^(?:#{1,2} |>< |>> |> |- |\t)/, '');
        if (n === l) return l;
        l = n;
      }
    })
    .join('\n');
  return noHeadings
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    // ITEM 83 M4 (R1/F2) — underline's `__word__` strips beside bold/italic.
    // Placed after `**` (the pre-existing order rule: the longer mark first)
    // and before the single `*`, for the same reason.
    .replace(/__([\s\S]+?)__/g, '$1')
    .replace(/\*([\s\S]+?)\*/g, '$1');
}
