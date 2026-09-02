# ITEM 84 - THE DRAFT ROSTER . S0 (the Tutor's chip row, Draft)

**Lane:** the item-84 Draft-roster build (the four-chip row in `Talk it through`).
**Worktree:** `.claude/worktrees/item84-roster`, branch `item84-roster`, off
`origin/main` @ `e65eed4` - **never the primary checkout** (item 110, standing).
**Read at:** that SHA, this sitting. Every file:line below was read here; nothing is
carried from memory or from a map.

**Governing records, in the order the lane was told to read them:**
`docs/menus/tutor/item84-draft-roster-build-brief.md` (THE BRIEF) .
`docs/menus/tutor/tutor-menus-lock-record.md` (THE AUTHORITY) . the deck phase as
shipped in `apps/desktop/src/components/Tutor.tsx` + `scripts/harness/item84.mjs`
(THE PREDECE§OR).

**BOX DISCIPLINE.** The FIX lane's wave suite holds the browser. This S0 and the patch
it precedes are **browserless**; the stamped suite runs only once that stamp lands.

---

## (a) THE STRINGS - cross-verified past the brief, to the authority itself

The brief's §2 is the build's string table, and the brief itself warns that a builder
copying from the mockup HTML will ship an overturned string. So the table was not merely
obeyed - it was **byte-compared against the lock record**, and the strings below were
**extracted programmatically from the brief's own table**, never retyped:

| # | string | bytes | lock-record provenance | verdict |
|---|---|---|---|---|
| 1 | `Where does this drag?` | 21 | §4 sweep row, verbatim | **MATCH** |
| 2 | `What's load-bearing here — and what could go?` | 47 | §4 sweep row, verbatim | **MATCH** |
| 3 | `Where does the thread slip?` | 27 | §3, the `**Is**` cell verbatim | **MATCH** |
| 4 | `Look at just this stretch — what's it doing?` | 46 | §4 sweep row, verbatim (gated, TD4) | **MATCH** |

**THE TRAP, checked rather than trusted.** The pre-amendment ask 3, *"Where do I lose
the thread?"*, is **present** in `tutor-menus-mockups-plateau.html` (line 163) and
**present** in `tutor-menus-pass2-draft.md` - the two invalid sources - and **absent**
from the brief's table. Both files stay byte-true (lock record §3's
corrected-not-rewritten practice); neither is read by this build.

**Ask 2's dash is U+2014 EM DASH, 3 bytes** - established by measurement (47 bytes over
45 characters), not by a description. The brief names no codepoint on purpose, and this
S0 names one only as a measurement of the bytes it copied. The strings enter the source
by extraction from the brief at write time, so no retyping step exists in which a dash
could degrade.

## (b) WHERE THE DRAFT ROSTER MOUNTS TODAY - nowhere, and the seam is already cut

The deck phase did the hard part. `TutorProps` already carries `mode?: EditorMode`
(`Tutor.tsx:205`) and the panel already branches on it - `const freeWrite = mode ===
'journal'` (`Tutor.tsx:270`). **The Draft roster needs no new seam**: one sibling
predicate, `mode === 'drafting'`, and one sibling render branch.

| Mount site | mode passed | Draft roster renders? |
|---|---|---|
| `pages/PageEditor.tsx:935` | live `mode` state | **yes**, when the writer is in Draft |
| `components/ScriptEditor.tsx:1112` | hard-coded `"drafting"` | **yes** - see (f) |
| `pages/JournalEntry.tsx:1174` | hard-coded `"journal"` | no (Free Write) |
| `components/BoardEditor.tsx:2399` | none passed | no (no mode at all) |

`EditorMode = 'journal' | 'drafting'` (`ForwardOnlyEditor.tsx:31`) - **there is no
`'revise'` value in the type**, and `ModeStrip.tsx:41` renders the Revise tab
`live: false`. The brief's *"cannot render in Revise (no live surface)"* is therefore
true **by the type**, not merely by a branch - a fact the harness can assert cheaply.

