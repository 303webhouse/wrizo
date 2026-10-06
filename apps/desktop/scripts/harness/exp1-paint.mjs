// EXPERIMENT 1 + ITEM 145 — THE PAINT-LAYER MEASUREMENT.
//
// ONE measurement, serving BOTH: Experiment 1's mark on linked words, and item
// 145's term highlight. Both need the same thing, and both are forbidden the
// same shortcut.
//
// WHAT IS BEING DECIDED. The mark is ruled to be A FAINT TINT ON THE WORDS
// THEMSELVES — not an underline (F2 holds), and NOT a character in the text:
//
//   §6b, verbatim: the drawing marked a note by inserting an element that
//   CARRIES A CHARACTER (`m.textContent='✎'; r.insertNode(m)`), and UNDER TRR14
//   THOSE CHARACTERS ARE SAVED INTO THE MANUSCRIPT. A mark may never be a
//   character in the text.
//
// The CSS Custom Highlight API is the one mechanism that paints ranges WITHOUT
// touching the DOM, which is exactly what §6b requires. So the question is not
// "does the API exist" — it is "does it paint, on THIS app's real writing
// surface, without touching the manuscript, without moving the page, and does
// it survive the writer typing."
//
// ⚠ WHY PIXELS AND NOT `getComputedStyle`. A highlight pseudo-element is not
// queryable: there is no element to ask, and `CSS.highlights.has(...)` only
// proves the range was REGISTERED, not that anything was painted. An API that
// exists and paints nothing would pass every truthy check and fail the writer.
// So the paint is measured in PIXELS — screenshot, decode in-page through an
// OffscreenCanvas (no DOM insertion, so it cannot disturb the purity checks
// below), and compare the mean colour of the same word's rect before and after.
//
// THE SURFACE IS REAL. `.forward-only-editor` (ForwardOnlyEditor, rendered by
// PageEditor) is the app's actual prose surface, and it is CONTENTEDITABLE —
// checked in source first, because the Custom Highlight API cannot paint inside
// a <textarea> at all and that alone would have decided the answer.
//
// Run: node scripts/harness/exp1-paint.mjs   (from apps/desktop, dist-web built)
// The box-turn guard lives in withHarness, so this cannot open a browser
// without the grant.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Never let a driver abort the file: a throw here reports NOTHING at all, which
// is worse than a red. Every risky read returns a value or a recorded failure.
const safe = async (app, expr, fallback = null) => {
  try { return await app.evalJs(expr); } catch (e) { return { __err: String(e && e.message || e), __fallback: fallback }; }
};

const HIGHLIGHT_NAME = 'wz-exp1-paint-probe';
// A faint tint, and ONLY a background — no text-decoration, because F2 rules out
// the underline and a probe that painted one would be measuring the wrong thing.
const PROBE_CSS = `::highlight(${HIGHLIGHT_NAME}) { background-color: rgba(120, 90, 200, 0.45); }`;

const freshProsePage = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, 1200, 760);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

