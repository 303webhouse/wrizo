// MACHINA v2 MOCKUP, ROUND r2 (Fable, Oct 31: Nick picked a separate Room setting) - the self-checks, as named screens for INK's frames job
// (-f themes=machina -f screens_file=apps/desktop/scripts/frames/machina2-r2.mjs). The room reads data-room when it is set, else it follows
// data-page; the mockup panel's Room row (Light / Dark) writes data-room, in session only, nothing stored.
// THE FOUR MIXES: the job sets the page tone (light | dark); each screen runs the room as Light AND as Dark through the panel's Room row, in both
// casts, so one job run with both tones covers all four room x page mixes, at 1366 and 1920.
// Every screen THROWS with its numbers when its check fails and prints them when it passes ("MACHINA2-R2 <screen> {...}"; a failure also prints
// "MACHINA2-R2-FAIL ..." in full). Written red-first: run against r1 (c6946794) before the r2 build. Seeds go through window.wrizo*. No imports.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The quarterly figures show a steady rise in exports. The tariff change explains part of it, but not all.\nThe second paragraph names the evidence: shipping records for March and April.\nA third paragraph asks who the reader is.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`MACHINA2-R2 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`MACHINA2-R2-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
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
const cast = async (app, c) => { await clickText(app, '.machina2-bar-opt', c === 'neutral' ? 'Neutral' : 'Cool'); await sleep(500); };
const build = async (app) => { await clickText(app, '.desk-mode-tab', 'Build'); await sleep(1200); };
// THE ROOM ROW: Light or Dark. Returns false when the row is not there (the red leg).
const pickRoom = async (app, room) => { const ok = await clickSel(app, `.machina2-bar [data-room-opt="${room}"]`); await sleep(600); return ok; };
const ROOM = `(() => { const r = document.documentElement; return { room: r.getAttribute('data-machina2-room'), dataRoom: r.getAttribute('data-room'), tone: r.getAttribute('data-page'), cast: r.getAttribute('data-cast') }; })()`;
const COLOUR = `
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };
  const hex = (c) => c ? '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
  const ground = (el) => { const layers = []; for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } }
    let g = layers.length && layers[layers.length - 1].a >= 1 ? layers.pop() : (parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 0, g: 0, b: 0, a: 1 }); while (layers.length) g = over(layers.pop(), g); return g; };
  const shown = (el) => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false; } return true; };
  const pair = (el) => { const g = ground(el); const fg = over(parse(getComputedStyle(el).color), g); return { fg: hex(fg), bg: hex(g), ratio: ratio(fg, g) }; };
  const textEls = (root) => [...root.querySelectorAll('*')].concat([root]).filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && shown(el));
  const tok = (el, name) => { const v = getComputedStyle(el).getPropertyValue(name).trim(); if (!v) return null; const i = document.createElement('i'); i.style.color = v; el.appendChild(i); const c = parse(getComputedStyle(i).color); i.remove(); return c; };
`;
const RECT = `(() => { const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left * 10) / 10, t: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };
  return { page: r(document.querySelector('.mode-page')), col: r(document.querySelector('.mode-pagecol')), w: innerWidth }; })()`;
const same = (a, b) => !!a && !!b && ['l', 't', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);
// the spec's rooms (§2) and pages: ROOM[room][cast], PAPER[tone]
const ROOMS = { light: { cool: '#E6E8EA', neutral: '#E9E6E1' }, dark: { cool: '#151719', neutral: '#171614' } };
const PAPER = { light: '#FBFBFA', dark: '#1A1B1D' }, INK = { light: '#1C1C1C', dark: '#E6E6E3' };
const BAR = { cool: '#1E262E', neutral: '#201E1B' };

