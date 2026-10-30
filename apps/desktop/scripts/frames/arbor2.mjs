// ARBOR v2 MOCKUP - named screens for INK's frames job (.github/workflows/frames.yml, -f screens_file=apps/desktop/scripts/frames/arbor2.mjs).
// NOT in harness/: run-suite runs every .mjs there, and this only takes pictures.
//
// Every screen turns the flag on (?arbor2=1 before the hash) and NEVER touches the mockup bar's Night/Day override: the frames job sets the
// page tone (light/dark) itself, so a dark frame that differs from its light twin proves the room FOLLOWS the existing tone setting.
// Seeds go through the app's seams (window.wrizo*), never raw collection storage (AGENTS.md "HOW TO SEED A FIXTURE").
// No imports: the job loads this file from the built branch, so it stands alone.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);

// the flag lives in the URL only: put it before the hash, reload, and wait the splash out
const flagTo = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'arbor2 flag on', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const page = async (app, id, text) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await flagTo(app, '#/page/' + id);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1200);
};
const rhizomeAt = async (app, words) => {
  // the progress style is a writing setting (not a collection): Rhizome, by words, goal 8
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  await app.evalJs("window.wrizoSetWritingGoal({ n: 8, unit: 'words' })");
  await page(app, 'arbor-rz', Array.from({ length: words }, (_, i) => 'word' + i).join(' '));
  await waitSoft(app, "!!document.querySelector('.wz-rhizome-field')", { label: 'rhizome field', timeout: 4000 });
};

// item 9: open the Desk under the flag, optionally pick the bar's Logo "Sage", and prove the drawn mark is the room's copy and loads
const logoAt = async (app, which) => {
  await flagTo(app, '#/');
  await waitSoft(app, "!!document.querySelector('img.wz-logo')", { label: 'logo', timeout: 6000 });
  if (which === 'all') await clickText(app, '.arbor2-bar-opt', 'Sage');
  await sleep(500);
  const r = await app.evalJs(`(async () => {
    const img = document.querySelector('img.wz-logo'), room = document.documentElement.getAttribute('data-arbor2-room');
    const content = img ? getComputedStyle(img).content : null;
    const url = content && content.startsWith('url(') ? content.slice(4, content.lastIndexOf(')')).split('"').join('') : null;
    let status = null, type = null, w = 0;
    if (url) { const res = await fetch(url); status = res.status; type = res.headers.get('content-type'); const b = new Uint8Array(await res.arrayBuffer()); w = b.length > 24 ? (b[16] << 24 | b[17] << 16 | b[18] << 8 | b[19]) : 0; }
    // THE GROUND behind the mark, found apart from the CSS that picks the copy: the first thing under the mark's centre that paints a colour
    // (a background colour, or the first colour of a background gradient). Run 41009240945 drew the DAY copy (olive) on the front door's
    // dark ground, and nothing measured the ground.
    const rgbOf = (s) => { const i = s.indexOf('rgb'); if (i < 0) return null; const n = s.slice(s.indexOf('(', i) + 1, s.indexOf(')', i)).split(',').map(Number); return n.length >= 3 && (n.length < 4 || n[3] > 0) ? n.slice(0, 3) : null; };
    let ground = null, groundBy = null;
    if (img) {
      const r0 = img.getBoundingClientRect();
      for (const el of document.elementsFromPoint(r0.left + r0.width / 2, r0.top + r0.height / 2)) {
        if (el === img) continue;
        const cs = getComputedStyle(el);
        ground = rgbOf(cs.backgroundColor) || rgbOf(cs.backgroundImage);
        if (ground) { groundBy = el.className || el.tagName; break; }
      }
    }
    return { room, url, status, type, w, rect: img ? img.getBoundingClientRect().width : 0, ground, groundBy: String(groundBy).slice(0, 40) };
  })()`);
  // the front door keeps a dark ground in both rooms, so its mark is the SAGE copy in both (the olive copies are for a light ground)
  const want = 'wrizo-logo-sage' + (which === 'all' ? '-all' : '') + '.png';
  const gAvg = r.ground ? (r.ground[0] + r.ground[1] + r.ground[2]) / 3 : null;
  const polarity = gAvg !== null && gAvg < 175 - 60;   // the sage stroke averages 175: the ground must be clearly darker
  if (!r.url || !r.url.endsWith('/brand/arbor2/' + want) || r.status !== 200 || !/png/.test(r.type || '') || r.w !== 900 || !(r.rect > 0) || !polarity)
    throw new Error('LOGO PROOF FAILED ' + JSON.stringify({ want, polarity, gAvg, ...r }));
};

