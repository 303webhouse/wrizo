import type { Project, StoryPlan, SessionLog, Draft, BeatNote, JournalEntry, Fragment, FragmentLink, Drawer, Box, Stroke, ScriptDoc, TutorThread, TutorMessage } from '../types';
import { sortNotebook, notebookKey, midpoint, gapExhausted, respread } from './pageOrder';
import { serializeScriptDoc } from './scriptText';
import { createEmptyScriptDoc } from './scriptDoc';
import { deskTerm, type DeskTermId } from './deskLexicon';

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

// B1 S6 — test/inspection seam (this file's own established pattern —
// window.wrizoPinPageToBoard/wrizoNotebook, etc.). Every harness fixture
// that predates this ticket reached a fresh, editable journal-origin page
// by clicking the RETIRED Journal list's own "New page" button
// (.journal-new-page, pages/Journal.tsx — deleted, S5) purely as
// SCAFFOLDING for testing something else entirely (autosave, way-back, the
// Spread console, and so on — none of it about the list surface itself).
// This seam gives every one of those pre-existing scenarios an equally
// direct path to the identical state, without resurrecting the retired
// room's own UI just to keep old harness plumbing working.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoCreateJournalPage?: unknown }).wrizoCreateJournalPage = createJournalPage;
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
// FX5 S3 (b/c) — the "content-minimum trap" fix's OTHER half (see
// BoardEditor.tsx's own header comment on BoardTextBox for the full
// diagnosis): the reflow-as-minimum effect only ever GROWS a card's height,
// never shrinks it, so clamping the DISPLAY to a short excerpt alone
// doesn't help a card that already mounted with an absurd height (measured
// live at h=6.19 — over six page-widths tall — for a 60-line source page).
// A ported card's INITIAL height is capped here at port time, comfortably
// above what a title + badge + ~3-line excerpt actually needs (a small,
// deliberate safety margin — if the real rendered excerpt needs a hair
// more, the EXISTING reflow-as-minimum effect grows it the rest of the
// way, same as any other card; it never needs to shrink FROM this cap).
const MAX_PORTED_TEXT_H = 0.18;

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
      // FX5 S3 — capped at MAX_PORTED_TEXT_H (see that constant's own
      // comment): a ported card's face now shows a bounded excerpt, not
      // the full source text, so its height should read as a notecard
      // from the very first paint, not the OLD full-content estimate.
      const h = Math.min(estimateTextBoxHeight(source.text), MAX_PORTED_TEXT_H);
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
  // FX6 S3 (a1, ab4-review's own advisory) — self-pin closed at THIS end
  // too (belt and suspenders alongside PinToBoardSheet.tsx's own leaf
  // exclusion): a board can never pin itself to itself, even via a direct
  // call that bypasses the sheet's own UI.
  if (entryId === boardEntryId) return null;
  // B1 S3 — "may NOT ... pin the system Board anywhere," closed at THIS end
  // too, the SAME belt-and-suspenders shape as the self-pin guard right
  // above: BoardEditor.tsx's own onOpenPin no-op already makes this
  // unreachable through the UI (the sheet never opens on a system Board's
  // own Page face), but this guard is what actually holds if some OTHER
  // call site ever pins entryId onto a DIFFERENT board directly.
  if (getSystemKind(getJournalEntry(entryId))) return null;
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

// FX6 S4 — test/inspection seam (this file's own established pattern —
// see setNotebookPosition's own `window.wrizoNotebook` neighbor above):
// PinToBoardSheet.tsx's own leaf exclusion already makes a self-pin
// unreachable through the UI, so the ONLY way to prove pinPageToBoard's
// OWN guard (the "belt" half of "belt and suspenders") actually holds —
// rather than merely reading the source and trusting it — is a direct
// call, bypassing the sheet entirely. Exposed unconditionally (module
// load, not component-mount-scoped), the SAME shape wrizoDeskLexicon uses.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoPinPageToBoard?: unknown }).wrizoPinPageToBoard = pinPageToBoard;
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

