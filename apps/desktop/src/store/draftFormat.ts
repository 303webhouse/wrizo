// AB2 S3 — Draft's tools, operating as markdown conventions directly on
// `entry.text` (S0's ruling: no separate rich-text state). Pure string
// transforms given the full text + a selection's linear character offsets
// (store/caretOffset.ts's getSelectionOffsets) — the caller (PageEditor.tsx)
// owns the DOM/selection side; this module only ever touches strings.

export type FormatAction = 'bold' | 'italic' | 'heading' | 'spacing';
export type StructureKind = 'prose' | 'screenplay';

// FX7 S2 — the two markdown marks Free Write's own forward-only rail can
// ALSO reuse (PageEditor.tsx's applyFreeWriteFormat) — a single source of
// truth for the literal marker characters, so a forward-only insertion and
// a Draft-mode selection-wrap can never drift onto different conventions.
export const FORMAT_MARK: Record<'bold' | 'italic', string> = { bold: '**', italic: '*' };

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

export function applyFormat(text: string, selStart: number, selEnd: number, action: FormatAction): FormatResult {
  const start = Math.min(selStart, selEnd);
  const end = Math.max(selStart, selEnd);
  if (action === 'bold') return wrapSelection(text, start, end, FORMAT_MARK.bold);
  if (action === 'italic') return wrapSelection(text, start, end, FORMAT_MARK.italic);
  if (action === 'heading') return cycleHeading(text, start);
  return insertSpacing(text, start, end);
}

// S5 — "Copy My Words": the same frozen convention set, stripped back to
// honest plain reading text. Order matters (bold's `**` before italic's `*`,
// mirroring draftDecoration.ts's own inline-scan priority) so a bold run's
// asterisks are never left half-stripped by the italic pass.
export function stripMarkdownConventions(text: string): string {
  const noHeadings = text
    .split('\n')
    .map(line => line.replace(/^#{1,2}\s+/, ''))
    .join('\n');
  return noHeadings
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    .replace(/\*([\s\S]+?)\*/g, '$1');
}
