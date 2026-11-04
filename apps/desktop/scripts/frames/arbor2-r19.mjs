// ARBOR v2 MOCKUP, ROUND r19 - NICK'S NOV 4 NOTES, as named screens for INK's frames job (-f themes=plateau
// -f screens_file=apps/desktop/scripts/frames/arbor2-r19.mjs). Source: claude/wrizors/handoff-FABLE-arbor-r19.md (copy in Downloads, md5
// 65ac1b8e), spec draft 35 §18; Fable's rulings, Nov 4:
//   A. tabs keep their own cloths; the chosen one comes forward (+8 out, +8 long, in front, soft shadow), its colour = the drawer's 3 px border
//      (top, outer side, bottom; the page side flush), joined with no seam; no brass on any tab.
//   B. the top bar and the rail: olive #3A4322 by day, brown #241912 by night (hairlines #4E5A30 / #35271C), carried by the Room crossfade.
//   C. the rail floats like the top bar: flush left, 40 px below the bar and 40 px above the window's bottom (Fable: Arbor now, all at ship).
//   D. the day room: the Wrizors' pergola shadow (arbor-pergola-shadow.svg, md5 1ae1d048), 20%, blur 2.8, ~115 leaf clusters, the breeze every
//      16 s, the drift 12 px over 20 s; the corner mark drawn over it. None at night.
//   E. rest <-> writing: at rest the shade in the room (20%) and across the page at 4% (on the paper, beneath the words), the rhizome hidden; the
//      first keystroke fades the shade out (~6 s) as the rhizome fades in; the return brings the shade back and takes the rhizome away (~3 s).
//      Reduced motion: cuts. Fable: opacity on two layers via the existing recede/return hooks; the page shade at rest only (never writing or
//      in the zoom), pointer-events none, hidden from screen readers, never in copies, exports or print; page text >= 13.9 at its DARKEST overlap.
//   F. the rhizome as vines (filled, tapered, smooth; ~9-11 px at the hidden centre; branches 55-80% of the parent, <= 4.2 px; opacity follows
//      width), day leaf green #4F6B2C (.65 -> .2), night brown #6B5139 at ~.75 of the day strengths (barely visible until the flash); the WHOLE
//      rhizome flashes brass at each goal. Arbor's own presentation behind RhizomeField's seam (Fable); the growth rules and storage shared.
//   G. by day no brass text in the pop-outs and drawers: brass only outlines the chosen option (1.5 px), its text deep olive #33401F.
//   H. nothing under the page unless something is in it (Nick's white bar).
//   + Free Write's Tutor opener on its drawer's outer edge (Fable's yes, Nov 4: the mirror of r18's Tools fix).
// Every check THROWS with its numbers when it fails and prints them when it passes ("ARBOR-R19 <screen> {...}"); the kit's verdict guard reds a
// crash or a silent check. Pictures (-pic-) owe no verdict. Written red-first: run against r18 rebased (576202ff) before the r19 build.
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-R19 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R19-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const FINISH = "(() => { document.getAnimations().forEach((a) => { try { if (a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)) a.finish(); } catch {} }); return true; })()";
const BRASS = /^rgba?\(255,\s*152,\s*0\b/;
const brassish = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return false; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return a > 0.05 && r >= 215 && g >= 115 && g <= 180 && b <= 90; };

// ---- a seam-seeded page (wrizoCreateJournalPage, origin + source carried), the writing settings and goal set before the reload ----
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const words = (n) => Array.from({ length: n }, (_, i) => ['light', 'kettle', 'street', 'table', 'question', 'morning', 'dog', 'answer'][i % 8]).join(' ');
const openPage = async (app, id, { mode = 'Draft', text = PAGEW, progress = 'words', style = 'bar', goal = null } = {}) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await app.evalJs(`localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: ${JSON.stringify(progress)}, progressStyle: ${JSON.stringify(style)} }))`);
  if (goal) await app.evalJs(`window.wrizoSetWritingGoal(${JSON.stringify(goal)})`);
  await sleep(300);
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1#/page/${id}')`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page' }); await sleep(900);
  if (mode) { await app.evalJs(`(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(mode.toLowerCase())}); if (b) b.click(); return !!b; })()`); await sleep(900); }
  await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()");
};
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(700); };
const roomIs = (app) => app.evalJs("document.documentElement.getAttribute('data-arbor2-room')");
const openTools = async (app) => { await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await sleep(150); };
const openTutor = async (app) => { await app.evalJs("(() => { const g = document.querySelector('.wz-tutor-grip'); if (g && g.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await sleep(150); };
const settle = async (app, ms = 700) => { await app.evalJs(FINISH); await sleep(ms); await app.evalJs(FINISH); };
// the first keystroke: the caret to the end of the text, one character typed through CDP (a real key, so the chrome recedes as for a writer)
const typeKeys = async (app, text) => {
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  for (const ch of text) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); await sleep(40); }
};
const summon = async (app) => { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); };
const writing = (app) => app.evalJs("document.documentElement.getAttribute('data-wz-writing') === 'true'");

