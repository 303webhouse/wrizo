// CENSUS #33 (FIX, Oct 31): the editor moves the caret back to the end of the text about 0.2 s after a keystroke, so a Ctrl+Home right after typing is undone.
// On the live build, in each theme, 50 / 150 / 300 ms after typing: a trusted Ctrl+Home, then the caret watched for 2.8 s.
// STILL THERE: the move took and the caret went anywhere else. GONE: the move took and stayed in every case. CAN'T TELL: a move did not take.
import { census, sleep, GONE, THERE, CANT, prose } from './census/lib.mjs';

const ED = '.forward-only-editor';
const OFFSET = `(() => { const ed = document.querySelector('${ED}'); const s = getSelection(); if (!ed || !s.rangeCount || !ed.contains(s.anchorNode)) return null; const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.anchorNode, s.anchorOffset); return { at: r.toString().length, of: ed.innerText.length }; })()`;
const HOME = { key: 'Home', code: 'Home', windowsVirtualKeyCode: 36, nativeVirtualKeyCode: 36, modifiers: 2, commands: ['moveToBeginningOfDocument'] };

await census('33', async ({ app, q, shot, openPage }) => {
  const rows = [];
  for (const theme of ['plateau', 'machina', 'flux']) for (const pause of [50, 150, 300]) {
    const id = await openPage({ theme, text: prose(12) });
    if (!id) { rows.push({ theme, pause, moved: false, note: 'the page did not open' }); continue; }
    await q(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const sc = document.querySelector('.mode-scroll'); if (sc) sc.scrollTop = sc.scrollHeight; return true; })()`);
    await sleep(300);
    await app.typeKeys('and so it goes');
    await sleep(pause);
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...HOME });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...HOME });
    await sleep(40);
    const early = await q(OFFSET);
    const series = [];
    for (let i = 0; i < 28; i += 1) { await sleep(100); series.push((await q(OFFSET))?.at ?? null); }
    const moved = !!early && early.at < early.of - 5;
    const stays = moved && series.every((v) => v === early.at);
    rows.push({ theme, pause, moved, stays, early: early && early.at, of: early && early.of, last: series[series.length - 1] });
    if (pause === 150) await shot(theme);
  }
  const bad = rows.filter((r) => r.moved && !r.stays), blind = rows.filter((r) => !r.moved);
  return {
    result: bad.length ? THERE : blind.length ? CANT : GONE,
    why: bad.length ? `the caret left where Ctrl+Home put it in ${bad.length} of ${rows.length} cases` : blind.length ? `Ctrl+Home did not take in ${blind.length} of ${rows.length} cases` : `Ctrl+Home held for 2.8 s in all ${rows.length} cases`,
    readings: rows,
  };
});
