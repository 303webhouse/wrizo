// TU2 S5 — the session meter's running "this session" total. A plain
// MODULE-level variable, deliberately not React state and never persisted
// — the brief's own explicit words: "Session totals live in memory only,"
// no localStorage, no server round-trip, resets on reload on purpose. A
// module scope (rather than state owned by Tutor.tsx itself) is what lets
// the total survive the writer navigating from page to page within the
// same load: Tutor.tsx is mounted fresh per page by its host (JournalEntry/
// PageEditor/ScriptEditor/BoardEditor each construct their own `<Tutor
// entry={...}>` with no stable key across a route change), so component-
// local state would silently reset "this session" on every page switch —
// not what "session" means here. Only a real reload zeroes this out, which
// is the one reset this ticket intends.
let sessionCostUSD = 0;

/** Adds this turn's estimated cost to the running session total and returns the new total. */
export function addTutorSessionCost(turnCostUSD: number): number {
  sessionCostUSD += turnCostUSD;
  return sessionCostUSD;
}

export function getTutorSessionCost(): number {
  return sessionCostUSD;
}

// Test/inspection seam only — mirrors deskLexicon.ts's own
// `window.wrizoDeskLexicon` precedent. Never read by app code.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoTutorSessionCost?: () => number }).wrizoTutorSessionCost = getTutorSessionCost;
}
