import type { Box, JournalEntry } from '../../types';
import { getJournalEntry, getProject, isAutoSet } from '../../store/persistence';
import { cache } from '../../store/persistence/core';
import { liveBoxes } from '../../store/boxTombstones';
import { firstLine } from '../../store/entryText';
import { walkPlaceOf } from '../docSettings';
import { docOfPage, partOfRow } from '../backMenu/planPart';
import { walkSteps, type WalkStep } from './stepModel';

// WHAT THE WALK READS (PRESETS-B, Nov 25): a page's own Plan board, read from the store's cache (never cloned on a keystroke), and where she has a walk to continue. Reads only.

const live = (id: string | null | undefined): JournalEntry | undefined => (id ? cache.journalEntries.find((e) => e.id === id && !e.deletedAt) : undefined);

export interface PlanOfPage { boardId: string | null; board: JournalEntry | undefined; hiddenKey: string }
export function planOfPage(pageId: string): PlanOfPage {
  const page = live(pageId);
  const board = live(page?.planBoardId);
  return { boardId: board ? board.id : null, board, hiddenKey: (page?.pageSettings?.hiddenPlanCards ?? []).join(',') };
}

export function stepsOfPage(pageId: string, plan: PlanOfPage = planOfPage(pageId)): WalkStep[] {
  const doc = docOfPage(pageId);
  const hidden = new Set(plan.hiddenKey ? plan.hiddenKey.split(',') : []);
  return walkSteps(liveBoxes(plan.board?.boxes) as Box[], hidden, (boxId) => !!partOfRow(plan.boardId, boxId, doc)?.written);
}

/** The Doc's name as the walk's head shows it: the set she made, else the page's first line, else ''. */
export function docNameOf(pageId: string): string {
  const e = getJournalEntry(pageId);
  if (!e) return '';
  const set = e.projectId ? getProject(e.projectId) : null;
  if (set && !isAutoSet(set)) return set.title;
  return firstLine(e.text ?? '').slice(0, 60);
}

export interface WalkToContinue { pageId: string; doc: string; step: WalkStep; total: number; changed: string }
/** Every Doc with a saved place whose step is still a step of one of its pages' Plans, the most recently worked first. */
export function walksToContinue(): WalkToContinue[] {
  const out: WalkToContinue[] = [];
  const seen = new Set<string>();
  for (const page of cache.journalEntries) {
    if (page.deletedAt || page.purgedAt || !page.planBoardId) continue;
    const place = walkPlaceOf(page.id);
    if (!place) continue;
    const plan = planOfPage(page.id);
    if (!plan.board || !liveBoxes(plan.board.boxes).some((b) => b.id === place)) continue;
    const key = `${docOfPage(page.id) ?? page.id}|${place}`;
    if (seen.has(key)) continue;
    const steps = stepsOfPage(page.id, plan);
    const step = steps.find((s) => s.id === place);
    if (!step) continue;
    seen.add(key);
    out.push({ pageId: page.id, doc: docNameOf(page.id), step, total: steps.length, changed: plan.board.updatedAt });
  }
  return out.sort((a, b) => b.changed.localeCompare(a.changed));
}
