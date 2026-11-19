import { memo, useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { JournalEntry } from '../types';
import { useDeskLexicon } from '../store/deskLexicon';
import { useTheme } from '../store/theme';
import { getDrawer, getJournalEntries, getJournalEntry, getPairedPageId, getProject, getSystemKind, isAutoSet, isPairedPlanBoard, renameDrawer, saveProject, subscribe } from '../store/persistence';
import { firstLine } from '../store/entryText';
import { NOTEBOOK } from './railData';
import { useProjectName, useWhereSheIs } from './ReorgRail';
import { partsOfDoc, renamePart } from './partsSeam';
import { REORG } from './flag';

// THE REORG'S TOP RAIL (plan step 2.1, behind ?reorg=1 in Machina; Fable's GO Nov 19, 4:20 pm; built to Cursor's prototype's top bar,
// docs/mockups/reorg/app.js renderBar and boardBar). It replaces the header row's CONTENT only, in the same row (.sprint-nav), so the page below
// it never moves. Left: where she is, as names, each editable in place where today's data carries a name (Project = the Drawer's name through
// renameDrawer; a Doc she made = its set's title; a Part, or a one-Part Doc, = that page's pageSettings.name). The Notebook and Unfiled are
// places, not names. Right: the host's own stage buttons (ModeStrip, unchanged), or on a Board its views; on a Board, Connect Doc after the
// place. The search door at the end. Switch off, or any other theme: the host renders exactly what it rendered before.

/** On for this page load only when the switch is on AND the theme is Machina. Chosen once at load, so the hook order never changes. */
export const useReorgTop: () => boolean = REORG ? () => useTheme() === 'machina' : () => false;

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
          spellCheck={false}
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

const Sep = () => <span className="reorg-top-sep" aria-hidden="true">/</span>;

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

/** The Docs a Board serves, by today's data, read-time: the page it is paired with, or the set she made that it sits in with pages. */
function boardDocs(board: JournalEntry): string[] {
  const paired = getPairedPageId(board.id);
  const page = paired ? getJournalEntry(paired) : null;
  if (page) return [partsOfDoc(page).doc.name];
  const set = board.projectId ? getProject(board.projectId) : null;
  if (set && !isAutoSet(set) && getJournalEntries().some((e) => e.projectId === set.id && !e.deletedAt && !e.purgedAt && e.pageType !== 'board')) return [set.title];
  return [];
}

/** Connect Doc's list (Nick, Nov 14, 5:47 pm): her recent Docs first, on a scroll, then "A new doc". The connect WRITE is held (Fable, Nov 14,
 *  ruling B): a pick says what it would do and changes nothing. */
function ConnectList({ onClose }: { onClose: () => void }) {
  const { t } = useDeskLexicon();
  const [said, setSaid] = useState<string | null>(null);
  const seen = new Set<string>();
  const docs: { id: string; name: string }[] = [];
  for (const e of getJournalEntries()
    .filter((x) => !x.deletedAt && !x.purgedAt && !getSystemKind(x) && !isPairedPlanBoard(x.id) && x.pageType !== 'board')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))) {
    const d = partsOfDoc(e).doc;
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    docs.push({ id: d.id, name: d.name || t('reorgUntitled') });
  }
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
        {docs.map((d) => (
          <button key={d.id} type="button" className="reorg-top-drop-row" data-connect-row="doc"
            onClick={() => setSaid(fill(t('reorgTopConnectHeld'), { name: d.name }))}>{d.name}</button>
        ))}
      </div>
      <button type="button" className="reorg-top-drop-row reorg-top-drop-new" data-connect-row="new"
        onClick={() => setSaid(t('reorgTopConnectNewHeld'))}><span aria-hidden="true">+</span> {t('reorgTopConnectNew')}</button>
      {said && <div className="reorg-top-drop-said" data-top-connect-said role="status">{said}</div>}
    </div>
  );
}

