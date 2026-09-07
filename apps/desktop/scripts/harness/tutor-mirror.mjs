// TUTOR MIRROR — the drift check that makes the mirror law self-enforcing
// (item 113, ratified 2026-09-02). A committed verification scenario, per
// AGENTS.md's "Harness scenarios persist".
// Run: node scripts/harness/tutor-mirror.mjs   (from apps/desktop)
//
// STATIC, BROWSERLESS — the same shape as hooks-order.mjs. It reads two files
// off disk and compares them; there is nothing to render, so it costs the suite
// a few milliseconds and no browser.
//
// THE LAW IT ENFORCES, quoted from the mirror's own header:
//   "Prompt and record move as one: any future change to the constant amends
//    this file in the same commit."
// `docs/wrizo-alpha/tutor-rules.md` is the disk home of the Tutor's rules and
// holds the shipped `SYSTEM_PROMPT` verbatim, "so the record and the running
// system can never quietly diverge again."
//
// WHY IT EXISTS — because that law was ALREADY BROKEN when this check was
// written, and had been for days. Item 84 TD4 (`6aa9144`) added the selection
// paragraph to `SYSTEM_PROMPT` and touched `tutor.ts` ALONE; the mirror never
// moved with it. Measured on `origin/main` at `7d7f06f`, three days and 43
// commits later, through two ships: the constant was 2422 chars / 5 blocks and
// the mirror 1988 / 4. Nobody noticed — not the author, not the reviewer, even
// though main's own review line records the SYSTEM_PROMPT change explicitly.
// NOTHING FAILED, so nothing was seen. That is the whole argument for this file:
// a law held by discipline alone is a law that gets missed silently, and the
// person who misses it is not being careless — they are being unassisted.
//
// WHAT IT DELIBERATELY DOES NOT DO: it does not check the prompt's CONTENT. It
// has no opinion on what the Tutor should say, which paragraphs should exist,
// or where they sit. It asserts one thing only — that the two copies say the
// same thing — because that is the only claim the mirror's header makes, and a
// check that quietly grew opinions about prompt wording would start failing for
// reasons nobody signed up for.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// Absolute, derived from this file's own location — never a relative path off a
// persisted cwd, which is how a runner ends up reading a different worktree than
// the one it believes it is measuring.
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..');
const TS = resolve(REPO, 'apps/server/src/tutor.ts');
const MD = resolve(REPO, 'docs/wrizo-alpha/tutor-rules.md');

// LINE ENDINGS ARE NORMALISED BEFORE ANYTHING IS COMPARED, and that is not a
// loosening of "byte-for-byte" — it is what makes the claim checkable at all.
// This repo runs `core.autocrlf=true` with no `.gitattributes`, so a Windows
// checkout writes CRLF into the working tree while git stores LF in the blob.
// Comparing raw working-tree bytes would compare CHECKOUT POLICY, not content:
// the same commit would pass on one machine and fail on another, and CI would
// disagree with the desk that wrote it. This was not theoretical — the first
// draft of this check split on an LF-only separator, found none in a CRLF
// checkout, and reported a misleading "no separator" failure while NEVER
// RUNNING the equality check at all. It went red for the wrong reason, which is
// its own kind of lying. Normalising to LF compares exactly what git stores,
// which is what the mirror law is actually about.
const NL = /\r\n/g;
const read = (p) => {
  try { return readFileSync(p, 'utf8').replace(NL, '\n'); } catch { return null; }
};

const tsSrc = read(TS);
const mdSrc = read(MD);

ok('both halves of the mirror are on disk where the law says they are (apps/server/src/tutor.ts and docs/wrizo-alpha/tutor-rules.md)',
  tsSrc !== null && mdSrc !== null, `tutor.ts=${tsSrc !== null} tutor-rules.md=${mdSrc !== null}`);

if (tsSrc !== null && mdSrc !== null) {
  // The constant is a single template literal. Matched non-greedily so a later
  // backtick elsewhere in the file cannot swallow the rest of the source.
  const m = /const SYSTEM_PROMPT\s*=\s*`([\s\S]*?)`;/.exec(tsSrc);
  ok('SYSTEM_PROMPT is still a single template literal this check can read — if the constant is ever refactored into pieces, THIS check must be taught the new shape, loudly, rather than silently passing on nothing',
    !!m, m ? `${m[1].length} chars` : 'no `const SYSTEM_PROMPT = `...`;` match');

  // The mirror's body is everything after the `---` that closes its header.
  // The header explains the law; the body IS the prompt.
  const parts = mdSrc.split('\n---\n');
  ok('the mirror still has its header/body separator, so "the body is the prompt" is still a true description of the file',
    parts.length >= 2, `separator count=${parts.length - 1}`);

  if (m && parts.length >= 2) {
    const prompt = m[1].trim();
    const body = parts.slice(1).join('\n---\n').trim();

    const same = prompt === body;
    let where = '';
    if (!same) {
      const n = Math.min(prompt.length, body.length);
      let i = 0;
      while (i < n && prompt[i] === body[i]) i += 1;
      where = i === n
        ? `one is a prefix of the other; prompt=${prompt.length} mirror=${body.length}; extra: ${JSON.stringify((prompt.length > body.length ? prompt : body).slice(n, n + 160))}`
        : `first divergence at char ${i}; prompt: ${JSON.stringify(prompt.slice(Math.max(0, i - 80), i + 80))} | mirror: ${JSON.stringify(body.slice(Math.max(0, i - 80), i + 80))}`;
    }

    ok('THE MIRROR LAW HOLDS: docs/wrizo-alpha/tutor-rules.md reproduces SYSTEM_PROMPT exactly. If this is red, the two were changed apart — amend BOTH in the SAME commit (the mirror is the record; the constant is what ships) rather than editing this check',
      same, same ? `${prompt.length} chars, identical` : where);

    // A cheap structural echo, so a reader of a red run can see at a glance
    // whether a whole paragraph went missing or a single character changed.
    ok('the two halves agree on paragraph COUNT as well as content — a differing count is the signature of a whole block added on one side only, which is exactly how this law was broken before the check existed',
      prompt.split('\n\n').length === body.split('\n\n').length,
      `prompt=${prompt.split('\n\n').length} mirror=${body.split('\n\n').length}`);
  }
}

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nTUTOR-MIRROR VERIFY: PASS (${checks.length} checks)`
  : `\nTUTOR-MIRROR VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
