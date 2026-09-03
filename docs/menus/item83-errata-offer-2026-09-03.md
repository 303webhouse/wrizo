# ITEM 83 ERRATA — THE WALKTHROUGH WAVE, OFFERED

**Lane:** menus errata (the walkthrough errata) · **Branch:** `errata-build` ·
**Worktree:** `.claude/errata`
**Date:** 2026-09-03 · **Standing:** **OFFERED, NOT MERGED.** The branch is
pushed. The merge to `main` is chat 1's act, never this lane's, and **Nick's
merge word and deploy word remain separate and his alone.**

Branched from `origin/main` @ `7b78090`. Brief:
`docs/menus/item83-errata-build-brief.md`. Authority: Nick's walkthrough
findings in the ledger at `ef9f9ce`.

---

## §1 · THE OFFER

**Offered at the tip of `errata-build`. The suite stamp names `8b3c632`; see the note below §1 for exactly what the tip adds on top of it.**

| # | SHA | what it landed |
|---|-----|----------------|
| S0 | `c28a41e` | the survey — fade path, foot layout, Structure, the indent control, `page_settings` presence. No behaviour change. |
| E1 | `811bbd0` | pop-outs fade on **15 words or a period**, never on a timer |
| E2 | `16feb6e` | Structure named + guarded at the tab's foot; **Full Screen on the progress bar's line** (probe-asserted) |
| E3 | `6adac50` | the arrow indents a **whole paragraph, repeatably** (item 102's Tab untouched) |
| E4 | `8ef2615` | item 114 placeholders — kind buttons + style guides under Research (render + persist only) |
| — | `8b3c632` | two corrections the suite caught in this wave's own work (§9) |
| — | *(this commit)* | this record, the ledger entry, fresh shots, one probe hygiene fix |

**BOTH SETTINGS CLEAN, ONE TREE, NEITHER STAMP DIRTY — 67/67 each:**

```
SUITE DONE HARNESS_PARKED=unset - 67/67 of 67 returned a passing verdict
SUITE RESULT: CLEAN - tree=8b3c632 bundle=index-BS32INXU.js/556707b
SUITE DONE HARNESS_PARKED=1     - 67/67 of 67 returned a passing verdict
SUITE RESULT: CLEAN - tree=8b3c632 bundle=index-BS32INXU.js/556707b NO-REBUILD
```

**66 files became 67:** `item83f.mjs`, this wave's own instrument, is the new
one. The parked pass ran `--no-rebuild` against the byte-identical bundle the
default pass tested, so both stamps name the same software as well as the same
tree.

**Probe: 50/50 green** (44 assertions + the 6 screenshots), of which **8 are
E2's own** — Full Screen's centre against the progress bar's centre reads
**0.00px at both widths on prose, screenplay AND board**, and Structure clears
the foot by 16.00px on prose.

**`item83f.mjs`: 34/34**, and it **parks nothing of its own** — its
`HARNESS_PARKED=1` block prints `PASS (0 checks)` and names where the wave's six
parks actually live, so the empty list is an auditable claim rather than an
absence that looks like an oversight.

### The offered tip is one commit past the stamp, and here is exactly what is in it

The stamp names `8b3c632`. The offer commit adds **this record, the ledger
entry, the refreshed shots, one probe hygiene fix and one comment correction** —
**no product code at all.** Verifiable rather than asserted:

```
git diff --stat 8b3c632 <tip> -- apps/desktop/src apps/server packages
    (empty)
```

**On the shots.** They are fresh at the offered tree. **No byte-comparison
against the committed set is offered, because that set is 179 commits stale** —
it was last written by the menus wave's own M11 proof (`0eb3bc0`), long before
this lane's branch point, so a difference there would not be attributable to
this wave and claiming one either way would be dishonest.

**The probe hygiene fix, disclosed because it is why the shots moved twice.**
Reaching Structure means switching the prose page to **Draft**, and this probe
also takes the shots — so the first run silently changed the prose shots from
Free Write to Draft. `checkFoot` now puts the surface back before the
screenshot. Found by taking the shots and asking why all six had changed on a
wave that moves almost no pixels.

---

## §2 · WHAT WAS SURFACED RATHER THAN BUILT

Three things stand open for Nick's word. **None of them was resolved silently,
and none of them was invented around.**

### ► SEAM 1 — THE OUTDENT QUESTION (§E3's own seam)

**There is no outdent partner in the Draft drawer.** `FormatAction` has no such
member; the only outdent controls in the app are the outline board's tree
control (`BoardProjection.tsx:164`) and the legacy `execCommand` format bar
(`ModeStage.tsx:422`), neither of which is this drawer.

**The nuance that matters, and that the brief's own framing does not carry.**
Before this ticket the way back *was the button*: `indent` ran through
`toggleLinePrefix`, so a second press removed the tab. **Repeatability consumes
that.** E3 does not merely *find* a one-way door — built without a partner, it
**creates** one, by spending the only exit the control had.

**What the way back is now, measured rather than assumed:** `applyRailFormat`
records an atomic step into the editor's own undo stack for every rail click
(`PageEditor.tsx`, FX6 S1), so **Ctrl+Z walks a level back reliably.** That is a
real way back. It is not a dedicated one, and it is not discoverable from the
drawer a writer is standing in.

**My recommendation, for Nick's word — not built:** add the symmetric partner as
`FormatAction 'outdent'`, decrementing one leading tab, floored at zero (a no-op
at level 0 — never an error, never a disabled control). Three reasons: the app
already ships this exact pair on its own legacy bar, so the shape is house
precedent rather than an invention; `stripMarkdownConventions` already handles
`^\t+`, so nothing downstream changes; and the alternative — repeatable indent
with no partner — is the one shape that is worse than yesterday for a writer who
overshoots.

**A note on how I read the brief here, corrected in the open.** S0's status table
said *"E3 — HELD ON NICK'S WORD."* That read the seam clause too widely: §E3
carries its own commit line, so the ruled behaviour was always to be built, and
only the partner is the invention I must not make. **E3 is built. The outdent
question is what is held.** The correction is appended to the survey rather than
written over it.

### ► SEAM 2 — THE SCREENPLAY NAME COLLISION (§E4's own seam)

Under one heading, `Structure` now holds a **kind chip reading "Screenplay"** — a
reversible, page-local setting that touches not one character of the writer's
text — beside **`Convert to Screenplay…`**, a consequential one-way act behind a
confirm dialog that rewrites the page's body and moves the writer to another
surface.

**The failure mode is specific and one-way.** A writer who means to mark the
page's kind clicks the row whose ellipsis they did not read, confirms a dialog
they skim, and their prose is rebuilt as a screenplay. There is no symmetric
mistake in the other direction.

**Nothing was renamed and nothing was merged.** Merging would make a reversible
setting inherit a destructive act's confirm, or an act inherit a setting's
silence. Renaming the verb row to a bare `Convert…` would break the bench law
that put the destination in the control's own name.

**What was done in the meantime — and it is a mitigation, not the answer.** The
zone tells the two apart three ways at once, and the harness asserts all three:
separate sub-labels naming the difference in words (*"This page is"* over the
chips, *"Change the page itself"* over the act), a different control shape (a
radio chip versus the full-width `.wz-cascade-action`, still ending in the
ellipsis that promises a dialog), and a rule between them.

**My recommendation, for Nick's word:** keep both, keep the structural
separation above, and let the conversion row keep its name. **A second, cheaper
option if he prefers less surface:** move `Convert to Screenplay…` **out of
Structure entirely** — it is an act on the work, not a description of it —
leaving Structure to hold only what the page *is*. That removes the adjacency
rather than dressing around it. I did not take it: moving a DR3-placed control
is a ruling-level change, and §E4 forbids me to resolve this silently.

**One honest observation on top.** The chips are, visually, the Prose |
Screenplay **tablist** that R13.iv withdrew from this very zone for "promising
free switching". The difference is that free switching is now the *truth* — a
kind chip really is a reversible per-page setting. The tablist's sin was dressing
a conversion as a switch; these chips are a switch dressed as a switch. Nick
should know the shape has returned to the zone it was taken from.

### ► NO SCHEMA STOP WAS TRIGGERED

`journal_entries.page_settings jsonb` **exists at this branch point**
(`apps/server/src/migrate.ts:168`) and is already wired end to end through
`sync.ts` and `types/index.ts`. `kind` and `styleGuide` join `PageSettings` as
**optional, absent-never-null** keys — the grandfather fixed point
`tutor`/`origin`/`planBoardId` all keep. **No column, no migration, no
backfill.** Item 4 was never held.

**One naming correction, recorded not assumed:** the brief says
`entries.page_settings`. **The table is `journal_entries`.** Not a new discovery
— `migrate.ts:165` already carries the same correction against the same slip in
an earlier brief.

---

## §3 · WHAT IS DEFERRED BY NICK'S OWN WORD

- **The Revise linkage** (item 112) and **footnotes** — item 114's downstream
  behaviour. The buttons are placeholders by his instruction, *"so we don't
  forget to go back to it."* Nothing downstream is wired, and nothing renders
  greyed: what is not built does not render (G3).
- **Tab-as-indent** — item 102's. **Not built here, and asserted rather than
  promised:** no key handler is touched anywhere in this wave, and item83f
  presses Tab in the editor and measures that nothing changes.

---

## §4 · TWO SCOPE DECISIONS, DISCLOSED RATHER THAN TAKEN QUIETLY

**(a) E2's Structure half was already true.** §E2 rules that Structure moves to
the tab's bottom. **It was already the last zone of the body at `7b78090`** —
every other body section is gated to a different `content.kind`, so on a Draft
page the sequence was already FORMAT then STRUCTURE with the goal foot next.
**Nothing moved.** What E2 added there is the *name* (`wz-sliver-structure-zone`) that
lets the claim be measured, and the guard that keeps it true as E4 grows the
zone. **The probe's Structure assertion passes against unmodified `main`, and it
must not be read as evidence that E2 moved anything.** The half of E2 with real
work in it is Full Screen.

**(b) The kind chips are prose Draft's, and absent from the framed screenplay
surface.** Two hosts pass `kind:'draft'` sliver content. `PageEditor` supplies
the four props; `ScriptEditor` supplies none, so the chips are genuinely absent
from that DOM — never greyed (G3). The reason: a script page has already declared
what it is (`pageType:'script'`, and the courier measure says so louder than any
chip), and a kind row there would let a writer mark a screenplay "Normal" and
then **persist that contradiction**. Nick's walkthrough opened item 114 out of the
**Draft** structure redesign. **If he wants the row on screenplay too it is four
props and a default.** Measured, so it cannot be a silent narrowing.

---

## §5 · A DEFECT CAUGHT BEFORE IT EXISTED — THE KIND MUST NOT RIDE THE DRESS CHANNEL

`PageSettings` is deliberately **one shape serving two stores**: the per-page
value and the per-user default. **"Set as my default page settings" copies it
whole** (`CascadePanels.tsx:437` → `pageDefaults.setUserPageDefaults` →
`persistence.createJournalPage`).

So without a strip, a writer who pressed that button **while a Research page was
open would make every future page Research** — silently, with nothing to
announce it. A page's dress is a preference; **a page's kind is a fact about that
page, and facts do not travel by default.**

`pageDefaults` now strips `kind`/`styleGuide` **at the door** — on set, on
hydrate, and on the local read — so the rule holds for callers not yet written.
This sat inside §E4's own *"or the shape resists"* clause: it needed no column
and no ruling. **The discriminating check is at the door**: remove `dressOnly`
and it goes red.

---

## §6 · ► FOUND WHILE VERIFYING, SURFACED AND NOT FIXED — R6's BIRTH-FROM-DEFAULTS DOES NOT REACH THE UNBORN ROUTE

**Measured, not read.** A page born through the cascade's **"New Page"** door
comes back with **no `page_settings` at all**, on a genuinely born row, with the
writer's defaults saved and non-empty:

```
{ id: "mtl88k7p8bhphou83", rowExists: true, storedPageSettings: null,
  idBeforeBirth: "mtl88gprhwy7zpthd" }
```

The stamp `pageSettings: getUserPageDefaults() ?? undefined` lives in
`persistence.createJournalPage`. That door navigates to an **unborn href**
instead (`CascadePanels`' `newPage` → `unbornHref`, FX14 S1's *"every New Page
opens in THE Page"*), and PB1's own `unbornEntry`/`birth` never carry the field.

**So item 83 M2's own ruling — "page settings reset to defaults when the user
creates a new page" — is bypassed on what is now the ordinary way a page is
made.** A pre-existing interaction between M2 and PB1, entirely outside this
brief. **Reported, not repaired.**

**What it costs this wave, stated rather than left in the numbers:** the
destination half of §5's proof has two locks on it, and only one is E4's. The
discriminating check for the strip is the one **at the door**; the born-page
check **corroborates** on that route rather than discriminating. It is kept
because the day R6 is repaired is exactly the day it starts to.

---

## §7 · PARKED, NEVER EDITED — THE COUNT IS THE CHECK

**Six assertions parked across two files, each quoted verbatim with a SUPERSEDED
banner and a live successor beside it. No assertion anywhere was rewritten in
place.** The count is stated so it can be audited against the files rather than
taken on trust — a green suite does not prove a park sweep complete.

| file | check | superseded by | why it is not a loss |
|---|---|---|---|
| `fx3.mjs` (live) | *"the instruments panel closes (dissolves) on a keystroke"* | E1 | the claim was that the ONE vanishing engine hides the tray, never a second bespoke handler. Untouched — the successor proves it one gate later, by entering a period and watching the same settle. |
| `fx3.mjs` (live) | *"...and settles to the ambient fade-min opacity"* | E1 | same reversal; the successor waits for the same settle at its new trigger. |
| `fx3.mjs` (live, script) | *"...THREE instruments again"* (`iconCount === 3`) | E2 | it counted **buttons in one row**. The foot spans two lines now; the successor **names** the third instrument instead of counting to it. |
| `fx3.mjs` (live, prose) | *"the sliver foot row is present with exactly THREE icons"* | E2 | the prose twin of the same count. |
| `fx3.mjs` (`HARNESS_PARKED=1`) | generation 3 → **generation 4** | E2 | its symmetry question is untouched; only its arithmetic was superseded. |
| `ab2.mjs` (`HARNESS_PARKED=1`) | generation 3 → **generation 4** | E2 | same, on the same count. |

**Nothing was removed from the foot.** The roster is still TYPEWRITER · PROGRESS
· FULL SCREEN — on two lines instead of one — and every successor asserts exactly
that.

**A pattern worth naming, because it has now cost four parks.** Three of these
six counted controls by number in a row whose roster a ruling can change.
`fx3.mjs`'s own parked *driver*, sitting a few lines above two of them, is the
standing warning about exactly this ("the successor names the button instead of
counting to it"). Every successor written today names its control.

**`item83f.mjs` is new and parks nothing of its own** — its `HARNESS_PARKED=1`
block prints `PASS (0 checks)` and says so in words, so the empty list is a claim
that can be audited rather than an absence that looks like an oversight.

---

## §8 · CAN THESE CHECKS FAIL?

An acceptance instrument that cannot go red is decoration. Named per section:

- **E1** — S1 reproduces the exact keystroke that used to take the tray and
  asserts it survives **while the room genuinely dissolves** (`data-writing=true`
  in the same read), which is the control against "the fade simply never fired in
  a headless browser". S2 walks the count to its boundary: **fourteen words HELD,
  the fifteenth RELEASES** — the only evidence the number is 15 rather than "any
  typing". S4 is the guard on Nick's other half: with **no** tray open the drawer
  still recedes to fade-min on one word, so the repair cannot be "never fade
  anything".
- **E2** — the probe compares **two independently rendered boxes** (the hairline's
  centre and the toggle's) and would fail the moment the flex row is replaced by
  a nudged margin. item83f's own check that **the hairline is strictly narrower
  than the goal block it used to span** is the difference between sharing a line
  and merely sitting near one.
- **E3** — both discriminators fail against the superseded behaviour: **paragraph
  scope** (a two-line paragraph comes back fully indented, where the line-scoped
  control indented half of it) and **repeatability** (`\t\t` after two presses,
  where the toggle returned to nothing).
- **E4** — the door check on the defaults strip goes red if `dressOnly` is
  removed. The born-page check is **id-guarded and row-guarded** so it cannot pass
  by standing still — a guard added *because its first run passed for the wrong
  reason* (see §9).
- **And the strongest evidence of all is the parks themselves.** Those six
  assertions were **green on `main` at `7b78090`** and are parked because this
  wave makes them red. That is a measured before-and-after, not an argument.

---

## §9 · FOUR MISTAKES OF MY OWN, FOUND BY RUNNING RATHER THAN BY READING

Recorded in full, because a fixture that encodes the wrong world is the same
species of defect as the ones this lane exists to find — and because two of these
were caught only by the suite, which is the argument for running it before
offering rather than after.

**Caught by the suite (commit `8b3c632`):**

1. **`ab2.mjs`'s Structure driver took the FIRST BUTTON in the zone.**
   `structureRowLabel` and `clickStructureRow` used `sec.querySelector('button')`
   — the conversion row, for exactly as long as the zone held one control. E4's
   kind chips now lead it, so the label read "Normal", the click hit a radio
   chip, and the file **crashed (NOVERDICT)** at the confirm-modal read that
   followed. **Re-pointed to `.wz-cascade-action` scoped to the zone —
   assertions untouched, nothing parked**, because nothing ab2 claims was
   falsified: only the way two helpers *reached* the control was. AB2 returns
   45/45, the same count as before.
   **This is the third time this wave has met the same failure — naming a
   control by its position in a roster a ruling can change.** It has now cost
   four parks and one crash.
2. **My zone class resurrected a RETIRED name.** E2 first named the div
   `wz-sliver-structure` — which is the **withdrawn Prose | Screenplay tablist's
   own class**, swept by the menus wave's own *"orphaned `.wz-sliver-structure`
   sweep"* (`45ff3fc`). `ab2.mjs` still probes that exact class and reads its
   **absence** as the proof the picker is gone, so the reuse made a live
   assertion false **with no ruling behind it**. Renamed to
   `wz-sliver-structure-zone`, with the reason recorded beside the div so it is
   not undone. **Parking ab2's check would have been the wrong answer** — the
   claim it makes is still true, and the park law is for assertions a ruling
   falsifies, not for ones I break by accident.

**Caught while building `item83f`:**

3. **The born-page check read `'New page'` where the lexicon says `'New Page'`.**
   Nothing was clicked, so it reported the **open** page's kind as though a birth
   had inherited it — a false RED that was one small step from a false GREEN. Now
   guarded twice: the id must differ from the page it was launched from, **and**
   the row must actually exist (a word is written, so PB1 has borne it).
4. **The seam check pinned a sub-label list including `'Style guide'`**, which
   only renders while Research is chosen. The first and last sub-labels are the
   seam's own pair and are now asserted **by position**, so the check no longer
   passes or fails on a state it does not care about.

## §10 · THE ASK

**Offered to chat 1. Held for review.** No merge, no deploy, no `railway` command
was run from this lane, and nothing was pushed anywhere but `origin errata-build`.

Open for Nick's word, in the order they block:

1. **The outdent partner** (§2, Seam 1) — build it, or leave the arrow a toggle.
2. **The Screenplay name collision** (§2, Seam 2) — the structural separation as
   built, or move the conversion row out of Structure.
3. **Whether the kind chips should reach the screenplay surface** (§4b).
4. **Whether R6's birth-from-defaults should be repaired on the unborn route**
   (§6) — not this lane's, and it wants its own ticket.
