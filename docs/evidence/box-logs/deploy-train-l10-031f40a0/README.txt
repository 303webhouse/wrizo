Train L10 deploy, Nov 25 2026, 10:36 pm to 10:37 pm MT (Nov 26 05:36:35Z to 05:37:45Z), from the laptop.
git 031f40a0 = train-l10-5. Railway deployment a8677f8a-71ef-47f6-8e09-3593de2b66b7, upload exit 0, "Deploy complete".
Word: Fable, Nov 25 (Q8: ship without #133; Q9: the terms.ts type-only move; Q10: deploy train-l10-5).
Checks: pair 45751763534 on train-l10-4 4bd4dc46 (default 504/507, parked 504/507: flux-v2-part2 and polish10-14-frames allowed, plus flux-v2 LX2b); one-file run 45758988446 on 031f40a0 SUCCESS (flux-v2, both legs); browserless 45751753999 SUCCESS on 4bd4dc46; laptop gates on 031f40a0 all exit 0 (frozen install, c13-standing, tsc desktop and server, seed-guard, hooks-order, hooks-order-ast, th-machina-source, build:web).
Not run: box turn and box-only files (the PC is off).
Before: tree clean at 031f40a0; live index-ApiaN_dY, deployment 0fc4ad4e; Railway status page Fully Operational.
After: /healthz 200 build index-Ci2uSQLf; /auth/me signed out 401; served index-Ci2uSQLf.js 1444823 B md5 69cf9d019648 and index-GTHAywFG.css 518600 B md5 b9449512d047, both byte-identical to the tested build:web; GET / no-cache; smoke-login PASS 6/6.
Roll-back target: train L8, git 6a2ff3e0, railway 0fc4ad4e-140d-44c9-94ef-15e7f1ed8615. Roll back only on Fable's word.
