// TH-MACHINA, THE BROWSERLESS HALF (step 4 of the Oct 21 build queue; docs/plans/machina-build.md §4). No box turn needed: pure source reads, and the REAL stores/lexicons bundled with esbuild and
// run in Node (the theme-picker-logic.mjs / item207-core.mjs technique), so the checks run the SHIPPED source, not a copy. The DOM-level half (computed styles under each CAST, the Run strip,
// the celebration timing, the lexicon on screen) is th-machina.mjs's, on a box turn.
//
// What is proven (phase A of the build - tokens, CAST, lexicons, icons, fonts; phase B - Run, sparks, splash, picker card, CAST control - extends this file as it lands):
//   TOKENS   M1  every token Flux's blocks set is ALSO set by Machina's blocks (a missing one is an Arbor/Flux LEAK into Machina) - minus the two Flux-only slots (--paper-edge, --flux-offset)
//            M2  the mockup's own values, per cast: ground / chrome / rail / line / line-strong / active carrier (steel cool, orange neutral) / live / ink, and the four page pairs of foundations §4
//            M3  the measured floors, COMPUTED here from the CSS (not asserted from a comment): page text >= 7:1 on the paper, meta (--ink-on-paper-low) >= 4.5:1, and --text-low >= 4.5:1 on the
//                ground, the rail AND the chrome surface, in BOTH casts and both page tones
//   THEME    M4  'machina' is registered (ThemeId, REGISTERED) and has its THEME_CONFIG slot
//   CAST     M5  the store, run for real: default cool; set(neutral) under Machina puts data-cast on <html>; switching to Arbor REMOVES the attribute and getCast() answers the fixed default while the
//                STORED value survives (lossless round-trip); back to Machina restores neutral; a garbage stored value falls through to cool; CAST never reaches the server (zero schema)
//   LEXICON  M6  the locked words resolve under Machina (Sprint / Build / Edit / Finalize, Plan door kept as 'Plan', Files, Plans, Notebook, Controls, Theme, Consultant, Assets, Parts, Forms, Run, Inbox)
//            M7  themeLexicon: Project / Folder / File / Plan / Block / Notebook / Deliverable / Sprint / HQ / Compliance / Finalize - and the Voice Wall chip reads COMPLIANCE
//            M8  NO LEAK: no Machina desk string still names an Arbor or Flux noun (Drawer, Board, Page, Journal, Graft, Rack, Cartridge, Circuit, Node, Doc, Operator, ...), on a reviewed keep-list
//            M9  Workshop is not given a Machina word (hidden in every theme until built) - modeWorkshop is not overridden
//   ICONS    M10 all nine ThemeIconId slots have a Machina glyph; the Notebook is the SPIRAL (not the ledger); the set carries the 1.25 / square / miter register; the renderer passes it through
//   FONTS    M11 Machina's faces load WITH the theme (themeFonts.ts), never eagerly (main.tsx imports none of the IBM Plex families) - item207-core's LOAD-ON-CHOOSE holds
//   MUTANTS  each turns its check RED: a token dropped from Machina's COOL block (M1); the neutral carrier left steel (M2); the data-cast attribute applied under every theme (M5, the LEAK); getCast
//            ignoring the theme (M5); the Notebook swapped for the old ledger glyph (M10); an eager IBM Plex import added to main.tsx (M11); a Machina desk string re-introducing "Drawer" (M8)
//
// Run (repo root, no server/grant needed): node apps/desktop/scripts/harness/th-machina-source.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const ROOT = join(DESKTOP, '..', '..');
const SRC = join(DESKTOP, 'src');
const SRCP = SRC.replace(/\\/g, '/');
const src = (rel) => readFileSync(join(SRC, rel), 'utf8').replace(/\r\n/g, '\n');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + String(detail).slice(0, 220) : '')); };

// ---------------------------------------------------------------- CSS helpers
const css = src('index.css');
const block = (selector, text = css) => {
  const i = text.indexOf(`\n${selector} {`);
  if (i < 0) return null;
  return text.slice(i, text.indexOf('\n}', i) + 2);
};
const decls = (b) => Object.fromEntries([...(b || '').matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim()]));
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const FLUX_ONLY = new Set(['--paper-edge', '--flux-offset']);
const fluxTokens = new Set([...Object.keys(decls(block(":root[data-theme='flux']"))), ...Object.keys(decls(block(":root[data-theme='flux'][data-page='dark']"))), ...Object.keys(decls(block(":root[data-theme='flux'][data-page='light']")))]
  .filter((t) => !FLUX_ONLY.has(t)));

const COOL = decls(block(":root[data-theme='machina']"));
const NEUTRAL = decls(block(":root[data-theme='machina'][data-cast='neutral']"));
const PAGE = {
  'cool-dark': decls(block(":root[data-theme='machina'][data-page='dark']")),
  'cool-light': decls(block(":root[data-theme='machina'][data-page='light']")),
  'neutral-dark': decls(block(":root[data-theme='machina'][data-cast='neutral'][data-page='dark']")),
  'neutral-light': decls(block(":root[data-theme='machina'][data-cast='neutral'][data-page='light']")),
};
// the effective token set of a (cast, tone) cell: the cool base, the neutral overrides on top, then the page pair
const cell = (cast, tone) => ({ ...COOL, ...(cast === 'neutral' ? NEUTRAL : {}), ...PAGE[`${cast}-${tone}`] });

// M1 - coverage: every token Flux defines, Machina defines somewhere (cool base + page pairs)
// the card family is set where the cards live (the .board-canvas scope, as Flux's own .board-canvas rule does for its dark-glass nodes); at :root it already aliases --ink-on-paper
const canvasTokens = [...css.matchAll(/^:root\[data-theme='machina'\][^{]*\.board-canvas \{([^}]*)\}/gm)].flatMap((m) => [...m[1].matchAll(/(--[\w-]+):/g)].map((x) => x[1]));
const machinaTokens = new Set([...Object.keys(COOL), ...Object.values(PAGE).flatMap((p) => Object.keys(p)), ...canvasTokens]);
const missing = [...fluxTokens].filter((t) => !machinaTokens.has(t));
ok('M1: every token Flux\'s blocks set is ALSO set by Machina\'s blocks (a missing one would leak Arbor\'s value into Machina) - minus --paper-edge / --flux-offset (Flux-only)', missing.length === 0 && fluxTokens.size > 20, JSON.stringify({ fluxTokens: fluxTokens.size, missing }));
for (const [name, p] of Object.entries(PAGE)) {
  const need = ['--paper', '--paper-dim', '--paper-border', '--ink-on-paper', '--ink-on-paper-low', '--accent-door'];
  ok(`M1: the ${name} page pair defines the paper trio + low tier + door accent`, need.every((t) => p[t]), JSON.stringify(need.filter((t) => !p[t])));
}

// M2 - the mockup's own values
ok('M2 [cool]: ground / chrome / rail / line / line-strong / steel carrier / live / ink are the mockup\'s own',
  COOL['--ink-950'] === '#0A0B0E' && COOL['--chrome-surface'] === '#12141A' && COOL['--rail-surface'] === '#0E1015' && COOL['--ink-border'] === '#252933' && COOL['--ink-border-strong'] === '#343A46'
  && COOL['--line-active'] === '#7FA0BC' && COOL['--signal-live'] === '#9DA5B4' && COOL['--text-hi'] === '#E6E9F1' && COOL['--text-mid'] === '#878E9C', JSON.stringify(COOL));
