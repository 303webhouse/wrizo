import { memo, useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JournalEntry } from '../types';
import { useDeskLexicon } from '../store/deskLexicon';
import { routeForEntry } from '../store/routeForEntry';
import { pressTripBack, useBoardTrip } from './split/fullTrip';
import { addPageLink, flushNow, getDrawer, getJournalEntries, getJournalEntry, getPageLinksOf, getPageLinksTo, getPairedPageId, getProject, getSystemKind, isAutoSet, isPairedPlanBoard, isUnborn, renameDrawer, saveProject, subscribe } from '../store/persistence';
import { firstLine } from '../store/entryText';
import { NOTEBOOK } from './railData';
import { useProjectName, useWhereSheIs } from './ReorgRail';
import { partsOfDoc, renamePart } from './partsSeam';
import { PartsList } from './PartsList';
import { customVars, useSchemeOnPage } from './colourScheme';
import { useTheme } from '../store/theme';
import { REORG } from './flag';
import { openSearch } from './search/searchStore';

// THE REORG'S TOP RAIL (plan step 2.1, behind ?reorg=1 in Machina; Fable's GO Nov 19, 4:20 pm; built to Cursor's prototype's top bar,
// docs/mockups/reorg/app.js renderBar and boardBar). It replaces the header row's CONTENT only, in the same row (.sprint-nav), so the page below
// it never moves. Left: where she is, as names, each editable in place where today's data carries a name (Project = the Drawer's name through
// renameDrawer; a Doc she made = its set's title; a Part, or a one-Part Doc, = that page's pageSettings.name). The Notebook and Unfiled are
// places, not names. Right: the host's own stage buttons (ModeStrip, unchanged), or on a Board its views; on a Board, Connect Doc after the
// place. The search door at the end. Switch off, or any other theme: the host renders exactly what it rendered before.

export { useReorgTop } from './useReorg';

const fill = (s: string, vals: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));

/** Re-render when the store writes (a rename, here or on another device after a pull). */
function useStoreTick(): void {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribe(bump), []);
}

/** One name in the top rail: text, or (where today's data carries it) a button that becomes a field in the same box. Enter or blur keeps it,
 *  Escape leaves it (today's Board rename, Fable's ruling D). */
function Name({ id, text, editable, onCommit, why }: { id: string; text: string; editable: boolean; onCommit?: (v: string) => void; why?: string }) {
  const { t } = useDeskLexicon();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const left = useRef(false);
  if (!editable || !onCommit) {
    return <span className="reorg-top-name" data-top-name={id} data-editable="false" title={why}>{text}</span>;
  }
  const keep = () => {
    if (left.current) return;
    left.current = true;
    setEditing(false);
    if (draft.trim() !== text.trim()) onCommit(draft);
  };
  return (
    <span className="reorg-top-name" data-top-name={id} data-editable="true">
      {editing ? (
        <input
          className="reorg-top-rename"
          data-top-rename={id}
          value={draft}
          autoFocus
          aria-label={fill(t('reorgTopRename'), { name: text })}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') { ev.preventDefault(); keep(); }
            else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); left.current = true; setEditing(false); }
          }}
          onBlur={keep}
        />
      ) : (
        <button type="button" className="reorg-top-name-btn" title={fill(t('reorgTopRename'), { name: text })}
          onClick={() => { left.current = false; setDraft(text); setEditing(true); }}>{text}</button>
      )}
    </span>
  );
}

// FLUX's crumb reads DRIVE ▸ DOC // TRACK (flux-reorg-spec.md section 3); every other theme keeps its slash
const Sep = ({ glyph = '/' }: { glyph?: string }) => <span className="reorg-top-sep" aria-hidden="true">{glyph}</span>;

/** The Project's name: a live Drawer's is editable; the Notebook and Unfiled are places. */
function ProjectName({ entry }: { entry: JournalEntry }) {
  const { t } = useDeskLexicon();
  const nameOf = useProjectName();
  const here = useWhereSheIs(entry);
  const drawer = here && here !== NOTEBOOK ? getDrawer(here) : null;
  return (
    <Name id="project" text={nameOf(here)} editable={!!drawer} why={drawer ? undefined : t('reorgTopPlace')}
      onCommit={drawer ? (v) => { if (v.trim()) renameDrawer(drawer.id, v); } : undefined} />
  );
}

