// TU2 — the Listener (docs/wrizo-alpha/tu2-listener-brief.md). A committed
// CDP verification scenario (per this project's own "harness scenarios
// persist" convention). `freshDesk`/`freshProsePage`/`seedEntries` below are
// copied VERBATIM from tu1.mjs's own (post-park-sweep-fix) current version —
// the most recently evolved `freshDesk` (its `skipDisclosure` option now
// seeds BOTH the legacy and versioned disclosure keys, a fix this ticket's
// own build made live in tu1.mjs; see that file's header comment) — per this
// project's own standing instruction not to re-derive these from scratch.
// `freshBoard`/`POINTER_HELPER` are adapted from b3.mjs's own (most recently
// evolved) versions, simplified to skip project-creation (a Board's own
// `pageType:'board'` row needs no `projectId` — TU1's own `tu1-empty-board`
// fixture already established a loose, unfiled board works fine; this
// ticket touches nothing project-shaped, so there is no reason to drag
// b3.mjs's own project-seeding machinery along).
// Run: node scripts/harness/tu2.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S6 list exactly: cursor (legacy-no-cursor first
// read under/over cap, cap tail-bias + the honesty line in BOTH the wire
// body and the panel's own copy, no-new-writing genuine silence,
// advance-only-on-a-genuinely-simulated-success — a real HTTP failure
// leaves the cursor untouched, persistence across a reload, the
// grandfather fixture rerun extended to lastRead); disclosure v2 (shown
// exactly once per version, including a device seeded with the OLD v1
// boolean flag — the brief's own "single most important disclosure check");
// geometry at 1100 (mandatory floor)/1280/2200 on BOTH page and board
// surfaces (grip-flush, open width = 2x the --strip-width token read live,
// paper-rect invariance closed/open/docked); the A13 structural walk
// repeated on the board-mounted panel; the session meter (renders after a
// stubbed reply, fades on a real timer, absent when no call has been
// made); S1's quiet-degrade path re-proven against the new (still-
// unconfigured, TUTOR_API_KEY unset) shape.
//
// Server-side note (read before trusting the model/usage-carrying checks
// fully — the SAME caveat tu1.mjs's own header carries, extended): this
// harness drives the REAL rendered client bundle against
// runtime-verify.mjs's own tiny auth/sync/tutor-chat test double — TU2 S6
// extended that double with a controllable `/api/_tutor_mode` (arm a
// stubbed success with real usage/model fields, or a genuine HTTP 500
// failure) and a captured `lastTutorChatBody` (read via `/api/_state`), so
// every check below proves the CLIENT's own half of the delta/cursor/meter
// contract live — the request body it actually sends, the response shape
// it actually reacts to. It does NOT exercise the real server route
// (apps/server/src/tutor.ts) or a real DeepSeek call — S1's server census
// is closed to `env.ts`/`tutor.ts`/`.env.example` only, and this harness has
// no test DB / real API key in this build environment (same constraint
// tu1.mjs's own header already documented). The real prod round-trip is
// owed after deploy, per that same precedent.
//
// Park sweep (S6's own instruction): a full, independent grep-based sweep
// of all 26 pre-existing harness files, THEN an empirical re-run of every
// one of them (both HARNESS_PARKED settings) against this ticket's own
// build. 25 of the 26 came back byte-identical green — TU2's changes
// (Tutor.tsx, index.css, deskLexicon.ts, persistence.ts, types/index.ts,
// tutorDisclosure.ts, new tutorMeter.ts/tutorCostEstimates.ts, plus the
// three server census files) touch surfaces only tu1.mjs's own fixtures
// actually exercise (the Tutor panel, its disclosure, its geometry). tu1.mjs
// itself had TWO checks genuinely falsified, confirmed live (not guessed):
// the disclosure's now-versioned seen-flag, and the panel's own new
// (narrower) open/docked width cap. Both parked IN tu1.mjs, A4-style, quoted
// verbatim, with live successors HERE. See tu1.mjs's own header + PARKED
// section for the full writeup.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100; // DESKFRAME_MIN_WIDTH — the mandatory floor, never skipped
const LAPTOP_W = 1280;
const WIDE_W = 2200;

