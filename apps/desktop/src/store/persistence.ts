import type { Project, StoryPlan } from '../types';

const PROJECTS_KEY = 'writer-studio-projects';
const STORY_PLANS_KEY = 'writer-studio-story-plans';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Projects
export function getProjects(): Project[] {
  const data = localStorage.getItem(PROJECTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getProject(id: string): Project | null {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function createProject(title: string, type: 'creative' | 'academic'): Project {
  const project: Project = {
    id: generateId(),
    title,
    type,
    storyPlanId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveProject(project);
  return project;
}

function formatDefaultSprintTitle(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `Untitled ${year}-${month}-${day} ${hours}${minutes}`;
}

export function createQuickSprintProject(sprintText: string, title?: string): Project {
  const now = new Date();
  const project: Project = {
    id: generateId(),
    title: title?.trim() || formatDefaultSprintTitle(now),
    type: 'creative',
    storyPlanId: null,
    sprintText,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  saveProject(project);
  return project;
}

export function setProjectSprintText(projectId: string, sprintText: string): void {
  const project = getProject(projectId);
  if (!project) return;

  project.sprintText = sprintText;
  project.updatedAt = new Date().toISOString();
  saveProject(project);
}

// Story Plans
export function getStoryPlans(): StoryPlan[] {
  const data = localStorage.getItem(STORY_PLANS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getStoryPlan(id: string): StoryPlan | null {
  const plans = getStoryPlans();
  return plans.find(p => p.id === id) || null;
}

export function getStoryPlanByProjectId(projectId: string): StoryPlan | null {
  const plans = getStoryPlans();
  return plans.find(p => p.projectId === projectId) || null;
}

export function saveStoryPlan(plan: StoryPlan): void {
  const plans = getStoryPlans();
  const index = plans.findIndex(p => p.id === plan.id);
  if (index >= 0) {
    plans[index] = plan;
  } else {
    plans.push(plan);
  }
  localStorage.setItem(STORY_PLANS_KEY, JSON.stringify(plans));
}

export function createStoryPlan(projectId: string, frameworkId: string, beatIds: string[]): StoryPlan {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveStoryPlan(plan);

  // Update project with story plan ID
  const project = getProject(projectId);
  if (project) {
    project.storyPlanId = plan.id;
    project.updatedAt = new Date().toISOString();
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
    beatNote.status = notes.length > 0 ? 'started' : 'empty';
    plan.updatedAt = new Date().toISOString();
    saveStoryPlan(plan);
  }
}

export function setCurrentBeat(planId: string, beatId: string): void {
  const plan = getStoryPlan(planId);
  if (!plan) return;

  plan.currentBeatId = beatId;
  plan.updatedAt = new Date().toISOString();
  saveStoryPlan(plan);
}
