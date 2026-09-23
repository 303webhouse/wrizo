# ITEM 84 · THE CHECKER REPORT AND THE CLAIM-CHECK TIERS
### Authored 2026-09-22 by the item-84 desk (TUTOR) · answering Nick's rulings of 2026-09-22
**STATUS: REPORT + DESIGN — for Nick's word.**
**Nick's question and rulings, verbatim:**

> So the Experts want the app to be able to fact-check claims being made in the text? This
> would have to be an AI-connected feature, right? Because the grammar/spellcheck
> "error-checking" is something that should be hard-coded into the app (or pulled from a
> reliably available open source repo of some kind). I agree that the app should not notice
> a writer is stuck or make suggestions unprompted.

Ruled with it: **(1)** grammar and spelling are **never AI**; **(2)** no stall detector;
**(3)** claim-checking is **three tiers**, of which two need no AI and are this desk's to
design; **anchors are now SPANS**; page-specific sources live in the **new right rail**.

**WHAT THIS DESK READ.** `wrizo-three-writers.html` (read); Nick's sketch — *WRIZO (in
abstract)* — read as `wrizo-sketch-for-light-theme.png`; the ledger and `apps/` at
`origin/main`, 2026-09-22.
**⚠ WHAT IT COULD NOT READ: `wrizo-page-first.html` IS NOT IN `Downloads`.** That is the
one the relay named as showing *"the Tutor panel already shows your checks"* — the single
most direct check on this desk's strip design. **Reporting short on that check rather than
guessing at it.** §6 says what was checked against what.

---

## §1 · WHAT T1–T7'S CHECKER USES TODAY — the honest answer, in three parts

### 1 · T1–T7's checker does not exist

No dependency, no module, no code. `apps/desktop/package.json` and the root manifest carry
**no spelling or grammar library of any kind**, and T1–T7 are parked behind the Revise
surface. There is nothing to audit for AI because there is nothing built.

### 2 · The specification already forbids AI — so Nick's ruling is the standing spec, confirmed

RS7 of the ratified Revise charter, **verbatim on disk**, carrying T1's surviving matter:

> the **local-only checker filter** — a hosted grammar service would send the page to a
> third party no disclosure sentence names

**Nick's ruling (1) is therefore not a change of direction. It is the existing
specification, now founder-ruled** — which is the cleanest possible answer to his question.
The reasoning already on record is his own reasoning: a checker that phones out is a
disclosure breach, not merely a performance choice.

### 3 · BUT THE APP IS ALREADY SPELLCHECKING TODAY — with the browser's own, inconsistently

This is the part a summary would have missed, and it is the real answer to *"what does it
use today."* Wrizo currently relies on the **platform's native spellchecker**, and it does
so **differently on different surfaces**:

| Surface | Setting | Effect |
|---|---|---|
| `ForwardOnlyEditor.tsx:652` | `spellCheck={false}` | Free Write's editor: **off** |
| `JournalEntry.tsx:835` | `spellCheck` *(bare — true)* | the Journal: **on** |

**Three consequences worth Nick's attention:**

**(a) It is not AI, and that is lucky rather than designed.** A browser's built-in
spellcheck is local dictionary matching — the same Hunspell lineage named in §2. Nobody
chose it for that reason; it is simply what a `contenteditable` does by default.

**(b) There is a disclosure-shaped hazard in it that Wrizo does not control.** Chromium
browsers offer an *enhanced* spellcheck mode which sends typed text to the vendor's
servers for checking. It is a browser-level setting, opt-in, **outside the app's reach** —
but if a writer has it on, their prose leaves the desk and **no Wrizo sentence names
that.** This desk does not assert the current mechanics of a third-party browser as fact;
**it flags it as something T1's S0 must verify and Nick may want an answer to**, because
the arc's whole disclosure discipline assumes it knows what leaves.

**(c) The inconsistency is itself a finding.** Free Write disabling spellcheck is
*correct and consonant with the analog law* — a typewriter does not underline your
spelling. The Journal having it on is defensible as capture. But nobody ruled it, and when
T1 lands a bundled checker there will be **two checkers on one surface** unless the native
one is deliberately turned off wherever the app's own runs. **A double underline from two
engines is exactly the noise that gets a feature switched off.**

---

## §2 · OPEN-SOURCE CANDIDATES — named, with what must be measured rather than believed

Nick asked for a replacement *"if any part leans on a model."* **No part does**, so this is
not a replacement list — it is the shortlist T1's S0 should measure. Named because he asked
for names.

**SPELLING — Hunspell.** The de-facto standard, used across the major open-source office
and browser lineages. Dictionary + affix rules, **not a model**, per-language dictionary
files, fully offline. Usable from a desktop app through WASM or native bindings.

