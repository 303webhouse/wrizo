// ARBOR - BUG #56 CHECK ON MAIN (Fable, Nov 8: "check MAIN (the live Arbor): does the goal glow break the floor under Typewriter words there? If
// yes, that's bug #56 -> the same cap in a small live branch"). A CAPTURE on main as it is (no ?arbor2 flag), as named screens for INK's frames job
// (-f themes=plateau -f screens_file=apps/desktop/scripts/frames/arbor-main56.mjs), both page tones, both widths.
// A seam-seeded page opens in Free Write (Typewriter's zoom). Twice - at the goal the app ships (the default) and with the goal met (set through
// window.wrizoSetWritingGoal to 8 words, the glow then at its cap) - the words are made transparent for one screenshot and the ground under them
// is read on an 8 x 5 grid over the words' column in the writing band (the writing line to 1.4 lines below it); each sample against the words'
// ink, the page-text floor 13.9 (docs/MAP.md). Prints "ARBOR-MAIN56 <screen> {...}" with breaks true/false; throws only when it is blind.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-MAIN56 ${name} ${JSON.stringify(data)}`);
const blind = (name, data) => { console.log(`ARBOR-MAIN56-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} BLIND ${JSON.stringify(data)}`.slice(0, 1200)); };
const TEXT = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const GLOW = "(() => { const g = [...document.querySelectorAll('.wz-goal-glow')].find((e) => e.getBoundingClientRect().width > 0); return g ? { int: Number(g.style.getPropertyValue('--glow-intensity')), op: Number(getComputedStyle(g).opacity) } : null; })()";
const open = async (app, id) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await app.evalJs(`history.replaceState(null, '', '/' + ${JSON.stringify('#/page/' + id)})`); await app.reload();
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 10000 }))) blind('main56', { id, editor: false });
  if (!(await waitSoft(app, "!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'zoom', timeout: 6000 }))) blind('main56', { id, zoom: false });
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  await sleep(1900);   // the glow's own 1.4 s transition
};
const floor = async (app) => {
  const m = await app.evalJs(`(() => { const col = document.querySelector('.mode-pagecol'), p = col && col.querySelector('.mode-page'), ed = p && p.querySelector('.forward-only-editor'); if (!ed) return null;
    const er = ed.getBoundingClientRect(), cr = col.getBoundingClientRect(), pr = p.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(col).getPropertyValue('--tw-lh')) || 43.52, y0 = cr.top + cr.height * 0.5;
    const l = Math.max(er.left, pr.left) + 4, r = Math.min(er.right, pr.right - 24) - 4;
    return { xs: Array.from({ length: 8 }, (_, i) => l + (r - l) * i / 7), ys: [0, 0.35, 0.7, 1.05, 1.4].map((k) => y0 + k * lh), ink: getComputedStyle(ed).color,
      pageBg: getComputedStyle(p).backgroundColor, tone: document.documentElement.getAttribute('data-page'), theme: document.documentElement.getAttribute('data-theme') }; })()`);
  if (!m) return null;
  await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'main56-hide'; s.textContent = '.forward-only-editor, .forward-only-editor *{ color:transparent !important; caret-color:transparent !important; -webkit-text-fill-color:transparent !important; }'; document.head.appendChild(s); return true; })()");
  await sleep(150);
  const png = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
  await app.evalJs("document.getElementById('main56-hide')?.remove()");
  const px = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${png}'; await img.decode(); const dpr = img.width / innerWidth;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const L = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
    const ink = ${JSON.stringify(m.ink)}.match(/\\d+/g).slice(0, 3).map(Number);
    const rows = []; for (const y of ${JSON.stringify(m.ys)}) for (const x of ${JSON.stringify(m.xs)}) { const d = cx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data; const g = [d[0], d[1], d[2]];
      rows.push({ x: Math.round(x), y: Math.round(y), g, r: Math.round(((Math.max(L(ink), L(g)) + 0.05) / (Math.min(L(ink), L(g)) + 0.05)) * 100) / 100 }); }
    const min = rows.reduce((a, b) => (b.r < a.r ? b : a), rows[0]);
    return { n: rows.length, min, grounds: [...new Set(rows.map((q) => q.g.join(',')))].slice(0, 6) }; })()`);
  return { ...m, xs: undefined, ys: undefined, ...px };
};

export default {
  'main56-typewriter-glow': async (app) => {
    const seam = await app.evalJs("typeof window.wrizoSetWritingGoal === 'function' && typeof window.wrizoCreateJournalPage === 'function'");
    if (!seam) blind('main56-typewriter-glow', { seams: false });
    await open(app, 'arbor-main56-rest');
    const rest = { glow: await app.evalJs(GLOW), floor: await floor(app) };
    await app.evalJs("window.wrizoSetWritingGoal({ n: 8, unit: 'words' })");
    await open(app, 'arbor-main56-goal');
    const goal = { glow: await app.evalJs(GLOW), floor: await floor(app) };
    await app.evalJs("window.wrizoSetWritingGoal({ n: 24, unit: 'lines' })");   // back to the app's default (store/writingGoal.ts)
    if (!rest.floor || !goal.floor || !(goal.floor.n >= 10)) blind('main56-typewriter-glow', { rest, goal });
    const breaks = goal.floor.min.r < 13.9 || rest.floor.min.r < 13.9;
    say('main56-typewriter-glow', { breaks, restMin: rest.floor.min.r, goalMin: goal.floor.min.r, rest, goal });
  },
};
