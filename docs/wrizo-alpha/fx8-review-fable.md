# FX8 — card affordances · Fable's post-merge review · 2026-07-21

**Verdict: GREEN — no fold. Three advisories, one of them a real (narrow,
cosmetic) defect.**

**Depth disclosed, and deliberately raised:** FX8's own independent
review never ran — its report stalled on a background-monitor
placeholder and zero review-fix commits exist. CC disclosed the gap
rather than treating the ticket as twice-netted, which is the correct
conduct; this review therefore carries the second net alone and was run
at raised depth accordingly. Read at FULL PATCH: 54eb08d (S1–S2) and
e253197 (S3, the state-machine touch). 7411bf0 (S4) at message +
census. **Independent verification beyond the patches** — the built
`index.css` and `BoardEditor.tsx` fetched at the merge SHA and read
directly, so every claim below stands on the file, never on a commit
comment. **Census:** `BoardEditor.tsx`, `index.css`, `fx8.mjs`. Zero
server files. Zero schema. Zero dependencies.

## What I verified myself, not on the build's word

1. **The cursor cascade is correct.** Every card face carries
   `.board-text` in the JSX — plain text, page-pin, missing-pin, and
   ported all render it alongside their own class. So `.board-pin` and
   `.board-ported`'s own new `cursor:grab` rules are redundant (harmless;
   they keep their comments legible), and `.board-pin-missing`'s
   `cursor:default` still wins at rest purely by source order at equal
   specificity — exactly as the commit claims, confirmed in the built
   file.
2. **The drag swap DOES reach pins and ported cards** — the point where
   this ticket most plausibly had a hole. `.board-canvas[data-dragging]
   .board-text` carries (0,3,0) against `.board-pin`/`.board-ported`'s
   (0,1,0), and every face carries `.board-text`, so the two-selector
   rule covers all four card kinds. It only *looks* incomplete. VERIFIED.
   (A missing-pin card does read `grabbing` while actually being
   dragged, against its at-rest `default` — correct, since it genuinely
   is being dragged. Noted, not a defect.)
3. **The sibling claim holds.** `.board-pin-grab` is rendered as a
   sibling of the card face, never a descendant — no exclusion selector
   was needed, and none was invented.
4. **The state-machine claim holds.** `phase` and every one of its
   transitions are untouched. `isDragging` is set in `beginMove` only —
   never `pending`, `resizing`, or `threadDrag` — and `onUp`/`onCancel`
   both route every non-threadDrag gesture through the single `finish`,
   which clears it unconditionally. The flag is a read-only mirror, as
   described. VERIFIED by walking the handlers, not by reading the
   comment.

## Advisories

**A1 — a real leak path, cosmetic, one line to close.** The delegated
pointer effect's cleanup (deps `[pageWidthPx]`) tears down its listeners
without clearing `isDragging`. If `pageWidthPx` changes mid-drag — a
viewport resize while a card is held — the effect re-attaches with fresh
closure state while the React flag stays `true`, leaving the canvas at
`data-dragging='true'` and every card face stuck on `cursor:grabbing`
until the next drag completes. Self-healing, data-safe, narrow. Fix:
`setIsDragging(false)` in the cleanup. This is the kind of thing FX8's
missing review would most likely have caught; queued as a one-liner for
the next fix ticket, Nick's call whether it waits.

**A2 — an affordance trade, for Nick's eye.** FX5 S3's `cursor:pointer`
was the *only* at-rest signal that a page-pin or ported card is a door.
FX8 supersedes it with `grab`, so drag becomes the sole
cursor-communicated gesture and the door is discoverable only by trying
the double-click. Nick asked for the grab directly, so it stands as
built — but the trade is real. The pin badge already marks these cards
as references; the sitting decides whether that's signal enough or
whether the door wants some other quiet mark.

**A3 — the legacy invariant, read precisely and RULED.** FX8 S4
discloses that the card-body cursor reaches the legacy (<1100px) board
view, because the board canvas and card-face classes were never
framed-gated. Ruled: **the byte-identical law binds the frame's chrome,
not board card behavior**, which is intentionally shared across both
paths and was already so before this ticket. The disclosure was the
right instinct; recorded here so the next ticket needn't re-litigate it.

**Practice ratified:** grepping `scripts/harness/` for existing
assertions *before* changing a value — done three times in this ticket
and correctly finding nothing to park — is the right pre-check and is
now the expected first move on any CSS-value change.

**Still Nick's gate:** every drag claim in `fx8.mjs` used genuine CDP
trusted events, which is the right harness bar — but the trusted-pointer
law is unmoved. The grab/grabbing feel and the pin's new dome read are
device-sitting business.

# House rulings arising (for the ledger)

1. **The FX8 name collision — the disk wins.** CC's "FX8 — card
   affordances" holds the number: it opened as item 45, built, and
   merged. Fable's planned "FX8 — the Folded Lists" becomes **FX9 — the
   Folded Lists**, spec unchanged. Standing rule so it can't recur: **a
   ticket number is claimed by its ledger item, never by a review's
   forward reference in prose.** Naming a future ticket does not reserve
   its number.
2. **The placeholder-report class — new standing rule, occurrence 2 in
   one day** (FX7's build report, FX8's review report). **A stalled or
   placeholder report is a report that does not exist.** No close
   condition is ever satisfied by a report that was never written, and
   no agent may record a verification whose output it did not read. A
   ticket whose review stalls may still merge only when (a) the gap is
   named in the ledger and (b) the merging agent performs compensating
   verification and says so — precisely what CC did here. That conduct
   is RATIFIED; the rule exists so the next session doesn't have to
   improvise it.
3. **Rotate `TUTOR_API_KEY`.** The raw value was printed into a model's
   context and now lives in at least one transcript. Not a breach —
   but rotation is free and it is the honest response to a secret being
   displayed where it didn't need to be. New DeepSeek key, set on
   Railway, revoke the old. CC's unprompted self-disclosure of the
   mistake is exactly the conduct the house runs on, and is ratified as
   such.
4. **The deflake pass is armed.** j4.mjs at occurrence 1, fx5.mjs's
   per-line engage motion (confirmed pre-existing by baseline checkout),
   tu2.mjs suite-context-only, plus three transients in the last sweep —
   different files, one common factor: full-suite runs under real
   resource contention from concurrent sessions. Two rulings: **(a)
   contention-suspected failures must be re-run in isolation before
   being called transient** — CC did this every time; now required
   practice; **(b)** the aggregate crosses the handoff's own threshold,
   so a scheduled deflake pass becomes its own ticket, sequenced by
   Nick. Practice note: a sweep whose result gates a merge should not
   run alongside another session's build.
5. **Deploy manifest, as of this writing.** TU2 shipped already
   (368fb10, deployment b73e35d6, live). Merged-unshipped on `main`:
   **FX8 + M2**, plus docs riders. One deploy word lawfully carries
   both.

— Fable, post-merge, 2026-07-21