/** The Docs a Board serves, read-time: the page it is paired with; the set she made that it sits in with pages; and every Doc a PageLink joins
 *  to the Board itself, a card at neither end, whichever end owns the record (Connect Doc's write is owned by the Board; a page's Graft to the
 *  Board is owned by the page). One row per Doc. */
function boardDocs(board: JournalEntry): { id: string; name: string }[] {
  const out = new Map<string, string>();
  const add = (e: JournalEntry | null | undefined) => {
    if (!e || e.deletedAt || e.purgedAt || e.pageType === 'board' || getSystemKind(e)) return;
    const d = partsOfDoc(e).doc;
    if (!out.has(d.id)) out.set(d.id, d.name);
  };
  const paired = getPairedPageId(board.id);
  if (paired) add(getJournalEntry(paired));
  const set = board.projectId ? getProject(board.projectId) : null;
  if (set && !isAutoSet(set) && !out.has(set.id) && getJournalEntries().some((e) => e.projectId === set.id && !e.deletedAt && !e.purgedAt && e.pageType !== 'board')) out.set(set.id, set.title);
  for (const l of getPageLinksOf(board.id)) if (!l.aBoxId && !l.bBoxId) add(getJournalEntry(l.bEntryId));
  for (const l of getPageLinksTo(board.id)) if (!l.aBoxId && !l.bBoxId) add(getJournalEntry(l.aEntryId));
  return [...out].map(([id, name]) => ({ id, name }));
}

/** Connect Doc's list (Nick, Nov 14, 5:47 pm): her recent Docs first, on a scroll, then "A new doc". A pick WRITES (Fable, Nov 19, 6:05 pm, ask
 *  d; Nick: saved with the account): one PageLink owned by the Board, to the Doc's first Part in her order (a Doc is its Parts; a set has no
 *  entry of its own), a card at neither end, through the store's own addPageLink (idempotent, either direction). The list closes and she stays
 *  on the Board. A Doc it already serves reads "connected" and a pick on it writes nothing. "A new doc" stays held: a page is born when it has
 *  a word (PB1), so an empty Doc cannot be stored for it. A Board not yet kept (no card: the unborn slot) is not born by a side door. */
function ConnectList({ board, served, onClose }: { board: JournalEntry; served: ReadonlySet<string>; onClose: () => void }) {
  const { t } = useDeskLexicon();
  const [said, setSaid] = useState<string | null>(null);
  const seen = new Set<string>();
  const docs: { id: string; name: string; anchor: string }[] = [];
  for (const e of getJournalEntries()
    .filter((x) => !x.deletedAt && !x.purgedAt && !getSystemKind(x) && !isPairedPlanBoard(x.id) && x.pageType !== 'board')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))) {
    const p = partsOfDoc(e);
    if (seen.has(p.doc.id)) continue;
    seen.add(p.doc.id);
    docs.push({ id: p.doc.id, name: p.doc.name || t('reorgUntitled'), anchor: p.parts[0]?.id ?? e.id });
  }
  const pick = (d: { id: string; anchor: string }) => {
    if (served.has(d.id)) return;
    if (isUnborn(board.id)) { setSaid(t('reorgTopConnectUnborn')); return; }
    addPageLink(board.id, { bEntryId: d.anchor });
    onClose();
  };
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (ev: MouseEvent) => { if (ref.current && !ref.current.contains(ev.target as Node) && !(ev.target as Element).closest?.('[data-top-connect]')) onClose(); };
    const esc = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [onClose]);
  return (
    <div ref={ref} className="reorg-top-drop" data-top-connect-list role="dialog" aria-label={t('reorgTopConnect')}>
      <div className="reorg-top-drop-head">{t('reorgTopConnectRecent')}</div>
      <div className="reorg-top-drop-scroll">
        {docs.map((d) => {
          const on = served.has(d.id);
          return (
            <button key={d.id} type="button" className={`reorg-top-drop-row${on ? ' is-on' : ''}`} data-connect-row="doc" data-connect-doc={d.id}
              aria-disabled={on || undefined} onClick={() => pick(d)}>
              <span className="reorg-top-drop-name">{d.name}</span>
              {on && <span className="reorg-top-drop-meta">{t('reorgTopConnectOn')}</span>}
            </button>
          );
        })}
      </div>
      <button type="button" className="reorg-top-drop-row reorg-top-drop-new" data-connect-row="new"
        onClick={() => setSaid(t('reorgTopConnectNewHeld'))}><span aria-hidden="true">+</span> {t('reorgTopConnectNew')}</button>
      {said && <div className="reorg-top-drop-said" data-top-connect-said role="status">{said}</div>}
    </div>
  );
}

