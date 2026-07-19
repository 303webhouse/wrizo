// TU1 S3 — Structure and Fragments: both reuse EXISTING data/derivations
// already available elsewhere in this codebase rather than re-deriving the
// same facts a second way (the brief's own instruction). Consistency lives
// in its own file (tutorConsistency.ts) — genuinely new logic, no direct
// precedent. Both lenses here recompute fresh on every call; nothing is
// stored (S1's own law).
import type { JournalEntry, Project } from '../types';
import { describePageHome } from './pageHome';
import { getBoardsPinning, getStoryPlanByProjectId, getJournalEntries } from './persistence';
import { getFramework } from './frameworks';

// --- Structure --------------------------------------------------------
// "Where this page sits: its home, its memberships (getBoardsPinning), its
// linked beat if any. Read-only, M1's coverage-never-verdicts" — every
// fact here is read straight off existing helpers (describePageHome,
// getBoardsPinning, the StoryPlan/Framework pair already used by the Plan
// surface), never a verdict on whether the page's placement is "good."
export interface StructureFacts {
  homeLabel: string;
  memberships: string[];
  linkedBeatName: string | null;
}

export function computeStructureFacts(entry: JournalEntry, project: Project | null): StructureFacts {
  const pinnedBoardTitles = getBoardsPinning(entry.id).map(b => b.title);
  const { homeLabel, memberships } = describePageHome(entry, project, pinnedBoardTitles);

  let linkedBeatName: string | null = null;
  if (entry.beatId && project) {
    const plan = getStoryPlanByProjectId(project.id);
    const framework = plan ? getFramework(plan.frameworkId) : null;
    const beat = framework?.beats.find(b => b.id === entry.beatId);
    if (beat) linkedBeatName = beat.name;
  }

  return { homeLabel, memberships, linkedBeatName };
}

// --- Fragments ----------------------------------------------------------
// "The writer's own recent captures and starred pages sharing a tag with
// this page, resurfaced. Recency + tags only; say so plainly in the
// panel's own copy" — the panel's own copy carries that plain-simplicity
// disclosure (Tutor.tsx); this function only computes the two groups.
export interface FragmentItem {
  id: string;
  title: string;
  reason: 'recent-capture' | 'starred-tag';
}

const RECENT_CAPTURE_LIMIT = 5;

// Exported — S4's nudges (tutorNudges.ts) reuse this exact title-reading
// convention rather than re-deriving it a second way.
export function titleOf(e: JournalEntry): string {
  const line = e.text.trim().split('\n')[0]?.trim();
  return line ? line.slice(0, 60) : 'Untitled';
}

export function computeFragmentItems(entry: JournalEntry): FragmentItem[] {
  // getJournalEntries() — every non-deleted entry, newest (createdAt) first.
  const all = getJournalEntries();
  const items: FragmentItem[] = [];
  const seen = new Set<string>([entry.id]);

  // Recent captures: the writer's own captures (source !== 'page' — an
  // authored page is not a "capture"), most recent first.
  const captures = all.filter(e => e.source !== 'page');
  for (const c of captures.slice(0, RECENT_CAPTURE_LIMIT)) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    items.push({ id: c.id, title: titleOf(c), reason: 'recent-capture' });
  }

  // Starred pages sharing any tag with this page.
  const myTags = new Set(entry.tags ?? []);
  if (myTags.size > 0) {
    for (const s of all) {
      if (!s.starred) continue;
      if (!(s.tags ?? []).some(t => myTags.has(t))) continue;
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      items.push({ id: s.id, title: titleOf(s), reason: 'starred-tag' });
    }
  }

  return items;
}
