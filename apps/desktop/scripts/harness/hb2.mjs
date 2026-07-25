// HB2-lite — the Landing (docs/wrizo-alpha/p1-wave.md §HB2-lite; build map in
// docs/wrizo-alpha/hb2-lite-scout-notes.md). Committed CDP scenario. Fixtures adopted
// from hb1.mjs (freshArrival) — the "don't re-derive fixtures" law.
//
// SV11 landing RULE, ruled 2026-07-25: HB2-lite fixes where Arrival's doors LEAD
// (destinations only). It does NOT redesign the chooser — that is SV12b / HB2-full
// (the Resume rename, the Workshop door, the cream squares). "You cannot redesign a
// chooser you're deleting." So this file proves the four destination cases + the theme
// read; it does not assert any auto-landing (there is none — Arrival stays the front
// door, HB1's shipped design).
//   1. Write            -> a fresh page in Free Write, typewriter on, never a journal surface.
//   2. Open + resume     -> the last surface (here a Board) opens as that Board.
//   3. Open + no resume  -> Free Write, typewriter on (the endorsed degradation; the
//                           Arrival fallback re-pointed off the Journal Board — b1.mjs S5(c)'s successor).
//   4. Open + stale journal pointer -> THE Page via FX14's redirect, no journal chrome
//                           (Nick's V2 sighting): a resumed legacy journal-origin entry (4a)
//                           AND a direct /journal/:id navigation (4b).
//   S2. The loading path reads the persisted theme key (initTheme, main.tsx) — data-theme
//       equals localStorage 'wrizo-theme' at boot; nothing visual changes.
// Run: node apps/desktop/scripts/harness/hb2.mjs  (from apps/desktop, dist-web built).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// hb1.mjs's freshArrival, copied verbatim (a local const there — copy, don't import;
// hb1's checks are frozen). anon:false => WS_ANON=0 => authed (Open resumes). The
// sleep(200) is hb1's own first-paint deflake for clicking a door on the first mount.
const freshArrival = async (app, { anon = false } = {}) => {
  process.env.WS_ANON = anon ? '1' : '0';
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival before fixture' });
  await app.emulateDpr(1, 1400, 900);
  await sleep(200);
};

// Seed localStorage while on Arrival (no flush-on-unmount surface mounted — the
// seeding law), then reload so the hook/store reads it at mount.
const seedThenReload = async (app, mutate) => {
  await app.evalJs(mutate);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival after seed' });
  await sleep(150);
};

