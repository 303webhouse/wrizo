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
  // TU2 S3 — the disclosure's v2 body, Nick's ratified string verbatim
  // (added, not overwritten in place, so the lexicon keeps v1's body
  // legible as the version history it now is — see
  // store/tutorDisclosure.ts's header comment for the versioned-flag
  // mechanism this string is paired with). Title/ack are unchanged by the
  // brief's own wording and are reused as-is; only the body differs.
  | 'tutorDisclosureBodyV2'
  // TU2 S2 — the listener's own honesty line: shown in the panel's quiet
  // UI copy whenever a send's delta had to be tail-capped (the model's
  // own copy of that same honesty travels in the delta block's plain-data
  // header text instead — that one is not writer-facing chrome and so
  // does NOT route through this lexicon, per the brief's own distinction).
  | 'tutorDeltaTruncated'
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
  // B3 S2 — Character Study (decks/library/characterStudy.ts): promoted on
  // Fable's call as the threads demonstration (item 36) — dealt PRE-
  // THREADED, its relationship cards wired via the SAME 'connection' Box
  // kind BoardEditor.tsx's own thread-drag gesture already mints. Wizard:
  // how many characters (two/three/four) — each gets the same four self-
  // card types (composed titles: "<Label> <letter>: <type title>"); each
  // adjacent pair gets one Relationship card, threaded to both sides' own
  // Want vs. Need card.
  | 'deckCharacterStudyQPrompt' | 'deckCharacterStudyOptTwo' | 'deckCharacterStudyOptThree' | 'deckCharacterStudyOptFour'
  | 'deckCharacterStudyLabel'
  | 'deckCharacterStudyWantNeedTitle' | 'deckCharacterStudyWantNeedBody'
  | 'deckCharacterStudyWoundTitle' | 'deckCharacterStudyWoundBody'
  | 'deckCharacterStudyContradictionTitle' | 'deckCharacterStudyContradictionBody'
  | 'deckCharacterStudyVoiceTitle' | 'deckCharacterStudyVoiceBody'
  | 'deckCharacterStudyRelationshipTitle' | 'deckCharacterStudyRelationshipBody';

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
  tutorDisclosureBodyV2: 'When you ask the Tutor, your question — and any new writing on this page since the Tutor last read it — travels to the language model provider configured for this app. Nothing is ever sent unless you ask. Your pages remain yours.',
  tutorDeltaTruncated: 'Only your latest stretch of new writing was shared this time — earlier new writing since last time went unread.',
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
  deckScreenplayQPrompt: 'Feature or pilot?',
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
  deckFeatureStorySourceOneTitle: 'Source & Quote',
  deckFeatureStorySourceOneBody: 'Who said what — and why they’re the right person to say it.',
  deckFeatureStorySourceTwoTitle: 'Source & Quote',
  deckFeatureStorySourceTwoBody: 'A second voice — ideally one that complicates the first.',
  deckFeatureStorySceneOneTitle: 'Scene Card',
  deckFeatureStorySceneOneBody: 'A moment you can actually show, not summarize.',
  deckFeatureStorySceneTwoTitle: 'Scene Card',
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
