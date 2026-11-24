// FLUX LIVE: THE SUCCESSORS, ON THE FLUX A WRITER GETS (Fable, Nov 23, 6:14 pm: "Successors: build them, ones about her words, saving, typing and getting around first"). The driver now pins ?flux3=0 for the older
// files, so each of their promises below is read again here with no ?flux3 and no ?reorg in the address: the redesign and the reorg, as they are on by default. The row numbers are docs/flux-live-pin-list.md's.
// HER WORDS AND SAVING
//   SL-PREMISE       every page below is the live Flux: theme flux, data-flux3 on the root, the reorg's top bar, no ?flux3 or ?reorg in its address
//   SL-COMPOSE       (row 20, hb1 F3) a second boot's [ COMPOSE ] opens a page with no veil and no gate, and the first words typed there are STORED
//   SL-SAVE-TEXT     words typed in TEXT are stored and are on the page after a reload
//   SL-SAVE-WIRE     words typed in Wire In are stored and are on the page after a reload
// TYPING
//   SL-CARET-LIGHT   (row 46, bug50) the block caret on the light page stands 4.5:1 or better on the DRAWN paper beside it, in the orange family
//   SL-CARET-WIRED   (row 46, bug50) a page saved light, in Wire In: the caret is the solid #FF9800 and stands 4.5:1 or better on the drawn ground
//   MUT-SL-CARET     the caret painted in the paper's colour: the same read goes red (the mutant LANDED)
// GETTING AROUND
//   SL-PLACE         (rows 3, 35) the rail's place reads New Drive for the untouched top drawer (its stored name unchanged), and her own Drive's name for hers
//   SL-LOG-DRIVES    (row 34) from a Log page the DRIVES door opens and lists her Drive
//   SL-TABS-KEYS     (row 15) the Front menu's tabs move by the arrow keys, report their state and take the focus, and the page keeps its rect
//   SL-VIEWS         (row 17) a Circuit offers its views in order: LIVE, SEQUENCE, SPINE, TRACE, STACK;  MUT-SL-VIEWS the order swapped goes red
//   SL-SPLIT-OPEN    (row 26) pressing Open Beside on an Input draws its words beside the page
//   SL-SPLIT-TYPE    (row 27) the reader stays drawn while she types, and her words are stored
//   SL-SPLIT-READ    (row 28) the reader cannot be edited: a press and a key in it change nothing stored;  MUT-SL-SPLIT-READ a reader made editable goes red
//   SL-SPLIT-CLOSE   (row 26) Close takes the reader away and gives the page its rect back
//   SL-DOCK          (row 32) the docked Operator stays drawn while she types
//   SL-POPOUT        (rows 44, 45, the panel's way in and out) signed out, [ LOG IN ] opens the one sign-in dialog with the focus in its first field, and Escape gives the doors back
// HOW IT LOOKS AND READS (the second batch)
//   SL-ORANGE        (row 1, flux-v2 F6) with a rail door open, nothing outside the allowed places paints in Flux's orange;  MUT-SL-ORANGE one more orange element goes red
//   SL-TARGETS       (row 2, flux-v2 F7) every rail door and foot box is at least a 44 px target
//   SL-NO-PNG        (row 7, flux-v2 F12 and F19) neither the front door nor the page draws Arbor's wrizo PNG
//   SL-DOOR          (row 8, flux-v2 F19) [ COMPOSE ]'s words are not brass, and its focus ring is the choice cyan
//   SL-ORDER         (row 12, drawers L5) MARKUP's sections run Typeface, Format, Commands, with no Presets or kind row among them
//   SL-HEADS         (row 25, page-templates X1) MARKUP's first head reads Typeface and TRACKS' head menu offers Presets
//   SL-GRIP          (row 14, drawers L6) an open drawer's tab is the choice cyan, never brass, and differs from the closed tab
//   SL-PROGRESS      (row 16, drawers L9) DOCS' Show the meter reports its state and writes the setting; no Typewriter toggle in TEXT
//   SL-FONTS         (row 41, th2 R2) the chrome's two faces, Rajdhani and Chakra Petch, are really loaded on the front door
//   SL-PAPER         (row 43, polish-arbor-chrome P8) the paper is the same size in Flux, Arbor and Machina at 1366 x 768, each on its own default
// A read of the live build; no clock. Run: node scripts/harness/flux-live-successors.mjs   (from apps/desktop; Actions harness or a box turn)
process.env.WS_REORG = '1';
process.env.WS_FLUX3 = 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const lin = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };
const rgb = (s) => (String(s).match(/[0-9.]+/g) || []).slice(0, 3).map(Number);
const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === mn || mx !== r ? null : (60 * (g - b)) / (mx - mn); };
const STORED = (id) => `((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${q(id)}) || {}).text || '')`;
const PAGE_RECT = "(() => { const r = document.querySelector('.mode-page').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(); })()";
const LIVE = "({ theme: document.documentElement.getAttribute('data-theme'), flux3: document.documentElement.hasAttribute('data-flux3'), top: !!document.querySelector('.reorg-top'), search: location.search })";
const isLive = (l) => !!l && l.theme === 'flux' && l.flux3 && l.top && !/flux3|reorg/.test(l.search);
const CARET = "(() => { const c = document.querySelector('.flux-block-caret'); if (!c) return null; const r = c.getBoundingClientRect(), s = getComputedStyle(c); return { bg: s.backgroundColor, x: r.right, y: r.top, h: r.height }; })()";
const COMMON = (b64) => `new Promise((res) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; const n = new Map(); for (let i = 0; i < d.length; i += 4) { const k = d[i] + ',' + d[i + 1] + ',' + d[i + 2]; n.set(k, (n.get(k) || 0) + 1); } res([...n.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number)); }; im.onerror = () => res(null); im.src = 'data:image/png;base64,${b64}'; })`;
const VIEWS = "[...document.querySelectorAll('.show-as .show-as-btn, .show-as [data-flux3-stack-tab]')].filter((b, i, a) => a.indexOf(b) === i).map((b) => (b.textContent || '').trim().toUpperCase())";

