import type { Project, StoryPlan, SessionLog, Draft, BeatNote, JournalEntry, Fragment, FragmentLink, Drawer, Box, Stroke, ScriptDoc } from '../types';
import { sortNotebook, notebookKey, midpoint, gapExhausted, respread } from './pageOrder';
import { serializeScriptDoc } from './scriptText';
import { createEmptyScriptDoc } from './scriptDoc';

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
  drawers: 'writer-studio-drawers',
} as const;

type CollectionName = keyof typeof KEYS;

interface Cache {
  projects: Project[];
  storyPlans: StoryPlan[];
  sessions: SessionLog[];
  drafts: Draft[];
  journalEntries: JournalEntry[];
  drawers: Drawer[];
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
  drawers: hydrate<Drawer>(KEYS.drawers),
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
  drawers: new Set(),
};

export interface DirtyRecords {
  projects: Project[];
  storyPlans: StoryPlan[];
  sessions: SessionLog[];
  drafts: Draft[];
  journalEntries: JournalEntry[];
  drawers: Drawer[];
}

export function getDirtyRecords(): DirtyRecords {
  return {
    projects: cache.projects.filter(r => dirty.projects.has(r.id)).map(clone),
    storyPlans: cache.storyPlans.filter(r => dirty.storyPlans.has(r.id)).map(clone),
    sessions: cache.sessions.filter(r => dirty.sessions.has(r.id)).map(clone),
    drafts: cache.drafts.filter(r => dirty.drafts.has(r.id)).map(clone),
    journalEntries: cache.journalEntries.filter(r => dirty.journalEntries.has(r.id)).map(clone),
    drawers: cache.drawers.filter(r => dirty.drawers.has(r.id)).map(clone),
  };
}

export function markClean(ids: string[]): void {
  for (const id of ids) {
    dirty.projects.delete(id);
    dirty.storyPlans.delete(id);
    dirty.sessions.delete(id);
    dirty.drafts.delete(id);
    dirty.journalEntries.delete(id);
    dirty.drawers.delete(id);
  }
}

// One-time journal backfill (journal-resync patch). Pre-D2, the client pushed
// journal entries and marked them clean even though the old server silently
// dropped them — so every pre-existing entry sits in localStorage flagged
// "synced" while the server never stored it. Re-flag ALL entries dirty (include
// soft-deleted, so tombstones travel) so they push once against the new server.
// Touches neither the cache nor updatedAt — LWW + stable ids make a re-push of an
// entry the server already has a no-op. The sync loop fires this exactly once,
// gated on the new server's response shape + a localStorage flag.
export function markAllJournalEntriesDirty(): void {
  for (const e of cache.journalEntries) dirty.journalEntries.add(e.id);
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
  drawers: null,
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

// Create a Binder (B1) — a project with a `kind` (book/story/screenplay/other)
// and an optional home drawer. New Books/Stories live as chapter Pages, never the
// `sprintText` body, so this never seeds one.
export function createBinder(title: string, kind: Project['kind'], drawerId?: string, type: Project['type'] = 'creative'): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: generateId(),
    title: title.trim() || 'Untitled',
    type,
    kind,
    storyPlanId: null,
    createdAt: now,
    updatedAt: now,
  };
  if (drawerId) project.drawerId = drawerId;
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
  // F1 — resume stamping: a binder Page edit bumps its parent project's resume
  // pointer. ONE seam catches PageEditor autosave, legacy filed-page edits via
  // JournalEntry, and filing via setPageHome. Loose pages (no projectId) skip.
  if (entry.projectId) stampPageActivity(entry.projectId, entry.id);
}