// THE ZOOMED PAGE PROOF (Fable, Oct 29: "the pergola shadows must NEVER cross the prose column, including through the page's see-through
// fades; the night fade must not turn the paper into a band"). Runs IN the page. On Free Write's Typewriter zoom the column's band mask makes
// the page see-through at its top and bottom, so:
//   PAPER  an opaque sheet (.arbor2-paper) lies behind the visible page (page box cut to the column), in the page's own paper colour
//   HOLE   by day, the sun layer's clip-path is evenodd with a hole that covers that whole visible page
// A screen that fails it throws, so the frames job reports the row FAILED with the measurements instead of shipping a picture.
// PARKED 2026-10-29 (SUPERSEDED by zoomProof below, after run 40986639311): (1) its HOLE reader assumed the clip reads back exactly as written
// ("M0 0H..."); it said false by day on a page whose picture showed no slat, so the instrument is suspect, and the successor parses numbers
// whatever the spacing and reports the clip it read; (2) its page box ran under the stage's progress row, which the paper must NOT cover (the
// word count lost its contrast on cream); (3) it could not see the room's vignette greying the night paper's top and bottom. Original, verbatim:
export function zoomProofV1() {
  const col = document.querySelector('.mode-pagecol[data-zoom="true"]'), p = col && col.querySelector('.mode-page');
  if (!p) return { pass: false, why: 'no zoomed page' };
  const a = p.getBoundingClientRect(), c = col.getBoundingClientRect();
  const vis = { l: Math.max(a.left, c.left), t: Math.max(a.top, c.top), r: Math.min(a.right, c.right), b: Math.min(a.bottom, c.bottom, innerHeight) };
  const room = document.documentElement.getAttribute('data-arbor2-room');
  const k = document.querySelector('.arbor2-paper'), kr = k ? k.getBoundingClientRect() : null, kcs = k ? getComputedStyle(k) : null;
  const near = (x, y) => Math.abs(x - y) <= 1;
  const paper = !!kr && kcs.display !== 'none' && kcs.visibility !== 'hidden' && +kcs.opacity === 1
    && near(kr.left, vis.l) && near(kr.top, vis.t) && near(kr.right, vis.r) && near(kr.bottom, vis.b)
    && kcs.backgroundColor === getComputedStyle(p).backgroundColor;
  let hole = null;
  if (room === 'day') {
    const s = document.querySelector('.arbor2-sun'), sr = s ? s.getBoundingClientRect() : null, clip = s ? String(s.style.clipPath || '') : '';
    const m = [...clip.matchAll(/M(-?[\d.]+) (-?[\d.]+)H(-?[\d.]+)V(-?[\d.]+)H/g)];
    const h = m[1] && sr ? { l: +m[1][1] + sr.left, t: +m[1][2] + sr.top, r: +m[1][3] + sr.left, b: +m[1][4] + sr.top } : null;
    hole = !!h && clip.includes('evenodd') && h.l <= vis.l + 1 && h.t <= vis.t + 1 && h.r >= vis.r - 1 && h.b >= vis.b - 1;
  }
  return { pass: paper && hole !== false, room, paper, hole, vis, backing: kr ? { l: kr.left, t: kr.top, r: kr.right, b: kr.bottom, bg: kcs.backgroundColor } : null, pageBg: getComputedStyle(p).backgroundColor };
}

