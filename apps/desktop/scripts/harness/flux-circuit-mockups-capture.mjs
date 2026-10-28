// POLISH — screenshots of the Flux mockups (docs/theme-foundations/flux/): the Schema circuit v2, the Strata circuit, the two Page mockups and the logo sheet.
// A capture, not a verdict check: it opens each file in the harness browser, drives it to named states, photographs them, and reports any page error
// (so a broken mockup cannot hide behind a pretty first frame).
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
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;   // e.g. ONLY=A,P1

await withHarness(async (app) => {
  await app.emulateDpr(1, 1600, 900);
  const open = async (file) => { await app.cdp('Page.navigate', { url: 'file:///' + path.join(MOCK, file).replace(/\\/g, '/') }); await sleep(600); await app.evalJs("window.__errs = []; addEventListener('error', (e) => window.__errs.push(String(e.message))); true"); await sleep(2600); };
  const shot = async (name) => { fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const js = (s) => app.evalJs(s);
  const errCheck = async (label) => { const e = await js('(window.__errs || []).slice(0)'); if (e && e.length) errors.push(label + ': ' + e.join(' | ')); };
  const want = (k) => !ONLY || ONLY.includes(k);

  if (want('A')) {
    await open('flux-circuit-mockup-A-schema.html');
    await shot('A2-01-circuit');
    await js("first.selected = 'c4'; first.cam.s = 1.2; first.cam.x = 900; first.cam.y = 330; true"); await sleep(1600); await shot('A2-02-selected-node-electrons-only-on-its-links');
    await js("BOARDS.plot.links.push(['c10','c7']); first.selected = 'c10'; first.linkFlash = { a: 'c10', b: 'c7', t0: performance.now() }; first.cam.s = 1.1; first.cam.x = 360; first.cam.y = 620; BOARDS.plot.cards.forEach(k => fill(first, k)); true"); await sleep(180); await shot('A2-03-new-link-lights-up-on-connect');
    await js("first.selected = null; first.cam.s = .95; first.cam.x = 1250; first.cam.y = 520; true"); await sleep(900); await shot('A2-04-kinds-preset-doc-pdf-jpg');
    await js("fit(first, true); document.getElementById('tabL').click(); document.getElementById('tabR').click(); true"); await sleep(700); await shot('A2-05-the-two-hands');
    await js("document.getElementById('tabL').click(); document.getElementById('tabR').click(); first.el.querySelector('.plus').click(); true"); await sleep(500); await shot('A2-06-plus-menu');
    await js("closeMenus(); openPane('board','cast'); true"); await sleep(900); await shot('A2-07-split-two-panes');
    await js("openPane('doc','ch3'); openPane('board','harbour'); connections.add('plot|cast'); true"); await sleep(1200); await shot('A2-08-split-four-panes-one-ground');
    await js("[...panes].slice(1).forEach(p => closePane(p)); fit(first, true); setView(first,'stack'); true"); await sleep(380); await shot('A2-09-stack-gathering');
    await sleep(1300); await shot('A2-10-stack');
    await js("openHolo(first, 'c4'); true"); await sleep(1100); await shot('A2-11-opened-node-hologram');
    await js("holoGo(holo.idx + 1); true"); await sleep(800); await shot('A2-12-hologram-flipped');
    await js("document.getElementById('holoPlus').click(); true"); await sleep(400); await shot('A2-13-hologram-plus-menu');
    await errCheck('A');
  }
  if (want('P1')) {
    await open('flux-page-mockup-1-terminal.html');
    await shot('P1-01-page-terminal');
    await js("scramble(lab, 420); true"); await sleep(210); await shot('P1-02-sprint-letters-glitching');
    await sleep(800); await js("document.getElementById('tabL').click(); true"); await sleep(500); await shot('P1-03-tools-hand');
    await js("document.getElementById('tabL').click(); base = words() - 120; true"); await sleep(260); await shot('P1-04-checkpoint-orange-letters-resolving');
    await sleep(900); await shot('P1-05-checkpoint');
    await errCheck('P1');
  }
  if (want('P2')) {
    await open('flux-page-mockup-2-schema-doc.html');
    await js("const p = text.querySelectorAll('p')[1]; text.focus(); const r = document.createRange(); r.setStart(p.firstChild, 20); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); true"); await sleep(900);
    await shot('P2-01-schema-doc-block-links');
    await js("scramble(lab, 420); true"); await sleep(210); await shot('P2-02-sprint-letters-glitching');
    await sleep(900); await js("document.getElementById('tabR').click(); true"); await sleep(500); await shot('P2-03-operator-hand');
    await errCheck('P2');
  }
  if (want('LOGO')) {                // the two finalist logos in the mockups (flux-logo-switch.js): the splash, then the top bar, each logo on each surface
    const openQ = async (file, q) => { await app.cdp('Page.navigate', { url: 'file:///' + path.join(MOCK, file).replace(/\\/g, '/') + q }); await sleep(500); await app.evalJs("window.__errs = []; addEventListener('error', (e) => window.__errs.push(String(e.message))); true"); };
    const hold = "document.querySelectorAll('.logo-cur').forEach(e => { e.style.animation = 'none'; e.style.opacity = '1'; }); true";
    for (const [file, tag] of [['flux-circuit-mockup-A-schema.html', 'schema'], ['flux-page-mockup-1-terminal.html', 'page1'], ['flux-page-mockup-2-schema-doc.html', 'page2']]) {
      for (const logo of ['terminal', 'hand']) {
        await openQ(file, '?logo=' + logo); await sleep(400); await js(hold);
        if (tag === 'schema') await shot(`LOGO-${tag}-${logo}-0-splash`);
        await sleep(2600); await js(hold); await shot(`LOGO-${tag}-${logo}`);
      }
      await errCheck('LOGO ' + tag);
    }
  }
  if (want('L')) {
    await app.emulateDpr(1, 1600, 1500);
    await open('flux-logo-mockups.html'); await sleep(600);
    await js("document.querySelectorAll('.cur').forEach(e => { e.style.animation = 'none'; e.style.opacity = '1'; }); true"); await sleep(200);   // the photo holds the cursor on (it blinks live)
    await shot('L-01-logo-mockups');
    await errCheck('L');
  }
  return [];
}, { label: 'flux-circuit-mockups-capture' });

console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'NO PAGE ERRORS'); // eslint-disable-line no-console
