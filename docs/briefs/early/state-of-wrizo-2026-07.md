# State of Wrizo — Comprehensive Review (July 2026)

**Scope:** Everything on `m1-creative-flow` as of July 1, 2026, reviewed against the grand
vision: a comprehensive writing aid for people who are easily distracted and struggle to
follow through — novels, screenplays, essays, reports, workshopping, gated AI tutoring.

**Method:** Code-verified, not report-verified. The chat lead read the working tree
(App.tsx, Desk, resume.ts, persistence.ts, PageEditor, JournalEntry, CreateProject,
server sync.ts, backlog, AGENTS.md, north-star.md) before any committee convened.
All three committees ran the double-pass protocol: propose → critique and trim →
single recommendation.

---

## The Verdict

Wrizo has built the second half of flow and not the first half.

Flow has two problems: **getting in** and **staying in**. Everything shipped since the
mode-aware editor attacks *staying in* — and it genuinely works: the chrome dissolve,
the forward-only runway, mode-aware typewriter, idle nudges, the glow, pagination
rewards. That machinery is real, tested, and philosophically coherent. It is the part
Silicon Valley never built because they never watched a writer fight their own editor.

*Getting in* is where the app currently loses the ADHD writer — and Nick's felt
diagnosis is confirmed in code, not just vibes. The path from app-open to ink demands
navigation decisions, a naming decision, and — in the most common book-writing case —
lands in the **wrong editor**. The app's own thesis says divergence is free and
convergence is the product. The front door currently charges for divergence (choose,
name, file, navigate) before a single word exists. The build plan below fixes exactly
this, in one focused arc, before anything else is added.

---

## Part I — What's Working (code-verified)

### The writing mechanic
The forward-only system is the app's soul and it is sound. The escalating strike ladder
(char → char → rest-of-word → previous-word → rest-of-sentence → lock + nudge) lives in
`forwardOnly.ts`; the clean-save invariant (`derivedText` excludes struck runs at every
granularity) held through every subsequent ticket. Struck text stays visible in Free
write, vanishes on the switch to Draft, and never touches storage. This is the deletion
runway as designed — not backspace suppression, a momentum grammar.

### The stay-in-flow machinery
`useChromeDissolve` is one engine reused across every surface (sprint, PageEditor,
JournalEntry as of the chrome-recede fix): navigation layer dissolves on keystroke,
incentive layer (glow, progress, slim timer) persists, explicit summon returns chrome
fast, casual pointer movement does not. Typewriter is correctly mode-aware (on in
generation, off in revision). Idle nudges escalate 3→2→1 min with the canonical
25-prompt pool. B5's page-height pagination with the paper-feed flip and rustle gives
the session a physical rhythm. Together these are a genuine, shipped answer to "the app
must not be the distraction."

### The architecture underneath
The plumbing discipline is unusually high for a solo project. Local-first persistence
with a debounced flush, `flushNow` on tab-hide, a dirty registry, LWW sync, and
boot-idempotent DDL that self-applies on `railway up`. **Server sync completeness
passes:** all six collections (projects, storyPlans, sessions, drafts, journalEntries,
drawers) appear in both the push handler and the pull response with mirrored
`rowTo*`/`upsert*` functions — the silent-failure class the checklist exists for has no
current instance. The one-home invariant for pages (Journal / Shelf / Binder, enforced
in a single `setPageHome` mover) is clean. The two-editor split remains load-bearing
and correctly scoped: ink-capable `/journal/:id` vs mode-aware `/page/:id`, with the
capture-phase pen interception protecting stylus ink from OS handwriting.

### The identity, structurally present before the features
The AI frame ships sealed-in-generation before any model is wired — the anti-slop
boundary is architecture, not a promise. The 50-word gate with pre-auth content
survival makes the commitment filter real. Session instrumentation already exists
(`SessionLog` with `firstKeystrokeAt`, synced) — the measurement substrate for the
flow-pipeline goal is half-built and nobody noticed.

### The process
One brief per ticket, in-harness verification per slice, CDP-composed IME tests, live
round-trips after schema changes, hardware gates on feel work. This cadence is why the
codebase reads coherent nine arcs in.

---

## Part II — What Isn't Working (the diagnosis, with receipts)

### Finding 1 — The resume system doesn't know where books are written. (BUG, live)
This is the sharpest confirmation of Nick's complaint, and it's mechanical:

