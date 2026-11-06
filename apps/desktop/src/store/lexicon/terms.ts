import type { ChildWord } from '../../decks/types';

export type DeskTermId =
  | 'modeFreeWrite' | 'modeDraft' | 'modeRevise' | 'modeWorkshop' | 'modePublish'
  // CD2 S5 — 'zoneToolRail' (the old fixed drawer track's aria-label) is
  // renamed to 'zoneStrip' here in step with the track's own retirement:
  // DeskFrame's first grid column now holds the cascade's strip, not a
  // tool-rail, and no other file referenced the old id (confirmed by grep).
  | 'zoneStrip' | 'zoneCorkboard' | 'zoneMeter'
  | 'corkboardJournalTab'
  // AB2 — the hand-tools' own labels, born on AB2's ToolRail.tsx (now
  // components/Sliver.tsx, CD1 S2/S7 — ToolRail itself retired, these ids
  // did not). New user-facing strings this ticket introduces land in this
  // seam per the AB1 review's ratified naming, not a second lexicon file.
  | 'railInk' | 'railControls' | 'railForwardLock'
  | 'railFormat'
  | 'modeBarPen' | 'spreadLensInk'
  | 'inkInstrument' | 'inkModeText' | 'inkModeInk'
  | 'inkTip' | 'inkNib' | 'inkTipPen' | 'inkTipPencil' | 'inkTipMarker'
  | 'inkNibFine' | 'inkNibRegular' | 'inkNibBroad'
  | 'inkEraser' | 'inkWalnut' | 'inkIron' | 'inkOxblood' | 'inkSea'
  // CD1 S2/S6 — the sliver's goal block (components/Sliver.tsx's foot). The
  // sliver's own keyboard shortcut (Ctrl/Cmd+/, SLIVER_SHORTCUT_LABEL in
  // that file) is a chord constant, not user-facing prose, so it does NOT
  // ride this lexicon seam — only its surrounding strings do.
  | 'goalLabel' | 'goalUnitLines'
  | 'sliverOpen' | 'sliverClose'
  // FX3 S5 — the sliver foot's new instruments row (components/Sliver.tsx's
  // SliverInstrumentRow). Only the row/section-level labels ride this seam,
  // matching the existing railInk/railControls/railReading precedent above;
  // the terse Seg OPTION strings themselves ('On'/'Off'/'Lines'/'Words'/
  // 'Time') follow ModeStage.tsx's own SettingsPanel/ThemePanel precedent
  // (already hardcoded inline there, pre-FX3) rather than adding a new key
  // per option.
  | 'sliverInstrumentsUnit'
  // AB3 — the Drawer's own nav pulls (components/Drawer.tsx, RETIRED whole
  // by CD2 S5 — the left drawer's estate moves to the cascade strip). These
  // four term ids survive their original component: CD2's Strip.tsx reuses
  // them VERBATIM as the strip's own Journal/Page/Shelf/Drawers section
  // labels (canon A11's roster uses the same words), rather than mint
  // duplicate strings for the same vocabulary.
  | 'drawerPage' | 'drawerPlaceJournal' | 'drawerPlaceShelf' | 'drawerPlaceDrawers'
  // AB3 S2 — the Page face (components/PageFace.tsx).
  | 'pageFaceStar' | 'pageFaceStarred' | 'pageFaceAddTag' | 'pageFaceAdd'
  | 'pageFacePortToBoard'
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
  | 'placeFaceEmpty'
  // CD2 S1 — the strip's own remaining roster labels (A11): Plan joins Page
  // in section B; Settings and Change Theme are the new foot section D.
  | 'stripPlan' | 'stripSettings' | 'stripChangeTheme'
  // CD2 S3 — category panel bodies (layer 2), one seam per category. Panels
  // that carry forward whole content (Page -> PageFace, Journal/Drawers/
  // Shelf -> PlaceFace-style rows) reuse the ids above; these are the NEW
  // strings CD2 itself introduces.
  | 'cascadeJournalOpen' | 'cascadeJournalNewPage' | 'cascadeJournalRecent' | 'cascadeJournalAll'
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
  | 'cascadeBoardMove' | 'cascadeBoardDelete'
  | 'cascadeSettingsTitle' | 'cascadeSettingsSignOut'
  | 'cascadeThemeTitle'
  // CD2 S2/S4 — the survey layer + the dock.
  | 'cascadeSurveyEmpty' | 'cascadeSurveyCurrent' | 'cascadeDockClose'
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
  | 'boardThreadPrefix' | 'boardThreadUntitled'
  // FLUX3 S1 - the Schema's node records and readouts (src/flux3/, behind ?flux3=1): new words only, no rename; TOOLS' lexicon pass sets their values
  | 'flux3LinkOne' | 'flux3LinkMany' | 'flux3ChecksumOk' | 'flux3ReadLevel' | 'flux3ReadZoom' | 'flux3ReadLast' | 'flux3KindPreset'
  // FLUX3 S2 - the Schema's Stack and hologram (src/flux3/FluxStack.tsx, behind ?flux3=1): the Stack button's word and the level readout's two words
  | 'flux3ViewStack' | 'flux3ViewHologram' | 'flux3WordOne' | 'flux3WordMany' | 'flux3PortConnectAnother' | 'flux3PortDisconnect' | 'flux3Checkpoint'
  // the right-click menus, the "Send to Trash?" dialog, the Settings row and the toasts [deskLexicon §5]
  | 'ctxDelete' | 'ctxDeleteBoard' | 'ctxUngroup' | 'deleteDialogTitle' | 'deleteDialogPurgeTitle' | 'deleteDialogCancel' | 'deleteDialogConfirm' | 'deleteDialogDontAsk'
  | 'ctxEmptyTrash' | 'emptyTrashQuestionOne' | 'emptyTrashQuestionMany' | 'purgedElsewhere' | 'destructiveTypeToGo' | 'destructiveGo'
  | 'settingsAskBeforeDelete' | 'toastCardDeleted' | 'toastCardRestored' | 'trashCardBadge'
  // the Grafts / Links tab: the selected card's connections, each with an X that asks first [deskLexicon §6]
  | 'linksRemoveTitle' | 'linksRemoveAria' | 'linksKindPage' | 'linksKindBoard' | 'linksKindCard'
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
  | 'tutorTabTutor' | 'drawerLinks' | 'drawerRightTabsLabel'
  | 'tutorDockClose'
  | 'tutorLensConsistency' | 'tutorLensStructure' | 'tutorLensFragments'
  | 'tutorLensConsistencyEmpty' | 'tutorLensFragmentsEmpty' | 'tutorLensFragmentsNote'
  | 'tutorNudgesTitle' | 'tutorNudgesEmpty'
  // TU5 S3 — the book's Bible (L4): section header, a one-line note, empty
  // state, the add-input placeholder + button, and the per-fact
  // edit/delete/save/cancel affordances. All writer-facing chrome, all here.
  | 'tutorBibleTitle' | 'tutorBibleEmpty'
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
  | 'cascadePageNewPage' | 'boardNewPageCard'
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
  | 'twForwardLock'
  | 'twLineFade'
  | 'twPageScroll'
  // ITEM 83 M5 (R4/DR3) — Draft's grown roster and its conversion verb.
  | 'draftHeading' | 'draftHeadingUp' | 'draftHeadingDown' | 'draftBullet' | 'draftBulletCircle' | 'draftBulletSquare' | 'draftBulletStyles' | 'draftQuote' | 'draftIndent' | 'draftOutdent' | 'draftSpacing'
  | 'railTemplates' | 'templateOutline' | 'templateBibliography' | 'templateTitlePage' | 'templateBlank' | 'templateScreenplay' | 'templateOpenedNewBack'
  | 'helpOutline' | 'helpTitlePage' | 'helpTemplateBlank' | 'helpTemplateScreenplay' | 'helpTemplateBibliography'
  | 'comingSoon' | 'railTypeface' | 'goalUnitWords' | 'railPageKind'
  // PHASE 1 - the Actions section of the left drawer.
  | 'railActions' | 'actionTags' | 'actionCopy' | 'actionDelete' | 'actionHeaderFooter' | 'actionTagRemove'
  | 'footSettings' | 'footMenuTypewriter' | 'footMenuProgress' | 'footMenuFlicker'
  // PHASE 1 (S4) - the two mode toggles beside the drawer's "..." button. Their names are what a screen reader hears; on/off is aria-pressed.
  | 'modeToggleTypewriter' | 'modeToggleProgress' | 'formatLockedByTypewriter'
  | 'draftAlignment' | 'draftAlignLeft' | 'draftAlignCenter' | 'draftAlignRight'
  // ITEM 207 — the Type control's accessible names. NO visible captions: his law is a strip menu with the fewest marks,
  // so each control's name lives in its aria-label, never as helper text.
  | 'typeGroup' | 'typeFace' | 'typeSmaller' | 'typeLarger' | 'typeSize'
  // FONT-SPAN - the Typeface section's two scopes (the approved font-choices mockup)
  | 'typeScope' | 'typeScopeSelection' | 'typeScopeWholeDocument' | 'typeScopeWholeCard'
  // the page's declared kind and its style guide; the two sub-labels say which control describes the page and which acts on it [deskLexicon §13]
  | 'structureStyleGuideLabel'
  | 'kindNormal' | 'kindScreenplay' | 'kindResearch'
  | 'styleGuideMla' | 'styleGuideApa' | 'styleGuideChicago' | 'styleGuideAp'
  // ITEM 83 M6 (R13.ii) — the board's Place-page list. The heading is a VERB
  // PHRASE by S13's precedent: a bare noun list in a drawer reproduces the
  // GO-versus-PUT confusion the Places redesign exists to close.
  // ITEM 170 — the list became the way to OPEN a page, so its heading names
  // what the list IS; the put it still offers is named by its own verb.
  | 'openPagesSort' | 'openPagesMore' | 'openPagesPlace'
  // BIG PROJECTS 1a - the place block, the switcher and the Pages pop-out (Arbor words; Flux follows in its own words pass).
  | 'sectionsHeading' | 'sectionsOrder' | 'sectionsNewSet' | 'sectionsNewSetName' | 'sectionsPresets'
  | 'sectionsNewBoard' | 'sectionsEmptyBoards'
  // FLUX V2 - the top drawer's display word (Arbor: its own name; Flux: Root, only while the name is still the default).
  | 'placeRootName'
  | 'sectionsMoved' | 'sectionsUndo' | 'sectionsTakeOut' | 'sectionsEmpty' | 'sectionsReorder'
  | 'switcherHeading' | 'switcherDrawers' | 'switcherJournals' | 'switcherNewDrawer' | 'switcherNewDrawerName' | 'switcherUnsorted'
  // ITEM 83 M7 (PP1) — the Home zone's heading, which until now existed only
  // as an aria-label the eye could not hear.
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
  | 'boardHomeLabelShelf' | 'shelfBoardEmpty'
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
  // the Drawer terms: key names stay (internal ids), string values carry the writer's word [deskLexicon §15]
  | 'createDrawerEyebrow' | 'createDrawerTitleLabel'
  | 'drawerHomeTitleLabel' | 'backToDrawer'
  | 'domainLabelCreative' | 'domainLabelAcademic' | 'domainLabelProfessional'
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
  | 'progressStyleLabel' | 'progressStyleBar' | 'progressStyleRhizome' | 'progressDrawer'
  // the Recede-depth and Timer rows' own words, out of inline strings so a theme can name them [deskLexicon §18]
  | 'timerLabel'
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
  | 'boardPageDoor' | 'pagePlanDoor' | 'pageEscHint'
  | 'boardLaneDefault' | 'boardStoryboardEmpty' | 'boardOutlineEmpty'
  | 'boardPairWithPage'
  | 'boardRenameLabel'
  // the empty board's doors and the empty page's start-words are door NAMES, not tasks; the child-card words per deck [deskLexicon §21]
  | `kidDoor_${ChildWord}` | `kidPlural_${ChildWord}` | `kidTitle_${ChildWord}` | `kidQ_${ChildWord}` | 'kidQ_section_story'
  | 'kidHowMany' | 'kidKicker' | 'kidNote' | 'kidAdd' | 'kidReadout'
  | 'beginNewCard' | 'beginLoadDeck' | 'beginConnectPage'
  | 'beginNewLane'
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
  | 'formsIntakeHint' | 'formsFoot' | 'formsFootBlocks'
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

