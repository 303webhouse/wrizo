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
  // FX7 S2 — Journal's own ink-tool toggle, mirrored onto Free Write's rail
  // as a disclosed-inert placeholder (components/Sliver.tsx's own
  // `inkToolPlaceholder` — see that file's header comment for the full
  // "why disabled" reasoning). The tooltip is the one place this ticket
  // discloses the inert state directly to the writer.
  // ITEM 121 (I3/I4) — the Ink wave's own strings. The switch names the two
  // instruments the page can be; the drawer's ink zone names the three groups
  // (TIP / NIB / INK) and the three tips and three nibs by name. Every one of
  // them enters the lexicon rather than the JSX, per the standing seam rule.
  // ITEM 130's rename (2026-09-09). `modeBarPen` names ModeStage's UNFRAMED
  // pen bar - the narrow shell's only ink-looking control. Its visible label
  // was the inline literal 'ink' while its own aria-label already read 'Pen',
  // so the eye and assistive tech disagreed about one control. The term makes
  // the eye agree with the aria-label, and retires the literal.
  // `spreadLensInk` folds the Spread's own inline 'Ink' chip in beside it.
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
  // BOARD CONTEXT MENU (Nick, Oct 15) - the right-click menus, the "Send to Trash?" dialog, the Settings row, and the toasts.
  | 'ctxDelete' | 'ctxDeleteBoard' | 'ctxUngroup' | 'deleteDialogTitle' | 'deleteDialogPurgeTitle' | 'deleteDialogCancel' | 'deleteDialogConfirm' | 'deleteDialogDontAsk'
  | 'ctxEmptyTrash' | 'emptyTrashQuestionOne' | 'emptyTrashQuestionMany' | 'purgedElsewhere' | 'destructiveTypeToGo' | 'destructiveGo'
  | 'settingsAskBeforeDelete' | 'toastCardDeleted' | 'toastCardRestored' | 'toastBoardTrashed' | 'trashCardBadge'
  // CONNECTOR-B (Nick's approved connector mockup v6): the right drawer's Grafts / Links tab lists the selected card's connections, each with an X that asks first.
  | 'linksSelectCard' | 'linksRemoveTitle' | 'linksRemoveAria' | 'linksKindPage' | 'linksKindBoard' | 'linksKindCard'
  // BIG PROJECTS STEP 3 - Grafts across places and the graft doors (docs/plans/big-projects.md step 3; mockup cursor/graft-doors-mockup @ c4f34eb0)
  | 'graftAdd' | 'graftSearch' | 'graftConnectedTo' | 'graftGroupCards' | 'graftGroupSources' | 'graftGroupBoards' | 'graftGroupPages' | 'graftSharedTags'
  | 'graftPlanBoard' | 'graftPlanCardsOne' | 'graftPlanCardsMany' | 'graftHideAria' | 'graftHiddenLine' | 'graftRemovedLine' | 'graftUndo' | 'graftCameFrom'
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
  // ITEM 84, THE DECK PHASE — the Tutor's Free Write roster. The three preset
  // labels are STRINGS OF RECORD: they come from Nick's own lock word
  // (docs/menus/tutor/tutor-menus-lock-record.md §1 line 1 — "(B) 'Writing
  // Prompt' · (C) 'Unblock' · (D) 'Free Writing Tips'"), never from a pass file
  // or the mockup HTML (that record's §3 rule). The roster's fourth member —
  // "(A) blank space with a flashing cursor where anything can be asked" — is
  // the existing composer taking focus in Free Write, so it needs no string of
  // its own. `tutorFreeWriteSpent` is the ceiling's own quiet line: NOT a
  // disabled unbuilt feature (G3's locked door wearing paint) but a transient
  // gate on real capability, re-armed the moment the writer moves on.
  | 'tutorFreeWriteRoster' | 'tutorFreeWritePrompt' | 'tutorFreeWriteUnblock'
  | 'tutorFreeWriteTips' | 'tutorFreeWriteRefill'
  // ITEM 84, THE DRAFT ROSTER — the four asks, and they are STRINGS OF RECORD.
  // Taken byte-for-byte from the build brief's §2 table, which took them from
  // tutor-menus-lock-record.md (§3's amendment and §4's sweep). Pass 2 and the
  // mockup HTML still carry the PRE-AMENDMENT third ask by design — they are the
  // record of what the committee argued and of what Nick actually looked at — and
  // are therefore INVALID sources for these strings; the lock record's own §3 rule
  // says so in as many words. item84b.mjs asserts all four byte-exact, and asserts
  // the overturned string absent from the DOM, precisely to catch a copy from
  // either of them.
  //
  // `tutorDraftAskStretch` is TD4, the one chip that adds a payload: its own
  // words ARE its button-naming under the disclosure's condition (a) — the
  // WIRE must still name what it sends, byte-exact (item84b.mjs's own S4
  // "THE BUTTON LAW" proves this mechanically, not by inspection).
  // SUPERSEDED in part (Nick's ruling, Oct 13, word-diet-layouts, "per Nick"
  // in cursor/word-diet-ui @ 5933454c): the FACE no longer has to BE those
  // words — "the chip's visible label becomes 'Selection'; the prompt it
  // sends stays word for word." `tutorDraftAskStretchLabel` carries the new
  // face; `tutorDraftAskStretch` itself is untouched and still names the
  // wire — Tutor.tsx's own DRAFT_ASKS reads `label ?? term` for display and
  // `term` unconditionally for the press, so the two can never drift apart
  // by accident.
  | 'tutorDraftRoster' | 'tutorDraftAskDrag' | 'tutorDraftAskLoadBearing'
  | 'tutorDraftAskThreadSlip' | 'tutorDraftAskStretch' | 'tutorDraftAskStretchLabel'
  | 'tutorDraftStretchNeedsSelection' | 'tutorSelectionTruncated'
  | 'tutorDisclosureTitle' | 'tutorDisclosureBody' | 'tutorDisclosureAck'
  // TU2 S3 — the disclosure's v2 body, Nick's ratified string verbatim
  // (added, not overwritten in place, so the lexicon keeps v1's body
  // legible as the version history it now is — see
  // store/tutorDisclosure.ts's header comment for the versioned-flag
  // mechanism this string is paired with). Title/ack are unchanged by the
  // brief's own wording and are reused as-is; only the body differs.
  | 'tutorDisclosureBodyV2'
  // TU5 S6 — the disclosure's v3 body: v2's ratified sentence with ONE clause
  // added naming the writer's saved Bible facts as a third traveler, every
  // other word preserved (Candidate A). v2 kept above as legible version
  // history. Nick ratifies this string verbatim (or swaps the alternate) at
  // the schema word — see docs scratchpad's s6-disclosure-candidates.md.
  | 'tutorDisclosureBodyV3'
  // ITEM 84 — the disclosure's v4 body: candidate B, ratified by Nick 2026-08-17,
  // provisionally-binding, committed at `1ef1659` in
  // docs/wrizo-alpha/disclosure-v4-committee-fable.md. Verified against that
  // record's own manifest before use — 1 sentence, 183 bytes, md5
  // 9287082c0e3c0a2b243c71ce01c89b43 — and rendered ABOVE v3 rather than in place
  // of it, per open-threads.md's ruling: "v3 → superseded by v4 in annotation form
  // (v3 standing verbatim beneath)". v3's string below is therefore not copied and
  // not edited; the modal reuses that very id, which is what makes "verbatim
  // beneath" mechanical instead of promised.
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
  // STORAGE-FULL STEP 1 (Fable's byte review, item 2) — an active local write failure, split by which of the three
  // true states it is (changes still not in the account / already all in the account / no account to reach at
  // all), plus the one-time near-full heads-up.
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
  // ITEM 114 (item 83 errata E4) — the page's declared KIND and, under
  // Research, its style guide. Two sub-labels join them, and they are the
  // load-bearing half of the answer to the Screenplay name collision: one zone
  // now says plainly which of its controls describes the page and which one
  // ACTS on it, so a kind chip reading "Screenplay" cannot be read as the
  // conversion door standing beside it.
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
  | 'deckCharacterStudyRelationshipTitle' | 'deckCharacterStudyRelationshipBody'
  // M2 S1 — the Progress-style setting (Bar | Rhizome), offered only when
  // Progress is Words (M1 R1's own precedent). Every string this ticket
  // introduces routes through this seam per the brief's own instruction,
  // even though the neighboring pre-existing Seg calls in ModeStage.tsx's
  // SettingsPanel/Sliver.tsx's InstrumentsPanel hardcode their OWN terse
  // option strings inline (the FX3 S5 precedent, left as-is — this ticket
  // adds a new control, it does not retrofit its neighbors).
  | 'progressStyleLabel' | 'progressStyleBar' | 'progressStyleRhizome' | 'recedeHint'
  // help-buttons (Nick approved Oct 12, cursor/help-buttons @ d4d1c835) —
  // one plain sentence per themed word, shown behind its own "?" (store/
  // help.ts, components/HelpButton.tsx). recedeHint (above) is the seventh;
  // it already existed (DrawerNote), gaining only a Flux override here.
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
  // BM1 — the Board's Own Modes. The three mode tabs (in the page-bar's own
  // tab grammar), the two doors (PAGE →/PLAN →, the arrow is a decorative
  // glyph rendered in the component — never translated prose), the telos line
  // (one muted static line in the board's top region: chrome, not a toast —
  // it never animates, counts, or nags), the default/empty lane copy, and the
  // board-side explicit pairing entry. "The plan serves the page." travels
  // verbatim from the brief (Nick did not edit the proposed string).
  | 'boardModeOpen' | 'boardModeStoryboard' | 'boardModeOutline'
  | 'boardPageDoor' | 'pagePlanDoor' | 'pageEscHint' | 'boardTelos'
  | 'boardLaneDefault' | 'boardStoryboardEmpty' | 'boardOutlineEmpty'
  | 'boardPairWithPage'
  | 'boardRenameLabel'
  // BG1 — the Beginnings. The empty board's doors (per mode) and the empty
  // page's three start-words. Door NAMES, not tasks: no verb-object
  // instruction, no "get started", nothing that could be read as a checklist
  // item. The page's three travel verbatim from P1 amendment 2 (Nick's word,
  // 2026-07-25) — one word each, "Sprout" superseding "Start from a Spark".
  | 'beginNewCard' | 'beginNewPageCard' | 'beginLoadDeck' | 'beginConnectPage'
  | 'beginNewLane'
  | 'beginScreenplay' | 'beginSprout' | 'beginPlan'
  // ITEM 224 — sign-up by invite code, until launch. Arrival.tsx's own
  // fields are placeholder-only (no labels) today; this one matches that
  // existing shape exactly rather than introducing a labelled field alone.
  | 'authInviteCodePlaceholder'
  // ITEM 224, ROUND 2 — shown instead of the whole form when no codes are
  // configured, so the gate reads as a quiet fact, never a submit-and-fail.
  | 'authSignupByInvitation'
  // ITEM splash-hold, ROUND 3 — the splash's own cycling loading line, four
  // per-theme phrases (Nick's ruling). Arbor's own voice is the canonical one;
  // Flux's own circuit-register voice is a Flux override, below.
  | 'splashLoading1' | 'splashLoading2' | 'splashLoading3' | 'splashLoading4';

