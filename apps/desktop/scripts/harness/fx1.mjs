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
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()`;

const freshDesk = async (app) => {
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before fixture' });
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
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after script seed' });
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
  await app.evalJs("document.querySelector('.wz-start-writing').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed (loose)' });
  await sleep(500);
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Free Write').click()");
  await sleep(150);
};

// A journal-origin authored page, framed — for S4's drawer-pull/place-face-
// verb/Add-to-sheet border-radius asserts (mirrors ab3.mjs's journalPageHere).
const freshJournalPage = async (app, marker) => {
  await freshDesk(app);
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list' });
  await app.evalJs("document.querySelector('.journal-new-page').click()");
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
  ok('S1: a fresh prose page\'s first line starts within 40-55% of the stage height',
    startFrac >= 0.40 && startFrac <= 0.55, String(startFrac));

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
  ok('S1: a fresh script page\'s first line also starts within 40-55% of the stage height',
    scriptStartFrac >= 0.40 && scriptStartFrac <= 0.55, String(scriptStartFrac));

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
  await freshLoosePage(app);
  const looseRail = await app.evalJs(`({
    ink: !!document.querySelector('.desk-toolrail-inks'),
    forwardLock: !!document.querySelector('.desk-toolrail-forwardlock'),
    captureItems: [...document.querySelectorAll('.desk-toolrail-item')].map(i => i.textContent),
  })`);
  ok('S3: a LOOSE-origin page\'s Free Write rail shows the forward-lock control, with ink/capture items still absent',
    looseRail.forwardLock && !looseRail.ink && looseRail.captureItems.length === 0, JSON.stringify(looseRail));

  // R2 pattern — presence is not function: click actually flips dataset.on
  // AND writes the persisted setting.
  const lockBefore = await app.evalJs("document.querySelector('.desk-toolrail-forwardlock')?.dataset.on");
  await app.evalJs("document.querySelector('.desk-toolrail-forwardlock').click()");
  await sleep(100);
  const lockAfter = await app.evalJs("document.querySelector('.desk-toolrail-forwardlock')?.dataset.on");
  const lockStorage = await app.evalJs("localStorage.getItem('wrizo-forward-lock')");
  ok('S3: clicking the loose page\'s forward-lock control flips dataset.on AND writes wrizo-forward-lock',
    lockBefore === 'true' && lockAfter === 'false' && lockStorage === '0', `${lockBefore} -> ${lockAfter}, storage=${lockStorage}`);

  // Restore lock ON, then prove the MECHANIC (not just the control): typing
  // then backspacing strikes (.fo-struck appears) rather than truly erasing.
  await app.evalJs("document.querySelector('.desk-toolrail-forwardlock').click()");
  await sleep(100);
  const lockRestored = await app.evalJs("document.querySelector('.desk-toolrail-forwardlock')?.dataset.on");
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('ab');
  await app.key('Backspace');
  await sleep(150);
  const struckOnLoose = await app.evalJs("!!document.querySelector('.forward-only-editor .fo-struck')");
  ok('S3: with the lock ON, a loose page\'s backspace STRIKES (.fo-struck appears) — the mechanic, not just the control',
    lockRestored === 'true' && struckOnLoose, `lock=${lockRestored} struck=${struckOnLoose}`);

  // -- The project-origin fixture: control present, ink/capture still absent. -
  await freshProsePage(app);
  const projectRail = await app.evalJs(`({
    ink: !!document.querySelector('.desk-toolrail-inks'),
    forwardLock: !!document.querySelector('.desk-toolrail-forwardlock'),
    captureItems: [...document.querySelectorAll('.desk-toolrail-item')].map(i => i.textContent),
  })`);
  ok('S3: a PROJECT-origin page\'s Free Write rail ALSO shows the forward-lock control, with ink/capture items still absent',
    projectRail.forwardLock && !projectRail.ink && projectRail.captureItems.length === 0, JSON.stringify(projectRail));

  // Independent of typewriter — toggling typewriter off doesn't touch it.
  await app.evalJs("[...document.querySelectorAll('.typewriter-toggle')].find(Boolean)?.click()");
  await sleep(100);
  const lockStillPresent = await app.evalJs("!!document.querySelector('.desk-toolrail-forwardlock')");
  ok('S3: the forward lock stays mounted independent of the typewriter toggle (no coupling)', lockStillPresent);

  // ==========================================================================
  // S4 — square corners. Plateau's radius tokens are 0; the sweep holds on a
  // drawer pull, a place-face verb, and the Add-to sheet.
  // ==========================================================================
  await freshJournalPage(app, 'FX1RADIUS');
  await app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
  await sleep(220);
  const drawerPullRadius = await app.evalJs("getComputedStyle(document.querySelector('.wz-drawer-pull')).borderRadius");
  ok('S4: computed border-radius is 0px on a drawer pull', drawerPullRadius === '0px', drawerPullRadius);

  await app.evalJs("document.querySelector('.wz-drawer-pull-place[data-place=\"journal\"]').click()");
  await sleep(220);
  const placeVerbRadius = await app.evalJs(`(() => {
    const item = [...document.querySelectorAll('.wz-placeface-item')].find(el => el.textContent.includes('FX1RADIUS'));
    const btn = item ? item.querySelector('.wz-placeface-verb-open') : null;
    return btn ? getComputedStyle(btn).borderRadius : null;
  })()`);
  ok('S4: computed border-radius is 0px on a place-face verb', placeVerbRadius === '0px', String(placeVerbRadius));

  await app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-movecopy')", { label: 'Page face (S4 fixture)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-movecopy').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Add to… sheet' });
  const addToSheetRadius = await app.evalJs("getComputedStyle(document.querySelector('.board-sheet-inner')).borderRadius");
  ok('S4: computed border-radius is 0px on the Add-to sheet', addToSheetRadius === '0px', addToSheetRadius);

  // ==========================================================================
  // S5 — the dead bar dies: the meter track's host doesn't mount while empty
  // (the named non-goal corkboard track is untouched, still present).
  // ==========================================================================
  await freshProsePage(app);
  const s5 = await app.evalJs(`({
    meter: document.querySelectorAll('.desk-frame-meter').length,
    corkboard: !!document.querySelector('.desk-frame-corkboard'),
  })`);
  ok('S5: the empty meter-track bar is absent on a fresh framed page; the corkboard track (named non-goal) is untouched',
    s5.meter === 0 && s5.corkboard === true, JSON.stringify(s5));

  // ==========================================================================
  // S6 — the orange-at-rest sweep. Negative asserts while olive stays a
  // working value (A3's standing graduation, per ab2.1/ab3.1's own F3/R3).
  // ==========================================================================
  await freshScriptPage(app);
  const structureBtnBg = await app.evalJs("getComputedStyle(document.querySelector('.desk-toolrail-structure-btn.active')).backgroundColor");
  ok('S6: the active Structure button\'s computed background is not brass', structureBtnBg !== 'rgb(255, 152, 0)', structureBtnBg);

  const eyebrowColor = await app.evalJs("getComputedStyle(document.querySelector('.desk-toolrail-h')).color");
  ok('S6: an eyebrow label\'s computed color is not brass', eyebrowColor !== 'rgb(255, 152, 0)', eyebrowColor);

  const typewriterGlyphColor = await app.evalJs("getComputedStyle(document.querySelector('.typewriter-toggle')).color");
  ok('S6: the Typewriter glyph\'s computed color is not brass (typewriter defaults ON, so this is the common resting state)',
    typewriterGlyphColor !== 'rgb(255, 152, 0)', typewriterGlyphColor);

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// FX1 parks nothing of its OWN out of this file (every check above reflects
// this ticket's live, current design) — the checks FX1 itself supersedes
// belonged to AB2/AB3 and are parked in THEIR OWN files (ab2.mjs's and
// ab3.mjs's PARKED sections), per the established precedent. This scaffold
// exists so a future ticket that supersedes any of THIS file's checks has a
// documented home to move them into, matching ab1.mjs/ab2.mjs/ab3.mjs's own
// pattern. Nothing to run today.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nFX1 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of fx1.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX1 VERIFY: PASS (${checks.length} checks)` : `\nFX1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
