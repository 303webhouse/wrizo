// THE AUTISM ECONOMY SEED (brief docs/briefs/autism-economy-seed-brief.md; Fable, Oct 17-18; Nick chose "A", Delete for good first).
// Wipe EVERY document on the signed-in account and seed it with one essay: a Draft Page, a sources board linked to it, one drawer holding both
// (a drawer holds a binder; the binder holds the Page and the board - the app's own shape). Built-in places (Journal, Shelf, Trash) stay, empty.
//
// SAFETY, all of it ruled:
//   - A VISIBLE browser at WS_TARGET_URL; Nick signs in himself. This script never reads, asks for or stores a password.
//   - --dry-run (the default) prints COUNTS ONLY and changes nothing.
//   - The order is CONFIRM -> EXPORT -> DELETE (Fable, Oct 18):
//     1. --apply first asks for Nick's typed confirmation IN THE APP'S OWN DIALOG in the visible browser (window.wrizoDestructive.request;
//        components/DestructiveConfirm.tsx), with the counts in front of him. Only his own typing and his own press open it - the app refuses
//        scripted input - and until it is open, window.wrizoDelete and window.wrizoSeed's writes and export refuse. Nick's spoken word is
//        chat 1's to take at that moment, before this runs; --apply also requires --nick-said-go so the step cannot be skipped by habit.
//     2. Then it EXPORTS the whole account to a local folder through the app's own paths - the server's full record of the account
//        (/api/sync, a pull from nothing) and the app's own "Everything" markdown export - and refuses to delete if that export fails or
//        comes back empty while the account is not.
//     3. Only then does it delete.
//   - Only the app's own paths, never SQL: delete -> Trash -> Delete for good (window.wrizoDelete, from the Delete-for-good ticket -
//     --apply refuses until it exists); the Import door for the essay (the real /project/:id/import screen); and the store functions the UI
//     uses for the drawer, binder, board, pin, cards and connectors.
//   - After --apply it re-reads the SERVER's own record and the app's readers, and asserts the brief's final state (README section 6).
//
// Run (chat 1, a box turn granted - every browser here goes through runtime-verify's guard):
//   WS_TARGET_URL=<origin> node apps/desktop/scripts/seed/autism-economy.mjs --seed-dir <unzipped autism-economy-seed>      (dry run)
//   WS_TARGET_URL=<origin> node apps/desktop/scripts/seed/autism-economy.mjs --seed-dir <dir> --apply --nick-said-go [--frames <dir>]
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';
import { boardShape, buildBoard, essayStats, planStats, readSeed } from './autism-economy-plan.mjs';

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const APPLY = argv.includes('--apply');
const SEED_DIR = arg('--seed-dir');
const FRAMES = arg('--frames');
const TARGET = process.env.WS_TARGET_URL || null;
const CONFIRM_PHRASE = 'DELETE EVERYTHING';
const SIGN_IN_WAIT_MS = 20 * 60 * 1000;
// the delete paths' contract with the Delete-for-good ticket (docs/plans/delete-for-good.md section 3):
//   softAll()      every live page, board, binder, drawer and plan to Trash, through the app's soft deletes (built-in places skipped)
//   emptyTrash()   Trash's own Empty Trash: every trashed page, board and card, deleted for good
//   purgeDeleted() the soft-deleted binders, drawers and plans (they never appear in Trash), deleted for good
const DELETE_SEAMS = ['softAll', 'emptyTrash', 'purgeDeleted'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (s) => console.log(s);
// before the browser exists a refusal exits; INSIDE the session it throws, so runtime-verify closes the browser it opened (an exit there
// would leave an orphan) - the throw is reported once, below
const fail = (why) => { log(`\nAUTISM-ECONOMY SEED: REFUSED - ${why}`); process.exit(2); };
class Refusal extends Error {}
const refuse = (why) => { throw new Refusal(why); };

if (!SEED_DIR) fail('pass --seed-dir <the unzipped autism-economy-seed folder>');
if (!TARGET) fail('set WS_TARGET_URL to the app\'s origin (never assumed - there is no default)');
if (APPLY && !argv.includes('--nick-said-go')) fail('--apply needs --nick-said-go: Nick\'s word, given at this moment, comes first');

const { essay, plan } = readSeed(SEED_DIR);
const es = essayStats(essay);
const ps = planStats(plan);
if (es.sections !== 8 || !es.sourcesHeading || ps.cards !== 52 || ps.columns !== 6) fail(`the seed folder is not the one the brief describes: ${JSON.stringify({ es, ps })}`);

const mask = (email) => String(email || '').replace(/^(.).*(@.*)$/, '$1***$2');
const frame = async (app, name) => {
  if (!FRAMES) return;
  mkdirSync(FRAMES, { recursive: true });
  writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
};

// the server's own record of the account: a pull from nothing (the app's sync endpoint, from the page, with its own session cookie)
const SERVER_PULL = `fetch('/api/sync', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lastSyncAt: null, push: {} }) }).then((r) => r.ok ? r.json() : Promise.reject(new Error('sync ' + r.status)))`;
// ...and what it holds, counted in the page (dry run: no content crosses into this script)
const SERVER_COUNTS = `${SERVER_PULL}.then((s) => { const p = s.pull || {}; const live = (xs) => (xs || []).filter((x) => !x.deletedAt && !x.purgedAt);
  const sys = (e) => e.pageType === 'board' && (e.boxes || []).some((b) => b.kind === 'board-meta' && b.systemKind);
  const entries = p.journalEntries || [];
  return { entries: entries.length, liveDocuments: live(entries).filter((e) => !sys(e)).length, builtInPlaces: entries.filter(sys).length,
    deletedNotPurged: entries.filter((e) => e.deletedAt && !e.purgedAt).length, purged: entries.filter((e) => e.purgedAt).length,
    projects: live(p.projects).length, drawers: live(p.drawers).length, storyPlans: live(p.storyPlans).length,
    sessions: (p.sessions || []).length, drafts: (p.drafts || []).length }; })`;
const waitUnsynced = async (app, ms = 120000) => {
  for (let t = 0; t < ms; t += 1000) {
    const n = await app.evalJs('window.wrizoSeed ? window.wrizoSeed.unsynced() : -1');
    if (n === 0) return true;
    await sleep(1000);
  }
  return false;
};

try {
await withHarness(async (app) => {
  // ---- 1. Nick signs in, in the window in front of him
  log('\nA browser window is open at the app. Sign in there yourself - this script never sees, asks for or stores a password.');
  log(`Waiting up to ${SIGN_IN_WAIT_MS / 60000} minutes...`);
  let me = null;
  for (let t = 0; t < SIGN_IN_WAIT_MS && !me; t += 2000) {
    me = await app.evalJs("fetch('/auth/me', { credentials: 'include' }).then((r) => r.ok ? r.json() : null).catch(() => null)");
    if (!me) await sleep(2000);
  }
  if (!me || !me.id) refuse('no one signed in');
  log(`Signed in as ${mask(me.email)}.`);
  const seamsUp = await app.waitFor('!!window.wrizoSeed', { timeout: 30000, label: 'the seed seams' }).then(() => true, () => false);
  if (!seamsUp) refuse('this deployment does not carry the seed\'s app paths (store/seedSeams.ts) - deploy the seed branch first');
  const pulled = await app.evalJs('window.wrizoSeed.whenPulled(60000)');
  if (pulled !== 'pulled') refuse(`the app never finished its first pull from the server (${pulled}) - counts would be wrong`);
  await sleep(1500);
  await waitUnsynced(app, 60000);   // the app may write its own built-in places on a first visit; let that reach the server before counting

  // ---- 2. the counts (the dry run's whole output)
  const before = await app.evalJs('window.wrizoSeed.counts()');
  const serverBefore = await app.evalJs(SERVER_COUNTS);
  log('\nWHAT WOULD BE DELETED (the app\'s own readers):');
  log(JSON.stringify(before, null, 2));
  log('THE SERVER\'S OWN RECORD (rows):');
  log(JSON.stringify(serverBefore, null, 2));
  await frame(app, '00-signed-in');
  if (!APPLY) { log('\nAUTISM-ECONOMY SEED: DRY RUN - nothing was changed. Run with --apply --nick-said-go to do it.'); return; }

  // ---- 3. --apply: the delete paths and the app's own confirmation must exist (they ship with Delete for good)
  const missing = await app.evalJs(`(() => { const d = window.wrizoDelete; const c = window.wrizoDestructive;
    return ${JSON.stringify(DELETE_SEAMS)}.filter((k) => !d || typeof d[k] !== 'function').concat(c && typeof c.request === 'function' ? [] : ['wrizoDestructive.request']); })()`);
  if (missing.length) refuse(`Delete for good has not shipped on this deployment (missing: ${missing.join(', ')}). Nothing was changed.`);
  if (before.unsynced > 0) refuse(`${before.unsynced} records are not yet synced - wait for the app to finish, then run again`);
  if (before.builtInPlaceCards > 0) refuse(`${before.builtInPlaceCards} card(s) sit on a built-in place (Journal / Shelf / Trash); the app cannot trash a card there - hand this up before deleting anything`);

  // ---- 4. CONFIRM: Nick types the phrase in the app's own dialog, in the browser in front of him (nothing is exported or deleted before)
  const c = before;
  const ask = {
    title: 'Delete everything on this account, for good?',
    lines: [
      `${c.documents} documents (${c.pages} pages, ${c.boards} boards with ${c.cards} cards), ${c.binders} binders, ${c.drawers} drawers, ${c.storyPlans} plans, and the Trash (${c.trashPages} pages, ${c.trashCards} cards). This cannot be undone.`,
      'A full copy is saved on this computer first. If that copy fails or comes back empty, nothing is deleted.',
      'Then the account gets only The Autism Economy: its Page, its sources board, one drawer.',
    ],
    phrase: CONFIRM_PHRASE,
  };
  await app.evalJs(`(() => { window.__wzSeedAnswer = null;
    window.wrizoDestructive.request(${JSON.stringify(ask)}).then((yes) => { window.__wzSeedAnswer = yes ? 'go' : 'cancel'; });
    return true; })()`);
  const shown = await app.waitFor("!!document.querySelector('.wz-destructive')", { timeout: 15000, label: 'the app\'s confirmation dialog' }).then(() => true, () => false);
  if (!shown) refuse('the app\'s confirmation dialog never appeared - nothing was exported or deleted');
  log(`\nWaiting for the typed confirmation ("${CONFIRM_PHRASE}") in the app's dialog in the browser window...`);
  await frame(app, '01-confirm');
  let answer = null;
  for (let t = 0; t < 30 * 60 * 1000 && !answer; t += 1000) { answer = await app.evalJs('window.__wzSeedAnswer'); if (!answer) await sleep(1000); }
  if (answer !== 'go') refuse(answer === 'cancel' ? 'Nick pressed Cancel - nothing was exported or deleted' : 'no confirmation within 30 minutes - nothing was exported or deleted');
  if (!(await app.evalJs('window.wrizoDestructive.unlocked()'))) refuse('the app did not open its delete paths after the confirmation - nothing was exported or deleted');

  // ---- 5. EXPORT, before anything is deleted - or nothing is deleted
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportDir = arg('--export-dir') || join(homedir(), '.wrizo', 'seed-exports', `autism-economy-${stamp}`);
  let exported = null;
  try {
    const full = await app.evalJs(`${SERVER_PULL}.then((s) => JSON.stringify(s))`);
    const everything = await app.evalJs('window.wrizoSeed.exportEverything()');
    const pull = JSON.parse(full);
    const rows = Object.values(pull.pull || {}).reduce((n, xs) => n + (Array.isArray(xs) ? xs.length : 0), 0);
    mkdirSync(exportDir, { recursive: true });
    writeFileSync(join(exportDir, 'account-pull.json'), full);
    writeFileSync(join(exportDir, everything.filename || 'everything.md'), everything.content || '');
    exported = { dir: exportDir, rows, bytes: full.length, everythingDocs: everything.count, everythingBytes: (everything.content || '').length };
  } catch (e) {
    refuse(`the export failed (${e && e.message}) - nothing was deleted`);
  }
  const accountHolds = before.documents + before.binders + before.drawers + before.trashPages + before.storyPlans;
  if (accountHolds > 0 && (exported.rows === 0 || exported.bytes < 100)) refuse(`the export came back empty (${JSON.stringify(exported)}) while the account holds ${accountHolds} records - nothing was deleted`);
  log(`\nEXPORTED to ${exported.dir}: ${exported.rows} server rows (${exported.bytes} bytes), and the Everything document (${exported.everythingDocs} documents).`);

  // ---- 6. DELETE: the wipe: everything to Trash (the app's soft delete), then Delete for good (Empty Trash + the soft-deleted binders, drawers, plans)
  const wiped = await app.evalJs(`(() => {
    const d = window.wrizoDelete;
    return { toTrash: d.softAll(), emptiedTrash: d.emptyTrash(), purgedOther: d.purgeDeleted() }; })()`).catch((e) => ({ error: String(e && e.message) }));
  if (wiped.error) refuse(`the wipe stopped: ${wiped.error} - the export is at ${exported.dir}`);
  log(`\nWIPED: ${JSON.stringify(wiped)}`);
  if (!(await waitUnsynced(app))) refuse('the wipe did not finish syncing in 2 minutes - check the connection; the export is at ' + exported.dir);
  const afterWipe = await app.evalJs('window.wrizoSeed.counts()');
  const leftover = Object.entries(afterWipe).filter(([k, v]) => k !== 'unsynced' && v !== 0);
  if (leftover.length) refuse(`after the wipe something is still there: ${JSON.stringify(Object.fromEntries(leftover))}`);
  await frame(app, '02-wiped');

  // ---- 7. the seed
  const drawer = await app.evalJs(`window.wrizoCreateDrawer(${JSON.stringify(plan.drawer.name)})`);
  const binder = await app.evalJs(`window.wrizoCreateBinder(${JSON.stringify(plan.page.title)}, 'essay', ${JSON.stringify(drawer.id)}, 'academic')`);
  // the Import door, the real screen: the essay into the binder as a manuscript page
  await app.evalJs(`location.hash = '#/project/${binder.id}/import'`);
  await app.waitFor("!!document.querySelector('textarea.import-textarea')", { label: 'the Import screen', timeout: 15000 });
  await app.evalJs(`(() => { const ta = document.querySelector('textarea.import-textarea');
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(ta, ${JSON.stringify(essay)});
    ta.dispatchEvent(new Event('input', { bubbles: true })); return ta.value.length; })()`);
  await app.evalJs("document.querySelector('.import-kind[data-kind=\"manuscript\"]')?.click()");
  await sleep(300);
  await app.evalJs("document.querySelector('.import-go')?.click()");
  await app.waitFor("/^#\\/page\\/[^/?]+$/.test(location.hash)", { label: 'the imported Page', timeout: 15000 });
  const pageId = await app.evalJs("location.hash.replace('#/page/', '')");
  // Draft, by the mode strip's own Draft tab (the mode is remembered on this device, as for any writer)
  await app.waitFor("!!document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')", { label: 'the mode strip', timeout: 15000 }).catch(() => {});
  await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click()");
  await sleep(800);
  await frame(app, '03-page');
  // the sources board, the Draft pinned on it, the cards and the connectors
  const board = await app.evalJs(`window.wrizoSeed.createBoardPage(${JSON.stringify(binder.id)}, ${JSON.stringify(plan.board.name)})`);
  await app.evalJs(`window.wrizoPinPageToBoard(${JSON.stringify(pageId)}, ${JSON.stringify(board.id)}, { display: true })`);
  const pinned = await app.evalJs(`window.wrizoStoredBoxes(${JSON.stringify(board.id)})`);
  let n = 0;
  const base = Date.now().toString(36);
  const boxes = buildBoard({ plan, pinned, pageId, newId: () => `${base}seed${(++n).toString(36)}` });
  await app.evalJs(`window.wrizoSeed.saveBoardBoxes(${JSON.stringify(board.id)}, ${JSON.stringify(boxes)})`);
  if (!(await waitUnsynced(app))) refuse('the seed did not finish syncing in 2 minutes - check the connection');
  await app.evalJs(`location.hash = '#/page/${board.id}'`);
  await sleep(2500);
  await frame(app, '04-board');

  // ---- 8. the final state, read back from the SERVER's own record and from the app's readers after a reload
  const server = JSON.parse(await app.evalJs(`${SERVER_PULL}.then((s) => JSON.stringify(s))`)).pull || {};
  const live = (xs) => (xs || []).filter((x) => !x.deletedAt && !x.purgedAt);
  const isSys = (e) => e.pageType === 'board' && (e.boxes || []).some((b) => b.kind === 'board-meta' && b.systemKind);
  const docs = live(server.journalEntries).filter((e) => !isSys(e));
  const sPage = docs.find((e) => e.id === pageId);
  const sBoard = docs.find((e) => e.id === board.id);
  const shape = sBoard ? boardShape(sBoard.boxes || [], pageId) : null;
  const pageStats = sPage ? essayStats(sPage.text || '') : null;
  await app.reload();
  await app.waitFor('!!window.wrizoSeed', { timeout: 30000, label: 'the app after a reload' });
  await app.evalJs('window.wrizoSeed.whenPulled(60000)');
  await sleep(1500);
  const after = await app.evalJs('window.wrizoSeed.counts()');
  const checks = [
    ['1 Draft page: about 5,600 words, 8 section headings plus Sources', !!pageStats && pageStats.sections === 8 && pageStats.sourcesHeading && pageStats.words > 5000 && pageStats.words < 6400 && sPage.projectId === binder.id, pageStats],
    ['1 board: 1 Draft pin, 6 headers, 52 source cards', !!shape && shape.pins === 1 && shape.draftPin && shape.headers === 6 && shape.sourceCards === 52 && sBoard.projectId === binder.id, shape],
    ['58 links (6 header-to-pin, 52 card-to-header)', !!shape && shape.links === 58 && shape.cardsLinkedToHeaders === 52, shape && shape.links],
    ['1 drawer holding both (drawer -> binder -> the Page and the board)', live(server.drawers).length === 1 && live(server.projects).length === 1 && live(server.projects)[0].drawerId === drawer.id, { drawers: live(server.drawers).length, projects: live(server.projects).length }],
    ['nothing else at all on the server: 2 documents, no plans, no Trash', docs.length === 2 && live(server.storyPlans).length === 0 && (server.journalEntries || []).filter((e) => e.deletedAt && !e.purgedAt).length === 0, { docs: docs.length }],
    ['the app agrees after a reload: 1 page, 1 board, 58 cards, 1 binder, 1 drawer, empty Trash', after.pages === 1 && after.boards === 1 && after.cards === 58 && after.binders === 1 && after.drawers === 1 && after.storyPlans === 0 && after.trashPages === 0 && after.trashCards === 0 && after.builtInPlaceCards === 0, after],
  ];
  await app.evalJs("location.hash = '#/trash'");
  await sleep(2000);
  await frame(app, '05-trash-empty');
  for (const [name, pass, detail] of checks) log(`${pass ? 'PASS' : 'FAIL'}  ${name}  [${JSON.stringify(detail)}]`);
  const bad = checks.filter((c) => !c[1]).length;
  log(bad === 0 ? `\nAUTISM-ECONOMY SEED VERIFY: PASS (${checks.length} checks) - the export is at ${exported.dir}` : `\nAUTISM-ECONOMY SEED VERIFY: FAIL - ${bad}/${checks.length} failed - the export is at ${exported.dir}`);
  if (bad) process.exitCode = 1;
}, { targetUrl: TARGET, headful: true });
} catch (e) {
  if (e instanceof Refusal) { log(`\nAUTISM-ECONOMY SEED: REFUSED - ${e.message}`); process.exitCode = 2; }
  else throw e;
}
