Train L12 deploy, Nov 26 2026, about 9:49 pm to 9:50 pm MT (Nov 27 04:49:11Z to 04:50:31Z), from the laptop.
git 51969b40 = train-l12-2 = main 16dc8683 + VISUAL-B visual/1-pen e796bc67 (the INK tab, 1a, with its mends and touch sizes) + FIX #136 626c2856 + TUTOR-B b0a94e43 + FIX #140 7d2716cd. No conflicts. Railway deployment 6904f6c6-a51e-4a0c-9667-364ad721342a (see railway-up.txt: the upload command timed out; Railway built it).
Word: Fable, Nov 26 6:10 pm (cut L12; deploy when green). Nick's "Go, deploy L12" in chat 1, about 9:48 pm, which answers Q19 (return-caret-probe, a probe with no verdict) and Q18 (#140 ships as built).
Checks before: browserless 45925289977 SUCCESS; full pair 45925293522 (534/537 default, 535/538 parked). The only non-OKs, no verdict, the same three on both legs: flux-v2-part2 and polish10-14-frames (always allowed) and return-caret-probe (same output as in FW's pair). keyflip-live PASS (12) on both legs.
Laptop gates on 51969b40 all exit 0: frozen install, tsc desktop and server, seed-guard, hooks-order, hooks-order-ast, th-machina-source, machina-doc-word, free-write-host-unit, tutor-call-limit, tutor-prompts, build:web, c13-standing.
After: /healthz 200 build index-CcRcK6kV; served index-CcRcK6kV.js 1457579 B md5 a3c5477d778a and index-C1icEUxw.css 526821 B md5 103c08fc36b3, byte-identical to the tested build:web; smoke-login PASS 6/6; boot log: listening, no error.
Client and server (tutor.ts, tutorPrompts.ts). No database change.
Roll-back target: train FW, git 2d41ae85, railway a7ce607e-07ef-4c23-92b6-e393578bb73a.
