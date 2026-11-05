# Rulings: `apps/desktop/src/store/deskLexicon.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[deskLexicon §n]` points here.

## deskLexicon §1

From `apps/desktop/src/store/deskLexicon.ts`, line 5 at `7f1c6a84` (the comment that stays: "the desk lexicon: every user-facing zone/module/mode name, one flat map keyed by DeskTermId; a theme overrides only what it wants and the rest falls through; a sibling of themeLexicon so the two casings of Free Write never collide").

```ts
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
```

## deskLexicon §2

From `apps/desktop/src/store/deskLexicon.ts`, line 33 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
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
```

## deskLexicon §3

From `apps/desktop/src/store/deskLexicon.ts`, line 126 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
  // AB4 S5 — the board sliver's own hand tool(s). FX4 S6 — 'boardConnect'
  // (the Connect toggle's own label) retires along with the toggle itself
  // (replaced by BoardEditor.tsx's own handle-drag gesture) — removed
  // outright rather than parked: a lexicon string isn't a check with a
  // pass/fail history worth preserving, unlike ab4.mjs's own harness
  // checks (see fx4.mjs's PARKED section for those).
```

## deskLexicon §4

From `apps/desktop/src/store/deskLexicon.ts`, line 142 at `7f1c6a84` (the comment that stays: "the Fit-to-text icon on a hand-sized card: its tooltip and accessible name, per theme").

```ts
  // BUG 32d (Nick, Oct 30) - the small Fit-to-text icon on a hand-sized card (beside the resize grip): its tooltip and accessible name, per theme.
```

## deskLexicon §5

From `apps/desktop/src/store/deskLexicon.ts`, line 148 at `7f1c6a84` (the comment that stays: "the right-click menus, the "Send to Trash?" dialog, the Settings row and the toasts").

```ts
  // BOARD CONTEXT MENU (Nick, Oct 15) - the right-click menus, the "Send to Trash?" dialog, the Settings row, and the toasts.
```

## deskLexicon §6

From `apps/desktop/src/store/deskLexicon.ts`, line 152 at `7f1c6a84` (the comment that stays: "the Grafts / Links tab: the selected card's connections, each with an X that asks first").

```ts
  // CONNECTOR-B (Nick's approved connector mockup v6): the right drawer's Grafts / Links tab lists the selected card's connections, each with an X that asks first.
```

## deskLexicon §7

From `apps/desktop/src/store/deskLexicon.ts`, line 181 at `7f1c6a84` (the comment that stays: "the Free Write roster's preset labels are strings of record; the fourth member is the composer taking focus, so it has no string").

```ts
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
```

## deskLexicon §8

From `apps/desktop/src/store/deskLexicon.ts`, line 193 at `7f1c6a84` (the comment that stays: "the Draft roster's four asks are strings of record, asserted byte-exact (item84b.mjs); tutorDraftAskStretch's own words name what its wire sends").

```ts
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
```

## deskLexicon §9

From `apps/desktop/src/store/deskLexicon.ts`, line 219 at `7f1c6a84` (the comment that stays: "the disclosure's v2 body, kept beside the later versions as their history").

```ts
  // TU2 S3 — the disclosure's v2 body, Nick's ratified string verbatim
  // (added, not overwritten in place, so the lexicon keeps v1's body
  // legible as the version history it now is — see
  // store/tutorDisclosure.ts's header comment for the versioned-flag
  // mechanism this string is paired with). Title/ack are unchanged by the
  // brief's own wording and are reused as-is; only the body differs.
```

## deskLexicon §10

From `apps/desktop/src/store/deskLexicon.ts`, line 226 at `7f1c6a84` (the comment that stays: "the disclosure's v3 body: v2 plus the writer's Bible as a third traveler").

```ts
  // TU5 S6 — the disclosure's v3 body: v2's ratified sentence with ONE clause
  // added naming the writer's saved Bible facts as a third traveler, every
  // other word preserved (Candidate A). v2 kept above as legible version
  // history. Nick ratifies this string verbatim (or swaps the alternate) at
  // the schema word — see docs scratchpad's s6-disclosure-candidates.md.
```

## deskLexicon §11

From `apps/desktop/src/store/deskLexicon.ts`, line 232 at `7f1c6a84` (the comment that stays: "the disclosure's v4 body, rendered above v3 (v3 stands verbatim beneath it, unedited)").

```ts
  // ITEM 84 — the disclosure's v4 body: candidate B, ratified by Nick 2026-08-17,
  // provisionally-binding, committed at `1ef1659` in
  // docs/wrizo-alpha/disclosure-v4-committee-fable.md. Verified against that
  // record's own manifest before use — 1 sentence, 183 bytes, md5
  // 9287082c0e3c0a2b243c71ce01c89b43 — and rendered ABOVE v3 rather than in place
  // of it, per open-threads.md's ruling: "v3 → superseded by v4 in annotation form
  // (v3 standing verbatim beneath)". v3's string below is therefore not copied and
  // not edited; the modal reuses that very id, which is what makes "verbatim
  // beneath" mechanical instead of promised.
```

