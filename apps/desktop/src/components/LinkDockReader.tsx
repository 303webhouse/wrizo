// POLISH #10 item 24 (Nick, via Fable, Oct 25) - THE LINK DOCK's reader: a linked card or page, read-only, beside the page while the writer writes. It
// shows the item's WORDS (plain lines - no mark is ever in what a writer selects and copies), live from the store, and its own close undocks it.
import { useSyncExternalStore } from 'react';
import { getJournalEntry, subscribe } from '../store/persistence';
import { plainLines } from '../store/entryText';
import { useDeskLexicon } from '../store/deskLexicon';
import { recordShadow } from '../store/voiceWall';
import { liveBoxes } from '../store/boxTombstones';   // a reader never sees a tombstoned or purged card (box-tombstones T11)
import type { LinkDockRef } from '../store/linkDock';
import { isMachina2 } from '../machina2/flag';   // MACHINA v2 mockup (?machina2=1 only): the "Beside · <name> · read-only" header
import { useTheme } from '../store/theme';

export function LinkDockReader({ dock, onClose }: { dock: LinkDockRef; onClose: () => void }) {
  const { t } = useDeskLexicon();
  const theme = useTheme();
  const beside = isMachina2() && theme === 'machina';
  // the item's text, re-read whenever the store changes (an edit to the card elsewhere shows here)
  const text = useSyncExternalStore(subscribe, () => {
    const e = getJournalEntry(dock.entryId);
    if (!e) return null;
    if (dock.boxId) { const b = liveBoxes(e.boxes).find((x) => x.id === dock.boxId); return b && b.kind === 'text' ? (b.text ?? '') : null; }
    // MACHINA v2 mockup (the Wrizors' door 4): a PLAN opened beside reads as its name and its cards' words, in order (read-only, as a page reads)
    if (beside && e.pageType === 'board') return [e.text ?? '', ...liveBoxes(e.boxes).filter((b) => b.kind === 'text' && (b.text ?? '').trim()).map((b) => b.text ?? '')].join('\n');
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
        {/* MACHINA v2 mockup (the Wrizors' door 4): the hairline header reads "Beside · <name> · read-only" */}
        {beside ? <span className="wz-link-dock-kind machina2-beside-head">Beside · {title} · read-only</span>
          : <span className="wz-link-dock-kind">{dock.boxId ? t('linksKindCard') : t('linksKindPage')}</span>}
        <button type="button" className="wz-link-dock-close" aria-label={t('linkDockCloseAria')} onClick={onClose}>{t('linkDockUndock')}</button>
      </div>
      <div className="wz-link-dock-title">{title}</div>
      <div className="wz-link-dock-text">{body.map((l, i) => <p key={i}>{l}</p>)}</div>
    </div>
  );
}
