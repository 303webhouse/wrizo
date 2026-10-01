// A11Y A8 (cloud-a11y-audit @ 9c15c86) — the Tutor never announces its
// replies. Fable's own scoped ask: "add a polite live region, so a screen
// reader reads each new reply once and nothing else" — narrower than the
// audit's full A8 fix list (labels, Esc-closes, focus-after-Got-it are not
// this round's job).
//
// Browserless: no box turn needed for this source-level proof. A real
// screen-reader pass (the audit's own stated untested surface: "A live
// Tutor reply — no key, per house rules") is not run here and cannot be —
// this repo's own rule is that no Tutor key is exercised by a harness.
//
// Run: node scripts/harness/a11y-tutor-live-region.mjs   (from apps/desktop).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const tutorSrc = fs.readFileSync(path.join(SRC, 'components/Tutor.tsx'), 'utf8');
const cssSrc = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');

// ---- the live region exists, correctly shaped ------------------------------
ok('A8: a dedicated polite live region is rendered (role="status" aria-live="polite", the sr-only class)',
  /<div className="wz-sr-only" role="status" aria-live="polite">\{replyAnnouncement\}<\/div>/.test(tutorSrc), '');
ok('A8: it is NOT the conversation log itself (.wz-tutor-convo-log) — that div keeps no aria-live of its own, since it also gains the writer\'s own message on every send',
  !/wz-tutor-convo-log[^>]*aria-live/.test(tutorSrc), '');

// ---- the state is set in EXACTLY ONE place: a genuine new reply -----------
const setterCalls = [...tutorSrc.matchAll(/setReplyAnnouncement\(/g)];
ok('A8: setReplyAnnouncement is called exactly ONCE in the whole file',
  setterCalls.length === 1, `found ${setterCalls.length}`);
// The one call must sit inside the `if (result.reply) {` success branch,
// AFTER appendTutorMessage's own tutor-role append and BEFORE the function's
// next statement (advanceTutorCursor) — i.e. adjacent to the exact place a
// genuine new reply is known, not the writer's own message append earlier.
const replyBlockMatch = tutorSrc.match(/if \(result\.reply\) \{\r?\n([\s\S]*?)\r?\n\s*advanceTutorCursor/);
ok('A8: the one call lives inside the result.reply success branch, between the tutor-role append and advanceTutorCursor — never beside the WRITER\'s own message append, never in the draw/offline/error branches',
  !!replyBlockMatch && /setReplyAnnouncement\(result\.reply\)/.test(replyBlockMatch[1]),
  replyBlockMatch ? replyBlockMatch[1].trim() : 'block not found');
const writerAppendLine = tutorSrc.split(/\r?\n/).find((l) => l.includes('appendTutorMessage(entry.id, writerMsg)'));
ok('A8: the writer\'s own message append (a separate line, earlier in the same function) does NOT also set the announcement — confirmed by reading that exact line in isolation',
  !!writerAppendLine && !writerAppendLine.includes('setReplyAnnouncement'), writerAppendLine ?? 'line not found');

// ---- it lives where aria-hidden already silences it while closed ----------
const panelOpenTag = tutorSrc.match(/<div className="wz-tutor-panel" aria-hidden=\{!open\}[^>]*>\r?\n(\s*\{\/\*[\s\S]*?\*\/\}\r?\n)?\s*<div className="wz-sr-only"/);
ok('A8: the live region is the FIRST thing inside .wz-tutor-panel (aria-hidden={!open}) — an aria-hidden ancestor already keeps a live region silent while the Tutor is closed, so no new closed-state guard was needed',
  !!panelOpenTag, '');

// ---- CSS: sr-only is the clip pattern (AT-visible, visually hidden) — ----
// NOT display:none or visibility:hidden, either of which would ALSO hide it
// from assistive tech and defeat the whole point.
const srOnlyRule = cssSrc.match(/\.wz-sr-only\{[^}]*\}/);
ok('A8 CSS: .wz-sr-only exists, uses the standard clip-rect(0,0,0,0) pattern, and does NOT use display:none or visibility:hidden (either would hide it from screen readers too)',
  !!srOnlyRule && /clip:\s*rect\(0,0,0,0\)/.test(srOnlyRule[0]) && !/display:\s*none/.test(srOnlyRule[0]) && !/visibility:\s*hidden/.test(srOnlyRule[0]),
  srOnlyRule ? srOnlyRule[0] : 'rule not found');

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nA11Y-TUTOR-LIVE-REGION PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: no earlier check ever asserted the Tutor had (or lacked) a live region.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nA11Y-TUTOR-LIVE-REGION VERIFY: PASS (${checks.length} checks)`
  : `\nA11Y-TUTOR-LIVE-REGION VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
