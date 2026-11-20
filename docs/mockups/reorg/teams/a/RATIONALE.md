# Team A, "The quiet desk": why it looks like this

**The bet.** An overwhelmed writer needs fewer things on screen at once. Show the page and the one menu she is using. Bring everything else back the instant she asks.

Open `index.html` by double-click. Doors: `#build`, `#sprint`, `#split`, `#dark`. Same content as the prototype: Harbor Tolls, its five Parts, its eleven assets, the same words on the page. Nothing was removed, renamed or added.

## The nine fixes

- **D1 · One menu open at a time.** First sight is the rail, the Parts list and the page. The Back menu is folded to a handle against the page that says which tab it holds ("ASSETS"). Opening it folds the Front menu to a handle that says "PARTS". The Docs drawer closes when a Doc opens. To have both open, press the pin in a menu's head or Alt+\ ("Keep both open"); `#build-both` shows it. The page never moves: it measured left 415, top 64, 620 × 640 in all thirteen doors outside the split, and in the split it keeps its 620 × 640 at left 100.
- **D2 · Three levels of type, used the same way everywhere.** Level 1 is the strongest ink at weight 600: the Part she is in, the stage she is in. Level 2 is names: Parts, assets, the Doc. Level 3 is facts, lighter and greyer: word counts, kinds, dates. Names and labels are in Plex Sans. Plex Mono is left for numbers. Capitals stay only on the ruled words: the tabs, the stages and the rail.
- **D3 · Review notes are small flags, not UI.** Each is a little dashed mark in a margin (NR, P or D), in the quiet grey, with no fill. Its words show when she points at it, tabs to it or presses it. F2 switches the whole layer off and on, and a switch at the bottom right says how many notes the screen carries. The "… IN BUILD" bands, the "Everything." captions and the corner legend are gone from the surface: their words live inside the flags. The stage strip keeps its own NOT RULED tag, always in view.
- **D4 · Buttons are grouped by what they act on, three at most, then "More".** The ten equal buttons of the Parts band became: "New part" and "More" for the whole Doc; "Split here", "Join", "Move" and "More" for the Part she is in. I picked those three because they are the only Part acts offered in both BUILD and EDIT, so they keep one spot in both stages, and because they reshape the Doc, which is what BUILD is for. ASSETS shows "Connect" and "More". Each asset row has one visible act, "Open beside": it is the one that keeps her page on screen. "Open" is on the row's own menu and on Shift+Enter.
- **D5 · The Part's colour runs through everything that belongs to it.** Methods is yellow in five places at once: its row in the Parts list, the rows of its assets, its place in the top bar, the margin of the page beside "3. Methods", and the readout under the page. In the split, the head of the asset's side wears it too. Her eye can follow this Part → its assets → its page.
- **D6 · One fact, one shape.** The count of connected assets is always the link mark and a number: on a Part's row, on the Doc's line, on a group in ASSETS, on "Other Parts". An asset's kind is always a small mark and its word (PDF, BOARD, BLOCK) at Level 3. Names are never the same weight as facts.
- **D7 · The top bar has two zones.** Left, where I am, wide to narrow: Thesis › Harbor Tolls, 1890 to 1912 › Part 3 of 5 · Methods, each a level stronger, the Part wearing its tag. Right, the stages: the one she is in is a lit cell with larger, bolder letters and the brass line. What changed, the command line and search are three quiet icons after the stages; their words and keys show on hover and on keyboard focus.
- **D8 · The readout says "page 2 of 3".** It reads: 412 words · page 2 of 3 · ~2 min read · Part 3 of 5 · 4,520 words in the doc. The page-break marks spec was not in my reading folder, so this is the brief's own example drawn as given. The line for the other four Parts is a guess and is flagged.
- **D9 · Wide to narrow, top to bottom.** Every tab starts with the Doc: its name, its facts, the tools that act on all of it. Then the Parts. Then, inside the Part she is in, that Part's tools, then that Part's assets. ASSETS reads Doc → this Part → Other Parts. Whole-Doc tools are always above this-Part tools.

## SPRINT: what fades, what stays

**At rest,** everything keeps its place. What SPRINT does not offer goes faint where it stands: Split here, Join, Move, both "More", and every "Open beside". A blue line says why: "No split screen in SPRINT." The session gains one button, "What the goal counts".

**As she types,** everything but the page drops to a tenth, at a cut (Machina has no motion). The stage strip's NOT RULED tag and the notes switch stay. Moving the mouse brings it all back. `#sprint-typing` shows it.

**The page's rectangle is identical in BUILD and SPRINT:** left 415, top 64, 620 × 640.

## What I hid, and where it went

| Hidden | Where it is now | How to reach it |
|---|---|---|
| The Back menu: PLAN · ASSETS · FEEDBACK, and its search | Folded to the handle "ASSETS ›" at the page's right edge | One click, or Alt+] |
| The Front menu, when the Back menu is open | Folded to the handle "‹ PARTS" at the page's left edge | One click, or Alt+[ |
| Both menus at once | The pin in either menu's head | One click, or Alt+\ |
| Name, Level, Colour, Make it its own Doc | "More", in the row of the Part she is in | One click |
| Page setup, Kind, Style guide | "More", beside "New part" | One click |
| The list by Board, Colours, Open the Board | "More", beside "Connect" in ASSETS | One click |
| "Open" on a Board's row | The row's own menu (three dots) | One click, or Shift+Enter on the row's button |
| The assets of the other Parts, in ASSETS | "Other Parts", folded under this Part's assets | One click |
| The assets of any Part, in the Parts list | That Part's toggle: up to four, oldest first, with "Newest first" to flip | One click, as before |
| What changed, the command line, search | Three icons at the right of the top bar | One click; Ctrl+. and Ctrl+F as before |
| The Docs drawer, Projects, Unfiled, Theme, Controls | On the rail, as before | One click |
| Page defaults | At the foot of the Docs drawer, as before | One click on DOCS, as before |
| The dark room | The "Dark" switch in the Theme drawer | Two clicks |
| NOT RULED tags, the stage bands' heads, "Everything.", the corner legend | The review notes layer | Point at a flag; F2 switches the layer |

## The trade-offs

- **State 1 does not show both tabs at first sight.** The brief's state 1 has Parts and Assets both open; this team's bet is one menu. `#build` shows Parts with ASSETS folded, and `#build-both` shows the like-for-like. The cost: assets of other Parts are two clicks away in ASSETS. This Part's three assets, with "Open beside", are already in view in the Parts list.
- **"More" hides ten acts.** A newcomer has to learn that "More" exists. It is a word, not an icon, and it is always in the same spot.
- **The three bar tools are icons.** That bends "labels in words". The brief asked Team A for it; the words and keys show on hover and on focus, and screen readers get them.
- **Faded acts read under the 4.5:1 floor** (about 2.2:1). They cannot be pressed, and a blue line says why. If the Wrizors want them readable, they could be taken away in SPRINT instead, at the cost of things moving between stages.
- **The tints are pale on purpose,** so every word on them keeps its contrast. A tint alone would not tell two Parts apart: the lettered tag does that.
- **The flags' letters (NR, P, D) have to be learned.** The notes switch explains them on hover.
- **Keeping both menus open lasts until the app closes.** If it should last longer, that is one new saved setting: [DATA], for Nick.
- **In SPRINT the session's fourth button wraps to a second line** at 1366 × 768, so the Parts list scrolls a little there.
- **Not redrawn:** the search and its results, a Board on its own, FINALIZE's whole-Doc page, and the drawers past their first screen. They work as in the prototype and say so when pressed.
