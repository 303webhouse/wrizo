// PAGE SIZE (Fable, Oct 23 - Nick approved). Plan: docs/plans/page-size.md. Mockup: origin/cursor/page-size-mockup @ e3c4e462 (final).
// RED-FIRST: written before the build. On main, R, C, F, Z, P and N are expected RED; B, U, X, W, T, G and K are regression guards that
// may already hold. The mutants only mean something on the build (on main a predicate that already fails also fails under its mutant).
//
//   EVERY CHECK RUNS AT NICK'S FOUR SIZES (ruling c, Oct 23): 1366x768, 1920x1080, 2560x1440 (his 27" 4K at 150%), 3840x2160. Both themes.
//   THE PAGE SCALE k (ruling c) comes from the STAGE's size alone, smoothly: the largest at which the whole letter page fits the stage height
//   with a small margin, never below 1.0 (620x803). It is MEASURED here as the page's width / 620, then held to that law:
//   R  the page: at k = 1, 620 wide (within 3%) and capped to the stage (ruling d - the text scrolls inside); at k > 1, letter-proportioned
//      (w/h = 8.5/11 within 1%) and the LARGEST that fits - its height within FIT_SLACK of the stage's - and inside the stage
//   C  chars per line at the default: the median full line of a seeded paragraph holds 72-78 characters (~75)
//   F  the editor's type is 12 pt in PAGE units: 16px x k (within 1%) - ruling a
//   L  the page breaks its lines exactly where it does at 1366x768, at every size (it grows, it never reflows)
//   K  opening the panels never moves or rescales the page (the scale comes from the stage, never the chrome)
//   N  (Fable's 1366 rule, Oct 23) where both drawers fit beside the page at their minimum, BOTH stand open, each DRAWER_MIN or wider,
//      and the page sits fully BETWEEN them; where they do not, opening one closes the other (Nick's Oct 7 rule) and it sits clear of the page
//   THE ZOOM (Typewriter / Terminal Mode), both themes, at every size, entered and left LIVE through the writer's own control (the Sliver's
//   typewriter button), with trusted input:
//   Z  the page paints ~1.6x its normal width (within 0.03), unless that would not fit: then it is the largest that fits the stage's width
//      with the panels tucked (within ZOOM_FIT_SLACK); either way it never overflows the stage
//   B  the line breaks are IDENTICAL in both views (the character offsets where each visual line starts) - scale, never reflow
//   U  the editor is the SAME node before, during and after (no unmount)
//   X  leaving the zoom returns the exact normal rect (within 0.5px)
//   P  panels tucked: the Sliver and Tutor drawers are closed in the zoom (premise: the Tutor was OPEN before)
//   W  the writing line paints at full strength
//   T  the top fade is present (Cursor's final mask, e3c4e462): older lines fade as they rise - 1 above > 3 above > 5 above, 5 above at half or less
//   G  (1366) glide: a new line moves the scroll over several frames; under reduced motion it moves in one
//   FW Free Write (Arbor, 1366x768): Z and B
//   STRENGTH is read from the SCREENSHOT (decoded in the page through a canvas - no new dependency), so it is what is PAINTED, masks and
//   all: a line's ink = the largest colour distance from its own commonest colour (the paper); its strength = ink as painted / ink with
//   every mask and opacity in the stage stripped. The stripped reference is a premise: it must itself show ink.
//   MUTANTS (runtime, each asserts it LANDED before its predicate is read): MR page forced 760 wide; MC type at 14px; MB letter-spacing
//   changed while zoomed; MW the editor at opacity .5; MT every mask in the stage removed; MK the page scaled by an open panel (K fails).
//
// Seeding goes through the app's seams; the per-page mode and typewriter keys are this device's own UI keys (not collections).
// Needs a box turn.  Run: WS_BOX_TURN=<token> node scripts/harness/page-size.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const mouse = (app, type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const J = (v) => JSON.stringify(v);

// ---- the ruled numbers (plan section 1) - one place, so a ruling changes one line
const LETTER = 8.5 / 11;
const FRAME_PAGE_W = 620;
const PAGE_W_TOL = 0.03;
const RATIO_TOL = 0.01;
const FONT_PX = 16;
const CPL_MIN = 72;
const CPL_MAX = 78;
const ZOOM = 1.6;
const ZOOM_TOL = 0.03;
const FULL = 0.9;
const FADED = 0.5;
const FADE_STEP = 0.08;  // Cursor's final mask drops ~.29 from 1 above to 3 above and ~.28 from 3 to 5; .08 is clearly a fade, not noise
const GLIDE_MIN = 6;     // a 300ms ease passes through ~18 frames; 6 distinct scroll values is unmistakably a glide
const INSTANT_MAX = 3;   // the start, then at most two instant whole-line steps
// ruling (c), Nick via Fable, Oct 23: the page grows smoothly with the stage; these are his four test sizes
const SIZES = [[1366, 768], [1920, 1080], [2560, 1440], [3840, 2160]];
const FIT_SLACK = 96;       // "a small margin": the page's height is within this of the stage's when it is the largest that fits
const ZOOM_FIT_SLACK = 96;  // a zoom capped below 1.6 fills the stage's width to within this
// a drawer's narrowest open width (Fable, Oct 23 - drawers narrow to a minimum, scrolling inside). 200 is today's Tools drawer open
// width (menusDrawers.ts CLOSED_TOOLS_W); the build names ONE token for it and this number must equal that token.
const DRAWER_MIN = 200;
const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }];

