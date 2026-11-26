// THE REORG'S RAILS (POLISH; Fable cleared the plan Nov 14 with five changes, claude/live-feedback-nov14i.md). Steps 1 and 2: the switch and
// the rail's shell, then PROJECTS (counts, New project, pins in memory, list or boxes). Machina only, behind ?reorg=1.
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account is given its Top Drawer and Top Drawer's app-made set):
//   Top Drawer (Machina shows it as its root word)  its app-made set holds two pages and a board  -> 2 Docs (each page a one-Part Doc)
//   Grants   a set she made, "Budget": three pages and a board                                      -> 1 Doc (the set)
//            and a set she made of boards only, "Moodboards": one board                             -> no Doc; a Board with no Doc (step 3)
//   Essays   nothing                                                                                -> 0 Docs
//   the Notebook (the hidden Journal): one journal page                                              -> 1 Doc, listed LAST
//   plus one loose page and one set in no Drawer: writing with no Project (Unfiled), never a row of All projects
// The open page is the first page of Top Drawer's set.
//
// OFF   O1  with the switch off, in Arbor, Flux and Machina, the strip and every pop-out it opens is main's DOM exactly (the golden, captured
//           from origin/main's own build: reorg-rails-off-golden.json, see CAPTURE below)
//       O2  with the switch ON in Arbor and Flux, the same: the rail is Machina's alone
//       O3  with the switch off, Machina's words are the live ones (Plan / Plans / Outline / Consultant); on, the reorg's (Board / Boards / Plan / Feedback)
// SHELL S1  on (Machina): the rail sits in the strip's own track, the old strip's place block is gone, and its four groups read in order:
//           where she is · (no pins on day one) · DOCS, PROJECTS, UNFILED · THEME, SETTINGS (each word from the lexicon)
//       S2  where she is = the open page's Project: its box carries the two letters of its name and is marked as the location
// PROJ  P1  PROJECTS opens All projects: the head counts the rows; the rows are the live Drawers in her order, the Notebook LAST; each row's
//           Docs count is the read-time rule's (2, 1, 0, 1); no Unfiled writing is a row
//       P2  pins: pinning puts a Project in the pinned group (in the order pinned) and its box on the rail; the Project she is in is never drawn
//           twice on the rail; the switch under the pins draws them as a list or as boxes; unpinning takes it off
//       P3  New project: typed and Entered, it adds one Drawer with that name and touches no page and no set (today's own act)
// SAVED N1  pins and list-or-boxes change nothing stored (localStorage and sessionStorage byte-identical, beside a control of the same
//           length with no act), and the in-memory rail holds them; a reload forgets them
//           [successor, Nick's ruling Nov 18: saved with the account - they change ONE key, the rail's own copy, and a reload KEEPS them;
//           the account half is reorg-rail-saved.mjs]
// PAGE  G1  the page's rect is identical with the switch off, on at rest, with PROJECTS open, with pins drawn as boxes and as a list, at
//           1366, 1920 and 2000; the editor element is the same node throughout (no remount)
// KEYS  K1  PROJECTS opens on Enter; a row's pin toggles on Enter; Escape from the page closes the pop-out
// FLOOR F1  as drawn: every box's letters hold 4.5:1 on its colour; a row box's 1 px edge holds 3:1 on the pop-out
//
// STEP 3, a Project's own list (Nick, Nov 14, 11:14 am; Fable, Nov 14, 2:40 pm):
// LIST  L1  the where-she-is box opens her Project's own list (its name in the head): its Docs (Top Drawer: two one-Part Docs), then its Boards
//           with no Doc; + New doc and + New board side by side; pressing the box again closes it
//       L2  a pin opens its Project's list: Grants shows Budget as ONE Doc with its three Parts and its board indented under it, and Moodboards'
//           board under Boards with no doc, with the set's name beside it
//       L3  a row of All projects opens its list (the Notebook: its one page; Essays: no Docs)
//       L4  REACHABLE: over every Project's list, every page and board of a Project or of the Notebook is listed, each in exactly one Project's
//           list; the two Unfiled entries are in none (UNFILED is step 6)
//       L5  opening a Part is a departure with the return chip, and the rail comes back open on the same list
//       L6  + New board and + New doc go through today's own route: an unborn board in Top Drawer's set; an unborn doc in Grants' first set
//           [successor, (c) Fable 3:52 pm: a new Doc is always its own: in Grants (no app-made set) a NEW set made by today's "+ New set"]
//       L7  browsing the lists changes nothing stored [successor, Nov 18: nothing but L2's own pin of Grants, in the rail's copy]
//       L8  + New board in Grants' list lands in a new set of boards only (a Board with no Doc); abandoned, it leaves that one empty set and no page
// STEP 4, Box settings (frame R5):
// BOX   B1  one closed drop-down at the foot of PROJECTS, for the Project she is in; open, it sets the letters (the rail's box and the row's
//           read them), No letters, a swatch (brass), her own colour, and a picture (the box shows it), and Remove the picture
//       B2  none of it is stored (a control of the same length changes nothing either) and the memory holds it; a reload forgets it
//           [successor, Nov 18: stored in the rail's copy alone, nothing waiting to upload; a reload KEEPS it]
//       B3  it follows where she is: on a Grants page it is Grants' Box settings
// FLOOR F2  as drawn: the letters hold 4.5:1 on every swatch and on a mid-grey of her own (#777777)
// STEP 5, DOCS (frame R7):
// DOCS  D1  NEW DOC lists Blank, Screenplay, Research paper, Board (Machina's word) and More kinds, each through today's own route into the
//           Project she is in: Blank and Screenplay as today's presets, Research paper as today's deck, Board as today's new board, More kinds
//           as today's library
//       D2  RECENT: her three most recently changed Docs, newest first, each with its Project and its words; a row is a departure with the chip
//           [successor, Nov 20: up to 25, the three touched last leading; the box and the sort are reorg-docs-recent.mjs]
//       D3  PAGE DEFAULTS: Typewriter mode and Progress bars are today's two saved settings, and a press changes that one setting and nothing else
// STEP 6, UNFILED and the Trash (frame R6):
// UNF   U1  UNFILED lists writing with no Project and only that (the loose page, the page in a set with no Drawer; never the Notebook's page),
//           the head counting it
//       U2  File opens today's Add to… sheet for that row; Trash goes through today's ask-before-deleting gate and, confirmed, trashes it
//       U3  the Trash is the row at the very foot, and opens today's Trash
//       U4  REACHABLE, whole: every Project's list, the Notebook's and Unfiled together reach every page and board the fixture made
// PAGE  G2  the page's rect is the same with DOCS open and with UNFILED open, at 1366, 1920 and 2000
//       G1/G2 [scale successor] (train H, Nov 21: the chrome scale) every state within the reorg is the same; against the switch off the page is the
//           same at 1366, and above it sits lower by the bar's growth alone (scaledSame)
//   MUT-G-SCALE  the 1920 reading pushed 40 px sideways, or 30 px lower than the bar grew, fails the successor; the reading itself passes
//
// CAPTURE (REORG_RAILS_MODE=capture): prints main's switch-off DOM, one GOLDEN line per surface, instead of checking. Run it on a tree that is
//   origin/main plus this file (the wrapper reorg-rails-capture.mjs on the branch reorg-rails-golden); the golden file records that tree's SHA.
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-rails.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_FILE = path.join(HERE, 'reorg-rails-off-golden.json');
const CAPTURE = process.env.REORG_RAILS_MODE === 'capture';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const THEMES = ['plateau', 'flux', 'machina'];
const CATEGORIES = ['page', 'plan', 'journal', 'drawers', 'settings', 'theme', 'trash'];
// the page as the writer sees it, every layer of it: the column, the paper inside it and the editor on the paper (the first form read only the
// first of '.mode-page, .mode-pagecol' in document order, the column, so a shove of the paper inside it went unseen: mutant page-shoved, run 43641519969)
// the chrome scale's successor (train H, Nov 21): the bar's bottom, and the page's rects against the switch off - at 1366 and below (k = 1) the same
// string; above, every top moves by the bar's growth g (within 1 px) and no other edge moves more than g (a drawer or the rail displacing the page moves
// it by its own width, 100 px and more). Within the reorg every state is still compared as the same string.
const BAR = "(() => { const b = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((e) => e.getBoundingClientRect().height > 0); return b ? Math.round(b.getBoundingClientRect().bottom * 10) / 10 : null; })()";
const rectsOf = (s) => String(s || '').split('|').map((r) => r.trim());
const scaledSame = (w, off, on, g) => {
  if (!off || !on) return false;
  if (w <= 1366) return on === off;
  const a = rectsOf(off), b = rectsOf(on);
  if (a.length !== b.length || !(g > 0)) return false;
  return a.every((r, i) => { if (r === '-' || b[i] === '-') return r === b[i]; const p = r.split(',').map(Number), q = b[i].split(',').map(Number);
    if (p.length !== 4 || q.length !== 4 || [...p, ...q].some((x) => !Number.isFinite(x))) return false;
    return Math.abs((q[1] - p[1]) - g) <= 1 && Math.abs(q[0] - p[0]) <= g && Math.abs(q[2] - p[2]) <= g && Math.abs(q[3] - p[3]) <= g; });
};
const shiftRects = (s, dl, dt) => rectsOf(s).map((r) => (r === '-' ? r : r.split(',').map(Number).map((x, j) => Math.round((x + (j === 0 ? dl : j === 1 ? dt : 0)) * 10) / 10).join(','))).join(' | ');
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
const STORE = "JSON.stringify([localStorage, sessionStorage].map((s) => Object.keys(s).sort().map((k) => [k, s.getItem(k)])))";
const q = (s) => JSON.stringify(s);

// ---- the fixture ---------------------------------------------------------------------------------------------------------------------------
let ids = null;   // name -> id, so a captured DOM reads the same in every run (generated ids are swapped for their names)
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  // Top Drawer arrives through the app's own bootstrap (after the first pull); read, never written
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const top = await app.evalJs("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id); return { drawer: d.id, set: p && p.id }; })()");
  const made = await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const essays = W.wrizoCreateDrawer('Essays');
    const budget = W.wrizoCreateProject('Budget'); W.wrizoSetProjectDrawer(budget.id, grants.id);
    const orphan = W.wrizoCreateProject('Old binder');
    const moods = W.wrizoCreateProject('Moodboards'); W.wrizoSetProjectDrawer(moods.id, grants.id);   // step 3: a set she made of boards only
    page('rr-top-1', 'Notes on the ledgers', { origin: 'project', projectId: ${q(top.set)}, orderIndex: 0 });
    page('rr-top-2', 'A second note', { origin: 'project', projectId: ${q(top.set)}, orderIndex: 1 });
    page('rr-top-b', 'Top board', { origin: 'project', projectId: ${q(top.set)}, pageType: 'board', boxes: [] });
    page('rr-g-1', 'Budget one', { origin: 'project', projectId: budget.id, orderIndex: 0 });
    page('rr-g-2', 'Budget two', { origin: 'project', projectId: budget.id, orderIndex: 1 });
    page('rr-g-3', 'Budget three', { origin: 'project', projectId: budget.id, orderIndex: 2 });
    page('rr-g-b', 'Budget board', { origin: 'project', projectId: budget.id, pageType: 'board', boxes: [] });
    page('rr-j-1', 'A journal page', { origin: 'journal' });
    page('rr-l-1', 'A loose page', { origin: 'loose' });
    page('rr-o-1', 'In a binder with no drawer', { origin: 'project', projectId: orphan.id });
    page('rr-m-b', 'Mood board', { origin: 'project', projectId: moods.id, pageType: 'board', boxes: [] });
    W.wrizoFlushNow();
    return { grants: grants.id, essays: essays.id, budget: budget.id, orphan: orphan.id, moods: moods.id };
  })()`);
  ids = { topDrawer: top.drawer, topSet: top.set, ...made };
}

// open the fixture's first page under a theme, with or without the switch (a reload re-reads the address, as the app does once at load)
async function openPage(app, theme, reorg) {
  await app.evalJs(`window.wrizoTheme.set('${theme}')`);
  // (the Arbor redesign is on by default since Nov 15; this file was written for today's Arbor, so its own address carries the harness's pin, ?arbor2=0 -
  // FABLE RULED, Nov 15, 10:40 pm. It wrote its own address and so skipped the driver's pin: O1/O2 read the redesign's strip against today's golden.)
  // (Machina's look, on by default since machina/look: the same pin for Machina, ?machina2=0 - FABLE ACCEPTED the Machina pin, Nov 20, 12:05 am, "as Arbor's Nov 15
  // pin". Actions 44691517313 read the look's Themes pop-out - its Room row - against today's golden: O1 [machina] [theme]. This file is on the pinned list.)
  // SUPERSEDED (Nov 22, the Flux redesign is on by default: this file was written for the Flux of before, so its own address carries the pin ?flux3=0, as the Arbor files carry ?arbor2=0). The line as it stood, verbatim:
  // await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0&machina2=0' : '/?arbor2=0&machina2=0'}#/page/rr-top-1')`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0&machina2=0&flux3=0' : '/?arbor2=0&machina2=0&flux3=0'}#/page/rr-top-1')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.desk-frame-strip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}

