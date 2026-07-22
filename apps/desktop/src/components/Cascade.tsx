import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { CascadeSurvey } from './CascadeSurvey';
import { renderCategoryPanel, buildSurvey, type CategoryId, type CascadeSurveyKind, type CascadeContext } from './CascadePanels';
import type { PageFaceSubject } from './PageFace';
import type { Project } from '../types';

// CD2 — the Cascade (docs/wrizo-alpha/cd2-cascade-brief.md), replacing the
// AB3 Drawer whole (S5: "the left drawer retires ... the cascade replaces
// it in place"). Architecture in one paragraph: the STRIP (S1) is
// architecturally like the OLD toolRail — a DeskFrame grid track, always
// present, never dissolving. Layers 2-3 (S2's reach panel + survey) are
// architecturally like the sliver — stage OVERLAYS, anchored off the
// paper's own canonical measure via CSS, never a grid track, so the
// paper's rect is structurally immune to them regardless of state. This
// file owns the ONE shared piece of state driving both (`useCascade`),
// since DeskFrame renders the strip and the layers in two different places
// in its own tree (a grid `<aside>` vs. a stage overlay `<div>`) — there is
// no single shared DOM ancestor to hang one local component's state off
// of, so a hook returning two independent ReactNode outputs (rather than
// two components each owning half the state, which would need React
// Context or a second pub-sub store to stay in sync) is the natural shape.
//
// Dissolve (S2: "the one vanishing engine"): layers 2-3 do NOT carry
// chrome-fade/desk-dissolve (DeskFrame.tsx's own header comment explains
// why) — they dissolve via an EXPLICIT keydown listener that resets
// `category`/`survey` to closed, the exact precedent AB3's own Drawer.tsx
// established for its own Place-face content ("a keystroke dissolves the
// face with the room, same instinct as the rest of the vanishing law").
// This is a generalization of that one proven mechanism, not a second
// implementation — the ambient opacity-fade class family is for PERSISTENT
// chrome that dims-then-returns (the strip, correctly, never wears it,
// since S1 makes it never-dissolving in the first place); a reach panel
// that should vanish outright and stay closed until reopened was already
// handled the state-reset way, before this ticket existed.
//
// The dock (S2's own addition, T5 in the canon's third ratification
// record): layer 2 carries a quiet close button. Clicking it while a
// survey is open DOCKS the survey (panel visually collapses to width:0 via
// CSS transition — see index.css's `.wz-cascade-panel[data-visible=false]`
// — while staying mounted, so rapid dock/undock clicks never race an
// unmount); with no survey open, the same button just closes everything.
// The strip's own category button click is OVERLOADED for undocking too:
// clicking the SAME already-open category while docked restores the panel
// (S2: "reopening the category slides the panel back in and the survey
// back out one slot") instead of the ordinary toggle-closed behavior.

const DOCK_FLOOR_PX = 120;

interface CascadeState {
  category: CategoryId | null;
  survey: CascadeSurveyKind | null;
  docked: boolean;
}
const REST: CascadeState = { category: null, survey: null, docked: false };

export interface CascadeProps {
  subject: PageFaceSubject;
  project: Project | null;
  navigate: NavigateFunction;
}

interface CategorySpec { id: CategoryId; labelTerm: DeskTermId; icon: ReactNode }

const SECTION_A: CategorySpec[] = [{ id: 'journal', labelTerm: 'drawerPlaceJournal', icon: <JournalIcon /> }];
const SECTION_B: CategorySpec[] = [
  { id: 'page', labelTerm: 'drawerPage', icon: <PageIcon /> },
  { id: 'plan', labelTerm: 'stripPlan', icon: <PlanIcon /> },
];
// B1 S5 (superseded by Nick's own placement) — the Trash NO LONGER lives in
// section C; it now sits at the very foot of the strip (SECTION_TRASH below),
// the last place of all, a thin line above it. Section C keeps the two
// browsing places (Drawers, Shelf), a separator below Shelf closing them off.
const SECTION_C: CategorySpec[] = [
  { id: 'drawers', labelTerm: 'drawerPlaceDrawers', icon: <DrawersIcon /> },
  { id: 'shelf', labelTerm: 'drawerPlaceShelf', icon: <ShelfIcon /> },
];
const SECTION_D: CategorySpec[] = [
  { id: 'settings', labelTerm: 'stripSettings', icon: <SettingsIcon /> },
  { id: 'theme', labelTerm: 'stripChangeTheme', icon: <ThemeIcon /> },
];
// The Trash is the very last place: pinned to the strip's foot, below
// Settings/Themes and a thin dividing line — "reachable, never prominent"
// (B1's own wording), now literally out of the way at the bottom of the
// screen. Same strip-item chrome as every other category (no badge, no
// color, no size marking it out).
const SECTION_TRASH: CategorySpec[] = [
  { id: 'trash', labelTerm: 'drawerPlaceTrash', icon: <TrashIcon /> },
];

