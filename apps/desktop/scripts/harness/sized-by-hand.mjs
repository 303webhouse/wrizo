// BUG 32c - sizedByHand (a box turn; Fable, Oct 30, #12b; Nick APPROVED the new saved field). An optional `sizedByHand: true` on a text card: SET only when the writer resizes the card by hand, CLEARED when a resize lands
// back on the card's content height; ABSENT = auto. Auto cards fit their content (grow AND shrink, after the fonts are ready) once the writer has acted on THEM (an edit that changed the words, or a resize); a hand-sized
// card keeps its size; a card the writer has not acted on keeps its size; a plain open changes - and saves - nothing. In every skin (Arbor, Flux, Machina):
//   P  OPEN       a board with an auto card (long words, generous height), a hand-sized card (long words, generous height) and a card nobody has touched: after a plain open the STORED x / y / h / keys are the seed's, and
//                 the hand-sized and untouched cards are still their seeded height on screen (nothing shrank)
//   A  AUTO       edit the auto card's words down to a few: it SHRINKS to its content and the shorter height is stored
//   H  HAND       the same edit on the hand-sized card: it keeps its size and keeps its mark
//   U  UNTOUCHED  editing OTHER cards never shrinks the card nobody touched
//   M  MARK       a resize by hand SETS the mark (stored); resizing it back to its content height CLEARS it (the key is gone from storage); no other key changes
//   D  DEALT      a dealt Thesis: Methodology given a long answer grows and carries the rows under it down (bug 32), then the answer cut back to a few words: the card SHRINKS back, its row-mates with it, and the rows
//                 under it come back UP to where the deal put them; a reload and a plain open of that board then leave the stored geometry exactly as it was
// Run (repo root or apps/desktop; needs a box turn):  node scripts/harness/sized-by-hand.mjs
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const LONG = 'I will read six novels from before and after 1848 closely, count every time word, compare the two halves, and test the counts against the timetables of the period, because a method that only counts is not yet an argument.';
const SHORT = 'Short now.';
const SEED = [
  { id: 'sb-auto', kind: 'text', x: 0.03, y: 0.05, w: 0.28, h: 0.2, z: 1, text: LONG },
  { id: 'sb-hand', kind: 'text', x: 0.35, y: 0.05, w: 0.28, h: 0.6, z: 2, text: LONG, sizedByHand: true },
  { id: 'sb-old', kind: 'text', x: 0.67, y: 0.05, w: 0.28, h: 0.3, z: 3, text: 'A short old card nobody has touched.' },
  { id: 'sb-fit', kind: 'text', x: 0.67, y: 0.45, w: 0.28, h: 0.12, z: 4, text: 'Fit me please.' },
];
const SKINS = [['plateau', 'Arbor', null], ['flux', 'Flux', null], ['machina', 'Machina', 'cool']];
const STORED = (id) => `(() => { const all = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = all.find((x) => x.id === '${id}'); return e ? (e.boxes || []).filter((b) => !b.deletedAt).map((b) => ({ id: b.id, x: b.x, y: b.y, h: b.h, mark: b.sizedByHand === true, keys: Object.keys(b).sort().join(), step: b.deckStep && b.deckStep.step })) : null; })()`;
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const byId = (list, id) => (list || []).find((b) => b.id === id);

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const rect = (sel) => q(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.getBoundingClientRect().toJSON() : null; })()`);
  const click = async (sel) => { const r = await rect(sel); if (!r) return false; await app.mouseMove(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)); await app.mouseDown(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)); await app.mouseUp(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)); return true; };
  const fresh = async (theme, cast) => {
    await app.emulateDpr(1, 1400, 1000);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme.set('${theme}'); ${cast ? `window.wrizoCast && window.wrizoCast.set('${cast}');` : ''} window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: 'light' })`);
    await sleep(400);
  };
  // edit a card's words through its own pop-up: select all, type, Done
  const editText = async (boxId, text) => {
    const r = await rect(`.board-box[data-box-id="${boxId}"]`);
    await app.doubleClick(Math.round(r.x + r.width / 2), Math.round(r.y + 14));
    await waitSoft("!!document.querySelector('.board-popup-editor')", { label: 'popup', timeout: 5000 });
    await q("document.querySelector('.board-popup-editor').focus()");
    await app.keyCombo('a');
    await app.typeKeys(text);
    await sleep(300);
    await q("document.querySelector('.board-popup-done').click()");
    await sleep(900);
  };
  // drag a selected card's resize handle by (dx, dy) px
  const dragHandle = async (boxId, dx, dy) => {
    const r = await rect(`.board-box[data-box-id="${boxId}"]`);
    await app.mouseDown(Math.round(r.x + r.width / 2), Math.round(r.y + 12)); await app.mouseUp(Math.round(r.x + r.width / 2), Math.round(r.y + 12));   // select it
    await sleep(250);
    const h = await rect('.board-handle');
    if (!h) return false;
    const hx = Math.round(h.x + h.width / 2), hy = Math.round(h.y + h.height / 2);
    await app.mouseDown(hx, hy); await sleep(30);
    const steps = 4;
    for (let i = 1; i <= steps; i += 1) { await app.mouseMove(hx + Math.round((dx * i) / steps), hy + Math.round((dy * i) / steps)); await sleep(40); }
    await app.mouseUp(hx + dx, hy + dy);
    await sleep(500);
    return true;
  };
  const fitPx = (boxId) => q(`(() => { const el = document.querySelector('.board-box[data-box-id="${boxId}"] .board-text'); const cv = document.querySelector('.board-canvas'); const keep = el.style.height; el.style.height = 'auto'; const nat = el.offsetHeight; el.style.height = keep; const cur = el.parentElement.getBoundingClientRect().height; return { nat, cur, floor: 0.045 * cv.getBoundingClientRect().width }; })()`);
  const liveH = (id) => q(`(() => { const b = window.wrizoBoard().find((x) => x.id === '${id}'); return b ? b.h : null; })()`);

  for (const [theme, name, cast] of SKINS) {
    // ---- P / A / H / U / M : freeform cards
    await fresh(theme, cast);
    await q(`window.wrizoCreateJournalPage({ id: 'sb-board', text: 'Sized by hand', pageType: 'board', boxes: ${JSON.stringify(SEED)}, createdAt: new Date().toISOString(), origin: null }); window.wrizoFlushNow()`);
    await sleep(400);
    await q("location.hash = '#/page/sb-board'");
    await waitSoft("document.querySelectorAll('.board-box[data-kind=text]').length === 4", { label: 'board', timeout: 12000 });
    await waitSoft("document.fonts.status === 'loaded'", { label: 'fonts', timeout: 15000 });
    await sleep(4500);
    const s0 = await q(STORED('sb-board'));
    const same = SEED.every((s) => { const o = byId(s0, s.id); return o && near(o.x, s.x) && near(o.y, s.y) && near(o.h, s.h) && o.mark === !!s.sizedByHand; });
    ok(`P [${name}]: after a plain open the stored x / y / h / mark of every card are exactly the seed's`, same, JSON.stringify(s0));
    ok(`P [${name}]: the hand-sized and the untouched cards are still their seeded height on screen (nothing shrank on open)`, near(await liveH('sb-hand'), 0.6) && near(await liveH('sb-old'), 0.3), `${await liveH('sb-hand')} / ${await liveH('sb-old')}`);

    await editText('sb-auto', SHORT);
    await sleep(4500);
    const s1 = await q(STORED('sb-board'));
    const a1 = byId(s1, 'sb-auto');
    ok(`A [${name}]: the auto card SHRINKS to its content once its words are cut (was 0.2+ for a long answer; now a few words), on screen and stored`, a1 && a1.h < 0.1 && (await liveH('sb-auto')) < 0.1, `stored ${a1 && a1.h}, live ${await liveH('sb-auto')}`);
    ok(`A [${name}]: shrinking the auto card did not mark it (auto stays absent)`, a1 && !a1.mark);

    await editText('sb-hand', SHORT);
    await sleep(4500);
    const s2 = await q(STORED('sb-board'));
    const h2 = byId(s2, 'sb-hand');
    ok(`H [${name}]: the hand-sized card KEEPS its size when its words are cut (0.6), and keeps its mark`, h2 && near(h2.h, 0.6) && h2.mark && near(await liveH('sb-hand'), 0.6), JSON.stringify(h2));
    const o2 = byId(s2, 'sb-old');
    ok(`U [${name}]: the card nobody touched keeps its seeded height after OTHER cards were edited`, o2 && near(o2.h, 0.3) && !o2.mark && near(await liveH('sb-old'), 0.3), JSON.stringify(o2));

    // M - a resize by hand sets the mark; back to fit clears it
    const f0 = await fitPx('sb-fit');
    await dragHandle('sb-fit', 0, 90);
    await sleep(4500);
    const m1 = byId(await q(STORED('sb-board')), 'sb-fit');
    ok(`M [${name}]: a resize by hand SETS sizedByHand (stored) and the card is taller`, m1 && m1.mark && m1.h > 0.12 + 0.03, JSON.stringify(m1));
    const f1 = await fitPx('sb-fit');
    const want = Math.max(f1.nat, f1.floor) - f1.cur;   // the drag that lands the card back on its content height
    await dragHandle('sb-fit', 0, Math.round(want));
    await sleep(4500);
    const m2 = byId(await q(STORED('sb-board')), 'sb-fit');
    const f2 = await fitPx('sb-fit');
    ok(`M [${name}]: resizing back to the content height CLEARS the mark (the key is gone from storage)`, m2 && !m2.mark && !m2.keys.includes('sizedByHand') && Math.abs(f2.cur - Math.max(f2.nat, f2.floor)) <= 3, `${JSON.stringify(m2)} fit ${JSON.stringify(f2)}`);
    const keysOk = (await q(STORED('sb-board'))).every((b) => { const seed = SEED.find((s) => s.id === b.id); const want2 = Object.keys(seed).concat(b.mark && !seed.sizedByHand ? ['sizedByHand'] : []).sort().join(); return b.keys === want2; });
    ok(`M [${name}]: no key besides sizedByHand appears on any stored card`, keysOk, JSON.stringify(await q(STORED('sb-board'))));

    // ---- D : a dealt deck
    await fresh(theme, cast);
    await q(`(() => { const p = window.wrizoCreateProject('Sized', 'creative'); window.wrizoCreateJournalPage({ id: 'sd-board', text: 'Sized', pageType: 'board', projectId: p.id, boxes: [], origin: 'project', source: 'page' }); window.wrizoFlushNow(); })()`);
    await sleep(400);
    await q("location.hash = '#/page/sd-board'");
    await waitSoft("!!document.querySelector('.board-canvas')", { label: 'board' });
    await sleep(900);
    await click(".wz-beginnings[data-beginnings=board] .wz-beginning[data-beginning='loadDeck']");
    await waitSoft("!!document.querySelector('.deck-wizard-dialog')", { label: 'wizard', timeout: 6000 });
    await q("(document.querySelector('.forms-row[data-deck-id=\"thesis\"]') || document.querySelector('[data-deck-id=\"thesis\"]'))?.click()"); await sleep(500);
    await q("document.querySelector('[data-option-id=\"humanities\"]')?.click()"); await sleep(1200);
    await waitSoft("document.querySelectorAll('.board-box[data-kind=text]').length === 9", { label: 'nine cards', timeout: 6000 });
    await waitSoft("document.fonts.status === 'loaded'", { label: 'fonts', timeout: 15000 });
    await sleep(800);
    const geo = () => q(`window.wrizoBoard().filter((b) => b.kind === 'text' && !b.deletedAt).map((b) => ({ id: b.id, step: b.deckStep && b.deckStep.step, y: b.y, h: b.h, x: b.x }))`);
    const dealt = await geo();
    const meth = dealt.find((c) => c.step === 'methodology');
    const lit = dealt.find((c) => c.step === 'literature-review') || dealt.find((c) => c.y > meth.y && Math.abs(c.x - meth.x) < 1e-6);
    await editText(meth.id, LONG);
    await sleep(1500);
    const grown = await geo();
    const gm = byId(grown, meth.id), gl = byId(grown, lit.id);
    ok(`D [${name}]: a long answer GROWS Methodology and carries the card under it down (bug 32 still holds)`, gm.h > meth.h + 0.02 && gl.y > lit.y + 0.02, `h ${meth.h} -> ${gm.h}; under it y ${lit.y} -> ${gl.y}`);
    await editText(meth.id, SHORT);
    await sleep(1500);
    const back = await geo();
    const bm = byId(back, meth.id), bl = byId(back, lit.id);
    ok(`D [${name}]: cutting the answer back SHRINKS Methodology to the deal's own card height`, Math.abs(bm.h - meth.h) < 0.004, `h ${meth.h} -> grown ${gm.h} -> ${bm.h}`);
    ok(`D [${name}]: ... and the card under it comes back UP to where the deal put it`, Math.abs(bl.y - lit.y) < 0.004, `y ${lit.y} -> grown ${gl.y} -> ${bl.y}`);
    const sameRow = back.filter((c) => Math.abs(c.y - bm.y) < 1e-4);
    ok(`D [${name}]: Methodology's row-mates are back to the lattice height with it (one band)`, sameRow.every((c) => Math.abs(c.h - meth.h) < 0.004), JSON.stringify(sameRow.map((c) => c.h)));
    await sleep(4500);
    const sA = await q(STORED('sd-board'));
    await app.reload();
    await waitSoft("document.querySelectorAll('.board-box[data-kind=text]').length === 9", { label: 'board again', timeout: 15000 });
    await waitSoft("document.fonts.status === 'loaded'", { label: 'fonts', timeout: 15000 });
    await sleep(4500);
    const sB = await q(STORED('sd-board'));
    ok(`D [${name}]: a reload and a plain open leave the stored x / y / h of every dealt card exactly as it was`, sA && sB && sA.length === sB.length && sA.every((o) => { const n = byId(sB, o.id); return n && near(n.x, o.x) && near(n.y, o.y) && near(n.h, o.h); }), JSON.stringify([sA && sA.map((c) => c.h), sB && sB.map((c) => c.h)]));
  }
}).catch((e) => { ok('harness ran to a verdict', false, String((e && e.stack) || e)); });

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? '  ' + String(c.detail).slice(0, 420) : ''}`);
console.log(failed.length ? `SIZED-BY-HAND VERIFY: FAIL (${failed.length} of ${checks.length})` : `SIZED-BY-HAND VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
