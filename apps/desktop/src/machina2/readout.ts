// MACHINA v2 MOCKUP - §8.2 THE READOUT BAR and §7's "parts" unit (Fable ruling 3: "the ~ readouts approved (pages, reading time); a Part
// counts as covered once it has any words"). Under the page, in place of the Run's plain count, Plex Mono, quiet grey:
//   28 words · ~0.1 pages · <1 min read · Part 1 of 4 · no goal set        (or the goal's true remainder: "1,972 words to goal")
// EVERY FIGURE A FACT: the words are the app's own count of the page; pages are ESTIMATED from the page kind's geometry (a manuscript page at
// the page law's 12 pt, double-spaced, holds ~250 words) and reading time at 230 words a minute - both labelled "~"; the Part is the page's
// place among its Project's manuscript pages (a loose File shows no Part); the goal figure is only ever the remainder of a goal SHE set. Never a
// target the app sets. Pure functions, no DOM, nothing stored (the browserless unit loads this file as is).
export const WORDS_PER_PAGE = 250;
export const WORDS_PER_MINUTE = 230;

const n0 = (n: number) => n.toLocaleString('en-US');

export function pagesEstimate(words: number): string {
  const p = words / WORDS_PER_PAGE;
  return `~${p < 10 ? p.toFixed(1) : Math.round(p)} page${p === 1 ? '' : 's'}`;
}

export function readingTime(words: number): string {
  const m = words / WORDS_PER_MINUTE;
  return m < 1 ? '<1 min read' : `~${Math.round(m)} min read`;
}

export type GoalLike = { n: number; unit: 'words' | 'lines' | string } | null;

/** The readout line. `part` is [index (1-based), total] or null for a loose File; `goalCount` is the goal's own count of the page. */
export function readoutLine(words: number, part: [number, number] | null, goal: GoalLike, goalCount: number): string {
  const bits = [`${n0(words)} word${words === 1 ? '' : 's'}`, pagesEstimate(words), readingTime(words)];
  if (part) bits.push(`Part ${part[0]} of ${part[1]}`);
  if (!goal || !(goal.n > 0)) bits.push('no goal set');
  else {
    const left = goal.n - (goalCount % goal.n);
    const unit = goal.unit === 'lines' ? (left === 1 ? 'line' : 'lines') : (left === 1 ? 'word' : 'words');
    bits.push(goalCount > 0 && goalCount % goal.n === 0 ? 'goal met' : `${n0(left)} ${unit} to goal`);
  }
  return bits.join(' · ');
}

/** Parts covered (ruling 3: a Part counts once it has any words): [covered, total]. */
export function partsCovered(partWordCounts: number[]): [number, number] {
  return [partWordCounts.filter((w) => w > 0).length, partWordCounts.length];
}

/** Words in a text, the plain way (runs of non-space). */
export function wordsIn(text: string): number {
  const m = String(text || '').trim().match(/\S+/g);
  return m ? m.length : 0;
}
