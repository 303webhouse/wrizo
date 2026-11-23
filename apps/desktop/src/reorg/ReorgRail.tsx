import { memo, type ReactNode } from 'react';
import type { JournalEntry } from '../types';
import type { CategoryId } from '../components/cascade/shared';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { useLexicon } from '../store/themeLexicon';
import { getDrawer, getDrawers, getSystemKind } from '../store/persistence';
import { railHint, railReadout } from '../store/fluxReadouts';
import { isDefaultRoot, JOURNAL, UNSORTED } from '../store/place';
import { usePlace } from '../store/usePlace';
import { countsOf, NOTEBOOK, notebookDocs, projectOfEntry, unfiledMembers } from './railData';
import { setOpenList, setPinView, useOpenList, useRailMemory } from './railMemory';
import { RailBox } from './RailBox';
import { REORG } from './flag';
import { useChromeScale } from './chromeScale';
import { useTheme } from '../store/theme';
import { ThemeIcon as SetIcon } from '../components/ThemeIcon';
import { JournalIcon as ArborJournalIcon, PageIcon as ArborPageIcon, PlanIcon as ArborPlanIcon, SettingsIcon as ArborSettingsIcon, SkinIcon as ArborSkinIcon } from '../components/Cascade';
import './parts';   // a side-effect import on purpose: the Parts layer installs its harness door (window.wrizoParts) when the bundle loads; nothing here draws it yet (the Parts list is POLISH's)

// THE REORG'S RAIL (phase 2, behind ?reorg=1 in Machina; frames rail-1d R1 to R3). It replaces the strip's CONTENT only: it renders in the same
// DeskFrame track (84 px), under the same `.wz-strip` root (so the Cascade's keystroke dissolve still knows its own DOM), and every door opens a
// pop-out through the Cascade's own state machine (Cascade.tsx: one pop-out at a time, Escape, the two-drawer law, the exit slide). Four groups,
// clearly set apart (Nick, Nov 11): where she is · her pins · DOCS, PROJECTS, UNFILED · THEME, SETTINGS. Nothing here writes.

// ARBOR (spec §2, the rail-tab rule, Nick Nov 8): each door stands in its own CLOTH - olive, cold blue or madder - drawn by 25-reorg-arbor-rail.css; Machina
// draws no cloth (data-cloth is only set in Arbor).
type Cloth = 'olive' | 'blue' | 'madder';
interface Door { id: CategoryId; label: string; icon: ReactNode; lit: boolean; cloth?: Cloth; read?: RailRead }
/** FLUX's command-box readings (the redesign's L2): a true count and the hover hint that says what it counts. Absent in every other theme. */
export interface RailRead { count: string; hint: string }
/** The foot's two readings (the settings they open, from Cascade.tsx). Their presence is also what says the command boxes are drawn. */
export type RailReads = Record<'settings' | 'theme', RailRead>;

/** A Project's name as the rail shows it: the Drawer's own name (Top Drawer, while it keeps its born-with name, by the theme's word), the Notebook, or Unfiled. */
export function useProjectName(): (id: string | null) => string {
  const { t } = useDeskLexicon();
  const lex = useLexicon();
  return (id) => {
    if (id === NOTEBOOK) return lex.t('journal');
    if (id == null) return t('reorgUnfiled');
    const d = getDrawer(id);
    if (!d) return t('reorgUnfiled');
    return (isDefaultRoot(d) ? t('placeRootName') : d.name) || lex.t('drawer');
  };
}

/** Where she is: the Project of the open entry. A system board (the Journal's or the Trash's) has no Project of its own, so the place stands in. */
export function useWhereSheIs(entry: JournalEntry): string | null {
  const place = usePlace();
  if (!getSystemKind(entry)) return projectOfEntry(entry);
  if (place.kind === 'journal' && place.id === JOURNAL) return NOTEBOOK;
  return place.id === UNSORTED ? null : place.id;
}

const fill = (s: string, name: string): string => s.replace('{name}', name);

// THE SPEED CHECK'S COUNTER (reorg-rails-speed.mjs): how many times the rail has rendered, read through a window seam that exists only under the
// switch (the wrizoRailMemory pattern). The check holds it still while she types: the rail must not re-render on a keystroke.
let railRenders = 0;
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoRailRenders?: () => number }).wrizoRailRenders = () => railRenders;
}

