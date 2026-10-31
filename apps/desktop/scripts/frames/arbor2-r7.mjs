// ARBOR v2 MOCKUP, ROUND r7 (Fable, Oct 31) - the self-checks for Arbor's DARK PAGE (§2d) and the light page's ink, as named screens for INK's
// frames job (-f screens_file=apps/desktop/scripts/frames/arbor2-r7.mjs). The job's dark tone IS the existing Page: Dark preference
// (data-page='dark'), so the dark frames are the dark page; the light frames the light page. Every screen THROWS with its numbers when its check
// fails and prints them when it passes ("ARBOR-R7 <screen> {...}"; a failure also prints "ARBOR-R7-FAIL ..." in full, since the job keeps only
// 300 characters of an error). Written red-first: run against r7's base (the r6 build rebased on main) before the r7 CSS.
// Seeds go through the app's seams (window.wrizo*), never raw collection storage. No imports.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R7 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R7-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
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
const COLOUR = `
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };
  const hex = (c) => c ? '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
`;
// the page as drawn: its paper (the page's own background, or - zoomed - the sheet that stands in for it), border, ink, low ink, caret, selection
const READ = `(() => { ${COLOUR}
  const p = document.querySelector('.mode-page'), ed = document.querySelector('${ED}'), col = document.querySelector('.mode-pagecol');
  if (!p || !ed) return { page: false };
  const cs = getComputedStyle(p), ecs = getComputedStyle(ed), sel = getComputedStyle(ed, '::selection');
  const sheet = document.querySelector('.arbor2-paper[data-on="true"]');
  const paper = parse(sheet ? getComputedStyle(sheet).backgroundColor : cs.backgroundColor);
  const ink = parse(ecs.color), low = parse(cs.getPropertyValue('--ink-on-paper-low').trim() ? (() => { const i = document.createElement('i'); i.style.color = cs.getPropertyValue('--ink-on-paper-low').trim(); p.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c; })() : null);
  const b = p.getBoundingClientRect();
  return { page: true, room: document.documentElement.getAttribute('data-arbor2-room'), tone: document.documentElement.getAttribute('data-page'), zoom: col?.getAttribute('data-zoom') ?? null,
    paper: hex(paper), border: hex(parse(cs.getPropertyValue('--paper-border').trim() ? (() => { const i = document.createElement('i'); i.style.color = cs.getPropertyValue('--paper-border').trim(); p.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c; })() : null)),
    ink: hex(ink), low: hex(low), inkRatio: paper && ink ? ratio(ink, paper) : null, lowRatio: paper && low ? ratio(low, paper) : null,
    caret: hex(parse(ecs.caretColor)), selLine: sel.textDecorationLine, selColour: hex(parse(sel.textDecorationColor)), selBg: sel.backgroundColor,
    sheetMask: sheet ? getComputedStyle(sheet).maskImage : null, sheetShadow: sheet ? getComputedStyle(sheet).boxShadow : null,
    rect: { l: Math.round(b.left * 10) / 10, t: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 } }; })()`;
const same = (a, b) => !!a && !!b && ['l', 't', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);

