// THE UPSERT PAIRING CHECK — every /sync upsert's four hand-written lists must agree.
//
// WHY IT EXISTS. `apps/server/src/sync.ts` copies each record field by field
// through FOUR lists written out by hand — the insert column list, the values
// placeholder list, the on-conflict set, and the parameter array — plus a read
// mapper. Nothing in the language ties them together. A field missing from one
// of them is dropped SILENTLY, in both directions, which is the whole reason
// Experiment 1's `page_links` had to be asked for as a column at all.
//
// A MISCOUNT LOOKS EXACTLY LIKE CORRECT CODE, so this counts programmatically
// over the full enumeration and prints the PAIRING, not just the totals — a
// wrong ORDER has the right count.
//
// ⚠ AND IT MUST NOT PASS WHILE BLIND. Item 198 added `synced_at = now()` to every
// on-conflict set: an assignment whose right-hand side is NOT `excluded.<same>`.
// The first version of this check simply did not match it — so it passed, and
// "invisible" was mistaken for "allowed". It could equally have missed a real
// fault like `page_links = now()`. Non-paired assignments are now ENUMERATED and
// checked against a named allowlist, so a new one fails until someone declares it.
//
// Browserless. Run: node scripts/exp1-upsert-pairing.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const SRC = join(repo, 'apps/server/src/sync.ts');

// Assignments in an on-conflict set whose right-hand side is deliberately NOT
// `excluded.<same column>`. Each one needs a reason on the record, or it is a
// bug wearing a server stamp.
const SERVER_STAMPED = {
  // ITEM 198 — the server's own sync cursor. Stamped by Postgres, never by a
  // client, and it sits inside the last-writer-wins guard so only an ACCEPTED
  // write moves it.
  synced_at: 'now()',
};

const src = readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');

let failures = 0;
let failuresBootstrap = 0;
const fail = (m) => { failures++; console.log('  FAIL ' + m); };

// Every upsert in the file, parsed by SCANNING rather than by one big regex.
//
// ⚠ THE REGEX VERSION PARSED FOUR OF SIX AND CALLED IT A RUN. It required the
// column list on its own line (so `insert into drafts (id, ...)` on one line was
// invisible) and allowed only `/* */` between the SQL and the parameter array (so
// `projects`, which carries a `//` comment there, mis-split its parameters 9-for-15
// and reported a false fault). A parser that silently covers a subset is the
// listing trap in another costume: the number looked measured and was not. The
// COUNT of parsed upserts is therefore asserted against the count of `insert into`
// occurrences, below.
const insertCount = (src.match(/`insert into /g) || []).length;

const between = (from, a, b) => {
  const i = src.indexOf(a, from);
  if (i < 0) return null;
  const j = src.indexOf(b, i + a.length);
  if (j < 0) return null;
  return { text: src.slice(i + a.length, j), end: j };
};

const blocks = [];
for (const m of src.matchAll(/`insert into (\w+)/g)) {
  const table = m[1];
  const open = src.indexOf('(', m.index + m[0].length);
  const cl = src.indexOf(')', open);
  const colSrc = src.slice(open + 1, cl);
  const v = between(cl, 'values', 'on conflict (id) do update set');
  if (!v) continue;
  const valSrc = v.text.slice(v.text.indexOf('(') + 1, v.text.lastIndexOf(')'));
  const setEnd = src.indexOf('\n         where ', v.end);
  const setSrcRaw = src.slice(v.end + 'on conflict (id) do update set'.length, setEnd < 0 ? v.end : setEnd);
  // The parameter array: the first `[` after the SQL's closing backtick, with
  // BOTH comment styles stripped so a comment between them cannot eat parameters.
  const tick = src.indexOf('`,', setEnd);
  const lb = src.indexOf('[', tick);
  let depth = 0, end = lb;
  for (let i = lb; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  const argSrc = src.slice(lb + 1, end)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/[^\n]*$/gm, '');
  blocks.push([null, table, colSrc, valSrc, setSrcRaw, null, argSrc]);
}

if (blocks.length === 0) {
  console.log('FAIL — no upserts parsed; the instrument, not the product. Refusing to report a clean run over zero sites.');
  process.exit(1);
}
if (blocks.length !== insertCount) {
  console.log(`FAIL — COVERAGE: ${insertCount} upserts in the file, ${blocks.length} parsed. A clean verdict over a subset is worthless.`);
  failuresBootstrap++;
}
console.log(`upserts parsed: ${blocks.length} of ${insertCount} in the file\n`);

