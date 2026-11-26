// THE COMPANION'S SCREENS (MOBILE slice 1, items 1 to 3). PLAIN on purpose; the layout follows the test version: Desk · a big + · Library at the bottom; a Doc with Read · Plan · Assets and a strip of Parts;
// a Board as a wall or a list, a card opened; Library with Docs · Projects · Unfiled and Find. What each screen LISTS is read in shelf.ts, by the desk's own rules. Every word comes from the lexicon; the + has none.
// The phone only READS her work, and ADDS a note. NOT here (not built, so not shown, never greyed): Photo, Sketch, Voice, Write, Show, Picture, New Doc, "On Your Desk", "from phone" (M1 unruled), ticking the Plan.
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import type { DeskTermId } from '../store/deskLexicon';
import { useLexicon } from '../store/themeLexicon';
import { subscribe, getJournalEntries, getJournalEntry, flushForReload } from '../store/persistence';
import { startSync, stopSync } from '../store/sync';
import { useStaleClient } from '../store/staleClient';
import { SIGNED_OUT_KEY } from '../store/signedOutHere';
import { liveBoxes } from '../store/boxTombstones';
import { titleOfText } from '../reorg/backMenu/planOps';
import { markdownToHtml, plainToHtml } from '../reorg/publishingHtml';
import type { Box } from '../types';
import { whoIsHere, type Who } from './session';
import { sendWaiting, waitingNotes, writeNote } from './sendNote';
import { ACCOUNT_POINTER_KEY, type WaitingNote, type NoteTarget } from './noteQueue';
import { findMobileBoard } from './mobileBoard';
import { allBoardLines, assetsView, boardName, docLines, docView, findLines, pinnedLines, placesFor, planView, projectContents, projectLines, unfiledLines, type AssetList, type Line } from './shelf';

type T = (term: DeskTermId) => string;
/** The words every screen needs besides its own: the stand-in for a nameless thing, and the two Project names that are not hers. */
interface Words { untitled: string; notebook: string; root: string }
type Tab = 'docs' | 'projects' | 'unfiled';
type View = 'read' | 'plan' | 'assets';
type Route =
  | { at: 'desk' }
  | { at: 'library'; tab: Tab }
  | { at: 'project'; id: string }
  | { at: 'find'; q: string }
  | { at: 'doc'; id: string; view: View; part?: string }
  | { at: 'board'; id: string; as: 'wall' | 'list' }
  | { at: 'card'; board: string; box: string };

// ---- the address: #/desk, #/library/<tab>, #/project/<id>, #/find/<q>, #/doc/<id>/<view>/<part>, #/board/<id>/<as>, #/card/<board>/<box>  (the phone's Back button walks it) ----
function parse(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('/').map((s) => { try { return decodeURIComponent(s); } catch { return s; } });
  if (p[0] === 'library') return { at: 'library', tab: p[1] === 'projects' || p[1] === 'unfiled' ? p[1] : 'docs' };
  if (p[0] === 'project' && p[1]) return { at: 'project', id: p[1] };
  if (p[0] === 'find') return { at: 'find', q: p[1] ?? '' };
  if (p[0] === 'doc' && p[1]) return { at: 'doc', id: p[1], view: p[2] === 'plan' || p[2] === 'assets' ? p[2] : 'read', part: p[3] || undefined };
  if (p[0] === 'board' && p[1]) return { at: 'board', id: p[1], as: p[2] === 'list' ? 'list' : 'wall' };
  if (p[0] === 'card' && p[1] && p[2]) return { at: 'card', board: p[1], box: p[2] };
  return { at: 'desk' };
}
const address = (parts: string[]) => '#/' + parts.map(encodeURIComponent).join('/');
const go = (...parts: string[]) => { window.location.hash = address(parts); };
/** The same screen shown another way (a tab, a Part, wall or list): it does not add a step for Back to walk. */
const turn = (...parts: string[]) => { window.location.replace(address(parts)); };

