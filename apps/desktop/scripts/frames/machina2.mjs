// MACHINA v2 MOCKUP, ROUND r1 (spec draft 4, md5 6aed2bef; Fable's brief, Oct 31) - the self-checks, as named screens for INK's frames job
// (-f themes=machina -f screens_file=apps/desktop/scripts/frames/machina2.mjs). The job sets the page tone: light = the light room, dark = the
// dark room (the room follows the existing Page tone). Each screen tries BOTH casts (the mockup panel's Cast row = the app's own setCast) and
// puts COOL back before it ends. Every screen THROWS with its numbers when its check fails and prints them when it passes ("MACHINA2 <screen>
// {...}"; a failure also prints "MACHINA2-FAIL ..." in full - the job keeps only 300 characters of an error). Written red-first: run against
// main (no mockup) before the build. Seeds go through the app's seams (window.wrizo*), never raw collection storage. No imports.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The quarterly figures show a steady rise in exports. The tariff change explains part of it, but not all.\nThe second paragraph names the evidence: shipping records for March and April.\nA third paragraph asks who the reader is.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`MACHINA2 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`MACHINA2-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash, on = true) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?machina2=1' : '/')} + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, `document.documentElement.getAttribute('data-machina2') ${on ? "=== 'true'" : '== null'}`, { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const seedPage = (app, row) => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page', ...row })})`);
const page = async (app, id, text, on = true) => {
  await seedPage(app, { id, text });
  await sleep(300);
  await load(app, '#/page/' + id, on);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1200);
};
const cast = async (app, c) => { await clickText(app, '.machina2-bar-opt', c === 'neutral' ? 'Neutral' : 'Cool'); await sleep(500); };
const build = async (app) => { await clickText(app, '.desk-mode-tab', 'Build'); await sleep(1200); };
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
`;
const RECT = `(() => { const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left * 10) / 10, t: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };
  return { page: r(document.querySelector('.mode-page')), col: r(document.querySelector('.mode-pagecol')) }; })()`;
const same = (a, b) => !!a && !!b && ['l', 't', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);

export default {
  // ── THE PAGE NEVER MOVES: flag off vs on, Sprint (Free Write) and Build (Draft), both casts; the page's rect identical to half a pixel.
  'm2-rect': async (app) => {
    const out = {};
    for (const mode of ['sprint', 'build']) {
      await page(app, 'm2-rect', WORDS, false); if (mode === 'build') await build(app);
      const off = await app.evalJs(RECT);
      await page(app, 'm2-rect', WORDS, true); if (mode === 'build') await build(app);
      const cool = await app.evalJs(RECT);
      await cast(app, 'neutral'); const neutral = await app.evalJs(RECT); await cast(app, 'cool');
      out[mode] = { off: off.page, cool: cool.page, neutral: neutral.page, ok: same(off.page, cool.page) && same(off.page, neutral.page) && same(off.col, cool.col) };
    }
    if (!out.sprint.ok || !out.build.ok) fail('M2-RECT', out);
    say('m2-rect', out);
  },

  // ── THE PALETTE AND EVERY PAIR (§2). The room follows the tone; the bars are dark in both tones with the cast's temperature; the page is the
  // spec's; guidance is the cool blue; labels >= 4.5:1 everywhere read (bars, rail, the room's chrome, the Controls drawer, the Consultant,
  // the readout); no pure white chrome. Both casts.
  'm2-contrast': async (app) => {
    await page(app, 'm2-contrast', WORDS);
    await app.evalJs("window.wrizoSetWritingGoal && window.wrizoSetWritingGoal({ n: 300, unit: 'words' })");
    const READ = (stage) => `(() => { ${COLOUR}
      const root = document.documentElement, light = root.getAttribute('data-page') === 'light', neutral = root.getAttribute('data-cast') === 'neutral';
      const out = { stage: ${JSON.stringify(stage)}, light, neutral, pairs: [], bad: [] };
      const add = (where, el, floor) => { if (!el || !shown(el)) return; const p = pair(el); const row = { where, text: (el.textContent || '').trim().slice(0, 16), ...p, floor }; out.pairs.push(row); if (p.ratio < floor) out.bad.push(row); };
      const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0), rail = document.querySelector('.desk-frame-strip, .desk-rail');
      out.room = hex(parse(getComputedStyle(root).backgroundColor)); out.bar = bar ? hex(ground(bar)) : null; out.rail = rail ? hex(ground(rail)) : null;
      const p = document.querySelector('.mode-page'); out.paper = p ? hex(parse(getComputedStyle(p).backgroundColor)) : null;
      const ed = document.querySelector('${ED}'); out.ink = ed ? hex(parse(getComputedStyle(ed).color)) : null;
      for (const [where, sel] of [['bar', '.chrome-top.sprint-nav'], ['rail', '.desk-frame-strip, .desk-rail'], ['drawer', '.wz-sliver-panel[data-open="true"], .wz-sliver[data-open="true"] .wz-sliver-panel'], ['consultant', '.wz-tutor-panel[data-open="true"]'], ['readout', '.machina2-run'], ['panel', '.machina2-bar']])
        document.querySelectorAll(sel).forEach((r) => textEls(r).forEach((el) => add(where, el, 4.5)));
      add('mark', document.querySelector('.brand-mark'), 4.5);
      out.help = [...document.querySelectorAll('.wz-help')].filter(shown).map((h) => hex(parse(getComputedStyle(h).color)));
      out.plan = (() => { const d = document.querySelector('.page-plan-door'); return d && shown(d) ? hex(parse(getComputedStyle(d).color)) : null; })();
      out.white = [...document.querySelectorAll('.chrome-top, .desk-frame-strip, .desk-rail, .wz-sliver-panel, .wz-tutor-panel, .wz-cascade-panel, .machina2-bar')].filter((el) => /^rgb\\(255, 255, 255\\)$/.test(getComputedStyle(el).backgroundColor)).length;
      return out; })()`;
    const reads = [];
    for (const c of ['cool', 'neutral']) {
      await cast(app, c);
      reads.push(await app.evalJs(READ(c + ' closed')));
      await clickSel(app, '.wz-sliver-grip'); await sleep(600);
      reads.push(await app.evalJs(READ(c + ' controls')));
      await clickSel(app, '.wz-sliver-grip'); await sleep(400);
      await clickSel(app, '.wz-tutor-grip'); await sleep(700);
      reads.push(await app.evalJs(READ(c + ' consultant')));
      await clickSel(app, '.wz-tutor-grip'); await sleep(400);
    }
    await cast(app, 'cool');
    const ROOM = { 'false-false': '#151719', 'true-false': '#E6E8EA', 'false-true': '#171614', 'true-true': '#E9E6E1' };
    const BAR = { false: '#1E262E', true: '#201E1B' };
    const GUIDE = { false: '#8FA3B8', true: '#3F6183' };
    const problems = [];
    for (const r of reads) {
      if (r.bad.length) problems.push({ stage: r.stage, low: r.bad.slice(0, 4) });
      if (r.room !== ROOM[`${r.light}-${r.neutral}`]) problems.push({ stage: r.stage, room: r.room });
      if (r.bar !== BAR[r.neutral] || r.rail !== BAR[r.neutral]) problems.push({ stage: r.stage, bars: [r.bar, r.rail] });
      if (r.paper !== (r.light ? '#FBFBFA' : '#1A1B1D') || !['#1C1C1C', '#E6E6E3'].includes(r.ink)) problems.push({ stage: r.stage, page: [r.paper, r.ink] });
      if (r.plan && r.plan !== '#8FA3B8') problems.push({ stage: r.stage, plan: r.plan });   // the Plan door sits on the dark bar in both rooms
      if (r.white) problems.push({ stage: r.stage, white: r.white });
    }
    const all = reads.flatMap((r) => r.pairs);
    if (problems.length) fail('M2-CONTRAST', { problems: problems.slice(0, 6), light: reads[0].light });
    say('m2-contrast', { light: reads[0].light, pairs: all.length, min: Math.min(...all.map((p) => p.ratio)), rooms: reads.map((r) => [r.stage, r.room, r.bar, r.paper, r.ink]),
      table: [...new Map(all.map((p) => [`${p.where}|${p.fg}|${p.bg}`, `${p.where}: ${p.fg} on ${p.bg} = ${p.ratio}`])).values()] });
  },

  // ── THE COMMAND LINE (§8.1): Ctrl+K (this runner is not a Mac) opens a box in the room BESIDE the page - never over the words; typing lists the
  // matching commands, the first chosen (brass outline), matches in the cool blue; Enter runs it (an existing act: the mode tab); Esc closes and
  // the focus is back in the editor; Ctrl+K never changes the page's text; "goal 250" runs the app's own goal setter; the keyboard legend lists
  // the registry's chords; the switch takes the line away.
  'm2-cmd': async (app) => {
    await page(app, 'm2-cmd', WORDS);
    const before = await app.evalJs(`document.querySelector('${ED}').innerText`);
    await app.evalJs(`document.querySelector('${ED}').focus()`);
    const key = (k, ctrl) => app.evalJs(`(() => { const el = document.activeElement || document.body; el.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, code: ${JSON.stringify(k.length === 1 ? 'Key' + k.toUpperCase() : k)}, ctrlKey: ${!!ctrl}, bubbles: true, cancelable: true })); })()`);
    await key('k', true); await sleep(300);
    const box = await app.evalJs(`(() => { const b = document.querySelector('.machina2-cmd'); if (!b) return null; const r = b.getBoundingClientRect(), e = document.querySelector('${ED}').getBoundingClientRect();
      const over = !(r.right <= e.left || r.left >= e.right || r.bottom <= e.top || r.top >= e.bottom);
      return { rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width)], overWords: over, font: getComputedStyle(b).fontFamily.split(',')[0], focused: document.activeElement?.classList.contains('machina2-cmd-input') }; })()`);
    await app.typeKeys('build'); await sleep(250);
    const list = await app.evalJs(`[...document.querySelectorAll('.machina2-cmd-item')].map((li) => ({ id: li.dataset.cmd, chosen: li.dataset.chosen, colour: getComputedStyle(li).color, border: getComputedStyle(li).borderTopColor }))`);
    await key('Enter'); await sleep(900);
    const ran = await app.evalJs(`(() => ({ closed: !document.querySelector('.machina2-cmd'), active: [...document.querySelectorAll('.desk-mode-tab.active')].map((b) => b.textContent.trim().toLowerCase()), focus: !!document.activeElement?.closest('${ED}') }))()`);
    await app.evalJs(`document.querySelector('${ED}')?.focus()`);
    await key('k', true); await sleep(250); await app.typeKeys('goal 250'); await sleep(200); await key('Enter'); await sleep(600);
    const goal = await app.evalJs(`(() => { try { const g = JSON.parse(localStorage.getItem('wrizo-writing-goal-lines') || 'null'); return g; } catch { return null; } })()`);
    await app.evalJs(`document.querySelector('${ED}')?.focus()`);
    await key('k', true); await sleep(250); await key('Escape'); await sleep(250);
    const esc = await app.evalJs(`({ closed: !document.querySelector('.machina2-cmd'), focus: !!document.activeElement?.closest('${ED}') })`);
    await clickSel(app, '.machina2-switch[data-switch="legend"]'); await sleep(100); await clickSel(app, '.machina2-switch[data-switch="legend"]'); await sleep(100);
    await key('k', true); await sleep(250);
    const legend = await app.evalJs(`[...document.querySelectorAll('.machina2-cmd-legend li')].map((li) => li.textContent.trim()).slice(0, 4)`);
    await key('Escape'); await sleep(150);
    await clickSel(app, '.machina2-switch[data-switch="command"]'); await sleep(150);
    await app.evalJs(`document.querySelector('${ED}')?.focus()`); await key('k', true); await sleep(250);
    const offOpen = await app.evalJs(`!!document.querySelector('.machina2-cmd')`);
    await clickSel(app, '.machina2-switch[data-switch="command"]'); await sleep(150);
    const after = await app.evalJs(`document.querySelector('${ED}').innerText`);
    const ok = {
      opens: !!box && box.focused && /Plex Mono/.test(box.font || ''), beside: !!box && !box.overWords,
      lists: list.length > 0 && list[0].id === 'mode-build' && list[0].chosen === 'true' && /255, 152, 0/.test(list[0].border) && /143, 163, 184|63, 97, 131/.test(list[0].colour),
      runs: ran.closed && ran.active.includes('build'), goal: !!goal && goal.n === 250 && goal.unit === 'words', esc: esc.closed && esc.focus,
      legend: legend.some((l) => /K/.test(l)), off: offOpen === false, text: before === after,
    };
    if (Object.values(ok).some((x) => !x)) fail('M2-CMD', { ok, box, list: list.slice(0, 3), ran, goal, esc, legend, offOpen });
    say('m2-cmd', { ok, box, first: list[0], legend });
    await page(app, 'm2-cmd', WORDS);
    await app.evalJs(`document.querySelector('${ED}').focus()`); await key('k', true); await sleep(300);
  },

  // ── THE READOUT BAR AND THE RUN (§7, §8.2): with no goal an EMPTY Run, first unit notched, and "no goal set"; every figure a fact
  // (words, ~pages at 250 a page, reading time at 230 wpm); on a Project's page "Part n of m"; with a goal its true remainder; the "parts" unit
  // (a Part counts once it has any words); the switches hide the strip and the readout; NEUTRAL closes a batch with no sparks.
  'm2-readout': async (app) => {
    await app.evalJs("window.wrizoSetWritingGoal && window.wrizoSetWritingGoal(null)");
    const project = await app.evalJs("(() => { const p = window.wrizoCreateProject('M2 Report'); return p && p.id; })()");
    await seedPage(app, { id: 'm2-part-1', text: 'Opening part with a few words.', projectId: project, orderIndex: 0, origin: null });
    await seedPage(app, { id: 'm2-part-2', text: WORDS, projectId: project, orderIndex: 1, origin: null });
    await seedPage(app, { id: 'm2-part-3', text: '', projectId: project, orderIndex: 2, origin: null });
    await sleep(300);
    await load(app, '#/page/m2-part-2');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'part page' }); await sleep(1400);
    const R = `(() => { const run = document.querySelector('.machina2-run'); if (!run) return null; const units = [...run.querySelectorAll('.machina-run-strip > i')];
      return { line: run.querySelector('.machina2-readout')?.textContent || null, on: units.filter((u) => u.classList.contains('on')).length, here: units.findIndex((u) => u.classList.contains('here')),
        units: units.length, unit: run.dataset.unit, goal: run.dataset.goal, burst: !!run.querySelector('.machina-run-burst'), count: run.querySelector('.machina-run-count')?.textContent || null }; })()`;
    const noGoal = await app.evalJs(R);
    await clickText(app, '.machina2-bar-opt', 'Parts'); await sleep(400);
    const parts = await app.evalJs(R);
    await clickText(app, '.machina2-bar-opt', 'Words'); await sleep(200);
    await app.evalJs("window.wrizoSetWritingGoal({ n: 300, unit: 'words' })"); await sleep(600);
    const goal = await app.evalJs(R);
    await clickSel(app, '.machina2-switch[data-switch="readout"]'); await sleep(200);
    const noReadout = await app.evalJs(R);
    await clickSel(app, '.machina2-switch[data-switch="readout"]'); await clickSel(app, '.machina2-switch[data-switch="run"]'); await sleep(200);
    const noStrip = await app.evalJs(R);
    await clickSel(app, '.machina2-switch[data-switch="run"]'); await sleep(100);
    // NEUTRAL, a batch closing: no sparks (ruling 6)
    await cast(app, 'neutral');
    await app.evalJs("window.wrizoSetWritingGoal({ n: 40, unit: 'words' })");
    await app.evalJs(`document.querySelector('${ED}').focus()`); await app.typeKeys(' one two three four five six'); await sleep(250);
    const close = await app.evalJs(R);
    await cast(app, 'cool');
    await app.evalJs("window.wrizoSetWritingGoal(null)");
    const LINE = /^[\d,]+ words? · ~[\d.]+ pages? · (<1|~\d+) min read( · Part \d+ of \d+)? · (no goal set|[\d,]+ (words?|lines?) to goal|goal met)$/;
    const ok = {
      empty: !!noGoal && noGoal.goal === 'none' && noGoal.on === 0 && noGoal.here === 0 && noGoal.units === 20 && /no goal set$/.test(noGoal.line || ''),
      facts: !!noGoal && LINE.test(noGoal.line || '') && / · Part 2 of 3 · /.test(noGoal.line || ''),
      parts: !!parts && parts.unit === 'parts' && / · 2 \/ 3 parts$/.test(parts.line || '') && parts.on === Math.floor(2 / 3 * 20),
      remainder: !!goal && LINE.test(goal.line || '') && /[\d,]+ words to goal$/.test(goal.line || ''),
      switches: !!noReadout && noReadout.line === null && !!noReadout.count && !!noStrip && noStrip.units === 0 && !!noStrip.line,
      sparks: !!close && !close.burst,
    };
    if (Object.values(ok).some((x) => !x)) fail('M2-READOUT', { ok, noGoal, parts, goal, noReadout, noStrip, close });
    say('m2-readout', { ok, noGoal: noGoal.line, parts: parts.line, goal: goal.line });
    await clickText(app, '.machina2-bar-opt', 'Parts'); await sleep(400);
  },

  // ── THE CONSULTANT'S NONFICTION ASKS (§9; Nick approved the wording, 3:22 pm): on a Build page the three asks follow the Draft roster in the
  // cool-blue outline; a press STAGES its words in the composer (asks only, it never writes); the switch takes them away.
  'm2-asks': async (app) => {
    await page(app, 'm2-asks', WORDS); await build(app);
    await clickSel(app, '.wz-tutor-grip'); await sleep(700);
    const A = `[...document.querySelectorAll('.machina2-ask')].map((b) => ({ ask: b.dataset.ask, text: b.textContent.trim(), border: getComputedStyle(b).borderTopColor }))`;
    const asks = await app.evalJs(A);
    await clickSel(app, '.machina2-ask[data-ask="nonfiction-claim"]'); await sleep(300);
    const staged = await app.evalJs("document.querySelector('.wz-tutor-convo-input')?.value || null");
    const pageText = await app.evalJs(`document.querySelector('${ED}').innerText`);
    await clickSel(app, '.machina2-switch[data-switch="asks"]'); await sleep(200);
    const off = await app.evalJs(A);
    await clickSel(app, '.machina2-switch[data-switch="asks"]'); await sleep(200);
    const ok = { three: asks.length === 3 && asks.every((a) => /127, 160, 188/.test(a.border)), staged: staged === 'What is the claim here, and where is the evidence for it?', untouched: pageText.includes('quarterly figures'), off: off.length === 0 };
    if (Object.values(ok).some((x) => !x)) fail('M2-ASKS', { ok, asks, staged, off: off.length });
    say('m2-asks', { ok, asks: asks.map((a) => a.text) });
  },

  // ── OUTLINE → PARTS (§8.3; Fable ruling 4: the affordance only): the Controls drawer on a Build page lists the File's points with "→ Part" in
  // the cool blue; a press shows the brass tick and says no Part is made; nothing is created (the entry count and the page's text unchanged).
  'm2-outline': async (app) => {
    await page(app, 'm2-outline', WORDS); await build(app);
    await clickSel(app, '.wz-sliver-grip'); await sleep(700);
    const O = `(() => { const s = document.querySelector('.machina2-outline'); if (!s) return null; return { points: [...s.querySelectorAll('.machina2-outline-text')].map((x) => x.textContent), parts: [...s.querySelectorAll('.machina2-outline-part')].map((b) => getComputedStyle(b).color),
      ticks: [...s.querySelectorAll('.machina2-outline-tick')].map((t) => getComputedStyle(t).color), note: s.querySelector('.machina2-outline-note')?.textContent || null }; })()`;
    const before = await app.evalJs(O);
    const n0 = await app.evalJs("(window.wrizoFlushNow && window.wrizoFlushNow(), JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').length)");
    await app.evalJs("document.querySelector('.machina2-outline-part')?.click()"); await sleep(400);
    const after = await app.evalJs(O);
    const n1 = await app.evalJs("(window.wrizoFlushNow && window.wrizoFlushNow(), JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').length)");
    const ok = { listed: !!before && before.points.length === 3 && before.parts.length === 3 && before.parts.every((c) => /143, 163, 184|63, 97, 131/.test(c)),
      tick: !!after && after.ticks.length === 1 && /255, 152, 0/.test(after.ticks[0]) && /no Part is made/.test(after.note || ''), nothing: n0 > 0 && n0 === n1 };   // (n0 > 0: a wrong key would read 0 = 0 and pass blind)
    if (Object.values(ok).some((x) => !x)) fail('M2-OUTLINE', { ok, before, after, n0, n1 });
    say('m2-outline', { ok, points: before.points });
  },

  // ── STILLNESS (§6: no motion but the caret blink and the Run's fill) and THE MARK in both rooms (§13: WRIZ in Plex Mono, the square a hairline).
  'm2-still': async (app) => {
    await page(app, 'm2-still', WORDS);
    await sleep(1500);
    const S = `(() => { const anims = document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.animationName || a.transitionProperty || a.constructor.name) + '@' + ((a.effect && a.effect.target && a.effect.target.className) || '').toString().slice(0, 30));
      const m = document.querySelector('.brand-mark'), cs = m ? getComputedStyle(m) : null, after = m ? getComputedStyle(m, '::after') : null;
      return { anims, mark: m ? { font: cs.fontFamily.split(',')[0], before: getComputedStyle(m, '::before').content, square: after.borderTopWidth + ' ' + after.borderTopStyle } : null }; })()`;
    const cool = await app.evalJs(S);
    await cast(app, 'neutral'); await sleep(1200);
    const neutral = await app.evalJs(S);
    await cast(app, 'cool');
    const ok = { still: cool.anims.length === 0 && neutral.anims.length === 0, mark: !!cool.mark && /Plex Mono/.test(cool.mark.font) && /WRIZ/.test(cool.mark.before) && /solid/.test(cool.mark.square) };
    if (Object.values(ok).some((x) => !x)) fail('M2-STILL', { ok, cool, neutral });
    say('m2-still', { ok, cool, neutral: neutral.anims });
  },
};
