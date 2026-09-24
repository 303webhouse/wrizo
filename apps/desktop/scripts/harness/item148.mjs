// ITEM 148 — EVERY SEAM, NOT FOUR VERBS.   Run: node apps/desktop/scripts/harness/item148.mjs   (browserless)
//
// seed-guard's OBS-1 check says "the next seam cannot quietly opt out" and reads ONE file for four VERBS. This is
// the inversion (scripts/seam-census.mjs does the reading): EVERY `window.wrizo*` seam in EVERY source file, in
// every attachment form, is DURABLE or a NAMED EXEMPTION WITH A WRITTEN REASON, and every exemption's CLAIM is
// CHECKED against what the seam's code actually reaches.
//
//   SUPERSEDES nothing: seed-guard.mjs's OBS-1 check stays exactly as it was and stays TRUE (it is now a strict
//   subset of this one). This file is the stronger instrument beside it, so nothing is parked or edited there.
//
// "DEBOUNCED WRITER" IS DERIVED (any function whose call graph reaches persistence.ts's scheduleFlush, followed
// across modules), never listed. A read-only exemption is a CLAIM: if the seam reaches a debounced writer it is
// not true, and the guard says so.
//
// THE GUARD IS ITS OWN SUBJECT'S EVIDENCE, IN THREE PARTS (a guard that reads nothing passes everything):
//   1. COVERAGE beside every "zero defects": files read, seams found, the AST count equal to an independent
//      TEXTUAL count, debounced writers derived. A scan that finds none of them is blind, not clean.
//   2. THE REAL TREE: no UNDURABLE unit, no unlisted unit, no stale/mismatched/placeholder exemption, and the
//      regressions this item fixed (wrizoPairing's writers, wrizoBible's writers, wrizoTouchInOrder) named.
//   3. FALSIFICATION on a VIRTUAL copy of the tree (nothing on disk is touched): each defect class is injected,
//      the injection is asserted to have LANDED, and the guard must go red on it.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, textualSeamCount } from '../seam-census.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// ---------------------------------------------------------------------------
// THE EXEMPTIONS. A unit that is not DURABLE needs an entry: its class, and why. `ns.*` covers every member of a
// namespace, and is used ONLY where every member is one class - each member's class is still checked one by one,
// so a member that starts to write turns the wildcard's claim false and the guard red.
// ---------------------------------------------------------------------------
const RO = 'READ-ONLY'; const SYNC = 'SYNC-WRITE';
const EXEMPT = {
  'wrizoFlushNow': [ 'FLUSH', 'It IS the flush: it calls flushNow() and nothing else, so wrapping it in a flusher would flush twice.' ],
  'wrizoBoard': [ RO, 'Returns the mounted board editor\'s live boxes ref for inspection; reaches no store writer and no storage.' ],
  'wrizoNotebook': [ RO, 'Lists the notebook pages through pure ordering helpers (pageOrder.ts); reads the cache, writes nothing.' ],
  'wrizoResume': [ RO, 'getResumeTarget only reads the store to name where the writer left off; the pointer is a read.' ],
  'wrizoVocab': [ RO, 'describeTarget is a pure lexicon lookup over a resume target; no store access.' ],
  '__wrizoRouteForEntry': [ RO, 'routeForEntry is a pure entry-to-route mapping; no store access.' ],
  'wrizoTutorSessionCost': [ RO, 'Reads the in-memory session cost counter; nothing is stored.' ],
  'wrizoThemeFx.register': [ RO, 'Registers a theme-effect callback in an in-memory registry for the harness to drive; no persistence.' ],
  'wrizoFirstLineInvite.*': [ RO, 'The invitation\'s nudge pool: a constant exposed for inspection.' ],
  'wrizoDecks.*': [ RO, 'Deck library inspection (ids, default answers, deal counts): pure functions over static deck data.' ],
  'wrizoStructure.*': [ RO, 'Board structure derivations (order, lanes, card test, parenting) computed from a boxes array; no store access.' ],
  'wrizoDeskLexicon.*': [ RO, 'The desk lexicon: a lookup function and a list of canonical terms; static strings.' ],
  'wrizoLexicon.*': [ RO, 'The theme lexicon: lookup functions and a term list over static tables.' ],
  'wrizoFluxFx.*': [ RO, 'Interval arithmetic for the flux theme effect; pure numbers in, numbers out.' ],
  'wrizoDirty.*': [ RO, 'Reads the dirty-tracking sets that persistence keeps in memory; inspection only, nothing written.' ],
  'wrizoDerived.*': [ RO, 'Derived membership reads (journal, shelf, notebook ids) over the cache; the pairing tests read counts from here.' ],
  'wrizoTutorFreeWriteDeck.*': [ RO, 'The free-write deck\'s pools and constants, exposed for inspection; static data.' ],
  '__wrizoRhizomeEngine.*': [ RO, 'The rhizome growth engine: pure seeded functions and constants; no store access.' ],
  'wrizoAssist.*': [ RO, 'The AI-assist rail\'s in-memory visibility state (show/clear); it persists nothing.' ],
  'wrizoPairing.planBoardId': [ RO, 'Reads which plan board a page is paired to (the reader half of the namespace; the three writers are wrapped).' ],
  'wrizoPairing.pairedPageId': [ RO, 'Reads which page a plan board is paired to.' ],
  'wrizoPairing.isPaired': [ RO, 'Reads whether a plan board is currently paired.' ],
  'wrizoBible.get': [ RO, 'Reads a project\'s Bible facts (the reader half; add/edit/delete are wrapped).' ],
  'wrizoTheme.get': [ RO, 'Returns the current theme id from module state.' ],
  'wrizoTheme.REGISTERED': [ RO, 'The list of registered theme ids: a constant.' ],
  'wrizoTheme.set': [ SYNC, 'setTheme writes its own localStorage key immediately (a synchronous write, no debounce), so a reload cannot lose it.' ],
  'wrizoThemePrefs.get': [ RO, 'Reads the theme preferences from module state.' ],
  'wrizoThemePrefs.set': [ SYNC, 'setThemePrefs writes its own localStorage key immediately; not a debounced collection write.' ],
  'wrizoAmbiance.get': [ RO, 'Reads the ambiance dial from module state.' ],
  'wrizoAmbiance.effective': [ RO, 'Computes the effective ambiance from the dial and the reduced-motion setting; pure.' ],
  'wrizoAmbiance.reducedMotion': [ RO, 'Reads the reduced-motion preference; pure.' ],
  'wrizoAmbiance.intervalScale': [ RO, 'Computes an interval scale factor from the dial; pure.' ],
  'wrizoAmbiance.set': [ SYNC, 'setAmbiance writes its own localStorage key immediately; not a debounced collection write.' ],
  'wrizoBoardMode.get': [ RO, 'Reads a board\'s remembered mode from module state.' ],
  'wrizoBoardMode.set': [ SYNC, 'setBoardMode writes its own localStorage key immediately; not a debounced collection write.' ],
  'wrizoSectionFold.get': [ RO, 'Reads a section\'s folded state from module state.' ],
  'wrizoSectionFold.defaultCollapsed': [ RO, 'The default-collapsed rule for a section; pure.' ],
  'wrizoSectionFold.set': [ SYNC, 'Writes the fold map to its own localStorage key immediately; not a debounced collection write.' ],
  'wrizoPlanTrail.getLastPlanBoard': [ RO, 'Reads the last plan board id from module state.' ],
  'wrizoPlanTrail.rememberLastPlanBoard': [ SYNC, 'Writes the last plan board id to its own localStorage key immediately; not a debounced collection write.' ],
};
const PLACEHOLDER = /^(todo|tbd|n\/a|na|none|read-only|readonly|ok|fine|exempt|wip)\.?$/i;
const MIN_REASON = 30;

