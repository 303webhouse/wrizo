Train L18a deploy, Nov 28 2026, 2:11 am to 2:12 am MT (09:11:03Z to 09:12:05Z), from the laptop.
git d7ff4bea1 = train-l18-2 (also pushed as train-l18a-1) = main fae3ae45f + POLISH polish/l18a-stack 816a7ec64 (#144, #145 with its box change, FIX's Wire In Tab line; no #143). Tree identical to 816a7ec64. Railway deployment 98bb9a64-8e79-4047-9390-1cff65809521.
Word: Fable, Nov 28 2:01 am (L18a read and cleared; deploy on green; POLISH's pair counts if the tree is identical); orders file.
The full pair: 46118930477, POLISH's run on 816a7ec64. POLISH reports 565/567 each leg, the only non-OKs the two always allowed (flux-v2-part2, polish10-14-frames). Chat 1 did not download its report; it saw the run's jobs: 13 success, 5 failure, none cancelled.
Chat 1's own pair 46128425640 on d7ff4bea1 was queued when the 2:01 am order made it unneeded; Chat 1 cancelled it.
Browserless 46128422425 on d7ff4bea1 SUCCESS. Laptop on d7ff4bea1: frozen install, tsc desktop and server, build:web, c13-standing 11/11, seed-guard, hooks-order, hooks-order-ast; 150 browser-free files, all exit 0 but six that stop for want of a box turn. wa-red-* and reorg-parts-unit were left out of that pass.
After: /healthz 200 build index-DNzmvE7l; served index-DNzmvE7l.js 1530491 B md5 c4d85356b012 and index-D9lhlM9s.css 551877 B md5 e42fb18e269b, byte-identical to the tested build:web; the desk's bundle is still index-*; smoke-login PASS 6/6; boot log: listening, no error.
Client only (no server file differs from L17). No database change.
Roll-back target: train L17, git 0f60a2a1d, railway 1de4ba2f-94bf-4766-9fa9-7f2c3108a2d1.
