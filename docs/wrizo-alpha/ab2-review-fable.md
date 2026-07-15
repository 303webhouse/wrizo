# AB2 — the Tools by Mode · Fable's post-merge review · 2026-07-15

**Place at:** `docs/wrizo-alpha/ab2-review-fable.md` (CC commits this file;
no fold accompanies it — see verdict).
**Reviewed:** the nine-commit train `8e98337` → `1e1c2ef` on merged
`main`: full patches on the S6 JournalEntry framing (`6fb2529`), the
caret-corruption fix (`136f438`), and the S1–S5 wiring (`8419e90`); the
final state of `store/draftDecoration.ts` read whole; the remaining
commits verified by message against the brief, the harness's asserted
seams, and the suite arithmetic. Merge was pre-authorized; this review
gates the close.

## Verdict

**REQUIRED FIXES — 0.** The first clean sheet of the AB arc. No
data-loss-class findings, no architecture findings, no vanishing-law
gaps, zero schema movement (every touched file lives under
`apps/desktop/src`, `scripts/harness`, or `docs`), no new dependencies.
Five advisories carried, none blocking. **Ledger item 21's sole
remaining gate is Nick's device look.**

## In plain words

The tools are on the desk and the desk didn't move. The one serious bug
of the ticket — typed characters landing on the wrong side of a line
break — was caught by CC's own review pass before I ever saw the code,
isolated all the way down to a genuine browser quirk using a bare
test page outside the app, and fixed at a single shared gate that both
writing paths are forced through, so the bug class cannot quietly
return. The Journal's page entered the frame carrying every lesson from
AB1's one required fix. And the conversions between prose and screenplay
treat the writer's words with the care the constitution demands: flush
first, carry everything, warn where a direction is one-way.

## Endorsements (on the record)

1. **The caret fix** (`136f438`): diagnosis correct on both counts —
   `execCommand('insertText', '\n')` genuinely paragraph-splits in
   Chrome (the original approach was broken exactly as described), and
   the trailing-newline-at-EOF caret quirk is a real Chromium behavior
   correctly isolated via a React-free reproduction. The architecture of
   the fix is the right one: one guarded write helper
   (`decorateEditorFor`), one guarded read helper
   (`readEditorPlainText`), every path — keystroke, IME commit, Enter
   interception, rail format action, mode-switch caret seeding — forced
   through the pair; the sentinel stripped wherever it lands, not just
   at the tail; the harness asserting it never reaches `entry.text`.
   The escape discipline in `decorateMarkdown` is sound (`&<>` escaped
   on every text path; character count preserved 1:1, which is what
   makes caret restoration lawful). This is the independent-review
   process producing exactly what it exists to produce.
2. **S6 carried the AB1 lesson whole.** JournalEntry's framed branch
   ships with the receded host attribute, `chrome-fade` on the nav row
   *and* the file-it-first prompt, the `dissolved` prop into the frame,
   and its pre-existing write-and-draw engine driving it all — pen
   strokes dissolve the room. The exact class of AB1's R1, clean on the
   first pass this time.
3. **Conversion data discipline.** Prose→screenplay: flush, then read
   fresh, then save with the full entry spread — strokes, tags, and
   every field survive; `entry.text` is set to the serialized shadow at
   the moment of conversion (the S1 invariant honored, not deferred).
   Screenplay→prose: live doc flushed first, shadow adopted verbatim,
   `script` cleared, the one-way warning gating exactly the lossy
   direction. Mechanical throughout; nothing rewrites a word.
4. **The parked-section disposition** (`fc6bfb9`) is blessed: quoting
   the superseded assertions verbatim and re-asserting their new,
   opposite truth under the armed flag is the only honest way "parked ≠
   deleted" survives a design that legitimately obsoleted the old
   checks. See A4 for the one naming request.
5. **Reasoned rail omissions sustained:** no ink swatches on the
   Journal's rail (its ink is a hand-drawn stroke, not a typed-text
   palette) and no forward-lock switch there (the lock is
   ForwardOnlyEditor propulsion, which that surface doesn't use) — both
   deviations recorded in the commit with correct reasoning.

## Advisories (carry; none block)

- **A1 — one sync-seam verification owed, low stakes.** Screenplay→
  prose saves `script: undefined`. Node-postgres converts undefined
  parameters to null, so the server column almost certainly clears
  correctly — but the push path in `sync.ts` should be eyeballed once
  (does the payload carry the key?) on CC's next server-adjacent touch.
  Worst case today is stale, ignored jsonb riding sync; no user-visible
  risk either way. This is the "silent omissions are harness-invisible"
  class from the house learnings, so it gets written down rather than
  assumed.
- **A2 — the typewriter toggle is unreachable from a script-only
  workflow.** The control lives in Free Write rail content (reading the
  shared store); the script surface has no Free Write posture, so its
  writers can enable the effect only by visiting a prose page first.
  The brief's letter is met (the *option* reaches script's Draft, and
  the harness proves it cooperates with containment) — but the control's
  reach is a real gap-let. Recommend: the toggle joins Draft rail
  content generally, a two-line change, foldable opportunistically or
  bundled with AB3. Nick may also rule Draft shouldn't carry it.
- **A3 — the sentinel strip also removes user-authored zero-width
  spaces.** Any U+200B in pasted own-ink text is silently cleaned from
  `entry.text`. Arguably hygienic; recorded so it is a decision, not an
  accident.
- **A4 — name the two parked species.** The PARKED section now holds
  dormant checks (awaiting re-mount) and superseded checks (quoted
  history + opposite re-assertion). A two-line comment at the section
  head distinguishing them will keep a future agent from reading
  "parked" as "will re-arm as written."
- **A5 — the italic matcher is looser than strict markdown** (single
  `*` pairs across spaces italicize). Display-only, count-preserving,
  marks visible — acceptable as house convention; recorded in case a
  writer ever reports surprise styling around literal asterisks.

## Suite arithmetic, verified

304 (through TH2) + 37 (ab1 post-parking) + 38 (ab2) = **379** default-
flow ✓; ab1 armed adds 3 (40) ✓; ten scripts ✓. The S7 seam is proven
where it matters: uppercase *render* against title-case *textContent*,
no brass background, hairline present — the ratified strings untouched
by construction and by check.

## Close conditions for ledger item 21

1. ~~CC: build → self-review → merge → push~~ done (`1e1c2ef`).
2. ~~Fable: post-merge review~~ this document; **no fold required** —
   CC commits this file and the A-items ride the backlog.
3. **Nick's device look — now the only gate.** One sitting covers both
   AB tickets: composition wide and near-floor (finding 1's death
   certificate), the engraved strip and olive hairline in situ, Draft's
   iA register under the hand, a Structure-picker conversion each way
   on a scratch page, the Journal's page inside the frame, and the
   forward-lock switch. Not deployed: the look can run locally via CC,
   or `railway up` first on Nick's word — single-user prod makes either
   safe.

— Fable, 2026-07-15