// SUCCESSOR. The hole in an evenodd clip of the form "M x y H x V y H x Z M l t H r V b H l Z" (any spacing): numbers 5-8 are l, t, r, b.
export function holeOf(clip) {
  const s = String(clip || '');
  const n = (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  return s.includes('evenodd') && n.length >= 10 ? { l: n[5], t: n[6], r: n[7], b: n[8] } : null;
}
// PARKED 2026-10-29 (SUPERSEDED by zoomProof below, after run 40987236296: it PASSED on frames that showed the paper still under "31 words".
// Its foot came from the same `.mode-progress` box paper.ts read - a 0-tall box - so code and check were blind together. The successor finds
// the foot apart from paper.ts and fails if a progress row is on screen but no foot was found). Original, verbatim:
export function zoomProofV2(holeOf) {
  const col = document.querySelector('.mode-pagecol[data-zoom="true"]'), p = col && col.querySelector('.mode-page');
  if (!p) return { pass: false, why: 'no zoomed page' };
  const a = p.getBoundingClientRect(), c = col.getBoundingClientRect();
  const prog = p.closest('.mode-stage')?.querySelector('.mode-progress'), pr = prog ? prog.getBoundingClientRect() : null;
  const foot = pr && pr.height > 0 && pr.top > a.top ? pr.top : Infinity;
  const vis = { l: Math.max(a.left, c.left), t: Math.max(a.top, c.top), r: Math.min(a.right, c.right), b: Math.min(a.bottom, c.bottom, innerHeight, foot) };
  const room = document.documentElement.getAttribute('data-arbor2-room');
  const k = document.querySelector('.arbor2-paper'), kr = k ? k.getBoundingClientRect() : null, kcs = k ? getComputedStyle(k) : null;
  const near = (x, y) => Math.abs(x - y) <= 1;
  const paper = !!kr && kcs.display !== 'none' && kcs.visibility !== 'hidden' && +kcs.opacity === 1
    && near(kr.left, vis.l) && near(kr.top, vis.t) && near(kr.right, vis.r) && near(kr.bottom, vis.b)
    && kcs.backgroundColor === getComputedStyle(p).backgroundColor;
  const covers = (h, ox, oy) => !!h && h.l + ox <= vis.l + 1 && h.t + oy <= vis.t + 1 && h.r + ox >= vis.r - 1 && h.b + oy >= vis.b - 1;
  const vClip = getComputedStyle(document.body, '::after').clipPath;
  const vignette = covers(holeOf(vClip), 0, 0);
  let hole = null, sClip = null;
  if (room === 'day') {
    const s = document.querySelector('.arbor2-sun'), sr = s ? s.getBoundingClientRect() : null;
    sClip = s ? getComputedStyle(s).clipPath : null;
    hole = !!sr && covers(holeOf(sClip), sr.left, sr.top);
  }
  return { pass: paper && vignette && hole !== false, room, paper, vignette, hole, vis, foot: foot === Infinity ? null : foot,
    backing: kr ? { l: kr.left, t: kr.top, r: kr.right, b: kr.bottom, bg: kcs.backgroundColor } : null, pageBg: getComputedStyle(p).backgroundColor,
    sClip: sClip && sClip.slice(0, 90), vClip: vClip && vClip.slice(0, 90) };
}
// PARKED 2026-10-29 (SUPERSEDED by zoomProof below, after Fable's ruling on run 40987833965: "The Typewriter rule stands: the zoomed page is
// unframed, so give the opaque night sheet no visible edge". This proof asked for a HARD sheet (an exact rect, the page's bg, the paper glow) and
// a HARD vignette hole - it certified the very edge the ruling removes. The successor asks for a sheet that fades to nothing at every side, a page
// that draws no edge of its own, and a vignette that is exactly the paper's complement). Original, verbatim:
export function zoomProofV3(holeOf) {
  const col = document.querySelector('.mode-pagecol[data-zoom="true"]'), p = col && col.querySelector('.mode-page');
  if (!p) return { pass: false, why: 'no zoomed page' };
  const a = p.getBoundingClientRect(), c = col.getBoundingClientRect();
  // THE FOOT, found apart from paper.ts's own lookup (run 40987236296: both read `.mode-progress`'s 0-tall box, the sheet ran under the word
  // count, and the proof passed with it): every visible line of text reading "N words" and every visible piece of the progress row,
  // document-wide, below the page's top and across it. If such a row is on screen, the foot MUST be found (footSeen).
  let foot = Infinity, footSeen = false;
  for (const el of document.querySelectorAll('body *')) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*\d+\s+words?\s*$/i.test(n.textContent));
    if (!own && !el.closest('.mode-progress')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.top > a.top + 40 && r.left < a.right && r.right > a.left) { foot = Math.min(foot, r.top); footSeen = true; }
  }
  const rowOnScreen = [...document.querySelectorAll('.mode-progress *')].some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  const vis = { l: Math.max(a.left, c.left), t: Math.max(a.top, c.top), r: Math.min(a.right, c.right), b: Math.min(a.bottom, c.bottom, innerHeight, foot) };
  const room = document.documentElement.getAttribute('data-arbor2-room');
  const k = document.querySelector('.arbor2-paper'), kr = k ? k.getBoundingClientRect() : null, kcs = k ? getComputedStyle(k) : null;
  const near = (x, y) => Math.abs(x - y) <= 1;
  const paper = !!kr && kcs.display !== 'none' && kcs.visibility !== 'hidden' && +kcs.opacity === 1
    && near(kr.left, vis.l) && near(kr.top, vis.t) && near(kr.right, vis.r) && near(kr.bottom, vis.b)
    && kcs.backgroundColor === getComputedStyle(p).backgroundColor;
  const covers = (h, ox, oy) => !!h && h.l + ox <= vis.l + 1 && h.t + oy <= vis.t + 1 && h.r + ox >= vis.r - 1 && h.b + oy >= vis.b - 1;
  const vClip = getComputedStyle(document.body, '::after').clipPath;
  const vignette = covers(holeOf(vClip), 0, 0);
  let hole = null, sClip = null;
  if (room === 'day') {
    const s = document.querySelector('.arbor2-sun'), sr = s ? s.getBoundingClientRect() : null;
    sClip = s ? getComputedStyle(s).clipPath : null;
    hole = !!sr && covers(holeOf(sClip), sr.left, sr.top);
  }
  const footOk = !rowOnScreen || footSeen;
  return { pass: paper && vignette && hole !== false && footOk, room, paper, vignette, hole, footOk, vis, foot: foot === Infinity ? null : foot,
    backing: kr ? { l: kr.left, t: kr.top, r: kr.right, b: kr.bottom, bg: kcs.backgroundColor } : null, pageBg: getComputedStyle(p).backgroundColor,
    sClip: sClip && sClip.slice(0, 90), vClip: vClip && vClip.slice(0, 90) };
}
// Reads a computed mask-image: each linear-gradient's axis ('x' for `to right`, else 'y', CSS's default) and its stops as { a, px } (alpha at
// an offset in px). Colours in either serialization (rgb(0, 0, 0) / rgba(0, 0, 0, 0) / rgb(0 0 0 / 0) / transparent / #000).
export function stopsOf(mask) {
  const s = String(mask || '');
  if (!s.includes('linear-gradient(')) return [];
  return s.split('linear-gradient(').slice(1).map((g) => {
    const axis = /^\s*to right\b/.test(g) ? 'x' : 'y';
    const stops = [...g.matchAll(/(rgba?\(([^)]*)\)|transparent|#[0-9a-fA-F]{3,8})\s+(-?\d+(?:\.\d+)?)px/g)].map((m) => {
      const parts = m[2] !== undefined ? m[2].split(/[\s,/]+/).filter(Boolean) : [];
      const a = m[1] === 'transparent' ? 0 : parts.length === 4 ? parseFloat(parts[3]) : 1;
      return { a, px: parseFloat(m[3]) };
    });
    return { axis, stops };
  });
}
// PARKED 2026-10-29 (SUPERSEDED by zoomProof below, on Fable's ruling "Feather the pergola's page hole with a ~24 px soft edge (§7.1), never
// over the prose column": this proof asked for the sun layer's HARD evenodd clip covering the visible page - the line the ruling removes.
// The successor asks for a soft edge: the light reaches the page's edge and fades to nothing within 24 px, never over the prose column).
// Original, verbatim:
export function zoomProofV4(holeOf, stopsOf) {
  const col = document.querySelector('.mode-pagecol[data-zoom="true"]'), p = col && col.querySelector('.mode-page');
  if (!p) return { pass: false, why: 'no zoomed page' };
  const a = p.getBoundingClientRect(), c = col.getBoundingClientRect();
  let foot = Infinity, footSeen = false;
  for (const el of document.querySelectorAll('body *')) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*\d+\s+words?\s*$/i.test(n.textContent));
    if (!own && !el.closest('.mode-progress')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.top > a.top + 40 && r.left < a.right && r.right > a.left) { foot = Math.min(foot, r.top); footSeen = true; }
  }
  const rowOnScreen = [...document.querySelectorAll('.mode-progress *')].some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  const vis = { l: Math.max(a.left, c.left), t: Math.max(a.top, c.top), r: Math.min(a.right, c.right), b: Math.min(a.bottom, c.bottom, innerHeight, foot) };
  const room = document.documentElement.getAttribute('data-arbor2-room');
  const k = document.querySelector('.arbor2-paper'), kr = k ? k.getBoundingClientRect() : null, kcs = k ? getComputedStyle(k) : null;
  const near = (x, y) => Math.abs(x - y) <= 1;
  const pcs = getComputedStyle(p);
  const probe = document.createElement('i');
  probe.style.color = pcs.getPropertyValue('--paper').trim();
  document.body.appendChild(probe);
  const paperRgb = getComputedStyle(probe).color;
  probe.remove();
  const sheet = !!kr && kcs.display !== 'none' && kcs.visibility !== 'hidden' && +kcs.opacity === 1 && kcs.boxShadow === 'none'
    && near(kr.left, vis.l) && near(kr.top, vis.t) && near(kr.right, vis.r) && near(kr.bottom, vis.b) && kcs.backgroundColor === paperRgb;
  const clear = (col) => col === 'transparent' || /^rgba\(.*,\s*0\)$/.test(col) || /\/\s*0\)$/.test(col);
  const bare = clear(pcs.backgroundColor) && pcs.boxShadow === 'none'
    && ['Top', 'Right', 'Bottom', 'Left'].every((s) => parseFloat(pcs[`border${s}Width`]) === 0 || clear(pcs[`border${s}Color`]));
  // a stop list's alpha at v (CSS: flat before the first stop and after the last, linear between)
  const at = (st, v) => {
    if (!st.length) return 1;
    if (v <= st[0].px) return st[0].a;
    for (let i = 1; i < st.length; i++) if (v <= st[i].px) return st[i].px === st[i - 1].px ? st[i].a : st[i - 1].a + (st[i].a - st[i - 1].a) * (v - st[i - 1].px) / (st[i].px - st[i - 1].px);
    return st[st.length - 1].a;
  };
  const vcs = getComputedStyle(document.body, '::after');
  const sm = kcs ? kcs.maskImage : '', vm = vcs.maskImage;
  const sg = stopsOf(sm), vg = stopsOf(vm);
  const every = (v, want) => String(v || '').split(',').every((x) => x.trim() === want);
  // the sheet's layers INTERSECT (alpha multiplies); the vignette's layers ADD (source-over: 1 - the product of what each leaves out)
  const sOk = sg.length === 2 && every(kcs.maskComposite, 'intersect'), vOk = vg.length === 2 && every(vcs.maskComposite, 'add');
  const sA = (x, y) => (sOk ? sg.reduce((m, g) => m * at(g.stops, g.axis === 'x' ? x - kr.left : y - kr.top), 1) : 1);
  const vA = (x, y) => (vOk ? 1 - vg.reduce((m, g) => m * (1 - at(g.stops, g.axis === 'x' ? x : y)), 1) : 1);
  const cx = (vis.l + vis.r) / 2, cy = (vis.t + vis.b) / 2;
  const edgeless = sOk && !!kr && [sA(kr.left + .5, cy), sA(kr.right - .5, cy), sA(cx, kr.top + .5), sA(cx, kr.bottom - .5)].every((v) => v <= .05);
  const R = 64;
  const whole = sOk && [[vis.l + R, vis.t + R], [vis.r - R, vis.t + R], [vis.l + R, vis.b - R], [vis.r - R, vis.b - R], [cx, cy]].every(([x, y]) => sA(x, y) === 1);
  let worst = { d: 0 };
  for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) {
    const x = vis.l + .5 + (vis.r - vis.l - 1) * i / 12, y = vis.t + .5 + (vis.b - vis.t - 1) * j / 12;
    const d = Math.abs(sA(x, y) + vA(x, y) - 1);
    if (d > worst.d) worst = { d: +d.toFixed(3), x: Math.round(x), y: Math.round(y), s: +sA(x, y).toFixed(3), v: +vA(x, y).toFixed(3) };
  }
  const ring = [[vis.l - 3, cy], [vis.r + 3, cy], [cx, vis.t - 3], [cx, vis.b + 3], [vis.l - 3, vis.t - 3], [vis.r + 3, vis.b + 3]];
  const seamless = sOk && vOk && worst.d <= .03 && ring.every(([x, y]) => vA(x, y) >= .97);
  const covers = (h, ox, oy) => !!h && h.l + ox <= vis.l + 1 && h.t + oy <= vis.t + 1 && h.r + ox >= vis.r - 1 && h.b + oy >= vis.b - 1;
  let hole = null, sClip = null;
  if (room === 'day') {
    const s = document.querySelector('.arbor2-sun'), sr = s ? s.getBoundingClientRect() : null;
    sClip = s ? getComputedStyle(s).clipPath : null;
    hole = !!sr && covers(holeOf(sClip), sr.left, sr.top);
  }
  const footOk = !rowOnScreen || footSeen;
  return { pass: sheet && bare && edgeless && whole && seamless && hole !== false && footOk, room, sheet, bare, edgeless, whole, seamless, hole, footOk,
    worst, vis, foot: foot === Infinity ? null : foot, paperRgb, sheetBg: kcs && kcs.backgroundColor, sheetShadow: kcs && kcs.boxShadow,
    pageBg: pcs.backgroundColor, pageShadow: pcs.boxShadow, sMask: String(sm).slice(0, 120), vMask: String(vm).slice(0, 120), sClip: sClip && sClip.slice(0, 90) };
}
// Run in the page as `(${zoomProof})(${holeOf}, ${stopsOf})`. Fable, Oct 29: "the zoomed page is unframed, so give the opaque night sheet no
// visible edge" - on top of the two fixes it accepted (a whole sheet, never a band; no shadow across the prose column):
//   VISIBLE  the page's box cut to its column, to the viewport, and to the top of the stage's progress row (the foot, found apart from paper.ts)
//   SHEET    .arbor2-paper lies exactly over VISIBLE, opaque, in the page's paper colour (--paper), with no shadow
//   BARE     the page itself draws no edge: no background, no shadow, no visible border (the sheet is the only paper)
//   EDGELESS the sheet's own mask is 0 at the middle of each of its four sides
//   WHOLE    ...and 1 over all of VISIBLE but a rim of at most 64px: a whole sheet, not a band
//   SEAMLESS the room's vignette (body::after) is the sheet's exact complement inside VISIBLE (vignette + paper = 1 at every point of a 13 x 13
//            grid) and whole just outside it - the room darkens where the paper thins, so no line is drawn where the paper ends
//   SUNEDGE  by day (Fable: "Feather the pergola's page hole with a ~24 px soft edge (§7.1), never over the prose column"): the sun layer has
//            no clip, and its mask is light at the page's edge, nothing 25 px in, nothing over the prose column, whole just outside
// The masks are read from computed style and evaluated here (stopsOf + linear interpolation), never taken from paper.ts. (holeOf stays in
// the signature for the callers; this proof reads no clip.)
export function zoomProof(holeOf, stopsOf) {
  const col = document.querySelector('.mode-pagecol[data-zoom="true"]'), p = col && col.querySelector('.mode-page');
  if (!p) return { pass: false, why: 'no zoomed page' };
  const a = p.getBoundingClientRect(), c = col.getBoundingClientRect();
  let foot = Infinity, footSeen = false;
  for (const el of document.querySelectorAll('body *')) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*\d+\s+words?\s*$/i.test(n.textContent));
    if (!own && !el.closest('.mode-progress')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.top > a.top + 40 && r.left < a.right && r.right > a.left) { foot = Math.min(foot, r.top); footSeen = true; }
  }
  const rowOnScreen = [...document.querySelectorAll('.mode-progress *')].some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  const vis = { l: Math.max(a.left, c.left), t: Math.max(a.top, c.top), r: Math.min(a.right, c.right), b: Math.min(a.bottom, c.bottom, innerHeight, foot) };
  const room = document.documentElement.getAttribute('data-arbor2-room');
  const k = document.querySelector('.arbor2-paper'), kr = k ? k.getBoundingClientRect() : null, kcs = k ? getComputedStyle(k) : null;
  const near = (x, y) => Math.abs(x - y) <= 1;
  const pcs = getComputedStyle(p);
  const probe = document.createElement('i');
  probe.style.color = pcs.getPropertyValue('--paper').trim();
  document.body.appendChild(probe);
  const paperRgb = getComputedStyle(probe).color;
  probe.remove();
  const sheet = !!kr && kcs.display !== 'none' && kcs.visibility !== 'hidden' && +kcs.opacity === 1 && kcs.boxShadow === 'none'
    && near(kr.left, vis.l) && near(kr.top, vis.t) && near(kr.right, vis.r) && near(kr.bottom, vis.b) && kcs.backgroundColor === paperRgb;
  const clear = (col) => col === 'transparent' || /^rgba\(.*,\s*0\)$/.test(col) || /\/\s*0\)$/.test(col);
  const bare = clear(pcs.backgroundColor) && pcs.boxShadow === 'none'
    && ['Top', 'Right', 'Bottom', 'Left'].every((s) => parseFloat(pcs[`border${s}Width`]) === 0 || clear(pcs[`border${s}Color`]));
  // a stop list's alpha at v (CSS: flat before the first stop and after the last, linear between)
  const at = (st, v) => {
    if (!st.length) return 1;
    if (v <= st[0].px) return st[0].a;
    for (let i = 1; i < st.length; i++) if (v <= st[i].px) return st[i].px === st[i - 1].px ? st[i].a : st[i - 1].a + (st[i].a - st[i - 1].a) * (v - st[i - 1].px) / (st[i].px - st[i - 1].px);
    return st[st.length - 1].a;
  };
  const vcs = getComputedStyle(document.body, '::after');
  const sm = kcs ? kcs.maskImage : '', vm = vcs.maskImage;
  const sg = stopsOf(sm), vg = stopsOf(vm);
  const every = (v, want) => String(v || '').split(',').every((x) => x.trim() === want);
  // the sheet's layers INTERSECT (alpha multiplies); the vignette's layers ADD (source-over: 1 - the product of what each leaves out)
  const sOk = sg.length === 2 && every(kcs.maskComposite, 'intersect'), vOk = vg.length === 2 && every(vcs.maskComposite, 'add');
  const sA = (x, y) => (sOk ? sg.reduce((m, g) => m * at(g.stops, g.axis === 'x' ? x - kr.left : y - kr.top), 1) : 1);
  const vA = (x, y) => (vOk ? 1 - vg.reduce((m, g) => m * (1 - at(g.stops, g.axis === 'x' ? x : y)), 1) : 1);
  const cx = (vis.l + vis.r) / 2, cy = (vis.t + vis.b) / 2;
  const edgeless = sOk && !!kr && [sA(kr.left + .5, cy), sA(kr.right - .5, cy), sA(cx, kr.top + .5), sA(cx, kr.bottom - .5)].every((v) => v <= .05);
  const R = 64;
  const whole = sOk && [[vis.l + R, vis.t + R], [vis.r - R, vis.t + R], [vis.l + R, vis.b - R], [vis.r - R, vis.b - R], [cx, cy]].every(([x, y]) => sA(x, y) === 1);
  let worst = { d: 0 };
  for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) {
    const x = vis.l + .5 + (vis.r - vis.l - 1) * i / 12, y = vis.t + .5 + (vis.b - vis.t - 1) * j / 12;
    const d = Math.abs(sA(x, y) + vA(x, y) - 1);
    if (d > worst.d) worst = { d: +d.toFixed(3), x: Math.round(x), y: Math.round(y), s: +sA(x, y).toFixed(3), v: +vA(x, y).toFixed(3) };
  }
  const ring = [[vis.l - 3, cy], [vis.r + 3, cy], [cx, vis.t - 3], [cx, vis.b + 3], [vis.l - 3, vis.t - 3], [vis.r + 3, vis.b + 3]];
  const seamless = sOk && vOk && worst.d <= .03 && ring.every(([x, y]) => vA(x, y) >= .97);
  // SUNEDGE (by day): the sun layer's own mask, read from computed style - no clip left, light at the page's edge, nothing 25 px in, nothing
  // anywhere over the prose column (the editor's box cut to VISIBLE: it must be found), whole just outside
  let sunEdge = null, uMask = null, proseMax = null;
  if (room === 'day') {
    const s = document.querySelector('.arbor2-sun'), sr = s ? s.getBoundingClientRect() : null, ucs = s ? getComputedStyle(s) : null;
    uMask = ucs ? ucs.maskImage : '';
    const ug = stopsOf(uMask);
    const uOk = !!sr && ug.length === 2 && every(ucs.maskComposite, 'add') && (!ucs.clipPath || ucs.clipPath === 'none');
    const uA = (x, y) => (uOk ? 1 - ug.reduce((m, g) => m * (1 - at(g.stops, g.axis === 'x' ? x - sr.left : y - sr.top)), 1) : 1);
    const ed = p.querySelector('.forward-only-editor'), er = ed ? ed.getBoundingClientRect() : null;
    const pr = er && { l: Math.max(er.left, vis.l), t: Math.max(er.top, vis.t), r: Math.min(er.right, vis.r), b: Math.min(er.bottom, vis.b) };
    if (pr && pr.r - pr.l > 2 && pr.b - pr.t > 2) {
      proseMax = 0;
      for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) proseMax = Math.max(proseMax, uA(pr.l + (pr.r - pr.l) * i / 8, pr.t + (pr.b - pr.t) * j / 8));
    }
    const E = 25;
    const inner = [[vis.l + E, cy], [vis.r - E, cy], [cx, vis.t + E], [cx, vis.b - E], [vis.l + E, vis.t + E], [vis.r - E, vis.b - E]].every(([x, y]) => uA(x, y) === 0);
    const atEdge = [[vis.l + .5, cy], [vis.r - .5, cy], [cx, vis.t + .5], [cx, vis.b - .5]].every(([x, y]) => uA(x, y) >= .95);
    const outside = [[vis.l - 3, cy], [vis.r + 3, cy], [cx, vis.t - 3], [cx, vis.b + 3]].every(([x, y]) => uA(x, y) === 1);
    sunEdge = uOk && proseMax === 0 && inner && atEdge && outside;
  }
  const footOk = !rowOnScreen || footSeen;
  return { pass: sheet && bare && edgeless && whole && seamless && sunEdge !== false && footOk, room, sheet, bare, edgeless, whole, seamless, sunEdge, footOk,
    proseMax, worst, vis, foot: foot === Infinity ? null : foot, paperRgb, sheetBg: kcs && kcs.backgroundColor, sheetShadow: kcs && kcs.boxShadow,
    pageBg: pcs.backgroundColor, pageShadow: pcs.boxShadow, sMask: String(sm).slice(0, 120), vMask: String(vm).slice(0, 120), uMask: uMask && String(uMask).slice(0, 120) };
}

