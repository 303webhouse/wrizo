// TOOLS #10 ITEM 11 - THE WRITER'S OWN INSTALLED FONTS - THE DOM HALF (a box turn, after #9 ships; the logic and the OLD-code condition are installed-fonts.mjs's, browserless). On a real Draft Page, Arbor:
//   A1  "Add a font..." is in Draft's list (scoped) and NOT in Free Write's (Nick's Q2)
//   A2  typing an installed name (Arial) and pressing Enter adds it to the list and picks it: the page stores { name, generic, source: 'device' } and the key `wrizo-installed-fonts` is an array of names
//   A3  the page's text is set in it; a name that is NOT installed shows the quiet note in the list and the page renders in the THEME'S DEFAULT instead (no error, no blank)
// Run (repo root; needs a box turn):  node apps/desktop/scripts/harness/installed-fonts-dom.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';

const boot = async (app, mode) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','plateau');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'if-page', text: 'A first line to stand on.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(500);
  await app.evalJs(`window.wrizoPatchEntry && window.wrizoPatchEntry('if-page', { mode: '${mode}' })`).catch(() => {});
  await app.evalJs("location.hash = '#/page/if-page'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page', timeout: 12000 }).catch(() => {});
  await sleep(900);
};
const openDrawer = async (app) => { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(600); };
const rows = (app) => app.evalJs("[...document.querySelectorAll('.wz-sliver .wz-type-row')].map((r) => r.textContent)");

await withHarness(async (app) => {
  // Draft: the scoped form
  await boot(app, 'draft'); await openDrawer(app);
  await app.evalJs("document.querySelector('.wz-sliver .wz-type-face').click()"); await sleep(250);
  const draft = await app.evalJs("({ add: !!document.querySelector('.wz-sliver .wz-type-add'), addText: (document.querySelector('.wz-sliver .wz-type-add') || {}).textContent || null })");
  ok('A1 [Draft]: "Add a font..." is the last row of the scoped list', draft.add && /Add a font/.test(draft.addText || ''), JSON.stringify(draft));
  await app.evalJs("document.querySelector('.wz-sliver .wz-type-add').click()"); await sleep(200);
  await app.evalJs("(() => { const i = document.querySelector('.wz-sliver .wz-type-addinput'); i.focus(); })()");
  await app.cdp('Input.insertText', { text: 'Arial' }); await sleep(100);
  await app.key('Enter'); await sleep(700);
  const store = await app.evalJs("localStorage.getItem('wrizo-installed-fonts')");
  const picked = await app.evalJs(`(() => { const e = window.wrizoGetEntry ? window.wrizoGetEntry('if-page') : null; const ps = e && e.pageSettings; return ps ? ps.face : null; })()`);
  ok('A2 [Draft]: Enter adds "Arial" to this device\'s list (an array of names under wrizo-installed-fonts) and picks it - the page\'s face is { name, generic, source: "device" }', store === '["Arial"]' && !!picked && picked.name === 'Arial' && picked.source === 'device', JSON.stringify({ store, picked }));
  const fam = await app.evalJs(`getComputedStyle(document.querySelector('${ED}')).fontFamily`);
  ok('A3 [Draft]: the page is set in it (its stack names Arial first)', /^"?Arial"?/.test(fam), fam);
  // a name that is not installed here
  await app.evalJs("document.querySelector('.wz-sliver .wz-type-add').click()"); await sleep(200);
  await app.evalJs("document.querySelector('.wz-sliver .wz-type-addinput').focus()");
  await app.cdp('Input.insertText', { text: 'Zzqx Missing Face' }); await app.key('Enter'); await sleep(700);
  const miss = await app.evalJs(`(() => { const r = [...document.querySelectorAll('.wz-sliver .wz-type-row[data-device]')].find((x) => /Zzqx/.test(x.textContent)); const ed = document.querySelector('${ED}'); const probe = document.createElement('span'); probe.style.fontFamily = 'var(--font-prose)'; document.body.appendChild(probe); const themed = getComputedStyle(probe).fontFamily; probe.remove(); return { row: !!r, note: r ? (r.querySelector('.wz-type-note') || {}).textContent || null : null, family: getComputedStyle(ed).fontFamily, themed, blank: ed.getBoundingClientRect().height === 0 }; })()`);
  ok('A3 [Draft]: a name NOT installed here shows the quiet note in the list and the page renders in the theme\'s default - no error, no blank', miss.row && /not on this device/.test(miss.note || '') && /Zzqx/.test(miss.family) && miss.family.includes(miss.themed.split(',')[0]) && !miss.blank, JSON.stringify(miss));
  // Free Write: never
  await boot(app, 'freewrite');
  await app.evalJs("document.querySelector('.wz-type-face')?.click()"); await sleep(250);
  const fw = await app.evalJs("({ add: !!document.querySelector('.wz-type-add'), listed: [...document.querySelectorAll('.wz-type-row')].length })");
  ok('A1 [Free Write]: the face list has NO "Add a font..." row (Nick\'s Q2) - the roster and Default only', !fw.add && fw.listed >= 12, JSON.stringify(fw));
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 420)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nINSTALLED-FONTS-DOM VERIFY: PASS (${checks.length} checks)` : `\nINSTALLED-FONTS-DOM VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
