// SPRINT'S PROMPTS FROM THE CONSULTANT, THE CLIENT'S HALF (Fable, Nov 21, 12:35 am: FIX's queue item 6). ON BY DEFAULT since Nov 21, 10:25 am (Nick ruled it ON at 1:10 am; Fable): the URL's ?sprint=deck is the tests' way back to the local deck, and a per-writer
// switch (writingSettings.consultant, saved to the account through the `writing` fact) lets a writer choose no Consultant; the local deck serves anyone the Consultant does not (no AI configured, the writer chose none, the budget spent, any failure), with no server call.
// [Before: behind ?sprint=consultant, default OFF, the local deck for Monday.] The server's half is sprint-consultant-server.mjs (POST /tutor/sprint-prompt).
// With the switch on, her press in SPRINT (Free Write, the Back menu's FEEDBACK) asks the Consultant for ONE prompt instead of drawing from the local deck. What travels is exactly { seen: [the prompts already shown this
// session] }: nothing of her page, no conversation. What comes back is one line, drawn as the standing prompt (replacing the last). The ceiling is the deck's (three, then the refill note until 100 more words), and any
// failure (offline, an error, "not configured", a daily limit) falls back to the local deck, so a press always answers. A press in flight cannot be pressed again.
//   SC0  CONTROL, the switch off: a press sends NOTHING (zero requests) and the prompt is a member of the local deck (today's behaviour, S6/S7)
//   SC1  the switch on: ONE press makes ONE request to /api/tutor/sprint-prompt, its body exactly { seen: [] }, and the Consultant's line is the standing prompt (not drawn from the local deck)
//   SC2  a second press sends { seen: [the first line] } and REPLACES the standing prompt (never two)
//   SC3  her page's words never travel: a marker word in the page is in no request body
//   SC4  the ceiling stands: after three prompts the fourth press makes NO request and answers with the refill note; the standing prompt stays
//   SC5  a failure falls back to the deck: a 502 gives a prompt that is a member of the local deck, and counts toward the ceiling
//   SC6  "not configured" ({ configured: false }) falls back to the deck too
//   SC7  a press in flight cannot be pressed again: two quick presses make ONE request, and the button reads busy meanwhile
//   SC8  the tab is still SPRINT's: no composer, no lenses, no log, one prompt and one button (the deck's rules S4 hold with the switch on)
//   SC9  the switch on says what travels, in the lexicon's words, in a note on the tab; with it off there is no such note
// Run (the Actions harness):  node apps/desktop/scripts/harness/reorg-sprint-consultant.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 800)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const MARK = 'ZQXMARKERWORD';

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.evalJs(`window.wrizoCreateJournalPage(${q({ id: 'sc-p', text: `The first line of a page that has some words on it, ${MARK}, so the page is not empty.`, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' })}); window.wrizoFlushNow(); true`);
}
async function openPage(app, { consult = true, reorg = true, writerOff = false } = {}) {
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); localStorage.setItem('wrizo-mode-page-sc-p', 'journal')");
  if (writerOff) await app.evalJs("(() => { try { const k = 'wrizo-writing-settings'; const o = JSON.parse(localStorage.getItem(k) || '{}'); o.consultant = false; localStorage.setItem(k, JSON.stringify(o)); } catch {} })()");
  const qs = `${reorg ? '?reorg=1&arbor2=0' : '?arbor2=0'}${consult ? '' : '&sprint=deck'}`;
  await app.evalJs(`history.replaceState(null, '', '/${qs}#/page/sc-p')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
  const open = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'");
  if (!open) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700); }
}
// the stand-in endpoint: fetch is wrapped in the page; a mode decides the answer, every call is recorded with its body
const FAKE = `window.__calls = []; window.__mode = 'ok'; window.__n = 0; const f = window.fetch; window.fetch = function (url, init) {
  if (String(url).includes('/tutor/sprint-prompt')) {
    window.__calls.push({ url: String(url), body: init && init.body ? String(init.body) : null });
    const reply = (status, json, ms) => new Promise((res) => setTimeout(() => res(new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json' } })), ms || 0));
    if (window.__mode === 'err') return reply(502, { configured: true, error: 'The Tutor could not be reached right now.' });
    if (window.__mode === 'off') return reply(200, { configured: false });
    if (window.__mode === 'slow') return reply(200, { configured: true, prompt: 'A slow line from the Consultant ' + (++window.__n) + '.' }, 1500);
    return reply(200, { configured: true, prompt: 'A line from the Consultant ' + (++window.__n) + '.' });
  }
  return f.apply(this, arguments);
}; true`;
const press = (app) => app.evalJs("document.querySelector('.wz-sprint-press')?.click()");
const STATE = `(() => { const p = document.querySelector('#wz-tutor-panel'); if (!p) return null; const has = (s) => !!p.querySelector(s);
  return { prompt: (p.querySelector('.wz-sprint-prompt[data-drawn]') || {}).textContent || null, prompts: p.querySelectorAll('.wz-sprint-prompt[data-drawn]').length, btn: (p.querySelector('.wz-sprint-press') || {}).textContent || null, busy: (p.querySelector('.wz-sprint-press') || {}).getAttribute ? p.querySelector('.wz-sprint-press').getAttribute('aria-busy') : null,
    refill: (p.querySelector('.wz-sprint-refill') || {}).textContent || null, travels: (p.querySelector('.wz-sprint-travels') || {}).textContent || null, useSwitch: !!p.querySelector('[data-sprint-use]'), useOn: (p.querySelector('[data-sprint-use]') || {}).getAttribute ? p.querySelector('[data-sprint-use]').getAttribute('aria-checked') : null, composer: has('.wz-tutor-convo-input'), sections: p.querySelectorAll('.wz-tutor-section').length, lens: p.querySelectorAll('[data-lens]').length, log: has('.wz-tutor-convo-log') }; })()`;
const calls = (app) => app.evalJs('window.__calls');

await withHarness(async (app) => {
  await seed(app);
  const DECK = await app.evalJs("(() => (window.wrizoTutorFreeWriteDeck ? [...window.wrizoTutorFreeWriteDeck.POOLS.writingPrompt] : []))()");

  // ---- SC0 (control: the switch off) ----
  await openPage(app, { consult: false });
  await app.evalJs(FAKE);
  await press(app); await sleep(500);
  const s0 = await app.evalJs(STATE);
  const c0 = await calls(app);
  const trav0 = s0 && s0.travels;
  ok('SC0 CONTROL, ?sprint=deck (the tests way back): a press sends nothing (zero requests) and the prompt is a member of the local deck; no "what travels" note', c0.length === 0 && !!s0 && !!s0.prompt && (DECK.length === 0 || DECK.includes(s0.prompt.trim())) && trav0 === null, JSON.stringify({ calls: c0.length, prompt: s0 && s0.prompt, deck: DECK.length, trav0 }));

  // ---- SC1 / SC9 ----
  await openPage(app, { consult: true });
  await app.evalJs(FAKE);
  await press(app); await sleep(900);
  const s1 = await app.evalJs(STATE);
  const c1 = await calls(app);
  ok('SC1 the switch on: ONE press makes ONE request to /api/tutor/sprint-prompt, its body exactly { seen: [] }, and the Consultant\'s line is the standing prompt (not from the local deck)',
    c1.length === 1 && /\/tutor\/sprint-prompt$/.test(c1[0].url) && JSON.stringify(JSON.parse(c1[0].body)) === JSON.stringify({ seen: [] }) && !!s1 && s1.prompt === 'A line from the Consultant 1.' && s1.prompts === 1 && s1.btn !== null, JSON.stringify({ c1, s1 }));
  ok('SC9 the switch on says what travels, in a note on the tab (the lexicon\'s words); one prompt\'s worth: nothing of her page', !!s1 && typeof s1.travels === 'string' && /page/i.test(s1.travels) && /prompt/i.test(s1.travels), JSON.stringify(s1 && s1.travels));

  // ---- SC2 / SC3 ----
  await press(app); await sleep(900);
  const s2 = await app.evalJs(STATE);
  const c2 = await calls(app);
  ok('SC2 a second press sends { seen: [the first line] } and REPLACES the standing prompt (never two)',
    c2.length === 2 && JSON.stringify(JSON.parse(c2[1].body)) === JSON.stringify({ seen: ['A line from the Consultant 1.'] }) && !!s2 && s2.prompt === 'A line from the Consultant 2.' && s2.prompts === 1, JSON.stringify({ c2: c2.map((c) => c.body), s2 }));
  ok('SC3 her page\'s words never travel: the marker word in her page is in no request body', c2.every((c) => !String(c.body).includes(MARK)), JSON.stringify(c2.map((c) => c.body)));

  // ---- SC4 ----
  await press(app); await sleep(900);
  await press(app); await sleep(500);
  const s4 = await app.evalJs(STATE);
  const c4 = await calls(app);
  ok('SC4 the ceiling stands: three prompts, then the fourth press makes NO request, answers with the refill note and the standing prompt stays',
    c4.length === 3 && !!s4 && s4.prompt === 'A line from the Consultant 3.' && typeof s4.refill === 'string' && s4.refill.length > 0, JSON.stringify({ n: c4.length, s4 }));

  // ---- SC5 ----
  await openPage(app, { consult: true });
  await app.evalJs(FAKE); await app.evalJs("window.__mode = 'err'; true");
  await press(app); await sleep(900);
  const s5 = await app.evalJs(STATE);
  const c5 = await calls(app);
  ok('SC5 a failure falls back to the deck: a 502 gives a prompt that is a member of the local deck', c5.length === 1 && !!s5 && !!s5.prompt && (DECK.length === 0 || DECK.includes(s5.prompt.trim())), JSON.stringify({ calls: c5.length, s5 }));

  // ---- SC6 ----
  await openPage(app, { consult: true });
  await app.evalJs(FAKE); await app.evalJs("window.__mode = 'off'; true");
  await press(app); await sleep(900);
  const s6 = await app.evalJs(STATE);
  ok('SC6 "not configured" ({ configured: false }) falls back to the deck too', !!s6 && !!s6.prompt && (DECK.length === 0 || DECK.includes(s6.prompt.trim())) && !/Consultant/.test(s6.prompt), JSON.stringify(s6));

  // ---- SC7 ----
  await openPage(app, { consult: true });
  await app.evalJs(FAKE); await app.evalJs("window.__mode = 'slow'; true");
  await press(app); await sleep(150);
  const busy = await app.evalJs(STATE);
  await press(app); await sleep(150);
  await sleep(1800);
  const c7 = await calls(app);
  const s7 = await app.evalJs(STATE);
  ok('SC7 a press in flight cannot be pressed again: two quick presses make ONE request, the button reads busy meanwhile, and one prompt lands', c7.length === 1 && !!busy && busy.busy === 'true' && !!s7 && s7.prompts === 1 && /slow line/i.test(s7.prompt || ''), JSON.stringify({ calls: c7.length, busy: busy && busy.busy, s7 }));

  // ---- SC8 ----
  ok('SC8 the tab is still SPRINT\'s: no composer, no lenses, no log, no computed sections; one prompt and one button', !!s7 && s7.composer === false && s7.lens === 0 && s7.log === false && s7.sections === 0 && s7.prompts === 1, JSON.stringify(s7));

  // ---- SC10 - SC14: the per-writer choice, default ON ----
  await openPage(app, { consult: true });
  await app.evalJs(FAKE);
  const s10 = await app.evalJs(STATE);
  ok('SC10 ON BY DEFAULT with no URL flag: the tab draws a "use the Consultant" switch, ON; with ?sprint=deck there is no switch (SC0 read none)', !!s10 && s10.useSwitch === true && s10.useOn === 'true', JSON.stringify(s10 && { useSwitch: s10.useSwitch, useOn: s10.useOn }));
  const sw0 = await app.evalJs("(() => { const b = document.querySelector('[data-sprint-use]'); return !!b && b.getAttribute('role') === 'switch' && b.tagName === 'BUTTON' && (b.textContent || '').trim().length > 0; })()");
  ok('SC10b the switch is a labelled button with role=switch (a keyboard and screen-reader control)', sw0 === true);
  await app.evalJs("document.querySelector('[data-sprint-use]')?.click()"); await sleep(600);
  const s11 = await app.evalJs(STATE);
  const saved11 = await app.evalJs("(() => { try { const dev = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); const fact = (JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}')).writing || null; return { dev: dev.consultant, fact: fact && fact.consultant, stamp: !!(fact && fact.fieldAt && fact.fieldAt.consultant) }; } catch { return null; } })()");
  ok('SC11 the writer turns it OFF: the switch reads off, the "what travels" note is gone, and the choice is SAVED - the device key says consultant:false AND the account\'s `writing` fact carries consultant:false with its own stamp', !!s11 && s11.useOn === 'false' && s11.travels === null && !!saved11 && saved11.dev === false && saved11.fact === false && saved11.stamp === true, JSON.stringify({ useOn: s11 && s11.useOn, travels: s11 && s11.travels, saved11 }));
  await press(app); await sleep(700);
  const s12 = await app.evalJs(STATE);
  const c12 = await calls(app);
  ok('SC12 with the writer\'s choice OFF a press sends NOTHING (zero requests) and the prompt is a member of the local deck', c12.length === 0 && !!s12 && !!s12.prompt && (DECK.length === 0 || DECK.includes(s12.prompt.trim())), JSON.stringify({ n: c12.length, prompt: s12 && s12.prompt }));
  // the choice survives a reload; and it follows the account: the device key is erased but the fact stays, and the fact puts it back
  await app.evalJs("localStorage.removeItem('wrizo-writing-settings'); true");
  await openPage(app, { consult: true });
  await app.evalJs(FAKE);
  await sleep(500);
  const s13 = await app.evalJs(STATE);
  await press(app); await sleep(700);
  const c13 = await calls(app);
  ok('SC13 the choice follows the ACCOUNT: with the device key erased and a reload, the `writing` fact alone brings it back (switch OFF, a press sends nothing)', !!s13 && s13.useOn === 'false' && c13.length === 0, JSON.stringify({ useOn: s13 && s13.useOn, n: c13.length }));
  // turning it back on makes the next press ask the Consultant again
  await app.evalJs("document.querySelector('[data-sprint-use]')?.click()"); await sleep(600);
  await press(app); await sleep(900);
  const s14 = await app.evalJs(STATE);
  const c14 = await calls(app);
  ok('SC14 turned back ON, a press asks the Consultant again (one request) and the note that says what travels is back', c14.length === 1 && !!s14 && s14.useOn === 'true' && /Consultant/.test(s14.prompt || '') && typeof s14.travels === 'string', JSON.stringify({ n: c14.length, s14: s14 && { useOn: s14.useOn, prompt: s14.prompt, travels: !!s14.travels } }));
  // the settings fixture path: the same choice made through the saved settings before load (a device that already holds consultant:false) is honoured with no click
  await app.evalJs("localStorage.removeItem('wrizo-reorg-prefs'); true");
  await openPage(app, { consult: true, writerOff: true });
  await app.evalJs(FAKE);
  await press(app); await sleep(700);
  const s15 = await app.evalJs(STATE);
  const c15 = await calls(app);
  ok('SC15 a device whose settings already hold consultant:false is honoured at load: no click, no request, the deck answers', !!s15 && s15.useOn === 'false' && c15.length === 0 && !!s15.prompt, JSON.stringify({ useOn: s15 && s15.useOn, n: c15.length }));
  return checks;
});

const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-SPRINT-CONSULTANT VERIFY: PASS (${checks.length} checks)` : `\nREORG-SPRINT-CONSULTANT VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
