import type { Box, TextMark } from '../../types';
import { liveBoxes } from '../../store/boxTombstones';
import { splitOutlineText } from '../../store/outlineRow';
import { planRows } from '../backMenu/planOps';

// THE GUIDE AS A WALK, ITS PURE MODEL (PRESETS-B, Nov 25; Fable 7:10 pm; the Wrizors' guide-walk frames). THE PLAN IS THE PROGRESS: the steps are the Plan's own rows, read each time, never copied. A row with rows under it
// is a heading (an Act); every other text row is a step. NOTED = her note on the row (the card's text under its name) OR words in its Part; SKIPPED = her saved mark, and only while it is not noted; else EMPTY.
// No store, no React: the same cards give the same steps.

export type StepState = 'noted' | 'skipped' | 'empty';
export interface WalkStep {
  id: string;
  /** 1.. among the steps */
  number: number;
  title: string;
  /** her note: the card's text after its first line */
  note: string;
  /** the marks on her note, as offsets into the note */
  marks: TextMark[];
  /** the preset's grey prompt, or '' */
  hint: string;
  /** the heading it stands under, or '' */
  act: string;
  state: StepState;
}

/** The marks of a card's note, moved from offsets into the whole text to offsets into the note. */
export function noteMarks(box: Pick<Box, 'text' | 'textMarks'>): TextMark[] {
  const { title, body } = splitOutlineText(box.text);
  const from = title.length + 1;
  return (box.textMarks ?? [])
    .map((m) => ({ ...m, start: Math.max(0, m.start - from), end: Math.min(body.length, m.end - from) }))
    .filter((m) => m.end > m.start);
}

export function walkSteps(boxes: readonly Box[] | undefined | null, hidden: ReadonlySet<string>, written: (boxId: string) => boolean): WalkStep[] {
  const byId = new Map(liveBoxes(boxes).map((b) => [b.id, b]));
  const out: WalkStep[] = [];
  let act = '';
  for (const r of planRows(boxes, hidden)) {
    if (r.depth === 0) act = r.underIds.length > 1 ? r.title : '';
    const box = byId.get(r.boxId);
    if (!box || r.underIds.length > 1 || r.isPin || r.isInk) continue;
    const noted = !!r.body.trim() || written(r.boxId);
    out.push({
      id: r.boxId, number: out.length + 1, title: r.title, note: r.body, marks: noteMarks(box), hint: r.hint, act,
      state: noted ? 'noted' : box.planSkipped ? 'skipped' : 'empty',
    });
  }
  return out;
}

/** Where she is: her saved step if it is still a step, else the first one not noted, else the first. */
export function placeIn(steps: readonly WalkStep[], savedId: string | null | undefined): string | null {
  const saved = steps.find((s) => s.id === savedId);
  if (saved) return saved.id;
  return (steps.find((s) => s.state !== 'noted') ?? steps[0])?.id ?? null;
}

/** The place after a step is dropped: the next step, or the one before it when it was the last. `steps` is the list BEFORE the drop. */
export function placeAfterDrop(steps: readonly WalkStep[], droppedId: string): string | null {
  const at = steps.findIndex((s) => s.id === droppedId);
  if (at < 0) return placeIn(steps, null);
  return (steps[at + 1] ?? steps[at - 1])?.id ?? null;
}

export interface WalkSummary { total: number; noted: number; skipped: WalkStep[]; empty: WalkStep[]; /** the first step not noted, or null */ next: string | null }
export function walkSummary(steps: readonly WalkStep[]): WalkSummary {
  return {
    total: steps.length,
    noted: steps.filter((s) => s.state === 'noted').length,
    skipped: steps.filter((s) => s.state === 'skipped'),
    empty: steps.filter((s) => s.state === 'empty'),
    next: steps.find((s) => s.state !== 'noted')?.id ?? null,
  };
}
