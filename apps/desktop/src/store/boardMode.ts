import { useEffect, useState } from 'react';

// BM1 S3 — the board's mode choice, persisted per board, client-local, ZERO
// schema. The FX9 sectionFold family exactly (store/sectionFold.ts): ONE
// localStorage key holding a MAP (boardId → mode) rather than a single flag,
// because a board's mode is per-entity and unbounded; a module-level `current`
// cache; a Set of subscriber callbacks; try/catch on every localStorage touch;
// an absent key is simply "never chosen," never an error. Nothing here is a
// server row.
//
// Keys ride the STABLE board id (never its title) — the same content-independent
// discipline sectionFold's own keys follow. Default OPEN (the brief's law). A
// mode for a board that no longer exists is inert, left to rot, no reaper.

export type BoardMode = 'open' | 'storyboard' | 'outline';

const MODES: BoardMode[] = ['open', 'storyboard', 'outline'];
const KEY = 'wrizo-board-mode';

type ModeMap = Record<string, BoardMode>;

function load(): ModeMap {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as ModeMap) : {};
  } catch {
    return {};
  }
}

let current: ModeMap = load();
const subs = new Set<() => void>();

function persist(): void {
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  subs.forEach((fn) => fn());
}

export function getBoardMode(boardId: string): BoardMode {
  const m = current[boardId];
  return m && MODES.includes(m) ? m : 'open';
}

export function setBoardMode(boardId: string, mode: BoardMode): void {
  if (current[boardId] === mode) return; // no-op write, no spurious notify
  current = { ...current, [boardId]: mode };
  persist();
}

// [mode, setMode] for one board — re-renders on any board's mode change (cheap;
// the map is tiny). Default OPEN until the writer chooses otherwise.
export function useBoardMode(boardId: string): [BoardMode, (m: BoardMode) => void] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    subs.add(fn);
    return () => { subs.delete(fn); };
  }, []);
  const mode = getBoardMode(boardId);
  return [mode, (m: BoardMode) => setBoardMode(boardId, m)];
}

// Test/inspection seam (the wrizoSectionFold convention).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoBoardMode?: unknown }).wrizoBoardMode = {
    get: getBoardMode, set: setBoardMode,
  };
}
