import { useEffect, useState } from 'react';
import type { ChildWord } from '../decks/types';
import { useTheme, type ThemeId } from './theme';

// the desk lexicon: every user-facing zone/module/mode name, one flat map keyed by DeskTermId; a theme overrides only what it wants and the rest falls through; a sibling of themeLexicon so the two casings of Free Write never collide [deskLexicon §1]
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
  | 'modeBarPen' | 'spreadLensInk'
  | 'inkInstrument' | 'inkModeText' | 'inkModeInk'
  | 'inkTip' | 'inkNib' | 'inkTipPen' | 'inkTipPencil' | 'inkTipMarker'
  | 'inkNibFine' | 'inkNibRegular' | 'inkNibBroad'
  | 'inkEraser' | 'inkWalnut' | 'inkIron' | 'inkOxblood' | 'inkSea'
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
  // PW1 S1/S2/S3 — "Boards connected" and what a board row, a section heading
  // and a membership row say. `cascadePlanOpen`/`cascadePlanEmpty` are RETIRED
  // from every render path (PW3: the panel is the list; PW9: absent, never
  // empty) — the ids stay so the retirement reads as deliberate rather than as
  // a term that went missing.
  | 'cascadePlanBoardsConnected' | 'cascadePlanRelationOwn' | 'cascadePlanOwnSuffix'
  | 'cascadePlanNoDrawer' | 'cascadeOpenBoard' | 'cascadePlanCaptionIn'
  | 'cascadeCardCopyTo' | 'cascadeCardCopyTitle' | 'cascadeCardCopyNote'
  | 'cascadeCardCopiedFrom' | 'cascadeCardRemove' | 'cascadeCardOnlyBoard'
  | 'cascadePlanSectionCards' | 'cascadePlanSectionPages'
  | 'cascadePlanSectionBoards' | 'cascadePlanLinkedHeading'
  | 'cascadePinShown' | 'cascadePinNotShown' | 'cascadePinDisplay' | 'cascadePinHide'
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
  // the Fit-to-text icon on a hand-sized card: its tooltip and accessible name, per theme [deskLexicon §4]
  | 'boardFitToText'
  // FX5 S5 — the olive pin (the connection grab, replacing the dead
  // handle-double-click gesture whole) + the footer line/toggle threads
  // render as.
  | 'boardThreadGrab' | 'boardThreadPrefix' | 'boardThreadUntitled' | 'boardFooterToggle'
  // the right-click menus, the "Send to Trash?" dialog, the Settings row and the toasts [deskLexicon §5]
  | 'ctxDelete' | 'ctxDeleteBoard' | 'ctxUngroup' | 'deleteDialogTitle' | 'deleteDialogPurgeTitle' | 'deleteDialogCancel' | 'deleteDialogConfirm' | 'deleteDialogDontAsk'
  | 'ctxEmptyTrash' | 'emptyTrashQuestionOne' | 'emptyTrashQuestionMany' | 'purgedElsewhere' | 'destructiveTypeToGo' | 'destructiveGo'
  | 'settingsAskBeforeDelete' | 'toastCardDeleted' | 'toastCardRestored' | 'toastBoardTrashed' | 'trashCardBadge'
  // the Grafts / Links tab: the selected card's connections, each with an X that asks first [deskLexicon §6]
  | 'linksSelectCard' | 'linksRemoveTitle' | 'linksRemoveAria' | 'linksKindPage' | 'linksKindBoard' | 'linksKindCard'
  // BIG PROJECTS STEP 3 - Grafts across places and the graft doors (docs/plans/big-projects.md step 3; mockup cursor/graft-doors-mockup @ c4f34eb0)
  | 'graftAdd' | 'graftSearch' | 'graftConnectedTo' | 'graftGroupCards' | 'graftGroupSources' | 'graftGroupBoards' | 'graftGroupPages' | 'graftSharedTags'
  | 'graftPlanBoard' | 'graftPlanCardsOne' | 'graftPlanCardsMany' | 'graftHideAria' | 'graftHiddenLine' | 'graftRemovedLine' | 'graftUndo' | 'graftCameFrom' | 'graftDock' | 'graftDockAria' | 'linkDockCloseAria' | 'linkDockUndock' | 'linkDockGone'
  | 'graftKnobTip' | 'graftPairedPage'
  // TU1 S2/S3/S4/S5 — the Tutor (components/Tutor.tsx), the sliver's own
  // mirror on the paper's right edge. One seam, all of the Tutor's static
  // chrome — the lenses' own DYNAMIC observation text (Consistency's
  // "X / Y both appear.", Structure's home/membership lines, nudge
  // sentences) is composed in code from real page data and cannot be a
  // flat lexicon lookup; only the surrounding labels/disclosures live here.
  | 'tutorOpen' | 'tutorClose' | 'tutorTitle'
  // PHASE 1 (S3) - the right drawer's tab row. 'drawerLinks' is the per-theme word that replaces "Connections" (Arbor: Grafts, Flux: Links).
  | 'tutorTabTutor' | 'drawerLinks' | 'drawerLinksEmpty' | 'drawerRightTabsLabel'
  | 'tutorDockClose' | 'tutorDockReopen'
  | 'tutorLensConsistency' | 'tutorLensStructure' | 'tutorLensFragments'
  | 'tutorLensConsistencyEmpty' | 'tutorLensFragmentsEmpty' | 'tutorLensFragmentsNote'
  | 'tutorNudgesTitle' | 'tutorNudgesEmpty'
  // TU5 S3 — the book's Bible (L4): section header, a one-line note, empty
  // state, the add-input placeholder + button, and the per-fact
  // edit/delete/save/cancel affordances. All writer-facing chrome, all here.
  | 'tutorBibleTitle' | 'tutorBibleNote' | 'tutorBibleEmpty'
  | 'tutorBibleAddPlaceholder' | 'tutorBibleAdd'
  | 'tutorBibleEdit' | 'tutorBibleDelete' | 'tutorBibleSave' | 'tutorBibleCancel'
  | 'tutorConversationTitle' | 'tutorConversationPlaceholder' | 'tutorConversationSend'
  | 'tutorConversationEmpty' | 'tutorConversationSending'
  | 'tutorConversationOffline' | 'tutorConversationError'
  | 'tutorConversationUnborn'
  // the Free Write roster's preset labels are strings of record; the fourth member is the composer taking focus, so it has no string [deskLexicon §7]
  | 'tutorFreeWriteRoster' | 'tutorFreeWritePrompt' | 'tutorFreeWriteUnblock'
  | 'tutorFreeWriteTips' | 'tutorFreeWriteRefill'
  // the Draft roster's four asks are strings of record, asserted byte-exact (item84b.mjs); tutorDraftAskStretch's own words name what its wire sends [deskLexicon §8]
  | 'tutorDraftRoster' | 'tutorDraftAskDrag' | 'tutorDraftAskLoadBearing'
  | 'tutorDraftAskThreadSlip' | 'tutorDraftAskStretch' | 'tutorDraftAskStretchLabel'
  | 'tutorDraftStretchNeedsSelection' | 'tutorSelectionTruncated'
  | 'tutorDisclosureTitle' | 'tutorDisclosureBody' | 'tutorDisclosureAck'
  // the disclosure's v2 body, kept beside the later versions as their history [deskLexicon §9]
  | 'tutorDisclosureBodyV2'
  // the disclosure's v3 body: v2 plus the writer's Bible as a third traveler [deskLexicon §10]
  | 'tutorDisclosureBodyV3'
  // the disclosure's v4 body, rendered above v3 (v3 stands verbatim beneath it, unedited) [deskLexicon §11]
  | 'tutorDisclosureBodyV4'
  // TU2 S2 — the listener's own honesty line: shown in the panel's quiet
  // UI copy whenever a send's delta had to be tail-capped (the model's
  // own copy of that same honesty travels in the delta block's plain-data
  // header text instead — that one is not writer-facing chrome and so
  // does NOT route through this lexicon, per the brief's own distinction).
  | 'tutorDeltaTruncated'
  // TU2 S5 — the session meter's own foot-of-panel line (Tutor.tsx, one
  // quiet line after each model reply, fading ~4s — see that file's own
  // header comment). 'tutorMeterTurnCost'/'tutorMeterSessionTotal' are the
  // two labels used when the just-used model has a cost-table entry
  // (store/tutorCostEstimates.ts); 'tutorMeterTokensOnly' is the honest
  // fallback label when it does not — raw token counts, never an invented
  // dollar figure, per the brief's own words. 'tutorMeterTokensUnit'
  // mirrors 'goalUnitLines' above (a bare, reusable unit word, not a full
  // sentence) rather than baking "tokens" into every label string.
  | 'tutorMeterTurnCost' | 'tutorMeterSessionTotal' | 'tutorMeterTokensOnly' | 'tutorMeterTokensUnit'
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
  | 'syncTooLargeOne' | 'syncTooLargeMany'
  // a local write failure, by which of three states it is, plus the one-time near-full heads-up [deskLexicon §12]
  | 'syncStorageFullPending' | 'syncStorageFullSynced' | 'syncStorageFullAnon'
  | 'syncStorageNearFull' | 'syncStorageNearFullAnon'
  // ITEM 224(a), SYNC INTEGRITY — a record the server itself refused to
  // store (not a size problem); kept dirty, retried, and named here.
  | 'syncRejectedOne' | 'syncRejectedMany'
  // B10.1 - the safety net's diagnostic (counts only) and the stale-client banner.
  | 'syncPullShort' | 'staleClientBody' | 'staleClientReload'
  // LOGOUT SAFETY — a sign-out refused while records have not reached the account, and its second step.
  | 'logoutBlockedBody' | 'logoutBlockedRejected' | 'logoutStay' | 'logoutAnyway' | 'logoutAnywayConfirm' | 'logoutAnywayBack'
  | 'logoutBlockedBodyOne' | 'logoutAnywayOne' | 'logoutAnywayConfirmOne' | 'logoutSigningOut'
  | 'cascadePageNewPage' | 'cascadePlanJustAPage' | 'boardNewPageCard' | 'boardCanvasEmpty'
  // ITEM 83 M3 (R6) — the Page drawer's PAGE SETUP zone: the sheet's own
  // dimension (margins, leading, numbers, headers, footers), as opposed to
  // Revise's face+size, which is the page's VOICE (the F5 split). Every
  // string here is themable by construction — a literal in JSX would be
  // invisible to Flux and to every register after it (§1.4).
  | 'pageSetupHeading' | 'pageSetupMargins' | 'pageSetupMarginsNormal'
  | 'pageSetupMarginsNarrow' | 'pageSetupMarginsWide' | 'pageSetupLineSpacing'
  | 'pageSetupNumbers' | 'pageSetupNumbersPlacementBottomCenter'
  | 'pageSetupNumbersPlacementBottomRight' | 'pageSetupNumbersPlacementTopRight'
  | 'pageSetupHeaders' | 'pageSetupFooters' | 'pageSetupHeaderText'
  | 'pageSetupFooterText' | 'pageSetupSaveDefaults' | 'pageSetupSavedDefaults'
  | 'pageSetupOn' | 'pageSetupOff' | 'pageSetupExportNote'
  // ITEM 83 M4 — STYLING (R1), the Typewriter menu (R3, names per F1's
  // default), and the three-instrument foot (R5/R12).
  | 'stylingHeading' | 'stylingOpen' | 'stylingClose' | 'stylingBold' | 'stylingItalic' | 'stylingUnderline'
  | 'stylingStrike'
  // card-close-x - the card pop-up's corner X: its accessible name.
  | 'boardPopupClose'
  | 'twMenuHeading' | 'twForwardLock' | 'twForwardLockWindow'
  | 'twUnitWords' | 'twUnitSentences' | 'twLineFade' | 'twLineFadeLines'
  | 'twWritingLine' | 'twLineTop' | 'twLineCenter' | 'twLineBottom'
  | 'twPageScroll' | 'footProgress' | 'footFullScreen' | 'footTypewriter' | 'footTarget'
  // ITEM 83 M5 (R4/DR3) — Draft's grown roster and its conversion verb.
  | 'draftHeading' | 'draftHeadingUp' | 'draftHeadingDown' | 'draftBullet' | 'draftBulletCircle' | 'draftBulletSquare' | 'draftBulletStyles' | 'draftQuote' | 'draftIndent' | 'draftOutdent' | 'draftSpacing'
  | 'railTemplates' | 'templateOutline' | 'templateBibliography' | 'templateTitlePage' | 'templateBlank' | 'templateScreenplay' | 'templateOpenedNewBack'
  | 'helpOutline' | 'helpTitlePage' | 'helpTemplateBlank' | 'helpTemplateScreenplay' | 'helpTemplateBibliography'
  | 'comingSoon' | 'railTypeface' | 'goalUnitWords' | 'railPageKind'
  // PHASE 1 - the Actions section of the left drawer.
  | 'railActions' | 'actionTags' | 'actionCopy' | 'actionDelete' | 'actionHeaderFooter' | 'actionTagRemove'
  | 'actionDeleteConfirm' | 'actionDeleteYes' | 'actionDeleteKeep'
  | 'footSettings' | 'footMenuTypewriter' | 'footMenuProgress' | 'footMenuPreferences' | 'footMenuFlicker'
  // PHASE 1 (S4) - the two mode toggles beside the drawer's "..." button. Their names are what a screen reader hears; on/off is aria-pressed.
  | 'modeToggleTypewriter' | 'modeToggleProgress' | 'formatLockedByTypewriter'
  | 'draftAlignment' | 'draftAlignLeft' | 'draftAlignCenter' | 'draftAlignRight'
  | 'draftConvertToScreenplay' | 'draftConvertToProse'
  // ITEM 207 — the Type control's accessible names. NO visible captions: his law is a strip menu with the fewest marks,
  // so each control's name lives in its aria-label, never as helper text.
  | 'typeGroup' | 'typeFace' | 'typeSmaller' | 'typeLarger' | 'typeSize'
  // FONT-SPAN - the Typeface section's two scopes (the approved font-choices mockup)
  | 'typeScope' | 'typeScopeSelection' | 'typeScopeWholeDocument' | 'typeScopeWholeCard'
  // the page's declared kind and its style guide; the two sub-labels say which control describes the page and which acts on it [deskLexicon §13]
  | 'structureKindLabel' | 'structureActLabel' | 'structureStyleGuideLabel'
  | 'kindNormal' | 'kindScreenplay' | 'kindResearch'
  | 'styleGuideMla' | 'styleGuideApa' | 'styleGuideChicago' | 'styleGuideAp'
  // ITEM 83 M6 (R13.ii) — the board's Place-page list. The heading is a VERB
  // PHRASE by S13's precedent: a bare noun list in a drawer reproduces the
  // GO-versus-PUT confusion the Places redesign exists to close.
  // ITEM 170 — the list became the way to OPEN a page, so its heading names
  // what the list IS; the put it still offers is named by its own verb.
  | 'openPagesHeading' | 'openPagesSort' | 'openPagesMore' | 'openPagesPlace'
  | 'placeSortDate' | 'placeSortDrawer'
  // BIG PROJECTS 1a - the place block, the switcher and the Pages pop-out (Arbor words; Flux follows in its own words pass).
  | 'sectionsHeading' | 'sectionsOrder' | 'sectionsRows' | 'sectionsGrid' | 'sectionsNewSet' | 'sectionsNewSetName' | 'sectionsPresets'
  | 'sectionsNewBoard' | 'sectionsEmptyBoards'
  // FLUX V2 - the top drawer's display word (Arbor: its own name; Flux: Root, only while the name is still the default).
  | 'placeRootName'
  | 'sectionsMoved' | 'sectionsUndo' | 'sectionsTakeOut' | 'sectionsEmpty' | 'sectionsReorder'
  | 'switcherHeading' | 'switcherDrawers' | 'switcherJournals' | 'switcherNewDrawer' | 'switcherNewDrawerName' | 'switcherUnsorted'
  | 'placeSortAZ' | 'placePageEmpty' | 'planNewCard' | 'planFitToContent'
  // ITEM 83 M7 (PP1) — the Home zone's heading, which until now existed only
  // as an aria-label the eye could not hear.
  | 'placesHomeHeading'
  // the Trash board's own terms; system boards name their own home (describePageHome knows nothing of them) [deskLexicon §14]
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
  // B2 S5 gave the Board's Add flow "Existing page…" beside FX6's New page
  // card. (The Page pop-out's own "New Journal Entry" action, added here by
  // B2 S5, was RETIRED by FX15 S3 — dead SV6 vocabulary; see CascadePanels.)
  | 'boardAddExistingPage'
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
  // the Drawer terms: key names stay (internal ids), string values carry the writer's word [deskLexicon §15]
  | 'createDrawerEyebrow' | 'createDrawerTitleLabel' | 'createDrawerOpensNote'
  | 'drawerHomeTitleLabel' | 'backToDrawer'
  | 'domainLabelCreative' | 'domainLabelAcademic' | 'domainLabelProfessional'
  | 'journalRouteSendToDrawer' | 'journalRouteEmptyDrawers' | 'journalRoutePromoteDrawer'
  | 'sprintSaveToDrawer' | 'sprintSaveAsDrawer'
  // B3 S1 — the deck engine's own chrome (components/DeckWizard.tsx): the
  // two doors' own labels, the library step, the room headings, and the
  // "Start Here" hint (R6's own wayfinding mark). Every deck NAME/prompt/
  // option/card string lives in its own dedicated block below (one per
  // deck, in catalog order) — this block is only the engine's shared frame.
  | 'deckWizardStartFromDeck' | 'deckWizardFromDeck' | 'deckWizardChooseTitle'
  | 'deckWizardBack' | 'deckWizardCancel' | 'deckWizardContinue' | 'deckWizardClose'
  | 'deckStartHereLabel'
  | 'deckRoomFiction' | 'deckRoomSpeculative' | 'deckRoomScreen'
  | 'deckRoomAcademy' | 'deckRoomBusiness' | 'deckRoomNewsroom'
  // B3 S2 — the seven decks' own names (the library's one-line-each roster).
  | 'deckNameThreeAct' | 'deckNameWorldbuilding' | 'deckNameFeatureScreenplay'
  | 'deckNameThesis' | 'deckNameGrant' | 'deckNameFeatureStory' | 'deckNameCharacterStudy'
  // B3 S2 — Three-Act Structure (decks/library/threeAct.ts): wizard (novel/
  // novella/short story, dealing proportionately per that file's own
  // header comment) + the nine beat cards' own title/one-line-prompt pairs.
  | 'deckThreeActQPrompt' | 'deckThreeActOptNovel' | 'deckThreeActOptNovella' | 'deckThreeActOptShortStory'
  | 'deckThreeActHookTitle' | 'deckThreeActHookBody'
  | 'deckThreeActIncitingTitle' | 'deckThreeActIncitingBody'
  | 'deckThreeActThresholdTitle' | 'deckThreeActThresholdBody'
  | 'deckThreeActComplicationsTitle' | 'deckThreeActComplicationsBody'
  | 'deckThreeActMidpointTitle' | 'deckThreeActMidpointBody'
  | 'deckThreeActDarkestTitle' | 'deckThreeActDarkestBody'
  | 'deckThreeActClimaxTitle' | 'deckThreeActClimaxBody'
  | 'deckThreeActResolutionTitle' | 'deckThreeActResolutionBody'
  | 'deckThreeActFinalImageTitle' | 'deckThreeActFinalImageBody'
  // B3 S2 — Worldbuilding (decks/library/worldbuilding.ts): wizard (fantasy/
  // SF/other) tunes the Rules card's own prompt only (catalog's own
  // wording) — the other six cards' prompts are genre-agnostic.
  | 'deckWorldbuildingQPrompt' | 'deckWorldbuildingOptFantasy' | 'deckWorldbuildingOptSF' | 'deckWorldbuildingOptOther'
  | 'deckWorldbuildingRulesTitle'
  | 'deckWorldbuildingRulesBodyFantasy' | 'deckWorldbuildingRulesBodySF' | 'deckWorldbuildingRulesBodyOther'
  | 'deckWorldbuildingHistoryTitle' | 'deckWorldbuildingHistoryBody'
  | 'deckWorldbuildingPlacesTitle' | 'deckWorldbuildingPlacesBody'
  | 'deckWorldbuildingCulturesTitle' | 'deckWorldbuildingCulturesBody'
  | 'deckWorldbuildingPowerTitle' | 'deckWorldbuildingPowerBody'
  | 'deckWorldbuildingLanguageTitle' | 'deckWorldbuildingLanguageBody'
  | 'deckWorldbuildingIcebergTitle' | 'deckWorldbuildingIcebergBody'
  // B3 S2 — Feature Screenplay (decks/library/featureScreenplay.ts): Save
  // the Cat's 15, always dealt regardless of the wizard's own feature/pilot
  // answer — picking Pilot only surfaces `deckScreenplayPilotNote` inline
  // (routes pilot-seekers onward in COPY ONLY, per this ticket's brief; the
  // TV Pilot deck itself is a second-wave non-goal).
  | 'deckScreenplayQPrompt' | 'deckScreenplayOptFeature' | 'deckScreenplayOptPilot' | 'deckScreenplayPilotNote'
  | 'deckScreenplayOpeningImageTitle' | 'deckScreenplayOpeningImageBody'
  | 'deckScreenplayThemeStatedTitle' | 'deckScreenplayThemeStatedBody'
  | 'deckScreenplaySetupTitle' | 'deckScreenplaySetupBody'
  | 'deckScreenplayCatalystTitle' | 'deckScreenplayCatalystBody'
  | 'deckScreenplayDebateTitle' | 'deckScreenplayDebateBody'
  | 'deckScreenplayBreakTwoTitle' | 'deckScreenplayBreakTwoBody'
  | 'deckScreenplayBStoryTitle' | 'deckScreenplayBStoryBody'
  | 'deckScreenplayFunGamesTitle' | 'deckScreenplayFunGamesBody'
  | 'deckScreenplayMidpointTitle' | 'deckScreenplayMidpointBody'
  | 'deckScreenplayBadGuysTitle' | 'deckScreenplayBadGuysBody'
  | 'deckScreenplayAllIsLostTitle' | 'deckScreenplayAllIsLostBody'
  | 'deckScreenplayDarkNightTitle' | 'deckScreenplayDarkNightBody'
  | 'deckScreenplayBreakThreeTitle' | 'deckScreenplayBreakThreeBody'
  | 'deckScreenplayFinaleTitle' | 'deckScreenplayFinaleBody'
  | 'deckScreenplayFinalImageTitle' | 'deckScreenplayFinalImageBody'
  // B3 S2 — Thesis / Dissertation (decks/library/thesis.ts): wizard
  // (humanities/sciences) — five base cards always deal; the sciences
  // branch swaps the four generic chapter cards for IMRaD chapter shapes
  // (catalog's own wording), same total count either way.
  | 'deckThesisQPrompt' | 'deckThesisOptHumanities' | 'deckThesisOptSciences'
  | 'deckThesisQuestionTitle' | 'deckThesisQuestionBody'
  | 'deckThesisLitReviewTitle' | 'deckThesisLitReviewBody'
  | 'deckThesisMethodologyTitle' | 'deckThesisMethodologyBody'
  | 'deckThesisEvidenceTitle' | 'deckThesisEvidenceBody'
  | 'deckThesisCitationTitle' | 'deckThesisCitationBody'
  | 'deckThesisChapterOneTitle' | 'deckThesisChapterOneBody'
  | 'deckThesisChapterTwoTitle' | 'deckThesisChapterTwoBody'
  | 'deckThesisChapterThreeTitle' | 'deckThesisChapterThreeBody'
  | 'deckThesisConclusionTitle' | 'deckThesisConclusionBody'
  | 'deckThesisIntroTitle' | 'deckThesisIntroBody'
  | 'deckThesisMethodsTitle' | 'deckThesisMethodsBody'
  | 'deckThesisResultsTitle' | 'deckThesisResultsBody'
  | 'deckThesisDiscussionTitle' | 'deckThesisDiscussionBody'
  // B3 S2 — Grant Application (decks/library/grant.ts): the catalog names
  // no wizard for this deck (Law 5 still requires one) — a light funder-
  // type question tunes only the Funder Alignment card's own prompt.
  | 'deckGrantQPrompt' | 'deckGrantOptFoundation' | 'deckGrantOptGovernment' | 'deckGrantOptCorporate'
  | 'deckGrantNeedTitle' | 'deckGrantNeedBody'
  | 'deckGrantObjectivesTitle' | 'deckGrantObjectivesBody'
  | 'deckGrantMethodsTitle' | 'deckGrantMethodsBody'
  | 'deckGrantEvaluationTitle' | 'deckGrantEvaluationBody'
  | 'deckGrantBudgetTitle' | 'deckGrantBudgetBody'
  | 'deckGrantAlignmentTitle'
  | 'deckGrantAlignmentBodyFoundation' | 'deckGrantAlignmentBodyGovernment' | 'deckGrantAlignmentBodyCorporate'
  // B3 S2 — Feature Story (decks/library/featureStory.ts): same pattern as
  // Grant — a light feature-type question tunes only the Nut Graf prompt.
  | 'deckFeatureStoryQPrompt' | 'deckFeatureStoryOptProfile' | 'deckFeatureStoryOptTrend' | 'deckFeatureStoryOptInvestigative'
  | 'deckFeatureStoryNutGrafTitle'
  | 'deckFeatureStoryNutGrafBodyProfile' | 'deckFeatureStoryNutGrafBodyTrend' | 'deckFeatureStoryNutGrafBodyInvestigative'
  | 'deckFeatureStoryLedeATitle' | 'deckFeatureStoryLedeABody'
  | 'deckFeatureStoryLedeBTitle' | 'deckFeatureStoryLedeBBody'
  | 'deckFeatureStoryLedeCTitle' | 'deckFeatureStoryLedeCBody'
  | 'deckFeatureStorySourceOneTitle' | 'deckFeatureStorySourceOneBody'
  | 'deckFeatureStorySourceTwoTitle' | 'deckFeatureStorySourceTwoBody'
  | 'deckFeatureStorySceneOneTitle' | 'deckFeatureStorySceneOneBody'
  | 'deckFeatureStorySceneTwoTitle' | 'deckFeatureStorySceneTwoBody'
  | 'deckFeatureStoryKickerATitle' | 'deckFeatureStoryKickerABody'
  | 'deckFeatureStoryKickerBTitle' | 'deckFeatureStoryKickerBBody'
  // Character Study: dealt pre-threaded (connection boxes); per character the four self-card types; one Relationship card per adjacent pair [deskLexicon §16]
  | 'deckCharacterStudyQPrompt' | 'deckCharacterStudyOptTwo' | 'deckCharacterStudyOptThree' | 'deckCharacterStudyOptFour'
  | 'deckCharacterStudyLabel'
  // the Tier 1 decks' chrome (names, wizard prompts, step titles); questions, "?" sentences and examples are deck content (decks/content.ts), not lexicon [deskLexicon §17]
  | 'deckNameHeroJourney' | 'deckNameStoryCircle' | 'deckNameSceneSequel' | 'deckNameArgumentEssay'
  | 'deckNameResearchPaper' | 'deckNameBusinessProposal' | 'deckNameFromMyPages' | 'deckRoomEvery'
  | 'deckHeroQPrompt' | 'deckHeroOptNovel' | 'deckHeroOptShortStory' | 'deckSceneSequelQPrompt'
  | 'deckSceneSequelOptOne' | 'deckSceneSequelOptThree' | 'deckSceneSequelOptFive' | 'deckSceneSequelLabel'
  | 'deckArgumentQPrompt' | 'deckArgumentOptShort' | 'deckArgumentOptFull' | 'deckScreenplayOptNovel'
  | 'deckHeroOrdinaryWorldTitle' | 'deckHeroCallTitle' | 'deckHeroRefusalTitle' | 'deckHeroMentorTitle'
  | 'deckHeroThresholdTitle' | 'deckHeroTestsTitle' | 'deckHeroApproachTitle' | 'deckHeroOrdealTitle'
  | 'deckHeroRewardTitle' | 'deckHeroRoadBackTitle' | 'deckHeroResurrectionTitle' | 'deckHeroReturnTitle'
  | 'deckCircleYouTitle' | 'deckCircleNeedTitle' | 'deckCircleGoTitle' | 'deckCircleSearchTitle'
  | 'deckCircleFindTitle' | 'deckCircleTakeTitle' | 'deckCircleReturnTitle' | 'deckCircleChangeTitle'
  | 'deckSceneSequelGoalTitle' | 'deckSceneSequelConflictTitle' | 'deckSceneSequelDisasterTitle' | 'deckSceneSequelReactionTitle'
  | 'deckSceneSequelDilemmaTitle' | 'deckSceneSequelDecisionTitle' | 'deckArgumentClaimTitle' | 'deckArgumentCounterclaimTitle'
  | 'deckArgumentEvidence1Title' | 'deckArgumentEvidence2Title' | 'deckArgumentEvidence3Title' | 'deckArgumentSynthesisTitle'
  | 'deckArgumentSoWhatTitle' | 'deckImradIntroductionTitle' | 'deckImradMethodsTitle' | 'deckImradResultsTitle'
  | 'deckImradDiscussionTitle' | 'deckImradAbstractTitle' | 'deckProposalProblemTitle' | 'deckProposalSolutionTitle'
  | 'deckProposalMarketTitle' | 'deckProposalAskTitle' | 'deckProposalTimelineTitle' | 'deckProposalBudgetTitle'
  | 'deckProposalObjectionsTitle'
  // W3 - the step '?' (components/StepHelp.tsx): its glyph, its 'more' (hands the question to the Tutor) and the ask it stages.
  | 'deckStepHelpGlyph' | 'deckStepHelpMore' | 'deckStepHelpLabel' | 'deckStepHelpAsk'
  // W3 - From my pages' page step in the deck wizard (components/DeckWizard.tsx): its prompt, its deal button, and the line when there is nothing to pick.
  | 'deckFromMyPagesQPrompt' | 'deckFromMyPagesDeal' | 'deckFromMyPagesNone'
  | 'deckCharacterStudyWantNeedTitle' | 'deckCharacterStudyWantNeedBody'
  | 'deckCharacterStudyWoundTitle' | 'deckCharacterStudyWoundBody'
  | 'deckCharacterStudyContradictionTitle' | 'deckCharacterStudyContradictionBody'
  | 'deckCharacterStudyVoiceTitle' | 'deckCharacterStudyVoiceBody'
  | 'deckCharacterStudyRelationshipTitle' | 'deckCharacterStudyRelationshipBody'
  // M2 S1 — the Progress-style setting (Bar | Rhizome), offered only when
  // Progress is Words (M1 R1's own precedent). Every string this ticket
  // introduces routes through this seam per the brief's own instruction,
  // even though the neighboring pre-existing Seg calls in ModeStage.tsx's
  // SettingsPanel/Sliver.tsx's InstrumentsPanel hardcode their OWN terse
  // option strings inline (the FX3 S5 precedent, left as-is — this ticket
  // adds a new control, it does not retrofit its neighbors).
  | 'progressStyleLabel' | 'progressStyleBar' | 'progressStyleRhizome' | 'recedeHint'
  // the Recede-depth and Timer rows' own words, out of inline strings so a theme can name them [deskLexicon §18]
  | 'fadeDepthLabel' | 'fadeDepthPartial' | 'fadeDepthFull' | 'timerLabel'
  // one plain sentence per themed word, behind its own "?" (store/help.ts, HelpButton) [deskLexicon §19]
  | 'helpGrafts' | 'helpTemplates' | 'helpFreeWrite' | 'helpPublish'
  | 'tutorConversationRetry' | 'pageHomeLoose' | 'pageHomeJournal' | 'pageHomeProject' | 'pageHomeAlso'
  // E1 S2 — Publish's copy path, working and legible. A brief confirmation
  // (the existing ActionToast quiet-line pattern) after a genuine copy
  // success, split by button so a writer always knows WHICH one just
  // fired; one honest failure line, reused by both, for the genuine (if
  // rare) case neither the Clipboard API nor the execCommand fallback
  // actually landed the text anywhere — S1's own live finding was silence
  // on success, not brokenness, but "failure is reported honestly, never
  // silently swallowed" is a standing requirement regardless of how often
  // it fires.
  | 'publishCopyWordsConfirm' | 'publishCopyFormattedConfirm' | 'publishCopyFailed'
  // E1 S3 — the Download action, the ticket's own reason for existing. One
  // section label + one button label per scope; 'publishDownloadBinder'
  // only ever renders when the open page has a binder home (no project ->
  // no button, per the house's own no-greyed-states law — see
  // PageEditor.tsx/ScriptEditor.tsx's own conditional). Success/failure
  // lines are shared across every scope (the SAME toast the copy path
  // uses) — a real file landing is its own confirmation in the OS's own
  // download UI, but a quiet in-app line matches S2's "say so" philosophy
  // and gives a genuine failure (e.g. nothing left to export) an honest
  // home instead of a silent no-op.
  | 'publishDownloadTitle' | 'publishDownloadPageMd' | 'publishDownloadPageTxt'
  | 'publishDownloadBinder' | 'publishDownloadEverything'
  | 'publishDownloadConfirm' | 'publishDownloadFailed'
  // E1 S4 — the "coming soon" copy moves BELOW the (now real) download
  // actions rather than leading the dialog; the sentence itself is
  // unchanged verbatim (still true, per the brief), only its position and
  // its route through this lexicon are new.
  | 'publishComingSoon'
  // the board's own modes: three tabs in the page-bar's grammar, the two doors (the arrow is a glyph, never prose), the telos line, the empty lane copy [deskLexicon §20]
  | 'boardModeOpen' | 'boardModeStoryboard' | 'boardModeOutline'
  // W1 (the Walk, board kinds and "Show as"): the three new views' words (a Board's Walk; a Book's Flip and Thumbnails), the Show-as label, the Walk's own chrome, and the Deck's progress fact.
  | 'boardModeWalk' | 'boardModeFlip' | 'boardModeThumbs' | 'showAsLabel'
  | 'walkNotes' | 'walkPrev' | 'walkNext' | 'walkRail' | 'walkResize' | 'walkOpen' | 'flipEmpty' | 'deckFact'
  // W2 (Write this / Place a page... / Place this...): the Walk's two doors, the page's own door, and the two filtered pickers' search words.
  | 'walkWrite' | 'walkPlace' | 'graftPlaceThis' | 'graftPlaceSearchPages' | 'graftPlaceSearchSteps'
  // W5 (gaps, rewards, Lit): the Deck header's line (its lead words and Flux's STACK) and the writer's own finished-mark door (never a verdict: she says it, the app does not)
  | 'gapsLead' | 'deckStack' | 'walkLit' | 'walkUnlit'
  // TOOLS #9 - MACHINA STEP (m1-m4): the readout row above the Block, the keys hint under it, the Plans row's kind word, the "?" box's example label. Canonical English; only Machina draws them.
  | 'walkReadoutAgenda' | 'walkReadoutPlan' | 'walkBlockOf' | 'walkKeysHint' | 'deckFactKind' | 'deckStepHelpEg'
  | 'boardPageDoor' | 'pagePlanDoor' | 'pageEscHint' | 'boardTelos'
  | 'boardLaneDefault' | 'boardStoryboardEmpty' | 'boardOutlineEmpty'
  | 'boardPairWithPage'
  | 'boardRenameLabel'
  // the empty board's doors and the empty page's start-words are door NAMES, not tasks; the child-card words per deck [deskLexicon §21]
  | `kidDoor_${ChildWord}` | `kidPlural_${ChildWord}` | `kidTitle_${ChildWord}` | `kidQ_${ChildWord}` | 'kidQ_section_story'
  | 'kidHowMany' | 'kidKicker' | 'kidNote' | 'kidAdd' | 'kidReadout'
  | 'beginNewCard' | 'beginNewPageCard' | 'beginLoadDeck' | 'beginConnectPage'
  | 'beginNewLane'
  | 'beginScreenplay' | 'beginPlan'
  // ITEM 224 — sign-up by invite code, until launch. Arrival.tsx's own
  // fields are placeholder-only (no labels) today; this one matches that
  // existing shape exactly rather than introducing a labelled field alone.
  | 'authInviteCodePlaceholder'
  // ITEM 224, ROUND 2 — shown instead of the whole form when no codes are
  // configured, so the gate reads as a quiet fact, never a submit-and-fail.
  | 'authSignupByInvitation'
  // the splash's cycling loading line, four phrases per theme [deskLexicon §22]
  | 'splashLoading1' | 'splashLoading2' | 'splashLoading3' | 'splashLoading4'
  // W4 (Help me choose) - the panel's chrome words and the questions' answers (labels + hints) and the deck cover lines.
  | 'formsIntakeHint' | 'formsBlocksHead' | 'formsFoot' | 'formsFootBlocks'
  | 'helpDoor'
  | 'helpDialogLabel'
  | 'helpKicker'
  | 'helpPickKicker'
  | 'helpMaking'
  | 'helpQ1Prompt'
  | 'helpQ2Prompt'
  | 'helpQ3Prompt'
  | 'helpBegin'
  | 'helpAlt'
  | 'helpBrowse'
  | 'helpClose'
  | 'helpBack'
  | 'helpStepOf'
  // the font list's first row: {face} is the face that really renders when nothing is chosen (read from --font-prose) [deskLexicon §23]
  | 'typeFaceDefault' | 'typeAddFont' | 'typeAddFontName' | 'typeAddFontLookup' | 'typeAddFontAdd' | 'typeFaceMissing'
  | 'helpFieldsNote' | 'helpFieldsCount' | 'helpFieldDocument' | 'helpFieldCarried' | 'helpFieldBriefing' | 'helpChoose' | 'helpNoCarried' | 'helpBlocksN'
  | 'helpANovel'
  | 'helpHNovel'
  | 'helpAShortStory'
  | 'helpHShortStory'
  | 'helpAScreenplay'
  | 'helpHScreenplay'
  | 'helpAEssay'
  | 'helpHEssay'
  | 'helpAResearchPaper'
  | 'helpHResearchPaper'
  | 'helpAThesis'
  | 'helpHThesis'
  | 'helpAProposal'
  | 'helpHProposal'
  | 'helpAArticle'
  | 'helpHArticle'
  | 'helpAWorldOrCast'
  | 'helpHWorldOrCast'
  | 'helpAPoems'
  | 'helpHPoems'
  | 'helpAPersonChange'
  | 'helpHPersonChange'
  | 'helpAEventsPressure'
  | 'helpHEventsPressure'
  | 'helpAWorldSystem'
  | 'helpHWorldSystem'
  | 'helpARelationshipCast'
  | 'helpHRelationshipCast'
  | 'helpAImageVoice'
  | 'helpHImageVoice'
  | 'helpAFeature'
  | 'helpHFeature'
  | 'helpAPilot'
  | 'helpHPilot'
  | 'helpAPosition'
  | 'helpHPosition'
  | 'helpAQuestion'
  | 'helpHQuestion'
  | 'helpAQuestionMethod'
  | 'helpHQuestionMethod'
  | 'helpAArgumentChapters'
  | 'helpHArgumentChapters'
  | 'helpAProblemSolution'
  | 'helpHProblemSolution'
  | 'helpAFunderPriorities'
  | 'helpHFunderPriorities'
  | 'helpAPerson'
  | 'helpHPerson'
  | 'helpATrend'
  | 'helpHTrend'
  | 'helpAFound'
  | 'helpHFound'
  | 'helpAWorld'
  | 'helpHWorld'
  | 'helpAPeople'
  | 'helpHPeople'
  | 'helpALittle'
  | 'helpHLittle'
  | 'helpAShape'
  | 'helpHShape'
  | 'helpAEverything'
  | 'helpHEverything'
  | 'helpCoverThreeAct'
  | 'helpCoverStoryCircle'
  | 'helpCoverHeroJourney'
  | 'helpCoverWorldbuilding'
  | 'helpCoverCharacterStudy'
  | 'helpCoverSceneSequel'
  | 'helpCoverFeatureScreenplay'
  | 'helpCoverArgumentEssay'
  | 'helpCoverResearchPaper'
  | 'helpCoverThesis'
  | 'helpCoverBusinessProposal'
  | 'helpCoverGrant'
  | 'helpCoverFeatureStory'
  | 'helpCoverFromMyPages'
  // one "why" line per pick [deskLexicon §24]
  | 'helpWhyStoryCircle'
  | 'helpWhyThreeAct'
  | 'helpWhyWorldbuilding'
  | 'helpWhyCharacterStudy'
  | 'helpWhyFromMyPages'
  | 'helpWhyThreeActShortStory'
  | 'helpWhyCharacterStudyTwo'
  | 'helpWhyFeatureScreenplayFeature'
  | 'helpWhyFeatureScreenplayPilot'
  | 'helpWhyArgumentEssayFull'
  | 'helpWhyResearchPaper'
  | 'helpWhyThesisHumanities'
  | 'helpWhyThesisSciences'
  | 'helpWhyBusinessProposal'
  | 'helpWhyGrant'
  | 'helpWhyFeatureStoryProfile'
  | 'helpWhyFeatureStoryTrend'
  | 'helpWhyFeatureStoryInvestigative';

