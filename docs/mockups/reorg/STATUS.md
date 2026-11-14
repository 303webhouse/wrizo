# STATUS: milestone 4 (Fable's answers of Nov 14, and the split screen)

Cursor lane, Nov 14, 2026. Branch `cursor/reorg-prototype`. Milestones 1, 2 and 3 passed Fable's check (2 and 3 at `bcb63c1d`). This commit applies Fable's sixteen answers and builds milestone 4 (brief, section 6 E). Milestone 5 (a Board on its own) is the next commit.

## Not run, and no screenshots

**I have not opened this page.** The rules allow no server and no command but `git add`, `git commit` and `git push`, and a browser run on this machine needs a grant this lane does not hold. Everything in this commit was written and read through, never run. Treat every "built" here and in `CHECKLIST.md` as "written, not seen". There are no screenshots in `shots/`.

Where a slip is most likely, so the check can start there:

- **A slip anywhere in `app.js` leaves the rail empty.** That is the first thing to look for.
- **The search was rewritten** to make its two rows two separate choices. The counts to expect for "toll": 7 in this doc, 13 in Thesis, 16 everywhere; with ASSETS pressed, 4 in Thesis; with PLAN pressed, 2 in this doc; with FEEDBACK pressed, 1 in this doc.
- **The page's left in a split:** 100 at half in a 1366 window, and back to 415 when either side closes.
- **Writing in a Block.** If the caret will not go into a Block's words, or a keystroke loses it, that is where.
- **The grip.** At 1366 wide it should only move right.

## Fable's answers, applied

Changed: the toggle shows only on a Part with something connected (9). Oldest or newest first is one line at the top of the Parts list (10). The Parts' lettered boxes take their letter from the Part's name (14). BOX SETTINGS is not shown in no Project (16). A replace keeps the capital (5). The search's two rows are two separate choices (1).

Kept as built, now marked PROPOSED or ruled in `NOT-RULED.md`: 2, 3, 4, 6, 7, 8, 11, 12, 13, 15.

**One answer I may have read wrongly: 1, "keep the two rows as two separate choices".** Before, the six scope tabs were one choice. I took the answer to mean two choices made side by side: how far she looks (THIS DOC, THIS PROJECT, EVERYTHING) and what she looks in (PLAN, ASSETS, FEEDBACK, or none for the words). So ASSETS with THIS PROJECT is "assets in this Project", and nine other pairings exist that the brief never names. If the answer meant "leave it as it was", say so and I will put it back.

## What milestone 4 adds

- **The split.** An asset opens on the right from half (725 in a 1366 window), with a grip between the sides. The page keeps its size and its top and sits in the middle of its own side: left 100 at half, as frame P3-23A draws it.
- **Both menu handles are gone in a split,** and the menus with them. Closing the asset's side puts the page back at 415 and the menus back as they were.
- **The stage buttons fade;** the stage she is in keeps its light letters and its brass line.
- **Writing beside the page.** A click on a Block's words puts the caret there. A double click on its empty area pops it out and darkens the asset's side only. Esc closes the pop-out and never the split.
- **A second Doc beside the page** is read-only. The Doc she is in can open beside itself; the Part on the page is left out, with a line saying so.
- **Fable's two proposals:** the asset's name drops the Doc's connected assets, to swap without leaving the split; Ctrl+F in a split opens the search over the asset's side.

## What I read

The brief, the rules file, and of the frames' HTML **P3-23A in full**. I did not read P3-23A2, P3-23B or P3-23C: they are options Nick's ruling replaced (the menu over the split; the asset on the left; the page first).

## Where the frame and the brief differ, and what I did

- **The handles.** Frame P3-23A still draws both. Nick ruled them gone; they are gone.
- **Words.** The frame says "6 cards · linked to Part 3". I used "6 blocks · connected to Part 3".
- **"Open" or "Open beside".** Frame P2-13A2 puts OPEN on an asset's row. The split is what that button does, and Machina's word for it is "Open beside", so the row says that.
- **The Blocks of "Method notes"** are now the six the frame draws. Milestone 3 had three made-up ones there; see `NOT-RULED.md`, 107 and 109.

## What I invented

`NOT-RULED.md`, lines 110 to 130. The ones that shape what Nick sees:

- **The page moves as she drags the grip,** because it keeps to the middle of its side.
- **A CLOSE over the page's right corner** for the page's side, and what is left when it is pressed.
- **How a second Doc and an imported file look** beside the page.
- **Only a Block's words can be written in,** not its name.
- **Where "Open beside" sits for a Doc:** on its row in a Project's own list.

## Questions for Fable

1. **Answer 1,** as above: two choices side by side (built), or the six tabs as one choice?
2. **Closing the page's side.** What should be left: the asset alone? For a Board that would be the Board on its own; for a Block or an imported file the brief has no such screen.
3. **The page in a split:** in the middle of its side, moving as she drags (built), or pinned at left 100 with the spare room between it and the asset?
4. **After a split,** should the menus come back as they were (built), or closed?
5. **A Block's name** beside the page: fixed (built), or can she write in it too?
6. **"Open beside" for a Doc:** on its row in a Project's own list (built), or somewhere else?
