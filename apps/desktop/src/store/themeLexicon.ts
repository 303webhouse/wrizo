import { useEffect, useState } from 'react';
import { useTheme, type ThemeId } from './theme';

// TH1 Slice 1 — lexicon projection (canon §5). Display projection ONLY: data,
// schema, routes, sync, and search keep the canonical nouns below forever — a
// search for "drawer" must still work under any theme. This module maps a
// canonical term ID to the CURRENT theme's display string, falling through to
// the canonical noun when the active theme has no override (an unknown theme
// id, or a theme that hasn't claimed this term yet).
export type TermId =
  | 'page' | 'shelf' | 'drawer' | 'binder' | 'box' | 'board' | 'notebook'
  | 'journal' | 'plan' | 'milestone' | 'freewrite' | 'home' | 'voicewall'
  | 'publish' | 'script';

// The canonical noun IS Plateau's display string — Plateau is the default
// theme, so its lexicon entry is the identity map (canon §5's "Canonical"
// column). NOTE 'freewrite' reads "Free write" (no hyphen) to match the one
// live call site (JournalEntry's mode tab) byte-for-byte — the canon doc's
// "Free-write" is the concept name, not a pinned literal; flagged in the
// ship report, not "fixed" on either side.
const CANONICAL: Record<TermId, string> = {
  page: 'Pages',
  shelf: 'Shelf',
  drawer: 'Drawer',
  binder: 'Binder',
  box: 'Boxes',
  board: 'Board',
  notebook: 'Notebook',
  journal: 'Journal',
  plan: 'Plan',
  milestone: 'Milestones',
  freewrite: 'Free write',
  home: 'Home',
  voicewall: 'Voice Wall',
  publish: 'Publish',
  script: 'Script',
};

// Themes register overrides here (TH2 adds a 'flux' entry — a Partial, so a
// theme may leave any term unclaimed and fall through to canonical). Empty
// for every theme in TH1: the seam carries zero Flux content.
const OVERRIDES: Partial<Record<ThemeId, Partial<Record<TermId, string>>>> = {};

export function lexiconFor(theme: ThemeId, term: TermId): string {
  return OVERRIDES[theme]?.[term] ?? CANONICAL[term];
}

export function t(term: TermId, theme?: ThemeId): string {
  return lexiconFor(theme ?? (typeof document !== 'undefined'
    ? (document.documentElement.getAttribute('data-theme') as ThemeId | null) ?? 'plateau'
    : 'plateau'), term);
}

// Reactive accessor — re-renders on a theme switch (TH2 wires the pref UI).
export function useLexicon(): (term: TermId) => string {
  const theme = useTheme();
  const [, setTick] = useState(0);
  useEffect(() => { setTick(n => n + 1); }, [theme]);
  return (term: TermId) => lexiconFor(theme, term);
}

// Test/inspection seam (the resumeVocab.ts / wrizoVocab pattern) — the
// harness reads term->string projections directly rather than scraping DOM
// text for every surface.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoLexicon?: unknown }).wrizoLexicon = { t, CANONICAL_TERMS: Object.keys(CANONICAL) };
}
