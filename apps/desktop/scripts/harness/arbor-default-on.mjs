// THE ARBOR REDESIGN ON BY DEFAULT (NICK, Nov 15, 6:36 pm, via Fable 6:45 pm: "the redesign ON by default (?arbor2=0 test-only), the mockup bar behind a
// test-only switch with every Mood switch at its ruled default"). Plain navigations (no WS_URL_SEARCH; the query in this file's own navigations):
//   D1 Arbor, no query: the redesign is on (<html data-arbor2>, its room) and there is NO mockup bar; no Mood switch is off (data-arbor2-off unset)
//   D2 Arbor, ?arbor2=0 (test-only): the redesign is off - no data-arbor2, no room layers
//   D3 Arbor, ?arbor2=1 (the explicit flag): the redesign AND the mockup bar ("Arbor mockup")
//   D4 Flux and Machina, no query: the redesign is not there (no data-arbor2) - nothing of Arbor's reaches another theme
//   D5 a theme switch in the session, no reload: Arbor -> Flux takes data-arbor2 away; Flux -> Arbor puts it back (the redesign loads on the switch)
//   M1 (mutant) data-arbor2 forced onto a Flux page (asserted LANDED): D4's read goes red
//   M2 (mutant) a mockup bar put into the default page (asserted LANDED): D1's read goes red
// Seeding goes through the seams; the theme through the product's own store key read at boot and its own picker-free seam where one exists.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const READ = `(() => { const r = document.documentElement; return { theme: r.getAttribute('data-theme'), arbor: r.getAttribute('data-arbor2'), off: r.getAttribute('data-arbor2-off'),
  room: r.getAttribute('data-arbor2-room'), layers: document.querySelectorAll('.arbor2-pergola, .arbor2-sun').length, bar: !!document.querySelector('#arbor2-mockup-bar .arbor2-bar'),
  barHead: [...document.querySelectorAll('.arbor2-bar-head')].some((b) => (b.textContent || '').trim() === 'Arbor mockup'), host: !!document.getElementById('arbor2-mockup-bar') }; })()`;
const d1ok = (m) => !!m && m.theme === 'plateau' && m.arbor === 'true' && !!m.room && m.layers > 0 && !m.bar && !m.barHead && !m.off;
const d4ok = (m) => !!m && m.theme !== 'plateau' && m.arbor !== 'true';

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const visit = async (theme, query) => {
    await app.goto('/');
    await app.evalJs(`localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', ${J(theme)}); true`);
    await app.evalJs(`history.replaceState(null, '', '/' + ${J(query)} + '#/')`); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
    await waitSoft(app, "!!document.querySelector('.wz-arrival') || !!document.querySelector('.desk-frame-stage')", { label: 'desk', timeout: 15000 });
    await sleep(1500);
    return app.evalJs(READ);
  };
  const d1 = await visit('plateau', '');
  ok(`D1 Arbor with no query: the redesign is on (data-arbor2, room ${d1 && d1.room}, ${d1 && d1.layers} room layers) and there is NO mockup bar; no Mood switch off`, d1ok(d1), J(d1));
  const d2 = await visit('plateau', '?arbor2=0');
  ok(`D2 Arbor with the test-only ?arbor2=0: the redesign is off (data-arbor2 ${d2 && d2.arbor}, ${d2 && d2.layers} room layers)`, !!d2 && d2.theme === 'plateau' && d2.arbor !== 'true' && d2.layers === 0 && !d2.bar, J(d2));
  const d3 = await visit('plateau', '?arbor2=1');
  ok(`D3 Arbor with the explicit ?arbor2=1: the redesign and the mockup bar ("Arbor mockup")`, !!d3 && d3.arbor === 'true' && d3.bar && d3.barHead, J(d3));
  const fx = await visit('flux', ''), mx = await visit('machina', '');
  ok(`D4 Flux and Machina with no query: no data-arbor2 (${fx && fx.arbor}, ${mx && mx.arbor}) - nothing of the redesign reaches another theme`, d4ok(fx) && d4ok(mx) && fx.theme === 'flux' && mx.theme === 'machina', J({ fx, mx }));
  // D5: live switches the writer's way - the rail's Themes item, then the theme's own card (a locked card is reported, never clicked past)
  const setTheme = async (t) => { const name = { plateau: 'Arbor', flux: 'Flux', machina: 'Machina' }[t];
    await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(700);
    return app.evalJs(`(() => { const c = [...document.querySelectorAll('.wz-theme-card')].find((b) => (b.querySelector('.wz-theme-wm')?.textContent || '').trim() === ${JSON.stringify(name)}); if (!c) return null; if (c.disabled) return 'locked'; c.click(); return 'picker'; })()`); };
  // (on a page, where the rail is: the front door at / has no rail - the first run's D5 found no Themes item there, via null)
  await visit('plateau', '');
  { const pid = 'arbor-do-' + Math.random().toString(36).slice(2, 7);
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: pid, text: 'Theme switch page', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${pid}'`); await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector(\".wz-strip-item[data-category='theme']\")", { label: 'page with the rail', timeout: 15000 }); await sleep(800); }
  const via1 = await setTheme('flux'); await sleep(800); const s1 = await app.evalJs(READ);
  const via2 = await setTheme('plateau'); await sleep(1500); const s2 = await app.evalJs(READ);
  ok(`D5 a theme switch in the session, no reload (via ${via1}/${via2}): Arbor -> Flux takes data-arbor2 away (${s1 && s1.arbor}); Flux -> Arbor puts it back (${s2 && s2.arbor})`,
    via1 === 'picker' && via2 === 'picker' && !!s1 && s1.theme === 'flux' && s1.arbor !== 'true' && !!s2 && s2.theme === 'plateau' && s2.arbor === 'true', J({ via1, via2, s1, s2 }));
  // M1: data-arbor2 forced onto a Flux page - D4's read must go red
  await visit('flux', '');
  await app.evalJs("document.documentElement.setAttribute('data-arbor2', 'true')"); const m1 = await app.evalJs(READ);
  ok(`M1 (mutant): data-arbor2 forced onto a Flux page (LANDED: ${m1 && m1.arbor}) - D4's read goes RED`, !!m1 && m1.arbor === 'true' && !d4ok(m1), J(m1));
  // M2: a mockup bar put into the default page - D1's read must go red
  await visit('plateau', '');
  await app.evalJs("(() => { const h = document.getElementById('arbor2-mockup-bar') || document.body; const d = document.createElement('div'); d.className = 'arbor2-bar'; const b = document.createElement('button'); b.className = 'arbor2-bar-head'; b.textContent = 'Arbor mockup'; d.appendChild(b); h.appendChild(d); return true; })()");
  const m2 = await app.evalJs(READ);
  ok(`M2 (mutant): a mockup bar put into the default page (LANDED: bar ${m2 && m2.bar}) - D1's read goes RED`, !!m2 && m2.bar && !d1ok(m2), J(m2));
  return checks;
}, { label: 'arbor-default-on' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-DEFAULT-ON PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 7;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-DEFAULT-ON VERIFY: PASS (${checks.length} checks)` : `\nARBOR-DEFAULT-ON VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