export default {
  // ── THE PAGE IN BOTH TONES AND BOTH ROOMS, AND ITS RECT. Dark tone: paper #1A1510, border #3A2D22, ink #EFE4CB (>= 13.9:1), low ink #B9AA8C
  // (>= 4.5:1), caret brass, selection brass rules over and under (no fill that hides the ink); the same in the DAY room (the bar's Room switch).
  // Light tone: ink #241A10 >= 13.9:1, in both rooms. Zoomed Free Write and Draft; the page's rect equals flag-off in every case (Page: Dark too).
  'r7-page': async (app) => {
    const out = {};
    for (const mode of ['freewrite', 'draft']) {
      const go = async (on) => { await page(app, 'arbor-r7-page', WORDS, on); if (mode === 'draft') { await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(1400); } };
      await go(false); const off = await app.evalJs(READ);
      await go(true); const toneRoom = await app.evalJs(READ);
      const other = toneRoom.room === 'night' ? 'Day' : 'Night';
      await clickText(app, '.arbor2-bar-opt', other); await sleep(900);
      const switched = await app.evalJs(READ);
      out[mode] = { off: off.rect, toneRoom, switched };
    }
    const dark = out.freewrite.toneRoom.tone === 'dark';
    const pageOk = (r) => dark
      ? r.paper === '#1A1510' && r.border === '#3A2D22' && r.ink === '#EFE4CB' && r.inkRatio >= 13.9 && r.low === '#B9AA8C' && r.lowRatio >= 4.5 && r.caret === '#FF9800'
        && /underline/.test(r.selLine) && /overline/.test(r.selLine) && r.selColour === '#FF9800'
      : r.ink === '#241A10' && r.inkRatio >= 13.9;
    const ok = {};
    for (const [m, v] of Object.entries(out)) {
      ok[m + ' page'] = pageOk(v.toneRoom);
      ok[m + ' other room'] = pageOk(v.switched) && v.switched.room !== v.toneRoom.room;
      ok[m + ' rect'] = same(v.off, v.toneRoom.rect) && same(v.off, v.switched.rect);
    }
    // Typewriter stays unframed: the zoomed page's sheet is the page's own paper, hard (no mask), no shadow
    const z = out.freewrite.toneRoom;
    ok['typewriter unframed'] = z.zoom === 'true' && z.sheetMask === 'none' && z.sheetShadow === 'none' && z.paper === (dark ? '#1A1510' : '#F3EDE1');
    const brief = { dark, ok, fw: out.freewrite, dr: { off: out.draft.off, on: out.draft.toneRoom.rect, sw: out.draft.switched.rect, ink: out.draft.toneRoom.ink, paper: out.draft.toneRoom.paper } };
    if (Object.values(ok).some((x) => !x)) fail('R7-PAGE', brief);
    say('r7-page', brief);
  },
  // ── PAGE ONLY: with Page: Dark the board keeps its cream stock and its cards their cream card and dark ink.
  'r7-board': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'arbor-r7-board', text: 'R7 board', pageType: 'board', boxes: [{ id: 'arbor-r7-box', kind: 'text', x: 0.08, y: 0.1, w: 0.3, h: 0.14, z: 1, text: 'A card on the board' }], createdAt: '2026-04-01T00:00:00.000Z', source: null, origin: null })})`);
    await sleep(300);
    await load(app, '#/page/arbor-r7-board');
    await waitSoft(app, "!!document.querySelector('.board-canvas, .board-canvas-wrap')", { label: 'board', timeout: 8000 });
    await sleep(1200);
    const r = await app.evalJs(`(() => { ${COLOUR}
      const wrap = document.querySelector('.board-canvas-wrap') || document.querySelector('.board-canvas'), canvas = document.querySelector('.board-canvas');
      const box = document.querySelector('.board-box');
      const txt = box && ([...box.querySelectorAll('*')].find((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || box);
      const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) return c; } return null; };
      const cardBg = box ? bgOf(txt) : null, cardInk = txt ? parse(getComputedStyle(txt).color) : null;
      return { tone: document.documentElement.getAttribute('data-page'), wrap: hex(parse(getComputedStyle(wrap).backgroundColor)), canvas: canvas ? hex(parse(getComputedStyle(canvas).backgroundColor)) : null,
        card: hex(cardBg), ink: hex(cardInk), inkRatio: cardBg && cardInk ? ratio(cardInk, cardBg) : null, box: !!box }; })()`);
    const cream = (h) => !!h && (() => { const n = parseInt(h.slice(1), 16); return (n >> 16) >= 0xE8 && ((n >> 8) & 255) >= 0xE0 && (n & 255) >= 0xC8; })();
    const ok = { wrap: cream(r.wrap), card: r.box && cream(r.card), ink: r.inkRatio !== null && r.inkRatio >= 7 };
    if (Object.values(ok).some((x) => !x)) fail('R7-BOARD', { ok, ...r });
    say('r7-board', { ok, ...r });
  },
};
