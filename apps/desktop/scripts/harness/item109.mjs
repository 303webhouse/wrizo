// ITEM 109 — THE #/page/new GATE. The durable coverage fix owed since the
// three-reopen crash.
//
// WHAT KEPT RE-SHIPPING. The doorway ship crashed the New Page door on mount in
// production; 59/59 both settings and a GREEN review missed it; item 104 was
// reopened a THIRD time and finally closed on the founder's own walk of
// `#/page/new` rather than on any instrument. The ledger's diagnosis is that no
// gate drives that route the way a writer does, so the next regression there
// would be caught by a founder again. This file is that gate.
//
// ---------------------------------------------------------------------------
// THE MECHANISM OF THE GAP, MEASURED RATHER THAN ASSUMED
//
// Ten harness files already "go to" `#/page/new`. None of them has ever mounted
// the app there, and S1 below proves why in one assertion: `app.goto()` issues
// `Page.navigate` to a URL that differs from the current one only in its HASH,
// and a hash change is a SAME-DOCUMENT navigation. The SPA router handles it
// client-side; the document is never reloaded; nothing remounts. Measured with a
// sentinel planted on `window` — after `app.goto('/page/new')` it is STILL THERE.
//
// That is the whole coverage gap, and it explains the escape exactly: a defect
// that only fires when the app MOUNTS at that URL cannot be reached by
// navigating into it from somewhere else, however many files do so.
//
// S2 forces a genuine document load at the URL and proves it cold by the same
// sentinel being GONE, then asserts what a writer actually sees.
//
// ---------------------------------------------------------------------------
// ON "HEADFUL", AND WHAT THIS FILE CLAIMS
//
// The charter's sharpest instance asks for the route driven "in a REAL (headful)
// browser". The capability now exists (`WS_HEADFUL=1`, runtime-verify's own
// launchBrowser) and this file honours it, so the gate can be run exactly as the
// ruling words it. It is NOT the default, for two plain reasons: a 70-file suite
// that threw a visible window onto the desk every run would be unusable, and a
// headful launch needs a display a CI box may not have.
//
// AND THE HONEST PART: on the evidence in front of me the load-bearing property
// is the COLD DOCUMENT LOAD, not the presence of a window. Headless-new runs the
// same renderer and the same React; what no harness was doing was mounting at
// the URL. S1 measures that gap directly. If a defect is ever found that
// reproduces headful and not headless, this file runs headful with one env var
// and that fact belongs in the ledger — I could not produce one, and I am not
// going to claim a distinction I did not measure.
//
// `WS_TARGET_URL=https://…` aims the same gate at a DEPLOYMENT instead of the
// local dist. That is the deploy checklist's use — three ships passed over a
// dead door in production — and it is deliberately not the suite default: a
// standing file must not depend on a network, and a gate pointed at production
// tests a build nobody in this run made.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HEADFUL = process.env.WS_HEADFUL === '1';
const TARGET = process.env.WS_TARGET_URL || null;

// The frame's ordinary desktop width. The door must open for a writer at a real
// window, and DeskFrame only mounts at >= DESKFRAME_MIN_WIDTH (1100).
const W = 1366;
const H = 768;

const SENTINEL = '__item109_document_identity';

