// ITEM 83 ERRATA — THE WALKTHROUGH WAVE (E1 fade timing · E2 layout · E4 kind
// placeholders). Brief: docs/menus/item83-errata-build-brief.md.
// Survey it was built on: docs/menus/item83-errata-s0-survey.md.
//
// This file is the errata wave's own acceptance instrument. It sits beside
// item83e.mjs (the previous errata's two-drawer repair) rather than inside it:
// that file's subject is the exclusion handoff, and nothing here touches it.
//
// WHAT EACH SECTION IS AIMED AT
//
// E1 — POP-OUTS FADE ON WRITTEN WORDS, NEVER ON A CLOCK. Nick's ruling: a foot
// pop-out fades only after FIFTEEN WORDS have been written, or a PERIOD has
// been entered, counted from the moment it opened. Idle never fades it.
//   The defect it replaces, as surveyed rather than remembered: the pop-out had
//   no fade of its own and no timer of its own. It is a child of
//   `.wz-sliver-panel`, which carries `chrome-fade desk-dissolve`, so it rode
//   the room's ambient dissolve — armed by useChromeDissolve.noteWrite() on the
//   FIRST forward keystroke and receding over FADE_OUT_S = 2.8s. One character
//   and the tray was gone.
//   S1 reproduces that first keystroke and proves the tray now survives it
//   WHILE THE ROOM GENUINELY DISSOLVES (the control that stops "the fade simply
//   never fired in a headless browser" from passing as a fix). S2 walks the
//   count to its boundary — fourteen words HELD, the fifteenth RELEASES — which
//   is the only evidence the number is 15 and not "any typing at all". S3 does
//   the period independently. S4 is the guard on Nick's other half: with NO
//   tray open, the drawer still recedes on the first keystroke exactly as it
//   always did, so the repair cannot be "just never fade anything". S5 proves
//   no second fade was authored, by measuring that the panel's own transition
//   is byte-identical held and unheld.
//
// E2 — STRUCTURE AT THE TAB'S FOOT; FULL SCREEN ON THE PROGRESS BAR'S LINE.
// The measured half is Full Screen: its vertical centre and the progress
// hairline's must agree within 0.6px, at both reference widths, BY LAYOUT.
// Recorded honestly, and repeated in the offer: the Structure half was ALREADY
// true at the branch point (S0 (c)), so its assertion here is a GUARD — that
// E4's new buttons land inside Structure and that Structure never drifts below
// the foot — not evidence that E2 moved it.
//
// E4 — THE KIND BUTTONS AND THE STYLE GUIDES. Placeholders only: they render,
// they persist per page, nothing downstream is wired. The checks that matter
// are the ones a placeholder can still get wrong — that the style guides are
// DISCLOSED by Research rather than greyed, that the selection survives a
// reload (it is on the page, not in a component), and that a page's KIND does
// NOT leak into the writer's per-user page defaults, which is the one real
// defect the shared PageSettings shape invites (S0 (e)).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Copied from fx3.mjs's own current helpers (itself byte-identical to
// fx2/cd1's) — the house fixture, seeding `wrizo-first-run-complete` so HB1's
// gate never interferes.
const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

const openSliver = (app) => app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");

// A fresh, framed script page — the same fixture fx3.mjs/cd1.mjs use, kept
// byte-for-byte rather than re-derived (it is a raw seed made from the Desk,
// which is exactly the shape AGENTS.md's ordering rule covers).
const freshScriptPage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const headingId = 'i83f-script-heading';
    entries.push({ id: 'i83f-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] }] }, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after script seed' });
  await app.evalJs("location.hash = '#/page/i83f-script'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Script framed' });
  await sleep(300);
};

// Draft is a MODE of the same page, reached through the strip the writer uses —
// never by writing the mode key into localStorage, which would prove only that
// the store round-trips. The re-persist after a mode switch is measured late
// (~1100ms on this box), so this waits on the RENDERED result, not a sleep.
const toDraft = async (app) => {
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft')?.click()");
  await app.waitFor("!!document.querySelector('.wz-sliver-structure')", { label: 'Draft sliver Structure zone' });
  await sleep(250);
};

// Open a foot pop-out BY NAME, never by ordinal — fx3.mjs's own parked driver
// is the standing warning about counting to a control in a foot whose roster a
// ruling can change (and this wave changes it again).
const openPopout = async (app, label) => {
  await app.evalJs(`(() => {
    const row = document.querySelector('.wz-sliver-instruments-row');
    if (!row) return false;
    const b = [...row.querySelectorAll('button')].find(x => (x.getAttribute('aria-label') || '').startsWith(${JSON.stringify(label)}));
    if (b) b.click();
    return !!b;
  })()`);
  await sleep(220);
};

