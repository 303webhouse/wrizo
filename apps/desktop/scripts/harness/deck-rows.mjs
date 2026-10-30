// BUG 32 - A DEALT DECK'S ROWS FIT THEIR CARDS (a box turn; Fable, Oct 30, #12). A dealt deck puts its cards on a fixed lattice (decks/layout.ts: CARD_H 0.105 + ROW_GAP 0.02 per row). A card whose words
// need more room GROWS (BoardEditor's reflow floor) but the rows under it stayed put, so the grown card ran UNDER the next row's cards and its text was clipped (sample account -> Thesis plan ->
// Methodology). The rule this file pins, in every skin (Arbor, Flux, Machina):
//   D  DEAL     a freshly dealt Thesis (Humanities): no two cards overlap, and every card shows ALL of its own text (scrollHeight <= its box)
//   L  LONG     a long answer typed into Methodology: the card grows, the cards under it MOVE DOWN with it (no overlap; the gap between a card and the one below it is the deck's ROW_GAP again),
//               its text is fully visible, the cards of its own row share one height (the row fits its tallest card), and the other columns' rows stay aligned with it
//   G  GEOMETRY the lattice is skin-independent: every card's x and w (fractions of the board's width) are identical in Arbor, Flux and Machina, dealt and grown; the row-0 y is too
//   S  STORED   the board is saved through the app's own path (no new field: only the x / y / h that were already there)
// Run (repo root or apps/desktop; needs a box turn):  node scripts/harness/deck-rows.mjs      DR_FRAMES=<dir> saves a frame per skin (dealt, grown)
import fs from 'node:fs';
import path from 'node:path';
const FRAMES = process.env.DR_FRAMES || null;
if (FRAMES) fs.mkdirSync(FRAMES, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const LONG = 'I will read six novels from before and after 1848 closely, count every time word, compare the two halves, and test the counts against the timetables of the period, because a method that only counts cannot say what a day felt like and a method that only reads cannot say whether the change was real.';
const SKINS = [['plateau', 'Arbor', null], ['flux', 'Flux', null], ['machina', 'Machina', 'cool']];

// every text card: stored geometry (fractions of the board's width), its rendered rect, and whether all of its words are visible
const SCAN = `(() => { const cv = document.querySelector('.board-canvas'); const W = cv.getBoundingClientRect().width;
  const stored = Object.fromEntries(window.wrizoBoard().filter((b) => b.kind === 'text' && !b.deletedAt).map((b) => [b.id, b]));
  return [...document.querySelectorAll('.board-box[data-kind=text]')].map((el) => { const r = el.getBoundingClientRect(), c = cv.getBoundingClientRect(); const t = el.querySelector('.board-text'); const s = stored[el.dataset.boxId] || {};
    return { id: el.dataset.boxId, step: s.deckStep && s.deckStep.step, x: +((r.left - c.left) / W).toFixed(4), y: +((r.top - c.top) / W).toFixed(4), w: +(r.width / W).toFixed(4), h: +(r.height / W).toFixed(4),
      hPx: Math.round(r.height), clipped: t ? t.scrollHeight - t.clientHeight : 0, sx: s.x, sy: s.y, sh: s.h }; }); })()`;
const overlaps = (cards) => { const out = []; for (let i = 0; i < cards.length; i += 1) for (let j = i + 1; j < cards.length; j += 1) { const a = cards[i], b = cards[j];
  if (a.x < b.x + b.w - 0.001 && b.x < a.x + a.w - 0.001 && a.y < b.y + b.h - 0.001 && b.y < a.y + a.h - 0.001) out.push(`${a.step}/${b.step}`); } return out; };
const clippedOnes = (cards) => cards.filter((c) => c.clipped > 2).map((c) => `${c.step}:${c.clipped}`);
const colOf = (cards) => { const cols = [...new Set(cards.map((c) => c.x))].sort((a, b) => a - b); return cols.map((x) => cards.filter((c) => c.x === x).sort((a, b) => a.y - b.y)); };

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const shot = async (name) => { if (FRAMES) fs.writeFileSync(path.join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 14) }; })()`);
  const click = async (sel) => { const p = await q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(350); return true; };

  const geo = {};
  for (const [theme, name, cast] of SKINS) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme.set('${theme}'); ${cast ? `window.wrizoCast && window.wrizoCast.set('${cast}');` : ''} window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: 'light' })`);
    await sleep(400);
    await q(`(() => { const p = window.wrizoCreateProject('Deck rows', 'creative'); window.wrizoCreateJournalPage({ id: 'dr-board', text: 'Deck rows', pageType: 'board', projectId: p.id, boxes: [], origin: 'project', source: 'page' }); window.wrizoFlushNow(); })()`);
    await sleep(400);
    await q("location.hash = '#/page/dr-board'");
    await waitSoft("!!document.querySelector('.board-canvas')", { label: 'board' });
    await sleep(900);

    // the deal, through the empty board's own door and the wizard (the writer's path)
    await click(".wz-beginnings[data-beginnings=board] .wz-beginning[data-beginning='loadDeck']");
    await waitSoft("!!document.querySelector('.deck-wizard-dialog')", { label: 'wizard', timeout: 6000 });
    await q("(document.querySelector('.forms-row[data-deck-id=\"thesis\"]') || document.querySelector('[data-deck-id=\"thesis\"]'))?.click()"); await sleep(500);
    await q("document.querySelector('[data-option-id=\"humanities\"]')?.click()"); await sleep(1200);
    await waitSoft("document.querySelectorAll('.board-box[data-kind=text]').length === 9", { label: 'nine cards', timeout: 6000 });
    await sleep(500);

    const dealt = await q(SCAN);
    await shot(`dealt-${name.toLowerCase()}`);
    ok(`D1 [${name}]: a dealt Thesis (Humanities) is nine cards`, dealt.length === 9, String(dealt.length));
    ok(`D2 [${name}]: no two dealt cards overlap`, overlaps(dealt).length === 0, JSON.stringify(overlaps(dealt)));
    ok(`D3 [${name}]: every dealt card shows all of its own text`, clippedOnes(dealt).length === 0, JSON.stringify(clippedOnes(dealt)));

    // a long answer into Methodology, through the card's own pop-up
    const meth = dealt.find((c) => c.step === 'methodology');
    const pm = await q(`(() => { const e = document.querySelector('.board-box[data-box-id="${meth.id}"]'); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 14) }; })()`);
    await app.doubleClick(pm.x, pm.y);
    await waitSoft("!!document.querySelector('.board-popup-editor')", { label: 'popup', timeout: 5000 });
    await q("document.querySelector('.board-popup-editor').focus()");
    await app.typeKeys(LONG);
    await sleep(300);
    await q("document.querySelector('.board-popup-done').click()"); await sleep(1500);

    const grown = await q(SCAN);
    await shot(`grown-${name.toLowerCase()}`);
    const gm = grown.find((c) => c.step === 'methodology');
    ok(`L1 [${name}]: the long answer GREW Methodology (its card is taller than a dealt card)`, gm && gm.h > meth.h + 0.01, JSON.stringify({ before: meth.h, after: gm && gm.h }));
    ok(`L2 [${name}]: after the growth no two cards overlap`, overlaps(grown).length === 0, JSON.stringify(overlaps(grown)));
    ok(`L3 [${name}]: every card, Methodology included, shows all of its text`, clippedOnes(grown).length === 0, JSON.stringify(clippedOnes(grown)));
    const cols = colOf(grown);
    const gaps = cols.map((col) => col.slice(1).map((c, i) => +(c.y - (col[i].y + col[i].h)).toFixed(4)));
    ok(`L4 [${name}]: down every column the gap between a card and the next is the deck's ROW_GAP (0.02) - the rows under the grown card moved with it`, gaps.every((g) => g.every((x) => Math.abs(x - 0.02) < 0.002)), JSON.stringify(gaps));
    const rows = {}; for (const c of grown) (rows[c.y.toFixed(3)] ||= []).push(c);
    ok(`L5 [${name}]: a row fits its tallest card - every card of a row shares one height`, Object.values(rows).every((r) => r.every((c) => Math.abs(c.h - r[0].h) < 0.002)), JSON.stringify(Object.entries(rows).map(([y, r]) => [y, r.map((c) => c.h)])));
    ok(`L6 [${name}]: the rows are still ROWS - Thesis (Humanities) is four rows, and all three columns share each row's y`, Object.keys(rows).length === 4, JSON.stringify(Object.keys(rows)));
    const stored = await q('window.wrizoBoard().filter((b) => b.kind === "text").map((b) => Object.keys(b).sort().join())');
    const keysOk = stored.every((k) => !/extra|rowH|autoH|layoutH/i.test(k));
    ok(`S1 [${name}]: no new field is stored on a card (only the keys a dealt card already has)`, keysOk, JSON.stringify([...new Set(stored)]));
    geo[name] = { dealt, grown };
  }

  // G - the lattice does not depend on the skin
  const names = Object.keys(geo);
  const lat = (name, k) => geo[name][k].map((c) => `${c.step}:${c.x},${c.w}`).sort().join(' ');
  ok('G1: every card\'s x and w are identical in Arbor, Flux and Machina (dealt)', names.length === 3 && names.every((n) => lat(n, 'dealt') === lat(names[0], 'dealt')), JSON.stringify(names.map((n) => lat(n, 'dealt').slice(0, 90))));
  ok('G2: every card\'s x and w are identical in Arbor, Flux and Machina (after the growth)', names.length === 3 && names.every((n) => lat(n, 'grown') === lat(names[0], 'grown')), JSON.stringify(names.map((n) => lat(n, 'grown').slice(0, 90))));
  const row0 = (n) => geo[n].dealt.filter((c) => c.y < 0.05).map((c) => c.y).join();
  ok('G3: the first row sits at the same y in every skin (START_Y 0.04)', names.length === 3 && names.every((n) => row0(n) === row0(names[0])), JSON.stringify(names.map(row0)));
  const hs = names.map((n) => `${n}: ${geo[n].grown.find((c) => c.step === 'methodology').hPx}px`);
  console.log('INFO Methodology height after the long answer:', hs.join(' | '));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 420)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nDECK-ROWS VERIFY: PASS (${checks.length} checks)` : `\nDECK-ROWS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