// What a writer must SEE at a fresh New Page, named as three separate facts so a
// failure says which one went missing rather than "the page is wrong".
const SEEN = `(() => {
  const box = (s) => { const e = document.querySelector(s); if (!e) return null;
    const b = e.getBoundingClientRect(); return { w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  return {
    sentinel: window.${SENTINEL} || null,
    hash: location.hash,
    paper: box('.mode-page'),
    editor: box('.forward-only-editor'),
    // BG1's beginnings row — the doors offered on an empty page. THIS is the
    // invitation a writer is drawn on a fresh page today. The F6 first-line
    // invite (.fl-invite) is deliberately NOT asserted: FX15 (the Quiet Page)
    // put it to sleep by default, so requiring it would assert a behaviour that
    // was retired on purpose. Measured, not assumed: on a fresh profile
    // .fl-invite is absent and the beginnings row is present.
    beginnings: [...document.querySelectorAll('[class*=beginning] button')].map((b) => b.textContent.trim()),
    flInvite: !!document.querySelector('.fl-invite'),
    bodyTextLen: document.body.innerText.length,
    // A hooks-order crash BLANKS the tree, so the render itself is the detector
    // the three reopened ships needed.
    rootKids: (document.getElementById('root') || { children: [] }).children.length,
  };
})()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, W, H);

  // A clean profile, reached through the app's own front door.
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await sleep(400);

  // ==========================================================================
  // S1 — THE GAP ITSELF. Not a preamble: this is the assertion that explains
  // why ten files touching this route never caught the crash, and it is the one
  // check here that would have been just as true before the ticket.
  // ==========================================================================
  await app.evalJs(`window.${SENTINEL} = 'planted'`);
  await app.goto('/page/new');
  await sleep(1000);
  const afterGoto = await app.evalJs(SEEN);

  ok('S1 (the gap): app.goto("/page/new") is a SAME-DOCUMENT navigation — the window sentinel SURVIVES it, so the app never remounted. Every existing harness reaches this door client-side, which is exactly why a mount-time crash could ship green ten files deep',
    afterGoto.sentinel === 'planted' && afterGoto.hash === '#/page/new',
    JSON.stringify({ sentinel: afterGoto.sentinel, hash: afterGoto.hash }));

  // ==========================================================================
  // S2 — THE COLD DIRECT LOAD, and what the writer sees.
  // ==========================================================================
  await app.reload();          // a genuine document load AT #/page/new
  await sleep(1800);
  const cold = await app.evalJs(SEEN);

  ok('S2: the load is genuinely COLD — the sentinel is GONE, so this is a fresh document mounted AT #/page/new rather than a route change into it',
    cold.sentinel === null && cold.hash === '#/page/new',
    JSON.stringify({ sentinel: cold.sentinel, hash: cold.hash }));

  ok('S2: THE PAPER IS RENDERED — a real, non-zero sheet. A hooks-order violation on this mount blanks the tree, so this single fact is the detector the three reopened ships did not have',
    !!cold.paper && cold.paper.w > 100 && cold.paper.h > 50,
    JSON.stringify({ paper: cold.paper, rootKids: cold.rootKids }));

  ok('S2: the editor is mounted and writable-shaped — the door opened onto a page, not onto a husk that merely has a sheet',
    !!cold.editor && cold.editor.w > 100,
    JSON.stringify({ editor: cold.editor }));

  ok('S2: THE INVITATION IS DRAWN — the beginnings row offers its doors on the empty page (Sprout / Plan / Screenplay). This is what a writer is offered at a fresh page today; the F6 first-line invite is NOT asserted, because FX15 put it to sleep by default and requiring it would gate a behaviour that was retired on purpose',
    cold.beginnings.length >= 3 && cold.flInvite === false,
    JSON.stringify({ beginnings: cold.beginnings, flInvite: cold.flInvite }));

  ok('S2: the tree is genuinely populated, not a blank or an error page',
    cold.rootKids > 0 && cold.bodyTextLen > 100,
    JSON.stringify({ rootKids: cold.rootKids, bodyTextLen: cold.bodyTextLen }));

  // ==========================================================================
  // S3 — THE OTHER DOORS ONTO THE SAME ROUTE. item 104's own fixtures reach
  // `#/page/new` with query parameters, and a mount-time fault can live behind
  // one branch of the mode/structure switch and not another. Each is a separate
  // COLD load, because that is the only kind this file is about.
  // ==========================================================================
  for (const q of ['/page/new?mode=draft', '/page/new?structure=screenplay']) {
    await app.goto(q);
    await app.reload();
    await sleep(1800);
    const s = await app.evalJs(SEEN);
    const paperish = (s.paper && s.paper.w > 100) || (s.editor && s.editor.w > 100) || s.rootKids > 0;
    ok(`S3: a cold load of ${q} opens onto a live page too — the door has more than one address, and a mount-time fault can hide behind one branch of the switch`,
      s.sentinel === null && paperish && s.bodyTextLen > 100,
      JSON.stringify({ hash: s.hash, paper: s.paper, editor: s.editor, rootKids: s.rootKids }));
  }

  ok(`S0 (conditions): recorded on its face — headful=${HEADFUL}, target=${TARGET || 'local dist-web'}. A gate that does not state which browser and which bundle it drove cannot be cited later`,
    true, JSON.stringify({ headful: HEADFUL, target: TARGET || 'local dist-web', width: W, height: H }));

  return checks;
}, { label: 'item109', headful: HEADFUL, targetUrl: TARGET });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing to park. This file SUPERSEDES no assertion — it is the gate that was
  // MISSING, and a missing gate falsifies nothing when it finally arrives. The
  // ten files that reach this route by navigation all keep claiming exactly what
  // they claimed; S1 simply records what that was worth for a mount-time fault.
  // eslint-disable-next-line no-console
  console.log('\nITEM109 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 109 parks nothing. It adds the gate that was missing rather than superseding one, and the navigation-based files it sits beside are untouched.');
}

const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM109 VERIFY: PASS (${all.length} checks)`
  : `\nITEM109 VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);
