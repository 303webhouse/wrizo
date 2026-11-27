// PROBE for #117 (never a check): how a seeded page is left so that the return chip appears. Prints what the page holds at each step.
import { withHarness } from '../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ID = 'rp117-page';
const LINES = Array.from({ length: 45 }, (_, i) => `Line ${i} of the growing manuscript page, long enough to wrap and force real scroll.`).join(String.fromCharCode(10));
await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const say = async (label) => console.log('PROBE ' + label + ' ' + JSON.stringify(await ev(`(() => ({ hash: location.hash, chip: !!document.querySelector('.desk-rail-wayback'), wb: sessionStorage.getItem('wrizo-way-back'), editor: !!document.querySelector('.forward-only-editor'), board: !!document.querySelector('.board-canvas'), rail: [...document.querySelectorAll('.desk-rail button, .desk-rail a')].map((b) => (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 14)).slice(0, 14) }))()`)));
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID, text: LINES, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); location.hash = '#/page/${ID}'; true`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' });
  await sleep(900);
  await say('on the page');
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); ed.focus(); return true; })()");
  await sleep(300);
  await say('focused');
  let clicked = null;
  try { clicked = await app.click('Journal'); } catch (e) { clicked = 'ERR ' + String(e.message).slice(0, 120); }
  await sleep(1200);
  console.log('PROBE click Journal ->', JSON.stringify(clicked));
  await say('after rail click');
  await ev("location.hash = '#/journal'; true");
  await sleep(1500);
  await say('after hash to journal');
});
// #141 pass (Nov 26): the pair needs a verdict line from every file. This is still a probe, not a check: it prints, and its one claim is that it ran to its end (a throw above exits non-zero before this).
if (process.env.HARNESS_PARKED === '1') console.log('\nRETURN-CARET-PROBE PARKED: PASS (0 records) - a probe; it parks nothing');
console.log('\nRETURN-CARET-PROBE VERIFY: PASS (1 checks) - a probe: it ran to its end');
