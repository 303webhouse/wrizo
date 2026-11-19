// THE SIGN-IN POP-OUT OVER ARBOR'S FRONT DOOR (Fable, Nov 18, 12:50 pm: "the front layer dims under the pop-out; the spec's veil is #0A0503 at 72%, over the whole front door"). ON the redesign as it ships (no query), SIGNED OUT:
//   A1 the splash's Sign in door opens the pop-out (.wz-popout[data-popout=signin], a dialog) and the front door STAYS under it: .arbor2-front is there, `behind`, shown (a width), read out as nothing (aria-hidden), not pressable
//   A2 the veil is the spec's: .wz-arrival[data-stage=signin]::after is rgba(10,5,3,.72), above the front layer and under the panel (z-index between the front's and the panel's), and as wide as the whole door
//   A3 "New here? Create an account" swaps the panel's face in place (data-popout=account, the 18+ tick there) and the front door and the veil stay
//   A4 Back puts the doors back: the front without `behind`, its Sign in door pressable again, no panel
//   A5 Esc closes the panel like Back (spec draft 4 §1; Fable Nov 18, 6:05 pm): on sign-in it returns to the doors (the front without `behind`); M3 (mutant) the key swallowed before the handler (asserted landed) leaves the panel up
//   A6 a SHORT window (1366x560) on the redesign, create-account face with the 18+ error showing (the Wrizors' v6/v7 pass; Fable Nov 18, 8:15 pm): the panel's foot is 24 px above the window's foot, the button and the back sit inside the panel and the window, and the button does not move when the fields scroll; M4 (mutant) the cap taken away (asserted LANDED): A6's read goes red
//   M1 (mutant) the veil taken away (asserted LANDED): A2's read goes red
//   M2 (mutant) the front door sent away as main sent it before the pop-out (class gone; asserted LANDED): A1's read goes red
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_ANON ??= '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const press = async (app, sel) => {
  const at = await app.evalJs(`(() => { const e = document.querySelector(${J(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; })()`);
  if (!at) return false;
  await app.mouseMove(at.x, at.y); await app.mouseDown(at.x, at.y); await app.mouseUp(at.x, at.y); await sleep(700); return true;
};
const READ = `(() => {
  const q = (s) => document.querySelector(s); const front = q('.arbor2-front'); const arr = q('.wz-arrival'); const pop = q('.wz-popout');
  const veil = arr ? getComputedStyle(arr, '::after') : null; const fr = front ? front.getBoundingClientRect() : null;
  return { arbor: document.documentElement.getAttribute('data-arbor2'), stage: arr && arr.getAttribute('data-stage'),
    front: !!front, frontBehind: !!front && front.classList.contains('behind'), frontGone: !!front && front.classList.contains('gone'), frontW: fr ? Math.round(fr.width) : 0,
    frontHidden: front && front.getAttribute('aria-hidden'), frontPE: front && getComputedStyle(front).pointerEvents, frontZ: front && getComputedStyle(front).zIndex,
    pop: pop ? pop.getAttribute('data-popout') : null, popRole: pop && pop.getAttribute('role'), popZ: pop && getComputedStyle(pop).zIndex,
    veilBg: veil && veil.backgroundColor, veilZ: veil && veil.zIndex, veilContent: veil && veil.content, veilW: veil && veil.width, arrW: arr ? Math.round(arr.getBoundingClientRect().width) : 0,
    adult: !!q('.wz-popout .wz-adult'), signinDoor: !!q('.arbor2-front-doors .arbor2-door.wz-arrival-signin:not([disabled])') }; })()`;
