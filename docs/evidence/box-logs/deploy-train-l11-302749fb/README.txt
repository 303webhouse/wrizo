Train L11 deploy, Nov 26 2026, 3:15 pm to 3:17 pm MT (22:15:49Z to 22:17:02Z), from the laptop.
git 302749fb = train-l11-4 = main 4b7776d3 + polish/133b-front-menu @ db21e1c1 + fix-137-caret-lag @ 3de44e95 + four harness files (successors for the Tutor's notes on file, which came with L9). Railway deployment 8ce8b2cd-193b-4767-ae08-b58222330673, upload exit 0, "Deploy complete".
Word: Fable, Nov 26 1:20 pm (cut L11) and 3:20 pm (Q15: deploy train-l11-4; Q16: keep "on file").
Checks before: full pair 45890458646 on ade4b65d (514/520 each leg; non-OKs: the two allowed files and four files from L9); the same four red on live main 4b7776d3 (45897887013, 45899263836); run 45899587938 on 302749fb: the four CLEAN on both legs; browserless 45890453867 SUCCESS. No product file differs between ade4b65d and 302749fb.
Laptop gates on 302749fb all exit 0: frozen install, tsc desktop and server, seed-guard, hooks-order, hooks-order-ast, th-machina-source, build:web, c13-standing (11).
After: /healthz 200 build index-i7eY_KFG; served index-i7eY_KFG.js 1456260 B md5 55cf252c24b8 and index-DPfNrmeZ.css 520137 B md5 74839b0de47c, byte-identical to the tested build:web; smoke-login PASS 6/6; boot log: listening, no error.
Roll-back target: train L9, git 33fcdead, railway daa46fc8-fb7a-4118-a9a2-fda586b7883c. Roll back only on Fable's word or on a failure.
