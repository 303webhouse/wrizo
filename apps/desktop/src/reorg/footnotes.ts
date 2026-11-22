// FOOTNOTES AND ENDNOTES, THE TEXT'S HALF (reorg-plan-v2, INK queue item 3; Nick ruled A, Nov 21: "[^1] in the text, `[^1]: the note` on its own line at the Part's end; no new field;
// split/join/undo/move carry them"). Pure: no store, no DOM. The one reader and writer of the note shape, so the page, the word count, the Parts layer and the export all agree.
//   a MARKER is [^label] in the words; a NOTE is a line "[^label]: the note" in the run of note lines at the END of a Part's text (blank lines may stand between them)
//   a note-like line in the middle of the words is only words; a typed \[^1] (escaped) is not a marker
//   a label starting "e" + digits ("e1") is an ENDNOTE (export puts it at the Doc's end); any other label is a FOOTNOTE (the Part's end)
export type Note = { label: string; endnote: boolean; text: string };
export type NoteKind = 'footnote' | 'endnote';

const NOTE_LINE = /^\[\^([\w-]+)\]: ?(.*)$/;
const MARKER_G = /(?<!\\)\[\^([\w-]+)\]/g;
const isBlank = (l: string): boolean => /^\s*$/.test(l);
const isEndnoteLabel = (label: string): boolean => /^e\d+$/.test(label);

/** The index of the first note line of the trailing note block, or lines.length when the text has none. */
function noteStart(lines: string[]): number {
  let j = lines.length - 1;
  while (j >= 0 && (isBlank(lines[j]) || NOTE_LINE.test(lines[j]))) j -= 1;
  let start = j + 1;
  while (start < lines.length && !NOTE_LINE.test(lines[start])) start += 1;
  return start;
}

/** Whether one line is shaped as a note line ("[^1]: the note"): what the page sets apart, one row at a time. */
export function isNoteLine(line: string): boolean {
  return NOTE_LINE.test(line);
}

/** The Part's text as its words and its notes: the notes are the trailing note lines; no notes = the body is the whole text. */
export function readNotes(text: string): { body: string; notes: Note[] } {
  const lines = text.split('\n');
  const start = noteStart(lines);
  if (start >= lines.length) return { body: text, notes: [] };
  const notes: Note[] = [];
  for (const l of lines.slice(start)) {
    const m = NOTE_LINE.exec(l);
    if (m) notes.push({ label: m[1], endnote: isEndnoteLabel(m[1]), text: m[2] });
  }
  let end = start;
  while (end > 0 && isBlank(lines[end - 1])) end -= 1;
  return { body: lines.slice(0, end).join('\n'), notes };
}

/** The words and the notes back into one text: a blank line, then one line per note. No notes = the words as they are. */
export function writeNotes(body: string, notes: readonly Note[]): string {
  if (notes.length === 0) return body;
  const lines = notes.map((n) => `[^${n.label}]: ${n.text}`).join('\n');
  return body === '' ? lines : body + '\n\n' + lines;
}

/** The labels of the markers in the words, in the order they stand (once per marker). Pass the body, not the whole text. */
export function markersIn(body: string): string[] {
  return Array.from(body.matchAll(MARKER_G), (m) => m[1]);
}

/**
 * The Footnote and Endnote acts: a marker at the caret, an empty note line after the notes already there, under the smallest label no marker or note uses ("1", "2"... / "e1", "e2"...).
 * The caret comes back on the new note line (its end). A caret inside the notes is refused (null).
 */
export function insertNote(text: string, caret: number, kind: NoteKind): { text: string; caret: number } | null {
  const { body, notes } = readNotes(text);
  if (caret < 0 || caret > body.length) return null;
  const used = new Set<string>(markersIn(body).concat(notes.map((n) => n.label)));
  const prefix = kind === 'endnote' ? 'e' : '';
  let n = 1;
  while (used.has(prefix + n)) n += 1;
  const label = prefix + n;
  const next = writeNotes(body.slice(0, caret) + `[^${label}]` + body.slice(caret), notes.concat({ label, endnote: kind === 'endnote', text: '' }));
  return { text: next, caret: next.length };
}

/** The words with each marker whose label is in `labels` swapped for `mark(label)` (a marker with no note, and an escaped one, stay as typed). */
export function writeMarkers(body: string, labels: readonly string[], mark: (label: string) => string): string {
  const have = new Set(labels);
  return body.replace(MARKER_G, (m, l: string) => (have.has(l) ? mark(l) : m));
}

/** What a goal counts: the words without the notes and without the markers. */
export function wordsOnly(text: string): string {
  const { body } = readNotes(text);
  return body.replace(MARKER_G, '');
}

/** A split that carries the notes: each note goes to the half holding its marker (a note with no marker stays above; one cited in both halves is copied to both). No notes: the stand-in's result, untouched. */
export function splitWithNotes<T extends { head: string; tail: string }>(text: string, offset: number, splitBody: (text: string, offset: number) => T): T {
  const { body, notes } = readNotes(text);
  if (notes.length === 0) return splitBody(text, offset);
  const r = splitBody(body, Math.min(offset, body.length));
  const inTail = new Set(markersIn(r.tail));
  const inHead = new Set(markersIn(r.head));
  const toTail = notes.filter((n) => inTail.has(n.label));
  const toHead = notes.filter((n) => inHead.has(n.label) || !inTail.has(n.label));
  return { ...r, head: writeNotes(r.head, toHead), tail: writeNotes(r.tail, toTail) };
}

/** A join that carries the notes: the lower Part's notes come after the upper's; a label the upper already has is renamed (marker and note together), a free label keeps its name. No notes: the stand-in's result, untouched. */
export function joinWithNotes(above: string, below: string, joinBody: (above: string, below: string) => string): string {
  const a = readNotes(above);
  const b = readNotes(below);
  if (a.notes.length === 0 && b.notes.length === 0) return joinBody(above, below);
  const taken = new Set(a.notes.map((n) => n.label).concat(markersIn(a.body)));
  const own = new Set(b.notes.map((n) => n.label).concat(markersIn(b.body)));
  const rename = new Map<string, string>();
  for (const n of b.notes) {
    if (!taken.has(n.label) || rename.has(n.label)) continue;
    const prefix = n.endnote ? 'e' : '';
    let k = 1;
    while (taken.has(prefix + k) || own.has(prefix + k)) k += 1;
    rename.set(n.label, prefix + k);
    taken.add(prefix + k);
  }
  const lower = rename.size === 0 ? b.body : b.body.replace(MARKER_G, (m, l: string) => (rename.has(l) ? `[^${rename.get(l)}]` : m));
  const notes = a.notes.concat(b.notes.map((n) => (rename.has(n.label) ? { ...n, label: rename.get(n.label) as string } : n)));
  return writeNotes(joinBody(a.body, lower), notes);
}
