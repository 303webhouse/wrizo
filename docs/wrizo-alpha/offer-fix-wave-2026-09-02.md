# THE FIX WAVE — E4 · E3 · ITEM 118 · THE ab2 RE-POINT
## THE OFFER — one branch, one suite, one merge

**Lane:** FIX · **Branch:** `fix-wave-e34-118` · **Worktree:** `writer-studio-fx17`
**Base:** `origin/main` @ `b7978c5` · **Tip offered:** `91bddf8`
**Date:** 2026-09-02 · **Standing:** OFFERED, held at the door for chat 1.
No deploy is asked for here.

Per Fable's ruling, the two offers that had been standing separately since
2026-08-28 ride this wave: **one suite at current main covers the whole set, one
merge, one ship.** `origin/fix-ab2-repoint` remains as their own record.

---

## §1 · WHAT IS OFFERED

| SHA | what it landed |
|-----|----------------|
| `c871c08` | **the ab2 re-point** — harness-only, against the shipped DR3 menus markup |
| `ae1f600` | **item 118 (a-ii)** — the resting card renders through the decoration engine |
| `46b7c02` | **E4** — the right hand mounts from first paint + a live PB1 violation closed |
| `bc41487` | **E3** — the Counsel fades out with its contents |
| `91bddf8` | **the PB1 park** — the ruling-driven red, parked lawfully |

**Product files touched, whole wave: FOUR.** `BoardEditor.tsx` (one JSX element),
`PageEditor.tsx` (one condition removed), `Tutor.tsx` (one guard + one mount),
`deskLexicon.ts` (one string). **Zero schema, zero server, zero dependencies.**
Suite files **60 → 65**.

---

## §2 · THE RED IS PART OF THE FINDING

**The first stamped pair came back NOT CLEAN: 64/65 unparked, `pb1.mjs` failing
1/22.** That red is recorded here beside the green deliberately, on the MENU
wave's precedent, because **it is evidence the suite noticed the world change**
and the green alone would hide it.

The failing check, quoted as it stood:

> *"Unborn absences: the Tutor is absent (no projectId, no thread, no text), via
> the same precedent the first-run gate already uses — and opening the panel
> wrote nothing"*

PB1 asserted the Tutor's ABSENCE on an unborn page as a design property. **Nick's
mirrored-hands ruling reverses it**, so E4 falsified a standing, committed
assertion — on purpose, by ruling, not by accident.

**The check made TWO claims, and only ONE is superseded.** That distinction is
the substance of the park:
- *"the Tutor is absent"* → **SUPERSEDED BY DESIGN.**
- *"opening the panel wrote nothing"* → **SURVIVES, and now carries more weight
  than it did.** It used to be a trivial consequence of the panel not being
  there at all; it is now a live guarantee about a **mounted** panel sitting on
  an unwritten page — which is precisely the property whose violation this wave
  found shipped on boards.

