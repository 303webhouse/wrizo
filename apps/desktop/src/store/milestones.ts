import { getFramework } from './frameworks';
import { getJournalEntries, getJournalEntry, getStoryPlanByProjectId } from './persistence';
import type { Beat } from '../types';

// M1 — the milestone projection. A read-only projection of the Plan's beat
// coverage onto a writing surface (the circle-bar) — never a verdict, per
// docs/progress-milestones-canon.md. Pure selector: no writes anywhere in
// this module, confirmed by S0's substrate read (persistence.ts, 2026-07-13):
// `BeatNote.status` has a genuine terminal value ('complete'), `setBeatStatus`
// is Plan-side (StructureBoard's "Mark done" + QuickSprint's pre-existing
// finish-checkbox — both predate this canon and are untouched by it), and
// `JournalEntry.beatId` (J5's `attachToPlanBeat`) is the only "work attached"
// signal this module reads.

export type MilestoneState = 'empty' | 'kindled' | 'lit';

export interface MilestoneBeat {
  id: string;
  label: string;
  state: MilestoneState;
}

export interface Milestones {
  beats: MilestoneBeat[];
  windowed: boolean; // true when the container exceeded the cap and was trimmed
  // The StoryPlan's id — celebration tracking (WritingIncentives.tsx) scopes
  // its "already seen lit" memory by this, never by bare beat ids. Beat ids
  // are framework-authored strings (e.g. 'midpoint') shared verbatim by every
  // project on the same framework, so an unscoped id space would cross-talk
  // between projects the moment two of them pick the same framework.
  planId: string;
  // Every currently-lit beat in the FULL plan (unwindowed, un-containerized)
  // — distinct from `beats` (the capped/windowed display list). Celebration
  // baseline-seeding must read this, not `beats`: a beat that's already lit
  // but sits outside whichever window/anchor first renders this plan must
  // still be captured in the baseline, or it misfires as newly-lit the first
  // time a wider view (or a differently-anchored window) shows it.
  allLitBeatIds: string[];
}

const CAP = 12;

// Beats in framework-authored order — granularity follows the plan as
// authored (the pedagogue's ruling); never invent "chapters" the plan
// doesn't have.
function orderedBeats(beats: Beat[]): Beat[] {
  return [...beats].sort((a, b) => a.order - b.order);
}

// The container: beats sharing the anchor's act, if the framework uses acts
// (three_act does; story_circle/save_the_cat don't) — otherwise the whole
// flat plan (save_the_cat's 15 beats is the framework that actually exceeds
// CAP today, confirmed against packages/modules-writing/data/frameworks/).
function container(sorted: Beat[], anchor: Beat | null): Beat[] {
  const hasActs = sorted.some(b => b.act != null);
  if (hasActs && anchor?.act != null) return sorted.filter(b => b.act === anchor.act);
  return sorted;
}

// A window of at most CAP beats, centered on the anchor's position so "the
// chapter/act around you" always includes where the writer actually is —
// not just the container's first CAP entries, which could exclude the
// anchor entirely on a long flat plan.
function windowAround(beats: Beat[], anchorId: string | null): { beats: Beat[]; windowed: boolean } {
  if (beats.length <= CAP) return { beats, windowed: false };
  const anchorIdx = anchorId ? beats.findIndex(b => b.id === anchorId) : 0;
  const centerIdx = anchorIdx >= 0 ? anchorIdx : 0;
  let start = Math.max(0, centerIdx - Math.floor(CAP / 2));
  if (start + CAP > beats.length) start = beats.length - CAP;
  return { beats: beats.slice(start, start + CAP), windowed: true };
}

// The core projection, given a resolved project + an optional anchor beat
// (the page's own beatId, or the plan's currentBeatId as fallback — QuickSprint
// has no page/beatId of its own yet, so it anchors on currentBeatId directly).
export function milestonesForProject(projectId: string, anchorBeatId?: string | null): Milestones | null {
  const plan = getStoryPlanByProjectId(projectId);
  if (!plan) return null;
  const framework = getFramework(plan.frameworkId);
  if (!framework || framework.beats.length === 0) return null;

  const sorted = orderedBeats(framework.beats);
  const anchorId = anchorBeatId ?? plan.currentBeatId ?? sorted[0]?.id ?? null;
  const anchor = anchorId ? sorted.find(b => b.id === anchorId) ?? null : null;
  const inContainer = container(sorted, anchor);
  const { beats: windowedBeats, windowed } = windowAround(inContainer, anchorId);

  // "Kindled" = at least one page in this project is attached to the beat
  // via beatId (J5's attachToPlanBeat), and it isn't lit yet. One read of
  // all entries, filtered by project — cheap at this app's actual data
  // sizes; no per-beat re-scan.
  const projectEntries = getJournalEntries().filter(e => e.projectId === projectId);
  const beats: MilestoneBeat[] = windowedBeats.map(beat => {
    const note = plan.beatNotes.find(bn => bn.beatId === beat.id);
    const lit = note?.status === 'complete';
    const kindled = !lit && projectEntries.some(e => e.beatId === beat.id);
    return { id: beat.id, label: beat.name, state: lit ? 'lit' : kindled ? 'kindled' : 'empty' };
  });
  const allLitBeatIds = plan.beatNotes.filter(bn => bn.status === 'complete').map(bn => bn.beatId);

  return { beats, windowed, planId: plan.id, allLitBeatIds };
}

// The PageEditor-shaped entry point: a page names its own beat (if attached)
// via entry.beatId; absent that, the plan's currentBeatId anchors the window.
export function projectMilestones(pageId: string): Milestones | null {
  const entry = getJournalEntry(pageId);
  if (!entry?.projectId) return null;
  return milestonesForProject(entry.projectId, entry.beatId ?? null);
}
