// ITEM 207b S0 PROBE (web / Chromium via CDP) - needs a box turn and a fresh `pnpm run build:web`.
//   Run: node <ABSOLUTE>/apps/desktop/scripts/harness/item207b-s0-probe.mjs     (WS_BOX_TURN exported from the grant)
// It MEASURES, and asserts only what makes the measurement honest. Findings go into docs/menus/item207b-s0-device-fonts.md.
//   1. Does `queryLocalFonts` exist, and what does it do WITHOUT a permission grant (the default a page meets)?
//   2. With the `localFonts` permission granted over CDP: how many faces, how many unique families, how long, what fields?
//   3. Is the shipped detector right? `isFontAvailable` and `classifyGeneric` (src/store/fontDetect.ts, bundled here) run
//      against families whose class is KNOWN, and against a name that does not exist.
//   4. What does drawing 300+ rows, each in its own installed face, cost (the roster-in-own-face design at device scale)?
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..', '..');
const { build } = createRequire(createRequire(join(desktop, 'package.json')).resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 300)}]` : ''}`); };
const report = (label, value) => console.log(`REPORT ${label}: ${JSON.stringify(value)}`);

const bundle = (await build({ stdin: { contents: "export * from './store/fontDetect';", resolveDir: join(desktop, 'src'), loader: 'ts' }, bundle: true, write: false, format: 'iife', globalName: '__fd', logLevel: 'silent' })).outputFiles[0].text;

// Ground truth: Windows ships these; a family that is absent on this machine is REPORTED, not counted against the classifier.
const KNOWN = { 'Times New Roman': 'serif', Georgia: 'serif', Cambria: 'serif', 'Palatino Linotype': 'serif', Arial: 'sans-serif', Verdana: 'sans-serif', Calibri: 'sans-serif', 'Segoe UI': 'sans-serif', Tahoma: 'sans-serif', 'Courier New': 'monospace', Consolas: 'monospace', 'Lucida Console': 'monospace' };

await withHarness(async (app) => {
  try {
    await app.emulateDpr(1, 1280, 900);
    await app.goto('/');
    await app.evalJs(bundle);

    // 1 - the API, and its default behaviour with no grant
    const api = await app.evalJs(`({ present: typeof window.queryLocalFonts === 'function', secure: window.isSecureContext, ua: navigator.userAgent.slice(0, 120) })`);
    report('environment', api);
    ok('API: `window.queryLocalFonts` exists in this Chromium', api.present, JSON.stringify(api));
    const noGrant = await app.evalJs(`(async () => { try { const t = performance.now(); const r = await window.queryLocalFonts(); return { ok: true, n: r.length, ms: Math.round(performance.now() - t) }; } catch (e) { return { ok: false, name: e && e.name, message: String(e && e.message).slice(0, 120) }; } })()`);
    report('queryLocalFonts with NO permission grant and no user activation', noGrant);

    // 2 - granted
    let grant = 'ok';
    try { await app.cdp('Browser.grantPermissions', { permissions: ['localFonts'] }); } catch (e) { grant = `grantPermissions refused: ${String(e && e.message).slice(0, 160)}`; }
    report('CDP Browser.grantPermissions localFonts', grant);
    const granted = await app.evalJs(`(async () => { try { const t = performance.now(); const r = await window.queryLocalFonts(); const ms = Math.round(performance.now() - t);
      const fam = new Set(r.map(f => f.family)); const sample = r[0] ? Object.keys(Object.getPrototypeOf(r[0])).concat(Object.keys(r[0])) : [];
      return { ok: true, faces: r.length, families: fam.size, ms, fields: [...new Set(sample)], first: r[0] ? { family: r[0].family, fullName: r[0].fullName, postscriptName: r[0].postscriptName, style: r[0].style } : null, hasArial: fam.has('Arial'), hasTNR: fam.has('Times New Roman') }; } catch (e) { return { ok: false, name: e && e.name, message: String(e && e.message).slice(0, 160) }; } })()`);
    report('queryLocalFonts WITH the grant', granted);
    ok('ENUMERATION: with the grant the API returns faces and a family list (or the refusal is named)', granted.ok ? granted.faces > 0 && granted.families > 0 : true, JSON.stringify(granted));
    if (granted.ok) ok('ENUMERATION: it returns NAMES and styles only — the fields carry family / fullName / postscriptName / style (and a blob() reader we never call)', ['family', 'fullName', 'postscriptName', 'style'].every((k) => granted.fields.includes(k)), JSON.stringify(granted.fields));

    // 3 - the detector against known families
    const rows = await app.evalJs(`(() => { const out = {}; for (const n of ${JSON.stringify(Object.keys(KNOWN))}) out[n] = { installed: __fd.isFontAvailable(n), cls: __fd.classifyGeneric(n) }; out['Wrizo Definitely Absent'] = { installed: __fd.isFontAvailable('Wrizo Definitely Absent'), cls: null }; return out; })()`);
    report('detector rows', rows);
    ok('DETECT: a family that does not exist is reported NOT installed', rows['Wrizo Definitely Absent'].installed === false, JSON.stringify(rows['Wrizo Definitely Absent']));
    const present = Object.keys(KNOWN).filter((n) => rows[n].installed);
    ok('DETECT: at least six of the twelve known Windows families read as installed (an environment with none proves nothing about the detector)', present.length >= 6, JSON.stringify(present));
    const wrong = present.filter((n) => rows[n].cls !== KNOWN[n]);
    ok('CLASSIFY: every INSTALLED known family is classed correctly (serif / sans-serif / monospace)', wrong.length === 0, JSON.stringify(wrong.map((n) => [n, rows[n].cls, 'expected', KNOWN[n]])));

    // 4 - the cost of the list at device scale: one row per unique family, each in its own face
    const cost = await app.evalJs(`(async () => { let names = []; try { names = [...new Set((await window.queryLocalFonts()).map(f => f.family))]; } catch (e) { return { skipped: String(e && e.name) }; }
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:260px;height:400px;overflow:auto;z-index:99999;background:#fff';
      const t0 = performance.now();
      for (const n of names) { const r = document.createElement('div'); r.textContent = n; r.style.cssText = "font-family:'" + n.replace(/'/g, '') + "';font-size:14px;padding:4px 8px"; host.appendChild(r); }
      document.body.appendChild(host); host.getBoundingClientRect();
      const t1 = performance.now();
      host.style.contentVisibility = 'visible'; for (const r of host.children) r.style.cssText += ';content-visibility:auto;contain-intrinsic-size:auto 26px'; host.getBoundingClientRect();
      const t2 = performance.now(); host.remove();
      return { rows: names.length, layoutMsPlain: Math.round(t1 - t0), layoutMsContentVisibility: Math.round(t2 - t1) }; })()`);
    report('cost of one row per family, each set in its own face', cost);
  } catch (e) { ok('DRIVER: the probe ran to its end without a thrown error', false, String(e && e.stack || e).slice(0, 400)); }
});

const pass = checks.every((c) => c.pass);
console.log(pass ? `\nITEM207B-S0 VERIFY: PASS (${checks.length} checks)` : `\nITEM207B-S0 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
