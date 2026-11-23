// CENSUS #44 (ARBOR, Nov 4): the rhizome re-plans its WHOLE drawing every time the chrome recedes or returns, despite the "never re-seed" rule. The list's own bar: the plan unchanged across a recede / return.
// On the live build (Arbor, by day and by night): a page of 60 words, a goal of 100, the rhizome drawn. The drawing's identity is every path's d in the field, read path by path.
// One letter typed inside the last word (no word added, so the plan's input is unchanged) makes the chrome recede; a pointer move brings it back; two cycles.
// Controls: the drawing read twice at rest with nothing done (a clock in it would show here), and again after a pointer move with the chrome already up.
// STILL THERE: the controls are identical and a recede or return changed a path. GONE: identical through both cycles.
// CAN'T TELL: no drawing, a control differs, the chrome never fell under the 0.04 opacity the field reads, it did not come back, or the word count moved.
import { census, sleep, GONE, THERE, CANT } from './census/lib.mjs';

const WORDS = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
const DRAWN = "(() => { const f = document.querySelector('.wz-rhizome-field'); return f ? [...f.querySelectorAll('path')].map((p) => (p.getAttribute('class') || '') + '#' + (p.getAttribute('data-w') || '') + ':' + (p.getAttribute('d') || '')) : null; })()";
const CHROME = "(() => { const b = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((e) => e.getBoundingClientRect().height > 0); return b ? Number(getComputedStyle(b).opacity) : null; })()";
const COUNT = "(document.querySelector('.forward-only-editor')?.innerText || '').trim().split(/\\s+/).length";

// how two readings differ: paths added or lost, paths changed, the characters they hold, and the first changed path's first difference
const diff = (a, b) => {
  if (!a || !b) return { same: false, note: 'no reading' };
  const n = Math.max(a.length, b.length); let changed = 0, chars = 0, first = null;
  for (let i = 0; i < n; i += 1) { if (a[i] === b[i]) continue; changed += 1; chars += (a[i] || '').length; if (!first) { const x = a[i] || '', y = b[i] || ''; let k = 0; while (k < x.length && x[k] === y[k]) k += 1; first = { path: i, kind: x.split(':')[0], at: k, of: x.length, was: x.slice(Math.max(0, k - 12), k + 28), now: y.slice(Math.max(0, k - 12), k + 28) }; } }
  return { same: changed === 0, paths: [a.length, b.length], changed, chars, total: a.join('').length, first };
};

await census('44', async ({ app, q, shot, openPage, waitSoft, wake }) => {
  const rows = [];
  for (const room of ['light', 'dark']) {
    const id = await openPage({ theme: 'plateau', room, text: WORDS, goal: { n: 100, unit: 'words' }, settings: { progress: 'words', progressStyle: 'rhizome' } });
    if (!id || !(await waitSoft("!!document.querySelector('.wz-rhizome-field path')", { timeout: 6000, label: 'the rhizome drawn' }))) { rows.push({ room, state: 'blind', note: 'no rhizome drawn' }); continue; }
    await wake(); await sleep(2500);
    const rest = await q(DRAWN); await sleep(2000);
    const rest2 = await q(DRAWN);
    await wake(); await sleep(1200);
    const moved = await q(DRAWN), words0 = await q(COUNT);
    const cycles = [];
    for (let c = 0; c < 2; c += 1) {
      await q("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
      await app.typeKeys('x');
      const fell = await waitSoft(`(${CHROME}) !== null && (${CHROME}) < 0.04`, { timeout: 9000, label: 'the chrome receded' });
      await sleep(900);
      const rec = await q(DRAWN);
      if (c === 0) await shot(`${room}-receded`);
      await wake();
      const back = await waitSoft(`(${CHROME}) > 0.9`, { timeout: 7000, label: 'the chrome returned' });
      await sleep(1200);
      const ret = await q(DRAWN);
      if (c === 0) await shot(`${room}-returned`);
      cycles.push({ fell, back, receded: diff(moved, rec), returned: diff(moved, ret) });
    }
    const words1 = await q(COUNT);
    const controls = { restTwice: diff(rest, rest2), afterPointer: diff(rest2, moved) };
    const premise = !!rest && rest.length > 0 && controls.restTwice.same && controls.afterPointer.same && words0 === words1 && cycles.every((x) => x.fell && x.back);
    const state = !premise ? 'blind' : cycles.every((x) => x.receded.same && x.returned.same) ? 'gone' : 'there';
    rows.push({ room, state, words: [words0, words1], controls, cycles });
  }
  const there = rows.filter((r) => r.state === 'there'), blind = rows.filter((r) => r.state === 'blind');
  return {
    result: there.length ? THERE : blind.length ? CANT : GONE,
    why: there.length ? `the drawing changed across a recede or return in: ${there.map((r) => r.room).join(', ')}` : blind.length ? `could not read: ${blind.map((r) => `${r.room} (${r.note || 'a premise or control failed'})`).join(', ')}` : 'the drawing is identical through two recede / return cycles, by day and by night',
    readings: rows,
  };
});