## deskLexicon §12

From `apps/desktop/src/store/deskLexicon.ts`, line 269 at `7f1c6a84` (the comment that stays: "a local write failure, by which of three states it is, plus the one-time near-full heads-up").

```ts
  // STORAGE-FULL STEP 1 (Fable's byte review, item 2) — an active local write failure, split by which of the three
  // true states it is (changes still not in the account / already all in the account / no account to reach at
  // all), plus the one-time near-full heads-up.
```

## deskLexicon §13

From `apps/desktop/src/store/deskLexicon.ts`, line 323 at `7f1c6a84` (the comment that stays: "the page's declared kind and its style guide; the two sub-labels say which control describes the page and which acts on it").

```ts
  // ITEM 114 (item 83 errata E4) — the page's declared KIND and, under
  // Research, its style guide. Two sub-labels join them, and they are the
  // load-bearing half of the answer to the Screenplay name collision: one zone
  // now says plainly which of its controls describes the page and which one
  // ACTS on it, so a kind chip reading "Screenplay" cannot be read as the
  // conversion door standing beside it.
```

## deskLexicon §14

From `apps/desktop/src/store/deskLexicon.ts`, line 350 at `7f1c6a84` (the comment that stays: "the Trash board's own terms; system boards name their own home (describePageHome knows nothing of them)").

```ts
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
```

## deskLexicon §15

From `apps/desktop/src/store/deskLexicon.ts`, line 401 at `7f1c6a84` (the comment that stays: "the Drawer terms: key names stay (internal ids), string values carry the writer's word").

```ts
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
```

## deskLexicon §16

From `apps/desktop/src/store/deskLexicon.ts`, line 545 at `7f1c6a84` (the comment that stays: "Character Study: dealt pre-threaded (connection boxes); per character the four self-card types; one Relationship card per adjacent pair").

```ts
  // B3 S2 — Character Study (decks/library/characterStudy.ts): promoted on
  // Fable's call as the threads demonstration (item 36) — dealt PRE-
  // THREADED, its relationship cards wired via the SAME 'connection' Box
  // kind BoardEditor.tsx's own thread-drag gesture already mints. Wizard:
  // how many characters (two/three/four) — each gets the same four self-
  // card types (composed titles: "<Label> <letter>: <type title>"); each
  // adjacent pair gets one Relationship card, threaded to both sides' own
  // Want vs. Need card.
```

## deskLexicon §17

From `apps/desktop/src/store/deskLexicon.ts`, line 555 at `7f1c6a84` (the comment that stays: "the Tier 1 decks' chrome (names, wizard prompts, step titles); questions, "?" sentences and examples are deck content (decks/content.ts), not lexicon").

```ts
  // W3 (guided paths, Nick Oct 23) - the new Tier 1 decks' own chrome: names, wizard prompts / options and step titles (one block, generated from the Wrizors' content doc), the
  // 'every room' heading for From my pages, and the Fifteen Beats' new 'Novel' answer. The QUESTIONS, '?' sentences and examples are deck content (decks/content.ts), not lexicon.
```

## deskLexicon §18

From `apps/desktop/src/store/deskLexicon.ts`, line 591 at `7f1c6a84` (the comment that stays: "the Recede-depth and Timer rows' own words, out of inline strings so a theme can name them").

```ts
  // FLUX WORDS (Nick's Oct 12 pass, folded into flux-v2): the Recede-depth and Timer rows' own words, moved out of the inline Seg strings so a theme can name them.
```

## deskLexicon §19

From `apps/desktop/src/store/deskLexicon.ts`, line 593 at `7f1c6a84` (the comment that stays: "one plain sentence per themed word, behind its own "?" (store/help.ts, HelpButton)").

```ts
  // help-buttons (Nick approved Oct 12, cursor/help-buttons @ d4d1c835) —
  // one plain sentence per themed word, shown behind its own "?" (store/
  // help.ts, components/HelpButton.tsx). recedeHint (above) is the seventh;
  // it already existed (DrawerNote), gaining only a Flux override here.
```

## deskLexicon §20

From `apps/desktop/src/store/deskLexicon.ts`, line 627 at `7f1c6a84` (the comment that stays: "the board's own modes: three tabs in the page-bar's grammar, the two doors (the arrow is a glyph, never prose), the telos line, the empty lane copy").

