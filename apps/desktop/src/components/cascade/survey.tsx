import { liveBoxes } from '../../store/boxTombstones';
import { useState } from 'react';
import { useDeskLexicon, deskTerm } from '../../store/deskLexicon';
import { DrawerNote } from '../DrawerNote';
import { plainLines } from '../../store/entryText';
import { getJournalPages, getJournalEntry, setPinDisplayed, copyCardToBoard } from '../../store/persistence';
import type { Box } from '../../types';
import { PinToBoardSheet } from '../PinToBoardSheet';
import { routeForEntry } from '../../store/routeForEntry';
import type { SurveyItem, SurveyProps } from '../CascadeSurvey';
import { type CascadeSurveyKind, type CascadeContext, itemTitle, itemExcerpt, byRecent } from './shared';
import { boardTitle } from './PlanPanel';

// AB4 S1 — a board's own cards, surveyed as large thumbnails: title + a
// two-line excerpt, or "A sketch" for an ink-only card (no synthesized
// image — see CascadeSurvey.tsx's own comment on why `item.image` stays
// dark this ticket, per the brief's own non-goals). A page-pin card reads
// its title/excerpt LIVE off the referenced entry (never captured, so it
// can never go stale) via `itemTitle`/`itemExcerpt` above; a plain text
// card reads its own `box.text` the same way.
function boardCardItem(box: Box, currentEntryId: string): SurveyItem {
  if (box.kind === 'page-pin') {
    const entry = box.entryId ? getJournalEntry(box.entryId) : null;
    if (!entry) return { id: box.id, title: 'Missing page' };
    return { id: box.id, title: itemTitle(entry), excerpt: itemExcerpt(entry), current: entry.id === currentEntryId };
  }
  if (box.kind === 'ink') return { id: box.id, title: 'A sketch' };
  const lines = plainLines(box.text ?? '');   // a card's title and excerpt are plain text [CascadePanels §18]
  if (lines.length === 0) return { id: box.id, title: 'Untitled' };
  return { id: box.id, title: lines[0].slice(0, 60), excerpt: lines.slice(1, 3).join(' ').slice(0, 140) || undefined };
}