// React's useId values (":r2:") count mounts, not what is drawn (two reads of main's own Pages pop-out differ only there, run 43639941602),
// so each is replaced by its order of appearance in the surface; every other byte is held
const NORM = () => `(() => { const ids = ${q(ids)}; return (h) => { let s = h || ''; for (const [k, v] of Object.entries(ids)) if (v) s = s.split(v).join('{' + k + '}'); const seen = new Map(); return s.replace(/:r[0-9a-z]+:/g, (m) => { if (!seen.has(m)) seen.set(m, ':useid' + (seen.size + 1) + ':'); return seen.get(m); }); }; })()`;
// the strip at rest, then each of its pop-outs open (the anchor, once its slide has settled), each closed again before the next
async function captureSurfaces(app) {
  const out = {};
  out.strip = await app.evalJs(`${NORM()}(document.querySelector('.desk-frame-strip')?.outerHTML)`);
  for (const c of CATEGORIES) {
    const pressed = await app.evalJs(`(() => { const b = document.querySelector('.desk-frame-strip [data-category="${c}"]'); if (!b) return false; b.click(); return true; })()`);
    if (!pressed) { out[c] = null; continue; }
    await sleep(600);
    out[c] = await app.evalJs(`${NORM()}(document.querySelector('.desk-frame-cascade-anchor')?.outerHTML)`);
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    await sleep(600);
  }
  return out;
}

// ---- contrast, as drawn --------------------------------------------------------------------------------------------------------------------
const CONTRAST_FN = `(() => {
  const rgb = (s) => { const m = (s || '').match(/[\\d.]+/g); return m ? m.slice(0, 4).map(Number) : null; };
  const lum = (c) => { const ch = c.slice(0, 3).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && (c.length < 4 || c[3] > 0)) return c; } return [255, 255, 255]; };
  return { rgb, ratio, bgOf };
})()`;

