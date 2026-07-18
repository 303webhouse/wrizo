import { useState, type ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useDeskLexicon, deskTerm } from '../store/deskLexicon';
import { firstLine } from '../store/entryText';
import {
  getJournalPages, getShelfPages, getDrawers, getProjects, getBinderPages,
  createJournalPage, createBoardPage, createQuickSprintProject, softDeleteEntry,
} from '../store/persistence';
import { getCurrentUser } from '../store/currentUser';
import { requestLogout } from '../store/logoutRequest';
import { useTheme, setTheme, type ThemeId } from '../store/theme';
import { FullscreenToggle, SyncIndicator } from './ChromeControls';
import { PageFace, type PageFaceSubject } from './PageFace';
import { AddToSheet } from './AddToSheet';
import type { JournalEntry, Project } from '../types';
import type { SurveyItem, SurveyProps } from './CascadeSurvey';

// CD2 S3 — the seven category panels (layer 2), one function each. All read
// the persistence store DIRECTLY at render time (the SAME "no cached
// snapshot" discipline PlaceFace.tsx/DrawersTree.tsx/ProjectHome.tsx already
// use) rather than being handed pre-fetched lists as props — so every panel
// (and, via `buildSurvey` below, every survey) reflects the LATEST store
// state on every render, including the render immediately after a delete
// (App.tsx's own persistence `subscribe(forceRender)` already re-renders
// this whole subtree on every write; nothing here needs its own refresh
// plumbing on top of that established house pattern).
export type CategoryId = 'journal' | 'page' | 'plan' | 'drawers' | 'shelf' | 'settings' | 'theme';

// A survey "kind" is a small description of WHAT to browse, not a snapshot
// of the items themselves — Cascade.tsx stores one of these as its own
// survey state, and `buildSurvey` (bottom of this file) recomputes the
// actual item list fresh every render. This is what makes a delete from
// inside the survey (Plan's own Delete verb) show up immediately without
// any manual re-fetch.
export type CascadeSurveyKind =
  | { category: 'journal' }
  | { category: 'plan'; projectId: string }
  | { category: 'drawers'; drawerId: string; drawerName: string }
  | { category: 'shelf' };

export interface CascadeContext {
  subject: PageFaceSubject;
  project: Project | null;
  navigate: NavigateFunction;
  openSurvey: (kind: CascadeSurveyKind) => void;
}

