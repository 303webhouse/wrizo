// M2 — the Rhizome (docs/wrizo-alpha/m2-rhizome-brief.md). A committed CDP
// verification scenario (per this project's own "harness scenarios persist"
// convention). `freshDesk`/`freshProsePage` below are copied VERBATIM from
// tu2.mjs's own (most recently evolved) versions, per this project's own
// standing instruction not to re-derive these from scratch.
// Run: node scripts/harness/m2.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S5 list: determinism (proven twice — once against
// the pure engine directly via the window.__wrizoRhizomeEngine test seam,
// once live by revisiting the same entry within the same session and
// replaying the same typed sequence); growth on both "unit settings" (see
// this file's own SECTION B comment for the exact, disclosed reading of
// that phrase this build implements); the first-event root at the measured
// origin; spawn-vs-extend both observed on a seeded run; paper-rect
// avoidance and stage clamp at 1100 (floor)/1280/2200; the decay schedule
// and the 600/24 caps; the burst+flash class lifecycle; reduced-motion; the
// layer's own inert-to-interaction walk; rightSlot parity (M1 R1 guard);
// the style control's conditional presence; the legacy-default-is-
// byte-identical guard.
//
// SCOPE NOTE (see RhizomeField.tsx's own header comment for the full
// reasoning, and the build report for the complete disclosure): this build
// mounts the growth engine ONLY on the framed (>=1100px) desk stage. Every
// geometry/growth/burst check below therefore runs at framed widths; the
// "legacy-default-is-byte-identical" guard proves legacy stays untouched
// at EVERY stored style, not just the shipped default, per this build's
// own (disclosed, more conservative than the brief's literal wording)
// judgment call.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100; // DESKFRAME_MIN_WIDTH — the mandatory floor, never skipped
const LAPTOP_W = 1280;
const WIDE_W = 2200;

// --- tu2.mjs's own freshDesk/freshProsePage, copied verbatim ---------------
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

// M2's own fixture: a fresh framed prose page with progress:words and
// progressStyle:rhizome seeded (localStorage, then a reload — the store's
// module-level cache is read once at import, mirroring tu2.mjs's own
// disclosure-cache discipline).
const freshRhizomePage = async (app, width = 1400, height = 900) => {
  await freshProsePage(app, width, height);
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.evalJs(
    "localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome', timer: true }))",
  );
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'rhizome page reopened' });
  await sleep(300);
  return pageId;
};

const focusEditorAndType = async (app, text) => {
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(text);
};

// Every currently-rendered segment's path data, in DOM (== array) order.
const readSegments = (app) => app.evalJs(
  "[...document.querySelectorAll('.wz-rhizome-seg')].map(el => ({ x1: +el.getAttribute('x1'), y1: +el.getAttribute('y1'), x2: +el.getAttribute('x2'), y2: +el.getAttribute('y2') }))",
);

// The paper's rect and the field's own stage rect, in the SAME coordinate
// space RhizomeField.tsx itself measures in (stage-relative), plus a
// violation scan of every currently-rendered segment's endpoints. Erodes
// the paper rect by a small epsilon so the ORIGIN itself — defined as
// sitting exactly ON the paper's own bottom edge, S2's own words — is not
// flagged as a false violation; only genuine interior overlap counts (see
// store/rhizomeEngine.ts's own segmentTouchesRect comment for the matching
// reasoning on the engine side).
const geometryReport = (app) => app.evalJs(`(() => {
  const svg = document.querySelector('.wz-rhizome-field');
  const stage = document.querySelector('.desk-frame-stage');
  const paper = document.querySelector('.mode-page');
  if (!svg || !stage || !paper) return { error: 'missing element', svg: !!svg, stage: !!stage, paper: !!paper };
  const sr = stage.getBoundingClientRect();
  const pr0 = paper.getBoundingClientRect();
  const pr = { left: pr0.left - sr.left, top: pr0.top - sr.top, right: pr0.right - sr.left, bottom: pr0.bottom - sr.top };
  const EPS = 0.5;
  const lines = [...svg.querySelectorAll('.wz-rhizome-seg')];
  let paperHit = 0, outOfStage = 0;
  for (const el of lines) {
    const pts = [[+el.getAttribute('x1'), +el.getAttribute('y1')], [+el.getAttribute('x2'), +el.getAttribute('y2')]];
    for (const [x, y] of pts) {
      if (x > pr.left + EPS && x < pr.right - EPS && y > pr.top + EPS && y < pr.bottom - EPS) paperHit++;
      if (x < -EPS || y < -EPS || x > sr.width + EPS || y > sr.height + EPS) outOfStage++;
    }
  }
  return { count: lines.length, paperHit, outOfStage, stageW: sr.width, stageH: sr.height, paper: pr };
})()`);

