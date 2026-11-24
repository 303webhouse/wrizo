// #125 (Nov 24, live, Flux; Nick's screenshots on a 30" 4K monitor): "controls overlap beside the page. The page's '+' sits on the Back menu's '›' tab
// (TEXT and Uplink views), and the edge tabs crowd the page's corner marks." Fable's rule: NO CONTROL OVERLAPS ANOTHER CONTROL, THE PAGE, OR ITS CORNER
// MARKS, AT 1366, 1920 AND 2560. Read on the Flux a writer gets (the redesign and the reorg by default), a Doc of two Parts, the chrome standing (the
// pointer on the rail's side, nothing typed), in TEXT (Draft) and in Uplink (the whole-Doc view).
//   P0  (premise) every arm is the live Flux at its width (the window read back), the Doc seeded, and the view it names is the one open
//   P1  (premise) every arm found the page, its two corner marks, and at least 8 drawn controls (a census that found nothing would pass blind); the page
//       carries four connections (seeded through wrizoAddPageLink), so its four ports stand on its right edge in TEXT
//   P2  (premise) every state is the one it names (the drawers' own data-open read back)
//   (the first run, 09a26ed8, had no connections: no ports drew, and the + stood 4 px clear of the Back menu's tab at every width)
//   (the second run, 10067323, found Nick's case: with the Back menu OPEN its tab row (Spine...) lies over the page's + by 22x16 px and the + cannot be
//   pressed, at every width and in both views; and at rest the first port covers the Part "up" arrow, which cannot be pressed at 1366 and 1920)
//   Each arm is read in three states: at REST, with the BACK menu open (the right hand's drawer), with the FRONT menu open (the left hand's).
//   O<w><view><state>  no drawn control's box crosses another control's box, the page (a control outside the page), a corner mark, or an open
//                      hand's panel (a control outside it, on its border or over it: #129's extension of the rule, Fable 11:31 am)
//   H<w><view><state>  every drawn control can be pressed: the element at its centre is the control or inside it
//   CM<w><view>        (INK's reading of "the edge tabs CROWD the corner marks", for Fable to keep or drop) at rest, every drawn control stands at
//                      least 8 px clear of each corner mark (on the box, either axis). PENDING: printed as READ always, a check only under WS_125_CM=1
//                      (run 3, a90bbf91, read it red: the opener tabs stand 5 px below the top-left mark, and their place is Nick's own rule)
// A "control" is anything she can press or tab to (button, link, tab, radio, checkbox, menu item, field, a positive tabindex), outside the editor's text,
// drawn: its box clipped by every clipping ancestor and the window, at least 4x4 px left, visible, its opacity (with every ancestor's) at least 0.1, and not
// under an opaque sheet. A pair where one holds the other is not an overlap. A pair inside ONE menu panel (both in the Back menu, or both in the Front
// menu) is that menu's own layout, not "beside the page": printed as DIAG, not checked here (the Back menu's Part heads carry their Assets "+" on their row).
// Run: node scripts/harness/flux-125-overlaps.mjs   (from apps/desktop; Actions harness or a box turn)
process.env.WS_REORG = '1';
process.env.WS_FLUX3 = 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const WIDTHS = [[1366, 768], [1920, 1080], [2560, 1440]];
const VIEWS = ['text', 'uplink'];
const PARA = 'The harbour was quiet when she arrived, and the boats sat low in the water as if they were listening for something under the tide.';
const TEXT_A = Array.from({ length: 40 }, () => PARA).join('\n\n');
const TEXT_B = Array.from({ length: 12 }, () => PARA).join('\n\n');
const LIVE = "({ theme: document.documentElement.getAttribute('data-theme'), flux3: document.documentElement.hasAttribute('data-flux3'), top: !!document.querySelector('.reorg-top'), search: location.search, w: innerWidth, h: innerHeight, uplink: document.querySelector('[data-mode-key=publish]')?.getAttribute('aria-selected') === 'true' })";

