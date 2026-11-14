import type { ReactNode } from 'react';
import type { JournalEntry } from '../types';
import type { CategoryId } from '../components/cascade/shared';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { useLexicon } from '../store/themeLexicon';
import { getDrawer, getSystemKind } from '../store/persistence';
import { isDefaultRoot, JOURNAL, UNSORTED } from '../store/place';
import { usePlace } from '../store/usePlace';
import { NOTEBOOK, projectOfEntry } from './railData';
import { setOpenList, setPinView, useOpenList, useRailMemory } from './railMemory';
import { RailBox } from './RailBox';

// THE REORG'S RAIL (phase 2, behind ?reorg=1 in Machina; frames rail-1d R1 to R3). It replaces the strip's CONTENT only: it renders in the same
// DeskFrame track (84 px), under the same `.wz-strip` root (so the Cascade's keystroke dissolve still knows its own DOM), and every door opens a
// pop-out through the Cascade's own state machine (Cascade.tsx: one pop-out at a time, Escape, the two-drawer law, the exit slide). Four groups,
// clearly set apart (Nick, Nov 11): where she is · her pins · DOCS, PROJECTS, UNFILED · THEME, SETTINGS. Nothing here writes.

interface Door { id: CategoryId; label: string; icon: ReactNode; lit: boolean }

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

export function ReorgRail({ entry, open, toggle }: { entry: JournalEntry; open: CategoryId | null; toggle: (id: CategoryId) => void }) {
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
  const doors: Door[] = [
    { id: 'reorg-docs', label: lex.tMany('page'), icon: <DocsIcon />, lit: false },          // step 5
    { id: 'reorg-projects', label: lex.tMany('drawer'), icon: <ProjectsIcon />, lit: true },
    { id: 'reorg-unfiled', label: t('reorgUnfiled'), icon: <UnfiledIcon />, lit: false },     // step 6
  ];
  const foot: { id: CategoryId; term: DeskTermId; icon: ReactNode }[] = [
    { id: 'theme', term: 'stripChangeTheme', icon: <ThemeIcon /> },
    { id: 'settings', term: 'stripSettings', icon: <SettingsIcon /> },
  ];
  return (
    <div className="wz-strip wz-reorg-rail" data-reorg-rail="">
      {/* 1. where she is: her Project's box and name; it opens her Project's own list (Unfiled writing has no list: its door is UNFILED) */}
      <div className="wz-strip-section wz-reorg-where">
        <button type="button" className="wz-strip-item wz-reorg-where-item" data-reorg-where={here ?? 'unfiled'}
          aria-disabled={here == null ? 'true' : undefined} aria-pressed={here == null ? undefined : listShown(here)} onClick={undefined}
          aria-label={fill(t('reorgWhereLabel'), hereName)} aria-current="location">
          <RailBox id={here} name={hereName} size="rail" />
          <span className="wz-strip-label wz-reorg-where-name">{hereName}</span>
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
      {/* 3. DOCS, PROJECTS, UNFILED: each a pop-out (DOCS in step 5, UNFILED and the Trash in step 6) */}
      <div className="wz-strip-section wz-reorg-doors">
        {doors.map((d) => (
          <button key={d.id} type="button" data-category={d.id} className={`wz-strip-item${open === d.id ? ' active' : ''}`} aria-pressed={open === d.id}
            aria-disabled={d.lit ? undefined : 'true'} onClick={d.lit ? () => toggle(d.id) : undefined}>
            <span className="wz-strip-glyph" aria-hidden="true">{d.icon}</span>
            <span className="wz-strip-label">{d.label}</span>
          </button>
        ))}
      </div>
      {/* 4. THEME, SETTINGS: today's two pop-outs, unchanged */}
      <div className="wz-strip-foot">
        <div className="wz-strip-sep" role="separator" aria-orientation="horizontal" />
        <div className="wz-strip-section">
          {foot.map((f) => (
            <button key={f.id} type="button" data-category={f.id} className={`wz-strip-item${open === f.id ? ' active' : ''}`} aria-pressed={open === f.id} onClick={() => toggle(f.id)}>
              <span className="wz-strip-glyph" aria-hidden="true">{f.icon}</span>
              <span className="wz-strip-label">{t(f.term)}</span>
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
