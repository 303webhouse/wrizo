import type { DeskTermId } from '../../store/lexicon/terms';
import { generateId, getJournalEntry, saveBoardBoxes } from '../../store/persistence';
import { getOrCreatePlanBoard } from '../../store/persistence/planPairing';
import { liveBoxes } from '../../store/boxTombstones';
import type { PlanPreset } from './planPresets';
import { presetBoxes } from './planPresetOps';

// THE LIVE PLAN PRESETS LOADER (the Back menu's PLAN tab, BackPlan.tsx's `fill`, moved here so the Guide's Start loads a structure through the SAME act and not a copy). A Page's own board is born the first time something is put on it; the preset's
// rows are appended below what is there as ordinary Plan cards (presetBoxes: nothing she wrote moves) and saved through the store's own write boundary for a board (saveBoardBoxes), so they sync like every other edit of a board.
// Returns the ids of the rows that lead others (the Acts, which the Plan folds closed), or null when the page has no board to put them on (an unborn page, or a board).
export function loadPlanPreset(pageId: string, preset: PlanPreset, t: (k: DeskTermId) => string): { leaders: string[] } | null {
  const board = getOrCreatePlanBoard(pageId);
  if (!board) return null;
  const made = presetBoxes(liveBoxes(getJournalEntry(board.id)?.boxes ?? board.boxes), preset, t, generateId);
  saveBoardBoxes(board.id, made.next);
  return { leaders: made.leaders };
}
