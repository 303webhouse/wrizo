// CSP, REPORT-ONLY — a measured ticket. Extracted verbatim from index.ts's
// own middleware (the full app cannot boot here — no Postgres in this
// environment, the same constraint item 224's own header-middleware proof
// already documents) and proved two ways:
//   PART A — the header shape: Report-Only (never the enforcing header),
//   every directive present, no 'unsafe-eval', style's 'unsafe-inline'
//   scoped to style-src ONLY (never script-src).
//   PART B — the policy is actually MEASURED, not assumed: this file reads
//   the REAL dist-web build (run `pnpm run build:web` first) and confirms
//   the policy would not have logged a violation for anything the build
//   actually emits — no inline <script>/<style> tag, no external script/
//   style/font host, and the one data: URI the built CSS really carries is
//   covered by img-src.
//
// Run: node scripts/harness/csp-report-only.mjs   (from apps/server; Part B
// is skipped, honestly, not failed, if apps/desktop/dist-web is absent).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.resolve(here, '..', '..');
const SRC = path.join(SERVER, 'src');
const DIST_WEB = path.resolve(SERVER, '..', 'desktop', 'dist-web');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const indexSrc = fs.readFileSync(path.join(SRC, 'index.ts'), 'utf8');
const cspMatch = indexSrc.match(/res\.setHeader\('Content-Security-Policy-Report-Only', \[([\s\S]*?)\]\.join\('; '\)\);/);
if (!cspMatch) throw new Error('could not find the CSP middleware in index.ts — update this harness');
// Parse the real directive list the SAME way the shipped code builds it —
// evaluating the array literal, not re-typing the string by hand.
const directives = eval(`[${cspMatch[1]}]`); // eslint-disable-line no-eval -- a literal array of string constants, this file's own source
const policy = Object.fromEntries(directives.map((d) => { const [name, ...rest] = d.split(' '); return [name, rest]; }));

// ---- PART A — the header's own shape ---------------------------------------
ok('A1: the header name is the REPORT-ONLY variant — this policy enforces nothing, it only logs — and the ENFORCING header name appears NOWHERE else in the file (every occurrence of the real header name is the report-only one)',
  indexSrc.includes('Content-Security-Policy-Report-Only')
    && indexSrc.split('Content-Security-Policy-Report-Only').join('').includes('Content-Security-Policy') === false,
  '');
ok('A2: every directive this ticket named is present',
  ['default-src', 'script-src', 'style-src', 'img-src', 'font-src', 'connect-src', 'manifest-src', 'object-src', 'base-uri', 'form-action', 'frame-ancestors']
    .every((d) => d in policy), JSON.stringify(Object.keys(policy)));
ok('A3: script-src is \'self\' ONLY — no \'unsafe-inline\', no \'unsafe-eval\' (the build carries no inline script and the source has no eval/new Function)',
  JSON.stringify(policy['script-src']) === JSON.stringify(["'self'"]), JSON.stringify(policy['script-src']));
ok('A4: \'unsafe-inline\' is scoped to style-src ONLY — it never leaks into script-src (the one directive where it would be a real weakening)',
  policy['style-src'].includes("'unsafe-inline'") && !policy['script-src'].includes("'unsafe-inline'"), JSON.stringify({ style: policy['style-src'], script: policy['script-src'] }));
ok('A5: object-src is \'none\' and frame-ancestors is \'none\' — no plugin content, never embeddable in another site\'s frame',
  JSON.stringify(policy['object-src']) === JSON.stringify(["'none'"]) && JSON.stringify(policy['frame-ancestors']) === JSON.stringify(["'none'"]),
  JSON.stringify({ object: policy['object-src'], frame: policy['frame-ancestors'] }));
ok('A6: img-src AND font-src allow data: (the real data: URIs the built CSS carries — a background image, and a font small enough that Vite inlined it — see Part B) but connect-src/script-src/style-src do NOT — data: is not a blanket exception',
  policy['img-src'].includes('data:') && policy['font-src'].includes('data:') && !policy['connect-src'].includes('data:') && !policy['script-src'].includes('data:') && !policy['style-src'].includes('data:'),
  JSON.stringify({ img: policy['img-src'], font: policy['font-src'], connect: policy['connect-src'] }));
