// #76 PART 1 (REFRESH): a window with nothing unsaved shows what another window saved, AT ONCE, with no reload; and its own next words are added to that, never written over it.
// The save is given its full time first (the page autosaves 2 s after the last key, then the store writes 0.3 s later), so these cases hold only windows that are NOT in the middle of an edit: a window that IS (both typing at once) is part 3 (keep both).
// TR1  window A types and the save settles: window B (opened before, nothing unsaved) shows A's words within 2.5 s, then B types: A's and B's words are both stored
// TR2  window B types and the save settles, then A (the stale one) types: both stored, and A saw B's words before it typed
// TR3  the writer's caret in the idle window stays where it was when the other window's save arrives (the window she is not typing in keeps its caret; focus is the browser's: typing in A takes it from B)
import { runTabs } from './tabs-common.mjs';

const SETTLE = 3600;   // 2 s autosave + 0.3 s store write + margin

export async function main({ title }) {
  await runTabs({
    title,
    cases: async (h) => {
      const { run, sleep } = h;
      await run('TR1', '#76 refresh: A types and saves; B (nothing unsaved) shows it at once; B then types; both are stored', async (fails, notes) => {
        const pid = `wa-ref1-${Date.now().toString(36)}`;
        await h.mkPage(pid, 'Base. '); await h.openA(pid); await h.tabB();
        await h.typeIn('A', 'Alpha one. '); await sleep(SETTLE);
        const b = await h.waitShows('B', (t) => /Alpha one\./.test(t || ''), 2500);
        if (!/Alpha one\./.test(b || '')) fails.push(`window B (nothing unsaved) still shows ${JSON.stringify(b)} 2.5 s after window A's save settled`);
        await h.typeIn('B', 'Beta one. '); await sleep(SETTLE);
        const st = await h.stored(pid);
        for (const w of ['Alpha one.', 'Beta one.']) if (!String(st).includes(w)) fails.push(`WORDS LOST: "${w}" is not in the stored page ${JSON.stringify(st)}`);
        const a = await h.waitShows('A', (t) => /Beta one\./.test(t || ''), 2500);
        if (!/Beta one\./.test(a || '')) fails.push(`window A (nothing unsaved) still shows ${JSON.stringify(a)} after window B's save`);
        notes.push(`B showed ${JSON.stringify(b)}; stored ${JSON.stringify(st)}; A shows ${JSON.stringify(a)}`);
      });
      await run('TR2', '#76 refresh: B types and saves; A (stale, opened before) types after it: both stored, A had seen B\'s words first', async (fails, notes) => {
        const pid = `wa-ref2-${Date.now().toString(36)}`;
        await h.mkPage(pid, 'Base. '); await h.openA(pid); await h.tabB();
        await h.typeIn('B', 'Bee first. '); await sleep(SETTLE);
        const a0 = await h.waitShows('A', (t) => /Bee first\./.test(t || ''), 2500);
        if (!/Bee first\./.test(a0 || '')) fails.push(`window A (nothing unsaved) still shows ${JSON.stringify(a0)} 2.5 s after window B's save settled`);
        await h.typeIn('A', 'Ay second. '); await sleep(SETTLE);
        const st = await h.stored(pid);
        for (const w of ['Bee first.', 'Ay second.']) if (!String(st).includes(w)) fails.push(`WORDS LOST: "${w}" is not in the stored page ${JSON.stringify(st)}`);
        notes.push(`A showed ${JSON.stringify(a0)}; stored ${JSON.stringify(st)}`);
      });
      await run('TR3', '#76 refresh: the caret in the idle window stays put when the other window\'s save arrives, and the editor keeps focus', async (fails, notes) => {
        const pid = `wa-ref3-${Date.now().toString(36)}`;
        await h.mkPage(pid, 'Base. '); await h.openA(pid); await h.tabB();
        await h.tabFocus('B', 3);
        await h.typeIn('A', 'Alpha one. '); await sleep(SETTLE);
        await h.waitShows('B', (t) => /Alpha one\./.test(t || ''), 2500);
        await h.ev(`document.getElementById('wa-tab-b').contentWindow.focus()`); await sleep(300);
        const r = await h.tabRead('B');
        const focused = await h.ev(`(() => { const d = document.getElementById('wa-tab-b').contentDocument; return !!d.activeElement && !!d.activeElement.closest('.forward-only-editor'); })()`);
        notes.push(`B after the refresh: text ${JSON.stringify(r && r.text)}, caret ${r && r.anchor}..${r && r.focus}, editor focused ${focused}`);
        if (!r || r.focus !== 3 || r.anchor !== 3) fails.push(`window B's caret moved: it was at 3 and is now ${r && r.anchor}..${r && r.focus}`);
      });
    },
  });
}