export default {
  // the proof above, on a zoomed Free Write page with words (the picture is the same as arbor-page; the row FAILS if the proof does)
  'arbor-proof-zoom': async (app) => {
    await page(app, 'arbor-words', WORDS);
    await waitSoft(app, "!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'typewriter zoom', timeout: 4000 });
    await sleep(600);
    const r = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()}, ${stopsOf.toString()})`);
    // the job keeps 300 characters of an error: the verdicts and the clips it read come first
    if (!r || !r.pass) throw new Error('ZOOM PROOF FAILED ' + JSON.stringify(r && { sheet: r.sheet, bare: r.bare, edgeless: r.edgeless, whole: r.whole, seamless: r.seamless, sunEdge: r.sunEdge, proseMax: r.proseMax, footOk: r.footOk, room: r.room, worst: r.worst, why: r.why, sheetShadow: r.sheetShadow, pageBg: r.pageBg, vMask: r.vMask }));
  },
  // item 1: the room and the page (night = dark tone, day = light tone; day adds item 6's pergola light)
  'arbor-page': async (app) => { await page(app, 'arbor-words', WORDS); },
  'arbor-blank': async (app) => {
    await flagTo(app, '#/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page' });
    await sleep(1200);
  },
  // items 2 + 4: the Tools drawer, Free Write (Font | Ink) and Draft (Font | Format | Presets), cloth tabs
  'arbor-tools-freewrite': async (app) => {
    await page(app, 'arbor-words', WORDS);
    await clickSel(app, '.wz-sliver-grip');
    await waitSoft(app, "!!document.querySelector(\".wz-sliver[data-open='true']\")", { label: 'tools open', timeout: 3000 });
    await sleep(700);
  },
  'arbor-tools-draft-format': async (app) => {
    await page(app, 'arbor-words', WORDS);
    await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(900);
    await clickSel(app, '.wz-sliver-grip');
    await waitSoft(app, "!!document.querySelector(\".wz-sliver[data-open='true']\")", { label: 'tools open', timeout: 3000 });
    await clickSel(app, '#wz-sliver-tab-format'); await sleep(700);
  },
  // item 3: the Tutor drawer's Board tab
  'arbor-tutor-board': async (app) => {
    await page(app, 'arbor-words', WORDS);
    await clickSel(app, '.wz-tutor-grip'); await sleep(600);
    await clickSel(app, '#wz-tutor-tab-board'); await sleep(700);
  },
  // the night progress picture (Fable's ruling): hidden while it grows, the whole web in brass at the goal. By day it is the plain rhizome.
  'arbor-rhizome-rest': async (app) => { await rhizomeAt(app, 7); await sleep(400); },
  'arbor-rhizome-flash': async (app) => {
    await rhizomeAt(app, 7);
    await app.evalJs(`document.querySelector('${ED}').focus()`);
    await app.typeKeys(' tail');
    await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'flash at goal', timeout: 4000 });
    await sleep(250);
  },
  // item 7: the rhizome variation by day - a page partway into its lap, shoots in their width classes (the proof: data-w paths with ink)
  'arbor-rhizome-variation': async (app) => {
    await rhizomeAt(app, 5);
    await sleep(400);
    const r = await app.evalJs(`(() => {
      const f = document.querySelector('.wz-rhizome-field');
      const room = document.documentElement.getAttribute('data-arbor2-room');
      const drawn = [...document.querySelectorAll('.wz-rhizome-field .wz-rhizome-seg[data-w]')].filter((p) => (p.getAttribute('d') || '').length > 0);
      const widths = [...new Set(drawn.map((p) => getComputedStyle(p).strokeWidth))].sort();
      return { field: !!f, room, classes: [...new Set(drawn.map((p) => p.getAttribute('data-w')))].sort(), widths };
    })()`);
    // by day the classes are drawn at 1-2.5 px; by night the field is hidden until the goal (the classes are still there)
    const okW = r.room !== 'day' || (r.widths.length > 0 && r.widths.every((w) => parseFloat(w) >= 1 && parseFloat(w) <= 2.5));
    await clickText(app, '.arbor2-bar-head', 'Mood ▸');
    await sleep(150);
    await app.evalJs(`document.querySelector('.arbor2-mood-switch[data-mood="variation"]')?.click()`);
    await sleep(150);
    const offW = await app.evalJs(`[...new Set([...document.querySelectorAll('.wz-rhizome-field .wz-rhizome-seg[data-w]')].filter((p) => (p.getAttribute('d') || '').length > 0).map((p) => getComputedStyle(p).strokeWidth))]`);
    const okOff = r.room !== 'day' || (offW.length > 0 && offW.every((w) => parseFloat(w) <= 0.8));
    await app.evalJs(`document.querySelector('.arbor2-mood-switch[data-mood="variation"]')?.click()`);
    if (!r.field || !r.classes.length || !okW || !okOff) throw new Error('VARIATION PROOF FAILED ' + JSON.stringify({ ...r, offW }));
  },
  // item 8: the Mood menu open, every switch flipped off and back on - each one changes its own measured thing, the page never moves,
  // and nothing reaches storage (the screen THROWS with the measurements otherwise; the picture is the menu with three switches off)
  'arbor-mood': async (app) => {
    await page(app, 'arbor-words', WORDS);
    const opened = await clickText(app, '.arbor2-bar-head', 'Mood ▸');
    await sleep(200);
    const M = `(() => {
      const root = document.documentElement, cs = getComputedStyle(root), sun = document.querySelector('.arbor2-sun');
      const grip = document.querySelector('.wz-sliver-grip, .wz-tutor-grip'), p = document.querySelector('.mode-page');
      const leaf = document.querySelector('.arbor2-sun-leaf');
      if (leaf) leaf.setAttribute('data-flutter', 'true');
      const out = {
        breath: getComputedStyle(document.body, '::before').animationName,
        shadows: sun ? getComputedStyle(sun).display : null,
        afternoon: cs.getPropertyValue('--arbor2-afternoon').trim(),
        flutter: leaf ? getComputedStyle(leaf).animationName : null,
        pull: cs.getPropertyValue('--drawer-dur').trim(),
        tabs: grip ? getComputedStyle(grip).backgroundColor : null,
        rect: p ? JSON.stringify(p.getBoundingClientRect()) : null,
        store: Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])),
        room: root.getAttribute('data-arbor2-room'),
      };
      if (leaf) leaf.removeAttribute('data-flutter');
      return out;
    })()`;
    const before = await app.evalJs(M);
    const keys = ['breath', 'shadows', 'afternoon', 'flutter', 'pull', 'tabs'];   // variation: measured by its widths in arbor-rhizome-variation
    // storage: the app may write its own keys meanwhile; a switch must never put anything that names Arbor or the Mood into it
    const leaks = (a, b) => Object.keys(b).filter((k) => a[k] !== b[k] && /arbor|mood/i.test(k + ' ' + b[k]));
    const changed = {};
    // each read waits out the slowest colour change a switch starts: the grip's own `transition:.15s` (index.css) - run 41009240945 read it
    // at 120 ms, mid-fade, and the day tab "came back" as a colour between the two (night's two colours are close enough to hide it)
    for (const k of keys) {
      await app.evalJs(`document.querySelector('.arbor2-mood-switch[data-mood="${k}"]')?.click()`);
      await sleep(450);
      const off = await app.evalJs(M);
      await app.evalJs(`document.querySelector('.arbor2-mood-switch[data-mood="${k}"]')?.click()`);
      await sleep(450);
      const back = await app.evalJs(M);
      // what each switch must change: breath and shadows only exist in their own room (night / day); the rest in both
      const own = (k === 'breath' && before.room !== 'night') || (k === 'shadows' && before.room !== 'day') ? null : k;
      changed[k] = { off: off[k], moved: own ? off[own] !== before[own] : 'n/a', back: back[k] === before[k], rect: off.rect === before.rect && back.rect === before.rect, store: leaks(before.store, off.store).concat(leaks(before.store, back.store)) };
    }
    const ok = opened && Object.values(changed).every((c) => c.moved !== false && c.back && c.rect && c.store.length === 0);
    // the picture: three switches off (left off for the frame only; the next screen starts on a fresh Desk)
    for (const k of ['flutter', 'pull', 'tabs']) await app.evalJs(`document.querySelector('.arbor2-mood-switch[data-mood="${k}"]')?.click()`);
    await sleep(200);
    // the job keeps 300 characters of an error: only the failing switches, with what they measured off and back
    const bad = Object.fromEntries(Object.entries(changed).filter(([, c]) => !(c.moved !== false && c.back && c.rect && c.store.length === 0)));
    if (!ok) throw new Error('MOOD PROOF FAILED ' + JSON.stringify({ opened, bad, room: before.room, was: Object.fromEntries(Object.keys(bad).map((k) => [k, before[k]])) }));
  },
  // item 9: the sage logo on the Desk (night sage / day olive, the o kept brass) - the proof: the drawn picture is the room's copy, and it
  // loads (a real PNG, not a broken image)
  'arbor-logo': async (app) => { await logoAt(app, 'brass'); },
  // ...and with the bar's Logo row on "Sage" (the o recoloured too: Nick's call)
  'arbor-logo-sage': async (app) => { await logoAt(app, 'all'); },
  // §6.2 "Dim the room" (Fable, Oct 29: opacity on the recede hooks, labels >= 4.5:1 dimmed). By night: the hooks at rest sit at .6, every
  // dimmed label's EFFECTIVE contrast (its colour and its ground, both drawn through the opacity onto the room) clears 4.5:1; a drawer open
  // lights its panel and tab and takes the rest to .52; the Mood switch takes that step away; the keyboard reaching a hook lights it; and the
  // writing recede still takes every hook to 0. By day nothing is dimmed. Transitions are held off while measuring (each read is the final
  // value), then given back; the frame is the night room with the Tools drawer open.
  'arbor-dim': async (app) => {
    await page(app, 'arbor-words', WORDS);
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'arbor2-proof-still'; s.textContent = '*, *::before, *::after { transition: none !important; }'; document.head.appendChild(s); if (document.activeElement) document.activeElement.blur(); })()");
    await sleep(300);
    const MEASURE = `(() => {
      const room = document.documentElement.getAttribute('data-arbor2-room');
      const rgb = (s) => { const i = String(s).indexOf('('); if (i < 0) return null; const n = String(s).slice(i + 1, String(s).indexOf(')')).split(',').map((x) => parseFloat(x)); return n.length >= 3 ? n : null; };
      const probe = document.createElement('i'); probe.style.color = getComputedStyle(document.documentElement).getPropertyValue('--ink-950').trim(); document.body.appendChild(probe);
      const G = rgb(getComputedStyle(probe).color); probe.remove();
      const lin = (c) => { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
      const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const mix = (c, a) => [0, 1, 2].map((i) => a * c[i] + (1 - a) * G[i]);
      const shown = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const HOOK = '.chrome-fade, .desk-dissolve, .mode-dissolve, .wz-sliver-grip, .wz-tutor-grip';
      const hooks = [...document.querySelectorAll(HOOK)].filter((h) => shown(h) && !h.parentElement.closest('.chrome-fade, .desk-dissolve, .mode-dissolve'));
      const row = (h) => {
        const op = parseFloat(getComputedStyle(h).opacity);
        let minCr = null, worst = null;
        for (const el of [h, ...h.querySelectorAll('*')]) {
          if (!shown(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
          let a = 1; for (let e = el; e; e = e.parentElement) a *= parseFloat(getComputedStyle(e).opacity);
          const fg = rgb(getComputedStyle(el).color);
          let B = null; for (let e = el; e && !B; e = e === h ? null : e.parentElement) { const b = rgb(getComputedStyle(e).backgroundColor); if (b && (b.length < 4 || b[3] === 1)) B = b; }
          const fa = fg.length > 3 ? fg[3] : 1;
          const bgE = B ? mix(B, a) : G, fgE = [0, 1, 2].map((i) => fa * a * fg[i] + (1 - fa * a) * bgE[i]);
          const c = cr(fgE, bgE);
          if (minCr === null || c < minCr) { minCr = c; worst = (el.textContent || '').trim().slice(0, 16); }
        }
        return { cls: String(h.className).split(' ').slice(0, 2).join('.'), op, minCr: minCr === null ? null : +minCr.toFixed(2), worst };
      };
      return { room, writing: document.documentElement.getAttribute('data-wz-writing'), rows: hooks.map(row),
        panel: (() => { const p = document.querySelector('.wz-sliver-panel'); return p ? parseFloat(getComputedStyle(p).opacity) : null; })(),
        grip: (() => { const g = document.querySelector('.wz-sliver-grip'); return g ? parseFloat(getComputedStyle(g).opacity) : null; })(),
        rect: (() => { const p = document.querySelector('.mode-page'); return p ? JSON.stringify(p.getBoundingClientRect()) : null; })() };
    })()`;
    const near = (x, y) => Math.abs(x - y) <= 0.011;
    const rest = await app.evalJs(MEASURE);
    const night = rest.room === 'night';
    const others = (m) => m.rows.filter((r) => r.cls.indexOf('wz-sliver-grip') < 0);
    const labelsOk = (m) => m.rows.every((r) => r.minCr === null || r.minCr >= 4.5);
    const v = {};
    v.rest = night ? rest.rows.length > 0 && rest.rows.every((r) => near(r.op, 0.6)) && labelsOk(rest) : rest.rows.every((r) => r.op === 1);
    await clickSel(app, '.wz-sliver-grip');
    await sleep(500);
    const open = await app.evalJs(MEASURE);
    v.drawer = night ? open.panel === 1 && open.grip === 1 && others(open).length > 0 && others(open).every((r) => near(r.op, 0.52)) && labelsOk(open) && open.rect === rest.rect : true;
    await clickText(app, '.arbor2-bar-head', 'Mood ▸');
    await sleep(150);
    await app.evalJs(`document.querySelector('.arbor2-mood-switch[data-mood="dim"]')?.click()`);
    await sleep(200);
    const noStep = await app.evalJs(MEASURE);
    v.moodOff = night ? others(noStep).every((r) => near(r.op, 0.6)) : true;
    await app.evalJs(`document.querySelector('.arbor2-mood-switch[data-mood="dim"]')?.click()`);
    await clickText(app, '.arbor2-bar-head', 'Mood ▾');
    await clickSel(app, '.wz-sliver-grip');
    await sleep(400);
    // the keyboard reaches the rail: it is lit
    await app.evalJs("(() => { const b = document.querySelector('.desk-rail a, .desk-rail button, .desk-frame-strip a, .desk-frame-strip button'); if (b) b.focus(); return !!b; })()");
    await sleep(200);
    const reach = await app.evalJs(`(() => { const a = document.activeElement; const h = a && a.closest('.chrome-fade, .desk-dissolve'); return h ? parseFloat(getComputedStyle(h).opacity) : null; })()`);
    v.reach = night ? reach === 1 : true;
    // writing: every hook goes to 0 (the recede, untouched)
    await app.evalJs(`document.querySelector('${ED}').focus()`);
    await app.typeKeys(' and the light moved');
    await sleep(200);
    const w = await app.evalJs(MEASURE);
    v.writing = w.writing === 'true' && w.rows.filter((r) => r.cls.indexOf('grip') < 0).every((r) => r.op === 0);
    // the frame: the night room with the Tools drawer open (transitions back on)
    await app.evalJs("document.getElementById('arbor2-proof-still')?.remove(); document.activeElement && document.activeElement.blur()");
    await sleep(2500);
    await clickSel(app, '.wz-sliver-grip');
    await sleep(900);
    const ok = Object.values(v).every(Boolean);
    if (!ok) {
      const bad = Object.keys(v).filter((k) => !v[k]);
      const pick = { rest, drawer: open, moodOff: noStep, writing: w };
      throw new Error('DIM PROOF FAILED ' + JSON.stringify({ bad, reach, rows: bad.filter((k) => pick[k]).map((k) => pick[k].rows.map((r) => [r.cls, r.op, r.minCr, r.worst])) }).slice(0, 280));
    }
  },
};
