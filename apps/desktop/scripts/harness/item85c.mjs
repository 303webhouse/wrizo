// ITEM 85-C — THE AUTHORING SEAMS, PROVEN. A committed CDP verification
// scenario, per AGENTS.md's "harness scenarios persist."
//
// WHY THIS FILE EXISTS AT ALL. Phase 1 of item 85-C added seven seams and seven
// seed fields to persistence.ts. A seam that is never exercised is a
// decoration — it reports a capability it may not have — and this repo has
// already watched a guard nearly ship green on two blind spots that were both
// empty in the tree. So every seam is driven here, and the drive is not "does
// it write a row".
//
// THE CHECK THAT ACTUALLY MATTERS is S2, and it is the whole argument for the
// seams existing:
//
//   A RAW-SEEDED ROW IS DESTROYED BY THE NEXT PRODUCT WRITE. A SEAM-SEEDED ROW
//   IS NOT.
//
// persistence.ts hydrates its cache once at module init and never re-reads it;
// any product write then serialises that WHOLE cache back over storage, and the
// cache never contained the raw row. So the raw row vanishes — with no timing
// signature, which is why no settle poll ever fixed it and why it presented for
// a day as a ~50% flake. S2 drives both halves in the same run, on the same
// page, so the comparison is a measurement rather than a claim: seed one row
// raw and one through the seam, perform ONE ordinary product write, and read
// both back.
//
// Without the raw half, S2 would prove only that a row written through the
// store is still there afterwards — which is not news. The raw half is the
// control that makes the seam half mean something.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Seam writes are DEBOUNCED like every other product write (scheduleFlush,
// 300ms) — the raw writes they replace were synchronous, and that is the one
// behavioural difference a migrating fixture has to absorb. Every read of
// localStorage below waits for the row to land rather than assuming it has.
const FLUSH = 600;

const freshDesk = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

