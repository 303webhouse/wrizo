import type { DeskTermId } from '../terms';

export const CANONICAL_CHROME = {
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
  // FLUX3 S1 - read only under ?flux3=1 in Flux (src/flux3/); shown in capitals by CSS. The count of a node's links is told in Flux's own
  // connect register ("connected to", "Drag to connect"): the Flux word pass retired "link" (flux-v2.mjs LX2b); the mockup's "n LINKS" waits for TOOLS' pass
  flux3LinkOne: 'connection',
  flux3LinkMany: 'connections',
  flux3ChecksumOk: 'Checksum OK',
  flux3ReadLevel: 'Level',
  flux3ReadZoom: 'Zoom',
  flux3ReadLast: 'Last',
  flux3KindPreset: 'Preset',
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

} satisfies Partial<Record<DeskTermId, string>>;
