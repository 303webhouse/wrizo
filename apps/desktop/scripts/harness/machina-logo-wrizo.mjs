// MACHINA'S MARK IS WRIZO (Nick, Nov 21, via Fable 1:30 pm: "the logo in the top left corner was made for the mockup" - the mockup's mark,
// cursor/reorg-prototype docs/mockups/reorg/reorg.css 45-52 and NOT-RULED.md 26/40: "WRIZO", Plex Sans 500 13px, letter-spacing .26em, left
// padding making up the trailing spacing, a brass notch, no lines above or below). Under Machina's look the mark that is drawn - the corner mark,
// or the nameplate in the bar while a bar is on screen - reads WRIZO with no line above, below or beside it; the notch is 6 x 2 px at 1366, brass,
// centred on the O's INKED middle (the rendered glyph's box, not its letter cell); it still recedes while she types. The light room keeps the
// notch's 1 px ink edge (#23272B, as the Run's notch has) where the mark sits on the room's light ground.
//
// The fixture (seams only): Machina booted from storage with its look on (WS_MACHINA2=default), a loose page; 1366x768. The room is set with the
// look's own harness clock (window.machina2Clock: 12:00 Day, 23:00 Night). Two surfaces: the page (the flush bar is on screen, so the mark is the
// bar's nameplate) and the same page under the reorg (?reorg=1: the reorg's top rail, so the mark is the corner mark).
//
// PREMISE P0  the page draws the bar's nameplate (data-machina2-dots 'in') and the reorg page draws the corner mark (no bar), in both rooms
// WORD    W1  [room/surface] the mark reads WRIZO, in Plex Sans 500 at 13 px with .26em letter-spacing
// NOTCH   W2  [room/surface] one notch: brass, 6 x 2 px, under the O, its centre within 0.5 px of the O's inked centre (the glyph's own box, measured
//             from the font's ink: canvas measureText at the O's computed font, from the O's origin in the line)
// LINES   W3  [room/surface] nothing else is drawn with the mark: no element or pseudo-element with a border, no hairline or tick (a box 2 px or less
//             across and more than 3 px long), and no square
// EDGE    W5  the corner mark's notch wears the 1 px ink edge on both sides in the Day room (its light ground), and none in the Night room
// RECEDE  W4  while she types the mark recedes (opacity 0), on the page and under the reorg
// MUTANTS MUT-W2  the same reading with the notch moved 1 px turns W2's test red    MUT-W3  the same reading with a tick added turns W3's test red
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/machina-logo-wrizo.mjs
process.env.WS_MACHINA2 = process.env.WS_MACHINA2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const INK = 'rgb(35, 39, 43)';
const PAGE = 'mlw-page';

