import type { Drawer, JournalEntry, Project } from '../types';
import {
  createProject, getDrawer, getDrawers, getJournalEntries, getJournalEntry, getJournalEntryIncludingDeleted, getProject, getProjects,
  getSystemKind, hasAnyDrawerRow, isPairedPlanBoard, saveDrawer, saveJournalEntry, saveProject, setPageHome, setProjectDrawer,
} from './persistence';

// BIG PROJECTS, STEP 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18). THE PLACE: "where you are" is always a Drawer or a Journal.
//
// SCHEMA CHANGE: NONE. Everything here is rows in collections that already exist (drawers, projects, journal_entries) plus two per-device
// localStorage keys (the place, the open counts). A SET is a `projects` row with a `drawerId`; the FIRST JOURNAL is not a row at all but a
// read-time rule over the pages with no live home. Nothing is moved behind the writer's back: the Top Drawer bootstrap only ever ADDS a Drawer
// and its one set, and only for an account that has never had a Drawer row.
//
// Pure data: it imports no component, owns no layout, and every reader below WRITES NOTHING (the views never touch orderIndex).

export type PlaceKind = 'drawer' | 'journal';

/** Where the writer is. `id` is a Drawer id, 'unsorted' (the virtual group of binders with no live Drawer) or 'journal'. */
export interface Place { kind: PlaceKind; id: string; setId: string | null }

export const UNSORTED = 'unsorted';
export const JOURNAL = 'journal';

export interface SectionGroup { set: Project | null; items: JournalEntry[] }
export type SectionView = 'pages' | 'boards';

/** The name a new account's top drawer is born with. Flux shows it as "Root" - but only while it is still this (a renamed one shows its own name). */
export const DEFAULT_TOP_NAME = 'Top Drawer';
const TOP_DRAWER_PREFIX = 'top-drawer-';
const topDrawerId = (uid: string): string => `${TOP_DRAWER_PREFIX}${uid}`;
const topSetId = (uid: string): string => `top-set-${uid}`;
const autoSetId = (drawerId: string): string => `auto-set-${drawerId}`;

// ---- Top Drawer ---------------------------------------------------------------------------------------------------------------------------

/**
 * Give a brand-new account its Top Drawer and its one set. Called once, after the first whole-account pull, and ONLY when the account has never
 * had a Drawer row (a soft-deleted Drawer and a delete-for-good shell both count, so a writer who deleted it is never handed another). The ids
 * carry the user id and are deterministic: two devices that both bootstrap before they sync write the SAME rows, so last-write-wins makes one
 * (drawers.id is a global primary key, so the id must also differ between accounts). Returns whether it wrote.
 */
export function ensureTopDrawer(uid: string): boolean {
  if (!uid || hasAnyDrawerRow()) return false;
  const now = new Date().toISOString();
  const drawer: Drawer = { id: topDrawerId(uid), name: DEFAULT_TOP_NAME, order: 0, createdAt: now, updatedAt: now };
  saveDrawer(drawer);
  const set: Project = { id: topSetId(uid), title: DEFAULT_TOP_NAME, type: 'creative', storyPlanId: null, drawerId: drawer.id, createdAt: now, updatedAt: now };
  saveProject(set);
  return true;
}

/**
 * FLUX V2 - is this the account's untouched top drawer? A render-time question only (the Root word, ruled Oct 21): true for the born-with id AND the born-with name, so a drawer the
 * writer renamed keeps its own name. Nothing here ever writes a name.
 */
export function isDefaultRoot(d: { id: string; name: string }): boolean {
  return d.id.startsWith(TOP_DRAWER_PREFIX) && d.name === DEFAULT_TOP_NAME;
}

// ---- The first Journal (a read-time rule, no row) ----------------------------------------------------------------------------------------------

// A page has a live home when it names a set that exists and is not deleted or purged.
function hasLiveHome(e: JournalEntry): boolean {
  return e.projectId != null && getProject(e.projectId) != null;
}

/**
 * The pages and boards of the first Journal: every live, non-system, non-plan-face entry with no live home (projectId null, or naming a set that
 * is missing, deleted or purged). A strict SUPERSET of today's Journal (inJournalView) plus the Shelf (belongsOnShelf) - the Shelf merge is
 * display only, and a loose page pinned on a board (in neither old list) is no longer lost between them. Shells never surface.
 */
export function journalMembers(): JournalEntry[] {
  return getJournalEntries().filter(e => {
    if (e.deletedAt || e.purgedAt) return false;
    if (getSystemKind(e)) return false;
    if (isPairedPlanBoard(e.id)) return false;
    if (e.projectId == null) return true;
    if (!hasLiveHome(e)) return true;
    return false;
  });
}

