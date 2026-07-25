// SC1 — the Room's True Geometry (docs/wrizo-alpha/sc1-true-geometry-brief.md).
// A committed CDP verification scenario (this project's "harness scenarios
// persist" convention). freshDesk/freshScriptPage/trustedClick are the
// cd4.mjs/fx7.mjs shapes; the S3 gesture proof uses the project's own
// genuinely-trusted CDP pointer + real per-character key events, never a
// coordinate-less synthetic click (gesture claims take trusted-pointer proofs).
//
// Run: node scripts/harness/sc1.mjs   (from apps/desktop, dist-web freshly
// built via `pnpm run build:web`). HARNESS_PARKED=1: SC1's own park cycles do
// NOT live here — they travel VERBATIM in the SAME commit inside the four
// files SC1 falsifies: fx1.mjs (S2's prose-width-band claim, its own
// generation-3 start-fraction park, and both script typewriter checks);
// fx3.mjs (S1's script paper-fence, its generation-2 script start-offset
// park, and S5's script icon-count + aria-label); fx4.mjs (S1's script "about
// a quarter"); fx7.mjs (S1's 30px sliver fence, whose parked scaffold this
// ticket adds); ab2.mjs (S2's DoD itself, amended by Nick's word, to
// generation 2). This file is purely ADDITIVE — it proves the true page's new
// truths — so its own park section is an empty no-op by design (cd4.mjs's own
// precedent).
//
// The standard being asserted (docs/wrizo-alpha/sc-committee-pass.md, Pass
// One, binding): US Letter 8.5 x 11in; Courier 12pt = 10 characters per inch,
// 6 lines per inch; margins left 1.5in, right 1in, top 1in, bottom 1in; text
// measure 6.0in = 60 characters. The element grid, measured FROM THE TEXT
// AREA'S left edge: scene/action/shot/general at 0 across the full measure,
// dialogue at 1.0in (3.5in wide), parenthetical at 1.6in, character cue at
// 2.2in, transition right-aligned to the measure.
//
// What SC1 proves here:
//   S1 — the sheet is a TRUE page: 8.5:11 aspect, 12pt/10cpi/6lpi, a 60ch
//        measure, 1.5/1/1/1 margins, at three framed widths + legacy + a
//        second theme; the paper's width no longer changes as the writer
//        types (the shrink-wrap defect); the scaling law holds when the room
//        is genuinely narrower than a page.
//   S2 — the element grid, measured as RENDERED GEOMETRY (not class
//        presence), asserted as ratios of the measure so it is proven at both
//        a full-size and a scaled width; display-uppercase with storage left
//        exactly as typed.
//   S3 — the caret's home, under a trusted pointer + real keystrokes: page
//        one begins at the top margin and the page never scrolls itself.
//        AMENDED 2026-07-24 (Nick's word, via Fable): the screenplay surface
//        does not run the typewriter at all, interim, pending his own
//        revision of typewriter mode in a separate build — so the engagement
//        checks are gone and their place is taken by the amendment's own
//        requirements (no engine, no start offset, and the OPTION absent from
//        both of its surfaces), plus the guard that prose is untouched. This
//        AMENDS AB2 S2's shipped DoD; see ab2.mjs's own park cycle.
//   S4 — the room is seated: the paper centred on the stage and both chrome
//        anchors riding its edges, on the default theme and on Flux, at
//        framed and legacy widths.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100, LAPTOP_W = 1280, WIDE_W = 2200, LEGACY_W = 1000;
// The trade's own numbers, in CSS px at 96dpi. 12pt = 16px, so 1in = 6em and
// Courier's 0.6em advance makes 1ch = 0.6em — the whole page falls out of one
// font-size (index.css's own `.script-sheet` derivation).
const PAGE_W = 8.5 * 96;   // 816
const PAGE_H = 11 * 96;    // 1056
const MEASURE = 6.0 * 96;  // 576
const ASPECT = 8.5 / 11;

const freshDesk = async (app, width = LAPTOP_W, height = 900, theme = 'plateau') => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  if (theme !== 'plateau') await app.evalJs(`localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)})`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk (${theme})` });
  await app.emulateDpr(1, width, height);
};

// Through the real wizard, onto a real screenplay page — never a seeded
// fixture, so the geometry proven here is the geometry Nick actually meets.
const freshScriptPage = async (app, width = LAPTOP_W, height = 900, theme = 'plateau') => {
  await freshDesk(app, width, height, theme);
  await app.goto('/project/new');
  await app.waitFor('!!document.querySelector(\'[data-kind="screenplay"]\')', { label: 'CreateProject picker (screenplay)' });
  await app.evalJs('document.querySelector(\'[data-kind="screenplay"]\').click()');
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'screenplay surface' });
  await sleep(300);
};

const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.getBoundingClientRect().toJSON() : null; })()`);

