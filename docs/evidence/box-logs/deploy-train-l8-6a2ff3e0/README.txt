Train L8 deploy, Nov 25 2026, 4:27 pm to 4:28 pm MT (23:27:16Z to 23:28:28Z), from the laptop (C:wrizo-workchat1), the first deploy from it.
git 6a2ff3e0 (full: 6a2ff3e098e2e1fe6c23b13989fe8ed3d34d0002) = train-l8-2 = train-l8-1 f4286c5d + one harness-only commit (scrollbar-flush-source.mjs). Railway deployment 0fc4ad4e-140d-44c9-94ef-15e7f1ed8615, upload exit 0, "Deploy complete".
Word: Nick (Nov 25, the laptop may deploy); Fable (Nov 25, 4:22 pm: deploy L8 as train-l8-2; no fresh full pair; no box turn and no box-only files).
Checks: pair 45489871289 on f4286c5d (default 501/503, only flux-v2-part2 and polish10-14-frames; parked 500/503, the same two plus scrollbar-flush-source); one-file run 45719310448 on 6a2ff3e0 SUCCESS both legs; browserless 45489877517 SUCCESS on f4286c5d; laptop gates on 6a2ff3e0 all exit 0 (frozen install, c13-standing, tsc desktop and server, seed-guard, hooks-order, hooks-order-ast, th-machina-source, build:web).
Not run: box turn and box-only files (the PC is off; Fable Q2).
Before: tree clean and detached at 6a2ff3e0; live index-BUfcGv_x, deployment 8b92d015; Railway status page Fully Operational.
After: /healthz 200 build index-ApiaN_dY; /auth/me signed out 401; served index-ApiaN_dY.js 1417342 B md5 772ccbd2f7e7 and index-DTPAMTHh.css 508146 B md5 5e25fb8fe25b, both byte-identical to the tested build:web; GET / no-cache; smoke-login PASS 6/6.
Roll-back target: git 50a46e6a, railway 8b92d015-1395-4ff7-99af-7557b500529f (the #123 hotfix). Roll back only on Fable's word.
