Train L9 (the tutor) deploy, Nov 26 2026, 12:14 pm to 12:16 pm MT (19:14:46Z to 19:16:14Z), from the laptop.
git 33fcdead = train-l9-2 = main 9a01afa0 + tutor/7b-notes-ask @ 3ebf18f9 without .github/workflows/tutor-notes-pg.yml, + the 18 tutor lexicon keys declared. Railway deployment daa46fc8-fb7a-4118-a9a2-fda586b7883c, upload exit 0, "Deploy complete".
Word: Fable, Nov 25 10:50 pm (cleared at 3ebf18f9) and Nov 26 12:20 pm (Q13: deploy now). Nick read the production Postgres version on Railway: 18.
Checks before: browserless 45763981949 SUCCESS; targeted tutor run 45763988155 SUCCESS (14/14 both legs, tutor-notes-pg-ci on a real Postgres 16.16); laptop gates on 33fcdead all exit 0 (frozen install, c13-standing incl. c13-10c, tsc desktop and server, seed-guard, hooks-order, hooks-order-ast, th-machina-source, build:web).
Server change: one new table tutor_notes (create if not exists, on boot) and the notes routes. No box turn.
After: /healthz 200 build index-BFmvfkko; served index-BFmvfkko.js 1452317 B md5 31607396d2c0 and index-GTHAywFG.css 518600 B md5 b9449512d047, byte-identical to the tested build:web; smoke-login PASS 6/6; /api/tutor/notes signed out 401; boot log: listening, no error (the server listens only after its migrations succeed).
Not proven: a signed-in read of the notes on production.
Roll-back target: train L10, git 031f40a0, railway a8677f8a-71ef-47f6-8e09-3593de2b66b7 (the new table stays; L10 does not read it). Roll back only on Fable's word or on a failure.