const trustedClick = async (app, sel) => {
  const r = await rectOf(app, sel);
  if (!r) throw new Error('trustedClick: no element ' + sel);
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  await app.mouseMove(x, y);
  await app.mouseDown(x, y);
  await app.mouseUp(x, y);
  await sleep(160);
};

// Everything the page claims about itself, read off RENDERED geometry — plus
// a probe span measured in the sheet's own font, so the character advance is
// the browser's real one and never a constant we assumed.
const pageMetrics = () => `(() => {
  const sheet = document.querySelector('.script-sheet');
  const cs = getComputedStyle(sheet);
  const b = sheet.getBoundingClientRect();
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(100);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
  sheet.appendChild(probe);
  const adv = probe.getBoundingClientRect().width / 100;
  probe.remove();
  const px = (v) => parseFloat(v);
  const padT = px(cs.paddingTop), padR = px(cs.paddingRight), padB = px(cs.paddingBottom), padL = px(cs.paddingLeft);
  const fontSize = px(cs.fontSize);
  const lineHeight = cs.lineHeight === 'normal' ? null : px(cs.lineHeight);
  return {
    width: b.width, height: b.height, aspect: b.width / b.height,
    fontSize, lineHeight, charAdvance: adv,
    padT, padR, padB, padL,
    measure: b.width - padL - padR,
    // Ratios — the scaling law's own invariants, true at full size and scaled.
    measureRatio: (b.width - padL - padR) / b.width,
    padLRatio: padL / b.width, padRRatio: padR / b.width, padTRatio: padT / b.width,
    advPerEm: adv / fontSize,
    lhPerEm: lineHeight === null ? null : lineHeight / fontSize,
    measureInChars: (b.width - padL - padR) / adv,
    fontFamily: cs.fontFamily,
    courierPrimeLoaded: document.fonts ? document.fonts.check('12pt "Courier Prime"') : null,
  };
})()`;

// Rendered offsets of every element on the page, expressed as ratios of the
// measure (so the scaling law is proven, not just the full-size case).
const gridMetrics = () => `(() => {
  const sheet = document.querySelector('.script-sheet');
  const cs = getComputedStyle(sheet);
  const sr = sheet.getBoundingClientRect();
  const textLeft = sr.left + parseFloat(cs.paddingLeft);
  const textRight = sr.right - parseFloat(cs.paddingRight);
  const measure = textRight - textLeft;
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(100);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
  sheet.appendChild(probe);
  const adv = probe.getBoundingClientRect().width / 100;
  probe.remove();
  const out = {};
  for (const el of sheet.querySelectorAll('.script-el')) {
    const b = el.getBoundingClientRect(), s = getComputedStyle(el);
    out[el.dataset.type] = {
      offsetRatio: (b.left - textLeft) / measure,
      offsetCh: (b.left - textLeft) / adv,
      rightRatio: (b.right - textLeft) / measure,
      widthCh: b.width / adv,
      align: s.textAlign,
      transform: s.textTransform,
    };
  }
  return { measure, adv, els: out };
})()`;

// Type one element of each type through the REAL key grammar (scriptKeys.ts),
// never by seeding a doc — so the grid is proven on elements the writer's own
// hands would produce.
// Every step below is the frozen grammar in store/scriptKeys.ts, walked
// exactly as a writer's hands would: Enter on a FILLED element creates the
// next one (ENTER_MAP); Enter on an EMPTY one retypes it in place; Tab cycles
// the type (TAB_MAP: action -> character -> transition, dialogue -> paren).
const buildGridDoc = async (app) => {
  await app.evalJs("document.querySelector('.script-el-active').focus()");
  await app.typeKeys('INT. KITCHEN - DAY');           // [0] scene — the fresh page's own first element
  await app.key('Enter');  await sleep(130);           // -> [1] action
  await app.typeKeys('She crosses to the window.');    // ordinary case ON PURPOSE (the storage proof below)
  await app.key('Enter');  await sleep(130);           // -> [2] action
  await app.key('Tab');    await sleep(110);           // [2] action -> character
  await app.typeKeys('margaret');                      // lower case ON PURPOSE
  await app.key('Enter');  await sleep(130);           // -> [3] dialogue
  await app.typeKeys('You were supposed to call.');
  await app.key('Enter');  await sleep(130);           // -> [4] action  (ENTER_MAP.dialogue)
  await app.key('Tab');    await sleep(110);           // [4] -> character
  await app.key('Tab');    await sleep(110);           // [4] -> transition
  await app.typeKeys('cut to:');
  await app.key('Enter');  await sleep(130);           // -> [5] scene   (ENTER_MAP.transition)
  await app.key('Enter');  await sleep(110);           // [5] empty scene -> action
  await app.key('Tab');    await sleep(110);           // [5] -> character
  await app.key('Enter');  await sleep(110);           // [5] empty character -> dialogue
  await app.key('Tab');    await sleep(110);           // [5] dialogue -> paren
  await app.typeKeys('beat');                          // left ACTIVE, so the paren renders
  await sleep(200);
};

