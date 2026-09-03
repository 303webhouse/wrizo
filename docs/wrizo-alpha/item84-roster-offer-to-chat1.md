# MERGE OFFER TO CHAT 1 — ITEM 84, THE DRAFT ROSTER (the Tutor's chip row)

Branch: **`item84-roster`**, pushed. Base: `origin/main` @ **`e65eed4`** at branch
time; **`origin/main` @ `a20b51f` MERGED IN** (see "The base moved" below).
Worktree `.claude/worktrees/item84-roster` — never the primary checkout (item 110).

**Pre-authorized by Nick's standing ship word** (`45d7dae`): "ship whatever we can"
pre-authorizes the roster build under full gates — merge on green, Fable PASS,
deploy on the full checklist with its own manifest. **ZERO SCHEMA expected; schema
would be a STOP. There is none** (verified below, not assumed). **No deploy from
this lane.**

---

## STAMPS — BOTH SETTINGS CLEAN

| | |
|---|---|
| unparked | **66/66 CLEAN** — `tree=4e8e1e8 bundle=index-Z119zo1S.js/553267b` |
| parked | **66/66 CLEAN** — `tree=4e8e1e8 bundle=index-Z119zo1S.js/553267b` |
| live checks | 2336 |
| parked checks | 157 (5 of them added by this ticket) |
| `item84b.mjs` | **60 checks**, this ticket's own; parks 0 (it is the successor file) |
| `tsc --noEmit` | clean, **desktop AND server** |
| `hooks-order.mjs` | PASS — 150 files, 0 violations |
| schema | **ZERO** — `apps/server/migrations` untouched (0 files in the diff); `apps/server/src/tutor.ts` carries no DDL, column or migration token |

**No `+Ndirty` on either stamp, and the bundle hash is identical across the pair** —
the two runs describe the same software. The tree was left untouched between them.

**MERGE TARGET: `item84-roster` @ the docs commit that follows `4e8e1e8`.** That
commit is this file plus the ledger entry — **docs-only, zero `apps/`**, so the
bundle the stamps describe is provably the bundle being merged.

---

## WHAT IS OFFERED

The **Draft roster**: four chips inside `Talk it through`, above the composer,
below the messages — the mount the lock record already ruled (§1 line 1). Renders
on `mode === 'drafting'` and nowhere else.

**The four strings** were EXTRACTED programmatically from the build brief's §2
table into both `deskLexicon.ts` and the harness — never retyped, so no keystroke
exists in which ask 2's em dash (U+2014) could degrade — and cross-verified
byte-for-byte against the lock record itself (§3's amended `Is` cell, §4's sweep
rows). The overturned ask 3 ("Where do I lose the thread?") still stands in Pass 2
and the mockup HTML by design; `item84b.mjs` asserts it **absent** from the
rendered app, which is the check that catches a copy from either invalid source.

