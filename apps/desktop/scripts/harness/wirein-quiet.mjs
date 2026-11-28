// #147 and #148 - WIRE IN HAS NO MENUS; ITS BAR STANDS AT THE FOOT, ITS X COMES WITH THE POINTER, A PROMPT STANDS BESIDE THE X (Nick, Nov 27: "Wire In should not have any menus available --- keyboard shortcutting or the WordPress style B-I-U
// menu over the selected text can be available"; "the green progress bar ... at the bottom of the screen, and the 'X' should only appear when the User moves the mouse ... an icon next to the 'X' that pops up a writing prompt").
// Flux, Wire In, 1366 x 768 and 1920 x 950. Real keys and a real mouse.
//   M1  no menu tab is drawn or reachable by Tab, at rest and after the pointer moves
//   M2  Ctrl+/ opens nothing, there or on leaving
//   F1  a selected word and Ctrl+B / Ctrl+I / Ctrl+U: the stored words carry the mark, the page paints it, nothing is lost
//   F2  over a selection a small B I U bar stands, above it and inside the window; its button marks the words and keeps the selection; it goes when the selection does
//   F3  a struck word stays struck and on the page when another is marked; typing after lands at the end
//   B1  the lime bar stands at the screen's foot
//   X1  the X is not shown until the pointer moves, and fades after a few seconds of stillness; typing hides it at once
//   P1  the prompt button stands beside the X and shows with it; a press gives one writing prompt; the page and her words are as before; it closes
//   G1  the Guide chip shows only when the X does (the rule is read on a stand-in element of the chip's class)
//   E1  Esc still leaves, to Draft, and no menu stands open there
//   S1  in Draft the Operator tab carries the "Prompts from the Operator" switch
//   MUT the judges go RED on a drawn tab and on a bar at the top
// Run: node scripts/harness/wirein-quiet.mjs (from apps/desktop; Actions or the box).
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 700) : ''}`); };
const J = (v) => JSON.stringify(v);
const ID = 'wq1';
const TEXT = 'The tunnel waits for her words. The lamp is warm and the river is loud tonight.';

// drawn: it has a box and nothing above it hides it
const SEEN = `(sel) => { const e = document.querySelector(sel); if (!e) return null; for (let n = e; n && n !== document.documentElement; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return null; }
  const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 ? [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] : null; }`;
const noTabs = (t) => t.sliver === null && t.tutor === null;
const atFoot = (box, h) => !!box && box[3] >= h - 3 && box[1] >= h - 6;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const seen = (sel) => ev(`(${SEEN})(${J(sel)})`);
  const soft = async (expr, timeout = 12000) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout }); return true; } catch { return false; } };
  const stored = async () => { await sleep(2500); return ev(`(() => { window.wrizoFlushNow(); const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === '${ID}'); return e ? e.text : null; })()`); };
  const page = () => ev("(() => { const p = document.querySelector('.mode-page').getBoundingClientRect(); return [Math.round(p.left), Math.round(p.top), Math.round(p.width), Math.round(p.height)]; })()");
  const words = () => ev("document.querySelector('.forward-only-editor').textContent");
  const move = async (x, y) => { await app.mouseMove(x, y); await app.mouseMove(x + 6, y + 4); await sleep(450); };
  // the screen box of a word as drawn (the last one on the page that reads it)
  const wordBox = (w) => ev(`(() => { const ed = document.querySelector('.forward-only-editor'); const t = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let found = null;
    for (let n = t.nextNode(); n; n = t.nextNode()) { const i = n.data.lastIndexOf(${J(w)}); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ${w.length}); const b = r.getBoundingClientRect(); if (b.width > 0) found = [b.left, b.top, b.right, b.bottom]; } } return found; })()`);
  // a move with the button held (the driver's mouseMove says no button, which drags nothing)
  const held = (x, y) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1, pointerType: 'mouse' });
  const drag = async (w) => { const b = await wordBox(w); if (!b) return false; const y = (b[1] + b[3]) / 2; await app.mouseMove(b[0] + 1, y); await app.mouseDown(b[0] + 1, y); await held((b[0] + b[2]) / 2, y); await held(b[2] - 1, y); await app.mouseUp(b[2] - 1, y); await sleep(300); return true; };
  const selected = () => ev('String(getSelection())');
  const chord = async (key, code, vk, mods = 2) => { await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, modifiers: mods }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers: mods }); await sleep(400); };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux'); true");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  await ev(`window.wrizoCreateJournalPage(${J({ id: ID, text: TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); localStorage.setItem('wrizo-mode-page-${ID}', 'journal'); localStorage.setItem('wrizo-writing-settings', JSON.stringify({ instrumentsOn: true, progress: 'words', themeTracker: true })); localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: 500, unit: 'words' })); window.wrizoFlushNow(); history.replaceState(null, '', '/#/page/${ID}'); true`);
  await app.reload();
  await soft("document.documentElement.hasAttribute('data-flux3-jacked') && !!document.querySelector('.forward-only-editor')");
  await soft("!document.querySelector('.wz-splash')");
  await sleep(5000);

  const tabs = async () => ({ sliver: await seen('.wz-sliver-grip'), tutor: await seen('.wz-tutor-grip') });
  const rest = await tabs();
  await move(600, 200);
  const moved = await tabs();
  const reach = await ev("(() => [...document.querySelectorAll('.wz-sliver-grip, .wz-tutor-grip')].filter((e) => { e.focus(); const got = document.activeElement === e; if (got) e.blur(); return got; }).length)()");
  ok('M1 no menu tab is drawn at rest or after a pointer move, and none takes focus', noTabs(rest) && noTabs(moved) && reach === 0, J({ rest, moved, reach }));

  // M3 (Fable, Nov 27, #147 Q1: A): the hidden rail's buttons are out of the Tab order too
  const railTakes = await ev("(() => { const b = [...document.querySelectorAll('.desk-frame-strip button, .desk-rail button')]; return { buttons: b.length, take: b.filter((e) => { e.focus(); const got = document.activeElement === e; if (got) e.blur(); return got; }).length }; })()");
  ok('M3 no button of the hidden rail takes focus in Wire In', railTakes.buttons > 0 && railTakes.take === 0, J(railTakes));

  await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
  await chord('/', 'Slash', 191);
  const opened = await ev("!!document.querySelector('.wz-sliver[data-open=\"true\"]')");
  ok('M2 Ctrl+/ opens nothing in Wire In', opened === false, J({ opened }));

  // ---- formatting ----------------------------------------------------------------------------------------------------------------------------------
  await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
  await app.typeKeys(' Keep the word oak.');
  await sleep(500);
  const before = await stored();
  const got = await drag('oak');
  const sel1 = await selected();
  const bar = await seen('[data-flux-selbar]');
  const wb = await wordBox('oak');
  const buttons = await ev("[...document.querySelectorAll('[data-flux-selbar] button')].map((b) => b.getAttribute('data-format'))");
  ok('F2 a selected word shows the B I U bar above it, inside the window', got && sel1 === 'oak' && !!bar && bar[3] <= wb[1] + 1 && bar[0] >= 0 && bar[2] <= 1366 && bar[1] >= 0 && J(buttons) === J(['bold', 'italic', 'underline']), J({ sel1, bar, word: wb, buttons }));
  await chord('b', 'KeyB', 66);
  const bold = await stored();
  const boldDrawn = await ev("[...document.querySelectorAll('.forward-only-editor .md-bold')].some((e) => e.textContent.includes('oak'))");
  ok('F1 Ctrl+B marks the selected word, paints it and loses nothing', !!bold && bold === before.replace('oak', '**oak**') && boldDrawn, J({ before, bold, boldDrawn }));
  const still = await selected();
  await chord('i', 'KeyI', 73);
  const ital = await stored();
  await chord('u', 'KeyU', 85);
  const und = await stored();
  ok('F1 Ctrl+I and Ctrl+U mark it too, with the selection kept', still.includes('oak') && !!ital && ital !== bold && ital.includes('oak') && !!und && und !== ital && und.includes('oak') && und.replace(/[*_+~]/g, '') === before.replace(/[*_+~]/g, ''), J({ still, ital, und }));
  const press = async (sel) => { const b = await seen(sel); if (!b) return false; const x = (b[0] + b[2]) / 2, y = (b[1] + b[3]) / 2; await app.mouseMove(x, y); await app.mouseDown(x, y); await app.mouseUp(x, y); await sleep(450); return true; };
  const pressedB = await press('[data-flux-selbar] [data-format="bold"]');
  const off = await stored();
  const selAfter = await selected();
  ok('F2 the bar\'s B takes the bold off again and the selection stays', pressedB && !!off && off.includes('oak') && !off.includes('**oak') && selAfter.includes('oak'), J({ off, selAfter }));
  await ev("getSelection().removeAllRanges(); true"); await sleep(400);
  const gone = await seen('[data-flux-selbar]');
  ok('F2 the bar goes when the selection does', gone === null, J({ gone }));

  // a struck word stays, and typing lands at the end
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus({ preventScroll: true }); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r); return true; })()");
  await app.typeKeys(' gone');
  await chord('Backspace', 'Backspace', 8, 0); await chord('Backspace', 'Backspace', 8, 0); await chord('Backspace', 'Backspace', 8, 0);
  const struck0 = await ev("[...document.querySelectorAll('.forward-only-editor .fo-struck')].map((e) => e.textContent).join('|')");
  const t0 = await stored();
  await drag('lamp');
  await chord('b', 'KeyB', 66);
  const struck1 = await ev("[...document.querySelectorAll('.forward-only-editor .fo-struck')].map((e) => e.textContent).join('|')");
  const t1 = await stored();
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r); return true; })()");
  await app.typeKeys(' end');
  await sleep(500);
  const t2 = await stored();
  ok('F3 the struck letters stay as they were, another word takes the mark, and typing lands at the end', struck0.length > 0 && struck1 === struck0 && !!t1 && t1 === t0.replace('lamp', '**lamp**') && !!t2 && t2.startsWith(t1) && t2.endsWith(' end'), J({ struck0, struck1, t0, t1, t2 }));

  // ---- the bar, the X, the prompt ------------------------------------------------------------------------------------------------------------------
  const lime = await seen('[data-flux3-burst]');
  ok('B1 the lime bar stands at the screen\'s foot', atFoot(lime, 768), J({ lime }));
  await app.typeKeys(' x');
  await sleep(400);
  const x0 = await seen('[data-flux3-leave]');
  const p0 = await seen('[data-flux3-prompt]');
  await move(700, 300);
  const x1 = await seen('[data-flux3-leave]');
  const p1 = await seen('[data-flux3-prompt]');
  await sleep(5500);
  const x2 = await seen('[data-flux3-leave]');
  ok('X1 the X is not shown while she writes, comes with the pointer, and fades after a few still seconds', x0 === null && !!x1 && x2 === null, J({ x0, x1, x2 }));
  await move(720, 320);
  await app.typeKeys('y'); await sleep(400);
  const x3 = await seen('[data-flux3-leave]');
  ok('X1 typing hides it at once', x3 === null, J({ x3 }));

  await move(700, 300);
  const pb = await seen('[data-flux3-prompt]');
  const xb = await seen('[data-flux3-leave]');
  const pageA = await page();
  const wordsA = await words();
  const pressedP = await press('[data-flux3-prompt]');
  await soft("(document.querySelector('[data-flux3-prompt-card] [data-prompt-text]')?.textContent || '').trim().length > 8", 20000);   // the card says '…' until the prompt arrives
  const card = await ev("(() => { const c = document.querySelector('[data-flux3-prompt-card]'); return c ? { text: (c.querySelector('[data-prompt-text]')?.textContent || '').trim(), n: document.querySelectorAll('[data-flux3-prompt-card]').length } : null; })()");
  const cardBox = await seen('[data-flux3-prompt-card]');
  ok('P1 the prompt button stands beside the X and shows with it; a press gives one prompt', p0 === null && !!pb && !!xb && Math.abs((pb[1] + pb[3]) / 2 - (xb[1] + xb[3]) / 2) <= 6 && pb[2] <= xb[0] + 2 && xb[0] - pb[2] <= 32 && pressedP && !!card && card.n === 1 && card.text.length > 8 && !!cardBox && cardBox[2] <= 1366 && cardBox[3] <= 768, J({ p0, p1, pb, xb, card, cardBox }));
  ok('P1 the page and her words are as before', J(await page()) === J(pageA) && (await words()) === wordsA, J({ pageA }));
  await press('[data-flux3-prompt-card] [data-prompt-close]');
  const closed = await seen('[data-flux3-prompt-card]');
  ok('P1 it closes', closed === null, J({ closed }));

  // G1: the chip's rule, on a stand-in of its class (a walk's chip is placed by the walk's own host)
  await ev("(() => { const b = document.createElement('button'); b.className = 'wz-walk-chip'; b.id = 'standin'; b.textContent = 'GUIDE'; b.style.cssText = 'left:100px;top:100px'; document.body.appendChild(b); return true; })()");
  await app.typeKeys('z'); await sleep(400);
  const chip0 = await seen('#standin');
  await move(650, 280);
  const chip1 = await seen('#standin');
  ok('G1 the Guide chip shows only when the X does', chip0 === null && !!chip1, J({ chip0, chip1 }));
  await ev("document.getElementById('standin').remove(); true");

  await app.emulateDpr(1, 1920, 950);
  await sleep(1500);
  const wide = await tabs();
  const limeW = await seen('[data-flux3-burst]');
  await move(900, 300);
  const pbW = await seen('[data-flux3-prompt]'), xbW = await seen('[data-flux3-leave]');
  ok('1920 no tab, the bar at the foot, the prompt button beside the X', noTabs(wide) && atFoot(limeW, 950) && !!pbW && !!xbW && pbW[2] <= xbW[0] + 2, J({ wide, limeW, pbW, xbW }));
  await app.emulateDpr(1, 1366, 768);
  await sleep(1200);

  // ---- leaving ---------------------------------------------------------------------------------------------------------------------------------------
  await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
  await chord('Escape', 'Escape', 27, 0);
  await sleep(2000);
  const left = await ev("({ jacked: document.documentElement.hasAttribute('data-flux3-jacked'), sliver: !!document.querySelector('.wz-sliver[data-open=\"true\"]'), back: document.querySelector('.wz-tutor-grip')?.getAttribute('aria-expanded') })");
  ok('E1 Esc leaves to Draft and no menu stands open there', left.jacked === false && left.sliver === false && left.back !== 'true', J(left));
  await move(600, 300);
  await press('.wz-tutor-grip');
  await sleep(900);
  await ev("(() => { const t = [...document.querySelectorAll('.wz-tutor-panel [role=\"tab\"]')].find((b) => /operator/i.test(b.textContent)); if (t) t.click(); return !!t; })()");
  await sleep(700);
  const sw = await seen('.wz-tutor-panel [data-sprint-use]');
  ok('S1 in Draft the Operator tab carries the "Prompts from the Operator" switch', !!sw, J({ sw }));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

ok('MUT the judges go RED on a drawn tab and on a bar at the top', !noTabs({ sliver: null, tutor: [1, 1, 20, 40] }) && !atFoot([0, 0, 1366, 2], 768) && atFoot([0, 766, 1366, 768], 768));

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nWIREIN-QUIET PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nWIREIN-QUIET VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nWIREIN-QUIET VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
