import type { JournalEntry } from '../types';

// J6 S2 — one source of routing truth. Before this, the SAME predicate --
// "a typed page (any pageType) opens in the mode-aware editor at /page/:id;
// everything else (untyped filed pages, loose pages, shelf pages -- ink
// survives there) opens the ink-authored Journal view at /journal/:id" --
// was hand-copied into at least six places (BoardEditor.tsx's own
// travelToEntry, CascadePanels.tsx's own routeFor, ProjectHome.tsx's own
// pageRoute, JournalEntry.tsx's own redirect guard + neighbour navigation,
// Spread.tsx's own openPage, and store/resume.ts's own fromEntry -- the last
// found by grep, beyond the brief's own named four-plus-two list). This is
// EXACTLY today's predicate, byte-for-byte -- this slice changes no
// behavior; it only collapses the duplication so the eventual flip (see
// docs/wrizo-alpha/j6-parity-census.md for what that would cost) becomes a
// one-line change here instead of a hunt through six files.
export function routeForEntry(entry: JournalEntry): string {
  return entry.pageType != null ? `/page/${entry.id}` : `/journal/${entry.id}`;
}