// the census: every drawn control, the page, the corner marks; then every crossing pair and every control whose centre is covered
const CENSUS = `(() => {
  const SEL = "button, a[href], [role=button], [role=tab], [role=radio], [role=checkbox], [role=menuitem], [role=switch], input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex='-1'])";
  const r1 = (n) => Math.round(n * 10) / 10;
  const opac = (e) => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); o *= parseFloat(s.opacity); if (s.display === 'none') return 0; } return o; };
  const name = (e) => { const t = (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28);
    const id = e.id ? '#' + e.id : ''; const cls = [...e.classList].slice(0, 2).map((c) => '.' + c).join('');
    const data = [...e.attributes].filter((a) => a.name.startsWith('data-')).slice(0, 2).map((a) => '[' + a.name + (a.value ? '=' + a.value.slice(0, 16) : '') + ']').join('');
    return e.tagName.toLowerCase() + id + cls + data + (t ? ' "' + t + '"' : ''); };
  // drawn = its box CLIPPED by every ancestor that clips (overflow other than visible) and by the window, at least 4x4 px of it left (run 1, 09a26ed8: the
  // Part foot's "Next" link, scrolled out of the page's text window at 1366, read as a covered control because its unclipped box lay over the page)
  const clipped = (e, b) => { let l = Math.max(0, b.left), t = Math.max(0, b.top), r = Math.min(innerWidth, b.right), btm = Math.min(innerHeight, b.bottom);
    for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) { const s = getComputedStyle(n);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') { const c = n.getBoundingClientRect(); l = Math.max(l, c.left); t = Math.max(t, c.top); r = Math.min(r, c.right); btm = Math.min(btm, c.bottom); }
      if (s.position === 'fixed') break; }
    return r - l >= 4 && btm - t >= 4 ? new DOMRect(l, t, r - l, btm - t) : null; };
  const drawn = (e) => { const b0 = e.getBoundingClientRect(); if (b0.width < 4 || b0.height < 4) return null;
    const s = getComputedStyle(e); if (s.visibility !== 'visible') return null; if (opac(e) < 0.1) return null; return clipped(e, b0); };
  // hidden UNDER AN OPAQUE SHEET: the element at its centre sits in a layer whose own background is fully opaque and covers the control's whole box (run 1:
  // Uplink's sheet, .reorg-pub, paints var(--paper) over the page, so the TEXT page's foot beneath it is not drawn; a see-through cover is NOT this)
  const sheetOver = (e, b) => { const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); if (!hit || hit === e || e.contains(hit)) return null;
    for (let n = hit; n && n !== document.documentElement && !n.contains(e); n = n.parentElement) { const bg = getComputedStyle(n).backgroundColor; const m = bg.match(/rgba?\\(([^)]+)\\)/);
      const a = m ? (m[1].split(',')[3] === undefined ? 1 : parseFloat(m[1].split(',')[3])) : 0; const c = n.getBoundingClientRect();
      if (a >= 0.99 && opac(n) >= 0.99 && c.left <= b.left + 0.5 && c.top <= b.top + 0.5 && c.right >= b.right - 0.5 && c.bottom >= b.bottom - 0.5) return n; }
    return null; };
  const page = document.querySelector('.mode-page'); const pr = page ? page.getBoundingClientRect() : null;
  const marks = [...document.querySelectorAll('[data-flux3-bracket]')].map((m) => ({ el: m, b: drawn(m) || m.getBoundingClientRect(), shown: !!drawn(m), name: 'corner mark ' + m.getAttribute('data-flux3-bracket') }));
  const all = [...document.querySelectorAll(SEL)].filter((e) => !e.closest('.forward-only-editor, [contenteditable=true]'));
  const ctl = [], under = []; for (const e of all) { const b = drawn(e); if (!b) continue; const sh = sheetOver(e, b); if (sh) { under.push([name(e), name(sh)]); continue; } ctl.push({ el: e, b, name: name(e) }); }
  const box = (b) => [r1(b.left), r1(b.top), r1(b.width), r1(b.height)];
  const cross = (a, b) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0.5 && h > 0.5 ? r1(w) + 'x' + r1(h) : null; };
  const overlaps = [], inMenu = [];
  for (let i = 0; i < ctl.length; i += 1) for (let j = i + 1; j < ctl.length; j += 1) {
    const a = ctl[i], b = ctl[j]; if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const c = cross(a.b, b.b); if (!c) continue;
    const pa = a.el.closest('.wz-tutor-panel, .wz-sliver-panel'); if (pa && pa === b.el.closest('.wz-tutor-panel, .wz-sliver-panel')) { inMenu.push([a.name, b.name, c]); continue; }
    overlaps.push({ kind: 'control', a: a.name, ab: box(a.b), b: b.name, bb: box(b.b), by: c }); }
  if (pr) for (const a of ctl) { if (page.contains(a.el)) continue; const c = cross(a.b, pr); if (c) overlaps.push({ kind: 'page', a: a.name, ab: box(a.b), b: 'the page', bb: box(pr), by: c }); }
  for (const m of marks) if (m.shown) for (const a of ctl) { const c = cross(a.b, m.b); if (c) overlaps.push({ kind: 'mark', a: a.name, ab: box(a.b), b: m.name, bb: box(m.b), by: c }); }
  // #129 (Fable, 11:31 am: the rule now covers A PANEL BORDER, every theme): an open hand's panel (its drawn box, border included); a control outside it
  // whose box crosses it lies on its border or over it. Touching the border is not crossing (more than 0.5 px each way)
  const panels = [...document.querySelectorAll(".wz-tutor-panel[data-open='true'], .wz-sliver-panel[data-open='true']")].map((p) => ({ el: p, b: drawn(p) })).filter((p) => p.b);
  for (const p of panels) for (const a of ctl) { if (p.el.contains(a.el)) continue; const c = cross(a.b, p.b); if (c) overlaps.push({ kind: 'panel', a: a.name, ab: box(a.b), b: 'the ' + (p.el.classList.contains('wz-tutor-panel') ? 'Back' : 'Front') + ' menu panel', bb: box(p.b), by: c }); }
  const covered = [];
  for (const a of ctl) { const x = a.b.left + a.b.width / 2, y = a.b.top + a.b.height / 2; const hit = document.elementFromPoint(x, y);
    if (!hit || !(hit === a.el || a.el.contains(hit))) covered.push({ a: a.name, ab: box(a.b), hit: hit ? name(hit) : null }); }
  // the clearance to each corner mark: the gap between the boxes (0 when they touch or cross), the larger of the two axes' gaps
  const gap = (a, b) => Math.max(Math.max(a.left, b.left) - Math.min(a.right, b.right), Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom), 0);
  const near = []; for (const m of marks) if (m.shown) for (const a of ctl) { const g = gap(a.b, m.b); if (g < 8) near.push({ a: a.name, ab: box(a.b), mark: m.name, mb: box(m.b), gap: r1(g) }); }
  return { page: pr ? box(pr) : null, marks: marks.map((m) => ({ name: m.name, b: box(m.b), shown: m.shown })), controls: ctl.map((a) => [a.name, ...box(a.b)]), under, inMenu, overlaps, covered, near };
})()`;