const CANONICAL: Record<DeskTermId, string> = {
  // BM1 — the Board's Own Modes.
  boardModeOpen: 'Open',
  boardModeStoryboard: 'Storyboard',
  boardModeOutline: 'Outline',
  boardModeWalk: 'Walk',
  boardModeFlip: 'Flip',
  boardModeThumbs: 'Thumbnails',
  showAsLabel: 'Show as',
  walkNotes: 'Notes',
  walkWrite: 'Write this',
  walkPlace: 'Place a page…',
  graftPlaceThis: 'Place this…',
  graftPlaceSearchPages: 'Search pages…',
  graftPlaceSearchSteps: 'Search decks and steps…',
  walkPrev: 'Previous card',
  walkNext: 'Next card',
  walkRail: 'Cards',
  walkResize: 'Resize the card',
  walkOpen: 'Open',
  flipEmpty: 'Nothing here yet.',
  // the Deck's progress fact under its thumbnail: how many of its cards the writer has BEGUN (kindled: words, or a graft to a page). It says so in words - never a bare 4 / 9 - so it cannot be read as the Walk's position (Flux: TRK n/m).
  deckFact: '{n} of {m} begun',
  gapsLead: 'Nothing yet:',
  deckStack: 'Stack',
  walkLit: 'Mark lit',
  walkUnlit: 'Unmark',
  walkReadoutAgenda: 'Deck',
  walkReadoutPlan: 'Board',
  walkBlockOf: 'Card {n} / {m}',
  walkKeysHint: '← → step · Esc leave',
  deckFactKind: '',
  deckStepHelpEg: 'e.g.',
  kidDoor_scene: 'Add scenes…',
  kidPlural_scene: 'scenes',
  kidTitle_scene: 'Scene',
  kidQ_scene: 'What happens in this scene, and what has changed by its end?',
  kidDoor_beat: 'Add beats…',
  kidPlural_beat: 'beats',
  kidTitle_beat: 'Beat',
  kidQ_beat: 'What happens in this beat?',
  kidDoor_moment: 'Add moments…',
  kidPlural_moment: 'moments',
  kidTitle_moment: 'Moment',
  kidQ_moment: 'What does this moment show about them?',
  kidDoor_entry: 'Add entries…',
  kidPlural_entry: 'entries',
  kidTitle_entry: 'Entry',
  kidQ_entry: 'What is it, and what does it change for the people here?',
  kidDoor_subsection: 'Add subsections…',
  kidPlural_subsection: 'subsections',
  kidTitle_subsection: 'Subsection',
  kidQ_subsection: 'What does this subsection report?',
  kidDoor_section: 'Add sections…',
  kidPlural_section: 'sections',
  kidTitle_section: 'Section',
  kidQ_section: 'What does this section argue or show?',
  kidDoor_point: 'Add points…',
  kidPlural_point: 'points',
  kidTitle_point: 'Point',
  kidQ_point: 'What is the point, and what backs it?',
  kidDoor_part: 'Add parts…',
  kidPlural_part: 'parts',
  kidTitle_part: 'Part',
  kidQ_part: 'What does this part need to say?',
  kidQ_section_story: 'What does this section of the story do?',
  kidHowMany: 'How many {plural}?',
  kidKicker: 'Add {plural} under this step',
  kidNote: 'They go right under {step}.',
  kidAdd: 'Add',
  kidReadout: '{parent} › {word} {n} of {m}',
  boardPageDoor: 'Pages', // ITEM word-diet, pages-rename bucket (a)
  pagePlanDoor: 'Plan',
  // A1 (accessibility audit): Tab indents on the page, so the way out is said aloud. Screen-reader-only; never drawn.
  pageEscHint: 'Press Escape to leave the page',
  boardTelos: 'The plan serves the page.',
  boardLaneDefault: 'Cards',
  boardStoryboardEmpty: 'No cards yet. Add cards in Open, then arrange them into order here.',
  boardOutlineEmpty: 'No cards yet. Add cards in Open, then shape them into an outline here.',
  // "Start Pages": pairs THIS board with a new page, without colliding with the create buttons' "+ Pages" [deskLexicon §25]
  boardPairWithPage: 'Start Pages',
  // ITEM 133 - the board's name, edited where it is displayed.
  boardRenameLabel: 'Rename this board',
  // BG1 — the Beginnings. Title-cased as door names (the brief's own wording,
  // verbatim), which is what sets them apart from the sliver's sentence-case
  // tool labels a few rows away: a tool is something you use, a door is
  // somewhere you go.
  beginNewCard: 'New Card',
  // every "make a new one" button is singular [deskLexicon §26]
  beginNewPageCard: 'New Page',
  // "Presets" names what the object is, the noun-door convention [deskLexicon §27]
  beginLoadDeck: 'Presets',
  // "Connect Pages": the same sheet as "+ Filed Pages", naming a different act [deskLexicon §28]
  beginConnectPage: 'Connect Pages',
  beginNewLane: 'New Lane',
  beginScreenplay: 'Screenplay',
  beginPlan: 'Plan',
  modeFreeWrite: 'Free Write',
  modeDraft: 'Draft',
  modeRevise: 'Revise',
  modeWorkshop: 'Workshop',
  modePublish: 'Publish',
  zoneWayfinding: 'Wayfinding',
  zoneStrip: 'Strip',
  // "Page" is grammatically plural ("these Pages") in rail, zone and door labels; physical-page rows are unaffected [deskLexicon §29]
  zoneStage: 'Pages',
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
  modeBarPen: 'Pen',
  spreadLensInk: 'Ink',
  inkInstrument: 'The page’s instrument',
  inkModeText: 'Text',
  inkModeInk: 'Ink',
  inkTip: 'Tip',
  inkNib: 'Nib',
  inkTipPen: 'Pen',
  inkTipPencil: 'Pencil',
  inkTipMarker: 'Marker',
  inkNibFine: 'Fine',
  inkNibRegular: 'Regular',
  inkNibBroad: 'Broad',
  inkEraser: 'Eraser',
  inkWalnut: 'Walnut',
  inkIron: 'Iron',
  inkOxblood: 'Oxblood',
  inkSea: 'Sea',
  railStructure: 'Structure',
  railStructureProse: 'Prose',
  railStructureScreenplay: 'Screenplay',
  drawerPage: 'Pages', // ITEM word-diet, pages-rename bucket (a)
  // describePageHome's words, in the lexicon; pageHomeProject interpolates the place name [deskLexicon §30]
  pageHomeLoose: 'Unfiled',
  pageHomeJournal: 'Journal',
  pageHomeProject: '{drawer name}',
  pageHomeAlso: 'Also in the Journal.', // MOCKUP — stays untouched for now
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
  // the Page face's prose line uses the one connecting word ("grafted"): it names the membership, not a card that may not be on the canvas [deskLexicon §31]
  pageFacePinnedTo: 'Also grafted to',
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
  stripPlan: 'Boards', // BIG PROJECTS 1a: the rail's Plan item is Boards (the category id stays `plan`)
  stripSettings: 'Settings',
  stripChangeTheme: 'Themes',
  cascadeJournalOpen: 'Open the Journal',
  cascadeJournalNewPage: 'New Page', // every "make a new one" button is singular [deskLexicon §32]
  cascadeJournalRecent: 'Recent',
  cascadeJournalAll: 'All pages →',
  cascadePlanCreateBoard: 'Create a Board',
  cascadePlanPlotStory: 'Plot a Story',
  // PW1 — RETIRED from every render path (PW3/PW9); values kept so the
  // retirement is legible and no lookup can silently resolve to nothing.
  cascadePlanOpen: 'Open…',
  cascadePlanEmpty: 'No boards yet.',
  // the term in sentence case; the zone's uppercase is the CSS register's [deskLexicon §33]
  cascadePlanBoardsConnected: 'Boards grafted',
  // PW10 + the three-space canon: "the Plan-board pairing is a SURFACE OWNING A
  // CONTAINER and must be named as such wherever it shows."
  cascadePlanRelationOwn: 'its own plan board',
  cascadePlanOwnSuffix: '— plan',
  cascadePlanNoDrawer: 'Not in a drawer',
  // PW2 S2 — the BOARDS CONNECTED zone's caption on a board.
  cascadePlanCaptionIn: 'in',
  // copy only: Move is a different act (an ownership transfer) [deskLexicon §34]
  cascadeCardCopyTo: 'Copy to a board…',
  // ITEM word-diet.
  cascadeCardCopyTitle: 'Copy to Board',
  // the tray ships only true clauses: a Box has no tags field, so "its tags come with it" waits until cards can be tagged [deskLexicon §35]
  cascadeCardCopyNote: 'A copy is a new card owned by the board it lands on. Its threads do not come with it, and edits do not follow.',
  cascadeCardCopiedFrom: 'copied from',
  cascadeCardRemove: 'Remove from this board',
  cascadeCardOnlyBoard: 'its only board',
  cascadeOpenBoard: 'Open the board',
  cascadePlanSectionCards: 'Cards',
  cascadePlanSectionPages: 'Pages',
  cascadePlanSectionBoards: 'Boards',
  cascadePlanLinkedHeading: 'Linked to this board',
  // PW1 S3 — display state is a fact ON THE ROW, never inferred from the wall.
  // ITEM word-diet.
  cascadePinShown: 'Shown',
  cascadePinNotShown: 'Hidden',
  cascadePinDisplay: 'Display on Board',
  // Deliberately NOT "Remove": the board card's OWN verb is already Remove,
  // and it deletes the MEMBERSHIP. Two acts a keystroke apart, one ending a
  // relation and one only ending its display, must not share a word.
  cascadePinHide: 'Hide from the board',
  cascadePlanNoProject: 'File this page to a drawer first to plan around it.',
  cascadeBoardMove: 'Move to… / Copy to…',
  cascadeBoardDelete: 'Delete',
  cascadeBoardDeleteConfirm: 'Delete',
  cascadeBoardDeleteCancel: 'Cancel',
  // ITEM word-diet.
  cascadeBoardDeleteQuestion: 'Delete Permanently?',
  cascadeDrawersChoose: 'Choose a drawer to see what’s filed inside.',
  cascadeDrawersEmpty: 'No drawers yet.',
  cascadeShelfBrowse: 'Browse the Shelf →',
  cascadeSettingsTitle: 'Settings',
  cascadeSettingsSignOut: 'Sign out',
  // THEME PICKER (theme-rules.md B.5/D) - Arbor's own canonical word for the theme menu is
  // "Mood", not "Theme" (that word belongs to Machina, which hasn't shipped yet and so has no
  // override here - §1c of its own build plan already expects to inherit nothing and add its
  // own entry when it lands).
  cascadeThemeTitle: 'Mood',
  cascadeSurveyEmpty: 'Nothing here yet.',
  cascadeSurveyCurrent: 'Current',
  cascadeDockClose: 'Close, keep browsing',
  cascadeDockReopen: 'Reopen',
  cascadeSurveyBack: 'Back',
  railBoard: 'Board',
  boardAddCard: 'Add card',
  // ITEM word-diet.
  boardPortedBadge: 'From Pages',
  boardEditCopy: 'Edit copy',
  boardFitToText: 'Fit to text',
  boardLayerBringFront: 'Bring to front',
  boardLayerSendBack: 'Send to back',
  boardThreadGrab: 'Drag to graft',
  // ITEM arbor-quiet-brass — was 'thread' (composed at the call site as "— thread:
  // <label>"); now the full connecting phrase itself, same per-theme family as the rest
  // of the board-connection vocabulary (beginConnectPage etc., in OVERRIDES below).
  boardThreadPrefix: 'grafted to',
  boardThreadUntitled: 'Untitled',
  boardFooterToggle: 'Show grafts',
  ctxDelete: 'Delete',
  ctxDeleteBoard: 'Delete board',
  ctxUngroup: 'Ungroup',
  deleteDialogTitle: 'Send to Trash?',
  deleteDialogPurgeTitle: 'Delete for good?',
  deleteDialogCancel: 'Cancel',
  deleteDialogConfirm: 'Delete',
  deleteDialogDontAsk: "Don't ask me again",
  // DELETE FOR GOOD (docs/plans/delete-for-good.md): Trash's Empty Trash, its question, the quiet line when a page open here was deleted
  // for good on another device (Q3), and the in-app typed confirmation that opens the account-wide paths (change 1)
  ctxEmptyTrash: 'Empty Trash',
  emptyTrashQuestionOne: 'Delete 1 item for good?',
  emptyTrashQuestionMany: 'Delete {n} items for good?',
  purgedElsewhere: 'This page was deleted for good on another device.',
  destructiveTypeToGo: 'Type {phrase} to go on:',
  destructiveGo: 'Delete for good',
  settingsAskBeforeDelete: 'Ask before deleting',
  toastCardDeleted: 'Card deleted',
  toastCardRestored: 'Card restored',
  toastBoardTrashed: 'Board moved to Trash',
  trashCardBadge: 'Card',
  linksSelectCard: 'Select a card',
  linksRemoveTitle: 'Remove graft?',
  linksRemoveAria: 'Remove',
  linksKindPage: 'Page',
  linksKindBoard: 'Board',
  linksKindCard: 'Card',
  // BIG PROJECTS STEP 3 - Grafts across places and the graft doors (the mockup's words, Arbor)
  graftAdd: 'Graft…',
  graftSearch: 'Search cards, pages, boards…',
  graftConnectedTo: 'Connected to',
  graftGroupCards: 'Cards',
  graftGroupSources: 'Sources',
  graftGroupBoards: 'Boards',
  graftGroupPages: 'Pages',
  graftSharedTags: 'Shared tags',
  graftPlanBoard: 'Plan board',
  graftPlanCardsOne: '1 card',
  graftPlanCardsMany: '{n} cards',
  graftHideAria: 'Hide from this page',
  graftHiddenLine: '{title} hidden from this page.',
  graftRemovedLine: 'Graft to {title} removed.',
  graftUndo: 'Undo',
  graftDock: 'Dock',                                    // dock a linked card or page beside the page [deskLexicon §37]
  graftDockAria: 'Dock beside the page',
  linkDockCloseAria: 'Undock the reader and return to the list',
  linkDockUndock: 'Undock',
  linkDockGone: 'Nothing here now',
  graftCameFrom: 'Came from',
  graftKnobTip: 'Drag to graft',
  graftPairedPage: 'Page',
  tutorOpen: 'Open the Tutor',
  tutorClose: 'Close the Tutor',
  tutorTitle: 'The Tutor',
  // Arbor is canonical, Flux overrides below; the "?" beside this tab reads helpGrafts [deskLexicon §38]
  tutorTabTutor: 'Tutor',
  drawerLinks: 'Grafts',
  drawerLinksEmpty: 'Nothing grafted yet.',
  drawerRightTabsLabel: 'Tutor and grafts',
  tutorDockClose: 'Close, keep dock',
  tutorDockReopen: 'Reopen',
  tutorLensConsistency: 'Consistency',
  tutorLensStructure: 'Structure',
  tutorLensFragments: 'Fragments',
  // ITEM word-diet.
  tutorLensConsistencyEmpty: 'No repeats yet.',
  tutorLensFragmentsEmpty: 'Nothing to resurface yet.',
  tutorLensFragmentsNote: 'Uses recency and shared tags only.',
  // FX12 S2 — tutorStructureNoBeat ("Not linked to a beat.") retired: the beats system
  // is dormant (CD4); the Structure lens no longer speaks that dead language.
  tutorNudgesTitle: 'Waiting for you',
  tutorNudgesEmpty: 'Nothing waiting right now.',
  tutorBibleTitle: "The book's Bible",
  tutorBibleNote: 'Facts you save travel with the book — the Tutor keeps them in mind.',
  tutorBibleEmpty: 'Nothing saved yet.',
  // ITEM word-diet.
  tutorBibleAddPlaceholder: 'Add Note',
  tutorBibleAdd: 'Add',
  tutorBibleEdit: 'Edit',
  tutorBibleDelete: 'Delete',
  tutorBibleSave: 'Save',
  tutorBibleCancel: 'Cancel',
  tutorConversationTitle: 'Talk it through',
  tutorConversationPlaceholder: 'Ask a question…',
  tutorConversationSend: 'Send',
  tutorConversationEmpty: 'Nothing said yet.',
  tutorConversationSending: 'Thinking…',
  // ITEM word-diet. tutorConversationError now pairs with a real "Try
  // again" button (Tutor.tsx) — see that component's own call site.
  tutorConversationOffline: 'Tutor unavailable',
  tutorConversationError: 'Tutor currently unavailable',
  // ITEM word-diet — the new "Try again" button beside the error (Tutor.tsx).
  tutorConversationRetry: 'Try again',
  // E4 — the honest refusal on an UNBORN surface. Same words-family as the
  // one PlacesPanel/AddToSheet already use for the same class of lie (item
  // 88b): name what is missing, name that nothing happened, and say what to
  // do about it. PB1 keeps a page out of the store until its first word, so
  // there is genuinely nothing here for the Tutor to talk about yet.
  // ITEM word-diet.
  tutorConversationUnborn: 'No words sent',
  // the preset labels are strings of record [deskLexicon §40]
  tutorFreeWriteRoster: 'Free Write presets',
  tutorFreeWritePrompt: 'Writing Prompt',
  tutorFreeWriteUnblock: 'Unblock',
  tutorFreeWriteTips: 'Free Writing Tips',
  // NICK'S REFILL RULING — what a spent ask answers a fourth press with, in
  // place of a prompt. THIS LINE IS NICK'S OWN, verbatim: he superseded the
  // desk's three candidates with his own, and it is better than all of them
  // because it carries the unlock CONDITION inside the copy rather than merely
  // reporting a state. Voice law satisfied by a route the candidates missed —
  // an imperative aimed at the ACT ("Write 100 words"), never at the writer.
  //
  // A CONSTANT, and that is load-bearing: no interpolation, no remaining-count,
  // nothing that varies with how much has been written. The threshold is a RULE
  // and may be named; the writer's distance from it is a SCORE and may not
  // (M1/CD4 — the meter stays the only number in this room, and it is a cost,
  // not a score). item84.mjs asserts this structurally, by pressing at zero
  // words and again at forty and requiring the two notes to be byte-identical.
  tutorFreeWriteRefill: 'Write 100 words to unlock more prompts',
  // ITEM 84, THE DRAFT ROSTER — see the id block above for why these four are
  // strings of record and where they came from. The group label is chrome, not an
  // ask, so it carries no question mark and never enters a composer.
  tutorDraftRoster: 'Draft asks',
  tutorDraftAskDrag: "Where does this drag?",
  tutorDraftAskLoadBearing: "What's load-bearing here — and what could go?",
  tutorDraftAskThreadSlip: "Where does the thread slip?",
  tutorDraftAskStretch: "Look at just this stretch — what's it doing?",
  // the chip's FACE, not its prompt (see the DeskTermId union's comment) [deskLexicon §41]
  tutorDraftAskStretchLabel: 'Selection',
  // TD4's disabled-visible state, named. The chip holds its slot without a
  // selection rather than appearing and vanishing (its gate flips by the second,
  // and layout stability outranks purity of absence for that case) — so it owes
  // the writer a reason, and this is it. An instruction aimed at the ACT, never at
  // the writer: the voice law binds chrome as well as asks.
  tutorDraftStretchNeedsSelection: 'Select a stretch on the page first',
  // the selection's honesty line, twin of tutorDeltaTruncated; {n} is the word count of the part actually sent; the model-facing half is plain data in Tutor.tsx, not lexicon [deskLexicon §42]
  tutorSelectionTruncated: 'The first {n} words were sent. Try a shorter passage.',
  tutorDisclosureTitle: 'Before you ask',
  tutorDisclosureBody: 'What you ask the Tutor travels to a language model; your pages stay yours.',
  tutorDisclosureAck: 'Got it',
  tutorDisclosureBodyV2: 'When you ask the Tutor, your question — and any new writing on this page since the Tutor last read it — travels to the language model provider configured for this app. Nothing is ever sent unless you ask. Your pages remain yours.',
  tutorDisclosureBodyV3: "When you ask the Tutor, your question — and any new writing on this page since the Tutor last read it, and any facts you've saved in this book's Bible — travels to the language model provider configured for this app. Nothing is ever sent unless you ask. Your pages remain yours.",
  // behind a "?" beside the Ask box, no standing text [deskLexicon §43]
  tutorDisclosureBodyV4: "Nothing leaves your desk unasked. An ask sends your words, these Pages' recent changes, and your Bible. A counsel that reads more names it on its button, and sends only that, only when pressed.",
  // ITEM word-diet.
  tutorDeltaTruncated: 'Only new writing was sent.',
  tutorMeterTurnCost: 'This turn, est.:',
  tutorMeterSessionTotal: 'This session, est.:',
  // ITEM word-diet.
  tutorMeterTokensOnly: 'This turn (tokens only), est.:',
  tutorMeterTokensUnit: 'tokens',
  cascadePageNewPage: 'New Page', // every "make a new one" button is singular [deskLexicon §44]
  // ITEM 203 - a record too large to sync is NAMED, and the writer is told it is safe here. {title} / {n} are filled in.
  // ITEM word-diet.
  syncTooLargeOne: '\u201C{title}\u201D is too large to sync. Saved on this device.',
  // NOUN-NEUTRAL on purpose: what cannot travel is any synced record (a page, a project, a drawer), so "pages" would sometimes lie.
  syncTooLargeMany: '{n} items too large to sync. Saved on this device.',
  // plain words, no alarm words: each says what is true and the one act that prevents loss, for the state it names [deskLexicon §45]
  syncStorageFullPending: 'Storage full. Keep Wrizo open until this syncs.',
  syncStorageFullSynced: 'Storage full. Your changes synced, but this device can\u2019t keep a copy.',
  // names WHERE the download is [deskLexicon §46]
  syncStorageFullAnon: 'Storage full. Download a copy now from Publish.',
  syncStorageNearFull: 'Storage low. Stay online so your writing syncs.',
  // near-full reads the same way for a signed-out writer [deskLexicon §47]
  syncStorageNearFullAnon: 'Storage low. Download a copy now from Publish.',
  // ITEM 224(a) \u2014 a different cause from too-large: the record traveled
  // fine and the server itself could not store it. Still safe here, still
  // retried; the words say so rather than naming a size limit that isn't
  // the reason.
  syncRejectedOne: 'Couldn\u2019t save \u201c{title}\u201d to your account. Safe here; still trying.',
  logoutBlockedBody: '{n} changes haven’t saved yet. Stay signed in, or sign out and lose them.',
  // ITEM word-diet.
  logoutBlockedRejected: 'Not saved: {titles}.',
  logoutStay: 'Stay signed in',
  logoutAnyway: 'Sign out and lose {n} changes',
  logoutAnywayConfirm: 'Yes, lose {n} changes',
  logoutAnywayBack: 'Keep them',
  logoutBlockedBodyOne: '1 change hasn’t saved yet. Stay signed in, or sign out and lose it.',
  logoutAnywayOne: 'Sign out and lose 1 change',
  logoutSigningOut: 'Signing out\u2026',
  logoutAnywayConfirmOne: 'Yes, lose 1 change',
  // B10.1 - counts only, never titles or text. Reload fetches the account's pages again.
  syncPullShort: '{pulled} Pages sent, {live} showing. Reload to retry.',
  staleClientBody: 'Wrizo updated, reload',
  staleClientReload: 'Reload',
  syncRejectedMany: '{n} items couldn\u2019t save to your account. Safe here; still trying.',
  // ITEM 83 M3 (R6). Sentence case on rows, engraved-uppercase on the heading
  // (§1.4) — the heading's dress is CSS, so the term itself stays readable.
  pageSetupHeading: 'Page setup',
  pageSetupMargins: 'Margins',
  pageSetupMarginsNormal: 'Normal',
  pageSetupMarginsNarrow: 'Narrow',
  pageSetupMarginsWide: 'Wide',
  pageSetupLineSpacing: 'Line spacing',
  pageSetupNumbers: 'Page numbers',
  pageSetupNumbersPlacementBottomCenter: 'Bottom centre',
  pageSetupNumbersPlacementBottomRight: 'Bottom right',
  pageSetupNumbersPlacementTopRight: 'Top right',
  pageSetupHeaders: 'Headers',
  pageSetupFooters: 'Footers',
  pageSetupHeaderText: 'Header text',
  pageSetupFooterText: 'Footer text',
  // ITEM word-diet.
  pageSetupSaveDefaults: 'Make Default',
  pageSetupSavedDefaults: 'Saved as your default.',
  pageSetupOn: 'On',
  pageSetupOff: 'Off',
  // F6's default, said plainly on the surface rather than left to be
  // discovered: numbers/headers/footers are sheet furniture for printed and
  // exported output; the screen page stays one continuous sheet.
  pageSetupExportNote: 'Numbers, headers and footers appear on export and print — the page on screen stays continuous.',
  // ITEM 83 M4 (R1) — Free Write's STYLING zone. Underline joins Bold and
  // Italic by founder word, overruling Chamber 1's "nothing else".
  stylingHeading: 'Styling',
  stylingOpen: 'Open Styling',
  stylingClose: 'Close Styling',
  stylingBold: 'Bold (Ctrl+B)',
  stylingItalic: 'Italic (Ctrl+I)',
  stylingUnderline: 'Underline (Ctrl+U)',
  stylingStrike: 'Strikethrough',
  // the card pop-up's X: its accessible name (aria-label and title) [deskLexicon §48]
  boardPopupClose: 'Close',
  // the Typewriter menu: "Forward Lock" and "Line Fade" [deskLexicon §49]
  twMenuHeading: 'Typewriter',
  twForwardLock: 'Forward Lock',
  twForwardLockWindow: 'Window',
  twUnitWords: 'Words',
  twUnitSentences: 'Sentences',
  twLineFade: 'Line Fade',
  twLineFadeLines: 'Lines shown',
  twWritingLine: 'Writing line',
  twLineTop: 'Top',
  twLineCenter: 'Centre',
  twLineBottom: 'Bottom',
  twPageScroll: 'Page Scroll',
  // ITEM 83 M4 (R5/R12) — the foot's three instruments, on every
  // page-writing surface. Theme leaves the foot for the rail's own category.
  footTypewriter: 'Typewriter',
  footProgress: 'Progress',
  footFullScreen: 'Full Screen',
  footTarget: 'Target',
  // ITEM 83 M5 (R4) — Draft's roster. Destination-named verbs (DR3's bench
  // law): never a bare 'Convert'.
  draftHeading: 'Heading',
  draftHeadingUp: 'Larger heading',
  draftHeadingDown: 'Smaller heading',
  draftBullet: 'Round bullet',
  draftBulletCircle: 'Hollow bullet',
  draftBulletSquare: 'Square bullet',
  draftBulletStyles: 'Bullet styles',
  railTemplates: 'Templates',
  railActions: 'Actions',
  actionTags: 'Tags',
  actionCopy: 'Copy page text',
  actionDelete: 'Delete page',
  actionHeaderFooter: 'Header and footer',
  actionTagRemove: 'Remove',
  actionDeleteConfirm: 'Send this page to Trash?',
  actionDeleteYes: 'Send to Trash',
  actionDeleteKeep: 'Keep',
  railPageKind: 'Pages Kind', // ITEM word-diet, pages-rename bucket (a)
  templateOutline: 'Outline',
  templateBibliography: 'Bibliography',
  templateTitlePage: 'Title Page',
  // PAGE TEMPLATES (approved mockup cursor/templates @ 0fc9afef) - the five rows of the picker, Arbor's words; Flux's are below. 'Custom' is
  // dropped with the mockup. templateOpenedNewBack is the return chip's caption on a page a template pick opened (the words never moved).
  templateBlank: 'Blank',
  templateScreenplay: 'Screenplay',
  templateOpenedNewBack: 'Opened as a new page · Back',
  comingSoon: 'Coming soon',
  // Arbor's word for the type section is "Font"; Flux keeps "Typeface" (its override, below) [deskLexicon §50]
  railTypeface: 'Font',
  goalUnitWords: 'words',
  footSettings: 'Settings',
  footMenuTypewriter: 'Typewriter Mode',
  footMenuProgress: 'Progress Tracking',
  modeToggleTypewriter: 'Typewriter mode',
  modeToggleProgress: 'Progress tracking',
  formatLockedByTypewriter: 'Typewriter Mode is on',
  footMenuPreferences: 'Preferences',
  footMenuFlicker: 'Flicker',
  draftQuote: 'Block quote',
  draftIndent: 'Indent',
  draftOutdent: 'Outdent',
  draftSpacing: 'Line spacing',
  typeGroup: 'Type',
  typeFace: 'Typeface',
  // highlighted words take the face alone; the whole choice changes all [deskLexicon §51]
  typeScope: 'Apply the typeface to',
  typeScopeSelection: 'Selection',
  typeScopeWholeDocument: 'Whole document',
  typeScopeWholeCard: 'Whole card',
  typeSmaller: 'Smaller',
  typeLarger: 'Larger',
  typeSize: 'Size in points',
  draftAlignment: 'Alignment',
  draftAlignLeft: 'Align left',
  draftAlignCenter: 'Align centre',
  draftAlignRight: 'Align right',
  draftConvertToScreenplay: 'Convert to Screenplay…',
  draftConvertToProse: 'Convert to Prose…',
  // the two sub-labels are written as the DIFFERENCE between the controls they head: what the page IS, and an act ON it [deskLexicon §52]
  structureKindLabel: 'This page is',
  structureActLabel: 'Change the page itself',
  structureStyleGuideLabel: 'Style guide',
  kindNormal: 'Normal',
  kindScreenplay: 'Screenplay',
  kindResearch: 'Research',
  styleGuideMla: 'MLA',
  styleGuideApa: 'APA',
  styleGuideChicago: 'Chicago',
  styleGuideAp: 'AP',
  openPagesHeading: 'Open Pages',
  openPagesSort: 'Sort Pages',
  openPagesMore: 'More for this Page',
  openPagesPlace: 'Place on this board',
  sectionsHeading: 'Sections',
  sectionsOrder: 'Order',
  sectionsRows: 'Rows',
  sectionsGrid: 'Grid',
  sectionsNewSet: '＋ New set',
  sectionsNewSetName: 'Name the set',
  sectionsPresets: 'Presets',
  sectionsNewBoard: 'New Board',
  sectionsEmptyBoards: 'No boards here yet.',
  placeRootName: 'Top Drawer',
  sectionsMoved: 'Moved to the Journal.',
  sectionsUndo: 'Undo',
  sectionsTakeOut: 'Take out of this Drawer',
  sectionsEmpty: 'No pages here yet.',
  sectionsReorder: 'Drag to reorder',
  switcherHeading: 'Where you are',
  switcherDrawers: 'Drawers',
  switcherJournals: 'Journals',
  switcherNewDrawer: '＋ New Drawer',
  switcherNewDrawerName: 'Name the Drawer',
  switcherUnsorted: 'Unsorted',
  placeSortDate: 'Date',
  placeSortDrawer: 'Drawer',
  placeSortAZ: 'A–Z',
  placePageEmpty: 'No pages yet.',
  planNewCard: '＋ New card',
  planFitToContent: 'Fit to content',
  // ITEM 83 M7 (PP1) — a VERB PHRASE naming the act, not a noun. The old
  // accessible name was the bare noun 'Home'; promoted to the eye it would
  // have read as a destination, which is the confusion being closed.
  placesHomeHeading: 'This page lives in…',
  cascadePlanJustAPage: 'Just need a page? New Page is in the Page section.',
  boardNewPageCard: 'New Page', // every "make a new one" button is singular [deskLexicon §53]
  // no box can be a board today, so "Add Cards or Pages", not three nouns [deskLexicon §54]
  boardCanvasEmpty: 'Add Cards or Pages',
  drawerPlaceTrash: 'Trash',
  cascadeTrashOpen: 'Open the Trash',
  boardRestore: 'Restore',
  // ITEM word-diet.
  boardHomeLabelJournal: 'Journal',
  boardHomeLabelTrash: 'Trash',
  boardHomeLabelShelf: 'Shelf',
  shelfBoardEmpty: 'Nothing waiting.',
  cascadeShelfOpen: 'Open the Shelf',
  // opens the same ExistingPagePicker as beginConnectPage: one act, one name [deskLexicon §55]
  boardAddExistingPage: '+ Filed Pages',
  placesTitle: 'Places',
  placesHomeZoneLabel: 'Home',
  placesLoose: 'Loose',
  // ITEM 83 M7 (PP4) — names the act, not just the object: this is a
  // put-family gesture (create the place AND file here in one move), and it
  // sits among put-family rows. The flow itself is unchanged.
  placesNewDrawer: 'File to a new drawer…',
  placesNewDrawerPlaceholder: 'Drawer name',
  placesNewDrawerCreate: 'Create',
  placesNewDrawerCancel: 'Cancel',
  // the eye gets the honest sentence the ear already had; "grafted" names membership, not appearing on the canvas [deskLexicon §56]
  placesBoardsTitle: 'Also grafted to…',
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

  // B3 S1 — the deck engine's own chrome.
  deckWizardStartFromDeck: 'Start from a deck…',
  deckWizardFromDeck: 'From a deck…',
  deckWizardChooseTitle: 'Choose a deck',
  deckWizardBack: 'Back',
  deckWizardCancel: 'Cancel',
  deckWizardContinue: 'Continue',
  deckWizardClose: 'Close',
  deckStartHereLabel: 'Start Here',
  deckRoomFiction: 'The Fiction Room',
  deckRoomSpeculative: 'The Speculative Annex',
  deckRoomScreen: 'The Screen Room',
  deckRoomAcademy: 'The Academy',
  deckRoomBusiness: 'The Business Desk',
  deckRoomNewsroom: 'The Newsroom',

  // B3 S2 — the seven deck names.
  deckNameThreeAct: 'Three-Act Structure',
  deckNameWorldbuilding: 'Worldbuilding',
  deckNameFeatureScreenplay: 'Feature Screenplay',
  deckNameThesis: 'Thesis / Dissertation',
  deckNameGrant: 'Grant Application',
  deckNameFeatureStory: 'Feature Story',
  deckNameCharacterStudy: 'Character Study',

  // Three-Act Structure.
  deckThreeActQPrompt: 'What are you writing?',
  deckThreeActOptNovel: 'Novel',
  deckThreeActOptNovella: 'Novella',
  deckThreeActOptShortStory: 'Short story',
  deckThreeActHookTitle: 'Hook',
  deckThreeActHookBody: 'The first image or line that pulls a reader in — what starts this story?',
  deckThreeActIncitingTitle: 'Inciting Incident',
  deckThreeActIncitingBody: 'The event that knocks the ordinary world off balance.',
  deckThreeActThresholdTitle: 'First Threshold',
  deckThreeActThresholdBody: 'The point of no return — what commits your protagonist to the journey?',
  deckThreeActComplicationsTitle: 'Rising Complications',
  deckThreeActComplicationsBody: 'What keeps getting harder, and why can’t they just walk away?',
  deckThreeActMidpointTitle: 'Midpoint Reversal',
  deckThreeActMidpointBody: 'The moment everything the protagonist believed gets flipped.',
  deckThreeActDarkestTitle: 'Darkest Point',
  deckThreeActDarkestBody: 'The lowest moment — what does defeat look like here?',
  deckThreeActClimaxTitle: 'Climax',
  deckThreeActClimaxBody: 'The final confrontation — what’s actually being decided?',
  deckThreeActResolutionTitle: 'Resolution',
  deckThreeActResolutionBody: 'What settles, and what’s different now?',
  deckThreeActFinalImageTitle: 'Final Image',
  deckThreeActFinalImageBody: 'The mirror of the hook — how has the world (or the reader’s view of it) changed?',

  // Worldbuilding.
  deckWorldbuildingQPrompt: 'What kind of world?',
  deckWorldbuildingOptFantasy: 'Fantasy',
  deckWorldbuildingOptSF: 'Science fiction',
  deckWorldbuildingOptOther: 'Other',
  deckWorldbuildingRulesTitle: 'Rules of the World',
  deckWorldbuildingRulesBodyFantasy: 'What can magic do, and what does it cost?',
  deckWorldbuildingRulesBodySF: 'What can the technology do, and what does it cost?',
  deckWorldbuildingRulesBodyOther: 'What are this world’s own rules, and what do they cost?',
  deckWorldbuildingHistoryTitle: 'Deep History',
  deckWorldbuildingHistoryBody: 'What happened long before page one that still shapes it?',
  deckWorldbuildingPlacesTitle: 'Places & Maps',
  deckWorldbuildingPlacesBody: 'Where does this story happen, and what does the shape of the land demand?',
  deckWorldbuildingCulturesTitle: 'Cultures & Factions',
  deckWorldbuildingCulturesBody: 'Who are the groups, and what does each one want?',
  deckWorldbuildingPowerTitle: 'Power & Economy',
  deckWorldbuildingPowerBody: 'Who has power, who wants it, and what does it run on?',
  deckWorldbuildingLanguageTitle: 'Language Notes',
  deckWorldbuildingLanguageBody: 'Words, names, and turns of phrase that belong only to this world.',
  deckWorldbuildingIcebergTitle: 'The Iceberg',
  deckWorldbuildingIcebergBody: 'What do you know that the reader never sees — but that makes everything else true?',

  // Feature Screenplay (Save the Cat's 15).
  deckScreenplayQPrompt: 'What is this for?',
  deckScreenplayOptFeature: 'Feature',
  deckScreenplayOptPilot: 'Pilot',
  deckScreenplayPilotNote: 'TV Pilot decks are coming in a future release — this deals Save the Cat’s 15 for a feature.',
  deckScreenplayOpeningImageTitle: 'Opening Image',
  deckScreenplayOpeningImageBody: 'The first snapshot of your protagonist’s world, before anything changes.',
  deckScreenplayThemeStatedTitle: 'Theme Stated',
  deckScreenplayThemeStatedBody: 'Someone says, almost in passing, what this story is really about.',
  deckScreenplaySetupTitle: 'Set-Up',
  deckScreenplaySetupBody: 'The world, the stakes, and what’s missing from the protagonist’s life.',
  deckScreenplayCatalystTitle: 'Catalyst',
  deckScreenplayCatalystBody: 'The event that sets the story in motion — there’s no going back after this.',
  deckScreenplayDebateTitle: 'Debate',
  deckScreenplayDebateBody: 'Should they go? The protagonist’s last hesitation before committing.',
  deckScreenplayBreakTwoTitle: 'Break into Two',
  deckScreenplayBreakTwoBody: 'The protagonist chooses — and steps into the upside-down version of their world.',
  deckScreenplayBStoryTitle: 'B Story',
  deckScreenplayBStoryBody: 'The relationship that carries the story’s theme.',
  deckScreenplayFunGamesTitle: 'Fun and Games',
  deckScreenplayFunGamesBody: 'The promise of the premise — the trailer moments.',
  deckScreenplayMidpointTitle: 'Midpoint',
  deckScreenplayMidpointBody: 'A false victory or false defeat that raises the stakes as the clock starts ticking.',
  deckScreenplayBadGuysTitle: 'Bad Guys Close In',
  deckScreenplayBadGuysBody: 'External and internal pressure both tighten.',
  deckScreenplayAllIsLostTitle: 'All Is Lost',
  deckScreenplayAllIsLostBody: 'The lowest point — something (or someone) dies, literally or symbolically.',
  deckScreenplayDarkNightTitle: 'Dark Night of the Soul',
  deckScreenplayDarkNightBody: 'The protagonist, alone, before they find the way through.',
  deckScreenplayBreakThreeTitle: 'Break into Three',
  deckScreenplayBreakThreeBody: 'The solution arrives, born from the A and B stories combining.',
  deckScreenplayFinaleTitle: 'Finale',
  deckScreenplayFinaleBody: 'The protagonist proves they’ve changed by taking down the bad guys their own new way.',
  deckScreenplayFinalImageTitle: 'Final Image',
  deckScreenplayFinalImageBody: 'The mirror of the opening image — proof of the change.',

  // Thesis / Dissertation.
  deckThesisQPrompt: 'Humanities or sciences?',
  deckThesisOptHumanities: 'Humanities',
  deckThesisOptSciences: 'Sciences',
  deckThesisQuestionTitle: 'Research Question',
  deckThesisQuestionBody: 'The single question this whole thesis exists to answer.',
  deckThesisLitReviewTitle: 'Lit-Review Clusters',
  deckThesisLitReviewBody: 'Group the existing work into conversations, not just a list.',
  deckThesisMethodologyTitle: 'Methodology',
  deckThesisMethodologyBody: 'How you’ll actually answer the question — and why this method fits it.',
  deckThesisEvidenceTitle: 'Evidence Parking Lot',
  deckThesisEvidenceBody: 'Findings, quotes, and data waiting for a home in the argument.',
  deckThesisCitationTitle: 'Citation Ledger',
  deckThesisCitationBody: 'Every source you’ll need to cite, tracked as you go.',
  deckThesisChapterOneTitle: 'Chapter One',
  deckThesisChapterOneBody: 'What does this chapter need to establish before the next can build on it?',
  deckThesisChapterTwoTitle: 'Chapter Two',
  deckThesisChapterTwoBody: 'Where does the argument deepen or complicate itself?',
  deckThesisChapterThreeTitle: 'Chapter Three',
  deckThesisChapterThreeBody: 'Where does the argument turn toward its own implications?',
  deckThesisConclusionTitle: 'Conclusion',
  deckThesisConclusionBody: 'What have you actually shown, and what does it change?',
  deckThesisIntroTitle: 'Introduction',
  deckThesisIntroBody: 'The gap in the existing literature this work fills.',
  deckThesisMethodsTitle: 'Methods',
  deckThesisMethodsBody: 'Exactly what you did, in enough detail to be repeated.',
  deckThesisResultsTitle: 'Results',
  deckThesisResultsBody: 'What you found — reported straight, before any interpretation.',
  deckThesisDiscussionTitle: 'Discussion',
  deckThesisDiscussionBody: 'What the results mean, and what they don’t.',

  // Grant Application.
  deckGrantQPrompt: 'What kind of funder?',
  deckGrantOptFoundation: 'Foundation',
  deckGrantOptGovernment: 'Government',
  deckGrantOptCorporate: 'Corporate',
  deckGrantNeedTitle: 'Need Statement',
  deckGrantNeedBody: 'The problem, stated plainly, with the evidence that it’s real.',
  deckGrantObjectivesTitle: 'Objectives',
  deckGrantObjectivesBody: 'What will be different, specifically, if this is funded?',
  deckGrantMethodsTitle: 'Methods',
  deckGrantMethodsBody: 'How the work actually gets done, step by step.',
  deckGrantEvaluationTitle: 'Evaluation Plan',
  deckGrantEvaluationBody: 'How you’ll know it worked — and how you’ll show it.',
  deckGrantBudgetTitle: 'Budget Justification',
  deckGrantBudgetBody: 'Every line, tied back to a specific piece of the work.',
  deckGrantAlignmentTitle: 'Funder Alignment',
  deckGrantAlignmentBodyFoundation: 'Their mission, in their own words — and where this work meets it.',
  deckGrantAlignmentBodyGovernment: 'The program’s own stated priorities — and where this work meets them.',
  deckGrantAlignmentBodyCorporate: 'Their stated giving priorities — and where this work meets them.',

  // Feature Story.
  deckFeatureStoryQPrompt: 'What kind of feature?',
  deckFeatureStoryOptProfile: 'Profile',
  deckFeatureStoryOptTrend: 'Trend',
  deckFeatureStoryOptInvestigative: 'Investigative-lite',
  deckFeatureStoryNutGrafTitle: 'Nut Graf',
  deckFeatureStoryNutGrafBodyProfile: 'In one paragraph: who is this person, and why does this story matter now?',
  deckFeatureStoryNutGrafBodyTrend: 'In one paragraph: what’s the trend, and why does it matter now?',
  deckFeatureStoryNutGrafBodyInvestigative: 'In one paragraph: what did you find, and why does it matter now?',
  deckFeatureStoryLedeATitle: 'Lede Candidate A',
  deckFeatureStoryLedeABody: 'A scene-first opening — drop the reader into a moment.',
  deckFeatureStoryLedeBTitle: 'Lede Candidate B',
  deckFeatureStoryLedeBBody: 'A voice-first opening — let a quote or a line of dialogue lead.',
  deckFeatureStoryLedeCTitle: 'Lede Candidate C',
  deckFeatureStoryLedeCBody: 'A fact-first opening — the single detail that earns the whole story.',
  deckFeatureStorySourceOneTitle: 'Source & Quote (1)',
  deckFeatureStorySourceOneBody: 'Who said what — and why they’re the right person to say it.',
  deckFeatureStorySourceTwoTitle: 'Source & Quote (2)',
  deckFeatureStorySourceTwoBody: 'A second voice — ideally one that complicates the first.',
  deckFeatureStorySceneOneTitle: 'Scene Card (1)',
  deckFeatureStorySceneOneBody: 'A moment you can actually show, not summarize.',
  deckFeatureStorySceneTwoTitle: 'Scene Card (2)',
  deckFeatureStorySceneTwoBody: 'A second moment, from later in the reporting.',
  deckFeatureStoryKickerATitle: 'Kicker Candidate A',
  deckFeatureStoryKickerABody: 'A closing line that echoes the lede.',
  deckFeatureStoryKickerBTitle: 'Kicker Candidate B',
  deckFeatureStoryKickerBBody: 'A closing line that opens back out to the wider point.',

  // Character Study.
  deckCharacterStudyQPrompt: 'How many characters in this study?',
  deckCharacterStudyOptTwo: 'Two',
  deckCharacterStudyOptThree: 'Three',
  deckCharacterStudyOptFour: 'Four',
  deckCharacterStudyLabel: 'Character',
  // W3 - generated from w3-deck-content.md: the new Tier 1 decks' names, wizard words and step titles (see the union above).
  deckNameHeroJourney: 'Hero’s Journey',
  deckNameStoryCircle: 'Story Circle',
  deckNameSceneSequel: 'Scene–Sequel',
  deckNameArgumentEssay: 'Argumentative Essay',
  deckNameResearchPaper: 'Research Paper (IMRaD)',
  deckNameBusinessProposal: 'Business Proposal',
  deckNameFromMyPages: 'From my pages',
  deckRoomEvery: 'Every Room',
  deckHeroQPrompt: 'What are you writing?',
  deckHeroOptNovel: 'Novel',
  deckHeroOptShortStory: 'Short story',
  deckSceneSequelQPrompt: 'How many scenes to lay out?',
  deckSceneSequelOptOne: 'One',
  deckSceneSequelOptThree: 'Three',
  deckSceneSequelOptFive: 'Five',
  deckSceneSequelLabel: 'Scene',
  deckArgumentQPrompt: 'How long?',
  deckArgumentOptShort: 'Short',
  deckArgumentOptFull: 'Full',
  deckScreenplayOptNovel: 'Novel',
  deckHeroOrdinaryWorldTitle: 'Ordinary World',
  deckHeroCallTitle: 'Call to Adventure',
  deckHeroRefusalTitle: 'Refusal of the Call',
  deckHeroMentorTitle: 'Meeting the Mentor',
  deckHeroThresholdTitle: 'Crossing the Threshold',
  deckHeroTestsTitle: 'Tests, Allies, Enemies',
  deckHeroApproachTitle: 'Approach to the Inmost Cave',
  deckHeroOrdealTitle: 'Ordeal',
  deckHeroRewardTitle: 'Reward',
  deckHeroRoadBackTitle: 'The Road Back',
  deckHeroResurrectionTitle: 'Resurrection',
  deckHeroReturnTitle: 'Return with the Elixir',
  deckCircleYouTitle: 'You',
  deckCircleNeedTitle: 'Need',
  deckCircleGoTitle: 'Go',
  deckCircleSearchTitle: 'Search',
  deckCircleFindTitle: 'Find',
  deckCircleTakeTitle: 'Take',
  deckCircleReturnTitle: 'Return',
  deckCircleChangeTitle: 'Change',
  deckSceneSequelGoalTitle: 'Goal',
  deckSceneSequelConflictTitle: 'Conflict',
  deckSceneSequelDisasterTitle: 'Disaster',
  deckSceneSequelReactionTitle: 'Reaction',
  deckSceneSequelDilemmaTitle: 'Dilemma',
  deckSceneSequelDecisionTitle: 'Decision',
  deckArgumentClaimTitle: 'Claim',
  deckArgumentCounterclaimTitle: 'Counterclaim',
  deckArgumentEvidence1Title: 'Evidence (1)',
  deckArgumentEvidence2Title: 'Evidence (2)',
  deckArgumentEvidence3Title: 'Evidence (3)',
  deckArgumentSynthesisTitle: 'Synthesis',
  deckArgumentSoWhatTitle: 'So What',
  deckImradIntroductionTitle: 'Introduction',
  deckImradMethodsTitle: 'Methods',
  deckImradResultsTitle: 'Results',
  deckImradDiscussionTitle: 'Discussion',
  deckImradAbstractTitle: 'Abstract (write me last)',
  deckProposalProblemTitle: 'Problem',
  deckProposalSolutionTitle: 'Solution',
  deckProposalMarketTitle: 'Market',
  deckProposalAskTitle: 'The Ask',
  deckProposalTimelineTitle: 'Timeline',
  deckProposalBudgetTitle: 'Budget',
  deckProposalObjectionsTitle: 'Objections',
  // W3 - the step '?': Arbor '?' / 'more'; Flux '[?]' / 'MORE'. {step} is the card's own title.
  deckStepHelpGlyph: '?',
  deckStepHelpMore: 'more',
  deckStepHelpLabel: 'What does this step do?',
  deckStepHelpAsk: 'What does {step} do?',
  deckFromMyPagesQPrompt: 'Which pages, in what order?',
  deckFromMyPagesDeal: 'Deal these',
  deckFromMyPagesNone: 'No pages here yet.',
  deckCharacterStudyWantNeedTitle: 'Want vs. Need',
  deckCharacterStudyWantNeedBody: 'What they think they want — and what they actually need.',
  deckCharacterStudyWoundTitle: 'The Wound',
  deckCharacterStudyWoundBody: 'The old injury that still runs the show.',
  deckCharacterStudyContradictionTitle: 'The Contradiction',
  deckCharacterStudyContradictionBody: 'The thing about them that doesn’t add up — on purpose.',
  deckCharacterStudyVoiceTitle: 'Voice Notes',
  deckCharacterStudyVoiceBody: 'How they talk that no one else in the story does.',
  deckCharacterStudyRelationshipTitle: 'Relationship',
  deckCharacterStudyRelationshipBody: 'What do they want from each other — and what’s unresolved between them?',

  // M2 S1 — the Progress-style setting.
  progressStyleLabel: 'Progress style',
  progressStyleBar: 'Bar',
  progressStyleRhizome: 'Rhizome',

  // the Recede-depth explanation lives here, behind the shared "?"; the Settings panel carries no standing text [deskLexicon §57]
  recedeHint: 'Type and the menus fade; pause, reach an edge, or press Esc to bring them back.',
  fadeDepthLabel: 'Recede depth',
  fadeDepthPartial: 'Partial',
  fadeDepthFull: 'Full',
  timerLabel: 'Timer',

  // one plain sentence per themed word, Arbor's forms; Flux's are in OVERRIDES [deskLexicon §58]
  helpGrafts: 'Grafts join pages, cards and boards.',
  helpTemplates: 'Ready-made page layouts.',
  helpFreeWrite: 'Write forward only. No going back to edit.',
  helpPublish: 'Share a page as a link or a file.',
  helpOutline: 'Numbered levels. Tab indents.',
  helpTitlePage: 'A standard manuscript title page.',
  // Arbor's picker never renames these rows, so no "?" shows; only renamed rows carry an explainer [deskLexicon §59]
  helpTemplateBlank: 'A blank page. Nothing written yet.',
  helpTemplateScreenplay: 'Sluglines, dialogue, action — the screenplay format.',
  helpTemplateBibliography: 'A sources and citations page.',

  // E1 S2 — Publish's copy path.
  // ITEM word-diet.
  publishCopyWordsConfirm: 'Copied',
  publishCopyFormattedConfirm: 'Copied — with formatting intact.',
  publishCopyFailed: 'Copy failed. Try again, or use Download.',

  // E1 S3 — Download.
  publishDownloadTitle: 'Download',
  publishDownloadPageMd: 'Current Pages (.md)',
  publishDownloadPageTxt: 'Current Pages (.txt)',
  publishDownloadBinder: 'This Binder',
  publishDownloadEverything: 'Everything',
  publishDownloadConfirm: 'Downloading — check your downloads.',
  publishDownloadFailed: 'Download failed. Nothing lost; try again.',
  publishComingSoon: 'More publishing options coming soon.',

  // ITEM 224 — the invite-code field.
  authInviteCodePlaceholder: 'invite code',
  authSignupByInvitation: 'By invitation, for now.',

  // ITEM splash-hold, ROUND 3 — Arbor's own voice, a tree/garden register
  // matching the rest of this theme's own vocabulary (Graft, Rhizome).
  splashLoading1: 'Gathering your pages…',
  splashLoading2: 'Turning the soil…',
  splashLoading3: 'Watering the roots…',
  splashLoading4: 'Opening the notebook…',
  // W4 - the "why" lines of Help me choose (decks/helpMeChoose.ts whyKeyFor). Deck content: the other themes' lexicons do not translate them.
  helpWhyStoryCircle: 'One person changes, and you want to follow that change from comfort to return.',
  helpWhyThreeAct: 'Events press on someone, and you want a spine to hang them on.',
  helpWhyWorldbuilding: 'The world comes first, so you start by laying out how it works.',
  helpWhyCharacterStudy: 'People are what you have so far, and you want to see how they pull on each other.',
  helpWhyFromMyPages: 'You would rather write first, so the shape can come after, from pages you already have.',
  helpWhyThreeActShortStory: 'A short story needs a spine too, only a tighter one: six beats and no padding.',
  helpWhyCharacterStudyTwo: 'Two people carry this one, so the study sets them side by side.',
  helpWhyFeatureScreenplayFeature: 'A feature is fifteen beats of picture, and you want them laid out before you write.',
  helpWhyFeatureScreenplayPilot: "A pilot uses the feature's fifteen beats for now; the deck notes where a pilot differs.",
  helpWhyArgumentEssayFull: 'You have a position to defend, so the essay runs claim, evidence and counterclaim in order.',
  helpWhyResearchPaper: 'A question and a method call for the usual order: introduction, method, results, discussion.',
  helpWhyThesisHumanities: 'A long argument in chapters needs a frame the chapters can lean on.',
  helpWhyThesisSciences: "A question and a method: the sciences' thesis runs from foundations to findings.",
  helpWhyBusinessProposal: 'A problem and a solution make a proposal: what is wrong, what you would do, why you.',
  helpWhyGrant: "A funder's priorities set the shape, so the application answers them in their own order.",
  helpWhyFeatureStoryProfile: 'A person is the story, and a profile gives their scenes and their stakes room.',
  helpWhyFeatureStoryTrend: 'A trend needs proof that it is one, so the feature gathers its cases before its claim.',
  helpWhyFeatureStoryInvestigative: "Something you found needs a trail, so the feature lays out what you know and don't.",
  // W4 - Help me choose: chrome + the questions' answers (label, hint) + the deck cover lines. The ANSWERS and the COVERS are deck content (every theme reads them); the chrome words take theme overrides.
  helpDoor: 'Ask the librarian',
  // MACHINA FORMS (m7 / m8): the panel's own words. Canonical English; only Machina draws them (the deck library reads the deck wizard's Arbor / Flux wording elsewhere).
  formsIntakeHint: 'three fields, one recommendation',
  formsBlocksHead: 'Blocks',
  formsFoot: '↑ ↓ Move · Enter Create Agenda · Esc Close',
  formsFootBlocks: 'Blocks',
  helpDialogLabel: 'Help me choose',
  helpKicker: 'The librarian',
  helpPickKicker: "The librarian's pick",
  helpMaking: "You're making",
  helpQ1Prompt: 'What are you making?',
  helpQ2Prompt: 'What carries it?',
  helpQ3Prompt: 'How much do you want to know before you start?',
  helpBegin: 'Begin',
  helpAlt: 'or',
  helpBrowse: 'Browse the shelves',
  helpClose: 'Esc to close',
  helpBack: 'Back',
  helpStepOf: 'Step {n} of 3',
  // MACHINA INTAKE (m5 / m6): canonical English; only Machina's Intake draws these.
  typeFaceDefault: 'Default ({face})',
  // the writer's own installed fonts (device-local); the missing-face note is quiet and says what happens [deskLexicon §60]
  typeAddFont: 'Add a font…',
  typeAddFontName: 'Font name',
  typeAddFontLookup: 'Find installed fonts',
  typeAddFontAdd: 'Add',
  typeFaceMissing: 'not on this device - showing the default',
  helpFieldsNote: '3 fields · nothing stored',
  helpFieldsCount: '{n} / 3',
  helpFieldDocument: 'Document',
  helpFieldCarried: 'Carried by',
  helpFieldBriefing: 'Briefing',
  helpChoose: '— choose —',
  helpNoCarried: 'not asked for this one',
  helpBlocksN: '{n} blocks',
  helpANovel: 'a novel or novella',
  helpHNovel: 'a long story, front to back',
  helpAShortStory: 'a short story',
  helpHShortStory: 'one sitting, one turn',
  helpAScreenplay: 'a screenplay or pilot',
  helpHScreenplay: 'pictures and talk, in scenes',
  helpAEssay: 'an essay or argument',
  helpHEssay: 'a case you mean to make',
  helpAResearchPaper: 'a research paper',
  helpHResearchPaper: 'a question, a method, a finding',
  helpAThesis: 'a thesis or dissertation',
  helpHThesis: 'the long work, in chapters',
  helpAProposal: 'a proposal or grant',
  helpHProposal: 'asking someone for something',
  helpAArticle: 'an article or profile',
  helpHArticle: 'a true story, told well',
  helpAWorldOrCast: 'a world or a cast, before the story',
  helpHWorldOrCast: 'the place or the people first',
  helpAPoems: 'poems or a sequence',
  helpHPoems: 'lines before structure',
  helpAPersonChange: "a person's change",
  helpHPersonChange: 'someone wants something, and pays for it',
  helpAEventsPressure: 'events and pressure',
  helpHEventsPressure: 'things happen, and something has to give',
  helpAWorldSystem: 'a world or a system',
  helpHWorldSystem: 'the place is the story: its rules, its maps',
  helpARelationshipCast: 'a relationship or a cast',
  helpHRelationshipCast: 'the people, and what pulls between them',
  helpAImageVoice: 'an image or a voice',
  helpHImageVoice: "one picture you can't stop seeing",
  helpAFeature: 'a feature',
  helpHFeature: 'a full-length film',
  helpAPilot: 'a pilot',
  helpHPilot: 'the first episode of a series',
  helpAPosition: "a position I'm defending",
  helpHPosition: 'a claim, and the case for it',
  helpAQuestion: "a question I'm still answering",
  helpHQuestion: "you don't know the answer yet",
  helpAQuestionMethod: 'a question and a method',
  helpHQuestionMethod: 'what you asked, and how you looked',
  helpAArgumentChapters: 'a long argument in chapters',
  helpHArgumentChapters: 'one claim, carried across the book',
  helpAProblemSolution: 'a problem and a solution',
  helpHProblemSolution: 'what is wrong, and what you would do',
  helpAFunderPriorities: "a funder's priorities",
  helpHFunderPriorities: 'their questions set the shape',
  helpAPerson: 'a person',
  helpHPerson: 'a profile: one life, closely',
  helpATrend: 'a trend',
  helpHTrend: 'a pattern, with the cases that prove it',
  helpAFound: 'something I found',
  helpHFound: 'a lead, and where it goes',
  helpAWorld: 'the world',
  helpHWorld: 'the place, before anyone in it',
  helpAPeople: 'the people',
  helpHPeople: 'who they are, before what happens',
  helpALittle: "a little (I'm new to this)",
  helpHLittle: 'show me, step by step',
  helpAShape: 'the shape',
  helpHShape: "the outline, then I'll write",
  helpAEverything: 'everything (just give me the cards)',
  helpHEverything: 'all of it, at once',
  helpCoverThreeAct: 'a beginning, a turn, an end',
  helpCoverStoryCircle: 'eight steps, around and home again',
  helpCoverHeroJourney: 'twelve steps, out and back',
  helpCoverWorldbuilding: 'the place, its rules, its people',
  helpCoverCharacterStudy: 'each person, and what lies between them',
  helpCoverSceneSequel: 'a scene, then what it costs',
  helpCoverFeatureScreenplay: 'fifteen beats, front to back',
  helpCoverArgumentEssay: 'claim, evidence, counterclaim, close',
  helpCoverResearchPaper: 'introduction, method, results, discussion',
  helpCoverThesis: 'foundations, then the chapters',
  helpCoverBusinessProposal: 'the problem, the plan, the ask',
  helpCoverGrant: 'what you want to fund, and why',
  helpCoverFeatureStory: 'a lead, a nut graf, the story',
  helpCoverFromMyPages: 'your own pages, in your own order',
};

