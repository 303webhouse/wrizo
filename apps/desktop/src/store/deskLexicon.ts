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
  | 'railBoard' | 'boardAddCard'
  // FX5 S3 — a ported page's card face shows a bounded notecard excerpt now
  // (the content-minimum trap's own fix — see BoardEditor.tsx's header
  // comment), not the full raw text; a quiet badge names what it is, and a
  // selected one gets an explicit way to reach its own full-text editor
  // (double-click travels to the source instead, matching page-pin).
  | 'boardPortedBadge' | 'boardEditCopy'
  // FX5 S4 — the quiet layer-order icon (existing z field; front/back),
  // appearing only on a selected card that's genuinely overlapping another.
  | 'boardLayerBringFront' | 'boardLayerSendBack'
  // FX5 S5 — the olive pin (the connection grab, replacing the dead
  // handle-double-click gesture whole) + the footer line/toggle threads
  // render as.
  | 'boardThreadGrab' | 'boardThreadPrefix' | 'boardThreadUntitled' | 'boardFooterToggle'
  // TU1 S2/S3/S4/S5 — the Tutor (components/Tutor.tsx), the sliver's own
  // mirror on the paper's right edge. One seam, all of the Tutor's static
  // chrome — the lenses' own DYNAMIC observation text (Consistency's
  // "X / Y both appear.", Structure's home/membership lines, nudge
  // sentences) is composed in code from real page data and cannot be a
  // flat lexicon lookup; only the surrounding labels/disclosures live here.
  | 'tutorOpen' | 'tutorClose' | 'tutorTitle'
  | 'tutorDockClose' | 'tutorDockReopen'
  | 'tutorLensConsistency' | 'tutorLensStructure' | 'tutorLensFragments'
  | 'tutorLensConsistencyEmpty' | 'tutorLensFragmentsEmpty' | 'tutorLensFragmentsNote'
  | 'tutorStructureNoBeat'
  | 'tutorNudgesTitle' | 'tutorNudgesEmpty'
  | 'tutorConversationTitle' | 'tutorConversationPlaceholder' | 'tutorConversationSend'
  | 'tutorConversationEmpty' | 'tutorConversationSending'
  | 'tutorConversationOffline' | 'tutorConversationError'
  | 'tutorDisclosureTitle' | 'tutorDisclosureBody' | 'tutorDisclosureAck'
  // FX6 S2 — the doors. (a) The cascade's Page section (CascadePanels.tsx's
  // PagePanel) gains an unmissable "New Page" action at its head —
  // 'cascadePageNewPage' — a SEPARATE door from the pre-existing Journal-
  // category one (cascadeJournalNewPage above); 'cascadePlanJustAPage' is
  // the quiet one-line pointer at it from the Plan panel's no-project
  // branch (S2c). (b) The Board's own hand tools (Sliver.tsx's 'board'
  // section) gain a second tool alongside the existing Add card
  // ('boardNewPageCard'): a real page, created AND pinned to this board in
  // one act. 'boardCanvasEmpty' is the empty board's own quiet one-line
  // pointer at both board-side tools (S2c).
  | 'cascadePageNewPage' | 'cascadePlanJustAPage' | 'boardNewPageCard' | 'boardCanvasEmpty'
  // B1 — the Journal Reborn (+ the Trash). 'drawerPlaceTrash' names the
  // Trash Board — the SAME "one term, every surface" shape
  // 'drawerPlaceJournal' already carries (the cascade's own section-C entry,
  // the system Board's own seeded title). 'cascadeTrashOpen' is the Trash
  // category's own single action (the brief's own "reachable, never
  // prominent, no count" law — one plain button, nothing else). 'boardRestore'
  // is the Trash Board's own selected-card action (S4, the FX5 action-row
  // precedent) — a plain button; clears deletedAt, nothing more.
  // Independent review fix (2026-07-19) — a genuine defect: describePageHome
  // (pageHome.ts, "'Where it lives,' told truthfully") had never heard of
  // origin:'system', so BOTH system Boards fell through to its generic
  // else-branch and reported "In the Journal" as their own home — flatly
  // false for the Trash Board (S1: "System Boards ... have no project
  // home"), and self-referential nonsense for the Journal Board. Verified
  // live before this fix: standing on the Trash Board and opening its own
  // Page category panel showed "In the Journal" as the home label.
  // 'boardHomeLabelJournal'/'boardHomeLabelTrash' are the truthful
  // replacements, named per system Board kind (BoardEditor.tsx's own
  // post-describePageHome override, scoped to system Boards only —
  // pageHome.ts itself, and every ordinary page's home label, is untouched).
  | 'drawerPlaceTrash' | 'cascadeTrashOpen' | 'boardRestore'
  | 'boardHomeLabelJournal' | 'boardHomeLabelTrash'
  // B2 S1/S2 — the Shelf Board (the third system Board, B1's own laws
  // reused by the same code paths). 'boardHomeLabelShelf' joins the
  // Journal/Trash pair above; 'shelfBoardEmpty' is the Shelf's own quiet
  // one-line empty state (S2's own words — "one quiet fact," not the
  // ordinary board's tool-naming empty line, which would name tools the
  // Shelf structurally never has). 'boardPinToBoard' is the Shelf's own
  // selected-card action (reuses PinToBoardSheet verbatim; the label
  // mirrors 'pageFacePin' — same verb, a second doorway to it).
  | 'boardHomeLabelShelf' | 'shelfBoardEmpty' | 'cascadeShelfOpen'
  // B2 S5 — the Page pop-out's roster gains its own "New Journal Entry"
  // action (distinct string from the Journal category's own pre-existing
  // 'cascadeJournalNewPage' — same underlying door, a second entry point
  // named the way Nick's own sketch named it). The Board's own Add flow
  // gains "Existing page…" beside FX6's New page card.
  | 'cascadePageNewJournalEntry' | 'boardAddExistingPage'
  // B2 S4 — the Places panel: a Home zone (single-select) + a Boards zone
  // (true checkboxes), superseding the old "Add to…" Moves flow's single-
  // page doorway from the Page pop-out (A16 verbatim: checkboxes write
  // ONLY membership; only the Home zone's own explicit act writes
  // projectId; nothing ever writes origin).
  | 'placesTitle' | 'placesHomeZoneLabel' | 'placesLoose'
  | 'placesNewDrawer' | 'placesNewDrawerPlaceholder' | 'placesNewDrawerCreate' | 'placesNewDrawerCancel'
  | 'placesBoardsTitle' | 'placesBoardsZoneLabel' | 'placesBoardsEmpty'
  // B2 S7 — the Drawers panel (A17's chrome): a large-tile cascade panel,
  // never a route. Tiles carry a title + an abstract kind mark only (no
  // counts/badges/timestamps) — 'drawersKindBoard'/'drawersKindDoc' name
  // the mark for assistive tech (aria-label), not visible text.
  // 'drawersLooseGroup' labels the loose-docs cluster; the Shelf's own
  // first tile and each project's own cluster header both read their OWN
  // title (a proper noun — not lexicon vocabulary).
  | 'drawersKindBoard' | 'drawersKindDoc' | 'drawersLooseGroup'
  // B2.1 S6 — the word swap (Nick's word, 2026-07-20: "retire the word
  // project as having any unique architectural purpose"). These terms are
  // the NEW strings this fold routes through the lexicon (every literal
  // this fold touches that wasn't already lexicon-routed); the pre-
  // existing 'cascadePlanNoProject'/'boardHomeLabelJournal'/
  // 'boardHomeLabelTrash'/'boardHomeLabelShelf' entries above keep their
  // KEY names (internal identifiers, not writer-facing — same "don't
  // rename code internals" spirit the brief applies to storage) but have
  // their STRING VALUES updated below. Files that already had their OWN
  // established themeLexicon convention for this entity (ImportDraft.tsx,
  // DrawersTree.tsx, PinToBoardSheet.tsx, PortToBoardSheet.tsx — all reuse
  // the pre-existing 'binder' term instead, see the build report's
  // Binder-vs-Drawer judgment) do NOT gain new terms here — only files
  // with no established local convention (or whose established
  // convention is deskLexicon itself, per AB1 S5's own scoping) do.
  //
  // Review fix (independent re-verification) — QuickSprint.tsx moved from
  // the "reuse themeLexicon 'binder'" list to THIS list: the build's own
  // collision reasoning for that file didn't hold (its breadcrumb shows a
  // PROPER NOUN, `drawer.name`, never the bare word "Drawer" — no actual
  // collision), and its Save button's own destination (ProjectHome.tsx)
  // always reads "Drawer" regardless, matching every OTHER inbound link to
  // that screen. 'sprintSaveToDrawer'/'sprintSaveAsDrawer' restore that
  // consistency. See QuickSprint.tsx's own updated comment at the call
  // site and b2-1.mjs's parked S6g check for the full account.
  //
  // Review fix, second gap (same pass) — CreateProject.tsx: the build never
  // noticed it's ALSO DrawersTree.tsx's own "New Binder" row's real
  // destination (`/project/new?drawer=<id>`), so its unconditional
  // 'createDrawerEyebrow'/'createDrawerTitleLabel' contradicted that row's
  // own word one click later. CreateProject.tsx now reads `drawerId`
  // (already available, the same signal DrawersTree.tsx's own button uses)
  // and switches to inline themeLexicon 'binder' composition for THAT
  // branch only — it does NOT gain new deskLexicon terms of its own for
  // that branch, matching the OTHER themeLexicon-convention files' own
  // pattern above; its deskLexicon terms below stay the top-level-only
  // (no `drawer` param) case. See CreateProject.tsx's own comment.
  | 'createDrawerEyebrow' | 'createDrawerTitleLabel' | 'createDrawerOpensNote'
  | 'drawerHomeTitleLabel' | 'backToDrawer'
  | 'domainLabelCreative' | 'domainLabelAcademic' | 'domainLabelProfessional'
  | 'journalRouteSendToDrawer' | 'journalRouteEmptyDrawers' | 'journalRoutePromoteDrawer'
  | 'sprintSaveToDrawer' | 'sprintSaveAsDrawer';

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
  cascadePlanNoProject: 'File this page to a drawer first to plan around it.',
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
  boardPortedBadge: 'From a page',
  boardEditCopy: 'Edit copy',
  boardLayerBringFront: 'Bring to front',
  boardLayerSendBack: 'Send to back',
  boardThreadGrab: 'Drag to connect',
  boardThreadPrefix: 'thread',
  boardThreadUntitled: 'Untitled',
  boardFooterToggle: 'Show connections',
  tutorOpen: 'Open the Tutor',
  tutorClose: 'Close the Tutor',
  tutorTitle: 'The Tutor',
  tutorDockClose: 'Close, keep dock',
  tutorDockReopen: 'Reopen',
  tutorLensConsistency: 'Consistency',
  tutorLensStructure: 'Structure',
  tutorLensFragments: 'Fragments',
  tutorLensConsistencyEmpty: 'No repeated or near-duplicate names found yet.',
  tutorLensFragmentsEmpty: 'Nothing recent or shared-tagged to resurface yet.',
  tutorLensFragmentsNote: 'Recency and shared tags only — nothing else.',
  tutorStructureNoBeat: 'Not linked to a beat.',
  tutorNudgesTitle: 'Waiting for you',
  tutorNudgesEmpty: 'Nothing waiting right now.',
  tutorConversationTitle: 'Talk it through',
  tutorConversationPlaceholder: 'Ask a question…',
  tutorConversationSend: 'Send',
  tutorConversationEmpty: 'Nothing said yet.',
  tutorConversationSending: 'Thinking…',
  tutorConversationOffline: 'The Tutor is offline or not configured right now — the lenses above still work.',
  tutorConversationError: 'The Tutor could not be reached. Try again in a moment.',
  tutorDisclosureTitle: 'Before you ask',
  tutorDisclosureBody: 'What you ask the Tutor travels to a language model; your pages stay yours.',
  tutorDisclosureAck: 'Got it',
  cascadePageNewPage: 'New Page',
  cascadePlanJustAPage: 'Just need a page? New Page is in the Page section.',
  boardNewPageCard: 'New page card',
  boardCanvasEmpty: 'Nothing here yet — Add card, or New page card, from the tools.',
  drawerPlaceTrash: 'Trash',
  cascadeTrashOpen: 'Open the Trash',
  boardRestore: 'Restore',
  boardHomeLabelJournal: 'The Journal Board — has no drawer home',
  boardHomeLabelTrash: 'The Trash Board — has no drawer home',
  boardHomeLabelShelf: 'The Shelf Board — has no drawer home',
  shelfBoardEmpty: 'Nothing waiting.',
  cascadeShelfOpen: 'Open the Shelf',
  cascadePageNewJournalEntry: 'New Journal Entry',
  boardAddExistingPage: 'Existing page…',
  placesTitle: 'Places',
  placesHomeZoneLabel: 'Home',
  placesLoose: 'Loose',
  placesNewDrawer: '+ New Drawer',
  placesNewDrawerPlaceholder: 'Drawer name',
  placesNewDrawerCreate: 'Create',
  placesNewDrawerCancel: 'Cancel',
  placesBoardsTitle: 'Boards',
  placesBoardsZoneLabel: 'Boards this page can join',
  placesBoardsEmpty: 'No boards yet.',
  drawersKindBoard: 'Board',
  drawersKindDoc: 'Document',
  drawersLooseGroup: 'Loose',
  createDrawerEyebrow: 'NEW DRAWER',
  createDrawerTitleLabel: 'Drawer title (optional)',
  createDrawerOpensNote: 'Opens the Drawer home — shape it as you go.',
  drawerHomeTitleLabel: 'Drawer title',
  backToDrawer: 'Back to Drawer',
  domainLabelCreative: 'Creative Drawer',
  domainLabelAcademic: 'Academic Drawer',
  domainLabelProfessional: 'Professional Drawer',
  journalRouteSendToDrawer: 'Send to a Drawer',
  journalRouteEmptyDrawers: 'No Drawers yet.',
  journalRoutePromoteDrawer: 'Promote to a new Drawer',
  sprintSaveToDrawer: 'Save to Drawer',
  sprintSaveAsDrawer: 'Save as Drawer',
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
