// ARBOR v2 MOCKUP, ROUND r9 (Fable, Nov 1: "Room settled: Follow the clock / Always day / Always night (unset = clock, 07:00-19:00 local)...
// Arbor crossfades over ~20 min (a cut under reduced motion)") - the self-checks, as named screens for INK's frames job
// (-f screens_file=apps/desktop/scripts/frames/arbor2-r9.mjs). In session only, nothing stored.
// THE CLOCK IN A TEST: the mockup's own seam window.arbor2Clock('HH:MM[:SS]') sets the time the room reads (in memory; null gives the real clock
// back; a reload forgets it). The runner's clock is never read here: every screen sets the time it needs.
// Every screen THROWS with its numbers when its check fails and prints them when it passes ("ARBOR-R9 <screen> {...}"; a failure also prints
// "ARBOR-R9-FAIL ..." in full - the job keeps 300 characters of an error). Written red-first: run against r8 (80b96b3b) before the r9 build.
// Seeds go through the app's seams (window.wrizo*), never raw collection storage. No imports.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R9 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R9-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash, on = true) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?arbor2=1' : '/')} + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, `document.documentElement.getAttribute('data-arbor2') ${on ? "=== 'true'" : '== null'}`, { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const page = async (app, id, text, on = true) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await load(app, '#/page/' + id, on);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1400);
};
// the clock seam; 'NO-SEAM' when the mockup has none (the red leg)
const clock = (app, s) => app.evalJs(`typeof window.arbor2Clock === 'function' ? window.arbor2Clock(${JSON.stringify(s)}) : 'NO-SEAM'`);
const openMood = (app) => app.evalJs(`(() => { const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') !== 'true'); if (m) m.click(); })()`);
const closeMood = (app) => app.evalJs(`(() => { const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') === 'true'); if (m) m.click(); })()`);
// THE ROOM CONTROL: open the Mood menu and press clock | day | night. Returns false when the choice is not there.
const pickRoom = async (app, choice, settle = 900) => { await openMood(app); await sleep(150); const ok = await clickSel(app, `.arbor2-mood [data-room-opt="${choice}"]`); await sleep(settle); return ok; };
const ROWREAD = `(() => { const first = document.querySelector('.arbor2-mood > li'); if (!first) return null;
  return { label: first.getAttribute('aria-label'), text: first.textContent.replace(/\\s+/g, ' ').trim(), opts: [...first.querySelectorAll('[data-room-opt]')].map((b) => [b.getAttribute('data-room-opt'), b.textContent.trim(), b.getAttribute('aria-pressed')]) }; })()`;
const STATE = `(() => { const r = document.documentElement, cs = getComputedStyle(r);
  return { room: r.getAttribute('data-arbor2-room'), dataRoom: r.getAttribute('data-room'), tone: r.getAttribute('data-page'), t: r.getAttribute('data-arbor2-dayness'),
    g: cs.getPropertyValue('--ink-950').trim().toUpperCase(), letter: cs.getPropertyValue('--arbor-letter').trim().toUpperCase(), surf: cs.getPropertyValue('--ink-900').trim().toUpperCase(),
    inline: [...r.style].filter((n) => n === '--ink-950' || n === '--lamp-glow' || n === '--arbor-lamp-rgb') }; })()`;
const COLOUR = `
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };
  const hex = (c) => c ? '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
  const firstStop = (img) => { const m = String(img).match(/rgba?\\([^)]+\\)/); return m ? parse(m[0]) : null; };
  const ground = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      let c = parse(cs.backgroundColor);
      if ((!c || c.a === 0) && cs.backgroundImage !== 'none' && !/url\\(/.test(cs.backgroundImage)) c = firstStop(cs.backgroundImage);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let g = layers.length && layers[layers.length - 1].a >= 1 ? layers.pop() : (parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 0, g: 0, b: 0, a: 1 });
    while (layers.length) g = over(layers.pop(), g);
    return g;
  };
  const shown = (el) => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false; } return true; };
  const pair = (el) => { const g = ground(el); const fg = over(parse(getComputedStyle(el).color), g); return { fg: hex(fg), bg: hex(g), ratio: ratio(fg, g) }; };
  const textEls = (root) => [...root.querySelectorAll('*')].concat([root]).filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && shown(el));
  const tok = (el, name) => { const v = getComputedStyle(el).getPropertyValue(name).trim(); if (!v) return null; const i = document.createElement('i'); i.style.color = v; el.appendChild(i); const c = parse(getComputedStyle(i).color); i.remove(); return c; };
  const hexLum = (h) => { const n = parseInt(String(h).replace('#', '').slice(0, 6), 16); return lum({ r: n >> 16, g: (n >> 8) & 255, b: n & 255 }); };
`;
const RECT = `(() => { const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left * 10) / 10, t: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };
  const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0);
  return { page: r(document.querySelector('.mode-page')), col: r(document.querySelector('.mode-pagecol')), bar: r(bar), zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null, w: innerWidth }; })()`;
