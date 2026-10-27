// POLISH — screenshots of the two Flux Circuit mockups (docs/theme-foundations/flux/flux-circuit-mockup-{A-schema,B-strata}.html).
// A capture, not a verdict check: it opens each mockup file in the harness browser, drives the camera to named states, and photographs them.
// It also reports any page error, so a broken mockup cannot hide behind a pretty first frame.
//
// Run: WS_BOX_TURN=<token> node scripts/harness/flux-circuit-mockups-capture.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const MOCK = path.resolve(here, '..', '..', '..', '..', 'docs', 'theme-foundations', 'flux');
const OUT = path.resolve(here, '..', '..', '..', '..', 'docs', 'evidence', 'flux-circuit-mockups');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];

await withHarness(async (app) => {
  await app.cdp('Runtime.enable');
  if (app.tap) app.tap((m) => { if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
  await app.emulateDpr(1, 1600, 900);
  const open = async (file) => { await app.cdp('Page.navigate', { url: 'file:///' + path.join(MOCK, file).replace(/\\/g, '/') }); await sleep(3200); };
  const shot = async (name) => { fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const js = (s) => app.evalJs(s);
  const errCheck = async (label) => { const e = await js('(window.__errs || []).slice(0)'); if (e && e.length) errors.push(label + ': ' + e.join(' | ')); };
  const installErr = () => js("window.__errs = []; addEventListener('error', (e) => window.__errs.push(String(e.message))); true");

  // ---------------- A: SCHEMA ----------------
  await open('flux-circuit-mockup-A-schema.html'); await installErr();
  await shot('A1-arrival-circuit');
  await js("cam.s = 1.25; cam.x = 820; cam.y = 330; selected = 'c4'; true"); await sleep(900); await shot('A2-node-level-selected');
  await js("cam.s = 0.3; cam.x = 820; cam.y = 400; selected = null; true"); await sleep(700); await shot('A3-subnet-level');
  await js("cam.s = 7; cam.x = byId.c3.x + 120; cam.y = byId.c3.y + 120; true"); await sleep(800); await shot('A4-glyph-level-code-points');
  await js("cam.s = 0.006; cam.x = CX; cam.y = CY; true"); await sleep(700); await shot('A5-cartridge-level');
  await js("cam.s = 0.00025; true"); await sleep(700); await shot('A6-rack-level');
  await js("cam.s = 0.85; cam.x = CX; cam.y = CY; document.body.classList.add('arbor'); true"); await sleep(800); await shot('A7-jacked-out-same-cards-in-arbor');
  await js("document.body.classList.remove('arbor'); setView('sequence'); true"); await sleep(1200); await shot('A8-sequence-view');
  await errCheck('A');

  // ---------------- B: STRATA ----------------
  await open('flux-circuit-mockup-B-strata.html'); await installErr();
  await sleep(2000); await shot('B1-strata-exploded');
  await js("cam.yaw = 24; cam.pitch = 58; cam.z = .7; selected = 'c4'; true"); await sleep(900); await shot('B2-orbit-links-on-the-bus');
  await js("e = 0; syncE(); cam.pitch = 0; cam.yaw = 0; cam.z = .78; selected = null; true"); await sleep(900); await shot('B3-flattened-work-mode');
  await js("e = 1; syncE(); cam.pitch = 50; cam.yaw = -16; cam.z = .8; dive('c6'); true"); await sleep(900); await shot('B4-inside-a-node-text-as-source');
  await js("undive(); toRack(); rackS = .35; true"); await sleep(800); await shot('B5-zoomed-out-cartridge-and-rack');
  await js("rackS = .05; true"); await sleep(600); await shot('B6-zoomed-out-further');
  await js("leaveRack(); cam.z = .62; document.body.classList.add('arbor'); e = 0; syncE(); cam.pitch = 0; cam.yaw = 0; true"); await sleep(900); await shot('B7-jacked-out-same-cards-in-arbor');
  await errCheck('B');
  return [];
}, { label: 'flux-circuit-mockups-capture' });

console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'NO PAGE ERRORS'); // eslint-disable-line no-console
