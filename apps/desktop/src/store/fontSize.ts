// ITEM 207 — page and card type SIZE, in points. Pure: no imports, no store, no DOM.
//
// THE LATTICE (Nick, 2026-09-24): steps start at 11 and move one point at a time between 6 and 18, then two
// points up to 30, then four points to a reasonable top. Computed, never listed, so the rule stays the rule:
//   6, 7, 8 ... 18   (1 pt)   ·   20, 22 ... 30   (2 pt)   ·   34, 38, 42 ... 118   (4 pt)
// `+` stops at 118 (four-point steps from 30 land on 118, never 120); a TYPED size may go to 120, and `-` from 119
// or 120 returns to 118 (PLAN desk's default for the 118/120 wrinkle - vetoable, and Nick's "120pt, maybe?").
//
// WHAT THE NUMBER MEANS (Fable's ruling, 2026-09-24): the number is the size the page PRINTS at; the screen is a
// uniform zoom of it. 11 IS TODAY'S RENDERING exactly (17px at scale 1), so a page that never chose is untouched:
//     px = 17 x (n / 11) x --paper-scale
// Stored as the NUMBER OF POINTS, never a step index, so the lattice can change later without touching a page.
export const SIZE_DEFAULT = 11;
export const SIZE_MIN = 6;
export const SIZE_STEP_MAX = 118;   // where `+` stops
export const SIZE_TYPED_MAX = 120;  // where a typed number stops
export const PROSE_BASE_PX = 17;    // today's prose size at scale 1 == SIZE_DEFAULT points

/** The stops `+`/`-` visit, in ascending order. */
export function sizeLattice(): number[] {
  const out: number[] = [];
  for (let n = SIZE_MIN; n <= 18; n += 1) out.push(n);
  for (let n = 20; n <= 30; n += 2) out.push(n);
  for (let n = 34; n <= SIZE_STEP_MAX; n += 4) out.push(n);
  return out;
}
const LATTICE = sizeLattice();

/** Round to the nearest half point and clamp to the typed range; null when the input is not a number. */
export function normalizeTypedSize(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw.trim()) : NaN;
  if (!Number.isFinite(n)) return null;
  const half = Math.round(n * 2) / 2;
  return Math.min(SIZE_TYPED_MAX, Math.max(SIZE_MIN, half));
}

/** `+`: the smallest stop above the current size; null at the top (the button is inert). */
export function stepUp(current: number): number | null {
  const next = LATTICE.find((s) => s > current);
  return next === undefined ? null : next;
}
/** `-`: the largest stop below the current size; from a typed 119 or 120 that is 118; null at the bottom. */
export function stepDown(current: number): number | null {
  for (let i = LATTICE.length - 1; i >= 0; i -= 1) if (LATTICE[i] < current) return LATTICE[i];
  return null;
}

/** How a size reads in the number field: "10.5", never "10.50", never "11.0". */
export function formatSize(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
