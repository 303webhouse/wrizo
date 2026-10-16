// TYPING-LATENCY - THE PAGE STAYS PUT (Fable, Oct 15): content-visibility on the rows sizes a row that has never been on screen by an
// ESTIMATE; when it renders it takes its real size. "Watch for the page or scrollbar jumping as rows get their real size (scroll
// anchoring, a click far down the page, Ctrl+End, page-scroll-return). Add a check that caret and scroll stay put after jumping to the end
// of a 50k page." On a 50k-word Draft page, every gesture is real (CDP keys and mouse), and each is read twice - at once, and again after
// the rows around it have rendered and settled - so a jump that happens a frame or a second LATER is caught:
//   S1  Ctrl+End: the caret is at the very end, on screen, and neither the caret's place on screen nor the scroll moves as rows settle;
//       the end is the true end (no estimated space left below it).
//   S2  a real click three-quarters down the page: the caret lands on the character clicked, and the clicked word does not move.
//   S3  typing there: the caret advances and the word stays where it is.
//   S4  Ctrl+Home: the caret at 0, and the page stays at the top.
//   S5  page -> its Plan -> back (the way-back, page-scroll-return's road): the caret comes back to the same offset AND to the same place
//       on screen (the remounted page starts from estimates, so an equal scrollTop alone could show different text - the caret's own
//       rect is what is compared).
// Positions are compared within 2 px (3 px for the return, page-scroll-return's own tolerance).
// Run: node scripts/harness/typing-latency-scroll.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const PAGE = 'tls-page';
const WORDS = 50000;
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 40 + (i % 90); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };

const key = (app, k, code, vk, modifiers) => app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers })
  .then(() => app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers }));