const SENTENCES = [
  'The rope was already there, and the well took the bucket back colder still.',
  'Whatever is worth carrying is already with you, and the rest the wind can have.',
  'We left the map on the stone and walked until the light went thin over the ridge.',
  'The bucket came up colder than the morning, and nobody spoke for a long time.',
  'Somewhere below us a dog was barking at the river, and the river did not answer.',
  'She counted the steps back to the gate twice, because the first count felt wrong.',
];
const PARA = (() => { let s = ''; let i = 0; while (s.length < 2600) { s += (s ? ' ' : '') + SENTENCES[i % SENTENCES.length]; i += 1; } return s; })();
const pid = (theme, kind) => `ps-${theme}-${kind}`;

// ---- in-page instruments (re-installed after every reload)
const HELPERS = `(() => {
  const ed = () => document.querySelector('.forward-only-editor');
  // the editor's VISUAL lines, measured per character in screen px (transforms included): [{ start, top, bottom, left, right, n }]
  window.__psLines = () => {
    const e = ed(); if (!e) return null;
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement && n.parentElement.closest('.fo-placeholder')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const r = document.createRange(); const lines = []; let off = 0; let n; let cur = null;
    while ((n = w.nextNode())) {
      const len = n.data.length;
      for (let i = 0; i < len; i += 1, off += 1) {
        if (n.data[i] === '\\n') continue;
        r.setStart(n, i); r.setEnd(n, i + 1);
        const rs = r.getClientRects(); if (!rs.length) continue; const q = rs[0]; if (!q.height) continue;
        if (!cur || q.top >= cur.top + (cur.bottom - cur.top) * 0.6) { cur = { start: off, top: q.top, bottom: q.bottom, left: q.left, right: q.right, n: 0 }; lines.push(cur); }
        cur.n += 1; cur.left = Math.min(cur.left, q.left); cur.right = Math.max(cur.right, q.right); cur.bottom = Math.max(cur.bottom, q.bottom);
      }
    }
    return lines;
  };
  window.__psCaret = () => {
    const s = getSelection(); const e = ed(); if (!s || !s.rangeCount || !e || !e.contains(s.anchorNode)) return null;
    const r = s.getRangeAt(0); let rs = r.getClientRects(); let q = rs[rs.length - 1];
    if ((!q || !q.height) && r.startContainer.nodeType === 3 && r.startOffset > 0) { const rr = document.createRange(); rr.setStart(r.startContainer, r.startOffset - 1); rr.setEnd(r.startContainer, r.startOffset); const x = rr.getClientRects(); q = x[x.length - 1]; }
    return q && q.height ? { top: q.top, bottom: q.bottom, mid: (q.top + q.bottom) / 2 } : null;
  };
  window.__psCaretToEnd = () => {
    const e = ed(); if (!e) return false; e.focus();
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let last = null; let n; while ((n = w.nextNode())) { if (n.data.length) last = n; }
    const s = getSelection(); const r = document.createRange();
    if (last) { r.setStart(last, last.data.length); r.collapse(true); } else { r.selectNodeContents(e); r.collapse(false); }
    s.removeAllRanges(); s.addRange(r); return true;
  };
  window.__psGeom = () => {
    const e = ed(); const page = e && e.closest('.mode-page'); if (!e || !page) return null;
    const stage = page.closest('.desk-frame-stage') || page.closest('.mode-stage');
    const sc = e.closest('.mode-scroll');
    const p = page.getBoundingClientRect(); const s = stage ? stage.getBoundingClientRect() : null; const c = sc ? sc.getBoundingClientRect() : null;
    return { page: { left: p.left, top: p.top, width: p.width, height: p.height, right: p.right, bottom: p.bottom },
      stage: s ? { top: s.top, bottom: s.bottom, left: s.left, right: s.right, width: s.width, height: s.height } : null, scroll: c ? { top: c.top, bottom: c.bottom } : null,
      fontPx: parseFloat(getComputedStyle(e).fontSize), vh: innerHeight };
  };
  window.__psMark = () => { const e = ed(); if (e) e.__psMarked = 1; return !!e; };
  window.__psMarked = () => { const e = ed(); return !!e && e.__psMarked === 1; };
  window.__psStyle = (id, css) => { let el = document.getElementById(id); if (css == null) { if (el) el.remove(); return true; } if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); } el.textContent = css; return true; };
  window.__psFrames = (n) => new Promise((res) => { let k = 0; const f = () => { k += 1; if (k >= n) res(true); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
  window.__psLoad = async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0); window.__psPx = g.getImageData(0, 0, c.width, c.height); return [c.width, c.height];
  };
  window.__psInk = (x0, y0, x1, y1) => {
    const P = window.__psPx; if (!P) return null; const W = P.width; const H = P.height; const d = P.data;
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
    if (x1 <= x0 || y1 <= y0) return null;
    const bins = new Map();
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) { const i = (y * W + x) * 4; const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3); bins.set(k, (bins.get(k) || 0) + 1); }
    let best = 0; let bk = 0; for (const [k, v] of bins) if (v > best) { best = v; bk = k; }
    const pr = ((bk >> 10) & 31) * 8 + 4; const pg = ((bk >> 5) & 31) * 8 + 4; const pb = (bk & 31) * 8 + 4;
    let max = 0;
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) { const i = (y * W + x) * 4; const dd = Math.hypot(d[i] - pr, d[i + 1] - pg, d[i + 2] - pb); if (dd > max) max = dd; }
    return Math.round(max * 10) / 10;
  };
  window.__psMasks = () => { const root = document.querySelector('.desk-frame-stage') || document.querySelector('.mode-stage'); if (!root) return -1;
    return [root, ...root.querySelectorAll('*')].filter((el) => { const cs = getComputedStyle(el); const m = cs.maskImage || cs.webkitMaskImage; return m && m !== 'none'; }).length; };
  return true;
})()`;
const install = (app) => app.evalJs(HELPERS);

