# ITEM 84 · THE RIGHT STRIP — THE TUTOR AND AUTOMATION
### Design proposal · authored 2026-09-22 by the item-84 desk (TUTOR) · for Nick's word
**STATUS: PROPOSAL — nothing here locks.**
**Nick's definition, verbatim, and the whole basis of this pass:**

> the right-hand is the AI tutor + app automation that unblocks the writer

**The line he drew with it:** page-specific resources — sources, related chapters — go to
a **new far-right rail**, not this strip. §5 takes that line seriously and says what it
removes from the Counsel's load.

**WHAT THIS DESK HAS NOT SEEN, stated before anything is designed on top of it.** Fable's
relay names *"claim-checking from Fable's mockup"* and *"Nick's own sketch"* where
automated feedback sits beside the AI Tutor in a Feedback loop. **Neither the mockup nor
the sketch is available to this desk** — they are not in `Downloads` beside the committees'
report, and the ledger carries nothing on the right strip, the far-right rail, automation
or claim-checking. So this proposal is built on **Nick's sentence, which is quoted above in
full**, and on the arc's own standing laws. Where the mockup shows something different, the
mockup wins and this pass should be read against it.

---

## §1 · THE PROBLEM THE SENTENCE CREATES, AND HOW THE ARC ALREADY SOLVED IT

Read plainly, *app automation* is software that acts without being asked. This arc has
spent its entire life on the opposite principle: **nothing arrives unbidden.** FW6 in Free
Write, DR7 prose-wide, item 64 gating the nudges, A14's *the room never knocks*. Putting
automation inside the Counsel's own strip is, on its face, putting the one thing the arc
forbids into the room built to forbid it.

**It is not a contradiction, and the resolution is already ratified — it just has to be
applied a second time.** When the error lens needed to mark a writer's page unbidden, the
answer was **TRR13's mode boundary**: Free Write and Draft stay silent, and *Revise is the
mode a writer enters in order to be shown what is wrong.* A flag there is not an
interruption; it is the mode answering the act of entering it. Nick then narrowed DR7 by
name to make that lawful.

**The same reasoning covers automation, and gives it a precise limit:**

> **Automation is lawful where the writer's own act asked for it.** A pressed-open strip is
> such an act. A mode entered on purpose is such an act. **Nothing else is.**

And the limit that follows, which this desk proposes as the governing rule:

> **Automation may PREPARE silently. It may not SPEAK unbidden.**

A finding computed and waiting behind a press is preparation. A count on a heading the
writer is already looking at is preparation. **A popup, a badge on the grip, a line that
appears in the conversation, or a toast is speech** — and speech is what A14 and FW6
forbid. The distinction is testable, which is the point: *did the writer's act reach this
finding, or did this finding reach the writer?*

---

## §2 · CLAIM-CHECKING — IT IS THE PARKED ERROR LENS, SECOND TENANT

**The strongest finding in this pass, and it saves an entire architecture.** Claim-checking
— marking which claims in a draft have a source — is **not a new machine.** It is the
error lens's machine with a different checker in it, and that machine is already designed,
argued, and parked in seven tickets:

| Parked ticket | What it already gives claim-checking |
|---|---|
| **T1** the checker + error classes | the deterministic engine and its class taxonomy |
| **T2** the marking dialect | CSS-on-a-wrapping-span marks, span-only, never Word's squiggles |
| **T3** vocabulary + ignore | *"this claim needs no source"*, persisted as a setting |
| **T4** the panel queue | the top three findings, expandable three at a time |
| **T5** the right-click surface | the finding's type, and **consult the Tutor** |
| **T6** Check Correction | *the writer added a source — is it satisfied now?* |
| **T7** settings | turn classes of check off individually |

**TRR14's build-binding law carries over unchanged and is the reason this is cheap:** a
flag may only **wrap existing characters in a span and add nothing**, because stored text
is derived from rendered text. `entry.text` stays plain. No schema. The seam is
`decorateEditorFor`'s existing decorator override — which would make a claim decorator the
**fourth** consumer of a proven override, not a new data path.

**So the recommendation is: do not design claim-checking. Re-target T1–T7.** The tickets
change their checker and their taxonomy; the marking law, the queue shape, the right-click
surface, the ignore mechanism and the loop are already ruled.

### The one real difference, and it is a disclosure question

**Grammar's checker is local by hard filter.** T1 states it: *the checker must run LOCALLY*,
because a hosted grammar service would send the writer's page to a third party no
disclosure sentence names.

