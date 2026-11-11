// #76 PART 3 (KEEP BOTH): two or three windows type into the same page AT THE SAME TIME, none waiting for another's save. Every word typed anywhere must be in the stored page, every window must end on that same page, and nothing may be
// written twice. The cases are the brief's: (1) different paragraphs, (2) the same paragraph, (3) a delete against an edit, (4) three windows, (5) the quiet line that says both versions were kept.
// TM1  A types at the end of paragraph one, B at the end of paragraph three, taking turns with no pause
// TM2  A and B both type at the end of the same paragraph, taking turns with no pause
// TM3  A deletes a whole paragraph while B types in it: B's words are kept
// TM4  three windows type, each into its own paragraph, taking turns
// TM5  the quiet "both versions were kept" line shows in the window whose page was merged (both changed the SAME paragraph)
// TM6  RULED (Fable, Nov 11): NO word-by-word blending. A and B change DIFFERENT words of one paragraph; the stored page holds both whole paragraphs and no sentence neither of them wrote
import { runTabs } from './tabs-common.mjs';

const SETTLE = 7000;   // 2 s autosave + 0.3 s store write, twice over (the second window merges, then writes the merge), + margin
const NL = String.fromCharCode(10);
const FIRST_NL = `t.indexOf(String.fromCharCode(10))`;
const END_OF_FIRST = `(t.indexOf(String.fromCharCode(10)) < 0 ? t.length : t.indexOf(String.fromCharCode(10)))`;
const SECOND_NL = `t.indexOf(String.fromCharCode(10), t.indexOf(String.fromCharCode(10)) + 1)`;

const count = (text, s) => String(text).split(s).length - 1;

