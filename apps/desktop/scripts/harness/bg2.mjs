// BG2 — the Beginnings, Seen (docs/wrizo-alpha/p2-wave.md §BG2, item 73).
// A committed CDP verification scenario, per AGENTS.md's "harness scenarios
// persist." Authority: SV19/SV20 — Nick's walk of the deployed P1 tree, where
// the row he got was "much too small," he "can barely see" it, and the page's
// row did not read as a set of modes at all.
//
// BG2 changes only how the row is SEEN. Every law BG1 established is still
// asserted in bg1.mjs and still runs live there — the per-mode door sets, the
// absence on system boards, the vanish-on-furniture rule, the Sprout rails, and
// the types-immediately DoD check. This file proves the three revisions:
//   S1 — the grammar, revised in ONE place so both surfaces inherit: icons
//        ABOVE labels (was inline), ~50% larger in glyph, label and hit target,
//        and a dark olive that carries against cream. The lane law is asserted
//        as a law, not a swatch: dark olive at rest, brass on hover, orange
//        only on press — hover and press driven by a TRUSTED pointer.
//   S2 — the page's row is centered on the sheet, and the DoD check that a
//        writer types immediately without touching it is RE-PROVEN there.
//   S3 — the board's row keeps its (already-correct) centering and takes S1's
//        sizing and colour; both surfaces remain literally one component.
//
// Contrast is COMPUTED, never eyeballed (the brief's own instruction): the WCAG
// 2.x relative-luminance ratio between the door's own rendered colour and the
// ground it actually sits on. Both surfaces render on `var(--paper)` — the page
// sheet and the board canvas alike — so one law covers both, and the theme whose
// paper is dark is checked too, because a token that only works on cream would
// be a trap laid for the flux page-dark theme.
//
// The BG1 checks this ticket falsified are PARKED in bg1.mjs at their own sites,
// quoted verbatim, naming this file as successor (A4, in the same commit as the
// change that falsified them).
// Fixtures copied verbatim from bg1.mjs / fx6.mjs per the standing instruction
// not to re-derive them.
// Run: node scripts/harness/bg2.mjs   (from apps/desktop, dist-web freshly built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const LEG_W = 1366, LEG_H = 768;