await withHarness(async (app) => {
  // =========================================================================
  // S1 — EVERY SEAM IS ATTACHED AND AUTHORS WHAT IT CLAIMS.
  // Structural first: a missing seam must fail here as a named absence, not
  // later as a confusing TypeError inside a fixture that was trying to use it.
  // =========================================================================
  await freshDesk(app);
  // ALL ELEVEN, not the eight this list carried while three seams went
  // unnamed. The check was never falsified — it simply could not fail for a
  // seam it did not know about, which is the quieter half of "a check can pass
  // for the wrong reason". Extending the roster is coverage, not a rewrite.
  const attached = await app.evalJs(`JSON.stringify([
    'wrizoCreateJournalPage','wrizoPatchEntry','wrizoCreateProject','wrizoCreateBinder',
    'wrizoPatchProject','wrizoCreateStoryPlan','wrizoCreateDrawer','wrizoSetProjectDrawer',
    'wrizoFlushNow','wrizoSetCurrentBeat','wrizoSetBeatStatus','wrizoTouchInOrder',
  ].filter(n => typeof window[n] !== 'function'))`);
  ok('S1: every 85-C seam is attached to window as a function — a seam that is absent fails here by NAME, rather than as a TypeError inside whichever fixture first reaches for it',
    attached === '[]', `missing: ${attached}`);

  // The six new seed fields, driven through the real birth path in one call.
  //
  // ITEM 85-C — the SEVENTH field is gone, and the check that asserted it is
  // parked below (SUPERSEDED). `updatedAt` was never seedable: `upsert` stamps
  // it from the wall clock on every write, so the assignment was overwritten
  // before the row reached storage. The old check passed anyway because the
  // seam returned the object it had been HANDED rather than the row that was
  // STORED — the write-path lie this item's own law names. Fixing the seam to
  // return storage turned this check red, which is the check working: its
  // premise was already dead and only the lie was holding it up. The successor
  // below asserts the opposite and stronger thing — that a supplied `updatedAt`
  // is REFUSED — so the absence is now proved rather than assumed.
  const seeded = await app.evalJs(`(() => {
    const e = window.wrizoCreateJournalPage({
      id: '85c-seed', text: 'seeded', pageType: 'board', origin: 'loose',
      starred: true, tags: ['85c'], shelved: true, orderIndex: 7,
      createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2021-02-03T00:00:00.000Z',
      boxes: [], script: { v: 1, scenes: [] },
    });
    return JSON.stringify({ id: e.id, starred: e.starred, tags: e.tags, shelved: e.shelved,
      orderIndex: e.orderIndex, createdAt: e.createdAt, updatedAt: e.updatedAt,
      pageType: e.pageType, origin: e.origin, hasScript: !!e.script });
  })()`);
  const s = JSON.parse(seeded);
  ok('S1: the six new seed fields all reach the row through the real birth path — script, starred, tags, shelved, orderIndex, and a supplied createdAt, read back from STORAGE rather than from the object the seam was handed',
    s.starred === true && JSON.stringify(s.tags) === '["85c"]' && s.shelved === true
    && s.orderIndex === 7 && s.hasScript === true
    && s.createdAt === '2020-01-01T00:00:00.000Z', seeded);

  // INVERT THE DEFAULT, PROVE THE EXCEPTION. A field the seam does not honour
  // must be demonstrably NOT honoured, or its removal is a claim nobody checks.
  // Supplying `updatedAt` must leave storage stamped by the write, not by the
  // caller — and the value the seam hands back must be that same stamp.
  ok('S1: a supplied updatedAt is REFUSED — storage holds the write\'s own stamp, never the asked value, and the seam reports what storage holds. The seed key was removed because it could never work; this is what makes the removal checkable',
    s.updatedAt !== '2021-02-03T00:00:00.000Z' && s.updatedAt > '2021-02-03T00:00:00.000Z',
    JSON.stringify({ asked: '2021-02-03T00:00:00.000Z', stored: s.updatedAt }));

  // The control that keeps S1 honest: an UNSEEDED call must still write the
  // byte-identical row it always wrote. A widened seam that changed the
  // default row would be a behaviour change wearing a seam's clothes.
  //
  // ITEM 85-C — THE EQUALITY CLAUSE IS PARKED (see below), AND THIS ASSERTS AN
  // ORDER INSTEAD. The original required updatedAt === createdAt. Those are two
  // separate clock reads — createdAt is stamped at function entry, updatedAt by
  // upsert a few microseconds later — and while the seam echoed its input the
  // check never saw them apart. Now that the seam reports STORAGE, they agree
  // only when both land in the same millisecond: nearly always, and not always.
  // The premise changed under it exactly as the seeded-updatedAt check's did.
  // A CHECK THAT DEPENDS ON TWO CLOCK READS AGREEING ASSERTS AN ORDER, NEVER AN
  // EQUALITY — so this asserts the order, which is what the control ever meant
  // (the row is born, not later touched) and is true by construction.
  const unseeded = await app.evalJs(`(() => {
    const e = window.wrizoCreateJournalPage();
    return JSON.stringify({ starred: e.starred, tags: e.tags, shelved: e.shelved,
      orderIndex: e.orderIndex, script: e.script, timesOrdered: e.updatedAt >= e.createdAt,
      createdAt: e.createdAt, updatedAt: e.updatedAt,
      source: e.source, origin: e.origin });
  })()`);
  const u = JSON.parse(unseeded);
  ok('S1 (the control): an UNSEEDED call is untouched by the widening — none of the six fields appears, source is still page, origin still journal, and updatedAt is NOT BEFORE createdAt. Zero behaviour change, demonstrated rather than asserted',
    u.starred === undefined && u.tags === undefined && u.shelved === undefined
    && u.orderIndex === undefined && u.script === undefined && u.timesOrdered === true
    && u.source === 'page' && u.origin === 'journal', unseeded);

  // S1d — `origin: null` seeds a row with NO origin field, which is a different
  // row from one homed in the journal and the single most load-bearing detail
  // of the whole migration: 52 of the 67 rows wave 1 seeds carry no origin, so
  // without this the migration would rewrite them rather than move them. The
  // control beside it is what gives null its meaning — OMITTING origin must
  // still produce the default.
  await app.evalJs(`(() => {
    window.wrizoCreateJournalPage({ id: '85c-no-origin', origin: null });
    window.wrizoCreateJournalPage({ id: '85c-default-origin' });
    window.wrizoCreateJournalPage({ id: '85c-loose-origin', origin: 'loose' });
  })()`);
  await sleep(FLUSH);
  const originRows = await app.evalJs(`(() => {
    const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const pick = (id) => { const e = es.find(x => x.id === id); return e ? ('origin' in e ? String(e.origin) : 'ABSENT') : 'MISSING'; };
    return JSON.stringify({ nulled: pick('85c-no-origin'), def: pick('85c-default-origin'), loose: pick('85c-loose-origin') });
  })()`);
  const o = JSON.parse(originRows);
  ok('S1d: origin:null seeds a row with NO origin field — the pre-AB3 grandfather shape, and the row 52 of wave 1\'s 67 seeds actually are. Without it the migration would rewrite those rows instead of moving them, and the guard cannot see that difference',
    o.nulled === 'ABSENT', originRows);
  ok('S1d (the control): omitting origin still yields the default \'journal\', and an explicit \'loose\' still wins — so null is a third, distinct instruction rather than a synonym for either',
    o.def === 'journal' && o.loose === 'loose', originRows);

  // =========================================================================
  // S2 — THE POINT OF THE WHOLE ITEM. Raw vs seam, same run, same product
  // write, read back together.
  // =========================================================================
  // ORDER MATTERS HERE, AND THE FIRST VERSION OF THIS BLOCK HAD IT WRONG — a
  // mistake worth keeping in the record because of how it was caught.
  //
  // It seeded RAW first and then called the seam. But THE SEAM CALL IS ITSELF A
  // PRODUCT WRITE: it serialises the whole cache back over storage, and the
  // cache never held the raw row. So the raw row was already destroyed before
  // the deliberate product write below ever ran.
  //
  // S2's final reads would still have come out {raw:false, seam:true} — the
  // exact shape this file expects — and the check WOULD HAVE PASSED FOR THE
  // WRONG REASON, crediting the destruction to a write that had nothing to do
  // with it. The premise check is the only thing that caught it, which is the
  // discriminator law in miniature: assert the state your conclusion depends
  // on, not only the conclusion.
  //
  // So: seam row FIRST and let it flush, then the raw row on top of the flushed
  // content, so both genuinely coexist before a single product write is made.
  await freshDesk(app);
  await app.evalJs("window.wrizoCreateJournalPage({ id: '85c-seam', text: 'seeded through the seam', origin: 'loose' })");
  await sleep(FLUSH);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: '85c-raw', text: 'seeded raw', source: 'page', origin: 'loose', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  const bothBefore = await app.evalJs(`(() => {
    const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    return JSON.stringify({ raw: es.some(e => e.id === '85c-raw'), seam: es.some(e => e.id === '85c-seam') });
  })()`);
  ok('S2 (the premise): immediately after seeding, BOTH rows are in storage — so the divergence below is caused by the product write, not by one of them never having been written',
    JSON.parse(bothBefore).raw === true && JSON.parse(bothBefore).seam === true, bothBefore);

  // ONE ordinary product write. Nothing exotic: the same call any fixture
  // makes the moment it does something real.
  await app.evalJs("window.wrizoCreateJournalPage({ text: 'an ordinary product write' })");
  await sleep(FLUSH);
  const bothAfter = await app.evalJs(`(() => {
    const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    return JSON.stringify({ raw: es.some(e => e.id === '85c-raw'), seam: es.some(e => e.id === '85c-seam') });
  })()`);
  const after = JSON.parse(bothAfter);
  ok('S2: THE RAW ROW IS GONE after one ordinary product write — the whole-cache re-serialisation, reproduced deliberately. This is the defect item 85 exists for, and it is what 54 harness files are still exposed to',
    after.raw === false, bothAfter);
  ok('S2: THE SEAM ROW SURVIVES the identical write, in the same run on the same page — which is the entire argument for the seams, measured side by side rather than asserted',
    after.seam === true, bothAfter);

  // =========================================================================
  // S3 — THE COLLECTION SEAMS: the three that did not exist at all, which is
  // why 13 files could not stop writing raw.
  // =========================================================================
  await freshDesk(app);
  const collections = await app.evalJs(`(() => {
    const proj = window.wrizoCreateProject('85C Project');
    const binder = window.wrizoCreateBinder('85C Binder', 'book');
    const drawer = window.wrizoCreateDrawer('85C Drawer');
    window.wrizoSetProjectDrawer(proj.id, drawer.id);
    const plan = window.wrizoCreateStoryPlan(proj.id, 'three_act', ['setup','midpoint','resolution']);
    return JSON.stringify({
      projectId: proj.id, binderKind: binder.kind, drawerName: drawer.name,
      planId: plan.id, planProject: plan.projectId, beats: plan.beatNotes.length,
    });
  })()`);
  const c = JSON.parse(collections);
  ok('S3: the three collections that had NO authoring seam now have one — a project, a binder with a kind, and a drawer are all born through the store rather than past it',
    typeof c.projectId === 'string' && c.projectId.length > 0 && c.binderKind === 'book'
    && c.drawerName === '85C Drawer', collections);
  ok('S3: wrizoCreateStoryPlan authors the plan with its beats — the collection j5.mjs names in its own source as unreachable ("no wrizo* seam authors one — item 85 phase 2")',
    typeof c.planId === 'string' && c.planProject === c.projectId && c.beats === 3, collections);

  await sleep(FLUSH);
  // createStoryPlan stamps project.storyPlanId itself — so the fixtures that
  // set that field by hand were duplicating work the creator already does.
  // Proven, because "the creator already does it" is exactly the kind of claim
  // that is true right up until it is not.
  const stamped = await app.evalJs(`(() => {
    const ps = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const p = ps.find(x => x.title === '85C Project');
    const ds = JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]');
    return JSON.stringify({ storyPlanId: p && p.storyPlanId, drawerId: p && p.drawerId, drawers: ds.length });
  })()`);
  const st = JSON.parse(stamped);
  ok('S3: creating a plan through the seam ALSO stamps project.storyPlanId, and wrizoSetProjectDrawer files the project — so the b2-1/m1 fixtures that set both fields by hand were duplicating what the creators already do',
    st.storyPlanId === c.planId && st.drawerId && st.drawers === 1, stamped);

  // =========================================================================
  // S4 — THE MUTATION SEAMS: setting a field on a row that already exists,
  // which 7 files reach past the store to do today.
  // =========================================================================
  const patched = await app.evalJs(`(() => {
    const e = window.wrizoCreateJournalPage({ id: '85c-patch', text: 'original text', origin: 'loose' });
    const after = window.wrizoPatchEntry('85c-patch', { tags: ['gilded'], starred: true,
      tutor: { messages: [{ id: 'm1', role: 'writer', text: 'hello', at: new Date().toISOString() }] } });
    return JSON.stringify({ tags: after.tags, starred: after.starred,
      msgs: after.tutor && after.tutor.messages.length, textKept: after.text, born: e.id });
  })()`);
  const p = JSON.parse(patched);
  ok('S4: wrizoPatchEntry sets tags, starred and tutor on an EXISTING row — the four field mutations fx10/tu1/tu2/m2/m3/m4 perform raw today',
    JSON.stringify(p.tags) === '["gilded"]' && p.starred === true && p.msgs === 1, patched);
  ok('S4: and the patch KEEPS the row\'s own text — patchJournalEntry re-injects it on every write so a field mutation never clobbers a freshly-typed run, which is the discipline it was built for',
    p.textKept === 'original text', patched);

  const renamed = await app.evalJs(`(() => {
    const proj = window.wrizoCreateProject('Before Rename');
    const after = window.wrizoPatchProject(proj.id, { title: 'Renamed Grammar Project' });
    return JSON.stringify({ id: proj.id, sameId: after.id === proj.id, title: after.title });
  })()`);
  const r = JSON.parse(renamed);
  ok('S4: wrizoPatchProject renames a project WITHOUT changing its id — the exact fixture fx9.mjs performs raw to prove its folds are id-keyed, and the one seam here that composes (getProject + saveProject) because no first-class project mutator exists to wrap',
    r.sameId === true && r.title === 'Renamed Grammar Project', renamed);

  // The mutation seams' own not-found control: a patch against a row that does
  // not exist must return null rather than inventing one. A seam that silently
  // creates on patch would turn a fixture's typo into a passing test.
  const missing = await app.evalJs(`JSON.stringify({
    entry: window.wrizoPatchEntry('no-such-row', { starred: true }),
    project: window.wrizoPatchProject('no-such-project', { title: 'x' }),
  })`);
  ok('S4 (the control): patching a row that does not exist returns null for both seams and creates nothing — a seam that silently created on patch would turn a fixture\'s typo into a passing check',
    JSON.parse(missing).entry === null && JSON.parse(missing).project === null, missing);

  // S5 — THE THREE SEAMS THAT USED TO SAY NOTHING AT ALL.
  //
  // setCurrentBeat, setBeatStatus and setProjectDrawer are typed `void` in the
  // store and bail SILENTLY on a missing row, so these seams returned undefined
  // whether the write landed or never happened — the echo lie's twin, failing
  // by silence. The seams now compute the verdict themselves by re-reading, so
  // each must report BOTH outcomes. A no-op that reports nothing is a no-op a
  // fixture will read as success.
  const beatPlan = await app.evalJs(`(() => {
    const p = window.wrizoCreateProject('85c Verdict Project');
    const plan = window.wrizoCreateStoryPlan(p.id, 'story_circle', ['b0', 'b1', 'b2']);
    return JSON.stringify({ planId: plan.id, beats: plan.beatNotes.map((bn) => bn.beatId) });
  })()`);
  const bp = JSON.parse(beatPlan);
  const verdicts = await app.evalJs(`(() => {
    const planId = ${JSON.stringify(bp.planId)};
    const beatId = ${JSON.stringify(bp.beats[1])};
    const projectHit = window.wrizoCreateProject('85c Drawer Project');
    const drawer = window.wrizoCreateDrawer('85c Drawer');
    const val = (r) => (r === false ? false : (r && typeof r === 'object' ? 'record' : String(r)));
    return JSON.stringify({
      beatHit: val(window.wrizoSetCurrentBeat(planId, beatId)),
      beatMiss: val(window.wrizoSetCurrentBeat('no-such-plan', beatId)),
      statusHit: val(window.wrizoSetBeatStatus(planId, beatId, 'complete')),
      statusMissPlan: val(window.wrizoSetBeatStatus('no-such-plan', beatId, 'complete')),
      statusMissBeat: val(window.wrizoSetBeatStatus(planId, 'no-such-beat', 'complete')),
      drawerHit: val(window.wrizoSetProjectDrawer(projectHit.id, drawer.id)),
      drawerMiss: val(window.wrizoSetProjectDrawer('no-such-project', drawer.id)),
    });
  })()`);
  const v = JSON.parse(verdicts);
  ok('S5: wrizoSetCurrentBeat reports BOTH outcomes — the stamped record when the beat is set, and false when the plan does not exist. Previously it returned undefined either way, so a fixture could not tell a write from a no-op',
    v.beatHit === 'record' && v.beatMiss === false, verdicts);
  ok('S5: wrizoSetBeatStatus reports false for EACH of its two silent bail paths — a missing plan AND a missing beat note — because a valid plan with a wrong beatId is the failure a plan-existence check would wave through',
    v.statusHit === 'record' && v.statusMissPlan === false && v.statusMissBeat === false, verdicts);
  ok('S5: wrizoSetProjectDrawer reports the stamped project on success and false for a project that does not exist — the verdict read back from storage, not inferred from the call returning',
    v.drawerHit === 'record' && v.drawerMiss === false, verdicts);
});

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ============
// This file's first tenant of the A4 scaffold. ITEM 85-C (2026-09-15): the
// seam was fixed to return what STORAGE holds rather than the object it was
// handed, and that falsified this file's own "seven seed fields" check whole —
// because the seventh field never worked and only the echo was holding it up.
// Quoted verbatim below (SUPERSEDED); the live successor is the inverted
// assertion in S1 above ("a supplied updatedAt is REFUSED").
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });

  // === ITEM 85-C — SUPERSEDED (the seeded updatedAt) =========================
  // ORIGINAL, verbatim:
  //
  //   ok('S1: the seven new seed fields all reach the row through the real birth path — script, starred, tags, shelved, orderIndex, and a createdAt/updatedAt that DIFFER (the one thing b2.mjs needs and the only reason updatedAt is in the list)',
  //     s.starred === true && JSON.stringify(s.tags) === '["85c"]' && s.shelved === true
  //     && s.orderIndex === 7 && s.hasScript === true
  //     && s.createdAt === '2020-01-01T00:00:00.000Z' && s.updatedAt === '2021-02-03T00:00:00.000Z', seeded);
  //
  // WHY IT CANNOT STAND. `upsert` stamps `updatedAt` from the wall clock on
  // every write — persistence.ts's single write path — so a seeded value was
  // overwritten before the row reached storage. It was never true of STORAGE;
  // it was true only of the object the seam returned, and the seam was
  // returning its own input. Once the seam reported storage instead, the check
  // went red, having passed for a day on a value nobody had written. Making
  // `upsert` honour a supplied `updatedAt` was REFUSED (2026-09-15) as house
  // work — it changes the write semantics of every product path — so the seed
  // key was removed rather than the store bent to it, and b2.mjs establishes
  // its recency order by TOUCHING (`wrizoTouchInOrder`) instead.
  //
  // Re-asserted below as the same experiment with its true verdict; the live
  // successor is in S1 above.
  await withHarness(async (app) => {
    await freshDesk(app);
    const parkedSeed = await app.evalJs(`(() => {
      const e = window.wrizoCreateJournalPage({
        id: '85c-parked-seed', text: 'seeded', pageType: 'board', origin: 'loose',
        starred: true, tags: ['85c'], shelved: true, orderIndex: 7,
        createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2021-02-03T00:00:00.000Z',
        boxes: [], script: { v: 1, scenes: [] },
      });
      return JSON.stringify({ createdAt: e.createdAt, updatedAt: e.updatedAt });
    })()`);
    const ps = JSON.parse(parkedSeed);
    pok('PARKED (was "S1: the seven new seed fields ... a createdAt/updatedAt that DIFFER") — the SAME seed, with the verdict storage actually gives: createdAt is honoured exactly, updatedAt is NOT, because upsert stamps it on every write. The original asserted the echo; this asserts the row',
      ps.createdAt === '2020-01-01T00:00:00.000Z' && ps.updatedAt !== '2021-02-03T00:00:00.000Z',
      parkedSeed);

    // === ITEM 85-C — SUPERSEDED (the unseeded row's equal timestamps) ========
    // ORIGINAL, verbatim:
    //
    //   ok('S1 (the control): an UNSEEDED call is untouched by the widening — none of the seven fields appears, source is still page, origin still journal, and updatedAt still equals createdAt. Zero behaviour change, demonstrated rather than asserted',
    //     u.starred === undefined && u.tags === undefined && u.shelved === undefined
    //     && u.orderIndex === undefined && u.script === undefined && u.sameTimes === true
    //     && u.source === 'page' && u.origin === 'journal', unseeded);
    //
    // WHY IT CANNOT STAND. `createdAt` is stamped at createJournalPage's entry
    // and `updatedAt` by `upsert` a few microseconds later: TWO clock reads.
    // While the seam echoed its input the check compared the object it was
    // handed, where both came from the same value, so it could not see them
    // apart. Now that the seam reports STORAGE, the two agree only when both
    // land in the same millisecond — nearly always, and not always. It was
    // never falsified; it was made a check that can pass by luck of timing,
    // which the house's empty known-flake list will not carry.
    //
    // Re-asserted as the ORDER it always meant. Live successor in S1 above.
    const parkedUnseeded = await app.evalJs(`(() => {
      const e = window.wrizoCreateJournalPage();
      return JSON.stringify({ createdAt: e.createdAt, updatedAt: e.updatedAt });
    })()`);
    const pu = JSON.parse(parkedUnseeded);
    pok('PARKED (was "S1 (the control): ... updatedAt still equals createdAt") — the SAME birth, asserted as an ORDER: updatedAt is not before createdAt. Two clock reads agree only within a millisecond, so equality was a coin the check kept winning',
      pu.updatedAt >= pu.createdAt, parkedUnseeded);
    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nITEM85C PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nITEM85C PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM85C VERIFY: PASS (${checks.length} checks)`
  : `\nITEM85C VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