**GRAMMAR — LanguageTool.** The only serious open-source grammar engine. **Rule-based, not
a model**, self-hostable and runnable offline. Java, which is a real packaging question for
a desktop app and belongs in the S0 rather than in a design document.

**LIGHTER JS — the `retext` family.** Modular, small, JavaScript-native. **Note the
taxonomy bar:** much of what this family offers is *style* — wordiness, passive voice,
weak verbs — and RS7 **drops** style, tone, wordiness and passive voice *"dropped, not
disabled."* A lighter library is not a licence to widen the taxonomy.

### What this desk will not hand over, and why

**Sizes, language counts and licence terms are deliberately absent above.** They change
between releases, this desk's knowledge has a cutoff, and the lane's own standing law is
that **disk wins and measurements are measured**. A number quoted here would be believed
and might be wrong.

**T1's S0 measures, and should measure four things rather than two:**
1. **Bundle weight**, with and without optional data — LanguageTool's n-gram data is the
   known heavy component, and *offline durability is a stated app commitment*, so a bundle
   that only works online has failed a requirement rather than made a trade.
2. **Languages actually shipped**, not languages supported upstream.
3. **Licence compatibility with a shipped desktop app** — a real gate, and the one most
   often discovered late.
4. **What its default rule set flags that Wrizo does not want flagged** — RS7's existing
   requirement, and the reason a lighter library is not automatically the better one.

---

## §3 · NO STALL DETECTOR — RULED, AND THE DESK'S RECOMMENDATION STANDS

Nick: *"I agree that the app should not notice a writer is stuck or make suggestions
unprompted."* Recorded as ruled. The recommendation this desk made against it stands, and
the reasoning is now founder-backed rather than merely argued: FX15 retired the unbidden
first-line invite for the same reason, and a stall detector is that offer with a trigger
attached.

---

## §4 · THE THREE TIERS

### TIER 1 · "HAS A SOURCE" — and it is not a checker at all

**This is the finding that makes claim-checking cheap.** Tier 1 performs **no text
analysis whatsoever**. It is a completeness report over anchors: *which claim-spans carry
an anchor that points at a source, and which do not.* No dictionary, no rules, no engine,
no model.

**Consequences:**
- It needs **none of T1's checker** and can ship without it.
- It is **the cheapest useful automation in the entire proposal**, and the one that most
  directly answers the Features Writer's deepest need.
- Its only dependency is **Records** — a source must exist to be pointed at. It is gated
  on PLAN DESK's primitive and on nothing else.

**What it renders** (converging with `three-writers`, see §6): a count — *"4 of 7 claims
have a source"* — and, on the page, the unsourced spans marked. **One counted line**, which
is the ceiling this desk proposed for automation in the strip.

### TIER 2 · "MATCHES THE SOURCE WORD FOR WORD" — trivial mechanically, and it has one hard craft problem

**Mechanically:** compare the quoted span's text against the source's stored text. String
comparison. No AI, no engine beyond a diff.

**The craft problem, and it decides whether tier 2 is trusted or switched off in a day:**
**a quote that differs from its source is not necessarily wrong.** Working writers
lawfully and constantly —

- **elide** with an ellipsis,
- **bracket** for grammar or clarity, *"[the mayor] said"*,
- **trim** leading and trailing words,
- **change case** at the start of a sentence.

**A checker that flags every ellipsis is noise, and noise gets turned off.** So tier 2 must
report **four states, not two**:

| State | Meaning | Raised? |
|---|---|---|
| **Identical** | matches after whitespace normalisation | no |
| **Differs by editorial marks only** | ellipsis, brackets, trimmed ends, initial case | **shown quietly, not flagged** |
| **Differs in words** | the quote says something the source does not | **YES — this is the misquote** |
| **Cannot compare** | the source has no stored text (an untranscribed PDF, audio) | **YES, as "not checked"** |

**The fourth state is not padding.** A check that reports *pass* because it could not look
is worse than no check — the lane has already paid for that lesson once, and *"a guard can
pass while blind"* is standing law. Tier 2 must say **"cannot compare"** out loud.

**The third state is the whole point of tier 2.** The Features Writer's own words in the
committees' report: *"Copying one is exactly how a misquote gets published."* Tier 2 is
the check that catches it, and it needs no intelligence at all — only honesty about the
other three states.

### TIER 3 · "IS IT TRUE" — recorded, not designed

Waits until Nick asks for it by name. **And the boundary he drew is well-drawn, which is
worth saying plainly:** tiers 1 and 2 are about **the writer's own bookkeeping** — did you
attach a source, does your quote match the source you attached. They are answerable from
material the writer already has. Tier 3 is about **the world**, and the app cannot answer
it without sending the claim somewhere. **The line between tiers 2 and 3 is exactly the
line between local and not** — which is why it is the right place for the boundary and not
merely a convenient one.

