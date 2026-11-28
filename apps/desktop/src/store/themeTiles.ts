import { dayness, MID } from '../arbor2/room';
import { wantRoom } from '../machina2/room';

// THE THEME PICKER'S TILES (flourish-spec.md §3): each tile wears its theme's current look, whichever theme is in use. Nothing here is saved.
export type TileTone = 'light' | 'dark';

/** Arbor: walnut by night, cream by day. The room in force when Arbor is the theme; otherwise the same Room choice (data-room) and clock Arbor reads. */
export function arborTileTone(o: { inForce: string | null; roomAttr: string | null; minutes: number; reduced: boolean }): TileTone {
  if (o.inForce === 'day' || o.inForce === 'night') return o.inForce === 'day' ? 'light' : 'dark';
  return dayness(o.roomAttr, o.minutes, o.reduced) >= MID ? 'light' : 'dark';
}

/** Machina: light by day, dark with a dark page (and dark by night: its chrome is). */
export function machinaTileTone(o: { inForce: string | null; roomAttr: string | null; minutes: number; page: string }): TileTone {
  if (o.page === 'dark') return 'dark';
  return o.inForce === 'light' || o.inForce === 'dark' ? o.inForce : wantRoom(o.roomAttr, o.minutes);
}

export interface Shoot { d: string; depth: number }
export interface Rhizome { shoots: Shoot[]; knots: Array<[number, number]> }

// Arbor's hover homage: a messy, full rhizome from a fixed seed (the same drawing every time), out from round the word, a knot at each tip. Box 130 x 180.
export function tileRhizome(): Rhizome {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const keep = (v: number, hi: number) => Math.round(Math.max(5, Math.min(hi - 5, v)) * 10) / 10;
  const shoots: Shoot[] = [];
  const knots: Array<[number, number]> = [];
  const grow = (x: number, y: number, angle: number, len: number, depth: number) => {
    const bend = angle + (rnd() - 0.5) * 1.8;
    const ex = keep(x + Math.cos(angle) * len + (rnd() - 0.5) * 10, 130), ey = keep(y + Math.sin(angle) * len * 1.35 + (rnd() - 0.5) * 12, 180);
    shoots.push({ d: `M${x} ${y} Q${keep(x + Math.cos(bend) * len * 0.6, 130)} ${keep(y + Math.sin(bend) * len * 0.8, 180)} ${ex} ${ey}`, depth });
    if (depth >= 2) { knots.push([ex, ey]); return; }
    grow(ex, ey, angle + (rnd() - 0.3) * 1.2, len * 0.85, depth + 1);
    if (rnd() < 0.7) grow(ex, ey, angle - 0.5 - rnd() * 0.8, len * 0.7, depth + 1);
  };
  for (let i = 0; i < 8; i += 1) grow(keep(65 + (rnd() - 0.5) * 36, 130), keep(90 + (rnd() - 0.5) * 24, 180), (i / 8) * Math.PI * 2 + rnd() * 0.6, 27, 0);
  return { shoots, knots };
}
