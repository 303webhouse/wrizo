// TYPEWRITER FADE ORDER (Nick's live session, 2026-10-10, screenshot: "lines fade out of order - a newer line dims while the older
// one above it stays dark"). The fade is history riding UP into the page: the OLDER a visible line, the FAINTER it must be.
//
// WHAT THIS MEASURES - what the renderer applies, not a model of it: the computed `mask-image` of `.mode-scroll` (the container
// fade, index.css), parsed into its stops with every length resolved, sampled at the vertical centre of each visible line of the
// page's own text (the editor's line boxes, from a Range over its text). The mask's alpha IS the line's ink strength.
// THE CLAIM: on a typewriter page that has scrolled, alpha never DECREASES going down the page - no newer line is fainter than an
// older one above it - and the topmost visible line is the faintest of all.
// Reproduced first on main @ d2fcb38 (FX5 S1(b)'s opaque lead-in made the top line fully shown and the next lines faint).
// Run: node scripts/harness/typewriter-fade.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const LINES = Array.from({ length: 30 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the history that rides up into the page.`).join('\n');

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'twf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/twf'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
  await sleep(600);
  // the writer is at the end of their text, typing: the typewriter holds the active line low and the history scrolls up
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  await app.typeKeys(' and on');
  try { await app.waitFor("document.querySelector('.mode-scroll')?.dataset.scrolled === 'true'", { label: 'the history has scrolled', timeout: 6000 }); } catch { /* reported */ }
  await sleep(1200);   // past the smooth per-line scroll

  const m = await app.evalJs(`(() => {
    const scroll = document.querySelector('.mode-scroll');
    const ed = document.querySelector('${ED}');
    if (!scroll || !ed) return { missing: true };
    const cs = getComputedStyle(scroll);
    const mask = cs.webkitMaskImage || cs.maskImage || '';
    const box = scroll.getBoundingClientRect();
    // the gradient's stops, every length resolved: "rgb(0, 0, 0) 0px" / "rgba(0, 0, 0, 0.15) 28px" / "... calc(28px + 84px)"
    const px = (t) => { t = t.trim(); const c = t.match(/^calc\\((.*)\\)$/); if (c) return c[1].split('+').reduce((a, p) => a + parseFloat(p), 0); return parseFloat(t); };
    const inner = (mask.match(/linear-gradient\\((.*)\\)\\s*$/) || [])[1] || '';
    const parts = []; let depth = 0, cur = '';
    for (const ch of inner) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) parts.push(cur.trim());
    const stops = [];
    for (const p of parts) {
      const col = p.match(/^(rgba?\\([^)]*\\)|#[0-9a-f]+)\\s*(.*)$/i);
      if (!col) continue;   // the direction ("to bottom"), if present
      const nums = (col[1].match(/[\\d.]+/g) || []).map(Number);
      const alpha = col[1].startsWith('rgba') ? nums[3] : 1;
      stops.push({ alpha, at: px(col[2] || '0px') });
    }
    const alphaAt = (y) => {
      if (!stops.length) return 1;
      if (y <= stops[0].at) return stops[0].alpha;
      for (let i = 1; i < stops.length; i++) {
        const a = stops[i - 1], b = stops[i];
        if (y <= b.at) return b.at === a.at ? b.alpha : a.alpha + (b.alpha - a.alpha) * ((y - a.at) / (b.at - a.at));
      }
      return stops[stops.length - 1].alpha;
    };
    // the page's own line boxes, top to bottom, the ones on screen in the box
    const r = document.createRange(); r.selectNodeContents(ed);
    const tops = [];
    for (const rc of r.getClientRects()) {
      if (rc.height < 4 || rc.bottom <= box.top || rc.top >= box.bottom) continue;
      const mid = Math.round((rc.top + rc.bottom) / 2);
      if (!tops.some((t) => Math.abs(t - mid) < 4)) tops.push(mid);
    }
    tops.sort((a, b) => a - b);
    const lines = tops.map((mid) => ({ y: Math.round(mid - box.top), alpha: Math.round(alphaAt(mid - box.top) * 1000) / 1000 }));
    return { scrolled: scroll.dataset.scrolled, typewriter: scroll.dataset.typewriter, mask, stops, lines };
  })()`);

  const lines = (m && m.lines) || [];
  const inversions = [];
  for (let i = 1; i < lines.length; i++) if (lines[i].alpha < lines[i - 1].alpha - 0.01) inversions.push({ older: lines[i - 1], newer: lines[i] });
  ok('(premise) the page is a typewriter page whose history has scrolled, with a fade mask and several lines on screen',
    !!m && !m.missing && m.typewriter === 'true' && m.scrolled === 'true' && (m.stops || []).length >= 2 && lines.length >= 6, JSON.stringify({ typewriter: m && m.typewriter, scrolled: m && m.scrolled, stops: m && m.stops, lines: lines.length }));
  ok('THE ORDER: going down the page no line is fainter than the older line above it (Nick: "a newer line dims while the older one above it stays dark")',
    lines.length >= 6 && inversions.length === 0, JSON.stringify({ inversions: inversions.slice(0, 4), lines: lines.slice(0, 8) }));
  const minAlpha = lines.length ? Math.min(...lines.map((l) => l.alpha)) : null;
  ok('THE OLDEST IS THE FAINTEST: the topmost visible line carries the lowest strength of all, and it is genuinely faded (< 0.5)',
    lines.length >= 6 && lines[0].alpha === minAlpha && lines[0].alpha < 0.5, JSON.stringify({ top: lines[0], minAlpha }));
  ok('THE NEWEST IS WHOLE: the last visible line (where the writer is) is fully shown',
    lines.length >= 6 && lines[lines.length - 1].alpha >= 0.99, JSON.stringify(lines[lines.length - 1]));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nTYPEWRITER-FADE VERIFY: PASS (${checks.length} checks)` : `\nTYPEWRITER-FADE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