```ts
  // BM1 — the Board's Own Modes. The three mode tabs (in the page-bar's own
  // tab grammar), the two doors (PAGE →/PLAN →, the arrow is a decorative
  // glyph rendered in the component — never translated prose), the telos line
  // (one muted static line in the board's top region: chrome, not a toast —
  // it never animates, counts, or nags), the default/empty lane copy, and the
  // board-side explicit pairing entry. "The plan serves the page." travels
  // verbatim from the brief (Nick did not edit the proposed string).
```

## deskLexicon §21

From `apps/desktop/src/store/deskLexicon.ts`, line 648 at `7f1c6a84` (the comment that stays: "the empty board's doors and the empty page's start-words are door NAMES, not tasks; the child-card words per deck").

```ts
  // BG1 — the Beginnings. The empty board's doors (per mode) and the empty
  // page's three start-words. Door NAMES, not tasks: no verb-object
  // instruction, no "get started", nothing that could be read as a checklist
  // item. The page's three travel verbatim from P1 amendment 2 (Nick's word,
  // 2026-07-25) — one word each, "Sprout" superseding "Start from a Spark".
  // ADD SCENES (child cards under a step): per deck-word the door, its plural, the child's title word and its question; Feature Story's section asks its own; the popover's words; the Walk's readout (Flux n/m)
```

## deskLexicon §22

From `apps/desktop/src/store/deskLexicon.ts`, line 666 at `7f1c6a84` (the comment that stays: "the splash's cycling loading line, four phrases per theme").

```ts
  // ITEM splash-hold, ROUND 3 — the splash's own cycling loading line, four
  // per-theme phrases (Nick's ruling). Arbor's own voice is the canonical one;
  // Flux's own circuit-register voice is a Flux override, below.
```

## deskLexicon §23

From `apps/desktop/src/store/deskLexicon.ts`, line 686 at `7f1c6a84` (the comment that stays: "the font list's first row: {face} is the face that really renders when nothing is chosen (read from --font-prose)").

```ts
  // TOOLS #9 - MACHINA INTAKE (m5 / m6): one form, three fields at once.
  // TOOLS #10 item 10 - the font list's first row; {face} is the face that really renders when nothing is chosen (read from --font-prose).
```

## deskLexicon §24

From `apps/desktop/src/store/deskLexicon.ts`, line 766 at `7f1c6a84` (the comment that stays: "one "why" line per pick").

```ts
  // W4 (Help me choose) - one "why" line per pick, written to the content doc's register; Fable reviews the strings with the screens.
```

## deskLexicon §25

From `apps/desktop/src/store/deskLexicon.ts`, line 865 at `7f1c6a84` (the comment that stays: ""Start Pages": pairs THIS board with a new page, without colliding with the create buttons' "+ Pages"").

```ts
  // ITEM word-diet-layouts (Fable, Oct 15) — '+ Pages' collided with the
  // Pages panel's/Journal's own create button (cascadePageNewPage /
  // cascadeJournalNewPage, both literally "+Pages"-family words) even
  // though this button does something else entirely (pair THIS board with
  // a new page, one-to-one). "Start Pages" names the act without the
  // collision; Flux's own override ('Start Docs') sits in OVERRIDES below.
```

## deskLexicon §26

From `apps/desktop/src/store/deskLexicon.ts`, line 879 at `7f1c6a84` (the comment that stays: "every "make a new one" button is singular").

```ts
  // ITEM word-diet-layouts (Fable, Oct 15) — the singular-exception rule:
  // every "make a new one" button is singular. Joins boardNewPageCard/
  // cascadeJournalNewPage/cascadePageNewPage below, all four moving
  // together (the same "pages-rename bucket (a)" family, deskLexicon's own
  // standing note). Flux's own override ('New Doc') sits in OVERRIDES below.
```

## deskLexicon §27

From `apps/desktop/src/store/deskLexicon.ts`, line 885 at `7f1c6a84` (the comment that stays: ""Presets" names what the object is, the noun-door convention").

```ts
  // ITEM word-diet-layouts (Fable, Oct 15) — the board's own starter words:
  // Arbor "New Card · New Page · Templates · Connect Pages". "Load a Deck"
  // named the OBJECT it loads; "Templates" names what that object IS, the
  // same noun-door convention every other beginning here already uses.
```

## deskLexicon §28

From `apps/desktop/src/store/deskLexicon.ts`, line 890 at `7f1c6a84` (the comment that stays: ""Connect Pages": the same sheet as "+ Filed Pages", naming a different act").

```ts
  // ITEM word-diet-layouts (Fable, Oct 15) — Arbor's own word for this door
  // is now "Connect Pages" (was "+ Filed Pages", the ExistingPagePicker's
  // own button-face borrowed here; the two doors open the same sheet but
  // name a different act — THIS one invites connecting a page to the
  // board, not filing one). Flux's own override ('Link Docs') sits below.
```

## deskLexicon §29