// --- TU1 S1 — the Tutor's per-page conversation thread --------------------
// One jsonb column, the exact `script`/`boxes` recipe once more. A plain
// read (getTutorThread); appendTutorMessage is the ONLY writer — there is
// no "create an empty thread" call anywhere in this file, deliberately: a
// page that has never talked to the Tutor must never gain a persisted
// `{ messages: [] }` (a subtly different, wrong "grandfathered" state from
// genuinely absent) — the thread is born on its first real message and not
// one keystroke sooner. Any page can carry one, independent of pageType.

export function getTutorThread(entryId: string): TutorThread | null {
  return getJournalEntry(entryId)?.tutor ?? null;
}

export function appendTutorMessage(entryId: string, message: TutorMessage): TutorThread | null {
  const latest = getJournalEntry(entryId);
  if (!latest) return null;
  // TU2 S2 — spread the existing thread first, THEN override `messages`:
  // this function predates the `lastRead` cursor field, and the original
  // `{ messages: [...] }` reconstruction here would silently zero the
  // cursor on every append (writer AND tutor replies both call this) —
  // the exact opposite of "advances only on a successful send." Spreading
  // `latest.tutor` (a no-op when it's undefined) is the whole fix.
  const thread: TutorThread = { ...latest.tutor, messages: [...(latest.tutor?.messages ?? []), message] };
  saveJournalEntry({ ...latest, tutor: thread });
  return thread;
}

