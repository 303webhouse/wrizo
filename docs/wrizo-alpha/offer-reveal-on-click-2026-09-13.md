# REVEAL-ON-CLICK
## THE OFFER — clicking into markup shows it, on both surfaces, from one signal

**Lane:** FIX · **Branch:** `reveal-on-click` · **Worktree:** `writer-studio-fx17`
**Base:** `origin/main` @ `a3e8d59` · **Tip:** `8cce16b`
**Date:** 2026-09-13 · **Standing:** **BUILT AND CARRIED — ITS PAIR IS OWED.**
Not yet offered; the offer form arrives with the stamps.

**ZERO SCHEMA. ZERO SERVER.** 5 files, +440/−23 — three product, two harness.

**CATEGORY, flagged under the merge rule:** product code (`draftDecoration.ts`,
`ForwardOnlyEditor.tsx`, `BoardEditor.tsx`) plus harness. **The product half
gates the whole offer.**

---

## §1 · THE STAMP — **OWED, NOT CLAIMED**

**THIS BRANCH HAS NOT BEEN STAMPED.** The pair below was measured on the
**pre-split lineage**, where this work sat on top of item 133 on the (already
merged) `item122-styling`. The one-subject-one-branch ruling moved it: the two
commits were cherry-picked onto **current `origin/main` (`a3e8d59`)**, which is a
**different tree**, so those numbers do not describe the code offered here. They
are recorded as **history, not as this branch's stamp** — a stamp that names a
tree it was not run on is a false record, and the whole point of the provenance
line is that it cannot be borrowed.

**A fresh pair at `8cce16b` is owed**, by chat 1's announcement, and this section
is rewritten around the real numbers when it lands.

**WHAT THE PRE-SPLIT PAIR MEASURED (history):**

| setting | result | stamp |
|---------|--------|-------|
| `HARNESS_PARKED` unset | 81/81 CLEAN | `tree=1fec9ac bundle=index-CwqM6vX3.js/575426b` |
| `HARNESS_PARKED=1` | 81/81 CLEAN | `tree=1fec9ac bundle=index-CwqM6vX3.js/575426b` |

Machine clear, no contamination and no mid-run VOID in either leg; the tree
measured 0 dirty before the first leg and 0 dirty after the second. On the new
base the cherry-picks applied cleanly and **`tsc --noEmit` and `build:web` are
green browserlessly** — which is not a stamp, and is not offered as one; it only
means the box turn will not be spent discovering a compile error.

**WHAT THE NEW PAIR MUST RE-CONFIRM**, stated in advance so a shortfall is
visible rather than explained afterwards: **81 harnesses** (`reveal.mjs` is new,
and the count on the new base may differ if other lanes have added files since),
`reveal.mjs` **PASS (16 checks)**, and the two expectations below.

**THE PARK COUNT, TO BE COUNTED RATHER THAN ASSUMED:** on the pre-split pair the
parked leg carried **179** park entries against item 133's **179** — unchanged,
which is the claim, since this swaps a signal without retiring an assertion. The
new pair re-counts against **current main's own baseline**, which is the number
that matters now; no park is expected to be owed.

**AND THE ASSERTION MOST AT RISK WAS GREEN ON ITS OWN TERMS:** on the pre-split
pair `fx5.mjs` returned **PASS (62 checks)**, S6's reveal-adjacent-to-caret among
them. That is the check FX5 wrote for the register this ticket re-signals, and it
passing is the evidence that the enumerated pair's *behaviour* survived its
removal. **It is the single check to look at first if the new pair reds.**

**ONE DISCLOSURE ABOUT THAT CHECK, since it is the kind of thing worth saying out
loud:** fx5 S6 places its caret with a programmatic Range and then dispatches a
synthetic `keyup` as a nudge. **That nudge is now inert** — nothing listens to
`keyup` for the reveal any more. The check still passes because setting a Range
fires a genuine `selectionchange`, which is the signal this ticket installs. The
assertion is unfalsified and therefore **no park is owed**, but the dead nudge is
recorded here so a future reader does not infer that `keyup` still matters.

---

## §2 · S0 — THE TICKET'S NAME IS NOT ITS FINDING

The reveal register has **always** computed which markers to un-collapse from a
caret offset: `decorateMarkdownForCard(text, caret)`. **Nothing about the reveal
itself was missing.** What was missing is anything that RE-RAN it when the caret
moved without an edit — and the two surfaces were in different states:

