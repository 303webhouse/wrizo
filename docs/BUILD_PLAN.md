# Wrizo — Build Plan: Creative Writing Mode

**Scope:** Creative writing mode first. Academic and professional modes come *after* the basic architecture, aesthetics, and flow are solidified — they reuse this substrate, they do not precede it.
**Inherits:** `PHILOSOPHY.md` as law. Every phase below cites the principles it implements.
**Audience:** the CC agent (one ticket per session) and the future UX/build team.

---

## The Technical/Design Committee

- **Tomas** — Data model & backend (Express, fragment schema, local-first/sync, the `sprintText` decision)
- **Vera** — Frontend architect (React/Vite/Electron, client state, forward-only at the data layer, the Rope's context-preservation)
- **Iris** — UX / interaction design, neurodivergent (both poles: ADHD and structure-first; no-failure-states, gesture design, edges-not-middle, discoverability under chrome-fade)
- **Kenji** — Motion & visual systems (flux aesthetics, chrome-fade, orange connection-events, the four themes-as-states)
- **Priya** — AI/LLM integration (tutor-not-ghostwriter pipeline, mirror-not-muse, demonstrate-in-text, latency tiers, quieting scaffolds)

---

## THE KEYSTONE DECISION — Fragments as First-Class Objects

`sprintText` as a single string **must die.** Rhizomatic entry, branching, the Rope, Gather mode, and Quiet Bridges all require fragments as first-class objects, not one opaque string. The philosophy forced this: *if convergence is the product, the fragment is the unit.*

**Decision of record: migrate now (Phase 0), behind a compatibility shim.** This is the cheapest it will ever be — the Journal mechanics are built but the tangent/gather/AI features are not, so nothing is yet stacked on the string. The cost of *not* migrating compounds with every feature built on top.

### Conceptual schema (Tomas — validate in implementation, do not treat as final SQL)

```
Fragment {
  id
  pieceId                       // the document/sprint this belongs to
  content: Run[]                // ordered runs; each Run = { text, struck: boolean }
  role: 'spine' | 'branch' | 'loose'
  spineOrder?: float            // sparse/float index for cheap reorder (spine only)
  parentId?                     // the spine fragment this branches from (branch only)
  parentFragmentId?             // nullable; enables theme->principle->point nesting (Trellis). v0.1 uses one level only
  links: Link[]                 // magnetized/bridge connections — the rhizome's side-edges
  clusterId?                    // emergent grouping in Gather mode; label-capable (a cluster can act as a theme container)
  createdAt
  heat                          // derived: recency + edit-density; powers Tier-0 resurfacing
}

Link { targetId, kind: 'bridge' | 'magnetized', strength }

Piece = ordered spine (from spineOrder) + branch set + loose set + link graph
```

**This is literally a rhizome: a graph with one privileged path (the spine).** The philosophy and the data structure converge.

### Forward-only, restated at the data layer

Permitted operations: `appendRun`, `toggleStruck`, `createFragment`, `reorderSpine`, `link`, `setRole`.
**Absent by design:** `deleteRun`, `deleteFragment`, `editRunText`.
**Critical distinction:** forward-only means **no-erasure**, *not* no-reordering. Reorder (Gather) and strikethrough (struck-but-visible) both preserve the no-erasure law while enabling structure. This is the unlock that makes convergence compatible with forward-only — *you converge by arranging, not by deleting.*

### Migration (cheap, reversible)

Each existing `sprintText` → split on `\n\n` into Fragments (`role: 'spine'`, `spineOrder` by index, `content: [{ text, struck: false }]`). Concatenating a spine's unstruck runs reproduces the original. Ship behind a shim that reads old strings and writes new fragments so nothing breaks on rollout.

### Cross-cutting win (Tomas + Vera)

Discrete fragments are *better* for sync than one string: smaller diff units, per-fragment conflict resolution (LWW or CRDT) instead of whole-document merge hell. The keystone decision **also de-risks the café-wifi sync requirement.** Offline writes queue per-fragment; drops are silent; background retry. The string model would have forced whole-doc merges. We get local-first durability as a side effect of getting the philosophy right.

---

## THE LATENCY-TIER MODEL — the invisibility guarantee for AI (Priya)

The killer risk: AI "demonstrating in the writer's own text" = an LLM call = latency = a broken flow state if it ever blocks. We quarantine latency by tier. **Nothing in the writing flow ever blocks on Tier 1 or Tier 2.**

- **Tier 0 — instant, local, NO LLM.** The Mirror, fragment resurfacing, heat-ranked nudges. This is *retrieval and arrangement of the writer's own material* — fast, private, offline-capable. **Most of the "AI magic" is not AI.** This is the primary intelligent surface and it never touches the network.
- **Tier 1 — async, background, ignorable.** Quiet Bridges / fragment affinities (embeddings, computed in the background). The faint thread appears when ready; if it's never ready (offline), nothing breaks because it was always ignorable.
- **Tier 2 — on-request, at the edges only.** Demonstrate-in-text transformations (e.g. register-shift on the writer's own sentence). Genuinely LLM, genuinely latency-bound — so it lives *post-sprint / on demand*, never mid-flow. The latency-bound AI is structurally confined to the moments where latency doesn't hurt.

---
## PASS 2 — Resolved Conflicts (decisions of record)

The five real disagreements and how they resolve. These are binding.

1. **Fragment granularity vs. show-don't-tell (Tomas ↔ Iris).** Forcing the writer to *think in fragments* is visible structure — it violates show-don't-tell. **Resolution:** fragments are invisible substrate during generation. The writer experiences continuous text; the app fragments behind the surface (on pause / paragraph / topic-shift heuristics). Fragments become tangible objects *only* in Gather mode (Phase 3), which is an edge-activity, never mid-flow. **Fragment-visibility is mode-dependent: invisible while writing, tangible while gathering.**

2. **Chrome-fade aggressiveness vs. ADHD anchoring (Kenji ↔ Iris).** Aggressive fade serves the flux aesthetic but harms users who need persistent visual anchors (object-permanence / working-memory load). **Resolution:** fade affects *chrome* (controls, panels, metadata) — **never the writer's words or the spine anchor.** Words stay fixed and warm; only scaffolding breathes. Fade is gentle and instantly recoverable on intent (cursor move, pause, gesture-start). Tunable per theme (Plateau = minimal fade; Flux = more).

3. **AI proactivity vs. no-interruption (Priya ↔ Iris).** Proactive surfacing is helpful but risks interruption = visibility = flow-break. **Resolution:** proactive surfacing appears only in the *peripheral field* (the Live Wires edge, dimmed) — never in the focal path, never as a popup. **Ambient availability, never active intrusion.** The writer's eye finds it if it drifts; it never grabs.

4. **Does AI convergence (Phase 4) precede manual convergence (Phase 3)? (Priya ↔ Tomas/Vera).** Priya: bridges *are* the convergence engine, merge them. Pushback: convergence must work *without* AI first — for local-first durability, and because of the pharmakon (if AI converges from day one, the writer never builds the muscle, defeating graduation). **Resolution:** Phase 3 convergence is manual + Tier-0 retrieval (no LLM). Phase 4 AI *augments* it. The muscle-building order is load-bearing per Principle 6.

5. **Migration risk (Vera/Tomas, unanimous).** Changing the data model mid-project risks the built Journal. **Resolution: do it now anyway.** It is the cheapest it will ever be; the cost compounds with every feature. Ship behind a compatibility shim.

---

## Dual-Path Sequencing (structure-first caveat)

**KEY INSIGHT:** The structure-first path is the convergence engine (Phase 3) used as an **entry** instead of an **exit**. Gather mode (fragments → labeled clusters) is the systematizer's primary surface, run proactively. So the Trellis comes online when Phase 3 does, at near-zero extra cost. **The full structure-first path is v0.2.**

**v0.1 cost of the dual-path = TWO nullable schema additions only (done in DM1):**
- `parentFragmentId` (nullable) — enables theme → principle → point nesting later; v0.1 uses one level only.
- `clusterId` is theme-capable — a cluster may carry a label and act as a container.

Both nullable, both forward-compat, neither blocks the emergence-first path. **DO NOT build the Trellis UI in v0.1.**

See `PHILOSOPHY.md` → "The Two Minds (Dual-Path)" for the governing principle: both completion deficits (the emergence-first fragment-pile and the structure-first never-finished-outline) are the same problem from opposite ends, and Wrizo supplies the resisted move. Orange connection-events apply identically to theme/point links in the Trellis.

---
## THE PHASES

Sequencing is principled: **substrate → surface → divergence → convergence → AI → atmosphere.** Each phase ships something *usable on its own*; nothing depends on a later phase. (This ordering also gives the builder a shipped, felt result every phase — momentum for the builder's own ADHD, which matters.)

Ticket prefixes are proposed — reconcile with the existing J/B/W scheme on merge. **B3/B4/W5 are absorbed into Phase 5 (AT).**

---

### Phase 0 — The Fragment Substrate `DM` *(keystone — unblocks everything)*
**Goal:** Fragments as first-class objects; forward-only at the data layer; local-first-ready. **Implements:** P1, P2, P3, invariants (local-first).
**Owners:** Tomas (lead), Vera.

- **DM1 — Fragment schema & store.** Implement the Fragment model and Piece composition (spine + branch + loose + link graph), including nullable `parentFragmentId` (one-level use in v0.1) and label-capable `clusterId` for forward-compat with the Trellis. *Accept:* a Piece round-trips through the store with spine order, branches, loose fragments, and links intact; schema carries the two nullable dual-path fields without affecting the emergence-first path.
- **DM2 — Forward-only operation set.** Expose only `appendRun / toggleStruck / createFragment / reorderSpine / link / setRole`. *Accept:* no code path can delete or edit-in-place a run or fragment; reorder and strike are the only "change" operations.
- **DM3 — Migration shim.** Read legacy `sprintText`; write fragments split on `\n\n`. *Accept:* every existing sprint loads as fragments; concatenating unstruck spine runs reproduces the original; rollback is safe.
- **DM4 — Per-fragment sync + offline queue.** Local-first persistence; queue writes offline; silent background retry. *Accept:* writing continues with the network killed; on reconnect, fragments sync without a whole-doc merge and without any user-facing prompt.

---

### Phase 1 — Core Writing Surface `CW` *(the daily-driver felt experience)*
**Goal:** The invisible, blocker-free writing surface. **Implements:** P2, P5, P8, the rebuilt #4 (forward-only as the critic-silencer), the clutter fix.
**Owners:** Iris, Vera, Kenji.

- **CW1 — The Middle Door.** Entry drops into a fragment field with heat, not a blank top-of-document. *Accept:* a new creative session never presents an empty linear page; the writer can begin in any fragment.
- **CW2 — Forward-only writing UI.** *Forward-only input — the deletion runway (keyboard).* Characters land in an active-word buffer; space/newline commits it as a Run (append). Backspace is a four-step runway, not a delete: (1) remove one char from the uncommitted buffer (the only true erasure); (2) strike the current word — commits as a struck Run (letter restored, reads whole), stays visible, drops from derived prose; (3) strike the previous Run (`toggleStruck`); (4) no-op; after three consecutive no-ops, the keep-writing nudge. Any forward key resets the counter. Struck Runs stay in content, filtered from `derivedText`/word count. No delete-Run, no edit-in-place. External paste blocked at the surface. **Two layers, one surface:** text layer (keyboard → Runs, forward-only) and ink layer (stylus → Strokes, overlay) are independent. Strokes render above and never touch Runs; `Run.struck` is keyboard-only — the pen must not call `toggleStruck`. Layer switch = local UI state. (Supersedes the earlier "extend ink-strike onto the fragment model" direction.) *Accept:* backspace walks the runway and never deletes committed text; struck words stay visible and leave the prose; the pen annotates without altering Runs.
- **CW3 — Chrome-fade.** Chrome recedes on active typing cadence; returns gently on pause/intent. Words and spine **never** fade. *Accept:* during sustained typing, controls drop below attention threshold; a cursor move or pause restores them instantly; the writer's text never changes contrast. *(Folds B3 into a function, not a decoration pass; primary fix for "cluttered / text-heavy.")*
- **CW4 — No-interruption law (architectural invariant).** A `WritingSession` context + interrupt broker that suppresses all modals/notifications during an active session and defers them to the edges. *Accept:* no component can render a blocking modal mid-session; sync errors surface as ambient, edge-located, non-blocking, never demanding mid-flow action.
- **CW5 — No-failure-states audit hook.** A standing check that no surface introduces streaks/scores/idle-callouts/red numbers. *Accept:* documented audit pass; CI/lint note so future tickets can't quietly add a counter.

---
### Phase 2 — Tangent System `TG` *(lines of flight, with the return the source omits)*
**Goal:** Make tangents safe by making return free. **Implements:** P3 (the missing mechanic), P2.
**Owners:** Vera, Iris.

- **TG1 — Branch gesture.** One motion pulls a tangent into a held side-thread (creates a `branch` fragment with `parentId`; forward-only native — you branch, you don't delete). *Accept:* branching never removes spine content; the branch is recoverable and linked to its origin.
- **TG2 — The Rope.** Frictionless return: preserved cursor + scroll + context; one action collapses focus back to the exact spine position, which stays warm and spatially present during the tangent. *Accept:* return costs one gesture/keystroke with zero re-orientation; the spine's last position is exactly restored. *(This is the mechanic the source philosophy is missing.)*
- **TG3 — Live Wires.** Loose fragments / tangents accumulate as a visible *peripheral* field (dimmed edge, never focal), later magnetizable into the spine. *Accept:* tangents persist and are browsable without leaving the writing surface; the field never grabs focus or interrupts.

---

### Phase 3 — Convergence Engine `CV` *(the differentiator — Wrizo's actual moat)*
**Goal:** Structure *emerges* from arranging what's already written; experienced as gathering, never outlining. Manual + Tier-0 retrieval, **no LLM.** **Implements:** P1, P2, the forward-only-as-no-erasure unlock. **Also opens the Trellis (structure-first door) — see Dual-Path Sequencing.**
**Owners:** Tomas (affinity/clustering), Iris (the arranging UX), Kenji (orange connection-events).

- **CV1 — Gather mode (edge-activity).** Fragments become tangible, draggable objects; arranging them drifts them toward thematic clusters; structure surfaces visually. Reorder ≠ erase, so this is forward-only-safe. *Accept:* the writer can assemble a spine from loose fragments by arrangement alone, with nothing deleted; fragments are tangible here and invisible during generation (per Pass-2 conflict #1).
- **CV2 — Heat-based clustering (Tier 0).** Local, no-LLM grouping/ordering signal from recency + edit-density to seed cluster suggestions. *Accept:* clustering runs offline, instantly, with no network call.
- **CV3 — Magnetized join + orange connection-event.** Dragging two fragments together links them (`magnetized`) and fires the orange connection animation. *Accept:* every join renders the orange signature; the link is stored; the join is non-destructive.

---

### Phase 4 — AI Scaffolding Layer `AI` *(tutor, tiered by latency, layered on a fully-working non-AI app)*
**Goal:** Amplify *this* writer, demonstrate in his own text, fade as he grows. **Implements:** all AI rules, P6, P7, the pharmakon.
**Owners:** Priya.

- **AI1 — The Mirror (Tier 0).** Resurface the writer's *own* strongest phrasings / orphaned fragments — local, instant, no LLM. Also powers CW1's heat-seeking nudge (a single sensory word, image, or own-fragment after ~30s inactivity — associative, never instructional). *Accept:* zero latency, zero network, works offline; surfaces only the writer's own material.
- **AI2 — Quiet Bridges (Tier 1).** Background fragment-affinity (embeddings) offers the lightest ignorable connective thread between fragments that breathe together; renders as the orange connection-event when accepted. *Accept:* never blocks; appears only in the peripheral field; ignoring it has zero cost; absence (offline) breaks nothing.
- **AI3 — Demonstrate-in-text (Tier 2, edges only).** On request, post-sprint: the writer's *own sentence* mirrored back in a shifted register/tone, offered, ignorable — never an abstract tip. *Accept:* lives at the edges only; never mid-flow; the output is a transformation of the writer's text, never new foreign prose.
- **AI4 — Voice-amplification guardrail.** Every AI surface is checked against regression-to-the-mean; the AI makes the writer *more himself*, never more correct. *Accept:* documented guardrail; any surface that smooths toward generic is rejected.
- **AI5 — Quieting scaffolds (graduation).** Bridge/rope/prompt frequency dials down as the writer demonstrates he can converge / return / self-edit alone. *Accept:* measurable reduction in scaffold frequency tied to demonstrated competence; the system is visibly designed to be needed less.
- **AI6 — Voice Wall / paste rail.** Block *foreign-voice import* (external prose pasted in); always permit the writer's own work in and finished work out. *Accept:* pasting external prose into a writing surface is blocked; copying the writer's own finished work out, and re-importing his own work, both succeed.

---
### Phase 5 — Assemblage, Atmosphere & Onboarding `AT` *(the "every screen" pass — correctly sequenced last; absorbs B3/B4/W5)*
**Goal:** The novelty-home, the becoming-onboarding, the systematic orange. **Implements:** P4, P5, the rebuilt #4, voice-as-irreducible.
**Owners:** Kenji, Iris.

- **AT1 — Four themes as *states*, not skins.** Plateau / Flux / Volant / Nomad, each a coordinated token set (color temp, motion intensity, ambient sound, chrome-fade aggressiveness, density) tied to a writing mood. Switching theme = re-rooming the assemblage = the swap-itch satisfied in-house. *Accept:* each theme changes the felt *state*, not just colors; orange invariant holds across all four.
- **AT2 — Locked orange invariant + contrast safety.** `#FF9800` is unremovable and unrecolorable across all themes and any user palette; guarantee contrast against arbitrary user backgrounds. *Accept:* no theme or user palette can remove or recolor orange; orange remains legible on every allowed background.
- **AT3 — Orange connection-event system (systematic).** Orange marks *every* connection-event — bridges, rope-returns, magnetized joins, live-wire fusions, Trellis theme/point links — as the consistent living signature of human linkage. *Accept:* every linkage across the app renders the same orange signature; orange appears *only* at connection-events, nowhere decorative. *(Absorbs B4; resolves the scarce-vs-systematic question → systematic.)*
- **AT4 — Ambient state-shift on stall.** Stalling changes the *room* (light, sound), never the writer's *status*. *Accept:* a stall adjusts the environment with zero status/judgment surface; the machine adjusts, the writer was never the problem.
- **AT5 — Onboarding reframe ("you're already writing").** Keep the ~50-word first-write gate as a commitment filter; reframe the language away from "Prove you're a human writer" (worthiness test) to *becoming-by-doing*. The entry persists as the first journal entry. *Accept:* no copy frames the gate as a test to pass; the artifact persists as proof-by-doing. *(GATE is its v0.1 implementation.)*
- **AT6 — Surprise-at-output reward.** The visceral audio-visual completion moment celebrates *what he made* ("I wrote that?") — sensory, intrinsic. *Accept:* the reward references the writer's output, never a score, metric, or streak.
- **AT7 — Responsive graceful degradation.** Laptop/tablet primary; phone supported as graceful-degradation secondary. *Accept:* core writing + Rope work on phone without becoming the design lead. *(Absorbs W5.)*

---

## THE MVP CUT — Wrizo Creative v0.1 *(read this if you read nothing else)*

The full plan above is a lot of new primitives. The honest risk: a momentum-driven solo build can turn the *plan itself* into a luminous pile of features with no shipped app — the exact failure mode the philosophy warns against. So cut ruthlessly to the smallest thing that is **usable, differentiated, and feels like Wrizo:**

> **v0.1 = `DM` (fragment substrate) + `CW1–CW4` (Middle Door, forward-only, chrome-fade, no-interruption) + `TG2` (the Rope) + the writing gate + homepage redesign.**

That is the minimum that (a) feels invisible, (b) removes blockers, (c) is unlike anything else, and (d) is shippable to the tablet to **test by felt experience** — the consistent winning pattern. Convergence engine, AI layer, the Trellis, and the rest of atmosphere are v0.2+. Ship v0.1 to hardware, write on it, tune from feel, *then* build convergence.

**v0.1 additions beyond the original cut (pulled forward at Nick's direction):**

- **GATE — Writing gate / first-write onboarding.** A blank page before account creation; write ~50 words, then make the account. Framed *"you're already writing,"* never "prove you're human." Forward-only from word one (teaches the core mechanic immediately). Sensory completion reward celebrating the writing (no counter, no score). Associative sensory nudge after ~30s idle, ignorable. The entry persists as the user's first journal entry post-signup. Account creation happens *after* the writing — the writing is the cost of entry. *Forward-only backspace: resolved — humane (the runway, per CW2): the in-progress uncommitted word can lose characters; once committed, words strike rather than delete. Decided, not open.*
- **HOME — Homepage redesign.** Tagline **"For humans writing"** (verb, not noun — the becoming alignment). Revised logo (Draft 2 treatment: warm near-black ground, white wordmark body, orange living only in the terminal bloom and the i-dot). Current palette/aesthetics. Built as *almost no homepage*: a spare, warm landing that flows straight into the gate, so the front door nearly *is* the writing surface. Orange appears only at the connection/action moment. Reserve Fraunces for Wrizo's voice (wordmark, tagline, reward line); the human's writing stays in the UI face (Mulish) — the brand never restyles the human's words. Minimal chrome; respect reduced-motion. Locked accent: `#FF9800` (confirmed from source logo files).

---
## Traceability — Principle → Phase

| Principle / Rule | Where it's built |
|---|---|
| P1 Convergence is the product | DM (substrate), CV (engine) |
| P2 Mechanics over mantras | CW2 forward-only, all gestures |
| P3 Return path is sacred | TG2 The Rope |
| P4 App is the stable assemblage | AT1 themes-as-states |
| P5 No failure states | CW4, CW5, AT4, AT6 (audited every phase) |
| P6 Scaffold, don't supplant | AI5 quieting scaffolds |
| P7 Voice amplified, never normalized | AI4 guardrail, AI6 voice wall |
| P8 Interface recedes | CW3 chrome-fade, CW4 no-interruption |
| #4 rebuilt (becoming) | CW2 (critic-silencer), AT5 onboarding, HOME |
| Two Minds / dual-path | DM1 (forward-compat), CV/Trellis (v0.2) |
| AI rules / tutor-not-ghostwriter | AI1–AI6 |
| Pharmakon / graduation | AI5 |
| Local-first durability | DM4 |
| Latency tiers | AI1 (T0), AI2 (T1), AI3 (T2) |

---

## Backlog tickets — paste-ready for `docs/backlog.md`

> Merge into existing backlog; renumber to the live scheme. B3/B4/W5 are superseded by AT1/AT3/AT7.

```
## v0.1 — SHIP FIRST
- [ ] DM1   Fragment schema & store (+ nullable parentFragmentId, label-capable clusterId)
- [ ] DM2   Forward-only operation set (no delete / no edit-in-place)
- [ ] DM3   Migration shim (legacy sprintText -> fragments, reversible)
- [ ] DM4   Per-fragment sync + offline queue (silent retry)
- [ ] CW1   The Middle Door (fragment-field entry, never blank-top)
- [ ] CW2   Forward-only writing UI (extend J9 ink-strike onto fragments)
- [ ] CW3   Chrome-fade (recede on cadence; words/spine never fade)  [supersedes B3]
- [ ] CW4   No-interruption law (WritingSession + interrupt broker)
- [ ] TG2   The Rope (frictionless return; preserved context)
- [ ] GATE  Writing gate / first-write onboarding ("you're already writing")
- [ ] HOME  Homepage redesign ("For humans writing" + revised logo, almost-no-homepage)

## Phase 1 remainder
- [ ] CW5   No-failure-states audit hook (lint/CI note)

## Phase 2 — Tangent System (v0.2+)
- [ ] TG1   Branch gesture (held side-thread; forward-only native)
- [ ] TG3   Live Wires (peripheral tangent field; magnetizable)

## Phase 3 — Convergence Engine (v0.2+)
- [ ] CV1   Gather mode (tangible fragments; arrange not outline)
- [ ] CV2   Heat-based clustering (Tier 0, local, no LLM)
- [ ] CV3   Magnetized join + orange connection-event

## v0.2 — The Trellis (structure-first door; sits on the Phase 3 engine)
- [ ] TR1   Trellis entry: theme -> principles/points decomposition (funnel to prose)
- [ ] TR2   Phase split: malleable skeleton + forward-only prose-in-slots
- [ ] TR3   Empty slots read as invitation/order, never deficiency
- [ ] TR4   Permeability: a tangent can always escape a slot into a loose fragment
- [ ] TR5   Structured gate variant: prove humanity by mapping something you know
- [ ] TR6   Structure-cohering reward (distinct from "I wrote that?")

## Phase 4 — AI Scaffolding Layer (v0.2+)
- [ ] AI1   The Mirror (Tier 0 resurfacing; powers CW1 nudge)
- [ ] AI2   Quiet Bridges (Tier 1 affinity; peripheral, ignorable)
- [ ] AI3   Demonstrate-in-text (Tier 2, edges only; own-text register shift)
- [ ] AI4   Voice-amplification guardrail (no regression to mean)
- [ ] AI5   Quieting scaffolds (graduation)
- [ ] AI6   Voice Wall / paste rail (block foreign-voice import)

## Phase 5 — Assemblage, Atmosphere & Onboarding (v0.2+)
- [ ] AT1   Four themes as states (Plateau/Flux/Volant/Nomad)
- [ ] AT2   Locked orange invariant + contrast safety
- [ ] AT3   Orange connection-event system (systematic)   [supersedes B4]
- [ ] AT4   Ambient state-shift on stall (room, not status)
- [ ] AT5   Onboarding reframe ("you're already writing")  [GATE is its v0.1 implementation]
- [ ] AT6   Surprise-at-output reward (celebrate the work, not a score)
- [ ] AT7   Responsive graceful degradation (phone secondary)  [supersedes W5]
```