await withHarness(async (app) => {
  // ── Case 1 — Write -> Free Write, typewriter on, never a journal surface ────
  {
    await freshArrival(app, { anon: false });
    await app.click('Write');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Write -> THE Page' });
    await sleep(300);
    const w = await app.evalJs(`({
      hash: location.hash,
      editor: !!document.querySelector('.forward-only-editor'),
      journalChrome: !!document.querySelector('.entry-edit'),
      mode: document.querySelector('.desk-mode-tab.active')?.textContent,
      tw: JSON.parse(localStorage.getItem('wrizo-writing-settings')||'{}').typewriter,
      twLive: document.querySelector('.mode-scroll')?.dataset.typewriter,
      origin: (() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]'); const e = es.find(x=>!x.deletedAt); return e && e.origin; })(),
    })`);
    ok('S1 case 1: Write lands on a fresh page in THE Page (/page/:id, .forward-only-editor), never a journal surface (.entry-edit absent, origin loose)',
      /^#\/page\/[^/]+$/.test(w.hash) && w.editor === true && w.journalChrome === false && w.origin === 'loose', JSON.stringify(w));
    ok('S1 case 1: Write lands in Free Write with Typewriter on (mode tab + store + live data-typewriter)',
      w.mode === 'Free Write' && w.tw === true && w.twLive === 'true', JSON.stringify(w));
  }

  // ── Case 2 — Open + a valid last surface (a Board) -> that Board ────────────
  // (Page-resume is already covered by hb1.mjs F2/S5; this adds the Board leg S1 names.)
  {
    await freshArrival(app, { anon: false });
    await seedThenReload(app, `(() => {
      const now = new Date().toISOString();
      const older = new Date(Date.now() - 60000).toISOString();
      const entries = [
        { id: 'hb2-page', text: 'An older page', projectId: null, origin: 'loose', source: 'page', createdAt: older, updatedAt: older },
        { id: 'hb2-board', text: 'The latest board', pageType: 'board', source: 'page', boxes: [{ id: 'x', kind: 'text', x: 0.2, y: 0.2, w: 0.2, h: 0.15, z: 1, text: 'b' }], projectId: null, createdAt: now, updatedAt: now },
      ];
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    const resumeTarget = await app.evalJs("window.wrizoResume ? window.wrizoResume().route : null");
    await app.click('Open');
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Open resumes the last Board' });
    await sleep(200);
    const r = await app.evalJs("({ hash: location.hash, board: !!document.querySelector('.board-canvas'), journalChrome: !!document.querySelector('.entry-edit') })");
    ok('S1 case 2: Open with a valid last surface resumes THAT surface — the most-recent Board opens as a Board (/page/:boardId, .board-canvas), never a journal surface',
      r.hash === '#/page/hb2-board' && r.board === true && r.journalChrome === false && resumeTarget === '/page/hb2-board', JSON.stringify({ r, resumeTarget }));
  }

  // ── Case 3 — Open + no resume -> Free Write, typewriter on (the fix) ────────
  {
    await freshArrival(app, { anon: false });
    const nothing = await app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').length === 0) && (JSON.parse(localStorage.getItem('writer-studio-projects')||'[]').length === 0) && (window.wrizoResume ? window.wrizoResume() === null : true)");
    ok('S1 case 3 precondition: genuinely nothing to resume (zero entries, zero projects, resume target null)', nothing === true, String(nothing));
    await app.click('Open');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Open no-resume -> Free Write' });
    await sleep(300);
    const o = await app.evalJs(`({
      hash: location.hash,
      editor: !!document.querySelector('.forward-only-editor'),
      board: !!document.querySelector('.board-canvas'),
      journalChrome: !!document.querySelector('.entry-edit'),
      mode: document.querySelector('.desk-mode-tab.active')?.textContent,
      tw: JSON.parse(localStorage.getItem('wrizo-writing-settings')||'{}').typewriter,
      twLive: document.querySelector('.mode-scroll')?.dataset.typewriter,
    })`);
    ok('S1 case 3 (b1.mjs S5(c) successor): Open with NO last surface degrades to a fresh Free Write page — /page/:id, .forward-only-editor, typewriter on, and NEVER the Journal Board (.board-canvas absent) or a journal surface (.entry-edit absent)',
      /^#\/page\/[^/]+$/.test(o.hash) && o.editor === true && o.board === false && o.journalChrome === false && o.mode === 'Free Write' && o.tw === true && o.twLive === 'true', JSON.stringify(o));
  }

  // ── Case 4 — Open + a stale legacy journal pointer -> Page via FX14 redirect ─
  {
    await freshArrival(app, { anon: false });
    await seedThenReload(app, `(() => {
      const now = new Date().toISOString();
      // A legacy journal-origin entry — the pre-FX14 shape that used to open the retired
      // JournalEntry surface at /journal/:id.
      const entries = [{ id: 'hb2-legacy-journal', text: 'A legacy journal entry', projectId: null, origin: 'journal', source: 'page', createdAt: now, updatedAt: now }];
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    // 4a — resuming a legacy journal-origin entry lands on THE Page (routeForEntry),
    // never the retired journal surface.
    const resumeRoute = await app.evalJs("window.wrizoResume ? window.wrizoResume().route : null");
    await app.click('Open');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Open resumes legacy journal entry -> THE Page' });
    await sleep(200);
    const a = await app.evalJs("({ hash: location.hash, editor: !!document.querySelector('.forward-only-editor'), journalChrome: !!document.querySelector('.entry-edit') })");
    ok('S1 case 4a: resuming a stale legacy journal-origin entry lands on THE Page (/page/:id via routeForEntry), NOT #/journal, no journal chrome (.entry-edit absent)',
      a.hash === '#/page/hb2-legacy-journal' && a.editor === true && a.journalChrome === false && resumeRoute === '/page/hb2-legacy-journal', JSON.stringify({ a, resumeRoute }));
    // 4b — a stale /journal/:id ROUTE (bookmark / pre-FX14 muscle memory) bounces
    // through FX14's JournalIdRedirect to /page/:id, no journal chrome anywhere. Start
    // from '/' so the redirect is a real transition (not already on the target hash).
    await app.evalJs("location.hash = '#/'");
    await sleep(150);
    await app.evalJs("location.hash = '#/journal/hb2-legacy-journal'");
    await app.waitFor("location.hash === '#/page/hb2-legacy-journal' && !!document.querySelector('.forward-only-editor')", { label: 'stale /journal/:id redirects to THE Page' });
    await sleep(200);
    const b = await app.evalJs("({ hash: location.hash, editor: !!document.querySelector('.forward-only-editor'), journalChrome: !!document.querySelector('.entry-edit') })");
    ok('S1 case 4b (the V2 sighting): a stale /journal/:id pointer lands on THE Page via FX14 redirect (#/page/:id), the Page interface renders, no journal chrome anywhere',
      b.hash === '#/page/hb2-legacy-journal' && b.editor === true && b.journalChrome === false, JSON.stringify(b));
  }

  // ── S2 — the loading path reads the persisted theme key; nothing visual changes ─
  {
    await freshArrival(app, { anon: false });
    await seedThenReload(app, "localStorage.setItem('wrizo-theme', 'flux')");
    const t = await app.evalJs(`({
      dataTheme: document.documentElement.getAttribute('data-theme'),
      key: localStorage.getItem('wrizo-theme'),
      seam: window.wrizoTheme ? window.wrizoTheme.get() : null,
      arrival: !!document.querySelector('.wz-arrival'),
      write: !!document.querySelector('.wz-arrival-write'),
      open: !!document.querySelector('.wz-arrival-open'),
    })`);
    ok('S2: the loading path reads the persisted theme key at boot — data-theme on <html> equals localStorage "wrizo-theme" (initTheme, main.tsx), corroborated by the wrizoTheme seam',
      t.dataTheme === 'flux' && t.key === 'flux' && t.seam === 'flux', JSON.stringify(t));
    ok('S2: nothing visual changes — Arrival still renders its same markup (both doors + the surface) under the persisted theme key; reading the key alters no structure',
      t.arrival === true && t.write === true && t.open === true, JSON.stringify(t));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// HB2-lite parks nothing of its OWN in this file — its one A4 park (b1.mjs S5(c)'s
// no-resume outcome, re-pointed off the Journal Board) lives in b1.mjs, verified under
// HARNESS_PARKED=1 by b1.mjs's own run.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nHB2 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; HB2-lite parks nothing of its own (its S5(c) re-point park lives in b1.mjs).`
    : `\nHB2 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nHB2 VERIFY: PASS (${checks.length} checks)` : `\nHB2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
