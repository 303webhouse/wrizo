// CONNECTOR-B (Fable, Oct 16; Nick's route (b), Oct 14; the approved connector mockup v6 - cursor/connector @ 3b437b20; plan docs/plans/connector-b-page-links.md). The connector reaches the RAIL: a card in connection mode can
// be released on a thumbnail of a page or a board (a page_links record, owned by this board), a thumbnail can be dragged onto the board for a LINKED COPY, and the right drawer's Grafts / Links tab lists the selected
// card's connections with an X that asks first. A same-board card <-> card link stays a connection box. The storage is proven browserless (page-links.mjs, and page-links-db.mjs against a real Postgres); this is the surfaces.
//
//   B1 in connection mode the rail's thumbnails (the Drawers panel's tiles) are targets: the one under the arm wears a circle - OPEN if the card is not linked to it - and the arm LANDS on it, unclipped, past the board's edge
//   B2 a release on a thumbnail LINKS: ONE record on THIS board (aBoxId = the card, bEntryId = the thumbnail's entry), NO connection box, the mode is over, the thumbnail flashes its circle SOLID for a beat, then hides
//   B3 the card's footer reads "- grafted to: <that board's name>"; the link survives a reload
//   B4 the circle is SOLID on a thumbnail the card is already linked to, and releasing there UNLINKS (a tombstone: deletedAt stamped, the footer goes)
//   B5 ONE TRUTH: a thumbnail whose page is ALREADY a pin card on this board is that CARD - the release makes a connection box between the two cards and NO record
//   B6 the Grafts / Links tab lists the selected card's connections (the link AND a same-board connection), each with an X; the X asks "Remove graft?" with NO "Don't ask me again" (an unlink keeps its own confirm, even with
//      asking turned off); Cancel keeps it; Delete removes whichever record joins the pair
//   B7 a thumbnail dragged onto the board makes a LINKED COPY: a card at the drop point holding that board's words, tied to its original by a record; the thumbnail's own click (it travels) does not fire
//   B8 page primacy: the connector over the rail moves nothing - the canvas rect is identical
//
// Seeding goes through the app's seams; input is trusted CDP mouse events. Needs a box turn (withHarness refuses without WS_BOX_TURN).
// Run: WS_BOX_TURN=<token> node scripts/harness/connector-b.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };

let n = 0;
const fresh = async (app) => {
  n += 1;
  const id = `cb-board-${n}`, b2 = `cb-b2-${n}`, nest = `cb-nest-${n}`;
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  const now = () => new Date().toISOString();
  const boxes = [
    { id: 'cb-a', kind: 'text', x: 0.38, y: 0.06, w: 0.2, h: 0.12, z: 1, text: 'Card A' },
    { id: 'cb-b', kind: 'text', x: 0.68, y: 0.06, w: 0.2, h: 0.12, z: 2, text: 'Card B' },
  ];
  for (const row of [
    { id, text: 'Link board', pageType: 'board', boxes, createdAt: now(), origin: null, source: null },
    { id: b2, text: 'Research board', pageType: 'board', boxes: [], createdAt: now(), origin: null, source: null },
    { id: nest, text: 'Nested board', pageType: 'board', boxes: [], createdAt: now(), origin: null, source: null },
  ]) await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  await app.evalJs(`window.wrizoPinPageToBoard(${JSON.stringify(nest)}, ${JSON.stringify(id)}, { display: true })`);   // a pin card on the board: the one-truth case
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"cb-a\"]')", { label: 'the board', timeout: 9000 });
  await sleep(800);
  return { there, id, b2, nest };
};
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);
const centre = (r) => ({ x: Math.round(r.l + r.w / 2), y: Math.round(r.t + r.h / 2) });
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const glide = async (app, from, to, steps = 8) => { for (let i = 1; i <= steps; i += 1) { await app.mouseMove(Math.round(from.x + ((to.x - from.x) * i) / steps), Math.round(from.y + ((to.y - from.y) * i) / steps)); await sleep(20); } };
const dbl = async (app, x, y) => {
  await app.mouseMove(x, y);
  await mouse(app, 'mousePressed', x, y, { clickCount: 1 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 1 }); await sleep(60);
  await mouse(app, 'mousePressed', x, y, { clickCount: 2 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 2 }); await sleep(250);
};
// A card is looked for, not assumed: after a reload the board re-renders in its own time (B4 died here on a null rect with the card not yet drawn). Wait for it; if it still is not
// there, re-open the board once (leave the address and come back) and wait again; a card that never appears is a NAMED check at the caller, never a crash.
const cardRect = async (app, cardId, patience = 40) => {
  for (let i = 0; i < patience; i += 1) { const r = await R(app, `[data-box-id="${cardId}"]`); if (r && r.w > 0 && r.h > 0) return r; await sleep(150); }
  return null;
};
const selectCard = async (app, cardId) => {
  let r = await cardRect(app, cardId);
  if (!r) {
    const here = await app.evalJs('location.hash');
    await app.evalJs("location.hash = '#/'"); await sleep(500);
    await app.evalJs(`location.hash = ${JSON.stringify(here)}`); await sleep(900);
    r = await cardRect(app, cardId);
  }
  if (!r) return false;
  await click(app, Math.round(r.l + r.w * 0.3), Math.round(r.t + r.h * 0.3)); await sleep(600);
  return true;
};
const enterMode = async (app, cardId) => { if (!(await selectCard(app, cardId))) return null; const h = await R(app, `[data-box-id="${cardId}"] .board-handle`); if (!h) return null; const p = centre(h); await dbl(app, p.x, p.y); return p; };   // null, never a crash: a missing handle is a failed check
const tile = (app, title) => app.evalJs(`(() => { const t = [...document.querySelectorAll('.wz-drawers-tile[data-link-entry]')].find((b) => b.textContent.includes(${JSON.stringify(title)})); if (!t) return null; const r = t.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, entry: t.dataset.linkEntry }; })()`);
const tileState = (app, entry) => app.evalJs(`(() => { const t = document.querySelector('[data-link-entry="${entry}"]'); if (!t) return null; const cs = getComputedStyle(t, '::before'); return { target: t.getAttribute('data-link-target'), peer: t.getAttribute('data-link-peer'), solid: t.getAttribute('data-link-solid'), flash: t.getAttribute('data-link-flash'), circle: cs.content !== 'none' && cs.width === '10px', radius: cs.borderTopLeftRadius, bg: cs.backgroundColor }; })()`);
const armGeo = (app) => app.evalJs(`(() => { const l = document.querySelector('.board-connect-arm'); const o = document.querySelector('.board-connect-overlay'); if (!l || !o) return null; return { x1: +l.getAttribute('x1'), y1: +l.getAttribute('y1'), x2: +l.getAttribute('x2'), y2: +l.getAttribute('y2'), inBody: o.parentElement === document.body, display: getComputedStyle(l).display }; })()`);
const linksOf = (app, id) => app.evalJs(`window.wrizoPageLinksOf(${JSON.stringify(id)})`);
const conns = async (app) => ((await app.evalJs('window.wrizoBoard()')) || []).filter((b) => b.kind === 'connection');
const footer = (app, cardId) => app.evalJs(`document.querySelector('[data-box-id="${cardId}"] .board-card-footer')?.textContent ?? null`);
const armed = (app) => app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
const brass = (app) => app.evalJs("(() => { const p = document.createElement('i'); p.style.color = 'var(--brass)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })()");
// the Drawers entry in the strip is a TOGGLE: pressing it with the panel open CLOSES it (B5 and B9 found the panel gone). Open it only when it is closed.
const openDrawers = async (app) => { await app.evalJs("(() => { const b = document.querySelector('.wz-strip-item[data-category=drawers]'); if (b && !b.classList.contains('active')) b.click(); })()"); await sleep(600); };

