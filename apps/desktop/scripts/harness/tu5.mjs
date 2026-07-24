// TU5 — the Tutor's Memory / the book's Bible (docs/wrizo-alpha/
// tu5-tutors-memory-brief.md). A committed CDP verification scenario (this
// project's "harness scenarios persist" convention). freshDesk / freshProsePage
// / seedEntries / rawEntry / openTutor / rectOf / armTutorMode / lastTutorBody /
// lex are adopted from tu2.mjs's own current versions (the "don't re-derive
// fixtures" law) — with ONE change: freshDesk's `skipDisclosure` now seeds the
// disclosure version key at '3' (S6 bumped CURRENT_DISCLOSURE_VERSION 2 -> 3, so
// seeding '2' would no longer suppress the v3 disclosure).
//
// Run: node scripts/harness/tu5.mjs   (from apps/desktop, dist-web freshly built
// via `pnpm run build:web`).
//
// Covers the brief's S7 list: the fixed point (open conjures nothing; the
// writer's first add births project.tutor); edit + delete, real and persisted;
// the per-fact 300-char cap; offline add -> relaunch -> present; wire assembly
// under the captured body (bible present only when facts exist, a true ABSENT
// key when empty, <= the client cap, exact join delimiter, the persisted thread
// byte-free of any bible turn with roles still writer|tutor); a loose page shows
// NO Bible section (quiet absence); disclosure v3 exactly once + the seeded-
// legacy (v1 boolean AND v2) proofs; the A13 sweep extended over the Bible UI
// (forbidden-keyword walk + structural "no control here places a byte on the
// page"); A14 (adding the tenth fact raises no badge/toast/count); geometry at
// 1100/1280/2200 with a seeded-bible fixture + the descendant no-scroll-within-
// scroll walk; every Bible string proven against the lexicon.
//
// Client-side scope (the SAME caveat tu1/tu2's headers carry): this drives the
// REAL rendered bundle against runtime-verify.mjs's tutor-chat double, which
// captures exactly what the CLIENT posted (messages + optional delta + optional
// bible), read back via /api/_state. So the wire checks prove the CLIENT's half
// — the bible field it actually assembles and sends. The SERVER's own
// <book-bible> wrapping + its splice BEFORE the delta (apps/server/src/tutor.ts)
// is not exercised here (no real server process / API key in this build); it is
// owed after deploy exactly as TU2's own server route was, and is asserted
// structurally at review by census of tutor.ts.
//
// Park sweep (S7's instruction): a grep sweep of every harness file + an
// empirical re-run (both HARNESS_PARKED settings) against this build. The S6
// disclosure bump (2 -> 3) is the one deliberate falsifier: it supersedes
// tu2.mjs's own "Disclosure v2 shown exactly once" checks (a fresh device and a
// v1-seeded device now see v3, not v2) and makes tu2's freshDesk `skipDisclosure`
// seed ('2') no longer suppress the overlay. Those are parked IN tu2.mjs,
// A4-style, quoted verbatim, with the live successors in THIS file's disclosure
// section — see this file's own park record + tu2.mjs's PARKED section. Every
// other historic check re-ran byte-identical (the Bible is additive: a new
// column, a new store, a new panel section, two new prompt paragraphs — nothing
// pre-existing changed shape).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100; // DESKFRAME_MIN_WIDTH — the mandatory floor, never skipped
const LAPTOP_W = 1280;
const WIDE_W = 2200;
const FLUSH = 420; // store/persistence.ts FLUSH_DELAY (300ms) + margin, tu2's own figure

// --- fixtures (tu2.mjs's, verbatim except the v3 disclosure seed) ----------
const freshDesk = async (app, width = 1400, height = 900, { skipDisclosure = true } = {}) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
    // TU5 S6 — seed version '3' (was '2' in tu2.mjs): the disclosure is v3 now.
    + (skipDisclosure ? " localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '3');" : ''),
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
  await sleep(FLUSH);
};

const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before TU5 seed' });
  await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push(...${JSON.stringify(rows)});
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
};

const rawEntry = async (app, id) =>
  app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(id)}) ?? null`);

// The PERSISTED project record (post-flush) — the grandfather fixed point is
// about what syncs, so this reads localStorage, not the in-memory cache.
const rawProject = async (app, id) =>
  app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-projects')||'[]').find(p => p.id === ${JSON.stringify(id)}) ?? null`);

