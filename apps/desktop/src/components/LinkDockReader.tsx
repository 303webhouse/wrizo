// POLISH #10 item 24 (Nick, via Fable, Oct 25) - THE LINK DOCK's reader: a linked card or page, read-only, beside the page while the writer writes. It
// shows the item's WORDS (plain lines - no mark is ever in what a writer selects and copies), live from the store, and its own close undocks it.
import { useSyncExternalStore } from 'react';
import { getJournalEntry, subscribe } from '../store/persistence';
import { plainLines } from '../store/entryText';
import { useDeskLexicon } from '../store/deskLexicon';
import { recordShadow } from '../store/voiceWall';
import { liveBoxes } from '../store/boxTombstones';   // a reader never sees a tombstoned or purged card (box-tombstones T11)
import type { LinkDockRef } from '../store/linkDock';

export function LinkDockReader({ dock, onClose }: { dock: LinkDockRef; onClose: () => void }) {
  const { t } = useDeskLexicon();
  // the item's text, re-read whenever the store changes (an edit to the card elsewhere shows here)
  const text = useSyncExternalStore(subscribe, () => {
    const e = getJournalEntry(dock.entryId);
    if (!e) return null;
    if (dock.boxId) { const b = liveBoxes(e.boxes).find((x) => x.id === dock.boxId); return b && b.kind === 'text' ? (b.text ?? '') : null; }
    return e.text ?? '';
  });
  const lines = text == null ? [] : plainLines(text);
  const title = lines[0] ?? t('linkDockGone');
  const body = lines.length > 1 ? lines.slice(1) : lines;
  return (
    // text copied from the reader is the writer's own, like a page copy: it passes the Voice Wall when pasted (Fable, Oct 28; no other wall exception)
    <div className="wz-link-dock" onCopy={() => { const sel = String(document.getSelection() || ''); if (sel) recordShadow(sel); }} data-link-dock-entry={dock.entryId} {...(dock.boxId ? { 'data-link-dock-box': dock.boxId } : {})}>
      {/* the header carries the item's kind word, its name, and Undock - which returns the Grafts list (one item at a time: to swap, Undock, then Dock) */}
      <div className="wz-link-dock-head">
        <span className="wz-link-dock-kind">{dock.boxId ? t('linksKindCard') : t('linksKindPage')}</span>
        <button type="button" className="wz-link-dock-close" aria-label={t('linkDockCloseAria')} onClick={onClose}>{t('linkDockUndock')}</button>
      </div>
      <div className="wz-link-dock-title">{title}</div>
      <div className="wz-link-dock-text">{body.map((l, i) => <p key={i}>{l}</p>)}</div>
    </div>
  );
}
