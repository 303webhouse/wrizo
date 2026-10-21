// PAGE LINKS (connector-b; Nick's route (b), plan approved by Fable Oct 14: docs/plans/connector-b-page-links.md) - BROWSERLESS. The pairs a same-board connection box cannot hold - a card <-> a page or a board, a card <->
// a card on another board - are SINGLE-OWNER records in the additive jsonb array `page_links` on the entry where the writer started the link; the reverse is a cache scan; a delete is a tombstone. A same-board card <-> card
// pair stays a connection box. This file runs the REAL persistence.ts (bundled with esbuild against a fake browser - the drafts-integrity pattern) and reads the SERVER's source for the five edit sites; every claim has a mutant.
//
//   P1 a link is stored ONCE, on the OWNER; the target has no record and no key; the owner's updatedAt moves; adding it again - or from the other end - never doubles it
//   P2 the reverse read finds it from the other end; the peer list (one union: connection boxes + records) names it with its kind and its words
//   P3 a delete is a TOMBSTONE (deletedAt + updatedAt on the record, owner saved) - hidden from every read, never resurrected: a later link is a NEW record
//   P4 the connector's toggle: linked -> unlinked -> linked; the thumbnail's circle (isCardLinkedToEntry) follows
//   P5 the ONE-TRUTH rule at the door: an entry that is already a live pin on this board is a CARD (livePinFor) - the caller makes a connection box, no record; the peer list shows both kinds without doubling
//   P6 spread-preservation: a board autosave, a patch, a card delete/restore never drop the records; an entry that never had a link has NO `pageLinks` key; an end that does not exist is refused
//   P7 the sync round trip on the client: a pulled entry's records arrive whole; the server's "absent" is "no links"
//   S1-S6 THE SERVER, in source: the migration (additive, default '[]', idempotent), the read mapper (absent for null / jsonb null / []), the INSERT list and its 25 placeholders, the old-client GUARD verbatim, the parameter
//        array - each removed in turn by a mutant that must turn its pin RED
//
// Browserless. Run: node scripts/harness/page-links.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const SERVER = path.join(DESKTOP, '..', 'server', 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

