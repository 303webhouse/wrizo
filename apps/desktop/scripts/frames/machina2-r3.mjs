// MACHINA v2 MOCKUP, ROUND r3 (Fable, Nov 1: "Room settled: Follow the clock / Always day / Always night (unset = clock, 07:00-19:00
// local) ... Machina switches only while the writer isn't typing") - the self-checks, as named screens for INK's frames job
// (-f themes=machina -f screens_file=apps/desktop/scripts/frames/machina2-r3.mjs). In session only, nothing stored.
// THE CLOCK IN A TEST: the mockup's own seam window.machina2Clock('HH:MM[:SS]') sets the time the room reads (in memory; null gives the real
// clock back; a reload forgets it). It is the clock moving, so it waits for the writer like the real clock. The runner's clock is never read.
// Every screen THROWS with its numbers when its check fails and prints them when it passes ("MACHINA2-R3 <screen> {...}"; a failure also prints
// "MACHINA2-R3-FAIL ..." in full). Written red-first: run against r2 (1a3d8e93) before the r3 build. Seeds go through window.wrizo*. No imports.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The quarterly figures show a steady rise in exports. The tariff change explains part of it, but not all.\nThe second paragraph names the evidence: shipping records for March and April.\nA third paragraph asks who the reader is.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`MACHINA2-R3 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`MACHINA2-R3-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash, on = true) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?machina2=1' : '/')} + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, `document.documentElement.getAttribute('data-machina2') ${on ? "=== 'true'" : '== null'}`, { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const page = async (app, id, text, on = true) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await load(app, '#/page/' + id, on);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1200);
};
const build = async (app) => { await clickText(app, '.desk-mode-tab', 'Build'); await sleep(1200); };
const clock = (app, s) => app.evalJs(`typeof window.machina2Clock === 'function' ? window.machina2Clock(${JSON.stringify(s)}) : 'NO-SEAM'`);
const ROWSEL = '.machina2-bar [role="group"][aria-label="Room"]';
const pick = (app, c) => clickSel(app, `${ROWSEL} [data-room-opt="${c}"]`);
const ROWREAD = `(() => { const g = document.querySelector('${ROWSEL}'); if (!g) return null;
  return { text: g.textContent.replace(/\\s+/g, ' ').trim(), opts: [...g.querySelectorAll('[data-room-opt]')].map((b) => [b.getAttribute('data-room-opt'), b.textContent.trim(), b.getAttribute('aria-pressed')]) }; })()`;
const STATE = `(() => { const r = document.documentElement; return { room: r.getAttribute('data-machina2-room'), due: r.getAttribute('data-machina2-room-due'), dataRoom: r.getAttribute('data-room'), tone: r.getAttribute('data-page'), cast: r.getAttribute('data-cast') }; })()`;
const RECT = `(() => { const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left * 10) / 10, t: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };
  return { page: r(document.querySelector('.mode-page')), col: r(document.querySelector('.mode-pagecol')), w: innerWidth }; })()`;
const same = (a, b) => !!a && !!b && ['l', 't', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);
const pressed = (r) => (r?.opts || []).filter((o) => o[2] === 'true').map((o) => o[0]).join(',');
const paperOf = `(() => { const m = String(getComputedStyle(document.querySelector('.mode-page')).backgroundColor).match(/\\d+(\\.\\d+)?/g); return m ? m.slice(0, 3).join(',') : null; })()`;

