// POLISH #10, FIX item 22 (Nick's live test of #7, Oct 25): NO SCROLLBAR FLASH OR FLICKER WHEN A DRAWER OPENS OR CLOSES on the Page. Captured frame by
// frame: the page's rect, its scale and the scrollbar's painted width stay constant through the motion. RED-FIRST, on main @ 28aa6aab.
//
// A sampler runs in the page on every animation frame from a TRUSTED click on a drawer's tab until 1.2s after it, reading: the painted page's rect
// (.mode-page), its scale (rect width / layout width), the page scroller's bar (.mode-scroll: offsetWidth - clientWidth - its side borders), and the
// document's own bars (innerWidth - the root's clientWidth; innerHeight - its clientHeight) - a bar that appears for even one frame is the flash.
// Arbor, a LONG Draft page (it scrolls, so its bar is real), at 1366x768 and 1920x1080, the normal view; each of the two drawers opened and closed.
//   S1  through every frame of each toggle the page's rect and scale never change (+-0.5px, +-0.001)
//   S2  through every frame the page's own bar keeps one width, and the document never shows a bar of its own
// Each reading carries the frames that broke it (and what each read), so a red run is also the diagnosis.
// Mutant (1366, Tools open): MS2 the document's own bar forced on for the motion - S2 fails.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-scrollbar.mjs (apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const PARA = 'The rope was already there, and the well took the bucket back colder still. Whatever is worth carrying is already with you, and the rest the wind can have. We left the map on the stone and walked until the light went thin over the ridge.';
const TEXT = Array.from({ length: 14 }, () => PARA).join('\n');
const HANDS = { tools: { grip: '.wz-sliver-grip', panel: '.wz-sliver-panel', name: 'Tools' }, tutor: { grip: '.wz-tutor-grip', panel: '.wz-tutor-panel', name: 'Tutor' } };

const ARM = (gripSel) => `(() => { const grip = document.querySelector('${gripSel}'); if (!grip) return false;
  const read = () => { const p = document.querySelector('.mode-page'); const s = document.querySelector('.mode-scroll'); const de = document.documentElement;
    const r = p ? p.getBoundingClientRect() : null; const sc = s ? getComputedStyle(s) : null;
    return { page: r ? { l: Math.round(r.left * 10) / 10, t: Math.round(r.top * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 } : null,
      k: p && p.offsetWidth ? Math.round(r.width / p.offsetWidth * 10000) / 10000 : null,
      bar: s ? s.offsetWidth - s.clientWidth - (parseFloat(sc.borderLeftWidth) || 0) - (parseFloat(sc.borderRightWidth) || 0) : null,
      scrollH: s ? s.scrollHeight > s.clientHeight + 1 : null,
      docX: innerWidth - de.clientWidth, docY: innerHeight - de.clientHeight }; };
  const samples = [{ t: -1, ...read() }]; let t0 = null;
  window.__p10sDone = new Promise((res) => {
    grip.addEventListener('pointerdown', () => { t0 = performance.now(); }, { capture: true, once: true });
    const t1 = performance.now();
    const tick = () => { const now = performance.now(); if (t0 != null) samples.push({ t: Math.round(now - t0), ...read() });
      if ((t0 != null && now - t0 > 1200) || now - t1 > 6000) res({ clicked: t0 != null, samples }); else requestAnimationFrame(tick); };
    requestAnimationFrame(tick); });
  return true; })()`;
const center = async (app, sel) => app.evalJs(`(() => { const e = document.querySelector('${sel}'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const toggle = async (app, h) => {
  const c = await center(app, h.grip); if (!c) return null;
  if (!(await app.evalJs(ARM(h.grip)))) return null;
  await app.mouseMove(c.x, c.y); await sleep(60);
  await app.mouseDown(c.x, c.y); await app.mouseUp(c.x, c.y);
  return app.evalJs('window.__p10sDone');
};
// the frames that differ from the first (the rest state the motion started from)
const pageBreaks = (S) => { const z = S[0]; return S.filter((s) => !s.page || !z.page || Math.abs(s.page.l - z.page.l) > 0.5 || Math.abs(s.page.t - z.page.t) > 0.5
  || Math.abs(s.page.w - z.page.w) > 0.5 || Math.abs(s.page.h - z.page.h) > 0.5 || s.k == null || Math.abs(s.k - z.k) > 0.001); };
const barBreaks = (S) => { const z = S[0]; return S.filter((s) => s.bar !== z.bar || s.docX !== 0 || s.docY !== 0); };

await withHarness(async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-theme','plateau')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  for (const [w, h] of [[1366, 768], [1920, 1080]]) {
    await app.emulateDpr(1, w, h);
    const id = `p10s-${w}`;
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: TEXT, createdAt: new Date().toISOString(), origin: null, source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${id}', 'off')`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    const opened = await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip') && !!document.querySelector('.wz-tutor-grip')", { label: id, timeout: 10000 });
    if (!opened) { ok(`${w}x${h} fixture: the Draft page opened with both drawer tabs`, false); continue; }
    await sleep(1200);
    for (const k of ['tools', 'tutor']) {
      for (const phase of ['open', 'close']) {
        const tag = `${w}x${h} ${HANDS[k].name} ${phase}`;
        const tl = await toggle(app, HANDS[k]);
        const S = tl && tl.samples;
        const z = S && S[0];
        ok(`${tag} (premise): a trusted click on the tab, the page in the normal view and long enough to scroll (its own bar real), every frame read`,
          !!tl && tl.clicked && !!z && !!z.page && z.k != null && z.scrollH === true && z.bar > 0 && S.length > 20
            && (await app.evalJs("document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') !== 'true'")), J(z && { first: z, frames: S.length }));
        if (!S) continue;
        const pb = pageBreaks(S); const bb = barBreaks(S);
        ok(`${tag} S1: the page's rect and scale hold through every frame (${pb.length} of ${S.length} frames moved)`, pb.length === 0, J({ first: z, broke: pb.slice(0, 6) }));
        ok(`${tag} S2: the page's bar keeps one width (${z.bar}px) and the document shows no bar of its own (${bb.length} of ${S.length} frames broke it)`, bb.length === 0, J({ first: z, broke: bb.slice(0, 6) }));
        if (w === 1366 && k === 'tools' && phase === 'open') {
          // MS2: close it again with the document's own bar forced on for the motion - S2 must fail
          const css = 'html{ overflow-y: scroll !important; }';
          await app.evalJs(`(() => { const s = document.createElement('style'); s.id = 'p10s-ms2'; s.textContent = ${J(css)}; document.head.appendChild(s); return true; })()`); await sleep(200);
          const tm = await toggle(app, HANDS[k]);
          await app.evalJs("document.getElementById('p10s-ms2')?.remove()"); await sleep(300);
          const mb = tm ? barBreaks(tm.samples) : [];
          ok(`MS2 (mutant): with the document's own bar forced on (LANDED: docX ${tm && tm.samples[1] && tm.samples[1].docX}px), S2 fails`, !!tm && tm.samples.some((s) => s.docX > 0) && mb.length > 0, J(mb.slice(0, 3)));
          await toggle(app, HANDS[k]);   // open again, so the close below starts from open
        }
        await sleep(500);
      }
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 1400)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-SCROLLBAR PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-SCROLLBAR VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-SCROLLBAR VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