const same = (a, b) => !!a && !!b && ['l', 't', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);
// one read of a fade step: the room, the page (paper, ink), and every label's contrast where it stands
const STEP = `(() => { ${COLOUR}
  const root = document.documentElement, cs = getComputedStyle(root);
  const out = { pairs: [] };
  const add = (where, el, floor) => { if (!el || !shown(el)) return; const p = pair(el); out.pairs.push({ where, text: (el.textContent || '').trim().slice(0, 18), ...p, floor }); };
  const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0);
  const rail = document.querySelector('.desk-frame-strip');
  if (bar) textEls(bar).forEach((el) => add('bar', el, 4.5));
  if (rail) textEls(rail).forEach((el) => add('rail', el, 4.5));
  const stage = document.querySelector('.mode-stage');
  if (stage) textEls(stage).filter((el) => !el.closest('${ED}')).forEach((el) => add(el.closest('.mode-page') ? 'page' : el.closest('.wz-sliver, .wz-tutor') ? 'drawer' : 'stage', el, 4.5));
  const p = document.querySelector('.mode-page'), ed = document.querySelector('${ED}'), sheet = document.querySelector('.arbor2-paper[data-on="true"]');
  const paper = p ? parse(sheet ? getComputedStyle(sheet).backgroundColor : getComputedStyle(p).backgroundColor) : null, ink = ed ? parse(getComputedStyle(ed).color) : null;
  out.paper = hex(paper); out.ink = hex(ink); out.inkRatio = paper && ink ? ratio(ink, paper) : null;
  out.gLum = hexLum(cs.getPropertyValue('--ink-950').trim());
  return out; })()`;