**Claim-checking cannot inherit that for free.** Deciding *which claims have a source*
means comparing prose against source records, and that splits exactly as T6's adjudication
did:

- **Local** — citation and string matching against the writer's own records. Sends nothing.
  Finds every claim that names its source and misses every claim that paraphrases it.
- **Model** — semantic matching. Finds the paraphrases. **Sends the writer's prose and their
  sources**, which is a payload no current sentence names.

**The ruling already exists for this shape and should simply be reused:** *checker first,
model only on disagreement*, with T6's S0 pattern — answer the cost question empirically
before building. And under candidate B, **the button names what its own press sends**: a
model-backed claim check must say on its face that it is sending the claim and the source,
and send only that.

**Gating, stated plainly:** claim-checking needs **Records** to check against. It is
blocked on the same PLAN DESK primitive as the Bibliography preset. **The local half of
T1–T7 is not blocked** and could be re-targeted the moment records exist.

---

## §3 · WHAT ELSE "AUTOMATION THAT UNBLOCKS" SHOULD INCLUDE

**The test this desk applied**, because Nick's sentence contains the criterion: *unblocks*.
Some automation **unblocks** — it removes an obstacle to writing the next sentence. Some
merely **informs** — it tells the writer about what they already wrote. Both can be worth
building; only the first answers the sentence, and the strip should be ordered by it.

### Unblocks — recommended, in this order

1. **THE NAMED-ENTITY GATHER.** Every proper noun the manuscript uses, gathered into a
   list the writer can annotate. **Why it unblocks:** it turns *"I ought to build a lore
   bible"* — an intimidating blank — into *"here is the cast; say a line about each."* It
   serves the Worldbuilder and the Pantser at once, and it is the only automation here that
   **creates the material the other checks need**: continuity has nothing to check against
   until the records exist, and this is how they come to exist without a week of typing.
   *This desk's strongest single proposal.*
2. **THE DANGLING SETUP.** *A gun was named in chapter three and never fired.* Introduced
   things that never return; questions raised and never answered. **Why it unblocks:** in
   revision the hardest question is *what is missing*, and a blank page cannot answer it.
   This is the reverse of consistency: consistency finds contradictions, this finds
   absences.
3. **THE REVERSE OUTLINE'S SUGGESTIONS** *(Nick named this).* *These twelve pages look like
   three chapters.* **Why it unblocks:** it answers the Pantser's *"what is this pile?"*
   Belongs where the reverse outline lives — PLAN DESK's board, per "From My Pages" — not
   in this strip.

### Informs — real, and already housed

4. **CONSISTENCY** *(shipped)* — repeated and near-duplicate names. Already a lens. The
   upgrade the Worldbuilder asked for is *check the manuscript against the Bible*, which
   is continuity below.
5. **CONTINUITY AGAINST RECORDS** *(Nick named this)* — *green eyes in the lore, blue in
   chapter twelve.* Gated on Records. **Renders in Consistency, which is already the lens
   for "these two things disagree"** — not as a new bay.
6. **REPETITION AT DRAFT TIME** — this image three times in nine pages. Useful, low cost,
   informs rather than unblocks.

### The hardest case, named rather than proposed

**THE STALL.** The most literal reading of *"unblocks the writer"* is: the writer has
stopped typing, and something helps. It is also **the single most dangerous thing in this
document**, because noticing a stall and acting on it is precisely *arriving unbidden* —
in Free Write, where FW6 is absolute and where a stall is often just thinking.

**This desk proposes no stall detection**, and recommends against it until Nick rules
specifically, for a reason the arc already paid to learn: FX15 retired the unbidden
first-line invite *because Nick did not want it*. A stall detector is that same offer with
a trigger attached. **The lawful shape, if it is ever wanted, is the deck's:** the material
is prepared, it is reachable, and **the writer draws it.** Never dealt on arrival, and
never with a badge — A14 stands.

---

## §4 · HOW AUTOMATION AND THE TUTOR SHARE ONE STRIP WITHOUT CROWDING IT

**The crowding is real and already at its limit.** The strip holds, today and as designed:
the grip · the head · Conversation (messages, the chip row, the Find row per FN2, the
composer, Send) · Consistency · Structure · Fragments · the Bible · the disclosure · the
meter. The cognition bench's ceiling is **three open sections**, and Revise already sits
at it exactly. **There is no room for an "Automation" section, and that is the answer
rather than the problem.**

### The proposal, in one sentence

