# THE PASS ON `wrizo-page-first.html` — Fable's drawing
### PLAN desk · 2026-09-22 · **a pass ON the drawing, not beside it**, as ruled

**THE FILE:** `C:\Users\nickh\Downloads\wrizo-page-first.html` · **47,395 bytes · 23:45** · **it landed,
and this pass is read from it**, line by line. *The earlier brief's "the file is NOT at that path" is
spent.*

> **THE VERDICT IN ONE LINE: THE DRAWING IS RIGHT ABOUT THE THING THAT WAS HARDEST TO GET RIGHT** — a
> link is **CSS on a wrapping span**, not a character in the text — **and it has FIVE things to change,
> one of which would put characters into the manuscript.**

**What this pass is not:** a redraw. **Four of the five changes are to about twelve lines of it**, and the
fifth is a change of mechanism that only matters in the app, not in a mock.

---

## §1 · WHAT IT GETS RIGHT, AND WHAT SHOULD NOT BE REDRAWN

1. **THE LINK MARK IS A WRAPPING SPAN (line 350–351).** `sp.className='lnk'; sp.appendChild(
   r.extractContents()); r.insertNode(sp)` — **the words are moved INTO the span, and the span carries no
   text of its own.** **That is the lawful shape**, and it is the shape TRR14 asks for: *marks are CSS on
   a wrapping span; words live in the panel.*
2. **ONE PARAGRAPH AT A TIME (line 345), and it SAYS SO** rather than silently splitting. *Matches the
   brief's rule 1 — and the brief's "split into one span per paragraph, stated not silent" is the app's
   version of the same honesty.*
3. **MANY SPANS PER TARGET** — `spansOf(id)` (line 244) queries **all** spans for one link. *The data
   model is already plural in the right direction: one card, several places in the page that point at it.*
4. **FIVE COLUMNS, WHICH ARE THE FIVE ZONES** (line 34): `76px 262px minmax(0,1fr) 296px 70px` — **left
   rail · left panel · THE PAGE · right panel · right rail.** *The page is the only elastic column, which
   is what "the text is primary" means in a grid.*
5. **⭐ ONE PANEL COLUMN PER SIDE, ALREADY OBEYED.** **The Tutor does not get its own strip — it SHARES the
   right panel** (`S.right==='tutor'`, line 288, reached by the `#rgrip` button). **This desk's width rule
   arrived at the same place independently**, which is the best evidence either of us has that it is
   right. *Two panels never stand side by side on one side, so the page's measure is never squeezed twice.*
6. **THE BY-TAG VIEW GROUPS RATHER THAN SORTS** (lines 330–332) — a `.grp` header per value. **The
   grouping law's shape is already here** (§2, finding D refines it).
7. **REMOVE UNLINKS AND SAYS SO** (line 383): *"Unlinked. 'X' still exists. Only the link is gone."*
   **Keep that sentence verbatim** — it is the deletion charter's voice in one line.
8. **`Ctrl/Cmd+Enter` AND `Ctrl/Cmd+K`** (lines 459–461) — **now the ruled keys.** *And the footnote at
   line 201 explains Ctrl+N honestly instead of pretending. **Keep it.***

---

## §2 · THE FIVE CHANGES

### ⛔ A · THE NOTE GLYPH PUTS A CHARACTER IN THE MANUSCRIPT — the one that must change
**Line 373:**
```js
const m = document.createElement('span'); m.className='nmark'; m.contentEditable='false';
m.textContent='\u270e'; r.insertNode(m);
```
**This is the note-with-no-words path** (a caret, not a selection). **`m.textContent='✎'` is a marker
element CARRYING TEXT, inserted into the page's own text.** **Under TRR14 that character is saved into the
manuscript** — *it would survive export, it would appear in a word count, and it would be there when the
writer opened the file in something that is not Wrizo.*
**`contentEditable='false'` does not save it** — *it stops the caret entering, not the serializer reading.*

