// THE ARBOR REDESIGN. Was (Fable's brief, Oct 29): a working mockup, on only with ?arbor2=1 in the URL. NOW (NICK, Nov 15, 6:36 pm, via Fable
// 6:45 pm: "the redesign ON by default (?arbor2=0 test-only)"): ON by default in Arbor (data-theme 'plateau'), off in every other theme.
//   ?arbor2=0  TEST-ONLY: the redesign off (today's Arbor), never shown or stored
//   ?arbor2=1  the explicit flag, as before: the redesign whatever the theme, AND the mockup bar (arbor2MockupBar) - every harness and frames file uses it
// No stored flag, no localStorage key. The query sits before the hash (http://localhost:5173/?arbor2=1#/), so it survives every hash-route change.
// The theme is read from <html data-theme> (initTheme sets it before the first render), falling back to the stored theme id - no import of the theme
// store, so a Node shim (the sample seed) that loads this file needs no React.
function arbor2Param(): string | null {
  const fromSearch = new URLSearchParams(window.location.search).get('arbor2');
  if (fromSearch != null) return fromSearch;
  const q = window.location.hash.indexOf('?');
  return q >= 0 ? new URLSearchParams(window.location.hash.slice(q + 1)).get('arbor2') : null;
}
// (the location guard for the helpers below; isArbor2 keeps its own pinned guard line - arbor2-flag-unit.mjs's mutant removes exactly that line)
const hasLoc = (): boolean => typeof window !== 'undefined' && !!window.location;
function themeIsArbor(): boolean {
  try {
    const a = document.documentElement.getAttribute('data-theme');
    if (a) return a === 'plateau';
    const s = localStorage.getItem('wrizo-theme');   // store/theme.ts's KEY; unset or unknown is its DEFAULT, 'plateau'
    return s !== 'flux' && s !== 'machina';
  } catch { return false; }
}
/** The redesign may run in this session: on by default, off only under the test-only ?arbor2=0 (main.tsx mounts it when Arbor becomes the theme). */
export function arbor2Enabled(): boolean {
  if (!hasLoc()) return false;
  return arbor2Param() !== '0';
}
export function isArbor2(): boolean {
  // (a window without a location - a Node shim such as the sample seed's - is not Arbor: page birth calls this, so it must never throw; Fable, ruling (a),
  // Nov 7; pinned by scripts/harness/arbor2-flag-unit.mjs)
  if (typeof window === 'undefined' || !window.location) return false;
  const p = arbor2Param();
  if (p === '0') return false;
  if (p === '1') return true;
  return typeof document !== 'undefined' && themeIsArbor();
}
/** TEST-ONLY: the "Arbor mockup" bar (Logo, Mood, Room) shows only under the explicit ?arbor2=1. By default no bar, and every Mood switch at its ruled default. */
export function arbor2MockupBar(): boolean {
  if (!hasLoc()) return false;
  return arbor2Param() === '1';
}

// TEST-ONLY ROOM PIN (Fable, Nov 5: "a URL parameter under the flag, e.g. &arbor2room=day; never stored or shown; harness use only"): with the
// flag on, ?arbor2=1&arbor2room=day (or night) holds the room whatever the clock says, so a day-room guard can run at night. Anything else: null.
export function arbor2RoomPin(): 'day' | 'night' | null {
  if (typeof window === 'undefined' || !isArbor2()) return null;
  const q = window.location.hash.indexOf('?');
  const v = new URLSearchParams(window.location.search).get('arbor2room') ?? (q >= 0 ? new URLSearchParams(window.location.hash.slice(q + 1)).get('arbor2room') : null);
  return v === 'day' || v === 'night' ? v : null;
}

// TEST-ONLY CARET PIN (the room pin's pattern, for scripts/harness/arbor2-caret-latency.mjs's control arm): with the flag on, &arbor2caret=off left the
// light page's drawn edged caret unmounted (edgedCaret.tsx), so the same page typed with r22's native caret. Never stored or shown; harness use only.
// INERT since Nov 14 (NICK RULED, 8:15 pm: the drawn caret is scrapped; edgedCaret.tsx is gone): nothing reads it, so the pin changes nothing.
export function arbor2CaretOff(): boolean {
  if (typeof window === 'undefined' || !isArbor2()) return false;
  const q = window.location.hash.indexOf('?');
  return (new URLSearchParams(window.location.search).get('arbor2caret') ?? (q >= 0 ? new URLSearchParams(window.location.hash.slice(q + 1)).get('arbor2caret') : null)) === 'off';
}
