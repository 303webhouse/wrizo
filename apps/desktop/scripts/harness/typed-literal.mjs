// TYPED-LITERAL (Nick's rulings, Oct 16; plan docs/typed-literal-plan.md @ 9c0864d1): a typed or pasted formatting character is LITERAL
// text, stored escaped (`\*`), so it never becomes markup; Bold, Italic and the rest come only from Ctrl+B / Ctrl+I and the menus. Saved
// markup is never rewritten. The caret settles SYNCHRONOUSLY, so the same keys give the same text at any typing speed.
// The rules themselves are pinned browserlessly by scripts/typed-literal-check.mjs (25 checks, 4 mutants). This file proves the DOORS,
// with real keys on the live surfaces:
//   L1  Draft: typed stars and underscores are stored escaped, shown as themselves, and make no run.
//   L2  Draft: a `#` where a line's text begins is escaped (no heading); a `#` mid-line is left alone.
//   L3  Draft: Ctrl+B still makes bold, around the literal stars.
//   L4  Draft: an old page's saved `**bold**` and `*it*` stay styled, and typing on that page does not rewrite them.
//   L5  Draft: own words copied and pasted back (in-app-copy-format's copy half: the copy is the plain characters) - L5b: TYPED stars
//       copied and pasted back stay literal, with no backslash added. The original L5 (a copy of `**bold**` pasted literal) is parked.
//       (was: a PASTE is literal too - own words copied and pasted back come in escaped (until in-app-copy-format, a copy-then-paste
//       inside the app loses its formatting: stated, not hidden).
//   L6  Free Write: typed stars are stored escaped and make no run - and the word still being typed shows its star, not `\*`.
//   L7  the card pop-up: the same.
//   L8  determinism: one key script, typed in a burst and typed slowly, stores the same text.
// Run: node scripts/harness/typed-literal.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const CE = '.board-popup-editor';
const B = String.fromCharCode(92);   // one backslash, built rather than escaped (a cooked template eats `\*`)
const ZW = String.fromCharCode(0x200b);
const unz = (s) => (typeof s === 'string' ? s.split(ZW).join('') : s);
const parkedChecks = [];
const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass: !!pass, detail });
const tlParks = {};   // IN-APP-COPY-FORMAT: L5's readings, for its parked records

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* recorded by the checks */ }
};
// a page seeded through the seam, opened, and put in the named mode by its strip tab (data-mode-key, not a themeable label)
const openPage = async (app, id, text, modeKey) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const up = await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' }).then(() => true, () => false);
  if (!up) return false;
  await sleep(500);
  const tab = await app.evalJs(`(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key="${modeKey}"]'); if (!b) return false; b.click(); return true; })()`);
  await sleep(900);
  return tab;
};
const openCard = async (app, id, text) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Card board', pageType: 'board', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page',
    boxes: [{ id: `${id}-c`, kind: 'text', x: 0.06, y: 0.06, w: 0.5, h: 0.16, z: 1, text }] })})`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const up = await app.waitFor(`!!document.querySelector('[data-box-id="${id}-c"]')`, { label: 'the card' }).then(() => true, () => false);
  if (!up) return false;
  await sleep(600);
  const c = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="${id}-c"]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const m = (type, n, b) => app.cdp('Input.dispatchMouseEvent', { type, x: c.x, y: c.y, button: 'left', buttons: b, clickCount: n, pointerType: 'mouse' });
  await m('mousePressed', 1, 1); await m('mouseReleased', 1, 0); await sleep(60); await m('mousePressed', 2, 1); await m('mouseReleased', 2, 0);
  return app.waitFor(`!!document.querySelector('${CE}')`, { label: 'card popup' }).then(() => true, () => false);
};
// the caret at the very end of the editor's text, the editor focused
const caretEnd = (app, sel) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); if (!ed) return false; ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
// a key as the browser performs it: a keyDown carrying its editing command (a rawKeyDown performs none - typing-latency-scroll's S1)
const command = (app, k, code, vk, modifiers, cmd) => app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers, commands: [cmd] })
  .then(() => app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers }));
const pageText = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const cardText = (app, id) => app.evalJs(`((JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).boxes||[])[0]?.text ?? null`);
// a stored value read only once it has stopped changing (the autosave debounce lands after the last key)
const settledBy = async (read) => { await sleep(2600); let last = await read(); let same = 0; for (let i = 0; i < 30 && same < 6; i += 1) { await sleep(150); const n = await read(); same = n === last ? same + 1 : 0; last = n; } return last; };
// what the writer SEES: the text outside every hidden mark (the escapes' backslashes and the runs' marks are hidden, font-size 0), plus the runs
const seen = (app, sel) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); if (!ed) return null; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, out = '';
  while ((n = w.nextNode())) { if (!(n.parentElement && n.parentElement.closest('.md-mark-hidden'))) out += n.data; }
  return { visible: out.split('\\u200b').join(''), bold: ed.querySelectorAll('.md-bold').length, italic: ed.querySelectorAll('.md-italic').length,
    underline: ed.querySelectorAll('.md-underline').length, strike: ed.querySelectorAll('.md-strike').length, escapes: ed.querySelectorAll('.md-escape.md-mark-hidden').length,
    shownMarks: [...ed.querySelectorAll('.md-mark')].filter(m => !m.classList.contains('md-mark-hidden')).length }; })()`);
