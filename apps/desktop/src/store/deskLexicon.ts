import { useEffect, useState } from 'react';
import { useTheme, type ThemeId } from './theme';
import type { DeskTermId } from './lexicon/terms';
import { CANONICAL_CHROME } from './lexicon/canonical/chrome';
import { CANONICAL_DECKS } from './lexicon/canonical/decks';
import { CANONICAL_SETTINGS } from './lexicon/canonical/settings';
import { CANONICAL_HELP } from './lexicon/canonical/help';
import { FLUX_OVERRIDES } from './lexicon/overrides/flux';
import { MACHINA_OVERRIDES } from './lexicon/overrides/machina';

// the desk lexicon: every user-facing zone/module/mode name, one flat map keyed by DeskTermId; a theme overrides only what it wants and the rest falls through; a sibling of themeLexicon so the two casings of Free Write never collide [deskLexicon §1]
export type { DeskTermId } from './lexicon/terms';
const CANONICAL: Record<DeskTermId, string> = {
  ...CANONICAL_CHROME,
  ...CANONICAL_DECKS,
  ...CANONICAL_SETTINGS,
  ...CANONICAL_HELP,
};

// Flux registers its own capture-module name (the app's other live theme
// already renames the same module 'Log' over in themeLexicon.ts's 'journal'
// term) — kept in step here so the two seams never visibly disagree under
// the same theme, even though they're independent maps.
const OVERRIDES: Partial<Record<ThemeId, Partial<Record<DeskTermId, string>>>> = {
  ...FLUX_OVERRIDES,
  ...MACHINA_OVERRIDES,
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