> **THE FIX, AND IT IS ALSO THE ANSWER TO THE PROBLEM THE GLYPH WAS SOLVING:**
> **A NOTE WITH NO WORDS ANCHORS TO THE PARAGRAPH AND IS MARKED IN THE GUTTER.** *Nothing is inserted;
> the paragraph carries a tick in the margin; the note hangs off the paragraph.*
> **Words get a tint. A spot gets a gutter mark. Nothing gets a glyph.**

*Consequence, and it is an improvement: `unlink` (line 381) currently branches — `el.remove()` for a note,
`el.replaceWith(...el.childNodes)` for a link. **With no glyph there is nothing to remove**, so removing a
spot-note deletes a record and touches the text not at all.*

### ⛔ B · THE LINK MARK IS AN UNDERLINE — standing finding F2
**Line 99:** `.lnk{ text-decoration:underline; text-decoration-style:dotted; …
text-decoration-color:var(--olive-ink); }`
> **UNDERLINE BELONGS TO THE WRITER** — standing finding F2 (`tag-colour-foundation.md` §4b), and item
> 122's `__word__` is how a writer types one. **A dotted olive underline is still an underline**: the
> writer cannot tell their own emphasis from the app's mark at a glance, which is exactly the confusion F2
> exists to prevent.
**THE FIX (Fable's own lean, adopted): A FAINT TINT ON THE WORDS.** *The hover ground the drawing already
has (line 100, `rgba(150,160,90,.13)`) is the right idea — it should be the RESTING state, not the hover
state, with hover and focus as deeper steps of the same one colour.*
**The kind stays distinguishable without a second channel:** *the drawing separates Note from Link by
decoration colour (line 102, `#b0701b`); as tints, those are two tint values, not two mechanisms.*

### ⛔ C · WRAPPING IS RIGHT FOR A MOCK AND WRONG FOR THE APP — and it costs a capability
**The drawing wraps and calls `text.normalize()` (line 351).** *In a static mock, correct.*
**In the app the page is a live `contenteditable`, and `store/draftDecoration.ts` refuses this exact move,
in its own comment — RULE 1 of the four things it refuses to do:**
> *"A NON-COLLAPSED SELECTION IS LEFT ALONE. Redecorating rewrites `el.innerHTML` and then restores a
> COLLAPSED caret — so running it while the writer has text selected destroys the selection."*

**AND THE CONNECT GESTURE BEGINS WITH A NON-COLLAPSED SELECTION** — *the worst possible moment to rewrite
the DOM is the only moment this feature has.*
**THE FIX:** **the register COMPUTES the ranges; `CSS.highlights` + `::highlight()` PAINTS the tint.**
*Painting touches no DOM, so it cannot disturb a selection, a caret offset, or the marker reveal.*

> **⭐ AND IT BUYS SOMETHING THE DRAWING HAD TO REFUSE: OVERLAPPING ANCHORS.**
> **Line 346 rejects a selection that contains an existing link** — *"Those words are already linked."*
> **That refusal is an artifact of wrapping, not a law:** spans cannot overlap, so a writer cannot link a
> phrase and then link the sentence containing it. **Painted ranges CAN overlap, for free.**
> **So overlap becomes a DESIGN choice instead of a platform verdict** — *and for a book with a
> bibliography, quoting a phrase inside an already-sourced sentence is ordinary, not exotic.*
> **This desk's lean: ALLOW OVERLAP, and let the rail disambiguate** (the click lists what covers this
> spot). **Named as a question rather than taken** — EXP1-Q5.