// Stamp a project's resume pointer to a just-edited Page (F1). Skips silently if
// the project is missing or soft-deleted (getProject returns null). Every-save
// stamping mirrors the sprint pattern (setProjectSprintText) — no new cadence.
function stampPageActivity(projectId: string, pageId: string): void {
  const project = getProject(projectId);
  if (!project) return;
  project.lastActivityAt = new Date().toISOString();
  project.lastActivityType = 'page';
  project.lastActivePageId = pageId;
  saveProject(project);
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
    // AB3 S4 — the Journal/Catch door: this page homes in the Journal.
    origin: 'journal',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// Create a typed page inside a Binder (B1) — a JournalEntry parented to the
// project, with a pageType (manuscript chapter/scene, or a support page). New
// Books/Stories are project + chapter Pages; this is how a chapter is born.
export function createBinderPage(binderId: string, pageType: NonNullable<JournalEntry['pageType']>): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text: '',
    projectId: binderId,
    pageType,
    source: 'page',
    // AB3 S4 — a project door: this page homes in the project; the Journal
    // never sees it (no journal listing, no journal count).
    origin: 'project',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// --- J4 — the Board + the port ---------------------------------------------
// The Board is a new page species (pageType 'board'): a canvas of positioned
// boxes, ported (copied, never moved) from the loose Journal. Layout constants
// are normalized to the page WIDTH (the Board's one coordinate unit); an ink
// box's h follows its re-normalized stroke bbox aspect so it never distorts.

const BOARD_TEXT_W = 0.6;
const BOARD_INK_MIN_W = 0.15;
const BOARD_INK_MAX_W = 0.5;
const BOARD_GROUP_GAP = 0.05;  // between a locked group's text box and its ink box
const BOARD_STACK_GAP = 0.08;  // between successive ported pages
const BOARD_LINE_H = 0.045;    // one text line's height, normalized to page width
const BOARD_CHARS_PER_LINE = 70; // rough wrap estimate at BOARD_TEXT_W; Slice 3 corrects live

function estimateTextBoxHeight(text: string): number {
  const lines = text.split('\n').reduce((n, para) => n + Math.max(1, Math.ceil(para.length / BOARD_CHARS_PER_LINE)), 0);
  return Math.max(1, lines) * BOARD_LINE_H + 0.02;
}

// Non-eraser bbox (J2's convention — an erase sweep must not distort the fit).
function strokesBBox(strokes: Stroke[]): { minX: number; minY: number; w: number; h: number } {
  const pts = strokes.filter(s => !s.eraser).flatMap(s => s.points);
  if (pts.length === 0) return { minX: 0, minY: 0, w: 1, h: 1 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, w: Math.max(maxX - minX, 0.001), h: Math.max(maxY - minY, 0.001) };
}

// Re-normalize a page's strokes for an ink Box (J4 invariant): bbox origin ->
// 0,0, scaled so bbox width = 1 — the box crop-fits its drawing and transforms
// losslessly with `w`. Returns the drawing's aspect ratio (h/w) AND its
// original bbox width (page-width fraction, pre-scale) so the box can land
// bbox-fit — the size the writer actually drew it at — rather than flat-maxed.
function renormalizeStrokesForBox(strokes: Stroke[]): { strokes: Stroke[]; aspect: number; bboxW: number } {
  const bbox = strokesBBox(strokes);
  const scale = 1 / bbox.w;
  const normalized = strokes.map(s => ({
    ...s,
    points: s.points.map(p => ({ x: (p.x - bbox.minX) * scale, y: (p.y - bbox.minY) * scale, ...(p.p != null ? { p: p.p } : null) })),
  }));
  return { strokes: normalized, aspect: bbox.h / bbox.w, bboxW: bbox.w };
}

// Create a Board page (J4 Slice 1) — a binder page with pageType:'board' and
// empty boxes. `title` seeds entry.text (the same firstLine convention every
// page title reads from) — empty renders "Untitled" like any fresh page
// (F4's title-later law, reused rather than inventing a second naming field).
export function createBoardPage(binderId: string, title?: string): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text: title?.trim() ?? '',
    projectId: binderId,
    pageType: 'board',
    boxes: [],
    source: 'page',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// Persist a Board's box array (Slice 3 autosave) — merges into the latest
// record so metadata written elsewhere is never clobbered.
export function saveBoardBoxes(id: string, boxes: Box[]): void {
  const latest = getJournalEntry(id);
  if (!latest) return;
  saveJournalEntry({ ...latest, boxes });
}

// Port loose Journal pages onto a Board (J4 Slice 2 — I2 realized): COPY,
// never move — source pages are byte-untouched. Each source page becomes a
// text box and/or an ink box (when includeInk and it has strokes), stacked
// vertically in selection order; when a page has BOTH, they share a fresh
// groupId (the locked group — "ink locked to the text"). A text-empty page
// ports ink-only; an ink-empty page ports text-only; a page with neither
// contributes nothing. Provenance travels on every box.
function buildPortedBoxes(sourceIds: string[], includeInk: boolean, startY: number, startZ: number): Box[] {
  const now = new Date().toISOString();
  const boxes: Box[] = [];
  let y = startY;
  let z = startZ;
  for (const sourceId of sourceIds) {
    const source = getJournalEntry(sourceId);
    if (!source) continue;
    const hasText = !!source.text.trim();
    const hasInk = includeInk && (source.strokes?.length ?? 0) > 0;
    if (!hasText && !hasInk) continue;
    const groupId = hasText && hasInk ? generateId() : undefined;
    if (hasText) {
      const h = estimateTextBoxHeight(source.text);
      boxes.push({ id: generateId(), kind: 'text', x: 0.05, y, w: BOARD_TEXT_W, h, z: z++, groupId, text: source.text, sourceEntryId: source.id, portedAt: now });
      y += h + BOARD_GROUP_GAP;
    }
    if (hasInk) {
      const { strokes, aspect, bboxW } = renormalizeStrokesForBox(source.strokes!);
      const w = Math.min(Math.max(bboxW, BOARD_INK_MIN_W), BOARD_INK_MAX_W);
      const h = w * aspect;
      boxes.push({ id: generateId(), kind: 'ink', x: 0.05, y, w, h, z: z++, groupId, strokes, sourceEntryId: source.id, portedAt: now });
      y += h;
    }
    y += BOARD_STACK_GAP;
  }
  return boxes;
}

// `dest: 'new'` births an Untitled binder (kind 'other', F4's law) on the
// spot and creates a fresh Board inside it. `dest: <binderId>` creates a
// fresh Board in that existing binder.
export function portToBoard(sourceIds: string[], dest: string | 'new', includeInk: boolean): JournalEntry {
  const binderId = dest === 'new' ? createBinder('', 'other').id : dest;
  const boxes = buildPortedBoxes(sourceIds, includeInk, 0.06, 1);
  const board = createBoardPage(binderId);
  saveJournalEntry({ ...board, boxes });
  return getJournalEntry(board.id)!;
}

// J5 Slice 3 — the port's other destination: an EXISTING Board. New locked
// groups append BELOW current content (start y = max box bottom + spacing,
// the same stacking `portToBoard` uses for a fresh Board) rather than
// replacing anything; z continues past the board's current max.
export function appendToBoard(sourceIds: string[], boardEntryId: string, includeInk: boolean): JournalEntry | null {
  const board = getJournalEntry(boardEntryId);
  if (!board || board.pageType !== 'board') return null;
  const existing = board.boxes ?? [];
  const startY = existing.reduce((m, b) => Math.max(m, b.y + b.h), 0) + BOARD_STACK_GAP;
  const startZ = existing.reduce((m, b) => Math.max(m, b.z), 0) + 1;
  const newBoxes = buildPortedBoxes(sourceIds, includeInk, startY, startZ);
  saveJournalEntry({ ...board, boxes: [...existing, ...newBoxes] });
  return getJournalEntry(boardEntryId);
}

// --- AB4 S2 — Pin: membership, not capture --------------------------------
// A page-pin card references an entry by id; it never copies its content and
// never touches the referenced entry's own record (origin/projectId/text all
// stay byte-unchanged — only the BOARD's `boxes` array gains a card). Rides
// the exact same `Box[]`/`saveBoardBoxes` recipe as every other card (zero
// schema — see the `Box` interface's own AB4 S2/S3 comments in types/index.ts
// for the full reasoning on why this stays inside the existing column).
const BOARD_PIN_W = 0.28;
const BOARD_PIN_H = 0.12;

export function pinPageToBoard(entryId: string, boardEntryId: string): JournalEntry | null {
  const board = getJournalEntry(boardEntryId);
  if (!board || board.pageType !== 'board') return null;
  const existing = board.boxes ?? [];
  if (existing.some(b => b.kind === 'page-pin' && b.entryId === entryId)) return board; // already pinned — idempotent
  const startY = existing.reduce((m, b) => Math.max(m, b.y + b.h), 0) + BOARD_STACK_GAP;
  const startZ = existing.reduce((m, b) => Math.max(m, b.z), 0) + 1;
  const pin: Box = { id: generateId(), kind: 'page-pin', x: 0.05, y: startY, w: BOARD_PIN_W, h: BOARD_PIN_H, z: startZ, entryId };
  saveJournalEntry({ ...board, boxes: [...existing, pin] });
  return getJournalEntry(boardEntryId);
}

// Every board (regardless of its own home) currently pinning `entryId` —
// feeds the Page panel's truthful "Also pinned to <board>." membership
// line(s). A page can be pinned to more than one board; every truth is told
// (S2's own "told truthfully like every other membership" law).
export function getBoardsPinning(entryId: string): { id: string; title: string }[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && e.pageType === 'board' && (e.boxes ?? []).some(b => b.kind === 'page-pin' && b.entryId === entryId))
    .map(e => ({ id: e.id, title: e.text.trim() ? e.text.trim().split('\n')[0].slice(0, 60) : 'Untitled board' }));
}

