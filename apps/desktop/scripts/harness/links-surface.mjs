// TOOLS - WEB LINKS IN THE PAGE TEXT, THE SURFACE (Fable's spec, Oct 31 / Nov 4). HARNESS ONLY, WRITTEN RED ON MAIN BY DESIGN: the product build waits for #13 and the anti-slop paste rail.
// A committed CDP scenario; needs a box turn and a fresh build (`npx vite build --outDir dist-web --emptyOutDir`). It does what a writer does with the real pointer and keyboard, then reads the DOM and the STORED text.
// Browserless text rules (the reader, blocked schemes, nesting, exports, save/sync) are scripts/harness/links-core.mjs - this file is the part that needs a page.
//   L  LOOK     a link is the Wrizors' page-link look: a DASHED underline in the page's own ink, in every skin; the address is not shown on the page while the caret is elsewhere
//   C  CLICK    a plain click is the caret (nothing opens, the caret lands in the link text); Ctrl+click AND Cmd+click open the address - once, in a new tab, with NO referrer; the app itself does not navigate
//   P  PASTE    words selected + a clipboard that is a LONE allowed address (https / http / mailto) -> a link around those words, no text enters; anything else (no selection, a blocked scheme, an address inside a
//               sentence) makes no link. This runs BEFORE the anti-slop paste rail (the rail lands first, so the ordering check is added when it does)
//   K  KEY      Ctrl+K (Windows / Linux) and Cmd+K (Mac): with words selected a field takes the keyboard, an address typed and Enter makes the link; Escape and a blocked address leave the words untouched
//   B  BUTTON   a Link button in Format does the same as Ctrl/Cmd+K
//   S  SAVE     the link made survives a save and a reload (the stored text is the mark; the page paints it again)
//   N  NEVER    the app never fetches a link - no request to the address, from the page being drawn, hovered, clicked or Ctrl-clicked
// Contract notes (the build may rename a hook; the checks read what a writer can see, so they should not need to): the link field is "an input or textarea outside the page that takes focus"; the Link button is
// a button in the Format fieldset whose title / aria-label is "Link"; "opens" is either window.open or a click on an <a href> (both are recorded, the click is cancelled so nothing leaves the harness).
// Run (from apps/desktop, needs a box turn):  node scripts/harness/links-surface.mjs
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 300)}]` : ''}`); };
const SKINS = [['plateau', 'Arbor', null], ['flux', 'Flux', null], ['machina', 'Machina', 'cool']];
const HOST = 'links-never-fetched.test';
const ADDR = `https://${HOST}/a/b`;
const ED = '.forward-only-editor';
const SEL = "(() => { const s = window.getSelection(); return s ? s.toString() : ''; })()";

const freshDesk = async (app, theme, cast) => {
  await app.emulateDpr(1, 1280, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-splash-hold', '50');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('${theme}'); ${cast ? `window.wrizoCast && window.wrizoCast.set('${cast}')` : ''}`);
};
const openPage = async (app, id, text, mode = 'drafting') => {
  await app.evalJs(`window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: ${JSON.stringify(text)}, createdAt: new Date().toISOString(), origin: null, source: 'page' })`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)})`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: `${mode} page` });
  await sleep(500);
};
const openDrawer = async (app) => {
  if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') await app.evalJs("document.querySelector('.wz-sliver-grip') && document.querySelector('.wz-sliver-grip').click()");
  await sleep(500);
};
// the stored text of a page - what the writer's words ARE, as saved
const stored = async (app, id) => {
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()');
  const rows = (await app.localJSON('writer-studio-journal-entries')) || [];
  const row = (Array.isArray(rows) ? rows : Object.values(rows)).find((r) => r && r.id === id);
  return row ? row.text : null;
};
const CENTRE = (word) => `(() => { const root = document.querySelector('${ED}'); const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const i = n.data.indexOf(${JSON.stringify(word)}); if (i < 0) continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ${JSON.stringify(word)}.length);
    const b = r.getBoundingClientRect(); if (b.width > 0) return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; }
  return null; })()`;
const highlight = async (app, word) => {
  const p = await app.evalJs(CENTRE(word));
  if (!p) return false;
  await app.doubleClick(p.x, p.y);
  await sleep(300);
  return String(await app.evalJs(SEL)).trim() === word;
};
// a real click, optionally with Ctrl (2) or Cmd (4) held
const clickAt = async (app, x, y, modifiers = 0) => {
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, modifiers, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, modifiers, pointerType: 'mouse' });
  await sleep(250);
};
const RECORD = `(() => { window.__opened = []; window.__fetched = [];
  const wo = window.open; window.open = (u, t, f) => { window.__opened.push({ via: 'open', url: String(u), target: t || '', features: String(f || '') }); return null; };
  document.addEventListener('click', (e) => { const a = e.target && e.target.closest && e.target.closest('a[href]'); if (a) { window.__opened.push({ via: 'anchor', url: a.href, rel: a.rel || '', target: a.target || '' }); e.preventDefault(); } }, true);
  const f = window.fetch; window.fetch = function (u) { window.__fetched.push(String(u && u.url || u)); return f.apply(this, arguments); };
  const xo = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function (m, u) { window.__fetched.push(String(u)); return xo.apply(this, arguments); };
  if (navigator.sendBeacon) { const sb = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = (u, d) => { window.__fetched.push(String(u)); return sb(u, d); }; }
  return true; })()`;
const opened = async (app) => (await app.evalJs('JSON.stringify(window.__opened || [])').then((s) => JSON.parse(s)));
const noReferrer = (o) => (o.via === 'open' ? /noreferrer/i.test(o.features) : /noreferrer/i.test(o.rel));
const newTab = (o) => (o.via === 'open' ? (o.target === '_blank' || o.target === '') : o.target === '_blank');
const paste = (app, text) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const dt = new DataTransfer(); dt.setData('text/plain', ${JSON.stringify(text)});
  ed.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt })); return true; })()`);
