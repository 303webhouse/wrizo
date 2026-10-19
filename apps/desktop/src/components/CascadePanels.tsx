import { liveBoxes } from '../store/boxTombstones';
import { useAskBeforeDelete, setAskBeforeDelete, requestDelete } from '../store/deleteGate';
import { openContextMenu } from '../store/contextMenu';
import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useDeskLexicon, deskTerm } from '../store/deskLexicon';
import { boardDrawerLine } from '../store/pageHome';
import { DrawerNote } from './DrawerNote';
import { firstLine, plainLines } from '../store/entryText';
import { useSectionFold } from '../store/sectionFold';
import {
  getJournalPages, getJournalEntries, inJournalView, flushNow,
  getShelfEntries, getProjects, getBinderPages, getAllUserBoards,
  createQuickSprintProject, softDeleteEntry, getProject,
  getJournalEntry, getOrCreateSystemBoard, saveJournalEntry, pinPageToBoard,
  getPlanBoardId, getBoardsConnecting, setPinDisplayed, copyCardToBoard,
} from '../store/persistence';
import { rememberLastPlanBoard, getLastPlanBoard } from '../store/planTrail';
import { unbornHref } from '../store/unbornPage';
import { setUserPageDefaults } from '../store/pageDefaults';
import { PAGE_SETTINGS_FALLBACK, type PageSettings } from '../types';
import type { Box } from '../types';
import { getCurrentUser } from '../store/currentUser';
import { requestLogout } from '../store/logoutRequest';
import { useSigningOut } from '../store/useSigningOut';
import { useTheme, setTheme, type ThemeId } from '../store/theme';
import { FullscreenToggle, SyncIndicator } from './ChromeControls';
import { PageFace, type PageFaceSubject } from './PageFace';
import { SectionsPopout } from './SectionsPopout';
import { PlaceSwitcher } from './PlaceSwitcher';
import { PlacesPanel } from './PlacesPanel';
import { AddToSheet } from './AddToSheet';
import { PinToBoardSheet } from './PinToBoardSheet';
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
// BIG PROJECTS 1a: 'shelf' leaves the roster (its pages are shown in the Journal); 'drawers' is now the PLACE BLOCK's switcher.
export type CategoryId = 'journal' | 'page' | 'plan' | 'drawers' | 'trash' | 'settings' | 'theme';

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
  // AB4 S1 — the CD2 erratum comes true: picking a board swaps this SAME
  // column one layer deeper, to that board's own cards. A nested kind rather
  // than a second piece of Cascade.tsx state — `survey` already generalizes
  // to "whatever the writer is currently browsing," and reusing it means
  // dock/undock/Escape/keystroke-dissolve all keep working with zero new
  // plumbing.
  //
  // PW1 S1/PW3 — THE `'plan'` VARIANT RETIRES WITH THE `Open…` LINK THAT WAS
  // ITS ONLY DOOR. It surveyed `getBinderPages(projectId)` — the boards that
  // merely LIVE IN THIS PAGE'S DRAWER — which is co-location, not connection,
  // and is the wrong subject this whole slice exists to correct. The board
  // list is now the PANEL itself (PW3: "the panel IS the list"), so a board
  // row is pressed one layer higher up and this kind is reached directly.
  // ORIGINAL, quoted so the retirement is legible rather than silent:
  //   | { category: 'plan'; projectId: string }
  // `projectId` retires from 'plan-board' with it — its ONLY reader was that
  // branch's `onBack`, which now walks back to the panel (the list) instead of
  // to a second survey. Dropping it is also what lets a LOOSE page open its
  // own connected board: there is no project to name, and there never needed
  // to be one.
  | { category: 'plan-board'; boardId: string; boardTitle: string };
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
  // PW1 S1/S5 — walk back from a survey to the PANEL, which is now the list
  // (PW3). The survey's `‹` used to open a second survey; with the board list
  // living one layer up there is nothing to open, only a layer to close.
  closeSurvey: () => void;
  // PW1 S4 — travel that KEEPS THE RAIL. Stages the cascade's current shape so
  // the destination mounts with the same category and survey open, then
  // navigates. Every travel originated from inside the cascade goes through
  // here; ordinary navigation elsewhere is untouched.
  travelFromCascade: (entry: JournalEntry) => void;
  // BIG PROJECTS 1a - close the whole cascade (the switcher closes after a choice).
  closeCascade: () => void;
}

