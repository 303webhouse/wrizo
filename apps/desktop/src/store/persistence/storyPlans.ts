import type { StoryPlan, BeatNote } from '../../types';
import { cache, clone, generateId, upsert } from './core';
import { getProject, saveProject, stampBeatActivity } from './projects';

// --- Story Plans ----------------------------------------------------------

export function getStoryPlans(): StoryPlan[] {
  return cache.storyPlans.filter(p => !p.purgedAt).map(clone);   // DELETE FOR GOOD: a shell is no plan
}

export function getStoryPlan(id: string): StoryPlan | null {
  const plan = cache.storyPlans.find(p => p.id === id);
  return plan ? clone(plan) : null;
}

export function getStoryPlanByProjectId(projectId: string): StoryPlan | null {
  const plan = cache.storyPlans.find(p => p.projectId === projectId);
  return plan ? clone(plan) : null;
}

export function saveStoryPlan(plan: StoryPlan): void {
  upsert('storyPlans', cache.storyPlans, clone(plan));
}

export function createStoryPlan(projectId: string, frameworkId: string, beatIds: string[]): StoryPlan {
  const now = new Date().toISOString();
  const plan: StoryPlan = {
    id: generateId(),
    projectId,
    frameworkId,
    beatNotes: beatIds.map(beatId => ({
      beatId,
      notes: [],
      status: 'empty' as const,
    })),
    currentBeatId: beatIds[0] || null,
    createdAt: now,
    updatedAt: now,
  };
  saveStoryPlan(plan);

  // Update project with story plan ID
  const project = getProject(projectId);
  if (project) {
    project.storyPlanId = plan.id;
    saveProject(project);
  }

  return plan;
}

export function updateBeatNotes(planId: string, beatId: string, notes: string[]): void {
  const plan = getStoryPlan(planId);
  if (!plan) return;

  const beatNote = plan.beatNotes.find(bn => bn.beatId === beatId);
  if (beatNote) {
    beatNote.notes = notes;
    // A5: never downgrade a completed beat when its notes change.
    if (beatNote.status !== 'complete') {
      beatNote.status = notes.length > 0 ? 'started' : 'empty';
    }
    saveStoryPlan(plan);
    stampBeatActivity(plan.projectId);
  }
}

// Set a beat's status directly (A4 finish checkbox, A5 Board toggle).
export function setBeatStatus(planId: string, beatId: string, status: BeatNote['status']): void {
  const plan = getStoryPlan(planId);
  if (!plan) return;
  const beatNote = plan.beatNotes.find(bn => bn.beatId === beatId);
  if (!beatNote) return;
  beatNote.status = status;
  saveStoryPlan(plan);
  stampBeatActivity(plan.projectId);
}

export function setCurrentBeat(planId: string, beatId: string): void {
  const plan = getStoryPlan(planId);
  if (!plan) return;

  plan.currentBeatId = beatId;
  saveStoryPlan(plan);
}