const A1 = (r) => !!r && r.arbor === 'true' && r.pop === 'signin' && r.popRole === 'dialog' && r.front && r.frontBehind && !r.frontGone && r.frontW > 0 && r.frontHidden === 'true' && r.frontPE === 'none';
const A2 = (r) => !!r && r.veilBg === 'rgba(10, 5, 3, 0.72)' && r.veilContent !== 'none' && Number(r.veilZ) > Number(r.frontZ) && Number(r.veilZ) < Number(r.popZ) && r.veilW === `${r.arrW}px`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const front = async () => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
    await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 25000 });
    await waitSoft(app, "(() => { const b = document.querySelector('.arbor2-front-doors .arbor2-door.wz-arrival-signin:not([disabled])'); if (!b) return false; const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === b || b.contains(t)); })()", { label: 'the Sign in door, hit-testable', timeout: 20000 });
    await sleep(600);
  };
  const open = async () => { await front(); const pressed = await press(app, '.arbor2-front-doors .arbor2-door.wz-arrival-signin'); await waitSoft(app, "!!document.querySelector('.wz-popout')", { label: 'the pop-out', timeout: 8000 }); await sleep(500); return pressed; };

  const pressed = await open(); const a = await app.evalJs(READ);
  ok(`A1 the Sign in door opens the pop-out (pressed ${pressed}) and the front door stays under it, behind, shown, not read out, not pressable`, pressed && A1(a), J(a));
  ok(`A2 the veil is the spec's: rgba(10,5,3,.72) over the whole door, z ${a && a.veilZ} between the front (${a && a.frontZ}) and the panel (${a && a.popZ})`, A2(a), J(a));

  await press(app, '.wz-popout-switch'); await sleep(500);
  const c = await app.evalJs(READ);
  ok('A3 "New here? Create an account" swaps the face in place (account, the 18+ tick) and the front door and the veil stay', !!c && c.pop === 'account' && c.adult && A1({ ...c, pop: 'signin' }) && A2(c), J(c));

  // the account face's back goes to sign-in, sign-in's back to the doors: two presses
  await press(app, '.wz-popout-back'); await sleep(500); await press(app, '.wz-popout-back'); await sleep(600);
  const back = await app.evalJs(READ);
  ok('A4 Back puts the doors back: no panel, the front without `behind`, its Sign in door pressable', !!back && back.pop === null && back.front && !back.frontBehind && back.signinDoor, J(back));

  // A5: Esc (a trusted key), and its mutant
  const esc = async () => { for (const type of ['rawKeyDown', 'keyUp']) await app.cdp('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }); await sleep(600); };
  await open(); await esc(); const e5 = await app.evalJs(READ);
  ok('A5 Esc on the sign-in face returns to the doors: no panel, the front without `behind`, its Sign in door pressable', !!e5 && e5.pop === null && e5.front && !e5.frontBehind && e5.signinDoor, J(e5));
  await open();
  await app.evalJs("window.__escSwallow = (e) => { if (e.key === 'Escape') e.stopImmediatePropagation(); }; window.addEventListener('keydown', window.__escSwallow, true); true");
  await esc(); const m3 = await app.evalJs(READ);
  await app.evalJs("window.removeEventListener('keydown', window.__escSwallow, true); true");
  ok(`M3 (mutant): the Esc handler taken away (key swallowed; LANDED: panel still ${J(m3 && m3.pop)}) - A5's read goes RED`, !!m3 && m3.pop === 'signin', J(m3));
  // M1: the veil taken away
  await open();
  await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'mut-veil'; s.textContent = '.wz-arrival::after{ background:none !important; }'; document.head.appendChild(s); return true; })()");
  const m1 = await app.evalJs(READ);
  ok(`M1 (mutant): the veil taken away (LANDED: ${m1 && m1.veilBg}) - A2's read goes RED`, !!m1 && m1.veilBg !== 'rgba(10, 5, 3, 0.72)' && !A2(m1), J(m1));
  // M2: the front sent away, as main did before the pop-out
  await open();
  await app.evalJs("(() => { const f = document.querySelector('.arbor2-front'); f.classList.remove('behind'); f.classList.add('gone'); return true; })()");
  const m2 = await app.evalJs(READ);
  ok(`M2 (mutant): the front door sent away (LANDED: gone ${m2 && m2.frontGone}) - A1's read goes RED`, !!m2 && m2.frontGone && !A1(m2), J(m2));
  // A6 / M4: a short window
  const SHORT = `(() => { const p = document.querySelector('.wz-popout'); const r = p.getBoundingClientRect(); const b = p.querySelector('button[type=submit]'); const k = p.querySelector('.wz-popout-back'); const e = p.querySelector('.wz-error'); const sc = p.querySelector('.wz-popout-scroll'); const br = b.getBoundingClientRect(), kr = k.getBoundingClientRect(); const q = (x) => Math.round(x * 10) / 10; return { bottom: q(r.bottom), winH: innerHeight, btnBottom: q(br.bottom), backBottom: q(kr.bottom), btnTop: q(br.top), inPanel: br.top >= r.top && br.bottom <= r.bottom + 0.5 && kr.bottom <= r.bottom + 0.5, err: !!e, errBottom: e ? q(e.getBoundingClientRect().bottom) : null, scrolls: !!sc && sc.scrollHeight > sc.clientHeight + 1, panelScrolls: p.scrollHeight > p.clientHeight + 1 }; })()`;
  const A6 = (g) => !!g && g.bottom <= g.winH - 24 + 0.5 && g.inPanel && g.btnBottom <= g.winH && g.err && g.errBottom <= g.btnTop + 0.5 && !g.panelScrolls;
  const BTNY = `(() => Math.round(document.querySelector('.wz-popout button[type=submit]').getBoundingClientRect().top * 10) / 10)()`;
  await open(); await press(app, '.wz-popout-switch'); await sleep(500);
  await app.emulateDpr(1, 1366, 560); await sleep(800);
  await app.evalJs("document.querySelector('.wz-popout button[type=submit]').click(); true"); await sleep(700);
  const sh = await app.evalJs(SHORT);
  await app.evalJs("(() => { const p = document.querySelector('.wz-popout'); const sc = p.querySelector('.wz-popout-scroll'); sc.scrollTop = 0; p.scrollTop = 0; return true; })()"); await sleep(150); const y0 = await app.evalJs(BTNY);
  await app.evalJs("(() => { const p = document.querySelector('.wz-popout'); const sc = p.querySelector('.wz-popout-scroll'); sc.scrollTop = 1e6; p.scrollTop = 1e6; return true; })()"); await sleep(150); const y1 = await app.evalJs(BTNY);
  ok(`A6 at 1366x560 the create-account face with the error: foot ${sh && sh.bottom} against ${sh && sh.winH} - 24, the button row inside the panel and the window, the button at ${y0} then ${y1} when the fields scroll`, A6(sh) && Math.abs(y0 - y1) <= 0.5 && sh.scrolls === true, J(sh));
  await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'mut-cap'; s.textContent = '.wz-arrival .wz-screen.wz-popout{ max-height:none !important; }'; document.head.appendChild(s); return true; })()"); await sleep(400);
  const m4 = await app.evalJs(SHORT);
  ok(`M4 (mutant): the cap taken away (LANDED: foot ${m4 && m4.bottom} in a ${m4 && m4.winH} window) - A6's read goes RED`, !!m4 && m4.bottom > m4.winH - 24 && !A6(m4), J(m4));
  return checks;
}, { label: 'arbor-popout' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-POPOUT PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 10;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-POPOUT VERIFY: PASS (${checks.length} checks)` : `\nARBOR-POPOUT VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
