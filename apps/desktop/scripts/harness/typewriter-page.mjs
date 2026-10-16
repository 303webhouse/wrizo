// PHASE 1, S5 - THE TYPEWRITER IS REMEMBERED PER PAGE (Nick, Oct 11; Fable's spec). Browserless and REAL: the shipped store modules (store/writingSettings.ts +
// store/theme.ts) are bundled with esbuild and run against a fake localStorage, so the rule is exercised, not read. "Reload" is a fresh module instance over the same
// storage - the app's own boot. The browser half (a real page, a real click, a real reload) is a box turn.
//
// The rule, as claims:
//   - a NEW (empty) page takes its theme's default: Arbor (plateau) ON, Flux OFF; the default is a value in each theme's config, with marked slots for the unbuilt themes;
//   - toggle, reload, and the SAME page keeps it; a SECOND page keeps its OWN setting;
//   - a page with NO saved value that already holds text opens OFF - and then remembers;
//   - the 1-9-line seed rule and the session-only flag are gone; Free Write is unchanged (a toggle there writes no page value); Tab still indents.
//
// Run: node scripts/harness/typewriter-page.mjs   (from apps/desktop)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..', '..');
const SRC = join(desktop, 'src');
const { build } = createRequire(createRequire(join(desktop, 'package.json')).resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const read = (rel) => noCR(readFileSync(join(SRC, rel), 'utf8'));

// ---- the fake device ------------------------------------------------------------------------------------------------------------------
function fakeStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, clear: () => m.clear(), _m: m };
}

// ---- bundle the two real stores, with optional source overrides (for mutants) ---------------------------------------------------------
async function bundle(overrides = {}) {
  const res = await build({
    stdin: { contents: "export * from './store/writingSettings'; export * from './store/theme';", resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    plugins: [{ name: 'ov', setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (a) => {
        const rel = relative(SRC, a.path).split('\\').join('/');
        const text = readFileSync(a.path, 'utf8');
        return { contents: overrides[rel] ? overrides[rel](noCR(text)) : text, loader: 'ts' };
      });
    } }],
  });
  return res.outputFiles[0].text;
}
// One "boot" of the app over a given storage: a fresh module instance (the store hydrates once, at module init, exactly as the app does).
let bootN = 0;
async function boot(code, storage) {
  globalThis.localStorage = storage;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}#boot${bootN++}`);
}
const swap = (from, to) => (t) => { if (!t.includes(from)) throw new Error(`mutation anchor missing: ${from.slice(0, 60)}`); return t.replace(from, () => to); };

