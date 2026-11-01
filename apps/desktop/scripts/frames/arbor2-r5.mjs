// ARBOR v2 MOCKUP, ROUND r5 (spec draft 5, md5 069cad00; Fable's r5 brief, Oct 31) - the self-checks, as named screens for INK's frames
// job (.github/workflows/frames.yml, -f screens_file=apps/desktop/scripts/frames/arbor2-r5.mjs). Every screen THROWS with its numbers
// when its check fails (the job keeps 300 characters of an error, so the verdicts come first), and prints them when it passes
// ("ARBOR-R5 <screen> {...}" on the job's log). The job sets the page tone: dark = the night room, light = the day room.
// Written red-first: run against the r5 base (5d2228c6) before the build.
// Seeds go through the app's seams (window.wrizo*), never raw collection storage. No imports: the job loads this file on its own.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// r9 DRIVER PIN (not an assertion): unset, the room now follows the CLOCK (Fable, Nov 1: Follow the clock / Always day / Always night) and
// the runner's clock is UTC. This file's checks were written for the room the page tone gave (dark = night, light = day), so after every
// flagged reload it chooses that room explicitly (data-room: Always night / Always day). The clock itself is proven in frames/arbor2-r9.mjs.
const pinRoom = (app) => app.evalJs("(() => { const r = document.documentElement; if (/[?&]arbor2=1/.test(location.search)) r.setAttribute('data-room', r.getAttribute('data-page') === 'dark' ? 'dark' : 'light'); })()");
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R5 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R5-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };

