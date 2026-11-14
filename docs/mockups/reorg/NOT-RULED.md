# NOT RULED: everything invented in this prototype

One line for each thing the brief does not state. Each is a best guess, tagged on screen (a corner tag, a chip beside it, or a note when it is pressed). Nothing here is decided.

Milestone 1 (the shell, the rail, a Project's own list).

## The shell

1. **Wider windows.** The top bar spans the window. The rail keeps its top (80) and a 40 px gap at its foot. A pop-out runs to the window's foot. The page stays 620 wide and sits in the middle of the room right of the rail (left 415 at 1366, left 692 at 1920), top 64.
2. **The page's height in a taller window.** It grows with the window: 640 at 768 high, 952 at 1080 high. The brief gives 620 × 640 for 1366 × 768 only.
3. **Smaller windows.** Under 1366 × 768 the frame keeps its size and the window scrolls.
4. **The corner tag** sits at the bottom right. Notes appear at the top right, under the bar, and leave after about five seconds.
5. **The stage buttons** move the brass mark and do nothing else until milestone 6.
6. **The top bar's names, the two menu handles and the "Ctrl+." chip** are drawn as in the frames and only show a note when pressed.
7. **Hover and keyboard looks:** an underline on hover, an outline on keyboard focus.

## The rail

8. **How a pop-out closes:** its rail item pressed again, Esc (the innermost open thing first), or a click on the room or the page. One pop-out is open at a time.
9. **An open pin's look:** a pale ring round the box; in the list view, an inset line like the other rail items.
10. **Too many pins for the rail:** the pin area scrolls, with a thin scrollbar.
11. **A Project she is in that is not pinned** still sits at the top of the rail; the pins below never repeat it (the frames show this for a pinned one).
12. **Opening a Doc from another Project moves her into that Project.** The rail's top box changes; her old Project shows among the pins if it is pinned.
13. **Opening a Doc closes the pop-out.**

## DOCS pop-out

14. **What "More kinds" lists:** Essay, Report, Letter, opening in place under the row.
15. **A new Doc** lands in the Project she is in, is named "Untitled doc" (or "Untitled screenplay" and so on), and opens at once on an empty page.
16. **A new Board made from DOCS** lands in the Project she is in, named "Untitled board", and the Project's own list opens to show it. (Frame P3-NB-C's foot says "in Thesis"; the brief does not.)
17. **Recent** keeps the last three Docs opened.
18. **The two page-default switches** flip and change nothing else.

## PROJECTS pop-out

19. **"New project"** makes "Untitled project": no letters, pale grey, not pinned.
20. **Pressing a Project's name** opens that Project's own list, as its box on the rail does.
21. **Pressing a Project's box in the list** picks it for BOX SETTINGS and opens them; the picked box gets a dark outline. The frames show the settings only for the Project she is in.
22. **The Notebook's row:** letters NB, pale grey, "the journal" under its name. It is not counted in the "6" or in the two pin counts.
23. **The Notebook's pin works** like any other. Pressing its name, or its box on the rail, only shows a note.
24. **Brass as a box colour on the rail** is plain brass. The frames give a rail tint for the other four colours only.
25. **"Your own colour"** opens the system's colour picker; the letters turn dark or white, whichever reads better.
26. **"Choose a picture"** opens the system's file picker. The picture takes the place of the colour and the letters, and a "NO PICTURE" button appears. Held in memory only.
27. **The letters field** takes up to two characters, shown in capitals.

## UNFILED pop-out

28. **"File"** opens a list under the row: every Project, then "A new project".
29. **A filed piece** joins the end of that Project's Docs as one Part.
30. **Inside the Trash:** a list, each row with RESTORE and "Delete for good". Restore puts a piece back where it came from. No frame shows this.
31. **Empty lists** say "Nothing is unfiled." and "The Trash is empty."

## A Project's own list

32. **The count in its head** leaves out boards when there are none ("7 docs").
33. **Empty lists** say "No docs here yet." and "No boards here yet."
34. **"New doc" here** makes the Doc in this Project, even if she is in another one.
35. **A Board's row** and its **CONNECT** button only show a note. CONNECT is drawn in frame P3-NB-B and is not in the brief; it is tagged PROPOSED when pressed.

## THEME and CONTROLS pop-outs

36. **THEME:** Machina (where she is), Arbor, Flux; two switches, Dark and Distraction free, that flip and change nothing. A guess from the vision note.
37. **CONTROLS:** one switch, Full screen, which works. A guess from the vision note. (The word CONTROLS itself is ruled: correction to the brief, Nov 14.)

## Made-up content

38. **Doc names outside the frames:** every Doc in Grants, Essays, Client work and Old drafts except "Fund narrative"; their word counts; the three pieces in the Trash.
39. **The page's words for any Doc but Harbor Tolls** are the same four paragraphs under the Doc's own name, as frame Ruled-3 does for "Notes on the ledgers".
40. **The line under the page** is worked out from the word count (260 words to a page, 230 words a minute), which gives the frames' "412 words · 1.6 pages · ~2 min read".

## For checking only

41. **Doors by address:** `index.html#docs`, `#projects`, `#box`, `#unfiled`, `#trash`, `#list`, `#list-grants`, `#pins-list`, `#day-one`, `#theme`, `#controls` open one state directly.
