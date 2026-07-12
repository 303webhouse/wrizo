# W1 — writing-surface polish · Fable review · 2026-07-12

**Branch:** `w1-writing-surface-polish` (3 commits: `8ee547f` code, `a34c00a` committee briefs, `fe24918` docs/logo sweep)
**Reviewed against:** the full `8ee547f` patch via the read pipe, post-J5/S1 `main` as base.
**Place this file at:** `docs/w1-review-fable.md` (commit with the fix batch).

## Verdict

**REQUIRED FIXES — 4** (three code, one process ruling). No data-loss-class
findings. The extraction quality is genuinely good: `WritingIncentives.tsx`
and `useTypewriterFade.ts` are clean lifts with ModeStage consuming them (no
fork), the edge-dwell state machine in `useChromeDissolve` is correct
(enter-zone starts the timer, any exit/summon/resurface clears it, `inZone`
self-heals on the next move once chrome is back), the fixed-track grid is the
right fix mirrored at both breakpoints, and the typewriter cannot leak onto
script/board surfaces because ModeStage only exists in the text delegate.
This is a solid ticket held up by four small things.

## Required fixes

### R1 — Spurious celebration on opening any existing ≥250-word page
`WritingIncentives.tsx` · `useGoalProgress` — `lapsRef` initializes to `0`.
On mount with a pre-existing value, the first effect run sees
`laps > lapsRef.current` and fires the celebrate pulse: open a 600-word
Journal page (or an existing Draft in the mode editor — `words` arrives live
as a prop) and the bar flashes full orange for 1.1s for laps the writer
completed in some other session. Both surfaces affected. The CDP check
verified the celebration *trigger* (typing across a boundary from fresh),
which is why this survived — the mount path was never exercised.

**Fix:** seed the ref from the first-render value:
`const lapsRef = useRef(goal > 0 ? Math.floor(value / goal) : 0);`
so only a lap crossed *during this session* celebrates.

**Verification note:** in JournalEntry, `words` seeds from
`wordCount(pageTextRef.current)` at state creation — confirm `pageTextRef`
itself is seeded from `entry.text` at ref creation (not filled later by an
effect), otherwise `words` starts at 0 and the first keystroke jumps it
across multiple laps, re-triggering the same bug through a different door.

**Harness:** seed a 600-word authored page, mount, assert no `.celebrate`
within ~1.5s; then type across the next 250 boundary and assert it fires
exactly once.

### R2 — JournalEntry ignores the persisted progress setting
`JournalEntry.tsx` — ModeStage honors `settings.progress === 'off'`;
JournalEntry renders the ProgressBar unconditionally for authored pages. The
Journal route has no settings gear, so a writer who turned progress off
elsewhere has no way to be rid of the bar here — the parity claim breaks on
the settings dimension.

**Fix:** gate the ProgressBar (not the TypewriterToggle) on
`writingSettings.progress !== 'off'`. Words-only on the Journal is fine —
add a comment that the time metric stays ModeStage-only for now.

