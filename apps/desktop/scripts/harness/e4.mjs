// E4 — THE TUTOR GRIP ON FIRST LOAD (docs/open-threads.md's own E4 entry + its
// S0 and the S0 CORRECTION recorded under it). A committed CDP verification
// scenario, per AGENTS.md's "Harness scenarios persist".
// Run: node scripts/harness/e4.mjs   (from apps/desktop, dist-web freshly built)
//
// THE SYMPTOM, verbatim from Nick (production c927e9c, 2026-09-02): the RIGHT
// hand's tab did NOT render when the page loaded; it appeared only after
// interacting with styling and typewriter controls. The LEFT hand was present
// throughout.
//
// THE CAUSE, measured not assumed: PageEditor.tsx gated the Tutor on
// `gateActive || unborn`. PB1 keeps a page unborn until its first word, so a
// freshly opened page had no right hand at all — `.wz-tutor-zone` count 0, not
// merely an unstyled or unannounced one. A styling click writes `****` into the
// text, which BIRTHS the page, which mounts the Tutor: that is Nick's "appeared
// only after interacting with styling".
//
// THE HYPOTHESIS THAT WAS FALSIFIED (E1's announce/mount family on the right
// hand) predicted a re-render would reveal it. S4 below keeps that competition
// permanent: re-render WITHOUT writing a word, and the grip must already be
// there for the right reason rather than arriving late.
//
// THE SECOND HALF. Un-gating alone would have spread a live PB1 violation from
// boards to pages. Measured on the SHIPPED build, on an unborn board (which has
// mounted this panel unconditionally all along): sending a Tutor message wrote
// a real row — {pageType:'board', text:'', boxes:0, tutorMsgs:1}. The surface
// was born by a chat message, with nothing written on it. S5/S6 hold that shut.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const hands = (app) => app.evalJs(`(() => ({
  tutorGrip: !!document.querySelector('.wz-tutor-grip'),
  tutorZones: document.querySelectorAll('.wz-tutor-zone').length,
  leftSliver: !!document.querySelector('.wz-sliver'),
  hash: location.hash,
}))()`);

const rowCount = (app) => app.evalJs(
  "JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').length");

// A driver that FAILS A CHECK instead of killing the file. Pre-fix there is no
// grip and no composer to drive, and a bare `.click()` on a missing node throws
// — which aborts the run and reports nothing about the checks that follow. The
// falsification pass is exactly when this file most needs to stay legible, so
// every gesture below goes through here. (Same lesson as ab2.mjs's own
// label-coupled drivers: a harness that dies is worse than one that fails.)
const clickOrFail = async (app, selector, why) => {
  const there = await app.evalJs(`!!document.querySelector(${JSON.stringify(selector)})`);
  // Recorded either way, so the check COUNT is the same in both directions — a
  // check that only exists when it fails makes a passing run look smaller than
  // the run that caught the bug.
  ok(why, there, there ? selector : `absent: ${selector}`);
  if (!there) return false;
  await app.evalJs(`document.querySelector(${JSON.stringify(selector)}).click()`);
  return true;
};

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the reported symptom, at the surface it was reported on.
  // ==========================================================================
  await freshDesk(app);
  await app.evalJs("location.hash = '#/page/new'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'unborn page framed' });
  await sleep(700);

  const onLoad = await hands(app);
  ok('S1: the Tutor GRIP renders on a NEW page at first paint — the right hand is present before a single word is written (E4, Nick 2026-09-02)',
    onLoad.tutorGrip, JSON.stringify(onLoad));

  ok('S1: both of the Tutor\'s own anchors are mounted, not just a stray button — the panel anchor rides with the grip anchor',
    onLoad.tutorZones === 2, JSON.stringify(onLoad));

  ok('S1: BOTH HANDS, one grammar — the left sliver is present on the same first paint (the asymmetry E4 named is closed, not inverted)',
    onLoad.leftSliver && onLoad.tutorGrip, JSON.stringify(onLoad));

  ok('S1 (the page really is unborn — the check above is not passing for the trivial reason that the page was already born): the store still holds ZERO rows',
    (await rowCount(app)) === 0, `rows=${await rowCount(app)}`);

  // ==========================================================================
  // S2 — the falsified hypothesis, kept falsified. A re-render must not be
  // what produces the grip: it is there from first paint or this check fails.
  // ==========================================================================
  await app.evalJs("window.dispatchEvent(new Event('resize'))");
  await sleep(250);
  const afterRerender = await hands(app);
  ok('S2: the grip owes nothing to a re-render — it was already there, and a forced re-render with no word written neither creates nor destroys it (the announce/mount reading, held falsified)',
    afterRerender.tutorGrip && afterRerender.tutorZones === 2, JSON.stringify(afterRerender));

  // ==========================================================================
  // S3 — PB1 still holds: mounting the right hand must not write a row.
  // ==========================================================================
  ok('S3: mounting the Tutor on an unborn page writes NOTHING — the store still holds zero rows after the panel has mounted (PB1: the row is written by the first word)',
    (await rowCount(app)) === 0, `rows=${await rowCount(app)}`);

  // ==========================================================================
  // S4 — the send refuses OUT LOUD, and keeps the writer's words.
  // ==========================================================================
  const opened = await clickOrFail(app, '.wz-tutor-grip',
    'S4: the grip can be opened on an unborn page — there is a hand to reach for');
  await sleep(500);
  const composerPresent = opened && await app.evalJs("!!document.querySelector('.wz-tutor-convo-input')");
  ok('S4: the opened panel offers its composer on an unborn page (the hand is real, not a decorative stub)',
    composerPresent, String(composerPresent));

  if (composerPresent) await app.evalJs(`(() => {
    const input = document.querySelector('.wz-tutor-convo-input');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'a sentence the writer does not want to lose');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(150);
  if (composerPresent) await clickOrFail(app, '.wz-tutor-convo-send',
    'S4: the composer offers a Send control');
  await sleep(900);

  const afterSend = await app.evalJs(`(() => ({
    rows: JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').length,
    status: (document.querySelector('.wz-tutor-convo-status') || {}).textContent || null,
    composer: (document.querySelector('.wz-tutor-convo-input') || {}).value,
  }))()`);

  ok('S4: a send on an unborn surface does NOT create a row — the page is not born by a chat message (the shipped PB1 violation this ticket found on boards, closed)',
    afterSend.rows === 0, JSON.stringify(afterSend));

  ok('S4: the refusal is VISIBLE — silence is the defect, so the panel says why nothing was sent',
    typeof afterSend.status === 'string' && afterSend.status.length > 0, JSON.stringify(afterSend));

  ok('S4: the refusal KEEPS THE WRITER\'S WORDS — the composer is not cleared, so the sentence survives to be sent once there is a page to attach it to',
    afterSend.composer === 'a sentence the writer does not want to lose', JSON.stringify(afterSend));

  // ==========================================================================
  // S5 — and once the page is born, the Tutor is an ordinary Tutor again.
  // ==========================================================================
  if (opened) await clickOrFail(app, '.wz-tutor-grip', 'S5: the grip closes the panel again');
  await sleep(300);
  await app.evalJs(`(() => {
    const el = document.querySelector('[contenteditable="true"]');
    if (!el) throw new Error('no editable surface');
    el.focus();
  })()`);
  await app.typeKeys('Hello');
  await sleep(1000);

  const born = await app.evalJs(`(() => ({
    rows: JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').length,
    grip: !!document.querySelector('.wz-tutor-grip'),
    hash: location.hash,
  }))()`);
  ok('S5: the first WORD still births the page exactly as it always did — PB1 is untouched by this ticket, not merely un-broken (one row, address corrected off /page/new)',
    born.rows === 1 && born.hash !== '#/page/new', JSON.stringify(born));

  ok('S5: and the grip is still there across birth — it does not flicker out and back as the surface transitions',
    born.grip, JSON.stringify(born));

  // ==========================================================================
  // S6 — the existence proof, still standing: an unborn BOARD carries the
  // grip too, and its send refuses the same way. This is the surface whose
  // unconditional mount proved the ruling was already half-shipped, and the
  // one where the PB1 violation was actually measured.
  // ==========================================================================
  await freshDesk(app);
  await app.evalJs("location.hash = '#/page/new?kind=board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'unborn board framed' });
  await sleep(700);

  ok('S6: an unborn BOARD carries the grip on load (unchanged by this ticket — the existence proof that both hands on an unwritten surface was always the intent)',
    await app.evalJs("!!document.querySelector('.wz-tutor-grip')"));

  const boardOpened = await clickOrFail(app, '.wz-tutor-grip',
    'S6: the board grip opens its panel');
  await sleep(500);
  const boardComposer = boardOpened && await app.evalJs("!!document.querySelector('.wz-tutor-convo-input')");
  if (boardComposer) {
    await app.evalJs(`(() => {
      const input = document.querySelector('.wz-tutor-convo-input');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'hello tutor');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(150);
    await clickOrFail(app, '.wz-tutor-convo-send', 'S6: the board composer offers a Send control');
  }
  await sleep(900);

  const boardAfter = await app.evalJs(`(() => ({
    rows: JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').length,
    status: (document.querySelector('.wz-tutor-convo-status') || {}).textContent || null,
  }))()`);
  ok('S6: the BOARD send refuses too — this is the exact measurement that was red on the shipped build ({pageType:board, text:"", boxes:0, tutorMsgs:1} written by a chat message), now zero rows',
    boardAfter.rows === 0, JSON.stringify(boardAfter));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nE4 VERIFY: PASS (${checks.length} checks)`
  : `\nE4 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