// --- S1 — the Screenplay Room's document (fragments-canon §2) -------------
// One jsonb column, exactly the `boxes` recipe. `getScriptDoc` is a plain
// read; `saveScriptDoc` writes the doc AND its derived `entry.text` shadow in
// ONE call (canon §2.4) — resume, the mirror card, and future search read
// the shadow, never the jsonb directly.

export function getScriptDoc(entryId: string): ScriptDoc | null {
  return getJournalEntry(entryId)?.script ?? null;
}

export function saveScriptDoc(entryId: string, doc: ScriptDoc): void {
  const latest = getJournalEntry(entryId);
  if (!latest) return;
  saveJournalEntry({ ...latest, script: doc, text: serializeScriptDoc(doc) });
}

// Create a Script page (S1 Slice 2) — a binder page with pageType:'script'
// and a fresh one-scene ScriptDoc, mirroring createBoardPage's shape exactly.
// `entry.text` is seeded from the (empty) doc's own shadow, not a separate
// title field — F4's title-later law, reused rather than inventing a second
// naming convention.
export function createScriptPage(binderId: string): JournalEntry {
  const now = new Date().toISOString();
  const doc = createEmptyScriptDoc();
  const entry: JournalEntry = {
    id: generateId(),
    text: serializeScriptDoc(doc),
    projectId: binderId,
    pageType: 'script',
    script: doc,
    source: 'page',
    // AB3 S4 — a project door (new screenplay from a project): homes in the
    // project; the Journal never sees it.
    origin: 'project',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// J5 Slice 2 — the "＋ Standalone document here" leaf: file ALL selected
// pages into ONE new Untitled binder (kind 'other', F4's title-later law) in
// the given drawer. N pages -> one binder, not N. MOVES (rides setPageHome).
export function fileToNewBinder(sourceIds: string[], drawerId?: string): Project {
  const binder = createBinder('', 'other', drawerId);
  for (const id of sourceIds) setPageHome(id, binder.id);
  return binder;
}

// J5 Slice 3 — "Append to <chapter>" (COPIES): selected pages' TEXT, in
// notebook order (Your order — the J4 port precedent; click/selection
// sequence is NOT honored, Fable R3), each landing at the chapter's end
// separated by one blank line. Sources are never touched — read-only here.
export function appendToChapter(sourceIds: string[], chapterId: string): void {
  const chapter = getJournalEntry(chapterId);
  if (!chapter) return;
  const blocks = sourceIds.map(id => getJournalEntry(id)?.text ?? '').filter(t => t.trim());
  if (blocks.length === 0) return;
  const appended = [chapter.text, ...blocks].filter(t => t.trim()).join('\n\n');
  saveJournalEntry({ ...chapter, text: appended });
}

// J5 Slice 3 — "Attach to the plan" (LINKS): sets beatId and appends the
// binder's project id to routedProjectIds on each selected entry. Nothing
// moves, nothing copies — the page stays exactly where it is.
export function attachToPlanBeat(sourceIds: string[], binderId: string, beatId: string): void {
  for (const id of sourceIds) {
    const entry = getJournalEntry(id);
    if (!entry) continue;
    const routed = entry.routedProjectIds ?? [];
    saveJournalEntry({
      ...entry,
      beatId,
      routedProjectIds: routed.includes(binderId) ? routed : [...routed, binderId],
    });
  }
}

// Import a draft (VW — the Voice Wall's door). The writer's own work flowing IN:
// a new binder page seeded with pasted text and stamped with provenance
// (`importedAt`). It behaves as a normal page thereafter (modes, filing, resume);
// the stamp is metadata only. Rides saveJournalEntry, so it stamps page activity
// (F1) and syncs like any page. One page per import, any length (v1).
export function importDraft(binderId: string, pageType: NonNullable<JournalEntry['pageType']>, text: string): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text,
    projectId: binderId,
    pageType,
    source: 'page',
    importedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// Create a blank page directly on the Shelf (D2) — a loose page awaiting a home,
// kept out of the chronological Journal stream (projectId null AND shelved).
export function createShelfPage(): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text: '',
    projectId: null,
    source: 'page',
    shelved: true,
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

// --- Pages & the Shelf (D2) -----------------------------------------------
// A page is a JournalEntry; its home is exactly one of three pools. These read
// the same cache, partitioned by (projectId, shelved). `setPageHome` is the one
// place that moves a page between homes, enforcing the exactly-one-home rule.

// AB3 S5 — the Journal-forgets-nothing predicate, shared by every Journal
// view (list, notebook nav). A page belongs to the Journal if it was BORN
// there (origin==='journal'), regardless of its current home (filed,
// shelved — "a filed journal page appears in both places"); a null-origin
// row (canon amendment A2, the grandfather clause) keeps EXACTLY today's
// rule (loose AND not shelved) — untouched by this ticket. A 'project'- or
// 'loose'-origin page never matches, even if projectId happens to be null
// (the loose-origin door produces exactly that shape on purpose).
export function inJournalView(e: JournalEntry): boolean {
  if (e.origin === 'journal') return true;
  if (e.origin != null) return false; // explicit 'project' | 'loose' — never
  return e.projectId == null && !e.shelved; // A2 — today's rule, untouched
}

// The Journal stream — every page that belongs there (see inJournalView).
export function getJournalPages(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && inJournalView(e))
    .map(clone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// The Shelf — loose pages set aside for filing (projectId null AND shelved).
export function getShelfPages(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && e.projectId == null && !!e.shelved)
    .map(clone)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); // most recently touched first
}

// J1 — the loose Journal in NOTEBOOK order (ascending: oldest first, like a real
// notebook fills). Nav (prev/next) + the spread view (J3) walk this. The
// chronological list feed is unchanged (getJournalPages stays newest-first).
// AB3 — deliberately NOT origin-aware (unlike getJournalPages above). This
// powers the Spread's spatial drag-reorder grid (J1/J5), which needs a page
// to actually LEAVE when filed or shelved (J5's own harness asserts this:
// filing to the Shelf removes a page from the grid) — S5's "notebook nav"
// wording is about JournalEntry.tsx's own prev/next paging (still gated by
// the unchanged isLoose there), not the Spread's reorder surface. Untouched
// from pre-AB3 behavior for every row, journal-origin included.
export function getNotebookPages(): JournalEntry[] {
  return sortNotebook(
    cache.journalEntries.filter(e => !e.deletedAt && e.projectId == null && !e.shelved).map(clone),
  );
}

// AB3 S6 — the Drawers place face's contents: every page currently filed
// into ANY project (a flat, one-level list — no per-project drill-down).
export function getDrawerFiledPages(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && e.projectId != null)
    .map(clone)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// Re-spread every loose page onto clean, well-separated indexes (order preserved)
// — the insert path calls this only when a target midpoint gap is exhausted.
function normalizeNotebook(): JournalEntry[] {
  for (const { id, orderIndex } of respread(getNotebookPages())) {
    const live = cache.journalEntries.find(e => e.id === id);
    if (live) saveJournalEntry({ ...live, orderIndex });
  }
  return getNotebookPages();
}

// J3 — the ONE ordering implementation shared by every writer of `orderIndex`:
// createLoosePage (append/insert-blank, below) and setNotebookPosition (drag
// reorder, J3 Slice 2). Computes a fresh index placing a page immediately
// after `afterId`, normalizing the notebook first if that gap is exhausted.
// `afterId` is a three-state selector: omitted -> append at the end (the
// original createLoosePage contract, unchanged); `null` -> insert before the
// very first page (the drag-to-the-front target, which has no "after" id to
// name — the open end at the other side of `midpoint`); a page id -> insert
// immediately after that page. `excludeId` drops a page (the one being
// dragged) out of the notebook read BEFORE any gap is measured, so moving a
// page never measures a gap against its own current position.
function notebookIndexAfter(afterId?: string | null, excludeId?: string): number {
  let nb = getNotebookPages();
  if (excludeId) nb = nb.filter(p => p.id !== excludeId);

  if (afterId === null) {
    // Before the first page — the open end symmetric to "append at the end"
    // below; nothing precedes it, so there's no gap that can be exhausted.
    const firstKey = nb.length ? notebookKey(nb[0]) : undefined;
    return midpoint(undefined, firstKey);
  }

  const lastKey = nb.length ? notebookKey(nb[nb.length - 1]) : undefined;
  const i0 = afterId ? nb.findIndex(p => p.id === afterId) : -1;
  if (!afterId || i0 < 0) {
    return midpoint(lastKey, undefined); // append at the end
  }
  let i = i0;
  let cur = notebookKey(nb[i]);
  let nxt = i + 1 < nb.length ? notebookKey(nb[i + 1]) : undefined;
  if (nxt != null && gapExhausted(cur, nxt)) {
    nb = normalizeNotebook();
    if (excludeId) nb = nb.filter(p => p.id !== excludeId);
    i = nb.findIndex(p => p.id === afterId);
    cur = notebookKey(nb[i]);
    nxt = i + 1 < nb.length ? notebookKey(nb[i + 1]) : undefined;
  }
  return midpoint(cur, nxt);
}

// Create a blank loose Journal page placed in the notebook: at the END (afterId
// omitted), or immediately AFTER `afterId` (between it and its successor).
// Normalizes first if that gap is exhausted. Honor-discard (J1a) still cleans up
// an abandoned blank — no litter.
export function createLoosePage(afterId?: string): JournalEntry {
  const orderIndex = notebookIndexAfter(afterId);
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(), text: '', projectId: null, source: 'page',
    // AB3 S4 — a Journal-domain door (notebook insert): this page homes in
    // the Journal, same as createJournalPage/Catch.
    origin: 'journal',
    orderIndex, createdAt: now, updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// AB3 S4 — the Desk's start-writing / home-base door. A blank page with no
// project and no Journal membership: `loose` is a legitimate PERMANENT home
// (canon's "loose forever" clause) — never nudged to file, and this door
// never puts it in the Journal (S5's predicate keys off `origin`, not the
// projectId/shelved shape alone, so a loose-origin page is structurally
// identical to a Journal page yet correctly excluded from every Journal
// view). Opens at /page/:id (PageEditor) — not /journal/:id — so it never
// inherits JournalEntry's Journal-only furniture (notebook nav, the
// file-it-first prompt).
export function createLooseHomePage(): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    text: '',
    projectId: null,
    source: 'page',
    origin: 'loose',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// AB3 S2 — a shared merge-write used by the Page face's star/tag mutations
// on both JournalEntry.tsx and PageEditor.tsx. `currentText` is the host's
// own live text ref/buffer, re-injected on every write so a star/tag toggle
// never clobbers a freshly-typed run the debounced autosave hasn't flushed
// yet (the same discipline JournalEntry.tsx's own `patch` closure already
// used — lifted here so PageEditor.tsx, which never had this, gets it too).
export function patchJournalEntry(id: string, currentText: string, changes: Partial<JournalEntry>): JournalEntry | null {
  const latest = getJournalEntry(id);
  if (!latest) return null;
  saveJournalEntry({ ...latest, text: currentText, ...changes });
  return getJournalEntry(id);
}

// J3 — persist a drag reorder (the spread view, Slice 2): place an existing
// loose page immediately after `afterId` (`null` = the very front, omitted =
// the very end). Rides `notebookIndexAfter` — the SAME helper `createLoosePage`
// uses — so there is exactly one ordering implementation, per the J3 invariant.
// Loose notebook pages only (filed/Shelf pages have no notebook order to move
// within); a no-op if `id` isn't a live loose page or the drop targets itself.
export function setNotebookPosition(id: string, afterId?: string | null): void {
  if (afterId === id) return;
  const entry = getJournalEntry(id);
  if (!entry || entry.projectId != null || entry.shelved) return;
  const orderIndex = notebookIndexAfter(afterId, id);
  saveJournalEntry({ ...entry, orderIndex });
}

// Test/inspection seam — the loose notebook in order (id + resolved key).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoNotebook?: unknown }).wrizoNotebook =
    () => getNotebookPages().map(p => ({ id: p.id, oi: p.orderIndex ?? null, key: notebookKey(p) }));
}

// Pages filed into a binder (projectId === binderId).
export function getBinderPages(binderId: string): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && e.projectId === binderId)
    .map(clone)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// Move a page to a single home: a binderId, 'shelf', or 'journal'. Enforces
