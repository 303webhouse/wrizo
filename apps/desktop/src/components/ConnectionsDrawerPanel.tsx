import { useDeskLexicon } from '../store/deskLexicon';
import { useBoardSnapshot, getBoardActions } from '../store/boardSelection';
import { getJournalEntry, getUnbornEntry, removePageLink, subscribe } from '../store/persistence';
import { requestDelete } from '../store/deleteGate';
import { withoutFontMarks } from '../store/markRuns';   // POLISH #10 item 4
import { graftsOf, hidePlanCard, pairedPageRow, planGroupOf, restorePageLink, unhidePlanCard, type GraftRow, type GraftSubject } from '../store/grafts';
import { searchSteps } from '../store/writePlace';
import { liveBoxes } from '../store/boxTombstones';
import { GraftPicker, type CameFrom } from './GraftPicker';
import { useUnborn } from './UnbornSurface';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// The right drawer's second pane - the GRAFTS tab (Flux: LINKS). Its name is the theme's word, read from the lexicon, never written here.
//
// CONNECTOR-B (Nick's approved connector mockup v6) built the list: a card's connections - same-board connection boxes and page_links records - each
// with an X that asks first ("Remove graft?": the one dialog, without the "Don't ask me again" tick - an unlink keeps its own confirm). That stays.
//
// BIG PROJECTS STEP 3 ("connected to this page"; Nick's approved graft-doors mockup, cursor/graft-doors-mockup @ c4f34eb0; Fable's build notes):
//   - THE SUBJECT: the open PAGE; on a board, the SELECTED CARD (or the board itself while no card is selected). Read here, from the route and the
//     board's published snapshot, so the Tutor's drawer that mounts this pane is untouched.
//   - "+ Graft..." on top, on pages AND boards: the picker (components/GraftPicker.tsx).
//   - On a board, its PAIRED PAGE first: a plain row, no X (the plan relation, not a graft).
//   - "Connected to <subject>", then on a page its PLAN BOARD as ONE folded row, "Plan board · N cards" - the first group; opened, its cards, each
//     with an X on hover that HIDES the card from this page (pageSettings.hiddenPlanCards; the card stays on its board), with an Undo line.
//   - Groups Cards, Sources, Boards, Pages, each row with an X (connector-b's confirm, then an Undo line); then Shared tags (a tag mark, no X); a
//     faint place label on anything from another place.
//   - NO placeholder text: with nothing grafted, the pane is the "+ Graft..." control alone.
type Undo = { line: string; run: () => void } | null;
const titleOf = (text: string | undefined): string => (withoutFontMarks(text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60) || 'Untitled';

export function ConnectionsDrawerPanel() {
  const { t } = useDeskLexicon();
  const snap = useBoardSnapshot();
  const location = useLocation();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);   // a link added or removed anywhere redraws the list
  const [pickerOpen, setPickerOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [undo, setUndo] = useState<Undo>(null);
  const addRef = useRef<HTMLButtonElement | null>(null);
  const placeRef = useRef<HTMLButtonElement | null>(null);

  // the subject: a board (its selected card, or the board) when a board is open; otherwise the page on the address.
  // A BRAND-NEW page (/page/new) has no row yet. RULING (Fable, Oct 21): a pick in "+ Graft..." CREATES it - through the unborn surface's own
  // birth (birthWith, the act a first word performs: the row, any pin its door asked for, the address) - and typing still follows
  // born-on-first-word. Birth swaps the address with replaceState, which the router never hears, so the route still reads /page/new after
  // it: the pane remembers the id it saw unborn and keeps following that page once it has a row.
  const pageMatch = /^\/page\/([^/?#]+)/.exec(location.pathname);
  const isNew = !snap && !!pageMatch && pageMatch[1] === 'new';
  const lastUnbornRef = useRef<string | null>(null);
  const slotId = isNew ? (getUnbornEntry()?.id ?? null) : null;
  if (slotId) lastUnbornRef.current = slotId;
  const unborn = useUnborn(isNew ? (slotId ?? lastUnbornRef.current ?? '') : '');
  // W2: a pane first drawn AFTER the birth (the writer opened Grafts once they had typed) never saw the unborn slot, and the router still says /page/new - but the ADDRESS BAR was corrected at birth (replaceState), so it names the page.
  const bornHashId = isNew && !slotId && !lastUnbornRef.current ? (/^#\/page\/([^/?#]+)/.exec(window.location.hash)?.[1] ?? null) : null;
  const pageId = !snap && pageMatch ? (isNew ? (slotId ?? lastUnbornRef.current ?? (bornHashId && bornHashId !== 'new' ? decodeURIComponent(bornHashId) : null)) : decodeURIComponent(pageMatch[1])) : null;
  const page = pageId ? getJournalEntry(pageId) : null;
  const birthFirst = unborn ? () => { unborn.birthWith({ text: '' }); } : undefined;
  const subject: GraftSubject | null = snap
    ? (snap.selectedId ? { entryId: snap.boardId, boxId: snap.selectedId } : { entryId: snap.boardId })
    : (page ? { entryId: page.id } : null);
  const subjectKey = subject ? `${subject.entryId}:${subject.boxId ?? ''}` : '';
  useEffect(() => { setUndo(null); setPickerOpen(false); setPlaceOpen(false); setPlanOpen(false); }, [subjectKey]);
  const closePicker = useCallback(() => setPickerOpen(false), []);
  const closePlace = useCallback(() => setPlaceOpen(false), []);

  const boxes = snap ? snap.boxes : undefined;
  const subjectTitle = (() => {
    if (!subject) return '';
    if (subject.boxId) { const b = (boxes ?? []).find((x) => x.id === subject.boxId); return b ? (b.kind === 'ink' ? 'A sketch' : titleOf(b.text)) : ''; }
    return titleOf(getJournalEntry(subject.entryId)?.text);
  })();
  const g = subject ? graftsOf(subject, boxes) : null;
  const paired = snap ? pairedPageRow(snap.boardId) : null;
  const plan = page ? planGroupOf(page.id) : null;
  const hasConnected = !!g && (!!plan || g.Cards.length + g.Sources.length + g.Boards.length + g.Pages.length + g.sharedTags.length > 0);

  // "Came from <surface>": the router state the Back chip reads (fromBoardId / fromBoardTitle), on a page only, never the page itself
  const st = location.state as { fromBoardId?: string; fromBoardTitle?: string; fromCardId?: string; fromStepLabel?: string } | null;
  const fromId = page && st?.fromBoardId && st.fromBoardId !== page.id ? st.fromBoardId : null;
  const fromEntry = fromId ? getJournalEntry(fromId) : null;
  // W2: a page born by "Write this" came from a STEP - "Came from" names it ("Three-Act · Midpoint") and points at that card (while the card is still there)
  const fromStep = fromEntry && st?.fromCardId && st.fromStepLabel && liveBoxes(fromEntry.boxes ?? []).some((b) => b.id === st.fromCardId) ? { boxId: st.fromCardId, label: st.fromStepLabel } : null;
  const cameFrom: CameFrom | null = fromEntry ? (fromStep ? { entryId: fromEntry.id, title: fromStep.label, boxId: fromStep.boxId } : { entryId: fromEntry.id, title: st?.fromBoardTitle || titleOf(fromEntry.text) }) : null;
  // W2 "Place this...": on a PAGE (not a board), offered while any Deck has a step to place it on
  const canPlace = !!page && !snap && searchSteps('', page.id).length > 0;

  const remove = (r: GraftRow) => requestDelete(() => {
    if (r.via === 'card' && r.connId) {
      const c = (boxes ?? []).find((x) => x.id === r.connId);
      getBoardActions()?.removeConnection(r.connId);
      if (c?.connA && c.connB) { const a = c.connA, b = c.connB; setUndo({ line: t('graftRemovedLine').replace('{title}', r.title), run: () => { getBoardActions()?.addConnection(a, b); } }); }
    } else if (r.linkId) {
      const id = r.linkId;
      removePageLink(id);
      setUndo({ line: t('graftRemovedLine').replace('{title}', r.title), run: () => { restorePageLink(id); } });
    }
  }, { title: t('linksRemoveTitle'), always: true, noDontAsk: true });
  const hide = (cardId: string, title: string) => {
    if (!page) return;
    const pid = page.id;
    hidePlanCard(pid, cardId);
    setUndo({ line: t('graftHiddenLine').replace('{title}', title), run: () => unhidePlanCard(pid, cardId) });
  };
  const kindOf = (r: GraftRow) => (r.group === 'Cards' ? 'card' : r.group === 'Boards' ? 'board' : 'page');
  const kindWord = (k: string) => (k === 'page' ? t('linksKindPage') : k === 'board' ? t('linksKindBoard') : t('linksKindCard'));
  const groups: Array<[GraftRow['group'], string]> = [['Cards', t('graftGroupCards')], ['Sources', t('graftGroupSources')], ['Boards', t('graftGroupBoards')], ['Pages', t('graftGroupPages')]];
  const planWord = plan ? (plan.count === 1 ? t('graftPlanCardsOne') : t('graftPlanCardsMany').replace('{n}', String(plan.count))) : '';

  return (
    <div className="wz-links-pane" data-links-pane="">
      <button ref={addRef} type="button" className="wz-graft-add" data-graft-add="" disabled={!subject} aria-expanded={pickerOpen ? 'true' : 'false'}
        onClick={() => { setPlaceOpen(false); setPickerOpen((o) => !o); }}>
        <span aria-hidden="true">+</span> {t('graftAdd')}
      </button>
      {canPlace && (
        <button ref={placeRef} type="button" className="wz-graft-add" data-graft-place-this="" aria-expanded={placeOpen ? 'true' : 'false'}
          onClick={() => { setPickerOpen(false); setPlaceOpen((o) => !o); }}>
          {t('graftPlaceThis')}
        </button>
      )}
      {paired && (
        <div className="wz-graft-paired" data-graft-paired="" data-graft-entry={paired.entryId}>
          <span className="wz-links-thumb wz-links-thumb--page" aria-hidden="true" />
          <span className="wz-graft-from">{t('graftPairedPage')}</span>
          <span className="wz-graft-title">{paired.title}</span>
        </div>
      )}
      {hasConnected && (
        <div className="wz-graft-connected" data-graft-connected="">{t('graftConnectedTo')} <b>{subjectTitle}</b></div>
      )}
      {plan && (
        <div className="wz-graft-plan-group">
          <button type="button" className="wz-graft-plan" data-graft-plan="" aria-expanded={planOpen ? 'true' : 'false'} onClick={() => setPlanOpen((o) => !o)}>
            <span className="wz-graft-chev" aria-hidden="true" />
            <span className="wz-links-thumb wz-links-thumb--board" aria-hidden="true" />
            <span>{t('graftPlanBoard')} · {planWord}</span>
          </button>
          {planOpen && (
            <ul className="wz-links-list wz-graft-plan-list">
              {plan.cards.map((c) => (
                <li key={c.boxId} className="wz-graft-row" data-graft-plan-card={c.boxId}>
                  <span className="wz-links-thumb wz-links-thumb--card" aria-hidden="true" />
                  <span className="wz-graft-title">{c.title}</span>
                  <button type="button" className="wz-graft-x" data-graft-hide="" aria-label={`${t('graftHideAria')}: ${c.title}`} onClick={() => hide(c.boxId, c.title)}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {g && groups.map(([key, label]) => g[key].length > 0 && (
        <div key={key} className="wz-graft-group" data-graft-group={key}>
          <div className="wz-graft-gh">{label}</div>
          <ul className="wz-links-list" data-links-list="">
            {g[key].map((r) => (
              <li key={r.key} className="wz-links-item wz-graft-row" data-link-key={r.key} data-link-via={r.via} data-link-kind={kindOf(r)} data-trashed={r.trashed ? 'true' : 'false'}
                data-graft-entry={r.entryId} {...(r.boxId ? { 'data-graft-box': r.boxId } : {})}>
                <span className={`wz-links-thumb wz-links-thumb--${kindOf(r)}`} aria-hidden="true" />
                <span className="wz-links-label wz-graft-title" title={kindWord(kindOf(r))}>{r.title}</span>
                {r.placeDiffers && r.place && <span className="wz-graft-place">{r.place}</span>}
                <button type="button" className="wz-links-x wz-graft-x" aria-label={`${t('linksRemoveAria')}: ${r.title}`} onClick={() => remove(r)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {g && g.sharedTags.length > 0 && (
        <div className="wz-graft-group" data-graft-group="SharedTags">
          <div className="wz-graft-gh">{t('graftSharedTags')}</div>
          <ul className="wz-links-list">
            {g.sharedTags.map((r) => (
              <li key={r.key} className="wz-graft-tagrow" data-graft-tag-entry={r.entryId}>
                <span className="wz-graft-tagm">#{r.tag}</span>
                <span className="wz-graft-title">{r.title}</span>
                {r.placeDiffers && r.place && <span className="wz-graft-place">{r.place}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {undo && (
        <div className="wz-graft-undo" data-graft-undo="">
          <span>{undo.line}</span>
          <button type="button" onClick={() => { undo.run(); setUndo(null); }}>{t('graftUndo')}</button>
        </div>
      )}
      {pickerOpen && subject && <GraftPicker subject={subject} boxes={boxes} anchor={addRef.current} cameFrom={cameFrom} onClose={closePicker} beforePick={birthFirst} />}
      {placeOpen && canPlace && subject && <GraftPicker mode="steps" title={t('graftPlaceThis')} subject={subject} anchor={placeRef.current} cameFrom={null} onClose={closePlace} beforePick={birthFirst} />}
    </div>
  );
}
