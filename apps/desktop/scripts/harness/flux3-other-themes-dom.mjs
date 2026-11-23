// FLUX3 IS ON FOR EVERYONE: ARBOR AND MACHINA DRAW THE SAME DOM (Fable, Nov 23, 12:40 pm: "Arbor and Machina pages draw the same DOM with ?flux3=0 and by default (FLUX3 is now on for
// everyone; BoardEditor and DeskInstrument mount on it alone)"). Each theme opens the Desk, a page (DeskInstrument's mounts) and a board (BoardEditor's mounts), by default and with ?flux3=0, and reads
// every element in <body> and <html>'s attributes: tag, classes, attribute names and values, and its own text. SVG geometry and inline style are left out (they animate); digits are masked (counts and clocks).
// The one difference allowed is <html data-flux3>, the mark boot.ts sets.
//   FT-PREMISE-<theme>       by default the page carries data-flux3 and the theme; with ?flux3=0 it carries the theme and no data-flux3 (the two arms really are the two flags)
//   FT-CONTROL-<theme>-<s>   two default opens read the same (a red here means the read is noisy, and FT-SAME says nothing)
//   FT-SAME-<theme>-<s>      the default open and the ?flux3=0 open read the same
//   FT-CLICK-<theme>-<s>     the same after a real click on the page or a board card (the Flux current listens for clicks and focus); FT-CLICKCTRL is its control, two default opens after the same click
//   FT-LIVE                  the same read DOES differ in Flux, where the redesign is drawn (the read can see what it guards)
//   FT-MUT                   one element put into the default page turns the comparison red (the mutant LANDED)
// Run: node scripts/harness/flux3-other-themes-dom.mjs   (from apps/desktop; Actions harness or a box turn)
process.env.WS_REORG = '1';   // the page a writer gets: the driver otherwise pins the reorg off
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const THEMES = [['machina', 'Machina'], ['plateau', 'Arbor']];
const DOC = 'ft-doc', BOARD = 'ft-board';
const SURFACES = [
  { key: 'desk', hash: '#/', ready: "!!document.querySelector('.wz-arrival')", click: null },
  { key: 'page', hash: `#/page/${DOC}`, ready: "!!document.querySelector('.forward-only-editor')", click: '.forward-only-editor' },
  { key: 'board', hash: `#/page/${BOARD}`, ready: `!!document.querySelector('.board-canvas .board-box[data-box-id="ft-a"]')`, click: '.board-canvas .board-box[data-box-id="ft-a"]' },
];

const SIGNATURE = `(() => {
  const VOLATILE = new Set(['style', 'd', 'points', 'transform', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'viewBox', 'opacity', 'stroke-dashoffset', 'stroke-dasharray']);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK']);
  const mask = (v) => String(v).replace(/:r[0-9a-z]+:/g, ':r:').replace(/[0-9]+([.][0-9]+)?/g, '#');
  const attrs = (e, drop) => [...e.attributes].filter((a) => a.name !== 'class' && !VOLATILE.has(a.name) && !drop.has(a.name)).map((a) => a.name + '=' + mask(a.value)).sort().join(' ');
  const classes = (e) => [...e.classList].sort().join('.');
  const own = (e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue.trim()).filter(Boolean).join(' ');
  const lines = ['html {' + attrs(document.documentElement, new Set(['data-flux3'])) + '}'];
  const GENERATED = /^arbor2-sun-(leaf|beam|cross|drift)/;   // Arbor's sun draws a different set of these on every load (two default opens differ: FT-CONTROL)
  const walk = (e, depth) => { for (const c of e.children) { if (SKIP.has(c.tagName) || [...c.classList].some((n) => GENERATED.test(n))) continue; lines.push(depth + ' ' + c.tagName.toLowerCase() + ' .' + classes(c) + ' {' + attrs(c, new Set()) + '} ' + JSON.stringify(mask(own(c)).slice(0, 48))); walk(c, depth + 1); } };
  walk(document.body, 0);
  return { lines, flux3: document.documentElement.hasAttribute('data-flux3'), theme: document.documentElement.getAttribute('data-theme') };
})()`;

const compare = (a, b) => {
  if (!a || !b) return { same: false, why: 'a read is missing' };
  if (a.lines.length === b.lines.length && a.lines.every((l, i) => l === b.lines[i])) return { same: true, n: a.lines.length };
  const count = (xs) => { const m = new Map(); for (const x of xs) m.set(x, (m.get(x) || 0) + 1); return m; };
  const ca = count(a.lines), cb = count(b.lines);
  const only = (p, q) => [...p.entries()].filter(([k, v]) => v > (q.get(k) || 0)).map(([k]) => k);
  const first = a.lines.findIndex((l, i) => l !== b.lines[i]);
  return { same: false, sizes: [a.lines.length, b.lines.length], first, a: a.lines[first], b: b.lines[first], onlyA: only(ca, cb).slice(0, 6), onlyB: only(cb, ca).slice(0, 6) };
};