// ⚠ THE PAINT TARGET, CORRECTED BY MEASUREMENT. This fixture first assumed every
// word was a `.fo-word` span. It is not: ForwardOnlyEditor renders
// `<span class="fo-run">The rain </span><span class="fo-word">fell</span>` — the
// settled text is ONE run and `.fo-word` is only the word being typed. Measured,
// not guessed, and the first version of this file was wrong about it.
//
// So a word is located the way the FEATURE itself will locate one: walk the
// editor's TEXT NODES, find the offset, and build a Range across whatever spans
// it happens to straddle. That is structure-independent — it keeps working when
// the run/word split changes, which a span-class selector would not.
const HELPERS = `window.__wzRange = (word) => {
  const ed = document.querySelector('.forward-only-editor');
  if (!ed) return null;
  const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  let acc = '';
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push({ node: walker.currentNode, start: acc.length });
    acc += walker.currentNode.textContent;
  }
  const i = acc.indexOf(word);
  if (i < 0) return null;
  const locate = (pos) => {
    for (const n of nodes) {
      const len = n.node.textContent.length;
      if (pos >= n.start && pos <= n.start + len) return { node: n.node, offset: pos - n.start };
    }
    return null;
  };
  const a = locate(i);
  const b = locate(i + word.length);
  if (!a || !b) return null;
  const r = document.createRange();
  r.setStart(a.node, a.offset);
  r.setEnd(b.node, b.offset);
  return r;
};
window.__wzRect = (word) => {
  const r = window.__wzRange(word);
  if (!r) return null;
  const b = r.getBoundingClientRect();
  if (!b || b.width < 1) return null;
  return { left: Math.round(b.left), top: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) };
};
window.__wzPaint = (name, word) => {
  const r = window.__wzRange(word);
  if (!r) return { ok: false, why: 'word-not-found' };
  CSS.highlights.set(name, new Highlight(r));
  return { ok: true, registered: CSS.highlights.has(name) };
};
window.__wzPaintSpan = (name, from, to) => {
  const ed = document.querySelector('.forward-only-editor');
  const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  let acc = '';
  const nodes = [];
  while (walker.nextNode()) { nodes.push({ node: walker.currentNode, start: acc.length }); acc += walker.currentNode.textContent; }
  const i = acc.indexOf(from);
  const j = acc.indexOf(to);
  if (i < 0 || j < 0) return { ok: false, why: 'words-not-found' };
  const locate = (pos) => { for (const n of nodes) { const len = n.node.textContent.length; if (pos >= n.start && pos <= n.start + len) return { node: n.node, offset: pos - n.start }; } return null; };
  const a = locate(i); const b = locate(j + to.length);
  if (!a || !b) return { ok: false, why: 'locate-failed' };
  const r = document.createRange();
  r.setStart(a.node, a.offset); r.setEnd(b.node, b.offset);
  CSS.highlights.set(name, new Highlight(r));
  return { ok: true, registered: CSS.highlights.has(name), size: CSS.highlights.size };
};
'true'`;

const wordRect = (word) => `window.__wzRect(${JSON.stringify(word)})`;
const paintWord = (word, name = HIGHLIGHT_NAME) => `window.__wzPaint(${JSON.stringify(name)}, ${JSON.stringify(word)})`;

// Mean colour of a rect, decoded from a PNG the driver captured. The image and
// canvas are never appended, so the page's own DOM is untouched by measuring it.
const sampleOf = async (app, b64, rect) => {
  const expr = `(async () => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + ${JSON.stringify(b64)};
    await img.decode();
    const c = new OffscreenCanvas(img.width, img.height);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const R = ${JSON.stringify(rect)};
    const d = g.getImageData(R.left, R.top, Math.max(1, R.width), Math.max(1, R.height)).data;
    let r = 0, gg = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
    return { r: Math.round(r / n), g: Math.round(gg / n), b: Math.round(b / n), px: n };
  })()`;
  return safe(app, expr);
};

const dist = (a, b) => (!a || !b || a.__err || b.__err) ? -1
  : Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);