await withHarness(async (app) => {
  const ev = (s) => app.evalJs(s);
  const soft = async (expr, timeout = 6000) => { try { await app.waitFor(expr, { timeout, label: expr.slice(0, 60) }); return true; } catch { return false; } };
  const press = async (sel) => {
    const p = await ev(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (!p) return false;
    await app.mouseMove(p.x, p.y); await sleep(80); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(250);
    return true;
  };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await soft("!document.querySelector('.wz-splash')", 20000);
  // a Doc of two Parts, seeded through the seams at the Desk (the Part arrows and the Uplink list have something to show)
  const seeded = await ev(`(() => { const W = window; const doc = W.wrizoCreateProject('Harbour');
    const a = W.wrizoCreateJournalPage({ id: 'ov-a', text: ${q(TEXT_A)}, createdAt: '2026-04-01T00:00:00.000Z', origin: 'project', projectId: doc.id, orderIndex: 0, source: 'page' });
    const b = W.wrizoCreateJournalPage({ id: 'ov-b', text: ${q(TEXT_B)}, createdAt: '2026-04-01T00:01:00.000Z', origin: 'project', projectId: doc.id, orderIndex: 1, source: 'page' });
    // four connections (the page's ports on its right edge, where the hands' tabs and the Part arrows also stand): a link to its sibling Part and to three loose pages
    const loose = [1, 2, 3].map((n) => W.wrizoCreateJournalPage({ id: 'ov-l' + n, text: 'Loose page ' + n + ' about the harbour.', createdAt: '2026-04-01T00:0' + (n + 1) + ':00.000Z', origin: 'loose', projectId: null, source: 'page' }));
    const links = ['ov-b', 'ov-l1', 'ov-l2', 'ov-l3'].map((id) => W.wrizoAddPageLink('ov-a', { bEntryId: id }));
    W.wrizoFlushNow(); return !!doc && !!a && !!b && loose.every(Boolean) && links.every(Boolean); })()`);
  const lives = [], counts = [], drawers = [];
  for (const [w, h] of WIDTHS) {
    await app.emulateDpr(1, w, h);
    for (const view of VIEWS) {
      const arm = `${w} ${view === 'text' ? 'TEXT' : 'Uplink'}`;
      await ev("(() => { localStorage.setItem('wrizo-mode-page-ov-a', 'drafting'); history.replaceState(null, '', '/#/page/ov-a'); return true; })()");
      await app.reload();
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 20000 });
      await soft("!document.querySelector('.wz-splash')", 25000);
      await soft("document.documentElement.hasAttribute('data-flux3') && !!document.querySelector('.reorg-top') && document.querySelectorAll('[data-flux3-bracket]').length === 2", 10000);
      if (view === 'uplink') { await press('[data-mode-key=publish]'); await soft("document.querySelector('[data-mode-key=publish]')?.getAttribute('aria-selected') === 'true'", 6000); }
      await app.mouseMove(4, Math.round(h / 2));   // the chrome stands: nothing typed, the pointer on the rail's side
      await sleep(1500);
      await ev("document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); true");
      const live = await ev(LIVE);
      lives.push([arm, live.theme === 'flux' && live.flux3 && live.top && !/flux3|reorg/.test(live.search) && live.w === w && live.h === h && live.uplink === (view === 'uplink'), live]);
      const V = view === 'text' ? 'T' : 'U';
      const OPEN = "({ back: document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true', front: document.querySelector('.wz-sliver-panel')?.getAttribute('data-open') === 'true' })";
      // three states: at rest, then each hand's drawer opened by a real press on its tab, read, and closed again
      for (const [state, S, grip] of [['rest', 'R', null], ['Back menu open', 'B', '.wz-tutor-grip'], ['Front menu open', 'F', '.wz-sliver-grip']]) {
        if (grip) {
          await press(grip); await soft(`(${OPEN}).${S === 'B' ? 'back' : 'front'}`, 4000); await sleep(700);
          await app.mouseMove(4, Math.round(h / 2)); await sleep(600);
          await ev("document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); true");
        }
        const open = await ev(OPEN);
        drawers.push([`${arm} ${state}`, S === 'R' ? !open.back && !open.front : S === 'B' ? open.back && !open.front : open.front && !open.back, open]);
        const c = await ev(CENSUS);
        if (S === 'R') counts.push([arm, c.controls.length, c.marks.filter((m) => m.shown).length, !!c.page, await ev("document.querySelectorAll('.flux3-port').length")]);
        console.log(`DIAG 125 [${arm} ${state}] page ${q(c.page)} marks ${q(c.marks)}`);
        console.log(`DIAG 125 [${arm} ${state}] controls ${c.controls.length}: ${q(c.controls)} | under an opaque sheet ${c.under.length}: ${q(c.under)} | inside one menu ${c.inMenu.length}: ${q(c.inMenu)}`);
        ok(`O${w}${V}${S} [${arm}, ${state}] no drawn control crosses another control, the page, or a corner mark (${c.overlaps.length} crossing)`, c.overlaps.length === 0, c.overlaps);
        ok(`H${w}${V}${S} [${arm}, ${state}] every drawn control can be pressed: the element at its centre is the control or inside it (${c.covered.length} covered)`, c.covered.length === 0, c.covered);
        // CM is PENDING Fable's ruling (Nov 24): the only controls inside 8 px of a mark are the hands' opener tabs (5 px below the top-left mark), and
        // their place is Nick's own rule ("the opener tabs keep today's shape, place and arrow flip", flux-v3.css; flux3-s3.mjs HANDS). Read and printed
        // always; a check only under WS_125_CM=1 until the ruling says which gives way (the tabs, the marks, or neither)
        if (S === 'R') {
          console.log(`READ CM${w}${V} [${arm}, rest] controls within 8 px of a corner mark: ${c.near.length} ${q(c.near)}`);
          if (process.env.WS_125_CM === '1') ok(`CM${w}${V} [${arm}, rest] (INK's reading of "crowd") every drawn control stands at least 8 px clear of each corner mark (${c.near.length} closer)`, c.near.length === 0, c.near);
        }
        if (grip) { await press(grip); await soft(`!(${OPEN}).${S === 'B' ? 'back' : 'front'}`, 4000); await sleep(500); }
      }
    }
  }
  ok('P0 (premise) every arm is the live Flux at its width (read back), the Doc of two Parts seeded, and the view it names open', seeded && lives.length === 6 && lives.every((l) => l[1]), { seeded, lives });
  ok('P1 (premise) every arm found the page, both corner marks drawn, at least 8 drawn controls, and the page\'s four ports (its four connections) drawn in TEXT', counts.length === 6 && counts.every((c) => c[1] >= 8 && c[2] === 2 && c[3] && (!/TEXT/.test(c[0]) || c[4] === 4)), counts);
  ok('P2 (premise) every state is the one it names: at rest neither drawer open, then the Back menu alone, then the Front menu alone (read back)', drawers.length === 18 && drawers.every((d) => d[1]), drawers);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 2400)}`);
const EXPECTED = process.env.WS_125_CM === '1' ? 45 : 39;   // 3 widths x 2 views x 3 states x (O, H) = 36, P0 P1 P2; CM 6 only under WS_125_CM=1 (pending)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nFLUX-125-OVERLAPS VERIFY: PASS (${checks.length} checks)` : `\nFLUX-125-OVERLAPS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
