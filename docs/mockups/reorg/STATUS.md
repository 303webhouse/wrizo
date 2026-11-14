# STATUS: milestone 2 (moving between Parts, the Front menu's Parts tab)

Cursor lane, Nov 14, 2026. Branch `cursor/reorg-prototype`. Milestone 1 passed Fable's check. This commit applies Fable's answers 1 to 4 and builds milestone 2 (brief, section 6 B and C). Milestone 3 follows in the next commit.

## Not run, and no screenshots

**I have not opened this page.** The rules allow no server and no command but `git add`, `git commit` and `git push`, and a browser run on this machine needs a grant this lane does not hold. Milestone 2 was written and read through line by line, never run. Treat every "built" below as "written, not seen". A slip in `app.js` would leave the rail empty: that is the first thing to look for.

For the same reason there are **no screenshots** in `shots/`.

## Fable's answers, applied

1. **The Notebook** is not counted among the Projects, its pin works, and pressing it (its row, or its box on the rail once pinned) opens its own list like any Project: four pages, each a one-Part Doc.
2. **An Unfiled piece opens on the page like any Doc.** While she is in no Project the rail's top box is an empty box labelled Unfiled. Tagged PROPOSED.
3. **Box settings act only on the Project she is in.** The shortcut from the list is gone. A line under the settings says where to go to change another Project's box.
4. **The button on a Board's row reads "Connect Doc".** PROPOSED; it does nothing until milestone 5.
5. to 10. Nothing to build. `NOT-RULED.md` records them: the 1920 × 1080 default and the THEME and CONTROLS guesses stand, still NOT RULED.

## What milestone 2 adds

- **B. Moving between Parts.** The page shows one Part. It has its own thin scrollbar, capped by an up and a down arrow that go to the Part before and after. A quiet line at the Part's end reads previous · "end of Part 3" · next. The Part's place in the top bar drops a list of all Parts. Only the Part scrolls: it scrolls inside the page, and the page's edge stays where it is.
- **C. The Front menu, Parts tab.** The handle at the page's left edge opens it. Each Part with connected assets has a marker with a count (Sources 2, Methods 3, Findings 5). The marker opens the Back menu on ASSETS, filtered to that Part, with "Show all 11". A toggle on each Part expands it in place: up to four assets, oldest first, a flip to newest first, and a 3 px scrollbar when there are more than four (Findings has five).
- **The Back menu** is there as far as C needs it: the three tabs PLAN · ASSETS · FEEDBACK, and the ASSETS tab. PLAN, FEEDBACK and the search are milestone 3.
- **Content.** Each of the five Parts now has its own words, long enough to scroll. The eleven assets are in `data.js`.

## What I read

All of the brief again, the two feedback notes, the word notes and the stage table. Of the frames' HTML, for this milestone: **P2-12C, P2-12D, P2-13A, P2-13A2 and P2-13B in full.** I did not read the markup of P2-12A, P2-12B (12D is the two of them plus 12C) or P2-13C (the option not chosen); I saw those on the sheet only.

## Where the frames and the brief differ, and what I did

- **Words.** The frames say CARD, "6 cards", "LINKED TO", "show all 11", "New Part" and CONSULTANT (the third tab). I used the brief's: BLOCK, "6 blocks", "Connected to", "Show all 11", "New part", FEEDBACK.
- **"OPEN" on an asset's row** is in capitals in frame P2-13A2. The brief's button is "Open", so it reads "Open".
- **The line at the Part's foot.** Frame P2-12D draws the Part scrolled to its end. I put the line at the end of the Part's words, so she meets it when she gets there.
- **Brass edges.** The frames outline the brass bar on all four sides; the brief says an edge on both sides. I followed the brief, as in milestone 1.

## What I invented

Everything is in `NOT-RULED.md` (76 lines). The ones that shape what Nick sees:

- The words of four of the five Parts, and most of Methods. The word "toll" is placed to match frame P3-26A's count (2, 3 and 2).
- Three of the eleven assets, and the date on every asset.
- The toggle sits on every Part, also one with nothing connected.
- Oldest first or newest first is one choice for all Parts.
- A pressed marker, pressed again, takes the filter off.
- A rail pop-out lies over an open Front menu (they overlap by 245 px).
- What happens around an Unfiled piece on the page: where a new Doc lands, what the empty box does when pressed, what filing or trashing the piece she is in does.

## Questions for Fable

1. **The toggle on a Part with nothing connected.** The brief says "a toggle on each Part". Keep it on Introduction and Bibliography, or show it only where there is something to list?
2. **Oldest or newest first:** one choice for every Part, or one per Part?
3. **A pressed marker, pressed again:** take the filter off (built), or close the Back menu?
4. **The up arrow** lands at the top of the Part before. Should it land at that Part's end instead?
5. **A rail pop-out and the Front menu overlap.** Should opening one close the other?
6. **The little coloured boxes on the Parts** (S, M, F, B): I lifted them from frame P2-13A. What are they, and should Introduction have one?
7. **The Notebook's own list** has "New board" at its top because it opens "like any Project". Does a Board belong in the Notebook?
8. **In no Project:** "Board" in DOCS and BOX SETTINGS only show a note. Is that right, or should they be hidden?