// Open (travel): an untyped page reads at /journal/:id (JournalEntry owns
// every pageType-less page); a typed page reads at /page/:id (PageEditor
// and its delegates) — the SAME split PlaceFace.tsx's own retired
// `routeFor` used (copied here since that file is retired alongside
// Drawer.tsx, its only mount site — see this ticket's build report).
function routeFor(entry: JournalEntry): string {
  return entry.pageType != null ? `/page/${entry.id}` : `/journal/${entry.id}`;
}
function itemTitle(entry: JournalEntry): string {
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  if (!entry.text.trim()) return hasInk ? 'A sketch' : 'Untitled';
  return firstLine(entry.text).slice(0, 60);
}
function itemExcerpt(entry: JournalEntry): string | undefined {
  const body = entry.text.trim();
  if (!body) return undefined;
  const lines = body.split('\n').filter((l) => l.trim());
  return lines.slice(1, 3).join(' ').slice(0, 140) || undefined;
}
function byRecent(a: JournalEntry, b: JournalEntry): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------
function JournalPanel({ navigate, openSurvey }: CascadeContext) {
  const { t } = useDeskLexicon();
  const pages = getJournalPages().slice().sort(byRecent);
  const recent = pages.slice(0, 5);
  const newPage = () => { const e = createJournalPage(); navigate(`/journal/${e.id}`); };
  return (
    <div className="wz-cascade-panel-body">
      <button type="button" className="wz-cascade-action" onClick={() => navigate('/journal')}>{t('cascadeJournalOpen')}</button>
      <button type="button" className="wz-cascade-action" onClick={newPage}>{t('cascadeJournalNewPage')}</button>
      <div>
        <div className="wz-cascade-panel-title" style={{ padding: '2px 0 6px' }}>{t('cascadeJournalRecent')}</div>
        <div className="wz-cascade-list">
          {recent.length === 0 && <div className="wz-cascade-empty">{t('placeFaceEmpty')}</div>}
          {recent.map((e) => (
            <div key={e.id} className="wz-cascade-list-item">
              <button type="button" className="wz-cascade-list-title" onClick={() => navigate(routeFor(e))}>{itemTitle(e)}</button>
            </div>
          ))}
        </div>
      </div>
      {pages.length > 0 && (
        <div className="wz-cascade-panel-footer">
          <button type="button" className="wz-cascade-link" onClick={() => openSurvey({ category: 'journal' })}>{t('cascadeJournalAll')}</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page — the Page face, carried forward whole (S3's own words).
// ---------------------------------------------------------------------------
function PagePanel({ subject }: { subject: PageFaceSubject }) {
  return <PageFace subject={subject} />;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------
function boardTitle(entry: JournalEntry): string {
  if (!entry.text.trim()) return 'Untitled board';
  return firstLine(entry.text).slice(0, 60);
}

function PlanPanel({ subject, project, navigate, openSurvey }: CascadeContext) {
  const { t } = useDeskLexicon();

  // CD2 build call (flag at review): a page with no project yet has no
  // board/plan to open — "Create a Board"/"Plot a Story" both promote the
  // page into a fresh project first, reusing JournalEntry.tsx's own
  // existing "grow a plan from any unplanned page" doorway
  // (createQuickSprintProject) verbatim rather than inventing a second
  // promotion path; "Open…" has nothing to survey yet, so it's simply
  // absent (not greyed — M1's own "no plan to project" silent-degrade law,
  // reused here for "no project to plan").
  if (!project) {
    const seedTitle = firstLine(subject.entry.text).slice(0, 60) || 'Untitled';
    const promote = () => createQuickSprintProject(subject.entry.text, seedTitle);
    const createBoard = () => { const proj = promote(); const b = createBoardPage(proj.id); navigate(`/page/${b.id}`); };
    const plotStory = () => { const proj = promote(); navigate(`/project/${proj.id}/wizard`); };
    return (
      <div className="wz-cascade-panel-body">
        <div className="wz-cascade-empty" style={{ padding: 0 }}>{t('cascadePlanNoProject')}</div>
        <button type="button" className="wz-cascade-action" onClick={createBoard}>{t('cascadePlanCreateBoard')}</button>
        <button type="button" className="wz-cascade-action" onClick={plotStory}>{t('cascadePlanPlotStory')}</button>
      </div>
    );
  }

  const boards = getBinderPages(project.id).filter((p) => p.pageType === 'board');
  const createBoard = () => { const b = createBoardPage(project.id); navigate(`/page/${b.id}`); };
  const plotStory = () => navigate(`/project/${project.id}/wizard`);

  return (
    <div className="wz-cascade-panel-body">
      <button type="button" className="wz-cascade-action" onClick={createBoard}>{t('cascadePlanCreateBoard')}</button>
      <button type="button" className="wz-cascade-action" onClick={plotStory}>{t('cascadePlanPlotStory')}</button>
      <div className="wz-cascade-panel-footer">
        <button type="button" className="wz-cascade-link" onClick={() => openSurvey({ category: 'plan', projectId: project.id })}>
          {t('cascadePlanOpen')}
        </button>
        {boards.length === 0 && <div className="wz-cascade-empty">{t('cascadePlanEmpty')}</div>}
      </div>
    </div>
  );
}

// Per-board quiet disclosure: Move (AddToSheet, the SAME Move/Copy grammar
// PageFace's own verb already uses) + Delete (T4's ruling — one plain
// confirm, then gone; destructive color ONLY inside the confirm).
function BoardRowMenu({ id }: { id: string }) {
  const { t } = useDeskLexicon();
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <button type="button" className="wz-cascade-thumb-menu-item" onClick={() => setMoveOpen(true)}>{t('cascadeBoardMove')}</button>
      {moveOpen && <AddToSheet sourceIds={[id]} onClose={() => setMoveOpen(false)} onDone={() => setMoveOpen(false)} />}
      {!confirmOpen && (
        <button type="button" className="wz-cascade-thumb-menu-item" onClick={() => setConfirmOpen(true)}>{t('cascadeBoardDelete')}</button>
      )}
      {confirmOpen && (
        <div className="wz-cascade-confirm">
          <div className="wz-cascade-confirm-q">{t('cascadeBoardDeleteQuestion')}</div>
          <div className="wz-cascade-confirm-row">
            <button type="button" className="wz-cascade-confirm-danger" onClick={() => { softDeleteEntry(id); setConfirmOpen(false); }}>
              {t('cascadeBoardDeleteConfirm')}
            </button>
            <button type="button" className="wz-cascade-confirm-cancel" onClick={() => setConfirmOpen(false)}>{t('cascadeBoardDeleteCancel')}</button>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Drawers
// ---------------------------------------------------------------------------
function DrawersPanel({ openSurvey }: CascadeContext) {
  const { t } = useDeskLexicon();
  const drawers = getDrawers();
  return (
    <div className="wz-cascade-panel-body">
      <div className="wz-cascade-empty" style={{ padding: 0 }}>
        {drawers.length === 0 ? t('cascadeDrawersEmpty') : t('cascadeDrawersChoose')}
      </div>
      <div className="wz-cascade-list">
        {drawers.map((d) => (
          <div key={d.id} className="wz-cascade-list-item">
            <button type="button" className="wz-cascade-list-title" onClick={() => openSurvey({ category: 'drawers', drawerId: d.id, drawerName: d.name })}>
              {d.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shelf
// ---------------------------------------------------------------------------
function ShelfPanel({ navigate, openSurvey }: CascadeContext) {
  const { t } = useDeskLexicon();
  const items = getShelfPages().slice().sort(byRecent);
  const short = items.slice(0, 5);
  return (
    <div className="wz-cascade-panel-body">
      <div className="wz-cascade-list">
        {short.length === 0 && <div className="wz-cascade-empty">{t('placeFaceEmpty')}</div>}
        {short.map((e) => (
          <div key={e.id} className="wz-cascade-list-item">
            <button type="button" className="wz-cascade-list-title" onClick={() => navigate(routeFor(e))}>{itemTitle(e)}</button>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="wz-cascade-panel-footer">
          <button type="button" className="wz-cascade-link" onClick={() => openSurvey({ category: 'shelf' })}>{t('cascadeShelfBrowse')}</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings (site-wide) — "what exists today ... invent nothing" (S3's own
// words): the SAME Sign out/Sync/Fullscreen controls GlobalHeader's corner
// cluster already carries, reused via components/ChromeControls.tsx, not
// rebuilt. Explicitly distinct from the sliver-foot gear (page/writing
// customization, FX3's own addition) — this category never touches it.
// ---------------------------------------------------------------------------
function CascadeSettingsPanel({ navigate }: { navigate: NavigateFunction }) {
  const { t } = useDeskLexicon();
  const authed = !!getCurrentUser();
  return (
    <div className="wz-cascade-panel-body">
      <div className="wz-cascade-row"><FullscreenToggle /></div>
      <div className="wz-cascade-row"><SyncIndicator /></div>
      {authed && (
        <button
          type="button"
          className="wz-cascade-action"
          onClick={() => { requestLogout(); navigate('/'); }}
        >
          {t('cascadeSettingsSignOut')}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Change Theme — the writer's AVAILABLE themes only (S3's own words);
// future themes are ABSENT, not grayed. `themeOpts` below IS the full
// available list — there is no third entry to hide.
// ---------------------------------------------------------------------------
const THEME_OPTS: [ThemeId, string][] = [['plateau', 'Plateau'], ['flux', 'Flux']];

function CascadeThemePanel() {
  const theme = useTheme();
  return (
    <div className="wz-cascade-panel-body wz-cascade-theme">
      {THEME_OPTS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`wz-cascade-action${theme === id ? ' active' : ''}`}
          aria-pressed={theme === id}
          onClick={() => setTheme(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------
export function renderCategoryPanel(category: CategoryId, ctx: CascadeContext): ReactNode {
  switch (category) {
    case 'journal': return <JournalPanel {...ctx} />;
    case 'page': return <PagePanel subject={ctx.subject} />;
    case 'plan': return <PlanPanel {...ctx} />;
    case 'drawers': return <DrawersPanel {...ctx} />;
    case 'shelf': return <ShelfPanel {...ctx} />;
    case 'settings': return <CascadeSettingsPanel navigate={ctx.navigate} />;
    case 'theme': return <CascadeThemePanel />;
    default: return null;
  }
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
    return { title: deskTerm('drawerPlaceJournal'), items, onTravel: (id) => { const e = pages.find((p) => p.id === id); if (e) ctx.navigate(routeFor(e)); } };
  }
  if (kind.category === 'shelf') {
    const pages = getShelfPages().slice().sort(byRecent);
    const items: SurveyItem[] = pages.map((e) => ({ id: e.id, title: itemTitle(e), excerpt: itemExcerpt(e), current: e.id === currentEntryId }));
    return { title: deskTerm('drawerPlaceShelf'), items, onTravel: (id) => { const e = pages.find((p) => p.id === id); if (e) ctx.navigate(routeFor(e)); } };
  }
  if (kind.category === 'drawers') {
    const drawerProjectIds = new Set(getProjects().filter((p) => p.drawerId === kind.drawerId).map((p) => p.id));
    const pages = [...drawerProjectIds].flatMap((pid) => getBinderPages(pid)).sort(byRecent);
    const items: SurveyItem[] = pages.map((e) => ({ id: e.id, title: itemTitle(e), excerpt: itemExcerpt(e), current: e.id === currentEntryId }));
    return { title: kind.drawerName, items, onTravel: (id) => { const e = pages.find((p) => p.id === id); if (e) ctx.navigate(routeFor(e)); } };
  }
  // 'plan' — the board list (S3's own literal wording; see PlanPanel's own
  // comment + this ticket's build report for why a single board's own
  // card-reorder survey is NOT built this ticket).
  const boards = getBinderPages(kind.projectId).filter((p) => p.pageType === 'board').sort(byRecent);
  const items: SurveyItem[] = boards.map((e) => ({ id: e.id, title: boardTitle(e) }));
  return {
    title: deskTerm('stripPlan'),
    items,
    onTravel: (id) => ctx.navigate(`/page/${id}`),
    renderMenu: (item) => <BoardRowMenu id={item.id} />,
  };
}