// ---- colour arithmetic (WCAG) ----
const parseRgb = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16), a: 1 });
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
const over = (top, a, base) => ({ r: base.r + (top.r - base.r) * a, g: base.g + (top.g - base.g) * a, b: base.b + (top.b - base.b) * a, a: 1 });

// ---- reads ----
const TABS = `(() => { const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
  const tab = (id) => { const e = document.getElementById(id); if (!e || e.getBoundingClientRect().width < 1) return null; const cs = getComputedStyle(e); return { id, on: e.getAttribute('data-on') === 'true', r: box(e), bg: cs.backgroundColor, color: cs.color, z: cs.zIndex, outline: cs.outlineColor }; };
  const ls = document.querySelector('.wz-sliver-panel > .wz-drawer-slide'), rs = document.querySelector('.wz-tutor-panel > .wz-drawer-slide');
  return { left: ['wz-sliver-tab-format', 'wz-sliver-tab-presets', 'wz-sliver-tab-ink'].map(tab).filter(Boolean), right: ['wz-tutor-tab-tutor', 'wz-tutor-tab-links', 'wz-tutor-tab-board'].map(tab).filter(Boolean),
    ls: ls ? { r: box(ls), sh: getComputedStyle(ls).boxShadow } : null, rs: rs ? { r: box(rs), sh: getComputedStyle(rs).boxShadow } : null,
    lgrip: box(document.querySelector('.wz-sliver-grip')), rgrip: box(document.querySelector('.wz-tutor-grip')) }; })()`;
const CLOTH = { 'wz-sliver-tab-format': '86, 99, 46', 'wz-sliver-tab-presets': '127, 160, 188', 'wz-sliver-tab-ink': '168, 57, 47', 'wz-tutor-tab-tutor': '86, 99, 46', 'wz-tutor-tab-links': '127, 160, 188', 'wz-tutor-tab-board': '168, 57, 47' };
const SHADE = `(() => { const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
  const op = (e) => { let o = 1; for (let n = e; n && n !== document.documentElement; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= Number(cs.opacity); } return Math.round(o * 1000) / 1000; };
  const room = document.querySelector('.arbor2-pergola'), page = document.querySelector('.mode-page .arbor2-pagesh');
  const rsvg = room?.querySelector('svg'), psvg = page?.querySelector('svg'), g = rsvg?.querySelector('g[filter]'), pg = psvg?.querySelector('g[filter]');
  const blur = rsvg?.querySelector('feGaussianBlur');
  const field = document.querySelector('.wz-rhizome-field');
  const leafAnims = room ? document.getAnimations().filter((a) => a.effect?.target && room.contains(a.effect.target) && a.effect.target.classList?.contains('wz-leaf')) : [];
  const allAnims = document.getAnimations().filter((a) => a.effect?.target && ((room && room.contains(a.effect.target)) || (page && page.contains(a.effect.target)) || a.effect.target === room || a.effect.target === page));
  const timing = (a) => { const t = a.effect.getTiming(); return [a.animationName || a.transitionProperty || '?', Number(t.duration), t.iterations, t.direction, a.playState]; };
  return { room: room ? { box: box(room), op: op(room), svg: box(rsvg), fill: g ? getComputedStyle(g).fill : null, gop: g ? Number(g.getAttribute('opacity') ?? getComputedStyle(g).opacity) : null, blur: blur ? Number(blur.getAttribute('stdDeviation')) : null,
      leaves: room.querySelectorAll('.wz-leaf').length, rafters: room.querySelectorAll('polygon').length, rects: room.querySelectorAll('rect').length, aria: room.getAttribute('aria-hidden'), pe: getComputedStyle(room).pointerEvents } : null,
    page: page ? { box: box(page), op: op(page), svg: box(psvg), gop: pg ? Number(pg.getAttribute('opacity') ?? 1) : null, aria: page.getAttribute('aria-hidden'), pe: getComputedStyle(page).pointerEvents, us: getComputedStyle(page).userSelect,
      inEditable: !!page.closest('[contenteditable]'), wrapOp: Number(getComputedStyle(page).opacity) } : null,
    paper: box(document.querySelector('.mode-page')), paperBg: document.querySelector('.mode-page') ? getComputedStyle(document.querySelector('.mode-page')).backgroundColor : null,
    ink: document.querySelector('.forward-only-editor') ? getComputedStyle(document.querySelector('.forward-only-editor')).color : null,
    field: field ? { op: op(field), vines: field.getAttribute('data-vines'), flash: field.getAttribute('data-flash') } : null,
    leafAnims: leafAnims.length, leafTiming: leafAnims[0] ? timing(leafAnims[0]) : null, running: allAnims.filter((a) => a.playState === 'running').map(timing).slice(0, 6), runningN: allAnims.filter((a) => a.playState === 'running').length,
    writing: document.documentElement.getAttribute('data-wz-writing'), room: document.documentElement.getAttribute('data-arbor2-room'), vw: innerWidth, vh: innerHeight }; })()`;
