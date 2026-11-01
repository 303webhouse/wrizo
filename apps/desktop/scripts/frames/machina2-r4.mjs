// MACHINA v2 MOCKUP, ROUND r4 - the self-checks, as named screens for INK's frames job (-f themes=machina -f screens_file=apps/desktop/scripts/
// frames/machina2-r4.mjs). Sources: Fable, Nov 1 (Machina r4: 1. the flush top bar with the "..." inside it, as in Arbor, page rect unchanged;
// 2. the breadcrumb names and the right-hand "Files" button at Machina's chrome size, Plex Sans 12-13 px; 3. every wow factor discoverable at
// rest; the Room row = Automatic · Day · Night; drop Blue wash; Ctrl+/ stays the Controls drawer, the command line takes the free key) and the
// Wrizors' door specs (Downloads/wrizors-to-ARBOR-nov1b.md, md5 9272a1ff): 1 the command-line door, 2 the readout instrument, 3 Outline ->
// Parts first in the Tools drawer + the Plans pop-out row, 4 Open beside at the top of the Assets tab + the Files pop-out's "beside" door,
// 5 the keyboard legend in the rail footer, 6 the switch list without Blue wash.
// THE FREE KEY (the lane's check, Nov 1): the app binds Ctrl/⌘ with Z, Y, B, I, U, /, 1-8 and (the mockup) K; Electron binds nothing; Chrome and
// Edge bind nothing on Ctrl+. - so the command line is Ctrl+. (⌘. on a Mac). This runner is not a Mac.
// Every screen THROWS with its numbers when its check fails and prints them when it passes ("MACHINA2-R4 <screen> {...}"; a failure also prints
// "MACHINA2-R4-FAIL ..." in full). Written red-first: run against r3 (c6955001) before the r4 build. Seeds go through window.wrizo*. No imports.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The quarterly figures show a steady rise in exports. The tariff change explains part of it, but not all.\nThe second paragraph names the evidence: shipping records for March and April.\nA third paragraph asks who the reader is.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`MACHINA2-R4 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`MACHINA2-R4-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash, on = true) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?machina2=1' : '/')} + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, `document.documentElement.getAttribute('data-machina2') ${on ? "=== 'true'" : '== null'}`, { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  if (on) await app.evalJs("typeof window.machina2Clock === 'function' && window.machina2Clock(document.documentElement.getAttribute('data-page') === 'light' ? '12:00' : '22:00')");
};
// a loose File, or (project: true) a File in a Project with two more Files beside it - the Files toggle, Part n of m and Open beside need those
const page = async (app, id, text, { on = true, project = false } = {}) => {
  if (project) {
    await app.evalJs(`(() => { const p = window.wrizoCreateProject('R4 Report'); const mk = (pid, t, i) => window.wrizoCreateJournalPage({ id: pid, text: t, createdAt: '2026-04-0' + (i + 1) + 'T00:00:00.000Z', origin: 'loose', source: 'page', projectId: p.id, pageType: 'manuscript', orderIndex: i });
      mk(${JSON.stringify(id + '-a')}, 'Background. The market before the tariff.', 0); mk(${JSON.stringify(id)}, ${JSON.stringify(text)}, 1); mk(${JSON.stringify(id + '-c')}, '', 2); return p.id; })()`);
  } else {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  }
  await sleep(300);
  await load(app, '#/page/' + id, on);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1200);
};
const build = async (app) => { await clickText(app, '.desk-mode-tab', 'Build'); await sleep(1200); };
const cast = async (app, c) => { await clickText(app, '.machina2-bar-opt', c === 'neutral' ? 'Neutral' : 'Cool'); await sleep(500); };
const blur = (app) => app.evalJs(`document.querySelector('${ED}')?.blur()`);
const R = `const rr = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left * 10) / 10, t: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, r: Math.round(b.right * 10) / 10, b: Math.round(b.bottom * 10) / 10 }; };
  const seen = (el) => { if (!el) return false; const b = el.getBoundingClientRect(); if (b.width < 2 || b.height < 2) return false; for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.5) return false; } return true; };
  const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0);`;
