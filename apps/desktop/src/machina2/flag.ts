// MACHINA'S LOOK. Was (Fable's brief, Oct 31): a working mockup, on only with ?machina2=1 in the URL. NOW (Fable, Nov 19: "Machina's look SHIPS
// this weekend (rooms, colours, bars, splash; wow parts out)"): ON by default in Machina (data-theme 'machina'), off in every other theme - the
// pattern Arbor's redesign shipped on (arbor2/flag.ts, Nick Nov 15):
//   ?machina2=0  TEST-ONLY: the look off (today's Machina), never shown or stored
//   ?machina2=1  the explicit flag, as before: the look AND the mockup bar (machina2MockupBar) - the frames kit and the writing audit use it
// No stored flag, no localStorage key. The query sits before the hash (http://localhost:5173/?machina2=1#/), so it survives every hash-route change.
// The theme is read from <html data-theme> (initTheme sets it before the first render), falling back to the stored theme id - no import of the
// theme store, so a Node shim that loads this file needs no React.
function machina2Param(): string | null {
  const fromSearch = new URLSearchParams(window.location.search).get('machina2');
  if (fromSearch != null) return fromSearch;
  const q = window.location.hash.indexOf('?');
  return q >= 0 ? new URLSearchParams(window.location.hash.slice(q + 1)).get('machina2') : null;
}
const hasLoc = (): boolean => typeof window !== 'undefined' && !!window.location;
function themeIsMachina(): boolean {
  try {
    const a = document.documentElement.getAttribute('data-theme');
    if (a) return a === 'machina';
    return localStorage.getItem('wrizo-theme') === 'machina';   // store/theme.ts's KEY; unset or unknown is its DEFAULT, Arbor
  } catch { return false; }
}
/** The look may run in this session: on by default, off only under the test-only ?machina2=0 (main.tsx mounts it when Machina becomes the theme). */
export function machina2Enabled(): boolean {
  if (!hasLoc()) return false;
  return machina2Param() !== '0';
}
/** Machina's look is in force now: Machina is the theme (or the explicit ?machina2=1), and not the test-only ?machina2=0. */
export function isMachina2(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  const p = machina2Param();
  if (p === '0') return false;
  if (p === '1') return true;
  return typeof document !== 'undefined' && themeIsMachina();
}
/** TEST-ONLY: the "Machina mockup" bar (Cast, Lighting, Page) shows only under the explicit ?machina2=1. By default there is no bar. */
export function machina2MockupBar(): boolean {
  if (!hasLoc()) return false;
  return machina2Param() === '1';
}
