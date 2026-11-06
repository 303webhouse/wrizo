// Plain-text helpers for journal entries (J4). Entries store plain text (the
// sprint surface is a <textarea>, not a rich-text editor — there is no Tiptap in
// this codebase), so "extraction" is just line/whitespace work. Shared so J2 can
// reuse firstLine() for routed-scene/project titles. No dependency.
import { stripLine } from './markRuns';

// titles and excerpts are plain text: every derivation reads a line through the one reader (markRuns stripLine); a line that is only markup is skipped [entryText §1]
export function plainLines(text: string): string[] {
  return text.split('\n').map(l => stripLine(l.trimStart()).trim()).filter(Boolean);
}

/** The first line with anything to read, as plain text; undefined when there is none. */
export function firstPlainLine(text: string): string | undefined {
  return plainLines(text)[0];
}

// the opening non-empty line: entries have no titles, so this derives a label [entryText §2]
export function firstLine(text: string): string {
  return firstPlainLine(text) || 'Untitled';
}

// ITEM 133 — THE BOARD'S NAME, derived in ONE place.
//
// A board's `text` is not prose. `createBoardPage` sets it once, at birth, from
// the optional title it is given, and until this ticket NOTHING in the app ever
// wrote it again — which is why every board born through the untitled doors was
// called "Untitled board" for life. That is the founder's report: boards cannot
// be named.
//
// WHY A HELPER RATHER THAN A FOURTH COPY. The same name was being derived three
// different ways at three sites: BoardEditor took the WHOLE trimmed text with a
// fallback of "Untitled"; Cascade took `firstLine(...).slice(0, 60)` with a
// fallback of "Untitled board"; CascadePanels split on the newline itself with
// its own 60-cap. Three readings of one field, disagreeing about truncation AND
// about what an unnamed board is called — so a board could answer to two names
// on two surfaces. The rename this ticket adds would have made that visible
// immediately, since a writer renaming a board watches one label change. This
// is the single source; the full 30-site sweep belongs to its own ticket.
//
// THE FALLBACK IS THE CALLER'S, DELIBERATELY. The first cut of this helper
// returned 'Untitled board' everywhere, which quietly CHANGED what the board's
// own crumb displays: that surface has always said plain 'Untitled', and the
// headful sitting captured it doing so. Unifying the stand-in text is item
// 136's job — it retires these strings wholesale under the "first few words"
// rule — and changing one of them here would leave two half-rules on one tree,
// with a board saying 'Untitled board' in the cascade and 'Untitled' in its own
// crumb for exactly as long as it took someone to notice.
//
// So this single-sources the DERIVATION (which line, trimmed, capped) and
// nothing else. That was the drift worth closing: three sites disagreeing about
// which characters the name is. What each surface CALLS a nameless board stays
// exactly as it was until one rule replaces all of them at once.
export function boardName(text: string | undefined, fallback: string): string {
  const first = firstPlainLine(text ?? '');
  return first ? first.slice(0, 60) : fallback;
}

// A single-line preview: collapse whitespace and truncate with an ellipsis.
export function snippet(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

// Lines worth reflecting back (J7) — skip empty / very-short fragments so the
// post-sprint echo never surfaces an awkward scrap.
export function substantialLines(text: string, minChars = 24): string[] {
  return plainLines(text).filter(l => l.length >= minChars);   // the echoed line is shown to the writer, so it is plain text [entryText §3]
}

// Pick one of the writer's own lines to echo at the finish moment, or null when
// there isn't a substantial one (a graceful skip — no echo rather than a
// fragment). Reflection only: the line is the writer's own, never generated.
export function pickEchoLine(text: string, rand: () => number = Math.random): string | null {
  const lines = substantialLines(text);
  if (lines.length === 0) return null;
  return lines[Math.floor(rand() * lines.length)] ?? lines[0];
}
