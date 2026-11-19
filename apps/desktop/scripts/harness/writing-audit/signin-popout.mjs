// THE SIGN-IN POP-OUT (the Wrizors' spec, Nov 18; Fable's order: ways 1 and 2, the strings in the lexicon, the 18+ tick, #107's edge). A check, signed out (the auth double is told to answer "signed out"), for one theme and one Page tone (env WA_THEME, WA_TONE).
//   P1  the splash's Sign in door opens ONE panel over the picture: a dialog (`.wz-popout`, aria-modal), the picture still there behind it (`.wz-hero.behind`, drawn: opacity above 0), the door not pressable behind it
//   P2  the panel's words are the lexicon's for this theme (Arbor "Sign in", Flux "Log in" and the node tag "N.01 · INPUT", Machina "Sign in"), and "New here? Create an account" swaps the panel's contents IN PLACE: Arbor and Flux keep the top edge put and the panel grows down
//   P3  #107: a field's 1 px edge reads >= 3:1 against the field and against the panel (Arbor's is #9C8A6E: 5.83:1 and 4.02:1)
//   P4  the 18+ tick on the create-account face: unticked, the submit says "Wrizo accounts are for writers 18 and older, for now." and calls nothing (no request to the register endpoint); ticked, it goes; the tick is stored nowhere (no storage key is added)
//   P6  the approved spec's width (Fable, Nov 18, 1:45 pm): 400 px at 1366 and never under 360 (Machina: the mark's width, 417)
//   P7  the veil (Flux #020C10 at 74%; Machina none) and the ghost doors read the same words as the real doors (one lexicon key: authDoorWrite)
//   P8  the spec table's colours, exactly: Arbor placeholder #9C9081; Flux field edge #5F8F95, links #9AD7EA, tag #7EB4C4
//   P9  MACHINA's create-account face (spec draft 4 §5, Fable Nov 18, 2:45 pm): its foot is 24 px above the window's foot, it never covers the logo (it stops 8 px under it and scrolls inside if it will not fit); P9M the old top-pinned build turns it red (asserted landed)
//   P10 going back from the create-account face returns Machina's panel to the doors' place (the sign-in face's top edge)
//   P11 the 18+ tick as the spec draws it: a 16 px box, 1 px in the theme's field-edge colour, a brass mark when ticked; on its error focus moves to the tick; Space ticks it
//   P12 FLUX holds its chart's finished frame behind the panel and no old door shows around it (Fable Nov 18, 3:50 pm); the mutant (the old hero shown, the chart gone) turns it red
//   P13 the button is never brass at rest (Arbor cream; Flux and Machina the label colour); under the pointer: Arbor brass, Flux cyan with the brass bar, Machina a brass underline; the mutant (brass at rest) turns it red
//   P14 focus starts in the first field when the panel opens, and a real Tab walk reaches the button with the same brass-on-focus look; the mutant (focus dropped) turns it red
//   P16 MACHINA: every edge of the panel is on a whole pixel at 1366, 1920 and an odd 1367 (a half pixel read 2.5:1; Fable Nov 18, 4:35 pm); P16M the old build (417 px, left 50% and a translate) turns it red
//   P17 MACHINA create-account face at 1366x768 (the live splash): top 8 px under the logo or lower, foot at or above 744, NOTHING scrolls, no sub-line; P17M the old build (42 px fields, the sub-line back) scrolls and turns it red
//   P18 MACHINA, a shorter window (1366x560): only the fields scroll; the button row is pinned at the foot (the button does not move when the fields scroll, is in the window, Create my account left and back right on one row), the scroll thumb reads >= 3:1; P18M the old build (the panel scrolls as one) turns it red
//   P19 MACHINA: an error line sits above the button row, and the button row stays in the window
//   P20 FLUX: the panel's top sits at least 8 px under WRIZO's letters (their ink foot: the wordmark's box foot plus half its stroke) and covers no part of the mark, at 1366 and 1920, on both faces; P20M the old top (6vh / centred, 209 at 1366) turns it red (Fable Nov 18, 5:35 pm)
//   P21 on the 18+ error the tick is IN VIEW inside the visible part of the list, above the error line, and focused, at 1366x768 and 1366x560, in every theme (the Wrizors' v5 REAL: it was scrolled out of sight in Machina); P21M the same flow with the scroll taken away leaves it out of view (asserted landed at a height where the list is short)
//   P22 the register request carries adult: true, and none leaves unticked (Fable Nov 18, 5:55 pm: apiRegister never sent it); nothing is stored; P22M the field dropped from the request turns it red (asserted landed)
//   P23 Esc closes the panel like its back (spec draft 4 section 1 and section 6 check 4; Fable Nov 18, 6:05 pm): on the create-account face it goes to sign-in, on the sign-in face to the doors; on a LOCKED device the sign-in face does nothing and the create-account face still goes to sign-in; P23M the Esc handler taken away (the key swallowed before it, asserted landed) turns it red
//   P8 (Flux, section 4) also reads the panel edge (1 px #8FB4AC), the corner brackets (--br #8FB4AC), the heading and the typed text (#E7F4F1); P8M the old values (the .45 cyan edge, #9fd8e8, #E8F6FA) turn it red
//   P24 SHORT WINDOWS (1366x560), EVERY theme, both faces, with the error showing (the Wrizors' v6/v7 pass; Fable Nov 18, 8:15 pm): the panel's foot is at least 24 px above the window's foot and its top never above the mark's floor; the error line, the button and the links/back sit inside the panel and the window; on the create-account face (where the fields scroll) the button does not move when the fields scroll; P24M the old cap (max-height none) pushes the foot off the window, P24M2 the old build (the panel scrolls as one) moves the button, both asserted landed
//   P24 (Machina, Fable Nov 18, 10:15 pm) the sign-in face too clears the mark at 1366x560: its top is no higher than the floor (337); P24M3 the old top (313, the doors' place) turns it red, asserted landed
//   P24 also reads that the button never overlaps the links row below it (the Machina sign-in frame at 560 with an error showed them overlapped)
//   P26 on the 18+ error the focus MARK is drawn on the focused tick, in every theme (the Wrizors' v9 REAL: focus was on the tick and no mark showed; Fable Nov 18, 11:00 pm): an outline or a bar is drawn while it has focus, where it had none before; programmatic focus must show it too; P26M the mark taken away (asserted landed) turns it red
//   P27 THE SQUEEZE (Fable Nov 18, 11:20 pm; the Wrizors' draft 8 s1), MACHINA sign-in at 1366x560 with the two-line error: data-squeeze is on, the heading and the error line are inside the scrolling part, the fields' window is at least 36 px, the spacing is the short-window spacing (padding 12 top and bottom, 8 px between the button and the links, the button 36 px) and no text changed size; P27E the error is in view, at the foot of the scrolling part; P27M the window cut under 36 and P27EM the part scrolled to its top (each asserted landed) turn the reads red
//   P27L the ONE-line error (the server's 400 "Wrong email or password.") squeezes too and STAYS squeezed: the panel is still there, the window is at least 36 px, the error in view, and the state is the same 600 ms later (a flip-flop between squeezed and not once blanked the page); P27LM the window cut (asserted landed) turns it red
//   P27U ARBOR and FLUX at 1366x560 with the error, both faces, do NOT squeeze: no data-squeeze, the heading and the error outside the scrolling part, the panel padding as at 768; P27UM the squeeze forced on (asserted landed) turns it red
//   P25 the button is NOT brass at rest after the 18+ error (the pointer parked away; focus is on the tick): same colour/edge/shadow as before the submit; under the pointer it is brass (the frame driver's pointer was the brass); P25M a Tab from the tick to the button turns the read red (asserted landed)
//   P5  way 2: a device that signed out, or a link to a page while signed out, opens already on the panel with NO "back"
// One line per check: `POPOUT [tag] P1 PASS|FAIL ...` and `SIGNIN-POPOUT [tag] PASS|FAIL`. Run: on Actions via writing-audit.yml, script=signin-popout.mjs, configs theme/off/tone/1366.
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