// the mark that is drawn: the bar's nameplate while a bar is on screen, else the corner mark; everything it draws, read in one task
const MARK = `(() => { const root = document.documentElement; const dots = root.getAttribute('data-machina2-dots') === 'in';
  const host = dots ? document.querySelector('.machina2-nameplate') : document.querySelector('.brand-mark');
  const out = { dots, room: root.getAttribute('data-machina2-room'), look: root.getAttribute('data-machina2'), host: host ? host.className : null };
  if (!host) return out;
  const tmp = document.createElement('i'); tmp.style.color = getComputedStyle(root).getPropertyValue('--brass').trim() || 'transparent'; document.body.appendChild(tmp); const brass = getComputedStyle(tmp).color; tmp.remove();
  const pseudo = (el, p) => { const s = getComputedStyle(el, p); const c = s.content; return { content: c, border: ['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(s['border' + k + 'Width']) > 0 && s['border' + k + 'Style'] !== 'none'), w: s.width, h: s.height, bg: s.backgroundColor }; };
  const words = [pseudo(host, '::before').content, (host.textContent || '').trim()].map((c) => (c && c !== 'none' && c !== 'normal' ? c.replace(/^"|"$/g, '') : '')).join('');
  const els = [host, ...host.querySelectorAll('*')];
  const notches = [], lines = [];
  for (const el of els) {
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const bordered = ['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(s['border' + k + 'Width']) > 0 && s['border' + k + 'Style'] !== 'none');
    if (el !== host && s.backgroundColor === brass && r.height > 0 && r.height <= 3 && r.width <= 10) { notches.push({ l: r.left, t: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, shadow: s.boxShadow }); continue; }
    if (bordered) lines.push({ el: el.className || el.tagName, border: true });
    else if (el !== host && r.width > 0 && r.height > 0 && ((r.width <= 2 && r.height > 3) || (r.height <= 2 && r.width > 3)) && s.backgroundColor !== 'rgba(0, 0, 0, 0)') lines.push({ el: el.className || el.tagName, w: r.width, h: r.height });
    for (const p of ['::before', '::after']) { const ps = pseudo(el, p); if (ps.content && ps.content !== 'none' && ps.content !== 'normal' && (ps.border || (ps.bg && ps.bg !== 'rgba(0, 0, 0, 0)'))) lines.push({ el: (el.className || el.tagName) + p, border: ps.border, w: ps.w, h: ps.h }); }
  }
  // the O: the last letter O in the mark's text, its origin from a one-letter range, its ink from the font (canvas measureText at its computed font)
  let o = null;
  const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let n, on = null, oi = -1;
  while ((n = tw.nextNode())) { const i = n.textContent.lastIndexOf('O'); if (i >= 0) { on = n; oi = i; } }
  if (on) {
    const rg = document.createRange(); rg.setStart(on, oi); rg.setEnd(on, oi + 1); const rr = rg.getBoundingClientRect();
    const f = getComputedStyle(on.parentElement); const cx = document.createElement('canvas').getContext('2d');
    cx.font = f.fontStyle + ' ' + f.fontWeight + ' ' + f.fontSize + ' ' + f.fontFamily; const m = cx.measureText('O');
    o = { origin: rr.left, inkL: rr.left - m.actualBoundingBoxLeft, inkR: rr.left + m.actualBoundingBoxRight, inkCx: rr.left + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
      base: rr.bottom, font: cx.font, family: f.fontFamily, weight: f.fontWeight, size: f.fontSize, spacing: f.letterSpacing, fontReady: document.fonts.check(cx.font) };
  }
  // the word's own spacing: the element that holds the W (the O's own box carries no spacing after it, by design)
  let wsp = null; { const tw2 = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let n2; while ((n2 = tw2.nextNode())) { if (n2.textContent.includes('W')) { wsp = getComputedStyle(n2.parentElement).letterSpacing; break; } } }
  const hs = getComputedStyle(host);
  return { ...out, words, opacity: hs.opacity, brass, notches, lines, o, wsp }; })()`;

const w1b = (m) => !!m && m.words === 'WRIZO' && !!m.o && /IBM Plex Sans/.test(m.o.family) && !/Mono/.test(m.o.family) && m.o.weight === '500' && m.o.size === '13px' && Math.abs(parseFloat(m.wsp) - 13 * 0.26) <= 0.05;
const w1 = (m) => !!m && m.words === 'WRIZO' && !!m.o && /IBM Plex Sans/.test(m.o.family) && !/Mono/.test(m.o.family) && m.o.weight === '500' && m.o.size === '13px' && Math.abs(parseFloat(m.o.spacing) - 13 * 0.26) <= 0.05;
const w2 = (m) => !!m && !!m.o && m.notches.length === 1 && Math.abs(m.notches[0].w - 6) <= 0.01 && Math.abs(m.notches[0].h - 2) <= 0.01 && m.notches[0].t >= m.o.base - 4 && Math.abs(m.notches[0].cx - m.o.inkCx) <= 0.5;
const w3 = (m) => !!m && !!m.host && m.lines.length === 0;
const edged = (s) => !!s && s.includes(`${INK} -1px 0px 0px`) && s.includes(`${INK} 1px 0px 0px`);

async function boot(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null"); await sleep(600);
  await app.evalJs(`!!window.wrizoCreateJournalPage(${J({ id: PAGE, text: 'The mill stood at the river.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  await app.evalJs("localStorage.setItem('wrizo-theme', 'machina'); null");
}
async function visit(app, reorg) {
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1' : '/'}#/page/${PAGE}'); null`);
  await app.reload();
  await app.waitFor("document.documentElement.getAttribute('data-machina2') === 'true' && !!document.querySelector('.forward-only-editor')", { label: `Machina's look on the page${reorg ? ' (reorg)' : ''}`, timeout: 20000 }).catch(() => {});
  await app.evalJs('document.fonts && document.fonts.ready.then(() => true)');
  await sleep(900);
}
// FIXTURE (Nov 21, before this file's first green; build 11cfd7db, Actions 44946844167): the reorg page draws the bar's nameplate too (data-machina2-dots 'in'), so the CORNER mark is read where no bar is on screen:
// the Drawers screen. The loop's second surface is that screen. No assertion changes to W2 and W3 (their readings are the same reading, of the mark drawn).
async function visitCorner(app) {
  await app.evalJs("history.replaceState(null, '', '/#/drawers'); null");
  await app.reload();
  await app.waitFor("document.documentElement.getAttribute('data-machina2') === 'true' && !!document.querySelector('.brand-mark') && document.documentElement.getAttribute('data-machina2-dots') !== 'in'", { label: 'the Drawers screen, its corner mark', timeout: 20000 }).catch(() => {});
  await app.evalJs('document.fonts && document.fonts.ready.then(() => true)');
  await sleep(900);
}
async function room(app, clock) {
  await app.evalJs(`window.machina2Clock ? window.machina2Clock(${J(clock)}) : null`);
  await sleep(500);
}

