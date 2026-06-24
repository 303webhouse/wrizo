import type { Project, StoryPlan, SessionLog, Draft, BeatNote, JournalEntry, Fragment, FragmentLink } from '../types';

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
  drafts: 'writer-studio-drafts',
  journalEntries: 'writer-studio-journal-entries',
} as const;

type CollectionName = keyof typeof KEYS;

interface Cache {
  projects: Project[];
  storyPlans: StoryPlan[];
  sessions: SessionLog[];
  drafts: Draft[];
  journalEntries: JournalEntry[];
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
  drafts: hydrate<Draft>(KEYS.drafts),
  journalEntries: hydrate<JournalEntry>(KEYS.journalEntries),
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
  drafts: new Set(),
  journalEntries: new Set(),
};

export interface DirtyRecords {
  projects: Project[];
  storyPlans: StoryPlan[];
  sessions: SessionLog[];
  drafts: Draft[];
  journalEntries: JournalEntry[];
}

export function getDirtyRecords(): DirtyRecords {
  return {
    projects: cache.projects.filter(r => dirty.projects.has(r.id)).map(clone),
    storyPlans: cache.storyPlans.filter(r => dirty.storyPlans.has(r.id)).map(clone),
    sessions: cache.sessions.filter(r => dirty.sessions.has(r.id)).map(clone),
    drafts: cache.drafts.filter(r => dirty.drafts.has(r.id)).map(clone),
    journalEntries: cache.journalEntries.filter(r => dirty.journalEntries.has(r.id)).map(clone),
  };
}