process.env.WS_ANON = '1';
const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: 1366, height: 768, out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.tone}`;
const WORDS = { plateau: { door: 'Sign in', tag: null }, flux: { door: 'Log in', tag: 'N.01 · INPUT' }, machina: { door: 'Sign in', tag: null } }[cfg.theme];
const lum = ([r, g, b]) => { const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const results = [];
const check = (id, pass, detail) => { results.push({ id, pass }); console.log(`POPOUT [${TAG}] ${id} ${pass ? 'PASS' : 'FAIL'} ${detail || ''}`); };
// (no backslash in the page-side source: a template literal would eat it)
const PX = `const px = (el, prop) => { const s = getComputedStyle(el)[prop]; if (!/^rgb/.test(s)) return null; const p = s.replace(/[^0-9.,]/g, '').split(',').map((x) => parseFloat(x)); return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = px(e, 'backgroundColor'); if (c && c.a >= 0.99) return c.rgb; } return [0, 0, 0]; };`;

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  const ev = d.ev;
  const ESCKEY = async () => { for (const type of ['rawKeyDown', 'keyUp']) await app.cdp('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }); await sleep(500); };
  const STAGE = "(() => { const a = document.querySelector('.wz-arrival'); const p = document.querySelector('.wz-popout'); return { stage: a && a.getAttribute('data-stage'), panel: p ? p.getAttribute('data-popout') : null, back: !!document.querySelector('.wz-popout-back') }; })()";
  await app.waitFor("!!document.querySelector('.wz-arrival-signin') && !document.querySelector('.wz-arrival-signin').disabled", { label: 'the sign-in door' });
  await sleep(500);
  const doorWord = await ev("document.querySelector('.wz-arrival-signin').textContent.trim()");
  const realWrite = await ev("(document.querySelector('.wz-hero .wz-arrival-write') || {}).textContent");
  const pt = await ev("(() => { const r = document.querySelector('.wz-arrival-signin').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  await d.click(pt.x, pt.y, 1);
  await app.waitFor("!!document.querySelector('.wz-popout')", { label: 'the panel', timeout: 8000 }).catch(() => {});
  await sleep(900);
  const p1 = await ev(`(() => { const p = document.querySelector('.wz-popout'); const h = document.querySelector('.wz-hero'); const door = document.querySelector('.wz-hero .wz-arrival-signin');
    return { panel: !!p, dialog: !!p && p.getAttribute('role') === 'dialog' && p.getAttribute('aria-modal') === 'true', hero: !!h && h.classList.contains('behind'), heroOpacity: h ? getComputedStyle(h).opacity : null, doorPressable: !!door && door.tagName === 'BUTTON' && !door.closest('[aria-hidden="true"]') }; })()`);
  check('P1', p1.panel && p1.dialog && p1.hero && Number(p1.heroOpacity) > 0 && !p1.doorPressable, JSON.stringify(p1));
  const active0 = await ev("(() => { const a = document.activeElement; return a ? { tag: a.tagName, type: a.type || null, inPanel: !!a.closest('.wz-popout'), first: a === document.querySelector('.wz-popout input.wz-field') } : null; })()");
  const top1 = await ev("document.querySelector('.wz-popout').getBoundingClientRect().top");
  const h1 = await ev("document.querySelector('.wz-popout').getBoundingClientRect().height");
  const w = await ev(`(() => { const tag = document.querySelector('.wz-popout-tag'); const btn = document.querySelector('.wz-popout button[type=submit]'); return { door: ${JSON.stringify(doorWord)}, button: btn && btn.textContent.trim(), tag: tag ? tag.textContent.trim() : null, head: document.querySelector('.wz-popout .wz-bighead').textContent.trim() }; })()`);
  const p2a = w.door === WORDS.door && w.button === WORDS.door && w.head === 'Welcome back.' && (WORDS.tag === null ? (w.tag === 'Input' || w.tag === null) : w.tag === WORDS.tag);
  const e = await ev(`(() => { ${PX} const f = [...document.querySelectorAll('.wz-popout .wz-field')].pop(); const p = document.querySelector('.wz-popout'); return { edge: px(f, 'borderTopColor').rgb, edgeW: getComputedStyle(f).borderTopWidth, field: bgOf(f), panel: bgOf(p) }; })()`);
  const rField = ratio(e.edge, e.field), rPanel = ratio(e.edge, e.panel);
  check('P3', rField >= 3 && rPanel >= 3 && e.edgeW === '1px', `edge ${hex(e.edge)} ${e.edgeW}: ${rField.toFixed(2)}:1 against the field ${hex(e.field)}, ${rPanel.toFixed(2)}:1 against the panel ${hex(e.panel)}`);
  const sp = await ev(`(() => { ${PX} const p = document.querySelector('.wz-popout'); const f = [...p.querySelectorAll('.wz-field')].pop(); const arr = document.querySelector('.wz-arrival'); const veil = getComputedStyle(arr, '::after'); const ghost = document.querySelector('.wz-arrival-doors-ghost .wz-arrival-write'); const link = p.querySelector('.wz-link'); const tag = p.querySelector('.wz-popout-tag');
    const ph = getComputedStyle(f, '::placeholder').color; return { w: Math.round(p.getBoundingClientRect().width * 10) / 10, vw: window.innerWidth, veilBg: veil.backgroundColor, veilShown: veil.display !== 'none' && veil.content !== 'none', ghost: ghost ? ghost.textContent : null, ph, edge: px(f, 'borderTopColor').rgb, link: px(link, 'color').rgb, tag: tag && getComputedStyle(tag).display !== 'none' ? px(tag, 'color').rgb : null, panelEdge: px(p, 'borderTopColor').rgb, panelEdgeW: getComputedStyle(p).borderTopWidth, br: getComputedStyle(p).getPropertyValue('--br').trim(), head: px(p.querySelector('.wz-bighead'), 'color').rgb, typed: px(f, 'color').rgb }; })()`);
  const want = cfg.theme === 'machina' ? 417 : 400;
  check('P6', Math.abs(sp.w - want) <= 1 && sp.w >= 360, `panel ${sp.w} px at ${sp.vw} (want ${want}, never under 360)`);
  const veilOk = cfg.theme === 'flux' ? sp.veilShown && sp.veilBg === 'rgba(2, 12, 16, 0.74)' : cfg.theme === 'machina' ? !sp.veilShown : sp.veilShown;
  check('P7', veilOk && !!realWrite && sp.ghost === realWrite, `veil ${sp.veilShown ? sp.veilBg : 'none'}; ghost door ${JSON.stringify(sp.ghost)} against the real door ${JSON.stringify(realWrite)}`);
  const same = (a, h) => !!a && hex(a) === h;
  const p8 = cfg.theme === 'plateau' ? sp.ph === 'rgb(156, 144, 129)' : cfg.theme === 'machina' ? same(sp.edge, '#9AA1A8') && same(sp.link, '#9AA1A8') && sp.ph === 'rgb(154, 161, 168)' : cfg.theme === 'flux' ? same(sp.edge, '#5F8F95') && same(sp.link, '#9AD7EA') && same(sp.tag, '#7EB4C4') && same(sp.panelEdge, '#8FB4AC') && sp.panelEdgeW === '1px' && sp.br.toUpperCase() === '#8FB4AC' && same(sp.head, '#E7F4F1') && same(sp.typed, '#E7F4F1') : true;
  check('P8', p8, `placeholder ${sp.ph}; edge ${sp.edge && hex(sp.edge)}; links ${sp.link && hex(sp.link)}; tag ${sp.tag ? hex(sp.tag) : null}`);
  if (cfg.theme === 'flux') {
    const TBL = "(() => { const p = document.querySelector('.wz-popout'); const f = [...p.querySelectorAll('.wz-field')].pop(); const c = (e) => getComputedStyle(e).color; return { edge: getComputedStyle(p).borderTopColor, br: getComputedStyle(p).getPropertyValue('--br').trim().toUpperCase(), head: c(p.querySelector('.wz-bighead')), typed: c(f) }; })()";
    const tblOk = (g) => g.edge === 'rgb(143, 180, 172)' && g.br === '#8FB4AC' && g.head === 'rgb(231, 244, 241)' && g.typed === 'rgb(231, 244, 241)';
    const t0 = await ev(TBL);
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-flux'; st.textContent = '.wz-arrival .wz-screen.wz-popout{ border-color:rgba(87,208,245,.45) !important; --br:#9fd8e8 !important; } .wz-arrival .wz-popout .wz-bighead, .wz-arrival .wz-popout .wz-field{ color:#E8F6FA !important; }'; document.head.appendChild(st); return true; })()"); await sleep(300);
    const t1 = await ev(TBL);
    await ev("document.getElementById('mut-flux').remove(); true");
    check('P8M', tblOk(t0) && t1.edge !== t0.edge && t1.br !== t0.br && t1.head !== t0.head && !tblOk(t1), `the old Flux values (landed: ${JSON.stringify(t1)}): P8's read goes RED; the real build reads ${JSON.stringify(t0)}`);
  }
  // P12 FLUX: the chart behind the panel, no old door around it
  if (cfg.theme === 'flux') {
    const CHART = `(() => { const vis = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && c.display !== 'none' && c.visibility === 'visible' && Number(c.opacity) > 0; }; const ch = document.querySelector('.wz-popout-chart'); const svg = ch && ch.querySelector('svg'); const old = [...document.querySelectorAll('.wz-arrival .wz-arrival-signin, .wz-arrival .wz-arrival-write, .wz-arrival .wz-arrival-open, .wz-arrival .wz-logo')].filter((e) => !e.closest('.wz-popout') && vis(e)).map((e) => (e.textContent || e.className || '').toString().trim().slice(0, 20)); return { chart: !!svg, chartW: svg ? Math.round(svg.getBoundingClientRect().width) : 0, chartShown: !!ch && vis(ch), old }; })()`;
    const c12 = await ev(CHART);
    check('P12', c12.chart && c12.chartW > 0 && c12.chartShown && c12.old.length === 0, JSON.stringify(c12));
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-chart'; st.textContent = '.wz-arrival .wz-hero.behind{ visibility:visible !important; } .wz-popout-chart{ display:none !important; }'; document.head.appendChild(st); return true; })()");
    await sleep(200);
    const m12 = await ev(CHART);
    check('P12M', !m12.chartShown && m12.old.length > 0, `the old hero shown, the chart gone (landed: `+JSON.stringify(m12)+`): P12's read goes RED`);
    await ev("document.getElementById('mut-chart').remove(); true");
  }
  // P20 FLUX: the panel clears the mark
  if (cfg.theme === 'flux') {
    const CLEAR = "(() => { const p = document.querySelector('.wz-popout'); const w = document.querySelector('.wz-popout-chart .fx-wordmark'); const svg = document.querySelector('.wz-popout-chart svg'); if (!p || !w || !svg) return null; const pr = p.getBoundingClientRect(), wr = w.getBoundingClientRect(); const ink = wr.bottom + 6.4 * (svg.getBoundingClientRect().width / 1350); return { panelTop: Math.round(pr.top * 10) / 10, inkFoot: Math.round(ink * 10) / 10, gap: Math.round((pr.top - ink) * 10) / 10, panelBottom: Math.round(pr.bottom * 10) / 10, winH: innerHeight }; })()";
    const clearOk = (g) => !!g && g.gap >= 8 && g.panelBottom <= g.winH;
    const c20 = [];
    for (const [w, h] of [[1366, 768], [1920, 1080]]) { await app.emulateDpr(1, w, h); await sleep(700); c20.push({ w, signin: await ev(CLEAR) }); }
    await ev("document.querySelector('.wz-popout-switch').click()"); await sleep(600);
    for (const [w, h] of [[1920, 1080], [1366, 768]]) { await app.emulateDpr(1, w, h); await sleep(700); c20.push({ w, account: await ev(CLEAR) }); }
    check('P20', c20.every((r) => clearOk(r.signin || r.account)), JSON.stringify(c20));
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-top'; st.textContent = '.wz-arrival .wz-screen.wz-popout{ top:max(6vh, calc(50% - 175px)) !important; }'; document.head.appendChild(st); return true; })()"); await sleep(300);
    const m20 = await ev(CLEAR);
    check('P20M', !!m20 && m20.gap < 8 && !clearOk(m20), `the old top (landed: panel top ${m20 && m20.panelTop}, mark foot ${m20 && m20.inkFoot}): P20's read goes RED`);
    await ev("document.getElementById('mut-top').remove(); true");
    await ev("document.querySelector('.wz-popout-back').click()"); await sleep(600);
  }
  // P13 / P14 the button
  {
    const BTN = `(() => { const b = document.querySelector('.wz-popout button[type=submit]'); const cs = getComputedStyle(b); return { color: cs.color, border: cs.borderTopColor, shadow: cs.boxShadow, active: document.activeElement === b }; })()`;
    const rest = await ev(BTN);
    const bp = await ev("(() => { const r = document.querySelector('.wz-popout button[type=submit]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    await app.mouseMove(bp.x, bp.y); await sleep(450);
    const hov = await ev(BTN);
    await app.mouseMove(2, 2); await sleep(350);
    const BRASS = 'rgb(255, 152, 0)';
    const restOk = rest.color !== BRASS && rest.border !== BRASS && rest.shadow === 'none' && (cfg.theme !== 'plateau' || rest.color === 'rgb(239, 228, 203)');
    const hovOk = cfg.theme === 'plateau' ? hov.color === BRASS && hov.border === BRASS : cfg.theme === 'flux' ? hov.color === 'rgb(0, 194, 255)' && hov.shadow.includes('255, 152, 0') : hov.shadow.includes('255, 152, 0');
    check('P13', restOk && hovOk, `at rest `+JSON.stringify(rest)+`; under the pointer `+JSON.stringify(hov));
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-brass'; st.textContent = '.wz-arrival .wz-popout .wz-btn{ color:#ff9800 !important; border-color:#ff9800 !important; }'; document.head.appendChild(st); return true; })()");
    await sleep(600);
    const mrest = await ev(BTN);
    const mrestOk = mrest.color !== BRASS && mrest.border !== BRASS && mrest.shadow === 'none';
    check('P13M', mrest.color === BRASS && !mrestOk, `the button brass at rest (landed: `+JSON.stringify(mrest)+`): P13's read goes RED`);
    await ev("document.getElementById('mut-brass').remove(); true");
    // P14: focus in the first field on open (read at open), then a real Tab walk reaches the button
    await ev("document.querySelector('.wz-popout input.wz-field').focus(); true");
    await app.key('Tab'); await sleep(120); await app.key('Tab'); await sleep(300);
    const foc = await ev(BTN);
    const focOk = foc.active && (cfg.theme === 'plateau' ? foc.color === BRASS : cfg.theme === 'flux' ? foc.color === 'rgb(0, 194, 255)' : foc.shadow.includes('255, 152, 0'));
    const openOk = !!active0 && active0.inPanel && active0.first;
    check('P14', openOk && focOk, `on open: `+JSON.stringify(active0)+`; after two Tabs: `+JSON.stringify(foc));
    const OPEN = "(() => { const a = document.activeElement; return a ? { inPanel: !!a.closest('.wz-popout'), first: a === document.querySelector('.wz-popout input.wz-field') } : null; })()";
    await ev("document.activeElement && document.activeElement.blur(); true");
    const mopen = await ev(OPEN);
    check('P14M', !!mopen && !(mopen.inPanel && mopen.first), `focus dropped (landed: `+JSON.stringify(mopen)+`): P14's open read goes RED`);
  }
  await ev("document.querySelector('.wz-popout-switch').click()");
  await app.waitFor("!!document.querySelector('.wz-popout[data-popout=account]')", { label: 'the create-account face', timeout: 6000 }).catch(() => {});
  await sleep(700);
  const top2 = await ev("document.querySelector('.wz-popout').getBoundingClientRect().top");
  const h2 = await ev("document.querySelector('.wz-popout').getBoundingClientRect().height");
  const growsDown = Math.abs(top2 - top1) <= 1 && h2 > h1;
  check('P2', p2a && (cfg.theme === 'machina' ? h2 > h1 : growsDown), `words ${JSON.stringify(w)}; top ${Math.round(top1)} then ${Math.round(top2)}, height ${Math.round(h1)} then ${Math.round(h2)}`);
  if (cfg.theme === 'machina') {
    const GEOM = `(() => { const p = document.querySelector('.wz-popout'); const l = document.querySelector('.wz-hero .wz-logo'); const r = p.getBoundingClientRect(); const lr = l ? l.getBoundingClientRect() : null; return { winH: window.innerHeight, top: Math.round(r.top * 10) / 10, bottom: Math.round(r.bottom * 10) / 10, logoBottom: lr ? Math.round(lr.bottom * 10) / 10 : null, scrolls: p.scrollHeight > p.clientHeight + 1, btnReachable: !!p.querySelector('button[type=submit]') }; })()`;
    const geomOk = (g) => !!g && Math.abs(g.bottom - (g.winH - 24)) <= 1 && g.logoBottom !== null && g.top >= g.logoBottom + 7 && g.btnReachable;
    const g9 = await ev(GEOM);
    check('P9', geomOk(g9), `create-account face: foot `+g9.bottom+` against the window's foot `+g9.winH+` - 24; top `+g9.top+` against the logo's foot `+g9.logoBottom+` + 8; scrolls inside `+g9.scrolls);
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-top'; st.textContent = '.wz-arrival .wz-screen.wz-popout[data-popout=account]{ top:max(56%, 300px) !important; bottom:auto !important; max-height:calc(100% - max(56%, 300px) - 1rem) !important; }'; document.head.appendChild(st); return true; })()");
    await sleep(300);
    const gm = await ev(GEOM);
    const landed = Math.abs(gm.bottom - g9.bottom) > 1;
    check('P9M', landed && !geomOk(gm), `the old top-pinned build (landed `+landed+`: top `+gm.top+`, foot `+gm.bottom+`): P9's read goes RED: `+(!geomOk(gm)));
    await ev("document.getElementById('mut-top').remove(); true");
    await sleep(200);
  }
  if (cfg.theme === 'machina') {
    // ---- P16: whole-pixel edges
    const whole = (v) => Math.abs(v - Math.round(v)) < 0.02;
    const EDGES = "(() => { const r = document.querySelector('.wz-popout').getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; })()";
    const edgesOk = (g) => whole(g.l) && whole(g.r) && whole(g.t) && whole(g.b);
    const e16 = [];
    for (const [w, h] of [[1366, 768], [1920, 1080], [1367, 768]]) { await app.emulateDpr(1, w, h); await sleep(600); e16.push({ w, ...(await ev(EDGES)) }); }
    check('P16', e16.every(edgesOk), JSON.stringify(e16));
    await app.emulateDpr(1, 1366, 768); await sleep(500);
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-half'; st.textContent = '.wz-arrival .wz-screen.wz-popout{ width:417px !important; left:50% !important; transform:translateX(-50%) !important; }'; document.head.appendChild(st); return true; })()");
    await sleep(300);
    const m16 = await ev(EDGES);
    check('P16M', !whole(m16.l) && !edgesOk(m16), `the old build (417 px, left 50%, a translate; landed: left ${m16.l}): P16's read goes RED`);
    await ev("document.getElementById('mut-half').remove(); true"); await sleep(200);
    // ---- P17: no scroll at 1366x768
    const FIT = "(() => { const p = document.querySelector('.wz-popout'); const sc = p.querySelector('.wz-popout-scroll'); const r = p.getBoundingClientRect(); const l = document.querySelector('.wz-hero .wz-logo').getBoundingClientRect(); const sub = p.querySelector('.wz-popout-subline'); return { top: Math.round(r.top * 10) / 10, bottom: Math.round(r.bottom * 10) / 10, logoBottom: Math.round(l.bottom * 10) / 10, winH: innerHeight, scrollOver: sc.scrollHeight - sc.clientHeight, panelOver: p.scrollHeight - p.clientHeight, sub: sub ? getComputedStyle(sub).display : null }; })()";
    const fitOk = (g) => g.top >= g.logoBottom + 7 && g.bottom <= 744.5 && g.scrollOver <= 1 && g.panelOver <= 1 && g.sub === 'none';
    const f17 = await ev(FIT);
    check('P17', fitOk(f17), JSON.stringify(f17));
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-fat'; st.textContent = '.wz-arrival .wz-popout .wz-field{ height:42px !important; } .wz-arrival .wz-popout .wz-popout-subline{ display:block !important; }'; document.head.appendChild(st); return true; })()");
    await sleep(300);
    const m17 = await ev(FIT);
    check('P17M', m17.sub === 'block' && !fitOk(m17), `the old build (42 px fields, the sub-line back; landed: sub ${m17.sub}, scroll over ${m17.scrollOver}): P17's read goes RED`);
    await ev("document.getElementById('mut-fat').remove(); true"); await sleep(200);
    // ---- P18: a shorter window, the button row pinned
    const ROW = "(() => { const p = document.querySelector('.wz-popout'); const sc = p.querySelector('.wz-popout-scroll'); const b = p.querySelector('button[type=submit]'); const k = p.querySelector('.wz-popout-back'); const br = b.getBoundingClientRect(), kr = k.getBoundingClientRect(), pr = p.getBoundingClientRect(); return { by: Math.round(br.top * 10) / 10, bb: Math.round(br.bottom * 10) / 10, rowDy: Math.round(Math.abs((kr.top + kr.height / 2) - (br.top + br.height / 2)) * 10) / 10, backRight: kr.left >= br.right, pb: Math.round(pr.bottom * 10) / 10, winH: innerHeight, scrollable: sc.scrollHeight > sc.clientHeight + 1, sc: getComputedStyle(sc).scrollbarColor }; })()";
    const SCROLLALL = "(() => { const p = document.querySelector('.wz-popout'); const sc = p.querySelector('.wz-popout-scroll'); sc.scrollTop = sc.scrollHeight; p.scrollTop = p.scrollHeight; return true; })()";
    const TOP = "(() => { const p = document.querySelector('.wz-popout'); const sc = p.querySelector('.wz-popout-scroll'); sc.scrollTop = 0; p.scrollTop = 0; return true; })()";
    await app.emulateDpr(1, 1366, 560); await sleep(700);
    await ev(TOP); const r0 = await ev(ROW); await ev(SCROLLALL); await sleep(150); const r1 = await ev(ROW);
    const nums = (r0.sc.match(/[0-9]+/g) || []).map(Number); const thumb = nums.slice(0, 3), track = nums.slice(3, 6);
    const thumbRatio = thumb.length === 3 && track.length === 3 ? ratio(thumb, track) : 0;
    const pinned = (a, c) => a.scrollable && Math.abs(a.by - c.by) <= 0.5 && c.bb <= c.winH && a.bb <= a.winH && a.rowDy <= 2 && a.backRight && a.pb <= a.winH - 24 + 0.5;
    check('P18', pinned(r0, r1) && thumbRatio >= 3, `top ${JSON.stringify(r0)}; scrolled ${JSON.stringify({ by: r1.by, bb: r1.bb })}; thumb ${thumbRatio.toFixed(2)}:1`);
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-unpin'; st.textContent = '.wz-arrival .wz-screen.wz-popout[data-popout=account]{ display:block !important; overflow-y:auto !important; } .wz-arrival .wz-popout .wz-popout-scroll{ display:contents !important; }'; document.head.appendChild(st); return true; })()");
    await sleep(300);
    await ev(TOP); const q0 = await ev(ROW); await ev(SCROLLALL); await sleep(150); const q1 = await ev(ROW);
    const landed18 = await ev("getComputedStyle(document.querySelector('.wz-popout')).display === 'block'");
    check('P18M', landed18 && !pinned({ ...q0, scrollable: true }, q1), `the old build (the panel scrolls as one; landed ${landed18}): button top ${q0.by} then ${q1.by}, bottom ${q0.bb} (window ${q0.winH}): P18's read goes RED`);
    await ev("document.getElementById('mut-unpin').remove(); true");
    await app.emulateDpr(1, 1366, 768); await sleep(700);
    // ---- P19: the error line above the button row
    await ev("document.querySelector('.wz-popout button[type=submit]').click(); true"); await sleep(500);
    const e19 = await ev("(() => { const p = document.querySelector('.wz-popout'); const e = p.querySelector('.wz-error'); const b = p.querySelector('button[type=submit]'); if (!e) return null; const er = e.getBoundingClientRect(), br = b.getBoundingClientRect(); return { errBottom: Math.round(er.bottom * 10) / 10, btnTop: Math.round(br.top * 10) / 10, btnBottom: Math.round(br.bottom * 10) / 10, winH: innerHeight }; })()");
    check('P19', !!e19 && e19.errBottom <= e19.btnTop + 0.5 && e19.btnBottom <= e19.winH - 24, JSON.stringify(e19));
    await ev("(document.querySelector('.wz-popout-back') || { click() {} }).click()");
    await app.waitFor("!!document.querySelector('.wz-popout[data-popout=signin]')", { label: 'back on sign-in', timeout: 6000 }).catch(() => {});
    await sleep(500);
    const bk = await ev("(() => { const r = document.querySelector('.wz-popout').getBoundingClientRect(); return { top: Math.round(r.top), want: Math.round(Math.max(window.innerHeight * 0.56, 300)), stage: document.querySelector('.wz-popout').dataset.popout }; })()");
    const bEdges = await ev("(() => { const r = document.querySelector('.wz-popout').getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom]; })()");
    const be = bEdges.every((v) => Math.abs(v - Math.round(v)) < 0.02);
    check('P10', bk.stage === 'signin' && Math.abs(bk.top - bk.want) <= 2 && be === true, JSON.stringify({ ...bk, wholeEdges: be, edges: bEdges }));
    await ev("document.querySelector('.wz-popout-switch').click()");
    await app.waitFor("!!document.querySelector('.wz-popout[data-popout=account]')", { label: 'the create-account face again', timeout: 6000 }).catch(() => {});
    await sleep(500);
  }
  // ---- P21: the tick in view after the error
  {
    const VIS = "(() => { const t = document.querySelector('.wz-adult-box'); const e = document.querySelector('.wz-popout .wz-error'); if (!t) return null; let c = t.parentElement; while (c && !/(auto|scroll)/.test(getComputedStyle(c).overflowY)) c = c.parentElement; const cr = c ? c.getBoundingClientRect() : { top: 0, bottom: innerHeight }; const tr = t.getBoundingClientRect(); const er = e ? e.getBoundingClientRect() : null; return { tickTop: Math.round(tr.top * 10) / 10, tickBottom: Math.round(tr.bottom * 10) / 10, listTop: Math.round(cr.top * 10) / 10, listBottom: Math.round(Math.min(cr.bottom, innerHeight) * 10) / 10, errTop: er ? Math.round(er.top * 10) / 10 : null, focused: document.activeElement === t, winH: innerHeight }; })()";
    const visOk = (g) => !!g && g.tickTop >= g.listTop - 0.5 && g.tickBottom <= g.listBottom + 0.5 && g.errTop !== null && g.tickBottom <= g.errTop + 0.5 && g.focused;
    const FRESH = async () => {
      await ev("(document.querySelector('.wz-popout-back') || { click() {} }).click()");
      await app.waitFor("!!document.querySelector('.wz-popout[data-popout=signin]')", { label: 'back on sign-in', timeout: 6000 }).catch(() => {});
      await sleep(300);
      await ev("document.querySelector('.wz-popout-switch').click()");
      await app.waitFor("!!document.querySelector('.wz-popout[data-popout=account]') && !!document.querySelector('.wz-adult-box')", { label: 'the create-account face', timeout: 6000 }).catch(() => {});
      await sleep(500);
    };
    const v21 = [];
    for (const h of [768, 560]) {
      await app.emulateDpr(1, 1366, h); await sleep(700); await FRESH();
      await ev("document.querySelector('.wz-popout button[type=submit]').click(); true"); await sleep(700);
      v21.push({ h, ...(await ev(VIS)) });
    }
    check('P21', v21.every(visOk), JSON.stringify(v21));
    let landed21 = null;
    for (const h of [768, 560, 400, 330, 260]) {
      await app.emulateDpr(1, 1366, h); await sleep(700); await FRESH();
      await ev("window.__siv = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function () {}; true");
      await ev("document.querySelector('.wz-popout button[type=submit]').click(); true"); await sleep(700);
      const g = { h, ...(await ev(VIS)) };
      await ev("Element.prototype.scrollIntoView = window.__siv; true");
      if (!visOk(g)) { landed21 = g; break; }
    }
    check('P21M', !!landed21, landed21 ? `the scroll taken away (landed at ${landed21.h} px: tick ${landed21.tickTop}..${landed21.tickBottom}, list ${landed21.listTop}..${landed21.listBottom}, error line ${landed21.errTop}): P21's read goes RED` : 'the mutant never left the tick out of view at any height tried');
    await app.emulateDpr(1, 1366, 768); await sleep(700); await FRESH();
  }
  // ---- P24 / P25: short windows, the button row pinned, the button at rest after the error
  {
    const SHORT = "(() => { const root = document.querySelector('.wz-arrival'); const p = document.querySelector('.wz-popout'); if (!p) return null; const r = p.getBoundingClientRect(); const b = p.querySelector('button[type=submit]'); const k = p.querySelector('.wz-popout-back') || p.querySelector('.wz-popout-switch'); const sc = p.querySelector('.wz-popout-scroll'); const e = p.querySelector('.wz-error'); const br = b.getBoundingClientRect(), kr = k.getBoundingClientRect(); const er = e ? e.getBoundingClientRect() : null; const q = (x) => Math.round(x * 10) / 10; const linkBelow = !(p.getAttribute('data-popout') === 'account' && document.documentElement.getAttribute('data-theme') === 'machina'); const floor = parseFloat(root.style.getPropertyValue('--popout-floor')) || 0; return { face: p.getAttribute('data-popout'), linkBelow, top: q(r.top), bottom: q(r.bottom), winH: innerHeight, floor, topInRoot: q(r.top - root.getBoundingClientRect().top), btnTop: q(br.top), btnBottom: q(br.bottom), linkBottom: q(kr.bottom), linkTop: q(kr.top), errBottom: er ? q(er.bottom) : null, scrolls: sc ? sc.scrollHeight > sc.clientHeight + 1 : false, panelScrolls: p.scrollHeight > p.clientHeight + 1 }; })()";
    const floorApplies = (g) => cfg.theme === 'flux' || cfg.theme === 'machina';
    const shortOk = (g) => !!g && g.bottom <= g.winH - 24 + 0.5 && (!floorApplies(g) || g.topInRoot >= g.floor - 0.5) && g.btnTop >= g.top - 0.5 && g.btnBottom <= g.bottom + 0.5 && g.linkBottom <= g.bottom + 0.5 && (!g.linkBelow || g.btnBottom <= g.linkTop + 0.5) && g.btnBottom <= g.winH && g.errBottom !== null && g.errBottom <= g.btnTop + 0.5 && !g.panelScrolls;
    const BTN = "(() => { const b = document.querySelector('.wz-popout button[type=submit]'); const cs = getComputedStyle(b); const a = document.activeElement; return { color: cs.color, border: cs.borderTopColor, shadow: cs.boxShadow, active: a === b, focusVisible: b.matches(':focus-visible'), onTick: !!a && a.classList.contains('wz-adult-box') }; })()";
    const SCROLLTO = (end) => `(() => { const p = document.querySelector('.wz-popout'); const sc = p.querySelector('.wz-popout-scroll'); const y = ${end ? '1e6' : '0'}; if (sc) sc.scrollTop = y; p.scrollTop = y; return true; })()`;
    const BTNY = "(() => Math.round(document.querySelector('.wz-popout button[type=submit]').getBoundingClientRect().top * 10) / 10)()";
    const goFace = async (face) => {
      const cur = await ev("(document.querySelector('.wz-popout') || { getAttribute() { return null; } }).getAttribute('data-popout')");
      if (cur === face) return;
      await ev(face === 'signin' ? "document.querySelector('.wz-popout-back').click()" : "document.querySelector('.wz-popout-switch').click()");
      await app.waitFor(`!!document.querySelector('.wz-popout[data-popout=${face}]')` + (face === 'account' ? " && !!document.querySelector('.wz-adult-box')" : ''), { label: face + ' face', timeout: 6000 }).catch(() => {});
      await sleep(500);
    };
    const SQ = "(() => { const p = document.querySelector('.wz-popout'); const sc = p.querySelector('.wz-popout-scroll'); const e = p.querySelector('.wz-error'); const h = p.querySelector('.wz-bighead'); const b = p.querySelector('button[type=submit]'); const l = p.querySelector('.wz-secondary'); const cs = getComputedStyle(p); const sr = sc.getBoundingClientRect(); const er = e ? e.getBoundingClientRect() : null; const br = b.getBoundingClientRect(); const q = (x) => Math.round(x * 10) / 10; const fs = (el) => el ? getComputedStyle(el).fontSize : null; return { squeeze: p.getAttribute('data-squeeze'), win: q(sc.clientHeight), headInScroll: !!h && sc.contains(h), errInScroll: !!e && sc.contains(e), errInView: !!er && er.top >= sr.top - 0.5 && er.bottom <= sr.bottom + 0.5, errH: er ? q(er.height) : 0, atBottom: sc.scrollHeight - sc.scrollTop - sc.clientHeight <= 1.5, padT: cs.paddingTop, padB: cs.paddingBottom, btnH: q(br.height), gapBL: q(l.getBoundingClientRect().top - br.bottom), fonts: { head: fs(h), field: fs(p.querySelector('.wz-field')), btn: fs(b), link: fs(p.querySelector('.wz-link')) } }; })()";
    const base0 = await ev("(() => { const p = document.querySelector('.wz-popout'); const fs = (el) => el ? getComputedStyle(el).fontSize : null; return { padT: getComputedStyle(p).paddingTop, head: fs(p.querySelector('.wz-bighead')), field: fs(p.querySelector('.wz-field')), btn: fs(p.querySelector('button[type=submit]')), link: fs(p.querySelector('.wz-link')) }; })()");
    await app.emulateDpr(1, 1366, 560); await sleep(800);
    await goFace('signin');
    await ev("(() => { window.__fl0 = window.fetch.bind(window); window.fetch = (u, o) => String(u).includes('/auth/login') ? Promise.reject(new TypeError('Failed to fetch')) : window.__fl0(u, o); return true; })()");
    await ev("document.querySelector('.wz-popout button[type=submit]').click(); true");
    await app.waitFor("!!document.querySelector('.wz-popout .wz-error')", { label: 'the sign-in error line', timeout: 8000 }).catch(() => {});
    await sleep(500);
    const s24 = await ev(SHORT);
    const sqSignin = await ev(SQ);
    await ev("window.fetch = window.__fl0; true");
    if (cfg.theme === 'machina') {
      const sq = await ev(SQ);
      const sqOk = sq.squeeze === 'true' && sq.win >= 36 && sq.headInScroll && sq.errInScroll;
      const spaceOk = sq.padT === '12px' && sq.padB === '12px' && Math.abs(sq.gapBL - 8) <= 0.5 && sq.btnH === 36 && sq.fonts.head === base0.head && sq.fonts.field === base0.field && sq.fonts.btn === base0.btn && sq.fonts.link === base0.link;
      check('P27', sqOk && spaceOk, `the squeezed sign-in at 560 with the error (${sq.errH} px tall): ${JSON.stringify(sq)}; sizes at 768 ${JSON.stringify(base0)}`);
      check('P27E', sq.errInScroll && sq.errInView && sq.atBottom, `the error line in view at the foot of the scrolling part: in view ${sq.errInView}, at the bottom ${sq.atBottom}`);
      await ev("(() => { const st = document.createElement('style'); st.id = 'mut-win'; st.textContent = '.wz-arrival .wz-popout .wz-popout-scroll{ max-height:20px !important; }'; document.head.appendChild(st); return true; })()"); await sleep(300);
      const mw = await ev(SQ);
      await ev("document.getElementById('mut-win').remove(); true"); await sleep(200);
      check('P27M', mw.win < 36 && !(mw.squeeze === 'true' && mw.win >= 36 && mw.headInScroll && mw.errInScroll), `the fields' window cut (landed: ${mw.win} px): P27's read goes RED`);
      await ev("(() => { const sc = document.querySelector('.wz-popout .wz-popout-scroll'); sc.scrollTop = 0; return true; })()"); await sleep(200);
      const mt = await ev(SQ);
      check('P27EM', mt.errInScroll && !mt.errInView && !mt.atBottom, `the part scrolled to its top (landed: error in view ${mt.errInView}, at the bottom ${mt.atBottom}): P27E's read goes RED`);
      // P27L: a ONE-line error
      await goFace('account'); await goFace('signin');
      await ev("(() => { window.__fl1 = window.fetch.bind(window); window.fetch = (u, o) => String(u).includes('/auth/login') ? Promise.resolve({ ok: false, status: 400, json: async () => ({ error: 'Wrong email or password.' }) }) : window.__fl1(u, o); return true; })()");
      await ev("document.querySelector('.wz-popout button[type=submit]').click(); true");
      await app.waitFor("!!document.querySelector('.wz-popout .wz-error')", { label: 'the one-line error', timeout: 8000 }).catch(() => {});
      await sleep(700);
      const l1 = await ev("(document.querySelector('.wz-popout') ? true : false) && " + SQ).catch(() => null);
      await sleep(600);
      const l2 = await ev("(document.querySelector('.wz-popout') ? true : false) && " + SQ).catch(() => null);
      await ev("window.fetch = window.__fl1; true");
      const lOk = (g) => !!g && g.squeeze === 'true' && g.win >= 36 && g.errInScroll && g.errInView && g.errH <= 20;
      check('P27L', lOk(l1) && !!l2 && l2.squeeze === l1.squeeze && l2.win === l1.win, `the one-line error at 560: ${JSON.stringify(l1)}; 600 ms later: window ${l2 && l2.win}, squeeze ${l2 && l2.squeeze}`);
      await ev("(() => { const st = document.createElement('style'); st.id = 'mut-win1'; st.textContent = '.wz-arrival .wz-popout .wz-popout-scroll{ max-height:20px !important; }'; document.head.appendChild(st); return true; })()"); await sleep(300);
      const lm = await ev(SQ);
      await ev("document.getElementById('mut-win1').remove(); true"); await sleep(200);
      check('P27LM', lm.win < 36 && !lOk(lm), `the window cut (landed: ${lm.win} px): P27L's read goes RED`);
    }
    await goFace('account');
    await app.mouseMove(2, 2); await sleep(400);
    const rest0 = await ev(BTN);
    const TICK = "(() => { const t = document.querySelector('.wz-adult-box'); const cs = getComputedStyle(t); return { focused: document.activeElement === t, outlineStyle: cs.outlineStyle, outlineW: cs.outlineWidth, outlineColor: cs.outlineColor, shadow: cs.boxShadow }; })()";
    const tick0 = await ev(TICK);
    await ev("document.querySelector('.wz-popout button[type=submit]').click(); true");
    await app.waitFor("!!document.querySelector('.wz-popout .wz-error')", { label: 'the 18+ error line', timeout: 6000 }).catch(() => {});
    await sleep(600);
    await app.mouseMove(2, 2); await sleep(400);
    const a24 = await ev(SHORT);
    const sqA = await ev(SQ);
    const rest1 = await ev(BTN);
    const tick1 = await ev(TICK);
    await ev(SCROLLTO(false)); await sleep(150); const y0 = await ev(BTNY);
    await ev(SCROLLTO(true)); await sleep(150); const y1 = await ev(BTNY);
    const pinned24 = Math.abs(y0 - y1) <= 0.5 && a24 && a24.scrolls === true;
    check('P24', shortOk(s24) && shortOk(a24) && pinned24, `1366x560 with the error: sign-in ${JSON.stringify(s24)}; create-account ${JSON.stringify(a24)}; button top ${y0} scrolled to the top, ${y1} to the foot`);
    if (cfg.theme !== 'machina') {
      const unchanged = (g) => g.squeeze === null && !g.headInScroll && !g.errInScroll && g.padT === base0.padT;
      check('P27U', unchanged(sqSignin) && unchanged(sqA), `at 560 with the error, sign-in ${JSON.stringify({ squeeze: sqSignin.squeeze, head: sqSignin.headInScroll, err: sqSignin.errInScroll, pad: sqSignin.padT })}, create-account ${JSON.stringify({ squeeze: sqA.squeeze, head: sqA.headInScroll, err: sqA.errInScroll, pad: sqA.padT })}, panel padding at 768 ${base0.padT}`);
      await ev("document.querySelector('.wz-popout').setAttribute('data-squeeze', 'true'); true"); await sleep(300);
      const mu = await ev(SQ);
      await ev("document.querySelector('.wz-popout').removeAttribute('data-squeeze'); true"); await sleep(200);
      check('P27UM', mu.squeeze === 'true' && !unchanged(mu), `the squeeze forced on (landed: padding ${mu.padT}): P27U's read goes RED`);
    }
    // P25: the button at rest after the error: the pointer parked away, focus on the tick
    const bp = await ev("(() => { const r = document.querySelector('.wz-popout button[type=submit]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    const sameLook = (a, b) => a.color === b.color && a.border === b.border && a.shadow === b.shadow;
    await ev("(document.querySelector('.wz-adult-box') || { focus() {} }).focus(); true");
    await app.mouseMove(bp.x, bp.y); await sleep(450); const hov1 = await ev(BTN);
    await app.mouseMove(2, 2); await sleep(400);
    check('P25', sameLook(rest0, rest1) && rest1.active === false && rest1.focusVisible === false && rest1.onTick === true && !sameLook(rest1, hov1), `before the submit ${JSON.stringify(rest0)}; after the 18+ error, pointer away ${JSON.stringify(rest1)}; under the pointer ${JSON.stringify(hov1)} (the brass is the pointer, not the focus)`);
    // P26: the focus mark on the tick after the error
    const markDrawn = (g) => !!g && g.focused === true && ((g.outlineStyle !== 'none' && parseFloat(g.outlineW) > 0 && g.outlineColor !== 'rgba(0, 0, 0, 0)') || g.shadow !== 'none');
    check('P26', tick0.focused === false && !markDrawn({ ...tick0, focused: true }) && markDrawn(tick1), `before the error (the tick unfocused) ${JSON.stringify(tick0)}; after the 18+ error, focus on the tick ${JSON.stringify(tick1)}`);
    await ev("(document.querySelector('.wz-adult-box') || { focus() {} }).focus(); true");
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-nomark'; st.textContent = '.wz-arrival .wz-popout .wz-adult-box:focus{ outline:none !important; box-shadow:none !important; }'; document.head.appendChild(st); return true; })()"); await sleep(300);
    const tickM = await ev(TICK);
    check('P26M', tickM.focused === true && !markDrawn(tickM), `the mark taken away (landed: ${JSON.stringify(tickM)}): P26's read goes RED`);
    await ev("document.getElementById('mut-nomark').remove(); true"); await sleep(200);
    await ev("(document.querySelector('.wz-adult-box') || { focus() {} }).focus(); true");
    await app.key('Tab'); await sleep(350);
    const tabbed = await ev(BTN);
    check('P25M', tabbed.active === true && !sameLook(tabbed, rest0), `focus moved to the button (landed: ${JSON.stringify(tabbed)}): P25's read goes RED`);
    // the mutants (asserted landed), on the create-account face with the error showing
    await goFace('signin'); await goFace('account');
    await ev("document.querySelector('.wz-popout button[type=submit]').click(); true");
    await app.waitFor("!!document.querySelector('.wz-popout .wz-error')", { label: 'the 18+ error line', timeout: 6000 }).catch(() => {});
    await sleep(500);
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-cap'; st.textContent = '.wz-arrival .wz-screen.wz-popout{ max-height:none !important; }'; document.head.appendChild(st); return true; })()"); await sleep(400);
    const m24 = await ev(SHORT);
    check('P24M', !shortOk(m24) && (m24.bottom > m24.winH - 24 || (floorApplies(m24) && m24.topInRoot < m24.floor - 0.5)), `the old cap (no max-height; landed: panel ${m24 && m24.top}..${m24 && m24.bottom} in a ${m24 && m24.winH} window, floor ${m24 && m24.floor}): P24's read goes RED`);
    await ev("document.getElementById('mut-cap').remove(); true"); await sleep(300);
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-asone'; st.textContent = '.wz-arrival .wz-screen.wz-popout{ display:block !important; overflow-y:auto !important; } .wz-arrival .wz-popout .wz-popout-scroll{ display:contents !important; } .wz-arrival .wz-popout .wz-form{ display:block !important; } .wz-arrival .wz-popout .wz-fieldcol{ padding-bottom:420px !important; }'; document.head.appendChild(st); return true; })()"); await sleep(400);
    await ev(SCROLLTO(false)); await sleep(150); const z0 = await ev(BTNY);
    await ev(SCROLLTO(true)); await sleep(150); const z1 = await ev(BTNY);
    check('P24M2', Math.abs(z0 - z1) > 1, `the old build (the panel scrolls as one; landed: button top ${z0} then ${z1}): P24's pinned read goes RED`);
    await ev("document.getElementById('mut-asone').remove(); true"); await sleep(300);
    if (cfg.theme === 'machina') {
      await goFace('signin');
      await ev("(() => { const st = document.createElement('style'); st.id = 'mut-top313'; st.textContent = '.wz-arrival .wz-screen.wz-popout[data-popout=signin]{ top:313px !important; max-height:calc(100% - 313px - 24px) !important; }'; document.head.appendChild(st); return true; })()"); await sleep(400);
      const m3 = await ev(SHORT);
      check('P24M3', !!m3 && m3.topInRoot < m3.floor - 0.5, `the old sign-in top (landed: top ${m3 && m3.topInRoot}, the mark's floor ${m3 && m3.floor}): P24's floor read goes RED`);
      await ev("document.getElementById('mut-top313').remove(); true"); await sleep(300);
    }
    await app.emulateDpr(1, 1366, 768); await sleep(800);
    await goFace('signin'); await goFace('account');
  }
  // ---- P23: Esc (the create-account face now)
  {
    const s0 = await ev(STAGE);
    await ESCKEY(); const s1 = await ev(STAGE);
    await ESCKEY(); const s2 = await ev(STAGE);
    check('P23', s0.panel === 'account' && s1.panel === 'signin' && s2.panel === null && s2.stage === 'doors', `Esc on the create-account face: ${JSON.stringify(s0)} then ${JSON.stringify(s1)} (to sign-in); Esc on sign-in: ${JSON.stringify(s2)} (to the doors)`);
    await ev("document.querySelector('.wz-arrival-signin').click(); true");
    await app.waitFor("!!document.querySelector('.wz-popout[data-popout=signin]')", { label: 'the panel again', timeout: 6000 }).catch(() => {});
    await sleep(400);
    await ev("document.querySelector('.wz-popout-switch').click()");
    await app.waitFor("!!document.querySelector('.wz-popout[data-popout=account]') && !!document.querySelector('.wz-adult-box')", { label: 'the create-account face', timeout: 6000 }).catch(() => {});
    await sleep(500);
    await ev("window.__escSwallow = (e) => { if (e.key === 'Escape') e.stopImmediatePropagation(); }; window.addEventListener('keydown', window.__escSwallow, true); true");
    await ESCKEY(); const m = await ev(STAGE);
    await ev("window.removeEventListener('keydown', window.__escSwallow, true); true");
    check('P23M', m.panel === 'account', `the Esc handler taken away (the key swallowed; landed: panel still ${JSON.stringify(m.panel)}): P23's read goes RED`);
  }
  const sig = await ev(`(() => { if (!document.querySelector('.wz-adult-box')) return { box: false }; window.__reg = 0; window.__regBodies = []; const rf = window.fetch.bind(window); window.fetch = (u, o) => { if (String(u).includes('register')) { window.__reg++; window.__regBodies.push(o && o.body ? String(o.body) : null); } return rf(u, o); };
    window.__keys0 = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]; const n = (sel, v) => { const el = document.querySelector(sel); const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    n('.wz-popout input[autocomplete=given-name]', 'Pat'); n('.wz-popout input[name=email]', 'pat@example.com'); n('.wz-popout input[name=new-password]', 'a-long-password-1'); return { box: true, ticked: document.querySelector('.wz-adult-box').checked }; })()`);
  let p4 = !!sig.box && sig.ticked === false;
  let line = null, regUnticked = null, regTicked = null, added = null, focusOnTick = null, spaceTicked = null, tickLook = null, errColor = null, redNow = null, regBodies = null;
  if (p4) {
    await ev("document.querySelector('.wz-popout button[type=submit]').click()"); await sleep(600);
    line = await ev("(document.querySelector('.wz-popout .wz-error') || {}).textContent || null");
    regUnticked = await ev('window.__reg');
    errColor = await ev("(() => { const e = document.querySelector('.wz-popout .wz-error'); return e ? getComputedStyle(e).color : null; })()");
    await ev("(() => { const st = document.createElement('style'); st.id = 'mut-red'; st.textContent = '.wz-popout .wz-error{ color:#c0503a !important; }'; document.head.appendChild(st); return true; })()"); await sleep(200);
    redNow = await ev("(() => { const e = document.querySelector('.wz-popout .wz-error'); return e ? getComputedStyle(e).color : null; })()");
    await ev("document.getElementById('mut-red') && document.getElementById('mut-red').remove(); true");
    focusOnTick = await ev("document.activeElement === document.querySelector('.wz-adult-box')");
    const look0 = await ev(`(() => { ${PX} const b = document.querySelector('.wz-adult-box'); const cs = getComputedStyle(b); return { w: cs.width, h: cs.height, bw: cs.borderTopWidth, edge: px(b, 'borderTopColor').rgb, mark: getComputedStyle(b, '::after').content }; })()`);
    await app.typeKeys(' '); await sleep(250);
    spaceTicked = await ev("document.querySelector('.wz-adult-box').checked");
    const look1 = await ev(`(() => { ${PX} const b = document.querySelector('.wz-adult-box'); const a = getComputedStyle(b, '::after'); return { mark: a.content, markColor: a.borderRightColor }; })()`);
    tickLook = { look0, look1 };
    await ev("document.querySelector('.wz-popout button[type=submit]').click()"); await sleep(900);
    regTicked = await ev('window.__reg');
    regBodies = await ev('window.__regBodies');
    added = await ev("(() => { const now = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]; return now.filter((k) => !window.__keys0.includes(k) && /adult|18|age|over/i.test(k)); })()");
    p4 = line === 'Wrizo accounts are for writers 18 and older, for now.' && regUnticked === 0 && regTicked >= 1 && added.length === 0;
  }
  { const edgeWant = { plateau: '#9C8A6E', flux: '#5F8F95', machina: '#9AA1A8' }[cfg.theme]; const l0 = tickLook && tickLook.look0; const l1 = tickLook && tickLook.look1;
    check('P11', !!l0 && l0.w === '16px' && l0.h === '16px' && l0.bw === '1px' && hex(l0.edge) === edgeWant && focusOnTick === true && spaceTicked === true && !!l1 && l1.mark === '""' && l1.markColor === 'rgb(255, 152, 0)', `box `+(l0 && l0.w)+' x '+(l0 && l0.h)+`, border `+(l0 && l0.bw)+` `+(l0 && hex(l0.edge))+` (want `+edgeWant+`); focus on the tick after the error `+focusOnTick+`; Space ticked `+spaceTicked+`; mark `+JSON.stringify(l1)); }
  { const want = { plateau: 'rgb(185, 170, 140)', flux: 'rgb(126, 180, 196)', machina: 'rgb(154, 161, 168)' }[cfg.theme];
    check('P15', errColor === want, `the error line's colour `+errColor+` (the panel's quiet colour `+want+`, never red)`);
    check('P15M', redNow !== null && redNow !== want && redNow !== errColor, `the error line red (landed: `+redNow+`): P15's read goes RED`); }
  { const parsed = (regBodies || []).map((b) => { try { return JSON.parse(b); } catch { return null; } });
    check('P22', parsed.length >= 1 && parsed.every((b) => !!b && b.adult === true) && regUnticked === 0 && (added || []).length === 0, `register requests ${JSON.stringify(parsed.map((b) => b && { adult: b.adult, keys: Object.keys(b).sort() }))}; sent unticked ${regUnticked}; storage keys added ${JSON.stringify(added)}`); }
  check('P4', p4, `tick ${JSON.stringify(sig)}; line ${JSON.stringify(line)}; register calls unticked ${regUnticked}, ticked ${regTicked}; storage keys added ${JSON.stringify(added)}`);
  await ev("localStorage.setItem('wz.signedOutHere', '1'); true");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'the arrival, signed out here' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});
  await app.waitFor("!!document.querySelector('.wz-popout')", { label: 'the panel, already up', timeout: 8000 }).catch(() => {});
  const w2 = await ev("({ panel: !!document.querySelector('.wz-popout'), stage: document.querySelector('.wz-popout') ? document.querySelector('.wz-popout').dataset.popout : null, back: !!document.querySelector('.wz-popout .wz-popout-back') })");
  check('P5', w2.panel && w2.stage === 'signin' && w2.back === false, JSON.stringify(w2));
  // ---- P23L: a locked device: Esc does nothing on the sign-in face; the create-account face still returns to sign-in (its back is kept)
  {
    const l0 = await ev(STAGE);
    await ESCKEY(); const l1 = await ev(STAGE);
    await ev("document.querySelector('.wz-popout-switch').click()");
    await app.waitFor("!!document.querySelector('.wz-popout[data-popout=account]')", { label: 'the create-account face (locked)', timeout: 6000 }).catch(() => {});
    await sleep(500);
    await ESCKEY(); const l2 = await ev(STAGE);
    check('P23L', l0.panel === 'signin' && l0.back === false && l1.panel === 'signin' && l1.stage === 'signin' && l2.panel === 'signin', `locked: ${JSON.stringify(l0)}; Esc: ${JSON.stringify(l1)} (nothing); on the create-account face Esc: ${JSON.stringify(l2)} (to sign-in)`);
  }
  // P22M: the field dropped from the request (asserted landed) turns P22's read red
  {
    await ev("document.querySelector('.wz-popout-switch').click()");
    await app.waitFor("!!document.querySelector('.wz-popout[data-popout=account]') && !!document.querySelector('.wz-adult-box')", { label: 'the create-account face', timeout: 6000 }).catch(() => {});
    await sleep(500);
    await ev(`(() => { window.__mutBodies = []; const rf = window.fetch.bind(window); window.fetch = (u, o) => { if (String(u).includes('register')) { let b = o && o.body ? String(o.body) : null; try { const j = JSON.parse(b); delete j.adult; b = JSON.stringify(j); } catch (e) {} window.__mutBodies.push(b); return rf(u, { ...o, body: b }); } return rf(u, o); };
      const n = (sel, v) => { const el = document.querySelector(sel); const st = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; st.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
      n('.wz-popout input[autocomplete=given-name]', 'Pat'); n('.wz-popout input[name=email]', 'pat@example.com'); n('.wz-popout input[name=new-password]', 'a-long-password-1'); document.querySelector('.wz-adult-box').click(); return true; })()`);
    await sleep(250);
    await ev("document.querySelector('.wz-popout button[type=submit]').click(); true"); await sleep(900);
    const mb = await ev('window.__mutBodies');
    const mparsed = (mb || []).map((b) => { try { return JSON.parse(b); } catch { return null; } });
    const droppedLanded = mparsed.length >= 1 && mparsed.every((b) => !!b && !('adult' in b));
    check('P22M', droppedLanded && !mparsed.every((b) => !!b && b.adult === true), `the field dropped (landed: ${JSON.stringify(mparsed.map((b) => b && Object.keys(b).sort()))}): P22's read goes RED`);
  }
});
const bad = results.filter((r) => !r.pass).map((r) => r.id);
console.log(bad.length ? `SIGNIN-POPOUT [${TAG}] FAIL - ${bad.join(', ')}` : `SIGNIN-POPOUT [${TAG}] PASS (${results.length} checks)`);
process.exitCode = bad.length ? 1 : 0;
