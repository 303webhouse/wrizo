// ITEM 171-A — TYPEWRITER SCOPE: Free Write, text-only, and only while the
// page has no ink.
//
// Nick, verbatim: "Typewriter mode should only be available on "Text" pages
// with no ink. Once Ink is selected, Typewriter mode should be deactivated, and
// once any ink has been added to a Page, typewriter mode cannot be
// reactivated. Also, typewriter mode should not be available in either Draft or
// Revise mode."
//
// THE RULE IS DERIVED, NEVER STORED. `typewriter` is ONE GLOBAL setting
// (store/writingSettings.ts, localStorage['wrizo-writing-settings']), so this
// file's most load-bearing checks are the ones asserting THE STORED VALUE IS
// STILL WHAT THE WRITER CHOSE while the page it is on cannot run it. A build
// that "turned the typewriter off" by writing that setting would pass a naive
// DOM check and quietly reach into every other page the writer owns.
//
// "CANNOT BE REACTIVATED" IS STATEFUL, ruled: it derives from
// `strokes.length > 0`. So UNDOING the only stroke gives a page its typewriter
// back, and ERASING DOES NOT — an eraser is itself a stroke. Both are asserted
// here, because the second is the one a writer would not predict.
//
// EVERY GESTURE GOES THROUGH A PROBE, and the option's TWO affordances are read
// together every time: the sliver foot's icon and the "Typewriter" row one
// click deeper behind that foot's gear. SC1 S3's law is that hiding one and
// leaving the other is the lie.
//
//   T1  Free Write / TEXT, no ink: the typewriter runs and is offered
//   T2  selecting INK deactivates it — and LEAVES THE STORED SETTING ALONE
//   T3  back to TEXT while still inkless: it returns (the rule is about ink)
//   T4  a stroke: gone, and it stays gone in TEXT — "cannot be reactivated"
//   T5  the eraser clause: erasing does NOT bring it back (an eraser is ink)
//   T6  the undo clause: undoing the only stroke DOES (stateful, as ruled)
//   T7  AMENDED: Draft HAS the typewriter, default OFF and offered; Revise has
//       neither. At two widths.
//   T8  a Board offers no typewriter option (found, not briefed)
//   T9  the writer's global preference survived all of it
//   T10 the words stay put when the typewriter goes off under the writer —
//       and the one case where they cannot, MEASURED rather than asserted
//   T11 the two values do not leak into each other (Draft's own, Free Write's
//       shared) — the whole reason the amendment needs a second stored value
//   T12 the page's text-start furniture leaves when INK is selected
//   T13 the BARE MENU: Draft's tools empty while its typewriter is on
//
// WHAT THIS FILE DOES NOT COVER: the script surface, whose own assertions live
// in ab2.mjs, fx3.mjs and sc1.mjs (parked and succeeded there, where they are);
// and item157.mjs's M10, which this ticket must park once item 157 is merged —
// it is unreachable under this rule, because selecting Ink turns the typewriter
// off before a first stroke can exist.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const W1 = 1366, H1 = 768;
const W2 = 1680, H2 = 1050;
const EDITOR = '.forward-only-editor';
const SHEET = '.wz-ink-sheet';
const SCROLL = '.mode-scroll';

const present = (app, sel) => app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`);
const where = (app) => app.evalJs(`({ hash: location.hash,
  editor: !!document.querySelector('${EDITOR}'), sheet: !!document.querySelector('${SHEET}'),
  framed: !!document.querySelector('.desk-frame'),
  mode: (document.querySelector('.desk-mode-tab.active') || {}).textContent,
  ink: (document.querySelector('.mode-page') || { getAttribute: () => null }).getAttribute('data-ink') })`);

const freshDesk = async (app, width = W1, height = H1) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// Through persistence.ts's own seam — the same call the real Catch door makes.
const freshPage = async (app, width = W1, height = H1) => {
  await freshDesk(app, width, height);
  const id = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(id)}`);
  await app.waitFor(`!!document.querySelector('${EDITOR}')`, { label: 'page mounted' });
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'DeskFrame mounted' });
  await sleep(300);
  return id;
};

