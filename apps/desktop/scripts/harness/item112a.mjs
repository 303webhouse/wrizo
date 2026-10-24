// ITEM 112-A — REVISE'S DOORWAY AND FLOOR.
// Governing charter: docs/menus/tutor/item112-revise-charter.md (RS1-RS7, ratified
// 2026-09-02). Build brief: docs/menus/tutor/item112a-build-brief.md (blob 75e81367,
// md5 9619b2a6 — the AMENDED tip carrying Nick's empty-drawer ruling).
//
// THE TICKET'S OWN CLAIM, AND WHY THE FLOOR IS THE POINT. RS1: a mode that flashes
// coming-soon owes nothing; a mode that OPENS owes a rendered-geometry floor, at both
// reference widths, from its first commit. "Presence is not composition." So this file
// is deliberately weighted toward geometry rather than toward the doorway: switching a
// boolean is easy to prove and easy to get right, and it is not what this ticket is
// actually risking.
//
// The nine checks map to the brief's own §7 list:
//   S1 — Revise is live and switchable; no aria-disabled, no `deferred`, no flash.
//   S2 — the FORWARD-ONLY INSTRUMENT does not mount (asserted, not assumed).
//   S3 — the paper's measure is byte-identical across every hand state, both widths.
//   S4 — both hands anchor to the PAPER, not the screen (Anchor Law).
//   S5 — coexistence: both-open where there is room, graceful yield where there isn't.
//   S6 — the announce invariant, exercised on a path that is NOT the toggle handler.
//   S7 — both grips render and both OPEN; the Desk drawer opens onto empty content.
//   S8 — emptiness: no Type section, no Revise roster, no flags.
//   S9 — Free Write and Draft are unchanged (their own harnesses; see the note below).
//
// FIXTURES ARE ADOPTED, NOT RE-DERIVED (the standing law): the prose-page door and the
// disclosure pre-seed come from fx18.mjs/item83e.mjs, the band instrument from
// item83e.mjs, the grip diagnosis from fx18.mjs. Where this file measures the same
// quantity an existing harness measures, it measures it the same way on purpose — a
// second, subtly different instrument reporting a different number is how a lane loses
// a day.
//
// Run: node apps/desktop/scripts/harness/item112a.mjs  (from apps/desktop, dist-web built).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
// ITEM 207 - the parked recorder, hoisted from the park block at the foot so the two assertions below (one of them inside
// the REFERENCE loop) can park where they stand. Same shape as item84b.mjs's.
const parkedChecks = [];
const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
// page-size (park audit, Oct 24): the 1100 Desk-hand overhang re-pinned on the letter page - main @ 89c5955's -29.7, plus the 2.3px a side the 620px page adds
const PAGE_SIZE_PIN = -32;
const i112aParks = {};   // item112a-deterministic: the default leg's observation, for the parked record
const tlParks = {};   // TYPED-LITERAL: the default leg's S2/§3 readings, for the parked records
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// THE TWO REFERENCE WIDTHS, and they are law for this ticket (brief §5): the frame's
// own minimum is 1100, the constitutional device floor is 1366x768. Every geometry
// check below runs at BOTH. The third leg is not a reference width — it exists only as
// the control for S5, where a coexistence law that always yielded would otherwise pass.
const REFERENCE = [[1100, 900], [1366, 768]];
const WIDE = [2600, 1400];

// ---------------------------------------------------------------------------
// FIXTURES — adopted from fx18.mjs / item83e.mjs.
// ---------------------------------------------------------------------------
const freshDesk = async (app, width, height) => {
  await app.goto('/');
  // The versioned disclosure flags, pre-seeded exactly as fx18/tu1 do: an unseeded
  // Tutor raises a full-screen backdrop (.wz-tutor-disclosure-backdrop) that would
  // cover the grip and every panel-vs-paper geometry this file means to measure.
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// Reached through the app's OWN doors, never a raw storage seed (AGENTS.md, and the
// harness-seeding law: seed through seams).
const freshProsePage = async (app, width, height) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (prose)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'prose page framed' });
  await app.emulateDpr(1, width, height);
  await sleep(300);
};

// The doorway, taken the way a writer takes it: a press on the strip's own tab.
// Bound to `data-mode-key`, the contract marker ModeStrip.tsx carries, NOT to the
// label — the labels come from useDeskLexicon and are themeable, so a text match here
// would be testing a theme instead of the ruled invariant.
const enterMode = async (app, key) => {
  await app.evalJs(`document.querySelector('.desk-mode-tab[data-mode-key="${key}"]')?.click()`);
  await sleep(450);
};

const tabState = (app, key) => app.evalJs(`(() => {
  const b = document.querySelector('.desk-mode-tab[data-mode-key="${key}"]');
  if (!b) return null;
  return {
    ariaDisabled: b.getAttribute('aria-disabled'),
    ariaSelected: b.getAttribute('aria-selected'),
    deferred: b.classList.contains('deferred'),
    active: b.classList.contains('active'),
    label: (b.textContent || '').trim(),
  };
})()`);

const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(2), r: +b.right.toFixed(2), t: +b.top.toFixed(2), w: +b.width.toFixed(2) }; })()`);

// THE PAPER'S MEASURE — the quantity brief §5 says must never move for chrome. Both
// the sheet's own box AND the rendered text column inside it, because they are
// different failures: a sheet that holds its rect while the editor's content box
// shrinks has still reflowed the writer's line.
const measureOf = (app) => app.evalJs(`(() => {
  const page = document.querySelector('.mode-page');
  const ed = document.querySelector('.forward-only-editor');
  if (!page || !ed) return null;
  const p = page.getBoundingClientRect(), e = ed.getBoundingClientRect();
  return {
    paperL: +p.left.toFixed(2), paperR: +p.right.toFixed(2), paperW: +p.width.toFixed(2),
    textL: +e.left.toFixed(2), textR: +e.right.toFixed(2), textW: +e.width.toFixed(2),
  };
})()`);

// The band and its two tenants, measured the way store/menusDrawers.ts itself measures
// them (item83e.mjs's own BAND instrument, adopted verbatim in shape) — so a
// coexistence verdict can be shown to be EARNED rather than merely observed.
const BAND = `(() => {
  const paper = document.querySelector('.mode-page, .board-canvas-wrap, .script-sheet');
  const rail = document.querySelector('.desk-frame-strip');
  if (!paper || !rail) return null;
  const pb = paper.getBoundingClientRect(), rb = rail.getBoundingClientRect();
  const w = (sel, f) => { const el = document.querySelector(sel);
    const x = el ? el.getBoundingClientRect().width : 0; return x > 1 ? x : f; };
  return {
    band: +(pb.left - rb.right).toFixed(1),
    tools: +w('.wz-sliver[data-open="true"]', 200).toFixed(1),
    cascade: +w('.wz-cascade-panel[data-visible="true"]', 300).toFixed(1),
  };
})()`;

const DRAWERS = `(() => {
  const s = document.querySelector('.wz-sliver');
  const c = document.querySelector('.wz-cascade-panel');
  const t = document.querySelector('.wz-tutor-panel');
  return {
    sliverOpen: s ? s.getAttribute('data-open') : null,
    cascadeVisible: c ? c.getAttribute('data-visible') : null,
    tutorOpen: t ? t.getAttribute('data-open') : null,
  };
})()`;

const openSliverByGrip = async (app) => {
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(400);
};
const openTutorByGrip = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
  await sleep(400);
};
// page-size (Fable, Oct 23): whether the band holds the page AND both hands at their minimum - the desk on each side of the page, measured with the hands shut
// (the page never moves, so this is the room they will have). DRAWER_MIN equals the build's one token for a drawer's narrowest open width.
const DRAWER_MIN = 200;
const roomForBoth = (app) => app.evalJs(`(() => { const p = document.querySelector('.mode-page'); const s = document.querySelector('.desk-frame-stage'); if (!p || !s) return null;
  const a = p.getBoundingClientRect(); const b = s.getBoundingClientRect(); const left = a.left - b.left; const right = b.right - a.right;
  return { left: Math.round(left), right: Math.round(right), both: left >= ${DRAWER_MIN} && right >= ${DRAWER_MIN} }; })()`);
const openFarLeft = (app) => app.evalJs(`(() => {
  const b = document.querySelector('.wz-strip-item[data-category=journal]');
  if (!b) return null;
  b.click();
  return b.getAttribute('aria-label') || b.textContent;
})()`);

// Grip reachability WITH diagnosis (fx18.mjs's own gripDiag, generalised to either
// grip) — a false verdict that cannot explain itself costs more than it reports.
const gripDiag = (app, sel) => app.evalJs(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return { present: false, reachable: false, why: 'no-grip' };
  const b = el.getBoundingClientRect();
  const x = Math.round(b.left + b.width/2), y = Math.round(b.top + b.height/2);
  const hit = document.elementFromPoint(x, y);
  const desc = (n) => n ? (n.tagName.toLowerCase() + (n.className && n.className.toString ? '.' + n.className.toString().trim().split(/\\s+/).slice(0,2).join('.') : '')) : 'null';
  return {
    present: true,
    reachable: !!hit && (el === hit || el.contains(hit) || hit.contains(el)),
    hit: desc(hit), rect: { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top) },
    z: getComputedStyle(el).zIndex, pe: getComputedStyle(el).pointerEvents,
  };
})()`);

