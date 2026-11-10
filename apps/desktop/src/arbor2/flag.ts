// ARBOR v2 WORKING MOCKUP (Fable's brief, Oct 29): on only with ?arbor2=1 in the URL. No stored flag, no localStorage key.
// The query sits before the hash (http://localhost:5173/?arbor2=1#/), so it survives every hash-route change.
export function isArbor2(): boolean {
  // (a window without a location - a Node shim such as the sample seed's - is not Arbor: page birth calls this, so it must never throw; Fable, ruling (a),
  // Nov 7; pinned by scripts/harness/arbor2-flag-unit.mjs)
  if (typeof window === 'undefined' || !window.location) return false;
  const fromSearch = new URLSearchParams(window.location.search).get('arbor2');
  if (fromSearch != null) return fromSearch === '1';
  const q = window.location.hash.indexOf('?');
  return q >= 0 && new URLSearchParams(window.location.hash.slice(q + 1)).get('arbor2') === '1';
}

// TEST-ONLY ROOM PIN (Fable, Nov 5: "a URL parameter under the flag, e.g. &arbor2room=day; never stored or shown; harness use only"): with the
// flag on, ?arbor2=1&arbor2room=day (or night) holds the room whatever the clock says, so a day-room guard can run at night. Anything else: null.
export function arbor2RoomPin(): 'day' | 'night' | null {
  if (typeof window === 'undefined' || !isArbor2()) return null;
  const q = window.location.hash.indexOf('?');
  const v = new URLSearchParams(window.location.search).get('arbor2room') ?? (q >= 0 ? new URLSearchParams(window.location.hash.slice(q + 1)).get('arbor2room') : null);
  return v === 'day' || v === 'night' ? v : null;
}

// TEST-ONLY CARET PIN (the room pin's pattern, for scripts/harness/arbor2-caret-latency.mjs's control arm): with the flag on, &arbor2caret=off leaves the
// light page's drawn edged caret unmounted (edgedCaret.tsx), so the same page types with r22's native caret. Never stored or shown; harness use only.
export function arbor2CaretOff(): boolean {
  if (typeof window === 'undefined' || !isArbor2()) return false;
  const q = window.location.hash.indexOf('?');
  return (new URLSearchParams(window.location.search).get('arbor2caret') ?? (q >= 0 ? new URLSearchParams(window.location.hash.slice(q + 1)).get('arbor2caret') : null)) === 'off';
}
