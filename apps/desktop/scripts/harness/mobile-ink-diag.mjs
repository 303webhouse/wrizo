// MOBILE INK DIAGNOSTIC (bug-list #43, FIX, Nov 4) - REPORT ONLY, no verdict, no product change. Nick's phone: "the live app looks like a very old version and a stylus can't draw (it
// only scrolls or moves the caret)". Two questions, answered on the CURRENT build (dist-web = main) under mobile emulation, with a desktop-width control on the same build:
//   Q1  is it a stale cached bundle, or the real layout?   (the server's headers and the live build stamp are read separately - curl; here: what the build itself renders at a phone width)
//   Q2  how do pen and touch reach the ink layer?          (a pen stroke = CDP Input.dispatchMouseEvent with pointerType 'pen'; a finger stroke = Input.dispatchTouchEvent)
// Every line printed is `DIAG <name> <json>`; screenshots go to $DIAG_OUT (default: the working directory).
// Run: node scripts/harness/mobile-ink-diag.mjs   (from apps/desktop, dist-web built, box turn granted)
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = process.env.DIAG_OUT || process.cwd();
const ED = '.forward-only-editor';
const LINES = Array.from({ length: 14 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the page the writer is in, long enough to wrap on a phone.`).join('\n');
const say = (name, v) => console.log(`DIAG ${name} ${JSON.stringify(v)}`);
const UA = 'Mozilla/5.0 (Linux; Android 15; SM-S931U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

await withHarness(async (app) => {
  const shot = async (name) => {
    try { const r = await app.cdp('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }); fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(r.data, 'base64')); } catch (e) { say(`${name}.shot-failed`, String(e).slice(0, 100)); }
  };
  const phone = async () => {
    await app.cdp('Emulation.setDeviceMetricsOverride', { width: 360, height: 780, deviceScaleFactor: 3, mobile: true });
    await app.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await app.cdp('Emulation.setUserAgentOverride', { userAgent: UA });
  };
  const wide = async () => {
    await app.cdp('Emulation.setTouchEmulationEnabled', { enabled: false });
    await app.cdp('Emulation.setUserAgentOverride', { userAgent: '' });
    await app.cdp('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
  };
  const facts = () => app.evalJs(`(() => { const q = (s) => !!document.querySelector(s); const tabs = [...document.querySelectorAll('[role="tab"]')].map((t) => (t.textContent || '').trim()).slice(0, 12);
    return { w: innerWidth, h: innerHeight, deskFrame: q('.desk-frame-host'), deskRail: q('.desk-rail, [data-desk-rail]'), sliverGrip: q('.wz-sliver-grip'), editor: q('${ED}'), modeStrip: q('.desk-mode-strip, .mode-tabs'),
      tabs, inkTab: tabs.some((t) => /^ink$/i.test(t)), bodyClass: document.body.className.slice(0, 80) }; })()`);
  const fresh = async () => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 15000 });
  };
  const openPage = async (id) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(400);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
    await sleep(900);
  };
  const strokeCount = async (id) => { await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()'); await sleep(250);
    return app.evalJs(`(() => { const e = (JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).find((x) => x.id === ${JSON.stringify(id)}); return e && Array.isArray(e.strokes) ? e.strokes.length : 0; })()`); };
  const probe = () => app.evalJs(`(() => { const s = getSelection(); const sc = document.querySelector('.mode-scroll'); return { selAt: s.anchorNode ? (s.anchorNode.nodeValue || '').length + ':' + s.anchorOffset : null, collapsed: s.isCollapsed, scrollTop: sc ? Math.round(sc.scrollTop) : null }; })()`);
  // aimed as item121 aims (fractions of the sheet's text box, through a pointer-transparent marker laid over it), with the harness's own trusted pen (CDP mouse, pointerType 'pen') and touch drivers
  const SHEET = '.wz-ink-sheet';
  const aim = async () => app.evalJs(`(() => { const s = document.querySelector('${SHEET}'); if (!s) return null; const sc = document.querySelector('.mode-scroll'); const r = s.getBoundingClientRect(); const cs = getComputedStyle(s);
    const k = s.offsetWidth > 0 ? r.width / s.offsetWidth : 1; const pt = (parseFloat(cs.paddingTop) || 0) * k; const pb = (parseFloat(cs.paddingBottom) || 0) * k; const pl = (parseFloat(cs.paddingLeft) || 0) * k; const pr = (parseFloat(cs.paddingRight) || 0) * k;
    const vis = sc ? sc.getBoundingClientRect() : { top: 0, bottom: innerHeight };
    const top = Math.max(r.top + pt, vis.top + 10), bottom = Math.min(r.bottom - pb, vis.bottom - 10);
    let m = document.getElementById('diag-aim'); if (!m) { m = document.createElement('div'); m.id = 'diag-aim'; document.body.appendChild(m); }
    m.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;left:' + (r.left + pl) + 'px;top:' + top + 'px;width:' + (r.width - pl - pr) + 'px;height:' + Math.max(40, bottom - top) + 'px';
    return '#diag-aim'; })()`);
  const arc = (n = 14, y0 = 0.35) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return { x: 0.2 + 0.6 * t, y: y0 + 0.18 * Math.sin(Math.PI * t) }; });
  const penStroke = async (y0) => { const a = await aim(); if (!a) return false; await app.penStroke(a, arc(14, y0)); return true; };
  const fingerStroke = async (y0) => { const a = await aim(); if (!a) return false; await app.touchDrag(a, arc(14, y0)); return true; };
  const setInk = async () => {
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(400);
    const r = await app.evalJs("(() => { const b = document.querySelector('#wz-sliver-tab-ink'); if (!b) return 'no-ink-tab'; b.click(); return 'clicked'; })()"); await sleep(500);
    return r;
  };
  const tryStep = async (name, fn) => { try { await fn(); } catch (e) { say(`${name}.error`, String(e && e.message || e).slice(0, 200)); } };

  // ---- 1) THE SAME BUILD AT A PHONE WIDTH AND AT A DESK WIDTH: which layout does it render
  await fresh();
  await wide(); await sleep(500); say('desk@1400', await facts()); await shot('desk-1400');
  await phone(); await sleep(700); say('desk@360', await facts()); await shot('desk-360');

  // ---- 2) A FREE WRITE PAGE AT A PHONE WIDTH: is there a way to choose INK, and what does a pen / a finger do in TEXT
  await tryStep('page@360', async () => {
    await fresh(); await phone(); await app.reload(); await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk 360' }); await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash', timeout: 15000 });
    await openPage('mi1');
    say('page@360', { ...(await facts()), sheet: await app.evalJs(`!!document.querySelector('${SHEET}')`), sliverTabInk: await app.evalJs("!!document.querySelector('#wz-sliver-tab-ink')") }); await shot('page-360');
    const before = await probe();
    const drew = await penStroke(0.35); await sleep(300);
    const afterPen = await probe(); say('pen-in-TEXT@360', { drew, before, afterPen, strokes: await strokeCount('mi1'), text: await app.evalJs(`document.querySelector('${ED}').innerText.length`) });
    const f = await fingerStroke(0.55); await sleep(300);
    say('finger-in-TEXT@360', { drew: f, afterPen, afterFinger: await probe(), strokes: await strokeCount('mi1') });
  });

  // ---- 3) THE CONTROL AT A DESK WIDTH: the same pen in TEXT (inert) and then INK chosen in the drawer (a stroke), a finger after a pen was seen; then the SAME page narrowed to a phone with INK still on
  await tryStep('page@1400', async () => {
    await fresh(); await wide(); await app.reload(); await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk 1400' }); await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash', timeout: 15000 });
    await openPage('mi2');
    say('page@1400', await facts());
    const b0 = await probe(); const d0 = await penStroke(0.35); await sleep(300);
    say('pen-in-TEXT@1400', { drew: d0, before: b0, after: await probe(), strokes: await strokeCount('mi2'), text: await app.evalJs(`document.querySelector('${ED}').innerText.length`) });
    const chose = await setInk(); say('choose-INK@1400', { chose, facts: await facts() }); await shot('ink-1400');
    const d1 = await penStroke(0.35); await sleep(400);
    say('pen-in-INK@1400', { drew: d1, strokes: await strokeCount('mi2') });
    const d2 = await fingerStroke(0.55); await sleep(400);
    say('finger-in-INK@1400-after-pen-seen', { drew: d2, strokes: await strokeCount('mi2'), probe: await probe() });
    await phone(); await sleep(900);
    say('narrowed@360', { ...(await facts()), sheet: await app.evalJs(`!!document.querySelector('${SHEET}')`) }); await shot('ink-narrowed-360');
    const d3 = await penStroke(0.7); await sleep(400);
    say('pen-in-INK-narrowed@360', { drew: d3, strokes: await strokeCount('mi2') });
    const d4 = await fingerStroke(0.8); await sleep(400);
    say('finger-in-INK-narrowed@360', { drew: d4, strokes: await strokeCount('mi2'), probe: await probe() });
  });
});
