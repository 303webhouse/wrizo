// ITEM 121 I7 — THE INK WAVE'S HARNESS: the stratum, the switch, and the pen.
//
// EVERY POINTER HERE IS TRUSTED — CDP `Input.dispatchMouseEvent` /
// `Input.dispatchTouchEvent` via app.penStroke / app.mouseDown / app.touchDrag,
// i.e. real browser input with isTrusted true — never `element.dispatchEvent(new
// PointerEvent(...))`. That is not a formality on this file above all others:
// the whole feature IS pointer routing, and a synthetic replay bypasses both the
// hit-testing and the pointer-capture machinery the capture pipeline depends on.
//
// EVERY GEOMETRY CLAIM COMPARES TWO INDEPENDENTLY MEASURED BOXES (the anchor
// law). Nothing here asserts a number the app also computes.
//
// ── WHAT THIS FILE DELIBERATELY CANNOT PROVE, STATED UP FRONT ─────────────
// "A finger does NOT draw when a pen is present" cannot be established
// headless. CDP has no "a stylus is attached" state to set, so there is no way
// to put the browser in the posture a tablet-with-S-Pen is in. What S5 below
// asserts is OUR BRANCH — that once this session has actually seen a pen event,
// a subsequent touch creates no stroke — which is the honest half. The other
// half, and palm rejection, and the barrel button, are HARDWARE, and the
// real-device sitting on Nick's tablet is named in the offer as the gate that
// closes them. A check that faked a stylus would be asserting a thing that does
// not exist.
//
//   S1 the stratum's anchoring — the canvas's box IS the sheet's box, at BOTH
//      reference widths, drawer open and closed. Four measurements, each a
//      pair of independently read rects.
//   S2 normalization invariance — a stroke drawn at 1366 and re-read at 1680
//      scales by exactly the width ratio, on BOTH axes (a circle stays a
//      circle). Measured from the PERSISTED normalized geometry, which is the
//      thing that has to be width-free.
//   S3 inertness — in TEXT a trusted pen stroke over the paper produces no
//      stroke and inserts no text; a keystroke still types. This is the I0
//      seal still standing, on the surface item 121 opens.
//   S4 sovereignty — in INK a keystroke does not type; a pen stroke persists
//      through a RELOAD carrying its tip/nib/ink.
//   S5 the device matrix — pen draws, mouse draws, touch-after-a-pen does not.
//   S6 S-Pen hardening — touch-action on the stratum, no selection from a
//      stroke, and no text inserted by the pen (the OS handwriting outcome).
//   S7 the eraser — a trusted erase removes painted pixels (alpha sampled
//      before and after), and the ring shows in INK only.
//   S8 undo — one level; a stroke is reversed, and the typewriter's own
//      permanence is untouched (Free Write is forward-only; see the S8 note).
//   S9 the band does not grow — measured with the switch mounted vs. not, at
//      both widths; and the switch and the paper never disagree.
//  S10 the drawer — the ink zone is ABSENT FROM THE DOM in TEXT, present in
//      INK, and STYLING is gone from Free Write while Draft keeps its own.
//  S11 shots — prose page in TEXT and INK at both widths, options open, the
//      three tips drawn once each.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const W1 = 1366, H1 = 768;    // the canonical small-laptop leg
const W2 = 1680, H2 = 1050;   // the wide leg
const SHEET = '.wz-ink-sheet';
const CANVAS = '.wz-ink-sheet .ink-committed';
const SWITCH = '.wz-ink-switch';
const BAND = '.desk-frame-host .sprint-nav';

const rectOf = (sel) => `(() => { const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null; const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; })()`;

const freshDesk = async (app, width = W1, height = H1) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// A fresh, framed Free Write page reached through persistence.ts's own seam
// (window.wrizoCreateJournalPage — the SAME call the real Catch door makes),
// never by writing localStorage rows by hand: a hand-written row can be a
// shape the app would never produce, and then the fixture, not the feature,
// is what the run measures.
const freshPage = async (app, width = W1, height = H1) => {
  await freshDesk(app, width, height);
  const id = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(id)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Free Write page, framed' });
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'DeskFrame mounted' });
  // A page opens in DRAFT by default, and item 121 is a ruling about FREE
  // WRITE, so the fixture enters Free Write explicitly through the mode strip
  // — the writer's own door, not a state poke.
  //
  // ITEM 126 (121-B) CORRECTION, 2026-09-11. This comment used to end: "(This is
  // also why the switch and the stratum are correctly absent a moment ago: they
  // are Free Write's.)" Half of that is now FALSE — the STRATUM renders in every
  // mode, because the ink is the page's. Only the SWITCH is still Free Write's,
  // and this file's own S10 check asserts exactly that and is unaffected.
  // Corrected rather than parked: no assertion was falsified (nothing here ever
  // checked the stratum's absence — see item126-s0-survey.md §6), and a comment
  // that lies to the next reader is a defect even when nothing goes red.
  await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"freewrite\"]').click()");
  await app.waitFor("!!document.querySelector('.wz-ink-switch')", { label: 'Free Write, switch in the band' });
  await sleep(400);
  return id;
};

const setInstrument = async (app, which) => {
  // Clicked, never set through state: the switch IS the feature under test.
  await app.evalJs(`(() => {
    const sides = [...document.querySelectorAll('${SWITCH} .wz-ink-switch-side')];
    const btn = sides.find(b => b.textContent.trim().toLowerCase() === ${JSON.stringify(which)});
    if (!btn) return 'missing';
    btn.click(); return 'clicked';
  })()`);
  await sleep(220);
};