const FOOT_STATE = `(() => {
  const panel = document.querySelector('.wz-sliver-panel');
  const cs = getComputedStyle(panel);
  return {
    frameWriting: document.querySelector('.desk-frame')?.dataset.writing,
    popoutHold: panel.dataset.popoutHold,
    trayPresent: !!document.querySelector('[data-menus-popout]'),
    pointerEvents: cs.pointerEvents,
    opacity: cs.opacity,
  };
})()`;

// Settle-poll rather than one fixed sleep: the recede runs over --fade-dur
// (2.8s on a write), and racing a numeric threshold against a live transition
// is what made fx3's own first draft of this check flaky.
const settle = async (app, predicate) => {
  let last = null;
  for (let i = 0; i < 25; i++) {
    last = await app.evalJs(FOOT_STATE);
    if (predicate(last)) return last;
    await sleep(200);
  }
  return last;
};

const focusEditor = (app) => app.evalJs("document.querySelector('.forward-only-editor').focus()");

// Click a Draft format button BY TITLE — the roster is long and a ruling can
// reorder it, so counting to one is the failure mode fx3's own parked driver
// already recorded. The row's own onMouseDown preventDefault keeps the caret,
// exactly as a writer's own click does.
const clickFormat = async (app, title) => {
  await app.evalJs(`(() => {
    const b = [...document.querySelectorAll('.wz-sliver-format .mode-tbtn')].find(x => x.getAttribute('title') === ${JSON.stringify(title)});
    if (b) b.click();
    return !!b;
  })()`);
  await sleep(250);
};

// Words, spelled out so a reader can count them against the ruling.
const W = (n) => Array.from({ length: n }, (_, i) => `w${i + 1}`).join(' ') + ' ';