await withHarness(async (app) => {
  let f = await fresh(app);
  ok('fixture: the board opened with two cards and a nested board pinned on it; two more boards exist', f.there, JSON.stringify(f));
  await openDrawers(app);
  const tb2 = await tile(app, 'Research board');
  ok('fixture: the rail\'s Drawers panel shows the other board as a thumbnail that declares its entry (data-link-entry)', !!tb2 && tb2.entry === f.b2, JSON.stringify(tb2));
  if (!tb2) return;
  const cv0 = await R(app, '.board-canvas');
  const BR = await brass(app);

  // B1
  const h = await enterMode(app, 'cb-a');
  if (!h) { ok('fixture: the card selected and its corner handle rendered (the select click must land on the CARD, not on a panel tile)', false, JSON.stringify(await R(app, '[data-box-id="cb-a"]'))); return; }
  ok('fixture: connection mode is on (double-click on the corner square)', (await armed(app)) === 'true', String(await armed(app)));
  await glide(app, h, centre(tb2), 10); await sleep(300);
  const st1 = await tileState(app, f.b2); const arm1 = await armGeo(app); const cvR = await R(app, '.board-canvas');
  ok('B1: the thumbnail under the arm wears a circle - OPEN (not brass-filled), a 10px circle - and the arm LANDS on it', !!st1 && st1.target === 'true' && st1.circle && st1.radius === '50%' && st1.solid === null && st1.bg !== BR && !!arm1 && Math.abs(arm1.x2 - (tb2.l + 9)) <= 3 && Math.abs(arm1.y2 - (tb2.t + tb2.h / 2)) <= 3, JSON.stringify({ st1, arm1, tb2 }));
  // ---- PARKED - SUPERSEDED (Fable Oct 17, ledger 86): the original B1 assumed the rail is on the RIGHT of the board. It is on the LEFT. Kept VERBATIM below and no longer run; its successor reads the side.
  //
  // ok('B1: the arm is drawn in a viewport overlay (a portal on body), UNCLIPPED - it ends past the board\'s right edge, over the rail', !!arm1 && arm1.inBody && arm1.display !== 'none' && arm1.x2 > cvR.r, JSON.stringify({ arm1, canvasRight: cvR.r }));
  // ---- PARKED - SUPERSEDED (Fable Oct 17, ledger 87): the rail-side successor compared the thumbnail's centre with the canvas rect's left edge, but the Drawers panel OVERLAYS the canvas (page primacy: the board does not
  // move - B8 passes), so the thumbnail is INSIDE the canvas rect and the check cannot hold on this layout. Kept VERBATIM below and no longer run; its successor allows for the overlay.
  //
  // // the rail's side is READ from where the thumbnail is, never assumed
  // const railLeft = centre(tb2).x < cvR.l;
  // ok(`B1 [rail-side successor]: the arm is drawn in a viewport overlay (a portal on body), UNCLIPPED - it ends past the board's ${railLeft ? 'LEFT' : 'RIGHT'} edge, on the rail's side, over the rail`, !!arm1 && arm1.inBody && arm1.display !== 'none' && (railLeft ? arm1.x2 < cvR.l : arm1.x2 > cvR.r), JSON.stringify({ arm1, railLeft, canvas: { l: cvR.l, r: cvR.r } }));
  // the rail's position is READ, never assumed: the panel overlays the canvas, so a thumbnail may lie inside the canvas rect (then the arm must END ON IT) or outside it (then the arm must also pass that edge)
  const tcx = centre(tb2).x;
  const outsideCanvas = tcx < cvR.l || tcx > cvR.r;
  const onThumb = !!arm1 && arm1.x2 >= tb2.l - 3 && arm1.x2 <= tb2.l + tb2.w + 3 && arm1.y2 >= tb2.t - 3 && arm1.y2 <= tb2.t + tb2.h + 3;
  const edgeOk = !outsideCanvas || (tcx < cvR.l ? arm1.x2 < cvR.l : arm1.x2 > cvR.r);
  ok('B1 [overlay successor]: the arm is drawn in a viewport overlay (a portal on body), UNCLIPPED - the Drawers panel overlays the canvas, and the arm still REACHES the thumbnail: its end lies on it (and past the canvas edge on the rail\'s side when the rail is outside the canvas)', !!arm1 && arm1.inBody && arm1.display !== 'none' && onThumb && edgeOk, JSON.stringify({ arm1, tile: { l: tb2.l, t: tb2.t, w: tb2.w, h: tb2.h }, outsideCanvas, canvas: { l: cvR.l, r: cvR.r } }));
  ok('B8: with the arm over the rail the board has not moved - the canvas rect is identical', JSON.stringify(cv0) === JSON.stringify(cvR), '');

  // B2
  const before2 = (await conns(app)).length;
  await mouse(app, 'mousePressed', ...Object.values(centre(tb2))); await mouse(app, 'mouseReleased', ...Object.values(centre(tb2)));
  await sleep(300);
  const links2 = await linksOf(app, f.id); const flash2 = await tileState(app, f.b2);
  ok('B2: a release on the thumbnail LINKS - ONE record on THIS board (aBoxId = the card, bEntryId = that board), no connection box - and the mode is over',
    links2.length === 1 && links2[0].aEntryId === f.id && links2[0].aBoxId === 'cb-a' && links2[0].bEntryId === f.b2 && !links2[0].bBoxId && (await conns(app)).length === before2 && (await armed(app)) === 'false', JSON.stringify({ links2, armed: await armed(app) }));
  ok('B2: the thumbnail flashes its circle SOLID for a beat (data-link-flash on, brass-filled)', !!flash2 && flash2.flash === 'on' && flash2.circle && flash2.bg === BR, JSON.stringify(flash2));
  await sleep(1800);
  const gone2 = await tileState(app, f.b2);
  ok('B2: the release that LINKED did not also travel - the writer is STILL ON THE BOARD (the click that follows a release on a thumbnail is swallowed; page-primacy line 3)', (await app.evalJs('location.hash')) === `#/page/${f.id}`, String(await app.evalJs('location.hash')));
  ok('B2: then it hides again (no circle, no flash)', !!gone2 && gone2.flash === null && gone2.target === null && gone2.peer === null, JSON.stringify(gone2));

  // B3
  const foot = await footer(app, 'cb-a');
  ok('B3: the card\'s footer reads "- grafted to: Research board" (the link joins the same footer as a same-board connection)', !!foot && /Research board/.test(foot), String(foot));
  await app.evalJs('window.wrizoFlushNow()'); await app.reload();
  await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"cb-a\"]')", { label: 'board after reload', timeout: 9000 }); await sleep(900);
  ok('B3: the link and the footer survive a reload', (await linksOf(app, f.id)).length === 1 && /Research board/.test((await footer(app, 'cb-a')) || ''), String(await footer(app, 'cb-a')));

  // B4
  await openDrawers(app);
  const tb2b = await tile(app, 'Research board');
  if (!tb2b) { ok('B4 fixture: the Drawers panel shows the Research board thumbnail after the reload', false, 'absent'); return; }
  const h4 = await enterMode(app, 'cb-a');
  if (!h4) { ok('fixture: the card selected and its corner handle rendered (the select click must land on the CARD, not on a panel tile)', false, JSON.stringify(await R(app, '[data-box-id="cb-a"]'))); return; }
  await glide(app, h4, centre(tb2b), 10); await sleep(300);
  const st4 = await tileState(app, f.b2);
  ok('B4: the thumbnail the card is ALREADY linked to shows its circle SOLID (peer, brass)', !!st4 && st4.target === 'true' && st4.solid === 'true' && st4.bg === BR, JSON.stringify(st4));
  await mouse(app, 'mousePressed', ...Object.values(centre(tb2b))); await mouse(app, 'mouseReleased', ...Object.values(centre(tb2b))); await sleep(300);
  const stored4 = await app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(f.id)}) || {}).pageLinks || []`);
  await app.evalJs('window.wrizoFlushNow()');
  const stored4b = await app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(f.id)}) || {}).pageLinks || []`);
  ok('B4: releasing there UNLINKS - the record is a TOMBSTONE (deletedAt + updatedAt stamped, nothing removed), no live link remains, and the footer goes', (await linksOf(app, f.id)).length === 0 && stored4b.length === 1 && !!stored4b[0].deletedAt && stored4b[0].updatedAt === stored4b[0].deletedAt && (await footer(app, 'cb-a')) === null, JSON.stringify({ stored4: stored4.length, stored4b }));
  await sleep(1700);

  // B5 one truth
  await openDrawers(app);
  const tnest = await tile(app, 'Nested board');
  if (!tnest) ok('B5 fixture: the nested board\'s thumbnail is in the rail', false, 'absent');
  else {
    const h5 = await enterMode(app, 'cb-a');
    if (!h5) { ok('fixture: the card selected and its corner handle rendered (the select click must land on the CARD, not on a panel tile)', false, JSON.stringify(await R(app, '[data-box-id="cb-a"]'))); return; }
    await glide(app, h5, centre(tnest), 10); await sleep(250);
    await mouse(app, 'mousePressed', ...Object.values(centre(tnest))); await mouse(app, 'mouseReleased', ...Object.values(centre(tnest))); await sleep(400);
    const cs5 = await conns(app); const pin = ((await app.evalJs('window.wrizoBoard()')) || []).find((b) => b.kind === 'page-pin' && b.entryId === f.nest);
    ok('B5: a thumbnail whose page is ALREADY a pin card on this board IS that card - the release makes a CONNECTION BOX between the two cards and NO page-link record', !!pin && cs5.some((c) => (c.connA === 'cb-a' && c.connB === pin.id) || (c.connB === 'cb-a' && c.connA === pin.id)) && (await linksOf(app, f.id)).length === 0, JSON.stringify({ cs5: cs5.length, links: (await linksOf(app, f.id)).length }));
    await sleep(1700);
  }

  // B6 the Grafts / Links tab
  await app.evalJs(`window.wrizoToggleEntryLink(${JSON.stringify(f.id)}, 'cb-a', ${JSON.stringify(f.b2)})`);   // link again, so the tab has a record AND a connection to list
  await selectCard(app, 'cb-a');
  await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700);
  await app.evalJs("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(500);
  const list = await app.evalJs(`[...document.querySelectorAll('.wz-links-item')].map((li) => ({ via: li.dataset.linkVia, kind: li.dataset.linkKind, label: li.querySelector('.wz-links-label')?.textContent, x: !!li.querySelector('.wz-links-x') }))`);
  ok('B6: the Grafts / Links tab lists the selected card\'s connections - the page-link (a board) AND the same-board connection (the pinned nested board) - each with an X', list.length === 2 && list.every((i) => i.x) && list.some((i) => i.via === 'link' && i.label === 'Research board' && i.kind === 'board') && list.some((i) => i.via === 'card' && i.label === 'Nested board'), JSON.stringify(list));
  await app.evalJs("window.wrizoAskBeforeDelete.set(false)");   // an unlink keeps its OWN confirm, whatever the delete setting says
  await app.evalJs("[...document.querySelectorAll('.wz-links-item')].find((li) => li.dataset.linkVia === 'link')?.querySelector('.wz-links-x')?.click()"); await sleep(400);
  const dlg = await app.evalJs("(() => { const d = document.querySelector('.wz-delete-dialog'); if (!d) return null; return { title: d.querySelector('.wz-delete-title')?.textContent, dontAsk: !!d.querySelector('.wz-delete-chk'), buttons: [...d.querySelectorAll('.wz-delete-btn')].map((b) => b.textContent.trim()) }; })()");
  ok('B6: the X asks "Remove graft?" - with Cancel / Delete and NO "Don\'t ask me again" - even with the asking setting OFF (an unlink keeps its own confirm)', !!dlg && dlg.title === 'Remove graft?' && dlg.dontAsk === false && JSON.stringify(dlg.buttons) === JSON.stringify(['Cancel', 'Delete']), JSON.stringify(dlg));
  await app.evalJs("document.querySelector('.wz-delete-btn:not(.wz-delete-go)')?.click()"); await sleep(300);
  ok('B6: Cancel keeps the link', (await linksOf(app, f.id)).length === 1, '');
  await app.evalJs("[...document.querySelectorAll('.wz-links-item')].find((li) => li.dataset.linkVia === 'link')?.querySelector('.wz-links-x')?.click()"); await sleep(400);
  await app.evalJs("document.querySelector('.wz-delete-go')?.click()"); await sleep(500);
  const list2 = await app.evalJs("[...document.querySelectorAll('.wz-links-item')].map((li) => li.dataset.linkVia)");
  ok('B6: Delete removes the page-link (tombstoned, gone from the list); the same-board connection is untouched', (await linksOf(app, f.id)).length === 0 && JSON.stringify(list2) === JSON.stringify(['card']), JSON.stringify(list2));
  await app.evalJs("[...document.querySelectorAll('.wz-links-item')].find((li) => li.dataset.linkVia === 'card')?.querySelector('.wz-links-x')?.click()"); await sleep(400);
  await app.evalJs("document.querySelector('.wz-delete-go')?.click()"); await sleep(600);
  ok('B6: and the X on a same-board connection removes its connection BOX (through the board)', (await conns(app)).length === 0 && (await app.evalJs("document.querySelectorAll('.wz-links-item').length")) === 0, String((await conns(app)).length));

  // B7 drag a thumbnail onto the board
  await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(500);
  await openDrawers(app);
  const tb2c = await tile(app, 'Research board');
  const drop = await app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const r = c.getBoundingClientRect();
    for (let y = r.top + 300; y < Math.min(r.bottom, innerHeight - 120); y += 25) for (let x = r.left + 40; x < r.right - 300; x += 25) if (document.elementFromPoint(x, y) === c) return { x: Math.round(x), y: Math.round(y) };
    return null; })()`);
  const hash0 = await app.evalJs('location.hash');
  if (!tb2c || !drop) ok('B7 fixture: a thumbnail and an empty board point', false, JSON.stringify({ tb2c, drop }));
  else {
    const cardsBefore = ((await app.evalJs('window.wrizoBoard()')) || []).filter((b) => b.kind === 'text').length;
    const p = centre(tb2c);
    await app.mouseMove(p.x, p.y); await mouse(app, 'mousePressed', p.x, p.y);
    await glide(app, p, drop, 12);
    const ghost = await app.evalJs("!!document.querySelector('.wz-link-ghost')");
    await mouse(app, 'mouseReleased', drop.x, drop.y); await sleep(600);
    const all = (await app.evalJs('window.wrizoBoard()')) || [];
    const copy = all.find((b) => b.kind === 'text' && b.text === 'Research board');
    const copyRect = copy ? await R(app, `[data-box-id="${copy.id}"]`) : null;
    const lk = await linksOf(app, f.id);
    ok('B7: dragging the thumbnail shows a ghost under the pointer, and releasing on the board makes a LINKED COPY - a card at the drop point holding that board\'s words, tied to its original by a record (card -> that entry)',
      ghost && !!copy && all.filter((b) => b.kind === 'text').length === cardsBefore + 1 && !!copyRect && Math.abs(copyRect.l - drop.x) <= 8 && Math.abs(copyRect.t - drop.y) <= 8 && lk.length === 1 && lk[0].aBoxId === copy.id && lk[0].bEntryId === f.b2,
      JSON.stringify({ ghost, copy: copy && copy.id, copyRect, drop, links: lk }));
    ok('B7: the thumbnail\'s own click (it travels to the page) did NOT fire - the writer is still on the board', (await app.evalJs('location.hash')) === hash0 && !(await app.evalJs("!!document.querySelector('.wz-link-ghost')")), String(await app.evalJs('location.hash')));
    ok('B7: the copy is a real card - selected, and its footer names its original', (await footer(app, copy ? copy.id : 'none')) !== null && /Research board/.test((await footer(app, copy.id)) || ''), String(copy && (await footer(app, copy.id))));
  }

  // ---- PARKED - SUPERSEDED (Fable Oct 17, ledger 87): B9's driver pressed the corner square with the LEFT button and dragged - which is a RESIZE (held connection mode comes from a RIGHT press on the square, or a second press of a
  // double-press). Kept VERBATIM below and no longer run; the successor drives the right button.
  //
  // // B9 - THE HELD PATH (Fable Oct 17, ledger 86): press the corner square, DRAG to a rail thumbnail holding the button, release there. The release toggles the link and the writer STAYS on the board; the beat then
  // // ends, so a later deliberate click on the same thumbnail still travels (the swallow is a beat, not a lock).
  // await openDrawers(app);
  // const tb9 = await tile(app, 'Research board');
  // const hash9 = await app.evalJs('location.hash');
  // if (!tb9) ok('B9 fixture: the Research board thumbnail is in the rail', false, 'absent');
  // else if (!(await selectCard(app, 'cb-a'))) ok('B9 fixture: the card selected', false, JSON.stringify(await R(app, '[data-box-id="cb-a"]')));
  // else {
  //   const hr9 = await R(app, '[data-box-id="cb-a"] .board-handle');
  //   if (!hr9) ok('B9 fixture: the card\'s corner square rendered', false, 'absent');
  //   else {
  //     const n9 = (await linksOf(app, f.id)).length;
  //     const hp = centre(hr9);
  //     await app.mouseMove(hp.x, hp.y); await mouse(app, 'mousePressed', hp.x, hp.y);
  //     await glide(app, hp, centre(tb9), 12); await sleep(250);
  //     const armed9 = await armed(app);
  //     await mouse(app, 'mouseReleased', ...Object.values(centre(tb9))); await sleep(500);
  //     const n9b = (await linksOf(app, f.id)).length;
  //     ok('B9 [held path]: press the corner square, drag onto a rail thumbnail and release there toggles the link (one record more or fewer), the mode having been armed during the drag', armed9 === 'true' && Math.abs(n9b - n9) === 1, JSON.stringify({ armed9, before: n9, after: n9b }));
  //     ok('B9 [held path]: and the writer is STILL ON THE BOARD (a release is not a click on the thumbnail)', (await app.evalJs('location.hash')) === hash9, String(await app.evalJs('location.hash')));
  //     await sleep(400);
  //     const tb9b = await tile(app, 'Research board');
  //     if (tb9b) { await click(app, ...Object.values(centre(tb9b))); await waitSoft(app, `location.hash === '#/page/${f.b2}'`, { label: 'travel', timeout: 4000 }); }
  //     ok('B9: after the beat, a deliberate click on the thumbnail travels as it always did (the swallow is a beat, not a lock)', (await app.evalJs('location.hash')) === `#/page/${f.b2}`, String(await app.evalJs('location.hash')));
  //   }
  // }

  // B9 [right-button successor] - THE HELD PATH (Fable Oct 17, ledgers 86 and 87): RIGHT-press the corner square, drag to a rail thumbnail holding the button, release there. The release toggles the link and the writer STAYS on the board; no
  // menu opens under the pointer (the thumbnail has its own, with Delete board in it); and a deliberate click on the thumbnail a beat later still travels (the swallow is a beat, not a lock).
  const rDown = (x, y) => app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'right', buttons: 2, clickCount: 1, pointerType: 'mouse' });
  const rMove = (x, y) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'right', buttons: 2, pointerType: 'mouse' });
  const rUp = (x, y) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'right', buttons: 0, clickCount: 1, pointerType: 'mouse' });
  await openDrawers(app);
  const tb9 = await tile(app, 'Research board');
  const hash9 = await app.evalJs('location.hash');
  if (!tb9) ok('B9 fixture: the Research board thumbnail is in the rail', false, 'absent');
  else if (!(await selectCard(app, 'cb-a'))) ok('B9 fixture: the card selected', false, JSON.stringify(await R(app, '[data-box-id="cb-a"]')));
  else {
    const hr9 = await R(app, '[data-box-id="cb-a"] .board-handle');
    if (!hr9) ok('B9 fixture: the card\'s corner square rendered', false, 'absent');
    else {
      const n9 = (await linksOf(app, f.id)).length;
      const hp = centre(hr9), tp = centre(tb9);
      await app.mouseMove(hp.x, hp.y); await rDown(hp.x, hp.y);
      for (let k = 1; k <= 12; k += 1) { await rMove(Math.round(hp.x + ((tp.x - hp.x) * k) / 12), Math.round(hp.y + ((tp.y - hp.y) * k) / 12)); await sleep(20); }
      await sleep(250);
      const armed9 = await armed(app);
      await rUp(tp.x, tp.y); await sleep(500);
      const n9b = (await linksOf(app, f.id)).length;
      ok('B9 [held path, right button]: RIGHT-press the corner square, drag onto a rail thumbnail and release there toggles the link (one record more or fewer), the mode having been armed during the drag', armed9 === 'true' && Math.abs(n9b - n9) === 1, JSON.stringify({ armed9, before: n9, after: n9b }));
      ok('B9 [held path]: and the writer is STILL ON THE BOARD (a release is not a click on the thumbnail)', (await app.evalJs('location.hash')) === hash9, String(await app.evalJs('location.hash')));
      ok('B9 [held path]: and NO menu opened under the pointer (the right-button release must not reach the thumbnail\'s own context menu - it holds Delete board)', (await app.evalJs("!document.querySelector('.wz-ctx')")) === true, String(await app.evalJs("!!document.querySelector('.wz-ctx')")));
      await sleep(900);
      const tb9b = await tile(app, 'Research board');
      if (tb9b) { await click(app, ...Object.values(centre(tb9b))); await waitSoft(app, `location.hash === '#/page/${f.b2}'`, { label: 'travel', timeout: 4000 }); }
      ok('B9: about a second after the release, a deliberate click on the thumbnail travels as it always did (the swallow is a beat, not a lock; no menu ate the click)', (await app.evalJs('location.hash')) === `#/page/${f.b2}`, String(await app.evalJs('location.hash')));
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nCONNECTOR-B VERIFY: PASS (${checks.length} checks)` : `\nCONNECTOR-B VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