// strip every fade the stage can paint, so a line's UNFADED ink can be read (layout is untouched: masks and opacity never move a line)
const STRIP_CSS = `.desk-frame-stage, .desk-frame-stage *, .mode-stage, .mode-stage * { -webkit-mask-image:none !important; mask-image:none !important; }
.mode-page, .mode-page * { opacity:1 !important; }
.mode-page *::before, .mode-page *::after { background-image:none !important; }`;

const shoot = async (app) => { const b64 = await app.screenshot(); return app.evalJs(`window.__psLoad(${J(b64)})`); };
// strength of each line rect: painted ink / stripped ink. `keepStrip` measures the "painted" pass with the strip ALREADY applied (mutant MT).
const strengths = async (app, rects, { keepStrip = false } = {}) => {
  const box = (r) => [r.left - 2, r.top, r.right + 2, r.bottom];
  if (keepStrip) await app.evalJs(`window.__psStyle('ps-strip-mut', ${J(STRIP_CSS)})`);
  await app.evalJs('window.__psFrames(3)');
  await shoot(app);
  const painted = await app.evalJs(`(${J(rects.map(box))}).map((b) => window.__psInk(...b))`);
  await app.evalJs(`window.__psStyle('ps-strip', ${J(STRIP_CSS)})`);
  await app.evalJs('window.__psFrames(3)');
  await shoot(app);
  const bare = await app.evalJs(`(${J(rects.map(box))}).map((b) => window.__psInk(...b))`);
  await app.evalJs("window.__psStyle('ps-strip', null)");
  if (keepStrip) await app.evalJs("window.__psStyle('ps-strip-mut', null)");
  await app.evalJs('window.__psFrames(2)');
  return rects.map((_, i) => ({ painted: painted[i], bare: bare[i], s: bare[i] ? Math.round((painted[i] / bare[i]) * 100) / 100 : null }));
};