- `resume.ts / getResumeTarget()` reads only `Project.sprintText` and story plans. It
  has no concept of binder Pages — the B1 architecture where books actually live.
- `PageEditor` autosaves `entry.text` only. It never bumps the parent project's
  `lastActivityAt` and never logs a `SessionLog`. Writing a chapter leaves the
  project's resume pointer frozen at binder-creation time.
- The Desk's "Keep writing" compares that stale project timestamp against
  `getJournalEntries()` — which includes **filed chapter pages** — so after any chapter
  session the chapter wins the recency race and the route resolves to
  `/journal/:id`: the ink-authored journal surface, **not** the mode-aware PageEditor.
  Verified: `JournalEntry.tsx` contains no redirect for typed pages (zero matches for
  `/page/` in the file).

Net effect: the app's single most important button, on the app's flagship path
(writing a book), resumes the writer into the wrong editor — one with no mode strip,
no Pages/Plan toggle, different undo semantics, and an ink layer PageEditor doesn't
render. Beyond the UX whiplash, this is a **data hazard**: the same record is editable
under two divergent surfaces, and a chapter can acquire strokes its canonical editor
will never show.

### Finding 2 — Re-entry context is computed and then thrown away.
`getResumeTarget()` produces `lastLine` — the writer's actual final sentence — and
`daysAgo`. The Desk displays neither. For an ADHD writer, "where was I?" is the
single largest re-initiation cost — reconstructing context is the working-memory toll
that kills the session before it starts. The data layer already pays for the answer;
the surface discards it.

### Finding 3 — The front door charges for convergence before divergence.
`CreateProject` hard-blocks on an empty title (`if (!title.trim()) return`) even though
`createBinder` already defaults to "Untitled." A writer with an urge but no name hits a
naming wall before word one. Meanwhile "New page" on the Desk routes through the
legacy scratch-draft `/sprint` path (`clearDraft('scratch')`), while authored journal
pages, shelf pages, and binder pages are all `JournalEntry` records — two capture
models for the same instinct, and the fastest one is a secondary link. There is no
single, zero-decision, always-available "just write" action. For the app whose thesis
is *divergence is free*, capture is the one gesture that must cost nothing.

### Finding 4 — The primary path can't be measured yet.
`SessionLog.firstKeystrokeAt` exists and syncs — but only QuickSprint writes sessions.
The PageEditor (where books happen) and authored journal pages log nothing. We cannot
currently answer "how long from open to ink?" on the path that matters, which means
the funnel Nick wants optimized is invisible to us.

### Finding 5 — The rhizome substrate is attached to the deprecated path.
Fragments (runs, roles, spine order, links — the substrate the whole Two Minds vision
stands on) live only on `Project.sprintText` legacy bodies. Pages — where all new
books live since B1 — are flat text. This is the logged body-vs-page debt, but the
review elevates it: every future differentiator (Middle Door emergence tools, the AI
tutor operating on fragments, connection nodes, Workshop) assumes the substrate is
under the text people actually write. Today it isn't. Not urgent; strategically
load-bearing. It must land before any AI feature is wired.

### Finding 6 — The strategy docs have fallen behind the product.
`docs/north-star.md` is v0.1: pre-Wrizo naming, an M1 defined as "Session Launcher →
Structure Wizard → Beat Wizard → Structure Board" — a flow whose launcher was deleted
months ago. `AGENTS.md` carries the same stale Stage-1 goal. Cheap to fix, but stale
canon quietly steers both committees and CC. (Resolved during review: the HOME-redesign
handoff once expected at `docs/handoff-home-redesign.md` was a June 25 chat-carryover
artifact, superseded three days later by the ratified v3 `home-port-brief.md` — which
IS on disk — and the flow it specified shipped as HomeFlow + the Desk. Nothing is
missing; see the re-scoped HOME item in Part IV.)

### What is deliberately NOT broken
Large-screen spatial layouts, Format/screenplay conventions, Workshop/social, themes,
and real AI wiring are all deferred — and the committees re-affirm every one of those
deferrals. "Build now vs. feel first" is working. Nothing below reverses it.

---

## Part III — Committee Passes (double-pass, distilled)

