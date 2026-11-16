// PROBE (not for merge): does the front door's Write door open a page on the redesign? Signed in and signed out, the redesign (no query) and today's
// Arbor (?arbor2=0). Per case: the door's state, what element is under its centre, the press, the route and the focus after, and any page errors.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const errs = [];
  app.tap((method, p) => { if (method === 'Runtime.exceptionThrown') errs.push(String(p?.exceptionDetails?.exception?.description || p?.exceptionDetails?.text).slice(0, 200)); if (method === 'Runtime.consoleAPICalled' && (p?.type === 'error' || p?.type === 'warning')) errs.push(p.type + ': ' + (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)); });
  await app.cdp('Runtime.enable');
  for (const anon of ['0', '1']) for (const q of ['', '?arbor2=0']) {
    process.env.WS_ANON = anon; errs.length = 0;
    await app.goto('/');
    await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
    await app.evalJs(`history.replaceState(null, '', '/${q}#/')`); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
    const sel = q ? 'button.wz-arrival-write' : '.arbor2-front-doors .arbor2-door.wz-arrival-write';
    await waitSoft(app, `!!document.querySelector(${J(sel + ':not([disabled])')})`, { label: 'write ready', timeout: 25000 });
    await sleep(600);
    const pre = await app.evalJs(`(() => { const b = document.querySelector(${J(sel)}); if (!b) return { found: false }; const r = b.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const top = document.elementFromPoint(x, y);
      return { found: true, disabled: b.disabled, x: Math.round(x), y: Math.round(y), w: Math.round(r.width), top: top ? top.tagName.toLowerCase() + '.' + String(top.className && top.className.baseVal !== undefined ? top.className.baseVal : top.className).split(' ').slice(0, 3).join('.') : null, topIsDoor: !!top && (top === b || b.contains(top)), hash: location.hash, body: document.body.innerText.slice(0, 120) }; })()`);
    if (pre.found) { await app.mouseMove(pre.x, pre.y); await app.mouseDown(pre.x, pre.y); await app.mouseUp(pre.x, pre.y); }
    await waitSoft(app, "!!document.querySelector('[contenteditable=\"true\"]')", { label: 'editable', timeout: 12000 });
    await sleep(500);
    const post = await app.evalJs("(() => ({ hash: location.hash, editable: document.querySelectorAll('[contenteditable=\"true\"]').length, active: document.activeElement ? document.activeElement.tagName.toLowerCase() + '.' + String(document.activeElement.className).split(' ').slice(0, 2).join('.') : null, body: document.body.innerText.slice(0, 160) }))()");
    console.log('PROBE ' + J({ anon, q: q || '(redesign)', pre, post, errs: errs.slice(0, 6) }));
  }
  return [{ name: 'probe ran', pass: true }];
}, { label: 'arbor-write-probe' });
console.log('\nARBOR-WRITE-PROBE VERIFY: PASS (1 checks)');
process.exit(0);