function SearchDoor() {
  const { t } = useDeskLexicon();
  const [soon, setSoon] = useState(false);
  useEffect(() => { if (!soon) return; const h = setTimeout(() => setSoon(false), 2200); return () => clearTimeout(h); }, [soon]);
  return (
    <span className="reorg-top-search-wrap">
      <button type="button" className="reorg-top-search" data-top-search aria-label={t('reorgTopSearch')} title={t('reorgTopSearch')} onClick={() => setSoon(true)}>
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
  if (!e) return '';
  const set = e.projectId ? getProject(e.projectId) : null;
  const drawer = set?.drawerId ? getDrawer(set.drawerId) : null;
  const siblings = set
    ? getJournalEntries().filter((x) => x.projectId === set.id).map((x) => `${x.id}:${x.orderIndex ?? ''}:${x.pageType ?? ''}:${x.deletedAt ? 1 : 0}`).join(',')
    : '';
  return [e.id, e.projectId ?? '', e.origin ?? '', set?.title ?? '', set?.drawerId ?? '', drawer?.name ?? '', e.pageSettings?.name ?? '', firstLine(e.text ?? ''), siblings].join('\u0001');
}

interface NamesProps { entry: JournalEntry; canRename: boolean; beforeWrite: () => void }

const PageNames = memo(function PageNames({ entry, canRename, beforeWrite }: NamesProps) {
  useSyncExternalStore(subscribe, () => namesSig(entry.id));
  namesRenders += 1;
  const { t } = useDeskLexicon();
  const latest = getJournalEntry(entry.id) ?? entry;
  const parts = partsOfDoc(latest);
  const made = !!parts.doc.set;
  const part = parts.parts[parts.here - 1];
  const docName = parts.doc.name || t('reorgUntitled');
  const write = (fn: () => void) => { beforeWrite(); fn(); };
  return (
    <nav className="reorg-top-names" aria-label={t('reorgTopWhere')}>
      <ProjectName entry={latest} />
      <Sep />
      <Name id="doc" text={docName} editable={canRename}
        onCommit={(v) => write(() => {
          // a Doc she made is renamed through its set's title (an existing field); a one-Part Doc's name is its page's own (pageSettings.name)
          if (made) { const set = getProject(parts.doc.set!.id); if (set && v.trim()) saveProject({ ...set, title: v.trim() }); }
          else renamePart(latest.id, v);
        })} />
      <Sep />
      <span className="reorg-top-part" data-top-part>
        <span className="reorg-top-part-count" data-top-part-count>{fill(t('reorgTopPartOf'), { n: parts.here, m: parts.parts.length })}</span>
        {made && part && (
          <>
            <span className="reorg-top-dot" aria-hidden="true">·</span>
            <Name id="part" text={part.name || t('reorgUntitled')} editable={canRename} onCommit={(v) => write(() => renamePart(latest.id, v))} />
          </>
        )}
      </span>
    </nav>
  );
}, (a, b) => a.entry.id === b.entry.id && a.canRename === b.canRename);

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
      <SearchDoor />
    </div>
  );
}

/** A Board's top rail (frames P3-NB-C and D; the prototype's boardBar): Project / its name (its own rename control) / which Docs it serves;
 *  Connect Doc after the place; its views where a page's stages stand. A Board takes no typing, so it simply follows the store. */
function BoardTop({ entry, views, boardName, boardAfter }: Pick<TopRailProps, 'entry' | 'views' | 'boardName' | 'boardAfter'>) {
  useStoreTick();
  const { t } = useDeskLexicon();
  const [connecting, setConnecting] = useState(false);
  const latest = getJournalEntry(entry.id) ?? entry;
  const docs = boardDocs(latest);
  const place = !docs.length ? t('reorgTopPlaceNoDoc') : docs.length === 1 ? fill(t('reorgTopPlaceOne'), { name: docs[0] || t('reorgUntitled') }) : fill(t('reorgTopPlaceMany'), { n: docs.length });
  return (
    <div className="reorg-top" data-reorg-top="board">
      <nav className="reorg-top-names" aria-label={t('reorgTopWhere')}>
        <ProjectName entry={latest} />
        <Sep />
        <span className="reorg-top-name reorg-top-board" data-top-name="board" data-editable="true">{boardName}</span>
        <Sep />
        <span className="reorg-top-place" data-top-place>{place}</span>
        {boardAfter}
      </nav>
      <span className="reorg-top-connect-wrap">
        <button type="button" className={`reorg-top-connect${docs.length ? ' is-icon' : ''}`} data-top-connect aria-expanded={connecting}
          aria-label={docs.length ? t('reorgTopConnect') : undefined} title={docs.length ? t('reorgTopConnectAnother') : undefined}
          onClick={() => setConnecting((v) => !v)}>
          {docs.length ? '+' : t('reorgTopConnect')}
        </button>
        {connecting && <ConnectList onClose={() => setConnecting(false)} />}
      </span>
      <span className="reorg-top-spring" />
      <div className="reorg-top-right">{views}</div>
      <SearchDoor />
    </div>
  );
}
