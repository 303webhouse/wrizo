// OWED SUCCESSOR, row 45 (docs/flux-live-pin-list.md, owed after live): wa-red-popout's P2 to P28 on the Flux a writer gets. wa-red-popout.mjs stays
// verbatim on plain Flux (the driver's pin); this runs the SAME writing-audit/signin-popout.mjs on live Flux - the redesign and the reorg by default,
// no ?flux3 in the address - with the panel reached through Flux's v5 front door (WA_DOOR=v5: [data-flux-door=login]), Page: Light and Page: Dark.
// The panel's own checks (its words, colours, fit, tick, focus, Esc and errors) read the same .wz-popout; a check that reads the OLD splash picture behind
// it (the hero, its ghost doors, the chart) is reported as it falls, and each such red is a reading for the v5 door owed in docs/flux-live-pin-list.md.
// It spawns the two children itself (the shared lib/wa-red-run.mjs prints only a child's tail) so every POPOUT line reaches the log; the environment is
// lib/wa-red-run.mjs's own (WA_FLAG off, 1366 x 768, strict), plus the v5 door and the live Flux.
// SUPERSEDED (run 45437975159, 45c843f8: its reds could not be read past the tail): the first version called the shared runner. Kept verbatim, not run:
//   import { runReds } from './writing-audit/lib/wa-red-run.mjs';
//   process.env.WA_DOOR = 'v5'; process.env.WS_FLUX3 = 'default'; process.env.WS_REORG = '1';
//   await runReds({ name: 'WA-RED-POPOUT-FLUX-LIVE', steps: [ { script: 'signin-popout.mjs', themes: ['flux'], tone: 'light' }, { script: 'signin-popout.mjs', themes: ['flux'], tone: 'dark' } ] });
// Run: node scripts/harness/wa-red-popout-flux-live.mjs   (from apps/desktop; Actions harness or a box turn)
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'writing-audit');
if (process.env.HARNESS_PARKED === '1') { console.log('WA-RED-POPOUT-FLUX-LIVE: PASS (parked leg: the checks do not depend on it; the default leg runs them)'); process.exit(0); }
const runChild = (tone) => new Promise((resolve) => {
  const env = { ...process.env, WA_FLAG: 'off', WA_TONE: tone, WA_W: '1366', WA_H: '768', WA_STRICT: '1', WA_THEME: 'flux', WA_DOOR: 'v5', WS_FLUX3: 'default', WS_REORG: '1' };
  const child = spawn(process.execPath, [path.join(WA, 'signin-popout.mjs')], { cwd: process.cwd(), env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let text = '';
  child.stdout.on('data', (b) => { text += b; }); child.stderr.on('data', (b) => { text += b; });
  const timer = setTimeout(() => { try { child.kill(); } catch { /* gone */ } }, 6 * 60 * 1000);
  child.on('exit', (code) => { clearTimeout(timer); resolve({ tone, code, text }); });
});
const bad = [];
for (const tone of ['light', 'dark']) {
  const r = await runChild(tone);
  for (const l of r.text.split(/\r?\n/)) if (/^(POPOUT|SIGNIN-POPOUT) /.test(l)) console.log(`  ${l.slice(0, 600)}`);
  console.log(`  signin-popout.mjs flux ${tone} (v5 door): ${r.code === 0 ? 'green' : `RED (exit ${r.code})`}`);
  if (r.code !== 0) bad.push(tone);
}
console.log(bad.length ? `WA-RED-POPOUT-FLUX-LIVE: FAIL - ${bad.length} of 2 run(s) red: ${bad.join(', ')}` : 'WA-RED-POPOUT-FLUX-LIVE: PASS (2 run(s) green)');
process.exit(bad.length ? 1 : 0);