// A page opens in DRAFT; modes are entered through the writer's own door, and
// the re-persist after a switch lands ~1100ms later.
const toMode = async (app, key) => {
  const sel = `.desk-mode-tab[data-mode-key="${key}"]`;
  if (!(await present(app, sel))) { ok(`DRIVER: mode tab ${key} ABSENT`, false, JSON.stringify(await where(app))); return false; }
  await app.evalJs(`document.querySelector('${sel}').click()`);
  await sleep(1300);
  return true;
};

const setInstrument = async (app, which) => {
  const sel = '.wz-ink-switch .wz-ink-switch-side';
  if (!(await present(app, sel))) { ok(`DRIVER: ink switch ABSENT for '${which}'`, false, JSON.stringify(await where(app))); return false; }
  await app.evalJs(`(() => {
    const b = [...document.querySelectorAll('${sel}')]
      .find(x => x.textContent.trim().toLowerCase() === ${JSON.stringify(which)});
    if (b) b.click(); })()`);
  await sleep(400);
  return true;
};

// The page's own answer: is the typewriter RUNNING here?
const twDom = (app) => app.evalJs(`(() => { const el = document.querySelector('${SCROLL}');
  return el ? el.getAttribute('data-typewriter') : null; })()`);
// The WRITER'S STORED PREFERENCE — the thing this rule must never rewrite.
const twStored = (app) => app.evalJs(
  `(() => { try { const s = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}');
    return s.typewriter === undefined ? 'absent(default true)' : s.typewriter; } catch { return 'unreadable'; } })()`);

// IS THE OPTION OFFERED? Both affordances, always together (SC1 S3). The gear
// is opened to read the second one, then closed again so the next leg starts
// from the same posture.
const twOffered = async (app) => {
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(260);
  const icon = await app.evalJs(`(() => { const row = document.querySelector('.wz-sliver-instruments-row');
    const btns = row ? [...row.querySelectorAll('button')] : [];
    return { icon: btns.some(b => (b.getAttribute('aria-label') || '').startsWith('Typewriter')), iconCount: btns.length, row: !!row }; })()`);
  await app.evalJs(`(() => { const row = document.querySelector('.wz-sliver-instruments-row');
    const gear = row ? [...row.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '') === 'Writing settings') : null;
    if (gear) gear.click(); })()`);
  await sleep(220);
  const seg = await app.evalJs(`(() => {
    const panel = document.querySelector('.wz-sliver-instruments .mode-settings') || document.querySelector('.mode-settings');
    if (!panel) return { panelOpen: false, seg: null };
    const w = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    let seg = false;
    while (w.nextNode()) { if ((w.currentNode.nodeValue || '').includes('Typewriter')) seg = true; }
    return { panelOpen: true, seg }; })()`);
  await app.evalJs(`(() => { const row = document.querySelector('.wz-sliver-instruments-row');
    const gear = row ? [...row.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '') === 'Writing settings') : null;
    if (gear) gear.click(); })()`);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(200);
  return { ...icon, ...seg, offered: icon.icon === true || seg.seg === true };
};

const strokesOf = (app, id) => app.evalJs(
  `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = l.find(x => x.id === ${JSON.stringify(id)}); return (e && e.strokes) || []; })()`);

// Storage is written on a debounce: poll, never read once and believe it.
const settle = async (app, id, want, ms = 4000) => {
  for (let t = 0; t < ms; t += 100) {
    if ((await strokesOf(app, id)).length >= want) break;
    await sleep(100);
  }
  await sleep(150);
  return strokesOf(app, id);
};

