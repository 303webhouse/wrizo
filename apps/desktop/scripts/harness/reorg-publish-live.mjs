// PUBLISHING AS A VIEW + EXPORT, IN THE APP (INK; Fable Nov 20, 11:45 am: "the whole Doc as one read-only scroll, each Part under its heading, as the prototype draws it (stage-table.js, FINALIZE);
// export the whole Doc or chosen Parts in order, today's .md/.txt. Red-first; switch-gated; no new saved data"). Machina only, behind ?reorg=1, on a Page. The pure half (the file's text) is
// reorg-publish-unit.mjs; this file proves what only the app can: the sheet over the paper, the way back, the downloads, and that nothing is saved.
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer and its app-made set):
//   Grants       a set she made, "Budget": three pages -> one Doc, three Parts: "Opening" (named, level 0), an unnamed one (level 1), "Close" (named, level 0)
//   Top Drawer   its app-made set: one loose page, "A loose page, alone." (a one-Part Doc)
//
// OFF   M0  switch off in Machina (Publish still opens today's dialog), and on in Arbor and Flux: no sheet, ever
// VIEW  V1  Publish opens the sheet: the Doc's title, then every Part in her order under its heading ("1. Opening", "2. <its first words>", "3. Close"), the levels drawn, her words in each
//       V2  read-only: nothing inside the sheet takes typing, and keys pressed while it is open change no stored word
//       V3  PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are identical closed, open and closed again; the editor is the same node; her caret is where she left it
//       V4  the way back is one tap: Back to writing, the Publish tab again, a stage tab, or Escape; the Publish tab is the selected one while it is open
//       V5  the sheet is session state: moving to another Part closes it
// FILE  E1  the whole Doc as .md and as .txt, in order: the exact text (title, the headings she named, her words; none invented for the unnamed Part)
//       E2  chosen Parts: unticking Part 2 sends Parts 1 and 3 only, in the Doc's order, named "Budget (2 of 3 Parts)"; the count line says "2 of 3 Parts go out"
//       E3  nothing ticked: both downloads are disabled
//       E4  a loose page: no title, no number, no ticks; its words are the whole file
// QUIET S1  open, tick, export, close store NOTHING: every entry's text, boxes, page settings and links are byte-identical, and no localStorage key is new
// FINALIZE (Fable, Nov 20, 1:27 pm)
//       F1  Export > Web (HTML) beside Markdown and Plain Text: the labels, a whole web page in the Doc's order, named Budget.html
//       F2  Copy Text and Copy as Formatted on the clipboard's own door, for the Parts chosen, each saying Copied
//       F3  the Front menu while the sheet is open: TEXT (and INK) greyed and doing nothing, PARTS holding the note, the ticks and the order
//       F4  a tick in the Front menu is the sheet's tick, and the other way round
//       F5  an order made in the Front menu is the Doc's order (sheet, file and stored order agree, no word moved); going back gives TEXT its tab again
// WORDS W1  every word the sheet draws is a lexicon key (terms.ts and the canonical table), and none is written into the component
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-publish-live.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
const ENTRIES = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).map((e) => [e.id, e.text ?? null, e.boxes ?? null, e.pageSettings ?? null, e.pageLinks ?? null, e.projectId ?? null, e.orderIndex ?? null])";
const KEYS = "Object.keys(localStorage).sort()";
const SHEET = `(() => {
  const s = document.querySelector('[data-reorg-pub]');
  if (!s) return null;
  const parts = [...s.querySelectorAll('[data-pub-part]')].map((p) => ({ id: p.getAttribute('data-pub-part'), level: p.getAttribute('data-level'), head: (p.querySelector('.reorg-pub-head')?.textContent || '').trim(), words: (p.querySelector('.reorg-pub-words')?.textContent || '').trim(), tick: !!p.querySelector('input[type=checkbox]'), on: p.getAttribute('data-pub-in') }));
  return { title: (s.querySelector('.reorg-pub-title')?.textContent || '').trim(), parts, editable: !!s.querySelector('[contenteditable=true], textarea, input[type=text]'), count: (s.querySelector('[data-pub-count]')?.textContent || '').trim(),
    md: !!s.querySelector('[data-pub-export="md"]'), mdOff: !!s.querySelector('[data-pub-export="md"]')?.disabled, txtOff: !!s.querySelector('[data-pub-export="txt"]')?.disabled };
})()`;
const TABS = "[...document.querySelectorAll('.reorg-top .desk-mode-tab')].map((b) => b.getAttribute('data-mode-key') + ':' + b.getAttribute('aria-selected')).join(',')";
const CATCH = "(() => { window.__pbBlobs = []; const B = window.Blob; window.Blob = function (parts, o) { window.__pbBlobs.push({ text: parts.join(''), type: o && o.type, name: null }); return new B(parts, o); }; window.Blob.prototype = B.prototype; HTMLAnchorElement.prototype.click = function () { const l = window.__pbBlobs[window.__pbBlobs.length - 1]; if (l && !l.name) l.name = this.download; }; return true; })()";
const at = (id) => `location.hash.indexOf('/page/${id}') >= 0`;
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const topSet = await app.evalJs("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id); return p && p.id; })()");
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const budget = W.wrizoCreateProject('Budget'); W.wrizoSetProjectDrawer(budget.id, grants.id);
    page('pub-loose', 'A loose page, alone.', { origin: 'project', projectId: ${q(topSet)}, orderIndex: 0 });
    page('pub-1', 'Opening words here.\\nSecond line **bold**.', { origin: 'project', projectId: budget.id, orderIndex: 0 });
    page('pub-2', 'Middle words unnamed.', { origin: 'project', projectId: budget.id, orderIndex: 1 });
    page('pub-3', 'Closing words.', { origin: 'project', projectId: budget.id, orderIndex: 2 });
    // a Part's own name and level are keys inside pageSettings (reorg/parts.ts), absent where she never chose
    W.wrizoPatchEntry('pub-1', { pageSettings: ${PS}, name: 'Opening', level: 0 } });
    W.wrizoPatchEntry('pub-2', { pageSettings: ${PS}, level: 1 } });
    W.wrizoPatchEntry('pub-3', { pageSettings: ${PS}, name: 'Close', level: 0 } });
    W.wrizoFlushNow();
    return null;
  })()`);
}

async function open(app, theme, reorg, id, w = 1366) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-frame-host .sprint-nav') && !!document.querySelector('.forward-only-editor')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const sheetOpen = async (app) => { await app.waitFor("!!document.querySelector('[data-reorg-pub]')", { timeout: 4000, label: 'the sheet' }).catch(() => {}); await sleep(250); return app.evalJs("!!document.querySelector('[data-reorg-pub]')"); };
const sheetGone = async (app) => { await sleep(300); return app.evalJs("!document.querySelector('[data-reorg-pub]')"); };
const tab = (k) => press(`.reorg-top .desk-mode-tab[data-mode-key="${k}"]`);

await withHarness(async (app) => {
  await seed(app);

  // ---- OFF -------------------------------------------------------------------------------------------------------------------------------
  const offs = {};
  for (const [theme, reorg] of [['machina', false], ['plateau', true], ['flux', true]]) {
    await open(app, theme, reorg, 'pub-2');
    const pressed = await app.evalJs("(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key=\"publish\"]'); if (!b) return false; b.click(); return true; })()");
    await sleep(500);
    offs[`${theme}.${reorg ? 'on' : 'off'}`] = await app.evalJs(`({ sheet: !!document.querySelector('[data-reorg-pub]'), dialog: !!document.querySelector('.sprint-modal'), pressed: ${pressed} })`);
  }
  ok('M0 switch off in Machina (Publish still opens today\'s dialog), and on in Arbor and Flux: no sheet, ever',
    !offs['machina.off'].sheet && offs['machina.off'].dialog && Object.keys(offs).filter((k) => k !== 'machina.off').every((k) => !offs[k].sheet), offs);

  // ---- VIEW ------------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pub-2');
  const tabs0 = await app.evalJs(TABS);
  await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]'));
  const opened = await sheetOpen(app);
  const v1 = await app.evalJs(SHEET);
  const tabs1 = await app.evalJs(TABS);
  ok('V1 Publish opens the sheet: the title, then every Part in her order under its heading, the levels drawn, her words in each',
    opened && !!v1 && v1.title === 'Budget' && v1.parts.length === 3 && v1.parts.map((p) => p.id).join(',') === 'pub-1,pub-2,pub-3'
    && v1.parts[0].head === '1. Opening' && /^2\. Middle words/.test(v1.parts[1].head) && v1.parts[2].head === '3. Close'
    && v1.parts.map((p) => p.level).join(',') === '0,1,0' && /Opening words here\./.test(v1.parts[0].words) && /Middle words unnamed\./.test(v1.parts[1].words) && /Closing words\./.test(v1.parts[2].words) && v1.parts.every((p) => p.tick), { opened, v1 });

  const st0 = await app.evalJs("((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'pub-2') || {}).text || '')");
  for (const ch of 'zzz') { await app.typeKeys(ch); await sleep(60); }
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(500);
  const st1 = await app.evalJs("((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'pub-2') || {}).text || '')");
  const edText = await app.evalJs("document.querySelector('.forward-only-editor')?.textContent || ''");
  ok('V2 read-only: nothing inside the sheet takes typing, and keys pressed while it is open change no stored word and none in the editor under it',
    !!v1 && !v1.editable && st0 === st1 && !/zzz/.test(st1) && !/zzz/.test(edText), { editable: v1 && v1.editable, st0, st1, edText: edText.slice(0, 80) });

  // the Publish tab is the selected one while it is open
  ok('V4a while the sheet is open the Publish tab is the selected one, and no writing mode is',
    /publish:true/.test(tabs1) && !/(freewrite|draft|revise):true/.test(tabs1) && !/publish:true/.test(tabs0), { tabs0, tabs1 });

  // PAGE IS PRIMARY
  const geo = {};
  for (const w of [1366, 1920]) {
    await open(app, 'machina', true, 'pub-2', w);
    await app.evalJs("window.__pbEditor = document.querySelector('.forward-only-editor'); document.querySelector('.forward-only-editor').focus(); const r = document.createRange(); const e = document.querySelector('.forward-only-editor'); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); window.__pbCaret = [s.anchorOffset, s.anchorNode && s.anchorNode.textContent]; null");
    const closed0 = await app.evalJs(PAGE);
    await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]'));
    await sheetOpen(app);
    const openRect = await app.evalJs(PAGE);
    const sheetFits = await app.evalJs("(() => { const s = document.querySelector('[data-reorg-pub]'), p = document.querySelector('.mode-page'); if (!s || !p) return null; const a = s.getBoundingClientRect(), b = p.getBoundingClientRect(); const k = b.width / p.offsetWidth || 1; const d = [a.left - (b.left + p.clientLeft * k), a.top - (b.top + p.clientTop * k), a.width - p.clientWidth * k, a.height - p.clientHeight * k].map((x) => Math.round(x * 10) / 10); return d.every((x) => Math.abs(x) < 1.5) ? true : d; })()");
    await app.evalJs(press('[data-pub-back]'));
    await sheetGone(app);
    const closed1 = await app.evalJs(PAGE);
    const same = await app.evalJs("document.querySelector('.forward-only-editor') === window.__pbEditor");
    const caret = await app.evalJs("(() => { const s = getSelection(); return [s.anchorOffset, s.anchorNode && s.anchorNode.textContent]; })()");
    const caretBefore = await app.evalJs('window.__pbCaret');
    geo[w] = { closed0, openRect, closed1, same, sheetFits, caretKept: JSON.stringify(caret) === JSON.stringify(caretBefore) };
  }
  ok('V3 PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same closed, open and closed again; the sheet lies exactly over the paper; the editor is the same node; her caret is where she left it',
    Object.values(geo).every((g) => g.closed0 && g.closed0 === g.openRect && g.openRect === g.closed1 && g.same && g.sheetFits === true && g.caretKept), geo);

  // the way back
  await open(app, 'machina', true, 'pub-2');
  const back = {};
  const reopen = async () => { await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); return sheetOpen(app); };
  back.open1 = await reopen(); await app.evalJs(press('[data-pub-back]')); back.back = await sheetGone(app);
  back.open2 = await reopen(); await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); back.publishAgain = await sheetGone(app);
  back.open3 = await reopen(); await app.evalJs(tab('draft')); back.stageTab = await sheetGone(app);
  back.draftSelected = /draft:true/.test(await app.evalJs(TABS));
  back.open4 = await reopen(); await app.evalJs("document.querySelector('[data-reorg-pub]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); back.escape = await sheetGone(app);
  ok('V4 the way back is one tap: Back to writing, the Publish tab again, a stage tab (it takes her to that mode), or Escape',
    back.open1 && back.back && back.open2 && back.publishAgain && back.open3 && back.stageTab && back.draftSelected && back.open4 && back.escape, back);

  await reopen();
  await app.evalJs("location.hash = '#/page/pub-3'; null");
  await app.waitFor(`${at('pub-3')} && !!document.querySelector('.forward-only-editor')`, { timeout: 8000, label: 'Part 3' }).catch(() => {});
  await sleep(700);
  ok('V5 the sheet is session state: moving to another Part closes it', await sheetGone(app) && await app.evalJs(at('pub-3')), '');

  // ---- FILES -----------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pub-2');
  const k0 = await app.evalJs(KEYS), sQ0 = await app.evalJs(ENTRIES);
  await app.evalJs(CATCH);
  await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sheetOpen(app);
  await app.evalJs(press('[data-pub-export="md"]')); await sleep(200);
  await app.evalJs(press('[data-pub-export="txt"]')); await sleep(200);
  const all = await app.evalJs('window.__pbBlobs');
  const wantMd = '# Budget\n\n## Opening\n\nOpening words here.\nSecond line **bold**.\n\nMiddle words unnamed.\n\n## Close\n\nClosing words.\n';
  const wantTxt = 'Budget\n\nOpening\n\nOpening words here.\nSecond line bold.\n\nMiddle words unnamed.\n\nClose\n\nClosing words.\n';
  ok('E1 the whole Doc as .md and as .txt, in order: the exact text (the title, the headings she named, her words; no heading invented for the unnamed Part)',
    all.length === 2 && all[0].text === wantMd && all[0].name === 'Budget.md' && all[1].text === wantTxt && all[1].name === 'Budget.txt' && /markdown/.test(all[0].type) && /plain/.test(all[1].type), all);

  await app.evalJs("window.__pbBlobs.length = 0; null");
  await app.evalJs("document.querySelector('[data-pub-part=\"pub-2\"] input[type=checkbox]').click(); null"); await sleep(250);
  const mid = await app.evalJs(SHEET);
  await app.evalJs(press('[data-pub-export="md"]')); await sleep(200);
  const some = await app.evalJs('window.__pbBlobs');
  const wantSome = '# Budget\n\n## Opening\n\nOpening words here.\nSecond line **bold**.\n\n## Close\n\nClosing words.\n';
  ok('E2 chosen Parts: with Part 2 unticked the file holds Parts 1 and 3 only, in the Doc\'s order, named "Budget (2 of 3 Parts).md"; the count line says "2 of 3 Parts go out"',
    some.length === 1 && some[0].text === wantSome && some[0].name === 'Budget (2 of 3 Parts).md' && /2 of 3 Parts go out/.test(mid.count) && mid.parts[1].on === 'false', { some, count: mid.count });

  await app.evalJs("document.querySelector('[data-pub-none]').click(); null"); await sleep(250);
  const none = await app.evalJs(SHEET);
  ok('E3 nothing ticked: both downloads are disabled', none.mdOff && none.txtOff && /0 of 3 Parts go out/.test(none.count), none);

  await app.evalJs("document.querySelector('[data-pub-all]').click(); null"); await sleep(200);
  await app.evalJs(press('[data-pub-back]')); await sheetGone(app);
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(500);
  const sQ1 = await app.evalJs(ENTRIES), k1 = await app.evalJs(KEYS);
  ok('S1 open, tick, export and close store nothing: every entry\'s text, boxes, page settings and links are byte-identical, and no localStorage key is new',
    JSON.stringify(sQ0) === JSON.stringify(sQ1) && k1.every((k) => k0.includes(k)), { before: sQ0.length, after: sQ1.length, newKeys: k1.filter((k) => !k0.includes(k)) });

  // ---- A LOOSE PAGE ----------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pub-loose');
  await app.evalJs(CATCH);
  await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sheetOpen(app);
  const e4 = await app.evalJs(SHEET);
  await app.evalJs(press('[data-pub-export="md"]')); await sleep(200);
  const e4f = await app.evalJs('window.__pbBlobs');
  ok('E4 a loose page: no title, no number, no ticks; its words are the whole file',
    !!e4 && e4.title === '' && e4.parts.length === 1 && e4.parts[0].head === '' && !e4.parts[0].tick && e4f.length === 1 && e4f[0].text === 'A loose page, alone.\n' && e4f[0].name === 'A loose page, alone.md', { e4, e4f });

  // a missing node or a thrown page eval ends the FINALIZE checks with one honest failure, never a crash that hides every verdict above it
  try {
  // ---- FINALIZE (Fable, Nov 20, 1:27 pm) ---------------------------------------------------------------------------------------------------
  // F1 Export > Web (HTML) beside Markdown and Plain Text
  await open(app, 'machina', true, 'pub-2');
  await app.evalJs(CATCH);
  await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sheetOpen(app);
  const labels = await app.evalJs("(() => { const s = document.querySelector('[data-reorg-pub]'); return { exportLabel: (s.querySelector('[data-pub-exportlabel]')?.textContent || '').trim(), md: (s.querySelector('[data-pub-export=\"md\"]')?.textContent || '').trim(), txt: (s.querySelector('[data-pub-export=\"txt\"]')?.textContent || '').trim(), html: (s.querySelector('[data-pub-export=\"html\"]')?.textContent || '').trim(), copyText: (s.querySelector('[data-pub-copy=\"text\"]')?.textContent || '').trim(), copyFormatted: (s.querySelector('[data-pub-copy=\"formatted\"]')?.textContent || '').trim() }; })()");
  await app.evalJs(press('[data-pub-export="html"]')); await sleep(250);
  const web = await app.evalJs('window.__pbBlobs');
  const h = web[0] ? web[0].text : '';
  const at1 = (s) => h.indexOf(s);
  const inOrder = [at1('<h1>Budget</h1>'), at1('<h2>Opening</h2>'), at1('Opening words here.'), at1('Middle words unnamed.'), at1('<h2>Close</h2>'), at1('Closing words.')];
  ok('F1 Export > Web (HTML): the labels read Markdown, Plain Text, Web (HTML) after "Export"; the page is whole (doctype, charset, title), holds the title, the headings she named and every Part\'s words in the Doc\'s order, no heading for the unnamed Part, no script, and is named Budget.html',
    labels.exportLabel.startsWith('Export') && labels.md === 'Markdown' && labels.txt === 'Plain Text' && labels.html === 'Web (HTML)' && labels.copyText === 'Copy Text' && labels.copyFormatted === 'Copy as Formatted'
    && web.length === 1 && web[0].name === 'Budget.html' && /text\/html/.test(web[0].type) && /^<!doctype html>/.test(h) && /<meta charset="utf-8">/.test(h) && /<title>Budget<\/title>/.test(h)
    && inOrder.every((v, i) => v >= 0 && (i === 0 || v > inOrder[i - 1])) && !/<h[1-6]>[^<]*Middle/.test(h) && !/<script/i.test(h) && /Second line <strong>bold<\/strong>\./.test(h) && !/\*\*|class="md-/.test(h), { labels, name: web[0] && web[0].name, inOrder, head: h.slice(0, 200) });

  // F2 Copy Text and Copy as Formatted: through the clipboard's own door, for the Parts chosen
  await app.evalJs("window.__pbClip = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { window.__pbClip.push({ kind: 'writeText', plain: t }); }, write: async (items) => { for (const it of items) { const o = { kind: 'write' }; for (const ty of it.types) o[ty] = await (await it.getType(ty)).text(); window.__pbClip.push(o); } } } }); null");
  await app.evalJs("document.querySelector('[data-pub-part=\"pub-2\"] input[type=checkbox]').click(); null"); await sleep(200);
  await app.evalJs(press('[data-pub-copy="text"]')); await sleep(300);
  const saidText = await app.evalJs("(document.querySelector('[data-pub-said]')?.textContent || '').trim()");
  await app.evalJs(press('[data-pub-copy="formatted"]')); await sleep(300);
  const saidFmt = await app.evalJs("(document.querySelector('[data-pub-said]')?.textContent || '').trim()");
  const clip = await app.evalJs('window.__pbClip');
  const wantCopy = 'Budget\n\nOpening\n\nOpening words here.\nSecond line bold.\n\nClose\n\nClosing words.\n';
  ok('F2 Copy Text puts the plain words of the Parts chosen on the clipboard; Copy as Formatted puts the web markup and the plain words (Part 2 unticked: neither holds it); each says "Copied"',
    clip.length === 2 && clip[0].kind === 'writeText' && clip[0].plain === wantCopy && clip[1].kind === 'write' && clip[1]['text/plain'] === wantCopy && /<h1>Budget<\/h1>/.test(clip[1]['text/html']) && /<h2>Close<\/h2>/.test(clip[1]['text/html'])
    && !/Middle words/.test(clip[0].plain + clip[1]['text/html']) && /<strong>bold<\/strong>/.test(clip[1]['text/html']) && !/\*\*|class="md-/.test(clip[1]['text/html']) && saidText === 'Copied' && saidFmt === 'Copied', { clip, saidText, saidFmt });
  await app.evalJs("document.querySelector('[data-pub-all]').click(); null"); await sleep(200);

  // F3 the Front menu while the sheet is open: TEXT and INK greyed with a note, PARTS only ticks and orders
  const drawer = await app.evalJs("(() => { const d = document.querySelector('.wz-sliver'); if (!d) return null; if (d.getAttribute('data-open') !== 'true') document.querySelector('[data-menus-handle]')?.click(); return true; })()");
  await sleep(700);
  const fm = await app.evalJs("(() => { const tabs = [...document.querySelectorAll('.wz-sliver .wz-drawer-tab')].map((b) => ({ id: b.id.replace('wz-sliver-tab-', ''), on: b.getAttribute('data-on'), disabled: b.getAttribute('data-disabled') })); const body = document.querySelector('.wz-sliver [data-reorg-pubparts]'); return { tabs, hasBody: !!body, note: (body?.querySelector('[data-pubparts-note]')?.textContent || '').trim(), plainList: !!document.querySelector('.wz-sliver .reorg-parts:not([data-reorg-pubparts])'), rows: [...document.querySelectorAll('.wz-sliver [data-pubparts-row]')].map((r) => r.getAttribute('data-pubparts-row')) }; })()");
  await app.evalJs("document.querySelector('.wz-sliver #wz-sliver-tab-text')?.click(); null"); await sleep(250);
  const stillParts = await app.evalJs("!!document.querySelector('.wz-sliver [data-reorg-pubparts]')");
  ok('F3 FINALIZE in the Front menu: TEXT (and INK where it has one) are greyed and do nothing, PARTS is the one that is on and holds the note and the Parts to tick and order',
    !!drawer && fm.tabs.length >= 2 && fm.tabs.filter((x) => x.id !== 'parts').every((x) => x.disabled === 'true' && x.on === 'false') && fm.tabs.find((x) => x.id === 'parts').on === 'true' && fm.hasBody && /fixed here/.test(fm.note) && !fm.plainList
    && fm.rows.join(',') === 'pub-1,pub-2,pub-3' && stillParts, { drawer, fm, stillParts });

  // F4 a tick in the Front menu is the sheet's tick, and the other way round; the count follows
  await app.evalJs("document.querySelector('.wz-sliver [data-pubparts-row=\"pub-2\"] input').click(); null"); await sleep(250);
  const t1 = await app.evalJs(SHEET);
  await app.evalJs("document.querySelector('[data-reorg-pub] [data-pub-part=\"pub-2\"] input[type=checkbox]').click(); null"); await sleep(250);
  const t2 = await app.evalJs("({ side: document.querySelector('.wz-sliver [data-pubparts-row=\"pub-2\"]')?.getAttribute('data-in'), count: (document.querySelector('[data-pub-count]')?.textContent || '').trim() })");
  ok('F4 a tick in the Front menu is the sheet\'s tick and the other way round (the count follows); nothing is stored for either',
    t1.parts[1].on === 'false' && /2 of 3 Parts go out/.test(t1.count) && t2.side === 'true' && /3 of 3 Parts go out/.test(t2.count), { t1: { on: t1.parts[1].on, count: t1.count }, t2 });

  // F5 an order made in the Front menu is the Doc's order: the sheet, the file and the stored order agree; Back restores TEXT
  await app.evalJs(CATCH);
  await app.evalJs("document.querySelector('.wz-sliver [data-pubparts-row=\"pub-1\"] [data-pubparts-down]').click(); null"); await sleep(500);
  const order = await app.evalJs("[...document.querySelectorAll('[data-reorg-pub] [data-pub-part]')].map((p) => p.getAttribute('data-pub-part')).join(',')");
  const side = await app.evalJs("[...document.querySelectorAll('.wz-sliver [data-pubparts-row]')].map((r) => r.getAttribute('data-pubparts-row')).join(',')");
  await app.evalJs(press('[data-pub-export="md"]')); await sleep(250);
  const moved = await app.evalJs('window.__pbBlobs');
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(500);
  const stored = await app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).filter((e) => /^pub-[123]$/.test(e.id)).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map((e) => e.id + ':' + (e.text || '').length).join(',')");
  const texts = await app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).filter((e) => /^pub-[123]$/.test(e.id)).map((e) => e.id + '=' + e.text).sort().join('|')");
  await app.evalJs(press('[data-pub-back]')); await sheetGone(app); await sleep(400);
  const after = await app.evalJs("(() => { const tabs = [...document.querySelectorAll('.wz-sliver .wz-drawer-tab')].map((b) => b.getAttribute('data-disabled')); return { anyGrey: tabs.some((x) => x === 'true'), pubparts: !!document.querySelector('.wz-sliver [data-reorg-pubparts]'), textOn: document.querySelector('.wz-sliver #wz-sliver-tab-text')?.getAttribute('data-on') }; })()");
  ok('F5 an order made in the Front menu is the Doc\'s order: the sheet, the file and the stored order agree and no word moved; going back to writing gives TEXT its tab and its body again',
    order === 'pub-3,pub-1,pub-2' && side === order && moved.length === 1 && /^# Budget\n\n## Close\n\nClosing words\.\n\n## Opening\n\nOpening words here\./.test(moved[0].text) && /^pub-3:/.test(stored) && /pub-1=Opening words here\.\nSecond line \*\*bold\*\*\.\|pub-2=Middle words unnamed\.\|pub-3=Closing words\./.test(texts)
    && !after.anyGrey && !after.pubparts && after.textOn === 'true', { order, side, stored, texts, after, md: moved[0] && moved[0].text.slice(0, 120) });
  } catch (err) { ok('F0 the FINALIZE checks ran to their end (a driver that cannot find what it must press fails here, it does not crash the run)', false, String(err && err.message).slice(0, 300)); }
});

// ---- WORDS (source) --------------------------------------------------------------------------------------------------------------------
{
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8') + fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'settings.ts'), 'utf8');
  const files = ['PublishView.tsx', 'PublishParts.tsx'].map((n) => path.join(SRC, 'reorg', n));
  const src = files.map((file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '')).join('\n');
  const used = [...new Set([...src.matchAll(/\bt\('([a-zA-Z0-9]+)'\)/g)].map((m) => m[1]))];
  const missing = used.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon));
  const quoted = [...src.matchAll(/>\s*([A-Z][a-z]+(?: [a-z]+)+)\s*</g)].map((m) => m[1]);
  ok('W1 every word the sheet draws is a lexicon key (terms.ts and the canonical table), and none is written into the component', used.length >= 16 && missing.length === 0 && quoted.length === 0, { used, missing, quoted });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 18;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-PUBLISH-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-PUBLISH-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