export default {
  // ── THE ROOM ROW. Exactly Follow the clock / Always day / Always night; unset (no data-room) it is Follow the clock, pressed. Following the
  // clock (nobody typing) the room is light at 12:00 and dark at 22:00 WHATEVER the page tone; Always night at noon and Always day at 22:00 land
  // at once; Follow the clock again gives the clock's room at once; the page keeps the tone's paper; no storage key; a reload forgets the choice.
  // PARKED 2026-11-01 (SUPERSEDED by Fable, Nov 1, Machina r4: "the Room row = Automatic · Day · Night"). Kept verbatim under the name
  // m2r3-room-v1 (not in the run list); SUCCESSOR m2r3-room below, the same checks with r4's words.
  'm2r3-room-v1': async (app) => {
    await page(app, 'm2r3-room', WORDS);
    const keys0 = await app.evalJs('[...Object.keys(localStorage), ...Object.keys(sessionStorage)].sort()');
    const s0 = await app.evalJs(STATE), row = await app.evalJs(ROWREAD), paper0 = await app.evalJs(paperOf);
    const seam = await clock(app, '12:00');
    const at = {};
    for (const hhmm of ['12:00', '22:00']) {
      await clock(app, hhmm);
      for (const tone of ['dark', 'light']) { await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(tone)})`); await sleep(1300); at[`${hhmm} ${tone}`] = await app.evalJs(STATE); }
    }
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(s0.tone)})`); await sleep(150);
    await clock(app, '12:00'); await sleep(1300);
    const okN = await pick(app, 'dark'); await sleep(60);
    const pN = await app.evalJs(STATE), rowN = await app.evalJs(ROWREAD);
    await clock(app, '22:00');
    const okD = await pick(app, 'light'); await sleep(60);
    const pD = await app.evalJs(STATE), paperD = await app.evalJs(paperOf);
    const okC = await pick(app, 'clock'); await sleep(60);
    const pC = await app.evalJs(STATE);
    const keys1 = await app.evalJs('[...Object.keys(localStorage), ...Object.keys(sessionStorage)].sort()');
    await pick(app, 'dark'); await sleep(200);
    await load(app, '#/page/m2r3-room'); await sleep(800);
    const s4 = await app.evalJs(STATE), row4 = await app.evalJs(ROWREAD);
    const ok = {
      row: !!row && JSON.stringify(row.opts.map((o) => o.slice(0, 2))) === '[["clock","Follow the clock"],["light","Always day"],["dark","Always night"]]' && pressed(row) === 'clock' && !/follows Page/.test(row.text),
      unsetIsClock: !s0.dataRoom,
      seam: seam !== 'NO-SEAM',
      noon: ['dark', 'light'].every((t) => at[`12:00 ${t}`].room === 'light' && !at[`12:00 ${t}`].due),
      night: ['dark', 'light'].every((t) => at[`22:00 ${t}`].room === 'dark' && !at[`22:00 ${t}`].due),
      pickNight: okN && pN.dataRoom === 'dark' && pN.room === 'dark' && pressed(rowN) === 'dark',
      pickDay: okD && pD.dataRoom === 'light' && pD.room === 'light',
      backToClock: okC && !pC.dataRoom && pC.room === 'dark',
      pageKept: !!paper0 && paper0 === paperD,
      noStorage: JSON.stringify(keys0) === JSON.stringify(keys1) && !keys1.some((k) => /room|clock/i.test(k)),
      session: !s4.dataRoom && pressed(row4) === 'clock',
    };
    if (Object.values(ok).some((x) => !x)) fail('M2R3-ROOM', { ok, s0, row, seam, at, pN, pD, pC, s4, row4, paper0, paperD, newKeys: keys1.filter((k) => !keys0.includes(k)) });
    say('m2r3-room', { ok, tone: s0.tone, row: row.opts });
  },
  'm2r3-room': async (app) => {
    await page(app, 'm2r3-room', WORDS);
    const keys0 = await app.evalJs('[...Object.keys(localStorage), ...Object.keys(sessionStorage)].sort()');
    const s0 = await app.evalJs(STATE), row = await app.evalJs(ROWREAD), paper0 = await app.evalJs(paperOf);
    const seam = await clock(app, '12:00');
    const at = {};
    for (const hhmm of ['12:00', '22:00']) {
      await clock(app, hhmm);
      for (const tone of ['dark', 'light']) { await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(tone)})`); await sleep(1300); at[`${hhmm} ${tone}`] = await app.evalJs(STATE); }
    }
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(s0.tone)})`); await sleep(150);
    await clock(app, '12:00'); await sleep(1300);
    const okN = await pick(app, 'dark'); await sleep(60);
    const pN = await app.evalJs(STATE), rowN = await app.evalJs(ROWREAD);
    await clock(app, '22:00');
    const okD = await pick(app, 'light'); await sleep(60);
    const pD = await app.evalJs(STATE), paperD = await app.evalJs(paperOf);
    const okC = await pick(app, 'clock'); await sleep(60);
    const pC = await app.evalJs(STATE);
    const keys1 = await app.evalJs('[...Object.keys(localStorage), ...Object.keys(sessionStorage)].sort()');
    await pick(app, 'dark'); await sleep(200);
    await load(app, '#/page/m2r3-room'); await sleep(800);
    const s4 = await app.evalJs(STATE), row4 = await app.evalJs(ROWREAD);
    const ok = {
      row: !!row && JSON.stringify(row.opts.map((o) => o.slice(0, 2))) === '[["clock","Automatic"],["light","Day"],["dark","Night"]]' && pressed(row) === 'clock' && !/follows Page/.test(row.text),
      unsetIsClock: !s0.dataRoom,
      seam: seam !== 'NO-SEAM',
      noon: ['dark', 'light'].every((t) => at[`12:00 ${t}`].room === 'light' && !at[`12:00 ${t}`].due),
      night: ['dark', 'light'].every((t) => at[`22:00 ${t}`].room === 'dark' && !at[`22:00 ${t}`].due),
      pickNight: okN && pN.dataRoom === 'dark' && pN.room === 'dark' && pressed(rowN) === 'dark',
      pickDay: okD && pD.dataRoom === 'light' && pD.room === 'light',
      backToClock: okC && !pC.dataRoom && pC.room === 'dark',
      pageKept: !!paper0 && paper0 === paperD,
      noStorage: JSON.stringify(keys0) === JSON.stringify(keys1) && !keys1.some((k) => /room|clock/i.test(k)),
      session: !s4.dataRoom && pressed(row4) === 'clock',
    };
    if (Object.values(ok).some((x) => !x)) fail('M2R3-ROOM', { ok, s0, row, seam, at, pN, pD, pC, s4, row4, paper0, paperD, newKeys: keys1.filter((k) => !keys0.includes(k)) });
    say('m2r3-room', { ok, tone: s0.tone, row: row.opts });
  },

  // ── THE CLOCK WAITS FOR THE WRITER. At 18:58 (the light room, following the clock) the writer types a key every 400 ms; the clock moves to
  // 19:02 after the first key and the typing goes on for 8 s more: the room stays light the whole time (the dark room named as due). The writer
  // stops: the room turns dark in ONE step between 4.5 s and 7.5 s after the last key (no key for 5 s), and nothing is due any more. Every key
  // reached the page; the page's rect is the same before and after. A pick right after a key still lands at once.
  'm2r3-typing': async (app) => {
    await page(app, 'm2r3-typing', WORDS);
    const seam = await clock(app, '18:58'); await sleep(1300);
    const s0 = await app.evalJs(STATE), r0 = await app.evalJs(RECT);
    await app.evalJs(`(() => { const e = document.querySelector('${ED}'); e?.focus(); const s = getSelection(); if (e && s) { s.selectAllChildren(e); s.collapseToEnd(); } })()`);
    const len0 = await app.evalJs(`(document.querySelector('${ED}')?.textContent || '').length`);
    await app.typeKeys('a');
    await clock(app, '19:02');
    const during = [];
    for (let i = 0; i < 20; i++) { await sleep(400); await app.typeKeys('a'); during.push(await app.evalJs(STATE)); }
    const tLast = Date.now();
    let switchedAfter = null, polls = 0;
    while (Date.now() - tLast < 9000) {
      await sleep(250); polls++;
      const s = await app.evalJs(STATE);
      if (s.room === 'dark') { switchedAfter = Date.now() - tLast; break; }
    }
    const s1 = await app.evalJs(STATE), r1 = await app.evalJs(RECT);
    const len1 = await app.evalJs(`(document.querySelector('${ED}')?.textContent || '').length`);
    // a pick right after a key: lands at once
    await app.typeKeys('a');
    const okPick = await pick(app, 'light'); await sleep(60);
    const sP = await app.evalJs(STATE);
    await pick(app, 'clock'); await sleep(60);
    const sC = await app.evalJs(STATE);
    const ok = {
      seam: seam !== 'NO-SEAM',
      start: s0.room === 'light' && !s0.dataRoom,
      held: during.length === 20 && during.every((s) => s.room === 'light' && s.due === 'dark'),
      switched: switchedAfter !== null && switchedAfter >= 4500 && switchedAfter <= 7500 && s1.room === 'dark' && !s1.due,
      keys: len1 - len0 >= 21,
      rect: same(r0.page, r1.page) && same(r0.col, r1.col),
      pickAtOnce: okPick && sP.room === 'light' && !sP.due,
      clockAtOnce: !sC.dataRoom && sC.room === 'dark',
    };
    const brief = { ok, switchedAfter, polls, s0, s1, sP, sC, keys: len1 - len0, during: [...new Set(during.map((s) => `${s.room}/${s.due}`))], r0: r0.page, r1: r1.page };
    if (Object.values(ok).some((x) => !x)) fail('M2R3-TYPING', brief);
    say('m2r3-typing', brief);
  },

  // ── THE PAGE NEVER MOVES, AT ANY HOUR: flag OFF, then ON following the clock at 12:00 and 22:00, and as Always day / Always night; Sprint and
  // Build; the page's and its column's rects identical to half a pixel.
  'm2r3-rect': async (app) => {
    const out = {};
    for (const mode of ['sprint', 'build']) {
      const go = async (on) => { await page(app, 'm2r3-rect', WORDS, on); if (mode === 'build') await build(app); };
      await go(false); const off = await app.evalJs(RECT);
      await go(true);
      const at = {};
      for (const s of ['12:00', '22:00']) { const seam = await clock(app, s); await sleep(1300); at[s] = { seam, ...(await app.evalJs(RECT)), ...(await app.evalJs(STATE)) }; }
      for (const c of ['light', 'dark']) { const picked = await pick(app, c); await sleep(600); at[c] = { picked, ...(await app.evalJs(RECT)), ...(await app.evalJs(STATE)) }; }
      const okAll = Object.values(at).every((x) => (x.seam === undefined || x.seam !== 'NO-SEAM') && (x.picked === undefined || x.picked) && same(off.page, x.page) && same(off.col, x.col));
      out[mode] = { off: off.page, at: Object.fromEntries(Object.entries(at).map(([k, v]) => [k, [v.page, v.room]])), ok: okAll && at['12:00'].room === 'light' && at['22:00'].room === 'dark' };
    }
    if (!out.sprint.ok || !out.build.ok) fail('M2R3-RECT', out);
    say('m2r3-rect', out);
  },

  // ── PICTURES FOR THE WRIZORS: the panel's Room row, and Sprint following the clock at noon and at 22:00 (the job's two tones give both pages).
  'm2r3-pic-panel': async (app) => {
    await page(app, 'm2r3-pic', WORDS);
    const seam = await clock(app, '12:00'); await sleep(900);
    const row = await app.evalJs(ROWREAD);
    if (seam === 'NO-SEAM' || !row || row.opts.length !== 3) fail('M2R3-PIC-PANEL', { seam, row });
    say('m2r3-pic-panel', row);
  },
  ...Object.fromEntries([['day', '12:00', 'light'], ['night', '22:00', 'dark']].map(([name, hhmm, want]) => [`m2r3-pic-${name}-sprint`, async (app) => {
    await page(app, 'm2r3-pic', WORDS);
    const seam = await clock(app, hhmm);
    await app.evalJs(`document.querySelector('${ED}')?.blur()`); await sleep(1300);
    const s = await app.evalJs(STATE);
    if (seam === 'NO-SEAM' || s.room !== want) fail('M2R3-PIC', { name, seam, s });
    say(`m2r3-pic-${name}-sprint`, s);
  }])),
};
