# STATUS: milestone 6 built (the stages), not yet opened; waiting for Fable's check

Cursor lane, Nov 19, 2026. Branch `cursor/reorg-prototype`, from `0a629bd5`. Milestones 1 to 5 have passed Fable's check. Milestone 6 is built on Fable's GO of Nov 19, 11:40 am: the stages filled from `_sources/reorg-stage-table.md`, the whole table in one file, every stage NOT RULED, and the panel "What changed with this stage". The three questions with Fable had no answer when this was built, so the three defaults she named are built and listed in `NOT-RULED.md` (151, 152, 153).

## What milestone 6 adds (the stages, 6 G)

- **The table in one file: `stage-table.js`.** Every cell of the designers' table, in Machina's words: "On a Page" (drawn), "On a Board" and "On a Card" (here "On a Block", kept and not drawn). Inside it is plain JSON; the first line wraps it so a double-clicked page can read it. Change a cell, save, reload.
- **Four buttons, five columns.** SPRINT is Free Writing, BUILD is Drafting, EDIT is Revising, FINALIZE is Publishing. Workshopping is in the file, kept off screen.
- **Pressing a stage changes what the two menus offer.** Each tab of each menu has a band at its head, "PARTS IN BUILD", tagged NOT RULED, with the stage's offers as chips and the table's aside under them. A blue edge marks what the table sets in bold (new with the reorg). The session (Typewriter mode, the goal, the timer, progress) is a band at the Front menu's foot, gone in FINALIZE. In FEEDBACK the band is the Consultant's.
- **Three things a stage switches, beyond the bands.** "New part" is there only in SPRINT and BUILD. There is no split screen in SPRINT (the table's Q25): "Open beside" is greyed and every other way in says so. The session comes and goes.
- **It never changes the page.** The page, its Part, words and scroll are the same in every stage. The table's "resting surface" row is given in the panel as words, marked "not drawn".
- **"What changed with this stage".** A dashed button just right of FINALIZE opens a panel over the middle of the page, so both menus stay in sight. For each tab of each menu and the session it lists "+" gained and "−" lost against the stage she came from (or any other, from a row at its head), then the split screen, then the table's words for the page. It stays open as she presses stages. After every stage press a note counts what was gained and lost.
- **What is untouched:** everything ruled in A to F. The Parts list, its markers and toggles, the search field in every tab, the assets, the plan's rows and the feedback lines are in every stage. On a Board nothing changes but the note on its handles.

## Not opened, not checked by eye or by script

This lane ran no browser this time: there was no word from Nick to open it, and the rules allow only `git add`, `git commit` and `git push`. So **milestone 6 has not been loaded once.** Every change was read through against the code it calls; the table file was checked for trailing commas, missing commas and its 85 cells (17 rows of 5). Where a slip is most likely, so the check can start there:

- **A slip in `app.js` leaves the rail empty;** a slip in `stage-table.js` does not, but every band then says "stage-table.js did not load".
- **The bar at 1366.** The "What changed" button adds about 100 px after FINALIZE. By my count the bar still has about 200 px to spare with "Harbor Tolls, 1890 to 1912 / Part 3 of 5 · Methods"; not measured.
- **The Front menu in BUILD, on PARTS:** the band (ten chips) above "New part" and the list, and the session at the foot. The list should still scroll under the band.
- **SPRINT and the split:** `#sprint`, then "Open beside" on an asset should be greyed; `#split` from SPRINT should switch to BUILD and open the split.
- **The panel's counts, BUILD to EDIT (`#changed`):** TEXT gains "Find across the Doc"; PARTS loses New part, Name, Level and Make it its own Doc; THE SESSION loses the goal and the timer; FEEDBACK lists "in another order: The lenses, The four asks".
- **The page:** 415 / 64 / 620 × 640 in every stage and with the panel open.

## The doors added

`#sprint`, `#build`, `#edit`, `#finalize` (both menus open in that stage, each on the tab it was on), `#text`, `#ink` (the Front menu on that tab), `#session` (SPRINT, the Front menu on TEXT, the session at its foot), `#changed` (EDIT against BUILD, the panel and both menus open). The 45 earlier doors are unchanged in the code but for one thing: the split doors switch to BUILD if she is in SPRINT.

## What I invented

`NOT-RULED.md`, section G, lines 151 to 169. The ones that shape what Nick sees:

- **Where a stage's offers show:** a band of chips at the head of each tab, rather than whole menus redrawn for each stage (156). The built, ruled contents of each tab stay under it in every stage (158).
- **Each cell cut into single offers,** so "gained" and "lost" can be counted, and the words I had to choose where the brief's table has none: "Sprint Tips", "Page setup", "Progress" (154, 155).
- **The page is not drawn per stage** (162): no fading chrome in SPRINT, no lens marks in EDIT, no whole Doc in one scroll in FINALIZE.
- **The panel's place,** over the middle of the page, and that it stays open across stage presses (164).

## Questions for Fable

**Still with you from this morning (defaults built):**

1. **The `.json` file and double-click.** Built as `stage-table.js`: the same JSON inside one line of JavaScript, since a double-clicked page cannot read a `.json` file. Keep it, or serve the folder some other way?
2. **Five columns to four buttons.** Built: SPRINT, BUILD, EDIT, FINALIZE for Free Writing, Drafting, Revising, Publishing; Workshopping in the file, off screen.
3. **The Board and Card tables.** Built: only "On a Page" drawn; the other two in the file, in Machina's words, not drawn.

**New:**

4. **The page in each stage.** The table changes the page in three stages (SPRINT: the chrome fades as she types; EDIT: the lenses' marks on the page; FINALIZE: the whole Doc in one scroll, read-only). The brief says a stage changes the menus and never the page's words, and only the Part she is in scrolls. Built: none of it drawn, the table's words in the panel. Should any of the three be drawn?
5. **The corner tag at rest.** With both menus closed it still reads RULED (A, B); the stages' NOT RULED shows in the bands, the panel, the buttons' tooltips and the dashed "What changed" button. Is that enough for "mark every stage NOT RULED", or should the rest state read NOT RULED too?
6. **Search on a Board.** Your Nov 14 answer was "no search on a Board before milestone 6". Milestone 6 leaves it unbuilt; the note now says "in this prototype". Should it be built now, and what does it look in?
7. **The words I chose** where the brief's table has none: "Sprint Tips" for Free Writing Tips, "Page setup" kept, "Progress" kept rather than Machina's "Run".

## Before this milestone

What follows is this file as it stood after milestones 4 and 5 passed, kept for the record.

## After Fable's pass (Nov 14, 5:50 pm)

- **The fix: the corner note.** It was drawn over the content with no ground. Now, at rest, it is the mark and at most two lines, on a solid ground, inside the 64 px strip under the page, so it lies over nothing. In a split the asset's side runs to the window's foot, so there the note moves under the page's side and rests as the mark and "read the note". A click opens the whole note on a solid panel; a click again, or any change of what is on screen, closes it. The click changes nothing else on screen. Checked by script on the pushed page (`e36a5378`) at 1366 × 768: 31 doors, no script errors, and at rest the note overlaps nothing (the page, a menu, the asset's side, a Board, a pop-out, the line under the page). The page measured 415 / 64 / 620 × 640, and left 100 in the split.
- **Answer 2, built:** the page's side of a split does not close. The CLOSE over the page is gone; only the asset's side closes. The brief's words are "closes either side", so this is narrower than the brief (PROPOSED).
- **Answers 3, 4, 6, 9, 11, 12:** kept as built, now marked PROPOSED. **Answers 1 and 10:** kept as built, still NOT RULED; the five views are frozen.
- **Answer 5, settled at 7:00 pm:** a Block's name stays fixed everywhere in the prototype. Renaming comes with the Board's spec, after Nick's walk. Nothing was built for it.
- **Next: milestone 6** (the stages, from `claude/wrizors/reorg-stage-table.md`), in a fresh chat, every stage marked NOT RULED. Report the commits, the doors and the questions.

The rest of this file is as it stood for the check of milestones 4 and 5.

## Opened once, at Nick's word; no screenshots in `shots/`

Milestones 4 and 5 were pushed unseen. Then Nick asked to see the mockup in his Cursor window (Nov 14, 4:26 pm), so the pushed branch was opened there as a web page and every split and Board door was walked by script: **no script errors, the rail drawn, the page at 415 / 64 / 620 wide in every state outside the split and at 100 in it, the top bar inside 1366.** One door was broken and is fixed: `#split-doc` named a Doc that does not exist. Nothing else was checked by eye or by hand: the lists below still stand.

**Nick's answers of Nov 14, applied after that look:** Connect Doc stays on the left, after the Board's name and place, where the frames put it (question 7; it was moved beside the views for one commit and he kept the left). Once a Board has a Doc the button stays, as a plus sign in a square box; its list has recent Docs first, on a scroll, then "A new doc" (question 8).

**Two more from Nick, same sitting:** the WRIZO mark loses the lines above and below it, keeps the brass notch, and is centred over the rail; the list-or-boxes switch under the pins is smaller, left aligned and almost invisible. Both differ from the frames on purpose.

**And one that reverses an answer of Fable's:** Nick took the search's second row of scope tabs (PLAN, ASSETS, FEEDBACK) out as unnecessary. One row is left, the three frame P3-26A draws: THIS DOC, THIS PROJECT, EVERYTHING. Asked what should still be found, he ruled: **THIS PROJECT and EVERYTHING also find imported files (if readable), Boards and feedback, sorted by asset type.** Built as Docs, then Boards, then imported files, then feedback. What I guessed to build it is under question 1. Checked by script on the pushed page (`9ddf4691`), not by eye: no script errors; "toll" gives 7 in this doc, 17 in Thesis and 20 everywhere; the groups come as DOC, BOARD, IMPORTED, FEEDBACK; "gate" finds the scan by its name only; a found file opens beside the page.

Where a slip is most likely, so the check can start there:

- **A slip anywhere in `app.js` leaves the rail empty.** That is the first thing to look for.
- **The search was rewritten twice:** in milestone 4 for two rows of scope tabs, and again when Nick took the second row out. The counts to expect for "toll": 7 in this doc, 17 in Thesis, 20 everywhere. From the ASSETS tab it should open on THIS PROJECT and say 17 in Thesis. "gate" should find the scan "Plan of the north gate, 1889" by its name only.
- **The page's left in a split:** 100 at half in a 1366 window, and back to 415 when the asset's side closes.
- **Writing in a Block.** If the caret will not go into a Block's words, or a keystroke loses it, that is where.
- **The grip.** At 1366 wide it should only move right.
- **The top bar on a Board.** Six views and Connect Doc are wider than four stages. Measured with "Harbor map" connected to the long-named Doc: about 200 px to spare at 1366. A Project or Board with a much longer name has not been tried.
- **The Board over the page.** `#board` should show the Board at left 116, top 64, 1218 × 640, and the page's rectangle should still measure 415 / 64 / 620 × 640 underneath it.

## Fable's answers, applied (milestone 4's commit)

Changed: the toggle shows only on a Part with something connected (9). Oldest or newest first is one line at the top of the Parts list (10). The Parts' lettered boxes take their letter from the Part's name (14). BOX SETTINGS is not shown in no Project (16). A replace keeps the capital (5).

Kept as built, now marked PROPOSED or ruled in `NOT-RULED.md`: 2, 3, 4, 6, 7, 8, 11, 12, 13, 15.

**Answer 1 ("keep the two rows as two separate choices") was built, then replaced by Nick the same day:** the second row is gone. See question 1.

## What milestone 4 adds (the split screen)

- **The split.** An asset opens on the right from half (725 in a 1366 window), with a grip between the sides. The page keeps its size and its top and sits in the middle of its own side: left 100 at half, as frame P3-23A draws it.
- **Both menu handles are gone in a split,** and the menus with them. Closing the asset's side puts the page back at 415 and the menus back as they were.
- **The stage buttons fade;** the stage she is in keeps its light letters and its brass line.
- **Writing beside the page.** A click on a Block's words puts the caret there. A double click on its empty area pops it out and darkens the asset's side only. Esc closes the pop-out and never the split.
- **A second Doc beside the page** is read-only. The Doc she is in can open beside itself; the Part on the page is left out, with a line saying so.
- **Fable's two proposals:** the asset's name drops the Doc's connected assets, to swap without leaving the split; Ctrl+F in a split opens the search over the asset's side.

## What milestone 5 adds (a Board on its own)

- **The Board.** A Board's row in a Project's own list opens it on its own (`#board`): left 116, top 64, 1218 × 640 at 1366 × 768, with "Harbor map" as frame P3-NB-C draws it: three Blocks where the frame puts them, over the drawing of the shore and the mole.
- **The view options stand where the stage buttons stand:** Open, Plan, Flip, Walk, Storyboard, Thumbnails, the brass line under the one she is in. The four stages are not on a Board. All six can be pressed; only Open is from a frame.
- **Connect Doc** stands in front of the views. Pressed (`#board-connect`), it lists the Docs of the Board's Project, then "A new doc", as frame P3-NB-D draws. Pressing a Doc makes the Board one of that Doc's assets; the Board stays in its Project, and the button stays, so it can serve a second Doc (`#board-connected`).
- **The page is under the Board, untouched.** A small button over the Board's left corner goes back to it: the same Doc, Part, scroll and stage.
- **Blocks on a Board** are written in and popped out as beside the page.

## What I read

The brief, the rules file, and of the frames' HTML **P3-23A, P3-NB-C and P3-NB-D in full**. I did not read P3-23A2, P3-23B or P3-23C: they are options Nick's ruling replaced.

## Where the frames and the brief differ, and what I did

- **The handles in a split.** Frame P3-23A still draws both. Nick ruled them gone; they are gone.
- **The stages on a Board.** Frames P3-NB-C and P3-NB-D still draw SPRINT, BUILD, EDIT and FINALIZE in the top bar. The brief puts the Board's views there; the views are there.
- **"Connect Doc".** The frames word the button "Connect to a doc". I used the brief's "Connect Doc". Its place is the frames': on the left, after "Board · no doc yet".
- **Words.** The frames say "6 cards · linked to Part 3" and "3 cards". I used "6 blocks · connected to Part 3" and "3 blocks".
- **"Open" or "Open beside".** Frame P2-13A2 puts OPEN on an asset's row. The split is what that button does, and Machina's word for it is "Open beside", so the row says that. A Board's row there now also has "Open", for the Board on its own.
- **The Blocks of "Method notes"** are the six frame P3-23A draws. Milestone 3 had three made-up ones there; see `NOT-RULED.md`, 107 and 109.

## What I invented

`NOT-RULED.md`, lines 110 to 130 (milestone 4) and 132 to 149 (milestone 5). The ones that shape what Nick sees:

- **The page moves as she drags the grip,** because it keeps to the middle of its side.
- **How a second Doc and an imported file look** beside the page.
- **What Plan, Flip, Walk, Storyboard and Thumbnails show.** Five guesses, each marked NOT RULED at the Board's head.
- **The way back from a Board to the page,** and that the Board lies over the page instead of taking its place.
- **Connect Doc on a Board that already has a Doc,** and that she stays on the Board after connecting.
- **A new Board opens at once,** empty.

## Questions for Fable

**No question is open.** The one about renaming a Block was answered at 7:00 pm: leave it.

**The twelve below were all answered on Nov 14** (7 and 8 by Nick, the rest by Fable at 5:50 pm). They are kept for the record.

1. **The one-row search** (Nick, Nov 14: no second row; THIS PROJECT and EVERYTHING find Docs, Boards, imported files if readable, and feedback, sorted by asset type). Nick also ruled that EVERYTHING keeps a head for each Project and sorts by type under it. Three guesses are left in how it is built (`NOT-RULED.md`, 74, 75, 77 and 150):
   - **The order of the types:** Docs, Boards, imported files, feedback. Each group's head starts with its type; there is no separate head over each type.
   - **THIS DOC is unchanged:** the words of the Doc she is in, by Part. Its own assets and feedback are found from THIS PROJECT.
   - **"If readable":** a file that cannot be read is found by its name only and its row says so. Which file is a scan, and the lines inside the others, are made up.
2. **Closing the page's side of a split.** With a Board beside the page it now leaves the Board on its own. For a Block or an imported file the brief has no such screen: what should be left?
3. **The page in a split:** in the middle of its side, moving as she drags (built), or pinned at left 100 with the spare room between it and the asset?
4. **After a split,** should the menus come back as they were (built), or closed?
5. **A Block's name:** fixed (built), or can she write in it too?
6. **"Open beside" for a Doc:** on its row in a Project's own list (built), or somewhere else?
7. **Answered by Nick, Nov 14:** Connect Doc stays on the left, after the Board's name and place, as the frames draw it.
8. **Answered by Nick, Nov 14:** it stays, as a plus sign in a square box, and its list has recent Docs first on a scroll, then "A new doc".
9. **After connecting,** does she stay on the Board (built), or go to the Doc? And which Part does the Board join: none (built)?
10. **The five views with no frame.** Are Plan, Flip, Walk, Storyboard and Thumbnails near what you mean, or should they wait for frames?
11. **The way back from a Board to the page.** A small button over the Board's corner (built). Is there meant to be one, and where?
12. **Search and the two menus on a Board** only show a note. Is the search meant to work there before milestone 6?