### The Experts — why the funnel is the whole ballgame
The cognitive scientist framed the decisive point: for ADHD, **task initiation — not
sustained attention — is the bottleneck.** Once engaged, hyperfocus is an asset the
dissolve engine already protects. The failure happens in the first ninety seconds:
every decision between intention and ink (navigate, choose, name, orient) is an
off-ramp, and reconstructing "where was I" is a working-memory tax most sessions never
pay. Therefore: externalize re-entry context (show the last line), collapse decisions
to zero on the capture path, and measure time-to-first-keystroke as the north-star.
The Deleuzean seconded with the thesis test: capture must be stemless — filing is a
later, low-stakes territorialization (the Shelf already exists for exactly this) — and
flagged Finding 5 as philosophical debt, not merely technical. The motivation
psychologist drew the boundary line: friction-as-commitment belongs at the membrane
(the 50-word gate: keep it), never inside the daily loop; and no streak mechanics,
ever — the calm "3 days ago" register already in `relativeDays` is the correct voice.
The pantser called the zero-decision capture "the entire app, for me." The plotter
confirmed the Plan stays one hop from the page (the toggle) — satisfied. The pedagogue
asked for one addition: an opt-in first-line invitation on an empty page, drawn from
the existing nudge pool — scaffolding against the blank page, in the permission-giving
register, never auto-inserted text. Critique pass trimmed one proposal: a "daily
ritual" prompt sequence was cut as ceremony that becomes its own friction.

