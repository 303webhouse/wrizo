// ITEM 158 — TAB INDENTS. Nick: on the writing surface Tab moved BROWSER FOCUS
// instead of indenting. (Enter was already right.)
// Run: node scripts/harness/item158.mjs   (from apps/desktop, dist-web built)
//
// S0 FOUND THE INDENT ALREADY DEFINED, and this file tests that definition
// rather than a new one: `draftFormat.ts` says "Indent is a leading tab" — one
// leading \t on every line of the paragraph, levels counted in tabs. Tab runs
// the SAME action the rail's arrows run, so the checks read the STORED TEXT,
// which is where the indent lives, not a CSS offset.
//
// THREE MODES, THREE LAWS, because Free Write is forward-only:
//   DRAFT / REVISE — Tab indents, Shift+Tab outdents.
//   FREE WRITE     — Tab indents an EMPTY line (an insertion at the caret, which
//                    the forward law allows) and does NOTHING on a written one
//                    (a leading tab there lands BEHIND the caret). Shift+Tab
//                    does nothing at all: an outdent is a deletion.
// In every mode, on every key, FOCUS MUST NOT LEAVE THE EDITOR — that is the
// founder's actual report, and it is asserted separately from the indent so a
// build that indents but still surrenders focus cannot pass.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGE = 'i158-page';
const PARA = 'The paragraph that should indent.';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

const seed = async (app, text) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id: PAGE, text, createdAt: '2026-06-02T00:00:00.000Z', origin: 'journal',
  })})`);
  for (let i = 0; i < 60; i += 1) {
    if (await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => e.id === '${PAGE}')`)) return true;
    await sleep(100);
  }
  return false;
};

const openPage = async (app) => {
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${PAGE}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page framed' });
  await sleep(600);
};

// The stored text is the subject: the indent is a character in `entry.text`,
// not a margin. Read after the debounced flush (the settled-state law).
const stored = (app) => app.evalJs(`(() => {
  const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === '${PAGE}');
  return e ? e.text : null;
})()`);

const focusInEditor = (app) => app.evalJs(`(() => {
  const el = document.querySelector('.forward-only-editor');
  if (!el) return false;
  return document.activeElement === el || el.contains(document.activeElement);
})()`);

const caretTo = async (app, offset) => {
  await app.evalJs(`(() => {
    const el = document.querySelector('.forward-only-editor');
    if (!el) return false;
    el.focus();
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let seen = 0, node = null, rest = ${offset};
    while ((node = w.nextNode())) {
      if (seen + node.data.length >= ${offset}) { rest = ${offset} - seen; break; }
      seen += node.data.length;
    }
    const r = document.createRange();
    if (node) { r.setStart(node, Math.min(rest, node.data.length)); } else { r.selectNodeContents(el); r.collapse(false); }
    r.collapse(true);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    return true;
  })()`);
  await sleep(200);
};

const toMode = async (app, label) => {
  await app.click(label);
  await sleep(600);
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 / S2 — DRAFT: Tab indents the paragraph, Shift+Tab takes it back.
  // ==========================================================================
  await freshDesk(app);
  ok('setup: the page is seeded through the seam and landed', await seed(app, PARA));
  await openPage(app);
  await toMode(app, 'Draft');
  await caretTo(app, 4);                       // inside the paragraph, not at its edge
  await app.key('Tab');
  await sleep(900);
  const afterTab = await stored(app);
  ok('S1 THE TICKET: Tab INDENTS the paragraph in Draft — a leading tab in the STORED text, the definition draftFormat.ts already carried ("Indent is a leading tab")',
    afterTab === `\t${PARA}`, JSON.stringify({ stored: afterTab }));
  ok('S1: and focus never leaves the editor — the founder’s actual report was that Tab moved BROWSER FOCUS, so this is asserted apart from the indent',
    (await focusInEditor(app)) === true);

  await app.key('Tab', { shift: true });
  await sleep(900);
  const afterShift = await stored(app);
  ok('S2: Shift+Tab OUTDENTS it again, floored at zero — the way back is the keystroke, not only Undo',
    afterShift === PARA, JSON.stringify({ stored: afterShift }));

  await app.key('Tab', { shift: true });
  await sleep(700);
  ok('S2: a second Shift+Tab on an unindented paragraph is a quiet no-op, never a negative indent',
    (await stored(app)) === PARA, JSON.stringify({ stored: await stored(app) }));

  // ==========================================================================
  // S3 — REVISE: the same keystroke, the same action. Revise is freely
  // editable, so an indent there is as lawful as in Draft.
  // ==========================================================================
  await toMode(app, 'Revise');
  await caretTo(app, 4);
  await app.key('Tab');
  await sleep(900);
  ok('S3: Tab indents in REVISE too — both editable modes answer the key, and through the same formatter, so a keystroke and a rail click cannot drift apart',
    (await stored(app)) === `\t${PARA}`, JSON.stringify({ stored: await stored(app) }));
  ok('S3: and focus stays in the editor in Revise', (await focusInEditor(app)) === true);

  // ==========================================================================
  // S4 — FREE WRITE, the forward-only law. A leading tab on a WRITTEN line is
  // an insertion behind the caret, which the forward law forbids; on a BLANK
  // line it is an insertion at the caret, which is the typewriter's own tab.
  // ==========================================================================
  await freshDesk(app);
  ok('setup: a fresh page for Free Write', await seed(app, PARA));
  await openPage(app);                          // journal-origin opens in Free Write
  const mode = await app.evalJs("(document.querySelector('.mode-strip .active, .desk-frame-modestrip .active') || {}).textContent || null");
  await caretTo(app, PARA.length);              // end of the written line
  await app.key('Tab');
  await sleep(800);
  ok('S4: in Free Write, Tab on a WRITTEN line changes nothing — a leading tab there would land behind the caret, and the forward law forbids editing behind it',
    (await stored(app)) === PARA, JSON.stringify({ stored: await stored(app), mode }));
  ok('S4 THE REPORT, in the mode a page opens in: focus STILL does not leave the editor, even though the key deliberately does nothing',
    (await focusInEditor(app)) === true);

  // A blank line: type a real Enter, then Tab.
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.key('Enter');
  await sleep(300);
  await app.key('Tab');
  await sleep(900);
  const afterBlank = await stored(app);
  ok('S4: but on a BLANK line Tab DOES indent — an insertion at the caret, the paragraph tab a writer reaches for before starting a new paragraph',
    typeof afterBlank === 'string' && afterBlank.startsWith(PARA) && afterBlank.includes('\t'),
    JSON.stringify({ stored: afterBlank }));

  await app.key('Tab', { shift: true });
  await sleep(800);
  ok('S4: Shift+Tab in Free Write is inert — an outdent is a deletion, and nothing deletes behind the caret on this surface',
    (await stored(app)) === afterBlank, JSON.stringify({ before: afterBlank, after: await stored(app) }));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM158 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM158 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