const VINES = `(() => { const f = document.querySelector('.wz-rhizome-field'); if (!f) return null;
  const vs = [...f.querySelectorAll('.arbor2-vine')]; const heads = vs.filter((v) => v.hasAttribute('data-w0'));
  const num = (v, k) => Number(v.getAttribute(k));
  const cs = (v) => getComputedStyle(v); const paper = document.querySelector('.mode-page')?.getBoundingClientRect();
  const gop = (() => { const g = f.querySelector('.arbor2-vines'); return g ? Number(getComputedStyle(g).opacity) : null; })();
  return { vines: f.getAttribute('data-vines'), flash: f.getAttribute('data-flash'), n: vs.length, heads: heads.length,
    main: heads.filter((v) => v.getAttribute('data-level') === '0').map((v) => ({ w0: num(v, 'data-w0'), x0: num(v, 'data-x0'), y0: num(v, 'data-y0'), past: !!v.closest('.arbor2-vines-past') })),
    branch: heads.filter((v) => v.getAttribute('data-level') === '1').map((v) => ({ w0: num(v, 'data-w0'), ratio: num(v, 'data-ratio') })),
    fills: [...new Set(vs.slice(0, 400).map((v) => cs(v).fill))], strokes: [...new Set(vs.slice(0, 400).map((v) => cs(v).stroke))],
    fop: vs.length ? [Math.min(...vs.map((v) => Number(cs(v).fillOpacity))), Math.max(...vs.map((v) => Number(cs(v).fillOpacity)))] : null, gop,
    smooth: vs.slice(0, 40).every((v) => /C/.test(v.getAttribute('d') || '') && /Z\\s*$/i.test(v.getAttribute('d') || '')),
    centre: paper ? { x: (paper.left + paper.right) / 2, y: (paper.top + paper.bottom) / 2 } : null, svgBox: (() => { const r = f.getBoundingClientRect(); return { l: r.left, t: r.top }; })() }; })()`;