await withHarness(async (app) => {
  // ==========================================================================
  // E1 S1 — THE FIRST KEYSTROKE NO LONGER TAKES THE TRAY (and the room really
  // does dissolve underneath it).
  // ==========================================================================
  await freshProsePage(app, 1400, 900);
  await openSliver(app);
  await sleep(250);
  await openPopout(app, 'Typewriter');

  const atOpen = await app.evalJs(FOOT_STATE);
  ok('E1 S1: a foot pop-out opens HELD — the tray is present and the panel is flagged data-popout-hold="true" before a single character is typed',
    atOpen.trayPresent === true && atOpen.popoutHold === 'true', JSON.stringify(atOpen));

  await focusEditor(app);
  await app.typeKeys('alpha ');
  await sleep(600);
  const afterOne = await app.evalJs(FOOT_STATE);
  ok('E1 S1: ONE word typed — the room genuinely dissolves (data-writing="true") and the tray SURVIVES it, opaque and interactive; this is the exact keystroke that used to take it',
    afterOne.frameWriting === 'true' && afterOne.popoutHold === 'true'
      && afterOne.pointerEvents === 'auto' && parseFloat(afterOne.opacity) > 0.9,
    JSON.stringify(afterOne));

  // IDLE NEVER FADES IT — the ruling's own clause. There is no timer in the
  // gate at all, so this cannot fail by construction against THIS build; it
  // fails loudly against any future build that reintroduces one, which is the
  // only reason to spend the three seconds.
  await sleep(3200);
  const afterIdle = await app.evalJs(FOOT_STATE);
  ok('E1 S1: ...and stays through 3.2s of unbroken IDLE — a writer thinking is not a writer done, so nothing time-based may take the tray',
    afterIdle.popoutHold === 'true' && afterIdle.pointerEvents === 'auto' && parseFloat(afterIdle.opacity) > 0.9,
    JSON.stringify(afterIdle));

  // ==========================================================================
  // E1 S2 — THE BOUNDARY. Fourteen words held, the fifteenth releases. Without
  // both halves this section would only prove "typing eventually closes it",
  // which the superseded behaviour also did.
  // ==========================================================================
  await app.typeKeys(W(13));            // 1 (alpha) + 13 = 14 words since open
  await sleep(500);
  const atFourteen = await app.evalJs(FOOT_STATE);
  ok('E1 S2: FOURTEEN words since the tray opened — still HELD. The threshold is a real fifteen, not "any typing"',
    atFourteen.popoutHold === 'true' && atFourteen.pointerEvents === 'auto',
    JSON.stringify(atFourteen));

  await app.typeKeys('fifteen ');       // the 15th
  const atFifteen = await settle(app, (s) => s.popoutHold === 'false');
  ok('E1 S2: the FIFTEENTH word releases the hold — data-popout-hold flips to "false"',
    atFifteen.popoutHold === 'false', JSON.stringify(atFifteen));

  const settled = await settle(app, (s) => parseFloat(s.opacity) < 0.15);
  ok('E1 S2: ...and the tray then recedes through the SAME vanishing engine it always rode — settling to the ambient fade-min opacity and going inert, with no second fade authored anywhere',
    parseFloat(settled.opacity) < 0.15 && settled.pointerEvents === 'none' && settled.frameWriting === 'true',
    JSON.stringify(settled));

  // ==========================================================================
  // E1 S3 — A PERIOD, on its own. A fresh tray takes a fresh mark, so this
  // path is proven independently of the count rather than riding S2's tail.
  // ==========================================================================
  await freshProsePage(app, 1400, 900);
  await openSliver(app);
  await sleep(250);
  await openPopout(app, 'Progress');
  await focusEditor(app);
  await app.typeKeys('one ');
  await sleep(500);
  const beforePeriod = await app.evalJs(FOOT_STATE);
  ok('E1 S3: a fresh tray takes a FRESH mark — one word into a new pop-out is held, unaffected by the fifteen already written into this session',
    beforePeriod.popoutHold === 'true', JSON.stringify(beforePeriod));

  await app.typeKeys('.');
  const afterPeriod = await settle(app, (s) => s.popoutHold === 'false');
  ok('E1 S3: a PERIOD releases the hold on its own, at one word — the sentence ended, so the writer is done with the tray',
    afterPeriod.popoutHold === 'false', JSON.stringify(afterPeriod));

  // ==========================================================================
  // E1 S4 — THE SCOPE CONTROL. The guard on Nick's other half. With NO tray
  // open, the drawer must recede on the first keystroke exactly as it always
  // has: the vanish engine's own fades are untouched, and a "fix" that simply
  // stopped hiding chrome would be caught here and nowhere else.
  // ==========================================================================
  await freshProsePage(app, 1400, 900);
  await openSliver(app);
  await sleep(250);
  const noTray = await app.evalJs(FOOT_STATE);
  ok('E1 S4 (control): with the drawer open but NO pop-out open, the hold flag reads "false" — the attribute cannot match, so this surface is byte-identical to before',
    noTray.trayPresent === false && noTray.popoutHold === 'false', JSON.stringify(noTray));

  await focusEditor(app);
  await app.typeKeys('alpha ');
  const drawerGone = await settle(app, (s) => s.pointerEvents === 'none' && parseFloat(s.opacity) < 0.15);
  ok('E1 S4 (control): ...and ONE word still dissolves that drawer, all the way to fade-min and inert — the E1 hold reaches only a drawer with its own tray standing open',
    drawerGone.frameWriting === 'true' && drawerGone.pointerEvents === 'none'
      && parseFloat(drawerGone.opacity) < 0.15,
    JSON.stringify(drawerGone));

  // ==========================================================================
  // E1 S5 — THE FADE PATH IS REUSED, NOT RE-AUTHORED. The brief's own words.
  // Measured, not asserted from the diff: the panel's live computed transition
  // is identical while held and while not.
  // ==========================================================================
  const transitionOf = () => app.evalJs(`(() => { const cs = getComputedStyle(document.querySelector('.wz-sliver-panel'));
    return { property: cs.transitionProperty, duration: cs.transitionDuration, easing: cs.transitionTimingFunction }; })()`);
  const unheldTransition = await transitionOf();
  await openPopout(app, 'Typewriter');
  const heldTransition = await transitionOf();
  ok('E1 S5: the panel\'s own live computed transition is IDENTICAL held and unheld — the hold changes WHEN the fade is reached, never what the fade is',
    JSON.stringify(unheldTransition) === JSON.stringify(heldTransition),
    JSON.stringify({ unheldTransition, heldTransition }));

  // ==========================================================================
  // E2 — LAYOUT. The measured half (Full Screen's centre against the progress
  // bar's) is the PROBE's, at both reference widths, per the brief. What lives
  // here is what the probe cannot see: that the toggle MOVED rather than being
  // copied, that the bar genuinely yielded the width, and the DOM-order form of
  // the Structure guard.
  // ==========================================================================
  await freshProsePage(app, 1400, 900);
  await openSliver(app);
  await sleep(250);

  const footShape = await app.evalJs(`(() => {
    const row = document.querySelector('.wz-sliver-instruments-row');
    const goal = document.querySelector('.wz-sliver-goal');
    const line = document.querySelector('.wz-sliver-goal-line');
    const bar = document.querySelector('.wz-sliver-goal-hairline');
    const gs = goal ? getComputedStyle(goal) : null;
    return {
      rowLabels: row ? [...row.querySelectorAll('button')].map(b => (b.getAttribute('aria-label') || '').trim()) : null,
      fullScreenInRow: !!(row && row.querySelector('[data-foot-fullscreen]')),
      fullScreenInGoalLine: !!(line && line.querySelector('[data-foot-fullscreen] button')),
      fullScreenTotal: document.querySelectorAll('.wz-sliver-panel [data-foot-fullscreen] button').length,
      barWidth: bar ? bar.getBoundingClientRect().width : null,
      goalInnerWidth: goal ? goal.getBoundingClientRect().width - parseFloat(gs.paddingLeft) - parseFloat(gs.paddingRight) : null,
      lineAlign: line ? getComputedStyle(line).alignItems : null,
      lineDisplay: line ? getComputedStyle(line).display : null,
    };
  })()`);

  ok('E2: the instruments row is TYPEWRITER · PROGRESS — Full Screen has left the cell it used to occupy',
    JSON.stringify(footShape.rowLabels) === JSON.stringify(['Typewriter', 'Progress'])
      && footShape.fullScreenInRow === false,
    JSON.stringify(footShape));

  ok('E2: Full Screen sits on the progress bar line itself, and there is EXACTLY ONE of it in the panel — a move, never a second instance left behind',
    footShape.fullScreenInGoalLine === true && footShape.fullScreenTotal === 1,
    JSON.stringify(footShape));

  ok('E2: the bar genuinely yielded the room — the hairline is strictly narrower than the goal block it used to span, which is the difference between sharing a line and merely sitting near one',
    footShape.barWidth !== null && footShape.goalInnerWidth !== null
      && footShape.barWidth > 0 && footShape.barWidth < footShape.goalInnerWidth - 1,
    JSON.stringify(footShape));

  ok('E2: the alignment is LAYOUT — a flex row with align-items:center, not a nudged margin (the fence the brief sets; the probe measures the resulting centres at both widths)',
    footShape.lineDisplay === 'flex' && footShape.lineAlign === 'center',
    JSON.stringify(footShape));

  // The Structure half, in DOM-order form. Recorded as a GUARD, not as work:
  // it was already true at the branch point (S0 (c)). It can still fail, which
  // is why it is here — E4 grows this zone, and a later hand could append a
  // section beneath it.
  await toDraft(app);
  const zoneOrder = await app.evalJs(`(() => {
    const body = document.querySelector('.wz-sliver-body');
    const sections = [...body.querySelectorAll(':scope > .wz-sliver-section')];
    const panelKids = [...document.querySelector('.wz-sliver-panel').children].map(el => el.className);
    return {
      headings: sections.map(s => (s.querySelector('.wz-sliver-h') || {}).textContent),
      structureIsLast: sections.length > 0 && sections[sections.length - 1].classList.contains('wz-sliver-structure'),
      panelKids,
    };
  })()`);
  ok('E2 (GUARD, already true at the branch point): Structure is the LAST zone of the tab body, with the goal foot and the instruments row following it — so it is the last thing before the foot',
    zoneOrder.structureIsLast === true
      && zoneOrder.panelKids.length === 3
      && zoneOrder.panelKids[0].includes('wz-sliver-body')
      && zoneOrder.panelKids[1].includes('wz-sliver-goal')
      && zoneOrder.panelKids[2].includes('wz-sliver-instruments'),
    JSON.stringify(zoneOrder));

  // ==========================================================================
  // E3 — THE ARROW INDENTS A WHOLE PARAGRAPH, REPEATABLY.
  //
  // Two discriminators carry this section, and neither passes against the
  // superseded behaviour: PARAGRAPH SCOPE (the old control tabbed the caret's
  // LINE, so a two-line paragraph came back half-indented) and REPEATABILITY
  // (the old control was a toggle, so the second press REMOVED the tab it had
  // just added). Everything else here is a guard.
  //
  // The text is read back with textContent, not innerText: the decorator is
  // character-preserving 1:1 by contract (draftDecoration.ts), so textContent
  // IS the page's plain text, while innerText would normalise the very
  // whitespace this section is about.
  // ==========================================================================
  await freshProsePage(app, 1400, 900);
  await toDraft(app);
  await focusEditor(app);
  await app.typeKeys('Alpha one\nAlpha two');
  await sleep(300);

  const typed = await app.evalJs("document.querySelector('.forward-only-editor').textContent");
  ok('E3 (fixture): a two-line paragraph is in the page, with the caret on its second line',
    typed === 'Alpha one\nAlpha two', JSON.stringify(typed));

  await clickFormat(app, 'Indent');
  const e3AfterOne = await app.evalJs("document.querySelector('.forward-only-editor').textContent");
  ok('E3: one press indents the WHOLE PARAGRAPH, not the caret line — both lines take the tab, which is the discriminator against the superseded line-scoped control',
    e3AfterOne === '\tAlpha one\n\tAlpha two', JSON.stringify(e3AfterOne));

  await clickFormat(app, 'Indent');
  const e3AfterTwo = await app.evalJs("document.querySelector('.forward-only-editor').textContent");
  ok('E3: pressing again INCREASES the level — the second discriminator, since the superseded toggle would have removed the tab it just added',
    e3AfterTwo === '\t\tAlpha one\n\t\tAlpha two', JSON.stringify(e3AfterTwo));

  const marker = await app.evalJs(`(() => {
    const ed = document.querySelector('.forward-only-editor');
    const marks = [...ed.querySelectorAll('.md-mark')].map(m => m.textContent);
    return { marks, textLength: ed.textContent.length };
  })()`);
  ok('E3: the level renders as indent with the MARKER LOW-INK — the leading tabs are wrapped in the same .md-mark register every other convention wears, and the character count stays 1:1 so the caret offset still restores',
    marker.marks.length === 2 && marker.marks.every(m => m === '\t\t') && marker.textLength === e3AfterTwo.length,
    JSON.stringify(marker));

  // A blank line is a paragraph SEPARATOR, never structure: a second paragraph
  // must be reachable without dragging the first one with it.
  await focusEditor(app);
  await app.typeKeys('\n\nBeta one');
  await sleep(250);
  await clickFormat(app, 'Indent');
  const twoParas = await app.evalJs("document.querySelector('.forward-only-editor').textContent");
  ok('E3: a caret in the SECOND paragraph indents only that paragraph, and the blank separator between them takes no tab — a tab on a separator is invisible litter, never structure',
    twoParas === '\t\tAlpha one\n\t\tAlpha two\n\n\tBeta one', JSON.stringify(twoParas));

  // ITEM 102'S TAB IS NOT BUILT HERE — the brief's own fence, asserted rather
  // than promised. Nothing in this wave touches a key handler.
  await focusEditor(app);
  const beforeTab = await app.evalJs("document.querySelector('.forward-only-editor').textContent");
  await app.key('Tab');
  await sleep(250);
  const afterTab = await app.evalJs("document.querySelector('.forward-only-editor').textContent");
  ok('E3 (fence): pressing TAB changes nothing — Tab-as-indent is item 102 and was NOT built here; the arrow is the only door this wave opens',
    afterTab === beforeTab, JSON.stringify({ beforeTab, afterTab }));

  // The control: E3 rewired ONE action. The other line-prefix directives still
  // run through toggleLinePrefix and still toggle, so the change did not leak
  // into the shared helper.
  await freshProsePage(app, 1400, 900);
  await toDraft(app);
  await focusEditor(app);
  await app.typeKeys('Gamma');
  await sleep(250);
  await clickFormat(app, 'Bulleted list');
  const bulletOn = await app.evalJs("document.querySelector('.forward-only-editor').textContent");
  await clickFormat(app, 'Bulleted list');
  const bulletOff = await app.evalJs("document.querySelector('.forward-only-editor').textContent");
  ok('E3 (control): the OTHER line directives are untouched — Bulleted list still toggles on and back off, so E3 rewired one action and not the shared helper beneath them all',
    bulletOn === '- Gamma' && bulletOff === 'Gamma', JSON.stringify({ bulletOn, bulletOff }));
  // ==========================================================================
  // E4 — ITEM 114'S PLACEHOLDERS. They render, they persist per page, and
  // nothing downstream is wired.
  //
  // A placeholder can still get four things wrong, and those are the checks:
  // that the style guides are DISCLOSED by Research rather than greyed; that a
  // page which never chose stays byte-identical on disk (zero schema means
  // nothing if the reader writes a default at birth); that the selection is on
  // the PAGE and not in component state; and that a page's KIND cannot leak
  // into the writer's per-user defaults — the one real defect the shared
  // PageSettings shape invites (S0 (e)).
  // ==========================================================================
  await freshProsePage(app, 1400, 900);
  await toDraft(app);

  const roster = await app.evalJs(`(() => {
    const zone = document.querySelector('.wz-sliver-structure');
    const kinds = [...zone.querySelectorAll('[data-page-kind]')];
    return {
      labels: kinds.map(b => b.textContent),
      checked: kinds.filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.pageKind),
      anyDisabled: kinds.some(b => b.disabled || b.getAttribute('aria-disabled') === 'true'),
      guidesPresent: zone.querySelectorAll('[data-style-guide]').length,
      kindGroupRole: zone.querySelector('[role="radiogroup"]')?.getAttribute('role'),
    };
  })()`);
  ok('E4: Structure carries the three kind buttons in the ruled order, with NORMAL preselected and none of them greyed',
    JSON.stringify(roster.labels) === JSON.stringify(['Normal', 'Screenplay', 'Research'])
      && JSON.stringify(roster.checked) === JSON.stringify(['normal'])
      && roster.anyDisabled === false && roster.kindGroupRole === 'radiogroup',
    JSON.stringify(roster));

  ok('E4: the style guides are ABSENT before Research is chosen — not greyed, not hidden: what is not built for this page does not render (G3)',
    roster.guidesPresent === 0, JSON.stringify(roster));

  // G4's in-place disclosure.
  await app.evalJs("document.querySelector('[data-page-kind=\"research\"]').click()");
  await sleep(350);
  const revealed = await app.evalJs(`(() => {
    const zone = document.querySelector('.wz-sliver-structure');
    const guides = [...zone.querySelectorAll('[data-style-guide]')];
    return {
      labels: guides.map(b => b.textContent),
      checked: guides.filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.styleGuide),
      anyDisabled: guides.some(b => b.disabled || b.getAttribute('aria-disabled') === 'true'),
      depth: guides.length ? guides[0].closest('.wz-sliver-structure') === zone : false,
    };
  })()`);
  ok('E4: choosing RESEARCH reveals the four style guides IN PLACE, at the same depth, with MLA preselected and nothing greyed',
    JSON.stringify(revealed.labels) === JSON.stringify(['MLA', 'APA', 'Chicago', 'AP'])
      && JSON.stringify(revealed.checked) === JSON.stringify(['mla'])
      && revealed.anyDisabled === false && revealed.depth === true,
    JSON.stringify(revealed));

  // MLA is a READ default, not a written one: revealing the row must not dirty
  // the page with a choice the writer never made.
  await sleep(700);   // persistence.scheduleFlush is 300ms; this is well past it
  const storedAfterKind = await app.evalJs(`(() => {
    const id = (location.hash.match(/#\\/page\\/([^?/]+)/) || [])[1];
    const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = rows.find(r => r.id === id) || null;
    return { id, pageSettings: e ? (e.pageSettings ?? null) : 'ENTRY NOT FOUND' };
  })()`);
  ok('E4: picking Research writes kind:"research" to the page own page_settings and writes NO styleGuide — MLA is preselected by reading through the default, so a reveal never records a choice the writer did not make',
    storedAfterKind.pageSettings && storedAfterKind.pageSettings.kind === 'research'
      && storedAfterKind.pageSettings.styleGuide === undefined,
    JSON.stringify(storedAfterKind));

  // ...and it is on the PAGE, not in a component. A reload is the only honest
  // proof of that.
  await app.evalJs("document.querySelector('[data-style-guide=\"chicago\"]').click()");
  await sleep(700);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page after reload' });
  await sleep(400);
  await openSliver(app);
  await sleep(250);
  await toDraft(app);
  const afterReload = await app.evalJs(`(() => {
    const zone = document.querySelector('.wz-sliver-structure');
    return {
      kind: [...zone.querySelectorAll('[data-page-kind]')].filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.pageKind),
      guide: [...zone.querySelectorAll('[data-style-guide]')].filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.styleGuide),
    };
  })()`);
  ok('E4: the selection survives a RELOAD — Research and Chicago come back checked, so it lives on the page and not in component state',
    JSON.stringify(afterReload.kind) === JSON.stringify(['research'])
      && JSON.stringify(afterReload.guide) === JSON.stringify(['chicago']),
    JSON.stringify(afterReload));

  // ==========================================================================
  // E4 — THE DEFAULTS LEAK. The discriminating check of this section: without
  // pageDefaults.dressOnly, pressing "Set as my default page settings" on a
  // RESEARCH page makes every page born afterwards Research, silently. Nothing
  // in the UI would announce it.
  // ==========================================================================
  await app.evalJs(`(() => {
    const b = [...document.querySelectorAll('.wz-strip-item')].find(x => (x.querySelector('.wz-strip-label') || {}).textContent === 'Page');
    if (b) b.click();
  })()`);
  await sleep(500);
  const savedDefaults = await app.evalJs(`(() => {
    const b = [...document.querySelectorAll('.wz-cascade-action')].find(x => x.textContent.trim() === 'Set as my default page settings');
    if (!b) return { pressed: false };
    b.click();
    return { pressed: true };
  })()`);
  await sleep(500);
  const storedDefaults = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-page-defaults') || 'null')");
  ok('E4: "Set as my default page settings" was reachable and was pressed on a RESEARCH page (the fixture the leak needs)',
    savedDefaults.pressed === true, JSON.stringify(savedDefaults));
  ok('E4: the writer per-user defaults carry the DRESS and NOT the kind — a page kind is a fact about that page, and facts do not travel by default',
    storedDefaults !== null && storedDefaults.kind === undefined && storedDefaults.styleGuide === undefined
      && storedDefaults.margins !== undefined,
    JSON.stringify(storedDefaults));

  // The leak at its DESTINATION. Read this one with the note below, because a
  // run of it turned up something that is not this ticket's:
  //
  // ► OBSERVED, SURFACED, NOT FIXED — R6's BIRTH-FROM-DEFAULTS DOES NOT REACH
  //   THE UNBORN ROUTE. A page born through "New Page" comes back with NO
  //   page_settings at all (measured: storedPageSettings null on a genuinely
  //   born row, with the writer's defaults saved and non-empty). The stamp
  //   `pageSettings: getUserPageDefaults() ?? undefined` lives in
  //   persistence.createJournalPage, and this door navigates to an UNBORN href
  //   instead (CascadePanels' newPage -> unbornHref, FX14 S1's "every New Page
  //   opens in THE Page"); PB1's own `unbornEntry`/`birth` never carry the
  //   field. So item 83 M2's own ruling — "page settings reset to defaults when
  //   the user creates a new page" — is bypassed on what is now the ordinary
  //   way a page is made. That is a pre-existing interaction between M2 and
  //   PB1, entirely outside this brief, and it is reported in the offer rather
  //   than repaired here.
  //
  //   WHAT IT COSTS THIS CHECK, said plainly: the destination has two locks on
  //   it now, and only one of them is E4's. The DISCRIMINATING check for the
  //   strip is the one above, at the door — remove `dressOnly` and the stored
  //   defaults carry `kind:"research"` and that check goes red. This one
  //   CORROBORATES; it does not, on this route, discriminate. It is kept
  //   because the day R6 is repaired is exactly the day it starts to.
  // The id BEFORE the door is taken. Without it this check cannot tell a newly
  // born page from the Research page it was standing on — and it could not, on
  // its first run: the selector read 'New page' where the lexicon says 'New
  // Page', so nothing was clicked and the check reported the open page's own
  // kind as though a birth had inherited it. Caught because the assertion was
  // wrong, not because anything in the product was; the guard below is what
  // stops that class of false red (and its far worse twin, a false green).
  const idBeforeBirth = await app.evalJs("(location.hash.split('/page/')[1] || '').split(/[?/]/)[0]");
  await app.evalJs(`(() => {
    const b = [...document.querySelectorAll('.wz-cascade-action')].find(x => x.textContent.trim() === 'New Page');
    if (b) b.click();
  })()`);
  await sleep(900);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'newly born page' });
  await sleep(400);
  // A word, so the page is genuinely BORN. Without it the route sits at
  // `#/page/new` (PB1's unborn page — no row exists yet), and `storedKind`
  // would read null for a reason that has nothing to do with the strip under
  // test: an over-claim the first run of this check actually made, and this
  // line is what retires it. The in-memory entry it births carries whatever
  // `getUserPageDefaults()` stamped at creation, which IS the channel the leak
  // would travel down.
  await focusEditor(app);
  await app.typeKeys('birth ');
  await sleep(900);
  await openSliver(app);
  await sleep(250);
  await toDraft(app);
  const bornPage = await app.evalJs(`(() => {
    const id = (location.hash.match(/#\\/page\\/([^?/]+)/) || [])[1];
    const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = rows.find(r => r.id === id) || null;
    const zone = document.querySelector('.wz-sliver-structure');
    return {
      id,
      rowExists: !!e,
      storedPageSettings: e ? (e.pageSettings ?? null) : null,
      storedKind: e && e.pageSettings ? (e.pageSettings.kind ?? null) : null,
      checked: [...zone.querySelectorAll('[data-page-kind]')].filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.pageKind),
      guidesPresent: zone.querySelectorAll('[data-style-guide]').length,
    };
  })()`);
  ok('E4 (corroborating, see the note above): a page BORN AFTER those defaults were saved is Normal, carries no kind key, and shows no style guides. Guarded twice so it cannot pass by standing still — the id must differ from the page it was launched from, and the row must actually EXIST (a word was written, so PB1 has borne it). It corroborates rather than discriminates on THIS route, because birth-from-defaults does not currently reach it at all',
    bornPage.id !== idBeforeBirth && bornPage.id !== 'new' && bornPage.rowExists === true
      && bornPage.storedKind === null
      && JSON.stringify(bornPage.checked) === JSON.stringify(['normal'])
      && bornPage.guidesPresent === 0,
    JSON.stringify({ ...bornPage, idBeforeBirth }));

  // ==========================================================================
  // E4 — THE SEAM, asserted rather than described. The Screenplay name
  // collision is REPORTED to Nick and is his to settle; what is measured here
  // is only that the two controls cannot be mistaken for one another in the
  // meantime, and that neither was renamed or merged to get there.
  // ==========================================================================
  const seam = await app.evalJs(`(() => {
    const zone = document.querySelector('.wz-sliver-structure');
    const chip = zone.querySelector('[data-page-kind="screenplay"]');
    const act = zone.querySelector('.wz-cascade-action');
    const subs = [...zone.querySelectorAll('.wz-sliver-sub')].map(s => s.textContent);
    return {
      chipText: chip ? chip.textContent : null,
      chipRole: chip ? chip.getAttribute('role') : null,
      actText: act ? act.textContent : null,
      actPopup: act ? act.getAttribute('aria-haspopup') : null,
      actRole: act ? act.getAttribute('role') : null,
      // The FIRST and LAST sub-labels are the seam's own pair and are asserted
      // by position, not by a fixed list: 'Style guide' sits between them only
      // while Research is chosen, and pinning the whole list would make this
      // check pass or fail on a state it does not care about.
      subs,
      ruleBetween: !!zone.querySelector('.wz-sliver-rule'),
      sameClass: !!(chip && act) && chip.className === act.className,
    };
  })()`);
  ok('E4 (seam): BOTH Screenplays stand, and NEITHER was renamed or merged — the kind chip still reads "Screenplay" and the act still reads "Convert to Screenplay…" with its dialog promise intact',
    seam.chipText === 'Screenplay' && seam.actText === 'Convert to Screenplay…'
      && seam.actPopup === 'dialog',
    JSON.stringify(seam));
  ok('E4 (seam): they are told apart three ways at once — separate sub-labels naming the difference in words, different control shapes (a radio chip vs a full-width action), and a rule between them',
    seam.subs[0] === 'This page is' && seam.subs[seam.subs.length - 1] === 'Change the page itself'
      && seam.chipRole === 'radio' && seam.actRole === null
      && seam.sameClass === false && seam.ruleBetween === true,
    JSON.stringify(seam));

  // ==========================================================================
  // E4 — THE SCOPE DECISION, measured so it cannot be a silent narrowing. The
  // chips are PROSE DRAFT's; the framed screenplay surface passes none of the
  // four props, so they are genuinely absent from its DOM rather than greyed.
  // A script page has already declared what it is, and a kind row there would
  // let a writer mark a screenplay "Normal" and then persist that. Disclosed in
  // the offer; four props and a default if Nick wants it widened.
  // ==========================================================================
  await freshScriptPage(app, 1400, 900);
  await openSliver(app);
  await sleep(300);
  const onScript = await app.evalJs(`(() => {
    const zone = document.querySelector('.wz-sliver-structure');
    return {
      structureZonePresent: !!zone,
      kindChips: document.querySelectorAll('[data-page-kind]').length,
      guides: document.querySelectorAll('[data-style-guide]').length,
      actText: zone ? (zone.querySelector('.wz-cascade-action') || {}).textContent : null,
    };
  })()`);
  ok('E4 (scope, disclosed): the framed SCREENPLAY surface keeps its Structure zone and its conversion row, and carries NO kind chips — absent from the DOM, never greyed',
    onScript.structureZonePresent === true && onScript.kindChips === 0 && onScript.guides === 0
      && typeof onScript.actText === 'string' && onScript.actText.length > 0,
    JSON.stringify(onScript));
  return checks;
}, { label: 'item83f' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing to park. This file is NEW and supersedes no assertion of its own.
  // The assertions this WAVE superseded live where they were written and are
  // parked there, in their own files, beside their successors:
  //   · fx3.mjs S5 — two checks, the pop-out's keystroke-dissolve (E1 reverses
  //     the trigger; the successors stand in fx3 itself, and the gate's full
  //     proof with its controls is E1 S1-S5 above).
  // The count is the check, not the colour: an empty list here is a CLAIM that
  // this file falsified nothing, and it is auditable against the wave's own
  // offer record, which names every park by file and count.
  // eslint-disable-next-line no-console
  console.log('\nITEM83F PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing of its own. The wave\'s parks live in fx3.mjs beside their successors.');
}

const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM83F VERIFY: PASS (${allChecks.length} checks)`
  : `\nITEM83F VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