const openPage = async (app, id) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", { label: id, timeout: 10000 });
  await sleep(900);
  await install(app);
  return there;
};
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${J(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; })()`);
const attr = (app, sel, a) => app.evalJs(`document.querySelector(${J(sel)})?.getAttribute(${J(a)}) ?? null`);
const TOGGLE = '[data-mode-toggle="typewriter"]';
// the writer's own control: open the Sliver if it is closed, then press its typewriter button (trusted). Returns aria-pressed after.
const pressTypewriter = async (app) => {
  if ((await attr(app, '.wz-sliver', 'data-open')) !== 'true') { const g = await rectOf(app, '.wz-sliver-grip'); if (g) { await click(app, g.x, g.y); await sleep(500); } }
  const t = await rectOf(app, TOGGLE); if (!t) return null;
  await click(app, t.x, t.y); await sleep(1100);
  // the pressed state is read from the button if it is still on screen, else from the page's own key
  const pressed = await attr(app, TOGGLE, 'aria-pressed');
  return pressed;
};
const typewriterIs = async (app, id) => app.evalJs(`localStorage.getItem('wrizo-typewriter-page-${id}')`);
const openTutor = async (app) => {
  if ((await attr(app, '.wz-tutor-panel', 'data-open')) === 'true') return true;
  const g = await rectOf(app, '.wz-tutor-grip'); if (!g) return false;
  await click(app, g.x, g.y); await sleep(600);
  return (await attr(app, '.wz-tutor-panel', 'data-open')) === 'true';
};
const fullLineLengths = (lines) => lines.slice(0, -1).map((l, i) => lines[i + 1].start - l.start);
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
// R, held to ruling c's law: the scale k is MEASURED (width / 620), then the page must be what that law says a page at k is
const kOf = (g) => (g ? g.page.width / FRAME_PAGE_W : null);
const inStage = (g) => !!g && !!g.stage && g.page.top >= g.stage.top - 0.5 && g.page.bottom <= g.stage.bottom + 0.5 && g.page.left >= g.stage.left - 0.5 && g.page.right <= g.stage.right + 0.5;
const rPred = (g) => {
  if (!g || !g.stage) return false;
  const k = kOf(g);
  if (k < 1 - PAGE_W_TOL) return false;                                   // never below 1.0
  if (k <= 1 + PAGE_W_TOL) return inStage(g) && g.page.height <= FRAME_PAGE_W / LETTER + 1;  // k = 1: 620 wide, capped to the stage
  return Math.abs(g.page.width / g.page.height - LETTER) <= RATIO_TOL && inStage(g) && g.stage.height - g.page.height <= FIT_SLACK;
};
const cPred = (lines) => { const m = median(fullLineLengths(lines || [])); return m != null && m >= CPL_MIN && m <= CPL_MAX; };
// strengths of [writing line, 1 above, 3 above, 5 above]: a steady fade upward, the oldest at half or less
const tPred = (st) => st.length === 4 && st.every((x) => x.bare != null && x.bare >= 60 && x.s != null)
  && st[1].s - st[2].s >= FADE_STEP && st[2].s - st[3].s >= FADE_STEP && st[3].s <= FADED;
const sameStarts = (a, b) => !!a && !!b && a.length === b.length && a.every((l, i) => l.start === b[i].start);

const normalCase = async (app, th, w, h) => {
  await app.emulateDpr(1, w, h);
  const id = pid(th.id, 'draft');
  if (!(await openPage(app, id))) { ok(`${th.name} ${w}x${h} normal fixture: the Draft page opened`, false, ''); return null; }
  ok(`${th.name} ${w}x${h} normal (premise): the page is in the normal view (typewriter off)`, (await typewriterIs(app, id)) === 'off', await typewriterIs(app, id));
  const g = await app.evalJs('window.__psGeom()');
  const lines = await app.evalJs('window.__psLines()');
  const k = kOf(g);
  const kr = k == null ? null : Math.round(k * 1000) / 1000;
  ok(`${th.name} ${w}x${h} R: the page follows the stage (k = ${kr}): at k = 1, 620 wide and capped to the stage; above 1, letter-proportioned and the largest that fits (within ${FIT_SLACK}px)`, rPred(g),
    J({ k: kr, page: g && { w: Math.round(g.page.width), h: Math.round(g.page.height) }, ratio: g && Math.round((g.page.width / g.page.height) * 1000) / 1000, want: Math.round(LETTER * 1000) / 1000,
      stageH: g && g.stage && Math.round(g.stage.height), slack: g && g.stage && Math.round(g.stage.height - g.page.height), inStage: inStage(g) }));
  const lens = fullLineLengths(lines || []);
  ok(`${th.name} ${w}x${h} C: at the default, the median full line holds ${CPL_MIN}-${CPL_MAX} characters (~75)`, cPred(lines), J({ median: median(lens), lines: lens.length, sample: lens.slice(0, 8) }));
  ok(`${th.name} ${w}x${h} F: the editor's type is 12 pt in page units (${FONT_PX}px x k, within 1%)`, !!g && k != null && Math.abs(g.fontPx / (FONT_PX * k) - 1) <= 0.01, J({ fontPx: g && g.fontPx, want: k && Math.round(FONT_PX * k * 100) / 100 }));

  // K + N: open BOTH panels - the page neither moves nor rescales (the scale comes from the stage), and it sits fully between them
  const panels = async () => app.evalJs(`(() => { const r = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return b.width ? { left: b.left, right: b.right } : null; };
    return { sliver: r('.wz-sliver-panel'), tutor: r('.wz-tutor-panel'), sliverOpen: document.querySelector('.wz-sliver')?.getAttribute('data-open'), tutorOpen: document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') }; })()`);
  if ((await attr(app, '.wz-sliver', 'data-open')) !== 'true') { const gr = await rectOf(app, '.wz-sliver-grip'); if (gr) { await click(app, gr.x, gr.y); await sleep(600); } }
  await openTutor(app); await sleep(300);
  const pp = await panels(); const gk = await app.evalJs('window.__psGeom()');
  const sOpen = !!pp && pp.sliverOpen === 'true'; const tOpen = !!pp && pp.tutorOpen === 'true';
  const bothOpen = sOpen && tOpen && !!pp.sliver && !!pp.tutor;
  ok(`${th.name} ${w}x${h} K/N (premise): both drawers were asked open (Sliver, then Tutor) and at least the Tutor stands open`, tOpen, J(pp));
  const kPred = (a, b) => !!a && !!b && ['left', 'top', 'width', 'height'].every((q) => Math.abs(a.page[q] - b.page[q]) <= 0.5);
  // Fable, Oct 23 (the 1366 rule): the page never goes below 1.0 and never moves. If both drawers fit beside it, they open together
  // (narrowing to DRAWER_MIN, scrolling inside); if even their minimums do not fit, opening one closes the other (Nick's Oct 7 rule).
  // WHICH is owed is read from the geometry: the desk on each side of the page, with no drawer open.
  const leftRoom = g && g.stage ? g.page.left - g.stage.left : 0; const rightRoom = g && g.stage ? g.stage.right - g.page.right : 0;
  const roomForBoth = leftRoom >= DRAWER_MIN && rightRoom >= DRAWER_MIN;
  if (tOpen) {
    ok(`${th.name} ${w}x${h} K: opening the drawers never moves or rescales the page`, kPred(g, gk), J({ closed: g && g.page, open: gk && gk.page }));
    if (roomForBoth) {
      ok(`${th.name} ${w}x${h} N: there is room for both drawers at their minimum (${Math.round(leftRoom)} / ${Math.round(rightRoom)}px beside the page), so BOTH stand open, each ${DRAWER_MIN}px or wider, and the page sits fully between them`,
        bothOpen && !!gk && pp.sliver.right <= gk.page.left + 0.5 && pp.tutor.left >= gk.page.right - 0.5
          && pp.sliver.right - pp.sliver.left >= DRAWER_MIN - 0.5 && pp.tutor.right - pp.tutor.left >= DRAWER_MIN - 0.5,
        J({ sOpen, tOpen, sliver: pp.sliver, tutor: pp.tutor, pageLeft: gk && Math.round(gk.page.left), pageRight: gk && Math.round(gk.page.right) }));
    } else {
      ok(`${th.name} ${w}x${h} N: there is NO room for both drawers at their minimum (${Math.round(leftRoom)} / ${Math.round(rightRoom)}px beside the page), so opening the Tutor closed the Sliver, and the Tutor sits clear of the page`,
        !sOpen && !!pp.tutor && !!gk && pp.tutor.left >= gk.page.right - 0.5, J({ sOpen, tOpen, tutor: pp.tutor, pageRight: gk && Math.round(gk.page.right) }));
    }
    if (w === 1366) {
      // MK: the page rescaled by an open panel (a :has() rule keyed on the Tutor's open state) - K must fail
      await app.evalJs(`window.__psStyle('ps-mk', ':root:has(.wz-tutor-panel[data-open="true"]) .desk-frame-stage .mode-page { transform:scale(.9) !important; }')`); await sleep(300);
      const gmk = await app.evalJs('window.__psGeom()');
      await app.evalJs("window.__psStyle('ps-mk', null)"); await sleep(200);
      ok(`${th.name} MK (mutant): with the page rescaled while the Tutor is open (LANDED: ${gk && Math.round(gk.page.width)} -> ${gmk && Math.round(gmk.page.width)}), K fails`,
        !!gmk && !!gk && Math.abs(gmk.page.width - gk.page.width) >= 20 && !kPred(g, gmk), J(gmk && gmk.page));
    }
  }
  // close both again (the zoom case opens what it needs itself)
  if ((await attr(app, '.wz-tutor-panel', 'data-open')) === 'true') { const gr = await rectOf(app, '.wz-tutor-grip'); if (gr) { await click(app, gr.x, gr.y); await sleep(500); } }
  if ((await attr(app, '.wz-sliver', 'data-open')) === 'true') { const gr = await rectOf(app, '.wz-sliver-grip'); if (gr) { await click(app, gr.x, gr.y); await sleep(500); } }
  if (w === 1366) {
    // MR: the page forced to today's 760px - R must fail
    await app.evalJs(`window.__psStyle('ps-mr', '.desk-frame-stage .mode-pagecol, .desk-frame-stage .mode-page { width:760px !important; max-width:none !important; }')`); await sleep(300);
    const gm = await app.evalJs('window.__psGeom()');
    await app.evalJs("window.__psStyle('ps-mr', null)"); await sleep(200);
    ok(`${th.name} MR (mutant): with the page forced 760 wide (LANDED: ${g && Math.round(g.page.width)} -> ${gm && Math.round(gm.page.width)}), R fails`,
      !!g && !!gm && Math.abs(gm.page.width - g.page.width) >= 50 && !rPred(gm), J(gm && gm.page));
    // MC: the type at 14px - C must fail
    await app.evalJs(`window.__psStyle('ps-mc', '.forward-only-editor { font-size:14px !important; }')`); await sleep(300);
    const gc = await app.evalJs('window.__psGeom()'); const lc = await app.evalJs('window.__psLines()');
    await app.evalJs("window.__psStyle('ps-mc', null)"); await sleep(200);
    ok(`${th.name} MC (mutant): with the type at 14px (LANDED: ${gc && gc.fontPx}px), C fails`, !!gc && gc.fontPx === 14 && !cPred(lc), J({ median: median(fullLineLengths(lc || [])) }));
  }
  return { g, lines };
};

