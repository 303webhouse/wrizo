import { useEffect, useState } from 'react';
import type { BoardView } from './boardKind';

// BM1 S3 — the board's mode choice, persisted per board, client-local, ZERO
// schema. The FX9 sectionFold family exactly (store/sectionFold.ts): ONE
// localStorage key holding a MAP (boardId → mode) rather than a single flag,
// because a board's mode is per-entity and unbounded; a module-level `current`
// cache; a Set of subscriber callbacks; try/catch on every localStorage touch;
// an absent key is simply "never chosen," never an error. Nothing here is a
// server row.
//
// Keys ride the STABLE board id (never its title) — the same content-independent
// discipline sectionFold's own keys follow. A mode for a board that no longer
// exists is inert, left to rot, no reaper.
//
// W1 (the Walk, board kinds and "Show as"): the mode is now one of SIX views - a Board's Open / Storyboard / Outline / Walk and a Book's Flip / Thumbnails (store/boardKind.ts) - and this map is
// the device-local "LAST SHOWN AS". What a board shows when nothing has been chosen on this device is its HOME VIEW (the board-meta homeView, a Deck's Walk, a Book's Flip), else Open (the BM1
// law, kept: a board with no field opens in Open). It also remembers, per board, the view the writer was in BEFORE stepping into the Walk, so Esc can leave for "the board in its last shown view".

export type BoardMode = BoardView;

const MODES: BoardMode[] = ['open', 'storyboard', 'outline', 'walk', 'flip', 'thumbnails'];
const KEY = 'wrizo-board-mode';
const BEFORE_WALK_KEY = 'wrizo-board-before-walk';

type ModeMap = Record<string, BoardMode>;

function load(key: string): ModeMap {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as ModeMap) : {};
  } catch {
    return {};
  }
}

let current: ModeMap = load(KEY);
let beforeWalk: ModeMap = load(BEFORE_WALK_KEY);
const subs = new Set<() => void>();

function persist(): void {
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  try { localStorage.setItem(BEFORE_WALK_KEY, JSON.stringify(beforeWalk)); } catch { /* ignore */ }
  subs.forEach((fn) => fn());
}

/** The view to show: what was last shown on this device, else the board's home view, else Open. */
export function getBoardMode(boardId: string, homeView?: BoardMode): BoardMode {
  const m = current[boardId];
  return m && MODES.includes(m) ? m : (homeView && MODES.includes(homeView) ? homeView : 'open');
}

/** Show a board as `mode`. `from` is the view being left (the one on screen); stepping INTO the Walk records it, for the Esc that leaves. */
export function setBoardMode(boardId: string, mode: BoardMode, from?: BoardMode): void {
  if (mode === 'walk' && from && from !== 'walk' && beforeWalk[boardId] !== from) beforeWalk = { ...beforeWalk, [boardId]: from };
  if (current[boardId] === mode) { if (mode === 'walk') persist(); return; }   // no-op write, no spurious notify
  current = { ...current, [boardId]: mode };
  persist();
}

/** The view Esc leaves the Walk for: the one shown before the Walk, else the home view if it is not the Walk, else Open. */
export function lastShownBeforeWalk(boardId: string, homeView?: BoardMode): BoardMode {
  const b = beforeWalk[boardId];
  if (b && MODES.includes(b) && b !== 'walk') return b;
  return homeView && homeView !== 'walk' && MODES.includes(homeView) ? homeView : 'open';
}

// [mode, setMode] for one board — re-renders on any board's mode change (cheap;
// the map is tiny). Home view until the writer chooses otherwise on this device.
export function useBoardMode(boardId: string, homeView?: BoardMode): [BoardMode, (m: BoardMode, from?: BoardMode) => void] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    subs.add(fn);
    return () => { subs.delete(fn); };
  }, []);
  const mode = getBoardMode(boardId, homeView);
  return [mode, (m: BoardMode, from?: BoardMode) => setBoardMode(boardId, m, from ?? mode)];
}

// Test/inspection seam (the wrizoSectionFold convention).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoBoardMode?: unknown }).wrizoBoardMode = {
    get: getBoardMode, set: setBoardMode, before: lastShownBeforeWalk,
  };
}
