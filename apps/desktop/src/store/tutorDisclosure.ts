import { useEffect, useState } from 'react';

// TU1 S5 → TU2 S3 — the Tutor's one-time disclosure, now VERSIONED. TU1's
// flag was a bare '1'/'0' boolean, fine when the disclosure's wording never
// changed; TU2 S2 makes a delta of the writer's own recent page text travel
// alongside their question, so the disclosure's TEXT changed (S3's ratified
// v2 string, in deskLexicon's `tutorDisclosureBodyV2`) and the flag now has
// to say WHICH version a device has acknowledged, not just whether it has
// ever clicked through one. Still a plain client-local localStorage flag,
// never schema — the same store/firstRun.ts shape (HB1 F3's own precedent)
// this file already followed pre-versioning; only what's stored under it
// changed shape, from a boolean to a version number.
//
// Mechanism: store the highest disclosure version this device has
// acknowledged, as a plain integer. "Needs showing" is always the single
// comparison `seenVersion < CURRENT_DISCLOSURE_VERSION` — the SAME
// comparison covers a brand-new device (seenVersion 0, sees v2 once, done)
// and a future v2→v3 bump (seenVersion 2, sees v3 once, done): no
// version-specific branch anywhere past the one-time legacy migration read
// in `load()` below. A stored SET of every version ever individually seen
// would also satisfy the brief but buys nothing here — the panel only ever
// renders CURRENT_DISCLOSURE_VERSION's own copy, never an older version's,
// so there is no reason to remember which specific earlier versions a
// device happened to pass through on the way to the current one.
const KEY = 'wrizo-tutor-disclosure-seen-version';

// TU1 S5's own pre-versioning key, kept read-only here for exactly one
// purpose: migrating a device that acknowledged v1 before this version
// concept existed. Such a device has this set to '1' and nothing under
// `KEY` yet — `load()` below reads that as seenVersion 1, which is <
// CURRENT_DISCLOSURE_VERSION (2), so v2 still shows exactly once on next
// open. That is the brief's own "the v1 flag does not suppress v2"
// requirement, satisfied by the ordinary comparison rather than a bespoke
// v1-specific check. A brand-new device has NEITHER key set and reads as
// seenVersion 0 — it only ever sees v2, never a v1-then-v2 double prompt.
// Never written to by this file going forward; new acknowledgments write
// only `KEY`.
const LEGACY_BOOLEAN_KEY = 'wrizo-tutor-disclosure-seen';

// Bump this — and add a new deskLexicon body id (`tutorDisclosureBodyV3`,
// etc.), per `tutorDisclosureBodyV2`'s own precedent — the day the
// disclosure's wording next changes. Nothing else in this file needs to
// change: every existing device's stored seenVersion is already less than
// whatever the new constant becomes, so the "show once more" behavior
// falls out of the comparison for free.
export const CURRENT_DISCLOSURE_VERSION = 2;

function load(): number {
  try {
    if (typeof localStorage === 'undefined') return 0;
    const stored = localStorage.getItem(KEY);
    if (stored !== null) {
      const n = parseInt(stored, 10);
      return Number.isFinite(n) ? n : 0;
    }
    return localStorage.getItem(LEGACY_BOOLEAN_KEY) === '1' ? 1 : 0; // migration read, see header comment
  } catch {
    return 0;
  }
}

let current: number = load();
const subs = new Set<(v: number) => void>();

// Function names kept identical to TU1's own (getTutorDisclosureSeen /
// setTutorDisclosureSeen / useTutorDisclosureSeen) so Tutor.tsx's call
// sites need no rename — only this module's internal representation
// changed, from a boolean to a version number the boolean API is derived
// from.
export function getTutorDisclosureSeen(): boolean {
  return current >= CURRENT_DISCLOSURE_VERSION;
}

export function setTutorDisclosureSeen(next: boolean): void {
  // `next` is always `true` from the one real call site (Tutor.tsx's
  // acknowledgeDisclosure) — acknowledging means "seen the CURRENT
  // version." `false` is accepted for API symmetry with TU1's own
  // signature and resets the device below the current version, i.e.
  // exactly the un-acknowledged state.
  current = next ? CURRENT_DISCLOSURE_VERSION : 0;
  try { localStorage.setItem(KEY, String(current)); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

export function useTutorDisclosureSeen(): boolean {
  const [value, setValue] = useState(current >= CURRENT_DISCLOSURE_VERSION);
  useEffect(() => {
    const fn = (v: number) => setValue(v >= CURRENT_DISCLOSURE_VERSION);
    subs.add(fn);
    setValue(current >= CURRENT_DISCLOSURE_VERSION);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}
