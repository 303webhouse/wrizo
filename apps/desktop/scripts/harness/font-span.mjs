// FONT-SPAN - the font on HIGHLIGHTED words, in the real app (docs/font-span-plan.md + Fable's four additions; Nick approved the
// font-choices mockup, cursor/font-choices @ 6cc5f529, Oct 15). Per theme (Plateau, Flux), with real presses on the drawer:
//   PAGE  (Draft) nothing highlighted: "Selection" is dead, "Whole document" in brass. Words highlighted: the scope FOLLOWS to Selection.
//         A face picked: ONLY those words take it - stored as `[words]{.font-<slug>}`, painted in the face, marks hidden, the highlight
//         still on the same words, the face's row in brass. One Ctrl+Z undoes the pick, whole. "Whole document" then a face: every word
//         takes it - the spans go, the page's own face is set.
//   CARD  the dock's scopes read "Selection" / "Whole card"; a highlighted pick gives only those words the face, stored in the card's
//         text, and the card's face on the board paints it too.
// Frames (FS_FRAMES=<dir>): a highlighted pick on a Page, a whole-document pick, a pick inside a card - per theme.
// The text rules themselves (merge, split, no stacked marks, the 211 rules on a span, the readers) are scripts/font-span-check.mjs's.
// Run: node scripts/harness/font-span.mjs   (from apps/desktop, dist-web built, box turn granted)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';
import { trustedDispatch, hittablePointBy } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FRAMES = process.env.FS_FRAMES || null;
const frame = async (app, name) => { if (!FRAMES) return; mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
const press = (app, expr, what) => trustedDispatch(app, expr, what, { report: ok });
const ED = '.forward-only-editor';
const CE = '.board-popup-editor';
const TEXT = 'The ferry was late, so Ada counted gulls instead of minutes.';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1280, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
};
const setTheme = async (app, theme) => { if (theme === 'flux') { await app.evalJs("window.wrizoTheme.set('flux')"); await sleep(250); } };
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{})`);
const settledBy = async (read) => { await sleep(2600); let last = JSON.stringify(await read()); let same = 0; for (let i = 0; i < 30 && same < 6; i += 1) { await sleep(150); const n = JSON.stringify(await read()); same = n === last ? same + 1 : 0; last = n; } return JSON.parse(last); };
// highlight a run of VISIBLE words in an editor (setup only: the act under test is the press that follows)
const highlight = (app, sel, words) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); if (!ed) return false; ed.focus();
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { if (n.parentElement && n.parentElement.closest('.md-mark-hidden')) continue; const i = n.data.indexOf(${JSON.stringify(words)});
    if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ${JSON.stringify(words)}.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } }
  return false; })()`);
const scopeState = (app, root) => app.evalJs(`(() => { const t = document.querySelector('${root} .wz-type'); if (!t) return null;
  const sc = [...t.querySelectorAll('.wz-type-scope')].map(b => ({ text: b.textContent, on: b.dataset.on, dead: b.getAttribute('aria-disabled') }));
  const cur = [...t.querySelectorAll('.wz-type-row')].filter(r => r.dataset.current === 'true').map(r => ({ name: r.textContent, color: getComputedStyle(r).color }));
  const probe = document.createElement('span'); probe.style.color = 'var(--brass)'; t.appendChild(probe); const brass = getComputedStyle(probe).color; probe.remove();
  return { scopes: sc, current: cur, brass }; })()`);
const rowExpr = (root, name) => `[...document.querySelectorAll('${root} .wz-type-row')].find(r => r.textContent === ${JSON.stringify(name)})`;
const spanState = (app, sel) => app.evalJs(`(() => { const s = document.querySelector('${sel} .md-font'); if (!s) return null;
  const marks = [...s.querySelectorAll(':scope > .md-mark-hidden')].map(m => getComputedStyle(m).fontSize);
  const words = [...s.childNodes].filter(c => !(c.nodeType === 1 && c.classList.contains('md-mark-hidden'))).map(c => c.textContent).join('');
  return { words, family: getComputedStyle(s).fontFamily, marks, sel: String(getSelection()) }; })()`);

