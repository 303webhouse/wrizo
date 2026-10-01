// A11Y A2 + A7 (cloud-a11y-audit @ 9c15c86) — sign-in's two unreachable links
// and the field-hint contrast. Browserless: no box turn needed for a source-
// level proof; a real CDP keyboard-walk re-run (the audit's own method)
// would be the stronger confirmation once a turn is granted — not run here.
//
// A2 (Blocker, WCAG 2.1.1 Keyboard): "New here? Create an account" and both
// "← back" links were `<span onClick>` — never a Tab stop. Now real
// `<button type="button">`s; this file proves no span survives and all
// three converted.
//
// A7 (Serious): the sign-in field hints ("you@example.com", "password")
// measured 1.78:1 (#463b2c on #150a04). Fixed with a DEDICATED --wz-hint
// token (not raising --wz-whisper, which also colours unrelated decorative
// borders/dots/kbd chrome across this same palette) — this file parses the
// REAL hex values out of the shipped CSS and computes the real WCAG ratio,
// never a copy of the number.
//
// Run: node scripts/harness/a11y-signin.mjs   (from apps/desktop).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
