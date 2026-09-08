# PW RULINGS FOLD — Nick's nine answers, Fable's rulings, and nesting
### PLAN desk · 2026-09-07 · folds into `pw-pass-page-plan-workflow.md` + `pw-addendum-three-space-canon.md`

**STATUS: RULINGS RECORDED + NEW CANDIDATES (PW19–PW26). Nothing locks.**
Nick's words are quoted verbatim and marked; everything unquoted is this desk's.

**CANON STILL NOT ON DISK — re-checked this session.** `git fetch` run; `origin/main`
unchanged at `0bd5ef4`; no `ITEM 123`, no `three-space`, no *"Containers are where
surfaces and other containers are stored"* on any ref. Fable reports the verbatim text
landing at chat 1 in this relay. **The addendum's §0 wording marks stand until it lands;
re-anchoring is owed the moment it does, and this desk will do it on sight.** Two canon
fragments now exist in relay quotation only — *"Containers are where surfaces and other
containers are stored"* and *"it merely holds cards/pages/imported docs"* — and the second
is the one Nick then **overruled**, so it must not be folded into any brief as canon.

---

## §1 · THE NINE, DISPOSED

| | Nick's answer | disposition |
|---|---|---|
| **Q1** | threshold **RETIRED** — *"the minimum amount of setup and action taken"* | **PW19.** Counts reported, bound to nothing. |
| **Q2** | heading is **"BOARDS CONNECTED"** | **PW26.** Folded; mockups re-lettered. |
| **Q3** | *"One click to open a new scrolling side menu that displays thumbnails of all Cards and their titles."* | **A5's one-press default RATIFIED.** Thumbnails **+ titles** — the survey's excerpt yields to the title. |
| **Q4** | verbatim below | **PW20 · PW21 · PW22.** The largest fold; amends the cluster's own Q1. |
| **Q5** | **BOTH** | PW6 whole: cascade persists across travel **and** the honest return chip. |
| **Q6** | **YES** | PW7 (stickiness) in. |
| **Q7** | the address line **rides this arc** | PW8 is this desk's to carry — no route to item 96. |
| **Q8** | **NO NEW NAME** | PW12 ratified. |
| **Q9** | **OPEN**, returned as a design question | **PW23 (A) + PW24 (B)**, §4 below. |

**Fable's rulings on the addendum, recorded:** PW15's sentence **RATIFIED** · the rail read
as the container space **RATIFIED** · the A9 pointer-banner **held to be the immutability
form** · card transfer in the existing `⋯` menu, *Copy to <board>…* for free cards and **no
copy verb for page-pins**, **RATIFIED as designed** · **Q12 — COPY ONLY**, Move deferred as
an ownership transfer.

---

## §2 · Q1 — THE THRESHOLD RETIRES, AND THIS DESK CORRECTS ITSELF

Nick's law is **"the minimum amount of setup and action taken."** The "three actions"
number was Fable's, and the merged pass built a **pass/fail gate** on it —
*"§THE ARITHMETIC — the law's own test"*, and the mockups' own *"has failed the law"*
framing. **That gate was never Nick's and it is withdrawn.**

**PW19 · THE COUNT IS EVIDENCE, NOT A GATE.** Press counts stay on every screen — they are
how a reader sees whether setup is minimal — but nothing passes or fails against a number.
The merged pass's arithmetic table stands verbatim and is **re-read as a measurement, not a
test**; its *"PW-Q1 IS THE FIRST QUESTION FOR NICK"* paragraph is **spent** — the question
is answered by retiring it.

*This matters beyond bookkeeping: a threshold invites designing to the number. Nick's
phrasing asks for the minimum, which is a direction, not a line — and a direction cannot be
gamed by moving an act into a gesture.*

---

## §3 · Q4 — THE FOLD THAT CHANGES THE MOST

**Nick, whole and verbatim:**

> All cards in a scrollable list as thumbnails. When the Board thumbnail is double-clicked
> on, then switch surfaces to the Board (Plan) surface. Pages linked to the Board should be
> listed in a scrollable list of thumbnails with Page titles underneath the Board. Let's not
> show linked pages on the Board by default unless the User right clicks on the Card and
> selects 'Display on Board' or drags the thumbnail onto the Board. Pages should maintain
> their proportions and not be scalable but not proportionally editable. Cards should be
> full editable but the default shape should be horizontally rectangular (like it seems to
> be now).

### PW20 · MEMBERSHIP IS THE RELATION; A CARD IS ONE DISPLAY OF IT

**This amends the cluster's ratified Q1** (*"linking IS the existing pin"*) and it lands
exactly on the canon's three spaces:

- **membership** — page ∈ board — is a **container** relation
- **the pin-card on the canvas** — is one **display** of it
- **the rail's thumbnail row** — is another display of the same membership

**Default: member, not shown.** Two explicit acts put it on the canvas, both Nick's:
**right-click the thumbnail → "Display on Board"**, or **drag the thumbnail onto the board.**

