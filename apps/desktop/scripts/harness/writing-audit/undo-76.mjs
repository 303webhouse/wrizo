// MEASURE, not a check (#76, Fable's question c): after the editor mounts again on adopted or merged text, does Ctrl+Z work, and what does it undo? It prints UNDO lines and never fails.
//   UN0  control: one window, type, Ctrl+Z (the undo stack works at all here)
//   UN1  ADOPT: window B saves words; window A (nothing unsaved) adopts them and its editor mounts again; Ctrl+Z in A; then A types and Ctrl+Z twice
//   UN2  MERGE: A and B change the same paragraph; whichever window merged mounts again; Ctrl+Z in each window
// Run: node scripts/harness/writing-audit/undo-76.mjs (from apps/desktop; on Actions via writing-audit.yml, script=undo-76.mjs)
import { runTabs } from './lib/tabs-common.mjs';

const j = JSON.stringify;

await runTabs({
  title: 'UNDO-76',
  cases: async (h) => {
    const { run, sleep, d } = h;
    const undoIn = async (w) => { await h.tabFocus(w); await d.key('z', { ctrl: true }); await sleep(350); return h.shows(w); };
    await run('UN0', 'control: one window, type then Ctrl+Z', async (fails, notes) => {
      const pid = `wa-un0-${Date.now().toString(36)}`;
      await h.mkPage(pid, 'Base.'); await h.openA(pid);
      await h.typeIn('A', ' one two three');
      const typed = await h.shows('A');
      const after = await undoIn('A');
      console.log(`UNDO UN0 typed ${j(typed)}; Ctrl+Z -> ${j(after)}`);
      notes.push(`typed ${j(typed)}; Ctrl+Z -> ${j(after)}`);
    });
    await run('UN1', 'ADOPT: B saves, A adopts; Ctrl+Z in A', async (fails, notes) => {
      const pid = `wa-un1-${Date.now().toString(36)}`;
      await h.mkPage(pid, 'Base.'); await h.openA(pid); await h.tabB();
      await h.typeIn('B', ' Beta.');
      const adopted = await h.waitShows('A', (t) => /Beta/.test(String(t)), 9000);
      const z1 = await undoIn('A');
      await h.typeIn('A', ' typed after');
      const typed = await h.shows('A');
      const z2 = await undoIn('A');
      const z3 = await undoIn('A');
      const line = `A adopted ${j(adopted)}; Ctrl+Z at once -> ${j(z1)}; then A typed -> ${j(typed)}; Ctrl+Z -> ${j(z2)}; Ctrl+Z again -> ${j(z3)}`;
      console.log(`UNDO UN1 ${line}`); notes.push(line);
    });
    await run('UN2', 'MERGE: A and B change the same paragraph; Ctrl+Z', async (fails, notes) => {
      const pid = `wa-un2-${Date.now().toString(36)}`;
      await h.mkPage(pid, 'The quick fox ran home.'); await h.openA(pid); await h.tabB();
      await h.typeIn('A', 'brown ', 10);
      await h.typeIn('B', 'slowly ', 18);
      await sleep(7000);
      const a0 = await h.shows('A'), b0 = await h.shows('B');
      const a1 = await undoIn('A'), b1 = await undoIn('B');
      const line = `after the merge A shows ${j(a0)}, B shows ${j(b0)}; Ctrl+Z in A -> ${j(a1)}; Ctrl+Z in B -> ${j(b1)}`;
      console.log(`UNDO UN2 ${line}`); notes.push(line);
    });
  },
});
