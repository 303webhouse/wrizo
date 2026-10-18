// THE AUTISM ECONOMY SEED - THE LOCK, checked without a browser (Fable, Oct 18: "lock wrizoSeed behind the same confirmation, and use the
// in-app dialog in the order confirm -> export -> delete"). Runs the app's REAL store and seams (store/seedSeams.ts, store/deleteSeams.ts,
// store/destructiveGate.ts) in node, on a deployed-looking host, the way delete-for-good-check.mjs does.
//   G1  a BARE call to window.wrizoSeed's writes and its export refuses and changes nothing; its counts still answer (the dry run is counts only)
//   G2  after the in-app confirmation (the dialog's own submit, trusted, exact phrase) the same calls work, in that page session
//   G3  a fresh page session is locked again (memory only)
//   G4  the script asks through the app's own dialog (window.wrizoDestructive.request), injects no overlay of its own, and orders
//       confirm -> export -> delete in its source (the live run on the box proves it in a browser)
// Run (repo root): node apps/desktop/scripts/seed/autism-economy-gate-check.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installClientGlobals, loadClientStore } from '../lib/client-node.mjs';

installClientGlobals({ base: null, hostname: 'writer.example.com' });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const refusal = (fn) => { try { fn(); return false; } catch (e) { return /refused/i.test(String(e && e.message)); } };

// ---- G1-G2: one page session
{
  const S = await loadClientStore(['seedSeams']);
  const P = S.persistence;
  const G = S.destructiveGate;
  const W = globalThis.wrizoSeed;
  const binder = P.createProject('A binder that must stay bare', 'academic');
  const entriesBefore = P.getJournalEntries().length;
  const refusedBoard = !!W && refusal(() => W.createBoardPage(binder.id, 'console board'));
  const refusedSave = !!W && refusal(() => W.saveBoardBoxes('anything', []));
  const refusedExport = !!W && refusal(() => W.exportEverything());
  let counts = null;
  try { counts = W.counts(); } catch { counts = null; }
  ok('G1: a BARE call to window.wrizoSeed\'s writes and its export refuses (no in-app confirmation this page session) and changes nothing; its counts still answer',
    refusedBoard && refusedSave && refusedExport && P.getJournalEntries().length === entriesBefore && !!counts && typeof counts.documents === 'number'
      && G.isDestructiveUnlocked() === false,
    JSON.stringify({ refusedBoard, refusedSave, refusedExport, entries: [entriesBefore, P.getJournalEntries().length], counts: !!counts }));

  const answered = G.requestDestructiveConfirm({ title: 't', lines: [], phrase: 'DELETE EVERYTHING' });
  G.submitDestructiveConfirm('DELETE EVERYTHING', true);
  const yes = await Promise.race([answered, new Promise((r) => setTimeout(() => r('timeout'), 500))]);
  let board = null, exported = null;
  try { board = W.createBoardPage(binder.id, 'confirmed board'); } catch (e) { board = String(e && e.message); }
  try { exported = W.exportEverything(); } catch (e) { exported = String(e && e.message); }
  ok('G2: after the in-app confirmation the same calls work, in that page session',
    yes === true && !!board && typeof board === 'object' && board.pageType === 'board' && !!exported && typeof exported === 'object' && typeof exported.content === 'string',
    JSON.stringify({ yes, board: board && (board.id ? 'board' : board), exported: exported && (exported.content !== undefined ? 'doc' : exported) }));
}

// ---- G3: a fresh page session
{
  await loadClientStore(['seedSeams']);
  const W = globalThis.wrizoSeed;
  const refused = refusal(() => W.exportEverything());
  ok('G3: a fresh page session (a reload) is locked again - the confirmation lives in memory only', refused, JSON.stringify({ refused }));
}

// ---- G4: the script's order
{
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'autism-economy.mjs'), 'utf8');
  const at = (re) => { const m = re.exec(src); return m ? m.index : -1; };
  const confirm = at(/window\.wrizoDestructive\.request\(/);
  const exportAt = at(/window\.wrizoSeed\.exportEverything\(\)/);
  const wipe = at(/d\.softAll\(\)/);
  ok('G4: the script asks through the app\'s own dialog (wrizoDestructive.request), injects no overlay of its own, and runs confirm -> export -> delete',
    confirm > 0 && exportAt > confirm && wipe > exportAt && !/wz-seed-confirm|document\.createElement\('div'\)/.test(src),
    JSON.stringify({ confirm, exportAt, wipe }));
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nAUTISM-ECONOMY-GATE-CHECK VERIFY: PASS (${checks.length} checks)` : `\nAUTISM-ECONOMY-GATE-CHECK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