const RECT = `(() => { ${R} return { page: rr(document.querySelector('.mode-page')), col: rr(document.querySelector('.mode-pagecol')), w: innerWidth }; })()`;
const same = (a, b) => !!a && !!b && ['l', 't', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);
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
const openTools = async (app) => { if (!(await app.evalJs(`!!document.querySelector(".wz-sliver[data-open='true']")`))) await clickSel(app, '.wz-sliver-grip'); await waitSoft(app, `!!document.querySelector(".wz-sliver[data-open='true']")`, { label: 'tools', timeout: 3000 }); await sleep(500); };
// (driver fix after green leg 41296556886: the drawer's tab is in the page while the drawer is CLOSED - the grip's data-open is the drawer's state)
const openAssets = async (app) => { if (!(await app.evalJs("!!document.querySelector(\".wz-tutor-grip[data-open='true']\")"))) await clickSel(app, '.wz-tutor-grip'); await sleep(700); await clickSel(app, '#wz-tutor-tab-links'); await sleep(400); };
const railOpen = async (app, word) => { await app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-strip-item')].find((x) => (x.querySelector('.wz-strip-label')?.textContent || x.textContent || '').trim() === ${JSON.stringify(word)}); if (b) b.click(); return !!b; })()`); await sleep(700); };
const key = (app, k, code) => app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, modifiers: 2, windowsVirtualKeyCode: k === '.' ? 190 : k === '/' ? 191 : k.toUpperCase().charCodeAt(0) }).then(() => app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, modifiers: 2 }));
// THE NEW LABELS whose pairs r4 measures (every door, at rest and open)
const NEW = '.machina2-door, .machina2-legend, .machina2-run, .machina2-outline, .machina2-plans-outline, .machina2-beside, .wz-link-dock-head, .machina2-files-beside, .sprint-crumb, .sprint-toggle-btn';

