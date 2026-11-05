# Open threads — the studio ledger · 2026-07-12

**Place at:** `docs/open-threads.md`. Update on close; anything that must
outlive a session lives here, not in chat.

**#13 step 3:** open items only. Closed sections moved verbatim, by month: [2026-07](ledger/2026-07.md) · [2026-08](ledger/2026-08.md) · [2026-09](ledger/2026-09.md) · [2026-10](ledger/2026-10.md) · [2026-11](ledger/2026-11.md). <!-- c13-3 -->

## ITEM 96 — THE PLACES MODEL (charter — post-vacation committee pass)

**Founding text — Nick's sitting sentence, verbatim:** *"it's almost incomprehensible where
any of the documents/pages are stored."* **MANDATE: one comprehensible answer to "where is my
page," taught by the interface itself.** Item **93** (the pairing model) folds in as its FIRST
question; **88c** (binder rendering in Drawers) and **S13** (cards vs pages) route HERE
alongside the menus arc — seams coordinated through Nick. Post-vacation committee pass; no
build under the freeze. Registry: next free **97**.
**→ CHARTER PROVING ITSELF (live-test sitting #2, 2026-08-17):** the Screenplay door
(Draft → tool panel → Structure) was UNDISCOVERABLE from Free Write — Nick's session never
reached the script surface. The exact "where is my room, how do I get there" gap this item exists
to close, now with a live-test witness. See the LIVE-TEST SITTING #2 section above.

## ITEM 100 — THE CDP PORT-FILE RACE (harness-infra) — OPENS 2026-08-17

**OPENS on Fable's ruling, from the SC-chain lane's fix (b) verification.** A harness run can
die **before any check executes**, in ~2s, with
`EBUSY: resource busy or locked, open '…\ws-runtime-verify-<pid>\DevToolsActivePort'`.
**MECHANISM, read in the source rather than inferred:** `readCdpPort`
(`scripts/runtime-verify.mjs:281-289`) polls the port file in a 100-iteration loop, but the loop
body is `if (existsSync(portFile)) { readFileSync(...) }` with **no `try`/`catch`** — so a read
landing in the window where the browser has CREATED the file but still holds it **throws out of
the poll loop instead of polling again**. The retry machinery is already there; the exception
escapes it.
**IT IS A DIFFERENT SPECIES FROM DF1.1's, and conflating them would re-spend that diagnosis.**
DF1.1's stale-profile-dir root cause is a fresh process finding an **OLD** port file (dead port,
`pageWsUrl` then polls nothing — cured by `removeDir(udd)` before launch, which is present and
working). This is a **FRESH** dir whose file is **mid-write**. Same symptom class (dies before
app load, reads like contention), opposite cause, and it reproduces on a quiet box — this
sighting was on a machine verified quiet, with `removeDir` in the tree.
**CURE: one line** — wrap the read (or the loop body) so a failed read continues the poll rather
than throwing. **Deliberately NOT taken by the finding lane:** `runtime-verify.mjs` is shared
infra used by all 55 harnesses, and patching it *mid-verification* would have made that lane's
own stamped pair unfalsifiable — the exact defect 77(c) closed. **Left unfixed and unclaimed for
the harness floor's owner, post-verification**, per Fable's ruling.
**RARITY, measured not guessed:** 1 occurrence in 38 standalone `j5` runs plus four full sweeps
(≈220 harness launches) on 2026-08-17 — no recurrence after the first. Fix-class, harness-only,
zero product surface. Sibling of item 99 (both are harness-floor robustness); **not** a member of
item 82's family — it produces a *boot crash with a stack*, never a check verdict, so it cannot
be a hidden explanation for any of that item's reds. Registry: next free **101**.

## LIVE-TEST SITTING #2 (partial) — 2026-08-17 (Nick; relayed by Fable) — items 101–103 open

