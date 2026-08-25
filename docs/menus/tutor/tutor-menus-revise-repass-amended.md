# ITEM 84 — REVISE RE-PASS, AMENDED · THE ERROR LENS AND ITS BUILD ORDER
### The Tutor's menu · TRR12–TRR18 · 2026-08-25
**STATUS: RATIFIED (2026-08-25).** Nick's words are given and Fable has ratified this
document as written — TRR12's absorption, TRR14's decoration finding and its CSS-only
flag law, TRR15's A13 preservation, the seven-ticket shape, and the order
T1→T3→T2→T4→T5→T6→T7 with the first walkable slice T1+T3+T2. The four re-pass items are closed
by Nick's word (relayed via Fable): TRR1 ratified with the MODEL exception; the
their/there ruling superseded and re-argued below; TRR5's fork opened — **TU4's
deferral is LIFTED for Revise only, by Nick's word**; TRR8 rest confirmed. Nothing
below adds a lock; the build order is a recommendation to be reordered at will.
**Provenance:** the lock record §1–§10 and the re-pass (`8b67bbd`, `1ba2728`, branch
`item84/tutor-menus`); `apps/desktop/src/store/draftDecoration.ts` read whole at main,
2026-08-25T18:51Z; the arc's standing laws (voice, button, decline).

---

## §1 · TRR12 · THE MODEL EXCEPTION — TRR1 AMENDED

The paste test's line, restated: **never the writer's fixed bytes; a parallel example
is teaching.** The Tutor may compose a sentence of its own — similar in structure,
correctly punctuated — precisely because it is *not* the writer's sentence and cannot
be pasted back as one. What stays forbidden is the writer's own sentence returned
repaired: that is the fixed byte, the ghostwrite, the thing A13's wall exists to
prevent. The distinction is not stylistic but architectural — a model is a specimen
about grammar; a repair is the page's next revision performed by the machine.

This also settles item 2 by absorption. The their/there case never needed a standing
loophole: under the flagging engine the app names the error class, and under TRR12 the
Tutor models a parallel sentence that demonstrates the distinction. The mechanical
case is now a *consequence* of the general shape, not an exception carved beside it.

## §2 · TRR13 · THE RECONCILIATION, AS LAW

**The anti-interruption thesis is carried by the MODE BOUNDARY, not by the absence of
the feature.** Free Write and Draft stay silent — nothing flags, nothing marks,
nothing arrives. Revise is the mode a writer *enters in order to be shown what is
wrong*; a flag there is not an interruption but the mode's own answer to the writer's
own act of entering it. Every earlier prohibition reads intact under this law.

