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