export default {
  // ── 1. THE TOP BAR IS FLUSH AND HOLDS THE "...". The drawn bar's top is the window's top; the "..." sits inside the bar's right end; the page's
  // and its column's rects equal the flag-off page's, in Sprint and in Build.
  'm2r4-bar': async (app) => {
    const out = {};
    for (const mode of ['sprint', 'build']) {
      const go = async (on) => { await page(app, 'm2r4-bar', WORDS, { on }); if (mode === 'build') await build(app); };
      await go(false); const off = await app.evalJs(RECT);
      await go(true); const on = await app.evalJs(RECT);
      const b = await app.evalJs(`(() => { ${R} const dots = document.querySelector('.gh-corner-glyph'); return { bar: rr(bar), dots: rr(dots) }; })()`);
      const inside = !!b.bar && !!b.dots && b.dots.l >= b.bar.l && b.dots.r <= b.bar.r + 0.5 && b.dots.t >= b.bar.t - 0.5 && b.dots.b <= b.bar.b + 0.5;
      out[mode] = { ok: !!b.bar && b.bar.t <= 0.5 && inside && same(off.page, on.page) && same(off.col, on.col), bar: b.bar, dots: b.dots, off: off.page, on: on.page };
    }
    if (!out.sprint.ok || !out.build.ok) fail('M2R4-BAR', out);
    say('m2r4-bar', out);
  },

  // ── 2. THE CRUMB AND THE FILES BUTTON AT MACHINA'S CHROME SIZE: every crumb item and the right-hand Files toggle letter in IBM Plex Sans, 12-13 px.
  'm2r4-type': async (app) => {
    await page(app, 'm2r4-type', WORDS, { project: true });
    const t = await app.evalJs(`(() => { const f = (el) => el ? { fam: getComputedStyle(el).fontFamily, size: parseFloat(getComputedStyle(el).fontSize), text: el.textContent.trim().slice(0, 30) } : null;
      const crumb = [...document.querySelectorAll('.sprint-crumb .crumb-item, .sprint-crumb .crumb-here, .sprint-crumb .wz-crumb-home')].filter((e) => e.getBoundingClientRect().width > 0).map(f);
      return { crumb, files: f(document.querySelector('.sprint-toggle-btn')) }; })()`);
    const okF = (x) => !!x && /IBM Plex Sans/.test(x.fam) && !/Mono/.test(x.fam.split(',')[0]) && x.size >= 12 && x.size <= 13;
    const ok = { crumb: t.crumb.length >= 2 && t.crumb.every(okF), files: okF(t.files) };
    if (!ok.crumb || !ok.files) fail('M2R4-TYPE', { ok, t });
    say('m2r4-type', { ok, t });
  },

  // ── 3a. THE COMMAND-LINE DOOR (Wrizors 1). At rest a hairline box in the top bar's right end, left of the "...": ">" in Plex Mono and the hint
  // "Ctrl+." in quiet grey, about 120 px wide, labelled "Commands"; it never opens the line by itself (3 s at rest); a click opens the line;
  // Esc closes it; Ctrl+. opens it; Ctrl+/ opens the CONTROLS DRAWER and not the line. The page never moves.
  'm2r4-door': async (app) => {
    await page(app, 'm2r4-door', WORDS);
    await blur(app); await sleep(3000);
    const r0 = await app.evalJs(RECT);
    const d = await app.evalJs(`(() => { ${R} const dots = document.querySelector('.gh-corner-glyph'), door = document.querySelector('.machina2-door');
      return { door: rr(door), seen: seen(door), bar: rr(bar), dots: rr(dots), label: door?.getAttribute('aria-label') ?? null, text: door ? door.textContent.replace(/\\s+/g, ' ').trim() : null,
        mono: door ? getComputedStyle(door.querySelector('.machina2-door-prompt') || door).fontFamily : null, open: !!document.querySelector('.machina2-cmd') }; })()`);
    await clickSel(app, '.machina2-door'); await sleep(400);
    const clicked = await app.evalJs("!!document.querySelector('.machina2-cmd')");
    await app.evalJs("document.querySelector('.machina2-cmd-input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(300);
    const escaped = await app.evalJs("!document.querySelector('.machina2-cmd')");
    await app.evalJs(`document.querySelector('${ED}')?.focus()`);
    await key(app, '.', 'Period'); await sleep(400);
    const dotKey = await app.evalJs("!!document.querySelector('.machina2-cmd')");
    await app.evalJs("document.querySelector('.machina2-cmd-input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(300);
    await app.evalJs(`document.querySelector('${ED}')?.focus()`);
    await key(app, '/', 'Slash'); await sleep(700);
    const slash = await app.evalJs(`({ line: !!document.querySelector('.machina2-cmd'), controls: !!document.querySelector(".wz-sliver[data-open='true']") })`);
    const r1 = await app.evalJs(RECT);
    const ok = {
      atRest: d.seen && !d.open && d.label === 'Commands' && /^>/.test(d.text || '') && /Ctrl\+\./.test(d.text || '') && /Plex Mono/.test(d.mono || ''),
      place: !!d.door && !!d.bar && !!d.dots && d.door.r <= d.dots.l + 0.5 && d.door.t >= d.bar.t - 0.5 && d.door.b <= d.bar.b + 0.5 && d.door.w >= 90 && d.door.w <= 150,
      click: clicked, esc: escaped, dotKey, slashIsControls: slash.controls && !slash.line,
      rect: same(r0.page, r1.page),
    };
    if (Object.values(ok).some((x) => !x)) fail('M2R4-DOOR', { ok, d, slash });
    say('m2r4-door', { ok, door: d.door, text: d.text });
  },

  // ── 3b. THE READOUT IS AN INSTRUMENT (Wrizors 2): under the page one hairline rule across the page's width; the Run strip at its left end; the
  // fields separated by hairline ticks; a "?" at the right end whose one line says "~ means an estimate; pages follow the page kind"; Plex Mono
  // 11 px, quiet grey. In a Project it reads "Part 2 of 3". The page never moves.
  'm2r4-readout': async (app) => {
    await page(app, 'm2r4-readout', WORDS, { project: true });
    await build(app); await blur(app); await sleep(600);
    const READ = `(() => { ${R} const run = document.querySelector('.machina2-run'), strip = run?.querySelector('.machina-run-strip'), rule = run;
      const fields = [...(run?.querySelectorAll('.machina2-field') || [])].map((f) => f.textContent.trim()), ticks = run?.querySelectorAll('.machina2-tick').length ?? 0;
      const q = run?.querySelector('.machina2-readout-help'), cs = run ? getComputedStyle(run.querySelector('.machina2-field') || run) : null;
      return { run: rr(run), page: rr(document.querySelector('.mode-page')), strip: rr(strip), rule: run ? getComputedStyle(run).borderTopWidth + ' ' + getComputedStyle(run).borderTopStyle : null, fields, ticks,
        q: rr(q), qLine: q ? (q.getAttribute('title') || q.getAttribute('aria-label') || '') : null, fam: cs?.fontFamily ?? null, size: cs ? parseFloat(cs.fontSize) : null }; })()`;
    const r0 = await app.evalJs(RECT), s = await app.evalJs(READ);
    await clickSel(app, '.machina2-readout-help'); await sleep(300);
    const said = await app.evalJs("(document.querySelector('.machina2-readout-line')?.textContent || '').trim()");
    const r1 = await app.evalJs(RECT);
    const ok = {
      rule: !!s.run && /^1px solid$/.test(s.rule || '') && !!s.page && Math.abs(s.run.l - s.page.l) <= 2 && Math.abs(s.run.w - s.page.w) <= 2,
      stripLeft: !!s.strip && Math.abs(s.strip.l - s.run.l) <= 2,
      fields: s.fields.length >= 4 && s.ticks === s.fields.length - 1 && /words$/.test(s.fields[0]) && s.fields.some((f) => /^Part 2 of 3$/.test(f)),
      help: !!s.q && s.q.r >= s.run.r - 24 && /~ means an estimate; pages follow the page kind/.test(s.qLine || '') && /~ means an estimate; pages follow the page kind/.test(said),
      type: /Plex Mono/.test(s.fam || '') && s.size === 11,
      rect: same(r0.page, r1.page),
    };
    if (Object.values(ok).some((x) => !x)) fail('M2R4-READOUT', { ok, s, said });
    say('m2r4-readout', { ok, fields: s.fields, run: s.run, page: s.page });
  },

  // ── 3c. OUTLINE -> PARTS (Wrizors 3): in the Tools drawer on Build, the FIRST section, headed OUTLINE, above Forms; every point shows "→ Part" at
  // rest (no hover); pressing one shows the brass tick. The Plans pop-out's first row is "Outline → Parts" in the blue, and it opens the Tools
  // drawer on that section.
  'm2r4-outline': async (app) => {
    await page(app, 'm2r4-outline', WORDS);
    await build(app); await openTools(app);
    const s = await app.evalJs(`(() => { ${R} const sv = document.querySelector(".wz-sliver[data-open='true']"); const secs = [...(sv?.querySelectorAll('.wz-sliver-section') || [])].filter(seen);
      const heads = secs.map((x) => (x.querySelector('.wz-sliver-h')?.textContent || '').trim());
      const pts = [...document.querySelectorAll('.machina2-outline-point')]; const parts = pts.map((p) => p.querySelector('.machina2-outline-part'));
      return { heads, first: secs[0]?.classList.contains('machina2-outline') ?? false, points: pts.length, partsSeen: parts.filter(seen).length,
        formsAt: heads.findIndex((h) => /^forms/i.test(h)), outlineAt: secs.findIndex((x) => x.classList.contains('machina2-outline')) }; })()`);
    await clickSel(app, '.machina2-outline-part'); await sleep(200);
    const tick = await app.evalJs("!!document.querySelector('.machina2-outline-point[data-done=\"true\"] .machina2-outline-tick')");
    await clickSel(app, '.wz-sliver-grip'); await sleep(500);
    await railOpen(app, 'Plans');
    const p = await app.evalJs(`(() => { ${R} const panel = document.querySelector('.wz-cascade-panel'); const row = panel?.querySelector('.machina2-plans-outline');
      const firstRow = panel ? [...panel.querySelectorAll('button, a')].filter((x) => !x.closest('.wz-cascade-panel-head')).find(seen) : null; return { row: !!row && seen(row), text: row?.textContent.trim() ?? null, first: firstRow === row, colour: row ? getComputedStyle(row).color : null,
        guide: getComputedStyle(document.documentElement).getPropertyValue('--machina2-guide').trim() }; })()`);
    await clickSel(app, '.machina2-plans-outline'); await sleep(900);
    const after = await app.evalJs(`(() => { ${R} const o = document.querySelector(".wz-sliver[data-open='true'] .machina2-outline"); return { open: !!o && seen(o), top: rr(o) }; })()`);
    const ok = {
      first: s.first && s.outlineAt === 0 && /^outline$/i.test(s.heads[0] || '') && (s.formsAt < 0 || s.formsAt > s.outlineAt),
      atRest: s.points === 3 && s.partsSeen === 3, tick,
      plansRow: p.row && p.first && p.text === 'Outline → Parts', plansOpens: after.open,
    };
    if (Object.values(ok).some((x) => !x)) fail('M2R4-OUTLINE', { ok, s, p, after });
    say('m2r4-outline', { ok, heads: s.heads, plans: p.text });
  },

  // ── 3d. OPEN BESIDE (Wrizors 4): at the top of the Assets tab "Open beside ▸" in the blue, at rest; pressing it lists the Files and the Plans;
  // the chosen one opens READ-ONLY in the drawer under the hairline header "Beside · <name> · read-only". The Files pop-out's rows show a small
  // "beside" door on hover and on keyboard focus (not at rest). The page never moves.
  'm2r4-beside': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'm2r4-plan', text: 'Launch plan', pageType: 'board', boxes: [{ id: 'm2r4-box', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.14, z: 1, text: 'Ship the report by Friday' }], createdAt: '2026-04-01T00:00:00.000Z', source: null, origin: null })})`);
    await page(app, 'm2r4-beside', WORDS, { project: true });
    await build(app);   // (driver: the dock opens only where the page leaves room beside it - never over the page; Sprint's zoom leaves none at 1366)
    const r0 = await app.evalJs(RECT);
    await openAssets(app);
    const top = await app.evalJs(`(() => { ${R} const pane = document.querySelector('.wz-graft-pane, [data-links-pane], #wz-tutor-panel-links') || document.querySelector('#wz-tutor-tab-links')?.closest('.wz-tutor-panel'); const b = document.querySelector('.machina2-beside-open');
      return { seen: seen(b), text: b?.textContent.trim() ?? null, colour: b ? getComputedStyle(b).color : null, guide: b ? getComputedStyle(b).getPropertyValue('--machina2-guide').trim() : null, rect: rr(b) }; })()`);
    await clickSel(app, '.machina2-beside-open'); await sleep(400);
    const list = await app.evalJs("[...document.querySelectorAll('.machina2-beside-item')].map((b) => [b.getAttribute('data-kind'), b.textContent.trim()])");
    await app.evalJs("(() => { const b = [...document.querySelectorAll('.machina2-beside-item')].find((x) => x.getAttribute('data-kind') === 'plan'); if (b) b.click(); })()"); await sleep(800);
    const dock = await app.evalJs("(() => { const h = document.querySelector('.wz-link-dock-head'); const d = document.querySelector('.wz-link-dock'); return { head: h ? h.textContent.replace(/\\s+/g, ' ').trim() : null, text: d ? d.textContent : '', editable: !!d?.querySelector('[contenteditable=\"true\"], textarea, input') }; })()");
    const r1 = await app.evalJs(RECT);
    // (driver fix after green leg 41299159350: a Project page's Files pop-out lists its DRAWER's sets - this fixture's Project has no drawer, so the
    // pop-out held no rows. The Files pop-out's rows are met on a loose page, beside the other loose pages: seed one, and read it there)
    await app.evalJs("window.wrizoCreateJournalPage({ id: 'm2r4-beside-other', text: 'Notes from the call', createdAt: '2026-04-02T00:00:00.000Z', origin: 'loose', source: 'page' })");
    await page(app, 'm2r4-beside-loose', WORDS);
    await railOpen(app, 'Files');
    // (driver fix after green leg 41296556886: the pop-out lists a Project's Files in sets that may be folded - open them, as the writer would)
    await app.evalJs("document.querySelectorAll(\".wz-cascade-panel .wz-set-head[aria-expanded='false']\").forEach((h) => h.click())"); await sleep(300);
    const panelSaw = await app.evalJs("(() => { const p = document.querySelector('.wz-cascade-panel'); return p ? { title: p.querySelector('.wz-cascade-panel-title')?.textContent.trim() ?? null, rows: p.querySelectorAll('.wz-section-row').length, sets: [...p.querySelectorAll('.wz-set-head')].map((h) => h.getAttribute('aria-expanded')), beside: p.querySelectorAll('.machina2-files-beside').length } : null; })()");
    // (hover through the real pointer: CSS :hover answers only to it)
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 400 }); await sleep(150);
    const fp0 = await app.evalJs(`(() => { ${R} const rows = [...document.querySelectorAll('.wz-cascade-panel .wz-section-row')].filter(seen); /* (driver fix after green leg 41300435127: the row of ANOTHER File - the page underfoot rightly has no door) */ const row = rows.find((r) => r.querySelector('.machina2-files-beside')); const door = row?.querySelector('.machina2-files-beside');
      return { rows: rows.length, rest: seen(door), door: !!door, text: door?.textContent.trim() ?? null, at: row ? rr(row) : null }; })()`);
    if (fp0.at) { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(fp0.at.l + fp0.at.w / 2), y: Math.round(fp0.at.t + fp0.at.h / 2) }); await sleep(250); }
    const hover = await app.evalJs(`(() => { ${R} const row = [...document.querySelectorAll('.wz-cascade-panel .wz-section-row')].filter(seen).find((r) => r.querySelector('.machina2-files-beside')); return seen(row?.querySelector('.machina2-files-beside')); })()`);
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 400 }); await sleep(150);
    const fp = { ...fp0, hover };
    await app.evalJs("(() => { const d = document.querySelector('.wz-cascade-panel .machina2-files-beside'); d?.focus(); })()"); await sleep(150);
    const focusShown = await app.evalJs(`(() => { ${R} const d = document.activeElement; return !!d && d.classList.contains('machina2-files-beside') && seen(d); })()`);
    const ok = {
      top: top.seen && top.text === 'Open beside ▸',
      lists: list.some((x) => x[0] === 'file') && list.some((x) => x[0] === 'plan' && /Launch plan/.test(x[1])),
      readOnly: /^Beside · Launch plan · read-only/.test(dock.head || '') && /Ship the report by Friday/.test(dock.text) && !dock.editable,
      rect: same(r0.page, r1.page),
      filesDoor: fp.door && !fp.rest && fp.hover && focusShown && fp.text === 'beside',
    };
    if (Object.values(ok).some((x) => !x)) fail('M2R4-BESIDE', { ok, top, list, dock, fp, focusShown, panelSaw });
    say('m2r4-beside', { ok, list, head: dock.head });
  },

  // ── 3e. THE KEYBOARD LEGEND IN THE RAIL FOOTER (Wrizors 5): three lines at rest, quiet grey - the command line (Ctrl+.), the link (Ctrl+K) and
  // the Controls drawer (Ctrl+/), the chords that exist; the "Keyboard legend" switch takes it away.
  'm2r4-legend': async (app) => {
    await page(app, 'm2r4-legend', WORDS);
    await blur(app); await sleep(600);
    const READ = `(() => { ${R} ${COLOUR} const lg = document.querySelector('.machina2-legend'), rail = document.querySelector('.desk-frame-strip, .desk-rail');
      const lines = [...(lg?.querySelectorAll('.machina2-legend-line') || [])].map((l) => l.textContent.replace(/\\s+/g, ' ').trim());
      return { seen: seen(lg), inRail: !!lg && !!rail && rail.contains(lg), lines, pairs: lg ? textEls(lg).map(pair) : [] }; })()`;
    const s = await app.evalJs(READ);
    await clickSel(app, '.machina2-switch[data-switch="legend"]'); await sleep(300);
    const offSeen = await app.evalJs(`(() => { ${R} return seen(document.querySelector('.machina2-legend')); })()`);
    await clickSel(app, '.machina2-switch[data-switch="legend"]'); await sleep(200);
    const ok = { rest: s.seen && s.inRail, lines: s.lines.length === 3 && /^Ctrl\+\./.test(s.lines[0]) && /^Ctrl\+K/.test(s.lines[1]) && /^Ctrl\+\//.test(s.lines[2]),
      contrast: s.pairs.length > 0 && s.pairs.every((p) => p.ratio >= 4.5), switchOff: !offSeen };
    if (Object.values(ok).some((x) => !x)) fail('M2R4-LEGEND', { ok, s, offSeen });
    say('m2r4-legend', { ok, lines: s.lines, min: Math.min(...s.pairs.map((p) => p.ratio)) });
  },

  // ── THE PANEL: the Room row reads Automatic · Day · Night (Fable, Nov 1); no Blue wash switch, and no wash in the light room.
  'm2r4-panel': async (app) => {
    await page(app, 'm2r4-panel', WORDS);
    // (r5 driver fix, no assertion changed: the row is named Lighting now - spec draft 9 §2f, §11 - so the selector follows the name)
    const s = await app.evalJs(`(() => { const g = document.querySelector('.machina2-bar [role="group"][aria-label="Lighting"]'); const sw = [...document.querySelectorAll('.machina2-switch-row')].map((r) => r.textContent.replace(/On|Off/g, '').trim());
      return { opts: g ? [...g.querySelectorAll('[data-room-opt]')].map((b) => [b.getAttribute('data-room-opt'), b.textContent.trim()]) : null, sw, note: (document.querySelector('.machina2-bar > p.machina2-bar-note')?.textContent || '').trim() }; })()`);
    await app.evalJs("window.machina2Clock?.('12:00')"); await sleep(1300);
    const wash = await app.evalJs("getComputedStyle(document.body).backgroundImage");
    // (noWash reads the wash's own blue: the room's ground is itself a flat gradient, so "no gradient" would be the wrong question)
    const ok = { room: JSON.stringify(s.opts) === '[["clock","Automatic"],["light","Day"],["dark","Night"]]', noWash: !s.sw.includes('Blue wash') && !/127,\s*160,\s*188/.test(wash), note: /Ctrl\+\. opens the command line/.test(s.note) };
    if (Object.values(ok).some((x) => !x)) fail('M2R4-PANEL', { ok, s, wash });
    say('m2r4-panel', { ok, s });
  },

  // ── EVERY NEW LABEL PAIR (Wrizors: "measure every new label pair"): each door at rest and open, in both casts (the job gives both tones): every
  // lettered thing inside the new doors >= 4.5:1, each read in its own colours on the ground it sits on.
  'm2r4-contrast': async (app) => {
    const READ = (stage) => `(() => { ${COLOUR} const out = { stage: ${JSON.stringify(stage)}, pairs: [] };
      // (instrument fix after green leg 41296556886: a group is named by the door class it matched, not its first class)
      const names = ${JSON.stringify(NEW)}.split(', ').map((x) => x.slice(1));
      document.querySelectorAll(${JSON.stringify(NEW)}).forEach((root) => { if (!shown(root)) return; const where = names.find((n) => root.classList.contains(n)) || root.className.split(' ')[0]; textEls(root).forEach((el) => { const p = pair(el); out.pairs.push({ where, text: el.textContent.trim().slice(0, 20), ...p }); }); });
      return out; })()`;
    const reads = [];
    for (const c of ['cool', 'neutral']) {
      await page(app, 'm2r4-contrast', WORDS, { project: true });
      await cast(app, c); await build(app); await blur(app); await sleep(400);
      reads.push(await app.evalJs(READ(c + ' rest')));
      await clickSel(app, '.machina2-readout-help'); await sleep(200);
      await clickSel(app, '.machina2-door'); await sleep(400);
      reads.push(await app.evalJs(READ(c + ' line open')));
      await app.evalJs("document.querySelector('.machina2-cmd-input')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(200);
      await openTools(app); reads.push(await app.evalJs(READ(c + ' tools')));
      await clickSel(app, '.wz-sliver-grip'); await sleep(400);
      await openAssets(app); reads.push(await app.evalJs(READ(c + ' assets')));
      await clickSel(app, '.machina2-beside-open'); await sleep(300); reads.push(await app.evalJs(READ(c + ' beside list')));
      await clickSel(app, '.machina2-beside-item'); await sleep(700); reads.push(await app.evalJs(READ(c + ' beside open')));
      await clickSel(app, '.wz-tutor-grip'); await sleep(400);
      await railOpen(app, 'Plans'); reads.push(await app.evalJs(READ(c + ' plans')));
    }
    const all = reads.flatMap((r) => r.pairs.map((p) => ({ stage: r.stage, ...p })));
    const bad = all.filter((p) => p.ratio < 4.5);
    const where = [...new Set(all.map((p) => p.where))];
    const need = ['machina2-door', 'machina2-legend', 'machina2-run', 'machina2-outline', 'machina2-plans-outline', 'machina2-beside', 'wz-link-dock-head'];
    const missing = need.filter((w) => !where.includes(w));
    if (bad.length || missing.length) fail('M2R4-CONTRAST', { bad: bad.slice(0, 8), missing, where, pairs: all.length });
    say('m2r4-contrast', { pairs: all.length, min: Math.min(...all.map((p) => p.ratio)), where, table: [...new Map(all.map((p) => [`${p.where}|${p.fg}|${p.bg}`, `${p.where}: ${p.fg} on ${p.bg} = ${p.ratio}`])).values()] });
  },

  // ── PICTURES FOR THE WRIZORS: each door at rest and open, both casts (the job gives both tones). They assert only that the door was there.
  ...Object.fromEntries(['cool', 'neutral'].flatMap((c) => [
    [`m2r4-pic-rest-${c}`, async (app) => { await page(app, 'm2r4-pic', WORDS, { project: true }); await cast(app, c); await build(app); await blur(app); await sleep(600);
      const ok = await app.evalJs("!!document.querySelector('.machina2-door') && !!document.querySelector('.machina2-legend') && !!document.querySelector('.machina2-readout-help')"); if (!ok) fail('M2R4-PIC', { c, stage: 'rest' }); say(`m2r4-pic-rest-${c}`, { ok }); }],
    [`m2r4-pic-line-${c}`, async (app) => { await page(app, 'm2r4-pic', WORDS, { project: true }); await cast(app, c); await clickSel(app, '.machina2-door'); await sleep(500);
      const ok = await app.evalJs("!!document.querySelector('.machina2-cmd')"); if (!ok) fail('M2R4-PIC', { c, stage: 'line' }); say(`m2r4-pic-line-${c}`, { ok }); }],
    [`m2r4-pic-tools-${c}`, async (app) => { await page(app, 'm2r4-pic', WORDS, { project: true }); await cast(app, c); await build(app); await openTools(app); await clickSel(app, '.machina2-readout-help'); await sleep(300);
      const ok = await app.evalJs("!!document.querySelector('.machina2-outline')"); if (!ok) fail('M2R4-PIC', { c, stage: 'tools' }); say(`m2r4-pic-tools-${c}`, { ok }); }],
    [`m2r4-pic-beside-${c}`, async (app) => { await page(app, 'm2r4-pic', WORDS, { project: true }); await cast(app, c); await build(app); await openAssets(app); await clickSel(app, '.machina2-beside-open'); await sleep(400);
      const ok = await app.evalJs("document.querySelectorAll('.machina2-beside-item').length > 0"); if (!ok) fail('M2R4-PIC', { c, stage: 'beside list' }); say(`m2r4-pic-beside-${c}`, { ok }); }],
    [`m2r4-pic-docked-${c}`, async (app) => { await page(app, 'm2r4-pic', WORDS, { project: true }); await cast(app, c); await build(app); await openAssets(app); await clickSel(app, '.machina2-beside-open'); await sleep(300); await clickSel(app, '.machina2-beside-item'); await sleep(800);
      const ok = await app.evalJs("/read-only/.test(document.querySelector('.wz-link-dock-head')?.textContent || '')"); if (!ok) fail('M2R4-PIC', { c, stage: 'docked' }); say(`m2r4-pic-docked-${c}`, { ok }); }],
    [`m2r4-pic-plans-${c}`, async (app) => { await page(app, 'm2r4-pic', WORDS, { project: true }); await cast(app, c); await railOpen(app, 'Plans');
      const ok = await app.evalJs("!!document.querySelector('.machina2-plans-outline')"); if (!ok) fail('M2R4-PIC', { c, stage: 'plans' }); say(`m2r4-pic-plans-${c}`, { ok }); }],
  ])),
};
