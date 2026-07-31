# FX16 — post-merge review (Fable) — item 72
Reviewed at merge 48dc027. Census: 4 files, +146/−4, zero
schema/server/deps. VERDICT: PASS. Item 72 REVIEWED — GREEN.
The migration is correctly one-time and marker-guarded: stale
pre-FX15 'on' retired; a deliberate post-migration opt-in survives;
'never' untouched; fresh profiles no-op. fx16.mjs proves the escaped
case AND all three guard rails. The park is textbook: fx15.mjs's
placeholder assertion falsified honestly, original quoted verbatim,
successor named; the fixture re-point (marker seed) correctly
classified as fixture, not park. placeholder="" is the whole SV31.