### The Architects — the arc is small, and that's the point
Frontend: Finding 1 is a contained repair — bump `lastActivityAt` (+ a new optional
`lastActivePageId`) from PageEditor's flush; teach `resume.ts` about pages; route by
`pageType`; add a defensive redirect in JournalEntry for typed pages. Systems: **no new
collections** — activity rides Project, sessions ride the existing `sessions_log`; the
only schema touch is one boot-idempotent `add column if not exists last_active_page_id`
mirrored through `rowToProject`/`upsertProjects` per the sync checklist. Interaction:
the warm start must not add a second primary to the Desk — the return card *becomes*
the primary (B4's one-action principle holds); the "pick up here" emphasis reuses the
dissolve grammar and honors reduced-motion. Visual: the quoted last line renders in
Crimson Pro (the writing voice), chrome in Figtree, orange only on the action.
Critique pass killed one idea: opening the app directly into the last page (bypassing
the Desk) — rejected as presumptuous on a shared/tablet device and needless once the
return card makes the Desk a one-tap springboard. Hardware gate applies to the F2 feel
work; F1/F4/F5 are harness-verifiable.

### Marketing — opposition run, resolved to one move
Growth argued for shipping to a first handful of ADHD writers within two arcs and
instrumenting activation; Brand pushed back hard on the self-description in this very
review — "Word + OneNote + Final Draft in one" is internal ambition, and as positioning
it is suicide by comparison: it invites feature-checklist evaluation against three
incumbents and buries the actual wedge. The wedge is one sentence: **the writing app
that gets you writing and can't be fidgeted with.** The Narrative strategist holds two
assets ready: the logo-drawn-in-one-pass founding story, and — once F2 ships — "the
app opens to your last sentence," which is a demo, a tweet, and the product promise in
one screen. TTFK as a *public* number ("median N seconds from open to writing") is a
claim no incumbent can copy without rebuilding themselves. The Skeptical user advocate
set two tripwires: any warm-start copy that shades into guilt fails; any dashboard
that makes writing feel like homework fails. Opposition resolved: **single-player
daily loop to excellence before social, before AI, before formats. Position against
distraction, not against other apps.** Screenplay stays deferred hard — Final Draft
pagination parity is a tar pit with a small overlap audience; revisit post-traction.

---

## Part IV — The Build Plan

### The F-arc — "From open to flow" (next, in order)
The arc that makes the pipeline match the thesis. Small tickets, one brief each.

- **F1 — Resume repair (plumbing, fixes the live bug).** The resume pointer becomes
  TYPED: `getResumeTarget()` returns the most-recent writing surface across binder
  pages, loose journal, shelf, and legacy bodies, carrying `kind` + `pageType` + home
  so surfaces render from the writer's own trail, never a persona. Saving a binder
  page stamps the parent project (`lastActivityAt`/`lastActivityType:'page'`/
  `lastActivePageId`); the Desk routes typed pages to `/page/:id`; `JournalEntry`
  gains a defensive redirect for `pageType` entries (legacy untyped filed pages keep
  their ink view). One idempotent column on `projects`, mirrored through server sync
  per the checklist. Harness-verifiable end to end. Brief: f1-resume-repair-brief.md.
- **F2 — The warm start (the mirror card).** "Keep writing" becomes a return card that
  MIRRORS the typed pointer — any kind, any pageType, any home: crumb + form tag in
  the project's own vocabulary, the writer's actual last line in Crimson Pro, calm
  relative time; support pages carry a quiet structural "…or back to the manuscript"
  link (a fact of the binder, never a guess about the writer). Resume lands **in the
  page** — deep resume is trustworthy after F1 and the breadcrumb orients — caret at
  end, reduced-motion-safe warm emphasis on the final passage releasing on the first
  keystroke. Feel source: wrizo-f-arc-design-a2.html (port to apps/desktop/scratch/
  with this ticket's brief). Tablet gate before deploy: this is feel work.
- **F3 — Catch: the zero-decision capture.** One always-available action (rail + Desk
  + a keyboard shortcut) that opens a fresh journal page instantly — no title, no
  kind, no filing. Consolidate the Desk's "New page" off the legacy scratch-draft path
  onto `createJournalPage` so capture has one model; `/sprint` remains for project
  sprints only. Filing stays a later gesture via the Shelf — which was built for
  precisely this and is now the second half of a complete divergence→convergence loop.
- **F4 — Title-later create.** Remove the empty-title block; "Untitled" is a valid
  birth name, renameable from the breadcrumb/ProjectHome. Optionally reorder the
  create flow to kind → first words → name it after. Smallest ticket in the arc.
- **F5 — TTFK instrumentation.** Define time-to-first-keystroke (surface mount → first
  content keystroke; plus Desk-mount → first keystroke anywhere for the funnel view)
  and log `SessionLog` from PageEditor and authored journal pages using the existing
  table and `firstKeystrokeAt` field. No dashboard yet — Railway SQL is enough to
  start answering the question. This is the arc's proof of work.
- **F6 (opt-in, small) — First-line invitation.** On a truly empty page, one quiet
  prompt from the canonical pool in the permission-giving register; dismissed by the
  first keystroke; never inserts text. The anti-blank-page scaffold, gated behind a
  setting so it can never become noise.

### After the F-arc (re-sequenced queue)
1. **HOME verification + polish** — re-scoped: the hero → gate → account → launchpad
   flow already shipped (`HomeFlow` is the anon branch in App.tsx; the Desk is the
   launchpad; `home-port-brief.md` is the ratified spec on disk). Remaining: confirm
   production serves HomeFlow logged-out (the backlog's "NOT deployed" note predates
   several `railway up` runs), the tablet pass if still owed, and the deferred polish
   (hand-drawn bighead art swaps; passwordless/email-first auth stays backlog). The
   F-arc still leads: the returning-user funnel before the new-user funnel, because
   dogfooding is the primary signal and the daily loop is the product's core claim.
2. **Anti-slop paste rail** — external paste blocked into inputs, own-work copy-out
   preserved, import-external-draft as the designed exception. Brand-critical; the
   structural identity should exist before the first outside writers arrive.
3. **Body-vs-page unification / fragments under Pages** (Finding 5) — scheduled with a
   committee design pass of its own, and explicitly **before any AI wiring**, so the
   tutor's first substrate is the rhizome, not flat text.
4. **Ops, in parallel (non-engineering):** wrizo.app Cloudflare resolution; formal
   USPTO search on "Wrizo"; refresh `north-star.md` to v0.2 and the AGENTS.md Stage
   goal so canon matches the product (one-evening task, prevents committee drift).

### Still deferred, re-affirmed
Large-screen spatial/dual-pane (needs a real book to design against — the F-arc will
help produce one); Format conventions + screenplay; Workshop/social + the reciprocity
gate (after the single-player loop is excellent); themes and milestone-gated
customization; real AI provider wiring (after item 3 above).

---

## Part V — The Measure of Success

One number: **TTFK — time to first keystroke.** The app's promise, made falsifiable.
Secondary: share of sessions reaching 200+ words (a flow proxy the existing SessionLog
already supports). When the F-arc lands, a session should look like: open → one tap on
your own last sentence → writing, with the app dissolving around you. Everything in
the grand vision — formats, Workshop, the AI tutor — earns its place only if it never
makes that number worse.
