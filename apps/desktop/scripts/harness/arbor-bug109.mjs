// #109 (FABLE, Nov 18, 1:45 pm: "night->day while typing cuts the page tone over at once: the switch waits for her next pause"). The redesign (no
// query); saved Page: Dark through the store's seam; the room through the product's own Room attribute (<html data-room>); her writing through
// real keys on the page (<html data-wz-writing>), her pause through Escape (the room's return - the ship frames' pause screen does the same). The
// page read AS DRAWN (a screen clip low in the page's box, per-channel median: arbor-page-tone.mjs's drawnPage):
//   H1 night -> day WHILE she writes: the page stays as drawn (dark; data-page dark) for a second and more of writing
//   H2 her pause (Escape): the held switch lands - the page drawn light, data-page light, the saved value still dark
//   H3 day -> night while she writes (saved dark): the page stays light while she writes, and goes dark at her pause
//   H4 AT REST the room's switch is not held: night -> day with no writing turns the page light at once (Nick's page-tone ruling, unchanged)
//   M1 (mutant) the old instant cut: data-page set to the room's tone while she writes (asserted LANDED) - H1's read goes RED
// RED FIRST: on main before the change H1 fails (the page turns light at once) and H3's first half fails.
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const PAGEBOX = "(() => { const e = document.querySelector('.mode-page') || document.querySelector('.mode-pagecol'); if (!e) return null; const r = e.getBoundingClientRect(); if (r.width < 120 || r.height < 160) return null; const bottom = Math.min(r.bottom, innerHeight); return { x: Math.round(r.left + r.width / 2 - 20), y: Math.round(Math.max(r.top + 120, bottom - 90)), w: 40, h: 40 }; })()";
const STATE = "(() => { const r = document.documentElement; let saved = null; try { saved = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || 'null'); } catch {} return { arbor: r.getAttribute('data-arbor2'), room: r.getAttribute('data-arbor2-room'), page: r.getAttribute('data-page'), writing: r.getAttribute('data-wz-writing'), saved: saved && saved.page }; })()";

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const drawnPage = async () => {
    const b = await app.evalJs(PAGEBOX); if (!b) return { drawn: null };
    const data = (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } })).data;
    const rgb = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const D = g.getImageData(0, 0, c.width, c.height).data; const med = (k) => { const v = []; for (let i = k; i < D.length; i += 4) v.push(D[i]); v.sort((a, b) => a - b); return v[v.length >> 1]; }; return [med(0), med(1), med(2)]; })()`);
    const lum = Array.isArray(rgb) ? (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 : null;
    return { rgb, drawn: lum == null ? null : lum > 0.5 ? 'light' : lum < 0.25 ? 'dark' : 'mid' };
  };
  const read = async () => ({ ...(await app.evalJs(STATE)), ...(await drawnPage()) });
  const setRoom = (room) => app.evalJs(`(() => { document.documentElement.setAttribute('data-room', ${J(room === 'day' ? 'light' : 'dark')}); return true; })()`);
  const open = async (room) => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
    await app.evalJs("localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' })); true");
    await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
    await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 20000 });
    const id = `arbor-109-${Math.random().toString(36).slice(2, 7)}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: 'A page through the dawn.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 15000 }); await sleep(800);
    await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
    await setRoom(room); await sleep(900);
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  };
  const write = async (n) => { for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); await sleep(90); } };
  const pause = async () => { await sleep(600); await app.key('Escape'); return waitSoft(app, "document.documentElement.getAttribute('data-wz-writing') !== 'true'", { label: 'her pause', timeout: 15000 }); };

  // H1 / H2: night -> day while she writes, then her pause
  await open('night');
  await write(6); const before = await read();
  await setRoom('day'); await write(8); await sleep(400); const during = await read();
  const h1 = (b, d) => b.room === 'night' && b.page === 'dark' && b.drawn === 'dark' && b.writing === 'true' && d.room === 'day' && d.writing === 'true' && d.page === 'dark' && d.drawn === 'dark';
  ok(`H1 night -> day WHILE she writes: the page stays as drawn (${before.drawn} -> ${during.drawn}; data-page ${during.page}, room ${during.room}, writing ${during.writing})`, h1(before, during), J({ before, during }));
  const paused = await pause(); await sleep(500); const after = await read();
  ok(`H2 her pause (Escape, returned ${paused}): the held switch lands - the page drawn ${after.drawn}, data-page ${after.page}, saved ${after.saved}`, paused && after.room === 'day' && after.page === 'light' && after.drawn === 'light' && after.saved === 'dark', J(after));
  // M1: the old instant cut, while she writes
  await open('night'); await write(6); await setRoom('day');
  await app.evalJs("document.documentElement.setAttribute('data-page', 'light')"); await write(4); await sleep(400); const m1 = await read();
  ok(`M1 (mutant): the old instant cut while she writes (LANDED: data-page ${m1.page}, drawn ${m1.drawn}) - H1's read goes RED`, m1.writing === 'true' && m1.page === 'light' && !h1({ ...before }, m1), J(m1));
  await pause();
  // H3: day -> night while she writes (saved dark): light held, dark at her pause
  await open('day'); await write(6); const dayBefore = await read();
  await setRoom('night'); await write(8); await sleep(400); const nightDuring = await read();
  const p3 = await pause(); await sleep(500); const nightAfter = await read();
  ok(`H3 day -> night while she writes: the page stays ${nightDuring.drawn} (data-page ${nightDuring.page}) while she writes, and is ${nightAfter.drawn} after her pause (${p3})`,
    dayBefore.page === 'light' && dayBefore.drawn === 'light' && nightDuring.room === 'night' && nightDuring.writing === 'true' && nightDuring.page === 'light' && nightDuring.drawn === 'light' && p3 && nightAfter.page === 'dark' && nightAfter.drawn === 'dark', J({ dayBefore, nightDuring, nightAfter }));
  // H4: at rest the switch is not held
  await open('night'); await app.evalJs("document.querySelector('.forward-only-editor')?.blur()"); await sleep(300); const restBefore = await read();
  await setRoom('day'); await sleep(500); const restAfter = await read();
  ok(`H4 AT REST the room's switch is not held: night -> day with no writing turns the page ${restBefore.drawn} -> ${restAfter.drawn} at once (writing ${restAfter.writing})`, restBefore.writing !== 'true' && restBefore.drawn === 'dark' && restAfter.writing !== 'true' && restAfter.page === 'light' && restAfter.drawn === 'light', J({ restBefore, restAfter }));
  return checks;
}, { label: 'arbor-bug109' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-BUG109 PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 5;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-BUG109 VERIFY: PASS (${checks.length} checks)` : `\nARBOR-BUG109 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
