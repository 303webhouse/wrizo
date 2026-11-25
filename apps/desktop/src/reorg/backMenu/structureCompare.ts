import type { DeskTermId } from '../../store/lexicon/terms';
import { PLAN_PRESETS, type PlanPreset, type PlanPresetId } from './planPresets';

// COMPARE STRUCTURES, ITS PURE HALF (PRESETS-B item 18, Nov 25; the defaults are PRESETS-B's own and the words are PROPOSED). At the foot of the PLAN tab's Presets list: two structures side by side, so a writer choosing between Three-Act and the Hero's Journey
// (or Story Circle and Seven-Point) can see their headings, their size and what they share BEFORE she loads one. It is a VIEW: it reads planPresets.ts and writes nothing; loading is the list's own press (the same `onPick`). No React, no storage, no network.

/** The pair it opens on (the two structures most writers weigh first: the live Three-Act and the Hero's Journey). */
export const DEFAULT_PAIR: readonly [PlanPresetId, PlanPresetId] = ['three', 'hero'];

export interface StructureShape {
  /** every row, headings and steps alike */
  rows: number;
  /** the rows that lead others (the Acts); 0 for a flat structure */
  groups: number;
  /** the rows that carry a step and not a group */
  steps: number;
}
/** A structure's size: its rows, its Acts (a depth-0 row that the next row sits under), and its steps. */
export function shapeOf(p: PlanPreset): StructureShape {
  const groups = p.rows.filter((r, i) => r.depth === 0 && p.rows[i + 1]?.depth === 1).length;
  return { rows: p.rows.length, groups, steps: p.rows.length - groups };
}

const norm = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, ' ');
/** The headings two structures have in common (matched on the words a writer reads, not the keys), in the first one's order, each once, in the first one's spelling. */
export function sharedTitles(a: PlanPreset, b: PlanPreset, t: (k: DeskTermId) => string): string[] {
  const inB = new Set(b.rows.map((r) => norm(t(r.title))));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of a.rows) {
    const w = t(r.title), k = norm(w);
    if (inB.has(k) && !seen.has(k)) { seen.add(k); out.push(w); }
  }
  return out;
}

/** The structure for an id, or the first one in the app when the id is not there (a list that lost a structure never leaves a column empty). */
export function structureFor(id: string | null | undefined, list: readonly PlanPreset[] = PLAN_PRESETS): PlanPreset {
  return list.find((p) => p.id === id) ?? list[0];
}
/** The pair to open on, against the structures that are in the app: the defaults where both are, else the first two. */
export function openingPair(list: readonly PlanPreset[] = PLAN_PRESETS): [PlanPreset, PlanPreset] {
  const [a, b] = DEFAULT_PAIR.map((id) => list.find((p) => p.id === id));
  if (a && b) return [a, b];
  return [list[0], list[1] ?? list[0]];
}
