# Page-readiness survey — Wrizo | Write

**STATUS: REPORT ONLY. Nothing was changed.** No product code, no harness, no box turn. Read code
and write this document — that was the whole ticket.

**Ordered by:** Fable, relaying Nick's four reports, 2026-10-21.

**What was surveyed:** `origin/main` at `13db00cc` (help-buttons merged at `7e35070e`), read from
worktree `page-readiness-survey` off that same commit.

**How:** source reading only (Glob/Grep/Read, `git log`/`git show`/`git merge-base`) — no
`pnpm dev`, no harness run, no box turn. Every citation below was independently re-read and
confirmed against the actual file at the line given before this document was written; none is
taken on an agent's word alone.

**Four items, each as asked:** exact repro steps on main, the cause in source, whether a branch
already fixes it, a proposed owner.

---

## 1. "Sprout" icon and pre-filled phrases still show on new pages

### Repro on main
1. Open any account, any brand-new blank Journal/Free-Write page — **not just the account's
   first one**. Page #2, #20, it doesn't matter.
2. The Sprout door (olive rhizome glyph, label "Sprout") renders beside the caret. This is
   already correct *as the code is written* — see below, it's not a stale leftover render; the
   condition really does mean "any blank Free Write page."
3. Tap Sprout once. It calls `invite.optIn()`
   (`apps/desktop/src/components/useFirstLineInvite.tsx:71-77`), which sets
   `localStorage['wrizo-first-line-invite'] = 'on'` — device-wide, permanent, no expiry, no
   per-page scope.
4. From then on, **every future blank Journal page on that device** auto-shows a random
   "pre-filled phrase" from `NUDGE_POOL` (e.g. "salt", "a door left open") without the writer
   touching Sprout again.

### Cause in source
Two mechanisms, each working exactly as coded — the bug is that neither was ever scoped to "the
account's first page":

- **Sprout's own render gate** — `apps/desktop/src/pages/PageEditor.tsx:856`:
  ```ts
  const beginningsVisible = !beginningsDismissed && !gateActive && mode === 'journal' && wordCount(text) === 0;
  ```
  No concept of "first page ever" anywhere in it — just "this page is Journal-mode and blank."
- **Phrase persistence** — `useFirstLineInvite.tsx`'s `optIn` (L71-77) writes the pref with no
  expiry or scoping; visibility (L86) is `pref === 'on' && isEmpty()`, true on *every* future
  blank page forever, once Sprout is clicked once.

This reads as a **product/spec mismatch**, not a stale flag someone forgot to remove:
- `960356c0` (2026-10-08 09:53) retired the page's old Beginnings row entirely when templates
  moved into the Sliver's Templates section.
- Three hours later, `5867aad6` (2026-10-08 12:02, "Page templates, revised to Nick's rulings")
  deliberately **brought Sprout back** for "the blank Free Write page's door" — with no
  first-page-only scoping written into that ruling.

Both commits are already ancestors of main. The codebase has prior art for genuine
once-per-account gating (`store/firstRun.ts`, "THE RITUAL RUNS ONCE PER ACCOUNT, EVER") that
`beginningsVisible` never adopted.

### Existing branch coverage
**None found.** `git log --all -- PageEditor.tsx BeginningsRow.tsx useFirstLineInvite.tsx` shows
no commit past `5867aad6` touching this gate, and both `960356c0`/`5867aad6` are confirmed
ancestors of main via `git merge-base --is-ancestor`. No branch name or comment anywhere
references "first Journal page only" scoping for Sprout. This needs a new fix.

### Proposed owner
**TOOLS.** The gate lives in page chrome/mode plumbing (`PageEditor.tsx`) and the Templates strip
furniture (`BeginningsRow.tsx`/`Sliver.tsx`) — the same surface PAGE-TEMPLATES-MOVE already
touched, not editor mark/decoration logic. The fix shape: an account-scoped "seen the first
Journal page" flag (mirroring `store/firstRun.ts`'s pattern) added to `beginningsVisible`, and a
similar cap on `useFirstLineInvite`'s persisted `'on'` pref.

---

## 2. New Page in the main left-hand menu doesn't work

