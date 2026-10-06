// A11Y A2 + A7 (cloud-a11y-audit @ 9c15c86) — sign-in's two unreachable links
// and the field-hint contrast.
//
// A2 (Blocker, WCAG 2.1.1 Keyboard): "New here? Create an account" and both
// "← back" links were `<span onClick>` — never a Tab stop. Now real
// `<button type="button">`s; the source-level checks below prove no span
// survives and all three converted; the LIVE section further down drives a
// real keyboard walk (Fable's own follow-up ask, 2026-09-30) proving both
// are genuinely reachable by Tab, not merely shaped like a button.
//
// A7 (Serious): the sign-in field hints ("you@example.com", "password")
// measured 1.78:1 (#463b2c on #150a04). Fixed with a DEDICATED --wz-hint
// token (not raising --wz-whisper, which also colours unrelated decorative
// borders/dots/kbd chrome across this same palette) — this file parses the
// REAL hex values out of the shipped CSS and computes the real WCAG ratio,
// never a copy of the number.
//
// Run: node scripts/harness/a11y-signin.mjs   (from apps/desktop, dist-web
// built, WITH an announced box turn — the LIVE section needs the browser
// pool; WS_BOX_TURN is read by withHarness itself, the same as every other
// browser harness in this repo).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// ---- A2: no unreachable spans remain, and three real buttons exist --------
const arrivalSrc = fs.readFileSync(path.join(SRC, 'components/Arrival.tsx'), 'utf8');
const oldSpans = [...arrivalSrc.matchAll(/<span className="wz-link"/g)];
const newButtons = [...arrivalSrc.matchAll(/<button type="button" className="wz-link"/g)];
ok('A2: no <span className="wz-link"> survives anywhere in Arrival.tsx — the exact unreachable shape the audit measured is gone',
  oldSpans.length === 0, `found ${oldSpans.length}`);
ok('A2: all THREE links the audit named are now real buttons — sign-in\'s "Create an account", sign-in\'s "← back", AND the account screen\'s own "← back" (the audit named all three, Arrival.tsx:140/143/160)',
  newButtons.length === 3, `found ${newButtons.length}`);
ok('A2: the exact wording survives unchanged (verbatim house copy, not rewritten in the conversion) — counted in rendered button text only, not this diff\'s own comments',
  /New here\? Create an account/.test(arrivalSrc) && (arrivalSrc.match(/>← back<\/button>/g) || []).length === 2,
  '');

// ---- A2, the chrome reset: a real <button> must not grow native chrome ----
// (the EXACT other defect this same audit found — the board-name button
// missing `background:none`, A7's second row — so this is checked by name,
// not assumed because "I remembered to add it".)
const cssSrc = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
const linkRuleMatch = cssSrc.match(/\.wz-link\{[^}]*\}/);
ok('A2 CHROME: .wz-link resets background/border/padding/margin — so the new <button> renders IDENTICALLY to the old <span>, never the browser\'s own button face',
  !!linkRuleMatch && /background:\s*none/.test(linkRuleMatch[0]) && /border:\s*none/.test(linkRuleMatch[0]) && /padding:\s*0/.test(linkRuleMatch[0]),
  linkRuleMatch ? linkRuleMatch[0] : 'rule not found');
ok('A2 FOCUS: the house\'s own global button:focus-visible brass-ring rule exists and covers every <button> — no new, second focus style was invented for these three',
  /button:focus-visible,[\s\S]{0,400}outline:\s*2px solid var\(--brass\)/.test(cssSrc), '');