**⚠ THE DEPENDENCY, STATED HONESTLY:** *`CSS.highlights` / `::highlight()` appear NOWHERE in the tree.
Item 145's brief chose this mechanism but its ratification is CONDITIONAL on a measurement (Electron 31's
Chromium, the web build's undeclared target, the Edge harness).* **Experiment 1 either rides 145's
measurement or takes it — it is the same measurement, done once.** **Where the API is absent: NO PAINT**
(145's recommendation (i)) — *the anchors, links and rail all still work; the words simply carry no tint.*

### ⚠ D · THE BY-TAG GROUPING IS SINGLE-VALUED AND PRINTS NO ARITHMETIC
**Line 331:** `const key = id => … (LIB[id].tag ? '#'+LIB[id].tag : 'No tag')` — **one tag per item**, so
each item lands in exactly one group.
> **THE GROUPING LAW, ratified at 177 and applied at All Boards and here for the third time: A
> MULTI-VALUED KEY GROUPS RATHER THAN SORTS — an item appears under EVERY value it carries, and the
> section PRINTS ITS OWN ARITHMETIC.**
**Two changes:** **(1)** a source with three tags appears in three groups, *which is why the count is
needed* — **(2)** each group header carries its count, and the list says *"11 things · 14 appearances"*
when they differ. *Without the arithmetic a reader counts rows and concludes the app is double-listing.*
**`No tag` sorting last is already right** (line 332) and should stay.

### ⚠ E · A BRASS MARK IS RESERVED — and `.lnk.flag` is unused
**Line 104:** `.lnk.flag{ background:rgba(255,152,0,.22); }` — **defined, never applied** (no code sets
`flag`). *If it is the seed of the lost/ambiguous mark, it has the wrong colour:* **brass is what you do —
selection and tags** — *so a brass ground on a link says "selected" to a reader who has learned the app.*
**A lost or ambiguous anchor needs its own channel**, and the brief gives it one: **the words keep their
tint, and the RAIL carries the state** (*"these words appear 3 times now — point me at the right one"*).
**Either wire it with a non-brass treatment or delete the rule** — *dead CSS in a reference drawing gets
built by someone eventually.*

---

## §3 · THE WIDTH ARITHMETIC OF THE DRAWING'S OWN GRID
**Chrome at the drawn sizes: `76 + 262 + 296 + 70 = 704px`.** *Page column = the remainder.*

| viewport | page gets | prose paper (≈615 @ scale 1) | screenplay (816, fixed) |
|---|---|---|---|
| **1920** | **1216** | ✅ comfortable | ✅ |
| **1366** | **662** | ✅ (47px spare) | ❌ **short by 154** |
| **1280** | **576** | ❌ **short by 39** | ❌ |
| **1280, both panels at the 220 floor** | **694** | ✅ | ❌ |

**SO THE DRAWN WIDTHS ARE A 1366+ LAYOUT, and the budget's two rules are what carry it below that:**
**(1) a panel may shrink to its 220 floor**; **(2) when one column will not fit, the side asked for opens
and the other COLLAPSES TO ITS ICON, visibly and reversibly.** **On a screenplay at 1366, one column only
— that sheet is 816 and does not scale.**
*Not a fault in the drawing — it draws one viewport, which is what a drawing does. Recorded so the builder
does not read 262/296 as fixed.* **S0 measures these; ±30px, as item 166's own table is.**

---

## §4 · WHAT I WOULD CHANGE NOTHING ABOUT
- **The right rail's cap — "This page"** (line 252). *One phrase that settles which of the two rails a
  reader is looking at. The left rail answers "what do I have?"; this one answers "what does THIS page
  have?".*
- **The empty states** (line 327): *"No notes yet. Press Ctrl+Enter anywhere in the page, or right-click
  and choose Note this."* **An empty state that teaches the gesture.**
- **The kind order `['Source','Card','Page','Note']`** (line 332) — *a stable declared order, not
  alphabetical. Alphabetical would reshuffle when a kind is renamed.*
- **The focus view** (lines 316–321): selecting one link shows *that* link plus **"Show everything linked
  to this page"**. *That is the drill-in rule, applied inside a list.*

---

## §5 · WHAT THIS PASS PUTS TO NICK
- **EXP1-Q5 · OVERLAPPING ANCHORS.** *Painting makes them possible; wrapping made them impossible.* **May a
  writer link a phrase inside an already-linked sentence?** **Desk's lean: yes**, with the rail listing
  what covers a spot when they overlap.
- **EXP1-Q6 · THE SPOT-NOTE'S GUTTER MARK.** *Confirmed as the replacement for the `✎`* — **a tick in the
  margin beside the paragraph, and nothing in the text.** *Raised because it is the one place the desk is
  adding a mark he did not ask for, and it exists only because the glyph cannot stay.*

**Docs only. Not merged by this desk.**
