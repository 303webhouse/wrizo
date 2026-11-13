// RED-FIRST CHECK for #74 (undo puts the caret at the END of the page, not where the edit was): on the Draft page, an edit in the MIDDLE of a line, then undo, then redo; where the caret is after each.
//   A  Enter after "Hello" in "Hello world": undo gives "Hello world" with the caret at 5 (where the Enter was); redo gives "Hello\n world" with the caret at 6 (after the new line break)
//   B  a letter typed after "Hello": undo gives the caret at 5; redo gives the caret at 6 (after the letter)
//   C  Backspace after "Hello": the text loses the "o"; undo brings it back with the caret at 5 (after it); redo has the caret at 4
//   D  Enter at the END of "Hello" (a control: the caret was already at the end, so main already gets this right): undo 5, redo 6
//   E  a letter typed at the very START of "abc" after the caret was moved there: undo puts the caret at 0
//   F, G  the same undo inside a BOARD CARD's pop-up (it shares the stack): F a letter typed after "Hello", G Backspace after "Hello"; undo puts the caret at 5
// RED on main today for A, B, C, E, F and G (the caret jumps to the end of the page: the undo step remembers the caret of the PREVIOUS edit, not of this one). D stays green.
// Run: node scripts/harness/writing-audit/reds-74.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-74.mjs; strict)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const only = env.WA_ONLY ? new Set(env.WA_ONLY.split(',').map((s) => s.trim())) : null;
let bad = 0;

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`RED-74 [${TAG}] (${new Date().toISOString()})`);
  await d.boot();
  const ctrl = (k, o = {}) => d.key(k, { ctrl: true, ...o });
  const undo = () => ctrl('z'), redo = () => ctrl('z', { shift: true });
  const open = async (text, at) => { await d.surface('.forward-only-editor', false); await d.openPage(text, 'drafting', { typewriter: 'off' }); await d.place(at); await sleep(250); };
  const settle = async () => { await d.frames(); await sleep(300); return d.read(); };
  const NL = String.fromCharCode(10);
  const run = async (id, name, fn) => {
    if (only && !only.has(id)) return;
    const fails = [];
    try { await fn(fails); } catch (e) { fails.push('harness: ' + String((e && e.message) || e).slice(0, 200)); }
    if (fails.length) bad++;
    console.log(`${fails.length ? 'FAIL' : 'PASS'}  ${id} ${name} [${TAG}]${fails.length ? ': ' + fails.join(' || ') : ''}`);
  };
  const expect = (fails, label, r, text, caret) => {
    if (r.text !== text) fails.push(`${label}: the page holds ${JSON.stringify(r.text)}, want ${JSON.stringify(text)}`);
    if (r.focus !== caret || r.anchor !== caret) fails.push(`${label}: the caret is at ${r.anchor}..${r.focus}, want ${caret}`);
  };

  await run('A', 'Enter in the middle of a line, undo, redo', async (fails) => {
    await open('Hello world', 5); await d.key('Enter'); expect(fails, 'staging', await settle(), 'Hello' + NL + ' world', 6);
    await undo(); expect(fails, 'after undo', await settle(), 'Hello world', 5);
    await redo(); expect(fails, 'after redo', await settle(), 'Hello' + NL + ' world', 6);
  });
  await run('B', 'a letter typed in the middle of a line, undo, redo', async (fails) => {
    await open('Hello world', 5); await d.type('X'); expect(fails, 'staging', await settle(), 'HelloX world', 6);
    await undo(); expect(fails, 'after undo', await settle(), 'Hello world', 5);
    await redo(); expect(fails, 'after redo', await settle(), 'HelloX world', 6);
  });
  await run('C', 'Backspace in the middle of a line, undo, redo', async (fails) => {
    await open('Hello world', 5); await d.key('Backspace'); expect(fails, 'staging', await settle(), 'Hell world', 4);
    await undo(); expect(fails, 'after undo', await settle(), 'Hello world', 5);
    await redo(); expect(fails, 'after redo', await settle(), 'Hell world', 4);
  });
  await run('D', 'Enter at the end of the page, undo, redo (control)', async (fails) => {
    await open('Hello', 5); await d.key('Enter'); expect(fails, 'staging', await settle(), 'Hello' + NL, 6);
    await undo(); expect(fails, 'after undo', await settle(), 'Hello', 5);
    await redo(); expect(fails, 'after redo', await settle(), 'Hello' + NL, 6);
  });
  await run('E', 'a letter at the very start, undo', async (fails) => {
    await open('abc', 3); await d.place(0); await sleep(200); await d.type('X'); expect(fails, 'staging', await settle(), 'Xabc', 1);
    await undo(); expect(fails, 'after undo', await settle(), 'abc', 0);
  });
  const openC = async (text, at) => { await d.openCard(text); await d.place(at); await sleep(250); };
  await run('F', 'a card pop-up: a letter typed in the middle, undo, redo', async (fails) => {
    await openC('Hello world', 5); await d.type('X'); expect(fails, 'staging', await settle(), 'HelloX world', 6);
    await undo(); expect(fails, 'after undo', await settle(), 'Hello world', 5);
    await redo(); expect(fails, 'after redo', await settle(), 'HelloX world', 6);
  });
  await run('G', 'a card pop-up: Backspace in the middle, undo, redo', async (fails) => {
    await openC('Hello world', 5); await d.key('Backspace'); expect(fails, 'staging', await settle(), 'Hell world', 4);
    await undo(); expect(fails, 'after undo', await settle(), 'Hello world', 5);
    await redo(); expect(fails, 'after redo', await settle(), 'Hell world', 4);
  });
});
console.log(`RED-74 [${TAG}] ${bad ? `FAIL - ${bad} case(s)` : 'PASS'}`);
process.exit(bad ? 1 : 0);