From `apps/desktop/src/store/deskLexicon.ts`, line 906 at `7f1c6a84` (the comment that stays: ""Page" is grammatically plural ("these Pages") in rail, zone and door labels; physical-page rows are unaffected").

```ts
  // ITEM word-diet (Nick, Oct 13, review fix) — pages-rename bucket (a):
  // "Page" is always grammatically plural ("these Pages"); the rail/zone
  // and door labels below join drawerPage/boardPageDoor/cascadePageNewPage/
  // cascadeJournalNewPage/beginNewPageCard/boardNewPageCard/railPageKind/
  // boardAddExistingPage. Physical-page rows (pageEscHint, boardTelos,
  // inkInstrument) are unaffected — bucket (b), untouched.
```

## deskLexicon §30

From `apps/desktop/src/store/deskLexicon.ts`, line 945 at `7f1c6a84` (the comment that stays: "describePageHome's words, in the lexicon; pageHomeProject interpolates the place name").

```ts
  // ITEM word-diet (Nick, Oct 13) — store/pageHome.ts's own describePageHome
  // moves into the lexicon: it was hardcoded, outside both lexicons, found
  // during the census rather than already flagged. "Just the location",
  // Nick's own words — pageHomeProject interpolates the place name at the
  // call site (today that's the project's own title; read as a placeholder
  // for "wherever this page is filed", not a literal rename to a different
  // entity — flagged for confirmation in the report).
```

## deskLexicon §31

From `apps/desktop/src/store/deskLexicon.ts`, line 966 at `7f1c6a84` (the comment that stays: "the Page face's prose line uses the one connecting word ("grafted"): it names the membership, not a card that may not be on the canvas").

```ts
  // PW1 S3 (item 125), Fable's ruling 4 — the Page face's prose line takes the
  // ONE connecting word the whole slice speaks in. "Pinned to" named the
  // pin-card, which is now only ONE DISPLAY of the relation; a page can be a
  // member of a board and not appear on its canvas at all, so the old word
  // would describe a card that may not exist. "Connected" (now Arbor's own
  // "Grafted", item arbor-quiet-brass) names the membership itself, and
  // matches S1's own heading — one connecting word, two faces. Sentence
  // shape kept.
```

## deskLexicon §32

From `apps/desktop/src/store/deskLexicon.ts`, line 995 at `7f1c6a84` (the comment that stays: "every "make a new one" button is singular").

```ts
// ITEM word-diet-layouts, the singular-exception rule (Fable, Oct 15)
```

## deskLexicon §33

From `apps/desktop/src/store/deskLexicon.ts`, line 1004 at `7f1c6a84` (the comment that stays: "the term in sentence case; the zone's uppercase is the CSS register's").

```ts
  // PW1 S1 — Nick's exact term (Q2), in HIS sentence case. The zone's
  // presentation uppercase rides the CSS register, never the string: the
  // lexicon holds the word, the register holds the voice.
```

## deskLexicon §34

From `apps/desktop/src/store/deskLexicon.ts`, line 1015 at `7f1c6a84` (the comment that stays: "copy only: Move is a different act (an ownership transfer)").

```ts
  // PW2 S3 (item 123) — card transfer. COPY ONLY: Move is an ownership
  // transfer and a different act, deferred by name.
```

## deskLexicon §35

From `apps/desktop/src/store/deskLexicon.ts`, line 1020 at `7f1c6a84` (the comment that stays: "the tray ships only true clauses: a Box has no tags field, so "its tags come with it" waits until cards can be tagged").

```ts
  // THE TRAY'S DISCLOSURE, before the act. Item 123's ruled sentence also
  // carried "its tags come with it" — DEFERRED ON THE RECORD (Fable,
  // 2026-09-13), successor C4: a Box has no tags field, so cards cannot carry
  // tags yet and the clause has nothing to act on. The tray ships only the
  // true clauses; the middle one returns the day cards can be tagged. A tray
  // that promises what the product cannot do is the surprise it exists to
  // prevent.
```

## deskLexicon §36

From `apps/desktop/src/store/deskLexicon.ts`, line 1033 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
  // PW2 S2 AMENDMENT (Nick) — one heading, two clearly separated sections.
  // Fable's derived wording for the heading, standing until Nick words it.
```

## deskLexicon §37

From `apps/desktop/src/store/deskLexicon.ts`, line 1127 at `7f1c6a84` (the comment that stays: "dock a linked card or page beside the page").

```ts
// POLISH #10 item 24: dock a linked card or page beside the page
```

## deskLexicon §38

From `apps/desktop/src/store/deskLexicon.ts`, line 1138 at `7f1c6a84` (the comment that stays: "Arbor is canonical, Flux overrides below; the "?" beside this tab reads helpGrafts").

```ts
  // PHASE 1 (S3) - Nick's words. Arbor is the default (canonical) theme; Flux overrides below.
  // help-buttons (Nick approved Oct 12) - drawerLinksNote/-NoteLabel RETIRED:
  // the "?" beside this tab now reads helpGrafts (below), which carries both
  // themes' own sentences, through the shared HelpButton (Tutor.tsx).
