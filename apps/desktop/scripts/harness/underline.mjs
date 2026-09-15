// UNDERLINE GETS A RENDERER — item 79's family (Nick's ship word: "the bold,
// italic, and underlining buttons"). Ruled: build underline only, page and card
// together; the live-page marker collapse and the stuck active-state report and
// queue as the next window's first job.
// Run: node scripts/harness/underline.mjs   (from apps/desktop, dist-web built)
//
// THE DEFECT: `applyFormat('underline')` writes `__word__` (draftFormat.ts's
// FORMAT_MARK.underline) and BOTH the page rail and the card dock have shipped
// a U button doing exactly that — while draftDecoration.ts contained the string
// "underline" ZERO times and index.css had no `.md-underline`. The UI and the
// renderer disagreed, so the writer got literal underscores and no styling.
//
// WHAT THIS FIX DOES NOT REACH, said plainly here because the harness is where
// a future reader will look: FREE WRITE DOES NOT DECORATE AT ALL. The
// forward-only surface renders raw `.fo-run` spans (ForwardOnlyEditor's
// `freeEdit = mode === 'drafting' || mode === 'revise'` fork), so no decoration
// runs there — which is why markers appear at FULL INK on Free Write rather
// than at Draft's dimmed `.md-mark{opacity:.38}`. Underline therefore changes
// nothing on the surface Nick was using. That surface's styling is a design
// question, not this ticket's.
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

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the CSS rule exists at all. (It did not; that was half the defect.)
  // ==========================================================================
  await freshDesk(app);
  const rule = await app.evalJs(`(() => {
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const r of rules || []) if (r.selectorText === '.md-underline') return r.cssText;
    }
    return 'ABSENT';
  })()`);
  ok('S1: `.md-underline` exists in the shipped stylesheet — before this ticket the selector was ABSENT, so even a correctly emitted span would have rendered as plain text',
    rule !== 'ABSENT' && /underline/.test(rule), String(rule));

  // ==========================================================================
  // S2 — THE CARD REGISTER. A resting card collapses its markers, so underline
  // must be STYLED with its `__` marks hidden, exactly like bold and italic.
  // ==========================================================================
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'u-board', text: 'Underline board', pageType: 'board', createdAt: now, origin: null,
      boxes: [{ id: 'u-card', kind: 'text', x: 0.06, y: 0.06, w: 0.5, h: 0.14, z: 1,
                text: '__under__ and **bold** and *slant*' }] });
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/u-board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(700);

  const card = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="u-card"] .board-text');
    if (!el) return { missing: true };
    const u = el.querySelector('.md-underline');
    const marks = u ? [...u.querySelectorAll('.md-mark')] : [];
    return {
      missing: false,
      styled: !!u,
      decoration: u ? getComputedStyle(u).textDecorationLine : null,
      innerWord: u ? u.textContent : null,
      marksHidden: marks.length === 2 && marks.every(m => m.classList.contains('md-mark-hidden')),
      alsoBold: !!el.querySelector('.md-bold'),
      alsoItalic: !!el.querySelector('.md-italic'),
      textContent: el.textContent,
    };
  })()`);

  ok('S2 (card): an `__underlined__` run on a resting card is STYLED — the third button finally has a renderer, on the same surface the other two already had one',
    card.styled && /underline/.test(String(card.decoration)), JSON.stringify(card));

  ok('S2 (card): its `__` marks COLLAPSE like every other marker in this register — the writer sees words, not syntax',
    card.marksHidden, JSON.stringify(card));

  ok('S2 (card): bold and italic still render alongside it — adding a third marker to the shared inline pass did not disturb the two that worked',
    card.alsoBold && card.alsoItalic, JSON.stringify(card));

  // THE STORAGE INVARIANT, again, because underline is the marker most likely
  // to appear inside ordinary prose (file_names, snake_case, mid-word emphasis)
  // and the pass must never eat characters it did not put there.
  ok('S2 (card) STORAGE INVARIANT: the card\'s textContent still carries every markdown character byte-for-byte, underscores included',
    card.textContent === '__under__ and **bold** and *slant*', JSON.stringify({ got: card.textContent }));

  // ==========================================================================
  // S3 — A SINGLE UNDERSCORE IS NOT A MARKER. The convention's underline is the
  // PAIR (`__`), so ordinary prose keeps its underscores. This is the check
  // that would catch a pass that started eating snake_case.
  // ==========================================================================
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'u-board2', text: 'Prose board', pageType: 'board', createdAt: now, origin: null,
      boxes: [{ id: 'u-card2', kind: 'text', x: 0.06, y: 0.06, w: 0.5, h: 0.14, z: 1,
                text: 'the file_name and snake_case survive' }] });
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/u-board2'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'prose board' });
  await sleep(700);

  const prose = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="u-card2"] .board-text');
    return { styled: !!el.querySelector('.md-underline'), textContent: el.textContent };
  })()`);
  ok('S3: a SINGLE underscore is not a marker — `file_name` and `snake_case` are left entirely alone, unstyled and unaltered (the convention\'s underline is the PAIR)',
    prose.styled === false && prose.textContent === 'the file_name and snake_case survive',
    JSON.stringify(prose));

  // ==========================================================================
  // S4 — AN UNPAIRED `__` IS PLAIN TEXT, not a run that swallows the rest of
  // the line. The bold/italic passes already behave this way; underline joins
  // them rather than inventing its own failure mode.
  // ==========================================================================
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'u-board3', text: 'Unpaired board', pageType: 'board', createdAt: now, origin: null,
      boxes: [{ id: 'u-card3', kind: 'text', x: 0.06, y: 0.06, w: 0.5, h: 0.14, z: 1,
                text: 'an __unclosed run keeps going' }] });
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/u-board3'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'unpaired board' });
  await sleep(700);

  const unpaired = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="u-card3"] .board-text');
    return { styled: !!el.querySelector('.md-underline'), textContent: el.textContent };
  })()`);
  ok('S4: an UNPAIRED `__` renders as plain text and loses nothing — it does not open a run that swallows the rest of the line',
    unpaired.styled === false && unpaired.textContent === 'an __unclosed run keeps going',
    JSON.stringify(unpaired));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nUNDERLINE VERIFY: PASS (${checks.length} checks)`
  : `\nUNDERLINE VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
