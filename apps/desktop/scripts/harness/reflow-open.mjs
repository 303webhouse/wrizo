// BUG 32b - OPENING A BOARD SAVES NOTHING, AND A CARD'S HEIGHT DOES NOT DEPEND ON LOAD TIMING (a box turn; Fable, Oct 30, #12b, from INK). BoardEditor's reflow floor used to grow Box.h as soon as a card overflowed,
// including the overflow a not-yet-loaded (lazy) font leaves behind, and the autosave then wrote that h to storage: merely OPENING a board changed saved data, and the saved height depended on whether the text was measured
// before or after its font arrived. The rule this file pins (Arbor, Flux, Machina):
//   O  OPEN      a board opened 5 times with the network (so the fonts) delayed: the stored x / y / h of every card are EXACTLY what was seeded - an open corrects the layout on screen at most, and saves nothing
//   F  FONTS     the on-screen height of a card is the same whether the fonts arrived at once or late (measured once the fonts are ready, and again on loadingdone), and its words are fully visible
//   W  WRITER    a writer's act (an edit) DOES save: the grown height and the row fit reach storage then (so "no save on open" is not "no save"), and the check can see a write
//   R  ROWS      rowFit applies on screen on a plain open too (an old board does not sit overlapping): the card under a grown one is carried clear of it, and none of it is saved
//   N  NO FIELD  the stored cards carry no key the seed did not
// Run (repo root or apps/desktop; needs a box turn):  node scripts/harness/reflow-open.mjs
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { withHarness } = await import('../runtime-verify.mjs');

const LONG = 'I will read six novels from before and after 1848 closely, count every time word, compare the two halves, and test the counts against the timetables of the period, because a method that only counts is not yet an argument.';
const SEED = [
  { id: 'ro-1', kind: 'text', x: 0.05, y: 0.05, w: 0.25, h: 0.05, z: 1, text: LONG, deckStep: { deck: 'thesis', step: 'method' } },
  { id: 'ro-2', kind: 'text', x: 0.05, y: 0.13, w: 0.25, h: 0.05, z: 2, text: 'Second card', deckStep: { deck: 'thesis', step: 'lit' } },
  { id: 'ro-3', kind: 'text', x: 0.4, y: 0.05, w: 0.25, h: 0.05, z: 3, text: LONG, deckStep: { deck: 'thesis', step: 'sources' } },
];
const SKINS = [['plateau', 'Arbor', null], ['flux', 'Flux', null], ['machina', 'Machina', 'cool']];
const STORED = `(() => { const all = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = all.find((x) => x.id === 'ro-board'); return e ? (e.boxes || []).map((b) => ({ id: b.id, x: b.x, y: b.y, h: b.h, keys: Object.keys(b).sort().join() })) : null; })()`;
const LIVE = `(() => { const cv = document.querySelector('.board-canvas'); const W = cv.getBoundingClientRect().width;
  const live = Object.fromEntries(window.wrizoBoard().map((b) => [b.id, b]));
  return [...document.querySelectorAll('.board-box[data-kind=text]')].map((el) => { const t = el.querySelector('.board-text'); const b = live[el.dataset.boxId] || {}; return { id: el.dataset.boxId, h: +b.h, y: +b.y, hPx: Math.round(el.getBoundingClientRect().height), clipped: t ? t.scrollHeight - t.clientHeight : 0 }; }).sort((a, b) => a.id < b.id ? -1 : 1); })()`;
