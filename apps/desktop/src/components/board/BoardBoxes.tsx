import { useEffect, useRef } from 'react';
import { getJournalEntryIncludingDeleted, getTombstonedBox } from '../../store/persistence';
import { boardDrawerLine } from '../../store/pageHome';
import { renderStroke } from '../../store/ink';
import { decorateMarkdownForCard } from '../../store/draftDecoration';
import { useLexicon } from '../../store/themeLexicon';
import { useDeskLexicon } from '../../store/deskLexicon';
import type { Box } from '../../types';
import { notecardExcerpt } from './geometry';

// -- ink box: paints via the shared renderStroke, box-local (already
// re-normalized at port time so sheetW = the box's own pixel width). -------
export function BoardInkBox({ box, pageWidthPx }: { box: Box; pageWidthPx: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const wPx = Math.max(1, box.w * pageWidthPx);
    const hPx = Math.max(1, box.h * pageWidthPx);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(wPx * dpr));
    canvas.height = Math.max(1, Math.round(hPx * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, wPx, hPx);
    const root = getComputedStyle(document.documentElement);
    const color = root.getPropertyValue('--ink-stroke').trim() || root.getPropertyValue('--ink-on-paper').trim() || '#1A1206';
    for (const s of box.strokes ?? []) renderStroke(ctx, s, wPx, color);
  }, [box.strokes, box.w, box.h, pageWidthPx]);
  return <canvas ref={ref} aria-hidden="true" className="board-ink-canvas" style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// a page-pin reads its entry LIVE each render, deleted-inclusive so a Trash card shows its real title (travel stays live-only); a board-card's drawer line comes from store/pageHome.ts [BoardEditor §5]

export function BoardPinBox({ box }: { box: Box }) {
  const { t: lex } = useLexicon();
  const { t: dt } = useDeskLexicon();
  // BOARD CONTEXT MENU: a card on the TRASH board that stands for a deleted CARD (not a page): read the tombstoned source box for its face. Read-only; Restore / Delete live on its right-click menu.
  if (box.trashedFrom) {
    const src = getTombstonedBox(box.trashedFrom.boardId, box.trashedFrom.boxId);
    const srcPage = src?.kind === 'page-pin' && src.entryId ? getJournalEntryIncludingDeleted(src.entryId) : null;
    const text = src?.kind === 'text' ? src.text ?? '' : srcPage ? srcPage.text : '';
    const { title: tt, excerpt: ex } = notecardExcerpt(text);
    const title = tt || (src?.kind === 'ink' ? 'A sketch' : 'Untitled');
    return (
      <div className="board-text board-pin">
        <div className="board-pin-badge">{dt('trashCardBadge')}</div>
        <div className="board-pin-title">{title}</div>
        {ex && <div className="board-pin-excerpt">{ex}</div>}
      </div>
    );
  }
  const entry = box.entryId ? getJournalEntryIncludingDeleted(box.entryId) : null;
  if (!entry) {
    return <div className="board-text board-pin board-pin-missing">Missing page</div>;
  }
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  const { title: rawTitle, excerpt } = notecardExcerpt(entry.text);
  const title = rawTitle || (hasInk ? 'A sketch' : 'Untitled');
  // a nested board rides the same page-pin box; its face is the noun `Board` and its drawer, and a doubled edge (::before) shows the kind without spending a colour [BoardEditor §6]
  if (entry.pageType === 'board') {
    return (
      <div className="board-text board-pin board-boardcard">
        <div className="board-pin-badge">{lex('board')}</div>
        <div className="board-pin-title">{title}</div>
        <div className="board-pin-excerpt">{boardDrawerLine(entry)}</div>
      </div>
    );
  }
  return (
    <div className="board-text board-pin">
      <div className="board-pin-badge">{lex('board')} pin</div>
      <div className="board-pin-title">{title}</div>
      {excerpt && <div className="board-pin-excerpt">{excerpt}</div>}
    </div>
  );
}

// a read-only face (a double-click opens BoardCardPopup); a ported card (sourceEntryId) shows the bounded excerpt, so its full stored text cannot inflate the reflow floor [BoardEditor §7]
export function BoardTextBox({
  boxId, initialText, measureRef, sourceEntryId, typeStyle, prompt,
}: {
  boxId: string;
  initialText: string;
  measureRef: (id: string, el: HTMLDivElement | null) => void;
  sourceEntryId?: string;
  // W3 - a dealt step's QUESTION, shown only while the card has no body (store/guided.ts promptToShow decides). It rides as an ATTRIBUTE and is painted by a CSS pseudo-element
  // (.board-text[data-prompt]::after), so it is never a text node: never selectable, copyable, counted or read as the writer's words, and this element's textContent stays the stored text.
  prompt?: string | null;
  // ITEM 207 - the card's own face/size (store/fontRoster.ts cardTypeStyle); undefined on a card that never chose, so its
  // element carries no style attribute at all.
  typeStyle?: React.CSSProperties;
}) {
  const { t } = useDeskLexicon();
  if (sourceEntryId) {
    const { title, excerpt } = notecardExcerpt(initialText);
    return (
      <div ref={el => measureRef(boxId, el)} className="board-text board-ported">
        <div className="board-pin-badge">{t('boardPortedBadge')}</div>
        <div className="board-pin-title">{title || t('boardThreadUntitled')}</div>
        {excerpt && <div className="board-pin-excerpt">{excerpt}</div>}
      </div>
    );
  }
  // the resting card renders through the popup's decoration engine with no caret, so every marker collapses; escHtml keeps the HTML safe, and font-size:0 keeps the stored text in textContent [BoardEditor §8]
  return (
    <div
      ref={el => measureRef(boxId, el)}
      className="board-text"
      style={typeStyle}
      data-prompt={prompt ?? undefined}
      dangerouslySetInnerHTML={{ __html: decorateMarkdownForCard(initialText, null) }}
    />
  );
}
