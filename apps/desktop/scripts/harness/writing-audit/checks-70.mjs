// CHECKS for #70: the guard character (a zero-width space the Free Write page now draws after a trailing newline) must NEVER reach (1) the page's SAVED text, (2) the word count she reads, (3) a clipboard copy.
// Free Write, Enter at the end of "Hello world" (and then a letter): after each step the saved page text, the count readout and the copied text (select all, copy) are read; none may hold the character (U+200B), and the saved and copied
// text must be exactly what she wrote. A control proves the reader can fail. Prints READOUT lines (the count row's own words) so the run on main and on the fix can be compared line by line.
// Run: node scripts/harness/writing-audit/checks-70.mjs (from apps/desktop; on Actions via writing-audit.yml, script=checks-70.mjs; strict: any failure exits 1)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const ZW = String.fromCharCode(8203);
const NL = String.fromCharCode(10);
const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
let bad = 0;
const verdict = (ok, line) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${line}`); if (!ok) bad++; };

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`CHECKS-70 [${TAG}] (${new Date().toISOString()})`);
  await d.boot();
  const ev = d.ev;
  const stored = (id) => ev(`(() => { try { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const r = rows.find((x) => x.id === ${JSON.stringify(id)}); return r ? r.text : null; } catch (e) { return 'ERR ' + e.message; } })()`);
  // the page saves a moment after the last change: look until the saved text is what it should be (or 14 s), so a slow save is not read as a wrong one
  const savedBecomes = async (id, want) => { const t0 = Date.now(); let v = await stored(id); while (v !== want && Date.now() - t0 < 14000) { await sleep(400); v = await stored(id); } return v; };
  const readout = () => ev(`(() => { const q = document.querySelector('.mode-pmeta, .machina-run, .flux-readout-head'); return q ? q.textContent.trim() : null; })()`);
  const hasGuardInDom = () => ev(`!!document.querySelector('.md-eof-guard')`);
  const copyAll = async () => {
    await ev(`(() => { window.__copied = null; if (!window.__copyHook) { window.__copyHook = true; document.addEventListener('copy', (e) => { try { window.__copied = { plain: e.clipboardData.getData('text/plain'), html: e.clipboardData.getData('text/html') }; } catch (x) { window.__copied = { error: String(x) }; } }); } return true; })()`);
    await d.key('a', { ctrl: true }); await sleep(150);
    await d.key('c', { ctrl: true }); await sleep(300);
    return ev('window.__copied');
  };
  const holds = (s) => typeof s === 'string' && s.includes(ZW);
  // control: the test can fail
  verdict(holds('abc' + ZW) && !holds('abc'), 'control: the guard test sees the character when it is there and not when it is not');

  const id = await d.openFreeWrite('Hello world');
  await d.place(11); await sleep(300);
  console.log(`READOUT ${TAG} start ${JSON.stringify(await readout())}`);

  await d.key('Enter'); await d.frames(); await sleep(1800);
  console.log(`NOTE ${TAG} after Enter: guard in the page's DOM = ${await hasGuardInDom()}`);
  const s1 = await savedBecomes(id, 'Hello world' + NL), r1 = await readout(), c1 = await copyAll();
  console.log(`READOUT ${TAG} after-Enter ${JSON.stringify(r1)}`);
  verdict(typeof s1 === 'string' && !holds(s1) && s1 === 'Hello world' + NL, `(1) saved text after Enter is exactly "Hello world" + newline, no guard: ${JSON.stringify(s1)}`);
  verdict(typeof r1 === 'string' && !holds(r1), `(2) the count readout after Enter holds no guard: ${JSON.stringify(r1)}`);
  verdict(!!c1 && !c1.error && !holds(c1.plain) && !holds(c1.html) && c1.plain === 'Hello world' + NL, `(3) copied text after Enter is exactly "Hello world" + newline, no guard in plain or html: ${JSON.stringify(c1)}`);

  // back to the end (select all moved the selection), then a letter
  await d.key('End', { ctrl: true }); await sleep(200);
  await d.type('x'); await d.frames(); await sleep(1800);
  console.log(`NOTE ${TAG} after the letter: guard in the page's DOM = ${await hasGuardInDom()}`);
  const s2 = await savedBecomes(id, 'Hello world' + NL + 'x'), r2 = await readout(), c2 = await copyAll();
  console.log(`READOUT ${TAG} after-letter ${JSON.stringify(r2)}`);
  verdict(typeof s2 === 'string' && !holds(s2) && s2 === 'Hello world' + NL + 'x', `(1) saved text after the next letter is exactly "Hello world", newline, x, no guard: ${JSON.stringify(s2)}`);
  verdict(typeof r2 === 'string' && !holds(r2), `(2) the count readout after the letter holds no guard: ${JSON.stringify(r2)}`);
  verdict(!!c2 && !c2.error && !holds(c2.plain) && !holds(c2.html) && c2.plain === 'Hello world' + NL + 'x', `(3) copied text after the letter is exactly "Hello world", newline, x: ${JSON.stringify(c2)}`);
});
console.log(`CHECKS-70 [${TAG}] ${bad ? `FAIL - ${bad}` : 'PASS'}`);
process.exit(bad ? 1 : 0);
