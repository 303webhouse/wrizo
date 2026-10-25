// POLISH #10, FIX item 23 (Nick, Oct 25, via Fable): WHILE TYPING, EVERYTHING OFF THE PAGE GOES TO OPACITY 0 - the rail, the mode bar, the wordmark, the
// "...", the progress strip, the decorations - and only the PAGE and the drawers' TAB ARROWS stay. It returns as today; keyboard focus restores it.
// On the framed desk this holds whatever the Recede setting says (a stored 'partial' cannot be told from the old default - the whole settings object is
// saved on any change); the setting still governs the narrow, unframed layout.
// RED-FIRST, on page-size-r3 @ 243cf8f0: the desk's chrome stops at 0.08 (its --fade-min never reached it), and the wordmark, the ember dot, the progress
// lane and Flux's glitch meter never dissolve at all.
//
// Arbor, Flux, Machina - a Draft page with text, 1366x768, the drawers shut; the writer types, then waits out the fade:
//   R1 THE CENSUS: every element that paints something on screen (text, an icon, an image, a mask, a ::before/::after, a coloured box) that is not inside
//      the page and not a drawer's tab arrow has an EFFECTIVE opacity (its own times every ancestor's) of 0 - each one that does not is named
//   R2 the page itself stays: the page and its text at full strength
//   R3 the two tab arrows stay: each grip at full strength
//   R4 it returns as today: Escape brings the chrome back (the rail and the mode bar above half strength within 2s)
//   R5 keyboard focus restores it: with the chrome receded again, focus landing on a chrome control (the rail's first item) brings it back
//   R6 with 'partial' stored (the old default, saved with any setting), the framed desk still recedes to 0; and "Recede depth" is offered nowhere (Nick:
//      REMOVED - the narrow layout follows the full recede)
//   R7 a PROGRESS strip stays visible and live while typing (each that is on: the rhizome, the bar, Machina's run strip, Flux's glitch meter)
//   R8 a DOCKED panel stays visible while typing (the Tutor, docked)
//   R9 the NARROW layout (1000px, unframed) follows the full recede: its census is empty too
// Mutant (Arbor): MR1 the wordmark forced to full strength - R1 fails and names it.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-recede.mjs (apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }, { id: 'machina', name: 'Machina' }];
const TEXT = 'The rope was already there, and the well took the bucket back colder still. Whatever is worth carrying is already with you.';
const FADE_WAIT = 4500;   // the slowest fade out (2.8s) and a margin

