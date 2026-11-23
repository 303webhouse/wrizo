// SCRIPT #6: THE WHOLE-SCRIPT DOWNLOAD KEEPS THE ACT ORDER (the review's finding 6, R8; Fable, Nov 23). The folder download sorted by creation date, dropped the Part names, and wrote each act's first slugline twice.
// Seeded through the app's own seams, the real Finalize / Publish buttons pressed with a real mouse, the real file read from disk.
//
// SCREENPLAY  D1  the acts come out in the writer's order, not creation order
//             D2  a named act is headed by its name
//             D3  each slugline appears exactly once
//             D4  an unnamed act gets no invented heading
//             D5  every word of every act is in the file
//             D6  the file is named for the Doc
// PROSE       P1  a moved prose Doc comes out in the writer's order
//             P2  a named prose Part is headed by its name and keeps its first line
//             P3  (control) a prose Doc nobody moved or named is exactly as before: creation order, first line as heading
// EVERYTHING  E1  (control) the Everything backup is unchanged: creation order, first line as heading
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-download.mjs
import { withHarness } from '../runtime-verify.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const count = (text, s) => text.split(s).length - 1;
const headings = (text) => text.split(/\r?\n/).filter((l) => l.startsWith('# '));
const inOrder = (text, list) => { const at = list.map((s) => text.indexOf(s)); return at.every((n) => n >= 0) && at.every((n, i) => i === 0 || at[i - 1] < n); };

