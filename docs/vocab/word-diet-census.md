# Word-diet census

Nick (Oct 13), verbatim: "I want to get rid of the needlessly wordy phrases
that appear throughout the app like 'The Page lives in.' A phrase like that
should be replaced with just the location (Journal, drawer name, board name,
etc.). I want the aesthetics of the themes to do the work that's being done
right now by needlessly wordy and text-heavy menus. Again, the idea is to get
people writing and keep them writing, not trying to decipher cryptic messages
in the app."

**No strings are changed in this commit.** This is the census Fable asked
for before any cut is made: every visible string over about four words, in
both themes, from the lexicon and from hardcoded source, with a proposed
trim, which numbered rule drove it, and whether the string is screen-reader
copy (which may stay full regardless).

## The six rules (Nick, Oct 13, paraphrased into numbers for the table below)

1. **Name, don't narrate.** A label names the thing or place. "This page
   lives in…" → the place itself. "Boards this page can join" → "Boards".
   "More for this Page" → "More". (Nick's own three examples.)
2. **Delete headings that repeat what's on screen.** "This page is" above
   the Normal/Screenplay/Research picker goes — the picker already says it.
3. **Explanations move behind a "?", one plain sentence.** No standing
   paragraphs. Nick's own example: the Recede hint ("Type to dissolve the
   chrome. Stop, and after a pause it returns slowly. Reach an edge or
   press Esc to summon it back.").
4. **Empty states: one short line or nothing.**
5. **Prompts and errors: what happened plus what to do, fewest words.**
   Nick's own example: "Nothing sent: write a word first."
6. **Screen-reader-only text may stay full.** Not a cut rule — a carve-out.
   Marked in its own column below, not folded into 1–5.

Tutor's own disclosure (V4) is **TRUST**: every promise in it has to survive
a cut, so it's marked distinctly below rather than numbered 1–5, and I'm
flagging my own proposal for Fable/Nick's direct read rather than treating
it as routine.

## Scope calls, stated up front

- **Deck content (the 7 Decks' own wizard questions and card title/body
  text) is OUT OF SCOPE.** These are the writer's own starting material —
  seed text meant to be read once and then replaced or written over, not
  chrome narrating the app back at the writer. Nick's complaint is named at
  "menus"; cutting a Deck's own prompt text would damage the thing it's
  for. Listed in §5 below for completeness ("every visible string"), not
  because I'm proposing cuts to any of them.
- **Tutor's own authored prompts are OUT OF SCOPE for the same reason** —
  `tutorDraftAskLoadBearing`/`AskThreadSlip`/`AskStretch`, and
  `tutorFreeWriteRefill` is explicitly locked wording already ("Nick's own
  ruled wording — must stay a constant", per `docs/vocab/label-census.md`).
  These are strings-of-record, not narration.
- **This census is built against current `main`.** `flux-words` hasn't
  merged, so Flux's own long-form overrides (the Tutor disclosure variants
  that ticket touches) don't exist yet on this branch. Flux's SHORT
  overrides today (corkboardJournalTab, the board-connection family,
  progressStyleRhizome, splashLoading1-4 — all ≤4 words) don't need a
  word-diet pass at all. Every long string below that Flux has no override
  for is marked **theme: both** — Flux inherits Arbor's own wordy text
  verbatim today, so the cut applies equally to both until/unless a theme
  grows its own distinct wording.
- **The Pages-grammar ruling's (c) bucket folds in here, under this rule
  set, per Fable's instruction** — marked in §2 below, each with its own
  word-diet proposal instead of a grammar-only swap. Its (a) and (b) rows
  stand as already decided (grammar only, not re-litigated here); §2 marks
  which three physical-page rows (`pageEscHint`, `boardTelos`,
  `inkInstrument`) that decision added.

## §1 — Hardcoded (not in either lexicon)

| id / location | Theme | Current | Proposed | Rule | SR copy |
|---|---|---|---|---|---|
| `store/pageHome.ts` `describePageHome`, loose-origin branch (×2 call sites, identical text) | both | `Loose — belongs nowhere yet` | `Loose` | 1 (Nick's own "just the location" principle — this is the exact shape of his cited example, found independently) | no |
| `store/pageHome.ts` `describePageHome`, journal branch | both | `In the Journal` | `Journal` | 1 | no |
| `store/pageHome.ts` `describePageHome`, project branch | both | `` In ${project.title} `` | `${project.title}` (drop "In ") | 1 | no |
| `store/pageHome.ts` `describePageHome`, membership line | both | `Also in the Journal.` | `Also: Journal` | 1 | no |
| `ModeStage.tsx:678` AND `Sliver.tsx:1049` (identical, two call sites) `.mode-settings-hint` | both | `Type to dissolve the chrome. Stop, and after a pause it returns slowly. Reach an edge or press Esc to summon it back.` | Behind "?": `Type to dissolve the chrome.` (one sentence; the rest — the auto-return and the edge/Esc summon — moves behind the "?") | 3 (Nick's own cited example, verbatim) | no |
| `HomeFlow.tsx:163` `placeholder` | both | `Write the first thing that comes.` | *(no cut proposed — already terse, and it's the FIRST thing a brand-new writer sees; shortening a 6-word placeholder risks losing its only job, which is to invite rather than instruct)* | — | no |
| `UnlockCeremony.tsx:89` `aria-label` on the future-territories wrapper | both | `Future territories, not yet available` | *(unchanged — supplementary to the visible "Future territories" label beside it)* | — | **yes** |

## §2 — deskLexicon.ts CANONICAL, pages-rename (c)-bucket rows folded in under the word-diet rule

Grammar-only swaps for these (per the Pages ruling) are superseded here —
these get an actual cut, not just "Page" → "Pages".

| Term id | Theme | Current | Proposed | Rule | SR copy |
|---|---|---|---|---|---|
| `placesHomeHeading` | both | `This page lives in…` | *(delete the heading; show only the place — Journal / the drawer's name / the board's name, via the SAME `describePageHome` call §1 already proposes cutting)* | 1 (Nick's own example, verbatim) | no |
| `placesBoardsZoneLabel` | both | `Boards this page can join` | `Boards` | 1 (Nick's own example, verbatim) | no |
| `openPagesMore` | both | `More for this Page` | `More` | 1 (Nick's own example, verbatim) | no |
| `structureKindLabel` | both | `This page is` | *(delete — the Normal/Screenplay/Research picker directly below it already says it)* | 2 (Nick's own example, verbatim) | no |
| `structureActLabel` | both | `Change the page itself` | `Change` | 1 | no |
| `cascadePlanNoProject` | both | `File this page to a drawer first to plan around it.` | `Not in a drawer yet.` | 1 + 4 (reads as an empty-state line, not an instruction) | no |
| `tutorConversationUnborn` | both | `Write a word first — this page isn't saved yet, so nothing was sent.` | `Nothing sent: write a word first.` | 5 (Nick's own example, verbatim) | no |
| `cascadePlanJustAPage` | both | `Just need a page? New Page is in the Page section.` | `New Page is in the Page section.` | 1 (drop the rhetorical lead-in) | no |
| `boardPairWithPage` | both | `Pair with a page…` | `Pair…` | 1 | no |
| `beginConnectPage` | both | `Graft a Page` | `Graft` | 1 | no |
| `boardPortedBadge` | both | `From a page` | `Ported` *(or: leave as the grammar-only "From Pages" — this one's short enough that a further cut may not be worth the churn; flagging both options)* | 1 | no |
| `publishDownloadPageMd` | both | `This Page (.md)` | `Pages (.md)` | 1 | no |
| `publishDownloadPageTxt` | both | `This Page (.txt)` | `Pages (.txt)` | 1 | no |

Pages-grammar's own three physical-page additions (stay "page", untouched by
either ruling): `pageEscHint` ("Press Escape to leave the page" — screen-reader
only, SR=yes, no cut per rule 6), `boardTelos` ("The plan serves the page."),
`inkInstrument` ("The page's instrument"). `boardTelos` is long enough to
carry its own word-diet proposal regardless of the Pages-grammar question —
see §3.

## §3 — deskLexicon.ts CANONICAL, everything else over ~4 words

| Term id | Theme | Current | Proposed | Rule | SR copy |
|---|---|---|---|---|---|
| `boardTelos` | both | `The plan serves the page.` | *(delete; show the paired page's own title instead, where one exists — this is a "name the thing" cut, not a shorter sentence)* | 1 | no |
| `pageFaceMoveCopy` / `cascadeBoardMove` | both | `Move to… / Copy to…` | *(no cut — already two 2-word verbs separated by a slash; already minimal)* | — | no |
| `cascadeCardCopyTitle` | both | `Copy this card to a board` | `Copy to a board` | 1 | no |
| `cascadeCardCopyNote` | both | `A copy is a new card owned by the board it lands on. Its threads do not come with it, and edits do not follow.` | Behind "?": `A copy is independent — it won't track edits or threads back to the original.` | 3 | no |
| `cascadePinShown` | both | `member · shown on the board` | `Shown` | 1 | no |
| `cascadePinNotShown` | both | `member · not shown on the board` | `Hidden` | 1 | no |
| `cascadeBoardDeleteQuestion` | both | `Delete this board? This cannot be undone.` | `Delete this board? No undo.` | 5 | no |
| `cascadeDrawersChoose` | both | `Choose a drawer to see what's filed inside.` | `Choose a drawer.` | 1 | no |
| `tutorLensConsistencyEmpty` | both | `No repeated or near-duplicate names found yet.` | `No repeats yet.` | 4 | no |
| `tutorLensFragmentsEmpty` | both | `Nothing recent or shared-tagged to resurface yet.` | `Nothing to resurface yet.` | 4 | no |
| `tutorLensFragmentsNote` | both | `Recency and shared tags only — nothing else.` | Behind "?": `Recency and shared tags only.` | 3 | no |
| `tutorBibleNote` | both | `Facts you save travel with the book — the Tutor keeps them in mind.` | Behind "?": `Saved facts travel with the book.` | 3 | no |
| `tutorBibleAddPlaceholder` | both | `Note a fact to remember…` | `Add a fact…` | 1 | no |
| `tutorConversationOffline` | both | `The Tutor is offline or not configured right now — the lenses above still work.` | `Tutor offline — lenses still work.` | 5 | no |
| `tutorConversationError` | both | `The Tutor could not be reached. Try again in a moment.` | `Couldn't reach the Tutor. Try again.` | 5 | no |
| `tutorDraftStretchNeedsSelection` | both | `Select a stretch on the page first` | `Select a stretch first.` | 1 | no |
| `tutorSelectionTruncated` | both | `Only the opening of your selected stretch was shared this time — the rest was too long to travel.` | `Only the opening was sent — the rest was too long.` | 5 | no |
| `tutorDisclosureBody` (v1), `tutorDisclosureBodyV2`, `tutorDisclosureBodyV3` | — | *(dead — superseded in render by V4, per `docs/vocab/label-census.md`; not a visible string today)* | *(excluded — not live)* | — | — |
| `tutorDisclosureBodyV4` | both | `Nothing leaves your desk unasked: an ask sends your words, this page's recent changes, and your Bible; a counsel that reads more names it on the button and sends only that, only then.` | **TRUST — my own candidate, not a decision:** `Nothing leaves your desk unasked. An ask sends your words, your recent changes, and your Bible. A counsel that reads more names it on the button first.` (every promise kept: nothing-unasked, the three things sent, the opt-in-named-on-the-button mechanism for "reads more" — only trimmed for rhythm, not content) | TRUST (flagged for Fable/Nick directly, not treated as routine) | no |
| `tutorDeltaTruncated` | both | `Only your latest stretch of new writing was shared this time — earlier new writing since last time went unread.` | `Only your latest stretch was shared — earlier writing went unread.` | 5 | no |
| `tutorMeterTokensOnly` | both | `This turn (tokens only — no cost estimate for this model), est.:` | `This turn (tokens only), est.:` | 1 | no |
| `syncTooLargeOne` | both | `"{title}" is too large to sync — it is saved on this device` | `Too large to sync — saved on this device.` | 5 | no |
| `syncTooLargeMany` | both | `{n} items are too large to sync — they are saved on this device` | `{n} items too large to sync — saved on this device.` | 5 | no |
| `syncStorageFullPending` | both | `This device's storage is full — keep Wrizo open and online until these changes reach your account` | `Storage full — stay online to sync.` | 5 | no |
| `syncStorageFullSynced` | both | `This device's storage is full — your changes have reached your account, though this device can no longer keep its own copy` | `Storage full — synced; this device can't keep a copy.` | 5 | no |
| `syncStorageFullAnon` | both | `This device's storage is full, and nothing else holds a copy of this writing — download a copy now from Publish` | `Storage full — download a copy now from Publish.` | 5 | no |
| `syncStorageNearFull` | both | `This device is running low on storage — stay online so your writing reaches your account` | `Storage low — stay online to sync.` | 5 | no |
| `syncStorageNearFullAnon` | both | `This device is running low on storage, and nothing else holds a copy of this writing — download a copy now from Publish` | `Storage low — download a copy now from Publish.` | 5 | no |
| `syncRejectedOne` | both | `"{title}" could not be saved to your account — it is safe on this device and will keep trying` | `Couldn't save "{title}" — safe here, still trying.` | 5 | no |
| `syncRejectedMany` | both | `{n} items could not be saved to your account — they are safe on this device and will keep trying` | `{n} items couldn't save — safe here, still trying.` | 5 | no |
| `syncPullShort` | both | `Your account sent {pulled} pages but {live} are showing — reload to try again` | `{pulled} sent but {live} showing — reload to retry.` | 5 | no |
| `logoutBlockedBody` | both | `{n} changes haven't saved to your account yet. Stay signed in until they save, or sign out anyway and lose them.` | `{n} changes haven't saved yet. Stay signed in, or sign out and lose them.` | 5 | no |
| `logoutBlockedBodyOne` | both | `1 change hasn't saved to your account yet. Stay signed in until it saves, or sign out anyway and lose it.` | `1 change hasn't saved yet. Stay signed in, or sign out and lose it.` | 5 | no |
| `logoutBlockedRejected` | both | `The account could not take: {titles}.` | `Rejected: {titles}.` | 5 | no |
| `logoutAnyway` | both | `Sign out anyway ({n} changes will be lost)` | `Sign out anyway ({n} lost)` | 5 | no |
| `logoutAnywayOne` | both | `Sign out anyway (1 change will be lost)` | `Sign out anyway (1 lost)` | 5 | no |
| `logoutAnywayConfirm` | both | `Yes, sign out and lose {n} changes` | `Yes — lose {n} changes` | 5 | no |
| `logoutAnywayConfirmOne` | both | `Yes, sign out and lose 1 change` | `Yes — lose 1 change` | 5 | no |
| `pageSetupSaveDefaults` | both | `Set as my default page settings` | `Set as default` | 1 | no |
| `pageSetupExportNote` | both | `Numbers, headers and footers appear on export and print — the page on screen stays continuous.` | Behind "?": `These appear on export and print, not on screen.` | 3 | no |
| `boardCanvasEmpty` | both | `Nothing here yet — Add card, or New page card, from the tools.` | `Nothing here yet.` | 4 | no |
| `boardHomeLabelJournal` | both | `The Journal Board — has no drawer home` | `Journal` | 1 | no |
| `boardHomeLabelTrash` | both | `The Trash Board — has no drawer home` | `Trash` | 1 | no |
| `boardHomeLabelShelf` | both | `The Shelf Board — has no drawer home` | `Shelf` | 1 | no |
| `placesNewDrawer` | both | `File to a new drawer…` | `New drawer…` | 1 | no |
| `createDrawerOpensNote` | both | `Opens the Drawer home — shape it as you go.` | Behind "?": `Opens the Drawer home — shape it as you go.` *(already one plain sentence; the cut here is gating it behind "?", not shortening the sentence itself)* | 3 | no |
| `journalRoutePromoteDrawer` | both | `Promote to a new Drawer` | `Promote to Drawer` | 1 | no |
| `publishCopyWordsConfirm` | both | `Copied — your plain words are on the clipboard.` | `Copied as plain words.` | 5 | no |
| `publishCopyFailed` | both | `Copy didn't go through — try again, or use Download below.` | `Copy failed — try again or use Download.` | 5 | no |
| `publishDownloadFailed` | both | `That download couldn't be made — nothing was lost, try again.` | `Download failed — nothing lost, try again.` | 5 | no |
| `publishComingSoon` | both | `Publishing options — tailored to this work's type, destination, and format — are coming soon.` | `Publishing options are coming soon.` | 1 | no |

## §4 — close calls: already minimal, no cut proposed

Listed so the census is complete, not because a cut is owed.

| Term id | Theme | Current | Why no cut |
|---|---|---|---|
| `publishCopyFormattedConfirm` | both | `Copied — with formatting intact.` | already 5 words, states the one fact a confirm toast needs |
| `publishDownloadConfirm` | both | `Downloading — check your downloads.` | same — already terse |

## §5 — out of scope (listed for completeness, no cuts proposed)

**Deck content** (`docs/vocab/label-census.md` §"Deck content" — all 7 decks'
wizard questions and card title/body pairs; ~95 strings over 4 words,
`deckThreeAct*`/`deckWorldbuilding*`/`deckScreenplay*`/`deckThesis*`/
`deckGrant*`/`deckFeatureStory*`/`deckCharacterStudy*`). The writer's own
seed material, not chrome — see the scope note above.

**Tutor's own authored prompts**: `tutorDraftAskLoadBearing`,
`tutorDraftAskThreadSlip`, `tutorDraftAskStretch`, `tutorFreeWriteRefill`
(explicitly locked wording already). Strings-of-record, not narration.

## §6 — themeLexicon's `page` prose ripple (review fix, Oct 13)

Fable's own follow-up finding: `themeLexicon.ts`'s `page` term going
`{one:'Page', many:'Pages'}` → `{one:'Pages', many:'Pages'}` (built in the
first word-diet pass, per Fable's instruction) is read directly by ~14
other prose call sites across the app via `lex('page')`/`lexMany('page')` —
outside the deskLexicon §2/§3 rows above, and outside the ticket's named
scope when it was built. Several read with an article ("a page", "this
page", "an existing page"), which is now a flat grammar violation ("a
Pages") under Nick's own ruling; a few others disagreed in number only
(a verb keyed to a numeric count, against a noun that no longer varies by
count). Fixed here under BOTH rules at once — the grammar ruling (Pages is
always plural, never "a Pages"/"this Pages") and the word-diet rule (name,
don't narrate; cut wherever possible) — rather than only patching the
grammar, since several of these read more naturally once the now-redundant
singular/plural branching is cut outright.

| Location | Current (before) | Proposed (after) | Rule | SR copy |
|---|---|---|---|---|
| `Spread.tsx` H1 | `Every loose page, laid out.` | `All loose Pages, laid out.` | grammar ("Every" + a now-invariant-plural noun doesn't agree) | no |
| `Spread.tsx` Port button | `Port {n} page…` / `Port {n} pages…` (count ternary) | `Port these Pages…` (ternary cut, count dropped — Fable's review fix: never a number directly before "Pages") | 1, cut | no |
| `Spread.tsx` empty-state line | `No loose pages yet — pages you write in the Journal will spread out here.` | `No loose Pages yet.` | 4 (empty states: one short line or nothing — Fable's review fix; the second clause only narrated what the Spread already is) | no |
| `PageEditor.tsx` Copy button | title `Copy the clean page text`, button `Copy page text` | title `Copy the clean text`, button `Copy text` (sentence case — Fable's review fix) | 1 ("pages text" isn't standard English as a compound; name the act, not the object) | no |
| `JournalEntry.tsx` authored textbox | `aria-label="Journal page"` | *(unchanged — reverted)* | — rule 6 carve-out (SR labels keep full wording); "page" here is the notebook's physical page (bucket b), a literal word, not the lexicon term | **yes** |
| `JournalEntry.tsx` Copy button | title `Copy the page text`, button `Copy page text` | title `Copy the text`, button `Copy text` (sentence case) | 1 | no |
| `JournalEntry.tsx` notebook nav, Previous/Next/append/insert (×2 call sites each, framed + legacy) | `aria-label="Previous page"` / `"Next page"` / `"New page at the end"` / `"Insert a page here"` | *(unchanged — reverted)* | — rule 6 carve-out + bucket (b) (same reasoning as the textbox above) | **yes** |
| `ImportDraft.tsx` sub-line | `…and it becomes a page you can keep writing.` | `…and keep writing.` | grammar (`"a Pages"`) + 1, cut | no |
| `AddToSheet.tsx` `fileToShelf` toast | `` `${n} page(s) ${n===1?'stays':'stay'} in the Journal — …` `` / `` `Filed ${n} page(s) to the Shelf — …` `` | `` `These Pages stay in the Journal — …` `` / `` `Filed these Pages to the Shelf — …` `` (count dropped — Fable's review fix) | grammar + 1, cut | no |
| `AddToSheet.tsx` `fileStandalone`/`fileHere` toasts | `` `Filed ${n} page(s) to {binder} — …` `` | `` `Filed these Pages to {binder} — …` `` (count dropped) | 1, cut | no |
| `AddToSheet.tsx` `doAttachPlan` toast | `…the page stays in the Journal.` | `…these Pages stay in the Journal.` | grammar (plural subject, singular verb) | no |
| `AddToSheet.tsx` `fileHere` destination row | `File here as a new page` | `File here as new Pages` | grammar (`"a new Pages"`) | no |
| `ExistingPagePicker.tsx` dialog title + aria-label | `Add an existing page` | `Add existing Pages` | grammar (`"an existing Pages"`) + 1, cut | partial (title visible, aria-label mirrors it) |
| `PortToBoardSheet.tsx` dialog title | `Port this page to a Board` / `Port {n} pages to a Board` (count ternary) | `Port these Pages to a Board` (ternary cut, count dropped) | grammar (`"this Pages"`, Nick's own named example) + 1, cut | no |
| `DeskRail.tsx` wayback return chip | `aria-label="Return to the page"` | *(unchanged — reverted)* | — rule 6 carve-out + page-primacy (the return chip names the literal physical page) | **yes** |

Verified NOT broken, left untouched (no article, or already plural-safe):
`QuickSprint.tsx`/`PageEditor.tsx`/`ScriptEditor.tsx`'s bare `{lexMany('page')}`
tab labels; `ProjectHome.tsx`'s "Support pages"/"No support pages yet"/"+ Add
support pages"; `DrawersTree.tsx`'s "New Pages" door; `BeatWizard.tsx`'s
"sentences are for the pages."

**Review fix (Fable, Oct 13), three corrections to the pass above:**
1. Screen-reader labels keep full wording (rule 6) — the aria-label CUTS
   above are reverted (the textbox, the four nav buttons, the wayback
   chip); their word count stands.
2. The Journal notebook's paging is a physical page (bucket b): those same
   five labels use the literal word "page", never the lexicon term — the
   Pages-plural ruling doesn't reach them. DeskRail's wayback chip is the
   same bucket, by the page-primacy canon.
3. Never a number directly before "Pages" — `Spread.tsx`'s Port button,
   `PortToBoardSheet.tsx`'s title, and `AddToSheet.tsx`'s four toasts all
   drop the count for "these"/"These" (capital P throughout, matching
   Journal/Shelf/Drawer's own capitalized treatment — not lowercased via
   `.toLowerCase()` the way "page" used to be). `Spread.tsx`'s empty line
   is cut further, to `No loose Pages yet.`

## Counts

- §1 hardcoded: 7 found (4 from one function, `pageHome.ts`'s
  `describePageHome`; 1 duplicated at two call sites; 2 already-minimal or
  screen-reader, no cut).
- §2 (Pages-rename (c) rows, folded in): 13.
- §3 (everything else, CANONICAL): 44.
- §4 (no cut owed): 2.
- §5 (out of scope, not counted toward a cut): deck content (~95) + 4 Tutor
  prompts.
- Flux `OVERRIDES` today: 0 rows over 4 words (every current Flux override
  is ≤4 words; nothing to census there until a theme grows its own long
  copy).
- `themeLexicon.ts`: 0 rows over 4 words in either CANONICAL or
  `OVERRIDES.flux` — it's a pure noun lexicon (Page/Shelf/Drawer/Binder/
  Box/Board/Notebook/Journal/Plan/Milestone/Free write/Home/Voice Wall/
  Publish/Script), no prose. (Still true of the lexicon entries themselves;
  §6 is the prose BUILT AROUND one of those entries, in ~14 other files —
  a ripple from changing `page`'s own identity map, not a second lexicon
  pass.)
- §6 (themeLexicon `page` prose ripple, review fix): 16 call sites fixed
  (14 distinct strings, 2 of them doubled at a framed+legacy call site
  each) + 5 verified already-safe and left untouched.

66 rows carry an actual word-diet proposal (§2 + §3, minus the 2 in §4),
plus §6's 16 review-fix sites.
