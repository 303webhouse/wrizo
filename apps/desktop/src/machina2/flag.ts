// MACHINA v2 WORKING MOCKUP (Fable's brief, Oct 31; spec draft 4 §14): on only with ?machina2=1 in the URL. No stored flag, no localStorage key.
// The query sits before the hash (http://localhost:5173/?machina2=1#/), so it survives every hash-route change.
export function isMachina2(): boolean {
  if (typeof window === 'undefined') return false;
  const fromSearch = new URLSearchParams(window.location.search).get('machina2');
  if (fromSearch != null) return fromSearch === '1';
  const q = window.location.hash.indexOf('?');
  return q >= 0 && new URLSearchParams(window.location.hash.slice(q + 1)).get('machina2') === '1';
}
