// POLISH #10, FIX item 24 (Nick, via Fable, Oct 25): DOCK A LINKED CARD OR PAGE BESIDE THE PAGE - a character card, a bibliography source - visible while
// writing, its text copyable into the page. The dock pattern reused (the Tutor's own dock: it survives keystrokes); read-only for now; one at a time;
// device-local (no saved data).
// RED-FIRST, on page-size-r3 @ 243cf8f0: the Grafts rows carry no dock.
//
// Arbor and Flux, 1366x768, a Draft page linked (through the app's own seam) to a character card on a board and to a source page:
//   K1 each linked row in the Grafts tab offers "Dock beside the page"; pressing it docks a READER beside the page - the card's title and text, in words
//   K2 visible while writing: the writer types on the page and the reader stays (full strength), standing beside the page, never over it
//   K3 read-only: the reader is not editable - a press in it and a keystroke change nothing, on the page or on the card
//   K4 copyable into the page: a stretch selected in the reader copies as its plain words (no marks), and pasted into the page it lands as those words
//   K5 one at a time (Fable, Oct 28): the reader's header carries the item's name and Undock, which returns the Grafts list; to swap, Undock and then Dock
//      the source - one reader, the source's words. PARKED VERBATIM below: "docking the source replaces the card" (the reader replaces the list, so no second Dock control stands)
//   K8 the reader's kicker is the theme's own card / page word from the lexicon (Arbor Card/Page, Flux Node/Doc, Machina Block/File), never a hard-coded one
//   K6 device-local: a reload keeps the dock (this device's own setting), and NOTHING saved changed - the page's stored row is byte-identical
//   K7 the reader's Undock removes the reader and returns the Grafts list
//   K4 (Fable, Oct 28): text copied from the reader is the writer's own, so it goes through the Voice Wall's shadow like a page copy - no other wall exception
// Mutant (Arbor): MK2 the reader hidden while writing - K2 fails.
// Frames for Nick (Arbor + Flux), WS_P10D_SHOTS=<dir>: the docked card beside the page while writing.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-linkdock.mjs (apps/desktop, dist-web built)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const SHOTS = process.env.WS_P10D_SHOTS || null;
const shot = async (app, name) => { if (!SHOTS || /^machina-/.test(name)) return; mkdirSync(SHOTS, { recursive: true }); const r = await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(join(SHOTS, `${name}.jpg`), Buffer.from(r.data, 'base64')); };
const mouse = (app, type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const pointOf = (app, expr) => app.evalJs(`(() => { const el = ${expr}; if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; })()`);
const k5Park = [];   // the park record: each skin's K5 observation
const THEMES = [{ id: 'plateau', name: 'Arbor', card: 'Card', page: 'Page' }, { id: 'flux', name: 'Flux', card: 'Node', page: 'Doc' }, { id: 'machina', name: 'Machina', card: 'Block', page: 'File' }];   // the theme's own card / page words (themeLexicon)
const CARD = 'Ada Lovelace\nCartographer of the Well. Fears deep water, keeps the map.';
const SOURCE = 'Smith, J. (2020). The Well Under the Harbour. Harbour Press.';
const PAGE = 'The rope was already there, and the well took the bucket back colder still.';
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${J(id)})||null)`);
const EFF = (sel) => `(() => { const el = document.querySelector(${J(sel)}); if (!el) return null; let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= parseFloat(cs.opacity); } return Math.round(o * 1000) / 1000; })()`;
// the page's own progress strip and word count sit under the page (a thin full-width bar near its bottom edge): the reader must clear their right edge too
const STRIP_RIGHT = `(p) => { let m = null; for (const e of document.querySelectorAll('.desk-frame-stage *')) { const q = e.getBoundingClientRect(); if (q.height > 0 && q.height <= 10 && q.width >= p.width * 0.8 && q.top >= p.bottom - 4 && q.top <= p.bottom + 40 && !e.closest('.wz-link-dock, .wz-tutor-panel')) m = Math.max(m ?? 0, q.right); } return m; }`;
const READER = `(() => { const d = document.querySelector('.wz-link-dock'); if (!d) return null; const r = d.getBoundingClientRect(); const p = document.querySelector('.desk-frame-stage--prose .mode-page').getBoundingClientRect();
  return { count: document.querySelectorAll('.wz-link-dock').length, title: (d.querySelector('.wz-link-dock-title') || {}).textContent || null, text: (d.querySelector('.wz-link-dock-text') || {}).textContent || null,
    editable: d.isContentEditable || !!d.querySelector('[contenteditable="true"]'), left: r.left, right: r.right, pageLeft: p.left, pageRight: p.right, stripRight: (${STRIP_RIGHT})(p), wcRight: (document.querySelector('.mode-wordcount') || {getBoundingClientRect: () => ({right: null})}).getBoundingClientRect().right, docked: document.querySelector('.wz-tutor-panel')?.getAttribute('data-docked') }; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoAddPageLink === 'function'", { label: 'the seams' });
  const now = new Date().toISOString();
  for (const th of THEMES) {
    const P = `p10d-page-${th.id}`, B = `p10d-board-${th.id}`, S = `p10d-src-${th.id}`, C = `p10d-card-${th.id}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: B, text: 'Cast', pageType: 'board', createdAt: now, origin: null, source: null, boxes: [{ id: C, kind: 'text', x: 0.05, y: 0.05, w: 0.35, h: 0.14, z: 1, text: CARD }] })})`);
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: S, text: SOURCE, createdAt: now, origin: null, source: 'page' })})`);
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: P, text: PAGE, createdAt: now, origin: null, source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${P}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${P}', 'off')`);
    await app.evalJs(`window.wrizoAddPageLink(${J(P)}, ${J({ bEntryId: B, bBoxId: C })})`);
    await app.evalJs(`window.wrizoAddPageLink(${J(P)}, ${J({ bEntryId: S })})`);
  }
  await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
  ok('fixture: per skin, a Draft page linked to a character card on a board and to a source page, through the seams', true);

  for (const th of THEMES) {
    const P = `p10d-page-${th.id}`, S = `p10d-src-${th.id}`, C = `p10d-card-${th.id}`, B = `p10d-board-${th.id}`;
    const tag = `${th.name} 1366x768`;
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}')`); await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
    await app.evalJs(`location.hash = '#/page/${P}'`);
    if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: P, timeout: 10000 }))) { ok(`${tag} fixture: the page opened`, false, ''); continue; }
    await sleep(1000);
    const rowBefore = await stored(app, P);
    const tg = await pointOf(app, "document.querySelector('.wz-tutor-grip')"); if (tg) { await click(app, tg.x, tg.y); await sleep(700); }
    const lt = await pointOf(app, "document.querySelector('#wz-tutor-tab-links')"); if (lt) { await click(app, lt.x, lt.y); await sleep(500); }
    const dockBtn = (box, entry) => box ? `document.querySelector('.wz-graft-row[data-graft-box="${box}"] .wz-graft-dock')` : `document.querySelector('.wz-graft-row[data-graft-entry="${entry}"]:not([data-graft-box]) .wz-graft-dock')`;
    const cardBtn = await pointOf(app, dockBtn(C));
    ok(`${tag} K1 (premise): the Grafts tab lists the linked card, with a "Dock beside the page" control`, !!cardBtn, J({ grafts: await app.evalJs("[...document.querySelectorAll('.wz-graft-row')].map((r) => r.getAttribute('data-graft-box') || r.getAttribute('data-graft-entry'))") }));
    if (!cardBtn) continue;
    await click(app, cardBtn.x, cardBtn.y); await sleep(800);
    const r1 = await app.evalJs(READER);
    ok(`${tag} K1: docking the card shows a READER beside the page - the card's title and its words`, !!r1 && r1.count === 1 && r1.title === 'Ada Lovelace' && /Cartographer of the Well\. Fears deep water, keeps the map\./.test(r1.text || '') && r1.docked === 'true', J(r1));
    const kick = (a2) => a2.evalJs("(document.querySelector('.wz-link-dock-kind')?.textContent || '').trim()");
    const k8c = await kick(app);
    ok(`${tag} K8 (card): the reader's kicker is the theme's own card word - "${th.card}" (read: "${k8c}")`, k8c.toLowerCase() === th.card.toLowerCase(), k8c);
    // K2: write on the page
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
    await app.mouseMove(683, 400);
    await app.typeKeys(' She knew the map.'); await sleep(3500);
    const writing = await app.evalJs("document.querySelector('.desk-frame')?.getAttribute('data-writing')");
    const r2 = await app.evalJs(READER); const o2 = await app.evalJs(EFF('.wz-link-dock'));
    ok(`${tag} K2: visible while writing - the writer types and the reader stays at full strength (${o2}), beside the page, never over it or its progress strip`, writing === 'true' && o2 >= 0.99 && !!r2 && r2.left >= r2.pageRight - 1 && (r2.stripRight == null || r2.left >= r2.stripRight - 1) && (r2.wcRight == null || r2.left >= r2.wcRight - 1), J({ writing, o2, r2 }));
    await shot(app, `${th.id}-card-docked-while-writing`);
    if (th.id === 'plateau') {
      await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'p10d-mk2'; s.textContent = \".desk-frame[data-writing='true'] .wz-link-dock{ opacity:0 !important; }\"; document.head.appendChild(s); return true; })()"); await sleep(200);
      const om = await app.evalJs(EFF('.wz-link-dock'));
      await app.evalJs("document.getElementById('p10d-mk2')?.remove()");
      ok(`MK2 (mutant): with the reader hidden while writing (LANDED: ${om}), K2 fails`, om === 0, String(om));
    }
    // K3: read-only
    const cardBefore = ((await stored(app, B)) || {}).boxes;
    const tp = await pointOf(app, "document.querySelector('.wz-link-dock-text')"); if (tp) { await click(app, tp.x, tp.y); await sleep(200); }
    await app.typeKeys('ZZ'); await sleep(1500);
    const r3 = await app.evalJs(READER); const cardAfter = ((await stored(app, B)) || {}).boxes;
    ok(`${tag} K3: read-only - a press in the reader and a keystroke change nothing (the reader's words, the card)`, !!r3 && !r3.editable && !/ZZ/.test(r3.text || '') && J(cardBefore) === J(cardAfter), J({ editable: r3 && r3.editable, text: r3 && r3.text }));
    // K4: copy a stretch from the reader, paste it into the page
    const copied = await app.evalJs(`(() => { const t = document.querySelector('.wz-link-dock-text'); if (!t) return null; const w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT); let n; const want = 'Cartographer of the Well';
      while ((n = w.nextNode())) { const i = n.data.indexOf(want); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + want.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return String(s); } } return null; })()`);
    // the browser's own copy and paste (a trusted keyDown carrying `commands`, as in-app-copy-format.mjs): the copy event is what routes the words through the Voice Wall's shadow
    const command = (k, code, vk, cmd) => app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 2, commands: [cmd] });
    await command('c', 'KeyC', 67, 'copy'); await sleep(200);
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
    await command('v', 'KeyV', 86, 'paste');
    await sleep(1500);
    const pageNow = await stored(app, P);
    ok(`${tag} K4: copyable into the page - the reader's stretch copies as its plain words ("${copied}") and pasted into the page it lands as those words`,
      copied === 'Cartographer of the Well' && !!pageNow && pageNow.text.trimEnd().endsWith('Cartographer of the Well'), J({ copied, page: pageNow && pageNow.text.slice(-60), whisper: await app.evalJs("(() => { const w = document.querySelector('.vw-whisper'); return w ? [w.textContent, w.getAttribute('data-shown')] : null; })()"), edTail: await app.evalJs("(document.querySelector('.forward-only-editor')?.innerText || '').slice(-50)") }));
    // K5: one at a time. PARKED VERBATIM (Fable, Oct 28): docking the source REPLACES the card - the reader replaces the Grafts list, so a second Dock control never stands
    // beside it; the rule is one item at a time, and a swap is Undock, then Dock. The check below is kept as written and no longer run; its successor follows.
    //   const srcBtn = await pointOf(app, dockBtn(null, S));
    //   if (srcBtn) { await click(app, srcBtn.x, srcBtn.y); await sleep(800); }
    //   const r5 = await app.evalJs(READER);
    //   ok(`${tag} K5: one at a time - docking the source replaces the card: one reader, the source's words`, !!srcBtn && !!r5 && r5.count === 1 && /Smith, J\. \(2020\)/.test(r5.text || '') && !/Cartographer/.test(r5.text || ''), J(r5));
    const undock0 = await pointOf(app, "document.querySelector('.wz-link-dock-close')");
    if (undock0) { await click(app, undock0.x, undock0.y); await sleep(700); }
    const listBack = await app.evalJs("!document.querySelector('.wz-link-dock') && !!document.querySelector('.wz-graft-row')");
    const srcBtn = await pointOf(app, dockBtn(null, S));
    if (srcBtn) { await click(app, srcBtn.x, srcBtn.y); await sleep(800); }
    const r5 = await app.evalJs(READER);
    k5Park.push({ tag, count: r5 && r5.count });
    ok(`${tag} K5 (successor): one at a time - Undock returns the Grafts list (${listBack ? 'it did' : 'it did NOT'}), then Dock on the source: one reader, the source's words`, !!undock0 && listBack && !!srcBtn && !!r5 && r5.count === 1 && /Smith, J\. \(2020\)/.test(r5.text || '') && !/Cartographer/.test(r5.text || ''), J(r5));
    const k8p = await kick(app);
    ok(`${tag} K8 (page): the reader's kicker is the theme's own page word - "${th.page}" (read: "${k8p}")`, k8p.toLowerCase() === th.page.toLowerCase(), k8p);
    // K6: device-local - a reload keeps it; nothing saved changed (the page row's own keys and the link list)
    await app.reload(); await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
    await app.evalJs(`location.hash = '#/page/${P}'`); await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { timeout: 10000 }); await sleep(1500);
    const r6 = await app.evalJs(READER); const rowAfter = await stored(app, P);
    const sameShape = !!rowBefore && !!rowAfter && J(Object.keys(rowBefore).sort()) === J(Object.keys(rowAfter).sort()) && J(rowBefore.pageLinks || null) === J(rowAfter.pageLinks || null);
    ok(`${tag} K6: device-local - a reload keeps the dock, and nothing saved changed (the page's stored row has the same fields and the same links)`, !!r6 && /Smith/.test(r6.text || '') && sameShape,
      J({ reader: !!r6, keysBefore: rowBefore && Object.keys(rowBefore).sort(), keysAfter: rowAfter && Object.keys(rowAfter).sort() }));
    await shot(app, `${th.id}-source-docked`);
    // K7: Undock removes the reader and returns the Grafts list
    const cl = await pointOf(app, "document.querySelector('.wz-link-dock-close')"); if (cl) { await click(app, cl.x, cl.y); await sleep(600); }
    { const lt7 = await pointOf(app, "document.querySelector('#wz-tutor-tab-links')"); if (lt7 && !(await app.evalJs("!!document.querySelector('.wz-graft-row')"))) { await click(app, lt7.x, lt7.y); await sleep(500); } }   // a reload (K6) resets the panel to its Tutor tab: the Grafts list is on its own tab again
    ok(`${tag} K7: the reader's Undock removes it and returns the Grafts list`, !!cl && (await app.evalJs("!document.querySelector('.wz-link-dock') && !!document.querySelector('.wz-graft-row')")), J({ cl, now: await app.evalJs("({ dock: !!document.querySelector('.wz-link-dock'), close: !!document.querySelector('.wz-link-dock-close'), rows: document.querySelectorAll('.wz-graft-row').length })") }));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') {
  // K5, parked (Fable, Oct 28): one record per skin, under its original name; each re-verifies the new truth - one reader after Undock then Dock
  const rec = k5Park.map((o) => ({ name: `PARKED (was "${o.tag} K5: one at a time - docking the source replaces the card: one reader, the source's words") - Fable's ruling (Oct 28): one item at a time; to swap, Undock, then Dock`, pass: o.count === 1, detail: J(o) }));
  for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
  console.log(rec.length && rec.every((c) => c.pass) ? `\nPOLISH10-LINKDOCK PARKED: PASS (${rec.length} records) - this FILE parks 1 (K5, one record per skin)` : `\nPOLISH10-LINKDOCK PARKED: FAIL - ${rec.filter((c) => !c.pass).length}/${rec.length} (${rec.length} records)`);
}
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-LINKDOCK VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-LINKDOCK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