### Repro on main
1. Launch the app at its default window size — `apps/desktop/src/main.ts:8-9` sets `1200×800`,
   always past the framed threshold below.
2. Open any existing page/journal/board/script surface — anywhere that mounts `<DeskFrame>`
   (`PageEditor.tsx`, `JournalEntry.tsx`, `ScriptEditor.tsx`, `BoardEditor.tsx` all do).
3. Look at the left rail (`DeskRail.tsx`): **it's gone.** Not a disabled button, not a dead
   click — the whole `<nav className="desk-rail">` is unmounted. There is no literal "New Page"
   label in `DeskRail.tsx`; the equivalent control is the "Catch" button (the `+` glyph,
   `DeskRail.tsx:122-130`) — the rail's one shared "make a new page" door. It, and the `n`
   keyboard shortcut, are both simply absent from the screen.

### Cause in source
`apps/desktop/src/components/DeskRail.tsx:102`:
```ts
if (deskFrameActive || pathname === '/') return null;
```
— added by `dbb598f0` ("CD1 S4: DeskRail retires framed; its gutter is reclaimed").
`deskFrameActive` comes from `useDeskFrameMounted()` and is true whenever *any* `DeskFrame` is on
screen; `DeskFrame.tsx:59` sets `DESKFRAME_MIN_WIDTH = 1100`, and the app's default window
(`main.ts:8-9`, `1200×800`) is always past that. So in ordinary use, the instant a writing
surface is open, the rail — and its only "new page" door — disappears.

The handler itself is sound when the rail IS visible: `onClick={doCatch}` →
`useCatch.ts:21-24` → `navigate(unbornHref({ origin: 'journal' }))` → `/page/new?origin=journal`
→ routed by `App.tsx:392` to `<UnbornPage>` (`PageEditor.tsx:1740`), which renders correctly. No
broken import, no stale route, no null-state early return. The comment at `DeskRail.tsx:58-62`
confirms this was a *known, intentional* trade: "Catch's rail entry... leave WITH the rail — no
empty doors... no new UI needed for that gap" — the team knowingly removed the only in-context
"new page" door from framed surfaces and never added a replacement there. That gap is exactly
what Nick is hitting: there is no "New Page" entry point reachable from inside a writing surface
at all; a writer has to first navigate away to an unframed list screen (Drawers/Shelf/Journal
board/Project home) to find Catch again.

### Existing branch coverage
**None.** `big-projects-1a` (latest commit `5957492e`, Oct 19, unmerged) touches `DeskRail.tsx`
but only reworks the Shelf/Journal item roster — its Catch button is byte-identical to main's
(`git show big-projects-1a:.../DeskRail.tsx`). No other branch has touched `DeskRail.tsx` in the
last 30 days.

### Proposed owner
**TOOLS.** DeskRail / `DeskFrame` mount signaling / route-level chrome visibility — navigation
chrome, not editor internals. The underlying `unbornHref`/`useCatch`/routing plumbing is fine; the
open question is a TOOLS-side design decision: does a framed `DeskFrame` surface need its own
"new page" door in its own chrome, now that the legacy rail retires there?

---

## 3. Typewriter / Screenplay / templates half-work outside the "right" mode

Confirmed repro, matching Nick's own report exactly: **a new Arbor page opens with Typewriter
already on, which blocks Ctrl+B** — and it is not scoped to first-run; it reproduces on any
account, any time a brand-new page is opened.