// Flux registers its own capture-module name (the app's other live theme
// already renames the same module 'Log' over in themeLexicon.ts's 'journal'
// term) — kept in step here so the two seams never visibly disagree under
// the same theme, even though they're independent maps.
const OVERRIDES: Partial<Record<ThemeId, Partial<Record<DeskTermId, string>>>> = {
  flux: {
    // W4 - RUN DIAGNOSTIC: the terminal dress of Help me choose (frame 09). The questions and answers are NOT overridden - deck content.
    helpDoor: 'RUN DIAGNOSTIC',
    helpDialogLabel: 'Diagnostic',
    helpKicker: 'DIAGNOSTIC v1',
    helpPickKicker: 'RESULT',
    helpBegin: '[LOAD]',
    helpAlt: 'ALT',
    helpBrowse: 'BROWSE ALL STACKS',
    helpClose: 'ESC TO CLOSE',
    helpBack: 'BACK',
    // PAGE TEMPLATES - Flux's circuit-register words for the picker (the approved templates mockup): Presets, and Raw / Script / Spine / Cover / Sources.
    // railTypeface's own Flux override already lives below (theme-leftovers) - not duplicated here.
    // cascadeThemeTitle: 'Skin' - flux-v2's own addition (merged to main independently); not duplicated here.
    railTemplates: 'Presets',
    templateBlank: 'Raw',
    templateScreenplay: 'Script',
    templateOutline: 'Spine',
    templateTitlePage: 'Cover',
    templateBibliography: 'Sources',
    // PHASE 1 (S3) - Flux's word for the same tab. No explainer: an empty term means no "?".
    corkboardJournalTab: 'Log',
    // Flux's circuit register (Link/linked/links, New Doc, Link Docs) where Arbor's canonical words are the tree register (Graft) [deskLexicon §61]
    beginNewPageCard: 'New Doc',
    boardNewPageCard: 'New Doc',
    cascadeJournalNewPage: 'New Doc',
    cascadePageNewPage: 'New Doc',
    boardPairWithPage: 'Start Docs',
    ctxDeleteBoard: 'Delete circuit',
    toastBoardTrashed: 'Circuit moved to Trash',
    linksKindPage: 'Doc',
    linksKindBoard: 'Circuit',
    linksKindCard: 'Node',   // the theme's own card word [deskLexicon §62]
    // Round 2: the card footer's own connecting phrase ("— grafted to: <label>"
    // Arbor, composed at BoardEditor.tsx's call site as "— {prefix}: {label}").
    // ITEM arbor-quiet-brass / Flux fix 5 — the Progress-style option reads
    // "Glitch" under Flux (Arbor keeps "Rhizome"); RhizomeField.tsx's own
    // `theme === 'plateau'` gate already renders nothing under Flux, so this
    // is a label-only fix (see that component's header comment).
    progressStyleRhizome: 'Glitch',
    // Flux keeps "Typeface": an explicit override now that Arbor's canonical word is "Font" [deskLexicon §63]
    railTypeface: 'Typeface',
    // Flux's own forms of the help sentences [deskLexicon §64]
    helpTemplates: 'Ready-made doc layouts.',
    helpFreeWrite: 'Write forward only. No editing back.',
    helpPublish: 'Send a doc out as a link or a file.',
    helpOutline: 'A numbered spine. Tab indents.',
    helpTitlePage: 'A standard manuscript cover sheet.',
    // Flux's three renamed template rows [deskLexicon §65]
    helpTemplateScreenplay: 'The script format: sluglines, dialogue, action.',
    recedeHint: 'Type to dissolve the chrome; pause, reach an edge, or press Esc to bring it back.',
    // Flux's circuit-register voice for the splash's loading line [deskLexicon §66]
    splashLoading1: 'Booting the terminal…',
    splashLoading2: 'Calibrating signal…',
    splashLoading3: 'Decrypting the archive…',
    splashLoading4: 'Patching the uplink…',
    // Flux's words for the shell; every desk string that still named an Arbor noun is re-worded here or on flux-v2.mjs's reviewed keep-list [deskLexicon §67]
    actionDelete: 'Delete doc',
    actionDeleteConfirm: 'Send this doc to Trash?',
    backToDrawer: 'Back to Rack',
    deckNameFromMyPages: 'From my docs',
    deckStepHelpGlyph: '[?]',
    deckStepHelpMore: 'MORE',
    deckFromMyPagesQPrompt: 'Which docs, in what order?',
    deckFromMyPagesNone: 'No docs here yet.',
    // W4: the librarian's From-my-pages lines in Flux's word for pages (flux-v2 LX2)
    helpWhyFromMyPages: 'You would rather write first, so the shape can come after, from docs you already have.',
    helpCoverFromMyPages: 'your own docs, in your own order',
    beginConnectPage: 'Connect Docs',
    boardAddExistingPage: '+ Filed Docs',
    boardCanvasEmpty: 'Add Cards or Docs',
    boardFooterToggle: 'Show inputs',
    boardHomeLabelJournal: 'Log',
    boardPageDoor: 'Docs',
    boardRenameLabel: 'Rename this circuit',
    boardTelos: 'The circuit serves the doc.',
    boardThreadGrab: 'Drag to connect',
    boardThreadPrefix: 'connected to',
    cascadeCardCopyNote: 'A copy is a new card owned by the circuit it lands on. Its threads do not come with it, and edits do not follow.',
    cascadeCardCopyTitle: 'Copy to Circuit',
    cascadeCardCopyTo: 'Copy to a circuit…',
    cascadeCardOnlyBoard: 'its only circuit',
    cascadeCardRemove: 'Remove from this circuit',
    cascadeDrawersChoose: 'Choose a rack to see what’s filed inside.',
    cascadeDrawersEmpty: 'No racks yet.',
    cascadeJournalAll: 'All docs →',
    cascadeJournalOpen: 'Open the Log',
    cascadeOpenBoard: 'Open the circuit',
    cascadePinDisplay: 'Display on Circuit',
    cascadePinHide: 'Hide from the circuit',
    cascadePlanBoardsConnected: 'Circuits connected',
    cascadePlanCreateBoard: 'Create a Circuit',
    cascadePlanEmpty: 'No circuits yet.',
    cascadePlanLinkedHeading: 'Connected to this circuit',
    cascadePlanNoDrawer: 'Not in a rack',
    cascadePlanNoProject: 'File this doc to a rack first to plan around it.',
    cascadePlanRelationOwn: 'its own circuit',
    cascadePlanSectionBoards: 'Circuits',
    cascadePlanSectionPages: 'Docs',
    cascadeSettingsTitle: 'Config',
    cascadeThemeTitle: 'Skin',
    createDrawerEyebrow: 'NEW RACK',
    createDrawerOpensNote: 'Opens the Rack home — shape it as you go.',
    createDrawerTitleLabel: 'Rack title (optional)',
    domainLabelAcademic: 'Academic Rack',
    domainLabelCreative: 'Creative Rack',
    domainLabelProfessional: 'Professional Rack',
    drawerHomeTitleLabel: 'Rack title',
    drawerLinks: 'Inputs',
    drawerLinksEmpty: 'Nothing connected yet.',
    drawerPage: 'Docs',
    drawerPlaceDrawers: 'Racks',
    drawerPlaceJournal: 'Log',
    drawerRightTabsLabel: 'Operator and inputs',
    drawersKindBoard: 'Circuit',
    footSettings: 'Config',
    helpGrafts: 'Inputs join docs, nodes and circuits.',
    helpTemplateBibliography: 'Your sources, collected on one doc.',
    helpTemplateBlank: 'A raw doc. Nothing written yet.',
    inkInstrument: 'The doc’s instrument',
    journalRouteEmptyDrawers: 'No Racks yet.',
    journalRoutePromoteDrawer: 'Promote to a new Rack',
    journalRouteSendToDrawer: 'Send to a Rack',
    linksRemoveTitle: 'Remove input?',
    openPagesHeading: 'Open Docs',
    openPagesMore: 'More for this Doc',
    openPagesPlace: 'Place on this circuit',
    openPagesSort: 'Sort Docs',
    pageEscHint: 'Press Escape to leave the doc',
    pageFacePin: 'Pin to a Circuit…',
    pageFacePinnedTo: 'Also connected to',
    pageFacePortToBoard: 'Port to a Circuit…',
    pageHomeAlso: 'Also in the Log.',
    pageHomeJournal: 'Log',
    pagePlanDoor: 'Circuits',
    placePageEmpty: 'No docs yet.',
    placeRootName: 'Root',
    placeSortDrawer: 'Rack',
    placesBoardsEmpty: 'No circuits yet.',
    placesBoardsTitle: 'Also connected to…',
    placesBoardsZoneLabel: 'Circuits this doc can join',
    placesHomeHeading: 'This doc lives in…',
    placesNewDrawer: 'File to a new rack…',
    placesNewDrawerPlaceholder: 'Rack name',
    publishDownloadBinder: 'This Cartridge',
    publishDownloadPageMd: 'Current Docs (.md)',
    publishDownloadPageTxt: 'Current Docs (.txt)',
    purgedElsewhere: 'This doc was deleted for good on another device.',
    railBoard: 'Circuit',
    railPageKind: 'Docs Kind',
    sectionsEmpty: 'No docs here yet.',
    sectionsEmptyBoards: 'No circuits here yet.',
    sectionsHeading: 'Tracks',
    sectionsMoved: 'Moved to the Log.',
    sectionsNewBoard: 'New Circuit',
    sectionsNewSet: '＋ New cartridge',
    sectionsNewSetName: 'Name the cartridge',
    sectionsTakeOut: 'Take out of this rack',
    sprintSaveAsDrawer: 'Save as Rack',
    sprintSaveToDrawer: 'Save to Rack',
    stripChangeTheme: 'Skin',
    stripPlan: 'Circuits',
    stripSettings: 'Config',
    structureActLabel: 'Change the doc itself',
    structureKindLabel: 'This doc is',
    switcherDrawers: 'Racks',
    switcherJournals: 'Logs',
    switcherNewDrawer: '＋ New Rack',
    switcherNewDrawerName: 'Name the rack',
    syncPullShort: '{pulled} Docs sent, {live} showing. Reload to retry.',
    templateOpenedNewBack: 'Opened as a new doc · Back',
    tutorBibleNote: 'Facts you save travel with the book — the Operator keeps them in mind.',
    tutorClose: 'Close the Operator',
    tutorConversationError: 'Operator currently unavailable',
    tutorConversationOffline: 'Operator unavailable',
    tutorDisclosureBody: 'What you ask the Operator travels to a language model; your docs stay yours.',
    tutorDisclosureBodyV2: 'When you ask the Operator, your question — and any new writing on this doc since the Operator last read it — travels to the language model provider configured for this app. Nothing is ever sent unless you ask. Your docs remain yours.',
    tutorDraftStretchNeedsSelection: 'Select a stretch on the doc first',
    tutorOpen: 'Open the Operator',
    tutorTabTutor: 'Operator',
    tutorTitle: 'The Operator',
    zoneStage: 'Docs',
    // Flux's words; Draft reads "Text"; Delete stays plain "Delete" in every theme [deskLexicon §68]
    modeDraft: 'Text',
    modeFreeWrite: 'Wire In',
    modePublish: 'Uplink',
    modeRevise: 'Patch',
    modeWorkshop: 'Relay',
    railFormat: 'Markup',
    railActions: 'Commands',
    actionTags: 'Flags',
    actionHeaderFooter: 'Frame',
    kindNormal: 'Plain',
    kindScreenplay: 'Script',
    kindResearch: 'Intel',
    footMenuTypewriter: 'Terminal Mode',
    twPageScroll: 'Screen Scroll',
    footMenuProgress: 'Meter',
    sliverInstrumentsUnit: 'Scale',
    goalLabel: 'Quota',
    footProgress: 'Load',
    footMenuPreferences: 'Config',
    boardModeOpen: 'Live',
    boardModeStoryboard: 'Sequence',
    boardModeOutline: 'Spine',
    boardModeWalk: 'Trace',
    boardModeFlip: 'Playback',
    boardModeThumbs: 'Index',
    showAsLabel: 'Render',
    walkNotes: '[NOTE]',
    walkWrite: '[BOOT DOC]',
    walkPlace: '[INPUT DOC]',
    graftPlaceThis: 'PORT TO…',
    graftPlaceSearchPages: 'Search docs…',
    graftPlaceSearchSteps: 'Search decks and nodes…',
    walkPrev: 'Previous node',
    walkNext: 'Next node',
    walkRail: 'Nodes',
    walkResize: 'Resize the node',
    walkOpen: '[OPEN]',
    flipEmpty: 'NO SIGNAL',
    deckFact: 'LOAD {n}/{m}',
    walkReadoutPlan: 'Circuit',   // Flux's boards are Circuits [deskLexicon §69]
    gapsLead: 'NO SIGNAL:',
    deckStack: 'STACK',
    walkLit: '[LOCK]',
    walkUnlit: '[UNLOCK]',
    kidDoor_scene: '[+ SCENES]',
    kidDoor_beat: '[+ BEATS]',
    kidDoor_moment: '[+ MOMENTS]',
    kidDoor_entry: '[+ ENTRIES]',
    kidDoor_subsection: '[+ SUBSECTIONS]',
    kidDoor_section: '[+ SECTIONS]',
    kidDoor_point: '[+ POINTS]',
    kidDoor_part: '[+ PARTS]',
    kidReadout: '{parent} › {word} {n}/{m}',
    boardAddCard: 'Add node',
    boardPortedBadge: 'From a doc',
    boardThreadUntitled: 'Unnamed',
    pageFaceAddTag: 'Add a flag',
    deskMenuGlyph: 'Terminal menu',
    fadeDepthLabel: 'Dissolve',
    fadeDepthPartial: 'Soft',
    fadeDepthFull: 'Void',
    timerLabel: 'Clock',
    actionCopy: 'Clone doc text',
    // STEP 3 (grafts, merged 19d31fc2): the Inputs panel's own words in Flux - the knob is an Input, the verb is connect, a card is a node, a board a circuit, a page a doc, a tag a flag.
    graftAdd: 'Input…',
    graftSearch: 'Search nodes, docs, circuits…',
    graftGroupCards: 'Nodes',
    graftGroupBoards: 'Circuits',
    graftGroupPages: 'Docs',
    graftSharedTags: 'Shared flags',
    graftPlanBoard: 'Circuit',
    graftPlanCardsOne: '1 node',
    graftPlanCardsMany: '{n} nodes',
    graftHideAria: 'Hide from this doc',
    graftHiddenLine: '{title} hidden from this doc.',
    graftDockAria: 'Dock beside the doc',   // the theme's own word for the page [deskLexicon §70]
    graftRemovedLine: 'Input to {title} removed.',
    graftKnobTip: 'Drag to connect',
    boardFitToText: 'Auto-fit',
    graftPairedPage: 'Doc',
  },
  machina: {
    linksKindPage: 'File',   // the theme's own page / card words [deskLexicon §71]
    linksKindCard: 'Block',
    // W4 - Intake: Machina's plain, square panel of Help me choose (no mockup yet).
    helpDoor: 'Intake',
    // MACHINA FORMS (m7 / m8): the deck library is the Forms panel; its seven group kickers are Machina's own labels for the registry's rooms.
    deckWizardChooseTitle: 'Forms',
    deckRoomFiction: 'Fiction',
    deckRoomSpeculative: 'World',
    deckRoomScreen: 'Screen',
    deckRoomAcademy: 'Academic',
    deckRoomBusiness: 'Business',
    deckRoomNewsroom: 'Newsroom',
    deckRoomEvery: 'Your files',
    deckNameFromMyPages: 'From my files',
    deckFromMyPagesQPrompt: 'Which files, in what order?',
    deckFromMyPagesNone: 'No files here yet.',
    helpWhyFromMyPages: 'You would rather write first, so the shape can come after, from files you already have.',
    helpCoverFromMyPages: 'your own files, in your own order',
    helpDialogLabel: 'Intake',
    helpKicker: 'Intake',
    helpPickKicker: 'Recommended form',
    // MACHINA STEP (m1-m4; brief section 3): the Walk is the Step, a card a Block, a Deck an Agenda.
    walkNotes: 'Note',
    walkPrev: 'Previous block',
    walkNext: 'Next block',
    walkRail: 'Blocks',
    walkResize: 'Resize the block',
    walkReadoutAgenda: 'Agenda',
    walkReadoutPlan: 'Plan',
    walkBlockOf: 'Block {n} / {m}',
    walkKeysHint: '← → Step · Esc Plan',
    deckFact: '{n} of {m} filled',
    deckFactKind: 'Agenda',
    deckStepHelpEg: 'E.G.',
    helpBegin: 'Create Agenda',
    helpAlt: 'or',
    helpBrowse: 'All forms',
    helpAEverything: 'everything (just give me the blocks)',
    // Machina's register (Project, Folder, Part, File, Plan, Block, Notebook...), derived from Flux's noun-bearing entries so no other theme's noun survives; Flux's register words are not carried over [deskLexicon §72]
    modeFreeWrite: 'Sprint',
    modeDraft: 'Build',
    modeRevise: 'Edit',
    modePublish: 'Finalize',
    // modeWorkshop is not overridden (the tab is hidden everywhere until built); the Plan door keeps "Plan" on purpose, an override over a renamed canonical [deskLexicon §73]
    pagePlanDoor: 'Plan',
    boardPageDoor: 'Files',
    boardPairWithPage: 'Start Files',   // names a Page 'File' here, like boardPageDoor beside it [deskLexicon §74]
    drawerPage: 'Files',
    stripPlan: 'Plans',
    drawerPlaceJournal: 'Notebook',
    stripSettings: 'Controls',
    footSettings: 'Controls',
    cascadeSettingsTitle: 'Controls',
    footMenuPreferences: 'Controls',
    stripChangeTheme: 'Theme',
    cascadeThemeTitle: 'Theme',
    tutorTabTutor: 'Consultant',
    tutorTitle: 'The Consultant',
    drawerRightTabsLabel: 'Consultant and assets',
    drawerLinks: 'Assets',
    graftAdd: 'Asset…',
    graftGroupPages: 'Files',
    sectionsHeading: 'Parts',
    sectionsNewBoard: 'New plan',
    sectionsNewSet: '＋ New folder',
    cascadePageNewPage: 'New file',
    railTemplates: 'Forms',
    sectionsPresets: 'Forms',
    progressStyleRhizome: 'Run',
    placeRootName: 'Inbox',
    cascadePlanNoProject: 'Add this file to a project first to plan around it.',
    // The knob: the mockup draws "Drag to asset".
    graftKnobTip: 'Drag to asset',
    boardFitToText: 'Fit to content',
    boardThreadGrab: 'Drag to asset',
    // "attached" keeps Arbor's "grafted" from leaking into Machina; a one-word swap when the verb is chosen [deskLexicon §75]
    boardThreadPrefix: 'attached to',
    pageFacePinnedTo: 'Also attached to',
    cascadePlanBoardsConnected: 'Plans attached',
    cascadePlanLinkedHeading: 'Attached to this plan',
    beginConnectPage: 'Attach Files',
    boardAddExistingPage: '+ Existing Files',
    placesBoardsTitle: 'Also attached to…',
    actionDelete: 'Delete file',
    actionDeleteConfirm: 'Send this file to Trash?',
    backToDrawer: 'Back to Project',
    boardCanvasEmpty: 'Add Cards or Files',
    boardFooterToggle: 'Show assets',
    boardHomeLabelJournal: 'Notebook',
    boardRenameLabel: 'Rename this plan',
    boardTelos: 'The plan serves the file.',
    cascadeCardCopyNote: 'A copy is a new card owned by the plan it lands on. Its threads do not come with it, and edits do not follow.',
    cascadeCardCopyTitle: 'Copy to Plan',
    cascadeCardCopyTo: 'Copy to a plan…',
    cascadeCardOnlyBoard: 'its only plan',
    cascadeCardRemove: 'Remove from this plan',
    cascadeDrawersChoose: 'Choose a project to see what’s filed inside.',
    cascadeDrawersEmpty: 'No projects yet.',
    cascadeJournalAll: 'All files →',
    cascadeJournalOpen: 'Open the Notebook',
    cascadeOpenBoard: 'Open the plan',
    cascadePinDisplay: 'Display on Plan',
    cascadePinHide: 'Hide from the plan',
    cascadePlanCreateBoard: 'Create a Plan',
    cascadePlanEmpty: 'No plans yet.',
    cascadePlanNoDrawer: 'Not in a project',
    cascadePlanRelationOwn: 'its own plan',
    cascadePlanSectionBoards: 'Plans',
    cascadePlanSectionPages: 'Files',
    createDrawerEyebrow: 'NEW PROJECT',
    createDrawerOpensNote: 'Opens the Project home — shape it as you go.',
    createDrawerTitleLabel: 'Project title (optional)',
    domainLabelAcademic: 'Academic Project',
    domainLabelCreative: 'Creative Project',
    domainLabelProfessional: 'Professional Project',
    drawerHomeTitleLabel: 'Project title',
    drawerLinksEmpty: 'Nothing connected yet.',
    drawerPlaceDrawers: 'Projects',
    drawersKindBoard: 'Plan',
    helpGrafts: 'Assets join files, blocks and plans.',
    helpTemplateBibliography: 'Your sources, collected on one file.',
    helpTemplateBlank: 'A raw file. Nothing written yet.',
    inkInstrument: 'The file’s instrument',
    journalRouteEmptyDrawers: 'No Projects yet.',
    journalRoutePromoteDrawer: 'Promote to a new Project',
    journalRouteSendToDrawer: 'Send to a Project',
    linksRemoveTitle: 'Remove asset?',
    openPagesHeading: 'Open Files',
    openPagesMore: 'More for this File',
    openPagesPlace: 'Place on this plan',
    openPagesSort: 'Sort Files',
    pageEscHint: 'Press Escape to leave the file',
    pageFacePin: 'Pin to a Plan…',
    pageFacePortToBoard: 'Port to a Plan…',
    pageHomeAlso: 'Also in the Notebook.',
    pageHomeJournal: 'Notebook',
    placePageEmpty: 'No files yet.',
    placeSortDrawer: 'Project',
    placesBoardsEmpty: 'No plans yet.',
    placesBoardsZoneLabel: 'Plans this file can join',
    placesHomeHeading: 'This file lives in…',
    placesNewDrawer: 'File to a new project…',
    placesNewDrawerPlaceholder: 'Project name',
    publishDownloadBinder: 'This Folder',
    publishDownloadPageMd: 'Current Files (.md)',
    publishDownloadPageTxt: 'Current Files (.txt)',
    purgedElsewhere: 'This file was deleted for good on another device.',
    railBoard: 'Plan',
    railPageKind: 'Files Kind',
    sectionsEmpty: 'No files here yet.',
    sectionsEmptyBoards: 'No plans here yet.',
    sectionsMoved: 'Moved to the Notebook.',
    sectionsNewSetName: 'Name the folder',
    sectionsTakeOut: 'Take out of this project',
    sprintSaveAsDrawer: 'Save as Project',
    sprintSaveToDrawer: 'Save to Project',
    structureActLabel: 'Change the file itself',
    structureKindLabel: 'This file is',
    switcherDrawers: 'Projects',
    switcherJournals: 'Notebooks',
    switcherNewDrawer: '＋ New Project',
    switcherNewDrawerName: 'Name the project',
    syncPullShort: '{pulled} Files sent, {live} showing. Reload to retry.',
    templateOpenedNewBack: 'Opened as a new file · Back',
    tutorBibleNote: 'Facts you save travel with the book — the Consultant keeps them in mind.',
    tutorClose: 'Close the Consultant',
    tutorConversationError: 'Consultant currently unavailable',
    tutorConversationOffline: 'Consultant unavailable',
    tutorDisclosureBody: 'What you ask the Consultant travels to a language model; your files stay yours.',
    tutorDisclosureBodyV2: 'When you ask the Consultant, your question — and any new writing on this file since the Consultant last read it — travels to the language model provider configured for this app. Nothing is ever sent unless you ask. Your files remain yours.',
    tutorDraftStretchNeedsSelection: 'Select a stretch on the file first',
    tutorOpen: 'Open the Consultant',
    // the roster follows Machina's Free Write word [deskLexicon §76]
    tutorFreeWriteTips: 'Sprint Tips',
    tutorFreeWriteRoster: 'Sprint tools',
    // the staged ask IS the chip label [deskLexicon §77]
    tutorDraftAskLoadBearing: 'What is load-bearing — and what could go?',
    tutorDraftAskThreadSlip: 'Where does the line slip?',
    // empty on purpose, not a missing key: a missing key would fall back to Arbor's lines [deskLexicon §78]
    splashLoading1: '',
    splashLoading2: '',
    splashLoading3: '',
    splashLoading4: '',
    zoneStage: 'Files',
    walkWrite: 'Draft File',
    walkPlace: 'Attach File…',
    graftPlaceThis: 'Attach to…',
    graftPlaceSearchPages: 'Search files…',
    graftPlaceSearchSteps: 'Search decks and blocks…',
    graftSearch: 'Search blocks, files, plans…',
    graftGroupCards: 'Blocks',
    graftGroupBoards: 'Plans',
    graftPlanBoard: 'Plan',
    graftPlanCardsOne: '1 block',
    graftPlanCardsMany: '{n} blocks',
    graftHideAria: 'Hide from this file',
    graftHiddenLine: '{title} hidden from this file.',
    graftDockAria: 'Dock beside the file',   // the theme's own word for the page [deskLexicon §79]
    graftRemovedLine: 'Asset to {title} removed.',
    graftPairedPage: 'File',
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