// TU2 S2 — the listener's cursor. Advances `lastRead` ONLY (never touches
// `messages`) and ONLY on a thread that already exists: a cursor can only
// ever advance after at least one message has already been sent (this
// file's own getTutorThread/appendTutorMessage invariant that a thread is
// born on its first real message, never sooner), so there is no "create a
// thread just to seed a cursor" path here — a no-op on a never-messaged
// page, mirroring appendTutorMessage's own refusal to conjure a thread
// out of nothing. `at` is an ordinary `new Date()` read — real wall-clock
// time, no fixture/harness indirection needed here (this runs only from
// live application code, on a real successful reply).
export function advanceTutorCursor(entryId: string, chars: number): void {
  const latest = getJournalEntry(entryId);
  if (!latest?.tutor) return;
  const thread: TutorThread = { ...latest.tutor, lastRead: { at: new Date().toISOString(), chars } };
  saveJournalEntry({ ...latest, tutor: thread });
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

// B2 S3 — createShelfPage (the legacy manual "Shelve" verb's own creation
// door: a page born pre-shelved:true) RETIRES. The Shelf is derived (T3),
// never filed-into — there is no more "start a page ON the Shelf" act to
// have; a loose page lands there on its own the moment it qualifies. Its
// only call site (the retired pages/Shelf.tsx) is deleted alongside it
// (S1 — '/shelf' now bridges to the Shelf Board, the ShelfBoardGate
// pattern B1 established for '/journal' and '/trash'). Parked, not
// deleted from history: see docs/wrizo-alpha's own build report and the
// harness's A4 park sweep for the quoted-verbatim record.

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
//
// B2 S7 — the PINNED law amends the origin==='journal' branch only: dual
// membership retires. A journal-born page that gets FILED (projectId set)
// now LEAVES the Journal (this is the Places panel's own Home zone DoD:
// "a journal-born page filed to a drawer leaves the Journal Board; its
// origin never changes" — origin is provenance, untouched forever; THIS
// function is what decides current membership, and membership now tracks
// projectId too). The grandfather branch (null origin) and the explicit
// 'project'/'loose' branch are BOTH untouched — this is a one-line, one-
// branch amendment, not a rewrite. Every consumer (getJournalPages, the
// cascade's Journal panel + survey, the Journal Board's own reconcile via
// qualifyingPagesFor, JournalEntry.tsx's own membership line) picks up the
// amendment uniformly — "one truth, every surface," the SAME discipline
// qualifyingPagesFor's own header comment already names.
export function inJournalView(e: JournalEntry): boolean {
  if (e.origin === 'journal') return e.projectId == null;
  if (e.origin != null) return false; // explicit 'project' | 'loose' — never
  return e.projectId == null && !e.shelved; // A2 grandfather — untouched (legacy null-origin rows)
}

// The Journal stream — every page that belongs there (see inJournalView).
export function getJournalPages(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && inJournalView(e))
    .map(clone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// --- B2 — T3, the Shelf's law (this ticket's own brief, S1/S3) -----------
// A page belongs on the Shelf iff ALL hold: not deleted; not a system
// board; no project home; not journal-homed; and it appears as a page-pin
// card on ZERO user boards (membership is connection). Starred status is
// irrelevant — attention is not organization. This SUPERSEDES the legacy
// `shelved`-flag definition (getShelfPages, retired below) — the flag
// stays dormant in storage (zero schema; never dropped) but is never read
// by this law directly; T3 is derived from truth that already exists
// (origin, projectId, deletedAt, boxes), the same "dress, not collapse"
// discipline every system Board already stands on.

// Every board (any project, any drawer) currently carrying a page-pin card
// for `entryId` — "zero user-board pins" in T3's own words. System boards
// are excluded (their own cards are DERIVED, never real membership).
function isPinnedOnAnyUserBoard(entryId: string): boolean {
  return cache.journalEntries.some(e =>
    !e.deletedAt && e.pageType === 'board' && getSystemKind(e) === undefined
    && (e.boxes ?? []).some(b => b.kind === 'page-pin' && b.entryId === entryId));
}

// T3 itself — a single predicate, called by BOTH the Shelf Board's own
// reconcile (qualifyingPagesFor, below) and the Drawers panel's own "loose
// docs" group (S7 — "one definition, two consumers").
export function belongsOnShelf(e: JournalEntry): boolean {
  if (e.deletedAt) return false;
  if (getSystemKind(e) !== undefined) return false; // never a system board, including itself
  // BM1 S2 — a board that is currently a page's plan face is subordinate and
  // invisible (Page is Primary): it never clutters the Shelf WHILE PAIRED.
  // The instant its page is deleted, isPairedPlanBoard(e.id) goes false and it
  // falls into ordinary loose membership HERE — that IS the "orphans into
  // ordinary loose membership, nothing cascades" rule, made concrete by
  // derivation rather than a cascade write. For every grandfathered entry no
  // page carries a planBoardId, so this branch is a no-op — belongsOnShelf is
  // byte-behaviour-identical to today until a real pairing exists.
  if (isPairedPlanBoard(e.id)) return false;
  if (e.projectId != null) return false; // no project home
  if (inJournalView(e)) return false; // not journal-homed
  if (isPinnedOnAnyUserBoard(e.id)) return false; // zero user-board pins
  return true; // starred is irrelevant, per T3's own words
}

// The Shelf — every page T3 currently qualifies, most-recently-touched
// first (the old getShelfPages' own sort, kept — a plain read-order
// preference, not part of T3 itself).
export function getShelfEntries(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => belongsOnShelf(e))
    .map(clone)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
// B1 — `pageType !== 'board'` is a new, defensive exclusion this ticket
// adds: every Board page before B1 always carried a projectId (this
// predicate's own `projectId == null` check already excluded it), so this
// filter's blind spot to boards specifically never mattered until a system
// Board could exist with no project at all. Without it, the Journal/Trash
// system Boards would wrongly surface as notebook pages (Spread's own
// reorder grid, JournalEntry's prev/next paging) — genuinely new territory,
// not a pre-existing gap this ticket happens to be fixing.
// B2 S3 — `!e.shelved` is replaced with `!belongsOnShelf(e)` (T3): the
// legacy flag is dormant now (never written — persistence.ts's own
// setPageHome), so a literal `!e.shelved` read would always be true and
// this filter would stop excluding ANYTHING, regressing "filing a page
// away removes it from the notebook grid" (J5's own harness DoD) for
// every origin. `belongsOnShelf` is the correct replacement, not merely a
// mechanical swap: a journal-origin page that gets un-filed CORRECTLY
// stays in the notebook (T3 excludes it — still journal-homed, per the
// pinned law), while a project-/loose-origin/grandfathered page that
// becomes un-filed-and-unpinned CORRECTLY leaves (T3 includes it — heads
// to the Shelf). Still deliberately NOT origin-aware beyond what T3 itself
// already is — untouched from pre-B2 behavior otherwise.
export function getNotebookPages(): JournalEntry[] {
  return sortNotebook(
    cache.journalEntries.filter(e => !e.deletedAt && e.projectId == null && !belongsOnShelf(e) && e.pageType !== 'board').map(clone),
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

// Move a page to a single home: a binderId, 'shelf'/'loose', or 'journal'.
// Enforces exactly-one-home (filing into a binder clears the un-filed
// state; un-filing clears `projectId`). An ordinary record update — syncs
// like any edit.
//
// B2 S3 — the legacy `shelved` flag retires from every write path,
// INCLUDING this one: no branch below sets it true or false anymore (the
// column stays dormant — never dropped, never touched). 'shelf' and
// 'loose' are now plain synonyms for "un-file" — the Shelf is derived
// (T3), never filed-into, so there is no longer a distinct "shelve" act
// for this function to perform; whichever pool a just-un-filed page lands
// in (the Journal, or the Shelf) is entirely a function of its own origin
// (inJournalView/T3), never of which target string was passed. 'loose' is
// the Places panel's own name for this (S4: "Selecting Loose un-files —
// the page heads to the Shelf by T3"); 'shelf' is kept as an accepted
// synonym so every pre-existing call site (AddToSheet.tsx, PageFileMenu.tsx)
// keeps working, byte-identical in effect, with zero call-site edits forced
// by this ticket alone.
export function setPageHome(pageId: string, target: string): void {
  const entry = getJournalEntry(pageId);
  if (!entry) return;
  if (target === 'shelf' || target === 'loose' || target === 'journal') {
    entry.projectId = null;
  } else {
    entry.projectId = target; // a binder id
  }
  saveJournalEntry(entry);
}

// B2 S4 — the inverse of pinPageToBoard: uncheck in the Places panel's
// Boards zone removes ONLY that board's own card (the page, never — A16's
// own words, "checkboxes write ONLY membership"). Symmetric to pinPageToBoard
// (same board-must-be-a-live-board guard); idempotent (unpinning an
// already-absent card is a harmless no-op, matching pinPageToBoard's own
// "already pinned — idempotent" twin).
export function unpinPageFromBoard(entryId: string, boardEntryId: string): JournalEntry | null {
  const board = getJournalEntry(boardEntryId);
  if (!board || board.pageType !== 'board') return null;
  const existing = board.boxes ?? [];
  const next = existing.filter(b => !(b.kind === 'page-pin' && b.entryId === entryId));
  if (next.length === existing.length) return board; // nothing to remove — idempotent
  saveJournalEntry({ ...board, boxes: next });
  return getJournalEntry(boardEntryId);
}

// B2 S4 — every live, non-system board the Places panel's Boards zone can
// offer ("every board the page COULD join... per existing pin law" — the
// SAME flat, any-project reach PinToBoardSheet.tsx's own drill-down already
// allows, just read flat here instead of drill-down-grouped). System boards
// are never listed (A16: their membership is derived, never a checkbox).
export function getAllUserBoards(): JournalEntry[] {
  return cache.journalEntries
    .filter(e => !e.deletedAt && e.pageType === 'board' && getSystemKind(e) === undefined)
    .map(clone)
    .sort((a, b) => a.id.localeCompare(b.id)); // stable, deterministic order
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
  // BM1 S2 — "deleting a plan board unpairs (page's planBoardId nulls, page
  // untouched)." Do this BEFORE marking deleted so the page's pointer is
  // cleaned up exactly once. Deleting a PAGE that owns a plan board needs no
  // action here: the board orphans automatically the instant this page carries
  // deletedAt (isPairedPlanBoard skips soft-deleted pages), and a later restore
  // re-pairs for free because the page's own planBoardId was never touched —
  // "nothing cascades, nothing is destroyed silently."
  if (entry.pageType === 'board' && isPairedPlanBoard(id)) unpairPlanBoard(id);
  entry.deletedAt = new Date().toISOString();
  saveJournalEntry(entry);
}

// --- BM1 S2 — the page⇄board pairing --------------------------------------
// A 1:1 page⇄board relation. The POINTER lives on the page side only
// (planBoardId); the board's own record — origin, boxes, projectId — is never
// touched by pairing, so its derived Journal/Shelf/Trash membership is provably
// unaffected (the board's back-reference is DERIVED by scan, never stored).
// Every function here is a plain scan/merge over the existing cache — no new
// collection, no new sync path (the nullable text column rides journal_entries'
// own round-trip). `export function` declarations hoist, so belongsOnShelf
// (above) may call isPairedPlanBoard even though it is defined here, below it.

// Is this board currently the plan face of some LIVE page?
export function isPairedPlanBoard(boardId: string): boolean {
  return cache.journalEntries.some(e => !e.deletedAt && e.planBoardId === boardId);
}

// The live page a board is paired to (the owner of its plan face), or null.
export function getPairedPageId(boardId: string): string | null {
  const page = cache.journalEntries.find(e => !e.deletedAt && e.planBoardId === boardId);
  return page ? page.id : null;
}

// The plan board a page is paired to (if one has been born), or null. Reads
// `?? null` so callers see the brief's logical "planBoardId: null" for an
// unpaired page even though the field itself stays absent-not-falsy.
export function getPlanBoardId(pageId: string): string | null {
  return getJournalEntry(pageId)?.planBoardId ?? null;
}

// Lazy birth (S2): a page's plan board is created on its FIRST flip — never
// before, never automatically. Idempotent: a second call returns the SAME
// board. Born EMPTY (boxes: []) in OPEN mode, projectId null + origin 'loose',
// so it stays out of every derived view (Journal via origin; Shelf via
// isPairedPlanBoard; Notebook via pageType 'board') until its page is deleted,
// when it orphans into ordinary loose membership. Page is Primary — the plan
// face is subordinate, lazily born, never first. Callers flush the page's own
// unsaved text first (the door handlers do), so the pointer-set merge below
// never clobbers a freshly-typed run.
export function getOrCreatePlanBoard(pageId: string): JournalEntry | null {
  const page = getJournalEntry(pageId);
  if (!page || page.pageType === 'board') return null; // a board is never its own plan face
  if (page.planBoardId) {
    const existing = getJournalEntry(page.planBoardId);
    if (existing) return existing;
    // Pointer dangles (board hard-gone) — fall through and re-birth below.
  }
  const now = new Date().toISOString();
  const board: JournalEntry = {
    id: generateId(),
    text: '',
    projectId: null,
    pageType: 'board',
    boxes: [],
    source: 'page',
    origin: 'loose',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(board);
  const latest = getJournalEntry(pageId);
  if (latest) saveJournalEntry({ ...latest, planBoardId: board.id });
  return getJournalEntry(board.id);
}

// Explicit pairing FROM the board side (S2): "pair this board with a page…".
// The ONLY way an EXISTING board gains a Write (page) face — never by
// inference. Enforces 1:1 at both ends and refuses to pair a board to a board.
export function pairBoardWithPage(boardId: string, pageId: string): boolean {
  const board = getJournalEntry(boardId);
  const page = getJournalEntry(pageId);
  if (!board || board.pageType !== 'board') return false;
  if (!page || page.pageType === 'board') return false;
  if (page.planBoardId) return false;           // page already paired (1:1)
  if (isPairedPlanBoard(boardId)) return false; // board already paired (1:1)
  saveJournalEntry({ ...page, planBoardId: boardId });
  return true;
}

// Unpair (S2). The page's planBoardId key is DELETED entirely (not set to
// null), restoring the page BYTE-IDENTICAL to its grandfathered shape — "the
// page is untouched," the absent-not-falsy discipline restoreEntry follows.
// The board itself is never touched here; the caller decides its fate.
export function unpairPlanBoard(boardId: string): void {
  const stale = cache.journalEntries.find(e => !e.deletedAt && e.planBoardId === boardId);
  if (!stale) return;
  const live = getJournalEntry(stale.id);
  if (!live) return;
  const { planBoardId: _drop, ...rest } = live;
  saveJournalEntry(rest as JournalEntry);
}

// Test/inspection seam — the pairing view (the wrizoBoard/wrizoNotebook
// convention). Lets bm1.mjs assert lazy birth / explicit pair / unpair / orphan
// without DOM.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoPairing?: unknown }).wrizoPairing = {
    planBoardId: getPlanBoardId,
    pairedPageId: getPairedPageId,
    isPaired: isPairedPlanBoard,
    birth: getOrCreatePlanBoard,
    pair: pairBoardWithPage,
    unpair: unpairPlanBoard,
  };
}

// B1 S4 — read a JournalEntry INCLUDING a soft-deleted one. Every other read
// in this file stays deletion-filtered on purpose (soft-deleted means "gone"
// everywhere else); this is the ONE deliberate exception, named for exactly
// what it's for: the Trash Board's own page-pin cards (BoardEditor.tsx's
// BoardPinBox) must show a deleted page's REAL, live title/excerpt — "the
// Trash is a place, not a blank" — never the generic "Missing page" that
// the deletion-filtered getJournalEntry would otherwise report for every
// single card on the Trash Board. Read-only; never used to gate a write.
export function getJournalEntryIncludingDeleted(id: string): JournalEntry | null {
  const entry = cache.journalEntries.find(e => e.id === id);
  return entry ? clone(entry) : null;
}

// B1 S4 — Restore (A18): a plain button (the FX5 action-row precedent),
// the exact inverse of softDeleteEntry and nothing more — clears deletedAt
// only. The page returns to its stored home (never touched by deletion in
// the first place: projectId/shelved/origin are untouched by softDeleteEntry
// above, so there is nothing here to restore but the one field deletion
// itself set) and, if journal-origin, back into the Journal Board's own
// derivation at the next reconcile (S2) — restore never re-homes a page,
// it only un-deletes it. `deletedAt` is deleted from the object entirely
// (not set to undefined) — the same "absent, not merely falsy" grandfather
// discipline this file's own TutorThread comment names.
export function restoreEntry(id: string): void {
  const entry = getJournalEntryIncludingDeleted(id);
  if (!entry || !entry.deletedAt) return;
  const { deletedAt: _deletedAt, ...rest } = entry;
  saveJournalEntry(rest as JournalEntry);
}

// --- B1 — System Boards (the Journal Board, the Trash Board) --------------
//
// S1's own reasoning, carried here verbatim from the brief (the header
// comment types/index.ts's Box.systemKind field points back to):
//
// A system Board is a REAL board page (pageType 'board'), created
// find-or-create idempotently on first approach, marked by a new optional
// field on the existing 'board-meta' element in its own boxes: systemKind:
// 'journal' | 'trash' (the FX4 board-meta precedent — additive optional Box
// field, zero schema). System Boards: have no project home; never appear as
// cards on any system Board (exclusion asserted); never appear in the Pin
// sheet's board leaves (no project → already excluded; assert it anyway);
// sync like any page (arrangement persists across devices by the existing
// boxes round-trip).
//
// S2's own reasoning: on mount of a system Board (and on store changes
// while mounted — BoardEditor.tsx's own subscribe() wiring), reconcile its
// cards against the truth. Cards are the EXISTING page-pin kind (entryId,
// live title/excerpt, double-click travels) — reused, never forked. New
// cards auto-place into open space (a quiet, deterministic flow, no overlap
// on arrival); EXISTING cards' authored positions/sizes are NEVER moved by
// reconcile — this pairing (system decides WHAT, writer decides WHERE) IS
// A16, the one law this whole ticket serves, made concrete in code.

// B2 S1 — 'shelf' joins the union, by the SAME code paths (not copies):
// idempotent find-or-create, origin 'system', derived membership (T3
// instead of inJournalView/deletedAt), authored arrangement sacred.
export type SystemBoardKind = 'journal' | 'trash' | 'shelf';

function boardMetaOf(entry: JournalEntry | null | undefined): Box | undefined {
  return entry ? (entry.boxes ?? []).find(b => b.kind === 'board-meta') : undefined;
}

// The system kind of a page, if it is one. A plain, cheap, read-only check
// — safe to call on every render (BoardEditor.tsx's own per-render guard),
// unlike everything else in this section, which only ever runs for a board
// already known to carry one.
export function getSystemKind(entry: JournalEntry | null | undefined): SystemBoardKind | undefined {
  if (!entry || entry.pageType !== 'board') return undefined;
  return boardMetaOf(entry)?.systemKind;
}

// Find a live system Board by kind. Deliberately searches EVERY board page
// (not scoped to projectId == null): system Boards are never supposed to
// gain a project home (S1's own invariant), but if one somehow did, this
// lookup still FINDS the existing record rather than minting a duplicate —
// a duplicate system Board is a strictly worse defect than a misplaced one.
function findSystemBoard(kind: SystemBoardKind): JournalEntry | null {
  const found = cache.journalEntries.find(e => !e.deletedAt && getSystemKind(e) === kind);
  return found ? clone(found) : null;
}

const SYSTEM_BOARD_TITLE_TERM: Record<SystemBoardKind, DeskTermId> = {
  journal: 'drawerPlaceJournal',
  trash: 'drawerPlaceTrash',
  shelf: 'drawerPlaceShelf',
};

// Find-or-create, idempotent (S1): the first approach mints the record;
// every later approach (any device, any session, via sync's existing boxes
// round-trip) finds the SAME one. `origin: 'system'` is load-bearing, not
// decorative — see its own header comment in types/index.ts for exactly
// which latent bug it closes. The seed title (deskTerm, the plain-function
// escape hatch this file's own describePageHome import already established
// the precedent for) is a one-time text seed via the SAME "first line is
// the title" convention every page already uses — not a live binding; nothing
// re-applies it on a later theme switch.
export function getOrCreateSystemBoard(kind: SystemBoardKind): JournalEntry {
  const existing = findSystemBoard(kind);
  if (existing) return existing;
  const now = new Date().toISOString();
  const meta: Box = { id: generateId(), kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, systemKind: kind };
  const entry: JournalEntry = {
    id: generateId(),
    text: deskTerm(SYSTEM_BOARD_TITLE_TERM[kind]),
    projectId: null,
    pageType: 'board',
    boxes: [meta],
    source: 'page',
    origin: 'system',
    createdAt: now,
    updatedAt: now,
  };
  saveJournalEntry(entry);
  return entry;
}

// S2 — the pages a system Board's cards are DERIVED from, right now.
function qualifyingPagesFor(kind: SystemBoardKind, systemBoardId: string): JournalEntry[] {
  if (kind === 'journal') {
    // "Every journal-origin, non-deleted page" — reusing getJournalPages()
    // (inJournalView's own canonical membership rule) rather than
    // re-deriving a second definition of "belongs in the Journal": this is
    // the SAME rule every other Journal-facing surface in the app already
    // obeys, so the Journal Board can never quietly disagree with what "the
    // Journal" means anywhere else. origin:'system' already excludes a
    // system Board from inJournalView; the id filter is belt-and-suspenders.
    // B2 S7 — inJournalView's own pinned-law amendment (this file, above)
    // means a filed journal-origin page now drops out of this set at the
    // NEXT reconcile — no separate code needed here; the one shared
    // predicate carries the amendment to every consumer uniformly.
    return getJournalPages().filter(e => e.id !== systemBoardId);
  }
  if (kind === 'shelf') {
    // B2 S1 — T3, this ticket's own law (belongsOnShelf, above): "one
    // definition, two consumers" — the SAME predicate the Drawers panel's
    // own "loose docs" group reuses (S7). The id filter is belt-and-
    // suspenders, matching the Journal branch's own defensive habit (T3's
    // own getSystemKind check already excludes the Shelf Board from
    // qualifying for itself).
    return getShelfEntries().filter(e => e.id !== systemBoardId);
  }
  // TRASH BOARD: "the same rule over deletedAt-bearing pages (any origin)"
  // — every soft-deleted page, any origin/pageType, EXCLUDING system Boards
  // themselves. No reachable UI path can currently soft-delete a system
  // Board (it has no project, so it never appears in the Plan panel's own
  // board-delete row, and no other delete surface reaches a Board page at
  // all) — this exclusion holds regardless, defensively, so "a system Board
  // never cards itself" is true by construction, not merely by the absence
  // of a path today.
  return cache.journalEntries
    .filter(e => !!e.deletedAt && getSystemKind(e) === undefined)
    .map(clone);
}

// A quiet, deterministic grid — new cards land in the next open slot, in a
// STABLE order (qualifying pages sorted by id, never createdAt/updatedAt,
// which reconcile itself never touches but which an unrelated edit could
// still bump) so two reconcile runs against the SAME added-pages batch
// always place them identically. `startSlot` continues from the count of
// page-pin cards already kept on the board, so a card added in an EARLIER
// reconcile pass is never revisited — "no overlap on arrival" holds for
// cards arriving together in one pass without needing real collision
// detection against a writer's own freely-arranged (and freely-overlapped,
// per S3) existing cards.
const RECONCILE_CARD_W = 0.22;
const RECONCILE_CARD_H = 0.1;
const RECONCILE_GAP = 0.03;
const RECONCILE_COLS = 3;

function placeNewCards(newPages: JournalEntry[], startSlot: number, startZ: number): Box[] {
  return newPages.map((page, i) => {
    const slot = startSlot + i;
    const col = slot % RECONCILE_COLS;
    const row = Math.floor(slot / RECONCILE_COLS);
    const box: Box = {
      id: generateId(),
      kind: 'page-pin',
      x: 0.05 + col * (RECONCILE_CARD_W + RECONCILE_GAP),
      y: 0.06 + row * (RECONCILE_CARD_H + RECONCILE_GAP),
      w: RECONCILE_CARD_W,
      h: RECONCILE_CARD_H,
      z: startZ + i,
      entryId: page.id,
    };
    return box;
  });
}

// The reconcile itself. Returns the NEW boxes array to persist, or `null`
// if nothing changed — idempotence made checkable, not just claimed:
// calling this twice in a row against unchanged stored truth returns `null`
// the second time, so BoardEditor's own caller never even re-renders, let
// alone re-persists (b1.mjs's own "run it twice, byte-identical boxes"
// check calls this directly). EXISTING cards (kept, below) are copied by
// reference from the current array, unmodified — their x/y/w/h/z survive
// byte-identical through any number of reconcile passes, which is the
// entire content of "arrangement is never touched by reconcile."
export function reconcileSystemBoard(boardId: string): Box[] | null {
  const board = getJournalEntry(boardId);
  if (!board || board.pageType !== 'board') return null;
  const kind = getSystemKind(board);
  if (!kind) return null;

  const boxes = board.boxes ?? [];
  const qualifying = qualifyingPagesFor(kind, boardId);
  const qualifyingIds = new Set(qualifying.map(p => p.id));
  const existingPins = boxes.filter(b => b.kind === 'page-pin');
  const existingPinnedIds = new Set(existingPins.map(b => b.entryId).filter((eid): eid is string => !!eid));

  // Cards whose page no longer qualifies leave (deleted, for the Journal
  // Board; restored or re-homed, for the Trash Board — either way, the
  // underlying real act already happened elsewhere; this only ever reacts).
  const staleIds = new Set(existingPins.filter(b => !b.entryId || !qualifyingIds.has(b.entryId)).map(b => b.id));
  // Qualifying pages missing a card gain one.
  const missing = qualifying.filter(p => !existingPinnedIds.has(p.id)).sort((a, b) => a.id.localeCompare(b.id));

  if (staleIds.size === 0 && missing.length === 0) return null; // idempotent no-op

  const kept = boxes.filter(b => !staleIds.has(b.id));
  const keptPinCount = kept.filter(b => b.kind === 'page-pin').length;
  const startZ = kept.reduce((m, b) => Math.max(m, b.z), 0) + 1;
  const newBoxes = placeNewCards(missing, keptPinCount, startZ);
  return [...kept, ...newBoxes];
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
