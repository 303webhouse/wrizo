# ITEM 171 — TYPEWRITER SCOPE · S0

### ink lane · 2026-09-19 · worktree `.claude/worktrees/item171-typewriter-scope` · branch `item171-typewriter-scope` off `origin/main` **pinned at `b807f59`**
### read from disk, browserless, no box taken. Nothing is patched until this is committed.

---

## §0 · THE RULING, AND WHAT IT DISSOLVES

Nick, verbatim (relayed by Fable, 2026-09-19):

> "Typewriter mode should only be available on "Text" pages with no ink. Once
> Ink is selected, Typewriter mode should be deactivated, and once any ink has
> been added to a Page, typewriter mode cannot be reactivated. Also, typewriter
> mode should not be available in either Draft or Revise mode. Ink needs to
> available, though, on  Boards and Cards."

Two halves, and the second is a BUILD, not a restriction: **the typewriter
narrows to Free Write's text-only pages**, and **ink widens to Boards and
Cards**.

**It dissolves item 157's open question rather than answering it.** 157 asked
what should happen to ink drawn in the blank band the typewriter puts above the
first line. Under this ruling no such band can coexist with ink at all —
selecting Ink turns the typewriter off before the first stroke, and a page that
has ink can never turn it back on. 157 ships as built; see
[item157-s0-survey.md §10](docs/menus/item157-s0-survey.md).

## §1 · WHERE THE TYPEWRITER IS ON TODAY, AND HOW IT IS STORED

