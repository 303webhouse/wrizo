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
const twParks = {};   // page-size: the default leg's band observation, for the parked records
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
  // splash-hold (5s, unskippable) runs over every fresh load: wait for it to be GONE before navigating and typing (Fable,
  // 2026-10-12 - the check went red only after splash-hold merged). Whether a writer typing UNDER the splash breaks the
  // typewriter is a separate question, measured by scripts/typewriter-splash-probe.mjs.
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 15000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'twf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/twf'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
  await sleep(600);
  // the writer is at the end of their text, typing: the typewriter holds the active line low and the history scrolls up
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  // ---- SUPERSEDED (Fable, 2026-10-12: the 1f78f860 run left the history at scrollTop 67 of 689, the top line at y=130 - BELOW
  // the 116px band, so no line was inside it and the check passed or failed on nothing). Kept verbatim, no longer run:
  //   await app.typeKeys(' and on');
  //   try { await app.waitFor("document.querySelector('.mode-scroll')?.dataset.scrolled === 'true'", { label: 'the history has scrolled', timeout: 6000 }); } catch { /* reported */ }
  //   await sleep(1200);   // past the smooth per-line scroll
  // ------------------------------------------------------------------
  // The writer goes on writing: eight new lines, each one a real Enter, so the typewriter scrolls the history up a line at a time.
  for (let i = 1; i <= 8; i += 1) { await app.typeKeys(`\nAnd the writer goes on, line ${i} of the new ones.`); await sleep(120); }
  try { await app.waitFor("document.querySelector('.mode-scroll')?.dataset.scrolled === 'true'", { label: 'the history has scrolled', timeout: 6000 }); } catch { /* reported */ }
  await sleep(1200);   // past the smooth per-line scroll
  // Then the writer's own scroll (FX5 S1(c): the writer owns the scroll position) settles the OLDEST visible line inside the first
  // line of the box - the strip FX5's lead-in governed - so the fade band is full and the order bug, if present, cannot hide.
  const aligned = await app.evalJs(`(() => {
    const scroll = document.querySelector('.mode-scroll'); const ed = document.querySelector('${ED}');
    if (!scroll || !ed) return null;
    const box = scroll.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(ed).lineHeight) || 28;
    const r = document.createRange(); r.selectNodeContents(ed); const mids = [];
    for (const rc of r.getClientRects()) { if (rc.height < 4) continue; const mid = (rc.top + rc.bottom) / 2 - box.top; if (!mids.some((m) => Math.abs(m - mid) < 4)) mids.push(mid); }
    mids.sort((a, b) => a - b);
    const first = mids.find((m) => m >= 0);
    if (first == null) return null;
    const before = scroll.scrollTop;
    if (first > lh / 2) scroll.scrollTop = before + (first - lh / 2);
    return { lineHeight: lh, firstCentreBefore: Math.round(first), scrollBefore: Math.round(before), scrollAfter: Math.round(scroll.scrollTop) };
  })()`);
  await sleep(500);

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
    // the scroll's own geometry, recorded on every run so a red names its mechanism (2026-10-12: the top line sat at y=130)
    const lh = parseFloat(getComputedStyle(ed).lineHeight) || null;
    const sel = getSelection(); const cr = sel && sel.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null;
    const geo = { scrollTop: Math.round(scroll.scrollTop), scrollHeight: scroll.scrollHeight, clientHeight: scroll.clientHeight, lineHeight: lh,
      startOffset: cs.getPropertyValue('--tw-start-offset').trim(), paddingTop: cs.paddingTop, fadeStart: cs.getPropertyValue('--tw-fade-start').trim(),
      fadeBand: cs.getPropertyValue('--tw-fade-band').trim(), boxTop: Math.round(box.top), caretY: cr ? Math.round(cr.top - box.top) : null,
      edTop: Math.round(ed.getBoundingClientRect().top - box.top), splash: !!document.querySelector('.wz-splash') };
    return { scrolled: scroll.dataset.scrolled, typewriter: scroll.dataset.typewriter, mask, stops, lines, geo };
  })()`);

  const lines = (m && m.lines) || [];
  const inversions = [];
  for (let i = 1; i < lines.length; i++) if (lines[i].alpha < lines[i - 1].alpha - 0.01) inversions.push({ older: lines[i - 1], newer: lines[i] });
  // ---- PARKED - SUPERSEDED by page-size (Fable + Nick, Oct 23; Cursor's final mockup @ e3c4e462): Typewriter is now the ZOOM, and its fade is ONE
  // band mask on the page COLUMN (.mode-pagecol[data-zoom]) anchored at the writing line - the top-of-box mask on .mode-scroll these five read stands
  // down while zoomed. On the page-size build two went red and three passed BLIND (no mask -> every line alpha 1 -> "no inversion" held vacuously).
  // All five are kept VERBATIM and no longer run; records in this file's parked section; successors (the same five claims, read from the band) follow.
  //
  // ok('(premise) the page is a typewriter page whose history has scrolled, with a fade mask and several lines on screen',
  //   !!m && !m.missing && m.typewriter === 'true' && m.scrolled === 'true' && (m.stops || []).length >= 2 && lines.length >= 6, JSON.stringify({ typewriter: m && m.typewriter, scrolled: m && m.scrolled, stops: m && m.stops, lines: lines.length }));
  // // THE PREMISE THAT MAKES THE ORDER MEASURABLE (Fable, 2026-10-12): at least 3 lines inside the fade band, and the oldest line in
  // // the box's first line (where FX5's lead-in lived). Without it the checks below pass or fail on nothing.
  // const pxOf = (v) => parseFloat(String(v || '').trim()) || 0;
  // const bandEnd = m && m.geo ? pxOf(m.geo.fadeStart) + pxOf(m.geo.fadeBand) : 0;
  // const fadeStart = m && m.geo ? pxOf(m.geo.fadeStart) : 0;
  // const inBand = lines.filter((l) => l.y >= -((m && m.geo && m.geo.lineHeight) || 28) / 2 && l.y <= bandEnd);
  // ok('(premise) the fade band is FULL: at least 3 lines sit inside it, and the oldest visible line sits in the box\'s first line (y < --tw-fade-start)',
  //   bandEnd > 0 && inBand.length >= 3 && lines.length > 0 && lines[0].y < fadeStart,
  //   JSON.stringify({ bandEnd, fadeStart, inBand: inBand.length, top: lines[0] || null, aligned }));
  // ok('THE ORDER: going down the page no line is fainter than the older line above it (Nick: "a newer line dims while the older one above it stays dark")',
  //   lines.length >= 6 && inversions.length === 0, JSON.stringify({ inversions: inversions.slice(0, 4), lines: lines.slice(0, 8) }));
  // const minAlpha = lines.length ? Math.min(...lines.map((l) => l.alpha)) : null;
  // ok('THE OLDEST IS THE FAINTEST: the topmost visible line carries the lowest strength of all, and it is genuinely faded (< 0.5)',
  //   lines.length >= 6 && lines[0].alpha === minAlpha && lines[0].alpha < 0.5, JSON.stringify({ top: lines[0], minAlpha, geo: m && m.geo }));
  // ok('THE NEWEST IS WHOLE: the last visible line (where the writer is) is fully shown',
  //   lines.length >= 6 && lines[lines.length - 1].alpha >= 0.99, JSON.stringify(lines[lines.length - 1]));
  // ------------------------------------------------------------------
  const z = await app.evalJs(`(() => {
    const col = document.querySelector('.mode-pagecol'); const ed = document.querySelector('${ED}');
    if (!col || !ed) return { missing: true };
    const cs = getComputedStyle(col); const mask = cs.webkitMaskImage || cs.maskImage || ''; const box = col.getBoundingClientRect();
    // a stop's position, resolved against the column's own height: "12px", "60%", "calc(60% - 287.2px)", "calc(60% + 63.1px)"
    const len = (s) => { s = String(s || '').trim(); if (!s) return null; const c = s.match(/^calc\\((.*)\\)$/); const body = c ? c[1] : s; let total = 0; let sign = 1; let ok = false;
      for (const tok of body.split(/\\s+/)) { if (tok === '+') { sign = 1; continue; } if (tok === '-') { sign = -1; continue; } const n = parseFloat(tok); if (!Number.isFinite(n)) continue;
        total += sign * (tok.endsWith('%') ? (n / 100) * box.height : n); ok = true; sign = 1; } return ok ? total : null; };
    const inner = (mask.match(/linear-gradient\\((.*)\\)\\s*$/) || [])[1] || '';
    const parts = []; let depth = 0, cur = '';
    for (const ch of inner) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) parts.push(cur.trim());
    const stops = [];
    for (const p of parts) { const col2 = p.match(/^(rgba?\\([^)]*\\)|transparent|#[0-9a-f]+)\\s*(.*)$/i); if (!col2) continue;
      const nums = (col2[1].match(/[\\d.]+/g) || []).map(Number); const alpha = col2[1] === 'transparent' ? 0 : col2[1].startsWith('rgba') ? nums[3] : 1;
      const at = len(col2[2] || '0px'); if (at != null) stops.push({ alpha, at: Math.round(at * 10) / 10 }); }
    const alphaAt = (y) => { if (!stops.length) return 1; if (y <= stops[0].at) return stops[0].alpha;
      for (let i = 1; i < stops.length; i++) { const a = stops[i - 1], b = stops[i]; if (y <= b.at) return b.at === a.at ? b.alpha : a.alpha + (b.alpha - a.alpha) * ((y - a.at) / (b.at - a.at)); }
      return stops[stops.length - 1].alpha; };
    const r = document.createRange(); r.selectNodeContents(ed); const mids = [];
    for (const rc of r.getClientRects()) { if (rc.height < 4 || rc.bottom <= Math.max(box.top, 0) || rc.top >= Math.min(box.bottom, innerHeight)) continue;
      const mid = Math.round((rc.top + rc.bottom) / 2); if (!mids.some((m2) => Math.abs(m2 - mid) < 4)) mids.push(mid); }
    mids.sort((a, b) => a - b);
    // the caret: a collapsed range at a text end has an EMPTY bounding rect (lane 3: wi = -1), so read its last client rect, else the character before it
    const sel = getSelection(); const rg = sel && sel.rangeCount && ed.contains(sel.anchorNode) ? sel.getRangeAt(0) : null;
    let cr = null;
    if (rg) { const rs = rg.getClientRects(); cr = rs[rs.length - 1] || null;
      if ((!cr || !cr.height) && rg.startContainer.nodeType === 3 && rg.startOffset > 0) { const rr = document.createRange(); rr.setStart(rg.startContainer, rg.startOffset - 1); rr.setEnd(rg.startContainer, rg.startOffset); const xs = rr.getClientRects(); cr = xs[xs.length - 1] || null; }
      // the caret at an ELEMENT boundary (turn on 8d3673bd: still wi = -1): the last painted piece of everything from the editor's start up to it
      if (!cr || !cr.height) { const pre = document.createRange(); pre.setStart(ed, 0); pre.setEnd(rg.startContainer, rg.startOffset); const ps = [...pre.getClientRects()].filter((q) => q.height >= 4); cr = ps[ps.length - 1] || null; } }
    const caretMid = cr && cr.height ? (cr.top + cr.bottom) / 2 : null;
    const lines = mids.map((mid) => ({ y: Math.round(mid - box.top), alpha: Math.round(alphaAt(mid - box.top) * 1000) / 1000, writing: caretMid != null && Math.abs(mid - caretMid) < 4 }));
    return { zoom: col.getAttribute('data-zoom'), mask: mask.slice(0, 160), stops, lines, boxH: Math.round(box.height), caret: caretMid == null ? null : Math.round(caretMid - box.top), inEditor: !!rg };
  })()`);
  const zl = (z && z.lines) || [];
  const wi = zl.findIndex((l) => l.writing);
  const upTo = wi >= 0 ? zl.slice(0, wi + 1) : zl;   // the history: the lines from the top down to the writing line
  const zInv = []; for (let i = 1; i < upTo.length; i++) if (upTo[i].alpha < upTo[i - 1].alpha - 0.01) zInv.push({ older: upTo[i - 1], newer: upTo[i] });
  const ramp = upTo.filter((l) => l.alpha > 0.1 && l.alpha < 0.95);
  twParks.band = { zoom: z && z.zoom, stops: z && z.stops && z.stops.length, lines: zl.length, wi, ramp: ramp.length, inversions: zInv.length, top: zl[0] || null, writing: wi >= 0 ? zl[wi] : null };
  ok('(premise) [page-size successor] the page is ZOOMED (Typewriter) with the band mask on the page column - its stops resolved - and several lines on screen, the writing line among them',
    !!z && !z.missing && z.zoom === 'true' && (z.stops || []).length >= 6 && zl.length >= 6 && wi >= 0, JSON.stringify({ zoom: z && z.zoom, caret: z && z.caret, inEditor: z && z.inEditor, lines: zl.map((l) => l.y), wi, stops: z && z.stops && z.stops.length }));
  ok('(premise) [page-size successor] the fade is FULL: at least 3 lines of the history sit inside the band\'s ramp (strength between .1 and .95), so the order cannot pass on nothing',
    ramp.length >= 3, JSON.stringify({ ramp: ramp.slice(0, 6) }));
  ok('THE ORDER [page-size successor]: going down the history to the writing line, no line is fainter than the older line above it',
    upTo.length >= 6 && zInv.length === 0, JSON.stringify({ inversions: zInv.slice(0, 4), lines: upTo.slice(0, 10) }));
  const zMin = upTo.length ? Math.min(...upTo.map((l) => l.alpha)) : null;
  ok('THE OLDEST IS THE FAINTEST [page-size successor]: the topmost visible line carries the lowest strength of all, and it is genuinely faded (< 0.5)',
    upTo.length >= 6 && upTo[0].alpha === zMin && upTo[0].alpha < 0.5, JSON.stringify({ top: upTo[0], zMin }));
  ok('THE NEWEST IS WHOLE [page-size successor]: the writing line is fully shown (strength 1)',
    wi >= 0 && zl[wi].alpha >= 0.99, JSON.stringify(wi >= 0 ? zl[wi] : null));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') {
  // PAGE-SIZE (Oct 23) - FIVE parks: the five checks that read .mode-scroll's top-of-box mask, which the zoom's band replaces. Records frozen with
  // their original names; each re-verifies the new truth from the default leg's band observation (twParks.band).
  const b = twParks.band || {};
  const rec = [
    ['(premise) the page is a typewriter page whose history has scrolled, with a fade mask and several lines on screen', b.zoom === 'true' && b.stops >= 6 && b.lines >= 6],
    ['(premise) the fade band is FULL: at least 3 lines sit inside it, and the oldest visible line sits in the box\'s first line (y < --tw-fade-start)', b.ramp >= 3],
    ['THE ORDER: going down the page no line is fainter than the older line above it (Nick: "a newer line dims while the older one above it stays dark")', b.inversions === 0 && b.lines >= 6],
    ['THE OLDEST IS THE FAINTEST: the topmost visible line carries the lowest strength of all, and it is genuinely faded (< 0.5)', !!b.top && b.top.alpha < 0.5],
    ['THE NEWEST IS WHOLE: the last visible line (where the writer is) is fully shown', !!b.writing && b.writing.alpha >= 0.99],
  ].map(([n, p]) => ({ name: `PARKED (was "${n}") - page-size: the zoom's band on the page column replaces .mode-scroll's top-of-box mask; successor reads the band`, pass: !!p, detail: JSON.stringify(b) }));
  for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
  console.log(rec.every((c) => c.pass) ? `\nTYPEWRITER-FADE PARKED: PASS (${rec.length} records) - this FILE parks 5 (page-size, Oct 23)` : `\nTYPEWRITER-FADE PARKED: FAIL - ${rec.filter((c) => !c.pass).length}/${rec.length}`);
}
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nTYPEWRITER-FADE VERIFY: PASS (${checks.length} checks)` : `\nTYPEWRITER-FADE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