ok('M2 [neutral]: the same slots, and the active carrier (--line-active, --choice, --accent-rest, --text-accent) is the ORANGE accent',
  NEUTRAL['--ink-950'] === '#0A0A0A' && NEUTRAL['--chrome-surface'] === '#121212' && NEUTRAL['--rail-surface'] === '#0E0E0E' && NEUTRAL['--ink-border'] === '#242424' && NEUTRAL['--ink-border-strong'] === '#333333'
  && ['--line-active', '--choice', '--accent-rest', '--text-accent'].every((t) => NEUTRAL[t] === '#FF9800') && NEUTRAL['--signal-live'] === '#A3A3A3', JSON.stringify(NEUTRAL));
ok('M2 [cool]: steel is the carrier of every chosen / current / where-you-are state (--choice, --accent-rest, --text-accent = --line-active)',
  ['--choice', '--accent-rest', '--text-accent'].every((t) => COOL[t] === COOL['--line-active']), '');
ok('M2: the four page pairs are foundations §4\'s own',
  PAGE['cool-dark']['--paper'] === '#16181F' && PAGE['cool-dark']['--paper-border'] === '#2F3541' && PAGE['cool-dark']['--ink-on-paper'] === '#E6E9F1'
  && PAGE['cool-light']['--paper'] === '#F8F9FC' && PAGE['cool-light']['--paper-border'] === '#D3D8E1' && PAGE['cool-light']['--ink-on-paper'] === '#13161C'
  && PAGE['neutral-dark']['--paper'] === '#161616' && PAGE['neutral-dark']['--paper-border'] === '#2E2E2E' && PAGE['neutral-dark']['--ink-on-paper'] === '#E9E9E9'
  && PAGE['neutral-light']['--paper'] === '#FAFAFA' && PAGE['neutral-light']['--paper-border'] === '#D6D6D6' && PAGE['neutral-light']['--ink-on-paper'] === '#141414', '');
ok('M2: the accent is invariant - Machina never re-points --brass (the orange through-line); --orange reads it', !('--brass' in COOL) && !('--brass' in NEUTRAL) && COOL['--orange'] === 'var(--brass)', '');

// M3 - the floors, computed
for (const cast of ['cool', 'neutral']) {
  for (const tone of ['dark', 'light']) {
    const t = cell(cast, tone);
    const pageText = ratio(t['--ink-on-paper'], t['--paper']);
    const meta = ratio(t['--ink-on-paper-low'], t['--paper']);
    ok(`M3 [${cast}/${tone}]: page text >= 7:1 and meta (--ink-on-paper-low) >= 4.5:1 on THIS cell's own paper`, pageText >= 7 && meta >= 4.5, `text ${pageText.toFixed(2)}, meta ${meta.toFixed(2)}`);
  }
  const t = cell(cast, 'dark');
  const lows = ['--ink-950', '--rail-surface', '--chrome-surface'].map((bg) => ratio(t['--text-low'], t[bg]));
  ok(`M3 [${cast}]: --text-low (the muted text tier) clears 4.5:1 on the ground, the rail AND the chrome surface`, lows.every((r) => r >= 4.5), lows.map((r) => r.toFixed(2)).join(' / '));
}

// M4 - registration
const th = src('store/theme.ts');
ok('M4: machina is in ThemeId, REGISTERED and THEME_CONFIG (typewriterDefault false - the marked slot)',
  /export type ThemeId = 'plateau' \| 'flux' \| 'machina';/.test(th) && /const REGISTERED: readonly ThemeId\[\] = \['plateau', 'flux', 'machina'\];/.test(th) && /machina: \{ typewriterDefault: false \}/.test(th), '');

