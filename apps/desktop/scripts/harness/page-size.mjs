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
//   W0 a FRESH zoomed page: its first writing line at full strength (the start offset puts it at the anchor)
//   G  (1366) glide: a new line moves the scroll over several frames; under reduced motion it moves in one
//   FW Free Write (Arbor, 1366x768): Z and B
//   STRENGTH is read from the SCREENSHOT (decoded in the page through a canvas - no new dependency), so it is what is PAINTED, masks and
//   all: a line's ink = the largest colour distance from its own commonest colour (the paper); its strength = ink as painted / ink with
//   every mask and opacity in the stage stripped. The stripped reference is a premise: it must itself show ink.
//   S  (lane 3) the zoomed page never slides under the strip (+ MS)
//   C  PARKED (Fable's C ruling, Oct 24): the measure is the face's; successor records it, I holds the column
//   I  (Nick, Oct 24) the skin changes ONLY the skin: every skin (light + dark) has the same page box, margins, type size and zoom band/anchor (±1px)
//   V  (Fable, Oct 23) the vignette sits BEHIND the page in every theme and page tone: the paper's foot and lower corners paint the same with it hidden
//   V-room  and it is behind, not GONE: a corner of the room still changes when it is hidden
//   MUTANTS (runtime, each asserts it LANDED before its predicate is read): MV the vignette forced back on top (V fails); MR page forced 760 wide; MC type at 12px; MB letter-spacing
//   changed while zoomed; MW the editor at opacity .5; MT every mask in the stage removed; MK the page scaled by an open panel (K fails).
//
// Seeding goes through the app's seams; the per-page mode and typewriter keys are this device's own UI keys (not collections).
// Needs a box turn.  Run: WS_BOX_TURN=<token> node scripts/harness/page-size.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const SHOTS = process.env.WS_PS_SHOTS || null;
const snap = async (app, name) => { if (!SHOTS) return; mkdirSync(SHOTS, { recursive: true }); writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };

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
const ZOOM_FIT_SLACK = 100; // a zoom capped below 1.6 fills the stage's width to within this (the product keeps a 96px gutter, store/pageScale.ts ZOOM_GUTTER; + sub-pixel)
// a drawer's narrowest open width (Fable, Oct 23 - drawers narrow to a minimum, scrolling inside). 200 is today's Tools drawer open
// width (menusDrawers.ts CLOSED_TOOLS_W); the build names ONE token for it and this number must equal that token.
const DRAWER_MIN = 200;
const DRAWER_RESERVE = 320;   // = store/pageScale.ts DRAWER_RESERVE: the desk each side keeps for its drawer when the page is width-bound
const natural = {};          // each drawer's natural open width, measured alone at 1366
const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }, { id: 'machina', name: 'Machina' }];   // every REGISTERED theme (store/theme.ts) - Machina joined with train #6

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
      fontPx: parseFloat(getComputedStyle(e).fontSize), layoutW: page.offsetWidth, vh: innerHeight };
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
  window.__psKeep = () => { window.__psPxA = window.__psPx; return !!window.__psPxA; };
  // the mean and largest per-channel difference between the KEPT screenshot and the last one, over a rect
  window.__psDiff = (x0, y0, x1, y1) => {
    const A = window.__psPxA; const P = window.__psPx; if (!A || !P || A.width !== P.width || A.height !== P.height) return null;
    const W = P.width; const H = P.height;
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
    if (x1 <= x0 || y1 <= y0) return null;
    let sum = 0; let max = 0; let n = 0;
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) { const i = (y * W + x) * 4; for (let c = 0; c < 3; c += 1) { const d = Math.abs(A.data[i + c] - P.data[i + c]); sum += d; if (d > max) max = d; n += 1; } }
    return { mean: Math.round((sum / n) * 100) / 100, max };
  };
  window.__psMasks = () => { const root = document.querySelector('.desk-frame-stage') || document.querySelector('.mode-stage'); if (!root) return -1;
    return [root, ...root.querySelectorAll('*')].filter((el) => { const cs = getComputedStyle(el); const m = cs.maskImage || cs.webkitMaskImage; return m && m !== 'none'; }).length; };
  return true;
})()`;
const install = (app) => app.evalJs(HELPERS);
// I - the geometry a skin must not change: the page box (painted), its padding and type (layout px), its transform; zoomed, the band's anchor, its
// line unit and the column's mask as computed
const IDENT_PROBE = `(() => { const p = document.querySelector('.mode-page'); const e = document.querySelector('.forward-only-editor'); const col = document.querySelector('.mode-pagecol');
  if (!p || !e || !col) return null; const r = p.getBoundingClientRect(); const ps = getComputedStyle(p); const cs = getComputedStyle(col);
  const R = (n) => Math.round(n * 10) / 10;
  return { page: { left: R(r.left), top: R(r.top), width: R(r.width), height: R(r.height) }, padT: parseFloat(ps.paddingTop), padR: parseFloat(ps.paddingRight), padB: parseFloat(ps.paddingBottom), padL: parseFloat(ps.paddingLeft),
    fontPx: parseFloat(getComputedStyle(e).fontSize), colW: e.offsetWidth, transform: ps.transform, zoom: col.getAttribute('data-zoom'), anchor: cs.getPropertyValue('--tw-anchor').trim(),
    lh: parseFloat(cs.getPropertyValue('--tw-lh')) || null, mask: String(cs.webkitMaskImage || cs.maskImage || 'none') }; })()`;
const ident = {};
const psParks = { C: [] };   // the park audit (Oct 24): the default leg's observations, for the parked records
const IDENT_TOL = 1;   // Nick's law, ±1px

// strip every MASK the stage can paint, so a line's UNFADED ink can be read (layout is untouched: a mask never moves a line). MASKS ONLY - the red run (143)
// showed why: the first cut also forced opacity:1 on everything inside the page, which UNHID an overlay and made the "unfaded" reference read LESS ink than
// the page itself (strength 1.73 / 1.58 at 2560 and 3840) - so W passed blind. The fade this ticket builds is a mask; every strength now also carries the
// premise that the reference never reads less ink than the painted page (REF_FLOOR), so an instrument that adds something cannot pass again.
const STRIP_CSS = `.desk-frame-stage, .desk-frame-stage *, .mode-stage, .mode-stage * { -webkit-mask-image:none !important; mask-image:none !important; }`;
const REF_FLOOR = 0.97;   // bare >= painted x this, on every line measured

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
  // G diagnostics: the typewriter engine reads this ONCE at mount and records its decisions in memory (useTypewriterFade.ts; gated - see GATE below)
  await app.evalJs('(() => { window.__wzTwTrace = window.__wzTwTrace || []; return true; })()');
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", { label: id, timeout: 10000 });
  await sleep(900);
  await install(app);
  return there;
};
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${J(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; })()`);
const attr = (app, sel, a) => app.evalJs(`document.querySelector(${J(sel)})?.getAttribute(${J(a)}) ?? null`);
const TOGGLE = '[data-mode-toggle="typewriter"]';
// the writer's own control: open the Sliver if it is closed, then press its typewriter button (trusted). Returns { pressed, at }.
// The red run (143) showed the first cut pressed BLIND: at 768 and 1080 tall the button sits in the Sliver's scrolling foot, below the panel's visible part,
// and after typing the OFF press missed too - the click landed on whatever was there and nothing said so. Now the drawer must SETTLE (its sliding layer at
// rest), the button is brought into view inside the panel, and the click point must HIT the button (elementFromPoint) - or the press is refused and the
// premise check that reads it fails with what was hit.
const settledSliver = "(() => { const l = document.querySelector('.wz-sliver-panel > .wz-drawer-slide'); if (!l) return true; const cs = getComputedStyle(l); return cs.transform === 'none' && cs.pointerEvents !== 'none'; })()";
const pressTypewriter = async (app) => {
  if ((await attr(app, '.wz-sliver', 'data-open')) !== 'true') { const g = await rectOf(app, '.wz-sliver-grip'); if (g) { await click(app, g.x, g.y); await sleep(300); } }
  await waitSoft(app, `document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true' && ${settledSliver}`, { label: 'the Sliver settled open', timeout: 3000 });
  // (lane run on 64e5b7f9: at 2560/3840 the press hit the Sliver's own container - right after typing the chrome is DISSOLVED, pointer-events off,
  // until the pointer moves; a writer's hand moving to the button restores it. So the pointer goes there, and the hit is waited for, up to 2.5s.)
  const probe = () => app.evalJs(`(() => { const b = document.querySelector(${J(TOGGLE)}); if (!b) return null; b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = b.getBoundingClientRect(); const x = r.left + r.width / 2; const y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y);
    return { x: Math.round(x), y: Math.round(y), hits: !!hit && (hit === b || b.contains(hit)), hit: hit ? String(hit.className || hit.tagName).slice(0, 60) : null, before: b.getAttribute('aria-pressed'),
    btn: { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) },
    panel: (() => { const p = document.querySelector('.wz-sliver-panel'); if (!p) return null; const q = p.getBoundingClientRect(); const cs = getComputedStyle(p); return { l: Math.round(q.left), t: Math.round(q.top), r: Math.round(q.right), b: Math.round(q.bottom), pe: cs.pointerEvents, op: cs.opacity, ov: cs.overflowY, sh: p.scrollHeight, ch: p.clientHeight }; })(),
    writing: document.querySelector('.desk-frame')?.getAttribute('data-writing') ?? null }; })()`);
  let at = await probe();
  for (let i = 0; at && !at.hits && i < 16; i += 1) { await app.mouseMove(at.x, at.y); await sleep(150); at = await probe(); }
  if (!at || !at.hits) { await snap(app, `press-miss-${Date.now()}`); return { pressed: null, at }; }
  await click(app, at.x, at.y); await sleep(1100);
  return { pressed: await attr(app, TOGGLE, 'aria-pressed'), at };
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
  // largest that fits: either the stage's HEIGHT binds (the page's height within FIT_SLACK of the stage's) or its WIDTH does (each side's desk within
  // FIT_SLACK/2 of the drawers' constant reserve, DRAWER_MIN + the grip) - at 3840 the page is width-bound, keeping both drawers beside it
  const sideDesk = (g.stage.width - g.page.width) / 2;
  const heightBound = g.stage.height - g.page.height <= FIT_SLACK;
  const widthBound = sideDesk >= DRAWER_RESERVE - 1 && sideDesk - DRAWER_RESERVE <= FIT_SLACK / 2;
  return Math.abs(g.page.width / g.page.height - LETTER) <= RATIO_TOL && inStage(g) && (heightBound || widthBound);
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
  await snap(app, `${th.id}-${w}x${h}-normal`);
  const g = await app.evalJs('window.__psGeom()');
  const lines = await app.evalJs('window.__psLines()');
  const k = kOf(g);
  const kr = k == null ? null : Math.round(k * 1000) / 1000;
  ok(`${th.name} ${w}x${h} R: the page follows the stage (k = ${kr}): at k = 1, 620 wide and capped to the stage; above 1, letter-proportioned and the largest that fits (within ${FIT_SLACK}px)`, rPred(g),
    J({ k: kr, page: g && { w: Math.round(g.page.width), h: Math.round(g.page.height) }, ratio: g && Math.round((g.page.width / g.page.height) * 1000) / 1000, want: Math.round(LETTER * 1000) / 1000,
      stageH: g && g.stage && Math.round(g.stage.height), slack: g && g.stage && Math.round(g.stage.height - g.page.height), inStage: inStage(g) }));
  const lens = fullLineLengths(lines || []);
  // ---- PARKED - SUPERSEDED by Fable's C ruling (Nick, Oct 24): characters per line belong to the FACE, not the page. Machina's face set 61 on the same
  // column where Arbor and Flux set ~75 (lane 3, d80010ae); the page's claim is the COLUMN, and I (below) holds the text column's width identical across
  // skins. Machina at 61 is accepted for #7 (its default face moves to Source Sans 3, ~72, in the fonts ticket). Kept VERBATIM and no longer run;
  // successor follows; one record per skin and size in the parked section.
  //
  // ok(`${th.name} ${w}x${h} C: at the default, the median full line holds ${CPL_MIN}-${CPL_MAX} characters (~75)`, cPred(lines), J({ median: median(lens), lines: lens.length, sample: lens.slice(0, 8) }));
  // ------------------------------------------------------------------
  psParks.C.push({ skin: th.name, w, h, median: median(lens), lines: lens.length });
  ok(`${th.name} ${w}x${h} C (successor): this FACE's measure is recorded on the shared column - median ${median(lens)} characters a full line (the column itself is held identical across skins by I)`,
    lens.length >= 10 && median(lens) > 0, J({ median: median(lens), lines: lens.length, sample: lens.slice(0, 8) }));
  // (the page lays out at scale 1 and is PAINTED at k - the as-built design - so the computed type is 16px and the painted type is 16 x k)
  const painted = g && g.layoutW > 0 ? g.fontPx * (g.page.width / g.layoutW) : null;
  ok(`${th.name} ${w}x${h} F: the editor's type is 12 pt in page units - laid out at ${FONT_PX}px and painted at ${FONT_PX}px x k (within 1%)`,
    !!g && k != null && Math.abs(g.fontPx - FONT_PX) < 0.25 && painted != null && Math.abs(painted / (FONT_PX * k) - 1) <= 0.01,
    J({ fontPx: g && g.fontPx, painted: painted && Math.round(painted * 100) / 100, want: k && Math.round(FONT_PX * k * 100) / 100 }));

  // K + N: open BOTH panels - the page neither moves nor rescales (the scale comes from the stage), and it sits fully between them
  const panels = async () => app.evalJs(`(() => { const r = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return b.width ? { left: b.left, right: b.right } : null; };
    return { sliver: r('.wz-sliver-panel'), tutor: r('.wz-tutor-panel'), sliverOpen: document.querySelector('.wz-sliver')?.getAttribute('data-open'), tutorOpen: document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') }; })()`);
  if ((await attr(app, '.wz-sliver', 'data-open')) !== 'true') { const gr = await rectOf(app, '.wz-sliver-grip'); if (gr) { await click(app, gr.x, gr.y); await sleep(600); } }
  // each drawer's width ALONE - a drawer narrows to DRAWER_MIN beside the other, never below it, and never wider than it stands alone (the Sliver's own
  // open width is 184px, under DRAWER_MIN: it is never asked to narrow at all) - red run 143's numbers
  const wOf = (b) => (b ? b.right - b.left : null);
  const sliverAlone = wOf((await panels()).sliver);
  if (w === 1366 && sliverAlone) natural.sliver = sliverAlone;
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
      // the Tutor's width alone: shut the Sliver (the Tutor stands), read it, then the Sliver is reopened for nothing - the close-down below shuts both
      let tutorAlone = null;
      if (bothOpen) { const gr = await rectOf(app, '.wz-sliver-grip'); if (gr) { await click(app, gr.x, gr.y); await sleep(600); } tutorAlone = wOf((await panels()).tutor); }
      if (w === 1366 && tutorAlone) natural.tutor = tutorAlone;
      // (the alone-width at THIS size could itself be squeezed - 144px at 3840 on 64e5b7f9 - so the floor is the 1366 natural width)
      const floor = (nat) => Math.min(DRAWER_MIN, nat ?? DRAWER_MIN) - 0.5;
      ok(`${th.name} ${w}x${h} N: there is room for both drawers at their minimum (${Math.round(leftRoom)} / ${Math.round(rightRoom)}px beside the page), so BOTH stand open, each no narrower than ${DRAWER_MIN}px (or its natural width at 1366, if less), and the page sits fully between them`,
        bothOpen && !!gk && pp.sliver.right <= gk.page.left + 0.5 && pp.tutor.left >= gk.page.right - 0.5
          && wOf(pp.sliver) >= floor(natural.sliver) && wOf(pp.tutor) >= floor(natural.tutor),
        J({ sOpen, tOpen, sliver: pp.sliver, tutor: pp.tutor, sliverAlone, tutorAlone, natural, pageLeft: gk && Math.round(gk.page.left), pageRight: gk && Math.round(gk.page.right) }));
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
    // MC: the type at 12px - C must fail (14px was too near: on main's Flux page it still landed 73 a line - red run 143)
    await app.evalJs(`window.__psStyle('ps-mc', '.forward-only-editor { font-size:12px !important; }')`); await sleep(300);
    const gc = await app.evalJs('window.__psGeom()'); const lc = await app.evalJs('window.__psLines()');
    await app.evalJs("window.__psStyle('ps-mc', null)"); await sleep(200);
    ok(`${th.name} MC (mutant): with the type at 12px (LANDED: ${gc && gc.fontPx}px), C fails`, !!gc && gc.fontPx === 12 && !cPred(lc), J({ median: median(fullLineLengths(lc || [])) }));
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
  const on = kind === 'draft' ? (await typewriterIs(app, id)) === 'on' : pressedOn.pressed === 'true' || (await app.evalJs("!!document.querySelector('.mode-scroll[data-typewriter=\"true\"]') || null"));
  ok(`${tag} zoom (premise): the writer's typewriter control turned the zoom ON (the press HIT the button)`, !!on && !!pressedOn.at && pressedOn.at.hits, J({ pressedOn, key: await typewriterIs(app, id) }));
  if (!on) return;
  await sleep(400); await snap(app, `${th.id}-${w}x${h}-${kind}-zoom-entered`);
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
  await snap(app, `${th.id}-${w}x${h}-${kind}-zoom-writing`);
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
    const bareOk = st.every((x) => x.bare != null && x.bare >= 60 && x.painted != null && x.bare >= x.painted * REF_FLOOR);
    ok(`${tag} W/T (premise): the unfaded reference shows ink on all four lines, and never LESS than the painted page (the instrument only removes masks)`, bareOk, J(st));
    ok(`${tag} W: the writing line paints at full strength (>= ${FULL})`, bareOk && st[0].s >= FULL, J(st[0]));
    ok(`${tag} T: the top fade is present - older lines fade as they rise (1 above > 3 above > 5 above, each by ${FADE_STEP}+), 5 above at ${FADED} or less`,
      tPred(st), J({ above1: st[1], above3: st[2], above5: st[3] }));
    if (mutants) {
      // MW: the editor at opacity .5 (applied BEFORE the strip, so the unfaded reference still removes it) - W must fail
      await app.evalJs(`window.__psStyle('ps-mw', ".mode-pagecol[data-zoom='true'] { --tw-anchor: 25% !important; }")`);
      const landedW = await app.evalJs("(() => { const cs = getComputedStyle(document.querySelector('.mode-pagecol')); return cs.getPropertyValue('--tw-anchor').trim(); })()");
      const sw = await strengths(app, [lines[wi]]);
      await app.evalJs("window.__psStyle('ps-mw', null)");
      ok(`${tag} MW (mutant): with the band's anchor moved up to 25% while the line is held at 60% (LANDED: --tw-anchor ${landedW}), W fails`, landedW === '25%' && !(sw[0].s >= FULL), J(sw[0]));
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
    // (G was intermittent at 1366 - moved 0 on Flux 7ff7b8ea and Arbor d02409f0. The detail now says whether the keys LANDED, where focus was, and
    // where the caret sits against the 60% anchor before and after - so a red names its cause.)
    const gProbe = `(() => { const ed = document.querySelector('.forward-only-editor'); const col = document.querySelector('.mode-pagecol'); const c = window.__psCaret(); const sc = document.querySelector('.mode-scroll');
      const cr = col ? col.getBoundingClientRect() : null; return { len: ed ? ed.textContent.length : null, focus: !!ed && ed.contains(document.activeElement),
        caretTop: c ? Math.round(c.top) : null, anchorY: cr ? Math.round(cr.top + cr.height * 0.6) : null, scrollTop: Math.round(sc?.scrollTop ?? -1), maxTop: sc ? Math.round(sc.scrollHeight - sc.clientHeight) : null, traceLen: (window.__wzTwTrace || []).length }; })()`;
    const g0 = await app.evalJs(gProbe);
    const p = app.evalJs(sample);
    await sleep(30); await app.key('Enter'); await app.typeKeys('y');
    const v = await p; const distinct = v ? [...new Set(v)] : [];
    const gEnd = await app.evalJs(gProbe);
    await sleep(1500);
    const gLate = await app.evalJs(gProbe);   // late versus never: did the scroll move AFTER the 1s sample?
    const gTrace = await app.evalJs(`(window.__wzTwTrace || []).slice(${(g0 && g0.traceLen) || 0})`);
    const lh = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.forward-only-editor')).lineHeight) || null");
    const moved = v ? v[v.length - 1] - v[0] : null;
    // a glide passes through many in-between values; an instant move (even one taken in two or three whole-line steps) does not
    ok(`${tag} G: a new line glides - the scroll passes through ${GLIDE_MIN} or more values`, !!v && moved > 0 && distinct.length >= GLIDE_MIN, J({ moved, values: distinct.length, lh, before: g0, after: gEnd, late: gLate, trace: (gTrace || []).slice(-12) }));
  }
  // leave the zoom through the same control
  const pressedOff = await pressTypewriter(app);
  const g3 = await app.evalJs('window.__psGeom()');
  ok(`${tag} zoom (premise): the writer's control turned the zoom OFF again (the press HIT the button)`, (await typewriterIs(app, id)) === 'off' && !!pressedOff.at && pressedOff.at.hits,
    J({ pressedOff, key: await typewriterIs(app, id) }));
  ok(`${tag} U: the editor is still the SAME node after leaving the zoom`, await app.evalJs('window.__psMarked()'));
  const same = g0 && g3 && ['left', 'top', 'width', 'height'].every((k) => Math.abs(g0.page[k] - g3.page[k]) <= 0.5);
  ok(`${tag} X: leaving the zoom returns the exact normal rect`, same, J({ before: g0 && g0.page, after: g3 && g3.page }));
};

