# JOB 1 — THE ab2 RE-POINT AGAINST THE SHIPPED MENUS MARKUP
## THE OFFER — harness-only, held at the door for chat 1

**Lane:** FIX · **Branch:** `fix-ab2-repoint` · **Worktree:** `writer-studio-fx17`
**Base:** `b609b51` · **Tip offered:** `a867ac5` · **Date:** 2026-08-28
**Standing:** OFFERED. Not merged by this record; `main` fast-forwards on
Fable's word. No deploy is asked for here, and no product code is in this diff.

This is the ticket Fable pre-flagged and held: *"ab2.mjs's eleven tablist
bindings need re-points after the menus wave merges — hold until then."* The
menus wave has merged and shipped, so the hold is lifted and this is its
discharge.

---

## §1 · WHAT IS OFFERED

| SHA | what it landed |
|-----|----------------|
| `c871c08` | **the re-point itself** — `apps/desktop/scripts/harness/ab2.mjs` (+84/−6) |
| `4fce10a` | item 118 S0 pass 1 — records only |
| `a867ac5` | item 118 S0 pass 2 — records only |

**Two files, 151 insertions, 6 deletions. `apps/desktop/src` is UNTOUCHED —
zero product code, zero schema, zero server.** The two records commits are
item 118's S0 and are described in §4; they ride along because they are
records, and they can be dropped without affecting the harness change.

---

## §2 · THE INHERITANCE, AND WHAT WAS ACTUALLY OWED

MENU's own offer §3 named this lane's inheritance precisely, and drew a
distinction I want to quote back because it is the whole shape of this ticket:
five DRIVERS were parked with a named successor, three LIVE READS were left
live — *"[the fix lane] may keep them or retarget them, but it does not have to
repair them"* — and one thing was named as genuinely OWED:

> *the labelling claim: that both destinations are named to the writer, in the
> writer's own words, at the point of choice. That claim died with the tablist
> and has not been re-made anywhere.*

**That owed claim is the substance of this commit.** Everything else here is
housekeeping around it.

**What DR3 actually ships** (`Sliver.tsx:420-441`): a `.wz-sliver-section`
whose `.wz-sliver-h` reads `t('railStructure')`, containing one
`button.wz-cascade-action[aria-haspopup="dialog"]` whose label is
`t('draftConvertToScreenplay')` or `t('draftConvertToProse')` depending on the
surface. One row, one zone — not a tablist, and not two persistent tabs.

**The labelling claim, re-made on both sides.** Two assertions were added, one
before the first conversion (prose side) and one after `S4: Convert produces a
script surface` (script side). Each reads the Structure row's own rendered
label and asserts it names the DESTINATION in the writer's words. Prose side
must offer Screenplay; script side must offer Prose. The claim is now made at
both points of choice, which is where it always belonged and is more than the
retired tablist ever asserted (a tablist shows both names at once and so can
be checked once; a single row that swaps must be checked on each side, or the
swap itself goes unproven).

**One vacuous read retired.** The Free Write rail read carried
`structure: !!document.querySelector('.wz-sliver-structure')` — a selector DR3
retired, so it could only ever return `false`, and the assertion "structure is
absent on Free Write" passed for the wrong reason and would have kept passing
if Structure had appeared under its new class. It now reads the zone the way
the product renders it (`.wz-sliver-section` whose `.wz-sliver-h` is
"Structure"), so the absence claim is once again a claim about the product
rather than about a dead string.

---

## §3 · THE PART THAT WAS NOT ASKED FOR, AND WHY IT IS HERE

The five parked drivers' named successor was
`[...querySelectorAll('.wz-cascade-action')].find(b => /^Convert to/.test(b.textContent)).click()`
— a label regex over the WHOLE document. It works today. It also means that
**changing a user-facing string kills the harness file rather than failing a
check**: `find()` returns `undefined`, `.click()` throws, and every check after
that line never runs. I hit this while falsifying my own new assertion — a
one-word lexicon change took the file down at `ab2.mjs:243` and reported
nothing about the thing I was testing.

All five drivers are now scoped to the Structure ZONE and click its row
directly. The label is no longer load-bearing for navigation — only for the two
assertions whose actual subject IS the label.

**Proven, not argued.** With the label perturbed to `"Convert to Something…"`:
**1/33 failed** — the labelling assertion, alone, cleanly. With it perturbed
all the way to bare `"Convert"` (which previously ABORTED the file): **1/33
failed**, same single check. The lexicon was restored to its shipped values
afterwards and the stamped runs below are against the unperturbed tree.

Check count: **31 → 33**.

---

## §4 · THE RECORDS RIDING ALONG (item 118 S0 — NOTHING BUILT)

`4fce10a` and `a867ac5` are item 118's S0 and contain no code. In brief, so
this offer is readable on its own:

- **S0 pass 1** — (b) resize-once and (c) edge-vanish **DID NOT REPRODUCE**
  under a mouse on a one-text-card user board; (e) unlink could not be set up,
  so it is UNTESTED rather than absent. Four untested variables named (pointer
  type, card kind, card count, viewport/DPR). **Nothing offered.**
- **S0 pass 2** — defect (a) read in source: it is THREE faults, and the
  charter's "likely its own renderer path" is wrong. One of the three
  (**a-ii**, the resting card never calling the decoration engine) needs no
  ruling and is being built next, separately from this offer. One (**a-i**,
  underline has no renderer anywhere — page rail AND card dock) is **ROUTED TO
  FABLE**, not taken: retiring the U buttons and giving underline a renderer
  are both lawful and point opposite ways, and a fix lane does not unfreeze a
  standing design ruling on its own initiative.

---

## §5 · THE STAMP

**Suite of record, BOTH settings, rebuild-first, machine CLEAN (not
contaminated), read to completion:**

| setting | result | stamp |
|---------|--------|-------|
| `HARNESS_PARKED` unset | **60/60 CLEAN** | `tree=a867ac5 bundle=index-CHvEOjEp.js/543622b` |
| `HARNESS_PARKED=1` | **60/60 CLEAN** | `tree=a867ac5 bundle=index-CHvEOjEp.js/543622b` |

`ab2.mjs` itself: **`AB2 VERIFY: PASS (33 checks)`** unparked;
**`AB2 PARKED: PASS (12 checks)` + `AB2 VERIFY: PASS (45 checks)`** parked —
the twelve byte-frozen originals still green against their successors, none
edited.

The bundle is the SAME asset the menus offer and the live deploy stamped
(`index-CHvEOjEp.js` / 543,622 b), so this suite measured the shipped markup,
which is the entire point of the ticket.

**Machine conditions:** the box was held by another lane at first attempt and
the runner **REFUSED** (16 foreign browsers, owner `47724`, verified ALIVE).
No `--ignore-foreign`, no sweep — the run waited for the quiet window and
started at `BOX QUIET`. Both runs report `SUITE RESULT: CLEAN`.

---

## §6 · WHAT THIS UNBLOCKS

Every future suite. The five parked drivers no longer take the file down when a
string moves, and the Structure zone is now read the way it renders, so the
next lexicon or markup change lands as a FAILED CHECK with a name on it rather
than as a dead file with a stack trace.