const zoomCase = async (app, th, w, h, { kind = 'draft', glide = false, mutants = false } = {}) => {
  await app.emulateDpr(1, w, h);
  const id = pid(th.id, kind);
  const tag = `${th.name} ${kind === 'fw' ? 'Free Write ' : ''}${w}x${h}`;
  if (!(await openPage(app, id))) { ok(`${tag} zoom fixture: the page opened`, false, ''); return; }
  // start in the normal view: if the writer's control reads ON, press it off first (a premise, not the subject)
  if ((await attr(app, TOGGLE, 'aria-pressed')) === 'true' || (kind === 'draft' && (await typewriterIs(app, id)) === 'on')) await pressTypewriter(app);
  const tutorOpen = await openTutor(app);
  const g0 = await app.evalJs('window.__psGeom()');
  const l0 = await app.evalJs('window.__psLines()');
  await app.evalJs('window.__psMark()');
  const pressedOn = await pressTypewriter(app);
  const on = kind === 'draft' ? (await typewriterIs(app, id)) === 'on' : pressedOn === 'true' || (await app.evalJs("!!document.querySelector('.mode-scroll[data-typewriter=\"true\"]') || null"));
  ok(`${tag} zoom (premise): the writer's typewriter control turned the zoom ON`, !!on, J({ pressedOn, key: await typewriterIs(app, id) }));
  if (!on) return;
  const g1 = await app.evalJs('window.__psGeom()');
  const l1 = await app.evalJs('window.__psLines()');
  const scale = g0 && g1 ? Math.round((g1.page.width / g0.page.width) * 1000) / 1000 : null;
  // ~1.6x from the base scale, capped to the largest that fits the stage's width with the panels tucked; never overflowing the stage
  const fitsW = !!g1 && !!g1.stage && g1.page.left >= g1.stage.left - 0.5 && g1.page.right <= g1.stage.right + 0.5;
  const zPred = scale != null && fitsW && (Math.abs(scale - ZOOM) <= ZOOM_TOL || (scale < ZOOM && g1.stage.width - g1.page.width <= ZOOM_FIT_SLACK));
  ok(`${tag} Z: the page paints ~${ZOOM}x its normal width (within ${ZOOM_TOL}), or the largest that fits the stage's width, and never overflows the stage`, zPred,
    J({ normal: g0 && Math.round(g0.page.width), zoom: g1 && Math.round(g1.page.width), scale, stageW: g1 && g1.stage && Math.round(g1.stage.width), fitsW }));
  ok(`${tag} B: the line breaks are IDENTICAL in both views - scale, never reflow`, sameStarts(l0, l1),
    J({ normal: (l0 || []).length, zoom: (l1 || []).length, firstDiff: (l0 || []).findIndex((l, i) => !l1 || !l1[i] || l1[i].start !== l.start) }));
  if (kind === 'fw') { await pressTypewriter(app); return; }
  ok(`${tag} U: the editor is the SAME node in the zoom (no unmount)`, await app.evalJs('window.__psMarked()'));
  const sliverOpen = await attr(app, '.wz-sliver', 'data-open'); const tutorNow = await attr(app, '.wz-tutor-panel', 'data-open');
  ok(`${tag} P (premise): the Tutor was OPEN before the zoom`, tutorOpen, '');
  ok(`${tag} P: panels tucked - the Sliver and the Tutor are closed in the zoom`, tutorOpen && sliverOpen !== 'true' && tutorNow !== 'true', J({ sliverOpen, tutorNow }));

  // the writing line: caret to the end, one trusted letter so the typewriter engages, then let any glide settle
  await app.evalJs('window.__psCaretToEnd()'); await app.typeKeys('x'); await sleep(1200);
  const lines = await app.evalJs('window.__psLines()'); const caret = await app.evalJs('window.__psCaret()'); const g2 = await app.evalJs('window.__psGeom()');
  const wi = lines && caret ? lines.findIndex((l) => caret.mid >= l.top && caret.mid <= l.bottom) : -1;
  // the part of the paper a writer can SEE: inside the page, the stage, the scroller's clip and the viewport
  const visTop = g2 ? Math.max(g2.page.top, g2.stage ? g2.stage.top : 0, g2.scroll ? g2.scroll.top : 0, 0) : 0;
  const visBottom = g2 ? Math.min(g2.page.bottom, g2.stage ? g2.stage.bottom : g2.vh, g2.scroll ? g2.scroll.bottom : g2.vh, g2.vh) : 0;
  const seen = (l) => !!l && l.top >= visTop + 1 && l.bottom <= visBottom;
  // Cursor's FINAL mask (e3c4e462, 07:49): only the writing line is at full strength; older lines fade steadily as they rise (~.88, .75,
  // .59, .43, .31 for 1-5 lines above) and the paper fades into the desk with them. So T reads lines 1, 3 and 5 above the writing line.
  const premise = wi >= 5 && [0, 1, 3, 5].every((k) => seen(lines[wi - k]));
  ok(`${tag} W/T (premise): the writing line is found at the caret, and it and the lines 1, 3 and 5 above it are on screen`, premise, J({ wi, lines: lines && lines.length, caret, visTop, visBottom }));
  if (premise) {
    const want = [lines[wi], lines[wi - 1], lines[wi - 3], lines[wi - 5]];
    const st = await strengths(app, want);
    const bareOk = st.every((x) => x.bare != null && x.bare >= 60);
    ok(`${tag} W/T (premise): the unfaded reference shows ink on all four lines`, bareOk, J(st));
    ok(`${tag} W: the writing line paints at full strength (>= ${FULL})`, bareOk && st[0].s >= FULL, J(st[0]));
    ok(`${tag} T: the top fade is present - older lines fade as they rise (1 above > 3 above > 5 above, each by ${FADE_STEP}+), 5 above at ${FADED} or less`,
      tPred(st), J({ above1: st[1], above3: st[2], above5: st[3] }));
    if (mutants) {
      // MW: the editor at opacity .5 (applied BEFORE the strip, so the unfaded reference still removes it) - W must fail
      await app.evalJs(`window.__psStyle('ps-mw', '.forward-only-editor { opacity:.5 !important; }')`);
      const landedW = await app.evalJs("getComputedStyle(document.querySelector('.forward-only-editor')).opacity");
      const sw = await strengths(app, [lines[wi]]);
      await app.evalJs("window.__psStyle('ps-mw', null)");
      ok(`${tag} MW (mutant): with the editor at opacity .5 (LANDED: ${landedW}), W fails`, landedW === '0.5' && !(sw[0].s >= FULL), J(sw[0]));
      // MT: every mask in the stage removed - T must fail
      const before = await app.evalJs('window.__psMasks()');
      await app.evalJs(`window.__psStyle('ps-strip-mut', ${J(STRIP_CSS)})`); const after = await app.evalJs('window.__psMasks()'); await app.evalJs("window.__psStyle('ps-strip-mut', null)");
      const stt = await strengths(app, want, { keepStrip: true });
      ok(`${tag} MT (mutant): with every mask in the stage removed (LANDED: ${before} masked element(s) -> ${after}), T fails`,
        before >= 1 && after === 0 && !tPred(stt), J({ before, after, stt }));
      // MB: letter-spacing changed while zoomed - B must fail
      await app.evalJs(`window.__psStyle('ps-mb', '.forward-only-editor { letter-spacing:.03em !important; }')`); await sleep(300);
      const landedB = await app.evalJs("getComputedStyle(document.querySelector('.forward-only-editor')).letterSpacing");
      const lb = await app.evalJs('window.__psLines()');
      await app.evalJs("window.__psStyle('ps-mb', null)"); await sleep(200);
      const l0x = l0; // the normal-view starts, measured before the zoom
      ok(`${tag} MB (mutant): with the letter-spacing changed in the zoom (LANDED: ${landedB}), B fails`, landedB !== 'normal' && !sameStarts(l0x, lb), J({ normal: (l0x || []).length, mutated: (lb || []).length }));
    }
  }
  if (glide) {
    // G: a new line - the scroll moves over several frames (a glide), by about one line
    const sample = `(() => new Promise((res) => { const sc = document.querySelector('.forward-only-editor')?.closest('.mode-scroll'); if (!sc) return res(null);
      const v = [sc.scrollTop]; const t0 = performance.now(); const f = () => { v.push(sc.scrollTop); if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(v); }; requestAnimationFrame(f); }))()`;
    const p = app.evalJs(sample);
    await sleep(30); await app.key('Enter'); await app.typeKeys('y');
    const v = await p; const distinct = v ? [...new Set(v)] : [];
    const lh = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.forward-only-editor')).lineHeight) || null");
    const moved = v ? v[v.length - 1] - v[0] : null;
    // a glide passes through many in-between values; an instant move (even one taken in two or three whole-line steps) does not
    ok(`${tag} G: a new line glides - the scroll passes through ${GLIDE_MIN} or more values`, !!v && moved > 0 && distinct.length >= GLIDE_MIN, J({ moved, values: distinct.length, lh }));
  }
  // leave the zoom through the same control
  await pressTypewriter(app);
  const g3 = await app.evalJs('window.__psGeom()');
  ok(`${tag} zoom (premise): the writer's control turned the zoom OFF again`, (await typewriterIs(app, id)) === 'off', await typewriterIs(app, id));
  ok(`${tag} U: the editor is still the SAME node after leaving the zoom`, await app.evalJs('window.__psMarked()'));
  const same = g0 && g3 && ['left', 'top', 'width', 'height'].every((k) => Math.abs(g0.page[k] - g3.page[k]) <= 0.5);
  ok(`${tag} X: leaving the zoom returns the exact normal rect`, same, J({ before: g0 && g0.page, after: g3 && g3.page }));
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  const now = new Date().toISOString();
  for (const th of THEMES) {
    for (const [kind, mode] of [['draft', 'drafting'], ['fw', 'journal']]) {
      const id = pid(th.id, kind);
      await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PARA, createdAt: now, origin: null, source: 'page' })})`);
      await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', '${mode}')`);
      await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${id}', 'off')`);
    }
  }
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(400);
  ok('fixture: four pages seeded through the seams (two themes x Draft and Free Write), one ~2600-character paragraph each', true, J({ chars: PARA.length }));

  for (const th of THEMES) {
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}')`);
    await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    const applied = await app.evalJs("document.documentElement.getAttribute('data-theme')");
    ok(`${th.name} (premise): the theme is applied (data-theme=${applied})`, applied === th.id, applied);

    const startsAt = {};
    for (const [w, h] of SIZES) { const r = await normalCase(app, th, w, h); startsAt[w] = r && r.lines; }
    // L: a bigger screen grows the page (ruling c) in SHAPE only - every size breaks its lines where 1366x768 does
    const base = startsAt[1366];
    for (const [w, h] of SIZES.slice(1)) {
      const at = startsAt[w];
      ok(`${th.name} ${w}x${h} L: the page breaks its lines exactly where it does at 1366x768 (it grows, it never reflows)`, sameStarts(base, at),
        J({ at1366: (base || []).length, here: (at || []).length, firstDiff: (base || []).findIndex((l, i) => !at || !at[i] || at[i].start !== l.start) }));
    }

    for (const [w, h] of SIZES) await zoomCase(app, th, w, h, { glide: w === 1366, mutants: w === 1366 });
    if (th.id === 'plateau') await zoomCase(app, th, 1366, 768, { kind: 'fw' });
  }

  // G under reduced motion (Arbor, 1366x768): the same new line moves the scroll in ONE step
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs("localStorage.setItem('wrizo-theme', 'plateau')"); await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await app.emulateDpr(1, 1366, 768);
  const rid = pid('plateau', 'draft');
  await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${rid}', 'on')`);
  if (await openPage(app, rid)) {
    const rm = await app.evalJs("matchMedia('(prefers-reduced-motion: reduce)').matches");
    await app.evalJs('window.__psCaretToEnd()'); await app.typeKeys('x'); await sleep(1200);
    const sample = `(() => new Promise((res) => { const sc = document.querySelector('.forward-only-editor')?.closest('.mode-scroll'); if (!sc) return res(null);
      const v = [sc.scrollTop]; const t0 = performance.now(); const f = () => { v.push(sc.scrollTop); if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(v); }; requestAnimationFrame(f); }))()`;
    const p = app.evalJs(sample);
    await sleep(30); await app.key('Enter'); await app.typeKeys('y');
    const v = await p; const distinct = v ? [...new Set(v)] : [];
    const moved = v ? v[v.length - 1] - v[0] : null;
    ok(`Arbor 1366x768 G (reduced motion): a new line moves the scroll with no glide - ${INSTANT_MAX} values at most (the start and whole-line steps)`,
      rm && !!v && moved > 0 && distinct.length <= INSTANT_MAX, J({ rm, moved, values: distinct.length }));
  } else ok('Arbor 1366x768 G (reduced motion) fixture: the Draft page opened', false, '');
  await app.emulateMedia([]);
  await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${rid}', 'off')`);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 500)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPAGE-SIZE VERIFY: PASS (${checks.length} checks)` : `\nPAGE-SIZE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