// THE RAIL DOES NOT RE-RENDER ON A KEYSTROKE (the speed check, R1: before this it rendered ~2 times per key, 89 over 44 keys on Actions run
// 43649080320, because the editor's own re-render built a new rail element each time). The wrapper below runs with its parent, cheaply: it
// keeps the latest `toggle` for the body and reads a SIGNATURE of what the rail draws from the stored data (the open entry's Project, and
// every Project's id and name). The body is memoized on the open pop-out and that signature, so typing (which changes neither) never renders
// it; its own subscriptions (the place, the rail's memory, the lexicon's theme) still render it when they change.
let latestToggle: (id: CategoryId) => void = () => {};
const stableToggle = (id: CategoryId): void => latestToggle(id);
function railSignature(entry: JournalEntry): string {
  return [entry.id, getSystemKind(entry) ?? '', projectOfEntry(entry) ?? '', ...getDrawers().map((d) => `${d.id}\u0001${d.name}`)].join('\u0002');
}

export function ReorgRail({ entry, open, toggle, reads = null }: { entry: JournalEntry; open: CategoryId | null; toggle: (id: CategoryId) => void; reads?: RailReads | null }) {
  // §3b item 4: while the reorg's rail stands in Machina, the chrome grows with the window (./chromeScale.ts)
  useChromeScale();
  latestToggle = toggle;
  // Flux's readings join the memo by VALUE (the foot's object is new each render; its words are not)
  const readSig = reads ? Object.values(reads).map((r) => `${r.count}\u0001${r.hint}`).join('\u0002') : '';
  return <RailBody entry={entry} open={open} toggle={stableToggle} sig={railSignature(entry)} reads={reads} readSig={readSig} />;
}

const RailBody = memo(RailBodyImpl, (a, b) => a.open === b.open && a.sig === b.sig && a.readSig === b.readSig);