### Repro on main
1. Any account. Theme Arbor (`plateau` — also the app's hard default, `theme.ts:27`).
2. Open a genuinely new, never-before-opened page in **Draft** (e.g. a new chapter/manuscript
   page inside a project) **or** a new empty **Screenplay** page.
3. On mount, since the page is empty, a per-page typewriter seed fires, reads Arbor's default
   (ON), and writes it into the single **global** `typewriter` setting.
4. Switch to (or open) any **other** Draft page in the same session and press **Ctrl+B**. Bold is
   blocked — even though nothing on *that* page ever asked for Typewriter.

### Cause in source
**The force-on default**, per-page and theme-seeded —
`apps/desktop/src/store/writingSettings.ts:195-199`:
```ts
export function enterPageTypewriter(id: string, empty: boolean): void {
  const saved = readPageTypewriter(id);
  const on = saved ?? (empty ? THEME_CONFIG[getTheme()].typewriterDefault : false);
  setWritingSettings({ typewriter: on });   // writes the GLOBAL, shared value
  if (saved == null) writePageTypewriter(id, on);
}
```
`THEME_CONFIG` (`store/theme.ts:22-24`): `plateau: { typewriterDefault: true }`,
`flux: { typewriterDefault: false }`. Called unconditionally for any empty, never-opened page
from **both** `PageEditor.tsx:489` (Draft) and `ScriptEditor.tsx:532` (Screenplay) — Draft and
Screenplay both seed the same global flag. Account first-run forces it too:
`Arrival.tsx:96-97` / `LandingGate.tsx:96-97` both call `setWritingSettings({ typewriter: true })`
unconditionally on a brand-new account.

**The Ctrl+B block** reads that same global field with no idea who last wrote it —
`ModeStage.tsx:188`: `const typewriterOn = (mode === 'journal' || mode === 'drafting') && settings.typewriter;`,
and the actual key gate, `PageEditor.tsx:1143-1146`:
```ts
const applyRailFormat = (action: FormatAction) => {
  if (mode !== 'drafting') return;
  if (getWritingSettings().typewriter) return;   // blocks Ctrl/Cmd+B/I/U
  applyFormatAt(action);
};
```

**The mismatch:** `typewriter` is documented as "the ONE global, persisted, live value every
consumer reads" (`writingSettings.ts:161`), but it is *written* by three independent,
uncoordinated call sites (Arrival, LandingGate, Draft's own mount, Screenplay's own mount) and
*read* by Draft's Ctrl+B gate with zero knowledge of which surface last wrote it. Opening a new
empty Screenplay page on Arbor silently flips the global flag ON, then blocks Bold on the next
Draft page touched — even though Screenplay's own fade engine doesn't run the typewriter at all
(`ScriptEditor.tsx:500-505`: "the screenplay surface does not run the typewriter at all...
pending Nick's own revision"). `Sliver.tsx:362-391` shows the typewriter *toggle* was re-exposed
on Screenplay later (ITEM 83 M8/R12) while the engine hookup was deferred — the exact half-wired
state behind "Screenplay half-works."

### Existing branch coverage
Branch `item171-typewriter-scope` (last commit 2026-09-22) attacked this same class of bug: it
splits the single `typewriter` field into `typewriter` (Free Write) and `typewriterDraft` (Draft,
default OFF), via `typewriterValueFor(isDraft)` / `setTypewriterFor(isDraft, on)`, and threads an
explicit `typewriterAvailable` prop. **It does not fix current main** — main's per-page/theme-seed
mechanism (`enterPageTypewriter`, `THEME_CONFIG`) landed `5bbe6f47` (2026-10-13), three weeks
*after* this branch's last commit, on a different architecture (one shared global + per-page
localStorage memory, not two separate stored fields). `git merge-base --is-ancestor
item171-typewriter-scope main` confirms it is not merged. It is prior art worth rebuilding
against, not a drop-in fix.

### Proposed owner
**FIX.** This is a regression in already-shipped mechanics — Phase 1 S5's per-page seed
reintroduced a bug `item171-typewriter-scope` had already diagnosed and partly solved — not new
product design. `item171-typewriter-scope`'s `typewriterValueFor`/`setTypewriterFor` split is the
relevant prior art.

---

## 4. INK's Outline bold-run Enter gap

### Repro on main
1. Open Draft, set the page template to **Outline** (`entry.pageSettings.template === 'outline'`).
2. Bold a stretch of text in a row (Ctrl/Cmd+B) — a live bold run, tracked as hidden markdown
   markers by `store/hiddenMarks.ts`, invisible on screen.
3. Place the caret *inside* that bold run (not at its very end) and press Enter (no Shift,
   Typewriter off).
4. **Expected** (matches plain-paragraph Enter everywhere else in the app): the run closes before
   the break and reopens after it — both halves render correctly bolded.
5. **Actual:** the row is split by a raw string splice with no run-awareness. The hidden
   open/close markers never get re-paired around the new `\n` — the bold boundary is lost/garbled
   on both halves.

### Cause in source
Normal Enter goes through the mark-aware controller: `ForwardOnlyEditor.tsx:453` →
`marks.enter(e)` → `attachHiddenMarkEditing`'s `enter()` (`hiddenMarksEditing.ts:42`) →
`enterAtCore` (`hiddenMarks.ts:410-431`), which explicitly computes each run's closing marks
(`cs`) and reopening marks (`os`) and inserts `cs + '\n' + os` at the split point — the documented
"a run the caret is inside closes before the newline and opens again after it" behavior
(`hiddenMarks.ts:408`).

Outline's Enter never reaches that code. `ForwardOnlyEditor.tsx:449-453`:
```ts
if (onLensKeyRef.current?.(e)) { e.stopImmediatePropagation(); return; }
...
marks.enter(e);
```
`onLensKeyRef` is `applyLensKey` (`PageEditor.tsx:1114-1142`). For an Outline row, plain Enter is
intercepted there with a naive splice (`PageEditor.tsx:1126-1132`):
```ts
const prefix = outlineNextRowPrefix(cur, start);
const caret = start + 1 + prefix.length;
result = { text: cur.slice(0, start) + '\n' + prefix + cur.slice(end), start: caret, end: caret };
```
This returns `true`, `stopImmediatePropagation()` fires, and `marks.enter(e)` at line 453 is
**never called** for that keystroke — `enterAtCore`'s mark-closing/reopening logic is completely
bypassed for Outline rows.

**This is a traded-off side effect of a real fix, not neglect.** Commit `8e80d606` ("ledger 92 -
Enter in an Outline was done twice... the lens door now runs FIRST in onKeyDownDraft, once"),
2026-10-17, is what put `onLensKeyRef` ahead of `marks.enter` with
`stopImmediatePropagation`. Before that fix, Outline Enter ran *twice* (lens, then
`marks.enter`), producing a blank line and no indent on the next row. The ordering fix solved
that, but as a side effect the lens path now fully owns the keystroke whenever it handles
Tab/Enter, and never falls through to the marks-aware splice. This bug is a known trade-off
surface of that same commit, not something introduced separately later.

### Existing branch coverage
No branch name or in-repo comment references this specific bold-across-Enter issue. The build
delta (`docs/plans/page-templates-build-delta.md:18`) lists an X7 rows-shadow instrument that
checks row-consistency across "Tab / Shift+Tab / Enter / typing / undo" for Outline, but it is
marked "Written, unrun," and nothing in it mentions marks/bold specifically — an untested gap,
not a tracked, in-progress fix.

### Proposed owner
**INK.** `docs/plans/page-templates-build-delta.md:3` states "**Branch:** `page-templates` …
**Author:** INK" — INK is this codebase's lane for the Outline template feature.

---

## Summary table

| # | Item | Cause | Branch fixes it? | Owner |
|---|------|-------|-------------------|-------|
| 1 | Sprout + pre-filled phrases persist past the first page | `beginningsVisible` and `useFirstLineInvite`'s pref were never scoped to "first page ever" — a deliberate Oct 8 ruling, not a stale leftover | No | TOOLS |
| 2 | New Page unreachable from inside a writing surface | `DeskRail` fully unmounts whenever any `DeskFrame` is mounted (default window width always triggers this); Catch's door left with the rail, no replacement added | No | TOOLS |
| 3 | New page opens with Typewriter forced on, blocking Ctrl+B | A single global `typewriter` flag is written by 4 uncoordinated call sites (Arrival/LandingGate/Draft-mount/Screenplay-mount) and read with no idea which surface last wrote it | Stale prior art only (`item171-typewriter-scope`, superseded by main's later architecture) | FIX |
| 4 | Enter inside a bold Outline run drops the marks | Outline's own Enter handler (`applyLensKey`) stops propagation before `marks.enter`'s run-aware splice ever runs — a side effect of fixing a worse double-Enter bug | No | INK |