await withHarness(async (app) => {
  await boot(app);
  const seen = {};
  for (const [surface, reorg] of [['page', false], ['drawers', null]]) {
    if (reorg === null) await visitCorner(app); else await visit(app, reorg);
    for (const [name, clock] of [['Day', '12:00'], ['Night', '23:00']]) {
      await room(app, clock);
      seen[`${name}/${surface}`] = await app.evalJs(MARK);
    }
  }
  // SUPERSEDED (Nov 21, before this file's first green; build 11cfd7db, Actions 44946844167): P0's premise, "the reorg page draws the corner mark", is false - under the look the reorg page has the bar too, so its mark is the
  // nameplate. P0-B reads the corner mark where no bar is on screen (the Drawers screen). Verbatim:
  // ok('P0 the page draws the bar\'s nameplate and the reorg page draws the corner mark, in both rooms (Day = light, Night = dark)',
  //   ['Day', 'Night'].every((r) => seen[`${r}/page`] && seen[`${r}/page`].dots && seen[`${r}/reorg`] && !seen[`${r}/reorg`].dots)
  //   && seen['Day/page'].room === 'light' && seen['Night/page'].room === 'dark' && seen['Day/reorg'].room === 'light' && seen['Night/reorg'].room === 'dark',
  //   Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v && { dots: v.dots, room: v.room, host: v.host }])));
  ok('P0-B the page draws the bar\'s nameplate and the Drawers screen (no bar) draws the corner mark, in both rooms (Day = light, Night = dark)',
    ['Day', 'Night'].every((r) => seen[`${r}/page`] && seen[`${r}/page`].dots && seen[`${r}/drawers`] && !seen[`${r}/drawers`].dots && /brand-mark/.test(seen[`${r}/drawers`].host || ''))
    && seen['Day/page'].room === 'light' && seen['Night/page'].room === 'dark' && seen['Day/drawers'].room === 'light' && seen['Night/drawers'].room === 'dark',
    Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v && { dots: v.dots, room: v.room, host: v.host }])));
  for (const k of Object.keys(seen)) {
    const m = seen[k];
    // SUPERSEDED (Nov 21, before this file's first green; build 11cfd7db, Actions 44946844167): W1 read the letter-spacing on the O's own element, which by design carries none (its spacing moves to its margin so its
    // box is the glyph's). W1-B reads the word's spacing on the element that holds the W. Verbatim:
    //   ok(`W1 [${k}] the mark reads WRIZO in Plex Sans 500 at 13 px, .26em apart ("${m && m.words}", ${m && m.o && `${m.o.family} ${m.o.weight} ${m.o.size} ${m.o.spacing}`})`, w1(m), m && { words: m.words, o: m.o });
    ok(`W1-B [${k}] the mark reads WRIZO in Plex Sans 500 at 13 px, its letters .26em apart ("${m && m.words}", ${m && m.o && `${m.o.family} ${m.o.weight} ${m.o.size}`}, ${m && m.wsp})`, w1b(m), m && { words: m.words, o: m.o, wsp: m.wsp });
    ok(`W2 [${k}] one notch, brass, 6 x 2 px, under the O, its centre within 0.5 px of the O's inked centre (${m && m.notches.length} notch, ${m && m.notches[0] && m.o ? (m.notches[0].cx - m.o.inkCx).toFixed(2) + ' px off' : 'n/a'})`, w2(m), m && { notches: m.notches, o: m.o, brass: m.brass });
    ok(`W3 [${k}] no line above, below or beside the mark: no border, hairline, tick or square (${m && m.lines.length} found)`, w3(m), m && m.lines);
  }
  // SUPERSEDED (Nov 21, before this file's first green; build 11cfd7db, Actions 44946844167): W5 read the corner mark on the reorg page, which draws the nameplate (P0's false premise). W5-B reads it on the Drawers screen. Verbatim:
  // const dayC = seen['Day/reorg'], nightC = seen['Night/reorg'];
  // ok('W5 the corner mark\'s notch wears the 1 px ink edge on both sides in the Day room, and none in the Night room',
  //   !!dayC && dayC.notches.length === 1 && edged(dayC.notches[0].shadow) && !!nightC && nightC.notches.length === 1 && !(nightC.notches[0].shadow || '').includes(INK), { day: dayC && dayC.notches, night: nightC && nightC.notches });
  const w5b = (d, n) => !!d && /brand-mark/.test(d.host || '') && d.notches.length === 1 && edged(d.notches[0].shadow) && !!n && n.notches.length === 1 && !(n.notches[0].shadow || '').includes(INK);
  const dayD = seen['Day/drawers'], nightD = seen['Night/drawers'];
  ok('W5-B the corner mark\'s notch wears the 1 px ink edge on both sides in the Day room, and none in the Night room', w5b(dayD, nightD), { day: dayD && dayD.notches, night: nightD && nightD.notches });
  // MUT-W5-B: the Day reading without its edge turns W5-B red; MUT-W1-B: the reading with the word's spacing gone turns W1-B red (the mutants LANDED)
  const flat = dayD && dayD.notches.length ? { ...dayD, notches: [{ ...dayD.notches[0], shadow: 'none' }] } : null;
  ok('MUT-W5-B the Day corner reading without its ink edge turns W5-B red', !!flat && flat.notches[0].shadow !== dayD.notches[0].shadow && !w5b(flat, nightD), flat && flat.notches);
  const unspaced = seen['Night/page'] ? { ...seen['Night/page'], wsp: 'normal' } : null;
  ok('MUT-W1-B the reading with the word\'s spacing gone turns W1-B red', !!unspaced && unspaced.wsp !== seen['Night/page'].wsp && !w1b(unspaced), unspaced && unspaced.wsp);
  // MUTANTS on the readings (the mutant LANDED: the reading changed)
  const base = seen['Night/page'];
  const moved = base && base.notches.length ? { ...base, notches: [{ ...base.notches[0], cx: base.notches[0].cx + 1 }] } : null;
  ok('MUT-W2 the same reading with the notch moved 1 px turns W2\'s test red', !!moved && moved.notches[0].cx !== base.notches[0].cx && !w2(moved), moved && moved.notches);
  const ticked = base ? { ...base, lines: [...base.lines, { el: 'tick', w: 1, h: 14 }] } : null;
  ok('MUT-W3 the same reading with a tick added turns W3\'s test red', !!ticked && ticked.lines.length === base.lines.length + 1 && !w3(ticked), ticked && ticked.lines);

  // RECEDE (last: typing holds a room change back, so the rooms are read first)
  const recede = {};
  for (const [surface, reorg] of [['page', false], ['reorg', true]]) {
    await visit(app, reorg);
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null"); await sleep(200);
    await app.type(' And the wheel turned.');
    // FIXTURE (Nov 21, before this file's first green; build 11cfd7db, Actions 44946844167): the recede is a fade (--fade-dur), read at 1.8 s it was still at .09; the reading now waits for the fade to end (up to 6 s). No assertion changes.
    await app.waitFor("(() => { const r = document.documentElement; const h = r.getAttribute('data-machina2-dots') === 'in' ? document.querySelector('.machina2-nameplate') : document.querySelector('.brand-mark'); return !!h && getComputedStyle(h).opacity === '0'; })()", { label: 'the mark receded', timeout: 6000 }).catch(() => {});
    await sleep(300);
    const m = await app.evalJs(MARK);
    recede[surface] = { writing: await app.evalJs("document.documentElement.getAttribute('data-wz-writing')"), opacity: m && m.opacity, host: m && m.host };
  }
  ok('W4 while she types the mark recedes (opacity 0), on the page and under the reorg', ['page', 'reorg'].every((s) => recede[s].host && recede[s].opacity === '0'), recede);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 19;   // 17 - P0, W1 x4, W5 (parked before the first green) + P0-B, W1-B x4, W5-B + MUT-W5-B + MUT-W1-B (Nov 21)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nMACHINA-LOGO-WRIZO VERIFY: PASS (${checks.length} checks)`
  : `\nMACHINA-LOGO-WRIZO VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