// ---------------------------------------------------------------- the real stores, bundled
function bundle(overrides = []) {
  const pnpmDir = join(ROOT, 'node_modules', '.pnpm');
  const esb = readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d));
  const bin = join(pnpmDir, esb, 'node_modules', 'esbuild', 'bin', 'esbuild');
  const tmp = mkdtempSync(join(tmpdir(), 'wz-machina-'));
  const entry = join(tmp, 'entry.ts');
  writeFileSync(entry, ['theme', 'themeCast', 'deskLexicon', 'themeLexicon', 'themeIcons'].map((n) => `export * as ${n} from '${SRCP}/store/${n}';`).join('\n'));
  const out = join(tmp, 'bundle.mjs');
  const args = [bin, entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`, '--log-level=error', '--external:@fontsource/*',
    '--define:import.meta.env.DEV=false', '--define:import.meta.env.PROD=true', '--define:import.meta.env.MODE="production"'];
  execFileSync(process.execPath, args, { stdio: 'pipe' });
  let code = readFileSync(out, 'utf8');
  // each mutation is [pattern, replacement]; esbuild reprints the source (double quotes, its own line breaks), so patterns are RegExps, and every one must LAND
  for (const [from, to] of overrides) { const next = code.replace(from, to); if (next === code) throw new Error('mutation did not land: ' + from); code = next; }
  writeFileSync(out, code);
  return { tmp, out };
}
// a minimal browser: <html> attributes, localStorage, a window
function fakeBrowser(storage = {}) {
  const attrs = {};
  globalThis.localStorage = { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); }, removeItem: (k) => { delete storage[k]; } };
  globalThis.document = { documentElement: { setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: (k) => { delete attrs[k]; }, getAttribute: (k) => (k in attrs ? attrs[k] : null) } };
  globalThis.window = globalThis;
  return { attrs, storage };
}
const tmps = [];
const load = async (overrides, storage) => {
  const b = bundle(overrides); tmps.push(b.tmp);
  const env = fakeBrowser(storage);
  const mod = await import(pathToFileURL(b.out).href + `?t=${Date.now()}-${Math.random()}`);
  return { mod, env };
};

const castScenario = async (overrides) => {
  const { mod, env } = await load(overrides, {});
  const { theme, themeCast } = mod;
  const r = {};
  theme.setTheme('machina'); themeCast.initThemeCast();
  r.defaultCool = themeCast.getCast() === 'cool' && env.attrs['data-cast'] === 'cool';
  themeCast.setCast('neutral');
  r.neutralUnderMachina = themeCast.getCast() === 'neutral' && env.attrs['data-cast'] === 'neutral' && env.storage['wrizo-machina-cast'] === 'neutral';
  theme.setTheme('plateau');
  r.noAttrUnderArbor = env.attrs['data-cast'] === undefined;
  r.fixedDefaultUnderArbor = themeCast.getCast() === 'cool';
  r.storedSurvives = themeCast.getStoredCast() === 'neutral';
  theme.setTheme('machina');
  r.restored = env.attrs['data-cast'] === 'neutral' && themeCast.getCast() === 'neutral';
  theme.setTheme('flux');
  r.noAttrUnderFlux = env.attrs['data-cast'] === undefined && themeCast.getCast() === 'cool';
  return r;
};
let M5 = null;
try { M5 = await castScenario([]); } catch (e) { M5 = { error: String(e).slice(0, 200) }; }
ok('M5: CAST, run for real - default cool; neutral under Machina reflects data-cast; switching to Arbor REMOVES the attribute and answers the fixed default while the STORED value survives; back to Machina restores it; Flux likewise',
  M5 && Object.values(M5).every((v) => v === true), JSON.stringify(M5));
{
  const { mod } = await load([], { 'wrizo-machina-cast': 'banana' });
  ok('M5: a garbage stored CAST falls through to cool (never a garbage data-* value on <html>)', mod.themeCast.getStoredCast() === 'cool', mod.themeCast.getStoredCast());
}
{
  // the WORD "cast" appears in server prose; what would be a leak is the preference itself: its storage key, its attribute, its store
  const LEAKS = /machina[-_]?cast|data-cast|themeCast|getStoredCast|setCast/i;
  const server = ['sync.ts', 'migrate.ts'].map((f) => readFileSync(join(DESKTOP, '..', 'server', 'src', f), 'utf8'));
  ok('M5: zero schema - CAST never reaches the server (no storage key, attribute or store of it in sync.ts or migrate.ts)', server.every((t) => !LEAKS.test(t)), '');
}

// M6 / M7 / M8 / M9 - the lexicons, run for real
const { mod: L } = await load([], {});
const D = (k) => L.deskLexicon.deskTerm(k, 'machina');
const locked = { modeFreeWrite: 'Sprint', modeDraft: 'Build', modeRevise: 'Edit', modePublish: 'Finalize', pagePlanDoor: 'Plan', drawerPage: 'Files', stripPlan: 'Plans', drawerPlaceJournal: 'Notebook',
  stripSettings: 'Controls', footSettings: 'Controls', stripChangeTheme: 'Theme', cascadeThemeTitle: 'Theme', tutorTabTutor: 'Consultant', drawerLinks: 'Assets', sectionsHeading: 'Parts',
  sectionsPresets: 'Forms', railTemplates: 'Forms', progressStyleRhizome: 'Run', placeRootName: 'Inbox', boardPageDoor: 'Files', graftKnobTip: 'Drag to asset' };
const wrong = Object.entries(locked).filter(([k, v]) => D(k) !== v).map(([k, v]) => `${k}: ${D(k)} != ${v}`);
ok('M6: the locked words resolve under Machina (strip Sprint / Build / Edit / Finalize and the Plan door kept as "Plan"; Files, Plans, Notebook, Controls, Theme, Consultant, Assets, Parts, Forms, Run, Inbox)', wrong.length === 0, JSON.stringify(wrong));
ok('M6: ...and the same keys under Arbor are NOT these words (the override is Machina\'s alone, not a canonical edit)',
  L.deskLexicon.deskTerm('modeDraft', 'plateau') !== 'Build' && L.deskLexicon.deskTerm('stripPlan', 'plateau') !== 'Plans' && L.deskLexicon.deskTerm('tutorTabTutor', 'plateau') !== 'Consultant', '');
const T = (k) => L.themeLexicon.formsFor('machina', k);
const tl = { page: ['File', 'Files'], drawer: ['Project', 'Projects'], binder: ['Folder', 'Folders'], box: ['Block', 'Blocks'], board: ['Plan', 'Plans'], journal: ['Notebook', 'Notebooks'], milestone: ['Deliverable', 'Deliverables'],
  freewrite: ['Sprint', 'Sprints'], home: ['HQ', 'HQ'], voicewall: ['Compliance', 'Compliance'], publish: ['Finalize', 'Finalize'] };
const tlWrong = Object.entries(tl).filter(([k, [one, many]]) => T(k).one !== one || T(k).many !== many).map(([k]) => k);
ok('M7: themeLexicon under Machina - Project / Folder / File / Plan / Block / Notebook / Deliverable / Sprint / HQ / Compliance / Finalize', tlWrong.length === 0, JSON.stringify(tlWrong));
ok('M7: the Voice Wall chip reads COMPLIANCE (VoiceWallWhisper renders t(\'voicewall\').toUpperCase() + " ▪ PASTE BLOCKED")', L.themeLexicon.t('voicewall', 'machina').toUpperCase() === 'COMPLIANCE' && /\{t\('voicewall'\)\.toUpperCase\(\)\} ▪ PASTE BLOCKED/.test(src('components/VoiceWallWhisper.tsx')), '');
ok('M7: \'notebook\' (a DIFFERENT concept from the journal) is left canonical - Machina\'s Notebook is the Journal word, and no word is invented for the other (hand-up item)', T('notebook').one === 'Notebook' && T('journal').one === 'Notebook', JSON.stringify([T('notebook'), T('journal')]));

// M8 - no leak
const dsrc = src('store/deskLexicon.ts');
const mStart = dsrc.indexOf('\n  machina: {');
const mBlock = dsrc.slice(mStart, dsrc.indexOf('\n  },\n};', mStart));
const mEntries = [...mBlock.matchAll(/^    ([A-Za-z0-9]+): '((?:[^'\\]|\\.)*)',/gm)].map((m) => [m[1], m[2]]);
const LEAK = /\b(drawers?|boards?|pages?|journals?|grafts?|grafted|racks?|cartridges?|circuits?|nodes?|docs?|operator|tutor|links?|tracks?|sections?|sets?|presets?)\b/i;
// reviewed keep-list: strings where the word is the CORRECT Machina word or a plain-English use, not an Arbor/Flux noun
const KEEP = new Set(['journalRouteEmptyDrawers', 'journalRoutePromoteDrawer', 'journalRouteSendToDrawer', 'switcherJournals']);
const leaks = mEntries.filter(([k, v]) => !KEEP.has(k) && LEAK.test(v)).map(([k, v]) => `${k}: ${v}`);
ok('M8: NO LEAK - no Machina desk string still names an Arbor or Flux noun (drawer / board / page / journal / graft / rack / cartridge / circuit / node / doc / operator / tutor / link / track / section / set / preset) outside a reviewed keep-list',
  mEntries.length > 90 && leaks.length === 0, JSON.stringify({ entries: mEntries.length, leaks }));
// M9
ok('M9: Workshop has NO Machina word - modeWorkshop is not overridden (the tab is hidden in every theme until it is built, Nick Oct 23)', !/^    modeWorkshop:/m.test(mBlock), '');

// M10 - icons
const I = L.themeIcons;
const IDS = ['rack', 'docs', 'circuits', 'log', 'config', 'skin', 'trash', 'cartridge', 'input'];
ok('M10: all nine ThemeIconId slots have a Machina glyph, each a stroked svg set in the 1.25 / square / miter register',
  IDS.every((id) => { const s = I.themeIcon('machina', id); return s && s.kind === 'svg' && s.strokeWidth === 1.25 && s.linecap === 'square' && s.linejoin === 'miter' && s.paths.length > 0; }), JSON.stringify(IDS.filter((id) => !I.themeIcon('machina', id))));
const log = I.themeIcon('machina', 'log');
ok('M10: the Notebook (log) is the SPIRAL glyph of Fable\'s round-3 build note - binder-ring ticks above, three ruled lines - not the old ruled ledger',
  JSON.stringify(log?.paths) === JSON.stringify(['M5 5h14v16H5z', 'M8 3v4M11 3v4M14 3v4M17 3v4', 'M8 11h8M8 14h8M8 17h5']), JSON.stringify(log?.paths));
const skin = I.themeIcon('machina', 'skin');
ok('M10: the Theme swatch has its two SOLID blocks (one at .45 opacity) as filled paths - the spec can carry a fill', skin.paths.filter((p) => typeof p === 'object').length === 2 && skin.paths.some((p) => typeof p === 'object' && p.fillOpacity === 0.45), '');
ok('M10: Flux\'s pixel set is untouched and the renderer passes the set\'s stroke register through (strokeWidth / linecap / linejoin) and handles a filled path',
  I.themeIcon('flux', 'rack')?.kind === 'pixels' && /strokeWidth=\{spec\.strokeWidth\}/.test(src('components/ThemeIcon.tsx')) && /strokeLinecap=\{spec\.linecap\}/.test(src('components/ThemeIcon.tsx')) && /fillOpacity=\{p\.fillOpacity\}/.test(src('components/ThemeIcon.tsx')), '');

// M11 - fonts
const main = src('main.tsx');
ok('M11: main.tsx imports NONE of the IBM Plex families eagerly (Machina\'s faces load WITH the theme - item207-core\'s LOAD-ON-CHOOSE eager list does not grow)', !/@fontsource\/ibm-plex/.test(main), '');
const tf = src('store/themeFonts.ts');
const tff = src('store/themeFontFaces.ts');
const stripC = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
// (the probe follows the code: the faces' literal imports moved to store/themeFontFaces.ts on Oct 24 - see M11's strict-bundle checks below; the CLAIM is unchanged: Machina's nine faces, Machina only)
ok("M11: Machina loads the four slots' faces (Plex Mono 500; Plex Sans 400/500/600; Plex Serif 400/500 + italic 400; Atkinson 400/700) only for 'machina' - ensureThemeFonts gates on the theme, the registered loader names the nine",
  /theme !== 'machina'/.test(tf) && /registerThemeFonts\('machina'/.test(tff) && ['ibm-plex-mono/500', 'ibm-plex-sans/400', 'ibm-plex-sans/500', 'ibm-plex-sans/600', 'ibm-plex-serif/400.css', 'ibm-plex-serif/500', 'ibm-plex-serif/400-italic', 'atkinson-hyperlegible/400', 'atkinson-hyperlegible/700'].every((f) => tff.includes(f)), '');
// the Oct 24 train-#6 fix: nothing the harnesses' store loaders bundle may name a font package (esbuild resolves the css and dies on its .woff2); the literals live in themeFontFaces.ts, which only main.tsx imports
// (comments are stripped from EVERY file before matching: themeFonts.ts's own explanatory comments name "@fontsource" and "store/themeFontFaces.ts" in prose - only CODE counts)
const tsFiles = readdirSync(SRC, { recursive: true }).map(String).filter((f) => /\.(ts|tsx)$/.test(f)).map((f) => [f, stripC(readFileSync(join(SRC, f), 'utf8'))]);
const IMPORTS_FACES = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"][^'"]*themeFontFaces['"]/;
// the M11 claim as a predicate over (themeFonts.ts code, every file's code, main.tsx code), so the mutants below re-run the SAME predicate
const m11Names = (tfCode, files, mainCode) => {
  const importers = files.filter(([f, code]) => !/(^|[\\/])themeFontFaces\.ts$/.test(f) && IMPORTS_FACES.test(code)).map(([f]) => f);
  return { pass: !/@fontsource/.test(tfCode) && /import\s+'\.\/store\/themeFontFaces'/.test(mainCode) && importers.length === 1 && importers[0] === 'main.tsx', importers };
};
const m11Real = m11Names(stripC(tf), tsFiles, stripC(main));
ok('M11: themeFonts.ts (reached from store/theme.ts, which the harness loaders bundle) names NO font package IN CODE, and store/themeFontFaces.ts is imported by main.tsx ALONE - so no store loader can reach a literal @fontsource import',
  m11Real.pass, JSON.stringify(m11Real.importers));
{
  const withLiteral = m11Names(stripC(tf + "\nvoid import('@fontsource/ibm-plex-mono/500.css');\n"), tsFiles, stripC(main));
  ok('MUTANT: a REAL literal import(\'@fontsource/ibm-plex-mono/500.css\') added to themeFonts.ts (code, not a comment) - the M11 text check must go RED (the mutation LANDED: the real source passes)', m11Real.pass && !withLiteral.pass, '');
  const inComment = m11Names(stripC(tf + "\n// import('@fontsource/ibm-plex-mono/500.css') - a comment only\n/* @fontsource/ibm-plex-sans */\n"), tsFiles, stripC(main));
  ok('CONTROL: the same string in a COMMENT in themeFonts.ts leaves the M11 text check GREEN (only code counts - this is the false red b8 hit)', inComment.pass, '');
  const second = m11Names(stripC(tf), [...tsFiles, ['store/theme.ts', "import './themeFontFaces';"]], stripC(main));
  ok('MUTANT: a second STATIC importer of themeFontFaces (store/theme.ts) - the M11 sole-importer check must go RED (the mutation LANDED)', m11Real.pass && !second.pass && second.importers.includes('store/theme.ts'), JSON.stringify(second.importers));
}
{
  // the REAL failure, reproduced: bundle store/theme.ts with NO @fontsource externals (what the harness store loaders do). Must succeed on the real source, and must DIE on a literal import re-added to themeFonts.ts.
  const strict = (themeFontsText) => {
    const pnpmDir = join(ROOT, 'node_modules', '.pnpm');
    const esb = readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d));
    const bin = join(pnpmDir, esb, 'node_modules', 'esbuild', 'bin', 'esbuild');
    // inside apps/desktop/node_modules/.cache so the font packages RESOLVE (as they do in the real tree) - the death under test is the .woff2 loader, not a missing package
    mkdirSync(join(DESKTOP, 'node_modules', '.cache'), { recursive: true });
    const tmp = mkdtempSync(join(DESKTOP, 'node_modules', '.cache', 'wz-m11-')); tmps.push(tmp);
    writeFileSync(join(tmp, 'theme.ts'), readFileSync(join(SRC, 'store', 'theme.ts'), 'utf8'));
    writeFileSync(join(tmp, 'themeFonts.ts'), themeFontsText);
    try { execFileSync(process.execPath, [bin, join(tmp, 'theme.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${join(tmp, 'out.mjs')}`, '--log-level=error', '--external:react'], { stdio: 'pipe', cwd: DESKTOP }); return { ok: true }; }
    catch (e) { return { ok: false, err: String(e.stderr || e.message || e).slice(0, 200) }; }
  };
  const realText = readFileSync(join(SRC, 'store', 'themeFonts.ts'), 'utf8');
  const real = strict(realText);
  ok("M11: store/theme.ts BUNDLES with no @fontsource externals (the harness store loaders' own condition) - the \"No loader for .woff2\" death is gone", real.ok === true, real.err || '');
  const bad = strict(realText + "\nvoid import('@fontsource/ibm-plex-mono/500.css');\n");
  ok("MUTANT: a literal import('@fontsource/ibm-plex-mono/500.css') re-added to themeFonts.ts - the strict bundle must DIE (No loader for .woff2) - the mutation LANDED and the real source still bundles", real.ok === true && bad.ok === false && /woff|loader/i.test(bad.err || ''), bad.err || '');
}
ok('M11: applyAttribute calls ensureThemeFonts - the faces follow every theme switch and the boot', /ensureThemeFonts\(theme\)/.test(th), '');

