# ITEM 207 — THE FONT ROSTER — TUTOR'S CRAFT REVIEW

*The item-84 desk (TUTOR), 2026-09-24. Docs-only. A review of PLAN DESK's
`item207-fonts-design.md` @ `3bfb70a`, asked for by Fable.*

**Reviewed: the roster only** — Crimson Pro, Lora, EB Garamond, Figtree, Atkinson
Hyperlegible, Courier Prime, and Source Serif 4 as the optional seventh. **The control's
placement, the size steps, the two adding-routes and the storage are PLAN DESK's and are not
reviewed here**, except where a number underneath the roster turned out to be wrong (§1).

**The design is sound and this review does not ask for it to be re-done.** Three changes are
recommended, one exclusion is upheld, and one claim is corrected with measurements.

---

## §1 · ⚠ THE NUMBER THAT SIZES THE ROSTER IS WRONG — AND IT SHOULD NOT CONSTRAIN CRAFT

**The design says:** *"each family is ~100–300 KB per style; the eager imports in `main.tsx` do
not scale to seven."* **That figure is the reason the roster is capped at "seven at most, five
to start."**

**Measured, this session, from the actual packages:**

| | |
|---|---|
| **ONE style, one family** (`lora-latin-400-normal.woff2`) | **20.7 KB** |
| **A family's whole prose set** (latin 400 + 700 + 400 italic + 700 italic) | **45–99 KB** |
| **ALL SEVEN families, four styles each** | **534 KB** |

Per family, that prose set: Figtree 45 · Atkinson Hyperlegible 70 · Crimson Pro 74 · Courier
Prime 80 · Source Serif 4 81 · Lora 85 · EB Garamond 99 KB.

**The per-style figure is off by roughly five to fifteen times.** **The conclusion drawn from
it — that seven families will not scale — is not supported by the numbers.**

**THE STRATEGY IS STILL RIGHT AND THIS DESK DOES NOT ASK FOR IT TO CHANGE.** Load-on-choose
with the default eager is good practice on its own merits and it should ship. **What changes
is what the roster may be decided ON: craft, not a byte fear.** A cap that exists because of a
mis-stated cost is a cap on the wrong axis — *and it was about to trade a reader's legibility
for bytes that were never there.*

### 1.1 · AND THE PACKAGE FORM IS MIXED — WHICH §1 STATES TOO SIMPLY

The design says *"five families are bundled (`@fontsource` in `package.json`)."* **Two of them
are `@fontsource-VARIABLE/`** — `main.tsx:5–6` imports `@fontsource-variable/figtree` and
`@fontsource-variable/crimson-pro`; only Courier Prime, Rajdhani and Chakra Petch are static
`@fontsource/`. **Variable and static are different cost models and different `@font-face`
blocks**, which matters directly to §3's per-face `size-adjust` plan.

**Measured availability for the roster:** variable packages **exist** for Lora (117 KB),
EB Garamond (288 KB) and Source Serif 4 (latin + latin-ext, roman + italic). **They do NOT
exist for Atkinson Hyperlegible or Courier Prime — both 404.**

**So the roster is necessarily mixed-mode, and the loader must handle both forms.** Worth one
line in the brief so a builder does not discover it at the import.

---

## §2 · THE ROSTER — THREE CHANGES

### 2.1 · ⚠ THE ROSTER'S OWN STATED PRIORITY ARGUES AGAINST ONE OF ITS PICKS

§2 sets the constraint plainly: *"a face must read well at prose length, not just look
distinctive; **the audience is ADHD and dyslexic writers** … so legibility outranks taste."*

**By that constraint, EB Garamond is the weakest face on the list.** It is a Garamond revival:
**low x-height, fine strokes, delicate contrast** — beautiful at a book's trim size and print
resolution, and the first thing to go thin and grey at prose size on a screen. It is a face
chosen for taste, which is the axis the design said would lose.

**And it doubles a voice already held.** **Crimson Pro is itself Garamond-descended.** So the
roster spends **two of its slots on adjacent old-style serifs** while leaving the *screen
workhorse* slot to an "optional" row.

**RECOMMENDED — and §1 has already paid for it:**

| role | take | instead of |
|---|---|---|
| serif, default | **Crimson Pro** — unchanged | — |
| serif, warm | **Lora** — drawn for screens, higher x-height, sturdy | — |
| serif, workhorse | **Source Serif 4** — promoted out of "optional" | **EB Garamond** |

**Three genuinely distinct serif voices instead of two adjacent ones and a gap.** *(If Nick
wants a classical face for its own sake, EB Garamond returns as the seventh row rather than as
one of the three serifs — §1 says the bytes are there. This desk's objection is to it
occupying a **core** slot, not to its existing.)*

### 2.2 · COURIER PRIME — KEEP, WITH ONE NOTE FOR THE S0

Keep it on prose pages: it is opt-in, it is the "feel" choice, and a writer who wants the
typewriter should have it. **But it is the extreme case for §3's measure law, not an average
one** — a monospace face changes characters-per-line far more than any proportional face on the
list. **§3's chars-per-line drift measurement should name Courier Prime as its worst case**; a
drift figure averaged across the roster will understate the one face that breaks it.

### 2.3 · FIGTREE AND ATKINSON HYPERLEGIBLE — BOTH KEEP, AND THE PAIRING IS RIGHT