const cardsOf = (boxes: Box[] | undefined): Box[] => liveBoxes(boxes).filter((b) => b.kind === 'text' || b.kind === 'page-pin').sort((a, b) => a.y - b.y || a.x - b.x);
const cardText = (c: Box): string => (c.kind === 'page-pin' ? titleOfText(c.entryId ? getJournalEntry(c.entryId)?.text : '') : c.text ?? '');

export function Companion(): ReactNode {
  const { t } = useDeskLexicon();
  const lex = useLexicon();
  const words: Words = { untitled: t('reorgUntitled'), notebook: lex.t('journal'), root: t('placeRootName') };
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [who, setWho] = useState<Who | null>(null);
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  const [sheet, setSheet] = useState(false);
  const [waiting, setWaiting] = useState<WaitingNote[]>([]);
  const [rail, setRail] = useState<unknown>(null);
  const [adding, setAdding] = useState<string | null>(null);   // Add Card on a Board
  const stale = useStaleClient();

  const refreshWaiting = () => setWaiting(waitingNotes());
  useEffect(() => subscribe(bump), []);
  useEffect(() => {
    const on = () => { setRoute(parse(window.location.hash)); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    let live = true;
    const pins = () => {
      void fetch('/api/rail', { credentials: 'include' }).then(async (r) => (r.ok ? ((await r.json()) as { rail?: unknown }).rail ?? null : null)).then((x) => { if (live && x) setRail(x); }).catch(() => { /* no signal: no Pinned this time */ });
    };
    const send = () => { void sendWaiting().then(() => { if (live) refreshWaiting(); }); refreshWaiting(); };
    const back = () => { void startSync(); pins(); send(); };   // the signal returned (startSync does nothing when it is already running)
    void whoIsHere().then((w) => {
      if (!live) return;
      setWho(w);
      if (w.state !== 'authed') return;
      refreshWaiting();
      if (w.online) { void startSync(); pins(); }
      send();
    });
    window.addEventListener('online', back);
    const tick = window.setInterval(() => { if (waitingNotes().length) send(); else refreshWaiting(); }, 8000);
    // signed out, or another account in, in another window of this phone: this screen is no longer hers to show
    const other = (e: StorageEvent) => { if (e.key === SIGNED_OUT_KEY || (e.key === ACCOUNT_POINTER_KEY && e.oldValue && e.newValue !== e.oldValue)) window.location.reload(); };
    window.addEventListener('storage', other);
    return () => { live = false; window.removeEventListener('online', back); window.removeEventListener('storage', other); window.clearInterval(tick); stopSync(); };
  }, []);
  // a newer build of Wrizo is out: this one has stopped syncing, so it reloads itself, once nothing is being typed
  useEffect(() => { if (stale && !sheet && !adding) { flushForReload(); window.location.reload(); } }, [stale, sheet, adding]);

  if (!who) return <div className="mc-shell" aria-busy="true" />;
  if (who.state === 'anon') {
    return (
      <div className="mc-shell"><main className="mc-main">
        <a className="mc-btn" href="/">{t('mobileSignIn')}</a>
      </main></div>
    );
  }

  const here = route.at === 'desk' ? 'desk' : route.at === 'library' || route.at === 'find' || route.at === 'project' ? 'library' : null;
  const sheetBoard = route.at === 'board' ? route.id : route.at === 'card' ? route.board : null;

  return (
    <div className="mc-shell">
      <main className="mc-main" id="mc-main">
        {route.at === 'desk' && <Desk t={t} words={words} waiting={waiting} rail={rail} />}
        {route.at === 'library' && <Library t={t} words={words} tab={route.tab} />}
        {route.at === 'project' && <ProjectScreen t={t} words={words} id={route.id} />}
        {route.at === 'find' && <Find t={t} words={words} q={route.q} />}
        {route.at === 'doc' && <Doc key={route.id} t={t} words={words} route={route} />}
        {route.at === 'board' && <Board t={t} words={words} route={route} waiting={waiting} onAdd={() => setAdding(route.id)} />}
        {route.at === 'card' && <Card t={t} board={route.board} box={route.box} />}
      </main>
      <nav className="mc-bar" aria-label="Wrizo">
        <button type="button" className="mc-door" data-door="desk" aria-current={here === 'desk' ? 'page' : undefined} onClick={() => go('desk')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9H3z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>{t('mobileDesk')}
        </button>
        <button type="button" className="mc-plus" aria-label={t('mobileAddName')} onClick={() => setSheet(true)}><span aria-hidden="true">+</span></button>
        <button type="button" className="mc-door" data-door="library" aria-current={here === 'library' ? 'page' : undefined} onClick={() => go('library', 'docs')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4v16H5zM11 4h4v16h-4zM17 6l3 .8-3.6 13.2-3-.8z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>{t('mobileLibrary')}
        </button>
      </nav>
      {(sheet || adding) && <AddSheet t={t} words={words} defaultBoard={adding ?? sheetBoard} onClose={() => { setSheet(false); setAdding(null); }} onSent={() => { setSheet(false); setAdding(null); refreshWaiting(); }} />}
    </div>
  );
}

// ---- rows and headings shared by the lists ----
function Back({ t }: { t: T }): ReactNode {
  return <button type="button" className="mc-back" onClick={() => (window.history.length > 1 ? window.history.back() : go('desk'))}>{t('mobileBack')}</button>;
}
function Rows({ rows, to }: { rows: Array<{ id: string; name: string }>; to: (id: string) => string[] }): ReactNode {
  return <ul className="mc-list">{rows.map((r) => <li key={r.id}><button type="button" className="mc-row" data-row={r.id} onClick={() => go(...to(r.id))}>{r.name}</button></li>)}</ul>;
}
const toDoc = (id: string) => ['doc', id, 'read'];
const toBoard = (id: string) => ['board', id, 'wall'];
const toProject = (id: string) => ['project', id];
function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return <section><h2 className="mc-h2">{title}</h2>{children}</section>;
}

// ---- Desk: notes still waiting, the Mobile Board, Pinned, Recent Docs and Boards ----
function Desk({ t, words, waiting, rail }: { t: T; words: Words; waiting: WaitingNote[]; rail: unknown }): ReactNode {
  const mobile = findMobileBoard();
  const pinned = pinnedLines(rail, words.notebook, words.root);
  const docs = docLines(words.untitled).slice(0, 5);
  const boards = allBoardLines(words.untitled).filter((b) => b.id !== mobile).slice(0, 5);
  return (
    <>
      <h1 className="mc-h">{t('mobileDesk')}</h1>
      {waiting.length > 0 && <WaitingList t={t} notes={waiting} />}
      {mobile && <ul className="mc-list"><li><button type="button" className="mc-row" data-mobile-board onClick={() => go('board', mobile, 'wall')}>{t('mobileMobile')}</button></li></ul>}
      {pinned.length > 0 && <Section title={t('mobilePinned')}><Rows rows={pinned} to={toProject} /></Section>}
      <Section title={t('mobileRecent')}>
        <Rows rows={docs} to={toDoc} />
        <Rows rows={boards} to={toBoard} />
        {docs.length + boards.length === 0 && <p className="mc-dim">{t('mobileNothingHere')}</p>}
      </Section>
    </>
  );
}

function WaitingList({ t, notes }: { t: T; notes: WaitingNote[] }): ReactNode {
  return (
    <ul className="mc-list mc-waiting" aria-label={t('mobileWaiting')}>
      {notes.map((n) => (
        <li key={n.id} className="mc-note" data-waiting={n.id}><span className="mc-mark">{t('mobileWaiting')}</span> {n.text.length > 90 ? n.text.slice(0, 90) + '…' : n.text}</li>
      ))}
    </ul>
  );
}

// ---- Library: Find, then Docs · Projects · Unfiled ----
function Library({ t, words, tab }: { t: T; words: Words; tab: Tab }): ReactNode {
  const [q, setQ] = useState('');
  const tabs: Array<[Tab, DeskTermId]> = [['docs', 'mobileDocs'], ['projects', 'mobileProjects'], ['unfiled', 'mobileUnfiled']];
  return (
    <>
      <h1 className="mc-h">{t('mobileLibrary')}</h1>
      <form className="mc-find" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go('find', q.trim()); }}>
        <input type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('mobileFind')} aria-label={t('mobileFind')} />
      </form>
      <div className="mc-tabs" role="tablist">
        {tabs.map(([id, word]) => <button key={id} role="tab" type="button" aria-selected={tab === id} className="mc-tab" data-tab={id} onClick={() => turn('library', id)}>{t(word)}</button>)}
      </div>
      {tab === 'docs' && <DocsList t={t} rows={docLines(words.untitled)} />}
      {tab === 'projects' && <Rows rows={projectLines(words.notebook, words.root)} to={toProject} />}
      {tab === 'unfiled' && <Contents t={t} {...unfiledLines(words.untitled)} />}
    </>
  );
}
function DocsList({ t, rows }: { t: T; rows: Line[] }): ReactNode {
  return rows.length ? <Rows rows={rows} to={toDoc} /> : <p className="mc-dim">{t('mobileNothingHere')}</p>;
}
function Contents({ t, docs, boards }: { t: T; docs: Line[]; boards: Line[] }): ReactNode {
  if (docs.length + boards.length === 0) return <p className="mc-dim">{t('mobileNothingHere')}</p>;
  return (
    <>
      {docs.length > 0 && <Section title={t('mobileDocs')}><Rows rows={docs} to={toDoc} /></Section>}
      {boards.length > 0 && <Section title={t('mobileBoards')}><Rows rows={boards} to={toBoard} /></Section>}
    </>
  );
}
function ProjectScreen({ t, words, id }: { t: T; words: Words; id: string }): ReactNode {
  const name = projectLines(words.notebook, words.root).find((p) => p.id === id)?.name;
  return (
    <>
      <Back t={t} />
      <h1 className="mc-h">{name ?? words.untitled}</h1>
      <Contents t={t} {...(name === undefined ? { docs: [], boards: [] } : projectContents(id, words.untitled))} />
    </>
  );
}