await withHarness(async (app) => {
  for (const theme of ['plateau', 'flux']) {
    const T = `[${theme}]`;
    // ======================== PAGE (Draft) ========================
    const id = `fs-page-${theme}`;
    await freshDesk(app);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting')`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/${id}'`);
    const up = await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'Draft page' }).then(() => true, () => false);
    ok(`${T} (setup) the Draft page opens`, up);
    if (!up) continue;
    await setTheme(app, theme);
    await sleep(500);
    if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') await press(app, "document.querySelector('.wz-sliver-grip')", 'the drawer grip');
    await sleep(500);
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
    await sleep(250);
    const s0 = await scopeState(app, '.wz-sliver');
    ok(`${T} PAGE: nothing highlighted - "Selection" is dead and "Whole document" is the scope, in brass`,
      !!s0 && s0.scopes.length === 2 && s0.scopes[0].text === 'Selection' && s0.scopes[0].dead === 'true' && s0.scopes[1].text === 'Whole document' && s0.scopes[1].on === 'true', JSON.stringify(s0));
    const hl = await highlight(app, ED, 'counted gulls');
    await sleep(300);
    const s1 = await scopeState(app, '.wz-sliver');
    ok(`${T} PAGE: words highlighted - the scope follows to "Selection"`, hl && !!s1 && s1.scopes[0].on === 'true' && s1.scopes[0].dead === 'false' && s1.scopes[1].on === 'false', JSON.stringify({ hl, s1 }));
    await press(app, rowExpr('.wz-sliver', 'Atkinson Hyperlegible'), 'the Atkinson Hyperlegible row');
    await sleep(600);
    const sp = await spanState(app, ED);
    const s2 = await scopeState(app, '.wz-sliver');
    ok(`${T} PAGE: ONLY the highlighted words take the face - painted in it, its marks hidden (zero size), and the words stay highlighted`,
      !!sp && sp.words === 'counted gulls' && /Atkinson/.test(sp.family) && sp.marks.length === 2 && sp.marks.every((f) => f === '0px') && sp.sel === 'counted gulls', JSON.stringify(sp));
    ok(`${T} PAGE: the picked face's row is the one in brass`, !!s2 && s2.current.length === 1 && s2.current[0].name === 'Atkinson Hyperlegible' && s2.current[0].color === s2.brass, JSON.stringify(s2));
    const e1 = await settledBy(() => stored(app, id));
    ok(`${T} PAGE: the span is stored in the page's text, and nothing else changed`, e1.text === 'The ferry was late, so Ada [counted gulls]{.font-atkinson-hyperlegible} instead of minutes.', JSON.stringify(e1.text));
    await frame(app, `${theme}-page-selection`);
    await app.keyCombo('z');
    const e2 = await settledBy(() => stored(app, id));
    ok(`${T} PAGE: ONE Ctrl+Z undoes the pick, whole`, e2.text === TEXT, JSON.stringify(e2.text));
    // a span again, then the whole-document pick over it
    await highlight(app, ED, 'Ada');
    await sleep(250);
    await press(app, rowExpr('.wz-sliver', 'Courier Prime'), 'the Courier Prime row');
    await sleep(500);
    await press(app, "document.querySelector('.wz-sliver .wz-type-scope[data-scope=\"whole\"]')", 'the "Whole document" scope');
    await sleep(250);
    await press(app, rowExpr('.wz-sliver', 'EB Garamond'), 'the EB Garamond row');
    await sleep(700);
    const e3 = await settledBy(() => stored(app, id));
    const fam = await app.evalJs(`getComputedStyle(document.querySelector('${ED}')).fontFamily`);
    ok(`${T} PAGE: "Whole document" then a face - every word takes it: the spans are gone and the page's own face is set`,
      !String(e3.text).includes('{.font-') && e3.text === TEXT && e3.pageSettings && e3.pageSettings.face && e3.pageSettings.face.name === 'EB Garamond' && /EB Garamond/.test(fam),
      JSON.stringify({ text: e3.text, face: e3.pageSettings && e3.pageSettings.face, fam }));
    await frame(app, `${theme}-page-whole`);

    // ======================== CARD ========================
    const bid = `fs-board-${theme}`;
    await freshDesk(app);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: bid, text: 'Font board', pageType: 'board', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page',
      boxes: [{ id: `${bid}-c`, kind: 'text', x: 0.08, y: 0.08, w: 0.42, h: 0.16, z: 1, text: TEXT }] })})`);
    await sleep(400);
    await app.evalJs(`location.hash = '#/page/${bid}'`);
    await app.waitFor(`!!document.querySelector('[data-box-id="${bid}-c"]')`, { label: 'the card' }).catch(() => {});
    await setTheme(app, theme);
    await sleep(500);
    const cp = await hittablePointBy(app, `document.querySelector('[data-box-id="${bid}-c"] .board-text')`);
    if (cp && cp.found) await app.doubleClick(cp.x, cp.y);
    const open = await app.waitFor(`!!document.querySelector('${CE}')`, { label: 'card popup' }).then(() => true, () => false);
    ok(`${T} (setup) a real double-click opens the card`, open);
    if (!open) continue;
    await sleep(300);
    if (!(await app.evalJs("!!document.querySelector('.board-popup-dock .wz-type')"))) await press(app, "document.querySelector('.board-popup-dock-grip')", "the card's styling dock grip");
    await sleep(350);
    await highlight(app, CE, 'counted gulls');
    await sleep(300);
    const c0 = await scopeState(app, '.board-popup-dock');
    ok(`${T} CARD: the dock's scopes read "Selection" / "Whole card", and the highlight puts it on Selection`,
      !!c0 && c0.scopes.length === 2 && c0.scopes[0].text === 'Selection' && c0.scopes[1].text === 'Whole card' && c0.scopes[0].on === 'true', JSON.stringify(c0));
    await press(app, rowExpr('.board-popup-dock', 'Courier Prime'), "the card's Courier Prime row");
    await sleep(600);
    const csp = await spanState(app, CE);
    ok(`${T} CARD: ONLY the highlighted words take the face in the card, painted, marks hidden, still highlighted`,
      !!csp && csp.words === 'counted gulls' && /Courier Prime/.test(csp.family) && csp.marks.every((f) => f === '0px') && csp.sel === 'counted gulls', JSON.stringify(csp));
    await frame(app, `${theme}-card-selection`);
    await app.key('Escape');
    await sleep(500);
    const cardRow = await settledBy(async () => ((await stored(app, bid)).boxes || [])[0] || null);
    ok(`${T} CARD: the span is stored in the card's text`, !!cardRow && cardRow.text === 'The ferry was late, so Ada [counted gulls]{.font-courier-prime} instead of minutes.', JSON.stringify(cardRow && cardRow.text));
    const face = await app.evalJs(`(() => { const s = document.querySelector('[data-box-id="${bid}-c"] .md-font'); return s ? { words: [...s.childNodes].filter(c => !(c.nodeType === 1 && c.classList.contains('md-mark-hidden'))).map(c => c.textContent).join(''), family: getComputedStyle(s).fontFamily } : null; })()`);
    ok(`${T} CARD: the card's face on the board paints the span too`, !!face && face.words === 'counted gulls' && /Courier Prime/.test(face.family), JSON.stringify(face));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nFONT-SPAN VERIFY: PASS (${checks.length} checks)` : `\nFONT-SPAN VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
