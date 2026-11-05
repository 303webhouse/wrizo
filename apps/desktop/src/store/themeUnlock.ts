import { useEffect, useState } from 'react';
import type { ThemeId } from './theme';

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
// own house law). Fetched lazily when the picker itself mounts, not hydrated at boot like
// page-defaults/proofing — "once open, always open" and a lifetime word count don't need
// split-second freshness, and the picker is the only consumer today.
//
// Returns null (not an EMPTY-but-truthy object) on any failure or non-ok response, so a caller
// can tell "no data yet" apart from "the server said nothing is open" - the distinction note
// (a) needs: a locked card with no data shows no number at all, never "0 more words".
export async function fetchThemeUnlockStatus(): Promise<ThemeUnlockStatus | null> {
  try {
    const r = await fetch('/api/theme-unlock', { credentials: 'include' });
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

/** Fetches once per mount. While loading (or signed out/offline), callers see null - every
 *  theme but the current one reads locked with no note, never a stale "open" or a guessed count. */
export function useThemeUnlockStatus(): ThemeUnlockStatus | null {
  const [status, setStatus] = useState<ThemeUnlockStatus | null>(null);
  useEffect(() => {
    let active = true;
    void fetchThemeUnlockStatus().then((s) => { if (active) setStatus(s); });
    return () => { active = false; };
  }, []);
  return status;
}