// the search door: on a page it opens the reorg's search in the Back menu (reorg/search/, starting on This Doc); a Board has no search yet, so
// there it still says so
function SearchDoor({ live = false }: { live?: boolean }) {
  const { t } = useDeskLexicon();
  const [soon, setSoon] = useState(false);
  useEffect(() => { if (!soon) return; const h = setTimeout(() => setSoon(false), 2200); return () => clearTimeout(h); }, [soon]);
  return (
    <span className="reorg-top-search-wrap">
      <button type="button" className="reorg-top-search" data-top-search aria-label={t('reorgTopSearch')} title={t('reorgTopSearch')} onClick={() => (live ? openSearch('bar') : setSoon(true))}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
      </button>
      {soon && <span className="reorg-top-soon" role="status">{t('reorgTopSearchSoon')}</span>}
    </span>
  );
}

export interface TopRailProps {
  kind: 'page' | 'script' | 'board';
  entry: JournalEntry;
  /** a Page or a screenplay: the host's own ModeStrip, unchanged, without its PLAN door */
  stages?: ReactNode;
  /** a Board: its views, in the stages' place (the host's own mode bar, unchanged) */
  views?: ReactNode;
  /** a Board: its own rename control (BoardEditor's, unchanged) */
  boardName?: ReactNode;
  /** a Board: what its old crumb carried after the name (a Deck's gaps line), unchanged */
  boardAfter?: ReactNode;
  /** the host saves the open page's typing before a rename writes that page, so the text written back is the newest */
  beforeWrite?: () => void;
  /** false while the page is unborn: there is no record to name yet */
  canRename?: boolean;
}

// THE SPEED RULE (the left rail's, reorg-rails-speed.mjs): the names never render on a keystroke. The host re-renders as she types; the names
// are memoized on the entry's id, and re-render only when what they draw changes in the store (a rename here, a pull from another device), never
// on a save that changes no name. Counted through a window seam that exists only under the switch (reorg-top-rail.mjs K1).
let namesRenders = 0;
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoTopNamesRenders?: () => number }).wrizoTopNamesRenders = () => namesRenders;
}

/** What the names draw, read from the store (only on a store change, never per keystroke). */
function namesSig(id: string): string {
  const e = getJournalEntry(id);
  return e ? sigOf(e) : '';
}
function sigOf(e: JournalEntry): string {
  const set = e.projectId ? getProject(e.projectId) : null;
  const drawer = set?.drawerId ? getDrawer(set.drawerId) : null;
  const siblings = set
    ? getJournalEntries().filter((x) => x.projectId === set.id).map((x) => `${x.id}:${x.orderIndex ?? ''}:${x.pageType ?? ''}:${x.deletedAt ? 1 : 0}`).join(',')
    : '';
  // the Section's own colour too (Arbor's tag before its name, spec §3: a colour chosen in the Front menu redraws the tag; Actions 44974589071)
  const colour = String((e.pageSettings as { color?: unknown } | undefined)?.color ?? '');
  return [e.id, e.projectId ?? '', e.origin ?? '', set?.title ?? '', set?.drawerId ?? '', drawer?.name ?? '', e.pageSettings?.name ?? '', firstLine(e.text ?? ''), siblings, colour].join('\u0001');
}

