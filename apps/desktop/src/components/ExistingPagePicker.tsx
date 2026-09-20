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
    // PW1 S3 — BOARD-SIDE ("Add an existing page", from the board's own sheet).
    pinPageToBoard(pageId, boardId, { display: true });
    onClose();
  };

  return (
    <div className="board-sheet" role="dialog" aria-label={`Add an existing ${lex('page').toLowerCase()}`}>
      <div className="board-sheet-inner">
        <div className="board-sheet-title">Add an existing {lex('page').toLowerCase()}</div>
        {candidates.length === 0 && <p style={{ color: 'var(--text-mid)', marginBottom: 12 }}>Nothing else to add yet.</p>}
        <div style={{ maxHeight: 320, overflow: 'auto' }}>
          {/* ITEM 176 — A BOARD IN A CANDIDATE LIST SAYS IT IS A BOARD.
              The defect this closes was NAMING, not absence: this list already
              offered boards (`getJournalEntries()` is unfiltered by pageType)
              and rendered each one as a bare title, in a sheet whose own words
              say "page". A writer looking for the nesting door was not missing
              one — he was looking at this one, and it denied being it.

              TWO SIGNALS, because one is not enough HERE specifically:
              · THE SHAPE is Nick's own law, reused rather than reinvented —
                a board is a horizontal rectangle, a page a vertical one
                (`.wz-thumb-board` / `.wz-thumb-page`, the same swatches the
                rail draws). Shape teaches the kind and spends no colour.
              · THE WORD rides only the BOARD rows, and it is the one thing
                that makes the contradiction legible: the sheet's title still
                says "page" (its wording belongs to 144's redesign, not here),
                so a board must say so in words or the only reader who notices
                is one who already knows the shape law.

              Scope held deliberately: the door's NAME is not touched, the
              mode-gated beginnings row is not touched, and no new door is
              added. Those are 144's, and this is the lie alone. */}
          {candidates.map(e => {
            const isBoard = e.pageType === 'board';
            return (
              <button key={e.id} type="button" className="dz-row board-dest-row wz-kindrow" onClick={() => choose(e.id)}>
                <span className={`wz-kindswatch ${isBoard ? 'wz-thumb-board' : 'wz-thumb-page'}`} aria-hidden="true" />
                <span className="dz-rowtitle">{itemTitle(e)}</span>
                {isBoard && <span className="wz-kindtag">{lex('board')}</span>}
              </button>
            );
          })}
        </div>
        <button type="button" className="btn-quiet" onClick={onClose} style={{ marginTop: 16 }}>Cancel</button>
      </div>
    </div>
  );
}
