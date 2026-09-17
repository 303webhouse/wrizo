# THE TAG CONTROLS — design pass
### PLAN desk · 2026-09-16 · its own subject, split from item 108 · CANDIDATES + RECOMMENDATIONS

**NUMBER: requested from chat 1.** The registry reads *next free 143* at `c39dfda`; this document
does **not** claim it. Until chat 1 assigns one, this is "the tag controls."

**NICK, VERBATIM, governing:**
> *"Instead of a heading that says 'Tags,' make the 'Add a Tag' button a '+' sign, and add a '-'
> that will 'Remove a Tag.' And add a third option that shows the list of existing tags in a
> scrollable list. These options should exist for every tool strip menu (Page, Card, Board)"*

**WHAT THIS IS, in Fable's words:** *the WRITING half of item 108's READING half.* The filter reads
tags; these controls make and remove them. **The vocabulary the filter offers and the vocabulary
these controls manage are ONE list, never two.**

**NOT RE-OPENED:** where the controls sit in the two-hand menu is **ruled by the existing menu
canon.** They land wherever each surface's tag UI already lives. This pass designs the controls,
not their address.

---

## §0 · WHAT EXISTS — measured at `c39dfda`

**The tag UI today** is one component, `PageFace.tsx`, wired from **four** hosts —
`PageEditor`, `JournalEntry`, `BoardEditor`, `ScriptEditor` (`onAddTag`/`onRemoveTag`). Its shape:
- each applied tag as a chip **with its own inline `×`** — removal already has a subject, one press
- a **free-text input** (`pageFaceAddTag: 'Add a tag'`) plus an **Add** button
- **no way to pick an existing tag.** A writer who has used `stark` forty times retypes it, and a
  typo mints a forty-first vocabulary word.

**The unborn page already gets no tag UI** — `onAddTag: unborn ? undefined : addTag`
(`PageEditor.tsx`). PB1's *no row until the first word* reaches tags. **The controls inherit it.**

**Cards have none of this** — `Box` carries no tags (item 108 §0).

### ⚠ THE FINDING THAT SHAPES EVERYTHING BELOW: THERE IS NO VOCABULARY TO BE "ONE" OF

Fable's law says the filter and the controls share **one list**. **No such list exists.** The only
vocabulary computation in the product is **inline**:

```
Spread.tsx:377   const allTags = [...new Set(pages.flatMap(p => p.tags ?? []))].sort();
```

— **scoped to the Spread's own pages, and living in the file VW3 deletes.**

**So "one list, never two" is not a constraint on existing code; it is a thing to BUILD, first.**

---

## TC1 · THE VOCABULARY IS A NAMED READER, AND IT IS BOTH HALVES' PREREQUISITE

**`getTagVocabulary()`** (name illustrative) — **the writer's tags, computed locally from every
live entry, and from every card once `Box.tags` lands.** Zero schema: a derivation, like
`getBoardsConnecting`, never a stored list.

**Why a named reader and not the inline `new Set(flatMap)` copied to each site** — the reasoning
this house already ratified, word for word: *"A filter written at the call site is a rule that must
be remembered every time; a named reader is a rule that must be BYPASSED on purpose."* **Two inline
computations are two lists that have not drifted yet.** The first time one learns about card tags
and the other does not, the filter offers a tag the controls cannot see — the exact "two lists"
Fable's law forbids, arriving by accident.

**"ONE LIST" MEANS ONE SOURCE, NOT ONE RENDERING — and this is the precise reading, handed up.**
The two halves need **different slices** of the same vocabulary, because they do different jobs:

| hand | job | slice |
|---|---|---|
| **reading** — item 108's filter | narrow what is shown | **tags present in THIS view** — you can only narrow by what is here |
| **writing** — these controls | apply a tag to this entry | **the whole vocabulary** — you may apply any tag you have ever used |

**Same source, same strings, same computation; each hand shows the slice its job needs.** A tag
created on one board appears in both, because both read one reader. **That is Q19's shape exactly
— one container, two displays, never copies — applied to a vocabulary.**

**Sequencing consequence:** TC1 lands **before** either item 108's filter or these controls.
**And it must land before VW3 deletes `Spread.tsx`**, or the one working computation is gone before
its successor exists — the same gap VW3's carried-forward clause already names.

---

## TC2 · "+" ADDS — and offers the vocabulary before it offers a blank

