Train L17 deploy, Nov 27 2026, 9:34 pm to 9:35 pm MT (Nov 28 04:33:56Z to 04:35:05Z), from the laptop.
git 0f60a2a1d = train-l17-2 = main 552ca7a1c + FIX fix-147-wirein-quiet b1808437 (#147 no menus in Wire In, #148 its bar, X and prompt; VISUAL-B theme tiles and POLISH #142 inside; the rail out of Wire In's Tab order; five Flux checks follow #147; Volant's orb off pure white). No conflicts. Railway deployment 1de4ba2f-94bf-4766-9fa9-7f2c3108a2d1.
Word: Fable, Nov 27 5:38 pm (cut L17, deploy on green), 6:25 pm, 7:59 pm and 8:47 pm (0f60a2a1d deploys on green pair 46102373845); orders file.
First pair 46091858300 on 4fd865996 (train-l17-1) was not green: five Flux checks behind #147, one pure-white fill in the tiles, and one shard cancelled by another lane's run dispatched on the same ref.
The pair on 0f60a2a1d: 46102373845. 563/565 OK each leg, every shard ran; the only non-OKs are the two always allowed (flux-v2-part2, polish10-14-frames). Chat 1 read pair-merged.
Browserless 46102370572 SUCCESS. Laptop on 0f60a2a1d: tsc desktop and server, build:web, c13-standing 11/11, seed-guard, hooks-order, hooks-order-ast; 150 browser-free files, all exit 0 but six that stop for want of a box turn.
After: /healthz 200 build index-C4vtxnVa; served index-C4vtxnVa.js 1529877 B md5 d0a74b7b7101 and index-DxZCTpLf.css 551675 B md5 3780cf66754d, byte-identical to the tested build:web; the desk's bundle is still index-*; smoke-login PASS 6/6; boot log: listening, no error.
Client only (no server file differs from L16). No database change.
Roll-back target: train L16, git 4e8cc6ed1, railway 61b9e196-c083-4cc2-80ab-1564bd5efcdc.
