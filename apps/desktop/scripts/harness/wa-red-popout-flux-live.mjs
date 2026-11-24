// OWED SUCCESSOR, row 45 (docs/flux-live-pin-list.md, owed after live): wa-red-popout's P2 to P28 on the Flux a writer gets. wa-red-popout.mjs stays
// verbatim on plain Flux (the driver's pin); this runs the SAME writing-audit/signin-popout.mjs on live Flux - the redesign and the reorg by default,
// no ?flux3 in the address - with the panel reached through Flux's v5 front door (WA_DOOR=v5: [data-flux-door=login]), Page: Light and Page: Dark.
// The panel's own checks (its words, colours, fit, tick, focus, Esc and errors) read the same .wz-popout; a check that reads the OLD splash picture behind
// it (the hero, its ghost doors, the chart) is reported as it falls, and each such red is a reading for the v5 door owed in docs/flux-live-pin-list.md.
// Run: node scripts/harness/wa-red-popout-flux-live.mjs   (from apps/desktop; Actions harness or a box turn)
import { runReds } from './writing-audit/lib/wa-red-run.mjs';
process.env.WA_DOOR = 'v5';
process.env.WS_FLUX3 = 'default';
process.env.WS_REORG = '1';
await runReds({ name: 'WA-RED-POPOUT-FLUX-LIVE', steps: [
  { script: 'signin-popout.mjs', themes: ['flux'], tone: 'light' },
  { script: 'signin-popout.mjs', themes: ['flux'], tone: 'dark' },
] });
