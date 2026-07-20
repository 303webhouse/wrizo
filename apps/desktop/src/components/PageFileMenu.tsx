import { useState } from 'react';
import type { JournalEntry } from '../types';
import { getProjects, setPageHome, inJournalView, belongsOnShelf } from '../store/persistence';
import { useLexicon } from '../store/themeLexicon';

// Pages & Shelf D2 — the per-page "file to…" control. A page has exactly one
// home (Binder / Shelf / Journal); this offers the two it isn't in, plus every
// binder, and moves it via setPageHome (an ordinary synced record update).
// Reuses the Drawers tree's .dz-menu dropdown styling.
//
// B2 S3 — the legacy `shelved` flag retires from this read too: onShelf/
// inJournal now derive from T3/inJournalView (the SAME one-truth predicates
// every other B2 surface uses) instead of the dormant flag. "To Shelf"
// still calls setPageHome(id,'shelf') — S3 also retired that WRITE path's
// own shelved-setting internals (persistence.ts), so this button now reads
// as "un-file" under the hood; the Shelf is where an unfiled page lands via
// T3, not a place this menu files INTO directly anymore.
export function PageFileMenu({ page, label = 'file to…' }: { page: JournalEntry; label?: string }) {
  const [open, setOpen] = useState(false);
  const { t: lex, tMany: lexMany } = useLexicon();
  const binders = getProjects();
  const inJournal = inJournalView(page);
  const onShelf = !inJournal && belongsOnShelf(page);
  const file = (target: string) => { setPageHome(page.id, target); setOpen(false); };
  return (
    <div className="dz-rowmove">
      <button type="button" className="pfm-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>{label}</button>
      {open && (
        <div className="dz-menu" role="menu">
          {!inJournal && <button type="button" className="dz-menu-item" onClick={() => file('journal')}>To {lex('journal')}</button>}
          {!onShelf && <button type="button" className="dz-menu-item" onClick={() => file('shelf')}>To {lex('shelf')}</button>}
          {binders.filter(b => b.id !== page.projectId).map(b => (
            <button type="button" key={b.id} className="dz-menu-item" onClick={() => file(b.id)}>{b.title || 'Untitled'}</button>
          ))}
          {binders.filter(b => b.id !== page.projectId).length === 0 && (
            <span className="dz-menu-empty">No {lexMany('binder').toLowerCase()} to file into</span>
          )}
        </div>
      )}
    </div>
  );
}
