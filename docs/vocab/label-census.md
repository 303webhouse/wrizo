# Label census — every writer-visible term, Arbor vs. Flux

Built for item arbor-quiet-brass's queue item 6 ("every menu item and heading should
read differently in each theme wherever possible," Nick). This is the measured
starting point — today's words, not proposed ones. Fable drafts the new words from
this list; Nick approves.

Two sibling lexicon files hold every theme-varying string in the app, same shape in
both: a `CANONICAL` map (Arbor/Plateau's own word, the default) and an `OVERRIDES` map
(Flux's divergent word where it has one; falls through to canonical where it doesn't).
Every row below comes from one of those two files — nothing here is guessed or
paraphrased from memory.

- **`apps/desktop/src/store/themeLexicon.ts`** — `TermId` → `{ one, many }`. 15 terms.
- **`apps/desktop/src/store/deskLexicon.ts`** — `DeskTermId` → a plain string. ~370 terms.

Order follows each file's own `CANONICAL` definition order, not alphabetical — that
mirrors how someone reading the source would check this table.

## 1. themeLexicon.ts

14 of 15 terms already diverge under Flux; only `script` doesn't.

| Term id | Arbor/Plateau (one / many) | Flux | Usage |
|---|---|---|---|
| page | Page / Pages | Doc / Docs | the base writable unit |
| shelf | Shelf / Shelves | Cache / Caches | the reference-material area |
| drawer | Drawer / Drawers | Rack / Racks | a project folder |
| binder | Binder / Binders | Cartridge / Cartridges | a drawer's own binder grouping |
| box | Box / Boxes | Node / Nodes | a board card primitive |
| board | Board / Boards | Circuit / Circuits | the corkboard/plan surface |
| notebook | Notebook / Notebooks | Deck / Decks | — |
| journal | Journal / Journals | Log / Logs | the capture module (mirrored by deskLexicon's `corkboardJournalTab`/`drawerPlaceJournal`) |
| plan | Plan / Plans | Schematic / Schematics | — |
| milestone | Milestone / Milestones | Checkpoint / Checkpoints | — |
| freewrite | Free write / Free writes | Overclock / Overclocks | `.one` is deliberately lowercase-w "Free write", byte-matching ModeSwitcher/JournalEntry's mode tab — a different seam from deskLexicon's `modeFreeWrite` ("Free Write", title case) on purpose |
| home | Home / Homes | Safehouse / Safehouses | — |
| voicewall | Voice Wall / Voice Walls | Firewall / Firewalls | — |
| publish | Publish / Publish | Uplink / Uplink *(item arbor-quiet-brass; was "Connect" — renamed to stop colliding with the board-connection family's new Flux word "Link")* | a verb/action label; `.many` mirrors `.one` on both sides |
| script | Script / Scripts | — same as Arbor — | the only term with no Flux override ("already dual-natured" per the file's own comment) |

## 2. deskLexicon.ts

Only a handful of ~370 terms have ever diverged under Flux. Everything marked
"— same as Arbor —" reads identically in both themes today — that is the real size of
the "read differently wherever possible" ask.

### Board's Own Modes / Beginnings (BM1, BG1)

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| boardModeOpen | Open | same | board mode tab |
| boardModeStoryboard | Storyboard | same | board mode tab |
| boardModeOutline | Outline | same | board mode tab |
| boardPageDoor | Page | same | board's PAGE→ door |
| pagePlanDoor | Plan | same | board's →PLAN door |
| pageEscHint | Press Escape to leave the page | same | screen-reader-only, never drawn visibly |
| boardTelos | The plan serves the page. | same | one muted static chrome line atop the board |
| boardLaneDefault | Cards | same | default lane name |
| boardStoryboardEmpty | No cards yet. Add cards in Open, then arrange them into order here. | same | empty state |
| boardOutlineEmpty | No cards yet. Add cards in Open, then shape them into an outline here. | same | empty state |
| boardPairWithPage | Pair with a page… | same | — |
| boardRenameLabel | Rename this board | same | board title edit affordance |
| beginNewCard | New Card | same | empty-board door |
| beginNewPageCard | New Page Card | same | empty-board door |
| beginLoadDeck | Load a Deck | same | empty-board door |
| beginConnectPage | Graft a Page *(item arbor-quiet-brass; was "Connect a Page")* | **Link a Page** | empty-board door |
| beginNewLane | New Lane | same | empty-board door |
| beginScreenplay | Screenplay | same | empty-page start-word |
| beginSprout | Sprout | same | empty-page start-word (supersedes old "Start from a Spark") |
| beginPlan | Plan | same | empty-page start-word |

### Mode tabs / zones / rail

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| modeFreeWrite | Free Write | same | mode tab (title case; distinct seam from themeLexicon's `freewrite.one`) |
| modeDraft | Draft | same | mode tab |
| modeRevise | Revise | same | mode tab |
| modeWorkshop | Workshop | same | mode tab |
| modePublish | Publish | same | mode tab |
| zoneWayfinding | Wayfinding | same | aria-label |
| zoneStrip | Strip | same | the cascade strip (first grid column) |
| zoneStage | Page | same | DeskFrame zone aria-label |
| zoneCorkboard | Corkboard | same | DeskFrame zone aria-label |
| zoneMeter | Meter | same | DeskFrame meter region aria-label |
| corkboardJournalTab | Journal | **Log** | the corkboard's capture-tab label |
| deskMenuGlyph | Desk menu | same | defined but no call site found anywhere in the repo — orphaned/unused |
| railInk | Ink | same | Sliver rail section |
| railControls | Controls | same | Sliver rail section |
| railForwardLock | Forward lock | same | Sliver rail section |
| railReading | Reading | same | Sliver rail section |
| railTypewriter | Typewriter | same | Sliver rail section |
| railFormat | Format | same | Sliver rail section |
| modeBarPen | Pen | same | ModeStage's unframed pen bar label |
| spreadLensInk | Ink | same | Spread.tsx's inline Ink content-lens chip |
| inkInstrument | The page's instrument | same | Ink-wave switch naming Text vs Ink |
| inkModeText | Text | same | Ink-wave switch option |
| inkModeInk | Ink | same | Ink-wave switch option |
| inkTip | Tip | same | drawer's ink-zone group label |
| inkNib | Nib | same | drawer's ink-zone group label |
| inkTipPen | Pen | same | ink tip name |
| inkTipPencil | Pencil | same | ink tip name |
| inkTipMarker | Marker | same | ink tip name |
| inkNibFine | Fine | same | ink nib name |
| inkNibRegular | Regular | same | ink nib name |
| inkNibBroad | Broad | same | ink nib name |
| inkEraser | Eraser | same | ink tool |
| inkWalnut | Walnut | same | ink color name |
| inkIron | Iron | same | ink color name |
| inkOxblood | Oxblood | same | ink color name |
| inkSea | Sea | same | ink color name |
| railStructure | Structure | same | Sliver rail section |
| railStructureProse | Prose | same | Structure sub-option |
| railStructureScreenplay | Screenplay | same | Structure sub-option |

### Drawer nav / Page face / Place face

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| drawerPage | Page | same | reused verbatim by CD2's Strip.tsx section label |
| drawerPlaceJournal | Journal | **Log** | Strip's Journal section label; also PlaceFace's old Journal pull |
| drawerPlaceShelf | Shelf | same | Strip's Shelf section label |
| drawerPlaceDrawers | Drawers | same | Strip's Drawers section label |
| pageFaceStar | Star | same | PageFace action |
| pageFaceStarred | Starred | same | PageFace state label |
| pageFaceAddTag | Add a tag | same | PageFace action |
| pageFaceAdd | Add | same | PageFace action |
| pageFaceMoveCopy | Move to… / Copy to… | same | PageFace action |
| pageFacePortToBoard | Port to a Board… | same | PageFace action |
| pageFacePin | Pin to a Board… | same | PageFace's membership-send verb |
| pageFacePinnedTo | Also grafted to *(item arbor-quiet-brass; was "Also connected to")* | **Also linked to** | PageFace's membership-line prefix; board title interpolated at call site |
| placeFaceOpen | Open | same | orphaned (PlaceFace.tsx retired) |
| placeFaceFileSend | File/Send | same | orphaned (PlaceFace.tsx retired) |
| placeFacePeek | Peek | same | orphaned (PlaceFace.tsx retired) |
| placeFacePeekSoon | Peek — coming soon | same | orphaned (PlaceFace.tsx retired) |
| placeFaceGoToRoom | Go to the Room | same | orphaned (PlaceFace.tsx retired) |
| placeFaceEmpty | Nothing here yet. | same | still reused — the cascade's own empty-list wording |

### Goal block / Sliver instruments / Strip roster

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| goalEdit | Set a goal | same | Sliver goal block |
| goalLabel | Goal | same | Sliver goal block |
| goalUnitLines | lines | same | goal unit word |
| goalSet | Set | same | Sliver goal block |
| goalClear | Clear | same | Sliver goal block |
| sliverOpen | Open hand tools | same | Sliver open affordance |
| sliverClose | Close hand tools | same | Sliver close affordance |
| sliverInstruments | Instruments | same | Sliver foot instruments row |
| sliverInstrumentsShow | Show | same | Sliver instruments row sub-label |
| sliverInstrumentsUnit | Unit | same | Sliver instruments row sub-label |
| stripPlan | Plan | same | strip roster (section B, joins Page) |
| stripSettings | Settings | same | strip foot, section D |
| stripChangeTheme | Themes | same | strip foot, section D |

### Cascade panels (Journal / Plan / Board / Drawers / Shelf / Settings / Theme / Survey / Dock)

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| cascadeJournalOpen | Open the Journal | same | — |
| cascadeJournalNewPage | New page | same | — |
| cascadeJournalRecent | Recent | same | — |
| cascadeJournalAll | All pages → | same | — |
| cascadePlanCreateBoard | Create a Board | same | — |
| cascadePlanPlotStory | Plot a Story | same | — |
| cascadePlanOpen | Open… | same | retired from every render path; kept for legibility |
| cascadePlanEmpty | No boards yet. | same | retired from every render path |
| cascadePlanBoardsConnected | Boards grafted *(item arbor-quiet-brass; was "Boards connected")* | **Boards linked** | Plan panel heading |
| cascadePlanRelationOwn | its own plan board | same | — |
| cascadePlanOwnSuffix | — plan | same | CascadePanels.tsx builds `${pageTitle} — plan` |
| cascadePlanNoDrawer | Not in a drawer | same | — |
| cascadePlanCaptionIn | in | same | Boards Connected zone's caption-on-a-board word |
| cascadeCardCopyTo | Copy to a board… | same | card transfer action |
| cascadeCardCopyTitle | Copy this card to a board | same | — |
| cascadeCardCopyNote | A copy is a new card owned by the board it lands on. Its threads do not come with it, and edits do not follow. | same | copy tray's disclosure sentence |
| cascadeCardCopiedFrom | copied from | same | — |
| cascadeCardRemove | Remove from this board | same | — |
| cascadeCardOnlyBoard | its only board | same | the inert-why note beside Remove |
| cascadeOpenBoard | Open the board | same | — |
| cascadePlanSectionCards | Cards | same | — |
| cascadePlanSectionPages | Pages | same | — |
| cascadePlanSectionBoards | Boards | same | — |
| cascadePlanLinkedHeading | Linked to this board | same | — |
| cascadePinShown | member · shown on the board | same | row-level display-state fact |
| cascadePinNotShown | member · not shown on the board | same | row-level display-state fact |
| cascadePinDisplay | Display on Board | same | — |
| cascadePinHide | Hide from the board | same | deliberately distinct from "Remove" (membership vs. display) |
| cascadePlanNoProject | File this page to a drawer first to plan around it. | same | — |
| cascadeBoardMove | Move to… / Copy to… | same | — |
| cascadeBoardDelete | Delete | same | — |
| cascadeBoardDeleteConfirm | Delete | same | confirm-dialog button |
| cascadeBoardDeleteCancel | Cancel | same | confirm-dialog button |
| cascadeBoardDeleteQuestion | Delete this board? This cannot be undone. | same | — |
| cascadeDrawersChoose | Choose a drawer to see what's filed inside. | same | — |
| cascadeDrawersEmpty | No drawers yet. | same | — |
| cascadeShelfBrowse | Browse the Shelf → | same | — |
| cascadeSettingsTitle | Settings | same | — |
| cascadeSettingsSignOut | Sign out | same | — |
| cascadeThemeTitle | Theme | same | — |
| cascadeSurveyEmpty | Nothing here yet. | same | survey/dock layer |
| cascadeSurveyCurrent | Current | same | survey/dock layer |
| cascadeDockClose | Close, keep browsing | same | — |
| cascadeDockReopen | Reopen | same | — |
| cascadeSurveyBack | Back | same | Plan survey's quiet back affordance to the board list |

### Board sliver / BoardEditor

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| railBoard | Board | same | Sliver.tsx's board hand-tools section header |
| boardAddCard | Add card | same | — |
| boardPortedBadge | From a page | same | a ported page's bounded-excerpt card badge |
| boardEditCopy | Edit copy | same | travels to the ported card's own full-text editor |
| boardLayerBringFront | Bring to front | same | selected overlapping card's layer-order icon |
| boardLayerSendBack | Send to back | same | selected overlapping card's layer-order icon |
| boardThreadGrab | Drag to graft *(item arbor-quiet-brass; was "Drag to connect")* | **Drag to link** | the pin / connection-grab gesture |
| boardThreadPrefix | thread | same | BoardEditor.tsx card footer "— thread: <label>" |
| boardThreadUntitled | Untitled | same | thread footer fallback label |
| boardFooterToggle | Show grafts *(item arbor-quiet-brass; was "Show connections")* | **Show links** | footer toggle for rendering threads |

### Tutor

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| tutorOpen | Open the Tutor | same | — |
| tutorClose | Close the Tutor | same | — |
| tutorTitle | The Tutor | same | — |
| tutorDockClose | Close, keep dock | same | — |
| tutorDockReopen | Reopen | same | — |
| tutorLensConsistency | Consistency | same | Tutor lens tab |
| tutorLensStructure | Structure | same | Tutor lens tab |
| tutorLensFragments | Fragments | same | Tutor lens tab |
| tutorLensConsistencyEmpty | No repeated or near-duplicate names found yet. | same | — |
| tutorLensFragmentsEmpty | Nothing recent or shared-tagged to resurface yet. | same | — |
| tutorLensFragmentsNote | Recency and shared tags only — nothing else. | same | — |
| tutorNudgesTitle | Waiting for you | same | — |
| tutorNudgesEmpty | Nothing waiting right now. | same | — |
| tutorBibleTitle | The book's Bible | same | book-fact store section header |
| tutorBibleNote | Facts you save travel with the book — the Tutor keeps them in mind. | same | — |
| tutorBibleEmpty | Nothing saved yet. | same | — |
| tutorBibleAddPlaceholder | Note a fact to remember… | same | — |
| tutorBibleAdd | Add | same | — |
| tutorBibleEdit | Edit | same | — |
| tutorBibleDelete | Delete | same | — |
| tutorBibleSave | Save | same | — |
| tutorBibleCancel | Cancel | same | — |
| tutorConversationTitle | Talk it through | same | — |
| tutorConversationPlaceholder | Ask a question… | same | — |
| tutorConversationSend | Send | same | — |
| tutorConversationEmpty | Nothing said yet. | same | — |
| tutorConversationSending | Thinking… | same | — |
| tutorConversationOffline | The Tutor is offline or not configured right now — the lenses above still work. | same | — |
| tutorConversationError | The Tutor could not be reached. Try again in a moment. | same | — |
| tutorConversationUnborn | Write a word first — this page isn't saved yet, so nothing was sent. | same | shown when the page has no first word yet |
| tutorFreeWriteRoster | Free Write presets | same | strings-of-record, Nick's lock word |
| tutorFreeWritePrompt | Writing Prompt | same | strings-of-record |
| tutorFreeWriteUnblock | Unblock | same | strings-of-record |
| tutorFreeWriteTips | Free Writing Tips | same | strings-of-record |
| tutorFreeWriteRefill | Write 100 words to unlock more prompts | same | Nick's own ruled wording — must stay a constant |
| tutorDraftRoster | Draft asks | same | group label, not an ask itself |
| tutorDraftAskDrag | Where does this drag? | same | strings-of-record |
| tutorDraftAskLoadBearing | What's load-bearing here — and what could go? | same | strings-of-record |
| tutorDraftAskThreadSlip | Where does the thread slip? | same | strings-of-record |
| tutorDraftAskStretch | Look at just this stretch — what's it doing? | same | selection-dependent chip |
| tutorDraftStretchNeedsSelection | Select a stretch on the page first | same | disabled-visible-state reason |
| tutorSelectionTruncated | Only the opening of your selected stretch was shared this time — the rest was too long to travel. | same | — |
| tutorDisclosureTitle | Before you ask | same | — |
| tutorDisclosureBody | What you ask the Tutor travels to a language model; your pages stay yours. | same | v1, superseded in render by v2/v3/v4 |
| tutorDisclosureAck | Got it | same | — |
| tutorDisclosureBodyV2 | (longer sentence re: question + new writing travels, nothing sent unless asked) | same | version history |
| tutorDisclosureBodyV3 | v2 + clause naming saved Bible facts as a third traveler | same | version history |
| tutorDisclosureBodyV4 | Nothing leaves your desk unasked: … | same | current/live disclosure body |
| tutorDeltaTruncated | Only your latest stretch of new writing was shared this time — earlier new writing since last time went unread. | same | — |
| tutorMeterTurnCost | This turn, est.: | same | session meter label |
| tutorMeterSessionTotal | This session, est.: | same | session meter label |
| tutorMeterTokensOnly | This turn (tokens only — no cost estimate for this model), est.: | same | fallback for a model with no cost-table entry |
| tutorMeterTokensUnit | tokens | same | bare reusable unit word |

### Cascade "doors" / sync & storage / logout

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| cascadePageNewPage | New Page | same | Page category's new unmissable door |
| syncTooLargeOne | "{title}" is too large to sync — it is saved on this device | same | {title} interpolated |
| syncTooLargeMany | {n} items are too large to sync — they are saved on this device | same | deliberately noun-neutral |
| syncStorageFullPending | This device's storage is full — keep Wrizo open and online until these changes reach your account | same | — |
| syncStorageFullSynced | This device's storage is full — your changes have reached your account, though this device can no longer keep its own copy | same | — |
| syncStorageFullAnon | This device's storage is full, and nothing else holds a copy of this writing — download a copy now from Publish | same | signed-out variant |
| syncStorageNearFull | This device is running low on storage — stay online so your writing reaches your account | same | — |
| syncStorageNearFullAnon | This device is running low on storage, and nothing else holds a copy of this writing — download a copy now from Publish | same | signed-out variant |
| syncRejectedOne | "{title}" could not be saved to your account — it is safe on this device and will keep trying | same | server-side rejection |
| logoutBlockedBody | {n} changes haven't saved to your account yet. Stay signed in until they save, or sign out anyway and lose them. | same | — |
| logoutBlockedRejected | The account could not take: {titles}. | same | — |
| logoutStay | Stay signed in | same | — |
| logoutAnyway | Sign out anyway ({n} changes will be lost) | same | — |
| logoutAnywayConfirm | Yes, sign out and lose {n} changes | same | — |
| logoutAnywayBack | Keep them | same | — |
| logoutBlockedBodyOne | 1 change hasn't saved to your account yet. Stay signed in until it saves, or sign out anyway and lose it. | same | singular variant |
| logoutAnywayOne | Sign out anyway (1 change will be lost) | same | singular variant |
| logoutSigningOut | Signing out… | same | — |
| logoutAnywayConfirmOne | Yes, sign out and lose 1 change | same | singular variant |
| syncPullShort | Your account sent {pulled} pages but {live} are showing — reload to try again | same | safety-net diagnostic |
| staleClientBody | Wrizo updated, reload | same | stale-client banner |
| staleClientReload | Reload | same | stale-client banner button |
| syncRejectedMany | {n} items could not be saved to your account — they are safe on this device and will keep trying | same | — |

### Page setup / Styling / Typewriter menu / Foot instruments

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| pageSetupHeading | Page setup | same | — |
| pageSetupMargins | Margins | same | — |
| pageSetupMarginsNormal | Normal | same | — |
| pageSetupMarginsNarrow | Narrow | same | — |
| pageSetupMarginsWide | Wide | same | — |
| pageSetupLineSpacing | Line spacing | same | — |
| pageSetupNumbers | Page numbers | same | — |
| pageSetupNumbersPlacementBottomCenter | Bottom centre | same | — |
| pageSetupNumbersPlacementBottomRight | Bottom right | same | — |
| pageSetupNumbersPlacementTopRight | Top right | same | — |
| pageSetupHeaders | Headers | same | — |
| pageSetupFooters | Footers | same | — |
| pageSetupHeaderText | Header text | same | — |
| pageSetupFooterText | Footer text | same | — |
| pageSetupSaveDefaults | Set as my default page settings | same | — |
| pageSetupSavedDefaults | Saved as your default. | same | — |
| pageSetupOn | On | same | — |
| pageSetupOff | Off | same | — |
| pageSetupExportNote | Numbers, headers and footers appear on export and print — the page on screen stays continuous. | same | — |
| stylingHeading | Styling | same | Free Write's styling zone |
| stylingOpen | Open Styling | same | — |
| stylingClose | Close Styling | same | — |
| stylingBold | Bold (Ctrl+B) | same | — |
| stylingItalic | Italic (Ctrl+I) | same | — |
| stylingUnderline | Underline (Ctrl+U) | same | — |
| stylingStrike | Strikethrough | same | — |
| twMenuHeading | Typewriter | same | Typewriter menu |
| twForwardLock | Forward Lock | same | supersedes "Forward Momentum" |
| twForwardLockWindow | Window | same | — |
| twUnitWords | Words | same | — |
| twUnitSentences | Sentences | same | — |
| twLineFade | Line Fade | same | supersedes "Text Fade" |
| twLineFadeLines | Lines shown | same | — |
| twWritingLine | Writing line | same | — |
| twLineTop | Top | same | — |
| twLineCenter | Centre | same | — |
| twLineBottom | Bottom | same | — |
| twPageScroll | Page Scroll | same | — |
| footTypewriter | Typewriter | same | foot's three-instrument row |
| footProgress | Progress | same | foot's three-instrument row |
| footFullScreen | Full Screen | same | foot's three-instrument row |
| footTarget | Target | same | foot's three-instrument row |

### Draft roster / Templates / Type controls / Structure+Style guide / Open Pages

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| draftHeading | Heading | same | Draft bullet/format roster |
| draftBullet | Round bullet | same | — |
| draftBulletCircle | Hollow bullet | same | — |
| draftBulletSquare | Square bullet | same | — |
| draftBulletStyles | Bullet styles | same | — |
| railTemplates | Templates | same | — |
| templateOutline | Outline | same | — |
| templateBibliography | Bibliography | same | — |
| templateTitlePage | Title page | same | — |
| templateCustom | Custom | same | — |
| comingSoon | Coming soon | same | — |
| railTypeface | Typeface | same | — |
| goalUnitWords | words | same | goal unit word |
| footSettings | Settings | same | — |
| footMenuTypewriter | Typewriter Mode | same | — |
| footMenuProgress | Progress Tracking | same | — |
| footMenuPreferences | Preferences | same | — |
| draftQuote | Block quote | same | — |
| draftIndent | Indent | same | — |
| draftOutdent | Outdent | same | — |
| draftSpacing | Line spacing | same | — |
| typeGroup | Type | same | accessible name only, no visible caption |
| typeFace | Typeface | same | aria-label |
| typeSmaller | Smaller | same | aria-label |
| typeLarger | Larger | same | aria-label |
| typeSize | Size in points | same | aria-label |
| draftAlignment | Alignment | same | — |
| draftAlignLeft | Align left | same | — |
| draftAlignCenter | Align centre | same | — |
| draftAlignRight | Align right | same | — |
| draftConvertToScreenplay | Convert to Screenplay… | same | destination-named verb |
| draftConvertToProse | Convert to Prose… | same | destination-named verb |
| structureKindLabel | This page is | same | names what the page IS |
| structureActLabel | Change the page itself | same | names an act performed ON the page |
| structureStyleGuideLabel | Style guide | same | — |
| kindNormal | Normal | same | — |
| kindScreenplay | Screenplay | same | — |
| kindResearch | Research | same | — |
| styleGuideMla | MLA | same | — |
| styleGuideApa | APA | same | — |
| styleGuideChicago | Chicago | same | — |
| styleGuideAp | AP | same | — |
| openPagesHeading | Open Pages | same | names what the list IS |
| openPagesSort | Sort Pages | same | — |
| openPagesMore | More for this Page | same | — |
| openPagesPlace | Place on this board | same | the list's own "put" verb |
| placeSortDate | Date | same | CascadePanels.tsx sort option |
| placeSortDrawer | Drawer | same | CascadePanels.tsx sort option |
| placeSortAZ | A–Z | same | — |
| placePageEmpty | No pages yet. | same | — |
| planNewCard | ＋ New card | same | — |
| planFitToContent | Fit to content | same | — |
| placesHomeHeading | This page lives in… | same | verb-phrase accessible name, was bare "Home" |

### Beginnings / Trash / Shelf / Places panel / Drawers panel

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| cascadePlanJustAPage | Just need a page? New Page is in the Page section. | same | Plan panel's no-project pointer |
| boardNewPageCard | New page card | same | board's own second hand-tool |
| boardCanvasEmpty | Nothing here yet — Add card, or New page card, from the tools. | same | — |
| drawerPlaceTrash | Trash | same | Trash system Board's seeded title |
| cascadeTrashOpen | Open the Trash | same | Trash category's single action |
| boardRestore | Restore | same | Trash Board's selected-card action |
| boardHomeLabelJournal | The Journal Board — has no drawer home | same | BoardEditor's override for the system Journal Board |
| boardHomeLabelTrash | The Trash Board — has no drawer home | same | same override, Trash Board |
| boardHomeLabelShelf | The Shelf Board — has no drawer home | same | same override, Shelf Board |
| shelfBoardEmpty | Nothing waiting. | same | Shelf's own quiet empty state |
| cascadeShelfOpen | Open the Shelf | same | — |
| boardAddExistingPage | Existing page… | same | board's Add flow, beside "New page" |
| placesTitle | Places | same | Places panel heading |
| placesHomeZoneLabel | Home | same | single-select zone |
| placesLoose | Loose | same | — |
| placesNewDrawer | File to a new drawer… | same | create + file in one move |
| placesNewDrawerPlaceholder | Drawer name | same | — |
| placesNewDrawerCreate | Create | same | — |
| placesNewDrawerCancel | Cancel | same | — |
| placesBoardsTitle | Also grafted to… *(item arbor-quiet-brass; was "Also connected to…")* | **Also linked to…** | — |
| placesBoardsZoneLabel | Boards this page can join | same | true-checkbox zone, membership only |
| placesBoardsEmpty | No boards yet. | same | — |
| drawersKindBoard | Board | same | tile-kind aria-label (assistive-tech only) |
| drawersKindDoc | Document | same | tile-kind aria-label |
| drawersLooseGroup | Loose | same | Drawers panel's loose-docs cluster label |
| createDrawerEyebrow | NEW DRAWER | same | — |
| createDrawerTitleLabel | Drawer title (optional) | same | — |
| createDrawerOpensNote | Opens the Drawer home — shape it as you go. | same | — |
| drawerHomeTitleLabel | Drawer title | same | — |
| backToDrawer | Back to Drawer | same | — |
| domainLabelCreative | Creative Drawer | same | — |
| domainLabelAcademic | Academic Drawer | same | — |
| domainLabelProfessional | Professional Drawer | same | — |
| journalRouteSendToDrawer | Send to a Drawer | same | — |
| journalRouteEmptyDrawers | No Drawers yet. | same | — |
| journalRoutePromoteDrawer | Promote to a new Drawer | same | — |
| sprintSaveToDrawer | Save to Drawer | same | QuickSprint.tsx save button |
| sprintSaveAsDrawer | Save as Drawer | same | QuickSprint.tsx save button |

### Deck Wizard engine chrome / room names / deck names

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| deckWizardStartFromDeck | Start from a deck… | same | — |
| deckWizardFromDeck | From a deck… | same | — |
| deckWizardChooseTitle | Choose a deck | same | — |
| deckWizardBack | Back | same | — |
| deckWizardCancel | Cancel | same | — |
| deckWizardContinue | Continue | same | — |
| deckWizardClose | Close | same | — |
| deckStartHereLabel | Start Here | same | wayfinding mark |
| deckRoomFiction | The Fiction Room | same | deck library room |
| deckRoomSpeculative | The Speculative Annex | same | deck library room |
| deckRoomScreen | The Screen Room | same | deck library room |
| deckRoomAcademy | The Academy | same | deck library room |
| deckRoomBusiness | The Business Desk | same | deck library room |
| deckRoomNewsroom | The Newsroom | same | deck library room |
| deckNameThreeAct | Three-Act Structure | same | deck library roster |
| deckNameWorldbuilding | Worldbuilding | same | deck library roster |
| deckNameFeatureScreenplay | Feature Screenplay | same | deck library roster |
| deckNameThesis | Thesis / Dissertation | same | deck library roster |
| deckNameGrant | Grant Application | same | deck library roster |
| deckNameFeatureStory | Feature Story | same | deck library roster |
| deckNameCharacterStudy | Character Study | same | deck library roster |

### Deck content (all 7 decks' wizard questions + card title/body pairs — none diverge in Flux)

Every term below is "— same as Arbor —" in Flux. Grouped by deck:

- **Three-Act Structure**: deckThreeActQPrompt "What are you writing?"; deckThreeActOptNovel "Novel"; deckThreeActOptNovella "Novella"; deckThreeActOptShortStory "Short story"; deckThreeActHookTitle "Hook" / Body; deckThreeActIncitingTitle "Inciting Incident" / Body; deckThreeActThresholdTitle "First Threshold" / Body; deckThreeActComplicationsTitle "Rising Complications" / Body; deckThreeActMidpointTitle "Midpoint Reversal" / Body; deckThreeActDarkestTitle "Darkest Point" / Body; deckThreeActClimaxTitle "Climax" / Body; deckThreeActResolutionTitle "Resolution" / Body; deckThreeActFinalImageTitle "Final Image" / Body.
- **Worldbuilding**: deckWorldbuildingQPrompt "What kind of world?"; deckWorldbuildingOptFantasy "Fantasy"; deckWorldbuildingOptSF "Science fiction"; deckWorldbuildingOptOther "Other"; deckWorldbuildingRulesTitle "Rules of the World" (body varies by wizard answer: deckWorldbuildingRulesBodyFantasy / BodySF / BodyOther); deckWorldbuildingHistoryTitle "Deep History" / Body; deckWorldbuildingPlacesTitle "Places & Maps" / Body; deckWorldbuildingCulturesTitle "Cultures & Factions" / Body; deckWorldbuildingPowerTitle "Power & Economy" / Body; deckWorldbuildingLanguageTitle "Language Notes" / Body; deckWorldbuildingIcebergTitle "The Iceberg" / Body.
- **Feature Screenplay** (Save the Cat's 15, always dealt): deckScreenplayQPrompt "Feature or pilot?"; deckScreenplayOptFeature "Feature"; deckScreenplayOptPilot "Pilot"; deckScreenplayPilotNote; then 15 title/body pairs in beat order: OpeningImage, ThemeStated, Setup, Catalyst, Debate, BreakTwo, BStory, FunGames, Midpoint, BadGuys, AllIsLost, DarkNight, BreakThree, Finale, FinalImage.
- **Thesis / Dissertation**: deckThesisQPrompt "Humanities or sciences?"; deckThesisOptHumanities / OptSciences; 5 base cards (Question, LitReview, Methodology, Evidence, Citation — Title/Body each); humanities-branch ChapterOne/Two/Three + Conclusion; sciences-branch IMRaD Intro/Methods/Results/Discussion (Title/Body each).
- **Grant Application**: deckGrantQPrompt "What kind of funder?"; deckGrantOptFoundation / OptGovernment / OptCorporate; 5 base cards (Need, Objectives, Methods, Evaluation, Budget — Title/Body each); deckGrantAlignmentTitle "Funder Alignment" with body varying by funder type.
- **Feature Story**: deckFeatureStoryQPrompt "What kind of feature?"; OptProfile/OptTrend/OptInvestigative; deckFeatureStoryNutGrafTitle "Nut Graf" with body by type; LedeA/LedeB/LedeC (Title "Lede Candidate A/B/C" + Body); SourceOne/SourceTwo (both titled "Source & Quote"); SceneOne/SceneTwo (both titled "Scene Card"); KickerA/KickerB (Title "Kicker Candidate A/B" + Body).
- **Character Study** (dealt pre-threaded): deckCharacterStudyQPrompt "How many characters in this study?"; OptTwo/OptThree/OptFour; deckCharacterStudyLabel "Character" (composes "<Label> <letter>: <type title>"); 5 card types per character (WantNeed, Wound, Contradiction, Voice) + one Relationship card per adjacent pair — each Title/Body.

### Progress style / Publish copy & download / Auth

| Term id | Arbor/Plateau word | Flux | Usage |
|---|---|---|---|
| progressStyleLabel | Progress style | same | offered only when Progress metric is Words |
| progressStyleBar | Bar | same | — |
| progressStyleRhizome | Rhizome | **Glitch** *(Flux fix 5; RhizomeField.tsx's own `theme === 'plateau'` gate already renders nothing under Flux — label-only fix)* | — |
| publishCopyWordsConfirm | Copied — your plain words are on the clipboard. | same | — |
| publishCopyFormattedConfirm | Copied — with formatting intact. | same | — |
| publishCopyFailed | Copy didn't go through — try again, or use Download below. | same | — |
| publishDownloadTitle | Download | same | — |
| publishDownloadPageMd | This Page (.md) | same | — |
| publishDownloadPageTxt | This Page (.txt) | same | — |
| publishDownloadBinder | This Binder | same | only renders when the open page has a binder home |
| publishDownloadEverything | Everything | same | — |
| publishDownloadConfirm | Downloading — check your downloads. | same | — |
| publishDownloadFailed | That download couldn't be made — nothing was lost, try again. | same | — |
| publishComingSoon | Publishing options — tailored to this work's type, destination, and format — are coming soon. | same | — |
| authInviteCodePlaceholder | invite code | same | Arrival.tsx placeholder-only field |
| authSignupByInvitation | By invitation, for now. | same | shown when no invite codes are configured |

## Hardcoded writer-visible strings — NOT routed through either lexicon

Flagged in passing while tracing usage, not an exhaustive sweep of the whole tree.
These are theme-relevant (several are literally the Theme panel) but live entirely
outside the two lexicon files above, so they cannot currently vary by theme at all —
worth deciding whether that migration is in scope before drafting new words for them.

1. **ModeStage.tsx SettingsPanel/ThemePanel** (~lines 644–708) — a cluster of plain
   inline `Seg` labels and option strings, explicitly carved out by the file's own
   comments as "deliberately inline, not per-option lexicon keys": `label="Progress"`,
   `label="Recede depth"` (`'Partial'`/`'Full'`), `label="Timer"` (`'On'`/`'Off'`),
   `label="Typewriter"` (`'On'`/`'Off'`), `label="Theme"`, `label="Voice"`
   (`'Serif'`/`'Sans'`), `label="Page"` (`'Light'`/`'Dark'`), `label="Fade"`
   (`'On'`/`'Off'`), `label="Ambiance"` (`'0'/'25'/'50'/'75'/'100'`).
2. **ModeStage.tsx aria-labels** — `"Writing settings"`, `"Session time"`,
   `"AI assist"`, `"Open AI assist"` / `title="AI assist"`, `"Collapse assist"` /
   `title="Collapse"`, `"Connect AI"` (dialog aria-label). Several are aria-only.
3. **Sliver.tsx's `SLIVER_SHORTCUT_LABEL`** (Ctrl/Cmd+/ chord constant) — its own
   header comment says this doesn't ride the lexicon seam on purpose (a keyboard-chord
   constant, not themed prose); still visible to the writer as the shortcut hint.
4. **BoardEditor.tsx's decorative door arrow glyph** — the arrow between PAGE→/→PLAN
   doors is a decorative glyph rendered in the component, never translated prose, by
   its own comment — not a defect, just outside the seam.
