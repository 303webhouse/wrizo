// FX1 — the First Sitting (docs/wrizo-alpha/fx1-first-sitting-brief.md). A
// committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on ab3.mjs.
// Run: node apps/desktop/scripts/harness/fx1.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
//
// S3's own harness law (the forward lock becomes mode furniture) is NOT
// re-litigated here — it's proven by the park+reassert pairs already living
// in ab2.mjs's and ab3.mjs's own PARKED sections (the A4 convention: each
// file parks what supersedes ITS OWN checks). This file re-proves the same
// law fresh (S3's own minimum asserts below), plus everything else FX1
// shipped that has no earlier-ticket file to live in.
//
// FX3 (2026-07-17) — S3's own "40-55% start band" (prose AND script) is
// SUPERSEDED: Nick's desktop-sitting verdict lowered the working value from
// ~45% into a new 30-35% fence, genuinely outside this file's old asserted
// range. Both parked verbatim below; live successors are in fx3.mjs's own
// S3 section.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()`;

const freshDesk = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, 1400, 900);
};

// A fresh, framed, project-origin (book chapter) prose page in Free Write —
// mirrors ab2.mjs's freshProsePage / ab3.mjs's freshProjectPage. Reduced
// motion is emulated BEFORE the page mounts so useTypewriterFade.ts's own
// `reduce` read (at effect-mount) sees it — deterministic scroll positions,
// no native smooth-scroll animation to race against (S1's own DoD: "static"
// fade band/start offset apply either way; only the easing itself differs).
const freshProsePage = async (app) => {
  await freshDesk(app);
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(300);
};