// --- tu1.mjs's own freshDesk/freshProsePage/seedEntries, copied verbatim
// (post its own TU2 S6 park-sweep fix — see that file's header) ------------
const freshDesk = async (app, width = 1400, height = 900, { skipDisclosure = true } = {}) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
    + (skipDisclosure ? " localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '2');" : ''),
  );
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width = 1400, height = 900, opts = {}) => {
  await freshDesk(app, width, height, opts);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(400); // store/persistence.ts's own FLUSH_DELAY (300ms) — see tu1.mjs's own comment
};

// b3.mjs's own freshBoard, simplified: no project row (a loose board needs
// none — TU1's own 'tu1-empty-board' fixture already proved this, and this
// ticket's own S4 diff never touches project-scoped anything).
const freshBoard = async (app, boardId, boxes, width = 1400, height = 900, opts = {}) => {
  await freshDesk(app, width, height, opts);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'TU2 Board', projectId: null, pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// Seed a journal-entries row while parked on the Desk (the harness-seeding
// law — never seed while a flush-on-unmount page is still mounted; see
// AGENTS.md / this project's own MEMORY on the flushNow race).
const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before TU2 seed' });
  await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push(...${JSON.stringify(rows)});
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
};

const rawEntry = async (app, id) =>
  app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(id)}) ?? null`);

const openTutor = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
  await sleep(300);
};

const rectOf = async (app, sel) =>
  app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; })()`);

// TU2 S6 — arm/disarm runtime-verify.mjs's own extended tutor-chat double.
// `{}` restores the TU1-original always-unconfigured default.
const armTutorMode = (app, mode) =>
  app.evalJs(`fetch('/api/_tutor_mode', { method: 'POST', body: JSON.stringify(${JSON.stringify(mode)}) })`);

const lastTutorBody = async (app) =>
  app.evalJs("fetch('/api/_state').then(r => r.json()).then(s => s.lastTutorChatBody)");

// deskLexicon.ts's own test seam (window.wrizoDeskLexicon) — reads the
// CANONICAL string live rather than hardcoding a second copy of it here,
// the same "prove it against the source of truth, don't re-assert a
// hand-copied string" discipline this project applies to every lexicon-
// routed check.
const lex = (app, term) => app.evalJs(`window.wrizoDeskLexicon.t(${JSON.stringify(term)})`);