**Mount position** is the deck phase's, unchanged: inside `.wz-tutor-convo`, after the
status lines (`Tutor.tsx:741-742`), immediately above `.wz-tutor-convo-row`
(`Tutor.tsx:784`) - the lock record's *"above the composer, below the messages."*

## (c) THE DISCLOSURE - the one finding that changes the shape of this build

**The brief calls the sentence provisionally binding and says to verify it against its
manifest before use. Verified:** the sentence quoted in brief §3 is **183 bytes**, md5
**`9287082c0e3c0a2b243c71ce01c89b43`** - matching the manifest exactly, once the file's
CRLF is stripped. (The first measurement read 184 bytes and a wrong md5; the carriage
return was the whole difference. Recorded rather than quietly dropped.)

**But the sentence is not in the product.** On disk at `e65eed4`:

- `store/tutorDisclosure.ts:59` - `CURRENT_DISCLOSURE_VERSION = 3`.
- `deskLexicon.ts:657` - the newest body is `tutorDisclosureBodyV3`; there is no V4 id.
- `Tutor.tsx:941` - the modal renders `t('tutorDisclosureBodyV3')`.
- The only `V4` string anywhere in `apps/` is the *instruction to add one*, in
  `tutorDisclosure.ts`'s own header comment.

v3 enumerates three travelers: the question, new writing since last read, and the Bible.
**A selection is none of them** - it can be text the Tutor has already read, or text
outside the delta entirely. So TD4 shipped under a v3 disclosure would put bytes on the
wire that the shown sentence does not name, which brief §6 calls a **stop-and-surface**,
not a build decision.

**IT DOES NOT STOP HERE, because the record already ruled it.** `docs/open-threads.md`:

> line 774 - *"disclosure **v3 -> superseded by v4 in annotation form (v3 standing
> verbatim beneath)**"*
>
> lines 785-790 - *"**CONDITION (1) CLOSED - BOTH DESKS; TD4 / TR3 / BD4 FULLY UNBLOCKED
> FOR BUILD** (Fable, 2026-08-24)."*

So the shape is specified, not invented: **`tutorDisclosureBodyV4` is the 183-byte
sentence, and v3's existing string stands verbatim beneath it - reused as the very same
lexicon id, not copied and not edited**, which is how "verbatim beneath" is made
mechanical rather than promised. `CURRENT_DISCLOSURE_VERSION` goes 3 -> 4, and every
device sees the disclosure exactly once more; `tutorDisclosure.ts`'s integer compare
already handles that with no version-specific branch.

**SURFACED, because it is the one place this build reaches past the brief's literal §1
scope:** shipping the v4 body is not on the brief's scope list. It is required by the
brief's own §6 - TD4 cannot lawfully travel under v3 - and it is the disposition
`open-threads.md` already records. **A collision to name for chat 1:** item 83's BD4
lane mounts on this same sentence; if that lane also bumps the version, the two edits
meet in `deskLexicon.ts` and `tutorDisclosure.ts` and merge by hand. Cheap, and better
named now than discovered at the merge.

## (d) THE WIRE - what TD4 adds, and what asks 1-3 must not

`apiTutorChat` (`store/api.ts:111-130`) posts `{ messages, delta, bible }`. Server-side
(`apps/server/src/tutor.ts`): `isValidBody` at `:81` admits exactly those three;
`MAX_DELTA_CHARS = 17000` (`:68`), `MAX_BIBLE_CHARS = 9000` (`:74`); the bible splices at
`:139` and the delta at `:155`, each as one delimited synthetic user turn ahead of the
writer's own last message.

**TD4 adds ONE key - `selection` - on the same terms**, and the brief's quoted wire
precision governs it: *"`pageText` stays a render prop, never a TD4 wire key."* The
component keeps receiving `pageText` (`Tutor.tsx:182`) and keeps using it for the delta
and the lenses; **the `selection` value is a separate, independently-sourced string.**

**Asks 1-3 add nothing** - brief §4, *"This ticket adds no wire keys."* Mechanically
that means the `selection` key must be **absent** (never an empty string) on every send
TD4 did not arm, exactly as `delta` and `bible` are absent rather than empty.

