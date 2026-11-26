// #134 - A LONG PAGE OPENS WITH THE WRITING LINE ON SCREEN (Fable, Nov 25, from polish10-hint's reads: after typing at the end of a freshly opened long page in Flux's Wire In the writing line was still off screen).
// Free Write (the Typewriter; Wire In in Flux) on a long saved page of two shapes (one long paragraph; forty paragraphs), at 1366, 1920 and 2560; Arbor and Machina at 1366 for comparison. The writer's own paths only:
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
const SEEDS = {
  line: Array.from({ length: 40 }, (_, i) => PARA(i)).join(' '),
  page: Array.from({ length: 40 }, (_, i) => PARA(i)).join(String.fromCharCode(10, 10)),
};
const ARMS = [
  { theme: 'flux', w: 1366, h: 768 }, { theme: 'flux', w: 1920, h: 1080 }, { theme: 'flux', w: 2560, h: 1440 },
  { theme: 'plateau', w: 1366, h: 768 }, { theme: 'machina', w: 1366, h: 768 },
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
    for (const [shape, text] of Object.entries(SEEDS)) {
      const tag = `${arm.theme} ${arm.w} ${shape}`;
      const id = `wol-${arm.theme}-${arm.w}-${shape}`;
      await app.emulateDpr(1, arm.w, arm.h);
      await ev("location.hash = '#/'; true"); await sleep(300);
      await ev(`window.wrizoCreateJournalPage(${J({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);
      await ev(`localStorage.setItem('wrizo-theme', ${J(arm.theme)}); localStorage.removeItem('wrizo-mode-page-${id}'); history.replaceState(null, '', '/#/'); true`);
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
    }
  }
  ok('MUT: the judge goes RED on a line below the window', !onScreen({ top: 900, bottom: 940, vh: 768 }) && onScreen({ top: 400, bottom: 440, vh: 768 }));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nWIREIN-OPEN-LINE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nWIREIN-OPEN-LINE VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nWIREIN-OPEN-LINE VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