// GATE (Fable, Oct 24): the engine's G diagnostics live in MEMORY only and are written ONLY when the harness flag is on. Read from the source:
//   the flag is read exactly once (one `__wzTwTrace`, assigned to `const trace`); every write is `if (trace) trace.push(`; nothing on a trace line
//   touches the DOM (no dataset, no setAttribute, no style).
{
  const here = dirname(fileURLToPath(import.meta.url));
  const tw = readFileSync(join(here, '..', '..', 'src', 'components', 'useTypewriterFade.ts'), 'utf8');
  const reads = tw.split(/\r?\n/).filter((l) => l.includes('__wzTwTrace')).length;   // LINES that touch the flag (the one assignment names it twice)
  const assigned = /const trace = \(typeof window !== 'undefined' \? \(window as unknown as \{ __wzTwTrace\?: unknown\[\] \}\)\.__wzTwTrace : undefined\);/.test(tw);
  const pushes = (tw.match(/trace\.push\(/g) || []).length;
  const gated = (tw.match(/if \(trace\) trace\.push\(/g) || []).length;
  const domOnTrace = tw.split(/\r?\n/).filter((l) => /\btrace\b/.test(l) && /dataset|setAttribute|\.style\./.test(l));
  ok('GATE (source): the engine reads the G flag ONCE (one __wzTwTrace, as const trace), every write is behind if (trace), and no trace line touches the DOM',
    reads === 1 && assigned && pushes > 0 && pushes === gated && domOnTrace.length === 0, J({ reads, assigned, pushes, gated, domOnTrace }));
}
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
    const fid = pid(th.id, 'fresh');
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: fid, text: 'One line to start.', createdAt: now, origin: null, source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${fid}', 'drafting')`);
    await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${fid}', 'on')`);
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
    // W0 - a FRESH zoomed page (one short line): the first writing line sits in the band's full strength from the very first keystroke
    {
      await app.emulateDpr(1, 1366, 768);
      const fid = pid(th.id, 'fresh');
      if (await openPage(app, fid)) {
        await app.evalJs('window.__psCaretToEnd()'); await app.typeKeys('x'); await sleep(900);
        const z0 = await app.evalJs("!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')");
        const fl = await app.evalJs('window.__psLines()');
        ok(`${th.name} 1366x768 W0 (premise): a fresh page, zoomed, one line long`, z0 && !!fl && fl.length === 1, J({ z0, lines: fl && fl.length }));
        if (z0 && fl && fl.length) {
          const s0 = await strengths(app, [fl[fl.length - 1]]);
          ok(`${th.name} 1366x768 W0: on a FRESH zoomed page the first writing line paints at full strength (>= ${FULL})`,
            s0[0].bare != null && s0[0].bare >= 60 && s0[0].bare >= s0[0].painted * REF_FLOOR && s0[0].s >= FULL, J(s0[0]));
        }
      } else ok(`${th.name} 1366x768 W0 fixture: the fresh page opened`, false, '');
    }
  }

  // ---- V: THE VIGNETTE SITS BEHIND THE PAGE, in every theme and page tone (Fable, Oct 23 - folded into page-size: Arbor's light page showed a grey band
  // at the paper's foot in deploy #5's screens, the same vignette-over-the-page bug INK fixed for Flux alone in flux-inputs). Read from PAINT: the paper's
  // bottom strip and its two lower corners (its own padding - no text there) must look the SAME with the vignette shown and with it hidden.
  // MV (the mutant, and the instrument's liveness): with the vignette forced back ON TOP, the same strip must CHANGE - so V cannot pass on an instrument
  // that sees nothing, and a vignette that is too faint to matter would show here as a mutant that does not land.
  const VIG_HIDE = 'body::after { display:none !important; }';
  const VIG_TOP = 'body::after { z-index:2147483647 !important; }';
  const VIG_MEAN = 0.6;   // a strip the vignette does not touch differs by noise only
  const VIG_ROOM = 5;     // the largest pixel change in a room corner when the vignette is hidden: past noise, so the vignette still exists
  for (const th of THEMES) {
    for (const tone of ['light', 'dark']) {
      await app.evalJs("location.hash = '#/'"); await sleep(300);
      await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}'); localStorage.setItem('wrizo-theme-prefs', ${J(J({ voice: 'serif', page: tone, fade: 'on' }))})`);
      // V reads the NORMAL page: an earlier zoom case can leave the page's own Typewriter key on (7ff7b8ea: V measured a zoomed page's bottom fade)
      await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${pid(th.id, 'draft')}', 'off')`);
      await app.reload();
      await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
      await app.emulateDpr(1, 1366, 768);
      const tag = `${th.name} ${tone} page 1366x768`;
      if (!(await openPage(app, pid(th.id, 'draft')))) { ok(`${tag} V fixture: the Draft page opened`, false, ''); continue; }
      await app.evalJs('(() => { const a = document.activeElement; if (a && a.blur) a.blur(); return true; })()');
      const vig = await app.evalJs("(() => { const cs = getComputedStyle(document.body, '::after'); const p = document.querySelector('.mode-page'); const ps = p ? getComputedStyle(p) : null; return { content: cs.content, shadow: cs.boxShadow, z: cs.zIndex, paper: ps && ps.backgroundColor, pageOpacity: ps && ps.opacity, pageTransform: ps && ps.transform }; })()");
      const g = await app.evalJs('window.__psGeom()');
      const flat = !(await app.evalJs("!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')"));
      const live = !!vig && vig.content !== 'none' && !!vig.shadow && vig.shadow !== 'none' && !!g && flat;
      ok(`${tag} V (premise): the vignette exists (body::after carries its shadow), the page is measurable and in the NORMAL view (not zoomed)`, live, J({ vig, flat, page: g && g.page }));
      if (!live) continue;
      const b = Math.min(g.page.bottom, g.vh) - 3;
      const strips = [[g.page.left + 3, b - 24, g.page.right - 3, b], [g.page.left + 3, b - 60, g.page.left + 63, b], [g.page.right - 63, b - 60, g.page.right - 3, b]];
      const diffs = async (css) => {
        await app.evalJs('window.__psFrames(3)'); await shoot(app); await app.evalJs('window.__psKeep()');
        await app.evalJs(`window.__psStyle('ps-vig', ${J(css)})`); await app.evalJs('window.__psFrames(3)'); await shoot(app);
        await app.evalJs("window.__psStyle('ps-vig', null)"); await app.evalJs('window.__psFrames(2)');
        return app.evalJs(`(${J(strips)}).map((s) => window.__psDiff(...s))`);
      };
      const shown = await diffs(VIG_HIDE);   // as shipped vs the vignette hidden
      ok(`${tag} V: the vignette sits BEHIND the page - the paper's foot and lower corners look the same with it shown or hidden (mean diff <= ${VIG_MEAN})`,
        shown.every((d) => !!d && d.mean <= VIG_MEAN), J({ shown, z: vig.z }));
      // V-room: BEHIND, not GONE - a "fix" that deleted the vignette would pass V, so the room must still change when it is hidden: at least one of the
      // viewport's four corners (the desk, where the inset shadow is darkest) differs by more than noise (the guard against a fix that just removes it)
      const vw = await app.evalJs('innerWidth'); const vh = g.vh;
      const corners = [[0, 0, 40, 40], [vw - 40, 0, vw, 40], [0, vh - 40, 40, vh], [vw - 40, vh - 40, vw, vh]];
      await app.evalJs('window.__psFrames(3)'); await shoot(app); await app.evalJs('window.__psKeep()');
      await app.evalJs(`window.__psStyle('ps-vig', ${J(VIG_HIDE)})`); await app.evalJs('window.__psFrames(3)'); await shoot(app);
      await app.evalJs("window.__psStyle('ps-vig', null)"); await app.evalJs('window.__psFrames(2)');
      const room = await app.evalJs(`(${J(corners)}).map((s) => window.__psDiff(...s))`);
      ok(`${tag} V-room: the vignette is BEHIND, not gone - hiding it still changes the room (some viewport corner by ${VIG_ROOM}+ at its largest pixel)`,
        room.some((d) => !!d && d.max >= VIG_ROOM), J({ room }));
      // MV: the vignette forced on top, then hidden - the same strips must now CHANGE
      await app.evalJs(`window.__psStyle('ps-vig-top', ${J(VIG_TOP)})`);
      const landed = await app.evalJs("getComputedStyle(document.body, '::after').zIndex");
      const onTop = await diffs(VIG_HIDE);
      await app.evalJs("window.__psStyle('ps-vig-top', null)");
      ok(`${tag} MV (mutant): with the vignette forced ON TOP (LANDED: z-index ${landed}), the paper's foot CHANGES when it is hidden - V fails`,
        landed === '2147483647' && !onTop.every((d) => !!d && d.mean <= VIG_MEAN), J({ onTop }));
      // I - THE SKIN CHANGES ONLY THE SKIN (Nick, Oct 24): this skin's geometry, normal and zoomed, at two sizes - compared across skins below
      const skin = `${th.name} ${tone}`;
      ident[skin] = {};
      for (const [iw, ih] of [[1366, 768], [1920, 1080]]) {
        const did = pid(th.id, 'draft');
        await app.emulateDpr(1, iw, ih);
        await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${did}', 'off')`);
        if (!(await openPage(app, did))) { ident[skin][iw] = null; continue; }
        const normal = await app.evalJs(IDENT_PROBE);
        // MI (the mutant, once): Flux dark's page padding widened 90px - the identity below must catch it (asserted to have LANDED)
        let mutated = null;
        if (th.id === 'flux' && tone === 'dark' && iw === 1366) {
          await app.evalJs("window.__psStyle('ps-mi', \"[data-theme='flux'] .desk-frame-stage--prose .mode-page { padding-left: 90px !important; }\")"); await sleep(300);
          mutated = await app.evalJs(IDENT_PROBE);
          await app.evalJs("window.__psStyle('ps-mi', null)"); await sleep(200);
        }
        await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${did}', 'on')`);
        const zoomed = (await openPage(app, did)) ? await app.evalJs(IDENT_PROBE) : null;
        await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${did}', 'off')`);
        ident[skin][iw] = { normal, zoomed, mutated };
      }
    }
  }
  // I: every skin's geometry equals the FIRST skin's (Arbor light) within IDENT_TOL px - the page box, its margins, its type size; zoomed, the page
  // box, the band's anchor and line unit and the mask's own stops. Line breaks are NOT compared (the law allows them to differ by a word).
  {
    const skins = Object.keys(ident);
    const base = skins[0];
    const near = (a, b) => a != null && b != null && Math.abs(a - b) <= IDENT_TOL;
    const sameNormal = (a, b) => !!a && !!b && ['left', 'top', 'width', 'height'].every((k) => near(a.page[k], b.page[k]))
      && ['padT', 'padR', 'padB', 'padL'].every((k) => near(a[k], b[k])) && near(a.fontPx, b.fontPx) && near(a.colW, b.colW) && a.transform === b.transform;
    const sameZoom = (a, b) => !!a && !!b && a.zoom === 'true' && b.zoom === 'true' && ['left', 'top', 'width', 'height'].every((k) => near(a.page[k], b.page[k]))
      && a.anchor === b.anchor && near(a.lh, b.lh) && a.mask === b.mask;
    ok(`I (premise): every registered skin, light and dark, was measured at 1366 and 1920, normal and zoomed (${skins.length} skins)`,
      skins.length === THEMES.length * 2 && skins.every((s) => [1366, 1920].every((w) => ident[s][w] && ident[s][w].normal && ident[s][w].zoomed)), J(skins));
    for (const w of [1366, 1920]) {
      for (const s of skins.slice(1)) {
        const a = ident[base][w]; const b = ident[s][w];
        ok(`I ${s} vs ${base} @ ${w}: the NORMAL page is the same box, the same margins, the same text column and the same type size (within ${IDENT_TOL}px) - the skin changed only the skin`,
          !!a && !!b && sameNormal(a.normal, b.normal), J({ base: a && a.normal, here: b && b.normal }));
        ok(`I ${s} vs ${base} @ ${w}: the ZOOM is the same - its page box, the band's anchor and line unit, the mask's stops (within ${IDENT_TOL}px)`,
          !!a && !!b && sameZoom(a.zoomed, b.zoomed), J({ base: a && a.zoomed, here: b && b.zoomed }));
      }
    }
    const mi = ident['Flux dark'] && ident['Flux dark'][1366] && ident['Flux dark'][1366].mutated;
    const miBase = ident[base] && ident[base][1366] && ident[base][1366].normal;
    ok('MI (mutant): with Flux dark\'s page padding widened 90px (LANDED: its left padding moved), the identity check FAILS - it can see a skin changing the size',
      !!mi && !!miBase && Math.abs(mi.padL - miBase.padL) >= 30 && !sameNormal(miBase, mi), J({ base: miBase, mutated: mi }));
  }
  await app.evalJs("localStorage.setItem('wrizo-theme-prefs', " + J(J({ voice: 'serif', page: 'light', fade: 'on' })) + ")");

  // S (the lane run on d80010ae, cd2 S1/S5 + fx2 S1 @ 1100): the ZOOMED page never slides under the strip. The strip is fixed at the window's left and
  // stands 51px over the stage at the gate floor; the zoom's 48px-a-side gutter put the page 3px under it. Now the gutter counts it (pageScale.ts
  // ZOOM_CLEAR). MS: the zoom the old gutter gave, written back on the stage - S must fail.
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs("localStorage.setItem('wrizo-theme', 'plateau')"); await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.emulateDpr(1, 1100, 900);
  {
    const sid = pid('plateau', 'draft');
    await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${sid}', 'on')`);
    if (await openPage(app, sid)) {
      const stripProbe = `(() => { const s = document.querySelector('.desk-frame-strip'); const p = document.querySelector('.desk-frame-stage--prose .mode-page'); const col = document.querySelector('.mode-pagecol');
        if (!s || !p || !col) return null; const a = s.getBoundingClientRect(); const b = p.getBoundingClientRect();
        return { zoom: col.getAttribute('data-zoom'), stripRight: Math.round(a.right * 10) / 10, pageLeft: Math.round(b.left * 10) / 10, pageWidth: Math.round(b.width) }; })()`;
      const sNow = await app.evalJs(stripProbe);
      ok('S (1100x900, Arbor, zoomed): the zoomed page never slides under the strip - its painted left edge clears the strip\'s right edge',
        !!sNow && sNow.zoom === 'true' && sNow.pageLeft >= sNow.stripRight, J(sNow));
      const landedS = await app.evalJs(`(() => { const st = document.querySelector('.desk-frame-stage--prose'); if (!st) return null; const k = parseFloat(getComputedStyle(st).getPropertyValue('--wz-k')) || 1;
        const z = Math.min(1.6, (st.getBoundingClientRect().width - 96) / (620 * k)); st.style.setProperty('--wz-zoom', z.toFixed(4)); return z.toFixed(4); })()`);
      await sleep(300);
      const sMut = await app.evalJs(stripProbe);
      ok(`MS (mutant): with the old gutter's zoom written back (LANDED: --wz-zoom ${landedS}, the page wider), the page slides under the strip - S fails`,
        !!sMut && !!sNow && sMut.pageWidth > sNow.pageWidth && !(sMut.pageLeft >= sMut.stripRight), J({ now: sNow, mutated: sMut }));
    } else ok('S fixture: the Arbor Draft page opened at 1100x900', false, '');
    await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${sid}', 'off')`);
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
if (process.env.HARNESS_PARKED === '1') {
  // C, parked (Fable's C ruling, Oct 24): one record per skin and size, under its original name; each re-verifies the new truth from the default leg -
  // the face's measure was MEASURED (and recorded here), on the column I holds identical across skins.
  const rec = psParks.C.map((o) => ({ name: `PARKED (was "${o.skin} ${o.w}x${o.h} C: at the default, the median full line holds ${CPL_MIN}-${CPL_MAX} characters (~75)") - Fable's C ruling (Oct 24): the measure is the FACE's; the column is I's`,
    pass: o.lines >= 10 && o.median > 0, detail: J(o) }));
  for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
  console.log(rec.length && rec.every((c) => c.pass) ? `\nPAGE-SIZE PARKED: PASS (${rec.length} records) - this FILE parks 1 (C, one record per skin x size)` : `\nPAGE-SIZE PARKED: FAIL - ${rec.filter((c) => !c.pass).length}/${rec.length} (${rec.length} records)`);
}
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPAGE-SIZE VERIFY: PASS (${checks.length} checks)` : `\nPAGE-SIZE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
