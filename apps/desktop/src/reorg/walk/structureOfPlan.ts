import type { Box } from '../../types';
import type { DeskTermId } from '../../store/lexicon/terms';
import { liveBoxes } from '../../store/boxTombstones';
import { splitOutlineText } from '../../store/outlineRow';
import { PLAN_PRESETS, type PlanPreset } from '../backMenu/planPresets';

// WHICH STRUCTURE A PLAN CAME FROM, worked out from its rows' names and never stored (nothing new is saved): the preset most of whose headings and steps are still named on the board. She may rename, drop and add rows,
// so most is enough; a Plan of her own names is none. It chooses the note behind a step's "?" and, in Flux, the structure's name on the Continue row. Pure.

/** The share of a preset's rows that must still be on the board. */
const ENOUGH = 0.6;

export function structureOfPlan(boxes: readonly Box[] | undefined | null, t: (k: DeskTermId) => string): PlanPreset | null {
  const names = new Set(liveBoxes(boxes).filter((b) => b.kind === 'text').map((b) => splitOutlineText(b.text).title.trim()));
  let best: PlanPreset | null = null;
  let score = 0;
  for (const preset of PLAN_PRESETS) {
    const share = preset.rows.filter((r) => names.has(t(r.title))).length / preset.rows.length;
    if (share > score) { best = preset; score = share; }
  }
  return score >= ENOUGH ? best : null;
}
