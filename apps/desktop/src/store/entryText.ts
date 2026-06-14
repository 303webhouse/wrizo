// Plain-text helpers for journal entries (J4). Entries store plain text (the
// sprint surface is a <textarea>, not a rich-text editor — there is no Tiptap in
// this codebase), so "extraction" is just line/whitespace work. Shared so J2 can
// reuse firstLine() for routed-scene/project titles. No dependency.

// The opening non-empty line — entries have no titles, so this derives a label.
export function firstLine(text: string): string {
  const line = text.split('\n').map(l => l.trim()).find(Boolean);
  return line || 'Untitled';
}

// A single-line preview: collapse whitespace and truncate with an ellipsis.
export function snippet(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

// Local full-text match: case-insensitive substring over the entry's text.
// Instant, offline, no network. Empty query matches everything.
export function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

// Lines worth reflecting back (J7) — skip empty / very-short fragments so the
// post-sprint echo never surfaces an awkward scrap.
export function substantialLines(text: string, minChars = 24): string[] {
  return text.split('\n').map(l => l.trim()).filter(l => l.length >= minChars);
}

// Pick one of the writer's own lines to echo at the finish moment, or null when
// there isn't a substantial one (a graceful skip — no echo rather than a
// fragment). Reflection only: the line is the writer's own, never generated.
export function pickEchoLine(text: string, rand: () => number = Math.random): string | null {
  const lines = substantialLines(text);
  if (lines.length === 0) return null;
  return lines[Math.floor(rand() * lines.length)] ?? lines[0];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Calm, locale-independent stamp like "Jun 14, 3:42 PM".
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  const hour12 = d.getHours() % 12 || 12;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${hour12}:${mins} ${ampm}`;
}
