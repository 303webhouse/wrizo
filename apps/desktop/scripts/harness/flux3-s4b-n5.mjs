// FLUX3 S4b N5 - THE + AT THE PAGE'S TOP CORNER (flux3-s4b-plan.md N5; flux-full-look-for-monday.md item 7, tier A, the Flux bonus: Fable, Nov 21, 4:58 pm; the source is the Oct 28 mockup,
// flux-page-mockup-2-schema-doc.html .plus: "Its menu draws a line down the page's side and opens into a box"). Read in the live page behind ?flux3=1 (Flux theme), on a writing page.
// The plan: "a corner button that opens the existing port actions. It REUSES the port box's actions; it adds no new action and no data."
//   PLACE   one square + button just beyond the page's top-right corner, level with the page's top, clear of the right hand's grip (no overlap) and of the ports; it is hit-testable
//   OPEN    pressed, it draws a line down from it into a box: the box's head names the page and its connections (Doc · 1 connection), and it offers the port box's own Connect another
//   PICK    Connect another opens the SAME picker the ports open (GraftPicker, the Grafts pane's): no second picker
//   CLOSE   a press elsewhere, or Esc, closes the box; the + reads aria-expanded true while open and false after
//   SOURCE  no new action and no data: the + opens GraftPicker with the page as its subject and calls nothing that writes (no addPageLink / saveJournalEntry / removePageLink of its own)
//   RECT    the page's rects (column, page, editor) are the same with the box open and closed and with the + taken away (page primacy); the editor node is never replaced
//   OFF     without the flag there is no +
// FLUX3_SHOTS=<dir> writes frames. Run: node scripts/harness/flux3-s4b-n5.mjs (from apps/desktop; a box turn or Actions).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });

