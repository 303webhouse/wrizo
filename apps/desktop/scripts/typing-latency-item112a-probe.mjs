// TYPING-LATENCY - THE item112a S2/§3 PROBE (Fable, Oct 15: "item112a S2/§3 fails on the branch only ... Find what differs").
// item112a types `Alpha beta gamma.`, a Backspace, then ` **bold** done` into a Revise page, and expects the text to hold `**bold**`.
// On the typing-latency branch the text came back `Alpha beta gamma **bold done**`: the closing marks moved past "done". That is the
// 211 rules' own reabsorb (a space typed at a styled run's END goes outside its closing marks and the next letter takes them back in) -
// which happens only when the caret sits BEFORE the closing marks when the space is typed. So the question is where the caret is after
// the closing `**`, on main and on the branch, and whether that depends on timing.
// This records, after every key: the stored text, the caret's plain offset, and the caret's DOM point (its node, offset, and whether it
// is inside a hidden mark or a row). Twice: at the harness's own speed (item112a's typeKeys, exactly), and one key every 300 ms (a
// writer's pace). Run it on main and on the branch; it asserts nothing - it prints both, side by side.
// Run: node apps/desktop/scripts/typing-latency-item112a-probe.mjs   (dist-web built, box turn granted)
import { withHarness } from './runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';

const freshRevise = async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* recorded below */ }
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(300);
  await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"revise\"]')?.click()");
  await sleep(450);
  await app.evalJs(`document.querySelector('${ED}')?.focus()`);
  await app.typeKeys('Alpha beta gamma.');
  await sleep(350);
  await app.key('Backspace');
  await sleep(300);
};

const snap = (app, label) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const s = getSelection();
  const text = ed.textContent.split('\\u200b').join('');
  let off = null, where = null;
  if (s.rangeCount && ed.contains(s.anchorNode)) {
    const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.anchorNode, s.anchorOffset); off = r.toString().split('\\u200b').join('').length;
    const n = s.anchorNode; const pe = n.nodeType === 1 ? n : n.parentElement;
    where = { nodeType: n.nodeType, data: n.nodeType === 3 ? JSON.stringify(n.data) : null, offset: s.anchorOffset,
      inHiddenMark: !!(pe && pe.closest('.md-mark-hidden')), inRow: !!(pe && pe.closest('.wz-row')), parentClass: pe ? pe.className : null };
  }
  return { label: ${JSON.stringify(label)}, text, caret: off, where }; })()`);

await withHarness(async (app) => {
  const out = {};
  // 1. item112a's own typing, exactly: one typeKeys call for the whole run, a read after it - plus reads between the two halves
  await freshRevise(app);
  const fast = [];
  await app.typeKeys(' **bold**');
  fast.push(await snap(app, 'after " **bold**" (harness speed, no wait)'));
  await sleep(300);
  fast.push(await snap(app, '...and 300 ms later (any selectionchange has run)'));
  await app.typeKeys(' done');
  await sleep(350);
  fast.push(await snap(app, 'after " done"'));
  out.harnessSpeed = fast;
  // 1b. the exact item112a sequence in ONE call (what the check itself does)
  await freshRevise(app);
  await app.typeKeys(' **bold** done');
  await sleep(350);
  out.item112aExact = await snap(app, 'item112a exact: one typeKeys(" **bold** done")');
  // 2. a writer's pace: one key every 300 ms, a read after each
  await freshRevise(app);
  const slow = [];
  for (const ch of ' **bold** done') { await app.typeKeys(ch); await sleep(300); slow.push(await snap(app, `after ${JSON.stringify(ch)}`)); }
  out.writersPace = slow;
  console.log(JSON.stringify(out, null, 2));
  console.log(`\nITEM112A-PROBE: harness-speed text ${JSON.stringify(fast[fast.length - 1].text)} | exact ${JSON.stringify(out.item112aExact.text)} | writer's pace ${JSON.stringify(slow[slow.length - 1].text)}`);
});