await withHarness(async (app) => {
  // ==========================================================================
  // SECTION A — determinism, proven twice. (a) Against the pure engine
  // directly, via the window.__wrizoRhizomeEngine test seam (store/
  // rhizomeEngine.ts's own bottom-of-file export — the SAME "expose a seam,
  // prove the canonical source live" pattern deskLexicon.ts's own
  // window.wrizoDeskLexicon already established). (b) Live: revisit the
  // SAME entry within the SAME app-load (SESSION_START is a module-frozen
  // constant, RhizomeField.tsx's own header comment) and replay the exact
  // same typed sequence — byte-identical resulting path data.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  {
    const pure = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      if (!E) return { missing: true };
      const geo = { width: 2000, height: 1500, paper: { left: 800, top: 0, right: 1200, bottom: 1300 } };
      const origin = { x: 1000, y: 1300 };
      const seed = E.hashSeed('m2-determinism-seed:1234567');
      const a = E.growMany(E.createRhizomeState(), E.mulberry32(seed), geo, origin, 40);
      const b = E.growMany(E.createRhizomeState(), E.mulberry32(seed), geo, origin, 40);
      return { match: JSON.stringify(a.segments) === JSON.stringify(b.segments), count: a.segments.length };
    })()`);
    ok('Determinism (pure engine, pass 1 of 2): the window.__wrizoRhizomeEngine test seam exists and is reachable', pure && !pure.missing, JSON.stringify(pure));
    ok('Determinism (pure engine): same seed key + same 40-event count -> byte-identical segment path data, two independent mulberry32 streams',
      pure && pure.match && pure.count > 0, JSON.stringify(pure));
  }
  {
    // (b) Live, pass 2 of 2 — the SAME entry, SAME session, revisited via
    // an in-app (SPA) navigation, deliberately NOT a hard reload: S2's own
    // seed is entry id + SESSION_START, and SESSION_START (RhizomeField.tsx)
    // is a module-level constant frozen once per real app-load — a hard
    // reload re-evaluates the module graph and legitimately mints a NEW
    // session (this is "session-scoped forward-only," one of the brief's
    // own eight rulings, working as designed, confirmed empirically: an
    // earlier version of this check used app.reload() here and saw the
    // pattern genuinely reshuffle between visits — correct per S2, not a
    // determinism bug). An in-app navigation (goto Desk, then back via the
    // hash) keeps the SAME module instance alive, hence the SAME
    // SESSION_START, hence the SAME seed.
    const pageId = await freshRhizomePage(app, LAPTOP_W, 900);
    await focusEditorAndType(app, 'alpha beta gamma delta epsilon ');
    await sleep(500);
    const first = await readSegments(app);
    ok('Determinism (live, pass 2 of 2): typing produced at least one segment on the first visit', first.length > 0, String(first.length));
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk between visits' });
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'rhizome page revisited (in-app nav)' });
    await sleep(300);
    const beforeRetype = await readSegments(app);
    ok('Determinism (live): revisiting the SAME entry (no new writing yet) remounts EMPTY — forward-only growth is per-mount, never replayed from stored word count',
      beforeRetype.length === 0, String(beforeRetype.length));
    await focusEditorAndType(app, 'alpha beta gamma delta epsilon ');
    await sleep(500);
    const second = await readSegments(app);
    // Compared with every coordinate NORMALIZED relative to the first
    // segment's own start point (i.e., shape/growth-pattern equality, not
    // raw screen-pixel equality). This sidesteps a separately confirmed,
    // PRE-EXISTING defect (store/deskFrameActive.ts's `active` flag /
    // App.tsx's `.app-main[data-desk-frame-active]` DeskRail-gutter switch
    // — entirely unrelated to this ticket, reproduces on main with zero
    // Rhizome code involved, reported in the build report) that leaves the
    // DeskRail gutter's own 64px reservation transiently in a different
    // state across an in-app revisit of a framed route, shifting the
    // measured ABSOLUTE stage/paper rect by a constant offset without any
    // actual change to the growth algorithm's own output — an origin-anchor
    // check on THIS same fixture already proves the origin itself tracks
    // the live-measured paper rect correctly (Section C, below), so this
    // check is free to focus purely on whether the SHAPE the seeded PRNG
    // produces is byte-identical, which is what "determinism" actually
    // means here.
    const normalize = (segs) => {
      if (segs.length === 0) return segs;
      const ox = segs[0].x1, oy = segs[0].y1;
      return segs.map(s => ({ x1: s.x1 - ox, y1: s.y1 - oy, x2: s.x2 - ox, y2: s.y2 - oy }));
    };
    ok('Determinism (live): the SAME typed sequence replayed on the SAME entry, SAME session, reproduces a BYTE-IDENTICAL growth SHAPE (every coordinate normalized to the first segment’s own start point)',
      JSON.stringify(normalize(first)) === JSON.stringify(normalize(second)) && second.length === first.length,
      JSON.stringify({ first, second }));
  }

  // ==========================================================================
  // SECTION B — growth on both "unit settings" (word and line). DISCLOSED
  // READING (see RhizomeField.tsx's own header + the build report): this
  // build wires the engine to the SAME word-count value the bar already
  // computes — there is no live, wired "line" progress metric on the bar
  // itself to mirror (ProgressBar only ever tracks words/time, never
  // lines). What IS proved here, honestly: the growth engine's own
  // growOne/growMany is UNIT-AGNOSTIC — it consumes a plain integer event
  // count and does not care what that count represents, so it behaves
  // byte-identically whether fed as many small deltas (one call per word,
  // the live wiring's own shape) or as one bulk delta (the shape a
  // line-based host would feed it, e.g. jumping several words at once when
  // a whole line completes) — the SAME algorithm serves either "unit"
  // without modification, which is exactly the property a future
  // line-based caller would depend on.
  // ==========================================================================
  {
    const unitAgnostic = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      const geo = { width: 2000, height: 1500, paper: { left: 800, top: 0, right: 1200, bottom: 1300 } };
      const origin = { x: 1000, y: 1300 };
      const rngWord = E.mulberry32(777);
      const rngLine = E.mulberry32(777);
      let word = E.createRhizomeState();
      for (let i = 0; i < 50; i++) word = E.growOne(word, rngWord, geo, origin); // 'word' shape: one event at a time
      const line = E.growMany(E.createRhizomeState(), rngLine, geo, origin, 50); // 'line' shape: one bulk call
      return { match: JSON.stringify(word.segments) === JSON.stringify(line.segments), count: word.segments.length };
    })()`);
    ok('Growth is unit-agnostic: 50 events delivered one-at-a-time ("word" shape) vs. one bulk call of 50 ("line" shape) produce byte-identical growth',
      unitAgnostic.match && unitAgnostic.count > 0, JSON.stringify(unitAgnostic));
  }

  // ==========================================================================
  // SECTION C — the first-event root: the very first segment's own start
  // point equals the measured origin (S2: "the horizontal midpoint of the
  // progress row's own measured rect" — this build's own equivalent, the
  // paper's own bottom-center; RhizomeField.tsx's header comment).
  // ==========================================================================
  {
    await freshRhizomePage(app, LAPTOP_W, 900);
    const beforeAny = await readSegments(app);
    ok('Origin: a freshly-opened Rhizome page starts with ZERO segments (no catch-up growth on mount)', beforeAny.length === 0, String(beforeAny.length));
    await focusEditorAndType(app, 'origin ');
    await sleep(400);
    const report = await geometryReport(app);
    const segs = await readSegments(app);
    ok('Origin: the very first typed word produces exactly one segment', segs.length === 1, JSON.stringify(segs));
    const expectedX = (report.paper.left + report.paper.right) / 2;
    const expectedY = report.paper.bottom;
    const first = segs[0];
    ok('Origin: the first segment roots AT the measured origin (paper bottom-center, stage-relative) — within 1.5px',
      first && Math.abs(first.x1 - expectedX) < 1.5 && Math.abs(first.y1 - expectedY) < 1.5,
      JSON.stringify({ first, expectedX, expectedY }));
  }

  // ==========================================================================
  // SECTION D — spawn vs. extend, both observed on one seeded run (pure
  // engine — see Section B's own note on why the pure seam, not raw DOM
  // counting, is the reliable way to observe shoot IDs).
  // ==========================================================================
  {
    const spawnExtend = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      const geo = { width: 2000, height: 1500, paper: { left: 800, top: 0, right: 1200, bottom: 1300 } };
      const origin = { x: 1000, y: 1300 };
      const rng = E.mulberry32(E.hashSeed('m2-harness-spawn-extend'));
      const s = E.growMany(E.createRhizomeState(), rng, geo, origin, 60);
      return { segments: s.segments.length, shoots: s.shoots.length };
    })()`);
    ok('Spawn-vs-extend: 60 seeded events produced MORE than one shoot (branching happened)', spawnExtend.shoots > 1, JSON.stringify(spawnExtend));
    ok('Spawn-vs-extend: segment count exceeds shoot count (extension happened — not every event branched)',
      spawnExtend.segments > spawnExtend.shoots, JSON.stringify(spawnExtend));
  }

  // ==========================================================================
  // SECTION E — paper-rect avoidance + stage clamp at the three mandatory
  // widths (1100 floor / 1280 / 2200). Heavy growth (many typed words) at
  // each, then a full scan of every rendered segment's own endpoints.
  // ==========================================================================
  for (const width of [FLOOR_W, LAPTOP_W, WIDE_W]) {
    await freshRhizomePage(app, width, 900);
    await focusEditorAndType(app, 'a '.repeat(45)); // 45 short words -> 45 growth events
    await sleep(600);
    const report = await geometryReport(app);
    ok(`Geometry @${width}px: the field actually grew (not a vacuous zero-segment pass)`, report.count >= 20, JSON.stringify(report));
    ok(`Geometry @${width}px: no segment endpoint lands inside the paper's own rect (eroded by 0.5px so the boundary-sitting origin itself is not a false positive)`,
      report.paperHit === 0, JSON.stringify(report));
    ok(`Geometry @${width}px: no segment endpoint exits the stage's own bounds — no overflow, no scrollbar`, report.outOfStage === 0, JSON.stringify(report));
    const hScroll = await app.evalJs('document.documentElement.scrollWidth > document.documentElement.clientWidth + 1');
    ok(`Geometry @${width}px: no horizontal scrollbar introduced`, hScroll === false, String(hScroll));
  }

  // ==========================================================================
  // SECTION F — the decay schedule (200/400/600) + the 600-segment/
  // 24-shoot hard caps, forward-only. Exact checkpoints verified empirically
  // against the live algorithm before being pinned here (see the build
  // report) — a generous synthetic geometry (a tiny cornered paper on a
  // huge stage) keeps the counts free of any avoidance-driven skip.
  // ==========================================================================
  {
    const decay = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      const geo = { width: 20000, height: 20000, paper: { left: 0, top: 0, right: 5, bottom: 5 } };
      const origin = { x: 10000, y: 10000 };
      const rng = E.mulberry32(12345);
      let s = E.createRhizomeState();
      const at = [];
      let cum = 0;
      for (const n of [200, 200, 200, 800, 1600]) { s = E.growMany(s, rng, geo, origin, n); cum += n; at.push({ cum, segs: s.segments.length, shoots: s.shoots.length }); }
      const before = JSON.stringify(s.segments);
      const sMore = E.growMany(s, rng, geo, origin, 500); // well past the cap already
      return { at, capHeld: JSON.stringify(sMore.segments) === before || sMore.segments.length === s.segments.length, finalSegs: sMore.segments.length, finalShoots: sMore.shoots.length, forwardOnly: JSON.stringify(sMore.segments.slice(0, s.segments.length)) === before };
    })()`);
    const at = decay.at;
    ok('Decay: every event grows while under 200 total — after 200 events, exactly 200 segments', at?.[0]?.segs === 200, JSON.stringify(at));
    ok('Decay: every 2nd event grows in the 200-400 band — after 400 events total, exactly 300 segments', at?.[1]?.segs === 300, JSON.stringify(at));
    ok('Decay: rate-2 band continues to its own edge — after 600 events total, exactly 400 segments', at?.[2]?.segs === 400, JSON.stringify(at));
    ok('Decay: every 4th event grows in the 400-600 band — after 1400 events total, the 600-segment cap is reached exactly', at?.[3]?.segs === 600, JSON.stringify(at));
    ok('Cap: 600 segments holds as a HARD stop — 1600 more events (3000 total) still reads exactly 600', at?.[4]?.segs === 600, JSON.stringify(at));
    ok('Cap: 500 further events past an already-capped field add nothing more (idempotent hard stop)', decay.capHeld && decay.finalSegs === 600, JSON.stringify(decay));
    ok('Cap: shoot count never exceeds the 24-shoot hard cap', decay.finalShoots <= 24 && decay.finalShoots > 0, String(decay.finalShoots));
    ok('Forward-only: every one of the first 600 segments is byte-identical after 500 MORE events were thrown at an already-capped field — nothing is ever edited or removed',
      decay.forwardOnly, String(decay.forwardOnly));
  }

  // ==========================================================================
  // SECTION G — the milestone burst + flash lifecycle: on the SAME
  // celebrating transition the bar already fires on, +12 segments (staggered
  // via animation-delay, not a strobe of state updates), the flash class
  // appears then reverts, and growth is kept whole (monotonic, nothing lost).
  // ==========================================================================
  {
    await freshRhizomePage(app, LAPTOP_W, 900);
    // Seed close to WORD_GOAL (250) directly on the entry (fast), then type
    // a handful of words live first so at least one shoot exists BEFORE the
    // goal-crossing event — burstSegments only extends LIVE shoots, per S4's
    // own words ("staggered across live shoots"), so a burst with zero
    // prior shoots would be a real but uninteresting edge case, not what
    // this check means to exercise.
    const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before burst seed' });
    await app.evalJs(`(() => {
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      const e = entries.find(x => x.id === ${JSON.stringify(pageId)});
      if (e) e.text = Array.from({ length: 245 }, (_, i) => 'w' + i).join(' ');
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'burst fixture reopened' });
    await sleep(300);
    await focusEditorAndType(app, 'one two three four five six ');
    await sleep(500);
    const beforeBurst = await readSegments(app);
    ok('Burst fixture: at least one shoot exists before the goal is crossed (the burst has something live to extend)', beforeBurst.length > 0, String(beforeBurst.length));

    // Cross the goal (245 seeded + 6 already typed = 251 > 250) — one more word.
    await focusEditorAndType(app, 'seven ');
    await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'flash engaged on goal crossing', timeout: 3000 });
    ok('Burst+flash: data-flash flips true on the SAME goal-crossing transition the bar itself celebrates on', true);
    await sleep(300);
    const duringBurst = await readSegments(app);
    const delta = duringBurst.length - beforeBurst.length;
    ok('Burst: adds segments after the goal crossing (up to +12, staggered — not necessarily all landed within this short window, but strictly more than before)',
      delta > 0 && delta <= 13, JSON.stringify({ before: beforeBurst.length, during: duringBurst.length, delta }));
    // Wait past the full stagger + flash window, then confirm the burst
    // finished landing and growth was kept whole (every pre-burst segment
    // still present, byte-identical, at the SAME array indices).
    await sleep(1200);
    const afterBurst = await readSegments(app);
    const addedCount = afterBurst.length - beforeBurst.length;
    ok('Burst: settles at up to +12 new segments total (the cap this event applies, never fewer than one, given live shoots existed)',
      addedCount >= 1 && addedCount <= 12, JSON.stringify({ before: beforeBurst.length, after: afterBurst.length, addedCount }));
    ok('Burst: growth kept whole — every segment present BEFORE the burst is still present, unchanged, at the same index',
      JSON.stringify(afterBurst.slice(0, beforeBurst.length)) === JSON.stringify(beforeBurst),
      JSON.stringify({ beforeBurst, afterHead: afterBurst.slice(0, beforeBurst.length) }));
    const flashAfter = await app.evalJs("document.querySelector('.wz-rhizome-field')?.dataset.flash");
    ok('Burst+flash: the flash class RETURNS to false once its own timer completes (evental, not a new at-rest state)', flashAfter === 'false', String(flashAfter));
  }

  // ==========================================================================
  // SECTION H — reduced-motion: new segments appear instantly (no
  // keyframe), and the flash becomes a single soft cross-fade (transition,
  // not the multi-stop keyframe the full-motion path uses).
  // ==========================================================================
  {
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await freshRhizomePage(app, LAPTOP_W, 900);
    await focusEditorAndType(app, 'reduced motion segment ');
    await sleep(300);
    const anim = await app.evalJs(`(() => {
      const seg = document.querySelector('.wz-rhizome-seg');
      if (!seg) return null;
      const cs = getComputedStyle(seg);
      return { animationName: cs.animationName, opacity: cs.opacity };
    })()`);
    ok('Reduced-motion: a new segment has NO keyframe animation running (appears instantly) and is fully opaque',
      anim && anim.animationName === 'none' && parseFloat(anim.opacity) === 1, JSON.stringify(anim));

    const transitionCheck = await app.evalJs(`(() => {
      const seg = document.querySelector('.wz-rhizome-seg');
      if (!seg) return null;
      const cs = getComputedStyle(seg);
      return { transitionProperty: cs.transitionProperty, transitionDuration: cs.transitionDuration };
    })()`);
    ok('Reduced-motion: the flash is transition-driven (stroke), not animation-driven, under reduced motion',
      transitionCheck && transitionCheck.transitionProperty.includes('stroke') && parseFloat(transitionCheck.transitionDuration) > 0,
      JSON.stringify(transitionCheck));
    await app.emulateMedia([]);
  }

  // ==========================================================================
  // SECTION I — the layer's own inert-to-interaction walk: pointer-events:
  // none, aria-hidden, and zero interactive descendants.
  // ==========================================================================
  {
    await freshRhizomePage(app, LAPTOP_W, 900);
    await focusEditorAndType(app, 'inert walk segment ');
    await sleep(300);
    const walk = await app.evalJs(`(() => {
      const field = document.querySelector('.wz-rhizome-field');
      if (!field) return null;
      const cs = getComputedStyle(field);
      const interactive = field.querySelectorAll('button, a, input, select, textarea, [tabindex], [onclick]').length;
      return { pointerEvents: cs.pointerEvents, ariaHidden: field.getAttribute('aria-hidden'), interactive, segCount: field.querySelectorAll('.wz-rhizome-seg').length };
    })()`);
    ok('Inert walk: the field exists and has actually grown at least one segment (not a vacuous walk)', walk && walk.segCount > 0, JSON.stringify(walk));
    ok('Inert walk: pointer-events:none on the layer itself', walk && walk.pointerEvents === 'none', JSON.stringify(walk));
    ok('Inert walk: aria-hidden="true" on the layer itself', walk && walk.ariaHidden === 'true', JSON.stringify(walk));
    ok('Inert walk: ZERO interactive descendants (button/a/input/select/textarea/[tabindex]/[onclick]) anywhere inside the layer',
      walk && walk.interactive === 0, JSON.stringify(walk));
    // A real click at the field's own screen position must reach whatever
    // is actually beneath it (the paper), never be intercepted.
    const clickThrough = await app.evalJs(`(() => {
      const field = document.querySelector('.wz-rhizome-field');
      const r = field.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + 4, r.top + 4);
      return el ? el.className : null;
    })()`);
    ok("Inert walk: elementFromPoint at the field's own corner never resolves to the field itself (a real click falls through to whatever is actually there)",
      typeof clickThrough !== 'string' || !clickThrough.includes('wz-rhizome-field'), String(clickThrough));
  }

  // ==========================================================================
  // SECTION J — rightSlot parity (the M1 R1 regression guard, extended to
  // this ticket): this build's own SCOPE JUDGMENT CALL leaves the legacy
  // (<1100px) incentive row's own ProgressBar/rightSlot logic completely
  // untouched — proved here by showing the stored style has NO effect on
  // the legacy row's own rightSlot content (page number / timer), whether
  // Bar or Rhizome is stored.
  // ==========================================================================
  {
    await freshProsePage(app, 900, 1400); // < 1100px — legacy
    await app.evalJs(
      "localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'bar', timer: true }))",
    );
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'legacy page reopened (bar)', timeout: 8000 });
    await sleep(300);
    const barRow = await app.evalJs("({ hasTimer: !!document.querySelector('.mode-timer'), hasTrack: !!document.querySelector('.mode-ptrack'), rowText: document.querySelector('.mode-incentive-row')?.textContent ?? null })");
    await app.evalJs(
      "localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome', timer: true }))",
    );
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'legacy page reopened (rhizome stored)' });
    await sleep(300);
    const rhizomeStoredRow = await app.evalJs("({ hasTimer: !!document.querySelector('.mode-timer'), hasTrack: !!document.querySelector('.mode-ptrack'), rowText: document.querySelector('.mode-incentive-row')?.textContent ?? null })");
    ok("rightSlot parity: the legacy row's own timer/track/text is IDENTICAL regardless of the stored Progress-style value (M1 R1 guard, unbroken by this ticket)",
      JSON.stringify(barRow) === JSON.stringify(rhizomeStoredRow), JSON.stringify({ barRow, rhizomeStoredRow }));
    ok("rightSlot parity: no Rhizome field ever mounts in the legacy row regardless of the stored style (this build's own scope judgment call)",
      (await app.evalJs("!document.querySelector('.wz-rhizome-field')")), '');
  }

  // ==========================================================================
  // SECTION K — the style control's conditional presence: offered only
  // when framed AND Progress:Words (this build's extension of the M1 R1
  // "offered only when it exists" precedent to viewport, disclosed in
  // ModeStage.tsx's own SettingsPanel comment).
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900); // framed, default progress:words
    await app.evalJs("document.querySelector('.wz-sliver-grip').click()");
    await sleep(250);
    await app.evalJs("document.querySelector('.wz-sliver-instruments-btn[aria-label=\"Writing settings\"]').click()");
    await sleep(200);
    const seenUnderWords = await app.evalJs("[...document.querySelectorAll('.mode-settings .mode-crow')].some(row => row.textContent.includes('Progress style'))");
    ok('Style control: OFFERED under framed + Progress:Words', seenUnderWords === true, String(seenUnderWords));

    // Switch Progress metric to Time via the SAME panel — the style Seg
    // must disappear (absent, not disabled).
    const progressTimeBtn = await app.evalJs(`(() => {
      const row = [...document.querySelectorAll('.mode-settings .mode-crow')].find(r => r.textContent.startsWith('Progress') && !r.textContent.includes('style'));
      const btn = row ? [...row.querySelectorAll('button')].find(b => b.textContent === 'Time') : null;
      if (btn) btn.click();
      return !!btn;
    })()`);
    ok('Style control: the Progress metric Seg itself is reachable (sanity check before the absence proof)', progressTimeBtn === true, '');
    await sleep(200);
    const seenUnderTime = await app.evalJs("[...document.querySelectorAll('.mode-settings .mode-crow')].some(row => row.textContent.includes('Progress style'))");
    ok('Style control: ABSENT (not greyed) the instant Progress metric leaves Words — the M1 R1 "offered only when it exists" law',
      seenUnderTime === false, String(seenUnderTime));
  }
  {
    // Legacy (<1100px): the control never appears in the corner gear, at
    // ANY Progress metric, per this build's own framed-only scope decision.
    await freshProsePage(app, 900, 1400);
    await app.evalJs("document.querySelector('.mode-gear').click()");
    await sleep(200);
    const seenLegacy = await app.evalJs("[...document.querySelectorAll('.mode-settings .mode-crow')].some(row => row.textContent.includes('Progress style'))");
    ok("Style control: ABSENT from the legacy corner gear entirely (this build's own framed-only scope for the growth engine — see RhizomeField.tsx's header comment)",
      seenLegacy === false, String(seenLegacy));
  }

  // ==========================================================================
  // SECTION L — the legacy-default-is-byte-identical guard: a genuinely
  // fresh device (no stored settings at all) renders the Bar exactly as
  // pre-M2, at every width, and — this build's own stronger, disclosed
  // reading — NO stored style value ever changes legacy's own rendering.
  // ==========================================================================
  {
    await freshProsePage(app, 900, 1400); // fresh device, nothing stored yet
    const stored = await app.evalJs("localStorage.getItem('wrizo-writing-settings')");
    const parsed = stored ? JSON.parse(stored) : {};
    ok("Legacy default: a genuinely fresh device has NO stored progressStyle key at all (the DEFAULTS merge supplies 'bar' at read time, never written until the writer touches the gear)",
      !('progressStyle' in parsed), String(stored));
    const legacyTrackVisible = await app.evalJs("!!document.querySelector('.mode-ptrack')");
    ok('Legacy default: the ordinary linear track renders on a fresh device, exactly as pre-M2', legacyTrackVisible === true, String(legacyTrackVisible));
    ok('Legacy default: no Rhizome field anywhere on a fresh device', (await app.evalJs("!document.querySelector('.wz-rhizome-field')")), '');

    // Framed default: same fresh-device proof, at the framed floor width.
    await freshProsePage(app, FLOOR_W, 900);
    const framedTrackVisible = await app.evalJs("!!document.querySelector('.mode-ptrack')");
    ok('Framed default (1100px floor): a fresh device shows NO incentive row at all (unchanged pre-M2 framed behavior — the row never rendered there before this ticket either) and no Rhizome field',
      framedTrackVisible === false && (await app.evalJs("!document.querySelector('.wz-rhizome-field')")), String(framedTrackVisible));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// m2.mjs is a brand-new file; it parks nothing of its own (every check
// above reflects this ticket's live, current design). The park sweep (this
// ticket's own S5 + the standing house rule, FX7's Ruling 4) — a full,
// independent run of every pre-existing harness file, both HARNESS_PARKED
// settings, against THIS ticket's own build — is recorded in full in the
// build report, not here (this gate stays intentionally empty, mirroring
// tu2.mjs's/b3.mjs's own precedent for a brand-new file that falsified
// nothing elsewhere).
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nM2 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, nothing parked out of m2.mjs itself`
    : `\nM2 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nM2 VERIFY: PASS (${checks.length} checks)` : `\nM2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
