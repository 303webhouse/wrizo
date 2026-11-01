// MACHINA v2 MOCKUP, ROUND r5 - the self-checks and THE NICK WALK, as named screens for INK's frames job (-f themes=machina -f widths=1366
// -f screens_file=apps/desktop/scripts/frames/machina2-r5.mjs). Sources, Nov 1:
//   Fable - THE DRAWER ALIGNMENT (Nick's decision, all themes): CLOSED, the opener tab at the page edge (today's rect), arrow pointing out. OPEN,
//   the drawer FLUSH against the page (no gap), the tab on the drawer's OUTER edge, arrow pointing back ("close"); it moves with the drawer's
//   motion (shared tokens; reduced motion = a cut); the page never moves; drawers stay mirrored, both-or-one. Add it to the Nick walk (both
//   drawers, each room x page mix, 2000 + 1366).
//   Fable - "Machina's mark: build the nameplate per Downloads\wrizors-to-ARBOR-nov1c.md (the left end of the flush bar, label colour, never
//   brass)". Spec draft 9 (md5 01205805) §13b: "WRIZ▢ │ Unfiled / Title…", Plex Mono at the mark's size and spacing (13 px, .08em), the bar's
//   label colour (G1 #E6E8EA on COOL #1E262E, #E6E2DB on NEUTRAL #201E1B; both >= 12:1), the ▢ a hairline square in the same colour, a hairline
//   tick in the bar's hairline colour, 16 px in from the bar's left edge, the same in both rooms; nothing left in the top-left corner.
//   Spec draft 9 §2f / §11: "Lighting ▸ Automatic · Day · Night ... a '?' explains it in one line"; the change lands "after >= 3 s with no
//   keystroke, or at the next File open, whichever comes first".
// Every check THROWS with its numbers when it fails and prints them when it passes ("MACHINA2-R5 <screen> {...}"). Written red-first: run against
// r4 (20b340b1) before the r5 build. Seeds go through window.wrizo*.
import { drawerProof, zoomDrawerProof, walkScreens } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The quarterly figures show a steady rise in exports. The tariff change explains part of it, but not all.\nThe second paragraph names the evidence: shipping records for March and April.\nA third paragraph asks who the reader is.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`MACHINA2-R5 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`MACHINA2-R5-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?machina2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-machina2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const page = async (app, id, mode) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await load(app, '#/page/' + id);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1200);
  if (mode) { await clickText(app, '.desk-mode-tab', mode); await sleep(1200); }
  await app.evalJs(`document.querySelector('${ED}')?.blur(); getSelection()?.removeAllRanges()`);
};
// the room by the panel's own in-session pick (data-room light = Day, dark = Night): a pick lands at once
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(500); };
const cast = async (app, c) => { await clickText(app, '.machina2-bar-opt', c === 'neutral' ? 'Neutral' : 'Cool'); await sleep(500); };

// ---- a pixel instrument: each text run under the given roots against what is painted behind it (the text hidden for the picture) ----
const COLLECT = (sel) => `(() => {
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const runs = [];
  for (const root of document.querySelectorAll(${JSON.stringify(sel)})) { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; let op = 1, hidden = false;
      for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { hidden = true; break; } op *= Number(cs.opacity); }
      const c = parse(getComputedStyle(el).color); if (hidden || !c || c.a * op < 0.05) continue; const rg = document.createRange(); rg.selectNodeContents(n);
      const rects = [...rg.getClientRects()].filter((x) => x.width >= 2 && x.height >= 4).map((x) => [x.left, x.top, x.right, x.bottom]); if (rects.length) runs.push({ where: root.className.split(' ')[0], text: n.textContent.trim().slice(0, 24), fg: [c.r, c.g, c.b, c.a * op], rects }); } }
  window.__m2r5runs = runs; return runs.length; })()`;
