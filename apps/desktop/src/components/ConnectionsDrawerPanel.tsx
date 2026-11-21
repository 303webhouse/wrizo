import { useDeskLexicon } from '../store/deskLexicon';
import type { ReactNode } from 'react';
import { useBoardSnapshot, getBoardActions } from '../store/boardSelection';
import { flushNow, getJournalEntry, getPageLinksOf, getPageLinksTo, getUnbornEntry, removePageLink, subscribe } from '../store/persistence';
import { requestDelete } from '../store/deleteGate';
import { withoutFontMarks } from '../store/markRuns';
import { setLinkDock } from '../store/linkDock';
import { graftsOf, graftTo, hidePlanCard, isGrafted, pairedPageRow, placeLabelOf, planGroupOf, restorePageLink, unhidePlanCard, type GraftRow, type GraftSubject, type Grafts } from '../store/grafts';
import { assetCount, assetGroupsOf, type AssetGroup } from '../reorg/backMenu/assetGroups';
import { AssetAddMenu } from '../reorg/backMenu/AssetAddMenu';
import { ASSET_SORTS, setAssetsSort, sortAssetGroups, useAssetsSort, type AssetSort } from '../reorg/backMenu/assetSort';
import { addDocAsset, docAssetsOf, hasMadeDoc, removeDocAsset } from '../reorg/docSettings';
import { unbornHref } from '../store/unbornPage';
import { AssetGroups } from '../reorg/backMenu/AssetGroupsList';
import { partsOfDoc } from '../reorg/partsSeam';
import { assetDragFromDoc, assetTitle, connectAssetToPart, readAssetDrag } from '../reorg/assetConnect';
import { assetColour, setAssetColour } from '../reorg/assetColour';
import { assetCountOf } from '../reorg/partAssets';
import { AssetPartGroups, type PartAssets } from '../reorg/backMenu/AssetPartGroups';
import { openSplit, splitBlocked } from '../reorg/split/splitStore';
import { searchSteps } from '../store/writePlace';
import { liveBoxes } from '../store/boxTombstones';
import { GraftPicker, type CameFrom } from './GraftPicker';
import { useUnborn } from './UnbornSurface';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// the Grafts pane: the subject is the open page, or on a board its selected card (or the board); + Graft first, then the paired page, the plan board folded, and the graft groups; with nothing grafted it is the + Graft control alone [ConnectionsDrawerPanel §3]
// `run` absent: a line with nothing to undo (the reorg's "→ Part" when it wrote nothing)
type Undo = { line: string; run?: () => void } | null;
// THE ASSETS TAB'S SORTS (reorg/backMenu/assetSort.ts): their words, in the row's order
const SORT_WORD: Record<AssetSort, 'reorgAssetsSortAz' | 'reorgAssetsSortNew' | 'reorgAssetsSortOld' | 'reorgAssetsSortProject'> = { az: 'reorgAssetsSortAz', new: 'reorgAssetsSortNew', old: 'reorgAssetsSortOld', project: 'reorgAssetsSortProject' };
const titleOf = (text: string | undefined): string => (withoutFontMarks(text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60) || 'Untitled';

// ARBOR v2 MOCKUP (?arbor2=1, Arbor only): `only` shows ONE VIEW of this pane under the Tutor drawer's cloth tabs. 'board' = the board parts
// (Place this..., the paired page, the plan board, the Boards group); 'grafts' = the rest (Cards, Sources, Pages, shared tags). "+ Graft..."
// is GRAFTS' alone (the Nick walk, Nov 8, Fable's ruling A1: "BOARD shows Board's, never the Graft row"; it was in both). Undefined (every
// caller off the flag) = the whole pane, byte-for-byte today's. A filter on what is drawn:
// no new behaviour, no new state.
// ARBOR v2 MOCKUP r18 - `help`: a "?" drawn at the end of the "+ Graft..." row (the Arbor mockup's Grafts help, off the folder tab); absent = today's row.
// THE REORG'S BACK MENU (`back`, ?reorg=1 in Machina, a page only): the SAME pane, the SAME + Graft control, picker, remove-with-undo and dock, but the list is the Assets tab's,
// grouped by board (reorg/backMenu/assetGroups.ts). Absent (every other caller) = today's pane, byte for byte.
export function ConnectionsDrawerPanel({ only, help, back, mode, prose }: { only?: 'board' | 'grafts'; help?: ReactNode; back?: boolean; mode?: string; prose?: boolean } = {}) {
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  const snap = useBoardSnapshot();
  const location = useLocation();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);   // a link added or removed anywhere redraws the list
  const [pickerOpen, setPickerOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [undo, setUndo] = useState<Undo>(null);
  const sortBy = useAssetsSort();   // the Assets tab's sort, her saved reorg fact (null: today's order)
  const addRef = useRef<HTMLButtonElement | null>(null);
  const placeRef = useRef<HTMLButtonElement | null>(null);

  // on a brand-new page a pick in + Graft births the page (birthWith); birth swaps the address with replaceState, which the router never hears, so the pane keeps following the id it saw unborn [ConnectionsDrawerPanel §4]
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
  // the Assets tab's list: grouped by board, the Page's own board first (a page only; the Back menu is not drawn on a board)
  const backGroups = back && g && !snap ? assetGroupsOf(g, plan, (id) => titleOf(getJournalEntry(id)?.text)) : null;
  // AN ASSET ONTO A PART (reorg/assetConnect.ts): "→ Part" lists the Doc's OTHER Parts, named as the Parts tab names them
  const docParts = backGroups && page ? partsOfDoc(page).parts : [];
  // `fromId`: the Part whose list the asset was picked in (everything in it is already connected to that Part); her own Part by default
  const toPartFrom = (fromId: string | undefined) => (asset: { entryId: string; boxId?: string }, title: string, partId: string) => {
    const part = docParts.find((p) => p.id === partId)?.name || t('reorgUntitled');
    const r = connectAssetToPart(partId, asset, fromId);
    const fill = (k: 'reorgConnectedLine' | 'reorgAlreadyConnected' | 'reorgConnectRefused') => t(k).replace('{title}', title).replace('{part}', part);
    if (r.made === 'link') { const id = r.linkId; setUndo({ line: fill('reorgConnectedLine'), run: () => { removePageLink(id); } }); }
    else setUndo({ line: fill(r.made === 'already' ? 'reorgAlreadyConnected' : 'reorgConnectRefused') });
  };
  // THE TEAM B RESTYLE (slice 3): a group per Part with assets, in the Doc's order (her Part's list is today's; another Part's is read the same way
  // and its acts are bound to that Part); "Assets (n)" counts them all
  // THE ASSETS "+" (3b item 1): her own Part is listed even with none, so its "+" is there; every list follows her sort (assetSort.ts), a row's date being its link's
  const sortedFor = (partId: string, gs: AssetGroup[]): AssetGroup[] => {
    if (!sortBy) return gs;
    const dates = new Map<string, string>();
    for (const l of [...getPageLinksOf(partId), ...getPageLinksTo(partId)]) dates.set(l.id, l.createdAt);
    return sortAssetGroups(gs, sortBy, (it) => (it.row.linkId ? dates.get(it.row.linkId) ?? '' : getJournalEntry(it.row.entryId)?.createdAt ?? ''), placeLabelOf);
  };
  const partAssets: PartAssets[] = backGroups && page ? docParts.map((p) => ({
    id: p.id, name: p.name || t('reorgUntitled'), color: p.color ?? null, count: assetCountOf(p.id),
    groups: sortedFor(p.id, p.id === page.id ? backGroups : assetGroupsOf(graftsOf({ entryId: p.id }), planGroupOf(p.id), (id) => titleOf(getJournalEntry(id)?.text))),
  })).filter((p) => p.count > 0 || p.id === page.id) : [];
  // THE DOC'S OWN ASSETS (Nick ruled A, Nov 20: projects.doc_settings `assets`, through reorg/docSettings.ts): a made Doc only (a loose page is its own Doc of one
  // Part, so its "+" connects to the page itself). Drawn as a Part's list is, from rows read off the Doc's record; dragged into a Part each stays here.
  const madeDoc = !!backGroups && !!page && hasMadeDoc(page.id);
  const docAssets = madeDoc && page ? docAssetsOf(page.id) : [];
  const docGroups: AssetGroup[] = (() => {
    if (docAssets.length === 0) return [];
    const rows: Grafts = { Cards: [], Sources: [], Boards: [], Pages: [], sharedTags: [] };
    const at = new Map<string, string>();
    for (const a of docAssets) {
      const e = getJournalEntry(a.entryId);
      if (!e) continue;
      const group: GraftRow['group'] = a.boxId ? 'Cards' : e.pageType === 'board' ? 'Boards' : (e.importedAt || e.pageSettings?.kind === 'research') ? 'Sources' : 'Pages';
      const key = `doc:${a.entryId}:${a.boxId ?? ''}`;
      at.set(key, a.at);
      rows[group].push({ key, group, entryId: a.entryId, ...(a.boxId ? { boxId: a.boxId } : {}), title: assetTitle(a) || t('reorgUntitled'), place: placeLabelOf(a.entryId), placeDiffers: false });
    }
    return sortAssetGroups(assetGroupsOf(rows, null, (id) => titleOf(getJournalEntry(id)?.text)), sortBy, (it) => at.get(it.key) ?? at.get(it.row.key) ?? '', placeLabelOf);
  })();
  const removeDoc = (r: GraftRow) => requestDelete(() => {
    if (!page) return;
    const pid = page.id, asset = r.boxId ? { entryId: r.entryId, boxId: r.boxId } : { entryId: r.entryId };
    if (removeDocAsset(pid, asset)) setUndo({ line: t('graftRemovedLine').replace('{title}', r.title), run: () => { addDocAsset(pid, asset); } });
  }, { title: t('linksRemoveTitle'), always: true, noDontAsk: true });
  // New Board / New Doc: a departure to an unborn board or page that is connected at its birth (store/unbornPage.ts `asset`), with the way back to this page
  const openNew = (kind: 'board' | 'doc', asset: { part: string } | { doc: string }) => {
    if (!page) return;
    flushNow();
    navigate(unbornHref({ origin: 'loose', kind: kind === 'board' ? 'board' : 'prose', asset }), { state: { fromBoardId: page.id, fromBoardTitle: titleOf(page.text) } });
  };
  const hideFor = (partId: string) => (cardId: string, title: string) => {
    hidePlanCard(partId, cardId);
    setUndo({ line: t('graftHiddenLine').replace('{title}', title), run: () => unhidePlanCard(partId, cardId) });
  };

  return (
    <div className="wz-links-pane" data-links-pane="">
      {only !== 'board' && (() => { const add = (
      <button ref={addRef} type="button" className="wz-graft-add" data-graft-add="" disabled={!subject} aria-expanded={pickerOpen ? 'true' : 'false'}
        onClick={() => { setPlaceOpen(false); setPickerOpen((o) => !o); }}>
        <span aria-hidden="true">+</span> {t('graftAdd')}
      </button>
      ); return help ? <div className="wz-graft-add-row">{add}{help}</div> : add; })()}
      {canPlace && only !== 'grafts' && (
        <button ref={placeRef} type="button" className="wz-graft-add" data-graft-place-this="" aria-expanded={placeOpen ? 'true' : 'false'}
          onClick={() => { setPickerOpen(false); setPlaceOpen((o) => !o); }}>
          {t('graftPlaceThis')}
        </button>
      )}
      {backGroups && page && (
        <AssetPartGroups hereId={page.id} parts={partAssets} total={partAssets.reduce((n, p) => n + p.count, 0) + assetCount(docGroups)} t={t}
          plus={(target, partName) => {
            const isDoc = target === 'doc';
            return (
              <AssetAddMenu target={target} t={t} label={isDoc ? t('reorgAssetsAdd') : t('reorgAssetsAddTo').replace('{part}', partName ?? '')}
                subjectId={isDoc ? page.id : target}
                isPicked={(id) => (isDoc && madeDoc ? docAssetsOf(page.id).some((a) => a.entryId === id && !a.boxId) : isGrafted({ entryId: isDoc ? page.id : target }, { entryId: id }))}
                onPick={(id) => { if (isDoc && madeDoc) addDocAsset(page.id, { entryId: id }); else graftTo({ entryId: isDoc ? page.id : target }, { entryId: id }); }}
                onNew={(kind) => openNew(kind, isDoc ? (madeDoc ? { doc: page.id } : { part: page.id }) : { part: target })} />
            );
          }}
          sortRow={(
            <div className="wz-assets-sort" data-assets-sort="" role="group" aria-label={t('reorgAssetsSort')}>
              {ASSET_SORTS.map((by) => (
                <button key={by} type="button" data-sort={by} aria-pressed={sortBy === by ? 'true' : 'false'} onClick={() => setAssetsSort(by)}>{t(SORT_WORD[by])}</button>
              ))}
            </div>
          )}
          docList={docGroups.length > 0 ? (
            <div className="wz-back-docassets" data-assets-doc="">
              <div className="wz-graft-gh wz-back-doc-head">{t('reorgAssetsDocList')}</div>
              <AssetGroups groups={docGroups} t={t} besideOffered={!!prose} fromDoc
                besideNote={(() => { const why = splitBlocked(mode); return why === 'freewrite' ? t('reorgSplitNoFreewrite') : why === 'typewriter' ? t('reorgSplitNoTypewriter') : null; })()}
                kindWord={(k) => (k === 'card' ? t('linksKindCard') : k === 'board' ? t('linksKindBoard') : t('linksKindPage'))}
                onRemove={removeDoc} onHide={() => {}}
                onBeside={(entryId, boxId) => { if (!splitBlocked(mode)) openSplit(page.id, { entryId, ...(boxId ? { boxId } : {}) }); }}
                onOpenBoard={(id) => navigate(`/page/${id}`)}
                parts={docParts.map((d) => ({ id: d.id, word: d.name || t('reorgUntitled') }))} onToPart={toPartFrom('doc')}
                colourOf={assetColour} onColour={(asset, slot) => { setAssetColour(asset, slot); }} />
            </div>
          ) : null}
          onDropAsset={(partId, e) => {
            const asset = readAssetDrag(e.dataTransfer);
            if (asset) toPartFrom(assetDragFromDoc(e.dataTransfer) ? 'doc' : page.id)(asset, assetTitle(asset) || t('reorgUntitled'), partId);
          }}
          render={(p) => (
            <AssetGroups groups={p.groups} t={t} besideOffered={!!prose}
              besideNote={(() => { const why = splitBlocked(mode); return why === 'freewrite' ? t('reorgSplitNoFreewrite') : why === 'typewriter' ? t('reorgSplitNoTypewriter') : null; })()}
              kindWord={(k) => (k === 'card' ? t('linksKindCard') : k === 'board' ? t('linksKindBoard') : t('linksKindPage'))}
              onRemove={remove} onHide={p.id === page.id ? hide : hideFor(p.id)}
              onBeside={(entryId, boxId) => { if (!splitBlocked(mode)) openSplit(page.id, { entryId, ...(boxId ? { boxId } : {}) }); }}
              onOpenBoard={(id) => navigate(`/page/${id}`)}
              parts={docParts.filter((d) => d.id !== p.id).map((d) => ({ id: d.id, word: d.name || t('reorgUntitled') }))} onToPart={toPartFrom(p.id)}
              colourOf={assetColour} onColour={(asset, slot) => { setAssetColour(asset, slot); }} />
          )} />
      )}
      {!backGroups && paired && only !== 'grafts' && (
        <div className="wz-graft-paired" data-graft-paired="" data-graft-entry={paired.entryId}>
          <span className="wz-links-thumb wz-links-thumb--page" aria-hidden="true" />
          <span className="wz-graft-from">{t('graftPairedPage')}</span>
          <span className="wz-graft-title">{paired.title}</span>
        </div>
      )}
      {!backGroups && hasConnected && (
        <div className="wz-graft-connected" data-graft-connected="">{t('graftConnectedTo')} <b>{subjectTitle}</b></div>
      )}
      {!backGroups && plan && only !== 'grafts' && (
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
      {!backGroups && g && groups.map(([key, label]) => g[key].length > 0 && (only == null || (only === 'board') === (key === 'Boards')) && (
        <div key={key} className="wz-graft-group" data-graft-group={key}>
          <div className="wz-graft-gh">{label}</div>
          <ul className="wz-links-list" data-links-list="">
            {g[key].map((r) => (
              <li key={r.key} className="wz-links-item wz-graft-row" data-link-key={r.key} data-link-via={r.via} data-link-kind={kindOf(r)} data-trashed={r.trashed ? 'true' : 'false'}
                data-graft-entry={r.entryId} {...(r.boxId ? { 'data-graft-box': r.boxId } : {})}>
                <span className={`wz-links-thumb wz-links-thumb--${kindOf(r)}`} aria-hidden="true" />
                <span className="wz-links-label wz-graft-title" title={kindWord(kindOf(r))}>{r.title}</span>
                {r.placeDiffers && r.place && <span className="wz-graft-place">{r.place}</span>}
                {page && kindOf(r) !== 'board' && (
                  // dock this linked card or page beside the page (this device, one at a time) - the Tutor's dock carries it [ConnectionsDrawerPanel §5]
                  <button type="button" className="wz-graft-dock" aria-label={`${t('graftDockAria')}: ${r.title}`}
                    onClick={() => { setLinkDock(page.id, { entryId: r.entryId, ...(r.boxId ? { boxId: r.boxId } : {}) }); document.dispatchEvent(new Event('wz-link-dock-open')); }}>{t('graftDock')}</button>
                )}
                <button type="button" className="wz-links-x wz-graft-x" aria-label={`${t('linksRemoveAria')}: ${r.title}`} onClick={() => remove(r)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {!backGroups && g && only !== 'board' && g.sharedTags.length > 0 && (
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
          {undo.run && <button type="button" onClick={() => { undo.run?.(); setUndo(null); }}>{t('graftUndo')}</button>}
        </div>
      )}
      {pickerOpen && subject && <GraftPicker subject={subject} boxes={boxes} anchor={addRef.current} cameFrom={cameFrom} onClose={closePicker} beforePick={birthFirst} />}
      {placeOpen && canPlace && subject && <GraftPicker mode="steps" title={t('graftPlaceThis')} subject={subject} anchor={placeRef.current} cameFrom={null} onClose={closePlace} beforePick={birthFirst} />}
    </div>
  );
}