let nonce = 0;
async function load(overrides = {}) {
  nonce += 1;
  const res = await build({
    stdin: { contents: `export const __nonce = ${nonce};\nexport * from './store/persistence';`, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    nodePaths: [path.join(DESKTOP, 'node_modules')],
    plugins: [{ name: 'ov', setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const rel = path.relative(SRC, args.path).split('\\').join('/');
        const text = noCR(fs.readFileSync(args.path, 'utf8'));
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  const map = new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  return import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
}

const card = (id, text = id) => ({ id, kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text });
const conn = (id, a, b) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 9, connA: a, connB: b });
const seed = (m, id, o = {}) => m.createJournalPage({ id, text: id, origin: null, source: null, ...o });
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

async function suite(m) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  seed(m, 'bd', { pageType: 'board', boxes: [card('A', 'Card A\nmore'), card('B', 'Card B')] });
  seed(m, 'pg', { text: 'The harbour chapter\nIt begins at dawn.' });
  seed(m, 'bd2', { pageType: 'board', text: 'Research board', boxes: [card('R1', 'A card on another board')] });
  const owner0 = m.getJournalEntry('bd').updatedAt;
  await sleepMs(5);

  // P1
  const l1 = m.addPageLink('bd', { aBoxId: 'A', bEntryId: 'pg' });
  const bd = m.getJournalEntry('bd'), pg = m.getJournalEntry('pg');
  keep('P1a', !!l1 && bd.pageLinks.length === 1 && bd.pageLinks[0].aEntryId === 'bd' && bd.pageLinks[0].aBoxId === 'A' && bd.pageLinks[0].bEntryId === 'pg' && !bd.pageLinks[0].bBoxId && !('pageLinks' in pg) && bd.updatedAt > owner0, JSON.stringify({ links: bd.pageLinks, targetHasKey: 'pageLinks' in pg }));
  const again = m.addPageLink('bd', { aBoxId: 'A', bEntryId: 'pg' });
  const fromOther = m.addPageLink('pg', { bEntryId: 'bd' });   // a different pair (page -> board, no card ends): a NEW record owned by the page
  keep('P1b', again.id === l1.id && m.getJournalEntry('bd').pageLinks.length === 1 && !!fromOther && m.getJournalEntry('pg').pageLinks.length === 1, JSON.stringify({ same: again.id === l1.id }));
  const rev = m.addPageLink('pg', { bEntryId: 'bd', bBoxId: 'A' });   // the SAME pair as l1 written from the other end (card A <-> page pg): returns l1, no second record
  keep('P1c', rev && rev.id === l1.id && m.getJournalEntry('pg').pageLinks.length === 1, JSON.stringify({ revId: rev?.id, l1: l1.id }));

  // P2
  const to = m.getPageLinksTo('pg').map((x) => x.id);
  const peers = m.getLinkPeersOfCard('bd', 'A');
  keep('P2', to.includes(l1.id) && peers.length === 1 && peers[0].via === 'link' && peers[0].kind === 'page' && peers[0].label === 'The harbour chapter' && peers[0].linkId === l1.id && !peers[0].reverse, JSON.stringify({ to, peers }));
  // a card on ANOTHER board: reverse peers
  const lc = m.addPageLink('bd2', { aBoxId: 'R1', bEntryId: 'bd', bBoxId: 'B' });
  const peersB = m.getLinkPeersOfCard('bd', 'B');
  keep('P2b', !!lc && peersB.length === 1 && peersB[0].reverse === true && peersB[0].kind === 'card' && peersB[0].label === 'A card on another board' && m.getLinkPeersOfCard('bd2', 'R1')[0]?.label === 'Card B', JSON.stringify(peersB));

  // P3
  const ownerBefore = m.getJournalEntry('bd').updatedAt;
  await sleepMs(5);
  const gone = m.removePageLink(l1.id);
  const tomb = (m.getJournalEntry('bd').pageLinks || []).find((x) => x.id === l1.id);
  keep('P3a', gone === true && !!tomb && !!tomb.deletedAt && tomb.updatedAt === tomb.deletedAt && m.getJournalEntry('bd').updatedAt > ownerBefore && m.getPageLinksOf('bd').length === 0 && !m.getPageLinksTo('pg').some((x) => x.id === l1.id) && m.getLinkPeersOfCard('bd', 'A').length === 0, JSON.stringify(tomb));
  const second = m.removePageLink(l1.id);
  const l1b = m.addPageLink('bd', { aBoxId: 'A', bEntryId: 'pg' });
  keep('P3b', second === false && !!l1b && l1b.id !== l1.id && m.getPageLinksOf('bd').length === 1 && (m.getJournalEntry('bd').pageLinks || []).length === 2, JSON.stringify({ second, newId: l1b?.id !== l1.id }));

  // P4
  const t0 = m.isCardLinkedToEntry('bd', 'A', 'pg');
  const tg1 = m.toggleEntryLink('bd', 'A', 'pg'), c1 = m.isCardLinkedToEntry('bd', 'A', 'pg');
  const tg2 = m.toggleEntryLink('bd', 'A', 'pg'), c2 = m.isCardLinkedToEntry('bd', 'A', 'pg');
  keep('P4', t0 === true && tg1 === 'unlinked' && c1 === false && tg2 === 'linked' && c2 === true && m.toggleEntryLink('bd', 'A', 'bd') === null, JSON.stringify({ t0, tg1, c1, tg2, c2 }));

  // P5
  seed(m, 'pg2', { text: 'A page that is also pinned here' });
  m.pinPageToBoard('pg2', 'bd', { display: true });
  const pinned = m.livePinFor('bd', 'pg2'), notPinned = m.livePinFor('bd', 'pg');
  const pinBox = m.getJournalEntry('bd').boxes.find((b) => b.kind === 'page-pin' && b.entryId === 'pg2');
  m.saveBoardBoxes('bd', [...m.getJournalEntry('bd').boxes, conn('conn-AP', 'A', pinBox.id)]);
  const unionPeers = m.getLinkPeersOfCard('bd', 'A');
  keep('P5', !!pinned && pinned.id === pinBox.id && notPinned === null && unionPeers.some((p) => p.via === 'card' && p.kind === 'page' && p.label === 'A page that is also pinned here') && unionPeers.some((p) => p.via === 'link' && p.label === 'The harbour chapter') && new Set(unionPeers.map((p) => p.key)).size === unionPeers.length, JSON.stringify(unionPeers.map((p) => [p.via, p.label])));

  // P6
  const before = JSON.stringify(m.getJournalEntry('bd').pageLinks);
  m.saveBoardBoxes('bd', m.getJournalEntry('bd').boxes.filter((b) => b.id !== 'B'));
  m.patchJournalEntry('bd', m.getJournalEntry('bd').text, {});
  m.stashDeletedBoxes('bd', ['A']); m.restoreDeletedBox('bd', 'A');
  const afterSave = JSON.stringify(m.getJournalEntry('bd').pageLinks);
  seed(m, 'plain', {});
  m.saveJournalEntry({ ...m.getJournalEntry('plain'), text: 'edited' });
  m.flushNow();
  const raw = JSON.parse(globalThis.localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'plain');
  keep('P6a', before === afterSave && before !== undefined, JSON.stringify({ before, afterSave }));
  keep('P6b', !('pageLinks' in raw), JSON.stringify(Object.keys(raw)));
  keep('P6c', m.addPageLink('bd', { aBoxId: 'A', bEntryId: 'does-not-exist' }) === null, '');
  // a soft-deleted end shows as such, never "Missing"
  m.softDeleteEntry('pg');
  const trashedPeer = m.getLinkPeersOfCard('bd', 'A').find((p) => p.linkId);
  keep('P6d', !!trashedPeer && trashedPeer.trashed === true && trashedPeer.label === 'The harbour chapter', JSON.stringify(trashedPeer));
  m.restoreEntry('pg');

  // P7 - the pull: an entry's records arrive whole; the server's "absent" is no links
  m.markClean([{ collection: 'journalEntries', id: 'plain' }]);
  const links = [{ id: 'srv-1', aEntryId: 'plain', aBoxId: 'x', bEntryId: 'pg', createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' }];
  m.applyRemoteRecords({ journalEntries: [{ ...m.getJournalEntry('plain'), updatedAt: '2030-01-01T00:00:00.000Z', pageLinks: links }] });
  const arrived = m.getJournalEntry('plain').pageLinks;
  m.markClean([{ collection: 'journalEntries', id: 'plain' }]);
  const noKey = { ...m.getJournalEntry('plain'), updatedAt: '2031-01-01T00:00:00.000Z' }; delete noKey.pageLinks;
  m.applyRemoteRecords({ journalEntries: [noKey] });
  keep('P7', JSON.stringify(arrived) === JSON.stringify(links) && !('pageLinks' in m.getJournalEntry('plain')), JSON.stringify({ arrived: arrived?.length, keyAfterAbsent: 'pageLinks' in m.getJournalEntry('plain') }));
  return r;
}

const base = await load();
const res0 = await suite(base);
for (const [k, v] of Object.entries(res0)) ok(`${k} (baseline)`, v.pass, v.detail);

const P = 'store/persistence.ts';
const MUT = [
  ['addPageLink forgets to dedupe', P, (t) => t.replace("  const existing = findLinkBetween(ownerEntryId, end.aBoxId, end.bEntryId, end.bBoxId);\n  if (existing) return clone(existing.link);\n", ''), ['P1b', 'P1c']],
  ['a delete is a hard removal (no tombstone)', P, (t) => t.replace("pageLinks: (e.pageLinks ?? []).map(x => (x.id === linkId ? { ...x, deletedAt: now, updatedAt: now } : x)) });", "pageLinks: (e.pageLinks ?? []).filter(x => x.id !== linkId) });"), ['P3a']],
  ['the reverse read returns tombstoned records', P, (t) => t.replace('if (!liveLink(l) || l.bEntryId !== entryId) continue;', 'if (l.bEntryId !== entryId) continue;'), ['P3a']],
  ['the toggle never unlinks', P, (t) => t.replace("if (found) return removePageLink(found.link.id) ? 'unlinked' : null;", "if (found) return 'unlinked';"), ['P4']],
  ['the pin door forgets the card is on this board', P, (t) => t.replace("x.kind === 'page-pin' && x.entryId === entryId && x.onCanvas !== false);\n  return b ? clone(b) : null;", "x.kind === 'page-pin' && x.entryId === '__never__');\n  return b ? clone(b) : null;"), ['P5']],
  ['a link to nothing is accepted', P, (t) => t.replace("  if (!cache.journalEntries.some(x => x.id === end.bEntryId)) return null;\n", ''), ['P6c']],
];
for (const [name, file, fn, expectRed] of MUT) {
  const orig = noCR(fs.readFileSync(path.join(SRC, file), 'utf8'));
  const landed = fn(orig) !== orig;
  let red = [];
  if (landed) { const mm = await load({ [file]: fn }); const rr = await suite(mm); red = Object.entries(rr).filter(([, v]) => !v.pass).map(([k]) => k); }
  ok(`MUTANT "${name}": the mutation landed and turns ${expectRed.join(' + ')} RED`, landed && expectRed.every((k) => red.includes(k)), JSON.stringify({ landed, red }));
}

// ---- the server's source: the five edit sites + the guard (each with a mutant)
const mig = noCR(fs.readFileSync(path.join(SERVER, 'migrate.ts'), 'utf8'));
const syn = noCR(fs.readFileSync(path.join(SERVER, 'sync.ts'), 'utf8'));
const pinsOf = (m, s) => ({
  migration: /alter table journal_entries add column if not exists page_links jsonb default '\[\]'::jsonb/.test(m),
  mapper: /pageLinks: Array\.isArray\(r\.page_links\) && r\.page_links\.length > 0 \? r\.page_links : undefined,/.test(s),
  insertList: /plan_board_id, page_settings, page_links\)\n\s*values \(\$1,\$2,\$3,\$4,\$5,\$6,\$7,\$8,\$9,\$10,\$11,\$12,\$13::jsonb,\$14::jsonb,\$15,\$16::jsonb,\$17::jsonb,\$18::jsonb,\$19::jsonb,\$20,\$21,\$22,\$23,\$24::jsonb,\$25::jsonb\)/.test(s),
  guard: /page_links = case\n\s*when excluded\.page_links is null or excluded\.page_links = 'null'::jsonb then journal_entries\.page_links\n\s*else excluded\.page_links\n\s*end,/.test(s),
  params: /JSON\.stringify\(e\.pageSettings \?\? null\), JSON\.stringify\(e\.pageLinks \?\? null\)\],/.test(s),
});
{
  const p = pinsOf(mig, syn);
  ok('S1-S5: the migration is additive and idempotent (add column if not exists, jsonb, default \'[]\'); the read mapper makes null / jsonb null / [] ABSENT; the INSERT lists page_links with 25 placeholders; the old-client GUARD is the ruled clause verbatim; the parameter array carries JSON.stringify(e.pageLinks ?? null)', Object.values(p).every(Boolean), JSON.stringify(p));
  const muts = [
    ['migration', () => pinsOf(mig.replace('add column if not exists page_links', 'add column page_links'), syn)],
    ['mapper', () => pinsOf(mig, syn.replace('r.page_links.length > 0 ? r.page_links : undefined', 'r.page_links'))],
    ['insertList', () => pinsOf(mig, syn.replace('$24::jsonb,$25::jsonb)', '$24::jsonb)'))],
    ['guard', () => pinsOf(mig, syn.replace(/page_links = case[\s\S]*?end,/, 'page_links = excluded.page_links,'))],
    ['params', () => pinsOf(mig, syn.replace(', JSON.stringify(e.pageLinks ?? null)]', ']'))],
  ];
  const reds = muts.map(([k, f]) => [k, f()[k] === false]);
  ok('S (mutants): dropping the migration\'s "if not exists", the mapper\'s null-to-absent, the 25th placeholder, the guard (the plain "= excluded.page_links"), or the parameter turns its OWN pin RED (each landed)', reds.every(([, v]) => v), JSON.stringify(reds));
}

// ---- the surfaces, in source (the browser half is connector-b.mjs)
{
  const rd = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
  const be = rd('components/BoardEditor.tsx'), panels = rd('components/CascadePanels.tsx'), survey = rd('components/CascadeSurvey.tsx'), links = rd('components/ConnectionsDrawerPanel.tsx'), dlg = rd('components/DeleteDialog.tsx');
  const ui = (b, p, s, l, d) => ({
    // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the Drawers panel's three tiles retired; the rail's entries are the rows of the Pages pop-out (and the survey items, and the Plan board row).
    // Kept VERBATIM below and no longer run; the live successor follows.
    //
    // railTagged: /data-link-entry=\{item\.id\}/.test(s) && (p.match(/data-link-entry=\{(anchor|b|d)\.id\}/g) || []).length === 3 && /data-link-entry=\{row\.id\}/.test(p),
    railTagged: /data-link-entry=\{item\.id\}/.test(s) && /data-link-entry=\{row\.id\}/.test(p) && /data-link-entry=\{e\.id\}/.test(rd('components/SectionsPopout.tsx')),
    oneTruthAtTheDoor: /const pin = livePinFor\(id, entryId\);\n\s*if \(pin\) \{ commit\(pin\.id\); return; \}\n\s*const src = connect\.src;\n\s*const res = toggleEntryLink\(id, src, entryId\);/.test(b),
    armOverlay: /createPortal\(\n\s*<svg className="board-connect-overlay" aria-hidden="true">/.test(b) && /document\.body,\n\s*\)\}/.test(b),
    footerReadsLinks: /const boxLinkPeers = footerOn \? \(linkPeersByCard\.get\(box\.id\) \?\? \[\]\) : \[\];/.test(b) && /data-link-peer-line=\{p\.kind\}/.test(b),
    copyIsLinked: /saveBoardBoxes\(id, next\);[^\n]*\n\s*lastSavedRef\.current = next;\n\s*addPageLink\(id, \{ aBoxId: box\.id, bEntryId: entryId \}\);/.test(b),
    tabAsksFirst: /requestDelete\(\(\) => \{[\s\S]*?\}, \{ title: t\('linksRemoveTitle'\), always: true, noDontAsk: true \}\)/.test(l) && /removePageLink\(p\.linkId\)/.test(l) && /getBoardActions\(\)\?\.removeConnection\(p\.connId\)/.test(l),
    dialogNoTick: /\{!pending\.noDontAsk && \(/.test(d),
  });
  const u = ui(be, panels, survey, links, dlg);
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): the wording names the retired Drawers tiles.
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('S6-S9: the rail\'s thumbnails declare their entry (CascadeSurvey, the three Drawers tiles, the Plan board row); the release consults livePinFor BEFORE toggling a record (one truth at the door); the arm travels in a body portal; the footers read page links; a dropped thumbnail saves the card BEFORE the record that names it; the tab\'s X asks first without the "Don\'t ask me again" tick', Object.values(u).every(Boolean), JSON.stringify(u));
  // ---- PARKED, generation 2 - SUPERSEDED by BIG PROJECTS STEP 3 (Grafts across places; Fable cleared step 3 Oct 19): the Grafts pane is rewritten
  // around GROUPED rows (store/grafts.ts) - its X still asks first through the same dialog, without the tick, and still removes whichever record joins
  // the pair, but it reads the ROW (`r.linkId` -> removePageLink(id), getBoardActions()?.removeConnection(r.connId)), so tabAsksFirst's text
  // no longer matches. Kept VERBATIM and no longer run; the successor keeps every other predicate and pins the tab on its new text.
  // ok('S6-S9 [big-projects-1a successor]: the rail\'s thumbnails declare their entry (CascadeSurvey, the Plan board row, and the Pages pop-out\'s rows); the release consults livePinFor BEFORE toggling a record (one truth at the door); the arm travels in a body portal; the footers read page links; a dropped thumbnail saves the card BEFORE the record that names it; the tab\'s X asks first without the "Don\'t ask me again" tick', Object.values(u).every(Boolean), JSON.stringify(u));
  const tabPin = (l) => /requestDelete\(\(\) => \{[\s\S]*?\}, \{ title: t\('linksRemoveTitle'\), always: true, noDontAsk: true \}\)/.test(l)
    && /const id = r\.linkId;\n\s*removePageLink\(id\);/.test(l) && /getBoardActions\(\)\?\.removeConnection\(r\.connId\)/.test(l);
  const u3 = { ...u, tabAsksFirst: tabPin(links) };
  ok('S6-S9 [big-projects-3 successor]: the rail\'s thumbnails declare their entry (CascadeSurvey, the Plan board row, and the Pages pop-out\'s rows); the release consults livePinFor BEFORE toggling a record (one truth at the door); the arm travels in a body portal; the footers read page links; a dropped thumbnail saves the card BEFORE the record that names it; the Grafts tab\'s X (on a grouped row) asks first without the "Don\'t ask me again" tick and removes the row\'s own record or box', Object.values(u3).every(Boolean), JSON.stringify(u3));
  const tabMut = links.replace('always: true, noDontAsk: true', 'always: false');
  ok('S (UI mutant, big-projects-3): letting the Grafts tab\'s X skip its confirm turns the new tab pin RED (the mutation landed)', tabMut !== links && tabPin(links) && tabPin(tabMut) === false, '');
  const um = [
    ['railTagged', () => ui(be, panels, survey.replace('data-link-entry={item.id}', ''), links, dlg)],
    ['oneTruthAtTheDoor', () => ui(be.replace('if (pin) { commit(pin.id); return; }', ''), panels, survey, links, dlg)],
    ['armOverlay', () => ui(be.replace('<svg className="board-connect-overlay" aria-hidden="true">', '<svg className="board-connections" aria-hidden="true">'), panels, survey, links, dlg)],
    ['copyIsLinked', () => ui(be.replace('addPageLink(id, { aBoxId: box.id, bEntryId: entryId });', ''), panels, survey, links, dlg)],
    ['tabAsksFirst', () => ui(be, panels, survey, links.replace('always: true, noDontAsk: true', 'always: false'), dlg)],
    ['dialogNoTick', () => ui(be, panels, survey, links, dlg.replace('{!pending.noDontAsk && (', '{true && ('))],
  ];
  // BIG PROJECTS STEP 3: the 'tabAsksFirst' entry here now judges the PARKED predicate (already false on the rewritten pane), so its "red" is no
  // evidence any more; the tab's live mutant is "S (UI mutant, big-projects-3)" above. The other five entries are unaffected.
  const ured = um.map(([k, fn]) => [k, fn()[k] === false]);
  ok('S (UI mutants): untagging a thumbnail, dropping the one-truth door, moving the arm back into the clipped canvas svg, dropping the link on a copy, letting the tab\'s X skip its confirm, or showing the tick on an unlink each turn their OWN pin RED (each landed)', ured.every(([, v]) => v), JSON.stringify(ured));
  // ledger 86: a release on a rail thumbnail swallows the click that follows it, on BOTH paths (latched and held), BEFORE the held / latched split; the swallow is a beat that removes itself
  const swallowPin = (b) => /const swallowReleaseClick = \(\) => \{\s*const swallow = \(ev: Event\) => \{ ev\.stopPropagation\(\); ev\.preventDefault\(\); \};\s*window\.addEventListener\('click', swallow, true\);\s*setTimeout\(\(\) => window\.removeEventListener\('click', swallow, true\), 100\);\s*\};/.test(b)
    && /const rail = t \? null : railEntryAt\(e\.clientX, e\.clientY\);\s*if \(rail\) swallowReleaseClick\(\);[^\n]*\n\s*if \(connect\.held\) \{/.test(b);
  ok('S10 (ledger 86): a connector release on a rail thumbnail swallows the click that follows it - before the held / latched split, so BOTH paths are covered - and the swallow removes itself after a beat', swallowPin(be), '');
  const swMut = [
    ['the swallow call is gone', be.replace('if (rail) swallowReleaseClick();', '')],
    ['the swallow only covers the latched path', be.replace(/(const rail = t \? null : railEntryAt\(e\.clientX, e\.clientY\);\s*)if \(rail\) swallowReleaseClick\(\);[^\n]*\n(\s*if \(connect\.held\) \{)/, '$1$2').replace('if (t) commit(t); else if (rail) commitEntry(rail.entryId); else endConnect();', 'if (t) commit(t); else if (rail) { swallowReleaseClick(); commitEntry(rail.entryId); } else endConnect();')],
    ['the swallow never lets go', be.replace("setTimeout(() => window.removeEventListener('click', swallow, true), 100);", '')],
  ];
  const swRed = swMut.map(([k, t]) => [k, t !== be && swallowPin(t) === false]);
  ok('S10 (mutants): dropping the swallow, keeping it on the latched path only (the held path then leaks the click), or never removing it turns the pin RED (each landed)', swRed.every(([, v]) => v), JSON.stringify(swRed));
  // ledger 87: a connector's right-button release over a rail thumbnail fires `contextmenu` on THAT TILE, whose own onContextMenu opens its "Delete board" menu; the board's document-capture handler must STOP the event, not only
  // preventDefault it (which only stops the browser's own menu), in the three cases the gesture owns
  const ctxPin = (b) => /if \(connect \|\| performance\.now\(\) < ctxQuietUntil \|\| t\?\.closest\?\.\('\.board-handle'\)\) \{ e\.preventDefault\(\); e\.stopPropagation\(\); return; \}/.test(b) && /document\.addEventListener\('contextmenu', onCtx, true\);/.test(b);
  ok('S11 (ledger 87): the board\'s capture-phase contextmenu handler STOPS the event while the mode is on, in the beat after a right-drag lets go, and on the corner square - so a right-button release over a rail thumbnail cannot open that thumbnail\'s own menu (Delete board)', ctxPin(be), '');
  const ctxMut = [
    ['preventDefault only (the tile\'s own handler still runs)', be.replace('{ e.preventDefault(); e.stopPropagation(); return; }', '{ e.preventDefault(); return; }')],
    ['bubble phase (the tile\'s handler runs first)', be.replace("document.addEventListener('contextmenu', onCtx, true);", "document.addEventListener('contextmenu', onCtx);")],
  ];
  const ctxRed = ctxMut.map(([k, t]) => [k, t !== be && ctxPin(t) === false]);
  ok('S11 (mutants): preventDefault without stopPropagation, or listening in the bubble phase, turns the pin RED (each landed)', ctxRed.every(([, v]) => v), JSON.stringify(ctxRed));
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : `  [${c.detail}]`}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPAGE-LINKS VERIFY: PASS (${checks.length} checks)` : `\nPAGE-LINKS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
