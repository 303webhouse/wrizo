# Item 77(c) — post-merge review (Fable)

Reviewed at merge c2a351f (fix 3527928; marker a26a810 empty, tree
object 03c8081 identical — the supersession proven, not asserted).
Census: 1 file, run-suite.mjs +84/−5; zero src, zero schema, zero
deps. VERDICT: PASS. 77(c) REVIEWED — GREEN.

The stamp reads identity from what will actually be served — hashed
asset names from dist-web/index.html plus on-disk byte count —
never from build logs. Git failure stamps tree=unknown rather than
lying; the dirty count rides inside the stamp so an identity claim
cannot outrun what is known. Rebuild-first REFUSES (exit 2,
distinct from NOT CLEAN's 1) with the principle stated in the
refusal line; --no-rebuild survives, stamped, structurally unable
to masquerade as a record. Both quotable lines and manifest.json
carry the same facts — comparing two results is now a diff. Guard,
contamination, abort, and NOVERDICT semantics untouched. Verified
by planted failure; the stamp's first act was confessing its own
+1dirty, correctly.

OBS (non-blocking): --no-rebuild against an ABSENT dist proceeds to
per-file failures rather than refusing; the MISSING NO-REBUILD
stamp self-indicts, so this is tidiness, not risk. Chat 6's
discretion, post-vacation.

— Fable, 2026-08-01