function panelTitleTerm(category: CategoryId): DeskTermId {
  switch (category) {
    case 'journal': return 'drawerPlaceJournal';
    case 'page': return 'drawerPage';
    case 'plan': return 'stripPlan';
    case 'drawers': return 'drawerPlaceDrawers';
    case 'shelf': return 'drawerPlaceShelf';
    case 'trash': return 'drawerPlaceTrash';
    case 'settings': return 'cascadeSettingsTitle';
    case 'theme': return 'cascadeThemeTitle';
  }
}

// The margin genuinely available before the paper — measured off the REAL
// rendered rects, not read back from index.css's own --cascade-margin via
// getComputedStyle: Chromium does not resolve a custom property containing
// calc()/min()/percentages to a pixel value at getComputedStyle time — it
// returns the literal unresolved formula string (confirmed empirically
// against the live harness, this project's own "verify, don't just read
// the CSS" standing discipline — parseFloat("calc(50% - ...)") is NaN,
// which would have made this always fail permissive and silently never
// enforce the dock floor at all). The stage/paper rects encode the exact
// same relationship the CSS formula describes (paper is centered in the
// stage; the anchor may additionally use the grid's own column-gap, which
// nothing else paints in), so re-deriving it from measured geometry is
// both correct and immune to the resolution gap. `.mode-pagecol` covers
// both prose and screenplay (FX1 S2 put script on the same geometry
// class); `.entry-full` covers JournalEntry's own distinct paper class.
// Infinity (permissive) if nothing is mounted yet — the dock floor is a
// courtesy guard, not the hard paper-never-reflows law, so failing OPEN
// (never silently blocking a legitimate dock) is the safer default.
function availableCascadeMargin(): number {
  if (typeof document === 'undefined') return Infinity;
  const stage = document.querySelector('.desk-frame-stage');
  const paper = document.querySelector('.mode-pagecol, .entry-full');
  if (!stage || !paper) return Infinity;
  const stageRect = stage.getBoundingClientRect();
  const paperRect = paper.getBoundingClientRect();
  const frameGapRaw = getComputedStyle(document.documentElement).getPropertyValue('--frame-gap').trim();
  const frameGap = parseFloat(frameGapRaw);
  const gap = Number.isFinite(frameGap) ? frameGap : 0;
  return (paperRect.left - stageRect.left) + gap;
}