await withHarness(async (app) => {
  await seed(app);
  if (CAPTURE) {
    for (const theme of THEMES) {
      await openPage(app, theme, false);
      const s = await captureSurfaces(app);
      for (const [k, html] of Object.entries(s)) console.log(`GOLDEN ${theme}.${k} ${Buffer.from(html == null ? 'null' : html, 'utf8').toString('base64')}`);
      // a second capture of the same surfaces: what differs between two reads of main is not a DOM main draws the same each time
      const again = await captureSurfaces(app);
      ok(`CAPTURE [${theme}]: two captures of main's switch-off surfaces agree (${Object.keys(s).length} surfaces)`, Object.keys(s).every((k) => s[k] === again[k]), Object.keys(s).filter((k) => s[k] !== again[k]).join(','));
      for (const k of Object.keys(s).filter((x) => s[x] !== again[x])) console.log(`AGAIN ${theme}.${k} ${Buffer.from(String(again[k]), 'utf8').toString('base64')}`);
    }
    return checks;
  }

  // ---- OFF -----------------------------------------------------------------------------------------------------------------------------
  const golden = fs.existsSync(GOLDEN_FILE) ? JSON.parse(fs.readFileSync(GOLDEN_FILE, 'utf8')) : null;
  ok('O0: the golden of main\'s switch-off DOM is committed beside this file, with the tree it was captured from', !!golden && /^[0-9a-f]{40}$/.test(golden.capturedFrom || '') && !!golden.surfaces, GOLDEN_FILE);
  const diffOf = (got, theme) => {
    if (!golden) return ['no golden'];
    // SUPERSEDED (INK, Nov 23: FIX's splash work made Flux's Settings action read "Log out", declared in c13-10c as cascadeSettingsSignOut@flux; that one word is the only difference from the golden, read byte for byte). The original, verbatim:
    // return Object.keys(golden.surfaces[theme] || {}).filter((k) => (got[k] ?? 'null') !== golden.surfaces[theme][k]);
    const ruled = (k, html) => (theme === 'flux' && k === 'settings' ? html.replace('>Sign out<', '>Log out<') : html);
    // SUPERSEDED (PRESETS-B items 4-5, Nov 24: the library's eight new decks are eight more buttons in the Plan pop-out's Presets list - intended product DOM, the deck list lengthening 14 -> 22; where they stand differs by theme, so the check takes exactly those eight out of the live DOM and holds EVERYTHING else to the golden byte for byte). The original, verbatim:
    // return Object.keys(golden.surfaces[theme] || {}).filter((k) => (got[k] ?? 'null') !== ruled(k, golden.surfaces[theme][k]));
    const NEW_DECKS = ['relationship-map', 'timeline', 'literature-map', 'narrow-my-question', 'pitch-story', 'logic-model', 'interview-notes', 'memory-map'];
    const withoutNewDecks = (html) => NEW_DECKS.reduce((h, id) => h.replace(new RegExp('<button type="button" class="wz-sections-preset" data-preset="' + id + '"><span>[^<]*</span></button>'), ''), String(html));
    const liveOf = (k) => (k === 'plan' && got[k] != null && NEW_DECKS.every((id) => String(got[k]).split('data-preset="' + id + '"').length === 2) ? withoutNewDecks(got[k]) : (got[k] ?? 'null'));
    return Object.keys(golden.surfaces[theme] || {}).filter((k) => liveOf(k) !== ruled(k, golden.surfaces[theme][k]));
  };
  for (const theme of THEMES) {
    await openPage(app, theme, false);
    const got = await captureSurfaces(app);
    const bad = diffOf(got, theme);
    ok(`O1 [${theme}]: switch OFF - the strip and its ${CATEGORIES.length} pop-outs are main's DOM exactly`, golden && bad.length === 0 && Object.keys(golden.surfaces[theme] || {}).length === CATEGORIES.length + 1, bad.join(','));
    for (const k of bad.slice(0, 2)) console.log(`DIFF ${theme}.${k} ${Buffer.from(String(got[k]), 'utf8').toString('base64')}`);
    if (theme !== 'machina') {
      await openPage(app, theme, true);
      const on = await captureSurfaces(app);
      const badOn = diffOf(on, theme);
      ok(`O2 [${theme}]: switch ON in ${theme} - still main's DOM exactly (the rail is Machina's alone)`, golden && badOn.length === 0, badOn.join(','));
    }
  }
  const WORDS = "(() => ({ board: window.wrizoLexicon.t('board', 'machina'), boards: window.wrizoLexicon.tMany('board', 'machina'), strip: window.wrizoDeskLexicon.t('stripPlan', 'machina'), outline: window.wrizoDeskLexicon.t('boardModeOutline', 'machina'), tab: window.wrizoDeskLexicon.t('tutorTabTutor', 'machina') }))()";
  await openPage(app, 'machina', false);
  const offWords = await app.evalJs(WORDS);
  await openPage(app, 'machina', true);
  const onWords = await app.evalJs(WORDS);
  ok('O3: Machina\'s words - switch off: Plan / Plans / Plans / Outline / Consultant; switch on: Board / Boards / Boards / Plan / Feedback',
    JSON.stringify(offWords) === JSON.stringify({ board: 'Plan', boards: 'Plans', strip: 'Plans', outline: 'Outline', tab: 'Consultant' })
    && JSON.stringify(onWords) === JSON.stringify({ board: 'Board', boards: 'Boards', strip: 'Boards', outline: 'Plan', tab: 'Feedback' }), JSON.stringify({ offWords, onWords }));

  // ---- SHELL ---------------------------------------------------------------------------------------------------------------------------
  const shell = await app.evalJs(`(() => {
    const rail = document.querySelector('.desk-frame-strip > [data-reorg-rail], .desk-frame-strip [data-reorg-rail]');
    if (!rail) return null;
    const groups = [...rail.children].map((g) => g.classList.contains('wz-reorg-where') ? 'where' : g.classList.contains('wz-reorg-pins') ? 'pins' : g.classList.contains('wz-reorg-doors') ? 'doors' : g.classList.contains('wz-strip-foot') ? 'foot' : g.className);
    const doors = [...rail.querySelectorAll('.wz-reorg-doors [data-category]')].map((b) => [b.dataset.category, b.querySelector('.wz-strip-label').textContent]);
    const foot = [...rail.querySelectorAll('.wz-strip-foot [data-category]')].map((b) => [b.dataset.category, b.querySelector('.wz-strip-label').textContent]);
    const where = rail.querySelector('[data-reorg-where]');
    return { inStrip: !!rail.closest('.desk-frame-strip'), placeBlock: !!document.querySelector('.desk-frame-strip .wz-place-block'), groups, doors, foot,
      where: where && { id: where.dataset.reorgWhere, name: where.querySelector('.wz-reorg-where-name').textContent, letters: where.querySelector('.wz-reorg-box').textContent, current: where.getAttribute('aria-current') },
      words: { docs: window.wrizoLexicon.tMany('page', 'machina'), projects: window.wrizoLexicon.tMany('drawer', 'machina'), unfiled: window.wrizoDeskLexicon.t('reorgUnfiled', 'machina'), theme: window.wrizoDeskLexicon.t('stripChangeTheme', 'machina'), settings: window.wrizoDeskLexicon.t('stripSettings', 'machina'), root: window.wrizoDeskLexicon.t('placeRootName', 'machina') } };
  })()`);
  ok('S1: switch on in Machina - the rail sits in the strip\'s own track (the place block is gone) and reads where · DOCS, PROJECTS, UNFILED · THEME, SETTINGS, every word from the lexicon',
    !!shell && shell.inStrip && !shell.placeBlock && JSON.stringify(shell.groups) === JSON.stringify(['where', 'doors', 'foot'])
    && JSON.stringify(shell.doors) === JSON.stringify([['reorg-docs', shell.words.docs], ['reorg-projects', shell.words.projects], ['reorg-unfiled', shell.words.unfiled]])
    && JSON.stringify(shell.foot) === JSON.stringify([['theme', shell.words.theme], ['settings', shell.words.settings]]), JSON.stringify(shell));
  const letters = (n) => { const w = n.trim().split(/\s+/); return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase(); };
  ok('S2: where she is = the open page\'s Project (Top Drawer, by Machina\'s root word): its two letters, marked as the location',
    !!shell && !!shell.where && shell.where.id === ids.topDrawer && shell.where.name === shell.words.root && shell.where.letters === letters(shell.words.root) && shell.where.current === 'location', JSON.stringify(shell && shell.where));

  // ---- PROJECTS ------------------------------------------------------------------------------------------------------------------------
  const PROJECTS = `(() => { const p = document.querySelector('.desk-frame-cascade-anchor .wz-reorg-projects'); if (!p) return null;
    return { title: document.querySelector('.desk-frame-cascade-anchor .wz-cascade-panel-title')?.textContent, count: document.querySelector('[data-reorg-count]')?.textContent,
      groups: [...p.querySelectorAll('[data-reorg-group]')].map((g) => [g.dataset.reorgGroup, [...g.querySelectorAll('[data-reorg-project]')].map((r) => r.dataset.reorgProject)]),
      rows: [...p.querySelectorAll('[data-reorg-project]')].map((r) => ({ id: r.dataset.reorgProject, name: r.querySelector('.wz-reorg-row-name').textContent, docs: Number(r.querySelector('[data-reorg-docs]').dataset.reorgDocs), meta: r.querySelector('.wz-reorg-row-meta').textContent, notebook: r.dataset.notebook === 'true', current: r.getAttribute('aria-current') })) }; })()`;
  const RAILPINS = "(() => { const g = document.querySelector('[data-reorg-rail] .wz-reorg-pins'); return g ? { view: g.dataset.pinView, pins: [...g.querySelectorAll('[data-reorg-pin]')].map((b) => b.dataset.reorgPin), named: g.querySelectorAll('.wz-reorg-pin-name').length } : null; })()";
  const click = (sel) => app.evalJs(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`);
  await sleep(2500);   // the page settles (a mode's re-persist lands ~1.1 s after the mount) before the store is read
  const storeBefore = await app.evalJs(STORE);
  await sleep(1500);
  const storeControl = await app.evalJs(STORE);   // the control: the same wait, no act
  const opened = await click('[data-reorg-rail] [data-category="reorg-projects"]');
  await sleep(600);
  const pj = await app.evalJs(PROJECTS);
  const want = [ids.topDrawer, ids.grants, ids.essays, 'notebook'];
  // SUPERSEDED (FIX 1, Fable, Nov 14, 3:52 pm: the count must NOT count the Notebook). The original, verbatim:
  // ok('P1: PROJECTS opens All projects - the head counts its rows (4); the rows are Top Drawer, Grants, Essays, then the Notebook LAST; Docs 2, 1, 0, 1 by the read-time rule; no Unfiled writing is a row; the row she is in is marked',
  //   opened && !!pj && pj.title === 'All projects' && pj.count === '4' && JSON.stringify(pj.rows.map((r) => r.id)) === JSON.stringify(want)
  ok('P1 [successor]: PROJECTS opens All projects - the head counts its Projects (3: the Notebook is listed, not counted); the rows are Top Drawer, Grants, Essays, then the Notebook LAST; Docs 2, 1, 0, 1 by the read-time rule; no Unfiled writing is a row; the row she is in is marked',
    opened && !!pj && pj.title === 'All projects' && pj.count === '3' && JSON.stringify(pj.rows.map((r) => r.id)) === JSON.stringify(want)
    && JSON.stringify(pj.rows.map((r) => r.docs)) === JSON.stringify([2, 1, 0, 1]) && pj.rows[1].meta === '1 doc' && pj.rows[0].meta === '2 docs'
    && pj.rows[3].notebook && pj.rows[3].name === 'Notebook' && pj.rows[0].current === 'location' && pj.rows.filter((r) => r.current).length === 1, JSON.stringify(pj));

  // P2: pins
  await click(`[data-reorg-pin-toggle="${ids.grants}"]`); await sleep(150);
  await click('[data-reorg-pin-toggle="notebook"]'); await sleep(150);
  await click(`[data-reorg-pin-toggle="${ids.topDrawer}"]`); await sleep(150);
  const pinned3 = await app.evalJs(PROJECTS);
  const rail3 = await app.evalJs(RAILPINS);
  await click('[data-pin-view-btn="list"]'); await sleep(150);
  const railList = await app.evalJs(RAILPINS);
  const pageList = await app.evalJs(PAGE);
  await click('[data-pin-view-btn="boxes"]'); await sleep(150);
  const railBoxes = await app.evalJs(RAILPINS);
  const memory = await app.evalJs('JSON.stringify(window.wrizoRailMemory && window.wrizoRailMemory.get())');
  ok('P2: pinned Grants, the Notebook, then Top Drawer - the pinned group lists them in that order; the rail draws Grants and the Notebook (Top Drawer, where she is, shows once, at the top); the switch draws them as a list, then as boxes',
    !!pinned3 && JSON.stringify(pinned3.groups) === JSON.stringify([['pinned', [ids.grants, 'notebook', ids.topDrawer]], ['rest', [ids.essays]]])
    && !!rail3 && JSON.stringify(rail3.pins) === JSON.stringify([ids.grants, 'notebook']) && rail3.view === 'boxes' && rail3.named === 0
    && !!railList && railList.view === 'list' && railList.named === 2 && !!railBoxes && railBoxes.view === 'boxes' && railBoxes.named === 0,
    JSON.stringify({ groups: pinned3 && pinned3.groups, rail3, railList, railBoxes }));
  await click(`[data-reorg-pin-toggle="${ids.grants}"]`); await sleep(150);
  const unpinned = await app.evalJs(RAILPINS);
  ok('P2b: unpinning Grants takes it off the rail and back among the rest', !!unpinned && JSON.stringify(unpinned.pins) === JSON.stringify(['notebook']), JSON.stringify(unpinned));

  // N1: nothing saved
  const storeAfter = await app.evalJs(STORE);
  const diffKeys = (a, b) => { const A = JSON.parse(a), B = JSON.parse(b); const out = []; A.forEach((s, i) => { const m = new Map(s); const n = new Map(B[i]); for (const k of new Set([...m.keys(), ...n.keys()])) if (m.get(k) !== n.get(k)) out.push(`${i ? 'session' : 'local'}:${k}`); }); return out; };
  const control = diffKeys(storeBefore, storeControl);
  const acted = diffKeys(storeControl, storeAfter);
  // SUPERSEDED (Nick's ruling Nov 18, 1:56 pm: her pins, their order and the list-or-boxes switch are SAVED WITH THE ACCOUNT; Fable's GO Nov 18,
  // 2:45 pm; red by design in run 44408993606 on 0e3b3890, acted = local:writer-studio-rail). The original, verbatim:
  // ok('N1: four pins, an unpin and both views change nothing stored - localStorage and sessionStorage are byte-identical (a control of the same wait with no act changed: ' + (control.join(',') || 'nothing') + ')',
  //   acted.length === 0 && control.length === 0, JSON.stringify({ acted, control }));
  // the rail's own local copy, read out of a STORE snapshot; its pins in her order (the app's own rule: railSaved.pinnedIdsOf)
  const railCopy = (store) => { const e = JSON.parse(store)[0].find(([k]) => k === 'writer-studio-rail'); try { return e ? JSON.parse(e[1]) : null; } catch { return 'unreadable'; } };
  const pinnedIn = (c) => (c && c.rail ? Object.entries(c.rail.pins || {}).filter(([, p]) => !(p.removedAt && p.removedAt >= p.at)).sort((a, b) => a[1].order - b[1].order || (a[0] < b[0] ? -1 : 1)).map(([id]) => id) : null);
  const copyN1 = railCopy(storeAfter);
  ok('N1 [successor]: four pins, an unpin and both views change ONE stored key, the rail\'s own copy (writer-studio-rail), and nothing else; it holds the Notebook then Top Drawer pinned and the boxes view (a control of the same wait with no act changed: ' + (control.join(',') || 'nothing') + ')',
    JSON.stringify(acted) === JSON.stringify(['local:writer-studio-rail']) && control.length === 0 && JSON.stringify(pinnedIn(copyN1)) === JSON.stringify(['notebook', ids.topDrawer]) && !!copyN1 && copyN1.rail.view === 'boxes',
    JSON.stringify({ acted, control, pins: pinnedIn(copyN1), view: copyN1 && copyN1.rail && copyN1.rail.view }));
  ok('N1b: the rail\'s memory held them while she worked (Grants, the Notebook and Top Drawer pinned, in that order; the boxes view)', memory === JSON.stringify({ pins: [ids.grants, 'notebook', ids.topDrawer], pinView: 'boxes' }), memory);

  // P3: New project (today's own act: one Drawer, nothing else)
  const before3 = await app.evalJs("JSON.stringify({ d: JSON.parse(localStorage.getItem('writer-studio-drawers')).length, e: localStorage.getItem('writer-studio-journal-entries'), p: localStorage.getItem('writer-studio-projects') })");
  await click('[data-new="project"]'); await sleep(200);
  await app.evalJs("document.querySelector('.wz-reorg-new-input')?.focus()");
  await app.typeKeys('Thesis\n');
  await sleep(900);
  const after3 = await app.evalJs("JSON.stringify({ d: JSON.parse(localStorage.getItem('writer-studio-drawers')).length, e: localStorage.getItem('writer-studio-journal-entries'), p: localStorage.getItem('writer-studio-projects'), names: JSON.parse(localStorage.getItem('writer-studio-drawers')).map((d) => d.name) })");
  const b3 = JSON.parse(before3), a3 = JSON.parse(after3);
  const pj3 = await app.evalJs(PROJECTS);
  // SUPERSEDED (Nov 14, run 43641174430 on db2516bc): it held the Notebook as the LAST ROW OVERALL, but here the Notebook is pinned (P2), and a
  // pinned Project lists in the pinned group by design; "last" is the Notebook's place among the UNPINNED rows. The original, verbatim:
  // ok('P3: New project "Thesis" adds one Drawer by that name, listed before the Notebook; no page and no set is touched',
  //   a3.d === b3.d + 1 && a3.names.includes('Thesis') && a3.e === b3.e && a3.p === b3.p && !!pj3 && pj3.rows[pj3.rows.length - 1].notebook && pj3.rows.some((r) => r.name === 'Thesis'),
  const rest3 = pj3 ? (pj3.groups.find((g) => g[0] === 'rest') || ['rest', []])[1] : [];
  ok('P3 [successor]: New project "Thesis" adds one Drawer by that name; the list stays open and shows it among the unpinned rows, after Essays (the Notebook, pinned here, is in the pinned group); no page and no set is touched',
    a3.d === b3.d + 1 && a3.names.includes('Thesis') && a3.e === b3.e && a3.p === b3.p && !!pj3 && pj3.rows.some((r) => r.name === 'Thesis')
    && rest3.indexOf(pj3.rows.find((r) => r.name === 'Thesis')?.id) > rest3.indexOf(ids.essays) && rest3.indexOf(ids.essays) >= 0
    && (!rest3.includes('notebook') || rest3[rest3.length - 1] === 'notebook'),
    JSON.stringify({ d: [b3.d, a3.d], names: a3.names, entriesSame: a3.e === b3.e, setsSame: a3.p === b3.p, rows: pj3 && pj3.rows.map((r) => r.name),
      entriesChanged: a3.e === b3.e ? [] : JSON.parse(a3.e).filter((x) => !JSON.parse(b3.e).some((y) => JSON.stringify(y) === JSON.stringify(x))).map((x) => ({ id: x.id, text: String(x.text).slice(0, 40), u: x.updatedAt })),
      setsChanged: a3.p === b3.p ? [] : JSON.parse(a3.p).filter((x) => !JSON.parse(b3.p).some((y) => JSON.stringify(y) === JSON.stringify(x))).map((x) => ({ id: x.id, title: x.title })) }));

  // N1c: a reload forgets the rail's memory
  await openPage(app, 'machina', true);
  const forgot = await app.evalJs(`JSON.stringify({ mem: window.wrizoRailMemory && window.wrizoRailMemory.get(), rail: ${RAILPINS} })`);
  // SUPERSEDED (Nick's ruling Nov 18: saved with the account; red by design in run 44408993606). The original, verbatim:
  // ok('N1c: a reload forgets the pins and the view (nothing was kept anywhere)', forgot === JSON.stringify({ mem: { pins: [], pinView: 'boxes' }, rail: null }), forgot);
  const keptN = JSON.parse(forgot);
  ok('N1c [successor]: a reload KEEPS the pins and the view (the Notebook then Top Drawer, boxes), and the rail draws them (all but the Project she is in, which shows once at the top)',
    JSON.stringify(keptN.mem) === JSON.stringify({ pins: ['notebook', ids.topDrawer], pinView: 'boxes' }) && !!keptN.rail && keptN.rail.view === 'boxes'
    && keptN.rail.pins.length >= 1 && keptN.rail.pins.every((p) => keptN.mem.pins.includes(p)), forgot);

  // ---- KEYS ----------------------------------------------------------------------------------------------------------------------------
  await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.focus()");
  await app.typeKeys('\n'); await sleep(600);
  const kOpen = await app.evalJs("!!document.querySelector('.desk-frame-cascade-anchor .wz-reorg-projects')");
  await app.evalJs(`document.querySelector('[data-reorg-pin-toggle="${ids.essays}"]')?.focus()`);
  await app.typeKeys('\n'); await sleep(200);
  const kPin = await app.evalJs(RAILPINS);
  await app.evalJs("document.activeElement && document.activeElement.blur(); document.body.focus()");
  await app.key('Escape'); await sleep(600);
  const kClosed = await app.evalJs("!document.querySelector('.desk-frame-cascade-anchor .wz-reorg-projects')");
  ok('K1: PROJECTS opens on Enter; Essays\' pin toggles on Enter (its box joins the rail); Escape from outside the pop-out closes it', kOpen && !!kPin && kPin.pins.includes(ids.essays) && kClosed, JSON.stringify({ kOpen, kPin, kClosed }));

  // ---- FLOOR ---------------------------------------------------------------------------------------------------------------------------
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  const floor = await app.evalJs(`(() => { const C = ${CONTRAST_FN};
    const boxes = [...document.querySelectorAll('.wz-reorg-box')].map((b) => { const s = getComputedStyle(b); return { t: b.textContent, r: C.ratio(C.rgb(s.color), C.rgb(s.backgroundColor)) }; }).filter((x) => x.t);
    const edges = [...document.querySelectorAll('.wz-reorg-box--row')].map((b) => { const s = getComputedStyle(b); return { w: s.borderTopWidth, r: C.ratio(C.rgb(s.borderTopColor), C.bgOf(b.parentElement)) }; });
    return { boxes, edges }; })()`);
  ok('F1: as drawn - every box\'s letters hold 4.5:1 on its colour, and every row box\'s 1 px edge holds 3:1 on the pop-out',
    !!floor && floor.boxes.length >= 5 && floor.boxes.every((b) => b.r >= 4.5) && floor.edges.length >= 4 && floor.edges.every((e) => e.w === '1px' && e.r >= 3), JSON.stringify(floor));
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(600);

  // ---- STEP 3: a Project's own list --------------------------------------------------------------------------------------------------
  const LIST = `(() => { const p = document.querySelector('.desk-frame-cascade-anchor .wz-reorg-list'); if (!p) return null;
    return { id: p.dataset.reorgList, name: document.querySelector('[data-reorg-list-name]')?.textContent || null, title: document.querySelector('.desk-frame-cascade-anchor .wz-cascade-panel-title')?.textContent,
      docs: [...p.querySelectorAll('[data-reorg-group="docs"] .wz-reorg-doc')].map((d) => ({ doc: d.dataset.reorgDoc, parts: Number(d.dataset.parts), rows: [...d.querySelectorAll('[data-entry-id]')].map((r) => [r.dataset.entryId, Number(r.dataset.depth), r.dataset.kind]) })),
      boards: [...p.querySelectorAll('[data-reorg-group="boards"] [data-entry-id]')].map((r) => [r.dataset.entryId, r.querySelector('[data-set-name]')?.textContent ?? null]),
      news: [...p.querySelectorAll('[data-new]')].map((b) => [b.dataset.new, b.textContent.replace('+', '').trim()]) }; })()`;
  const idsIn = (l) => (l ? [...new Set([...l.docs.flatMap((d) => d.rows.map((r) => r[0])), ...l.boards.map((b) => b[0])])].sort() : []);
  await openPage(app, 'machina', true);
  await sleep(2500);
  const store3 = await app.evalJs(STORE);
  await click('[data-reorg-rail] [data-reorg-where]'); await sleep(600);
  const l1 = await app.evalJs(LIST);
  const l1Pressed = await app.evalJs("document.querySelector('[data-reorg-rail] [data-reorg-where]')?.getAttribute('aria-pressed')");
  await click('[data-reorg-rail] [data-reorg-where]'); await sleep(600);
  const l1Closed = await app.evalJs(LIST);
  ok('L1: the where-she-is box opens Top Drawer\'s own list - its name in the head; two one-Part Docs, then its board under Boards with no doc; + New doc and + New board; pressed again it closes',
    !!l1 && l1.id === ids.topDrawer && l1.name === shell.words.root && JSON.stringify(l1.docs) === JSON.stringify([{ doc: 'rr-top-1', parts: 1, rows: [['rr-top-1', 0, 'page']] }, { doc: 'rr-top-2', parts: 1, rows: [['rr-top-2', 0, 'page']] }])
    && JSON.stringify(l1.boards) === JSON.stringify([['rr-top-b', null]]) && JSON.stringify(l1.news) === JSON.stringify([['doc', 'New doc'], ['board', 'New board']]) && l1Pressed === 'true' && l1Closed === null,
    JSON.stringify({ l1, l1Pressed, l1Closed: !!l1Closed }));
  // L2: pin Grants, then its pin opens its list
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  await click(`[data-reorg-pin-toggle="${ids.grants}"]`); await sleep(200);
  await click(`[data-reorg-rail] [data-reorg-pin="${ids.grants}"]`); await sleep(600);
  const l2 = await app.evalJs(LIST);
  ok('L2: Grants\' pin opens Grants\' list - Budget is ONE Doc, its three Parts and its board indented under it; Moodboards\' board is a Board with no doc, the set\'s name beside it',
    !!l2 && l2.id === ids.grants && JSON.stringify(l2.docs) === JSON.stringify([{ doc: ids.budget, parts: 3, rows: [['rr-g-1', 0, 'page'], ['rr-g-1', 1, 'page'], ['rr-g-2', 1, 'page'], ['rr-g-3', 1, 'page'], ['rr-g-b', 1, 'board']] }])
    && JSON.stringify(l2.boards) === JSON.stringify([['rr-m-b', 'Moodboards']]), JSON.stringify(l2));
  // L3 and L4: every row of All projects opens its list; together they reach every page and board of a Project or of the Notebook, once
  const rowIds = await app.evalJs("(() => { [...document.querySelectorAll('[data-reorg-rail] [data-category=\"reorg-projects\"]')].forEach((b) => b.click()); return true; })()").then(async () => { await sleep(600); return app.evalJs("[...document.querySelectorAll('[data-reorg-project]')].map((r) => r.dataset.reorgProject)"); });
  const lists = {};
  for (const pid of rowIds || []) {
    await app.evalJs(`(() => { if (!document.querySelector('.wz-reorg-projects')) document.querySelector('[data-reorg-rail] [data-category="reorg-projects"]')?.click(); })()`); await sleep(600);
    await click(`[data-reorg-project="${pid}"] .wz-reorg-row-open`); await sleep(600);
    lists[pid] = await app.evalJs(LIST);
  }
  ok('L3: a row of All projects opens its own list - the Notebook: its one page; Essays: no Docs and no boards',
    !!lists.notebook && lists.notebook.id === 'notebook' && JSON.stringify(idsIn(lists.notebook)) === JSON.stringify(['rr-j-1']) && !!lists[ids.essays] && lists[ids.essays].docs.length === 0 && lists[ids.essays].boards.length === 0,
    JSON.stringify({ notebook: lists.notebook, essays: lists[ids.essays] }));
  const want4 = ['rr-g-1', 'rr-g-2', 'rr-g-3', 'rr-g-b', 'rr-j-1', 'rr-m-b', 'rr-top-1', 'rr-top-2', 'rr-top-b'];
  const all4 = Object.values(lists).flatMap(idsIn);
  // SUPERSEDED (run 43644371795 on f0d3357b): it held FOUR lists, but P3 earlier in this run made the Project "Thesis", so All projects has five
  // rows (Thesis's list is empty). The original, verbatim:
  // ok(`L4: REACHABLE - the ${Object.keys(lists).length} lists reach every page and board of a Project or of the Notebook (${want4.length}), each in exactly one list; the two Unfiled entries in none`,
  //   Object.keys(lists).length === 4 && JSON.stringify([...all4].sort()) === JSON.stringify(want4) && !all4.includes('rr-l-1') && !all4.includes('rr-o-1'),
  ok(`L4 [successor]: REACHABLE - every row of All projects opens a list (${Object.keys(lists).length}: the four of the fixture and P3's Thesis), and together they reach every page and board of a Project or of the Notebook (${want4.length}), each in exactly one list; the two Unfiled entries in none`,
    Object.keys(lists).length === (rowIds || []).length && [ids.topDrawer, ids.grants, ids.essays, 'notebook'].every((k) => !!lists[k])
    && JSON.stringify([...all4].sort()) === JSON.stringify(want4) && !all4.includes('rr-l-1') && !all4.includes('rr-o-1'),
    JSON.stringify({ lists: Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, idsIn(v)])) }));
  const store3b = await app.evalJs(STORE);
  // SUPERSEDED (Nick's ruling Nov 18: a pin is saved; red in run 44408993606: L2 pins Grants inside this window, so the rail's copy changes). The original, verbatim:
  // ok('L7: opening the lists from the box, a pin and every row changes nothing stored', diffKeys(store3, store3b).length === 0, JSON.stringify(diffKeys(store3, store3b)));
  const c3 = railCopy(store3), c3b = railCopy(store3b);
  // compared key-sorted: the copy's key order is the merge's, not a fact she chose
  const canonJ = (v) => (Array.isArray(v) ? `[${v.map(canonJ).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonJ(v[k])}`).join(',')}}` : JSON.stringify(v ?? null));
  const withoutGrants = (c) => (c && c.rail ? canonJ({ ...c, rail: { ...c.rail, pins: Object.fromEntries(Object.entries(c.rail.pins || {}).filter(([k]) => k !== ids.grants)) } }) : String(c));
  ok('L7 [successor]: opening the lists from the box, a pin and every row changes nothing stored but L2\'s own act - the rail\'s copy, where only Grants\' pin changed (unpinned before, pinned after)',
    JSON.stringify(diffKeys(store3, store3b)) === JSON.stringify(['local:writer-studio-rail']) && withoutGrants(c3) === withoutGrants(c3b)
    && !(pinnedIn(c3) || []).includes(ids.grants) && (pinnedIn(c3b) || []).includes(ids.grants),
    JSON.stringify({ changed: diffKeys(store3, store3b), before: pinnedIn(c3), after: pinnedIn(c3b) }));
  // L5: a Part is a departure with the return chip, and the rail comes back open on the same list
  await click(`[data-reorg-rail] [data-reorg-pin="${ids.grants}"]`); await sleep(600);
  if (!(await app.evalJs(LIST))) { await click(`[data-reorg-rail] [data-reorg-pin="${ids.grants}"]`); await sleep(600); }
  await click('.wz-reorg-list [data-entry-id="rr-g-2"][data-depth="1"] .wz-reorg-list-open');
  await app.waitFor("location.hash === '#/page/rr-g-2' && !!document.querySelector('.forward-only-editor')", { label: 'the Part', timeout: 12000 }).catch(() => {});
  await sleep(900);
  const l5 = await app.evalJs(`({ hash: location.hash, chip: !!document.querySelector('.wz-back-to-board'), list: ${LIST} })`);
  ok('L5: opening Budget\'s second Part goes to it with the return chip, and the rail is still open on Grants\' list', l5.hash === '#/page/rr-g-2' && l5.chip && !!l5.list && l5.list.id === ids.grants, JSON.stringify({ hash: l5.hash, chip: l5.chip, list: l5.list && l5.list.id }));
  // B3: Box settings follows where she is (she is on a Grants page now)
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  const boxFor = await app.evalJs("document.querySelector('[data-box-settings]')?.dataset.boxSettings ?? null");
  ok('B3: on a Grants page, Box settings is Grants\'', boxFor === ids.grants, String(boxFor));
  // L6: + New board in Top Drawer's list, + New doc in Grants' (today's own route: an unborn page in the set)
  await openPage(app, 'machina', true);
  await click('[data-reorg-rail] [data-reorg-where]'); await sleep(600);
  await click('.wz-reorg-list [data-new="board"]'); await sleep(900);
  const l6a = await app.evalJs('location.hash');
  await openPage(app, 'machina', true);
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  await click(`[data-reorg-project="${ids.grants}"] .wz-reorg-row-open`); await sleep(600);
  await click('.wz-reorg-list [data-new="doc"]'); await sleep(900);
  const l6b = await app.evalJs('location.hash');
  // SUPERSEDED ((c), Fable, Nov 14, 3:52 pm: a new Doc is ALWAYS a Doc of its own; never into her first set). The original, verbatim:
  // ok('L6: + New board in Top Drawer\'s list opens an unborn board in its set; + New doc in Grants\' opens an unborn doc in its first set (today\'s route)',
  //   l6a === `#/page/new?kind=board&binder=${ids.topSet}` && l6b === `#/page/new?binder=${ids.budget}`, JSON.stringify({ l6a, l6b }));
  const setsNow = () => app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').filter((p) => p.drawerId === ${q(ids.grants)} && !p.deletedAt).map((p) => ({ id: p.id, title: p.title }))`);
  const grantsSets6 = await setsNow();
  const newSet6 = (/[?&]binder=([^&]+)/.exec(l6b) || [])[1];
  ok('L6 [successor]: + New board in Top Drawer\'s list opens an unborn board in its app-made set; + New doc in Grants\' (no app-made set) opens an unborn doc in a NEW set of Grants made by today\'s "+ New set" (titled Untitled), never in Budget, so the page is a Doc of its own',
    l6a === `#/page/new?kind=board&binder=${ids.topSet}` && /^#\/page\/new\?binder=/.test(l6b) && !!newSet6 && ![ids.budget, ids.moods].includes(newSet6)
    && grantsSets6.some((s) => s.id === newSet6 && s.title === 'Untitled'), JSON.stringify({ l6a, l6b, grantsSets6 }));
  // L8: + New board in Grants' list lands as a Board with no Doc (a new set of boards only); a new Doc abandoned leaves just its one empty set
  await openPage(app, 'machina', true);
  const before8 = await setsNow();
  const entries8 = await app.evalJs("localStorage.getItem('writer-studio-journal-entries')");
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  await click(`[data-reorg-project="${ids.grants}"] .wz-reorg-row-open`); await sleep(600);
  await click('.wz-reorg-list [data-new="board"]'); await sleep(900);
  const l8 = await app.evalJs('location.hash');
  await openPage(app, 'machina', true);   // she leaves the unborn board without a keystroke
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()');
  const after8 = await setsNow();
  const entries8b = await app.evalJs("localStorage.getItem('writer-studio-journal-entries')");
  const newSet8 = (/[?&]binder=([^&]+)/.exec(l8) || [])[1];
  const added8 = after8.filter((s) => !before8.some((b) => b.id === s.id));
  ok('L8: + New board in Grants\' list opens an unborn board in a NEW set (a set of boards only: a Board with no Doc); left without a keystroke, it leaves exactly that one empty set (titled Untitled) and no page',
    /^#\/page\/new\?kind=board&binder=/.test(l8) && !!newSet8 && ![ids.budget, ids.moods, newSet6].includes(newSet8) && added8.length === 1 && added8[0].id === newSet8 && added8[0].title === 'Untitled' && entries8 === entries8b,
    JSON.stringify({ l8, added8, entriesSame: entries8 === entries8b }));

  // ---- STEP 4: Box settings ----------------------------------------------------------------------------------------------------------
  await openPage(app, 'machina', true);
  await sleep(2500);
  const store4 = await app.evalJs(STORE);
  await sleep(1500);
  const store4c = await app.evalJs(STORE);
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  const BOX = `(() => { const s = document.querySelector('[data-box-settings]'); const w = document.querySelector('[data-reorg-rail] [data-reorg-where] .wz-reorg-box'); const r = document.querySelector('[data-reorg-project="${ids.topDrawer}"] .wz-reorg-box');
    const cs = (e) => e && { text: e.textContent, bg: getComputedStyle(e).backgroundColor, ink: getComputedStyle(e).color, pic: e.hasAttribute('data-box-picture') && /^url\\("data:image\\//.test(getComputedStyle(e).backgroundImage) };
    return { id: s?.dataset.boxSettings ?? null, open: s?.dataset.open ?? null, body: !!s?.querySelector('.wz-reorg-box-settings-body'), where: cs(w), row: cs(r) }; })()`;
  const b1closed = await app.evalJs(BOX);
  await click('.wz-reorg-box-settings-head'); await sleep(200);
  await app.evalJs("(() => { const i = document.querySelector('[data-box-letters]'); i?.focus(); i?.select(); })()");
  await app.typeKeys('xy'); await sleep(200);
  const bLetters = await app.evalJs(BOX);
  await click('[data-box-no-letters]'); await sleep(150);
  const bNone = await app.evalJs(BOX);
  await click('[data-swatch="#B9A03A"]'); await sleep(150);
  const bBrass = await app.evalJs(BOX);
  await app.evalJs("(() => { const i = document.querySelector('[data-box-own-colour]'); if (!i) return; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '#777777'); i.dispatchEvent(new Event('input', { bubbles: true })); })()"); await sleep(150);
  const bOwn = await app.evalJs(BOX);
  await app.evalJs(`(async () => { const c = document.createElement('canvas'); c.width = 4; c.height = 4; const g = c.getContext('2d'); g.fillStyle = '#3366cc'; g.fillRect(0, 0, 4, 4);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png')); const dt = new DataTransfer(); dt.items.add(new File([blob], 'box.png', { type: 'image/png' }));
    const i = document.querySelector('[data-box-picture-input]'); if (!i) return; i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true })); })()`); await sleep(500);
  const bPic = await app.evalJs(BOX);
  await click('[data-box-remove-picture]'); await sleep(150);
  const bNoPic = await app.evalJs(BOX);
  ok('B1: Box settings is one closed drop-down at the foot of PROJECTS, for Top Drawer; open, it sets the letters (XY on the rail and the row), No letters, brass, her own colour, a picture (the box shows it) and Remove the picture',
    b1closed.id === ids.topDrawer && b1closed.open === 'false' && !b1closed.body
    && bLetters.where?.text === 'XY' && bLetters.row?.text === 'XY' && bNone.where?.text === '' && bBrass.where?.bg === 'rgb(185, 160, 58)' && bOwn.where?.bg === 'rgb(119, 119, 119)'
    && bPic.where?.pic === true && bPic.row?.pic === true && bNoPic.where?.pic === false && bNoPic.where?.bg === 'rgb(119, 119, 119)',
    JSON.stringify({ b1closed, bLetters: bLetters.where, bNone: bNone.where, bBrass: bBrass.where, bOwn: bOwn.where, bPic: bPic.where, bNoPic: bNoPic.where }));
  const store4b = await app.evalJs(STORE);
  const boxMem = await app.evalJs(`JSON.stringify(window.wrizoRailMemory && window.wrizoRailMemory.boxes && window.wrizoRailMemory.boxes()[${q(ids.topDrawer)}])`);
  // SUPERSEDED (Nick's ruling Nov 18: each Project's box - letters, colour, picture - is SAVED WITH THE ACCOUNT; red by design in run 44408993606,
  // acted = local:writer-studio-rail). The original, verbatim:
  // ok('B2: none of it is stored - localStorage and sessionStorage byte-identical (the control changed: ' + (diffKeys(store4, store4c).join(',') || 'nothing') + '); the memory holds it (no letters, #777777, no picture)',
  //   diffKeys(store4c, store4b).length === 0 && diffKeys(store4, store4c).length === 0 && boxMem === JSON.stringify({ letters: '', colour: '#777777' }), JSON.stringify({ acted: diffKeys(store4c, store4b), boxMem }));
  const copy4 = railCopy(store4b);
  const box4 = copy4 && copy4.rail && copy4.rail.boxes ? copy4.rail.boxes[ids.topDrawer] : null;
  ok('B2 [successor]: the look is stored in the rail\'s own copy and nowhere else - only writer-studio-rail changed (the control changed: ' + (diffKeys(store4, store4c).join(',') || 'nothing') + '); it holds no letters, #777777 and the picture removed, nothing waiting to upload; the memory holds it (no letters, #777777, no picture)',
    JSON.stringify(diffKeys(store4c, store4b)) === JSON.stringify(['local:writer-studio-rail']) && diffKeys(store4, store4c).length === 0
    && !!box4 && box4.letters === '' && box4.colour === '#777777' && box4.picture === '' && Object.keys(copy4.pending || {}).length === 0
    && boxMem === JSON.stringify({ letters: '', colour: '#777777' }), JSON.stringify({ acted: diffKeys(store4c, store4b), box4, pending: copy4 && Object.keys(copy4.pending || {}), boxMem }));
  await openPage(app, 'machina', true);
  const b2r = await app.evalJs(`JSON.stringify({ boxes: window.wrizoRailMemory && typeof window.wrizoRailMemory.boxes === 'function' ? window.wrizoRailMemory.boxes() : null, letters: document.querySelector('[data-reorg-rail] [data-reorg-where] .wz-reorg-box')?.textContent })`);
  // SUPERSEDED (Nick's ruling Nov 18: saved with the account; red by design in run 44408993606). The original, verbatim:
  // ok('B2b: a reload forgets the box\'s look (its letters are derived again)', !!shell && b2r === JSON.stringify({ boxes: {}, letters: letters(shell.words.root) }), b2r);
  const kept2 = JSON.parse(b2r);
  ok('B2b [successor]: a reload KEEPS the box\'s look - the memory reads no letters and #777777 (no picture), and the rail\'s box draws no letters',
    !!shell && !!kept2.boxes && JSON.stringify(kept2.boxes[ids.topDrawer]) === JSON.stringify({ letters: '', colour: '#777777' }) && kept2.letters === '', b2r);
  // F2: the letters hold 4.5:1 on every swatch and on a mid-grey of her own
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  await click('.wz-reorg-box-settings-head'); await sleep(200);
  // F2's premise is a box that DRAWS letters: since Nov 18 the reload above keeps B1's "No letters", so she gives it letters again first
  // (red in run 44408993606: every swatch read text ""; the check below is unchanged)
  await app.evalJs("(() => { const i = document.querySelector('[data-box-letters]'); i?.focus(); i?.select(); })()");
  await app.typeKeys('xy'); await sleep(200);
  const f2 = [];
  for (const sw of ['#C9CED3', '#6A727B', '#41658A', '#B9A03A', '#FF9800', '#777777']) {
    if (sw === '#777777') await app.evalJs("(() => { const i = document.querySelector('[data-box-own-colour]'); if (!i) return; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '#777777'); i.dispatchEvent(new Event('input', { bubbles: true })); })()");
    else await click(`[data-swatch="${sw}"]`);
    await sleep(150);
    f2.push(await app.evalJs(`(() => { const C = ${CONTRAST_FN}; const b = document.querySelector('[data-reorg-rail] [data-reorg-where] .wz-reorg-box'); if (!b) return null; const s = getComputedStyle(b); return { sw: ${q(sw)}, text: b.textContent, r: C.ratio(C.rgb(s.color), C.rgb(s.backgroundColor)) }; })()`));
  }
  ok('F2: as drawn - the letters hold 4.5:1 on all five swatches (brass among them) and on a mid-grey of her own (#777777)', f2.length === 6 && f2.every((x) => !!x && !!x.text && x.r >= 4.5), JSON.stringify(f2));
  await app.key('Escape'); await sleep(600);

  // ---- STEP 5: DOCS ------------------------------------------------------------------------------------------------------------------
  await openPage(app, 'machina', true);
  await click('[data-reorg-rail] [data-category="reorg-docs"]'); await sleep(600);
  const DOCS = `(() => { const p = document.querySelector('.desk-frame-cascade-anchor .wz-reorg-docs'); if (!p) return null;
    return { kinds: [...p.querySelectorAll('[data-new-kind]')].map((b) => [b.dataset.newKind, b.textContent.replace(/[+›]/g, '').trim()]),
      recent: [...p.querySelectorAll('[data-reorg-group="recent"] [data-entry-id]')].map((r) => [r.dataset.entryId, r.querySelector('.wz-reorg-row-meta')?.textContent]),
      defaults: [...p.querySelectorAll('[data-reorg-default]')].map((d) => [d.dataset.reorgDefault, d.querySelector('[aria-pressed="true"]')?.dataset.toggle]) }; })()`;
  const d0 = await app.evalJs(DOCS);
  const routes = {};
  for (const k of ['blank', 'screenplay', 'research-paper', 'board', 'more']) {
    await openPage(app, 'machina', true);
    await click('[data-reorg-rail] [data-category="reorg-docs"]'); await sleep(600);
    await click(`[data-new-kind="${k}"]`); await sleep(900);
    routes[k] = await app.evalJs('location.hash');
  }
  const S = ids.topSet;
  // SUPERSEDED (run 43649979289 on 15209b6e, both legs): today's Screenplay preset and research-paper deck are BORN at once (the address moves
  // to /page/<id>), so their unborn address is never read; the successor reads the page they made. The original, verbatim:
  // ok('D1: NEW DOC - Blank, Screenplay, Research paper, Board, More kinds; each through today\'s own route into Top Drawer\'s set (a preset, a preset, the research-paper deck, a new board, the library)',
  //   !!d0 && JSON.stringify(d0.kinds.map((k) => k[0])) === JSON.stringify(['blank', 'screenplay', 'research-paper', 'board', 'more']) && d0.kinds[3][1] === 'Board'
  //   && routes.blank === `#/page/new?binder=${S}` && routes.screenplay === `#/page/new?binder=${S}&structure=screenplay`
  //   && routes['research-paper'] === `#/page/new?kind=board&binder=${S}&deck=research-paper` && routes.board === `#/page/new?kind=board&binder=${S}`
  //   && routes.more === `#/page/new?kind=board&binder=${S}&deck=library`, JSON.stringify({ kinds: d0 && d0.kinds, routes }));
  const bornOf = (hash) => app.evalJs(`(() => { const m = /^#\\/page\\/([^/?]+)$/.exec(${q(hash)}); if (!m || m[1] === 'new') return null;
    const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === m[1]); return e ? { projectId: e.projectId ?? null, pageType: e.pageType ?? null, script: !!e.script } : { missing: m[1] }; })()`);
  const bornScreen = await bornOf(routes.screenplay), bornResearch = await bornOf(routes['research-paper']);
  // SUPERSEDED (PRESETS-B, Nov 25; Fable 3:25 pm: the Guide's door is New doc's row after the kinds and before Board): the list gains 'guide'
  // and Board moves one down. The successor before this one, verbatim:
  // ok('D1 [successor]: NEW DOC - Blank, Screenplay, Research paper, Board, More kinds, each through today\'s own route into Top Drawer\'s set: Blank, Board and More kinds as unborn pages there (a preset, a new board, the library); Screenplay and Research paper as today\'s preset and deck, which make their page at once IN that set (a screenplay page; the research-paper deck\'s board)',
  //   !!d0 && JSON.stringify(d0.kinds.map((k) => k[0])) === JSON.stringify(['blank', 'screenplay', 'research-paper', 'board', 'more']) && d0.kinds[3][1] === 'Board'
  //   && routes.blank === `#/page/new?binder=${S}` && routes.board === `#/page/new?kind=board&binder=${S}` && routes.more === `#/page/new?kind=board&binder=${S}&deck=library`
  //   && !!bornScreen && bornScreen.projectId === S && bornScreen.pageType !== 'board' && !!bornResearch && bornResearch.projectId === S && bornResearch.pageType === 'board',
  //   JSON.stringify({ kinds: d0 && d0.kinds, routes, bornScreen, bornResearch }));
  ok('D1 [successor 2]: NEW DOC - Blank, Screenplay, Research paper, Guide, Board, More kinds; the Guide opens its own panel (its check is reorg-guide-unit.mjs) and the rest go each through today\'s own route into Top Drawer\'s set: Blank, Board and More kinds as unborn pages there (a preset, a new board, the library); Screenplay and Research paper as today\'s preset and deck, which make their page at once IN that set (a screenplay page; the research-paper deck\'s board)',
    !!d0 && JSON.stringify(d0.kinds.map((k) => k[0])) === JSON.stringify(['blank', 'screenplay', 'research-paper', 'guide', 'board', 'more']) && d0.kinds[3][1] === 'Guide' && d0.kinds[4][1] === 'Board'
    && routes.blank === `#/page/new?binder=${S}` && routes.board === `#/page/new?kind=board&binder=${S}` && routes.more === `#/page/new?kind=board&binder=${S}&deck=library`
    && !!bornScreen && bornScreen.projectId === S && bornScreen.pageType !== 'board' && !!bornResearch && bornResearch.projectId === S && bornResearch.pageType === 'board',
    JSON.stringify({ kinds: d0 && d0.kinds, routes, bornScreen, bornResearch }));
  // D2: Recent - touch three pages in a known order through the app's own seam, then read
  // (the open page re-saves itself ~1.1 s after it mounts, so the touch comes after the page settles and with no reload after it)
  await openPage(app, 'machina', true);
  await sleep(2500);
  await app.evalJs("window.wrizoTouchInOrder && window.wrizoTouchInOrder(['rr-g-3', 'rr-l-1', 'rr-top-2'])");
  await sleep(200);
  await click('[data-reorg-rail] [data-category="reorg-docs"]'); await sleep(600);
  const d2 = await app.evalJs(DOCS);
  // SUPERSEDED (POLISH, Nov 20; Fable 12:15 pm, "long DOCS lists (Recent) show five with a scrollbar and a sort"): Recent holds up to 25 Docs
  // now, so EXACTLY three rows is no longer the behaviour; the successor reads the same three leading the list (reorg-docs-recent.mjs covers
  // the box, the scroll and the sort). The original, verbatim:
  // ok('D2: RECENT - her three most recently changed Docs, newest first (A second note, A loose page, Budget three), each with its Project and its words',
  //   !!d2 && JSON.stringify(d2.recent.map((r) => r[0])) === JSON.stringify(['rr-top-2', 'rr-l-1', 'rr-g-3'])
  //   && d2.recent[0][1] === `${shell ? shell.words.root : '?'} · 3 words` && d2.recent[1][1] === 'Unfiled · 3 words' && d2.recent[2][1] === 'Grants · 2 words', JSON.stringify(d2 && d2.recent));
  ok('D2 [successor]: RECENT - her most recently changed Docs, newest first: the three touched last lead it (A second note, A loose page, Budget three), each with its Project and its words',
    !!d2 && d2.recent.length >= 3 && JSON.stringify(d2.recent.slice(0, 3).map((r) => r[0])) === JSON.stringify(['rr-top-2', 'rr-l-1', 'rr-g-3'])
    && d2.recent[0][1] === `${shell ? shell.words.root : '?'} · 3 words` && d2.recent[1][1] === 'Unfiled · 3 words' && d2.recent[2][1] === 'Grants · 2 words', JSON.stringify(d2 && d2.recent));
  await click('[data-reorg-group="recent"] [data-entry-id="rr-g-3"] .wz-reorg-list-open');
  await app.waitFor("location.hash === '#/page/rr-g-3' && !!document.querySelector('.forward-only-editor')", { label: 'the recent doc', timeout: 12000 }).catch(() => {});
  await sleep(900);
  const d2b = await app.evalJs(`({ hash: location.hash, chip: !!document.querySelector('.wz-back-to-board'), docs: !!document.querySelector('.desk-frame-cascade-anchor .wz-reorg-docs') })`);
  ok('D2b: a Recent row is a departure with the return chip, and DOCS comes back open', d2b.hash === '#/page/rr-g-3' && d2b.chip && d2b.docs, JSON.stringify(d2b));
  // D3: the two defaults are today's saved settings, and only that key changes
  await openPage(app, 'machina', true);
  await sleep(2500);
  await click('[data-reorg-rail] [data-category="reorg-docs"]'); await sleep(600);
  const ws0 = await app.evalJs("JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}')");
  const st0 = await app.evalJs(STORE);
  const tw = ws0.typewriter === true, pr = ws0.instrumentsOn !== false;
  await click(`[data-reorg-default="typewriter"] [data-toggle="${tw ? 'off' : 'on'}"]`); await sleep(200);
  await click(`[data-reorg-default="progress"] [data-toggle="${pr ? 'off' : 'on'}"]`); await sleep(200);
  const ws1 = await app.evalJs("JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}')");
  const st1 = await app.evalJs(STORE);
  const d3 = await app.evalJs(DOCS);
  // SUPERSEDED (mutant d3-progress-writes-metric SURVIVED it, run 43650287019: with nothing stored before the press, "nothing else changed"
  // compared no key at all). The original, verbatim:
  // ok('D3: PAGE DEFAULTS - each switch flips today\'s own setting (typewriter, instrumentsOn) and nothing else is stored',
  //   ws1.typewriter === !tw && ws1.instrumentsOn === !pr && Object.keys(ws0).every((k) => k === 'typewriter' || k === 'instrumentsOn' || JSON.stringify(ws1[k]) === JSON.stringify(ws0[k]))
  //   && JSON.stringify(diffKeys(st0, st1)) === JSON.stringify(['local:wrizo-writing-settings']) && !!d3 && JSON.stringify(d3.defaults) === JSON.stringify([['typewriter', tw ? 'off' : 'on'], ['progress', pr ? 'off' : 'on']]),
  //   JSON.stringify({ ws0: { tw: ws0.typewriter, pr: ws0.instrumentsOn }, ws1: { tw: ws1.typewriter, pr: ws1.instrumentsOn }, changed: diffKeys(st0, st1), d3: d3 && d3.defaults }));
  await click(`[data-reorg-default="typewriter"] [data-toggle="${tw ? 'on' : 'off'}"]`); await click(`[data-reorg-default="progress"] [data-toggle="${pr ? 'on' : 'off'}"]`); await sleep(200);
  // the successor: with the settings now STORED whole (today's setWritingSettings writes the whole object), each switch is pressed again, one at a
  // time, and every other stored key must keep its value
  const wsA = await app.evalJs("JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}')");
  await click(`[data-reorg-default="typewriter"] [data-toggle="${wsA.typewriter ? 'off' : 'on'}"]`); await sleep(200);
  const wsB = await app.evalJs("JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}')");
  await click(`[data-reorg-default="progress"] [data-toggle="${wsB.instrumentsOn === false ? 'on' : 'off'}"]`); await sleep(200);
  const wsC = await app.evalJs("JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}')");
  const others = (a, b, k) => Object.keys({ ...a, ...b }).filter((x) => x !== k && JSON.stringify(a[x]) !== JSON.stringify(b[x]));
  // SUPERSEDED (Free Write = Typewriter, Nick, Nov 19, 2:10 pm; Fable's ruling): PAGE DEFAULTS no longer carries a Typewriter mode switch (the Typewriter switch left every stage); the original D3 [successor], verbatim:
  // ok('D3 [successor]: PAGE DEFAULTS - each switch flips today\'s own setting and nothing else: with the settings stored whole, Typewriter mode changes only `typewriter`, Progress bars only `instrumentsOn` (every other stored key keeps its value); the first presses stored nothing but today\'s settings key',
  // Object.keys(wsA).length > 4 && wsB.typewriter === !wsA.typewriter && others(wsA, wsB, 'typewriter').length === 0 && wsC.instrumentsOn === !(wsB.instrumentsOn !== false) && others(wsB, wsC, 'instrumentsOn').length === 0
  // && JSON.stringify(diffKeys(st0, st1)) === JSON.stringify(['local:wrizo-writing-settings']) && !!d3 && JSON.stringify(d3.defaults) === JSON.stringify([['typewriter', tw ? 'off' : 'on'], ['progress', pr ? 'off' : 'on']]),
  // JSON.stringify({ keys: Object.keys(wsA).length, tw: [wsA.typewriter, wsB.typewriter], pr: [wsB.instrumentsOn, wsC.instrumentsOn], twOthers: others(wsA, wsB, 'typewriter'), prOthers: others(wsB, wsC, 'instrumentsOn'), changed: diffKeys(st0, st1) }));
  // successor: PAGE DEFAULTS is the Progress bars switch alone; pressing it flips only `instrumentsOn` (every other stored key, `typewriter` included, keeps its value), and the Typewriter row is not there to press
  const d3tw = await app.evalJs("document.querySelectorAll('[data-reorg-default=\"typewriter\"]').length");
  ok('D3 [Free Write = Typewriter successor]: PAGE DEFAULTS offers Progress bars alone - there is no Typewriter mode switch (' + d3tw + ' found) - and pressing it changes only `instrumentsOn`: every other stored key (the old `typewriter` value included) keeps its value',
    d3tw === 0 && !!d3 && JSON.stringify(d3.defaults) === JSON.stringify([['progress', pr ? 'off' : 'on']]) && wsC.instrumentsOn === !(wsB.instrumentsOn !== false) && others(wsB, wsC, 'instrumentsOn').length === 0 && wsA.typewriter === wsC.typewriter,
    JSON.stringify({ d3tw, defaults: d3 && d3.defaults, pr: [wsB.instrumentsOn, wsC.instrumentsOn], prOthers: others(wsB, wsC, 'instrumentsOn'), twKept: [wsA.typewriter, wsC.typewriter] }));
  // SUPERSEDED (Fable, Nov 20, 12:15 pm: the session's writing settings are saved to the ACCOUNT, switch on or off - store/writingPref.ts mirrors the settings key into the `writing` fact of the existing prefs key,
  // so a press now stores the settings key AND that key); it was written against the Typewriter row that Free Write = Typewriter has since removed, so it is parked beside main's own successor and COMBINED with it below.
  // The original [successor 2], verbatim:
  // ok('D3 [successor 2]: PAGE DEFAULTS - each switch flips today\'s own setting and nothing else: with the settings stored whole, Typewriter mode changes only `typewriter`, Progress bars only `instrumentsOn` (every other stored key keeps its value); the first presses stored nothing but today\'s settings key and its account mirror, the existing prefs key (a `writing` fact stamped per setting)',
  //   Object.keys(wsA).length > 4 && wsB.typewriter === !wsA.typewriter && others(wsA, wsB, 'typewriter').length === 0 && wsC.instrumentsOn === !(wsB.instrumentsOn !== false) && others(wsB, wsC, 'instrumentsOn').length === 0
  //   && JSON.stringify(diffKeys(st0, st1)) === JSON.stringify(['local:wrizo-reorg-prefs', 'local:wrizo-writing-settings']) && !!mirror && Object.keys(mirror.fieldAt || {}).every((k) => k === 'typewriter' || k === 'instrumentsOn' || k in wsA) && mirror.typewriter === wsC.typewriter && mirror.instrumentsOn === wsC.instrumentsOn && !!d3 && JSON.stringify(d3.defaults) === JSON.stringify([['typewriter', tw ? 'off' : 'on'], ['progress', pr ? 'off' : 'on']]),
  //   JSON.stringify({ keys: Object.keys(wsA).length, tw: [wsA.typewriter, wsB.typewriter], pr: [wsB.instrumentsOn, wsC.instrumentsOn], twOthers: others(wsA, wsB, 'typewriter'), prOthers: others(wsB, wsC, 'instrumentsOn'), changed: diffKeys(st0, st1) }));
  // [successor 3: Free Write = Typewriter + the account mirror] BOTH rulings at once: main's successor above (the Typewriter row is gone, PAGE DEFAULTS is Progress bars alone, only `instrumentsOn` changes) AND the account's: the press stored the settings key
  // and its mirror, the existing prefs key (a `writing` fact stamped per setting), and no other key. The mirror rule is one pure function, so it can be shown to FAIL (the mutant).
  const mirror = await app.evalJs("(() => { try { return (JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}')).writing || null; } catch { return null; } })()");
  const mirrorKept = (changed, m, ws) => JSON.stringify(changed) === JSON.stringify(['local:wrizo-reorg-prefs', 'local:wrizo-writing-settings']) && !!m && m.instrumentsOn === ws.instrumentsOn && Object.keys(m.fieldAt || {}).every((k) => k in ws) && !('typewriter' in (m.fieldAt || {}));
  ok('D3 [successor 3: Free Write = Typewriter + account mirror]: PAGE DEFAULTS is Progress bars alone (no Typewriter row), and the press stored the settings key and its account mirror (the existing prefs key, a `writing` fact whose `instrumentsOn` follows the switch and whose stamps name only settings that exist; `typewriter` is not among them) and no other key',
    d3tw === 0 && mirrorKept(diffKeys(st0, st1), mirror, wsC),
    JSON.stringify({ d3tw, changed: diffKeys(st0, st1), mirror: mirror && { instrumentsOn: mirror.instrumentsOn, fieldAt: Object.keys(mirror.fieldAt || {}) } }));
  ok('D3 [successor 3] MUTANT: the mirror rule catches a press that stores a third key, a mirror that does not follow the switch, and a stamp for a setting that does not exist; and passes the right shape',
    mirrorKept(['local:wrizo-reorg-prefs', 'local:wrizo-writing-settings'], { instrumentsOn: false, fieldAt: { instrumentsOn: 'x' } }, { instrumentsOn: false, typewriter: true }) === true
    && mirrorKept(['local:wrizo-reorg-prefs', 'local:wrizo-writing-settings', 'local:other'], { instrumentsOn: false, fieldAt: { instrumentsOn: 'x' } }, { instrumentsOn: false }) === false
    && mirrorKept(['local:wrizo-reorg-prefs', 'local:wrizo-writing-settings'], { instrumentsOn: true, fieldAt: { instrumentsOn: 'x' } }, { instrumentsOn: false }) === false
    && mirrorKept(['local:wrizo-reorg-prefs', 'local:wrizo-writing-settings'], { instrumentsOn: false, fieldAt: { nonsense: 'x' } }, { instrumentsOn: false }) === false
    && mirrorKept(['local:wrizo-writing-settings'], { instrumentsOn: false, fieldAt: { instrumentsOn: 'x' } }, { instrumentsOn: false }) === false,
    'mirrorKept over synthetic inputs');
  await click(`[data-reorg-default="typewriter"] [data-toggle="${wsA.typewriter ? 'on' : 'off'}"]`); await click(`[data-reorg-default="progress"] [data-toggle="${wsB.instrumentsOn === false ? 'off' : 'on'}"]`); await sleep(200);

  // ---- STEP 6: UNFILED and the Trash ---------------------------------------------------------------------------------------------------
  await openPage(app, 'machina', true);
  await click('[data-reorg-rail] [data-category="reorg-unfiled"]'); await sleep(600);
  const UNF = `(() => { const p = document.querySelector('.desk-frame-cascade-anchor .wz-reorg-unfiled'); if (!p) return null;
    return { count: document.querySelector('[data-reorg-count]')?.textContent, rows: [...p.querySelectorAll('[data-entry-id]')].map((r) => r.dataset.entryId).sort(),
      acts: [...p.querySelectorAll('[data-entry-id]')].map((r) => [!!r.querySelector('[data-unfiled-file]'), !!r.querySelector('[data-unfiled-trash]')]),
      trashLast: p.lastElementChild?.matches('[data-reorg-trash]') || p.querySelector('[data-reorg-trash]') === [...p.children].filter((c) => !c.classList.contains('board-sheet')).pop(), trashText: p.querySelector('[data-reorg-trash]')?.textContent.replace('›', '').trim() }; })()`;
  const u1 = await app.evalJs(UNF);
  ok('U1: UNFILED lists the writing with no Project and only that - the loose page and the page in a set with no Drawer (never the Notebook\'s page); the head counts 2',
    !!u1 && JSON.stringify(u1.rows) === JSON.stringify(['rr-l-1', 'rr-o-1']) && u1.count === '2' && u1.acts.every((a) => a[0] && a[1]), JSON.stringify(u1));
  ok('U3: the Trash is the row at the very foot, and carries no count (today\'s law for the Trash)', !!u1 && u1.trashLast && u1.trashText === 'Trash', JSON.stringify(u1 && { trashLast: u1.trashLast, trashText: u1.trashText }));
  await click('[data-unfiled-file="rr-l-1"]'); await sleep(400);
  const sheet = await app.evalJs("!!document.querySelector('.desk-frame-cascade-anchor .board-sheet, .board-sheet')");
  await app.key('Escape'); await sleep(600);
  if (!(await app.evalJs("!!document.querySelector('.wz-reorg-unfiled:not([data-leaving])') && !document.querySelector('.wz-cascade-panel[data-leaving]')"))) { await click('[data-reorg-rail] [data-category="reorg-unfiled"]'); await sleep(600); }
  await click('[data-unfiled-trash="rr-o-1"]'); await sleep(300);
  const asked = await app.evalJs("!!document.querySelector('.wz-delete-dialog')");
  await click('.wz-delete-dialog .wz-delete-go'); await sleep(600);
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()');
  const gone = await app.evalJs("(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')).find((x) => x.id === 'rr-o-1'); return { deleted: !!(e && e.deletedAt), rows: [...document.querySelectorAll('.wz-reorg-unfiled [data-entry-id]')].map((r) => r.dataset.entryId) }; })()");
  ok('U2: File opens today\'s Add to… sheet; Trash asks first (today\'s gate) and, confirmed, trashes that entry, which leaves Unfiled', sheet && asked && gone.deleted && JSON.stringify(gone.rows) === JSON.stringify(['rr-l-1']), JSON.stringify({ sheet, asked, gone }));
  await click('[data-reorg-trash]'); await sleep(900);
  // today's Trash is the system board openTrashBoard finds or makes (the same door TrashPanel opens): read its id the way the app does
  const trashAt = await app.evalJs("({ hash: location.hash, trashBoard: !!document.querySelector('[data-system-board=\"trash\"], .board-trash, [data-board-kind=\"trash\"]') })");
  ok('U3b: the Trash row opens today\'s Trash (a board page that is not the page she was on)', /^#\/page\/(?!rr-top-1$)/.test(trashAt.hash), JSON.stringify(trashAt));
  // U4: reachable, whole - every list, the Notebook's and Unfiled together reach every page and board the fixture made (rr-o-1 was trashed above)
  await openPage(app, 'machina', true);
  await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
  const rows4 = await app.evalJs("[...document.querySelectorAll('[data-reorg-project]')].map((r) => r.dataset.reorgProject)");
  const seen = [];
  for (const pid of rows4 || []) {
    await app.evalJs(`(() => { if (!document.querySelector('.wz-reorg-projects')) document.querySelector('[data-reorg-rail] [data-category="reorg-projects"]')?.click(); })()`); await sleep(600);
    await click(`[data-reorg-project="${pid}"] .wz-reorg-row-open`); await sleep(600);
    seen.push(...idsIn(await app.evalJs(LIST)));
  }
  await click('[data-reorg-rail] [data-category="reorg-unfiled"]'); await sleep(600);
  const unf4 = await app.evalJs(UNF);
  seen.push(...(unf4 ? unf4.rows : []));
  const made = ['rr-g-1', 'rr-g-2', 'rr-g-3', 'rr-g-b', 'rr-j-1', 'rr-l-1', 'rr-m-b', 'rr-top-1', 'rr-top-2', 'rr-top-b'];
  // SUPERSEDED (run 43649979289 on 15209b6e, both legs): it held the FIXTURE's list, but D1 made two real pages earlier in this run (today's
  // Screenplay preset and research-paper deck are born at once) and the rail reached them too. The original, verbatim:
  // ok(`U4: REACHABLE, whole - the ${(rows4 || []).length} Project lists and Unfiled together reach every page and board the fixture made (${made.length}; the one trashed above is in the Trash), each once`,
  //   JSON.stringify([...seen].sort()) === JSON.stringify(made), JSON.stringify([...seen].sort()));
  // the successor reads the whole population from storage: every page and board that is not trashed, not a system board (the Journal's, the
  // Trash's) and not a paired plan board (no page carries a planBoardId in this run)
  const every4 = await app.evalJs(`(() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const paired = new Set(es.map((e) => e.planBoardId).filter(Boolean));
    return es.filter((e) => !e.deletedAt && !e.purgedAt && !paired.has(e.id) && !(e.pageType === 'board' && JSON.stringify(e.boxes || []).includes('"systemKind"'))).map((e) => e.id).sort(); })()`);
  ok(`U4 [successor]: REACHABLE, whole - the ${(rows4 || []).length} Project lists and Unfiled together reach EVERY live page and board in storage (${(every4 || []).length}: the fixture's ${made.length} with rr-o-1 in the Trash, and what this run made), each exactly once`,
    JSON.stringify([...seen].sort()) === JSON.stringify(every4) && made.every((id) => seen.includes(id)) && !seen.includes('rr-o-1'), JSON.stringify({ seen: [...seen].sort(), every4 }));
  await app.key('Escape'); await sleep(600);

  // ---- PAGE ----------------------------------------------------------------------------------------------------------------------------
  const scaleKeep = {};
  for (const [w, h] of [[1366, 768], [1920, 1080], [2000, 1200]]) {
    await app.emulateDpr(1, w, h);
    await openPage(app, 'machina', false);
    const off = await app.evalJs(PAGE);
    const barOff = await app.evalJs(BAR);
    await openPage(app, 'machina', true);
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (e) e.__reorgRails = 1; })()");
    const rest = await app.evalJs(PAGE);
    const barOn = await app.evalJs(BAR);
    const g = barOn != null && barOff != null ? Math.round((barOn - barOff) * 10) / 10 : null;
    scaleKeep[w] = { off, rest, g };
    await click('[data-reorg-rail] [data-category="reorg-projects"]'); await sleep(600);
    const open = await app.evalJs(PAGE);
    await click(`[data-reorg-pin-toggle="${ids.grants}"]`); await click('[data-reorg-pin-toggle="notebook"]'); await click(`[data-reorg-pin-toggle="${ids.essays}"]`); await sleep(200);
    const pinsBoxes = await app.evalJs(PAGE);
    await click('[data-pin-view-btn="list"]'); await sleep(200);
    const pinsList = await app.evalJs(PAGE);
    await click('.wz-reorg-box-settings-head'); await sleep(300);
    const boxOpen = await app.evalJs(PAGE);
    await click('[data-reorg-rail] [data-reorg-where]'); await sleep(600);
    const listOpen = await app.evalJs(PAGE);
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(600);
    const closed = await app.evalJs(PAGE);
    const same = await app.evalJs("document.querySelector('.forward-only-editor')?.__reorgRails === 1");
    // SUPERSEDED (step 3 and 4 add two states; the original, verbatim):
    // ok(`G1 [${w}]: the page's rect is the same switch off, on at rest, PROJECTS open, pins as boxes, as a list, and closed (${off}); the editor is the same node throughout`,
    //   !!off && [rest, open, pinsBoxes, pinsList, closed].every((r) => r === off) && same, JSON.stringify({ off, rest, open, pinsBoxes, pinsList, closed, same }));
    // SUPERSEDED (the chrome scale (arbor/reorg-scale 0c8df64d, train H; Fable, Nov 21 11:45 am: one chrome scale from the window's width / 1366, Machina under the reorg only;
  // pass 2 REAL 2, cleared 3:52 pm: the chrome budget grows by what the taller bar adds) makes the bar taller above 1366 with the switch ON, so against the
  // switch OFF the page sits lower by exactly the bar's growth (Chat 1's pair 44973956599 on train-h4 3ab78c73: 108 -> 120.3 at 1920, the bar 12.3 px taller)). The [successor], verbatim:
    // ok(`G1 [${w}] [successor]: the page's rect is the same switch off, on at rest, PROJECTS open, pins as boxes, as a list, Box settings open, a Project's list open, and closed (${off}); the editor is the same node throughout`,
    //   !!off && [rest, open, pinsBoxes, pinsList, boxOpen, listOpen, closed].every((r) => r === off) && same && boxOpen !== null,
    //   JSON.stringify({ off, rest, open, pinsBoxes, pinsList, boxOpen, listOpen, closed, same }));
    ok(`G1 [${w}] [scale successor]: the page's rect is the same on at rest, PROJECTS open, pins as boxes, as a list, Box settings open, a Project's list open, and closed (${rest}); against the switch off (${off}) the same at 1366, lower by the bar's growth alone above (${g} px); the editor is the same node throughout`,
      !!rest && [open, pinsBoxes, pinsList, boxOpen, listOpen, closed].every((r) => r === rest) && scaledSame(w, off, rest, g) && same && boxOpen !== null,
      JSON.stringify({ off, rest, g, barOff, barOn, open, pinsBoxes, pinsList, boxOpen, listOpen, closed, same }));
    // G2 (steps 5 and 6): DOCS open, UNFILED open
    await click('[data-reorg-rail] [data-category="reorg-docs"]'); await sleep(600);
    const docsOpen = await app.evalJs(PAGE);
    const docsDrawn = await app.evalJs("!!document.querySelector('.desk-frame-cascade-anchor .wz-reorg-docs')");
    await click('[data-reorg-rail] [data-category="reorg-unfiled"]'); await sleep(600);
    const unfOpen = await app.evalJs(PAGE);
    const unfDrawn = await app.evalJs("!!document.querySelector('.desk-frame-cascade-anchor .wz-reorg-unfiled')");
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(600);
    // SUPERSEDED (the chrome scale (arbor/reorg-scale 0c8df64d, train H; Fable, Nov 21 11:45 am: one chrome scale from the window's width / 1366, Machina under the reorg only;
  // pass 2 REAL 2, cleared 3:52 pm: the chrome budget grows by what the taller bar adds) makes the bar taller above 1366 with the switch ON, so against the
  // switch OFF the page sits lower by exactly the bar's growth (Chat 1's pair 44973956599 on train-h4 3ab78c73: 108 -> 120.3 at 1920, the bar 12.3 px taller)). The original, verbatim:
    // ok(`G2 [${w}]: the page's rect is the same with DOCS open and with UNFILED open (${off}); the editor is still the same node`,
    //   !!off && docsDrawn && unfDrawn && docsOpen === off && unfOpen === off && (await app.evalJs("document.querySelector('.forward-only-editor')?.__reorgRails === 1")),
    //   JSON.stringify({ off, docsOpen, unfOpen, docsDrawn, unfDrawn }));
    ok(`G2 [${w}] [scale successor]: the page's rect is the same with DOCS open and with UNFILED open as at rest (${rest}), and at rest it is the switch off's (${off}) at 1366, lower by the bar's growth alone above (${g} px); the editor is still the same node`,
      !!rest && docsDrawn && unfDrawn && docsOpen === rest && unfOpen === rest && scaledSame(w, off, rest, g) && (await app.evalJs("document.querySelector('.forward-only-editor')?.__reorgRails === 1")),
      JSON.stringify({ off, rest, g, docsOpen, unfOpen, docsDrawn, unfDrawn }));
  }
  // MUT-G-SCALE: the 1920 reading passes; pushed 40 px sideways (a drawer displacing the page), or 30 px lower than the bar grew, it fails
  { const s = scaleKeep[1920] || {}; const pushed = s.rest ? shiftRects(s.rest, 40, 0) : null; const sunk = s.rest ? shiftRects(s.rest, 0, 30) : null;
    ok('MUT-G-SCALE the 1920 reading passes the scale successor, and the same reading pushed 40 px sideways, or 30 px lower than the bar grew, fails it',
      !!s.rest && scaledSame(1920, s.off, s.rest, s.g) && !scaledSame(1920, s.off, pushed, s.g) && !scaledSame(1920, s.off, sunk, s.g), JSON.stringify({ ...s, pushed, sunk })); }
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-RAILS VERIFY: PASS (${checks.length} checks)` : `\nREORG-RAILS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