```

## deskLexicon §39

From `apps/desktop/src/store/deskLexicon.ts`, line 1154 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
  // ITEM word-diet (Nick, Oct 13, review fix) — the text itself, not just
  // its "?" placement, was missed in the first pass.
```

## deskLexicon §40

From `apps/desktop/src/store/deskLexicon.ts`, line 1189 at `7f1c6a84` (the comment that stays: "the preset labels are strings of record").

```ts
  // ITEM 84, THE DECK PHASE — the three preset labels are Nick's own lock-word
  // strings, byte-verbatim from the lock record §1 line 1.
```

## deskLexicon §41

From `apps/desktop/src/store/deskLexicon.ts`, line 1217 at `7f1c6a84` (the comment that stays: "the chip's FACE, not its prompt (see the DeskTermId union's comment)").

```ts
  // word-diet-layouts (Nick's ruling, Oct 13) — the chip's own FACE, not its
  // prompt. See the DeskTermId union's own comment above for the split.
```

## deskLexicon §42

From `apps/desktop/src/store/deskLexicon.ts`, line 1226 at `7f1c6a84` (the comment that stays: "the selection's honesty line, twin of tutorDeltaTruncated; {n} is the word count of the part actually sent; the model-facing half is plain data in Tutor.tsx, not lexicon").

```ts
  // The selection's own honesty line, the exact twin of `tutorDeltaTruncated`
  // above: shown when a selected stretch was too long to travel whole. The
  // model-facing half of this honesty is plain data in Tutor.tsx's own
  // SELECTION_TRUNCATION_HEADER and deliberately does NOT route through this
  // lexicon, per that same distinction.
  // ITEM word-diet (Fable, Oct 13) — {n} is the word count of the part
  // actually sent (Tutor.tsx's capSelection/selectionSentWords).
```

## deskLexicon §43

From `apps/desktop/src/store/deskLexicon.ts`, line 1239 at `7f1c6a84` (the comment that stays: "behind a "?" beside the Ask box, no standing text").

```ts
  // ITEM word-diet (Nick, Oct 13, HOLD resolved, TRUST) — moves behind a
  // "?" beside the Ask box, no standing text (Tutor.tsx's own composer
  // row). The one-time "Before you ask" modal that used to carry this
  // text (alongside tutorDisclosureBodyV3) retires whole — see that
  // component's own comment.
```

## deskLexicon §44

From `apps/desktop/src/store/deskLexicon.ts`, line 1252 at `7f1c6a84` (the comment that stays: "every "make a new one" button is singular").

```ts
// ITEM word-diet-layouts, the singular-exception rule (Fable, Oct 15)
```

## deskLexicon §45

From `apps/desktop/src/store/deskLexicon.ts`, line 1258 at `7f1c6a84` (the comment that stays: "plain words, no alarm words: each says what is true and the one act that prevents loss, for the state it names").

```ts
  // STORAGE-FULL STEP 1 (Fable's byte review, item 2) \u2014 the final strings; plain words, no alarm words. Each says
  // what is true and the one act that prevents loss, for the state it names.
  // ITEM word-diet. syncStorageFullPending is Nick's final HOLD pick.
```

## deskLexicon §46

From `apps/desktop/src/store/deskLexicon.ts`, line 1263 at `7f1c6a84` (the comment that stays: "names WHERE the download is").

```ts
  // Fable, 2026-09-30, one string, cleared without re-review: names WHERE the download is.
```

## deskLexicon §47

From `apps/desktop/src/store/deskLexicon.ts`, line 1266 at `7f1c6a84` (the comment that stays: "near-full reads the same way for a signed-out writer").

```ts
  // Fable, 2026-09-30: "near-full reads the same way for a signed-out writer (nothing reaches an account there)" \u2014
  // this desk's own wording, parallel to syncStorageFullAnon's cleared sentence; offered, not pre-cleared.
```

## deskLexicon §48

From `apps/desktop/src/store/deskLexicon.ts`, line 1324 at `7f1c6a84` (the comment that stays: "the card pop-up's X: its accessible name (aria-label and title)").

```ts
  // card-close-x (Nick's live test, 2026-10-13) - the card pop-up closes from an X in its
  // top-right corner; this is the X's accessible name (aria-label + title).
```

## deskLexicon §49

From `apps/desktop/src/store/deskLexicon.ts`, line 1327 at `7f1c6a84` (the comment that stays: "the Typewriter menu: "Forward Lock" and "Line Fade"").

