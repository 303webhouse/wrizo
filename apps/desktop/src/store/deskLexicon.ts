import { useEffect, useState } from 'react';
import { useTheme, type ThemeId } from './theme';

// AB1 S5 — the strings-as-theme-vocabulary seam. Every user-facing zone /
// module / mode name DeskFrame introduces, centralized in one flat map keyed
// by DeskTermId, exactly the projection shape store/themeLexicon.ts already
// proved out (a theme overrides only the terms it wants; everything else
// falls through to Plateau's canonical string). Deliberately a SIBLING file,
// not an extension of themeLexicon.ts's own TermId union: that module's
// 'freewrite' term is byte-pinned (its own header comment) to the legacy
// lowercase-w "Free write" used by ModeSwitcher/JournalEntry's tab, which
// AB1 does not touch; the new frame's ratified strings are exact title case
// ("Free Write") and belong to a different seam so the two casings never
// collide at the same TermId. No theme machinery beyond the map itself is
// built here — Nick's ruling that "Journal" is specifically Plateau's name
// for the capture module (not a universal constant) is why the corkboard's
// capture-tab label lives in THIS seam and not as a hardcoded string.
export type DeskTermId =
  | 'modeFreeWrite' | 'modeDraft' | 'modeRevise' | 'modeWorkshop' | 'modePublish'
  // CD2 S5 — 'zoneToolRail' (the old fixed drawer track's aria-label) is
  // renamed to 'zoneStrip' here in step with the track's own retirement:
  // DeskFrame's first grid column now holds the cascade's strip, not a
  // tool-rail, and no other file referenced the old id (confirmed by grep).
  | 'zoneWayfinding' | 'zoneStrip' | 'zoneStage' | 'zoneCorkboard' | 'zoneMeter'
  | 'corkboardJournalTab' | 'deskMenuGlyph'
  // AB2 — the hand-tools' own labels, born on AB2's ToolRail.tsx (now
  // components/Sliver.tsx, CD1 S2/S7 — ToolRail itself retired, these ids
  // did not). New user-facing strings this ticket introduces land in this
  // seam per the AB1 review's ratified naming, not a second lexicon file.
  | 'railInk' | 'railControls' | 'railForwardLock' | 'railReading' | 'railTypewriter'
  | 'railFormat' | 'railStructure' | 'railStructureProse' | 'railStructureScreenplay'
  // CD1 S2/S6 — the sliver's goal block (components/Sliver.tsx's foot). The
  // sliver's own keyboard shortcut (Ctrl/Cmd+/, SLIVER_SHORTCUT_LABEL in
  // that file) is a chord constant, not user-facing prose, so it does NOT
  // ride this lexicon seam — only its surrounding strings do.
  | 'goalEdit' | 'goalLabel' | 'goalUnitLines' | 'goalSet' | 'goalClear'
  | 'sliverOpen' | 'sliverClose'
  // FX3 S5 — the sliver foot's new instruments row (components/Sliver.tsx's
  // SliverInstrumentRow). Only the row/section-level labels ride this seam,
  // matching the existing railInk/railControls/railReading precedent above;
  // the terse Seg OPTION strings themselves ('On'/'Off'/'Lines'/'Words'/
  // 'Time') follow ModeStage.tsx's own SettingsPanel/ThemePanel precedent
  // (already hardcoded inline there, pre-FX3) rather than adding a new key
  // per option.
  | 'sliverInstruments' | 'sliverInstrumentsShow' | 'sliverInstrumentsUnit'
  // AB3 — the Drawer's own nav pulls (components/Drawer.tsx, RETIRED whole
  // by CD2 S5 — the left drawer's estate moves to the cascade strip). These
  // four term ids survive their original component: CD2's Strip.tsx reuses
  // them VERBATIM as the strip's own Journal/Page/Shelf/Drawers section
  // labels (canon A11's roster uses the same words), rather than mint
  // duplicate strings for the same vocabulary.
  | 'drawerPage' | 'drawerPlaceJournal' | 'drawerPlaceShelf' | 'drawerPlaceDrawers'
  // AB3 S2 — the Page face (components/PageFace.tsx).
  | 'pageFaceStar' | 'pageFaceStarred' | 'pageFaceAddTag' | 'pageFaceAdd'
  | 'pageFaceMoveCopy' | 'pageFacePortToBoard'
  // AB4 S2 — Pin, the fourth sending verb (membership, not capture) + its
  // truthful membership-line prefix ("<prefix> <board>." — the board's own
  // title is interpolated at the call site, store/pageHome.ts).
  | 'pageFacePin' | 'pageFacePinnedTo'
  // AB3 S6 — the Places faces (components/PlaceFace.tsx, RETIRED whole by
  // CD2 S5 alongside Drawer.tsx, its only mount site). CD2's own ratified
  // S3 spec for Journal/Drawers/Shelf turned out simpler than PlaceFace's
  // old three-verb-per-item rows (no File/Send or Peek anywhere in the
  // cascade's panels — a documented build call, see the CD2 build report):
  // the cascade's own list rows carry only title + click-to-travel. Only
  // 'placeFaceEmpty' is reused (the cascade's own empty-list wording);
  // the other three ids are orphaned vocabulary, left in place rather than
  // pruned (house precedent: 'zoneWayfinding' similarly outlived
  // DeskRail's own CD1 framed retirement without a lexicon cleanup pass).
  | 'placeFaceOpen' | 'placeFaceFileSend' | 'placeFacePeek' | 'placeFacePeekSoon'
  | 'placeFaceGoToRoom' | 'placeFaceEmpty'
  // CD2 S1 — the strip's own remaining roster labels (A11): Plan joins Page
  // in section B; Settings and Change Theme are the new foot section D.
  | 'stripPlan' | 'stripSettings' | 'stripChangeTheme'
  // CD2 S3 — category panel bodies (layer 2), one seam per category. Panels
  // that carry forward whole content (Page -> PageFace, Journal/Drawers/
  // Shelf -> PlaceFace-style rows) reuse the ids above; these are the NEW
  // strings CD2 itself introduces.
  | 'cascadeJournalOpen' | 'cascadeJournalNewPage' | 'cascadeJournalRecent' | 'cascadeJournalAll'
  | 'cascadePlanCreateBoard' | 'cascadePlanPlotStory' | 'cascadePlanOpen' | 'cascadePlanEmpty'
  | 'cascadePlanNoProject' | 'cascadeBoardMove' | 'cascadeBoardDelete' | 'cascadeBoardDeleteConfirm'
  | 'cascadeBoardDeleteCancel' | 'cascadeBoardDeleteQuestion'
  | 'cascadeDrawersChoose' | 'cascadeDrawersEmpty'
  | 'cascadeShelfBrowse' | 'cascadeSettingsTitle' | 'cascadeSettingsSignOut'
  | 'cascadeThemeTitle'
  // CD2 S2/S4 — the survey layer + the dock.
  | 'cascadeSurveyEmpty' | 'cascadeSurveyCurrent' | 'cascadeDockClose' | 'cascadeDockReopen'
  // AB4 S1 — the CD2 erratum comes true: picking a board in the Plan survey
  // swaps the column to that board's cards, with a quiet back affordance to
  // the board list (the ONLY new survey-chrome string this ticket adds; the
  // cards themselves reuse the existing thumbnail/title/excerpt vocabulary).
  | 'cascadeSurveyBack'
  // AB4 S5 — the board sliver's own hand tool(s). FX4 S6 — 'boardConnect'
  // (the Connect toggle's own label) retires along with the toggle itself
  // (replaced by BoardEditor.tsx's own handle-drag gesture) — removed
  // outright rather than parked: a lexicon string isn't a check with a
  // pass/fail history worth preserving, unlike ab4.mjs's own harness
  // checks (see fx4.mjs's PARKED section for those).
  | 'railBoard' | 'boardAddCard';

