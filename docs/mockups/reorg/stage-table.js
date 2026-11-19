/*
  Wrizo reorg prototype · Machina · the stage table (brief, section 6 G). NOT RULED, every cell.

  What the two menus offer in each writing stage, from the designers' first guess
  (_sources/reorg-stage-table.md, Wrizors lane, Nov 11), put into Machina's words.
  Change a cell, save this file, and reload index.html.

  How to change it
  - Everything from the "{" under the first line to the last "}" is plain JSON: double quotes,
    no comments, a comma between two items and none after the last. Take away the first line
    and the ";" at the very end, and it is the brief's stage-table.json. (A page opened by
    double-click cannot read a .json file from the disk, so the table is wrapped in one line
    of JavaScript: NOT-RULED.md, 151.) A slip here leaves the menus saying the file did not load.
  - "stages": the columns, in order. Arbor's word for each is "was". "shown": false keeps a
    column off screen (Workshopping). "split": false means no split screen in that stage.
    "page" is the table's resting surface, shown in the panel as words. "drawn" says which
    one the page draws (Fable, Nov 19; NOT RULED): "chrome-fades" (SPRINT: the chrome fades
    as she types), "whole-doc" (FINALIZE: the whole Doc in one read-only scroll), "as-today"
    (one Part). Take "drawn" away and the page shows one Part, with the words marked "not
    drawn". Every stage but "whole-doc" takes typing on the page.
  - "onAPage": the rows, one for each tab of the two menus, and "THE SESSION" at the Front
    menu's foot. A row has one cell for each stage. A cell is
      { "offers": [ ... ], "note": "the table's aside" }
    and an offer is its words in quotes, or
      { "say": "the words", "new": true, "detail": "more words", "act": "..." }
        "new": true   bold in the designers' table: new with the reorg (a blue edge on screen)
        "detail"      shown when the pointer rests on it, and in "What changed"
        "act"         "new-part": the "New part" row over the Parts list (PARTS only)
                      "search": the offer opens the search, on THIS DOC
    "What changed" compares offers by their words: two offers with the same words are one offer.
  - "onABoard" and "onABlock": the table's second and third parts, in the same form. They are
    kept here and not drawn (NOT-RULED.md, 153).
*/
window.REORG_STAGE_TABLE =
{
  "from": "reorg-stage-table.md, Wrizors lane, Nov 11, 2026. A first guess for Nick to mark up. NOT RULED, every cell.",
  "stages": [
    {
      "key": "SPRINT", "was": "Free Writing", "shown": true,
      "job": "Get words out. Don't look back.",
      "page": "One Part. The chrome fades as she types. Typewriter mode if she has it on (Q8).",
      "drawn": "chrome-fades",
      "split": false,
      "splitNote": "No split screen in SPRINT (Q25): Typewriter mode is off in a split, and SPRINT is where Typewriter mode lives."
    },
    {
      "key": "BUILD", "was": "Drafting", "shown": true,
      "job": "Build the piece.",
      "page": "One Part, on the page as today.",
      "drawn": "as-today",
      "split": true
    },
    {
      "key": "EDIT", "was": "Revising", "shown": true,
      "job": "Make it right.",
      "page": "One Part. Marks from the lenses may show on the page (the one stage where they may).",
      "split": true
    },
    {
      "key": "FINALIZE", "was": "Publishing", "shown": true,
      "job": "Send it out.",
      "page": "The whole Doc in one scroll, read-only, as it will go out (Q9).",
      "drawn": "whole-doc",
      "split": true
    },
    {
      "key": "WORKSHOPPING", "was": "Workshopping", "shown": false,
      "job": "Hear from readers.",
      "page": "The Doc as readers see it, read-only. Hidden until Read is built (Q10).",
      "split": true
    }
  ],
  "onAPage": {
    "front": {
      "TEXT": {
        "was": "Front menu · Text",
        "SPRINT": { "offers": ["Font", "Forward lock"] },
        "BUILD": {
          "offers": [
            "Font",
            "Size",
            { "say": "Format", "detail": "bold, italic, underline, strike, heading, bullets, quote, indent, spacing, alignment" }
          ]
        },
        "EDIT": {
          "offers": [
            "Font",
            "Size",
            { "say": "Format", "detail": "bold, italic, underline, strike, heading, bullets, quote, indent, spacing, alignment" },
            { "say": "Find across the Doc", "new": true, "act": "search" }
          ]
        },
        "FINALIZE": { "offers": [], "note": "Nothing to set: the words are fixed here." },
        "WORKSHOPPING": { "offers": [], "note": "Nothing." }
      },
      "INK": {
        "was": "Front menu · Ink",
        "SPRINT": { "offers": ["Tip", "Nib", "Ink colours", "Eraser"] },
        "BUILD": { "offers": ["Tip", "Nib", "Ink colours", "Eraser"], "note": "The same." },
        "EDIT": { "offers": ["Tip", "Nib", "Ink colours", "Eraser"], "note": "The same." },
        "FINALIZE": { "offers": [], "note": "Nothing." },
        "WORKSHOPPING": { "offers": [], "note": "Nothing." }
      },
      "PARTS": {
        "was": "Front menu · Sections",
        "SPRINT": {
          "offers": [
            { "say": "New part", "new": true, "act": "new-part" }
          ],
          "note": "The list, to move between Parts, and 'New part' only. No re-ordering here: that's looking back."
        },
        "BUILD": {
          "offers": [
            { "say": "New part", "new": true, "act": "new-part", "detail": "blank, or from a template" },
            { "say": "Split here", "new": true },
            { "say": "Join", "new": true },
            { "say": "Move", "new": true },
            { "say": "Name", "new": true },
            { "say": "Level", "new": true },
            { "say": "Colour", "new": true },
            { "say": "Make it its own Doc", "new": true },
            { "say": "Page setup", "detail": "margins, numbers, headers, footers. The word is PROPOSED: the Wrizors choose it after Nick's walk." },
            "Kind",
            "Style guide"
          ],
          "note": "Everything."
        },
        "EDIT": {
          "offers": [
            { "say": "Split here", "new": true },
            { "say": "Join", "new": true },
            { "say": "Move", "new": true },
            { "say": "Colour", "new": true },
            { "say": "Page setup", "detail": "margins, numbers, headers, footers. The word is PROPOSED: the Wrizors choose it after Nick's walk." },
            "Kind",
            "Style guide"
          ]
        },
        "FINALIZE": {
          "offers": [
            { "say": "Tick Parts in or out", "new": true, "detail": "what goes out" },
            { "say": "Order what goes out", "new": true },
            { "say": "Page setup", "detail": "margins, numbers, headers, footers. The word is PROPOSED: the Wrizors choose it after Nick's walk." },
            "Copy My Words",
            "Copy Formatted",
            "Download"
          ],
          "note": "What goes out, and in what form."
        },
        "WORKSHOPPING": {
          "offers": [
            { "say": "Which Parts readers see", "new": true }
          ]
        }
      },
      "THE SESSION": {
        "was": "Front menu · the session (Q7)",
        "SPRINT": { "offers": ["Typewriter mode", "The goal", "What the goal counts", "The timer", { "say": "Progress", "detail": "The word is PROPOSED: the Wrizors choose it after Nick's walk." }] },
        "BUILD": { "offers": ["The goal", "The timer", { "say": "Progress", "detail": "The word is PROPOSED: the Wrizors choose it after Nick's walk." }] },
        "EDIT": { "offers": [{ "say": "Progress", "detail": "The word is PROPOSED: the Wrizors choose it after Nick's walk." }], "note": "Progress only." },
        "FINALIZE": { "offers": [], "note": "Nothing." },
        "WORKSHOPPING": { "offers": [], "note": "Nothing." }
      }
    },
    "back": {
      "PLAN": {
        "was": "Back menu · Plan",
        "SPRINT": {
          "offers": [
            { "say": "Open to read: what comes next", "new": true }
          ],
          "note": "Nothing can be changed from here."
        },
        "BUILD": {
          "offers": [
            { "say": "Drag rows", "new": true },
            { "say": "Indent rows", "new": true },
            { "say": "Rename rows", "new": true },
            { "say": "Presets", "new": true },
            { "say": "\u2192 Part", "new": true, "detail": "a row of the Plan becomes a Part" },
            { "say": "Add to the Plan", "new": true },
            { "say": "Remove from the Plan", "new": true }
          ],
          "note": "Everything."
        },
        "EDIT": {
          "offers": [
            { "say": "Coverage", "new": true, "detail": "the Plan beside the Doc: which rows have Parts with words, which don't" }
          ],
          "note": "Coverage, never a verdict."
        },
        "FINALIZE": {
          "offers": [
            { "say": "Send the Plan too", "new": true, "detail": "if she chooses" }
          ]
        },
        "WORKSHOPPING": {
          "offers": [
            { "say": "What of the Plan readers see", "new": true }
          ]
        }
      },
      "ASSETS": {
        "was": "Back menu · Assets",
        "SPRINT": {
          "offers": [
            { "say": "Open to read", "new": true }
          ],
          "note": "No split screen (Q25)."
        },
        "BUILD": {
          "offers": [
            { "say": "The list by Board", "new": true },
            { "say": "Colours", "new": true },
            { "say": "Connect", "new": true },
            { "say": "Open the Board", "new": true }
          ],
          "note": "Everything, and the split screen ('Open beside')."
        },
        "EDIT": {
          "offers": [
            { "say": "Sources first", "new": true },
            { "say": "The bibliography, in her style guide", "new": true },
            { "say": "Where each source is cited", "new": true }
          ]
        },
        "FINALIZE": {
          "offers": [
            { "say": "What is cited and what isn't", "new": true }
          ]
        },
        "WORKSHOPPING": {
          "offers": [
            { "say": "What of her assets readers see", "new": true }
          ]
        }
      },
      "FEEDBACK": {
        "was": "Back menu · Help (the Tutor)",
        "SPRINT": {
          "offers": ["Writing Prompt", "Unblock", { "say": "Sprint Tips", "detail": "Arbor's Free Writing Tips. The word is PROPOSED: the Wrizors choose it after Nick's walk." }],
          "note": "The Consultant's three starters."
        },
        "BUILD": {
          "offers": [
            { "say": "The four asks", "detail": "the table does not name them" },
            { "say": "The lenses", "detail": "Consistency, Structure, Fragments" }
          ],
          "note": "The Consultant's four asks. The lenses."
        },
        "EDIT": {
          "offers": [
            { "say": "The lenses", "new": true, "detail": "Consistency, Structure, Fragments" },
            { "say": "The four asks", "detail": "the table does not name them" }
          ],
          "note": "The lenses first, then the asks."
        },
        "FINALIZE": {
          "offers": [
            { "say": "What stops it going out", "new": true, "detail": "the five refusals, said plainly" },
            { "say": "Send to Read", "new": true }
          ]
        },
        "WORKSHOPPING": {
          "offers": [
            { "say": "Readers' feedback", "new": true, "detail": "in the social app this tab is theirs" }
          ]
        }
      }
    }
  },
  "onABoard": {
    "shown": false,
    "note": "Q11, as drawn by the designers: two arrangements, loose for SPRINT and BUILD, in order for EDIT and FINALIZE. Not drawn here: on a Board the Board's views stand where the stages stand (brief, 6 F).",
    "SURFACE": {
      "SPRINT": { "offers": [], "note": "The Board as Blocks, loose." },
      "BUILD": { "offers": [], "note": "The Board as Blocks, loose." },
      "EDIT": { "offers": [], "note": "The Board in order: as a list, in the Plan's order." },
      "FINALIZE": { "offers": [], "note": "The Board in order, read-only." },
      "WORKSHOPPING": { "offers": [], "note": "The Board as readers see it. Hidden until Read is built." }
    },
    "FRONT MENU": {
      "SPRINT": { "offers": ["Add block", "Ink for the Block she is on", { "say": "Ink to draw straight on the Board", "new": true }] },
      "BUILD": { "offers": ["Add block", "From a deck", { "say": "Ink to draw straight on the Board", "new": true }, { "say": "Colour", "new": true }, { "say": "Show as: blocks, list, stack", "new": true }] },
      "EDIT": { "offers": [{ "say": "Show as", "new": true }, { "say": "Colour", "new": true }, { "say": "Move rows", "new": true }] },
      "FINALIZE": { "offers": [], "note": "Nothing." },
      "WORKSHOPPING": { "offers": [], "note": "Nothing." }
    },
    "PLAN": {
      "SPRINT": { "offers": ["Open to read"] },
      "BUILD": { "offers": [{ "say": "Tag for the Plan", "new": true, "detail": "the Board, or any Block on it" }, { "say": "Take the tag off", "new": true }, { "say": "Order", "new": true }] },
      "EDIT": { "offers": [{ "say": "Order", "new": true }, { "say": "Which rows have Parts with words", "new": true }] },
      "FINALIZE": { "offers": ["Open to read"] },
      "WORKSHOPPING": { "offers": [{ "say": "What she shows readers", "new": true }] }
    },
    "ASSETS": {
      "SPRINT": { "offers": ["What this Board holds, as a list"] },
      "BUILD": { "offers": ["What this Board holds, as a list", { "say": "Connect", "new": true }, { "say": "Colour", "new": true }] },
      "EDIT": { "offers": ["What this Board holds, as a list", { "say": "Connect", "new": true }, { "say": "Colour", "new": true }], "note": "The same." },
      "FINALIZE": { "offers": ["Open to read"] },
      "WORKSHOPPING": { "offers": [{ "say": "What she shows readers", "new": true }] }
    },
    "FEEDBACK": {
      "SPRINT": { "offers": ["The Consultant's starters"] },
      "BUILD": { "offers": [{ "say": "The Consultant's asks about the Board", "detail": "'Which block is the spine?'" }] },
      "EDIT": { "offers": ["The lenses"] },
      "FINALIZE": { "offers": [], "note": "Nothing." },
      "WORKSHOPPING": { "offers": ["Readers' feedback"] }
    }
  },
  "onABlock": {
    "shown": false,
    "note": "The designers' guess: a Block is small, so the stages change little; the same in every stage but the last two. Not drawn here.",
    "SURFACE": {
      "SPRINT": { "offers": [], "note": "The Block open on its sheet." },
      "BUILD": { "offers": [], "note": "The same." },
      "EDIT": { "offers": [], "note": "The same." },
      "FINALIZE": { "offers": [], "note": "The Block, read-only." },
      "WORKSHOPPING": { "offers": [], "note": "The Block as readers see it." }
    },
    "FRONT MENU": {
      "SPRINT": { "offers": ["Text: font", "Ink: tip, nib, colours, eraser"] },
      "BUILD": { "offers": ["Text: font", "Text: a short Format (bold, italic, bullets)", "Ink: tip, nib, colours, eraser", { "say": "Colour", "new": true }] },
      "EDIT": { "offers": ["Text: font", "Text: a short Format (bold, italic, bullets)", "Ink: tip, nib, colours, eraser", { "say": "Colour", "new": true }], "note": "The same as BUILD." },
      "FINALIZE": { "offers": [], "note": "Nothing." },
      "WORKSHOPPING": { "offers": [], "note": "Nothing." }
    },
    "PLAN": {
      "SPRINT": { "offers": ["Open to read"] },
      "BUILD": { "offers": [{ "say": "Tag this Block for the Plan, or take the tag off", "new": true }, { "say": "\u2192 Part", "new": true }] },
      "EDIT": { "offers": [{ "say": "Tag this Block for the Plan, or take the tag off", "new": true }, { "say": "\u2192 Part", "new": true }], "note": "The same." },
      "FINALIZE": { "offers": ["Open to read"] },
      "WORKSHOPPING": { "offers": ["What she shows readers"] }
    },
    "ASSETS": {
      "SPRINT": { "offers": ["What this Block is connected to"] },
      "BUILD": { "offers": ["What this Block is connected to", { "say": "Connect", "new": true }] },
      "EDIT": { "offers": ["What this Block is connected to", { "say": "Connect", "new": true }], "note": "The same." },
      "FINALIZE": { "offers": ["Open to read"] },
      "WORKSHOPPING": { "offers": ["What she shows readers"] }
    },
    "FEEDBACK": {
      "SPRINT": { "offers": ["The Consultant's starters"] },
      "BUILD": { "offers": ["The Consultant's asks about this Block"] },
      "EDIT": { "offers": ["The lenses"] },
      "FINALIZE": { "offers": [], "note": "Nothing." },
      "WORKSHOPPING": { "offers": ["Readers' feedback"] }
    }
  }
};