**THE ARMING MECHANIC, derived from the brief rather than chosen freely.** §4 says *"No
auto-send exists anywhere in this feature"* - *anywhere*, which covers ask 4. So TD4
stages like the other three, and its payload rides the writer's own Send. The three
conditions then fall out:

- **(a) names it on the button** - the chip's own string, *"Look at just this stretch — what's it doing?"*,
  is the naming; *"just this stretch"* is what it sends.
- **(b) sends only that** - the selected stretch, **captured and frozen at the moment of
  the press**. Frozen because it must be: pressing a button collapses the page's DOM
  selection, so a send-time read would send nothing, or something else. No page, no
  surrounding context, no "a little either side."
- **(c) only then** - the armed selection is consumed by exactly one send and cleared,
  and **any press of asks 1-3 clears it**. That is per-press consent applied literally:
  ask 1's button cannot consent for ask 4's wire, so ask 1's press must not inherit ask
  4's payload.

## (e) THE SELECTION - readable without an editor reference, so §5's stop does not fire

Brief §5: *"If the builder finds the selection cannot be read without an editor
reference: stop and surface."* **It can.** The lawful shape §5 itself names - *"a
read-only selection value may reach the component as a prop"* - is available:

- the hosts already own their surfaces (`PageEditor.tsx` renders `.forward-only-editor`
  through `ModeStage`; `ScriptEditor.tsx` renders `.script-sequence`);
- a host-side `selectionchange` listener reads `window.getSelection()` and keeps the text
  **only while both ends of the selection sit inside that surface**;
- the Tutor receives `selectionText?: string` - **a string, not a ref, not a setter.**

**A13 is untouched and stays structurally provable.** `Tutor.tsx`'s header states the
wall as *"receives only `entry`/`project`/`pageText` - never an editor ref, never a
page-text setter"*; the new prop joins that list as another read-only value, and
`tu1.mjs`'s structural walk is unaffected - nothing in this ticket gives the panel a
path onto the paper. The staging of asks 1-3 writes to `composerText`, which is the
Tutor's **own** input, never the page.

## (f) SCREENPLAY - a consequence of "Draft only", named rather than discovered

`ScriptEditor.tsx:1112` passes `mode="drafting"` unconditionally: **a screenplay page is
a Draft page.** The brief's §1 reads *"Draft only - `drafting` is unconditionally
live"* and §8's check reads *"the roster does not render outside Draft."* Screenplay is
not outside Draft, so **the roster renders there too**, and this build threads the
selection to `ScriptEditor` as well as to `PageEditor`.

Threading it to both is not gold-plating; it is what keeps TD4 lawful there. A chip gated
on a value that surface never supplies would be permanently disabled - G3's locked door
wearing paint - whereas the brief's disabled-visible state is explicitly *"a transient
gate on real capability"*. Named for the desk: if the desk intends the Draft roster to be
**prose-only**, that is a one-line change to the predicate and a harness flip, not a
rebuild.

## (g) GEOMETRY - nothing to change, and that is the claim to prove

`DOCK_FLOOR_PX = 120` (`Tutor.tsx:50`) and `USABLE_PANEL_FLOOR_PX = 280` (`Tutor.tsx:57`)
are FX18's and are **not touched**. The chip row lives inside the panel's existing width
and declares no width, no overflow and no measurement of its own, so it cannot reflow the
paper - verified at 1100 and 1366 per house law.

**Visual dialect from the mockups** - a valid source for the visual and an invalid one
for the strings. `tutor-menus-mockups-plateau.html:57-66`: chips are a **column**, not a
wrapped row (`flex-direction:column; gap:6px`), Crimson Pro at 13.5px, left-aligned,
`--olive` left edge, `--brass` on hover, `--brass-press` on press, `opacity:.45` when
disabled. Token map, checked by value: mockup `--olive` `#96a05a` **is** the app's
`--accent-rest` `#96a05a` (`index.css:59`); `--brass`/`--brass-press` are identical
(`index.css:42,44`); mockup `--line` maps to the app's `--ink-border` (`index.css:12`).
The prose face is `var(--font-prose)` (`index.css:209`) - lock record line 6, chip voice,
KEEP CRIMSON.