const CANONICAL: Record<DeskTermId, string> = {
  modeFreeWrite: 'Free Write',
  modeDraft: 'Draft',
  modeRevise: 'Revise',
  modeWorkshop: 'Workshop',
  modePublish: 'Publish',
  zoneWayfinding: 'Wayfinding',
  zoneStrip: 'Strip',
  zoneStage: 'Page',
  zoneCorkboard: 'Corkboard',
  zoneMeter: 'Meter',
  corkboardJournalTab: 'Journal',
  deskMenuGlyph: 'Desk menu',
  railInk: 'Ink',
  railControls: 'Controls',
  railForwardLock: 'Forward lock',
  railReading: 'Reading',
  railTypewriter: 'Typewriter',
  railFormat: 'Format',
  railStructure: 'Structure',
  railStructureProse: 'Prose',
  railStructureScreenplay: 'Screenplay',
  drawerPage: 'Page',
  drawerPlaceJournal: 'Journal',
  drawerPlaceShelf: 'Shelf',
  drawerPlaceDrawers: 'Drawers',
  pageFaceStar: 'Star',
  pageFaceStarred: 'Starred',
  pageFaceAddTag: 'Add a tag',
  pageFaceAdd: 'Add',
  pageFaceMoveCopy: 'Move to… / Copy to…',
  pageFacePortToBoard: 'Port to a Board…',
  pageFacePin: 'Pin to a Board…',
  pageFacePinnedTo: 'Also pinned to',
  placeFaceOpen: 'Open',
  placeFaceFileSend: 'File/Send',
  placeFacePeek: 'Peek',
  placeFacePeekSoon: 'Peek — coming soon',
  placeFaceGoToRoom: 'Go to the Room',
  placeFaceEmpty: 'Nothing here yet.',
  goalEdit: 'Set a goal',
  goalLabel: 'Goal',
  goalUnitLines: 'lines',
  goalSet: 'Set',
  goalClear: 'Clear',
  sliverOpen: 'Open hand tools',
  sliverClose: 'Close hand tools',
  sliverInstruments: 'Instruments',
  sliverInstrumentsShow: 'Show',
  sliverInstrumentsUnit: 'Unit',
  stripPlan: 'Plan',
  stripSettings: 'Settings',
  stripChangeTheme: 'Change Theme',
  cascadeJournalOpen: 'Open the Journal',
  cascadeJournalNewPage: 'New page',
  cascadeJournalRecent: 'Recent',
  cascadeJournalAll: 'All pages →',
  cascadePlanCreateBoard: 'Create a Board',
  cascadePlanPlotStory: 'Plot a Story',
  cascadePlanOpen: 'Open…',
  cascadePlanEmpty: 'No boards yet.',
  cascadePlanNoProject: 'File this page to a project first to plan around it.',
  cascadeBoardMove: 'Move to… / Copy to…',
  cascadeBoardDelete: 'Delete',
  cascadeBoardDeleteConfirm: 'Delete',
  cascadeBoardDeleteCancel: 'Cancel',
  cascadeBoardDeleteQuestion: 'Delete this board? This cannot be undone.',
  cascadeDrawersChoose: 'Choose a drawer to see what’s filed inside.',
  cascadeDrawersEmpty: 'No drawers yet.',
  cascadeShelfBrowse: 'Browse the Shelf →',
  cascadeSettingsTitle: 'Settings',
  cascadeSettingsSignOut: 'Sign out',
  cascadeThemeTitle: 'Theme',
  cascadeSurveyEmpty: 'Nothing here yet.',
  cascadeSurveyCurrent: 'Current',
  cascadeDockClose: 'Close, keep browsing',
  cascadeDockReopen: 'Reopen',
  cascadeSurveyBack: 'Back',
  railBoard: 'Board',
  boardAddCard: 'Add card',
};