const screens = {
  // ── A. THE TAB RULE ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  'r19-tabs': async (app) => {
    await openPage(app, 'arbor-r19-tabs');
    const out = {};
    for (const room of ['day', 'night']) {
      await setRoom(app, room); await openTools(app); await openTutor(app); await settle(app);
      const reads = [];
      for (const id of ['wz-sliver-tab-format', 'wz-sliver-tab-presets', 'wz-tutor-tab-tutor', 'wz-tutor-tab-links', 'wz-tutor-tab-board']) {
        await app.evalJs(`document.getElementById(${JSON.stringify(id)})?.click()`); await settle(app, 400);
        reads.push({ id, ...(await app.evalJs(TABS)) });
      }
      const res = reads.map((rd) => {
        const left = rd.id.startsWith('wz-sliver');
        const tabs = left ? rd.left : rd.right, chosen = tabs.find((t) => t.id === rd.id), slide = left ? rd.ls : rd.rs;
        if (!chosen || !slide) return { id: rd.id, missing: true };
        const c = CLOTH[rd.id];
        const sh = slide.sh || '';
        const border = left ? [`rgb(${c}) 0px 3px 0px 0px inset`, `rgb(${c}) 3px 0px 0px 0px inset`, `rgb(${c}) 0px -3px 0px 0px inset`] : [`rgb(${c}) 0px 3px 0px 0px inset`, `rgb(${c}) -3px 0px 0px 0px inset`, `rgb(${c}) 0px -3px 0px 0px inset`];
        const pageSide = left ? /rgb\([^)]*\) -\d+px 0px 0px 0px inset/.test(sh) : /rgb\([^)]*\) [1-9]\d*px 0px 0px 0px inset/.test(sh);
        const out2 = left ? slide.r.t - chosen.r.t : chosen.r.r - slide.r.r;
        const long = left ? chosen.r.w : chosen.r.h;
        return { id: rd.id, ok: {
          ownCloth: chosen.bg === `rgb(${c})`,
          noBrass: [...rd.left, ...rd.right].every((t) => !BRASS.test(t.bg) && !BRASS.test(t.color)) && !/255, 152, 0/.test(sh),
          forward: Math.abs(out2 - 33) <= 1 && Math.abs(long - (left ? 104 : 106)) <= 1 && Number(chosen.z) > Math.max(...tabs.filter((t) => t !== chosen).map((t) => Number(t.z) || 0)),
          seamless: left ? chosen.r.b >= slide.r.t + 2 : chosen.r.l <= slide.r.r - 2,
          border: border.every((b) => sh.includes(b)) && !pageSide,
          firstBelowOpener: left || !rd.rgrip || rd.right[0].r.t >= rd.rgrip.b + 12 - 0.5,
        }, out: +out2.toFixed(1), long, sh: sh.slice(0, 160) };
      });
      // the neighbours never move: each tab's rect when it is not chosen is the same whichever neighbour is chosen
      const still = {};
      for (const side of ['left', 'right']) for (const rd of reads) for (const t of rd[side]) if (!t.on) (still[t.id] ||= []).push(t.r);
      const neighboursStill = Object.values(still).every((rs) => rs.every((r) => ['l', 't', 'r', 'b'].every((k) => Math.abs(r[k] - rs[0][k]) <= 0.6)));
      out[room] = { res, neighboursStill };
    }
    const bad = Object.values(out).some((o) => !o.neighboursStill || o.res.some((r) => r.missing || Object.values(r.ok).some((x) => !x)));
    if (bad) fail('R19-TABS', out);
    say('r19-tabs', out);
  },

  // ── B. THE BARS ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  'r19-bars': async (app) => {
    await openPage(app, 'arbor-r19-bars');
    const want = { day: { bg: hex('#3A4322'), line: '#4E5A30' }, night: { bg: hex('#241912'), line: '#35271C' } };
    const out = {};
    for (const room of ['day', 'night']) {
      await setRoom(app, room);
      const r = await app.evalJs(`(() => { const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((b) => b.getBoundingClientRect().height > 0), strip = document.querySelector('.desk-frame-strip');
        const lab = (root) => root ? [...root.querySelectorAll('button, a, span, .wz-strip-label')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() && e.getBoundingClientRect().width > 0).slice(0, 30).map((e) => [e.textContent.trim().slice(0, 16), getComputedStyle(e).color]) : [];
        return { bar: bar ? getComputedStyle(bar).backgroundColor : null, barLine: bar ? getComputedStyle(bar).borderBottomColor : null, strip: strip ? getComputedStyle(strip).backgroundColor : null, labels: [...lab(bar), ...lab(strip)] }; })()`);
      const bg = want[room].bg;
      const worst = r.labels.map(([t, c]) => { const p = parseRgb(c); return p ? [t, ratio(over(p, p.a, bg), bg)] : [t, 0]; }).sort((a, b) => a[1] - b[1])[0];
      out[room] = { r, worst, ok: { bar: r.bar === `rgb(${bg.r}, ${bg.g}, ${bg.b})`, strip: r.strip === `rgb(${bg.r}, ${bg.g}, ${bg.b})`, labels: !!worst && worst[1] >= 4.5 } };
    }
    if (Object.values(out).some((o) => Object.values(o.ok).some((x) => !x))) fail('R19-BARS', out);
    say('r19-bars', out);
  },

  // ── C. THE RAIL FLOATS ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  'r19-rail': async (app) => {
    await openPage(app, 'arbor-r19-rail');
    const out = {};
    for (const room of ['day', 'night']) {
      await setRoom(app, room);
      const r = await app.evalJs(`(() => { const box = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
        const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((b) => b.getBoundingClientRect().height > 0), strip = document.querySelector('.desk-frame-strip');
        const items = strip ? [...strip.querySelectorAll('.wz-strip-label')].map((e) => [e.textContent.trim(), Math.round(e.getBoundingClientRect().top)]) : [];
        return { bar: box(bar), strip: box(strip), page: box(document.querySelector('.mode-page')), items, vh: innerHeight }; })()`);
      const inside = r.strip && r.items.every(([, t]) => t >= r.strip.t && t <= r.strip.b);
      out[room] = { ...r, ok: { flushLeft: !!r.strip && Math.abs(r.strip.l) <= 0.5, below: !!r.strip && !!r.bar && Math.abs(r.strip.t - r.bar.b - 40) <= 1, above: !!r.strip && Math.abs(r.vh - r.strip.b - 40) <= 1, itemsInside: inside } };
    }
    if (Object.values(out).some((o) => Object.values(o.ok).some((x) => !x))) fail('R19-RAIL', out);
    say('r19-rail', out);
  },

  // ── D. THE PERGOLA ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  'r19-pergola': async (app) => {
    await openPage(app, 'arbor-r19-pergola');
    await setRoom(app, 'day'); await sleep(600);
    const d = await app.evalJs(SHADE);
    const mark = await app.evalJs(`(() => { const m = [...document.querySelectorAll('.brand-mark')].find((e) => e.getBoundingClientRect().width > 0); if (!m) return null; const r = m.getBoundingClientRect(); const st = document.elementsFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
      const iM = st.findIndex((e) => e.closest('.brand-mark')), iP = st.findIndex((e) => e.closest('.arbor2-pergola')); return { iM, iP, over: iM >= 0 && (iP < 0 || iM < iP), op: getComputedStyle(m).opacity }; })()`);
    await setRoom(app, 'night'); await sleep(600);
    const n = await app.evalJs(SHADE);
    const ok = {
      layer: !!d.room && d.room.op > 0.9 && !!d.room.svg && d.room.svg.l <= 0.5 && d.room.svg.t <= 0.5 && d.room.svg.r >= d.vw - 0.5 && d.room.svg.b >= d.vh - 0.5,
      paint: !!d.room && d.room.fill === 'rgb(63, 77, 34)' && Math.abs(d.room.gop - 0.2) < 0.001 && d.room.blur === 2.8,
      structure: !!d.room && d.room.rafters === 10 && d.room.rects === 3 && d.room.leaves >= 100 && d.room.leaves <= 130,
      breeze: d.leafAnims >= 100 && !!d.leafTiming && d.leafTiming[1] === 16000 && d.leafTiming[2] === Infinity,
      drift: d.running.some((t) => t[1] === 20000 && t[3] === 'alternate'),
      decorative: !!d.room && d.room.aria === 'true' && d.room.pe === 'none',
      markOver: !!mark && mark.over,
      noneAtNight: !n.room || n.room.op === 0,
    };
    const brief = { ok, room: d.room, leafAnims: d.leafAnims, leafTiming: d.leafTiming, running: d.running, mark, night: n.room && { op: n.room.op } };
    if (Object.values(ok).some((x) => !x)) fail('R19-PERGOLA', brief);
    say('r19-pergola', brief);
  },
  'r19-reduced': async (app) => {
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    try {
      await openPage(app, 'arbor-r19-reduced', { progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } });
      await setRoom(app, 'day'); await sleep(600);
      const rest = await app.evalJs(SHADE);
      await typeKeys(app, ' w'); await sleep(250);
      const w = await app.evalJs(SHADE);
      const ok = {
        still: !!rest.room && rest.runningN === 0,
        shadeCut: !!w.room && w.room.op === 0 && (!w.page || w.page.op === 0),
        rhizomeCut: !!w.field && w.field.op === 1,
      };
      const brief = { ok, rest: { runningN: rest.runningN, running: rest.running }, writing: { writing: w.writing, room: w.room && w.room.op, page: w.page && w.page.op, field: w.field } };
      if (Object.values(ok).some((x) => !x)) fail('R19-REDUCED', brief);
      say('r19-reduced', brief);
    } finally { await app.emulateMedia([]); }
  },

  // ── E. REST <-> WRITING ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  'r19-swap': async (app) => {
    await openPage(app, 'arbor-r19-swap', { progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } });
    await setRoom(app, 'day'); await sleep(600);
    const rest = await app.evalJs(SHADE);
    await typeKeys(app, ' w');
    await sleep(1500); const mid = await app.evalJs(SHADE);
    await sleep(5500); const wrote = await app.evalJs(SHADE);
    await summon(app);
    await sleep(1200); const midBack = await app.evalJs(SHADE);
    await sleep(2600); const back = await app.evalJs(SHADE);
    await setRoom(app, 'night'); await sleep(800); const night = await app.evalJs(SHADE);
    const ok = {
      restShade: !!rest.room && rest.room.op > 0.9 && !!rest.page && rest.page.op > 0.9,
      restNoRhizome: !!rest.field && rest.field.op === 0,
      wrote: wrote.writing === 'true',
      fadesOut: !!mid.room && mid.room.op > 0.05 && mid.room.op < 0.95,
      shadeGone: !!wrote.room && wrote.room.op < 0.02 && (!wrote.page || wrote.page.op < 0.02),
      rhizomeIn: !!wrote.field && wrote.field.op > 0.98,
      returned: back.writing !== 'true',
      fadesBack: !!midBack.room && midBack.room.op > 0.05 && midBack.room.op < 0.95,
      shadeBack: !!back.room && back.room.op > 0.98 && !!back.page && back.page.op > 0.98,
      rhizomeOut: !!back.field && back.field.op < 0.02,
      nightRhizomeStays: !!night.field && night.field.op > 0.98 && (!night.room || night.room.op === 0),
    };
    const brief = { ok, rest: { room: rest.room?.op, page: rest.page?.op, field: rest.field }, mid: mid.room?.op, wrote: { w: wrote.writing, room: wrote.room?.op, page: wrote.page?.op, field: wrote.field?.op }, midBack: midBack.room?.op, back: { w: back.writing, room: back.room?.op, page: back.page?.op, field: back.field?.op }, night: night.field };
    if (Object.values(ok).some((x) => !x)) fail('R19-SWAP', brief);
    say('r19-swap', brief);
  },
  'r19-page-shade': async (app) => {
    await openPage(app, 'arbor-r19-pshade');
    await setRoom(app, 'day'); await sleep(600);
    const d = await app.evalJs(SHADE);
    // the darkest overlap: overlaps never darken (one group opacity), so it is one coat of the shade at its effective strength over the paper
    const paper = parseRgb(d.paperBg), ink = parseRgb(d.ink);
    const alpha = d.page ? Math.round(d.page.wrapOp * d.page.gop * 10000) / 10000 : null;
    const darkest = paper && alpha != null ? over(hex('#3F4D22'), alpha, paper) : null;
    const contrast = darkest && ink ? ratio(ink, darkest) : null;
    // the copy: the whole page selected, the clipboard text is the page's text only
    const copy = await app.evalJs("(() => { const p = document.querySelector('.mode-page'); const r = document.createRange(); r.selectNodeContents(p); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const t = s.toString(); s.removeAllRanges(); return { t: t.replace(/\\s+/g, ' ').trim().slice(0, 400) }; })()");
    // print
    await app.cdp('Emulation.setEmulatedMedia', { media: 'print' }); await sleep(200);
    const print = await app.evalJs("(() => { const v = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'absent'; }; return { page: v('.mode-page .arbor2-pagesh'), room: v('.arbor2-pergola') }; })()");
    await app.cdp('Emulation.setEmulatedMedia', { media: '' }); await sleep(200);
    // the zoom (Free Write): never on the page
    await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'free write'); if (b) b.click(); return !!b; })()"); await sleep(1200);
    const z = await app.evalJs(SHADE);
    const zoom = await app.evalJs("!!document.querySelector(\".mode-pagecol[data-zoom='true']\")");
    const ok = {
      onPaper: !!d.page && d.page.op > 0.9 && !!d.paper && d.page.box.l >= d.paper.l - 0.5 && d.page.box.r <= d.paper.r + 0.5 && d.page.box.t >= d.paper.t - 0.5 && d.page.box.b <= d.paper.b + 0.5,
      aligned: !!d.page && !!d.room && ['l', 't', 'w', 'h'].every((k) => Math.abs(d.page.svg[k] - d.room.svg[k]) <= 1),
      fourPercent: alpha != null && Math.abs(alpha - 0.04) <= 0.004,
      floor: contrast != null && contrast >= 13.9,
      decorative: !!d.page && d.page.aria === 'true' && d.page.pe === 'none' && d.page.us === 'none' && !d.page.inEditable,
      copyIsText: copy.t.startsWith('The morning light came in low') && copy.t.length < PAGEW.length + 40,
      noPrint: print.page === 'none' && print.room === 'none',
      notInZoom: zoom && (!z.page || z.page.op === 0),
    };
    const brief = { ok, alpha, paper: d.paperBg, ink: d.ink, darkest, contrast, page: d.page, roomSvg: d.room?.svg, copy: copy.t.slice(0, 60), print, zoom, zpage: z.page && z.page.op };
    if (Object.values(ok).some((x) => !x)) fail('R19-PAGE-SHADE', brief);
    say('r19-page-shade', brief);
  },

  // ── F. THE VINES ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  'r19-vines': async (app) => {
    await openPage(app, 'arbor-r19-vines', { text: words(40), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } });
    await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(7000); await app.evalJs(FINISH);
    const d = await app.evalJs(VINES);
    await setRoom(app, 'night'); await sleep(800);
    const n = await app.evalJs(VINES);
    const ok = {
      drawn: !!d && d.vines === 'true' && d.n > 0 && d.main.length >= 5,
      filled: !!d && d.strokes.every((s) => s === 'none') && d.smooth,
      core: !!d && d.main.filter((m) => !m.past).every((m) => m.w0 >= 9 && m.w0 <= 11),
      fromCentre: !!d && !!d.centre && d.main.filter((m) => !m.past).every((m) => Math.hypot(d.svgBox.l + m.x0 - d.centre.x, d.svgBox.t + m.y0 - d.centre.y) <= 30),
      branches: !!d && d.branch.length > 0 && d.branch.every((b) => b.w0 <= 4.2 + 1e-6 && b.ratio >= 0.55 - 1e-6 && b.ratio <= 0.8 + 1e-6),
      dayGreen: !!d && d.fills.length === 1 && d.fills[0] === 'rgb(79, 107, 44)' && d.fop[1] <= 0.651 && d.fop[0] >= 0.199,
      nightBrown: !!n && n.fills.length === 1 && n.fills[0] === 'rgb(107, 81, 57)' && Math.abs((n.gop ?? 1) - 0.75) <= 0.01,
    };
    const brief = { ok, day: d && { n: d.n, heads: d.heads, main: d.main.slice(0, 10), branch: d.branch.slice(0, 8), fills: d.fills, strokes: d.strokes, fop: d.fop, smooth: d.smooth, centre: d.centre }, night: n && { fills: n.fills, fop: n.fop, gop: n.gop } };
    if (Object.values(ok).some((x) => !x)) fail('R19-VINES', brief);
    say('r19-vines', brief);
  },
  'r19-flash': async (app) => {
    await openPage(app, 'arbor-r19-flash', { text: words(58), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } });
    await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(6500);
    await typeKeys(app, ' w'); await sleep(1300);
    const f = await app.evalJs(`(() => { const fld = document.querySelector('.wz-rhizome-field'); if (!fld) return null; const vs = [...fld.querySelectorAll('.arbor2-vine')];
      return { flash: fld.getAttribute('data-flash'), n: vs.length, fills: [...new Set(vs.map((v) => getComputedStyle(v).fill))].slice(0, 4), past: fld.querySelectorAll('.arbor2-vines-past .arbor2-vine').length }; })()`);
    const ok = { flashing: !!f && f.flash !== 'false', wholeBrass: !!f && f.n > 0 && f.fills.length === 1 && f.fills[0] === 'rgb(255, 152, 0)' };
    if (Object.values(ok).some((x) => !x)) fail('R19-FLASH', { ok, f });
    say('r19-flash', { ok, f });
  },

  // ── G. NO BRASS TEXT BY DAY ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
  'r19-no-brass-day': async (app) => {
    await openPage(app, 'arbor-r19-nobrass');
    await setRoom(app, 'day'); await openTools(app); await openTutor(app); await settle(app);
    const READ = `(() => { const roots = [...document.querySelectorAll('.wz-sliver-panel, .wz-tutor-panel, .wz-theme-picker, .wz-cascade-panel')].filter((e) => e.getBoundingClientRect().width > 0);
      const els = roots.flatMap((r) => [...r.querySelectorAll('*')]).filter((e) => { if (e.getBoundingClientRect().width < 1) return false; return [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()); });
      const chosen = roots.flatMap((r) => [...r.querySelectorAll("button.on, [aria-pressed='true'], [aria-checked='true'], [aria-selected='true']")]).filter((e) => e.getBoundingClientRect().width > 0 && (e.textContent || '').trim());
      return { roots: roots.map((r) => r.className.split(' ')[0]), texts: els.map((e) => [(e.textContent || '').trim().slice(0, 22), getComputedStyle(e).color]),
        chosen: chosen.map((e) => { const cs = getComputedStyle(e); return [(e.textContent || '').trim().slice(0, 22), cs.color, cs.borderTopColor, cs.borderTopWidth, cs.outlineColor, cs.outlineWidth, cs.outlineStyle]; }) }; })()`;
    const drawers = await app.evalJs(READ);
    await app.evalJs("(() => { const b = document.querySelector(\".wz-strip-item[data-category='theme']\"); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!b; })()"); await sleep(700);
    const themes = await app.evalJs(READ);
    const all = [...drawers.texts, ...themes.texts], chosen = [...drawers.chosen, ...themes.chosen];
    const brassText = all.filter(([, c]) => brassish(c));
    const outlined = chosen.filter((c) => brassish(c[2]) || brassish(c[4]));
    const ok = {
      noBrassText: brassText.length === 0,
      chosenOlive: outlined.every((c) => c[1] === 'rgb(51, 64, 31)'),
      outline: outlined.length > 0 && outlined.every((c) => (brassish(c[2]) && Math.abs(parseFloat(c[3]) - 1.5) < 0.01) || (brassish(c[4]) && Math.abs(parseFloat(c[5]) - 1.5) < 0.01 && c[6] !== 'none')),
      looked: drawers.roots.length >= 2 && themes.roots.some((r) => /theme/.test(r)),
    };
    const brief = { ok, brassText: brassText.slice(0, 12), outlined: outlined.slice(0, 10), roots: [drawers.roots, themes.roots], nTexts: all.length };
    if (Object.values(ok).some((x) => !x)) fail('R19-NO-BRASS-DAY', brief);
    say('r19-no-brass-day', brief);
  },

  // ── H. NOTHING UNDER THE PAGE UNLESS SOMETHING IS IN IT ──────────────────────────────────────────────────────────────────────────────────
  'r19-white-bar': async (app) => {
    const PLATE = `(() => { const e = document.querySelector('.desk-frame-instrument'); const p = document.querySelector('.mode-page')?.getBoundingClientRect();
      if (!e) return { plate: null, page: p && { b: p.bottom } }; const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      return { plate: { bg: cs.backgroundColor, pad: cs.paddingTop + ' ' + cs.paddingBottom, h: +r.height.toFixed(1), kids: [...e.children].map((c) => c.className.split(' ')[0]) }, page: p && { b: p.bottom } }; })()`;
    const out = {};
    for (const [key, progress, style] of [['off', 'off', 'bar'], ['rhizome', 'words', 'rhizome'], ['bar', 'words', 'bar']]) {
      await openPage(app, `arbor-r19-wb-${key}`, { progress, style, goal: { n: 300, unit: 'words' } });
      out[key] = await app.evalJs(PLATE);
    }
    const empty = (x) => !x.plate || ((x.plate.bg === 'rgba(0, 0, 0, 0)' || x.plate.bg === 'transparent') && x.plate.h < 1);
    const ok = { offNothing: empty(out.off), rhizomeNothing: empty(out.rhizome), barKeepsPlate: !!out.bar.plate && !empty(out.bar) && out.bar.plate.kids.includes('mode-progress') };
    if (Object.values(ok).some((x) => !x)) fail('R19-WHITE-BAR', { ok, out });
    say('r19-white-bar', { ok, out });
  },

  // ── + FREE WRITE'S TUTOR OPENER ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  'r19-fw-tutor-opener': async (app) => {
    await openPage(app, 'arbor-r19-fwt', { mode: null });
    await openTutor(app); await settle(app);
    const r = await app.evalJs(`(() => { const box = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return { l: +q.left.toFixed(1), t: +q.top.toFixed(1), r: +q.right.toFixed(1), b: +q.bottom.toFixed(1) }; };
      return { zoom: !!document.querySelector(".mode-pagecol[data-zoom='true']"), open: document.querySelector('.wz-tutor-grip')?.getAttribute('data-open'), grip: box(document.querySelector('.wz-tutor-grip')), panel: box(document.querySelector('.wz-tutor-panel')), arrow: document.querySelector('.wz-tutor-grip-glyph')?.textContent.trim() }; })()`);
    const ok = { zoom: r.zoom, open: r.open === 'true', outerEdge: !!r.grip && !!r.panel && Math.abs(r.grip.l - r.panel.r) <= 1, arrowBack: r.arrow === '‹' };
    if (Object.values(ok).some((x) => !x)) fail('R19-FW-TUTOR-OPENER', { ok, r });
    say('r19-fw-tutor-opener', { ok, r });
  },
};

