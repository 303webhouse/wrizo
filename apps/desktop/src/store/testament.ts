import type { SessionLog } from '../types';

// Homepage testament (J3) — a pure read-model over the `sessions` collection.
// No writes, no new collection, no dependency. SessionLog rows are written only
// on sprint *save* (recordSession), so this never credits discarded work.
//
// Philosophy: testament, never targets. We surface evidence of accumulated work
// ("words that didn't exist this week", "days at the page"), never a number to
// beat and never a low-number rebuke. On a quiet week we fall back to a lifetime
// or consistency framing; on a fresh install we show a number-free invitation.

const DAY = 86_400_000;

export interface TestamentStats {
  lifetimeWords: number;
  weekWords: number; // last 7 days
  totalSprints: number;
  weekSprints: number; // last 7 days
  daysThisMonth: number; // distinct calendar days with >=1 session, last 30
  currentStreak: number; // consecutive active days up to today/yesterday
  hasSessions: boolean;
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; // local calendar day
}

function currentStreak(activeDays: Set<string>, now: number): number {
  if (activeDays.size === 0) return 0;
  // A streak may end today or (forgivingly) yesterday.
  let cursor = now;
  if (!activeDays.has(dayKey(cursor)) && !activeDays.has(dayKey(cursor - DAY))) return 0;
  if (!activeDays.has(dayKey(cursor))) cursor -= DAY;
  let count = 0;
  while (activeDays.has(dayKey(cursor))) {
    count += 1;
    cursor -= DAY;
  }
  return count;
}

export function computeTestament(sessions: SessionLog[], now: number): TestamentStats {
  let lifetimeWords = 0;
  let weekWords = 0;
  let weekSprints = 0;
  const monthDays = new Set<string>();
  const allDays = new Set<string>();

  for (const s of sessions) {
    const words = Math.max(0, s.words || 0);
    lifetimeWords += words;
    const end = s.endedAt ? new Date(s.endedAt).getTime() : NaN;
    if (Number.isNaN(end)) continue;
    allDays.add(dayKey(end));
    if (now - end <= 7 * DAY) {
      weekWords += words;
      weekSprints += 1;
    }
    if (now - end <= 30 * DAY) monthDays.add(dayKey(end));
  }

  return {
    lifetimeWords,
    weekWords,
    totalSprints: sessions.length,
    weekSprints,
    daysThisMonth: monthDays.size,
    currentStreak: currentStreak(allDays, now),
    hasSessions: sessions.length > 0,
  };
}

export interface Framing {
  key: string;
  text: string;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

// Number-free invitations for fresh installs (and the rare case where sessions
// exist but no framing is currently meaningful). Sentence case, no exclamation.
export const INVITATIONS = [
  'Your first words are waiting.',
  'A blank page, and all the time you need.',
  'Begin whenever you are ready.',
];

// Every framing whose underlying value is currently meaningful. Each is gated by
// its own validity, so a quiet week simply drops the "this week" framings rather
// than rendering "0 words this week".
export function testamentFramings(t: TestamentStats): Framing[] {
  const out: Framing[] = [];
  if (t.weekWords > 0) {
    out.push({ key: 'week-words', text: `${fmt(t.weekWords)} words that didn't exist before this week` });
  }
  if (t.weekSprints > 0) {
    out.push({ key: 'week-sprints', text: `You've tended Wrizo ${t.weekSprints} ${t.weekSprints === 1 ? 'time' : 'times'} this week` });
  }
  if (t.currentStreak >= 2) {
    out.push({ key: 'streak', text: `${t.currentStreak} days at the page in a row` });
  }
  if (t.daysThisMonth > 0) {
    out.push({ key: 'days-month', text: `${t.daysThisMonth} ${t.daysThisMonth === 1 ? 'day' : 'days'} at the page this month` });
  }
  if (t.lifetimeWords > 0) {
    out.push({ key: 'lifetime', text: `${fmt(t.lifetimeWords)} words since you started` });
  }
  return out;
}

export interface Testament {
  text: string;
  isInvitation: boolean;
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)] ?? arr[0];
}

// Pick ONE framing to render statically for this mount. It may differ between
// visits (random among the currently-valid framings) but never auto-rotates —
// the caller computes it once at mount. Falls back to an invitation when no
// framing is meaningful (fresh install or only stale zero-word sessions).
export function selectTestament(
  sessions: SessionLog[],
  now: number,
  rand: () => number = Math.random,
): Testament {
  const framings = testamentFramings(computeTestament(sessions, now));
  if (framings.length === 0) {
    return { text: pick(INVITATIONS, rand), isInvitation: true };
  }
  return { text: pick(framings, rand).text, isInvitation: false };
}
