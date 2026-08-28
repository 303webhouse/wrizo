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
  if (action === 'indent') return toggleLinePrefix(text, start, LINE_DIRECTIVE.indent);
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