// ── PICTURES (the Wrizors' §6 frames) ─────────────────────────────────────────────────────────────────────────────────────────────────────
const hideBar = (app) => app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); return true; })()");
const pic = (fn) => async (app) => { await fn(app); await hideBar(app); await sleep(300); };
Object.assign(screens, {
  'r19-pic-day-rest': pic(async (app) => { await openPage(app, 'arbor-r19-p1'); await setRoom(app, 'day'); }),
  'r19-pic-day-rest-2000': pic(async (app) => { await app.emulateDpr(1, 2000, 1125); await openPage(app, 'arbor-r19-p2'); await setRoom(app, 'day'); }),
  'r19-pic-themes-day': pic(async (app) => { await openPage(app, 'arbor-r19-p3'); await setRoom(app, 'day'); await openTools(app); await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(700); }),
  'r19-pic-vines-day': pic(async (app) => { await openPage(app, 'arbor-r19-p4', { text: words(45), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(7000); await app.evalJs(FINISH); }),
  'r19-pic-vines-night': pic(async (app) => { await openPage(app, 'arbor-r19-p5', { text: words(45), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'night'); await typeKeys(app, ' w'); await sleep(2000); await app.evalJs(FINISH); }),
  'r19-pic-vines-flash': pic(async (app) => { await openPage(app, 'arbor-r19-p6', { text: words(58), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(6500); await typeKeys(app, ' w'); await sleep(1100); }),
  'r19-pic-progress-off': pic(async (app) => { await openPage(app, 'arbor-r19-p7', { progress: 'off' }); await setRoom(app, 'day'); }),
  'r19-pic-progress-rhizome': pic(async (app) => { await openPage(app, 'arbor-r19-p8', { progress: 'words', style: 'rhizome', goal: { n: 300, unit: 'words' } }); await setRoom(app, 'day'); }),
});
for (const room of ['day', 'night']) for (const [k, id] of [['tutor', 'wz-tutor-tab-tutor'], ['grafts', 'wz-tutor-tab-links'], ['board', 'wz-tutor-tab-board']]) {
  screens[`r19-pic-${room}-open-${k}`] = pic(async (app) => { await openPage(app, `arbor-r19-o-${room}-${k}`); await setRoom(app, room); await openTools(app); await openTutor(app); await settle(app); await app.evalJs(`document.getElementById(${JSON.stringify(id)})?.click()`); await settle(app, 400); });
}
// THE RECORDING: one breeze crossing (each frame its own screen: the pergola's animations held at the frame's moment, so every frame is exact),
// then a keystroke (the shade out, the rhizome in) and the return (the rhizome out, the shade in), read off the real transitions at their times
const holdAt = (ms) => `(() => { const room = document.querySelector('.arbor2-pergola'), page = document.querySelector('.mode-page .arbor2-pagesh');
  const an = document.getAnimations().filter((a) => a.effect?.target && ((room && room.contains(a.effect.target)) || (page && page.contains(a.effect.target))));
  an.forEach((a) => { try { a.pause(); a.currentTime = ${ms}; } catch {} }); return an.length; })()`;
for (const ms of [0, 400, 800, 1200, 1600, 2000, 2600, 3200]) {
  screens[`r19-pic-rec-a-breeze-${String(ms).padStart(4, '0')}`] = pic(async (app) => { await openPage(app, `arbor-r19-ra${ms}`, { progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'day'); await app.evalJs(holdAt(ms)); });
}
const holdTransitions = (ms) => `(() => { const t = document.getAnimations().filter((a) => a.transitionProperty === 'opacity'); t.forEach((a) => { try { a.pause(); a.currentTime = ${ms}; } catch {} }); return t.length; })()`;
for (const ms of [0, 1500, 3000, 4500, 6000]) {
  screens[`r19-pic-rec-b-write-${String(ms).padStart(4, '0')}`] = pic(async (app) => { await openPage(app, `arbor-r19-rb${ms}`, { text: words(40), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(80); await app.evalJs(holdTransitions(ms)); });
}
for (const ms of [0, 1000, 2000, 3000]) {
  screens[`r19-pic-rec-c-return-${String(ms).padStart(4, '0')}`] = pic(async (app) => { await openPage(app, `arbor-r19-rc${ms}`, { text: words(40), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(7000); await app.evalJs(FINISH); await summon(app); await sleep(80); await app.evalJs(holdTransitions(ms)); });
}

export default guarded(screens, { verdict: ['ARBOR-R19'] });