// BG1's own recorded sizes, so "~50% larger" is measured against the thing Nick
// actually complained about rather than against a number invented here.
const BG1_GLYPH_PX = 16;
const BG1_LABEL_PX = 13;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshBoard = async (app, boardId, boxes, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'BG2 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

const freshPage = async (app, pageId, text = '', width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(pageId)}, text: ${JSON.stringify(text)}, projectId: null, origin: 'loose', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page mounted' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// WCAG 2.x contrast, computed page-side against the element's OWN rendered
// colour and the first opaque background behind it — walked up the ancestor
// chain exactly as the eye sees it, rather than assuming which token applies.
const CONTRAST_JS = `(() => {
  const el = document.querySelector('.wz-beginning');
  const parse = (c) => c.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  let bgEl = el, bg = null;
  while (bgEl) {
    const c = getComputedStyle(bgEl).backgroundColor;
    if (c && c !== 'transparent' && !/rgba\\(0, 0, 0, 0\\)/.test(c)) { bg = c; break; }
    bgEl = bgEl.parentElement;
  }
  const fg = getComputedStyle(el).color;
  const L1 = lum(parse(fg)), L2 = lum(parse(bg || 'rgb(255,255,255)'));
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  return { fg, bg, bgFrom: bgEl ? (bgEl.className || bgEl.tagName) : null, ratio: Math.round(ratio * 100) / 100 };
})()`;

const rowMetrics = `(() => {
  const row = document.querySelector('.wz-beginnings');
  const door = document.querySelector('.wz-beginning');
  const glyph = door.querySelector('.wz-beginning-glyph');
  const label = door.querySelector('.wz-beginning-label');
  const cs = getComputedStyle(door);
  const g = glyph.getBoundingClientRect(), l = label.getBoundingClientRect(), d = door.getBoundingClientRect();
  const tops = [...document.querySelectorAll('.wz-beginning')].map((b) => Math.round(b.getBoundingClientRect().top));
  return {
    glyphPx: Math.round(g.width), labelPx: parseFloat(cs.fontSize),
    doorW: Math.round(d.width), doorH: Math.round(d.height),
    glyphBottom: Math.round(g.bottom), labelTop: Math.round(l.top),
    glyphMidX: Math.round(g.left + g.width / 2), labelMidX: Math.round(l.left + l.width / 2),
    oneLine: new Set(tops).size === 1, doorCount: tops.length,
    rowPos: getComputedStyle(row).position,
    opacity: cs.opacity, color: cs.color,
  };
})()`;

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the grammar, revised in one place. Asserted on the BOARD first.
  // ==========================================================================
  await freshBoard(app, 'bg2-grammar-board', [], LAPTOP_W, 900);
  const m = await app.evalJs(rowMetrics);

  ok('S1: icons sit ABOVE their labels, not inline — the glyph ends before the label begins, and the two share a vertical centre line (a stacked door, per SV19)',
    m.glyphBottom <= m.labelTop && Math.abs(m.glyphMidX - m.labelMidX) <= 2, JSON.stringify(m));

  ok(`S1: the glyph is ~50% larger than BG1's (${BG1_GLYPH_PX}px -> ${m.glyphPx}px, >=1.4x) — Nick's "much too small" answered in the icon`,
    m.glyphPx >= BG1_GLYPH_PX * 1.4, `${BG1_GLYPH_PX} -> ${m.glyphPx}`);

  ok(`S1: the label is ~50% larger than BG1's (${BG1_LABEL_PX}px -> ${m.labelPx}px, >=1.4x)`,
    m.labelPx >= BG1_LABEL_PX * 1.4, `${BG1_LABEL_PX} -> ${m.labelPx}`);

  // The hit target is the door, not the glyph: a stacked icon+label with real
  // padding. 44px is the standing touch-target floor; assert against that.
  ok('S1: the hit target grew with it — each door is a genuine target (>=44px on both axes), not a word to aim at',
    m.doorW >= 44 && m.doorH >= 44, JSON.stringify({ doorW: m.doorW, doorH: m.doorH }));

  ok('S1: the row is still ONE line, never a grid — every door shares a top edge at the new size (the wrap this ticket had to fix)',
    m.oneLine === true && m.doorCount === 4, JSON.stringify({ oneLine: m.oneLine, doorCount: m.doorCount }));

  // --- the colour law, measured ---------------------------------------------
  const boardContrast = await app.evalJs(CONTRAST_JS);
  ok(`S1: the door colour CARRIES against the ground it actually sits on — computed WCAG contrast ${boardContrast.ratio}:1 on the board (>=4.5), not eyeballed`,
    boardContrast.ratio >= 4.5, JSON.stringify(boardContrast));

  const tokens = await app.evalJs(`(() => { const d = getComputedStyle(document.documentElement);
    return { door: d.getPropertyValue('--accent-door').trim(), rest: d.getPropertyValue('--accent-rest').trim(),
      paper: d.getPropertyValue('--paper').trim(), brass: d.getPropertyValue('--brass').trim(),
      brassPress: d.getPropertyValue('--brass-press').trim() }; })()`);
  ok('S1: the door olive is its OWN slotted token (--accent-door), distinct from --accent-rest — the chrome olive is untouched, so re-tuning the door never drags the mode-tab hairlines with it',
    tokens.door === '#4F5730' && tokens.rest === '#96a05a', JSON.stringify(tokens));

  ok('S1: the resting opacity is retired — the colour the check measures is the colour the eye sees (no fade blending the assertion into a half-truth)',
    parseFloat(m.opacity) === 1, m.opacity);

  // --- rest / hover / press, under a TRUSTED pointer -------------------------
  const doorBox = await app.evalJs(`(() => { const b = document.querySelector('[data-beginning="newCard"]').getBoundingClientRect();
    return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`);
  const colourNow = () => app.evalJs("getComputedStyle(document.querySelector('[data-beginning=\"newCard\"]')).color");

  const restColour = await colourNow();
  await app.mouseMove(doorBox.x - 40, doorBox.y);
  await sleep(80);
  await app.mouseMove(doorBox.x, doorBox.y);
  await sleep(250);
  const hoverColour = await colourNow();
  await app.mouseDown(doorBox.x, doorBox.y);
  await sleep(150);
  const pressColour = await colourNow();
  // Release OFF the door, deliberately. A press sampled with a release on the
  // same element is a CLICK — the first run of this check pressed New Card for
  // real, the board gained a card, and the row correctly vanished out from
  // under the rest of the scenario. Browsers only fire `click` when press and
  // release land on the same element, so moving away first samples :active
  // honestly and cancels the activation. The row surviving is the proof.
  await app.mouseMove(4, 4);
  await app.mouseUp(4, 4);
  await sleep(200);
  const rowSurvivedPress = await app.evalJs("!!document.querySelector('.wz-beginnings')");

  ok('S1 (the lane law, trusted pointer): DARK OLIVE at rest — brass on hover — orange on press. Three distinct states, driven through the browser\'s own input layer, never a page-side dispatch',
    restColour === 'rgb(79, 87, 48)' && hoverColour === 'rgb(255, 152, 0)' && pressColour === 'rgb(232, 137, 0)',
    JSON.stringify({ restColour, hoverColour, pressColour }));

  ok('S1: nothing orange at REST — the house law holds; orange is reached only by the hand',
    restColour !== hoverColour && restColour !== pressColour, JSON.stringify({ restColour, hoverColour, pressColour }));

  ok('S1 precondition, stated: the press above was sampled and then CANCELLED (released off-target), so the colour law was proven without taking the door — the row is still standing',
    rowSurvivedPress === true, String(rowSurvivedPress));

  // ==========================================================================
  // S3 — the board's row keeps its placement (SV20: already right).
  // ==========================================================================
  const boardPlace = await app.evalJs(`(() => {
    const r = document.querySelector('.wz-beginnings').getBoundingClientRect();
    const c = document.querySelector('.board-canvas').getBoundingClientRect();
    return { rowMidY: Math.round(r.top + r.height / 2), canvasMidY: Math.round(c.top + c.height / 2),
      rowMidX: Math.round(r.left + r.width / 2), canvasMidX: Math.round(c.left + c.width / 2) };
  })()`);
  ok('S3: the board\'s row keeps the centering SV20 confirmed as already correct — dead centre of the canvas on both axes, at the new size',
    Math.abs(boardPlace.rowMidY - boardPlace.canvasMidY) <= 2 && Math.abs(boardPlace.rowMidX - boardPlace.canvasMidX) <= 2,
    JSON.stringify(boardPlace));

  // ==========================================================================
  // S2 — the page's row, centered on the sheet, and the DoD RE-PROVEN there.
  // ==========================================================================
  await freshPage(app, 'bg2-page', '', LAPTOP_W, 900);
  const pagePlace = await app.evalJs(`(() => {
    const row = document.querySelector('.wz-beginnings');
    const sheet = document.querySelector('.mode-page');
    const r = row.getBoundingClientRect(), s = sheet.getBoundingClientRect();
    return { rowMidX: Math.round(r.left + r.width / 2), sheetMidX: Math.round(s.left + s.width / 2),
      rowTop: Math.round(r.top), rowBottom: Math.round(r.bottom),
      sheetTop: Math.round(s.top), sheetBottom: Math.round(s.bottom),
      pointerEvents: getComputedStyle(row).pointerEvents };
  })()`);
  ok('S2 (SV19): the page\'s row is centered on the sheet — it reads as a set of modes, not a footnote under the caret (this SUPERSEDES the committee\'s "furniture beside the cursor" by Nick\'s own word)',
    Math.abs(pagePlace.rowMidX - pagePlace.sheetMidX) <= 12 &&
    pagePlace.rowTop > pagePlace.sheetTop && pagePlace.rowBottom < pagePlace.sheetBottom,
    JSON.stringify(pagePlace));

  ok('S2: the row still never intercepts the surface — pointer-events:none on the container, unchanged by the move',
    pagePlace.pointerEvents === 'none', pagePlace.pointerEvents);

  // The invariant BG1 expressed as "the row sits below the first line" — now
  // that the row is centered instead, the CLAIM has to be measured where it
  // actually lives: the doors, and the hit test at the caret. The row's
  // container spans the sheet by design (that is how flexbox centres it) and
  // does graze the first line's band at short viewport heights; it is
  // pointer-events:none, so what matters is that no DOOR sits over the caret
  // and that the caret point still belongs to the editor.
  const caretClear = await app.evalJs(`(() => {
    const ed = document.querySelector('.forward-only-editor');
    const e = ed.getBoundingClientRect();
    const lineH = parseFloat(getComputedStyle(ed).lineHeight) || 29;
    const caret = { x: e.left + 2, yTop: e.top, yBot: e.top + lineH };
    const covering = [...document.querySelectorAll('.wz-beginning')].filter((b) => {
      const d = b.getBoundingClientRect();
      return d.left <= caret.x && d.right >= caret.x && d.top <= caret.yBot && d.bottom >= caret.yTop;
    }).map((b) => b.dataset.beginning);
    const atCaret = document.elementFromPoint(caret.x + 1, caret.yTop + 8);
    const firstDoorLeft = Math.round(document.querySelector('.wz-beginning').getBoundingClientRect().left);
    return { covering, atCaret: (atCaret && atCaret.className || '').toString(),
      caretX: Math.round(caret.x), firstDoorLeft };
  })()`);
  ok('S2: the caret\'s own place stays clear of furniture at the new placement — NO door overlaps the caret, and the caret point still hit-tests to the editor itself (the invariant BG1 held by sitting below the first line, now held by being centered away from it)',
    caretClear.covering.length === 0 && caretClear.atCaret.includes('forward-only-editor'),
    JSON.stringify(caretClear));

  const pageContrast = await app.evalJs(CONTRAST_JS);
  ok(`S2: the door colour carries on the PAGE too — computed WCAG contrast ${pageContrast.ratio}:1 against the sheet (>=4.5)`,
    pageContrast.ratio >= 4.5, JSON.stringify(pageContrast));

  // THE DoD check, re-proven at the new placement (BG2's brief requires it).
  const caretLive = await app.evalJs(`(() => {
    const ed = document.querySelector('.forward-only-editor');
    return !!ed && (ed === document.activeElement || ed.contains(document.activeElement));
  })()`);
  ok('S2 (the DoD, re-proven at the new placement): the caret is LIVE from the first frame with nothing clicked — centering the row did not cost the page its readiness',
    caretLive === true, String(caretLive));

  await app.typeKeys('Centered and still mine');
  await sleep(300);
  const afterTyping = await app.evalJs(`({
    text: (document.querySelector('.forward-only-editor')?.innerText || '').trim(),
    row: !!document.querySelector('.wz-beginnings'),
  })`);
  ok('S2 (the DoD, re-proven): a writer types immediately without touching the row, the words land, and the row is gone the moment they do',
    afterTyping.text === 'Centered and still mine' && afterTyping.row === false, JSON.stringify(afterTyping));

  // ==========================================================================
  // S1/S3 — one component still, and the revision reached both surfaces.
  // ==========================================================================
  const styleOn = `(() => { const cs = getComputedStyle(document.querySelector('.wz-beginning'));
    const g = document.querySelector('.wz-beginning-glyph').getBoundingClientRect();
    return { font: cs.fontFamily, size: cs.fontSize, color: cs.color, dir: cs.flexDirection, glyph: Math.round(g.width) }; })()`;
  await freshPage(app, 'bg2-grammar-page', '', LAPTOP_W, 900);
  const pageStyle = await app.evalJs(styleOn);
  await freshBoard(app, 'bg2-grammar-board2', [], LAPTOP_W, 900);
  const boardStyle = await app.evalJs(styleOn);
  ok('S1/S3: the revision was made in ONE place and both surfaces inherited it — identical type, colour, stacking direction and glyph size on page and board',
    JSON.stringify(pageStyle) === JSON.stringify(boardStyle) && pageStyle.dir === 'column',
    JSON.stringify({ pageStyle, boardStyle }));

  // ==========================================================================
  // The token is slotted, not hardcoded: the one theme with DARK paper.
  // Disclosed fidelity note: the theme attributes are set directly on the root
  // rather than driven through the Themes UI — this asserts the TOKEN's
  // per-theme value and its measured contrast, not the theme picker's wiring
  // (which th1/th2 own).
  // ==========================================================================
  await app.evalJs("document.documentElement.setAttribute('data-theme','flux'); document.documentElement.setAttribute('data-page','dark')");
  await sleep(250);
  const darkContrast = await app.evalJs(CONTRAST_JS);
  const darkToken = await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--accent-door').trim()");
  ok(`S1: the door olive is SLOTTED, not hardcoded — on the one theme whose paper is dark it steps back up the same ramp (${darkToken}) and still measures ${darkContrast.ratio}:1 (>=4.5). A value that only worked on cream would be a trap laid for this theme`,
    darkToken === '#A9B56A' && darkContrast.ratio >= 4.5, JSON.stringify({ darkToken, darkContrast }));
  await app.evalJs("document.documentElement.removeAttribute('data-page'); document.documentElement.removeAttribute('data-theme')");

  // ==========================================================================
  // The 1366x768 leg — both rows at the small-laptop floor.
  // ==========================================================================
  await freshBoard(app, 'bg2-leg-board', [], LEG_W, LEG_H);
  const boardLeg = await app.evalJs(`(() => {
    const r = document.querySelector('.wz-beginnings').getBoundingClientRect();
    const c = document.querySelector('.board-canvas').getBoundingClientRect();
    const tops = [...document.querySelectorAll('.wz-beginning')].map((b) => Math.round(b.getBoundingClientRect().top));
    return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom),
      oneLine: new Set(tops).size === 1, vw: innerWidth, vh: innerHeight,
      midY: Math.round(r.top + r.height / 2), canvasMidY: Math.round(c.top + c.height / 2) };
  })()`);
  ok('1366x768 leg: the board row fits whole, stays on ONE line at the new size (four larger doors, no wrap), and stays centered',
    boardLeg.left >= 0 && boardLeg.right <= boardLeg.vw && boardLeg.top >= 0 && boardLeg.bottom <= boardLeg.vh &&
    boardLeg.oneLine === true && Math.abs(boardLeg.midY - boardLeg.canvasMidY) <= 2, JSON.stringify(boardLeg));

  await freshPage(app, 'bg2-leg-page', '', LEG_W, LEG_H);
  const pageLeg = await app.evalJs(`(() => {
    const r = document.querySelector('.wz-beginnings').getBoundingClientRect();
    const s = document.querySelector('.mode-page').getBoundingClientRect();
    const tops = [...document.querySelectorAll('.wz-beginning')].map((b) => Math.round(b.getBoundingClientRect().top));
    return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom),
      oneLine: new Set(tops).size === 1, vw: innerWidth, vh: innerHeight,
      midX: Math.round(r.left + r.width / 2), sheetMidX: Math.round(s.left + s.width / 2) };
  })()`);
  ok('1366x768 leg: the page row fits whole, stays on ONE line (three larger doors, no wrap), and stays centered on the sheet',
    pageLeg.left >= 0 && pageLeg.right <= pageLeg.vw && pageLeg.top >= 0 && pageLeg.bottom <= pageLeg.vh &&
    pageLeg.oneLine === true && Math.abs(pageLeg.midX - pageLeg.sheetMidX) <= 12, JSON.stringify(pageLeg));

  await app.typeKeys('At the leg too');
  await sleep(300);
  const legTyping = await app.evalJs(`({ text: (document.querySelector('.forward-only-editor')?.innerText || '').trim(), row: !!document.querySelector('.wz-beginnings') })`);
  ok('1366x768 leg: the writer still types immediately without touching the row at the new placement, and the row still goes when they do',
    legTyping.text === 'At the leg too' && legTyping.row === false, JSON.stringify(legTyping));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// BG2 parks nothing of its own. The two assertions it falsified belong to BG1
// and are parked in bg1.mjs at their own sites, quoted verbatim, naming this
// file as their live successor — in the same commit as the change that
// falsified them (the P2 standing invariant).
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nBG2 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; BG2 parks nothing of its own (its two parks live in bg1.mjs, which names this file as the successor).`
    : `\nBG2 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nBG2 VERIFY: PASS (${checks.length} checks)` : `\nBG2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
