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
// Run in the page as `(${zoomProof})(${holeOf})`.
//   VISIBLE the page's box cut to its column, to the viewport, and to the top of the stage's progress row
//   PAPER   an opaque sheet in the page's paper colour exactly over VISIBLE (so it covers the whole page, and never the progress row)
//   VIGNETTE the room's vignette (body::after) has an evenodd hole covering VISIBLE (it greyed the night paper's ends)
//   HOLE    by day, the sun layer's evenodd clip has a hole covering VISIBLE
export function zoomProof(holeOf) {
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

export default {
  // the proof above, on a zoomed Free Write page with words (the picture is the same as arbor-page; the row FAILS if the proof does)
  'arbor-proof-zoom': async (app) => {
    await page(app, 'arbor-words', WORDS);
    await waitSoft(app, "!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'typewriter zoom', timeout: 4000 });
    await sleep(600);
    const r = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()})`);
    // the job keeps 300 characters of an error: the verdicts and the clips it read come first
    if (!r || !r.pass) throw new Error('ZOOM PROOF FAILED ' + JSON.stringify(r && { paper: r.paper, vignette: r.vignette, hole: r.hole, room: r.room, sClip: r.sClip, vClip: r.vClip, vis: r.vis, why: r.why }));
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
};
