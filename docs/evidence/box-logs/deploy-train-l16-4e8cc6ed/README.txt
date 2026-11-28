Train L16 deploy, Nov 27 2026, 5:35 pm to 5:37 pm MT (Nov 28 00:35:34Z to 00:36:56Z), from the laptop.
git 4e8cc6ed1 = train-l16-1 = main 50301c587 + TUTOR-B tutor/12-walk-writers-note 98901af7d (the walk's route, prompts v0.3, the writer's note) + PRESETS-B presets-b/walk-ai-panel 81a3dab0e + PRESETS-B presets-b/146-guide-opens-text 8079a3441. One conflict, docs/cleanup/c13-10c-new.txt: both blocks kept. Railway deployment 61b9e196-c083-4cc2-80ab-1564bd5efcdc.
Word: Fable, Nov 27 3:58 pm (L16's contents) and 4:47 pm (Q28: deploy when the pair is green; 98901af7d read); orders file.
The full pair: 46081732663 on 4e8cc6ed1. 560/562 OK each leg; the only non-OKs are the two always allowed (flux-v2-part2, polish10-14-frames), both "no verdict". Chat 1 read pair-merged (Nick's standing yes, Nov 27).
Browserless 46081729370 SUCCESS. Laptop on 4e8cc6ed1: frozen install, tsc desktop and server, build:web, c13-standing 11/11; 150 browser-free files, all exit 0 but six that stop for want of a box turn.
After: /healthz 200 build index-BrbXS5D0; served index-BrbXS5D0.js 1517623 B md5 0b1671840fa7 and index-k1EQ44B7.css 544600 B md5 3a21e160f29d, byte-identical to the tested build:web; the desk's bundle is still index-*; smoke-login PASS 6/6; boot log: listening, no error.
Client and server (apps/server/src/tutor.ts, tutorPrompts.ts). No database change.
Roll-back target: train L15, git cdae5ee0d, railway af4b9651-7ae7-4384-b2e0-a826ae45a58c. It takes the route and the panel together.