```ts
  // ITEM 83 M4 (R3) — the Typewriter menu. Names are Nick's latest (F1's
  // default): "Forward Lock" and "Line Fade" govern; Chamber 1's "Forward
  // Momentum"/"Text Fade" retire.
```

## deskLexicon §50

From `apps/desktop/src/store/deskLexicon.ts`, line 1377 at `7f1c6a84` (the comment that stays: "Arbor's word for the type section is "Font"; Flux keeps "Typeface" (its override, below)").

```ts
  // theme-leftovers (Nick approved Oct 12, "Flux Word Picker"; never built
  // until now) — Arbor's own word for the Sliver's type section is "Font",
  // not "Typeface". Flux keeps "Typeface" (its own OVERRIDES entry, below).
```

## deskLexicon §51

From `apps/desktop/src/store/deskLexicon.ts`, line 1396 at `7f1c6a84` (the comment that stays: "highlighted words take the face alone; the whole choice changes all").

```ts
  // FONT-SPAN (cursor/font-choices @ 6cc5f529, Nick approved Oct 15): highlighted words take the face alone; the whole choice changes all.
```

## deskLexicon §52

From `apps/desktop/src/store/deskLexicon.ts`, line 1410 at `7f1c6a84` (the comment that stays: "the two sub-labels are written as the DIFFERENCE between the controls they head: what the page IS, and an act ON it").

```ts
  // ITEM 114 (item 83 errata E4). The two sub-labels are written as the
  // DIFFERENCE between the controls they head, not as decoration: one names
  // what the page IS, the other names an act performed ON it. See Sliver.tsx's
  // Structure zone for the whole reasoning, and the offer record for the seam
  // this half-answers and does not resolve.
```

## deskLexicon §53

From `apps/desktop/src/store/deskLexicon.ts`, line 1461 at `7f1c6a84` (the comment that stays: "every "make a new one" button is singular").

```ts
// ITEM word-diet-layouts, the singular-exception rule (Fable, Oct 15)
```

## deskLexicon §54

From `apps/desktop/src/store/deskLexicon.ts`, line 1462 at `7f1c6a84` (the comment that stays: "no box can be a board today, so "Add Cards or Pages", not three nouns").

```ts
  // ITEM word-diet. Fable's own conditional: a board cannot be added to a
  // board today (no box kind:'board' exists in persistence.ts — every
  // Add-flow tool makes kind:'text' or pins an existing page), so this
  // uses "Add Cards or Pages", not the three-noun form — flagged for
  // Fable per that instruction.
```

## deskLexicon §55

From `apps/desktop/src/store/deskLexicon.ts`, line 1477 at `7f1c6a84` (the comment that stays: "opens the same ExistingPagePicker as beginConnectPage: one act, one name").

```ts
  // ITEM word-diet (Fable, Oct 13, review fix) — this button opens the SAME
  // ExistingPagePicker as beginConnectPage's own "+ Filed Pages" door (both
  // call setExistingPageOpen(true)); one act, one name, not two.
```

## deskLexicon §56

From `apps/desktop/src/store/deskLexicon.ts`, line 1491 at `7f1c6a84` (the comment that stays: "the eye gets the honest sentence the ear already had; "grafted" names membership, not appearing on the canvas").

```ts
  // ITEM 83 M7 (PP1) — the Boards zone already had a visible heading, but it
  // was the bare noun 'Boards' while its ACCESSIBLE name was the honest
  // 'Boards this page can join'. Same defect, milder: the eye got the noun,
  // the ear got the sentence. Standing memberships, said plainly.
  // PW1 S3/PW27 — same ruling, the Places zone's own face. "Also appears
  // on…" would now LIE outright (appearing means being displayed, and this
  // checkbox makes MEMBERSHIP), and "Pinned to boards…" carries the same
  // card-shaped implication one step quieter.
```

## deskLexicon §57

From `apps/desktop/src/store/deskLexicon.ts`, line 1801 at `7f1c6a84` (the comment that stays: "the Recede-depth explanation lives here, behind the shared "?"; the Settings panel carries no standing text").

```ts
  // ITEM word-diet (Nick, Oct 13) — the Recede-depth standing paragraph
  // moves into the lexicon AND behind a "?" (DrawerNote.tsx): the full
  // explanation lives here now; the Settings panel itself carries no
  // standing text for it at all.
  // help-buttons — now behind the NEW shared "?" (store/help.ts), not
  // DrawerNote (whose own "?" goes brass when open — this ticket's own
  // reason not to reuse it). Arbor's sentence is unchanged byte-for-byte;
  // Flux's own is new, below.
```

## deskLexicon §58

From `apps/desktop/src/store/deskLexicon.ts`, line 1815 at `7f1c6a84` (the comment that stays: "one plain sentence per themed word, Arbor's forms; Flux's are in OVERRIDES").