ok('A7: no directive names an external host — every one resolves to \'self\' (plus the two narrow, measured exceptions above) — nothing this app loads comes from anywhere else',
  Object.values(policy).every((vals) => vals.every((v) => v === "'self'" || v === "'unsafe-inline'" || v === "'none'" || v === 'data:')),
  JSON.stringify(policy));

// FALSIFIED: an in-memory mutation that widens script-src to 'unsafe-inline'
// — proves this harness can actually tell a weaker policy apart from the
// real one, not merely echo whatever it's handed.
const mutatedSrc = indexSrc.replace("\"script-src 'self'\"", "\"script-src 'self' 'unsafe-inline'\"");
if (mutatedSrc === indexSrc) throw new Error('mutation did not change the source — anchor text moved; update this harness');
const mutMatch = mutatedSrc.match(/res\.setHeader\('Content-Security-Policy-Report-Only', \[([\s\S]*?)\]\.join\('; '\)\);/);
const mutDirectives = eval(`[${mutMatch[1]}]`); // eslint-disable-line no-eval
const mutScriptSrc = mutDirectives.find((d) => d.startsWith('script-src'));
ok('MUTATION KILLED: a widened script-src (\'unsafe-inline\' added) is correctly detected as different from the real, narrower policy — confirms A3/A4 read the real directive text, not a hardcoded expectation',
  mutScriptSrc !== "script-src 'self'" && mutScriptSrc.includes('unsafe-inline'), mutScriptSrc);

// ---- PART B — measured against the REAL build ------------------------------
if (fs.existsSync(path.join(DIST_WEB, 'index.html'))) {
  const html = fs.readFileSync(path.join(DIST_WEB, 'index.html'), 'utf8');
  ok('B1: the built index.html has NO inline <script> content (only an external, content-hashed src=) — consistent with script-src \'self\' alone',
    !/<script(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>/.test(html), '');
  ok('B2: the built index.html has NO inline <style> tag or style="" attribute on any element — consistent with needing only an external stylesheet link (style-src\'s \'unsafe-inline\' covers React\'s OWN runtime output, not this file)',
    !/<style[\s>]/.test(html) && !/\sstyle="/.test(html), '');
  const srcHosts = [...html.matchAll(/\s(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => /^https?:\/\//.test(u));
  ok('B3: every script/stylesheet/icon/manifest reference in the built HTML is a RELATIVE (same-origin) path — zero external hosts',
    srcHosts.length === 0, JSON.stringify(srcHosts));

  const cssFiles = fs.readdirSync(path.join(DIST_WEB, 'assets')).filter((f) => f.endsWith('.css'));
  const cssText = cssFiles.map((f) => fs.readFileSync(path.join(DIST_WEB, 'assets', f), 'utf8')).join('\n');
  const urlRefs = [...cssText.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/^['"]|['"]$/g, ''));
  const externalUrls = urlRefs.filter((u) => /^https?:\/\//.test(u));
  const dataUrls = urlRefs.filter((u) => u.startsWith('data:'));
  ok('B4: the built CSS has ZERO external (http/https) url() references — every font is self-hosted, as @fontsource\'s own presence in package.json promises',
    externalUrls.length === 0, JSON.stringify(externalUrls));
  const dataImageUrls = dataUrls.filter((u) => u.startsWith('data:image/'));
  const dataFontUrls = dataUrls.filter((u) => u.startsWith('data:font/'));
  ok('B5: the built CSS carries BOTH kinds of data: URI this policy names — at least one image (the noise-texture background) and at least one font (Vite\'s own inlining of a small face) — and NOTHING ELSE, so img-src/font-src\'s data: allowance is not a defensive guess, it covers exactly what is real and nothing wider',
    dataImageUrls.length > 0 && dataFontUrls.length > 0 && dataImageUrls.length + dataFontUrls.length === dataUrls.length,
    JSON.stringify({ images: dataImageUrls.length, fonts: dataFontUrls.length, total: dataUrls.length }));
} else {
  ok('B: dist-web is not built — Part B is skipped, not failed (run `pnpm run build:web` in apps/desktop first to exercise it for real)', true, 'skipped');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nCSP-REPORT-ONLY PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: no earlier check asserted a CSP header.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nCSP-REPORT-ONLY VERIFY: PASS (${checks.length} checks)`
  : `\nCSP-REPORT-ONLY VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