// ---------------------------------------------------------------- PHASE B
// M12 - the Consultant's two chips read the mockup's wording (Fable's ruling 7); the staged ask is the chip label, so one key serves both
ok('M12: the Consultant chips read the mockup\'s wording under Machina ("What is load-bearing — and what could go?" / "Where does the line slip?")',
  D('tutorDraftAskLoadBearing') === 'What is load-bearing — and what could go?' && D('tutorDraftAskThreadSlip') === 'Where does the line slip?', JSON.stringify([D('tutorDraftAskLoadBearing'), D('tutorDraftAskThreadSlip')]));
ok('M12: ...and Arbor\'s own chips are untouched (the override is Machina\'s alone)',
  L.deskLexicon.deskTerm('tutorDraftAskThreadSlip', 'plateau') === 'Where does the thread slip?' && L.deskLexicon.deskTerm('tutorDraftAskLoadBearing', 'plateau') === "What's load-bearing here — and what could go?", '');
// M13 - no splash loading lines (ruling 6): EMPTY strings (not a missing key, which would fall back to Arbor's garden lines), and Splash.tsx draws nothing for an empty line
const loadKeys = ['splashLoading1', 'splashLoading2', 'splashLoading3', 'splashLoading4'];
ok('M13: every splash loading line is the EMPTY string under Machina - present, not absent (an absent key would fall back to Arbor\'s "Turning the soil...")', loadKeys.every((k) => D(k) === '' && new RegExp(`^    ${k}: '',`, 'm').test(mBlock)), JSON.stringify(loadKeys.map(D)));
ok('M13: ...Arbor and Flux keep their lines', loadKeys.every((k) => L.deskLexicon.deskTerm(k, 'plateau') !== '' && L.deskLexicon.deskTerm(k, 'flux') !== ''), '');
const splash = src('components/Splash.tsx');
ok('M13: Splash.tsx renders the loading element ONLY for a non-empty line (the status region is absent under Machina, not an empty live region)', /\{t\(LOADING_LINE_KEYS\[lineIndex\]\) !== '' && \(\s*<div className="wz-splash-loading"/.test(splash), '');
// M14 - the splash mark
const sm = src('components/SplashMark.tsx');
ok('M14: SplashMark routes Machina to MachinaMark (the WRIZ[] wordmark, IDEAS / FINAL DRAFT end labels, twenty units that close orange once); Arbor and Flux routes unchanged',
  /if \(theme === 'machina'\) return <MachinaMark \{\.\.\.rest\} \/>;/.test(sm) && /theme === 'flux' \? <FluxMark/.test(sm) && /const MA_UNITS = 20;/.test(sm) && />IDEAS</.test(sm) && />FINAL DRAFT</.test(sm) && />WRIZ</.test(sm), '');
ok('M14: the splash mark has a still state (reduced motion: the closed strip at once) and a floor trigger', /if \(reduced\) \{[\s\S]*?classList\.add\('closed'\)[\s\S]*?onFloorReached\(\);[\s\S]*?return;/.test(sm) && /window\.setTimeout\(onFloorReached, closeAt \+ 700\)/.test(sm), '');
// M15 - the Run strip: Machina's own instrument, the gate Flux's Glitch uses, one celebration, sparks NEUTRAL only
const rs = src('components/RunStrip.tsx');
// SUPERSEDED (Fable, Oct 23: "under Machina the Run strip is the ONLY progress instrument"): this check used to require the Rhizome|Glitch|Run style slot
// (`settings.progressStyle === 'rhizome'`) as part of the gate; Run no longer sits behind a style choice - successor below (the gate WITHOUT the slot, and M19).
ok('M15: Run is gated on Machina + the instruments + Progress: Words + a goal - NOT on the style slot (it is Machina\'s only instrument) - and is mounted beside GlitchMeter on the framed page only',
  /theme === 'machina' && settings\.instrumentsOn && settings\.progress === 'words' && goal != null && n > 0/.test(rs) && !/progressStyle/.test(rs.replace(/\/\/.*$/gm, '')) && /\{glitch && <RunStrip text=\{text\} \/>\}/.test(src('components/DeskInstrument.tsx')), '');
ok('M15: twenty units; ONE celebration - the closed strip - and the sparks (eight ticks) appear ONLY under NEUTRAL and only when motion is welcome',
  /const UNITS = 20;/.test(rs) && /const sparks = celebrating && cast === 'neutral' && !still;/.test(rs) && /BURST_ANGLES = \[-90, -64, -38, -12, 12, 38, 64, 90\]/.test(rs) && /still = prefersReducedMotion\(\) \|\| dial === 0/.test(rs), '');
ok('M15: the lap reuses useGoalProgress (one celebration grammar) and nothing in RunStrip is random', /useGoalProgress\(count, n\)/.test(rs) && !/Math\.random/.test(rs), '');
const machinaParks = {};   // page-size: observations for the parked records
const clean = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '');
const ccss = clean(css);
ok('M15: the CSS - the in-progress notch is 3 x 16 px ORANGE, a finished unit is the live gray, the closed strip is orange, and reduced motion removes the sparks and the crossfade',
  /\.machina-run-strip > i\.here::after\{[^}]*width:3px; height:16px; background:var\(--orange\)/.test(ccss) && /\.machina-run-strip > i\.on\{ background:var\(--signal-live\)/.test(ccss)
  && /\.machina-run\[data-closed='true'\] \.machina-run-strip > i\{ background:var\(--orange\)/.test(ccss) && /@media \(prefers-reduced-motion: reduce\)\{ \.machina-run-strip > i\{ transition:none; \} \.machina-run-burst\{ display:none; \} \}/.test(ccss), '');
// M16 - the way-back glyph
const rail = src('components/DeskRail.tsx');
ok('M16: the way-back chip draws "◂" under Machina and the old "↩" elsewhere; gray under COOL, the one orange under NEUTRAL',
  /\{theme === 'machina' \? '◂' : '↩'\}/.test(rail) && /\[data-theme='machina'\] \.desk-rail-wayback\{ color:var\(--text-mid\); \}/.test(ccss) && /\[data-theme='machina'\]\[data-cast='neutral'\] \.desk-rail-wayback\{ color:var\(--orange\); \}/.test(ccss), '');
// M17 - the CAST control: ONE row in Controls, Machina only, both options
const cp = src('components/CascadePanels.tsx');
ok('M17: CAST is ONE Controls row ("Cast": Cool | Neutral), drawn ONLY under Machina, wired to setCast with both options',
  (cp.match(/aria-label="Cast"/g) || []).length === 1 && /\{theme === 'machina' && \(\s*<div className="wz-cascade-row wz-cascade-cast"/.test(cp) && /\(\['cool', 'neutral'\] as const\)\.map/.test(cp) && /onClick=\{\(\) => setCast\(c\)\}/.test(cp)
  && /c === 'cool' \? 'Cool' : 'Neutral'/.test(cp), '');
// M18 - orange is scarce: Arbor's ember halos / goal glow / flare are switched off under Machina (the first Phase B screens showed a warm halo round the paper)
const EMBER = [
  /\[data-theme='machina'\] \.mode-page\{ box-shadow:0 10px 44px rgba\(0, 0, 0, \.55\); \}/,
  /\[data-theme='machina'\] \.mode-page\.focused\{ box-shadow:0 0 0 1px var\(--paper-border\), 0 10px 44px rgba\(0, 0, 0, \.55\); \}/,
  /\[data-theme='machina'\]\{ --goal-glow-cap:\.16; \}/,
  /\[data-theme='machina'\] \.desk-frame-goalflare\{ display:none; \}/,
  /\[data-theme='machina'\] body::after\{ z-index:-1; \}/,
];
// ---- PARKED - SUPERSEDED by page-size (Fable, Oct 23: the grey-band rule existed three times - Flux, Machina, and page-size's all-theme rule -
// and collapses into the ONE base rule): Machina's own `[data-theme='machina'] body::after{ z-index:-1; }` is gone, so EMBER's fifth pattern no longer
// matches and M18 falls with it. Kept VERBATIM and no longer run; record in this file's parked section; successor below (EMBER's other four, plus
// the base rule).
//
// ok('M18: the paper\'s resting and focused halos are plain dark shadows, the goal glow is dialled (the cap token) and recoloured to the live gray, and the celebration flare is not drawn - under Machina only', EMBER.every((r) => r.test(ccss)) && /\[data-theme='machina'\] \.wz-goal-glow\{ background:radial-gradient\(ellipse at center, color-mix\(in srgb, var\(--signal-live\)/.test(ccss), JSON.stringify(EMBER.map((r) => r.test(ccss))));
// ------------------------------------------------------------------
const EMBER_PS = EMBER.filter((r) => !/body::after/.test(r.source));
const VIGNETTE_BASE = (x) => /(^|\n)\s*body::after\s*\{[^}]*z-index:\s*-1;/.test(x) && /body\s*\{\s*isolation:\s*isolate;\s*\}/.test(x) && !/\[data-theme='[a-z]+'\] body::after\{[^}]*z-index:\s*(?!-)/.test(x);
const M18PS = (x) => EMBER_PS.every((r) => r.test(x)) && VIGNETTE_BASE(x) && /\[data-theme='machina'\] \.wz-goal-glow\{ background:radial-gradient\(ellipse at center, color-mix\(in srgb, var\(--signal-live\)/.test(x);
machinaParks.m18 = { ember4: EMBER_PS.every((r) => r.test(ccss)), vignetteBase: VIGNETTE_BASE(ccss) };
ok('M18 [page-size successor]: the paper\'s halos are plain dark shadows, the goal glow is dialled and recoloured, the flare is not drawn - under Machina only; and the vignette sits behind the page by the ONE base rule (body::after at -1, body isolated, no theme raising it)',
  M18PS(ccss), JSON.stringify(machinaParks.m18));

// M19 - Run is the ONLY progress instrument under Machina: the framed page draws no Arbor bar, and the style choice (Bar | Run) is not offered in either settings surface
const di = src('components/DeskInstrument.tsx');
const BAR_GATE = /\{settings\.progressStyle === 'bar' && theme !== 'machina' && \(\s*<ProgressBar/;
ok('M19: the framed page draws Arbor\'s bar only when the theme is not Machina (DeskInstrument) - the legacy surfaces\' bars (ModeStage / JournalEntry) are untouched', BAR_GATE.test(di) && /<ProgressBar/.test(src('pages/JournalEntry.tsx')), '');
const SEG_GATES = [[/settings\.progress === 'words' && theme !== 'machina' && \(\s*<Seg label=\{t\('progressStyleLabel'\)\}/, src('components/Sliver.tsx')], [/framed && settings\.progress === 'words' && !machina;/, src('components/ModeStage.tsx')]];
ok('M19: the Progress style choice is not offered under Machina - neither in the Sliver nor in the gear panel (one instrument, nothing to choose between)', SEG_GATES.every(([r, t]) => r.test(t)), JSON.stringify(SEG_GATES.map(([r, t]) => r.test(t))));

// M20 - the picker card (after theme-picker): Machina joins THEME_CARDS in the arc's order, locked by the server's own threshold, its faces asked for on first intent (hover / focus), never at boot
const tp = src('components/ThemePicker.tsx');
const cardIds = [...(/const THEME_CARDS: ThemeCardDef\[\] = \[([\s\S]*?)\n\];/.exec(tp) || [, ''])[1].matchAll(/id: '(\w+)'/g)].map((m) => m[1]);
ok('M20: THEME_CARDS lists exactly the built themes in the arc\'s order (plateau, machina, flux) - Nomad / Volant absent', cardIds.join(',') === 'plateau,machina,flux', cardIds.join(','));
ok('M20: the Machina card runs its Run-strip plate (20 units) and asks for the theme\'s faces on hover / focus only - ThemePicker holds no module-scope font import',
  /isMachina \? loadMachinaFaces/.test(tp) && /const MACHINA_PLATE_UNITS = 20;/.test(tp) && /isMachina \? <MachinaPlate \/>/.test(tp) && !/^import .*@fontsource/m.test(tp) && /const loadMachinaFaces = \(\) => ensureThemeFonts\('machina'\);/.test(tp), '');
const syncSrc = readFileSync(join(DESKTOP, '..', 'server', 'src', 'sync.ts'), 'utf8');
ok('M20: the card is LOCKED by the server\'s own unlock table (machina has a threshold: 100 words) - nothing client-side invents an unlock', /machina: 100,/.test(syncSrc) && /isThemeOpen\(card\.id, status, current\)/.test(tp), '');
ok('M20: the card art is the card\'s OWN theme in literals (never the ambient tokens) and still frames hold the strip', /\.wz-theme-card-machina \.wz-theme-plate\{ background:linear-gradient\(180deg, #12141A/.test(ccss) && /\.wz-theme-picker\[data-still='true'\] \.wz-theme-plate-run > i/.test(ccss), '');

// M21 - Oct 24 (Nick, train #7): the Sprint page text, FINALIZE / PLAN at rest, and the Tutor's Free Write words
// (a) PAGE TEXT >= 13.9:1 in every Machina cast and page tone - computed from the tokens; and the Free Write PEN (the Sprint tab's rail hands the editor a pen ink) can never be the raw dark swatch on a dark page
for (const cast of ['cool', 'neutral']) {
  for (const tone of ['dark', 'light']) {
    const t = cell(cast, tone);
    const r = ratio(t['--ink-on-paper'], t['--paper']);
    ok(`M21 [${cast}/${tone}]: page text (--ink-on-paper on --paper) is >= 13.9:1 - the figure the default pen now follows`, r >= 13.9, r.toFixed(2));
  }
}
const modeStage = src('components/ModeStage.tsx');
const penFn = (/function effectivePenInk\([^)]*\): string \{([\s\S]*?)\n\}\n/.exec(modeStage) || [, ''])[1];
const penRaw = '#1a0f06';
ok('M21: effectivePenInk knows Machina - the default swatch becomes var(--ink-on-paper) (the page\'s own ink, every cast and tone), so Free Write can never paint #1a0f06 on the dark page (1.06:1)',
  /theme === 'machina'/.test(penFn) && /ink === PEN_DEFAULT_INK\) return 'var\(--ink-on-paper\)'/.test(modeStage) && /const PEN_DEFAULT_INK = '#1a0f06';/.test(modeStage) && /export const PEN_INKS = \['#1a0f06'/.test(modeStage), '');
ok('M21: ...and the RAW default really is invisible on Machina\'s dark pages (the regression this guards: < 1.2:1 in both casts) while the page ink clears 13.9', ['cool', 'neutral'].every((c) => ratio(penRaw, cell(c, 'dark')['--paper']) < 1.2 && ratio(cell(c, 'dark')['--ink-on-paper'], cell(c, 'dark')['--paper']) >= 13.9), ['cool', 'neutral'].map((c) => ratio(penRaw, cell(c, 'dark')['--paper']).toFixed(2)).join(' / '));
{
  const dark = Object.fromEntries([...(/const PEN_INKS_MACHINA_DARK: Record<string, string> = \{([\s\S]*?)\};/.exec(modeStage) || [, ''])[1].matchAll(/'(#[0-9a-fA-F]{6})': '(#[0-9a-fA-F]{6})'/g)].map((m) => [m[1], m[2]]));
  const rows = ['cool', 'neutral'].flatMap((c) => Object.values(dark).map((hex) => ratio(hex, cell(c, 'dark')['--paper'])));
  ok('M21: the lightened red and blue pens clear 7:1 on BOTH dark pages (computed)', Object.keys(dark).length === 2 && rows.length === 4 && rows.every((r) => r >= 7), rows.map((r) => r.toFixed(2)).join(' / '));
}
// (b) FINALIZE and the PLAN door are plain at rest - no Machina rule colours either of them, except the PLAN door's own text-mid / text-hi pair
const plainOk = (c) => !/\[data-theme='machina'\] \.desk-mode-tab\[data-mode-key='publish'\]\s*\{[^}]*color/.test(c)
  && /\[data-theme='machina'\] \.sprint-nav \.page-plan-door\{ color:var\(--text-mid\); \}/.test(c) && /\[data-theme='machina'\] \.sprint-nav \.page-plan-door:hover\{ color:var\(--text-hi\); \}/.test(c);
ok('M21: FINALIZE has NO Machina colour rule of its own (it reads like every other mode), and the PLAN door is --text-mid at rest, --text-hi on hover - orange only where it already means current', plainOk(ccss), '');
// (c) the Tutor's Free Write words follow Machina's Free Write word
ok('M21: the Tutor\'s Free Write roster reads "Sprint Tips" / "Sprint tools" under Machina, and Arbor keeps "Free Writing Tips"', D('tutorFreeWriteTips') === 'Sprint Tips' && D('tutorFreeWriteRoster') === 'Sprint tools' && L.deskLexicon.deskTerm('tutorFreeWriteTips', 'plateau') === 'Free Writing Tips', JSON.stringify([D('tutorFreeWriteTips'), D('tutorFreeWriteRoster')]));

// ---------------------------------------------------------------- MUTANTS
const mutantCss = (mutate, asserts) => { const m = mutate(css); return m !== css && asserts(m); };
{
  // M1: a token dropped from the COOL block
  const m = css.replace("  --help-hi: #9DA5B4;\n  --text-hi: #E6E9F1;", "  --text-hi: #E6E9F1;");
  const cool2 = decls(block(":root[data-theme='machina']", m));
  const miss2 = [...fluxTokens].filter((t) => !new Set([...Object.keys(cool2), ...Object.values(PAGE).flatMap((p) => Object.keys(p))]).has(t));
  ok('MUTANT: --help-hi dropped from Machina\'s COOL block - M1 must go RED', m !== css && miss2.includes('--help-hi'), JSON.stringify(miss2));
}
ok('MUTANT: the neutral carrier left steel (--line-active #7FA0BC in the neutral block) - M2 must go RED',
  mutantCss((c) => c.replace("  --line-active: #FF9800;         /* NEUTRAL: the active carrier IS the accent */", "  --line-active: #7FA0BC;"), (m) => decls(block(":root[data-theme='machina'][data-cast='neutral']", m))['--line-active'] !== '#FF9800'), '');
ok('MUTANT: --text-low reverted to the mockup\'s own #6C7482 (3.8-4.2:1 on the chrome) - M3 must go RED', ratio('#6C7482', COOL['--chrome-surface']) < 4.5 && ratio('#6C7482', COOL['--rail-surface']) < 4.5, `${ratio('#6C7482', COOL['--chrome-surface']).toFixed(2)} on chrome`);
{
  const leak = await castScenario([[/if \(getTheme\(\) === "machina"\)[\s\S]*?root\.removeAttribute\("data-cast"\);/, 'root.setAttribute("data-cast", stored);']]).catch((e) => ({ error: String(e).slice(0, 160) }));
  ok('MUTANT: data-cast applied under EVERY theme (the leak) - M5 must go RED (the mutation LANDED - no error - and the Arbor leg went false)', !('error' in leak) && leak.noAttrUnderArbor === false, JSON.stringify(leak));
  const blind = await castScenario([[/return getTheme\(\) === "machina" \? stored : CAST_DEFAULT;/, 'return stored;']]).catch((e) => ({ error: String(e).slice(0, 160) }));
  ok('MUTANT: getCast() ignores the theme (a stale cast read under Arbor) - M5 must go RED (the mutation LANDED and the fixed-default leg went false)', !('error' in blind) && blind.fixedDefaultUnderArbor === false, JSON.stringify(blind));
}
ok('MUTANT: the Notebook swapped for the old ruled-ledger glyph - M10 must go RED', JSON.stringify(['M4 3h16v18H4z', 'M4 7.5h16M9.5 7.5V21M4 11.8h16M4 16.2h16']) !== JSON.stringify(log?.paths.slice(0, 2)), '');
ok('MUTANT: an eager IBM Plex import added to main.tsx - M11 must go RED', /@fontsource\/ibm-plex/.test(main + "\nimport '@fontsource/ibm-plex-mono/500.css';"), '');
ok('MUTANT: a Machina desk string re-introducing "Drawer" - M8 must go RED', LEAK.test('Back to Drawer'), '');
{
  // PHASE B mutants - each rewrites the real source text, asserts the mutation LANDED, and re-runs the check's own predicate
  const SPARKS = /const sparks = celebrating && cast === 'neutral' && !still;/;
  const mut = (text, from, to) => { const next = text.replace(from, to); return next === text ? null : next; };
  const rs2 = mut(rs, "celebrating && cast === 'neutral' && !still", 'celebrating && !still');
  ok('MUTANT: sparks drawn under COOL as well (the cast gate dropped) - M15 must go RED (the mutation LANDED)', rs2 !== null && !SPARKS.test(rs2) && SPARKS.test(rs), '');
  const GATE = /theme === 'machina' && settings\.instrumentsOn/;
  const rs3 = mut(rs, "theme === 'machina' && settings.instrumentsOn", 'settings.instrumentsOn');
  ok('MUTANT: Run drawn under every theme (the Machina gate dropped) - M15 must go RED (the mutation LANDED)', rs3 !== null && !GATE.test(rs3) && GATE.test(rs), '');
  const dsrc2 = mut(dsrc, "    splashLoading1: '',", '');
  const hasEmpty = (t) => { const s = t.indexOf('\n  machina: {'); return /^    splashLoading1: '',/m.test(t.slice(s)); };
  ok('MUTANT: Machina\'s splashLoading1 key deleted (so it would fall back to Arbor\'s "Gathering your pages...") - M13 must go RED (the mutation LANDED)', dsrc2 !== null && !hasEmpty(dsrc2) && hasEmpty(dsrc), '');
  const CASTGATE = /\{theme === 'machina' && \(\s*<div className="wz-cascade-row wz-cascade-cast"/;
  const cp2 = mut(cp, "{theme === 'machina' && (\n        <div className=\"wz-cascade-row wz-cascade-cast\"", '{(\n        <div className="wz-cascade-row wz-cascade-cast"');
  ok('MUTANT: the CAST row drawn under every theme (the Machina gate dropped) - M17 must go RED (the mutation LANDED)', cp2 !== null && !CASTGATE.test(cp2) && CASTGATE.test(cp), '');
  const tp2 = mut(tp, "{ id: 'machina', name: 'Machina', cardClass: 'wz-theme-card-machina', wordmarkClass: 'wz-theme-wm-machina' },\n  { id: 'flux'", "{ id: 'flux'");
  const ids2 = tp2 === null ? null : [...(/const THEME_CARDS: ThemeCardDef\[\] = \[([\s\S]*?)\n\];/.exec(tp2) || [, ''])[1].matchAll(/id: '(\w+)'/g)].map((m) => m[1]).join(',');
  ok('MUTANT: the Machina card dropped from THEME_CARDS - M20 must go RED (the mutation LANDED)', tp2 !== null && ids2 !== 'plateau,machina,flux' && cardIds.join(',') === 'plateau,machina,flux', String(ids2));
  const tp3 = mut(tp, "import { ensureThemeFonts } from '../store/themeFonts';", "import '@fontsource/ibm-plex-mono/500.css';\nimport { ensureThemeFonts } from '../store/themeFonts';");
  ok('MUTANT: an eager IBM Plex import added to ThemePicker - M20 must go RED (the mutation LANDED)', tp3 !== null && /^import .*@fontsource/m.test(tp3) && !/^import .*@fontsource/m.test(tp), '');
  const di2 = mut(di, "settings.progressStyle === 'bar' && theme !== 'machina' && (", "settings.progressStyle === 'bar' && (");
  ok('MUTANT: Arbor\'s bar drawn on the framed Machina page again (the theme gate dropped) - M19 must go RED (the mutation LANDED)', di2 !== null && !BAR_GATE.test(di2) && BAR_GATE.test(di), '');
  // ---- PARKED - SUPERSEDED by page-size (Oct 23): the line this mutant deletes no longer exists (collapsed into the base rule); kept VERBATIM, no longer run.
  // const css3 = mut(ccss, "[data-theme='machina'] body::after{ z-index:-1; }", '');
  // ok('MUTANT: the vignette left ABOVE the page under Machina (the body::after rule deleted - the grey bands return) - M18 must go RED (the mutation LANDED)', css3 !== null && !EMBER.every((r) => r.test(css3)) && EMBER.every((r) => r.test(ccss)), '');
  // ------------------------------------------------------------------
  const css3b = mut(ccss, /(body::after\s*\{[^}]*?)z-index:\s*-1;/, '$1z-index: 2;');
  ok('MUTANT [page-size successor]: the vignette put back ABOVE the page by the BASE rule (z-index 2) - M18 [page-size successor] must go RED (the mutation LANDED)', css3b !== null && !M18PS(css3b) && M18PS(ccss), '');
  // ---- PARKED - SUPERSEDED by page-size (Oct 23): it reads EMBER whole, and EMBER's vignette pattern no longer matches the real CSS; kept VERBATIM, no longer run.
  // const css2 = mut(ccss, "[data-theme='machina'] .desk-frame-goalflare{ display:none; }", '');
  // ok('MUTANT: Arbor\'s celebration flare left drawn under Machina (the display:none rule deleted) - M18 must go RED (the mutation LANDED)', css2 !== null && !EMBER.every((r) => r.test(css2)) && EMBER.every((r) => r.test(ccss)), '');
  // ------------------------------------------------------------------
  const css2b = mut(ccss, "[data-theme='machina'] .desk-frame-goalflare{ display:none; }", '');
  ok('MUTANT [page-size successor]: Arbor\'s celebration flare left drawn under Machina (the display:none rule deleted) - M18 [page-size successor] must go RED (the mutation LANDED)', css2b !== null && !M18PS(css2b) && M18PS(ccss), '');
  // M21 mutants (Oct 24)
  const orangeBack = ccss + "\n[data-theme='machina'] .desk-mode-tab[data-mode-key='publish'] { color: var(--orange); }\n";
  ok('MUTANT: FINALIZE orange at rest again (the old rule re-added) - M21 must go RED (the mutation LANDED: the real CSS passes)', plainOk(ccss) && !plainOk(orangeBack), '');
  const planGone = mut(ccss, "[data-theme='machina'] .sprint-nav .page-plan-door{ color:var(--text-mid); }", '');
  ok('MUTANT: the PLAN door\'s plain rule deleted (it falls back to --accent-rest: orange under NEUTRAL) - M21 must go RED (the mutation LANDED)', planGone !== null && !plainOk(planGone), '');
  const penBack = mut(modeStage, "if (ink === PEN_DEFAULT_INK) return 'var(--ink-on-paper)';", 'if (ink === PEN_DEFAULT_INK) return ink;');
  ok('MUTANT: the Machina default pen left as the raw #1a0f06 (the invisible Sprint text) - M21 must go RED (the mutation LANDED)', penBack !== null && !/ink === PEN_DEFAULT_INK\) return 'var\(--ink-on-paper\)'/.test(penBack) && /ink === PEN_DEFAULT_INK\) return 'var\(--ink-on-paper\)'/.test(modeStage), '');
  const GLYPH = /\{theme === 'machina' \? '◂' : '↩'\}/;
  const rail2 = mut(rail, "{theme === 'machina' ? '◂' : '↩'}", '↩');
  ok('MUTANT: the way-back glyph left as the ember "↩" under Machina - M16 must go RED (the mutation LANDED)', rail2 !== null && !GLYPH.test(rail2) && GLYPH.test(rail), '');
}

for (const t of tmps) rmSync(t, { recursive: true, force: true });
if (process.env.HARNESS_PARKED === '1') {
  // PAGE-SIZE (Oct 23) - THREE parks: M18 and its two mutants read Machina's own vignette line, collapsed into the one base rule. Records frozen with
  // their original names; each re-verifies the new truth from this run's observation (machinaParks.m18).
  const o = machinaParks.m18 || {};
  const rec = [
    'M18: the paper\'s resting and focused halos are plain dark shadows, the goal glow is dialled (the cap token) and recoloured to the live gray, and the celebration flare is not drawn - under Machina only',
    'MUTANT: the vignette left ABOVE the page under Machina (the body::after rule deleted - the grey bands return) - M18 must go RED (the mutation LANDED)',
    'MUTANT: Arbor\'s celebration flare left drawn under Machina (the display:none rule deleted) - M18 must go RED (the mutation LANDED)',
  ].map((n) => ({ name: `PARKED (was "${n}") - page-size: Machina's vignette line collapsed into the base rule; successors read the base rule`, pass: !!o.ember4 && !!o.vignetteBase, detail: JSON.stringify(o) }));
  for (const r of rec) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  [${r.detail}]`);
  console.log(rec.every((r) => r.pass) ? `\nTH-MACHINA-SOURCE PARKED: PASS (${rec.length} records) - this FILE parks 3 (page-size, Oct 23)` : `\nTH-MACHINA-SOURCE PARKED: FAIL - ${rec.filter((r) => !r.pass).length}/${rec.length}`);
}
const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nTH-MACHINA-SOURCE VERIFY: PASS (${checks.length} checks)` : `\nTH-MACHINA-SOURCE VERIFY: FAIL - ${bad}/${checks.length}`);
process.exit(bad === 0 ? 0 : 1);
