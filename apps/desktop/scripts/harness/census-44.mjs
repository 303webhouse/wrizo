// CENSUS #44 (ARBOR, Nov 4): the rhizome re-plans its WHOLE drawing every time the chrome recedes or returns, despite the "never re-seed" rule.
// On the live build (Arbor, by day and by night): a page of 60 words, a goal of 100, the rhizome drawn. The drawing's identity is every path's d in the field.
// One letter typed inside the last word (no word added, so the plan's input is unchanged) makes the chrome recede; a pointer move brings it back.
// STILL THERE: the drawing differs after the recede or after the return. GONE: identical at rest, receded and returned.
// CAN'T TELL: no drawing, the chrome never fell under the 0.04 opacity the field reads, it did not come back, or the word count moved.
import { census, sleep, GONE, THERE, CANT } from './census/lib.mjs';

const WORDS = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
const DRAWN = `(() => { const f = document.querySelector('.wz-rhizome-field'); if (!f) return null; const d = [...f.querySelectorAll('path')].map((p) => p.getAttribute('d') || '').join('|'); let h = 5381; for (let i = 0; i < d.length; i += 1) h = ((h * 33) ^ d.charCodeAt(i)) >>> 0; return { paths: f.querySelectorAll('path').length, chars: d.length, hash: h }; })()`;
const CHROME = "(() => { const b = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((e) => e.getBoundingClientRect().height > 0); return b ? Number(getComputedStyle(b).opacity) : null; })()";
const COUNT = "(document.querySelector('.forward-only-editor')?.innerText || '').trim().split(/\\s+/).length";
const same = (a, b) => !!a && !!b && a.hash === b.hash && a.chars === b.chars && a.paths === b.paths;

await census('44', async ({ app, q, shot, openPage, waitSoft }) => {
  const rows = [];
  for (const room of ['light', 'dark']) {
    const id = await openPage({ theme: 'plateau', room, text: WORDS, goal: { n: 100, unit: 'words' }, settings: { progress: 'words', progressStyle: 'rhizome' } });
    if (!id || !(await waitSoft("!!document.querySelector('.wz-rhizome-field path')", { timeout: 6000, label: 'the rhizome drawn' }))) { rows.push({ room, state: 'blind', note: 'no rhizome drawn' }); continue; }
    for (let i = 0; i < 6; i += 1) { await app.mouseMove(40 + i * 30, 220); await sleep(60); }
    await sleep(2500);
    const rest = await q(DRAWN), words0 = await q(COUNT), chrome0 = await q(CHROME);
    await q(`(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
    await app.typeKeys('x');
    const fell = await waitSoft(`(${CHROME}) !== null && (${CHROME}) < 0.04`, { timeout: 9000, label: 'the chrome receded' });
    await sleep(900);
    const receded = await q(DRAWN), words1 = await q(COUNT), chrome1 = await q(CHROME);
    await shot(`${room}-receded`);
    for (let i = 0; i < 12; i += 1) { await app.mouseMove(40 + i * 30, 200 + (i % 4) * 25); await sleep(60); }
    const back = await waitSoft(`(${CHROME}) > 0.9`, { timeout: 7000, label: 'the chrome returned' });
    await sleep(1200);
    const returned = await q(DRAWN), chrome2 = await q(CHROME);
    await shot(`${room}-returned`);
    const premise = !!rest && rest.paths > 0 && rest.chars > 0 && fell && back && words0 === words1;
    const state = !premise ? 'blind' : same(rest, receded) && same(rest, returned) ? 'gone' : 'there';
    rows.push({ room, state, rest, receded, returned, words: [words0, words1], chrome: [chrome0, chrome1, chrome2], fell, back });
  }
  const there = rows.filter((r) => r.state === 'there'), blind = rows.filter((r) => r.state === 'blind');
  return {
    result: there.length ? THERE : blind.length ? CANT : GONE,
    why: there.length ? `the drawing changed across the recede or return in: ${there.map((r) => r.room).join(', ')}` : blind.length ? `could not read: ${blind.map((r) => `${r.room} (${r.note || 'a premise failed'})`).join(', ')}` : 'the drawing is identical at rest, receded and returned, by day and by night',
    readings: rows,
  };
});
