import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { viewsFor } from '../store/walk';
import type { BoardKind, BoardView } from '../store/boardKind';

// Show As replaces the view tabs: icons first, words open on mouse hover or keyboard focus only (opening shifts the icons, so a tap must not open them); olive at rest, brass for the chosen view [ShowAs §1]

const HOVER_INTENT_MS = 180;

const WORD: Record<BoardView, DeskTermId> = {
  open: 'boardModeOpen', storyboard: 'boardModeStoryboard', outline: 'boardModeOutline', walk: 'boardModeWalk', flip: 'boardModeFlip', thumbnails: 'boardModeThumbs',
};

const PATH: Record<BoardView, string> = {
  open: 'M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM10 10h5v5h-5z',
  storyboard: 'M3 3h3.2v12H3zM7.4 3h3.2v12H7.4zM11.8 3h3.2v12h-3.2z',
  outline: 'M3 4h12M6 9h9M6 14h9',
  walk: 'M4 3h10v12H4z',
  flip: 'M9 4.5C7.5 3.5 5 3.5 3 4v10c2-.5 4.5-.5 6 .5 1.5-1 4-1 6-.5V4c-2-.5-4.5-.5-6 .5zM9 4.5V14.5',
  thumbnails: 'M3 3h3.5v5H3zM7.3 3h3.5v5H7.3zM11.6 3H15v5h-3.4zM3 10h3.5v5H3zM7.3 10h3.5v5H7.3zM11.6 10H15v5h-3.4z',
};

function ViewIcon({ view }: { view: BoardView }) {
  return (
    <svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATH[view]} /></svg>
  );
}

export function ShowAs({ kind, deck, narrow, current, onPick }: { kind: BoardKind; deck: boolean; narrow: boolean; current: BoardView; onPick: (view: BoardView) => void }) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  const intent = useRef<number | null>(null);
  const clearIntent = () => { if (intent.current !== null) { window.clearTimeout(intent.current); intent.current = null; } };
  useEffect(() => clearIntent, []);
  const views = viewsFor(kind, narrow, deck);
  if (views.length < 2) return null;
  return (
    <div
      className="show-as"
      role="group"
      aria-label={t('showAsLabel')}
      data-open={open ? 'true' : 'false'}
      // hover intent: the words open only after the mouse has rested HOVER_INTENT_MS, so a quick aim still hits the icon it aimed at; a press cancels a pending open [ShowAs §2]
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') { clearIntent(); intent.current = window.setTimeout(() => { intent.current = null; setOpen(true); }, HOVER_INTENT_MS); } }}
      onPointerDown={clearIntent}
      onPointerLeave={() => { clearIntent(); setOpen(false); }}
      onFocusCapture={(e) => { if ((e.target as HTMLElement).matches?.(':focus-visible')) setOpen(true); }}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      {views.map((v) => (
        <button key={v} type="button" className="show-as-btn board-mode-tab" data-board-mode-tab={v} data-view={v} aria-pressed={v === current} title={t(WORD[v])} aria-label={t(WORD[v])} onClick={() => onPick(v)}>
          <ViewIcon view={v} />
          <span className="show-as-word">{t(WORD[v])}</span>
        </button>
      ))}
    </div>
  );
}
