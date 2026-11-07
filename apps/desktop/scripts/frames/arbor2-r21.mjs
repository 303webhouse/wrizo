// ARBOR v2 MOCKUP, ROUND r21 - as named screens for INK's frames job (-f themes=plateau -f screens_file=apps/desktop/scripts/frames/arbor2-r21.mjs).
// Sources: Fable, Nov 4 (r20 rulings: the rhizome must NEVER reshape when a menu opens - plan in page-relative coordinates, seed + words only);
// spec draft 41 §18.6 (Nick's r20 notes: the flash every stem at once at one strength; no glow at night - none on the vines, none around the page,
// the lamp's pool retired; the pergola shade crosses overlapping menus at the page's strength; the recede takes the openers and the scrollbar;
// scrollbars only when needed; the "..." menu's full-screen line >= 4.5:1) and its Judgement 2 (the reach curve). Every check THROWS with its numbers
// and prints them when it passes ("ARBOR-R21 <screen> {...}"). Written red-first (r21 base c664768f).
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-R21 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R21-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const FINISH = "(() => { document.getAnimations().forEach((a) => { try { if (a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)) a.finish(); } catch {} }); return true; })()";
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const words = (n) => Array.from({ length: n }, (_, i) => ['light', 'kettle', 'street', 'table', 'question', 'morning', 'dog', 'answer'][i % 8]).join(' ');
const seedPage = async (app, id, { text = PAGEW, progress = 'words', style = 'bar', goal = null } = {}) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await app.evalJs(`localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: ${JSON.stringify(progress)}, progressStyle: ${JSON.stringify(style)} }))`);
  if (goal) await app.evalJs(`window.wrizoSetWritingGoal(${JSON.stringify(goal)})`);
  await sleep(300);
};
const openPage = async (app, id, opts = {}) => {
  await seedPage(app, id, opts);
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1#/page/${id}')`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page' }); await sleep(900);
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
  await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()");
};
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(700); };
const caretEnd = "(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()";
const typeKeys = async (app, text) => { await app.evalJs(caretEnd); for (const ch of text) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); await sleep(40); } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim() === ${JSON.stringify(text)}); if (b) b.click(); return !!b; })()`);
// colour arithmetic
const parseRgb = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
const over = (top, a, base) => ({ r: base.r + (top.r - base.r) * a, g: base.g + (top.g - base.g) * a, b: base.b + (top.b - base.b) * a, a: 1 });

// what the vines' heads say (level, start, width, ratio), and how many pieces show, in this lap and the kept ones
const VINES = `(() => { const f = document.querySelector('.wz-rhizome-field'); if (!f) return null; const num = (v, k) => Number(v.getAttribute(k));
  const heads = [...f.querySelectorAll('.arbor2-vines > path.arbor2-vine[data-w0]')].map((v) => ({ level: num(v, 'data-level'), x0: num(v, 'data-x0'), y0: num(v, 'data-y0'), w0: num(v, 'data-w0'), ratio: v.hasAttribute('data-ratio') ? num(v, 'data-ratio') : null, under: v.getAttribute('data-under') === 'true', derived: v.getAttribute('data-derived') === 'true' }));
  const past = f.querySelector('.arbor2-vines-past');
  // (report only, after the green leg 41953956122: Undo restored the kept laps but not this lap's growth - the field's own count and fraction)
  return { segs: f.getAttribute('data-segments'), frac: f.getAttribute('data-goal-frac'), start: f.getAttribute('data-start'), vines: f.getAttribute('data-vines'), flash: f.getAttribute('data-flash'), lap: f.getAttribute('data-lap'), n: f.querySelectorAll('.arbor2-vines > path.arbor2-vine').length,
    pastN: past ? past.querySelectorAll('path.arbor2-vine').length : 0, pastOp: past ? Number(getComputedStyle(past).opacity) : null, heads,
    sig: heads.map((h) => [h.level, Math.round(h.x0), Math.round(h.y0), Math.round(h.w0 * 100)].join(':')).join('|') }; })()`;


// ---- r21 reads ----
// the vines' heads with everything r21 writes on them (svg coordinates), and the room they reach into
const HEADS = `(() => { const f = document.querySelector('.wz-rhizome-field'); if (!f) return null; const num = (v, k) => v.hasAttribute(k) ? Number(v.getAttribute(k)) : null;
  const heads = [...f.querySelectorAll('.arbor2-vines > path.arbor2-vine[data-w0]')].map((v) => ({ stem: num(v, 'data-stem'), level: num(v, 'data-level'), t0: num(v, 'data-t0'), reach: num(v, 'data-reach'), full: num(v, 'data-full'),
    x0: num(v, 'data-x0'), y0: num(v, 'data-y0'), ex: num(v, 'data-ex'), ey: num(v, 'data-ey'), vx: num(v, 'data-vx'), vy: num(v, 'data-vy'), parent: num(v, 'data-parent'), join: num(v, 'data-join'), w0: num(v, 'data-w0'), bent: v.getAttribute('data-bent') === 'true', exit: num(v, 'data-exit') }));
  const sb = f.getBoundingClientRect(), box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left - sb.left, t: r.top - sb.top, r: r.right - sb.left, b: r.bottom - sb.top }; };
  const rail = box(document.querySelector('.desk-frame-strip')), bar = box([...document.querySelectorAll('.chrome-top.sprint-nav')].find((b) => b.getBoundingClientRect().height > 0)), page = box(document.querySelector('.mode-page'));
  return { heads, rail, bar, page, w: sb.width, h: sb.height, start: f.getAttribute('data-start'), flash: f.getAttribute('data-flash'),
    sig: heads.map((h) => [h.stem, h.level, Math.round(h.x0), Math.round(h.y0), Math.round(h.ex), Math.round(h.ey), Math.round((h.reach || 0) * 100)].join(':')).join('|') }; })()`;
const mainsOf = (v) => v.heads.filter((h) => h.level === 0 && (h.full ?? 0) > 60);
const expectReach = (p, t0) => Math.pow(Math.max(0, Math.min(1, (p - t0) / (1 - t0))), 0.75);
const outside = (h, page) => h.vx < page.l || h.vx > page.r || h.vy < page.t || h.vy > page.b;
const growTo = async (app, id, n) => { await openPage(app, id, { text: words(n), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(7000); await app.evalJs(FINISH); };

const screens = {
  // ── the rhizome NEVER reshapes when a menu opens or the chrome comes back (Fable, Nov 4): the plan is the seed and the words only ────────────
  'r21-no-reshape': async (app) => {
    await growTo(app, 'arbor-r21-shape', 40);
    const a = await app.evalJs(HEADS);
    const steps = {};
    const read = async (label) => { await sleep(700); await app.evalJs(FINISH); steps[label] = await app.evalJs(HEADS); };
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await read('chromeBack');
    await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await read('tools');
    await app.evalJs("(() => { const g = document.querySelector('.wz-tutor-grip'); if (g && g.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await read('tutor');
    await clickText(app, '.arbor2-bar-head', 'Mood ▸'); await read('mood');
    await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await read('themes');
    const ok = { drawn: !!a && a.heads.length > 3 };
    for (const [k, v] of Object.entries(steps)) ok[k] = !!v && v.sig === a.sig && v.start === a.start;
    if (Object.values(ok).some((x) => !x)) fail('R21-NO-RESHAPE', { ok, heads: a && a.heads.length, diff: Object.fromEntries(Object.entries(steps).map(([k, v]) => [k, v && v.sig === a.sig ? 'same' : (v ? v.sig.slice(0, 120) : null)])), was: a && a.sig.slice(0, 120) });
    say('r21-no-reshape', { ok, heads: a.heads.length });
  },

  // ── the reach curve (spec §18.6 Judgement 2) ─────────────────────────────────────────────────────────────────────────────────────────────
  'r21-reach': async (app) => {
    const at = {};
    for (const n of [29, 51]) { await growTo(app, `arbor-r21-reach-${n}`, n); at[n] = await app.evalJs(HEADS); }
    const half = at[29], late = at[51];
    const p = { 29: 30 / 60, 51: 52 / 60 };
    // (instrument fix after the red leg 41979863811: on a build without reach data the main-stem list was empty and every() passed on nothing)
    const curve = (v, pp) => mainsOf(v).length >= 9 && mainsOf(v).every((h) => h.t0 != null && Math.abs(h.reach - expectReach(pp, h.t0)) <= 0.012);
    // (r21, Fable Nov 5) the paced reach at p = 0.5: max(curve, exit), every main stem carrying its exit
    const pacedAtHalf = (v, pp) => mainsOf(v).length >= 9 && mainsOf(v).every((h) => h.t0 != null && h.exit != null && h.exit > 0 && Math.abs(h.reach - Math.min(1, Math.max(expectReach(pp, h.t0), h.exit))) <= 0.012);
    const t0s = mainsOf(late).map((h) => h.t0).sort((x, y) => x - y);
    const even = t0s.length >= 9 && Math.abs(t0s[0]) < 1e-6 && Math.abs(t0s[t0s.length - 1] - 0.27) < 0.002 && t0s.every((t, i) => i === 0 || Math.abs((t - t0s[i - 1]) - 0.27 / (t0s.length - 1)) < 0.002);
    // the full reach: along x to the rail / the window's edge (side stems), along y to the bar / the window's bottom (up and down)
    // (instrument fix after leg 41981547477: the room is the field's own box, as the build reads it - the rail's edge and the bar's bottom clamped
    // to the field; unclamped, at 1920 the rail at -16 and the bar at about -56 read in-range ends as 94-154 px short)
    const room = late && { left: late.rail ? Math.max(0, late.rail.r) : 0, right: late.w, top: late.bar ? Math.max(0, late.bar.b) : 0, bottom: late.h, cx: (late.page.l + late.page.r) / 2, cy: (late.page.t + late.page.b) / 2 };
    // (instrument fix after the green leg 41980389025: side / up-down by the stem's own direction, start -> end, as the build aims it - from the page's
    // centre a stem near 45 deg could read the other way)
    const ends = late ? mainsOf(late).map((h) => { const dx = h.ex - h.x0, dy = h.ey - h.y0; const side = Math.abs(dx) >= Math.abs(dy);
      const short = side ? (dx < 0 ? h.ex - room.left : room.right - h.ex) : (dy < 0 ? h.ey - room.top : room.bottom - h.ey);
      return { side, short: Math.round(short) }; }) : [];
    const fullOk = ends.length > 0 && ends.every((e) => e.side ? (e.short >= 59 && e.short <= 151) : (e.short >= 19 && e.short <= 61));
    const byStem = new Map((late ? late.heads : []).map((h) => [h.stem, h]));
    const kids = late ? late.heads.filter((h) => h.level > 0 && byStem.has(h.parent)) : [];
    const branchLen = kids.length > 0 && kids.every((h) => { const r = h.full / byStem.get(h.parent).full; return r >= 0.349 && r <= 0.601; });
    const ok = {
      // SUPERSEDED (Fable Nov 5: the shown reach is paced so every stem is off the page by p = 0.5 - at 0.5 it is no longer the bare curve):
      //   curveAtHalf: !!half && curve(half, p[29]), curveLate: !!late && curve(late, p[51]), tenEven: even,
      // successor: at 0.5 the shown reach is the larger of the curve and the stem's exit; at 52/60 the curve, unchanged
      curveAtHalfPaced: !!half && pacedAtHalf(half, p[29]), curveLate: !!late && curve(late, p[51]), tenEven: even,
      // ASSERTED (Fable Nov 5): every main stem off the page by half the goal, at every width
      allOutAtHalf: !!half && mainsOf(half).length >= 9 && mainsOf(half).every((h) => outside(h, half.page)),
      // (restored in full, Fable Nov 4: where the room above / below the page is under ~60 px, the up / down stems bend out through its sides)
      allOutAt52: !!late && mainsOf(late).length >= 9 && mainsOf(late).every((h) => outside(h, late.page)),
      // a bent stem's end stands beyond the page's side, and a stem bends only where the room above (below) the page is under 60 px
      bentRight: !!late && mainsOf(late).filter((h) => h.bent).every((h) => h.ex < late.page.l || h.ex > late.page.r)
        && mainsOf(late).filter((h) => h.bent).every((h) => (h.ey < (late.page.t + late.page.b) / 2 ? late.page.t - room.top : room.bottom - late.page.b) < 60),
      reach85to91: !!late && mainsOf(late).length >= 9 && mainsOf(late).every((h) => h.reach >= 0.85 && h.reach <= 0.91),
      fullReach: fullOk, branches35to60: branchLen,
    };
    // reported, not asserted (§18.6 "every stem has left the page by p = 0.5"): at 1366 x 768 the page fills the height, so the up / down stems and
    // the latest side stems are still under it - handed up with these numbers
    const outAtHalf = half ? { out: mainsOf(half).filter((h) => outside(h, half.page)).length, of: mainsOf(half).length } : null;
    // (report: each main stem's visible tip and end, and the page, after the green leg showed tips under the page at 52/60)
    const upDownOutAt52 = late ? { out: mainsOf(late).filter((h, i) => !ends[i].side && outside(h, late.page)).length, of: ends.filter((e) => !e.side).length } : null;
    const brief = { ok, outAtHalf, halfReach: half && mainsOf(half).map((h) => [h.reach, h.exit]), upDownOutAt52, bent: late && mainsOf(late).filter((h) => h.bent).length, mains: late && mainsOf(late).length, t0s, ends, reachLate: late && mainsOf(late).map((h) => h.reach), kids: kids.length,
      page: late && late.page, tips: late && mainsOf(late).map((h) => [Math.round(h.vx), Math.round(h.vy), Math.round(h.ex), Math.round(h.ey), Math.round(h.full)]),
      kidRatios: kids.slice(0, 8).map((h) => Math.round((h.full / byStem.get(h.parent).full) * 100) / 100) };
    if (Object.values(ok).some((x) => !x)) fail('R21-REACH', brief);
    say('r21-reach', brief);
  },

  // ── no hard cut at the field's top / bottom (Fable Nov 5): the vines fade out over the field's last 24 px ─────────────────────────────────
  'r21-edge-fade': async (app) => {
    await growTo(app, 'arbor-r21-edge', 51);
    const r = await app.evalJs(`(() => { const f = document.querySelector('.wz-rhizome-field'); if (!f) return null; const h = f.getBoundingClientRect().height;
      const rect = f.querySelector('#wz-rhizome-mask > rect'), g = f.querySelector('#arbor2-edge-fade');
      const stops = g ? [...g.querySelectorAll('stop')].map((x) => [Number(x.getAttribute('offset')) * h, getComputedStyle(x).stopColor]) : null;
      const vines = f.querySelector('.arbor2-vines'), masked = !!vines && vines.closest('g[mask]')?.getAttribute('mask') === 'url(#wz-rhizome-mask)';
      // the vines that reach the field's top or bottom band (svg coordinates): the fade must cover them
      let nearEdge = 0; for (const p of f.querySelectorAll('.arbor2-vines path.arbor2-vine')) { const b = p.getBBox(); if (b.y < 24 || b.y + b.height > h - 24) nearEdge++; }
      return { h, fill: rect && rect.getAttribute('fill'), stops, masked, nearEdge }; })()`);
    const black = (c) => /rgb\(0, 0, 0\)/.test(String(c)), white = (c) => /rgb\(255, 255, 255\)/.test(String(c));
    const ok = {
      read: !!r,
      maskFades: !!r && r.fill === 'url(#arbor2-edge-fade)',
      stops24: !!r && !!r.stops && r.stops.length === 4 && Math.abs(r.stops[0][0]) < 0.5 && black(r.stops[0][1]) && Math.abs(r.stops[1][0] - 24) < 0.5 && white(r.stops[1][1])
        && Math.abs(r.stops[2][0] - (r.h - 24)) < 0.5 && white(r.stops[2][1]) && Math.abs(r.stops[3][0] - r.h) < 0.5 && black(r.stops[3][1]),
      vinesMasked: !!r && r.masked,
      // liveness: the fade has something to act on (vines do reach the edge bands)
      vinesReachEdge: !!r && r.nearEdge > 0,
    };
    if (Object.values(ok).some((x) => !x)) fail('R21-EDGE-FADE', { ok, r });
    say('r21-edge-fade', { ok, h: r.h, nearEdge: r.nearEdge });
  },
  'r21-pic-edge-fade': async (app) => { await growTo(app, 'arbor-r21-edge-pic', 51); await hideBar(app); },
  'r21-pic-reach-30': async (app) => { await growTo(app, 'arbor-r21-p30', 29); await hideBar(app); },

  // ── the flash: every stem at ONE strength, in ONE pulse (Nick) ───────────────────────────────────────────────────────────────────────────
  'r21-flash-uniform': async (app) => {
    await growTo(app, 'arbor-r21-flash', 57);
    await typeKeys(app, ' w w');
    await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'flash', timeout: 5000 });
    const f = await app.evalJs(`(() => { const cp = document.querySelector('svg.arbor2-vines-flash'); const fld = document.querySelector('.wz-rhizome-field'); if (!cp) return { copy: false };
      const vs = [...cp.querySelectorAll('.arbor2-vine')]; const groups = [...cp.querySelectorAll('g')].map((g) => Number(getComputedStyle(g).opacity));
      const anims = document.getAnimations().filter((a) => a.effect?.target && (a.effect.target === cp || cp.contains(a.effect.target)));
      return { copy: true, n: vs.length, field: fld.querySelectorAll('.arbor2-vine').length, fills: [...new Set(vs.map((v) => getComputedStyle(v).fill))], fo: [...new Set(vs.map((v) => getComputedStyle(v).fillOpacity))],
        groups: [...new Set(groups)], anims: anims.map((a) => [a.animationName, a.effect.target === cp]), filters: [...new Set([cp, fld, ...vs.slice(0, 50)].map((e) => getComputedStyle(e).filter))] }; })()`);
    const ok = { copyUp: f.copy === true && f.n > 0 && f.n === f.field, oneBrass: !!f.fills && f.fills.length === 1 && f.fills[0] === 'rgb(255, 152, 0)', oneStrength: !!f.fo && f.fo.length === 1 && f.fo[0] === '1',
      noDimGroup: !!f.groups && f.groups.every((g) => g === 1), onePulse: !!f.anims && f.anims.length === 1 && f.anims[0][1] === true, flat: !!f.filters && f.filters.every((x) => x === 'none') };
    if (Object.values(ok).some((x) => !x)) fail('R21-FLASH-UNIFORM', { ok, f });
    say('r21-flash-uniform', { ok, n: f.n });
  },

  // ── no glow at night: none on the vines, none around the page; the lamp's pool retired (Nick) ──────────────────────────────────────────────
  'r21-no-glow': async (app) => {
    await growTo(app, 'arbor-r21-glow', 57);
    await setRoom(app, 'night'); await sleep(500);
    // (instrument fix after the red leg: the Mood menu must be open for its switches to be read - a sibling switch proves it is)
    await clickText(app, '.arbor2-bar-head', 'Mood ▸'); await sleep(300);
    const moodOpen = await app.evalJs("!!document.querySelector('.arbor2-mood-switch[data-mood=\"dim\"]')");
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()"); await sleep(300);
    const r = await app.evalJs(`(() => { const b = getComputedStyle(document.body, '::before'); const page = document.querySelector('.mode-page'); const fld = document.querySelector('.wz-rhizome-field');
      const shadows = getComputedStyle(page).boxShadow; const blurs = (shadows.match(/\\d+(?:\\.\\d+)?px/g) || []).map(parseFloat);
      return { pool: b.backgroundImage, poolAnim: b.animationName, shadow: shadows, focused: page.classList.contains('focused'), fieldFilter: fld ? getComputedStyle(fld).filter : null,
        vineFilters: fld ? [...new Set([...fld.querySelectorAll('.arbor2-vine')].slice(0, 80).map((v) => getComputedStyle(v).filter))] : [], breathSwitch: !!document.querySelector('.arbor2-mood-switch[data-mood="breath"]') }; })()`);
    const blurOf = (s) => { const parts = String(s).split(/,(?![^(]*\))/); return parts.map((p) => { const n = (p.match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat); return n.length >= 3 ? n[2] : 0; }); };
    const ok = { noPool: r.pool === 'none' && (r.poolAnim === 'none' || r.poolAnim === ''), noPageGlow: blurOf(r.shadow).every((b) => b === 0), flatVines: r.fieldFilter === 'none' && r.vineFilters.every((x) => x === 'none'), noBreathSwitch: moodOpen && !r.breathSwitch };
    if (Object.values(ok).some((x) => !x)) fail('R21-NO-GLOW', { ok, r });
    say('r21-no-glow', { ok, r });
  },

  // ── the recede takes the openers and the page's scrollbar; they come back with the chrome ──────────────────────────────────────────────────
  'r21-recede': async (app) => {
    await openPage(app, 'arbor-r21-recede', { text: words(300) });
    await setRoom(app, 'day');
    const R = `(() => { const op = (e) => { let o = 1; for (let n = e; n && n !== document.documentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return Math.round(o * 100) / 100; };
      const g = [...document.querySelectorAll('.wz-sliver-grip, .wz-tutor-grip')].filter((e) => e.getBoundingClientRect().width > 0); const sc = document.querySelector('.mode-scroll');
      return { grips: g.map((e) => [op(e), getComputedStyle(e).pointerEvents]), bar: sc ? getComputedStyle(sc).scrollbarColor : null, scrolls: sc ? sc.scrollHeight > sc.clientHeight + 1 : null, writing: document.documentElement.getAttribute('data-wz-writing') }; })()`;
    const rest = await app.evalJs(R);
    await typeKeys(app, ' w'); await sleep(3500); await app.evalJs(FINISH);
    const wr = await app.evalJs(R);
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(1500); await app.evalJs(FINISH);
    const back = await app.evalJs(R);
    const shown = (x) => x.grips.length === 2 && x.grips.every(([o]) => o === 1), gone = (x) => x.grips.length === 2 && x.grips.every(([o, pe]) => o === 0 && pe === 'none');
    const ok = { restShown: shown(rest), writing: wr.writing === 'true', openersRecede: gone(wr), scrollbarRecedes: /transparent transparent|rgba\(0, 0, 0, 0\) rgba\(0, 0, 0, 0\)/.test(String(wr.bar)), returned: back.writing !== 'true',
      openersBack: shown(back), scrollbarBack: !/transparent transparent|rgba\(0, 0, 0, 0\) rgba\(0, 0, 0, 0\)/.test(String(back.bar)), pageScrolls: rest.scrolls === true };
    if (Object.values(ok).some((x) => !x)) fail('R21-RECEDE', { ok, rest, wr, back });
    say('r21-recede', { ok, rest, wr, back });
  },

  // ── scrollbars only when something scrolls ──────────────────────────────────────────────────────────────────────────────────────────────
  'r21-scrollbars-needed': async (app) => {
    await openPage(app, 'arbor-r21-scroll');
    await setRoom(app, 'day');
    await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g) g.click(); return true; })()"); await sleep(300);
    await app.evalJs("(() => { const g = document.querySelector('.wz-tutor-grip'); if (g) g.click(); return true; })()"); await sleep(600); await app.evalJs(FINISH);
    const r = await app.evalJs(`(() => { const out = []; for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8) continue;
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const vbar = e.offsetWidth - e.clientWidth - (parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth)), hbar = e.offsetHeight - e.clientHeight - (parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth));
      if (vbar > 0.5 && /(auto|scroll)/.test(cs.overflowY) && !(e.scrollHeight > e.clientHeight + 1)) out.push(['v', String(e.className).split(' ')[0], cs.overflowY, e.scrollHeight, e.clientHeight]);
      if (hbar > 0.5 && /(auto|scroll)/.test(cs.overflowX) && !(e.scrollWidth > e.clientWidth + 1)) out.push(['h', String(e.className).split(' ')[0], cs.overflowX, e.scrollWidth, e.clientWidth]); }
      return out.slice(0, 12); })()`);
    const ok = { noIdleBars: r.length === 0 };
    if (!ok.noIdleBars) fail('R21-SCROLLBARS-NEEDED', { ok, idle: r });
    say('r21-scrollbars-needed', { ok });
  },

  // ── the pergola's shade crosses whatever stands over the day room, at the page's strength (Nick) ───────────────────────────────────────────
  'r21-shade-menus': async (app) => {
    await openPage(app, 'arbor-r21-menus');
    await setRoom(app, 'day');
    await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g) g.click(); return true; })()"); await sleep(300);
    await app.evalJs("(() => { const g = document.querySelector('.wz-tutor-grip'); if (g) g.click(); return true; })()"); await sleep(600);
    await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(600);
    await clickText(app, '.arbor2-bar-head', 'Mood ▸'); await sleep(400); await app.evalJs(FINISH); await sleep(700);
    const HOSTS = ['.desk-frame-stage .mode-page', ".wz-tutor-panel[data-open='true'] > .wz-drawer-slide", '.wz-cascade-panel', '.chrome-top.sprint-nav', '.desk-frame-strip', '.arbor2-bar'];
    const r = await app.evalJs(`(() => { const roomSvg = document.querySelector('.arbor2-pergola svg')?.getBoundingClientRect(); const out = {};
      for (const sel of ${JSON.stringify(HOSTS)}) { const h = [...document.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().width > 0); if (!h) { out[sel] = null; continue; }
        const c = [...h.children].find((e) => e.classList.contains('arbor2-pagesh')); const svg = c && c.querySelector('svg'), g = svg && svg.querySelector('g[filter]'); const s = svg && svg.getBoundingClientRect();
        out[sel] = c ? { shown: getComputedStyle(c).display !== 'none' && Number(getComputedStyle(c).opacity) > 0.9, alpha: g ? Number(g.getAttribute('opacity')) : null, aria: c.getAttribute('aria-hidden'), pe: getComputedStyle(c).pointerEvents,
          aligned: !!s && !!roomSvg && Math.abs(s.left - roomSvg.left) <= 1.5 && Math.abs(s.top - roomSvg.top) <= 1.5 && Math.abs(s.width - roomSvg.width) <= 2 } : { shade: false }; }
      return out; })()`);
    const ok = {};
    // PARKED 2026-11-06 (SUPERSEDED by Fable's latency ruling, Nov 5: every copy but the page's draws ONE bitmap - no svg, no g[filter] - so the
    // alpha and the alignment are read off the copy's drift box for those; the page's copy is r20's live drawing). Original, verbatim:
    // for (const sel of HOSTS) { const v = r[sel]; ok[sel] = !!v && v.shown === true && v.alpha != null && Math.abs(v.alpha - 0.034) < 0.0005 && v.aria === 'true' && v.pe === 'none' && v.aligned === true; }
    // SUCCESSOR: the page's copy as before (live svg, g[filter] at 0.034, svg on the room's svg); every other host's copy is a bitmap copy - its
    // drift box at 0.034, its background a blob: bitmap, no svg inside, the box on the room's drift box (+-1.5 px), its drift animation the
    // literal-pixel one, started at the room drift's own start time.
    const rb = await app.evalJs(`(() => { const rd = document.querySelector('.arbor2-pergola .arbor2-pergola-drift'), rr = rd && rd.getBoundingClientRect(); const ra = rd && rd.getAnimations()[0]; const out = {};
      for (const sel of ${JSON.stringify(HOSTS.slice(1))}) { const h = [...document.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().width > 0); if (!h) { out[sel] = null; continue; }
        const c = [...h.children].find((e) => e.classList.contains('arbor2-pagesh')); if (!c) { out[sel] = { shade: false }; continue; }
        const d = c.querySelector('.arbor2-pergola-drift'), b = d && d.getBoundingClientRect(), a = d && d.getAnimations()[0], cs = getComputedStyle(c);
        out[sel] = { bitmap: c.getAttribute('data-bitmap'), svg: !!c.querySelector('svg'), bg: d ? /^url\\("blob:/.test(getComputedStyle(d).backgroundImage) : false, alpha: d ? Number(getComputedStyle(d).opacity) : null,
          shown: cs.display !== 'none' && Number(cs.opacity) > 0.9, aria: c.getAttribute('aria-hidden'), pe: cs.pointerEvents, anim: a ? a.animationName : null, inStep: !!a && !!ra && a.startTime != null && Math.abs(a.startTime - ra.startTime) < 1,
          aligned: !!b && !!rr && Math.abs(b.left - rr.left) <= 1.5 && Math.abs(b.top - rr.top) <= 1.5 && Math.abs(b.width - rr.width) <= 2 && Math.abs(b.height - rr.height) <= 2 }; }
      return out; })()`);
    { const v = r[HOSTS[0]]; ok[HOSTS[0]] = !!v && v.shown === true && v.alpha != null && Math.abs(v.alpha - 0.034) < 0.0005 && v.aria === 'true' && v.pe === 'none' && v.aligned === true; }
    // PARKED 2026-11-07 (SUPERSEDED by Nick's no-drift ruling, Nov 7, via Fable: the copies' literal-pixel drift is no longer drawn). Original, verbatim:
    // for (const sel of HOSTS.slice(1)) { const v = rb[sel]; ok[sel] = !!v && v.bitmap === 'true' && v.svg === false && v.bg === true && v.alpha != null && Math.abs(v.alpha - 0.034) < 0.0005 && v.shown === true && v.aria === 'true' && v.pe === 'none' && v.anim === 'arbor2-pergola-drift-px' && v.inStep === true && v.aligned === true; }
    // SUCCESSOR: the same bitmap copy, and NO drift on it (no animation on its drift box; the in-step read goes with the drift).
    for (const sel of HOSTS.slice(1)) { const v = rb[sel]; ok[sel] = !!v && v.bitmap === 'true' && v.svg === false && v.bg === true && v.alpha != null && Math.abs(v.alpha - 0.034) < 0.0005 && v.shown === true && v.aria === 'true' && v.pe === 'none' && v.anim === null && v.aligned === true; }
    if (Object.values(ok).some((x) => !x)) fail('R21-SHADE-MENUS', { ok, r, rb });
    say('r21-shade-menus', { ok });
  },

  // ── the "..." menu's full-screen line reads (>= 4.5:1) ─────────────────────────────────────────────────────────────────────────────────────
  'r21-fullscreen-line': async (app) => {
    await openPage(app, 'arbor-r21-fs');
    for (const room of ['day', 'night']) await setRoom(app, room);
    const out = {};
    for (const room of ['day', 'night']) {
      await setRoom(app, room);
      await app.evalJs("document.querySelector('.gh-corner-glyph')?.click()"); await sleep(500);
      out[room] = await app.evalJs(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /full screen$/i.test(x.getAttribute('aria-label') || '') && x.getBoundingClientRect().width > 0); if (!b) return null;
        let bg = null; for (let e = b; e && !bg; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) bg = c; } return { text: b.textContent.trim(), fg: getComputedStyle(b).color, bg }; })()`);
      await app.evalJs("document.querySelector('.gh-corner-glyph')?.click()"); await sleep(300);
    }
    const cr = (x) => { const a = x && parseRgb(x.fg), b = x && parseRgb(x.bg); return a && b ? ratio(over(a, a.a ?? 1, b), b) : 0; };
    const ok = { day: cr(out.day) >= 4.5, night: cr(out.night) >= 4.5 };
    if (Object.values(ok).some((x) => !x)) fail('R21-FULLSCREEN-LINE', { ok, out, ratios: [cr(out.day), cr(out.night)] });
    say('r21-fullscreen-line', { ok, ratios: [cr(out.day), cr(out.night)] });
  },
};