// the flag lives in the URL only (?arbor2=1 before the hash); `on` false loads the same route with the flag OFF
const load = async (app, hash, on = true) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?arbor2=1' : '/')} + ${JSON.stringify(hash)})`);
  await app.reload(); await pinRoom(app);
  await waitSoft(app, `document.documentElement.getAttribute('data-arbor2') ${on ? "=== 'true'" : '== null'}`, { label: 'flag ' + (on ? 'on' : 'off'), timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const seed = (app, id, text) => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
const page = async (app, id, text, on = true) => {
  await seed(app, id, text);
  await sleep(300);
  await load(app, '#/page/' + id, on);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1400);
};
// the room comes from the job's tone; reads after a CSS transition wait it out (index.css transitions run up to .8 s)
const room = (app) => app.evalJs("document.documentElement.getAttribute('data-arbor2-room')");

// ---- shared measuring code, injected as source ------------------------------------------------------------------------------------
// WCAG relative luminance and contrast; colours parsed from computed rgb()/rgba(); a translucent colour is laid over what is under it.
const COLOUR = `
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  const firstStop = (img) => { const m = String(img).match(/rgba?\\([^)]+\\)/); return m ? parse(m[0]) : null; };
  // the ground an element's text sits on: its own and its ancestors' backgrounds, translucent ones laid over the next, down to <html>
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
  const pair = (el) => { const g = ground(el); const fg = over(parse(getComputedStyle(el).color), g); return { fg: hex(fg), bg: hex(g), ratio: Math.round(ratio(fg, g) * 100) / 100 }; };
  const textEls = (root) => [...root.querySelectorAll('*')].concat([root]).filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && shown(el));
`;

export default {
  // ── 1. THE PAGE NEVER MOVES (§2c, the flush top bar; "page-rect identical flag on/off with the flush bar at 1366 + 1920, both rooms").
  // The same page is loaded with the flag OFF and then ON, in Free Write (Typewriter zoom) and in Draft; the page's rect must match to
  // half a pixel; with the flag on the top bar must sit flush at the window's top (its top <= 0.5 px) with the "..." inside it.
  'r5-rect': async (app) => {
    const M = `(() => {
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left * 10) / 10, t: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };
      const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0);
      return { page: r(document.querySelector('.mode-page')), col: r(document.querySelector('.mode-pagecol')), bar: r(bar), dots: r(document.querySelector('.gh-corner-glyph')),
        zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null, room: document.documentElement.getAttribute('data-arbor2-room'), w: innerWidth };
    })()`;
    const same = (a, b) => !!a && !!b && ['l', 't', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);
    const inside = (d, b) => !!d && !!b && d.l >= b.l - 0.5 && d.t >= b.t - 0.5 && d.l + d.w <= b.l + b.w + 0.5 && d.t + d.h <= b.t + b.h + 0.5;
    const out = {};
    for (const mode of ['freewrite', 'draft']) {
      const read = async (on) => {
        await page(app, 'arbor-r5-rect', WORDS, on);
        if (mode === 'draft') { await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(1400); }
        return app.evalJs(M);
      };
      const off = await read(false), on = await read(true);
      out[mode] = { off, on, pageSame: same(off.page, on.page), colSame: same(off.col, on.col), flush: !!on.bar && on.bar.t <= 0.5, dotsIn: inside(on.dots, on.bar), barH: !!off.bar && !!on.bar && Math.abs(off.bar.h - on.bar.h) <= 0.5 };
    }
    const bad = Object.entries(out).filter(([, v]) => !(v.pageSame && v.colSame && v.flush && v.dotsIn && v.barH));
    const brief = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { pageSame: v.pageSame, colSame: v.colSame, flush: v.flush, dotsIn: v.dotsIn, barH: v.barH, offPage: v.off.page, onPage: v.on.page, offBar: v.off.bar, onBar: v.on.bar, dots: v.on.dots, zoom: v.on.zoom, room: v.on.room, w: v.on.w }]));
    if (bad.length) fail('R5-RECT', brief);
    say('r5-rect', brief);
  },

  // ── 2. CONTRAST FOR EVERY NEW PAIR, AND THE NEW PALETTE (§2b, §9c, §3b). Lit (the room's dim set to 1 for the read, so this is each label's
  // own pair; the dimmed state is arbor-dim's in arbor2.mjs). Text >= 4.5:1; the opener tabs' arrows (a graphic) >= 3:1.
  //   the bars: the top bar and the rail in ESPRESSO in both rooms (#1B120C), cream lettering on them; the "..." in the bar.
  //   the openers: olive #6B7A3A closed, brass #FF9800 open (today's rects: the rect half is r5-rect's and arbor2-23's).
  //   the cloths: Tools Format olive / Presets cold blue #7FA0BC / Ink madder #A8392F; Tutor Tutor olive / Grafts cold blue / Board madder;
  //     no walnut cloth; the current cloth carries the brass underline.
  //   the type: rail labels and the top bar's crumb in Alegreya Sans (bundled: loaded from this origin, never a font CDN), drawer headings
  //     in EB Garamond small caps.
  //   the room: day plaster/honey/olive tokens; no honey-wood sill at the foot of the room.
  'r5-contrast': async (app) => {
    await page(app, 'arbor-r5-contrast', WORDS);
    // PARKED 2026-10-31 (SUPERSEDED, frames run 41241222600: the night read saw every resting label in the dim lettering's --text-hi, so it never measured the
    // bar's own pairs - its "/" at 1.64:1 and olive "?" at 3.93:1 passed blind by night). Original, verbatim:
    // await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'arbor2-r5-lit'; s.textContent = '*{ --arbor2-dim:1 !important; transition:none !important; }'; document.head.appendChild(s); })()");
    // SUCCESSOR: lit, AND each label in its own colours - data-arbor2-lit on <html> stands the dim lettering down for the read.
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'arbor2-r5-lit'; s.textContent = '*{ --arbor2-dim:1 !important; transition:none !important; }'; document.head.appendChild(s); document.documentElement.setAttribute('data-arbor2-lit', ''); })()");
    const READ = (stage) => `(() => { ${COLOUR}
      const out = { stage: ${JSON.stringify(stage)}, room: document.documentElement.getAttribute('data-arbor2-room'), pairs: [], bad: [] };
      const add = (where, el, floor) => { if (!el || !shown(el)) return; const p = pair(el); const row = { where, text: (el.textContent || '').trim().slice(0, 18), ...p, floor }; out.pairs.push(row); if (p.ratio < floor) out.bad.push(row); };
      const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0);
      const rail = document.querySelector('.desk-frame-strip');
      out.barBg = bar ? hex(ground(bar)) : null; out.railBg = rail ? hex(ground(rail.querySelector('.wz-strip-item') || rail)) : null;
      if (bar) textEls(bar).forEach((el) => add('bar', el, 4.5));
      if (rail) textEls(rail).forEach((el) => add('rail', el, 4.5));
      add('dots', document.querySelector('.gh-corner-glyph'), 3);
      const grips = [...document.querySelectorAll('.wz-sliver-grip, .wz-tutor-grip')].filter(shown);
      out.grips = grips.map((g) => ({ cls: g.className.split(' ')[0], open: g.closest('.wz-sliver')?.getAttribute('data-open') === 'true' || g.getAttribute('data-open') === 'true', bg: hex(parse(getComputedStyle(g).backgroundColor)) }));
      grips.forEach((g) => add('grip', g.querySelector('span') || g, 3));
      out.cloths = [...document.querySelectorAll('.wz-drawer-tab')].filter(shown).map((t) => ({ id: t.id, bg: hex(parse(getComputedStyle(t).backgroundColor)), on: t.getAttribute('data-on'), underline: /255, 152, 0/.test(getComputedStyle(t).boxShadow) }));
      document.querySelectorAll('.wz-drawer-tab').forEach((t) => add('cloth ' + t.id, t, 4.5));
      out.heads = [...document.querySelectorAll('.wz-sliver-h, .wz-cascade-panel-title')].filter(shown).map((h) => { const cs = getComputedStyle(h); add('head', h, 4.5); return { text: h.textContent.trim().slice(0, 14), font: cs.fontFamily.split(',')[0], caps: cs.fontVariantCaps, size: cs.fontSize }; });
      const lbl = rail && rail.querySelector('.wz-strip-label'), crumb = document.querySelector('.sprint-crumb');
      out.type = { rail: lbl ? getComputedStyle(lbl).fontFamily.split(',')[0] + ' ' + getComputedStyle(lbl).fontSize : null, crumb: crumb ? getComputedStyle(crumb).fontFamily.split(',')[0] + ' ' + getComputedStyle(crumb).fontSize : null,
        loaded: [...document.fonts].some((f) => /Alegreya Sans/.test(f.family) && f.status === 'loaded'),
        foreign: performance.getEntriesByType('resource').filter((e) => /alegreya/i.test(e.name) && new URL(e.name).origin !== location.origin).map((e) => e.name) };
      const cs = getComputedStyle(document.documentElement);
      out.tokens = { g: cs.getPropertyValue('--ink-950').trim(), s: cs.getPropertyValue('--ink-900').trim(), r: cs.getPropertyValue('--ink-800').trim(), letter: cs.getPropertyValue('--arbor-letter').trim(), low: cs.getPropertyValue('--text-low').trim(), guide: cs.getPropertyValue('--arbor-guide').trim() };
      const foot = [innerWidth * 0.5, innerWidth - 60, 120].flatMap((x) => document.elementsFromPoint(x, innerHeight - 4)).filter((el) => /201, 164, 107/.test(getComputedStyle(el).backgroundColor) && el.getBoundingClientRect().width > innerWidth * 0.5);
      out.sill = foot.map((el) => el.className || el.tagName);
      return out;
    })()`;
    const reads = [await app.evalJs(READ('closed'))];
    await clickSel(app, '.wz-sliver-grip');
    await waitSoft(app, "!!document.querySelector(\".wz-sliver[data-open='true']\")", { label: 'tools open', timeout: 3000 }); await sleep(500);
    reads.push(await app.evalJs(READ('tools freewrite')));
    await clickSel(app, '.wz-sliver-grip'); await sleep(400);
    await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(1000);
    await clickSel(app, '.wz-sliver-grip');
    await waitSoft(app, "!!document.querySelector(\".wz-sliver[data-open='true']\")", { label: 'tools open', timeout: 3000 }); await sleep(500);
    reads.push(await app.evalJs(READ('tools draft')));
    await clickSel(app, '#wz-sliver-tab-presets'); await sleep(300);
    reads.push(await app.evalJs(READ('tools draft presets')));
    await clickSel(app, '.wz-tutor-grip'); await sleep(700);
    reads.push(await app.evalJs(READ('tutor')));
    await clickSel(app, '#wz-tutor-tab-links'); await sleep(300);
    reads.push(await app.evalJs(READ('tutor grafts')));
    const ESP = '#1B120C', OLIVE = '#6B7A3A', BRASS = '#FF9800', BLUE = '#7FA0BC', MADDER = '#A8392F';
    const CLOTH = { 'wz-sliver-tab-format': 'olive', 'wz-sliver-tab-presets': BLUE, 'wz-sliver-tab-ink': MADDER, 'wz-tutor-tab-tutor': 'olive', 'wz-tutor-tab-links': BLUE, 'wz-tutor-tab-board': MADDER };
    const problems = [];
    for (const r of reads) {
      if (r.bad.length) problems.push({ stage: r.stage, low: r.bad.slice(0, 4) });
      if (r.barBg !== ESP || r.railBg !== ESP) problems.push({ stage: r.stage, bars: [r.barBg, r.railBg] });
      for (const g of r.grips) if (g.bg !== (g.open ? BRASS : OLIVE)) problems.push({ stage: r.stage, grip: g });
      for (const c of r.cloths) {
        const want = CLOTH[c.id];
        // the olive cloth may be a measured darker step of olive (cream on #6B7A3A is 3.66:1); it must still read olive: green above red above blue
        const isOlive = (h) => { const n = parseInt(h.slice(1), 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; return G > R && R > B && G - B > 30; };
        if (!want || (want === 'olive' ? !isOlive(c.bg) : c.bg !== want) || (c.on === 'true') !== c.underline) problems.push({ stage: r.stage, cloth: c });
      }
      if (r.heads.some((h) => !/EB Garamond/.test(h.font) || h.caps !== 'small-caps')) problems.push({ stage: r.stage, heads: r.heads.slice(0, 3) });
      if (!/Alegreya Sans/.test(r.type.rail || '') || !/Alegreya Sans/.test(r.type.crumb || '') || !r.type.loaded || r.type.foreign.length) problems.push({ stage: r.stage, type: r.type });
      if (r.sill.length) problems.push({ stage: r.stage, sill: r.sill });
    }
    const t = reads[0].tokens, day = reads[0].room === 'day';
    // day ground: the plaster #F1EAD8, warming with the afternoon but never to a tan (the retired tans run R <= 0xE4; plaster keeps R >= 0xEC, B >= 0xC4)
    const rgbOf = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const plaster = (h) => { const [R, , B] = rgbOf(h); return /^#[0-9A-F]{6}$/i.test(h) && R >= 0xEC && B >= 0xC4; };
    // PARKED 2026-10-31 (SUPERSEDED: arbor2-1 C1 on the r5 build, run 41240761804 - honey wood under text fails the floors; raised is #F6F1E4).
    // Original, verbatim:
    // const tokOk = day ? (plaster(t.g) && t.s.toUpperCase() === '#E8DFC8' && t.r.toUpperCase() === '#C9A46B')
    // SUCCESSOR: day raised is the lifted cream #F6F1E4 and the quiet text #56623A.
    const tokOk = day ? (plaster(t.g) && t.s.toUpperCase() === '#E8DFC8' && t.r.toUpperCase() === '#F6F1E4' && t.low.toUpperCase() === '#56623A')
      : (t.g.toUpperCase() === '#120A06' && t.s.toUpperCase() === '#1B120C' && t.r.toUpperCase() === '#261A12');
    if (!tokOk) problems.push({ tokens: t });
    const all = reads.flatMap((r) => r.pairs);
    const summary = { room: reads[0].room, pairs: all.length, min: all.length ? Math.min(...all.map((p) => p.ratio)) : null, tokens: t, type: reads[0].type, cloths: reads.flatMap((r) => r.cloths).filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i) };
    if (problems.length || reads.some((r) => !r.cloths.length && r.stage !== 'closed')) fail('R5-CONTRAST', { problems: problems.slice(0, 6), room: reads[0].room });
    // the table for the report: every distinct pair (where, fg on bg, ratio)
    say('r5-contrast', { ...summary, table: [...new Map(all.map((p) => [`${p.where}|${p.fg}|${p.bg}`, `${p.where}: ${p.fg} on ${p.bg} = ${p.ratio}`])).values()] });
  },

  // ── 3. THE RHIZOME'S LIFE (§8b; Nick 2:24 pm: night fully hidden between flashes, no ghost) + THE FLASH BUDGET + REDUCED MOTION + CLEAR.
  //   grow -> the goal's one brass pulse -> by DAY the finished network fades to ~40% and STAYS; the next growth starts at the tip of the last
  //   growth, at full strength. By NIGHT nothing is drawn between flashes (no ghost), and the flash shows the whole network.
  //   flash budget: the field changes state at most 3 times in any second (<= 3 flashes/s), one brass event per goal.
  //   reduced motion: a still frame - no pop, no fade, a cut to the rest picture.
  //   in-session only: the history survives leaving the page and coming back; Clear Rhizome (the Mood menu) clears it and Undo brings it back;
  //   the writing and the word count are untouched, and nothing reaches storage.
  'r5-rhizome': async (app) => {
    await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
    await app.evalJs("window.wrizoSetWritingGoal({ n: 8, unit: 'words' })");
    const words = (n, p) => Array.from({ length: n }, (_, i) => p + i).join(' ');
    await page(app, 'arbor-r5-rz', words(7, 'word'));
    await waitSoft(app, "!!document.querySelector('.wz-rhizome-field')", { label: 'rhizome field', timeout: 4000 });
    const storeBefore = await app.evalJs("Object.keys(localStorage).join('|')");
    const S = `(() => { const f = document.querySelector('.wz-rhizome-field'); if (!f) return null; const cs = getComputedStyle(f);
      const segs = [...f.querySelectorAll('.wz-rhizome-seg')].filter((p) => !p.closest('.wz-rhizome-past') && ((p.getAttribute('d') || '').length > 0 || p.tagName === 'line'));
      const past = f.querySelector('.wz-rhizome-past'), pastD = past ? [...past.querySelectorAll('path')].reduce((n, p) => n + (p.getAttribute('d') || '').length, 0) : 0;
      return { flash: f.dataset.flash, lap: f.dataset.lap, vis: cs.visibility, anim: cs.animationName, segs: segs.length, pastD, pastOp: past ? Number(getComputedStyle(past).opacity) : null,
        pastVis: past ? getComputedStyle(past).visibility : null, tip: f.dataset.tip || null, start: f.dataset.start || null, segTr: segs[0] ? getComputedStyle(segs[0]).transitionDuration : null,
        text: document.querySelector('${ED}')?.innerText.trim().split(/\\s+/).length }; })()`;
    // a log of the field's state changes, with their times (the flash budget)
    await app.evalJs(`(() => { window.__r5flash = []; const f = document.querySelector('.wz-rhizome-field'); new MutationObserver(() => window.__r5flash.push([Math.round(performance.now()), f.dataset.flash])).observe(f, { attributes: true, attributeFilter: ['data-flash'] }); })()`);
    const rest0 = await app.evalJs(S);
    const goal = async (tail) => { await app.evalJs(`document.querySelector('${ED}').focus()`); await app.typeKeys(tail); };
    await goal(' tail');
    await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'flash', timeout: 4000 });
    const during = await app.evalJs(S);
    await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false'", { label: 'flash over', timeout: 6000 });
    await sleep(600);
    const after = await app.evalJs(S);
    const log = await app.evalJs('window.__r5flash');
    const perSecond = Math.max(0, ...log.map(([t]) => log.filter(([u]) => u >= t && u < t + 1000).length));
    // in-session persistence: away to the Desk and back - the history is still there
    // PARKED 2026-10-31 (SUPERSEDED, frames run 41241222600: the check left the page with a RELOAD, which ends the session it was testing - in-session memory is
    // gone after a reload by design). Original, verbatim:
    // await load(app, '#/');
    // await sleep(800);
    // await load(app, '#/page/arbor-r5-rz');
    // await waitSoft(app, "!!document.querySelector('.wz-rhizome-field')", { label: 'rhizome field again', timeout: 4000 }); await sleep(900);
    // SUCCESSOR: away to the Desk and back by route only (the same session, no reload).
    await app.evalJs("location.hash = '#/'"); await sleep(900);
    await app.evalJs("location.hash = '#/page/arbor-r5-rz'");
    await waitSoft(app, "!!document.querySelector('.wz-rhizome-field')", { label: 'rhizome field again', timeout: 4000 }); await sleep(900);
    const back = await app.evalJs(S);
    // Clear Rhizome + Undo (the Mood menu)
    await clickText(app, '.arbor2-bar-head', 'Mood ▸'); await sleep(200);
    const cleared = await clickSel(app, '.arbor2-rhizome-clear'); await sleep(500);
    const afterClear = await app.evalJs(S);
    const undone = await clickSel(app, '.arbor2-rhizome-undo'); await sleep(500);
    const afterUndo = await app.evalJs(S);
    // reduced motion: the next goal is a still frame
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await sleep(200);
    // PARKED 2026-10-31 (SUPERSEDED, frames run 41242683166: BLIND - the revisit mounts a NEW field, so a log kept by the first field's observer
    // stayed empty and 'never fading' passed on nothing). Original, verbatim:
    // await app.evalJs(`window.__r5flash = []`);
    // SUCCESSOR: a fresh observer on the field on screen now.
    await app.evalJs(`(() => { window.__r5flash = []; const f = document.querySelector('.wz-rhizome-field'); new MutationObserver(() => window.__r5flash.push([Math.round(performance.now()), f.dataset.flash])).observe(f, { attributes: true, attributeFilter: ['data-flash'] }); })()`);
    await goal(' ' + words(8, 'more'));
    await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'still flash', timeout: 4000 });
    const stillDuring = await app.evalJs(S);
    await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false'", { label: 'still over', timeout: 4000 }); await sleep(300);
    const stillAfter = await app.evalJs(S);
    const stillLog = await app.evalJs('window.__r5flash');
    await app.emulateMedia([]);
    const storeAfter = await app.evalJs("Object.keys(localStorage).join('|')");
    const night = rest0 && (await room(app)) === 'night';
    const ok = {
      field: !!rest0 && !!after,
      growing: !!rest0 && rest0.segs > 0,
      pulse: !!during && during.flash === 'true',
      // day: the finished lap stays at ~40%; night: nothing drawn between flashes (the field hidden, so no ghost)
      rest: !!after && (night ? after.vis === 'hidden' : after.pastD > 0 && after.pastOp >= 0.3 && after.pastOp <= 0.5),
      ghost: !night || (!!rest0 && rest0.vis === 'hidden' && after.vis === 'hidden'),
      tip: !!after && !!after.tip && after.tip === after.start,
      budget: perSecond <= 3 && log.filter(([, s]) => s === 'true').length === 1,
      kept: !!back && (night ? back.vis === 'hidden' : back.pastD > 0),
      clear: cleared && !!afterClear && afterClear.pastD === 0 && afterClear.text === after.text,
      undo: undone && !!afterUndo && afterUndo.pastD === back.pastD,
      // (successor of the blind form: the log must SEE the cut - 'true' then 'false' - before 'never fading' means anything)
      still: !!stillDuring && stillDuring.anim === 'none' && stillLog.map(([, s]) => s).join() === 'true,false' && !!stillAfter && stillAfter.flash === 'false' && (night || stillAfter.segTr === '0s'),
      stored: storeBefore === storeAfter || !/rhizome|arbor/i.test(storeAfter.replace(storeBefore, '')),
    };
    const data = { night, ok, rest0, during, after, back, afterClear, afterUndo, stillDuring, stillAfter, log, stillLog, perSecond };
    if (Object.values(ok).some((v) => !v)) fail('R5-RHIZOME', { bad: Object.keys(ok).filter((k) => !ok[k]), night, after, rest0, during, log });
    say('r5-rhizome', { night, ok, perSecond, pastOp: after.pastOp, log, stillLog });
    // the picture: by day the faded history with new growth on top, by night the dark (a frame of the still flash is the one above)
    await goal(' ' + words(4, 'grow')); await sleep(800);
  },

  // ── 4. THE PERGOLA v2 (§7b, day): 3-4 thick beams (36-60 px), one feature from the bottom-left toward the right, LOW (the upper half mostly
  // clear), 1-2 crossbeams at right angles (14-20 px), small leaves (10-18 px) along the beams, soft (6-10 px blur), moss at 18-26%, a drift
  // of >= 16 s, never over the prose column (the page's outer 24 px only); still under reduced motion. Night: no pergola.
  'r5-pergola': async (app) => {
    await page(app, 'arbor-r5-pergola', WORDS);
    const P = `(() => { const sun = document.querySelector('.arbor2-sun'); if (!sun) return { sun: false };
      const cs = getComputedStyle(sun), H = innerHeight, W = innerWidth;
      const beams = [...sun.querySelectorAll('.arbor2-sun-beam')].map((b) => ({ x1: +b.dataset.x1, y1: +b.dataset.y1, x2: +b.dataset.x2, y2: +b.dataset.y2, w: +b.dataset.w, blur: getComputedStyle(b).filter }));
      const cross = [...sun.querySelectorAll('.arbor2-sun-cross')].map((b) => ({ x1: +b.dataset.x1, y1: +b.dataset.y1, x2: +b.dataset.x2, y2: +b.dataset.y2, w: +b.dataset.w }));
      const leaves = [...sun.querySelectorAll('.arbor2-sun-leaf')].map((l) => parseFloat(getComputedStyle(l).width));
      const pts = beams.flatMap((b) => Array.from({ length: 21 }, (_, i) => b.y1 + (b.y2 - b.y1) * i / 20));
      const ang = (b) => Math.atan2(b.y2 - b.y1, b.x2 - b.x1) * 180 / Math.PI;
      const drift = sun.querySelector('.arbor2-sun-drift');
      return { sun: true, display: cs.display, opacity: Number(cs.opacity), still: sun.getAttribute('data-still'), beams, cross, leaves, H, W,
        low: pts.length ? pts.filter((y) => y > H / 2).length / pts.length : 0,
        fromBL: beams.length ? beams.every((b) => b.x1 < W * 0.35 && b.y1 > H * 0.7) : false,
        square: cross.every((c) => beams.some((b) => Math.abs(Math.abs(ang(c) - ang(b)) - 90) <= 12)),
        driftS: drift ? parseFloat(getComputedStyle(drift).animationDuration) : 0, driftAnim: drift ? getComputedStyle(drift).animationName : null,
        mask: String(sun.style.maskImage || '').slice(0, 60) }; })()`;
    const r = await app.evalJs(P);
    const day = (await room(app)) === 'day';
    if (!day) { if (r.sun && r.display !== 'none') fail('R5-PERGOLA', { night: true, display: r.display }); say('r5-pergola', { night: true, display: r.display }); return; }
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page(app, 'arbor-r5-pergola', WORDS);
    const still = await app.evalJs(P);
    await app.emulateMedia([]);
    await page(app, 'arbor-r5-pergola', WORDS);
    const ok = {
      beams: r.beams.length >= 3 && r.beams.length <= 4 && r.beams.every((b) => b.w >= 36 && b.w <= 60),
      cross: r.cross.length >= 1 && r.cross.length <= 2 && r.cross.every((c) => c.w >= 14 && c.w <= 20) && r.square,
      low: r.low >= 0.75 && r.fromBL,
      leaves: r.leaves.length > 0 && r.leaves.every((s) => s >= 10 && s <= 18),
      // PARKED 2026-10-31 (SUPERSEDED, frames run 41241222600: BLIND - the matcher was escaped for a template string but sits in plain code, so it never matched
      // "blur(8px)"). Original, verbatim:
      // soft: r.beams.every((b) => { const m = /blur\\(([\\d.]+)px\\)/.exec(b.blur); return !!m && +m[1] >= 6 && +m[1] <= 10; }),
      // SUCCESSOR: the same rule, read with a matcher that can match.
      soft: r.beams.length > 0 && r.beams.every((b) => { const m = /blur\(([\d.]+)px\)/.exec(b.blur); return !!m && +m[1] >= 6 && +m[1] <= 10; }),
      tint: r.opacity >= 0.18 - 1e-6 && r.opacity <= 0.26 + 1e-6,
      drift: r.driftS >= 16,
      hole: /gradient/.test(r.mask),
      still: still.still === 'true' && still.driftAnim === 'none',
    };
    if (Object.values(ok).some((v) => !v)) fail('R5-PERGOLA', { bad: Object.keys(ok).filter((k) => !ok[k]), beams: r.beams, cross: r.cross, leaves: r.leaves.slice(0, 6), low: r.low, fromBL: r.fromBL, opacity: r.opacity, driftS: r.driftS, still: [still.still, still.driftAnim] });
    say('r5-pergola', { ok, beams: r.beams.map((b) => b.w), cross: r.cross.map((c) => c.w), leaves: [Math.min(...r.leaves), Math.max(...r.leaves), r.leaves.length], low: r.low, opacity: r.opacity, driftS: r.driftS });
  },

  // ── 5. THE LOGO (spec §12b; "Nick never saw it in r4: find out why and prove it renders in both rooms"). Why: the only mark INSIDE the app
  // is the corner .brand-mark (App.tsx: a div painted through the logo's alpha as a CSS mask, 88 px, bottom-right, at 10% opacity), and
  // r4 (a) left it brass at 10% - the sage rule only reached the front door's <img> marks, which a signed-in writer passes in a second - and
  // (b) the mockup's own bar sat on top of it, bottom-right. Proof: on a page, in both rooms, the corner mark is drawn in SAGE (Nick's pick:
  // all sage, both rooms), visibly (opacity >= .5 while she is not writing), its mask image loads as a real PNG, and nothing of the mockup
  // covers it; the front door's mark is the all-sage copy too.
  'r5-logo': async (app) => {
    await page(app, 'arbor-r5-logo', WORDS);
    await app.mouseMove(40, 300); await sleep(900);
    const r = await app.evalJs(`(async () => { const m = document.querySelector('.brand-mark'); if (!m) return { mark: false };
      const cs = getComputedStyle(m), b = m.getBoundingClientRect(), bar = document.querySelector('.arbor2-bar')?.getBoundingClientRect();
      const url = (cs.webkitMaskImage || cs.maskImage || '').match(/url\\("?([^")]+)"?\\)/)?.[1] || null;
      let png = null; if (url) { const res = await fetch(url); const u = new Uint8Array(await res.arrayBuffer()); png = res.status === 200 && u[1] === 0x50 && u[2] === 0x4E && u[3] === 0x47; }
      const hit = bar && !(bar.right <= b.left || bar.left >= b.right || bar.bottom <= b.top || bar.top >= b.bottom);
      return { mark: true, bg: cs.backgroundColor, opacity: Number(cs.opacity), url, png, covered: !!hit, rect: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
        bar: bar ? [Math.round(bar.left), Math.round(bar.top), Math.round(bar.width), Math.round(bar.height)] : null, room: document.documentElement.getAttribute('data-arbor2-room') }; })()`);
    await load(app, '#/');
    await waitSoft(app, "!!document.querySelector('img.wz-logo')", { label: 'front door logo', timeout: 6000 });
    const door = await app.evalJs("(() => { const i = document.querySelector('img.wz-logo'); return i ? getComputedStyle(i).content : null; })()");
    const ok = { mark: r.mark, sage: r.bg === 'rgb(183, 188, 154)', seen: r.opacity >= 0.5, png: r.png === true, clear: r.covered === false, door: /wrizo-logo-sage-all\.png/.test(door || '') };
    if (Object.values(ok).some((v) => !v)) fail('R5-LOGO', { bad: Object.keys(ok).filter((k) => !ok[k]), ...r, door });
    say('r5-logo', { ok, ...r, door });
    await page(app, 'arbor-r5-logo', WORDS);
    await app.mouseMove(40, 300); await sleep(900);
  },

  // ── 6. TYPEWRITER IN ARBOR (§10b): no diffused or vignetted paper edge on the zoomed page - the zoom and the fading text are the only
  // flourishes; still unframed (no border, no shadow). The sheet is a hard rectangle (no mask), the vignette's hole over it is hard, and the
  // sheet is exactly the visible page.
  'r5-typewriter': async (app) => {
    await page(app, 'arbor-r5-tw', WORDS);
    await waitSoft(app, "!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'typewriter zoom', timeout: 4000 });
    await sleep(700);
    const r = await app.evalJs(`(() => { const s = document.querySelector('.arbor2-paper'), p = document.querySelector('.mode-page'); if (!s || !p) return { sheet: !!s, page: !!p };
      const cs = getComputedStyle(s), pcs = getComputedStyle(p), sb = s.getBoundingClientRect(), pb = p.getBoundingClientRect();
      const vm = getComputedStyle(document.documentElement).getPropertyValue('--arbor2-vignette-mask').trim();
      // a hard hole: every gradient in the vignette mask jumps from black to clear at one offset (its two stops share a position)
      const stops = [...vm.matchAll(/(rgba?\\([^)]+\\))\\s*(-?[\\d.]+)px/g)].map((m) => +m[2]);
      const pairs = []; for (let i = 0; i + 1 < stops.length; i += 2) pairs.push(Math.abs(stops[i + 1] - stops[i]));
      return { sheet: s.getAttribute('data-on') === 'true', mask: cs.maskImage, shadow: cs.boxShadow, pageShadow: pcs.boxShadow, pageBorder: pcs.borderTopColor,
        edgeGap: pairs.length ? Math.max(...pairs) : null, within: sb.left >= pb.left - 0.5 && sb.right <= pb.right + 0.5 }; })()`);
    const ok = { sheet: r.sheet, hard: r.mask === 'none', vignette: r.edgeGap === 0, unframed: r.shadow === 'none' && r.pageShadow === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test(r.pageBorder || ''), within: r.within };
    if (Object.values(ok).some((v) => !v)) fail('R5-TYPEWRITER', { bad: Object.keys(ok).filter((k) => !ok[k]), ...r });
    say('r5-typewriter', { ok, ...r });
  },
};