export default {
  // ── THE ROOM CONTROL. The Mood menu's FIRST row is "Room" with exactly Follow the clock / Always day / Always night; unset (no data-room) it is
  // Follow the clock, pressed. Following the clock the room is day at 12:00 and night at 22:00 WHATEVER the page tone; Always night at noon and
  // Always day at 22:00 land at once (dayness 0 / 1, no fade); Follow the clock again gives the clock's room; the page keeps the tone's paper;
  // no storage key appears; a reload forgets the choice.
  // PARKED 2026-11-01 (SUPERSEDED by the Wrizors' note, Nov 1, spec §2e: "Room ▸ By the clock · Day · Night"). Kept verbatim under the name
  // r9-room-v1 (not in the run list); SUCCESSOR r9-room below, the same checks with r10's words.
  'r9-room-v1': async (app) => {
    await page(app, 'arbor-r9-room', WORDS);
    const keys0 = await app.evalJs('[...Object.keys(localStorage), ...Object.keys(sessionStorage)].sort()');
    const paperOf = `(() => { ${COLOUR} const s = document.querySelector('.arbor2-paper[data-on="true"]'); return hex(parse(getComputedStyle(s || document.querySelector('.mode-page')).backgroundColor)); })()`;
    const s0 = await app.evalJs(STATE), paper0 = await app.evalJs(paperOf);
    await openMood(app); await sleep(200);
    const row = await app.evalJs(ROWREAD);
    const seam = await clock(app, '12:00');
    const at = {};
    for (const hhmm of ['12:00', '22:00']) {
      await clock(app, hhmm);
      for (const tone of ['dark', 'light']) { await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(tone)})`); await sleep(150); at[`${hhmm} ${tone}`] = await app.evalJs(STATE); }
    }
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(s0.tone)})`); await sleep(150);
    await clock(app, '12:00');
    const okN = await clickSel(app, '.arbor2-mood [data-room-opt="night"]'); await sleep(60);
    const pN = await app.evalJs(STATE), rowN = await app.evalJs(ROWREAD);
    await clock(app, '22:00');
    const okD = await clickSel(app, '.arbor2-mood [data-room-opt="day"]'); await sleep(60);
    const pD = await app.evalJs(STATE), paperD = await app.evalJs(paperOf);
    const okC = await clickSel(app, '.arbor2-mood [data-room-opt="clock"]'); await sleep(60);
    const pC = await app.evalJs(STATE);
    const keys1 = await app.evalJs('[...Object.keys(localStorage), ...Object.keys(sessionStorage)].sort()');
    await pickRoom(app, 'night', 300);
    await load(app, '#/page/arbor-r9-room'); await sleep(800);
    await openMood(app); await sleep(200);
    const s4 = await app.evalJs(STATE), row4 = await app.evalJs(ROWREAD);
    const pressed = (r) => (r?.opts || []).filter((o) => o[2] === 'true').map((o) => o[0]).join(',');
    const ok = {
      row: !!row && row.label === 'Room' && JSON.stringify(row.opts.map((o) => o.slice(0, 2))) === '[["clock","Follow the clock"],["day","Always day"],["night","Always night"]]' && pressed(row) === 'clock',
      unsetIsClock: !s0.dataRoom,
      seam: seam !== 'NO-SEAM',
      noon: ['dark', 'light'].every((t) => at[`12:00 ${t}`].room === 'day' && at[`12:00 ${t}`].t === '1'),
      night: ['dark', 'light'].every((t) => at[`22:00 ${t}`].room === 'night' && at[`22:00 ${t}`].t === '0'),
      pickNight: okN && pN.dataRoom === 'dark' && pN.room === 'night' && pN.t === '0' && pressed(rowN) === 'night',
      pickDay: okD && pD.dataRoom === 'light' && pD.room === 'day' && pD.t === '1',
      backToClock: okC && !pC.dataRoom && pC.room === 'night' && pC.t === '0',
      pageKept: !!paper0 && paper0 === paperD,
      noStorage: JSON.stringify(keys0) === JSON.stringify(keys1) && !keys1.some((k) => /room|clock/i.test(k)),
      session: !s4.dataRoom && pressed(row4) === 'clock',
    };
    if (Object.values(ok).some((x) => !x)) fail('R9-ROOM', { ok, s0, row, seam, at, pN, pD, pC, s4, row4, paper0, paperD, newKeys: keys1.filter((k) => !keys0.includes(k)) });
    say('r9-room', { ok, tone: s0.tone, row: row.opts, noon: at['12:00 dark'].room, night: at['22:00 light'].room });
  },
  'r9-room': async (app) => {
    await page(app, 'arbor-r9-room', WORDS);
    const keys0 = await app.evalJs('[...Object.keys(localStorage), ...Object.keys(sessionStorage)].sort()');
    const paperOf = `(() => { ${COLOUR} const s = document.querySelector('.arbor2-paper[data-on="true"]'); return hex(parse(getComputedStyle(s || document.querySelector('.mode-page')).backgroundColor)); })()`;
    const s0 = await app.evalJs(STATE), paper0 = await app.evalJs(paperOf);
    await openMood(app); await sleep(200);
    const row = await app.evalJs(ROWREAD);
    const seam = await clock(app, '12:00');
    const at = {};
    for (const hhmm of ['12:00', '22:00']) {
      await clock(app, hhmm);
      for (const tone of ['dark', 'light']) { await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(tone)})`); await sleep(150); at[`${hhmm} ${tone}`] = await app.evalJs(STATE); }
    }
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(s0.tone)})`); await sleep(150);
    await clock(app, '12:00');
    const okN = await clickSel(app, '.arbor2-mood [data-room-opt="night"]'); await sleep(60);
    const pN = await app.evalJs(STATE), rowN = await app.evalJs(ROWREAD);
    await clock(app, '22:00');
    const okD = await clickSel(app, '.arbor2-mood [data-room-opt="day"]'); await sleep(60);
    const pD = await app.evalJs(STATE), paperD = await app.evalJs(paperOf);
    const okC = await clickSel(app, '.arbor2-mood [data-room-opt="clock"]'); await sleep(60);
    const pC = await app.evalJs(STATE);
    const keys1 = await app.evalJs('[...Object.keys(localStorage), ...Object.keys(sessionStorage)].sort()');
    await pickRoom(app, 'night', 300);
    await load(app, '#/page/arbor-r9-room'); await sleep(800);
    await openMood(app); await sleep(200);
    const s4 = await app.evalJs(STATE), row4 = await app.evalJs(ROWREAD);
    const pressed = (r) => (r?.opts || []).filter((o) => o[2] === 'true').map((o) => o[0]).join(',');
    const ok = {
      row: !!row && row.label === 'Room' && JSON.stringify(row.opts.map((o) => o.slice(0, 2))) === '[["clock","By the clock"],["day","Day"],["night","Night"]]' && pressed(row) === 'clock',
      unsetIsClock: !s0.dataRoom,
      seam: seam !== 'NO-SEAM',
      noon: ['dark', 'light'].every((t) => at[`12:00 ${t}`].room === 'day' && at[`12:00 ${t}`].t === '1'),
      night: ['dark', 'light'].every((t) => at[`22:00 ${t}`].room === 'night' && at[`22:00 ${t}`].t === '0'),
      pickNight: okN && pN.dataRoom === 'dark' && pN.room === 'night' && pN.t === '0' && pressed(rowN) === 'night',
      pickDay: okD && pD.dataRoom === 'light' && pD.room === 'day' && pD.t === '1',
      backToClock: okC && !pC.dataRoom && pC.room === 'night' && pC.t === '0',
      pageKept: !!paper0 && paper0 === paperD,
      noStorage: JSON.stringify(keys0) === JSON.stringify(keys1) && !keys1.some((k) => /room|clock/i.test(k)),
      session: !s4.dataRoom && pressed(row4) === 'clock',
    };
    if (Object.values(ok).some((x) => !x)) fail('R9-ROOM', { ok, s0, row, seam, at, pN, pD, pC, s4, row4, paper0, paperD, newKeys: keys1.filter((k) => !keys0.includes(k)) });
    say('r9-room', { ok, tone: s0.tone, row: row.opts, noon: at['12:00 dark'].room, night: at['22:00 light'].room });
  },

  // ── THE CROSSFADE. Following the clock, 06:40 -> 07:20 in two-minute steps (and 18:40 -> 19:20): the dayness is 0 until 06:50, 0.5 at 07:00,
  // 1 from 07:10 (the evening the reverse), rising at every step between; the room's ground brightens at every step; the room (and its
  // lettering) changes ONCE, mid-fade; blended tokens are written on <html> only while the fade runs; the page's rect, paper and ink never move;
  // the bars, the rail and the page's own labels hold 4.5:1 at every step. The bare room's one label (the count row) is MEASURED at every step
  // and reported (FADE-DIP), not asserted: no floor was ruled for the middle of a fade.
  'r9-fade': async (app) => {
    await page(app, 'arbor-r9-fade', WORDS);
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'arbor2-r9-lit'; s.textContent = '*{ --arbor2-dim:1 !important; transition:none !important; }'; document.head.appendChild(s); document.documentElement.setAttribute('data-arbor2-lit', ''); })()");
    const seam = await clock(app, '06:40');
    const MORNING = ['06:40', '06:50', '06:52', '06:54', '06:56', '06:58', '07:00', '07:02', '07:04', '07:06', '07:08', '07:10', '07:20'];
    const EVENING = ['18:40', '18:50', '19:00', '19:10', '19:20'];
    const m = [];
    for (const s of MORNING) { await clock(app, s); await sleep(120); m.push({ at: s, ...(await app.evalJs(STATE)), rect: await app.evalJs(RECT), ...(await app.evalJs(STEP)) }); }
    const e = [];
    for (const s of EVENING) { await clock(app, s); await sleep(120); e.push({ at: s, ...(await app.evalJs(STATE)) }); }
    const T = (arr, s) => Number(arr.find((x) => x.at === s)?.t);
    const mid = m.filter((x) => x.at > '06:50' && x.at < '07:10');
    const switches = m.slice(1).map((x, i) => (x.room !== m[i].room ? i + 1 : -1)).filter((i) => i >= 0);
    const letterSwitches = m.slice(1).map((x, i) => (x.letter !== m[i].letter ? i + 1 : -1)).filter((i) => i >= 0);
    const floors = m.flatMap((x) => x.pairs.filter((p) => p.where !== 'stage' && p.ratio < p.floor).map((p) => ({ at: x.at, ...p })));
    const dip = m.map((x) => { const st = x.pairs.filter((p) => p.where === 'stage'); return [x.at, x.t, st.length ? Math.min(...st.map((p) => p.ratio)) : null]; });
    const ok = {
      seam: seam !== 'NO-SEAM',
      ends: T(m, '06:40') === 0 && T(m, '06:50') === 0 && T(m, '07:00') === 0.5 && T(m, '07:10') === 1 && T(m, '07:20') === 1,
      evening: T(e, '18:40') === 1 && T(e, '18:50') === 1 && T(e, '19:00') === 0.5 && T(e, '19:10') === 0 && T(e, '19:20') === 0,
      rising: mid.every((x, i) => i === 0 || Number(x.t) > Number(mid[i - 1].t)) && mid.every((x) => Number(x.t) > 0 && Number(x.t) < 1),
      brightening: m.slice(2, 12).every((x, i) => x.gLum > m[i + 1].gLum),   // 06:52 .. 07:10, each brighter than the step before
      oneSwitch: switches.length === 1 && m[0].room === 'night' && m[m.length - 1].room === 'day' && Number(m[switches[0]].t) > 0 && Number(m[switches[0]].t) < 1,
      lettersWithRoom: JSON.stringify(letterSwitches) === JSON.stringify(switches),
      inlineOnlyWhileFading: m.every((x) => (Number(x.t) > 0 && Number(x.t) < 1) === x.inline.includes('--ink-950')) && e.every((x) => (Number(x.t) > 0 && Number(x.t) < 1) === x.inline.includes('--ink-950')),
      rect: m.every((x) => same(m[0].rect.page, x.rect.page) && same(m[0].rect.col, x.rect.col)),
      page: m.every((x) => x.paper === m[0].paper && x.ink === m[0].ink) && !!m[0].paper,
      floors: floors.length === 0,
    };
    const brief = { ok, tone: m[0].tone, steps: m.map((x) => [x.at, x.t, x.room, x.g, x.letter]), evening: e.map((x) => [x.at, x.t, x.room]), switchAt: switches.map((i) => m[i].at), floors: floors.slice(0, 4) };
    if (Object.values(ok).some((x) => !x)) fail('R9-FADE', brief);
    say('r9-fade', { ...brief, page: [m[0].paper, m[0].ink, m[0].inkRatio], rect: m[0].rect.page, pairs: m.reduce((a, x) => a + x.pairs.length, 0) });
    console.log(`ARBOR-R9 FADE-DIP ${JSON.stringify({ tone: m[0].tone, stage: dip })}`);
  },

  // ── REDUCED MOTION: A CUT AT THE HOUR. With prefers-reduced-motion: reduce, following the clock: night at 06:55 and 06:59:59, day at 07:00;
  // day at 18:59:59, night at 19:00; nothing blended is written; and when the setting is lifted the fade comes back on its own (06:55 is mid-fade).
  'r9-reduced': async (app) => {
    await page(app, 'arbor-r9-reduced', WORDS);
    const seam = await clock(app, '06:55');
    const reads = {};
    let back = null;
    try {
      await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); await sleep(300);
      for (const s of ['06:55', '06:59:59', '07:00', '18:59:59', '19:00', '19:05']) { await clock(app, s); await sleep(80); reads[s] = await app.evalJs(STATE); }
      await clock(app, '06:55'); await sleep(80);
      reads.reduced0655 = await app.evalJs(STATE);
    } finally {
      await app.cdp('Emulation.setEmulatedMedia', { features: [] }).catch(() => {});
    }
    await sleep(400);
    back = await app.evalJs(STATE);   // no clock call: the media change alone re-applies
    const t = (s) => reads[s]?.t;
    const ok = {
      seam: seam !== 'NO-SEAM',
      cut: t('06:55') === '0' && t('06:59:59') === '0' && t('07:00') === '1' && t('18:59:59') === '1' && t('19:00') === '0' && t('19:05') === '0',
      rooms: reads['06:59:59']?.room === 'night' && reads['07:00']?.room === 'day' && reads['19:00']?.room === 'night',
      noBlend: Object.values(reads).every((x) => !x.inline.length),
      fadeBack: Number(back.t) > 0 && Number(back.t) < 1 && back.inline.includes('--ink-950'),
    };
    if (Object.values(ok).some((x) => !x)) fail('R9-REDUCED', { ok, reads: Object.fromEntries(Object.entries(reads).map(([k, v]) => [k, [v.t, v.room, v.inline.length]])), back });
    say('r9-reduced', { ok, reads: Object.fromEntries(Object.entries(reads).map(([k, v]) => [k, [v.t, v.room]])), back: [back.t, back.room] });
  },

  // ── THE PAGE NEVER MOVES, AT ANY HOUR: the same page with the flag OFF, then ON following the clock at 12:00, 22:00 and 07:00 (mid-fade), and
  // as Always day / Always night; Free Write (the Typewriter zoom) and Draft; the page's and its column's rects identical to half a pixel.
  'r9-rect': async (app) => {
    const out = {};
    for (const mode of ['freewrite', 'draft']) {
      const go = async (on) => { await page(app, 'arbor-r9-rect', WORDS, on); if (mode === 'draft') { await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(1400); } };
      await go(false); const off = await app.evalJs(RECT);
      await go(true);
      const at = {};
      for (const s of ['12:00', '22:00', '07:00']) { const seam = await clock(app, s); await sleep(300); at[s] = { seam, ...(await app.evalJs(RECT)), ...(await app.evalJs(STATE)) }; }
      for (const c of ['day', 'night']) { const picked = await pickRoom(app, c); at[c] = { picked, ...(await app.evalJs(RECT)), ...(await app.evalJs(STATE)) }; }
      await closeMood(app);
      const okAll = Object.values(at).every((x) => (x.seam === undefined || x.seam !== 'NO-SEAM') && (x.picked === undefined || x.picked) && same(off.page, x.page) && same(off.col, x.col));
      out[mode] = { off: off.page, at: Object.fromEntries(Object.entries(at).map(([k, v]) => [k, [v.page, v.t, v.room]])), ok: okAll && at['07:00'].t === '0.5' };
    }
    if (!out.freewrite.ok || !out.draft.ok) fail('R9-RECT', out);
    say('r9-rect', out);
  },

  // ── PICTURES FOR THE WRIZORS: the morning fade, following the clock, at 06:50 / 06:55 / 07:00 / 07:05 / 07:10 (Free Write; the job's two tones
  // give both pages), and the Mood menu open on the Room row. They assert only that the seam was there and the dayness took.
  ...Object.fromEntries([['0650', '0'], ['0655', null], ['0700', '0.5'], ['0705', null], ['0710', '1']].map(([hhmm, want]) => [`r9-pic-fade-${hhmm}`, async (app) => {
    await page(app, 'arbor-r9-pic', WORDS);
    const seam = await clock(app, `${hhmm.slice(0, 2)}:${hhmm.slice(2)}`);
    await app.evalJs(`document.querySelector('${ED}')?.blur()`); await sleep(900);
    const s = await app.evalJs(STATE);
    if (seam === 'NO-SEAM' || (want !== null ? s.t !== want : !(Number(s.t) > 0 && Number(s.t) < 1))) fail('R9-PIC', { hhmm, seam, s });
    say(`r9-pic-fade-${hhmm}`, { t: s.t, room: s.room, g: s.g, letter: s.letter });
  }])),
  'r9-pic-menu': async (app) => {
    await page(app, 'arbor-r9-pic', WORDS);
    const seam = await clock(app, '12:00');
    await openMood(app); await sleep(500);
    const row = await app.evalJs(ROWREAD);
    if (seam === 'NO-SEAM' || !row || row.opts.length !== 3) fail('R9-PIC-MENU', { seam, row });
    say('r9-pic-menu', row);
  },
};