// Flux registers its own capture-module name (the app's other live theme
// already renames the same module 'Log' over in themeLexicon.ts's 'journal'
// term) — kept in step here so the two seams never visibly disagree under
// the same theme, even though they're independent maps.
const OVERRIDES: Partial<Record<ThemeId, Partial<Record<DeskTermId, string>>>> = {
  flux: {
    corkboardJournalTab: 'Log',
    // AB3 — the Places face's Journal pull, kept in step with the corkboard
    // tab's own Flux name so the two seams never visibly disagree.
    drawerPlaceJournal: 'Log',
  },
};

function resolveTheme(theme: ThemeId | undefined): ThemeId {
  if (theme) return theme;
  if (typeof document === 'undefined') return 'plateau';
  return (document.documentElement.getAttribute('data-theme') as ThemeId | null) ?? 'plateau';
}

export function deskTerm(term: DeskTermId, theme?: ThemeId): string {
  const resolved = resolveTheme(theme);
  return OVERRIDES[resolved]?.[term] ?? CANONICAL[term];
}

export function useDeskLexicon(): { t: (term: DeskTermId) => string } {
  const theme = useTheme();
  const [, setTick] = useState(0);
  useEffect(() => { setTick(n => n + 1); }, [theme]);
  return { t: (term: DeskTermId) => deskTerm(term, theme) };
}

// Test/inspection seam (the resumeVocab.ts / wrizoLexicon pattern).
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoDeskLexicon?: unknown }).wrizoDeskLexicon = {
    t: deskTerm, CANONICAL_TERMS: Object.keys(CANONICAL),
  };
}