| surface | verdict | why |
|---|---|---|
| **PAGE** (`ForwardOnlyEditor`, `freeEdit`) | **ABSENT** | `redecorate` ran from `onInput` and once at mount, **from nowhere else** |
| **CARD** (`BoardEditor`'s popup) | **PRESENT, by ENUMERATED EVENTS** | FX5 S6's `keyup` against a `NAV_KEYS` list, plus a `mouseup` |

So on a page, clicking into a `**bold**` word did **nothing at all** — the
decoration still showed the reveal for wherever the caret had been at the last
keystroke. That is the founder-visible half.

**AND THE ENUMERATED PAIR CARRIED A DEFECT.** Both listeners redecorated
**unconditionally**, and a redecorate restores a **collapsed** caret. `getCaretOffset`
returns a range's **start**, not null, for a live selection — so the pair fired
mid-selection and **destroyed it**. On a card, a selection extended across a
reveal boundary collapsed as it was made. **Measured, not argued:** §4's mutation
shows `collapsed:true, length:0` the moment the guard that replaced it is removed.

---

## §3 · WHAT WAS BUILT

One shared `revealAtCaret` in `draftDecoration.ts`, driven by **`selectionchange`**
on both surfaces. That is the only event that fires for **every** way a caret can
move — click, drag, arrows, Home/End, Tab, and the formatter's own programmatic
moves. **Item 122 had already made this exact argument** for Draft's B/I/U button
state; the decoration is the same problem, so it now uses the same signal.

**IT REFUSES FOUR THINGS**, each a way this could damage the surface it serves:

1. **A non-collapsed selection** — else a redecorate collapses what the writer is
   selecting, and `selectionchange` fires on *every character* of a drag.
2. **A caret outside the element** — `selectionchange` is a *document* event; it
   fires for the other editor when a card popup sits over a page.
3. **An unchanged decoration** — both the performance guard (arrow-keying inside
   one paragraph builds a string, writes no DOM, disturbs no caret) **and what
   makes the listener terminate**: redecorating restores the caret, which fires
   `selectionchange`, which is a loop unless the second pass declines.
4. **Mid-composition / mid-em-dash-substitution** text, which is not the
   writer's yet — the same two conditions each `onInput` already checks.

**THE COMPARISON IS AGAINST OUR OWN LAST OUTPUT, NEVER `el.innerHTML`.** Reading
the DOM back gives whatever the browser normalised our string into. A purely
cosmetic difference there would make every comparison report "changed" — and
**the guard that stops the recursion would become the thing that drives it.** So
a `WeakMap` holds what `decorateEditorFor` actually wrote.

---

## §4 · THREE FALSIFICATIONS, AND TWO CHECKS THAT PROVED NOTHING

**A green check is worth nothing until it can be made to fail**, so each guard
was deleted in turn against the committed tree.

| mutation | result |
|---|---|
| the page's `selectionchange` listener | **S1 (the ticket) + S2 FAIL** — no reveal, `mutations: 0` |
| the **non-collapsed** guard | **S3 + S4 FAIL** — `collapsed:true, length:0` |
| the **unchanged-decoration** guard | **S2 FAILS at `mutations: 2196`**, against **1** with it |

**2196 against 1.** The loop is not theoretical and the guard is what closes it.

**AND THE MIDDLE ROW COST TWO WRONG CHECKS, both of which passed with the guard
deleted** — which is to say they proved nothing while reading green:

- **v1** extended a selection **within** the bold run. The caret never left the
  revealed region, so the decoration was unchanged and **guard 3 carried a check
  named for guard 1**.
- **v2** extended **forwards** across the boundary — and *still* passed, because
  `getCaretOffset` returns the range's **start**, and a forward Shift+Arrow
  selection **never moves its start**. The decoration was being computed from a
  number that was standing still.

Extending **backwards** from the end drags the start across the boundary, and
only then does the check fail without its guard. **The lesson is the one worth
keeping: "the state I am testing changed" is an assumption, and here it was
wrong twice in a row while the suite stayed green.** This is ERRATA's 85-C canon
— a check can pass for the wrong reason when its premise is already dead —
arriving in my own work, caught only because the mutation was run.

The same vacuity hit **S1's re-collapse** check: *"the markers are hidden now"*
is trivially true on a build where nothing ever reveals them. It now asserts the
reveal that preceded it.

---

## §5 · THE HARNESS — `reveal.mjs`, 16 CHECKS

S1 the page reveals on a **real** click and re-collapses on the way out, with
the caret staying where it was put · S2 **termination measured** as a bounded
mutation count · S3 the selection guard · S4 the card keeps FX5 S6's behaviour
on the new signal, including a trusted `Home` press covering the retired
`NAV_KEYS` list · S5 the stored text is byte-identical throughout.

**TERMINATION IS COUNTED, NOT EYEBALLED.** A loop and a single pass look
identical in a screenshot; a `MutationObserver` tells them apart.

**ONE ADDITIVE HARNESS CHANGE:** `runtime-verify`'s `key()` gains arrow/Home/End
virtual key codes and a trusted **Shift** modifier. Before it, `key('ArrowRight')`
sent code 0 and Chromium moved no caret — a caret-move could only be staged from
page script, untrusted. **No harness passed an arrow through it before (checked
across the roster, not assumed)**, so nothing can regress.

---

## §6 · WHAT IS NOT HERE

- **BLUR DOES NOT COLLAPSE THE REVEAL.** When focus leaves the editor entirely,
  the last reveal stays on screen — `selectionchange` fires with the caret
  elsewhere and `revealAtCaret` correctly declines. This is **pre-existing**
  (the old code had the same end state) and it is arguably the stuck-highlight
  complaint in a quieter register. **I did not fold it in**: collapsing on blur
  means writing `innerHTML` on an unfocused editor, and the format-rail buttons
  blur the surface on their way to acting on it — a wrong ordering there would
  break Bold, which is a worse bug than a lingering pair of asterisks. **Routed,
  not silently included.**
- **The cost is one decorate-string per caret move.** No DOM write unless the
  reveal actually changes, and the same order of work `onInput` already does per
  keystroke — but it is not free, and on a very long page it is paid on every
  arrow press.
- **No deploy is asked for.** Ships are batched on Nick's word.
