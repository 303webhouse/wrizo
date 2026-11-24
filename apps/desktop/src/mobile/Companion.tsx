// THE COMPANION'S SCREENS (MOBILE slice 1, items 1 to 3). PLAIN on purpose (Fable, Nov 23: Nick's verdict on the test version shapes the look before anything ships). The layout follows the test version: Desk · a big + · Library at the bottom;
// a Doc with Read · Plan · Assets and a strip of Parts; a Board as a wall or a list; Find. Every word comes from the lexicon (canonical/mobile.ts); the + has none.
// NOT here (not built, so not shown, never greyed): Photo, Sketch, Voice, Write, Show, Picture, New Doc, "On Your Desk", "from phone" (M1 unruled), ticking the Plan (it would save something new).
import { useEffect, useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import type { DeskTermId } from '../store/deskLexicon';
import { subscribe, getJournalEntries, getJournalEntry, getProjects, getDrawers, getSystemKind } from '../store/persistence';
import { getPlanBoardId } from '../store/persistence/planPairing';
import { startSync, stopSync } from '../store/sync';
import { liveBoxes } from '../store/boxTombstones';
import { partsOfDoc } from '../reorg/parts';
import { planOrder } from '../reorg/backMenu/planOps';
import type { JournalEntry, Box } from '../types';
import { whoIsHere, type Who } from './session';
import { sendWaiting, waitingNotes, writeNote } from './sendNote';
import type { WaitingNote, NoteTarget } from './noteQueue';
import { placesOfDoc } from './docBoards';

type T = (term: DeskTermId) => string;
type Route =
  | { at: 'desk' }
  | { at: 'library'; tab: 'docs' | 'projects' | 'unfiled' }
  | { at: 'find'; q: string }
  | { at: 'doc'; id: string; view: 'read' | 'plan' | 'assets'; part?: string }
  | { at: 'board'; id: string; as: 'wall' | 'list' };

// ---- the address: #/desk, #/library/docs, #/find/<q>, #/doc/<id>/<view>/<part>, #/board/<id>/<as>  (the phone's Back button walks it) ----
function parse(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (p[0] === 'library') return { at: 'library', tab: p[1] === 'projects' || p[1] === 'unfiled' ? p[1] : 'docs' };
  if (p[0] === 'find') return { at: 'find', q: p[1] ?? '' };
  if (p[0] === 'doc' && p[1]) return { at: 'doc', id: p[1], view: p[2] === 'plan' || p[2] === 'assets' ? p[2] : 'read', part: p[3] || undefined };
  if (p[0] === 'board' && p[1]) return { at: 'board', id: p[1], as: p[2] === 'list' ? 'list' : 'wall' };
  return { at: 'desk' };
}
const go = (...parts: string[]) => { window.location.hash = '#/' + parts.map(encodeURIComponent).join('/'); };

const titleOf = (e: JournalEntry): string => {
  const line = (e.text ?? '').split('\n').map((l) => l.replace(/[*_#>]/g, '').trim()).find(Boolean) ?? '';
  return line.length > 60 ? line.slice(0, 60) + '…' : line || '—';
};
const byRecent = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt);
const isOrdinaryBoard = (e: JournalEntry) => e.pageType === 'board' && !e.deletedAt && !e.purgedAt && e.origin !== 'system' && !getSystemKind(e);
const allBoards = (): JournalEntry[] => getJournalEntries().filter(isOrdinaryBoard).sort(byRecent);
const cardsOf = (e: JournalEntry): Box[] => liveBoxes(e.boxes).filter((b) => b.kind === 'text').sort((a, b) => a.y - b.y || a.x - b.x);

export function Companion(): ReactNode {
  const { t } = useDeskLexicon();
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [who, setWho] = useState<Who | null>(null);
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  const [sheet, setSheet] = useState(false);
  const [waiting, setWaiting] = useState<WaitingNote[]>([]);

  const refreshWaiting = () => setWaiting(waitingNotes());
  useEffect(() => subscribe(bump), []);
  useEffect(() => {
    const on = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    let live = true;
    void whoIsHere().then((w) => {
      if (!live) return;
      setWho(w);
      if (w.state === 'authed') { refreshWaiting(); if (w.online) void startSync(); void sendWaiting().then(refreshWaiting); }
    });
    const back = () => { void sendWaiting().then(refreshWaiting); };   // the signal returned
    window.addEventListener('online', back);
    const tick = window.setInterval(() => { if (waitingNotes().length) back(); refreshWaiting(); }, 8000);
    return () => { live = false; window.removeEventListener('online', back); window.clearInterval(tick); stopSync(); };
  }, []);

  if (!who) return <div className="mc-shell" aria-busy="true" />;
  if (who.state === 'anon') {
    return (
      <div className="mc-shell"><main className="mc-main">
        <a className="mc-btn" href="/">{t('mobileSignIn')}</a>
      </main></div>
    );
  }

  const nav = (to: 'desk' | 'library') => go(to === 'desk' ? 'desk' : 'library', ...(to === 'library' ? ['docs'] : []));
  const here = route.at === 'library' || route.at === 'find' ? 'library' : route.at === 'desk' ? 'desk' : null;
  const openBoardId = route.at === 'board' ? route.id : null;

  return (
    <div className="mc-shell">
      <main className="mc-main" id="mc-main">
        {route.at === 'desk' && <Desk t={t} waiting={waiting} />}
        {route.at === 'library' && <Library t={t} tab={route.tab} />}
        {route.at === 'find' && <Find t={t} q={route.q} />}
        {route.at === 'doc' && <Doc t={t} route={route} />}
        {route.at === 'board' && <Board t={t} route={route} waiting={waiting} />}
      </main>
      <nav className="mc-bar" aria-label="Wrizo">
        <button type="button" className="mc-door" aria-current={here === 'desk' ? 'page' : undefined} onClick={() => nav('desk')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9H3z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>{t('mobileDesk')}
        </button>
        <button type="button" className="mc-plus" aria-label={t('mobileAddName')} onClick={() => setSheet(true)}><span aria-hidden="true">+</span></button>
        <button type="button" className="mc-door" aria-current={here === 'library' ? 'page' : undefined} onClick={() => nav('library')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4v16H5zM11 4h4v16h-4zM17 6l3 .8-3.6 13.2-3-.8z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>{t('mobileLibrary')}
        </button>
      </nav>
      {sheet && <AddSheet t={t} defaultBoard={openBoardId} onClose={() => setSheet(false)} onSent={() => { setSheet(false); refreshWaiting(); }} />}
    </div>
  );
}

// ---- Desk: Recent Docs and Boards (Pinned and the Mobile Board wait: pins load with the account's rail, and the Mobile Board waits on Nick's word on its marker) ----
function Desk({ t, waiting }: { t: T; waiting: WaitingNote[] }): ReactNode {
  const docs = getProjects().slice().sort(byRecent).slice(0, 5);
  const boards = allBoards().slice(0, 5);
  return (
    <>
      <h1 className="mc-h">{t('mobileDesk')}</h1>
      {waiting.length > 0 && <WaitingList t={t} notes={waiting} />}
      <h2 className="mc-h2">{t('mobileRecent')}</h2>
      <ul className="mc-list">
        {docs.map((d) => <li key={d.id}><button type="button" className="mc-row" onClick={() => go('doc', d.id, 'read')}>{d.title || '—'}</button></li>)}
        {boards.map((b) => <li key={b.id}><button type="button" className="mc-row" onClick={() => go('board', b.id, 'wall')}>{titleOf(b)}</button></li>)}
      </ul>
      {docs.length + boards.length === 0 && <p className="mc-dim">{t('mobileNothingHere')}</p>}
    </>
  );
}

function WaitingList({ t, notes }: { t: T; notes: WaitingNote[] }): ReactNode {
  return (
    <ul className="mc-list mc-waiting" aria-label={t('mobileWaiting')}>
      {notes.map((n) => (
        <li key={n.id} className="mc-note"><span className="mc-mark">{t('mobileWaiting')}</span> {n.text.length > 90 ? n.text.slice(0, 90) + '…' : n.text}</li>
      ))}
    </ul>
  );
}

// ---- Library: Docs · Projects · Unfiled, and Find ----
function Library({ t, tab }: { t: T; tab: 'docs' | 'projects' | 'unfiled' }): ReactNode {
  const [q, setQ] = useState('');
  const tabs: Array<['docs' | 'projects' | 'unfiled', DeskTermId]> = [['docs', 'mobileDocs'], ['projects', 'mobileProjects'], ['unfiled', 'mobileUnfiled']];
  const docs = getProjects().slice().sort(byRecent);
  const drawers = getDrawers().filter((d) => !d.deletedAt && !d.purgedAt);
  const unfiled = getJournalEntries().filter((e) => !e.projectId && !e.deletedAt && !e.purgedAt && e.origin !== 'system' && !getSystemKind(e)).sort(byRecent);
  return (
    <>
      <form className="mc-find" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go('find', q.trim()); }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('mobileFind')} aria-label={t('mobileFind')} />
      </form>
      <div className="mc-tabs" role="tablist">
        {tabs.map(([id, word]) => <button key={id} role="tab" type="button" aria-selected={tab === id} className="mc-tab" onClick={() => go('library', id)}>{t(word)}</button>)}
      </div>
      <ul className="mc-list">
        {tab === 'docs' && docs.map((d) => <li key={d.id}><button type="button" className="mc-row" onClick={() => go('doc', d.id, 'read')}>{d.title || '—'}</button></li>)}
        {tab === 'projects' && drawers.map((d) => (
          <li key={d.id}><span className="mc-h3">{d.name}</span>
            <ul className="mc-list">{docs.filter((p) => p.drawerId === d.id).map((p) => <li key={p.id}><button type="button" className="mc-row" onClick={() => go('doc', p.id, 'read')}>{p.title || '—'}</button></li>)}</ul>
          </li>
        ))}
        {tab === 'unfiled' && unfiled.map((e) => (
          <li key={e.id}><button type="button" className="mc-row" onClick={() => go(e.pageType === 'board' ? 'board' : 'doc', e.id, ...(e.pageType === 'board' ? ['wall'] : ['read']))}>{titleOf(e)}</button></li>
        ))}
      </ul>
    </>
  );
}

function Find({ t, q }: { t: T; q: string }): ReactNode {
  const needle = q.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!needle) return [];
    const out: Array<{ key: string; label: string; to: string[] }> = [];
    for (const d of getProjects()) if ((d.title ?? '').toLowerCase().includes(needle)) out.push({ key: 'p' + d.id, label: d.title, to: ['doc', d.id, 'read'] });
    for (const e of getJournalEntries()) {
      if (e.deletedAt || e.purgedAt || getSystemKind(e)) continue;
      if (e.pageType === 'board') {
        if (cardsOf(e).some((c) => (c.text ?? '').toLowerCase().includes(needle)) || (e.text ?? '').toLowerCase().includes(needle)) out.push({ key: 'e' + e.id, label: titleOf(e), to: ['board', e.id, 'wall'] });
      } else if ((e.text ?? '').toLowerCase().includes(needle) && e.projectId) out.push({ key: 'e' + e.id, label: titleOf(e), to: ['doc', e.projectId, 'read', e.id] });
    }
    return out.slice(0, 50);
  }, [needle]);
  return (
    <>
      <button type="button" className="mc-back" onClick={() => go('library', 'docs')}>{t('mobileBack')}</button>
      <h1 className="mc-h">{t('mobileFind')}: {q}</h1>
      <ul className="mc-list">{hits.map((h) => <li key={h.key}><button type="button" className="mc-row" onClick={() => go(...h.to)}>{h.label}</button></li>)}</ul>
      {hits.length === 0 && <p className="mc-dim">{t('mobileNoResults')}</p>}
    </>
  );
}