**On press:** a text field, **with the vocabulary beneath it as suggestions that narrow as you
type.** Enter applies. **The cluster pass asked for exactly this** — *"autocomplete from what the
writer already typed elsewhere, and nothing else"* — and it was never built.
**Typing a word not in the vocabulary creates it.** No confirmation, no "create new tag?" step:
*tags are names, and naming is not an administrative act* (the cluster's law).

## TC3 · "−" REMOVES — and a bare minus has no subject, so it opens one

**Recommend: "−" opens THIS ENTRY's applied tags; one press on a tag removes it.** The subject is
necessarily *this entry's* tags — you cannot remove what is not applied.

**⚠ AN HONEST COST, named rather than hidden:** today's per-chip `×` removes in **one** press.
**"−" makes it two.** Nick asked for the control and it is his to have — but **the applied tags must
stay VISIBLE on the entry without pressing anything**, because *what is tagged here* is state, and
the state speaks first (PP2). **"−" is how you remove; it is not how you find out what is there.**

## TC4 · THE THIRD CONTROL — a view of the vocabulary, and a press APPLIES

Nick: *"shows the list of existing tags in a scrollable list."*

**THE QUESTION FABLE ASKED:** *is the list itself the filter for this surface, or only a view of
what is applied?*

**RECOMMEND: NEITHER — it is the VOCABULARY, and a press on a tag APPLIES it to this entry.**

**Why it must not be the filter — this is the argument, and it comes from the canon, not taste.**
These controls live in the **TOOL strip — the acting hand.** **G8:** *left presses act on the page;
right presses speak about it.* **Q19, ratified:** *the rail travels; the Counsel reads.* **A filter
is reading.** Put it in the tool strip and a reading act lives in the acting hand — the one-grammar
split every two-hand ruling on this ledger exists to keep. **The filter stays where item 108 put
it: on the view.**

**Why it must not be a bare view either:** a scrollable list of words you can do nothing with is a
dead end in a menu whose every other row is an act. **Press-to-apply makes it the "pick an existing
tag" half of adding** — the half TC2's suggestions also serve, for the writer who would rather
browse than type.

**So all three controls are WRITING acts, in the writing hand:**

| control | act | subject |
|---|---|---|
| **+** | apply a tag — new or existing, by typing | the vocabulary, narrowed as you type |
| **−** | remove a tag | **this entry's** applied tags |
| **list** | apply a tag, by browsing | the whole vocabulary, **applied ones marked** |

*This recommendation adds one thing Nick did not say — that pressing a listed tag applies it. It is
flagged as such: he asked for a list that SHOWS; this desk recommends it also ACTS, because a menu
row that only shows is the one row in the strip that does nothing.*

## TC5 · THE LIST SHOWS BOTH — vocabulary, with this entry's tags marked

**Fable's question:** this entry's tags, the surface's vocabulary, or both?

**Recommend: BOTH, IN ONE LIST — the whole vocabulary, with the tags already on this entry marked
(and pressing a marked one removes it).** The state speaks first (PP2) and the list doubles as the
answer to *"what is on this?"* Showing only this entry's tags would make the list useless for
applying; showing only the vocabulary would hide the one thing a writer checks first.

**The mark is static and quiet** — no orange at rest (G5), no count anywhere (the no-count law
stands: this is not a destructive confirmation). **Sorted A–Z**, because a vocabulary is looked up,
not scanned by recency — and recency is a condition, which may be a lens but never the binding.

## TC6 · ON A BOARD, THE CONTROLS NAME WHOSE TAGS THEY ARE

**Fable's question:** a board's tags are the board's own, not its cards'. What do the controls read
as?

**This is the misfire that WILL happen if it is not designed:** a writer on a board, a card
selected, presses **+**, types `stark` — and tags **the board**, because that is whose strip it is.
They then filter by `stark` and the card they meant is not there.

**RECOMMEND:**
- **The board's controls always tag THE BOARD.** Selecting a card does **not** re-target them.
  **Card tags are managed in the opened card's own tools** (R13.v) — a different strip, a different
  subject. *Context-switching the board's "+" to follow selection is a control whose subject changes
  under the writer's hand, which is the ambiguity that causes the misfire rather than the cure.*
- **Every control names its object** — **CA1:** *"every control on a card must name its object."*
  The accessible name and tooltip read **"Tag this board" / "Remove a tag from this board"** on a
  board, **"…this card"** in a card, **"…this page"** on a page. **Destination-blind verbs are the
  named enemy**, and a bare "+" is maximally destination-blind — so the words the eye does not see
  must say it for the hand.

---

## TC7 · DESIGN ONCE, LAND IN THREE PLACES — and one of them is gated

**One component, mounted per surface** — the 119-mirror pattern again. It lands:
- **Page** — `PageFace` (and **Script**, which is a page kind and already wires `onAddTag`;
  Nick's "Page" covers it)
- **Board** — `PageFace` on a board, as today
- **Card** — **the opened card's tools** (R13.v; F10's default IN)

**⛔ THE CARD MOUNTING IS GATED ON CARD TAGS.** `Box.tags` (item 108 §3/T5) must land first; the
Card controls **name it as their gate** and do not ship ahead of it.

**Absent, never disabled:** on an **unborn page** the controls are **absent** (PB1, already true
today); on a **condition board** (Shelf/Trash) they are **absent** — a condition is not a writing
surface, and the canon's hands rule already removes the Desk there.

---

## §CLOSE · QUESTIONS FOR NICK

**TC-Q1 · The list ACTS.** Nick asked for a list that *shows* existing tags. **Recommend it also
applies a tag on press** — a menu row that only shows is the one row that does nothing. His word.
**TC-Q2 · "−" costs a press.** Today's per-chip `×` removes in one; "−" takes two. **Recommend
keeping the applied tags visible on the entry regardless**, so "−" is how you remove, never how you
discover. Confirm.
**TC-Q3 · The board's controls do not follow selection.** Confirm that a board's "+" always tags
the board.

**THE BUILD ORDER, if the above stand:** **TC1 (the vocabulary reader) → item 108's filter and these
controls, in either order → the Card mounting, after `Box.tags`.** **TC1 lands before VW3 deletes
`Spread.tsx`.** The brief follows his word on TC-Q1–3.

**A FOUNDER SITTING IS OWED** — *the vocabulary is the writer's real vocabulary; the right thing
got tagged* are meaning claims, and 131(a) is the standing reminder of what a green suite cannot
see.

**Nothing locks.** — the PLAN desk