const noRuns = (s) => !!s && s.bold === 0 && s.italic === 0 && s.underline === 0 && s.strike === 0 && s.shownMarks === 0;

// L8's key script: styled words from Ctrl+B, literal stars and underscores, arrows back into the text, a Backspace
const SCRIPT = [['t', 'one '], ['c', 'b'], ['t', 'two'], ['c', 'b'], ['t', ' *three* '], ['k', 'ArrowLeft'], ['k', 'ArrowLeft'], ['t', 'x'], ['k', 'Backspace'], ['t', '_y_'], ['e', 'End'], ['t', ' end']];
const runScript = async (app, slow) => {
  for (const [kind, v] of SCRIPT) {
    if (kind === 't') {
      if (!slow) await app.typeKeys(v);
      else for (const ch of v) { await app.typeKeys(ch); await sleep(160); }
    } else if (kind === 'c') await app.keyCombo(v);
    else if (kind === 'e') await command(app, 'End', 'End', 35, 0, 'moveToEndOfLine');   // End performs its command only as a keyDown carrying it
    else await app.key(v);
    if (slow) await sleep(160);
  }
};

await withHarness(async (app) => {
  // ---- L1 / L2 / L3: Draft, typing
  const d1 = await openPage(app, 'tl1', 'Start', 'draft');
  ok('L1 (setup): the page opens in Draft by its strip tab', d1);
  if (d1) {
    await caretEnd(app, ED);
    await app.typeKeys(' a *b* c __d__ e~f');
    await app.key('Enter');
    await app.typeKeys('# not a heading #tag');
    await sleep(400);
    const s1 = await seen(app, ED);
    ok('L1: the typed stars, underscores and tilde are SHOWN as themselves, and make no run (no bold, italic, underline, strike, no shown mark)',
      !!s1 && s1.visible === 'Start a *b* c __d__ e~f\n# not a heading #tag' && noRuns(s1), JSON.stringify(s1));
    const st1 = await settledBy(() => pageText(app, 'tl1'));
    const want1 = `Start a ${B}*b${B}* c ${B}_${B}_d${B}_${B}_ e${B}~f\n${B}# not a heading #tag`;
    ok('L1: ...and are STORED escaped, every one', unz(st1) === want1, JSON.stringify({ stored: st1, want: want1 }));
    ok('L2: a `#` where a line\'s text begins is escaped (no heading); the `#` mid-line is stored as it was typed',
      typeof st1 === 'string' && st1.includes(`\n${B}# not`) && st1.includes(' #tag') && !st1.includes(`${B}#tag`), JSON.stringify(st1));
    // L3: select all, Ctrl+B - bold comes from the key, and the literal stars stay literal inside it
    await app.keyCombo('a'); await sleep(200);
    await app.keyCombo('b'); await sleep(400);
    const s3 = await seen(app, ED);
    ok('L3: Ctrl+B still makes bold (a run per line, its marks hidden), the literal stars still shown inside it',
      !!s3 && s3.bold === 2 && s3.shownMarks === 0 && s3.visible === 'Start a *b* c __d__ e~f\n# not a heading #tag', JSON.stringify(s3));
    const st3 = await settledBy(() => pageText(app, 'tl1'));
    ok('L3: ...stored as real marks around the escaped text',
      unz(st3) === `**Start a ${B}*b${B}* c ${B}_${B}_d${B}_${B}_ e${B}~f**\n${B}# **not a heading #tag**`
        || unz(st3) === `**Start a ${B}*b${B}* c ${B}_${B}_d${B}_${B}_ e${B}~f**\n**${B}# not a heading #tag**`, JSON.stringify(st3));
  }

  // ---- L4: an old page's saved markup
  const OLD = '**old bold** and *it* stay';
  const d4 = await openPage(app, 'tl4', OLD, 'draft');
  ok('L4 (setup): the old page opens in Draft', d4);
  if (d4) {
    const s4 = await seen(app, ED);
    ok('L4: an old page\'s saved `**bold**` and `*it*` still render styled (existing markup is not rewritten)',
      !!s4 && s4.bold === 1 && s4.italic === 1 && s4.shownMarks === 0 && s4.visible === 'old bold and it stay', JSON.stringify(s4));
    await caretEnd(app, ED);
    await app.typeKeys(' more');
    const st4 = await settledBy(() => pageText(app, 'tl4'));
    ok('L4: typing on that page leaves its saved markup exactly as it was', unz(st4) === OLD + ' more', JSON.stringify(st4));
  }

  // ---- L5: paste - the writer's own words copied and pasted back (own ink passes the voice wall) come in literal
  const MINE = 'Mine **bold** words';
  const d5 = await openPage(app, 'tl5', MINE, 'draft');
  ok('L5 (setup): the page opens in Draft', d5);
  if (d5) {
    await caretEnd(app, ED);
    await app.keyCombo('a'); await sleep(200);
    await command(app, 'c', 'KeyC', 67, 2, 'copy'); await sleep(200);
    await command(app, 'End', 'End', 35, 2, 'moveToEndOfDocument'); await sleep(200);
    await app.typeKeys(' ');
    await command(app, 'v', 'KeyV', 86, 2, 'paste'); await sleep(600);
    const s5 = await seen(app, ED);
    const st5 = await settledBy(() => pageText(app, 'tl5'));
    const pasted = typeof st5 === 'string' && unz(st5).length > MINE.length + 1;
    ok('L5 (driver): the paste landed (the stored text grew past the typed space) - a driver that pastes nothing must not pass the checks below', pasted, JSON.stringify(st5));
    // ---- PARKED - SUPERSEDED by in-app-copy-format's copy half (Fable, Oct 16; one deploy with typed-literal): a copy now writes the PLAIN
    // characters, so the writer's own `**bold**` is copied as `bold` - there are no stars left to paste. Kept VERBATIM and no longer run;
    // successors below (and L5b, which still pastes literal stars, from a page whose stars were TYPED).
    // ok('L5: a pasted `**` is LITERAL - the pasted copy is stored escaped and the saved bold before it is untouched',
    //   unz(st5) === `${MINE} Mine ${B}*${B}*bold${B}*${B}* words`, JSON.stringify(st5));
    // ok('L5: ...so the page shows the pasted stars and still exactly one bold run (the original): the in-app round trip loses formatting until in-app-copy-format',
    //   !!s5 && s5.bold === 1 && s5.visible === 'Mine bold words Mine **bold** words', JSON.stringify(s5));
    // ------------------------------------------------------------------
    tlParks.l5 = { st5: unz(st5), s5 };
    ok('L5 [copy-half successor]: own words copied and pasted back arrive as their PLAIN characters - nothing to escape, and the saved bold before them untouched (the formatting comes back with the paste half)',
      unz(st5) === `${MINE} Mine bold words`, JSON.stringify(st5));
    ok('L5 [copy-half successor]: ...so the page shows the words twice and still exactly one bold run (the original)',
      !!s5 && s5.bold === 1 && s5.visible === 'Mine bold words Mine bold words', JSON.stringify(s5));
  }

  // ---- L5b: a paste is still literal - TYPED stars copied and pasted back stay literal stars, and no backslash is added on the way
  // (before the copy half, each round trip added one visible backslash: the copy carried `\*`, and the paste escaped it again)
  const TYPED = `Mine ${B}*${B}*lit${B}*${B}* words`;
  const d5b = await openPage(app, 'tl5b', TYPED, 'draft');
  ok('L5b (setup): the page opens in Draft', d5b);
  if (d5b) {
    await caretEnd(app, ED);
    await app.keyCombo('a'); await sleep(200);
    await command(app, 'c', 'KeyC', 67, 2, 'copy'); await sleep(200);
    await command(app, 'End', 'End', 35, 2, 'moveToEndOfDocument'); await sleep(200);
    await app.typeKeys(' ');
    await command(app, 'v', 'KeyV', 86, 2, 'paste'); await sleep(600);
    const s5b = await seen(app, ED);
    const st5b = await settledBy(() => pageText(app, 'tl5b'));
    ok('L5b (driver): the paste landed', typeof st5b === 'string' && unz(st5b).length > TYPED.length + 1, JSON.stringify(st5b));
    ok('L5b: pasted `**` is LITERAL - stored escaped exactly as the typed original, no backslash added',
      unz(st5b) === `${TYPED} ${TYPED}`, JSON.stringify(st5b));
    ok('L5b: ...and the page shows the stars as typed, twice, and no bold', !!s5b && s5b.bold === 0 && s5b.visible === 'Mine **lit** words Mine **lit** words', JSON.stringify(s5b));
  }

  // ---- L6: Free Write
  const d6 = await openPage(app, 'tl6', 'Run', 'freewrite');
  ok('L6 (setup): the page opens in Free Write by its strip tab', d6);
  if (d6) {
    await app.evalJs(`document.querySelector('${ED}')?.focus()`);
    await app.typeKeys(' go *on');
    await sleep(400);
    // the word still being typed is drawn apart from the runs (`.fo-word`); its typed star must show as a star there too, not as `\*`
    const s6w = await seen(app, ED);
    ok('L6: the word still being typed shows its star as typed - no backslash appears before the word is finished',
      !!s6w && s6w.visible.endsWith(' go *on') && !s6w.visible.includes(B), JSON.stringify(s6w));
    await app.typeKeys('* now');
    await sleep(400);
    const s6 = await seen(app, ED);
    ok('L6: Free Write shows the typed stars and makes no run', !!s6 && s6.visible.endsWith(' go *on* now') && noRuns(s6), JSON.stringify(s6));
    const st6 = await settledBy(() => pageText(app, 'tl6'));
    ok('L6: ...and stores them escaped', unz(st6) === `Run go ${B}*on${B}* now`, JSON.stringify(st6));
  }

  // ---- L7: the card pop-up
  const d7 = await openCard(app, 'tl7', 'Card start');
  ok('L7 (setup): a real double-click opens the card pop-up', d7);
  if (d7) {
    await caretEnd(app, CE);
    await app.typeKeys(' *x* and _y_');
    await sleep(400);
    const s7 = await seen(app, CE);
    ok('L7: the card shows the typed stars and underscores and makes no run', !!s7 && s7.visible === 'Card start *x* and _y_' && noRuns(s7), JSON.stringify(s7));
    await app.key('Escape'); await sleep(400);
    const st7 = await settledBy(() => cardText(app, 'tl7'));
    ok('L7: ...and stores them escaped', unz(st7) === `Card start ${B}*x${B}* and ${B}_y${B}_`, JSON.stringify(st7));
  }

  // ---- L8: determinism - the same keys at a burst and slowly
  const results = {};
  for (const [label, slow] of [['burst', false], ['slow', true]]) {
    const id = `tl8-${label}`;
    const up = await openPage(app, id, 'Begin', 'draft');
    if (!up) { results[label] = null; continue; }
    await caretEnd(app, ED);
    await app.typeKeys(' ');
    await runScript(app, slow);
    results[label] = unz(await settledBy(() => pageText(app, id)));
  }
  ok('L8 (setup): both runs opened and stored text', typeof results.burst === 'string' && typeof results.slow === 'string', JSON.stringify(results));
  ok('L8: the same keys give the same text at any speed (the caret settles synchronously)', !!results.burst && results.burst === results.slow, JSON.stringify(results));
  ok('L8: ...and that text holds both the Ctrl+B bold and the escaped literals', typeof results.burst === 'string' && results.burst.includes('**two**')
    && results.burst.includes(`${B}*three${B}*`) && results.burst.includes(`${B}_y${B}_`), JSON.stringify(results.burst));
});

