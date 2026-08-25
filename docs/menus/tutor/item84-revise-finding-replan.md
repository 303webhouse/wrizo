# ITEM 84 — THE REVISE FINDING AND THE RE-PLAN
### The Tutor's menu · 2026-08-25 · findings, corrections, and Nick's two rulings

**Two findings, both verified against source at main, 2026-08-25T19:46:04Z, both
surfaced by the build lane before any code was written. Both are correct, and both
correct documents this desk authored.**

---

## §1 · FINDING ONE — REVISE IS NOT A LIVE MODE

`apps/desktop/src/components/ModeStrip.tsx`, the mode strip's own item list:

> `{ key: 'revise', label: t('modeRevise'), live: false, active: false, onClick: () => flashSoon(t('modeRevise')) }`

Revise renders `aria-disabled`, carries the `deferred` class, and clicking it flashes a
coming-soon label. Workshop is the same. **Free Write is flag-gated** (`live:
freeWriteEnabled`). **Draft and Publish are the unconditionally live modes.** The build
lane additionally enumerated every `decorateEditorFor` call site — BoardEditor,
ForwardOnlyEditor, PageEditor, exactly the three named in T1's brief. Revise is absent
from that list not because the path was unread but **because there is no Revise
surface.**

**THE DESK'S ERROR, OWNED.** The census read the mode *vocabulary* from
`deskLexicon.ts` and never checked mode *liveness* — and in the Revise pass §0 it read
AB2's empty desk rail as a design choice ("the arc's null test") when the simpler
explanation sat one file away: the rail is empty because the mode is not live. A census
phase exists to catch exactly this. Three committee passes, six mockups, a lock record,
and a seven-ticket build order were built partly on a surface that does not exist. The
design work is not void — designing ahead of a surface is lawful, and the Free Write and
Draft halves are untouched — but **the build order was ruled on a false premise of T1's
independence**, and that premise came from this desk.

## §2 · FINDING TWO — THE PROMPT'S SOURCE OF TRUTH

`docs/wrizo-alpha/tutor-rules.md` states in its own header: **source of truth is
`apps/server/src/tutor.ts` → `SYSTEM_PROMPT`**, and the file "holds the shipped prompt
verbatim, byte-for-byte, so the record and the running system can never quietly diverge
again." The held batch's item 1 described its amendment as landing in `tutor-rules.md`
— **the mirror, not the source.** Editing the mirror alone would produce precisely the
divergence the file was created to prevent. The amendment is a **server-code change with
a same-commit mirror update**, which a design-only lane cannot make.

## §3 · WHY THE LENS CANNOT SIMPLY MOVE

Retargeting the error lens to Draft is **dead on arrival.** TRR13's reconciliation is
that the anti-interruption thesis is carried by the mode boundary: *Free Write and Draft
stay silent; Revise is the mode the writer enters to be shown what is wrong.* The lens
is lawful only because of where it lives. Move it and the law that permitted it
collapses — along with DR7's narrowing, which excepts Revise and nothing else.

## §4 · NICK'S RULINGS (2026-08-25)

**RULING A — the buildable half proceeds; the lens parks.** Nick's word: **"let's go
with A."** The chip rosters — Draft's (unconditionally live) and Free Write's (subject to
`freeWriteEnabled`) — are locked, argued, and target real surfaces; they are the arc's
buildable work and proceed now. **The error lens's seven tickets (T1–T7) are PARKED**,
not cancelled, behind a Revise surface.

**RULING B — the prompt change routes to Fable.** Nick's word: **"give it to Fable."**
This lane's design-only charter stands unamended; the drafted §2 language travels to
Fable as a brief for routing to a build lane, which lands it in
`apps/server/src/tutor.ts` and mirrors it into `tutor-rules.md` **in the same commit**.

## §5 · REVISE AS A SURFACE — WHAT IT IS AND ISN'T

Standing Revise up is **not a T0 inside this arc.** It is a surface, and the house law is
unambiguous — *presence is not composition; every new surface requires a rendered-geometry
floor from day one*, and *paper never reflows for chrome*. A doorway, a rail posture, the
FX18 geometry regimes, its own harness. **That is a ledger item of its own**, and item
84's error lens depends on it rather than containing it. Recommended to Fable for
opening; not opened by this desk, which does not charter surfaces.

**RECOVERED CONSIDERATION FOR T6, salvaged from a superseded draft (blob `8fcd4b6`,
md5 `2f5c3e55ec093a5dbc45f8dee4c8e8cc`, unrelayed, mtime 18:59:36Z).** That draft's §5
carried one clause the landed version does not: **a model call costs a turn on the
meter.** It matters more than its length suggests — Check Correction fires once per
corrected error, so a writer clearing twenty flags in a session would pay twenty metered
turns under model-call adjudication. That is a standing argument for checker-first
that exists nowhere else in the record, and T6's S0 carries it into the cost question
alongside implementation difficulty. Authored here with citation, never restored from
the stray; the stray itself is superseded in every other line.

**What the parked lens hands that item, already argued and merged:** the mode-boundary
law (TRR13), DR7 as narrowed, TRR14's decoration finding and its CSS-only flag law,
TRR15's A13 preservation, TRR12's model exception, TRR16's Check Correction loop and its
conditional adjudication, and the ruled seven-ticket order. **None of it needs re-arguing
when the surface exists** — it needs only a live mode to run in.

## §6 · WHAT PROCEEDS NOW

1. **The chip rosters' build brief** — Draft and Free Write, as locked: the shared mount
   in Talk it through, the staged-ask mechanic (editable, Send-fired, nothing auto-sends),
   TD5's lens default, the voice and button laws. Authored by this desk, executed by a
   build lane. Free Write's roster ships behind `freeWriteEnabled` as the mode itself
   does — no new gate invented.
2. **TD4 stays absent** in that build: the selection ask is disclosure-gated and its
   sentence is ratified but its mount is Revise-adjacent work; it does not ride the
   Draft roster in by the side door.
3. **The held batch** — items 2 and 3 (TRR11's relevance gate, citation depth) await
   Nick's word and gate only T7, which is parked; item 1 routes per Ruling B.

## §7 · WHAT DOES NOT LAND

**T1's S0 brief is superseded before landing** — its §1 first act is answered by §1
above, and its premise of independence is void. It is not committed. When the Revise
surface exists, T1 is re-briefed against a real mode; the parked material in §5 is what
it will be re-briefed from.

---

*This record exists because the finding must outlive the chat that produced it. The
build lane surfaced both findings before writing a line of code, which is the
stop-and-surface discipline working exactly as the briefs ask for it.*

— the item-84 desk, 2026-08-25