// ---- Sets and sections --------------------------------------------------------------------------------------------------------------------

/** A Drawer's sets in creation order. 'unsorted' lists the binders with no live Drawer. */
export function setsOfDrawer(drawerId: string): Project[] {
  const liveDrawers = new Set(getDrawers().map(d => d.id));
  const all = getProjects();
  const mine = drawerId === UNSORTED
    ? all.filter(p => !p.drawerId || !liveDrawers.has(p.drawerId))
    : all.filter(p => p.drawerId === drawerId);
  return mine.map((p, i) => ({ p, i })).sort((a, b) => a.p.createdAt.localeCompare(b.p.createdAt) || a.i - b.i).map(x => x.p);
}

/** The writer's own order: an explicit orderIndex first, then creation order. A comparison only - it never writes. */
export function compareSections(a: JournalEntry, b: JournalEntry): number {
  const ai = a.orderIndex, bi = b.orderIndex;
  if (ai !== undefined && bi !== undefined && ai !== bi) return ai - bi;
  if (ai !== undefined && bi === undefined) return -1;
  if (ai === undefined && bi !== undefined) return 1;
  return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}

const isBoard = (e: JournalEntry): boolean => e.pageType === 'board';
const ofView = (view: SectionView) => (e: JournalEntry): boolean => (view === 'boards' ? isBoard(e) : !isBoard(e));

/**
 * What a pop-out lists: groups of sections (pages, or boards) in the writer's order. A set with nothing of that kind is absent. A Journal is one
 * flat group (set: null). System boards and a page's plan face are never sections.
 */
export function sectionsOf(place: Pick<Place, 'kind' | 'id'>, view: SectionView): SectionGroup[] {
  const want = ofView(view);
  if (place.kind === 'journal') {
    const items = journalMembers().filter(want).sort(compareSections);
    return items.length ? [{ set: null, items }] : [];
  }
  const live = getJournalEntries().filter(e => !getSystemKind(e) && !isPairedPlanBoard(e.id) && want(e));
  const out: SectionGroup[] = [];
  for (const set of setsOfDrawer(place.id)) {
    const items = live.filter(e => e.projectId === set.id).sort(compareSections);
    if (items.length) out.push({ set, items });
  }
  return out;
}

/**
 * FLUX V2 - TRK n/m: where a section really sits. Its position (1-based, in the writer's own Order) among the sections of its set, counting only its own kind (a board among boards),
 * or - for a page in the Journal - among the Journal's pages. Null for an entry no pop-out lists (a system board, a plan face).
 */
export function trackOf(e: JournalEntry): { n: number; m: number } | null {
  const view: SectionView = isBoard(e) ? 'boards' : 'pages';
  for (const g of sectionsOf(placeOfEntry(e), view)) {
    const i = g.items.findIndex((x) => x.id === e.id);
    if (i >= 0) return { n: i + 1, m: g.items.length };
  }
  return null;
}

/** Set headings show only once a second set exists - the word "set" appears nowhere before that. A Journal has none. */
export function showSetHeadings(place: Pick<Place, 'kind' | 'id'>): boolean {
  return place.kind === 'drawer' && setsOfDrawer(place.id).length > 1;
}

/** The one set a Drawer needs to hold a page. Lazy: made on the first need, never on creating the Drawer. Null for a Drawer that is gone. */
export function ensureSet(drawerId: string): Project | null {
  const d = getDrawer(drawerId);
  if (!d || d.deletedAt) return null;
  const existing = setsOfDrawer(drawerId)[0];
  if (existing) return existing;
  const now = new Date().toISOString();
  saveProject({ id: autoSetId(drawerId), title: d.name, type: 'creative', storyPlanId: null, drawerId, createdAt: now, updatedAt: now });
  return getProject(autoSetId(drawerId));
}

/** + New set: another set in a Drawer (it sorts last). */
export function createSet(drawerId: string, title: string): Project {
  const p = createProject(title.trim() || 'New set', 'creative');
  setProjectDrawer(p.id, drawerId);
  return getProject(p.id) as Project;
}

/** Where a page lives now. */
export function placeOfEntry(e: JournalEntry): Place {
  if (e.projectId != null) {
    const set = getProject(e.projectId);
    if (set) {
      const drawer = set.drawerId ? getDrawer(set.drawerId) : null;
      return { kind: 'drawer', id: drawer ? drawer.id : UNSORTED, setId: set.id };
    }
  }
  return { kind: 'journal', id: JOURNAL, setId: null };
}

// ---- The place on this device -------------------------------------------------------------------------------------------------------------

const placeKey = (uid: string): string => `wz.place.${uid}`;
const opensKey = (uid: string): string => `wz.opens.${uid}`;

