// MACHINA v2 MOCKUP, ROUND r10 - THE ZOOMED PAGE STAYS PAPER TO ITS EDGES, as named screens for INK's frames job (-f themes=machina
// -f screens_file=apps/desktop/scripts/frames/machina2-r10.mjs). Source: the Wrizors' r9 review (wrizors-to-ARBOR-nov4c.md md5 13e5db96): "Page:
// Dark fades to near-white at its top and bottom, so the words sit on grey (far under 13.9:1). The whole page rect must be dark (or the fade must
// run toward the dark paper)"; Fable, Nov 4: "fix it in Machina r10. The fade must go to the PAGE's colour (likely main's bug #36); measure the
// page text through it." Run in both page tones (the job's light / dark): the dark one is the Wrizors' case.
//   m2r10-fade-paper  on the zoomed page (Sprint), the sheet behind the column is the visible page's box and the page's own colour; at points in
//                     the band mask's top and bottom fades the ground under the column is that paper (never the room); the page's text measures
//                     >= 13.9:1 against what is under it there; the zoom's own band mask still stands; the sheet is decorative (no pointer,
//                     hidden from screen readers, not printed).
// Every check THROWS with its numbers when it fails and prints them when it passes ("MACHINA2-R10 <screen> {...}"); the kit's verdict guard reds
// a crash or a silent check. Written red-first: run against r9 rebased (before the r10 build).
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`MACHINA2-R10 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`MACHINA2-R10-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const TEXT = 'The quarterly figures show a steady rise in exports. The tariff change explains part of it, but not all. The second paragraph names the evidence: shipping records for March and April.';
const openPage = async (app, id) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await app.evalJs(`history.replaceState(null, '', '/?machina2=1#/page/${id}')`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-machina2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page' }); await sleep(1200);
  await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()");
};
const parse = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };

const READ = `(() => { const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
  const col = document.querySelector(".desk-frame-stage .mode-pagecol[data-zoom='true']"), page = col && col.querySelector('.mode-page'), sheet = document.querySelector('.machina2-sheet');
  if (!col || !page) return { zoom: !!col };
  const a = box(page), c = box(col); let foot = innerHeight;
  document.querySelectorAll('.machina2-run, .mode-progress').forEach((el) => { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && r.top > a.t + 40 && r.left < a.r && r.right > a.l) foot = Math.min(foot, r.top); });
  const vis = { l: Math.max(a.l, c.l, 0), t: Math.max(a.t, c.t, 0), r: Math.min(a.r, c.r, innerWidth), b: Math.min(a.b, c.b, foot) };
  // what lies UNDER the column (the column's own paint left out): at the fades' points, the topmost painted box below it
  // (elementsFromPoint skips a box that takes no pointer - the sheet, by design - so a displayed sheet under the point is read by its rect first)
  const under = (x, y) => { if (sheet) { const q = sheet.getBoundingClientRect(), cs = getComputedStyle(sheet); if (cs.display !== 'none' && x >= q.left && x <= q.right && y >= q.top && y <= q.bottom) return { cls: 'machina2-sheet', bg: cs.backgroundColor }; } const st = document.elementsFromPoint(x, y); for (const e of st) { if (col.contains(e) || e === col) continue; const cs = getComputedStyle(e); if (cs.backgroundColor && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(cs.backgroundColor)) return { cls: (e.className && e.className.baseVal == null ? e.className : '').toString().split(' ')[0] || e.tagName, bg: cs.backgroundColor }; } return { cls: 'none', bg: getComputedStyle(document.body).backgroundColor }; };
  const sh = sheet && getComputedStyle(sheet);
  const mx = (vis.l + vis.r) / 2;
  return { zoom: true, page: a, col: c, vis, paper: getComputedStyle(page).backgroundColor, ink: getComputedStyle(document.querySelector('.forward-only-editor')).color,
    mask: getComputedStyle(col).maskImage || getComputedStyle(col).webkitMaskImage,
    sheet: sheet ? { r: box(sheet), bg: sh.backgroundColor, pe: sh.pointerEvents, aria: sheet.getAttribute('aria-hidden'), display: sh.display } : null,
    top: under(mx, vis.t + 12), mid: under(mx, (vis.t + vis.b) / 2), bottom: under(mx, vis.b - 12), tone: document.documentElement.getAttribute('data-page') }; })()`;

const screens = {
  'm2r10-fade-paper': async (app) => {
    await openPage(app, 'm2r10-fade');
    const d = await app.evalJs(READ);
    if (!d.zoom) fail('M2R10-FADE-PAPER', { zoom: false, note: 'the page did not open zoomed (Sprint)' });
    await app.cdp('Emulation.setEmulatedMedia', { media: 'print' }); await sleep(200);
    const print = await app.evalJs("(() => { const s = document.querySelector('.machina2-sheet'); return s ? getComputedStyle(s).display : 'absent'; })()");
    await app.cdp('Emulation.setEmulatedMedia', { media: '' }); await sleep(200);
    const paper = parse(d.paper), ink = parse(d.ink);
    const grounds = [d.top, d.mid, d.bottom].map((u) => parse(u.bg));
    const worst = grounds.every(Boolean) && ink ? Math.min(...grounds.map((g) => ratio(ink, g))) : null;
    const ok = {
      sheet: !!d.sheet && d.sheet.display !== 'none' && ['l', 't', 'r', 'b'].every((k) => Math.abs(d.sheet.r[k] - d.vis[k]) <= 1) && d.sheet.bg === d.paper,
      fadesOnPaper: [d.top, d.mid, d.bottom].every((u) => u.bg === d.paper),
      textHolds: worst != null && worst >= 13.9,
      maskStands: /gradient/.test(String(d.mask)),
      decorative: !!d.sheet && d.sheet.pe === 'none' && d.sheet.aria === 'true' && (print === 'none' || print === 'absent'),
    };
    const brief = { ok, tone: d.tone, paper: d.paper, ink: d.ink, worst, top: d.top, mid: d.mid, bottom: d.bottom, sheet: d.sheet, vis: d.vis, print };
    if (Object.values(ok).some((x) => !x)) fail('M2R10-FADE-PAPER', brief);
    say('m2r10-fade-paper', brief);
  },
  'm2r10-pic-fade': async (app) => { await openPage(app, 'm2r10-pic'); await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.machina2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); return true; })()"); await sleep(300); },
};

export default guarded(screens, { verdict: ['MACHINA2-R10'] });
