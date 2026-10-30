// POLISH #10 ITEM 12 (INK), LIVE (a box turn): "boards and cards the same size in every skin" (Nick's law: a skin changes only the skin). THE SAME board is opened in Arbor, Flux and Machina (dark + light) and every
// card's rect, the gaps between cards, and the board's padding (canvas inside its wrap) are compared to Arbor dark's: identical within 1 px. Seeded through the app's own seams (never raw storage).
// Written BEFORE the fix: red on main means "a skin changes more than the skin"; the failing detail names which number moved, by how much, in which skin.
// Run: node scripts/harness/polish10-12-part2.mjs [outDir]   (a box turn; with outDir it also writes a frame per skin)
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || null;
if (out) fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');
const TOL = 1;

// The board: four short cards in a grid and one long one (the auto-grow case: content that must not make a skin's card taller than another skin's).
const CARDS = [
  { id: 'g1', x: 0.04, y: 0.04, w: 0.26, h: 0.14, text: 'Hook\nShe waits.' },
  { id: 'g2', x: 0.36, y: 0.04, w: 0.26, h: 0.14, text: 'Midpoint\nThe door opens.' },
  { id: 'g3', x: 0.68, y: 0.04, w: 0.26, h: 0.14, text: 'Darkest Point\n' },
  { id: 'g4', x: 0.04, y: 0.26, w: 0.26, h: 0.14, text: 'Climax\nAll of it at once, the whole house, every light.' },
  { id: 'g5', x: 0.36, y: 0.26, w: 0.26, h: 0.14, text: 'Final Image\nShe leaves the porch light on and walks down the long road toward the water without once looking back at the house she grew up in.' },
  // The skin-dependent wrap case: a long FIRST line (Flux sets the first line in letter-spaced capitals, so it can wrap where Arbor's does not) over a short body.
  { id: 'g6', x: 0.68, y: 0.26, w: 0.26, h: 0.14, text: 'The Long Walk Home Before The Rain Comes\nShe stops.' },
  { id: 'g7', x: 0.04, y: 0.5, w: 0.26, h: 0.14, text: 'Everything She Left Behind At The Old Porch\nShe stops. She turns back once more to look at the light.' },
];

const measured = {};   // `${skin} ${tone}` -> { wrap, canvas, cards: { id: rect } }

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const guard = async (name, fn) => { try { await fn(); } catch (e) { ok(`${name}: the section ran to the end`, false, String((e && e.message) || e).slice(0, 220)); } };
  const fresh = async (theme, tone) => {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme && window.wrizoTheme.set('${theme}')`);
    await q(`window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${tone}' })`);
    await sleep(400);
  };
  const seed = async () => {
    await q(`(() => { const d = window.wrizoCreateDrawer('The Well'); const p = window.wrizoCreateProject('The Well', 'creative'); window.wrizoSetProjectDrawer(p.id, d.id);
      const cards = ${JSON.stringify(CARDS)}.map((c, i) => ({ id: c.id, kind: 'text', x: c.x, y: c.y, w: c.w, h: c.h, z: i + 1, text: c.text }));
      const meta = { id: 'gm', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: 'open' };
      window.wrizoCreateJournalPage({ id: 'p12-board', text: 'Geometry', pageType: 'board', projectId: p.id, boxes: [...cards, meta], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
      window.wrizoFlushNow(); })()`);
    await sleep(500);
  };

  for (const theme of ['plateau', 'flux', 'machina']) {
    for (const tone of ['dark', 'light']) {
      const skin = theme === 'plateau' ? 'Arbor' : theme === 'flux' ? 'Flux' : 'Machina';
      await guard(`${skin} ${tone}`, async () => {
        await fresh(theme, tone);
        await seed();
        await q("location.hash = '#/page/p12-board'");
        await waitSoft("!!document.querySelector('.board-box')", { label: 'board', timeout: 8000 });
        await sleep(1200);
        // the theme's writing face loads lazily: measure only once it is IN (a slower machine measured the fallback face, which wraps differently)
        await waitSoft("document.fonts.status === 'loaded' && document.fonts.check('15px ' + getComputedStyle(document.querySelector('.board-text')).fontFamily)", { label: 'card font loaded', timeout: 10000 });
        await sleep(400);
        measured[`${skin} ${tone}`] = await q(`(() => { const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; };
          const cards = {}; document.querySelectorAll('.board-box').forEach((e) => { cards[e.getAttribute('data-box-id')] = R(e); });
          const tx = document.querySelector('.board-text'); const fam = tx ? getComputedStyle(tx).fontFamily : ''; const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')).filter((v, i, arr) => arr.indexOf(v) === i).join(','); const g4 = document.querySelector('[data-box-id="g4"] .board-text'); const lines = (n) => { if (!n) return null; const r = document.createRange(); const out = []; let top = null; let cur = ''; const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) { for (let i = 0; i < t.length; i++) { r.setStart(t, i); r.setEnd(t, i + 1); const rc = r.getClientRects()[0]; if (!rc) continue; if (top === null || Math.abs(rc.top - top) > 4) { if (cur) out.push(cur); cur = ''; top = rc.top; } cur += t.data[i]; } } if (cur) out.push(cur); return out; }; const cs4 = g4 ? getComputedStyle(g4) : null; const fl4 = g4 ? getComputedStyle(g4, '::first-line') : null; const diag = { fam, loaded, g4sh: g4 ? g4.scrollHeight : null, g4cw: g4 ? g4.clientWidth : null, fs: cs4 && cs4.fontSize, lh: cs4 && cs4.lineHeight, ls: cs4 && cs4.letterSpacing, flfs: fl4 && fl4.fontSize, flls: fl4 && fl4.letterSpacing, fltt: fl4 && fl4.textTransform, flff: fl4 && fl4.fontFamily, flfw: fl4 && fl4.fontWeight, lines: lines(g4), html: g4 ? g4.innerHTML.slice(0, 300) : null, kids: g4 ? [...g4.children].map((k) => { const r = k.getBoundingClientRect(); return [k.tagName, k.className, Math.round(r.top * 10) / 10, Math.round(r.height * 10) / 10]; }) : null, box: g4 ? (() => { const r = g4.getBoundingClientRect(); const c = getComputedStyle(g4); return [r.top, r.height, g4.clientHeight, g4.offsetHeight, g4.scrollWidth, c.overflowY, c.paddingTop, c.paddingBottom, c.minHeight, c.height]; })() : null, par: g4 ? (() => { const q = g4.closest('.board-box'); const r = q.getBoundingClientRect(); const c = getComputedStyle(q); return [r.height, c.height, c.minHeight, q.style.height]; })() : null };
          return { wrap: R(document.querySelector('.board-canvas-wrap')), canvas: R(document.querySelector('.board-canvas')), cards, diag }; })()`);
        console.log('DIAG', skin, tone, JSON.stringify(measured[`${skin} ${tone}`].diag));
        if (out) fs.writeFileSync(path.join(out, `p12-${skin.toLowerCase()}-${tone}.png`), Buffer.from(await app.screenshot(), 'base64'));
      });
    }
  }
});