const INSTRUMENT = `(() => {
  if (window.__n5) return;
  const I = window.__n5 = {};
  const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  I.state = () => { const page = document.querySelector('.mode-page'); if (!page) return null; const col = page.parentElement;
    const plus = col.querySelector('[data-flux3-plus]'), box = col.querySelector('[data-flux3-plus-box]'), line = col.querySelector('[data-flux3-plus-line]');
    const grip = document.querySelector('.wz-tutor-grip'), ports = [...col.querySelectorAll('.flux3-port')].map(R);
    let hit = false; if (plus) { const r = plus.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); hit = !!e && (e === plus || plus.contains(e)); }
    return { page: R(page), plus: R(plus), plusLabel: plus ? plus.getAttribute('aria-label') : null, expanded: plus ? plus.getAttribute('aria-expanded') : null, hit, grip: R(grip), ports,
      box: box ? { rect: R(box), head: (box.querySelector('[data-flux3-plus-head]') || {}).textContent || null, acts: [...box.querySelectorAll('[data-port-act]')].map((b) => [b.getAttribute('data-port-act'), (b.textContent || '').trim()]) } : null,
      line: R(line), picker: !!document.querySelector('.graft-picker, [data-graft-picker]') }; };
  I.rects = () => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); };
    return { col: q('.mode-pagecol'), page: q('.mode-page'), editor: q('.forward-only-editor') }; };
})()`;
const apart = (a, b) => !a || !b || a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const press = async (sel) => { const p = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); return true; };
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  const seeded = await ev(`(() => {
    const W = window;
    W.wrizoCreateJournalPage({ id: 'n5-p1', text: 'The tolls rose at dawn.\\n\\nNobody paid.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' });
    W.wrizoCreateJournalPage({ id: 'n5-p2', text: 'The other page.', createdAt: '2026-04-01T00:00:01.000Z', origin: 'loose', source: 'page' });
    W.wrizoAddPageLink('n5-p1', { bEntryId: 'n5-p2' });
    W.wrizoFlushNow();
    return { links: (W.wrizoPageLinksOf('n5-p1') || []).filter((l) => !l.deletedAt).length };
  })()`);
  const open = async (id, { flag = true, w = 1920, h = 1080 } = {}) => {
    await app.emulateDpr(1, w, h);
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = 'dark'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');
      localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); })()`);
    // [the Flux pin, Fable Nov 23 2:30 pm: FLUX3 is on by default, so "off" must be asked with ?flux3=0] was: await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/?flux3=0')} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", { timeout: 15000, label: `the page ${id}` }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1600);
  };
  const state = () => ev('window.__n5.state()');
  const rects = () => ev('window.__n5.rects()');

  // SUPERSEDED (#145, Nick Nov 27, home B: the + and the squares stand in one row under the page's right end, their boxes opening upward), the original verbatim:
  // const placeOk = (s) => !!s && !!s.plus && s.hit && s.plus.l > s.page.r && Math.abs(s.plus.t - s.page.t) <= 2 && s.plus.w >= 24 && Math.abs(s.plus.w - s.plus.h) < 1
  // && apart(s.plus, s.grip) && s.ports.every((p) => apart(s.plus, p));
  const placeOk = (s) => !!s && !!s.plus && s.hit && s.plus.t >= s.page.b - 0.5 && Math.abs(s.plus.r - s.page.r) <= 2 && s.plus.w >= 24 && Math.abs(s.plus.w - s.plus.h) < 1
    && apart(s.plus, s.grip) && s.ports.every((p) => apart(s.plus, p));
  for (const [w, h] of [[1920, 1080], [1366, 768]]) {
    await open('n5-p1', { w, h });
    const s = await state();
    await snap(`n5-rest-${w}`);
    // SUPERSEDED (#145, Nick Nov 27, home B: the + and the squares stand in one row under the page's right end, their boxes opening upward), the original verbatim:
    // ok(`PLACE [${w}] one square + just beyond the page's top-right corner, level with its top, clear of the right hand's grip and the ports, and hit-testable`, placeOk(s), { seeded, s });
    ok(`PLACE [${w}] [#145 successor] one square + under the page's right end, clear of the right hand's grip and the ports, and hit-testable`, placeOk(s), { seeded, s });
  }

  // ---- OPEN, PICK, CLOSE, RECT (1920) ----------------------------------------------------------------------------------------------------------------------------------------
  await open('n5-p1');
  const r0 = await rects();
  await ev("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__n5Mark = 1; return null; })()");
  await press('[data-flux3-plus]'); await sleep(500);
  const so = await state();
  const r1 = await rects();
  await snap('n5-open-1920');
  // SUPERSEDED (#145, Nick Nov 27, home B: the + and the squares stand in one row under the page's right end, their boxes opening upward), the original verbatim:
  // ok('OPEN pressed, the + draws a line down into a box: its head names the page and its connections (Doc · 1 connection), and it offers the port box\'s own Connect another',
  // !!so && so.expanded === 'true' && !!so.line && !!so.box && /^doc\s*·\s*1 connection$/i.test(String(so.box.head || '').replace(/\s+/g, ' ').trim())
  // && so.box.acts.length === 1 && so.box.acts[0][0] === 'link' && so.box.acts[0][1] === 'Connect another' && so.line.t >= so.plus.b - 1 && so.box.rect.t >= so.line.t, so);
  ok('OPEN [#145 successor] pressed, the + draws a line up into a box: its head names the page and its connections (Doc · 1 connection), and it offers the port box\'s own Connect another',
    !!so && so.expanded === 'true' && !!so.line && !!so.box && /^doc\s*·\s*1 connection$/i.test(String(so.box.head || '').replace(/\s+/g, ' ').trim())
      && so.box.acts.length === 1 && so.box.acts[0][0] === 'link' && so.box.acts[0][1] === 'Connect another' && so.line.b <= so.plus.t + 1 && so.box.rect.b <= so.line.t + 1, so);
  await press('[data-flux3-plus-box] [data-port-act="link"]'); await sleep(600);
  const sp = await state();
  ok('PICK Connect another opens the same picker the ports open (GraftPicker)', !!sp && sp.picker, sp);
  await ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(300);
  await ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(300);
  const se = await state();
  await press('[data-flux3-plus]'); await sleep(400);
  await app.mouseMove(300, 600); await app.mouseDown(300, 600); await app.mouseUp(300, 600); await sleep(400);
  const sa = await state();
  ok('CLOSE Esc closes the box, and so does a press elsewhere; the + reads aria-expanded false after', !!se && !se.box && se.expanded === 'false' && !!sa && !sa.box && sa.expanded === 'false', { se, sa });
  const r2 = await rects();
  const kept = await ev("!!(document.querySelector('.forward-only-editor') || {}).__n5Mark");
  const removed = await ev("(() => { let n = 0; document.querySelectorAll('[data-flux3-plus], [data-flux3-plus-box], [data-flux3-plus-line]').forEach((e) => { e.remove(); n += 1; }); return n; })()");
  const r3 = await rects();
  const same = (a, b) => ['col', 'page', 'editor'].every((k) => a[k] !== null && a[k] === b[k]);
  ok('RECT the page\'s rects are the same with the box open and closed and with the + taken away; the editor node is the same', removed > 0 && same(r0, r1) && same(r0, r2) && same(r0, r3) && kept, { r0, r1, r2, r3, kept, removed });

  // ---- OFF -------------------------------------------------------------------------------------------------------------------------------------------------------------------
  await open('n5-p1', { flag: false });
  const off = await state();
  ok('OFF without the flag there is no +', !!off && !off.plus, off);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

// ---- SOURCE: the + reuses the port box's picker and writes nothing of its own ----------------------------------------------------------------------------------------------
{
  const doc = fs.existsSync(path.join(SRC, 'flux3', 'FluxDoc.tsx')) ? fs.readFileSync(path.join(SRC, 'flux3', 'FluxDoc.tsx'), 'utf8').replace(/\r\n/g, '\n') : '';
  const at = doc.indexOf('function PlusCorner(');
  const end = at >= 0 ? doc.indexOf('\nfunction ', at + 10) : -1;
  const body = at >= 0 ? doc.slice(at, end > 0 ? end : undefined) : '';
  const picker = /<GraftPicker subject=\{\{ entryId \}\}/.test(body);
  const writes = /\b(addPageLink|removePageLink|saveJournalEntry|saveProject|setLinkDock|requestDelete)\s*\(/.test(body);
  ok('SOURCE the + (PlusCorner) opens GraftPicker with the page as its subject and calls nothing that writes of its own', at >= 0 && picker && !writes, { found: at >= 0, picker, writes });
}

const EXPECTED = 8;
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 1500)}`); if (!c.pass) bad += 1; }
if (checks.length !== EXPECTED) bad = Math.max(bad, 1);
console.log(bad ? `\nFLUX3-S4B-N5 VERIFY: FAIL - ${bad}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}` : `\nFLUX3-S4B-N5 VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