```ts
  // help-buttons (Nick approved Oct 12) — one plain sentence per themed
  // word, Arbor's own forms. Flux's are in OVERRIDES, below.
```

## deskLexicon §59

From `apps/desktop/src/store/deskLexicon.ts`, line 1823 at `7f1c6a84` (the comment that stays: "Arbor's picker never renames these rows, so no "?" shows; only renamed rows carry an explainer").

```ts
  // help-buttons (Fable, Oct 18) — the three row names Arbor's own picker
  // never renames (Blank/Screenplay/Bibliography stay plain English on this
  // theme, so no "?" shows here at all) — only Flux's own three remaining
  // renamed rows (plus Outline/Title Page above) carry an explainer.
```

## deskLexicon §60

From `apps/desktop/src/store/deskLexicon.ts`, line 1898 at `7f1c6a84` (the comment that stays: "the writer's own installed fonts (device-local); the missing-face note is quiet and says what happens").

```ts
  // TOOLS #10 item 11 - the writer's own installed fonts (device-local list). The missing-face note is quiet and says what happens.
```

## deskLexicon §61

From `apps/desktop/src/store/deskLexicon.ts`, line 2017 at `7f1c6a84` (the comment that stays: "Flux's circuit register (Link/linked/links, New Doc, Link Docs) where Arbor's canonical words are the tree register (Graft)").

```ts
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
```

## deskLexicon §62

From `apps/desktop/src/store/deskLexicon.ts`, line 2043 at `7f1c6a84` (the comment that stays: "the theme's own card word").

```ts
// POLISH #10 item 24: the theme's own card word (themeLexicon: Flux box = Node)
```

## deskLexicon §63

From `apps/desktop/src/store/deskLexicon.ts`, line 2051 at `7f1c6a84` (the comment that stays: "Flux keeps "Typeface": an explicit override now that Arbor's canonical word is "Font"").

```ts
    // theme-leftovers (Nick approved Oct 12) — Flux keeps "Typeface" for the
    // Sliver's type section; Arbor's own CANONICAL word changed to "Font"
    // above, so this is now an explicit override rather than a shared default.
```

## deskLexicon §64

From `apps/desktop/src/store/deskLexicon.ts`, line 2055 at `7f1c6a84` (the comment that stays: "Flux's own forms of the help sentences").

```ts
    // help-buttons (Nick approved Oct 12) — Flux's own forms of the same
    // seven sentences (docs/mockups/help-buttons/index.html's own SAY table).
```

## deskLexicon §65

From `apps/desktop/src/store/deskLexicon.ts`, line 2062 at `7f1c6a84` (the comment that stays: "Flux's three renamed template rows").

```ts
    // help-buttons (Fable, Oct 18) — the picker's own three remaining
    // renamed rows (Blank->Raw, Screenplay->Script, Bibliography->Sources).
```

## deskLexicon §66

From `apps/desktop/src/store/deskLexicon.ts`, line 2066 at `7f1c6a84` (the comment that stays: "Flux's circuit-register voice for the splash's loading line").

```ts
    // ITEM splash-hold, ROUND 3 — Flux's own circuit-register voice for the
    // splash's cycling loading line (Nick's ruling).
```

## deskLexicon §67

From `apps/desktop/src/store/deskLexicon.ts`, line 2072 at `7f1c6a84` (the comment that stays: "Flux's words for the shell; every desk string that still named an Arbor noun is re-worded here or on flux-v2.mjs's reviewed keep-list").

```ts
    // FLUX V2 (Fable's words pass, Nick Oct 21): the Flux words for the new shell. Rack, Cartridge, Track, Circuit, Doc, Log, Config, Skin, Operator, Inputs; the verb is "connect".
    // Every desk string that still named an Arbor noun is re-worded here, or sits on harness/flux-v2.mjs's reviewed keep-list (the printed page, the retired Shelf, story-craft prose, a web link).
```

## deskLexicon §68

From `apps/desktop/src/store/deskLexicon.ts`, line 2199 at `7f1c6a84` (the comment that stays: "Flux's words; Draft reads "Text"; Delete stays plain "Delete" in every theme").

```ts
    // FLUX WORDS (Nick's Oct 12 pass, approved; folded into flux-v2 on Fable's correction, Oct 21). Where it clashes with Oct 21, Oct 21 wins (Links -> Inputs, Circuits).
    // Nick's two answers (Oct 21): Flux's Draft tab reads "Text" (not Compile - Machina owns Build); Delete stays plain "Delete" in every theme (no Purge).
```

## deskLexicon §69

From `apps/desktop/src/store/deskLexicon.ts`, line 2240 at `7f1c6a84` (the comment that stays: "Flux's boards are Circuits").

