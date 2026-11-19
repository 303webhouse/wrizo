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
    const ph = getComputedStyle(f, '::placeholder').color; return { w: Math.round(p.getBoundingClientRect().width * 10) / 10, vw: window.innerWidth, veilBg: veil.backgroundColor, veilShown: veil.display !== 'none' && veil.content !== 'none', ghost: ghost ? ghost.textContent : null, ph, edge: px(f, 'borderTopColor').rgb, link: px(link, 'color').rgb, tag: tag && getComputedStyle(tag).display !== 'none' ? px(tag, 'color').rgb : null }; })()`);
  const want = cfg.theme === 'machina' ? 417 : 400;
  check('P6', Math.abs(sp.w - want) <= 1 && sp.w >= 360, `panel ${sp.w} px at ${sp.vw} (want ${want}, never under 360)`);
  const veilOk = cfg.theme === 'flux' ? sp.veilShown && sp.veilBg === 'rgba(2, 12, 16, 0.74)' : cfg.theme === 'machina' ? !sp.veilShown : sp.veilShown;
  check('P7', veilOk && !!realWrite && sp.ghost === realWrite, `veil ${sp.veilShown ? sp.veilBg : 'none'}; ghost door ${JSON.stringify(sp.ghost)} against the real door ${JSON.stringify(realWrite)}`);
  const same = (a, h) => !!a && hex(a) === h;
  const p8 = cfg.theme === 'plateau' ? sp.ph === 'rgb(156, 144, 129)' : cfg.theme === 'machina' ? same(sp.edge, '#9AA1A8') && same(sp.link, '#9AA1A8') && sp.ph === 'rgb(154, 161, 168)' : cfg.theme === 'flux' ? same(sp.edge, '#5F8F95') && same(sp.link, '#9AD7EA') && same(sp.tag, '#7EB4C4') : true;
  check('P8', p8, `placeholder ${sp.ph}; edge ${sp.edge && hex(sp.edge)}; links ${sp.link && hex(sp.link)}; tag ${sp.tag ? hex(sp.tag) : null}`);
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
  const sig = await ev(`(() => { if (!document.querySelector('.wz-adult-box')) return { box: false }; window.__reg = 0; const rf = window.fetch.bind(window); window.fetch = (u, o) => { if (String(u).includes('register')) window.__reg++; return rf(u, o); };
    window.__keys0 = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]; const n = (sel, v) => { const el = document.querySelector(sel); const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    n('.wz-popout input[autocomplete=given-name]', 'Pat'); n('.wz-popout input[name=email]', 'pat@example.com'); n('.wz-popout input[name=new-password]', 'a-long-password-1'); return { box: true, ticked: document.querySelector('.wz-adult-box').checked }; })()`);
  let p4 = !!sig.box && sig.ticked === false;
  let line = null, regUnticked = null, regTicked = null, added = null, focusOnTick = null, spaceTicked = null, tickLook = null, errColor = null, redNow = null;
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
    added = await ev("(() => { const now = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]; return now.filter((k) => !window.__keys0.includes(k) && /adult|18|age|over/i.test(k)); })()");
    p4 = line === 'Wrizo accounts are for writers 18 and older, for now.' && regUnticked === 0 && regTicked >= 1 && added.length === 0;
  }
  { const edgeWant = { plateau: '#9C8A6E', flux: '#5F8F95', machina: '#9AA1A8' }[cfg.theme]; const l0 = tickLook && tickLook.look0; const l1 = tickLook && tickLook.look1;
    check('P11', !!l0 && l0.w === '16px' && l0.h === '16px' && l0.bw === '1px' && hex(l0.edge) === edgeWant && focusOnTick === true && spaceTicked === true && !!l1 && l1.mark === '""' && l1.markColor === 'rgb(255, 152, 0)', `box `+(l0 && l0.w)+' x '+(l0 && l0.h)+`, border `+(l0 && l0.bw)+` `+(l0 && hex(l0.edge))+` (want `+edgeWant+`); focus on the tick after the error `+focusOnTick+`; Space ticked `+spaceTicked+`; mark `+JSON.stringify(l1)); }
  { const want = { plateau: 'rgb(185, 170, 140)', flux: 'rgb(126, 180, 196)', machina: 'rgb(154, 161, 168)' }[cfg.theme];
    check('P15', errColor === want, `the error line's colour `+errColor+` (the panel's label colour `+want+`, never red)`);
    check('P15M', redNow !== null && redNow !== want && redNow !== errColor, `the error line red (landed: `+redNow+`): P15's read goes RED`); }
  check('P4', p4, `tick ${JSON.stringify(sig)}; line ${JSON.stringify(line)}; register calls unticked ${regUnticked}, ticked ${regTicked}; storage keys added ${JSON.stringify(added)}`);
  await ev("localStorage.setItem('wz.signedOutHere', '1'); true");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'the arrival, signed out here' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});
  await app.waitFor("!!document.querySelector('.wz-popout')", { label: 'the panel, already up', timeout: 8000 }).catch(() => {});
  const w2 = await ev("({ panel: !!document.querySelector('.wz-popout'), stage: document.querySelector('.wz-popout') ? document.querySelector('.wz-popout').dataset.popout : null, back: !!document.querySelector('.wz-popout .wz-popout-back') })");
  check('P5', w2.panel && w2.stage === 'signin' && w2.back === false, JSON.stringify(w2));
});
const bad = results.filter((r) => !r.pass).map((r) => r.id);
console.log(bad.length ? `SIGNIN-POPOUT [${TAG}] FAIL - ${bad.join(', ')}` : `SIGNIN-POPOUT [${TAG}] PASS (${results.length} checks)`);
process.exitCode = bad.length ? 1 : 0;
