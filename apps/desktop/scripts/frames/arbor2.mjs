// ARBOR v2 MOCKUP - named screens for INK's frames job (.github/workflows/frames.yml, -f screens_file=apps/desktop/scripts/frames/arbor2.mjs).
// NOT in harness/: run-suite runs every .mjs there, and this only takes pictures.
//
// Every screen turns the flag on (?arbor2=1 before the hash) and NEVER touches the mockup bar's Night/Day override: the frames job sets the
// page tone (light/dark) itself, so a dark frame that differs from its light twin proves the room FOLLOWS the existing tone setting.
// Seeds go through the app's seams (window.wrizo*), never raw collection storage (AGENTS.md "HOW TO SEED A FIXTURE").
// No imports: the job loads this file from the built branch, so it stands alone.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);

// the flag lives in the URL only: put it before the hash, reload, and wait the splash out
const flagTo = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'arbor2 flag on', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const page = async (app, id, text) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await flagTo(app, '#/page/' + id);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1200);
};
const rhizomeAt = async (app, words) => {
  // the progress style is a writing setting (not a collection): Rhizome, by words, goal 8
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  await app.evalJs("window.wrizoSetWritingGoal({ n: 8, unit: 'words' })");
  await page(app, 'arbor-rz', Array.from({ length: words }, (_, i) => 'word' + i).join(' '));
  await waitSoft(app, "!!document.querySelector('.wz-rhizome-field')", { label: 'rhizome field', timeout: 4000 });
};

export default {
  // item 1: the room and the page (night = dark tone, day = light tone; day adds item 6's pergola light)
  'arbor-page': async (app) => { await page(app, 'arbor-words', WORDS); },
  'arbor-blank': async (app) => {
    await flagTo(app, '#/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page' });
    await sleep(1200);
  },
  // items 2 + 4: the Tools drawer, Free Write (Font | Ink) and Draft (Font | Format | Presets), cloth tabs
  'arbor-tools-freewrite': async (app) => {
    await page(app, 'arbor-words', WORDS);
    await clickSel(app, '.wz-sliver-grip');
    await waitSoft(app, "!!document.querySelector(\".wz-sliver[data-open='true']\")", { label: 'tools open', timeout: 3000 });
    await sleep(700);
  },
  'arbor-tools-draft-format': async (app) => {
    await page(app, 'arbor-words', WORDS);
    await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(900);
    await clickSel(app, '.wz-sliver-grip');
    await waitSoft(app, "!!document.querySelector(\".wz-sliver[data-open='true']\")", { label: 'tools open', timeout: 3000 });
    await clickSel(app, '#wz-sliver-tab-format'); await sleep(700);
  },
  // item 3: the Tutor drawer's Board tab
  'arbor-tutor-board': async (app) => {
    await page(app, 'arbor-words', WORDS);
    await clickSel(app, '.wz-tutor-grip'); await sleep(600);
    await clickSel(app, '#wz-tutor-tab-board'); await sleep(700);
  },
  // the night progress picture (Fable's ruling): hidden while it grows, the whole web in brass at the goal. By day it is the plain rhizome.
  'arbor-rhizome-rest': async (app) => { await rhizomeAt(app, 7); await sleep(400); },
  'arbor-rhizome-flash': async (app) => {
    await rhizomeAt(app, 7);
    await app.evalJs(`document.querySelector('${ED}').focus()`);
    await app.typeKeys(' tail');
    await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'flash at goal', timeout: 4000 });
    await sleep(250);
  },
};
