import type { JournalEntry } from '../types';

// THE STAGE A PAGE IS IN, read from outside its editor (the reorg's DOCS menu, for the session's rows; Fable, Nov 20). The page's editor keeps
// its stage per page under `wrizo-mode-page-<id>` (pages/PageEditor.tsx, its `mode` state); a page that never chose one opens in Free Write if
// it is a manuscript or loose, else in Draft - the same rule PageEditor's initial state reads (keep the two in step). A screenplay has only
// Draft (components/ScriptEditor.tsx). Read at render: nothing here is stored or watched.
export type PageStage = 'sprint' | 'build' | 'edit';

export function pageStageOf(entry: JournalEntry): PageStage {
  if (entry.pageType === 'script') return 'build';
  let saved: string | null = null;
  try { saved = localStorage.getItem(`wrizo-mode-page-${entry.id}`); } catch { /* blocked: the default below */ }
  const mode = saved === 'journal' || saved === 'drafting' || saved === 'revise' ? saved
    : entry.pageType === 'manuscript' || entry.origin === 'loose' ? 'journal' : 'drafting';
  return mode === 'journal' ? 'sprint' : mode === 'revise' ? 'edit' : 'build';
}
