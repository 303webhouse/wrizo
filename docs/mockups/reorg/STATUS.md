# STATUS: milestone 3 (the Back menu, search, find and replace)

Cursor lane, Nov 14, 2026. Branch `cursor/reorg-prototype`. Milestone 1 passed Fable's check. Milestone 2 (Fable's answers 1 to 4; brief 6 B and C) is the commit before this one. This commit builds milestone 3 (brief, section 6 D). Stopped here, waiting for Fable.

## Not run, and no screenshots

**I have not opened this page, for milestone 2 or for milestone 3.** The rules allow no server and no command but `git add`, `git commit` and `git push`, and a browser run on this machine needs a grant this lane does not hold. Both milestones were written and read through line by line, never run. Treat every "built" below, and in `CHECKLIST.md`, as "written, not seen".

Where a slip is most likely, so the check can start there:

- **A slip anywhere in `app.js` leaves the rail empty.** That is the first thing to look for.
- **The caret in the search field.** Every letter typed redraws the menu and puts the caret back. If typing stutters or the caret jumps, that is where.
- **Clicking into a tab's search field.** The menu is swapped a moment after the click. If the search opens without the caret in it, that is where.
- **Ctrl+F.** The page asks the browser not to open its own find bar. I have not seen whether every browser obeys from a double-clicked file.
- **Bringing a found word into view** on the page, and the thin scrollbar following it.

For the same reason there are **no screenshots** in `shots/`.

## What milestone 3 adds

- **The Back menu's three tabs.** PLAN and FEEDBACK now list something: seven made-up plan rows; "Ask the Consultant" and two made-up lines of feedback. Both are tagged NOT RULED. ASSETS is as milestone 2 left it.
- **A search field in every tab,** under the tabs. Clicking into it turns the whole menu into the search menu: the field stays where it was, six scope tabs sit under it, and the search starts on the scope of the tab she came from. From ASSETS that is the assets in this Project.
- **The top bar's search button and Ctrl+F** open the same search, in the same place, on THIS DOC.
- **Results** look as frames P3-26A and P3-26A2 draw them: a grey head for each Part, Doc or Board, a few words either side of the found word, a brass bar on the result she is on. Found words are marked on the page. Pressing a result goes to its Part and brings the word into view.
- **Find and Replace.** A closed line appears only once the search has found something in the Doc she is in. Opened: a "Replace with" field, "Replace all 7 in this doc", a "Replace" button on each row of her Doc, and a greyed "Replace across Thesis" labelled "later". Replacing really changes the mock words, until a reload.
- **Content.** Eleven Blocks have words so the search can find them; "toll" is placed to match the frames' counts as far as it can (see below).

## What I read

The brief again, the two feedback notes and the stage table. Of the frames' HTML, for this milestone: **P3-26A and P3-26A2 in full** (the two the brief names). **I did not read P3-26B or P3-26C.** They are the two options Nick did not pick; a narrow search of them returned only the top bar they share with 26A, and I left it there.

## Where the frames and the brief differ, and what I did

- **Where the search sits.** The frames hang a 304 px panel from the top bar's button, clear of the page. The brief says the Back menu itself becomes the search menu and that the bar and Ctrl+F open "the same search". So there is one search, in the Back menu's place, flush against the page. The frames are used for the look of the results only, as the brief says.
- **Words.** The frames say "CARD" and "1 CARD". I used BLOCK and "1 block".
- **The colour of a found word.** The frames use `#F1E3A0`; the brief says `#F6ECBE`. I used the brief's.
- **A found word on the page is not made heavier.** The frames draw it at weight 600. Heavier letters are wider, so her words would re-wrap each time she searched. In the list it is heavier, as drawn.
- **12 or 13 in Thesis.** Frame P3-26A2 counts 12. Mine finds 13, because the Block "Toll totals by year" (from frame P2-13B) has the word in its name and I search a Block's name as well as its words.

## What I invented

Everything is in `NOT-RULED.md` (109 lines; 68 to 99, 107 and 108 are this milestone's). The ones that shape what Nick sees:

- **The six scope tabs.** The frame has three (THIS DOC, THIS PROJECT, EVERYTHING). The ruling needs one more at least (assets in this Project). I added a second row, PLAN · ASSETS · FEEDBACK, one for each tab she can come from.
- **What PLAN, FEEDBACK and EVERYTHING search,** and how the ASSETS list is grouped.
- **How Find and Replace is offered:** a closed line that she opens, not a field that is always there.
- **An Undo button** after a replace.
- **What the PLAN and FEEDBACK tabs list.**
- **A result in another Doc opens that Doc,** and the search stays open.

## Questions for Fable

From milestone 3:

1. **The scope tabs.** Six in two rows (built), or the frame's three with the tab's own scope added some other way? And what should PLAN and FEEDBACK search?
2. **From the top bar and Ctrl+F,** the search always starts on THIS DOC, even when the Back menu is open on ASSETS. Right, or should it follow the open tab?
3. **Find and Replace as a closed line** she opens, or should the "Replace with" field simply appear once there are results?
4. **Replace outside her Doc's words.** On PLAN, ASSETS and FEEDBACK nothing can be replaced (built). Should a Block's words be replaceable from here?
5. **Capitals.** "Tolls" becomes "dues", not "Dues". Should a replace keep the capital?
6. **A result in another Doc:** open that Doc (built), or only show where it is?
7. **A found word on the page at its own weight** (built) or heavier, as the frames draw it?
8. **The search forgets its word when closed.** Should it remember?

Still open from milestone 2:

9. **The toggle on a Part with nothing connected.** Keep it on Introduction and Bibliography, or show it only where there is something to list?
10. **Oldest or newest first:** one choice for every Part, or one per Part?
11. **A pressed marker, pressed again:** take the filter off (built), or close the Back menu?
12. **The up arrow** lands at the top of the Part before. Should it land at that Part's end instead?
13. **A rail pop-out and the Front menu overlap.** Should opening one close the other?
14. **The little coloured boxes on the Parts** (S, M, F, B): I lifted them from frame P2-13A. What are they, and should Introduction have one?
15. **The Notebook's own list** has "New board" at its top because it opens "like any Project". Does a Board belong in the Notebook?
16. **In no Project:** "Board" in DOCS and BOX SETTINGS only show a note. Is that right, or should they be hidden?
