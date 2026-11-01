// CARET RESET (bug-list #33, ledger 168) - the caret jumps to the END of the text ~0.2 s after a keystroke, so a Ctrl+Home or a click made right after typing is undone.
// RED-FIRST: this runs on main and must FAIL there. Each scenario types a few characters on a page, then - after a PAUSE of 50 / 150 / 300 / 600 ms - makes the writer's own move
// with a TRUSTED input (CDP: a Ctrl+Home key with its editing command, or a mouse press+release on a word) and watches the caret for 2.8 s:
//   - the move must TAKE (the caret is off the end 40 ms after it - the premise), and
//   - the caret must STAY where the writer put it (the same character offset at 2.8 s, and never back at the end).
// Every Selection write the page makes is logged with its time and the top of its stack, so a red names its own cause.
// Run: node scripts/harness/caret-reset.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const LINES = Array.from({ length: 12 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the page the writer is in.`).join('\n');
const rec = [];
const ok = (name, pass, detail) => rec.push({ name, pass: !!pass, detail });

const PAUSES = (process.env.CR_PAUSES || '50,150,300,600').split(',').map(Number);   // CR_PAUSES / CR_MOVES narrow a diagnostic run
const MOVES = {
  ctrlHome: { label: 'Ctrl+Home' },
  click: { label: 'a click on a word of the page' },
};

