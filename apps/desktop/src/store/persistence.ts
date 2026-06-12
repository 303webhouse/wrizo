import type { Project, StoryPlan, SessionLog } from '../types';

// ---------------------------------------------------------------------------
// Storage adapter (A2)
//
// Persistence is now a thin adapter over an in-memory cache:
//   - The cache is hydrated from localStorage once, at module init.
//   - Every getter reads the cache synchronously, so call sites stay unchanged
//     and no longer parse JSON on every read.
//   - Every setter mutates the cache, stamps `updatedAt` (and an id if new),
//     marks the record dirty for the future sync engine, and schedules a
//     coalesced localStorage write (~300ms) per collection.
//
// This is the local half of offline-first sync: the dirty registry and
// subscribe() exist for the sync engine (W2) and reactive screens, but no
// network code lives here.
// ---------------------------------------------------------------------------

const KEYS = {
  projects: 'writer-studio-projects',
  storyPlans: 'writer-studio-story-plans',
  sessions: 'writer-studio-sessions',
} as const;

type CollectionName = keyof typeof KEYS;

interface Cache {
  projects: Project[];
  storyPlans: StoryPlan[];
  sessions: SessionLog[];
}

function hydrate<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T[]) : [];
  } catch {
    // Corrupt or unavailable storage must never crash boot — start empty.
    return [];
  }
}

const cache: Cache = {
  projects: hydrate<Project>(KEYS.projects),
  storyPlans: hydrate<StoryPlan>(KEYS.storyPlans),
  sessions: hydrate<SessionLog>(KEYS.sessions),
};

// Records returned to callers are cloned so the cache is never mutated by
// reference, and so each read yields a fresh object (screens that re-fetch
// after a write and feed the result to setState rely on a new reference to
// re-render — this matches the previous JSON.parse-per-read behavior).
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// --- Dirty registry -------------------------------------------------------
// Ids of records changed locally since the last sync, tracked per collection.

const dirty: Record<CollectionName, Set<string>> = {
  projects: new Set(),
  storyPlans: new Set(),
  sessions: new Set(),
};

export interface DirtyRecords {
  projects: Project[];
  storyPlans: StoryPlan[];
  sessions: SessionLog[];
}

export function getDirtyRecords(): DirtyRecords {
  return {
    projects: cache.projects.filter(r => dirty.projects.has(r.id)).map(clone),
    storyPlans: cache.storyPlans.filter(r => dirty.storyPlans.has(r.id)).map(clone),
    sessions: cache.sessions.filter(r => dirty.sessions.has(r.id)).map(clone),
  };
}

export function markClean(ids: string[]): void {
  for (const id of ids) {
    dirty.projects.delete(id);
    dirty.storyPlans.delete(id);
    dirty.sessions.delete(id);
  }
}

// --- Subscriptions --------------------------------------------------------
// The sync engine and reactive screens subscribe to cache changes.

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  listeners.forEach(listener => {
    try {
      listener();
    } catch {
      // A misbehaving listener must never break a write path.
    }
  });
}

// --- Debounced writes -----------------------------------------------------
// One timer per collection. The first dirtying write in a window schedules a
// flush; further writes within that ~300ms window coalesce into it. This caps
// localStorage at ~3 writes/sec even under continuous typing while still
// guaranteeing words reach disk within 300ms (no debounce starvation).

const FLUSH_DELAY = 300;
const flushTimers: Record<CollectionName, ReturnType<typeof setTimeout> | null> = {
  projects: null,
  storyPlans: null,
  sessions: null,
};

function flush(name: CollectionName): void {
  try {
    localStorage.setItem(KEYS[name], JSON.stringify(cache[name]));
  } catch {
    // Storage full/unavailable — never throw into a write path.
  }
}

function scheduleFlush(name: CollectionName): void {
  if (flushTimers[name] !== null) return;
  flushTimers[name] = setTimeout(() => {
    flushTimers[name] = null;
    flush(name);
  }, FLUSH_DELAY);
}

// Generic upsert: stamp updatedAt, replace-or-insert in the cache, mark dirty,
// schedule a write, and notify subscribers.
function upsert<T extends { id: string; updatedAt: string }>(
  name: CollectionName,
  collection: T[],
  record: T,
): void {
  record.updatedAt = new Date().toISOString();
  const index = collection.findIndex(r => r.id === record.id);
  if (index >= 0) {
    collection[index] = record;
  } else {
    collection.push(record);
  }
  dirty[name].add(record.id);
  scheduleFlush(name);
  notify();
}

// --- Projects -------------------------------------------------------------

export function getProjects(): Project[] {
  return cache.projects.filter(p => !p.deletedAt).map(clone);
}

export function getProject(id: string): Project | null {
  const project = cache.projects.find(p => p.id === id);
  return project && !project.deletedAt ? clone(project) : null;
}

export function saveProject(project: Project): void {
  upsert('projects', cache.projects, clone(project));
}

export function createProject(title: string, type: 'creative' | 'academic'): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: generateId(),
    title,
    type,
    storyPlanId: null,
    createdAt: now,
    updatedAt: now,
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
  const iso = now.toISOString();
  const project: Project = {
    id: generateId(),
    title: title?.trim() || formatDefaultSprintTitle(now),
    type: 'creative',
    storyPlanId: null,
    sprintText,
    createdAt: iso,
    updatedAt: iso,
  };
  saveProject(project);
  return project;
}

export function setProjectSprintText(projectId: string, sprintText: string): void {
  const project = getProject(projectId);
  if (!project) return;

  project.sprintText = sprintText;
  saveProject(project);
}

// --- Story Plans ----------------------------------------------------------

export function getStoryPlans(): StoryPlan[] {
  return cache.storyPlans.map(clone);
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
    beatNote.status = notes.length > 0 ? 'started' : 'empty';
    saveStoryPlan(plan);
  }
}

export function setCurrentBeat(planId: string, beatId: string): void {
  const plan = getStoryPlan(planId);
  if (!plan) return;

  plan.currentBeatId = beatId;
  saveStoryPlan(plan);
}