**Storage — zero schema, and one rule that must not be got wrong.** The `page-pin` `Box`
becomes the **membership record**; an additive optional field gates the **display** —
`onCanvas?: boolean`, the exact `board-meta` pattern this codebase already uses three times
(`canvasW`, `footerOn`, `systemKind`). **Absence means DISPLAYED**, and that direction is
deliberate: every pin that exists today was created under the old rule and *positioned by a
writer*. A migration that flipped them to hidden would empty boards a writer has arranged —
not data loss in fact, but indistinguishable from it on sight, which is the same thing to
the person looking at the screen. **New memberships write `onCanvas: false` explicitly;
nothing is backfilled.** (`footerOn`'s own default-on rule, applied in the direction the
evidence requires.)

**The drag act is board-only.** Dragging a thumbnail onto a canvas needs a canvas; from a
page there is none. **The menu act works everywhere** — so the menu, not the drag, is the
act that must be complete.

### PW21 · THE SHAPE TEACHES THE KIND — and one sentence needs Nick's word

**Grounded against disk first:** `NEW_CARD_W = 0.4` / `NEW_CARD_H = 0.08` — **5:1,
horizontally rectangular.** Nick's *"(like it seems to be now)"* is **correct**; free cards
change in nothing. `BOARD_PIN_W/H = 0.28/0.12`. And **`BoardEditor.tsx:70` states the
opposite of his page ruling in its own words** — *"AB4 S4 — a page-pin card resizes freeform
on both axes (no aspect lock…)"*. **His sentence reverses AB4 S4 for page-cards.** Named, not
assumed.

**The ambiguity, stated rather than guessed:** *"Pages should maintain their proportions and
not be scalable but not proportionally editable"* carries two live readings —

- **(a) no resize at all.** Page-cards keep the page's own proportions at a fixed size.
  *"not scalable"* **and** *"not proportionally editable"* both hold literally.
- **(b) aspect-locked resize.** Resizable, but only proportionally. Requires reading
  *"but not proportionally editable"* as a slip.

**This desk recommends (a)**, and not merely because it is the literal reading: it pays for
itself. A page-card that is **page-proportioned and fixed** while a free card is
**landscape and fully editable** means **the shape alone tells you which you are holding** —
which is **S13's founder verdict** (cards vs pages blurred on real hardware) answered at a
glance. Pass 5 routed that need to item 96 as *"color-as-kind-signal"*; **shape does the same
work and spends no colour**, so the Plateau ember ceiling is untouched. **Q16 — his word
picks the reading.**

### PW22 · TWO GESTURES ENTER THE RAIL, AND EACH GETS A MENU TWIN

Nick has ruled **double-click** (board thumbnail → travel) and **right-click** (thumbnail →
Display on Board) into the rail. Both are his and both are folded. **The consequence this
desk owes him:** the merged pass argued against double-click in a list on learning-curve
grounds (A5), and that argument was about *the only way to do a thing being a gesture* — not
about gestures existing. **So: every gesture also appears as a row in the `⋯` menu Fable has
just ratified.** Double-click *or* `Open the board`; right-click *or* `Display on Board`.
Nothing is reachable only by a gesture — no new concept, no second menu, and the keyboard
and the unfamiliar hand both keep a path.

**PW4 amends:** the survey's `Open the board →` **door row retires**, superseded by the
board thumbnail's own double-click (Q4) with the menu row as its twin. **One act per row
still holds** — the row's single press opens the card list, exactly as Q3 says.

**And the survey's rows change contents:** *thumbnails **and titles*** (Q3) — the built
`excerpt` yields to the **title**, and **linked pages list beneath the cards** with their
page titles (Q4). *Read as: within a board's side menu, cards first, pages beneath. The
alternate reading — pages nested under the board row in the panel — is noted and not taken,
because it would put a third level in the panel and Q3 says the side menu is where the
listing lives.*

---

## §4 · Q9 — THE TWO CANDIDATES NICK ASKED FOR

> *"What options would a Plan tab bring up? Or maybe should it be a link to 'Drawer' that
> then shows a new surface with all of the Pages/Boards in the Drawer displayed?"*

### PW23 · CANDIDATE A — THE BOARD'S PLAN TAB HOLDS THE BOARD

Same tab, contents by where you stand (G2). On a **board**:

```
PLAN
  BOARD
    ＋ New card            Import file           From a deck…
    ＋ New board here      ← nesting (Nick's overrule)
    Show connections  [on]
  BOARDS CONNECTED         ← PW13's silent list, now awake
    Novel                  its drawer
    Westeros — the whole   holds this board
```

This is also **R13.iv's missing home**, unchanged from the merged pass: the ruling removed
the board's Tools sliver, the build deferred it because the acts had nowhere to go, and the
build report asked for *"the absence and the new home in the same commit."*

### PW24 · CANDIDATE B — THE DRAWER'S FACE IS A BOARD, NOT A NEW SURFACE

Nick's alternative is *"a new surface with all of the Pages/Boards in the Drawer
displayed."* **It meets a standing rule head-on, and he should know that before choosing:**
`CascadePanels.tsx:536` — the Drawers panel is *"a large-tile cascade panel, **never a new
route or full-screen surface (the anti-file-manager rule binds)**."*