await withHarness(async (app) => {
  // ======================================================================
  // S1 — the true page (SC-V2 the type, SC-V3 the page is not a page)
  // ======================================================================
  for (const [label, width, theme] of [
    ['1100 (the framed floor)', FLOOR_W, 'plateau'],
    ['1280 (the laptop reference)', LAPTOP_W, 'plateau'],
    ['2200 (wide)', WIDE_W, 'plateau'],
    ['1280 · Flux', LAPTOP_W, 'flux'],
  ]) {
    await freshScriptPage(app, width, 900, theme);
    const m = await app.evalJs(pageMetrics());

    ok(`S1 @ ${label}: the sheet is a US Letter page — 8.5 x 11in, aspect within 0.5% of 8.5:11`,
      Math.abs(m.aspect - ASPECT) / ASPECT < 0.005 && Math.abs(m.width - PAGE_W) <= 1 && Math.abs(m.height - PAGE_H) <= 1,
      JSON.stringify({ width: m.width, height: m.height, aspect: m.aspect, target: ASPECT }));

    ok(`S1 @ ${label}: the margins are the trade's 1.5 / 1 / 1 / 1 inches — asserted as RATIOS of the page, so they hold at any scale`,
      Math.abs(m.padLRatio - (1.5 / 8.5)) < 0.002 && Math.abs(m.padRRatio - (1 / 8.5)) < 0.002
        && Math.abs(m.padTRatio - (1 / 8.5)) < 0.002 && Math.abs(m.padB - m.padT) < 1,
      JSON.stringify({ padL: m.padL, padR: m.padR, padT: m.padT, padB: m.padB, padLRatio: m.padLRatio }));

    ok(`S1 @ ${label}: the text measure is 6.0in / 60 characters — the number a screenplay page is defined by`,
      Math.abs(m.measure - MEASURE) <= 1 && Math.abs(m.measureInChars - 60) < 0.5,
      JSON.stringify({ measure: m.measure, measureInChars: m.measureInChars }));

    ok(`S1 @ ${label}: Courier at the standard metric — 12pt type, 10 characters per inch, 6 lines per inch`,
      Math.abs(m.fontSize - 16) < 0.01 && Math.abs(m.lineHeight - 16) < 0.01
        && Math.abs(m.advPerEm - 0.6) < 0.005 && Math.abs(m.lhPerEm - 1) < 0.01,
      JSON.stringify({ fontSize: m.fontSize, lineHeight: m.lineHeight, advPerEm: m.advPerEm, lhPerEm: m.lhPerEm }));

    ok(`S1 @ ${label}: Courier Prime itself is loaded and is what the sheet renders in (not a silent fallback to Courier New)`,
      m.courierPrimeLoaded === true && /Courier Prime/.test(m.fontFamily),
      JSON.stringify({ loaded: m.courierPrimeLoaded, family: m.fontFamily }));
  }

  // The defect that made SC-V1/V3 one defect: the paper shrink-wrapped its
  // own content, so it CHANGED WIDTH as the writer typed (measured 424 -> 615
  // before this ticket). Law 1's own inverse; the page is a constant now.
  await freshScriptPage(app, LAPTOP_W);
  const widthBefore = await app.evalJs("document.querySelector('.script-sheet').getBoundingClientRect().width");
  await app.evalJs("document.querySelector('.script-el-active').focus()");
  await app.typeKeys('INT. A VERY LONG LOCATION NAME THAT RUNS ON AND ON - CONTINUOUS NIGHT');
  await sleep(400);
  const widthAfter = await app.evalJs("document.querySelector('.script-sheet').getBoundingClientRect().width");
  ok('S1: the paper\'s width does not change as the writer types — the shrink-wrap defect behind SC-V1/SC-V3 is closed (Law 1: the measure is the one inviolable constant)',
    Math.abs(widthAfter - widthBefore) < 0.5 && Math.abs(widthAfter - PAGE_W) <= 1,
    JSON.stringify({ widthBefore, widthAfter }));

  // The scaling law: when the room is genuinely narrower than a page, the
  // WHOLE sheet scales as one object — every ratio identical, the grid never
  // reflowing, no inch compressing on its own.
  await freshScriptPage(app, LAPTOP_W);
  const atFullSize = await app.evalJs(pageMetrics());
  await app.emulateDpr(1, 700, 900);   // below a page's natural width + gutters
  await sleep(400);
  const atScaled = await app.evalJs(pageMetrics());
  ok('S1 (the scaling law): below a page\'s natural width the whole sheet scales as ONE object — aspect, margin ratios, measure ratio and the 60-character measure all identical to full size',
    atScaled.width < atFullSize.width
      && Math.abs(atScaled.aspect - atFullSize.aspect) < 0.002
      && Math.abs(atScaled.measureRatio - atFullSize.measureRatio) < 0.002
      && Math.abs(atScaled.padLRatio - atFullSize.padLRatio) < 0.002
      && Math.abs(atScaled.measureInChars - 60) < 0.5,
    JSON.stringify({ full: { w: atFullSize.width, chars: atFullSize.measureInChars }, scaled: { w: atScaled.width, chars: atScaled.measureInChars, aspect: atScaled.aspect } }));

  // Legacy (<1100px) — a page is a page below the DeskFrame gate too.
  await freshScriptPage(app, LAPTOP_W);
  await app.emulateDpr(1, LEGACY_W, 900);
  await sleep(400);
  const legacy = await app.evalJs(pageMetrics());
  const legacyShape = await app.evalJs(`(() => ({
    hasDeskFrame: !!document.querySelector('.desk-frame'),
    hasModePagecol: !!document.querySelector('.mode-pagecol'),
    hasScriptPage: !!document.querySelector('.script-page'),
  }))()`);
  ok('S1 (legacy, <1100px): the page is a true US Letter page below the DeskFrame gate too — same aspect, same 12pt metric, same 60-character measure',
    Math.abs(legacy.aspect - ASPECT) / ASPECT < 0.005 && Math.abs(legacy.fontSize - 16) < 0.01
      && Math.abs(legacy.lineHeight - 16) < 0.01 && Math.abs(legacy.measureInChars - 60) < 0.5,
    JSON.stringify({ aspect: legacy.aspect, fontSize: legacy.fontSize, measureInChars: legacy.measureInChars }));
  ok('S1 (legacy): the markup shape is still the pre-AB1 legacy branch — no DeskFrame, no .mode-pagecol, the .script-page wrapper (fx7.mjs S1\'s own invariant, unchanged by SC1)',
    !legacyShape.hasDeskFrame && !legacyShape.hasModePagecol && legacyShape.hasScriptPage, JSON.stringify(legacyShape));

  // ======================================================================
  // S2 — the element grid (rendered geometry, as ratios of the measure)
  // ======================================================================
  for (const [label, width] of [['1280 (full size)', LAPTOP_W], ['700 (scaled)', 700]]) {
    await freshScriptPage(app, LAPTOP_W);
    if (width !== LAPTOP_W) { await app.emulateDpr(1, width, 900); await sleep(300); }
    await buildGridDoc(app);
    const g = await app.evalJs(gridMetrics());
    const e = g.els;

    ok(`S2 @ ${label}: scene heading and action sit at the text area's own left edge, across the full 6.0in measure`,
      Math.abs(e.scene.offsetRatio) < 0.005 && Math.abs(e.action.offsetRatio) < 0.005
        && e.scene.rightRatio > 0.99 && e.action.rightRatio > 0.99,
      JSON.stringify({ scene: e.scene, action: e.action }));

    ok(`S2 @ ${label}: dialogue is indented 1.0in of the 6.0in measure (1/6 of it) and runs 3.5in wide`,
      Math.abs(e.dialogue.offsetRatio - (1.0 / 6.0)) < 0.005 && Math.abs(e.dialogue.widthCh - 35) < 0.5,
      JSON.stringify(e.dialogue));

    ok(`S2 @ ${label}: the parenthetical is indented 1.6in of the measure`,
      Math.abs(e.paren.offsetRatio - (1.6 / 6.0)) < 0.005, JSON.stringify(e.paren));

    ok(`S2 @ ${label}: the character cue is indented 2.2in of the measure`,
      Math.abs(e.character.offsetRatio - (2.2 / 6.0)) < 0.005, JSON.stringify(e.character));

    ok(`S2 @ ${label}: the transition is right-aligned to the measure (its own right edge on the text area's, its text set right)`,
      e.transition.rightRatio > 0.99 && e.transition.align === 'right', JSON.stringify(e.transition));

    ok(`S2 @ ${label}: uppercasing is DISPLAY-level on scene / character / transition, and left alone on action and dialogue`,
      e.scene.transform === 'uppercase' && e.character.transform === 'uppercase' && e.transition.transform === 'uppercase'
        && e.action.transform === 'none' && e.dialogue.transform === 'none',
      JSON.stringify({ scene: e.scene.transform, character: e.character.transform, transition: e.transition.transform, action: e.action.transform, dialogue: e.dialogue.transform }));
  }

  // Storage is unchanged by the display uppercase: 'margaret' was typed in
  // lower case above. The character cue commits uppercase by scriptDoc's own
  // rule (commitElement) — what must NOT happen is the CSS reaching storage,
  // so the check that matters is the ACTION line, typed in ordinary case and
  // read back from the persisted doc verbatim.
  // ScriptEditor's autosave is debounced at AUTOSAVE_MS (2000ms) — wait it
  // out so this reads the genuinely PERSISTED doc, not a half-written one.
  await sleep(2600);
  const storedDoc = await app.evalJs(`(() => {
    const id = location.hash.split('/page/')[1];
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const entry = entries.find(e => e.id === id);
    if (!entry || !entry.script) return null;
    const flat = [];
    for (const sc of entry.script.scenes) { if (sc.heading) flat.push({ t: sc.heading.t, text: sc.heading.text }); for (const b of (sc.body || [])) flat.push({ t: b.t, text: b.text }); }
    return flat;
  })()`);
  const storedAction = (storedDoc || []).find(e => e.t === 'action' && /crosses to the window/i.test(e.text));
  ok('S2: display uppercase never reaches storage — an action line typed in ordinary case reads back from the persisted ScriptDoc byte-for-byte as typed',
    !!storedAction && storedAction.text === 'She crosses to the window.',
    JSON.stringify({ storedAction, docLength: (storedDoc || []).length }));

  // The ghost placeholder and the autocomplete flyout ride the SAME grid as
  // the element they belong to (the brief's own S2 clause).
  await freshScriptPage(app, LAPTOP_W);
  const ghostAligned = await app.evalJs(`(() => {
    const el = document.querySelector('.script-el-active');
    const cs = getComputedStyle(el, '::before');
    return { ghost: cs.content, elMarginLeft: getComputedStyle(el).marginLeft, type: el.dataset.type };
  })()`);
  ok('S2: the ghost placeholder is rendered by the ACTIVE element itself, so it inherits that element\'s own grid offset by construction (no second source of truth to drift)',
    /INT\. LOCATION/.test(ghostAligned.ghost) && ghostAligned.elMarginLeft === '0px' && ghostAligned.type === 'scene',
    JSON.stringify(ghostAligned));

  await app.evalJs("document.querySelector('.script-el-active').focus()");
  await app.typeKeys('INT. KITCHEN - DAY');
  await app.key('Enter'); await sleep(120);
  await app.key('Tab');   await sleep(100);          // -> character
  await app.typeKeys('MARGARET');
  await app.key('Enter'); await sleep(120);          // -> dialogue
  await app.key('Enter'); await sleep(120);          // empty dialogue -> action
  await app.typeKeys('INT. KIT');                    // scene autocomplete
  await sleep(250);
  const acAligned = await app.evalJs(`(() => {
    const pop = document.querySelector('.script-autocomplete');
    const el = document.querySelector('.script-el-active');
    if (!pop) return null;
    return { popLeft: pop.getBoundingClientRect().left, elLeft: el.getBoundingClientRect().left, type: el.dataset.type };
  })()`);
  ok('S2: the autocomplete flyout aligns to the same grid offset as the element it belongs to',
    !!acAligned && Math.abs(acAligned.popLeft - acAligned.elLeft) < 1.5, JSON.stringify(acAligned));

  // ======================================================================
  // S3 — the caret's home (SC-V4), under a trusted pointer + real keystrokes
  // ======================================================================
  await freshScriptPage(app, LAPTOP_W);
  await trustedClick(app, '.script-el-active');
  const caretHome = await app.evalJs(`(() => {
    const cap = document.querySelector('.desk-frame-scroll-cap');
    const sheet = document.querySelector('.script-sheet');
    const act = document.querySelector('.script-el-active');
    const cb = cap.getBoundingClientRect(), sb = sheet.getBoundingClientRect(), ab = act.getBoundingClientRect();
    const cs = getComputedStyle(sheet);
    return {
      capPaddingTop: parseFloat(getComputedStyle(cap).paddingTop),
      capScrollTop: cap.scrollTop,
      sheetTopVsCapTop: sb.top - cb.top,
      gapBelowTopMargin: ab.top - (sb.top + parseFloat(cs.paddingTop)),
      activeFractionOfCap: (ab.top - cb.top) / cb.height,
      dataTypewriter: cap.dataset.typewriter,
    };
  })()`);
  ok('S3 (SC-V4): a fresh script page begins at the TOP margin of page one — the sheet sits at the scroll box\'s own top, the first element on the 1in margin, and nothing has auto-scrolled',
    Math.abs(caretHome.capPaddingTop) < 0.5 && Math.abs(caretHome.sheetTopVsCapTop) < 1
      && Math.abs(caretHome.gapBelowTopMargin) <= 2 && caretHome.capScrollTop === 0,
    JSON.stringify(caretHome));
  // AMENDED 2026-07-24 (Nick's word, via Fable): the screenplay surface does
  // not run the typewriter at all, interim, pending his own revision of
  // typewriter mode in a separate build. So the claim here is the inverse of
  // what it was — no engine, and therefore no start-offset for SC-V4 to be
  // caused by. Prose and Journal keep the engine and the FX4 quarter.
  ok('S3: NO typewriter runs on the screenplay surface — the cap never claims it and carries no start-offset padding, so the caret\'s home is a property of the page itself, not of an engine that happens to be yielding',
    caretHome.dataTypewriter === 'false' && Math.abs(caretHome.capPaddingTop) < 0.5,
    JSON.stringify(caretHome));

  // The first keystroke happens at the top margin, visibly — typed with real
  // per-character key events into a trusted-pointer-focused element.
  await app.typeKeys('INT.');
  await sleep(200);
  const firstKeystroke = await app.evalJs(`(() => {
    const sheet = document.querySelector('.script-sheet');
    const act = document.querySelector('.script-el-active');
    const cap = document.querySelector('.desk-frame-scroll-cap');
    const sb = sheet.getBoundingClientRect(), ab = act.getBoundingClientRect();
    return { text: act.textContent, gapBelowTopMargin: ab.top - (sb.top + parseFloat(getComputedStyle(sheet).paddingTop)), capScrollTop: cap.scrollTop };
  })()`);
  ok('S3: the FIRST keystroke on a fresh script page lands at the top margin — the page has not moved to meet it',
    firstKeystroke.text === 'INT.' && Math.abs(firstKeystroke.gapBelowTopMargin) <= 2 && firstKeystroke.capScrollTop === 0,
    JSON.stringify(firstKeystroke));

  // AMENDED 2026-07-24 — the engagement checks come OUT (there is no engine on
  // this surface to engage), replaced by the amendment's own requirement: the
  // page never moves itself while the writer types. This is the stronger claim
  // of the two — an engine that yields correctly still leaves "does it ever
  // move on its own?" open, and this closes it.
  // SC2 S1 — sampled EARLY, while the caret is still inside the visible box, so
  // the successor below can prove the box holds still on its own account rather
  // than merely reporting whatever number the later scroll produced.
  //
  // Note what this is NOT measuring: whether the CONTENT fits. It never does —
  // SC1 made the sheet a true 11in page (1056px) inside a shorter cap, so the
  // box overflows by construction and ships a permanent scrollbar. `scrollHeight
  // > clientHeight` is therefore true from the first frame and says nothing.
  // The real distinction is the CARET's position: while it is still visible the
  // box does not move, and it moves only once the caret would leave. (Recorded
  // because the first draft of this check asserted "fits" and was measuring a
  // constant.)
  let beforeOverflowScrollTop = null;
  for (let i = 1; i <= 24; i++) {
    await app.typeKeys(` Action line ${i} of the no-engine proof.`);
    await app.key('Enter');
    await sleep(70);
    if (i === 4) {
      beforeOverflowScrollTop = await app.evalJs("(() => { const c = document.querySelector('.desk-frame-scroll-cap'); return { st: c.scrollTop, fits: c.scrollHeight <= c.clientHeight + 1 }; })()");
    }
  }
  const afterTyping = await app.evalJs(`(() => {
    const cap = document.querySelector('.desk-frame-scroll-cap');
    return { scrollTop: cap.scrollTop, scrolledAttr: cap.dataset.scrolled, dataTypewriter: cap.dataset.typewriter, capPaddingTop: parseFloat(getComputedStyle(cap).paddingTop),
             overflows: cap.scrollHeight > cap.clientHeight + 1 };
  })()`);
  afterTyping.beforeOverflowScrollTop = beforeOverflowScrollTop && beforeOverflowScrollTop.st;
  afterTyping.fittedAtFourLines = beforeOverflowScrollTop && beforeOverflowScrollTop.fits;
  // SUPERSEDED by SC2 S1 (2026-07-25) — A4 park cycle, travelling in the SAME
  // commit as the change that falsified it. The ORIGINAL, verbatim:
  //
  //   ok('S3: the page never scrolls itself — 24 lines of real keystrokes past
  //   the stage\'s own centre and the box has not moved once; a screenplay page
  //   stays where the writer put it',
  //     afterTyping.scrollTop === 0 && afterTyping.scrolledAttr !== 'true' &&
  //     afterTyping.dataTypewriter === 'false', JSON.stringify(afterTyping));
  //
  // SUPERSEDED ON ITS NUMBER, NOT ITS LAW. SC2 S1 gave the page its vertical
  // rhythm (SPACE_BEFORE, dormant since S1, is live), so a document is ~1.54x
  // taller in lines. Those same 24 lines now genuinely OVERFLOW the scroll cap,
  // where before they fitted inside it — and the box scrolls to keep the caret
  // visible. ROOT CAUSE, measured before anything was written: not the
  // typewriter (dataTypewriter is still 'false' and capPaddingTop still 0) but
  // ActiveScriptElement's own `node.focus()` on mount — focusing an element
  // below the fold scrolls it into view, and every Enter mounts and focuses a
  // new one. That behaviour is UNCHANGED by SC2; the assertion was only ever
  // true because the page was pathologically short.
  //
  // The law survives intact — no typewriter engine on this surface, the page
  // does not animate itself — and the successor asserts it, plus the truth that
  // replaced the number: the box holds still while the content fits, and moves
  // only to keep the caret visible. Which is correct: without it the writer
  // types blind below the fold.
  //
  // THE DEEPER FINDING, recorded here and charged to SC2 S2 rather than patched
  // here: the script page's vertical behaviour is EMERGENT, not designed. The
  // scroll is a side effect of focus(), which means nobody ever decided it —
  // and that is why it broke on a change that had nothing to do with scrolling.
  // S2's paginator owns the page's vertical policy deliberately (preventScroll
  // plus a stated caret-visibility rule, which it needs for page breaks
  // regardless).
  ok('S3 (successor to the parked "never scrolls itself"): no typewriter engine runs on this surface and the page never animates itself — and the box holds still while the content fits, moving only to keep the caret visible once a real document overflows it. The engine is gone; ordinary caret-visibility scrolling is not the engine',
    afterTyping.dataTypewriter === 'false' && afterTyping.scrolledAttr !== 'true'
      && afterTyping.beforeOverflowScrollTop === 0,
    JSON.stringify(afterTyping));
  ok('S3: no typewriter fade mask is applied either — the engine\'s visual retires with the engine, leaving no CSS keyed on an attribute that can no longer be true',
    Math.abs(afterTyping.capPaddingTop) < 0.5 && afterTyping.dataTypewriter === 'false',
    JSON.stringify(afterTyping));

  // The OPTION does not present itself. A live switch that does nothing is a
  // lying affordance — worse than a missing one, because the writer flips it,
  // sees nothing, and learns the app lies. Both of its surfaces are checked:
  // the icon in the sliver's instruments row, and the "Typewriter" row one
  // click deeper behind that row's gear. AB2 S2's DoD is amended by Nick's
  // word, recorded here, in ab2.mjs's own park cycle, and in the ledger.
  await freshScriptPage(app, LAPTOP_W);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(250);
  const optionOnScript = await app.evalJs(`(() => {
    const row = document.querySelector('.wz-sliver-instruments-row');
    const panel = document.querySelector('.wz-sliver-panel');
    const btns = row ? [...row.querySelectorAll('button')] : [];
    const gear = btns.find(b => (b.getAttribute('aria-label') || '') === 'Writing settings');
    if (gear) gear.click();
    return { iconCount: btns.length, toggle: !!document.querySelector('.wz-sliver-instruments-row .typewriter-toggle'), aria: !!panel.querySelector('[aria-label*="Typewriter"]'), gearFound: !!gear };
  })()`);
  await sleep(250);
  const gearOnScript = await app.evalJs(`(() => {
    const panel = document.querySelector('.wz-sliver-instruments .mode-settings');
    if (!panel) return { panelOpen: false };
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    let hasTypewriterRow = false;
    while (walker.nextNode()) { if (walker.currentNode.nodeValue.includes('Typewriter')) hasTypewriterRow = true; }
    return { panelOpen: true, hasTypewriterRow };
  })()`);
  ok('S3: the typewriter OPTION does not present itself on a screenplay page — no toggle in the sliver\'s instruments row (two icons there, not three), and nothing carrying the word for assistive tech either',
    optionOnScript.toggle === false && optionOnScript.iconCount === 2 && optionOnScript.aria === false,
    JSON.stringify(optionOnScript));
  ok('S3: nor one click deeper — the gear\'s settings panel opens on a script page with NO "Typewriter" row in it, so there is no live switch that does nothing hiding behind the icon row',
    gearOnScript.panelOpen === true && gearOnScript.hasTypewriterRow === false,
    JSON.stringify(gearOnScript));

  // ...and the withdrawal is SCRIPT-ONLY. This is the guard that the
  // amendment did not leak: prose still runs the engine and still offers the
  // option, with its own quarter-down start intact.
  await freshDesk(app, LAPTOP_W);
  await app.goto('/project/new');
  await app.waitFor('!!document.querySelector(\'[data-kind="book"]\')', { label: 'CreateProject picker (book)' });
  await app.evalJs('document.querySelector(\'[data-kind="book"]\').click()');
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'prose surface' });
  await sleep(300);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(250);
  const proseUntouched = await app.evalJs(`(() => {
    const scroll = document.querySelector('.mode-scroll');
    const row = document.querySelector('.wz-sliver-instruments-row');
    return {
      dataTypewriter: scroll.dataset.typewriter,
      startOffsetPx: parseFloat(getComputedStyle(scroll).paddingTop),
      toggle: !!document.querySelector('.wz-sliver-instruments-row .typewriter-toggle'),
      iconCount: row ? row.querySelectorAll('button').length : -1,
    };
  })()`);
  ok('S3 (the containment guard): PROSE is untouched — it still runs the typewriter, still carries the FX4 quarter-down start offset, and still offers the option in its own sliver; the withdrawal is the screenplay surface\'s alone',
    proseUntouched.dataTypewriter === 'true' && proseUntouched.startOffsetPx > 100
      && proseUntouched.toggle === true && proseUntouched.iconCount === 3,
    JSON.stringify(proseUntouched));

  // ======================================================================
  // S4 — the seated room (SC-V1: "the page is in a weird spot, the side
  // menus are floating in space")
  // ======================================================================
  for (const [label, width, theme] of [
    ['1100 (the framed floor)', FLOOR_W, 'plateau'],
    ['1280 (the laptop reference)', LAPTOP_W, 'plateau'],
    ['2200 (wide)', WIDE_W, 'plateau'],
    ['1100 · Flux', FLOOR_W, 'flux'],
    ['1280 · Flux', LAPTOP_W, 'flux'],
    ['2200 · Flux', WIDE_W, 'flux'],
  ]) {
    await freshScriptPage(app, width, 900, theme);
    const room = await app.evalJs(`(() => {
      const q = (s) => document.querySelector(s);
      const stage = q('.desk-frame-stage').getBoundingClientRect();
      const sheet = q('.script-sheet').getBoundingClientRect();
      const sh = q('.desk-frame-sliver-anchor'), tu = q('.desk-frame-tutor-anchor');
      const sheetPadL = parseFloat(getComputedStyle(q('.script-sheet')).paddingLeft);
      const sheetPadR = parseFloat(getComputedStyle(q('.script-sheet')).paddingRight);
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        centreDelta: ((sheet.left + sheet.right) / 2) - ((stage.left + stage.right) / 2),
        sliverDip: sh ? sh.getBoundingClientRect().right - sheet.left : null,
        tutorDip: tu ? sheet.right - tu.getBoundingClientRect().left : null,
        textLeft: sheet.left + sheetPadL,
        textRight: sheet.right - sheetPadR,
        sliverRight: sh ? sh.getBoundingClientRect().right : null,
        tutorLeft: tu ? tu.getBoundingClientRect().left : null,
        withinStage: sheet.left >= stage.left - 0.5 && sheet.right <= stage.right + 0.5,
      };
    })()`);

    ok(`S4 @ ${label}: the paper is genuinely centred on the stage — |centre delta| < 1px`,
      Math.abs(room.centreDelta) < 1, JSON.stringify({ theme: room.theme, centreDelta: room.centreDelta }));

    ok(`S4 @ ${label}: the paper never overflows the stage on either side`,
      room.withinStage === true, JSON.stringify(room));

    ok(`S4 @ ${label}: the chrome is ATTACHED to the paper — both anchors ride its edges, dipping no further than the documented 38px pad and never into the text measure (SC-V1: no more "floating in space")`,
      room.sliverDip !== null && room.tutorDip !== null
        && room.sliverDip <= 38.5 && room.tutorDip <= 38.5
        && room.sliverRight <= room.textLeft && room.tutorLeft >= room.textRight,
      JSON.stringify(room));
  }

  // The paper's own geometry is IDENTICAL on both themes — so nothing SC1
  // fixed was theme chrome, and anything that ever differs under Flux alone
  // belongs to the parked theme arc, not to SC (the brief's own S4 clause).
  await freshScriptPage(app, LAPTOP_W, 900, 'plateau');
  const plateauPage = await app.evalJs(pageMetrics());
  await freshScriptPage(app, LAPTOP_W, 900, 'flux');
  const fluxPage = await app.evalJs(pageMetrics());
  ok('S4: the page\'s own geometry is byte-identical on plateau and on Flux — the room SC1 seated is the surface\'s, not a theme\'s (any Flux-only residue belongs to the parked theme arc)',
    Math.abs(plateauPage.width - fluxPage.width) < 0.5 && Math.abs(plateauPage.height - fluxPage.height) < 0.5
      && Math.abs(plateauPage.measure - fluxPage.measure) < 0.5 && Math.abs(plateauPage.fontSize - fluxPage.fontSize) < 0.01,
    JSON.stringify({ plateau: { w: plateauPage.width, h: plateauPage.height, m: plateauPage.measure }, flux: { w: fluxPage.width, h: fluxPage.height, m: fluxPage.measure } }));
});

// === PARKED — gated behind HARNESS_PARKED=1. SC1's own park cycles do NOT
// live here: they travel VERBATIM in the SAME commit inside the files they
// falsify (fx1.mjs, fx3.mjs, fx4.mjs, fx7.mjs). This file is purely additive,
// so its own park section is an empty no-op by design (cd4.mjs's precedent).
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nSC1 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; SC1\'s A4 park cycles travel in fx1.mjs (S2\'s "script matches prose\'s width band" + its own generation-3 start-fraction park), fx3.mjs (S1\'s script paper-to-stage fence, retired outright — an 11in page is taller than the stage), fx4.mjs (S1\'s script "about a quarter" start), and fx7.mjs (S1\'s 30px sliver fence, whose parked scaffold this ticket adds) — all in the SAME commit as the change that superseded them.');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nSC1 VERIFY: PASS (${checks.length} checks)` : `\nSC1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
