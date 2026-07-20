import { getJournalEntries, getBoardsPinning, pinPageToBoard, getSystemKind } from '../store/persistence';
import { useLexicon } from '../store/themeLexicon';
import type { JournalEntry } from '../types';

// B2 S5 — the Board's own Add flow gains "Existing page…" beside FX6's New
// page card: a quiet picker that PINS a chosen page onto this board —
// membership, never filing (pinPageToBoard never touches the referenced
// page's own origin/projectId; verified live in b2.mjs). Reuses "the Pin
// sheet's leaf pattern" (PinToBoardSheet.tsx's own flat, scrollable
// `.board-dest-row` list) rather than its destination-first drill-down —
// the direction here is inverted (picking a PAGE for a known board, not a
// board for a known page), so the drill-down itself doesn't apply; only
// its leaf-level list styling is the reused part.
function itemTitle(e: JournalEntry): string {
  const hasInk = (e.strokes?.length ?? 0) > 0;
  if (!e.text.trim()) return hasInk ? 'A sketch' : 'Untitled';
  return e.text.trim().split('\n')[0].slice(0, 60);
}

export function ExistingPagePicker({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const { t: lex } = useLexicon();

  // Every live, non-system page not already pinned here (and not the board
  // itself — the same self-pin guard PinToBoardSheet.tsx's own leaf list
  // already carries).
  const candidates = getJournalEntries().filter(e => (
    e.id !== boardId
    && getSystemKind(e) === undefined
    && !getBoardsPinning(e.id).some(b => b.id === boardId)
  ));

  const choose = (pageId: string) => {
    pinPageToBoard(pageId, boardId);
    onClose();
  };

  return (
    <div className="board-sheet" role="dialog" aria-label={`Add an existing ${lex('page').toLowerCase()}`}>
      <div className="board-sheet-inner">
        <div className="board-sheet-title">Add an existing {lex('page').toLowerCase()}</div>
        {candidates.length === 0 && <p style={{ color: 'var(--text-mid)', marginBottom: 12 }}>Nothing else to add yet.</p>}
        <div style={{ maxHeight: 320, overflow: 'auto' }}>
          {candidates.map(e => (
            <button key={e.id} type="button" className="dz-row board-dest-row" onClick={() => choose(e.id)}>
              <span className="dz-rowtitle">{itemTitle(e)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn-quiet" onClick={onClose} style={{ marginTop: 16 }}>Cancel</button>
      </div>
    </div>
  );
}
