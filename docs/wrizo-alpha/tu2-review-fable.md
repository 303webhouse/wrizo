# TU2 — the Listener · Fable's ON-BRANCH review · 2026-07-21

**Verdict: GREEN on the branch (45ea10e). Required: 0.** Merge remains
gated on Nick's explicit word — this review authorizes nothing by
itself; it is the condition his word was waiting on.

**Depth disclosed — line-by-line where it counts:** the ENTIRE server
surface read whole across every commit touching it (S1's full 39-line
diff: env.ts, tutor.ts, .env.example; S2's complete tutor.ts change —
validation, MAX_DELTA_CHARS, the wire splice, the usage field; the
final env.ts comment as it stands after both fix commits). The complete
S2 client patch (Tutor.tsx delta assembly and send path, persistence.ts
cursor + append-spread fix, types/index.ts charter amendment, api.ts,
lexicon) and the complete S3 patch (tutorDisclosure.ts versioning whole,
both lexicon strings) read line-by-line. S4/S5/S6 at census + record
depth, standing on tu2.mjs's 102 checks, the four-lens independent
review, and the 54-run full-suite record. Server census independently
reconfirmed a fourth time by these reads: exactly env.ts, tutor.ts,
.env.example — no migration, no dependency, nothing else.

## Rulings of record

1. **The privacy invariant holds at both ends, extended not eroded.**
   The wire body is exactly `{ messages, delta? }`; an absent delta is
   truly absent (undefined key dropped), never an empty-string stand-in;
   the server validates the delta's own 17,000-char cap as a backstop to
   the client's 16,000; the `<page-since-last-read>` turn exists ONLY in
   the outbound wire mapping — the persisted role union stays
   `writer | tutor` with no third value, exactly TU1 ruling 2's
   discipline. Disclosure v2's wording is therefore mechanically true on
   the day it ships. VERIFIED.
2. **The cursor is captured at send, not at response.** `pageText` is
   closure-held from the send's own render, so writing done while the
   call is in flight stays past the cursor and is read next time — the
   listener never skips words it hasn't heard. And the append-spread fix
   in persistence.ts caught a real defect class before it shipped: the
   original thread reconstruction would have silently zeroed the cursor
   on every append. RATIFIED, both.
3. **The delta's ephemerality is design, not oversight — ruled so
   nobody later mistakes it.** A delta is heard once, on the turn it
   rides; it never re-enters future turns' context, because the cursor
   advances past it and history persists only the conversation. The
   Tutor has ears as of TU2; memory of the book is TU5's charter. The
   boundary is correct and is now named.
4. **Disclosure v2 landed VERBATIM** — Nick's ratified string
   word-for-word — on the right mechanism: an integer version compared
   against CURRENT_DISCLOSURE_VERSION, a read-only migration of the
   legacy boolean (v1-acknowledged devices read as 1 < 2 and see v2
   exactly once; new devices see only v2), v1's string kept in the
   lexicon as legible history, and a future v3 falling out of the same
   comparison for free. The brief's single most important check —
   the v1 flag cannot suppress v2 — is proven in the harness against a
   seeded legacy device. VERIFIED.
5. **The model-ID provenance dispute — resolved with evidence, and the
   pattern ratified.** The reviewer's correction (5ee65f0) was right on
   the evidence available to it; the orchestrator's counter-correction
   (45ea10e) attributes the verification to its own pre-build live
   check and keeps a re-check rider. Fable's independent corroboration
   closes it: the final comment's `2026-07-24 15:59 UTC` precision
   appears nowhere in the TU2 brief — it could only come from a real
   source, and Fable's own second-sitting research independently
   confirmed the same id and retirement date. The fact is triply
   sourced. The ratified pattern: a reviewer flags false confidence on
   its evidence; a correction must attribute, not merely assert, and
   must preserve a cheap re-check. The deploy checklist below carries
   the sixty-second re-verify anyway, because it is free and the alias
   retirement is three days out.
6. **The charter amendment is recorded to the bar:** types/index.ts
   quotes the brief's own amendment text, cites Nick's word and date,
   and restates the grandfather fixed point (a never-messaged page
   cannot gain ANY persisted tutor state, cursor included). VERIFIED —
   and the fixed point is structural in advanceTutorCursor, which
   refuses to conjure a thread, mirroring appendTutorMessage.
7. **Advisories carried, none blocking:** (a) an empty/whitespace model
   reply no-ops with no writer-facing status line — note the cursor
   correctly does NOT advance in that case, which is
   conservative-correct; only the missing line is the gap; one-line fix
   candidate for TU3's brief or a tu2.1 micro on Nick's word. (b) The
   cost table's dollar figures are disclosed placeholders — CC verifies
   live figures at deploy or the labels stand. (c) Cascade's own
   pre-existing dock-floor gate is vacuously permissive on Boards — the
   identical class TU2 fixed for the Tutor; queued as a candidate for
   FX8's brief, cascade territory. (d) Two independently hardcoded
   180ms literals that happen to agree — cosmetic, noted only.

## On Nick's go, in order

Merge (his word; CC executes from the primary checkout, serialized) →
deploy on his word — **the manifest at that moment names FX7 + TU2
together plus docs riders**, one deploy lawfully carries both →
**the key swap, which the deploy makes urgent:** Railway's
`TUTOR_API_KEY` is currently an Anthropic key with no base URL set;
post-deploy the default base URL is DeepSeek, so that key will fail
auth and the conversation will sit in its quiet-degrade line until a
DeepSeek key replaces it (or, to stay on Anthropic deliberately, set
`TUTOR_BASE_URL=https://api.anthropic.com` and an explicit
`TUTOR_MODEL`). CC re-verifies the model id and pricing figures live in
the same sitting → Nick's device sitting: the listener answering about
writing he never pasted, the disclosure appearing exactly once, the
board-mounted room, the meter's fade — alongside FX7's gesture fixes
under real hardware, per the trusted-pointer law. J6 and FX8's briefs
unblock on the merge.

— Fable, on the branch, 2026-07-21