**ONE GLOBAL VALUE, NOT A PER-PAGE ONE.** `typewriter: boolean` lives on the
client settings object in
[writingSettings.ts:39](apps/desktop/src/store/writingSettings.ts#L39),
**defaults `true`** ([:94](apps/desktop/src/store/writingSettings.ts#L94)), and
is persisted whole under `localStorage['wrizo-writing-settings']`
([:79](apps/desktop/src/store/writingSettings.ts#L79),
[:113-133](apps/desktop/src/store/writingSettings.ts#L113-L133)). **No page, no
board and no entry stores a typewriter value of its own.** That single fact
shapes the whole build: the rule Nick states is PER PAGE ("a Page with ink"),
so it must be DERIVED per page while the stored global stays untouched.

**The house already has the law for that.** SC1 S3 and M1's `Progress: Project`
both degrade an unavailable setting without rewriting it — "the STORED value is
untouched either way … it simply resumes the instant the writer is back on a
framed session" ([ModeStage.tsx:630-640](apps/desktop/src/components/ModeStage.tsx#L630-L640)).
A writer whose global preference is ON keeps it; a page with ink simply does not
run it.

**Explicit vs seeded.** `setTypewriterExplicit`
([:169-173](apps/desktop/src/store/writingSettings.ts#L169-L173)) writes the
value AND arms a session flag that makes every later auto-seed a no-op;
`seedTypewriterDefault` ([:193-196](apps/desktop/src/store/writingSettings.ts#L193-L196))
is the Draft-open default (FX2 S2), threshold
`DRAFT_TYPEWRITER_LINE_THRESHOLD = 10`
([:177](apps/desktop/src/store/writingSettings.ts#L177)). **Its only caller is
[PageEditor.tsx:396](apps/desktop/src/pages/PageEditor.tsx#L396)** —
ScriptEditor mentions it in a comment and no longer calls it
([ScriptEditor.tsx:528](apps/desktop/src/components/ScriptEditor.tsx#L528)).

**THE ENGINE RUNS ON EXACTLY TWO SURFACES** (`useTypewriterFade` call sites,
counted over the whole tree, not sampled):

| surface | gate | line |
|---|---|---|
| the typed PAGE (ModeStage) | `(mode === 'journal' \|\| mode === 'drafting') && settings.typewriter` | [ModeStage.tsx:154](apps/desktop/src/components/ModeStage.tsx#L154), hook at [:261](apps/desktop/src/components/ModeStage.tsx#L261) |
| the JOURNAL entry | `authored && writingSettings.typewriter` | [JournalEntry.tsx:251](apps/desktop/src/pages/JournalEntry.tsx#L251), hook at [:263](apps/desktop/src/pages/JournalEntry.tsx#L263) |

So **Revise never ran the typewriter** — "not available in Revise" is about the
CONTROL, not the engine. **The script surface no longer runs it either**
([ScriptEditor.tsx:497](apps/desktop/src/components/ScriptEditor.tsx#L497)),
though its control still mounts (§5.7).

**What "on" does to the page**, and why 157 met it: `.mode-scroll` takes
`padding-top: var(--tw-start-offset)` — **25% of the stage height**
([useTypewriterFade.ts:40](apps/desktop/src/components/useTypewriterFade.ts#L40),
set at [:169](apps/desktop/src/components/useTypewriterFade.ts#L169)) — plus
the fade mask and the caret-advance scroll. That pad is the band 157 measured.

**THE CONTROL SURFACES — FIVE, AND THEY MUST MOVE TOGETHER.**

| # | control | line |
|---|---|---|
| 1 | ModeStage's `TypewriterToggle` (unframed page) | [ModeStage.tsx:556](apps/desktop/src/components/ModeStage.tsx#L556) |
| 2 | ModeStage's `SettingsPanel` Typewriter Seg | [ModeStage.tsx:677](apps/desktop/src/components/ModeStage.tsx#L677) |
| 3 | the Sliver foot's icon toggle | [Sliver.tsx:1022-1025](apps/desktop/src/components/Sliver.tsx#L1022-L1025) |
| 4 | the Sliver foot's Typewriter Seg | [Sliver.tsx:1076](apps/desktop/src/components/Sliver.tsx#L1076) |
| 5 | the Sliver's ProgressMenu → SettingsPanel | [Sliver.tsx:1056](apps/desktop/src/components/Sliver.tsx#L1056), [:1148-1151](apps/desktop/src/components/Sliver.tsx#L1148-L1151) |

`typewriterAvailable` already threads through 2–5 and **defaults `true`**
([ModeStage.tsx:642](apps/desktop/src/components/ModeStage.tsx#L642),
[Sliver.tsx:959](apps/desktop/src/components/Sliver.tsx#L959)). **Nothing in the
tree passes it `false` today** — SC1 S3's screenplay gate was superseded by item
83 M8/R12 ([Sliver.tsx:310-335](apps/desktop/src/components/Sliver.tsx#L310-L335)).
So the seam 171 needs EXISTS and is currently unused.

**SC1 S3 also wrote the doctrine this ticket runs on**, and it is quoted rather
than paraphrased: *"a live switch that does nothing is a lying affordance: worse
than a missing one, because the writer flips it, sees no change, and learns the
app lies. This gate reaches BOTH of the option's surfaces … so neither can be
the one that gets forgotten."* **Absent, never greyed** (G3), exactly as item
121 passes `inkOptions: undefined` in TEXT
([PageEditor.tsx:911-918](apps/desktop/src/pages/PageEditor.tsx#L911-L918)).

## §2 · WHAT "SELECTING INK" IS, AND WHERE "THIS PAGE HAS INK" IS KNOWABLE

**Selecting Ink is one state change with one owner.** `instrument` is
`'text' | 'ink'`, session-scoped and deliberately NOT persisted
([PageEditor.tsx:184](apps/desktop/src/pages/PageEditor.tsx#L184) and the
comment above it). The event is the `InkSwitch` radiogroup's `onChange`
([PageEditor.tsx:1117](apps/desktop/src/pages/PageEditor.tsx#L1117),
[InkSwitch.tsx:44](apps/desktop/src/components/InkSwitch.tsx#L44)), mounted only
in Free Write (`mode === 'journal'`).

**There is already an effect that fires on entering INK** — it blurs the
editable so the caret is dormant
([PageEditor.tsx:245-250](apps/desktop/src/pages/PageEditor.tsx#L245-L250)).
"Entering INK" is therefore an established moment with an owner; 171 adds no new
event, it reads the same state.

**"This page has ink" is already in PageEditor's hand.** `strokes` is state,
seeded from the row at mount
([PageEditor.tsx:188](apps/desktop/src/pages/PageEditor.tsx#L188):
`getJournalEntry(id)?.strokes ?? []`) and persisted by `persistStrokes`
([:227-237](apps/desktop/src/pages/PageEditor.tsx#L227-L237)). **So the
predicate is `strokes.length > 0`: no new store, no new field, no schema.** An
unborn page births with its ink (`birthWith({ text, strokes })`,
[:231](apps/desktop/src/pages/PageEditor.tsx#L231)), and the predicate reads the
same state either way.

**No "does this entity have ink" helper exists anywhere in the tree** — see §3.
171 introduces the first one; it belongs beside the ink model
(`store/ink.ts`), not in a component, because §3 shows more than one surface
will need it.

## §3 · WHERE INK IS AVAILABLE TODAY — AND THE RULING'S SECOND HALF

**Every claim here was read in source. The load-bearing ones — that a Board
cannot author ink, that a Card has none at all, and that the Journal surface is
unreachable — were each verified directly rather than taken on report.**

| surface | can a pointer DRAW? | rendered? | stored | gate |
|---|---|---|---|---|
| Page · Free Write · INK | **YES** — pen, mouse/trackpad, and touch until a pen is seen | yes | `entry.strokes` | framed (≥1100px) + `mode==='journal'` + `instrument==='ink'` |
| Page · Free Write · TEXT | no (`inert`) | yes | — | framed |
| Page · Draft / Revise | no — a MOVE only (`movable`, item 126) | yes | — | framed |
| Page · below 1100px | no — the stratum does not mount at all | **no** | — | `framed === false` |
| **Board · ink box** | **NO** | yes (`board-ink-canvas`) | `box.strokes` in the board's `entry.boxes` | the box exists ONLY via a port |
| **Board · card popup** | **NO** | **no** | — | opens for `kind==='text'` only |
| Journal entry surface | pen-only, in code | yes | `entry.strokes` | **UNREACHABLE — the route is retired** |
| Script editor · Spread · Cascade · export | no | thumbnail / "A sketch" label / placeholder text only | — | — |

**THE BOARD RENDERS INK IT CANNOT AUTHOR.** `BoardInkBox`
([BoardEditor.tsx:146-165](apps/desktop/src/components/BoardEditor.tsx#L146-L165))
is a canvas with **no pointer handler of any kind** — I checked the whole
component body for `onPointer*`, `onMouse*`, `onClick` and `addEventListener`
and there are none. The source says so in its own words at
[:706-708](apps/desktop/src/components/BoardEditor.tsx#L706-L708): *"A Board has
no live pen-stroke authoring (J4: ink boxes only ever arrive via a port, never
drawn here)"*. **There is exactly ONE place in the tree that creates an ink
box** — [persistence.ts:1140](apps/desktop/src/store/persistence.ts#L1140),
inside `buildPortedBoxes`, which COPIES a page's strokes and re-normalizes them
to the box's own width. A board's ink is always a copy of a page's.

**A CARD HAS NO INK AT ALL.** `BoardCardPopup`
([BoardEditor.tsx:344](apps/desktop/src/components/BoardEditor.tsx#L344)) takes
`initialText, onCommit, onClose` — text only, no canvas, no strokes — and the
double-click dispatch
([:2140-2142](apps/desktop/src/components/BoardEditor.tsx#L2140-L2142)) opens it
for `kind === 'text'` only; **a double-click on an ink box matches no branch and
does nothing.**

**So the ruling's second half is a BUILD, not a gate to flip.** "Ink needs to
available, though, on Boards and Cards" asks for **stroke authoring on two
surfaces that have never had it**, where the typewriter half is a narrowing of
something that exists. They are not the same size, and §8 proposes splitting
them for that reason.

**What the second half must decide** (named now, not at build time):
- **The basis, on a board.** Page ink is normalized to the SHEET's width; a
  ported ink box is re-normalized to the BOX's width
  ([persistence.ts:1070-1077](apps/desktop/src/store/persistence.ts#L1070-L1077)).
  Drawing directly on a board needs its own answer: box-local (matching ported
  ink, so the two kinds of board ink are one kind) or board-canvas-local (a
  drawing that spans boxes). **Lean: box-local**, so ported and drawn ink are
  the same thing and nothing has to learn a second model. A drawing that spans
  the whole board is the other reading and it is worth Nick's word.
- **What a card's ink IS.** A card is a text box today; ink on a card could be a
  second field on the same box, or an ink card kind that can also hold text.
- **The pointer contract** on a board, where the same pen must still be able to
  drag boxes and marquee-select. This is the one that decides whether it feels
  like a sketchpad or a fight: a board already owns press-drag for selection and
  movement, so "pen draws, mouse selects" (the Journal's own J9 contract) is the
  obvious candidate, and it is NOT what the page does (the page draws with a
  mouse too, because the laptop is the primary target).

**No shared "does this have ink?" predicate exists** — I verified this rather
than assuming it: the same expression is written out locally in ten places
(e.g. [PageFace.tsx:52](apps/desktop/src/components/PageFace.tsx#L52),
[Spread.tsx:58](apps/desktop/src/pages/Spread.tsx#L58),
[persistence.ts:1124](apps/desktop/src/store/persistence.ts#L1124)). 171 will
need one for the page; it belongs in `store/ink.ts` beside the model. ⚠ Note a
name collision before anyone greps: `draftFormat.ts` has a local `hasInk(i)`
that means "this text LINE is non-blank" and has nothing to do with strokes.

## §4 · THE RULE, STATED

**The typewriter runs if and only if ALL of:**

1. the writer's stored `typewriter` is on (unchanged, global), **and**
2. the surface is the typed page in **Free Write** (`mode === 'journal'`) —
   never Draft, never Revise, **and**
3. the page's instrument is **TEXT**, **and**
4. the page **has no ink**.

**And the CONTROL is absent — not greyed — whenever 2, 3 or 4 fails**, on all
five surfaces in §1's table, via the `typewriterAvailable` seam that already
exists.

**The stored global is never rewritten by this rule.** A writer with the
typewriter on keeps it; it simply does not run on a page with ink, and resumes
on the next inkless page. This is SC1 S3's law and M1's, not a new one.

## §5 · CONSEQUENCES, NAMED BEFORE ANYTHING IS BUILT

1. **Draft loses the typewriter for everyone.** Today a Draft page OPENS with it
   on (FX2 S2's seed, below the 10-line threshold). This is the ruled change,
   and it is the most visible thing in the ticket.
2. **The Draft-open seed must go with it.**
   [PageEditor.tsx:396](apps/desktop/src/pages/PageEditor.tsx#L396) writes the
   GLOBAL setting from a Draft page's content. Leaving it would let opening a
   Draft silently flip Free Write's typewriter — a setting the writer never
   touched, changed by a mode that no longer uses it. **FX2 S2 is superseded by
   171**; its text stays, with 171 named as successor.
3. **Item 127's typed FACE rides on "typewriter ON".** 127 ruled: *"THE TYPED
   FACE APPLIES TO TYPEWRITER ON ONLY; with Typewriter OFF the page uses its own
   chosen face."* So under 171, **a Free Write page with ink also loses the
   typed face** when 127 ships, and 127's roster line "Typewriter on/off" is
   conditional on the page having no ink. Named because it is not obvious from
   either ticket alone. **127's text stays; 171 is its successor for this
   clause** (Fable's instruction).
4. **Selecting Ink removes a 25%-of-stage pad, so the text jumps** unless the
   scroll is compensated at that moment. **Lean: compensate** — add the removed
   pad to `scrollTop` in the same frame, so the words stay under the writer's
   eye and only the blank band above them closes. Named as a build decision
   rather than discovered at the sitting.
5. **Item 157's M10 must be PARKED by this ticket.** Its premise — a blank band
   above the first line, drawn in — becomes unreachable, because selecting Ink
   turns the typewriter off before the first stroke. Recorded in 157's S0 §10
   and in the leg's own comment so the sweep cannot miss it.
6. **The JOURNAL surface would have the same conflict, but it is UNREACHABLE,
   so there is nothing to rule.** `JournalEntry` runs the typewriter
   ([:251](apps/desktop/src/pages/JournalEntry.tsx#L251)) and carries its own
   pen-only ink pipeline — but the component **is not imported anywhere** and
   `/journal/:id` permanently redirects to `/page/:id`
   ([App.tsx:13, :90-96](apps/desktop/src/App.tsx#L13)). I checked for an import
   or a dynamic import across the tree and found none. **171 therefore leaves it
   alone**: changing dead code would be a change nobody can see, and deleting it
   is FX14's business, not this ticket's. Recorded so the next reader does not
   re-discover the conflict and think it live.
7. **The script surface already has the defect the ruling names**, and it is
   adjacent rather than mine by default: its typewriter control MOUNTS (item 83
   M8/R12) while the engine no longer runs
   ([ScriptEditor.tsx:497](apps/desktop/src/components/ScriptEditor.tsx#L497)) —
   a live switch that does nothing, which is exactly what SC1 S3 forbade.
   **Flagged for the ruling**, one line of the same predicate to close.

**ONE OPEN WORD IN THE RULING ITSELF — "cannot be reactivated".** Read
strictly, "once any ink has been ADDED" is sticky: a page that ever held ink
never runs the typewriter again, even after the writer undoes the stroke. Read
as state, the predicate is `strokes.length > 0`, and undoing the only stroke
returns the page to inkless.

- **Sticky** needs a new stored per-page fact (`hadInk` on the entry blob — no
  column, but new stored state, and the two schema flags say a COLUMN stops for
  Nick's word; this would not be a column).
- **Stateful** needs nothing stored at all, and an erase does not resurrect the
  typewriter either — an eraser is itself a stroke, so the array stays non-empty
  ([store/ink.ts](apps/desktop/src/store/ink.ts) `eraser: true`). **Only UNDO
  can return a page to inkless.**

**Lean: stateful.** A stray dot, immediately undone, should not cost a page its
typewriter forever, and "the page has ink" is a fact the writer can see rather
than a hidden flag. **Named for the ruling rather than chosen quietly.**

## §6 · THE PARK SURFACE — where the sweep starts, not what it concludes

Assertions 171 falsifies, found by grepping the harness roster for what the
change DOES (Draft + typewriter, and the control's presence), not for a renamed
string:

| file | what it asserts | fate |
|---|---|---|
| `fx2.mjs` S2 | a short page "opens Draft with typewriter ON" / a 15-line page OFF — **both in the DOM and in the stored setting**, plus a cross-page fixture ([:267, :269, :277, :279, :348](apps/desktop/scripts/harness/fx2.mjs#L267)) | PARK — Draft has no typewriter |
| `item87.mjs` S3 | "(a) a FRESH Draft page opens with the typewriter OFF"; "(b) CONTROL: a Draft page that already holds work still opens with the typewriter ON" ([:129, :161](apps/desktop/scripts/harness/item87.mjs#L129)) | PARK |
| `ab2.mjs` S2 | "the typewriter option reaches the script surface's Draft posture" ([:532, :552](apps/desktop/scripts/harness/ab2.mjs#L532)) | depends on §5.7's ruling |

**Eighteen harness files mention the typewriter**; the three above are the ones
whose CLAIMS the rule contradicts on today's reading. **This is a starting
surface, not a count.** The sweep is run whole before code moves, and the final
number is settled BY EXECUTION in the parked leg — this lane has published an
undercount before (item 121: said 5, was 8).

## §7 · WHAT THE HARNESS OWES

1. Free Write / TEXT with no ink: the typewriter runs and its control is offered
   (the unchanged case, asserted so the narrowing cannot become a deletion).
2. Selecting INK: the pad is gone, the fade is gone, the control is ABSENT from
   all five surfaces — and **the stored global is still on** (the silent-degrade
   law, measured in storage, not inferred).
3. A page WITH ink, reopened in TEXT: still no typewriter, control still absent —
   "cannot be reactivated", asserted as a negative.
4. Draft and Revise: no typewriter engine, no control, at both widths.
5. The writer's global preference survives: an inkless page still runs it.
6. The text does not jump when Ink is selected (§5.4), measured as the editor's
   screen position across the switch.
7. Ink on BOARDS and CARDS — the ruling's second half. A trusted stroke drawn
   on a board canvas persists and renders; a stroke on a card does too; the
   board's existing gestures (select, drag, marquee, resize) still work, which
   is the check that decides whether the two pointers can share one surface.
   Ported ink boxes are untouched by the new authoring path (J4's law).
8. item 157's M10 parked, counted by execution.

## §8 · SEQUENCING, AND A PROPOSED SPLIT

Branched from `origin/main @ b807f59`, browserless, no box taken. **Item 157's
pair comes first** (its turn is announced: after 170's pair and Batch Four's
deploy pair, before FIX's next three). 171 is designed while that waits and is
not built until 157 is stamped and offered — both touch `PageEditor.tsx` and the
same surface, and a second branch moving under the first would cost the pair.

**PROPOSED, FOR FABLE'S WORD: split 171 into two.**

- **171-A · TYPEWRITER SCOPE.** The narrowing in §4, its control census, the
  FX2 S2 and 127 supersessions, and 157's M10 park. Every piece of it already
  exists and is being gated; the risk is entirely in the park sweep. **Small,
  and it is the half that carries Nick's complaint.**
- **171-B · INK ON BOARDS AND CARDS.** Stroke authoring on two surfaces that
  have never had it, with three unruled questions in §3 (the basis, what a
  card's ink is, and how a pen and a selection gesture share a board). **This is
  a feature build, not a gate**, and sizing it as half of a scope ticket would
  hide that.

**They are only bundled by the sentence that ruled them.** If Fable wants them
as one item I will build them as one; the split is recommended so 171-A can ship
while 171-B's three questions get their answers.

## §9 · RULED 2026-09-19, AND WHAT WAS BUILT THE SAME DAY

Fable's three rulings, and one instruction:

1. **STATEFUL**, as leaned: "cannot be reactivated" derives from
   `strokes.length > 0`. A stray dot immediately undone must not cost a page its
   typewriter forever, and sticky would need new stored per-page state to
   enforce a harsher rule than Nick asked for. **An eraser IS a stroke**, so
   erasing does NOT restore the typewriter — recorded here, in the code, in
   item171a.mjs's T5, and owed to the offer as the consequence a writer would
   not predict.
2. **THE SPLIT IS RATIFIED.** 171-A (this build) ships on its own. **171-B —
   ink authoring on boards and cards — is a FEATURE BUILD and goes to PLAN DESK
   as a design charter**; this lane builds it after PLAN rules its three
   questions (§3: the coordinate basis, what a card's ink is, and how a pen
   shares a surface with select and drag).
3. **SCROLL COMPENSATION RATIFIED** — the words stay under the writer's eye.

**And the instruction:** close the script surface's live-control-dead-engine
defect *inside* 171-A with the same predicate, rather than leaving a known lie
standing for a week.

### What that instruction turned out to touch — raised, not settled here

The script surface's control is there **by Nick's own word**: item 83 M8 (R12),
*"TYPEWRITER mode should be available while writing a screenplay, too"*, which
deliberately mounted the menu **ahead of its engine** and flagged the hook-up as
its own later brief. So closing it **withdraws a capability he named**. It is
built as instructed, on the grounds that **his latest words govern** (item 127's
own F1 default) and a screenplay's posture is Draft — and it is written into the
offer, into ScriptEditor.tsx, and into all three parked assertions, so nobody
meets it later as a silent reversal. **If he wants it back, the answer is R12's
own flagged engine hook-up, not the prop this ticket added.**

**ROUTED 2026-09-19 AS ITEM 183, TO NICK HIMSELF** — a disagreement between two
of his own words is his to resolve, not a lane's. **171-A does not wait on it.**
(It was first relayed as "item 182"; that number was already held by THE GRANT
PROVES A TOKEN, NOT A HOLDER, and the collision was caught before either record
carried it — which is why nothing had to be unwound.)

### A second instance of the same defect, found while sweeping

**A Board offered the typewriter option too**, and a Board has never run the
engine. `typewriterAvailable` was hard-true at its single call site, so every
surface carrying the sliver's foot inherited the option whether it could run it
or not. Closed by the same predicate; asserted by item171a.mjs's T8.

### The limit of the scroll compensation, stated

The pad the typewriter adds is **padding on the scroller**, so the correction is
a scroll correction — and **at scroll 0 there is no scroll to give back**. A
page sitting at the top still rises by the pad when the typewriter goes off.
Nothing DRAWN is ever displaced (the pad is gone before a first stroke can
exist), the common scrolled case is held to within 2px, and item171a.mjs's T10
**measures the scroll-0 case and reports it rather than asserting it**.

### The park sweep, as executed

`fx2.mjs` 11 assertions (the Draft-open seed leg, whole) · `item87.mjs` 2
(clause 3 and its control) · `ab2.mjs` 1 · `fx3.mjs` 2 · `sc1.mjs` 2 — each
original kept verbatim beside a live successor, each counted by execution in its
own file's parked leg. **Several would have stayed GREEN for a reason their
names do not state** (a `false` DOM read that used to mean "the seed chose OFF"
and now means "Draft has no typewriter"); those are parked too, because a check
that passes for an unstated reason is not a check. **item157.mjs's M10 is still
owed** and cannot be written until 157 merges — that file does not exist on this
branch.

**Two things found in the sweep, fixed in place (147's class):** `item87.mjs`
printed `PARKED: PASS (0 checks)` beside an array already holding four, and
`ab2.mjs`'s "the toggle does NOT present itself" check was reading a class FX3
S5 retired — green about nothing. The first is corrected with its original line
quoted; the second is re-pointed to the gear row (claim unchanged, no park
owed).