await withHarness(async (app) => {
  // ==========================================================================
  // CURSOR — legacy-no-cursor first read: a page with existing text and NO
  // tutor thread ever (the grandfather case TU2 S2 names), under the cap.
  // ==========================================================================
  {
    const text = 'A modest amount of pre-existing prose. '.repeat(20); // ~800 chars, well under the 16000-char cap
    await freshDesk(app, LAPTOP_W, 900);
    await seedEntries(app, [{ id: 'tu2-undercap', text, projectId: null, source: 'page', origin: 'loose', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
    await app.reload();
    await app.evalJs("location.hash = '#/page/tu2-undercap'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'under-cap legacy page open' });
    await sleep(250);
    await armTutorMode(app, { configured: true });
    await openTutor(app);
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('What do you notice?');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    const body = await lastTutorBody(app);
    ok('Cursor: legacy-no-cursor first read, UNDER cap — the delta is the page\'s ENTIRE existing text, verbatim, no truncation header',
      body?.delta === text, JSON.stringify({ deltaLen: body?.delta?.length, expectedLen: text.length }));
    const truncatedLine = await app.evalJs("document.querySelector('.wz-tutor-convo-status')?.textContent ?? ''");
    const deltaTruncatedCanon = await lex(app, 'tutorDeltaTruncated');
    ok('Cursor: under cap — the panel\'s own truncation line does NOT render (nothing was truncated)',
      truncatedLine !== deltaTruncatedCanon, truncatedLine);
  }

  // ==========================================================================
  // CURSOR — legacy-no-cursor first read, OVER the cap: tail-bias + the
  // honesty line, in BOTH the wire body (the model's own copy) and the
  // panel's own quiet UI copy (the writer's own twin, deskLexicon-routed).
  // ==========================================================================
  {
    const head = 'HEAD'.repeat(750); // 3000 chars — must NOT survive the tail cap
    const tail = 'TAIL'.repeat(5000); // 20000 chars — comfortably exceeds the 16000-char cap alone
    const text = head + tail;
    await freshDesk(app, LAPTOP_W, 900);
    await seedEntries(app, [{ id: 'tu2-overcap', text, projectId: null, source: 'page', origin: 'loose', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
    await app.reload();
    await app.evalJs("location.hash = '#/page/tu2-overcap'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'over-cap legacy page open' });
    await sleep(250);
    await armTutorMode(app, { configured: true });
    await openTutor(app);
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('What do you notice?');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    const body = await lastTutorBody(app);
    const expectedTail = text.slice(text.length - 16000);
    ok('Cursor: over cap — the delta is TAIL-BIASED (the most recent 16000 chars, i.e. entirely TAIL text, zero HEAD survives)',
      typeof body?.delta === 'string' && body.delta.endsWith(expectedTail) && !body.delta.includes('HEAD'),
      JSON.stringify({ deltaLen: body?.delta?.length, includesHead: body?.delta?.includes('HEAD') }));
    ok('Cursor: over cap — the delta block\'s OWN header carries the honesty line (the data sent TO THE MODEL)',
      typeof body?.delta === 'string' && body.delta.startsWith('[latest stretch only; earlier additions unread]\n'),
      body?.delta?.slice(0, 80));
    const truncatedLine = await app.evalJs("document.querySelector('.wz-tutor-convo-status')?.textContent ?? ''");
    const deltaTruncatedCanon = await lex(app, 'tutorDeltaTruncated');
    ok('Cursor: over cap — the panel\'s OWN quiet UI copy shows the SAME honesty, lexicon-routed (the writer\'s own twin of the model\'s header line)',
      truncatedLine === deltaTruncatedCanon, truncatedLine);
  }

  // ==========================================================================
  // CURSOR — no new writing since the cursor: genuinely no delta block at
  // all (no `delta` key on the wire, not an empty string standing in for
  // one), and no performed acknowledgment of absence in the panel.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('Some writing before the first ever question.');
    await sleep(2600); // clear the autosave window + its own flush debounce, tu1.mjs's own margin
    await armTutorMode(app, { configured: true });
    await openTutor(app);
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('First question.');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    const firstBody = await lastTutorBody(app);
    ok('Cursor: the FIRST-ever send (grandfather path) DOES carry a delta — sanity check before the no-new-writing proof',
      typeof firstBody?.delta === 'string' && firstBody.delta.length > 0, JSON.stringify(firstBody?.delta?.length));

    // No new writing since that send's own cursor advance — send again
    // with zero new text typed.
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('Second question, nothing new written.');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    const secondBody = await lastTutorBody(app);
    ok('Cursor: no new writing since the cursor — the wire body carries NO delta key at all (undefined, not an empty string)',
      !('delta' in (secondBody ?? {})) || secondBody.delta === undefined, JSON.stringify(secondBody));
    const statusAfter = await app.evalJs("document.querySelector('.wz-tutor-convo-status')?.textContent ?? ''");
    const deltaTruncatedCanon = await lex(app, 'tutorDeltaTruncated');
    ok('Cursor: no new writing — no performed acknowledgment of absence (the truncation line, the ONLY delta-related UI copy, does not render either)',
      statusAfter !== deltaTruncatedCanon, statusAfter);
    void pageId;
  }

  // ==========================================================================
  // CURSOR — advances ONLY on a successful send; a genuinely simulated
  // HTTP failure (not merely "never call send") leaves it completely
  // untouched.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('Some writing for the advance-only-on-success proof.');
    await sleep(2600);
    const pageTextLen = (await app.evalJs("document.querySelector('.forward-only-editor').innerText")).length;

    // A genuine HTTP failure — the double returns 500, apiTutorChat's own
    // `!res.ok` branch fires, status becomes 'error'.
    await armTutorMode(app, { fail: true });
    await openTutor(app);
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('Will this fail?');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    const afterFail = await rawEntry(app, pageId);
    ok('Cursor: a genuinely simulated HTTP failure renders the error status',
      (await app.evalJs("document.querySelector('.wz-tutor-convo-status')?.textContent ?? ''")).length > 0);
    ok('Cursor: a failed send leaves the cursor COMPLETELY untouched — no lastRead at all (the thread exists from an earlier send, but gained no cursor)',
      !afterFail?.tutor?.lastRead, JSON.stringify(afterFail?.tutor));

    // Now a genuine success — the SAME page, same pending cursor state.
    await armTutorMode(app, { configured: true });
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('Will this succeed?');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    const afterSuccess = await rawEntry(app, pageId);
    ok('Cursor: advances to the page\'s current length ONLY on a successful send',
      afterSuccess?.tutor?.lastRead?.chars === pageTextLen, JSON.stringify({ got: afterSuccess?.tutor?.lastRead, expected: pageTextLen }));

    // ========================================================================
    // CURSOR — persists across a reload/restart simulation.
    // ========================================================================
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'cursor-persistence page reloaded' });
    await sleep(250);
    const afterReload = await rawEntry(app, pageId);
    ok('Cursor: persists across a reload/restart simulation — the SAME lastRead survives, byte-identical',
      afterReload?.tutor?.lastRead?.chars === pageTextLen && afterReload?.tutor?.lastRead?.at === afterSuccess?.tutor?.lastRead?.at,
      JSON.stringify(afterReload?.tutor?.lastRead));
  }

  // ==========================================================================
  // CURSOR — the grandfather fixture, rerun and extended: a never-queried
  // page stays byte-identical through a full load/edit/save/reload cycle —
  // no `tutor` key at all, and (TU2's own extension) no `lastRead` either,
  // which the absent-tutor-key proof already implies but is asserted
  // explicitly here per the brief's own words ("extended to also cover
  // lastRead's absence").
  // ==========================================================================
  {
    await freshDesk(app, LAPTOP_W, 900);
    const now = new Date().toISOString();
    await seedEntries(app, [{ id: 'tu2-grandfather', text: 'A page that has never once talked to the Tutor.', projectId: null, source: 'page', origin: 'loose', createdAt: now, updatedAt: now }]);
    const beforeLoad = await rawEntry(app, 'tu2-grandfather');
    ok('Grandfather (TU2 rerun): the seeded fixture starts with no tutor key, hence no lastRead, at all',
      !('tutor' in (beforeLoad ?? {})), JSON.stringify(beforeLoad));

    await app.reload();
    await app.evalJs("location.hash = '#/page/tu2-grandfather'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'grandfather page open' });
    await sleep(250);
    const afterLoad = await rawEntry(app, 'tu2-grandfather');
    ok('Grandfather (TU2 rerun): merely opening the page (mounting the Tutor grip) adds no tutor key, hence no lastRead',
      (await app.evalJs("!!document.querySelector('.wz-tutor-grip')")) && !('tutor' in (afterLoad ?? {})),
      JSON.stringify(afterLoad));

    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys(' An unrelated edit, never asking the Tutor anything.');
    await sleep(2600);
    const afterEdit = await rawEntry(app, 'tu2-grandfather');
    ok('Grandfather (TU2 rerun): an unrelated edit + save still carries NO tutor key (not null, not {}, not {lastRead: undefined})',
      !('tutor' in (afterEdit ?? {})) && afterEdit.text.includes('unrelated'), JSON.stringify(afterEdit));

    await app.reload();
    await app.evalJs("location.hash = '#/page/tu2-grandfather'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'grandfather page reloaded' });
    await sleep(250);
    const afterReload = await rawEntry(app, 'tu2-grandfather');
    ok('Grandfather (TU2 rerun): still no tutor key (hence no lastRead) after a full reload — byte-identical to a page the Tutor has never met',
      !('tutor' in (afterReload ?? {})), JSON.stringify(afterReload));
  }

  // ==========================================================================
  // DISCLOSURE V2 — shown exactly once per version. (a) A genuinely fresh
  // device. (b) The brief's own single most important disclosure check: a
  // device seeded with the OLD v1 boolean flag ALONE does NOT suppress v2.
  // ==========================================================================
  {
    // (a) Fresh device, no flags at all.
    await freshProsePage(app, LAPTOP_W, 900, { skipDisclosure: false });
    const v2Body = await lex(app, 'tutorDisclosureBodyV2');
    ok('Disclosure v2: not yet seen on a genuinely fresh device (neither key set)',
      (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === null);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
    await sleep(300);
    const shownText = await app.evalJs("document.querySelector('.wz-tutor-disclosure-body')?.textContent ?? ''");
    ok('Disclosure v2: shown on the first-ever open, carrying the v2 wording exactly (lexicon-routed, not hand-copied here)',
      shownText === v2Body, shownText);
    await app.evalJs("document.querySelector('.wz-tutor-disclosure-ack').click()");
    await sleep(250);
    ok('Disclosure v2: the ack dismisses it and writes the CURRENT version (2) under the new key',
      (await app.evalJs("!document.querySelector('.wz-tutor-disclosure')"))
      && (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === '2');
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()"); // close
    await sleep(200);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()"); // open #2
    await sleep(300);
    ok('Disclosure v2: does NOT reappear on the second-ever open (same device, same version)',
      (await app.evalJs("!document.querySelector('.wz-tutor-disclosure')")));

    // (b) The single most important check: a device that saw v1 (the OLD
    // boolean flag, '1') and NOTHING else. TU1's own users are exactly this
    // shape the day TU2 ships.
    await freshDesk(app, LAPTOP_W, 900, { skipDisclosure: false });
    await app.evalJs("localStorage.setItem('wrizo-tutor-disclosure-seen', '1')"); // the OLD v1 flag, seeded directly — never the new version key
    await app.reload(); // tutorDisclosure.ts's own module-level cache is read once at import; the seed must precede this reload, mirroring freshDesk's own discipline
    await app.goto('/project/new');
    await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (v1-seeded device)' });
    await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
    await app.click('Start writing');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted (v1-seeded device)' });
    await sleep(400);
    ok('Disclosure v2 (v1-seeded device): the OLD v1 flag really is present and alone before the first open',
      (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen')")) === '1'
      && (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === null);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
    await sleep(300);
    const v1SeededShown = await app.evalJs("!!document.querySelector('.wz-tutor-disclosure')");
    const v1SeededText = await app.evalJs("document.querySelector('.wz-tutor-disclosure-body')?.textContent ?? ''");
    ok('Disclosure v2 (v1-seeded device) — THE single most important disclosure check: the OLD v1 flag does NOT suppress v2 — it still shows, once, with v2\'s own wording',
      v1SeededShown === true && v1SeededText === v2Body, JSON.stringify({ v1SeededShown, v1SeededText }));
    await app.evalJs("document.querySelector('.wz-tutor-disclosure-ack').click()");
    await sleep(250);
    // Close, reopen — a v1-seeded device that has now ALSO acked v2 does not see it a third time.
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
    await sleep(200);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
    await sleep(300);
    ok('Disclosure v2 (v1-seeded device): once acked, does not reappear — same "exactly once per version" law applies regardless of how the device arrived',
      (await app.evalJs("!document.querySelector('.wz-tutor-disclosure')")));
  }

  // ==========================================================================
  // GEOMETRY — three widths (1100 floor mandatory / 1280 / 2200) on BOTH
  // page and board surfaces: grip-flush, open width = 2x --strip-width
  // (read live, never hardcoded), paper-rect invariance closed/open/docked.
  // ==========================================================================
  const stripWidthPx = parseFloat(await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--strip-width')"));
  ok('Geometry: --strip-width itself reads as a real, positive pixel value (the token this whole section is keyed to)',
    Number.isFinite(stripWidthPx) && stripWidthPx > 0, String(stripWidthPx));

  for (const surface of ['page', 'board']) {
    for (const width of [FLOOR_W, LAPTOP_W, WIDE_W]) {
      const paperSel = surface === 'page' ? '.mode-pagecol' : '.board-canvas-wrap';
      if (surface === 'page') {
        await freshProsePage(app, width, 900);
      } else {
        await freshBoard(app, `tu2-geom-${width}`, [], width, 900);
      }

      const paperClosed = await rectOf(app, paperSel);
      const gripClosed = await rectOf(app, '.wz-tutor-grip');
      ok(`Geometry @${width}px/${surface}: grip-flush — the grip's own left edge sits flush (no gap) against the paper's right edge`,
        Math.abs(gripClosed.left - paperClosed.right) < 1.5, JSON.stringify({ gripLeft: gripClosed.left, paperRight: paperClosed.right }));

      await openTutor(app);
      const panelOpen = await rectOf(app, '.wz-tutor-panel');
      const paperOpen = await rectOf(app, paperSel);
      ok(`Geometry @${width}px/${surface}: paper rect BYTE-IDENTICAL, closed -> open`,
        JSON.stringify(paperClosed) === JSON.stringify(paperOpen), JSON.stringify({ paperClosed, paperOpen }));
      ok(`Geometry @${width}px/${surface}: the OPEN panel's own width is EXACTLY 2x --strip-width (${stripWidthPx}px), read live — not 300px, not hardcoded`,
        Math.abs(panelOpen.width - stripWidthPx * 2) < 1, JSON.stringify({ panelOpenWidth: panelOpen.width, expected: stripWidthPx * 2 }));

      await app.evalJs("document.querySelector('.wz-tutor-dock-btn')?.click()");
      await sleep(250);
      const paperAfterDock = await rectOf(app, paperSel);
      const dockedState = await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.docked");
      ok(`Geometry @${width}px/${surface}: paper rect BYTE-IDENTICAL after invoking the dock control (whether it genuinely docks or, below the floor, falls back to closing — either way the paper never moves)`,
        JSON.stringify(paperClosed) === JSON.stringify(paperAfterDock), JSON.stringify({ paperClosed, paperAfterDock, dockedState }));
    }
  }

  // ==========================================================================
  // A13 — the ghostwriter-rail structural walk, repeated on the
  // BOARD-mounted panel (TU2 S4's "Presence on Boards"): every control
  // actually rendered inside the panel, structural, never enumerated — none
  // can reach a writing surface. A board's own "writing surface" is its
  // title text (`entry.text`) and its `boxes` array (BoardEditor.tsx),
  // never a `forward-only-editor` — both are snapshotted and re-checked
  // byte-identical after each control activation.
  // ==========================================================================
  {
    const walkBoardId = 'tu2-board-walk';
    await freshBoard(app, walkBoardId, [
      { id: 'tu2-walk-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'An ordinary card, untouched by the walk' },
    ], LAPTOP_W, 900);
    // A rich fixture (S6's own "not a vacuous sweep" bar): give the board a
    // real conversation message + a fragment so more control species mount.
    await app.evalJs(`(() => {
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      const e = entries.find(x => x.id === ${JSON.stringify(walkBoardId)});
      if (e) e.tutor = { messages: [{ id: 'm1', role: 'writer', text: 'hello board', at: new Date().toISOString() }] };
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    // `source: undefined` (not 'page') is what computeFragmentItems reads
    // as a raw CAPTURE (tutorLenses.ts: `all.filter(e => e.source !==
    // 'page')`) — the recency path, which needs no shared tag with the
    // board. TU1's own 'tu1-capture' fixture used the identical shape;
    // a `starred:true` page with no shared TAG (the board itself carries
    // none) would otherwise surface via NEITHER of the lens's two paths
    // and silently fail to mount a fragment-item control at all.
    const walkNow = new Date().toISOString();
    await seedEntries(app, [
      { id: 'tu2-walk-frag', text: 'A fragment for the board structural walk', projectId: null, source: undefined, createdAt: walkNow, updatedAt: walkNow },
    ]);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(walkBoardId)}`);
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board walk fixture reloaded' });
    await sleep(300);
    await openTutor(app);

    const snapshot = async () => ({
      title: (await rawEntry(app, walkBoardId))?.text,
      boxes: JSON.stringify((await rawEntry(app, walkBoardId))?.boxes ?? []),
    });
    const before = await snapshot();
    const controlCount = await app.evalJs("document.querySelectorAll('.desk-frame-tutor-panel-anchor button, .desk-frame-tutor-panel-anchor input').length");
    ok('A13 board walk: the rich fixture actually mounts multiple control species (not a vacuous sweep)',
      controlCount >= 3, String(controlCount));

    const forbidden = await app.evalJs(`(() => {
      const root = document.querySelector('.desk-frame-tutor-panel-anchor');
      const html = root ? root.innerHTML.toLowerCase() : '';
      const words = ['insert', 'apply', 'copy-into', 'paste-into', 'send-to-page', 'inject'];
      return words.filter(w => html.includes(w));
    })()`);
    ok('A13 board walk: no insert/apply/copy-into-page affordance keyword exists anywhere in the board-mounted panel',
      forbidden.length === 0, JSON.stringify(forbidden));

    // Fragment items travel (a lawful exception, proven separately, exactly
    // as tu1.mjs's own walk does), excluded from the generic sweep below.
    const fragClicked = await app.evalJs(`(() => {
      const el = document.querySelector('.desk-frame-tutor-panel-anchor .wz-tutor-frag-item');
      if (!el) return false;
      el.click();
      return true;
    })()`);
    if (fragClicked) {
      await sleep(250);
      ok('A13 board walk: activating a fragment-item control TRAVELS (lawful exception — never touches the board\'s own boxes/title)',
        !(await app.evalJs(`location.hash.includes(${JSON.stringify(walkBoardId)})`)));
      await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(walkBoardId)}`);
      await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'back on the board walk fixture' });
      await sleep(300);
      await openTutor(app);
    }

    let guard = 0;
    while (guard++ < 40) {
      const stillOpen = await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.open");
      if (stillOpen !== 'true') { await openTutor(app); }
      const clicked = await app.evalJs(`(() => {
        const root = document.querySelector('.desk-frame-tutor-panel-anchor');
        if (!root) return null;
        const btns = [...root.querySelectorAll('button')];
        const target = btns.find(b => !b.className.includes('wz-tutor-dock-btn') && !b.className.includes('wz-tutor-frag-item'));
        if (!target) return null;
        target.click();
        return target.className;
      })()`);
      if (!clicked) break;
      await sleep(150);
      const now = await snapshot();
      ok(`A13 board walk: activating a "${clicked}" control never changes the board's own title or boxes`,
        now.title === before.title && now.boxes === before.boxes, clicked);
    }
    ok('A13 board walk: the sweep actually walked at least one control', guard >= 1, String(guard));

    // The composer input itself: typing into it must never touch the board.
    const beforeType = await snapshot();
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('would you write a card for me?');
    await sleep(150);
    const afterType = await snapshot();
    ok("A13 board walk: typing into the Tutor's own composer never touches the board",
      beforeType.title === afterType.title && beforeType.boxes === afterType.boxes,
      JSON.stringify({ beforeType, afterType }));
  }

  // ==========================================================================
  // SESSION METER — renders after a stubbed reply (known-model cost path AND
  // the honest unknown-model tokens-only fallback), fades on a real timer,
  // and is absent entirely when no call has been made yet.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    await openTutor(app);
    ok('Session meter: absent entirely (unmounted, not just invisible) when no call has been made yet',
      (await app.evalJs("!document.querySelector('.wz-tutor-meter')")));

    await armTutorMode(app, { configured: true, reply: 'A stubbed reply.', usage: { inputTokens: 1000, outputTokens: 200 }, model: 'deepseek-v4-flash' });
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('Meter check, known model.');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    // Poll for the meter's own appearance (rather than a blind fixed sleep)
    // so the timing checks below measure elapsed time from as close to the
    // ACTUAL render moment as this harness can get — a blind sleep(400)
    // here would eat unpredictably into the 3600ms visible window the next
    // checks depend on, and did in an earlier version of this file (a real,
    // observed flake this rewrite fixes: sleep(400) + sleep(3700) totaled
    // ~4100ms since render, already past METER_TOTAL_MS's own 4000ms, so
    // the "still fading, not yet gone" check below saw a null element).
    await app.waitFor("!!document.querySelector('.wz-tutor-meter')", { label: 'session meter rendered' });
    const meterKnown = await app.evalJs("document.querySelector('.wz-tutor-meter')?.textContent ?? ''");
    const turnCostLabel = await lex(app, 'tutorMeterTurnCost');
    const tokensUnit = await lex(app, 'tutorMeterTokensUnit');
    ok('Session meter: renders after a stubbed reply for a KNOWN model — carries the turn-cost label, the token count, and a dollar estimate',
      meterKnown.includes(turnCostLabel) && meterKnown.includes('1,200') && meterKnown.includes(tokensUnit) && meterKnown.includes('$'),
      meterKnown);

    const meterFadingEarly = await app.evalJs("document.querySelector('.wz-tutor-meter')?.dataset.fading");
    ok('Session meter: does not fade immediately — still fully opaque right after rendering',
      meterFadingEarly === 'false', String(meterFadingEarly));

    await sleep(3650); // comfortably past METER_VISIBLE_MS (3600), comfortably under METER_TOTAL_MS (4000)
    const meterFadingLater = await app.evalJs("document.querySelector('.wz-tutor-meter')?.dataset.fading");
    ok('Session meter: fades on its own timer — data-fading flips true past METER_VISIBLE_MS, still mounted',
      meterFadingLater === 'true', String(meterFadingLater));

    await sleep(500); // now comfortably past METER_TOTAL_MS (4000) from the original render
    const meterGone = await app.evalJs("!document.querySelector('.wz-tutor-meter')");
    ok('Session meter: genuinely REMOVED from the DOM (a real scheduled unmount, not merely CSS-invisible) once its own timer completes',
      meterGone === true, String(meterGone));

    // The honest unknown-model fallback — tokens only, never an invented dollar figure.
    await armTutorMode(app, { configured: true, reply: 'Another stubbed reply.', usage: { inputTokens: 500, outputTokens: 100 }, model: 'some-unknown-future-model' });
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('Meter check, unknown model.');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    const meterUnknown = await app.evalJs("document.querySelector('.wz-tutor-meter')?.textContent ?? ''");
    const tokensOnlyLabel = await lex(app, 'tutorMeterTokensOnly');
    ok('Session meter: an unknown model shows TOKENS ONLY — the honest fallback label, no invented dollar figure',
      meterUnknown.includes(tokensOnlyLabel) && meterUnknown.includes('600') && !meterUnknown.includes('$'), meterUnknown);
  }

  // ==========================================================================
  // S1 — the unconfigured/quiet-degrade path, re-proven against the new env
  // shape. Server-side note: TUTOR_BASE_URL/TUTOR_MODEL/TUTOR_MAX_TOKENS are
  // apps/server-only config this harness cannot reach (the server census is
  // closed to env.ts/tutor.ts/.env.example, and this build has no real
  // server process) — what IS provable live, exactly as TU1's own S5 proved
  // it, is that the CLIENT degrades to one quiet line when the configured
  // flag comes back false, regardless of which env vars produced that
  // state server-side (TUTOR_API_KEY unset is the one constant across both
  // TU1's and TU2's own env shape).
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    await armTutorMode(app, {}); // restores the TU1-original always-unconfigured default
    await openTutor(app);
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('Is anyone there?');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    const statusText = await app.evalJs("document.querySelector('.wz-tutor-convo-status')?.textContent ?? ''");
    ok('S1 quiet-degrade (new env shape): unconfigured still renders exactly one quiet status line, never a crash',
      statusText.length > 0, statusText);
    const afterUnconfigured = await rawEntry(app, pageId);
    ok('S1 quiet-degrade (new env shape): the writer\'s own message still persists even when unconfigured',
      afterUnconfigured?.tutor?.messages?.some((m) => m.text.includes('Is anyone there')));
    ok('S1 quiet-degrade (new env shape): the cursor never advances when unconfigured (no successful reply was ever received)',
      !afterUnconfigured?.tutor?.lastRead, JSON.stringify(afterUnconfigured?.tutor?.lastRead));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// tu2.mjs is a brand-new file; it parks nothing of its own (every check
// above reflects this ticket's live, current design). The park sweep S6
// requires (does TU2's own diff falsify any assertion in the other 26
// harness files?) was investigated in full — a grep-based sweep, THEN an
// empirical re-run of all 26 pre-existing files against this ticket's own
// build, both HARNESS_PARKED settings. 25 came back byte-identical; the
// one exception (tu1.mjs, two checks) is parked IN tu1.mjs itself, per A4,
// with its own live successors pointing back here — see this file's own
// header comment and tu1.mjs's own PARKED section for the full writeup.
// This gate is therefore intentionally empty, mirroring b3.mjs's/tu1.mjs's
// own precedent for an armed-but-empty gate on a brand-new file.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nTU2 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, nothing parked out of tu2.mjs itself`
    : `\nTU2 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nTU2 VERIFY: PASS (${checks.length} checks)` : `\nTU2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
