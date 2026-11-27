// #134 - A TYPED KEY BRINGS THE WRITING LINE BACK (Fable, Nov 26, 11:15 am, Q1 BUILD): a typed key with the writing line outside the window lands the line at the hold in one cut, the same step as on opening.
// Scrolling alone never moves it. Every theme and every writing mode that holds a line: that is Free Write (ModeStage runs the hold there only; Wire In in Flux). Draft holds no line.
// A long loose page (forty paragraphs; a Journal entry too in Flux), at 1366, 1920 and 2560; Arbor and Machina at 1366. The writer's own paths:
//   O1  opened from the Desk, nothing done: the last line stands inside the window
//   O3  she types: her words land and the writing line stays inside the window
//   O4  she types 150 ms after the page appears: the same
//   O8  she scrolls far up and does nothing: the line is outside the window and NOTHING moves it (3 s)
//   O7  then one key: the line is back at the hold at once (read 300 ms after the key: one cut, not a glide), and the rest of her words land
//   O9  the same for Backspace alone
//   O10 a small scroll that leaves the line in the window: typing does not cut (the scroll stays where she put it)
//   O11 the stored page holds every key she typed: nothing lost
//   MUT the judge goes RED on a line below the window
// Seeding goes through the app's seams. Run: node scripts/harness/wirein-open-line.mjs (from apps/desktop; Actions or the box).
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 700) : ''}`); };
const J = (v) => JSON.stringify(v);
const PARA = (i) => `Paragraph ${i} of the draft: she kept going, and the river ran under the window of the room where she had left her coat, and word${i} stayed.`;
const LONG = Array.from({ length: 40 }, (_, i) => PARA(i)).join(String.fromCharCode(10, 10));
const ARMS = [
  { theme: 'flux', w: 1366, h: 768, kind: 'loose' }, { theme: 'flux', w: 1366, h: 768, kind: 'journal' }, { theme: 'flux', w: 1920, h: 1080, kind: 'loose' }, { theme: 'flux', w: 2560, h: 1440, kind: 'loose' },
  { theme: 'plateau', w: 1366, h: 768, kind: 'loose' }, { theme: 'machina', w: 1366, h: 768, kind: 'loose' },
];
// the last line of her words and the window; the judge: the whole line inside it
const READ = `(() => {
  const ed = document.querySelector('.forward-only-editor'); if (!ed) return null;
  const walk = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let q = null;
  for (let n = walk.lastChild(); n; n = walk.previousNode()) { if (!n.data.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); const rs = r.getClientRects(); if (rs.length) { q = rs[rs.length - 1]; break; } }
  const s = document.querySelector('.mode-scroll');
  return { top: q ? Math.round(q.top) : null, bottom: q ? Math.round(q.bottom) : null, vh: innerHeight, zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null,
    scroll: s ? Math.round(s.scrollTop) : null, max: s ? s.scrollHeight - s.clientHeight : null, chars: ed.textContent.replace(/\\u200b/g, '').length, tail: ed.textContent.slice(-30) };
})()`;
const onScreen = (g) => !!g && g.top != null && g.top >= 0 && g.bottom <= g.vh;
const nw = (s) => String(s || '').replace(/[\s​ ]/g, '');

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const soft = async (expr, timeout = 15000) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout }); return true; } catch { return false; } };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  // the scroller still for 1 s (capped at 20 s)
  const settle = async () => { const t0 = Date.now(); let last = null; let still = 0;
    while (Date.now() - t0 < 20000) { await sleep(200); const top = await ev("document.querySelector('.mode-scroll')?.scrollTop ?? null"); if (top != null && top === last) { still += 200; if (still >= 1000) return; } else { still = 0; last = top; } } };

  for (const arm of ARMS) {
    const tag = `${arm.theme} ${arm.w} ${arm.kind}`;
    const id = `wol-${arm.theme}-${arm.w}-${arm.kind}`;
    const journal = arm.kind === 'journal';
    await app.emulateDpr(1, arm.w, arm.h);
    await ev("location.hash = '#/'; true"); await sleep(300);
    await ev(`window.wrizoCreateJournalPage(${J({ id, text: LONG, createdAt: new Date().toISOString(), origin: journal ? 'journal' : 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);
    await ev(`localStorage.setItem('wrizo-theme', ${J(arm.theme)}); ${journal ? `localStorage.setItem('wrizo-mode-page-${id}', 'journal')` : `localStorage.removeItem('wrizo-mode-page-${id}')`}; history.replaceState(null, '', '/#/'); true`);
    await app.reload();
    await soft("!!document.querySelector('.wz-arrival')"); await soft("!document.querySelector('.wz-splash')"); await sleep(500);
    const open = async (wait) => {
      await ev("location.hash = '#/'; true"); await soft("!!document.querySelector('.wz-arrival')"); await sleep(400);
      await ev(`location.hash = '#/page/${id}'; true`);
      await soft("!!document.querySelector('.forward-only-editor')");
      if (wait == null) { await sleep(4600); await settle(); } else await sleep(wait);
      await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
    };
    let typedSoFar = '';
    const type = async (text) => { typedSoFar += text; await app.typeKeys(text); };
    const read = () => ev(READ);
    const wheel = async (dy) => { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round(arm.w / 2), y: Math.round(arm.h * 0.4), deltaX: 0, deltaY: dy, pointerType: 'mouse' }); await sleep(900); await settle(); };

    await open(null);
    const a = await read();
    ok(`O1 ${tag}: opened from the Desk, nothing done, the last line is inside the window`, !!a && a.zoom === 'true' && onScreen(a), J(a));
    await type(' and on'); await sleep(600); await settle();
    const c = await read();
    ok(`O3 ${tag}: she types: the words land and the writing line is inside the window`, !!c && !!a && c.chars >= a.chars + 6 && onScreen(c), J(c));

    await open(150);
    const d0 = await read();
    await type(' early'); await sleep(2000); await settle();
    const d = await read();
    ok(`O4 ${tag}: she types 150 ms after the page appears: the words land and the writing line is inside the window`, !!d && !!d0 && d.chars >= d0.chars + 5 && onScreen(d), J(d));

    await open(null);
    const hold = await read();
    await wheel(-1200);
    const away = await read();
    await sleep(3000);
    const still = await read();
    ok(`O8 ${tag}: she scrolls far up and does nothing: the line is outside the window and nothing moves it`, !!away && !!still && !onScreen(away) && !onScreen(still) && Math.abs(still.scroll - away.scroll) <= 1, J({ away: away && { top: away.top, scroll: away.scroll }, still: still && { top: still.top, scroll: still.scroll } }));
    await type('x'); await sleep(300);
    const cut = await read();
    await type(' and on'); await sleep(600); await settle();
    const after = await read();
    ok(`O7 ${tag}: then one key: the line is back at the hold at once (300 ms after it), and her words land`, onScreen(cut) && !!hold && Math.abs(cut.top - hold.top) <= (hold.bottom - hold.top) * 2 && onScreen(after) && after.chars >= still.chars + 7,
      J({ hold: hold && hold.top, cutTop: cut && cut.top, vh: cut && cut.vh, cutScroll: cut && cut.scroll, away: still && still.top, tail: after && after.tail }));

    await wheel(-1200);
    const b0 = await read();
    await app.key('Backspace'); await sleep(300);
    const b1 = await read();
    ok(`O9 ${tag}: Backspace alone, with the line outside the window, brings it back`, !!b0 && !onScreen(b0) && onScreen(b1), J({ before: b0 && b0.top, after: b1 && b1.top, vh: b1 && b1.vh }));

    // a fresh open, so this case stands on its own: the line at the hold, then a small scroll
    await settle();
    await open(null);
    await wheel(-90);
    const s0 = await read();
    await type('q'); await sleep(600); await settle();
    const s1 = await read();
    ok(`O10 ${tag}: a small scroll leaves the line in the window; typing does not cut`, !!s0 && !!s1 && onScreen(s0) && Math.abs(s1.scroll - s0.scroll) <= 2, J({ before: s0 && { top: s0.top, scroll: s0.scroll }, after: s1 && { top: s1.top, scroll: s1.scroll } }));

    await ev('window.wrizoFlushNow(); true'); await sleep(500);
    const stored = await ev(`(() => { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || 'null'); const r = rows && rows.find((x) => x.id === ${J(id)}); return r ? r.text : null; })()`);
    // forward-only: the one Backspace (O9) STRIKES the last letter of the run before it, so that run is read without it; each typed run must be there, in order
    const runs = ['and on', 'early', 'x and o'];
    let at = nw(LONG).length; const bare = nw(stored); const found = runs.map((r) => { const i = bare.indexOf(nw(r), Math.max(0, at - 2)); if (i >= 0) at = i + nw(r).length; return i >= 0; });
    ok(`O11 ${tag}: the stored page holds every key she typed`, stored !== null && bare.startsWith(nw(LONG).slice(0, -2)) && found.every(Boolean) && bare.endsWith('q'), J({ found, tail: stored && String(stored).slice(-40) }));
  }
  ok('MUT: the judge goes RED on a line below the window', !onScreen({ top: 900, bottom: 940, vh: 768 }) && onScreen({ top: 400, bottom: 440, vh: 768 }));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nWIREIN-OPEN-LINE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nWIREIN-OPEN-LINE VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nWIREIN-OPEN-LINE VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