const HIDE = `(() => { const s = document.createElement('style'); s.id = 'm2r5-hide'; s.textContent = '*, *::before, *::after{ color:transparent !important; -webkit-text-fill-color:transparent !important; text-shadow:none !important; caret-color:transparent !important; }'; document.head.appendChild(s); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); })()`;
const SHOW = `(() => { document.getElementById('m2r5-hide')?.remove(); return true; })()`;
const MEASURE = (b64) => `(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const k = img.width / innerWidth; const data = cx.getImageData(0, 0, img.width, img.height).data;
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return window.__m2r5runs.map((run) => { const [fr, fg, fb, fa] = run.fg; const ratios = [];
    for (const [x0, y0, x1, y1] of run.rects) { const sx = Math.max(1, (x1 - x0) / 24), sy = Math.max(1, (y1 - y0) / 8);
      for (let y = y0; y < y1; y += sy) for (let x = x0; x < x1; x += sx) { const i = (Math.floor(y * k) * img.width + Math.floor(x * k)) * 4; const r = data[i], g = data[i + 1], b = data[i + 2];
        const lb = L(r, g, b), lf = L(fr * fa + r * (1 - fa), fg * fa + g * (1 - fa), fb * fa + b * (1 - fa)); ratios.push((Math.max(lb, lf) + 0.05) / (Math.min(lb, lf) + 0.05)); } }
    ratios.sort((a, b) => a - b); return { where: run.where, text: run.text, p2: Math.round(ratios[Math.floor(ratios.length * 0.02)] * 100) / 100 }; }); })()`;
const pixels = async (app, sel) => { await app.evalJs(COLLECT(sel)); await app.evalJs(HIDE); const shot = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data; await app.evalJs(SHOW); return app.evalJs(MEASURE(shot)); };

const PLATE = `(() => { const q = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left * 10) / 10, r: Math.round(r.right * 10) / 10, t: Math.round(r.top * 10) / 10, b: Math.round(r.bottom * 10) / 10, w: Math.round(r.width * 10) / 10 }; };
  const shown = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false; } return true; };
  const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0);
  const plate = document.querySelector('.machina2-nameplate'), mark = document.querySelector('.machina2-nameplate-mark'), sq = document.querySelector('.machina2-nameplate-sq'), tick = document.querySelector('.machina2-nameplate-tick');
  const crumb = bar?.querySelector('.sprint-crumb'); const mcs = mark ? getComputedStyle(mark) : null, scs = sq ? getComputedStyle(sq) : null;
  const corner = document.querySelector('.brand-mark');
  // the top-left corner: what is drawn at points in the rail column above the bar's foot, and left of the bar
  const at = (x, y) => { const e = document.elementFromPoint(x, y); return e ? (e.className && String(e.className).split(' ')[0]) || e.tagName : null; };
  return { bar: q(bar), barBg: bar ? getComputedStyle(bar).backgroundColor : null, plate: q(plate), plateShown: shown(plate), mark: q(mark), text: mark?.textContent.trim() ?? null,
    font: mcs ? [mcs.fontFamily, mcs.fontSize, mcs.letterSpacing, mcs.fontWeight] : null, colour: mcs?.color ?? null, sq: scs ? [scs.borderTopWidth, scs.borderTopColor, scs.backgroundColor, q(sq)] : null,
    tick: tick ? [getComputedStyle(tick).backgroundColor, getComputedStyle(tick).width, q(tick)] : null, crumb: q(crumb), cornerShown: shown(corner),
    cornerAt: [at(8, 8), at(20, 20), at(36, 30)], page: q(document.querySelector('.mode-page')), room: document.documentElement.getAttribute('data-machina2-room'), cast: document.documentElement.getAttribute('data-cast') }; })()`;
