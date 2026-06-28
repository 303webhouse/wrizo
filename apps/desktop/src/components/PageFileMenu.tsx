import { useState } from 'react';
import type { JournalEntry } from '../types';
import { getProjects, setPageHome } from '../store/persistence';

// Pages & Shelf D2 — the per-page "file to…" control. A page has exactly one
// home (Binder / Shelf / Journal); this offers the two it isn't in, plus every
// binder, and moves it via setPageHome (an ordinary synced record update).
// Reuses the Drawers tree's .dz-menu dropdown styling.
export function PageFileMenu({ page, label = 'file to…' }: { page: JournalEntry; label?: string }) {
  const [open, setOpen] = useState(false);
  const binders = getProjects();
  const onShelf = page.projectId == null && !!page.shelved;
  const inJournal = page.projectId == null && !page.shelved;
  const file = (target: string) => { setPageHome(page.id, target); setOpen(false); };
  return (
    <div className="dz-rowmove">
      <button type="button" className="pfm-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>{label}</button>
      {open && (
        <div className="dz-menu" role="menu">
          {!inJournal && <button type="button" className="dz-menu-item" onClick={() => file('journal')}>To Journal</button>}
          {!onShelf && <button type="button" className="dz-menu-item" onClick={() => file('shelf')}>To Shelf</button>}
          {binders.filter(b => b.id !== page.projectId).map(b => (
            <button type="button" key={b.id} className="dz-menu-item" onClick={() => file(b.id)}>{b.title || 'Untitled'}</button>
          ))}
          {binders.filter(b => b.id !== page.projectId).length === 0 && (
            <span className="dz-menu-empty">No binders to file into</span>
          )}
        </div>
      )}
    </div>
  );
}
