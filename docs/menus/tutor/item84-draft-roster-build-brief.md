# ITEM 84 · BUILD BRIEF — THE DRAFT ROSTER (the Tutor's chip row)
### Build-ready · authored 2026-08-25 by the item-84 design desk · for a BUILDER lane
**WORKTREE: named by the builder lane's own assignment, and NEVER the primary
checkout** (item 110, standing). This brief is docs-authored; the build touches
`apps/` and therefore belongs to a builder lane, not to the design lane that wrote it.

**STRINGS OF RECORD.** Per the lock record's own rule: *"The lock record governs the
final ask strings. Build tickets take their strings from this document, never from the
pass files or the mockup HTML."* Every string below is taken from
`docs/menus/tutor/tutor-menus-lock-record.md` @ main, read 2026-08-25T20:5xZ. Pass 2 and
the mockups still carry a pre-amendment string **by design** — they are the record of
what was argued and what Nick looked at — and must not be used as a source. **A builder
copying from the mockup HTML will ship an overturned string.**

---

## §1 · SCOPE

Ship the **Draft roster**: a four-chip row inside the Tutor's `Talk it through` section,
above the composer, below the messages. Draft only — `drafting` is unconditionally live.

**Not in this ticket:** the Free Write roster (line 1's redesign; its three original asks
are struck), Revise anything (no live surface — see `item84-revise-finding-replan.md`),
the error lens (T1–T7, parked), TD5's lens-default change if it is separately ticketed.

## §2 · THE FOUR STRINGS — verbatim, from the lock record

| # | string | state |
|---|---|---|
| 1 | `Where does this drag?` | live |
| 2 | `What's load-bearing here — and what could go?` | live |
| 3 | `Where does the thread slip?` | live — **amended at lock** |
| 4 | `Look at just this stretch — what's it doing?` | **TD4, gated — see §4** |

**Ask 3 is the trap.** It reads *"Where do I lose the thread?"* in Pass 2 and in the
mockup HTML. It was amended under the voice law and **the amended form is the only
lawful string.** Copy from this table.

Punctuation is part of the string, including the em dash in ask 2. Copy the bytes from
the table itself rather than retyping them — no codepoint is named here on purpose, so
that the table stays the single source and no second description can go stale against
it.

## §3 · THE STANDING LAWS THIS BUILD OBEYS

**THE VOICE LAW** — *ask language is impersonal: phrased at the work, never at the
writer.* Binding on every roster present and future. All four strings above are already
clean; any string a builder finds itself rewording has left the record.

**THE BUTTON LAW** — *a counsel's button names what its own press sends.* Per-press
consent: one chip's naming cannot consent for another chip's wire. The harness
obligation is mechanical and per-button: **each gated counsel asserts that its wire
carries exactly what its button names, nothing more.**

**THE DISCLOSURE SENTENCE** — v4 candidate B, ratified 2026-08-17, provisionally
binding, committed at `1ef1659` in `docs/wrizo-alpha/disclosure-v4-committee-fable.md`.
**1 sentence · 183 bytes · md5 `9287082c0e3c0a2b243c71ce01c89b43`.** Verify against that
manifest before use. The sentence:

> Nothing leaves your desk unasked: an ask sends your words, this page's recent changes, and your Bible; a counsel that reads more names it on the button and sends only that, only then.

Its three testable conditions: **(a)** names it on the button · **(b)** sends only that ·
**(c)** only then.

## §4 · ASKS 1–3 — THE MECHANIC

**Staging, not sending.** A chip press loads its string into the composer as editable
text, cursor placed in it. **Nothing goes on the wire on a chip press.** The writer
edits if they wish and presses **Send**, which is the existing, unchanged send path.

- No auto-send exists anywhere in this feature.
- Staged text arrives **visibly editable** — cursor in the text, never styled as final.
- Staging is instant: no typewriter effect, no animation into the composer.
- Chips render with the panel and never animate in. Fixed order, no reshuffling between
  visits — re-scanning is the tax the cognition bench named.
- The wire for asks 1–3 is **unchanged from today**: question + existing delta + Bible,
  exactly as `send()` already assembles them. **This ticket adds no wire keys.**

Because asks 1–3 put no new bytes on the wire, they are covered by the disclosure as it
already stands and **need no new button naming.**

## §5 · ASK 4 (TD4) — GATED, AND THE WIRE PRECISION THAT GOVERNS IT

Ask 4 is the selection ask. It is **confirmed** from the 84 side (lock record §10,
condition 1) and it is the one chip that adds a payload.

**THE WIRE PRECISION, quoted from the record because it is the thing most likely to be
got wrong:**

> **TD4 — the wire adds the SELECTION ONLY.** `pageText` stays a **render prop, never a
> TD4 wire key.** The pass's phrase *"traveling beside `pageText`"* describes props and
> must not be read as the wire; a TD4 wire carrying the page would send more than its
> button names and fail its own harness obligation.