if (process.env.HARNESS_PARKED === '1') {
  // IN-APP-COPY-FORMAT (2026-10-16) - TWO parks: L5's literal-paste readings of a copy of `**bold**`. Records frozen; each re-verifies the
  // new truth from the default leg's own readings (tlParks).
  const a = tlParks.l5 || {};
  pok('PARKED (was "L5: a pasted `**` is LITERAL - the pasted copy is stored escaped and the saved bold before it is untouched") - the copy half writes plain characters; live successor: L5 [copy-half successor] and L5b',
    a.st5 === 'Mine **bold** words Mine bold words', JSON.stringify(a));
  pok('PARKED (was "L5: ...so the page shows the pasted stars and still exactly one bold run (the original): the in-app round trip loses formatting until in-app-copy-format") - live successor: L5 [copy-half successor]',
    !!a.s5 && a.s5.bold === 1 && a.s5.visible === 'Mine bold words Mine bold words', JSON.stringify(a));
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  console.log(parkedPass ? `\nTYPED-LITERAL PARKED: PASS (${parkedChecks.length} checks) - HARNESS_PARKED=1 armed; this FILE parks 2: L5's two literal-paste checks (in-app-copy-format's copy half)`
    : `\nTYPED-LITERAL PARKED: FAIL - ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nTYPED-LITERAL VERIFY: PASS (${checks.length} checks)` : `\nTYPED-LITERAL VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
