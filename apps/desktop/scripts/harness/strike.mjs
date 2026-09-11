// STRIKETHROUGH — item 122's second piece (Nick's ruling, 2026-09-06:
// strikethrough joins Draft's styling row). Named as the successor in
// ab2.mjs's generation-5 park, which supersedes the ruled roster count from
// TWELVE to THIRTEEN.
// Run: node scripts/harness/strike.mjs   (from apps/desktop, dist-web built)
//
// WHY THE CHECKS ARE SHAPED THIS WAY. Underline's own harness (underline.mjs)
// learned that the risky half of adding a marker is not whether the new mark
// renders — that is easy and obvious — but whether the SHARED inline pass still
// leaves ordinary prose alone. Underline had to defend `snake_case`. `~~` is
// gentler: a single tilde carries no role in prose, so it needs no equivalent
// defence. But the two structural hazards it DOES share are checked here:
// an unpaired mark must not swallow the line, and the marks must never leave
// the stored text.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

const cardBoard = async (app, id, text) => {
  await freshDesk(app);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({
      id: ${JSON.stringify(id)}, text: 'strike board', createdAt: now,
      origin: 'loose', pageType: 'board', projectId: null,
      boxes: [{ id: 'sc', kind: 'text', x: 0.06, y: 0.06, w: 0.5, h: 0.14, z: 1, text: ${JSON.stringify(text)} }],
    });
  })()`);
  // Seeded THROUGH THE SEAM (item 129): a raw localStorage write would be
  // serialised over by the next product write, and the debounced flush must
  // land before the reload hydrates the cache from storage.
  await app.evalJs('null');
  for (let i = 0; i < 40; i += 1) {
    const there = await app.evalJs(
      `JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => e.id === ${JSON.stringify(id)})`);
    if (there) break;
    await sleep(100);
  }
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(id)}`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(700);
};

const readCard = (app) => app.evalJs(`(() => {
  const el = document.querySelector('[data-box-id="sc"] .board-text');
  if (!el) return { missing: true };
  const s = el.querySelector('.md-strike');
  const marks = s ? [...s.querySelectorAll('.md-mark')] : [];
  return {
    missing: false,
    styled: !!s,
    decoration: s ? getComputedStyle(s).textDecorationLine : null,
    marksHidden: marks.length === 2 && marks.every(m => m.classList.contains('md-mark-hidden')),
    alsoBold: !!el.querySelector('.md-bold'),
    alsoUnderline: !!el.querySelector('.md-underline'),
    textContent: el.textContent,
  };
})()`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the CSS mark exists at all.
  // ==========================================================================
  await freshDesk(app);
  const rule = await app.evalJs(`(() => {
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const r of rules || []) if (r.selectorText === '.md-strike') return r.cssText;
    }
    return 'ABSENT';
  })()`);
  ok('S1: `.md-strike` exists in the shipped stylesheet — a renderer case with no rule behind it would emit correct spans that render as plain text, which is exactly how underline shipped broken',
    rule !== 'ABSENT' && /line-through/.test(rule), String(rule));

  // ==========================================================================
  // S2 — the mark renders, its marks collapse, and it leaves prose alone.
  // ==========================================================================
  const RAW = '~~struck~~ and **bold** and __under__';
  await cardBoard(app, 'strike-board', RAW);
  const card = await readCard(app);

  ok('S2: a `~~struck~~` run renders with line-through — the fourth mark has a renderer, on the same shared pass as the other three',
    card.styled && /line-through/.test(String(card.decoration)), JSON.stringify(card));

  ok('S2: its `~~` marks COLLAPSE in the reveal-adjacent register, like every other marker — the writer sees the struck words, not the syntax',
    card.marksHidden, JSON.stringify(card));

  ok('S2: bold and underline still render alongside it — a fourth branch in the shared inline pass did not disturb the three that already worked',
    card.alsoBold && card.alsoUnderline, JSON.stringify(card));

  ok('S2 STORAGE INVARIANT: every markdown character is still in textContent, byte-for-byte — the marks are collapsed for the eye, never removed from the writer\'s words',
    card.textContent === RAW, JSON.stringify({ got: card.textContent, want: RAW }));

  // ==========================================================================
  // S3 — THE STRUCTURAL HAZARDS the shared pass can introduce.
  // ==========================================================================
  await cardBoard(app, 'strike-unpaired', 'an ~~unclosed run keeps going');
  const unpaired = await readCard(app);
  ok('S3: an UNPAIRED `~~` renders as plain text and loses nothing — it does not open a run that swallows the rest of the line (the failure mode every mark in this pass has to be defended against individually)',
    unpaired.styled === false && unpaired.textContent === 'an ~~unclosed run keeps going',
    JSON.stringify(unpaired));

  await cardBoard(app, 'strike-single', 'approx ~5 minutes, ~ish');
  const single = await readCard(app);
  ok('S3: a SINGLE tilde is not a marker — ordinary prose keeps its tildes untouched (the convention\'s strike is the PAIR, exactly as underline\'s is `__` and not `_`)',
    single.styled === false && single.textContent === 'approx ~5 minutes, ~ish',
    JSON.stringify(single));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nSTRIKE VERIFY: PASS (${checks.length} checks)`
  : `\nSTRIKE VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