await withHarness(async (app) => {
  const ev = (s) => app.evalJs(s);
  const soft = async (expr, timeout = 6000, label = expr.slice(0, 60)) => { try { await app.waitFor(expr, { timeout, label }); return true; } catch { return false; } };
  const key = async (k, code, vk) => { for (const type of ['rawKeyDown', 'keyUp']) await app.cdp('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }); await sleep(180); };
  const section = async (names, fn) => { try { await fn(); } catch (e) { for (const n of names) if (!checks.some((c) => c.name.startsWith(n + ' '))) ok(`${n} (the section stopped)`, false, String(e && e.message || e).slice(0, 300)); } };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await soft("!document.querySelector('.wz-splash')", 20000);
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const seeded = await ev(`(() => {
    const W = window; const at = '2026-04-01T00:00:00.000Z';
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: at, source: 'page', ...extra });
    const top = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((d) => /^top-drawer-/.test(d.id));
    const fiction = W.wrizoCreateDrawer('Fiction');
    const novel = W.wrizoCreateProject('Novel'); W.wrizoSetProjectDrawer(novel.id, fiction.id);
    const inTop = W.wrizoCreateProject('Ledger'); W.wrizoSetProjectDrawer(inTop.id, top.id);
    page('sl-1', 'The harbour was quiet when she arrived.', { origin: 'project', projectId: novel.id, orderIndex: 0 });
    page('sl-2', 'A second chapter.', { origin: 'project', projectId: novel.id, orderIndex: 1 });
    page('sl-w', 'The corridor hums.', { origin: 'project', projectId: novel.id, orderIndex: 2 });
    page('sl-t', 'A page in the top drawer.', { origin: 'project', projectId: inTop.id, orderIndex: 0 });
    page('sl-note', 'Field notes\\nThe rain came late, and the river ran brown for a week.', { origin: 'loose' });
    page('sl-j', 'A log page.', { origin: 'journal' });
    W.wrizoCreateJournalPage({ id: 'sl-b', text: 'A circuit', createdAt: at, origin: null, source: null, pageType: 'board', boxes: [{ id: 'k1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'The mill floods' }] });
    const link = W.wrizoAddPageLink('sl-1', { bEntryId: 'sl-note' });
    W.wrizoFlushNow();
    return { link: !!link, top: top.id, topName: top.name };
  })()`);
  await sleep(500);

  const open = async (id, { tone = 'dark', mode = 'drafting', w = 1366, h = 768, theme = 'flux', ready = "!!document.querySelector('.forward-only-editor')" } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${q(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', ${q(theme)}); localStorage.setItem('wrizo-mode-page-${id}', ${q(mode)}); history.replaceState(null, '', ${q(`/#/page/${id}`)}); return true; })()`);
    await app.emulateDpr(1, w, h);
    await app.reload();
    await app.waitFor(ready, { label: `the page ${id}`, timeout: 20000 });
    await soft("!document.querySelector('.wz-splash')", 25000);
    await soft(theme === 'flux' ? "document.documentElement.hasAttribute('data-flux3') && !!document.querySelector('.reorg-top')" : "!!document.querySelector('.reorg-top')", 10000);
    await sleep(900);
  };
  const toEnd = () => ev("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); return true; })()");
  const typeAndStore = async (id, words) => { await toEnd(); await sleep(200); await app.typeKeys(words); return soft(`${STORED(id)}.includes(${q(words)})`, 9000); };

  // ---- HER WORDS AND SAVING --------------------------------------------------------------------------------------------------------------
  const premises = [];
  await section(['SL-COMPOSE'], async () => {
    await ev(`history.replaceState(null, '', '/#/'); null`);
    await app.reload();
    await app.waitFor("!!document.querySelector('[data-flux-door=compose]:not([data-wait])')", { label: 'the live COMPOSE door', timeout: 25000 });
    const p = await ev("(() => { const b = document.querySelector('[data-flux-door=compose]').getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()");
    await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y);
    const reached = await soft("/^#\\/page\\//.test(location.hash) && !!document.querySelector('.forward-only-editor')", 10000);
    await sleep(500);
    const gate = await ev("({ veil: document.querySelectorAll(\".hb1-veil[data-veiled='true']\").length, banner: !!document.querySelector('.hb1-gate-banner'), id: location.hash.replace('#/page/', '') })");
    const words = 'Words from the second boot';
    // the address reads /page/new until the first key makes the page, so the stored row is found by her words
    let stored = false;
    if (reached) { await toEnd(); await sleep(200); await app.typeKeys(words); stored = await soft(`JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').some((e) => (e.text || '').includes(${q(words)}))`, 9000); }
    ok('SL-COMPOSE a second boot\'s [ COMPOSE ] opens a page with no veil and no gate, and the first words typed there are stored', reached && gate.veil === 0 && !gate.banner && stored, { reached, gate, stored });
  });
  for (const [name, id, mode] of [['SL-SAVE-TEXT', 'sl-2', 'drafting'], ['SL-SAVE-WIRE', 'sl-w', 'journal']]) {
    await section([name], async () => {
      await open(id, { mode });
      premises.push(await ev(LIVE));
      const words = ` saved in ${name}`;
      const stored = await typeAndStore(id, words);
      await sleep(400);
      await open(id, { mode });
      const after = await ev("(document.querySelector('.forward-only-editor').innerText || '').replace(/\\s+/g, ' ')");
      ok(`${name} words typed are stored and on the page after a reload`, stored && after.includes(words.trim()), { stored, after: after.slice(-60) });
    });
  }

  // ---- TYPING ----------------------------------------------------------------------------------------------------------------------------
  const readCaret = async () => {
    await toEnd();
    await soft("!!document.querySelector('.flux-block-caret')", 4000);
    await app.mouseMove(8, 8);
    await sleep(700);
    const c = await ev(CARET);
    if (!c) return null;
    const shot = await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: c.x + 4, y: c.y, width: 26, height: Math.max(8, c.h), scale: 1 } });
    const ground = await ev(COMMON(shot.data));
    return { ...c, ground, ratio: ground ? ratio(rgb(c.bg), ground) : null, hue: hue(rgb(c.bg)), jacked: await ev("document.documentElement.hasAttribute('data-flux3-jacked')"), page: await ev("document.documentElement.getAttribute('data-page')") };
  };
  const orange = (c) => !!c && c.ratio >= 4.5 && c.hue !== null && c.hue >= 15 && c.hue <= 45;
  await section(['SL-CARET-LIGHT', 'MUT-SL-CARET'], async () => {
    await open('sl-1', { tone: 'light' });
    premises.push(await ev(LIVE));
    const c = await readCaret();
    ok(`SL-CARET-LIGHT the block caret on the light page stands 4.5:1 or better on the drawn paper, in the orange family (printed: ${c && c.ratio}:1, hue ${c && c.hue !== null ? Math.round(c.hue) : null})`, orange(c) && c.page === 'light', c);
    await ev(`(() => { const s = document.createElement('style'); s.id = 'sl-mut'; s.textContent = ":root[data-theme='flux'][data-page='light'] .flux-block-caret{ background:rgb(${c.ground.join(',')}) !important; box-shadow:none !important; }"; document.head.appendChild(s); return true; })()`);
    await sleep(150);
    const m = await readCaret();
    await ev("document.getElementById('sl-mut')?.remove(); null");
    ok('MUT-SL-CARET the caret painted in the paper\'s colour: the read goes red (the mutant LANDED)', !!m && rgb(m.bg).join() === c.ground.join() && !orange(m), m);
  });
  await section(['SL-CARET-WIRED'], async () => {
    await open('sl-1', { tone: 'light', mode: 'journal' });
    const c = await readCaret();
    ok(`SL-CARET-WIRED a page saved light, in Wire In: the caret is the solid #FF9800, 4.5:1 or better on the drawn ground (printed: ${c && c.ratio}:1)`, orange(c) && c.jacked === true && c.bg === 'rgb(255, 152, 0)', c);
  });

  // ---- GETTING AROUND --------------------------------------------------------------------------------------------------------------------
  const whereName = "(document.querySelector('[data-reorg-rail] .wz-reorg-where-name') || {}).textContent || null";
  await section(['SL-PLACE'], async () => {
    await open('sl-t');
    const top = await ev(whereName);
    const storedTop = await ev(`(JSON.parse(localStorage.getItem('writer-studio-drawers')).find((d) => d.id === ${q(seeded.top)}) || {}).name`);
    await open('sl-1');
    const mine = await ev(whereName);
    ok('SL-PLACE the rail\'s place reads New Drive for the untouched top drawer (its stored name unchanged) and her own Drive\'s name for hers', top === 'New Drive' && storedTop === seeded.topName && mine === 'Fiction', { top, storedTop, seeded: seeded.topName, mine });
  });
  await section(['SL-LOG-DRIVES'], async () => {
    await open('sl-j');
    await ev("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.click(); null");
    await sleep(700);
    const panel = await ev("(() => { const p = document.querySelector('.wz-cascade-panel[data-category=\"reorg-projects\"]:not([data-leaving=\"true\"])'); return p ? (p.textContent || '') : null; })()");
    ok('SL-LOG-DRIVES from a Log page the DRIVES door opens and lists her Drive', !!panel && /Fiction/.test(panel), { panel: panel && panel.slice(0, 120) });
  });
  await section(['SL-TABS-KEYS'], async () => {
    await open('sl-1');
    const before = await ev(PAGE_RECT);
    await ev("document.querySelector('.wz-sliver-grip')?.click(); null");
    await soft("document.querySelector('.wz-sliver-panel')?.getAttribute('data-open') === 'true'", 4000);
    await sleep(500);
    const TAB = "(() => { const on = document.querySelector('.wz-sliver-panel [role=tab][aria-selected=true]'); return { on: on && on.id, focused: document.activeElement === on }; })()";
    await ev("document.getElementById('wz-sliver-tab-text')?.focus(); null");
    const a = await ev(TAB);
    await key('ArrowRight', 'ArrowRight', 39);
    const b = await ev(TAB);
    await key('ArrowLeft', 'ArrowLeft', 37);
    const c = await ev(TAB);
    const after = await ev(PAGE_RECT);
    ok('SL-TABS-KEYS the Front menu\'s tabs move by the arrow keys, report their state and take the focus, and the page keeps its rect', !!a && a.on === 'wz-sliver-tab-text' && b.on === 'wz-sliver-tab-parts' && b.focused && c.on === 'wz-sliver-tab-text' && c.focused && before === after, { a, b, c, before, after });
    await ev("document.querySelector('.wz-sliver-grip')?.click(); null");
  });
  await section(['SL-VIEWS', 'MUT-SL-VIEWS'], async () => {
    await open('sl-b', { ready: "!!document.querySelector('.board-canvas .board-box')" });
    const WANT = ['LIVE', 'SEQUENCE', 'SPINE', 'TRACE', 'STACK'];
    const v = await ev(VIEWS);
    ok('SL-VIEWS a Circuit offers its views in order: LIVE, SEQUENCE, SPINE, TRACE, STACK', JSON.stringify(v) === JSON.stringify(WANT), v);
    await ev("(() => { const a = document.querySelector('.show-as .show-as-btn'); a.parentElement.appendChild(a); return true; })()");
    const m = await ev(VIEWS);
    ok('MUT-SL-VIEWS the first view moved to the end: the read goes red (the mutant LANDED)', JSON.stringify(m) !== JSON.stringify(WANT) && m.length === WANT.length, m);
  });
  await section(['SL-SPLIT-OPEN', 'SL-SPLIT-TYPE', 'SL-SPLIT-READ', 'MUT-SL-SPLIT-READ', 'SL-SPLIT-CLOSE'], async () => {
    await open('sl-1', { w: 1920, h: 1080 });
    const rest = await ev(PAGE_RECT);
    await ev("document.querySelector('.wz-tutor-grip')?.click(); null");
    await soft("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'", 4000);
    await sleep(400);
    await ev("document.getElementById('wz-tutor-tab-links')?.click(); null");
    await soft("!!document.querySelector('[data-back-beside]')", 4000);
    await ev("document.querySelector('[data-back-beside]')?.click(); null");
    const opened = await soft("document.querySelector('.wz-split-asset')?.getAttribute('data-split-asset') === 'sl-note'", 6000);
    await sleep(500);
    const READER = "(() => { const a = document.querySelector('.wz-split-asset'); if (!a) return null; let o = 1; for (let n = a; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return { words: (a.querySelector('.wz-link-dock-text') || {}).textContent || '', o, editable: !!a.querySelector('[contenteditable=true], textarea, input') }; })()";
    const r0 = await ev(READER);
    ok('SL-SPLIT-OPEN pressing Open Beside on an Input draws its words beside the page', opened && !!r0 && /The rain came late/.test(r0.words) && r0.o === 1, r0);
    await ev("(() => { const p = document.querySelector('.wz-tutor-panel'); if (p && p.getAttribute('data-open') === 'true') document.querySelector('.wz-tutor-grip')?.click(); return true; })()");
    await sleep(500);
    const words = ' typed beside it';
    const stored = await typeAndStore('sl-1', words);
    await sleep(500);
    const r1 = await ev(READER);
    ok('SL-SPLIT-TYPE the reader stays drawn while she types, and her words are stored', stored && !!r1 && r1.o === 1 && /The rain came late/.test(r1.words), { stored, r1 });
    const noteBefore = await ev(STORED('sl-note'));
    const p = await ev("(() => { const t = document.querySelector('.wz-split-asset .wz-link-dock-text'); const b = t.getBoundingClientRect(); return { x: Math.round(b.left + 40), y: Math.round(b.top + 12) }; })()");
    await app.mouseDown(p.x, p.y); await sleep(40); await app.mouseUp(p.x, p.y); await sleep(150);
    const inReader = await ev("!!document.activeElement && !!document.activeElement.closest('.wz-split-asset') && document.activeElement.isContentEditable");
    await ev("(() => { const e = document.querySelector('.forward-only-editor'); if (document.activeElement === e) e.blur(); return true; })()");
    await app.typeKeys('x');
    await sleep(900);
    const noteAfter = await ev(STORED('sl-note'));
    const r2 = await ev(READER);
    ok('SL-SPLIT-READ the reader cannot be edited: a press and a key in it change nothing stored', !!r2 && !r2.editable && !inReader && noteAfter === noteBefore && r2.words === r1.words, { editable: r2 && r2.editable, inReader, same: noteAfter === noteBefore });
    await ev("document.querySelector('.wz-split-asset .wz-link-dock-text').setAttribute('contenteditable', 'true'); null");
    const rm = await ev(READER);
    await ev("document.querySelector('.wz-split-asset .wz-link-dock-text').removeAttribute('contenteditable'); null");
    ok('MUT-SL-SPLIT-READ a reader made editable: the read goes red (the mutant LANDED)', !!rm && rm.editable === true, rm);
    await ev("document.querySelector('.wz-split-asset [data-split-close]')?.click(); null");
    const closed = await soft("!document.querySelector('.wz-split-asset')", 4000);
    await sleep(600);
    const back = await ev(PAGE_RECT);
    ok('SL-SPLIT-CLOSE Close takes the reader away and gives the page its rect back', closed && back === rest, { closed, rest, back });
  });
  await section(['SL-DOCK'], async () => {
    await open('sl-2', { w: 1920, h: 1080 });
    await ev("document.querySelector('.wz-tutor-grip')?.click(); null");
    await soft("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'", 4000);
    await sleep(400);
    await ev("document.getElementById('wz-tutor-tab-tutor')?.click(); null");
    await soft("!!document.querySelector('.wz-tutor-dock-btn')", 4000);
    await ev("document.querySelector('.wz-tutor-dock-btn')?.click(); null");
    const docked = await soft("document.querySelector('.wz-tutor-panel')?.getAttribute('data-docked') === 'true'", 4000);
    await typeAndStore('sl-2', ' typed while docked');
    await sleep(1400);
    const o = await ev("(() => { const a = document.querySelector('.wz-tutor-panel'); if (!a) return null; let o = 1; for (let n = a; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return { o, docked: a.getAttribute('data-docked'), writing: document.documentElement.getAttribute('data-wz-writing') }; })()");
    ok('SL-DOCK the docked Operator stays drawn while she types', docked && !!o && o.o === 1 && o.docked === 'true' && o.writing === 'true', { docked, o });
  });
  // ---- HOW IT LOOKS AND READS ------------------------------------------------------------------------------------------------------------
  await section(['SL-ORANGE', 'MUT-SL-ORANGE', 'SL-TARGETS'], async () => {
    await open('sl-1');
    await ev("document.querySelector('[data-reorg-rail] [data-category=\"reorg-docs\"]')?.click(); null");
    await sleep(700);
    const SCAN = `(() => { const O = /rgba?\\(\\s*255,\\s*152,\\s*0/; const bad = []; const allowed = (e) => e.closest('.flux-block-caret, .mode-pfill, .mode-pfill-sparks, [data-uplink], [data-flux-mark], .wz-logo, .wz-mark, .splash-mark, .brand-mark, .flux5-appmark') || e.closest('[aria-current]');
      for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if ([cs.color, cs.backgroundColor, cs.borderTopColor, cs.borderLeftColor, cs.outlineColor, cs.boxShadow, cs.fill, cs.stroke].some((v) => v && O.test(v)) && !allowed(e)) bad.push((e.tagName + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(' ').slice(0, 2).join('.')).slice(0, 60)); }
      return [...new Set(bad)].slice(0, 12); })()`;
    const scan = await ev(SCAN);
    ok('SL-ORANGE with a rail door open, nothing outside the allowed places paints in Flux\'s orange', Array.isArray(scan) && scan.length === 0, scan);
    await ev("(() => { const d = document.createElement('div'); d.id = 'sl-orange'; d.style.cssText = 'position:fixed;left:0;top:0;width:4px;height:4px;background:rgb(255,152,0)'; document.body.appendChild(d); return true; })()");
    const m = await ev(SCAN);
    await ev("document.getElementById('sl-orange')?.remove(); null");
    ok('MUT-SL-ORANGE one more orange element: the scan goes red (the mutant LANDED)', Array.isArray(m) && m.some((x) => x.startsWith('DIV.')) && m.length === scan.length + 1, m);
    const small = await ev("[...document.querySelectorAll('[data-reorg-rail] .wz-reorg-doors .wz-strip-item, [data-reorg-rail] .wz-strip-foot .wz-strip-item')].map((b) => { const r = b.getBoundingClientRect(); return [b.getAttribute('data-category'), Math.round(Math.min(r.width, r.height))]; })");
    ok('SL-TARGETS every rail door and foot box is at least a 44 px target', Array.isArray(small) && small.length >= 7 && small.every(([, n]) => n >= 44), small);
    await ev("document.querySelector('[data-reorg-rail] [data-category=\"reorg-docs\"]')?.click(); null");
  });
  await section(['SL-NO-PNG', 'SL-DOOR', 'SL-FONTS'], async () => {
    const PNG = "[...document.querySelectorAll('body *')].filter((e) => { const s = getComputedStyle(e); return (e.tagName === 'IMG' && /wrizo/i.test(e.currentSrc || e.src || '')) || /wrizo[^)]*\\.png/i.test(s.backgroundImage + s.maskImage); }).length";
    const onPage = await ev(PNG);
    await ev("history.replaceState(null, '', '/#/'); null");
    await app.reload();
    const live = await soft("!!document.querySelector('[data-flux-door=compose]:not([data-wait])')", 25000);
    await sleep(500);
    const onDoor = await ev(PNG);
    ok('SL-NO-PNG neither the front door nor the page draws Arbor\'s wrizo PNG', live && onPage === 0 && onDoor === 0, { live, onPage, onDoor });
    const door = await ev("(() => { const d = document.querySelector('[data-flux-door=compose]'); if (!d) return null; d.focus(); const c = d.querySelector('.cmd'), r = d.querySelector('.ring'); return { text: getComputedStyle(c).fill, ring: r.getAttribute('stroke'), focused: document.activeElement === d }; })()");
    await sleep(250);
    const ringOn = await ev("(() => { const r = document.querySelector('[data-flux-door=compose] .ring'); return r ? Number(getComputedStyle(r).opacity) : null; })()");
    ok('SL-DOOR [ COMPOSE ]\'s words are not brass, and its focus ring is the choice cyan', !!door && door.focused && !/255,\s*152,\s*0/.test(door.text) && /^#00C2FF$/i.test(door.ring) && ringOn > 0, { door, ringOn });
    await ev('document.fonts.ready.then(() => true)');
    const fonts = await ev("({ rajdhani: document.fonts.check(\"700 12px 'Rajdhani'\"), chakra: document.fonts.check(\"600 12px 'Chakra Petch'\") })");
    ok('SL-FONTS the chrome\'s two faces, Rajdhani and Chakra Petch, are really loaded on the front door', fonts.rajdhani && fonts.chakra, fonts);
  });
  await section(['SL-ORDER', 'SL-HEADS', 'SL-GRIP'], async () => {
    await open('sl-1');
    const closed = await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); return g ? getComputedStyle(g).color : null; })()");
    await ev("document.querySelector('.wz-sliver-grip')?.click(); null");
    await soft("document.querySelector('.wz-sliver-panel')?.getAttribute('data-open') === 'true'", 4000);
    await sleep(500);
    const openColour = await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); return g ? getComputedStyle(g).color : null; })()");
    ok('SL-GRIP an open drawer\'s tab is the choice cyan, never brass, and differs from the closed tab', openColour === 'rgb(0, 194, 255)' && closed !== openColour, { closed, openColour });
    const order = await ev("[...document.querySelectorAll('.wz-sliver-panel .wz-sliver-body > .wz-sliver-section')].map((s) => [...s.classList].find((c) => /^wz-sliver-(type|actions|templates|page-kind)$/.test(c)) || (s.querySelector('.wz-sliver-fieldset, .wz-sliver-format--letters') ? 'format' : 'other')).filter((x) => x !== 'other')");
    ok('SL-ORDER MARKUP\'s sections run Typeface, Format, Commands, with no Presets or kind row among them', JSON.stringify(order) === JSON.stringify(['wz-sliver-type', 'format', 'wz-sliver-actions']), order);
    const head = await ev("(document.querySelector('.wz-sliver-panel .wz-sliver-type .wz-sliver-h') || {}).textContent || null");
    await ev("document.getElementById('wz-sliver-tab-parts')?.click(); null");
    await sleep(400);
    await ev("document.querySelector('.wz-sliver-panel [data-doc-kind]')?.click(); null");
    await sleep(350);
    const menu = await ev("(document.querySelector('.wz-sliver-panel .reorg-dockind-menu, .wz-sliver-panel [data-doc-menu]') || {}).textContent || null");
    ok('SL-HEADS MARKUP\'s first head reads Typeface and TRACKS\' head menu offers Presets', head === 'Typeface' && /Presets/.test(menu || ''), { head, menu: menu && menu.slice(0, 80) });
    await ev("document.querySelector('.wz-sliver-grip')?.click(); null");
  });
  await section(['SL-PROGRESS'], async () => {
    await open('sl-1');
    const tw = await ev("[...document.querySelectorAll('.typewriter-toggle')].filter((e) => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0; }).length");
    await ev("document.querySelector('[data-reorg-rail] [data-category=\"reorg-docs\"]')?.click(); null");
    await sleep(600);
    if (!(await ev("!!document.querySelector('[data-reorg-default=\"progress\"]')"))) { await ev("document.querySelector('.wz-cascade-panel [data-session-fold]')?.click(); null"); await sleep(350); }
    const READ = "(() => { const on = document.querySelector('[data-reorg-default=\"progress\"] [data-toggle=on]'), off = document.querySelector('[data-reorg-default=\"progress\"] [data-toggle=off]'); return on && off ? { on: on.getAttribute('aria-pressed'), off: off.getAttribute('aria-pressed'), stored: (JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}')).instrumentsOn } : null; })()";
    const start = await ev(READ);
    await ev("document.querySelector('[data-reorg-default=\"progress\"] [data-toggle=off]')?.click(); null");
    await sleep(500);
    const off = await ev(READ);
    await ev("document.querySelector('[data-reorg-default=\"progress\"] [data-toggle=on]')?.click(); null");
    await sleep(500);
    const on = await ev(READ);
    ok('SL-PROGRESS DOCS\' Show the meter reports its state and writes the setting; no Typewriter toggle in TEXT', tw === 0 && !!off && off.off === 'true' && off.on === 'false' && off.stored === false && !!on && on.on === 'true' && on.off === 'false' && on.stored === true, { tw, start, off, on });
    await ev("document.querySelector('[data-reorg-rail] [data-category=\"reorg-docs\"]')?.click(); null");
  });
  await section(['SL-PAPER'], async () => {
    const sizes = {};
    for (const theme of ['flux', 'plateau', 'machina']) {
      await open('sl-2', { theme });
      sizes[theme] = await ev("(() => { const r = document.querySelector('.mode-page').getBoundingClientRect(); return { w: r.width, h: r.height }; })()");
    }
    const near = (a, b) => Math.abs(a - b) <= 0.6;
    ok('SL-PAPER the paper is the same size in Flux, Arbor and Machina at 1366 x 768, each on its own default', near(sizes.flux.w, sizes.plateau.w) && near(sizes.flux.h, sizes.plateau.h) && near(sizes.flux.w, sizes.machina.w) && near(sizes.flux.h, sizes.machina.h), sizes);
    await ev("localStorage.setItem('wrizo-theme', 'flux'); null");
  });
  await section(['SL-POPOUT'], async () => {
    process.env.WS_ANON = '1';
    await ev("history.replaceState(null, '', '/#/'); null");
    await app.reload();
    const live = await soft("!!document.querySelector('[data-flux-door=login]:not([data-wait])')", 25000);
    const p = live ? await ev("(() => { const b = document.querySelector('[data-flux-door=login]').getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()") : null;
    if (p) { await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); }
    const opened = await soft("!!document.querySelector('.wz-popout[data-popout=signin]')", 5000);
    await sleep(500);
    const panel = await ev("(() => { const a = document.querySelector('.wz-popout'); return a ? { dialogs: document.querySelectorAll('.wz-popout').length, modal: a.getAttribute('role') === 'dialog' && a.getAttribute('aria-modal') === 'true', first: document.activeElement === a.querySelector('input.wz-field') } : null; })()");
    await key('Escape', 'Escape', 27);
    const back = await soft("!document.querySelector('.wz-popout') && !!document.querySelector('[data-flux-door=compose]')", 5000);
    process.env.WS_ANON = '0';
    ok('SL-POPOUT signed out, [ LOG IN ] opens the one sign-in dialog with the focus in its first field, and Escape gives the doors back', opened && !!panel && panel.dialogs === 1 && panel.modal && panel.first && back, { live, opened, panel, back });
  });
  ok('SL-PREMISE every page read here is the live Flux: the redesign and the reorg by default, no ?flux3 or ?reorg in the address', premises.length === 3 && premises.every(isLive) && seeded.link === true, { premises, link: seeded.link });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1200)}`);
const EXPECTED = 30;   // 19 + the second batch's ten and MUT-SL-ORANGE
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nFLUX-LIVE-SUCCESSORS VERIFY: PASS (${checks.length} checks)`
  : `\nFLUX-LIVE-SUCCESSORS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
