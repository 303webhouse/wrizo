// VISUAL 2 - THE THEME PICKER'S TILES (flourish-spec.md §3, ruled by Nick Nov 26; Fable's orders, Nov 26 3:15 pm, build 3).
// The live defaults (reorg on, Arbor's and Machina's looks, Flux's redesign), real layout, a real pointer.
//   H   five tiles, two across, Arbor Machina Flux Nomad Volant; 150 tall in a 768 window, 180 from 864; all five fit without scrolling; titles centred; the current one marked
//   C   Nomad and Volant: grey, can't be opened, "Not yet available" on a readable band, no hover animation, named for a screen reader
//   L   a locked built theme is grey with the words still needed, can't be clicked, and does not play
//   O   each tile in its theme's look: Arbor walnut by night and cream by day; Machina light by day and dark with a dark page; Flux dark glass
//   A M F  the three hover homages
//   B   the flash law: never more than 3 a second, and no letter glitches without the budget's leave
//   S   reduced motion and Ambiance 0: each built tile holds its end frame
//   P N the page never moves; nothing is saved
// Run: node scripts/harness/visual-2-tiles.mjs   (from apps/desktop; dist-web built; needs a box turn on the PC)
process.env.WS_REORG = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_FLUX3 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = JSON.stringify;
const KEYS = ['arbor', 'machina', 'flux', 'nomad', 'volant'];
const NAMES = 'Arbor,Machina,Flux,Nomad,Volant';

// a signed-in answer to the unlock read, when a scenario sets one (window.__unlock); nothing else is touched
const UNLOCK = `(() => { const orig = window.fetch.bind(window); window.fetch = (u, i) => { if (String((u && u.url) || u).includes('/api/theme-unlock')) { const s = sessionStorage.getItem('vt-unlock'); if (s) return Promise.resolve(new Response(s, { status: 200, headers: { 'content-type': 'application/json' } })); } return orig(u, i); }; })();`;
const ALL_OPEN = { wordsWritten: 5000, themesOpened: {}, thresholds: { machina: 100, flux: 1000 }, open: { plateau: true, machina: true, flux: true } };
const FEW = { wordsWritten: 450, themesOpened: {}, thresholds: { machina: 100, flux: 1000 }, open: { plateau: true, machina: false, flux: false } };

