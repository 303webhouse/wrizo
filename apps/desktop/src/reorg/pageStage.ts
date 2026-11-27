import type { JournalEntry } from '../types';

// THE STAGE A PAGE IS IN, read from outside its editor (the reorg's DOCS menu, for the session's rows; Fable, Nov 20). The page's editor keeps
// its stage per page under `wrizo-mode-page-<id>` (pages/PageEditor.tsx, its `mode` state); a page that never chose one opens in Free Write if
// it is a manuscript or loose, else in Draft - the same rule PageEditor's initial state reads (keep the two in step). A screenplay has only
// Draft (components/ScriptEditor.tsx). Read at render: nothing here is stored or watched.
export type PageStage = 'sprint' | 'build' | 'edit';

/** #146 (Nick, Nov 27): the Guide's "Write this" sends her to a Part in TEXT (Draft), never Free Write (Flux's Wire In); she can go there from Draft if she wants. The page's own stage mark is set before it opens;
 *  the event is for the one case where that page is already on screen. Nothing new is stored. */
export const OPEN_IN_TEXT = 'wz-open-in-text';
export function openInText(pageId: string): void {
  try { localStorage.setItem(`wrizo-mode-page-${pageId}`, 'drafting'); } catch { /* blocked: the page opens in its default posture */ }
  window.dispatchEvent(new CustomEvent(OPEN_IN_TEXT, { detail: pageId }));
}

export function pageStageOf(entry: JournalEntry): PageStage {
  if (entry.pageType === 'script') return 'build';
  let saved: string | null = null;
  try { saved = localStorage.getItem(`wrizo-mode-page-${entry.id}`); } catch { /* blocked: the default below */ }
  const mode = saved === 'journal' || saved === 'drafting' || saved === 'revise' ? saved
    : entry.pageType === 'manuscript' || entry.origin === 'loose' ? 'journal' : 'drafting';
  return mode === 'journal' ? 'sprint' : mode === 'revise' ? 'edit' : 'build';
}
