// BUG 32e - THE REFLOW WAITS FOR THE MEASURED WIDTH (a box turn; Fable, Oct 30, #12d). BoardEditor starts its container width at a 700 px placeholder; a reflow pass that ran at that width wrapped every card in a narrower
// page and grew its h to match (grow-only), and that height stuck once the real width arrived: the SAME seeded board showed 0.1434 on one open and 0.4286 on the next, depending on load timing (reflow-open's check F, red
// on a loaded runner). The rule this file pins (Arbor, Flux, Machina):
//   G  GATE     a board opened again and again (fonts warm - the case that went wrong) always shows each grown card at ITS OWN content height (the card's px height within 3 px of its words' natural height, read in
//               the page, so the check does not compare one open with another), nothing clipped, the same h every open
//   P  PATH     after such an open the writer's next act (an edit) saves the CORRECT height: the stored h of the grown cards is that content height too, never the placeholder width's
//   N  NOSAVE   the open itself still saves nothing (the stored h is the seed's until the writer acts)
// Run (repo root or apps/desktop; needs a box turn):  node scripts/harness/width-gate.mjs
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { withHarness } = await import('../runtime-verify.mjs');

const LONG = 'I will read six novels from before and after 1848 closely, count every time word, compare the two halves, and test the counts against the timetables of the period, because a method that only counts is not yet an argument.';
const seed = () => [
  { id: 'wg-1', kind: 'text', x: 0.05, y: 0.05, w: 0.25, h: 0.05, z: 1, text: LONG, deckStep: { deck: 'thesis', step: 'method' } },
  { id: 'wg-2', kind: 'text', x: 0.05, y: 0.13, w: 0.25, h: 0.05, z: 2, text: 'Second card', deckStep: { deck: 'thesis', step: 'lit' } },
  { id: 'wg-3', kind: 'text', x: 0.4, y: 0.05, w: 0.25, h: 0.05, z: 3, text: LONG, deckStep: { deck: 'thesis', step: 'sources' } },
];
const SKINS = [['plateau', 'Arbor', null, 8, 3], ['flux', 'Flux', null, 3, 0], ['machina', 'Machina', 'cool', 3, 1]];   // [theme, name, cast, plain opens, edit cycles]
// per grown card: the live h, the card's px height, the words' natural px height (height:auto read and restored, as the reflow does), and what is clipped
const LIVE = `(() => { const cv = document.querySelector('.board-canvas'); const W = cv.getBoundingClientRect().width;
  const live = Object.fromEntries(window.wrizoBoard().map((b) => [b.id, b]));
  return { W, cards: [...document.querySelectorAll('.board-box[data-kind=text]')].map((el) => { const t = el.querySelector('.board-text'); const b = live[el.dataset.boxId] || {};
    let nat = 0; if (t) { const h0 = t.style.height; t.style.height = 'auto'; nat = t.offsetHeight; t.style.height = h0; }
    return { id: el.dataset.boxId, h: +b.h, px: el.getBoundingClientRect().height, nat, clipped: t ? t.scrollHeight - t.clientHeight : 0 }; }).sort((a, b) => a.id < b.id ? -1 : 1) }; })()`;
const stored = (id) => `(() => { const all = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = all.find((x) => x.id === '${id}'); return e ? (e.boxes || []).map((b) => ({ id: b.id, h: b.h })) : null; })()`;

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1400, 1000);
  await app.goto('/');
  await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  const seedBoard = (id) => q(`window.wrizoCreateJournalPage({ id: '${id}', text: '', pageType: 'board', boxes: ${JSON.stringify(seed().map((b) => ({ ...b, id: b.id.replace('wg', id) })))}, createdAt: new Date().toISOString(), origin: null })`);
  const open = async (id, ms = 1200) => {
    await app.reload();
    await q(`location.hash = '#/page/${id}'`);
    await app.waitFor("document.querySelectorAll('.board-box[data-kind=text]').length === 3", { label: `board ${id}`, timeout: 60000 });
    await app.waitFor("document.fonts.status === 'loaded'", { label: 'fonts loaded', timeout: 60000 });
    await sleep(ms);
  };
  const tight = (live) => live.cards.filter((c) => c.id.endsWith('-1') || c.id.endsWith('-3')).every((c) => Math.abs(c.px - c.nat) <= 3);

  let n = 0;
  for (const [theme, name, cast, plain, cycles] of SKINS) {
    await q(`window.wrizoTheme.set('${theme}'); ${cast ? `window.wrizoCast && window.wrizoCast.set('${cast}')` : ''}`);
    const id = `wgb-${theme}`;
    await seedBoard(id);
    let good = 0, clean = 0, hs = new Set(), seen = [];
    for (let i = 0; i < plain; i += 1) {
      await open(id);
      const live = await q(LIVE);
      if (tight(live)) good += 1;
      if (live.cards.every((c) => c.clipped <= 2)) clean += 1;
      hs.add(live.cards.map((c) => c.h.toFixed(4)).join(','));
      seen.push(live.cards.filter((c) => c.id.endsWith('-1')).map((c) => `${c.h.toFixed(4)}(${Math.round(c.px)}/${c.nat}px)`).join(''));
    }
    ok(`G [${name}]: ${plain}/${plain} opens show each grown card at its own content height`, good === plain, seen.join(' '));
    ok(`G [${name}]: nothing clipped on any open`, clean === plain);
    ok(`G [${name}]: every open shows the same heights`, hs.size === 1, [...hs].join(' | '));
    const st = await q(stored(id));
    ok(`N [${name}]: ${plain} opens saved nothing (the stored h is still the seed's)`, st && st.every((b) => Math.abs(b.h - 0.05) < 1e-9), JSON.stringify(st));

    // P - a writer's act after an open saves the correct height
    let pathGood = 0, detail = [];
    for (let c = 0; c < cycles; c += 1) {
      const cid = `wgp-${theme}-${c}`;
      n += 1;
      await seedBoard(cid);
      await open(cid);
      const p = await q(`(() => { const el = document.querySelector('.board-box[data-box-id="${cid}-2"] .board-text'); const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
      await app.doubleClick(p.x, p.y);
      await sleep(400);
      await app.typeKeys(' and more words');
      await q(`(() => { const b = document.querySelector('.board-popup-done'); if (b) b.click(); })()`);
      await sleep(4500);
      const live = await q(LIVE);
      const after = await q(stored(cid));
      const W = live.W;
      const right = after && live.cards.filter((x) => x.id.endsWith('-1') || x.id.endsWith('-3')).every((x) => { const s = after.find((b) => b.id === x.id); return s && Math.abs(s.h * W - x.nat) <= 3 && s.h < 0.3; });
      if (right) pathGood += 1;
      detail.push(after ? after.filter((b) => !b.id.endsWith('-2')).map((b) => `${b.h.toFixed(4)}`).join('/') + ` vs nat ${live.cards.filter((x) => !x.id.endsWith('-2')).map((x) => (x.nat / W).toFixed(4)).join('/')}` : 'none');
    }
    if (cycles) ok(`P [${name}]: after ${cycles} open${cycles > 1 ? 's' : ''} + an edit, the stored h of the grown cards is their content height`, pathGood === cycles, detail.join(' | '));
  }
}).catch((e) => { ok('harness ran to a verdict', false, String((e && e.stack) || e)); });

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? '  ' + String(c.detail).slice(0, 400) : ''}`);
console.log(failed.length ? `WIDTH-GATE VERIFY: FAIL (${failed.length} of ${checks.length})` : `WIDTH-GATE VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
