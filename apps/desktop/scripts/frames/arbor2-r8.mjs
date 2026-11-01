// ARBOR v2 MOCKUP, ROUND r8 (Fable, Oct 31: Nick picked a separate Room setting) - the self-checks, as named screens for INK's frames job
// (-f screens_file=apps/desktop/scripts/frames/arbor2-r8.mjs). In the mockup the room reads data-room when it is set, else it follows data-page;
// the bar's old Room switch is the Room control now, "Room: Day / Night" at the head of the Mood menu. In session only, nothing stored.
// THE FOUR MIXES: the job sets the page tone (light | dark); each screen then runs the room as Day AND as Night through the Mood menu's control,
// so one job run with both tones covers all four room x page mixes, at 1366 and 1920.
// Every screen THROWS with its numbers when its check fails and prints them when it passes ("ARBOR-R8 <screen> {...}"; a failure also prints
// "ARBOR-R8-FAIL ..." in full - the job keeps 300 characters of an error). Written red-first: run against r7 (018e637d) before the r8 build.
// Seeds go through the app's seams (window.wrizo*), never raw collection storage. No imports.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R8 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R8-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
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
// THE ROOM CONTROL: open the Mood menu (folded by default) and press Day or Night. Returns false when the control is not there (the red leg).
const pickRoom = async (app, room) => {
  await app.evalJs(`(() => { const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') !== 'true'); if (m) m.click(); })()`);
  await sleep(150);
  const ok = await clickSel(app, `.arbor2-mood [data-room-opt="${room}"]`);
  await sleep(900);   // index.css transitions run up to .8 s
  return ok;
};
const ROOM = `(() => { const r = document.documentElement; return { room: r.getAttribute('data-arbor2-room'), dataRoom: r.getAttribute('data-room'), tone: r.getAttribute('data-page') }; })()`;
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
`;
const RECT = `(() => { const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left * 10) / 10, t: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };
  const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0);
  return { page: r(document.querySelector('.mode-page')), col: r(document.querySelector('.mode-pagecol')), bar: r(bar), zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null, w: innerWidth }; })()`;
const same = (a, b) => !!a && !!b && ['l', 't', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);

export default {
  // PARKED 2026-11-01 (SUPERSEDED by Fable's ruling, Nov 1: "Room settled: Follow the clock / Always day / Always night (unset = clock,
  // 07:00-19:00 local)" - unset, the room no longer follows the tone, and the row's buttons are the three choices). Kept verbatim under the
  // name r8-room-v1 (not in r8's run list any more); SUCCESSOR: r9-room in scripts/frames/arbor2-r9.mjs.
  // ── THE ROOM CONTROL. Unset, the room follows the tone (no data-room; the row says "follows Page"); the Mood menu's FIRST row is "Room" with
  // Day and Night; pressing the other room writes data-room (Day = light, Night = dark) and the room changes while the PAGE keeps the tone's
  // paper; with data-room set a change of tone no longer moves the room, and with it removed the room follows the tone again; no storage key
  // appears; a reload forgets the choice (in session only).
  'r8-room-v1': async (app) => {
    await page(app, 'arbor-r8-room', WORDS);
    const keys0 = await app.evalJs('Object.keys(localStorage).sort()');
    const paperOf = `(() => { ${COLOUR} return hex(parse(getComputedStyle(document.querySelector('.mode-page')).backgroundColor)); })()`;
    const s0 = await app.evalJs(ROOM), paper0 = await app.evalJs(paperOf);
    await app.evalJs(`(() => { const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') !== 'true'); if (m) m.click(); })()`);
    await sleep(200);
    const row = await app.evalJs(`(() => { const first = document.querySelector('.arbor2-mood > li'); if (!first) return null;
      return { label: first.getAttribute('aria-label'), text: first.textContent.replace(/\\s+/g, ' ').trim(), opts: [...first.querySelectorAll('[data-room-opt]')].map((b) => [b.getAttribute('data-room-opt'), b.textContent.trim(), b.getAttribute('aria-pressed')]) }; })()`);
    const other = s0.room === 'night' ? 'day' : 'night';
    const picked = await pickRoom(app, other);
    const s1 = await app.evalJs(ROOM), paper1 = await app.evalJs(paperOf);
    const note1 = await app.evalJs(`(document.querySelector('.arbor2-mood > li')?.textContent || '').includes('follows Page')`);
    // the resolver: with data-room set the tone no longer moves the room; removed, the room follows the tone again (attribute probes)
    const flipTone = s0.tone === 'dark' ? 'light' : 'dark';
    // (read with the tone BACK at the original: following the page would give s0.room there, so only a held data-room gives `other`)
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(flipTone)})`); await sleep(100);
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(s0.tone)})`); await sleep(100);
    const s2 = await app.evalJs(ROOM);
    await app.evalJs("document.documentElement.removeAttribute('data-room')"); await sleep(100);
    const s3 = await app.evalJs(ROOM);
    await pickRoom(app, other);
    await sleep(500);
    const keys1 = await app.evalJs('Object.keys(localStorage).sort()');
    await load(app, '#/page/arbor-r8-room'); await sleep(800);
    const s4 = await app.evalJs(ROOM);
    const ok = {
      follows: !s0.dataRoom && s0.room === (s0.tone === 'dark' ? 'night' : 'day'),
      row: !!row && row.label === 'Room' && /follows Page/.test(row.text) && JSON.stringify(row.opts.map((o) => o.slice(0, 2))) === '[["day","Day"],["night","Night"]]' && row.opts.find((o) => o[0] === s0.room)?.[2] === 'true',
      picks: picked && s1.room === other && s1.dataRoom === (other === 'day' ? 'light' : 'dark') && !note1,
      pageKept: !!paper0 && paper0 === paper1,
      holds: s2.room === other,
      unset: !s3.dataRoom && s3.room === s0.room,
      noStorage: JSON.stringify(keys0) === JSON.stringify(keys1) && !keys1.some((k) => /room/i.test(k)),
      session: !s4.dataRoom && s4.room === s0.room,
    };
    if (Object.values(ok).some((x) => !x)) fail('R8-ROOM', { ok, s0, s1, s2, s3, s4, row, paper0, paper1, newKeys: keys1.filter((k) => !keys0.includes(k)) });
    say('r8-room', { ok, tone: s0.tone, follows: s0.room, picked: s1, row });
  },

  // ── THE PAGE NEVER MOVES, IN EVERY MIX: the same page with the flag OFF, then ON with the room as Day and as Night (the job sets the tone),
  // in Free Write (the Typewriter zoom) and in Draft; the page's and its column's rects identical to half a pixel; the top bar flush.
  'r8-rect': async (app) => {
    const out = {};
    for (const mode of ['freewrite', 'draft']) {
      const go = async (on) => { await page(app, 'arbor-r8-rect', WORDS, on); if (mode === 'draft') { await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(1400); } };
      await go(false); const off = await app.evalJs(RECT);
      await go(true);
      const rooms = {};
      for (const room of ['day', 'night']) { const picked = await pickRoom(app, room); rooms[room] = { picked, ...(await app.evalJs(RECT)), ...(await app.evalJs(ROOM)) }; }
      out[mode] = { off, rooms, ok: ['day', 'night'].every((k) => rooms[k].picked && rooms[k].room === k && same(off.page, rooms[k].page) && same(off.col, rooms[k].col) && !!rooms[k].bar && rooms[k].bar.t <= 0.5) };
    }
    const brief = Object.fromEntries(Object.entries(out).map(([m, v]) => [m, { ok: v.ok, off: v.off.page, day: v.rooms.day.page, night: v.rooms.night.page, zoom: v.rooms.day.zoom, tone: v.rooms.day.tone, w: v.off.w,
      rooms: [v.rooms.day.room, v.rooms.night.room], bar: [v.rooms.day.bar?.t, v.rooms.night.bar?.t] }]));
    if (!out.freewrite.ok || !out.draft.ok) fail('R8-RECT', brief);
    say('r8-rect', brief);
  },

  // ── THE CONTRAST FLOORS, IN EVERY MIX. With the room as Day and as Night (the job sets the tone): every lettered thing on the bars, the rail,
  // the stage (the page, its title, the count row), the open drawers and their cloths >= 4.5:1, the opener arrows and the "..." >= 3:1 - each
  // label lit in its own colours (as r5-contrast reads it). The ROOM is the room's (its ground tokens, the espresso bars); the PAGE is the
  // tone's (#1A1510 dark / #F3EDE1 light) with its ink >= 13.9:1 and its low ink >= 4.5:1 in either room. Stages: Free Write closed, the Tools
  // drawer open, Draft closed, the Tutor open on Grafts.
  'r8-contrast': async (app) => {
    const READ = (stage) => `(() => { ${COLOUR}
      const root = document.documentElement;
      const out = { stage: ${JSON.stringify(stage)}, room: root.getAttribute('data-arbor2-room'), tone: root.getAttribute('data-page'), pairs: [], bad: [] };
      const add = (where, el, floor) => { if (!el || !shown(el)) return; const p = pair(el); const row = { where, text: (el.textContent || '').trim().slice(0, 18), ...p, floor }; out.pairs.push(row); if (p.ratio < floor) out.bad.push(row); };
      const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0);
      const rail = document.querySelector('.desk-frame-strip');
      out.barBg = bar ? hex(ground(bar)) : null; out.railBg = rail ? hex(ground(rail.querySelector('.wz-strip-item') || rail)) : null;
      if (bar) textEls(bar).forEach((el) => add('bar', el, 4.5));
      if (rail) textEls(rail).forEach((el) => add('rail', el, 4.5));
      const stage = document.querySelector('.mode-stage');
      if (stage) textEls(stage).filter((el) => !el.closest('.forward-only-editor')).forEach((el) => add(el.closest('.mode-page') ? 'page' : el.closest('.wz-sliver, .wz-tutor') ? 'drawer' : 'stage', el, 4.5));
      document.querySelectorAll('.wz-drawer-tab').forEach((t) => add('cloth ' + t.id, t, 4.5));
      add('dots', document.querySelector('.gh-corner-glyph'), 3);
      [...document.querySelectorAll('.wz-sliver-grip, .wz-tutor-grip')].filter(shown).forEach((g) => add('grip', g.querySelector('span') || g, 3));
      const cs = getComputedStyle(root);
      out.tokens = { g: cs.getPropertyValue('--ink-950').trim().toUpperCase(), s: cs.getPropertyValue('--ink-900').trim().toUpperCase() };
      const p = document.querySelector('.mode-page'), ed = document.querySelector('${ED}'), sheet = document.querySelector('.arbor2-paper[data-on="true"]');
      const paper = p ? parse(sheet ? getComputedStyle(sheet).backgroundColor : getComputedStyle(p).backgroundColor) : null, ink = ed ? parse(getComputedStyle(ed).color) : null, low = p ? tok(p, '--ink-on-paper-low') : null;
      out.page = { paper: hex(paper), ink: hex(ink), low: hex(low), inkRatio: paper && ink ? ratio(ink, paper) : null, lowRatio: paper && low ? ratio(low, paper) : null };
      return out; })()`;
    await page(app, 'arbor-r8-contrast', WORDS);
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'arbor2-r8-lit'; s.textContent = '*{ --arbor2-dim:1 !important; transition:none !important; }'; document.head.appendChild(s); document.documentElement.setAttribute('data-arbor2-lit', ''); })()");
    const reads = [], picks = {};
    for (const room of ['day', 'night']) {
      picks[room] = await pickRoom(app, room);
      if (await app.evalJs("!!document.querySelector('.desk-mode-tab.active') && document.querySelector('.desk-mode-tab.active').textContent.trim().toLowerCase() !== 'free write'")) { await clickText(app, '.desk-mode-tab', 'Free Write'); await sleep(1200); }
      reads.push(await app.evalJs(READ(room + ' freewrite')));
      await clickSel(app, '.wz-sliver-grip');
      await waitSoft(app, "!!document.querySelector(\".wz-sliver[data-open='true']\")", { label: 'tools open', timeout: 3000 }); await sleep(500);
      reads.push(await app.evalJs(READ(room + ' tools')));
      await clickSel(app, '.wz-sliver-grip'); await sleep(400);
      await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(1200);
      reads.push(await app.evalJs(READ(room + ' draft')));
      await clickSel(app, '.wz-tutor-grip'); await sleep(700);
      await clickSel(app, '#wz-tutor-tab-links'); await sleep(300);
      reads.push(await app.evalJs(READ(room + ' tutor grafts')));
      await clickSel(app, '.wz-tutor-grip'); await sleep(400);
    }
    const ESP = '#1B120C';
    const dark = reads[0].tone === 'dark';
    const PAPER = dark ? '#1A1510' : '#F3EDE1';
    const problems = [];
    for (const r of reads) {
      const want = r.stage.startsWith('day') ? 'day' : 'night';
      if (r.room !== want) problems.push({ stage: r.stage, room: r.room });
      if (r.bad.length) problems.push({ stage: r.stage, low: r.bad.slice(0, 4) });
      if (r.barBg !== ESP || r.railBg !== ESP) problems.push({ stage: r.stage, bars: [r.barBg, r.railBg] });
      // the room's ground: night #120A06 / raised #1B120C; day the plaster (R >= 0xEC, B >= 0xC4) with raised #E8DFC8
      const n = parseInt(r.tokens.g.replace('#', ''), 16);
      const roomOk = want === 'night' ? r.tokens.g === '#120A06' && r.tokens.s === '#1B120C' : (n >> 16) >= 0xEC && (n & 255) >= 0xC4 && r.tokens.s === '#E8DFC8';
      if (!roomOk) problems.push({ stage: r.stage, tokens: r.tokens });
      if (r.page.paper !== PAPER || !(r.page.inkRatio >= 13.9) || !(r.page.lowRatio >= 4.5)) problems.push({ stage: r.stage, page: r.page });
    }
    if (!picks.day || !picks.night) problems.unshift({ picks });
    const all = reads.flatMap((r) => r.pairs);
    if (problems.length) fail('R8-CONTRAST', { tone: reads[0].tone, problems: problems.slice(0, 6) });
    say('r8-contrast', { tone: reads[0].tone, pairs: all.length, min: Math.min(...all.map((p) => p.ratio)), pages: reads.map((r) => [r.stage, r.page.paper, r.page.ink, r.page.inkRatio, r.page.lowRatio]),
      table: [...new Map(all.map((p) => [`${p.where}|${p.fg}|${p.bg}`, `${p.where}: ${p.fg} on ${p.bg} = ${p.ratio}`])).values()] });
  },

  // ── PICTURES FOR THE WRIZORS: each screen leaves the page in one room (the Mood menu folded again), so with the job's two tones the frames show
  // all four mixes. They assert only that the control was there and the room took.
  ...Object.fromEntries([['day', 'freewrite'], ['day', 'draft'], ['night', 'freewrite'], ['night', 'draft']].map(([room, mode]) => [`r8-pic-${room}-${mode}`, async (app) => {
    await page(app, 'arbor-r8-pic', WORDS);
    if (mode === 'draft') { await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(1400); }
    const picked = await pickRoom(app, room);
    await app.evalJs(`(() => { const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') === 'true'); if (m) m.click(); })()`);
    await app.evalJs(`document.querySelector('${ED}')?.blur()`); await sleep(900);
    const s = await app.evalJs(ROOM);
    if (!picked || s.room !== room) fail('R8-PIC', { room, mode, picked, s });
    say(`r8-pic-${room}-${mode}`, s);
  }])),

  // ── PAGE ONLY, IN BOTH ROOMS: the board keeps its cream stock and its cards their cream card and dark ink (>= 7:1), by Day and by Night.
  'r8-board': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'arbor-r8-board', text: 'R8 board', pageType: 'board', boxes: [{ id: 'arbor-r8-box', kind: 'text', x: 0.08, y: 0.1, w: 0.3, h: 0.14, z: 1, text: 'A card on the board' }], createdAt: '2026-04-01T00:00:00.000Z', source: null, origin: null })})`);
    await sleep(300);
    await load(app, '#/page/arbor-r8-board');
    await waitSoft(app, "!!document.querySelector('.board-canvas, .board-canvas-wrap')", { label: 'board', timeout: 8000 });
    await sleep(1200);
    const READ = `(() => { ${COLOUR}
      const wrap = document.querySelector('.board-canvas-wrap') || document.querySelector('.board-canvas'), box = document.querySelector('.board-box');
      const txt = box && ([...box.querySelectorAll('*')].find((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || box);
      const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) return c; } return null; };
      const cardBg = box ? bgOf(txt) : null, cardInk = txt ? parse(getComputedStyle(txt).color) : null;
      return { room: document.documentElement.getAttribute('data-arbor2-room'), tone: document.documentElement.getAttribute('data-page'), wrap: wrap ? hex(parse(getComputedStyle(wrap).backgroundColor)) : null,
        card: hex(cardBg), ink: hex(cardInk), inkRatio: cardBg && cardInk ? ratio(cardInk, cardBg) : null, box: !!box }; })()`;
    const cream = (h) => !!h && (() => { const n = parseInt(h.slice(1), 16); return (n >> 16) >= 0xE8 && ((n >> 8) & 255) >= 0xE0 && (n & 255) >= 0xC8; })();
    const reads = {};
    for (const room of ['day', 'night']) { const picked = await pickRoom(app, room); reads[room] = { picked, ...(await app.evalJs(READ)) }; }
    const ok = Object.fromEntries(Object.entries(reads).map(([k, r]) => [k, r.picked && r.room === k && cream(r.wrap) && r.box && cream(r.card) && r.inkRatio !== null && r.inkRatio >= 7]));
    if (Object.values(ok).some((x) => !x)) fail('R8-BOARD', { ok, reads });
    say('r8-board', { ok, reads });
  },
};
