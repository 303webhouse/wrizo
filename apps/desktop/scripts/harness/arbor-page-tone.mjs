// ARBOR'S PAGE TONE FOLLOWS THE ROOM (NICK RULED, Nov 18, 10:06 am, via Fable 10:12 am): "by DAY the page is always light, with no Page: Dark
// offered. At NIGHT the light/dark choice stays. Nothing saved is deleted, no new field." Asks for the redesign (WS_ARBOR2=default: no query).
// The room through the product's own Room control's attribute (<html data-room>: light = Always day, dark = Always night - arbor2/themeRoom.tsx);
// the saved tone through the store's own seam (window.wrizoThemePrefs.set, the Page row's own setter). Across room x saved tone:
//   T1 day   x saved light: the page drawn light; no Page row offered (no Dark anywhere in the Themes panel); saved stays light
//   T2 day   x saved dark : the page drawn LIGHT (the ruling); no Page row offered; saved STAYS dark (nothing deleted)
//   T3 night x saved light: the page drawn light; the Page row offered with Light and Dark
//   T4 night x saved dark : the page drawn DARK (the choice stays); the Page row offered, Dark the pressed choice
//   T5 the room moving with no reload (saved dark: night -> day -> night): dark, light, dark again; the saved value dark throughout
//   T6 (PARKED Nov 18, below: the rail draws no tone readout in Arbor - Flux only) -> SUCCESSOR T6b: in Arbor the rail draws no tone readout,
//      by day or at night; M3 (its mutant) puts one in and T6b goes red
//   T7 no new key in storage: the keys after the run are the keys before it (plus none), and wrizo-theme-prefs holds the same four fields
//      (PARKED Nov 20: the room is saved to the account - SUCCESSOR T7b: no new key but the account preferences', holding the room alone; M-T7b its mutant)
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
// (driver fix, Nov 18: the first run's '.desk-frame-stage .mode-page .forward-only-editor' matched nothing - bg null in all cells; the paper is
// .mode-page's own var(--paper) (12-studio-chrome.css), so the walk starts there)
const READ = `(() => { const r = document.documentElement; let pg = document.querySelector('.mode-page'), bg = null;
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
  // (driver fix, Nov 18, train 25's pair, Actions 44406420415: a page opens in FREE WRITE - the zoomed Typewriter page, page-less by night by design
  // (r22) - so at night the drawn-page clip, low in the page's box, read the COUNT ROW's cream plate there, the very strip #108 removes; with #108 it
  // read the room. The page tone is read where a page is drawn: Draft, the framed page, its paper under the clip. Every assertion stands as written.)
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()");
  await waitSoft(app, "!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'Draft (the framed page)', timeout: 6000 }); await sleep(600);
  const keysBefore = await app.evalJs('Object.keys(localStorage).sort()');

  const setRoom = (room) => app.evalJs(`(() => { document.documentElement.setAttribute('data-room', ${J(room === 'day' ? 'light' : 'dark')}); return true; })()`);
  const setSaved = (page) => app.evalJs(`(() => { window.wrizoThemePrefs.set({ page: ${J(page)} }); return window.wrizoThemePrefs.get().page; })()`);
  const openPanel = async () => { if (await app.evalJs("!!document.querySelector('.wz-theme-picker')")) return true; const p = await press(app, ".wz-strip-item[data-category='theme']"); await waitSoft(app, "!!document.querySelector('.wz-theme-picker')", { label: 'the Themes panel', timeout: 5000 }); return p; };
  const closePanel = async () => { if (await app.evalJs("!!document.querySelector('.wz-theme-picker')")) { await app.key('Escape'); await sleep(400); } };
  // THE PAGE AS DRAWN (driver fix, Nov 18, second run: in Arbor .mode-page and every layer above it paint transparent - the paper is drawn by
  // another layer - so a computed colour read null in every cell, on both trees). Now the drawn pixels: a 40 x 40 clip of the screen low in the
  // page's own box (below the one line of text), its per-channel median, read with the Themes panel closed (bug83-count-row's method).
  const PAGEBOX = "(() => { const e = document.querySelector('.mode-page') || document.querySelector('.mode-pagecol'); if (!e) return null; const r = e.getBoundingClientRect(); if (r.width < 120 || r.height < 160) return null; const bottom = Math.min(r.bottom, innerHeight); return { x: Math.round(r.left + r.width / 2 - 20), y: Math.round(Math.max(r.top + 120, bottom - 90)), w: 40, h: 40 }; })()";
  const drawnPage = async () => {
    const b = await app.evalJs(PAGEBOX); if (!b) return { bg: null, lum: null, drawn: null, box: null };
    const data = (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } })).data;
    const rgb = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const D = g.getImageData(0, 0, c.width, c.height).data; const med = (k) => { const v = []; for (let i = k; i < D.length; i += 4) v.push(D[i]); v.sort((a, b) => a - b); return v[v.length >> 1]; }; return [med(0), med(1), med(2)]; })()`);
    const lum = Array.isArray(rgb) ? Math.round((0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 * 1000) / 1000 : null;
    return { bg: rgb ? `rgb(${rgb.join(', ')})` : null, lum, drawn: lum == null ? null : lum > 0.5 ? 'light' : lum < 0.25 ? 'dark' : 'mid', box: b };
  };
  const cell = async (room, page) => { await closePanel(); await setSaved(page); await setRoom(room); await sleep(500); const d = await drawnPage(); await openPanel(); await sleep(300); return { ...(await app.evalJs(READ)), ...d }; };

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
  for (const room of ['night', 'day', 'night']) { await setRoom(room); await sleep(500); seq.push({ ...(await app.evalJs(READ)), ...(await drawnPage()) }); }
  ok(`T5 the room moving, no reload (saved dark): ${J(seq.map((m) => m && `${m.room}:${m.drawn}`))}, saved ${J(seq.map((m) => m && m.saved))}`,
    seq.length === 3 && seq[0].drawn === 'dark' && seq[1].drawn === 'light' && seq[2].drawn === 'dark' && seq.every((m) => m.saved === 'dark' && m.arbor === 'true'), J(seq));

  // PARKED 2026-11-18 (SUPERSEDED - its premise is falsified: the rail draws its tone readout only in Flux (Cascade.tsx: boxes = FLUX3 && the theme
  // is flux), and Arbor's day room exists only in Arbor, so there is no readout here to follow the room - Actions 44356027494 and 44356020688
  // both read "Themes", no count. The Cascade edit that fed it is reverted as dead code. Original, verbatim:
  // // T6: the rail's tone readout reads the page in force
  // await setRoom('day'); await sleep(500); const railDay = await app.evalJs(RAIL);
  // await setRoom('night'); await sleep(500); const railNight = await app.evalJs(RAIL);
  // ok(`T6 the rail's tone readout reads the page in force (saved dark): by day "${railDay}", at night "${railNight}"`, /LIGHT/.test(railDay || '') && !/DARK/.test(railDay || '') && /DARK/.test(railNight || ''), J({ railDay, railNight }));
  // SUCCESSOR T6b: in Arbor the rail draws no tone readout by day or at night (so no saved tone is shown where the page in force differs); its
  // mutant M3 puts a readout into the Themes item (asserted LANDED) and T6b's read goes red.
  const READOUT = "(() => { const t = document.querySelector(\".wz-strip-item[data-category='theme']\"); return t ? { item: true, readouts: t.querySelectorAll('.wz-strip-readout').length, text: (t.textContent || '').replace(/\\s+/g, ' ').trim() } : { item: false }; })()";
  const t6bOk = (r) => !!r && r.item && r.readouts === 0;
  await setRoom('day'); await sleep(500); const roDay = await app.evalJs(READOUT);
  await setRoom('night'); await sleep(500); const roNight = await app.evalJs(READOUT);
  ok(`T6b in Arbor the rail draws no tone readout (by day ${J(roDay)}, at night ${J(roNight)})`, t6bOk(roDay) && t6bOk(roNight), J({ roDay, roNight }));
  await app.evalJs("(() => { const t = document.querySelector(\".wz-strip-item[data-category='theme']\"); if (!t) return false; const s = document.createElement('span'); s.className = 'wz-strip-readout'; s.textContent = 'DARK'; t.appendChild(s); return true; })()");
  const m3 = await app.evalJs(READOUT);
  ok(`M3 (mutant): a tone readout put into the Themes item (LANDED: ${m3 && m3.readouts}) - T6b's read goes RED`, !!m3 && m3.readouts === 1 && !t6bOk(m3), J(m3));
  await app.evalJs("document.querySelectorAll(\".wz-strip-item[data-category='theme'] .wz-strip-readout\").forEach((s) => s.remove())");

  // T7: nothing new saved
  const keysAfter = await app.evalJs('Object.keys(localStorage).sort()');
  const newKeys = (keysAfter || []).filter((k) => !(keysBefore || []).includes(k) && k !== 'wrizo-theme-prefs');
  // PARKED 2026-11-20 (ARBOR, arbor/room-pref). SUPERSEDED by Fable, Nov 19, 11:20 pm: "The room choice (Automatic / Day / Night) is SAVED TO THE ACCOUNT, for Machina
  // AND Arbor ... Store it as a `room` fact in users.prefs" - setting the room is now meant to save it (store/roomPref.ts, in the account preferences' existing key
  // wrizo-reorg-prefs), so that key may be new after the run. Original, verbatim:
  // ok(`T7 no new storage key (new: ${J(newKeys)}); wrizo-theme-prefs holds ${J(t4 && t4.savedKeys)}`, newKeys.length === 0 && J(t4 && t4.savedKeys) === J(['fade', 'idle', 'page', 'voice']), J({ keysBefore, keysAfter }));
  // SUCCESSOR T7b: no new key but the account preferences' own, and that one holds the room fact alone; wrizo-theme-prefs holds the same four fields.
  // M-T7b (mutant, LANDED asserted): an unrelated key written - T7b's read goes RED.
  const prefsFacts = await app.evalJs("(() => { try { return Object.keys(JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}')); } catch { return null; } })()");
  const t7bOk = (keys) => (keys || []).filter((k) => !(keysBefore || []).includes(k) && k !== 'wrizo-theme-prefs' && k !== 'wrizo-reorg-prefs').length === 0;
  ok(`T7b no new storage key but the account preferences' (new: ${J(newKeys)}), which holds the room alone (${J(prefsFacts)}); wrizo-theme-prefs holds ${J(t4 && t4.savedKeys)}`,
    t7bOk(keysAfter) && J(prefsFacts) === J(['room']) && J(t4 && t4.savedKeys) === J(['fade', 'idle', 'page', 'voice']), J({ keysBefore, keysAfter, prefsFacts }));
  await app.evalJs("localStorage.setItem('wrizo-mutant-t7b', '1'); true");
  const keysM = await app.evalJs('Object.keys(localStorage).sort()');
  await app.evalJs("localStorage.removeItem('wrizo-mutant-t7b'); true");
  ok(`M-T7b (mutant): an unrelated key written (LANDED: ${(keysM || []).includes('wrizo-mutant-t7b')}) - T7b's read goes RED`, (keysM || []).includes('wrizo-mutant-t7b') && !t7bOk(keysM), J(keysM));

  // M1: the old rule (the page drawn in the SAVED tone) across the four cells - red in day x dark only
  const m1 = [];
  for (const [room, page] of [['day', 'light'], ['day', 'dark'], ['night', 'light'], ['night', 'dark']]) {
    const before = await cell(room, page);
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${J(page)})`); await sleep(300);
    const panelRead = await app.evalJs(READ); await closePanel(); const m = { ...panelRead, ...(await drawnPage()) };   // (the panel read, then the page as drawn with it closed)
    m1.push({ room, page, landed: !!m && m.dataPage === page, red: !cellOk(room, page, m), before: before && before.drawn, after: m && m.drawn });
  }
  const m1ok = m1.every((c) => c.landed) && m1.filter((c) => c.red).map((c) => `${c.room}x${c.page}`).join(',') === 'dayxdark';
  ok(`M1 (mutant, the old rule in each cell - data-page forced to the saved tone, LANDED ${m1.filter((c) => c.landed).length}/4): red in ${J(m1.filter((c) => c.red).map((c) => c.room + 'x' + c.page))} only`, m1ok, J(m1));

  // M2: a Page row with a Dark choice put into the day panel - T2's read goes red
  await closePanel(); await app.evalJs("document.documentElement.removeAttribute('data-page')");
  const m2pre = await cell('day', 'dark');
  await app.evalJs("(() => { const p = document.querySelector('.wz-theme-picker-field'); if (!p) return false; const d = document.createElement('div'); d.className = 'mode-crow'; d.innerHTML = '<span>Page</span><div class=\"mode-seg\"><button type=\"button\" class=\"on\">Light</button><button type=\"button\">Dark</button></div>'; p.prepend(d); return true; })()");
  const m2 = { ...(await app.evalJs(READ)), bg: m2pre && m2pre.bg, lum: m2pre && m2pre.lum, drawn: m2pre && m2pre.drawn };   // (the injected row changes no paper: the page as drawn is m2pre's)
  ok(`M2 (mutant): a Page row with Dark put into the day panel (LANDED: Page rows ${m2 && m2.pageRow}, Dark offered ${m2 && m2.darkOffered}) - T2's read goes RED`, dayOk(m2pre, 'dark') && !!m2 && m2.pageRow > 0 && m2.darkOffered === true && !dayOk(m2, 'dark'), J({ m2pre, m2 }));
  return checks;
}, { label: 'arbor-page-tone' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-PAGE-TONE PARKED: PASS (0 checks) - HARNESS_PARKED=1 armed; this file parks two originals as quoted comments (T6, Nov 18: the rail\'s tone readout is Flux-only, so there is none in Arbor to follow the room), with its successor T6b and mutant M3; (T7, Nov 20: the room is saved to the account, so the prefs key may be new), with its successor T7b and mutant M-T7b');
const WANT = 11;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-PAGE-TONE VERIFY: PASS (${checks.length} checks)` : `\nARBOR-PAGE-TONE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