interface NamesProps { entry: JournalEntry; canRename: boolean; beforeWrite: () => void }

/** The Part line's drop: the Front menu's Parts list under the top rail, over the page (it moves nothing). A row saves her typing, then opens
 *  that Part. A press outside, or Escape, closes it. */
function PartsDrop({ entry, beforeLeave, onClose }: { entry: JournalEntry; beforeLeave: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (ev: MouseEvent) => { if (ref.current && !ref.current.contains(ev.target as Node) && !(ev.target as Element).closest?.('[data-top-part-count]')) onClose(); };
    const esc = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [onClose]);
  return (
    <div ref={ref} className="reorg-top-drop reorg-top-parts-drop" data-top-parts-drop>
      <PartsList entry={entry} beforeLeave={beforeLeave} />
    </div>
  );
}

function PageNamesImpl({ entry, canRename, beforeWrite }: NamesProps) {
  useSyncExternalStore(subscribe, () => namesSig(entry.id));
  // colour B: the Doc on screen draws its slots in its own scheme (reorg/colourScheme.ts; it re-renders only when the scheme changes)
  useSchemeOnPage(entry.id);
  namesRenders += 1;
  const { t } = useDeskLexicon();
  const latest = getJournalEntry(entry.id) ?? entry;
  const parts = partsOfDoc(latest);
  const made = !!parts.doc.set;
  const part = parts.parts[parts.here - 1];
  const docName = parts.doc.name || t('reorgUntitled');
  const write = (fn: () => void) => { beforeWrite(); fn(); };
  // the Part line drops every Part of the Doc (the prototype's parts drop, frame P2-12C, ruled B): the Front menu's own Parts list
  const [dropped, setDropped] = useState(false);
  // ARBOR (spec §3): the Section's tag (§6, Arbor's numbered cloth: INK's tokens in 25-reorg-arbor-tags.css) stands before its name; Machina draws none
  const theme = useTheme();
  const arbor = theme === 'plateau';
  // FLUX (spec sections 3 and 6): the Track's name, then its readout TRK n/m; its tag is a bracketed code and a 3 px bar in its signal, or her own colour's bar with [##]
  const flux = theme === 'flux';
  const trackCount = (
    <button type="button" className={`reorg-top-part-count${dropped ? ' is-open' : ''}`} data-top-part-count aria-expanded={dropped}
      title={t('reorgTopPartsDrop')} onClick={() => setDropped((v) => !v)}>{fill(t('reorgTopPartOf'), { n: parts.here, m: parts.parts.length })}</button>
  );
  return (
    <nav className="reorg-top-names" aria-label={t('reorgTopWhere')}>
      <ProjectName entry={latest} />
      <Sep glyph={flux ? '▸' : undefined} />
      <Name id="doc" text={docName} editable={canRename}
        onCommit={(v) => write(() => {
          // a Doc she made is renamed through its set's title (an existing field); a one-Part Doc's name is its page's own (pageSettings.name)
          if (made) { const set = getProject(parts.doc.set!.id); if (set && v.trim()) saveProject({ ...set, title: v.trim() }); }
          else renamePart(latest.id, v);
        })} />
      <Sep glyph={flux ? '//' : undefined} />
      <span className="reorg-top-part" data-top-part>
        {!flux && trackCount}
        {dropped && <PartsDrop entry={latest} beforeLeave={beforeWrite} onClose={() => setDropped(false)} />}
        {made && part && (
          <>
            {!flux && <span className="reorg-top-dot" aria-hidden="true">·</span>}
            {arbor && part.color && <span className="reorg-top-tag" data-top-tag={part.color} aria-hidden="true" />}
            {flux && (part.color || part.hex) && <span className="reorg-top-tag" data-top-tag={part.hex ? 'hex' : part.color ?? undefined} data-quiet={part.hex && customVars(part.hex)['--part-hex-edge-dark'] !== part.hex ? 'true' : undefined} aria-hidden="true" style={part.hex ? customVars(part.hex) as CSSProperties : undefined} />}
            <Name id="part" text={part.name || t('reorgUntitled')} editable={canRename} onCommit={(v) => write(() => renamePart(latest.id, v))} />
          </>
        )}
        {flux && trackCount}
      </span>
    </nav>
  );
}
const PageNames = memo(PageNamesImpl, (a, b) => a.entry.id === b.entry.id && a.canRename === b.canRename);

