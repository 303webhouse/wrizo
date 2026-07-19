// TU1 S4 — nudges: letters, never calls. Templated observations keyed to
// real state (a starred page untouched for days; a board with an empty
// region), written in the Tutor's voice, DERIVED live on approach —
// recomputed fresh every time the panel opens, never stored, never pushed.
// A14 is absolute: nothing in this file's caller (Tutor.tsx) may render a
// badge, toast, count, or dot keyed to this function's output, and the
// grip's own rendering must never differ whether it returns [] or not —
// see Tutor.tsx's own header comment for where that invariant is enforced.
import { getJournalEntries } from './persistence';
import { titleOf } from './tutorLenses';

const STALE_STAR_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_PER_KIND = 3;

export function computeNudges(currentEntryId: string): string[] {
  const all = getJournalEntries();
  const now = Date.now();
  const nudges: string[] = [];

  // A starred page untouched for STALE_STAR_DAYS+ — excludes the current
  // page (nudging about the page you're already on is pointless).
  const staleStars = all
    .filter(e => e.starred && e.id !== currentEntryId
      && (now - new Date(e.updatedAt).getTime()) / MS_PER_DAY >= STALE_STAR_DAYS)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)); // staler first
  for (const e of staleStars.slice(0, MAX_PER_KIND)) {
    const days = Math.floor((now - new Date(e.updatedAt).getTime()) / MS_PER_DAY);
    nudges.push(`"${titleOf(e)}" has been starred for ${days} days without a touch.`);
  }

  // A board with an empty region — v1: a board page with zero boxes.
  const emptyBoards = all.filter(e => e.pageType === 'board' && (e.boxes ?? []).length === 0);
  for (const e of emptyBoards.slice(0, MAX_PER_KIND)) {
    nudges.push(`"${titleOf(e)}" is a board with nothing on it yet.`);
  }

  return nudges;
}