function RailBodyImpl({ entry, open, toggle, reads }: { entry: JournalEntry; open: CategoryId | null; toggle: (id: CategoryId) => void; sig: string; reads: RailReads | null; readSig: string }) {
  const theme = useTheme();
  railRenders += 1;
  const { t } = useDeskLexicon();
  const lex = useLexicon();
  const nameOf = useProjectName();
  const here = useWhereSheIs(entry);
  const memory = useRailMemory();
  // her pins, as she pinned them; a Project that is gone drops out, and the one she is in shows once, at the top
  const pins = memory.pins.filter((id) => id !== here && (id === NOTEBOOK || !!getDrawer(id)));
  const hereName = nameOf(here);
  // step 3: a Project's box opens that Project's own list (the where-she-is box and every pin); pressing the box whose list is open closes it
  const listOpen = useOpenList();
  const listShown = (id: string | null) => open === 'reorg-list' && id != null && listOpen === id;
  const openListOf = (id: string) => {
    if (listShown(id)) { toggle('reorg-list'); return; }
    setOpenList(id);
    if (open !== 'reorg-list') toggle('reorg-list');
  };
  const arbor = theme === 'plateau';
  const flux = theme === 'flux';
  // FLUX: every door counts what the reorg's OWN lists show (a set of Tracks is one Doc; the Log is the Notebook, its loose pages are Orphans), read when the rail
  // renders (a new place, page or open door), never per key; L2's sentence frames. The live rail's page counts would contradict DRIVES' rows (the frames on 5fa0119c).
  const hintWords = { doc: t('drawerPage'), circuit: t('stripPlan'), rack: t('drawerPlaceDrawers'), log: t('drawerPlaceJournal') };
  const drives = flux && reads ? getDrawers().length : 0;
  const orphans = flux && reads ? unfiledMembers().length : 0;
  const held = flux && reads ? countsOf(here) : null;
  const logDocs = flux && reads ? notebookDocs().length : 0;
  const scope = here != null && here !== NOTEBOOK ? 'drawer' : 'journal';
  const heldRead = (kind: 'docs' | 'circuits' | 'place', n: number): RailRead => ({ count: railReadout(n), hint: railHint(kind, n, scope, hintWords) });
  const placeRead = held ? heldRead('place', held.docs + held.boards) : null;
  const doors: Door[] = flux
    // FLUX'S PLACES (flux-reorg-spec.md section 2): the redesign's command boxes (flux3/flux-v3.css L2), each with its true count and hover hint
    ? [
      { id: 'reorg-docs', label: lex.tMany('page'), icon: <SetIcon id="docs" fallback={<DocsIcon />} />, lit: true, read: held ? heldRead('docs', held.docs) : undefined },
      { id: 'reorg-projects', label: lex.tMany('drawer'), icon: <ProjectsIcon />, lit: true, read: reads ? { count: railReadout(drives), hint: railHint('drives', drives, 'journal', hintWords) } : undefined },
      { id: 'reorg-unfiled', label: t('reorgUnfiled'), icon: <UnfiledIcon />, lit: true, read: reads ? { count: railReadout(orphans), hint: railHint('place', orphans, 'journal', hintWords) } : undefined },
      { id: 'plan', label: t('stripPlan'), icon: <SetIcon id="circuits" fallback={<ArborPlanIcon />} />, lit: true, read: held ? heldRead('circuits', held.boards) : undefined },
      { id: 'journal', label: t('drawerPlaceJournal'), icon: <SetIcon id="log" fallback={<ArborJournalIcon />} />, lit: true, read: reads ? { count: railReadout(logDocs), hint: railHint('log', logDocs, 'journal', hintWords) } : undefined },
    ]
    : arbor
    // ARBOR'S PLACES (spec §2): PAGES cold blue (the session is its last item, §7), DRAWERS olive, SHELF cold blue (Nick, Nov 20 4:13 pm), CANVASES
    // madder and JOURNAL olive (both live, where they stand today: their own pop-outs), in Arbor's live icons
    ? [
      { id: 'reorg-docs', label: lex.tMany('page'), icon: <ArborPageIcon />, lit: true, cloth: 'blue' },
      { id: 'reorg-projects', label: lex.tMany('drawer'), icon: <ProjectsIcon />, lit: true, cloth: 'olive' },
      { id: 'reorg-unfiled', label: t('reorgUnfiled'), icon: <UnfiledIcon />, lit: true, cloth: 'blue' },
      { id: 'plan', label: t('stripPlan'), icon: <ArborPlanIcon />, lit: true, cloth: 'madder' },
      { id: 'journal', label: t('drawerPlaceJournal'), icon: <ArborJournalIcon />, lit: true, cloth: 'olive' },
    ]
    : [
      { id: 'reorg-docs', label: lex.tMany('page'), icon: <DocsIcon />, lit: true },
      { id: 'reorg-projects', label: lex.tMany('drawer'), icon: <ProjectsIcon />, lit: true },
      { id: 'reorg-unfiled', label: t('reorgUnfiled'), icon: <UnfiledIcon />, lit: true },
    ];
  const foot: { id: CategoryId; term: DeskTermId; icon: ReactNode; read?: RailRead }[] = [
    { id: 'theme', term: 'stripChangeTheme', icon: flux ? <SetIcon id="skin" fallback={<ThemeIcon />} /> : arbor ? <ArborSkinIcon /> : <ThemeIcon />, read: reads?.theme },
    { id: 'settings', term: 'stripSettings', icon: flux ? <SetIcon id="config" fallback={<SettingsIcon />} /> : arbor ? <ArborSettingsIcon /> : <SettingsIcon />, read: reads?.settings },
  ];
  return (
    <div className="wz-strip wz-reorg-rail" data-reorg-rail="">
      {/* 1. where she is: her Project's box and name; it opens her Project's own list (Unfiled writing has no list: its door is UNFILED) */}
      <div className="wz-strip-section wz-reorg-where">
        <button type="button" className="wz-strip-item wz-reorg-where-item" data-reorg-where={here ?? 'unfiled'}
          aria-disabled={here == null ? 'true' : undefined} aria-pressed={here == null ? undefined : listShown(here)} onClick={here == null ? undefined : () => openListOf(here)}
          aria-label={fill(t('reorgWhereLabel'), hereName)} aria-current="location" title={placeRead?.hint}>
          <RailBox id={here} name={hereName} size="rail" />
          <span className="wz-strip-label wz-reorg-where-name">{hereName}</span>
          {placeRead ? <span className="wz-strip-readout" aria-hidden="true">{placeRead.count}</span> : null}
        </button>
      </div>
      {/* 2. her pins (none on day one, frame R3), as boxes or as a list, with the small switch under them */}
      {pins.length > 0 && (
        <div className="wz-strip-section wz-reorg-pins" data-pin-view={memory.pinView} role="group" aria-label={t('reorgPinsLabel')}>
          <div className="wz-reorg-pin-grid">
            {pins.map((id) => {
              const name = nameOf(id);
              return (
                <button key={id} type="button" className="wz-reorg-pin" data-reorg-pin={id} aria-pressed={listShown(id)} aria-label={fill(t('reorgBoxOpen'), name)} title={name} onClick={() => openListOf(id)}>
                  <RailBox id={id} name={name} size="pin" />
                  {memory.pinView === 'list' ? <span className="wz-strip-label wz-reorg-pin-name">{name}</span> : null}
                </button>
              );
            })}
          </div>
          <div className="wz-reorg-pin-view">
            <button type="button" className="wz-reorg-pin-view-btn" data-pin-view-btn="list" aria-pressed={memory.pinView === 'list'} aria-label={t('reorgPinsAsList')} title={t('reorgPinsAsList')} onClick={() => setPinView('list')}><ListIcon /></button>
            <button type="button" className="wz-reorg-pin-view-btn" data-pin-view-btn="boxes" aria-pressed={memory.pinView === 'boxes'} aria-label={t('reorgPinsAsBoxes')} title={t('reorgPinsAsBoxes')} onClick={() => setPinView('boxes')}><BoxesIcon /></button>
          </div>
        </div>
      )}
      {/* 3. DOCS, PROJECTS, UNFILED: each a pop-out (the Trash sits at the foot of UNFILED) */}
      <div className="wz-strip-section wz-reorg-doors">
        {doors.map((d) => (
          <button key={d.id} type="button" data-category={d.id} data-cloth={d.cloth} className={`wz-strip-item${open === d.id ? ' active' : ''}`} aria-pressed={open === d.id}
            aria-disabled={d.lit ? undefined : 'true'} onClick={d.lit ? () => toggle(d.id) : undefined} title={d.read?.hint}>
            <span className="wz-strip-glyph" aria-hidden="true">{d.icon}</span>
            <span className="wz-strip-label">{d.label}</span>
            {d.read ? <span className="wz-strip-readout" aria-hidden="true">{d.read.count}</span> : null}
          </button>
        ))}
      </div>
      {/* 4. THEME, SETTINGS: today's two pop-outs, unchanged */}
      <div className="wz-strip-foot">
        <div className="wz-strip-sep" role="separator" aria-orientation="horizontal" />
        <div className="wz-strip-section">
          {foot.map((f) => (
            <button key={f.id} type="button" data-category={f.id} className={`wz-strip-item${open === f.id ? ' active' : ''}`} aria-pressed={open === f.id} onClick={() => toggle(f.id)} title={f.read?.hint}>
              <span className="wz-strip-glyph" aria-hidden="true">{f.icon}</span>
              <span className="wz-strip-label">{t(f.term)}</span>
              {f.read ? <span className="wz-strip-readout" aria-hidden="true">{f.read.count}</span> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Machina's stroke (1.25, square caps, mitred), drawn from the frames: a doc, two stacked boxes, a tray, a half-filled circle, two sliders.
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">{children}</svg>
);
function DocsIcon() { return svg(<><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /></>); }
function ProjectsIcon() { return svg(<><path d="M5 5h10v10H5z" /><path d="M9 9h10v10H9z" /></>); }
function UnfiledIcon() { return svg(<><path d="M4 13l2.5-7h11l2.5 7v6H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></>); }
function ThemeIcon() { return svg(<><circle cx="12" cy="12" r="7.5" /><path d="M12 4.5v15" /></>); }
function SettingsIcon() { return svg(<><path d="M4 8h16M4 16h16" /><circle cx="9" cy="8" r="1.8" fill="var(--wz-reorg-rail-bg, transparent)" /><circle cx="15" cy="16" r="1.8" fill="var(--wz-reorg-rail-bg, transparent)" /></>); }
function ListIcon() { return svg(<path d="M6 8h12M6 12h12M6 16h12" />); }
function BoxesIcon() { return svg(<><path d="M6 6h5v5H6zM13 6h5v5h-5zM6 13h5v5H6zM13 13h5v5h-5z" /></>); }
