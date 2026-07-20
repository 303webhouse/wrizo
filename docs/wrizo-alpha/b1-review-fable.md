# B1 — the Journal Reborn (+ the Trash) · Fable's post-merge review · 2026-07-20

**Verdict: GREEN. Required: 0. Advisories: 1.** Tip 0147d8b (ledger
52a47d5). The first ticket judged under A16, reviewed against the new
law's own load-bearing claims — and every one of them held under the
strongest proof style this house has yet produced.

**Census, disclosed:** widest commit (8cba61a) pulled directly — all
apps/desktop (BoardEditor, Sliver, deskLexicon, persistence's
reconcile engine +219, resume, types); every other commit's files
enumerated in its own message; AND the independent review explicitly
re-verified apps/server untouched. Zero-schema TRUE at that
triple-attested depth.

**A16's claims, verdicted one by one:**
- *Arrangement never alters stored truth* — proven TWICE: the build's
  own fixtures, and the independent review's from-scratch throwaway
  harness driving a genuinely trusted drag+resize+overlap+reload
  round trip. The skeptical second proof is the A16-era review bar,
  ENDORSED by name.
- *Reconcile idempotence* — proven the strong way: two separate
  mounts against unchanged truth, byte-identical boxes; reconcile
  returns null when nothing changed.
- *Authored arrangement is sacred* — a sibling card's x/y/w/h/z
  survives the entire delete→Trash→restore→Journal round trip
  byte-for-byte.
- *Arrange, never author* — Add is structurally absent (undefined
  handlers, not hidden buttons — the stronger form); Delete inert on
  derived cards; Move/Copy/Pin inert on a system board's own face
  with Port correctly live (it only copies); and a harness-born gap
  closed with the FX6 belt-and-suspenders shape: pinPageToBoard now
  code-guards against pinning a system board anywhere.
- *Capture survives every commit* — Catch's path confirmed
  byte-identical (0-diff files), captured pages arriving via the
  ordinary reconcile.

**Rulings of record:**
1. **origin:'system' RATIFIED** — a vocabulary addition, not a
   schema change (the origin column is deliberately CHECK-free; A2's
   null-grandfather untouched; mappers pass text through). The
   alternative (null origin) would have made system boards "loose"
   and leaked them into loose listings; the build also closed the
   latent first-board-with-no-projectId blind spot before it ever
   bit. The origin union is now 'journal'|'project'|'loose'|'system',
   recorded here.
2. **The three-bug chain RATIFIED in-scope** — all three latent
   defects existed only because nothing had ever made the Journal
   Board a real destination: the dropped actionToast (the retired
   list was its only consumer — the gate now bridges router state
   and BoardEditor reproduces the retired consume-and-replace
   verbatim, both branches); the suppressed way-back chip
   (isWritingRoute treated every /page/:id as writing — now scoped
   via getSystemKind); and the clobbering race the chip fix
   UNMASKED (BoardEditor's capture-on-unmount vs the one-slot
   store — solved with participatesInWayBack, default true, so
   every existing caller is untouched and system boards opt out
   exactly as the retired Journal.tsx did). Fix-reveals-the-next,
   both chased to root. The toast itself is pre-existing behavior
   correctly PRESERVED through retirement — feedback on the
   writer's own act, not solicitation; its design fate, if any,
   belongs to a future sweep, not this ticket.
3. **The review's defect — and its method — both matter:**
   describePageHome never learned 'system', so both system boards
   claimed "In the Journal" as their own home (false for Trash,
   self-referential nonsense for Journal). The reviewer STOOD ON
   THE SURFACE and watched the lie render before fixing it —
   verification by inhabitation, not inspection. Fixed at the call
   site only; every ordinary page's label byte-identical; +2
   regression checks (53).
4. **Retirement-by-replacement executed with zero blast radius** —
   Journal.tsx deleted; every pre-existing caller of the literal
   '/journal' string untouched and landing on the Board through the
   gate; the retired room proven genuinely unreachable; legacy
   DeskRail proven byte-identical at the 1099 floor. The /trash
   route ACCEPTED (bookmarkable door, DeskRail untouched —
   consistent with the letter and spirit both).
5. **The park sweep at its largest scale yet** — nine harness files
   repaired or parked at A4 discipline, including th2's own
   "canonical /journal" claim parked because retirement means the
   URL deliberately no longer stays canonical; the
   wrizoCreateJournalPage seam replacing retired-UI fixtures
   matches the established seam pattern; two harness-authoring
   bugs fixed via this project's own recorded lessons.

**A1 (advisory, accepted with eyes open):** below the 1100px legacy
floor there is no Trash rail item — a page deleted on a narrow
window is recoverable only by widening past the gate or via the
/trash URL. Correctly flagged rather than silently decided, and
correct under the legacy-chrome-stays-byte-identical rule; it rides
until the legacy regime's own reckoning (or B2's chrome pass, if
Nick prefers it sooner). No writer loses data — only a door, on
one device class, temporarily.

**Close conditions:** (1) this review on disk — this file; (2)
deploy on Nick's word — manifest since 6759777 = **FX6 + B1**, both
named, plus docs; (3) Nick's B1 DoD script per the brief's own
paragraph, plus FX6's, at his leisure. **The next brief is Nick's
one-word decision:** B2 (Shelf + Drawers) is already authorized by
the standing B1–B3 confirmation — OR, if he ratifies the second
sitting's four points, the committee's recommended order puts V1
(the staged vanish) first. Whichever word arrives, that brief
follows.

— Fable, 2026-07-20