const mouse = (app, type, x, y, n, b) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: b, clickCount: n, pointerType: 'mouse' });
// the caret: its plain offset, and its place on screen relative to the scroller (a 1-character range when the collapsed one has no rect)
const caret = (app) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const sc = document.querySelector('.mode-scroll'); const s = getSelection();
  if (!ed || !sc || !s.rangeCount || !ed.contains(s.anchorNode)) return null;
  const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.anchorNode, s.anchorOffset); const off = r.toString().split('\\u200b').join('').length;
  const c = s.getRangeAt(0).cloneRange(); let rect = c.getClientRects()[0];
  if (!rect && s.anchorNode.nodeType === 3 && s.anchorNode.length > 0) { const q = document.createRange(); const o = s.anchorOffset;
    if (o > 0) { q.setStart(s.anchorNode, o - 1); q.setEnd(s.anchorNode, o); } else { q.setStart(s.anchorNode, 0); q.setEnd(s.anchorNode, 1); } rect = q.getClientRects()[0]; }
  const sb = sc.getBoundingClientRect();
  return { offset: off, top: rect ? Math.round((rect.top - sb.top) * 10) / 10 : null, visible: !!rect && rect.top >= sb.top - 1 && rect.bottom <= sb.bottom + 1,
    scrollTop: Math.round(sc.scrollTop), atBottom: Math.abs(sc.scrollTop + sc.clientHeight - sc.scrollHeight) <= 2, scrollHeight: sc.scrollHeight,
    textLength: ed.textContent.split('\\u200b').join('').length }; })()`);
const settle = () => sleep(1500);   // rows around the caret render; any re-anchoring has happened by now

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: PAGE, text: pageOf(WORDS), createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${PAGE}', 'drafting')`);
  await sleep(600);
  await app.evalJs(`location.hash = '#/page/${PAGE}'`);
  const up = await waitSoft(app, `!!document.querySelector('${ED} .wz-row')`, { label: 'the 50k page, as rows', timeout: 30000 });
  // ---- PARKED - SUPERSEDED by Fable's ruling of Oct 16 (chat 1's ledger 67): content-visibility is REMOVED from the rows (it took the
  // off-screen rows' text out of innerText, and failed S1 and S5 below). Kept VERBATIM and no longer run; successor directly below.
  // ok('(premise) the 50k-word page opens in Draft as rows, with content-visibility on them', up && (await app.evalJs(`getComputedStyle(document.querySelector('${ED} .wz-row')).contentVisibility`)) === 'auto',
  //   String(up && await app.evalJs(`getComputedStyle(document.querySelector('${ED} .wz-row')).contentVisibility`)));
  // ------------------------------------------------------------------
  const cvNow = up ? await app.evalJs(`getComputedStyle(document.querySelector('${ED} .wz-row')).contentVisibility`) : null;
  ok('(premise) [content-visibility removed] the 50k-word page opens in Draft as rows, and no row is skipped by content-visibility', up && cvNow === 'visible', String(cvNow));
  if (!up) return;
  await sleep(1500);
  await app.evalJs(`document.querySelector('${ED}').focus()`);

  // ---- S1 Ctrl+End
  await key(app, 'End', 'End', 35, 2);
  await sleep(150);
  const e0 = await caret(app);
  await settle();
  const e1 = await caret(app);
  ok('S1: Ctrl+End puts the caret at the very end of the 50k page, and it is on screen', !!e0 && !!e1 && e1.offset === e1.textLength && e1.visible, JSON.stringify({ e0, e1 }));
  ok('S1: as the rows settle, neither the caret\'s place on screen nor the scroll moves (within 2 px)', !!e0 && !!e1 && e0.top !== null && e1.top !== null && Math.abs(e1.top - e0.top) <= 2 && Math.abs(e1.scrollTop - e0.scrollTop) <= 2, JSON.stringify({ e0, e1 }));
  ok('S1: the end is the true end - the scroller sits at its bottom, no estimated space left below the last line', !!e1 && e1.atBottom, JSON.stringify(e1));

  // ---- S2 a real click three-quarters down
  await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = Math.round((sc.scrollHeight - sc.clientHeight) * 0.75); })()");
  await settle();
  const target = await app.evalJs(`(() => { const sc = document.querySelector('.mode-scroll').getBoundingClientRect(); const x = Math.round(sc.left + sc.width / 2), y = Math.round(sc.top + sc.height / 2);
    const p = document.caretRangeFromPoint(x, y); if (!p || p.startContainer.nodeType !== 3) return null; const ed = document.querySelector('${ED}');
    const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(p.startContainer, p.startOffset); const off = r.toString().split('\\u200b').join('').length;
    const w = document.createRange(); w.setStart(p.startContainer, Math.max(0, p.startOffset - 1)); w.setEnd(p.startContainer, Math.min(p.startContainer.length, p.startOffset + 1));
    const wr = w.getClientRects()[0]; return { x, y, offset: off, wordTop: wr ? Math.round(wr.top * 10) / 10 : null }; })()`);
  if (target) { await mouse(app, 'mouseMoved', target.x, target.y, 0, 0); await mouse(app, 'mousePressed', target.x, target.y, 1, 1); await mouse(app, 'mouseReleased', target.x, target.y, 1, 0); }
  await sleep(150);
  const c0 = await caret(app);
  await settle();
  const c1 = await caret(app);
  ok('S2: a real click three-quarters down lands the caret on the character clicked (within one)', !!target && !!c1 && Math.abs(c1.offset - target.offset) <= 1, JSON.stringify({ target, c1 }));
  ok('S2: and the clicked line does not move - on the click, or as the rows around it settle (within 2 px)', !!target && !!c0 && !!c1 && target.wordTop !== null && c0.top !== null && c1.top !== null
    && Math.abs(c1.top - c0.top) <= 2 && Math.abs(c1.scrollTop - c0.scrollTop) <= 2, JSON.stringify({ target, c0, c1 }));

  // ---- S3 typing there
  await app.typeKeys('x');
  await settle();
  const t1 = await caret(app);
  ok('S3: typing there advances the caret by one, and the line stays where it is (within 2 px)', !!c1 && !!t1 && t1.offset === c1.offset + 1 && t1.top !== null && Math.abs(t1.top - c1.top) <= 2, JSON.stringify({ c1, t1 }));
  // S3b (Fable, Oct 16: no save reads the rendered rows - "only from the model"): once the autosave lands, the STORED text is the editor's
  // whole text, the letter typed three-quarters down included (the static half is scripts/typing-latency-readers-guard.mjs)
  const storedText = async () => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(PAGE)})||{}).text ?? null`);
  let st = await storedText(); for (let i = 0; i < 40; i += 1) { await sleep(200); const n = await storedText(); if (n === st && i > 12) break; st = n; }
  const edText = await app.evalJs(`document.querySelector('${ED}').textContent.split('\\u200b').join('')`);
  ok('S3b: the page SAVES its whole text from the model - the stored text equals the editor\'s, the letter typed far down included', typeof st === 'string' && st === edText,
    JSON.stringify({ storedLength: st && st.length, editorLength: edText.length, same: st === edText }));

  // ---- S4 Ctrl+Home
  await key(app, 'Home', 'Home', 36, 2);
  await sleep(150);
  const h0 = await caret(app);
  await settle();
  const h1 = await caret(app);
  ok('S4: Ctrl+Home puts the caret at 0 and the page stays at the top as the rows settle', !!h0 && !!h1 && h1.offset === 0 && h1.visible && Math.abs(h1.scrollTop - h0.scrollTop) <= 2, JSON.stringify({ h0, h1 }));

  // ---- S5 page -> Plan -> back (the way-back)
  await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = Math.round((sc.scrollHeight - sc.clientHeight) * 0.6); })()");
  await settle();
  const mid = await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll').getBoundingClientRect(); return { x: Math.round(sc.left + sc.width / 2), y: Math.round(sc.top + sc.height / 2) }; })()");
  await mouse(app, 'mouseMoved', mid.x, mid.y, 0, 0); await mouse(app, 'mousePressed', mid.x, mid.y, 1, 1); await mouse(app, 'mouseReleased', mid.x, mid.y, 1, 0);
  await settle();
  const before = await caret(app);
  const door = await app.evalJs("!!document.querySelector('[data-page-plan-door]')");
  if (door) {
    await app.evalJs("document.querySelector('[data-page-plan-door]').click()");
    await waitSoft(app, "!!document.querySelector('[data-board-door=\"page\"]')", { label: 'the Plan', timeout: 9000 });
    await sleep(900);
    await app.evalJs("document.querySelector('[data-board-door=\"page\"]').click()");
    await waitSoft(app, `location.hash === '#/page/${PAGE}' && !!document.querySelector('${ED} .wz-row')`, { label: 'back on the page', timeout: 30000 });
    await settle();
  }
  const after = await caret(app);
  ok('S5: page -> Plan -> back returns the caret to the same offset AND the same place on screen (within 3 px) - an equal scrollTop over re-estimated rows would show other text',
    door && !!before && !!after && after.offset === before.offset && before.top !== null && after.top !== null && Math.abs(after.top - before.top) <= 3, JSON.stringify({ door, before, after }));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nTYPING-LATENCY-SCROLL VERIFY: PASS (${checks.length} checks)` : `\nTYPING-LATENCY-SCROLL VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