function Find({ t, words, q }: { t: T; words: Words; q: string }): ReactNode {
  const hits = useMemo(() => findLines(q, words.untitled), [q, words.untitled]);
  return (
    <>
      <Back t={t} />
      <h1 className="mc-h">{t('mobileFind')}: {q}</h1>
      <ul className="mc-list">{hits.map((h) => (
        <li key={h.key}><button type="button" className="mc-row" onClick={() => go(...h.to)}>{h.label}{h.where && <span className="mc-where">{h.where}</span>}</button></li>
      ))}</ul>
      {hits.length === 0 && <p className="mc-dim">{t('mobileNoResults')}</p>}
    </>
  );
}

// ---- A Doc: Read · Plan · Assets, with the strip of Parts ----
function Doc({ t, words, route }: { t: T; words: Words; route: Extract<Route, { at: 'doc' }> }): ReactNode {
  const doc = docView(route.id, words.untitled);
  const strip = useRef<HTMLDivElement | null>(null);
  const part = doc?.parts.find((p) => p.id === route.part) ?? doc?.parts.find((p) => p.id === route.id) ?? doc?.parts[0];
  useEffect(() => { strip.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' }); }, [part?.id]);
  if (!doc || !part) return <><Back t={t} /><p className="mc-dim">{t('mobileNothingHere')}</p></>;
  const views: Array<[View, DeskTermId]> = [['read', 'mobileRead'], ['plan', 'mobilePlan'], ['assets', 'mobileAssets']];
  return (
    <>
      <Back t={t} />
      <h1 className="mc-h">{doc.name}</h1>
      <div className="mc-tabs" role="tablist">
        {views.map(([id, word]) => <button key={id} role="tab" type="button" aria-selected={route.view === id} className="mc-tab" data-view={id} onClick={() => turn('doc', route.id, id, part.id)}>{t(word)}</button>)}
      </div>
      {doc.parts.length > 1 && (
        <div className="mc-strip" role="tablist" ref={strip}>
          {doc.parts.map((p) => <button key={p.id} role="tab" type="button" aria-selected={part.id === p.id} className="mc-chip" data-part={p.id} onClick={() => turn('doc', route.id, route.view, p.id)}>{p.name}</button>)}
        </div>
      )}
      {route.view === 'read' && <ReadPart t={t} id={part.id} script={part.script} />}
      {route.view === 'plan' && <Plan t={t} words={words} id={route.id} />}
      {route.view === 'assets' && <Assets t={t} words={words} doc={doc.name} part={part} />}
    </>
  );
}

/** One Part, to read. The app's own pure reader of her marks (the one Publish uses) makes the markup, and escapes every word. A screenplay's text is its lines: read only. */
function ReadPart({ t, id, script }: { t: T; id: string; script: boolean }): ReactNode {
  const text = getJournalEntry(id)?.text ?? '';
  if (!text.trim()) return <p className="mc-dim">{t('mobileNothingHere')}</p>;
  return <article className={script ? 'mc-page mc-script' : 'mc-page'} dangerouslySetInnerHTML={{ __html: script ? plainToHtml(text) : markdownToHtml(text) }} />;
}

/** The Plan, READ ONLY on the phone (ticking would save something new): a tick where the row's Part has words, and the Part's name or "No Part yet". */
function Plan({ t, words, id }: { t: T; words: Words; id: string }): ReactNode {
  const rows = planView(id, words.untitled);
  if (!rows.length) return <p className="mc-dim">{t('mobileNothingHere')}</p>;
  return (
    <ol className="mc-list">
      {rows.map((r) => (
        <li key={r.key} className="mc-plan" data-depth={r.depth} style={{ paddingLeft: 4 + Math.min(r.depth, 4) * 16 }}>
          <span className="mc-tick" aria-hidden={r.written ? undefined : true}>{r.written ? '✓' : ''}</span>
          <span className="mc-plan-text">
            <span className={r.title ? (r.depth === 0 ? 'mc-plan-head' : undefined) : 'mc-dim'}>{r.title || r.hint || words.untitled}</span>
            {r.partId
              ? <button type="button" className="mc-plan-part" onClick={() => turn('doc', id, 'read', r.partId!)}>{r.partName}</button>
              : <span className="mc-where">{t('mobileNoPart')}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Assets: All · Cards · Boards. The open Part's, then the whole Doc's, each under its own name. */
function Assets({ t, words, doc, part }: { t: T; words: Words; doc: string; part: { id: string; name: string } }): ReactNode {
  const [show, setShow] = useState<'all' | 'cards' | 'boards'>('all');
  const view = assetsView(part.id, words.untitled);
  const filters: Array<['all' | 'cards' | 'boards', DeskTermId]> = [['all', 'mobileAll'], ['cards', 'mobileCards'], ['boards', 'mobileBoards']];
  const list = (a: AssetList): ReactNode => (
    <>
      {show !== 'cards' && <Rows rows={a.boards} to={toBoard} />}
      {show !== 'boards' && <ul className="mc-list">{a.cards.map((c) => <li key={c.key}><button type="button" className="mc-row mc-asset" onClick={() => go('card', c.boardId, c.boxId)}>{c.name}</button></li>)}</ul>}
      {show === 'all' && <Rows rows={a.pages} to={toDoc} />}
    </>
  );
  const count = (a: AssetList): number => (show !== 'cards' ? a.boards.length : 0) + (show !== 'boards' ? a.cards.length : 0) + (show === 'all' ? a.pages.length : 0);
  return (
    <>
      <div className="mc-tabs" role="tablist" aria-label={t('mobileShowAs')}>
        {filters.map(([id, word]) => <button key={id} role="tab" type="button" aria-selected={show === id} className="mc-tab" data-filter={id} onClick={() => setShow(id)}>{t(word)}</button>)}
      </div>
      {count(view.part) > 0 && <Section title={part.name}>{list(view.part)}</Section>}
      {count(view.doc) > 0 && <Section title={doc}>{list(view.doc)}</Section>}
      {count(view.part) + count(view.doc) === 0 && <p className="mc-dim">{t('mobileNothingHere')}</p>}
    </>
  );
}

// ---- A Board: Show As Wall or List, its cards (each opens), Add Card ----
function Board({ t, words, route, waiting, onAdd }: { t: T; words: Words; route: Extract<Route, { at: 'board' }>; waiting: WaitingNote[]; onAdd: () => void }): ReactNode {
  const b = getJournalEntry(route.id);
  if (!b || b.pageType !== 'board' || b.purgedAt) return <><Back t={t} /><p className="mc-dim">{t('mobileNothingHere')}</p></>;
  const isMobile = findMobileBoard() === b.id;
  const mine = waiting.filter((n) => (n.to.kind === 'board' ? n.to.id === b.id : isMobile));
  const stillWaiting = new Set(mine.map((n) => n.id));
  const cards = cardsOf(b.boxes).filter((c) => !stillWaiting.has(c.id));   // a note still waiting is shown once, with its mark
  return (
    <>
      <Back t={t} />
      <h1 className="mc-h">{boardName(b, words.untitled)}</h1>
      <div className="mc-tabs" role="tablist" aria-label={t('mobileShowAs')}>
        <button role="tab" type="button" aria-selected={route.as === 'wall'} className="mc-tab" data-as="wall" onClick={() => turn('board', b.id, 'wall')}>{t('mobileWall')}</button>
        <button role="tab" type="button" aria-selected={route.as === 'list'} className="mc-tab" data-as="list" onClick={() => turn('board', b.id, 'list')}>{t('mobileList')}</button>
      </div>
      <button type="button" className="mc-btn" data-add-card onClick={onAdd}>{t('mobileAddCard')}</button>
      {mine.length > 0 && <WaitingList t={t} notes={mine} />}
      <ul className={route.as === 'wall' ? 'mc-wall' : 'mc-list'}>
        {cards.map((c) => <li key={c.id}><button type="button" className="mc-card" data-card={c.id} onClick={() => go('card', b.id, c.id)}>{cardText(c) || words.untitled}</button></li>)}
      </ul>
      {cards.length + mine.length === 0 && <p className="mc-dim">{t('mobileNothingHere')}</p>}
    </>
  );
}

function Card({ t, board, box }: { t: T; board: string; box: string }): ReactNode {
  const c = cardsOf(getJournalEntries().find((e) => e.id === board)?.boxes).find((x) => x.id === box);
  return (
    <>
      <Back t={t} />
      {!c && <p className="mc-dim">{t('mobileNothingHere')}</p>}
      {c && c.kind === 'text' && <div className="mc-card mc-card-open">{c.text}</div>}
      {c && c.kind === 'page-pin' && <button type="button" className="mc-row" onClick={() => c.entryId && go('doc', c.entryId, 'read')}>{cardText(c)}</button>}
    </>
  );
}

// ---- The + : a Note, in two taps (type, Send). Send To is filled in: the Board she is on, else the last place she used since opening the companion, else Mobile. ----
let lastPlace: NoteTarget | null = null;   // kept in memory only: nothing new is saved on the phone

function AddSheet({ t, words, defaultBoard, onClose, onSent }: { t: T; words: Words; defaultBoard: string | null; onClose: () => void; onSent: () => void }): ReactNode {
  const [text, setText] = useState('');
  const [place, setPlace] = useState<NoteTarget>(defaultBoard ? { kind: 'board', id: defaultBoard } : lastPlace && (lastPlace.kind !== 'board' || getJournalEntry(lastPlace.id)) ? lastPlace : { kind: 'unfiled' });
  const [choosing, setChoosing] = useState(false);
  const [notKept, setNotKept] = useState(false);
  // choosing a Doc: its own connected Boards (one lands at once; several are listed; none says so). Never a Mobile Board made for a Doc.
  const [inDoc, setInDoc] = useState<string | null>(null);
  const sent = useRef(false);
  const mobile = findMobileBoard();
  const boards = choosing ? allBoardLines(words.untitled).filter((b) => b.id !== mobile) : [];
  const docs = choosing ? docLines(words.untitled) : [];
  const docPlaces = inDoc ? placesFor(inDoc) : null;
  const choose = (to: NoteTarget) => { setPlace(to); setInDoc(null); setChoosing(false); };
  const pickDoc = (id: string) => {
    const p = placesFor(id);
    if (p.kind === 'one') choose({ kind: 'board', id: p.board.id }); else setInDoc(id);
  };
  const nameOf = (id: string) => boardName(getJournalEntry(id), words.untitled);
  const placeName = place.kind !== 'board' || place.id === mobile ? t('mobileMobile') : nameOf(place.id);
  const send = () => {
    if (!text.trim() || sent.current) return;
    sent.current = true;   // two taps on Send are one note
    if (writeNote(text, place)) { lastPlace = place.kind === 'board' && place.id !== mobile ? place : null; onSent(); } else { sent.current = false; setNotKept(true); }   // not kept: her words stay on the screen
  };
  const boardRow = (id: string) => <li key={id}><button type="button" className="mc-row" data-place={id} aria-pressed={place.kind === 'board' && place.id === id} onClick={() => choose({ kind: 'board', id })}>{nameOf(id)}</button></li>;
  return (
    <div className="mc-sheet" role="dialog" aria-modal="true" aria-label={t('mobileNote')} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="mc-sheet-in">
        <label className="mc-label" htmlFor="mc-note">{t('mobileNote')}</label>
        <textarea id="mc-note" className="mc-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} autoFocus aria-label={t('mobileNoteLabel')} />
        <div className="mc-sendto">
          <span>{t('mobileSendTo')}: <strong data-send-to>{placeName}</strong></span>
          <button type="button" className="mc-link" data-change onClick={() => { setInDoc(null); setChoosing((c) => !c); }}>{t('mobileChange')}</button>
        </div>
        {choosing && !inDoc && (
          <div className="mc-pick">
            <ul className="mc-list"><li><button type="button" className="mc-row" data-place="mobile" aria-pressed={place.kind !== 'board'} onClick={() => choose({ kind: 'unfiled' })}>{t('mobileMobile')}</button></li></ul>
            <h2 className="mc-h2">{t('mobileDocs')}</h2>
            <ul className="mc-list">{docs.map((d) => <li key={d.id}><button type="button" className="mc-row" data-place-doc={d.id} onClick={() => pickDoc(d.id)}>{d.name}</button></li>)}</ul>
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
            <h2 className="mc-h2">{docs.find((d) => d.id === inDoc)?.name}</h2>
            {docPlaces.kind === 'many' && <ul className="mc-list">{docPlaces.boards.map((b) => boardRow(b.id))}</ul>}
            {docPlaces.kind === 'none' && (
              <>
                <p className="mc-dim">{t('mobileDocNoBoard')}</p>
                <button type="button" className="mc-btn" onClick={() => setInDoc(null)}>{t('mobileBoards')}</button>
                <button type="button" className="mc-btn" onClick={() => choose({ kind: 'unfiled' })}>{t('mobileLeaveUnfiled')}</button>
              </>
            )}
          </div>
        )}
        {notKept && <p role="alert">{t('mobileNotKept')}</p>}
        <div className="mc-actions">
          <button type="button" className="mc-btn" data-sheet-back onClick={onClose}>{t('mobileBack')}</button>
          <button type="button" className="mc-btn mc-primary" data-send disabled={!text.trim()} onClick={send}>{t('mobileSend')}</button>
        </div>
      </div>
    </div>
  );
}