function readJson<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
function writeJson(key: string, v: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* blocked or full: this device simply does not remember */ }
}

function unsortedSets(): Project[] { return setsOfDrawer(UNSORTED); }

function validPlace(p: Place | null): p is Place {
  if (!p || typeof p.id !== 'string') return false;
  if (p.kind === 'journal') return p.id === JOURNAL;
  if (p.kind !== 'drawer') return false;
  if (p.id === UNSORTED) return unsortedSets().length > 0;
  return getDrawer(p.id) != null;
}

/** The place for this account on this device: the stored one if it still exists, else the first live Drawer by order, else the Journal. */
export function getPlace(uid: string): Place {
  const stored = readJson<Place>(placeKey(uid));
  if (validPlace(stored)) {
    const set = stored.setId ? getProject(stored.setId) : null;
    return { kind: stored.kind, id: stored.id, setId: set ? set.id : null };
  }
  const first = getDrawers().slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
  return first ? { kind: 'drawer', id: first.id, setId: null } : { kind: 'journal', id: JOURNAL, setId: null };
}

const placeListeners = new Set<() => void>();
/** The place is not a collection, so the store's own subscribe never hears it change; this is the one channel that does. */
export function onPlaceChange(fn: () => void): () => void { placeListeners.add(fn); return () => { placeListeners.delete(fn); }; }

export function setPlace(uid: string, place: Place): void {
  const next = { kind: place.kind, id: place.id, setId: place.setId ?? null };
  const cur = readJson<Place>(placeKey(uid));
  if (cur && cur.kind === next.kind && cur.id === next.id && (cur.setId ?? null) === next.setId) return;   // already here: no write, no re-render
  writeJson(placeKey(uid), next);
  placeListeners.forEach(fn => { try { fn(); } catch { /* a listener must never break a place change */ } });
}

/** The place follows the page the writer opens. A system board (Journal, Trash) has no place of its own and leaves it where it is. */
export function followEntry(uid: string, e: JournalEntry | null): void {
  if (!e || getSystemKind(e)) return;
  setPlace(uid, placeOfEntry(e));
}

/** The switcher's list: Drawers by order, the virtual Unsorted group only when such binders exist, then the Journals (one, for now). */
export function listPlaces(): { drawers: Drawer[]; unsorted: Project[]; journals: { id: string; name: string }[] } {
  return {
    drawers: getDrawers().slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    unsorted: unsortedSets(),
    journals: [{ id: JOURNAL, name: 'Journal' }],
  };
}

// ---- Order: the writer's own, written only by a deliberate reorder ----------------------------------------------------------------------------------

/** Write the writer's order for these ids (their position in the list), touching only the pages whose index changes. Returns how many were written. */
export function reorderSections(ids: string[]): number {
  let n = 0;
  ids.forEach((id, i) => {
    const e = getJournalEntry(id);
    if (!e) return;
    if (e.orderIndex === i) return;
    saveJournalEntry({ ...e, orderIndex: i });
    n += 1;
  });
  return n;
}

// ---- X to the Journal, and Undo ------------------------------------------------------------------------------------------------------------

export interface MoveToken { id: string; setId: string }

/** X on a section: out of its set, into the Journal. Only projectId changes (setPageHome) - position and everything else stay, nothing is deleted. */
export function moveToJournal(entryId: string): MoveToken | null {
  const e = getJournalEntry(entryId);
  if (!e || e.projectId == null) return null;
  const token: MoveToken = { id: entryId, setId: e.projectId };
  setPageHome(entryId, 'journal');
  return token;
}

/** Undo: back into the same set, in the same position (orderIndex was never touched). Does nothing for a page deleted or purged meanwhile, a set that is gone, or a page filed elsewhere since. */
export function undoMoveToJournal(token: MoveToken): boolean {
  const e = getJournalEntryIncludingDeleted(token.id);
  if (!e || e.deletedAt || e.purgedAt) return false;
  if (e.projectId != null) return false;
  if (!getProject(token.setId)) return false;
  return setPageHome(token.id, token.setId) === 'filed';
}

// ---- Most opened: a count kept on this device, never synced ------------------------------------------------------------------------------------

export function noteOpen(uid: string, entryId: string): void {
  const o = readJson<Record<string, number>>(opensKey(uid)) ?? {};
  o[entryId] = (o[entryId] ?? 0) + 1;
  writeJson(opensKey(uid), o);
}

/** The counts for live pages only (pruned on read, never written back). */
export function getOpens(uid: string): Record<string, number> {
  const o = readJson<Record<string, number>>(opensKey(uid)) ?? {};
  const out: Record<string, number> = {};
  for (const id of Object.keys(o)) if (getJournalEntry(id)) out[id] = o[id];
  return out;
}