So the original is parked **byte-for-byte** with its superseding authority and
its successors named (`pb1.mjs`'s own new live check, plus `e4.mjs` S1/S3/S4),
and the surviving half is re-made live. `pb1.mjs`'s header said *"PB1 itself
parks no assertion of its own"* — corrected in the same commit, because a header
that lies about its own file is a defect.

**No assertion was edited in place. Nothing was rewritten to go green.**

---

## §3 · E4 — THE RIGHT HAND MOUNTS FROM FIRST PAINT

**The symptom** (Nick, production `c927e9c`): the right hand's tab did not render
on load; it appeared only after interacting with styling and typewriter
controls. The left hand was present throughout.

**The hypothesis was FALSIFIED, not merely unsupported.** The announce/mount
reading predicts a re-render reveals the grip, so the probe forced two **without
writing a word**:

| moment | grip | `.wz-tutor-zone` |
|---|---|---|
| new page, on load | absent | **0** |
| after two forced re-renders | absent | **0** |
| after the first word | present | 2 |

Not in the DOM at all, unmoved by re-renders, appearing exactly at **birth**. The
clincher: `rhizome` flipped at the same instant — a different feature suppressed
by the **same condition in the same expression**, `PageEditor.tsx`'s
`gateActive || unborn`. Nick's *"appeared only after interacting with styling"*
is the same fact from the other side: a styling click writes `****`, which
births the page.

**TWO CLAIMS IN MY OWN S0 WERE WRONG, and one was the premise ruling (a) was
written on. Both corrected by measurement, before building:**
1. **`entry` is NOT `MISSING_ENTRY` on an unborn page.** `UnbornProvider`
   registers a record in persistence's unborn slot and `getJournalEntry` falls
   through to it, so the Tutor carries the **minted per-surface id** all along.
   The comment I called stale is accurate; I withdraw that. **Requirement (a)
   needed no work** — satisfied by construction, and verified rather than
   asserted.
2. **The latent defect is the OPPOSITE of what I recorded — not a silent vanish
   but a PREMATURE BIRTH.** Measured on the **shipped** build, on an unborn
   board: one Tutor send took store rows **0 → 1**, writing
   `{id:"mtkg9k2hqyy088qt9", pageType:"board", text:"", boxes:0, tutorMsgs:1}` —
   a board with no words and no cards, **born by a chat message**. A live PB1
   violation, shipped, and worse than the silence I predicted. That same row
   settles (1): it carried the minted id, not `''`.

**The fix.** `|| unborn` removed; **`gateActive` KEPT** (documented twice — TU1's
"first-run stays pure" and the FirstRunVeil blur that would break the Tutor's two
absolute anchors — and it is the one-time ceremony, not "first load").
`Tutor.send()` refuses out loud on an unborn surface and **does not clear the
composer**, so the writer's sentence survives. Ruling (b) is satisfied by
**refusing**, not by making the send work: PB1 is a standing law and a fix lane
does not overturn one for a convenience.

**`e4.mjs`, 19 checks. FALSIFIED: 9/15 failed** against the reverted product. The
**board** check is the one that catches the PB1 violation — the page checks
structurally cannot, because pre-fix there is no Tutor on a page to send from.

**The falsification pass also caught a fault in my own harness draft:** a bare
`.click()` on the absent grip **threw and killed the file** instead of failing a
check, reporting nothing downstream. Hardened via `clickOrFail` — ab2's lesson,
applied before shipping rather than after.

---

## §4 · E3 — THE COUNSEL FADES OUT

**The fade was never missing. It was fading an empty box.**

`.wz-tutor-panel` has carried `opacity var(--fade-dur,.2s) ease, transform
var(--fade-dur,.2s) ease` since FX10 S1 copied it off `.wz-sliver-panel` **after
reading that rule live** — so the two hands' fades were already
character-identical. Sampling every frame after the close click, pre-fix, the
first frame reads:

```
{ t: 1, opacity: "1.00", content: false }
```

`.wz-tutor-body` was **already gone before the fade had moved**; the panel then
dissolved `1.00 → 0.13` over ~108ms. The writer sees the contents blink out and
an empty rectangle fade.

**One conditional caused it.** `Sliver.tsx` renders `<SliverToolsBody />`
**unconditionally** inside its faded panel; `Tutor.tsx` wrapped its body in
`{open && …}`. The mirror was exact everywhere except that line — which makes
the repair **a mount change, not a timing change. No duration is copied anywhere
in this ticket and no transition was added**, which is the brief's "reuse the
existing fade, never copy timing" satisfied literally. Post-fix, same instrument:
content present across the whole transition, `1.00 → 0.20` over ~102ms, fully
faded at 169ms.

**A `visibility` rule and `inert` were considered and REJECTED.** The left hand
has shipped mounted + `aria-hidden` + `pointer-events:none` since FX1; inventing
a stricter posture on the right hand would diverge from the mirror, which is the
opposite of the ruling.

**`e3.mjs`, 9 checks. FALSIFIED: 3/9 failed** against the reverted mount. Two
checks pass in **both** directions, deliberately: fade-IN was never broken, and
**S3 — both panels resolving to the same duration, properties and timing
function — is a GUARD against a future "tuning" of one hand**, not a defect
claim.

**Still owed to MENU:** the broader half of the ruling — *every* slide-in/out
menu fades both ways. This closes the Counsel only.

---

## §5 · ITEM 118 — ONE BUILT, THREE PARKED, TWO ROUTED

`(a-ii)` is carried from the 2026-08-28 offer: `BoardTextBox` returned
`{initialText}` as a bare text node, so decoration ran only inside the popup and
the board itself showed literal markers with nothing styled. It now renders
through the popup's own engine with a **null caret**, so every marker collapses
and the writer sees words. `item118.mjs`, 6 checks, falsified 3/6.

**(b) resize-once, (c) edge-vanish, (e) unlink — PARKED UNBUILT**, per ruling.
(b) and (c) did not reproduce under mouse / one text card / 1400×900; (e) could
not be set up. **The cheapest unblock remains one line from Nick: pointer type
and card kind.**

**(a-i) underline** routes to item 79's family — recommendation on record: give
it the renderer. **(a-iii) empty-selection markers** routes to item 102's
input-model family. **Rhizome: left alone by ruling** — a meter of writing
correctly begins at the first written word.

---

## §6 · THE ab2 RE-POINT (carried)

The owed piece from MENU's §3 — *"the labelling claim … died with the tablist and
has not been re-made anywhere"* — is re-made on **both** sides of the conversion,
which is more than the tablist ever asserted: a tablist shows both names at once
and can be checked once; a single row that swaps must be checked on each side or
the swap goes unproven.

Also removed: the five parked drivers' document-wide label regex, which **killed
the file** on a string change rather than failing a check. Proven both ways —
perturbed to `"Convert to Something…"` → `1/33 failed` cleanly; perturbed to bare
`"Convert"` (which previously aborted at `ab2.mjs:243`) → `1/33 failed`, the same
single check.

---

## §7 · THE STAMP

**Suite of record, BOTH settings, rebuild-first, CLEAN TREE, machine clear, read
to completion:**

| setting | result | stamp |
|---------|--------|-------|
| `HARNESS_PARKED` unset | **65/65 CLEAN** | `tree=91bddf8 bundle=index-CaN2tPMJ.js/550462b` |
| `HARNESS_PARKED=1` | **65/65 CLEAN** | `tree=91bddf8 bundle=index-CaN2tPMJ.js/550462b` |

Per-file: `e4.mjs` 19 · `e3.mjs` 9 · `item118.mjs` 6 · `ab2.mjs` 33 (45 parked) ·
`pb1.mjs` 22 live + 1 parked.

**Superseded runs, named rather than dropped:** the first pair at `a0bf37e`
(`bundle=index-CaN2tPMJ.js/550462b`) was **NOT CLEAN — 64/65** on the PB1 red
above. That is the run that proves the park was earned rather than pre-emptive.
**Both settings of that first pair failed identically — 64/65, same file, same
check** — and the parked run printed `PB1 parks nothing` in its own verdict line
while failing, which is the header defect corrected in `91bddf8`.

**Machine conditions:** the box was held by another lane repeatedly across this
work and the runner **REFUSED** each time (16 foreign browsers, owner verified
ALIVE). No `--ignore-foreign`, no sweep of a live owner; every run waited for the
quiet window. All four runs report their own conditions; the two cited above are
`CLEAN`, machine clear, `CONTAMINATED=no`.

---

## §8 · WHAT REMAINS OPEN, ROUTED RATHER THAN SILENT

| thing | standing |
|---|---|
| item 118 (b) resize-once, (c) edge-vanish | **PARKED UNBUILT** — did not reproduce; owed one line from Nick (pointer type + card kind) |
| item 118 (e) unlink | **PARKED UNTESTED** — the setup itself failed; no connection could be minted |
| item 118 (d) board resize decays | **NOT REACHED** — points at multi-card state the probe never built |
| item 118 (a-i) underline has no renderer | **ROUTED to item 79's family** — recommendation on record: give it the renderer |
| item 118 (a-iii) empty-selection markers | **ROUTED to item 102's** input-model family |
| E3's broader half — *every* slide-in/out menu fades both ways | **OWED TO MENU** — this ticket closes the Counsel only |
| `rhizome`'s own `\|\| unborn` | **LEFT BY RULING** — a meter of writing correctly begins at the first written word |
| `BoardPinBox` / ported-card excerpts render raw | **OWED** — a derived summary is a design question, not a fix-lane call |
