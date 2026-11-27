// MOBILE-B (Nov 26) - THE COMPANION'S BUILD MUST NOT CHANGE THE DESK'S. RED FIRST: written while slice 1 built the companion as a second entry of the desk's own build, which renamed the desk's bundle
// from assets/index-*.js to assets/main-*.js. Both halves of the stale-tab guard find the build by that name (server/src/build.ts parseBuild; store/clientBuild.ts parseClientBuild), so both read
// "no build" and a tab left open across a deploy went on syncing. Many harness files find the bundle by that name too.
//   BUILD-DESK   the desk's page names its entry assets/index-*.js, and the server and the client both read the same build from it
//   BUILD-ALONE  the desk's build holds nothing of the companion (no second page, so no shared bundle split off for it)
//   BUILD-M      the web build also builds /m/, and no file of the companion's is named like the desk's entry
// Builds in memory with the app's own config files (nothing is written). Browserless. Run: node scripts/harness/mobile-build-unit.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = await import('vite');
const ts = require('typescript');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const load = (file) => {
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', '__dirname', out)(createRequire(file), module.exports, module, path.dirname(file));
  return module.exports;
};
const server = load(path.resolve(DESKTOP, '..', 'server', 'src', 'build.ts'));
const client = load(path.join(DESKTOP, 'src', 'store', 'clientBuild.ts'));

async function inMemory(config) {
  const r = await build({ root: DESKTOP, configFile: path.join(DESKTOP, config), logLevel: 'silent', build: { write: false, outDir: 'dist-web' } });
  return (Array.isArray(r) ? r : [r]).flatMap((x) => x.output);
}
const names = (out) => out.map((o) => o.fileName);
const page = (out, name) => { const a = out.find((o) => o.fileName === name); return a ? String(a.source) : ''; };

const desk = await inMemory('vite.config.ts');
const html = page(desk, 'index.html');
const scripts = [...html.matchAll(/<script type="module"[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
const fromServer = server.parseBuild(html);
const fromClient = client.parseClientBuild({ protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/', userAgent: 'Mozilla/5.0 Chrome/128', scriptSrcs: scripts });
ok('BUILD-DESK the desk\'s page names assets/index-*.js, and the server and the client read the same build from it', !!fromServer && fromServer === fromClient, `entry=${scripts.join(',')} server=${fromServer} client=${fromClient}`);

const strays = names(desk).filter((n) => /(^|\/)m\/|publishingHtml/.test(n)).concat(names(desk).filter((n) => n.endsWith('.html') && n !== 'index.html'));
ok('BUILD-ALONE the desk\'s build holds nothing of the companion: one page, no bundle split off to share with it', strays.length === 0 && !/modulepreload/.test(html), `pages/shared: ${strays.join(', ') || 'none'}; preload=${/modulepreload/.test(html)}`);

const script = JSON.parse(fs.readFileSync(path.join(DESKTOP, 'package.json'), 'utf8')).scripts['build:web'];
const mobileConfig = 'vite.mobile.config.ts';
if (!fs.existsSync(path.join(DESKTOP, mobileConfig))) ok('BUILD-M the web build also builds /m/, with no file named like the desk\'s entry', false, mobileConfig + ' does not exist yet');
else {
  const m = await inMemory(mobileConfig);
  const like = names(m).filter((n) => /^assets\/index-/.test(n));
  const mHtml = page(m, 'm/index.html');
  ok('BUILD-M the web build also builds /m/, with no file named like the desk\'s entry', script.includes(mobileConfig) && /<script type="module"[^>]*src="\.\.\/assets\/m-/.test(mHtml) && like.length === 0 && !names(m).includes('index.html'),
    `build:web="${script}" m/index.html=${!!mHtml} like-the-desk: ${like.join(', ') || 'none'}`);
}

for (const c of checks) console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.detail ? '  [' + c.detail + ']' : ''));
const bad = checks.filter((c) => !c.pass);
console.log(`\nMOBILE-BUILD VERIFY: ${bad.length ? 'FAIL - ' + bad.length + '/' + checks.length + ' failed' : 'PASS (' + checks.length + ' checks)'}`);
process.exit(bad.length ? 1 : 0);