const CANONICAL: Record<DeskTermId, string> = {
  // BM1 — the Board's Own Modes.
  boardModeOpen: 'Open',
  boardModeStoryboard: 'Storyboard',
  boardModeOutline: 'Outline',
  boardPageDoor: 'Pages', // ITEM word-diet, pages-rename bucket (a)
  pagePlanDoor: 'Plan',
  // A1 (accessibility audit): Tab indents on the page, so the way out is said aloud. Screen-reader-only; never drawn.
  pageEscHint: 'Press Escape to leave the page',
  boardTelos: 'The plan serves the page.',
  boardLaneDefault: 'Cards',
  boardStoryboardEmpty: 'No cards yet. Add cards in Open, then arrange them into order here.',
  boardOutlineEmpty: 'No cards yet. Add cards in Open, then shape them into an outline here.',
  // ITEM word-diet-layouts (Fable, Oct 15) — '+ Pages' collided with the
  // Pages panel's/Journal's own create button (cascadePageNewPage /
  // cascadeJournalNewPage, both literally "+Pages"-family words) even
  // though this button does something else entirely (pair THIS board with
  // a new page, one-to-one). "Start Pages" names the act without the
  // collision; Flux's own override ('Start Docs') sits in OVERRIDES below.
  boardPairWithPage: 'Start Pages',
  // ITEM 133 - the board's name, edited where it is displayed.
  boardRenameLabel: 'Rename this board',
  // BG1 — the Beginnings. Title-cased as door names (the brief's own wording,
  // verbatim), which is what sets them apart from the sliver's sentence-case
  // tool labels a few rows away: a tool is something you use, a door is
  // somewhere you go.
  beginNewCard: 'New Card',
  // ITEM word-diet-layouts (Fable, Oct 15) — the singular-exception rule:
  // every "make a new one" button is singular. Joins boardNewPageCard/
  // cascadeJournalNewPage/cascadePageNewPage below, all four moving
  // together (the same "pages-rename bucket (a)" family, deskLexicon's own
  // standing note). Flux's own override ('New Doc') sits in OVERRIDES below.
  beginNewPageCard: 'New Page',
  // ITEM word-diet-layouts (Fable, Oct 15) — the board's own starter words:
  // Arbor "New Card · New Page · Templates · Connect Pages". "Load a Deck"
  // named the OBJECT it loads; "Templates" names what that object IS, the
  // same noun-door convention every other beginning here already uses.
  beginLoadDeck: 'Templates',
  // ITEM word-diet-layouts (Fable, Oct 15) — Arbor's own word for this door
  // is now "Connect Pages" (was "+ Filed Pages", the ExistingPagePicker's
  // own button-face borrowed here; the two doors open the same sheet but
  // name a different act — THIS one invites connecting a page to the
  // board, not filing one). Flux's own override ('Link Docs') sits below.
  beginConnectPage: 'Connect Pages',
  beginNewLane: 'New Lane',
  beginScreenplay: 'Screenplay',
  beginSprout: 'Sprout',
  beginPlan: 'Plan',
  modeFreeWrite: 'Free Write',
  modeDraft: 'Draft',
  modeRevise: 'Revise',
  modeWorkshop: 'Workshop',
  modePublish: 'Publish',
  zoneWayfinding: 'Wayfinding',
  zoneStrip: 'Strip',
  // ITEM word-diet (Nick, Oct 13, review fix) — pages-rename bucket (a):
  // "Page" is always grammatically plural ("these Pages"); the rail/zone
  // and door labels below join drawerPage/boardPageDoor/cascadePageNewPage/
  // cascadeJournalNewPage/beginNewPageCard/boardNewPageCard/railPageKind/
  // boardAddExistingPage. Physical-page rows (pageEscHint, boardTelos,
  // inkInstrument) are unaffected — bucket (b), untouched.
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
  // ITEM word-diet (Nick, Oct 13) — store/pageHome.ts's own describePageHome
  // moves into the lexicon: it was hardcoded, outside both lexicons, found
  // during the census rather than already flagged. "Just the location",
  // Nick's own words — pageHomeProject interpolates the place name at the
  // call site (today that's the project's own title; read as a placeholder
  // for "wherever this page is filed", not a literal rename to a different
  // entity — flagged for confirmation in the report).
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
  // PW1 S3 (item 125), Fable's ruling 4 — the Page face's prose line takes the
  // ONE connecting word the whole slice speaks in. "Pinned to" named the
  // pin-card, which is now only ONE DISPLAY of the relation; a page can be a
  // member of a board and not appear on its canvas at all, so the old word
  // would describe a card that may not exist. "Connected" (now Arbor's own
  // "Grafted", item arbor-quiet-brass) names the membership itself, and
  // matches S1's own heading — one connecting word, two faces. Sentence
  // shape kept.
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
  cascadeJournalNewPage: 'New Page', // ITEM word-diet-layouts, the singular-exception rule (Fable, Oct 15)
  cascadeJournalRecent: 'Recent',
  cascadeJournalAll: 'All pages →',
  cascadePlanCreateBoard: 'Create a Board',
  cascadePlanPlotStory: 'Plot a Story',
  // PW1 — RETIRED from every render path (PW3/PW9); values kept so the
  // retirement is legible and no lookup can silently resolve to nothing.
  cascadePlanOpen: 'Open…',
  cascadePlanEmpty: 'No boards yet.',
  // PW1 S1 — Nick's exact term (Q2), in HIS sentence case. The zone's
  // presentation uppercase rides the CSS register, never the string: the
  // lexicon holds the word, the register holds the voice.
  cascadePlanBoardsConnected: 'Boards grafted',
  // PW10 + the three-space canon: "the Plan-board pairing is a SURFACE OWNING A
  // CONTAINER and must be named as such wherever it shows."
  cascadePlanRelationOwn: 'its own plan board',
  cascadePlanOwnSuffix: '— plan',
  cascadePlanNoDrawer: 'Not in a drawer',
  // PW2 S2 — the BOARDS CONNECTED zone's caption on a board.
  cascadePlanCaptionIn: 'in',
  // PW2 S3 (item 123) — card transfer. COPY ONLY: Move is an ownership
  // transfer and a different act, deferred by name.
  cascadeCardCopyTo: 'Copy to a board…',
  // ITEM word-diet.
  cascadeCardCopyTitle: 'Copy to Board',
  // THE TRAY'S DISCLOSURE, before the act. Item 123's ruled sentence also
  // carried "its tags come with it" — DEFERRED ON THE RECORD (Fable,
  // 2026-09-13), successor C4: a Box has no tags field, so cards cannot carry
  // tags yet and the clause has nothing to act on. The tray ships only the
  // true clauses; the middle one returns the day cards can be tagged. A tray
  // that promises what the product cannot do is the surprise it exists to
  // prevent.
  cascadeCardCopyNote: 'A copy is a new card owned by the board it lands on. Its threads do not come with it, and edits do not follow.',
  cascadeCardCopiedFrom: 'copied from',
  cascadeCardRemove: 'Remove from this board',
  cascadeCardOnlyBoard: 'its only board',
  cascadeOpenBoard: 'Open the board',
  cascadePlanSectionCards: 'Cards',
  // PW2 S2 AMENDMENT (Nick) — one heading, two clearly separated sections.
  // Fable's derived wording for the heading, standing until Nick words it.
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
  cascadeThemeTitle: 'Theme',
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
  graftCameFrom: 'Came from',
  graftKnobTip: 'Drag to graft',
  graftPairedPage: 'Page',
  tutorOpen: 'Open the Tutor',
  tutorClose: 'Close the Tutor',
  tutorTitle: 'The Tutor',
  // PHASE 1 (S3) - Nick's words. Arbor is the default (canonical) theme; Flux overrides below.
  // help-buttons (Nick approved Oct 12) - drawerLinksNote/-NoteLabel RETIRED:
  // the "?" beside this tab now reads helpGrafts (below), which carries both
  // themes' own sentences, through the shared HelpButton (Tutor.tsx).
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
  // ITEM word-diet (Nick, Oct 13, review fix) — the text itself, not just
  // its "?" placement, was missed in the first pass.
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
  // ITEM 84, THE DECK PHASE — the three preset labels are Nick's own lock-word
  // strings, byte-verbatim from the lock record §1 line 1.
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
  // word-diet-layouts (Nick's ruling, Oct 13) — the chip's own FACE, not its
  // prompt. See the DeskTermId union's own comment above for the split.
  tutorDraftAskStretchLabel: 'Selection',
  // TD4's disabled-visible state, named. The chip holds its slot without a
  // selection rather than appearing and vanishing (its gate flips by the second,
  // and layout stability outranks purity of absence for that case) — so it owes
  // the writer a reason, and this is it. An instruction aimed at the ACT, never at
  // the writer: the voice law binds chrome as well as asks.
  tutorDraftStretchNeedsSelection: 'Select a stretch on the page first',
  // The selection's own honesty line, the exact twin of `tutorDeltaTruncated`
  // above: shown when a selected stretch was too long to travel whole. The
  // model-facing half of this honesty is plain data in Tutor.tsx's own
  // SELECTION_TRUNCATION_HEADER and deliberately does NOT route through this
  // lexicon, per that same distinction.
  // ITEM word-diet (Fable, Oct 13) — {n} is the word count of the part
  // actually sent (Tutor.tsx's capSelection/selectionSentWords).
  tutorSelectionTruncated: 'The first {n} words were sent. Try a shorter passage.',
  tutorDisclosureTitle: 'Before you ask',
  tutorDisclosureBody: 'What you ask the Tutor travels to a language model; your pages stay yours.',
  tutorDisclosureAck: 'Got it',
  tutorDisclosureBodyV2: 'When you ask the Tutor, your question — and any new writing on this page since the Tutor last read it — travels to the language model provider configured for this app. Nothing is ever sent unless you ask. Your pages remain yours.',
  tutorDisclosureBodyV3: "When you ask the Tutor, your question — and any new writing on this page since the Tutor last read it, and any facts you've saved in this book's Bible — travels to the language model provider configured for this app. Nothing is ever sent unless you ask. Your pages remain yours.",
  // ITEM word-diet (Nick, Oct 13, HOLD resolved, TRUST) — moves behind a
  // "?" beside the Ask box, no standing text (Tutor.tsx's own composer
  // row). The one-time "Before you ask" modal that used to carry this
  // text (alongside tutorDisclosureBodyV3) retires whole — see that
  // component's own comment.
  tutorDisclosureBodyV4: "Nothing leaves your desk unasked. An ask sends your words, these Pages' recent changes, and your Bible. A counsel that reads more names it on its button, and sends only that, only when pressed.",
  // ITEM word-diet.
  tutorDeltaTruncated: 'Only new writing was sent.',
  tutorMeterTurnCost: 'This turn, est.:',
  tutorMeterSessionTotal: 'This session, est.:',
  // ITEM word-diet.
  tutorMeterTokensOnly: 'This turn (tokens only), est.:',
  tutorMeterTokensUnit: 'tokens',
  cascadePageNewPage: 'New Page', // ITEM word-diet-layouts, the singular-exception rule (Fable, Oct 15)
  // ITEM 203 - a record too large to sync is NAMED, and the writer is told it is safe here. {title} / {n} are filled in.
  // ITEM word-diet.
  syncTooLargeOne: '\u201C{title}\u201D is too large to sync. Saved on this device.',
  // NOUN-NEUTRAL on purpose: what cannot travel is any synced record (a page, a project, a drawer), so "pages" would sometimes lie.
  syncTooLargeMany: '{n} items too large to sync. Saved on this device.',
  // STORAGE-FULL STEP 1 (Fable's byte review, item 2) \u2014 the final strings; plain words, no alarm words. Each says
  // what is true and the one act that prevents loss, for the state it names.
  // ITEM word-diet. syncStorageFullPending is Nick's final HOLD pick.
  syncStorageFullPending: 'Storage full. Keep Wrizo open until this syncs.',
  syncStorageFullSynced: 'Storage full. Your changes synced, but this device can\u2019t keep a copy.',
  // Fable, 2026-09-30, one string, cleared without re-review: names WHERE the download is.
  syncStorageFullAnon: 'Storage full. Download a copy now from Publish.',
  syncStorageNearFull: 'Storage low. Stay online so your writing syncs.',
  // Fable, 2026-09-30: "near-full reads the same way for a signed-out writer (nothing reaches an account there)" \u2014
  // this desk's own wording, parallel to syncStorageFullAnon's cleared sentence; offered, not pre-cleared.
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
  // card-close-x (Nick's live test, 2026-10-13) - the card pop-up closes from an X in its
  // top-right corner; this is the X's accessible name (aria-label + title).
  boardPopupClose: 'Close',
  // ITEM 83 M4 (R3) — the Typewriter menu. Names are Nick's latest (F1's
  // default): "Forward Lock" and "Line Fade" govern; Chamber 1's "Forward
  // Momentum"/"Text Fade" retire.
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
  // theme-leftovers (Nick approved Oct 12, "Flux Word Picker"; never built
  // until now) — Arbor's own word for the Sliver's type section is "Font",
  // not "Typeface". Flux keeps "Typeface" (its own OVERRIDES entry, below).
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
  // FONT-SPAN (cursor/font-choices @ 6cc5f529, Nick approved Oct 15): highlighted words take the face alone; the whole choice changes all.
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
  // ITEM 114 (item 83 errata E4). The two sub-labels are written as the
  // DIFFERENCE between the controls they head, not as decoration: one names
  // what the page IS, the other names an act performed ON it. See Sliver.tsx's
  // Structure zone for the whole reasoning, and the offer record for the seam
  // this half-answers and does not resolve.
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
  boardNewPageCard: 'New Page', // ITEM word-diet-layouts, the singular-exception rule (Fable, Oct 15)
  // ITEM word-diet. Fable's own conditional: a board cannot be added to a
  // board today (no box kind:'board' exists in persistence.ts — every
  // Add-flow tool makes kind:'text' or pins an existing page), so this
  // uses "Add Cards or Pages", not the three-noun form — flagged for
  // Fable per that instruction.
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
  // ITEM word-diet (Fable, Oct 13, review fix) — this button opens the SAME
  // ExistingPagePicker as beginConnectPage's own "+ Filed Pages" door (both
  // call setExistingPageOpen(true)); one act, one name, not two.
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
  // ITEM 83 M7 (PP1) — the Boards zone already had a visible heading, but it
  // was the bare noun 'Boards' while its ACCESSIBLE name was the honest
  // 'Boards this page can join'. Same defect, milder: the eye got the noun,
  // the ear got the sentence. Standing memberships, said plainly.
  // PW1 S3/PW27 — same ruling, the Places zone's own face. "Also appears
  // on…" would now LIE outright (appearing means being displayed, and this
  // checkbox makes MEMBERSHIP), and "Pinned to boards…" carries the same
  // card-shaped implication one step quieter.
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

  // M2 S1 — the Progress-style setting.
  progressStyleLabel: 'Progress style',
  progressStyleBar: 'Bar',
  progressStyleRhizome: 'Rhizome',

  // ITEM word-diet (Nick, Oct 13) — the Recede-depth standing paragraph
  // moves into the lexicon AND behind a "?" (DrawerNote.tsx): the full
  // explanation lives here now; the Settings panel itself carries no
  // standing text for it at all.
  // help-buttons — now behind the NEW shared "?" (store/help.ts), not
  // DrawerNote (whose own "?" goes brass when open — this ticket's own
  // reason not to reuse it). Arbor's sentence is unchanged byte-for-byte;
  // Flux's own is new, below.
  recedeHint: 'Type and the menus fade; pause, reach an edge, or press Esc to bring them back.',

  // help-buttons (Nick approved Oct 12) — one plain sentence per themed
  // word, Arbor's own forms. Flux's are in OVERRIDES, below.
  helpGrafts: 'Grafts join pages, cards and boards.',
  helpTemplates: 'Ready-made page layouts.',
  helpFreeWrite: 'Write forward only. No going back to edit.',
  helpPublish: 'Share a page as a link or a file.',
  helpOutline: 'Numbered levels. Tab indents.',
  helpTitlePage: 'A standard manuscript title page.',
  // help-buttons (Fable, Oct 18) — the three row names Arbor's own picker
  // never renames (Blank/Screenplay/Bibliography stay plain English on this
  // theme, so no "?" shows here at all) — only Flux's own three remaining
  // renamed rows (plus Outline/Title Page above) carry an explainer.
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
};