const base = measured['Arbor dark'];
const near = (a, b) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= TOL;
if (!base || !base.cards || !base.cards.g1) ok('Arbor dark (the baseline) measured', false, JSON.stringify(base)?.slice(0, 200));
else {
  ok('Arbor dark (the baseline) measured: 5 cards on the board', Object.keys(base.cards).length >= 5, `${Object.keys(base.cards).length} cards`);
  for (const [key, m] of Object.entries(measured)) {
    if (key === 'Arbor dark') continue;
    if (!m || !m.cards) { ok(`[${key}] measured`, false, 'no measurement'); continue; }
    const cardDiffs = CARDS.map((c) => { const a = base.cards[c.id], b = m.cards[c.id]; return !a || !b ? `${c.id}: missing` : (near(a.w, b.w) && near(a.h, b.h)) ? null : `${c.id}: ${a.w.toFixed(1)}x${a.h.toFixed(1)} -> ${b.w.toFixed(1)}x${b.h.toFixed(1)}`; }).filter(Boolean);
    ok(`[${key}] every card's width and height equals Arbor's (+-${TOL} px)`, cardDiffs.length === 0, cardDiffs.join(' | ') + (cardDiffs.length ? ` || font ${JSON.stringify(m.diag)}` : ''));
    const gap = (mm, a, b) => mm.cards[b].l - (mm.cards[a].l + mm.cards[a].w);
    const gapRow = (mm) => mm.cards.g1 && mm.cards.g2 ? gap(mm, 'g1', 'g2') : NaN;
    const gapCol = (mm) => mm.cards.g1 && mm.cards.g4 ? mm.cards.g4.t - (mm.cards.g1.t + mm.cards.g1.h) : NaN;
    ok(`[${key}] the gaps between cards equal Arbor's (side by side ${gapRow(base).toFixed(1)}, stacked ${gapCol(base).toFixed(1)})`, near(gapRow(base), gapRow(m)) && near(gapCol(base), gapCol(m)), `side ${gapRow(m).toFixed(1)}, stacked ${gapCol(m).toFixed(1)}`);
    const pad = (mm) => mm.canvas && mm.wrap ? [mm.canvas.l - mm.wrap.l, mm.canvas.t - mm.wrap.t] : [NaN, NaN];
    const pb = pad(base), pm = pad(m);
    ok(`[${key}] the board's padding (canvas inside its wrap) equals Arbor's`, near(pb[0], pm[0]) && near(pb[1], pm[1]), `Arbor ${pb.map((v) => v.toFixed(1))} vs ${pm.map((v) => v.toFixed(1))}`);
    ok(`[${key}] the board's drawing width equals Arbor's`, !!m.canvas && !!base.canvas && near(base.canvas.w, m.canvas.w), `Arbor ${base.canvas?.w} vs ${m.canvas?.w}`);
  }
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(`MEASURED ${JSON.stringify(measured).slice(0, 1500)}`);
const failed = checks.filter((c) => !c.pass);
console.log(`POLISH10-12 PART 2 VERIFY: ${failed.length ? `FAIL - ${failed.length}/${checks.length}` : `PASS (${checks.length} checks)`}`);
process.exit(failed.length ? 1 : 0);
