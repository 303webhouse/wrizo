import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useDeskLexicon, deskTerm } from '../store/deskLexicon';
import { firstLine } from '../store/entryText';
import { useSectionFold } from '../store/sectionFold';
import {
  getJournalPages, getShelfEntries, getProjects, getBinderPages, getAllUserBoards,
  createQuickSprintProject, softDeleteEntry,
  getJournalEntry, getOrCreateSystemBoard, saveJournalEntry, pinPageToBoard,
} from '../store/persistence';
import { unbornHref } from '../store/unbornPage';
import { setUserPageDefaults } from '../store/pageDefaults';
import { PAGE_SETTINGS_FALLBACK, type PageSettings } from '../types';
import type { Box } from '../types';
import { getCurrentUser } from '../store/currentUser';
import { requestLogout } from '../store/logoutRequest';
import { useTheme, setTheme, type ThemeId } from '../store/theme';
import { FullscreenToggle, SyncIndicator } from './ChromeControls';
import { PageFace, type PageFaceSubject } from './PageFace';
import { PlacesPanel } from './PlacesPanel';
import { AddToSheet } from './AddToSheet';
import { routeForEntry } from '../store/routeForEntry';
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
// B1 S5 — 'trash' joins the roster: section C's own quiet foot entry.
export type CategoryId = 'journal' | 'page' | 'plan' | 'drawers' | 'shelf' | 'trash' | 'settings' | 'theme';

// B1 S5 — find-or-create + travel, straight to the Board (no intermediate
// hop through the '/journal' bridge route — App.tsx's own header comment
// on JournalBoardGate explains why that bridge exists for every OTHER old
// link; this is new code with nothing old to bridge from).
function openJournalBoard(navigate: NavigateFunction): void {
  const board = getOrCreateSystemBoard('journal');
  navigate(`/page/${board.id}`);
}
function openTrashBoard(navigate: NavigateFunction): void {
  const board = getOrCreateSystemBoard('trash');
  navigate(`/page/${board.id}`);
}
// B2 S1 — the Shelf Board's own find-or-create + travel door, the SAME
// shape as its journal/trash siblings.
function openShelfBoard(navigate: NavigateFunction): void {
  const board = getOrCreateSystemBoard('shelf');
  navigate(`/page/${board.id}`);
}

// A survey "kind" is a small description of WHAT to browse, not a snapshot
// of the items themselves — Cascade.tsx stores one of these as its own
// survey state, and `buildSurvey` (bottom of this file) recomputes the
// actual item list fresh every render. This is what makes a delete from
// inside the survey (Plan's own Delete verb) show up immediately without
// any manual re-fetch.
export type CascadeSurveyKind =
  | { category: 'journal' }
  | { category: 'plan'; projectId: string }
  // AB4 S1 — the CD2 erratum comes true: picking a board in the 'plan'
  // survey (the board list) swaps this SAME column one layer deeper, to
  // that board's own cards. A nested kind rather than a second piece of
  // Cascade.tsx state — `survey` already generalizes to "whatever the
  // writer is currently browsing," and reusing it means dock/undock/
  // Escape/keystroke-dissolve all keep working with zero new plumbing.
  | { category: 'plan-board'; projectId: string; boardId: string; boardTitle: string };
// B2 S1/S3/S7 — 'shelf' and 'drawers' BOTH retire from this union: the
// Shelf category's own panel is now a single quiet door (ShelfPanel,
// mirroring Trash — no nested list to survey), and the Drawers panel (S7)
// is now a large-tile view whose tiles travel directly, never opening a
// nested survey column (the old Drawer-entity choose-a-drawer -> survey-
// its-filed-pages flow retires whole). Park sweep note beside buildSurvey,
// below — both branches quoted verbatim, A4.

