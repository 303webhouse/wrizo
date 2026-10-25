// OUTLINE BLUR DATA BUG - PART 2, the live app (a box turn). PART 1 (outline-blur.mjs) holds the pure rule and its mutants; this proves the two things only a browser can:
//   the Outline row SHOWS a card's title and its text apart ("First One.", not "FirstOne."), and the stored text is NEVER rewritten by a bare focus + blur (the data bug), while a real edit keeps the text after the title.
// Seeding goes through the app's seams. Run: node scripts/harness/outline-blur-part2.mjs [outDir]   (takes the box first)
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || null;
if (out) fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const shot = async (name) => { if (out) fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(400); return true; };
  const stored = async (id) => ((await q('window.wrizoBoard()')) || []).find((b) => b.id === id);

  for (const theme of ['plateau', 'flux']) {
    const T = theme === 'plateau' ? 'Arbor' : 'Flux';
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme && window.wrizoTheme.set('${theme}')`);
    await sleep(400);
    await q(`(() => { const d = window.wrizoCreateDrawer('The Well'); const p = window.wrizoCreateProject('The Well', 'creative'); window.wrizoSetProjectDrawer(p.id, d.id);
      const t = (id, x, y, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.105, z: 1, text });
      window.wrizoCreateJournalPage({ id: 'ob-board', text: 'Outline board', pageType: 'board', projectId: p.id, boxes: [t('c1', 0.05, 0.05, 'First\\nOne.'), t('c2', 0.4, 0.2, 'Second\\nTwo, with more words after it.'), t('c3', 0.2, 0.45, 'Third')], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
      window.wrizoFlushNow(); })()`);
    await sleep(500);
    await q("location.hash = '#/page/ob-board'");
    await waitSoft("!!document.querySelector('.board-canvas')", { label: 'board', timeout: 8000 }); await sleep(900);
    await click('[data-board-mode-tab="outline"]');
    await waitSoft("!!document.querySelector('[data-board-projection=outline]')", { label: 'outline' }); await sleep(600);

    const row = await q(`(() => { const r = document.querySelector('[data-outline-row=c1]'); if (!r) return null; const inp = r.querySelector('input'); const body = r.querySelector('.board-outline-body'); const t = (e) => (e ? e.getBoundingClientRect() : null); const ib = t(inp), bb = t(body);
      return { input: inp ? inp.value : null, body: body ? body.textContent : null, gap: ib && bb ? Math.round(bb.left - ib.right) : null, sameLine: ib && bb ? Math.abs((ib.top + ib.height / 2) - (bb.top + bb.height / 2)) < 6 : null, bodyTitle: body ? body.getAttribute('title') : null }; })()`);
    ok(`[${T}] the Outline shows a card's title and its text apart: the input holds "First", the text "One." sits beside it on the same line with a gap`, !!row && row.input === 'First' && row.body === 'One.' && row.sameLine === true && row.gap >= 4, JSON.stringify(row));
    const longRow = await q(`(() => { const b = document.querySelector('[data-outline-row=c2] .board-outline-body'); if (!b) return null; const cs = getComputedStyle(b); return { ws: cs.whiteSpace, to: cs.textOverflow, full: b.getAttribute('title') }; })()`);
    ok(`[${T}] a longer text stays one line with an ellipsis, and its full text is the hover title`, !!longRow && longRow.ws === 'nowrap' && longRow.to === 'ellipsis' && /with more words after it/.test(longRow.full || ''), JSON.stringify(longRow));
    await shot(`outline-${theme}`);

    // THE DATA BUG: a bare focus + blur used to write "FirstOne." over "First\nOne."
    const before = await stored('c1');
    await q("(() => { const i = document.querySelector('[data-outline-input=c1]'); if (i) { i.focus(); i.blur(); } })()"); await sleep(600);
    // and by real pointer clicks too: into the row, then away to another row's input and out
    await click('[data-outline-input=c1]'); await sleep(200); await click('[data-outline-input=c3]'); await sleep(200);
    await q("document.activeElement && document.activeElement.blur && document.activeElement.blur()"); await sleep(600);
    const after = await stored('c1');
    ok(`[${T}] DATA: focusing and leaving an Outline row without typing leaves the card's stored text byte-identical ("First\\nOne.")`, !!before && !!after && before.text === 'First\nOne.' && after.text === 'First\nOne.', JSON.stringify({ before: before && before.text, after: after && after.text }));
    const c2 = await stored('c2');
    ok(`[${T}] DATA: the other cards are untouched too (the text after a title survives)`, !!c2 && c2.text === 'Second\nTwo, with more words after it.', JSON.stringify(c2 && c2.text));

    await q("(() => { const i = document.querySelector('[data-outline-input=c1]'); if (i) { i.focus(); i.value = 'First EDITED'; i.dispatchEvent(new Event('input', { bubbles: true })); i.blur(); } })()"); await sleep(700);
    const edited = await stored('c1');
    ok(`[${T}] editing the title writes the new title and KEEPS the text after it ("First EDITED\\nOne.")`, !!edited && edited.text === 'First EDITED\nOne.', JSON.stringify(edited && edited.text));
    const single = await q("(() => { const i = document.querySelector('[data-outline-input=c3]'); if (i) { i.focus(); i.value = 'Third, renamed'; i.dispatchEvent(new Event('input', { bubbles: true })); i.blur(); } })()").then(() => sleep(700)).then(() => stored('c3'));
    ok(`[${T}] a single-line card edits as before ("Third, renamed")`, !!single && single.text === 'Third, renamed', JSON.stringify(single && single.text));
    // Open shows the same words: the edit travelled to the card the Open view draws
    await click('[data-board-mode-tab="open"]'); await waitSoft("!!document.querySelector('.board-box')", { label: 'open' }); await sleep(700);
    const openText = await q("(document.querySelector('[data-box-id=c1] .board-text')?.innerText || '').replace(/\\s+/g, ' ').trim()");
    ok(`[${T}] Open shows the edited card with its text ("First EDITED One.")`, /First EDITED\s+One\./.test(openText || ''), String(openText));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nOUTLINE-BLUR PART 2: FAIL - ${failed.length}/${checks.length} failed` : `\nOUTLINE-BLUR PART 2: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