Figtree is the incumbent sans and changes nothing. **Atkinson Hyperlegible is the strongest
principled pick on the roster** — drawn for legibility with deliberately unambiguous
letterforms, which is the property that actually helps the stated audience. It earns its slot.

---

## §3 · OPENDYSLEXIC — THE EXCLUSION IS UPHELD

PLAN DESK excluded it and asked TUTOR to *"say so or overrule this desk."* **Upheld — do not
add it**, and for a better reason than "contested evidence":

**The properties that help a dyslexic reader are high x-height, open apertures, unambiguous
letterforms and generous spacing. Atkinson Hyperlegible was drawn for exactly those and is
already on the roster** — and unlike a dyslexia-specific novelty face, **it also reads well at
prose length**, which is the whole job here. **The roster already answers the need
OpenDyslexic is usually reached for, and answers it better.**

**⚠ AND THE STANDARD THIS DESK HOLDS ITSELF TO APPLIES HERE.** The claim that controlled
studies find no reading-speed or accuracy benefit for OpenDyslexic over ordinary faces is
**craft judgement and recollection — it was NOT measured in this session and this desk does
not assert it as fact.** **If it is going on the record as evidence rather than as a
recommendation, it needs a citation check first.** The *recommendation* stands on the roster
argument above, which needs no literature at all.

---

## §4 · ITALICS — CHECKED, AND ALL SEVEN PASS

**A novelist uses italics constantly** — interior thought, emphasis, titles, foreign words. **A
face without a true italic is disqualifying for prose**, because the browser will synthesise a
slanted roman and it will look exactly like a mistake nobody can find.

**Measured, all seven families:**

| family | italic | roman weights | italic weights |
|---|---|---|---|
| Crimson Pro | **yes** | 200–900 | 200–900 |
| Lora | **yes** | 400–700 | 400–700 |
| EB Garamond | **yes** | 400–800 | 400–800 |
| Figtree | **yes** | 300–900 | 300–900 |
| Atkinson Hyperlegible | **yes** | 400, 700 | 400, 700 |
| Courier Prime | **yes** | 400, 700 | 400, 700 |
| Source Serif 4 | **yes** | 200–900 | 200–900 |

**Nothing on the roster is disqualified**, and every face has the four styles prose needs
(regular, bold, italic, bold italic). **Reported although it is a clean result: a roster that
failed this would have failed silently**, and the check costs one command.

**All seven are OFL-1.1**, which meets the design's open-licence constraint.

---

## §5 · ONE READING OFFERED, NOT A RULING — THE FACE ACROSS MODES

§3 hands up a reading: *a page's face shows in every mode's rendering, but is editable only in
Draft and Revise* — with the rival that **Free Write always renders the machine's own face.**

**This desk holds the ANALOG LAW, so it owes a reading rather than a silence** — *"a typewriter
does not offer you a typeface"*:

**LEAN: PLAN DESK's — the page's face everywhere.** The law's own words govern **what Free
Write OFFERS**, which is a statement about the control, not about the paper. A page that
changed face when the writer switched modes would make them doubt what they would actually get,
and the analog law exists to make the surface *more* trustworthy, not less.

**THE RIVAL IN ITS STRONGEST FORM, because it is genuinely strong:** a typewriter has exactly
one typeface, and that is not a fact about its control panel — it is a fact about the machine.
Rendering Free Write in Lora makes the typewriter a metaphor the app abandons the moment it is
inconvenient, and **this desk has ruled before that the analog law explains forward-only,
strike-not-delete, no paste-in and the deck** — it has not previously been read as governing
only the controls.

**⚠ THE UNMEASURED RISK SITS ON THE LEAN, NOT THE RIVAL:** nobody has asked a writer whether a
page looking different in Free Write reads as a bug. **It is Nick's, and this is a reading
handed up, not a ruling** — the paper is not this desk's subject.

---

## §6 · SUMMARY, AND WHAT THIS DESK DID NOT REVIEW

**CHANGES ASKED:**
1. **Correct the per-style cost** (§1) and **stop letting it cap the roster.**
2. **Promote Source Serif 4 into the set; move EB Garamond out of a core serif slot** (§2.1).
3. **Name Courier Prime as the worst case in the chars-per-line measurement** (§2.2).

**UPHELD:** the OpenDyslexic exclusion (§3) — with its reason restated and its evidence claim
flagged as unverified.

**CLEAN:** italics and licences across all seven (§4); Figtree and Atkinson Hyperlegible
(§2.3); the load-on-choose strategy (§1), which should ship on its own merits.

**NOT REVIEWED — PLAN DESK's:** the Type control's placement and mounting, the four size steps
and their multipliers, the measure-law reconciliation, per-page vs everywhere, the two
adding-routes, board-card faces, storage, and the five questions for Nick.

**NOT THIS DESK'S TO SETTLE:** §5's reading, which is Nick's.

---

*Package facts measured from the published `@fontsource` and `@fontsource-variable` packages in
this session; `main.tsx:5–19` and `apps/desktop/package.json:14–18` read at `e8b7101`. The
typographic judgements in §2 and §3 are craft, and are marked as craft where they could be
mistaken for measurement.*

— the item-84 desk (TUTOR), 2026-09-24