// ---- A Doc: Read · Plan · Assets, with the strip of Parts ----
function Doc({ t, route }: { t: T; route: Extract<Route, { at: 'doc' }> }): ReactNode {
  const doc = getProjects().find((p) => p.id === route.id);
  const parts = partsOfDoc(route.id);
  const part = parts.find((p) => p.id === route.part) ?? parts[0];
  const views: Array<['read' | 'plan' | 'assets', DeskTermId]> = [['read', 'mobileRead'], ['plan', 'mobilePlan'], ['assets', 'mobileAssets']];
  const planId = part ? getPlanBoardId(part.id) : null;
  const plan = planId ? getJournalEntry(planId) : null;
  const planRows = plan ? planOrder(plan.boxes).map((id) => (plan.boxes ?? []).find((b) => b.id === id)).filter((b): b is Box => !!b && b.kind === 'text') : [];
  const places = placesOfDoc(route.id);
  const docBoards = (places.kind === 'many' ? places.boards : places.kind === 'one' ? [places.board] : []).map((b) => getJournalEntry(b.id)).filter((b): b is JournalEntry => !!b);
  const entry = part ? getJournalEntry(part.id) : null;
  return (
    <>
      <button type="button" className="mc-back" onClick={() => go('library', 'docs')}>{t('mobileBack')}</button>
      <h1 className="mc-h">{doc?.title || '—'}</h1>
      <div className="mc-tabs" role="tablist">
        {views.map(([id, word]) => <button key={id} role="tab" type="button" aria-selected={route.view === id} className="mc-tab" onClick={() => go('doc', route.id, id, part?.id ?? '')}>{t(word)}</button>)}
      </div>
      <div className="mc-strip" role="tablist" aria-label={t('mobileRead')}>
        {parts.map((p) => <button key={p.id} role="tab" type="button" aria-selected={part?.id === p.id} className="mc-chip" onClick={() => go('doc', route.id, route.view, p.id)}>{p.name}</button>)}
      </div>
      {route.view === 'read' && (entry
        ? <article className="mc-page">{(entry.text ?? '').split(/\n{2,}|\n/).filter((l) => l.trim()).map((l, i) => <p key={i}>{l}</p>)}</article>
        : <p className="mc-dim">{t('mobileNothingHere')}</p>)}
      {route.view === 'plan' && (planRows.length
        ? <ol className="mc-list">{planRows.map((r) => <li key={r.id} className="mc-note">{(r.text ?? '').split('\n')[0]}</li>)}</ol>
        : <p className="mc-dim">{t('mobileNoPart')}</p>)}
      {route.view === 'assets' && (
        <>
          <h2 className="mc-h2">{t('mobileBoards')}</h2>
          <ul className="mc-list">{docBoards.map((b) => <li key={b.id}><button type="button" className="mc-row" onClick={() => go('board', b.id, 'wall')}>{titleOf(b)}</button></li>)}</ul>
          {docBoards.length === 0 && <p className="mc-dim">{t('mobileNothingHere')}</p>}
        </>
      )}
    </>
  );
}