await withHarness(async (app) => {
  const ev = (s) => app.evalJs(s);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.emulateDpr(1, 1400, 900);
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoTheme === 'object'", { label: 'the seams', timeout: 20000 });
  const at = '2026-04-01T00:00:00.000Z';
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  const boxes = [T('ft-a', 0.05, 0.05, 1, 'Card A'), T('ft-b', 0.5, 0.05, 2, 'Card B'), { id: 'ft-ab', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 3, connA: 'ft-a', connB: 'ft-b' }, { id: 'ft-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1600 }];
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: DOC, text: 'word0 word1 word2\nword3 word4', createdAt: at, origin: 'loose', source: 'page' })}); null`);
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Same DOM', pageType: 'board', boxes, createdAt: at, origin: null, source: null })}); window.wrizoFlushNow(); null`);
  await sleep(500);

  const open = async (theme, search, s) => {
    await app.cdp('Page.navigate', { url: `${app.base}/${search}#/` });
    await sleep(250);
    await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 20000 });
    await ev(`window.wrizoTheme.set(${JSON.stringify(theme)}); window.wrizoFlushNow(); null`);
    await sleep(400);
    await app.reload();
    await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam after the reload', timeout: 20000 });
    await ev(`location.hash = ${JSON.stringify(s.hash)}; null`);
    await app.waitFor(s.ready, { label: `${theme} ${s.key}`, timeout: 20000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
    if (!search) await app.waitFor("document.documentElement.hasAttribute('data-flux3')", { label: 'the flux3 boot', timeout: 10000 });
    await sleep(1800);
  };
  const read = async (theme, search, s, { click = false } = {}) => {
    try {
      await open(theme, search, s);
      if (click && s.click) {
        const p = await ev(`(() => { const r = document.querySelector(${JSON.stringify(s.click)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 200) }; })()`);
        for (const type of ['mousePressed', 'mouseReleased']) await app.cdp('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
        await sleep(700);
      }
      return await ev(SIGNATURE);
    } catch (e) { console.log(`FT-READ-ERROR ${theme} ${s.key} '${search}': ${String(e).slice(0, 200)}`); return null; }
  };
  const OFF = '?flux3=0';

  for (const [theme, label] of THEMES) {
    let premiseOn = null, premiseOff = null;
    for (const s of SURFACES) {
      const a = await read(theme, '', s), a2 = await read(theme, '', s), z = await read(theme, OFF, s);
      if (s.key === 'page') { premiseOn = a; premiseOff = z; }
      const control = compare(a, a2), same = compare(a, z);
      console.log(`FT ${label} ${s.key}: ${a ? a.lines.length : 'no read'} elements, control ${control.same}, same ${same.same}`);
      ok(`FT-CONTROL-${label}-${s.key} two default opens read the same`, control.same, JSON.stringify(control));
      ok(`FT-SAME-${label}-${s.key} the default open and ?flux3=0 draw the same DOM (${a ? a.lines.length : 0} elements)`, same.same, JSON.stringify(same));
      if (s.click) {
        const ca = await read(theme, '', s, { click: true }), ca2 = await read(theme, '', s, { click: true }), cz = await read(theme, OFF, s, { click: true });
        const clickControl = compare(ca, ca2), clicked = compare(ca, cz);
        ok(`FT-CLICKCTRL-${label}-${s.key} two default opens read the same after the click`, clickControl.same, JSON.stringify(clickControl));
        ok(`FT-CLICK-${label}-${s.key} the same after a real click`, clicked.same, JSON.stringify(clicked));
      }
    }
    ok(`FT-PREMISE-${label} default carries data-flux3, ?flux3=0 does not, both in ${theme}`, premiseOn && premiseOff && premiseOn.flux3 && !premiseOff.flux3 && premiseOn.theme === theme && premiseOff.theme === theme, JSON.stringify({ on: premiseOn && [premiseOn.flux3, premiseOn.theme], off: premiseOff && [premiseOff.flux3, premiseOff.theme] }));
  }

  const page = SURFACES[1];
  const fluxOn = await read('flux', '', page), fluxOff = await read('flux', OFF, page);
  const live = compare(fluxOn, fluxOff);
  ok('FT-LIVE the same read differs in Flux, where the redesign is drawn', !!fluxOn && !!fluxOff && !live.same, JSON.stringify({ sizes: live.sizes }));

  const base = await read('machina', '', page);
  await ev("(() => { const d = document.createElement('div'); d.className = 'ft-mut'; d.setAttribute('data-ft-mut', '1'); document.body.firstElementChild.appendChild(d); return true; })()");
  const mutated = await ev(SIGNATURE);
  const landed = !!(mutated && mutated.lines.some((l) => l.includes('ft-mut')));
  ok('FT-MUT one element put into the default page turns the comparison red (the mutant LANDED)', landed && !compare(base, mutated).same, JSON.stringify({ landed }));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1800)}`);
const EXPECTED = 24;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nFLUX3-OTHER-THEMES VERIFY: PASS (${checks.length} checks)`
  : `\nFLUX3-OTHER-THEMES VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
