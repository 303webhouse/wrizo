// POLISH #10 ITEM 13 (INK), the LIVE half (a box turn): the Outline and Storyboard dress, measured in the real app, Arbor + Flux + Machina, dark + light.
//   13a the title and the text never touch: title input's right edge to the text's left edge >= 8 px (and the title input holds ONLY the title - the #8 data fix stands)
//   13b the stage's left chevron tab (.wz-sliver-grip) is clear of the Outline's first column: grip.right + 8 <= the row number's left
//   13c the Storyboard lane box and its cards are square (computed border-radius 0)
// Run: node scripts/harness/polish10-13-part2.mjs [outDir]   (a box turn; with outDir it also writes the Outline frames)
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || null;
if (out) fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');
const NAMES = ['Hook', 'Midpoint Reversal', 'Darkest Point'];

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(400); return true; };
  const showAs = async (view) => { const strip = await point('.show-as'); if (strip) { await app.mouseMove(strip.x, strip.y); await sleep(500); } return click(`.show-as-btn[data-view="${view}"]`); };
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
      const names = ${JSON.stringify(NAMES)};
      const steps = names.map((n, i) => ({ id: 's' + (i + 1), kind: 'text', x: 0.03 + i * 0.32, y: 0.04, w: 0.28, h: 0.15, z: 1, seq: i + 1, text: n + '\\n' + (i === 0 ? 'She waits.' : ''), prompt: 'What happens at the ' + n + '?', deckStep: { deck: 'three-act', step: 'st' + i } }));
      const meta = { id: 'dm', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: 'walk' };
      window.wrizoCreateJournalPage({ id: 'p13-deck', text: 'Three-Act', pageType: 'board', projectId: p.id, boxes: [...steps, meta], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
      window.wrizoFlushNow(); })()`);
    await sleep(500);
  };
  const open = async (id) => { await q(`location.hash = '#/page/${id}'`); await waitSoft("!!document.querySelector('.show-as, .walk-card, [data-board-projection]')", { label: id, timeout: 8000 }); await sleep(900); };

  for (const theme of ['plateau', 'flux', 'machina']) {
    for (const tone of ['dark', 'light']) {
      const T = `${theme === 'plateau' ? 'Arbor' : theme === 'flux' ? 'Flux' : 'Machina'} ${tone}`;
      await guard(T, async () => {
        await fresh(theme, tone);
        await seed();
        await open('p13-deck');
        // 13a + 13b: the Outline
        await showAs('outline');
        await waitSoft("!!document.querySelector('[data-board-projection=\"outline\"]')", { label: 'outline' });
        await sleep(500);
        const o = await q(`(() => { const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
          const row = document.querySelector('[data-outline-row]'); const inp = row && row.querySelector('.board-outline-text'); const body = row && row.querySelector('.board-outline-body'); const num = row && row.querySelector('.board-outline-num, .board-outline-bullet');
          return { grip: R(document.querySelector('.wz-sliver-grip')), num: R(num), inp: R(inp), body: R(body), inputValue: inp ? inp.value : null }; })()`);
        if (out) { fs.writeFileSync(path.join(out, `p13-outline-${theme}-${tone}.png`), Buffer.from(await app.screenshot(), 'base64')); }
        ok(`[${T}] 13b the chevron tab is clear of the Outline's first column (row number left - grip right >= 8 px)`, !!o.grip && !!o.num && o.num.l - o.grip.r >= 8, JSON.stringify({ grip: o.grip, num: o.num }));
        ok(`[${T}] 13a the title input holds only the title, and the text sits >= 8 px clear of it`, o.inputValue === 'Hook' && !!o.inp && !!o.body && o.body.l - o.inp.r >= 8, JSON.stringify({ value: o.inputValue, inp: o.inp, body: o.body }));
        // 13c: the Storyboard
        await showAs('storyboard');
        await waitSoft("!!document.querySelector('[data-board-projection=\"storyboard\"] .board-lane')", { label: 'storyboard lane', timeout: 6000 });
        const s = await q(`(() => { const rad = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).borderRadius : null; }; return { lane: rad('.board-lane'), card: rad('.board-sb-card') }; })()`);
        ok(`[${T}] 13c the Storyboard lane box and its cards are square`, s.lane === '0px' && s.card === '0px', JSON.stringify(s));
      });
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(`POLISH10-13 PART 2 VERIFY: ${failed.length ? `FAIL - ${failed.length}/${checks.length}` : `PASS (${checks.length} checks)`}`);
process.exit(failed.length ? 1 : 0);