export interface CascadeContext {
  subject: PageFaceSubject;
  project: Project | null;
  navigate: NavigateFunction;
  openSurvey: (kind: CascadeSurveyKind) => void;
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
// FX9 S1/S2 — the fold: a header disclosure toggle shared by every
// list-bearing section this ticket touches (DrawersPanel's per-project
// clusters + its documents list, JournalPanel's recent list). ONE component,
// not a per-panel reimplementation — S1's own grammar (whole-header hit
// target, quiet olive chevron, ~180ms/instant-under-reduced-motion, proper
// button semantics) is a single law, not a per-surface judgment call.
//
// `sectionKey` is the S2-ruled stable, content-independent identity (a
// project cluster passes its project id, never its title — callers below
// build the key, this component just stores under whatever it's handed).
// `itemCount` feeds the count-based first-ever default (sectionFold.ts);
// once the writer has ever touched THIS key's toggle, useSectionFold makes
// their choice sovereign and itemCount stops mattering for it.
//
// The collapsed body stays MOUNTED (not conditionally rendered) so the
// height transition below has something real to animate between 0 and its
// content's own natural height — but goes genuinely `inert` (FirstRunGate's
// own established pattern for the same React/TS JSX-typing gap: `inert`
// isn't in this project's @types/react version, so it's set imperatively
// via a ref) plus `aria-hidden` while collapsed, so a collapsed section's
// rows are neither keyboard-focusable nor announced — S3's "the header
// carries its own name and its chevron, that is all it carries" holds for
// the accessibility tree too, not just the paint.
function FoldSection({
  sectionKey, title, itemCount, headerVariant, titleClassName, children,
}: {
  sectionKey: string;
  title: string;
  itemCount: number;
  headerVariant: 'drawers' | 'journal';
  titleClassName?: string;
  children: ReactNode;
}) {
  const [collapsed, toggle] = useSectionFold(sectionKey, itemCount);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (collapsed) el.setAttribute('inert', ''); else el.removeAttribute('inert');
  }, [collapsed]);
  return (
    // FX9 S4 harness note: `data-collapsed`/`data-open` are written as
    // explicit 'true'/'false' STRINGS (not passed-through booleans) — the
    // SAME defensive convention Cascade.tsx's own `data-visible` already
    // uses for a data-* attribute, rather than relying on React's own
    // boolean-to-data-attribute stringification. `aria-expanded`/
    // `aria-hidden` stay raw booleans, matching this file's/Sliver.tsx's/
    // CascadeSurvey.tsx's own existing `aria-expanded={open}` precedent.
    <div className="wz-fold" data-collapsed={collapsed ? 'true' : 'false'}>
      <button
        type="button"
        className={`wz-fold-header wz-fold-header--${headerVariant}`}
        aria-expanded={!collapsed}
        onClick={toggle}
      >
        <span className={titleClassName}>{title}</span>
        <span className="wz-fold-chevron" aria-hidden="true">▸</span>
      </button>
      <div className="wz-fold-body-wrap" data-open={collapsed ? 'false' : 'true'}>
        <div className="wz-fold-body-inner" ref={bodyRef} aria-hidden={collapsed}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------
function JournalPanel({ navigate, openSurvey }: CascadeContext) {
  const { t } = useDeskLexicon();
  const pages = getJournalPages().slice().sort(byRecent);
  const recent = pages.slice(0, 5);
  // PB1 (item 71) — no row until the first word; the door's origin rides in the address.
  const newPage = () => navigate(unbornHref({ origin: 'journal' })); // FX14 S1 — every New Page opens in THE Page
  return (
    <div className="wz-cascade-panel-body">
      {/* B1 S5 — travels to the Journal BOARD now (the section's own
          "Journal destination"), not the retired list surface. */}
      <button type="button" className="wz-cascade-action" onClick={() => openJournalBoard(navigate)}>{t('cascadeJournalOpen')}</button>
      <button type="button" className="wz-cascade-action" onClick={newPage}>{t('cascadeJournalNewPage')}</button>
      {/* FX9 S1 — "Recent" gains the fold. Keyed by a fixed, content-
          independent literal (there's only ever one Recent list here, no
          per-entity identity to ride). `recent` is capped at 5 (line above),
          so this section can never itself exercise S2's ">6 collapses"
          default in practice — it still gets the SAME toggle, per the
          brief's own explicit S1 roster, and still remembers a writer's own
          explicit choice once made. */}
      <FoldSection sectionKey="journalRecent" title={t('cascadeJournalRecent')} itemCount={recent.length} headerVariant="journal">
        <div className="wz-cascade-list">
          {recent.length === 0 && <div className="wz-cascade-empty">{t('placeFaceEmpty')}</div>}
          {recent.map((e) => (
            <div key={e.id} className="wz-cascade-list-item">
              <button type="button" className="wz-cascade-list-title" onClick={() => navigate(routeForEntry(e))}>{itemTitle(e)}</button>
            </div>
          ))}
        </div>
      </FoldSection>
      {pages.length > 0 && (
        <div className="wz-cascade-panel-footer">
          <button type="button" className="wz-cascade-link" onClick={() => openSurvey({ category: 'journal' })}>{t('cascadeJournalAll')}</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page — the Page face, carried forward whole (S3's own words), now with an
// unmissable "New Page" action at its own head (FX6 S2a — "the New Page
// discoverability gap," Nick's own words). A SEPARATE door from
// JournalPanel's own pre-existing New-page button above (cascadeJournalNewPage
// — unrelated to this ticket, and a genuinely different kind of page: that
// one homes in the Journal): a writer already looking at THIS page's own
// face (star/tags/homing) shouldn't have to remember the Journal category
// is where page creation lives — the door travels with the writer instead.
// Reuses createLooseHomePage() verbatim — the SAME "give me a blank page,
// no assumptions about where it files" door Arrival.tsx's own Write door
// already uses (AB3 S4 — `loose` is a legitimate, permanent home, never
// nudged to file), opening at `/page/:id` (PageEditor, mode-aware) — never
// a bespoke creation path or a new route. Olive-lane chrome
// (`wz-cascade-action-door`, index.css) makes it unmissable via CONTRAST
// against its plain neighbors, not urgency color — "nothing orange at
// rest" holds.
// ---------------------------------------------------------------------------
// B2 S5 gave the Page pop-out two doors: "New Journal Entry" and "New Page".
// FX15 S3 (the Quiet Page) RETIRES "New Journal Entry" — it was a second,
// redundant door to journal-origin creation (the Journal category's own
// button and Catch still perform that exact act, unchanged), and "journal
// entry" as a page KIND is dead SV6 vocabulary (the Journal is a home/origin,
// not a type). The Page pop-out now carries one door: New Page, then the Page
// face, then Places.
function PagePanel({ subject, navigate }: { subject: PageFaceSubject; navigate: NavigateFunction }) {
  const { t } = useDeskLexicon();
  // PB1 (item 71) — no row until the first word.
  const newPage = () => navigate(unbornHref({ origin: 'loose' }));
  // ITEM 83 M6 (R13.i/ii) — on a BOARD, the Page face is the board's own
  // page-side hand: the sliver does not mount here (R13.iv), so New page and
  // Place-page live in this drawer instead.
  const onBoard = subject.entry.pageType === 'board';
  return (
    <>
      {/* A Fragment, not a second `.wz-cascade-panel-body` wrapper —
          PageFace already carries its own `.wz-pageface` padding, so
          nesting a second panel-body around both would double it up. */}
      <div style={{ padding: '10px 14px 0' }}>
        <button type="button" className="wz-cascade-action wz-cascade-action-door" onClick={newPage}>
          {t('cascadePageNewPage')}
        </button>
      </div>
      {onBoard && <PlacePageOnBoard boardId={subject.entry.id} />}
      <PageFace subject={subject} />
      {/* ITEM 83 M3 (R6) — the Page menu's charter: general page options
          governing the OPEN page. Sits between the page's own face and its
          Places, because it is about this sheet rather than about where the
          sheet lives. */}
      <PageSetupZone entry={subject.entry} />
      {/* B2 S4 — Places: the Home zone (single-select) + Boards zone (true
          checkboxes), for the page underfoot. Supersedes PageFace's own
          retired Move/Copy verb. */}
      <PlacesPanel entry={subject.entry} />
    </>
  );
}

// ITEM 83 M6 (R13.ii) — PLACE PAGE ON BOARD.
//
// Nick's restructure: the board's PAGE drawer carries New page plus a
// "Place page on board" list — recent pages, scrollable, sortable by
// Date · Drawer · A–Z. Choosing one DERIVES it onto this board.
//
// MEMBERSHIP, NEVER FILING — the distinction PlacesPanel already keeps and
// this list inherits: pinning a page onto a board changes where it APPEARS,
// never where it LIVES. Nothing here writes projectId or origin.
//
// S13's precedent applies (the founder verdict routed to this arc): the verb
// names the act. The heading says "Place page on board", not "Pages" — a bare
// noun list in a drawer is exactly the GO-versus-PUT confusion the Places
// Panel's own redesign (M7) exists to close, and this list would have
// reproduced it one drawer over.
type PlaceSort = 'date' | 'drawer' | 'az';

function PlacePageOnBoard({ boardId }: { boardId: string }) {
  const { t } = useDeskLexicon();
  const [sort, setSort] = useState<PlaceSort>('date');
  const [, force] = useReducer((n: number) => n + 1, 0);

  const candidates = getJournalPages()
    .filter(p => p.id !== boardId && p.pageType !== 'board')
    .slice(0, 30);

  const drawerNameOf = (p: JournalEntry): string => {
    const proj = p.projectId ? getProjects().find(x => x.id === p.projectId) : null;
    return proj?.title || t('placesLoose');
  };
  const titleOf = (p: JournalEntry): string => firstLine(p.text).slice(0, 60) || 'Untitled';

  const sorted = [...candidates].sort((a, b) => {
    if (sort === 'az') return titleOf(a).localeCompare(titleOf(b));
    if (sort === 'drawer') return drawerNameOf(a).localeCompare(drawerNameOf(b)) || titleOf(a).localeCompare(titleOf(b));
    return b.createdAt.localeCompare(a.createdAt);
  });

  const place = (pageId: string) => { pinPageToBoard(pageId, boardId); force(); };

  return (
    <div className="wz-cascade-panel-body wz-place-page">
      <div className="wz-cascade-panel-title">{t('placePageHeading')}</div>
      <div className="wz-page-setup-seg" role="radiogroup" aria-label={t('placePageSort')}>
        {(['date', 'drawer', 'az'] as const).map(s => (
          <button key={s} type="button" role="radio" aria-checked={sort === s}
            className="wz-page-setup-chip" onClick={() => setSort(s)}>
            {t(s === 'date' ? 'placeSortDate' : s === 'drawer' ? 'placeSortDrawer' : 'placeSortAZ')}
          </button>
        ))}
      </div>
      <div className="wz-place-page-list">
        {sorted.length === 0 && <p className="wz-page-setup-note">{t('placePageEmpty')}</p>}
        {sorted.map(p => (
          <button key={p.id} type="button" className="wz-place-page-row" onClick={() => place(p.id)}>
            <span className="wz-place-page-title">{titleOf(p)}</span>
            <span className="wz-place-page-home">{drawerNameOf(p)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ITEM 83 M3 (R6) — PAGE SETUP.
//
// Nick's ruling: "general page options that govern the opened page (margins,
// line spacing, page numbers + their placement, headers, footers, etc.) ...
// linked to the current page a user is on but reset to defaults when the user
// creates a new page. (There should also be a setting for the user to set
// their own default page settings at the bottom of the PAGE menu.)"
//
// THE PAPER IS THE PREVIEW. Margins and line spacing write CSS custom
// properties onto the live sheet, so the change is visible on the writer's own
// page as they choose it — no modal preview, no Apply ceremony, no
// committed-versus-draft state. A decision that is expensive to unmake will
// not be made (RV4's reasoning, which applies to the sheet as much as to the
// voice). Numbers/headers/footers are STORED but do not paint on screen:
// F6's default is that they are sheet furniture for print and export, and the
// screen page stays continuous. The zone says so on its face rather than
// leaving a writer to wonder why a number never appeared.
function PageSetupZone({ entry }: { entry: JournalEntry }) {
  const { t } = useDeskLexicon();
  const [saved, setSaved] = useState(false);
  const current = entry.pageSettings ?? PAGE_SETTINGS_FALLBACK;

  // One writer, one shape: every control funnels through here, so a partial
  // update can never drop a sibling field.
  const patch = (next: Partial<PageSettings>) => {
    const merged: PageSettings = { ...current, ...next };
    saveJournalEntry({ ...entry, pageSettings: merged, updatedAt: new Date().toISOString() });
    setSaved(false);
  };

  return (
    <div className="wz-cascade-panel-body wz-page-setup">
      <div className="wz-cascade-panel-title">{t('pageSetupHeading')}</div>

      <div className="wz-page-setup-row">
        <span className="wz-page-setup-label">{t('pageSetupMargins')}</span>
        <div className="wz-page-setup-seg" role="radiogroup" aria-label={t('pageSetupMargins')}>
          {(['normal', 'narrow', 'wide'] as const).map(m => (
            <button key={m} type="button" role="radio" aria-checked={current.margins === m}
              className="wz-page-setup-chip" onClick={() => patch({ margins: m })}>
              {t(m === 'normal' ? 'pageSetupMarginsNormal' : m === 'narrow' ? 'pageSetupMarginsNarrow' : 'pageSetupMarginsWide')}
            </button>
          ))}
        </div>
      </div>

      <div className="wz-page-setup-row">
        <label className="wz-page-setup-label" htmlFor="wz-page-leading">{t('pageSetupLineSpacing')}</label>
        <input id="wz-page-leading" className="wz-page-setup-range" type="range"
          min="1.2" max="2.2" step="0.1" value={current.lineSpacing}
          onChange={e => patch({ lineSpacing: Number(e.target.value) })} />
        <span className="wz-page-setup-value">{current.lineSpacing.toFixed(1)}</span>
      </div>

      <div className="wz-page-setup-row">
        <span className="wz-page-setup-label">{t('pageSetupNumbers')}</span>
        <button type="button" className="wz-page-setup-chip" aria-pressed={current.pageNumbers.on}
          onClick={() => patch({ pageNumbers: { ...current.pageNumbers, on: !current.pageNumbers.on } })}>
          {t(current.pageNumbers.on ? 'pageSetupOn' : 'pageSetupOff')}
        </button>
      </div>
      {current.pageNumbers.on && (
        <div className="wz-page-setup-seg wz-page-setup-seg--wrap" role="radiogroup" aria-label={t('pageSetupNumbers')}>
          {(['bottom-center', 'bottom-right', 'top-right'] as const).map(p => (
            <button key={p} type="button" role="radio" aria-checked={current.pageNumbers.placement === p}
              className="wz-page-setup-chip" onClick={() => patch({ pageNumbers: { ...current.pageNumbers, placement: p } })}>
              {t(p === 'bottom-center' ? 'pageSetupNumbersPlacementBottomCenter'
                : p === 'bottom-right' ? 'pageSetupNumbersPlacementBottomRight'
                : 'pageSetupNumbersPlacementTopRight')}
            </button>
          ))}
        </div>
      )}

      {(['headers', 'footers'] as const).map(k => (
        <div key={k}>
          <div className="wz-page-setup-row">
            <span className="wz-page-setup-label">{t(k === 'headers' ? 'pageSetupHeaders' : 'pageSetupFooters')}</span>
            <button type="button" className="wz-page-setup-chip" aria-pressed={current[k].on}
              onClick={() => patch({ [k]: { ...current[k], on: !current[k].on } } as Partial<PageSettings>)}>
              {t(current[k].on ? 'pageSetupOn' : 'pageSetupOff')}
            </button>
          </div>
          {current[k].on && (
            <input className="wz-page-setup-text" type="text" value={current[k].text}
              aria-label={t(k === 'headers' ? 'pageSetupHeaderText' : 'pageSetupFooterText')}
              placeholder={t(k === 'headers' ? 'pageSetupHeaderText' : 'pageSetupFooterText')}
              onChange={e => patch({ [k]: { ...current[k], text: e.target.value } } as Partial<PageSettings>)} />
          )}
        </div>
      ))}

      <p className="wz-page-setup-note">{t('pageSetupExportNote')}</p>

      {/* R6's own closing clause: the writer's defaults live at the bottom of
          the PAGE menu, and are a COPY of this page's settings (see
          store/pageDefaults.ts on why a copy rather than a live link). */}
      <button type="button" className="wz-cascade-action"
        onClick={() => { setUserPageDefaults(current); setSaved(true); }}>
        {t('pageSetupSaveDefaults')}
      </button>
      {saved && <p className="wz-page-setup-note wz-page-setup-note--ok">{t('pageSetupSavedDefaults')}</p>}
    </div>
  );
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
    // PB1 (item 71) — an UNTITLED board is the duplicate-empty-board source named
    // in the door census: no row until it has a box. (A titled board is born at
    // once — a name is content, ruling 3 — and does not come through here.)
    const createBoard = () => { const proj = promote(); navigate(unbornHref({ kind: 'board', binderId: proj.id })); };
    const plotStory = () => { const proj = promote(); navigate(`/project/${proj.id}/wizard`); };
    return (
      <div className="wz-cascade-panel-body">
        <div className="wz-cascade-empty" style={{ padding: 0 }}>{t('cascadePlanNoProject')}</div>
        <button type="button" className="wz-cascade-action" onClick={createBoard}>{t('cascadePlanCreateBoard')}</button>
        <button type="button" className="wz-cascade-action" onClick={plotStory}>{t('cascadePlanPlotStory')}</button>
        {/* FX6 S2c — a quiet one-line pointer at the OTHER new door: a
            writer who just wants a page (not a whole board/plan) currently
            sees only project-creating buttons here — this says where the
            plainer door actually is. */}
        <div className="wz-cascade-empty" style={{ padding: 0 }}>{t('cascadePlanJustAPage')}</div>
      </div>
    );
  }

  const boards = getBinderPages(project.id).filter((p) => p.pageType === 'board');
  // PB1 (item 71) — no row until the board has a box (see the door census).
  const createBoard = () => navigate(unbornHref({ kind: 'board', binderId: project.id }));
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
// Drawers (B2 S7, A17's chrome) — a large-tile cascade panel, never a new
// route or full-screen surface (the anti-file-manager rule binds). Grouping
// is DERIVED, never authored: a project's cluster IS Nick's "drawer," from
// projectId alone (zero new entities — this reuses the SAME `Project`
// storage row the pre-existing Drawer-entity tree does NOT touch; that
// older, separate `/drawers` full-browse surface and its own `Drawer` row
// — Drawers D1, unrelated ontology — are untouched by this ticket, see the
// build report). The Shelf renders as the FIRST tile (T4's proposal);
// loose docs reuse T3's own derivation (getShelfEntries — "one definition,
// two consumers," the Shelf Board's own reconcile being the other). Every
// OTHER system board keeps its own separate door (Journal/Trash/Shelf all
// still have their own strip categories) — only the Shelf ALSO earns a
// tile here.
// ---------------------------------------------------------------------------
function drawersItemTitle(e: JournalEntry): string {
  const hasInk = (e.strokes?.length ?? 0) > 0;
  if (!e.text.trim()) return hasInk ? 'A sketch' : 'Untitled';
  return firstLine(e.text).slice(0, 60);
}

interface DrawerTile { kind: 'board' | 'doc'; id: string; title: string; updatedAt: string; projectId?: string; entry?: JournalEntry }

// A quiet, abstract kind mark — square vs. round, non-literal (the brief's
// own words: "abstract, non-literal"). aria-label carries the real word for
// assistive tech; nothing here is a count, a badge, or a timestamp.
function TileKindMark({ kind }: { kind: 'board' | 'doc' }) {
  const { t } = useDeskLexicon();
  return (
    <span className="wz-drawers-tile-kind" data-kind={kind} aria-label={t(kind === 'board' ? 'drawersKindBoard' : 'drawersKindDoc')} />
  );
}

function DrawersPanel({ navigate }: CascadeContext) {
  const { t } = useDeskLexicon();
  const projects = getProjects();
  const projectTitle = (id?: string) => projects.find((p) => p.id === id)?.title || 'Untitled';

  const boards: DrawerTile[] = getAllUserBoards().map((b) => ({ kind: 'board', id: b.id, title: drawersItemTitle(b), updatedAt: b.updatedAt, projectId: b.projectId ?? undefined }));
  // T3's own derivation, reused verbatim — "one definition, two consumers".
  const docs: DrawerTile[] = getShelfEntries().map((e) => ({ kind: 'doc', id: e.id, title: drawersItemTitle(e), updatedAt: e.updatedAt, entry: e }));
  const all = [...boards, ...docs];

  // Last-opened anchors first (Nick's word) — approximated by `updatedAt`
  // (last touched), the SAME recency proxy this file's own `byRecent`
  // already uses elsewhere; this app has no separate "opened-at" stamp to
  // read, and adding one would be schema this ticket doesn't get to spend.
  const anchor = all.length > 0 ? all.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] : null;
  const rest = anchor ? all.filter((tItem) => !(tItem.kind === anchor.kind && tItem.id === anchor.id)) : all;

  const restBoards = rest.filter((tItem) => tItem.kind === 'board');
  const restDocs = rest.filter((tItem) => tItem.kind === 'doc');
  const clusterMap = new Map<string, DrawerTile[]>();
  for (const b of restBoards) {
    const key = b.projectId ?? '';
    if (!clusterMap.has(key)) clusterMap.set(key, []);
    clusterMap.get(key)!.push(b);
  }
  // Ordering beneath the anchor is deterministic: project name, then board title.
  const clusters = [...clusterMap.entries()]
    .map(([projectId, items]) => ({ projectId, title: projectTitle(projectId), items: items.slice().sort((a, b) => a.title.localeCompare(b.title)) }))
    .sort((a, b) => a.title.localeCompare(b.title));
  const sortedDocs = restDocs.slice().sort((a, b) => a.title.localeCompare(b.title));

  const travel = (tItem: DrawerTile) => {
    if (tItem.kind === 'board') { navigate(`/page/${tItem.id}`); return; }
    if (tItem.entry) navigate(routeForEntry(tItem.entry));
  };

  return (
    <div className="wz-cascade-panel-body">
      <div className="wz-drawers-tiles">
        <button type="button" className="wz-drawers-tile" onClick={() => openShelfBoard(navigate)}>
          <TileKindMark kind="board" />
          <span className="wz-drawers-tile-title">{t('drawerPlaceShelf')}</span>
        </button>
        {anchor && (
          <button type="button" className="wz-drawers-tile wz-drawers-tile-anchor" onClick={() => travel(anchor)}>
            <TileKindMark kind={anchor.kind} />
            <span className="wz-drawers-tile-title">{anchor.title}</span>
          </button>
        )}
        {/* FX9 S1/S2 — each project cluster gains the fold. Keyed by
            `drawersProject:<id>` — the project's OWN id, never its title
            (S2's own explicit ruling: a rename must not forget the fold).
            `c.projectId` is already the stable identity DrawerTile's own
            clusterMap grouped by, above — this reuses it verbatim rather
            than deriving a second one from `c.title`. */}
        {clusters.map((c) => (
          <FoldSection
            key={c.projectId}
            sectionKey={`drawersProject:${c.projectId}`}
            title={c.title}
            itemCount={c.items.length}
            headerVariant="drawers"
            titleClassName="wz-drawers-cluster-title"
          >
            <div className="wz-drawers-cluster">
              {c.items.map((b) => (
                <button key={b.id} type="button" className="wz-drawers-tile" onClick={() => travel(b)}>
                  <TileKindMark kind="board" />
                  <span className="wz-drawers-tile-title">{b.title}</span>
                </button>
              ))}
            </div>
          </FoldSection>
        ))}
        {/* FX9 S1/S2 — the Loose docs group gains the fold too. A single,
            content-independent fixed key ('drawersLoose') — there is only
            ever one such group, no per-entity identity to ride. */}
        {sortedDocs.length > 0 && (
          <FoldSection
            sectionKey="drawersLoose"
            title={t('drawersLooseGroup')}
            itemCount={sortedDocs.length}
            headerVariant="drawers"
            titleClassName="wz-drawers-cluster-title"
          >
            <div className="wz-drawers-cluster">
              {sortedDocs.map((d) => (
                <button key={d.id} type="button" className="wz-drawers-tile" onClick={() => travel(d)}>
                  <TileKindMark kind="doc" />
                  <span className="wz-drawers-tile-title">{d.title}</span>
                </button>
              ))}
            </div>
          </FoldSection>
        )}
      </div>
      {/* Genuine miniature board/doc previews are a named future refinement
          (A17's own text), NOT built here — every tile above is title +
          the abstract kind mark only. */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shelf (B2 S1/S3) — joins Trash's own minimal shape: one plain button,
// nothing else — no row list, no preview, no count (T3's own membership
// list lives on the Shelf BOARD itself, reached by this one door; a
// SEPARATE short-list preview here would be a second, competing surface
// for the same truth). The old getShelfPages()-based list (the legacy
// `shelved` flag's own UI) retires whole — S3's mandate — replaced by the
// derived Shelf Board this same button opens.
// ---------------------------------------------------------------------------
function ShelfPanel({ navigate }: CascadeContext) {
  const { t } = useDeskLexicon();
  return (
    <div className="wz-cascade-panel-body">
      <button type="button" className="wz-cascade-action" onClick={() => openShelfBoard(navigate)}>{t('cascadeShelfOpen')}</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trash (B1 S5) — joins the cascade "quietly at the foot of section C —
// reachable, never prominent, no count anywhere near it." One plain button,
// nothing else: no row list, no preview, no number of anything — the Trash
// is a place, not a nag (A18's anti-solicitation core, held here the same
// way it's held on the Board itself: Delete stays quiet everywhere, and so
// does the door to where deleted pages wait).
// ---------------------------------------------------------------------------
function TrashPanel({ navigate }: { navigate: NavigateFunction }) {
  const { t } = useDeskLexicon();
  return (
    <div className="wz-cascade-panel-body">
      <button type="button" className="wz-cascade-action" onClick={() => openTrashBoard(navigate)}>{t('cascadeTrashOpen')}</button>
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
    case 'page': return <PagePanel subject={ctx.subject} navigate={ctx.navigate} />;
    case 'plan': return <PlanPanel {...ctx} />;
    case 'drawers': return <DrawersPanel {...ctx} />;
    case 'shelf': return <ShelfPanel {...ctx} />;
    case 'trash': return <TrashPanel navigate={ctx.navigate} />;
    case 'settings': return <CascadeSettingsPanel navigate={ctx.navigate} />;
    case 'theme': return <CascadeThemePanel />;
    default: return null;
  }
}

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
  const text = (box.text ?? '').trim();
  if (!text) return { id: box.id, title: 'Untitled' };
  const lines = text.split('\n').filter((l) => l.trim());
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
  if (kind.category === 'plan') {
    // The board list (S3's own literal wording). AB4 S1 — the CD2 erratum
    // comes true: picking a board no longer travels away, it swaps this
    // SAME survey column to that board's own cards (one layer deeper) —
    // see the 'plan-board' branch below. The board itself stays reachable
    // one click further in (a non-pin card there opens it).
    const boards = getBinderPages(kind.projectId).filter((p) => p.pageType === 'board').sort(byRecent);
    const items: SurveyItem[] = boards.map((e) => ({ id: e.id, title: boardTitle(e) }));
    return {
      title: deskTerm('stripPlan'),
      items,
      onTravel: (id) => {
        const b = boards.find((x) => x.id === id);
        if (b) ctx.openSurvey({ category: 'plan-board', projectId: kind.projectId, boardId: id, boardTitle: boardTitle(b) });
      },
      renderMenu: (item) => <BoardRowMenu id={item.id} />,
    };
  }
  // 'plan-board' — one board's own cards (S1: "large thumbnails — title
  // plus a two-line excerpt... with a quiet back affordance to the board
  // list"). Connections are hairlines, not cards — filtered out here, the
  // same discipline BoardEditor.tsx applies when it separates them from the
  // positioned-card render loop. A page-pin card travels to its own page; a
  // plain text/ink card travels to the board itself (nothing else to open),
  // so the board stays reachable from the survey exactly as the old
  // board-list click used to be, just one layer further in.
  const boxes = (getJournalEntry(kind.boardId)?.boxes ?? []).filter((b) => b.kind !== 'connection');
  const cardItems: SurveyItem[] = boxes.map((b) => boardCardItem(b, currentEntryId));
  return {
    title: kind.boardTitle,
    items: cardItems,
    onTravel: (id) => {
      const box = boxes.find((b) => b.id === id);
      if (!box) return;
      if (box.kind === 'page-pin' && box.entryId) {
        const entry = getJournalEntry(box.entryId);
        if (entry) ctx.navigate(routeForEntry(entry));
        return;
      }
      ctx.navigate(`/page/${kind.boardId}`);
    },
    onBack: () => ctx.openSurvey({ category: 'plan', projectId: kind.projectId }),
  };
}