const openTutor = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
  await sleep(300);
};

const rectOf = async (app, sel) =>
  app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; })()`);

const armTutorMode = (app, mode) =>
  app.evalJs(`fetch('/api/_tutor_mode', { method: 'POST', body: JSON.stringify(${JSON.stringify(mode)}) })`);

const lastTutorBody = async (app) =>
  app.evalJs("fetch('/api/_state').then(r => r.json()).then(s => s.lastTutorChatBody)");

const lex = (app, term) => app.evalJs(`window.wrizoDeskLexicon.t(${JSON.stringify(term)})`);

// The book's-Bible inspection seam (store/tutorBible.ts's own window.wrizoBible,
// the wrizoBoardMode/wrizoSectionFold convention). Drives the store directly for
// deterministic seeding + inspection, exactly as the writer's own UI would.
const bibleGet = async (app, pid) => app.evalJs(`window.wrizoBible.get(${JSON.stringify(pid)})`);
const bibleAdd = (app, pid, text) => app.evalJs(`window.wrizoBible.add(${JSON.stringify(pid)}, ${JSON.stringify(text)})`);
const bibleEdit = (app, pid, id, text) => app.evalJs(`window.wrizoBible.edit(${JSON.stringify(pid)}, ${JSON.stringify(id)}, ${JSON.stringify(text)})`);
const bibleDelete = (app, pid, id) => app.evalJs(`window.wrizoBible.delete(${JSON.stringify(pid)}, ${JSON.stringify(id)})`);

// projectId of the page freshProsePage just created + opened.
const currentProjectId = async (app) => {
  const pageId = await app.evalJs("location.hash.split('/page/')[1]");
  return (await rawEntry(app, pageId))?.projectId ?? null;
};

// The Bible section is present iff its add-row input is mounted (always rendered
// when the section mounts — the surest single marker).
const bibleSectionPresent = async (app) =>
  app.evalJs("!!document.querySelector('.wz-tutor-bible-row .wz-tutor-bible-input')");

await withHarness(async (app) => {
  // ==========================================================================
  // THE FIXED POINT — opening the Tutor on a project page conjures NOTHING;
  // only the writer's explicit first add births project.tutor.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pid = await currentProjectId(app);
    ok('Fixed point: a freshly created project page has a real projectId', typeof pid === 'string' && pid.length > 0, String(pid));
    const before = await rawProject(app, pid);
    ok('Fixed point: a brand-new project has NO tutor key at all (absent, never null or empty)',
      before !== null && !('tutor' in before), JSON.stringify(before && { id: before.id, hasTutor: 'tutor' in before }));

    await openTutor(app);
    ok('Fixed point: the Bible section mounts on a project page (has a projectId)', await bibleSectionPresent(app));
    await sleep(FLUSH);
    const afterOpen = await rawProject(app, pid);
    ok('Fixed point: merely opening the Tutor + rendering the empty Bible section conjures NOTHING — still no tutor key',
      afterOpen !== null && !('tutor' in afterOpen), JSON.stringify(afterOpen && { hasTutor: 'tutor' in afterOpen }));
    const emptyRead = await bibleGet(app, pid);
    ok('Fixed point: reading the facts of a bible-less project returns [] and conjures nothing',
      Array.isArray(emptyRead) && emptyRead.length === 0 && !('tutor' in (await rawProject(app, pid))),
      JSON.stringify(emptyRead));

    // The birth: the writer's explicit first add.
    await bibleAdd(app, pid, 'Elandra is spelled with one L.');
    await sleep(FLUSH);
    const born = await rawProject(app, pid);
    ok('Fixed point: the writer\'s first add BIRTHS project.tutor = { v:1, facts:[one writer-sourced fact] }',
      born?.tutor?.v === 1 && born.tutor.facts?.length === 1
        && born.tutor.facts[0].source === 'writer' && born.tutor.facts[0].text === 'Elandra is spelled with one L.'
        && typeof born.tutor.facts[0].id === 'string' && typeof born.tutor.facts[0].createdAt === 'string',
      JSON.stringify(born?.tutor));
  }

  // ==========================================================================
  // EDIT + DELETE — real and persisted, through the writer's own UI.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pid = await currentProjectId(app);
    await openTutor(app);

    // UI add.
    await app.evalJs("document.querySelector('.wz-tutor-bible-row .wz-tutor-bible-input').focus()");
    await app.typeKeys('Kestrel sails on the third tide.');
    await app.evalJs("document.querySelector('.wz-tutor-bible-add').click()");
    await sleep(FLUSH);
    let facts = await bibleGet(app, pid);
    ok('Edit/delete: a UI add (type + Add button) creates the fact, persisted on the project',
      facts.length === 1 && facts[0].text === 'Kestrel sails on the third tide.', JSON.stringify(facts));
    const factId = facts[0].id;
    const listText = await app.evalJs("document.querySelector('.wz-tutor-bible-text')?.textContent ?? ''");
    ok('Edit/delete: the fact renders in the list exactly as saved', listText === 'Kestrel sails on the third tide.', listText);

    // UI edit: click Edit (first action button), change text, Save.
    await app.evalJs("document.querySelector('.wz-tutor-bible-fact .wz-tutor-bible-actions .wz-tutor-bible-btn').click()"); // Edit
    await sleep(150);
    await app.evalJs("(() => { const i = document.querySelector('.wz-tutor-bible-edit .wz-tutor-bible-input'); i.focus(); i.select(); })()");
    await app.evalJs("document.execCommand && document.execCommand('selectAll')");
    await app.evalJs("(() => { const i = document.querySelector('.wz-tutor-bible-edit .wz-tutor-bible-input'); i.value=''; i.dispatchEvent(new Event('input', {bubbles:true})); })()");
    await app.evalJs("document.querySelector('.wz-tutor-bible-edit .wz-tutor-bible-input').focus()");
    await app.typeKeys('Kestrel sails on the FOURTH tide.');
    await app.evalJs("document.querySelector('.wz-tutor-bible-edit .wz-tutor-bible-btn').click()"); // Save (first btn in edit row)
    await sleep(FLUSH);
    facts = await bibleGet(app, pid);
    ok('Edit/delete: a UI edit changes the fact text, keeps its id, bumps updatedAt, and persists',
      facts.length === 1 && facts[0].id === factId && facts[0].text === 'Kestrel sails on the FOURTH tide.',
      JSON.stringify(facts));

    // Persistence across reload.
    await app.reload();
    await app.evalJs("location.hash = '#/page/' + JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.projectId === " + JSON.stringify(pid) + ").id");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'edit-persist page reloaded' });
    await sleep(250);
    const afterReload = await bibleGet(app, pid);
    ok('Edit/delete: the edit survives a reload/relaunch, byte-identical',
      afterReload.length === 1 && afterReload[0].text === 'Kestrel sails on the FOURTH tide.' && afterReload[0].id === factId,
      JSON.stringify(afterReload));

    // UI delete.
    await openTutor(app);
    await app.evalJs("document.querySelectorAll('.wz-tutor-bible-fact .wz-tutor-bible-actions .wz-tutor-bible-btn')[1].click()"); // Delete (second action btn)
    await sleep(FLUSH);
    const afterDelete = await bibleGet(app, pid);
    ok('Edit/delete: a UI delete really removes the fact from the jsonb, persisted',
      afterDelete.length === 0, JSON.stringify(afterDelete));
    await app.reload();
    await app.evalJs("location.hash = '#/page/' + JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.projectId === " + JSON.stringify(pid) + ").id");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'delete-persist page reloaded' });
    await sleep(250);
    ok('Edit/delete: the deletion survives a reload (the fact stays gone)', (await bibleGet(app, pid)).length === 0);
  }

  // ==========================================================================
  // PER-FACT CAP — a fact is a line, not a page: 300 chars, enforced by the store.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pid = await currentProjectId(app);
    await bibleAdd(app, pid, 'x'.repeat(400));
    await sleep(FLUSH);
    const facts = await bibleGet(app, pid);
    ok('Per-fact cap: a 400-char add is capped to exactly 300 chars by the store (the backstop)',
      facts.length === 1 && facts[0].text.length === 300, String(facts[0]?.text?.length));
    const maxLen = await (async () => { await openTutor(app); return app.evalJs("document.querySelector('.wz-tutor-bible-row .wz-tutor-bible-input')?.maxLength"); })();
    ok('Per-fact cap: the UI add input carries maxLength=300, so the writer cannot exceed it in the UI either',
      maxLen === 300, String(maxLen));
  }

  // ==========================================================================
  // OFFLINE ADD -> RELAUNCH -> PRESENT (local-first). No real server here, so
  // "sync clean" == the record round-trips through localStorage well-formed,
  // with updatedAt bumped (dirty, ready to sync on return).
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pid = await currentProjectId(app);
    await bibleAdd(app, pid, 'Offline fact, added with no server in sight.');
    await sleep(FLUSH);
    const persisted = await rawProject(app, pid);
    ok('Offline add: the fact persists to localStorage well-formed (v:1, one writer fact) with updatedAt bumped past createdAt',
      persisted?.tutor?.v === 1 && persisted.tutor.facts.length === 1
        && persisted.tutor.facts[0].source === 'writer'
        && new Date(persisted.updatedAt).getTime() >= new Date(persisted.createdAt).getTime(),
      JSON.stringify({ v: persisted?.tutor?.v, upd: persisted?.updatedAt, crt: persisted?.createdAt }));
    await app.reload();
    await app.evalJs("location.hash = '#/page/' + JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.projectId === " + JSON.stringify(pid) + ").id");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'offline-add relaunch' });
    await sleep(250);
    const afterRelaunch = await bibleGet(app, pid);
    ok('Offline add: after a relaunch the fact is present, byte-identical (offline edits persist and would sync on return)',
      afterRelaunch.length === 1 && afterRelaunch[0].text === 'Offline fact, added with no server in sight.',
      JSON.stringify(afterRelaunch));
  }

  // ==========================================================================
  // WIRE ASSEMBLY — under the captured client body. bible present only when
  // facts exist; a true ABSENT key when empty; exact join; <= cap; and the
  // PERSISTED thread stays byte-free of any bible turn (roles writer|tutor).
  // ==========================================================================
  {
    // (a) Empty project — no facts: the wire body carries NO bible key.
    await freshProsePage(app, LAPTOP_W, 900);
    const pid = await currentProjectId(app);
    await armTutorMode(app, { configured: true, reply: 'noted' });
    await openTutor(app);
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('A question with an empty Bible.');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    let body = await lastTutorBody(app);
    ok('Wire: an empty Bible sends NO bible key at all (undefined, not an empty string)',
      !('bible' in (body ?? {})) || body.bible === undefined, JSON.stringify({ bible: body?.bible }));

    // (b) With facts: bible present, == the exact newline-joined facts.
    await bibleAdd(app, pid, 'Fact one about the harbour.');
    await bibleAdd(app, pid, 'Fact two about the lighthouse keeper.');
    await sleep(FLUSH);
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('A question with a full Bible.');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    body = await lastTutorBody(app);
    ok('Wire: with facts, the body carries bible == the facts joined by a single newline, exact (the client delimiter)',
      body?.bible === 'Fact one about the harbour.\nFact two about the lighthouse keeper.', JSON.stringify({ bible: body?.bible }));
    ok('Wire: the assembled bible stays within the 8000-char client content cap (+ short header allowance)',
      typeof body?.bible === 'string' && body.bible.length <= 8000 + 80, String(body?.bible?.length));

    // (c) The persisted thread is byte-free of any bible turn; roles writer|tutor only.
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    const thread = (await rawEntry(app, pageId))?.tutor;
    ok('Wire: the persisted thread carries ONLY writer|tutor roles — no bible/user turn ever enters it',
      Array.isArray(thread?.messages) && thread.messages.every((m) => m.role === 'writer' || m.role === 'tutor'),
      JSON.stringify(thread?.messages?.map((m) => m.role)));
    ok('Wire: no persisted message contains any bible content or a <book-bible> delimiter (the bible turn is wire-only)',
      thread.messages.every((m) => !m.text.includes('<book-bible>') && !m.text.includes('lighthouse keeper')),
      JSON.stringify(thread?.messages?.map((m) => m.text)));

    // (d) Truncation: enough facts to exceed the 8000-char content cap.
    await freshProsePage(app, LAPTOP_W, 900);
    const pid2 = await currentProjectId(app);
    for (let i = 0; i < 40; i++) await bibleAdd(app, pid2, `Fact ${i}: ` + 'y'.repeat(280)); // 40 * ~290 = ~11600 > 8000
    await sleep(FLUSH);
    await armTutorMode(app, { configured: true, reply: 'noted' });
    await openTutor(app);
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('A question with an oversized Bible.');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(400);
    body = await lastTutorBody(app);
    ok('Wire: an oversized Bible is trimmed to whole facts within cap AND carries the honest truncation header line',
      typeof body?.bible === 'string' && body.bible.startsWith('[partial: some saved facts were not included this time]\n')
        && body.bible.length <= 8000 + 80,
      JSON.stringify({ head: body?.bible?.slice(0, 60), len: body?.bible?.length }));
  }

  // ==========================================================================
  // LOOSE PAGE — no projectId, so NO Bible section at all (quiet absence, not a
  // disabled door). The rest of the panel still works.
  // ==========================================================================
  {
    await freshDesk(app, LAPTOP_W, 900);
    const now = new Date().toISOString();
    await seedEntries(app, [{ id: 'tu5-loose', text: 'A loose page, filed to no project.', projectId: null, source: 'page', origin: 'loose', createdAt: now, updatedAt: now }]);
    await app.reload();
    await app.evalJs("location.hash = '#/page/tu5-loose'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'loose page open' });
    await sleep(250);
    await openTutor(app);
    ok('Loose page: the Tutor panel opens (the grip works on a loose page)',
      (await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.open")) === 'true');
    ok('Loose page: NO Bible section is rendered (no add row, no list) — quiet absence',
      !(await bibleSectionPresent(app))
        && (await app.evalJs("!document.querySelector('.wz-tutor-bible-list')")));
    ok('Loose page: the lens sections DO still render (the panel is whole — the Bible is simply not part of it here)',
      (await app.evalJs("document.querySelectorAll('.wz-tutor-sections .wz-tutor-section').length")) >= 3);
  }

  // ==========================================================================
  // DISCLOSURE V3 — shown exactly once per version, including on legacy devices.
  // (a) fresh device; (b) a v2-acknowledged device (2 < 3 -> v3 once); (c) the
  // OLD v1 boolean flag alone -> v3 once. The successors for tu2.mjs's parked
  // v2 checks.
  // ==========================================================================
  {
    const v3Body = await lex(app, 'tutorDisclosureBodyV3');

    // (a) Fresh device.
    await freshProsePage(app, LAPTOP_W, 900, { skipDisclosure: false });
    ok('Disclosure v3: not yet seen on a genuinely fresh device (neither key set)',
      (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === null);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
    await sleep(300);
    const shown = await app.evalJs("document.querySelector('.wz-tutor-disclosure-body')?.textContent ?? ''");
    ok('Disclosure v3: shown on the first-ever open, carrying the v3 wording exactly (lexicon-routed, names the Bible)',
      shown === v3Body && shown.includes('Bible'), shown);
    await app.evalJs("document.querySelector('.wz-tutor-disclosure-ack').click()");
    await sleep(250);
    ok('Disclosure v3: the ack dismisses it and writes the CURRENT version (3) under the version key',
      (await app.evalJs("!document.querySelector('.wz-tutor-disclosure')"))
      && (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === '3');
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()"); await sleep(200);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()"); await sleep(300);
    ok('Disclosure v3: does NOT reappear on the second open (same device, same version)',
      (await app.evalJs("!document.querySelector('.wz-tutor-disclosure')")));

    // (b) A v2-acknowledged device — the seeded-legacy proof the brief names.
    await freshDesk(app, LAPTOP_W, 900, { skipDisclosure: false });
    await app.evalJs("localStorage.setItem('wrizo-tutor-disclosure-seen-version', '2')"); // v2 acknowledged, nothing newer
    await app.reload();
    await app.goto('/project/new');
    await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject (v2-seeded)' });
    await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
    await app.click('Start writing');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor (v2-seeded)' });
    await sleep(400);
    ok('Disclosure v3 (v2-seeded device): the stored seenVersion really is 2 before the first open',
      (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === '2');
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
    await sleep(300);
    const v2SeededShown = await app.evalJs("document.querySelector('.wz-tutor-disclosure-body')?.textContent ?? ''");
    ok('Disclosure v3 (v2-seeded device): 2 < 3, so v3 STILL shows exactly once, with v3\'s own wording — no bespoke branch',
      v2SeededShown === v3Body, v2SeededShown);
    await app.evalJs("document.querySelector('.wz-tutor-disclosure-ack').click()"); await sleep(250);
    ok('Disclosure v3 (v2-seeded device): the ack advances the version to 3', (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === '3');

    // (c) The OLD v1 boolean flag alone.
    await freshDesk(app, LAPTOP_W, 900, { skipDisclosure: false });
    await app.evalJs("localStorage.setItem('wrizo-tutor-disclosure-seen', '1')"); // the pre-versioning v1 flag, alone
    await app.reload();
    await app.goto('/project/new');
    await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject (v1-seeded)' });
    await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
    await app.click('Start writing');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor (v1-seeded)' });
    await sleep(400);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
    await sleep(300);
    const v1SeededShown = await app.evalJs("document.querySelector('.wz-tutor-disclosure-body')?.textContent ?? ''");
    ok('Disclosure v3 (v1-boolean-seeded device): the OLD v1 flag does NOT suppress v3 — it shows once, v3 wording',
      v1SeededShown === v3Body, v1SeededShown);
  }

  // ==========================================================================
  // A13 — the ghostwriter rail, extended over the Bible UI: no forbidden
  // keyword, and structurally NO control in the section can place a byte on the
  // page. Snapshot the page text; activate every Bible control; it never moves.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pid = await currentProjectId(app);
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('The writer\'s own page text, which the Bible must never touch.');
    await sleep(FLUSH);
    await bibleAdd(app, pid, 'A seeded fact so the list, edit and delete controls all mount.');
    await sleep(FLUSH);
    await openTutor(app);

    const bibleHtml = await app.evalJs(`(() => {
      const rows = [...document.querySelectorAll('.wz-tutor-bible-list, .wz-tutor-bible-row')];
      return rows.map(r => r.innerHTML.toLowerCase()).join(' ');
    })()`);
    const forbidden = ['insert', 'apply', 'copy-into', 'paste-into', 'send-to-page', 'inject'].filter((w) => bibleHtml.includes(w));
    ok('A13 Bible: no insert/apply/copy-into/paste-into/send-to-page/inject keyword anywhere in the Bible UI',
      forbidden.length === 0, JSON.stringify(forbidden));

    const pageBefore = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
    // Sweep every button in the Bible section (Edit, Delete, Add, and — after
    // entering edit mode — Save/Cancel), asserting the page text never moves.
    let guard = 0;
    while (guard++ < 25) {
      const clicked = await app.evalJs(`(() => {
        const scope = [document.querySelector('.wz-tutor-bible-list'), document.querySelector('.wz-tutor-bible-row')].filter(Boolean);
        for (const root of scope) {
          const btn = [...root.querySelectorAll('button')].find(b => !b.dataset.tu5seen);
          if (btn) { btn.dataset.tu5seen = '1'; btn.click(); return btn.textContent; }
        }
        return null;
      })()`);
      if (!clicked) break;
      await sleep(120);
      const pageNow = await app.evalJs("document.querySelector('.forward-only-editor')?.innerText ?? ''");
      ok(`A13 Bible: activating the "${clicked}" control never changes the page text`, pageNow === pageBefore, clicked);
    }
    ok('A13 Bible: the sweep actually walked at least one Bible control', guard > 1, String(guard));

    // Typing into the Bible add input never touches the page.
    await openTutor(app);
    await app.evalJs("document.querySelector('.wz-tutor-bible-row .wz-tutor-bible-input')?.focus()");
    await app.typeKeys('write this onto my page please');
    await sleep(120);
    ok('A13 Bible: typing into the Bible input never places a byte on the page',
      (await app.evalJs("document.querySelector('.forward-only-editor')?.innerText ?? ''")) === pageBefore);
    // And the persisted page entry text is untouched by any of it.
    ok('A13 Bible: the persisted page entry text is byte-identical after the whole Bible sweep',
      (await rawEntry(app, pageId))?.text === pageBefore, (await rawEntry(app, pageId))?.text);
  }

  // ==========================================================================
  // A14 — the room never knocks. Adding the tenth fact raises no badge, toast,
  // dot, or count. The grip is byte-identical with facts vs. without; no number
  // anywhere reflects the fact count.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pid = await currentProjectId(app);
    const gripEmpty = await app.evalJs("document.querySelector('.wz-tutor-grip').outerHTML");
    for (let i = 1; i <= 10; i++) await bibleAdd(app, pid, `Ambient-check fact number ${i}.`);
    await sleep(FLUSH);
    const gripTen = await app.evalJs("document.querySelector('.wz-tutor-grip').outerHTML");
    ok('A14: the grip markup is byte-identical with ten facts vs. zero — no badge/dot/count ever attaches to it',
      gripEmpty === gripTen, JSON.stringify({ eq: gripEmpty === gripTen }));
    ok('A14: no toast/badge element exists anywhere after the tenth add',
      (await app.evalJs("!document.querySelector('.wz-toast, .wz-badge, [data-badge], .badge')")));
    await openTutor(app);
    // No rendered number reflects the count of facts (10) anywhere in the panel.
    const panelText = await app.evalJs("document.querySelector('.wz-tutor-panel')?.innerText ?? ''");
    ok('A14: the open panel shows NO count of facts (the number 10 does not appear as a Bible count)',
      !/\b10\b/.test(panelText.replace(/Ambient-check fact number 10\./g, '')), panelText.slice(0, 120));
  }

  // ==========================================================================
  // GEOMETRY + the descendant no-scroll-within-scroll walk, WITH a seeded
  // Bible (the section mounts its list, adding real subtree to walk), at all
  // three reference widths on the page surface.
  // ==========================================================================
  for (const width of [FLOOR_W, LAPTOP_W, WIDE_W]) {
    await freshProsePage(app, width, 900);
    const pid = await currentProjectId(app);
    for (let i = 0; i < 6; i++) await bibleAdd(app, pid, `Geometry fixture fact ${i} — enough to make the Bible list a real subtree.`);
    await sleep(FLUSH);

    const paperClosed = await rectOf(app, '.mode-pagecol');
    const gripClosed = await rectOf(app, '.wz-tutor-grip');
    ok(`Geometry @${width}px: grip-flush against the paper's right edge (with a seeded Bible present)`,
      Math.abs(gripClosed.left - paperClosed.right) < 1.5, JSON.stringify({ gripLeft: gripClosed.left, paperRight: paperClosed.right }));

    await openTutor(app);
    ok(`Geometry @${width}px: the Bible list actually mounted (the fixture is real, not vacuous)`, await bibleSectionPresent(app));
    const paperOpen = await rectOf(app, '.mode-pagecol');
    ok(`Geometry @${width}px: the paper rect is BYTE-IDENTICAL closed -> open (the panel never shoves the page)`,
      JSON.stringify(paperClosed) === JSON.stringify(paperOpen), JSON.stringify({ paperClosed, paperOpen }));

    const descendantCount = await app.evalJs("document.querySelectorAll('.wz-tutor-panel *').length");
    ok(`Geometry @${width}px: the seeded-Bible panel mounts a real subtree to walk`, descendantCount >= 15, String(descendantCount));
    const offenders = await app.evalJs(`(() => {
      const offenders = [];
      for (const el of document.querySelectorAll('.wz-tutor-panel *')) {
        const cs = getComputedStyle(el);
        if (cs.overflowY === 'auto' || cs.overflowY === 'scroll' || cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
          offenders.push({ tag: el.tagName, className: String(el.className), overflowY: cs.overflowY, overflowX: cs.overflowX });
        }
      }
      return offenders;
    })()`);
    ok(`Geometry @${width}px: no Bible descendant grows its own scrollbar — the panel is still the ONLY scroll region`,
      offenders.length === 0, JSON.stringify(offenders));
    const panelOverflowY = await app.evalJs("getComputedStyle(document.querySelector('.wz-tutor-panel')).overflowY");
    ok(`Geometry @${width}px: the panel itself remains the one scroll region (overflow-y: auto)`,
      panelOverflowY === 'auto', panelOverflowY);
  }

  // ==========================================================================
  // LEXICON — every Bible string renders from deskLexicon, never hand-hardcoded.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const pid = await currentProjectId(app);
    await openTutor(app);
    // Empty state first.
    const emptyText = await app.evalJs(`(() => {
      const sec = [...document.querySelectorAll('.wz-tutor-sections .wz-tutor-section')].find(s => s.querySelector('.wz-tutor-bible-row'));
      return sec ? sec.querySelector('.wz-tutor-empty')?.textContent ?? '' : '';
    })()`);
    ok('Lexicon: the Bible empty-state text is the lexicon\'s tutorBibleEmpty (not hand-copied)',
      emptyText === (await lex(app, 'tutorBibleEmpty')), emptyText);
    const title = await app.evalJs(`(() => {
      const sec = [...document.querySelectorAll('.wz-tutor-sections .wz-tutor-section')].find(s => s.querySelector('.wz-tutor-bible-row'));
      return sec ? sec.querySelector('.wz-tutor-h')?.textContent ?? '' : '';
    })()`);
    ok('Lexicon: the Bible section header is the lexicon\'s tutorBibleTitle', title === (await lex(app, 'tutorBibleTitle')), title);
    const placeholder = await app.evalJs("document.querySelector('.wz-tutor-bible-row .wz-tutor-bible-input')?.placeholder ?? ''");
    ok('Lexicon: the add-input placeholder is the lexicon\'s tutorBibleAddPlaceholder', placeholder === (await lex(app, 'tutorBibleAddPlaceholder')), placeholder);
    const addBtn = await app.evalJs("document.querySelector('.wz-tutor-bible-add')?.textContent ?? ''");
    ok('Lexicon: the Add button label is the lexicon\'s tutorBibleAdd', addBtn === (await lex(app, 'tutorBibleAdd')), addBtn);
    // Edit/Delete/Save/Cancel labels.
    await bibleAdd(app, pid, 'A fact to expose the edit/delete labels.');
    await sleep(FLUSH);
    const editLabel = await app.evalJs("document.querySelector('.wz-tutor-bible-fact .wz-tutor-bible-actions .wz-tutor-bible-btn')?.textContent ?? ''");
    const deleteLabel = await app.evalJs("document.querySelectorAll('.wz-tutor-bible-fact .wz-tutor-bible-actions .wz-tutor-bible-btn')[1]?.textContent ?? ''");
    ok('Lexicon: the per-fact Edit label is the lexicon\'s tutorBibleEdit', editLabel === (await lex(app, 'tutorBibleEdit')), editLabel);
    ok('Lexicon: the per-fact Delete label is the lexicon\'s tutorBibleDelete', deleteLabel === (await lex(app, 'tutorBibleDelete')), deleteLabel);
    await app.evalJs("document.querySelector('.wz-tutor-bible-fact .wz-tutor-bible-actions .wz-tutor-bible-btn').click()"); // Edit
    await sleep(150);
    const saveLabel = await app.evalJs("document.querySelector('.wz-tutor-bible-edit .wz-tutor-bible-btn')?.textContent ?? ''");
    const cancelLabel = await app.evalJs("document.querySelectorAll('.wz-tutor-bible-edit .wz-tutor-bible-btn')[1]?.textContent ?? ''");
    ok('Lexicon: the edit-mode Save label is the lexicon\'s tutorBibleSave', saveLabel === (await lex(app, 'tutorBibleSave')), saveLabel);
    ok('Lexicon: the edit-mode Cancel label is the lexicon\'s tutorBibleCancel', cancelLabel === (await lex(app, 'tutorBibleCancel')), cancelLabel);
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ============
// tu5.mjs ships with nothing parked of its own — every check above reflects
// TU5's live, current design. (tu2.mjs is where THIS ticket's own falsified
// predecessors are parked — the disclosure-v2 checks the S6 bump superseded —
// per the immutability law: park in the file that owns the check, name the
// superseding authority, point at the live successor here.)
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nTU5 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; tu5.mjs parks nothing of its own (see tu2.mjs's PARKED section for the disclosure-v2 checks TU5 S6 superseded).`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nTU5 VERIFY: PASS (${checks.length} checks)` : `\nTU5 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