// ---- A Board: Show As Wall or List, its cards, Add Card (a note typed straight onto it) ----
function Board({ t, route, waiting }: { t: T; route: Extract<Route, { at: 'board' }>; waiting: WaitingNote[] }): ReactNode {
  const b = getJournalEntry(route.id);
  const [adding, setAdding] = useState(false);
  if (!b || b.pageType !== 'board') return <><button type="button" className="mc-back" onClick={() => go('library', 'docs')}>{t('mobileBack')}</button><p className="mc-dim">{t('mobileNothingHere')}</p></>;
  const cards = cardsOf(b);
  const mine = waiting.filter((n) => n.to.kind === 'board' && n.to.id === b.id);
  return (
    <>
      <button type="button" className="mc-back" onClick={() => window.history.back()}>{t('mobileBack')}</button>
      <h1 className="mc-h">{titleOf(b)}</h1>
      <div className="mc-tabs" role="tablist" aria-label={t('mobileShowAs')}>
        <button role="tab" type="button" aria-selected={route.as === 'wall'} className="mc-tab" onClick={() => go('board', b.id, 'wall')}>{t('mobileWall')}</button>
        <button role="tab" type="button" aria-selected={route.as === 'list'} className="mc-tab" onClick={() => go('board', b.id, 'list')}>{t('mobileList')}</button>
      </div>
      <button type="button" className="mc-btn" onClick={() => setAdding(true)}>{t('mobileAddCard')}</button>
      {mine.length > 0 && <WaitingList t={t} notes={mine} />}
      <ul className={route.as === 'wall' ? 'mc-wall' : 'mc-list'}>
        {cards.map((c) => <li key={c.id} className="mc-card">{c.text}</li>)}
      </ul>
      {cards.length + mine.length === 0 && <p className="mc-dim">{t('mobileNothingHere')}</p>}
      {adding && <AddSheet t={t} defaultBoard={b.id} onClose={() => setAdding(false)} onSent={() => setAdding(false)} />}
    </>
  );
}