// The survey (layer 3)'s title + items + travel handler + per-item menu,
// recomputed fresh every render from `kind` alone (see this file's own
// header comment on why — no snapshot staleness after a delete).
export function buildSurvey(kind: CascadeSurveyKind, ctx: CascadeContext, currentEntryId: string): Omit<SurveyProps, 'docked' | 'onDismiss'> {
  // A plain function, not a component — can't call the useDeskLexicon()
  // HOOK (Cascade.tsx, its only caller, already renders inside React and
  // could call the hook itself, but every other builder function in this
  // file is also plain, and deskTerm() is the established non-hook escape
  // hatch this codebase already exports for exactly this situation).
  if (kind.category === 'journal') {
    const pages = getJournalPages().slice().sort(byRecent);
    const items: SurveyItem[] = pages.map((e) => ({ id: e.id, title: itemTitle(e), excerpt: itemExcerpt(e), current: e.id === currentEntryId }));
    return { title: deskTerm('drawerPlaceJournal'), items, onTravel: (id) => { const e = pages.find((p) => p.id === id); if (e) ctx.navigate(routeForEntry(e)); } };
  }
  // a board's own cards (connections and board-meta filtered out); a page-pin travels to its page, any other card to the board itself [CascadePanels §19]
  const allBoxes = liveBoxes(getJournalEntry(kind.boardId)?.boxes).filter((b) => b.kind !== 'connection' && b.kind !== 'board-meta');

  // the board's own reading order, y then x - the arrangement the writer authored, never the boxes array's creation order [CascadePanels §20]
  const byArrangement = (a: Box, b: Box) => (a.y - b.y) || (a.x - b.x);

  // two sections: the board's own cards, then the pages linked to it (a page-pin is a membership, so it reads under its own heading) [CascadePanels §21]
  const cards = allBoxes.filter((b) => b.kind !== 'page-pin').sort(byArrangement);
  const pins = allBoxes.filter((b) => b.kind === 'page-pin').sort(byArrangement);
  // memberships split into two labelled sections, boards and pages, so the kind reads at a glance without a badge on every row [CascadePanels §22]
  const isBoardPin = (b: Box) => getJournalEntry(b.entryId ?? '')?.pageType === 'board';
  const pagePins = pins.filter((b) => !isBoardPin(b));
  const boardPins = pins.filter(isBoardPin);

  const items: SurveyItem[] = [
    // PW2 S3 — AN ARRIVED COPY STATES ITS LINEAGE in the second-line slot:
    // `copied from <board>`. Provenance rides the built fields (FX5 S3's
    // "provenance travels on every box"), so this is a read, not a new record.
    // No badge, no colour, no count — the line is a fact, not a decoration.
    ...cards.map((b) => ({
      ...boardCardItem(b, currentEntryId),
      sectionTitle: deskTerm('cascadePlanSectionCards'),
      note: copiedFromLine(b),
    })),
    ...pagePins.map((b) => ({
      ...boardCardItem(b, currentEntryId),
      sectionTitle: deskTerm('cascadePlanSectionPages'),
      // PW1 S2 — "the built `excerpt` YIELDS to the title" (Q3), and on a
      // membership row it yields to the STATE line specifically: S3 puts that
      // state in the SECOND-LINE SLOT, and a row cannot have two second lines.
      // The page's own body text is one press away on the page itself; which
      // board it is displayed on is knowable nowhere else.
      excerpt: undefined,
      // PW1 S3 — each row states its state. ABSENCE MEANS DISPLAYED, read here
      // exactly as the canvas reads it: only an explicit `false` is "not shown".
      note: b.onCanvas === false ? deskTerm('cascadePinNotShown') : deskTerm('cascadePinShown'),
      kindShape: 'page' as const,
    })),
    // BOARDS, their own labelled section. A nested board appears HERE and
    // nowhere else — one row, one section, so the writer never has to work out
    // which list a thing is in.
    ...boardPins.map((b) => ({
      ...boardCardItem(b, currentEntryId),
      sectionTitle: deskTerm('cascadePlanSectionBoards'),
      excerpt: undefined,
      note: b.onCanvas === false ? deskTerm('cascadePinNotShown') : deskTerm('cascadePinShown'),
      kindShape: 'board' as const,
    })),
  ];

  return {
    title: kind.boardTitle,
    items,
    onTravel: (id) => {
      const box = allBoxes.find((b) => b.id === id);
      if (!box) return;
      if (box.kind === 'page-pin' && box.entryId) {
        const entry = getJournalEntry(box.entryId);
        // PW1 S4 — travel that KEEPS THE RAIL: the destination mounts with this
        // same survey open, on this same board, and the origin row wears the
        // `current` mark this builder already computes. The trail is the rail.
        if (entry) ctx.travelFromCascade(entry);
        return;
      }
      const board = getJournalEntry(kind.boardId);
      if (board) ctx.travelFromCascade(board);
    },
    // PW1 S3 — the MENU act, on the membership rows only. This is the path that
    // must be COMPLETE: the drag half needs a canvas and so exists only on a
    // board, while `Display on Board` works everywhere the row does.
    renderMenu: (item) => {
      // PW2 S3 — a CARD row carries transfer; a membership row carries display.
      const card = cards.find((b) => b.id === item.id);
      if (card) return (card.kind === 'text' || card.kind === 'ink')
        ? <CardTransferMenu boardId={kind.boardId} box={card} />
        : null;
      const box = pins.find((b) => b.id === item.id);
      if (!box || !box.entryId) return null;
      // PW2 S2/PW22 — THE TWIN. A nested board's double-click travels INTO it
      // on the canvas; the same act must ride this menu, or the gesture is the
      // only path and the keyboard and the unfamiliar hand lose their way in.
      // A page membership gets no such row: pressing its row already travels.
      const nested = getJournalEntry(box.entryId);
      return (
        <>
          {nested?.pageType === 'board' && (
            <button type="button" className="wz-cascade-thumb-menu-item wz-cascade-open-board"
              onClick={() => ctx.travelFromCascade(nested)}>{deskTerm('cascadeOpenBoard')}</button>
          )}
          <PinDisplayMenu boardId={kind.boardId} entryId={box.entryId} displayed={box.onCanvas !== false} />
        </>
      );
    },
    // only membership rows drag, and the payload names the board and the box, so a canvas refuses a row from another board's survey (that would be card transfer, not display) [CascadePanels §23]
    dragPayload: (item) => {
      const box = pins.find((b) => b.id === item.id);
      return box && box.entryId ? `${kind.boardId}:${box.entryId}` : null;
    },
    // PW1 S1/S5 — the `‹` walks back to the LIST, and the list is now the panel
    // (PW3). It used to open a second survey of the drawer's own boards; there
    // is no such layer any more, so this closes one instead. "The survey's `‹`
    // is always the way back to the list" holds — the list simply moved up.
    onBack: () => ctx.closeSurvey(),
  };
}