await withHarness(async (app) => {
  const offset = `(() => { const ed = document.querySelector('${ED}'); const s = getSelection(); if (!s.rangeCount || !ed.contains(s.anchorNode)) return null; const r = document.createRange();
    r.selectNodeContents(ed); r.setEnd(s.anchorNode, s.anchorOffset); return { at: r.toString().length, of: ed.innerText.length }; })()`;
  // a character of the page that is ON SCREEN and a few characters (8) back from the end of the text, in the last long-enough text node - the typewriter scrolls the
  // older lines away, but the line being written is always in view; a click there is a real move of the caret (8 characters, past the premise's 5)
  const wordXY = `(() => { const ed = document.querySelector('${ED}'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n; let pick = null;
    while ((n = w.nextNode())) { if (n.nodeValue.length >= 10) pick = n; }
    if (!pick) return null; const k = pick.nodeValue.length - 8; const r = document.createRange(); r.setStart(pick, k); r.setEnd(pick, k + 1); const b = r.getBoundingClientRect();
    return b.width > 0 && b.top > 0 && b.bottom < window.innerHeight ? { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) } : null; })()`;

  const fresh = async () => {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 15000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'crf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(400);
    await app.evalJs("location.hash = '#/page/crf'");
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
    await sleep(800);
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
    // log every Selection write the page makes (time, method, the top of the stack)
    await app.evalJs(`(() => { window.__selw = []; window.__selT0 = performance.now(); const P = Selection.prototype;
      for (const m of ['addRange', 'removeAllRanges', 'collapse', 'setBaseAndExtent', 'setPosition', 'extend', 'selectAllChildren', 'removeRange', 'collapseToStart', 'collapseToEnd']) {
        const o = P[m]; P[m] = function (...a) { window.__selw.push([Math.round(performance.now() - window.__selT0), m, String(new Error().stack).split('\\n').slice(2, 12).map((l) => l.trim().replace(/https?:[^ ]*\\//, '')).join(' < ')]); return o.apply(this, a); }; }
      return true; })()`);
  };

  for (const [mid, mv] of Object.entries(MOVES).filter(([k]) => !process.env.CR_MOVES || process.env.CR_MOVES.split(',').includes(k))) {
    for (const pause of PAUSES) {
      await fresh();
      await app.typeKeys('and so it goes');
      const tTyped = await app.evalJs('Math.round(performance.now() - window.__selT0)');
      await sleep(pause);
      let clickAt = { x: 0, y: 0 };
      const tMove = await app.evalJs('Math.round(performance.now() - window.__selT0)');
      if (mid === 'ctrlHome') {
        const p = { key: 'Home', code: 'Home', windowsVirtualKeyCode: 36, nativeVirtualKeyCode: 36, modifiers: 2, commands: ['moveToBeginningOfDocument'] };
        await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
        await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
      } else {
        const xy = (await app.evalJs(wordXY)) || { x: 5, y: 5 };
        clickAt = xy;   // nothing on screen to click: a click on the corner, which will not move the caret - the premise says so
        await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: xy.x, y: xy.y });
        await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: xy.x, y: xy.y, button: 'left', clickCount: 1 });
        await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: xy.x, y: xy.y, button: 'left', clickCount: 1 });
      }
      await sleep(40);
      const hit = mid === 'click' ? await app.evalJs(`(() => { const e = document.elementFromPoint(${clickAt.x}, ${clickAt.y}); return e ? e.tagName + '.' + String(e.className).slice(0, 40) : null; })()`) : null;
      const early = await app.evalJs(offset);
      const series = [];
      for (let i = 0; i < 28; i += 1) { await sleep(100); series.push((await app.evalJs(offset))?.at); }
      const end = await app.evalJs(offset);
      // the page's Selection writes from the move on (the per-keystroke ones before it are the editor placing the caret as the writer types)
      const writes = await app.evalJs(`window.__selw.filter((w) => w[0] >= ${tMove} - 5).slice(0, 12)`);
      const moved = !!early && early.at < early.of - 5;
      const stays = !!end && !!early && end.at === early.at;
      const detail = JSON.stringify({ tTyped, tMove, clickAt, hit, early, end, series, writes });
      ok(`${mid}/${pause}ms (premise): ${mv.label}, ${pause} ms after typing, TOOK (the caret is off the end of the text 40 ms after it)`, moved, detail);
      ok(`${mid}/${pause}ms: the caret STAYS where ${mv.label} put it for 2.8 s - nothing puts it back at the end`, moved && stays, detail);
    }
  }
  // TYPING IS UNCHANGED: after a Ctrl+Home the next typed character still goes to the TIP of the text (the model appends; the forward-only law) and the caret returns to the end
  if (!process.env.CR_MOVES || process.env.CR_MOVES.split(',').includes('typeAfter')) {
    await fresh();
    await app.typeKeys('and so it goes');
    await sleep(300);
    const p = { key: 'Home', code: 'Home', windowsVirtualKeyCode: 36, nativeVirtualKeyCode: 36, modifiers: 2, commands: ['moveToBeginningOfDocument'] };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    await sleep(200);
    const mid = await app.evalJs(offset);
    await app.typeKeys('Z');
    await sleep(700);
    const after = await app.evalJs(offset);
    const text = await app.evalJs(`document.querySelector('${ED}').innerText`);
    const detail = JSON.stringify({ mid, after, tail: text.slice(-24) });
    ok('typeAfter: after a Ctrl+Home, the next typed character still lands at the TIP of the text and the caret returns to the end', !!mid && mid.at === 0 && !!after && after.at === after.of && text.endsWith('goesZ'), detail);
  }
  // THE OTHER TEXT PATHS (Fable, Oct 31): a navigation key notes the writer's caret; every way text can reach the editor must CLEAR that note, append at the TIP of the text, and bring the caret
  // back to the end. Each scenario: type, (copy the page own words for the paste ones), Ctrl+Home, check the caret is at the top, then ONE insert by the path under test, and read 700 ms on.
  //   dictate   Input.insertText with no keydown at all (dictation / a soft keyboard that skips keydown) - a trusted beforeinput insertText
  //   ime       a trusted IME composition (imeSetComposition per character, then the commit) - beforeinput insertCompositionText, then compositionend
  //   compEnd   a compositionend with NO beforeinput before it (an IME / keyboard that commits without one) - dispatched by the page
  //   paste     a trusted Ctrl+V of the page own words - beforeinput insertFromPaste
  //   pasteEvt  a paste EVENT with no beforeinput (the belt-and-braces path blockPaste serves) - dispatched by the page, own words
  const HOME = { key: 'Home', code: 'Home', windowsVirtualKeyCode: 36, nativeVirtualKeyCode: 36, modifiers: 2, commands: ['moveToBeginningOfDocument'] };
  const CMD = (k, code, vk, cmd) => ({ key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 2, commands: [cmd] });
  const press = async (p) => { await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p }); };
  const PATHS = {
    dictate: { label: 'dictation - Input.insertText, no keydown', tail: 'goesZ', act: async () => { await app.type('Z'); } },
    ime: { label: 'a trusted IME composition and its commit', tail: 'goesZ', act: async () => { await app.ime('Z'); } },
    compEnd: { label: 'a compositionend with no beforeinput', tail: 'goesZ', act: async () => {
      await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
        ed.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'Z' })); return true; })()`); } },
    paste: { label: 'a trusted Ctrl+V of the page own words', own: true, tail: 'and so it goes', act: async () => { await press(CMD('v', 'KeyV', 86, 'paste')); } },
    pasteEvt: { label: 'a paste event with no beforeinput (own words)', own: true, tail: 'and so it goes', act: async () => {
      await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const dt = new DataTransfer(); dt.setData('text/plain', window.__cpPlain);
        ed.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt })); return true; })()`); } },
  };
  for (const [pid, pt] of Object.entries(PATHS).filter(([k]) => !process.env.CR_MOVES || process.env.CR_MOVES.split(',').includes(k))) {
    await fresh();
    await app.typeKeys('and so it goes');
    await sleep(300);
    if (pt.own) {   // the writer's own words on the clipboard: select all, copy (the page records them as its own ink and the window sees the plain text)
      await app.evalJs("(() => { window.__cpPlain = ''; if (!window.__cpOn) { window.__cpOn = true; window.addEventListener('copy', (e) => { window.__cpPlain = e.clipboardData ? e.clipboardData.getData('text/plain') : ''; }); } return true; })()");
      await press(CMD('a', 'KeyA', 65, 'selectAll'));
      await press(CMD('c', 'KeyC', 67, 'copy'));
      await sleep(250);
    }
    await press(HOME);
    await sleep(200);
    const mid = await app.evalJs(offset);
    const before = await app.evalJs(`document.querySelector('${ED}').innerText.length`);
    await pt.act();
    await sleep(700);
    const after = await app.evalJs(offset);
    const text = await app.evalJs(`document.querySelector('${ED}').innerText`);
    const plain = pt.own ? await app.evalJs('window.__cpPlain') : '';
    const detail = JSON.stringify({ mid, before, after, tail: text.slice(-24), pasted: plain ? plain.length : 0 });
    ok(`${pid} (premise): the Ctrl+Home took - the caret is at the top before ${pt.label}`, !!mid && mid.at === 0, detail);
    ok(`${pid}: ${pt.label} CLEARS the writer-moved note - the text lands at the TIP and the caret returns to the end`,
      !!mid && mid.at === 0 && !!after && after.at === after.of && text.endsWith(pt.tail) && text.length > before && (!pt.own || (plain.length > 0 && text.length === before + plain.length)), detail);
  }
});

for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
const pass = rec.length > 0 && rec.every((c) => c.pass);
console.log(`CARET-RESET VERIFY: ${pass ? 'PASS' : 'FAIL'} (${rec.filter((c) => c.pass).length}/${rec.length})`);
process.exit(pass ? 0 : 1);