Full log: `docs/wrizo-alpha/sitting-log-2026-08-17.md`. **PARTIAL — Nick's session never reached
the script surface:** the **Screenplay door (Draft → tool panel → Structure) is UNDISCOVERABLE
from Free Write.** Logged two ways: as **item 96's charter (the Places Model) proving itself** —
the exact "where is my room" comprehension gap it exists to close — and as **weight to item 87's
ship**, because a Draft-default would have *opened the door* (the session would begin in the room
the Screenplay door lives in). **Section-A retest is OWED, via the Draft → Structure path.**
**→ IN PROGRESS (2026-08-17):** now running on the TRUE script surface (reachable via F5 after the
kind-switch, per item 104's diagnosis — the surface works; only the live remount is the defect).
**→ SECTION A COMPLETE (Nick, live, 2026-08-17 — the Clock's first founder session).** CONFIRMED:
block grammar · sheet sequence · page-top alignment · caret-across-the-break · scene + dialogue
travel rules. Two rulings closed item 62's OBS pair (R-PERIOD → keep the period; R-BREATHING →
zero breathing room ratified — see item 62's close-out). Two new defects opened from the true
surface: **item 105** (page-boundary presentation) and **item 106** (empty-region caret clicks).

**New items:**
- **101 — Page panel's New Page appeared to do nothing.** **Repro PENDING** (possibly clicked
  from an already-unborn page — nothing to birth). Confirm the reproduction before attributing.
- **102 — the prose input model.** Enter-feels-dead-until-doubled · first-keystroke line drop ·
  Tab escapes to browser chrome · "double-spaced" feel. **Nick's verdicts, attached:** the
  paragraph-gap is **NOT** the default; **Tab indents.**
- **103 — the typewriter fade band.** Nick's **five-line graduated spec, top and bottom.** **The
  verbatim five lines are NOT in this relay — recorded as OWED**; they attach verbatim and are the
  authority (nothing here reconstructs them).
  **→ ATTACHED 2026-08-17 (verbatim, from Nick's screenshots on file at Fable's desk):** *"I think
  the fade-out needs to be longer, probably --- let's say 5 lines, with the top line of the page
  (no matter what the text there says or whether or not there are line breaks, etc.) being almost
  nearly invisible while each line below is slightly more visible. Also, the same five line fade
  should happen at the bottom of the page when a user scrolls up. The effect should be (when in
  typewriter mode only, obviously) that the writer's focus is always on a central set of lines
  near the center of the page, roughly a paragraph length, while the rest of the text fades out
  into the past. The idea is to continually propel the writer forward so they don't get locked in
  to constant revision and overthinking."*

**Item 86 RECHARTERS → "the prose page — size AND pagination."** Nick expected prose to paginate
(as the script now does); was S2/86 "page size (ruled post-vacation)", now covers size AND
pagination. **Committee pass on Nick's word.**

**M-arc note:** ground legibility at high counts is the open concern; **the flare verdict is
POSITIVE — in Nick's own words** (verbatim quote owed if wanted, not reconstructed here).
**→ ATTACHED 2026-08-17 (verbatim, from Nick's screenshots on file at Fable's desk):** *"I did
notice a few lines ago that the rhizomatic progress bar at the bottom of the screen (which at
this point just looks like a bunch of scribbling) lit up orange briefly. That effect was nicely
done and did give me a hit of dopamine that seems to have propelled me to continue writing as I
continue to produce words at a fast rate despite just doing this review and needing to fill up
space to test the new page feature."* **One quote, two ledger lines:** the tail carries the
legibility finding *inside* the praise — *"just looks like a bunch of scribbling"* is the
ground-legibility-at-high-counts concern, stated in the same breath as the POSITIVE flare verdict.

Registry: next free **104**.

## ITEM 105 — THE PAGE-BOUNDARY PRESENTATION CLUSTER — OPENS 2026-08-17

**OPENS (Nick, live, Section A — the Clock's first founder session).** Two LAWFUL pagination
behaviours (item 62's rules) **read as DEFECTS to a writer** at a page boundary:
- the **active-element whole-render exception** presents as **"off-page text"** — the active
  element renders whole, so it can extend past the page edge;
- the **non-splittable move-whole** presents as an **"undeletable gap"** — an element that moves
  whole to the next page leaves an apparent gap that reads as un-removable.
Both are correct by the paginator's rules; the *presentation* is what misleads. **Nick's
discriminator result is PENDING** — the measurement that rules out a genuine arithmetic defect
underneath; **do not attribute until it lands.** **Fix family: presentation / signaling of lawful
pagination** — the boundary must SHOW what it is doing (the active-element exception, the
move-whole) rather than let the writer read it as broken. Not a paginator-arithmetic change unless
the discriminator says otherwise.
**→ DISCRIMINATOR RESOLVED (Nick, follow-up, 2026-08-17): NARROWS to presentation / signaling
ONLY.** The boundary mechanics WORK when writing forward — there is no genuine arithmetic defect
underneath. The "gap" and "off-page" reads were the active-element whole-render exception PLUS the
no-cross-block-selection finding (item 107, below). Item 105 is confirmed a **presentation /
signaling** ticket, not an arithmetic one.
Registry: next free **106**.

## ITEM 106 — CARET PLACEMENT ON EMPTY-REGION CLICKS — OPENS 2026-08-17

**OPENS (Nick, live, Section A).** Clicks on **elements** activate correctly; clicks on **empty
sheet space no-op** — the caret does not move there, and subsequent typing lands at the (now
hidden) caret's prior position rather than where the writer clicked. **Nick's verdict, verbatim
(from his screenshot, on file at Fable's desk):** *"the caret needs to move to wherever I click on
the document."* Registry: next free **107**.

## ITEM 107 — NO CROSS-BLOCK SELECTION / BULK DELETION ON THE SCRIPT SURFACE (architecture) — OPENS 2026-08-17

**OPENS (Nick, live, Section A).** Cross-block selection and bulk deletion **do not exist** on the
script surface: **one live element at a time** is the architecture — the exact class the caret fix
**explicitly declined to dissolve** ("non-collapsed selection … those need the class dissolved, not
the symptom closed," `docs/wrizo-alpha/sc2-review-fable.md`). **Nick's verdict:** fine moving
forward, but *"clunky if the writer wants to remove blocks of dialogue at one time."*
**ARCHITECTURE-CLASS, POST-VACATION** — dissolving the one-element-at-a-time class is a real
change, not a quick fix. The **DESIGN half — block-select / delete / move as EXPLICIT operations —
routes to the MENUS ARC**: block operations are natural tool-menu citizens. This finding is also
part of what item 105's "undeletable gap" read reflected — there is no bulk delete to remove it.
Registry: next free **108**.

## ITEM 109 — THE COVERAGE GAP: NO GATE FOR A COLD DIRECT LOAD OF #/page/new — OPENS 2026-08-24
History of ITEM 109: [2026-08](ledger/2026-08.md) <!-- c13-3 -->

**→ CONVERGED — SAME ITEM as the fix lane's "ITEM 109 — THE VANISHED-SUBJECT COVERAGE GAP" above
(reconciled at the hotfix merge, 2026-08-24).** Two lanes opened item 109 in parallel for the same
coverage gap; the fix lane's **vanished-subject framing is CANONICAL** — it matches Fable's refined
charter (the gate is "entry vanishes under a mounted surface," not a cold load). This section is
chat 1's first read, kept as history. **ONE item 109; registry next free 110** (both records name
the same pointer — the two markers are not two items).

**OPENS (from item 104's production crash).** The doorway ship crashed the New Page door on mount
in production, and **59/59 both settings + a GREEN review both missed it** — because **no gate
drives a COLD DIRECT LOAD of `#/page/new`** (the harnesses reach the door through navigation, never
a fresh mount at that URL, which is where the hooks-order violation fires). The escape is the gap,
not the check: a defect that only manifests on cold direct load has no instrument. **The fix lane's
S0 answer completes this charter** — the S0 defines the gate that would have caught it (a cold
direct-load harness for `#/page/new`, and the class of URLs that mount a component with early
returns). Harness-infra, fix-class; sibling to item 99 / item 100 (harness-floor robustness).
**→ CHARTER UPDATED (Fable, 2026-08-24): the gate is "ENTRY VANISHES UNDER A MOUNTED SURFACE," NOT
cold loads.** The true live exposure is a **two-device tombstone** — a page deleted on another
device while it is open here, so its backing entry disappears out from under the mounted surface
and the below-guard hooks fire on the re-render. The header above ("cold direct load of
`#/page/new`") was the first read; the gate the fix lane's S0 must build is **a mounted surface
whose backing entry vanishes** — the broader class of which the cold-load case is one instance.
**→ SHARPEST INSTANCE (Fable, 2026-08-25): no gate drives `#/page/new` HEADFULLY.** Three ships —
doorway, hotfix, and the current head — have passed over a **DEAD DOOR** because no harness ever
loads `#/page/new` in a REAL (headful) browser the way a writer does, which is the only place this
crash manifests. This is item 109's sharpest, most-owed gate: **drive `#/page/new` headfully at the
deployed bundle.** The vanished-subject class still stands; this is the un-gated route that keeps
re-shipping a crashing New Page door (item 104, reopened a third time).
**→ 104 CLOSED, 109 STILL OWED (Fable, 2026-08-26).** Item 104 closed 2026-08-26 on the founder's own
walk of `#/page/new` on production (`2256f58` · `b10fcc55` — the door opens, paper rendered). The
headful gate above **no longer gates 104**, but it **STAYS OWED** as the durable coverage fix — so
the next regression on this route is caught by an instrument, not by a founder. **Item 109 remains
OPEN.**
Registry: next free **110**.

**→ CHARTER LANGUAGE AMENDED (Fable, 2026-09-05).** Item 109's property is **"the COLD DOCUMENT LOAD
of `#/page/new`"** — that is what the gate must drive. **HEADFUL is an OPT-IN INSTRUMENT, not the
property:** the earlier "no gate drives `#/page/new` HEADFULLY" named a MEANS and mistook it for the
thing measured. The charter now reads by the property; headful stays available as an instrument for
when a property needs a real browser to show itself.

## ITEM 112 — REVISE AS A SURFACE (surface; the error lens is PARKED here) — OPENS 2026-08-26 (Fable's charter; re-send of a lost opening relay)

**NOT a ticket — a SURFACE.** Revise is **vocabulary without liveness** today (`ModeStrip`:
`live:false`, `aria-disabled`, flashes coming-soon). This item covers **its doorway, its rail
posture, its FX18 geometry, and its own harness** — **"presence is not composition" governs from day
one.**

**THE ERROR LENS IS PARKED ON THIS ITEM** — fully argued and merged (item 84's Revise re-pass:
**T1–T7, TRR12–TRR18, DR7 as narrowed, the CSS-only flag law, the ruled order**). **Nothing re-argues
when the surface exists** — the lens lands onto the surface this item stands up.

**SCOPE QUESTION HELD FOR NICK:** **small T0** (Draft's page + the lens + the Revise roster) **vs full
Revise** (its own furniture). His lean pending.
**→ SCOPE RULED (Nick, 2026-08-28): FULL REVISE.** Its own surface with revision-specific furniture,
**designed before built**; the small-T0 alternative is **RETIRED.** The **design charter routes to
TUTOR** (it holds the Revise arc whole), with **item 83's geometry laws as BINDING INPUTS** — the
anchor law, cabinet geometry, the Two Hands grammar, and DR7-as-narrowed. **Sequencing:** the charter
drafts **AFTER the deck ship and TUTOR's Draft-roster brief** — design begins without stalling the
build queue. The error lens (T1–T7) **remains parked on this item, fully argued.**
**→ CHARTER RATIFIED + LANDED (Nick ratified 2026-09-02; merged `7b49404`).** The full-Revise charter
(RS1–RS7) and the 112-A build brief are on main — `docs/menus/tutor/item112-revise-charter.md` +
`item112a-build-brief.md` (the builder lane's reach to 112-A). RS7 adopts the surviving matter of the
old `item84-t1-s0-brief` (local-only checker filter, five-class taxonomy, false-flag baseline,
rule-set inventory); that brief's routing check dies superseded — see the item-110 close below.
**⚠ 112-A DESK-GRIP QUESTION — AWAITING NICK'S WORD (NOT recorded).** Fable's relay carried a literal
placeholder ("[Nick's word here]") in place of the resolution, so chat 1 has NOT recorded it. Fable
pre-specified only the "no grip" branch: *if "no grip," the Desk hand's machinery mounts at birth
(anchor, coexistence, announce — RS2 satisfied structurally) but renders NO grip until 112-C provides
the drawer's content; G3's absence-over-grayed is the authority; the mirror completes at 112-C.* Held
open pending Nick's actual word.
**→ 112-A DESK-GRIP RULED (Nick, 2026-09-02) — the "no grip" recommendation is OVERRIDDEN.** Nick's
words: *"the desk grips on both sides should always be visible and open the tabs even if we haven't
filled in any tools/options yet."* So at 112-A **BOTH grips (Desk and Counsel) render from birth and
are always visible, and each OPENS its tab even when the drawer holds no tools/options yet** — an
empty drawer OPENS (it is not a locked door), so G3's absence-over-grayed does NOT govern this case,
by Nick's word. Consequence: the two-hand mirror is visually complete at **112-A** (both grips
present), not deferred to 112-C; 112-C still fills the Desk drawer's content later. **Owed to the
112-A builder lane** (supersedes the build brief's "render no Desk grip until 112-C" recommendation);
Fable to route.
**→ AMENDED BRIEF LANDED (chat 1, 2026-09-03, merge `904595a`).** `item112a-build-brief.md` is now the
ruling-consistent version (`9619b2a6`) on main — both grips always visible, opening even-empty tabs —
superseding the pre-ruling "render no Desk grip until 112-C"; TUTOR-amended @ `2579cba`. The 112-A
build lane can launch.
**→ NICK'S CONDITIONAL SHIP WORD — "SHIP THE FLOOR" (112-A, Fable relay, 2026-09-05).** Fires WHEN the
112-A offer lands (its clean-machine re-stamp at `7f48238` or successor, pushed-with-stamp). Then:
verify per habits (**ZERO SCHEMA expected — Revise going `live:true` is client-side; any schema STOPS
and surfaces**) → **MERGE on green** → Fable's review at the merge → **on PASS, DEPLOY** the full
checklist: fresh suite BOTH settings at the deploy HEAD; tree clean at upload; build-OS/toolchain on
the stamp; served-vs-stamped byte diff; **manifest SHA-enumerated since `1c8edd3` naming 112-A AND item
99** (the reaper rides this ship, harness-only); **rollback ratchets from `1c8edd3` · `798fb798`.** Any
red anywhere, or a verdict short of PASS: **STOP — the word never covers a red.**
**→ RIDER (Nick's word, the mode strip): `revise` → `mark`.** Draft's stale sub-label `revise` is
REPLACED with `mark` — the strip reads by the ratified sentence (**Draft MARKS, Revise DRESSES**).
Lexicon change only, one line; **rides the next window (112-B or the next errata), NON-BLOCKING for the
floor's ship.** Recorded as RULED.
**→ WORD SPENT + LANE RETIRED (chat 1, 2026-09-05).** "SHIP THE FLOOR" **FIRED AND IS SPENT** — the
floor shipped `10c2d0f` · railway `de639860` (see THE FLOOR (112-A) + ITEM 99 DEPLOY MANIFEST). **The
112-A lane is RETIRED WITH HONORS:** worktree cleaned per item-110 hygiene — branch `item112a` deleted
(was `609828a`, merged), `.claude/worktrees/item112a` removed; `609828a` stays reachable via main's
merge `1ebd2df` and `origin/item112a`.

**⛔ STANDING POSTURE — ALL SHIPS HELD (Nick, 2026-09-05), until his walk verdicts are in.** While
Nick tests the floor on production: **GREEN OFFERS MERGE as they arrive** (verify per habits → merge →
Fable's review as usual) — **but NOTHING DEPLOYS.** This SUPERSEDES every prior standing/conditional
ship word ("ship whatever we can", "ship the floor"): all are spent, and **no deploy fires on a stale
word.** A new ship needs Nick's fresh word after the walk verdicts land. Production stays `10c2d0f` ·
`de639860`; rollback ratchet unchanged (`1c8edd3` · `798fb798`).
**→ EXPECTED OFFERS UNDER THE HOLD (Fable, 2026-09-05):** FIX's **item 113** (the Tutor decline +
modeling-prompt amendment — **SERVER-behavior**, so it ships **ONLY on Nick's word POST-WALK**) and
ERRATA's **ruled-three**. Both **MERGE on green as they arrive**; **NEITHER DEPLOYS** while the hold
stands. The hold lifts only on Nick's walk verdicts.

**✅ NICK'S WALK — VERDICTS ON THE RECORD (2026-09-05), and THE HOLD LIFTS.**
- **The empty Revise floor reads CLEAN.** The floor shipped at `10c2d0f` · `de639860` is accepted by
  the founder's own walk — the empty-by-design surface reads as intended, not as an unfinished room.
- **The two hands read as ONE GRAMMAR.** **112-B DISSOLVES into cluster C1+C2 — CONFIRMED** (Revise's
  hands are the same hands; the mirror is one component, not a second implementation).
- **112-C (the Type section) is NEXT in the Revise arc.** **AMENDED 2026-09-06 by the ANALOG LAW (see
  the band):** since the FONT control lives in **Draft AND Revise, not Free Write**, 112-C's Type
  section mounts in **BOTH Draft's and Revise's Desk drawers — ONE COMPONENT, TWO MOUNTINGS**,
  page-level as RV1 governs. **Only the section's PLACEMENT clause amends; its SUBSTANCE does not.**
  **112-C also gains RV3's ruling — the SYSTEM-FONT ADDER.**
- **Cards overlapping the board: CONFIRMED LIVE by the founder — so (c)'s FIX SHIPS.** This is the
  founder reproduction item 118 (c) was waiting on; FIX's window offer `829fbc7` (the UPPER-bound
  right-edge clamp) carries it, and the (c) line completes when that offer merges and ships.

**⛴ SHIP WORD — "SHIP THE POST-WALK PACKAGE" (Nick, 2026-09-05). THE HOLD IS LIFTED.** The package is
**FIX's window offer + item 113 + ruled-three's lexicon change** (`revise`→`mark`, already merged at
`e17dd6e`), **plus the B/I/U addendum IF its S0 fits — FIX decides, and the package NEVER WAITS ON A
HYPOTHESIS.** Assembly first: each component MERGES on green with Fable's review as usual; the ship
fires once the package is assembled — **not piecemeal**, and not before. Then the **FULL CHECKLIST**:
fresh suite both settings at the deploy HEAD, tree clean at upload, build-OS/toolchain on the stamp,
served-vs-stamped byte diff, manifest SHA-enumerated since `10c2d0f` with **113's SERVER-BEHAVIOUR
NAMED**. **Rollback ratchets from `10c2d0f` · `de639860`.** Any red anywhere, or a verdict short of
PASS: STOP — the word never covers a red.
**→ 112-A OFFERED (build lane, 2026-09-05) — branch `item112a`, offered SHA `a672317`.** Record:
`docs/menus/tutor/item112a-offer-2026-09-05.md` (+ `item112a-s0.md`, `item112a-build-record.md`).
**REVISE IS LIVE**: `live:true`, real active state, the strip's EXISTING switch behaviour and no new
gesture; free-editing surface; both hands from birth per 119 and Nick's empty-drawer ruling (both grips
visible, both OPEN, the Desk drawer onto empty content); geometry floor asserted at BOTH reference
widths. **BOTH SETTINGS CLEAN, one tree, one bundle, neither stamp dirty — 69/69 each: `tree=a672317
bundle=index-CK6B8dF1.js/557023b`** (parked ran `--no-rebuild`, so both stamps name the same software).
`item112a.mjs` 55 · `item84b.mjs` 62+1 parked · **probe 44/44**. **ZERO SCHEMA** (client-side only;
product delta 7 files, +198/−45) — the ship word's precondition, checkable: `git diff 2820727..a672317
-- apps/server packages apps/desktop/src/store/persistence.ts apps/desktop/src/types` is empty.
**AWAITS chat 1's armed sequence** per the conditional ship word above. **OFFERED, NOT MERGED; no deploy
asked.**
**→ 112-A's S0 ANSWERS, on the record (the brief's two required checks).** (1) **Mode persists PER PAGE**
— `localStorage`, `wrizo-mode-page-<id>`, behind a validity allowlist; Revise was ADMITTED to that
existing rule (no new key/default/lifetime). The allowlist was the whole risk: an un-named `'revise'`
falls through to the default, so Revise would have silently forgotten itself on reload while Draft
remembered. (2) **THE EDITOR PATH, and the answer the parked lens needs — YES.** Revise renders through
`ForwardOnlyEditor`'s FREE-EDIT branch, so its text runs through `decorateEditorFor` every keystroke, and
that function ALREADY carries the decorator override the flag decorator will use (5th param `decorate`,
already load-bearing for `BoardCardPopup`). **The lens needs an ARGUMENT, not new routing** — with two
constraints: character count must stay 1:1 (the caret restore depends on it — independent corroboration
of the CSS-only flag law), and a marker may never be `display:none`/`visibility:hidden` (it vanishes from
STORED text via `innerText`). Re-verified after the errata wave touched `draftDecoration.ts`: unchanged.
**→ 112-A RIDER, OPEN FOR THE DESK (non-blocking): Revise BELOW 1100.** The floor is charter-law at 1100
and 1366, both framed. Below the gate Revise is live on **Draft's exact terms** (§2: "make Revise behave
exactly as Draft does"); it has no hands and no geometry floor there — but neither does Draft, and a
narrower rule would have been invention. **If the desk prefers a framed-only Revise, it is ONE PROP**
(`reviseEnabled` on `ModeSwitcher`, already the seam) **and no other line moves.** Not decided by the
build lane.
**→ 112-A PARK: ONE, and the lane's own first count was WRONG (recorded as the lesson).** `item84b.mjs`
S1 — *"the Revise tab is inert…"* — is SUPERSEDED by Revise standing up; original kept verbatim in the
file that owns it, successor live in the same file and STRONGER (the conclusion used to hold *by
construction* — Revise could not be entered — and now names a live surface the Draft roster must actively
decline; +2 further checks). The lane's sweep grepped `deferred`/`aria-disabled` and **missed it because
the assertion says "inert"**; the SUITE caught it (red at item84b, 1/60). Item 84's arithmetic, applied
to the lane that wrote it: the park COUNT is a number to be audited, not a silence to be trusted.

## ITEM 113 — THE TUTOR'S DECLINE + MODELING PROMPT AMENDMENT (build-class, SERVER) — OPENS 2026-08-26 (Fable's charter; re-send of a lost opening relay)

**BUILD-CLASS, SERVER.** Lands in **`apps/server/src/tutor.ts` → `SYSTEM_PROMPT`** AND its
**byte-verbatim mirror `docs/wrizo-alpha/tutor-rules.md` — IN THE SAME COMMIT** (the mirror's own
header is the reason: record and running system can never quietly diverge). Not chat 1's lane to write
(server code, propose-never-ship); recorded here as the approved spec for the build lane.

**Nick-approved insertion, VERBATIM, for §2 of the prompt:**

> Modeling is lawful; repair is not. You may compose a short parallel example — a sentence of your own,
> similar in structure and correctly punctuated — to demonstrate a rule. You may never return the
> writer's own sentence repaired, in whole or in part, however brief. The test: could the writer paste
> your words into their page and be done? If yes, you have written for them. A model is a specimen
> about grammar; a repair is their next revision performed by you.
>
> Speak at the work, never at the writer. The sentence has a problem; the writer does not have a
> problem.
>
> When you are asked again about the same error, the writer's edit did not clear it. Do not repeat your
> previous explanation. Take a different angle — a different model sentence, a different order of
> explanation, a different name for the rule. Never the same explanation louder.
>
> You do not refuse. If a request would cross into composition, do not answer with a refusal sentence.
> Return the question that leads back to the writer's own act.

**-> BUILT AND OFFERED - 2026-09-05 (fix lane). Branch `fix-item113`, base `origin/main` @ `7d7f06f`.
SERVER-BEHAVIOR CHANGE - flag for the deploy manifest. ZERO schema, zero client code.**
- **The insertion is byte-verbatim, PROVEN not assumed:** the blockquote above was extracted from
  `b925ecb` and diffed against what landed - **1006 chars each side, identical**.
- **PLACEMENT, and the "§2" clarification this ledger owes its next reader:** the four paragraphs
  land as **their own clearly demarcated block immediately after the Absolute-rules block**, with no
  invented heading. **"§2" has no referent in the artifact** - `tutor.ts` contains **zero `§`
  characters** and the prompt has never carried a numbering scheme of any kind. The spec meant the
  SECOND BLOCK. TU2 S2's own note *inside that very prompt* is the governing precedent: conduct rule
  37 landed "as its own clearly demarcated paragraph rather than a fabricated '37' bullet".
  Recorded so nobody re-derives it. Prompt now **9 blocks / 3430 chars**, mirror identical.
- **THE MIRROR WAS ALREADY BROKEN BEFORE THIS TICKET TOUCHED IT, and stayed broken for three days.**
  Item 84 TD4 (`6aa9144`) added the selection paragraph to `SYSTEM_PROMPT` and touched `tutor.ts`
  ALONE. Measured on `origin/main` at `7d7f06f` - **43 commits and two ships later** - the constant
  was **2422 chars / 5 blocks** and the mirror **1988 / 4**. Not the author's carelessness and not
  the reviewer's: main's own review line records the SYSTEM_PROMPT change explicitly. **Nothing
  failed, so nothing was seen.** Restored in its own attributed commit (`43524cb`) ahead of the
  amendment, prompt untouched - the record catching up to the running system, never the reverse.
- **THE DRIFT CHECK IS THE TICKET'S MOST DURABLE ARTIFACT** (`scripts/harness/tutor-mirror.mjs`,
  **5 checks**, static and browserless like `hooks-order.mjs`). It extracts the template literal,
  takes the mirror's body after the `---`, and asserts they agree. It deliberately has **no opinion
  on prompt CONTENT** - that is the only claim the mirror's header makes, and a check that grew
  opinions about wording would fail for reasons nobody signed up for.
- **FALSIFIED TWICE, and the first is not hypothetical:** (A) against `origin/main`'s REAL state -
  **2/5 failed**, reporting `prompt=2422 mirror=1988` and `prompt=5 blocks mirror=4`; (B) against
  113 applied to the prompt with the mirror forgotten - **2/5 failed**. A is the defect that
  actually shipped; B is the future the check exists to prevent.
- **THE FALSIFICATION CAUGHT A BUG IN THE CHECK ITSELF, BEFORE IT SHIPPED.** The first draft split
  on an LF-only separator; this repo runs `core.autocrlf=true` with no `.gitattributes`, so a
  checkout writes CRLF, the separator never matched, and **the equality check never ran at all**
  (3 checks instead of 5) while reporting a misleading "no separator" failure. **It went red for the
  wrong reason, which is its own kind of lying.** Line endings are now normalised to LF before
  anything is compared - comparing what git STORES rather than what a checkout happens to write, so
  the check cannot disagree with itself across machines.

## ITEM 114 — RESEARCH PAGES & STYLE GUIDES (feature; placeholders NOW, behavior deferred) — OPENS 2026-08-26

**OPENS (Nick, walkthrough part 1, 2026-08-26).** The Structure redesign makes **"Research" a THIRD
PAGE KIND** beside Normal and Screenplay. Under it, **style-guide buttons — MLA (default) · APA ·
Chicago · AP** — are revealed, and **the selection SHAPES THE REVISE MENU** (e.g. Chicago → Footnotes
appears). **Nick's instruction: build the buttons NOW as placeholders** — *"so we don't forget to go
back to it"* — full behavior DEFERRED. **Cross-refs:** item 112 (the Revise linkage); item 87's
chooser (a third kind = a third preset); the **MLA-default ruling — SUPERSEDED as to placement:** the
buttons live **under Research in Structure**, not in the earlier dropdown location.

**→ PROVENANCE GAP CLOSED (TUTOR surfaced it; recorded 2026-09-05).** The founder sentence this item
and the DRAFT-PICKS/REVISE-REFLECTS ruling both rest on was **only PARAPHRASED on disk, never verbatim**
— *a founder ruling the record only paraphrased is a ruling the record can lose.* **Nick's words as
given during the 2026-08-26 walkthrough, verbatim:**

> Instead of 'Convert to Screenplay,' just have a button that says 'Screenplay,' one that says 'Normal'
> which is preselected unless the User started a different style of page to initiate the Page, and a
> 'Research' option. When 'Research' is selected, four new buttons should appear that say 'MLA'
> (default), 'APA,' 'Chicago,' and 'AP.' Whatever the user selects will then affect what gets displayed
> in the Revise menu tab (a Footnotes option should appear, e.g. when 'Chicago' style is selected.) We
> don't need to build all of this out yet, but I want the style guide buttons in so we don't forget to
> go back to it.

This is the primary text for item 114, for the **DRAFT PICKS / REVISE REFLECTS** ruling, and for item
87's chooser (the three kind buttons, Normal preselected-unless-otherwise-started).

**→ RULED (Nick, 2026-09-05): DRAFT PICKS, REVISE REFLECTS.** The style-guide reconciliation is
settled in Nick's own 114 words — the buttons live **under Research in Structure**, and **"the
selection SHAPES THE REVISE MENU"** (e.g. Chicago → Footnotes appears). So **DRAFT PICKS the guide;
REVISE REFLECTS it.** **TRR11's control is SUPERSEDED** — its style-authority control does not own the
pick; the pick's home is item 114's Research row, and Revise renders what that names.

## ITEM 115 — CARD TAGS & METADATA (committee) — OPENS 2026-08-26

**OPENS (Nick, walkthrough part 2, 2026-08-26).** Charter, Nick's words (the Westeros example whole,
on file at Fable's desk): **cards carry METADATA for quick lookup** — a cited source's name; a place
or character. A **"Tags" dialogue box at each card's FOOT** lists the card's linked tags; **links
between cards note their connecting tags**; and **tags are searchable FROM THE DRAFT SCREEN**,
returning every card carrying the tag *"without having to run an AI check."* **Charter posture,
verbatim:** *"devise an intuitive way for writers to be able to group information without getting too
bogged down in the logistics."* Committee.

**⚠ SUPERSEDED-INTO-165, 2026-09-19 — item 116 is ABSORBED into item 165 (THE PLAN MENU RESTRUCTURE)**
as "Organize Research → Import Sources." Kept verbatim below for the record of what it charted.

**→ SUCCESSOR, for the Journal-board import: ITEM 181 (Fable, 2026-09-19)** — recorded as 116's successor,
not as new ground.

**✓ REFINED 2026-09-19 (Fable, accepting PLAN DESK's reading): 116 is ABSORBED IN PART — two acts, not one.**
*Import Sources* (research → pages on a new board) is 165's absorption of 116's first half; **placing an image
or doc AS AN OBJECT, opened full size by double-click, is 116's original shape and SURVIVES AS 181**, which
carries the fresher founder words. The "SUPERSEDED-INTO-165" marker above is kept as written and is read as
*in part*.

## ITEM 117 — PAGE↔BOARD LINKING & THE BOARD SHELF (feature) — OPENS 2026-08-26

**OPENS (Nick, walkthrough part 2, 2026-08-26).** A **Page links to one or more Boards.** Linked
Boards render as **scrollable THUMBNAILS in the Tools Menu**; clicking one opens a **second pop-out
LEFTWARD** listing every card/doc as thumbnails, scrollable; **double-click opens the card/doc in the
same popup used on the Board** (faded ground); **EDITS SYNC BOTH WAYS.** **Sub-note (to-dos, not
now):** Storyboard/Outline boards will also display here, formatting may differ. **Cross-refs:** item
93's pairing model **folds INTO this charter**; the **menus arc owns the chrome.**

## ITEM 118 — THE BOARD INTERACTION FIX CLUSTER (fix-class) — OPENS 2026-08-26

**OPENS (Nick, walkthrough part 2, 2026-08-26).** Six board-interaction defects, one cluster:
- **(a) B/I/U completely broken in the card editor** — literal `****` / `**` / `___` markers, **NO
  styling applied** — worse than the page (where style applies under visible markers). Likely its own
  renderer path; S0 confirms.
- **(b) Cards resize ONCE** — the handle never re-arms until the writer clicks another card first.
- **(c) Cards moved to the board's edge begin to DISAPPEAR** — edge containment absent.
- **(d) Board resizing DECAYS** — works at first, then stops after a resize or as cards accumulate.
  Nick's ruling, verbatim: *"A user should be able to double-click on the board to activate the
  resizing option at any time."*
- **(e) Cards link but CANNOT BE UNLINKED.**
- **(f) The New Page Card control is DEAD — and RULED REMOVED** (replaced by item 116, Import to
  Boards).

**→ RULED DISPOSITIONS (Fable / ERRATA, 2026-09-05) — three of the cluster answered:**
- **(b) resize-once → PARKED, NOT REPRODUCED UNDER FOUNDER CONDITIONS.** The repro STAGE is recorded
  (mouse/desktop; the missing variable was board POPULATION — ~10 cards, linked pairs, cards at the
  edges). **Nick re-tests live after the ship**; it re-opens on a founder reproduction, never on
  argument.
- **(c) edge-vanish → REPRODUCED AND FIXED at the X-AXIS CLAMP.** FX17's **shared-delta shape is
  mirrored**, and the **two-axes finding** stands on the record. *(Verified by chat 1: the clamp is
  live on main — `Math.max(0, b.x + dx)` / `Math.max(0, b.y + dy)`, load-bearing by its own comments —
  and the ruled-three merge does NOT touch `BoardEditor.tsx`, so the fix landed in earlier shipped
  code, not here.)*
  **→ PRECISION, and chat 1's verification CORRECTED (Fable, 2026-09-05): (c) IS NOT FIXED ON MAIN.**
  The clamp chat 1 read on main — `Math.max(0, b.x + dx)` — is the **pre-existing LOWER-bound** clamp
  (the left/top edge). **The edge-vanish fix is the UPPER-bound (RIGHT-EDGE) clamp, and it lives in
  FIX's window offer at `829fbc7` — NOT merged, NOT shipped.** Reading "a clamp" as "the clamp"
  conflated two different bounds; the note above stands as written, corrected here. **The ledger does
  NOT claim (c) fixed until that offer merges and ships** — the disposition is REPRODUCED AND FIXED
  IN AN OFFER, pending its window merge, where this line is completed.
- **(e) unlink → RE-CLASSED: a DESIGN ADD, not a defect.** Routed to the cluster's **C4** (tags on
  cards). **Delete/Backspace is recorded as the EXISTING exit** for a selected thread — the capability
  is already there; what is wanted is a designed affordance for it.

Registry: next free **119**.

**→ S0 PASS 1 — 2026-08-28 (fix lane). TWO OF THE THREE "SMALLEST" DEFECTS DID NOT REPRODUCE, AND
NOTHING IS OFFERED AS FIXED.** The brief named (b) resize-once, (e) unlink and (c) edge-vanish as
the likely-smallest subset. Driven headlessly against the shipped bundle
(`index-CHvEOjEp.js`), mouse pointer, 1400x900, one **text** card on a fresh user board:
- **(b) RESIZE-ONCE — NOT REPRODUCED.** Resize #1 grew the card 435x87 → 525x157; resize #2, run
  IMMEDIATELY after with **no intervening click on another card**, grew it again 525x157 → 615x227.
  The handle re-armed and tracked to the new corner (631,336 → 721,406). Under these conditions the
  handle does not need re-arming.
- **(c) EDGE-VANISH — NOT REPRODUCED.** A card dragged far past the top-left edge (target 170px
  left and 130px above the canvas origin) **clamped** to (146,168) against a canvas origin of
  (146,167) and stayed rendered. Edge containment is present on this path.
- **(e) UNLINK — NOT REACHED.** The setup failed before the defect could be tested: a move-drag on
  a second card did not move it, and the double-click-then-drag thread gesture minted **no
  connection** (0 connection elements). So (e) is UNTESTED, not absent.
**THIS IS A STATEMENT ABOUT THE INSTRUMENT AS MUCH AS THE PRODUCT, and it is not a claim that
Nick was wrong.** He reported these from his own walkthrough; four variables differ between his
conditions and the probe's, and any of them could carry the defects: **pointer type** (the gesture
code has pen-specific paths and a hold-timer; the probe drove a MOUSE), **card kind** (the probe
used a `text` card — a `page-pin` card takes a different `canResize`/aspect path), **card count**
(defect (d) says board resizing decays "as cards accumulate", which points at state that one card
cannot produce), and **viewport/DPR**. The probe's own move-drag failing is direct evidence that
the harness does not yet drive this surface faithfully.
**WHAT IS OWED BEFORE ANY OF THIS CLUSTER IS BUILT:** a reproduction under Nick's own conditions —
at minimum pointer type and card kind named — because a fix built against a defect that does not
reproduce is a fix aimed at nothing. **NOTHING FROM ITEM 118 IS OFFERED**, per the brief's own
"anything not green parks with records". No product code was written for it.
**ONE THING THE PROBE DID SETTLE, worth keeping:** board `boxes` live in BoardEditor's local React
state and reach `localStorage` only on the 2s autosave or unmount, so the first probe drafted here
read `[]` and would have "confirmed" resize-once against two empty arrays. Re-instrumented to the
DOM, the same run showed both resizes working. **Any future item-118 harness must measure the
rendered card, never the stored row** — the same trap item 92 met from the other side.

**→ S0 PASS 2 — 2026-08-28: DEFECT (a), READ IN SOURCE. IT IS THREE FAULTS, NOT ONE, AND THE
CHARTER'S GUESS IS WRONG IN AN INSTRUCTIVE WAY.** The charter says B/I/U is "likely its own renderer
path". It is not: the card popup shares the page's engine correctly (`applyFormat` +
`decorateEditorFor`). The breakage is elsewhere, and it splits three ways — no browser needed for
any of this, it is all readable in the shipped source.
- **(a-i) UNDERLINE HAS NO RENDERER, ANYWHERE — AND IS OFFERED ON TWO SURFACES.** The card dock
  ships a `U` button (`BoardEditor.tsx:572`) and so does the page rail (`Sliver.tsx:361`, `:398` →
  `PageEditor.tsx:645`). Both call `applyFormat('underline')`, which writes `__word__`
  (`draftFormat.ts:33`). **Nothing renders it.** `draftDecoration.ts` contains the string
  "underline" ZERO times; `decorateInlineForCard` (`:83`) and `decorateInline` handle only `**` and
  `*`; `index.css` has `.md-bold` and `.md-italic` (`:4200-4201`) and **no `.md-underline`**. So
  underline is literal, unstyled, on the page as well as the card. This is Nick's `___`. **The
  shipped UI and the shipped renderer disagree with each other, and `draftDecoration.ts`'s own
  header says so out loud — "Bold/Italic ONLY" — above a dock that ships three buttons.**
- **(a-ii) THE RESTING CARD NEVER CALLS THE ENGINE AT ALL.** `BoardTextBox`
  (`BoardEditor.tsx:252-260`) returns `{initialText}` as a bare text node. Decoration happens ONLY
  inside the popup. So on the BOARD — the surface the writer actually looks at — every marker is
  literal and nothing is styled, bold and italic included. This is Nick's "**NO styling applied**".
  The ported-card branch (`sourceEntryId`, `:245-252`) is raw too.
- **(a-iii) B/I/U ON AN EMPTY SELECTION PRODUCE BARE MARKERS, BY DESIGN.** `wrapSelection`
  (`draftFormat.ts:56-59`) with `selected.length === 0` emits `****` and parks the caret between the
  pairs; the card register is **reveal-adjacent-to-caret**, so both marks then render VISIBLY with
  no text between them. That is Nick's `****`. It is working as specified — **and the specification
  is what reads as broken**: the writer clicks B meaning "type bold from here" and receives four
  asterisks. Worth a ruling, not a patch: this is a design report wearing a bug's clothes.
**WHAT THIS CHANGES ABOUT THE FIX.** (a-ii) needs no ruling — FX5 S6's own recorded verdict already
governs it ("asterisks visible on a card is a bug, not a style choice — the popup shows words, not
syntax"), and that argument applies with MORE force to the resting card than to the popup it was
written for. The repair is one call: render through `decorateMarkdownForCard(text, null)`, whose
null caret collapses every marker (`md-mark-hidden`) and leaves styled words. **One risk to prove,
not assume:** cards auto-size from the rendered DOM's `scrollHeight` (`measureRef`), and collapsed
marks are `font-size:0`, so decorated text measures SHORTER than raw — card heights will move, and
the harness must check that before this is offered.
**(a-i) NEEDS A RULING BEFORE IT IS BUILT, AND I AM NOT TAKING THE CHOICE.** Two lawful repairs
point opposite ways: **retire the U buttons** (honour the frozen Bold/Italic set the decorator was
written to) or **give underline a renderer** (honour the UI that has been shipping to the writer).
Nick named U as broken, which leans toward the second — but the frozen-markdown-set ruling is a
standing design ruling and a fix lane does not unfreeze one on its own initiative. **Routed to
Fable.** Whichever way it goes, it is one change in the SHARED engine and it lands on the page and
the card together — class-over-instance, not a board-local patch.

**→ BUILT AND OFFERED — 2026-08-28: (a-ii) ONLY. `ae1f600`, branch `fix-ab2-repoint`, offer doc
`docs/wrizo-alpha/offer-item118-a2-2026-08-28.md`.** One file, one JSX element: `BoardTextBox` now
renders through `decorateMarkdownForCard(initialText, null)` instead of returning `{initialText}`
raw. No new renderer — the popup's own engine, with a null caret, so nothing is adjacent to
anything and every marker collapses. Governed by FX5 S6's existing verdict; **no ruling taken**.
`dangerouslySetInnerHTML` is safe on the same grounds as `decorateEditorFor` (every slice through
`escHtml`; the engine emits only its own `<span class="md-*">`). Storage untouched and ASSERTED —
marks collapse via `font-size:0`, never `display`/`visibility`, so `textContent` still carries the
stored bytes; the check exists so a future "simplification" to `display:none` fails loudly in the
harness instead of quietly in a writer's saved words. Card heights cannot shrink (the measure
effect is one-directional) — asserted, not argued.
**NEW HARNESS: `apps/desktop/scripts/harness/item118.mjs`, 6 checks. Suite files 60 → 61.**
**FALSIFIED FIRST** against the reverted product at the same build: `ITEM118 VERIFY: FAIL — 3/6
failed` — the three DEFECT assertions, while the storage invariant, the no-collapse guard and the
popup regression passed before AND after (they are guards, not defect claims; a guard that only
passes after the fix proves nothing). Fix restored: `PASS (6 checks)`.
**THE HARNESS ASSERTS NOTHING ABOUT (b), (c) OR (e)** — deliberately. They did not reproduce, and a
harness that "passes" against an unreproduced defect is worse than none.
**DELIBERATELY OUT OF SCOPE, NAMED NOT SKIPPED:** `BoardPinBox` and the ported-card branch render a
`notecardExcerpt` title+excerpt — a derived SUMMARY of a page, not the card's own words. Whether a
summary carries styling is a design question. **Owed follow-up.**
**STANDING AFTER THIS:** (a-i) and (a-iii) ROUTED TO FABLE for rulings; (b), (c), (e) PARKED
UNBUILT; (d) not reached; (f) already ruled removed. **The single cheapest unblock for (b)/(c)/(e)
is one line from Nick naming the POINTER TYPE and the CARD KIND he was using.**

**-> S0 PASS 3 + BUILT - 2026-09-05, ON NICK'S OWN STAGE.** The repro line arrived
(relayed 2026-09-02, screenshots 2026-08-26): **MOUSE, desktop** - so pointer type was never the
missing variable. **Board POPULATION was**: ~10 text cards in two columns, multiple LINKED pairs,
cards near the canvas edges, and both card-resize and BOARD-resize in play. Staged exactly, with
two setup failures from pass 1 fixed by reading source rather than retrying: connections are minted
by a **double-click on the brass HANDLE** of a selected card (FX4 S6), not a card-to-card drag -
which is why pass 1 minted zero - so the stage seeds `kind:'connection'` boxes directly; and
"board-resize in play" is a persisted `board-meta` box carrying `canvasW`/`canvasH` (FX4 S4).

**(c) EDGE-VANISH - REPRODUCED AND FIXED. PASS 1'S "NOT REPRODUCED" WAS A WRONG ANSWER, and its
reason matters more than the fix:** pass 1 dragged toward the **TOP-LEFT**, the corner that has
always clamped (`Math.max(0, ...)`), so it "proved" a containment that does not exist on the other
side. On the populated stage a card dragged 900px right hung **750px PAST the canvas**, width
unchanged at 1500.
**THE TWO AXES ARE DIFFERENT STORIES AND WERE NEARLY FILED AS ONE.** Re-measured per axis with the
canvas re-read AFTER each drag: the **right** edge cannot grow (`pageWidthPx`) and the card escaped;
the **bottom** GREW to fit (**canvas 1455 -> 2070px**, card contained at `overBottom -120`) and is
working as designed. Reporting them together would have produced a clamp that **froze the growing
canvas** - a regression wearing a fix's clothes.
**THE REPAIR IS FX17 S3'S OWN SHAPE ON THE AXIS IT SKIPPED** - that slice hard-stopped the BOTTOM
and named the gap in its own first sentence (*"the way the x-axis's own `Math.max(0, ...)` does"*).
Clamped on the SHARED delta so a multi-card selection holds its shape; floored at 0 so a card
already outside is never yanked back. A stop, never a correction. **750px -> 0.**
`item118.mjs` **6 -> 10 checks**; two of the four new ones assert the fix did NOT over-reach.
**FALSIFIED: 1/10 failed**, exactly the escape check - the guards passed both ways, as guards must.

**(b) RESIZE-ONCE - PARKED: NOT REPRODUCED UNDER FOUNDER CONDITIONS, STAGE RECORDED.** Three shapes
on the full stage: a plain card twice, a **LINKED** card twice, and a card resized after two prior
resizes. Every one: handle re-armed, second resize grew the card (510x195 -> 580x245 -> 650x295).
**Nick re-tests live after the ship; the stage above is the setup to start from.**
**A NEAR-MISS RECORDED BECAUSE IT WOULD HAVE BEEN A FALSE POSITIVE:** the first populated run
reported *"NO HANDLE after select"* for all three shapes, which reads exactly like (b) reproducing.
It was the probe - `BoardEditor` sets `selectedId` on **pointerdown**, and the probe dispatched a
plain `click`. Real pointer events showed the handle arming every time. **A driver can lie by dying
OR by doing nothing.**

**(e) UNLINK - RE-CLASSED TO A DESIGN ADD; ROUTES TO THE CLUSTER PASS'S C4. No new item number.
NOTHING BUILT.** Measured: clicking a thread selects it (`data-selected="true"`), **Delete/Backspace
removes it** (connections 3 -> 2), and there are **ZERO affordances** - no button, no menu item,
nothing naming unlink anywhere, `buttonsInsideSvg: 0`. **The mechanism exists; the affordance does
not.** Nick's "cards link but CANNOT BE UNLINKED" is accurate from the writer's side because there
is no way to discover it. **Delete/Backspace is recorded as THE EXISTING EXIT**, so C4's work is
*"make the gesture visible,"* not *"build removal."*
**THE SAME GAP FROM TWO SIDES:** the connections `<svg>` is `aria-hidden="true"` - threads are
invisible to assistive technology AND undiscoverable to sighted writers.

**(d) BOARD-RESIZE DECAY - still NOT REACHED.** Out of this window's scope.

## ITEM 119 — THE MIRRORED HANDS (design-class; the Counsel mirrors the Desk, both anchored to the writing surface) — OPENS 2026-08-31

**THE MIRRORED HANDS RULING (Nick, 2026-08-31)** — supersedes **FX18 S2 regime (3)** for the Tutor
panel; **E2 resolves INTO this.** Nick's words, verbatim:

> "I want the tools menu pop-out and the Tutor interface pop-out to be exactly mirrored to each other
> and both anchored to any Page, Board, or Card on which the User does any kind of writing."

**THE CHARTER, three faces:**
- **SYMMETRY** — the Counsel's geometry, animation, anchor, and coexistence behavior **exactly mirror
  the Desk's** (the tools hand). Two hands, one grammar.
- **ANCHORING** — both hands attach to the **WRITING SURFACE** — page paper, board canvas, opened
  card — **not the screen.**
- **COVERAGE** — **every surface that accepts writing carries both hands**, the opened-card popup
  included.

**Design-class WITH KNOWN BUILD WEIGHT:** the **canvas-scrolls-inside-a-fixed-frame** finding means
surface-anchoring on boards needs real plumbing — the measurement is on record at **menus-errata**.

**BINDING INPUTS:** the **drawer coexistence law** (both-open only when the surface has room; graceful
yield); the **announce-from-effect invariant**; **item 83's geometry laws**; and **item 117's
board-shelf chrome** — the two **must be designed together, one charter pass covers both.**

Registry: next free **120**.

**→ 115 / 117 / 119 CHARTERED AS ONE CLUSTER — the connected-board cluster (Fable's desk, 2026-09-02;
pass beginning).** One system in three numbers: **115 the DATA** of connection (tags), **117 the
GEOGRAPHY** (the board shelf), **119 the GRAMMAR** (mirrored hands) — designed together in one full
committee double-pass, output one design document with a ticketed build order to Nick for his word.
Charter: `docs/wrizo-alpha/cluster-charter-tags-shelf-hands.md`. Item 116's import mechanics ride
BEHIND the cluster (its own small charter once the shelf exists). *(Committed post the roster stamp,
batched with the MENU desk's item-83 errata build brief — `docs/menus/item83-errata-build-brief.md`,
AUTHORED BY THE MENU DESK, committed to main by chat 1 so the errata builder can launch.)*
**→ BINDING INPUT RATIFIED (Nick's word, 2026-09-05): THE 1100 ANCHOR.** The **29.7px dock overhang at
the frame's MINIMUM width** — pre-existing in EVERY mode, pinned as 112-A's baseline — is CONFIRMED
among the 115/117/119 cluster pass's binding inputs. Ratified.
**→ RULED (Fable, 2026-09-05): THE PROBE'S WIDTH MATRIX GAINS 1100.** The frame's MINIMUM width joins
the probe's width matrix as a **STANDING member** — *an instrument that never visits the width where
the layout law bites cannot certify the law.* Small probe amendment (MENU's instrument); **rides the
next probe touch**, and stands as a **BINDING NOTE for the 115/117/119 cluster pass.**
**→ PASS DRAFTED (Fable's desk, 2026-09-05): CANDIDATES C1–C6, three questions held for Nick.** The
committee pass is on disk — `docs/wrizo-alpha/cluster-pass-tags-shelf-hands.md`. **STATUS: CANDIDATES
ONLY**, output to Nick for his word. The cluster's law: **TAGS ARE NAMES, STRUCTURE COMES FROM LINKS**
— search is LOOKUP, never inference (Nick's "without having to run an AI check" read as architecture);
no tag types, colors, required tags or hierarchy; tags do NOT reach the Tutor in this pass (deferred to
item 108 by architecture). **Ticketed order:** **C1** the mirror as ONE component (one drawer, a side
prop — fade/slide/announce/coexistence shared by construction) · **C2** surface anchoring (paper /
board WRAP / card popup; closes the −29.7px overhang at 1100) · **C3** hands on the card · **C4** tags
on cards (strings in `entry.boxes`, ZERO schema, local census) · **C5** the shelf (a page's shelf = its
plan board + every board pinning it — the link already exists, zero schema) · **C6** find from Draft.
**Item 116 rides BEHIND C5** as its own small charter. **112-B DISSOLVES INTO C1+C2** — Revise's hands
are the same hands — pending Nick's word. **HELD FOR NICK:** Q1 linking = pinning? · Q2 confirm the
tags/Tutor deferral to item 108, or charter it now · Q3 Find's home = Draft's existing Find section?
**→ AMENDED (Fable, 2026-09-05): C2's INPUT IS THE MEASURED TRIO.** ERRATA's probe at 1100 measures
the overhang PER SURFACE, not as one figure: **prose −29.69 · screenplay −38.00 · board 0.00 (flush).**
C2 (surface anchoring) is specified against those three; the single "−29.7px" above is the PROSE row
only — kept as written, corrected here.

**✅ THE PASS IS RATIFIED (Nick, 2026-09-05), and the three held questions are ANSWERED:**
- **Q1 → PINNING.** Linking IS the existing pin (reuse, zero schema), as the pass leaned. **AND a new
  design arc opens with it: the PAGE/PLAN WORKFLOW arc at MENU — three mockups, DOUBLE PASS, under a
  MINIMUM-SETUP LAW.** **C5 (the shelf) and C6 (find from Draft) WAIT ON IT** — the geography is not
  built until the workflow that uses it is designed.
- **Q2 → CHARTER IT.** Tags DO reach the Tutor: it becomes **item 108's FIRST REQUIREMENT**, chartered
  at **TUTOR**. (This lifts the pass's architectural deferral — the wire question is answered by
  chartering it, not by postponing it.)
- **Q3 → FIND LIVES UNDER THE TUTOR'S COMPOSER** — **local, ZERO-NETWORK.** (Supersedes the pass's
  "Draft's existing Find section" lean: the door is the composer, and the no-wire posture is explicit.)
  **→ TUTOR'S FIND DESIGN PASS (FN1–FN8) RATIFIED (Fable, 2026-09-06)** — the pass that answers Q3.
  **Chat 1 merges its branch tip when TUTOR reports it** (verified per habits as usual); **Nick's words
  on the PLACEHOLDER and on SCOPE append** to that record when it lands.

**112-B DISSOLVES into C1+C2 — CONFIRMED by Nick's walk** (see the walk verdicts above): the two hands
read as one grammar, so Revise's hands are built once, as the mirror component.

## THREE RULED ITEMS — BUILT, RULED, OFFERED — 2026-09-05 (errata lane; branch `ruled-three`)

**OFFERED, NOT MERGED.** Full record: `docs/wrizo-alpha/ruled-three-offer-2026-09-05.md`. Branched
from `origin/main` @ `7d7f06f`. **`ad76e42`** (sub-label) · **`2fc7481`** (probe gains 1100) ·
**`1bbf465`** (item 109's gate) · **`40aae87`** (the AST guard) · **`d7c0e1a`** (a stray `.bak`
removed) · **`5f941dc`** (this record). **All four follow-up rulings ratified; none required a
code change** — they rule on findings the build had already surfaced.

**BOTH SETTINGS CLEAN, 71/71 each, one tree, neither stamp dirty; parked ran `--no-rebuild`
against the byte-identical bundle:**

```
SUITE RESULT: CLEAN - tree=d7c0e1a bundle=index-BxYTLPxH.js/557021b
SUITE RESULT: CLEAN - tree=d7c0e1a bundle=index-BxYTLPxH.js/557021b NO-REBUILD
```

69 files became **71**; both new ones are the cheapest in the suite — `hooks-order-ast.mjs` **1s,
no browser**; `item109.mjs` **11s**. Both **park nothing and say so in words**: neither supersedes
an assertion.

**(1) THE SUB-LABEL — `revise` → `mark`. SCOPE ACCEPTED AS DISCLOSED, NOT AMENDED.** Ruled: *the
shared MODES table is the truth and QuickSprint's Draft IS Draft — "revise" was equally false
there.* So the change reaches QuickSprint's RENDER while `QuickSprint.tsx` stays byte-identical, and
no per-surface prop was invented to keep the falsehood on the surface that had it. Two things stay
on the record: the string is **not in the lexicon** (inline in `MODES` beside three equally-inline
siblings), and "one line" and "reaches two surfaces" are both true while only the first is obvious.
Nothing parked — no harness asserts any sub-label.

**(2) THE PROBE AT 1100 — AND THE TRIO THAT CORRECTS THE CLUSTER PASS.** The frame's MINIMUM width
is now a standing matrix member (*an instrument that never visits the width where the layout law
bites cannot certify the law*). It bites unevenly: **prose −29.69px · screenplay −38.00px · board
0.00px flush**, each reproduced twice. **RULED: "pre-existing in every mode" holds as a CLASS and
fails as a NUMBER — and the board being FLUSH is the EXISTENCE PROOF of C2's target state.** ►
**BINDING-INPUT AMENDMENT (chat 1 records): C2 designs against the MEASURED TRIO, not 29.7.** C2 is
therefore closing a gap, not inventing a geometry. The KNOWN instrument is ruled *"exactly the
right one"*: keyed to **surface + width + check + the MEASURED PIXEL VALUE** within ±0.75px, so
drift, a partial fix, **or a full one** all re-red, and the owner clears the entry in the same
change that clears the defect. **Probe 62/66 green, 4 KNOWN (owned), 0 RED** — 16 new checks, four
findings that were always true and never visible.

**(3) ITEM 109 — THE GATE, AND THE MECHANISM THE SAGA LACKED. BOTH CORRECTIONS ACCEPTED.**
(a) The gate asserts **BG1's beginnings row, not the sleeping F6 invite** — *asserting a retired
behavior would gate the past*; FX15 (the Quiet Page) put the invite to sleep by default, measured
absent on a fresh profile while the beginnings row is present. (b) ► **CHARTER AMENDMENT: the
load-bearing property is the COLD DOCUMENT LOAD.** `app.goto()` navigates to a URL differing only
in its HASH, which is a SAME-DOCUMENT navigation — proven with a sentinel planted on `window` that
**SURVIVES** it. Ten files reach that door and none has ever mounted the app at it, which is exactly
why a mount-time fault shipped green three times. Ruled *"the mechanism the whole three-reopen saga
lacked"*; **headful stays an honest opt-in.** IT CAN FAIL, demonstrated: against a deliberately dead
door (an origin serving a bare `<div id="root">`) the gate fails **6/9** with `paper:null`,
`rootKids:0` — the exact tree-blanking signature. `WS_HEADFUL=1` and `WS_TARGET_URL` are real and
**verified** (the headful run passes 9/9 and records `headful:true` on its own face), neither
default. No defect was found that reproduces headful and not headless, and none was claimed.

**(4) THE AST HOOK-ORDER GUARD — REGISTERED as *the discriminator law applied to a guard about
guards*.** It nearly shipped as a decoration: the first run read `arrowForms: 0` and a clean census,
which looks like success and is not — **both blind spots are EMPTY in the tree today** (the line
scanner's "exactly one arrow definition" is `const Crumb = (<div …>)`, a JSX ELEMENT, not a
function), so the census exercises NEITHER new path and would read clean whether the guard worked or
did nothing. Four fixtures make it real: the ARROW shape flags (`Panel`/`useState`, arrowForms 1),
the MULTI-LINE-return shape flags (`Surface`/`useEffect`), a clean control stays 0 (without it a
detector that flagged everything would pass), and a nested-CALLBACK control stays 0 (one verdict,
one claim). Census **157 components/hooks across 150 files, zero violations**; TypeScript was already
a devDependency so the parser cost no new one. `hooks-order.mjs` untouched and still passing —
additive, nothing parked; if the two ever disagree, that disagreement is itself a finding.

**NOT DONE, deliberately:** no fix to the 1100 overhang (ruled out of scope, owned by the cluster
pass; reported, not gated); no per-surface sub-label prop; no suppression beyond the keyed,
measured, drift-sensitive one; no merge and no deploy.

## ITEM 120 — R6 BIRTH-FROM-DEFAULTS NEVER REACHES THE UNBORN ROUTE (fix-class) — OPENS 2026-09-03

**OPENS (Fable, from the errata wave's measurement, 2026-09-03).** R6's **birth-from-defaults** — the
page-defaults COPY at creation (M2's ruling) — **does NOT reach the UNBORN route**, the ordinary way a
page is made. **MEASURED by the errata lane, not read:** M2's own ruling is bypassed on the ordinary
birth path. **Pre-existing** — outside the errata wave's brief, so surfaced not fixed there (see the
errata records above: *"► SURFACED, NOT FIXED — R6's BIRTH-FROM-DEFAULTS DOES NOT REACH THE UNBORN
ROUTE"*). **Fix-class, owed to the next FIX window.** The outdent partner (E3's SEAM 1) and the
Screenplay-collision seam remain **HELD FOR NICK** (recommendations on file in the errata offer;
neither blocked this merge). Registry: next free **121**.

## ITEM 124 — THE BOARD HAS NO TEXT OF ITS OWN (fix-class) — OPENS 2026-09-07

**OPENS (Fable, 2026-09-07).** Retire **the board's own text leg on the Tutor wire** — **BD4's census
found it rides today.** Under the three-space canon a board is a container and holds no writing, so
**the Counsel on a board reads the CONTAINED CARDS**, never a board-level text of its own.

## ITEM 127 — THE TYPED FACE, AND THE FREE WRITE MENU ROSTER — OPENS 2026-09-07

**OPENS (Fable, 2026-09-07).** Free Write **"both acts like a typewriter and looks typed"** (Nick) —
**a typewriter FACE for Free Write's text, PER-THEME** (Plateau's default a monospace typewriter);
**the theme arc supplies the faces.** **THE TYPED FACE APPLIES TO TYPEWRITER *ON* ONLY; with
Typewriter OFF the page uses its own chosen face.**

**✗ WITHDRAWN 2026-09-19 (Fable named the wrong document): item 127 has NO Draft typewriter clause and
STANDS.** The marker below is withdrawn as to 127. The rulings item 171 supersedes are **FX2 S2 and the
doorway wave's clause 3** — marked at clause 3 in this file. Item 171's new condition on Free Write's
toggle (no ink) is recorded at 171, not as a supersession of 127. The marker is kept as written, for what
it said and why it was wrong.

**⚠ SUPERSEDED IN PART 2026-09-19 by ITEM 171 — the roster line's `Typewriter on/off` is now AVAILABLE ONLY
ON A TEXT PAGE WITH NO INK** (selecting Ink deactivates it; any ink on the page forbids reactivating it).
The roster below is kept as written. *(Chat 1 could find no separate "typewriter can be turned off"
clause for DRAFT in this item's text — see *ITEM 171* for exactly which rulings it supersedes.)*

**FREE WRITE MENU ROSTER, ruled (final form, after Nick's confirm):**
**Typewriter on/off · when OFF, B/I/U + FONT · INK — nothing else.**

**THE FONT QUESTION — RAISED AS A CONFLICT, RESOLVED BY NICK THE SAME DAY.** Chat 1 refused to record
the roster's first form as *"ruled"* because it placed **FONT inside Free Write** against a **standing
law** carrying Nick's own reason. **Nick's confirm (2026-09-07): B/I/U + FONT in Free Write "only
when Typewriter is OFF" — "yes".** **The analog law's FONT clause is NOT REVERSED; it is SCOPED**, and
is **parked in the immutability form beside the law itself** (see the band). **The resolution is the
point: the conflict was surfaced, not smoothed over, and the founder settled it in one relay.**

## ITEM 110 — COUNT +1 (the menus downloads) — 2026-09-07
History of ITEM 110: [2026-08](ledger/2026-08.md) <!-- c13-3 -->

**Five untracked docs** landed in the primary checkout's `docs/menus/` (Nick's downloads from the
MENU desk: the Ink pass, its three mockups, `item121-ink-build-brief.md`) **during an in-flight
deploy.** **Same mechanism as every prior item-110 stray: bytes arriving in the shared staging
checkout by a route that is not a merge.** Fable **enumerated and authorized** them for
tree-clean-at-upload; **chat 1 instead RECONCILED them away before the upload** — each was
**blob-identical (md5) to what CC-MENU landed at `2b8e5b4`**, so they were **duplicates**, deleted,
and local `main` fast-forwarded so the same bytes ride **TRACKED**. **The tree went BARE rather than
ENUMERATED — strictly better under the clean-tree law.**

**A SECOND DOOR, NAMED: `2b8e5b4` WAS PUSHED STRAIGHT TO `main` BY CC-MENU.** **Fable's standing
restatement, on the record: CC lanes push their BRANCHES; merges to `main` are chat 1's, EVEN FOR
DOCS — and `main` MUST NOT MOVE UNDER A DEPLOY.** It was harmless **only** because it was **docs-only
and a true fast-forward**, both of which chat 1 **verified before continuing, not after** (`apps/`
untouched; `6d7cdec` an ancestor). **The verification is the reason it is a note and not an
incident.**
## ITEM 128 — THE ANCESTOR-WALK INVARIANT (charter amendment) — 2026-09-07
History of ITEM 128: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**The charter gains: AN ANCESTOR WALK AT EVERY WRITE.** A board is a **recursive container**, so
without it, nesting A into B and later B into A admits a **CYCLE** — and every reader afterward
(rendering, membership, the Counsel reading contained cards) either **loops forever or silently
truncates.** **Checked at WRITE time, not read time: a cycle admitted once is a cycle every
traversal must defend against forever.**

## TOOLS TAKES ITEM 130 — 2026-09-09
History of ITEM 130: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**TOOLS owns item 130** (the cascade strip's unreachable right ~54% — **`DeskFrame.tsx` is its
territory**) **and the narrow shell's "INK" → "Pen" rename.** **The `item121-ink` branch belongs to
the INK lane; TOOLS does not continue it.**

## ITEM 131 — THE PW1 ERRATA (three, founder-confirmed live) — OPENS 2026-09-09

**BOARDS CONNECTED IS FOUNDER-CONFIRMED LIVE** at **`39eacae` · railway `479adc19`.** Nick walked it
on production and returned **three errata.** **Fix-class, PW1's own errata branch, and it takes the
box AFTER FIX** in the standing order.

**(a) CONDITION-BOARDS ARE LISTED AS CONNECTIONS — A CANON VIOLATION, and the most serious of the
three.** The three-space canon already rules, on this ledger: **"Shelf and Trash are displays of a
CONDITION (loose; deleted), NOT places."** The Plan panel's subject is **the containers that HOLD the
page** — so a condition can never appear there. **This is not a rendering bug; the panel is answering
a different question than the canon asks it to answer.**

**✓ RELEASED 2026-09-22 — Nick's 3C: reading (a) PREVAILS IN SUBSTANCE** (rows, not arrangement). This item's
text and the arrangement law below are RELEASED from founder review and stand as ratified. See *3C — SHELF
AND TRASH AS SORTABLE ROWS*, below.

**⚠ UNDER FOUNDER REVIEW 2026-09-19 — Nick's new ruling *"Shelf and Trash should be Default Boards"*
(Fable's reading; verbatim pending) may reverse the ruling below.** The text below is held INTACT; see
*SHELF AND TRASH AS DEFAULT BOARDS*.

**NICK'S RULING ON (a), and it names TWO surfaces, not one:** **the Shelf is NEVER shown as a board.**
**Condition-boards are excluded from "Boards connected" AND from the Structure lens's connection**
**line.** **RULED — errata #1 proceeds as ordered.**

*(The second surface is the part a fix scoped to the reported symptom would have missed: the erratum
was walked on the Plan panel, but the same wrong membership feeds the Structure lens. **The canon is
about what a condition IS, so every surface that answers "which containers hold this page" inherits
the exclusion.** A builder fixing only the panel would ship the violation again through the lens.)*

**(b) STALE NO-PROJECT COPY.** Superseded wording surviving on the no-project path.

**(c) A MEANING-CHANGING CRUMB TRUNCATION.** **The distinction is the whole erratum: a truncation that
ELIDES is a cosmetic limit; a truncation that CHANGES THE MEANING is a defect.** The crumb tells a
writer where they are, and a location that reads as a different location is worse than no location.

**WHY THE SUITE DID NOT CATCH (a), recorded plainly rather than excused.** It passed `pw1.mjs`'s 33
checks, both legs of a merge suite, a deploy pair, and Fable's review at the load-bearing hunks.
**None of that could have caught it: no check encodes "the Shelf is not a place."** The harness
verifies BEHAVIOUR — that the listed boards render, persist and route — and the panel did all of that
correctly **with the wrong members in the list.** **A canon violation is a claim about MEANING, and
meaning is exactly what a green suite cannot certify.** This is the same shape as item 130, where
every harness clicked a control that no human pointer could reach: **the instrument answered the
question it was asked, and the question was not the one that mattered.**

**THE FOUNDER WALK REMAINS THE ONLY INSTRUMENT FOR THIS CLASS.** Item 118 (c), item 130 and now
131 (a) were each found by a person using the product, and each had passed everything else.

**CARRIED, NOT CLOSED: the FRAGMENTS DUPLICATE OBS still stands.** It survives this ship unresolved
and is not folded into these three.

## BAND — THE BOX IS HELD BY A RUNNING SUITE, NOT BY AN ANNOUNCEMENT — 2026-09-13

**An announced turn NOT BEGUN yields to a lane that is READY.** **Re-announce the yielded turn when
that lane asks for it.**

**THE CASE THAT EARNED IT:** FIX's turn was announced at the Batch One stamp and **never started** —
no `133`/reveal/naming branch reached `origin` at all — while **TOOLS sat ready at `cd37c03`, already
merged onto `main`.** **An announcement is a grant, not a lock**, and a grant nobody has acted on
should not idle a free box.

*(Note what this does NOT loosen: the turn still comes BY ANNOUNCEMENT, never by quiet — a ready lane
asks and is granted, it does not simply take. The rule decides WHO may be granted a free box, not
whether a grant is needed.)*

## ITEM 136 — S0 ACCEPTED AS THE SCHEMA PLAN — 2026-09-13
History of ITEM 136: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**ACCEPTED for Fable review AT ITS BATCH:** **`title` text, NULLABLE, NO DEFAULT** · **boot-time
add-column (THE TENTH)** · **four server whitelist edits** · **SQL `null` → JS `undefined`** · **LWW
unchanged.**

**THIS IS A SCHEMA ADDITION AND IT CARRIES THE STANDING SCHEMA LAW: it STOPS for Nick's word.** Its
own batch, Fable review scope, and the STOP is structural — nobody has to remember it at build time.

**RULED BY FABLE, FLAGGED FOR NICK'S VETO: (4) = (a).** **An empty commit UNSETS `title` and the
STAND-IN RETURNS; WHITESPACE-ONLY IS EMPTY.** **The stand-in IS `boardName()`'s rule — first non-empty
line, trimmed, 60 cap — ONE FUNCTION for pages and boards.** *(That single-sourcing is what makes the
thirty derivations tractable, and it is `one fact, one derivation` applied before the field exists.)*

**KNOWN LIMIT — TO BE STATED IN 136's OFFER, NOT GUARDED: a pre-136 tab that pushes a record after the
deploy NULLS ITS TITLE.** **The app is served fresh on every load**, so the window is narrow. *(Stating
a limit instead of guarding it is the right call when the guard would cost more than the exposure —
but it only works if the limit is WRITTEN DOWN, which is why it rides the offer.)*

## ERRATA — WAVE 2's PAIR IS ITEM 139's FIRST LIVE PROOF — 2026-09-15
History of ITEM 139: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**Pair at `ad8b55d`, pre-flight ZERO, quiet box, token `errata-wave2-20260915`.** **It rides 55 MIGRATED
FILES, m1's park and its successor** — **and it is the first pair to run with `WS_BOX_TURN` enforced in
`withHarness`.**

**RECORDED IN ADVANCE, AS BEFORE: if this pair reds IN THE RUNNER rather than in the code, it is THE
RUNNER's red — diagnosed as such, not charged to the wave.** *(Naming it beforehand is what stops an
instrument's defect being billed to whoever happens to be holding the box when it fires.)*

**ON ERRATA's STAMP: INK's B6 announcement, pre-committed — no ask.**
## ITEM 142 — STYLUS PAST THE PAPER'S EDGE — OPENS 2026-09-16

**OPENS. ORIGIN: item 126's offer.** **The harness CANNOT drive a pen beyond the sheet, so the
lost-gesture class is UNPROVEN FOR STYLUS.** **ROUTED TO NICK's TABLET SITTING.**

*(The mouse half is proven by five checks and a mutation test; the stylus half is proven by nothing,
because no instrument in the house can reach it. This is the founder-sitting class again — a gap no
suite can close — and it is named now so the stylus is not assumed to share the mouse's verdict.)*

## ITEM 108 — NICK'S RULINGS ON THE FOUR QUESTIONS — 2026-09-16
History of ITEM 108: [2026-08](ledger/2026-08.md) · [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**✅ PRIMARY TEXT RECEIVED 2026-09-16 — Nick, VERBATIM. It REPLACES the summary below, which is kept
only as the record that the entry carried a summary for a time:**

> 1. Hold confirmed 2. Since Cards can be made into any size, have Card thumbnails match the
> proportion of each card individually. 3. Accepted 4. Skip it, but one small change to the Card tools
> menu: Instead of a heading that says 'Tags,' make the 'Add a Tag' button a '+' sign, and add a
> '-' that will 'Remove a Tag.' And add a third option that shows the list of existing tags in a
> scrollable list. These options should exist for every tool strip menu (Page, Card, Board)

**SUPERSEDED MARKER, kept:** **⚠ PRIMARY TEXT NOT IN CHAT 1's BLOCK.** Fable's relay states Nick's four rulings are **in the PLAN
desk's block, verbatim**, to be recorded as primary text there. **What reached chat 1 is FABLE's
SUMMARY, recorded below AS a summary.** **The verbatim text lands with the PLAN desk's offer; until then
this entry carries no founder words.** *(Recorded this way rather than paraphrased into quotation
marks, because a summary set in quote-marks is indistinguishable later from the founder's own text.)*

**RECORDED BY SUBJECT, NOT BY NUMBER.** The questions reached Nick numbered one way (hold-vs-reflow ·
card silhouette · FN1's source list · mockup C) and the rulings came back labelled Q-1, Q-3, Q-4 and
"mockup C" — **no Q-2, and the card question now carries the number 3.** **A number that resolves to a
different question in each document is a landmine; the subject is not.**

**FABLE's SUMMARY:**
- **BOARD FILTER — HOLD.** Cards **hold position** under a filter; they do not reflow.
- **CARD THUMBNAILS MIRROR EACH CARD'S OWN PROPORTION.** **An AMENDMENT to the thumbnail law, NOT an
  exception:** the canonical shapes are RULED (**board wide, page tall**), and **a card has no canonical
  shape because the writer chose it.** *(An exception would say "cards break the law." An amendment
  says the law was always about kinds whose shape is fixed by the house — and a card's shape is fixed
  by the writer, so honouring it IS the law.)*
- **FN1's SOURCE-LIST SHAPE — ACCEPTED.** **FN1 holds UNCONDITIONALLY today**, and **a remote source
  arrives as a CONSENTED CHANNEL** — the pattern FN8 already set.
- **MOCKUP C — SKIPPED.**

## ITEM 143 — CHAT 1's TWO FINDINGS RATIFIED INTO IT — 2026-09-16
History of ITEM 143: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

- **THE "Tags" HEADING MAY NOT EXIST IN CODE.** **The brief FINDS it before retiring it**; if it lives
  only in a mockup, that part is **pure addition**. **`pageFaceAddTag: 'Add a tag'` is the term to
  build on.**
- **TAG ADD/REMOVE IS WRITTEN FOUR TIMES OVER** (`BoardEditor`, `ScriptEditor`, `JournalEntry`,
  `PageEditor`) **and is MERGED INTO ONE HANDLER as part of 143** — **the `boardName` precedent**; the
  alternative is building three controls four times.

## ITEM 147 — THE PARK COUNT AS A CHECK — OPENS 2026-09-16

**OPENS. ROUTED TO ERRATA.** It carries three things:

**(1) ITEM 87's LATENT DEFECT — confirmed by chat 1 at the line, and sharper than "hardcoded."** The
file's parked verdict line reads:

> `ITEM87 PARKED: PASS (0 checks) — ... item 87 parks nothing ... The empty list is the evidence, not an
> omission.`

**— while the file RUNS FOUR `pok()` CALLS.** The prose was TRUE when written; **four parks were added
later (clause 1, 2026-08-17) and the summary was never updated.** **It now asserts its own emptiness AS
EVIDENCE over a list that is not empty.**

**WHY IT CANNOT REPORT A FAILURE:** the runner reds a file ONLY on a verdict line matching `/\bFAIL\b/`,
a non-zero exit, a timeout, or no verdict. **A verdict line that always says PASS can never match.** The
file DOES dump the four checks' real `pass` values as JSON just above — **so a failing park would be
PRINTED and never COUNTED.** **All four pass today: LATENT, not active.**

**(2) CD2's 13 → 10, EXPLAINED.** **(3) THE 17 FILES THAT PRINT NO PARKED LINE, made distinguishable
from files that genuinely have nothing to park.** *(A silent file and an empty file are identical in a
log — the no-blank-stamp law, one level down.)*

## ITEM 148 — ERRATA's SURVEY WIDENS THE GAP — 2026-09-16
History of ITEM 148: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

> *Epigraph: the guard's own author wrote a seam the guard cannot see.*

**THREE AXES, NOT ONE:** the gap runs along **VERB** (only four matched), **FILE** (the guard opened ONE
file) and **SHAPE** (a namespace's verb lives on its member). **41 seams across 23 files — the guard read
ONE of the 23.**

**`wrizoBible` FOUND UNWRAPPED, writing through `saveProject` from a file the guard never opened.**
**`wrizoPairing` AND `wrizoBible` ARE BOTH NOW WRAPPED.** *(chat 1's namespace catch — the verb on the
member — is carried in 148.)*

## ITEM 149 — THE PARKED-RECORDS AUDIT IS OUTSIDE THE ROSTER — OPENS 2026-09-16

**OPENS. Routed to ERRATA.** **`audit-parked-records.mjs` EXITS 1 ON `main`** from four `NO_KEY` entries —
**and it is NOT IN THE SUITE ROSTER, so NO PAIR HAS EVER SHOWN IT.** **THE ROSTER GAP IS THE DEFECT.**

**Confirmed by chat 1:** the file lives at `scripts/audit-parked-records.mjs`, **not** `scripts/harness/`,
and `run-suite` enumerates only `harness/`. **A red that nothing runs is indistinguishable, from every
stamp, from a green.**

*(The coverage law made concrete: a scan of zero files is not a clean result. Here it is an AUDIT of
zero runs — an instrument that has been reporting failure the whole time, to nobody.)*

## ITEM 150 — 37 PARKED CHECKS PASS A CONSTANT `true` — OPENS 2026-09-16

**OPENS. Routed to ERRATA.** **37 parked checks pass a CONSTANT `true`.** **A PARK THAT CANNOT FAIL
CERTIFIES NOTHING — item 87's disease AT SCALE.**

*(Item 87's verdict LINE could not say FAIL; these park CHECKS cannot either. Item 147 fixes the line for
one file; item 150 is the same defect in the assertions themselves, across 37 of them. A guard, in the
sense INK defined — a check that cannot fail on today's code — is honest only when it is DECLARED as one.
These are not declared; they are counted as evidence.)*

## ITEM 146 — OFFERED — 2026-09-16
History of ITEM 146: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**`item146-rhizome-seed`: offer at `57c4c66`, tip `ace6f76`** — verified by chat 1: **the one commit past
the offer is DOCS-ONLY** ("the ratified design point stated so no reader simplifies it").

**Its product code is the read-only seam and nothing else:** `RhizomeField.tsx` gains an effect installing
`window.__wrizoRhizomeField`, returning `sessionStart` and the built geometry.

**CHAT 1 CHECKED THAT 148 CAN ACTUALLY SEE IT — because a plan that assigns an entry nothing enforces is
not a plan.** The seam has a **double-underscore prefix** and lives in a **component**, not
`persistence.ts`. A pattern starting `\bwrizo` would NOT match it (`_` is a word character, so there is
no boundary). **148's inverted enumerator handles both:** it matches `_{0,2}wrizo` and accepts the
`(window as ...).` cast via `\)\s*\.` — and **run against 146's actual line it returns
`["__wrizoRhizomeField"]`.** **So 146's EXEMPTION ENTRY will be enforced. ERRATA had already built for
this shape.**

## BAND — A RULING THAT LANDS MID-BUILD REOPENS THE SWEEP — 2026-09-17

> **A RULING THAT LANDS MID-BUILD REOPENS THE SWEEP — A SWEEP CERTIFIES THE TREE IT WAS RUN ON.** (PW2)

*(PW2's diagnosis of its own red, registered by Fable: Nick's zone amendment arrived after PW2's sweep
had run, and renamed a label two older files assert. The sweep was right about the tree it read.)*

## ERRATA — STOOD DOWN, THREE OFFERS PENDING — 2026-09-17

**ERRATA stood down** with `147 @ 4bab0ff`, `148 @ 41f8b7c` and `146 @ 57c4c66` offered and unpaired.
**Items 149 and 150 stay routed as chat 1 recorded:** 149 is buildable browserless whenever ERRATA
returns; 150 starts after 147 lands.

**OPEN, ROUTED TO FABLE: 147's pair is next after VW1 and needs ERRATA present.** If ERRATA is not back
when VW1 clears, chat 1 proposes PW2's re-stamp goes ahead of it — the two share no file (147 touches
`item147.mjs` and `item87.mjs`; PW2's fix touches `pw1.mjs` and `ab4.mjs`), and PW2 lands before
either of ERRATA's seam-table branches in both orders. **Not acted on without a ruling.**

## ITEM 152's COST, MEASURED — 2026-09-18
History of ITEM 152: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**TOOLS HIT THE ESCAPE-COLLAPSE TWICE IN ONE BUILD.** **The second broke a file and `node --check`
caught it. The FIRST MATCHED ZERO TIMES WITH NO ERROR** — a silent no-op found only by comparing raw
bytes against an empty result. **FOURTH AND FIFTH INSTANCES OF THE CLASS IN THREE DAYS.**

**ADDED TO 152's SPEC: the check must catch the SILENT form, not only the crashing one — the silent
form is the COMMON one, and no syntax check sees it.**

> **AN ESCAPE EATEN IN A PIPELINE EITHER BREAKS THE FILE OR MATCHES NOTHING — ONLY THE SECOND IS
> SILENT.**

*(The crashing form is self-reporting, eventually — `node --check` or a runtime throw. The silent form
reports nothing at all: a guard that should have matched, didn't, and a clean run is indistinguishable
from a guard that was never needed. This is the same shape as item 141's classifier: a population of
zero proves nothing without a coverage number beside it.)*

**FABLE, ON FILE WITH 152: THE TWO INSTANCES WERE CAUGHT BY DIFFERENT HABITS, NOT THE SAME ONE.**
`node --check` caught the LOUD instance (a broken string). **The SILENT one — a needle matching zero
times — was caught by comparing raw bytes against an empty result, a SEPARATE habit.** Recording them
together would imply a syntax check covers the silent form — **precisely the false confidence 152
exists to remove.**

**THIRD BAND LINE FOR 152, beside the byte check:**

> **AN EMPTY RESULT IS A FINDING, NOT AN OUTCOME — A NEEDLE THAT MATCHED NOTHING IS INVESTIGATED
> BEFORE IT IS BELIEVED.**

*(The byte check catches the CAUSE; this catches the SYMPTOM when the cause slips past — an empty
match can come from more than a corrupted escape, so the habit of investigating it stands on its own,
not merely as 152's downstream effect.)*

## ITEM 155 — UNVERIFIED ACTS — OPENS, PARKED — 2026-09-18

**OPENS, PARKED. Harness → TOOLS.** Two shapes, neither ruled:
- **SHAPE B: IGNORED `evalJs` RESULTS — 1,443 naive matches.**
- **SHAPE E: ACTION WITHOUT A PRECEDING PAGE-STATE CHECK — 30 hits, 4 GENUINE screenshot cases in
  `fx4`, `fx5`, `fx8`, `item126`.**

**TOOLS DECLINED TO REPORT 1,443 AS A FINDING** because most are verified DOWNSTREAM and separating
them needs PER-SITE JUDGMENT rather than syntax — **THE MISCOUNTING TRAP REFUSED ON ITS OWN WORK.**
**PARKED WITH THE NUMBERS AND THE REASON; NOTHING BUILT UNTIL A SHAPE IS RULED.**

> **A NUMBER YOU CANNOT DEFEND PER SITE IS NOT A POPULATION — REPORT IT AS UNSWEPT, NOT AS A FINDING.**

*(The inverse of the census laws already on record: those said a static count undercounts what depends
on order or hides inside a string. This one says the SAME instinct that catches an undercount can
produce an OVERCOUNT if applied to raw matches without judging each — 1,443 is real as a grep result
and worthless as a finding until someone looks at each one.)*

## TOOLS' NEXT — ITEM 154 — 2026-09-18
History of ITEM 154: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**Next, per Fable's order: item 154** (the 134 in-string `evalJs` sites — two-pass parser, boundary
census first, byte-comparison verification). **NO BOX GRANT ISSUED** — building the parser and taking
the boundary census are browserless, the same standing as item 149's. Box stays idle. **Item 155 stays
PARKED — no action.**

## ITEM 156 — `bm1.mjs`'s STALE RACE COMMENT — OPENS 2026-09-19

**OPENS, in place of a re-flag. Harness/comment-scoped. NO PAIR.** `bm1.mjs:26` still reads "a race in
the READ, not a defect in the product" — describing a mechanism **item 129 already fixed through the
seam**, so the comment now points the next reader at a race that no longer exists.

**ROUTED to whoever takes `bm1` next, OR FOLDED INTO 147** — 147 already touches park lines across
files, so it costs nothing extra to carry one comment fix along with it. Chat 1's call to make when a
lane is assigned either.

> **A FLAG CARRIED IN A CONVERSATION IS LOST AT THE NEXT BOUNDARY — IF IT MATTERS, IT GETS A NUMBER.**

*(Chat 1 dropped this once, across a context boundary, by carrying it as prose rather than a ledger
item. The fix is structural, not a promise to remember better: give it a number and it survives any
boundary the same way every other open item does.)*

**✓ CLOSED 2026-09-19 — WITH A REASON, NOT AS UNRECOVERABLE.** PLAN DESK's closure is CONFIRMED by Fable:
the nuance is carried into the tag-colour foundation's §4b. See *PLAN DESK's CLOSURE*, below.

## FIX-CLASS AND FIX-DESK ITEMS — OPEN, IN ORDER — 2026-09-19

**157 — INK SHEET COVERS THE PAGE (INK, fix).** Ink is CLIPPED TO THE TEXT BLOCK's RECTANGLE, not the
paper. **Founder-ruled: the entire page surface.**

**158 — TAB INDENTS (FIX).** `Tab` on the writing surface moves BROWSER FOCUS instead of indenting a
paragraph. `Enter` is correct.

**159 — CARD POPUP STYLING DEFAULT (FIX).** The STYLING panel opens by DEFAULT on the card popup — must
be CLOSED, as it is on Page and Board — and its tab OVERLAPS the card's edge.

**160 — REMOVE OFF THE BOARD SURFACE (FIX).** The "Remove" control at the top of the board pushes the
board DOWN when a card is clicked. **Founder-ruled OFF THE SURFACE ENTIRELY — deletion moves to 168.**

**161 — TUTOR STRIP ON THE BOARD (TOOLS).** Misaligned with the board edge; its popout OVERLAPS the
edge, including its OWN TAB. **137/130's class.**

**162 — RAIL FOOT TO THE SCREEN BOTTOM (TOOLS).** Item 137 pinned Themes/Trash to the strip's foot; the
strip is `min-height: 70vh`, so the foot FLOATS mid-screen rather than sitting at the bottom.
**Founder-ruled: the VERY BOTTOM OF THE SCREEN.**

**163 — THE LOCATION LINE SAYS "IN" (PW).** The Boards Connected row shows "BOARD #2 / TEST BOARD" —
TEST BOARD is the DRAWER, read by Nick as a subtitle. **The second line takes the CAPTION FORM: "in
TEST BOARD."**

**✓ DISSOLVED 2026-09-19 — Nick scrapped board views (Fable's reading; verbatim pending).** 164 is closed
by dissolution, not answered; the probe approved below is moot.

**⚠ S0 RULED 2026-09-19, THEN OVERTAKEN THE SAME DAY:** the S0 found Q6's stickiness by elimination, not
a bug — and Fable's later reading (flagged for Nick's veto) is that item 172's board TYPES supersede the
view tabs and Q6 with them, so this question DISSOLVES rather than being answered. See *RULINGS FROM THE
FOUR S0s* and *ITEM 172*, below.

**164 — OPEN-FROM-PLAN LANDS ON OUTLINE (FIX, S0 FIRST).** Opening Board #2 from the Plan menu arrived
on the OUTLINE view, not the canvas. **MEASURE WHETHER THAT IS Q6's STICKINESS (the board's stored
view) or a WRONG DEFAULT before calling it either** — if it is Q6, the ruling goes back to Nick, since
he read it as a bug.

## PRIMARY TEXT, PENDING CONFIRMATION — Nick's IN-APP NOTES, TRANSCRIBED BY FABLE — 2026-09-19

**Applies to items 165 / 166 / 158 / 163 (the PLAN NOTE) and 159 / 160 / 167 / 168 / 161 (the CARD
NOTE).** **TRANSCRIBED BY FABLE FROM NICK's SCREENSHOTS — NOT YET HIS OWN PASTE.** Recorded as FABLE's
TRANSCRIPTION; **BECOMES PRIMARY TEXT ON NICK's ONE-WORD CONFIRMATION**, which Fable says arrives with
this relay or the next — **NO SEPARATE CONFIRMATION TOKEN IS PRESENT IN THIS RELAY**, so chat 1 records
it as still pending and will re-mark it the moment that word arrives, rather than assuming it. **Typos
and spacing are NICK's, kept verbatim** — Fable's transcription duty is to copy, not correct.

**PLAN NOTE, page 1:**

> These notes coincide with the screenshots Plan Menu 1-3. As you can see, the the Open Board popout
> is overlapping the page. It should be adjusted by percentage of the screen so that it never overlaps
> with the page. In fact, no pop-out menu should ever be overlapping the page with two exceptions: a
> right-click menu on the text or surface (which we haven't built yet), and the Card pop-up UI. Also
> note that pressing tab while on the writing surface still acts as a browser selection instead of
> creating a paragraph indent on the writing surface like it should. Pressing enter does move the line
> down correctly, though. As for the Plan menu revisions—specifically the new "Boards Connected"
> popout, a few notes: 1) Under Board #2 in the Plan Menu, it also says "Test Board" underneath it. Is
> that a second Board that's connected to "Board #2"? Because it seems to be like a subtitle or
> category for that Board. 2) Directly under Plan in the popout menu, I would like these options
> listed in this order: Create Board, Outline, Story Structure, Organize Research. Each of these
> options should open a submenu with the following options: For Create Board---Default, Worldbuiling,
> Storyboard (will probably add a few more as we go). Each of these options should show a large
> thumbnail with a sample of how these board types may differ in appearance and use with a few words
> underneath about the purpose of the board (have the Experts review all

**PLAN NOTE, page 2:**

> content-related additions I'm suggesting throughout this revised Board build); Outline—Traditional,
> Mind Map, (open to suggestions from the Experts on other kinds of outlining/brainstorming that could
> be a type of "Board."); Story Structure—two sections divided into "Storytelling" and "Screenwriting"
> with three options for each listed underneath (have the Experts choose what should go there for now
> and what the large thumbnails/descriptions should be); Organize Research—Import Sources (which opens
> a window for the user to import docs/PDFs of their research and then redirects them to a Board that
> shows all of the imported docs as Pages), Bibliography (TBD how this will interact with the
> Page/imported sources, but lets table that for now. Just put the greyed-out option in the menu as a
> placeholder). In a new subsection under the Plan menu, give the option to "Connect Board" with a
> submenu that shows all available Boards in a scrollable window when necessary (make the scroll bar
> extremely minimal). And move "Connected Boards" to here and list Boards of any kind in the popout
> sub menu that have already been connected to that Page (like it is now). 3) Tags should be listed in
> the three dot menu, and if a user clicks on one of the tags, only Boards/Pages with that same tag
> should display have the thumbnail displayed until the user de-selects the tag. If they select more
> than one, then only Boards/Pages that have both should be displayed, and so on.

**CARD NOTE:**

> Notes on what I'm seeing: The styling tab starts open when a card is opened -- it should be closed
> by default just like on the Page and Board. Also, I can't change the name "Card." I should be able
> to click on that title and rename it. Also, each new blank card should be numbered to distinguish
> them (Card 1, Card 2, Card 3...) Also, The "Remove" button at the top of the Board moves the Board
> down when a card is clicked on. That Remove option should be removed from the Board surface. If a
> User wants to delete a Board, Page, or Card, they should be able to just drag the surface into the
> trash icon in the corner. Also, we will create a right-click menu that can also include a Remove or
> Delete option. Also, notice that the STYLING tab is slightly overlapping the card edge. Lastly, the
> Tutor strip menu on the Board (which you can see in the background), is misaligned with the Board
> edge. When I open it, the pop-out menu overlaps the Board edge, including even the clickable tab
> that opens it.

**CROSS-CHECK, chat 1: the previous turn's transcribed summary (findings 1–5 and items 157–169/144)
MATCHES this fuller verbatim text on every point it summarized** — the "Test Board" subtitle reading,
the popout-percentage law and its two named exceptions, Tab-vs-indent, the styling-tab default, card
renaming and numbering, Remove's relocation plus the drag-to-trash and right-click deletion charter,
and the Tutor strip's edge misalignment including its own tab. **Nothing in the fuller text changes
any of items 157–169 or 144's amendment as already recorded — it confirms them at the source.**

## ITEM 171 — TYPEWRITER SCOPE (INK) — OPENS 2026-09-19

**OPENS. Nick's answer 5, verbatim above.** **THE RULE:** typewriter is FREE WRITE only, on TEXT pages
with NO INK. **Selecting Ink DEACTIVATES it. ANY ink on a page FORBIDS reactivating it. DRAFT AND REVISE
HAVE NO TYPEWRITER.** **Ink must be available on BOARDS and CARDS** — **S0: measure where ink is and is
not available TODAY.**

**✓ CORRECTED 2026-09-19 — Fable took the correction:** *"127 has no Draft typewriter clause; the rulings
are FX2 S2 and the doorway wave's clause 3. Fable named the wrong document."* **Item 127 STANDS. The two
superseded rulings are FX2 S2 and clause 3** — so "chat 1 MARKED ALL THREE PLACES" below reads *two*, and
the 127 marker is withdrawn in place. The paragraph is kept as written.

**WHAT IT SUPERSEDES — recorded from the ledger's own text, and chat 1 found one place where the relay's
reference does not match it:** Fable's relay says this supersedes *item 127's "typewriter can be turned
off" clause for Draft.* **Item 127's text, verbatim:** *"Typewriter on/off · when OFF, B/I/U + FONT ·
INK — nothing else"* — that is the FREE WRITE menu roster, and it says nothing about Draft. **The
DRAFT typewriter rulings live elsewhere:** FX2 S2 (*"Draft opens with typewriter ON unless the page
already holds 10+ line-equivalents"*) and its doorway-wave amendment, clause 3 (*"typewriter off on fresh
pages"*). **Chat 1 MARKED ALL THREE PLACES superseded in part, in place** (item 127's roster; clause 3 /
FX2 S2). **Fable to confirm this is the clause meant, or say which other one is.**

**IT DISSOLVES 157's (b) AND THE FADING QUESTION:** with no typewriter alongside ink there is no band to
reserve and no history to fade. **157 SHIPS AS BUILT.**

## ITEM 172 — BOARD TYPES — OPENS 2026-09-19

**OPENS. PLAN DESK charter.** Nick's answer 3, verbatim above: every board is labeled a TYPE, so a
later change to how types display is a change to a type, not a migration of boards. **THE TYPES:**
**DEFAULT** (rectangular; an open, blank, table-top surface where cards, pages, images and docs are
freely arranged and connected) · **BOOK** (the Journal IS a Book: displayed like the pages of a book,
a vertical rectangle like the Page surface; new pages become new surfaces FLIPPED THROUGH rather than
laid out at once; **CARDS are addable to a Book's pages and STAY ON THE PAGE THEY WERE ADDED TO**) ·
**BIBLIOGRAPHY** ("to be figured out later" — a unique style; GREYED OUT until built).

**THE JOURNAL IS A BOOK-TYPE BOARD. VW3's Journal-as-book IS RE-GROUNDED ON THE TYPE.**

**THE STORED FIELD:** lands in FIX's item-136 schema batch as a SECOND COLUMN beside `title`, IF the S0
says column — *one migration wave, not two.* **⚠ STANDING CONSTRAINT: any schema STOPS at chat 1 and
goes to Nick.** Fable's ruling here is on WHERE a field would land, not a schema approval.

**✓ OVERTAKEN 2026-09-19 BY A STRONGER RULING: Nick scrapped board VIEWS entirely** (Fable's reading;
verbatim pending) — see *THE FOUNDER SCRAPPED BOARD VIEWS*, below.

**FABLE's READING, FLAGGED FOR NICK's VETO:** the OPEN / STORYBOARD / OUTLINE VIEW TABS on a board are
SUPERSEDED BY TYPES — Outline and Storyboard become kinds of board per 165's submenus — and **Q6's
per-board view stickiness is superseded with them; ITEM 164's QUESTION THEREFORE DISSOLVES rather than
being answered.** **Thumbnail law gains a note: a BOOK-TYPE board displays TALL by its type.**

**✗ DISSOLVED 2026-09-19 — Nick scrapped board VIEWS entirely** (Fable's reading; verbatim pending):
**neither Reading A nor Reading B.** Both are kept below, **SUPERSEDED BY THE RULING.** Fable had sent the
question to Nick, not to the desks — *"three agreements are not a measurement"* — and he answered it by
removing its premise.

**⚠ CHAT 1 HANDS UP ONE CONFLICT, with a lean:** Nick's list is THREE types (Default, Book,
Bibliography), but Fable's reading makes Outline and Storyboard *kinds of board* too, and 165's Create
Board submenu offers Default / Worldbuilding / Storyboard (Outline: Traditional / Mind Map). **The
relation between the stored TYPE and those creation-time OPTIONS is nowhere stated.** *Reading A:* the
type set is OPEN — Storyboard and Outline are further types, and 165's options are types. *Reading B:*
the type set is Nick's three, and Worldbuilding / Storyboard / Outline are PRESETS a Default board is
born with. **Lean: A** — B leaves the retired view tabs with nothing to become, and Nick's own reason for
types ("want to display different types of boards differently") is exactly what Storyboard and Outline
are. **PLAN DESK's brief must name it; it goes to Nick if the desks read it differently.**

**⚠ SUPERSEDED IN FORM 2026-09-19 — Nick's Page-menu ruling (Fable's reading; verbatim pending)** replaces
FIX's 170 layout: 170's list BECOMES *OPEN PAGES*, FIX's branch is RE-SCOPED not discarded, and Nick's
approval of the frames *"is no longer needed in that form."* **FIX had already delivered the two frames
(`7e906d9`, 16:21).** See *ITEM 177*. The section below is kept as written.

## THE FOUNDER's PAGE, BOARD AND SPLIT-SCREEN RULINGS — FABLE's READING, PRIMARY TEXT PENDING — 2026-09-19

**NUMBERING, chat 1's rule, told to Fable so it can veto:** *a new subject gets a number; a ruling that
answers or amends an existing item is recorded UNDER that item.* **Five numbers below (177–181); seven
rulings filed under the items they belong to.**

**✓ 177 ABSORBS 170's BUILD (2026-09-20, Fable):** the merged list's heading is already "Open Pages," the
section this ruling names. What 177 still owns: the menu's order, the sorts, and the rest.

**ITEM 177 — THE PAGE MENU RESTRUCTURE (PLAN DESK) — OPENS.** Top to bottom on a Page surface:
(1) **CURRENT PAGE** with its name — editable here or in the title bar, *"Untitled" default*;
(2) **ADD TO BOARD** — a dropdown, *Create Board first*, then existing boards with their tags;
(3) **ADD TAG(S)** — existing tags visible and removable;
(4) **OPEN PAGES** — the last three created/edited, scrollable, sortable by tag, board or drawer;
(5) **PAGE SETTINGS** — today's Page Setup plus font settings (limited typefaces with an add-fonts option,
font size, line spacing);
(6) **NEW PAGE**, last.
**SUPERSEDES FIX's 170 LAYOUT: 170's list BECOMES OPEN PAGES; FIX's built branch is RE-SCOPED, NOT
DISCARDED; Nick's approval of the frames is no longer needed in that form.**

**✓ THE VERBATIM IS NOW ON RECORD, and Fable confirms all three as REAL conflicts** — restated against
Nick's own text at *THE THREE CONFLICTS, STATED AGAINST NICK's TEXT*, below.

**⚠ THREE THINGS FOR THE VERBATIM TO SETTLE — chat 1 hands them up and does not resolve them from a
summary:**
- **"Untitled" DEFAULT vs item 136.** Nick, 2026-09-13: *"my answer is 'No'"* — "Untitled" does NOT exist
  as a default name; and 167 records *"'Untitled' never appears (Nick's ruling)."* Reading 1: the
  summary's "Untitled" is only a placeholder for a page with nothing written. Reading 2: it reverses 136.
  **Until the verbatim says, 136 STANDS.**
- **"The last three ... scrollable."** A list capped at three has nothing to scroll: either it shows
  three rows at a time in a longer scrolling list, or the cap is not three.
- **PAGE SETTINGS' font controls vs the analog law's scoped FONT clause** (item 127: FONT only when
  Typewriter is OFF in Free Write) — the menu must say whether they are hidden while Typewriter is ON.

**ITEM 178 — "PAGES" IS THE TERM FOR DOCUMENTS (lexicon, sitewide) — OPENS.** His words govern: the
writer sees **"Pages"** where other apps say *document / doc / docs*; **the backend need not rename.**
**One derivation, every surface** — so the first act is a census of every string that names a document.

**✓ THE SORT HALF SHIPPED IN 170 (2026-09-20) — the PLACEMENT HALF DID NOT.** `starRank` sorts starred pages
first, ahead of every sort, in the merged Open Pages list; nothing in that diff moves the star CONTROL. See
*ITEM 170 — REVIEWED AT THE BYTES*.

**ITEM 179 — STARRING BESIDE THE TITLE — OPENS.** Starring MOVES beside the page's title, and **STARRED
PAGES SORT FIRST in any filtered list of existing pages.**

**ITEM 180 — SHELF's DRAWER GESTURE — OPENS.** An obvious control to put a Page or Board into a drawer,
**plus** dragging a thumbnail onto the **Drawers rail icon** — which OPENS the Drawers menu and lets the
writer choose while the cursor HOLDS the doc; **right-click CANCELS the hold.** *(Ties to 168: a drag onto
an icon — the Trash, the Drawers — is one gesture family; one mechanism, fix the class.)*

**✓ PLAN DESK's reading ACCEPTED 2026-09-19 (Fable): two acts, not one** — see *181 vs 116 — ABSORBED IN PART*.

**✓ RE-FILED 2026-09-19 (Fable): 181 is 116's SUCCESSOR, not new ground** — 116 was marked superseded into
165, and this is its shape. Nick's text confirms it: *Users should also be able to import images/docs onto
a Journal "board." These files should open to full size when they are double-clicked on.*

**ITEM 181 — IMPORT ONTO A JOURNAL BOARD — OPENS.** Images and docs can be imported onto a Journal board;
double-click opens them full size. **⚠ RELATION TO 116, handed up:** that is 116's shape (files placed ON a
board; a viewer on double-click), which chat 1 marked superseded-into-165 at Fable's instruction — but
165's *Organize Research → Import Sources* makes a board of imports AS PAGES, a different act. **116 is
not wholly absorbed; PLAN DESK to say which of the two survives.**

**ITEM 144 — AMENDED AGAIN — THE BOARD TAB BAR REPLACES THE VIEW TABS (PLAN DESK).** The current board is
a tab, and **"+ BOARD" beside it creates a NESTED board.** Connected and nested boards are tabs with their
title very small underneath. **The last tab is "Go Back" when the writer arrived from a page or board, and
"New Page" (auto-connected to the board) when they did not.**

**⚠ RETIREMENT HAZARD, from PW's 144 S0 — CARRY IT INTO THE TAB WORK:** `connectPage` (the nest door) and
`newPageCard` exist ONLY in the OPEN branch; `newLane` only in Storyboard; **and the sliver's copy of the
picker is NOT mode-gated.** **Retiring the view tabs retires two doors and leaves a third standing unless
each is deliberately RE-HOMED.** "+ BOARD" replaces the nest door; **the rest need homes.**

**⚠ HOLD 2026-09-19 on the MOVE clause below:** *"Cards/docs/pages/etc. should be movable back and forth
between boards"* collides with item 123's COPY-ONLY ruling. **Nobody builds a move until Nick rules** — see
*THE FOURTH CONFLICT*.

**ITEM 169 — RULED: SPLIT SCREEN.** Up to FOUR boards. **Strip menus VANISH when more than one board is
open, and those options return only at one.** Cards/docs/pages MOVE between open boards. **BOOK BOARDS
CANNOT BE OPENED CONCURRENTLY with others.** The Journal displays as the Page surface, not as a tabbed
board.

**ITEM 165 — AMENDED: CREATE BOARD PRESETS.** **Book is NOT offered** (separate Journals maybe later);
the menu's job is getting a writer creating fast, not organizing.

**ITEM 172 — RULED FURTHER:** **TYPES CANNOT CHANGE AFTER BIRTH** (172-Q, ruled). **Cards on a Book's
page: displayed and fully editable as on a board, but NO green pin.** **PAGE ARRANGEMENT IN A BOOK — not
now, recorded (PARKED clause).**

## ITEM 182 — ENTRY AMENDED — 2026-09-20
History of ITEM 182: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**Amended to Fable's wording, premise corrected: item 140 refuses a MISMATCHED token — the failure that
actually cost runs. A HOLDER CHECK GUARDS A CASE THAT HAS BEEN HIT ONCE** (FIX's 2026-09-19 pair), **at NO
COST, and whose VECTOR IS ALREADY CLOSED** by the token-out-of-the-ledger practice change. **STILL OPEN,
LOW** — routed to TOOLS after 161/162.

## OPEN, AND NOT CHAT 1's TO ANSWER — 2026-09-22

**Nick's [3] ends with a question to Fable:** *"Should I relay all of the text blocks that you haven't
received a response back from yet?"* **Recorded as OUTSTANDING so it is not lost in the consolidation —
it is Fable's to answer, and chat 1 notes only that a consolidated block which supersedes unreceived
blocks cannot itself tell him which ones were unreceived.**

**QUEUE UNCHANGED OTHERWISE. Experiment 1's lanes slot in on the proposal above.** **PW's corrected tree
`1bda06d` is STILL NOT ON `origin`** — and PW's own band now names the rule it is standing on.

## ITEM 194 — `.click()` SKIPS THE HIT-TEST IN item9192 — OPENS — 2026-09-22

**OPENS. TOOLS' class.** **PW found `item9192.mjs` drives the sliver with `.click()`, which SKIPS
HIT-TESTING** — **item 130's concealment surviving inside a PASSING harness.**

*(This is item 151's population arriving from the other side. 151 gated every COORDINATE dispatch behind
a hit-test; a `.click()` never needed one, because the DOM will dispatch it onto a covered element
without complaint. A green check that presses through an occluder is the exact thing 151 was built to
make impossible — and it was never in 151's census, because 151 counted coordinate dispatches.)*

## ITEM 176's FOURTH RED — THE PRODUCT, NOT THE ROUTE — 2026-09-23
History of ITEM 176: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**PW's diagnostic MEASURED the refusal — `{"found":false,"why":"occluded","by":"wz-strip-item"}` — and
FALSIFIED ITS OWN WAKE-CHROME THEORY in the same run: one grip, a real rect, chrome NOT receded,
`pointer-events: auto`.** **On a board at 1280, 15 OF THE SLIVER GRIP's 16px SIT UNDER THE STRIP and
hit-test to it.**

**CHAT 1 CONFIRMED BOTH CAUSES ON `main`, AND THEY ARE LIVE IN PRODUCTION** — `0` product files have
changed since the deploy (`283013e` → `1459c2a`), so what is on `main` is what writers have:
- **`index.css:2792` — `.desk-frame-stage { … isolation:isolate }`** seals the stage, **so nothing inside
  it can outrank the strip.**
- **`index.css:3136` — `--sliver-paper-pad: 0px`** on the board variant **pulls the grip into the strip's
  band.**

**THE RULING: THE STOP RULE DID ITS JOB — PW STOPPED PATCHING. THE ROUTE IS NOT REDESIGNED.** **It is the
WRITER's OWN DOOR, and it found a REAL DEFECT. Rerouting around it would HIDE THE BUG — the one outcome
worse than a red.** **176 waits on the fix, then re-runs its pair THROUGH THE SAME DOOR.**

> **A STOP RULE STOPS THE PATCHING, NOT THE FINDING. WHEN THE RED IS THE PRODUCT, KEEP THE ROUTE AND FIX
> THE PRODUCT.**

*(Chat 1 wrote the stop rule as one act — "stop patching AND redesign the route" — and the second half was
wrong. A route that keeps failing is either a bad instrument or a good instrument pointed at something
broken, and the rule as written could not tell the difference. Marked at its own entry rather than
quietly amended.)*

**REOPEN, DON'T REFILE:** **red 3's diagnosis is FALSIFIED** — its "fixture that never woke the chrome"
cannot be the cause, because the chrome was awake. **Red 1's "collapsed sliver's door" MAY BE THIS SAME
DEFECT.** **BOTH MARKED REOPENED, NOT CONFIRMED** — *an explanation that a later measurement kills does
not get to stay on the shelf as history; the red goes back to unexplained.*

## ITEM 196 — e1's DOWNLOAD RACE — OPENS — 2026-09-23

**OPENS. OWNER INK — which runs dry after its two pairs. HARNESS-ONLY, so it MERGES ON CHAT 1's
VERIFICATION.**

**e1's FOUR OFFLINE DOWNLOAD CHECKS FAILED ON THE PARKED LEG ONLY** — the same bundle passed in default.
**They READ THE DOWNLOADS DIRECTORY WHILE CHROMIUM IS STILL WRITING A `.crdownload` FILE. FIXTURE, NOT
PRODUCT.**

**THE FIX IS A LAW ALREADY ON THE BOOKS: WAIT ON OBSERVABLE STATE — the final file PRESENT, the
`.crdownload` GONE — NEVER ON ELAPSED TIME.** *(The same law the minifier episode wrote: a wait that
depends on elapsed time is a wait that can be optimised away or outrun.)*

## ITEM 197 — 0-BYTE-LOG TIMEOUTS — OPENS, UNOWNED — 2026-09-23

**OPENS, OPEN AND UNOWNED FOR NOW.** **`item84` TIMEOUT in pair 4 with a 0-BYTE DEFAULT LOG** — the parked
leg passed 57 on the IDENTICAL BUNDLE. **The same class as pair 1's `fx5`/`item83e`.**

**PW's attribution to environment BY BUNDLE IDENTITY IS SOUND — but a SECOND OCCURRENCE MAKES IT A
PATTERN.** **A 0-BYTE LOG IS AN INSTRUMENT THAT NEVER STARTED.** **WHOEVER NEXT SEES ONE CAPTURES WHY
BEFORE ATTRIBUTING IT.**

*(Chat 1 met this exact shape hours ago in its own hands: `grep -P` returned `0 lines / 0 files` and had
never run, because `-P` is unavailable in this locale and a `2>/dev/null` ate the reason. **A zero from a
thing that never started is indistinguishable from a clean result — unless someone keeps the stderr.**
That is the capture this item is asking for.)*

Registry: next free **198**.


























## TOOLING STATUS — for any fresh session's orientation
- GitHub connector: READ-ONLY (Fable reviews via read pipe; write grant
  remains Nick's open call — amended canon would land as commits).
- Desktop Commander: chronically unstable (fresh-restart-then-degrade);
  reviews run via GitHub reads, deliverables via container files.
- CC sessions launch FROM THE REPO ROOT (`writer-studio`) or the
  permissions allowlist doesn't govern.
- AGENTS.md rules ratified 2026-07-11: harness scenarios persist as
  committed artifacts; config changes propose-never-ship (2026-07-12:
  `.vscode/settings.json` auto-approve expansion ratified post-hoc as a W1
  exception — see item 5 / `docs/w1-review-fable.md` R4; the rule stands
  for future changes).
- Per-ticket harness scripts exist from J4 forward (`scripts/harness/`);
  J3/VW predate the rule (no backfill).
- **ONE CHECKOUT PER AGENT — ratified 2026-07-16 (Fable), citing this
  same day's CD1.1-fold incident (item 26) as the trigger.** Concurrent
  sessions never share a working tree. Uncommitted edits sitting in a
  tree another session can `git checkout` out from under are now a LAW
  VIOLATION, not just a risk — this happened twice in one day on this
  exact pair of tickets (CD1.1's fold vs. HB1's build), the second time
  even after the first collision had already been caught and flagged.
  Each concurrent agent gets its own `git worktree` off the same repo
  (same remotes, fully separate working trees, no collision surface) —
  never a re-clone. To add one: `git worktree add ../<name> <branch>`
  from the repo root (the branch must not already be checked out
  elsewhere — switch it out first if it is). `git worktree list` shows
  every live worktree. HB1 now builds at `../wrizo-hb1` on
  `hb1-threshold`; CD1's session keeps the original checkout
  (`writer-studio`) on `main`. Any future third concurrent agent gets
  its own worktree the same way before it writes a single file.
78. **FX17-S4 — fit to content (the board seen whole).** **OPENED — 2026-07-30
    (chat 6), on Fable's categorical ruling that FX17's S4 YIELDS.** Authority SV23, carried
    out of the P2 wave's §FX17 (`p2-wave.md`) with S1-S3 shipped as P2b. Post-vacation.
    UI/harness only; zero schema, zero server. **Scope is the MINIMAL reading of Nick's
    ask** — "as far out as needed to see the entire board" is fit-to-content, NOT a
    general zoom UI; a zoom slider is a feature and is not this item.
    **THE MECHANISM, preserved verbatim as Fable ordered (chat 6's S4 design, unbuilt):**
    fit-to-content wants no new coordinate system. Introduce a transient `viewScale` and let
    `pageWidthPx` be `base x viewScale`. Because every box's x/y/w/h is ALREADY a fraction
    of `pageWidthPx`, and because the drag delta divides by that same value, the whole board
    — positions, sizes, and the pointer math — scales uniformly and stays consistent
    for free. Fit factor is
    `min(1, availClientH / ((maxBottom + 0.08) * base), clientW / (maxRight * base))`; never
    above 1, because zooming IN is the zoom UI that waits. **NO CSS transform** — that
    would desynchronise pointer->board coords, which is precisely where FX17 S1's bug lived.
    **NO touching `canvasOverrideW`** — that is a PERSISTED document property, and
    overwriting it would make "zoom" silently mean "resize", mutating what the writer made
    (the same principle as *a limit stops; it never relocates*).
    **THE OPEN DECISION, for Nick's hardware — do not pre-empt it:** WHERE the control
    lives. `board-action-row` is selection-gated and cannot host an always-available view
    control. The always-present candidate is `board-mode-strip`, but BM1 ruled *"doors are
    doors, modes are modes"* and a view control is neither — placing it there spends a
    ratified law. The alternative is the sliver's instrument foot (FX3 S5's home for
    instruments), a larger change than the minimal reading implies. Chat 6 escalated rather
    than choose; Fable recorded it here as Nick's call.
    **DoD:** the whole board can be seen at once, and no ratified chrome law is spent doing
    it.
82. **The Spread hydration reds (`j4` + `j5`) — and the order-dependent family beside
    them.** **OPENED — 2026-07-31 (chat SC2-successor), on Fable's order.** *(Numbered 82
    as ruled; 79/80/81 are unclaimed on `main` at open time and presumed in flight in
    other lanes — a gap is safer than a collision across six lanes.)* **This item exists
    because a full suite on CLEAN `main`, with zero SC2 in the tree, is RED at both
    settings on the eve of the freeze.**
    **ANNOTATION — APPEND-ONLY, 2026-07-31 (chat 6, on Fable's order; the entry above
    stands unrewritten). THIS FINDING IS UNDER PROVENANCE REVIEW, AND ITS CONTROL DID NOT
    REPRODUCE.** Re-run at the control SHA this entry names — tree `9b30273`, served bundle
    **`index-CubIOguU.js`** (523,769 bytes), rebuilt immediately before running, committed
    runner, glob 52, both settings serially, contamination guard satisfied (no
    `--ignore-foreign`; no CONTAMINATED/REFUSED/ABORTED line on either sweep): **52/52
    CLEAN unset AND 52/52 CLEAN parked.** All five named reds passed — `j5` PASS 37 (and
    5x total, four of them standalone unset, against "failed every unset run, in-suite and
    isolated"); `j4` PASS 24 unset / 28 parked; `b2-1` PASS 28 (+5 standalone parked runs
    green, so 77(b) does not live in the file alone); `th2` PASS 42 both; `fx6` PASS 37
    both. **THE CONTROL'S OWN IDENTITY IS THE PROBLEM, NOT THE OBSERVER:** the sole
    identifier it records (a tree SHA) provably does not pin what runs — see item 77(c) —
    and this control's served bundle is UNRECOVERABLE (that worktree's `dist-web` was built
    01:36, *after* the 00:48-01:18 window, and its hash was recorded nowhere). **This does
    NOT close item 82:** "not reproduced" is not "does not happen", and DF1.1's law binds —
    clearance evidence must scale to the observed rarity, and one sweep per setting cannot
    prove a flip family absent. The reds remain real observations. Full report, including
    two REFUTED hypotheses preserved as spent (helper-injection timing; stale-browser
    reattachment across the second `withHarness` a parked run performs) and chat 6's own
    correction of an earlier over-claim, at `docs/wrizo-alpha/item82-diagnosis-chat6.md`.
    **Item 62's parked merge offer should not be unblocked on this annotation alone** —
    that is Fable's and Nick's call, not this lane's.
    **THE CONTROL, of record.** Tree `9b30273` (byte-identical to `a0ec245` under
    `apps/`), committed runner, glob 52, both settings serially, contamination guard
    satisfied honestly (no `--ignore-foreign`, zero foreign browsers at start):
    **51/52 unset — `j5.mjs` NOVERDICT. 51/52 parked — `th2.mjs` FAIL 2/42. NOT CLEAN
    BOTH.**
    **THE DETERMINISTIC ONE — `j5`, and it is the item's spine.** `waitFor timed out: lens
    row` at `j5.mjs:178`; the diag shows the app rendering **its own empty state** — "No
    loose pages yet — pages you write in the Journal will spread out here." That string is
    React conditional rendering on DATA, so the Spread had zero pages in state; CSS cannot
    produce rendered text, which is what structurally exonerated SC2's `index.css` (its
    only file with global blast radius) before any control was run. `j5` failed **every**
    unset run — in-suite and isolated, on BOTH trees.
    **THE SHARED ROOT.** `j4` fails at `j4.mjs:84`, `document.querySelector('[data-page-id
    ="..."]').click()` on **null**, with `.spread-select-toggle` already mounted and the
    entry present in localStorage. Both files use the **same** raw-localStorage vehicle
    (seed shape `source:'page', origin:'journal'`, then "reload to hydrate"), differing
    only in how many reloads precede the Spread read. That points at a **hydration race**
    — `getNotebookPages` reads an in-memory cache that re-hydrates on load, and a read
    landing before hydration renders the empty state — rather than a filter. PB1's +65
    lines in `persistence.ts` sit on that path; PB1 touched **neither** harness, and its
    51/51 green was measured at its branch tip `af47582`, **before** its merge into main
    at `e8ae17d` — the combined-tree gap SC1's merge-order hazard was written about.
    Mechanism named, NOT settled.
    **TWO MECHANISM QUESTIONS FOR WHOEVER TAKES THIS (Fable, 2026-07-31 — questions, not
    verdicts).** (1) `j4`'s shape — chrome mounted, localStorage populated, cell absent —
    is **DF1.1 species 2's exact signature, "chrome as the wrong observable," in a file
    DF1.1 never touched.** Supporting datum from the control: on main-parked `j4` fails
    *differently again* (`Failed to read the 'localStorage' property from 'Window': Access
    is denied for this document`, `j4.mjs:296`), so **`j4` carries at least two distinct
    failure modes.** (2) `j5`'s diag shows the lens row absent **together with** the empty
    state, which contradicts DF1.1's "chrome mounts unconditionally" note: with zero pages
    the lens row may not mount at all, which would make it a **consequence** of the empty
    spread rather than an independent symptom.
    **`fd57ee6` IS NOT THE ANSWER — checked, because it would have been the easy one.**
    The SC lane's own pre-rebase `j5` closure is an ancestor of **both** `a0ec245` and the
    SC2 head (`merge-base --is-ancestor` TRUE for each; it landed via DF1.1's merge
    `e2b6945`). **Both sides of the control contain the fix**, so this red is not that
    class resurfacing and cannot be mis-attributed on its absence. It is a **fourth
    species, or something `fd57ee6` never addressed.**
    **THE ORDER-DEPENDENT FAMILY, noted alongside item 77 pending mechanism.** These
    **flip between PASS and FAIL on an UNCHANGED tree**, which is why no code-level revert
    can explain them and why the memo-revert instrument was resequenced behind the
    control: **`fx6`** — "walking back a SECOND step … restoring the literal hyphens":
    `pass:true detail:"Hello--world "` unset, `pass:false detail:"Hello—world "` parked,
    same tree, same run; **`b2-1`** — parked NOVERDICT, `ReferenceError: __click is not
    defined` at `b2-1.mjs:110`, **exactly item 77(b)'s named signature**, reproduced after
    28 passing checks; **`th2`** — parked FAIL 2/42, "crossing the goal fires the
    celebration" → `false` (the brass-colour check failing as its consequence), while
    passing **42/42 unset in the same control** — celebrate-once state surviving across
    files; **`j4`** itself. Time-dependence was tested and is NOT supported by this run:
    all six branch observations fall inside one local day (2026-07-31, 00:48–01:18 MDT),
    no midnight or month rollover was crossed, and the two failure sets move in
    **opposite** directions along the time axis, which no monotonic date effect can
    produce. An August-side run remains a genuinely different test.
    **WHY THIS IS NOT A FLAKE LIST.** The known-flake list is EMPTY after DF1.1, and both
    "passes in isolation" and "the machine was quiet" are retired as clearance arguments.
    Every red here is therefore real until diagnosed. **DoD:** each red root-caused and
    fixed or lawfully parked, and a full suite green at both settings on `main` — which is
    also what unblocks item 62's parked merge offer.
    **FIX 2 — S0 ATTRIBUTION, PROVEN — 2026-08-01 (chat 6), on Fable's re-tasking
    after a stamped `j5` recurrence (SC2's fifth suite: parked, NEW site `:482`,
    Spread POPULATED with one seeded row absent). NO PATCH YET; attribution first.**
    **VERDICT: HARNESS MECHANICS, NOT PRODUCT RISK.** `j5`'s `makePage` does NOT use
    the app's save path — it is a raw read-modify-write on the journal-entries key
    (`j5.mjs:135` read, `:141` write) from the Desk; the app seam
    `window.wrizoCreateJournalPage` (`persistence.ts:680`) exists and is used by seven
    other harnesses, and `j5` never calls it. **PROVEN ON THE BOX, not named:**
    injecting a row exactly as `makePage` does and then navigating to `/journal`
    BEFORE reloading (what `j5` does at `:468`) destroys it within 100ms —
    `after inject n=1 hasRow=true` → `0ms true` → `100ms FALSE`, with `n` staying 1
    because the row is REPLACED. `JournalBoardGate` (`App.tsx:52-56`) mints the system
    board via `getOrCreateSystemBoard` → `saveJournalEntry` → `upsert` →
    `scheduleFlush` → `flush()`, and `flush()` serializes `cache[name]` WHOLESALE
    (`persistence.ts:170`) from a cache hydrated ONCE at module init
    (`persistence.ts:43-60`) and never re-read — no `storage` listener exists anywhere
    in `apps/desktop/src`. **THE IMMUNITY ARGUMENT:** every product write reaches
    storage THROUGH the cache, so a real writer's page is never invisible to a flush;
    only a fixture writing behind the cache's back can be erased. **IT ALSO EXPLAINS
    `j5`'s OTHER RED:** the A–D seeds share the exposure (inject `:145-148`,
    `goto('/journal')` `:161`, reload only `:173`) — when the 300ms `FLUSH_DELAY` wins
    that race the Spread renders "No loose pages yet", the exact 2026-07-25 symptom;
    when the reload wins they survive. **One mechanism, both symptoms, race-timed by a
    300ms debounce — which is why it flips on an unchanged tree.** `AGENTS.md:62-71`
    was obeyed in spirit and broken in ORDERING: seed off a flush surface, *reload from
    there*, THEN navigate.
    **SUPERSESSION — SC2's hypothesis stands VERBATIM.** Its "partial hydration, a
    stale-snapshot read racing landing writes" was **productively wrong**: the right
    race, the wrong side of the cache. The read is not stale; the WRITE is erased. It
    aimed the readers correctly and is left unrewritten.
    **CENSUS (Fable's item 3): 47 of 52 harness files contain raw writes to
    `writer-studio-journal-entries`; 7 use the seam** (ab3, b1, b2, fx1, th2, w1, w2).
    The count is APPROXIMATE (the pattern also matches generic `setItem(key, …)` lines)
    and **raw write ≠ exposure** — exposure needs a raw write AND a navigation to a
    flush surface BEFORE the re-hydrating reload; which of the 47 qualify is per-file
    work NOT done here. **`j4` IS NOT ATTRIBUTED BY THIS:** it uses the identical
    vehicle (`j4.mjs:63-66`) but the CORRECT ordering — it reloads at `j4.mjs:68`
    immediately, before navigating — so this mechanism does not explain it and **`j4`
    remains UNATTRIBUTED.** Recorded as a negative result, because the tempting move was
    to let the fix claim it for free.
    **ALSO FOUND:** `j5.mjs:311` asserts `makePage -> wrizoCreateJournalPage`, which is
    FALSE — a comment that answers the deciding question WRONGLY, and would tell an
    auditor this is product risk. Corrected with the fix.
    **FIX (b) APPROVED by Fable** (route `makePage` through the seam; it removes the
    mechanism rather than dodging the timing) **— not yet built.** Full report:
    `docs/wrizo-alpha/item82-diagnosis-chat6.md`.
    **FIX 1 — BUILT + VERIFIED; MERGE OFFERED — 2026-08-01 (chat 6), on Fable's
    re-tasking after SC2's fourth suite characterized the family.** Branch
    `item82-fix1-celebration-gate` @ **`7fd337c`** (WIP marker `4f12cb5` above it —
    empty, tree object identical, changes no code). HARNESS-ONLY: zero `src`, zero
    schema, zero server, zero deps. **THE SPECIES IS CONFIRMED AND THE DEFECT IS IN
    THE CHECKS.** The lead (m4/th2 both assert evental celebration paint without
    gating on the animation that reverts it) was a hypothesis; it is now reproduced.
    **THE MECHANISM, QUANTIFIED ON THE BROWSER'S FRAME CLOCK BEFORE ANYTHING WAS
    CHANGED** — the flare's real trajectory at 1366×768: `dt=0ms op 0.000`,
    `dt=30ms op 0.067`, `dt=46ms op 0.206`, … peak `0.620` (exactly the 14%
    keyframe), … `dt=961ms op 0.029`, `dt=1011ms op 0.012`, `dt=1027ms op 0.008`.
    **22% of the window sits at or below the 0.1 that `m4.mjs` asserted must be
    EXCEEDED** — roughly the first 40ms and last 120ms of a 1100ms animation. A
    100ms poll landing anywhere in that 22% failed a check about a product behaving
    perfectly. `th2`'s exposure is the same species without the threshold: it waited
    for `.mode-pfill.celebrate`, a class alive for only CELEBRATE_MS (1100ms), so one
    poll cycle stalling past that window under load misses it entirely and reports
    *"crossing the goal fires the celebration: false"*, taking the brass-colour check
    down as a consequence — item 82's th2 symptom exactly.
    **THE FIX is DF1.1's tu2 discipline applied to paint instead of to a timer:**
    record the event's whole life IN THE PAGE, on the browser's own clock, recorder
    installed BEFORE the trigger, then assert against the RECORD — so nothing depends
    on the harness looking at the right instant. `m4` keeps the PEAK opacity (the
    animation's designed maximum, not an arbitrary phase) and reads the schedule from
    `getAnimations()`; **the threshold RISES 0.1 → 0.5** (designed peak 0.62), so the
    bar got STRICTER while the flakiness went away, because it is measured where the
    value actually lives. A NEW check asserts the schedule itself — `wz-goal-flare`,
    1100ms, from the browser. `th2` keeps the SETTLED background. Every original check
    name preserved verbatim; nothing weakened, so **no park is owed**. m4 42 → 43
    checks; th2 42, unchanged.
    **OWNED:** `m4.mjs` is chat 6's own file and the 0.1 was chat 6's own number,
    chosen when M4's flare was built and sitting 22% inside the animation's
    sub-threshold band. This is not a correction of someone else's work.
    **A MISTAKE THE HARNESS CAUGHT, recorded because it is the point:** the first
    version of the th2 recorder captured the colour at FIRST SIGHT of the class and
    went red with `rgb(166, 255, 61)` — lime. `.mode-pfill` carries
    `transition: background .35s ease`, so `.celebrate` does not switch the fill to
    brass, it ANIMATES it over 350ms; the original waitFor was implicitly waiting that
    out and the rewrite had discarded it. R1 has real diagnostic power and proved it
    on this lane's own regression.
    **VERIFICATION (stamped, per 77(c)): DEFAULT `SUITE RESULT: CLEAN — tree=7fd337c
    bundle=index-CubIOguU.js/523769b` and PARKED `SUITE RESULT: CLEAN — tree=4f12cb5
    bundle=index-CubIOguU.js/523769b`, 52/52 each, zero FAIL/TIMEOUT/NOVERDICT, no
    contamination line.** (The halves carry different tree SHAs because the WIP marker
    was pushed between them; the identical bundle hash proves the same software.)
    **SCOPE BOUNDARY — BINDING (Fable):** *"defect in the checks, not the product"* is
    PROVEN **for `m4` and `th2` ONLY**. **`j4`, `j5`, `b2-1` and `fx6` remain
    UNATTRIBUTED** — check-versus-product is genuinely open for each, and the family
    must not inherit the species' verdict. That would be the same overreach shape as
    calling `j5` deterministic off four consecutive failures, which this arc has
    already paid for once.
    **AUGUST-SIDE READING (the desk's rider): this is the FIRST August-side suite.**
    Item 82's six observations all fall inside 2026-07-31; these sweeps ran
    2026-08-01T19:11:45Z → 19:58:00Z, crossing the month boundary they never did.
    Both settings CLEAN, so **date-math is weakened further — but not killed**, and
    the honest qualifier is that most harness date usage is month-agnostic
    `toISOString()` fixture stamping; the real exposure is day-offset arithmetic
    (tu1/tu2's "untouched for days" nudges), so a green count of 52 is broad evidence
    rather than a targeted test. A red appearing August-side that never appeared
    July-side would put date-math back on the table — and would now arrive naming its
    own tree and bundle.
    **CORRECTION — 2026-07-31, SAME LANE, ON NEW EVIDENCE. THE "DETERMINISTIC ONE" FRAMING
    ABOVE IS FALSIFIED; IT IS LEFT STANDING VERBATIM AND CORRECTED HERE, NOT REWRITTEN.**
    A fourth suite of record at `9503515` — run in a COORDINATED quiet window under the
    provenance discipline (bundle `index-DSrJF9Jz.js`, SC2-only markers `script-sequence` +
    `script-page-number` proven present in both bundles before the run) — came back
    **53/53 CLEAN at `HARNESS_PARKED` unset**, with **`j5` PASS (37 checks)** and **`j4`
    PASS (24 checks)**. `j5` is therefore **NOT deterministic.** The earlier claim
    generalised from four consecutive failures; four consecutive failures of a race are
    still a race, and the word was too strong for the evidence.
    **THIS IS NOT EXPLAINED BY CONTENTION, WHICH WAS CHECKED BEFORE THE CORRECTION WAS
    WRITTEN.** `run-suite.mjs` aborts VOID if a foreign harness browser appears mid-run;
    the original suite of record (53 files) and the clean-`main` control (52 files) both
    ran their full lists WITHOUT voiding, so both were measured on a quiet box. The
    reds were real observations on a quiet machine; what was wrong was the CLASS assigned
    to them, not the sightings.
    **THE ITEM IS THEREFORE ONE FAMILY, NOT TWO.** `j4`, `j5`, `b2-1`, `fx6`, `th2` and
    `m4` are all **order/timing-dependent races**; item 82 has no deterministic spine and
    the hydration-race mechanism named above now covers `j4`+`j5` as members of the family
    rather than as a separate class. **`m4` joins as the sixth witness** (parked FAIL 1/42:
    "S4 (Bar): the flare is ORANGE … at a real (non-zero) opacity" measured `opacity:"0"`,
    while passing 42/42 unset **in the same run**) — and `m4`+`th2` are plainly the SAME
    species: both assert **evental celebration paint that reverts**, and both were caught
    mid-fade. That pairing is the most tractable lead in this item and is where a
    successor should start: an assertion that races an animation it does not gate on is a
    defect in the CHECK, not necessarily in the product — the reciprocal of the lane
    practice that a timing claim carries a correctness gate.
    **WHAT SURVIVES THE CORRECTION UNCHANGED:** clean `main` was observed RED at both
    settings (51/52 unset, 51/52 parked) on a quiet box, so the freeze-eve finding stands;
    nothing was ever attributed to SC2; and `fd57ee6` is still an ancestor of both control
    trees, so it is still not the answer.
    **→ FIX 1 MERGED — 2026-08-01 (chat 1), merge `c228c4b`.** The DO-NOT-MERGE marker
    `4f12cb5` honored-through per the 77(c) precedent (Fable-ratified): **verified** empty,
    tree object identical to the fix `7fd337c` (tree `7574bd9`), so the merged tree IS the fix
    (stamped 52/52 CLEAN both settings). Harness-only (`m4.mjs` +104, `th2.mjs` +71); no
    re-verification owed, browserless. **m4/th2 attributed to the checks; `j4`, `j5`, `b2-1`,
    `fx6` remain UNATTRIBUTED** (the family does not inherit the species' verdict). SC2's merge
    sequence keys on this.
    **→ REVIEWED, GREEN (2026-08-01), Fable** — `docs/wrizo-alpha/item82-fix1-review-fable.md`;
    VERDICT PASS. Defect documented where it lived (m4's frame-clock trajectory, th2's .35s
    settled-value trap); recorders install BEFORE the trigger, the harness reads the RECORD;
    m4 threshold 0.1→0.5 at the designed peak (`getAnimations()`); one check added, every
    original name preserved, strengthened in place, no park owed. OBS (non-urgent): th2's
    opening comment says "MutationObserver" but the impl is an rAF sampler — one-word fix, next touch.
    **→ FIX 1 CONFIRMED IN SITU BY SC2'S FIFTH SUITE OF RECORD — 2026-08-01, tree `fd6713a`
    (SC2 rebased onto `6ec5a85`, fix 1 beneath), bundle `index-DSrJF9Jz.js/529099b`,
    coordinated window.** `m4` PASS **43** checks (42→43, the added recorder check) and `th2`
    PASS **42**, **green in BOTH passes.** The species is retired from the family by
    observation, not by inheritance. **Result: 53/53 CLEAN unset; 52/53 parked — `j5`
    NOVERDICT.** No merge offer: the gate is green at BOTH settings and it was not met.
    **THE ROOT AS RECORDED ABOVE IS REFINED BY THIS OCCURRENCE — PARTIAL, NOT EMPTY.** This
    item's mechanism paragraph names a hydration race producing an EMPTY spread ("No loose
    pages yet"). That is the shape of the earlier sightings; it is **NOT** the shape of this
    one, and a successor reading only the paragraph above would chase the wrong thing.
    Failure site is **`j5.mjs:482`, not `:178`** — `waitFor timed out: spread row j5-src-7
    present, then clicked` — and the diag shows the Spread **POPULATED**, lens row and
    controls present:
    `buttons:[… "Close","Your order","Newest","All","Text","Ink","Text+ink","☆ Starred",`
    `"Alpha text only.1","A sketch2","Delta has both.3","Golf comes first in the`
    `notebook.4","Hotel comes second in the notebook.5"]` — five rows rendered, **`j5-src-7`
    absent.** Zero checks emitted before the throw (buffered JSON → NOVERDICT).
    **THE SHARPER HYPOTHESIS FOR FIX 2:** the cache does not fail to hydrate, it hydrates a
    **STALE SNAPSHOT** — a Spread read racing seed writes that are still landing, so the
    EARLIER pages appear and the LATER ones do not. That subsumes the empty-spread sightings
    as the degenerate case (read lands before write 1) and explains why one file fails at
    DIFFERENT SITES on different runs: the race can bite anywhere in the seed sequence, and
    the site merely records where it bit. Empty vs partial is one mechanism at two amplitudes,
    not two defects.
    **`j4`, `b2-1`, `fx6` STAY UNATTRIBUTED AND QUIET — NOT RETIRED.** None of them reproduced
    in the fifth suite; that is an absence of evidence and nothing more. They are not cleared,
    not parked, and not to be cited as fixed by fix 1 — the family does not inherit the
    species' verdict in either direction. **`j5` is fix 2's target.**
    **→ FIX (b) BUILT + VERIFIED; MERGE OFFERED — 2026-08-17 (SC-chain lane). Branch
    `item82-fixb-j5-seam`, code commit `bc6f53c`, parented at `main` @ `7abd1e7` (the
    fw2 merge `a18115c` beneath it).** **→ MERGED `e9ea36c` (2026-08-17, chat 1, on
    Fable's merge order + Nick's "Merge it"): the merged `apps/` tree is BYTE-IDENTICAL to
    the stamped `bc6f53c` (55/55 both settings, bundle `index-Ch4juzEe.js`); ITEM 100
    opened, registry next free 101. NO DEPLOY — merge on green; fix (b) rides the next
    ship (P2c) on Nick's word.** `j5`'s `makePage` now seeds THROUGH
    `window.wrizoCreateJournalPage`, so the row enters the cache and no flush can erase
    it — the mechanism REMOVED, not out-timed, which is what Fable's (b)-over-(a) ruling
    asked for. The seam gained an optional `JournalPageSeed` (`id` / `text` / `createdAt`
    / `strokes`) — exactly the four things it minted for itself and `j5` therefore could
    not use. **CENSUS, and it is why this is small: `createJournalPage` has ZERO call
    sites in `apps/desktop/src`** — reachable only through the window seam (the two other
    mentions are comments naming it as Catch's model). The product blast radius is EMPTY,
    not merely small. Every field optional, every fallback the old expression, `strokes`
    set only when seeded so an unseeded row stays byte-identical. **`updatedAt` is
    deliberately NOT seedable and not faked** — `upsert` stamps it, and neither of the
    file's orderings reads it (`notebookKey` is `orderIndex ?? createdAt`; the Spread's
    "Newest" lens sorts `createdAt`), so ordering is unchanged by construction. Zero
    schema, zero server, zero deps.
    **THE MECHANISM RECORD GAINS ITS TRIGGER — the append Fable ordered, and the piece the
    paragraphs above named only as "the next flush of that collection."** The flush is not
    incidental to this file's navigation; `/journal` fires it two ways. (1) MOUNTING it
    mints/reconciles the Journal system board (`JournalBoardGate` →
    `getOrCreateSystemBoard` → `saveJournalEntry` → `scheduleFlush`), a 300ms debounced
    write of `journalEntries`. (2) **UNMOUNTING it calls `flushNow()` UNCONDITIONALLY —
    the bare call in the effect's cleanup, OUTSIDE the
    `boxesRef.current !== lastSavedRef.current` guard that gates the `visibilitychange`
    path immediately above it; `BoardEditor.tsx:983` at tree `bc6f53c`.** Cited by ANCHOR
    as well as by line on purpose: it was `:982` when this lane measured it on 2026-08-03,
    and fw2's merge moved it one line (a single import at `BoardEditor.tsx:11`) without
    touching the effect. A line number is measured at a head and does not survive an edit
    above it. `flush(name)` writes ONE collection; `flushNow()` writes EVERY collection.
    Both serialize the cache WHOLESALE over rows the cache has never held.
    **THE ARITHMETIC, which is why the item flipped on an unchanged tree.** `app.goto`
    sleeps 200ms (`runtime-verify.mjs`); the mount's flush lands at 300ms; and
    `scheduleFlush` does **NOT re-arm** (`if (flushTimers[name] !== null) return` — the
    timer is 300ms from the FIRST write, not the last). A fixture that seeded raw and then
    navigated to `/journal` therefore had roughly **80ms** to get its reload in. Win that
    race and the pages survive; lose it and they are erased by a write the fixture never
    made. **That one window produces BOTH recorded symptoms, and the amplitude is simply
    how many rows had already been rehydrated into the cache when the flush landed** —
    A–D erased at the first navigation gives the empty Spread and "No loose pages yet"
    (the 2026-07-25 sighting); the same window one slice later takes E alone, with A–D and
    G,H already cached, giving the POPULATED Spread missing exactly `j5-src-7` at
    `j5.mjs:482` (the fifth suite of record). **The "empty vs partial is one mechanism at
    two amplitudes" hypothesis recorded above is CONFIRMED, and the amplitude now has a
    CAUSE** rather than being a description of it.
    **THE FILE'S THREE OTHER RAW WRITES WERE CHECKED AND MOVED, under the seeding law's own
    clause** (*"any edit to one of the 47 raw-writing harness files checks that file's own
    exposure before it lands"*). All three were exposed; all three now seed from the Desk
    and reload BEFORE navigating (the original M1 ordering rule), with every navigation
    they performed KEPT and moved after the reload, and nothing asserted changed. **The
    star/tag patch was not optional:** post-fix, A–D are safe in the cache but that patch's
    `starred`/`tags` would have become the flush's NEW casualty — fix (b) would have traded
    a page-loss race for a lens-flag race, and a seam page carrying a raw amendment is the
    half-migrated shape the law forbids. The StoryPlan seed is narrower and recorded as
    such (a scheduled `flush(name)` writes one collection, so the board's flush never
    threatened `writer-studio-story-plans`; only a `flushNow()` does).
    **TWO COMMENTS FALSIFIED AND CORRECTED IN PLACE** (prose, not committed assertions — no
    park owed): *"Navigate away from the entry view FIRST"* (there has been no entry view
    since FX14 S2, and the `/journal` it fled to is the hazard), and a `waitFor` labelled
    **`'Journal Board (safe pre-seed landing)'`** — which named the hazard as the refuge,
    and under which the board seed had been running inside a ~40ms margin. The B1 park
    sweep's own navigation is KEPT; only the seed steps off it.
    **`j5.mjs`'s `makePage -> wrizoCreateJournalPage` COMMENT IS TRUE AGAIN, BY
    CONSTRUCTION** — annotated rather than silently repaired, so the record shows it was
    false from FX14 S2 until this fix, that item 82's own diagnosis caught it, and that the
    fix moved the CODE back rather than weakening the CLAIM.
    **VERIFICATION (stamped, per 77(c)): DEFAULT `SUITE RESULT: CLEAN — tree=bc6f53c
    bundle=index-Ch4juzEe.js/525431b` and PARKED `SUITE RESULT: CLEAN — tree=bc6f53c
    bundle=index-Ch4juzEe.js/525431b`, 55/55 each, zero FAIL/TIMEOUT/NOVERDICT, no
    contamination line, committed runner, rebuilt immediately before running, no
    `--ignore-foreign`.** Identical tree AND bundle across both halves. `j5` PASS **37**
    in both. Standalone repeats scaled to the observed rarity per DF1.1's law: **8/8 unset
    + 8/8 parked at this head, plus 11/11 unset + 10/10 parked at `85a094c` — 37
    consecutive standalone runs across both heads, zero verdict failures.**
    **THE PRE-REBASE STANDALONES CARRY, AND THE CARRY IS MEASURED RATHER THAN ARGUED**
    (Fable's ruling, 2026-08-17): `git diff 85a094c bc6f53c -- apps/desktop/src/store/
    persistence.ts apps/desktop/scripts/harness/j5.mjs` returns **EMPTY (0 lines)** —
    fix (b)'s two files are byte-identical across the rebase, so fw2 never touched this
    mechanism and the earlier rarity evidence describes the same software path. The 16 runs
    at the new head are additional, not a replacement; the carry does not have to bear the
    claim alone.
    **A FIRST STAMPED PAIR WAS DISCARDED RATHER THAN CITED, and it was GREEN.** It ran at
    tree `85a094c` (**54/54 CLEAN both settings**, `j5` PASS 37 both). **Sequence, stated
    exactly because the ruling that reached this lane assumed a different one:** the pair
    had already RUN TO COMPLETION before fw2's merge was detected — the discovery came from
    the fetch performed immediately after reading its stamps, so there was no running sweep
    left to abort and none was aborted. What was spent is ~90 minutes of box time whose
    output cannot be cited; what was NOT spent is any evidence claimed at a stale head. That
    stamp named a tree fw2 was not in — the unfalsifiable identity 77(c) exists to close —
    so it is recorded here as a green observation and is **not** the offer's evidence.
    **Re-running was not ceremony: fw2 changed `BoardEditor.tsx` (+92), the very surface
    this mechanism turns on, and the rebuild proves the software genuinely differed**
    (bundle `index-Cj7zbELe.js` → `index-Ch4juzEe.js`). Checked before re-running rather
    than assumed: fw2's hunks land at lines 11, 1160 and 2184 and leave the unmount cleanup
    intact, so the mechanism stands and only its citation moved.
    **ONE BOOT CRASH IS RECORDED RATHER THAN SWALLOWED, because the known-flake list is
    EMPTY and "it passed on the retry" is a retired clearance argument.** The first
    standalone attempt of the day died in 2s BEFORE any check ran:
    `EBUSY … open '…\ws-runtime-verify-<pid>\DevToolsActivePort'`. The mechanism is legible
    in shared infra and is NOT this fix's: `readCdpPort` (`runtime-verify.mjs:281-289`)
    polls `existsSync` and then calls `readFileSync` **with no `try`/`catch`**, so a read
    landing while the browser still holds that file dies instead of polling again. It is a
    DIFFERENT species from DF1.1's stale-profile-dir root cause (that one is a fresh process
    finding an OLD port file; this is a fresh dir whose file is mid-write), and the one-line
    cure is obvious — but `runtime-verify.mjs` is shared infra, and patching it
    mid-verification would taint this lane's own provenance. **Recorded unfixed and
    unclaimed; a ticket is owed to whoever owns the harness floor.** It did not recur in 37
    subsequent standalone runs or in any of the four sweeps. **→ OPENED AS ITEM 100 on
    Fable's ruling (2026-08-17); see its own section in this ledger's top matter. It is NOT
    a member of item 82's family** — it produces a boot crash with a stack trace and never a
    check verdict, so it cannot be a hidden explanation for any of this item's reds.
    **SCOPE HELD.** The star/tag patch and the seed Board row are **still raw writes** —
    neither has a seam to migrate to (`starred`/`tags` are an AMENDMENT to an existing row
    and no `wrizo*` seam exposes one; the seed Board is a `pageType:'board'` page with
    pre-seeded `boxes`, and `createBoardPage` is neither exposed nor takes boxes).
    Authoring those seams is **item 85 phase 2's** work and is not smuggled in here. The
    census is NOT re-derived — chat 6's 47-of-52 keeps its caveat verbatim; this build
    qualifies exactly one file. **`j4`, `b2-1` and `fx6` STAY UNATTRIBUTED** — `j4` uses the
    identical raw vehicle with the CORRECT ordering (reloads at `j4.mjs:68` before
    navigating), so this mechanism still does not explain it, and it inherits nothing from
    this fix in either direction. **NO PARK IS OWED:** every check name preserved verbatim,
    nothing weakened, count unchanged (37 live + 3 parked).
    **WHAT THE GREEN PAIR DOES AND DOES NOT DO.** It closes `j5`'s attributed mechanism —
    the one member fix 2 proved — and nothing else. **It does not close item 82.**

    **SIGHTING APPENDED — `m3`, three data points, from the MENUS lane (item 83),
    2026-08-27.** Not a park and not a clearance: reported here because it is this
    family's signature and this lane has no standing to rule on it.
    **The assertion:** *"the saturated live ground ROAMS — its rendered extent reaches
    near all four stage margins"* — the Rhizome's ambient growth layer.
    **The three runs, on code that never touched the rhizome:** 2026-08-04 run 1 PASS;
    2026-08-04 run 2 **FAIL**, identical bundle, same box, minutes apart; 2026-08-05
    (S4, merged tree) PASS. An assertion on an ANIMATED extent that alternates between
    runs of the same bytes is exactly the order/timing-dependent species this item
    characterized (m4, th2, j4, j5, b2-1, fx6).
    **DELIBERATELY NOT CLEARED.** The known-flake list is empty by DF1.1, and both
    *"it passed in isolation"* and *"the machine was quiet"* are retired as clearance
    arguments — so two greens around one red do not settle it. What the menus lane can
    say is narrower and is all it says: **nothing in the menus wave touches the rhizome**
    (proven by diff), so this red is not the wave's and the wave inherits nothing from
    it in either direction. Whether the assertion should pin an animated extent at all,
    or should measure the roam over a window instead of at an instant, is item 82's
    question to answer, not this lane's.

85. **The raw-write remediation — harness seeding migrates to the app's seams.**
    **OPENED — 2026-08-01 (chat 6), on Fable's word, from item 82 fix 2's proven
    mechanism.** Post-vacation. Harness-only in phase 2; phase 1 is analysis.
    **THE SEED — chat 6's census, with its caveat carried VERBATIM because the caveat
    is the load-bearing part: 47 of 52 harness files contain raw writes to
    `writer-studio-journal-entries`; 7 use the app seam** (ab3, b1, b2, fx1, th2, w1,
    w2). *"The raw-write count is APPROXIMATE — the pattern also matches generic
    `setItem(key, …)` lines whose key is bound elsewhere — and should be re-derived per
    file before anyone acts on it. Raw write ≠ exposure. Exposure requires BOTH a raw
    write AND a navigation to a flush-handler surface (or any `flushNow()`) BEFORE the
    re-hydrating reload. Determining which of the 47 are exposed is per-file work and is
    NOT done here."*
    **WHY IT EXISTS:** `persistence.ts` hydrates its cache ONCE at module init, never
    re-reads it, and no `storage` listener exists in `apps/desktop/src`; `flush()`
    serializes that cache WHOLESALE. A row written to localStorage after boot is
    therefore invisible to the app and is ERASED by the next flush of that collection —
    from ANY source, including one the fixture never touched. Proven at item 82 fix 2
    (a Desk-injected row destroyed within 100ms by `JournalBoardGate` minting the system
    board). A real writer is immune, because every product write reaches storage THROUGH
    the cache; this is a harness-only hazard, which is why it survived this long.
    **TWO PHASES, in order.** **Phase 1 — QUALIFICATION, per file:** for each of the 47,
    determine whether it is actually EXPOSED (raw write + a flush-surface navigation or
    `flushNow()` before the rehydrating reload). Produce a qualified list; the census
    count is a starting set, never a defect list. **Phase 2 — MIGRATION, batched:** move
    qualified files to the seam, so the mechanism is removed rather than the timing
    dodged (item 82 fix 2's own ruling: (b) over (a)).
    **QUALIFICATION MAY ATTRIBUTE OTHER ITEM-82 MEMBERS — but EVIDENCE PER MEMBER, NEVER
    INHERITANCE.** `fx6` or others may turn out to be exposed and thereby explained.
    They are NOT explained until their own exposure is demonstrated. Precedent set at fix
    2: **`j4` uses the identical raw vehicle (`j4.mjs:63-66`) and is NOT attributed** —
    its ordering is correct (it reloads at `:68`, immediately, before navigating), so the
    mechanism does not explain it and `j4` remains unattributed. That negative result is
    the standard this item holds itself to.
    **GUARD UNTIL IT LANDS:** `AGENTS.md`'s seeding law gained its successor on the same
    date — *seeding goes through the app's seams, never raw storage* (the ordering rule
    kept verbatim above it, this mechanism as its reasoning). New seeding goes through
    seams, and any edit to one of the 47 checks that file's exposure before it lands.
    **DoD:** every exposed harness seeds through a seam; the census re-derived exactly;
    each item-82 member either attributed on its own evidence or explicitly left open.
88. **The Page-panel filing incident — affordance illegibility, and three defects
    under it.** **OPENED + S0 RESOLVED AT THE EVENT LEVEL — 2026-08-02 (chat 6), on
    Fable's trip-critical order. ZERO DATA LOSS.**
    **THE EVENT (production, Nick's laptop):** on a NEW EMPTY page, opening the Page
    icon's panel and clicking "Poop" did not navigate — it toasted *"Filed to Poop."*
    Poop was then findable in neither Journal, Shelf, panel, nor the Everything export
    (111 pages, zero mentions).
    **RESOLUTION: "Poop" IS A BINDER, AND IT EXISTS.** A whole-store console search
    (`Object.entries(localStorage).filter(([k,v]) => v.toLowerCase().includes('poop'))`)
    returns **`['writer-studio-projects']`** and one project object — screenshot on
    file. Every negative is explained without loss: a binder lives in Drawers, not
    Journal or Shelf; and the Everything export walks PAGES, so a binder's NAME would
    never appear in it. **The production Postgres query was CANCELLED as unnecessary**
    — recorded as NOT RUN rather than inconclusive.
    **A NEAR-MISS WORTH RECORDING:** the Railway CLI reachable from this lane's
    worktree was linked to project `fabulous-essence` / service `pandoras-box` — an
    unrelated production system — while the primary checkout had NO link at all. A
    `railway run` issued without checking would have injected another product's
    production credentials. `railway status` has no project flag, so retargeting
    requires `railway link`, which mutates shared CLI state; this lane declined to do
    that unilaterally and reported instead.
    **(i) THE SURFACE IS CONFIRMED:** `CascadePanels.tsx:249-253` composes the Page
    face as `<PageFace subject={subject} />` (the Port/Pin verbs) followed by
    `<PlacesPanel entry={subject.entry} />` (the filing targets); the toast string is
    PlacesPanel's own (`PlacesPanel.tsx:66`). One panel — and the clicked row was a
    filing TARGET, not a navigation door, which is the whole incident.
    **88 — AFFORDANCE ILLEGIBILITY (the parent; REDESIGN routes to the MENUS ARC,
    items 83/84):** a list of binder names inside the current page's panel reads as
    "places I can GO" and is in fact "places I can PUT THIS". Nothing distinguishes a
    door from a destination. The redesign belongs to the menus arc because this panel
    is their chrome; only the defects below belong to the fix wave.
    **88a — NO VALIDATION ON THE FILING TARGET (defect → wave).** `setPageHome`
    (`persistence.ts:1380-1389`): anything not `'shelf'|'loose'|'journal'` is assigned
    straight to `entry.projectId` as "a binder id", with NO existence check. A page
    given a projectId matching no live binder is invisible to EVERY enumerator — not
    the Journal (`projectId == null` filter), not any binder's page list, not the
    Shelf. **A code-level YES to the question of whether a filing mutation can render a
    row invisible to everything including export.** Not the cause here (Poop is a real
    binder), but a live hazard on its own.
    **88b — THE LYING TOAST (defect → wave).** `PlacesPanel.tsx:63-67` — `fileTo`
    calls `setPageHome`, then `flushNow()`, then toasts `Filed to ${label}.`
    UNCONDITIONALLY. `setPageHome` early-returns when `getJournalEntry` misses, which
    is exactly the case for an UNBORN page under PB1 (an unborn row deliberately never
    enters the store). So on a new empty page — the incident's own condition — the
    toast reports a filing that never happened. Success is not conditioned on success.
    **↑ THAT DIAGNOSIS IS FALSIFIED — 2026-08-03 (fix lane). Kept verbatim above and
    corrected here, per the park-never-rewrite discipline.** `getJournalEntry` does NOT
    miss on an unborn page: it **falls through to the unborn slot** (its own tail,
    `return unbornSlot && unbornSlot.id === id ? clone(unbornSlot) : null`). The entry IS
    found, and the old code mutated it and handed it to `saveJournalEntry` — which put it
    in the cache, marked it dirty, and scheduled it to disk. **Filing an unborn page never
    no-opped and the toast never lied: it BIRTHED AN EMPTY PAGE through a side door**,
    bypassing `birth()`, leaving `setUnbornEntry(null)` uncalled (the slot kept holding
    the same id), and minting exactly the `text: ''` litter PB1 exists to prevent. The
    real defect was worse than the recorded one and in the OPPOSITE direction — a WRITE
    where the record alleged a no-op. Found because `item88.mjs` was written to the
    RECORDED mechanism and went red on the first run against the FIXED build: the harness
    falsified the brief, which is the whole reason a scenario is written before it is
    trusted.
    **88c — THE BINDER-RENDER GAP (defect → wave; ONE READ OUTSTANDING).** Poop does
    not render in Drawers, and the enumeration does not explain it: `getProjects()`
    (`persistence.ts:219-221`) filters only `!p.deletedAt`, and `DrawersTree.tsx:36-37`
    renders orphans (no drawerId, or a dead one) under an unsorted group with NO
    kind/type filter — so a live binder SHOULD appear. Two possibilities remain, with
    different fixes: Poop carries `deletedAt` (a DELETION path, not a render gap), or
    it renders and was not recognised (a LEGIBILITY gap). **Settled by one console line
    on Poop's own record — id/title/kind/type/drawerId/deletedAt/createdAt/updatedAt —
    not yet run.** Related, visible in the same tree: **UNTITLED-BINDER LITTER** —
    `createBinder` (`persistence.ts:249-253`) writes the literal string `'Untitled'`
    when given an empty title, so any path calling it without a name mints an
    indistinguishable binder. A census line over `writer-studio-projects` is owed.
    **TWO WAVE FINDINGS FROM THE ADDENDUM, independent of Poop:** Trash items are
    UNINSPECTABLE (nothing opens when clicked), and Trash renders NO DATES.
    **INTERIM RULE (relayed to Nick; in force until the affordance is redesigned): the
    Page panel is off-limits.**
92. **The New-page-card that never lands — S0 PROVEN, unbuilt.** **P1 (S12) — MECHANISM
    ESTABLISHED, NO PATCH — 2026-08-03 (fix lane).** Nick's S0 was owed before any patch;
    it is paid here, and **the hypothesis in the sitting log is not supported.**
    **NOT the cause: "Plan may have minted a second board."** `onAddPageCard`
    (`BoardEditor.tsx:1162-1166`) genuinely creates a real row AND pins it — the act is
    not a store-level no-op. And the door is **absent on system boards**
    (`beginningDoors`, `:1704`: `isSystemBoard ? [] : (...)`), so `reconcileSystemBoard`'s
    stale-pin removal — which really does delete pins whose page stops qualifying — cannot
    reach it: BoardEditor's reconcile effect returns early for user boards (`:935`).
    **THE ACTUAL MECHANISM — a stale-local-state overwrite, and the codebase already
    names the law it breaks.** `pinPageToBoard` writes the BOARD's row **in the store**.
    BoardEditor holds its cards in local React state (`const [boxes, setBoxes] =
    useState(() => initialEntry?.boxes ?? [])`, `:658`) which is initialized ONCE and, on
    a user board, never re-read — the `subscribe()` that would refresh it is inside the
    system-board-only reconcile effect. `onAddPageCard` never calls `setBoxes`. So the
    component's `boxesRef.current` still holds the PRE-PIN array, and the next save from
    that instance writes it back over the pin: the unmount cleanup (`:981`,
    `if (!unbornRef.current && boxesRef.current !== lastSavedRef.current)
    saveBoardBoxes(id, boxesRef.current)` followed by `flushNow()`) fires on the very
    `navigate('/page/:id')` that door performs, and the debounced autosave (`:964`) does
    the same after any later interaction. **The card is written and then erased by the
    surface that created it.**
    **The convention this violates is already documented, three hundred lines above the
    offending call.** `BoardEditor.tsx:665-676` (B3 S3) states it verbatim: deck cards are
    appended "via the SAME setBoxes path any other card creation already uses —
    BoardEditor's own existing debounced autosave effect persists them, exactly like
    onAddCard above. **A direct saveBoardBoxes call here instead would race that same
    debounced autosave (the harness seeding/flushNow race this project has already
    diagnosed once, generalized)**." `onAddPageCard` is the one card-creating door that
    reaches around `setBoxes` into the store — the identical race, in the product this
    time rather than a harness.
    **FIX SHAPE (unbuilt, for the next lane):** route the new card through `setBoxes` like
    every sibling door, or re-read the board after `pinPageToBoard` and `setBoxes` the
    result before navigating. **NOT patched here** — the fix is small but it is a P1
    behind two P0s, and this lane will not ship a board mutation it cannot also put a
    stamped suite behind.
    **RELATED, found in the same trace and NOT the same bug (worth its own ticket):**
    `getJournalEntry` returns null for SOFT-DELETED rows (`persistence.ts:1545`), so
    trashing a plan board makes its page's `planBoardId` pointer dangle, and the next flip
    re-mints (`getOrCreatePlanBoard`, `:1616-1620` — "Pointer dangles (board hard-gone) —
    fall through and re-birth below", which also fires for merely soft-deleted). **That IS
    a genuine second-plan-board path** — the sitting log's instinct was sound, just aimed
    at the wrong symptom.
    **ALSO FOUND, and it makes 91 and 92 likely ONE fix:** `birth()` accepts
    `opts.pinToBoardId` and `UnbornSurface.birthWith` threads it through — but **NO call
    site anywhere supplies it** (the only four `birthWith(` callers pass content only).
    The capability is dead code, and `UnbornDescriptor`/`unbornHref` have no pin field to
    carry it, which is exactly the seam Nick's item-91 verdict asks for ("a New Page
    carrying the board's binder/pin descriptor via `unbornHref`"). Building 91's descriptor
    is what would make 92's door able to say "born pinned here" in one act.
87. **The New Page's defaults — a ruled default AMENDED, not flipped.** **P1 (S3) —
    BUILT, `tsc` CLEAN, ***NOT VERIFIED*** — 2026-08-03 (fix lane, wave 2). DO NOT MERGE
    with the 91+92 wave.** Fable's box schedule closed the browser window before
    `item87.mjs` could run even ONCE: there is no harness result, no falsification run and
    no suite, so under "stamps on every claim" this item has no claim to make. It waits on
    this branch, in its own commit, for a window. Reclassified on 2026-08-03 as a
    REVERSAL of a ruled default owing a full pass with parked assertions; this is that
    pass, and the parks turned out to be none — which is a finding, not a shortcut.
    **CLAUSE 1 — "New Page lands in Draft," built ADDITIVELY (Fable's ruling 4).** The
    obvious patch — flip PageEditor's default so a loose-origin page opens in Draft —
    would have REVERSED **CD1 S8 (A7)**, which opens loose pages in Free Write on purpose
    to match the front-door posture, and which **Arrival's own Write door rides on**. A
    New Page and the Write door produce the SAME loose-origin surface, so origin cannot
    tell them apart; only the DOOR knows which it is. So the descriptor gains
    `mode` (`?mode=draft`) and **the door declares the room it opens**: `PagePanel`'s New
    Page and the board→Page door say Draft, every silent door keeps today's behaviour
    byte-for-byte, and CD1 S8 stands UNREVERSED. The writer's own remembered per-page
    mode still outranks the door — a door's opinion is about a page that does not exist
    yet, so it can never overrule a page the writer has already set. `item87.mjs` S1(c)
    is the CONTROL that proves Arrival's Write door was not collateral damage.
    **CLAUSE 2 — "Free Write hides Structure presets": ASSERTED, NOT FIXED.** The S0 read
    found it already true — PageEditor hands the sliver `kind: 'freewrite'` in Free Write
    (`PageEditor.tsx:633-653`) and `Sliver.tsx:346` renders the Structure section only
    under `content.kind === 'draft'`. Writing a fix for a clause that already holds would
    have been a change with no defect under it and a green check proving nothing. S2 locks
    the behaviour in from BOTH sides (absent in Free Write, still present in Draft) so a
    later sliver change cannot quietly undo it. **The clause did not reproduce; recorded
    rather than silently "fixed."**
    **⚠ SUPERSEDED IN PART 2026-09-19 by ITEM 171 — DRAFT HAS NO TYPEWRITER.** Nick: *"typewriter mode should
    not be available in either Draft or Revise mode."* The FX2 S2 ruling this clause amends ("Draft opens
    with typewriter ON unless the page already holds 10+ line-equivalents") and the clause itself are kept
    as written below, and are moot for Draft.
    **CLAUSE 3 — "typewriter off on fresh pages," an AMENDMENT to FX2 S2 at exactly one
    point.** FX2 S2 ruled "Draft opens with typewriter ON unless the page already holds
    10+ line-equivalents," reasoning that the line-following fade helps someone starting
    and hinders someone editing. An EMPTY page seeds 0 line-equivalents, so it fell on the
    ON side **by arithmetic rather than by intent** — and a page with nothing in it has no
    lines to follow, which is the state Nick objected to. Only the empty case moves; the
    threshold rule is untouched wherever it still applies, asserted directly (S3(b): a
    ~3-line Draft page still opens ON) and independently proved by `fx2.mjs`'s own
    unchanged ~3-line check.
    **PARKS: NONE OWED — and every candidate was checked one by one rather than assumed.**
    Two structural reasons. (i) **Free Write never seeds:** `PageEditor` calls
    `seedTypewriterDefault` ONLY when the opening mode is Draft, so a fresh Free Write
    page takes the global default and is untouched by clause 3 — that covers `fx2.mjs`
    (both halves of "a fresh Free Write page opens with typewriter ON"), `hb2.mjs`
    ("Open with NO last surface degrades to a fresh Free Write page ... typewriter on")
    and `b1.mjs`'s cross-reference. (ii) `fx1.mjs`'s "a fresh prose page has typewriter ON
    by default" runs on a MANUSCRIPT chapter, which opens in Free Write by the `pageType`
    branch — case (i) again. And clause 1 parks nothing **because it is additive**:
    `ab3.mjs`/`cd1.mjs`'s "origin:'loose' opens in Free Write by default" records stay
    literally true. **Had this been built as the flip it first looked like, all of those
    would have needed parking — the empty park list is evidence the shape was right.**
    **A GAP FOUND BY READING, BECAUSE RUNNING WAS UNAVAILABLE.** `modeKey` is written
    ONLY by `switchMode` (`PageEditor.tsx`), i.e. only on an explicit choice — so the
    door's Draft was never persisted. The descriptor lives in the ADDRESS and birth
    rewrites the address to `/page/:id`; the row is loose-origin; so the NEXT visit would
    fall through to CD1 S8's rule and reopen the writer's Draft page in **Free Write**.
    "New Page lands in Draft" would have been true exactly ONCE. Closed by persisting the
    door's choice once the page is a ROOM (`!unborn`) — which keeps PB1 intact, since an
    abandoned door still writes nothing and a reload mints a fresh unborn id (persisting
    earlier would litter localStorage with keys for pages that never existed). The
    `saved` guard means it can never overwrite a choice the writer has made. **This is
    the kind of defect a harness run finds; a careful read found it instead, which is
    what a browser freeze leaves available.**
    **VERIFICATION — DONE, 2026-08-17 (the doorway ship). 8/8 GREEN; 4/8 RED against the pre-fix
bundle.** `scripts/harness/item87.mjs` ran for the FIRST TIME on this date, 13 days after the
code was written. Clause 1 (S1 a/b/d) and clause 3 (S3a) are red pre-fix; both CONTROLS pass on
BOTH builds — Arrival's Write door still opens Free Write (CD1 S8/A7 unreversed, not collateral
damage) and a Draft page that already holds work still opens typewriter-ON (FX2 S2 amended at the
EMPTY case only).
**CLAUSE 2 IS NOW PROVEN NON-REPRODUCING BY MEASUREMENT, not by reading.** S2 passes on the
pre-fix bundle too — Free Write already showed no Structure presets. The 2026-08-03 call to
ASSERT it rather than "fix" it was right, and is now backed by a measurement instead of an
argument.
**THE FIRST RUN FOUND A FIXTURE BUG IN THIS FILE — which is exactly why "BUILT, NOT VERIFIED"
was the honest label and not a formality.** S3(b) seeded its page with a RAW `localStorage`
read-modify-write, which is precisely the seeding race **AGENTS.md's own harness law forbids**:
`wrizoCreateJournalPage` writes the CACHE and flushes on a ~300ms debounce, so the raw write
clobbered the row, the page was GONE after the reload, and the run landed on Arrival and timed
out with NO verdict. Written during the browser freeze and never executed, so nothing caught it
for 13 days. **Repaired by seeding through the app's own write path** (type one short sentence —
1 line-equivalent, the same side of the 10-line threshold the original three lines tested), and
the check's name was corrected to match what it now measures rather than left describing a
fixture that no longer exists.
**→ SCOPE CHANGED BY NICK — 2026-08-17 (Fable relay, DOORWAY BRIEF ADDENDUM).** Nick amended
    the DESIGN: **clause 1 (the Draft-default door) is SUPERSEDED** by a New Page chooser coming
    via the menus arc. It is **HELD, not deleted** — the built work stays on
    `fw2-boards-and-defaults`, and its four assertions PARK in `item87.mjs` with records
    byte-frozen. **A superseded DESIGN parks exactly as a superseded ruling does**; there is no
    live successor named, because the successor is a design that does not exist yet.
    **WHAT SHIPS from item 87 in the doorway wave: clause 3 (typewriter OFF on a fresh page —
    Nick's sitting verdict, untouched by the amendment) + clause 2's assertion.** The descriptor's
    `mode` field, `PageEditor`'s door-mode read and its persistence effect, and the two doors that
    declared `?mode=draft` are all removed from the shipping subset; `structure` (item 104) is
    unaffected and stays.
    **THE 8/8 VERIFICATION STANDS AS EVIDENCE FOR THE WHOLE BRANCH** (Fable's ruling), including
    the held clause — it is what proves the held work is sound rather than abandoned. The shipping
    subset re-stamps at 4 live checks + 4 parked.
    **ONE FINDING FROM CLAUSE 1 IS OWED FORWARD TO THE CHOOSER, and is parked with it rather than
    lost:** a door-made choice that is never persisted is true exactly ONCE, because birth rewrites
    the address away. Whatever the menus arc builds will meet that same wall.
91+92. **The board's Page door, and the card that survives.** **P1+P1 (S11+S12) — BUILT
    + VERIFIED — 2026-08-03 (fix lane, wave 2).** One fix, because one S0 proved one
    subject: a page made FROM a board must end up linked TO that board, and stay linked.
    **S0 CORRECTION, append-style — the entry above stands, this amends it (Fable's
    ruling 1).** That entry says the stale-boxes erasure fires "on the very `navigate`
    that door performs." **Too strong.** `lastSavedRef = useRef(boxes)`
    (`BoardEditor.tsx:741`) is initialized to the SAME array as `boxes`, so on a board
    with no local edit the unmount guard `boxesRef.current !== lastSavedRef.current` is
    FALSE and the stale write never happens. The erasure requires an **outstanding
    unsaved edit inside the 2000ms autosave window** (`AUTOSAVE_MS`). That is not a
    contrived race — it is a writer's ordinary rhythm: place a card, and within two
    seconds reach for New Page Card. **The first draft of `item9192.mjs` asserted the
    erasure on a CLEAN board and PASSED against the pre-fix bundle** — proving nothing,
    and saying so. Staging the real precondition turned it red exactly as it should:
    `pins=[]` with `kinds=["text"]`, the stale array writing back the plain card and
    nothing else.
    **THE STAGED CATCH — why staging exists.** Reproducing that precondition also
    falsified THIS LANE'S OWN FIRST FIX. The first version assigned the store's array as
    local truth (`setBoxes(updated.boxes)`). But at the moment that door is used the
    STORE is a strict subset of what the writer sees — the diagnostic printed
    `boxesInStore = []` while the board displayed a card — so that fix would have
    preserved the pin and **silently discarded every unsaved card on the board**. One
    loss traded for another, and it would have shipped green against a clean-board
    scenario. **RATIFIED SHAPE (Fable):** append the pin to `boxesRef.current`, never a
    store read as local truth — "this component's own live boxes, not a fresh store
    read," in the deck-wizard comment's own words (`BoardEditor.tsx:665-676`, the law
    this door reached around). `S1b (c)` now asserts the unsaved card survives too.
    `pinPageToBoard` still BUILDS the box (it owns stacking placement, the idempotent
    already-pinned check, the self-pin/system-board guards); only the telling-the-
    component half was missing. `boxesRef.current` is assigned directly, not merely via
    `setBoxes`, because it is assigned during RENDER and this handler batches its update
    with a `navigate` that unmounts — there may be no further render, and the unmount
    guard reads the REF. `lastSavedRef` is deliberately left alone so that guard still
    writes the merged array on the way out.
    **ITEM 91 — reproduced verbatim.** On the Journal board, PAGE → gave `hash=#/`: the
    Wrizo landing, exactly Nick's S11. `backTo` is `'/'` for a system board
    (`BoardEditor.tsx:1678`), so the Board's one universal control ejected the writer out
    of the room. CD4 S1 reasoned an exit was honest for a permanently-unpaired board;
    **Nick overruled it**, and this is the successor.
    **THE KIND-SPLIT (RATIFIED, Fable's ruling 2) — "auto-linked back" is not one
    thing, and getting it wrong is invisible until a card vanishes:** a **USER** board's
    membership is AUTHORED, so the link is a PIN carried on the descriptor (`?pin=`) and
    applied by `birth()`, with the board's binder riding along (Nick's "binder/pin
    descriptor"); a **SYSTEM** board's membership is DERIVED and never authored (A16),
    and `reconcileSystemBoard` DELETES any pin whose page does not qualify — a pin there
    would be erased on the next reconcile, which is item 92's own defect — so the honest
    link is MEMBERSHIP (Journal takes journal-origin, the Shelf takes loose, and the
    board adopts it by itself); **TRASH** has no creatable membership and keeps the old
    exit, named rather than left to be rediscovered.
    **THE DEAD SEAM IS NOW LIVE.** `UnbornDescriptor` gains `pinBoardId`, serialized as
    `?pin=`; `birth()` reads `opts.pinToBoardId ?? d.pinBoardId`, so all four existing
    `birthWith` callers are UNTOUCHED and still inherit it. The pin rides the ADDRESS, so
    it survives a reload of the unborn surface — a page opened from a board, left, and
    returned to is still born pinned to that board. The door itself writes nothing: PB1
    survives item 91 (asserted, S2(c)).
    **VERIFICATION — `scripts/harness/item9192.mjs`, 16 checks, PROVEN TO BITE:** 10/16
    FAILED against the pre-fix bundle, 16/16 with the fix. Two CONTROLS pass on both
    builds and are labelled as such — the clean-board case (S1, which is why the first
    draft proved nothing) and Trash's preserved exit (S4) — so the file cannot be
    satisfied by a change that simply rewires every door.
    **PARKS — item 91 reverses a ruled default (CD4 S1), so assertions PARK with
    originals quoted and successors named, never silently flipped. THREE files, not
    two.** `b2.mjs`'s Shelf backTo check is re-pointed live and parked **generation 2**
    (its CD4-era park text quoted whole inside the new record name); `bm1.mjs`'s "on an
    UNPAIRED board travels to the FX10 named return (leaves the board)" is parked with
    its record byte-frozen — genuinely falsified, and for the right reason: the new
    address CONTAINS the board id as `?pin=`, so the writer no longer leaves the board
    behind, they take it with them. **`cd4.mjs` was the one this lane MISSED** on its
    first sweep (a grep for the door selector found b2 and bm1; cd4 asserts the same exit
    TWICE — the Shelf cold-load path and the unpaired-loose path) and its park section
    was documented as "an empty no-op by design," so it had no `pok` scaffolding at all.
    **The full suite is what found it**, at `[14/55] NOVERDICT` — the argument for
    running the whole suite rather than the files you think you touched. All three parked
    sections re-verified GREEN (b2 4/4, bm1 2/2, cd4 2/2, item9192 1/1).
    **TOOLING NOTE, learned the expensive way and worth a standing habit:** stopping a
    suite mid-run (`TaskStop`) ORPHANS its harness browsers, and the next run — ANY
    lane's — is then refused by the dirty-machine guard. `run-suite` self-heals only its
    OWN profile dir on the way in, so nothing reaps another run's leftovers. Recovery
    stayed lawful and is the pattern to reuse: the profile dir encodes the launching node
    PID (`ws-runtime-verify-<pid>`), so the 9 orphans were all traced to owner `25312`,
    **confirmed dead** — belonging to no live run, therefore not another lane's in-flight
    work — and killed BY EXACT PID. Never `--ignore-foreign`, never a by-name sweep.
    Cheaper still: let a doomed run finish.
    **SUITE — unparked `55/55` CLEAN**, `tree=e519854+7dirty
    bundle=index-Cib2nzSw.js/525306b` (`item9192.mjs :: PASS (16 checks)`), plus `tsc`
    clean. **PARKED: `54/55`, NOT CLEAN — one NOVERDICT (`j4.mjs`), and this lane is NOT
    clearing it.** `j4.mjs` threw `SecurityError: Failed to read the 'localStorage'
    property from 'Window'`. **The known-flake list stays EMPTY because the mechanism is
    NAMED, not excused:** `j4.mjs`'s PARKED block calls `localStorage.clear()` as its
    FIRST act, before any navigation — the only fixture in the suite that does — and
    `withHarness` does not navigate, it LAUNCHES the browser at `${base}/#/`
    (`runtime-verify.mjs:675`). Until that initial load commits, the document is still
    `about:blank` and localStorage on it throws exactly this. Every other fixture
    (`freshDesk`, everywhere) navigates first. **Pre-existing and untouched by this diff**
    — nothing in this wave goes near `j4`'s subject — and the UNPARKED run of the
    IDENTICAL bundle had `j4` green minutes earlier, which is the signature of a race
    rather than a product change. **Fixed here** by navigating first, matching every other
    fixture; **that fixture fix is itself UNRUN** (the box schedule closed the window).
    **So the parked stamp for 91+92 is OWED, not claimed** — both settings get re-run the
    moment a window opens, and the merge offer says so rather than presenting a half-stamp
    as a whole one.
    **↑ THE OWED STAMP IS NOW PAID — 2026-08-04, post-deploy-stamp, slot 1.** Re-run on a
    CLEAN, NAMED tree (branch `fw2-offer` @ `dad280e`, item 87's code deliberately absent
    so the stamp describes exactly the software being merged): **unparked `55/55` CLEAN
    and parked `55/55` CLEAN, both `tree=dad280e
    bundle=index-Cib2nzSw.js/525306b`** — no `+Ndirty` suffix, and the SAME asset hash as
    the earlier runs, which is itself the proof that item 87's code is not in the offered
    bundle. **`j4.mjs` PASSED parked**, so the navigate-first fixture fix is no longer
    unrun — the first-parked-act race is closed by exercise, not by argument.
    **ONE INCIDENT ON THE WAY, ATTRIBUTED AND NOT INHERITED:** the menus lane reported
    (record: `docs/menus/incident-2026-08-04-s4.md`) that an S4 cleanup error killed a
    browser belonging to this lane's first parked attempt. Its `e1` leg was left with a
    live node child and no browser — it would have hung to timeout and read red. **That
    run was ABANDONED and restarted rather than reported with an excused red**: chat 1
    merges on these stamps, and "54/55 with one red we agreed to disregard" is a worse
    thing to merge on than a clean 55/55. The restart cost the same wall-clock as waiting
    for the bad result and re-running one leg. **`e1` passed on the clean re-run**,
    confirming the red would indeed have been spurious. Stopping that run orphaned
    NOTHING (its browser was already dead); the full owner-liveness check was run anyway
    rather than assumed.
    **REGISTERED BY FABLE (2026-08-03):** the honest half-stamp ships as described; this
    diagnosis is entered as the **first-parked-act race species** (a fixture touching
    `localStorage` before its first navigation, racing the browser's launch load). Two
    boundaries recorded WITH it, because a species is only useful if its edges are drawn:
    **(a) THE b2-1 CONVERGENCE IS A HYPOTHESIS, NOT AN ATTRIBUTION** — same pre-commit
    window, different symptom, and its own probe is owed before anything is attributed to
    it. **This lane's data constrains it and is offered as evidence, not as a verdict:
    `b2-1.mjs` returned PASS (28 checks) in ALL SIX suite runs this lane executed —
    unparked and parked, across four distinct bundles** (`index-iOcJ71l_`,
    `index-CThKwy6K`, `index-Cib2nzSw` ×2 settings). So no b2-1 symptom is visible from
    here; whoever runs the probe should know that this window's runs do not reproduce it.
    **(b) THE ORIGINAL j4 RED (`:84` null-click, HARNESS_PARKED unset) STAYS
    UNATTRIBUTED** — the species does not inherit backwards, and this lane adds nothing to
    it either way: **that failure was never observed in any run this lane made.** j4
    returned PASS in four of this lane's five runs that reached it; the single red is the
    `:297` parked-block SecurityError diagnosed above, at a different line, a different
    setting and a different symptom.
    **ITEM 97 NOT RIDDEN — DECLINE ACCEPTED (Fable's ruling 3).** It did not fall out of
    this read (this diff touches `BoardEditor` and `unbornPage`, not
    `getOrCreatePlanBoard`), and it carries a product question — restore the trashed
    board, or re-mint and clear the pointer — that is Nick's, not a build call. Stays
    open, post-vacation.
88a+88b. **The filing target is validated; the unborn page stops being born by a side
    door.** **P0 (S5) + P1 (S6) — FIXED — 2026-08-03 (fix lane).** Closes 88a and 88b as
    a pair, because both live in `setPageHome` and one return value fixes both.
    **88a (the P0), as recorded and CONFIRMED:** `setPageHome` assigned ANY string that
    was not `'shelf'|'loose'|'journal'` straight to `entry.projectId` with no existence
    check. A page whose projectId names no live binder is invisible to EVERY enumerator —
    not the Journal (`projectId == null`), not any binder's page list, not the Shelf
    (`belongsOnShelf` excludes filed pages), not the "Everything" export. **Fix:** the
    target must name a LIVE binder via `getProject()` — the app's own definition, and the
    same one `getProjects()` uses to build the list every UI offers, so any target a
    writer could actually pick is still accepted. A deleted binder is refused for the
    same reason a nonexistent one is: filing into it orphans the page just as completely.
    **Refusals write NOTHING** — a filing that cannot be honoured leaves the page where it
    was, which is always recoverable, instead of somewhere no surface can reach.
    **88b (the P1) — THE RECORDED MECHANISM WAS WRONG; see the falsification note under
    item 88 above.** The defect was not a lying toast over a no-op; it was a WRITE:
    `getJournalEntry` falls through to the unborn slot, so filing an unborn page birthed
    an empty row through a side door, bypassing `birth()` and leaving the slot populated.
    **Fix:** `setPageHome` now reads the CACHE directly rather than `getJournalEntry`, so
    an unborn surface is not a filing subject at all. That is not a special case bolted
    on — an unborn row is by PB1's own structural law "never serialized, never synced,
    never enumerated," so a thing that is in no pool cannot be moved between pools.
    `birth()` stays the ONE path that turns a surface into a row (PB1 ruling 2), and this
    function can no longer take that job by side effect. The refusal is reportable, so
    `PlacesPanel.fileTo` and `createAndFile` now say so plainly — **Nick's own S6 verdict,
    "no toast on a no-op,"** honoured by first making it genuinely a no-op. The honest
    phrasing follows `AddToSheet.fileToShelf`'s own precedent for this exact class of lie
    ("reads the ACTUAL outcome back after the write").
    **SEAM:** `window.wrizoSetPageHome` (the `window.wrizoPinPageToBoard` pattern,
    verbatim in shape). 88a's guard exists precisely for a target NO UI can offer — every
    surface builds its list from `getProjects()` — so the refusal is unassertable from a
    harness without it. 88b needs no seam and gets none: it is reproduced as a writer, on
    a real unborn page, with a real click.
    **VERIFICATION — `scripts/harness/item88.mjs`, 10 checks, PROVEN TO BITE:** 5/10
    FAILED against the pre-fix bundle (all three 88b incident checks and both 88a guard
    checks), 10/10 with the fix. S3 is the control — the honest filing path — and passes
    on BOTH builds, so the suite cannot be satisfied by a guard that simply refuses
    everything, which would be a worse defect than the one being fixed.
    **SUITE — BOTH SETTINGS CLEAN ON THE IDENTICAL BUNDLE.** Unparked `54/54`
    (`item88.mjs :: ITEM88 VERIFY: PASS (10 checks)`) and parked `54/54`
    (`ITEM88 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed`), both
    `bundle=index-CThKwy6K.js/524897b` on `tree=37d0826` — the same asset hash on both
    runs, so the two results describe the same software and not merely the same commit.
    `tsc` clean. *(Dirty counts differ between the two stamps, `+3` then `+4`, purely
    because this file's own records edits landed between the runs; no bundle input
    moved, which the identical hash proves.)*
    **NOT TOUCHED, disclosed:** `AddToSheet` (:73/:89) and `PageFileMenu` (:29) still
    ignore the new return value. Neither is a live hazard — AddToSheet already reads its
    own outcome back and both file into ids drawn from `getProjects()` — but they are the
    obvious next callers to make honest, and they are named here rather than silently
    left. `JournalEntry.tsx`'s two calls are on an UNROUTED surface (dead since FX14).
89. **The dirty set was memory-only — every offline write was UNSENDABLE.** **P0 (S8
    of the pre-flight sitting) — S0 PROVEN + FIXED — 2026-08-03 (fix lane, chat 6's
    successor).**
    **THE MECHANISM, proven at the cited lines rather than repeated:** `dirty`
    (`persistence.ts:77`) was a module-scope `Record<CollectionName, Set<string>>` and
    nothing else. `getDirtyRecords()` (`:95-104`) filters the CACHE BY that set, so the
    set is not a hint — it is the sole gate on what sync may send. A reload before the
    next successful push therefore did not DELAY a push, it made the push IMPOSSIBLE:
    rows sat on disk, intact, permanently unsendable. Full mutation census, five sites,
    all now covered: `upsert` (:212, add), `markClean` (:106-115, delete),
    `markAllJournalEntriesDirty` (:126, add-all), `clearDraft` (:589, delete),
    `resetLocalData` (:1941, clear) — plus `applyCollection` (:1911), which READS it as
    a guard.
    **WHY IT WAS SILENT — the S0 question chat 6 left unread, now answered.** The
    Journal master list is the Journal system Board (`App.tsx:280` → `JournalBoardGate`
    → `/page/:id` → `BoardEditor.tsx:1964`); its rows come from `getJournalPages()`
    (`persistence.ts:1126-1131`) via `reconcileSystemBoard`/`qualifyingPagesFor`
    (`:1736`). **That list reads the LOCAL cache** — as does every other list in the
    product (cascade panels, Shelf, the Everything export). `api.ts` exports exactly one
    record call (`apiSync`), whose single caller merges the pull INTO that same cache.
    **No surface in Wrizo asks the server what pages exist.** So a stranded row renders
    exactly like a synced one on the device that owns it: there was no symptom to
    notice, which is how a P0 reached a device sitting.
    **THE RECORD CORRECTED — for Fable.** The sitting log and this file's own P0 summary
    say the recovered page `mscqyn48uyxk6p37l` "reappeared in the Journal master list."
    It cannot have. A **read-only production query** (project `writer-studio` /
    `production`) returns the row with **`origin: 'loose'`, `project_id: null`,
    `deleted_at: null`**, text "Testing if the address bar flips", created
    `2026-08-03T04:46:55.437Z`. `inJournalView` (`:1119-1123`) returns FALSE for any
    non-null origin that is not `'journal'`, so the row is excluded from
    `getJournalPages()` by construction. Its real surfaces are the **Shelf board and the
    cascade's "Loose" group** (both `getShelfEntries()` → `belongsOnShelf`, `:1156-1182`),
    plus the Everything export and Arrival's resume race. **The recovery is REAL and is
    now PROVEN SERVER-SIDE — the row is in production Postgres — but the surface named in
    the record was wrong.** Recorded rather than quietly repeated: a verification designed
    against that sentence would have asserted something the code says is false.
    **THE RAILWAY NEAR-MISS IS STILL LIVE, and was re-avoided.** `railway status` from
    this worktree STILL resolves to project `fabulous-essence` — the unrelated production
    system item 88 recorded. The link map is path-keyed and this worktree is absent from
    it, so the CLI walks UP to `C:\Users\nickh`, which is linked to that other product.
    The query therefore ran from the primary checkout (correctly linked to
    `writer-studio`), with `--service Postgres` for a public URL: **no `railway link`, no
    mutation of shared CLI state, no secret printed** (presence-only env checks, per the
    standing law).
    **THE FIX (src only, zero schema).** The registry is journaled to
    `writer-studio-dirty-v1` and restored at boot. `persistDirty()` is called from
    `flush()`, so the id journal lands in the SAME synchronous write as the collection it
    describes and the two can never disagree about a record that reached disk;
    `markClean` and `markAllJournalEntriesDirty` call it directly (neither touches a
    collection); `resetLocalData` removes the key (it is per-account data). **Boot PRUNES
    journaled ids to those present in the cache** — load-bearing, not tidiness: a phantom
    id (row lost inside the 300ms write window) pushes nothing while `applyCollection`
    skips it as "a local unsynced edit" FOREVER, so an unpruned journal would block the
    server's own copy from ever landing — a second way to lose a page, introduced by the
    fix for the first. "Push on reconnect" needed no new code: `sync.ts`'s `online`
    listener and boot `syncOnce(true)` already call `getDirtyRecords()`; this ticket's
    whole job was making that call return the stranded rows.
    **THE ONE-SHOT GUARD IS KEPT, reasoning recorded in `sync.ts` itself.**
    `JOURNAL_RESYNC_KEY` and persistent dirty address DISJOINT populations: persistent
    dirty saves rows that ARE dirty across a reload; the backfill saves rows wrongly
    marked CLEAN by the pre-D2 server. A clean row is invisible to a dirty-set fix by
    construction, so retiring the guard would permanently strand the exact backlog it
    exists for on any device that has not run it. What item 89 DOES retire is its
    accidental second job — being the only recovery lever for a freshly stranded page,
    the thing Fable cleared by hand on 2026-08-02. **Standing asymmetry, named rather
    than silently fixed:** that backfill covers `journalEntries` ONLY, while stranding was
    never journal-specific — projects, drawers, drafts, sessions and storyPlans stranded
    identically with NO recovery path at all, manual or otherwise. Persistent dirty is
    what covers those six.
    **VERIFICATION — `scripts/harness/item89.mjs`, 14 checks, PROVEN TO BITE.** Against
    the pre-fix bundle it returns **8/14 FAILED**, including both headline checks; with
    the fix, 14/14. The falsification run is the evidence that the file measures
    something. Two fixture lessons are committed in its header because each cost a red on
    a CORRECT build: (i) the harness double answers `/auth/me` and `/api/sync`
    successfully, so the app under test is AUTHED AND ONLINE and cleans everything it
    writes — a scenario about unsent work must make the send genuinely fail; (ii) a
    page-side `window.fetch` trap dies with the page, so the reload came back online and
    cleaned the set before the assertion could read it. **`runtime-verify.mjs` therefore
    gains `/api/_sync_mode`** (`{ fail: true }` → a real 503), added on the exact
    precedent of TU2's `/api/_tutor_mode` and defaulting to `{}`, so every pre-existing
    harness file sees byte-identical behavior. Scenarios go offline, write, **reload
    STILL OFFLINE**, and only then reconnect — the laptop closed on the plane and opened
    at the gate. The headline check is not "the flag survived" but **S1(e): the
    once-stranded page REACHES THE SERVER unattended**, measured on the wire via
    `/api/_state`.
    **DISCLOSED, not implied:** `resetLocalData`'s key removal and `markClean`'s
    persistence in the safe direction are covered by code review at their call sites, not
    asserted — driving a real logout would end the authed session the rest of the file
    depends on, and a dirty id that outlives its clean is a no-op re-push (LWW + stable
    ids). Both disclosures live in the harness header, not only here.
    **SUITE — BOTH SETTINGS CLEAN ON THE IDENTICAL BUNDLE.** Unparked `53/53`
    (`item89.mjs :: ITEM89 VERIFY: PASS (14 checks)` at [36/53]) and parked `53/53`
    (`ITEM89 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed`), both stamped
    `tree=c7878ed+4dirty bundle=index-iOcJ71l_.js/524433b` — the same asset hash on
    both runs, so the two results describe the same software and not merely the same
    commit. `tsc` clean. *(The parked run was still in flight at the fix's own commit
    `8875343`, which said so rather than claiming it; this line closes that gap.)*
    **OBSERVATION — 2026-08-17 (surfaced by SC2's sixth suite, item 62).** `persistDirty()`
    called inside `flush()` (this fix) adds **~2ms p95 to flush-adjacent timing measurements** —
    the absolute cost is trivial, but it MOVED THE BASELINE. **Re-derive baselines before any
    future timing gate** rather than reusing a pre-`persistDirty` figure; a stale baseline would
    conflate this ticket's cost with a lane's own measurement. SC2's sixth-suite records carry
    the numbers (its 20-page p95 was measured against the post-`persistDirty` floor for exactly
    this reason). Non-blocking; recorded so a later timing gate does not silently inherit a
    moved floor.
83. **Tool Pop-out Menus — the Two Hands arc OPENS.** **OPENED — 2026-08-01
    (menus lane, S0)**, naming this lane the arc's opening per Fable's ruling —
    **vetoable by Nick on sight.** Authority: SV5 (`docs/wrizo-alpha/hd-arc-seed.md`)
    + the item-83 seed. *(Numbering per the assigned-never-claimed law: 84 is the
    Tutor lane's, reserved; next free is 85. 79–81 remain the gap item 82 recorded.)*
    **DESIGN ONLY under the Aug 1 freeze:** this lane's medium is committed documents
    and HTML mockups under `docs/menus/`; it never touches `apps/`. Scope matrix, six
    contexts: Page (prose) × {Free Write, Draft, Revise} · Screenplay page · Board ·
    Card. Ink/Image stays with the HD charter, outside this matrix — a divergence the
    census names rather than silently drops.
    **PHASE 1 LANDED WITH THIS S0:** `docs/menus/item83-census.md` — the verbatim
    per-context control inventory, read against `main` @ `3dc3d49` and landed atop
    `3a5840a` — the one intervening commit verified RECORDS-ONLY against the remote
    (`docs/open-threads.md` +97, zero code: item 82's fix 1 + the COMMIT = PUSH
    elevation), so the inventory stands unmoved at the landing tip; truth-states
    BUILT / RATIFIED-UNBUILT / LEGACY / INHERITED-OPEN; eight divergences named
    (Revise deferred-in-code vs. seeded-in-matrix vs. walked-in-agenda; card color's
    Chamber B/Chamber 3 tension; the Typewriter cluster as ruled vs. as built; the
    Progress Bar three-way vs. M4's one-lane; TS1 overlap; A19 unbuilt; among them).
    Census proposes nothing — Phase 2 argues.
    **INHERITS ITEM 78 WHOLE** — the fit-to-content placement question (where the
    view control lives) is now this lane's to argue inside the two-hands grammar;
    item 78's preserved mechanism stands untouched and un-re-argued.
    **OWNS THE SHARED MENU GRAMMAR** — the Tutor lane (84) inherits it; divergences
    route to Nick, never fork silently. Screenplay-surface rows are census only —
    the SC arc (62) keeps its lane; the Card rename seam belongs to the Naming arc
    (SV4) and gets ruled with Nick, never built twice.
    **LAWS CARRIED:** fx18's three-regime panel law, constitutional for any panel
    geometry this lane draws; BM1 — doors are doors, modes are modes; a tool control
    is neither, and its home must be argued, not assumed; ZERO resting orange in
    menus (Plateau's resting ceiling stands; evental orange on press only);
    progressive disclosure never shows a locked door (M1); paper never reflows for
    chrome; a limit stops, it never relocates; presence is not composition — every
    Phase-3 mockup carries rendered dimensions at BOTH reference widths (the
    1366×768 floor + wide) from day one.
    **PHASES + GATES:** (1) census — DONE, this commit. (2) Committee double-pass
    per context — Experts, Architects, a NAMED opposition, plus the cognition/ADHD
    bench on chrome density; tensions named honestly, canon violations flagged never
    deferred. (3) ≥2 standalone HTML mockups per context, Plateau tokens only, in
    `docs/menus/`. (4) Nick's lock, sitting-informed — **NO option set locks before
    the pre-flight sitting log lands** (`device-sitting-agenda-v3.md`); then
    post-vacation HD build tickets, briefed decision-complete. Lane worktree:
    `.claude/menus` on `item83-menus`, one lane, one arc, no browser harness;
    COMMIT = PUSH inherited from its elevation (`3a5840a`) — this lane's pushes
    bind to the commit, verification follows publication.

- **REPORT = PUSH — long-standing practice, stated verbatim as it has
  always been carried in the briefs: "report = push."** A ticket's
  work is not delivered until it is on the remote; a build that ends
  with a green verification and an unpushed branch has produced
  nothing another lane can use.
- **ELEVATED 2026-08-01 (Fable's word, on chat 6's own analysis after
  the second occurrence in one lane): COMMIT = PUSH. The push binds
  to the COMMIT, not to the report. WIP markers exist precisely so
  that VERIFICATION CAN FOLLOW PUBLICATION.** The original above
  stands unrewritten; this is its stronger successor, and every lane
  inherits it.
  **THE EVIDENCE, which is why this is structural and not a scolding:
  the ledger already records FIVE occurrences of this exact class.**
  Three predate chat 6 entirely and appear in other lanes' entries in
  the same words — *"the build's own 'report = push' step never
  happened; the orchestrating session completed it"* (twice) and
  *"the build's own 'report = push' step never ran"* — each one paid
  for by an orchestrating session doing the push on the builder's
  behalf. Chat 6 supplied occurrences four (FX17 S1, 2026-07-30) and
  five (item 82 fix 1, 2026-08-01).
  **THE MECHANISM, from the lane that repeated it.** It is not
  forgetfulness. An agent's sense of "done" attaches to THE ARTIFACT
  BEING CORRECT, not to the artifact being DURABLE SOMEWHERE ELSE. So
  the instant a fix goes green, the next act that feels like progress
  is verification, and the push is silently reclassified as
  bookkeeping to be bundled with the report. That is exactly
  backwards: the window between "it works" and "it is reported" is
  when the work is simultaneously most valuable and least durable —
  and it is often 45 minutes of sweep long. A second pull runs
  underneath: pushing an unfinished branch feels like publishing
  something half-made, which is the objection the WIP marker was
  invented to dissolve and which gets re-derived anyway.
  **THE SHAPE ALL FIVE SHARE:** commit -> start long verification ->
  push at report time. Binding the push to the commit removes the
  window by construction instead of relying on anyone remembering it
  at the moment they are least inclined to.
- **FETCH BEFORE READ — for ref-holding lanes (Fable, 2026-08-01).** A lane that acts on a
  ref it holds (a SHA, a branch tip, "the suite of record at X") runs `git fetch` immediately
  before reading it: the held ref may have moved by the time it is read, and a decision made
  on a stale ref is a decision about a world that no longer exists.
  **THE CENSUS, honest — ONE proven occurrence, not inflated.** SC2's lane acted on a held
  ref that had moved under it (proven, in item 62/82's own trail). **The item-84 merge
  incident is NOT this class: RECLASSIFIED as interleaving-after-read** — two histories both
  appended after a clean read (a merge-resolution concern), not a stale-ref read. Kept
  distinct so the census stays honest: one class, one occurrence, named — not two.
  **PRECISION (Fable, 2026-08-01) — the exclusion itself was mislabeled, and the correction is
  the lesson:** what reached this lane as "the 84 incident" was TWO events under one label. (i)
  The **84 desk's relay-aged question** — read TRUE at 22:03Z, the world moved at 22:05Z, the
  claim traveled UNDATED: a RELAYED CLAIMS occurrence, not fetch-before-read. (ii) **Chat 1's
  clean auto-merge of the S0 branch** — a separate, THIRD event, merge-resolution class. Two
  events, one label, now UNSHARED. A compressed instruction reconstructed wrongly at the
  receiver — the RELAYED CLAIMS law illustrating itself.
- **PIN THEN RE-VERIFY AT ACTION TIME — the sibling for values, not refs (Fable, 2026-08-01).**
  A value pinned at read time (a hash, a count, a state) is re-verified at the instant it is
  acted on, never trusted across the gap. Fetch-before-read protects a ref; this protects a
  measurement — the same window, a different held thing.
- **RELAYED CLAIMS CARRY THEIR READ-TIME — the sibling for reports (Fable, 2026-08-01).** A
  claim relayed between lanes ("green," "at X," "clean both settings") carries WHEN it was
  read/true, so a stale claim is dated on its face and cannot be mistaken for a current one.
  The provenance stamp (77(c)) is this law made executable for suites; this states it for
  claims carried in prose.
- **THE S4 LAW — a runner's live refusal outranks metadata (RATIFIED by Nick, 2026-08-17).**
  Isolation-annotation form: *"A runner's live refusal outranks metadata; signature-kills are
  never lawful — sweep only on a verified-dead owner."* A live process refusing (the runner's
  dirty-machine VOID/REFUSE) is truth about the machine NOW and outranks any stamp or metadata
  claiming quiet; a by-name / by-signature `--headless` kill is NEVER lawful (it murders other
  lanes' in-flight runs); the only lawful sweep is of a browser whose owner node PID is VERIFIED
  DEAD. Evidence: the 2026-08-04 orphan incident (item 99, the Orphan Reaper) + twice honored
  since.
- **ROAD-DEPLOY AMENDMENT — RETIRED (Nick, 2026-08-17).** Moot now travel is over; there is no
  standing road-deploy carve-out. Re-draft fresh if travel looms again — until then the item-98
  primary-checkout guard and the explicit-per-package deploy-word gate stand unamended.
- **WORKTREE NAMED, ALWAYS — standing law (Fable, 2026-08-25).** Every brief or ruling that causes
  a file to be WRITTEN names its target WORKTREE, not just a path — a relay that names only a path
  lets a builder write wherever it stands, which is how strays land in the primary checkout and
  contaminate another lane's staging (item 110). A path without a worktree is an under-specified
  instruction; TUTOR's amended relay format and Fable's briefs/rulings now state the worktree.
- **THE BUILD ENVIRONMENT IS PART OF THE ARTIFACT — standing law (Fable, 2026-08-24; RE-DRAFTED
  2026-08-26, the principle surviving its retracted founding example).** Every suite stamp and
  deploy manifest names: **tree SHA · bundle hash+bytes · toolchain (node) · build OS · TREE CLEAN
  AT UPLOAD.** Byte-identity of served vs stamped is the **EXPECTATION of every ship** and is
  **diffed every ship.** Any divergence is diagnosed **CONTAMINATION-FIRST — the tree before the
  toolchain** — because the one observed divergence was a dirty tree, never the environment.
  **FUNCTIONALLY VERIFIED exists only as a stated, named fallback** when a diff diverges from
  proven-clean source for an explained reason. *(Founding evidence: the item-110 shipping incident
  — the contaminated `63b875b` · railway `410033f9` deploy that served `index-4pj2Iqk-.js`/537500b
  built from DECK's uncommitted mutations (DECK §9) — and the retraction that CLOSED item 111, both
  recorded in `e88def1`. The prior "Node 24 vs Node 18 / OS-level divergence" example is RETRACTED;
  git history holds it.)*
- **CLEAN TREE AT UPLOAD — standing law + item-98 guard amendment (Fable, 2026-08-26).** Immediately
  before `railway up`, `git status --porcelain` must be EMPTY — or every stray EXPLICITLY ENUMERATED
  AND AUTHORIZED — and the deploy stamp NAMES IT: *"tree clean at upload."* `railway up` uploads the
  WORKING DIRECTORY, not committed HEAD, so an uncommitted mutation in the shared checkout SHIPS to
  production (item 110's gravest consequence; proven by the hotfix-104 contaminated deploy — 90 minutes
  of an unbidden send path live). **The item-98 guard now checks PROJECT *and* TREE** (was:
  primary-checkout / project only). Enforced together with the every-ship served-vs-stamped diff — the
  diff catches a contaminated build after the fact; the clean tree PREVENTS it. (The third-pass deploy
  `2256f58` retroactively complied: its one stray, `item84-t1-s0-brief.md`, was explicitly enumerated
  in the manifest and is outside the build path — the byte-identical bundle proved no contamination.)
- **A BASELINE IS OLD PRODUCT UNDER CURRENT INSTRUMENTS — standing law (Fable, 2026-08-24).** To
  prove a fix bites, run the OLD PRODUCT but under the CURRENT harness / instruments — **harness
  infra NEVER reverts with the product.** Reverting the instruments too yields a FALSE NEGATIVE
  (the old harness lacks the check the new one adds), which reads as "the fix changed nothing."
  Evidence: the fix lane's false-negative recovery on item 104 — a baseline that reverted both
  showed no crash until the current harness was held against the old product. Move only the
  product; keep the instruments current.
- **THE RETRY-LOOP METHOD — VOID IS NOT A VERDICT — canon (DECK, ratified by Fable 2026-08-31).** A
  suite retry loop may wait for quiet and **re-run ONLY on VOID** (contention — a foreign-browser
  abort, a machine-sleep NOVERDICT); it **HALTS IMMEDIATELY on `NOT CLEAN`** and reports the failing
  files. Re-running a red until it turns green is the discipline this house has retired. The lane's
  own sentence, quoted to canon: **"Retrying contention is measuring again; retrying a red is shopping
  for an answer."** (Source: deck-phase build record §6.2; stands beside the S4 LAW and the
  known-flake discipline — item 82's watch.)
- **A MISSING PARK IS INVISIBLE TO A PASS/FAIL RUN — THE COUNT IS THE CHECK — canon (ROSTER's catch,
  ratified by Fable 2026-09-02).** A park sweep can be INCOMPLETE while both suites read CLEAN: an
  assertion rewritten in place with no parked predecessor (its `pok()` never pushed) simply runs one
  fewer check, and **a green run cannot see the check that is no longer there.** So **a green suite
  does NOT prove a park sweep complete — only COUNTING does.** Audit the park COUNT against the
  sweep's own claim; never trust the green as proof of completeness. Evidence: item-84 roster's tu2
  v4 bump stamped `TU2 PARKED: PASS (9 checks)` — the same 9 as before the ticket, against a summary
  claiming ten; caught by ARITHMETIC, not by a red. Stands beside the immutability law
  (park-never-edit) and the retry-loop doctrine.
- **BACKTICK-BEARING CONTENT TRAVELS BY SCRIPT FILE — standing guard (both lanes, earned 2026-09-05).**
  Content containing backticks is WRITTEN TO A FILE and the file is run/read; it NEVER goes through a
  shell as `python -c` (or any `-c`/inline form). The shell eats backticks as command substitution
  before the interpreter ever sees them, so the corruption happens upstream of every check you would
  use to catch it.
- **BACKSLASH ESCAPES GO THROUGH A FILE, NEVER A HEREDOC — standing guard (both lanes, earned
  2026-09-05).** Any content carrying backslash escapes is written to a FILE, never piped through a
  heredoc: the heredoc collapses `\\n` to `\n` in transit. **Evidence: that collapse corrupted a drift
  check once and came near to corrupting `draftFormat.ts`.** The file path is not the cautious option
  here; it is the only one that preserves the bytes.
- **THE ANALOG LAW — Free Write's governing theme — standing DESIGN law (Nick, VERBATIM, 2026-09-06).**
  Recorded beside the mode sentence it completes — **"Free Write produces, Draft marks, Revise
  dresses"** — in Nick's own words:

  > The theme that should define everything about Free Write mode is that it is analog: a typewriter
  > for text and a journal page/sketch pad for drawing or notetaking.

  **Every Free Write chrome decision answers to this law.** It EXPLAINS, retroactively, the rules
  already standing — **forward-only**, **strike-not-delete**, **no paste-in**, and **the deck**: none
  of them arbitrary, each one what a typewriter or a journal page simply does. **RULED with it: the
  FONT control lives in DRAFT and REVISE, NOT Free Write** (a typewriter does not offer you a
  typeface). **CONSEQUENCE FOR 112-C:** the Type section mounts in **BOTH Draft's and Revise's Desk
  drawers — ONE COMPONENT, TWO MOUNTINGS**, page-level as RV1 governs. **The section's PLACEMENT clause
  AMENDS; its SUBSTANCE does not.**
  - **PARKED — SUPERSEDED (SCOPED, NOT REVERSED) — 2026-09-07, on Nick's confirm.** The FONT clause
    above is **preserved verbatim and NOT edited**; its successor stands beside it.
    - **PREDECESSOR, verbatim (2026-09-06):** *"the FONT control lives in DRAFT and REVISE, NOT Free
      Write (a typewriter does not offer you a typeface)."*
    - **SUCCESSOR (2026-09-07):** *"FONT lives in Draft and Revise, and in Free Write ONLY when
      Typewriter is OFF — a typewriter does not offer you a typeface; a plain page does."*
    - **NICK'S CONFIRM, the words that settled it:** B/I/U + FONT in Free Write **"only when
      Typewriter is OFF"** — **"yes"**.
    - **HOW IT AROSE:** item 127's roster first reached the desk placing FONT inside Free Write.
      **Chat 1 refused to record it as "ruled" against a standing law and surfaced the contradiction
      instead of reconciling it silently**; Nick settled it in one relay. **The law was never edited
      in place, and the successor did not pretend the predecessor had not been said.** See item 127.
- **THE PARKED RUN SEES WHAT THE UNPARKED RUN CANNOT — canon (2026-09-06).** **Evidence: ab2's
  GENERATION-4 park** — Nick's **outdent ruling** superseded the **ruled-eleven roster**, and the park
  carries **generation 3 quoted verbatim INSIDE generation 4**, successors named (the immutability law
  COMPOUNDING rather than flattening). **The PARKED run caught TWO RULING-DRIVEN CHANGES the unparked
  run could not see.** A ruling that supersedes an assertion is invisible to a pass/fail sweep of LIVE
  checks; only the parked setting — which carries superseded claims forward BY NAME — can register
  that a RULING, not a defect, moved them. **The two settings are not redundancy: they answer
  different questions.**
- **DRIVERS NEVER ASSUME EXISTENCE — standing harness law (2026-09-05).** A driver never acts on a
  target it has not established. **A missing target is a RECORDED FAILURE THAT NAMES ITSELF — never a
  throw that kills the file.** A bare `.click()` on an absent node aborts the run and reports nothing
  about anything downstream, so the one run where reporting mattered most is the run that says least.
  Probe for the target, fail a CHECK that names it, and let the remaining assertions still speak.
  **Evidence: three instances in one lane — `ab2`, `e4`, and the outdent driver — each on the run
  where reporting mattered most.** Stands beside the probe guard below: a driver can lie by DYING, or
  by silently DOING NOTHING; both are the instrument describing itself.
- **PROBES DRIVE REAL POINTER EVENTS — standing guard (ERRATA, 2026-09-05).** A probe drives
  **`pointerdown` / `pointerup`** — real pointer events — and **NEVER a synthetic `click`**. A
  synthetic click skips the pointer pipeline the product actually listens on, so the probe measures a
  path no writer ever takes. **Evidence: two probe artifacts nearly became findings today.** A finding
  produced by the wrong instrument is not a finding — it is the instrument describing itself.
- **THE S0-PUSH RULE — ratified 2026-07-21 (Nick, "Sure, ratify
  S0-push rule"), proposed by Fable's own FX7 review citing the
  shared-tree collision class's THIRD occurrence** (the two CD1.1/HB1
  collisions on 2026-07-16, then item 42's own concurrent-TU2 incident
  on 2026-07-21). ONE CHECKOUT PER AGENT closed the build-time version
  of this problem (concurrent agents never share a working TREE); this
  closes the remaining gap — concurrent ORCHESTRATING SESSIONS sharing
  the same primary checkout's own `main` for docs/ledger commits. **A
  session's own S0-style records commits (a brief, a ledger open, a
  status note) are never committed directly against the primary
  checkout's own local `main`.** Instead: branch off the current
  `origin/main` tip (a throwaway locally-named branch is fine, in the
  primary checkout or a worktree, either is safe since the branch
  itself never collides), commit there, then land it with a
  fast-forward-only push directly to the remote ref —
  `git push origin <local-branch-or-sha>:main` — never a plain
  `git push origin main` from a local `main` that was committed to
  directly. If that fast-forward is rejected (origin/main moved),
  fetch and re-parent before retrying — never force. **The primary
  checkout's own local `main` is reserved for MERGE operations only**
  (a ticket branch's own code merging in), each one serialized by
  Nick's own merge word, exactly as every ticket in this ledger
  already does. This preserves the exact thing that let FX7's own
  session discover TU2's concurrent work at all (an early, honest,
  disk-first ledger) while removing the shared-tree surface that made
  the discovery necessary in the first place.
- **THE PLACEHOLDER-REPORT RULE — ratified 2026-07-21 (Fable's FX8
  review), occurrence 2 in one day** (FX7's own build report, then
  FX8's own review report — both ended their turn on a stalled
  background-monitor placeholder instead of an actual completed
  report). **A stalled or placeholder report is a report that does
  not exist.** No close condition is ever satisfied by a report that
  was never written, and no agent may record a verification whose
  output it did not itself read. A ticket whose build or review
  stalls this way may still merge/close only when (a) the gap is
  named plainly in the ledger and (b) the merging agent performs its
  own compensating verification and discloses it — never silently
  treated as netted just because an agent was dispatched.
- **A LIMIT STOPS; IT NEVER RELOCATES — ratified 2026-07-30 (Fable's
  word, FX17 S3).** When a new bound arrives it may prevent further
  motion in the direction it governs; it may NOT rearrange what
  writers already made. Concretely: a card already sitting past
  `BOARD_MAX_Y` (an older save from before the constant existed, a
  deck load that placed it) keeps its position exactly — the clamp
  floors its own headroom at zero rather than clamping to a negative
  one, so the card cannot travel further down while still moving
  freely up and sideways. A stop, never a correction. Same family as
  *loose may never be nudged*. **Cite it in future geometry and theme
  work**: the test is whether merely INTRODUCING the law moves
  anything that already exists. If it does, it is not a limit — it
  is a migration, and it needs its own word.
- **ANNOTATION (2026-07-30, chat 6 — the DF1.1 lane, which
  superseded it): THE ISOLATION RULE BELOW IS RETIRED, not deleted.**
  DF1 killed "it passes in isolation" as a clearance argument
  (isolation proves a file CAN pass alone, which was never the
  question), and DF1.1 named the successor Fable ratified: **re-run
  under the conditions that produced the failure, not away from them
  — batch-then-batch-again, and only after a mechanism check.**
  DF1.1 also retired the companion argument "the machine was quiet,
  therefore not environmental": `CDP page target never appeared` has a
  second, non-contention cause (PID-keyed browser profile dirs left by
  killed runs, feeding dead ports to later runs). The entry below is
  kept verbatim for the audit trail; its own practice note — that a
  merge-gating sweep should not run alongside another session's build
  — still stands, and is now enforced mechanically by
  `run-suite.mjs`'s fail-fast refusal.
- **CONTENTION-SUSPECTED FAILURES MUST BE RE-RUN IN ISOLATION —
  ratified 2026-07-21 (Fable's FX8 review, Ruling 4a).** A harness
  check failing only inside a full-suite run, never in isolation, is
  not to be called transient on the strength of that pattern alone —
  re-run it 2-3+ times in genuine isolation first, and disclose the
  actual pattern (isolated-clean count vs. suite-failure count)
  either way. Practice note from the same ruling: a sweep whose
  result gates a merge should not itself be run alongside another
  session's own build — that is what manufactures the contention this
  rule exists to catch.
- **PARKED ENTRIES ARE IMMUTABLE — RATIFIED 2026-07-22 (Fable's word,
  the CD3 incident, item 53), NO incidental exemption.** A parked
  assertion may be superseded again (its own new park cycle, with its
  own fresh SUPERSEDED marker and successor), re-pointed at a different
  successor, or annotated with a comment — but a parked entry's own
  recorded ORIGINAL text, once parked, is never rewritten. Touching a
  parked entry's original text is never a fix. **No "plain incidental
  count bump" exemption** — the question was raised (B1's own
  `9ce8f6b` in-place edit of an already-parked `ab3.mjs` entry,
  `stripItemCount 7→8`, invoking an `fx2.mjs`-style incidental-bump
  precedent) and RULED against: a change to a parked entry's own
  tested condition is a violation regardless of how small, because the
  whole point of the frozen record is that it stays byte-true. **B1's
  count bump ruled a violation — but pre-law, already remediated (the
  CD3 fix pass restored the parked text and added a fresh generation
  rather than mutating further), no further action on that specific
  instance.** Trigger: a concurrent session's own harness edits
  mutated an already-parked historical entry in-place rather than
  starting a new park cycle (CD3), discovered by an independent audit;
  the review then found the same class had ALREADY happened once
  before, undetected (B1). The systematic question — are there OTHER
  undetected pre-law mutations across the harness tree? — becomes a
  parked-entry history-audit rider on item 48 (not this specific
  entry's concern).
  **CODICIL — ratified 2026-07-22 (Fable's A1 ruling, items 53/54;
  `docs/wrizo-alpha/a1-immutability-ruling-2026-07-22.md`), the
  RECORD-vs-PROBE distinction.** A parked check is two parts: the
  RECORD (the quoted, non-executing name/original text — frozen) and
  the PROBE (the boolean that runs, re-verifying that current reality
  still justifies the park — an instrument, never part of the record;
  it has never had to match the frozen text). **A parked entry's
  probe MAY update in place — but ONLY in a commit that also records
  the supersession event that moved reality (a fresh park cycle for
  the superseded generation + a live successor), with the probe
  update disclosed by name in the commit message.** A probe update
  arriving WITHOUT that same-commit supersession record is treated as
  a record mutation and remediated as one. The bright line: the
  record is the quoted non-executing text; the probe is what runs; a
  probe may move only when reality moved, and the record of reality
  moving must travel in the same commit. (CD3's and BM1's instances
  both satisfy it; E1.1's own `e1-rou→ndtrip` probe update rode the
  same commit that hardened the suffix, disclosed.)
- **Erratum vs. supersession, for harness checks — ratified 2026-07-16
  (Fable, cd1.1 spot-check).** Two different situations, two different
  moves. A check falsified because the DESIGN changed (a surface
  retires, a selector's target is genuinely gone) parks per A4:
  original moved verbatim (quoted, SUPERSEDED/DORMANT species, one-line
  reason) into its own file's PARKED section, a NEW live check asserts
  the new truth. A check falsified because an EARLIER REVIEW's own
  brief reading was wrong (an erratum — the code was right, the
  ground-truth call was the defect) updates IN PLACE instead: same
  check, corrected assertion, renamed with the fold's label (e.g.
  `S1/cd1.1: ...`) so its diff discloses the touch — no parking, since
  nothing about the design was ever superseded. cd1.mjs's S1 check
  (Pages/Plan toggle) is the worked example of the second case.
- **DEPLOY-MANIFEST RULE — ratified 2026-07-17 (Fable), standing across
  all tracks.** Trigger: the FX2 deploy (`railway up` @ `740b572`,
  Nick's word "Go ahead and deploy") shipped a SHA that also carried
  HB1's merged-but-not-yet-sat-with code as an unnamed rider — HB1's
  own device sitting had not happened, and no deploy clearance was ever
  given for it by name (see item 27's own retroactive-finding note).
  **A deploy ships a SHA, not a ticket.** Before any `railway up`, the
  deploying session enumerates every merged-but-undeployed ticket
  contained in the target SHA and names them ALL in the deploy request
  — Nick's deploy word is valid only against that enumeration. If any
  named ticket lacks its own deploy clearance, the deploy waits, or
  ships from the last cleared SHA instead. Practically: before typing
  "deploy," run `git log <last-deployed-SHA>..<target-SHA> --oneline`
  (or read the ledger's own merged-not-deployed items) and name every
  ticket that turns up, not just the one the request was about.

## ITEM 84 — THE DRAFT ROSTER: BUILT, STAMPED, OFFERED — 2026-09-02 (roster build lane)
History of ITEM 84: [2026-08](ledger/2026-08.md) <!-- c13-3 -->

**Offer:** `docs/wrizo-alpha/item84-roster-offer-to-chat1.md`. **Branch:**
`item84-roster` (worktree `.claude/worktrees/item84-roster`, never the primary
checkout — item 110). **S0:** `docs/menus/tutor/item84-draft-roster-s0.md`.
**Both settings CLEAN at `tree=4e8e1e8`, 66/66, bundle
`index-Z119zo1S.js/553267b`, no `+Ndirty`, identical bundle across the pair.**
`tsc` clean desktop AND server; `hooks-order` PASS; **ZERO SCHEMA** (migrations
untouched; the one `apps/server` file is a route-level request-body change).

**WHAT SHIPPED.** The four-chip Draft roster inside *Talk it through*, above the
composer — the mount the lock record already ruled (§1 line 1), gated on
`mode === 'drafting'`. Asks 1-3 STAGE into the composer (editable, caret placed)
and put nothing on any wire, measured from both ends. **TD4 adds exactly one wire
key, `selection`**, frozen at the press (a button press collapses the DOM
selection, so a send-time read would send the wrong thing or nothing);
`pageText` stays a render prop and never becomes a key. Per-press consent is
mechanical: pressing asks 1-3 DISARMS, and one press funds exactly one send.
A13 intact — the hosts compute the selection and hand down a read-only string
(`useSurfaceSelection.ts`); no editor ref, no text setter.

**STRINGS OF RECORD.** All four EXTRACTED programmatically from the build brief's
§2 table into both the lexicon and the harness — never retyped, so no keystroke
exists in which ask 2's em dash (U+2014) could degrade — and cross-verified
byte-for-byte against this record's own §3/§4. The overturned ask 3 stands
untouched in Pass 2 and the mockup HTML (corrected-not-rewritten) and is asserted
**absent** from the rendered app.

**DISCLOSURE v3 -> v4 EXECUTED, and it is this ledger's own ruling carried out.**
v3 names three travelers and a selection is none of them, so TD4 under v3 would
send what the shown sentence does not name — the brief's §6 stop. This ledger had
already ruled the disposition (see DISCLOSURE v4 above, the "annotation form"
line), so `CURRENT_DISCLOSURE_VERSION` is **4**: v4's ratified sentence leads the
modal (verified against its manifest — 183 bytes, md5
`9287082c0e3c0a2b243c71ce01c89b43`) and **v3's string is REUSED BY ID beneath it,
never copied and never edited**, which makes "verbatim beneath" a fact about the
line rather than a claim about it. **Fable ratified the reach** as the ledger's
supersession ruling executed, not scope invented. **BD4 collision surface stands
for chat 1 to verify at merge** — item 83's BD4 mounts on this same sentence.

**SCREENPLAY CARRIES THE ROSTER — RULED, stands as built.** `ScriptEditor` passes
`mode="drafting"` unconditionally, so a screenplay page IS a Draft page; the
roster renders there and the selection is threaded to that surface. Fable: the
roster follows the MODE, which is the design's own gate, and a dead TD4 chip on
script pages would have been the worse shape (G3's locked door). One predicate to
overrule at the desk's leisure; not blocking.

**PARK SWEEP — 5, each verbatim with a successor named.** `item84.mjs` 1 (a
**park of MEANING**: *"that Draft panel carries no roster either"* still PASSES,
reading the Free Write class, but stopped describing a panel that now carries
four chips — Fable registered this as the immutability law's subtlest form);
`tu1.mjs` +1, `tu2.mjs` +1, `tu5.mjs` +2 (the disclosure version-NUMBER
assertions only). **No WORDING assertion parks anywhere** — annotation form keeps
v3's body carrying v3's words exactly. The **ten fixture seeds moved 3 -> 4**: a
fixture repair on TU5 S6's own precedent (`tu1.mjs:98`), not a park.

**TWO DEFECTS THE LANE FOUND IN ITSELF — both recorded, neither quietly fixed.**

1. **A fixture hazard that read like an A13 breach.** `item84b.mjs` S8 returned
   `storedBefore:"" / storedAfter:<the page>`. It was not a breach: the four
   per-press DOM assertions passed throughout (that IS the A13 claim), the text
   that "appeared" was byte-identical to what was already on screen before any
   press, and `item84.mjs`'s S7 runs the same pattern and passes — the difference
   is a MODE SWITCH, which re-seeds the editor and re-persists on
   `persistence.ts`'s debounce. **MEASURED: the baseline takes 1100ms to settle,
   notably longer than `FLUSH_DELAY` (300ms) alone would suggest — the mode
   switch's re-persist is genuinely late, not one debounce tick. Any future
   fixture that switches modes and then reads the store can trip on this.**

2. **A hole in the lane's own park sweep, found by auditing the stamp rather than
   trusting it.** The v4 bump edited `tu2.mjs`'s live version check 3 -> 4 and
   updated its PARKED summary to claim an item-84 entry — **but the `pok()` call
   was never pushed**, leaving an assertion rewritten in place with no parked
   predecessor. **Both suites were CLEAN with the hole open.** The tell was
   arithmetic, not a failure: `TU2 PARKED: PASS (9 checks)`, the same 9 as before
   the ticket, against a summary claiming ten. **A GREEN SUITE DOES NOT PROVE A
   PARK SWEEP COMPLETE; ONLY COUNTING DOES** — worth the house's memory.

**BASE DRIFT HANDLED IN-LANE.** `origin/main` advanced to `a20b51f` (fix wave
E4/E3/118) mid-stamp, touching three of this ticket's files. The lane MERGED main
in and re-stamped rather than offering a green taken against a base that no longer
existed — E4's change is the unborn gate at the very line this ticket's Tutor
mounts on. One conflict (`PageEditor.tsx`), resolved keeping E4's un-gating whole
and carrying `selectionText` through it; the `send()` auto-merge was read rather
than trusted, and E4's `isUnborn` refusal correctly returns before the arm is
consumed, so an unborn surface keeps both the writer's sentence and the stretch it
points at.

**ONE MIS-TARGETED RUN, named:** a relative script path with a stale cwd ran the
PRIMARY checkout's suite (`62/62 tree=32c1ebd`). Not this lane's result and not
quoted as one. Primary's `git status` verified clean; the only trace is gitignored
`dist-web`, rebuilt from the primary's own source, and five of this ticket's
unique strings were grepped against that bundle — **all absent**, with the
worktree's bundle as a positive control. **Nothing of this lane can reach a deploy
from that tree.** Superseded stamp pairs, so none is mistaken for current:
`6aa9144` (NOT CLEAN — defect 1), `7fc1d86` (stale base), `cd2d30f` (park hole
open). **Offered: `4e8e1e8` only.**

**STILL OPEN, unchanged by this build:** the Free Write roster's model phase
(carve-out sentence + threshold + TU5 memory seam), the conversation rules
(deferred by Nick), the Revise re-pass / item 112, and **the shared-row label
collision — ROUTED to Revise, not resolved here**: Draft ships its own string
(*"Look at just this stretch — what's it doing?"*) and the reconciliation happens
when Revise exists.

**Gates:** merge on green -> Fable's review -> ship on PASS under Nick's word, own
manifest, rollback from whatever is live. **No deploy from this lane.**

## ITEM 151 · SHAPE A — THE 91-FILE PAIR, BOTH LEGS CLEAN — 2026-09-18 (tools
History of ITEM 151: [2026-09](ledger/2026-09.md) <!-- c13-3 -->
lane; branch `item151-silent-acts`)

**RUN UNDER `tools-item151-91pair-20260918`, box idle first (0 foreign
browsers), pushed at pair start (already at `c46d498`, nothing new to
push), both legs joined so both always run. BOTH CLEAN, ZERO REDS, VERBATIM:**

```
SUITE START HARNESS_PARKED=unset files=91 tree=c46d498 bundle=index-DfFOCr6L.js/586771b
...
SUITE DONE HARNESS_PARKED=unset — 91/91 of 91 returned a passing verdict
SUITE RESULT: CLEAN — tree=c46d498 bundle=index-DfFOCr6L.js/586771b

SUITE START HARNESS_PARKED=1 files=91 tree=c46d498 bundle=index-DfFOCr6L.js/586771b
...
SUITE DONE HARNESS_PARKED=1 — 91/91 of 91 returned a passing verdict
SUITE RESULT: CLEAN — tree=c46d498 bundle=index-DfFOCr6L.js/586771b
```

**Zero `FAIL` lines in either leg's full output** — no candidate findings to
diagnose. `tp1.mjs` (the falsification, §11 of the offer) ran identically in
both legs, 7/7, no `parkedChecks` (a new file, nothing legacy to park). Box
left clean afterward — 0 foreign browsers post-run, same as pre-run.

**What a fully clean pair means here, stated rather than left implicit:**
§12 of the offer named the covered-point census UNKNOWN and offered a
qualitative risk shape instead of a count — this result is that unknown
resolving to zero-observed, not to a number predicted in advance. It is
NOT proof that every one of the 102 fixed sites was already safe before
this build; it is that under THIS run's own gestures, timing and window
sizes, none of them hit a covered or empty point. The hit-test now
gates every one regardless — the same class item 130 first caught stays
caught the next time layout, timing or window size differs, not merely
this time.

**Offered for merge — harness/test-seam work, chat 1's verification is the
gate per the standing amendment.** Branch `item151-silent-acts`, tip
`c46d498`, pushed. Nothing further owed on tools' side.

## RECORDS — NICK’S WORDS ON ITEM 166 (A GUIDELINE, NOT A HARD RULE), THE PLAN MENU’S “ADD BOARD” SETTLED BY SKIP — 2026-09-24 late (chat 1)

**RELAY DUPLICATES, noted.** The first three blocks of this relay (“1. Yes, beside 2. Done.”,
the 144 merge at `cc48193`, and the “Store them properly” schema word) were ALREADY recorded in
the entry just above and merged (`4187cfb`); nothing re-recorded.

**NICK, verbatim as relayed — item 166 (typos and the “---” his):**

> “166-Q1: Just have it overlap the page in these fringe cases. 166-Q2: I don't see how this
> would work if side panels from both sides are opened at the same time. If we're only
> allowing one menu to be open at a time, the menus should be able to fit next to the board.
> If they can't because the window has been shrank or the user is on a small laptop screen,
> then let's have the menus just overlap the board. There should always be enough room on
> either side of the board, though, for the strip menus to open without the board being
> moved or overlapped. 166-Q4: This is fine on the narrowest screens. It's a guideline ---
> not a hard-and-fast rule.”

**WHAT IT RULES (Fable):** 166’s “no pop-out covers the page” is a GUIDELINE, not a hard rule (his
words). Side panels sit BESIDE the page or board when there is room; on a shrunk window or a
small screen they OVERLAP it. **The strips always have room on both sides of the board to open
without moving or overlapping it — he states that one as “always”.** The narrow-screen toolbar
overlap stays. (Reads consistently with the page-primacy canon in `AGENTS.md`: tools overlay
without displacing — the page’s rect never changes. Not re-ruled here; flagged so a builder
does not read “overlap” as licence to move the page.)

**WITH NICK NOW (Fable’s question, from his Q2):** one side panel open at a time IN TOTAL, or one
per side as today? **Default (vetoable, not founder text): one per side** (the approved rule),
with his fit-or-overlap rule applying either way.

**166-Q1, Q2, Q4 are with Nick per defaults on PLAN DESK’s sheet** — his words above answer them;
**166-Q3 and 166-Q5 go BACK TO PLAN DESK** to re-base their defaults on 166’s own law (no
pop-out ever covers the page), so a skip cannot carve an exception. *(Ordering note: Fable’s
earlier relay listed Q1/Q2/Q4 as “with Nick” and this one records his answers — the answers
supersede; the default-listing is left as relayed.)*

**SETTLED BY SKIP — the Plan menu’s “Add Board” (a default taken by silence, NOT a ruling).** His own
words:

> “Can't we just call Plan menu's option "Add Board" too? It can be greyed out unless there
> is already a board opened”

The Plan menu’s button becomes “Add Board” — a NEW board inside the open one, greyed out when
none is open. Nesting an EXISTING board happens by DRAGGING it onto another board, mirroring
drag-off to un-nest (Fable’s default). **The earlier “Put inside…” rename is WITHDRAWN**; his
proposal replaced it. *(This is the third default on 144’s names by skip — keep marking them.)*

**MERGE.** `plan-144-amend3` @ `8c213bb` — one file
(`docs/menus/b144-plus-menu-and-unnest-amendment.md`), 34 insertions, docs-only — **merged on
this desk’s verification.**

## ITEM 198 — NICK’S SCHEMA WORD (“Yes”); 159’S FALSIFICATION NOW ON DISK — 2026-09-24 (chat 1)
History of ITEM 198: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**NICK’S SCHEMA WORD, verbatim as relayed.** The question as put: *“may FIX change the database
to fix the sync bug?”* — explained as: each of the six storage tables gains one new column where
the server records when it received each change; devices pull by the server’s clock; missed
writing is repaired; nothing visible to him. Fable recommended yes. His answer:

> “Yes”

**It covers FIX’s S0 shape** (`item198-s0` @ `94ae43f`): `synced_at timestamptz not null default
now()` on the six tables. **Nothing writes until FIX’s build clears Fable’s byte review.** *(A
schema word: it stopped here and is recorded as his.)*

**198 does NOT wait for 136’s and 172’s schema wave** — it is a data-loss fix. **When it clears
review, the batch is proposed at once, with whatever else is merged by then** (Fable).

**MERGED, on verification.** `item198-s0` @ `94ae43f`: `docs/menus/item198-sync-cursor-s0.md` +
`apps/desktop/scripts/sync-incremental-pull-proof.mjs` (398 insertions). **Fable called it docs;
one file is a script, so I read it:** a standalone, browserless measurement (real `sync.ts`
router bundled to the OS temp dir, a fake pool, two real client-store instances, no box turn, no
DB, no browser); **referenced by no roster and no `package.json`**, and `git diff --stat
5603d52 HEAD -- apps/desktop/src packages` is empty — **no product file touched.** I did NOT run it.
**And `item159-falsification-evidence` @ `3abc134`** (`docs/evidence/item159/`, 7 files, +114).

**159’S FALSIFICATION — NOW ON DISK, and checked against the report.** Old code
(`0c8838c+1dirty`, `index-BDZr-D5R.js/588012b`): **`ITEM159 VERIFY: FAIL — 6/9 failed`**, with S1
(“the ticket”), S1’s grip, S2, **S3 the overlap**, S4 and S5 red — **matching what FIX reported
(6 of 9, S1 and the S3 overlap among them)**. New code (`e31b43a`): PASS 9, both legs. **FIX’s own
README says plainly** that the old-code tree stamp reads `+1dirty` because `item159.mjs` was
overlaid onto a main checkout (the file does not exist on main), that a first `--only` attempt
matched zero files (a vacuous pass, excluded), and that only two of the six reds are independent
falsifiers. **The `*.log` gitignore hid the runner logs; they are `.log.txt`** (the memory
note’s hazard, met again).

**RECONCILED:** my earlier entry (“FIX-reported, not on disk — owed before Fable’s review”) is
discharged; left as written.

## RECORDS — THE TRASH’S TWO CONTROLS, SECTIONED ROWS, VW2’S LOOK HELD — 2026-09-24 (chat 1)

**RULED (Fable): the Trash’s two controls are both “Delete Permanently”** — his own words named it for
single items and for the entire bin (ledger: 168-Q1, above), so the “Empty Trash” rival is STRUCK, not
asked. **The bin’s confirm follows VW4’s form:** in place at the Trash foot, never a modal, with a
lawful count. **VW4’s “no per-item permanent delete” is SUPERSEDED by his words** (VW4’s brief is
left as written, marked at its head by PLAN DESK).

**RULED (Fable): Shelf and Trash rows are SECTIONED — Boards, Pages, Cards.** That satisfies both his
2026-09-13 “section off Boards from Pages” and his 3C rows; nothing to ask.

**HELD:** the Shelf-ledge vs Trash-well LOOK waits until VW2 is scheduled to build; Fable draws the two
frames then. **Still with Nick:** item 201’s `purged_at` (no default).

**MERGE.** `plan-vw2-rows` @ `496c20d` — 4 docs files under `docs/menus/`, +198, by fetched SHA; it
also carries **a correction PLAN DESK made to its own item-201 design** (33 lines added to
`b168-rulings-and-item201-delete-permanently.md`) — **I did not read that correction; it is docs, and
the `purged_at` design stays with Nick regardless.**

## ITEM 201 — NICK’S SCHEMA WORD (“1. Yes”) — 2026-09-24 (chat 1)
History of ITEM 201: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**NICK’S SCHEMA WORD, verbatim as relayed.** The question as put: *“May Wrizo add one column so
“Delete Permanently” sticks on every device?”* — explained as: a permanent delete wipes the item’s
content but keeps a small “permanently deleted” marker every device learns and respects; pages need
one new column, cards need none; Fable recommended yes. His answer:

> “1. Yes”

**It covers `purged_at` on `journal_entries`**, per PLAN DESK’s design (`plan-168-delete-permanently`
@ `87eae9a`): the row stays, the server blanks its content, and the mark never reverses. **Nothing
writes until the builder’s S0 shape report and Fable’s byte review.** **Builder: FIX, after 198’s
cursor refinement and 184.** *(A schema word: it stopped here and is recorded as his; this closes the
“WITH NICK” line in the entry above — left as written.)*

**ALSO THIS TURN:** the `plan-vw2-rows` merge (`496c20d`) and its rulings are on the ledger above.

## ITEM 181 — NICK’S SCHEMA WORD (“181: Yes”), HIS VETO OF 180-Q2, ITEM 203 REGISTERED — 2026-09-24 (chat 1)

**NICK’S SCHEMA WORD, verbatim as relayed.** The question as put: *“May Wrizo add one new table to store
your photos on its server?”* — explained as: he keeps the original, it shows on every device, and it
arrives as a CARD (supplemental material), never inside his writing; the alternative (shrinking photos
into pages) would break sync past its size limit; Fable recommended yes. His answer:

> “181: Yes”

**It covers `user_files` (bytea first)**, per PLAN DESK’s pass (`plan-181-file-pass` @ `55d29e1`), **and the
folded-in images item.** **Nothing writes until the builder’s S0 shape report and Fable’s byte review.**
Builder: assigned later; images were planned after Experiment 1. *(A schema word — a NEW TABLE, which
is the case the standing law names — recorded as his.)*

**FOLD, recorded plainly:** the “writer’s own images” item registered on 2026-09-24 in the entry
“NICK’S WORDS ON THE WORD FOR PAGE LINKS, CONNECT BOARD…” **was registered there WITHOUT A NUMBER — my
omission**; it never took one. It is the same storage as 181, so **it FOLDS INTO 181: one question, one
item.** No number is spent on it.

**NICK’S VETO of Fable’s 180-Q2 default, verbatim as relayed:**

> “Instead of “Put in a drawer,” let’s go with “File Page.””

**The button reads “File Page”.** (Fable’s default “Put in a drawer…” is superseded; it was a default,
his word is a ruling.)

**RULED / STRUCK (Fable):** **180-Q1 is STRUCK, not asked** — the standing default from the handoff: on a
tablet a carried page cancels by tapping anywhere that isn’t a drawer (PLAN DESK’s visible “stop
carrying” button is a design detail on top). **FABLE’S DEFAULTS, VETOABLE, NOT founder text:** **180-Q3**
the Drawers menu stays open after a page lands · **181-Q2** a dropped photo becomes a file card on the
page you’re on · **181-Q3** photos first; PDFs through Import Sources. *(180-Q2’s default is the one
above he vetoed.)*

**ITEM 203 — `/sync`’S 5 MB REQUEST-BODY LIMIT — REGISTERED, OWNER FIX** (`index.ts:19`, PLAN DESK’s find).
Measure the largest realistic push (heavy ink, a long offline stretch) against it, and whether a
refused sync is VISIBLE to the writer. *(Reported, not measured by this desk.)* Registry: next free **204**.

**MERGES.** `plan-180-carry-pass` @ `fde98fc` (1 docs file, +150) and `plan-181-file-pass` @ `55d29e1`
(1 docs file, +166) — docs-only, merged by fetched SHA on this desk’s verification.

## RECORDS — 204 PART 2 RULED (harper.js), PW’S STRIP AUDIT RULED, ITEM 205 REGISTERED, THE BOX ORDER CHANGES — 2026-09-24 (chat 1)

**Batch Six live: recorded (Fable). Nick repeats his two-device check now** — his result, when it comes,
goes on the record; none is on it yet.

**RULED (Fable) — ITEM 204 PART 2:** the grammar engine is **harper.js (slim), Apache-2.0**, run in a WORKER,
**loaded only when Revise is entered and cached**; style / readability / enhancement rules OFF; **the colour map
comes from the RULE (spelling/typo → red, the rest → olive)**; **a per-writer dictionary is required.** **The
browser’s built-in checker exposes no ranges to JS, so once harper lands it owns BOTH colours and the native
checker goes off.** **INK’s one-liner (`revise-spelling` @ `cbd4dc6`) is the INTERIM red until then; its branch
is item 204 part 1** — not merged; not yet offered to this desk. **The 7.7 MB web download is accepted
(Revise-only, cached).** *(A new dependency — ruled by Fable under the ticket; Nick’s standing law that grammar
and spelling are never AI is met: harper is a rule engine, not a model.)*

**RULED (Fable) — PW’S STRIP AUDIT:** **(a)** page-setup chips are settings, excepted · **(b)** the
Prose→Screenplay Structure verb is RETIRED by item 184 (FIX, `11b93b0`, awaiting its run), per his ruling —
no exception needed · **(c)** board-strip tools are out of this slice; PLAN DESK states the board reading
later · the typewriter toggle sits with the settings gear, excepted as a setting.

**ITEM 205 — REGISTERED (Fable):** **forward lock and the writing goal move behind ONE Page settings row** —
its own item, **not Experiment 1.** No owner. Registry: next free **206**.

**BOX ORDER CHANGES (Fable), superseding the order in the entries above:** after TOOLS’ 195 → **FIX’s
formatting screenshot run (short) → FIX’s 158 → FIX’s 160** → as queued. **160 now follows 158** (it was
ahead of it before; 160 still gates 144’s merge and 201’s UI). **The writing surface comes first.** The grant
names TOOLS for 195 and has not changed.

## ITEM 207 — NICK’S RULINGS ON FONTS (Q1, Q2, Q3, Q5), THE MINIMAL-INTERFACE LAW; 206’S FIX ORDER; 204 PART 2’S CEILING — 2026-09-24 (chat 1)

**NICK’S WORDS ON FONTS, verbatim as relayed (Q1, Q2, Q3 and Q5 as put):**

> “Q1: We also need Times New Roman, add to Atkinson Hyperlegible a more standard sans serif
> like Arial. Q2: Have Free Write show all fonts that have been added previously, too, but
> do not include an option in Free Write to add new fonts. That feature should only be
> available in Draft and Revise mode. Q3: Cards should default to the everyday font, but the
> font options should be available in the Card's tool strip menu, but the interface should
> be as minimal as possible (same goes for all strip menus). Q5. Let's make font size
> adjustable with a "+" and "-" symbol that also moves the font size number. The number
> should be able to be manually adjusted, too, though, because sometimes writers are
> following style guides with precise font styles/sizes. Leave the manual number selector
> off of the Free Write options, though. Keep that just a plus/minus with no number
> displayed. The steps on the +/- should start at 11 and go up and down in one point
> increments with limits: lower limit should be 6pt, and the upper limit should be 18 at
> which point fonts should get larger in 2pt increments up to 30, and then 4pt increments up
> to some reasonable limit (120pt, maybe?)”

**RECORDED AS RULINGS (Fable).** **His Q2 and Q3 SUPERSEDE PLAN DESK’s defaults** (no font choice in Free
Write; no per-card fonts): Free Write SHOWS fonts already added but offers no way to add new ones (that
lives only in Draft and Revise); cards default to the everyday font, with font options in the Card’s
tool strip menu. **Times New Roman is required; a more standard sans like Arial joins Atkinson
Hyperlegible.** **Size:** “+”/“−” with the number moving with it, the number also typeable (style guides),
**no number in Free Write** (plus/minus only); steps start at 11 in 1pt increments, floor 6pt, up to 18,
then 2pt increments to 30, then 4pt increments to a limit he leaves open (“120pt, maybe?”).

**A STANDING LAW, in his words: “the interface should be as minimal as possible (same goes for all strip menus)”.**

**WITH NICK — one wrinkle, no ruling yet:** 4pt steps from 30 land on **118, never 120**. **Default
(vetoable, not founder text): “+” tops out at 118; a typed size may go to 120.** **Q4 (uploading font
files) WAITS until uploads are next.** **“Card-level fonts: none in v1” was FABLE’s framing, NOT his —
and his Q3 says card font options DO exist in the card’s strip menu; PLAN DESK reconciles.** **Fonts 207-Q1,
Q2, Q3, Q5 were with Nick and are now answered above.**

**RULED (Fable), 206’s FIX ORDER:** FIX’s order, with one change — step 1 adds his #10: **styled text
RENDERS in every mode (Free Write and Revise included); only the styling TOOLS stay where they were
ruled. Rendering is not styling.**

**RULED (Fable), 204 PART 2:** harper’s CEILING is recorded — **no pronoun-case rule exists (“between you
and I” is never caught).** “Style off” is built as a read-time drop on `lint_kind()`; “Miscellaneous”
maps to olive. **TUTOR writes the engine half of the build brief; PLAN DESK designs the writer-facing
half** (the dictionary, the dialect, where suggestions appear).

**MERGES, by fetched SHA, verified:** `plan-207-fonts` @ `3bfb70a` (3 docs files, +224) ·
`item204-part2-s0` @ `5ef55e0` (1 docs file, +331) · `item-writing-s0` @ `b4c3da3` (the audit doc +
`apps/desktop/scripts/writing-engine-audit.mjs`, +138; **I read that the script writes only to the OS
temp dir and no roster or `package.json` references it; I did not run it**). **Fable’s note: the box
order in `e8b7101` stands; no further reorders except for a live defect.**

## RECORDS — A STOP IS A TREE KILL; ITEM 208 REGISTERED; users.proofing’S SCALAR STAMPS; TOOLS’ TWO-RUN TURN — 2026-09-24 (chat 1)

**RATIFIED (Fable), from FIX’s stop: STOPPING A RUN IS A TREE KILL** — runner, its harness children, their
browsers. **A task stop on a background chain does not reach grandchildren.** **The stop is confirmed by 0
runners and 0 harness browsers, MEASURED, before “box free”.** (This desk measured exactly that before
granting `d4dc32e`.)

**ITEM 208 — `reapOrphans` REPORTS “FAILED TO KILL” FOR A PROCESS THAT HAD ALREADY EXITED — REGISTERED
(small; owner: whoever holds the reaper).** Re-check liveness before calling a kill failed, so its report can be
read as fact. *(FIX’s sweep reported “one reaped, nine failed” and the recheck read 0 — recorded above.)*
Registry: next free **209**.

**RULED (Fable), 204 part 2 — AN AMENDMENT to the approved `users.proofing` shape (PW, `63c0895`):** the
scalars carry stamps — **`dialectAt` and `ignoredAt`, optional, later wins, the same rule as words; an absent
stamp loses to a present one.** **Same column, no schema change.** Found by PW’s round trip (K4): without it a
writer could never save a dialect. **The stamps are device clocks; a skewed clock can win a scalar, and that is
named with the residuals.**

**BOX (Fable):** after FIX’s `d4dc32e` pair, **TOOLS’ turn names TWO runs in sequence — 195’s pair, then
`item207.mjs` with the chars-per-line re-measure** — then FIX’s 160 → PW’s Experiment 1 run → the rest. **The
grant names FIX and is unchanged.**

## NICK’S RULING ON THE INDENT LOOK (TAB = FIRST LINE); ITEM 209 REGISTERED — 2026-09-25 (chat 1)

**NICK, verbatim as relayed** (answering the indent-look question: A first line only · B the whole paragraph as a
block):

> “Tab question: A. Let's add a keystroke shortcut where TAB + "1" indents the whole
> paragraph. All Tab keystrokes should keep indenting the text further, too, even if it has
> already been indented once.”

**RECORDED AS RULINGS (Fable):**
1. **Tab = first-line indent (A), one level per press, repeatable** (“All Tab keystrokes should keep indenting the
   text further, too, even if it has already been indented once”).
2. **ITEM 209 — TAB + “1” INDENTS THE WHOLE PARAGRAPH, one level per press — REGISTERED, owner FIX, riding with 206
   step 3.** It needs **a new stored token — a text-grammar change, NOT a schema change — read through the one
   reader** (`markRuns.ts`). Registry: next free **210**.

**DEFAULTS, VETOABLE, NOT founder text (Fable):** Shift+Tab removes one first-line level; Shift+Tab+1 removes one
block level. Draft and Revise; **Free Write on a blank line only** (the forward law). **The rail’s indent arrow stays
the same act as Tab; no new control** (his minimal-interface law).

**A NOTE FOR THE BUILDER, mine, not a ruling:** what is live since Batch Seven is 158’s Tab — which per its own
comment indents “one leading tab on every line of the paragraph”, i.e. the WHOLE-PARAGRAPH look (B), not the
first-line look he has now chosen (A). **So this ruling changes what a live Tab does.** *(From the source I pasted
to Fable; I have not re-checked it against the running app.)*

## ITEM 211 — NICK’S RULING: “A” (MARKERS NEVER SHOW) — 2026-09-25 (chat 1)

**THE QUESTION AS PUT TO NICK (as relayed by Fable):**

> “(A) Never show. The page always looks like a finished book page. You change styles only
> with the buttons, the right-click menu and shortcuts, like in Word. (B) Show only while
> your cursor is inside a styled word. That's how it works now, and it lets you edit the
> marks by hand. I recommend A. Default: A.”

**HIS ANSWER, verbatim:**

> “A”

**RECORDED AS A RULING (Fable):** **markers never show — on the page in EVERY mode and on cards — and
reveal-at-caret is RETIRED.** **Hand-editing markers goes with it, as the question said.** *(This settles the
“two readings” I flagged on the 211 entry: reading (1), Fable’s, is Nick’s. The default and his answer
agree; it is his word, not a default taken by skip.)* **FIX’s S0 shape report comes to Fable BEFORE any build;
if it calls for a NEW EDITOR MODEL, it goes to Nick in plain words first.** *(Fable’s own conditions.)*

**A NOTE, mine:** this changes what is LIVE (Batch Seven): the
reveal-at-caret Nick saw in his screenshot is shipped behaviour, so 211 is a behaviour reversal of a shipped
design, not a bug fix in the narrow sense.

## STANDING RULE ADOPTED; BATCH EIGHT PINNED TO 13cd415 EXACTLY; ITEM 217 (revise-spelling); ITEMS 218–219 REGISTERED; ci-browserless-checks HELD — 2026-09-30 (chat 1)

**STANDING RULE, ADOPTED: every grant this desk writes opens its reply with “→ <LANE>: grant written —
<run>”**, so Nick can pass it straight on. *(TOOLS’ 207b grant, written last turn, may be sitting unseen;
Fable has pinged TOOLS through Nick. Going forward every grant in this session follows the rule; earlier
ones in this thread did not all carry the arrow line — not restated retroactively.)*

**BATCH EIGHT, CORRECTED: it takes 204’s storage half at `13cd415` EXACTLY** (“rebuilt on its own branch off
`origin/main`”) — **NOT the branch’s current tip.** **PW’s two ENGINE commits, `ff2d227` (harper in a
worker behind Revise) and `bb65223` (the falsification found three instrument defects, not product ones),
now sit on the SAME branch and are NOT in the batch.** *(Verified: both are on `origin/item204-proofing-
storage`, past `13cd415`.)*

**ITEM 217 — `revise-spelling` @ `cbd4dc6`** (the browser’s own spell-check, on in Revise only) — its number,
given per Fable’s instruction (the branch’s own commit message called it “item number pending from chat
1”). Registry: next free **218**.

**ITEM 218 — PRODUCTION RUNS NODE 18, END-OF-LIFE SINCE APRIL 2025** (`railway.json` → Nixpacks →
`engines.node “18.x”`) — REGISTERED, owner this desk (config), scheduled AFTER Batch Eight. **Move
`engines.node` and `.nvmrc` to 22.x in their own small batch, with a box pair and the usual rollback; fold
in whatever Cloud’s security review adds.**

**ITEM 219 — `tsconfig`’S `moduleResolution: "node"` → `"bundler"`** (PW’s finding; harper’s exports map) —
REGISTERED, small, unowned.

Registry: next free **220**.

**`cursor/ci-browserless-checks` @ `23c7a3a` — HELD, NOT MERGED.** Checked the workflow file: **neither of
the two edits Fable named (least-privilege `permissions:`, the Node version read from the same source
production uses) is in it yet.** Advisory, `.github` + `docs/ci/README.md` only — **merges on verification
once both land.**

## THE TRIP, RECORDED; NICK’S WORD ON ITEM 195 — 2026-10-05 (chat 1, on Fable’s relays)
History of ITEM 195: [2026-09](ledger/2026-09.md) <!-- c13-3 -->

**THE TRIP (Fable’s relay, recorded as relayed).** Cursor’s PR #7 was merged by Nick to `main` as `4d3c84e`
(hidden marks with editing rules, strip/drawer/settings tweaks, 56 parks); Fable reviewed it as FIX and cleared it.
**Nick’s word, verbatim: “I am very happy with these revisions and one to ship them now”.** Cursor’s `d8fee5b` /
`b6f6c80` (mode tabs clustered right) landed on `main` **unreviewed** (both verified ancestors of `main` this
session). **No deploy happened from the trip:** production is still Batch Eight (Nick’s Railway attempts left Root
Directory restored empty; Batch Eight rebuilt and Active — per the relay, not re-observed by this desk yet).

**NICK’S WORD ON ITEM 195 (Fable’s relay).** The question as put: “On narrow board screens the grip has to give way
somewhere. Should it (A) overlap the page edge slightly, or (B) overlap the strip slightly? Default: B. The page
stays untouched, by your ‘the page is primary’ rule.” **His answer, verbatim: “Item 195: Yes, B”.**

**RULING: when both cannot hold, the sliver grip never overlaps the paper; it may overlap the strip. The
page-primacy law wins over strip clearance.** 195 rides a later batch, after TOOLS rebuilds it.

**ORDERS, in sequence (Fable):** (1) a chunked pair (≤20 files per chunk, both legs) on `main` @ `4d3c84e` — Cursor’s
VM failed `cd2`, `m1`, `s1`, `th1`, `th2`, `w1`, `w2` and the K10 CI script, so any reds are read per file for the
owners; clean → deploy on Nick’s word above, rollback = the current Batch Eight deploy. (2) Batch Nine re-planned onto
`main` AFTER that ships: `escexit` (FIX resolves its `spellCheck` conflict with 217) + INK’s single integrated branch
(`server-hardening` `b9d3db2`, `sync-integrity`, `a11y-signin`, `a11y-tutor-live-region`), then its pair; **Fable byte-reviews
the auth and sync hunks at assembly.** (3) TOOLS’ storage step 2 durability experiment (`f0ca6e0`) as a short use.
(4) WITH NICK, ~20 minutes: one restore drill (fresh `restore-drill` service from the latest R2 backup, row counts
compared, then deleted); delete Postgres-Bduk; confirm writer-studio-app’s `DATABASE_URL` references the private Postgres
variable (NAME only), then remove Postgres’s public TCP proxy.

## THE SET-PASSWORD SCRIPT (BRANCH, FOR FABLE’S REVIEW) AND ITEM 230 — 2026-10-06 (chat 1, on Fable’s relay)

**THE NEED (Fable, relay):** Nick does not know his password and there is no reset flow. **Asked:** an owner-run script
`apps/server/scripts/set-password.mjs`, run by Nick himself via `railway run`; hidden prompts, password entered twice,
`MIN_PASSWORD_LENGTH` (8), bcrypt at auth.ts’s cost; update `users` for that email (`and not is_guest`); print only
“updated” or “no such account”; never echo the email, the password or `DATABASE_URL`; delete that user’s `session` rows;
its own branch, Fable’s review first; then ONE paste-ready line for Nick; the same pattern for the smoke account if
Nick says yes.

**BUILT: branch `set-password-script` @ `a1f4526` (pushed as a branch; NOT on `main`, NOT deployed, no production
database touched).** Two files: `apps/server/scripts/set-password.mjs` (145 lines) and a DB proof
`apps/server/scripts/harness/set-password-db.mjs`. **Choices to review:** (1) the email is read visibly (so a typo is
catchable) and never printed back; the password is hidden, asked twice, and refused under 8 characters; both are read from
the keyboard only — never argv, never env, never a file or log; (2) `BCRYPT_COST = 12` and `MIN_PASSWORD_LENGTH = 8`
mirror `auth.ts` (and the proof asserts they still do); (3) **`and not is_guest` is applied only if the column exists —
`is_guest` is NOT in `main`’s schema (guest login has not shipped), so the literal query would have errored today**; (4) the
password update and the session delete (`delete from session where sess->>’userId’ = $1`, connect-pg-simple’s table; skipped
if the table is absent) are ONE transaction; (5) errors print a short code only, never a driver message (it can carry a
host name); (6) **`railway run --service Postgres` is required** — `writer-studio-app`’s `DATABASE_URL` is a private
`.railway.internal` host that a laptop cannot reach, while the Postgres service exposes `DATABASE_PUBLIC_URL` (presence and
host KIND checked only, no value printed; `railway run --service Postgres` was confirmed to inject it). The script prefers
`DATABASE_PUBLIC_URL`, falls back to `DATABASE_URL`. **That public proxy is the one the after-trip task removes — once it
is removed this route needs a different path (a one-off job inside the project); say so before removing it.**

**PROOF (browserless, a REAL throwaway Postgres via `embedded-postgres`, no dependency added to this repo): 12/12:** known
email → “updated”; the new password verifies and the old does not; that user’s sessions are gone while another user’s and
an anonymous one remain; the other account untouched; unknown email → “no such account” with nothing deleted; a guest is
never changed once `is_guest` exists; a database with no `session` table still updates; a failing session delete rolls the
password back (one transaction); the helpers and the mirrored constants. **NOT proven by this desk:** the interactive
hidden-typing prompt (it needs a terminal; this desk has none), so Nick’s first run is its first terminal run — every
failure path prints “Nothing was changed”; and if `railway run` does not hand the script a terminal it refuses with a clear
message rather than reading a visible password. **No mutation test was run on the script.**

**ITEM 230 (registered; backlog, LATER): “Forgot password?” by email** — needs an email service (none exists). Registry
next free: **231**.

**WAITING ON:** Fable’s review of `a1f4526`; then this desk merges it to `main` (it is a file in the repo, not shipped
behaviour, but `railway up` would carry it, so it rides the next deploy under the ship gate) and gives Nick ONE line
and plain steps. The smoke-account use of the same script waits on Nick’s yes.

## CORRECTION: INK’S guest-client-walk GRANT WAS USED (14/14); AN OPEN QUESTION ON 3 BROWSER PROCESSES; FIX’S WINDOW GRANTED — 2026-10-08 (chat 1)

**The entry above (“CLEARED, NEVER USED”) was WRONG — this desk’s second miss of the same kind.** Fable (relay): **INK’s grant was USED:
the walk ended `02:49:09Z`, 14/14 passing, and INK tore the rig down right after — which is why the ports were empty at `03:19Z`.**
The grant was written `02:48:06Z`, so the walk ran inside ~63 seconds of it. This desk’s check looked for LIVE processes,
listeners and recent pushes; a finished run leaves none of those, and INK had not pushed its evidence yet. **Pending: INK’s
walk START time, to put beside the grant’s write time.** *(Rule, sharpened: an absence of processes is not evidence of non-use;
before logging “unused” ask the grantee or look at its own evidence output.)* The grant was open ~31 minutes after a ~1-minute
use; the 30-minute rule did its job on a box that was in fact idle, but the record it produced said the wrong thing.

**OPEN QUESTION (Fable): 3 `ws-runtime-verify` processes were seen around INK’s launch (~`02:47Z`). Whose?** If no lane claims them
they are recorded as **“unclaimed”**. *(This desk observed none: its 02:48 grant write found 0 browsers, and its earlier 02:30Z
sighting was a single `b101.mjs` node process. ~02:47Z is before the grant write, so they are not this desk’s and not inside
the grant; answer expected from INK.)*

**NEXT GRANT (Fable): FIX’s ONE WINDOW — rhizome legs + shots, templates light reshoot. Its commits are verified by this desk on
origin: `97f95c3` (on `cursor/plateau-rhizome-goal-4b92`: “Rhizome: the first goal crossing after a page opens flashes; park m2’s
burst check…”) and `194174c` (on `page-templates-move`: “Page templates frames: set the THEME, not only the page tone — light =
Flux’s lig…”).** GRANTED `2026-10-09T03:46:21Z` (9:46 pm MT), grant file read first (absent), box idle (0 harness processes, 0
browsers); 30-minute check-in due 10:16 pm MT — this desk will look at FIX’s branches AND for finished-run evidence before clearing.
**PAIRS AFTER THAT: templates → rhizome → B11 (after INK’s evidence push) → drafts (`56d1e3c`).**

## (151) A DATA CHANGE, NOT CODE: ALL THEMES OPEN ON NICK’S OWN ACCOUNT FOR TESTING — the local tool is built and self-tested; Nick runs it — 2026-10-24 (chat 1)

**Order (Fable, Oct 24, URGENT): Nick needs every theme open on his account for testing. DATA change only: no code, no deploy, no box. The server’s `GET /theme-unlock` already ORs `users.themes_opened` (a jsonb map) into `open` (checked in `sync.ts`: `open[id] = wordsWritten >= threshold || !!themesOpened[id]`). The tool must live outside the repo (public), take the database address from Nick’s own terminal and never print it, find the user by an email Nick types, MERGE `{plateau, machina, flux, nomad, volant: true}` into `themes_opened` (never remove anything), have a dry run that runs first, and print only `themes_opened` before/after and `words_written`; a low `words_written` against his real writing (Machina’s threshold is 100) is flagged as a possible counter bug.**
**BUILT, outside the repo (this desk’s local ops folder, never committed; nothing in it holds an address, an email or a credential):** a node script plus a PowerShell wrapper in the same shape as the incident-review kit (hidden prompt for the address, a visible prompt for the email, `-DryRun` switch, every variable cleared in a `finally`). The script opens ONE transaction; verifies the `users` table has `id`, `email`, `themes_opened` and `words_written` (otherwise it stops: wrong database or older schema); prints how many users the database has (production had 14 on Oct 22; a very different count means the wrong database) — a count, no identifier; matches the email case-insensitively and stops on zero or more than one match; prints the matched row’s `words_written` and `themes_opened` BEFORE; a DRY RUN prints what the real run would write and ROLLS BACK; the real run is `themes_opened = coalesce(themes_opened, ‘{}’) || {the five keys: true}` (jsonb `||` sets those keys and nothing else), then checks that exactly one row was touched, that every key that was there is still there, that no key outside the five changed and that `words_written` is unchanged — any failure ROLLS BACK — and only then commits. It prints the email, the name and the id NOWHERE.
**SELF-TEST (throwaway embedded Postgres; no credential, nothing remote): 13 checks PASS** — dry run changes nothing (the whole table byte-identical) and prints before and would-be-after; the real run merges the five keys and keeps a custom key, `words_written` and the name untouched; an existing `flux: false` becomes true and nothing else moves; no other row changes; a NULL `themes_opened` becomes the five keys; a second run is harmless; two matching users stop with code 5, an unknown email with 4, a database without the column with 3, no email with 2; the output never contains the email, name or an id; the low-words flag fires (12 < 100) and is absent for an account with 4,000 words. My first self-test run had one red, my own test expecting the keys in the order I wrote them; Postgres returns jsonb keys in its own order, so the check now compares them as sets (the tool was right).
**NOT RUN against production: it needs Nick’s hands (the address and his email are his to type).** Nick’s sequence: the dry run first, then the real run; the result (the THEME lines, which carry no secret) and `words_written` come back to Fable. If `words_written` is far below what Nick has really written, that is a candidate COUNTER BUG for a ticket (the client-reported delta in `sync.ts` is the only writer of the counter).

## (168) BUG-LIST #33 — FIX's caret-reset finding — 2026-10-31 (chat 1)
**"The editor moves the caret back to the end of the text ~0.2 s after a keystroke, so Ctrl+Home or a click right after typing is undone." Owner FIX (FIX adds the repro).** Numbered at Fable's order (Oct 31, train-12g clear; one-liner supplied by Fable). Not part of #12g: no product change is claimed for it.

## (170) #13 STEP 1, SECOND HALF — NINE FULLY-MERGED LEFTOVER BRANCHES DELETED; PRs #2/#4 NAMED; CONTRACTS COMMIT AND c13-2-map HELD — 2026-10-31 (chat 1)
**Order (Fable, Oct 31):** step 1 cleared (169); also delete the leftovers fully in main: `tools-12c-r2`, `tools-12d-fit-icon`, `tools-12e-width-gate`, `account-tools-r3`, `-r4`, `tools-11-intake-r2`, `tools-11-mark-files`, `smoke-account-tools`, `typewriter-fade-order`; KEEP every `ci/actions-harness*`.
**Done:** each branch re-checked against `origin/main` immediately before the delete (all nine: ahead 0, `git cherry` plus-count 0, so no archive tag needed); 9 of 9 deleted, 0 failed. Tips in `docs/evidence/c13-step1-branch-cleanup/deleted-leftovers.tsv`. Remote heads now **476**. The five `ci/actions-harness*` (`ci/actions-harness`, `-r`, `-r2`, `-r3`, `-r4`) kept.
**Open PRs (untouched):** #2 `cursor/machina-theme-644d` "Skin Machina onto the current desk" (Cursor, Sep 29, stale); #4 `cursor/wrizo-build-rules-644d` "Record Cursor build rules for Wrizo" (Cursor, Sep 30, stale).
**Held:** (1) `docs/contracts/` commit: the newest `Downloads\identity-draft0.md` on disk (saved 23:17 local) is labelled **rev b**, not rev c, and `Downloads\export-v1-draft0.md` is still byte-identical to rev a (committed in `dadb7196`); nothing committed until the real rev c / export rev b are saved. (2) `c13-2-map` (`origin/c13-2-map` `06f0b5d4`): merge waits on POLISH adding the recede wording; `docs/MAP.md` line 12 only says "the recede rule" today. (3) train-12h: waits on FIX's caret-reset tip with the extra checks (full pair + box list + caret-reset x2, typewriter-fade, typewriter-glide-keys, blank-page-click, empty-line-caret, fx5 x3).

## (172) #13 STEP 4 (c13-4-docs-fold) MERGED; identity rev e COMMITTED — 2026-11-01 (chat 1)
**Contracts:** `4c1ada81` — `docs/contracts/identity-draft0.md` = `Downloads\identity-draft0-reve.md` (md5 `edb61893...`; rev e adds 5b, the "at the desk" presence signal), verbatim.
**Step 4 (Fable, Nov 1: cleared):** POLISH `c13-4-docs-fold` @ `2bae8561` merged `--no-ff` onto main `4c1ada81` as `52185d97`. 57 files, docs only except one script: 47 moves into folders (e.g. `docs/th2-review-fable.md` -> `docs/reviews/`) with link rewrites, plus `apps/desktop/scripts/c13/c13-4-fold.mjs`. No product, server or package change. Proof on the merged tree: `c13-4-fold.mjs check --ref HEAD^1` **PASS** (47 moves; 104 links already broken at the ref, not new); `c13-2-links.mjs` **PASS** (9 pages, 212 paths, 0 missing). Note: the fold check run bare against the merged HEAD fails by design (it reads the pre-fold paths from `--ref`).
**Pending:** `Downloads\read-home.md` (Wrizors) -> `docs/read/read-home.md` verbatim, md5 to report; not on disk yet.

## (173) TRAIN #12h (FIX caret-reset-r2 8cf12706, ALONE) CLEARED ON train-12h, MERGED @ 51d45fc6 (records tip 3a738225) AND DEPLOYED — DEPLOY #12h (48f1335f) LIVE AND VERIFIED — BUG-LIST #33 FIXED — 2026-11-01 (chat 1)
**Order (Fable, Nov 1):** train-12h = FIX `caret-reset-r2` `8cf12706` on main `defbca64`; proof = Actions full pair + the box list + `caret-reset` x2, `typewriter-fade`, `typewriter-glide-keys`, `blank-page-click`, `empty-line-caret`, `fx5` x3; green -> ship. Ship word after the control report: "train-12h: SHIP 51d45fc6. The fx5 red (1/24 vs 21/21 on the control) isn't attributable to the caret change; the jump class lives in 12g's engine, already live, and FIX gets the 2-line step cap now as train-12i."
**What shipped (`docs/evidence/train12h-51d45fc6/MANIFEST.md`):** one clean merge. A caret the writer moved is no longer put back at the end of the text by the next render (the writer-moved note is cleared in `handleInput`, every text path). Product code, ONE file: `apps/desktop/src/components/ForwardOnlyEditor.tsx` (+25). Harness: new `caret-reset.mjs` (27 checks). No server, migration or package change.
**Proof:** `tsc` x2 0, `seed-guard` 36. Actions run **41293780212**: default 228/235 (the 7 non-OK the capture tools), parked 227/235 (the 7 + `b2-1`, which passed on rerun at the train tip and on main, and 5/5 parked on the box). Box (18 files), stamp `tree=51d45fc6 bundle=index-hzRgs52S.js/958221b`: parked CLEAN 18/18; default 17/18, the one red `typewriter-glide-keys` 6/8 (K1 premise: the glide had already ended), 5/5 PASS on the train tree and 5/5 on the `train-12g` control afterwards. `caret-reset` PASS 27/27 on every run (default + parked, x3), `blank-page-click`, `empty-line-caret`, `typewriter-fade`, `cd2` PASS. `fx5` x3 per leg: default 3/3, parked 2/3 with ONE red (round 1, S1(a) first-engage, `maxStep` 444); 15 attribution runs on the train tree after it all PASS 57; the control `train-12g` (main's product code) 21/21. Not attributed to the caret change (Fable); FIX owns the step cap as train-12i.
**Deploy:** pushed main `3a738225` (records tip over `51d45fc6`; `git diff 51d45fc6 3a738225 -- apps` empty), one `railway up --service writer-studio-app --ci` from the primary checkout on a clean tree, no retries. **STAMP: `git 51d45fc6` (records `3a738225`) · `railway 48f1335f`.** Live (`docs/evidence/deploy-12h-48f1335f/`): `/healthz` 200 `index-hzRgs52S`; `/auth/me` 401; `/auth/signup-status` `{"open":false}`; the served bundle `index-hzRgs52S.js` 958221 bytes, md5 `6e9231b1...` IDENTICAL to the tested train-12h build; `smoke-login.mjs` **PASS 6/6**.
**Rollback target (ratcheted):** `git 2b06e484 · railway 54492996` (deploy #12g). **Box:** 09:35Z-11:19Z (train-12h list, controls, attribution batches); released, grant file gone.
**#13 merges the same turn (all cleared by Fable):** step 3 `c13-3-ledger-r2` `f15c9af4` -> `285b5928` (this file now keeps 71 open sections; 714 closed ones are verbatim in `docs/ledger/2026-07..11.md`; `c13-3-ledger.mjs check --ref 7cbf8b28` PASS, the three planted mutants FAIL; the 33 cuts and why: `docs/ledger/open-list-cuts.md`); step 4b `c13-4b-law3-parks` `8df3c60b` -> `3214fce8` (law 3's cross-theme checks parked verbatim, harness files only); step 4c `c13-4c-evidence` `04ad76fb` -> `857d05ec` (`docs/evidence/` leaves the current files, 2833 files, recoverable from history; the manifest `docs/cleanup/c13-4c-evidence-removed.tsv`). Product tree unchanged by all three (`git diff 3a738225 HEAD -- apps/desktop/src apps/server` empty). Checks on the merged main: `c13-3-ledger check` PASS, `c13-2-links` PASS (212 paths), `seed-guard` 36. NOTE: `c13-4c-evidence.mjs verify` run on the merged tree FAILS (94) by design of the combination: it compares against its own base `defbca64`, so step 3's and 4b's changes read as "outside the step", and the two new evidence dirs below are tracked. Two evidence dirs made after the cut stay in `docs/evidence/` (`train12h-51d45fc6`, `deploy-12h-48f1335f`); Fable to say whether per-deploy evidence keeps being committed there.
**Open:** `Downloads\read-home.md` -> `docs/read/read-home.md` (not on disk); train-12i (FIX, the fx5 first-engage jump); bug-list #33 (168) is fixed by this deploy.

## (174) TRAIN #12i (FIX typewriter-stall-cap-r1 619f666b, ALONE) CLEARED ON train-12i, MERGED @ 38105480 AND DEPLOYED — DEPLOY #12i (832823d7) LIVE AND VERIFIED; FOUR #13 BRANCHES MERGED; EVIDENCE RULE CHANGED — 2026-11-01 (chat 1)
**Order (Fable, Nov 1):** train-12i = FIX `typewriter-stall-cap-r1` `619f666b` on main `2f01ea27`; proof = the full pair + the box list + `typewriter-stall`, `typewriter-glide-keys`, `fx5` x3, `typewriter-fade`, `typewriter-page`, `caret-reset`; green -> ship. Then merge (all cleared) `c13-4b-fx1-addendum` `13bff96a`, `c13-4c-evidence-ignore` `aa58bbe7`, `c13-4d-links-r` `4e9fc471`, `c13-5-style-probe` `3079ce86`. Evidence: from now on only the text logs, under `docs/evidence/box-logs/`; `harness.yml` also goes on `ci/actions-harness`.
**What shipped (`docs/evidence/box-logs/train12i-38105480/MANIFEST.txt`):** the typewriter's catch-up step is capped at 2 lines (`MAX_STEP_LINES` in `useTypewriterFade.ts`, +6/-2): a backlog past the 1 s cap is paid in more steps, never a bigger one (the fx5 S1(a) first-engage jump, 444 px, 1 run in 24 at 12h). New `typewriter-stall.mjs` (4 checks); `typewriter-glide-keys.mjs` types two sentences. One clean merge, no server/migration/package change.
**Proof:** `tsc` x2 0, `seed-guard` 36. Actions run **41343696470**: default 229/236, parked 229/236, the 7 non-OK the capture/probe tools on both legs (no regressions). Box (18 files), stamp `tree=38105480 bundle=index-CE6uLLXE.js/958242b`: default CLEAN 18/18, parked CLEAN 18/18; `typewriter-stall` + `typewriter-glide-keys` two extra rounds per leg all PASS; `fx5` x3 per leg 6/6 PASS (57). Box turn 19:50Z-20:19Z, released.
**Deploy:** main pushed `97775d2b` (records tip over `38105480`; `git diff 38105480 97775d2b -- apps` empty), one `railway up --service writer-studio-app --ci` from the primary checkout on a clean tree, no retries. **STAMP: `git 38105480` (records `97775d2b`) · `railway 832823d7`.** Live (`docs/evidence/box-logs/deploy-12i-832823d7/`): `/healthz` 200 `index-CE6uLLXE`; `/auth/me` 401; `/auth/signup-status` `{"open":false}`; the served bundle 958242 bytes, md5 `24521cb3...` IDENTICAL to the tested train-12i build; `smoke-login.mjs` **PASS 6/6**.
**Rollback target (ratcheted):** `git 51d45fc6 · railway 48f1335f` (deploy #12h).
**#13 merges the same turn:** `c13-4b-fx1-addendum` `13bff96a` -> `8bf1a5f6`; `c13-4c-evidence-ignore` `aa58bbe7` -> `80dd6751`; `c13-4d-links-r` `4e9fc471` -> `452a9c85`; `c13-5-style-probe` `3079ce86` -> `02720d7f`. Product tree unchanged by all four. Checks on the merged main: `c13-4c-evidence.mjs ignore` PASS, `c13-4d-links.mjs check` PASS, `c13-2-links` PASS, `seed-guard` 36. NOTE: `c13-4c-evidence-ignore` has a later commit `4fc41529` (`verify` takes `--ref`, tool only) that was NOT in the cleared sha and was not merged; held for Fable's word.
**Evidence rule (Fable):** only text logs are committed, under `docs/evidence/box-logs/` (the rest of `docs/evidence/` is gitignored). Train-12h's logs moved there (`train12h-51d45fc6`, `deploy-12h-48f1335f`; its two `.md` files renamed `.txt`, no images were tracked). `harness.yml` with the box-logs path rule is on `ci/actions-harness` (`b21e923d`).
**Open:** `Downloads\read-home.md` -> `docs/read/read-home.md` (not on disk); `4fc41529` awaiting Fable's word; POLISH starts step 6.

## (175) #13: c13-4c-evidence-ignore 4fc41529 MERGED; read-home.md AND export-v1 rev c COMMITTED; SECOND-SPLASH CENSUS (from source) — 2026-11-01 (chat 1)
**Merged (Fable cleared, Nov 1):** `c13-4c-evidence-ignore` `4fc41529` (`verify --ref`, tool only) -> `dd1f4d2d`. Docs-only commits, verbatim, md5 checked blob vs file: `docs/read/read-home.md` (md5 `2af904ba2ea4adfff2d260d0f920bf7f`, `734017e5`) and `docs/contracts/export-v1-draft0.md` rev c (md5 `ace02125ff915a73f726eb7b89d0ea3e`, adds section 8b, the publish call; `c29ae19d`). Main `c29ae19d`, pushed; product tree unchanged (`git diff 38105480 HEAD -- apps/desktop/src apps/server` empty). `c13-2-links` PASS, `c13-4d-links check` PASS. Not deployed (no product change; production stays `git 38105480 · railway 832823d7`).
**Second-splash census (read from source on main `c29ae19d`; no browser run):** `Arrival` is mounted at `/` in `App.tsx` for EVERY theme and nothing in `Arrival.tsx`, `App.tsx`, `Splash.tsx` or `index.css` branches on the theme to skip it, so all three registered themes (Arbor/`plateau`, `flux`, `machina`) still show the separate doors screen (Write / Open / Sign in) after the opening splash. Only the mark differs (`WrizoMark.tsx`: Flux draws its own wordmark, the others the Arbor PNG), and the doors are held invisible (`data-splash-hold`) while the splash runs. Measured live today for only two of the three: `splash.mjs` covers `plateau` and `flux`; `machina` has no live check of the doors. A box-run probe over all three is available on request.

## (176) RULING (Fable, Nov 1): ARRIVAL RETIRES IN EACH THEME'S REDESIGN SHIP — 2026-11-01 (chat 1)
Arrival (the separate Write / Open / Sign in screen) retires in each theme's redesign ship: Arbor, Machina, Flux S5. Sign-in AND sign-up (with the invite code) stay reachable from each splash's Sign in door, with a check per theme; `splash.mjs` gains Machina then. No live probe wanted for the census (175). Next for chat 1: step 6's full pair when POLISH asks.

## (177) #13 STEP 6 (c13-6-css-split 2d021e8b) CLEARED AND MERGED @ d2b7f699; c13-5-probe-origin 06401428 MERGED @ 92918c93 — 2026-11-01 (chat 1)
**Order (Fable, Nov 1):** merge `c13-5-probe-origin` `06401428` (cleared); step 6's full pair on `c13-6-css-split` `2d021e8b` and the style probe main-vs-step (must be IDENTICAL); `rhizome-latency` does not count for step 6 (bundle byte-identical, main flaps the same way, ticket 150); clean -> merge step 6.
**Result (`docs/evidence/box-logs/c13-6-9816d75c/MANIFEST.txt`):** train `9816d75c` = main `92918c93` + the step. `tsc` x2 0, `seed-guard` 36. The step's whole `dist-web` is BYTE-IDENTICAL to main's (JS `index-CE6uLLXE.js` 958242 bytes, CSS `index-9tSY3ofi.css` 267073 bytes). Actions run **41362278324**: 229/236 on both legs (the 7 capture tools). Box (15 files) stamp `tree=9816d75c bundle=index-CE6uLLXE.js/958242b`: default CLEAN 15/15; parked 14/15, the one red `rhizome-latency` B and C (2/14), not counted per the ruling. **Style probe main vs step: `C13-STYLE COMPARE: IDENTICAL`** (2198 selectors, 589 matched, the same on both). Box turn 23:29Z-23:53Z, released.
**Merged:** `c13-5-probe-origin` -> `92918c93`; step 6 -> `d2b7f699`. Not deployed (a byte-identical bundle; production stays `git 38105480 · railway 832823d7`).

## (178) TRAIN #12j (POLISH c13-12f-sprout-invite-r 8e45c060, ALONE) CLEARED ON train-12j, MERGED @ 622df16e AND DEPLOYED — DEPLOY #12j (4fe238f5) LIVE AND VERIFIED; c13-6-map-link e8341b5f MERGED — 2026-11-02 (chat 1)
**Order (Fable, Nov 2):** merge `c13-6-map-link` `e8341b5f` (cleared); 12f = `c13-12f-sprout-invite-r` `8e45c060` (on `34151ccd`): the full pair (PageEditor changed); clean -> merge and ship as #12j with the usual live checks.
**Merged:** `c13-6-map-link` -> `b3442837` (`c13-2-links` PASS, 218 paths). 12f -> `622df16e` (main fast-forwarded to the tested train tip).
**What shipped (`docs/evidence/box-logs/train12j-622df16e/MANIFEST.txt`):** the Sprout code goes (`useFirstLineInvite.tsx` deleted; PageEditor, JournalEntry, BeginningsRow, deskLexicon and two CSS files trimmed); the sprout-invite harness rewritten. Bundle `index-CzG0YU_r.js` 955927 bytes (was `index-CE6uLLXE.js`). No server, migration or package change.
**Proof:** `tsc` x2 0, `seed-guard` 36. Actions run **41409246019**: default 230/237, parked 230/237, the 7 non-OK the capture/probe tools; 12f's own checks, fx16, item109, page-size and page-templates PASS on both legs. Box (20 files), stamp `tree=622df16e bundle=index-CzG0YU_r.js/955927b`: default CLEAN 20/20; parked 19/20, the one red `rhizome-latency` check B (flash median 25.7 vs rest 20.6 ms, budget 5 ms; 1/14), the ticket-150 flapper. Controls (same file, train vs main's build `c13-main`, same product code as main): alone, parked x6 each, 12/12 PASS; the whole parked list x2 each, 4/4 CLEAN. In-list parked: train 1 red of 3, main's bundle 1 red of 3 (step 6). Not attributed to 12f. Box turns 07:54Z-09:04Z, released.
**Deploy:** main pushed `e99ace5c` (records tip over `622df16e`; `git diff 622df16e e99ace5c -- apps` empty), one `railway up --service writer-studio-app --ci` from the primary checkout on a clean tree, no retries. **STAMP: `git 622df16e` (records `e99ace5c`) · `railway 4fe238f5`.** Live (`docs/evidence/box-logs/deploy-12j-4fe238f5/`): `/healthz` 200 `index-CzG0YU_r`; `/auth/me` 401; `/auth/signup-status` `{"open":false}`; the served bundle 955927 bytes, md5 `e950e802...` IDENTICAL to the tested train-12j build; `smoke-login.mjs` **PASS 6/6**.
**Rollback target (ratcheted):** `git 38105480 · railway 832823d7` (deploy #12i).

## (179) #13 STEP 7 (c13-7-css-comments-r b32c673e) AND TICKET 150 (rhizome-latency-stable-r1 01c3ae52) CLEARED TOGETHER AND MERGED; EXPORT-V1 REV D COMMITTED — 2026-11-02 (chat 1)
**Order (Fable, Nov 2):** ONE full pair on both; clean -> merge both, no deploy; then export-v1 rev d as a docs-only commit.
**Result (`docs/evidence/box-logs/c13-7-and-t150-53c517bf/MANIFEST.txt`):** train `53c517bf` = main `047345a1` + both merges. `tsc` x2 0, `seed-guard` 36. The tree's whole `dist-web` is BYTE-IDENTICAL to the live #12j build. Actions run **41546718460**: 231/238 on both legs (the 7 capture tools). Box (21 files, with the new `rhizome-latency-mutant`), stamp `tree=53c517bf bundle=index-CzG0YU_r.js/955927b`: default CLEAN 21/21, parked CLEAN 21/21; `rhizome-latency` PASS 15 checks (the new guard) and the mutant PASS 6 on both legs. Box turn 23:37Z-00:08Z, released.
**Merged:** step 7 -> `0f5edc0d`; ticket 150 -> `53c517bf`. `docs/contracts/export-v1-draft0.md` rev d verbatim, md5 `71516d8c0abafaae68bb2a9f44ff6de7` (blob checked). Checks on the result: `c13-2-links` PASS, `c13-4d-links check` PASS, `seed-guard` 36. Not deployed; production stays `git 622df16e · railway 4fe238f5`.

## (180) TRAIN #12k (TOOLS tools-14-size-box 8d1fe490) HELD — item126 RED, ATTRIBUTED TO THE CHANGE; run-suite RED-RULE CONFIRMED — 2026-11-03 (chat 1)
**Order (Fable, Nov 2):** train-12k = `tools-14-size-box` `8d1fe490` on `5119bdf0`: full pair + box list + `size-box` / `item207` / `item207-core`; run `flux-screens` WITH an output dir on main and the train; green -> ship #12k. Also confirm run-suite counts a crash / no-verdict file as RED.
**run-suite (confirmed from source, `run-suite.mjs` ~375-414):** a file with no verdict line is `NOVERDICT`, a timeout `TIMEOUT`, a slept machine `SLEPT`, any non-zero exit or failed check `FAIL`; every status but `OK` is in `bad`, so the suite reads `NOT CLEAN` and exits 1. `flux-screens` printed no verdict in a run-suite sweep because it REQUIRES an output dir argument (exit 2 without one); run directly with one it prints `FLUX-SCREENS: PASS (12 surfaces shown)` on main and on the train.
**Result (`docs/evidence/box-logs/train12k-e976d8a1-HELD/MANIFEST.txt`):** train `e976d8a1`, bundle `index-DOEyWNrv.js` 956110 bytes, `tsc` x2 0, `seed-guard` 36. Box (24 files) default CLEAN, parked CLEAN; Actions run **41587471573** 231/239 per leg (the 7 capture tools) PLUS **`item126.mjs` FAIL on both legs** (1/42: "a double-click on BARE TEXT still SELECTS A WORD", selected a space). Control: item126 alone passes on main `5119bdf0` (Actions run 41589714606; box 2/2 on the main-equivalent) and fails on the train (Actions run 41589752859; box 2/2). Reading: the check double-clicks at a fixed offset (left+30, top+8); a page now BORN at 11 pt puts a space there. **Not shipped; no merge; production stays `git 622df16e · railway 4fe238f5`.** Awaiting Fable: TOOLS parks the check and adds a successor that finds a word by position, or the ticket is revised. Box released.

## (181) TRAIN #12k R2 (TOOLS tools-14-size-box-r2 e4289ad9) HELD — hooks-order-ast RED (a hook below an early return in PageEditor) — 2026-11-04 (chat 1)
**Order (Fable, Nov 3/4):** train-12k = `tools-14-size-box-r2` `e4289ad9` on `fd1f9f1b`; the same proof list + `size-words` and `item126`; green -> ship #12k.
**Result (`docs/evidence/box-logs/train12k-r2-6b941a90-HELD/MANIFEST.txt`):** train `6b941a90`, bundle `index-C0nBce9r.js` 956916 bytes, `tsc` x2 0, `seed-guard` 36. `item126` (the successor) PASS, `size-box` / `size-words` / `item207` / `item207-core` PASS, box (26 files) CLEAN both legs, `flux-screens` PASS (12 surfaces) on main and the train. **RED: `hooks-order-ast.mjs` FAIL 1/7 (Actions run 41846184435, default leg): `PageEditor.tsx` `PageEditorView` calls `useRef` (r2's new `heldSelRef`) at line 1052 below the early return at line 827** — a rules-of-hooks violation introduced by r2 (the first 12k pair passed this check). Also unattributed: `guided-add-scenes-part2` FAIL 1/74 on the PARKED leg only (Flux dark Storyboard door), PASS on default. **Not shipped; no merge; production stays `git 622df16e · railway 4fe238f5`.** Awaiting TOOLS' fix (hoist the ref above the early return) as r3. `read-home.md` (newest Downloads md5 `67ac583f...`) queued for the docs commit after #12k.

## (182) #13 STEP 8 (c13-8-css-themes 38755d93) MERGED; READ-HOME DRAFT 3b COMMITTED — 2026-11-04 (chat 1)
**Merged (Fable cleared, Nov 4):** `c13-8-css-themes` `38755d93` -> train-c13-8 `e99e20f9` (tree `3bf79d8d`), main fast-forwarded to it; theme rules move into `src/styles/themes/{flux,machina,arbor}.css`. **Proof** (`docs/evidence/box-logs/c13-8-3bf79d8d/`): tsc x2 0, seed-guard 36; Actions run 41886039489 default 231/238, parked 231/238, the usual seven capture/probe tools the only non-OK; box 15 files default CLEAN, parked CLEAN; style probe vs main's build `C13-STYLE COMPARE: IDENTICAL` (2188 selectors, 589 matched). **Bundle NOT byte-identical to main's:** JS same except the CSS name it references, CSS 266044 bytes (main 266008). **Not deployed** (awaiting Fable on whether a CSS-only reorder ships; production stays `git 622df16e · railway 4fe238f5`). Docs-only: `docs/read/read-home.md` draft 3b (md5 `ed07d6a0e18b5ed930e3c067ca4d129f`, `f079d49e`), not 3a. `#12k` still HELD for TOOLS' r3 (hooks-order-ast).

## (183) TRAIN #12k r3 (TOOLS tools-14-size-box-r3 982127fb) CLEARED ON train-12k-r3, MERGED @ 3da9e780 — SHIPPING AS #12k — 2026-11-04 (chat 1)
**Order (Fable, Nov 4):** train-12k = `tools-14-size-box-r3` `982127fb` (CLEARED), the same proof list; green -> ship #12k, which now also carries step 8's CSS (36 bytes) and read-home 3b. **Proof** (`docs/evidence/box-logs/train12k-r3-d45f5679/`): tsc x2 0, seed-guard 36, hooks-order-ast PASS 7 (the r2 red is fixed); Actions run 41899933336 default 233/240, parked 233/240, the usual seven capture/probe tools the only non-OK; box 26 files default CLEAN, parked CLEAN; flux-screens PASS (12 surfaces) on main's build and on the train. Bundle `index-C_y5ece8.js` 956918 bytes md5 `abc97e3b78ffbdfd73bdb0c1e1598f31`. The deploy result follows in the next entry.

## (184) DEPLOY #12k (719bd9d8) LIVE AND VERIFIED — 2026-11-04 (chat 1)
**STAMP: `git 3da9e780` (records `bee02e3f`+) · `railway 719bd9d8`.** One `railway up --service writer-studio-app --ci` from the primary checkout on a clean tree on main, no retries. Carries TOOLS `tools-14-size-box-r3` `982127fb` plus step 8's CSS and read-home 3b. Live (`docs/evidence/box-logs/deploy-12k-719bd9d8/`): `/healthz` 200 `index-C_y5ece8`; `/auth/me` 401; `/auth/signup-status` `{"open":false}`; the served JS 956918 bytes md5 `abc97e3b...` and CSS 266044 bytes md5 `17814d7d...` both IDENTICAL to the tested train-12k-r3 build; `smoke-login.mjs` **PASS 6/6**. **Rollback target (ratcheted):** `git 622df16e · railway 4fe238f5` (deploy #12j). Closes #12k (held at r1 on item126, r2 on hooks-order-ast).

## (185) FIX rhizome-latency-fine-r1 (150b) ccd3d366 MERGED — 2026-11-04 (chat 1)
**Merged (Fable cleared, Nov 4):** `rhizome-latency-fine-r1` `ccd3d366` via train-150b `bfbc6357` (harness only: `rhizome-latency.mjs`, `rhizome-latency-mutant.mjs`); main fast-forwarded to it. Box list (26 files) default CLEAN 26/26, parked CLEAN 26/26, both rhizome files PASS on both legs (`docs/evidence/box-logs/t150b-bfbc6357/`). Bundle identical to production's; **not deployed**. Production stays `git 3da9e780 · railway 719bd9d8`. **Open:** ARBOR `harness/url-search-optin` `338f1d79` (touches `runtime-verify.mjs`) — Fable accepted the opt-in explanation; merge after ARBOR's browserless check lands + a clean box list; POLISH step 9 branches as their reader legs come back clean.

## (186) #13 STEP 9, REST (c13-9-ts-comments-rest ef883117) MERGED; THREE STEP 9 BRANCHES CONFLICT, STORE NOT CLEARED; rhizome-latency-mutant IS RED ON MAIN ON ACTIONS — 2026-11-04 (chat 1)
**Merged (Fable cleared, Nov 4):** `c13-9-ts-comments-rest` `ef883117` via train-c13-9 `d5d48ecc` (tree `7b06f233`). Source comments only: dist-web byte-identical to production's; tsc x2 0, seed-guard 36, link checks PASS, `c13-9-ts-comments check` PASS with all five plants FAIL. **Not deployed** (production stays `git 3da9e780 · railway 719bd9d8`). **Conflicts with main (predate #12k), POLISH rebases:** components `8618c18f` (TypeControl.tsx), pages `e56dcf0a` (PageEditor.tsx), board `6a2cd218` (BoardEditor.tsx). Store `a2c6f7f6` (persistence.ts conflict; Fable: not cleared, POLISH rebases). POLISH owes attribution of the seven reds it calls "same on base" (item163, two sync proofs, typing-latency-readers, writing-engine-audit, writing-format-proof, arrival-signin) before step 9 closes.
**Finding:** `rhizome-latency-mutant.mjs` (new with 150b) FAILS on Actions on main itself (control, same file alone: main default PASS / parked FAIL 1/11; train default FAIL 2/11 / parked PASS) — it was never on `ci-box-only.txt`. Fable: add it to the box-only list on `ci/actions-harness` as a records commit (FIX confirms); from now on a box-only clear includes checking the list Actions reads. Evidence `docs/evidence/box-logs/c13-9-rest-7b06f233/`.

## (187) rhizome-latency-mutant.mjs ON THE BOX-ONLY LIST; identity-draft0 REV F COMMITTED — 2026-11-04 (chat 1)
**`ci/actions-harness` `268cdaf1`:** `rhizome-latency-mutant.mjs` added to `apps/desktop/scripts/ci-box-only.txt` (Fable, Nov 4; FIX confirms). Checked live: dispatching the file on Actions now stops in the plan step ("rhizome-latency-mutant.mjs is on the box-only list: run it on the Windows box", run 41939209193). Rule from Fable: a box-only clear includes checking the list Actions reads. Docs-only: `docs/contracts/identity-draft0.md` rev f (adds 3b, the account-deleted event), md5 `83216d18015ee9a30cbb42a888981bbe`, `4023cea6`, blob md5 checked, link checks PASS. **read-home draft 3c NOT committed:** `Downloads\read-home.md` is still 3b (md5 `ed07d6a0...`, already committed); the 3c file (md5 `588abdc2...`) is not on disk.

## (188) #13 STEP 9 CLOSED: THE FOUR -r3 BRANCHES MERGED (components a1e4a0ec, pages 788cf5fb, board 305bed60, store 287caeae) — 2026-11-04 (chat 1)
**Merged (Fable cleared in advance, Nov 4):** the four `-r3` re-cuts, in sequence, via train-c13-9b `2c11b0d7` (tree `c9a0770f`); main fast-forwarded to it. Proof (`docs/evidence/box-logs/c13-9-r3-c9a0770f/`): each alone and in sequence dist-web byte-identical to production's, step check PASS (154 files, 760 histories moved), links PASS, tsc x2 0, seed-guard 36; Actions run 41948202686 default 232/239, parked 232/239, only the usual seven capture/probe tools non-OK. **Not deployed** (production stays `git 3da9e780 · railway 719bd9d8`). `rest-r2` dropped; old `rest` `ef883117` was merged earlier. **Still owed by POLISH:** attribution of the seven reds it calls same-on-main (turn 9 bisect). **Next:** ARBOR `harness/url-search-optin` `fe7380d8` on a clean box list -> merge; then ARBOR runs its own vine latency turn.

## (189) ARBOR harness/url-search-optin fe7380d8 MERGED — 2026-11-04 (chat 1)
**Merged (Fable cleared, Nov 4):** `harness/url-search-optin` `fe7380d8` (`WS_URL_SEARCH` opt-in in `runtime-verify.mjs` + `url-search-optin-unit.mjs`) -> `650f9a74`. Box list (26 files) on the opt-in train `201d3b4e` default CLEAN 26/26, parked CLEAN 26/26; unit proof PASS 6; dist-web byte-identical (`docs/evidence/box-logs/arbor-url-search-optin-201d3b4e/`). Not deployed. **Box released** (02:10Z); ARBOR runs its vine latency turn itself through box-take (`WS_URL_SEARCH='?arbor2=1'`, rhizome-latency + the 150b wrapper on its r20 build). Owed by POLISH: attribution of the seven reds.

## (190) FIX rhizome-arbor-premise-r1 5acc11e0 MERGED — 2026-11-05 (chat 1)
**Merged (Fable cleared, Nov 4):** `rhizome-arbor-premise-r1` `5acc11e0` (harness only: `rhizome-latency.mjs`'s flash premise gets an Arbor branch). Box list (26 files) on its train `b9fe652d` default CLEAN 26/26, parked CLEAN 26/26; bundle identical to production's; `ci-box-only.txt` on `ci/actions-harness` (`268cdaf1`) confirmed to list both rhizome files (`docs/evidence/box-logs/fix-arbor-premise-b9fe652d/`). Not deployed. FIX's open note (B2 +5.7 ms under `?arbor2=1`) is ARBOR's to read.

## (191) #13 STEP 10 a/b/d + TOOLS MERGED (tree ffb6f141); ticket #45 (b2-1); url-search-optin-unit red on main — 2026-11-05 (chat 1)
**Merged (Fable, Nov 5):** 10a `bfbfba2a`, 10b `8e02369c`, 10d `67566cd5`, tools `19436701` (+ the MAP.md recede-rule commit `19e7b3d7` it carries) via train-c13-10 `8f73ae78` -> main `adc1ce0a`. Splits only: Tutor.tsx, types/index.ts, CascadePanels.tsx become barrels over new files. dist-web not byte-identical (module order) so: Actions pair run 41979315159 + style probe IDENTICAL (2188 selectors); split checks, links, tsc x2, seed-guard pass (`docs/evidence/box-logs/c13-10-abd-tools-ffb6f141/`). Not deployed (production stays `git 3da9e780 · railway 719bd9d8`; the bundle differs only in module order, ships with the next deploy).
**Reds in the pair:** `b2-1.mjs` parked: a page-eval crash in `seedProjectWithPlan` after all checks passed, 0 of 4 solo reruns reproduce it; known intermittent (Fable: one miss Nov 1 too) — **ticket #45 for FIX**, did not hold the merge. `url-search-optin-unit.mjs` U1 fails on main itself (ARBOR's guard compares the driver to the merge base; I merged the opt-in on the box list + the branch's unit run and did not re-run it on main): **ARBOR fixes it, clear on red-first.**
**Next (Fable):** 10c (its lane + snapshot), 10f's check, 10e (on its full pair), then INK's 10g (full pair). Docs: identity-draft1-tech-v2 (md5 `55185c4b...`) over docs/contracts/identity-draft1-tech.md.

## (192) ARBOR url-search-optin-unit FIXED (harness/url-search-optin-unit-r2 f295d636 MERGED) — 2026-11-05 (chat 1)
**Merged:** `harness/url-search-optin-unit-r2` `f295d636` (one harness file; U1 parked verbatim + SUPERSEDED, successor U1b + liveness U1L). Red first on main `bb80eb94` (run 41991020737, FAIL 1/6), green on the branch (run 41991053522, PASS 9); reproduced locally PASS 9. This closes the red I left on main at (189)/(191): `url-search-optin-unit` now passes on main. Evidence `docs/evidence/box-logs/arbor-url-search-unit-r2-f295d636/`. Not deployed. Lesson (mine): a new harness merged on a branch-relative anchor must be re-run on the merged main before I report clean. ARBOR's Arbor latency turn (B2 x3 under `?arbor2=1`) is ready; the box has been POLISH's since 07:47Z.

## (193) #13 STEP 10c (lexicon split) + 10f (check) MERGED — 2026-11-05 (chat 1)
**Merged (Fable, Nov 5):** 10c `375dbc48` and 10f `ab09253f` via train-c13-10c `ed5e5845` (tree `3412cd9c`) -> main `fe9aadf2`. deskLexicon.ts splits into `store/lexicon/`; 10f closed as `c13-10f-wordcount.mjs`. Actions pair run 41992979180 default 233/240, parked 233/240 (only the usual seven non-OK); style probe IDENTICAL (2188 selectors); lexicon check PASS (938 keys x 4 readings), split-check PASS with the 18-line allow list, wordcount PASS, links PASS, tsc x2, seed-guard 36. New checks re-run on the merged main (the Nov 5 rule) and pass; the lexicon check's `--base` must stay the pre-split sha `01ae2fbc`. Evidence `docs/evidence/box-logs/c13-10c-10f-3412cd9c/`. Not deployed. **Next:** 10e (the full pair, once on origin), then INK's 10g (full pair); FIX's #45 shared-driver fix comes with the full pair + the box list.

## (194) #13 STEP 10e (c13-10e-settings 5962de81) HELD: flux-v2 LX2 red on progressDrawer — 2026-11-05 (chat 1)
Train-c13-10e `5aee25e4` (tree `16e61318`) pair (run 41997981439): 232/240 both legs, the usual seven non-OK plus **`flux-v2.mjs` FAIL 1/158 on both legs: LX2 "1 still name an Arbor noun: progressDrawer"** — 10e's new lexicon key reads 'Drawer' in every theme (Fable's ruling), but flux-v2 requires every Arbor noun to be overridden under Flux. flux-v2 was green on main (run 41992979180), so the red is 10e's. **Not merged.** Awaiting Fable: a Flux override for the key, or LX2's allow list / park + successor. Evidence `docs/evidence/box-logs/c13-10e-5aee25e4-HELD/`. Production unchanged.

## (195) #13 STEP 10g (INK c13-10g-board feaf4dcd) HELD: card-resize-axis reads a moved constant; seams A0; 10e still on its box turn — 2026-11-05 night (chat 1)
**10g not merged.** Train `825458fd` (tree `2e58eb38`) pair (run 42028542851): 232/240 both legs; beside the usual seven, `card-resize-axis.mjs` crashes on both legs (`could not read MIN_PIN_H out of components/BoardEditor.tsx`: the constant moved to `board/geometry.ts`; the harness reads the file by path, not srcText). It passed in the 10e pair, so it is 10g's; INK's readers check (9/9) missed it. INK told: re-sweep readers by behaviour, new tip, park `c13-10-seams-check` A0 (a split branch's own MODULE_PARTS entry makes A0 red; not in the pair). Evidence `docs/evidence/box-logs/c13-10g-2e58eb38-HELD/`.
**10e (583c7930) state:** pair run 42011585496: 233/240 parked, 232/240 default; LX2 fixed; one extra `pw1.mjs` miss (default only, 2/41: S5 and the survey-back target "absent"); `pw1` passes alone 8/8 (main x2 legs, train x2 legs, train default x3 more) — a driver-timing miss under pair load, #45's family (Fable's call). Box: FIX has held the grant since 10:33Z; my `rhizome-latency` 10e + main-control turn (3 rounds each) is queued behind it (4 h wait). Not merged yet.
**Order told to lanes:** me (10e) -> INK (10g, after a clean pair) -> FIX #45 -> ARBOR.

## (196) #13 STEP 10e (POLISH c13-10e-settings 583c7930) MERGED — 2026-11-05 night (chat 1)
**Merged (Fable, Nov 5):** train-c13-10e2 `5865d77d` (tree `c2951672`) -> main `45a5d93b`; `git diff train HEAD -- apps` empty. LX2 parked with successor LX2b (allow list names exactly `progressDrawer`). Actions pair run 42011585496: default 232/240, parked 233/240 (usual seven non-OK; one extra `pw1.mjs` default-only miss, 8/8 green alone on both trees, filed with #45's family). Box `rhizome-latency` on 10e AND a main control in one quiet turn (14:49Z-15:04Z, 3 rounds x both legs): 6/6 PASS on each tree, so Fable's rule is met. Merged-tree re-run: lexicon `--new progressDrawer=Drawer` PASS 9, wordcount PASS 7, links PASS. Evidence `docs/evidence/box-logs/c13-10e-r2-5865d77d/`. Box released 15:03Z.
**Next:** INK's 10g board snapshot turn (told "INK go"), then FIX #45, then ARBOR. 10g's pair (run 42032846988) is already clean.

## (197) #13 STEP 10g (INK c13-10g-board 50abca01, the BoardEditor split) MERGED — 2026-11-05 night (chat 1)
**Merged (Fable, Nov 5):** train-c13-10g3 `60198005` (tree `170aa419`: main `1edfc778` + 10g, so 10e sits underneath) fast-forwarded into main. INK's earlier train (`17afbaa5`, before 10e) had its own clean pair (run 42032846988) and box turn; I re-cut on current main and re-ran: Actions pair run 42057424875 default 233/240, parked 233/240 (usual seven only; card-resize-axis PASS 16, pw1 PASS 41); split check PASS 11 (base = main), readers PASS 13, seams PASS 16 both legs, links PASS, tsc x2, seed-guard 36. INK's box turn (15:15Z-15:39Z): board snapshot IDENTICAL (2188 selectors, 13 screens x 5 skins), 25/25 CLEAN both legs, item138 ok.
**Two reds on main, not 10g's (control: identical on 1edfc778 and the 10g tree):** `typing-latency-readers-guard.mjs` FAIL 2/5 (entry and read name `words.textContent`; the file is now `components/board/useRailLinkDrag.ts`, was BoardEditor.tsx) and `item163-drawer-line-proof.mjs` CLAIM 0 FAIL 2 (cascadePlanNoDrawer/cascadePlanRelationOwn differ by theme: lexicon overrides landed). Both stay open on the red-on-base list for Fable to assign; INK offered to take them. Evidence `docs/evidence/box-logs/c13-10g-60198005/`.
**Box:** released by INK 15:39Z; FIX holds the next turn (#45), then ARBOR.

## (198) POLISH's attribution of the six reds on main (relayed Nov 5; POLISH's claim, bisected Nov 4, not re-measured by chat 1) — 2026-11-05 night (chat 1)
None is caused by a #13 product change, per POLISH; each is the first-red commit and the merge that brought it to main:
- `sync-chunked-push-proof`: 37567654 (word-diet; merge 79a48182, Oct 14): K10a/K10b pin the old "too large to sync" copy.
- `sync-incremental-pull-proof`: 560eda8c (Drafts integrity (B); merge a56c90ae, Oct 9): its fake database does not handle collection+id keyed queries; on today's main it also lacks delete-for-good's `purged_at` select.
- `writing-engine-audit` and `writing-format-proof`: bee287a7 (font-span 1/3; merge 42ce580c, Oct 16): the bundled engine now pulls font CSS (esbuild has no .woff/.woff2 loader); the format proof copies draftDecoration.ts without ./fontRoster.
- `arrival-signin-capture`: two breaks (the suite never sets WS_ANON=1, since 8bbea2c7 Oct 6; with it set, it stalls at the logout sheet because word-diet 37567654 shortened the sheet text and line 75's regex was not updated). It is also one of the usual seven NOVERDICT capture tools in the Actions pair.
- `c13-6-css-split`: claim (1) is step 6's one-time proof, red by design since step 7; claim (2) is red because step 8's `c13-8-css-themes.mjs` reads index.css raw on purpose. POLISH offers a small branch running only (2) with that tool exempt, or to drop it from the standing list. Awaiting Fable's call.
Still red on main and unassigned: `typing-latency-readers-guard`, `item163-drawer-line-proof` claim 0 (see 197). Standing rule "a red on base is still a red": these stay listed until each is fixed or parked by its owner.
**POLISH's next:** c13-10h-persistence f4de6df3 and c13-10j-script 6b79a824 (cut from 8aae0c76; both merge cleanly into 2ab77791); 10i waits for Fable's hook list. They need the full pair on the merged tree before I merge, and Fable's clearance.