// exactly-one-home (filing into a binder clears `shelved`; shelving clears
// `projectId`). An ordinary record update — syncs like any edit.
export function setPageHome(pageId: string, target: string): void {
  const entry = getJournalEntry(pageId);
  if (!entry) return;
  if (target === 'shelf') {
    entry.projectId = null;
    entry.shelved = true;
  } else if (target === 'journal') {
    entry.projectId = null;
    entry.shelved = false;
  } else {
    entry.projectId = target; // a binder id
    entry.shelved = false;
  }
  saveJournalEntry(entry);
}

export function getJournalEntry(id: string): JournalEntry | null {
  const entry = cache.journalEntries.find(e => e.id === id);
  return entry && !entry.deletedAt ? clone(entry) : null;
}

// CD2 S3 — soft-delete a page, mirroring softDeleteDrawer's own pattern
// exactly (a synced row must travel its deletion, never hard-delete). The
// FIRST UI-reachable delete for a JournalEntry — `deletedAt` itself is not
// new (every getter above already filters `!e.deletedAt`; only Drawer had a
// live door to it before now). Zero schema: the field has existed since the
// sync adapter's own soft-delete convention was laid down. Used by the
// Cascade's Plan survey (T4's ruling: one plain confirm, then gone — "gone
// from list and store" per the brief's own S6 DoD, satisfied because every
// getJournalEntry/getBinderPages/etc. read above already excludes it).
export function softDeleteEntry(id: string): void {
  const entry = getJournalEntry(id);
  if (!entry) return;
  entry.deletedAt = new Date().toISOString();
  saveJournalEntry(entry);
}