The Free Write presets (`index.css:3748-3753`) are `var(--font-ui)` and stay so: they are
**labels**, not asks. The Draft chips are the writer's own words and take the prose face.
Two rosters, two dialects, on the record's own distinction.

## (h) THE HARNE§ - `scripts/harness/item84b.mjs`, auto-discovered

`run-suite.mjs:208` reads the whole harness directory, so a new file registers itself;
`item83e.mjs` is the house precedent for a lettered sibling. Fixtures are adopted
verbatim from `item84.mjs` (which adopted them from `tu1`/`tu2`/`sc1`) - the
don't-re-derive-fixtures law. Against brief §8:

1. **byte-exact strings** - all four asserted against the table, ask 3 the named trap,
   and the overturned string asserted **absent** from the DOM.
2. **a press stages and sends nothing** - the composer holds the string, and the
   page-side four-primitive net counter plus the server double's `tutorChatCount`
   (`runtime-verify.mjs:117,186`) both read zero across the whole roster.
3. **TD4's wire, per-button and mechanical** - `lastTutorChatBody`
   (`runtime-verify.mjs:174-185`) must carry `selection` equal to the selected stretch
   **and must not carry the page under any key**, with the page's own text asserted
   **not** to be a substring of the serialized body; and a send armed by asks 1-3 must
   carry **no `selection` key at all**.
4. **mode boundary** - present in Draft, absent in Free Write and on Board, and the Free
   Write roster's own mode branch still holds (the two rosters never co-render).
5. **both reference widths** - 1100 and 1366, paper measure unchanged.

Plus: the disclosure modal renders the 183-byte sentence **byte-exact** with v3's text
standing beneath it, and a v3-acknowledged device is shown v4 exactly once.

## (i) PARK SWEEP - one assertion parks, and it is the deck phase's own

The change is additive on every seam but one. `item84.mjs` asserts, on a page reopened in
Draft:

> *"S6: and that Draft panel carries no roster either - the two halves of the mode branch
> agree"* - `draftRoster.rosterPresent === false`

That check reads `.wz-tutor-fw-roster`, the **Free Write** roster's class. This ticket
adds `.wz-tutor-draft-roster`, a different class, so **the assertion still passes
unchanged** and is not falsified - but its stated meaning ("carries no roster") stops
being true of the Draft panel, and the house law is that a claim which stops meaning what
it says is parked, never quietly reinterpreted. **Disposition: the original stays
verbatim in `item84.mjs`, annotated SUPERSEDED with a pointer to `item84b.mjs`'s own
mode-boundary check, which asserts the true post-ticket state - the Draft panel carries
the Draft roster and never the Free Write one.** No assertion is rewritten in place.

Everything else was grepped and clears: `tu1.mjs`'s A13 walk clicks every button species
in the panel and asserts the page text never changes - the Draft chips join that walk and
pass it, because staging writes to the Tutor's own composer; `fx10.mjs`'s
no-scroll-within-scroll walk reads computed overflow across every panel descendant, and
the chip column declares no overflow; `tu2.mjs`/`tu5.mjs` read `lastTutorChatBody` for
`delta`/`bible` and are unaffected by an **absent** fourth key.

---

## WHAT IS BUILT, AND WHAT IS NOT

**Built:** the four-chip Draft roster; staging for all four; TD4's frozen selection, its
one wire key, its disabled-visible gate; the v4 disclosure in annotation form; the
selection thread on both Draft surfaces; `item84b.mjs`.

**Not built, by the brief's own §1:** the Free Write roster's redesign beyond the deck
phase, anything in Revise, the error lens (T1-T7, parked), TD5's lens default. **Not
resolved, by §9:** the shared-row label collision - Draft ships its own string and the
reconciliation waits for Revise to exist.

**No deploy.** Nothing ships without Nick's word.

- the item-84 Draft-roster build lane, 2026-09-02