// ---------------------------------------------------------------------------
// THE JUDGEMENT (pure over a files map + an exemption table; run on the real tree and on virtual mutants)
// ---------------------------------------------------------------------------
function judge(files, table) {
  const r = analyze(files);
  const problems = [];
  const P = (kind, key, detail = '') => problems.push({ kind, key, detail });
  const matches = (entryKey, unitKey) => (entryKey.endsWith('.*') ? unitKey.startsWith(entryKey.slice(0, -1)) : entryKey === unitKey);
  const used = new Set();
  for (const u of r.units) {
    if (u.klass === 'UNDURABLE') { P('undurable', u.key, `${u.file}:${u.line} reaches a debounced writer and routes through no flusher`); continue; }
    if (u.klass === 'DURABLE') {
      const claim = Object.keys(table).find((k) => matches(k, u.key));
      if (claim) { used.add(claim); P('mismatch', u.key, `has an exemption (${table[claim][0]}) but is DURABLE`); }
      continue;
    }
    const claim = Object.keys(table).find((k) => matches(k, u.key));
    if (!claim) { P('unlisted', u.key, `${u.file}:${u.line} is ${u.klass} and has no named exemption`); continue; }
    used.add(claim);
    if (table[claim][0] !== u.klass) P('mismatch', u.key, `the exemption says ${table[claim][0]} but the code is ${u.klass}`);
  }
  for (const [k, [klass, reason]] of Object.entries(table)) {
    if (!used.has(k)) P('stale', k, 'an exemption that matches no live seam');
    if (typeof reason !== 'string' || reason.trim().length < MIN_REASON || PLACEHOLDER.test(reason.trim())) P('placeholder', k, 'the reason is missing or too thin to be one');
    if (!['READ-ONLY', 'SYNC-WRITE', 'FLUSH'].includes(klass)) P('badclass', k, `unknown class ${klass}`);
  }
  for (const f of r.flusherProblems) P('flusher', f, 'a durable* wrapper that does not reference flushNow: every DURABLE verdict rests on it');
  return { ...r, problems, textual: textualSeamCount(files) };
}

