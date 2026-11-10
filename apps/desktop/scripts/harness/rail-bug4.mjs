// TOOLS - RAIL BUG #4, THE DOUBLE JOURNAL (bug-list, Fable Nov 7): on any Journal page the rail shows the place name TWICE (the current-place slot + the Journal pin).
// The place word per skin: Arbor "Journal", Flux "Log", Machina "Notebook". A committed CDP scenario; needs a box turn and a fresh build. READ-ONLY on the product: it seeds one page through the
// app's own seam, opens it, and counts the VISIBLE elements whose own text is exactly the place word, outside the page's text (the editor) - on /page/:id, and on /journal for a baseline.
// Verdict per skin: the place word shows at most ONCE in the RAIL (the DeskFrame strip) of a Journal page - the top breadcrumb is a separate thing and is not counted against the rail. It prints every match's ancestry.
// RULED Nov 7 (Fable): in the Journal the place slot stays as an ICON-ONLY switcher door (no name) and the Journal pin is marked active; elsewhere nothing changes (a Drawer place still shows its name,
// the pin is not marked). The extra checks hold each half of that ruling, so a fix that only hides the word (door gone, pin unmarked) still fails.
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
      const onPageAll = JSON.parse(await app.evalJs(COUNT(word)));
      const onPage = onPageAll.filter((h) => h.path.includes('desk-frame-strip'));
      const rail = await app.evalJs("(() => { const r = document.querySelector('.desk-rail'); return r ? r.innerText.replace(/\\s+/g, ' ').trim() : null; })()");
      ok(`${label}: on a Journal page the place word "${word}" shows at most once in the rail (the double Journal is gone)`, onPage.length <= 1, JSON.stringify({ count: onPage.length, hits: onPage, outsideRail: onPageAll.length - onPage.length, deskRail: rail }));
      // a control: the count is not vacuous - the same page, the same word, found somewhere at all, or the rail itself read
      await app.evalJs("location.hash = '#/journal'");
      await sleep(1200);
      const onList = JSON.parse(await app.evalJs(COUNT(word)));
      ok(`${label}: baseline - on the Journal list the word "${word}" is found (the counter can see it), once or more`, onList.length >= 1, JSON.stringify({ count: onList.length, hits: onList }));
      await app.evalJs(`location.hash = '#/page/rb4-${theme}'`);
      await app.waitFor(`!!document.querySelector('${ED}')`, { label: `${label} Journal page, again` });
      await sleep(800);
      const door = JSON.parse(await app.evalJs("(() => { const b = document.querySelector('.wz-place-block'); return JSON.stringify(b ? { kind: b.dataset.placeKind, hasName: !!b.querySelector('.wz-place-name'), hasIcon: !!b.querySelector('.wz-place-icon'), label: b.getAttribute('aria-label') } : null); })()"));
      ok(`${label}: in the Journal the place slot is still drawn as an icon-only door (no name), its accessible name intact`, !!door && door.kind === 'journal' && door.hasIcon && !door.hasName && String(door.label || '').includes(word), JSON.stringify(door));
      const pin = JSON.parse(await app.evalJs("(() => { const b = document.querySelector('.wz-strip-item[data-category=journal]'); return JSON.stringify(b ? { active: b.classList.contains('active'), current: b.getAttribute('aria-current') } : null); })()"));
      ok(`${label}: in the Journal the Journal pin is marked active (and current), with its panel shut`, !!pin && pin.active === true && pin.current === 'location', JSON.stringify(pin));
      await app.evalJs("document.querySelector('.wz-place-block')?.click()");
      await sleep(600);
      const sw = await app.evalJs("[...document.querySelectorAll('.wz-switcher-item')].map((i) => i.dataset.placeKind || i.dataset.placeId).length");
      ok(`${label}: the icon-only door still opens the switcher (it is the only door to the Drawers)`, sw >= 1, String(sw));
      // elsewhere nothing changes: choose a Drawer through the switcher - the place slot names it again, and the Journal pin is not marked
      await app.evalJs(`window.wrizoCreateDrawer && window.wrizoCreateDrawer('Rb4 Drawer')`);
      await app.reload();
      await app.evalJs(`location.hash = '#/page/rb4-${theme}'`);
      await app.waitFor(`!!document.querySelector('${ED}')`, { label: `${label} page again` });
      await sleep(600);
      await app.evalJs("document.querySelector('.wz-place-block')?.click()");
      await sleep(500);
      await app.evalJs("(() => { const it = [...document.querySelectorAll('.wz-switcher-item')].find((i) => i.dataset.placeKind !== 'journal' && /Rb4 Drawer/.test(i.textContent)); if (it) it.click(); })()");
      await sleep(700);
      const elsewhere = JSON.parse(await app.evalJs("(() => { const b = document.querySelector('.wz-place-block'); const pin = document.querySelector('.wz-strip-item[data-category=journal]'); return JSON.stringify({ kind: b && b.dataset.placeKind, name: b && b.querySelector('.wz-place-name') ? b.querySelector('.wz-place-name').textContent : null, pinActive: !!pin && pin.classList.contains('active'), pinCurrent: pin ? pin.getAttribute('aria-current') : null }); })()"));
      ok(`${label}: in a Drawer nothing changed - the place slot names the Drawer, the Journal pin is not marked`, elsewhere.kind === 'drawer' && elsewhere.name === 'Rb4 Drawer' && elsewhere.pinActive === false && elsewhere.pinCurrent === null, JSON.stringify(elsewhere));
    }
  } catch (e) { ok('driver ran to a verdict', false, String((e && e.stack) || e)); }
}).catch((e) => { ok('harness ran to a verdict', false, String((e && e.stack) || e)); });

const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `RAIL-BUG4 VERIFY: FAIL (${failed.length} of ${checks.length})` : `RAIL-BUG4 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