for (const m of blocks) {
  const [, table, colSrc, valSrc, setSrcRaw, , argSrc] = m;
  const cols = colSrc.split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
  const vals = valSrc.split(',').map((s) => s.trim()).filter(Boolean);

  // split the parameter array on TOP-LEVEL commas only (JSON.stringify(...) has none)
  const params = [];
  let depth = 0, cur = '';
  for (const ch of argSrc) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) { params.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) params.push(cur.trim());

  const setSrc = setSrcRaw.replace(/\/\*[\s\S]*?\*\//g, '');
  // Quoted identifiers are real: `"order" = excluded."order"`. Matching only
  // \w+ missed it and reported "order is never updated on conflict" — a FALSE
  // PRODUCT FAULT out of an instrument gap. The source says otherwise, and the
  // source was checked before the finding was believed.
  const unq = (x) => x.replace(/^"|"$/g, '');
  const assigns = [...setSrc.matchAll(/("?\w+"?)\s*=\s*([^,\n]+)/g)]
    .map(([, lhs, rhs]) => ({ lhs: unq(lhs), rhs: rhs.trim() }));

  const problems = [];
  const nums = vals.map((v) => { const g = v.match(/^\$(\d+)/); return g ? Number(g[1]) : NaN; });

  if (cols.length !== vals.length) problems.push(`columns ${cols.length} != placeholders ${vals.length}`);
  if (cols.length !== params.length) problems.push(`columns ${cols.length} != parameters ${params.length}`);
  nums.forEach((n, i) => { if (n !== i + 1) problems.push(`placeholder #${i + 1} is $${Number.isNaN(n) ? vals[i] : n}`); });

  // Classify every assignment. Paired, allowlisted, or a fault.
  const paired = [];
  const stamped = [];
  for (const a of assigns) {
    const ex = a.rhs.match(/^excluded\.("?[\w]+"?)$/);
    if (ex) {
      paired.push(a.lhs);
      if (unq(ex[1]) !== a.lhs) problems.push(`set mismatch: ${a.lhs} = excluded.${ex[1]}`);
      if (!cols.includes(a.lhs)) problems.push(`set column not in the insert list: ${a.lhs}`);
      continue;
    }
    if (SERVER_STAMPED[a.lhs] === a.rhs) { stamped.push(`${a.lhs} = ${a.rhs}`); continue; }
    problems.push(`UNDECLARED non-paired assignment: ${a.lhs} = ${a.rhs} — if this is deliberate, declare it in SERVER_STAMPED with its reason`);
  }

  // A column in the insert list that is NEVER updated on conflict. Three are
  // correct and expected; anything else is likely a forgotten set line.
  const EXPECTED_IMMUTABLE = ['id', 'user_id', 'created_at'];
  const notSet = cols.filter((c) => !paired.includes(c) && !stamped.some((s) => s.startsWith(c + ' ')));
  const unexpected = notSet.filter((c) => !EXPECTED_IMMUTABLE.includes(c));
  for (const c of unexpected) {
    problems.push(`column "${c}" is inserted but NEVER updated on conflict — a second write of the same record would silently keep the old value`);
  }

  const status = problems.length ? 'FAIL' : ' ok ';
  console.log(`${status} ${table}: ${cols.length} columns / ${vals.length} placeholders / ${params.length} parameters`
    + ` | paired ${paired.length} | server-stamped [${stamped.join(', ') || 'none'}]`
    + ` | immutable [${notSet.join(', ')}]`);
  for (const p of problems) fail(`${table}: ${p}`);
}

// The one this arc added, asserted by name so a rename cannot quietly drop it.
const journal = blocks.find((m) => m[1] === 'journal_entries');
if (!journal) fail('journal_entries upsert not found at all');
else {
  const cols = journal[2].split(',').map((s) => s.trim());
  if (!cols.includes('page_links')) fail('journal_entries no longer inserts page_links');
  if (!/page_links = excluded\.page_links/.test(journal[4])) fail('journal_entries no longer updates page_links on conflict');
  if (!/JSON\.stringify\(e\.pageLinks \?\? null\)/.test(journal[6])) fail('journal_entries no longer passes e.pageLinks');
  if (!/pageLinks: r\.page_links \?\? undefined/.test(src)) fail('the read mapper no longer returns pageLinks');
}

console.log('\n' + (failures === 0
  ? `UPSERT PAIRING: CLEAN — ${blocks.length} upserts, all four lists agree`
  : `UPSERT PAIRING: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