export async function main({ title }) {
  await runTabs({
    title,
    cases: async (h) => {
      const { run, sleep } = h;
      const converge = async (pid, wins, fails, notes) => {
        await sleep(SETTLE);
        const st = await h.stored(pid);
        const shown = {};
        for (const w of wins) shown[w] = await h.shows(w);
        for (const w of wins) if (shown[w] !== st) fails.push(`window ${w} shows ${JSON.stringify(shown[w])} but the stored page is ${JSON.stringify(st)}`);
        notes.push(`stored ${JSON.stringify(st)}`);
        for (const w of wins) {   // the merges this window made, one line each (printed whole, apart from the case's own line)
          const log = JSON.parse(await h.ev(`JSON.stringify(${h.win(w)}.wrizoMergeLog || [])`));
          for (const e of log) console.log(`MERGELOG ${pid} ${w} ${JSON.stringify(e).split('\n').join('|')}`);
        }
        return st;
      };
      const typed = (st, list, fails) => { for (const [s, n] of list) if (count(st, s) < n) fails.push(`WORDS LOST: "${s.trim()}" typed ${n} time(s), found ${count(st, s)} in ${JSON.stringify(st)}`); };
      const once = (st, list, fails) => { for (const p of list) if (count(st, p) !== 1) fails.push(`"${p}" appears ${count(st, p)} times in ${JSON.stringify(st)}`); };

      await run('TM1', '#76 keep both: A and B type at once in DIFFERENT paragraphs; every word kept, one copy of each paragraph', async (fails, notes) => {
        const pid = `wa-m1-${Date.now().toString(36)}`;
        await h.mkPage(pid, ['Para one.', 'Para two.', 'Para three.'].join(NL)); await h.openA(pid); await h.tabB();
        for (let r = 0; r < 3; r += 1) {
          await h.typeIn('A', ` A${r}`, FIRST_NL);
          await h.typeIn('B', ` B${r}`, 't.length');
        }
        const st = await converge(pid, ['A', 'B'], fails, notes);
        typed(st, [[' A0', 1], [' A1', 1], [' A2', 1], [' B0', 1], [' B1', 1], [' B2', 1]], fails);
        once(st, ['Para one.', 'Para two.', 'Para three.'], fails);
      });
      await run('TM2', '#76 keep both: A and B type at once at the end of the SAME paragraph; every word kept, no paragraph written twice', async (fails, notes) => {
        const pid = `wa-m2-${Date.now().toString(36)}`;
        await h.mkPage(pid, 'Base. '); await h.openA(pid); await h.tabB();
        for (let r = 0; r < 3; r += 1) {
          await h.typeIn('A', `a${r} `, END_OF_FIRST);   // each window keeps writing in ITS OWN paragraph (A's sorts first: "a" before "b")
          await h.typeIn('B', `b${r} `, 't.length');
        }
        const st = await converge(pid, ['A', 'B'], fails, notes);
        typed(st, [['a0 ', 1], ['a1 ', 1], ['a2 ', 1], ['b0 ', 1], ['b1 ', 1], ['b2 ', 1]], fails);
        if (count(st, 'Base.') > 2) fails.push(`the paragraph was written ${count(st, 'Base.')} times: ${JSON.stringify(st)}`);
      });
      await run('TM3', "#76 keep both: A deletes a paragraph while B types in it; B's words are kept", async (fails, notes) => {
        const pid = `wa-m3-${Date.now().toString(36)}`;
        await h.mkPage(pid, ['One', 'Two', 'Three'].join(NL)); await h.openA(pid); await h.tabB();
        await h.typeIn('B', ' edited', SECOND_NL);   // the end of "Two"
        await h.tabFocus('A', SECOND_NL);
        for (let k = 0; k < 4; k += 1) await h.d.key('Backspace');   // "Two" and its line break are gone in A
        const st = await converge(pid, ['A', 'B'], fails, notes);
        typed(st, [[' edited', 1]], fails);
        once(st, ['One', 'Three'], fails);
      });
      await run('TM4', '#76 keep both: THREE windows type at once, each in its own paragraph; every word kept, one copy of each paragraph', async (fails, notes) => {
        const pid = `wa-m4-${Date.now().toString(36)}`;
        await h.mkPage(pid, ['First.', 'Second.', 'Third.'].join(NL)); await h.openA(pid); await h.tabB(); await h.tabC();
        for (let r = 0; r < 2; r += 1) {
          await h.typeIn('A', ` a${r}`, FIRST_NL);
          await h.typeIn('B', ` b${r}`, SECOND_NL);
          await h.typeIn('C', ` c${r}`, 't.length');
        }
        const st = await converge(pid, ['A', 'B', 'C'], fails, notes);
        typed(st, [[' a0', 1], [' a1', 1], [' b0', 1], [' b1', 1], [' c0', 1], [' c1', 1]], fails);
        once(st, ['First.', 'Second.', 'Third.'], fails);
      });
      await run('TM5', '#76 keep both: the quiet line that says both versions were kept shows in the window whose page was merged', async (fails, notes) => {
        const pid = `wa-m5-${Date.now().toString(36)}`;
        await h.mkPage(pid, ['Para one.', 'Para two.'].join(NL)); await h.openA(pid); await h.tabB();
        await h.typeIn('A', ' from A', FIRST_NL);
        await h.typeIn('B', ' from B', FIRST_NL);
        const seen = { A: null, B: null };
        const t0 = Date.now();
        while (Date.now() - t0 < SETTLE && !(seen.A || seen.B)) {
          for (const w of ['A', 'B']) { const v = await h.ev(`(() => { const l = ${h.win(w)}.document.querySelector('.action-toast'); return l ? l.textContent.trim() : null; })()`); if (v) seen[w] = v; }
          await sleep(250);
        }
        notes.push(`line in A: ${JSON.stringify(seen.A)}; in B: ${JSON.stringify(seen.B)}`);
        if (!seen.A && !seen.B) fails.push('neither window showed the quiet line that says both versions were kept');
      });
      await run('TM6', '#76 keep both: A and B change DIFFERENT words of one paragraph; both whole paragraphs are kept and NO blended sentence appears', async (fails, notes) => {
        const pid = `wa-m6-${Date.now().toString(36)}`;
        await h.mkPage(pid, 'The quick fox ran home.'); await h.openA(pid); await h.tabB();
        // A: "The quick fox ran home." -> "The quick brown fox ran home."   B: -> "The quick fox ran slowly home."   (a word-by-word merge would write "The quick brown fox ran slowly home.", which neither wrote)
        await h.typeIn('A', 'brown ', 10);    // before "fox"
        await h.typeIn('B', 'slowly ', 18);   // before "home"
        const st = await converge(pid, ['A', 'B'], fails, notes);
        const lines = String(st).split(NL);
        const whole = ['The quick brown fox ran home.', 'The quick fox ran slowly home.'];
        for (const w of whole) if (!lines.includes(w)) fails.push(`the whole paragraph ${JSON.stringify(w)} is not kept: ${JSON.stringify(st)}`);
        for (const w of whole) if (lines.filter((l) => l === w).length > 1) fails.push(`the paragraph ${JSON.stringify(w)} is written ${lines.filter((l) => l === w).length} times: ${JSON.stringify(st)}`);
        for (const l of lines) if (l && !whole.includes(l)) fails.push(`a sentence neither window wrote: ${JSON.stringify(l)} in ${JSON.stringify(st)}`);
      });
    },
  });
}