// Flux registers its own capture-module name (the app's other live theme
// already renames the same module 'Log' over in themeLexicon.ts's 'journal'
// term) — kept in step here so the two seams never visibly disagree under
// the same theme, even though they're independent maps.
const OVERRIDES: Partial<Record<ThemeId, Partial<Record<DeskTermId, string>>>> = {
  flux: {
    // PAGE TEMPLATES - Flux's circuit-register words for the picker (the approved templates mockup): Presets, and Raw / Script / Spine / Cover / Sources.
    // railTypeface's own Flux override already lives below (theme-leftovers) - not duplicated here.
    railTemplates: 'Presets',
    templateBlank: 'Raw',
    templateScreenplay: 'Script',
    templateOutline: 'Spine',
    templateTitlePage: 'Cover',
    templateBibliography: 'Sources',
    // PHASE 1 (S3) - Flux's word for the same tab. No explainer: an empty term means no "?".
    corkboardJournalTab: 'Log',
    // AB3 — the Places face's Journal pull, kept in step with the corkboard
    // tab's own Flux name so the two seams never visibly disagree.
    // ITEM arbor-quiet-brass — the board-connection family. Arbor's own
    // CANONICAL words moved from "Connect"/"connected"/"connections" to a
    // tree register ("Graft"/"grafted"/"grafts"); Flux keeps its own
    // circuit register here with "Link"/"linked"/"links". (themeLexicon.ts's
    // unrelated `publish` term is ALSO shown as "Connect" under Flux today —
    // a different feature, Publish-to-web, not board connections; that one
    // is being renamed "Uplink" separately so the two words stop colliding.)
    // ITEM word-diet-layouts (Fable, Oct 15) — the board's own starter
    // words, Flux: "New Card · New Doc · Templates · Link Docs"; the
    // singular-exception rule (New Doc, not New Docs) joins this theme's
    // own circuit register (Link, not Graft — beginConnectPage was never
    // part of the arbor-quiet-brass Graft/Link family above; it is its
    // own door, independent of it, same as it was when it read "+ Filed
    // Pages"/"Link a Page"). boardPairWithPage's own override sits beside
    // its CANONICAL ('Start Pages') for the same collision reason.
    beginNewPageCard: 'New Doc',
    boardNewPageCard: 'New Doc',
    cascadeJournalNewPage: 'New Doc',
    cascadePageNewPage: 'New Doc',
    boardPairWithPage: 'Start Docs',
    ctxDeleteBoard: 'Delete circuit',
    toastBoardTrashed: 'Circuit moved to Trash',
    linksKindPage: 'Doc',
    linksKindBoard: 'Circuit',
    // Round 2: the card footer's own connecting phrase ("— grafted to: <label>"
    // Arbor, composed at BoardEditor.tsx's call site as "— {prefix}: {label}").
    // ITEM arbor-quiet-brass / Flux fix 5 — the Progress-style option reads
    // "Glitch" under Flux (Arbor keeps "Rhizome"); RhizomeField.tsx's own
    // `theme === 'plateau'` gate already renders nothing under Flux, so this
    // is a label-only fix (see that component's header comment).
    progressStyleRhizome: 'Glitch',
    // theme-leftovers (Nick approved Oct 12) — Flux keeps "Typeface" for the
    // Sliver's type section; Arbor's own CANONICAL word changed to "Font"
    // above, so this is now an explicit override rather than a shared default.
    railTypeface: 'Typeface',
    // help-buttons (Nick approved Oct 12) — Flux's own forms of the same
    // seven sentences (docs/mockups/help-buttons/index.html's own SAY table).
    helpTemplates: 'Ready-made doc layouts.',
    helpFreeWrite: 'Write forward only. No editing back.',
    helpPublish: 'Send a doc out as a link or a file.',
    helpOutline: 'A numbered spine. Tab indents.',
    helpTitlePage: 'A standard manuscript cover sheet.',
    // help-buttons (Fable, Oct 18) — the picker's own three remaining
    // renamed rows (Blank->Raw, Screenplay->Script, Bibliography->Sources).
    helpTemplateScreenplay: 'The script format: sluglines, dialogue, action.',
    recedeHint: 'Type to dissolve the chrome; pause, reach an edge, or press Esc to bring it back.',
    // ITEM splash-hold, ROUND 3 — Flux's own circuit-register voice for the
    // splash's cycling loading line (Nick's ruling).
    splashLoading1: 'Booting the terminal…',
    splashLoading2: 'Calibrating signal…',
    splashLoading3: 'Decrypting the archive…',
    splashLoading4: 'Patching the uplink…',
    // FLUX V2 (Fable's words pass, Nick Oct 21): the Flux words for the new shell. Rack, Cartridge, Track, Circuit, Doc, Log, Config, Skin, Operator, Inputs; the verb is "connect".
    // Every desk string that still named an Arbor noun is re-worded here, or sits on harness/flux-v2.mjs's reviewed keep-list (the printed page, the retired Shelf, story-craft prose, a web link).
    actionCopy: 'Copy doc text',
    actionDelete: 'Delete doc',
    actionDeleteConfirm: 'Send this doc to Trash?',
    backToDrawer: 'Back to Rack',
    beginConnectPage: 'Connect Docs',
    boardAddExistingPage: '+ Filed Docs',
    boardCanvasEmpty: 'Add Cards or Docs',
    boardFooterToggle: 'Show inputs',
    boardHomeLabelJournal: 'Log',
    boardPageDoor: 'Docs',
    boardPortedBadge: 'From Docs',
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
    helpTemplateBibliography: 'A sources and citations doc.',
    helpTemplateBlank: 'A blank doc. Nothing written yet.',
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