// page-side readers
const PAGE = `(() => {
  const q = (s) => document.querySelector(s);
  const card = (k) => q('.wz-theme-card-' + k);
  const rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
  const rgb = (s) => (String(s).match(/[\\d.]+/g) || []).slice(0, 3).map(Number);
  const lum = (s) => { const [r, g, b] = rgb(s).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const css = (e, p, pseudo) => getComputedStyle(e, pseudo)[p];
  window.__vt = {
    layout: () => {
      const cards = [...document.querySelectorAll('.wz-theme-card')], panel = q('.wz-cascade-panel');
      return { names: cards.map((c) => c.querySelector('.wz-theme-wm')?.textContent ?? null).join(','), rects: cards.map(rect), panel: rect(panel), scroll: [panel.scrollHeight, panel.clientHeight],
        titles: cards.map((c) => { const w = c.querySelector('.wz-theme-wm'); if (!w) return null; const a = rect(c), t = rect(w.querySelector('svg') || w); return { dx: Math.abs((t.x + t.w / 2) - (a.x + a.w / 2)), dy: Math.abs((t.y + t.h / 2) - (a.y + a.h / 2)), size: parseFloat(css(w, 'fontSize')) }; }) };
    },
    mark: (k) => { const c = card(k); return { pressed: c.getAttribute('aria-pressed'), border: css(c, 'borderTopColor'), bar: css(c, 'width', '::before'), barColour: css(c, 'backgroundColor', '::before') }; },
    later: (k) => { const c = card(k); if (!c) return null; const band = c.querySelector('.wz-theme-band'), plate = c.querySelector('.wz-theme-plate');
      const fg = band && css(band, 'color'), bg = band && css(band, 'backgroundColor');
      const contrast = band ? (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05) : 0;
      return { disabled: c.disabled, locked: c.classList.contains('locked'), label: c.getAttribute('aria-label'), filter: plate && css(plate, 'filter'), band: band && band.textContent, bandSeen: !!band && rect(band).h > 0 && rect(band).b <= rect(c).b + 0.5, bandFilter: band && css(band, 'filter'), panelColour: band && bg === css(q('.wz-cascade-panel'), 'backgroundColor'), contrast, pics: plate ? plate.querySelectorAll('svg *').length : 0 };
    },
    snap: (k) => { const c = card(k); return c ? [c.outerHTML.length, ...[c, ...c.querySelectorAll('*')].map((e) => { const s = getComputedStyle(e); return s.opacity + '|' + s.transform + '|' + s.backgroundColor + '|' + s.strokeDashoffset; })].join(';') : null; },
    note: (k) => { const c = card(k); return { disabled: c.disabled, locked: c.classList.contains('locked'), note: c.querySelector('.wz-theme-note')?.textContent ?? null, filter: css(c.querySelector('.wz-theme-plate'), 'filter') }; },
    tone: (k) => { const c = card(k), p = c.querySelector('.wz-theme-plate'); return { tone: c.getAttribute('data-tone'), ground: css(p, 'backgroundColor'), lum: lum(css(p, 'backgroundColor')), wm: css(c.querySelector('.wz-theme-wm'), 'color') }; },
    arbor: () => { const c = card('arbor'), g = c.querySelector('.wz-theme-plate-grow'); if (!g) return null; const paths = [...g.querySelectorAll('path')], knots = [...g.querySelectorAll('circle')];
      const t = rect(c.querySelector('.wz-theme-wm')), box = paths.reduce((a, p) => { const r = rect(p); return { x: Math.min(a.x, r.x), y: Math.min(a.y, r.y), r: Math.max(a.r, r.r), b: Math.max(a.b, r.b) }; }, { x: 1e9, y: 1e9, r: -1e9, b: -1e9 }), a = rect(c);
      const z = (e) => { for (let n = e; n && n !== c; n = n.parentElement) { const v = getComputedStyle(n).zIndex; if (v !== 'auto') return Number(v); } return 0; };
      return { opacity: Number(css(g, 'opacity')), n: paths.length, grown: paths.filter((p) => parseFloat(getComputedStyle(p).strokeDashoffset) < 0.01).length, knots: knots.length, knotsSeen: knots.filter((k) => Number(getComputedStyle(k).opacity) > 0.9).length,
        spanW: (Math.min(box.r, a.r) - Math.max(box.x, a.x)) / a.w, spanH: (Math.min(box.b, a.b) - Math.max(box.y, a.y)) / a.h, overWord: paths.some((p) => { const r = rect(p); return r.x < t.r && r.r > t.x && r.y < t.b && r.b > t.y; }), zGrow: z(g), zWord: z(c.querySelector('.wz-theme-wm')), stroke: css(paths[0], 'stroke') };
    },
    run: () => { const c = card('machina'), units = [...c.querySelectorAll('.wz-theme-plate-run > i')], notch = c.querySelector('.wz-theme-plate-notch'), strip = c.querySelector('.wz-theme-plate-run'), closed = c.querySelector('.wz-theme-plate-closed');
      const on = units.length ? css(units[0], 'backgroundColor') : null;
      return { units: units.length, colours: [...new Set(units.map((u) => css(u, 'backgroundColor')))], filled: units.filter((u) => css(u, 'backgroundColor') === on).length, notch: notch ? (rect(notch).x + rect(notch).w / 2 - rect(strip).x) / rect(strip).w : null, notchColour: notch && css(notch, 'backgroundColor'),
        closed: closed ? { text: closed.textContent, upper: css(closed, 'textTransform'), opacity: Number(css(closed, 'opacity')), inside: rect(closed).h > 0 && rect(closed).b <= rect(c).b + 0.5 && rect(closed).x >= rect(c).x - 0.5 && rect(closed).r <= rect(c).r + 0.5 } : null };
    },
    flux: () => { const c = card('flux'), box = c.querySelector('.wz-theme-plate-check'); if (!box) return null; const units = [...box.querySelectorAll('i')];
      return { units: units.length, on: units.filter((u) => u.getAttribute('data-on') === 'true').length, text: units.map((u) => u.textContent).join(''), done: box.getAttribute('data-done'), colours: [...new Set(units.map((u) => css(u, 'backgroundColor')))], fits: units.every((u) => rect(u).x >= rect(c).x - 0.5 && rect(u).r <= rect(c).r + 0.5), brackets: c.querySelectorAll('.wz-theme-plate-bracket').length, grid: css(c.querySelector('.wz-theme-plate'), 'backgroundImage').includes('gradient'), font: css(c.querySelector('.wz-theme-wm'), 'fontFamily'), upper: css(c.querySelector('.wz-theme-wm'), 'textTransform') };
    },
    watch: () => { window.__vtGlitches = []; window.__wzVerifyFlashes = true; window.__wzFlashLog = []; const c = card('flux'); let was = new Set();
      window.__vtObs?.disconnect(); window.__vtObs = new MutationObserver(() => { const now = new Set(); c.querySelectorAll('.wz-theme-plate-check i').forEach((u, i) => { if (u.getAttribute('data-glitch') !== 'true') return; now.add(i); if (!was.has(i)) window.__vtGlitches.push({ i, t: performance.now(), ch: u.textContent, shadow: getComputedStyle(u).textShadow, on: [...c.querySelectorAll('.wz-theme-plate-check i[data-on=true]')].length }); }); was = now; });
      window.__vtObs.observe(c, { subtree: true, attributes: true, childList: true, characterData: true }); return true; },
    log: () => ({ glitches: window.__vtGlitches, flashes: window.__wzFlashLog }),
    paper: () => { const e = [...document.querySelectorAll('.mode-page')].find((x) => x.getBoundingClientRect().width > 0); return e ? J(rect(e)) : null; },
    store: () => J([localStorage, sessionStorage].map((s) => Object.keys(s).sort().map((k) => [k, s.getItem(k)]))),
    centre: (k) => { const r = rect(card(k)); return { x: r.x + r.w / 2, y: r.y + r.h * 0.3 }; },
  };
  const J = JSON.stringify;
})();`;