await withHarness(async (app) => {
  // a real press, only on something the pointer can actually reach
  const press = async (sel) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector(${q(sel)}); if (!e || e.disabled) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); const h = document.elementFromPoint(x, y); return { x, y, hit: !!h && (h === e || e.contains(h)) }; })()`);
    if (!p || !p.hit) return false;
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(250);
    return true;
  };
  // the reorg's prose Finalize is its own view; the folder download a prose page reaches is the one with the reorg off
  const openPage = async (id, script) => {
    await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
    await app.evalJs(`window.wrizoFlushNow(); window.wrizoTheme.set('machina'); ${script ? '' : `localStorage.setItem('wrizo-mode-page-${id}', 'drafting');`} history.replaceState(null, '', '/?reorg=${script ? 1 : 0}&arbor2=0#/page/${id}'); null`);
    await app.reload();
    await app.waitFor(script ? "!!document.querySelector('.script-sheet .script-el')" : "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 }).catch(() => {});
    await sleep(900);
  };
  // press the button, then wait for one finished file whose size holds across two reads
  const download = async (sel) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'script-download-'));
    await app.enableDownloads(dir);
    const tab = await press('[data-mode-key="publish"]');
    await app.waitFor(`!!document.querySelector(${q(sel)})`, { label: sel, timeout: 6000 }).catch(() => {});
    const pressed = tab && await press(sel);
    const deadline = Date.now() + 9000;
    while (pressed && Date.now() < deadline) {
      await sleep(80);
      const names = fs.readdirSync(dir).filter((n) => !n.endsWith('.crdownload'));
      if (names.length === 1) {
        const a = fs.statSync(path.join(dir, names[0])).size;
        await sleep(60);
        const b = fs.statSync(path.join(dir, names[0])).size;
        if (a > 0 && a === b) return { pressed, name: names[0], text: fs.readFileSync(path.join(dir, names[0]), 'utf8') };
      }
    }
    return { pressed, name: null, text: '' };
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    let n = 0;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:' + String(10 + n++) + '.000Z', source: 'page', ...extra });
    const named = (e, name) => W.wrizoPatchEntry(e.id, { pageSettings: { ...(e.pageSettings || {}), name } });
    const doc = (id, head, line) => ({ v: 1, scenes: [{ id: id + '-h', heading: { id: id + '-h', t: 'scene', text: head }, body: [{ id: id + '-a', t: 'action', text: line }] }] });
    const scriptPage = (id, head, line, extra) => { const e = page(id, head + '\\n\\n' + line, { pageType: 'script', ...extra }); W.wrizoPatchEntry(id, { script: doc(id, head, line) }); return W.wrizoPatchEntry(id, {}) || e; };
    const work = W.wrizoCreateDrawer('Work');
    const feature = W.wrizoCreateProject('Feature'); W.wrizoSetProjectDrawer(feature.id, work.id);
    const essay = W.wrizoCreateProject('Essay'); W.wrizoSetProjectDrawer(essay.id, work.id);
    const plain = W.wrizoCreateProject('Plain'); W.wrizoSetProjectDrawer(plain.id, work.id);
    // made One, Two, Three; moved to Three, One, Two
    named(scriptPage('a1', 'INT. KITCHEN - DAY', 'Mara waits.', { origin: 'project', projectId: feature.id, orderIndex: 1 }), 'Act One');
    scriptPage('a2', 'EXT. STREET - NIGHT', 'Rain falls.', { origin: 'project', projectId: feature.id, orderIndex: 2 });
    named(scriptPage('a3', 'INT. ROOF - DAWN', 'It ends.', { origin: 'project', projectId: feature.id, orderIndex: 0 }), 'Act Three');
    // made first, second; moved to second, first
    page('e1', 'First essay line.\\n\\nThe middle of it.', { origin: 'project', projectId: essay.id, orderIndex: 1 });
    named(page('e2', 'Second essay opening.\\n\\nThe rest of it.', { origin: 'project', projectId: essay.id, orderIndex: 0 }), 'The Turn');
    // never moved, never named
    page('p1', 'Plain one\\n\\nPlain one body.', { origin: 'project', projectId: plain.id });
    page('p2', 'Plain two\\n\\nPlain two body.', { origin: 'project', projectId: plain.id });
    W.wrizoFlushNow();
    return null;
  })()`);

  // ---- SCREENPLAY (opened on the unnamed act, so nothing about the open page helps)
  await openPage('a2', true);
  const f = await download('.publish-download-binder');
  ok('D1: the acts come out in the writer\'s order (Three, One, Two), not creation order', inOrder(f.text, ['INT. ROOF - DAWN', 'INT. KITCHEN - DAY', 'EXT. STREET - NIGHT']), { pressed: f.pressed, name: f.name, at: ['INT. ROOF - DAWN', 'INT. KITCHEN - DAY', 'EXT. STREET - NIGHT'].map((s) => f.text.indexOf(s)) });
  ok('D2: a named act is headed by its name', headings(f.text).includes('# Act Three') && headings(f.text).includes('# Act One'), { headings: headings(f.text) });
  const slugs = ['INT. ROOF - DAWN', 'INT. KITCHEN - DAY', 'EXT. STREET - NIGHT'].map((s) => count(f.text, s));
  ok('D3: each slugline appears exactly once', slugs.every((n) => n === 1), { slugs });
  ok('D4: an unnamed act gets no invented heading', JSON.stringify(headings(f.text)) === JSON.stringify(['# Act Three', '# Act One']) && !f.text.includes('Untitled'), { headings: headings(f.text) });
  ok('D5: every word of every act is in the file', ['INT. ROOF - DAWN', 'It ends.', 'INT. KITCHEN - DAY', 'Mara waits.', 'EXT. STREET - NIGHT', 'Rain falls.'].every((s) => f.text.includes(s)), { len: f.text.length });
  ok('D6: the file is named for the Doc', f.name === 'Feature.md', { name: f.name });

  // ---- PROSE
  await openPage('e1', false);
  const e = await download('.publish-download-binder');
  ok('P1: a moved prose Doc comes out in the writer\'s order', inOrder(e.text, ['Second essay opening.', 'First essay line.']), { pressed: e.pressed, name: e.name, at: ['Second essay opening.', 'First essay line.'].map((s) => e.text.indexOf(s)) });
  ok('P2: a named prose Part is headed by its name and keeps its first line', headings(e.text).includes('# The Turn') && count(e.text, 'Second essay opening.') === 1, { headings: headings(e.text), first: count(e.text, 'Second essay opening.') });

  await openPage('p1', false);
  const p = await download('.publish-download-binder');
  ok('P3 (control): a prose Doc nobody moved or named is as before: creation order, first line as heading', JSON.stringify(headings(p.text)) === JSON.stringify(['# Plain one', '# Plain two']) && inOrder(p.text, ['Plain one body.', 'Plain two body.']) && p.name === 'Plain.md', { pressed: p.pressed, name: p.name, headings: headings(p.text) });

  // ---- EVERYTHING
  await openPage('a2', true);
  const all = await download('.publish-download-everything');
  ok('E1 (control): the Everything backup is unchanged: creation order, first line as heading', inOrder(all.text, ['# INT. KITCHEN - DAY', '# EXT. STREET - NIGHT', '# INT. ROOF - DAWN']), { pressed: all.pressed, name: all.name, headings: headings(all.text).slice(0, 10) });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 500)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 10;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-DOWNLOAD VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-DOWNLOAD VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);
