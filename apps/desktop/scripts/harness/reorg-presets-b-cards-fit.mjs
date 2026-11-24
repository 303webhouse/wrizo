// PRESETS-B, the seven-card height (Fable, Nov 24, 11:01 am: "the seven-card height fix, so no dealt card scrolls; check Machina at 1366").
// The frames of run 45368638943 showed Machina's seven Memory cards each wearing a scrollbar: the card's question wraps to four lines in a card a row of seven makes narrow, and the card is only
// three lines tall. A dealt card is a card the writer will write in; one that scrolls before she has typed a word is a card that is too short.
//   FIT   every card of every counted deck (Relationship Map, Timeline, Literature Map, Interview Notes, Memory Map), dealt at EVERY count it offers, in Machina and in Arbor, at 1366 x 768 and 1920 x 1080,
//         holds its title and its question with no scrolling: the card's own scroll height is no more than its client height (the card is .board-text, overflow:auto)
//   ROWS  a card never lands on another: no two dealt cards of one deal overlap (a taller card must push the row under it down)
// A deal goes through the app's own door: a board's sliver, "From a deck...", the deck's row, the count option. Browser: needs a box turn (or Actions).
// Run: node scripts/harness/reorg-presets-b-cards-fit.mjs   (from apps/desktop; WS_BOX_TURN required, or a hosted runner)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DECKS = [
  { id: 'relationship-map', counts: ['three', 'four', 'five'] },
  { id: 'timeline', counts: ['three', 'five', 'seven'] },
  { id: 'literature-map', counts: ['three', 'four', 'five'] },
  { id: 'interview-notes', counts: ['two', 'three', 'four'] },
  { id: 'memory-map', counts: ['three', 'five', 'seven'] },
];
const SIZES = [[1366, 768], [1920, 1080]];
const THEMES = ['machina', 'plateau'];

const boot = async (app, theme, [w, h]) => {
  await app.emulateDpr(1, w, h);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','${theme}');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  try { await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }); } catch { /* the checks record what follows */ }
  await sleep(400);
};
const URLS = { machina: '/?reorg=1&arbor2=0', plateau: '/?reorg=1&reorglift=plateau.front,plateau.top,plateau.back' };
// a deal goes through the app's own door, the way the frames did (run 45368638943): a board she opens, its sliver's "From a deck...", the deck's row, the count option
const deal = async (app, theme, deckId, optionId) => {
  const id = 'cf-' + deckId + '-' + optionId;
  await app.evalJs(`(() => { const W = window; const project = W.wrizoCreateProject('Fit ' + ${JSON.stringify(id)}); W.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: 'Board', projectId: project.id, pageType: 'board', boxes: [], createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null }); W.wrizoFlushNow(); return null; })()`);
  await sleep(400);
  await app.evalJs(`history.replaceState(null, '', '${URLS[theme]}#/page/${id}'); null`);
  await app.reload();
  try { await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the board', timeout: 15000 }); } catch { return false; }
  await sleep(900);
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(500); }
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.wz-sliver-item-btn, button')].find((x) => /^\\s*From a deck/i.test(x.textContent || '')); if (b) b.click(); return null; })()"); await sleep(600);
  try { await app.waitFor("!!document.querySelector('.deck-wizard-dialog')", { label: 'the deck wizard', timeout: 8000 }); } catch { return false; }
  await sleep(500);
  await app.evalJs(`document.querySelector('[data-deck-id="${deckId}"]')?.click(); null`); await sleep(500);
  await app.evalJs(`document.querySelector('[data-option-id="${optionId}"]')?.click(); null`);
  try { await app.waitFor("!document.querySelector('.deck-wizard-dialog') && document.querySelectorAll('.board-text[data-prompt]').length > 0", { label: 'the deal lands', timeout: 12000 }); } catch { return false; }
  await sleep(900);
  return true;
};
const MEASURE = `(() => {
  const cards = [...document.querySelectorAll('.board-text[data-prompt]')].map((el) => {
    const box = el.closest('[data-box-id]'); const r = (box || el).getBoundingClientRect();
    return { id: box ? box.getAttribute('data-box-id') : null, over: el.scrollHeight - el.clientHeight, sh: el.scrollHeight, ch: el.clientHeight, l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) };
  });
  const overlaps = [];
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
    const a = cards[i], b = cards[j];
    if (a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1) overlaps.push(i + '/' + j);
  }
  return { n: cards.length, worst: cards.reduce((m, c) => Math.max(m, c.over), -999), overs: cards.filter((c) => c.over > 1).length, overlaps };
})()`;

await withHarness(async (app) => {
  for (const theme of THEMES) for (const size of SIZES) {
    await boot(app, theme, size);
    const fit = [], rows = [];
    for (const d of DECKS) for (const c of d.counts) {
      const landed = await deal(app, theme, d.id, c);
      const m = landed ? await app.evalJs(MEASURE) : null;
      const tag = `${d.id}/${c}`;
      if (!m || m.n === 0) { fit.push(`${tag}: no deal`); continue; }
      if (m.overs > 0) fit.push(`${tag}: ${m.overs}/${m.n} scroll (+${m.worst}px)`);
      if (m.overlaps.length) rows.push(`${tag}: ${m.overlaps.slice(0, 3).join(',')}`);
    }
    ok(`FIT [${theme} ${size[0]}]: every dealt card of the five counted decks, at every count, holds its title and question with no scrolling (${DECKS.reduce((a, d) => a + d.counts.length, 0)} deals)`, fit.length === 0, fit.join(' | '));
    ok(`ROWS [${theme} ${size[0]}]: no dealt card lands on another`, rows.length === 0, rows.join(' | '));
  }
});

const pass = checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(pass ? `\nREORG-PRESETS-B-CARDS-FIT VERIFY: PASS (${checks.length} checks)` : `\nREORG-PRESETS-B-CARDS-FIT VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
