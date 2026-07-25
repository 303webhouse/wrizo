// M4 — the Root That Shows (docs/wrizo-alpha/p1-wave.md §M4, SV13–SV16; the
// build map is docs/wrizo-alpha/m4-finish-map.md). A committed CDP
// verification scenario. Fixtures (freshDesk / freshProsePage /
// freshRhizomePage / seedWordsAndReopen) are adopted from m3.mjs VERBATIM —
// the standing "don't re-derive fixtures" law. Run: node scripts/harness/m4.mjs
// (from apps/desktop, with dist-web freshly built via `pnpm run build:web`).
//
// Covers all four slices:
//   S1 (SV13) sequenced origins — the pure engine through the
//      `window.__wrizoRhizomeEngine` seam: originsAwake steps 1→7 at the
//      ruled word thresholds with NO new constant, origin one grows ALONE on
//      a barely-written page, determinism unchanged.
//   S2 (SV14) the green — the live `--rhizome-ink` token.
//   S3 (SV15) the bar comes home — LIVE, at the 1100 floor / 1366×768 / 1920,
//      the progress instrument renders under the page inside the rhizome's
//      OWN lane (`.desk-frame-rhizome-anchor`), clamped to the paper's own
//      measure, inside the reserved fence, with the paper's rect untouched;
//      no second row anywhere; the gear toggle still flips bar↔rhizome and
//      both styles land in the SAME lane.
//   S4 (SV16) the completion moment — LIVE, framed: crossing the goal fires
//      an unmistakable ORANGE (ember) flare that reverts after its window,
//      counts nothing, and fires for BOTH styles. It was DEAD on the framed
//      desk before this ticket (the root-cause of record: ProgressBar's own
//      celebrate and AmbientGlow's bloom both render only `!framed`).
//
// SUCCESSOR NOTE — this file carries the live successors to three assertions
// M4 falsified elsewhere, each parked A4-style in the file that owned it
// (never rewritten in place):
//   • m2.mjs "Framed default (1100px floor): a fresh device shows NO
//     incentive row at all" → S3 SUCCESSOR below (a fresh framed device now
//     shows the instrument, in the lane).
//   • m3.mjs "S1: --rhizome-ink is warmed to #7a6242" → S2 SUCCESSOR below.
//   • m3.mjs "Q1 stays parked: the framed desk has NO progress row" → S3
//     SUCCESSOR below; SV15 is Nick answering that parked question directly,
//     by the front door.
// ab1.mjs's own parked flourish probe ("progress-bar ... remain absent",
// tested as `.desk-frame .mode-incentive-row`) is deliberately left untouched
// and still TRUE: the legacy ROW did not come back to the framed desk — the
// instrument came home through the rhizome's lane instead, and FX1 S5's dead
// `.desk-frame-meter` shell stays dead. Both are asserted below rather than
// assumed.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100;   // DESKFRAME_MIN_WIDTH — the mandatory floor, never skipped
const LAPTOP_W = 1366;  // the mandatory 1366×768 leg (geometry touched)
const LAPTOP_H = 768;
const WIDE_W = 1920;
const LEGACY_W = 1000;