**Asks 1-3 stage, never send.** A press loads the ask into the composer as
editable text with a real caret at its end and puts nothing on any wire —
synchronous by construction, so "this press sent nothing" is structural rather
than promised, and measured from both ends (a page-side counter over
fetch/XHR/beacon/WebSocket to any url, plus the server double's own counter).

**TD4 adds exactly one wire key, `selection`.** The stretch is FROZEN AT THE
PRESS, because it must be: pressing a button collapses the page's DOM selection,
so a send-time read would send nothing, or something else. `pageText` stays a
render prop and never becomes a key. Per-press consent is a mechanism, not a
promise: pressing any of asks 1-3 DISARMS, and one press funds exactly one send.

**The selection seam keeps A13 intact.** The hosts own their surfaces and hand
down a read-only string (`useSurfaceSelection.ts`) — no editor ref, no text
setter. `tu1.mjs`'s structural walk is untouched and green.

---

## THE THREE THINGS CHAT 1 SHOULD LOOK AT FIRST

### 1. The v4 disclosure ships with this ticket — the one reach past the brief's literal scope

v3 names three travelers and a selection is none of them, so TD4 under v3 would
send what the shown sentence does not name — the build brief's own §6
stop-and-surface. It did not stop, because the ledger had already ruled the
disposition: `open-threads.md:774` — *"v3 -> superseded by v4 in annotation form
(v3 standing verbatim beneath)"* — with TD4/TR3/BD4 **fully unblocked for build**
at :785-790. **Fable has ratified this reach** (rulings, this session): the
ledger's own supersession ruling executed, not scope invented.

So `CURRENT_DISCLOSURE_VERSION` goes 3 -> 4 and v4's ratified sentence leads the
modal, verified against its committee manifest (**183 bytes, md5
`9287082c0e3c0a2b243c71ce01c89b43`** — the first measurement read 184 and a wrong
md5; the file's CRLF was the whole difference, recorded rather than dropped).
**v3's string is REUSED BY ID beneath it — never copied, never edited** — which is
what makes "verbatim" a fact about the line rather than a claim about it.

**BD4 COLLISION SURFACE, for chat 1 to verify at merge:** item 83's BD4 mounts on
this same sentence. If that lane also bumps the version, the two edits meet in
`deskLexicon.ts` and `tutorDisclosure.ts`.

### 2. The base moved mid-lane, and this branch merged it rather than offering a stale green

`origin/main` advanced to **`a20b51f`** (the fix wave: E4/E3/118) while this lane
was stamping, touching **three files this ticket also touches** — `Tutor.tsx`,
`PageEditor.tsx`, `deskLexicon.ts`. A green taken at the old base would have
described software that never existed and asked chat 1 to merge two waves never
exercised together. **E4's change is literally the unborn gate at the line this
ticket's Tutor mounts on**, so it was the overlap that most needed exercising.

- **One conflict**, `PageEditor.tsx`: resolved by keeping E4's un-gating WHOLE
  (comment verbatim, `|| unborn` gone) and carrying `selectionText` through it.
- **The auto-merge in `send()` was read, not trusted.** E4's
  `if (isUnborn(entry.id)) { setStatus('unborn'); return; }` lands ABOVE this
  ticket's armed-selection consumption, so on an unborn surface the refusal
  returns before the arm is read: the composer keeps the writer's sentence (E4's
  stated intent) and the armed selection survives with it. That is the correct
  reading of "one press funds one send" — no send happened, so nothing was spent.

### 3. SCREENPLAY CARRIES THE ROSTER — stands as built, one line to overrule

`ScriptEditor.tsx` passes `mode="drafting"` unconditionally: a screenplay page IS
a Draft page, so the roster renders there and the selection is threaded to that
surface too. A chip gated on a value a surface never supplies would be
permanently disabled — G3's locked door wearing paint — which is the one thing
the brief's transient gate is not. **Fable ruled this stands** (the roster follows
the MODE, which is the design's own gate). If the desk ever wants prose-only, it
is one predicate and a harness flip, not a rebuild.

---

## THE PARK SWEEP — 5 checks, each verbatim with a successor named

| file | parked | what |
|---|---|---|
| `item84.mjs` | 1 | *"that Draft panel carries no roster either"* — a **park of MEANING**: it still PASSES (it reads the Free Write class) but stopped describing a panel that now carries four chips |
| `tu1.mjs` | +1 (7) | the disclosure version-NUMBER assertion, 3 -> 4 |
| `tu2.mjs` | +1 (10) | same |
| `tu5.mjs` | +2 (2) | same, both of its version-number checks |
| `item84b.mjs` | 0 | correct — it is the successor file |

**No WORDING assertion parks anywhere.** v4 renders in annotation form with v3's
string reused by id beneath it, so `tu2`/`tu5`'s "the modal carries v3's wording
exactly" checks remain true as written. That DOM shape was chosen because it is
what "annotation form" describes; the reduced churn is a consequence of the
choice, not the reason for it (registered by Fable).

**The ten skip-the-disclosure FIXTURE SEEDS moved 3 -> 4** — a fixture repair on
TU5 S6's own recorded precedent (`tu1.mjs:98`), not a park: the fixture's intent
("this device has already acknowledged") is unchanged and no assertion below any
of them changes meaning.

---

## TWO DEFECTS THIS LANE FOUND IN ITSELF, RECORDED RATHER THAN QUIETLY FIXED

**(a) `item84b.mjs` S8 — a fixture hazard that read like an A13 breach.** The
first stamped run returned `storedBefore:"" / storedAfter:<the page>`, which looks
exactly like the roster writing to the paper. It was not: the four per-press DOM
assertions passed throughout (that IS the A13 claim), the text that "appeared" was
byte-identical to what was already on screen before any press, and `item84.mjs`'s
own S7 runs the same pattern and passes — the difference is this file's MODE
SWITCH, which re-seeds the editor and re-persists on `persistence.ts`'s debounce.
**Measured on the repair: the baseline takes 1100ms to settle — notably longer
than `FLUSH_DELAY` (300ms) alone would suggest**, so the mode switch's re-persist
is genuinely late rather than one debounce tick. **Named for the house: any future
fixture that switches modes and then reads the store can trip on exactly this.**
The repair STRENGTHENS the check — S8 now also asserts the page was genuinely on
disk before the roster was pressed.

**(b) A hole in this ticket's own park sweep, found by auditing the stamp rather
than trusting it.** The v4 bump edited `tu2.mjs`'s live version check 3 -> 4 and
updated its PARKED summary to claim an item-84 entry — **but the `pok()` call was
never pushed.** tu2 therefore carried an assertion rewritten in place with no
parked predecessor: the immutability law broken in one of the very files this
ticket claimed to be protecting. **Both suites were CLEAN with the hole open.**
The tell was arithmetic, not a failure: `TU2 PARKED: PASS (9 checks)` — the same 9
tu2 carried before this ticket — against a summary claiming ten. **A green suite
does not prove a park sweep complete; only counting does.** All four files were
audited before the fix so a second hole could not cost another re-stamp; tu2 was
the only one, and it now reports 10.

---

## ONE MIS-TARGETED RUN, NAMED FOR WHAT IT WAS

An earlier parked invocation used a RELATIVE script path while the shell's cwd was
no longer the worktree, so it ran the **primary checkout's** runner against the
**primary's** 62 harnesses: `62/62 CLEAN tree=32c1ebd`. **That result is not this
lane's and is not quoted as one.** The tells were all in the header — 62 files not
63, no `item84b.mjs` in the list, a different bundle hash, and `item84.mjs`/
`tu5.mjs` reporting `PARKED: PASS (0 checks)` when this ticket adds 1 and 2.

**Footprint checked, not assumed:** the primary checkout's `git status` is clean —
no tracked or untracked changes. The only trace is gitignored `dist-web`, rebuilt
from the primary's OWN source at `32c1ebd`. Five of this ticket's unique strings
were grepped against that bundle — **all absent**, with this worktree's bundle as
a positive control so the grep is not vacuously passing. **Nothing of this lane
can reach a deploy from that tree.**

**Superseded stamp pairs, listed so none is mistaken for current:** `6aa9144`
(unparked NOT CLEAN — defect (a)); `7fc1d86` (both CLEAN, stale base); `cd2d30f`
(both CLEAN, park hole (b) open). **Current and only offered: `4e8e1e8`.**

---

## WHAT IS NOT IN THIS OFFER

By the brief's own §1: the Free Write roster's redesign beyond the shipped deck
phase, anything in Revise, the error lens (T1-T7, parked), TD5's lens default. By
its §9: the shared-row label collision stays ROUTED to the Revise re-pass — Draft
ships its own string and the reconciliation happens when Revise exists.

**No deploy.** Nothing ships without Nick's word.

- the item-84 Draft-roster build lane, 2026-09-02