// THE CENSUS: painted elements off the page (not the page, not the tab arrows, not a ground that fills most of the viewport), with their effective opacity
const CENSUS = `(() => {
  const vw = innerWidth, vh = innerHeight; const page = document.querySelector('.desk-frame-stage--prose .mode-page') || document.querySelector('.mode-page');
  // the exceptions (Nick, Oct 25): the page, the tab arrows, PROGRESS STRIPS (any theme's, or the bar - and the narrow layout's incentive row), DOCKED panels
  const keep = (el) => (page && page.contains(el)) || !!el.closest('.wz-sliver-grip, .wz-tutor-grip, .flux-block-caret, .desk-frame-rhizome-anchor, .glitch-meter-layer, .mode-incentive-row, .wz-tutor-panel[data-docked="true"], .wz-cascade-survey[data-docked="true"]');
  const eff = (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= parseFloat(cs.opacity); } return o; };
  const paints = (el) => { const cs = getComputedStyle(el);
    if ([...el.childNodes].some((c) => c.nodeType === 3 && c.data.trim())) return 'text';
    if (/^(svg|img|canvas|input|textarea|video)$/i.test(el.tagName)) return el.tagName.toLowerCase();
    if ((cs.maskImage && cs.maskImage !== 'none') || (cs.webkitMaskImage && cs.webkitMaskImage !== 'none')) return 'mask';
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return 'bg-image';
    for (const p of ['::before', '::after']) { const c = getComputedStyle(el, p).content; if (c && c !== 'none' && c !== 'normal' && c !== '""') return p; }
    if (cs.backgroundColor && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(cs.backgroundColor)) return 'bg';
    return null; };
  const out = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (keep(el)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) continue;
    if (r.width * r.height > 0.5 * vw * vh) continue;   // a ground (the room, the stage), not a piece of chrome
    const kind = paints(el); if (!kind) continue;
    const o = eff(el); if (o <= 0.01) continue;
    out.push({ el: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : ''), kind, o: Math.round(o * 1000) / 1000 });
  }
  return out;
})()`;
const EFF = (sel) => `(() => { const el = document.querySelector(${J(sel)}); if (!el) return null; let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= parseFloat(cs.opacity); } return Math.round(o * 1000) / 1000; })()`;
const openPage = async (app, id) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.desk-frame')", { label: id, timeout: 10000 });
  await sleep(1200);
  return there;
};
const typeOn = async (app) => {
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  await app.mouseMove(683, 400);
  await app.typeKeys(' and on');
  await sleep(FADE_WAIT);
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  for (const th of THEMES) {
    const id = `p10r-${th.id}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: TEXT, createdAt: new Date().toISOString(), origin: null, source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${id}', 'off')`);
  }
  await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
  ok('fixture: one Draft page per skin through the seams', true);

  for (const th of THEMES) {
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}')`); await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
    const tag = `${th.name} 1366x768`;
    if (!(await openPage(app, `p10r-${th.id}`))) { ok(`${tag} fixture: the page opened`, false, ''); continue; }
    await typeOn(app);
    const writing = await app.evalJs("document.querySelector('.desk-frame')?.getAttribute('data-writing')");
    const left = await app.evalJs(CENSUS);
    ok(`${tag} R1 (premise): the writer is writing (the desk dissolved)`, writing === 'true', String(writing));
    ok(`${tag} R1: THE CENSUS - nothing off the page paints while typing (effective opacity 0)${left.length ? ` - still showing: ${left.slice(0, 6).map((x) => x.el).join(', ')}` : ''}`, left.length === 0, J(left.slice(0, 12)));
    const pageO = await app.evalJs(EFF('.desk-frame-stage--prose .mode-page')); const edO = await app.evalJs(EFF('.forward-only-editor'));
    ok(`${tag} R2: the page itself stays - the page ${pageO}, its text ${edO}`, pageO >= 0.99 && edO >= 0.99, J({ pageO, edO }));
    const gs = await app.evalJs(EFF('.wz-sliver-grip')); const gt = await app.evalJs(EFF('.wz-tutor-grip'));
    ok(`${tag} R3: the two tab arrows stay - Tools ${gs}, Tutor ${gt}`, gs >= 0.9 && gt >= 0.9, J({ gs, gt }));
    if (th.id === 'plateau') {
      await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'p10r-mr1'; s.textContent = '.brand-mark{ opacity: 1 !important; }'; document.head.appendChild(s); return true; })()"); await sleep(200);
      const lm = await app.evalJs(CENSUS);
      await app.evalJs("document.getElementById('p10r-mr1')?.remove()");
      ok(`MR1 (mutant): with the wordmark forced to full strength, R1 fails and names it`, lm.some((x) => /brand-mark/.test(x.el)), J(lm.slice(0, 6)));
    }
    // R4: Escape brings it back
    const p = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(2000);
    const r4 = { strip: await app.evalJs(EFF('.desk-frame-strip')), bar: await app.evalJs(EFF('.sprint-nav')) };
    ok(`${tag} R4: it returns as today - Escape brings the rail (${r4.strip}) and the mode bar (${r4.bar}) back above half strength within 2s`, r4.strip > 0.5 && r4.bar > 0.5, J(r4));
    // R5: keyboard focus restores it
    await typeOn(app);
    const before = await app.evalJs(EFF('.desk-frame-strip'));
    await app.evalJs("(() => { const b = document.querySelector('.desk-frame-strip button, .desk-frame-strip [tabindex]'); if (b) b.focus(); return !!b; })()");
    await sleep(2000);
    const after = { strip: await app.evalJs(EFF('.desk-frame-strip')), bar: await app.evalJs(EFF('.sprint-nav')) };
    ok(`${tag} R5: keyboard focus restores it - focus on the rail's first item brings the chrome back (rail ${before} -> ${after.strip}, bar ${after.bar})`, before <= 0.01 && after.strip > 0.5 && after.bar > 0.5, J({ before, after }));
  }

  // R7 + R8 (each skin, 1366): progress strips and a docked panel stay
  for (const th of THEMES) {
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}')`); await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
    if (!(await openPage(app, `p10r-${th.id}`))) { ok(`${th.name} R7 fixture: the page opened`, false, ''); continue; }
    await typeOn(app);
    const prog = await app.evalJs(`[...document.querySelectorAll('.desk-frame-instrument, .wz-rhizome-field, .machina-run, .glitch-meter-layer')].filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return { el: String(el.className).split(' ')[0], o: Math.round(o * 1000) / 1000 }; })`);
    ok(`${th.name} R7: every progress strip that is on stays visible and live while typing (${prog.map((p) => p.el + ' ' + p.o).join(', ') || 'none found'})`, prog.length > 0 && prog.every((p) => p.o >= 0.99), J(prog));
    // R8: dock the Tutor, type, wait - it stays
    if ((await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open')")) !== 'true') await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
    await sleep(600);
    await app.evalJs("document.querySelector('.wz-tutor-dock-btn')?.click()"); await sleep(500);
    const docked = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-docked')");
    await typeOn(app);
    const dockO = await app.evalJs(EFF('.wz-tutor-panel'));
    ok(`${th.name} R8: a DOCKED panel stays visible while typing (the docked Tutor at ${dockO})`, docked === 'true' && dockO >= 0.99, J({ docked, dockO }));
    await app.evalJs("document.querySelector('.wz-tutor-dock-btn')?.click()"); await sleep(300);
  }

  // R9 (Arbor): the narrow layout follows the full recede
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs("localStorage.setItem('wrizo-theme', 'plateau')"); await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.emulateDpr(1, 1000, 800);
  if (await waitSoft(app, "true", { timeout: 100 }) && (await (async () => { await app.evalJs("location.hash = '#/page/p10r-plateau'"); return waitSoft(app, "!!document.querySelector('.forward-only-editor')", { timeout: 10000 }); })())) {
    await sleep(1200);
    await typeOn(app);
    const framedNow = await app.evalJs("!!document.querySelector('.desk-frame')");
    const left9 = await app.evalJs(CENSUS);
    ok(`Arbor 1000x800 R9: the NARROW layout (unframed: ${!framedNow}) follows the full recede - nothing off the page paints while typing${left9.length ? ` - still showing: ${left9.slice(0, 6).map((x) => x.el).join(', ')}` : ''}`, !framedNow && left9.length === 0, J(left9.slice(0, 12)));
  } else ok('R9 fixture: the narrow page opened', false, '');
  await app.emulateDpr(1, 1366, 768);

  // R6 (Arbor): with 'partial' stored, the framed desk still recedes to 0 (Nick: everything)
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs("localStorage.setItem('wrizo-theme', 'plateau'); localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), fadeDepth: 'partial' }))");
  await app.reload(); await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  if (await openPage(app, 'p10r-plateau')) {
    await typeOn(app);
    const strip = await app.evalJs(EFF('.desk-frame-strip'));
    ok(`Arbor R6: with 'partial' stored (the old default), the framed desk still recedes to 0 - the rail at ${strip}`, strip <= 0.01, String(strip));
    const { readFileSync } = await import('node:fs'); const { fileURLToPath } = await import('node:url'); const { dirname, join } = await import('node:path');
    const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'components');
    const offered = ['Sliver.tsx', 'ModeStage.tsx'].filter((f) => /<Seg label=\{<>\{(?:t|deskLex)\('fadeDepthLabel'\)/.test(readFileSync(join(srcDir, f), 'utf8')));
    ok('R6 (source): "Recede depth" is offered nowhere - neither the Tools drawer nor the narrow layout\'s settings panel renders its row (Nick: REMOVED)', offered.length === 0, J(offered));
  } else ok('R6 fixture: the page opened', false, '');
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 700)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-RECEDE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-RECEDE VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-RECEDE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