// ---- A7: the hint colour is a DEDICATED token, and the REAL value clears 4.5:1 ----
ok('A7: .wz-field::placeholder no longer reads --wz-whisper (the failing, widely-shared token) — it has its own dedicated hint colour now',
  !/\.wz-field::placeholder\{\s*color:var\(--wz-whisper\)/.test(cssSrc), '');
const placeholderMatch = cssSrc.match(/\.wz-field::placeholder\{\s*color:var\((--[\w-]+)\)/);
ok('A7: .wz-field::placeholder reads a CSS variable (not a literal hex baked into the rule, which --wz-hint\'s own comment explains why not)',
  !!placeholderMatch, placeholderMatch ? placeholderMatch[1] : 'no var() found');

function extractVar(name) {
  const m = cssSrc.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  return m ? m[1] : null;
}
const hintVarName = placeholderMatch ? placeholderMatch[1] : '--wz-hint';
const hint = extractVar(hintVarName);
const ground = extractVar('--wz-ground');
const lift = extractVar('--wz-lift');

function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastRatio(a, b) {
  const L1 = luminance(a), L2 = luminance(b);
  const lo = Math.min(L1, L2), hi = Math.max(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

ok('A7: the three real hex values (--wz-hint, --wz-ground, --wz-lift) were all found in the shipped CSS — the ratio below is computed from the actual file, not a remembered number',
  !!hint && !!ground && !!lift, JSON.stringify({ hint, ground, lift }));
if (hint && ground && lift) {
  const onLift = contrastRatio(hint, lift);
  const onGround = contrastRatio(hint, ground);
  const oldRatio = contrastRatio('#463b2c', lift);
  ok(`A7: the REAL shipped hint colour (${hint}) clears 4.5:1 against the field's own background (${lift}): measured ${onLift.toFixed(2)}:1`,
    onLift >= 4.5, onLift.toFixed(2));
  ok(`A7: it also clears 4.5:1 against the screen's base background (${ground}), the reflow case: measured ${onGround.toFixed(2)}:1`,
    onGround >= 4.5, onGround.toFixed(2));
  ok(`A7: the OLD colour, independently re-measured, reproduces the audit's own 1.78:1 finding (${oldRatio.toFixed(2)}:1) — confirms this harness's formula agrees with the audit's instrument before trusting its verdict on the fix`,
    Math.abs(oldRatio - 1.78) < 0.02, oldRatio.toFixed(2));
}
ok('A7: --wz-hint is a NEW, separate token — --wz-whisper\'s own definition is untouched, so this fix cannot have silently changed any of its other (decorative, non-text) uses across the file',
  /--wz-whisper:#463b2c;/.test(cssSrc), '');

// =============================================================================
// LIVE — a real keyboard walk, the audit's own method (Fable's follow-up ask).
// Adopted fixtures: freshArrival's shape is hb1.mjs's own (WS_ANON=1 drives
// Arrival's anon path, the same precedent) — not re-derived. app.key('Tab')
// dispatches a REAL, trusted CDP key event (the house's own "keyboard claims
// verified with trusted key events where the harness supports it" standard),
// not a page-side synthetic dispatch, so this exercises Chromium's own
// default Tab-focus-traversal — the same mechanism a real keyboard does.
// =============================================================================
const freshArrival = async (app) => {
  process.env.WS_ANON = '1'; // read live per-request by runtime-verify.mjs; no session exists yet, so Open reaches sign-in
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival before fixture' });
  await app.emulateDpr(1, 1280, 900);
  await sleep(200); // hb1.mjs's own deflake — a first-paint timing sensitivity on Arrival's first mount, not specific to one door
};

const activeElementDescriptor = (app) => app.evalJs(`(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  return { tag: el.tagName, className: el.className || '', text: (el.textContent || '').trim() };
})()`);

// Tab forward up to `maxSteps` times from whatever currently has focus,
// recording the full walk — the audit's own method ("the keyboard reached
// only these, then cycled"), not a single targeted probe.
const tabWalk = async (app, maxSteps = 12) => {
  const seen = [];
  for (let i = 0; i < maxSteps; i++) {
    await app.key('Tab');
    await sleep(60);
    const d = await activeElementDescriptor(app);
    if (!d) continue;
    seen.push(d);
  }
  return seen;
};

await withHarness(async (app) => {
  await freshArrival(app);
  await app.click('Open'); // authState !== 'authed' under WS_ANON=1 -> Arrival's own handleOpen sets stage 'signin'
  await app.waitFor("!!document.querySelector('.wz-field')", { label: 'sign-in stage reached' });

  const signinWalk = await tabWalk(app, 10);
  const createAccountStop = signinWalk.find((d) => d.text.includes('Create an account'));
  ok('LIVE A2: a real Tab walk from the sign-in screen REACHES "New here? Create an account" — a genuine CDP-dispatched keyboard event, Chromium\'s own default focus traversal, not a page-side simulation',
    !!createAccountStop && createAccountStop.tag === 'BUTTON', JSON.stringify({ walk: signinWalk.map((d) => `${d.tag}:${d.text.slice(0, 30)}`), found: createAccountStop }));
  const backStop = signinWalk.find((d) => d.text === '← back');
  ok('LIVE A2: the SAME walk also reaches sign-in\'s own "← back" — both links the audit named, in one real walk, not two cherry-picked probes',
    !!backStop && backStop.tag === 'BUTTON', JSON.stringify({ found: backStop }));

  // The account screen's own "← back" (Arrival.tsx:164) — a separate screen,
  // a separate walk, exactly as the audit measured it as its own finding.
  await app.click('New here? Create an account');
  await app.waitFor("!!document.querySelector('.wz-field')", { label: 'account stage reached' });
  const accountWalk = await tabWalk(app, 10);
  const accountBackStop = accountWalk.find((d) => d.text === '← back');
  ok('LIVE A2: the account screen\'s own "← back" (the audit\'s third named link) is ALSO reachable by a real Tab walk',
    !!accountBackStop && accountBackStop.tag === 'BUTTON', JSON.stringify({ found: accountBackStop }));
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nA11Y-SIGNIN PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: it falsifies no earlier check (the spans it replaces were never asserted reachable by any prior harness).');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nA11Y-SIGNIN VERIFY: PASS (${checks.length} checks)`
  : `\nA11Y-SIGNIN VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