// a per-kind menu: a free or text card offers `Copy to <board>…`; a page-pin or board-card is a membership and offers no copy verb; copiedFromLine names the board a copy came from [CascadePanels §24]
function copiedFromLine(box: Box): string | undefined {
  // reads copiedFromBoardId only, as text: no travel from this line [CascadePanels §25]
  if (!box.copiedFromBoardId) return undefined;
  const from = getJournalEntry(box.copiedFromBoardId);
  if (!from || from.pageType !== 'board') return undefined;
  return `${deskTerm('cascadeCardCopiedFrom')} ${boardTitle(from)}`;
}

function CardTransferMenu({ boardId, box }: { boardId: string; box: Box }) {
  const { t } = useDeskLexicon();
  const [pickerOpen, setPickerOpen] = useState(false);
  // ITEM 123's INVARIANT, RENDERED RATHER THAN MERELY ENFORCED: "every card
  // keeps >= 1 board". A board-owned card belongs to exactly one board, so
  // removing it from this one would leave it with none — the verb is therefore
  // PRESENT, INERT, AND SAYS WHY, the same refusal grammar S1 uses for a
  // descendant and PW1 used for its inert Unlink. Absence would make the writer
  // hunt for a removal that is not missing, only refused.
  return (
    <>
      <button type="button" className="wz-cascade-thumb-menu-item wz-cascade-copy-card" onClick={() => setPickerOpen(true)}>
        {t('cascadeCardCopyTo')}
      </button>
      <button type="button" className="wz-cascade-thumb-menu-item wz-cascade-inert" aria-disabled="true" disabled
        title={t('cascadeCardOnlyBoard')}>
        {t('cascadeCardRemove')} <span className="wz-cascade-inert-why">{t('cascadeCardOnlyBoard')}</span>
      </button>
      {pickerOpen && (
        <PinToBoardSheet
          entryId={boardId}
          title={t('cascadeCardCopyTitle')}
          // the copy note sits behind a "?" beside the sheet's title [CascadePanels §26]
          note={<DrawerNote label="About copying">{t('cascadeCardCopyNote')}</DrawerNote>}
          onChoose={(targetBoardId) => { copyCardToBoard(boardId, box.id, targetBoardId); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

// the menu half of the two display acts: it moves an existing membership on and off the canvas, so there is no unlink here and hiding never removes the member [CascadePanels §27]
function PinDisplayMenu({ boardId, entryId, displayed }: { boardId: string; entryId: string; displayed: boolean }) {
  const { t } = useDeskLexicon();
  return (
    <button
      type="button"
      className="wz-cascade-thumb-menu-item wz-cascade-pin-display"
      onClick={() => setPinDisplayed(boardId, entryId, !displayed)}
    >
      {displayed ? t('cascadePinHide') : t('cascadePinDisplay')}
    </button>
  );
}
