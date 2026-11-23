// FLUX'S BOARD RENAME BOX CAN BE READ (found Nov 23 reading wa-red-69 on live Flux for Fable's 2:30 pm order). The rename box is an <input> carrying .crumb-here, so the redesign's pale crumb colour landed on the
// browser's white field: her words and her caret were rgb(231, 244, 241) on white. Read on the Flux a writer gets (no ?flux3 in the address), with the reorg on and with ?reorg=0, on both Page tones.
//   RN-<tone>-<reorg>  the box's DRAWN text stands 4.5:1 or better against its drawn field, and its caret colour stands 4.5:1 or better against that field (the page is the redesign; the reorg arm is the one asked)
//   MUT-RN             the browser's white field put back: the same read goes red (the mutant LANDED)
// Run: node scripts/harness/flux-rename-field.mjs   (from apps/desktop; Actions harness or a box turn)
process.env.WS_REORG = '1';   // the page a writer gets: the driver otherwise pins the reorg off
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BOARD = 'rn-board';
const FLOOR = 4.5;
const lin = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const rgb = (s) => (String(s).match(/[0-9.]+/g) || []).slice(0, 3).map(Number);

// the drawn pixels of a screenshot: the commonest colour is the field, the text is the pixel farthest from it
const DRAWN = (b64) => `new Promise((res) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; const n = new Map(); for (let i = 0; i < d.length; i += 4) { const k = d[i] + ',' + d[i + 1] + ',' + d[i + 2]; n.set(k, (n.get(k) || 0) + 1); } res([...n.entries()].map(([k, v]) => [k.split(',').map(Number), v])); }; im.onerror = () => res(null); im.src = 'data:image/png;base64,${b64}'; })`;

await withHarness(async (app) => {
  const ev = (s) => app.evalJs(s);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival') && typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  await app.emulateDpr(1, 1400, 900);
  const boxes = [{ id: 'rn-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.1, z: 1, text: 'Card A' }, { id: 'rn-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1600 }];
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'The Late Ferry', pageType: 'board', boxes, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })}); window.wrizoFlushNow(); null`);
  await sleep(500);

  const open = async (tone, query) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); history.replaceState(null, '', ${JSON.stringify(`/${query}#/page/${BOARD}`)}); return true; })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.crumb-rename-btn')", { label: 'the board name', timeout: 20000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
    await app.waitFor("document.documentElement.hasAttribute('data-flux3')", { label: 'the redesign', timeout: 10000 });
    await sleep(800);
    await ev("document.querySelector('.crumb-rename-btn').click(); null");
    await app.waitFor("!!document.querySelector('input.crumb-rename')", { label: 'the rename box', timeout: 8000 });
    await sleep(250);
  };
  const read = async () => {
    const s = await ev("(() => { const i = document.querySelector('input.crumb-rename'); const r = i.getBoundingClientRect(), cs = getComputedStyle(i); return { x: r.x, y: r.y, w: r.width, h: r.height, color: cs.color, caret: cs.caretColor, bg: cs.backgroundColor, focused: document.activeElement === i, theme: document.documentElement.getAttribute('data-theme'), flux3: document.documentElement.hasAttribute('data-flux3'), top: !!document.querySelector('.reorg-top') }; })()");
    const shot = await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: s.x + 1, y: s.y + 1, width: Math.max(1, s.w - 2), height: Math.max(1, s.h - 2), scale: 1 } });
    const px = await ev(DRAWN(shot.data));
    if (!px || !px.length) return { ...s, drawn: null };
    const field = px.slice().sort((a, b) => b[1] - a[1])[0][0];
    const text = px.reduce((m, [c]) => (ratio(c, field) > ratio(m, field) ? c : m), field);
    return { ...s, field, text, drawn: Math.round(ratio(text, field) * 100) / 100, caretRatio: Math.round(ratio(rgb(s.caret), field) * 100) / 100 };
  };

  for (const tone of ['light', 'dark']) {
    for (const [arm, query, wantTop] of [['reorg', '', true], ['noreorg', '?reorg=0', false]]) {
      let r = null;
      try { await open(tone, query); r = await read(); } catch (e) { r = { error: String(e).slice(0, 200) }; }
      console.log(`RN ${tone} ${arm}: ` + JSON.stringify(r));
      ok(`RN-${tone}-${arm} the rename box's drawn text and its caret stand ${FLOOR}:1 or better against its field (printed: text ${r && r.drawn}:1, caret ${r && r.caretRatio}:1)`,
        !!r && r.theme === 'flux' && r.flux3 && r.top === wantTop && r.focused && r.drawn >= FLOOR && r.caretRatio >= FLOOR, JSON.stringify(r));
    }
  }

  let mut = null;
  try {
    await open('light', '');
    await ev("(() => { const s = document.createElement('style'); s.textContent = 'input.crumb-rename{ background:#fff !important; }'; document.head.appendChild(s); return true; })()");
    await sleep(120);
    mut = await read();
  } catch (e) { mut = { error: String(e).slice(0, 200) }; }
  ok('MUT-RN the white field put back: the read goes red (the mutant LANDED)', !!mut && mut.bg === 'rgb(255, 255, 255)' && mut.caretRatio < FLOOR, JSON.stringify(mut));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 900)}`);
const EXPECTED = 5;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nFLUX-RENAME-FIELD VERIFY: PASS (${checks.length} checks)`
  : `\nFLUX-RENAME-FIELD VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
