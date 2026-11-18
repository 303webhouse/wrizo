// THE SIGN-IN POP-OUT (the Wrizors' spec, Nov 18; Fable's order: ways 1 and 2, the strings in the lexicon, the 18+ tick, #107's edge). A check, signed out (the auth double is told to answer "signed out"), for one theme and one Page tone (env WA_THEME, WA_TONE).
//   P1  the splash's Sign in door opens ONE panel over the picture: a dialog (`.wz-popout`, aria-modal), the picture still there behind it (`.wz-hero.behind`, drawn: opacity above 0), the door not pressable behind it
//   P2  the panel's words are the lexicon's for this theme (Arbor "Sign in", Flux "Log in" and the node tag "N.01 · INPUT", Machina "Sign in"), and "New here? Create an account" swaps the panel's contents IN PLACE: Arbor and Flux keep the top edge put and the panel grows down
//   P3  #107: a field's 1 px edge reads >= 3:1 against the field and against the panel (Arbor's is #9C8A6E: 5.83:1 and 4.02:1)
//   P4  the 18+ tick on the create-account face: unticked, the submit says "Wrizo accounts are for writers 18 and older, for now." and calls nothing (no request to the register endpoint); ticked, it goes; the tick is stored nowhere (no storage key is added)
//   P6  the approved spec's width (Fable, Nov 18, 1:45 pm): 400 px at 1366 and never under 360 (Machina: the mark's width, 417)
//   P7  the veil (Flux #020C10 at 74%; Machina none) and the ghost doors read the same words as the real doors (one lexicon key: authDoorWrite)
//   P8  the spec table's colours, exactly: Arbor placeholder #9C9081; Flux field edge #5F8F95, links #9AD7EA, tag #7EB4C4
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
  const top1 = await ev("document.querySelector('.wz-popout').getBoundingClientRect().top");
  const h1 = await ev("document.querySelector('.wz-popout').getBoundingClientRect().height");
  const w = await ev(`(() => { const tag = document.querySelector('.wz-popout-tag'); const btn = document.querySelector('.wz-popout button[type=submit]'); return { door: ${JSON.stringify(doorWord)}, button: btn && btn.textContent.trim(), tag: tag ? tag.textContent.trim() : null, head: document.querySelector('.wz-popout .wz-bighead').textContent.trim() }; })()`);
  const p2a = w.door === WORDS.door && w.button === WORDS.door && w.head === 'Welcome back.' && (WORDS.tag === null ? (w.tag === 'Input' || w.tag === null) : w.tag === WORDS.tag);
  const e = await ev(`(() => { ${PX} const f = document.querySelector('.wz-popout .wz-field'); const p = document.querySelector('.wz-popout'); return { edge: px(f, 'borderTopColor').rgb, edgeW: getComputedStyle(f).borderTopWidth, field: bgOf(f), panel: bgOf(p) }; })()`);
  const rField = ratio(e.edge, e.field), rPanel = ratio(e.edge, e.panel);
  check('P3', rField >= 3 && rPanel >= 3 && e.edgeW === '1px', `edge ${hex(e.edge)} ${e.edgeW}: ${rField.toFixed(2)}:1 against the field ${hex(e.field)}, ${rPanel.toFixed(2)}:1 against the panel ${hex(e.panel)}`);
  const sp = await ev(`(() => { ${PX} const p = document.querySelector('.wz-popout'); const f = p.querySelector('.wz-field'); const arr = document.querySelector('.wz-arrival'); const veil = getComputedStyle(arr, '::after'); const ghost = document.querySelector('.wz-arrival-doors-ghost .wz-arrival-write'); const link = p.querySelector('.wz-link'); const tag = p.querySelector('.wz-popout-tag');
    const ph = getComputedStyle(f, '::placeholder').color; return { w: Math.round(p.getBoundingClientRect().width * 10) / 10, vw: window.innerWidth, veilBg: veil.backgroundColor, veilShown: veil.display !== 'none' && veil.content !== 'none', ghost: ghost ? ghost.textContent : null, ph, edge: px(f, 'borderTopColor').rgb, link: px(link, 'color').rgb, tag: tag && getComputedStyle(tag).display !== 'none' ? px(tag, 'color').rgb : null }; })()`);
  const want = cfg.theme === 'machina' ? 417 : 400;
  check('P6', Math.abs(sp.w - want) <= 1 && sp.w >= 360, `panel ${sp.w} px at ${sp.vw} (want ${want}, never under 360)`);
  const veilOk = cfg.theme === 'flux' ? sp.veilShown && sp.veilBg === 'rgba(2, 12, 16, 0.74)' : cfg.theme === 'machina' ? !sp.veilShown : sp.veilShown;
  check('P7', veilOk && !!realWrite && sp.ghost === realWrite, `veil ${sp.veilShown ? sp.veilBg : 'none'}; ghost door ${JSON.stringify(sp.ghost)} against the real door ${JSON.stringify(realWrite)}`);
  const same = (a, h) => !!a && hex(a) === h;
  const p8 = cfg.theme === 'plateau' ? sp.ph === 'rgb(156, 144, 129)' : cfg.theme === 'flux' ? same(sp.edge, '#5F8F95') && same(sp.link, '#9AD7EA') && same(sp.tag, '#7EB4C4') : true;
  check('P8', p8, `placeholder ${sp.ph}; edge ${sp.edge && hex(sp.edge)}; links ${sp.link && hex(sp.link)}; tag ${sp.tag ? hex(sp.tag) : null}`);
  await ev("document.querySelector('.wz-popout-switch').click()");
  await app.waitFor("!!document.querySelector('.wz-popout[data-popout=account]')", { label: 'the create-account face', timeout: 6000 }).catch(() => {});
  await sleep(700);
  const top2 = await ev("document.querySelector('.wz-popout').getBoundingClientRect().top");
  const h2 = await ev("document.querySelector('.wz-popout').getBoundingClientRect().height");
  const growsDown = Math.abs(top2 - top1) <= 1 && h2 > h1;
  check('P2', p2a && (cfg.theme === 'machina' ? h2 > h1 : growsDown), `words ${JSON.stringify(w)}; top ${Math.round(top1)} then ${Math.round(top2)}, height ${Math.round(h1)} then ${Math.round(h2)}`);
  const sig = await ev(`(() => { if (!document.querySelector('.wz-adult-box')) return { box: false }; window.__reg = 0; const rf = window.fetch.bind(window); window.fetch = (u, o) => { if (String(u).includes('register')) window.__reg++; return rf(u, o); };
    window.__keys0 = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]; const n = (sel, v) => { const el = document.querySelector(sel); const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    n('.wz-popout input[autocomplete=given-name]', 'Pat'); n('.wz-popout input[name=email]', 'pat@example.com'); n('.wz-popout input[name=new-password]', 'a-long-password-1'); return { box: true, ticked: document.querySelector('.wz-adult-box').checked }; })()`);
  let p4 = !!sig.box && sig.ticked === false;
  let line = null, regUnticked = null, regTicked = null, added = null;
  if (p4) {
    await ev("document.querySelector('.wz-popout button[type=submit]').click()"); await sleep(600);
    line = await ev("(document.querySelector('.wz-popout .wz-error') || {}).textContent || null");
    regUnticked = await ev('window.__reg');
    await ev("document.querySelector('.wz-adult-box').click()"); await sleep(200);
    await ev("document.querySelector('.wz-popout button[type=submit]').click()"); await sleep(900);
    regTicked = await ev('window.__reg');
    added = await ev("(() => { const now = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]; return now.filter((k) => !window.__keys0.includes(k) && /adult|18|age|over/i.test(k)); })()");
    p4 = line === 'Wrizo accounts are for writers 18 and older, for now.' && regUnticked === 0 && regTicked >= 1 && added.length === 0;
  }
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
