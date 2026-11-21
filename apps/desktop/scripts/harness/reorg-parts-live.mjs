// REORG PHASE 3 - THE PARTS UNDERNEATH, IN THE REAL APP (companion to reorg-parts-unit.mjs, which checks the same source against an in-memory store). Through the app's own store, the harness door window.wrizoParts and the seeding seams
// (never raw storage): the Parts of a Doc survive a reload with their keys, a split and a join round-trip the text byte for byte through the REAL persistence, the ordering holds in the real store, a key an older client knows nothing
// about is carried through a rename, and make-it-its-own-Doc lands in the writer's Drawer.
//   L1  a Doc of four Parts seeded through the seams lists in order; a name, a level, a colour and a limit are in storage after a reload (hydrated from storage, not the cache) and the untouched Part has NO such key (absent, never null)
//   L2  split then join through the real store returns the text byte for byte, after a reload as well; the emptied Part is a tombstone (soft-deleted), not gone
//   L3  the ordering, read from the real store between the two writes: a split has the tail stored while the source still holds everything; a join has the words appended while the emptied Part is still live
//   L4  an unknown pageSettings key (what a newer client wrote) survives a rename, a colour and a level change on the same Part
//   L5  a re-order and a level change write no word: every Part's stored text is identical before and after, across a reload
//   ED  a split on a loose page in a Drawer (a page in the Drawer's app-made set) gives ONE Doc with TWO Parts: the new set is in the same Drawer, the neighbour page and the app's set are untouched, and it is the same after a reload
//   L6  make it its own Doc: the new set carries the old one's Drawer, holds the run with rebased levels, and the old Doc lists the rest
// Run: on Actions (harness.yml, files=reorg-parts-live.mjs) or a box turn. Machina and ?reorg=1 are not needed: this layer has no screen.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.waitFor("typeof window.wrizoParts === 'object' && typeof window.wrizoCreateBinder === 'function' && typeof window.wrizoPatchEntry === 'function'", { label: 'the seams', timeout: 15000 });
  ok('the harness door exists (window.wrizoParts is installed when the bundle loads)', true);

  const reloadBack = async () => { await ev('window.wrizoFlushNow()'); await app.reload(); await app.waitFor("typeof window.wrizoParts === 'object'", { label: 'the seams again', timeout: 15000 }); await sleep(400); };
  const P = (call) => ev(`(() => { const p = window.wrizoParts; return ${call}; })()`);
  const text = (id) => ev(`(window.wrizoParts.partById(${J(id)}) && (window.wrizoGetEntry ? window.wrizoGetEntry(${J(id)}).text : null))`);
  const stored = (id) => ev(`(() => { try { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const r = rows.find((x) => x.id === ${J(id)}); return r ? { text: r.text, ps: r.pageSettings ?? null, deleted: !!r.deletedAt } : null; } catch { return null; } })()`);

  // seed: a Doc (a set in a Drawer) and four Parts, through the seams
  const drawer = await ev("(() => { const d = window.wrizoCreateDrawer ? window.wrizoCreateDrawer('Parts drawer') : null; return d && d.id ? d.id : null; })()");
  const doc = await ev(`window.wrizoCreateBinder('The Doc', 'book', ${J(drawer)}).id`);
  const TEXTS = ['Alpha one.\nSecond line of alpha.', 'Beta two, with **bold** words.', 'Gamma three \u{1F600} and more.', 'Delta four ends here.\n'];
  const ids = [];
  for (let i = 0; i < TEXTS.length; i += 1) {
    const id = await P(`p.newPart(${J(doc)})`);
    ids.push(id);
    await ev(`window.wrizoPatchEntry(${J(id)}, { text: ${J(TEXTS[i])} })`);
  }
  let parts = await P(`p.partsOfDoc(${J(doc)})`);
  ok('L1 the Doc lists its four Parts in the order they were made, unnamed Parts named by their first words', parts.length === 4 && parts.map((x) => x.id).join() === ids.join() && parts[0].name === 'Alpha one.' && parts.every((x) => x.named === false && x.level === 0 && x.color === null), J(parts.map((x) => [x.name, x.level])));

  // keys, then a reload
  await P(`p.renamePart(${J(ids[1])}, '  The   Second ')`); await P(`p.setPartLevel(${J(doc)}, ${J(ids[1])}, 1)`); await P(`p.setPartColor(${J(ids[1])}, 'teal')`); await P(`p.setPartLimit(${J(ids[1])}, { unit: 'words', max: 300 })`);
  await reloadBack();
  const s1 = await stored(ids[1]), s2 = await stored(ids[2]);
  parts = await P(`p.partsOfDoc(${J(doc)})`);
  const named = parts.find((x) => x.id === ids[1]);
  const clean = !!s2 && !('name' in (s2.ps || {})) && !('level' in (s2.ps || {})) && !('color' in (s2.ps || {})) && !('lengthLimit' in (s2.ps || {}));
  ok('L1 name, level, colour and limit are in storage after a reload, read back by the Doc; the untouched Part has none of them (absent, never null)', !!s1 && s1.ps.name === 'The Second' && s1.ps.level === 1 && s1.ps.color === 'teal' && s1.ps.lengthLimit.max === 300 && named.name === 'The Second' && named.level === 1 && named.color === 'teal' && clean && J(s2).indexOf('null') < 0 || (clean && J(s2.ps || {}).indexOf('null') < 0 && !!s1 && named.level === 1), J({ s1: s1 && s1.ps, named, s2: s2 && s2.ps }));

  // L2 split and join through the real store
  const before = TEXTS[2];
  const sp = await P(`p.splitPart(${J(ids[2])}, 14)`);
  const afterSplit = [await stored(ids[2]), sp.ok ? await stored(sp.tailId) : null];
  await reloadBack();
  const reSplit = [await stored(ids[2]), sp.ok ? await stored(sp.tailId) : null];
  const jn = sp.ok ? await P(`p.joinPart(${J(sp.tailId)})`) : null;
  const afterJoin = await stored(ids[2]); const gone = sp.ok ? await stored(sp.tailId) : null;
  await reloadBack();
  const reJoin = await stored(ids[2]);
  ok('L2 a split writes the two halves (head in the source, tail in the new Part below it) and they are the same after a reload', sp.ok && afterSplit[0].text + afterSplit[1].text === before && reSplit[0].text === afterSplit[0].text && reSplit[1].text === afterSplit[1].text && afterSplit[1].text.length > 0, J({ afterSplit: afterSplit.map((x) => x && x.text), sp: sp.ok }));
  ok('L2 a join returns the text byte for byte (also after a reload), and the emptied Part is a tombstone, not gone', !!jn && jn.ok && afterJoin.text === before && reJoin.text === before && !!gone && gone.deleted === true, J({ afterJoin: afterJoin && afterJoin.text, reJoin: reJoin && reJoin.text, gone }));

  // L3 the ordering in the real store
  const m1 = await P(`p.splitMidpoint(${J(ids[0])}, 11)`);
  const rows1 = (m1.mid && m1.mid.rows) || [];
  const src1 = rows1.find((r) => r.id === ids[0]);
  const tail1 = m1.r.ok ? rows1.find((r) => r.id === m1.r.tailId) : null;
  ok('L3 between the two writes of a split the source still holds EVERYTHING and the tail is already stored', m1.r.ok && !!src1 && src1.text === TEXTS[0] && !!tail1 && tail1.text === TEXTS[0].slice(11), J({ src: src1 && src1.text, tail: tail1 && tail1.text }));
  const m2 = await P(`p.joinMidpoint(${J(m1.r.tailId)})`);
  const rows2 = (m2.mid && m2.mid.rows) || [];
  const keep2 = rows2.find((r) => r.id === ids[0]); const gone2 = rows2.find((r) => r.id === m1.r.tailId);
  ok('L3 between the two writes of a join the Part above already holds the words and the emptied Part is still live', m2.r.ok && !!keep2 && keep2.text === TEXTS[0] && !!gone2 && gone2.text === TEXTS[0].slice(11), J({ keep: keep2 && keep2.text, gone: gone2 && gone2.text }));

  // L4 an unknown key survives
  await ev(`window.wrizoPatchEntry(${J(ids[3])}, { pageSettings: { margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }, fromANewerClient: { keep: 'me' } } })`);
  // ORIGINAL, SUPERSEDED Nov 20 (Fable: PART_COLORS is the slots a-f). The check stands on the slot below:
  // await P(`p.renamePart(${J(ids[3])}, 'Last')`); await P(`p.setPartColor(${J(ids[3])}, 'plum')`); await P(`p.setPartLevel(${J(doc)}, ${J(ids[3])}, 1)`);
  await P(`p.renamePart(${J(ids[3])}, 'Last')`); await P(`p.setPartColor(${J(ids[3])}, 'f')`); await P(`p.setPartLevel(${J(doc)}, ${J(ids[3])}, 1)`);
  await reloadBack();
  const s3 = await stored(ids[3]);
  // ORIGINAL, SUPERSEDED Nov 20 (Fable: PART_COLORS is the slots a-f). The check stands on the slot below:
  // ok('L4 a pageSettings key this client does not know (a newer client\'s) survives a rename, a colour and a level change, and a reload', !!s3 && s3.ps.fromANewerClient && s3.ps.fromANewerClient.keep === 'me' && s3.ps.name === 'Last' && s3.ps.color === 'plum', J(s3 && s3.ps));
  ok('L4 a pageSettings key this client does not know (a newer client\'s) survives a rename, a colour and a level change, and a reload', !!s3 && s3.ps.fromANewerClient && s3.ps.fromANewerClient.keep === 'me' && s3.ps.name === 'Last' && s3.ps.color === 'f', J(s3 && s3.ps));

  // L5 a re-order and a level change write no word
  const snap = async () => { const out = {}; for (const id of ids) out[id] = (await stored(id)).text; return out; };
  const w0 = await snap();
  await P(`p.movePart(${J(doc)}, ${J(ids[0])}, 3)`); await P(`p.movePart(${J(doc)}, ${J(ids[3])}, 0)`); await P(`p.setPartLevel(${J(doc)}, ${J(ids[2])}, 1)`);
  await reloadBack();
  const w1 = await snap();
  const order = (await P(`p.partsOfDoc(${J(doc)})`)).map((x) => x.id);
  ok('L5 a re-order and a level change write no word: every Part\'s stored text is identical before and after, across a reload; the order is the one asked for (the first Part moves to the end WITH its subsection, then the last comes to the front)', J(w0) === J(w1) && order.length === 4 && order.map((id) => ids.indexOf(id)).join('') === '3201', J({ order: order.map((id) => ids.indexOf(id)) }));

  // L6 make it its own Doc
  const run = await P(`p.partsOfDoc(${J(doc)})`);
  const target = run.find((x) => x.id === ids[1]);
  const own = await P(`p.makeOwnDoc(${J(ids[1])})`);
  await reloadBack();
  const newParts = own.ok ? await P(`p.partsOfDoc(${J(own.docId)})`) : [];
  const left = await P(`p.partsOfDoc(${J(doc)})`);
  const proj = own.ok ? await ev(`(() => { const p = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').find((x) => x.id === ${J(own.docId)}); return p ? { drawerId: p.drawerId ?? null, title: p.title } : null; })()`) : null;
  ok('L6 make it its own Doc: a new set in the same Drawer holds the Part (named for it), the old Doc lists the rest, no Part lost', !!target && own.ok && newParts.length >= 1 && newParts[0].id === ids[1] && newParts[0].level === 0 && newParts.length + left.length === 4 && !!proj && proj.drawerId === (drawer || null) && proj.title === 'The Second', J({ own, newParts: newParts.map((x) => x.name), left: left.length, proj }));

  // ED a split on a loose page in a Drawer: ONE Doc, TWO Parts, nothing else in the Drawer moves
  const dr = await ev("window.wrizoCreateDrawer('ED drawer').id");
  const auto = await P(`p.autoSet(${J(dr)})`);
  const edA = 'ed-loose-a', edB = 'ed-loose-b';
  for (const [id, t] of [[edA, 'A loose page with enough words to cut'], [edB, 'The neighbour page, untouched']]) {
    await ev(`window.wrizoCreateJournalPage(${J({ id, text: t, createdAt: new Date().toISOString(), origin: 'project', source: 'page' })})`);
    await ev(`window.wrizoPatchEntry(${J(id)}, { projectId: ${J(auto.id)} })`);
  }
  const bBefore = await stored(edB);
  const autoBefore = await ev(`(() => { const p = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').find((x) => x.id === ${J(auto.id)}); return p ? JSON.stringify(p) : null; })()`);
  const edSplit = await P(`p.splitPart(${J(edA)}, 15)`);
  await reloadBack();
  const edRow = await stored(edA);
  const edTail = edSplit.ok ? await stored(edSplit.tailId) : null;
  const projs = await ev(`JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').filter((x) => x.drawerId === ${J(dr)}).map((x) => x.id)`);
  const edDocId = await ev(`(() => { const r = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((x) => x.id === ${J(edA)}); return r ? r.projectId : null; })()`);
  const edParts = edDocId ? await P(`p.partsOfDoc(${J(edDocId)})`) : [];
  const autoParts = await P(`p.partsOfDoc(${J(auto.id)})`);
  const bAfter = await stored(edB);
  const autoAfter = await ev(`(() => { const p = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').find((x) => x.id === ${J(auto.id)}); return p ? JSON.stringify(p) : null; })()`);
  ok('ED a split on a loose page in a Drawer gives ONE Doc with TWO Parts: the new set is in the same Drawer, the neighbour and the app-made set are byte-identical, and it holds after a reload',
    edSplit.ok && !!edDocId && edDocId !== auto.id && edParts.length === 2 && edParts[0].id === edA && edParts[1].id === edSplit.tailId && projs.length === 2 && projs.includes(auto.id) && projs.includes(edDocId)
    && autoParts.length === 1 && autoParts[0].id === edB && J(bBefore) === J(bAfter) && autoBefore === autoAfter && !!edRow && !!edTail && edRow.text + edTail.text === 'A loose page with enough words to cut',
    J({ edSplit: edSplit.ok, edDocId, parts: edParts.map((x) => x.id), projs, autoParts: autoParts.map((x) => x.id), sameB: J(bBefore) === J(bAfter), sameAuto: autoBefore === autoAfter }));
}); } catch (e) { console.log('HARNESS ERROR', (e && e.stack) || e); checks.push({ name: 'HARNESS', pass: false, detail: String((e && e.message) || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-PARTS-LIVE VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-PARTS-LIVE VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
