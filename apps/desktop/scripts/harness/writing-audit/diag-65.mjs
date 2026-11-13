// DIAGNOSTIC for #65 (not a check): why the Up handler stood aside. After one ArrowUp from the start of a short paragraph under a wrapped one, print the handler's own record (the number of the guard that returned, the focus node it saw).
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';
const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
const NL = String.fromCharCode(10);
const WORDS = 'the quick brown fox jumps over the lazy dog and keeps running through the long grass until the evening comes down';
const p = Array.from({ length: 3 }, () => WORDS).join(' ');
await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  for (const [name, at] of [['row-start', p.length + 1], ['mid-row', p.length + 1 + 8]]) {
    await d.surface('.forward-only-editor', false);
    await d.openPage(p + NL + 'Short paragraph here.', 'drafting', { typewriter: 'off' });
    await d.place(at); await sleep(300);
    const sel = await d.ev(`(() => { const s = getSelection(); const n = s.focusNode; return { node: n ? n.nodeName + ':' + (n.nodeType === 3 ? JSON.stringify(n.data.slice(0, 14)) : n.className) : null, off: s.focusOffset, parent: n && n.parentElement ? n.parentElement.className : null }; })()`);
    await d.ev('window.__up65 = null');
    await d.key('ArrowUp'); await sleep(350);
    console.log(`DIAG65 ${name}: selection before ${JSON.stringify(sel)}; handler record ${JSON.stringify(await d.ev('window.__up65'))}`);
  }
});
process.exit(0);
