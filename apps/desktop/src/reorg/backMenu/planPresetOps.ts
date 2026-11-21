import type { Box } from '../../types';
import type { DeskTermId } from '../../store/lexicon/terms';
import { boardStructure, isCardBox } from '../../store/boardStructure';
import { liveBoxes } from '../../store/boxTombstones';
import type { PlanPreset } from './planPresets';

// FILLING THE PLAN FROM A PRESET (the Plan tab's Presets, Nov 20; plan-presets-draft.md). Pure: a preset's rows become ordinary Plan cards on the Page's own board, appended below what is
// there (nothing she wrote is moved, renamed or removed: a preset is a starting shape, and she can rename, drop, add and re-order every row). Each card is the same shape addPlanRow makes (a text card,
// its title the only text), indented through `parentId` and ordered through `seq` exactly as the Plan's own Indent does, so the board's Outline view shows the same tree. The prompt rides in `planHint`
// (types/board.ts), never in `text`.
const stampNow = (): string => new Date().toISOString();

/** The boards' boxes with the preset appended (`next`, not `boxes`: box-tombstones T11 counts every raw `.boxes` read, and this is the caller's own list plus new cards, not a stored entry), and the ids of the rows that lead others (the Acts), so the Plan can fold them closed. */
export function presetBoxes(boxes: Box[], preset: PlanPreset, t: (k: DeskTermId) => string, newId: () => string): { next: Box[]; leaders: string[] } {
  const cards = liveBoxes(boxes).filter(isCardBox);
  const maxZ = boxes.reduce((m, b) => Math.max(m, b.z), 0);
  const seqs = cards.map((c) => c.seq).filter((n): n is number => typeof n === 'number');
  const top = boardStructure(liveBoxes(boxes)).lanes[0]?.items ?? [];
  let seq = Math.max(seqs.length ? Math.max(...seqs) : -1, top.length - 1) + 1;
  let y = cards.reduce((m, c) => Math.max(m, c.y + c.h), 0.05) + 0.02;
  const now = stampNow();
  const made: Box[] = [];
  const leaders: string[] = [];
  let parent: string | undefined;
  preset.rows.forEach((row, i) => {
    const id = newId();
    const hint = row.prompt ? t(row.prompt) : '';
    const card: Box = {
      id, kind: 'text', x: row.depth ? 0.4 : 0.05, y, w: 0.3, h: 0.12, z: maxZ + 1 + i, text: t(row.title), seq, updatedAt: now,
      ...(row.depth && parent ? { parentId: parent } : {}),
      ...(hint ? { planHint: hint } : {}),
    };
    if (!row.depth) { parent = id; if (preset.rows[i + 1]?.depth) leaders.push(id); }
    made.push(card);
    seq += 1;
    y += 0.14;
  });
  return { next: boxes.concat(made), leaders };
}