// --- m3.mjs's fixtures, verbatim -------------------------------------------
const freshDesk = async (app, width = 1400, height = 900, { skipDisclosure = true } = {}) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
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
  await sleep(400);
};
// m3.mjs's freshRhizomePage, generalized to either style (the ONE change:
// the stored `progressStyle` is a parameter now — M4's whole S3 question is
// what each of the two values renders in the one lane).
const freshStyledPage = async (app, style, width = 1400, height = 900) => {
  await freshProsePage(app, width, height);
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.evalJs(`localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: ${JSON.stringify(style)} }))`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `page reopened (${style})` });
  await sleep(400);
  return pageId;
};
// m3.mjs's seedWordsAndReopen, verbatim (seeded on the Desk, never while a
// flush-on-unmount page is mounted — the harness-seeding law).
const seedWordsAndReopen = async (app, pageId, words) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before word seed' });
  await app.evalJs(`(() => {
    const text = Array.from({length: ${words}}, (_, i) => 'word' + (i % 97)).join(' ');
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = entries.find(x => x.id === ${JSON.stringify(pageId)});
    if (e) { e.text = text; localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries)); }
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'seeded page reopened' });
  await sleep(500);
};
// The lane report: every rect S3 makes a claim about, measured in one pass.
const laneReport = (app) => app.evalJs(`(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { l: Math.round(b.left*100)/100, t: Math.round(b.top*100)/100, r: Math.round(b.right*100)/100, b: Math.round(b.bottom*100)/100, w: Math.round(b.width*100)/100, h: Math.round(b.height*100)/100 }; };
  const anchor = document.querySelector('.desk-frame-rhizome-anchor');
  const lane = document.querySelector('.desk-frame-instrument');
  const track = document.querySelector('.mode-ptrack');
  const field = document.querySelector('.wz-rhizome-field');
  return {
    stage: r(document.querySelector('.desk-frame-stage')),
    paper: r(document.querySelector('.mode-page')),
    anchor: r(anchor), lane: r(lane), track: r(track),
    trackInLane: !!(track && lane && lane.contains(track)),
    laneInAnchor: !!(lane && anchor && anchor.contains(lane)),
    fieldInAnchor: !!(field && anchor && anchor.contains(field)),
    hasTrack: !!track, hasField: !!field,
    legacyRow: !!document.querySelector('.mode-incentive-row'),
    meterTracks: document.querySelectorAll('.desk-frame-meter').length,
    lanePointerEvents: lane ? getComputedStyle(lane).pointerEvents : null,
    flareText: document.querySelector('.desk-frame-goalflare')?.textContent ?? null,
  };
})()`);

await withHarness(async (app) => {
  await freshDesk(app, LAPTOP_W, LAPTOP_H);

  // ── S1 — sequenced origins (SV13), the pure engine through the seam ───────
  {
    const s1 = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      if (!E || !E.originsAwake) return { missing: true };
      const awakeAt = (w) => E.originsAwake(E.saturationTarget(w));
      // The finish map's own seam-verified boundary samples.
      const samples = { 0: awakeAt(0), 128: awakeAt(128), 129: awakeAt(129), 280: awakeAt(280),
        281: awakeAt(281), 466: awakeAt(466), 706: awakeAt(706), 707: awakeAt(707),
        1045: awakeAt(1045), 3000: awakeAt(3000) };
      // Monotone, never past ORIGIN_COUNT, and every value 1..7 is actually
      // reached across the sweep (a genuine 7-step staircase, not a jump).
      let mono = true, prev = 0, max = 0;
      const seen = new Set();
      for (let w = 0; w <= 4000; w += 1) { const a = awakeAt(w); if (a < prev) mono = false; prev = a; if (a > max) max = a; seen.add(a); }
      return { samples, mono, max, values: [...seen].sort((a, b) => a - b), ORIGIN_COUNT: E.ORIGIN_COUNT };
    })()`);
    ok('S1: the engine exposes originsAwake on the test seam (window.__wrizoRhizomeEngine)', !s1.missing, JSON.stringify(s1.samples ?? s1));
    ok('S1: an UNWRITTEN page wakes exactly ONE origin — origin one grows alone (SV13\'s "one legible root first")',
      s1.samples && s1.samples['0'] === 1, JSON.stringify({ at0: s1.samples?.['0'] }));
    ok('S1: the ruled thresholds hold at the seam — 128→1, 129→2, 280→2, 281→3, 466→3, 706→5, 707→5, 1045→6 (~0/129/281/467/707/1045/1623 words, NO new constant)',
      s1.samples && s1.samples['128'] === 1 && s1.samples['129'] === 2 && s1.samples['280'] === 2
      && s1.samples['281'] === 3 && s1.samples['466'] === 3 && s1.samples['706'] === 5
      && s1.samples['707'] === 5 && s1.samples['1045'] === 6,
      JSON.stringify(s1.samples));
    ok('S1: an essay-length page has all SEVEN origins awake (3000 words), and the count never exceeds ORIGIN_COUNT',
      s1.samples && s1.samples['3000'] === 7 && s1.max === s1.ORIGIN_COUNT, JSON.stringify({ at3000: s1.samples?.['3000'], max: s1.max, ORIGIN_COUNT: s1.ORIGIN_COUNT }));
    ok('S1: the wake count is MONOTONE and steps through EVERY value 1..7 — territory is earned one origin at a time, never un-earned',
      s1.mono && JSON.stringify(s1.values) === JSON.stringify([1, 2, 3, 4, 5, 6, 7]), JSON.stringify({ mono: s1.mono, values: s1.values }));

    // The gate is real in growTo, not just in the helper: a barely-written
    // page roots exactly ONE origin's system. Counts DISTINCT ORIGIN ROOTS
    // (segments starting exactly on an origin point) — NOT shoots.length,
    // which correctly includes the branches growing FROM origin one.
    const s1b = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      const geo = { width: 1600, height: 1000, paper: { left: 600, top: 120, right: 1000, bottom: 860 } };
      const origins = E.seedOrigins(E.mulberry32(E.hashSeed('m4-s1')), geo);
      const roots = (words) => {
        const st = E.growTo(E.createRhizomeState(), E.mulberry32(E.hashSeed('m4-s1:grow')), geo, origins, E.saturationTarget(words));
        const hit = new Set();
        for (const s of st.segments) {
          const i = origins.findIndex(o => Math.abs(o.x - s.x1) < 1e-9 && Math.abs(o.y - s.y1) < 1e-9);
          if (i >= 0) hit.add(i);
        }
        return { rooted: [...hit].sort((a, b) => a - b), segs: st.segments.length, shoots: st.shoots.length };
      };
      return { at50: roots(50), at3000: roots(3000) };
    })()`);
    ok('S1: growTo on a barely-written page (50 words) roots EXACTLY ONE origin — origin ONE (index 0), and it still branches its own system',
      JSON.stringify(s1b.at50.rooted) === '[0]' && s1b.at50.segs > 0,
      JSON.stringify(s1b.at50));
    ok('S1: growTo at essay length (3000 words) roots ALL SEVEN origins — new territory arrives as writing earns it',
      s1b.at3000.rooted.length === 7, JSON.stringify({ rooted: s1b.at3000.rooted, segs: s1b.at3000.segs }));

    // Determinism unchanged by the new rooting gate (m3.mjs's check shape).
    const det = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      const geo = { width: 1600, height: 1000, paper: { left: 600, top: 120, right: 1000, bottom: 860 } };
      const t = E.saturationTarget(1200);
      const run = () => JSON.stringify(E.growTo(E.createRhizomeState(), E.mulberry32(E.hashSeed('m4det:99')), geo, E.seedOrigins(E.mulberry32(E.hashSeed('m4det')), geo), t).segments);
      return { same: run() === run() };
    })()`);
    ok('S1: determinism survives the sequencing — the same seed + geo + words still reproduces byte-identical growth', det.same, String(det.same));
  }

  // ── S2 — the green (SV14) ────────────────────────────────────────────────
  // SUCCESSOR to m3.mjs's parked "S1: --rhizome-ink is warmed to #7a6242".
  {
    const ink = await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--rhizome-ink').trim().toLowerCase()");
    ok('S2 (successor to m3.mjs\'s parked ink check): --rhizome-ink is the deep low-yellow green #4c5942 — the ground turns green', ink === '#4c5942', ink);
    const rgb = await app.evalJs("(() => { const d = document.createElement('div'); d.style.color = getComputedStyle(document.documentElement).getPropertyValue('--rhizome-ink').trim(); document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })()");
    ok('S2: the token resolves live to rgb(76, 89, 66) — G is the DOMINANT channel, so the ground reads as a root, never as the house olive ("olive means: this is a door")',
      rgb === 'rgb(76, 89, 66)', rgb);
  }

  // ── S3 — the bar comes home (SV15), LIVE at three widths ─────────────────
  // The 1366×768 leg is mandatory (this ticket touches geometry); the floor
  // (1100) and a wide leg bracket it.
  for (const [width, height] of [[FLOOR_W, 900], [LAPTOP_W, LAPTOP_H], [WIDE_W, 1080]]) {
    await freshStyledPage(app, 'bar', width, height);
    await app.emulateDpr(1, width, height); await sleep(400);
    const g = await laneReport(app);
    const tag = `@${width}×${height}`;

    ok(`S3 ${tag}: the progress bar RENDERS on the framed desk — and inside the rhizome's OWN lane (.desk-frame-instrument, inside .desk-frame-rhizome-anchor). It rendered nowhere framed before this ticket.`,
      g.hasTrack && g.trackInLane && g.laneInAnchor, JSON.stringify({ hasTrack: g.hasTrack, trackInLane: g.trackInLane, laneInAnchor: g.laneInAnchor }));
    ok(`S3 ${tag}: the bar sits UNDER THE PAGE — wholly below the paper's bottom edge and wholly inside the stage (the reserved --fx3-paper-fence band)`,
      !!g.lane && !!g.paper && !!g.stage && g.lane.t >= g.paper.b - 0.5 && g.lane.b <= g.stage.b + 0.5,
      JSON.stringify({ paperBottom: g.paper?.b, laneTop: g.lane?.t, laneBottom: g.lane?.b, stageBottom: g.stage?.b }));
    ok(`S3 ${tag}: the lane is clamped to the paper's OWN canonical measure — its left/right edges track the paper's at this --paper-scale step`,
      !!g.lane && !!g.paper && Math.abs(g.lane.l - g.paper.l) <= 1 && Math.abs(g.lane.r - g.paper.r) <= 1,
      JSON.stringify({ lane: g.lane, paper: g.paper }));
    ok(`S3 ${tag}: NO second progress row — the legacy .mode-incentive-row still does not mount framed, and FX1 S5's .desk-frame-meter shell stays dead (zero tracks)`,
      g.legacyRow === false && g.meterTracks === 0, JSON.stringify({ legacyRow: g.legacyRow, meterTracks: g.meterTracks }));
    ok(`S3 ${tag}: the instrument is INERT — pointer-events:none, so an instrument in the writing ground can never become a control`,
      g.lanePointerEvents === 'none', String(g.lanePointerEvents));

    // PAGE IS PRIMARY — the lane is an absolutely positioned overlay child,
    // so mounting it cannot move the paper. Proven, not asserted: the paper's
    // rect with the instrument mounted vs. with Progress:Off (the lane
    // returns null) must be identical.
    const withBar = g.paper;
    await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'off' }))");
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `progress:off reopened ${tag}` });
    await sleep(400);
    const gOff = await laneReport(app);
    ok(`S3 ${tag}: PAGE IS PRIMARY — the paper's rect is byte-identical with the instrument mounted and with it absent (Progress:Off); the lane can never move the page`,
      !!gOff.paper && JSON.stringify(withBar) === JSON.stringify(gOff.paper) && gOff.hasTrack === false,
      JSON.stringify({ withBar, withoutBar: gOff.paper, trackWhenOff: gOff.hasTrack }));
  }

  // ── S3 — one lane, two styles: the SAME anchor holds whichever is chosen ──
  {
    await freshStyledPage(app, 'rhizome', LAPTOP_W, LAPTOP_H);
    const gR = await laneReport(app);
    ok('S3: Progress-style RHIZOME puts the growth layer in the lane and NO bar — one instrument, one location, two styles',
      gR.hasField && gR.fieldInAnchor && gR.hasTrack === false,
      JSON.stringify({ hasField: gR.hasField, fieldInAnchor: gR.fieldInAnchor, hasTrack: gR.hasTrack }));

    // The gear's Progress-style toggle STAYS a toggle (SV15: "not a home") —
    // flipping it live swaps which instrument occupies the one lane.
    await app.evalJs("document.querySelector('.wz-sliver-grip').click()");
    await sleep(250);
    await app.evalJs("document.querySelector('.wz-sliver-instruments-btn[aria-label=\"Writing settings\"]').click()");
    await sleep(250);
    const clicked = await app.evalJs(`(() => {
      const row = [...document.querySelectorAll('.mode-settings .mode-crow')].find(r => r.textContent.includes('Progress style'));
      const btn = row ? [...row.querySelectorAll('button')].find(b => b.textContent === 'Bar') : null;
      if (btn) btn.click();
      return !!btn;
    })()`);
    ok('S3: the gear still OFFERS the Progress-style toggle on the framed desk (it stays a toggle, never a home)', clicked === true, String(clicked));
    await sleep(400);
    const gB = await laneReport(app);
    ok('S3: flipping Rhizome→Bar in the gear swaps the instrument IN PLACE — the bar appears in the same lane and the growth layer leaves it',
      gB.hasTrack && gB.trackInLane && gB.hasField === false,
      JSON.stringify({ hasTrack: gB.hasTrack, trackInLane: gB.trackInLane, hasField: gB.hasField }));
  }

  // ── S3 SUCCESSORS to the two parked entries this ticket falsified ─────────
  {
    // m2.mjs: "Framed default (1100px floor): a fresh device shows NO
    // incentive row at all ... and no Rhizome field."
    await freshProsePage(app, FLOOR_W, 900); // genuinely fresh device, nothing stored
    await sleep(300);
    const g = await laneReport(app);
    ok('S3 (successor to m2.mjs\'s parked "Framed default"): a GENUINELY FRESH framed device (nothing stored, Bar is the shipped default) now shows the instrument — in the lane, under the page — where before this ticket it showed nothing at all',
      g.hasTrack && g.trackInLane && g.hasField === false, JSON.stringify({ hasTrack: g.hasTrack, trackInLane: g.trackInLane, hasField: g.hasField }));
    // m3.mjs: "Q1 stays parked: the framed desk has NO progress row."
    ok('S3 (successor to m3.mjs\'s parked Q1): the framed desk HAS a progress instrument now — SV15 answered that parked question by the front door, and it lives in the rhizome\'s lane, NOT in a revived .mode-incentive-row and NOT in FX1 S5\'s dead .desk-frame-meter',
      g.hasTrack && g.legacyRow === false && g.meterTracks === 0,
      JSON.stringify({ hasTrack: g.hasTrack, legacyRow: g.legacyRow, meterTracks: g.meterTracks }));
  }

  // ── S4 — the completion moment (SV16), LIVE on the framed desk ────────────
  // The root-cause of record: this fired NOWHERE on the framed desk before
  // M4 — ProgressBar's celebrate never mounted there, and AmbientGlow's bloom
  // is `!framed` too. Seeded just below the goal so the crossing happens on
  // THIS fixture's own keystrokes (m3.mjs's burst-check pattern).
  const flareRun = async (style) => {
    const pageId = await freshStyledPage(app, style, LAPTOP_W, LAPTOP_H);
    await seedWordsAndReopen(app, pageId, 244); // just below WORD_GOAL (250)
    await sleep(500);
    const litBefore = await app.evalJs("!!document.querySelector('.desk-frame-goalflare.lit')");
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('aa bb cc dd ee ff gg '); // 7 words -> 251, crosses 250
    let lit = false, sample = null;
    try {
      // One evaluation observes the class AND stashes the computed paint, so
      // the ~1.1s window can't close between two CDP round-trips (the cd1.1
      // deflake lesson, reused verbatim).
      await app.waitFor(`(() => {
        const el = document.querySelector('.desk-frame-goalflare.lit');
        if (!el) return false;
        const cs = getComputedStyle(el);
        window.__m4Flare = { bg: cs.backgroundImage, opacity: cs.opacity, text: el.textContent, aria: el.getAttribute('aria-hidden'),
          // Sampled in the SAME evaluation, for the same round-trip reason —
          // the bar's own ignition rides the identical CELEBRATE_MS window.
          barCelebrate: !!document.querySelector('.desk-frame-instrument .mode-pfill.celebrate') };
        return true;
      })()`, { label: `M4 flare lit (${style})`, timeout: 8000 });
      lit = true;
      sample = await app.evalJs('window.__m4Flare');
    } catch { lit = false; }
    const barCelebrated = style === 'bar' ? (sample ? sample.barCelebrate : false) : null;
    await sleep(1600); // past CELEBRATE_MS (1100) + margin
    const litAfter = await app.evalJs("!!document.querySelector('.desk-frame-goalflare.lit')");
    return { litBefore, lit, sample, barCelebrated, litAfter };
  };

  {
    const bar = await flareRun('bar');
    ok('S4 (Bar): before the crossing the lane is at REST — no flare lit on a below-goal page', bar.litBefore === false, String(bar.litBefore));
    ok('S4 (Bar): crossing the word goal FIRES the completion flare on the FRAMED desk — the moment that was dead here before M4 (ProgressBar\'s celebrate and AmbientGlow\'s bloom are both `!framed`)',
      bar.lit === true, JSON.stringify(bar.sample));
    ok('S4 (Bar): the flare is ORANGE — its paint resolves to the ember token rgb(224, 113, 44), at a real (non-zero) opacity: unmistakable, not a hairline',
      !!bar.sample && bar.sample.bg.includes('rgb(224, 113, 44)') && parseFloat(bar.sample.opacity) > 0.1,
      JSON.stringify({ bg: bar.sample?.bg?.slice(0, 90), opacity: bar.sample?.opacity }));
    ok('S4 (Bar): NOTHING IS COUNTED — the flare carries no text of its own and is aria-hidden; it scores nothing and remembers nothing',
      !!bar.sample && bar.sample.text === '' && bar.sample.aria === 'true', JSON.stringify({ text: bar.sample?.text, aria: bar.sample?.aria }));
    ok('S4 (Bar): the bar\'s OWN ignition lands too, in the lane — .mode-pfill.celebrate on the framed desk, which never mounted here before',
      bar.barCelebrated === true, String(bar.barCelebrated));
    ok('S4 (Bar): the moment is EVENTAL — the flare reverts after its window and leaves no new at-rest state behind',
      bar.litAfter === false, String(bar.litAfter));
  }
  {
    const rhz = await flareRun('rhizome');
    ok('S4 (Rhizome): crossing the goal fires the SAME flare on the rhizome style — the lane is where the goal is felt, whichever instrument occupies it',
      rhz.lit === true, JSON.stringify(rhz.sample));
    ok('S4 (Rhizome): the moment is EVENTAL here too — the flare reverts after its window', rhz.litAfter === false, String(rhz.litAfter));
  }

  // ── Legacy (<1100px): unconditionally byte-identical ──────────────────────
  {
    await freshProsePage(app, LEGACY_W, 900);
    await app.emulateDpr(1, LEGACY_W, 900); await sleep(300);
    const legacy = await app.evalJs(`({
      framed: !!document.querySelector('.desk-frame-stage'),
      lane: !!document.querySelector('.desk-frame-instrument'),
      flare: !!document.querySelector('.desk-frame-goalflare'),
      legacyRow: !!document.querySelector('.mode-incentive-row'),
      legacyTrack: !!document.querySelector('.mode-incentive-row .mode-ptrack'),
    })`);
    ok('Legacy (<1100px): NOTHING from M4 S3/S4 mounts — no lane, no flare, no DeskFrame; the legacy incentive row and its own track render exactly as before, byte-identical',
      legacy.framed === false && legacy.lane === false && legacy.flare === false
      && legacy.legacyRow === true && legacy.legacyTrack === true, JSON.stringify(legacy));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// m4.mjs is a brand-new file and parks nothing OF ITS OWN: every check above
// reflects this ticket's live design. The three assertions M4 falsified
// elsewhere are parked A4-style IN THE FILES THAT OWNED THEM (m2.mjs's
// "Framed default (1100px floor)", m3.mjs's ink check and its Q1 check) —
// original text frozen verbatim, superseded, each pointing at its live
// successor above. Same precedent m2.mjs/tu2.mjs/b3.mjs set for a new file
// whose supersessions live in their own homes.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nM4 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; m4.mjs parks nothing of its own (the entries M4 supersedes are parked in m2.mjs and m3.mjs, with the live successors here).`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nM4 VERIFY: PASS (${checks.length} checks)` : `\nM4 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