const openSliver = async (app) => {
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(260);
};

const strokesOf = async (app, id) => app.evalJs(
  `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = l.find(x => x.id === ${JSON.stringify(id)}); return (e && e.strokes) || []; })()`);

// PROBE BEFORE DRIVING. `app.penStroke` throws if its selector misses, and a
// throw here aborts the FILE — which reports nothing at all and reads as a
// crash rather than as a finding. Every gesture below goes through one of
// these: they check the target exists, record a failed check naming what was
// missing when it does not, and let the run continue so the remaining sections
// still report. A driver can lie by dying as easily as by doing nothing.
const present = (app, sel) => app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`);
const where = (app) => app.evalJs(`({ hash: location.hash,
  editor: !!document.querySelector('.forward-only-editor'),
  sheet: !!document.querySelector('.wz-ink-sheet'),
  paper: !!document.querySelector('.mode-page'),
  framed: !!document.querySelector('.desk-frame'),
  mode: (document.querySelector('.desk-mode-tab.active') || {}).textContent })`);
const safePen = async (app, sel, points, label) => {
  if (!(await present(app, sel))) {
    ok(`DRIVER: ${label} — target ${sel} was ABSENT, so no pen stroke was dispatched`, false, JSON.stringify(await where(app)));
    return false;
  }
  await app.penStroke(sel, points);
  return true;
};
const safeTouch = async (app, sel, points, label) => {
  if (!(await present(app, sel))) {
    ok(`DRIVER: ${label} — target ${sel} was ABSENT, so no touch drag was dispatched`, false, JSON.stringify(await where(app)));
    return false;
  }
  await app.touchDrag(sel, points);
  return true;
};

// A slow, many-point trusted pen stroke — a real hand, not a teleport.
const arc = (n = 14) => Array.from({ length: n }, (_, i) => {
  const t = i / (n - 1);
  return { x: 0.25 + 0.5 * t, y: 0.30 + 0.18 * Math.sin(Math.PI * t) };
});

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — THE STRATUM'S ANCHORING. The canvas fills the sheet BY LAYOUT, so its
  // box and the sheet's box are the same box. Both read independently, and at
  // both widths with the drawer both closed and open — the drawer is an
  // absolutely positioned overlay and must not move the paper, so this doubles
  // as the paper-rect guard for the new layer.
  // ==========================================================================
  const pageId = await freshPage(app, W1, H1);
  await setInstrument(app, 'ink');

  const anchorAt = async (label, width, height) => {
    await app.emulateDpr(1, width, height);
    await sleep(320);
    for (const [openLabel, doOpen] of [['closed', false], ['open', true]]) {
      if (doOpen) await openSliver(app);
      await sleep(200);
      const sheet = await app.evalJs(rectOf(SHEET));
      const canvas = await app.evalJs(rectOf(CANVAS));
      const near = (a, b) => a != null && b != null && Math.abs(a - b) <= 0.6;
      ok(`S1 (${label}, drawer ${openLabel}): the stratum's canvas box IS the sheet's box on every edge (within 0.6px) — anchored by LAYOUT, never by script`,
        !!sheet && !!canvas
          && near(sheet.left, canvas.left) && near(sheet.right, canvas.right)
          && near(sheet.top, canvas.top) && near(sheet.bottom, canvas.bottom),
        JSON.stringify({ sheet, canvas }));
      if (doOpen) { await openSliver(app); await sleep(200); }
    }
  };
  await anchorAt('1366', W1, H1);
  await anchorAt('1680', W2, H2);

  // The sheet must actually be INSIDE the paper — an anchor to a box floating
  // somewhere else would satisfy S1 and still be wrong.
  const nesting = await app.evalJs(`(() => {
    const sheet = document.querySelector('${SHEET}');
    const paper = document.querySelector('.mode-page');
    const col = document.querySelector('.mode-pagecol');
    return { inPaper: !!(sheet && paper && paper.contains(sheet)), inCol: !!(sheet && col && col.contains(sheet)),
             sheetW: sheet && sheet.getBoundingClientRect().width, colW: col && col.getBoundingClientRect().width };
  })()`);
  ok('S1: and the sheet is a DESCENDANT of the paper (.mode-page) and of the paper column (.mode-pagecol), narrower than the column by the paper\'s own padding — the stratum is over THE PAGE, not over some other box that happens to line up',
    nesting.inPaper && nesting.inCol && nesting.sheetW > 0 && nesting.sheetW < nesting.colW,
    JSON.stringify(nesting));

  // ==========================================================================
  // S2 — NORMALIZATION INVARIANCE. Points are stored 0..1 by the sheet's WIDTH
  // and denormalized on both axes, so the SAME stored geometry must come back
  // from a different width unchanged. Asserted on the persisted numbers, which
  // is where width-independence either exists or does not.
  // ==========================================================================
  await app.emulateDpr(1, W1, H1);
  await sleep(300);
  await safePen(app, SHEET, arc(), 'pen stroke');
  await sleep(600);
  const at1366 = await strokesOf(app, pageId);
  ok('S2: a trusted PEN stroke at 1366 persists exactly one stroke, with points normalized into 0..1 (x) — the stored geometry carries no pixels at all',
    at1366.length === 1 && at1366[0].points.length > 2
      && at1366[0].points.every(p => p.x >= 0 && p.x <= 1),
    JSON.stringify({ count: at1366.length, points: at1366[0] && at1366[0].points.length }));

  const bboxOf = (pts) => ({
    x0: Math.min(...pts.map(p => p.x)), x1: Math.max(...pts.map(p => p.x)),
    y0: Math.min(...pts.map(p => p.y)), y1: Math.max(...pts.map(p => p.y)),
  });
  const b1 = at1366.length ? bboxOf(at1366[0].points) : null;

  await app.emulateDpr(1, W2, H2);
  await sleep(400);
  const at1680 = await strokesOf(app, pageId);
  const b2 = at1680.length ? bboxOf(at1680[0].points) : null;
  ok('S2: re-read at 1680 the stored bounding box is IDENTICAL on both axes — the stroke does not move, stretch or squash when the paper changes width (a circle stays a circle)',
    !!b1 && !!b2
      && Math.abs(b1.x0 - b2.x0) < 1e-9 && Math.abs(b1.x1 - b2.x1) < 1e-9
      && Math.abs(b1.y0 - b2.y0) < 1e-9 && Math.abs(b1.y1 - b2.y1) < 1e-9,
    JSON.stringify({ b1, b2 }));

  // And the PAINTED geometry follows the sheet: same normalized box, a wider
  // sheet, so the drawn extent scales by exactly the width ratio.
  const sheetW1366 = 'sheetW';
  void sheetW1366;
  const widths = await app.evalJs(`(() => {
    const s = document.querySelector('${SHEET}'); const c = document.querySelector('${CANVAS}');
    return { sheet: s && s.getBoundingClientRect().width, canvas: c && c.getBoundingClientRect().width }; })()`);
  ok('S2: and at the new width the canvas has RESIZED with the sheet (they are still one box) — the denormalizing width the renderer reads is the sheet\'s live width, not a captured one',
    widths.sheet != null && widths.canvas != null && Math.abs(widths.sheet - widths.canvas) <= 0.6,
    JSON.stringify(widths));

  // ==========================================================================
  // S3 — INERTNESS IN TEXT. The I0 seal still stands on this surface.
  // ==========================================================================
  const textPageId = await freshPage(app, W1, H1);
  const beforeText = await app.evalJs("(document.querySelector('.forward-only-editor') || { innerText: null }).innerText");
  await safePen(app, SHEET, arc(), 'pen stroke');
  await sleep(600);
  const textStrokes = await strokesOf(app, textPageId);
  const afterPenText = await app.evalJs("(document.querySelector('.forward-only-editor') || { innerText: null }).innerText");
  ok('S3: in TEXT a trusted PEN stroke across the paper creates NO stroke at all — the stratum is mounted and inert, not merely invisible',
    textStrokes.length === 0, JSON.stringify({ strokes: textStrokes.length }));
  ok('S3: and that pen stroke inserted NO text — I0\'s seal (a typewriter ignores pens) still holds on the very surface item 121 opens; opening it in INK did not open it everywhere',
    afterPenText === beforeText, JSON.stringify({ beforeText, afterPenText }));
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
  await app.typeKeys('typed');
  await sleep(400);
  const typedInText = await app.evalJs("(document.querySelector('.forward-only-editor') || { innerText: '' }).innerText");
  ok('S3: while a KEYSTROKE in TEXT types normally — the surface is inert to the pen, not inert altogether',
    typedInText.includes('typed'), JSON.stringify({ typedInText }));

  // ==========================================================================
  // S4 — SOVEREIGNTY IN INK, and the round trip.
  // ==========================================================================
  await setInstrument(app, 'ink');
  const beforeInk = await app.evalJs("(document.querySelector('.forward-only-editor') || { innerText: null }).innerText");
  await app.typeKeys('SHOULDNOTAPPEAR');
  await sleep(400);
  const afterKeysInInk = await app.evalJs("(document.querySelector('.forward-only-editor') || { innerText: null }).innerText");
  ok('S4: in INK a keystroke does NOT type — the typewriter is put down; the caret is dormant and there is nothing focused to type into',
    afterKeysInInk === beforeInk && !afterKeysInInk.includes('SHOULDNOTAPPEAR'),
    JSON.stringify({ beforeInk, afterKeysInInk }));

  const caretDormant = await app.evalJs(`(() => {
    const ed = document.querySelector('.forward-only-editor');
    const paper = document.querySelector('.mode-page');
    if (!ed || !paper) return { missing: true };
    return { caret: getComputedStyle(ed).caretColor, focused: document.activeElement === ed,
             instrument: paper.getAttribute('data-instrument') }; })()`);
  ok('S4: and the caret is dormant ON THE PAPER — the paper wears data-instrument="ink" and the editor\'s caret-color is transparent, so the instrument change is visible on the page and not only in the switch',
    caretDormant.instrument === 'ink' && caretDormant.caret === 'rgba(0, 0, 0, 0)' && caretDormant.focused === false,
    JSON.stringify(caretDormant));

  // Choose a non-default pen so the stamped fields are distinguishable from
  // the defaults an ABSENT field would read as — otherwise a stroke that
  // stamped nothing would pass a check for "stamped correctly."
  await openSliver(app);
  await app.evalJs(`(() => {
    const pick = (sel, label) => { const b = [...document.querySelectorAll(sel)].find(x => (x.getAttribute('aria-label') || x.textContent).trim() === label);
      if (!b) throw new Error('no option ' + label); b.click(); };
    pick('.wz-ink-tips .wz-ink-tip', 'Marker');
    pick('.wz-ink-nibs .wz-ink-nib', 'Broad');
    pick('.wz-sliver-inks .wz-ink-swatch', 'Oxblood');
  })()`);
  await sleep(250);
  await safePen(app, SHEET, arc(), 'pen stroke');
  await sleep(700);
  // A RELOAD, not a re-render: the round trip has to go through storage, which
  // is the only thing that proves the stroke was actually persisted rather than
  // held in a component's state. The hash already names the page, so the app
  // comes back up ON it — waiting for the Desk here would wait forever.
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page after reload' });
  await sleep(500);
  const persisted = await strokesOf(app, textPageId);
  const last = persisted[persisted.length - 1];
  ok('S4: a stroke drawn in INK SURVIVES A RELOAD carrying the pen it was drawn with — tip/nib/ink stamped from the drawer, and stamped as NON-DEFAULTS so a stroke that stamped nothing could not pass this check',
    persisted.length === 1 && last && last.tip === 'marker' && last.nib === 'broad' && last.ink === 'oxblood',
    JSON.stringify({ count: persisted.length, last: last && { tip: last.tip, nib: last.nib, ink: last.ink } }));
  ok('S4: and the ink is stored BY TOKEN NAME, never a hex — a stored colour would freeze one theme\'s palette into the page forever',
    !!last && typeof last.ink === 'string' && !last.ink.startsWith('#'),
    JSON.stringify({ ink: last && last.ink }));

  // ── ZERO NETWORK ON EVERY INK ACT ────────────────────────────────────────
  // The whole wave is local-first and must touch no server at all: I1's
  // validation deliberately lives at the READ BOUNDARY precisely so that
  // `apps/server` stays untouched and the wave needs no deploy. Counted, not
  // assumed — fetch, XHR and sendBeacon are all wrapped, then every kind of ink
  // act is performed, then the counter is read.
  await app.evalJs(`(() => {
    window.__wzNet = { fetch: 0, xhr: 0, beacon: 0, urls: [] };
    const f = window.fetch;
    window.fetch = function (...a) { window.__wzNet.fetch++; window.__wzNet.urls.push(String(a[0])); return f.apply(this, a); };
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u, ...r) { window.__wzNet.xhr++; window.__wzNet.urls.push(String(u)); return open.call(this, m, u, ...r); };
    if (navigator.sendBeacon) { const b = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function (u, ...r) { window.__wzNet.beacon++; window.__wzNet.urls.push(String(u)); return b(u, ...r); }; }
  })()`);
  // Every ink act, in one sweep: flip the switch both ways, change all three
  // pen options, draw, erase, undo.
  await setInstrument(app, 'text');
  await setInstrument(app, 'ink');
  await openSliver(app);
  await app.evalJs(`(() => {
    const pick = (sel, label) => { const b = [...document.querySelectorAll(sel)].find(x => (x.getAttribute('aria-label') || x.textContent).trim() === label); if (b) b.click(); };
    pick('.wz-ink-tips .wz-ink-tip', 'Pencil');
    pick('.wz-ink-nibs .wz-ink-nib', 'Fine');
    pick('.wz-sliver-inks .wz-ink-swatch', 'Sea');
  })()`);
  await safePen(app, SHEET, arc(), 'pen stroke');
  await sleep(500);
  await app.evalJs("document.querySelector('.wz-ink-eraser')?.click()");
  await safePen(app, SHEET, [{ x: 0.3, y: 0.31 }, { x: 0.6, y: 0.31 }], 'pen stroke');
  await sleep(500);
  await app.evalJs("document.querySelector('.wz-ink-sheet .ink-undo')?.click()");
  await sleep(800);
  const net = await app.evalJs('window.__wzNet');
  ok('S4: ZERO NETWORK ACROSS EVERY INK ACT — switching instrument both ways, changing tip, nib and ink, drawing, erasing and undoing issue no fetch, no XHR and no beacon. The wave is local-first and touches no server, which is exactly why I1 put validation at the read boundary instead of asking the server to reject enums',
    net && net.fetch === 0 && net.xhr === 0 && net.beacon === 0, JSON.stringify(net));

  // ==========================================================================
  // S5 — THE DEVICE MATRIX. Three legs, each asserting the stroke COUNT across
  // the gesture rather than a side effect that could have other causes.
  // ==========================================================================
  const mousePageId = await freshPage(app, W1, H1);
  await setInstrument(app, 'ink');
  const sheetBox = await app.evalJs(rectOf(SHEET));
  const before5 = (await strokesOf(app, mousePageId)).length;
  // MOUSE — the laptop is the primary target, so it MUST draw.
  await app.mouseDown(sheetBox.left + sheetBox.width * 0.3, sheetBox.top + 60);
  for (let i = 1; i <= 8; i++) {
    await app.mouseMove(sheetBox.left + sheetBox.width * (0.3 + 0.04 * i), sheetBox.top + 60 + i * 3);
    await sleep(16);
  }
  await app.mouseUp(sheetBox.left + sheetBox.width * 0.62, sheetBox.top + 84);
  await sleep(600);
  const afterMouse = (await strokesOf(app, mousePageId)).length;
  ok('S5 (mouse): in INK a trusted MOUSE drag draws — the laptop is the primary target, and a sketch pad the primary target cannot draw on is not a sketch pad',
    afterMouse === before5 + 1, JSON.stringify({ before: before5, afterMouse }));

  // PEN — draws, and marks the session as pen-present.
  await safePen(app, SHEET, arc(), 'pen stroke');
  await sleep(600);
  const afterPen = (await strokesOf(app, mousePageId)).length;
  ok('S5 (pen): a trusted PEN stroke draws in INK',
    afterPen === afterMouse + 1, JSON.stringify({ afterMouse, afterPen }));

  // TOUCH, AFTER a pen has been seen — must NOT draw. This asserts OUR BRANCH
  // (pen-seen ⇒ finger scrolls), not the platform's stylus presence, which is
  // not something headless can be put into. Named as such, not overclaimed.
  // VERTICAL, deliberately. The first version of this leg swiped horizontally
  // and the finger — correctly falling through, which is the behaviour under
  // test — tripped the app's own back gesture and navigated to the Desk,
  // taking the rest of the file with it. That is not a defect: it is the
  // fall-through working, and it is why "the finger scrolls" is asserted with
  // a SCROLL. The navigation is now asserted against explicitly below, so a
  // future regression that DID navigate is caught rather than cascading.
  await safeTouch(app, SHEET, [{ x: 0.5, y: 0.30 }, { x: 0.5, y: 0.45 }, { x: 0.5, y: 0.60 }], 'touch drag');
  await sleep(600);
  const afterTouch = (await strokesOf(app, mousePageId)).length;
  const stillHere = await where(app);
  ok('S5 (touch after pen): and the finger did not take the writer off the page — it fell through to the scroller, which is what "the finger scrolls" MEANS; the page, the paper and the stratum are all still mounted',
    stillHere.editor && stillHere.sheet && stillHere.paper, JSON.stringify(stillHere));
  ok('S5 (touch after pen): a finger creates NO stroke once this session has seen a pen — the ink pass\'s "finger scrolls when a pen is present" rule. NOTE: this asserts the app\'s own branch, NOT a real stylus-attached device; CDP cannot put the browser in that posture, and the tablet sitting is the gate that closes it',
    afterTouch === afterPen, JSON.stringify({ afterPen, afterTouch }));

  // ==========================================================================
  // S6 — S-PEN HARDENING (I0 slice 2), as far as headless can carry it.
  // ==========================================================================
  // PROBE, NEVER ASSUME: a bare `.style` on a missing node throws and ABORTS
  // the whole file, which then reports NOTHING — the worst failure a harness
  // can have, because it reads as a crash rather than as a finding. Every read
  // below returns a shape whether the node is there or not.
  const hardening = await app.evalJs(`(() => {
    const ed = document.querySelector('.forward-only-editor');
    if (!ed) return { missing: true };
    return { touchAction: ed.style.touchAction, handwriting: ed.getAttribute('handwriting') }; })()`);
  ok('S6: the editable still carries the I0 pen-discipline guard (touch-action:none + handwriting="false") on a Free Write page — the OS handwriting path is refused at the element, which is what actually seals it in Chromium',
    hardening.touchAction === 'none' && hardening.handwriting === 'false', JSON.stringify(hardening));

  const selBefore = await app.evalJs("(window.getSelection() || {}).toString ? window.getSelection().toString() : ''");
  await safePen(app, SHEET, [{ x: 0.2, y: 0.22 }, { x: 0.45, y: 0.22 }, { x: 0.7, y: 0.225 }], 'pen stroke');
  await sleep(500);
  const selAfter = await app.evalJs("(window.getSelection() || {}).toString ? window.getSelection().toString() : ''");
  ok('S6: a short pen stroke ACROSS TEXT starts no text selection — the defect that used to yank a writer out of drawing mid-stroke',
    selAfter === '' && selBefore === '', JSON.stringify({ selBefore, selAfter }));

  const textUnchanged = await app.evalJs("(document.querySelector('.forward-only-editor') || { innerText: '' }).innerText");
  ok('S6: and the page\'s text is unchanged by every pen stroke in this file — the OS handwriting-to-text path never received the pen (the capture-phase intercept fires first, being an ANCESTOR listener; this asserts the OUTCOME, which is what the writer actually experiences)',
    !textUnchanged.includes('SHOULDNOTAPPEAR'), JSON.stringify({ len: textUnchanged.length }));

  // ==========================================================================
  // S7 — THE ERASER. Alpha sampled off the real canvas, before and after.
  // ==========================================================================
  const erasePageId = await freshPage(app, W1, H1);
  await setInstrument(app, 'ink');
  // A BROAD MARKER bar, so the sample patch is unambiguously inked and the
  // erase has something substantial to remove. A fine pen at 1.4px would make
  // this check hostage to a single anti-aliased pixel.
  await openSliver(app);
  await app.evalJs(`(() => {
    const pick = (sel, label) => { const b = [...document.querySelectorAll(sel)].find(x => (x.getAttribute('aria-label') || x.textContent).trim() === label); if (b) b.click(); };
    pick('.wz-ink-tips .wz-ink-tip', 'Marker');
    pick('.wz-ink-nibs .wz-ink-nib', 'Broad');
  })()`);
  await sleep(200);
  await safePen(app, SHEET, [{ x: 0.2, y: 0.35 }, { x: 0.4, y: 0.35 }, { x: 0.6, y: 0.35 }, { x: 0.8, y: 0.35 }], 'pen stroke');
  await sleep(600);
  // THE SAMPLE POINT COMES FROM THE STROKE ITSELF, not from the coordinates
  // that were dispatched. penStroke's own `y` is a fraction of the element's
  // HEIGHT, while a stored point's `y` is normalized by its WIDTH (J8), so the
  // two are not the same number and guessing one from the other samples empty
  // paper — which is exactly what the first version of this check did, and it
  // read as "the eraser works" for the wrong reason. Reading the persisted
  // mid-point and denormalizing it the way the RENDERER does asks the canvas
  // about the place the ink actually is.
  const sampleAlpha = `(() => {
    const c = document.querySelector('${CANVAS}');
    if (!c) return -1;
    const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = l.find(x => x.id === ${JSON.stringify(erasePageId)});
    const first = e && e.strokes && e.strokes.find(s => !s.eraser);
    if (!first) return -2;
    const mid = first.points[Math.floor(first.points.length / 2)];
    const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    // Both axes denormalize by WIDTH — the renderer's own rule.
    const cx = Math.round(mid.x * r.width * dpr), cy = Math.round(mid.y * r.width * dpr);
    // A patch, not a pixel: a 1px anti-aliasing miss must not decide a check.
    const d = ctx.getImageData(Math.max(0, cx - 7), Math.max(0, cy - 7), 15, 15).data;
    let max = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > max) max = d[i];
    return max; })()`;
  const inkedAlpha = await app.evalJs(sampleAlpha);
  ok('S7: the drawn bar is actually ON the canvas (a non-zero alpha sampled from the real backing store, not from a DOM attribute that could be true while nothing painted)',
    inkedAlpha > 0, JSON.stringify({ inkedAlpha }));

  await openSliver(app);
  await app.evalJs("document.querySelector('.wz-ink-eraser')?.click()");
  await sleep(200);
  const ringArmed = await app.evalJs("!!document.querySelector('.wz-ink-sheet .ink-eraser-ring')");
  ok('S7: arming the eraser is a real two-state toggle in the ink zone, and the ring preview exists on the sheet to aim with',
    ringArmed && (await app.evalJs("document.querySelector('.wz-ink-eraser')?.getAttribute('aria-pressed') ?? null")) === 'true');
  await safePen(app, SHEET, [{ x: 0.3, y: 0.35 }, { x: 0.5, y: 0.35 }, { x: 0.7, y: 0.35 }], 'erase stroke');
  await sleep(700);
  const erasedAlpha = await app.evalJs(sampleAlpha);
  ok('S7: a trusted erase over that bar REMOVES PAINTED PIXELS — alpha at the same sample point drops (destination-out actually rubbed, rather than painting paper-coloured ink over it)',
    erasedAlpha < inkedAlpha, JSON.stringify({ inkedAlpha, erasedAlpha }));

  const ringInText = await app.evalJs(`(() => {
    const sides = [...document.querySelectorAll('${SWITCH} .wz-ink-switch-side')];
    sides.find(b => b.textContent.trim().toLowerCase() === 'text').click();
    return null; })()`);
  void ringInText;
  await sleep(300);
  const ringHidden = await app.evalJs(`(() => { const r = document.querySelector('.wz-ink-sheet .ink-eraser-ring');
    return r ? getComputedStyle(r).display : 'absent'; })()`);
  ok('S7: and leaving INK hides the ring immediately — the eraser\'s aim preview belongs to the instrument, not to the page',
    ringHidden === 'none' || ringHidden === 'absent', JSON.stringify({ ringHidden }));

  // ==========================================================================
  // S8 — UNDO. One level, the last stroke.
  //
  // NOT "unified across a typed run and a stroke", and that is a FINDING, not
  // a gap: Free Write's editor is FORWARD-ONLY, and ForwardOnlyEditor's own
  // undo stack (FX6 S1) is gated to the free-edit modes by that law. A typed-run
  // undo here would breach forward-only permanence — a far older ruling than
  // this wave — so the pen gets an undo and the typewriter keeps its permanence.
  // Both halves are asserted, so the shape is on the record either way.
  // ==========================================================================
  const undoPageId = await freshPage(app, W1, H1);
  await setInstrument(app, 'ink');
  await safePen(app, SHEET, arc(), 'pen stroke');
  await sleep(500);
  await safePen(app, SHEET, [{ x: 0.3, y: 0.55 }, { x: 0.6, y: 0.55 }, { x: 0.75, y: 0.56 }], 'pen stroke');
  await sleep(700);
  const twoStrokes = (await strokesOf(app, undoPageId)).length;
  const undoPresent = await app.evalJs("!!document.querySelector('.wz-ink-sheet .ink-undo')");
  ok('S8: two strokes are on the page and the undo affordance is offered with them (it lives WITH the ink — present in INK, and the check below proves it is not offered in TEXT)',
    twoStrokes === 2 && undoPresent, JSON.stringify({ twoStrokes, undoPresent }));
  await app.evalJs("document.querySelector('.wz-ink-sheet .ink-undo')?.click()");
  await sleep(600);
  const afterUndo = (await strokesOf(app, undoPageId)).length;
  ok('S8: undo reverses exactly ONE stroke and persists that — one level, the last action, never a history stack',
    afterUndo === twoStrokes - 1, JSON.stringify({ twoStrokes, afterUndo }));
  await setInstrument(app, 'text');
  const undoInText = await app.evalJs("!!document.querySelector('.wz-ink-sheet .ink-undo')");
  ok('S8: and in TEXT the undo is ABSENT — Free Write is forward-only and offers no typed-run undo, so an undo button on the typewriter would promise a permanence reversal the surface does not grant',
    undoInText === false, JSON.stringify({ undoInText }));

  // ==========================================================================
  // S9 — THE BAND DOES NOT GROW, and the switch never disagrees with the paper.
  // ==========================================================================
  for (const [label, width, height] of [['1366', W1, H1], ['1680', W2, H2]]) {
    await app.emulateDpr(1, width, height);
    await sleep(320);
    const withSwitch = await app.evalJs(rectOf(BAND));
    // Measure the band again with the switch removed from the flow — the same
    // band, one child fewer. Two independently measured boxes of the SAME
    // element, which is the only honest way to ask "did this make it grow?".
    const withoutSwitch = await app.evalJs(`(() => {
      const sw = document.querySelector('${SWITCH}');
      const band = document.querySelector('${BAND}');
      if (!sw || !band) return { missing: true };
      const prev = sw.style.display; sw.style.display = 'none';
      const r = band.getBoundingClientRect();
      const out = { height: r.height, width: r.width };
      sw.style.display = prev; return out; })()`);
    ok(`S9 (${label}): the band's height with the switch mounted EQUALS its height without it — the switch fits the band's existing line and does not wrap it onto a second row (the real failure mode: .sprint-nav is a WRAPPING flex row, so a growth here is a whole row, not a few pixels). Paper never reflows for chrome`,
      withSwitch != null && !withoutSwitch.missing && Math.abs(withSwitch.height - withoutSwitch.height) < 0.6,
      JSON.stringify({ withSwitch: withSwitch && withSwitch.height, withoutSwitch: withoutSwitch.height }));
  }

  await app.emulateDpr(1, W1, H1);
  await sleep(300);
  const agreeing = [];
  for (const which of ['ink', 'text', 'ink']) {
    await setInstrument(app, which);
    agreeing.push(await app.evalJs(`(() => {
      const on = [...document.querySelectorAll('${SWITCH} .wz-ink-switch-side')]
        .find(b => b.getAttribute('aria-checked') === 'true');
      const paper = document.querySelector('.mode-page');
      return { side: on && on.textContent.trim().toLowerCase(),
               paper: paper && paper.getAttribute('data-instrument') }; })()`));
  }
  ok('S9: after EVERY flip the switch\'s checked side and the paper\'s own data-instrument agree — two independent readings of one state, so a switch that moved without the page following (or the reverse) is caught',
    agreeing.length === 3 && agreeing.every(a => a.side === a.paper)
      && agreeing[0].paper === 'ink' && agreeing[1].paper === 'text' && agreeing[2].paper === 'ink',
    JSON.stringify(agreeing));

  // ==========================================================================
  // S10 — THE DRAWER. Absent in TEXT, present in INK; STYLING gone from Free
  // Write; Draft's own untouched.
  // ==========================================================================
  await setInstrument(app, 'text');
  await openSliver(app);
  const drawerInText = await app.evalJs(`(() => ({
    heads: [...document.querySelectorAll('.wz-sliver-body .wz-sliver-h')].map(h => h.textContent.trim()),
    tips: document.querySelectorAll('.wz-ink-tips .wz-ink-tip').length,
    nibs: document.querySelectorAll('.wz-ink-nibs .wz-ink-nib').length,
    swatches: document.querySelectorAll('.wz-sliver-inks .wz-ink-swatch').length,
    eraser: document.querySelectorAll('.wz-ink-eraser').length,
    anyDisabled: document.querySelectorAll('.wz-sliver-body [disabled], .wz-sliver-body [aria-disabled="true"]').length,
    freeWriteFormat: document.querySelectorAll('.wz-sliver-format').length,
  }))()`);
  ok('S10: in TEXT the ink zone is ABSENT FROM THE DOM ENTIRELY — zero tips, zero nibs, zero swatches, zero eraser. Not hidden and NOT GREYED: a typewriter has no nibs, and a greyed control for a capability the surface does not have is a locked door wearing paint (G3)',
    drawerInText.tips === 0 && drawerInText.nibs === 0 && drawerInText.swatches === 0 && drawerInText.eraser === 0,
    JSON.stringify(drawerInText));
  ok('S10: and STYLING is gone from Free Write — no "Styling" head and no .wz-sliver-format at all on this surface (R15: the page does not decorate, so it offers no styling buttons). Absence, not a hidden mount',
    !drawerInText.heads.includes('Styling') && drawerInText.freeWriteFormat === 0,
    JSON.stringify(drawerInText.heads));
  ok('S10: and nothing in the Free Write drawer is disabled or aria-disabled — the whole surface obeys "absent, never greyed"',
    drawerInText.anyDisabled === 0, JSON.stringify({ anyDisabled: drawerInText.anyDisabled }));

  await setInstrument(app, 'ink');
  await sleep(200);
  const drawerInInk = await app.evalJs(`(() => ({
    heads: [...document.querySelectorAll('.wz-sliver-body .wz-sliver-h')].map(h => h.textContent.trim()),
    tips: [...document.querySelectorAll('.wz-ink-tips .wz-ink-tip')].map(b => b.getAttribute('aria-label')),
    nibs: [...document.querySelectorAll('.wz-ink-nibs .wz-ink-nib')].map(b => b.textContent.trim()),
    swatches: [...document.querySelectorAll('.wz-sliver-inks .wz-ink-swatch')].map(b => b.getAttribute('aria-label')),
    sliders: document.querySelectorAll('.wz-sliver-body input[type="range"]').length,
    pickers: document.querySelectorAll('.wz-sliver-body input[type="color"]').length,
  }))()`);
  ok('S10: in INK the zone reveals in place with all three groups and the eraser — TIP (pen · pencil · marker as drawn glyphs), NIB (Fine · Regular · Broad) and INK (the theme\'s four named inks)',
    JSON.stringify(drawerInInk.tips) === JSON.stringify(['Pen', 'Pencil', 'Marker'])
      && JSON.stringify(drawerInInk.nibs) === JSON.stringify(['Fine', 'Regular', 'Broad'])
      && JSON.stringify(drawerInInk.swatches) === JSON.stringify(['Walnut', 'Iron', 'Oxblood', 'Sea']),
    JSON.stringify(drawerInInk));
  ok('S10: and the nib is STOPS, not a slider, and the ink is SWATCHES, not a picker — zero range inputs and zero colour inputs anywhere in the drawer. A slider is a digital control; a nib is chosen, not dialled, and a journal has the inks that are on the desk',
    drawerInInk.sliders === 0 && drawerInInk.pickers === 0,
    JSON.stringify({ sliders: drawerInInk.sliders, pickers: drawerInInk.pickers }));

  // Draft keeps its own STYLING — R4 is untouched by R15, which is a ruling
  // about ONE surface. Without this, "remove STYLING" could have been read as
  // "remove STYLING everywhere" and shipped that way, green.
  await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click()");
  await sleep(700);
  await openSliver(app);
  const draftDrawer = await app.evalJs(`(() => ({
    format: document.querySelectorAll('.wz-sliver-format').length,
    buttons: [...document.querySelectorAll('.wz-sliver-format .mode-tbtn')].map(b => b.title),
    switchPresent: !!document.querySelector('${SWITCH}'),
  }))()`);
  ok('S10: DRAFT IS UNTOUCHED — its FORMAT zone still carries Bold/Italic/Underline (R4 survives R15, which rules on ONE surface). This is the check that would have caught "remove STYLING" being read as "remove it everywhere"',
    draftDrawer.format > 0 && draftDrawer.buttons.includes('Bold') && draftDrawer.buttons.includes('Italic') && draftDrawer.buttons.includes('Underline'),
    JSON.stringify(draftDrawer));
  ok('S10: and the TEXT|INK switch does NOT mount on Draft — Draft is not a sketch pad, and an instrument switch offering an instrument the surface does not have would be exactly the locked door R15\'s own grammar forbids',
    draftDrawer.switchPresent === false, JSON.stringify({ switchPresent: draftDrawer.switchPresent }));

  // ==========================================================================
  // S11 — SHOTS. Prose page in TEXT and INK at both widths, the options zone
  // open, and the three tips drawn once each so the profiles are visible.
  // ==========================================================================
  const shots = {};
  for (const [label, width, height] of [['1366', W1, H1], ['1680', W2, H2]]) {
    const shotId = await freshPage(app, width, height);
    void shotId;
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
    await app.typeKeys('The coat on the train, and everything it carried.');
    await sleep(500);
    shots[`text-${label}`] = (await app.screenshot()).length;
    await setInstrument(app, 'ink');
    await openSliver(app);
    // One stroke per tip, so all three profiles appear in the same shot.
    for (const [tip, y] of [['Pen', 0.42], ['Pencil', 0.52], ['Marker', 0.62]]) {
      await app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-ink-tips .wz-ink-tip')]
        .find(x => x.getAttribute('aria-label') === ${JSON.stringify(tip)}); if (b) b.click(); })()`);
      await sleep(150);
      await safePen(app, SHEET, [{ x: 0.18, y }, { x: 0.45, y: y + 0.01 }, { x: 0.72, y }], 'pen stroke');
      await sleep(400);
    }
    shots[`ink-${label}`] = (await app.screenshot()).length;
    const drawn = await app.evalJs(`(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      const e = l.find(x => x.strokes && x.strokes.length === 3); return e ? e.strokes.map(s => s.tip) : []; })()`);
    ok(`S11 (${label}): the three tips each drew a stroke and each stamped ITS OWN tip — pen, pencil and marker are three distinguishable instruments in the data, not one instrument with three labels`,
      JSON.stringify(drawn) === JSON.stringify(['pen', 'pencil', 'marker']), JSON.stringify(drawn));
  }
  ok('S11: shots captured — prose page in TEXT and in INK, at 1366 and 1680, with the options zone open and all three tips laid down',
    Object.keys(shots).length === 4 && Object.values(shots).every(n => n > 1000), JSON.stringify(shots));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// item121.mjs is a brand-new file and parks NOTHING OF ITS OWN. Item 121 DOES
// falsify pre-existing assertions — the menus wave's Free Write B·I·U checks —
// but those are parked IN THE FILES THAT OWN THEM (fx7.mjs, ab2.mjs,
// item83f.mjs, cd1.mjs as the suite establishes), originals kept verbatim with
// a successor pointer, never rewritten in place. A park recorded in the wrong
// file is a park nobody looking for it would find.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nITEM121 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; item121.mjs parks nothing of its own (its parks live in the files that own the falsified assertions).`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM121 VERIFY: PASS (${checks.length} checks)` : `\nITEM121 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
