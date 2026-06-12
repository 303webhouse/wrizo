import type { Project } from '../types';
import { getProjects, getStoryPlanByProjectId } from './persistence';
import { getFramework } from './frameworks';

// Resume data layer (A3). The launcher (D3) uses this to offer one-tap return
// to the exact screen the writer left, showing the true last line they wrote.

export interface ResumeTarget {
  project: Project;
  route: string;
  label: string | null; // current beat name, for "Next: {label}"
  lastLine: string | null;
  daysAgo: number;
}

function effectiveActivity(p: Project): number {
  return new Date(p.lastActivityAt || p.updatedAt).getTime();
}

export function getResumeTarget(): ResumeTarget | null {
  const projects = getProjects();
  if (projects.length === 0) return null;

  const project = [...projects].sort((a, b) => effectiveActivity(b) - effectiveActivity(a))[0];

  // Last non-empty line of the sprint draft.
  const sprintLines = (project.sprintText || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  const sprintLastLine = sprintLines.length ? sprintLines[sprintLines.length - 1] : null;

  // Current beat name + its last bullet (fallback for lastLine).
  const plan = getStoryPlanByProjectId(project.id);
  let beatName: string | null = null;
  let beatLastLine: string | null = null;
  if (plan) {
    const framework = getFramework(plan.frameworkId);
    const beat = framework?.beats.find(b => b.id === plan.currentBeatId) || null;
    beatName = beat?.name ?? null;
    const note = plan.beatNotes.find(bn => bn.beatId === plan.currentBeatId);
    if (note && note.notes.length > 0) beatLastLine = note.notes[note.notes.length - 1];
  }

  const hasSprint = !!project.sprintText?.trim();
  const route = hasSprint
    ? `/project/${project.id}/sprint`
    : plan
      ? `/project/${project.id}/beat`
      : `/project/${project.id}`;

  const lastLine = sprintLastLine ?? beatLastLine ?? null;

  const ms = Date.now() - effectiveActivity(project);
  const daysAgo = Math.max(0, Math.floor(ms / 86_400_000));

  return { project, route, label: beatName, lastLine, daysAgo };
}

// "today" / "yesterday" / "3 days ago" — calm relative time.
export function relativeDays(daysAgo: number): string {
  if (daysAgo <= 0) return 'today';
  if (daysAgo === 1) return 'yesterday';
  return `${daysAgo} days ago`;
}
