import type { JournalEntry, PageSettings } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import { softDeleteEntry, flushNow } from './persistence';
import { getResumeTarget } from './resume';

// the left drawer's actions on a Draft page; every verb calls something that already exists, so the drawer stays presentational and PageEditor adds one call [pageActions §1]

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