> **AUTOMATION FINDS. THE TUTOR EXPLAINS. THE PRESS IS THE BOUNDARY.**

A flag, a count, a gathered list — automation. The sentence about *why* this is a
contradiction, or *what* to do about it — the Tutor, and it arrives only when the writer
presses for it. That is exactly T5's right-click → **consult the Tutor** shape, and this
desk proposes generalizing it: **every automation finding carries one press that hands it
to the Tutor, and no automation finding ever explains itself.** It keeps the division
legible without a label, and it keeps the Tutor's own voice the only voice in the strip.

### Three rules that follow, and are testable

1. **NO NEW SECTION.** Every finding lands in an existing lens, or as a mark on the page,
   or nowhere. **The lenses already ARE automation** — Consistency is an automated check
   presenting findings — so the grammar exists and adding a bay would duplicate it. If a
   finding has no lens that fits, **argue the lens**, do not add a bay.
2. **THE CONVERSATION STREAM IS THE TUTOR'S ALONE.** FN4 already ruled this for Find:
   results never render as messages, never carry a speaker, never scroll into the
   conversation. **Automation inherits it unchanged.** The stream is where the model spoke;
   anything else appearing there is a lie about provenance.
3. **AT MOST ONE COUNTED LINE, AT THE FOOT, PRESSABLE.** If automation must announce a
   population at all, it does so as a quiet count in the register the meter already
   occupies — *"4 claims without a source"* — pressable, opening the lens that holds them.
   **Never a badge on the grip** (A14). One line is the ceiling, and zero is lawful.

### And the mode boundary does the real work

Most of the crowding dissolves because **automation is not present in every mode.** Under
TRR13, claim-checking and the error lens live in **Revise**; Free Write stays analog and
silent by its own law; Draft marks. **The strip is only ever carrying the automation of
the mode the writer is standing in** — which is why the ceiling survives at all, and why
the mode boundary is load-bearing here for a second time.

---

## §5 · THE FAR-RIGHT RAIL — NICK'S LINE, AND WHAT IT TAKES AWAY

Not this desk's to design. But the line relieves a real pressure and that should be on the
record, because three committees pushed hard on exactly it:

- the Features Writer's **sources beside the draft**
- the academics' **source beside the draft** — their loudest praise for split screen
- the Worldbuilder's **character sheet open while writing**

**All three are page-specific resources, and all three now go far-right.** That is a large
load lifted off the Counsel hand, and it is what makes the three-section ceiling survivable
while automation arrives. **This desk endorses the line** and asks only that it be held:
the moment a *resource* is rendered in the Counsel's strip for convenience, the ceiling
fails and the strip becomes a sidebar.

### ⚠ A divergence to surface — item 119 knows two hands, not three

Item 119 is Nick's own ruling and it is binding on this arc: *"the tools menu pop-out and
the Tutor interface pop-out to be **exactly mirrored** to each other."* **A third rail is
not in that ruling.** Open questions this desk does not answer:

- Does the far-right rail **mirror** anything, or is it a third thing with its own grammar?
- 119 anchors both hands to **the paper, never the screen**. Does the far-right rail anchor
  to the paper too — and if so, what happens to the measure when three things are open at
  a device floor of 1366×768, where *paper never reflows for chrome*?
- Is the far-right rail a **rail** (always present, like the Sliver) or a **drawer** (pressed
  open, like the hands)? The word chosen matters: 119's geometry is drawer geometry.

**This goes to Nick and to whoever holds 119.** It is exactly the shape of divergence this
lane surfaces rather than resolves — and it is better asked now, before a rail is built
against a mirror ruling that describes two hands.

---

## §6 · OPEN

- **Fable's claim-check mockup and Nick's Feedback-loop sketch** — unseen by this desk;
  this proposal should be read against them and yields to them.
- **Records** — claim-checking and continuity are both blocked on PLAN DESK's primitive.
- **The stall** — proposed against; Nick's specific word wanted before anyone builds it.
- **The far-right rail's relationship to item 119** — §5.
- **Whether "automation" earns a word in the lexicon at all.** This desk's lean is **no**:
  the writer should meet *a flag*, *a count*, *a list* — never a category called
  automation. Naming the machinery is how a writing room starts sounding like a toolbar.

---

*Claim-checking's recommendation is a re-targeting of the parked T1–T7, not a new build
(§2). The presets' day-one contents are a separate offer of the same date.*

— the item-84 desk (TUTOR), 2026-09-22