// ---------------------------------------------------------------------------
// THE REAL TREE
// ---------------------------------------------------------------------------
const real = new Map();
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f)) real.set(relative(SRC, p).split('\\').join('/'), readFileSync(p, 'utf8').replace(/\r\n/g, '\n')); } };
walk(SRC);
const R = judge(real, EXEMPT);
const byKind = (k) => R.problems.filter((p) => p.kind === k).map((p) => p.key);
const classOf = (key) => R.units.find((u) => u.key === key)?.klass;
const tally = {}; for (const u of R.units) tally[u.klass] = (tally[u.klass] ?? 0) + 1;

ok('COVERAGE: every source file under src/ was read (a scan that read fewer than the tree holds is blind)', R.fileCount === real.size && real.size >= 100, `${R.fileCount} files`);
const seamCoverageOk = (J) => J.seams.length >= 40 && J.seams.length === J.textual;
ok('COVERAGE: the seams were FOUND, and the AST count equals an independent textual count of wrizo* assignments (two measurements that do not import each other)',
  seamCoverageOk(R), `ast ${R.seams.length} / textual ${R.textual}`);
ok('COVERAGE: units (seams + namespace members) were judged, and the debounced writers were DERIVED, not listed (a trace that reaches none is blind)',
  R.units.length >= 80 && R.debouncedWriters >= 20, `${R.units.length} units; ${R.debouncedWriters} persistence functions reach scheduleFlush; classes ${JSON.stringify(tally)}`);
ok('COVERAGE: the flush wrappers exist and each really references flushNow (else every DURABLE verdict is a lie)', R.flusherDefs.length >= 2 && R.flusherProblems.length === 0, JSON.stringify({ defs: R.flusherDefs, gutted: R.flusherProblems }));
ok('SEAMS: no unit reaches a debounced writer without routing through a flusher (UNDURABLE — the footgun that cost 36 of 80 files on a stamped leg)', byKind('undurable').length === 0, JSON.stringify(byKind('undurable')));
ok('SEAMS: every non-durable unit has a NAMED exemption (a new seam, or a new namespace member, cannot opt out quietly)', byKind('unlisted').length === 0, JSON.stringify(byKind('unlisted')));
ok('SEAMS: every exemption\'s CLAIM matches what the code reaches, and none is stale', byKind('mismatch').length === 0 && byKind('stale').length === 0, JSON.stringify({ mismatch: byKind('mismatch'), stale: byKind('stale') }));
ok('SEAMS: every reason is a real one (present, not a placeholder, at least 30 characters)', byKind('placeholder').length === 0 && byKind('badclass').length === 0, JSON.stringify(byKind('placeholder')));
ok('SEAMS: the flush wrappers are sound (no durable* wrapper is gutted)', byKind('flusher').length === 0, JSON.stringify(byKind('flusher')));
const MUST = ['wrizoPairing.birth', 'wrizoPairing.pair', 'wrizoPairing.unpair', 'wrizoBible.add', 'wrizoBible.edit', 'wrizoBible.delete', 'wrizoTouchInOrder', 'wrizoCopyCardToBoard', 'wrizoCreateJournalPage', 'wrizoPatchEntry'];
ok('REGRESSION (the three blind spots this item found): wrizoPairing\'s writers (by SHAPE), wrizoBible\'s writers (by FILE) and wrizoTouchInOrder (by VERB) are DURABLE, with the older seams beside them',
  MUST.every((k) => classOf(k) === 'DURABLE'), JSON.stringify(Object.fromEntries(MUST.map((k) => [k, classOf(k)]))));