export function markClean(ids: string[]): void {
  for (const id of ids) {
    dirty.projects.delete(id);
    dirty.storyPlans.delete(id);
    dirty.sessions.delete(id);
    dirty.drafts.delete(id);
    dirty.journalEntries.delete(id);
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
  drafts: null,
  journalEntries: null,
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

// Force every pending debounced write to localStorage synchronously. Call this
// when the page is about to be torn down (tab hide, route change) — a scheduled
// 300ms write would otherwise be lost if the page dies first. localStorage
// writes are synchronous, so the data is durable before the handler returns.
export function flushNow(): void {
  (Object.keys(KEYS) as CollectionName[]).forEach(name => {
    if (flushTimers[name] !== null) {
      clearTimeout(flushTimers[name]!);
      flushTimers[name] = null;
    }
    flush(name);
  });
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
    lastActivityAt: iso,
    lastActivityType: 'sprint',
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
  project.lastActivityAt = new Date().toISOString();
  project.lastActivityType = 'sprint';
  saveProject(project);
}

// Stamp a project's resume pointer (A3). Called when its beat notes change.
function stampBeatActivity(projectId: string): void {
  const project = getProject(projectId);
  if (!project) return;
  project.lastActivityAt = new Date().toISOString();
  project.lastActivityType = 'beat';
  saveProject(project);
}

// --- Fragments (DM1) ------------------------------------------------------
// The fragment substrate: creative writing as a rhizome (spine + branches +
// loose fragments + link graph), with forward-only enforced HERE. The ONLY
// mutations are non-destructive: append text, strike/unstrike a run, create a
// fragment, reorder the spine, link fragments, set a role. There is NO delete,
// NO run removal, NO in-place text edit — by design, and nothing may add one.
//
// `fragments` lives on the Project record, so it rides the existing
// whole-record cache/queue/sync exactly as strokes do — no sync changes. On
// every mutation we recompute Project.sprintText from the unstruck spine so the
// existing UI (ProjectHome preview, QuickSprint init, JournalEntry routing) and
// the server's sprint_text column keep working untouched: fragments are the
// source of truth; sprintText is a derived cache.

// Derived prose: concat the unstruck runs of the spine fragments in spineOrder.
// This is the exact inverse of the migration split, so a migrated project round-
// trips to its original sprintText.
export function sprintTextOf(project: Project): string {
  return (project.fragments ?? [])
    .filter(f => f.role === 'spine')
    .slice()
    .sort((a, b) => (a.spineOrder ?? 0) - (b.spineOrder ?? 0))
    .map(f => f.content.filter(r => !r.struck).map(r => r.text).join(''))
    .join('\n\n');
}

// Build fragments from a legacy sprintText: split on blank lines into one spine
// fragment per paragraph, in order, each a single unstruck run. split('\n\n') /
// join('\n\n') are perfect inverses, so sprintTextOf reproduces the original.
function migrateFragments(projectId: string, sprintText: string): Fragment[] {
  const now = new Date().toISOString();
  return (sprintText ?? '').split('\n\n').map((text, i) => ({
    id: generateId(),
    projectId,
    content: [{ text, struck: false }],
    role: 'spine' as const,
    spineOrder: i,
    links: [],
    createdAt: now,
    updatedAt: now,
  }));
}

// Next free spine index (append to the end of the spine).
function nextSpineOrder(fragments: Fragment[]): number {
  const orders = fragments
    .filter(f => f.role === 'spine' && typeof f.spineOrder === 'number')
    .map(f => f.spineOrder as number);
  return orders.length ? Math.max(...orders) + 1 : 0;
}

// Locate the (live, non-deleted) project that owns a fragment.
function projectIdOfFragment(fragmentId: string): string | null {
  const p = cache.projects.find(pr => !pr.deletedAt && (pr.fragments ?? []).some(f => f.id === fragmentId));
  return p ? p.id : null;
}

// Persist a project after a fragment mutation, refreshing the derived mirror.
// Centralizes the "fragments = source of truth, sprintText = derived" invariant.
function commitFragments(project: Project): void {
  project.sprintText = sprintTextOf(project);
  saveProject(project);
}

// Read a project's fragments, migrating a legacy sprintText on first load
// (idempotent — never re-migrates a project that already has fragments). The
// migrated fragments are persisted so the project loads with them populated;
// sprintText is unchanged because it's rebuilt from the same text.
export function getFragments(projectId: string): Fragment[] {
  const project = getProject(projectId);
  if (!project) return [];
  if (!project.fragments) {
    project.fragments = migrateFragments(project.id, project.sprintText ?? '');
    commitFragments(project);
  }
  return clone(project.fragments);
}

// Append text to a fragment: extend its last unstruck run, or start a new run
// (e.g. after a strike). Appending is forward motion, never an in-place edit.
export function appendText(fragmentId: string, text: string): void {
  const pid = projectIdOfFragment(fragmentId);
  if (!pid) return;
  const project = getProject(pid);
  if (!project?.fragments) return;
  const frag = project.fragments.find(f => f.id === fragmentId);
  if (!frag) return;
  const last = frag.content[frag.content.length - 1];
  if (last && !last.struck) last.text += text;
  else frag.content.push({ text, struck: false });
  frag.updatedAt = new Date().toISOString();
  commitFragments(project);
}

// Strike or unstrike a run. Strikethrough is the only "delete": the run's text
// is never removed from `content`, only excluded from the derived spine.
export function toggleStruck(fragmentId: string, runIndex: number): void {
  const pid = projectIdOfFragment(fragmentId);
  if (!pid) return;
  const project = getProject(pid);
  if (!project?.fragments) return;
  const frag = project.fragments.find(f => f.id === fragmentId);
  const run = frag?.content[runIndex];
  if (!frag || !run) return;
  run.struck = !run.struck;
  frag.updatedAt = new Date().toISOString();
  commitFragments(project);
}

// Create a fragment (spine / branch / loose). Spine fragments append to the end
// of the spine unless an explicit order is given.
export function createFragment(
  projectId: string,
  role: Fragment['role'],
  opts: { text?: string; spineOrder?: number; parentId?: string; parentFragmentId?: string; clusterId?: string } = {},
): Fragment {
  const project = getProject(projectId);
  if (!project) throw new Error(`createFragment: unknown project ${projectId}`);
  if (!project.fragments) project.fragments = migrateFragments(project.id, project.sprintText ?? '');
  const now = new Date().toISOString();
  const fragment: Fragment = {
    id: generateId(),
    projectId,
    content: opts.text != null ? [{ text: opts.text, struck: false }] : [],
    role,
    links: [],
    createdAt: now,
    updatedAt: now,
  };
  if (role === 'spine') fragment.spineOrder = opts.spineOrder ?? nextSpineOrder(project.fragments);
  if (opts.parentId != null) fragment.parentId = opts.parentId;
  if (opts.parentFragmentId != null) fragment.parentFragmentId = opts.parentFragmentId;
  if (opts.clusterId != null) fragment.clusterId = opts.clusterId;
  project.fragments.push(fragment);
  commitFragments(project);
  return clone(fragment);
}

// Reorder a spine fragment via its sparse/float index. Reordering is NOT
// erasure — it's the forward-only-safe way to converge by arranging.
export function reorderSpine(projectId: string, fragmentId: string, newOrder: number): void {
  const project = getProject(projectId);
  if (!project?.fragments) return;
  const frag = project.fragments.find(f => f.id === fragmentId);
  if (!frag || frag.role !== 'spine') return;
  frag.spineOrder = newOrder;
  frag.updatedAt = new Date().toISOString();
  commitFragments(project);
}

// Link two fragments (a rhizome side-edge). Idempotent per (target, kind);
// links don't affect the spine, but the mirror invariant is kept uniformly.
export function linkFragments(sourceId: string, targetId: string, kind: FragmentLink['kind']): void {
  const pid = projectIdOfFragment(sourceId);
  if (!pid) return;
  const project = getProject(pid);
  if (!project?.fragments) return;
  const frag = project.fragments.find(f => f.id === sourceId);
  if (!frag) return;
  if (frag.links.some(l => l.targetId === targetId && l.kind === kind)) return;
  frag.links.push({ targetId, kind });
  frag.updatedAt = new Date().toISOString();
  commitFragments(project);
}

// Change a fragment's role (e.g. promote a loose fragment onto the spine).
// Promotion to spine gets an order at the end if it lacks one.
export function setFragmentRole(fragmentId: string, role: Fragment['role']): void {
  const pid = projectIdOfFragment(fragmentId);
  if (!pid) return;
  const project = getProject(pid);
  if (!project?.fragments) return;
  const frag = project.fragments.find(f => f.id === fragmentId);
  if (!frag) return;
  frag.role = role;
  if (role === 'spine' && frag.spineOrder == null) frag.spineOrder = nextSpineOrder(project.fragments);
  frag.updatedAt = new Date().toISOString();
  commitFragments(project);
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

// --- Drafts ---------------------------------------------------------------
// Autosaved writing buffers (A1), keyed by `projectId ?? 'scratch'`.

export function getDraft(id: string): Draft | null {
  const draft = cache.drafts.find(d => d.id === id);
  return draft ? clone(draft) : null;
}

export function saveDraft(id: string, text: string): void {
  upsert('drafts', cache.drafts, { id, text, updatedAt: '' });
}

export function clearDraft(id: string): void {
  const index = cache.drafts.findIndex(d => d.id === id);
  if (index < 0) return;
  cache.drafts.splice(index, 1);
  dirty.drafts.delete(id);
  scheduleFlush('drafts');
  notify();
}

// --- Sessions (A9) --------------------------------------------------------
// Writing-session instrumentation, recorded on sprint finish/save. Surfaces
// nowhere in the UI except the sprint finish stats; syncs like any record.

export function saveSession(session: SessionLog): void {
  upsert('sessions', cache.sessions, clone(session));
}

export function getSessions(): SessionLog[] {
  return cache.sessions.filter(s => !s.deletedAt).map(clone);
}

// --- Journal (J1) ---------------------------------------------------------
// A completed sprint commits its text to a permanent Journal entry. This is an
// ADDITIONAL, permanent write — not a replacement for the volatile drafts buffer
// (A1, in-flight crash protection) nor for project/scene save behavior. The
// resulting working-copy-plus-record double-storage is intentional: it protects
// the words. Entries are the substrate later tickets cultivate into projects
// (J2) and browse (J4); commit logic lives in the Quick Sprint completion path.

export function saveJournalEntry(entry: JournalEntry): void {
  upsert('journalEntries', cache.journalEntries, clone(entry));
}

// Create a blank, directly-authored journal page (J10) and persist it. Marked
// source: 'page' so the read view renders the editable sheet instead of a
// read-only capture. An empty page left untouched is discarded on exit by the
// page itself (honor-discard, J1a), so this never litters the journal.
export function createJournalPage(): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text: '',
    projectId: null,
    source: 'page',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

export function getJournalEntries(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt)
    .map(clone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first
}

export function getJournalEntry(id: string): JournalEntry | null {
  const entry = cache.journalEntries.find(e => e.id === id);
  return entry && !entry.deletedAt ? clone(entry) : null;
}

// --- Sync integration -----------------------------------------------------
// Apply records pulled from the server into the cache (W2). Locally-dirty
// records are skipped — unsynced on-device edits always win — and applied
// records are NOT marked dirty (they came from the server).

export interface RemoteRecords {
  projects?: Project[];
  storyPlans?: StoryPlan[];
  sessions?: SessionLog[];
  drafts?: Draft[];
  journalEntries?: JournalEntry[];
}

function applyCollection<T extends { id: string; updatedAt: string }>(
  name: CollectionName,
  collection: T[],
  remote: T[] | undefined,
): boolean {
  if (!remote || remote.length === 0) return false;
  let changed = false;
  for (const rec of remote) {
    if (!rec || !rec.id) continue;
    if (dirty[name].has(rec.id)) continue; // local unsynced edit wins
    const index = collection.findIndex(r => r.id === rec.id);
    if (index < 0) {
      collection.push(clone(rec));
      changed = true;
    } else if (!collection[index].updatedAt || rec.updatedAt > collection[index].updatedAt) {
      collection[index] = clone(rec);
      changed = true;
    }
  }
  if (changed) scheduleFlush(name);
  return changed;
}

export function applyRemoteRecords(remote: RemoteRecords): void {
  let changed = false;
  changed = applyCollection('projects', cache.projects, remote.projects) || changed;
  changed = applyCollection('storyPlans', cache.storyPlans, remote.storyPlans) || changed;
  changed = applyCollection('sessions', cache.sessions, remote.sessions) || changed;
  changed = applyCollection('drafts', cache.drafts, remote.drafts) || changed;
  changed = applyCollection('journalEntries', cache.journalEntries, remote.journalEntries) || changed;
  if (changed) notify();
}

// Wipe all local data (cache + dirty + localStorage). Used on logout so the
// next account starts from a clean slate and never sees another user's cache.
export function resetLocalData(): void {
  (Object.keys(KEYS) as CollectionName[]).forEach(name => {
    (cache[name] as unknown[]).length = 0;
    dirty[name].clear();
    if (flushTimers[name] !== null) {
      clearTimeout(flushTimers[name]!);
      flushTimers[name] = null;
    }
    try {
      localStorage.removeItem(KEYS[name]);
    } catch {
      // ignore
    }
  });
  notify();
}
