// POLISH #10, FIX item 19 (Nick's live test of #7, Oct 25): THE TYPEWRITER'S WRITING LINE IS HELD AT THE MIDDLE OF THE VISIBLE PAGE - 50%, not 60% -
// including the first line on a fresh page ("seems too low on the screen to start"). The band's stops move with the anchor.
// RED-FIRST, on page-size-r3 @ 243cf8f0 (the line held at 60%).
//
// Arbor and Flux, 1366x768 and 1920x1080, the zoom:
//   A1 a FRESH page's first line starts at the middle of the page column (its top at 50% of the column, within 3%)
//   A2 writing on, the writing line (the caret's) is held at the middle (its top within one line of 50%)
//   A3 the band is drawn against the same middle: the writing line sits at FULL strength in the column's mask, and the band's top fade ends just above it
// Mutant (Arbor, 1366): MA3 the band's anchor forced to 70% (the hold stays at 50%) - A3 fails.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-anchor.mjs (apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }];
const SIZES = [[1366, 768], [1920, 1080]];

// the column, the first line and the caret's line (screen px), the line height (painted), and the mask's alpha at a column-relative y
const PROBE = `(() => {
  const col = document.querySelector('.mode-pagecol'); const ed = document.querySelector('.forward-only-editor'); if (!col || !ed) return null;
  const box = col.getBoundingClientRect(); const cs = getComputedStyle(col); const mask = String(cs.webkitMaskImage || cs.maskImage || '');
  const len = (s) => { s = String(s || '').trim(); const c = s.match(/^calc\\((.*)\\)$/); const body = c ? c[1] : s; let t = 0; let sign = 1; let ok = false;
    for (const tok of body.split(/\\s+/)) { if (tok === '+') { sign = 1; continue; } if (tok === '-') { sign = -1; continue; } const n = parseFloat(tok); if (!Number.isFinite(n)) continue; t += sign * (tok.endsWith('%') ? (n / 100) * box.height : n); ok = true; sign = 1; } return ok ? t : null; };
  const inner = (mask.match(/linear-gradient\\((.*)\\)\\s*$/) || [])[1] || ''; const parts = []; let depth = 0, cur = '';
  for (const ch of inner) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) parts.push(cur.trim());
  const stops = []; for (const p of parts) { const m = p.match(/^(rgba?\\([^)]*\\)|#[0-9a-f]+|transparent)\\s*(.*)$/i); if (!m) continue; const nums = (m[1].match(/[\\d.]+/g) || []).map(Number);
    const alpha = m[1] === 'transparent' ? 0 : m[1].startsWith('rgba') ? nums[3] : 1; const at = len(m[2] || '0px'); if (at != null) stops.push({ alpha, at }); }
  const alphaAt = (y) => { if (!stops.length) return 1; if (y <= stops[0].at) return stops[0].alpha; for (let i = 1; i < stops.length; i++) { const a = stops[i - 1], b = stops[i]; if (y <= b.at) return b.at === a.at ? b.alpha : a.alpha + (b.alpha - a.alpha) * ((y - a.at) / (b.at - a.at)); } return stops[stops.length - 1].alpha; };
  const rg = document.createRange(); rg.selectNodeContents(ed); const lines = [...rg.getClientRects()].filter((q) => q.height >= 4);
  const s = getSelection(); let cr = null; if (s && s.rangeCount && ed.contains(s.anchorNode)) { const rr = s.getRangeAt(0); const rs = rr.getClientRects(); cr = rs[rs.length - 1] || null;
    if ((!cr || !cr.height) && rr.startContainer.nodeType === 3 && rr.startOffset > 0) { const c2 = document.createRange(); c2.setStart(rr.startContainer, rr.startOffset - 1); c2.setEnd(rr.startContainer, rr.startOffset); const xs = c2.getClientRects(); cr = xs[xs.length - 1] || null; } }
  const page = document.querySelector('.desk-frame-stage--prose .mode-page'); const sc = page && page.offsetWidth ? page.getBoundingClientRect().width / page.offsetWidth : 1;
  const lh = (parseFloat(getComputedStyle(ed).lineHeight) || 27.2) * sc;
  const firstTop = lines.length ? Math.min(...lines.map((q) => q.top)) : null;
  const caretTop = cr && cr.height ? cr.top : null; const caretMid = cr && cr.height ? (cr.top + cr.bottom) / 2 : null;
  const fullFrom = (() => { const i = stops.findIndex((x) => x.alpha >= 0.99); return i < 0 ? null : stops[i].at; })();
  return { zoom: col.getAttribute('data-zoom'), colTop: box.top, colH: box.height, lh, first: firstTop == null ? null : (firstTop - box.top) / box.height, caret: caretTop == null ? null : (caretTop - box.top) / box.height,
    alphaAtCaret: caretMid == null ? null : Math.round(alphaAt(caretMid - box.top) * 1000) / 1000, fullFrom: fullFrom == null ? null : fullFrom / box.height, caretRel: caretTop == null ? null : (caretTop - box.top) / box.height, anchor: cs.getPropertyValue('--tw-anchor').trim() };
})()`;
const openPage = async (app, id) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-pagecol')", { label: id, timeout: 10000 });
  await sleep(1200);
  return there;
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  ok('fixture: the seams are up', true);
  for (const th of THEMES) {
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}')`); await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
    for (const [w, h] of SIZES) {
      const tag = `${th.name} ${w}x${h}`;
      await app.emulateDpr(1, w, h);
      const id = `p10a-${th.id}-${w}`;
      await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: 'One line to start.', createdAt: new Date().toISOString(), origin: null, source: 'page' })})`);
      await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${id}', 'on')`);
      await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
      if (!(await openPage(app, id))) { ok(`${tag} fixture: the page opened`, false, ''); continue; }
      const g1 = await app.evalJs(PROBE);
      ok(`${tag} A1: a FRESH page's first line starts at the middle of the column (its top at ${g1 && g1.first != null ? (g1.first * 100).toFixed(1) : '?'}%, want 50% within 3%)`,
        !!g1 && g1.zoom === 'true' && g1.first != null && Math.abs(g1.first - 0.5) <= 0.03, J(g1));
      await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
      for (let i = 1; i <= 16; i += 1) { await app.typeKeys(`\nLine ${i} of the writing, long enough to be a line.`); await sleep(80); }
      // REVIEW OF TURN 1 (Oct 26): the engine pays a burst back ONE LINE PER GLIDE (each up to 600ms, then a 650ms land check), so 16 lines take
      // seconds to pay; a fixed 1.5s read the staircase mid-way (the same drift on r3: 87-92%). Wait on observable state instead: the scroller still
      // for 1s, capped at 15s - the settle is part of the reading.
      const settle = await (async () => { const t0 = Date.now(); let last = null; let still = 0;
        while (Date.now() - t0 < 15000) { await sleep(200);
          const top = await app.evalJs("(() => { const s = document.querySelector('.mode-scroll'); return s ? Math.round(s.scrollTop) : null; })()");
          if (top != null && top === last) { still += 200; if (still >= 1000) return { ms: Date.now() - t0, top, settled: true }; } else { still = 0; last = top; } }
        return { ms: Date.now() - t0, top: last, settled: false }; })();
      const g2 = { ...(await app.evalJs(PROBE)), settle };
      ok(`${tag} A2: writing on, the writing line is held at the middle (its top at ${g2 && g2.caret != null ? (g2.caret * 100).toFixed(1) : '?'}%, want 50% within one line)`,
        !!g2 && g2.settle.settled && g2.caret != null && Math.abs(g2.caret - 0.5) <= g2.lh / g2.colH + 0.005, J(g2));
      ok(`${tag} A3: the band is drawn against the same middle - the writing line at FULL strength (${g2 && g2.alphaAtCaret}), the top fade ending just above it`,
        !!g2 && g2.alphaAtCaret >= 0.99 && g2.fullFrom != null && g2.fullFrom <= g2.caretRel && g2.caretRel - g2.fullFrom <= 2 * g2.lh / g2.colH, J({ anchor: g2 && g2.anchor, fullFrom: g2 && g2.fullFrom, caret: g2 && g2.caretRel, alpha: g2 && g2.alphaAtCaret }));
      if (th.id === 'plateau' && w === 1366) {
        await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'p10a-ma3'; s.textContent = \".mode-pagecol[data-zoom='true']{ --tw-anchor: 70% !important; }\"; document.head.appendChild(s); return true; })()");
        await sleep(300);
        const gm = await app.evalJs(PROBE);
        await app.evalJs("document.getElementById('p10a-ma3')?.remove()");
        ok(`MA3 (mutant): with the band's anchor forced to 70% (LANDED: --tw-anchor ${gm && gm.anchor}) while the line is held at 50%, A3 fails`,
          !!gm && gm.anchor === '70%' && !(gm.alphaAtCaret >= 0.99 && gm.fullFrom <= gm.caretRel && gm.caretRel - gm.fullFrom <= 2 * gm.lh / gm.colH), J(gm));
      }
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-ANCHOR PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-ANCHOR VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-ANCHOR VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