// ---------------------------------------------------------------------------
// FALSIFICATION — on a VIRTUAL copy; each injection asserted to have landed; the guard must go red on it
// ---------------------------------------------------------------------------
const mutate = (path, from, to) => {
  const src = real.get(path);
  if (!src || !src.includes(from)) return null;
  const m = new Map(real); m.set(path, src.replace(from, to));
  return m.get(path) === src ? null : m;
};
const inject = (path, src) => { const m = new Map(real); m.set(path, src); return m; };
const falsify = (name, files, kind, key, table = EXEMPT) => {
  if (!files) { ok(`FALSIFICATION ${name}: the injection LANDED`, false, 'the anchor text is not in the source — nothing below is evidence'); return; }
  const J = judge(files, table);
  const hit = J.problems.find((p) => p.kind === kind && (key === undefined || p.key === key));
  ok(`FALSIFICATION ${name} — must go RED as ${kind}${key ? ` on ${key}` : ''}`, !!hit, hit ? hit.detail : `GREEN — problems: ${JSON.stringify(J.problems.slice(0, 3))}`);
};
falsify('M1 wrizoPairing.birth loses its wrapper (the by-SHAPE blind spot)', mutate('store/persistence.ts', 'birth: durableSeam(getOrCreatePlanBoard)', 'birth: getOrCreatePlanBoard'), 'undurable', 'wrizoPairing.birth');
falsify('M2 wrizoBible.add loses its wrapper (the by-FILE blind spot)', mutate('store/tutorBible.ts', 'add: durableSeam(addFact)', 'add: addFact'), 'undurable', 'wrizoBible.add');
falsify('M3 wrizoTouchInOrder stops flushing (the by-VERB blind spot)', mutate('store/persistence.ts', '    flushNow();\n    return out;\n  };', '    return out;\n  };'), 'undurable', 'wrizoTouchInOrder');
falsify('M4 a brand-new verbless seam in a brand-new file writes through saveProject unwrapped',
  inject('store/quietWriter.ts', "import { saveProject } from './persistence';\nif (typeof window !== 'undefined') {\n  (window as unknown as { wrizoQuiet?: unknown }).wrizoQuiet = (p: never) => saveProject(p);\n}\n"), 'undurable', 'wrizoQuiet');
falsify('M5 a brand-new read-only seam with no exemption cannot opt out quietly',
  inject('store/quietReader.ts', "if (typeof window !== 'undefined') {\n  (window as unknown as { wrizoQuietRead?: unknown }).wrizoQuietRead = () => 1;\n}\n"), 'unlisted', 'wrizoQuietRead');
falsify('M6 a namespace member added later, in the element-access form, is seen and judged',
  inject('store/quietMember.ts', "const w = window as unknown as Record<string, unknown>;\nw['wrizoQuietBracket'] = () => 1;\n"), 'unlisted', 'wrizoQuietBracket');
falsify('M7 a READ-ONLY claim that has become false (wrizoBible.get now writes) is caught',
  mutate('store/tutorBible.ts', 'get: getBibleFacts,', 'get: (p: string) => { addFact(p, \'x\'); return getBibleFacts(p); },'), 'undurable', 'wrizoBible.get');
falsify('M8 a gutted flush wrapper (durableSeam no longer flushes) is caught — every DURABLE verdict rests on it',
  mutate('store/persistence.ts', 'return (...args: A): R => { const out = fn(...args); flushNow(); return out; };', 'return (...args: A): R => { const out = fn(...args); return out; };'), 'flusher', 'durableSeam');
falsify('M9 an exemption for a seam that no longer exists is STALE', real, 'stale', 'wrizoGone', { ...EXEMPT, wrizoGone: [RO, 'An exemption whose seam was deleted must not survive the deletion quietly.'] });
falsify('M10 a placeholder reason is not a reason', real, 'placeholder', 'wrizoBoard', { ...EXEMPT, wrizoBoard: [RO, 'read-only'] });
falsify('M11 a claim that contradicts the code is caught (wrizoTheme.set called READ-ONLY while it writes storage)', real, 'mismatch', 'wrizoTheme.set', { ...EXEMPT, 'wrizoTheme.set': [RO, 'A deliberately wrong claim: the setter is not a reader, and the guard must say so.'] });
{
  const blind = judge(new Map(), EXEMPT);
  ok('FALSIFICATION M12 a scan that reads NOTHING is caught by coverage rather than passing as "zero defects" (the item-141 blind-guard failure)',
    blind.seams.length === 0 && !seamCoverageOk(blind), `seams found ${blind.seams.length}; the same coverage predicate the real tree passes goes red`);
}

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Parks nothing: this file supersedes no assertion (seed-guard's OBS-1 stays true and untouched). The count is
  // printed from the array so a future park cannot be added without this line seeing it.
  // eslint-disable-next-line no-console
  console.log(parkedChecks.every((c) => c.pass)
    ? `\nITEM148 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; nothing parked`
    : `\nITEM148 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
console.log(pass ? `\nITEM148 VERIFY: PASS (${all.length} checks)` : `\nITEM148 VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);
