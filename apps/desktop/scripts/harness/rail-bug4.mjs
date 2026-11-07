// TOOLS - RAIL BUG #4, THE DOUBLE JOURNAL (bug-list, Fable Nov 7): on any Journal page the rail shows the place name TWICE (the current-place slot + the Journal pin).
// The place word per skin: Arbor "Journal", Flux "Log", Machina "Notebook". A committed CDP scenario; needs a box turn and a fresh build. READ-ONLY on the product: it seeds one page through the
// app's own seam, opens it, and counts the VISIBLE elements whose own text is exactly the place word, outside the page's text (the editor) - on /page/:id, and on /journal for a baseline.
// Verdict per skin: the place word shows at most ONCE in the chrome of a Journal page. It also prints every match's ancestry so a hit names the component, whichever it is.
// The rail may be DeskRail (.desk-rail) or the framed surface's own rail / Drawer places face - the count does not assume which, it counts what a writer sees.
// Run (from apps/desktop, needs a box turn):  node scripts/harness/rail-bug4.mjs
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 700)}]` : ''}`); };
const SKINS = [['plateau', 'Arbor', null, 'Journal'], ['flux', 'Flux', null, 'Log'], ['machina', 'Machina', 'cool', 'Notebook']];
const ED = '.forward-only-editor';

// every visible element whose OWN text (its direct text nodes, trimmed) is exactly the word, or whose aria-label / title is exactly the word, outside the editor
const COUNT = (word) => `(() => {
  const W = ${JSON.stringify(word.toLowerCase())};
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
  const path = (el) => { const out = []; for (let n = el; n && n !== document.body && out.length < 5; n = n.parentElement) out.push(n.tagName.toLowerCase() + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\\s+/).slice(0, 2).join('.') : '')); return out.join(' < '); };
  const hits = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest(${JSON.stringify('.forward-only-editor')})) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.data).join('').trim().toLowerCase();
    const aria = (el.getAttribute('aria-label') || '').trim().toLowerCase();
    if ((own === W || aria === W) && vis(el)) hits.push({ text: own || aria, via: own === W ? 'text' : 'aria-label', path: path(el) });
  }
  return JSON.stringify(hits);
})()`;

const freshDesk = async (app, theme, cast) => {
  await app.emulateDpr(1, 1280, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-splash-hold', '50');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('${theme}'); ${cast ? `window.wrizoCast && window.wrizoCast.set('${cast}')` : ''}`);
};

await withHarness(async (app) => {
  try {
    for (const [theme, label, cast, word] of SKINS) {
      await freshDesk(app, theme, cast);
      // a Journal page, through the seam (origin 'journal' is the default - carried explicitly, the seeding law)
      await app.evalJs(`window.wrizoCreateJournalPage({ id: 'rb4-${theme}', text: 'A page in the journal, with some words on it.', createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })`);
      await app.reload();
      await app.evalJs(`location.hash = '#/page/rb4-${theme}'`);
      await app.waitFor(`!!document.querySelector('${ED}')`, { label: `${label} Journal page` });
      await sleep(800);
      const onPage = JSON.parse(await app.evalJs(COUNT(word)));
      const rail = await app.evalJs("(() => { const r = document.querySelector('.desk-rail'); return r ? r.innerText.replace(/\\s+/g, ' ').trim() : null; })()");
      ok(`${label}: on a Journal page the place word "${word}" shows at most once in the chrome (the double Journal is gone)`, onPage.length <= 1, JSON.stringify({ count: onPage.length, hits: onPage, deskRail: rail }));
      // a control: the count is not vacuous - the same page, the same word, found somewhere at all, or the rail itself read
      await app.evalJs("location.hash = '#/journal'");
      await sleep(1200);
      const onList = JSON.parse(await app.evalJs(COUNT(word)));
      ok(`${label}: baseline - on the Journal list the word "${word}" is found (the counter can see it), once or more`, onList.length >= 1, JSON.stringify({ count: onList.length, hits: onList }));
    }
  } catch (e) { ok('driver ran to a verdict', false, String((e && e.stack) || e)); }
}).catch((e) => { ok('harness ran to a verdict', false, String((e && e.stack) || e)); });

const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `RAIL-BUG4 VERIFY: FAIL (${failed.length} of ${checks.length})` : `RAIL-BUG4 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