await withHarness(async (app) => {
  // =========================================================================
  // S1 — THE DOORWAY. Live, switchable, and none of the deferred dress left.
  // =========================================================================
  {
    await freshProsePage(app, 1366, 768);

    const before = await tabState(app, 'revise');
    ok('S1: the Revise tab RENDERS on the framed strip (the doorway exists at all)',
      !!before, JSON.stringify({ before }));
    ok("S1 (§7.1): the Revise tab is LIVE — `aria-disabled` is 'false' and the `deferred` class is GONE from that key; it no longer wears the coming-soon dress",
      !!before && before.ariaDisabled === 'false' && before.deferred === false,
      JSON.stringify(before));

    await enterMode(app, 'revise');
    const after = await tabState(app, 'revise');
    const draft = await tabState(app, 'draft');
    ok("S1 (§7.1): pressing it SWITCHES — Revise reads aria-selected='true' and carries `active`, through the strip's EXISTING switch behaviour and no new gesture",
      !!after && after.ariaSelected === 'true' && after.active === true,
      JSON.stringify({ after }));
    ok('S1: and the mode it left is genuinely released — Draft reads aria-selected=false, so the strip has one active posture rather than two',
      !!draft && draft.ariaSelected === 'false',
      JSON.stringify({ draft }));

    // The flash is the deferred posture's own tell. Its ABSENCE is the check: a tab
    // that switched AND flashed would mean both paths ran.
    const flash = await app.evalJs("(() => { const el = document.querySelector('.desk-mode-soon'); return el ? el.textContent : null; })()");
    ok('S1 (§7.1): NO coming-soon flash fires on the switch — `flashSoon` is off this key entirely, not merely outrun by the mode change',
      flash === null, JSON.stringify({ flash }));

    // Workshop is the control: it proves the flash mechanism still WORKS, so S1's
    // null above is Revise being live and not the flash being broken app-wide.
    // ---- PARKED - SUPERSEDED by hide-workshop (Nick, Oct 23 11:01 am: the Workshop tab is HIDDEN in every theme until it is built).
    // The control pressed a tab that no longer exists: Workshop was the strip's only deferred posture on the prose page, so the flash mechanism
    // has no control left HERE (the screenplay's strip still flashes for Free Write/Revise - ab1.mjs). Kept VERBATIM, not run; the record is pok'd
    // below and the successor asserts the absence itself.
    // await enterMode(app, 'workshop');
    // const wsFlash = await app.evalJs("(() => { const el = document.querySelector('.desk-mode-soon'); return el ? el.textContent : null; })()");
    // const stillRevise = await tabState(app, 'revise');
    // ok('S1 CONTROL: Workshop STILL flashes coming-soon and does NOT switch — so the null above is Revise being live, not the flash mechanism having broken',
    //   typeof wsFlash === 'string' && wsFlash.length > 0 && !!stillRevise && stillRevise.ariaSelected === 'true',
    //   JSON.stringify({ wsFlash, stillRevise }));
    const wsTab = await tabState(app, 'workshop');
    await enterMode(app, 'workshop');   // a no-op by construction (the tab is absent) - kept so the press is the writer's, and the absence is what is asserted
    const wsFlash = await app.evalJs("(() => { const el = document.querySelector('.desk-mode-soon'); return el ? el.textContent : null; })()");
    const stillRevise = await tabState(app, 'revise');
    pok('PARKED (was "S1 CONTROL: Workshop STILL flashes coming-soon and does NOT switch — so the null above is Revise being live, not the flash mechanism having broken") - hide-workshop: the Workshop tab is absent, so there is nothing to flash or switch; live successor: S1 CONTROL [hide-workshop successor]',
      wsTab === null && wsFlash === null && !!stillRevise && stillRevise.ariaSelected === 'true', JSON.stringify({ wsTab, wsFlash, stillRevise }));
    ok('S1 CONTROL [hide-workshop successor]: there is NO Workshop tab (no data-mode-key="workshop"), no coming-soon flash can fire from it, and Revise stays selected - absent, not greyed',
      wsTab === null && wsFlash === null && !!stillRevise && stillRevise.ariaSelected === 'true',
      JSON.stringify({ wsTab, wsFlash, stillRevise }));
  }

  // =========================================================================
  // S1b — PERSISTENCE. The §2 S0 answer, asserted rather than merely recorded:
  // mode is PER PAGE, and Revise is admitted to that existing rule.
  // =========================================================================
  {
    await freshProsePage(app, 1366, 768);
    await enterMode(app, 'revise');
    const key = await app.evalJs("(() => Object.keys(localStorage).filter(k => k.startsWith('wrizo-mode-page-'))[0] || null)()");
    const stored = await app.evalJs("(() => { const k = Object.keys(localStorage).filter(k => k.startsWith('wrizo-mode-page-'))[0]; return k ? localStorage.getItem(k) : null; })()");
    ok("S1b: entering Revise PERSISTS it under the existing per-page key `wrizo-mode-page-<id>` — no new key, no new lifetime, the rule Draft already lives by",
      typeof key === 'string' && stored === 'revise', JSON.stringify({ key, stored }));

    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page after reload' });
    await sleep(400);
    const restored = await tabState(app, 'revise');
    ok('S1b: and the page RE-OPENS in Revise after a reload — the allowlist admits it, so Revise remembers itself exactly as Draft does rather than silently falling back to the default',
      !!restored && restored.ariaSelected === 'true', JSON.stringify({ restored }));
  }

  // =========================================================================
  // S2 — THE FORWARD-ONLY INSTRUMENT DOES NOT MOUNT. Asserted, not assumed.
  //
  // "Not disabled, not configured off: absent." So this asks for the instrument's
  // own OBSERVABLE FOOTPRINT and requires it to be missing, and then proves the
  // free-edit instrument is the one actually running — because "no run spans" alone
  // would also be true of a surface that rendered nothing at all.
  // =========================================================================
  {
    await freshProsePage(app, 1366, 768);
    await enterMode(app, 'revise');

    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
    await app.typeKeys('Alpha beta gamma.');
    await sleep(350);

    const runs = await app.evalJs("(() => ({ runs: document.querySelectorAll('.fo-run').length, struck: document.querySelectorAll('.fo-struck').length, word: document.querySelectorAll('.fo-word').length, nudge: !!document.querySelector('.fo-nudge') }))()");
    ok("S2 (§7.2): the RUN MODEL is absent in Revise — zero `.fo-run`, zero `.fo-struck`, zero `.fo-word`, no runway nudge. The forward-only surface's entire rendered footprint is missing, not hidden",
      runs.runs === 0 && runs.struck === 0 && runs.word === 0 && runs.nudge === false,
      JSON.stringify(runs));

    // The runway's DEFINING behaviour: in Free Write a backspace STRIKES (the text
    // stays visible, drops from the derived prose). In Revise it must really delete.
    // This is the check that cannot be satisfied by a merely-different renderer.
    const textBefore = await app.evalJs("(document.querySelector('.forward-only-editor')?.innerText || '').replace(/\\u200b/g, '')");
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
    await app.key('Backspace');
    await sleep(300);
    const textAfter = await app.evalJs("(document.querySelector('.forward-only-editor')?.innerText || '').replace(/\\u200b/g, '')");
    const struckAfter = await app.evalJs("document.querySelectorAll('.fo-struck').length");
    ok('S2 (§7.2): a BACKSPACE IN REVISE REALLY DELETES — the character leaves the surface and nothing is struck. The runway (strike, never erase) is not merely unrendered, it is not running',
      typeof textBefore === 'string' && typeof textAfter === 'string'
        && textAfter.length === textBefore.length - 1 && struckAfter === 0,
      JSON.stringify({ textBefore, textAfter, struckAfter }));

    // And the free-edit instrument IS the one running: decorateEditorFor's decorator
    // is what produces `.md-*` spans. This is the §3 S0 answer made VISIBLE — the seam
    // the parked lens will pass its flag decorator into is live on this surface.
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
    await app.typeKeys(' **bold** done');
    await sleep(350);
    const md = await app.evalJs("(() => ({ bold: document.querySelectorAll('.md-bold').length, marks: document.querySelectorAll('.md-mark').length }))()");
    // ---- PARKED - SUPERSEDED by typed-literal (Nick's ruling, Oct 16: typed `**` is LITERAL, stored escaped; Revise has no styling tools) ----
    // Kept VERBATIM and no longer run: typed ` **bold** done` makes no `.md-bold` now. What it recorded - Revise's text runs through the
    // decorator, the seam the parked error lens will use - is shown by the decorator rendering the typed stars' ESCAPES (`.md-escape`).
    // ok("S2/§3 S0: Revise's rendered text RUNS THROUGH `decorateEditorFor` — markdown decorates live (`.md-bold`/`.md-mark` present), which is the recorded answer the parked error lens needs: its flag decorator is an ARGUMENT to a seam that already exists, not new routing",
    //   md.bold >= 1 && md.marks >= 2, JSON.stringify(md));
    // ------------------------------------------------------------------
    const mdLit = await app.evalJs("(() => ({ bold: document.querySelectorAll('.forward-only-editor .md-bold').length, escapes: document.querySelectorAll('.forward-only-editor .md-escape.md-mark-hidden').length }))()");
    tlParks.s0 = { md, mdLit };
    ok("S2/§3 S0 [typed-literal successor]: Revise's rendered text RUNS THROUGH the decorator - the four typed stars render as literal stars with their escapes hidden (`.md-escape`), and nothing is bold: typed formatting characters are literal",
      md.marks >= 4 && mdLit.escapes === 4 && mdLit.bold === 0, JSON.stringify({ md, mdLit }));

    const plain = await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); return e ? e.innerText.replace(/\\u200b/g, '') : null; })()");
    // ---- PARKED - SUPERSEDED (item112a-deterministic, Oct 16; chat 1's ledgers 64 and 67) ----
    // Kept VERBATIM and no longer run. `includes('**bold**')` pinned WHERE the closing marks land, which is not this check's claim and is
    // timing-dependent: by the 211 rules a keyboard caret sits after the nearest VISIBLE character (store/hiddenMarks.ts snapCaret), so
    // once the closing `**` is typed the caret settles BEFORE it, and " done" is then typed into the run - the rules' own reabsorb, "two
    // words typed into a bold pair stays bold". That settling move runs on selectionchange, so a fast enough typist beats it and the
    // text reads `**bold** done`; otherwise `**bold done**`. Chat 1 measured both on main (ledger 67: one typeKeys call came out
    // `**bold** done`; split calls and a writer's pace `**bold done**`), and the check failed once on a tree without typing-latency (64).
    // The claim itself - every convention character is still a REAL character, the count preserved 1:1 - holds either way: successor below.
    // ok("S2/§3: and `entry.text` stays PLAIN — the convention characters are still real characters in the surface (count preserved 1:1 through decoration), which is the constraint that makes the caret restore valid and the CSS-only flag law the only lawful one",
    //   typeof plain === 'string' && plain.includes('**bold**'), JSON.stringify({ plain }));
    // ------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by typed-literal (Oct 16; Nick: a typed formatting character is LITERAL, stored escaped) ----
    // Kept VERBATIM and no longer run: the deterministic successor counted four `*` and a length of 16 + 14, and read the words with the
    // stars taken out - the typed stars are now stored `\*`, four backslashes longer, and the closing pair is literal text, so nothing is
    // reabsorbed: the text is the same at any typing speed. Successor below: the exact escaped text.
    // const typedRun = ' **bold** done';
    // const words = typeof plain === 'string' ? plain.replace(/\*/g, '') : null;
    // const countOk = typeof plain === 'string' && plain.length === 'Alpha beta gamma'.length + typedRun.length
    //   && (plain.match(/\*/g) || []).length === 4 && words === 'Alpha beta gamma bold done';
    // i112aParks.s2s3 = { plain, countOk };
    // ok("S2/§3 [deterministic successor]: and `entry.text` stays PLAIN — every convention character typed is still a REAL character in the surface: the four `*` all present and the count preserved 1:1 (wherever the 211 rules' reabsorb puts the closing pair)",
    //   countOk, JSON.stringify({ plain, length: plain && plain.length, want: 'Alpha beta gamma'.length + typedRun.length }));
    // ------------------------------------------------------------------
    const B = String.fromCharCode(92);
    const wantLit = `Alpha beta gamma ${B}*${B}*bold${B}*${B}* done`;
    tlParks.s23 = { plain, wantLit };   // also the record of the deterministic successor's park, and of the original's
    ok("S2/§3 [typed-literal successor]: and `entry.text` stays PLAIN — every typed character is a real character in the surface, the typed stars stored ESCAPED (literal, count preserved 1:1 through decoration), deterministic at any typing speed",
      plain === wantLit, JSON.stringify({ plain, wantLit }));
  }

  // =========================================================================
  // S7 — BOTH GRIPS RENDER AND BOTH OPEN (Nick's empty-drawer ruling).
  // Run before S3 because S3's geometry legs depend on both hands opening.
  // =========================================================================
  for (const [w, h] of REFERENCE) {
    await freshProsePage(app, w, h);
    await enterMode(app, 'revise');

    const deskGrip = await gripDiag(app, '.wz-sliver-grip');
    const counselGrip = await gripDiag(app, '.wz-tutor-grip');
    ok(`S7 (§7.7 @ ${w}x${h}): BOTH GRIPS ARE VISIBLE IN REVISE from 112-A — Desk and Counsel both render and both are hit-testable. Nick's ruling: the mirror is visually complete now, and 112-C fills the Desk drawer later`,
      deskGrip.present === true && deskGrip.reachable === true
        && counselGrip.present === true && counselGrip.reachable === true,
      JSON.stringify({ deskGrip, counselGrip }));

    // page-size (Oct 23): the room the two hands have, measured with both shut (the page never moves) - it decides which rule the successors below expect
    const room7 = await roomForBoth(app);
    ok(`S7 [measured] (premise @ ${w}x${h}): the page and the stage are measurable with both hands shut`, !!room7, JSON.stringify(room7));
    const both7 = !!room7 && room7.both;
    await openSliverByGrip(app);
    await openTutorByGrip(app);
    const open = await app.evalJs(DRAWERS);
    // ---- PARKED - SUPERSEDED by Phase 1 (Fable's ruling, Oct 12: ONE DRAWER AT A TIME at every width - opening either hand closes the other), 2026-10-12 ----
    // Kept VERBATIM and no longer run. The successor follows the parked lines.
    //
    // ok(`S7 (§7.7 @ ${w}x${h}): BOTH OPEN THEIR TABS — the Desk drawer opens onto EMPTY CONTENT WITHOUT ERROR, and the Counsel opens onto its own. An empty drawer opens, so G3's absence-over-grayed does not govern it`,
    // open.sliverOpen === 'true' && open.tutorOpen === 'true',
    // JSON.stringify(open));
    // ----------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by page-size (Fable's ruling, Oct 23: the Oct 12 "one drawer at a time, at every width" rule is REPLACED by the MEASURED rule - both
    // hands stand where the band holds the page AND both at their 200px minimum, otherwise opening one closes the other; the page never moves), 2026-10-23 ----
    // Kept VERBATIM and no longer run (the Oct 12 successors, with the driver press that assumed the Counsel had yielded). The measured successors follow.
    //
    // ok(`S7 successor [one drawer at a time] (§7.7 @ ${w}x${h}): the Counsel opens onto its own tab and the Desk hand HAS YIELDED - only one drawer is open at a time`,
    //   open.tutorOpen === 'true' && open.sliverOpen === 'false',
    //   JSON.stringify(open));
    // await openSliverByGrip(app);   // the other hand: the Desk drawer opens onto EMPTY CONTENT WITHOUT ERROR, and the Counsel yields
    // const deskOnly = await app.evalJs(DRAWERS);
    // ok(`S7 successor (§7.7 @ ${w}x${h}): the Desk drawer opens onto EMPTY CONTENT WITHOUT ERROR (G3's absence-over-grayed does not govern an empty drawer), and the Counsel has yielded`,
    //   deskOnly.sliverOpen === 'true' && deskOnly.tutorOpen === 'false',
    //   JSON.stringify(deskOnly));
    // ----------------------------------------------------------------------
    pok(`PARKED (was, VERBATIM: "S7 successor [one drawer at a time] (§7.7 @ ${w}x${h}): the Counsel opens onto its own tab and the Desk hand HAS YIELDED - only one drawer is open at a time") - SUPERSEDED by page-size (Fable, Oct 23): the measured rule replaces Oct 12's`,
      true, 'successor: S7 successor [measured] - the Desk still stands where the band holds the page and both hands at DRAWER_MIN, else it has yielded');
    pok(`PARKED (was, VERBATIM: "S7 successor (§7.7 @ ${w}x${h}): the Desk drawer opens onto EMPTY CONTENT WITHOUT ERROR (G3's absence-over-grayed does not govern an empty drawer), and the Counsel has yielded") - SUPERSEDED by page-size (Fable, Oct 23)`,
      true, 'successor: S7 successor [measured] - the Desk stands open onto empty content, the Counsel beside it where there is room, else yielded');
    ok(`S7 successor [measured] (§7.7 @ ${w}x${h}): the Counsel opens onto its own tab, and the Desk hand ${both7 ? 'STILL STANDS - the band holds the page and both hands at their minimum' : 'HAS YIELDED - no room for both at their minimum'}`,
      open.tutorOpen === 'true' && open.sliverOpen === (both7 ? 'true' : 'false'),
      JSON.stringify({ open, room7 }));
    if (!both7) await openSliverByGrip(app);   // with no room the Desk must open again (and the Counsel yields); with room it never closed
    const deskOnly = await app.evalJs(DRAWERS);
    ok(`S7 successor [measured] (§7.7 @ ${w}x${h}): the Desk drawer stands open onto EMPTY CONTENT WITHOUT ERROR (G3's absence-over-grayed does not govern an empty drawer), and the Counsel ${both7 ? 'stands beside it' : 'has yielded'}`,
      deskOnly.sliverOpen === 'true' && deskOnly.tutorOpen === (both7 ? 'true' : 'false'),
      JSON.stringify({ deskOnly, room7 }));

    // The empty drawer is empty of TENANTS, not of the sliver's own standing
    // furniture — that distinction is the ruling, and asserting the wrong one would
    // quietly forbid the goal block every surface carries.
    const deskBody = await app.evalJs("(() => ({ toolsBody: document.querySelectorAll('.wz-sliver-body').length, sections: document.querySelectorAll('.wz-sliver-section').length, goalFoot: !!document.querySelector('.wz-sliver-panel') }))()");
    pok(`PARKED (was, VERBATIM: "S7 (@ ${w}x${h}): and the Desk drawer is empty OF TENANTS — zero tool sections render (no Type section, no Draft rail inherited down the else-branch) while the drawer itself still stands open") - SUPERSEDED by ITEM 207: Revise's drawer now carries ONE tenant, the Type control (112-A named it: '112-C fills this drawer with 83's Type section'); the successor is the next check, same fixture`,
      true, 'superseded by item 207; successor asserts exactly one tool section and that it is the Type control');
    const deskTenant = await app.evalJs("(() => ({ toolsBody: document.querySelectorAll('.wz-sliver-body').length, sections: document.querySelectorAll('.wz-sliver-section').length, types: document.querySelectorAll('.wz-sliver-section .wz-type').length, typeInputs: document.querySelectorAll('.wz-type input').length }))()");
    ok(`S7 SUCCESSOR (@ ${w}x${h}, item 207): the Desk drawer's ONE tenant is the Type control - exactly one tool section, and it is the full-form Type control (a number field), while the drawer itself still stands open`,
      deskTenant.toolsBody === 1 && deskTenant.sections === 1 && deskTenant.types === 1 && deskTenant.typeInputs === 1,
      JSON.stringify(deskTenant));

    // §8's exit names OPEN AND CLOSE by their own grips, so the close is asserted
    // as well. A drawer that opens and will not shut is not a walkable room, and
    // the empty Desk drawer is exactly where that failure would hide: an empty
    // panel gives the writer no content to notice is stuck.
    // ---- PARKED - SUPERSEDED by Phase 1 (Fable's ruling, Oct 12: ONE DRAWER AT A TIME at every width - opening either hand closes the other), 2026-10-12 ----
    // Kept VERBATIM and no longer run. The successor follows the parked lines.
    //
    // await openSliverByGrip(app);   // the same grip, a second press
    // await openTutorByGrip(app);
    // const shut = await app.evalJs(DRAWERS);
    // ----------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by Phase 1 (Fable's ruling, Oct 12: ONE DRAWER AT A TIME at every width - opening either hand closes the other), 2026-10-12 ----
    // Kept VERBATIM and no longer run. The successor follows the parked lines.
    //
    // ok(`S7 (§8 @ ${w}x${h}): BOTH HANDS CLOSE BY THEIR OWN GRIPS — a second press on each shuts it, the empty Desk drawer included. §8's exit names open AND close`,
    // shut.sliverOpen === 'false' && shut.tutorOpen === 'false',
    // JSON.stringify({ open, shut }));
    // ----------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by page-size (Fable's ruling, Oct 23: the measured rule replaces Oct 12's one-drawer-at-every-width), 2026-10-23 ----
    // Kept VERBATIM and no longer run (the Oct 12 successor and its driver press, which closed only the Desk because the Counsel had yielded).
    //
    // await openSliverByGrip(app);   // the open hand (the Desk) closes by its own grip
    // const shut = await app.evalJs(DRAWERS);
    // ok(`S7 successor (§8 @ ${w}x${h}): the open hand CLOSES BY ITS OWN GRIP - a second press shuts the empty Desk drawer, and nothing is left open. §8's exit names open AND close`,
    //   shut.sliverOpen === 'false' && shut.tutorOpen === 'false',
    //   JSON.stringify({ open, shut }));
    // ----------------------------------------------------------------------
    pok(`PARKED (was, VERBATIM: "S7 successor (§8 @ ${w}x${h}): the open hand CLOSES BY ITS OWN GRIP - a second press shuts the empty Desk drawer, and nothing is left open. §8's exit names open AND close") - SUPERSEDED by page-size (Fable, Oct 23)`,
      true, 'successor: S7 successor [measured] (§8) - every open hand closes by its own grip, both where both stood');
    await openSliverByGrip(app);                  // the Desk closes by its own grip
    if (both7) await openTutorByGrip(app);        // and, with both standing, the Counsel by its own
    const shut = await app.evalJs(DRAWERS);
    ok(`S7 successor [measured] (§8 @ ${w}x${h}): every open hand CLOSES BY ITS OWN GRIP - ${both7 ? 'the Desk and the Counsel, each by its own second press' : 'the Desk (the Counsel had yielded)'} - and nothing is left open. §8's exit names open AND close`,
      shut.sliverOpen === 'false' && shut.tutorOpen === 'false',
      JSON.stringify({ open, shut, room7 }));
  }

  // =========================================================================
  // S3 — THE GEOMETRY FLOOR. "Paper never reflows for chrome," at BOTH widths,
  // across every hand state. This is the ticket's own point (RS1).
  // =========================================================================
  for (const [w, h] of REFERENCE) {
    await freshProsePage(app, w, h);
    await enterMode(app, 'revise');
    await sleep(250);

    const closed = await measureOf(app);
    const room3 = await roomForBoth(app);   // page-size (Oct 23): the room the hands have, measured with both shut
    await openSliverByGrip(app);
    const deskOpen = await measureOf(app);
    await openSliverByGrip(app);                  // close it again
    await sleep(300);
    await openTutorByGrip(app);
    const counselOpen = await measureOf(app);
    await openSliverByGrip(app);                  // now both
    const bothOpen = await measureOf(app);
    const drawers = await app.evalJs(DRAWERS);

    const same = (a, b) => !!a && !!b
      && Math.abs(a.paperL - b.paperL) < 0.5 && Math.abs(a.paperR - b.paperR) < 0.5
      && Math.abs(a.textL - b.textL) < 0.5 && Math.abs(a.textR - b.textR) < 0.5
      && Math.abs(a.textW - b.textW) < 0.5;

    ok(`S3 (§7.3 @ ${w}x${h}): opening the DESK hand does not move the paper — sheet rect AND rendered text column both unchanged. The measure is the constant`,
      same(closed, deskOpen), JSON.stringify({ closed, deskOpen }));
    ok(`S3 (§7.3 @ ${w}x${h}): opening the COUNSEL hand does not move the paper — the same two boxes, unchanged`,
      same(closed, counselOpen), JSON.stringify({ closed, counselOpen }));
    // ---- PARKED - SUPERSEDED by Phase 1 (Fable's ruling, Oct 12: ONE DRAWER AT A TIME at every width - opening either hand closes the other), 2026-10-12 ----
    // Kept VERBATIM and no longer run. The successor follows the parked lines.
    //
    // ok(`S3 (§7.3 @ ${w}x${h}): and with BOTH hands standing, the paper is STILL where it was with both shut — chrome never reflows the writer's line`,
    // same(closed, bothOpen), JSON.stringify({ closed, bothOpen, drawers }));
    // ----------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by page-size (Fable's ruling, Oct 23: the measured rule replaces Oct 12's one-drawer-at-every-width), 2026-10-23 ----
    // Kept VERBATIM and no longer run (the Oct 12 successor). The measured successor follows.
    //
    // ok(`S3 successor (§7.3 @ ${w}x${h}): and with the hands TAKING TURNS (the second opening closes the first - one drawer at a time) the paper is STILL where it was with both shut - chrome never reflows the writer's line`,
    //   same(closed, bothOpen) && drawers.sliverOpen === 'true' && drawers.tutorOpen === 'false', JSON.stringify({ closed, bothOpen, drawers }));
    // ----------------------------------------------------------------------
    pok(`PARKED (was, VERBATIM: "S3 successor (§7.3 @ ${w}x${h}): and with the hands TAKING TURNS (the second opening closes the first - one drawer at a time) the paper is STILL where it was with both shut - chrome never reflows the writer's line") - SUPERSEDED by page-size (Fable, Oct 23)`,
      true, 'successor: S3 successor [measured] - both hands stand where there is room, else they take turns; the paper never moves either way');
    const both3 = !!room3 && room3.both;
    ok(`S3 successor [measured] (§7.3 @ ${w}x${h}): with the second hand opened, ${both3 ? 'BOTH hands stand (the band holds the page and both at their minimum)' : 'the hands TAKE TURNS (no room for both at their minimum)'} - and the paper is STILL where it was with both shut - chrome never reflows the writer's line`,
      !!room3 && same(closed, bothOpen) && drawers.sliverOpen === 'true' && drawers.tutorOpen === (both3 ? 'true' : 'false'), JSON.stringify({ closed, bothOpen, drawers, room3 }));

    // CONTROL — the measurement must prove it was measuring something real. A
    // collapsed or unrendered sheet would satisfy every equality above trivially.
    ok(`S3 CONTROL (@ ${w}x${h}): the paper and its text column are genuinely LAID OUT (non-zero, text narrower than sheet) — so the equalities above compare real boxes rather than three zeros`,
      !!closed && closed.paperW > 100 && closed.textW > 50 && closed.textW <= closed.paperW + 1,
      JSON.stringify(closed));
  }

  // =========================================================================
  // S4 — THE ANCHOR LAW. Both hands anchor to the PAPER, not the screen,
  // asserted against INDEPENDENTLY RENDERED TRUTHS (never against a formula).
  // =========================================================================
  const anchorTrack = [];
  for (const [w, h] of REFERENCE) {
    await freshProsePage(app, w, h);
    await enterMode(app, 'revise');
    await openSliverByGrip(app);
    await openTutorByGrip(app);
    await sleep(350);

    const geo = await app.evalJs(`(() => {
      const paper = document.querySelector('.mode-pagecol');
      const sheet = document.querySelector('.mode-page');
      const dock = document.querySelector('.wz-sliver');
      const tutor = document.querySelector('.wz-tutor-panel');
      const stage = document.querySelector('.desk-frame-stage');
      const r = (el) => el ? (b => ({ l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1) }))(el.getBoundingClientRect()) : null;
      return { paper: r(paper), sheet: r(sheet), dock: r(dock), tutor: r(tutor), stage: r(stage), vw: window.innerWidth };
    })()`);

    // The Desk hand's own ruled contract (item 83 M1, and scripts/menus-probe.mjs's
    // acceptance instrument): the dock's RIGHT edge IS the paper's LEFT edge, within
    // 0.6px. Both rects read independently from the live DOM — the "self-check
    // compares independently rendered truths" the Anchor Law names.
    //
    // A MEASURED FINDING, DISCLOSED RATHER THAN SMOOTHED. That invariant HOLDS at
    // 1366 (delta 0.0) and is VIOLATED BY 29.7px AT 1100 — and the violation is NOT
    // this ticket's. It was controlled against clean origin/main (89c5955), src
    // reverted and rebuilt in this same worktree, and main reads the identical
    // -29.7 at 1100 in Draft AND Free Write. Revise's numbers are byte-identical to
    // Draft's at both widths, which is exactly what 112-A owes: the mirrored hands'
    // geometry, carried unchanged onto a new mode.
    //
    // So the assertion is split, and neither half is weakened to hide the other:
    // the flush law is asserted where the app achieves it, and the deviation is
    // PINNED to main's measured baseline so it is a regression guard rather than a
    // silence. The 1100 fault is surfaced to the desk (brief §5: an anchoring fault
    // is a CSS fault, repaired in CSS — and 117/119 are a joint pass elsewhere);
    // it is not repaired here, because §5 also says stop-and-surface rather than
    // reconcile in the build.
    const deskDelta = geo.dock && geo.paper ? +(geo.paper.l - geo.dock.r).toFixed(2) : null;
    if (w >= 1366) {
      ok(`S4 (§7.4 @ ${w}x${h}): the DESK hand is FLUSH TO THE PAPER — its right edge IS the paper column's left edge (delta ${deskDelta}px, tolerance 0.6). The ruled anchor contract, held`,
        deskDelta != null && Math.abs(deskDelta) <= 0.6, JSON.stringify({ geo, deskDelta }));
    } else {
      // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23, rulings a-b): the prose page is the letter page, 8.5 page-inches = 620px laid out,
      // where 8884d49-era pages were 615.4 - so the paper's left edge sits 2.3px further left at 1100 and the same pre-existing overhang now reads -32
      // (lane 3), not -29.7. The pin's point - a regression guard on a measured, disclosed deviation - is the successor's, re-pinned on the letter
      // page. Kept VERBATIM and no longer run; record below (pok).
      //
      // ok(`S4 (§7.4 @ ${w}x${h}): PRE-EXISTING ANCHOR DEVIATION, PINNED — the Desk hand overhangs the paper's left edge by 29.7px at the frame's own minimum width. CONTROLLED AGAINST CLEAN origin/main 89c5955 (src reverted and rebuilt in this worktree): main reads the SAME -29.7 in Draft and Free Write, so this is app-wide and predates 112-A. Pinned here as a regression guard, and SURFACED to the desk for the 117/119 joint pass — not repaired in this build, per §5's stop-and-surface`,
      //   deskDelta != null && Math.abs(deskDelta - (-29.7)) <= 1.0, JSON.stringify({ geo, deskDelta, mainBaseline: -29.7, controlSha: '89c5955' }));
      // ------------------------------------------------------------------
      pok(`PARKED (was "S4 (§7.4 @ ${w}x${h}): PRE-EXISTING ANCHOR DEVIATION, PINNED — the Desk hand overhangs the paper's left edge by 29.7px at the frame's own minimum width ...") - page-size rulings a-b: the letter page is 620px, so the same overhang reads -32; live successor: S4 [page-size successor] PRE-EXISTING ANCHOR DEVIATION, RE-PINNED`,
        deskDelta != null && Math.abs(deskDelta - PAGE_SIZE_PIN) <= 1.0, JSON.stringify({ deskDelta, pin: PAGE_SIZE_PIN }));
      ok(`S4 (§7.4 @ ${w}x${h}) [page-size successor]: PRE-EXISTING ANCHOR DEVIATION, RE-PINNED on the letter page — the Desk hand overhangs the paper's left edge by ${-PAGE_SIZE_PIN}px at the frame's own minimum width (the 29.7px of main @ 89c5955, plus the 2.3px the 620px letter page adds on each side). A regression guard, still surfaced to the desk for 117/119`,
        deskDelta != null && Math.abs(deskDelta - PAGE_SIZE_PIN) <= 1.0, JSON.stringify({ geo, deskDelta, pin: PAGE_SIZE_PIN, was: -29.7 }));
    }

    // WHAT 112-A ITSELF OWES, asserted directly: Revise's hand geometry is the SAME
    // geometry Draft has. This is the check that would actually catch a 112-A
    // regression, and it is independent of whether the absolute law holds at a
    // given width — which is why the deviation above cannot mask it.
    //
    // A FRESH PAGE, not this one. Switching mode in place leaves both hands ALREADY
    // OPEN, so the grip calls below would TOGGLE THEM SHUT and the comparison would
    // measure a closing panel against a settled one. Found by measurement, not by
    // reading: the first cut of this check reported Revise's Counsel panel at 374px
    // against Draft's at 280px on the same width, which is the Tutor's own
    // margin-measure effect having run mid-transition. The two legs must be
    // established the SAME WAY from the SAME starting state or the equality means
    // nothing.
    await freshProsePage(app, w, h);
    await enterMode(app, 'draft');
    // page-size: a fresh Draft page opens in the Typewriter ZOOM (Arbor's default), which tucks both hands by ruling - so the successor below compares
    // Revise with Draft in the NORMAL view: the writer's own toggle turned off first (pressed through the DOM; the hands stay closed, as in Revise's leg)
    const draftZoomed = await app.evalJs("document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true'");
    if (draftZoomed) {
      await app.evalJs("document.querySelector('[data-mode-toggle=\"typewriter\"]')?.click()"); await sleep(500);
      if (await app.evalJs("document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true'")) {
        await openSliverByGrip(app); await sleep(300);
        await app.evalJs("document.querySelector('[data-mode-toggle=\"typewriter\"]')?.click()"); await sleep(500);
        await openSliverByGrip(app); await sleep(400);
      }
    }
    const draftNormal = await app.evalJs("document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') !== 'true'");
    await openSliverByGrip(app);
    await openTutorByGrip(app);
    await sleep(350);
    const draftGeo = await app.evalJs(`(() => {
      const r = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1) }; };
      return { paper: r('.mode-pagecol'), sheet: r('.mode-page'), dock: r('.wz-sliver'), tutor: r('.wz-tutor-panel') };
    })()`);
    const near = (a, b) => !!a && !!b && Math.abs(a.l - b.l) < 0.6 && Math.abs(a.r - b.r) < 0.6;
    // ---- PARKED - SUPERSEDED by page-size (Nick + Fable, Oct 23; the zoom's "panels tucked"): Draft opened in the Typewriter ZOOM (Arbor's default) -
    // the page ~1.6x in a stage-wide column, both hands tucked - so its rects could never equal Revise's, which has no typewriter (lane 3: Draft's
    // column 1034 wide at 1100). The claim holds in the view both modes share; the successor compares Revise with Draft in the NORMAL view (Draft's
    // own toggle off, above). Kept VERBATIM and no longer run; record below (pok).
    //
    // ok(`S4 (@ ${w}x${h}): REVISE'S HANDS SIT EXACTLY WHERE DRAFT'S DO — Desk dock, Counsel panel and paper all at identical rects across the two modes. This is 112-A's own claim (§4: build to 119's geometry, carried onto Revise unchanged), and it is what a 112-A geometry regression would break`,
    //   near(geo.dock, draftGeo.dock) && near(geo.tutor, draftGeo.tutor) && near(geo.paper, draftGeo.paper),
    //   JSON.stringify({ revise: { dock: geo.dock, tutor: geo.tutor, paper: geo.paper }, draft: draftGeo }));
    // ------------------------------------------------------------------
    const sameHands = draftNormal && near(geo.dock, draftGeo.dock) && near(geo.tutor, draftGeo.tutor) && near(geo.paper, draftGeo.paper) && near(geo.sheet, draftGeo.sheet);
    pok(`PARKED (was "S4 (@ ${w}x${h}): REVISE'S HANDS SIT EXACTLY WHERE DRAFT'S DO — Desk dock, Counsel panel and paper all at identical rects across the two modes ...") - page-size: Draft opens zoomed (hands tucked by ruling); live successor: S4 (@ ${w}x${h}) [page-size successor], in the normal view`,
      sameHands, JSON.stringify({ revise: { dock: geo.dock, tutor: geo.tutor, paper: geo.paper, sheet: geo.sheet }, draft: draftGeo, draftZoomed, draftNormal }));
    ok(`S4 (@ ${w}x${h}) [page-size successor]: REVISE'S HANDS SIT EXACTLY WHERE DRAFT'S DO in the view they share — Desk dock, Counsel panel, column and painted page at identical rects, with Draft in the NORMAL view (its Typewriter off: the zoom tucks both hands by ruling)`,
      sameHands, JSON.stringify({ revise: { dock: geo.dock, tutor: geo.tutor, paper: geo.paper, sheet: geo.sheet }, draft: draftGeo, draftZoomed, draftNormal }));

    // The Counsel hand: paper-anchored means it begins where the paper ends, in the
    // margin — never pinned to the viewport. Item 119 supersedes FX18 S2 regime (3)
    // on the ANCHOR question only; FX18's usable-floor degradation is still lawful,
    // so this asserts the anchor by NAME of the regime the measured margin selects.
    const margin = geo.stage && geo.sheet ? +(geo.stage.r - geo.sheet.r).toFixed(1) : null;
    const USABLE_FLOOR = 280;  // mirrors Tutor.tsx USABLE_PANEL_FLOOR_PX
    if (margin != null && margin >= USABLE_FLOOR) {
      ok(`S4 (§7.4 @ ${w}x${h}, margin ${margin}px >= ${USABLE_FLOOR}): the COUNSEL hand OCCUPIES THE MARGIN and never covers the paper — its left edge is at or past the sheet's right edge. Paper-anchored, per 119`,
        !!geo.tutor && !!geo.sheet && geo.tutor.l >= geo.sheet.r - 2,
        JSON.stringify({ geo, margin }));
    } else {
      ok(`S4 (§7.4 @ ${w}x${h}, margin ${margin}px < ${USABLE_FLOOR}): the COUNSEL hand takes FX18's documented narrow-margin degradation — it overlays at natural open-w rather than shrinking below a usable panel — and it is still positioned FROM THE PAPER, ending within the stage rather than pinned to the viewport edge`,
        !!geo.tutor && !!geo.stage && geo.tutor.r <= geo.stage.r + 2 && geo.tutor.r <= geo.vw + 1 && geo.tutor.w > 0,
        JSON.stringify({ geo, margin }));
    }

    // The screen-anchored failure this law exists to forbid, stated as its own check:
    // a viewport-pinned hand would sit flush to 0 / vw.
    ok(`S4 (@ ${w}x${h}): NEITHER hand is screen-anchored — the Desk hand does not start at x=0 and the Counsel hand does not end at the viewport's right edge. This is the fault the Anchor Law names, asserted as an absence`,
      !!geo.dock && !!geo.tutor && geo.dock.l > 1 && geo.tutor.r < geo.vw - 1,
      JSON.stringify({ dock: geo.dock, tutor: geo.tutor, vw: geo.vw }));
    anchorTrack.push({ w, dockR: geo.dock ? geo.dock.r : null, paperL: geo.paper ? geo.paper.l : null, vw: geo.vw });
  }

  // PAPER-ANCHORED, NOT SCREEN-ANCHORED — proven ACROSS the two widths, which no
  // single-width check can do. A screen-anchored element holds a constant offset
  // from one viewport edge as the window resizes; a paper-anchored one holds station
  // on the paper while the paper itself travels.
  //
  // Deliberately NOT asserted as "dock.right travels exactly as far as paper.left":
  // that would be the flush law wearing a second costume, and at 1100 it is already
  // known to be off by the pinned 29.7px, so such a check would report the SAME
  // pre-existing deviation twice and call it two findings. What is asserted instead
  // is the thing the deviation cannot fake: the dock stays PINNED NEAR THE PAPER'S
  // EDGE (within 30px) while the paper travels 133px, and NEITHER viewport offset
  // stays constant.
  {
    const a = anchorTrack.find(x => x.w === 1100);
    const b = anchorTrack.find(x => x.w === 1366);
    const paperTravel = a && b ? +(b.paperL - a.paperL).toFixed(1) : null;
    const gapA = a ? +(a.dockR - a.paperL).toFixed(1) : null;   // 29.7 (the pinned deviation)
    const gapB = b ? +(b.dockR - b.paperL).toFixed(1) : null;   // 0.0  (flush)
    const fromLeftA = a ? a.dockR : null;
    const fromLeftB = b ? b.dockR : null;
    const fromRightA = a ? +(a.vw - a.dockR).toFixed(1) : null;
    const fromRightB = b ? +(b.vw - b.dockR).toFixed(1) : null;
    // ---- PARKED - SUPERSEDED by page-size (rulings a-b): "within 30px" was sized to the old pin (29.7px); the letter page moves that overhang to 32px
    // (lane 3: gapA 32, every other term held). The successor keeps the claim and sizes the station to the re-pinned deviation. Kept VERBATIM and no
    // longer run; record below (pok).
    //
    // ok('S4 (§7.4): THE DESK HAND IS PAPER-ANCHORED, NOT SCREEN-ANCHORED — across the two reference widths the paper travels 133px and the dock holds station on its edge (within 30px at both), while NEITHER viewport offset stays constant: measured from the left it moves ~103px, from the right ~163px. A screen-anchored dock would have held one of those two fixed',
    //   paperTravel != null && Math.abs(paperTravel) > 100
    //     && gapA != null && gapB != null && Math.abs(gapA) <= 30 && Math.abs(gapB) <= 30
    //     && Math.abs(fromLeftB - fromLeftA) > 20 && Math.abs(fromRightB - fromRightA) > 20,
    //   JSON.stringify({ anchorTrack, paperTravel, gapA, gapB, fromLeftA, fromLeftB, fromRightA, fromRightB }));
    // ------------------------------------------------------------------
    const station = -PAGE_SIZE_PIN + 1;
    const anchored = paperTravel != null && Math.abs(paperTravel) > 100
      && gapA != null && gapB != null && Math.abs(gapA) <= station && Math.abs(gapB) <= station
      && Math.abs(fromLeftB - fromLeftA) > 20 && Math.abs(fromRightB - fromRightA) > 20;
    pok('PARKED (was "S4 (§7.4): THE DESK HAND IS PAPER-ANCHORED, NOT SCREEN-ANCHORED — across the two reference widths the paper travels 133px and the dock holds station on its edge (within 30px at both) ...") - page-size rulings a-b: the re-pinned overhang is 32px; live successor: S4 (§7.4) [page-size successor]',
      anchored, JSON.stringify({ paperTravel, gapA, gapB, station }));
    ok(`S4 (§7.4) [page-size successor]: THE DESK HAND IS PAPER-ANCHORED, NOT SCREEN-ANCHORED — across the two reference widths the paper travels 100px+ and the dock holds station on its edge (within the re-pinned ${station}px at both), while NEITHER viewport offset stays constant`,
      anchored, JSON.stringify({ anchorTrack, paperTravel, gapA, gapB, station, fromLeftA, fromLeftB, fromRightA, fromRightB }));
  }

  // =========================================================================
  // S5 — COEXISTENCE. Both-open only where the surface has room; graceful yield
  // otherwise. Every leg carries its own CONTROL, because a law that had stopped
  // running would pass the outcome check on the wide leg and a law that always
  // yielded would pass it on the narrow one.
  // =========================================================================
  for (const [w, h] of REFERENCE) {
    await freshProsePage(app, w, h);
    await enterMode(app, 'revise');
    await openSliverByGrip(app);
    const band = await app.evalJs(BAND);
    await openFarLeft(app);
    await sleep(500);
    const after = await app.evalJs(DRAWERS);

    ok(`S5 (§7.5 @ ${w}x${h}): GRACEFUL YIELD IN REVISE — a far-left open shuts the Desk drawer where the band cannot hold both. The two-drawer law governs this surface exactly as it governs every other`,
      after.sliverOpen === 'false' && after.cascadeVisible === 'true',
      JSON.stringify({ band, after }));
    ok(`S5 CONTROL (@ ${w}x${h}): the band genuinely CANNOT hold both, so the close above is the LAW firing and not a coincidence of this width`,
      !!band && band.band < band.tools + band.cascade, JSON.stringify(band));
  }
  {
    // The other half of Nick's ruling, and the guard against a "fix" that always
    // closes: where the band holds both, both STAND. Not a reference width — a control.
    await freshProsePage(app, ...WIDE);
    await enterMode(app, 'revise');
    await openSliverByGrip(app);
    await openFarLeft(app);
    await sleep(500);
    const wide = await app.evalJs(DRAWERS);
    const wideBand = await app.evalJs(BAND);
    ok(`S5 (§7.5 @ ${WIDE[0]}x${WIDE[1]}): both drawers STAND in Revise when the band holds them — the coexistence law is permissive where there is room, not merely exclusive`,
      wide.sliverOpen === 'true' && wide.cascadeVisible === 'true',
      JSON.stringify({ wide, wideBand }));
    ok(`S5 CONTROL (@ ${WIDE[0]}): that coexistence is EARNED — the measured band is at least as wide as both tenants together`,
      !!wideBand && wideBand.band >= wideBand.tools + wideBand.cascade, JSON.stringify(wideBand));
  }
  for (const [w, h] of REFERENCE) {
    // The MIRRORED pair (item 119): the two HANDS are on opposite sides of the paper,
    // so their coexistence is a different question from the left-band law above, and
    // it is the one §4 is actually about. Where there is room, both stand and neither
    // covers the other.
    await freshProsePage(app, w, h);
    await enterMode(app, 'revise');
    const room5 = await roomForBoth(app);   // page-size (Oct 23): the room the hands have, measured with both shut
    await openSliverByGrip(app);
    await openTutorByGrip(app);
    await sleep(350);
    const sliverPanel = await rectOf(app, '.wz-sliver-panel');
    const tutorPanel = await rectOf(app, '.wz-tutor-panel');
    const state = await app.evalJs(DRAWERS);
    // ---- PARKED - SUPERSEDED by Phase 1 (Fable's ruling, Oct 12: ONE DRAWER AT A TIME at every width - opening either hand closes the other), 2026-10-12 ----
    // Kept VERBATIM and no longer run. The successor follows the parked lines.
    //
    // ok(`S5 (§7.5 @ ${w}x${h}): the two HANDS coexist in Revise — Desk and Counsel both stand open and DO NOT OVERLAP, so every control under either stays reachable (the mirrored pair, item 119)`,
    // state.sliverOpen === 'true' && state.tutorOpen === 'true'
    // && !!sliverPanel && !!tutorPanel && sliverPanel.r <= tutorPanel.l + 1,
    // JSON.stringify({ state, sliverPanel, tutorPanel }));
    // ----------------------------------------------------------------------
    // ---- PARKED - SUPERSEDED by page-size (Fable's ruling, Oct 23: the measured rule replaces Oct 12's one-drawer-at-every-width), 2026-10-23 ----
    // Kept VERBATIM and no longer run (the Oct 12 successor). The measured successor follows; where there is room it is the original S5 above again.
    //
    // ok(`S5 successor (§7.5 @ ${w}x${h}): the two HANDS TAKE TURNS in Revise - opening the Counsel closes the Desk (one drawer at a time, at every width), and the open Counsel panel is reachable`,
    //   state.sliverOpen === 'false' && state.tutorOpen === 'true' && !!tutorPanel,
    //   JSON.stringify({ state, sliverPanel, tutorPanel }));
    // ----------------------------------------------------------------------
    pok(`PARKED (was, VERBATIM: "S5 successor (§7.5 @ ${w}x${h}): the two HANDS TAKE TURNS in Revise - opening the Counsel closes the Desk (one drawer at a time, at every width), and the open Counsel panel is reachable") - SUPERSEDED by page-size (Fable, Oct 23)`,
      true, 'successor: S5 successor [measured] - both hands stand and do not overlap where there is room, else they take turns');
    const both5 = !!room5 && room5.both;
    ok(`S5 successor [measured] (§7.5 @ ${w}x${h}): ${both5 ? 'the two HANDS coexist in Revise - Desk and Counsel both stand open and DO NOT OVERLAP (the band holds the page and both at their minimum)' : 'the two HANDS TAKE TURNS in Revise - opening the Counsel closes the Desk (no room for both at their minimum)'}, and the open Counsel panel is reachable`,
      !!room5 && state.tutorOpen === 'true' && !!tutorPanel && state.sliverOpen === (both5 ? 'true' : 'false')
        && (!both5 || (!!sliverPanel && sliverPanel.r <= tutorPanel.l + 1)),
      JSON.stringify({ state, sliverPanel, tutorPanel, room5 }));
  }

  // =========================================================================
  // S6 — THE ANNOUNCE INVARIANT. The check exists precisely to catch a future
  // path that forgets, so it must exercise a path that is NOT the grip's own
  // handler. The menus-errata defect was a real tablet-tap fault: the drawer was
  // visibly open and the store still read `openDrawer: null`, so the law was
  // never wrong — it was never TOLD.
  //
  // There is no public read of the store, so this is proven BEHAVIOURALLY, the
  // same way item83e.mjs proves it: if the announcement is silent, the exclusion
  // handoff finds nothing to displace and the drawer stands.
  // =========================================================================
  {
    await freshProsePage(app, 1366, 768);
    await enterMode(app, 'revise');

    // PATH 1 — the keyboard shortcut (Ctrl+/), which does NOT go through the grip's
    // onClick at all. It reaches `open` through a window listener.
    await app.evalJs("window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true }))");
    await sleep(400);
    const byKey = await app.evalJs(DRAWERS);
    ok('S6 (§7.6): a NON-TOGGLE open path works in Revise — the Ctrl+/ shortcut opens the Desk drawer without touching the grip handler',
      byKey.sliverOpen === 'true', JSON.stringify(byKey));

    await openFarLeft(app);
    await sleep(500);
    const displacedKey = await app.evalJs(DRAWERS);
    ok('S6 (§7.6): and THAT open ANNOUNCED — a far-left open displaces it, so the store learned about a drawer that opened by a path other than the toggle handler. The announce-from-effect invariant holds on Revise from birth',
      displacedKey.sliverOpen === 'false' && displacedKey.cascadeVisible === 'true',
      JSON.stringify({ byKey, displacedKey }));

    // PATH 2 — the grip itself. This is the affordance the tablet defect was felt
    // on, and the one the pre-repair build failed; it must announce too.
    await freshProsePage(app, 1366, 768);
    await enterMode(app, 'revise');
    await openSliverByGrip(app);
    const byGrip = await app.evalJs(DRAWERS);
    await openFarLeft(app);
    await sleep(500);
    const displacedGrip = await app.evalJs(DRAWERS);
    ok('S6 (§7.6): the GRIP path announces too — the affordance a writer actually taps, and the exact path the pre-errata build opened silently on. Every path announces because the announcement is an effect keyed on `open`, not a line inside one handler',
      byGrip.sliverOpen === 'true' && displacedGrip.sliverOpen === 'false',
      JSON.stringify({ byGrip, displacedGrip }));
  }

  // =========================================================================
  // S8 — EMPTINESS. No Type section, no Revise roster, no flags. §6's "no tenant
  // leakage," asserted as an absence at the DOM rather than trusted to a branch.
  // =========================================================================
  {
    await freshProsePage(app, 1366, 768);
    await enterMode(app, 'revise');
    await openSliverByGrip(app);
    await openTutorByGrip(app);
    await sleep(400);

    const empty = await app.evalJs(`(() => {
      const t = document.querySelector('.wz-tutor-panel');
      const txt = (t && t.innerText ? t.innerText : '').toLowerCase();
      return {
        // 112-C's Type section, and Draft's rail that Revise would have inherited
        // down the old else-branch:
        sliverSections: document.querySelectorAll('.wz-sliver-section').length,
        sliverFormat: document.querySelectorAll('.wz-sliver-format').length,
        structureBtn: document.querySelectorAll('[class*="structure"]').length,
        // 112-D's roster (and Free Write's), by their own rendered chips:
        askChips: document.querySelectorAll('.wz-tutor-ask, .wz-tutor-preset, .wz-tutor-chip').length,
        // the parked lens's marks, in any form:
        flags: document.querySelectorAll('[class*="flag"], [class*="squiggle"], .md-error, [data-flag]').length,
        tutorMounted: !!t,
        mentionsSelection: txt.includes('selected stretch'),
      };
    })()`);

    pok('PARKED (was, VERBATIM: "S8 (§7.8): NO TYPE SECTION and no inherited Draft rail render in Revise — the Desk drawer stands open and carries zero tool sections. 112-C fills it; this ticket ships the room") - SUPERSEDED by ITEM 207: the 112-C Type section is now filled; what stays true (no INHERITED Draft rail) is the successor below',
      true, 'superseded by item 207; successor keeps the no-Draft-rail half and asserts the one Type tenant');
    ok('S8 SUCCESSOR (item 207): the Revise drawer carries no INHERITED Draft rail (no .wz-sliver-format) and exactly ONE tool section, the Type control',
      empty.sliverFormat === 0 && empty.sliverSections === 1 && empty.structureBtn === 0,
      JSON.stringify(empty));
    ok("S8 (§7.8): NO ROSTER renders in Revise — neither the Draft asks nor Free Write's presets, and no Revise roster of its own. That is 112-D, and §6 forbids it appearing early",
      empty.askChips === 0 && empty.mentionsSelection === false,
      JSON.stringify(empty));
    ok('S8 (§7.8): NO FLAGS of any kind render — the error lens is parked (T1-T7) and DR7-as-narrowed authorises its marks and nothing else. This ticket ships no unbidden anything',
      empty.flags === 0, JSON.stringify(empty));
    ok('S8 CONTROL: the Counsel panel IS mounted and open — so the three absences above are Revise being EMPTY OF TENANTS, not the panel having failed to render at all',
      empty.tutorMounted === true, JSON.stringify(empty));
  }

  // =========================================================================
  // S9 — DRAFT AND FREE WRITE ARE UNCHANGED. The suite's other files are the real
  // proof (§7.9 says "their own harnesses stay green" and that is a SUITE claim,
  // not a claim this file can make alone). What IS this file's to prove is that
  // the two modes still enter, still carry their own furniture, and that Revise
  // took nothing from them.
  // =========================================================================
  {
    await freshProsePage(app, 1366, 768);

    await enterMode(app, 'draft');
    await openSliverByGrip(app);
    await sleep(300);
    const draft = await app.evalJs("(() => ({ sections: document.querySelectorAll('.wz-sliver-section').length, format: document.querySelectorAll('.wz-sliver-format').length, tab: document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.getAttribute('aria-selected') }))()");
    ok('S9 (§7.9): DRAFT still enters and still carries its OWN Desk furniture — its rail sections render exactly as before. Revise did not take Draft\'s drawer with it on the way past',
      draft.tab === 'true' && draft.sections > 0, JSON.stringify(draft));

    await enterMode(app, 'freewrite');
    await sleep(300);
    // The run model only renders once there is content — an EMPTY forward-only
    // surface deliberately has no children at all (so the browser can place a
    // caret). So this types first: otherwise a zero here would report 'the
    // instrument is gone' when it only means 'the page is blank'.
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
    await app.typeKeys('Forward only. ');
    await sleep(350);
    const fw = await app.evalJs("(() => ({ tab: document.querySelector('.desk-mode-tab[data-mode-key=\"freewrite\"]')?.getAttribute('aria-selected'), runs: document.querySelectorAll('.fo-run').length + document.querySelectorAll('.fo-word').length }))()");
    ok('S9 (§7.9): FREE WRITE still enters and still mounts the FORWARD-ONLY instrument — the run model renders on its own surface, which is the mirror of S2 and proves the instrument was moved out of Revise rather than deleted from the app',
      fw.tab === 'true' && fw.runs > 0, JSON.stringify(fw));

    // And the runway is still the runway THERE: a backspace in Free Write must
    // STRIKE, not erase. This is the exact inverse of S2's deletion check, and
    // together the pair proves the two instruments are on the right surfaces.
    const fwBefore = await app.evalJs("(document.querySelector('.forward-only-editor')?.innerText || '')");
    await app.key('Backspace');
    await sleep(300);
    const fwStruck = await app.evalJs("document.querySelectorAll('.fo-struck').length");
    const fwAfter = await app.evalJs("(document.querySelector('.forward-only-editor')?.innerText || '')");
    ok('S9: and Free Write\'s BACKSPACE STILL STRIKES rather than erases — the struck text stays visible on the surface. The forward-only law is untouched where it governs, which is what makes S2\'s absence in Revise a RELOCATION and not a deletion',
      fwStruck > 0 && fwAfter.length >= fwBefore.length - 1,
      JSON.stringify({ fwBefore, fwAfter, fwStruck }));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// ---------------------------------------------------------------------------
// PARKS — ONE, IN item84b.mjs, AND THIS FILE'S OWN FIRST COUNT WAS WRONG.
//
// THE CORRECTION, recorded rather than quietly amended. This block originally read
// "PARKS — NONE ... PARKED COUNT: 0", on the strength of a sweep that searched the
// suite for `deferred` / `aria-disabled` assertions naming Revise and found only
// Workshop and the script surface's Free Write key. That sweep was real and its
// reasoning was sound as far as it went — and it MISSED ONE, because the assertion
// it should have found is not phrased in that vocabulary at all:
//
//     item84b.mjs S1: "the Revise tab is inert — clicking it does not leave Draft,
//     so the roster cannot render in Revise because Revise has no live surface to
//     render on"
//
// It says "inert", never "deferred", so a grep aimed at the deferred vocabulary
// could not see it. THE SUITE CAUGHT IT — a red at item84b.mjs (1/60) on the first
// full run, which is exactly the arithmetic item 84 itself put into canon: a park
// sweep's own claim is a NUMBER TO BE AUDITED, not a silence to be trusted, and the
// audit here was done by the run rather than by the sweep. Left standing as the
// lesson: a vocabulary-shaped grep proves only that a vocabulary is absent.
//
// WHERE THE PARK LIVES. In item84b.mjs, the file that OWNS the assertion — not here.
// The original stands there verbatim under SUPERSEDED with a successor pointer, and
// its live successor is in that same file's S1 mode-boundary section, re-asserting
// the same conclusion (the Draft roster does not render in Revise) against the
// harder case: a Revise that is now genuinely live and must be DECLINED rather than
// merely unreachable. Two further checks were added there with it.
//
// The rest of the original sweep still holds, and was re-checked after the red:
//   - No harness asserted `EditorMode` had two members, or that ModeSwitcher rendered
//     exactly three tabs (its Revise tab is opt-in and QuickSprint does not opt in).
//   - fx18/item83e/tu1 assert on Draft and Free Write surfaces, which this ticket
//     leaves byte-identical; their fixtures never enter Revise.
//   - menus-probe.mjs is not in scripts/harness and is not run by run-suite.mjs.
//
// PARKED COUNT FOR THIS TICKET: 1 (in item84b.mjs). THIS FILE parks 0 of its own.
// ITEM 207 (2026-09-24) parks THREE here: S7's 'empty OF TENANTS' at 1100 and 1366, and S8's 'NO TYPE SECTION' - Revise's drawer
// now carries the Type control, exactly the tenant 112-A said 112-C would bring. Each keeps its text VERBATIM in its parked record.
// ---------------------------------------------------------------------------
if (process.env.HARNESS_PARKED === '1') {
  // ---- PARKED RECORD - SUPERSEDED by typed-literal (Oct 16): item112a-deterministic's record re-verified its successor's count, which
  // escaping falsifies (that successor is parked above). Kept VERBATIM and no longer run; successor record directly below.
  // // item112a-deterministic (Oct 16): S2/§3's literal `**bold**` placement, parked - the record re-verifies the claim on the default leg's text
  // { const o = i112aParks.s2s3 || {};
  //   pok('PARKED (was "S2/§3: and `entry.text` stays PLAIN — the convention characters are still real characters in the surface (count preserved 1:1 through decoration), which is the constraint that makes the caret restore valid and the CSS-only flag law the only lawful one", asserted as `includes(\'**bold**\')`) - timing-dependent placement of the closing pair (the 211 reabsorb vs a fast typist); live successor: S2/§3 [deterministic successor]',
  //     !!o.countOk, JSON.stringify(o)); }
  // ------------------------------------------------------------------
  { const b = tlParks.s23 || {}; pok('PARKED (was "S2/§3: and `entry.text` stays PLAIN — the convention characters are still real characters in the surface (count preserved 1:1 through decoration), which is the constraint that makes the caret restore valid and the CSS-only flag law the only lawful one", asserted as `includes(\'**bold**\')`) - timing-dependent placement of the closing pair (item112a-deterministic), and then typed-literal: typed stars are stored escaped; live successor: S2/§3 [typed-literal successor]',
      typeof b.plain === 'string' && b.plain === b.wantLit, JSON.stringify(b)); }
  // TYPED-LITERAL (2026-10-16) - TWO parks: S2/§3 S0's `.md-bold` from typed stars, and item112a-deterministic's S2/§3 successor (its
  // count of the typed stars). Records frozen; each re-verifies the new truth from the default leg's own readings (tlParks).
  { const a = tlParks.s0 || {}; pok('PARKED (was "S2/§3 S0: Revise\'s rendered text RUNS THROUGH `decorateEditorFor` — markdown decorates live (`.md-bold`/`.md-mark` present) ...") - typed-literal: typed stars are literal; live successor: S2/§3 S0 [typed-literal successor]',
      !!a.mdLit && a.mdLit.escapes === 4 && a.mdLit.bold === 0, JSON.stringify(a)); }
  { const b = tlParks.s23 || {}; pok('PARKED (was "S2/§3 [deterministic successor]: and `entry.text` stays PLAIN — every convention character typed is still a REAL character in the surface: the four `*` all present and the count preserved 1:1 (wherever the 211 rules\' reabsorb puts the closing pair)") - typed-literal: typed stars are stored escaped; live successor: S2/§3 [typed-literal successor]',
      typeof b.plain === 'string' && b.plain === b.wantLit, JSON.stringify(b)); }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nITEM112A PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; this FILE parks 21: S2/§3 S0 and S2/§3's deterministic successor (typed-literal), S2/§3's placement (item112a-deterministic), 3 since ITEM 207 (S7 at the two reference widths, S8 once), 1 since hide-workshop (S1 CONTROL: Workshop absent), 10 since page-size (Oct 23: the Oct 12 one-drawer successors S7 x2, S7 §8, S3 and S5, each at the two reference widths), and 4 since page-size's park audit (Oct 24: S4's 1100 pin, Revise-vs-Draft at the two reference widths, and the cross-width station) - and, before it, 0 of its own; the ticket's ONE original park is in item84b.mjs (the file that owns the assertion): "the Revise tab is inert", superseded by Revise standing up. See this file's park block for why the first sweep counted 0 and how the suite corrected it.`
    : `\nITEM112A PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM112A VERIFY: PASS (${checks.length} checks)` : `\nITEM112A VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