// A fresh, framed script page — seeded directly (createEmptyScriptDoc's own
// shape, one scene heading so there's a live .script-el-active to type
// into), matching ab1.mjs's own script fixture technique.
const freshScriptPage = async (app) => {
  await freshDesk(app);
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const headingId = 'fx1-script-heading';
    entries.push({ id: 'fx1-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: 'INT. ROOM - DAY' }, body: [] }] }, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after script seed' });
  await app.evalJs("location.hash = '#/page/fx1-script'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Script framed' });
  await sleep(300);
};

// The Desk's start-writing / home-base door: a loose page, homing nowhere.
// Mirrors ab3.mjs's freshLoosePage — BUT that door's createLooseHomePage()
// stamps no pageType, so PageEditor's own default-mode rule ("a manuscript
// chapter opens in Free write... support pages open in Draft") lands it in
// DRAFT by default, not Free Write. S3's law is a Free-Write-rail law, so
// this fixture switches explicitly (a real writer would too, via the mode
// strip) before any rail content is read.
const freshLoosePage = async (app) => {
  await freshDesk(app);
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed (loose)' });
  await sleep(500);
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Free Write').click()");
  await sleep(150);
};

// A journal-origin authored page, framed — for S4's drawer-pull/place-face-
// verb/Add-to-sheet border-radius asserts (mirrors ab3.mjs's journalPageHere).
// CD1 S2/S7 — the sliver's panel is CLOSED by default (ToolRail's content
// was always-visible; the sliver's is reach-to-open). Every fixture below
// that reads the hand tools opens it first.
const openSliver = (app) => app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");

// B1 — the retired Journal list's own "New page" button (.journal-new-page)
// is gone (pages/Journal.tsx deleted, S5); this only ever used it as
// scaffolding to reach a fresh, editable journal-origin page —
// persistence.ts's own new test seam (window.wrizoCreateJournalPage)
// reaches the identical state directly.
const freshJournalPage = async (app, marker) => {
  await freshDesk(app);
  await app.evalJs("location.hash = '#/journal/' + window.wrizoCreateJournalPage().id");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'JournalEntry framed, authored' });
  await sleep(200);
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys(marker);
  await sleep(3000); // past JournalEntry's AUTOSAVE_MS (2000)
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the typewriter feel: no per-line pop, a fade band, a centered start.
  // ==========================================================================
  await freshProsePage(app);

  ok('S2 (fixture check): a fresh prose page has typewriter ON by default',
    await app.evalJs("document.querySelector('.mode-scroll')?.dataset.typewriter") === 'true');

  // -- Start position: the first line begins near the stage's vertical
  // center (working value ~45%; asserted band 40-55% per the brief). --------
  const startFrac = await app.evalJs(`(() => {
    const stage = document.querySelector('.desk-frame-stage').getBoundingClientRect();
    const ed = document.querySelector('.forward-only-editor').getBoundingClientRect();
    return (ed.top - stage.top) / stage.height;
  })()`);
  // FX3 S3 — "40-55%" retired here (parked below, SUPERSEDED): Nick's
  // desktop-sitting verdict on his own test page ("the first line started
  // too far down") lowered the working value from ~45% into a NEW 30-35%
  // fence, genuinely outside this old band by design. Live successor
  // (asserting the new 30-35% band, both prose and script) is in fx3.mjs's
  // own S3 section.
  void startFrac;

  // -- Type enough lines to cross the writing zone's lower bound and force
  // scrolling. Track the caret's own bottom edge (the SAME fallback
  // useTypewriterFade.ts itself reads when there's no live selection inside
  // the editor) and the scroll box's scrollTop after every line. -------------
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  const lineHeight = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.forward-only-editor')).lineHeight) || 28");
  const rows = [];
  for (let i = 0; i < 14; i++) {
    await app.typeKeys(`line ${i}\n`);
    await sleep(120);
    const m = await app.evalJs(`(() => {
      const scroll = document.querySelector('.mode-scroll');
      const ed = document.querySelector('.forward-only-editor');
      const last = ed.lastElementChild;
      const first = ed.firstElementChild;
      const scrollRect = scroll.getBoundingClientRect();
      const fadeBand = parseFloat(getComputedStyle(scroll).getPropertyValue('--tw-fade-band'));
      const firstRect = first ? first.getBoundingClientRect() : null;
      let firstOpacity = null;
      if (firstRect) {
        const relY = firstRect.top - scrollRect.top;
        firstOpacity = relY <= 0 ? 0.15 : relY >= fadeBand ? 1 : 0.15 + 0.85 * (relY / fadeBand);
      }
      return {
        caretBottom: last ? last.getBoundingClientRect().bottom : null,
        scrollTop: scroll.scrollTop,
        scrolled: scroll.dataset.scrolled === 'true',
        firstOpacity,
      };
    })()`);
    rows.push(m);
  }

  // No per-line pop: every consecutive caret-position delta stays within
  // 1.25x line-height — never a multi-line jump, whether the caret is still
  // descending (pre-scroll) or holding near the writing zone's bound.
  const caretDeltas = rows.slice(1).map((r, i) => Math.abs(r.caretBottom - rows[i].caretBottom));
  const noPop = caretDeltas.every(d => d <= lineHeight * 1.25 + 0.5);
  ok('S1: no per-line pop — every line-to-line caret delta is <= 1.25x line-height',
    noPop, JSON.stringify(caretDeltas));

  // No locked caret: the caret genuinely moves for the first several lines
  // (monotonically down), before the writing zone's lower bound engages.
  const earlyDeltas = rows.slice(1, 5).map((r, i) => r.caretBottom - rows[i].caretBottom);
  const descending = earlyDeltas.every(d => d >= -1);
  ok('S1: the caret is not locked — it moves down line by line before scrolling engages',
    descending, JSON.stringify(earlyDeltas));

  // Once scrolling engages, per-line scroll delta is <= 1.25x line-height.
  const scrollingRows = rows.filter(r => r.scrollTop > 0);
  const scrollDeltas = scrollingRows.slice(1).map((r, i) => r.scrollTop - scrollingRows[i].scrollTop);
  ok('S1: once scrolling engages, per-line scroll delta is <= 1.25x line-height (no multi-line jump)',
    scrollingRows.length >= 2 && scrollDeltas.every(d => d <= lineHeight * 1.25 + 0.5),
    JSON.stringify({ scrollDeltas, lineHeight }));

  // The fade is active: once scrolled, the first rendered line's effective
  // opacity (the SAME linear ramp the mask-image gradient encodes: 0.15 at
  // the box's top edge, 1.0 at --tw-fade-band) drops below 0.5 — not a hard
  // clip, a genuine fade, and never for a fresh/short page (C2).
  const lastRow = rows[rows.length - 1];
  ok('S1: the fade is active once scrolled — the first rendered line\'s effective (mask-ramp) opacity is < 0.5',
    lastRow.scrolled === true && lastRow.firstOpacity !== null && lastRow.firstOpacity < 0.5,
    JSON.stringify(lastRow));
  ok('S1 (C2): a fresh/short page never fades before it has actually scrolled',
    rows[0].scrolled === false && rows[0].firstOpacity === 1, JSON.stringify(rows[0]));

  // -- Same fixture, once on a script page. ----------------------------------
  await freshScriptPage(app);
  ok('S2 (fixture check): a fresh script page has typewriter ON by default',
    await app.evalJs("document.querySelector('.desk-frame-scroll-cap')?.dataset.typewriter") === 'true');

  const scriptStartFrac = await app.evalJs(`(() => {
    const stage = document.querySelector('.desk-frame-stage').getBoundingClientRect();
    const sheet = document.querySelector('.script-sheet').getBoundingClientRect();
    return (sheet.top - stage.top) / stage.height;
  })()`);
  // FX3 S3 — same retirement as the prose check above (SUPERSEDED, parked
  // below); live successor in fx3.mjs's own S3 section.
  void scriptStartFrac;

  await app.evalJs("document.querySelector('.script-el-active').focus()");
  const scriptLineHeight = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.script-el-active')).lineHeight) || 28");
  const scriptRows = [];
  for (let i = 0; i < 8; i++) {
    await app.typeKeys(`Some action here ${i}.`);
    await app.key('Enter');
    await sleep(150);
    const m = await app.evalJs(`(() => {
      const scroll = document.querySelector('.desk-frame-scroll-cap');
      const sheet = document.querySelector('.script-sheet');
      const last = sheet.lastElementChild;
      return { caretBottom: last ? last.getBoundingClientRect().bottom : null, scrollTop: scroll.scrollTop, scrolled: scroll.dataset.scrolled === 'true' };
    })()`);
    scriptRows.push(m);
  }
  const scriptScrollingRows = scriptRows.filter(r => r.scrollTop > 0);
  const scriptScrollDeltas = scriptScrollingRows.slice(1).map((r, i) => r.scrollTop - scriptScrollingRows[i].scrollTop);
  ok('S1: the script surface shares the SAME no-pop engine — per-line scroll delta <= 1.25x line-height there too',
    scriptScrollDeltas.every(d => d <= scriptLineHeight * 1.25 + 0.5), JSON.stringify({ scriptScrollDeltas, scriptLineHeight }));

  // ==========================================================================
  // S2 — the screenplay paper obeys Law 1 (same geometry class/width band as
  // prose; Courier alignment; typewriter defaults on for both surfaces).
  // ==========================================================================
  // Re-derive prose's own .mode-pagecol width fresh (the script fixture above
  // navigated away from it) so both sides of the comparison are live reads.
  await freshProsePage(app);
  const proseGeomRect = await app.evalJs(rectOf('.mode-pagecol'));
  await freshScriptPage(app);
  const scriptGeomRect = await app.evalJs(rectOf('.mode-pagecol'));
  ok('S2 (Law 1): the script page mounts .mode-pagecol — the SAME paper geometry class the harness already asserts for prose',
    !!scriptGeomRect, JSON.stringify(scriptGeomRect));
  ok('S2: the script paper\'s rect matches the prose paper\'s asserted width band [600,800], within 2px of the prose value',
    scriptGeomRect.width >= 600 && scriptGeomRect.width <= 800 && Math.abs(scriptGeomRect.width - proseGeomRect.width) <= 2,
    JSON.stringify({ proseGeomRect, scriptGeomRect }));

  const sceneAlign = await app.evalJs("(() => { const el = document.querySelector('.script-el[data-type=\"scene\"]'); return el ? getComputedStyle(el).textAlign : null; })()");
  ok('S2: a scene heading\'s computed text-align is left (Courier convention, S-arc margin rules)', sceneAlign === 'left', String(sceneAlign));

  // ==========================================================================
  // S3 — the forward lock as mode furniture (Free Write rail, every origin).
  // The park+reassert pairs live in ab2.mjs/ab3.mjs's own PARKED sections
  // (A4); this re-proves the same live law fresh, plus the actual MECHANIC.
  // ==========================================================================
  // CD1 S2/S7 — ToolRail retired whole; `.wz-sliver-*` hosts this content
  // now (the sliver mounts closed — open it first). Every named check in
  // this S3 block is parked below (SUPERSEDED, class rename only, same
  // truth) with a live successor right here.
  await freshLoosePage(app);
  await openSliver(app);
  await sleep(150);
  const looseRail = await app.evalJs(`({
    ink: !!document.querySelector('.wz-sliver-inks'),
    forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
    captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
  })`);
  ok('CD1 S2 (was "S3: a LOOSE-origin page\'s Free Write rail shows the forward-lock control..."): a LOOSE-origin page\'s Free Write sliver shows the forward-lock control, with ink/capture items still absent',
    looseRail.forwardLock && !looseRail.ink && looseRail.captureItems.length === 0, JSON.stringify(looseRail));

  // R2 pattern — presence is not function: click actually flips dataset.on
  // AND writes the persisted setting.
  const lockBefore = await app.evalJs("document.querySelector('.wz-sliver-forwardlock')?.dataset.on");
  await app.evalJs("document.querySelector('.wz-sliver-forwardlock').click()");
  await sleep(100);
  const lockAfter = await app.evalJs("document.querySelector('.wz-sliver-forwardlock')?.dataset.on");
  const lockStorage = await app.evalJs("localStorage.getItem('wrizo-forward-lock')");
  ok('CD1 S2 (was "S3: clicking the loose page\'s forward-lock control..."): clicking the loose page\'s forward-lock control (in the sliver) flips dataset.on AND writes wrizo-forward-lock',
    lockBefore === 'true' && lockAfter === 'false' && lockStorage === '0', `${lockBefore} -> ${lockAfter}, storage=${lockStorage}`);

  // Restore lock ON, then prove the MECHANIC (not just the control): typing
  // then backspacing strikes (.fo-struck appears) rather than truly erasing.
  await app.evalJs("document.querySelector('.wz-sliver-forwardlock').click()");
  await sleep(100);
  const lockRestored = await app.evalJs("document.querySelector('.wz-sliver-forwardlock')?.dataset.on");
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('ab');
  await app.key('Backspace');
  await sleep(150);
  const struckOnLoose = await app.evalJs("!!document.querySelector('.forward-only-editor .fo-struck')");
  ok('S3: with the lock ON, a loose page\'s backspace STRIKES (.fo-struck appears) — the mechanic, not just the control',
    lockRestored === 'true' && struckOnLoose, `lock=${lockRestored} struck=${struckOnLoose}`);

  // -- The project-origin fixture: control present, ink/capture still absent. -
  await freshProsePage(app);
  await openSliver(app);
  await sleep(150);
  const projectRail = await app.evalJs(`({
    ink: !!document.querySelector('.wz-sliver-inks'),
    forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
    captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
  })`);
  ok('CD1 S2 (was "S3: a PROJECT-origin page\'s Free Write rail ALSO shows..."): a PROJECT-origin page\'s Free Write sliver ALSO shows the forward-lock control, with ink/capture items still absent',
    projectRail.forwardLock && !projectRail.ink && projectRail.captureItems.length === 0, JSON.stringify(projectRail));

  // Independent of typewriter — toggling typewriter off doesn't touch it.
  await app.evalJs("[...document.querySelectorAll('.typewriter-toggle')].find(Boolean)?.click()");
  await sleep(100);
  const lockStillPresent = await app.evalJs("!!document.querySelector('.wz-sliver-forwardlock')");
  ok('CD1 S2 (was "S3: the forward lock stays mounted independent of the typewriter toggle..."): the forward lock (sliver) stays mounted independent of the typewriter toggle (no coupling)', lockStillPresent);

  // ==========================================================================
  // S4 — square corners. Plateau's radius tokens are 0; the sweep holds on
  // the cascade's strip item, a category panel's action button, and the
  // Add-to sheet. CD2 S1/S5 (2026-07-17) — the drawer/place-face doorways
  // this section originally used are gone (Drawer.tsx retired whole); the
  // ORIGINAL "drawer pull"/"place-face verb" checks are PARKED below
  // (SUPERSEDED — no "same claim, renamed selector" fix exists, since
  // PlaceFace's own per-item-verb design retired too, not just its class
  // names), re-asserted here against the cascade's own equivalents. The
  // Add-to sheet check is adapted in place (same sheet, new doorway).
  // ==========================================================================
  await freshJournalPage(app, 'FX1RADIUS');
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][0].click()"); // Journal
  await sleep(220);
  const stripItemRadius = await app.evalJs("getComputedStyle(document.querySelector('.wz-strip-item')).borderRadius");
  ok('S4 (successor to "...border-radius is 0px on a drawer pull"): computed border-radius is 0px on a strip item', stripItemRadius === '0px', stripItemRadius);

  const cascadeActionRadius = await app.evalJs("getComputedStyle(document.querySelector('.wz-cascade-action')).borderRadius");
  ok('S4 (successor to "...border-radius is 0px on a place-face verb"): computed border-radius is 0px on a category panel\'s action button',
    cascadeActionRadius === '0px', cascadeActionRadius);

  // B2 S4 — plain doorway swap (fx2.mjs's own "same claim, renamed/moved
  // doorway, no park" precedent, cited verbatim by ab3.mjs's own header
  // comment): Move/Copy retires (superseded by Places), so this now
  // reaches the SAME `.board-sheet-inner` class via Pin instead — the
  // geometry claim itself (square corners on a board sheet) is completely
  // unchanged, only unaffected by which sheet reaches it.
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()"); // Page
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (S4 fixture)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Pin sheet' });
  const addToSheetRadius = await app.evalJs("getComputedStyle(document.querySelector('.board-sheet-inner')).borderRadius");
  ok('S4: computed border-radius is 0px on a board sheet (Pin to a Board…)', addToSheetRadius === '0px', addToSheetRadius);

  // ==========================================================================
  // S5 — the dead bar dies: the meter track's host doesn't mount while
  // empty. CD1 S5 — the corkboard track is no longer a named non-goal; it
  // adopts the SAME "render only with content" law meter already has, so
  // it is ALSO absent while empty now (not "untouched, still present" —
  // the ORIGINAL check is parked below, SUPERSEDED).
  // ==========================================================================
  await freshProsePage(app);
  const s5 = await app.evalJs(`({
    meter: document.querySelectorAll('.desk-frame-meter').length,
    corkboard: !!document.querySelector('.desk-frame-corkboard'),
  })`);
  ok('CD1 S5 (was "S5: ...the corkboard track (named non-goal) is untouched, still present"): the empty meter-track bar is absent on a fresh framed page; the corkboard track is ALSO absent now (no longer a named non-goal)',
    s5.meter === 0 && s5.corkboard === false, JSON.stringify(s5));

  // ==========================================================================
  // S6 — the orange-at-rest sweep. Negative asserts while olive stays a
  // working value (A3's standing graduation, per ab2.1/ab3.1's own F3/R3).
  // ==========================================================================
  await freshScriptPage(app);
  await openSliver(app);
  await sleep(150);
  const structureBtnBg = await app.evalJs("getComputedStyle(document.querySelector('.wz-sliver-structure-btn.active')).backgroundColor");
  ok('CD1 S2 (was "S6: the active Structure button\'s computed background is not brass"): the active Structure button (in the sliver) is not brass', structureBtnBg !== 'rgb(255, 152, 0)', structureBtnBg);

  const eyebrowColor = await app.evalJs("getComputedStyle(document.querySelector('.wz-sliver-h')).color");
  ok('CD1 S2 (was "S6: an eyebrow label\'s computed color is not brass"): an eyebrow label (in the sliver) is not brass', eyebrowColor !== 'rgb(255, 152, 0)', eyebrowColor);

  const typewriterGlyphColor = await app.evalJs("getComputedStyle(document.querySelector('.typewriter-toggle')).color");
  ok('S6: the Typewriter glyph\'s computed color is not brass (typewriter defaults ON, so this is the common resting state)',
    typewriterGlyphColor !== 'rgb(255, 152, 0)', typewriterGlyphColor);

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// FX1's own scaffold sat empty until now — CD1 is its first real tenant:
// ToolRail.tsx retires whole (S7), its `.desk-toolrail-*` class family
// moving to the sliver (`.wz-sliver-*`, S2). Six checks this ticket's
// design supersedes, moved here rather than deleted (parked != deleted).
// All SUPERSEDED species (quoted verbatim from their ORIGINAL FX1 form,
// then re-asserted against the same truth through the new class family);
// none are DORMANT. Live successors are in this file's own S3/S6 sections.
//
// CD2 (2026-07-17) — two more entries at the foot of this block: the left
// drawer retires whole, falsifying S4's own "drawer pull"/"place-face verb"
// square-corner checks (no "same claim, renamed selector" fix exists for
// the place-face one — PlaceFace's own per-item-verb design retired, not
// just its class names). Live successors re-asserted fresh in this file's
// own live S4 section, against the cascade's own equivalents.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    await freshLoosePage(app);
    await openSliver(app);
    await sleep(150);

    // ORIGINAL (S3): ok('S3: a LOOSE-origin page\'s Free Write rail shows
    // the forward-lock control, with ink/capture items still absent',
    // looseRail.forwardLock && !looseRail.ink && looseRail.captureItems.
    // length === 0, ...); — read `.desk-toolrail-inks` / `.desk-toolrail-
    // forwardlock` / `.desk-toolrail-item`.
    // CD1 S2/S7 — `.wz-sliver-*` now (ToolRail's class family retired with
    // the component). Same truth.
    const looseRailParked = await app.evalJs(`({
      ink: !!document.querySelector('.wz-sliver-inks'),
      forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
      captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
    })`);
    pok('PARKED (was "S3: a LOOSE-origin page\'s Free Write rail shows the forward-lock control, with ink/capture items still absent") — CD1 S2/S7: same truth, .wz-sliver-* selectors',
      looseRailParked.forwardLock && !looseRailParked.ink && looseRailParked.captureItems.length === 0,
      JSON.stringify(looseRailParked));

    // ORIGINAL (S3): ok('S3: clicking the loose page\'s forward-lock
    // control flips dataset.on AND writes wrizo-forward-lock',
    // lockBefore === 'true' && lockAfter === 'false' && lockStorage ===
    // '0', ...); — read `.desk-toolrail-forwardlock`.
    // CD1 S2/S7 — `.wz-sliver-forwardlock` now.
    const lockBeforeParked = await app.evalJs("document.querySelector('.wz-sliver-forwardlock')?.dataset.on");
    await app.evalJs("document.querySelector('.wz-sliver-forwardlock').click()");
    await sleep(100);
    const lockAfterParked = await app.evalJs("document.querySelector('.wz-sliver-forwardlock')?.dataset.on");
    const lockStorageParked = await app.evalJs("localStorage.getItem('wrizo-forward-lock')");
    pok('PARKED (was "S3: clicking the loose page\'s forward-lock control flips dataset.on AND writes wrizo-forward-lock") — CD1 S2/S7: same truth, .wz-sliver-forwardlock',
      lockBeforeParked === 'true' && lockAfterParked === 'false' && lockStorageParked === '0',
      `${lockBeforeParked} -> ${lockAfterParked}, storage=${lockStorageParked}`);

    // -- Project-origin fixture. ------------------------------------------
    await freshProsePage(app);
    await openSliver(app);
    await sleep(150);

    // ORIGINAL (S3): ok('S3: a PROJECT-origin page\'s Free Write rail ALSO
    // shows the forward-lock control, with ink/capture items still
    // absent', projectRail.forwardLock && !projectRail.ink &&
    // projectRail.captureItems.length === 0, ...);
    // CD1 S2/S7 — `.wz-sliver-*` now.
    const projectRailParked = await app.evalJs(`({
      ink: !!document.querySelector('.wz-sliver-inks'),
      forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
      captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
    })`);
    pok('PARKED (was "S3: a PROJECT-origin page\'s Free Write rail ALSO shows the forward-lock control, with ink/capture items still absent") — CD1 S2/S7: same truth, .wz-sliver-* selectors',
      projectRailParked.forwardLock && !projectRailParked.ink && projectRailParked.captureItems.length === 0,
      JSON.stringify(projectRailParked));

    // ORIGINAL (S3): ok('S3: the forward lock stays mounted independent of
    // the typewriter toggle (no coupling)', lockStillPresent); — read
    // `.desk-toolrail-forwardlock`.
    // CD1 S2/S7 — `.wz-sliver-forwardlock` now.
    await app.evalJs("[...document.querySelectorAll('.typewriter-toggle')].find(Boolean)?.click()");
    await sleep(100);
    const lockStillPresentParked = await app.evalJs("!!document.querySelector('.wz-sliver-forwardlock')");
    pok('PARKED (was "S3: the forward lock stays mounted independent of the typewriter toggle (no coupling)") — CD1 S2/S7: same truth, .wz-sliver-forwardlock',
      lockStillPresentParked === true, String(lockStillPresentParked));

    // -- S6 orange-at-rest sweep, on the script surface. -------------------
    await freshScriptPage(app);
    await openSliver(app);
    await sleep(150);

    // ORIGINAL (S6): ok('S6: the active Structure button\'s computed
    // background is not brass', structureBtnBg !== 'rgb(255, 152, 0)',
    // structureBtnBg); — read `.desk-toolrail-structure-btn.active`.
    // CD1 S2/S7 — `.wz-sliver-structure-btn.active` now.
    const structureBtnBgParked = await app.evalJs("getComputedStyle(document.querySelector('.wz-sliver-structure-btn.active')).backgroundColor");
    pok('PARKED (was "S6: the active Structure button\'s computed background is not brass") — CD1 S2/S7: same truth, .wz-sliver-structure-btn.active',
      structureBtnBgParked !== 'rgb(255, 152, 0)', structureBtnBgParked);

    // ORIGINAL (S6): ok('S6: an eyebrow label\'s computed color is not
    // brass', eyebrowColor !== 'rgb(255, 152, 0)', eyebrowColor); — read
    // `.desk-toolrail-h`.
    // CD1 S2/S7 — `.wz-sliver-h` now.
    const eyebrowColorParked = await app.evalJs("getComputedStyle(document.querySelector('.wz-sliver-h')).color");
    pok('PARKED (was "S6: an eyebrow label\'s computed color is not brass") — CD1 S2/S7: same truth, .wz-sliver-h',
      eyebrowColorParked !== 'rgb(255, 152, 0)', eyebrowColorParked);

    // -- S5, the corkboard's own supersession. -----------------------------
    await freshProsePage(app);

    // ORIGINAL (S5): ok('S5: the empty meter-track bar is absent on a fresh
    // framed page; the corkboard track (named non-goal) is untouched',
    // s5.meter === 0 && s5.corkboard === true, JSON.stringify(s5));
    // CD1 S5 — the corkboard track is no longer a named non-goal; it
    // renders only with content, same as meter, so it is ABSENT while
    // empty too (every CD1 caller passes none).
    const s5Parked = await app.evalJs(`({
      meter: document.querySelectorAll('.desk-frame-meter').length,
      corkboard: !!document.querySelector('.desk-frame-corkboard'),
    })`);
    pok('PARKED (was "S5: ...the corkboard track (named non-goal) is untouched, still present") — CD1 S5: the corkboard track is ABSENT while empty too, not untouched',
      s5Parked.meter === 0 && s5Parked.corkboard === false, JSON.stringify(s5Parked));

    // ORIGINAL (S1): ok('S1: a fresh prose page\'s first line starts within
    // 40-55% of the stage height', startFrac >= 0.40 && startFrac <= 0.55,
    // String(startFrac));
    // FX3 S3 — Nick's desktop-sitting verdict lowers the working value from
    // ~45% into a NEW 30-35% fence (genuinely outside the old 40-55% band,
    // by design). Live successor in fx3.mjs's own S3 section.
    await freshProsePage(app);
    const startFracParked = await app.evalJs(`(() => {
      const stage = document.querySelector('.desk-frame-stage').getBoundingClientRect();
      const ed = document.querySelector('.forward-only-editor').getBoundingClientRect();
      return (ed.top - stage.top) / stage.height;
    })()`);
    pok('PARKED (was "S1: a fresh prose page\'s first line starts within 40-55% of the stage height") — FX3 S3: the working value moved to a NEW 30-35% band',
      startFracParked >= 0.28 && startFracParked <= 0.37, String(startFracParked));

    // ORIGINAL (S1): ok('S1: a fresh script page\'s first line also starts
    // within 40-55% of the stage height', scriptStartFrac >= 0.40 &&
    // scriptStartFrac <= 0.55, String(scriptStartFrac));
    // FX3 S3 — same retirement, script surface (S7 mirrors prose). [this
    // generation itself now DOUBLY superseded — see immediately below]
    // FX4 S1 — a SECOND generation: START_FRACTION retunes again (0.29 ->
    // 0.25), moving script's own fx1-way visual fraction (script carries no
    // extra chrome padding beyond the raw offset, unlike prose's .mode-page)
    // to ~24.97%, below even FX3's own 30-35% band. Per the standing
    // "double supersession" precedent (FX1's own post-merge review, Ruling
    // 3 — an already-parked check going stale again still must pass under
    // HARNESS_PARKED=1, generations accrete, all preserved): this
    // generation's own value is quoted verbatim below rather than edited in
    // place. Live successor in fx4.mjs's own S1 section.
    await freshScriptPage(app);
    const scriptStartFracParkedGen2 = await app.evalJs(`(() => {
      const stage = document.querySelector('.desk-frame-stage').getBoundingClientRect();
      const sheet = document.querySelector('.script-sheet').getBoundingClientRect();
      return (sheet.top - stage.top) / stage.height;
    })()`);
    pok('PARKED, generation 2 (was PARKED-generation-1 "S1: a fresh script page\'s first line also starts within 40-55% of the stage height", itself already superseding the true original "40-55%" claim) — FX4 S1: START_FRACTION retunes to 0.25, moving script\'s own value to ~24.97%; live successor in fx4.mjs\'s own S1 section',
      scriptStartFracParkedGen2 >= 0.20 && scriptStartFracParkedGen2 <= 0.30, String(scriptStartFracParkedGen2));

    // ORIGINAL (this file's own live S4 section, pre-CD2): await
    // app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
    // ... ok('S4: computed border-radius is 0px on a drawer pull',
    // drawerPullRadius === '0px', drawerPullRadius);
    // CD2 S1/S5 — .wz-drawer-pull is gone; the strip's own item is the new
    // square-corner surface. Live successor re-asserted fresh in this
    // file's own live S4 section above (.wz-strip-item).
    await freshJournalPage(app, 'FX1PARKEDRADIUS');
    const drawerPullGoneNow = await app.evalJs("!document.querySelector('.wz-drawer-pull')");
    pok('PARKED (was "S4: computed border-radius is 0px on a drawer pull") — CD2 S1/S5: .wz-drawer-pull is gone entirely; the strip\'s own item carries the square-corner law now (successor live in this file\'s own S4 section)',
      drawerPullGoneNow === true, String(drawerPullGoneNow));

    // ORIGINAL (this file's own live S4 section, pre-CD2): await
    // app.evalJs("document.querySelector('.wz-drawer-pull-place[data-
    // place=\"journal\"]').click()"); ... ok('S4: computed border-radius
    // is 0px on a place-face verb', placeVerbRadius === '0px', ...);
    // CD2 S1/S5 — PlaceFace.tsx retires whole (its own per-item-verb
    // design, not just its class names); no "place-face verb" concept
    // survives to re-derive a radius from. Live successor (a category
    // panel's own action button) re-asserted fresh in this file's own live
    // S4 section above (.wz-cascade-action).
    const placeFaceGoneNow = await app.evalJs("!document.querySelector('.wz-placeface-item') && !document.querySelector('.wz-placeface-verb-open')");
    pok('PARKED (was "S4: computed border-radius is 0px on a place-face verb") — CD2 S1/S5: PlaceFace\'s own per-item-verb design is gone entirely (not just renamed); a category panel\'s action button carries the square-corner law now (successor live in this file\'s own S4 section)',
      placeFaceGoneNow === true, String(placeFaceGoneNow));

    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX1 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nFX1 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecksFx1 = checks.concat(parkedChecks);
const pass = allChecksFx1.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX1 VERIFY: PASS (${allChecksFx1.length} checks)` : `\nFX1 VERIFY: FAIL — ${allChecksFx1.filter((c) => !c.pass).length}/${allChecksFx1.length} failed`);
process.exit(pass ? 0 : 1);
