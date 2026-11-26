import { useEffect, useState } from 'react';
import type { ThemeId } from './theme';
import type { SyncStatus } from './sync';

// a theme is OPEN if the server's precomputed `open` map says so, or it is the theme in use (the one clause the server cannot know); this file only reads [themeUnlock §1]

export interface ThemeUnlockStatus {
  wordsWritten: number;
  themesOpened: Record<string, boolean>;
  thresholds: Record<string, number>;
  open: Record<string, boolean>;   // server-derived: threshold met OR themesOpened
}

export function isThemeOpen(id: ThemeId, status: ThemeUnlockStatus | null, currentTheme: ThemeId): boolean {
  if (id === currentTheme) return true;
  return !!status?.open?.[id];
}

// Readouts state only true things (theme-rules.md §A.6): `null` means "no real number to show"
// - either the fetch hasn't resolved/failed (status is null), or this theme has no threshold
// entry at all yet. Callers must render NO note in that case, never a guessed/zero count.
export function wordsToUnlock(id: ThemeId, status: ThemeUnlockStatus | null): number | null {
  const threshold = status?.thresholds?.[id];
  if (threshold == null) return null;
  return Math.max(0, threshold - (status?.wordsWritten ?? 0));
}

// GET-only: nothing here ever writes words_written/themes_opened from the client - only an
// accepted page save (server-side) and the migration's own backfill do (theme-unlock-count's
// own house law). Fetched lazily, not hydrated at boot like page-defaults/proofing: the picker
// is the only consumer today, and it reads when it opens and after each accepted sync (#132).
//
// Returns null (not an EMPTY-but-truthy object) on any failure or non-ok response, so a caller
// can tell "no data yet" apart from "the server said nothing is open" - the distinction note
// (a) needs: a locked card with no data shows no number at all, never "0 more words".
export async function fetchThemeUnlockStatus(): Promise<ThemeUnlockStatus | null> {
  try {
    const r = await fetch('/api/theme-unlock', { credentials: 'include' });
    if (r.status === 401) forgetThemeUnlock();
    if (!r.ok) return null;   // signed out (no session) or a server error
    const body = await r.json();
    return {
      wordsWritten: typeof body?.wordsWritten === 'number' ? body.wordsWritten : 0,
      themesOpened: body?.themesOpened && typeof body.themesOpened === 'object' ? body.themesOpened : {},
      thresholds: body?.thresholds && typeof body.thresholds === 'object' ? body.thresholds : {},
      open: body?.open && typeof body.open === 'object' ? body.open : {},
    };
  } catch {
    return null;   // offline
  }
}

// #132: the last status the server gave this session, in memory only (nothing is saved), so a failed read shows the cards as they last were. Sign-out and a 401 forget it.
let lastStatus: ThemeUnlockStatus | null = null;
export function forgetThemeUnlock(): void { lastStatus = null; }

/** One read: the server's answer, or the last one it gave when this read fails (null if it never gave one). */
export async function readThemeUnlock(): Promise<ThemeUnlockStatus | null> {
  const fresh = await fetchThemeUnlockStatus();
  if (fresh) lastStatus = fresh;
  return lastStatus;
}

type SyncWatch = (listener: (status: SyncStatus) => void) => () => void;

/** Reads each time the picker opens, and again after each accepted sync while it is open (`watchSync` is store/sync.ts's subscribeSyncStatus, handed in so this file stays free of the sync engine).
 *  While nothing has ever been read (signed out, offline), callers see null: every theme but the current one reads locked with no note, never a guessed count. */
export function useThemeUnlockStatus(watchSync: SyncWatch): ThemeUnlockStatus | null {
  const [status, setStatus] = useState<ThemeUnlockStatus | null>(lastStatus);
  useEffect(() => {
    let active = true;
    let asked = 0;
    // only the newest read speaks: an older answer that lands late is dropped
    const read = () => { const mine = ++asked; void readThemeUnlock().then((s) => { if (active && mine === asked) setStatus(s); }); };
    let subscribing = true;   // the watcher is told the current status at once; that is not a new sync
    const stop = watchSync((s) => { if (!subscribing && s === 'synced') read(); });
    subscribing = false;
    read();
    return () => { active = false; stop(); };
  }, [watchSync]);
  return status;
}