**The synthesis, and it needs nothing new.** Under the canon a Drawer is a **container**, and
a surface displaying a container's contents is a **display** of it. This app already has
exactly one mechanism for "a container with a face you can stand on": **the system board.**
`systemKind?: 'journal' | 'trash' | 'shelf'` — three of them ship. **A drawer's face is its
own system board.** Not a file manager, not a new route, not a new surface *kind*: a board,
with every board behaviour, including the canon's own membership-vs-display rules and — now
that boards nest — the ability to hold the drawer's boards as board-cards.

**Recommendation: B, built as a system board, with A alongside.** They do not compete —
A is what the Plan tab holds when you are *on* a board; B is what the drawer's own door
opens. **Q17 — his pick.**

---

## §5 · NESTING (Nick's overrule) — AND THE ONE THING NOBODY HAS GUARDED

**Folded as ruled:** boards nest · a nested board shows on its parent as a **board-card**
(thumbnail, double-click travels in — Q4's rule, unchanged) · **PW13's list wakes**: the
containers holding a board = **its drawer AND any parent boards** · membership (item 125)
generalizes — a board is a member of a board exactly as a page is, displayed on the canvas
only by PW20's two explicit acts · **copying a board-card is membership, not content — no
copy verb**, same as page-pins.

### PW25 · NESTING IS LARGELY FREE TODAY — AND THAT IS ALSO THE HAZARD

**Verified in source, not inferred.** `pinPageToBoard` (`persistence.ts:1013`) guards three
things and only three: self-pin (`entryId === boardEntryId`), a **system-board** source, and
that the **target** is a board. **It never checks the source's `pageType`.** So a normal
board can be pinned onto another board **on today's build**, the `page-pin` Box carries it,
and `travelToPin → routeForEntry` already resolves a board entry to the board route.
**Nesting is mostly already there.**

**⚠ AND NOTHING GUARDS A CYCLE.** Pin board A onto B, then B onto A: *"the containers
holding this board"* recurses without a base case, and "travel in" has no bottom. The
self-pin guard is a one-hop check and does not see it. **The fix is cheap — refuse a pin
whose source is an ancestor of the target, walking parents — but it must be built with
nesting, not after it.** Flagged now because a cycle is the kind of defect that is trivial
to prevent and expensive to find: it will present as a hang or a blown stack, far from the
pin that caused it.

**Second flag, smaller:** a board-card's face must read **Board**, not *"From a page"*. The
badge is the noun and CA1 binds — *"covering the badge still tells you what you're holding."*

---

## §6 · CANDIDATES ADDED THIS FOLD

**PW19** the count is evidence, not a gate · **PW20** membership is the relation, a card is
one display of it (default: member, not shown; `onCanvas?` additive, absence = displayed) ·
**PW21** the shape teaches the kind (recommend reading (a); reverses AB4 S4 for page-cards) ·
**PW22** every gesture gets a menu twin; `Open the board →` retires · **PW23** the board's
Plan tab (Q9-A) · **PW24** the drawer's face is a system board (Q9-B, recommended) ·
**PW25** nesting is largely free — **and the cycle guard is owed** · **PW26** the heading is
**BOARDS CONNECTED**, on page and board alike (G2: one form, two contents).

---

## §7 · FOR NICK — IN PLAIN WORDS

**Q10 · Where does the canon live?** Item 123's verbatim text still is not on any branch
either repo. Fable says it is landing now. Until it does, two lines of it exist only as
relay quotation — and one of those you have already overruled, so nothing should be built
from them.

**Q13 · Where does card copying live?** It works today in the `⋯` menu beside each card in
the side list — Fable has ratified that. It could *also* sit in the opened card's own tool
menu, where you'd be if you were reading the card. Want both, or just the list?

**Q14 · What order does the side list show cards in?** Right now the code shows them in the
order they were created, which nobody chose. The alternative is the order they sit on the
board — top to bottom, left to right — so the list agrees with the wall. Recommend the
board's own order.

**Q15 · Do the words "surface", "container" and "display" ever reach the writer?** This desk
has used them only to think with. If they should appear in the app, that is a much bigger
decision and it is yours.

**Q16 · The page-card sentence.** *"Pages should maintain their proportions and not be
scalable but not proportionally editable"* — does that mean a page-card **cannot be resized
at all** (recommended: its fixed page shape is then what tells you it's a page and not a
card, answering your old complaint that the two blur), or that it **can be resized but only
proportionally**?

**Q17 · The Drawer.** Should the Drawer's door open **its own board** — the same kind of
thing the Journal and the Trash and the Shelf already are — showing its pages and boards?
That gives you the surface you described without building a file browser, which an earlier
ruling deliberately refused.

**Q18 · Cycles.** If boards can hold boards, may a writer put a board inside a board that is
already inside it? Recommend **no**, refused quietly at the moment of the act.

---

**Nothing locks. Nick's word alone.** — the PLAN desk, 2026-09-07