// ---- the scenario, as one function of the code so a mutant can change any one of its claims -----------------------------------------
async function scenario(code) {
  const out = {};
  // (a) a NEW page opens ON in Arbor, OFF in Flux
  { const s = fakeStorage(); const m = await boot(code, s);
    m.setTheme('plateau'); m.enterPageTypewriter('new-arbor', true); out.arborNew = m.getWritingSettings().typewriter; out.arborSaved = s.getItem('wrizo-typewriter-page-new-arbor'); }
  { const s = fakeStorage(); const m = await boot(code, s);
    m.setTheme('flux'); m.enterPageTypewriter('new-flux', true); out.fluxNew = m.getWritingSettings().typewriter; out.fluxSaved = s.getItem('wrizo-typewriter-page-new-flux'); }
  // (b) toggle, reload, the same page keeps it - both directions - and (c) a second page keeps its OWN
  { const s = fakeStorage(); let m = await boot(code, s);
    m.setTheme('plateau');
    m.enterPageTypewriter('A', true);                 // Arbor new page: ON
    const release = m.holdTypewriterPage('A');
    m.setTypewriterExplicit(false);                   // the writer turns it OFF
    out.liveAfterToggle = m.getWritingSettings().typewriter;
    release();
    m = await boot(code, s);                          // RELOAD
    m.enterPageTypewriter('A', false);                // the page reopens (text now); the SAVED value must win over "has text -> off" and over the theme
    out.aKeepsOffAfterReload = m.getWritingSettings().typewriter;
    m.enterPageTypewriter('B', true);                 // a second NEW page: its own default (Arbor ON), not A's OFF
    out.bOwn = m.getWritingSettings().typewriter;
    const rb = m.holdTypewriterPage('B'); m.setTypewriterExplicit(false); m.setTypewriterExplicit(true); rb();
    m = await boot(code, s);
    m.enterPageTypewriter('A', false); const aAgain = m.getWritingSettings().typewriter;
    m.enterPageTypewriter('B', false); const bAgain = m.getWritingSettings().typewriter;
    out.pair = { aAgain, bAgain };
    // and the other direction: a Flux page turned ON survives a reload
    m.setTheme('flux'); m.enterPageTypewriter('F', true); const rf = m.holdTypewriterPage('F'); out.fluxDefault = m.getWritingSettings().typewriter;
    m.setTypewriterExplicit(true); rf();
    m = await boot(code, s); m.enterPageTypewriter('F', false); out.fluxOnKept = m.getWritingSettings().typewriter;
  }
  // (d) a PRE-EXISTING page (no saved value) that already holds text opens OFF - in Arbor too - and then remembers (a later theme change cannot flip it)
  { const s = fakeStorage(); let m = await boot(code, s);
    m.setTheme('plateau'); m.enterPageTypewriter('old', false); out.oldWithText = m.getWritingSettings().typewriter; out.oldSaved = s.getItem('wrizo-typewriter-page-old');
    m.setWritingSettings({ typewriter: true });       // something else turned the live value on meanwhile
    m = await boot(code, s); m.setTheme('plateau'); m.enterPageTypewriter('old', false); out.oldStillOff = m.getWritingSettings().typewriter;
    // a short page (1-9 "lines" - the old seed rule's ON band) is OFF now: text is text
    m.enterPageTypewriter('short', false); out.shortWithText = m.getWritingSettings().typewriter;
  }
  // (e) FREE WRITE IS UNCHANGED: a toggle with no held Draft page writes no page value; and a released page no longer receives toggles
  { const s = fakeStorage(); const m = await boot(code, s);
    m.setTypewriterExplicit(true); m.setTypewriterExplicit(false);
    const keysFree = [...s._m.keys()].filter((k) => k.startsWith('wrizo-typewriter-page-'));
    const rel = m.holdTypewriterPage('Z')(); m.setTypewriterExplicit(true);
    const keysAfterRelease = [...s._m.keys()].filter((k) => k.startsWith('wrizo-typewriter-page-'));
    out.free = { keysFree, keysAfterRelease };
  }
  // (f) the retired machinery is gone from the module's surface
  { const s = fakeStorage(); const m = await boot(code, s);
    out.retired = { seed: 'seedTypewriterDefault' in m, threshold: 'DRAFT_TYPEWRITER_LINE_THRESHOLD' in m };
  }
  return out;
}
function verdict(o) {
  return {
    newPages: o.arborNew === true && o.fluxNew === false && o.arborSaved === 'on' && o.fluxSaved === 'off',
    persists: o.liveAfterToggle === false && o.aKeepsOffAfterReload === false && o.fluxDefault === false && o.fluxOnKept === true,
    ownPerPage: o.bOwn === true && o.pair?.aAgain === false && o.pair?.bAgain === true,
    existingText: o.oldWithText === false && o.oldSaved === 'off' && o.oldStillOff === false && o.shortWithText === false,
    freeWrite: Array.isArray(o.free?.keysFree) && o.free.keysFree.length === 0 && o.free.keysAfterRelease.length === 0,
    retired: o.retired?.seed === false && o.retired?.threshold === false,
  };
}