// ---- The + : a Note to a Board, in two taps (type, Send). Send To is filled in: the Board she is on; otherwise she Changes it. ----
function AddSheet({ t, defaultBoard, onClose, onSent }: { t: T; defaultBoard: string | null; onClose: () => void; onSent: () => void }): ReactNode {
  const [text, setText] = useState('');
  const [place, setPlace] = useState<NoteTarget | null>(defaultBoard ? { kind: 'board', id: defaultBoard } : null);
  const [choosing, setChoosing] = useState(!defaultBoard);
  // choosing a Doc: its own connected Boards (one lands at once; several are listed; none says so). Never a Mobile Board made for a Doc.
  const [inDoc, setInDoc] = useState<string | null>(null);
  const boards = allBoards();
  const docs = getProjects().slice().sort(byRecent);
  const docPlaces = inDoc ? placesOfDoc(inDoc) : null;
  const pickBoard = (id: string) => { setPlace({ kind: 'board', id }); setInDoc(null); setChoosing(false); };
  const pickDoc = (id: string) => {
    const p = placesOfDoc(id);
    if (p.kind === 'one') pickBoard(p.board.id); else setInDoc(id);
  };
  const placeName = !place ? '' : place.kind === 'unfiled' ? t('mobileUnfiled') : titleOf(getJournalEntry(place.id) ?? ({ text: '' } as JournalEntry));
  const send = () => {
    if (!place || !text.trim()) return;
    void writeNote(text, place).then(onSent);
  };
  const boardRow = (id: string) => <li key={id}><button type="button" className="mc-row" aria-pressed={place?.kind === 'board' && place.id === id} onClick={() => pickBoard(id)}>{titleOf(getJournalEntry(id) ?? ({ text: '' } as JournalEntry))}</button></li>;
  return (
    <div className="mc-sheet" role="dialog" aria-modal="true" aria-label={t('mobileNote')}>
      <div className="mc-sheet-in">
        <label className="mc-label" htmlFor="mc-note">{t('mobileNote')}</label>
        <textarea id="mc-note" className="mc-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} autoFocus aria-label={t('mobileNoteLabel')} />
        <div className="mc-sendto">
          <span>{t('mobileSendTo')}: <strong>{place ? placeName : t('mobileNoPlace')}</strong></span>
          <button type="button" className="mc-link" onClick={() => setChoosing((c) => !c)}>{t('mobileChange')}</button>
        </div>
        {choosing && !inDoc && (
          <div className="mc-pick">
            <h2 className="mc-h2">{t('mobileDocs')}</h2>
            <ul className="mc-list">{docs.map((d) => <li key={d.id}><button type="button" className="mc-row" onClick={() => pickDoc(d.id)}>{d.title || '—'}</button></li>)}</ul>
            <h2 className="mc-h2">{t('mobileBoards')}</h2>
            <ul className="mc-list">
              {boards.map((b) => boardRow(b.id))}
              {boards.length === 0 && <li className="mc-dim">{t('mobileNothingHere')}</li>}
            </ul>
          </div>
        )}
        {choosing && inDoc && docPlaces && (
          <div className="mc-pick">
            <button type="button" className="mc-back" onClick={() => setInDoc(null)}>{t('mobileBack')}</button>
            <h2 className="mc-h2">{docs.find((d) => d.id === inDoc)?.title || '—'}</h2>
            {docPlaces.kind === 'many' && <ul className="mc-list">{docPlaces.boards.map((b) => boardRow(b.id))}</ul>}
            {docPlaces.kind === 'none' && (
              <>
                <p className="mc-dim">{t('mobileDocNoBoard')}</p>
                <button type="button" className="mc-btn" onClick={() => setInDoc(null)}>{t('mobileBoards')}</button>
                <button type="button" className="mc-btn" onClick={() => { setPlace({ kind: 'unfiled' }); setInDoc(null); setChoosing(false); }}>{t('mobileLeaveUnfiled')}</button>
              </>
            )}
          </div>
        )}
        <div className="mc-actions">
          <button type="button" className="mc-btn" onClick={onClose}>{t('mobileBack')}</button>
          <button type="button" className="mc-btn mc-primary" disabled={!place || !text.trim()} onClick={send}>{t('mobileSend')}</button>
        </div>
      </div>
    </div>
  );
}