```ts
// Fable's ruling Oct 26: Flux's boards are Circuits (the Arbor word is "Board"; Machina's is "Plan")
```

## deskLexicon §70

From `apps/desktop/src/store/deskLexicon.ts`, line 2276 at `7f1c6a84` (the comment that stays: "the theme's own word for the page").

```ts
// POLISH #10 item 24: the theme's own word for the page (flux-v2 LX2)
```

## deskLexicon §71

From `apps/desktop/src/store/deskLexicon.ts`, line 2283 at `7f1c6a84` (the comment that stays: "the theme's own page / card words").

```ts
// POLISH #10 item 24: the theme's own page / card words (themeLexicon: Machina page = File, box = Block)
```

## deskLexicon §72

From `apps/desktop/src/store/deskLexicon.ts`, line 2321 at `7f1c6a84` (the comment that stays: "Machina's register (Project, Folder, Part, File, Plan, Block, Notebook...), derived from Flux's noun-bearing entries so no other theme's noun survives; Flux's register words are not carried over").

```ts
    // MACHINA (docs/plans/machina-build.md §1c) - the corporate / mechanical register: Project, Folder, Part, File, Plan, Block, Notebook, Consultant, Asset, Controls, Theme.
    // Derived from Flux's own noun-bearing entries (same keys, Machina's noun) so no string that still names an Arbor or Flux noun survives under this theme; the words Nick locked
    // follow. Flux's own REGISTER words (Wire In, Patch, Terminal Mode, Quota, ...) are not carried over - Machina keeps canonical wherever Nick named no word.
    // ---- THE LOCKED WORDS (Nick, Oct 21, machina-words-pass.md as amended by his locking pass; docs/plans/machina-build.md §1c) ----
```

## deskLexicon §73

From `apps/desktop/src/store/deskLexicon.ts`, line 2329 at `7f1c6a84` (the comment that stays: "modeWorkshop is not overridden (the tab is hidden everywhere until built); the Plan door keeps "Plan" on purpose, an override over a renamed canonical").

```ts
    // modeWorkshop is NOT overridden: the Workshop tab is hidden in every theme until it is built (Nick, Oct 23 11:01 am).
    // The Plan door keeps the PRE-rename word ON PURPOSE (the approved mockup, cursor/machina-v1-mockup @ 360f3db3, draws "PLAN →"): Arbor's canonical renames to "Boards"
    // (step 3), and this explicit override is what keeps Machina's tab reading "Plan" - an override sitting on top of a renamed canonical, not an absence of one.
```

## deskLexicon §74

From `apps/desktop/src/store/deskLexicon.ts`, line 2334 at `7f1c6a84` (the comment that stays: "names a Page 'File' here, like boardPageDoor beside it").

```ts
// Fable, Oct 29: the board's pair-with-a-new-page button names a Page 'File' here, like boardPageDoor beside it
```

## deskLexicon §75

From `apps/desktop/src/store/deskLexicon.ts`, line 2363 at `7f1c6a84` (the comment that stays: ""attached" keeps Arbor's "grafted" from leaking into Machina; a one-word swap when the verb is chosen").

```ts
    // PROPOSED - Nick has not locked Machina's verb for a board connection (the words pass names the noun, "Assets"). "attached" keeps Arbor's "grafted" from leaking into
    // Machina; it is a one-word swap away from whatever Nick rules. Hand-up item in the build report.
```

## deskLexicon §76

From `apps/desktop/src/store/deskLexicon.ts`, line 2461 at `7f1c6a84` (the comment that stays: "the roster follows Machina's Free Write word").

```ts
    // The Tutor's Free Write roster follows Machina's Free Write word (Nick, Oct 24: "Free Writing Tips" ignored the lexicon) - the two keys were canonical-only, so the Sprint tab's Consultant still said Free Write.
```

## deskLexicon §77

From `apps/desktop/src/store/deskLexicon.ts`, line 2464 at `7f1c6a84` (the comment that stays: "the staged ask IS the chip label").

```ts
    // The Consultant's two chips read the approved mockup's wording (Fable's ruling 7); the staged ask IS the chip label.
```

## deskLexicon §78

From `apps/desktop/src/store/deskLexicon.ts`, line 2467 at `7f1c6a84` (the comment that stays: "empty on purpose, not a missing key: a missing key would fall back to Arbor's lines").

```ts
    // No splash loading lines under Machina (Fable's ruling 6): the Run strip is the readout. Empty on purpose - NOT a missing key (a missing key falls back to Arbor's garden lines).
```

## deskLexicon §79

From `apps/desktop/src/store/deskLexicon.ts`, line 2486 at `7f1c6a84` (the comment that stays: "the theme's own word for the page").

```ts
// POLISH #10 item 24: the theme's own word for the page (flux-v2 LX2)
```