**CROSS-LANE DIVERGENCE — RULED AND NARROWED.** DR7 (item 83's) read on disk as
*"NOTHING ARRIVES UNBIDDEN — PROSE-WIDE… binding every prose mode."* Revise is a prose
mode, so this ruling narrows it. Surfaced to Nick 2026-08-25; his word: **"Revise
accepted."** **The law now reads, in the words both lanes carry:**

> **Nothing arrives unbidden — PROSE-WIDE, binding every prose mode, EXCEPT REVISE,
> by Nick's word.**

TRR13 above is its reasoning. Per Fable's cross-lane instruction, both lanes record the
narrowing in these same words and neither amends the other's file: this lane writes it
here, the menu lane writes it into 83's records on Fable's relay, and Nick's word is the
authority both cite.

## §3 · TRR14 · THE DECORATION FINDING — VERIFIED, WITH ITS LAW

The brief's unverified hypothesis is **CONFIRMED, and stronger than posed.**
`draftDecoration.ts` is a pure display pass: plain text in, HTML out, "character COUNT
always preserved 1:1 against the input (only `<span>` wrapping is added)." Marks are
never persisted; they are recomputed on render. **AB2's structured-jsonb requirement
therefore never triggers for flags** — `entry.text` stays untouched plain text, and
only *settings* need persistence (ignore list, vocabulary, disabled classes).

Better still, the seam already exists and has a precedent. `decorateEditorFor` is
declared "the one place a live contenteditable's decorated DOM is ever written from
plain text + a caret offset," and it takes an optional `decorate` override — FX5 S6
already passed a second decorator (`decorateMarkdownForCard`) through it without
disturbing the first. **A flag decorator is a third decorator through a proven
override, not a new data path.**

**THE LAW THIS FINDING CARRIES (build-binding).** The module's own FX5 S6 comment
proves the hazard empirically: stored text is derived from the DOM's rendered text,
so anything `display:none` or `visibility:hidden` "would vanish from `innerText` the
moment it existed, silently stripping the markdown characters out of the STORED text
on the very next keystroke." Therefore: **a flag may only wrap existing characters in
a span and add nothing.** No injected glyphs, no icon characters, no inserted markers
— the marking dialect must be CSS on a wrapping span (underline weight, ground tint,
edge), never a character. This is not a constraint fighting the design; it is the same
answer as "must not resemble Word's squiggles," arrived at from the data side.

**OPEN, NAMED NOT ANSWERED:** whether the Revise surface routes through
`decorateEditorFor` at all — the module's named call sites are ForwardOnlyEditor's
drafting branch, PageEditor's rail actions, and BoardCardPopup. If Revise renders
through a path that does not, the seam holds but the wiring differs. **First check of
ticket T1**, before any code.

## §4 · TRR15 · A13 SURVIVES — AND THE FLAGGING ENGINE IS NOT THE TUTOR

Stated plainly because the whole arc rests on it: **the app flags; the Tutor is
consulted.** The checker is app machinery — deterministic, local, no model call — and
the Tutor holds no editor reference, receives no setter, and writes nothing to the
page. The writer consults; the Tutor answers about the writing. Both walls stand
exactly where they stood. The Check Correction loop must be built to preserve this:
whatever adjudicates, the page is edited by the writer's hands alone.

## §5 · TRR16 · THE CHECK CORRECTION LOOP

Nick's spec, held: the button **activates only once the writer edits the flagged
sentence** — dead until the writer's own act, which is the arc's oldest law wearing
new clothes. Correct → an olive checkmark, the marking clears (olive marks where you
are; nothing celebrates, so no orange). Still wrong → the Tutor is called again for a
*different* explanation or modeling approach, never the same one louder.

**THE ADJUDICATION — RULED CONDITIONALLY (2026-08-25).** Nick's word, verbatim: *"Is
it a relatively easy ask that the app will know if a sentence that was just asked about
has now been fixed without consulting an AI API call? If this isn't hard to implement,
then that's definitely the way to go. If this is quite a complicated ask, then let's
just go with the API call for now."* The ruling is therefore **checker first, model
only on disagreement — conditional on cost**, and **T6's S0 answers it EMPIRICALLY
before building**: can the local checker re-evaluate the edited sentence and report
flag-cleared cheaply? Yes → checker first, model on disagreement. No → the model call,
recorded as a deliberate simplification with the checker path named as a later
optimization.

**The line the S0 must draw:** the checker answers *"is this sentence clean,"* never
*"did the writer understand."* **That gap is the disagreement case** — and it is why the
model is not merely a fallback but the instrument for a different question.

Under the button law, the button names what its own press sends. Under the decline
standard, a still-wrong result never returns a refusal sentence — only the returning
Socratic question.

## §6 · TRR17 · THE SHAPE — SEVEN TICKETS

| | ticket | what it is | depends on |
|---|---|---|---|
| **T1** | **The checker + error classes** | the deterministic engine: spelling, grammar, class taxonomy. No UI. Opens with the §3 routing check. | — |
| **T2** | **The marking dialect** | the flag decorator through `decorateEditorFor`'s override; span-only per §3's law; Plateau visual, its own dialect, theme-arc bound. | T1 |
| **T3** | **Vocabulary + ignore** | Add to Vocabulary (invented names, places), per-flag Ignore; both persist as settings, not marks. | T1 |
| **T4** | **The panel queue** | top three flagged issues on open, expandable three at a time, each clickable to start the Tutor. Seeds the composer per the button law. | T1, T2 |
| **T5** | **The right-click surface** | net-new (`onContextMenu` appears nowhere in the app): error type, consult the Tutor, Ignore, Add to Vocabulary. | T2, T3 |
| **T6** | **The Check Correction loop** | activation on edit, adjudication (§5's open question), olive checkmark, clearing, the different-explanation re-call. | T4 |
| **T7** | **Revise settings + style guide** | error classes off individually (fragments, e.g.); TRR11's style authority — MLA default, Chicago/APA/AP, per project. | T1, T3 |

## §7 · TRR18 · THE BUILD ORDER — RULED

**T1 → T3 → T2 → T4 → T5 → T6 → T7.** Proposed by the desk, put to Nick 2026-08-25,
his word: **"Your proposed build order is fine."** Ratified by Fable with the reasoning
credited — vocabulary before visible marking protects the first Revise sitting from
drowning in false flags on invented names. Ranked and closed; build tickets are written
against this sequence.

One deviation from the obvious sequence, and it is deliberate: **Vocabulary before the
marking.** Wrizo's writers are novelists; the first Revise sitting on a chapter full of
invented names and places would drown in false flags, and the device sitting is Nick's
primary product signal — a slice that produces an unreadable first walk produces an
unreadable verdict. Shipping the vocabulary escape *with* the engine keeps the first
sitting honest. T3 also has no UI dependency: it is a settings store and two verbs.

The first walkable slice is **T1+T3+T2** — errors appear, false ones can be dismissed
forever, nothing else exists yet. That is a complete sitting on its own and the
cheapest place to learn whether the marking dialect reads as counsel or as correction.

The dependency column remains the only hard constraint on any future re-ordering, and
T6 stays the sole ticket whose internal question (§5) must be answered before it
starts — the order is ruled, that question is not.

---

*Coming to Nick AS A BATCH, per Fable, once all three are drafted: the §2 SYSTEM_PROMPT
amendment (drafted, not applied — `tutor-rules.md` untouched); TRR11's relevance gate
(does the style-guide dropdown ride the citation ask's gate, or stand in Revise
always); and citation depth (does the citation ask check form only, or also ledger
completeness). OWED TO ITEM 83'S LANE: DR7's narrowing in §2's exact words, on Fable's
relay. T6's adjudication is ruled conditionally — its S0 answers the cost question
empirically (§5).*

— the item-84 desk, 2026-08-25
