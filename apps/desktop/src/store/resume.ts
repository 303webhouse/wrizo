import type { Project, JournalEntry, BinderKind } from '../types';
import {
  getProjects, getJournalEntries, getJournalEntry, getProject,
  getBinderPages, getStoryPlanByProjectId,
} from './persistence';
import { getFramework } from './frameworks';

// Resume data layer (A3 → F1). The typed resume pointer: the target is the most
// recently edited writing surface, whatever it is — a binder Page (any pageType),
// a loose journal page, a shelf page, or a legacy sprint body — and the pointer
// carries `kind` + `pageType` + `home` so any surface can render from the writer's
// own trail. F2's return card is built on this substrate.

export type ResumeHome = 'binder' | 'journal' | 'shelf';

export interface ResumeTarget {
  route: string;
  home: ResumeHome;
  kind?: BinderKind;
  pageType?: JournalEntry['pageType'];
  project?: Project;
  entry?: JournalEntry;
  label: string | null;   // current beat name, for a legacy plan
  lastLine: string | null;
  daysAgo: number;
}

function lastNonEmptyLine(text: string | undefined | null): string | null {
  const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1] : null;
}

function daysFrom(ms: number): number {
  return Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
}

// A journal entry as a surface: binder Page / loose journal / shelf page. Typed
// binder pages open in the mode-aware editor (/page/:id); everything else — untyped
// filed pages (ink!), loose + shelf pages — opens the ink-authored view.
function fromEntry(e: JournalEntry, at: number): ResumeTarget {
  const inBinder = e.projectId != null;
  const shelved = !inBinder && !!e.shelved;
  const home: ResumeHome = inBinder ? 'binder' : shelved ? 'shelf' : 'journal';
  const project = inBinder ? (getProject(e.projectId as string) ?? undefined) : undefined;
  // Route by pageType (matches JournalEntry's redirect, so no bounce): a typed page
  // is owned by the mode-aware editor wherever it lives; untyped stays the ink view.
  const route = e.pageType != null ? `/page/${e.id}` : `/journal/${e.id}`;
  return {
    route,
    home,
    kind: project?.kind,
    pageType: e.pageType,
    project,
    entry: e,
    label: null,
    lastLine: lastNonEmptyLine(e.text),
    daysAgo: daysFrom(at),
  };
}

// A project as a surface: resolve its Page pointer (F1) with a stale guard, or
// fall back to the legacy sprint/overview.
function fromProject(p: Project, at: number): ResumeTarget {
  if (p.lastActivityType === 'page') {
    // The pointer must resolve to a live entry still parented to this project
    // (pages move homes via setPageHome). Else the newest remaining binder page,
    // else the project overview.
    let page: JournalEntry | null = p.lastActivePageId ? getJournalEntry(p.lastActivePageId) : null;
    if (!page || page.deletedAt || page.projectId !== p.id) {
      page = getBinderPages(p.id)[0] ?? null; // getBinderPages: non-deleted, newest-first
    }
    if (page) return fromEntry(page, at);
    return { route: `/project/${p.id}`, home: 'binder', kind: p.kind, project: p, label: null, lastLine: null, daysAgo: daysFrom(at) };
  }

  // Legacy sprint/beat body → the project overview (Change 4), with its last line.
  const plan = getStoryPlanByProjectId(p.id);
  let label: string | null = null;
  let beatLine: string | null = null;
  if (plan) {
    const fw = getFramework(plan.frameworkId);
    const beat = fw?.beats.find(b => b.id === plan.currentBeatId) || null;
    label = beat?.name ?? null;
    const note = plan.beatNotes.find(bn => bn.beatId === plan.currentBeatId);
    if (note && note.notes.length > 0) beatLine = note.notes[note.notes.length - 1];
  }
  return {
    route: `/project/${p.id}`,
    home: 'binder',
    kind: p.kind,
    project: p,
    label,
    lastLine: lastNonEmptyLine(p.sprintText) ?? beatLine,
    daysAgo: daysFrom(at),
  };
}

// The typed resume target — one recency race across every writing surface.
export function getResumeTarget(): ResumeTarget | null {
  const projects = getProjects();          // non-deleted
  const entries = getJournalEntries();     // non-deleted (binder + loose + shelf)

  interface Cand { at: number; build: () => ResumeTarget }
  const cands: Cand[] = [];

  // Projects (binder pointer / legacy sprint). Also catches pre-F1 binder pages
  // via the direct entry candidates below.
  for (const p of projects) {
    const at = new Date(p.lastActivityAt || p.updatedAt).getTime();
    cands.push({ at, build: () => fromProject(p, at) });
  }
  // Every journal entry as its own surface (binder page uses entry.updatedAt).
  for (const e of entries) {
    const at = new Date(e.updatedAt).getTime();
    cands.push({ at, build: () => fromEntry(e, at) });
  }

  if (cands.length === 0) return null;
  cands.sort((a, b) => b.at - a.at); // newest wins (projects pushed first → win ties)
  return cands[0].build();
}

// Test/inspection seam — the resolved resume target on demand.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoResume?: unknown }).wrizoResume = getResumeTarget;
}

// "today" / "yesterday" / "3 days ago" — calm relative time.
export function relativeDays(daysAgo: number): string {
  if (daysAgo <= 0) return 'today';
  if (daysAgo === 1) return 'yesterday';
  return `${daysAgo} days ago`;
}