function itemTitle(entry: JournalEntry): string {
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  if (!entry.text.trim()) return hasInk ? 'A sketch' : 'Untitled';
  return firstLine(entry.text).slice(0, 60);
}
function itemExcerpt(entry: JournalEntry): string | undefined {
  const lines = plainLines(entry.text);   // item 210: excerpts are plain text
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
  // BIG PROJECTS 1a - THE PAGES POP-OUT (components/SectionsPopout.tsx) replaces the New Page door and the Open Pages list: the place's sections in
  // the writer's own order, + New Page (into where you are), + New set, Presets, and X out to the Journal. The Page face, Page Setup and Places stay
  // beneath it until step 1b moves them into the page header.
  // ITEM 83 M6 (R13.i/ii) - on a BOARD the pop-out's rows keep their secondary act, "Place on this board" (PW1 S3).
  const onBoard = subject.entry.pageType === 'board';
  return (
    <>
      {/* A Fragment, not a second `.wz-cascade-panel-body` wrapper -
          PageFace already carries its own `.wz-pageface` padding, so
          nesting a second panel-body around both would double it up. */}
      <SectionsPopout view="pages" currentId={subject.entry.id} navigate={navigate} boardId={onBoard ? subject.entry.id : undefined} journalLabel={t('drawerPlaceJournal')} />
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

// ITEM 170 (P0), kept as history: the list that used to stand here (Open Pages) was the way to OPEN a page - a click on a row GOES, placing it on a
// board is the row's secondary act, one list of every live page that is not a board, uncapped. BIG PROJECTS 1a replaced the list with
// SectionsPopout, which keeps all three properties (the row opens the page; "Place on this board" stays behind the row's more-menu on a board;
// nothing is capped) and scopes it to where the writer is.

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
      <div className="wz-cascade-panel-title">
        {t('pageSetupHeading')}{' '}
        {/* ITEM word-diet (Nick, Oct 13) — the export note moves behind a
            "?", one plain sentence, beside the heading rather than always
            standing below the rows. */}
        <DrawerNote label="About export and print">{t('pageSetupExportNote')}</DrawerNote>
      </div>

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

// PW1 S1 — BOARDS CONNECTED. THE SUBJECT CHANGES, and that is the whole slice.
// The panel used to list `getBinderPages(project.id)` — which containers live
// inside this page's DRAWER — when the writer asked which containers hold THIS
// PAGE. Co-location is not connection. The right set was already computed and
// already rendered, as a SENTENCE, inside a drawer, where it could not be
// pressed: `planBoardId` ∪ `getBoardsConnecting`. Zero schema; both functions
// built, local, and already called this same render.
interface ConnectedBoard {
  id: string;
  title: string;
  /** The second line: the RELATION or the DRAWER. Never a count (PW10; A14/A18; BD4). */
  relation: string;
  /** The page's own paired plan board — a SURFACE OWNING A CONTAINER (the three-space canon). */
  own: boolean;
}

// PW1 S1 — the untitled plan board is titled FROM ITS PAGE. `getOrCreatePlanBoard`
// mints `text: ''`, so a plan board is normally nameless; the pairing is 1:1, so
// the page's own name is a TRUE name for it rather than a guess, and it spares
// the writer a naming step the minimum-setup law forbids (PW10's clause).
function planBoardTitleFor(board: JournalEntry, page: JournalEntry): string {
  if (board.text.trim()) return boardTitle(board);
  const pageTitle = firstLine(page.text).slice(0, 60) || 'Untitled';
  return `${pageTitle} ${deskTerm('cascadePlanOwnSuffix')}`;
}

// ITEM 163 — RETIRED IN FAVOUR OF ONE READER. This returned the drawer name
// BARE, which is the defect Nick read as a subtitle; `drawerCaptionFor` below
// already returned the ruled "in <drawer>" form for the zone caption. Two
// spellings of one fact, one right and one wrong. Both now call `boardDrawerLine`
// (store/pageHome.ts) — 131(a)'s shape, fix the class.

// PW1 S1 + Fable's ruling 2 — computed from the PAGE ALONE, deliberately
// independent of `project`. A loose page can own a plan board (minted with
// `projectId: null`) and can be pinned to boards; hiding its real connections
// behind creation doors because it has no drawer yet would answer a question
// the writer did not ask with doors they did not need.
function connectedBoardsFor(page: JournalEntry): ConnectedBoard[] {
  const rows: ConnectedBoard[] = [];
  const seen = new Set<string>();
  const planId = getPlanBoardId(page.id);
  if (planId) {
    // `getPlanBoardId` is a raw pointer read with no existence check — a board
    // that was deleted (or soft-deleted; getJournalEntry excludes both) must
    // NOT become a row onto nothing. G3, at the level of a single row.
    const board = getJournalEntry(planId);
    if (board) {
      rows.push({ id: board.id, title: planBoardTitleFor(board, page), relation: deskTerm('cascadePlanRelationOwn'), own: true });
      seen.add(board.id);
    }
  }
  for (const pinned of getBoardsConnecting(page.id)) {
    if (seen.has(pinned.id)) continue; // ∪ — a page pinned to its OWN plan board is one row, named by the truer relation
    seen.add(pinned.id);
    const board = getJournalEntry(pinned.id);
    if (!board) continue;
    rows.push({ id: board.id, title: pinned.title, relation: boardDrawerLine(board), own: false });
  }
  return rows;
}

// PW1 S5 — STICKINESS (Nick, Q6: YES). The Plan panel reopens on the board
// whose contents were last open, PER PAGE. Not a configured relationship — the
// machine declining to forget, restoring only what the writer THEMSELVES
// opened. Second and later visits cost two presses instead of three.
//
// Resolved at the moment the category OPENS (Cascade.tsx's own toggle), which
// is what makes it stick without fighting the writer: pressing the survey's `‹`
// walks back to the list and STAYS there, because nothing re-resolves until the
// panel is opened afresh. The `‹` is always the way back to the list.
//
// The remembered board is re-validated against the LIVE connection set every
// time, so a board that was deleted, or unpinned from this page since, simply
// does not restore — a stale id can never become a survey onto nothing (G3).
export function resolveStickyPlanSurvey(page: JournalEntry): CascadeSurveyKind | null {
  const lastId = getLastPlanBoard(page.id);
  if (!lastId) return null;
  const row = connectedBoardsFor(page).find((r) => r.id === lastId);
  return row ? { category: 'plan-board', boardId: row.id, boardTitle: row.title } : null;
}

// PW2 S2 / ITEM 163 — the zone's caption on a board, and now the board ROW's
// second line and the canvas board-card too, all from `boardDrawerLine`. This
// function's body moved there VERBATIM: the caption was already the correct form,
// so the shared reader is the code that was already right, not a new invention.

// PW1 S1/S2 — one board row. ONE ACT PER ROW (PP4): a press opens that board's
// contents and does nothing else. Double-click TRAVELS to the board (Nick, Q4),
// and — PW22, the twin law — that gesture is never the only path: `Open the
// board` rides the same `⋯` the row already carries, so the keyboard and the
// unfamiliar hand keep a way in. The preceding single click merely opens the
// survey, which the travel then supersedes; nothing is lost either way.
function BoardConnectedRow({ row, onOpenContents, onTravel }: { row: ConnectedBoard; onOpenContents: () => void; onTravel: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="wz-cascade-boardrow" data-own={row.own ? 'true' : 'false'} data-link-entry={row.id}>
      <button
        type="button"
        className="wz-cascade-boardrow-open"
        onClick={onOpenContents}
        onDoubleClick={onTravel}
        onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
      >
        <span className="wz-cascade-boardrow-title">{row.title}</span>
        <span className="wz-cascade-boardrow-relation">{row.relation}</span>
      </button>
      <button type="button" className="wz-cascade-thumb-menu-btn wz-cascade-boardrow-menu-btn" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>⋯</button>
      {menuOpen && (
        <div className="wz-cascade-thumb-menu">
          {/* PW22's twin: the menu carries what the double-click does. */}
          <button type="button" className="wz-cascade-thumb-menu-item wz-cascade-open-board" onClick={() => { setMenuOpen(false); onTravel(); }}>{deskTerm('cascadeOpenBoard')}</button>
          <BoardRowMenu id={row.id} />
        </div>
      )}
    </div>
  );
}

function PlanPanel({ subject, project, navigate, openSurvey, travelFromCascade }: CascadeContext) {
  const { t } = useDeskLexicon();

  // CD2 build call (flag at review): a page with no project yet has no
  // board/plan to open — "Create a Board"/"Plot a Story" both promote the
  // page into a fresh project first, reusing JournalEntry.tsx's own
  // existing "grow a plan from any unplanned page" doorway
  // (createQuickSprintProject) verbatim rather than inventing a second
  // promotion path; "Open…" has nothing to survey yet, so it's simply
  // absent (not greyed — M1's own "no plan to project" silent-degrade law,
  // reused here for "no project to plan").
  // PW1 S1 — the connections, computed BEFORE the no-project fork so both
  // branches can render them (Fable's ruling 2). ABSENT, NEVER EMPTY (PW9;
  // G3): no connections → the zone does not render at all. Not a zone
  // containing "No boards yet." — nothing announces a capability the writer
  // has not reached for; the zone arrives the moment they pin, because THEY
  // pinned. `cascadePlanEmpty` retires from this path with it.
  const rows = connectedBoardsFor(subject.entry);
  const openContents = (row: ConnectedBoard) => {
    // PW1 S5 — stickiness: remember what the writer THEMSELVES opened, so the
    // second and every later visit costs two presses instead of three.
    rememberLastPlanBoard(subject.entry.id, row.id);
    openSurvey({ category: 'plan-board', boardId: row.id, boardTitle: row.title });
  };
  const travelToBoard = (row: ConnectedBoard) => {
    const board = getJournalEntry(row.id);
    if (board) travelFromCascade(board);
  };
  const zone = rows.length > 0 ? (
    <div className="wz-cascade-plan-zone" role="group" aria-label={t('cascadePlanBoardsConnected')}>
      {/* The engraved heading. Presentation uppercase rides the zone register
          in CSS; the LEXICON term carries Nick's own sentence case (Q2). No
          verb heading — here the nouns mean GO, and the writer's learned
          grammar is already right (PW1; PP1 applied, opposite output). */}
      <div className="wz-cascade-panel-title wz-cascade-plan-title">{t('cascadePlanBoardsConnected')}</div>
      {/* PW2 S2 (item 128, ruling A + Fable's refinement) — THE DRAWER IS THE
          ZONE'S CAPTION, NOT A ROW. On a board, this zone names its drawer as
          well as its parent boards; making the drawer a ROW would have meant
          an INERT row sitting among pressable ones, which PP4 forbids. As a
          caption nothing is inert and the rule holds as written.

          IT IS NOT PRESSABLE, AND THAT IS G3, NOT AN OVERSIGHT: a drawer has
          no surface of its own yet, and a door onto a surface that does not
          exist is exactly the destination-blind gesture item 118's unlink and
          item 133 were both about. Routing it to the all-drawers list was
          considered and REFUSED for the same reason — landing on a list of
          every drawer does not answer "show me this one".

          ⚠ SUCCESSOR, RECORDED HERE SO IT IS ADDED DELIBERATELY RATHER THAN
          DISCOVERED MISSING: the day the drawer's own surface ships, this
          caption becomes the door to it. */}
      {subject.entry.pageType === 'board' && <div className="wz-cascade-plan-caption">{boardDrawerLine(subject.entry)}</div>}
      {rows.map((row) => (
        <BoardConnectedRow key={row.id} row={row} onOpenContents={() => openContents(row)} onTravel={() => travelToBoard(row)} />
      ))}
      <div className="wz-cascade-plan-rule" role="separator" />
    </div>
  ) : null;

  // BIG PROJECTS step 2 - THE BOARDS TAB. The panel is the Pages pop-out's mirror (components/SectionsPopout.tsx, boards mode): where you are, New Board, the place's
  // boards in the writer's own order, New set, and PRESETS (the deck library). The creation doors this panel carried - Create a Board, Plot a Story - and the "file this
  // page to a drawer first" lead are GONE: a board is filed into wherever the writer is (nothing is homeless), and the presets are the decks.
  //
  // THE ZONE STAYS, AS A BRIDGE: "Boards grafted" (the boards THIS page is connected to, PW1) keeps its rows and its stickiness here until step 3 gives it its home in
  // Grafts ("Connected to [page]"), where it becomes the Boards group. It is absent when there is nothing to show, as it always was.
  //
  // PARKED so the retirement is legible (A4) - this panel used to end with two action buttons (create a board, plot a story) and, when nothing was connected, the lead
  // sentence telling a page with no drawer to file itself first. The lexicon keeps those terms; nothing renders them now.
  void project;
  return (
    <SectionsPopout view="boards" currentId={subject.entry.id} navigate={navigate} journalLabel={t('drawerPlaceJournal')} zone={zone} />
  );
}

// Per-board quiet disclosure: Move (AddToSheet, the SAME Move/Copy grammar
// PageFace's own verb already uses) + Delete (T4's ruling — one plain
// confirm, then gone; destructive color ONLY inside the confirm).
function BoardRowMenu({ id }: { id: string }) {
  const { t } = useDeskLexicon();
  const [moveOpen, setMoveOpen] = useState(false);
  // BOARD CONTEXT MENU: the inline "are you sure" this row used to carry (T4: one plain confirm) is the ONE "Send to Trash?" dialog now - same gate as a card, a Page, a Drawers row.
  return (
    <>
      <button type="button" className="wz-cascade-thumb-menu-item" onClick={() => setMoveOpen(true)}>{t('cascadeBoardMove')}</button>
      {moveOpen && <AddToSheet sourceIds={[id]} onClose={() => setMoveOpen(false)} onDone={() => setMoveOpen(false)} />}
      <button type="button" className="wz-cascade-thumb-menu-item" onClick={() => requestDelete(() => { softDeleteEntry(id); })}>{t('cascadeBoardDelete')}</button>
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
// BIG PROJECTS 1a - the `drawers` category is the PLACE SWITCHER now (components/PlaceSwitcher.tsx): Drawers, Journals, + New Drawer. The tiles
// that used to stand here (every board of every Drawer, the Shelf door) retire with it; boards are listed by the Boards pop-out (step 2), and
// every row carries data-link-entry so the connector can still land on it.
function DrawersPanel({ closeCascade }: CascadeContext) {
  return <PlaceSwitcher onChosen={closeCascade} />;
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
  const signingOut = useSigningOut();
  const askBeforeDelete = useAskBeforeDelete();
  return (
    <div className="wz-cascade-panel-body">
      <div className="wz-cascade-row"><FullscreenToggle /></div>
      <div className="wz-cascade-row"><SyncIndicator /></div>
      {/* BOARD CONTEXT MENU: the one setting for every delete - ticking "Don't ask me again" in the dialog turns it off; this turns it back on (per device) */}
      <button type="button" className="wz-cascade-switch" role="switch" aria-checked={askBeforeDelete ? 'true' : 'false'} onClick={() => setAskBeforeDelete(!askBeforeDelete)}>
        <span>{t('settingsAskBeforeDelete')}</span>
        <span className="wz-cascade-switch-track" aria-hidden="true"><i /></span>
      </button>
      {authed && (
        <button
          type="button"
          className="wz-cascade-action"
          onClick={() => { requestLogout(); }}
          disabled={signingOut}
        >
          {signingOut ? t('logoutSigningOut') : t('cascadeSettingsSignOut')}
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
const THEME_OPTS: [ThemeId, string][] = [['plateau', 'Arbor'], ['flux', 'Flux']];

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
  const lines = plainLines(box.text ?? '');   // item 210: a card's title and excerpt are plain text
  if (lines.length === 0) return { id: box.id, title: 'Untitled' };
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
  // PW1 S1/PW3 — THE `'plan'` BRANCH RETIRES. It surveyed
  // `getBinderPages(projectId)` — every board in this page's DRAWER — which is
  // the wrong subject (co-location, not connection) and the exact defect this
  // slice exists to correct. The board list is now the PANEL (PlanPanel's own
  // "Boards connected" zone), so this layer is reached directly from a board
  // row one layer up and nothing opens a board LIST survey any more. Its
  // `renderMenu` moves with it: BoardRowMenu now rides the panel's board rows,
  // where it gained `Open the board` as the double-click's twin (PW22).
  // PARKED, quoted verbatim (A4) — the successor is PlanPanel above:
  //   if (kind.category === 'plan') {
  //     const boards = getBinderPages(kind.projectId).filter((p) => p.pageType === 'board').sort(byRecent);
  //     const items: SurveyItem[] = boards.map((e) => ({ id: e.id, title: boardTitle(e) }));
  //     return {
  //       title: deskTerm('stripPlan'),
  //       items,
  //       onTravel: (id) => {
  //         const b = boards.find((x) => x.id === id);
  //         if (b) ctx.openSurvey({ category: 'plan-board', projectId: kind.projectId, boardId: id, boardTitle: boardTitle(b) });
  //       },
  //       renderMenu: (item) => <BoardRowMenu id={item.id} />,
  //     };
  //   }
  // 'plan-board' — one board's own cards (S1: "large thumbnails — title
  // plus a two-line excerpt... with a quiet back affordance to the board
  // list"). Connections are hairlines, not cards — filtered out here, the
  // same discipline BoardEditor.tsx applies when it separates them from the
  // positioned-card render loop. A page-pin card travels to its own page; a
  // plain text/ink card travels to the board itself (nothing else to open),
  // so the board stays reachable from the survey exactly as the old
  // board-list click used to be, just one layer further in.
  const allBoxes = liveBoxes(getJournalEntry(kind.boardId)?.boxes).filter((b) => b.kind !== 'connection' && b.kind !== 'board-meta');

  // PW1 S2, Q14 — THE BOARD'S OWN READING ORDER. Sort by `y`, THEN `x`: the
  // arrangement the writer authored, read the way a page is read. What shipped
  // before was the boxes ARRAY's order — creation order — and Fable's words on
  // it bind: "an order nobody chose is an order nobody can rely on." This rail
  // is a FOURTH display of a container and may not contradict the other three.
  const byArrangement = (a: Box, b: Box) => (a.y - b.y) || (a.x - b.x);

  // PW1 S2, Q4 — TWO SECTIONS. The board's own Cards first (board-owned
  // content), then the Pages linked to this board beneath them, with page
  // titles. A page-pin is a MEMBERSHIP (item 125), which is why it reads under
  // its own heading rather than as one more card in the pile.
  const cards = allBoxes.filter((b) => b.kind !== 'page-pin').sort(byArrangement);
  const pins = allBoxes.filter((b) => b.kind === 'page-pin').sort(byArrangement);
  // PW2 S2 AMENDMENT (Nick, verbatim: "group them together but section off
  // Boards from Pages clearly and use a different thumbnail") — the memberships
  // split into two LABELLED sections under one heading. A nested board is still
  // a membership exactly as a page is (125 unchanged); what changes is that the
  // writer can see at a glance which kind they are looking at, without reading
  // a badge on every row.
  const isBoardPin = (b: Box) => getJournalEntry(b.entryId ?? '')?.pageType === 'board';
  const pagePins = pins.filter((b) => !isBoardPin(b));
  const boardPins = pins.filter(isBoardPin);

  const items: SurveyItem[] = [
    // PW2 S3 — AN ARRIVED COPY STATES ITS LINEAGE in the second-line slot:
    // `copied from <board>`. Provenance rides the built fields (FX5 S3's
    // "provenance travels on every box"), so this is a read, not a new record.
    // No badge, no colour, no count — the line is a fact, not a decoration.
    ...cards.map((b) => ({
      ...boardCardItem(b, currentEntryId),
      sectionTitle: deskTerm('cascadePlanSectionCards'),
      note: copiedFromLine(b),
    })),
    ...pagePins.map((b) => ({
      ...boardCardItem(b, currentEntryId),
      sectionTitle: deskTerm('cascadePlanSectionPages'),
      // PW1 S2 — "the built `excerpt` YIELDS to the title" (Q3), and on a
      // membership row it yields to the STATE line specifically: S3 puts that
      // state in the SECOND-LINE SLOT, and a row cannot have two second lines.
      // The page's own body text is one press away on the page itself; which
      // board it is displayed on is knowable nowhere else.
      excerpt: undefined,
      // PW1 S3 — each row states its state. ABSENCE MEANS DISPLAYED, read here
      // exactly as the canvas reads it: only an explicit `false` is "not shown".
      note: b.onCanvas === false ? deskTerm('cascadePinNotShown') : deskTerm('cascadePinShown'),
      kindShape: 'page' as const,
    })),
    // BOARDS, their own labelled section. A nested board appears HERE and
    // nowhere else — one row, one section, so the writer never has to work out
    // which list a thing is in.
    ...boardPins.map((b) => ({
      ...boardCardItem(b, currentEntryId),
      sectionTitle: deskTerm('cascadePlanSectionBoards'),
      excerpt: undefined,
      note: b.onCanvas === false ? deskTerm('cascadePinNotShown') : deskTerm('cascadePinShown'),
      kindShape: 'board' as const,
    })),
  ];

  return {
    title: kind.boardTitle,
    items,
    onTravel: (id) => {
      const box = allBoxes.find((b) => b.id === id);
      if (!box) return;
      if (box.kind === 'page-pin' && box.entryId) {
        const entry = getJournalEntry(box.entryId);
        // PW1 S4 — travel that KEEPS THE RAIL: the destination mounts with this
        // same survey open, on this same board, and the origin row wears the
        // `current` mark this builder already computes. The trail is the rail.
        if (entry) ctx.travelFromCascade(entry);
        return;
      }
      const board = getJournalEntry(kind.boardId);
      if (board) ctx.travelFromCascade(board);
    },
    // PW1 S3 — the MENU act, on the membership rows only. This is the path that
    // must be COMPLETE: the drag half needs a canvas and so exists only on a
    // board, while `Display on Board` works everywhere the row does.
    renderMenu: (item) => {
      // PW2 S3 — a CARD row carries transfer; a membership row carries display.
      const card = cards.find((b) => b.id === item.id);
      if (card) return (card.kind === 'text' || card.kind === 'ink')
        ? <CardTransferMenu boardId={kind.boardId} box={card} />
        : null;
      const box = pins.find((b) => b.id === item.id);
      if (!box || !box.entryId) return null;
      // PW2 S2/PW22 — THE TWIN. A nested board's double-click travels INTO it
      // on the canvas; the same act must ride this menu, or the gesture is the
      // only path and the keyboard and the unfamiliar hand lose their way in.
      // A page membership gets no such row: pressing its row already travels.
      const nested = getJournalEntry(box.entryId);
      return (
        <>
          {nested?.pageType === 'board' && (
            <button type="button" className="wz-cascade-thumb-menu-item wz-cascade-open-board"
              onClick={() => ctx.travelFromCascade(nested)}>{deskTerm('cascadeOpenBoard')}</button>
          )}
          <PinDisplayMenu boardId={kind.boardId} entryId={box.entryId} displayed={box.onCanvas !== false} />
        </>
      );
    },
    // PW1 S3 — the DRAG half (Nick, Q4): drag a membership row onto the canvas
    // and it lands WHERE DROPPED. Only membership rows are draggable (a card is
    // already on the wall), and the payload names BOTH the board and the box so
    // the canvas can refuse a drop from some OTHER board's survey — moving a
    // card between boards is card transfer (item 123), not display, and this
    // act must not quietly become it.
    dragPayload: (item) => {
      const box = pins.find((b) => b.id === item.id);
      return box && box.entryId ? `${kind.boardId}:${box.entryId}` : null;
    },
    // PW1 S1/S5 — the `‹` walks back to the LIST, and the list is now the panel
    // (PW3). It used to open a second survey of the drawer's own boards; there
    // is no such layer any more, so this closes one instead. "The survey's `‹`
    // is always the way back to the list" holds — the list simply moved up.
    onBack: () => ctx.closeSurvey(),
  };
}


// PW2 S3 (item 123) — CARD TRANSFER's menu, on the row it belongs to.
//
// THE VERBS TEACH THE KIND (CA1), and the canon does the sorting — which is
// why this is a per-kind decision and not one verb with a disabled state:
//   free / text card → `Copy to <board>…`  — board-owned CONTENT; a copy is a
//                                            new card owned where it lands
//   page-pin         → no copy verb        — MEMBERSHIP, not content. "Copying"
//                                            it is just a second membership,
//                                            which the Places checkbox makes
//   board-card       → no copy verb        — membership too
// An absent verb says "this is not that kind of thing" more cleanly than a
// greyed one, and PP4 holds: a quiet disclosure is not a competing act.
// PW2 S3 — the lineage line for a copied card, or undefined for one that was
// authored here. `sourceEntryId` names the board it came FROM.
function copiedFromLine(box: Box): string | undefined {
  // Reads `copiedFromBoardId`, never the mirror fields — TEXT ONLY, no travel
  // from this line in PW2; a door here is a later refinement (ruled).
  if (!box.copiedFromBoardId) return undefined;
  const from = getJournalEntry(box.copiedFromBoardId);
  if (!from || from.pageType !== 'board') return undefined;
  return `${deskTerm('cascadeCardCopiedFrom')} ${boardTitle(from)}`;
}

function CardTransferMenu({ boardId, box }: { boardId: string; box: Box }) {
  const { t } = useDeskLexicon();
  const [pickerOpen, setPickerOpen] = useState(false);
  // ITEM 123's INVARIANT, RENDERED RATHER THAN MERELY ENFORCED: "every card
  // keeps >= 1 board". A board-owned card belongs to exactly one board, so
  // removing it from this one would leave it with none — the verb is therefore
  // PRESENT, INERT, AND SAYS WHY, the same refusal grammar S1 uses for a
  // descendant and PW1 used for its inert Unlink. Absence would make the writer
  // hunt for a removal that is not missing, only refused.
  return (
    <>
      <button type="button" className="wz-cascade-thumb-menu-item wz-cascade-copy-card" onClick={() => setPickerOpen(true)}>
        {t('cascadeCardCopyTo')}
      </button>
      <button type="button" className="wz-cascade-thumb-menu-item wz-cascade-inert" aria-disabled="true" disabled
        title={t('cascadeCardOnlyBoard')}>
        {t('cascadeCardRemove')} <span className="wz-cascade-inert-why">{t('cascadeCardOnlyBoard')}</span>
      </button>
      {pickerOpen && (
        <PinToBoardSheet
          entryId={boardId}
          title={t('cascadeCardCopyTitle')}
          // ITEM word-diet (Nick, Oct 13) — the copy-note moves behind a
          // "?", one plain sentence, beside the sheet's own title.
          note={<DrawerNote label="About copying">{t('cascadeCardCopyNote')}</DrawerNote>}
          onChoose={(targetBoardId) => { copyCardToBoard(boardId, box.id, targetBoardId); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

// PW1 S3 (item 125) — the two display acts, menu half (Nick, Q4). Membership is
// made elsewhere (the Places checkbox); this only ever moves an EXISTING
// membership on and off the canvas, which is why there is no "unlink" here and
// why removing display never removes the member.
function PinDisplayMenu({ boardId, entryId, displayed }: { boardId: string; entryId: string; displayed: boolean }) {
  const { t } = useDeskLexicon();
  return (
    <button
      type="button"
      className="wz-cascade-thumb-menu-item wz-cascade-pin-display"
      onClick={() => setPinDisplayed(boardId, entryId, !displayed)}
    >
      {displayed ? t('cascadePinHide') : t('cascadePinDisplay')}
    </button>
  );
}
