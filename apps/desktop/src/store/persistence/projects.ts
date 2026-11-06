import type { Project, Fragment, FragmentLink } from '../../types';
import { cache, clone, generateId, upsert } from './core';

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
export function stampBeatActivity(projectId: string): void {
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