So: the component may **receive** `pageText` as a prop, as it does today. TD4's request
body carries **the selected stretch and nothing more** — no page, no surrounding
context, no "a little either side for context." The harness asserts this mechanically.

**Its button must name what it sends** (condition (a)), and its wire must carry only
that (condition (b)), only on its own press (condition (c)).

**Activation:** the chip is **disabled-visible without a selection** — it holds its slot
rather than appearing and vanishing, because its gate flips by the second and layout
stability outranks purity of absence for that case. This is the one lawful
disabled-visible chip in the roster.

**If the builder finds the selection cannot be read without an editor reference:** stop
and surface. A13 is architectural — the Tutor component holds no editor ref and no text
setter, and `tu1.mjs` asserts it structurally. A read-only selection value may reach the
component as a prop; a reference to the editor may not.

## §6 · THE WALLS

- **A13:** nothing this ticket adds may route a byte of Tutor output onto a writing
  surface. No editor reference, no text setter. `tu1.mjs` stays green.
- **Nothing fires on load.** `assembleTutorDelta` keeps its single call site inside
  `send()`. A chip press is not a send.
- **Mode boundary:** the roster renders in Draft. It does not render in Free Write
  (whose roster is separately redesigned) and cannot render in Revise (no live surface).
- **The disclosure is not spent.** If any implementation detail would put bytes on the
  wire that the sentence does not name, that is a stop-and-surface, not a design
  decision to make in the build.

## §7 · GEOMETRY AND THEME

The panel's geometry is FX18's and is not touched: natural open width ≈300px, the
`USABLE_PANEL_FLOOR_PX = 280` overlay regime, `DOCK_FLOOR_PX = 120`. **Paper never
reflows for chrome** — the chip row lives inside the panel's existing width and changes
no measurement. Verify at both reference widths (1100 and 1366) per house law.

Plateau tokens as rendered in the mockups: chips carry `--olive` at rest, `--brass` on
hover, `--brass-press` on press; chip text is the prose face (Crimson Pro) — a chip
becomes the writer's own words. **The mockup HTML is a valid source for the visual
dialect and an invalid source for the strings** (§2).

## §8 · HARNESS

Per house law the ticket carries its own checks. At minimum:
1. The four strings are asserted **byte-exact against §2**, ask 3 included. This check
   exists specifically to catch a copy from the pass file or the mockup.
2. A chip press stages into the composer and **puts nothing on the wire** — asserted, not
   assumed.
3. TD4's request body carries the selection and **no page text** — the per-button
   obligation, mechanical.
4. The roster does not render outside Draft.
5. Both reference widths render without the panel changing the paper's measure.

## §9 · WHAT THE BUILDER SHOULD SURFACE RATHER THAN DECIDE

The shared-row label collision is **routed to the Revise re-pass and is not this
ticket's to resolve**: Draft's ask 4 reads *"Look at just this stretch — what's it
doing?"*, Revise's TR3 names the same row *"What work is this stretch doing?"*, and the
inherited constraint is *one shared row carries ONE string; divergent surfaces are two
rows with two namings.* Draft ships its own string; the reconciliation happens when
Revise exists.

---

## §10 · APPENDIX — THE STRAY T1 S0 BRIEF, RULED

*Blob `484e7221`, preserved at `scratchpad/stray-wip-item110/`, restored untracked.*
It is this desk's own T1 S0 brief, authored and presented in chat 2026-08-25 and
**never relayed** — the item-110 pattern again. **Ruling: it does not land, and it is
not restored.** Fable's T0-becomes-item-112 ruling supersedes its §1 ordering, and the
Revise-finding record already states that it is superseded before landing.

**What survives, and travels into item 112's charter rather than into any build:**
its §2 adoption ruling (a third-party checker now, in-house narrow checker as recorded
future work) **and its hard filter — the checker must run LOCALLY**, because a hosted
grammar service would send the page to a third party that no disclosure sentence names;
its §3 five-class taxonomy (spelling, agreement, punctuation, **fragments** — named
separately because it is the class Nick called turn-off-able — and usage) with style,
tone, wordiness and passive voice **dropped, not disabled**; its §5 harness requirement
that the **false-flag baseline on invented proper nouns be measured before the
vocabulary escape exists**; and its §6 point that the adopted checker's rule-set
inventory is the specification the in-house replacement will one day be written against.

**What dies:** its §1 routing check as a *first act* — answered already, and its premise
that T1 is independent, which the Revise finding voided.

---

*Job two — the full-Revise charter (item 112) — follows as its own committee pass, with
item 83's geometry laws, DR7-as-narrowed, and the mirrored-hands ruling (119) as binding
inputs, and the parked error lens as the surface's first tenant.*

— the item-84 desk, 2026-08-25
