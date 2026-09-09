import type { CascadeSurveyKind, CategoryId } from '../components/CascadePanels';

// PW1 S4 + S5 — THE TRAIL IS THE RAIL. Two small memories, one module,
// because they are two halves of the same idea: the rail should not forget
// what the writer just did with it.
//
// S4 — THE HANDOFF (in-memory, ONE-SHOT). `useCascade` holds its state in
// `useState`, which is per-surface: a travel unmounts the whole hook and the
// destination mounts at REST, so today a writer who reaches a card through the
// rail arrives with the rail shut and no way back but the browser's own. This
// is the arc's one piece of genuine plumbing, and it is named honestly rather
// than pretended away (PW6/Objection 4). A travel ORIGINATED FROM THE CASCADE
// stages its own category+survey here immediately before `navigate()`; the
// destination's `useCascade` takes it (read-and-clear) as its initial state, so
// the panel and the survey arrive already open, on the same board, with the
// origin row wearing the `current` mark `buildSurvey` already computes.
//
// Deliberately NOT persisted, and deliberately one-shot: this is a baton passed
// between two mounts of one gesture, not a preference. A reload is a new
// journey and should start at rest. Read-and-clear means an ordinary navigation
// that happens to follow a cascade travel never inherits a stale rail.
//
// S5 — STICKINESS (persisted, per page). `store/boardMode.ts`'s shape exactly
// (and `sectionFold` before it): ONE localStorage key holding a MAP keyed by
// the STABLE page id, a module-level cache, try/catch on every touch, an absent
// key meaning simply "never opened one." Not a configured relationship — the
// machine declining to forget, restoring only a board the writer THEMSELVES
// opened. A board that no longer exists is inert: `buildSurvey` recomputes from
// storage every render, so a stale id yields an empty survey the `‹` walks out
// of. No reaper, nothing to migrate, zero schema.

// --- S4 · the handoff ------------------------------------------------------

export interface CascadeHandoff {
  category: CategoryId;
  survey: CascadeSurveyKind | null;
}

let staged: CascadeHandoff | null = null;

/** Stage the rail's current shape across one travel. Called immediately before navigate(). */
export function stageCascadeHandoff(handoff: CascadeHandoff): void {
  staged = handoff;
}

/** Take the staged rail shape, if any, and clear it. Called once per mount by useCascade. */
export function takeCascadeHandoff(): CascadeHandoff | null {
  const h = staged;
  staged = null;
  return h;
}

// --- S5 · stickiness -------------------------------------------------------

const KEY = 'wrizo-plan-last-board';

type LastBoardMap = Record<string, string>;

function load(): LastBoardMap {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as LastBoardMap) : {};
  } catch {
    return {};
  }
}

let current: LastBoardMap = load();

/** The board whose contents this page last had open in the Plan survey, or null. */
export function getLastPlanBoard(pageId: string): string | null {
  const id = current[pageId];
  return typeof id === 'string' && id ? id : null;
}

/** Remember that this page opened this board's contents. */
export function rememberLastPlanBoard(pageId: string, boardId: string): void {
  if (current[pageId] === boardId) return;
  current = { ...current, [pageId]: boardId };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
}

// Test/inspection seam — persistence.ts's own `wrizoPinPageToBoard` shape.
// The harness needs to read stickiness back without reaching into the key by
// hand (the raw-localStorage hazard the seeding law names).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoPlanTrail?: unknown }).wrizoPlanTrail = { getLastPlanBoard, rememberLastPlanBoard };
}