const arc = (y = 0.30) => Array.from({ length: 12 }, (_, i) => {
  const t = i / 11;
  return { x: 0.25 + 0.45 * t, y: y + 0.05 * Math.sin(Math.PI * t) };
});

const safePen = async (app, points, label) => {
  if (!(await present(app, SHEET))) {
    ok(`DRIVER: ${label} — the sheet is ABSENT, no stroke dispatched`, false, JSON.stringify(await where(app)));
    return false;
  }
  await app.penStroke(SHEET, points);
  await sleep(600);
  return true;
};

const editorTop = (app) => app.evalJs(`(() => { const e = document.querySelector('${EDITOR}');
  return e ? e.getBoundingClientRect().top : null; })()`);

await withHarness(async (app) => {
  // ==========================================================================
  // T1 — FREE WRITE / TEXT, NO INK: the typewriter runs, and is offered.
  // The unchanged case, asserted first so a narrowing cannot become a deletion.
  // ==========================================================================
  const id = await freshPage(app, W1, H1);
  await toMode(app, 'freewrite');
  await app.waitFor("!!document.querySelector('.wz-ink-switch')", { label: 'Free Write switch' });
  await sleep(200);
  const t1Dom = await twDom(app);
  const t1Stored = await twStored(app);
  const t1Offered = await twOffered(app);
  ok('T1: on a Free Write page in TEXT with no ink the typewriter RUNS — the page says so itself (data-typewriter) and the writer\'s stored setting is the default ON',
    t1Dom === 'true' && (t1Stored === true || t1Stored === 'absent(default true)'), JSON.stringify({ t1Dom, t1Stored }));
  ok('T1: and the option is OFFERED on both of its surfaces — the foot\'s icon and the Typewriter row one click deeper behind that foot\'s gear',
    t1Offered.icon === true && t1Offered.seg === true, JSON.stringify(t1Offered));

  // ==========================================================================
  // T2 — SELECTING INK DEACTIVATES IT, AND LEAVES THE STORED SETTING ALONE.
  // The second half is the one that matters: a build that "turned it off" by
  // writing the global would pass the first and reach into every other page.
  // ==========================================================================
  await setInstrument(app, 'ink');
  const t2Dom = await twDom(app);
  const t2Stored = await twStored(app);
  const t2Offered = await twOffered(app);
  ok('T2: selecting INK deactivates the typewriter on the page — "Once Ink is selected, Typewriter mode should be deactivated"',
    t2Dom === 'false', JSON.stringify({ t2Dom }));
  ok('T2: and the option is ABSENT from BOTH surfaces — not greyed, absent (G3), so there is no live switch that does nothing one click deeper',
    t2Offered.icon === false && t2Offered.seg === false, JSON.stringify(t2Offered));
  ok('T2: AND THE WRITER\'S STORED SETTING IS UNTOUCHED — still their own ON. The rule is derived per page; it never reaches into the one global value every other page reads',
    t2Stored === true || t2Stored === 'absent(default true)', JSON.stringify({ t2Stored }));

  // ==========================================================================
  // T3 — BACK TO TEXT WHILE STILL INKLESS: it returns. The rule is about INK,
  // not about having once visited the pen.
  // ==========================================================================
  await setInstrument(app, 'text');
  const t3Dom = await twDom(app);
  const t3Offered = await twOffered(app);
  ok('T3: back in TEXT with still no ink on the page, the typewriter returns and is offered again — visiting INK is not what costs a page its typewriter; ink is',
    t3Dom === 'true' && t3Offered.icon === true && t3Offered.seg === true, JSON.stringify({ t3Dom, t3Offered }));

  // ==========================================================================
  // T4 — A STROKE. "Once any ink has been added to a Page, typewriter mode
  // cannot be reactivated" — asserted where a writer would try: back in TEXT.
  // ==========================================================================
  await setInstrument(app, 'ink');
  await safePen(app, arc(), 'the page\'s first stroke');
  const inked = await settle(app, id, 1);
  ok('T4: (precondition) the page now has exactly one stroke', inked.length === 1, JSON.stringify({ n: inked.length }));
  await setInstrument(app, 'text');
  const t4Dom = await twDom(app);
  const t4Stored = await twStored(app);
  const t4Offered = await twOffered(app);
  ok('T4: a page that HAS ink does not run the typewriter in TEXT either, and the option is absent from both surfaces — "cannot be reactivated", asserted as the negative at the place the writer would reach for it',
    t4Dom === 'false' && t4Offered.offered === false, JSON.stringify({ t4Dom, t4Offered }));
  ok('T4: and the stored setting STILL says ON — the page cannot run it, the writer\'s preference is intact, and any inkless page will run it again (T9)',
    t4Stored === true || t4Stored === 'absent(default true)', JSON.stringify({ t4Stored }));

  // ==========================================================================
  // T5 — THE ERASER CLAUSE. Ruled stateful, and this is the consequence a
  // writer might not predict: an eraser IS a stroke, so rubbing the drawing out
  // does NOT give the page its typewriter back.
  // ==========================================================================
  await setInstrument(app, 'ink');
  await app.evalJs("document.querySelector('.wz-ink-eraser')?.click()");
  await sleep(250);
  const armed = await app.evalJs("document.querySelector('.wz-ink-eraser')?.getAttribute('aria-pressed') ?? null");
  await safePen(app, arc(0.31), 'an erase over that stroke');
  const erased = await settle(app, id, 2);
  await app.evalJs("document.querySelector('.wz-ink-eraser')?.click()");
  await sleep(200);
  await setInstrument(app, 'text');
  const t5Dom = await twDom(app);
  const t5Offered = await twOffered(app);
  ok('T5: (precondition) the eraser armed and the erase was stored as a stroke of its own — this is WHY the next check holds',
    armed === 'true' && erased.length === 2 && erased.some(s => s.eraser === true), JSON.stringify({ armed, n: erased.length, kinds: erased.map(s => (s.eraser ? 'eraser' : 'ink')) }));
  ok('T5: rubbing the drawing out does NOT bring the typewriter back — an eraser is itself a stroke, so the page still HAS ink. The one consequence of the stateful ruling a writer would not predict',
    t5Dom === 'false' && t5Offered.offered === false, JSON.stringify({ t5Dom, t5Offered }));

  // ==========================================================================
  // T6 — THE UNDO CLAUSE, the other half of the same ruling: a page genuinely
  // returned to inkless runs the typewriter again. A stray dot, immediately
  // undone, must not cost a page its typewriter forever.
  // ==========================================================================
  const id6 = await freshPage(app, W1, H1);
  await toMode(app, 'freewrite');
  await setInstrument(app, 'ink');
  await safePen(app, arc(), 'one stroke, to be undone');
  const before6 = await settle(app, id6, 1);
  const undo6 = await present(app, '.ink-undo');
  await app.evalJs("document.querySelector('.ink-undo')?.click()");
  await sleep(900);
  const after6 = await strokesOf(app, id6);
  await setInstrument(app, 'text');
  const t6Dom = await twDom(app);
  const t6Offered = await twOffered(app);
  ok('T6: (precondition) one stroke was drawn and the undo was there to press',
    before6.length === 1 && undo6 === true, JSON.stringify({ before: before6.length, undo6 }));
  ok('T6: undoing the only stroke returns the page to inkless AND its typewriter comes back, offered on both surfaces — the stateful reading, ruled: a page that has no ink has its typewriter, whatever it held a moment ago',
    after6.length === 0 && t6Dom === 'true' && t6Offered.icon === true && t6Offered.seg === true,
    JSON.stringify({ after: after6.length, t6Dom, t6Offered }));

  // ==========================================================================
  // T7 — DRAFT AND REVISE: no engine, no control. At two widths, because the
  // control lives in the sliver and the sliver is a framed surface's furniture.
  // ==========================================================================
  for (const [W, H] of [[W1, H1], [W2, H2]]) {
    await app.emulateDpr(1, W, H);
    await sleep(400);
    await toMode(app, 'draft');
    const draftDom = await twDom(app);
    const draftOffered = await twOffered(app);
    ok(`T7 (${W}, Draft) [AMENDED 2026-09-22]: Draft HAS the typewriter and it is OFF — "Allow typewriter mode in Draft, but make the default setting 'Off' when in Draft mode". OFF is not ABSENT: the option is offered on both surfaces, and the engine is simply not running`,
      draftDom === 'false' && draftOffered.icon === true && draftOffered.seg === true,
      JSON.stringify({ draftDom, draftOffered }));
    await toMode(app, 'revise');
    const reviseDom = await twDom(app);
    const reviseOffered = await twOffered(app);
    ok(`T7 (${W}, Revise): no typewriter engine and no typewriter option — Revise keeps none of it, which is the half of the original ruling the amendment left standing`,
      reviseDom === 'false' && reviseOffered.offered === false, JSON.stringify({ reviseDom, reviseOffered }));
  }
  await app.emulateDpr(1, W1, H1);
  await sleep(300);

  // ==========================================================================
  // T8 — A BOARD. FOUND, NOT BRIEFED: a Board has never run the typewriter
  // (the engine mounts on the typed page and the Journal only), yet the foot's
  // instruments row offered the option here too.
  // ==========================================================================
  await freshDesk(app, W1, H1);
  // A board IS a journal entry with pageType 'board', opened at /page/:id —
  // the same seeding shape ab1.mjs uses, through the app's own write seam.
  await app.evalJs(`(() => { const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'item171a-board', text: '', pageType: 'board', boxes: [
      { id: 'item171a-box', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'hello' },
    ], createdAt: now, source: null, origin: null }); })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after board seed' });
  await app.evalJs("location.hash = '#/page/item171a-board'");
  await sleep(900);
  const boardReady = await app.evalJs("!!document.querySelector('.board-canvas, .board-canvas-wrap')");
  if (!boardReady) {
    ok('DRIVER: T8 — a board surface did not mount, so the board leg is NOT reported as a pass', false, JSON.stringify(await where(app)));
  } else {
    const boardOffered = await twOffered(app);
    ok('T8: a Board offers no typewriter option on either surface — it never ran the engine, and R14\'s own words say this foot is the page-writing surfaces\', "not everything\'s". Found while building this ticket, not briefed',
      boardOffered.offered === false, JSON.stringify(boardOffered));
  }

  // ==========================================================================
  // T9 — THE WRITER'S PREFERENCE SURVIVED ALL OF IT. A brand-new page, after
  // pages that could not run the typewriter, still runs it.
  // ==========================================================================
  await freshDesk(app, W1, H1);
  const id9b = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(id9b)}`);
  await app.waitFor(`!!document.querySelector('${EDITOR}')`, { label: 'the ninth page' });
  await toMode(app, 'freewrite');
  await sleep(300);
  const t9Dom = await twDom(app);
  const t9Stored = await twStored(app);
  ok('T9: a fresh inkless page runs the typewriter again — the narrowing degrades the SETTING silently and never rewrites it, so the writer\'s own choice is still theirs (SC1 S3\'s law, and M1\'s before it)',
    t9Dom === 'true' && (t9Stored === true || t9Stored === 'absent(default true)'), JSON.stringify({ t9Dom, t9Stored }));

  // ==========================================================================
  // T10 — THE WORDS STAY PUT when the typewriter goes off under the writer.
  // Ruled: "a 25% jump on selecting Ink is the app moving the writer's work."
  // The compensation is a scroll correction, so it can only hold where there IS
  // scroll to give back; the case where there is not is MEASURED below, not
  // asserted, exactly as ModeStage.tsx's own comment says.
  // ==========================================================================
  await freshPage(app, W1, H1);
  await toMode(app, 'freewrite');
  await sleep(300);
  const pad = await app.evalJs(`(() => { const el = document.querySelector('${SCROLL}');
    return el ? Math.round(parseFloat(getComputedStyle(el).getPropertyValue('--tw-start-offset')) || 0) : 0; })()`);
  const room = await app.evalJs(`(() => { const el = document.querySelector('${SCROLL}');
    return el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0; })()`);
  const want = Math.min(room, pad + 60);
  await app.evalJs(`(() => { const el = document.querySelector('${SCROLL}'); if (el) el.scrollTop = ${want}; })()`);
  await sleep(300);
  const topBefore = await editorTop(app);
  await setInstrument(app, 'ink');
  await sleep(400);
  const topAfter = await editorTop(app);
  const moved = topBefore != null && topAfter != null ? Math.abs(topAfter - topBefore) : null;
  ok('T10: (precondition) the typewriter pad is real and the page had scroll to give back — otherwise the next check would be measuring nothing',
    pad > 60 && want >= pad, JSON.stringify({ pad, room, want }));
  ok('T10: on a SCROLLED page, selecting INK does not move the writer\'s words — the pad that is removed comes off scrollTop in the same frame, so the text stays within 2px of where it was',
    moved != null && moved <= 2, JSON.stringify({ topBefore, topAfter, moved, pad }));

  // ==========================================================================
  // T11 — THE TWO VALUES DO NOT LEAK. This is the whole reason the amendment
  // needs a second stored value: with one shared field, "default OFF in Draft"
  // could not survive a writer whose Free Write typewriter is ON, and turning
  // it on in Draft would reach into Free Write. Asserted in both directions.
  // ==========================================================================
  await freshPage(app, W1, H1);
  await toMode(app, 'draft');
  await sleep(200);
  const beforeSwitch = await twStored(app);
  const draftBefore = await twDom(app);
  // Turn Draft's on, by hand, through the foot's own switch.
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(260);
  await app.evalJs(`(() => { const row = document.querySelector('.wz-sliver-instruments-row');
    const b = row && [...row.querySelectorAll('button')].find(x => (x.getAttribute('aria-label') || '').startsWith('Typewriter'));
    if (b) b.click(); })()`);
  await sleep(220);
  await app.evalJs(`(() => { const rows = [...document.querySelectorAll('.wz-sliver-instruments-panel .mode-crow')];
    const row = rows.find(r => ((r.querySelector('span') || {}).textContent || '') === 'Typewriter');
    if (!row) return; const on = [...row.querySelectorAll('.mode-seg button')].find(b => !b.classList.contains('on'));
    if (on) on.click(); })()`);
  await sleep(400);
  const draftAfter = await twDom(app);
  const sharedAfter = await twStored(app);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(200);
  ok('T11: a hand-click turns the typewriter ON in Draft — the amendment\'s "the User can manually select to turn Typewriter mode back on", asserted through the writer\'s own control rather than the store',
    draftBefore === 'false' && draftAfter === 'true', JSON.stringify({ draftBefore, draftAfter }));
  ok('T11: and doing so DOES NOT TOUCH FREE WRITE\'S value — the shared setting reads exactly what it read before. One field for each mode is not tidiness; it is what makes "default off in Draft" survivable for a writer whose Free Write typewriter is on',
    sharedAfter === beforeSwitch, JSON.stringify({ beforeSwitch, sharedAfter }));
  await toMode(app, 'freewrite');
  await sleep(300);
  const fwAfterDraftOn = await twDom(app);
  ok('T11: and Free Write is unchanged by Draft\'s choice — it still runs on its own value, so the writer who turned the typewriter on in Draft did not quietly change the surface they were not on',
    fwAfterDraftOn === 'true', JSON.stringify({ fwAfterDraftOn }));

  // ==========================================================================
  // T13 — THE BARE MENU (reading A, ruled 2026-09-22). Nick: turning the
  // typewriter on in Draft "should make the tool menu options revert to what's
  // available in Free Write excluding any INK options" — and Free Write with
  // the typewriter ON is item 127's ruled roster, "Typewriter on/off … nothing
  // else". So Draft's tools body empties, and fills again when it goes off.
  //
  // Reading B (Free Write's literal roster minus ink) was REFUSED because
  // `forwardLock` is journal-only and not read in Draft: it would have mounted
  // a dead toggle, the exact defect this ticket exists to close.
  // ==========================================================================
  await freshPage(app, W1, H1);
  await toMode(app, 'draft');
  await sleep(300);
  const tools = () => app.evalJs(`(() => {
    const secs = [...document.querySelectorAll('.wz-sliver-section')];
    const heads = secs.map(x => ((x.querySelector('.wz-sliver-h') || {}).textContent || '').trim()).filter(Boolean);
    return { sections: secs.length, heads, structure: !!document.querySelector('.wz-sliver-structure-zone') }; })()`);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(300);
  const toolsOff = await tools();
  // Turn Draft's typewriter ON through the foot's own switch.
  await app.evalJs(`(() => { const row = document.querySelector('.wz-sliver-instruments-row');
    const b = row && [...row.querySelectorAll('button')].find(x => (x.getAttribute('aria-label') || '').startsWith('Typewriter'));
    if (b) b.click(); })()`);
  await sleep(220);
  await app.evalJs(`(() => { const rows = [...document.querySelectorAll('.wz-sliver-instruments-panel .mode-crow')];
    const row = rows.find(r => ((r.querySelector('span') || {}).textContent || '') === 'Typewriter');
    if (!row) return; const on = [...row.querySelectorAll('.mode-seg button')].find(b => !b.classList.contains('on'));
    if (on) on.click(); })()`);
  await sleep(500);
  const toolsOn = await tools();
  const domOn = await twDom(app);
  ok('T13: (precondition) with Draft\'s typewriter OFF the tool menu carries its Draft sections — Structure among them, so there is something to empty',
    toolsOff.structure === true && toolsOff.sections > 0, JSON.stringify(toolsOff));
  ok('T13: turning the typewriter ON in Draft EMPTIES the tool menu — no Structure zone, no format bar, no page-kind chips: "the tool menu options revert to what\'s available in Free Write", which with the typewriter on is nothing but the typewriter itself (item 127\'s roster)',
    domOn === 'true' && toolsOn.structure === false && toolsOn.sections === 0, JSON.stringify({ domOn, toolsOn }));
  // ...and back, because a menu that could not return would be a trapdoor.
  await app.evalJs(`(() => { const rows = [...document.querySelectorAll('.wz-sliver-instruments-panel .mode-crow')];
    const row = rows.find(r => ((r.querySelector('span') || {}).textContent || '') === 'Typewriter');
    if (!row) return; const off = [...row.querySelectorAll('.mode-seg button')].find(b => !b.classList.contains('on'));
    if (off) off.click(); })()`);
  await sleep(500);
  const toolsBack = await tools();
  ok('T13: and turning it OFF again brings Draft\'s own tools back — the menu is emptied by a setting, never destroyed by it',
    toolsBack.structure === true && toolsBack.sections === toolsOff.sections, JSON.stringify({ toolsOff, toolsBack }));
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(200);

  // ==========================================================================
  // T12 — THE PAGE'S TEXT-START FURNITURE LEAVES WITH THE TYPEWRITER. Nick:
  // "the page presets don't disappear as soon as the user selects INK instead
  // of TEXT." One switch, one effect: the doors that offer ways to BEGIN A TEXT
  // PAGE (Screenplay / Sprout / Plan) and the first-line invitation read the
  // same `instrument` that puts the typewriter down.
  // ==========================================================================
  await freshPage(app, W1, H1);
  await toMode(app, 'freewrite');
  await sleep(300);
  const furniture = () => app.evalJs(`(() => ({
    beginnings: !!document.querySelector('.wz-beginnings'),
    doors: document.querySelectorAll('.wz-beginnings .wz-beginning').length,
    invite: !!document.querySelector('.fl-invite'),   // useFirstLineInvite.tsx's own class, read from source — a guessed selector would read 'absent' in BOTH states and pass for nothing
  }))()`);
  const inText = await furniture();
  await setInstrument(app, 'ink');
  await sleep(400);
  const inInk = await furniture();
  await setInstrument(app, 'text');
  await sleep(400);
  const backInText = await furniture();
  ok('T12: (precondition) an empty Free Write page in TEXT offers its beginnings — the three doors are there to disappear',
    inText.beginnings === true && inText.doors >= 1, JSON.stringify(inText));
  // The invite is only claimed if it was actually SHOWING in TEXT — it has its
  // own conditions (empty page, not dismissed), and asserting the disappearance
  // of something that was never there is a check that passes for nothing.
  ok('T12: selecting INK takes the text-start furniture off the page — the doors that offer ways to BEGIN A TEXT PAGE have no business sitting on a sketch pad, and they leave in the same act that puts the typewriter down',
    inInk.beginnings === false && (inText.invite ? inInk.invite === false : true),
    JSON.stringify({ inText, inInk, inviteClaimed: !!inText.invite }));
  ok('T12: and choosing TEXT again brings them back — the page is still empty, so the offer is still good. Hidden by the instrument, never destroyed by it',
    backInText.beginnings === true && backInText.doors === inText.doors, JSON.stringify({ inText, backInText }));

  // The case the correction cannot cover, MEASURED and reported rather than
  // asserted: at scroll 0 there is nothing to give back.
  await freshPage(app, W1, H1);
  await toMode(app, 'freewrite');
  await sleep(300);
  await app.evalJs(`(() => { const el = document.querySelector('${SCROLL}'); if (el) el.scrollTop = 0; })()`);
  await sleep(200);
  const topTop0 = await editorTop(app);
  await setInstrument(app, 'ink');
  await sleep(400);
  const topTop0After = await editorTop(app);
  // eslint-disable-next-line no-console
  console.log(`\nITEM171A MEASURED (not a check — the named limit): at scroll 0 the words rise when the typewriter goes off, because scrollTop cannot go below zero. ${JSON.stringify({ pad, topBefore: topTop0, topAfter: topTop0After, rose: topTop0 != null && topTop0After != null ? Math.round(topTop0 - topTop0After) : null })}`);

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// item171a.mjs is a new file and parks NOTHING OF ITS OWN. Item 171-A's parks
// live in the files that own the assertions it falsified — fx2.mjs (the whole
// Draft-open seed leg), item87.mjs (clause 3 and its control), ab2.mjs, fx3.mjs
// and sc1.mjs (the script surface's R12 successors) — each counted THERE by
// execution. The empty array is still emitted before the prose line, so the
// auditor reads zero off the run rather than taking it from this comment.
//
// ⚠ ONE PARK IS STILL OWED AND CANNOT BE WRITTEN YET: item157.mjs's M10.
// Item 157 is not merged, so that file does not exist on this branch. M10's
// premise — ink drawn in the typewriter's band above the first line — becomes
// unreachable under this rule, and this ticket parks it the moment 157 lands.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nITEM171A PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; item171a.mjs parks nothing of its own (item 171-A's parks are counted in fx2.mjs, item87.mjs, ab2.mjs, fx3.mjs and sc1.mjs), and item157.mjs's M10 park is OWED once 157 merges.`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM171A VERIFY: PASS (${checks.length} checks)` : `\nITEM171A VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
