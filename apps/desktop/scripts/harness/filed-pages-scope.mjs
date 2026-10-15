// FILED-PAGES-SCOPE (Nick, Oct 13, via Fable) — "Connect Pages" (Flux "Link
// Docs") must also list Pages on the Shelf and in the Journal, not only
// filed Pages. Read-only investigation (reported back, no product change):
// ExistingPagePicker.tsx's own candidate query is
//   getJournalEntries().filter(e => e.id !== boardId
//     && getSystemKind(e) === undefined
//     && !getBoardsPinning(e.id).some(b => b.id === boardId))
// - getJournalEntries() itself only filters !e.deletedAt, with no
// projectId/origin/shelved restriction anywhere, and getSystemKind only
// excludes the three system BOARDS (Journal/Shelf/Trash's own meta pages),
// never an ordinary page merely homed in one. Traced back to this
// component's own introduction (76c9f301) - never filtered by home, in any
// revision. Fable's own word: "your read stands - no product change."
//
// This is the committed verification scenario proving that reading live,
// per AGENTS.md's "harness scenarios persist" - a filed page, a Shelf page
// and a Journal page are all seeded, and the "Connect Pages" door must
// list all three.
// Run: node scripts/harness/filed-pages-scope.mjs   (from apps/desktop, dist-web freshly built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const click = async (app, p, clickCount = 1) => {
  await mouse(app, 'mouseMoved', p.x, p.y, 0, 0);
  await mouse(app, 'mousePressed', p.x, p.y, clickCount, 1);
  await mouse(app, 'mouseReleased', p.x, p.y, clickCount, 0);
};
const centerOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the seed below still proceeds */ }

  // The three homes Nick's own ask names, plus the board to open the
  // chooser from. Each page's title is distinct and names its own home,
  // so a missing one fails by NAME, not by a blank diff.
  await app.evalJs(`(() => {
    const now = '2026-05-01T00:00:00.000Z';
    const proj = window.wrizoCreateProject('fps-project');
    // FILED - a real project home.
    window.wrizoCreateJournalPage({ id: 'fps-filed', text: 'Filed page (project home)', projectId: proj.id, origin: 'project', createdAt: now });
    // SHELF - belongsOnShelf: origin 'loose', no project, not pinned anywhere (persistence.ts's own predicate).
    // NOTE: the title below deliberately avoids the literal shape "(loose, " -
    // seed-guard.mjs's own UNQUOTED_VALUES regex has no notion of string
    // context, so "Shelf page (loose, unfiled)" as plain text was flagged as
    // an unquoted bare-word seam argument (it isn't one; it's prose).
    window.wrizoCreateJournalPage({ id: 'fps-shelf', text: 'Shelf page (unfiled, no project)', origin: 'loose', projectId: null, createdAt: now });
    // JOURNAL - inJournalView: origin 'journal', no project.
    window.wrizoCreateJournalPage({ id: 'fps-journal', text: 'Journal page (journal-homed)', origin: 'journal', projectId: null, createdAt: now });
    // THE BOARD - an ordinary, non-system board with zero cards, so its
    // own Beginnings row (mode 'open', the default) carries the
    // "Connect Pages" door.
    window.wrizoCreateJournalPage({ id: 'fps-board', text: 'Connect-Pages scope board', pageType: 'board', origin: 'loose', projectId: null, createdAt: now, boxes: [] });
  })()`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/fps-board'");
  await app.waitFor("!!document.querySelector('[data-beginning=\"connectPage\"]')", { label: 'the Connect Pages door' });
  await sleep(300);

  const doorPt = await centerOf(app, '[data-beginning="connectPage"]');
  ok('(premise) the Connect Pages door has a real on-screen target', !!doorPt, JSON.stringify(doorPt));
  if (doorPt) await click(app, doorPt, 1);
  let sheetOpened = false;
  try { await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'the chooser sheet', timeout: 3000 }); sheetOpened = true; } catch { /* recorded below */ }
  ok('(premise) a real click on Connect Pages opens the chooser sheet', sheetOpened);

  if (sheetOpened) {
    await sleep(150);
    const rows = await app.evalJs("[...document.querySelectorAll('.board-sheet .board-dest-row .dz-rowtitle')].map(el => el.textContent)");
    ok('the filed page (project-homed) is listed', rows.includes('Filed page (project home)'), JSON.stringify(rows));
    ok('the Shelf page (unfiled, no project) is ALSO listed - Nick\'s own ask', rows.includes('Shelf page (unfiled, no project)'), JSON.stringify(rows));
    ok('the Journal page (journal-homed) is ALSO listed - Nick\'s own ask', rows.includes('Journal page (journal-homed)'), JSON.stringify(rows));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nFILED-PAGES-SCOPE VERIFY: PASS (${checks.length} checks)` : `\nFILED-PAGES-SCOPE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
