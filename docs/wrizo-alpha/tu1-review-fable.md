# TU1 — the Tutor · Fable's ON-BRANCH review · 2026-07-19

**Verdict: GREEN on the branch (3b062df). Required: 0.** Merge
remains gated on Nick's explicit word — this review authorizes
nothing by itself; it informs his go.

**Depth disclosed — deepest of the run where it counts:** full
line-by-line read of the ENTIRE schema surface (migrate.ts's one
column; sync.ts both directions — 22 placeholders hand-counted
against 22 columns, ::jsonb cast position verified, null-coalesce
verified; persistence.ts's read/append pair) and the ENTIRE server
route (tutor.ts whole, env.ts, index.ts's one mount line, api.ts,
tutorDisclosure.ts). S2/S3/S4 geometry, lenses, and nudges at
census + record depth, standing on the 96-check harness and the
independent review's own hand-verification (which found nothing to
fix — a first for the session, and credible given its record of
finding real faults on every prior ticket).

**Rulings of record:**
1. **The grandfather is structural, not guarded** — no empty-thread
   writer exists anywhere; absent stays absent by construction.
   RATIFIED as the strongest possible form of the brief's own
   null⇔undefined requirement.
2. **A13 is architectural at every layer:** the panel's closure
   holds no editor ref or text setter (cannot reach a writing
   surface regardless of behavior); the system prompt exists
   server-side only; the persisted role union has no third value
   (no system-message leakage into threads). RATIFIED.
3. **Privacy mechanically true to the disclosure's wording:** the
   request body is exactly {messages:[{role,text}]} — no page
   text, no lens results, no nudges. VERIFIED at both ends.
4. **The two-anchor geometry deviation** (grip + panel anchors
   split after the single-anchor clip was measured at 1280px)
   RATIFIED — empirical, disclosed, and the docked state still
   clamps by the Cascade's own floor pattern.
5. **The server-surface enumeration holds:** one column, two mapper
   touches, one route + its own necessary body (mount line, env
   config, .env.example, the model SDK dependency). The SDK is
   accepted as within the route's envelope; recorded here so the
   enumeration stays honest.
6. **The truthful test double endorsed** — runtime-verify.mjs
   mirroring the real unconfigured response shape lets the harness
   prove the quiet-degrade path end-to-end instead of by
   inspection.

**A1 (condition, not defect):** the live model path is unexercised
— no key exists in the build environment; both agents disclosed
this plainly. First live call happens post-deploy on Nick's
machine after TUTOR_API_KEY lands on Railway (Anthropic key;
model/max-tokens default sensibly). The quiet-degrade path is the
proven net beneath it.

**On Nick's go, in order:** merge → deploy on his word (manifest
enumerated as always) → the REQUIRED prod round-trip (scratch
account, populated thread, byte-for-byte both directions — the S1
precedent) → Nick's DoD sitting (conversation half needs his key).
**FX5 is unblocked NOW by this review** per its own brief — its
build may begin regardless of TU1's merge timing.

— Fable, on the branch, 2026-07-19
