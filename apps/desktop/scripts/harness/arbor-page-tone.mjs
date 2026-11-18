// ARBOR'S PAGE TONE FOLLOWS THE ROOM (NICK RULED, Nov 18, 10:06 am, via Fable 10:12 am): "by DAY the page is always light, with no Page: Dark
// offered. At NIGHT the light/dark choice stays. Nothing saved is deleted, no new field." Asks for the redesign (WS_ARBOR2=default: no query).
// The room through the product's own Room control's attribute (<html data-room>: light = Always day, dark = Always night - arbor2/themeRoom.tsx);
// the saved tone through the store's own seam (window.wrizoThemePrefs.set, the Page row's own setter). Across room x saved tone:
//   T1 day   x saved light: the page drawn light; no Page row offered (no Dark anywhere in the Themes panel); saved stays light
//   T2 day   x saved dark : the page drawn LIGHT (the ruling); no Page row offered; saved STAYS dark (nothing deleted)
//   T3 night x saved light: the page drawn light; the Page row offered with Light and Dark
//   T4 night x saved dark : the page drawn DARK (the choice stays); the Page row offered, Dark the pressed choice
//   T5 the room moving with no reload (saved dark: night -> day -> night): dark, light, dark again; the saved value dark throughout
//   T6 the rail's tone readout (the Themes item's count) reads the page in force: LIGHT by day with dark saved, DARK at night
//   T7 no new key in storage: the keys after the run are the keys before it (plus none), and wrizo-theme-prefs holds the same four fields
//   M1 (mutant, across the four cells) the old rule - the page drawn in the SAVED tone, data-page forced to it (asserted LANDED in each cell): the
//      cells' read goes red in day x dark ONLY, and stays green in the other three (the read discriminates the ruling, not the room)
//   M2 (mutant) a Page row with a Dark choice put into the day panel (asserted LANDED): T2's "no Dark offered" read goes red
// RED FIRST: on the tree before the change (3554c01d) T2 fails (the page is drawn dark by day) and the Page row is offered by day.
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
// a press only where the writer could press: the target hit-testable at its centre
const press = async (app, sel) => {
  const hit = `(() => { const e = document.querySelector(${J(sel)}); if (!e || e.disabled) return false; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); if (!r.width) return false; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === e || e.contains(h)); })()`;
  if (!(await waitSoft(app, hit, { label: 'hit-testable ' + sel, timeout: 6000 }))) return false;
  const at = await app.evalJs(`(() => { const r = document.querySelector(${J(sel)}).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await app.mouseMove(at.x, at.y); await app.mouseDown(at.x, at.y); await app.mouseUp(at.x, at.y); await sleep(600); return true;
};
// the page as drawn (the paper's computed colour and its luminance), the attribute, the saved value, and the Themes panel's rows
// (the paper as drawn: the first layer from the editor outwards that paints an opaque background - the page's layers differ by mode)
const READ = `(() => { const r = document.documentElement; let pg = document.querySelector('.desk-frame-stage .mode-page .forward-only-editor'), bg = null;
  for (let e = pg; e && e !== document.body; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; const a = /rgba\\([^)]*,\\s*([\\d.]+)\\)/.exec(c); if (c && c !== 'transparent' && !(a && Number(a[1]) < 0.9)) { bg = c; break; } }
  const m = bg && /rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)/.exec(bg);
  const lum = m ? Math.round((0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255 * 1000) / 1000 : null;
  let saved = null; try { saved = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || 'null'); } catch {}
  const panel = document.querySelector('.wz-theme-picker'); const rows = panel ? [...panel.querySelectorAll('.mode-seg, [role=group]')].map((g) => (g.closest('.mode-crow, .mode-row, div') || g).textContent.replace(/\\s+/g, ' ').trim()) : null;
  const pageRow = panel ? [...panel.querySelectorAll('*')].filter((e) => e.children.length === 0 && /^Page$/.test((e.textContent || '').trim())).length : null;
  const darkOffered = panel ? [...panel.querySelectorAll('button')].some((b) => (b.textContent || '').trim() === 'Dark' && !b.closest('.arbor2-theme-room')) : null;
  const pressedTone = panel ? ([...panel.querySelectorAll('button')].filter((b) => !b.closest('.arbor2-theme-room') && /^(Light|Dark)$/.test((b.textContent || '').trim()) && (b.getAttribute('aria-pressed') === 'true' || b.classList.contains('on'))).map((b) => b.textContent.trim())[0] || null) : null;
  return { arbor: r.getAttribute('data-arbor2'), theme: r.getAttribute('data-theme'), room: r.getAttribute('data-arbor2-room'), dataPage: r.getAttribute('data-page'), bg, lum,
    drawn: lum == null ? null : lum > 0.5 ? 'light' : lum < 0.25 ? 'dark' : 'mid', saved: saved && saved.page, savedKeys: saved ? Object.keys(saved).sort() : null, panel: !!panel, pageRow, darkOffered, pressedTone, rows }; })()`;
const RAIL = "(() => { const t = document.querySelector(\".wz-strip-item[data-category='theme']\"); return t ? (t.textContent || '').replace(/\\s+/g, ' ').trim() : null; })()";

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
  await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 25000 });
  await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function' && !!window.wrizoThemePrefs", { label: 'seams', timeout: 15000 });
  const id = `arbor-pt-${Math.random().toString(36).slice(2, 7)}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: 'A page for its tone.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await waitSoft(app, "!!document.querySelector('.desk-frame-stage .mode-page') && !!document.querySelector(\".wz-strip-item[data-category='theme']\")", { label: 'the page and the rail', timeout: 15000 });
  await sleep(800);
  const keysBefore = await app.evalJs('Object.keys(localStorage).sort()');

  const setRoom = (room) => app.evalJs(`(() => { document.documentElement.setAttribute('data-room', ${J(room === 'day' ? 'light' : 'dark')}); return true; })()`);
  const setSaved = (page) => app.evalJs(`(() => { window.wrizoThemePrefs.set({ page: ${J(page)} }); return window.wrizoThemePrefs.get().page; })()`);
  const openPanel = async () => { if (await app.evalJs("!!document.querySelector('.wz-theme-picker')")) return true; const p = await press(app, ".wz-strip-item[data-category='theme']"); await waitSoft(app, "!!document.querySelector('.wz-theme-picker')", { label: 'the Themes panel', timeout: 5000 }); return p; };
  const closePanel = async () => { if (await app.evalJs("!!document.querySelector('.wz-theme-picker')")) { await app.key('Escape'); await sleep(400); } };
  const cell = async (room, page) => { await closePanel(); await setSaved(page); await setRoom(room); await sleep(500); await openPanel(); await sleep(300); return app.evalJs(READ); };

  // the cells' predicates (the ruling): by day the page is drawn light and no tone is offered; at night the page is drawn in the saved tone
  // and the row offers both; the saved value is always the one set
  const dayOk = (m, page) => !!m && m.arbor === 'true' && m.room === 'day' && m.drawn === 'light' && m.saved === page && m.panel && m.pageRow === 0 && m.darkOffered === false;
  const nightOk = (m, page) => !!m && m.arbor === 'true' && m.room === 'night' && m.drawn === page && m.saved === page && m.panel && m.pageRow > 0 && m.darkOffered === true && m.pressedTone === (page === 'dark' ? 'Dark' : 'Light');
  const cellOk = (room, page, m) => (room === 'day' ? dayOk(m, page) : nightOk(m, page));

  const t1 = await cell('day', 'light');
  ok(`T1 day x saved light: the page drawn light (${t1 && t1.bg}), no Page row (${t1 && t1.pageRow}), no Dark offered; saved ${t1 && t1.saved}`, dayOk(t1, 'light'), J(t1));
  const t2 = await cell('day', 'dark');
  ok(`T2 day x saved DARK: the page drawn LIGHT (${t2 && t2.bg}, data-page ${t2 && t2.dataPage}), no Page row, no Dark offered; saved STAYS ${t2 && t2.saved}`, dayOk(t2, 'dark'), J(t2));
  const t3 = await cell('night', 'light');
  ok(`T3 night x saved light: the page drawn light (${t3 && t3.bg}); the Page row offered with Light and Dark (pressed ${t3 && t3.pressedTone})`, nightOk(t3, 'light'), J(t3));
  const t4 = await cell('night', 'dark');
  ok(`T4 night x saved dark: the page drawn DARK (${t4 && t4.bg}); the Page row offered, Dark pressed (${t4 && t4.pressedTone})`, nightOk(t4, 'dark'), J(t4));

  // T5: the room moving with no reload, saved dark throughout
  await closePanel(); await setSaved('dark');
  const seq = [];
  for (const room of ['night', 'day', 'night']) { await setRoom(room); await sleep(500); seq.push(await app.evalJs(READ)); }
  ok(`T5 the room moving, no reload (saved dark): ${J(seq.map((m) => m && `${m.room}:${m.drawn}`))}, saved ${J(seq.map((m) => m && m.saved))}`,
    seq.length === 3 && seq[0].drawn === 'dark' && seq[1].drawn === 'light' && seq[2].drawn === 'dark' && seq.every((m) => m.saved === 'dark' && m.arbor === 'true'), J(seq));

  // T6: the rail's tone readout reads the page in force
  await setRoom('day'); await sleep(500); const railDay = await app.evalJs(RAIL);
  await setRoom('night'); await sleep(500); const railNight = await app.evalJs(RAIL);
  ok(`T6 the rail's tone readout reads the page in force (saved dark): by day "${railDay}", at night "${railNight}"`, /LIGHT/.test(railDay || '') && !/DARK/.test(railDay || '') && /DARK/.test(railNight || ''), J({ railDay, railNight }));

  // T7: nothing new saved
  const keysAfter = await app.evalJs('Object.keys(localStorage).sort()');
  const newKeys = (keysAfter || []).filter((k) => !(keysBefore || []).includes(k) && k !== 'wrizo-theme-prefs');
  ok(`T7 no new storage key (new: ${J(newKeys)}); wrizo-theme-prefs holds ${J(t4 && t4.savedKeys)}`, newKeys.length === 0 && J(t4 && t4.savedKeys) === J(['fade', 'idle', 'page', 'voice']), J({ keysBefore, keysAfter }));

  // M1: the old rule (the page drawn in the SAVED tone) across the four cells - red in day x dark only
  const m1 = [];
  for (const [room, page] of [['day', 'light'], ['day', 'dark'], ['night', 'light'], ['night', 'dark']]) {
    const before = await cell(room, page);
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${J(page)})`); await sleep(300);
    const m = await app.evalJs(READ);
    m1.push({ room, page, landed: !!m && m.dataPage === page, red: !cellOk(room, page, m), before: before && before.drawn, after: m && m.drawn });
  }
  const m1ok = m1.every((c) => c.landed) && m1.filter((c) => c.red).map((c) => `${c.room}x${c.page}`).join(',') === 'dayxdark';
  ok(`M1 (mutant, the old rule in each cell - data-page forced to the saved tone, LANDED ${m1.filter((c) => c.landed).length}/4): red in ${J(m1.filter((c) => c.red).map((c) => c.room + 'x' + c.page))} only`, m1ok, J(m1));

  // M2: a Page row with a Dark choice put into the day panel - T2's read goes red
  await closePanel(); await app.evalJs("document.documentElement.removeAttribute('data-page')");
  const m2pre = await cell('day', 'dark');
  await app.evalJs("(() => { const p = document.querySelector('.wz-theme-picker-field'); if (!p) return false; const d = document.createElement('div'); d.className = 'mode-crow'; d.innerHTML = '<span>Page</span><div class=\"mode-seg\"><button type=\"button\" class=\"on\">Light</button><button type=\"button\">Dark</button></div>'; p.prepend(d); return true; })()");
  const m2 = await app.evalJs(READ);
  ok(`M2 (mutant): a Page row with Dark put into the day panel (LANDED: Page rows ${m2 && m2.pageRow}, Dark offered ${m2 && m2.darkOffered}) - T2's read goes RED`, dayOk(m2pre, 'dark') && !!m2 && m2.pageRow > 0 && m2.darkOffered === true && !dayOk(m2, 'dark'), J({ m2pre, m2 }));
  return checks;
}, { label: 'arbor-page-tone' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-PAGE-TONE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 9;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-PAGE-TONE VERIFY: PASS (${checks.length} checks)` : `\nARBOR-PAGE-TONE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
