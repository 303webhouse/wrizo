// ARBOR v2 MOCKUP - §14 item 7, THE RHIZOME VARIATION (spec §7.3, "the rhizome by day"): real sage shoots, their widths varying 1-2.5 px,
// and how each lap's growth is drawn varying - one lap sends thin shoots quickly, the next a thick one slowly. A PRESENTATION change only:
// the lap rule, the growth model (store/rhizomeGrowth.ts) and what is drawn per word are unchanged; growth still happens only on words
// written. Pure functions, no DOM, nothing stored. RhizomeField calls them only under the flag (and while the Mood switch leaves it on).
// No imports, so the browserless unit (scripts/harness/arbor2-7-unit.mjs) loads it as is: the hash is store/rhizomeGrowth.ts's FNV-1a.
function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export type LapCharacter = 'fine' | 'bold';

/** Each lap's own character, fixed by the page's seed and the lap: 'fine' (thin shoots, early) or 'bold' (thick shoots, later). */
export function lapCharacter(pageSeed: string, lap: number): LapCharacter {
  return hashSeed(`${pageSeed}:shoots:${lap}`) % 2 === 0 ? 'fine' : 'bold';
}

/** A shoot's width class, 0..3 = 1 / 1.5 / 2 / 2.5 px (styles/arbor-v2.css). A whole stem shares one width; a main stem is the heavier one. */
export function shootClass(pageSeed: string, lap: number, seg: { stem: number; thick: boolean }): 0 | 1 | 2 | 3 {
  const base = lapCharacter(pageSeed, lap) === 'fine' ? 0 : 2;
  const up = seg.thick ? 1 : hashSeed(`${pageSeed}:shoot:${lap}:${seg.stem}`) % 2;
  return (base + up) as 0 | 1 | 2 | 3;
}

/** The lap's PACE: the fraction of the goal written, reshaped by the lap's own curve (f^g; fine laps g in [.7, 1), bold in [1.1, 1.5]).
 *  0 stays 0, 1 stays 1, and it only ever rises with the count - so the drawing grows only on words written, never ahead of them at the
 *  goal and never back. */
export function pacedFrac(pageSeed: string, lap: number, frac: number): number {
  if (!(frac > 0)) return 0;
  if (frac >= 1) return 1;
  const u = (hashSeed(`${pageSeed}:pace:${lap}`) % 1000) / 1000;
  const g = lapCharacter(pageSeed, lap) === 'fine' ? 0.7 + 0.3 * u : 1.1 + 0.4 * u;
  return Math.pow(frac, g);
}

/** The variation is drawn only under the flag, and not while the Mood menu's "Rhizome variation" switch is off (in-session). */
export function variationOn(): boolean {
  if (typeof document === 'undefined') return false;
  const r = document.documentElement;
  return r.getAttribute('data-arbor2') === 'true' && !(r.getAttribute('data-arbor2-off') || '').split(/\s+/).includes('variation');
}
