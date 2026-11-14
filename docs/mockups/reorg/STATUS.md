# STATUS: milestone 1 (the shell, the rail, a Project's own list)

Cursor lane, Nov 14, 2026. Branch `cursor/reorg-prototype`. Stopped here for Fable's check.

## Not run, and no screenshots

**Nobody has opened this page yet.** The rules allow no server, and the one browser tool this lane has refuses local files, so the prototype was written and read through line by line but never run. Treat every "built" below as "written, not seen". The first double-click on `index.html` is the first real test; a slip in `app.js` would leave the rail empty.

For the same reason there are **no screenshots** in `shots/`. The task allowed skipping them.

## What is done

Open `docs/mockups/reorg/index.html` by double-click. Four files do the work: `index.html`, `reorg.css`, `data.js` (the made-up content) and `app.js`. No framework, no build, nothing installed.

- **The shell** at 1366 × 768: top bar 40, rail 84, the page 620 × 640 at left 415, top 64, pop-outs 288 wide under the bar. Markup and values lifted from frames Ruled-1 to Ruled-7, P3-NB-A and P3-NB-B. The page's rectangle is set in one CSS rule that no state touches.
- **The rail** (A): the Project she is in, her pins as boxes or as a list with the tiny switch, DOCS, PROJECTS, UNFILED, THEME, CONTROLS. With no pins it takes the look of frame Ruled-3.
- **DOCS**: New (Blank, Screenplay, Research paper, More kinds, Board), Recent, page defaults.
- **PROJECTS**: six Projects with pins that work, the Notebook last with its pin off, box settings closed at the foot (letters, colour, your own colour, a picture).
- **UNFILED**: two pieces, each with File and Trash that work; the Trash at the foot.
- **A Project's own list**: from the box she is in and from every pin. Its Docs, then its Boards with no Doc, with "New doc" and "New board" at the top. Pressing a Doc opens it.
- **Marking**: a corner tag on every state; chips and notes on what is not ruled; `NOT-RULED.md` (41 lines); `CHECKLIST.md` (every bullet of section 6; B to G are marked not built).

Not built, on purpose: B to G. The stage buttons, the menu handles and the top bar's names only show a note.

## What I read

All of the brief, the six notes, the seven rail pictures and the five sheets. Of the frames' HTML I read the nine this milestone draws on (Ruled-1 to Ruled-7, P3-NB-A, P3-NB-B). **I did not read the markup of the other eighteen frames** (P2-12, P2-13, P3-23, P3-26, P3-NB-C, P3-NB-D); I looked at them on the sheets only. Each belongs to a later milestone and should be read in that chat.

## What I invented

Everything is in `NOT-RULED.md`. The ones that shape what Nick sees:

- In a taller window the page grows taller (640 at 768, 952 at 1080) and stays centred in the room.
- Opening a Doc from another Project moves her into that Project.
- A new Doc or Board lands in the Project she is in, named "Untitled doc" or "Untitled board".
- In PROJECTS, a Project's name opens its own list; its box picks it for box settings.
- The inside of the Trash, the "File" list, and all of THEME and CONTROLS.

## Where the frames and the brief differ, and what I did

- **Words.** Frame P3-NB-B says "3 cards · a drawing" for Harbor map. The brief's word is Block, so it reads "3 blocks · a drawing".
- **Word count.** Harbor Tolls is 4,120 words in Ruled-7 and 4,520 in P3-NB-B and the page-2 sheets. I used 4,520 everywhere.
- **Board in DOCS.** Ruled-7 has no Board row; the brief lists it. I added it as P3-NB-A draws it, and kept the page defaults that P3-NB-A leaves out.
- **Brass edges.** The frames outline the brass bar on all four sides; the brief says an edge on both sides. I followed the brief.
- **The Notebook** is in the brief and in no frame. Its row is my guess.
- **CONTROLS.** The brief and the frames say SETTINGS for the rail's last item. Corrected on Nov 14 (2:34 pm): in Machina it reads CONTROLS; THEME stays. Changed on the rail and in that item's pop-out. **BOX SETTINGS in the PROJECTS pop-out is left as the frames draw it**; the correction named the rail's item only (question 10).

## Questions for Fable

1. **The Notebook.** Does it count in the "6"? May she pin it? What does pressing it open?
2. **An Unfiled piece.** When she presses its name, where does it open, and what does the rail's top box show while she is in no Project? Not built; it gives a note.
3. **Box settings.** They show for the Project she is in. How does she reach another Project's box? My guess: press its box in the list.
4. **CONNECT on a Board's row** (frame P3-NB-B). Keep it? Should it read "Connect Doc", the brief's words? For now it reads CONNECT and gives a note tagged PROPOSED.
5. **1920 × 1080.** Is "the page grows taller and stays centred" the wanted reading of "it must also hold"?
6. **THEME and CONTROLS.** The brief names them and no more. Leave my guesses, or show them empty?
7. **Fonts.** They load from Google Fonts, as in the frames. With no network the page falls back to system fonts. Is that acceptable, or should the font files be put in the folder by someone who may download them?
8. **The brass dash in the WRIZO mark** is lifted from the frames. It is neither "where she is" nor "her own act". Keep it?
9. **`.cursor/rules/`** is not in git. I left it out of the commit, as told to change nothing outside `docs/mockups/reorg/`.
10. **BOX SETTINGS.** Now that the rail says CONTROLS, should the drop-down at the foot of PROJECTS read "BOX CONTROLS"? It still reads BOX SETTINGS, as in frames Ruled-4 and Ruled-5.
