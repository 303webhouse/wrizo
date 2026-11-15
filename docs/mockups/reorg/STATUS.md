# STATUS: milestones 4 and 5 (Fable's answers of Nov 14, the split screen, a Board on its own)

Cursor lane, Nov 14, 2026. Branch `cursor/reorg-prototype`. Milestones 1, 2 and 3 passed Fable's check (2 and 3 at `bcb63c1d`). Two commits since: `da00d744` applies Fable's sixteen answers and builds milestone 4 (brief, section 6 E); the commit after it builds milestone 5 (6 F). Milestone 6 (the stages) is not started.

## Opened once, at Nick's word; no screenshots in `shots/`

Milestones 4 and 5 were pushed unseen. Then Nick asked to see the mockup in his Cursor window (Nov 14, 4:26 pm), so the pushed branch was opened there as a web page and every split and Board door was walked by script: **no script errors, the rail drawn, the page at 415 / 64 / 620 wide in every state outside the split and at 100 in it, the top bar inside 1366.** One door was broken and is fixed: `#split-doc` named a Doc that does not exist. Nothing else was checked by eye or by hand: the lists below still stand.

**Nick's answers of Nov 14, applied after that look:** Connect Doc stays on the left, after the Board's name and place, where the frames put it (question 7; it was moved beside the views for one commit and he kept the left). Once a Board has a Doc the button stays, as a plus sign in a square box; its list has recent Docs first, on a scroll, then "A new doc" (question 8).

**Two more from Nick, same sitting:** the WRIZO mark loses the lines above and below it, keeps the brass notch, and is centred over the rail; the list-or-boxes switch under the pins is smaller, left aligned and almost invisible. Both differ from the frames on purpose.

**And one that reverses an answer of Fable's:** Nick took the search's second row of scope tabs (PLAN, ASSETS, FEEDBACK) out as unnecessary. One row is left, the three frame P3-26A draws: THIS DOC, THIS PROJECT, EVERYTHING. Asked what should still be found, he ruled: **THIS PROJECT and EVERYTHING also find imported files (if readable), Boards and feedback, sorted by asset type.** Built as Docs, then Boards, then imported files, then feedback. What I guessed to build it is under question 1. Checked by script on the pushed page (`9ddf4691`), not by eye: no script errors; "toll" gives 7 in this doc, 17 in Thesis and 20 everywhere; the groups come as DOC, BOARD, IMPORTED, FEEDBACK; "gate" finds the scan by its name only; a found file opens beside the page.

Where a slip is most likely, so the check can start there:

- **A slip anywhere in `app.js` leaves the rail empty.** That is the first thing to look for.
- **The search was rewritten twice:** in milestone 4 for two rows of scope tabs, and again when Nick took the second row out. The counts to expect for "toll": 7 in this doc, 17 in Thesis, 20 everywhere. From the ASSETS tab it should open on THIS PROJECT and say 17 in Thesis. "gate" should find the scan "Plan of the north gate, 1889" by its name only.
- **The page's left in a split:** 100 at half in a 1366 window, and back to 415 when either side closes.
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
- **A CLOSE over the page's right corner** for the page's side, and what is left when it is pressed (a Board beside the page now opens on its own).
- **How a second Doc and an imported file look** beside the page.
- **What Plan, Flip, Walk, Storyboard and Thumbnails show.** Five guesses, each marked NOT RULED at the Board's head.
- **The way back from a Board to the page,** and that the Board lies over the page instead of taking its place.
- **Connect Doc on a Board that already has a Doc,** and that she stays on the Board after connecting.
- **A new Board opens at once,** empty.

## Questions for Fable

1. **The one-row search** (Nick, Nov 14: no second row; THIS PROJECT and EVERYTHING find Docs, Boards, imported files if readable, and feedback, sorted by asset type). Four guesses in how it is built (`NOT-RULED.md`, 74 to 77 and 150):
   - **The order of the types:** Docs, Boards, imported files, feedback. Each group's head starts with its type; there is no separate head over each type.
   - **EVERYTHING keeps a head for each Project** and sorts by type under it, instead of one list by type across every Project.
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