### R3 — Window-scroll `data-scrolled` gate violates C2 (short-but-scrolled)
`useTypewriterFade.ts` · `setScrolled` — the first term
(`box.scrollTop - box.top > 4`) reduces to `window.scrollY > 4` in window
mode: any page scroll flips the fade on even while the sheet's first line is
still fully visible below the viewport top. A manual 20px scroll (or browser
scroll-restore) on a half-full page washes line 1 into paper — precisely the
state C2 exists to protect ("a fresh/short page's first line must never
render faded"). The second term (`getBoundingClientRect().top < -4`) is the
correct sheet-relative gate; the OR defeats it.

**Fix:** in window mode, gate on the container-top term only:
```ts
scrolledEl.dataset.scrolled = useWindowScroll
  ? (container.getBoundingClientRect().top < -4 ? 'true' : 'false')
  : (box.scrollTop - box.top > 4 ? 'true' : 'false');
```
**Harness:** seed a half-page, `window.scrollTo(0, 24)`, assert
`data-scrolled === 'false'`; grow content past ~73vh, assert it flips.

### R4 — Process: `.vscode/settings.json` auto-approve expansion shipped inside a build
Thirteen commands added to `chat.tools.terminal.autoApprove` inside `8ee547f`.
AGENTS.md rule, ratified 2026-07-11 and logged in the ledger's tooling
section: **config changes propose, never ship.** This commit postdates the
ratification. The contents themselves are reasonable — all read-only
inspection commands plus `tsc` — so this is a procedural breach, not a risk
finding, and it gets a ruling rather than a rewrite.

**Resolution — Nick's one-word call:**
- **(a) Ratify:** keep it; the fix-batch commit message logs "settings.json
  auto-approve expansion ratified by Nick 2026-07-12" so the paper trail is
  clean. *(Fable's recommendation — the list is read-only and genuinely
  useful for CC's loop.)*
- **(b) Revert** it out of W1 and re-propose as its own docs-only ask.

Either answer satisfies the rule. Shipping it silently again does not.

**Ruled — 2026-07-12, Nick: (a) Ratify.** Kept in W1; logged in the fix-batch
commit message per the resolution above.

## Advisories — fold opportunistically or log

- **A1** — `--m` moved from `.mode-stage` (the old `stageStyle`) onto the
  glow div itself. Grep `index.css` for `var(--m` consumers outside
  `.mode-glow`; anything else reading it from the stage ancestor is now
  unstyled. One grep, then done.
  **Checked — clean.** Both `var(--m,0)` references (`index.css:1206,1209`)
  are inside `.mode-glow`'s own rule block; nothing else reads it.
- **A2** — `.chrome-fade` now inherits `--fade-dur` from any ancestor that
  sets it. Confirm JournalEntry's pre-existing `useChromeDissolve` rootRef
  targets the page container (or that a documentElement write is intended —
  the global header receding in step *is* the design). One deliberate look
  at DeskRail's fade timing at ≥1700px while a Journal page is open.
  **Checked — clean.** `JournalEntry.tsx`'s `useChromeDissolve` already
  passed `rootRef: pageRef` (the outer `.page.journal-page` div, wrapping
  every `.chrome-fade` element) before this fix batch — `--fade-dur`
  inherits correctly. `DeskRail` stays on the older `useChromeFade` engine,
  which never sets `--fade-dur`, so it correctly falls back to the
  unchanged 220ms `--t-state` via the CSS fallback — by design, not a gap.
- **A3** — Phone: removing the flex-order hack means the capture strip now
  renders above the sheet on small screens (consistent with tabs-above).
  Graceful-degradation platform; confirm the strip stays compact. Device-pass
  item, low.
- **A4** — Celebrate→reset: `pct = celebrating ? 100 : frac` eases the width
  from 100% down to the new lap's small fraction over .5s when the pulse
  ends — a visible drain. May read fine ("the lap resets"); if it feels
  wrong on hardware, suppress the width transition during that one flip.
  Device-pass-judged.
- **A5** — One-line confirmation: grep that the `pageType` delegation branch
  sits in the outer `PageEditor` above `PageEditorView`, so the mode tabs +
  Publish stub provably never render on board/script surfaces. Structure and
  the 26/26 + 87/87 greens say yes; make it explicit.
  **Checked — confirmed.** `PageEditor()` (`PageEditor.tsx:217`) checks
  `entry?.pageType === 'board'` / `'script'` and delegates to
  `BoardEditor`/`ScriptEditor` before `PageEditorView` (the component that
  owns the mode tabs/Workshop/Publish/ModeStage) ever mounts.

## Merge condition

R1–R3 folded, R4 ruled, `j4.mjs`/`j5.mjs`/`s1.mjs` re-run green plus the two
new checks above, Fable's delta spot-check on the fix commit, then Nick's
word. W1's feel gates fold into the consolidated hardware session (ledger
item 2) — the ticket closes on Nick's device verdict, per DoD.

## Proposed doc amendments (CC commits these with the fix batch)

**1. `docs/open-threads.md` — new item under IN FLIGHT:**

> **W1 — writing-surface polish.** Built on `w1-writing-surface-polish`
> (shared `WritingIncentives`/`useTypewriterFade` extraction, Journal
> incentive-layer parity, page-is-primary metadata relocation, edge-dwell +
> 0.7s summon, fixed-track grid, Workshop/Publish tabs into PageEditor).
> Fable's review: REQUIRED FIXES — 4 (`docs/w1-review-fable.md`), no
> data-loss-class findings. Merge waits on the fix fold + delta spot-check +
> Nick's word; device gates fold into item 2. Rides along: `fe24918`
> (state-of-wrizo 2026-07 + logo set, docs-only sweep).

**2. `docs/open-threads.md` — item 2 gains a seventh cluster:**

> - W1 · S25 + desktop: edge-dwell + 0.7s summon feel (deliberate reach vs
>   drive-by), typewriter window-scroll on the ink surface (stylus-down
>   judder; does Draft want it at all), progress caret + celebration read
>   (reward vs interruption; A4's reset-drain), ≥1700px rail-toggle page
>   stability (the actual bug W1 fixed), Workshop/Publish tabs behaving
>   sanely on a Page.

**3. `docs/j-arc-runbook.md` — archive header prepended:**

> **EXECUTED IN FULL — 2026-07-11.** Steps 1–2 (J3 + VW merge/deploy), J4
> build → review → merge → deploy, J5 build → review → merge → deploy all
> closed; see `docs/open-threads.md` and `docs/backlog.md`. Kept for pattern
> reference — the runbook proved the chat-independent execution model. The
> ledger (`docs/open-threads.md`) is the living tracker now.

— Fable
