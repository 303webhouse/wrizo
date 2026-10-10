import type { JournalEntry, PageSettings } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import { softDeleteEntry, flushNow } from './persistence';
import { getResumeTarget } from './resume';

// PHASE 1 (docs/plans/phase1-drawers.md 3.5) - THE ACTIONS the left drawer offers on a Draft page: Tags, Copy, Delete, Header/Footer
// (Nick, Oct 9). Every verb calls something that already exists; this module only wires them, so the drawer component stays
// presentational and PageEditor.tsx (whose typing path is off limits) adds ONE call instead of four handlers.
//
//   Copy           the host's own copy (PageEditor's doCopy, which awaits the clipboard and toasts success or failure);
//   Tags           the host's own addTag/removeTag (the Page face uses the same two);
//   Header/Footer  the page's stored headers + footers flags, both together (they are stored settings; they do not paint on screen);
//   Delete         a SOFT delete to the Trash board - never a hard delete - behind an in-page confirm (the confirm is the component's);
//                  afterwards the writer goes to their most recent surface, or the front door if there is none.

export interface PageActions {
  onCopy: () => void;
  tags: { list: readonly string[]; onAdd: (tag: string) => void; onRemove: (tag: string) => void };
  headerFooter: { on: boolean; onToggle: () => void };
  /** The CONFIRMED delete. The drawer asks first; this is what runs after "Send to Trash". */
  onDelete: () => void;
}

/** Headers and footers read as ONE switch: on only when both are. (A page with either alone off reads off, and toggling turns both on.) */
export function headerFooterOn(settings: Pick<PageSettings, 'headers' | 'footers'> | undefined): boolean {
  const s = settings ?? PAGE_SETTINGS_FALLBACK;
  return !!s.headers?.on && !!s.footers?.on;
}

/** The patch that turns BOTH to `on`, keeping each one's own text. */
export function headerFooterPatch(settings: Pick<PageSettings, 'headers' | 'footers'> | undefined, on: boolean): Pick<PageSettings, 'headers' | 'footers'> {
  const s = settings ?? PAGE_SETTINGS_FALLBACK;
  return { headers: { ...s.headers, on }, footers: { ...s.footers, on } };
}

interface BuildArgs {
  entry: JournalEntry;
  copy: () => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  patchPageSettings: (next: Partial<PageSettings>) => void;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

export function buildPageActions({ entry, copy, addTag, removeTag, patchPageSettings, navigate }: BuildArgs): PageActions {
  const on = headerFooterOn(entry.pageSettings);
  return {
    onCopy: copy,
    tags: { list: entry.tags ?? [], onAdd: addTag, onRemove: removeTag },
    headerFooter: { on, onToggle: () => patchPageSettings(headerFooterPatch(entry.pageSettings, !on)) },
    onDelete: () => {
      softDeleteEntry(entry.id);
      flushNow();
      navigate(getResumeTarget()?.route ?? '/', { replace: true });
    },
  };
}
