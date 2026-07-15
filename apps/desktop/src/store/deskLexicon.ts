import { useEffect, useState } from 'react';
import { useTheme, type ThemeId } from './theme';

// AB1 S5 — the strings-as-theme-vocabulary seam. Every user-facing zone /
// module / mode name DeskFrame introduces, centralized in one flat map keyed
// by DeskTermId, exactly the projection shape store/themeLexicon.ts already
// proved out (a theme overrides only the terms it wants; everything else
// falls through to Plateau's canonical string). Deliberately a SIBLING file,
// not an extension of themeLexicon.ts's own TermId union: that module's
// 'freewrite' term is byte-pinned (its own header comment) to the legacy
// lowercase-w "Free write" used by ModeSwitcher/JournalEntry's tab, which
// AB1 does not touch; the new frame's ratified strings are exact title case
// ("Free Write") and belong to a different seam so the two casings never
// collide at the same TermId. No theme machinery beyond the map itself is
// built here — Nick's ruling that "Journal" is specifically Plateau's name
// for the capture module (not a universal constant) is why the corkboard's
// capture-tab label lives in THIS seam and not as a hardcoded string.
export type DeskTermId =
  | 'modeFreeWrite' | 'modeDraft' | 'modeRevise' | 'modeWorkshop' | 'modePublish'
  | 'zoneWayfinding' | 'zoneToolRail' | 'zoneStage' | 'zoneCorkboard' | 'zoneMeter'
  | 'corkboardJournalTab' | 'deskMenuGlyph';

const CANONICAL: Record<DeskTermId, string> = {
  modeFreeWrite: 'Free Write',
  modeDraft: 'Draft',
  modeRevise: 'Revise',
  modeWorkshop: 'Workshop',
  modePublish: 'Publish',
  zoneWayfinding: 'Wayfinding',
  zoneToolRail: 'Tools',
  zoneStage: 'Page',
  zoneCorkboard: 'Corkboard',
  zoneMeter: 'Meter',
  corkboardJournalTab: 'Journal',
  deskMenuGlyph: 'Desk menu',
};

// Flux registers its own capture-module name (the app's other live theme
// already renames the same module 'Log' over in themeLexicon.ts's 'journal'
// term) — kept in step here so the two seams never visibly disagree under
// the same theme, even though they're independent maps.
const OVERRIDES: Partial<Record<ThemeId, Partial<Record<DeskTermId, string>>>> = {
  flux: {
    corkboardJournalTab: 'Log',
  },
};

function resolveTheme(theme: ThemeId | undefined): ThemeId {
  if (theme) return theme;
  if (typeof document === 'undefined') return 'plateau';
  return (document.documentElement.getAttribute('data-theme') as ThemeId | null) ?? 'plateau';
}

export function deskTerm(term: DeskTermId, theme?: ThemeId): string {
  const resolved = resolveTheme(theme);
  return OVERRIDES[resolved]?.[term] ?? CANONICAL[term];
}

export function useDeskLexicon(): { t: (term: DeskTermId) => string } {
  const theme = useTheme();
  const [, setTick] = useState(0);
  useEffect(() => { setTick(n => n + 1); }, [theme]);
  return { t: (term: DeskTermId) => deskTerm(term, theme) };
}

// Test/inspection seam (the resumeVocab.ts / wrizoLexicon pattern).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoDeskLexicon?: unknown }).wrizoDeskLexicon = {
    t: deskTerm, CANONICAL_TERMS: Object.keys(CANONICAL),
  };
}