---

## §5 · SPANS — THE RULING FITS THE EXISTING FLAG LAW EXACTLY, AND CORRECTS THE MOCKUP

**Anchors are spans now**, so a claim and a quote are highlighted ranges.

**The convergence, and it is a good one:** TRR14's build-binding flag law already says it,
in these words — *"a flag may only wrap existing characters in a span and add
nothing."* A span-anchored claim
**is** a wrapping span. So **the anchor and the mark are the same mechanism**, and
claim-checking inherits the error lens's decoration seam with no new machinery —
`decorateEditorFor`'s decorator override, already proven by three consumers.

### ⚠ A correction to `three-writers`, and it is a build-breaker if copied literally

The mockup renders a claim's marker as an **inserted element carrying text**:

> `<span class="mark need">Claim<br>no source</span>`

**In a mockup this is fine. In the build it is precisely the forbidden shape.** TRR14's law
exists because **stored text is derived from the DOM's rendered text**, so injected
characters are silently absorbed into the writer's prose on the next keystroke. The words
*"Claim / no source"* would end up **in the manuscript**.

**The lawful build:** the span carries **CSS only** — underline weight, ground tint, edge —
and **the words live in the panel**, never in the paper. Same information, no inserted
characters. This is not a quibble about a mockup; it is the one place a faithful
implementation of the mockup would corrupt a writer's text.

**One more thing spans change:** the count. *"N of M claims"* now counts **spans**, and a
single paragraph may hold several claims — which is the point of the ruling and makes the
count more truthful, not merely finer.

---

## §6 · CHECKED AGAINST WHAT WAS AVAILABLE

### Nick's sketch — *WRIZO (in abstract)* — confirms the division, and adds a third feeder

The sketch draws **FEEDBACK as one loop with three feeders: Automated · AI Tutor ·
Workshops**, with double arrows to both **PAGE** and **TEXT**.

- **Automation and the Tutor are siblings inside one loop** — not one containing the
  other. That is exactly this desk's proposal: *automation finds, the Tutor explains.*
  **Confirmed by his own hand.**
- **It names a third feeder this desk had not accounted for: WORKSHOPS.** Workshop mode is
  currently deferred, and the sketch says it eventually joins the same loop. **The strip's
  ceiling arithmetic should be done knowing there is a third tenant coming**, rather than
  discovering it when Workshop lands.
- **FEEDBACK attaches to both PAGE and TEXT** — page-level and text-level. Under the span
  ruling those are exactly tier 1's page-level count and tier 2's span-level check.
- **"Quoted" is one of TEXT's three kinds** (Quoted · Unique · Ink). A quotation is
  **categorically different text** in Nick's own model — which supports treating a quote
  span as a first-class object rather than decorated prose, and supports tier 2 existing
  at all.
- **FINAL DRAFT is labelled "Error free"** — error-checking sits on the path to the final
  draft, consonant with the mode boundary putting it in Revise.

### `wrizo-three-writers.html` — converges with the strip proposal in two places

Its `Check claims` control is a **switch** (*"Show which claims have a source"*) with a
**count line** (*"N of M claims have a source"*). Both converge with what this desk
proposed independently: the count line is §4's *one counted line, at most*; the switch is
T7's per-class settings. **Its provenance fields — Who · Terms · When · Where — are the
Features Writer's need answered exactly.**

**Two deltas, both now ruled in the mockup's disfavour:** it works at **paragraph**
granularity (superseded by the span ruling), and its marker **inserts text** (§5).

### What was not checked

**`wrizo-page-first.html` is absent from `Downloads`.** The relay named it as the one
showing the Tutor panel already carrying these checks — the most direct test of this
desk's strip design, and the one thing that could have corrected the layout rather than
the mechanism. **Not guessed at. Send it and this desk will check the strip against it and
report the deltas.**

---

## §7 · OPEN

- **`wrizo-page-first.html`** — the strip check that could not be run.
- **Workshops as the loop's third feeder** — ceiling arithmetic for the strip.
- **Records** gate tier 1 entirely; there is nothing to point at until they exist.
- **The native spellchecker** — whether it is turned off wherever the app's own runs, and
  whether the browser's enhanced mode is a disclosure question Nick wants answered.
- **T1's S0 measurements** — weight, languages, licence, and default-rule-set inventory.

---

*Tier 3 is recorded and not designed, per Nick's word. Tiers 1 and 2 above are this desk's
design and await his. The strip proposal of 2026-09-22 stands except where §5 corrects the
mockup's marker and §6 adds Workshops to the ceiling.*

— the item-84 desk (TUTOR), 2026-09-22
