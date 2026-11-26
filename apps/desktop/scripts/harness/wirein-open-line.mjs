// #134 - A LONG PAGE OPENS WITH THE WRITING LINE ON SCREEN (Fable, Nov 25, from polish10-hint's reads: after typing at the end of a freshly opened long page in Flux's Wire In the writing line was still off screen).
// Free Write (the Typewriter; Wire In in Flux) on a long saved page (forty paragraphs) of three kinds (loose, Journal entry, legacy), at 1366, 1920 and 2560; Arbor and Machina at 1366 for comparison. The writer's own paths only:
//   O1  opened from the Desk, nothing done: the page's last line stands inside the window
//   O2  opened by a load of the page's own address, nothing done: the same
//   O3  then she types (the editor focused, no caret moved by the fixture): her words land, and the writing line stands inside the window
//   MUT the judge goes RED on a line below the window
// Each read prints the hold's own trace (window.__wzTwTrace, useTypewriterFade), where the line stood, the scroll and its end.
// Seeding goes through the app's seams. Run: node scripts/harness/wirein-open-line.mjs (from apps/desktop; Actions or the box).
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 900) : ''}`); };
const J = (v) => JSON.stringify(v);
const PARA = (i) => `Paragraph ${i} of the draft: she kept going, and the river ran under the window of the room where she had left her coat, and word${i} stayed.`;
// the page's kinds: a loose page (Free Write is its own default); a Journal entry and a legacy page with no origin (both carry the page's furniture above her words; Free Write is the stored choice)
const LONG = Array.from({ length: 40 }, (_, i) => PARA(i)).join(String.fromCharCode(10, 10));
const SENTENCES = [
  'The rope was already there, and the well took the bucket back colder still.',
  'Whatever is worth carrying is already with you, and the rest the wind can have.',
  'We left the map on the stone and walked until the light went thin over the ridge.',
];
const HINT_PARA = (() => { let t = ''; let i = 0; while (t.length < 2600) { t += (t ? ' ' : '') + SENTENCES[i % SENTENCES.length]; i += 1; } return t; })();
const SEEDS = {
  hint: { text: HINT_PARA, origin: null, mode: 'journal' },
  loose: { text: LONG, origin: 'loose', mode: null },
  journal: { text: LONG, origin: 'journal', mode: 'journal' },
  legacy: { text: LONG, origin: null, mode: 'journal' },
};
const ARMS = [
  { theme: 'flux', w: 1366, h: 768, seeds: ['hint', 'loose', 'journal', 'legacy'] }, { theme: 'flux', w: 1920, h: 1080, seeds: ['hint', 'loose'] }, { theme: 'flux', w: 2560, h: 1440, seeds: ['loose'] },
  { theme: 'plateau', w: 1366, h: 768, seeds: ['loose', 'journal', 'legacy'] }, { theme: 'machina', w: 1366, h: 768, seeds: ['loose'] },
];
// the last line of her words and the window; the judge: the whole line inside it
const READ = `(() => {
  const ed = document.querySelector('.forward-only-editor'); if (!ed) return null;
  const walk = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let q = null;
  for (let n = walk.lastChild(); n; n = walk.previousNode()) { if (!n.data.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); const rs = r.getClientRects(); if (rs.length) { q = rs[rs.length - 1]; break; } }
  const s = document.querySelector('.mode-scroll'); const trace = window.__wzTwTrace || [];
  return { top: q ? Math.round(q.top) : null, bottom: q ? Math.round(q.bottom) : null, vh: innerHeight, zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null,
    jacked: document.documentElement.hasAttribute('data-flux3-jacked'), scroll: s ? Math.round(s.scrollTop) : null, max: s ? s.scrollHeight - s.clientHeight : null,
    focused: document.activeElement === ed, chars: ed.textContent.replace(/\\u200b/g, '').length,
    trace: trace.slice(0, 3).concat(trace.length > 3 ? trace.slice(-5) : []), steps: trace.length };
})()`;
// WOL_ONLY: a short diagnostic run reads one kind of page
const ONLY = 'loose';
const onScreen = (g) => !!g && g.top != null && g.top >= 0 && g.bottom <= g.vh;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const soft = async (expr, timeout = 15000) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout }); return true; } catch { return false; } };
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__wzTwTrace = [];' });
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  // the scroller still for 1 s (capped at 20 s)
  const settle = async () => { const t0 = Date.now(); let last = null; let still = 0;
    while (Date.now() - t0 < 20000) { await sleep(200); const top = await ev("document.querySelector('.mode-scroll')?.scrollTop ?? null"); if (top != null && top === last) { still += 200; if (still >= 1000) return; } else { still = 0; last = top; } } };
  const arrive = async () => { await soft("!!document.querySelector('.forward-only-editor')"); await soft("!document.querySelector('.wz-splash')"); await sleep(4600); await settle(); return ev(READ); };

  for (const arm of ARMS) {
    for (const shape of arm.seeds.filter((k) => !ONLY || k === ONLY)) {
      const { text, origin, mode } = SEEDS[shape];
      const tag = `${arm.theme} ${arm.w} ${shape}`;
      const id = `wol-${arm.theme}-${arm.w}-${shape}`;
      await app.emulateDpr(1, arm.w, arm.h);
      await ev("location.hash = '#/'; true"); await sleep(300);
      await ev(`window.wrizoCreateJournalPage(${J({ id, text, createdAt: new Date().toISOString(), origin, source: 'page' })}); window.wrizoFlushNow(); true`);
      await ev(`localStorage.setItem('wrizo-theme', ${J(arm.theme)}); ${mode ? `localStorage.setItem('wrizo-mode-page-${id}', '${mode}')` : `localStorage.removeItem('wrizo-mode-page-${id}')`}; history.replaceState(null, '', '/#/'); true`);
      await app.reload();
      await soft("!!document.querySelector('.wz-arrival')"); await soft("!document.querySelector('.wz-splash')"); await sleep(500);
      await ev(`window.__wzTwTrace.length = 0; location.hash = '#/page/${id}'; true`);
      const a = await arrive();
      ok(`O1 ${tag}: opened from the Desk, nothing done, the last line is inside the window`, !!a && a.zoom === 'true' && onScreen(a), J(a));
      await app.reload();
      const b = await arrive();
      ok(`O2 ${tag}: loaded at the page's own address, nothing done, the last line is inside the window`, !!b && b.zoom === 'true' && onScreen(b), J(b));
      await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
      await sleep(300);
      await app.typeKeys(' and on');
      await sleep(600); await settle();
      const c = await ev(READ);
      ok(`O3 ${tag}: she types: the words land and the writing line is inside the window`, !!c && !!b && c.chars >= b.chars + 6 && onScreen(c), J(c));

      // EARLY ACTS: she does something before the page has finished opening. Each from the Desk again
      const early = async (wait, act) => {
        await ev("location.hash = '#/'; true"); await soft("!!document.querySelector('.wz-arrival')"); await sleep(500);
        await ev(`window.__wzTwTrace.length = 0; location.hash = '#/page/${id}'; true`);
        await soft("!!document.querySelector('.forward-only-editor')");
        await sleep(wait);
        const before = await ev(READ);
        await act();
        await sleep(2000); await settle();
        return { before, after: await ev(READ) };
      };
      const typed = (r) => !!r.after && !!r.before && r.after.chars >= r.before.chars + 6;
      const d = await early(150, async () => { await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true"); await app.typeKeys(' and on'); });
      ok(`O4 ${tag}: she types 150 ms after the page appears: the words land and the writing line is inside the window`, typed(d) && onScreen(d.after), J({ lineBefore: d.before && d.before.bottom, ...d.after }));
      const e = await early(150, async () => { const x = Math.round(arm.w / 2), y = Math.round(arm.h * 0.4); await app.mouseMove(x, y); await app.mouseDown(x, y); await app.mouseUp(x, y); });
      ok(`O5 ${tag}: she presses on the page 150 ms after it appears: the writing line is inside the window`, onScreen(e.after), J({ lineBefore: e.before && e.before.bottom, ...e.after }));
      // polish10-hint's own steps (the reads this bug came from): 900 ms, the caret put at the end by the fixture (a focus that may scroll), then typing
      const f = await early(900, async () => { await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()"); await app.typeKeys(' and on'); });
      // SHE SCROLLS UP TO READ, THEN WRITES ON: the page opened and settled, the wheel taken far up, then keys
      await ev("location.hash = '#/'; true"); await soft("!!document.querySelector('.wz-arrival')"); await sleep(500);
      await ev(`location.hash = '#/page/${id}'; true`); await arrive();
      await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round(arm.w / 2), y: Math.round(arm.h * 0.4), deltaX: 0, deltaY: -1200, pointerType: 'mouse' });
      await sleep(900); await settle();
      const g0 = await ev(READ);
      await app.typeKeys(' and on'); await sleep(900); await settle();
      const g1 = await ev(READ);
      ok(`O7 ${tag}: she scrolled up (the line left the window: ${g0 && g0.top}px of ${g0 && g0.vh}) and typed: the words land and the writing line is back inside the window`, !!g0 && !!g1 && !onScreen(g0) && g1.chars >= g0.chars + 6 && onScreen(g1), J({ before: g0 && g0.top, ...g1 }));
      ok(`O6 ${tag}: polish10-hint's steps (a fixture focus and caret at 900 ms, then typing): the writing line is inside the window`, typed(f) && onScreen(f.after), J({ lineBefore: f.before && f.before.bottom, ...f.after }));
    }
  }
  ok('MUT: the judge goes RED on a line below the window', !onScreen({ top: 900, bottom: 940, vh: 768 }) && onScreen({ top: 400, bottom: 440, vh: 768 }));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nWIREIN-OPEN-LINE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nWIREIN-OPEN-LINE VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nWIREIN-OPEN-LINE VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
