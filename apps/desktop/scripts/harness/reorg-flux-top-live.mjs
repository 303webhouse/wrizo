// FLUX'S TOP BAR ON THE REORG (claude/wrizors/flux-reorg-spec.md sections 0, 3, 6, 10 and 11; Fable, Nov 22 9:20 pm and 10:10 pm; plan: claude/flux-live-plan.md).
// The reorg's top bar in the redesign's dress, behind INK's gate: flux.top is off until the Wrizors pass the frames, so it is seen through the preview door
// (?reorg=1&flux3=1&reorglift=flux.top). The colour slots are POLISH's tokens (styles/24-reorg-flux-tags.css).
//
// The fixture (seams only): a Drive "Fiction" holding a set "The Mill" of three Tracks ft-1 .. ft-3 (the second named "Second morning") and a Circuit ft-c that serves no Doc; 1366x768.
//
// GATE    T0  the reorg's top bar stands in Flux with the redesign, the switch and the door, and not without the door, nor the redesign, nor the switch
// CRUMB   T1  on Track 2 the bar reads, left to right: FICTION ▸ THE MILL // [03] SECOND MORNING TRK 2/3 (spec 3: DRIVE ▸ DOC // TRACK, then the readout)
//         T2  the three names are letter-spaced capitals and no bare buttons, and the bar holds one row (names, stages and search door on one line inside it)
//         MUT-T2  the same reading with a browser button face on a name turns T2's test red
//         T3  (spec 10) as painted on the bar: the names 7:1 or better, the TRK readout 4.5:1 or better
// TAGS    T4  (spec 6, 11 rule 2) every slot a-f draws as its bracketed code [01]..[06] with a 3 px left bar in its signal and NO chip (no fill); the code in the signal holds
//             4.5:1 on the bar's painted ground, the bar 3:1
//         MUT-T4  the same reading with a filled chip turns T4's test red
//         T4-B / MUT-T4-B  [T4 and its mutant parked Nov 23: spec 11 rule 2, "Beside its bar on the panel, the code is text-hi"; T4 asserted the code in the signal] the code is text-hi #E7F4F1
//         T5  (spec 6) her own colour draws as its bar with the code [##]
// STAGES  T6  (spec 3) the strip reads WIRE IN · TEXT · PATCH · UPLINK with CIRCUITS → after it; the current one has the cyan underline and the 3 x 24 brass bar, no other stage has the bar
//         T7  (spec 11 rule 3) a hovered stage is never brass, and the current one keeps its bar
//         T8  (spec 3, 11 rule 4) in WIRE IN, TEXT, PATCH and UPLINK the bar keeps ONE row and one height (within 0.5 px)
//         MUT-T8  the Uplink reading with the bar 41 px taller turns T8's test red
// PAGE    T9  (law 1) the page (column and paper) keeps its rect in TEXT, PATCH and UPLINK (Wire In is the ruled Typewriter exception, so it is not compared)
// CIRCUIT T10 (spec 3) on a Circuit with no Doc the bar reads "Circuit · no doc yet", Connect Docs stands before the views, and the views are WORDS (LIVE, SEQUENCE and STACK among them);
//             its height is the Doc's bar (within 0.5 px), on one row
//         T11 (spec 0, 11 rule 3) the chosen view has the 3 x 24 brass bar; a hovered view is not brass
// SEARCH  T12 (spec 3) the search door is an icon in the strip's command style (a 1 px #5F8F95 edge, no word drawn), "Search" on hover
// MACHINA T13 Machina's top bar is as it was: its separators are "/", its Part count stands before the Part's name, no tag
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-flux-top-live.mjs
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const rgbOf = (c) => { const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(c || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
const lum = (c) => { const v = rgbOf(c); if (!v) return NaN; const [r, g, b] = v.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const DOOR = '&reorglift=flux.top';
const BASE = `/?arbor2=0&reorg=1&flux3=1${DOOR}`;
const CYAN = 'rgb(0, 194, 255)', ORANGE = 'rgb(255, 152, 0)', FIELD = 'rgb(95, 143, 149)';
const SIGNALS = { a: ['[01]', 'rgb(0, 194, 255)'], b: ['[02]', 'rgb(183, 255, 60)'], c: ['[03]', 'rgb(255, 46, 151)'], d: ['[04]', 'rgb(231, 244, 241)'], e: ['[05]', 'rgb(127, 168, 160)'], f: ['[06]', 'rgb(58, 143, 165)'] };
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";

const TOP = `(() => { const t = document.querySelector('.reorg-top'); if (!t) return null; const nav = t.closest('.sprint-nav'), br = nav ? nav.getBoundingClientRect() : null;
  const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, b: r.bottom }; };
  const word = (e) => { if (e.matches('.reorg-top-tag')) { const c = getComputedStyle(e, '::after').content; return c && c !== 'none' ? c.replace(/^["']|["']$/g, '') : ''; } return (e.innerText || '').trim(); };
  const seq = [...t.querySelectorAll(".reorg-top-names [data-top-name='project'], .reorg-top-names .reorg-top-sep, .reorg-top-names [data-top-name='doc'], .reorg-top-names .reorg-top-tag, .reorg-top-names [data-top-name='part'], .reorg-top-names .reorg-top-part-count")].filter((e) => e.getBoundingClientRect().width > 0).sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map(word);
  const names = [...t.querySelectorAll(".reorg-top-names [data-top-name='project'], .reorg-top-names [data-top-name='doc'], .reorg-top-names [data-top-name='part']")].map((e) => { const s = getComputedStyle(e), b = e.matches('button') ? e : e.querySelector('button'), bs = b ? getComputedStyle(b) : s; const r = e.getBoundingClientRect();
    return { id: e.getAttribute('data-top-name'), color: s.color, tt: s.textTransform, ls: parseFloat(s.letterSpacing) || 0, bg: bs.backgroundColor, border: bs.borderTopWidth, clip: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } }; });
  const c = t.querySelector('.reorg-top-part-count'), cr = c ? c.getBoundingClientRect() : null;
  return { kind: t.getAttribute('data-reorg-top'), seq, names, count: c ? { color: getComputedStyle(c).color, clip: { x: Math.round(cr.left), y: Math.round(cr.top), w: Math.round(cr.width), h: Math.round(cr.height) } } : null, bar: br && { t: br.top, b: br.bottom, h: br.height }, search: box(t.querySelector('.reorg-top-search')), namesBox: box(t.querySelector('.reorg-top-names')) }; })()`;
const TAG = `(() => { const e = document.querySelector('.reorg-top .reorg-top-tag'); if (!e) return null; const s = getComputedStyle(e), a = getComputedStyle(e, '::after'), r = e.getBoundingClientRect();
  return { code: (a.content || '').replace(/^["']|["']$/g, ''), fill: s.backgroundColor, left: s.borderLeftWidth, bar: s.borderLeftColor, ink: s.webkitTextFillColor || s.color, top: s.borderTopWidth, clip: { x: Math.round(r.left + 4), y: Math.round(r.top), w: Math.max(3, Math.round(r.width - 4)), h: Math.round(r.height) } }; })()`;
const STAGES = `(() => { const strip = document.querySelector('.reorg-top .desk-mode-strip'); if (!strip) return null; return { text: (strip.innerText || '').replace(/\\s+/g, ' ').trim(), tabs: [...strip.querySelectorAll('.desk-mode-tab')].map((b) => { const s = getComputedStyle(b), a = getComputedStyle(b, '::before');
  return { key: b.getAttribute('data-mode-key'), word: (b.innerText || '').trim(), on: b.getAttribute('aria-selected') === 'true', under: s.borderBottomColor, underW: parseFloat(s.borderBottomWidth) || 0, color: s.color, bar: a.content && a.content !== 'none' ? [a.width, a.height, a.backgroundColor] : null, cx: b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2, cy: b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2 }; }) }; })()`;
const VIEWS = `(() => { const t = document.querySelector('.reorg-top'); if (!t) return null; const connect = t.querySelector('[data-top-connect]'), place = t.querySelector('[data-top-place]'); const btns = [...t.querySelectorAll('.reorg-top-right .show-as button')];
  return { connect: connect ? connect.textContent.trim() : null, connectRight: connect ? connect.getBoundingClientRect().right : null, place: place ? place.textContent.trim() : null, views: btns.map((b) => { const s = getComputedStyle(b), a = getComputedStyle(b, '::before'), r = b.getBoundingClientRect(); return { word: (b.innerText || '').trim().toUpperCase(), on: b.getAttribute('aria-pressed') === 'true', w: r.width, l: r.left, cx: r.left + r.width / 2, cy: r.top + r.height / 2, color: s.color, bar: a.content && a.content !== 'none' ? [a.width, a.height, a.backgroundColor] : null }; }) }; })()`;
const PAGE = "(() => ['.mode-pagecol', '.mode-page'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";

async function visit(app, search, id = 'ft-2', theme = 'flux') {
  await app.evalJs(`localStorage.setItem('wrizo-theme', ${q(theme)}); history.replaceState(null, '', ${q(`${search}#/page/${id}`)}); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.sprint-nav')", { label: `the bar (${theme} ${search})`, timeout: 20000 }).catch(() => {});
  await sleep(1300);
}
// a box AS PAINTED: its median pixel (the ground)
async function paintedGround(app, b) {
  if (!b || !(b.w > 2) || !(b.h > 2)) return null;
  const data = (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } })).data;
  const p = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const D = g.getImageData(0, 0, c.width, c.height).data;
    const out = []; for (let i = 0; i < D.length; i += 4) out.push([D[i], D[i + 1], D[i + 2]]); const L = (x) => 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2]; out.sort((x, y) => L(x) - L(y)); return out[out.length >> 1]; })()`);
  return Array.isArray(p) ? `rgb(${p.join(', ')})` : null;
}
const oneRow = (r) => !!r && !!r.bar && !!r.search && !!r.namesBox && Math.abs((r.search.t + r.search.h / 2) - (r.namesBox.t + r.namesBox.h / 2)) <= 6 && r.search.b <= r.bar.b + 1 && r.namesBox.t >= r.bar.t - 1;
const t2 = (r) => !!r && r.names.length === 3 && r.names.every((n) => n.tt === 'uppercase' && n.ls >= 1 && n.bg === 'rgba(0, 0, 0, 0)' && n.border === '0px') && oneRow(r);
const t4 = (list) => Object.keys(SIGNALS).every((s) => { const x = list[s]; return !!x && x.code === SIGNALS[s][0] && x.fill === 'rgba(0, 0, 0, 0)' && x.left === '3px' && x.bar === SIGNALS[s][1] && x.ink === SIGNALS[s][1] && x.top === '0px' && !!x.ground && contrast(x.ink, x.ground) >= 4.5 && contrast(x.bar, x.ground) >= 3; });
const TEXT_HI = 'rgb(231, 244, 241)';
const t4b = (list) => Object.keys(SIGNALS).every((s) => { const x = list[s]; return !!x && x.code === SIGNALS[s][0] && x.fill === 'rgba(0, 0, 0, 0)' && x.left === '3px' && x.bar === SIGNALS[s][1] && x.ink === TEXT_HI && x.top === '0px' && !!x.ground && contrast(x.ink, x.ground) >= 4.5 && contrast(x.bar, x.ground) >= 3; });
const stage = async (app, key) => { await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${key}"]')?.click(); null`); await sleep(1000); };

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }).catch(() => {});
  await app.evalJs(`(() => { const W = window; const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    page('ft-1', 'Chapter One\\nThe rain had not stopped.', { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('ft-2', 'Chapter Two\\nThe second morning.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('ft-3', 'Chapter Three\\nThe flood.', { origin: 'project', projectId: mill.id, orderIndex: 2 });
    page('ft-c', 'Plot circuit', { origin: 'loose', pageType: 'board', boxes: [{ id: 'k1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'The mill floods' }] });
    W.wrizoPatchEntry('ft-2', { pageSettings: ${PS}, name: 'Second morning', level: 0 } });
    W.wrizoFlushNow(); return true; })()`);
  await sleep(500);

  // ---- the gate ----
  await visit(app, '/?arbor2=0&flux3=1');
  const noSwitch = await app.evalJs("!!document.querySelector('.reorg-top')");
  await visit(app, '/?arbor2=0&reorg=1&flux3=1');
  const noDoor = await app.evalJs("!!document.querySelector('.reorg-top')");
  await visit(app, `/?arbor2=0&reorg=1${DOOR}`);
  const noRedesign = await app.evalJs("!!document.querySelector('.reorg-top')");
  await visit(app, BASE);
  const on = await app.evalJs("!!document.querySelector('.reorg-top')");
  ok('T0 the reorg\'s top bar stands in Flux with the redesign, the switch and the door, and not without the door, the redesign or the switch', on && !noDoor && !noRedesign && !noSwitch, { on, noDoor, noRedesign, noSwitch });

  // ---- the crumb ----
  await app.evalJs("window.wrizoParts && window.wrizoParts.setPartColor('ft-2', 'c'); null"); await sleep(800);
  await app.mouseMove(700, 420); await sleep(400);
  const doc = await app.evalJs(TOP);
  ok('T1 on Track 2 the bar reads FICTION ▸ THE MILL // [03] SECOND MORNING TRK 2/3, left to right', !!doc && JSON.stringify(doc.seq) === JSON.stringify(['FICTION', '▸', 'THE MILL', '//', '[03]', 'SECOND MORNING', 'TRK 2/3']), doc && doc.seq);
  ok('T2 the three names are letter-spaced capitals and no bare buttons, and the bar holds one row', t2(doc), doc && { names: doc.names.map((n) => [n.id, n.tt, n.ls, n.bg, n.border]), bar: doc.bar, search: doc.search, namesBox: doc.namesBox });
  const faced = doc && doc.names.length ? { ...doc, names: doc.names.map((n, i) => (i === 0 ? { ...n, bg: 'rgb(239, 239, 239)', border: '2px' } : n)) } : null;
  ok('MUT-T2 the same reading with a browser button face on a name turns T2\'s test red', !!faced && !t2(faced), faced && faced.names[0].bg);
  const inks = [];
  for (const n of (doc ? doc.names : [])) { const g = await paintedGround(app, n.clip); inks.push({ id: n.id, r: g ? +contrast(n.color, g).toFixed(2) : null, g }); }
  const countGround = doc && doc.count ? await paintedGround(app, doc.count.clip) : null;
  const countRatio = countGround ? +contrast(doc.count.color, countGround).toFixed(2) : null;
  ok('T3 as painted on the bar, the names read 7:1 or better and the TRK readout 4.5:1 or better', inks.length === 3 && inks.every((x) => x.r >= 7) && countRatio >= 4.5, { inks, countRatio, countGround });

  // ---- the tags ----
  const tags = {};
  for (const s of Object.keys(SIGNALS)) {
    await app.evalJs(`window.wrizoParts && window.wrizoParts.setPartColor('ft-2', ${q(s)}); null`); await sleep(500);
    const x = await app.evalJs(TAG);
    tags[s] = x ? { ...x, ground: await paintedGround(app, x.clip) } : null;
  }
  // SUPERSEDED (Nov 23, before its first green: spec 11 rule 2 reads "Beside its bar on the panel, the code is text-hi"; this asserted the code in the signal). The original, verbatim:
  // ok('T4 every slot a-f draws its code [01]..[06] with a 3 px left bar in its signal and no chip; the code 4.5:1 on the bar, the bar 3:1', t4(tags), tags);
  void t4;
  ok('T4-B every slot a-f draws its code [01]..[06] in text-hi beside a 3 px left bar in its signal, no chip; the code 4.5:1 on the bar, the bar 3:1', t4b(tags), tags);
  const chip = Object.fromEntries(Object.entries(tags).map(([k, v]) => [k, v && { ...v, fill: SIGNALS[k][1] }]));
  // SUPERSEDED with T4, the original, verbatim:
  // ok('MUT-T4 the same reading with a filled chip turns T4\'s test red', !t4(chip), chip.a && chip.a.fill);
  ok('MUT-T4-B the same reading with a filled chip turns T4-B\'s test red', !t4b(chip), chip.a && chip.a.fill);
  const signalInk = Object.fromEntries(Object.entries(tags).map(([k, v]) => [k, v && { ...v, ink: SIGNALS[k][1] }]));
  ok('MUT-T4-C the same reading with the code in its signal turns T4-B\'s test red', !t4b(signalInk), signalInk.a && signalInk.a.ink);
  await app.evalJs("window.wrizoParts && window.wrizoParts.setPartColor('ft-2', '#C0392B'); null"); await sleep(600);
  const own = await app.evalJs(TAG);
  ok('T5 her own colour draws as its bar with the code [##]', !!own && own.code === '[##]' && own.left === '3px' && own.bar === 'rgb(192, 57, 43)' && own.fill === 'rgba(0, 0, 0, 0)', own);
  await app.evalJs("window.wrizoParts && window.wrizoParts.setPartColor('ft-2', 'c'); null"); await sleep(500);

  // ---- the stage strip ----
  await app.mouseMove(700, 420); await sleep(300);
  const s0 = await app.evalJs(STAGES);
  const cur = s0 && s0.tabs.find((x) => x.on);
  ok('T6 the strip reads WIRE IN · TEXT · PATCH · UPLINK then CIRCUITS →; the current one has the cyan underline and the 3 x 24 brass bar, no other stage has the bar',
    !!s0 && JSON.stringify(s0.tabs.map((x) => x.word.toUpperCase())) === JSON.stringify(['WIRE IN', 'TEXT', 'PATCH', 'UPLINK']) && /CIRCUITS\s*→/i.test(s0.text) && !!cur && cur.key === 'draft' && cur.under === CYAN && cur.underW >= 1 && JSON.stringify(cur.bar) === JSON.stringify(['3px', '24px', ORANGE]) && s0.tabs.filter((x) => !x.on).every((x) => !x.bar), s0);
  const patch = s0 && s0.tabs.find((x) => x.key === 'revise');
  if (patch) { await app.mouseMove(patch.cx, patch.cy); await sleep(350); }
  const s1 = await app.evalJs(STAGES);
  const hovered = s1 && s1.tabs.find((x) => x.key === 'revise'), still = s1 && s1.tabs.find((x) => x.on);
  ok('T7 a hovered stage is never brass, and the current one keeps its bar', !!hovered && !hovered.bar && hovered.color !== ORANGE && !!still && !!still.bar, { hovered, still });
  await app.mouseMove(700, 420); await sleep(250);

  // ---- every stage: one row, one height, and the page ----
  await visit(app, `/?arbor2=0&reorg=1&flux3=1&reorglift=flux.top,flux.uplink`);
  const heights = {}, rows = {}, pages = {};
  for (const key of ['draft', 'revise', 'publish']) { await stage(app, key); await app.mouseMove(700, 420); await sleep(300); const r = await app.evalJs(TOP); heights[key] = r && r.bar && r.bar.h; rows[key] = oneRow(r); pages[key] = await app.evalJs(PAGE); }
  await stage(app, 'draft'); await stage(app, 'freewrite'); await app.mouseMove(700, 420); await sleep(300);
  const wired = await app.evalJs(TOP); heights.freewrite = wired && wired.bar && wired.bar.h; rows.freewrite = oneRow(wired);
  await stage(app, 'draft');
  const t8 = (h, r) => ['freewrite', 'draft', 'revise', 'publish'].every((k) => typeof h[k] === 'number' && r[k] === true && Math.abs(h[k] - h.draft) <= 0.5);
  ok('T8 in WIRE IN, TEXT, PATCH and UPLINK the bar keeps one row and one height', t8(heights, rows), { heights, rows });
  ok('MUT-T8 the Uplink reading with the bar 41 px taller turns T8\'s test red', typeof heights.publish === 'number' && !t8({ ...heights, publish: heights.publish + 41 }, rows), heights.publish);
  ok('T9 the page (column and paper) keeps its rect in TEXT, PATCH and UPLINK', !!pages.draft && !pages.draft.includes('-|') && pages.draft === pages.revise && pages.draft === pages.publish, pages);

  // ---- a Circuit with no Doc ----
  await visit(app, BASE, 'ft-c');
  await app.waitFor("!!document.querySelector('.reorg-top[data-reorg-top=\"board\"]')", { label: 'the Circuit bar', timeout: 10000 }).catch(() => {});
  await app.mouseMove(700, 420); await sleep(400);
  const v0 = await app.evalJs(VIEWS), cTop = await app.evalJs(TOP);
  const words = v0 ? v0.views.map((x) => x.word) : [];
  ok('T10 on a Circuit with no Doc: "Circuit · no doc yet", Connect Docs before the views, the views are words (LIVE, SEQUENCE, STACK among them), the Doc\'s bar height on one row',
    !!v0 && v0.place === 'Circuit · no doc yet' && v0.connect === 'Connect Docs' && v0.views.length >= 3 && v0.connectRight <= v0.views[0].l && ['LIVE', 'SEQUENCE', 'STACK'].every((w) => words.includes(w)) && v0.views.every((x) => x.w > 20 && x.word.length > 1)
      && !!cTop && !!cTop.bar && !!doc && !!doc.bar && Math.abs(cTop.bar.h - doc.bar.h) <= 0.5 && oneRow({ ...cTop, namesBox: cTop.namesBox }), { v0: v0 && { place: v0.place, connect: v0.connect, words }, bar: cTop && cTop.bar, docBar: doc && doc.bar });
  const chosen = v0 && v0.views.find((x) => x.on), other = v0 && v0.views.find((x) => !x.on);
  if (other) { await app.mouseMove(other.cx, other.cy); await sleep(450); }
  const v1 = await app.evalJs(VIEWS);
  const hv = v1 && other && v1.views.find((x) => x.word === other.word);
  ok('T11 the chosen view has the 3 x 24 brass bar; a hovered view is not brass', !!chosen && JSON.stringify(chosen.bar) === JSON.stringify(['3px', '24px', ORANGE]) && !!hv && !hv.bar && hv.color !== ORANGE, { chosen, hv });
  await app.mouseMove(700, 420); await sleep(250);
  const sd = await app.evalJs("(() => { const b = document.querySelector('.reorg-top .reorg-top-search'); if (!b) return null; const s = getComputedStyle(b); return { edge: s.borderTopWidth + ' ' + s.borderTopColor, word: (b.innerText || '').trim(), title: b.getAttribute('title'), icon: !!b.querySelector('svg') }; })()");
  ok('T12 the search door is an icon in the strip\'s command style (1 px #5F8F95), no word drawn, "Search" on hover', !!sd && sd.edge === `1px ${FIELD}` && sd.word === '' && sd.title === 'Search' && sd.icon, sd);

  // ---- Machina ----
  await visit(app, '/?reorg=1&arbor2=0', 'ft-2', 'machina');
  const m = await app.evalJs("(() => { const t = document.querySelector('.reorg-top'); if (!t) return null; const c = t.querySelector('.reorg-top-part-count'), n = t.querySelector(\".reorg-top-part [data-top-name='part']\"); return { seps: [...t.querySelectorAll('.reorg-top-sep')].map((e) => e.textContent), tag: !!t.querySelector('.reorg-top-tag'), countFirst: !!c && !!n && !!(c.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING) }; })()");
  ok('T13 Machina\'s top bar is as it was: separators "/", the Part count before the Part\'s name, no tag', !!m && m.seps.length === 2 && m.seps.every((s) => s === '/') && m.countFirst && !m.tag, m);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1600)}`);
const EXPECTED = 18;   // T4 and MUT-T4 parked: + T4-B, MUT-T4-B, MUT-T4-C (Nov 23). Was: const EXPECTED = 17;   // T0 to T13, MUT-T2, MUT-T4, MUT-T8
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nREORG-FLUX-TOP-LIVE VERIFY: PASS (${checks.length} checks)` : `\nREORG-FLUX-TOP-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
