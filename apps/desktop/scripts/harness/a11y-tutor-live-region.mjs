// A11Y A8 (cloud-a11y-audit @ 9c15c86) — the Tutor never announces its
// replies. Fable's own scoped ask: "add a polite live region, so a screen
// reader reads each new reply once and nothing else" — narrower than the
// audit's full A8 fix list (labels, Esc-closes, focus-after-Got-it are not
// this round's job).
//
// The source-level checks below need no box turn. The LIVE section further
// down (Fable's own follow-up ask, 2026-09-30) does, and proves the
// announcement fires exactly once per reply in a real browser — against
// runtime-verify.mjs's own `/api/_tutor_mode` test double (tu2.mjs's own
// established technique), never a real DeepSeek call: NO TUTOR KEY IS USED
// (the audit's own untested surface, "A live Tutor reply — no key, per
// house rules", stays untested by this file too; the double is not that).
//
// Run: node scripts/harness/a11y-tutor-live-region.mjs   (from apps/desktop,
// dist-web built, WITH an announced box turn for the LIVE section).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

// The path constants were never defined in this file (the static checks read
// SRC before any browser section ran) — same two lines the sign-in harness uses.
const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// =============================================================================
// LIVE — one announcement per reply, in a real browser (Fable's follow-up
// ask). Fixtures adopted VERBATIM from tu2.mjs: freshDesk/freshProsePage
// (its own skipDisclosure-seeding shape), armTutorMode/openTutor (the
// `/api/_tutor_mode` double this exact technique already established) — not
// re-derived.
// =============================================================================
const freshDesk = async (app, width = 1400, height = 900, { skipDisclosure = true } = {}) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
    + (skipDisclosure ? " localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');" : ''),
  );
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};
const freshProsePage = async (app, width = 1400, height = 900, opts = {}) => {
  await freshDesk(app, width, height, opts);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(400); // store/persistence.ts's own FLUSH_DELAY (300ms)
};
const openTutor = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
  await sleep(300);
};
const armTutorMode = (app, mode) =>
  app.evalJs(`fetch('/api/_tutor_mode', { method: 'POST', body: JSON.stringify(${JSON.stringify(mode)}) })`);
const liveRegionText = (app) => app.evalJs("document.querySelector('.wz-sr-only[role=\"status\"]')?.textContent ?? null");

await withHarness(async (app) => {
  await freshProsePage(app, 1400, 900);
  await armTutorMode(app, { configured: true, reply: 'A stubbed reply — the one this check announces.' });
  await openTutor(app);

  const before = await liveRegionText(app);
  ok('LIVE A8: BEFORE any send, the live region is empty — nothing is announced on mount or on opening the Tutor',
    before === '', JSON.stringify(before));

  await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
  await app.typeKeys('What do you notice?');
  await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
  await sleep(500);

  const afterFirst = await liveRegionText(app);
  ok('LIVE A8: AFTER a genuine reply (through the test double, no real key), the live region holds EXACTLY that reply\'s text — once',
    afterFirst === 'A stubbed reply — the one this check announces.', JSON.stringify(afterFirst));

  // A SECOND send, a DIFFERENT reply — proves the region updates per-reply
  // (not a one-shot that only ever fires the first time) and never carries
  // the WRITER's own just-sent message as a false "announcement".
  await armTutorMode(app, { configured: true, reply: 'A second, different stubbed reply.' });
  await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
  await app.typeKeys('And this one?');
  await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
  await sleep(500);
  const afterSecond = await liveRegionText(app);
  ok('LIVE A8: a SECOND, different reply replaces the live region\'s text — it tracks the latest reply, never freezing on the first one',
    afterSecond === 'A second, different stubbed reply.' && afterSecond !== afterFirst, JSON.stringify({ afterFirst, afterSecond }));
  const writerTextInRegion = await app.evalJs("document.querySelector('.wz-sr-only[role=\"status\"]')?.textContent?.includes('And this one?')");
  ok('LIVE A8: the writer\'s OWN message ("And this one?") never appears in the live region — only the tutor\'s reply is ever announced',
    writerTextInRegion === false, String(writerTextInRegion));
});

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