export function TopRail({ kind, entry, stages, views, boardName, boardAfter, beforeWrite, canRename = true }: TopRailProps) {
  // the host's latest save-the-typing act, behind a stable function, so the memoized names never need the host's new closure
  const latestWrite = useRef(beforeWrite);
  latestWrite.current = beforeWrite;
  const stableWrite = useCallback(() => latestWrite.current?.(), []);
  if (kind === 'board') return <BoardTop entry={entry} views={views} boardName={boardName} boardAfter={boardAfter} />;
  return (
    <div className="reorg-top" data-reorg-top={kind}>
      <PageNames entry={entry} canRename={canRename} beforeWrite={stableWrite} />
      <span className="reorg-top-spring" />
      <div className="reorg-top-right">{stages}</div>
      <SearchDoor live />
    </div>
  );
}

/** A Board's top rail (frames P3-NB-C and D; the prototype's boardBar): Project / its name (its own rename control) / which Docs it serves;
 *  Connect Doc after the place; its views where a page's stages stand. A Board takes no typing, so it simply follows the store. */
function BoardTop({ entry, views, boardName, boardAfter }: Pick<TopRailProps, 'entry' | 'views' | 'boardName' | 'boardAfter'>) {
  useStoreTick();
  const { t } = useDeskLexicon();
  const [connecting, setConnecting] = useState(false);
  const flux = useTheme() === 'flux';
  const latest = getJournalEntry(entry.id) ?? entry;
  const docs = boardDocs(latest);
  const place = !docs.length ? t('reorgTopPlaceNoDoc') : docs.length === 1 ? fill(t('reorgTopPlaceOne'), { name: docs[0].name || t('reorgUntitled') }) : fill(t('reorgTopPlaceMany'), { n: docs.length });
  // BACK (§3b item 3, split/fullTrip.ts): this Board opened from Full Screen beside a page; Back returns to that page, which puts its split, scroll and
  // caret back. Reached any other way, the Board shows no Back.
  const trip = useBoardTrip(entry.id);
  const navigate = useNavigate();
  const tripPage = trip ? getJournalEntry(trip.pageId) : undefined;
  const goBack = () => {
    if (!tripPage) return;
    pressTripBack();
    flushNow();
    navigate(routeForEntry(tripPage));
  };
  return (
    <div className="reorg-top" data-reorg-top="board">
      {tripPage && <button type="button" className="reorg-top-back" data-top-back="" onClick={goBack}>{t('reorgFullBack')}</button>}
      <nav className="reorg-top-names" aria-label={t('reorgTopWhere')}>
        <ProjectName entry={latest} />
        <Sep glyph={flux ? '▸' : undefined} />
        <span className="reorg-top-name reorg-top-board" data-top-name="board" data-editable="true">{boardName}</span>
        <Sep glyph={flux ? '//' : undefined} />
        <span className="reorg-top-place" data-top-place>{place}</span>
        {boardAfter}
      </nav>
      <span className="reorg-top-connect-wrap">
        <button type="button" className={`reorg-top-connect${docs.length ? ' is-icon' : ''}`} data-top-connect aria-expanded={connecting}
          aria-label={docs.length ? t('reorgTopConnect') : undefined} title={docs.length ? t('reorgTopConnectAnother') : undefined}
          onClick={() => setConnecting((v) => !v)}>
          {docs.length ? '+' : t('reorgTopConnect')}
        </button>
        {connecting && <ConnectList board={latest} served={new Set(docs.map((d) => d.id))} onClose={() => setConnecting(false)} />}
      </span>
      <span className="reorg-top-spring" />
      <div className="reorg-top-right">{views}</div>
      <SearchDoor />
    </div>
  );
}
