// MACHINA'S LOOK, THE WRIZORS' PASS 1 MUSTS (Fable, Nov 20, 3:15 pm: "(a) The run's brass notch in the light room gets a 1 px ink edge (#23272B).
// (b) The caret: brass on the dark page, brass with 1 px ink edges on the light page. Red first."). Machina's look (data-machina2), no switch.
// Built here: (a), and (b)'s dark page. (b)'s light page is HELD for a ruling: a native caret cannot carry an edge, and the drawn caret Arbor once had
// (src/arbor2/edgedCaret.tsx) was scrapped by Nick on Nov 14 for its cost at every key; nothing here touches the light page's caret.
//
// NOTCH  U1  in the light room the Run's notch (the unit in progress, .machina-run-strip > i.here::after) is brass with a 1 px #23272B edge on
//            both sides; in the dark room it has no edge (brass reads on the dark room as it is)
//        U2  (source) RunStrip draws the notch on the unit in progress (className 'here'), so U1's rule meets the real strip
// CARET  U3  on the dark page the editor's caret is brass (#FF9800) in Draft and in Free Write (whose pen ink reaches the caret inline)
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/machina-look-musts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// FIXTURE (Nov 20, before this file's first green; Actions 44837454359 still read data-machina2 null): the driver pins ?machina2=0 for any file that
// does not ASK for the look (runtime-verify.mjs, Machina's pin); this file asks, as arbor-bug108.mjs asks for Arbor's. No assertion changes.
process.env.WS_MACHINA2 = process.env.WS_MACHINA2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const INK = 'rgb(35, 39, 43)';
const BRASS = 'rgb(255, 152, 0)';

// a probe Run strip, read in the room named (set on <html> and read in the same task, before anything re-resolves it)
const NOTCH = (room) => `(() => { const r = document.documentElement; const was = r.getAttribute('data-machina2-room');
  const host = document.createElement('div'); host.className = 'machina-run'; host.style.cssText = 'position:fixed;left:0;top:0;';
  host.innerHTML = '<div class="machina-run-strip"><i class="on"></i><i class="here"></i><i></i></div>'; document.body.appendChild(host);
  r.setAttribute('data-machina2-room', ${J(room)});
  const cs = getComputedStyle(host.querySelector('i.here'), '::after');
  const out = { room: r.getAttribute('data-machina2-room'), look: r.getAttribute('data-machina2'), bg: cs.backgroundColor, shadow: cs.boxShadow, w: cs.width };
  if (was == null) r.removeAttribute('data-machina2-room'); else r.setAttribute('data-machina2-room', was);
  host.remove(); return out; })()`;
const CARET = `(() => { const r = document.documentElement; const was = r.getAttribute('data-page'); r.setAttribute('data-page', 'dark');
  const ed = document.querySelector('.forward-only-editor'); const out = { tone: r.getAttribute('data-page'), caret: ed ? getComputedStyle(ed).caretColor : null, inline: ed ? ed.style.caretColor : null };
  if (was == null) r.removeAttribute('data-page'); else r.setAttribute('data-page', was); return out; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null"); await sleep(800);
  // FIXTURE (Nov 20, before this file's first green; Actions 44828019693 read data-machina2 null on both checks): Machina is BOOTED from storage,
  // as machina-look.mjs's visits are, and the look's own mark is waited for before anything is read. No assertion changes.
  await app.evalJs("localStorage.setItem('wrizo-theme', 'machina'); null"); await app.reload();
  await app.waitFor("document.documentElement.getAttribute('data-theme') === 'machina' && document.documentElement.getAttribute('data-machina2') === 'true'", { label: "Machina's look on", timeout: 20000 }).catch(() => {});
  await sleep(600);

  const light = await app.evalJs(NOTCH('light'));
  const dark = await app.evalJs(NOTCH('dark'));
  const edged = (s) => !!s && s.includes(`${INK} -1px 0px 0px`) && s.includes(`${INK} 1px 0px 0px`);
  ok('U1 in the light room the Run\'s notch is brass with a 1 px #23272B edge on both sides; in the dark room, no edge',
    light.look === 'true' && light.room === 'light' && light.bg === BRASS && edged(light.shadow) && dark.room === 'dark' && dark.bg === BRASS && (dark.shadow === 'none' || !dark.shadow.includes(INK)), { light, dark });

  const run = fs.readFileSync(path.join(SRC, 'components', 'RunStrip.tsx'), 'utf8');
  ok('U2 (source) RunStrip draws the notch on the unit in progress (className \'here\'), so U1\'s rule meets the real strip', /i === here \? ' here' : ''/.test(run), {});

  const caret = {};
  for (const mode of ['drafting', 'journal']) {
    const pid = `mmust-${mode}`;
    await app.evalJs(`!!window.wrizoCreateJournalPage(${J({ id: pid, text: 'A line on the page.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${pid}', '${mode}'); location.hash = '#/page/${pid}'; null`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `the page (${mode})`, timeout: 15000 }).catch(() => {});
    await sleep(1200);
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null"); await sleep(200);
    caret[mode] = await app.evalJs(CARET);
  }
  ok('U3 on the dark page the editor\'s caret is brass (#FF9800) in Draft and in Free Write (whose pen ink reaches the caret inline)',
    ['drafting', 'journal'].every((m) => caret[m] && caret[m].tone === 'dark' && caret[m].caret === BRASS), caret);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 3;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nMACHINA-LOOK-MUSTS VERIFY: PASS (${checks.length} checks)`
  : `\nMACHINA-LOOK-MUSTS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