// --- Drawers (Drawers D1) -------------------------------------------------
// The top of the Drawers IA — a level OVER projects. CRUD mirrors every other
// collection (upsert → cache + dirty + debounced flush + notify); soft-delete,
// never hard-delete (a synced row must travel its deletion). A project's
// `drawerId` is set on the Project record (rides the existing project sync).

export function getDrawers(): Drawer[] {
  return cache.drawers.filter(d => !d.deletedAt).map(clone);
}

export function getDrawer(id: string): Drawer | null {
  const drawer = cache.drawers.find(d => d.id === id);
  return drawer && !drawer.deletedAt ? clone(drawer) : null;
}

export function saveDrawer(drawer: Drawer): void {
  upsert('drawers', cache.drawers, clone(drawer));
}

export function createDrawer(name: string): Drawer {
  const now = new Date().toISOString();
  const maxOrder = cache.drawers.reduce((m, d) => Math.max(m, d.order ?? 0), -1);
  const drawer: Drawer = {
    id: generateId(),
    name: name.trim() || 'New Drawer',
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };
  saveDrawer(drawer);
  return drawer;
}

export function renameDrawer(id: string, name: string): void {
  const drawer = getDrawer(id);
  if (!drawer) return;
  drawer.name = name.trim() || drawer.name;
  saveDrawer(drawer);
}

export function softDeleteDrawer(id: string): void {
  const drawer = getDrawer(id);
  if (!drawer) return;
  drawer.deletedAt = new Date().toISOString();
  saveDrawer(drawer);
  // The drawer's projects fall back to "Unsorted" automatically — DrawersTree
  // treats a project whose drawerId points at a missing/deleted drawer as
  // unsorted — so we don't rewrite each project (keeps the move reversible).
}

export function setProjectDrawer(projectId: string, drawerId: string | null): void {
  const project = getProject(projectId);
  if (!project) return;
  project.drawerId = drawerId ?? undefined;
  saveProject(project);
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
  drawers?: Drawer[];
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
  changed = applyCollection('drawers', cache.drawers, remote.drawers) || changed;
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