const base = await scenario(await bundle());
const v = verdict(base);
ok('(P1) a NEW page opens ON in Arbor (plateau) and OFF in Flux, and remembers that choice from its first open', v.newPages === true, JSON.stringify({ arbor: base.arborNew, flux: base.fluxNew, arborSaved: base.arborSaved, fluxSaved: base.fluxSaved }));
ok('(P2) toggle, reload, and the SAME page keeps it - OFF in Arbor and ON in Flux (the saved value beats both the theme and "has text")', v.persists === true, JSON.stringify({ afterToggle: base.liveAfterToggle, aOff: base.aKeepsOffAfterReload, fluxDefault: base.fluxDefault, fluxOnKept: base.fluxOnKept }));
ok('(P3) a SECOND page keeps its OWN setting: A (turned off) and B (its own) each come back as they were', v.ownPerPage === true, JSON.stringify({ bOwn: base.bOwn, pair: base.pair }));
ok('(P4) a pre-existing page with text and no saved value opens OFF (in Arbor too), is saved as OFF, and a later change cannot flip it; a SHORT page is no longer ON (the 1-9-line rule is gone)', v.existingText === true, JSON.stringify({ old: base.oldWithText, saved: base.oldSaved, stillOff: base.oldStillOff, short: base.shortWithText }));
ok('(P5) FREE WRITE is unchanged: a toggle with no held Draft page writes no page value, and a page that has been released stops receiving toggles', v.freeWrite === true, JSON.stringify(base.free));
ok('(P6) the retired machinery is gone from the store: no seedTypewriterDefault, no DRAFT_TYPEWRITER_LINE_THRESHOLD (and no session flag, below)', v.retired === true, JSON.stringify(base.retired));

// ---- source claims ------------------------------------------------------------------------------------------------------------------------
{
  const ws = read('store/writingSettings.ts'), theme = read('store/theme.ts'), pe = read('pages/PageEditor.tsx'), se = read('components/ScriptEditor.tsx');
  const tc = /export const THEME_CONFIG: Record<ThemeId, ThemeConfig> = \{\s*plateau: \{ typewriterDefault: true \},\s*flux: \{ typewriterDefault: false \},\s*\};/.test(theme);
  const slots = /machina: \{ typewriterDefault: false \}/.test(theme) && /nomad:\s+\{ typewriterDefault: true \}/.test(theme) && /volant:\s+TBD/.test(theme)
    && !/^\s*(machina|nomad|volant):/m.test(theme.replace(/\/\/.*$/gm, ''));
  ok('(P7) the default is a VALUE in each theme\'s config (plateau true, flux false), and Machina (off), Nomad (on) and Volant (TBD) are marked slots in comments - not registered, not guessed', tc && slots, JSON.stringify({ tc, slots }));
  ok('(P8) the session-only flag is gone: no explicitlySetThisSession anywhere in the store', !/explicitlySetThisSession/.test(ws.replace(/\/\/.*$/gm, '')), '');
  ok('(P9) PageEditor reads the page\'s memory ONCE, at mount, and only when the page opens into Draft (Free Write never calls it); the page is held only while Draft is mounted',
    /useEffect\(\(\) => \{\n[\s\S]{0,1800}?if \(mode === 'drafting'\) \{ enterPageTypewriter\(id, initialText\.trim\(\)\.length === 0\); typewriterEnteredRef\.current = true; \}[^\n]*\n\s*\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n\s*\}, \[\]\);/.test(pe)
      && /if \(mode !== 'drafting'\) return undefined;\n\s*if \(!typewriterEnteredRef\.current\) \{ typewriterEnteredRef\.current = true; enterPageTypewriter\(id, textRef\.current\.trim\(\)\.length === 0\); \}\n\s*return holdTypewriterPage\(id\);\n\s*\}, \[mode, id\]\);/.test(pe) && !/seedTypewriterDefault|DRAFT_TYPEWRITER_LINE_THRESHOLD/.test(pe.replace(/\/\/.*$/gm, '')), '');
  ok('(P9b) a page opened in FREE WRITE reads its memory the FIRST time it reaches Draft (by the strip), once per mount - so a page that remembers OFF is never left on the global ON left by another page',
    /const typewriterEnteredRef = useRef\(false\);/.test(pe) && (pe.match(/typewriterEnteredRef\.current = true/g) || []).length === 2, '');
  ok('(P10) SCREENPLAY follows the same rule: ScriptEditor enters the page\'s memory at mount (empty = no scenes with text) and holds the page while mounted',
    /enterPageTypewriter\(id, !initialEntry\?\.script \|\| isScriptEmpty\(initialEntry\.script\)\);\s*return holdTypewriterPage\(id\);/.test(se), '');
  ok('(P11) TAB STILL INDENTS: the Tab path (applyFormatAt, a separate gate from applyRailFormat) is untouched by S5 - it does not mention the typewriter',
    (() => { const a = pe.indexOf('const applyFormatAt = (action: FormatAction) => {'); const b = pe.indexOf('\n  };\n', a); return a > 0 && b > a && !/typewriter/i.test(pe.slice(a, b)); })(), '');
}