export function useCascade({ subject, project, navigate }: CascadeProps): { strip: ReactNode; layers: ReactNode } {
  const { t } = useDeskLexicon();
  const [state, setState] = useState<CascadeState>(REST);
  const currentEntryId = subject.entry.id;

  const toggleCategory = (id: CategoryId) => {
    setState((s) => {
      if (s.category === id) {
        // S2: reopening the SAME category while docked restores the panel
        // (undock), rather than the ordinary toggle-closed behavior.
        if (s.docked) return { ...s, docked: false };
        return REST;
      }
      // A category switch dismisses a docked survey (the vanishing-law
      // rider's own words: "dismissed only by explicit close, category
      // switch, or Escape").
      return { category: id, survey: null, docked: false };
    });
  };

  const openSurvey = (kind: CascadeSurveyKind) => setState((s) => ({ ...s, survey: kind, docked: false }));

  const closePanel = () => {
    setState((s) => {
      if (!s.category) return s;
      if (s.survey && availableCascadeMargin() >= DOCK_FLOOR_PX) return { ...s, docked: true };
      return REST; // nothing to dock, or the dock affordance is unavailable below the floor
    });
  };

  const dismissSurvey = () => setState(REST);

  const onEscape = () => {
    setState((s) => {
      if (!s.category) return s;
      if (s.docked) return REST; // Escape dismisses a docked survey too
      if (s.survey) return { ...s, survey: null }; // walk back one layer: survey -> panel
      return REST; // walk back one layer: panel -> strip
    });
  };

  // Dissolve on keystroke — see this file's own header comment for why this
  // is a keydown-reset, not the ambient chrome-fade class. Query-based
  // "did this originate inside the cascade's own DOM" check (not a ref)
  // because the strip and the layers are two SEPARATE ReactNode outputs
  // DeskFrame mounts in two different places — there is no one shared
  // wrapping element to attach a single ref to.
  useEffect(() => {
    if (state.category === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.wz-strip, .desk-frame-cascade-anchor')) return;
      if (e.key === 'Escape') { onEscape(); return; }
      if (state.docked) return; // a docked survey survives keystrokes
      setState(REST);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.category, state.docked, state.survey]);

  const ctx: CascadeContext = { subject, project, navigate, openSurvey };

  const strip = (
    <div className="wz-strip">
      {renderSection(SECTION_A, state, toggleCategory, t)}
      <div className="wz-strip-sep" role="separator" aria-orientation="horizontal" />
      {renderSection(SECTION_B, state, toggleCategory, t)}
      <div className="wz-strip-sep" role="separator" aria-orientation="horizontal" />
      {renderSection(SECTION_C, state, toggleCategory, t)}
      {/* the separator below Shelf, closing off the browsing places */}
      <div className="wz-strip-sep" role="separator" aria-orientation="horizontal" />
      <div className="wz-strip-foot">
        {renderSection(SECTION_D, state, toggleCategory, t)}
        {/* the thin line just above the Trash at the very foot */}
        <div className="wz-strip-sep" role="separator" aria-orientation="horizontal" />
        {renderSection(SECTION_TRASH, state, toggleCategory, t)}
      </div>
    </div>
  );

  const layers = state.category === null ? null : (
    <>
      <div className="wz-cascade-panel" data-visible={state.docked ? 'false' : 'true'}>
        <div className="wz-cascade-panel-head">
          <span className="wz-cascade-panel-title">{t(panelTitleTerm(state.category))}</span>
          <button
            type="button"
            className="wz-cascade-dock-btn"
            aria-label={state.survey ? t('cascadeDockClose') : 'Close'}
            onClick={closePanel}
          >
            ×
          </button>
        </div>
        {renderCategoryPanel(state.category, ctx)}
      </div>
      {state.survey && (
        <CascadeSurvey
          {...buildSurvey(state.survey, ctx, currentEntryId)}
          docked={state.docked}
          onDismiss={dismissSurvey}
        />
      )}
    </>
  );

  return { strip, layers };
}

function renderSection(
  items: CategorySpec[],
  state: CascadeState,
  toggle: (id: CategoryId) => void,
  t: (id: DeskTermId) => string,
): ReactNode {
  return (
    <div className="wz-strip-section">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`wz-strip-item${state.category === item.id ? ' active' : ''}`}
          aria-pressed={state.category === item.id}
          onClick={() => toggle(item.id)}
        >
          <span className="wz-strip-glyph" aria-hidden="true">{item.icon}</span>
          <span className="wz-strip-label">{t(item.labelTerm)}</span>
        </button>
      ))}
    </div>
  );
}

// Quiet stroke icons, matching Sliver.tsx's own InstrumentsIcon/ModeStage's
// GearIcon style (viewBox 0 0 24 24, stroke=currentColor). Settings gets a
// DELIBERATELY different glyph from the sliver-foot's own GearIcon (S1:
// "distinct by law from the sliver-foot gear") — a plain account circle,
// not a gear, so the two settings surfaces never look like the same door.
function JournalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16.5A1.5 1.5 0 0 1 17.5 21H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H19" />
    </svg>
  );
}
function PageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h8" />
    </svg>
  );
}
function PlanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="2.3" />
      <circle cx="18" cy="6" r="2.3" />
      <circle cx="12" cy="18" r="2.3" />
      <path d="M7.9 7.4 10.3 16M16.1 7.4 13.7 16M8.3 6h7.4" />
    </svg>
  );
}
function DrawersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="8" rx="1" />
      <rect x="4" y="13" width="16" height="8" rx="1" />
      <path d="M10 7h4M10 17h4" />
    </svg>
  );
}
function ShelfIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4v16M20 4v16M4 12h16" />
      <path d="M7 4v8M11 4v8M15 4v8M17 4v8" />
    </svg>
  );
}
// B1 S5 — a plain outline trash can, matching the strip's own quiet-stroke
// icon style exactly (viewBox 0 0 24 24, stroke=currentColor) — nothing
// about it reads as an alert or a warning; it's a place, like the others.
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 7h14" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
  );
}
function ThemeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2H17a4 4 0 0 0 4-4c0-4.4-4-7.4-9-7.4Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