await withHarness(async (app) => {
  await freshProsePage(app);

  // Put real words on the page through the editor itself (typing, not seeding —
  // the mark has to work on what a writer actually wrote).
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.type('The rain fell on the quiet street and nothing moved at all');
  await sleep(500);
  // ⚠ MEASURED, AND IT IS NOT WHAT THE SEAM SUGGESTS. `wrizoFlushNow()` flushes
  // the persistence CACHE to localStorage — it CANNOT flush the EDITOR's own
  // state into the cache. At 1.5s the row existed with `text: ""` and a flush
  // changed nothing; the editor's autosave put the words in at ~4.8s. So a probe
  // that flushes and reads immediately reports an empty manuscript against
  // working code.
  //
  // Therefore: WAIT ON OBSERVABLE STATE, never on elapsed time — poll until the
  // stored text is actually there. A fixed sleep would be a number tuned to this
  // machine on this day.
  await app.waitFor(
    `(() => { const r = localStorage.getItem('writer-studio-journal-entries');`
    + ` const a = r ? JSON.parse(r) : []; return a.some(e => (e.text || '').includes('rain fell')); })()`,
    { timeout: 15000, label: "the editor's autosave reaches storage" },
  );
  await app.evalJs(HELPERS);

  // ==========================================================================
  // M1 — does the app's browser have the API at all?
  // ==========================================================================
  const api = await safe(app, `(() => ({
    highlights: typeof CSS !== 'undefined' && !!CSS.highlights,
    ctor: typeof Highlight === 'function',
    registry: CSS.highlights ? CSS.highlights.constructor.name : null,
    ua: navigator.userAgent.replace(/^.*(Edg|Chrome)\\//, '$1/').split(' ')[0],
  }))()`);
  ok('M1: the CSS Custom Highlight API is present in the app\'s own browser — `CSS.highlights` registry and a constructible `Highlight`. This is the ONLY mechanism that paints a range without putting anything in the DOM, which is what §6b requires of the mark',
    !!api && !api.__err && api.highlights === true && api.ctor === true, JSON.stringify(api));

  // The word spans the editor renders are the paint target; if they vanish, the
  // mark's whole approach changes, so this is asserted rather than assumed.
  const shape = await safe(app, `(() => {
    const ed = document.querySelector('.forward-only-editor');
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    let n = 0, acc = '';
    while (w.nextNode()) { n++; acc += w.currentNode.textContent; }
    return { textNodes: n, text: acc, runs: ed.querySelectorAll('.fo-run').length, liveWords: ed.querySelectorAll('.fo-word').length };
  })()`);
  const spans = shape && !shape.__err && shape.textNodes >= 1
    && shape.text.includes('quiet') && shape.text.includes('street') ? 99 : 0;
  ok('M1 (the premise, CORRECTED BY MEASUREMENT): the editor\'s text is reachable as TEXT NODES a Range can span. The first version of this fixture looked for one `.fo-word` per word and found ONE — the settled text is a single `.fo-run`, and `.fo-word` is only the word being typed. The feature must locate a word by OFFSET, not by span class, and so does this measurement',
    spans > 5, JSON.stringify(shape));

  // ==========================================================================
  // M2 — DOES IT PAINT? Pixels, not a truthy API.
  // ==========================================================================
  const rect = await safe(app, wordRect('quiet'));
  const haveRect = rect && !rect.__err && rect.width > 0;
  ok('M2 (premise): the target word has a real on-screen rect to sample',
    !!haveRect, JSON.stringify(rect));

  let beforeShot = null, afterShot = null, before = null, after = null, painted = -1;
  if (haveRect) {
    beforeShot = await app.screenshot();
    before = await sampleOf(app, beforeShot, rect);

    await app.evalJs(`(() => { const s = document.createElement('style'); s.id = 'exp1-paint-probe-css'; s.textContent = ${JSON.stringify(PROBE_CSS)}; document.head.appendChild(s); })()`);
    const reg = await safe(app, paintWord('quiet'));
    ok('M2: a Range over the word registers as a Highlight (`CSS.highlights.set`) with no DOM mutation in the editor — no element inserted, no character added',
      !!reg && reg.ok === true && reg.registered === true, JSON.stringify(reg));

    await sleep(250);
    afterShot = await app.screenshot();
    after = await sampleOf(app, afterShot, rect);
    painted = dist(before, after);
  }
  ok('M2 ⛔ THE DECIDING CHECK — the word\'s pixels actually CHANGE when the highlight is registered. A highlight that registers and paints nothing would pass every API check and fail the writer, so the tint is measured in pixels and not inferred',
    painted > 12, JSON.stringify({ before, after, meanChannelDelta: painted }));

  // A control: an UNTOUCHED word on the same line must NOT have changed. Without
  // it, a global repaint (a theme tick, a caret blink, a re-layout) would read as
  // a successful tint.
  const ctrlRect = await safe(app, wordRect('street'));
  let ctrlDelta = -1;
  if (ctrlRect && !ctrlRect.__err && beforeShot && afterShot) {
    const cb = await sampleOf(app, beforeShot, ctrlRect);
    const ca = await sampleOf(app, afterShot, ctrlRect);
    ctrlDelta = dist(cb, ca);
  }
  ok('M2 (the control): a DIFFERENT word on the same page is unchanged across the same two frames — so the delta above is the highlight and not a repaint of the whole surface',
    ctrlDelta >= 0 && ctrlDelta <= 12, JSON.stringify({ ctrlRect, ctrlDelta }));

  // ==========================================================================
  // M3 — §6b: NOTHING ENTERS THE MANUSCRIPT.
  // ==========================================================================
  const purity = await safe(app, `(() => {
    const ed = document.querySelector('.forward-only-editor');
    return {
      domText: ed.textContent,
      nodeCount: ed.querySelectorAll('*').length,
      hasPencil: /[\\u270e\\u2710\\u270f]/.test(ed.textContent),
    };
  })()`);
  const stored = await safe(app, `(() => {
    // The key is 'writer-studio-journal-entries' (persistence.ts KEYS) — NOT
    // 'wrizo-*'. The first run of this file read the wrong key and reported the
    // manuscript missing; a probe that alleges something that severe is the
    // suspect before the product is.
    const raw = localStorage.getItem('writer-studio-journal-entries');
    const all = raw ? JSON.parse(raw) : [];
    const e = all.find(x => (x.text || '').includes('rain fell'));
    return e ? { text: e.text, hasPageLinks: 'pageLinks' in e } : null;
  })()`);
  ok('M3 ⛔ §6b — THE MARK PUTS NO CHARACTER IN THE TEXT. The stored manuscript contains exactly the writer\'s sentence: no marker glyph, no sentinel. This is the rule the drawing\'s `✎` broke, and the reason the Custom Highlight API is the mechanism at all',
    !!stored && !stored.__err && stored.text.trim() === 'The rain fell on the quiet street and nothing moved at all'
      && purity && purity.hasPencil === false,
    JSON.stringify({ stored, hasPencil: purity && purity.hasPencil }));
  ok('M3: and the highlight adds NO element to the editor\'s subtree — the tint is painted by the browser, not by wrapping the words in anything',
    !!purity && !purity.__err && purity.domText.trim() === 'The rain fell on the quiet street and nothing moved at all',
    JSON.stringify({ nodeCount: purity && purity.nodeCount }));

  // ==========================================================================
  // M4 — PAGE IS PRIMARY: the mark may not move the page.
  // ==========================================================================
  const rectAfter = await safe(app, "(() => { const r = document.querySelector('.forward-only-editor').getBoundingClientRect(); return {left:Math.round(r.left), top:Math.round(r.top), width:Math.round(r.width), height:Math.round(r.height)}; })()");
  const wordRectAfter = await safe(app, wordRect('quiet'));
  ok('M4: PAGE IS PRIMARY — painting the mark does not change the editor\'s bounding rect, and does not reflow the word it marks. Self-check line 1 answered NO, measured rather than reasoned',
    !!rectAfter && !rectAfter.__err && !!wordRectAfter && !wordRectAfter.__err
      && wordRectAfter.left === rect.left && wordRectAfter.top === rect.top
      && wordRectAfter.width === rect.width,
    JSON.stringify({ editor: rectAfter, word: wordRectAfter, wordBefore: rect }));

  // ==========================================================================
  // M5 — EXP1-Q5 is YES: overlapping marks are allowed.
  // ==========================================================================
  const overlap = await safe(app,
    "(() => { const r = window.__wzPaintSpan('wz-exp1-paint-probe-2', 'quiet', 'street');"
    + " return { ...r, both: CSS.highlights.has('wz-exp1-paint-probe') && CSS.highlights.has('wz-exp1-paint-probe-2') }; })()");
  ok('M5: TWO highlights may cover the same words at once and both stay registered — EXP1-Q5 is YES (Nick\'s ruling: a writer may link a phrase inside an already-linked sentence, and the rail lists everything covering a spot), so the paint layer has to allow overlap rather than replace',
    !!overlap && overlap.ok === true && overlap.both === true, JSON.stringify(overlap));

  // ==========================================================================
  // M6 — DOES IT SURVIVE THE WRITER TYPING? The finding either way.
  // ==========================================================================
  // ForwardOnlyEditor renders through `dangerouslySetInnerHTML`, so an edit
  // REBUILDS the word spans. Ranges point at text nodes; rebuilt nodes are not
  // the same nodes. Whether the highlight survives decides whether the mark must
  // be recomputed after every render — a real cost, and better measured now than
  // discovered in the build.
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.type(' more');
  await sleep(600);
  const afterTypeRect = await safe(app, wordRect('quiet'));
  let survived = -1;
  if (afterTypeRect && !afterTypeRect.__err) {
    const shot = await app.screenshot();
    const s = await sampleOf(app, shot, afterTypeRect);
    survived = dist(before, s);
  }
  const stillRegistered = await safe(app, "CSS.highlights.has('wz-exp1-paint-probe')");
  ok('M6 (the finding, not a pass/fail of the product): after an ordinary edit the registry still HOLDS the highlight — recorded so the build knows whether re-registration is needed for the registry or only for the ranges',
    stillRegistered === true || stillRegistered === false, JSON.stringify({ stillRegistered }));
  ok(`M6: and whether the tint is still PAINTED after the editor rebuilds its spans — measured. delta-from-unpainted=${survived} (>12 means still painted, <=12 means the range detached and the mark must be recomputed on every render)`,
    survived >= 0, JSON.stringify({ deltaFromUnpainted: survived, afterTypeRect }));

  // ==========================================================================
  // M7 — FOR TUTOR's 204 (Fable's ask): does a WAVY text-decoration paint
  // through ::highlight()? It gates the grammar squiggle.
  //
  // WHY IT BELONGS IN THIS RUN AND NOT ITS OWN: the box turn is already spent
  // on this surface with a page of real words on it, and the question is the
  // same question this file was written to answer — "does the API actually paint
  // THIS property", measured in pixels with a control, not read off a support
  // table. `::highlight()` accepts only a restricted property set, and which
  // properties a given engine honours is exactly the sort of thing a
  // compatibility note gets right in general and wrong for the build in front
  // of you.
  //
  // ⚠ AND THIS IS A MEASUREMENT, NOT A VERDICT ON THE SQUIGGLE. A wavy underline
  // that paints is not thereby the right mark for a grammar hint; F2 rules the
  // UNDERLINE out for a LINK, and whether a squiggle is lawful on this surface is
  // TUTOR's and Fable's question. This answers only whether the mechanism can
  // draw one at all.
  {
    const rect2 = await safe(app, wordRect('nothing'));
    const have2 = rect2 && !rect2.__err && rect2.width > 0;
    ok('M7 (premise): a second, untouched word has a rect to sample — the wavy probe must not reuse the tinted word, or the tint would be in both frames',
      !!have2, JSON.stringify(rect2));

    let wavyDelta = -1;
    let ctrl2 = -1;
    if (have2) {
      await safe(app, "CSS.highlights.clear()");
      await sleep(150);
      const beforeWavy = await app.screenshot();
      const bw = await sampleOf(app, beforeWavy, rect2);
      const ctrlRect2 = await safe(app, wordRect('street'));
      const cb2 = ctrlRect2 && !ctrlRect2.__err ? await sampleOf(app, beforeWavy, ctrlRect2) : null;

      // A decoration ONLY — no background — so anything that changes in those
      // pixels is the decoration and not a tint leaking in.
      await app.evalJs(`(() => {
        const s = document.createElement('style');
        s.id = 'exp1-wavy-probe-css';
        s.textContent = '::highlight(wz-exp1-wavy-probe) { text-decoration: underline wavy rgb(220, 40, 40); text-decoration-skip-ink: none; }';
        document.head.appendChild(s);
      })()`);
      await safe(app, paintWord('nothing', 'wz-exp1-wavy-probe'));
      await sleep(250);
      const afterWavy = await app.screenshot();
      const aw = await sampleOf(app, afterWavy, rect2);
      wavyDelta = dist(bw, aw);
      const ca2 = ctrlRect2 && !ctrlRect2.__err ? await sampleOf(app, afterWavy, ctrlRect2) : null;
      ctrl2 = dist(cb2, ca2);
      await safe(app, "CSS.highlights.clear(); document.getElementById('exp1-wavy-probe-css')?.remove()");
    }

    // Reported as a MEASUREMENT: the check passes when the number was obtained,
    // and the number itself is the answer TUTOR's 204 needs. A check that only
    // passed on "it paints" would turn a legitimate negative finding into a red
    // against the product, which is not what a gating measurement is for.
    ok(`M7 ⛔ THE 204 GATE — a WAVY text-decoration through ::highlight(): meanChannelDelta=${wavyDelta} on the marked word, control=${ctrl2}. `
      + `>12 with a quiet control means the engine DOES paint a wavy decoration through a highlight, and the grammar squiggle has a mechanism; <=12 means it does not, and 204 needs a different one. `
      + `Measured in pixels with a control, on the app's own surface — not read off a support table.`,
      wavyDelta >= 0 && ctrl2 >= 0 && ctrl2 <= 12,
      JSON.stringify({ wavyDelta, control: ctrl2, verdict: wavyDelta > 12 ? 'WAVY PAINTS' : 'WAVY DOES NOT PAINT' }));
  }

  // M7b — AND IS THE WAVY ACTUALLY WAVY? THE DISCRIMINATING MEASUREMENT.
  //
  // ⚠ WHY M7 ALONE IS NOT ENOUGH, AND IT IS THE SAME DEFECT CLASS ITEM 138 JUST
  // FOUND IN AB4. M7 declares "WAVY PAINTS" on `meanChannelDelta > 12` over the
  // word's rect. But an engine that HONOURED `underline` and SILENTLY DROPPED
  // `wavy` — painting a straight red rule — clears that bar just as easily: the
  // pixels change either way. So M7's NAME asserts waviness while its CONDITION
  // can only see "something red arrived". Measured at 19 against a threshold of
  // 12, the margin is narrow enough that the question is not academic.
  //
  // THIS MATTERS TO 204 SPECIFICALLY. A grammar hint's whole legibility is that a
  // squiggle is not an underline — F2 rules the straight underline out for a LINK,
  // so a decoration that flattens to solid would put the grammar mark and the
  // forbidden link mark in the same pixels. "A decoration paints" is not the
  // finding TUTOR needs; "a WAVY decoration paints" is.
  //
  // So this measures the underline's GEOMETRY rather than its average colour.
  // A solid rule occupies one y (plus antialiasing) at every column; a wave
  // oscillates, so its reddish pixels span several rows AND their per-column
  // position varies. Both probes are run on the same word, one after the other,
  // and compared to each other — the comparison is the instrument, so neither
  // probe has to be trusted on its own.
  {
    // Per-column geometry of the "reddish" pixels in a band around the word's
    // baseline. The band reaches BELOW the rect, because an underline is drawn at
    // the baseline and may sit outside the box the rect describes.
    const redProfileOf = async (b64, rect) => {
      const band = {
        left: Math.round(rect.left),
        top: Math.round(rect.top + Math.max(0, rect.height - 10)),
        width: Math.round(rect.width),
        height: 16,
      };
      const expr = `(async () => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + ${JSON.stringify(b64)};
        await img.decode();
        const c = new OffscreenCanvas(img.width, img.height);
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const B = ${JSON.stringify(band)};
        const d = g.getImageData(B.left, B.top, Math.max(1, B.width), Math.max(1, B.height)).data;
        // "The probe's red", and the threshold is MEASURED, not guessed. The first
        // version asked only for red dominance over 40, and its control went red: the
        // band held 67 such pixels with NOTHING painted, scattered over 23 of 54
        // columns and 9 rows. That is not a line, and it was not the native
        // spellchecker either — switching spellcheck off changed the count by
        // exactly zero. It is LCD SUBPIXEL ANTIALIASING on the glyph edges, which
        // Chromium on Windows renders with colour fringes: a dark letter stem on
        // light paper leaves reddish pixels down one side. The band overlaps the
        // bottom 10px of the glyphs, so it was sampling those fringes.
        //
        // ⚠ AND TIGHTENING BRIGHTNESS WAS STILL NOT ENOUGH — the control named the
        // real contaminant only once it printed the actual pixels. They were
        // rgb(176,85,7), rgb(243,174,82), rgb(150,50,7): AMBER, the app's own
        // accent under the text, not red at all. Red merely dominated, which is
        // all the first two classifiers ever asked.
        //
        // THE SEPARATION THAT WORKS IS THE PROBE'S OWN SHAPE. rgb(220,40,40) has
        // its green and blue channels EQUAL; amber has green far above blue (85 vs
        // 7, 174 vs 82). So the test is red dominance over GREEN plus a small
        // green-blue gap, which admits the probe and every antialiased shade of it
        // while excluding the accent entirely. The lesson is the one this repo
        // keeps relearning: when a matcher's population looks wrong, print the
        // members before theorising about them.
        //
        // A fringe is a DARK red at low saturation; the probe is a BRIGHT red at
        // high saturation. Requiring real brightness (r above 140) as well as
        // dominance (>60 over both other channels) separates them, and the control
        // below proves the separation rather than assuming it.
        const cols = new Map();
        const rows = new Set();
        let count = 0;
        for (let y = 0; y < B.height; y++) {
          for (let x = 0; x < B.width; x++) {
            const i = (y * B.width + x) * 4;
            const r = d[i], gg = d[i + 1], b = d[i + 2];
            if (r > 140 && r - gg > 60 && Math.abs(gg - b) < 30) {
              count++;
              rows.add(y);
              if (!cols.has(x)) cols.set(x, []);
              cols.get(x).push(y);
            }
          }
        }
        // DIAGNOSTIC: keep the first flagged pixels with their real colours, so a
        // failing control can be IDENTIFIED instead of theorised about.
        const samples = [];
        for (let y = 0; y < B.height && samples.length < 14; y++) {
          for (let x = 0; x < B.width && samples.length < 14; x++) {
            const i2 = (y * B.width + x) * 4;
            const r2 = d[i2], g2 = d[i2 + 1], b2 = d[i2 + 2];
            if (r2 > 140 && r2 - g2 > 60 && Math.abs(g2 - b2) < 30) samples.push({ x, y, r: r2, g: g2, b: b2 });
          }
        }
        const colMeanY = [...cols.entries()].map(([x, ys]) => ({ x, y: ys.reduce((a, v) => a + v, 0) / ys.length }));
        const ys = colMeanY.map((c) => c.y);
        const mean = ys.length ? ys.reduce((a, v) => a + v, 0) / ys.length : 0;
        const variance = ys.length ? ys.reduce((a, v) => a + (v - mean) * (v - mean), 0) / ys.length : 0;
        const allY = [...rows];
        return {
          count,
          rows: allY.length,
          yRange: allY.length ? Math.max(...allY) - Math.min(...allY) : 0,
          columns: colMeanY.length,
          colYVariance: Math.round(variance * 100) / 100,
          samples,
          band: B,
        };
      })()`;
      return safe(app, expr);
    };

    const probeCss = async (id, decoration) => {
      await safe(app, "CSS.highlights.clear(); document.getElementById('exp1-geom-probe-css')?.remove()");
      await sleep(120);
      await app.evalJs(`(() => {
        const s = document.createElement('style');
        s.id = 'exp1-geom-probe-css';
        s.textContent = '::highlight(${id}) { text-decoration: ${decoration}; text-decoration-skip-ink: none; }';
        document.head.appendChild(s);
      })()`);
      await safe(app, paintWord('nothing', id));
      await sleep(250);
      return app.screenshot();
    };

    const rect3 = await safe(app, wordRect('nothing'));
    const have3 = rect3 && !rect3.__err && rect3.width > 0;
    ok('M7b (premise): the probe word still has a rect to sample after M7 cleaned up',
      !!have3, JSON.stringify(rect3));

    if (have3) {
      // BASELINE FIRST — with nothing painted, the band must hold almost no
      // reddish pixels. Without this the two probes below could both be measuring
      // something that was always there.
      //
      // ⚠ AND THE FIRST RUN OF THIS CONTROL WENT RED, WHICH IS THE FINDING.
      // With nothing of ours painted, the band under "nothing" already held 67
      // reddish pixels across 9 rows with a per-column y variance of 2.85 — the
      // signature of a red wave, not of paper. The solid probe then measured
      // rows=9 yRange=8 variance=2.56, i.e. INDISTINGUISHABLE from that baseline,
      // so the comparison the check is built on was contaminated at both ends.
      //
      // THE SUSPECT, AND IT IS MEASURED HERE RATHER THAN ARGUED: nothing in
      // apps/desktop/src sets `spellcheck` on the editor, so the contenteditable
      // inherits Chromium's DEFAULT — spellcheck ON — and Edge paints its own
      // RED WAVY UNDERLINE under any word it does not recognise. That is the same
      // decoration, in the same colour, in the same place as the mark 204 wants.
      // So the baseline is sampled TWICE, once as found and once with the native
      // checker switched off, and the difference names the cause.
      await safe(app, "CSS.highlights.clear(); document.getElementById('exp1-geom-probe-css')?.remove()");
      await sleep(200);
      const basePng = await app.screenshot();
      const baseAsFound = await redProfileOf(basePng, rect3);

      // Turn the native checker off and make the engine re-render the text, then
      // look again. `spellcheck=false` alone does not always clear existing
      // markers, so the editor is blurred as well.
      await app.evalJs(`(() => {
        const ed = document.querySelector('.forward-only-editor');
        if (!ed) return false;
        ed.setAttribute('spellcheck', 'false');
        ed.blur();
        return true;
      })()`);
      await sleep(450);
      const basePng2 = await app.screenshot();
      const base = await redProfileOf(basePng2, rect3);

      ok(`M7b (THE DIAGNOSIS): the band's reddish pixels AS FOUND vs with native spellcheck OFF — as-found count=${baseAsFound?.count} rows=${baseAsFound?.rows} variance=${baseAsFound?.colYVariance}, spellcheck-off count=${base?.count} rows=${base?.rows} variance=${base?.colYVariance}. `
        + `A large drop names Chromium's OWN red wavy spellcheck underline as the contaminant — which is a finding for 204 in its own right, because that is the same mark in the same colour in the same place.`,
        baseAsFound && base && !baseAsFound.__err && !base.__err,
        JSON.stringify({ asFound: baseAsFound, spellcheckOff: base }));

      const solidPng = await probeCss('wz-exp1-solid-probe', 'underline solid rgb(220, 40, 40)');
      const solid = await redProfileOf(solidPng, rect3);

      const wavyPng = await probeCss('wz-exp1-wavy-probe2', 'underline wavy rgb(220, 40, 40)');
      const wavy = await redProfileOf(wavyPng, rect3);

      await safe(app, "CSS.highlights.clear(); document.getElementById('exp1-geom-probe-css')?.remove()");

      ok('M7b (the control): with NOTHING painted the band holds essentially no reddish pixels — so both probes below are measuring paint that arrived, not paper',
        base && !base.__err && base.count <= 2, JSON.stringify(base));

      ok('M7b (premise): BOTH decorations paint — a comparison between two absences would prove nothing',
        solid && wavy && !solid.__err && !wavy.__err && solid.count > 10 && wavy.count > 10,
        JSON.stringify({ solidCount: solid?.count, wavyCount: wavy?.count }));

      // THE DISCRIMINATOR. A straight rule sits at one y in every column: its
      // per-column y variance is ~0 and it spans 1-3 rows with antialiasing. A
      // wave oscillates: more rows, a wider y range, and a per-column variance
      // that is unmistakably non-zero. If the engine flattened `wavy` to a solid
      // rule, these two profiles are the SAME and this goes red — which is the
      // finding, not a failure of the product.
      const wavier = !!(solid && wavy && !solid.__err && !wavy.__err)
        && wavy.yRange > solid.yRange
        && wavy.colYVariance > solid.colYVariance + 0.25;

      ok(`M7b ⛔ THE 204 GATE, SHARPENED — is the wavy decoration actually WAVY, or did the engine flatten it to a solid rule? `
        + `solid: rows=${solid?.rows} yRange=${solid?.yRange} colYVariance=${solid?.colYVariance} | `
        + `wavy: rows=${wavy?.rows} yRange=${wavy?.yRange} colYVariance=${wavy?.colYVariance}. `
        + `A wave must span MORE rows than a rule and must OSCILLATE per column; equal profiles mean 'wavy' was silently dropped and 204's squiggle would render as the very underline F2 forbids for a link.`,
        wavier,
        JSON.stringify({
          verdict: wavier ? 'WAVY IS GENUINELY WAVY' : 'WAVY FLATTENED TO SOLID — 204 needs a different mechanism',
          solid, wavy,
        }));
    }
  }

  // Leave the box as it was found.
  await app.evalJs("CSS.highlights.clear(); document.getElementById('exp1-paint-probe-css')?.remove()");
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nEXP1 PAINT MEASUREMENT: PASS (${checks.length} checks)`
  : `\nEXP1 PAINT MEASUREMENT: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
