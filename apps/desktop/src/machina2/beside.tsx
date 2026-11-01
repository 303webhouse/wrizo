import { useEffect, useState } from 'react';
import { getJournalEntries, subscribe } from '../store/persistence';
import { setLinkDock } from '../store/linkDock';
import { withoutFontMarks } from '../store/markRuns';
import type { JournalEntry } from '../types';

// MACHINA v2 MOCKUP, r4 - OPEN BESIDE AS A VISIBLE ROW (the Wrizors' door 4, Nov 1). At the top of the Assets tab, "Open beside ▸" in the blue,
// at rest. Pressing it lists Files and Plans; the chosen one opens READ-ONLY in the drawer (the existing link dock, POLISH #10 item 24 - one
// at a time, in the Consultant's own drawer, its existing per-page slot), under the hairline header "Beside · <name> · read-only"
// (components/LinkDockReader.tsx, under the flag). Before r4 the act existed only as a button on a row already linked to the page, so a writer
// who had linked nothing never met it. The act is the existing one (setLinkDock + 'wz-link-dock-open'); no new data, no new key.
// The Files pop-out's rows carry the same act as a small "beside" door on hover and keyboard focus (FilesBeside, below).
const titleOf = (e: JournalEntry): string => (withoutFontMarks(e.text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 48) || 'Untitled';
const MAX = 8;

/** Files (pages with words, not boards) and Plans (boards), most recent first, the page underfoot left out. */
export function besideChoices(currentId: string): { file: JournalEntry[]; plan: JournalEntry[] } {
  const live = getJournalEntries().filter((e) => e.id !== currentId && !e.deletedAt);
  const recent = (a: JournalEntry, b: JournalEntry) => String(b.updatedAt ?? b.createdAt ?? '').localeCompare(String(a.updatedAt ?? a.createdAt ?? ''));
  return {
    file: live.filter((e) => e.pageType !== 'board' && (e.text ?? '').trim()).sort(recent).slice(0, MAX),
    plan: live.filter((e) => e.pageType === 'board').sort(recent).slice(0, MAX),
  };
}

/** Dock `entryId` beside page `pageId`: the existing act, then the drawer opens on it. */
export function openBeside(pageId: string, entryId: string): void {
  setLinkDock(pageId, { entryId });
  document.dispatchEvent(new Event('wz-link-dock-open'));
}

export function BesideOpen({ pageId }: { pageId: string | null }) {
  const [open, setOpen] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);
  if (!pageId) return null;
  const c = open ? besideChoices(pageId) : { file: [], plan: [] };
  return (
    <div className="machina2-beside">
      <button type="button" className="machina2-beside-open" aria-expanded={open} onClick={() => setOpen((o) => !o)}>Open beside ▸</button>
      {open && (
        <div className="machina2-beside-list" role="group" aria-label="Open beside">
          {([['file', 'Files', c.file], ['plan', 'Plans', c.plan]] as const).map(([kind, head, rows]) => (
            <div key={kind} className="machina2-beside-group">
              <div className="machina2-beside-h">{head}</div>
              {rows.length === 0 && <div className="machina2-beside-none">none yet</div>}
              {rows.map((e) => (
                <button key={e.id} type="button" className="machina2-beside-item" data-kind={kind} data-entry={e.id} onClick={() => { setOpen(false); openBeside(pageId, e.id); }}>{titleOf(e)}</button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** The Files pop-out row's small door: "beside", shown on the row's hover and on its own keyboard focus (styles/machina-v2.css). */
export function FilesBeside({ currentId, entryId }: { currentId: string; entryId: string }) {
  if (currentId === entryId) return null;
  return <button type="button" className="machina2-files-beside" onClick={(ev) => { ev.stopPropagation(); openBeside(currentId, entryId); }}>beside</button>;
}