const rgb = (s) => (String(s).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map((v) => Math.round(Number(v))).join(',');
const LABEL = { cool: '230,232,234', neutral: '230,226,219' }, HAIR = { cool: '46,58,70', neutral: '51,47,42' }, BAR = { cool: '30,38,46', neutral: '32,30,27' };

export default {
  // ── THE DRAWERS: on the page as it opens (both hands), and in Build
  // PARKED 2026-11-01 (SUPERSEDED by the build's measured scope, first green look runs 41336024311 / 41336050132: this page opens in Typewriter's zoom, where the drawers overlay the enlarged page and keep today's rule - the alignment applies beside an unzoomed page, which r11-drawers / m2r5-drawers-build check). Kept verbatim under the name m2r5-drawers-v1 (not in the run list); SUCCESSOR m2r5-drawers-zoom below.
  'm2r5-drawers-v1': async (app) => { await page(app, 'm2r5-drawers'); await drawerProof(app, { name: 'M2R5-DRAWERS', say, fail }); },
  'm2r5-drawers-zoom': async (app) => { await page(app, 'm2r5-drawers-zoom'); await zoomDrawerProof(app, { name: 'M2R5-DRAWERS-ZOOM', say, fail }); },
  'm2r5-drawers-build': async (app) => { await page(app, 'm2r5-drawers-b', 'Build'); await drawerProof(app, { name: 'M2R5-DRAWERS-BUILD', say, fail }); },

  // ── THE NAMEPLATE: in both rooms and both casts, at the bar's left end, 16 px in; Plex Mono 13 px .08em; the bar's label colour, the ▢ a hairline
  // square in it (never brass), the tick in the bar's hairline colour; before the crumb, not over it; the corner mark gone; the page unmoved; the
  // mark's letters measured against the bar's own pixels (>= 7:1, a name).
  'm2r5-nameplate': async (app) => {
    await page(app, 'm2r5-plate');
    const rows = [];
    for (const c of ['cool', 'neutral']) for (const room of ['day', 'night']) {
      await cast(app, c); await setRoom(app, room); await sleep(700);
      const s = await app.evalJs(PLATE);
      const px = s.plateShown ? await pixels(app, '.machina2-nameplate') : [];
      rows.push({ c, room, s, px });
    }
    // the page is not moved by the nameplate: the same page with the nameplate (and the bar's room for it) taken away
    const withIt = await app.evalJs(PLATE);
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'm2r5-noplate'; s.textContent = '.machina2-nameplate{ display:none !important; } .chrome-top.sprint-nav{ padding-left:14px !important; }'; document.head.appendChild(s); })()"); await sleep(300);
    const without = await app.evalJs(PLATE);
    await app.evalJs("document.getElementById('m2r5-noplate')?.remove()");
    const okRow = (r) => {
      const s = r.s; if (!s.bar || !s.plate || !s.mark) return false;
      return s.plateShown && s.text === 'WRIZ' && Math.abs(s.plate.l - (s.bar.l + 16)) <= 1 && s.mark.t >= s.bar.t && s.mark.b <= s.bar.b + 0.5
        && /IBM Plex Mono/.test(s.font[0]) && s.font[1] === '13px' && Math.abs(parseFloat(s.font[2]) - 1.04) <= 0.05
        && rgb(s.colour) === LABEL[r.c] && s.sq && s.sq[0] === '1px' && rgb(s.sq[1]) === LABEL[r.c] && !/255,\s*152,\s*0/.test(s.sq[1] + s.sq[2]) && rgb(s.barBg) === BAR[r.c]
        && s.tick && rgb(s.tick[0]) === HAIR[r.c] && !!s.crumb && s.tick[2].r + 6 <= s.crumb.l && !s.cornerShown
        && r.px.length > 0 && r.px.every((x) => x.p2 >= 7);
    };
    const ok = { rows: rows.every(okRow), sameInBothRooms: ['cool', 'neutral'].every((c) => { const [d, n] = rows.filter((r) => r.c === c); return rgb(d.s.colour) === rgb(n.s.colour) && rgb(d.s.barBg) === rgb(n.s.barBg); }),
      pageStill: !!withIt.page && !!without.page && ['l', 'r', 't', 'b'].every((k) => Math.abs(withIt.page[k] - without.page[k]) <= 0.5) && Math.abs(withIt.bar.b - without.bar.b) <= 0.5 };
    const brief = { ok, rows: rows.map((r) => ({ c: r.c, room: r.room, room2: r.s.room, ok: okRow(r), plate: r.s.plate, bar: r.s.bar, crumb: r.s.crumb, font: r.s.font, colour: r.s.colour, sq: r.s.sq && r.s.sq.slice(0, 3), tick: r.s.tick && r.s.tick.slice(0, 2), corner: r.s.cornerShown, cornerAt: r.s.cornerAt, px: r.px })) };
    if (Object.values(ok).some((x) => !x)) fail('M2R5-NAMEPLATE', brief);
    say('m2r5-nameplate', brief);
  },

  // ── THE LIGHTING ROW: "Lighting ▸ Automatic · Day · Night" and a "?" that explains Automatic in one line; both measured >= 4.5:1 on their ground
  'm2r5-lighting': async (app) => {
    await page(app, 'm2r5-lighting');
    const s = await app.evalJs(`(() => { const g = document.querySelector('.machina2-bar [role="group"][aria-label="Lighting"]'); return g ? { label: g.querySelector('.machina2-bar-label')?.textContent.trim(), opts: [...g.querySelectorAll('[data-room-opt]')].map((b) => b.textContent.trim()), help: !!g.querySelector('.machina2-bar-help') } : null; })()`);
    await clickSel(app, '.machina2-bar-help'); await sleep(300);
    const line = await app.evalJs("(document.querySelector('.machina2-bar-help-line')?.textContent || '').trim()");
    const px = await pixels(app, '.machina2-bar-help, .machina2-bar-help-line');
    const ok = { row: !!s && s.label === 'Lighting' && JSON.stringify(s.opts) === '["Automatic","Day","Night"]' && s.help, oneLine: /Automatic/.test(line) && /07:00/.test(line) && /19:00/.test(line) && !/\n/.test(line),
      contrast: px.length >= 2 && px.every((x) => x.p2 >= 4.5) };
    if (Object.values(ok).some((x) => !x)) fail('M2R5-LIGHTING', { ok, s, line, px });
    say('m2r5-lighting', { ok, s, line, px });
  },

  // ── THE NEXT FILE OPEN: following the clock, a change that is waiting for the writer to stop typing lands at once when she opens another File
  'm2r5-fileopen': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'm2r5-other', text: 'Another file.', createdAt: '2026-04-02T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await page(app, 'm2r5-open');
    await app.evalJs("document.documentElement.removeAttribute('data-room')"); await sleep(300);
    const st = () => app.evalJs("({ room: document.documentElement.getAttribute('data-machina2-room'), due: document.documentElement.getAttribute('data-machina2-room-due') })");
    await app.evalJs("window.machina2Clock?.('12:00')"); await sleep(400);
    const noon = await st();
    await app.evalJs("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))");
    await app.evalJs("window.machina2Clock?.('20:00')"); await sleep(300);
    const waiting = await st();
    const t0 = Date.now();
    await app.evalJs("location.hash = '#/page/m2r5-other'");
    await app.evalJs(`new Promise((r) => { const t0 = performance.now(); const f = () => (document.documentElement.getAttribute('data-machina2-room') === 'dark' || performance.now() - t0 > 2500) ? r(true) : requestAnimationFrame(f); f(); })`);
    const ms = Date.now() - t0;
    const after = await st();
    const ok = { noon: noon.room === 'light', waits: waiting.room === 'light' && waiting.due === 'dark', landsOnOpen: after.room === 'dark' && !after.due && ms < 2000 };
    if (Object.values(ok).some((x) => !x)) fail('M2R5-FILEOPEN', { ok, noon, waiting, after, ms });
    say('m2r5-fileopen', { ok, noon, waiting, after, ms });
  },

  // ── PICTURES FOR THE WRIZORS: the bar with the nameplate, each room (both tones from the job)
  'm2r5-pic-bar-day': async (app) => { await page(app, 'm2r5-pic'); await setRoom(app, 'day'); await sleep(500); },
  'm2r5-pic-bar-night': async (app) => { await page(app, 'm2r5-pic'); await setRoom(app, 'night'); await sleep(500); },

  // ── THE NICK WALK
  // (driver fix after the first green look: Machina's default page opens in Typewriter's zoom at 1366, which keeps today's drawers; the walk
  // shows the alignment on Build, as Arbor's walk does on Draft)
  ...walkScreens('machina-walk', (app) => page(app, 'machina-walk', 'Build'), setRoom),
};