// =============================================================================
// MUTATIONS - each asserts it LANDED, and that the scenario (not a crash) is what went red.
// =============================================================================
async function mutant(name, overrides, which) {
  let o;
  try { o = await scenario(await bundle(overrides)); } catch (e) {
    if (/mutation anchor missing/.test(String(e))) { ok(`(M) ${name}: THE MUTATION LANDED`, false, 'anchor missing'); return; }
    ok(`(M) ${name}: the proof goes RED`, false, 'CRASHED, which is not evidence: ' + String(e).slice(0, 140)); return;
  }
  ok(`(M) ${name}: the proof goes RED`, verdict(o)[which] === false, JSON.stringify(verdict(o)));
}
const WS = 'store/writingSettings.ts';
await mutant('the theme default is ignored (every new page OFF)', { [WS]: swap('empty ? THEME_CONFIG[getTheme()].typewriterDefault : false', 'false') }, 'newPages');
await mutant('Flux inherits Arbor\'s default (the table is read wrongly)', { [WS]: swap('THEME_CONFIG[getTheme()].typewriterDefault', 'THEME_CONFIG.plateau.typewriterDefault') }, 'newPages');
await mutant('a toggle is not written to the page', { [WS]: swap('if (heldPageId != null) writePageTypewriter(heldPageId, on);', '') }, 'persists');
await mutant('the saved value is ignored at mount (text pages always OFF)', { [WS]: swap('const on = saved ?? (empty', 'const on = (empty') }, 'persists');
await mutant('every page shares ONE key', { [WS]: swap("const pageKey = (id: string) => `wrizo-typewriter-page-${id}`;", "const pageKey = (_id: string) => `wrizo-typewriter-page`;") }, 'ownPerPage');
await mutant('a page with text takes the theme default', { [WS]: swap('(empty ? THEME_CONFIG[getTheme()].typewriterDefault : false)', 'THEME_CONFIG[getTheme()].typewriterDefault') }, 'existingText');
await mutant('the first open is not saved (the page does not remember until it is toggled)', { [WS]: swap('if (saved == null) writePageTypewriter(id, on);', '') }, 'newPages');
await mutant('Free Write toggles write a page value (no held-page test)', { [WS]: swap('if (heldPageId != null) writePageTypewriter(heldPageId, on);', "writePageTypewriter(heldPageId ?? 'free', on);") }, 'freeWrite');
await mutant('a released page keeps receiving toggles', { [WS]: swap('return () => { if (heldPageId === id) heldPageId = null; };', 'return () => {};') }, 'freeWrite');

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' | ' + String(c.detail).slice(0, 300)));
}
console.log(failed === 0 ? `\nTYPEWRITER-PAGE VERIFY: PASS (${checks.length} checks)` : `\nTYPEWRITER-PAGE VERIFY: FAIL — ${failed}/${checks.length}`);
process.exit(failed === 0 ? 0 : 1);
