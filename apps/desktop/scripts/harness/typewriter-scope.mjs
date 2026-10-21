// TYPEWRITER-SCOPE (Fable, ledger Oct 21) — THE REPRO Nick and Fable named:
// opening a new, empty Screenplay page (Arbor's own default seeds its
// Typewriter ON for an empty page) left the shared `typewriter` field
// "on" for the NEXT Draft page's own Ctrl+B gate to read — even though
// that Draft page never asked for Typewriter and its own per-page memory
// says OFF. The fix (store/writingSettings.ts's typewriterForPage, and
// every Draft-context reader it replaces — PageEditor.tsx's
// applyRailFormat/applyLensKey/outline-Tab gates, ModeStage.tsx:194's
// typewriterOn, Sliver.tsx's formatLocked/SliverInstrumentRow toggle) is
// described in docs/plans/typewriter-scope-plan.md, approved as written.
//
// THIS FILE is the LIVE, behavioural half: real pointer presses and a real
// trusted Ctrl+B (app.keyCombo), proving the door, not the shape — the
// SAME division of labour writing-r2.mjs/writing-format-proof.mjs already
// keep for the formatter itself. The shape half (typewriterForPage's own
// resolution, the mirror-write actually gone, each reader actually
// migrated) is scripts/harness/typewriter-scope-source.mjs — browserless,
// with its own mutants, run directly by this lane without a box turn.
//
// Evidence this is red on main: docs/reviews/page-readiness-survey.md item
// #3 (the confirmed, Nick-reported repro) and docs/plans/typewriter-scope-
// plan.md (the architecture trace explaining WHY). NOT YET RUN — authored
// browserless, confirmed against this fix's own source only; the live
// red-on-main / green-on-fix pair is this ticket's own first box turn.
//
// Run: node scripts/harness/typewriter-scope.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  // plateau (Arbor) is the app's own default theme and THEME_CONFIG's own
  // typewriterDefault: true — the exact ground this repro depends on. Named
  // explicitly (not relied on as "whatever's left over") so a later default
  // change fails this file loudly instead of silently stopping testing the
  // claim it exists for.
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme','plateau')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

const centre = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; })()`);
const realClick = async (app, pt) => { await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); await sleep(250); };
const boldCount = (app) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); return ed ? ed.querySelectorAll('.md-bold').length : null; })()`);

const openDraftWords = async (app) => {
  await app.evalJs("location.hash = '#/page/tws-draft'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'Draft page open' });
  await sleep(500);
  const pt = await centre(app, ED);
  if (!pt) throw new Error('typewriter-scope: Draft editor has no measurable rect');
  await realClick(app, pt);
  await app.keyCombo('a'); await sleep(200);
};

await withHarness(async (app) => {
  await freshDesk(app);
  // The Draft page the writer is already working in: non-empty, never
  // explicitly toggled — enterPageTypewriter's own rule (non-empty, no
  // saved value -> OFF) resolves and SAVES it OFF the instant it is first
  // opened, below.
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tws-draft', text: 'Some existing words already here.', pageType: 'manuscript', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  // A brand-new, EMPTY Screenplay page — established seeding shape (ab1.mjs/
  // ab2.mjs/cd1.mjs/cd2.mjs/fx1.mjs: a single scene, empty heading, no body).
  // Arbor's own default seeds ITS OWN Typewriter ON the instant it opens.
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tws-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: 'tws-heading', heading: { id: 'tws-heading', t: 'scene', text: '' }, body: [] }] }, origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);

  // S1 — BASELINE: the Draft page's own Ctrl+B works before any Screenplay
  // page has ever been opened this session.
  await openDraftWords(app);
  await app.keyCombo('b'); await sleep(300);
  let d = await boldCount(app);
  ok('S1 baseline: Ctrl+B on the Draft page works BEFORE any Screenplay page has ever been opened', d != null && d > 0, String(d));
  await app.keyCombo('b'); await sleep(300); // undo, back to a clean baseline for S3's own count

  // S2 — the premise this bug depends on: Arbor's default genuinely seeds
  // the NEW Screenplay page's own Typewriter on. If this ever reads false,
  // S3 below proves nothing about the bug it exists to catch.
  await app.evalJs("location.hash = '#/page/tws-script'");
  await app.waitFor("!!document.querySelector('.script-sequence, .wz-ink-sheet')", { label: 'Screenplay page open' });
  await sleep(500);
  // The toggle icon sits in the sliver's own always-visible instruments-row
  // (not behind the foot's own "..." popout), but the sliver drawer itself
  // still has to be open to mount it at all — same grip-click every other
  // harness in this file family already uses.
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(400);
  const scriptTypewriterOn = await app.evalJs("document.querySelector('[data-mode-toggle=\"typewriter\"]')?.getAttribute('aria-pressed')");
  ok('S2 (premise): the new, empty Screenplay page opens with ITS OWN Typewriter on (Arbor default) — the state this bug depends on existing at all', scriptTypewriterOn === 'true', String(scriptTypewriterOn));

  // S3 — THE REPRO. Back to the Draft page: Ctrl+B must STILL work. This
  // page never asked for Typewriter; its own per-page memory (resolved and
  // saved in S1) says OFF — it must never inherit the Screenplay page's.
  await openDraftWords(app);
  await app.keyCombo('b'); await sleep(300);
  d = await boldCount(app);
  ok('S3 THE REPRO: after opening a new empty Screenplay page (Typewriter on there), the ORIGINAL Draft page\'s own Ctrl+B still works — its own per-page memory, never a shared mirror a different page\'s open could leave behind',
    d != null && d > 0, String(d));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nTYPEWRITER-SCOPE VERIFY: PASS (${checks.length} checks)` : `\nTYPEWRITER-SCOPE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