Object.assign(screens, {
  'r21-pic-reach-26': async (app) => { await growTo(app, 'arbor-r21-p26', 25); await hideBar(app); },
  'r21-pic-reach-45': async (app) => { await growTo(app, 'arbor-r21-p45', 44); await hideBar(app); },
  'r21-pic-reach-52': async (app) => { await growTo(app, 'arbor-r21-p52', 51); await hideBar(app); },
  'r21-pic-flash': async (app) => { await growTo(app, 'arbor-r21-pf', 57); await typeKeys(app, ' w w'); await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'flash', timeout: 5000 }); await app.evalJs(FINISH); await hideBar(app); },
  'r21-pic-night': async (app) => { await growTo(app, 'arbor-r21-pn', 51); await setRoom(app, 'night'); await sleep(800); await app.evalJs(FINISH); await hideBar(app); },
  'r21-pic-menus-shade': async (app) => { await openPage(app, 'arbor-r21-pm'); await setRoom(app, 'day'); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(500); await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(800); await app.evalJs(FINISH); },
  'r21-pic-fullscreen-line': async (app) => { await openPage(app, 'arbor-r21-pfs'); await setRoom(app, 'night'); await app.evalJs("document.querySelector('.gh-corner-glyph')?.click()"); await sleep(600); },
});
const hideBar = (app) => app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); return true; })()");

export default guarded(screens, { verdict: ['ARBOR-R21'] });