// the link field: an input / textarea OUTSIDE the page that has the keyboard
const FIELD = "(() => { const a = document.activeElement; const ed = document.querySelector('.forward-only-editor'); return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && !(ed && ed.contains(a)) && !(a.classList && a.classList.contains('wz-type-num')); })()";
const LINK_BTN = "(() => { const b = [...document.querySelectorAll('.wz-sliver-fieldset button, .wz-sliver button')].find((x) => /^link$/i.test((x.getAttribute('title') || x.getAttribute('aria-label') || '').trim())); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()";
const makeViaField = async (app, trigger, address) => {
  await trigger();
  await sleep(300);
  const has = await app.evalJs(FIELD);
  if (has) { await app.type(address); await sleep(100); await app.key('Enter'); await sleep(350); }
  return has;
};

await withHarness(async (app) => {
 try {
  // ==== L - the look, in every skin ====
  for (const [theme, name, cast] of SKINS) {
    await freshDesk(app, theme, cast);
    await openPage(app, `lk-look-${theme}`, `Read [the docs](${ADDR}) then go on.`);
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
    await sleep(300);
    const look = await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) { const i = n.data.indexOf('docs'); if (i < 0) continue; const cs = getComputedStyle(n.parentElement), ec = getComputedStyle(ed);
        return { line: cs.textDecorationLine, style: cs.textDecorationStyle, deco: cs.textDecorationColor, ink: ec.color, ownInk: cs.color, shown: ed.innerText.includes(${JSON.stringify(HOST)}) }; }
      return null; })()`);
    ok(`L [${name}] LOOK: the link's words are drawn with a DASHED underline`, !!look && /underline/.test(look.line) && look.style === 'dashed', JSON.stringify(look));
    ok(`L [${name}] LOOK: the underline is in the page's own ink - the same colour as the words around it (no link blue)`, !!look && look.deco === look.ink && look.ownInk === look.ink, JSON.stringify(look));
    ok(`L [${name}] LOOK: the address is not shown on the page while the caret is elsewhere - the page shows the words`, !!look && look.shown === false, JSON.stringify(look));
  }

  // ==== C - click vs Ctrl/Cmd+click ====
  await freshDesk(app, 'plateau', null);
  await openPage(app, 'lk-click', `Read [the docs](${ADDR}) then go on.`);
  await app.evalJs(RECORD);
  const hashBefore = await app.evalJs('location.hash');
  let p = await app.evalJs(CENTRE('docs'));
  ok('C DRIVER: the words of the link are on the page to click', !!p, JSON.stringify(p));
  await clickAt(app, p.x, p.y, 0);
  let o = await opened(app);
  const caret = await app.evalJs(`(() => { const s = window.getSelection(); const ed = document.querySelector('${ED}'); return { collapsed: !!s && s.isCollapsed, inside: !!s && !!s.anchorNode && ed.contains(s.anchorNode) }; })()`);
  ok('C CLICK: a plain click is the CARET - nothing opens, the caret lands in the page', o.length === 0 && caret.collapsed && caret.inside, JSON.stringify({ o, caret }));
  p = await app.evalJs(CENTRE('docs'));
  await clickAt(app, p.x, p.y, 2);
  o = await opened(app);
  ok('C CTRL: Ctrl+click OPENS the address - once, in a new tab, with no referrer', o.length === 1 && o[0].url.replace(/\/$/, '') === ADDR && newTab(o[0]) && noReferrer(o[0]), JSON.stringify(o));
  await app.evalJs('window.__opened = []');
  p = await app.evalJs(CENTRE('docs'));
  await clickAt(app, p.x, p.y, 4);
  o = await opened(app);
  ok('C CMD: Cmd+click (the Mac chord) opens it the same way', o.length === 1 && o[0].url.replace(/\/$/, '') === ADDR && newTab(o[0]) && noReferrer(o[0]), JSON.stringify(o));
  ok('C CTRL: the app itself does not navigate - the writer is still on the page', (await app.evalJs('location.hash')) === hashBefore && !!(await app.evalJs(`!!document.querySelector('${ED}')`)), await app.evalJs('location.hash'));
  p = await app.evalJs(CENTRE('then'));
  await app.evalJs('window.__opened = []');
  await clickAt(app, p.x, p.y, 2);
  ok('C CTRL: Ctrl+click on words that are NOT a link opens nothing', (await opened(app)).length === 0, JSON.stringify(await opened(app)));

  // ==== P - paste over a selection ====
  await freshDesk(app, 'plateau', null);
  const PASTES = [
    ['https', 'https://links.example.test/p', true, 'a lone https address over selected words'],
    ['http', 'http://links.example.test/p', true, 'a lone http address'],
    ['mailto', 'mailto:someone@example.test', true, 'a lone mailto address'],
    ['padded', '  https://links.example.test/p\n', true, 'a lone address with the whitespace a copy brings along'],
    ['javascript', 'javascript:alert(1)', false, 'a lone javascript: address (blocked scheme)'],
    ['data', 'data:text/html;base64,PGI+eA==', false, 'a lone data: address (blocked scheme)'],
    ['sentence', 'see https://links.example.test/p for more', false, 'an address INSIDE a sentence (not lone)'],
    ['two', 'https://links.example.test/p https://links.example.test/q', false, 'two addresses'],
  ];
  for (const [key, clip, makes, what] of PASTES) {
    const id = `lk-paste-${key}`;
    await openPage(app, id, 'Read the docs here and go on.');
    const hl = await highlight(app, 'docs');
    await paste(app, clip);
    await sleep(400);
    const t = await stored(app, id);
    if (makes) ok(`P [${key}] PASTE: ${what} makes a link around the selected words - no text enters`, hl && t === `Read the [docs](${clip.trim()}) here and go on.`, JSON.stringify({ hl, t }));
    else ok(`P [${key}] PASTE: ${what} makes NO link (it goes to the paste rail, whatever the rail does)`, hl && typeof t === 'string' && !/\]\((https?|mailto|javascript|data):/i.test(t), JSON.stringify({ hl, t }));
  }
  {
    await openPage(app, 'lk-paste-none', 'Read the docs here and go on.');
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
    await paste(app, 'https://links.example.test/p');
    await sleep(400);
    const t = await stored(app, 'lk-paste-none');
    ok('P [none] PASTE: a lone address with NO words selected makes no link - there is nothing to be the link\'s words', typeof t === 'string' && !/\]\(https?:/.test(t), JSON.stringify(t));
  }

  // ==== K - Ctrl+K / Cmd+K ====
  const FIELDS = [['ctrl', 'Ctrl+K', () => app.keyCombo('k')], ['cmd', 'Cmd+K', () => app.keyCombo('k', { useMeta: true })]];
  for (const [key, label, press] of FIELDS) {
    const id = `lk-key-${key}`;
    await openPage(app, id, 'Read the docs here and go on.');
    const hl = await highlight(app, 'docs');
    const had = await makeViaField(app, press, 'https://links.example.test/k');
    const t = await stored(app, id);
    ok(`K [${label}] KEY: with words selected a field takes the keyboard; an address typed and Enter makes the link`, hl && had && t === 'Read the [docs](https://links.example.test/k) here and go on.', JSON.stringify({ hl, field: had, t }));
  }
  {
    await openPage(app, 'lk-key-esc', 'Read the docs here and go on.');
    const hl = await highlight(app, 'docs');
    await app.keyCombo('k'); await sleep(300);
    const had = await app.evalJs(FIELD);
    if (had) { await app.type('https://links.example.test/k'); await app.key('Escape'); await sleep(350); }
    const t = await stored(app, 'lk-key-esc');
    ok('K [Esc] KEY: Escape in the field leaves the words exactly as they were', hl && had && t === 'Read the docs here and go on.', JSON.stringify({ hl, field: had, t }));
    await openPage(app, 'lk-key-bad', 'Read the docs here and go on.');
    const hl2 = await highlight(app, 'docs');
    const had2 = await makeViaField(app, () => app.keyCombo('k'), 'javascript:alert(1)');
    const t2 = await stored(app, 'lk-key-bad');
    ok('K [blocked] KEY: a blocked address typed into the field makes no link and leaves the words as they were', hl2 && had2 && typeof t2 === 'string' && !/\]\(javascript:/i.test(t2) && t2.includes('Read the docs here'), JSON.stringify({ hl2, field: had2, t2 }));
    await openPage(app, 'lk-key-none', 'Read the docs here and go on.');
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
    await app.keyCombo('k'); await sleep(300);
    const stray = await app.evalJs(FIELD);
    const t3 = await stored(app, 'lk-key-none');
    ok('K [no words] KEY: with NO words selected, Ctrl+K makes nothing - the page\'s text is untouched', t3 === 'Read the docs here and go on.', JSON.stringify({ stray, t3 }));
  }

  // ==== B - the Link button in Format ====
  await openPage(app, 'lk-btn', 'Read the docs here and go on.');
  await openDrawer(app);
  const btn = await app.evalJs(LINK_BTN);
  ok('B BUTTON: Format has a Link button', !!btn, JSON.stringify(btn));
  const hlb = await highlight(app, 'docs');
  const bp = await app.evalJs(LINK_BTN);
  const had = await makeViaField(app, async () => { if (bp) { await app.mouseDown(bp.x, bp.y); await app.mouseUp(bp.x, bp.y); } }, 'https://links.example.test/b');
  const tb = await stored(app, 'lk-btn');
  ok('B BUTTON: with words selected, the Link button does what Ctrl+K does - a field, an address, Enter, the link', hlb && had && tb === 'Read the [docs](https://links.example.test/b) here and go on.', JSON.stringify({ hlb, field: had, tb }));

  // ==== S - save and reload ====
  await freshDesk(app, 'plateau', null);
  await openPage(app, 'lk-save', 'Read the docs here and go on.');
  await highlight(app, 'docs');
  await paste(app, 'https://links.example.test/s');
  await sleep(400);
  const before = await stored(app, 'lk-save');
  await app.reload();
  await app.evalJs("location.hash = '#/page/lk-save'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'reopened' });
  await sleep(600);
  const after = await stored(app, 'lk-save');
  const drawn = await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const i = n.data.indexOf('docs'); if (i < 0) continue; const cs = getComputedStyle(n.parentElement); return { style: cs.textDecorationStyle, line: cs.textDecorationLine }; } return null; })()`);
  ok('S SAVE: the link made by a paste is saved and survives a reload - the stored text is the mark, and the page paints it again', before === 'Read the [docs](https://links.example.test/s) here and go on.' && after === before && !!drawn && drawn.style === 'dashed', JSON.stringify({ before, after, drawn }));

  // ==== N - never fetched ====
  await freshDesk(app, 'plateau', null);
  await openPage(app, 'lk-never', `Read [the docs](${ADDR}) then [mail me](mailto:someone@example.test).`);
  await app.evalJs(RECORD);
  const q = await app.evalJs(CENTRE('docs'));
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: q.x, y: q.y });
  await sleep(600);
  await clickAt(app, q.x, q.y, 0);
  await clickAt(app, q.x, q.y, 2);
  await sleep(800);
  const net = await app.evalJs(`JSON.stringify({ fetched: window.__fetched, resources: performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.includes(${JSON.stringify(HOST)}) || n.includes('example.test')) })`).then((s) => JSON.parse(s));
  ok('N NEVER: the app never fetches a link - no request to the address from the page drawn, hovered, clicked or Ctrl-clicked', net.fetched.filter((u) => u.includes('example.test')).length === 0 && net.resources.length === 0, JSON.stringify(net));
 } catch (e) { ok('driver ran to a verdict', false, String((e && e.stack) || e)); }
}).catch((e) => { ok('harness ran to a verdict', false, String((e && e.stack) || e)); });

const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `LINKS-SURFACE VERIFY: FAIL (${failed.length} of ${checks.length})` : `LINKS-SURFACE VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
