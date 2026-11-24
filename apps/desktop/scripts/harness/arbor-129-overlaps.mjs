// #129 (Nov 24, live, Arbor; Nick's screenshot at 2560; Fable's orders-nov24.md Clearances 11:31 am): "overlapping chrome. The rail's active tab (DRAWERS) runs
// into the open drawer's panel border. The page's '›' edge tabs sit on the FORMAT panel's border and the page edge. The FORMAT and SECTIONS tabs crowd each other."
// THE RULE (11:15, now every theme): NO CONTROL OVERLAPS ANOTHER CONTROL, A PANEL BORDER, THE PAGE OR ITS CORNER MARKS, at 1366, 1920 and 2560. ARBOR's chrome, and
// Machina's checked for the same. Built on INK's flux-125-overlaps.mjs census (ink/125-flux-overlaps @ 09a26ed8: the control selector, "drawn", the crossing and
// the centre hit-test, word for word) with one addition: the PANELS (the open menu's or drawer's bordered body).
// Read on the theme a writer gets (the redesigns and the reorg by default), a Doc of three Parts in Draft, the pointer on the rail's side, nothing typed, in:
//   FRONT    the Front menu open (the left dock's grip), the Back menu shut
//   BACK     the Back menu open (the right dock's grip), the Front menu shut
//   DRAWERS  the rail's Drawers pressed (its word read by name), both menus shut
// for Arbor (plateau) and Machina, page tone light and dark (the room follows the runner's clock, as the frames job does; it is printed), 1366 x 768, 1920 x 1080,
// 2560 x 1440.
//   P0  (premise) every arm is the theme it names at its width (read back), the Doc seeded, the state it names standing (the menu's own open state read back;
//       for DRAWERS the rail item reads active or a drawer panel stands)
//   P1  (premise) every arm found the page and at least 8 drawn controls (a census that found nothing would pass blind), and every FRONT/BACK arm found its panel
//   O<theme><tone><w><state>  no drawn control's box crosses another control's box, the page (a control outside the page), a corner mark, or an open panel
//       (a control outside the panel that crosses its box sits on its border)
//   H<theme><tone><w><state>  every drawn control can be pressed: the element at its centre is the control or inside it
// A "control" is anything she can press or tab to (button, link, tab, radio, checkbox, menu item, field, a positive tabindex), outside the editor's text, drawn:
// in the window, at least 4x4 px, visible, its opacity (with every ancestor's) at least 0.1. A pair where one holds the other is not an overlap.
// A "panel" is the largest drawn element inside an open dock ([data-menus-dock] Front, .wz-tutor's dock Back, .wz-drawer-slide) or the dock itself, at least
// 150 x 200 px, with a border on at least two sides.
// CORRECTED BEFORE ITS FIRST GREEN (Nov 24, after the red run 45471640855; no check had passed or been relied on):
//   (1) "drawn" is the part of the box she can SEE: clipped to the window AND to every ancestor that clips (overflow not visible, up to a fixed box). INK's
//       census took the whole box, so a control scrolled out of sight inside a menu or under the page's scroller counted as drawn and its centre as covered
//       (Machina's template rows below a 768-high window; the page's foot button below the page's scroll at 1366).
//   (2) the panel is the open dock's own .wz-drawer-slide when it stands (drawn, at least 150 x 200); the bordered-element search is the fallback. The
//       search alone missed Machina's panels at 1920 and 2560 (P1).
// FRAMES: $RUNNER_TEMP/suite/arbor-129 (else the OS temp), one per arm. Run: node scripts/harness/arbor-129-overlaps.mjs (from apps/desktop; Actions or a box turn)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.WS_REORG = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const OUT = path.join(process.env.RUNNER_TEMP ? path.join(process.env.RUNNER_TEMP, 'suite') : os.tmpdir(), 'arbor-129');
fs.mkdirSync(OUT, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const WIDTHS = [[1366, 768], [1920, 1080], [2560, 1440]];
const THEMES = [['plateau', 'A'], ['machina', 'M']];
const TONES = ['light', 'dark'];
const STATES = ['front', 'back', 'drawers'];
const PARA = 'The rain had not stopped for three days, and the river was up past the second step of the mill.';
const TEXT = (n) => Array.from({ length: n }, (_, i) => `Paragraph ${i + 1}. ${PARA}`).join('\n\n');

// INK's census, word for word, plus PANELS
const CENSUS = `(() => {
  const SEL = "button, a[href], [role=button], [role=tab], [role=radio], [role=checkbox], [role=menuitem], [role=switch], input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex='-1'])";
  const r1 = (n) => Math.round(n * 10) / 10;
  const opac = (e) => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); o *= parseFloat(s.opacity); if (s.display === 'none') return 0; } return o; };
  const name = (e) => { const t = (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28);
    const id = e.id ? '#' + e.id : ''; const cls = [...e.classList].slice(0, 2).map((c) => '.' + c).join('');
    const data = [...e.attributes].filter((a) => a.name.startsWith('data-')).slice(0, 2).map((a) => '[' + a.name + (a.value ? '=' + a.value.slice(0, 16) : '') + ']').join('');
    return e.tagName.toLowerCase() + id + cls + data + (t ? ' "' + t + '"' : ''); };
  // the SEEN box: the element's box clipped to the window and to every clipping ancestor (overflow not visible), stopping at a fixed box
  const seen = (e) => { const b = e.getBoundingClientRect(); let l = Math.max(b.left, 0), t = Math.max(b.top, 0), r = Math.min(b.right, innerWidth), btm = Math.min(b.bottom, innerHeight);
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); if (n !== e && (s.overflowX !== 'visible' || s.overflowY !== 'visible')) { const c = n.getBoundingClientRect();
      if (s.overflowX !== 'visible') { l = Math.max(l, c.left); r = Math.min(r, c.right); } if (s.overflowY !== 'visible') { t = Math.max(t, c.top); btm = Math.min(btm, c.bottom); } }
      if (s.position === 'fixed') break; }
    return { left: l, top: t, right: r, bottom: btm, width: r - l, height: btm - t }; };
  const drawn = (e) => { const b = seen(e); if (b.width < 4 || b.height < 4) return null;
    const s = getComputedStyle(e); if (s.visibility !== 'visible') return null; if (opac(e) < 0.1) return null; return b; };
  const page = document.querySelector('.mode-page'); const pr = page ? page.getBoundingClientRect() : null;
  const marks = [...document.querySelectorAll('[data-flux3-bracket]')].map((m) => ({ el: m, b: drawn(m) || m.getBoundingClientRect(), shown: !!drawn(m), name: 'corner mark ' + m.getAttribute('data-flux3-bracket') }));
  // the panels: in each open dock, the largest drawn bordered element (the dock itself counts), at least 150 x 200
  const bordered = (e) => { const s = getComputedStyle(e); return ['Top', 'Right', 'Bottom', 'Left'].filter((k) => parseFloat(s['border' + k + 'Width']) >= 1 && s['border' + k + 'Style'] !== 'none').length >= 2; };
  const docks = [...document.querySelectorAll('.wz-sliver[data-open=true], .wz-tutor-grip[aria-expanded=true], .wz-drawer-slide')].map((d) => d.classList.contains('wz-tutor-grip') ? d.parentElement : d).filter(Boolean);
  const panels = [];
  for (const d of docks) { const slide = d.matches('.wz-drawer-slide') ? d : d.querySelector('.wz-drawer-slide'); const sb = slide && drawn(slide);
    if (sb && sb.width >= 150 && sb.height >= 200) { if (!panels.some((p) => p.el === slide)) panels.push({ el: slide, b: sb, name: 'panel ' + name(slide).slice(0, 60) }); continue; }
    let best = null; for (const e of [d, ...d.querySelectorAll('*')]) { const b = drawn(e); if (!b || b.width < 150 || b.height < 200 || !bordered(e)) continue; if (!best || b.width * b.height > best.b.width * best.b.height) best = { el: e, b }; }
    if (best && !panels.some((p) => p.el === best.el)) panels.push({ ...best, name: 'panel ' + name(best.el).slice(0, 60) }); }
  const all = [...document.querySelectorAll(SEL)].filter((e) => !e.closest('.forward-only-editor, [contenteditable=true]'));
  const ctl = []; for (const e of all) { const b = drawn(e); if (b) ctl.push({ el: e, b, name: name(e) }); }
  const box = (b) => [r1(b.left), r1(b.top), r1(b.width), r1(b.height)];
  const cross = (a, b) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0.5 && h > 0.5 ? r1(w) + 'x' + r1(h) : null; };
  const overlaps = [];
  for (let i = 0; i < ctl.length; i += 1) for (let j = i + 1; j < ctl.length; j += 1) {
    const a = ctl[i], b = ctl[j]; if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const c = cross(a.b, b.b); if (c) overlaps.push({ kind: 'control', a: a.name, ab: box(a.b), b: b.name, bb: box(b.b), by: c }); }
  if (pr) for (const a of ctl) { if (page.contains(a.el)) continue; const c = cross(a.b, pr); if (c) overlaps.push({ kind: 'page', a: a.name, ab: box(a.b), b: 'the page', bb: box(pr), by: c }); }
  for (const m of marks) if (m.shown) for (const a of ctl) { const c = cross(a.b, m.b); if (c) overlaps.push({ kind: 'mark', a: a.name, ab: box(a.b), b: m.name, bb: box(m.b), by: c }); }
  for (const p of panels) for (const a of ctl) { if (p.el.contains(a.el)) continue; const c = cross(a.b, p.b); if (c) overlaps.push({ kind: 'panel', a: a.name, ab: box(a.b), b: p.name, bb: box(p.b), by: c }); }
  const covered = [];
  for (const a of ctl) { const x = a.b.left + a.b.width / 2, y = a.b.top + a.b.height / 2; const hit = document.elementFromPoint(x, y);
    if (!hit || !(hit === a.el || a.el.contains(hit))) covered.push({ a: a.name, ab: box(a.b), hit: hit ? name(hit) : null }); }
  return { page: pr ? box(pr) : null, panels: panels.map((p) => [p.name, ...box(p.b)]), marks: marks.map((m) => ({ name: m.name, b: box(m.b), shown: m.shown })), controls: ctl.map((a) => [a.name, ...box(a.b)]), overlaps, covered };
})()`;

const LIVE = `(() => { const r = document.documentElement, rail = [...document.querySelectorAll('nav *, aside *')].find((e) => /^drawers$/i.test((e.textContent || '').trim()) && e.closest('button, a, [role=button], [role=tab]'));
  const item = rail ? rail.closest('button, a, [role=button], [role=tab]') : null;
  return { theme: r.getAttribute('data-theme'), arbor2: r.hasAttribute('data-arbor2'), room: r.getAttribute('data-arbor2-room') || r.getAttribute('data-machina2-room'), page: r.getAttribute('data-page'),
    top: !!document.querySelector('.reorg-top'), w: innerWidth, h: innerHeight,
    front: document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true', back: document.querySelector('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true',
    drawersActive: !!item && (item.getAttribute('aria-current') === 'page' || item.getAttribute('aria-selected') === 'true' || item.getAttribute('aria-pressed') === 'true' || item.getAttribute('aria-expanded') === 'true' || /\\bactive\\b|is-on|is-open/.test(item.className)),
    slide: !!document.querySelector('.wz-drawer-slide') }; })()`;

await withHarness(async (app) => {
  const ev = (s) => app.evalJs(s);
  const soft = async (expr, timeout = 6000) => { try { await app.waitFor(expr, { timeout, label: expr.slice(0, 60) }); return true; } catch { return false; } };
  const pressAt = async (p) => { await app.mouseMove(p.x, p.y); await sleep(80); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(350); };
  const press = async (sel) => {
    const p = await ev(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (!p) return false; await pressAt(p); return true;
  };
  // the rail's Drawers, by its word (select by name, never by index)
  const pressDrawers = async () => {
    const p = await ev(`(() => { const lab = [...document.querySelectorAll('nav *, aside *')].find((e) => /^drawers$/i.test((e.textContent || '').trim()) && e.closest('button, a, [role=button], [role=tab]'));
      const b = lab && lab.closest('button, a, [role=button], [role=tab]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (!p) return false; await pressAt(p); return true;
  };
  const shot = async (tag) => { try { fs.writeFileSync(path.join(OUT, `${tag}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); } catch { /* a frame is evidence, not a verdict */ } };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','plateau');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await soft("!document.querySelector('.wz-splash')", 20000);
  // a Doc of three Parts and one drawer, seeded through the seams at the Desk
  const seeded = await ev(`(() => { const W = window; const doc = W.wrizoCreateProject('The Mill');
    const parts = [[40, 'Chapter One'], [12, 'Chapter Two'], [8, 'Chapter Three']].map(([n, t], i) => W.wrizoCreateJournalPage({ id: 'ov129-' + i, text: t + '\\n\\n' +${q(TEXT(40))}.split('\\n\\n').slice(0, n).join('\\n\\n'), createdAt: '2026-04-01T00:0' + i + ':00.000Z', origin: 'project', projectId: doc.id, orderIndex: i, source: 'page' }));
    const dr = W.wrizoCreateDrawer('Fiction'); const set = dr && W.wrizoSetProjectDrawer(doc.id, dr.id);
    W.wrizoFlushNow(); return !!doc && parts.every(Boolean) && !!dr && !!set; })()`);
  const lives = [], counts = [], notes = [], cloths = [];
  for (const [theme, T] of THEMES) for (const tone of TONES) for (const [w, h] of WIDTHS) for (const state of STATES) {
    const arm = `${T}${tone === 'light' ? 'L' : 'D'}${w}${state[0].toUpperCase()}`;
    await app.emulateDpr(1, w, h);
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${q(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', ${q(theme)}); localStorage.setItem('wrizo-mode-page-ov129-0', 'drafting'); history.replaceState(null, '', '/#/page/ov129-0'); return true; })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 20000 });
    await soft("!document.querySelector('.wz-splash')", 25000);
    await sleep(800);
    const st0 = await ev(LIVE);
    // the state: each menu set by its own grip (read back first, pressed only when it is not already as the arm needs)
    const wantFront = state === 'front', wantBack = state === 'back';
    if (st0.front !== wantFront) await press('.wz-sliver-grip');
    if (st0.back !== wantBack) await press('.wz-tutor-grip');
    await sleep(700);
    if (state === 'drawers') { await pressDrawers(); await sleep(1000); }
    await app.mouseMove(4, Math.round(h / 2));   // the pointer on the rail's side, nothing typed
    await sleep(1200);
    await ev("document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); true");
    const live = await ev(LIVE);
    const stood = live.theme === theme && live.w === w && live.h === h && live.top && (theme !== 'plateau' || live.arbor2)
      && (state === 'drawers' ? (live.drawersActive || live.slide) : (live.front === wantFront && live.back === wantBack));
    lives.push([arm, stood, live]);
    const c = await ev(CENSUS);
    // D2 (Nov 24, 1:20 pm): the census's panels did not include the rail's own pop-out (.wz-cascade-panel), so O<...>D compared the opened cloth only with
    // the rows inside it. D2 reads the opened cloth's box against the pop-out's own box (its 3 px edge included): the cloth may touch it, never cross it.
    if (state === 'drawers') cloths.push([arm, await ev("(() => { const d = [...document.querySelectorAll('[aria-pressed=true], .active')].find((e) => /^drawers$/i.test((e.textContent || '').trim()) && e.closest('nav, aside')); const p = [...document.querySelectorAll('.wz-cascade-panel')].find((e) => e.getAttribute('data-visible') !== 'false' && e.getBoundingClientRect().width > 50); if (!d || !p) return { cloth: !!d, panel: !!p }; const a = d.getBoundingClientRect(), b = p.getBoundingClientRect(); const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return { cloth: [Math.round(a.left * 10) / 10, Math.round(a.right * 10) / 10], panel: [Math.round(b.left * 10) / 10, Math.round(b.right * 10) / 10], cross: w > 0.5 && h > 0.5 ? Math.round(w * 10) / 10 : 0 }; })()")]);
    // N-B (Fable's condition, 1:15 pm): in Arbor's Back arms each tab-note cell's middle is level with its own tab's middle
    if (theme === 'plateau' && state === 'back') notes.push([arm, await ev("(() => { const tabs = [...document.querySelectorAll('.arbor2-c2--right .wz-drawer-tab')], cells = [...document.querySelectorAll('.arbor2-c2--right .wz-drawer-tabnote-cell')]; const mid = (e) => { const r = e.getBoundingClientRect(); return Math.round((r.top + r.height / 2) * 10) / 10; }; return { tabs: tabs.map(mid), cells: cells.map(mid) }; })()")]);
    counts.push([arm, c.controls.length, !!c.page, c.panels.length, state]);
    await shot(`${arm}-${theme}-${tone}-${w}-${state}`);
    console.log(`DIAG 129 [${arm}] room ${live.room} page ${q(c.page)} panels ${q(c.panels)} marks ${q(c.marks.filter((m) => m.shown))}`);
    console.log(`DIAG 129 [${arm}] controls ${c.controls.length}: ${q(c.controls)}`);
    ok(`O${arm} [${theme} ${tone} ${w} ${state}] no drawn control crosses another control, the page, a corner mark or an open panel (${c.overlaps.length} crossing)`, c.overlaps.length === 0, c.overlaps);
    ok(`H${arm} [${theme} ${tone} ${w} ${state}] every drawn control can be pressed: the element at its centre is the control or inside it (${c.covered.length} covered)`, c.covered.length === 0, c.covered);
  }
  const n = THEMES.length * TONES.length * WIDTHS.length * STATES.length;
  ok('P0 (premise) every arm is the theme it names at its width (read back), the Doc seeded, and the state it names standing', seeded && lives.length === n && lives.every((l) => l[1]), { seeded, bad: lives.filter((l) => !l[1]) });
  ok(`D2 the rail's opened Drawers cloth touches its pop-out at most, never crossing the pop-out's box (its edge included), in every DRAWERS arm (${cloths.length})`, cloths.length === THEMES.length * TONES.length * WIDTHS.length && cloths.every(([, v]) => Array.isArray(v.cloth) && v.cross === 0), cloths);
  ok(`N-B in Arbor's Back menu every tab-note cell stands level with its own tab (middles within 1.5 px), in every Back arm (${notes.length})`, notes.length === WIDTHS.length * TONES.length && notes.every(([, v]) => v.tabs.length >= 3 && v.cells.length === v.tabs.length && v.cells.every((y, i) => Math.abs(y - v.tabs[i]) <= 1.5)), notes);
  ok('P1 (premise) every arm found the page and at least 8 drawn controls, and every FRONT/BACK arm found its open panel', counts.length === n && counts.every((c) => c[1] >= 8 && c[2] && (c[4] === 'drawers' || c[3] >= 1)), counts);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 2400)}`);
const EXPECTED = 4 + 2 * THEMES.length * TONES.length * WIDTHS.length * STATES.length;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-129-OVERLAPS VERIFY: PASS (${checks.length} checks)` : `\nARBOR-129-OVERLAPS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
