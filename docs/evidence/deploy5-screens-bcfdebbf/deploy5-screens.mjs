// DEPLOY-5 SCREENS (chat 1, Oct 23): the frames Fable asked for on the batch tree that flux-screens.mjs does not take - the theme picker OPEN in Arbor and in Flux, and the writing surface's
// mode tabs (Workshop must be ABSENT) in Arbor and Flux. A capture: frames out, plus the tab labels read from the DOM (a frame can hide a word; the DOM cannot).
// Run: node scripts/harness/deploy5-screens.mjs <outDir>      (box turn; frames are PNG - the caller converts to JPEG q80 <= 1400 px before committing, only frames it has LOOKED at)
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2];
if (!out) { console.error('usage: deploy5-screens.mjs <outDir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');
await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const shot = async (name) => { fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  for (const theme of ['arbor', 'flux']) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(700);
    await q(`window.wrizoTheme && window.wrizoTheme.set('${theme}')`);
    await sleep(600);
    await q("document.querySelector('.wz-arrival-write')?.click()");
    const editor = await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'editor', timeout: 8000 });
    await sleep(1200);
    ok(`[${theme}] the writing surface is up`, editor, String(editor));
    // the mode tabs: every tab-ish control that carries a mode word
    const tabs = await q(`(() => [...document.querySelectorAll('.desk-mode-tab, [role="tab"], .mode-seg button, .mode-switcher button, [class*="mode-switch"] button')].map((b) => (b.textContent || '').trim()).filter(Boolean))()`);
    const bodyHasWorkshop = await q("/workshop|relay/i.test(document.querySelector('.mode-page, .forward-only-editor')?.closest('body')?.innerText.split('\\n').filter((l) => l.length < 40).join('|') || '')");
    console.log(`[${theme}] mode-tab labels: ${JSON.stringify(tabs)}  workshop/relay word on screen: ${bodyHasWorkshop}`);
    ok(`[${theme}] mode controls were found (so an absent Workshop is a reading, not a miss)`, Array.isArray(tabs) && tabs.length > 0, JSON.stringify(tabs));
    ok(`[${theme}] no mode control reads Workshop (or Flux's Relay)`, Array.isArray(tabs) && !tabs.some((t) => /workshop|relay/i.test(t)), JSON.stringify(tabs));
    await shot(`mode-strip-${theme}`);
    // the theme picker, open
    await q("document.querySelector('[data-category=\"theme\"]')?.click()");
    const picker = await waitSoft("!!document.querySelector('.wz-theme-cards')", { label: 'picker', timeout: 6000 });
    await sleep(900);
    ok(`[${theme}] the theme picker is open`, picker, String(picker));
    const cards = await q("[...document.querySelectorAll('.wz-theme-card')].map((c) => (c.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40))");
    console.log(`[${theme}] picker cards: ${JSON.stringify(cards)}`);
    await shot(`theme-picker-${theme}`);
  }
});
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nDEPLOY5-SCREENS: FAIL - ${failed.length}/${checks.length}` : `\nDEPLOY5-SCREENS: PASS (${checks.length} surfaces shown; frames in ${out})`);
process.exit(failed.length ? 1 : 0);