await withHarness(async (app) => {
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: UNLOCK });
  const ev = (js) => app.evalJs(js);
  const vt = (call) => ev(`window.__vt.${call}`);
  const soft = async (expr) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout: 9000 }); return true; } catch { return false; } };

  // a page open under a theme, with the picker open; `room` is the session's own Room choice (data-room)
  const open = async ({ theme, room = 'light', width = 1366, height = 768, unlock = ALL_OPEN, dial = null, stage = 'draft' }) => {
    await app.emulateDpr(1, width, height);
    await app.goto('/');
    await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme', ${J(theme)}); ${dial === null ? '' : `localStorage.setItem('wrizo-ambiance-dial', ${J(String(dial))});`} sessionStorage.setItem('vt-unlock', ${J(J(unlock))}); true`);
    await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
    await soft("!document.querySelector('.wz-splash')");
    await ev(`document.documentElement.setAttribute('data-room', ${J(room)}); const p = window.wrizoCreateJournalPage({ origin: 'loose', source: 'page', text: 'The coat stayed on the seat.' }); window.wrizoFlushNow(); location.hash = '#/page/' + p.id; true`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 20000 });
    await sleep(1200);
    // `draft` goes to Draft / Build (Flux's Text); `default` stays where a new page opens, Free Write or Wire In, where the wide page used to squeeze the pop-out
    if (stage === 'draft') {
      if (await ev("document.documentElement.hasAttribute('data-flux3-jacked')")) { await app.key('Escape'); await sleep(900); }
      await ev("[...document.querySelectorAll('button')].find((b) => /^(draft|build|text)$/i.test(b.textContent.trim()) && b.getBoundingClientRect().width > 0)?.click(); true");
      await sleep(1500);
    }
    await ev(PAGE);
    const before = await vt('paper()');
    await ev("document.querySelector('[data-category=\"theme\"]')?.click(); true");
    await soft("!!document.querySelector('.wz-theme-cards')");
    await sleep(900);
    return before;
  };
  const away = () => app.mouseMove(1100, 500);
  // one scenario that throws is one red check with its reason; the others still run
  const part = async (name, fn) => { try { await fn(); } catch (e) { ok(`${name}: threw`, false, String((e && e.message) || e).slice(0, 220)); } };
  const hover = async (k) => { const p = await vt(`centre(${J(k)})`); await app.mouseMove(p.x, p.y); };

  // ---------------------------------------------------------------- H, C, M1, F1, A2: the picker as it opens, in each theme
  for (const theme of ['plateau', 'machina', 'flux']) {
    for (const [width, height, tall] of [[1366, 768, 150], [1536, 864, 180]]) await part(`H ${theme} ${width}`, async () => {
      await open({ theme, width, height });
      const l = await vt('layout()');
      const xs = [...new Set(l.rects.map((r) => Math.round(r.x)))], ys = l.rects.map((r) => Math.round(r.y));
      const grid = l.rects.length === 5 && xs.length === 2 && ys[0] === ys[1] && ys[2] === ys[3] && ys[0] < ys[2] && ys[2] < ys[4] && Math.round(l.rects[4].x) === xs[0];
      ok(`H1 [${theme} ${width}]: five tiles, two across, in narrative order`, l.names === NAMES && grid, { names: l.names, xs, ys });
      ok(`H2 [${theme} ${width}x${height}]: each tile ${tall} tall and all five show without scrolling`, l.rects.length === 5 && l.rects.every((r) => Math.abs(r.h - tall) <= 0.5) && l.scroll[0] <= l.scroll[1] && l.rects.every((r) => r.b <= l.panel.b + 0.5), { h: l.rects.map((r) => r.h), scroll: l.scroll, last: l.rects.at(-1)?.b, panel: l.panel.b });
      ok(`H3 [${theme} ${width}]: titles centred, and large`, l.titles.length === 5 && l.titles.every((t) => t && t.dx <= 3 && t.dy <= 6) && l.titles.slice(0, 4).every((t, i) => t.size >= (i === 1 ? 15 : 26)), l.titles);
      if (width === 1366) {
        const m = await vt(`mark(${J(theme === 'plateau' ? 'arbor' : theme)})`);
        ok(`H4 [${theme}]: the current tile is marked (${theme === 'flux' ? 'cyan, with its orange bar on the left' : 'brass'})`, m.pressed === 'true' && (theme === 'flux' ? m.border === 'rgb(0, 194, 255)' && m.bar === '4px' : m.border !== 'rgba(0, 0, 0, 0)'), m);
        for (const k of ['nomad', 'volant']) {
          const c = await vt(`later(${J(k)})`), who = k === 'nomad' ? 'Nomad' : 'Volant';
          ok(`C1 [${theme}] ${who}: grey, can't be opened, "Not yet available" on a band in the panel's colour that reads, named for a screen reader, with its picture`,
            !!c && c.disabled && c.locked && /grayscale/.test(c.filter) && c.band === 'Not yet available' && c.bandSeen && c.bandFilter === 'none' && c.panelColour && c.contrast >= 4.5 && c.label === `${who}: not yet available` && c.pics >= 4, c);
        }
      }
    });
  }

  // ---------------------------------------------------------------- C2, C3, P, N: nothing happens on the two later tiles; the page never moves; nothing saved
  await part('C P N', async () => {
    const before = await open({ theme: 'machina' });
    const rects = [await vt('paper()')];
    const store0 = await vt('store()');
    for (const k of ['nomad', 'volant']) {
      await away(); await sleep(300);
      const a = await vt(`snap(${J(k)})`);
      await hover(k); await sleep(1500);
      const b = await vt(`snap(${J(k)})`);
      ok(`C2 ${k}: no hover animation`, !!a && a === b, { same: a === b });
      await ev(`document.querySelector('.wz-theme-card-${k}')?.click(); true`); await sleep(300);
    }
    ok('C3: clicking Nomad and Volant opens nothing', (await ev("document.documentElement.getAttribute('data-theme')")) === 'machina' && (await ev("document.querySelectorAll('.wz-theme-card').length")) === 5);
    for (const k of ['arbor', 'machina', 'flux']) { await hover(k); await sleep(900); rects.push(await vt('paper()')); }
    await away(); await sleep(500);
    ok('P1: the page never moves: opening the picker and playing every tile leaves the paper where it was', !!before && rects.every((r) => r === before), { before, rects });
    const store1 = await vt('store()');
    ok('N1: nothing is saved by hovering or by pressing a tile that can’t open', store0 === store1, { same: store0 === store1 });
  });

  // ---------------------------------------------------------------- A, M, F: the homages (all three open, Machina current)
  await part('A M F B', async () => {
    await open({ theme: 'machina' });
    await away(); await sleep(1500);
    const a0 = await vt('arbor()');
    ok('A1: at rest the grown rhizome is not there', !!a0 && a0.opacity === 0, a0);
    await hover('arbor'); await sleep(2600);
    const a = await vt('arbor()');
    ok('A2: on hover a full, messy rhizome grows across the tile and over the word "Arbor", in olive, with knots at its tips',
      !!a && a.opacity === 1 && a.n >= 24 && a.grown === a.n && a.knots >= 8 && a.knotsSeen === a.knots && a.spanW >= 0.8 && a.spanH >= 0.75 && a.overWord && a.zGrow > a.zWord && /rgb\((107, 122, 58|133, 145, 76)\)/.test(a.stroke), a);

    await away(); await sleep(1800);
    const m0 = await vt('run()');
    ok('M1: at rest the Run stands at 6 of 20, the brass notch on the seventh, no "RUN CLOSED"', m0.units === 20 && m0.filled === 6 && !m0.colours.includes('rgb(255, 152, 0)') && Math.abs(m0.notch - 6 / 20) < 0.04 && !!m0.closed && m0.closed.opacity === 0, m0);
    await hover('machina'); await sleep(2600);
    const m1 = await vt('run()');
    ok('M2: on hover the Run fills to its close, turns brass as the real Run does, the notch travels to the end, and "RUN CLOSED" appears', m1.filled === 20 && m1.colours.length === 1 && m1.colours[0] === 'rgb(255, 152, 0)' && m1.notch > 0.95 && m1.notchColour === 'rgb(255, 152, 0)' && !!m1.closed && m1.closed.opacity === 1 && /^run closed$/i.test(m1.closed.text) && m1.closed.upper === 'uppercase' && m1.closed.inside, m1);

    await away(); await sleep(900);
    const f0 = await vt('flux()');
    ok('F1: the Flux tile: dark glass with a faint grid, two corner brackets, FLUX in Silkscreen, ten empty units at rest', !!f0 && f0.units === 10 && f0.on === 0 && f0.fits && f0.brackets === 2 && f0.grid && /Silkscreen/.test(f0.font) && f0.upper === 'uppercase', f0);
    await vt('watch()');
    await hover('flux');
    const seen = [];
    for (let i = 0; i < 60; i += 1) { const s = await vt('flux()'); seen.push(s ? s.on : -1); if (s && s.done === 'true') break; await sleep(100); }
    const steps = seen.every((v, i) => i === 0 || (v >= seen[i - 1] && v - seen[i - 1] <= 1));
    ok('F2: on hover CHECKPOINT fills one letter at a time', steps && new Set(seen).size >= 9 && seen.at(-1) === 10, seen);
    await sleep(500);
    const end = await vt('flux()');
    ok('F3: at the end every unit turns orange and reads CHECKPOINT', !!end && end.on === 10 && end.text.toUpperCase() === 'CHECKPOINT' && end.done === 'true' && end.colours.length === 1 && end.colours[0] === 'rgb(255, 152, 0)', end);
    const log = await vt('log()');
    const code = /^[01#%&$@/\\<>=+*]$/;
    ok('F4: the newest letter glitches to code with a 2 px colour split, then resolves', log.glitches.length >= 5 && log.glitches.every((g) => code.test(g.ch) && g.i === g.on - 1 && /(^|[ ,])-?2px 0px/.test(g.shadow)), { n: log.glitches.length, first: log.glitches.slice(0, 3) });
    const grants = log.flashes.filter((f) => f.ok).map((f) => f.t);
    const worst = Math.max(0, ...grants.map((t) => grants.filter((u) => u >= t && u < t + 1000).length));
    const asked = log.flashes.filter((f) => f.ok && f.kind === 'theme-picker-flux').length;
    ok('B1: the flash law: no letter glitches without the budget’s leave, and never more than 3 a second', asked >= 1 && log.glitches.length <= asked && worst <= 3, { glitches: log.glitches.length, asked, worst });
    await away(); await sleep(600);
    const rest = await vt('flux()');
    ok('F5: she moves away and the tile is at rest again', !!rest && rest.on === 0 && rest.done !== 'true', rest);
  });

  // ---------------------------------------------------------------- L: locked built themes (Arbor current; 450 words written)
  await part('L', async () => {
    await open({ theme: 'plateau', unlock: FEW });
    const m = await vt("note('machina')"), f = await vt("note('flux')");
    ok('L1: a locked theme is grey, says the words still needed, and can’t be clicked', f.disabled && f.locked && /grayscale/.test(f.filter) && f.note === '550 more words to open Flux' && m.disabled && m.locked, { m, f });
    await hover('machina'); await sleep(2000);
    const r = await vt('run()');
    await hover('flux'); await sleep(1500);
    const x = await vt('flux()');
    ok('L2: a locked tile does not play', r.filled === 6 && !!r.closed && r.closed.opacity === 0 && !!x && x.on === 0, { r, x });
  });

  // ---------------------------------------------------------------- O: each tile in its theme's look
  await part('O', async () => {
    await open({ theme: 'plateau', room: 'dark' });
    const night = { a: await vt("tone('arbor')"), m: await vt("tone('machina')"), f: await vt("tone('flux')") };
    ok('O1: by night: Arbor walnut with cream lettering; Machina dark; Flux dark glass', night.a.tone === 'dark' && night.a.lum < 0.06 && night.a.wm === 'rgb(239, 228, 203)' && night.m.tone === 'dark' && night.m.lum < 0.06 && night.f.lum < 0.06, night);
    await open({ theme: 'plateau', room: 'light' });
    const day = { a: await vt("tone('arbor')"), m: await vt("tone('machina')"), f: await vt("tone('flux')") };
    ok('O2: by day: Arbor cream with olive-dark lettering; Machina light; Flux still dark', day.a.tone === 'light' && day.a.lum > 0.7 && day.a.wm === 'rgb(51, 64, 31)' && day.m.tone === 'light' && day.m.lum > 0.7 && day.f.lum < 0.06, day);
    await open({ theme: 'machina', room: 'light' });
    const light = await vt("tone('machina')");
    await ev("[...document.querySelectorAll('.wz-theme-picker-field .mode-seg button')].find((b) => b.textContent.trim() === 'Dark')?.click(); true");
    await sleep(500);
    const dark = await vt("tone('machina')");
    ok('O3: Machina’s tile is light by day, and dark as soon as she picks a dark page', light.tone === 'light' && light.lum > 0.7 && dark.tone === 'dark' && dark.lum < 0.06, { light, dark });
  });

  // ---------------------------------------------------------------- W: Free Write and Wire In, where the wide page used to leave the pop-out 83 px (Fable, Nov 26: it keeps 300 there, over the page; the page never moves)
  for (const [theme, width, height] of [['plateau', 1366, 768], ['flux', 1366, 768], ['plateau', 1536, 864], ['flux', 1536, 864]]) await part(`W ${theme} ${width}`, async () => {
    const before = await open({ theme, width, height, stage: 'default' });
    const l = await vt('layout()');
    const after = await vt('paper()');
    ok(`W1 [${theme === 'flux' ? 'Flux, Wire In' : 'Arbor, Free Write'} ${width}]: the Theme pop-out keeps its 300 px, the tiles read, all five show, and the paper has not moved`,
      Math.abs(l.panel.w - 300) <= 1 && l.rects.length === 5 && l.rects.every((r) => r.w >= 120 && r.b <= l.panel.b + 0.5) && !!before && before === after, { panel: l.panel.w, tiles: l.rects.map((r) => Math.round(r.w)), same: before === after });
  });
  await part('W2', async () => {
    await open({ theme: 'plateau' });
    const g = await ev("(() => { const p = document.querySelector('.wz-cascade-panel').getBoundingClientRect(), grip = [...document.querySelectorAll('.wz-sliver-grip')].find((e) => e.getBoundingClientRect().width > 0); return { right: p.right, width: p.width, grip: grip ? grip.getBoundingClientRect().left : null }; })()");
    ok('W2: in Draft at 1366, where there is room for the tiles, the pop-out still stops before the page’s left opener, as before', g.grip != null && g.right <= g.grip + 0.5 && g.width >= 260, g);
  });

  // ---------------------------------------------------------------- S: still frames
  for (const still of ['reduced motion', 'Ambiance 0']) await part(`S ${still}`, async () => {
    if (still === 'reduced motion') await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await open({ theme: 'machina', dial: still === 'Ambiance 0' ? 0 : null });
    await away(); await vt('watch()'); await sleep(1500);
    const a = await vt('arbor()'), m = await vt('run()'), f = await vt('flux()');
    await hover('machina'); await sleep(200);
    const mh = await vt('run()');
    await hover('flux'); await sleep(1200);
    const f2 = await vt('flux()'), log = await vt('log()');
    ok(`S1 [${still}]: Arbor holds its end frame: the rhizome grown, knots and all`, !!a && a.opacity === 1 && a.grown === a.n && a.knotsSeen === a.knots, a);
    ok(`S2 [${still}]: Machina holds its end frame: the Run full and brass, the notch at the end, "RUN CLOSED", under the pointer too`, m.filled === 20 && [m, mh].every((x) => x.colours.length === 1 && x.colours[0] === 'rgb(255, 152, 0)') && m.notch > 0.95 && !!m.closed && m.closed.opacity === 1, m);
    ok(`S3 [${still}]: Flux holds its end frame, all orange, and never glitches`, !!f && !!f2 && f.on === 10 && f.done === 'true' && f2.on === 10 && f2.done === 'true' && log.glitches.length === 0 && log.flashes.length === 0, { f, f2, glitches: log.glitches.length, flashes: log.flashes.length });
    if (still === 'reduced motion') await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  });
  return checks;
});

const pass = checks.length > 0 && checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail.slice(0, 600)}`);
// the suite prints only this line, so it names what failed and gives the first reason (a throw before anything else)
const bad = checks.filter((c) => !c.pass);
const why = bad.find((c) => c.name.endsWith(': threw')) || bad[0];
const codes = [...new Set(bad.map((c) => c.name.split(/[ :]/)[0]))].join(' ');
console.log(pass ? `\nVISUAL 2 TILES VERIFY: PASS (${checks.length} checks)` : `\nVISUAL 2 TILES VERIFY: FAIL - ${bad.length}/${checks.length} failed: ${codes} | ${why ? `${why.name.slice(0, 40)} ${why.detail.slice(0, 220)}`.replace(/\s+/g, ' ') : 'no checks ran'}`);
process.exit(pass ? 0 : 1);
