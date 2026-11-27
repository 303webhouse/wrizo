Train FW (the Free Write four) deploy, Nov 26 2026, 6:43 pm to 6:50 pm MT (Nov 27 01:43:55Z to 01:50:05Z), from the laptop.
git 2d41ae85 = train-fw4-1 = main 99a4bbcf + #110 add689c4 + #82 5c54d381 + #117 6a1c4036 + the line-back 8023d66f. One conflict, two import lines in PageEditor.tsx, both kept. Product changes are line for line those of the cleared fix-fw4-join @ a8f3fd22 (7 files). Railway deployment a7ce607e-07ef-4c23-92b6-e393578bb73a, upload exit 0, "Deploy complete".
Word: Fable, Nov 26 6:10 pm (Q17: A, FW is ready); Nick's "go" in chat 1, about 6:43 pm, at the laptop to try it.
Checks before: browserless 45909614606 SUCCESS; full pair 45911679529 (523/527 default, 524/527 parked). Non-OKs: the two allowed files; keyflip-live default leg only (254, limit 220; parked 215; solo re-runs 45918092419 and 45918687388 215 on both legs); return-caret-probe, a probe with no verdict line. Both accepted by Fable for FW.
Laptop gates on 2d41ae85 all exit 0: frozen install, tsc desktop and server, seed-guard, hooks-order, hooks-order-ast, th-machina-source, machina-doc-word, free-write-host-unit, build:web, c13-standing (11).
After: /healthz 200 build index-3Y7jJgBs; served index-3Y7jJgBs.js 1460282 B md5 ea007696d085 and index-DPfNrmeZ.css 520137 B md5 74839b0de47c, byte-identical to the tested build:web; smoke-login PASS 6/6; boot log: listening, no error.
Client only: no server or database change.
Roll-back target: train L11, git 302749fb, railway 8ce8b2cd-193b-4767-ae08-b58222330673. Roll back at Nick's "it broke".