export default {
  // PARKED 2026-11-01 (SUPERSEDED by Fable's ruling, Nov 1: "Room settled: Follow the clock / Always day / Always night (unset = clock,
  // 07:00-19:00 local)" - unset, the room no longer follows the tone, and the row's buttons are the three choices). Kept verbatim under the
  // name m2r2-room-v1 (not in r2's run list any more); SUCCESSOR: m2r3-room in scripts/frames/machina2-r3.mjs.
  // ── THE ROOM ROW. Unset, the room follows the tone (no data-room; "follows Page" shown, the tone's room pressed); pressing the other room writes
  // data-room and the room changes while the PAGE keeps the tone's paper; with data-room set a change of tone no longer moves the room; removed,
  // the room follows the tone again; no storage key appears; a reload forgets the choice (in session only).
  'm2r2-room-v1': async (app) => {
    await page(app, 'm2r2-room', WORDS);
    const keys0 = await app.evalJs('Object.keys(localStorage).sort()');
    const paperOf = `(() => { ${COLOUR} return hex(parse(getComputedStyle(document.querySelector('.mode-page')).backgroundColor)); })()`;
    const s0 = await app.evalJs(ROOM), paper0 = await app.evalJs(paperOf);
    const row = await app.evalJs(`(() => { const g = document.querySelector('.machina2-bar [role="group"][aria-label="Room"]'); if (!g) return null;
      return { text: g.textContent.replace(/\\s+/g, ' ').trim(), opts: [...g.querySelectorAll('[data-room-opt]')].map((b) => [b.getAttribute('data-room-opt'), b.textContent.trim(), b.getAttribute('aria-pressed')]) }; })()`);
    const tr = s0.tone === 'light' ? 'light' : 'dark', other = tr === 'light' ? 'dark' : 'light';
    const picked = await pickRoom(app, other);
    const s1 = await app.evalJs(ROOM), paper1 = await app.evalJs(paperOf);
    const note1 = await app.evalJs(`(document.querySelector('.machina2-bar [role="group"][aria-label="Room"]')?.textContent || '').includes('follows Page')`);
    // the room is set to `other`; flip the tone to the room's own tone and back - neither must move it (read while the tone is the other one)
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(tr === 'light' ? 'dark' : 'light')})`); await sleep(100);
    await app.evalJs(`document.documentElement.setAttribute('data-page', ${JSON.stringify(tr)})`); await sleep(100);
    const s2 = await app.evalJs(ROOM);
    await app.evalJs("document.documentElement.removeAttribute('data-room')"); await sleep(100);
    const s3 = await app.evalJs(ROOM);
    await pickRoom(app, other); await sleep(400);
    const keys1 = await app.evalJs('Object.keys(localStorage).sort()');
    await load(app, '#/page/m2r2-room'); await sleep(800);
    const s4 = await app.evalJs(ROOM);
    const ok = {
      follows: !s0.dataRoom && s0.room === tr,
      row: !!row && /follows Page/.test(row.text) && JSON.stringify(row.opts.map((o) => o.slice(0, 2))) === '[["light","Light"],["dark","Dark"]]' && row.opts.find((o) => o[0] === tr)?.[2] === 'true',
      picks: picked && s1.room === other && s1.dataRoom === other && !note1,
      pageKept: !!paper0 && paper0 === paper1 && paper0 === PAPER[tr],
      holds: s2.room === other,
      unset: !s3.dataRoom && s3.room === tr,
      noStorage: JSON.stringify(keys0) === JSON.stringify(keys1) && !keys1.some((k) => /room/i.test(k)),
      session: !s4.dataRoom && s4.room === tr,
    };
    if (Object.values(ok).some((x) => !x)) fail('M2R2-ROOM', { ok, s0, s1, s2, s3, s4, row, paper0, paper1, newKeys: keys1.filter((k) => !keys0.includes(k)) });
    say('m2r2-room', { ok, tone: s0.tone, row });
  },

  // ── THE PAGE NEVER MOVES, IN EVERY MIX: flag off vs on with the room Light and Dark, Sprint (Free Write) and Build (Draft), both casts.
  'm2r2-rect': async (app) => {
    const out = {};
    for (const mode of ['sprint', 'build']) {
      await page(app, 'm2r2-rect', WORDS, false); if (mode === 'build') await build(app);
      const off = await app.evalJs(RECT);
      await page(app, 'm2r2-rect', WORDS, true); if (mode === 'build') await build(app);
      const rows = [];
      for (const c of ['cool', 'neutral']) {
        await cast(app, c);
        for (const room of ['light', 'dark']) { const picked = await pickRoom(app, room); rows.push({ cast: c, picked, ...(await app.evalJs(RECT)), ...(await app.evalJs(ROOM)) }); }
      }
      await cast(app, 'cool');
      out[mode] = { off: off.page, rows: rows.map((r) => [r.cast, r.room, r.page]), ok: rows.length === 4 && rows.every((r) => r.picked && same(off.page, r.page) && same(off.col, r.col)) && rows.map((r) => r.room).join() === 'light,dark,light,dark' };
    }
    if (!out.sprint.ok || !out.build.ok) fail('M2R2-RECT', out);
    say('m2r2-rect', out);
  },

  // ── THE CONTRAST FLOORS, IN EVERY MIX. The room Light and Dark under the job's tone, both casts, drawers closed / Controls open / Consultant
  // open: every lettered thing on the bars, the rail, the stage (the page, its title, the readout), the drawers, the Consultant, the mockup panel
  // and the mark >= 4.5:1. The ROOM is the room's (§2: G1 / #E9E6E1 light, G7 / #171614 dark), the bars dark in both (by cast); the PAGE is the
  // tone's (#FBFBFA / #1A1B1D, ink #1C1C1C / #E6E6E3) with its ink >= 7:1 and its low ink >= 4.5:1, in either room. No pure white chrome.
  'm2r2-contrast': async (app) => {
    await page(app, 'm2r2-contrast', WORDS);
    await app.evalJs("window.wrizoSetWritingGoal && window.wrizoSetWritingGoal({ n: 300, unit: 'words' })");
    const READ = (stage) => `(() => { ${COLOUR}
      const root = document.documentElement;
      const out = { stage: ${JSON.stringify(stage)}, room: root.getAttribute('data-machina2-room'), tone: root.getAttribute('data-page'), cast: root.getAttribute('data-cast') === 'neutral' ? 'neutral' : 'cool', pairs: [], bad: [] };
      const add = (where, el, floor) => { if (!el || !shown(el)) return; const p = pair(el); const row = { where, text: (el.textContent || '').trim().slice(0, 16), ...p, floor }; out.pairs.push(row); if (p.ratio < floor) out.bad.push(row); };
      const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0), rail = document.querySelector('.desk-frame-strip, .desk-rail');
      out.ground = hex(parse(getComputedStyle(root).backgroundColor)); out.bar = bar ? hex(ground(bar)) : null; out.rail = rail ? hex(ground(rail)) : null;
      for (const [where, sel] of [['bar', '.chrome-top.sprint-nav'], ['rail', '.desk-frame-strip, .desk-rail'], ['panel', '.machina2-bar']])
        document.querySelectorAll(sel).forEach((r) => textEls(r).forEach((el) => add(where, el, 4.5)));
      const stage = document.querySelector('.mode-stage');
      if (stage) textEls(stage).filter((el) => !el.closest('.forward-only-editor')).forEach((el) => add(el.closest('.mode-page') ? 'page' : el.closest('.wz-sliver') ? 'drawer' : el.closest('.wz-tutor, .wz-tutor-panel') ? 'consultant' : 'stage', el, 4.5));
      document.querySelectorAll('.wz-tutor-panel[data-open="true"], .wz-sliver[data-open="true"]').forEach((r) => { if (!stage || !stage.contains(r)) textEls(r).forEach((el) => add('drawer', el, 4.5)); });
      add('mark', document.querySelector('.brand-mark'), 4.5);
      const p = document.querySelector('.mode-page'), ed = document.querySelector('${ED}');
      const paper = p ? parse(getComputedStyle(p).backgroundColor) : null, ink = ed ? parse(getComputedStyle(ed).color) : null, low = p ? tok(p, '--ink-on-paper-low') : null;
      out.page = { paper: hex(paper), ink: hex(ink), low: hex(low), inkRatio: paper && ink ? ratio(ink, paper) : null, lowRatio: paper && low ? ratio(low, paper) : null };
      out.white = [...document.querySelectorAll('.chrome-top, .desk-frame-strip, .desk-rail, .wz-sliver-panel, .wz-tutor-panel, .wz-cascade-panel, .machina2-bar')].filter((el) => /^rgb\\(255, 255, 255\\)$/.test(getComputedStyle(el).backgroundColor)).length;
      return out; })()`;
    const reads = [], picks = [];
    for (const c of ['cool', 'neutral']) {
      await cast(app, c);
      for (const room of ['light', 'dark']) {
        picks.push(await pickRoom(app, room));
        reads.push(await app.evalJs(READ(`${c} ${room} closed`)));
        await clickSel(app, '.wz-sliver-grip'); await sleep(600);
        reads.push(await app.evalJs(READ(`${c} ${room} controls`)));
        await clickSel(app, '.wz-sliver-grip'); await sleep(400);
        await clickSel(app, '.wz-tutor-grip'); await sleep(700);
        reads.push(await app.evalJs(READ(`${c} ${room} consultant`)));
        await clickSel(app, '.wz-tutor-grip'); await sleep(400);
      }
    }
    await cast(app, 'cool');
    const problems = [];
    if (picks.some((x) => !x)) problems.push({ picks });
    for (const r of reads) {
      const want = r.stage.split(' ')[1], tone = r.tone === 'light' ? 'light' : 'dark';
      if (r.room !== want) problems.push({ stage: r.stage, room: r.room });
      if (r.bad.length) problems.push({ stage: r.stage, low: r.bad.slice(0, 4) });
      if (r.ground !== ROOMS[want][r.cast]) problems.push({ stage: r.stage, ground: r.ground });
      if (r.bar !== BAR[r.cast] || r.rail !== BAR[r.cast]) problems.push({ stage: r.stage, bars: [r.bar, r.rail] });
      if (r.page.paper !== PAPER[tone] || r.page.ink !== INK[tone] || !(r.page.inkRatio >= 7) || !(r.page.lowRatio >= 4.5)) problems.push({ stage: r.stage, page: r.page });
      if (r.white) problems.push({ stage: r.stage, white: r.white });
    }
    const all = reads.flatMap((r) => r.pairs);
    if (problems.length) fail('M2R2-CONTRAST', { tone: reads[0]?.tone, problems: problems.slice(0, 6) });
    say('m2r2-contrast', { tone: reads[0].tone, pairs: all.length, min: Math.min(...all.map((p) => p.ratio)), mixes: reads.filter((r) => r.stage.endsWith('closed')).map((r) => [r.stage, r.ground, r.page.paper, r.page.inkRatio, r.page.lowRatio]),
      table: [...new Map(all.map((p) => [`${p.where}|${p.fg}|${p.bg}`, `${p.where}: ${p.fg} on ${p.bg} = ${p.ratio}`])).values()] });
  },

  // ── PICTURES FOR THE WRIZORS: each screen leaves the page in one room (COOL), so with the job's two tones the frames show all four mixes. They
  // assert only that the row was there and the room took.
  ...Object.fromEntries([['light', 'sprint'], ['light', 'build'], ['dark', 'sprint'], ['dark', 'build']].map(([room, mode]) => [`m2r2-pic-${room}-${mode}`, async (app) => {
    await page(app, 'm2r2-pic', WORDS);
    if (mode === 'build') await build(app);
    const picked = await pickRoom(app, room);
    await app.evalJs(`document.querySelector('${ED}')?.blur()`); await sleep(600);
    const s = await app.evalJs(ROOM);
    if (!picked || s.room !== room) fail('M2R2-PIC', { room, mode, picked, s });
    say(`m2r2-pic-${room}-${mode}`, s);
  }])),

  // ── THE BOARD'S CARDS FOLLOW THE PAGE, NOT THE ROOM: a dark page's cards are dark (#23272B / #242220) in either room, a light page's white;
  // their ink >= 7:1 on the card; both casts.
  'm2r2-board': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'm2r2-board', text: 'R2 board', pageType: 'board', boxes: [{ id: 'm2r2-box', kind: 'text', x: 0.08, y: 0.1, w: 0.3, h: 0.14, z: 1, text: 'A card on the board' }], createdAt: '2026-04-01T00:00:00.000Z', source: null, origin: null })})`);
    await sleep(300);
    await load(app, '#/page/m2r2-board');
    await waitSoft(app, "!!document.querySelector('.board-canvas, .board-canvas-wrap')", { label: 'board', timeout: 8000 });
    await sleep(1200);
    const READ = `(() => { ${COLOUR}
      const box = document.querySelector('.board-box');
      const txt = box && ([...box.querySelectorAll('*')].find((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || box);
      const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) return c; } return null; };
      const cardBg = box ? bgOf(txt) : null, cardInk = txt ? parse(getComputedStyle(txt).color) : null;
      return { room: document.documentElement.getAttribute('data-machina2-room'), tone: document.documentElement.getAttribute('data-page'), cast: document.documentElement.getAttribute('data-cast'),
        card: hex(cardBg), ink: hex(cardInk), inkRatio: cardBg && cardInk ? ratio(cardInk, cardBg) : null, box: !!box }; })()`;
    const rows = [];
    for (const c of ['cool', 'neutral']) { await cast(app, c); for (const room of ['light', 'dark']) { const picked = await pickRoom(app, room); rows.push({ c, want: room, picked, ...(await app.evalJs(READ)) }); } }
    await cast(app, 'cool');
    const CARD = { light: { cool: '#FFFFFF', neutral: '#FFFFFF' }, dark: { cool: '#23272B', neutral: '#242220' } };
    const ok = rows.map((r) => r.picked && r.box && r.room === r.want && r.card === CARD[r.tone === 'light' ? 'light' : 'dark'][r.c] && r.inkRatio >= 7);
    if (ok.some((x) => !x)) fail('M2R2-BOARD', { ok, rows });
    say('m2r2-board', { ok, rows: rows.map((r) => [r.c, r.room, r.tone, r.card, r.ink, r.inkRatio]) });
  },
};
