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
  | 'bold' | 'italic' | 'underline' | 'heading' | 'spacing'
  | 'bullet' | 'quote' | 'indent'
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
export const FORMAT_MARK: Record<'bold' | 'italic' | 'underline', string> =
  { bold: '**', italic: '*', underline: '__' };

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

/** Toggle a line prefix on the caret's own line. Toggling is what makes these
 *  honest: pressing twice returns the line to exactly what it was, so a writer
 *  can always get back to plain. Alignment prefixes are mutually exclusive —
 *  applying one clears the other, since a line cannot be both. */
function toggleLinePrefix(text: string, at: number, prefix: string, exclusiveWith: readonly string[] = []): FormatResult {
  const ls = text.lastIndexOf('\n', Math.max(0, at - 1)) + 1;
  let le = text.indexOf('\n', at);
  if (le === -1) le = text.length;
  let line = text.slice(ls, le);

  const had = line.startsWith(prefix);
  for (const other of exclusiveWith) {
    if (line.startsWith(other)) line = line.slice(other.length);
  }
  const nextLine = had ? line.slice(prefix.length) : prefix + line;

  const next = text.slice(0, ls) + nextLine + text.slice(le);
  const delta = nextLine.length - (le - ls);
  const caret = Math.max(ls, at + delta);
  return { text: next, start: caret, end: caret };
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
function indentParagraphs(text: string, selStart: number, selEnd: number): FormatResult {
  const lines = text.split('\n');
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
  // that line — the ordinary editor convention. Without this, selecting a whole
  // paragraph by dragging to the next line's start would silently indent the
  // paragraph after it too.
  if (selEnd > selStart && last > first && selEnd === startsAt[last]) last--;

  if (hasInk(first)) while (first > 0 && hasInk(first - 1)) first--;
  if (hasInk(last)) while (last < lines.length - 1 && hasInk(last + 1)) last++;

  const affected = new Set<number>();
  for (let i = first; i <= last; i++) if (hasInk(i)) affected.add(i);
  // A caret alone on a blank line has no paragraph to indent. Indent that line
  // anyway, so a writer can set the level BEFORE typing into it — which is what
  // the single-line control always did, and the one behaviour of it worth
  // keeping.
  if (affected.size === 0) affected.add(first);

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

export function applyFormat(text: string, selStart: number, selEnd: number, action: FormatAction): FormatResult {
  const start = Math.min(selStart, selEnd);
  const end = Math.max(selStart, selEnd);
  if (action === 'bold') return wrapSelection(text, start, end, FORMAT_MARK.bold);
  if (action === 'italic') return wrapSelection(text, start, end, FORMAT_MARK.italic);
  if (action === 'underline') return wrapSelection(text, start, end, FORMAT_MARK.underline);
  if (action === 'heading') return cycleHeading(text, start);
  if (action === 'bullet') return toggleLinePrefix(text, start, LINE_DIRECTIVE.bullet);
  if (action === 'quote') return toggleLinePrefix(text, start, LINE_DIRECTIVE.quote);
  // ITEM 83 ERRATA E3 — paragraph-scoped and repeatable now, no longer a
  // single-line toggle. See indentParagraphs above for the whole reasoning,
  // including the way back and the outdent question held for Nick's word.
  if (action === 'indent') return indentParagraphs(text, start, end);
  if (action === 'align-center') return toggleLinePrefix(text, start, LINE_DIRECTIVE['align-center'], ALIGN_PREFIXES);
  if (action === 'align-right') return toggleLinePrefix(text, start, LINE_DIRECTIVE['align-right'], ALIGN_PREFIXES);
  // 'align-left' is the UNMARKED state, not a third token: clearing both
  // alignment prefixes IS left. A `<< ` token would be a lie about the
  // default — every unmarked line in every page ever written is already left.
  if (action === 'align-left') {
    const ls = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    let le = text.indexOf('\n', start);
    if (le === -1) le = text.length;
    let line = text.slice(ls, le);
    const before = line.length;
    for (const p of ALIGN_PREFIXES) if (line.startsWith(p)) line = line.slice(p.length);
    const next = text.slice(0, ls) + line + text.slice(le);
    const caret = Math.max(ls, start + (line.length - before));
    return { text: next, start: caret, end: caret };
  }
  return insertSpacing(text, start, end);
}

// S5 — "Copy My Words": the same frozen convention set, stripped back to
// honest plain reading text. Order matters (bold's `**` before italic's `*`,
// mirroring draftDecoration.ts's own inline-scan priority) so a bold run's
// asterisks are never left half-stripped by the italic pass.
export function stripMarkdownConventions(text: string): string {
  const noHeadings = text
    .split('\n')
    .map(line => line
      .replace(/^#{1,2}\s+/, '')
      // ITEM 83 M5 (R4/F3) — the new line directives strip with the rest.
      // ORDER MATTERS and is the reason these are one chained pass per line:
      // the alignment tokens (`>< `, `>> `) both begin with `>`, so a naive
      // block-quote strip run first would eat their first character and leave
      // `< ` / `> ` behind as visible litter in "Copy My Words". Alignment is
      // therefore removed BEFORE the quote mark. Indent's leading tab goes
      // last — it can legitimately sit after a quote or bullet prefix.
      .replace(/^>< |^>> /, '')
      .replace(/^> /, '')
      .replace(/^- /, '')
      .replace(/^\t+/, ''))
    .join('\n');
  return noHeadings
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    // ITEM 83 M4 (R1/F2) — underline's `__word__` strips beside bold/italic.
    // Placed after `**` (the pre-existing order rule: the longer mark first)
    // and before the single `*`, for the same reason.
    .replace(/__([\s\S]+?)__/g, '$1')
    .replace(/\*([\s\S]+?)\*/g, '$1');
}