const near = (a, b) => Math.abs(a - b) < 1e-9;

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const latency = (ms) => app.cdp('Network.emulateNetworkConditions', { offline: false, latency: ms, downloadThroughput: -1, uploadThroughput: -1 });
  await app.cdp('Network.enable', {});
  await app.emulateDpr(1, 1400, 1000);
  await app.goto('/');
  await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await q(`window.wrizoCreateJournalPage({ id: 'ro-board', text: '', pageType: 'board', boxes: ${JSON.stringify(SEED)}, createdAt: new Date().toISOString(), origin: null })`);

  // open the board: a full reload (so the lazy font chunks and faces are fetched again, late when `ms` is large), then the board route, then wait until the fonts are in and any save would have happened
  const open = async (ms) => {
    await latency(0);
    await app.reload();
    await latency(ms);
    await q("location.hash = '#/page/ro-board'");   // the route survives the reload; set it again for the first open
    await app.waitFor("document.querySelectorAll('.board-box[data-kind=text]').length === 3", { label: `board (${ms}ms)`, timeout: 60000 });
    await app.waitFor("document.fonts.status === 'loaded'", { label: 'fonts loaded', timeout: 60000 });
    await sleep(4500);   // past the 2 s autosave and the storage flush: a save, if the open made one, has landed
    await latency(0);
  };

  let first = true;
  for (const [theme, name, cast] of SKINS) {
    if (first) { await q(`window.wrizoTheme.set('${theme}')`); first = false; } else await q(`window.wrizoTheme.set('${theme}'); ${cast ? `window.wrizoCast && window.wrizoCast.set('${cast}')` : ''}`);
    const opens = theme === 'plateau' ? 5 : 2;
    let grewOnScreen = 0, storedSame = 0, noKeys = 0, fitOnScreen = 0, shown = [];
    for (let i = 0; i < opens; i += 1) {
      await open(i % 2 === 0 ? 1500 : 0);   // alternate late and prompt fonts
      const stored = await q(STORED);
      const live = await q(LIVE);
      const same = stored && SEED.every((s) => { const o = stored.find((b) => b.id === s.id); return o && near(o.x, s.x) && near(o.y, s.y) && near(o.h, s.h); });
      if (same) storedSame += 1;
      if (stored && stored.every((o) => o.keys === Object.keys(SEED.find((s) => s.id === o.id)).sort().join())) noKeys += 1;
      if (live.some((l) => l.h > 0.05 + 0.005)) grewOnScreen += 1;
      const l1 = live.find((l) => l.id === 'ro-1'), l2 = live.find((l) => l.id === 'ro-2');
      if (l1 && l2 && l2.y > 0.13 + 0.005 && l2.y >= l1.y + l1.h - 1e-6) fitOnScreen += 1;   // rowFit shows on screen on an open too: the card under the grown one has moved clear of it
      shown.push(live.map((l) => `${l.id}:${l.h.toFixed(4)}`).join(' '));
      ok(`O [${name} open ${i + 1}]: the stored x / y / h are exactly the seed's`, same, JSON.stringify(stored));
    }
    ok(`O [${name}]: the open really corrected the layout on screen (the check is not vacuous - a card grew past its seeded h)`, grewOnScreen === opens, `grew on ${grewOnScreen}/${opens} opens: ${shown.join(' | ')}`);
    ok(`R [${name}]: on a plain open the row under a grown card is carried clear of it ON SCREEN (rowFit applies on open, never saved)`, fitOnScreen === opens, `${fitOnScreen}/${opens}`);
    ok(`N [${name}]: no stored card gained a key`, noKeys === opens);
    ok(`O [${name}]: ${opens}/${opens} opens left storage unchanged`, storedSame === opens, `${storedSame}/${opens}`);

    // F - the same on-screen heights whether the fonts came late or promptly, and nothing clipped
    await open(1500); const late = await q(LIVE);
    await open(0); const prompt = await q(LIVE);
    ok(`F [${name}]: a card's on-screen height is the same with late fonts as with prompt ones`, late.length === 3 && late.every((l, i) => near(l.h, prompt[i].h)), `late ${late.map((l) => l.h.toFixed(4)).join(',')} / prompt ${prompt.map((l) => l.h.toFixed(4)).join(',')}`);
    ok(`F [${name}]: every card shows all of its words`, prompt.every((l) => l.clipped <= 2), JSON.stringify(prompt.map((l) => l.clipped)));
  }

  // W - a writer's act saves: edit the second card and the grown heights and the row fit are stored
  await q("window.wrizoTheme.set('plateau')");
  await open(0);
  const p = await q(`(() => { const el = document.querySelector('.board-box[data-box-id="ro-2"] .board-text') || document.querySelector('.board-box[data-kind=text]:nth-of-type(2)'); const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await app.doubleClick(p.x, p.y);
  await sleep(400);
  await app.typeKeys(' and more words');
  await q(`(() => { const b = document.querySelector('.board-popup-done'); if (b) b.click(); })()`);
  await sleep(4500);
  const after = await q(STORED);
  const o1 = after && after.find((b) => b.id === 'ro-1'), o3 = after && after.find((b) => b.id === 'ro-3');
  ok('W: after the writer edits a card, the grown card heights ARE stored (the open alone did not save them)', o1 && o3 && o1.h > 0.055 && o3.h > 0.055, JSON.stringify(after));
}).catch((e) => { ok('harness ran to a verdict', false, String((e && e.stack) || e)); });

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? '  ' + String(c.detail).slice(0, 400) : ''}`);
console.log(failed.length ? `REFLOW-OPEN VERIFY: FAIL (${failed.length} of ${checks.length})` : `REFLOW-OPEN VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
