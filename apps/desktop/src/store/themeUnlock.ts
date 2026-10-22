import { useEffect, useState } from 'react';
import type { ThemeId } from './theme';

// THEME PICKER (Fable, Oct 21 — theme-menu-brief.md / theme-rules.md §C / theme-unlock-count's
// own already-shipped schema). A theme is OPEN if ANY of: its lifetime word-count threshold is
// met, it's already in `themesOpened` (the grandfather set), or it's the theme currently in
// use — the third clause is pure client state and needs no server round-trip (Fable's own
// ruling on the schema ticket: "no new signal needed").
//
// "Once open, always open" falls out for free: `wordsWritten` only ever grows
// (theme-unlock-count's own counter) and `themesOpened` is append-only, so neither clause can
// ever un-open a theme once it has.

export interface ThemeUnlockStatus {
  wordsWritten: number;
  themesOpened: Record<string, boolean>;
  thresholds: Record<string, number>;
}

const EMPTY: ThemeUnlockStatus = { wordsWritten: 0, themesOpened: {}, thresholds: {} };

export function isThemeOpen(id: ThemeId, status: ThemeUnlockStatus, currentTheme: ThemeId): boolean {
  if (id === currentTheme) return true;
  if (status.themesOpened?.[id]) return true;
  const threshold = status.thresholds?.[id];
  return threshold != null && status.wordsWritten >= threshold;
}

/** 0 once open — never negative, never shown once the threshold is already met. */
export function wordsToUnlock(id: ThemeId, status: ThemeUnlockStatus): number {
  const threshold = status.thresholds?.[id] ?? 0;
  return Math.max(0, threshold - (status.wordsWritten ?? 0));
}

// GET-only: nothing here ever writes words_written/themes_opened from the client - only an
// accepted page save (server-side) and the migration's own backfill do (theme-unlock-count's
// own house law). Fetched lazily when the picker itself mounts, not hydrated at boot like
// page-defaults/proofing — "once open, always open" and a lifetime word count don't need
// split-second freshness, and the picker is the only consumer today.
export async function fetchThemeUnlockStatus(): Promise<ThemeUnlockStatus> {
  try {
    const r = await fetch('/api/theme-unlock', { credentials: 'include' });
    if (!r.ok) return EMPTY;   // signed out (no session) or offline — the picker falls back to current-theme-only
    const body = await r.json();
    return {
      wordsWritten: typeof body?.wordsWritten === 'number' ? body.wordsWritten : 0,
      themesOpened: body?.themesOpened && typeof body.themesOpened === 'object' ? body.themesOpened : {},
      thresholds: body?.thresholds && typeof body.thresholds === 'object' ? body.thresholds : {},
    };
  } catch {
    return EMPTY;   // offline — the picker falls back to current-theme-only until it can ask again
  }
}

/** Fetches once per mount. While loading (or signed out/offline), callers see EMPTY — every
 *  theme but the current one reads locked, never a stale "open" flash. */
export function useThemeUnlockStatus(): ThemeUnlockStatus {
  const [status, setStatus] = useState<ThemeUnlockStatus>(EMPTY);
  useEffect(() => {
    let active = true;
    void fetchThemeUnlockStatus().then((s) => { if (active) setStatus(s); });
    return () => { active = false; };
  }, []);
  return status;
}
