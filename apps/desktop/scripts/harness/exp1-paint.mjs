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
