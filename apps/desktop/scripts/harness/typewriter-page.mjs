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
//
// typewriter-scope (Fable, Oct 21) - `out.*` fields read via `m.getWritingSettings().typewriter`
// right after an `enterPageTypewriter(...)` call used to be a valid proxy for "what did this page's
// own memory resolve to", because enterPageTypewriter used to MIRROR its resolved value into that
// shared field. The fix (this ticket) removes that mirror on purpose - enterPageTypewriter still
// resolves and SAVES the page's own memory, it just no longer writes the shared field at all. Every
// such read below is kept EXACTLY as it was (P1-P4 below still read it, verbatim) for the parked
// block's own audit trail; a `*PP` ("per-page") field is added alongside each one, reading
// `m.typewriterForPage(id, empty)` directly - the pure function this ticket added for exactly this -
// and the real successor checks (P1-P4 in the main tally) assert against those instead.
async function scenario(code) {
  const out = {};
  // (a) a NEW page opens ON in Arbor, OFF in Flux
  { const s = fakeStorage(); const m = await boot(code, s);
    m.setTheme('plateau'); m.enterPageTypewriter('new-arbor', true); out.arborNew = m.getWritingSettings().typewriter; out.arborNewPP = m.typewriterForPage('new-arbor', true); out.arborSaved = s.getItem('wrizo-typewriter-page-new-arbor'); }
  { const s = fakeStorage(); const m = await boot(code, s);
    m.setTheme('flux'); m.enterPageTypewriter('new-flux', true); out.fluxNew = m.getWritingSettings().typewriter; out.fluxNewPP = m.typewriterForPage('new-flux', true); out.fluxSaved = s.getItem('wrizo-typewriter-page-new-flux'); }
  // typewriter-scope (Fable, Oct 21) - typewriterForPage's OWN pure fallback, called on a page
  // that has NEVER had enterPageTypewriter run for it at all (no prior save to fall back to) -
  // its advertised shape ("a side-effect-free read any component already holding the page's id
  // can call directly"), not downstream of a mount effect that already saved something first.
  { const s = fakeStorage(); const m = await boot(code, s); m.setTheme('plateau'); out.pureArborNew = m.typewriterForPage('never-opened-arbor', true); }
  { const s = fakeStorage(); const m = await boot(code, s); m.setTheme('flux'); out.pureFluxNew = m.typewriterForPage('never-opened-flux', true); }
  { const s = fakeStorage(); const m = await boot(code, s); m.setTheme('plateau'); out.pureTextDefault = m.typewriterForPage('never-opened-text', false); }
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
    out.aKeepsOffAfterReloadPP = m.typewriterForPage('A', false);
    m.enterPageTypewriter('B', true);                 // a second NEW page: its own default (Arbor ON), not A's OFF
    out.bOwn = m.getWritingSettings().typewriter;
    out.bOwnPP = m.typewriterForPage('B', true);
    const rb = m.holdTypewriterPage('B'); m.setTypewriterExplicit(false); m.setTypewriterExplicit(true); rb();
    m = await boot(code, s);
    m.enterPageTypewriter('A', false); const aAgain = m.getWritingSettings().typewriter; const aAgainPP = m.typewriterForPage('A', false);
    m.enterPageTypewriter('B', false); const bAgain = m.getWritingSettings().typewriter; const bAgainPP = m.typewriterForPage('B', false);
    out.pair = { aAgain, bAgain }; out.pairPP = { aAgain: aAgainPP, bAgain: bAgainPP };
    // and the other direction: a Flux page turned ON survives a reload
    m.setTheme('flux'); m.enterPageTypewriter('F', true); const rf = m.holdTypewriterPage('F'); out.fluxDefault = m.getWritingSettings().typewriter; out.fluxDefaultPP = m.typewriterForPage('F', true);
    m.setTypewriterExplicit(true); rf();
    m = await boot(code, s); m.enterPageTypewriter('F', false); out.fluxOnKept = m.getWritingSettings().typewriter; out.fluxOnKeptPP = m.typewriterForPage('F', false);
  }
  // (d) a PRE-EXISTING page (no saved value) that already holds text opens OFF - in Arbor too - and then remembers (a later theme change cannot flip it)
  { const s = fakeStorage(); let m = await boot(code, s);
    m.setTheme('plateau'); m.enterPageTypewriter('old', false); out.oldWithText = m.getWritingSettings().typewriter; out.oldWithTextPP = m.typewriterForPage('old', false); out.oldSaved = s.getItem('wrizo-typewriter-page-old');
    m.setWritingSettings({ typewriter: true });       // something else turned the live value on meanwhile
    m = await boot(code, s); m.setTheme('plateau'); m.enterPageTypewriter('old', false); out.oldStillOff = m.getWritingSettings().typewriter; out.oldStillOffPP = m.typewriterForPage('old', false);
    // a short page (1-9 "lines" - the old seed rule's ON band) is OFF now: text is text
    m.enterPageTypewriter('short', false); out.shortWithText = m.getWritingSettings().typewriter; out.shortWithTextPP = m.typewriterForPage('short', false);
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
    // ORIGINAL (pre-typewriter-scope) keys - kept for the parked block below,
    // predicate text byte-for-byte unchanged. These read the shared field
    // enterPageTypewriter no longer mirrors into, so they no longer measure
    // the claim their name describes; see the PP keys for the real proof.
    newPages: o.arborNew === true && o.fluxNew === false && o.arborSaved === 'on' && o.fluxSaved === 'off',
    persists: o.liveAfterToggle === false && o.aKeepsOffAfterReload === false && o.fluxDefault === false && o.fluxOnKept === true,
    ownPerPage: o.bOwn === true && o.pair?.aAgain === false && o.pair?.bAgain === true,
    existingText: o.oldWithText === false && o.oldSaved === 'off' && o.oldStillOff === false && o.shortWithText === false,
    freeWrite: Array.isArray(o.free?.keysFree) && o.free.keysFree.length === 0 && o.free.keysAfterRelease.length === 0,
    retired: o.retired?.seed === false && o.retired?.threshold === false,
    // typewriter-scope successors (Fable, Oct 21) - the SAME claims, read via
    // typewriterForPage (this ticket's own pure per-page read) instead of the
    // retired shared-field mirror. `liveAfterToggle` is reused as-is in
    // persistsPP: it reads the LIVE value right after an explicit toggle,
    // which setTypewriterExplicit still updates unconditionally by design -
    // that part of the old probe was never broken.
    newPagesPP: o.arborNewPP === true && o.fluxNewPP === false && o.arborSaved === 'on' && o.fluxSaved === 'off',
    persistsPP: o.liveAfterToggle === false && o.aKeepsOffAfterReloadPP === false && o.fluxDefaultPP === false && o.fluxOnKeptPP === true,
    ownPerPagePP: o.bOwnPP === true && o.pairPP?.aAgain === false && o.pairPP?.bAgain === true,
    existingTextPP: o.oldWithTextPP === false && o.oldSaved === 'off' && o.oldStillOffPP === false && o.shortWithTextPP === false,
    // typewriterForPage's own fallback, in true isolation (no prior enterPageTypewriter save) -
    // what the three theme-default mutants below actually need to target.
    pureRead: o.pureArborNew === true && o.pureFluxNew === false && o.pureTextDefault === false,
  };
}

const base = await scenario(await bundle());
const v = verdict(base);
// typewriter-scope (Fable, Oct 21) - P1-P4 ORIGINALLY read the shared `typewriter` field as
// their signal, which was a valid proxy only while enterPageTypewriter mirrored its resolution
// into it. This ticket removes that mirror on purpose (store/writingSettings.ts's own SUPERSEDED
// comment above pageKey). The four claims themselves are UNCHANGED and still hold - this ticket's
// own job was to keep them true while fixing the cross-page leak the mirror caused - so each is
// re-proven below via typewriterForPage (the PP verdict keys), the pure per-page read this ticket
// added for exactly this. The originals are parked verbatim, not deleted: run
// HARNESS_PARKED=1 node scripts/harness/typewriter-page.mjs to see them re-assert the mirror's
// retirement (its own new, opposite truth) rather than silently vanishing from the audit trail.
ok('(P1) a NEW page opens ON in Arbor (plateau) and OFF in Flux, and remembers that choice from its first open', v.newPagesPP === true, JSON.stringify({ arbor: base.arborNewPP, flux: base.fluxNewPP, arborSaved: base.arborSaved, fluxSaved: base.fluxSaved }));
ok('(P2) toggle, reload, and the SAME page keeps it - OFF in Arbor and ON in Flux (the saved value beats both the theme and "has text")', v.persistsPP === true, JSON.stringify({ afterToggle: base.liveAfterToggle, aOff: base.aKeepsOffAfterReloadPP, fluxDefault: base.fluxDefaultPP, fluxOnKept: base.fluxOnKeptPP }));
ok('(P3) a SECOND page keeps its OWN setting: A (turned off) and B (its own) each come back as they were', v.ownPerPagePP === true, JSON.stringify({ bOwn: base.bOwnPP, pair: base.pairPP }));
ok('(P4) a pre-existing page with text and no saved value opens OFF (in Arbor too), is saved as OFF, and a later change cannot flip it; a SHORT page is no longer ON (the 1-9-line rule is gone)', v.existingTextPP === true, JSON.stringify({ old: base.oldWithTextPP, saved: base.oldSaved, stillOff: base.oldStillOffPP, short: base.shortWithTextPP }));
ok('(P5) FREE WRITE is unchanged: a toggle with no held Draft page writes no page value, and a page that has been released stops receiving toggles', v.freeWrite === true, JSON.stringify(base.free));
ok('(P12, new) typewriterForPage resolves the theme default correctly for a page that has NEVER been opened (no prior enterPageTypewriter save to fall back on) - Arbor ON, Flux OFF, a pre-existing-text page OFF', v.pureRead === true, JSON.stringify({ arbor: base.pureArborNew, flux: base.pureFluxNew, text: base.pureTextDefault }));
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

// ---- PARKED - SUPERSEDED by typewriter-scope (Fable, Oct 21) -------------------------------
// GENERATION 1, quoted VERBATIM and no longer asserted (see the comment above the P1-P4 ok()
// calls in the main tally, which now read typewriterForPage instead). enterPageTypewriter used
// to MIRROR its resolved value into the shared `typewriter` field; this ticket removes that
// mirror on purpose (it is what let one page's seed leak into another page's Ctrl+B gate - the
// Nick/Fable-reported repro this ticket exists to fix, docs/plans/typewriter-scope-plan.md). The
// four claims below are re-asserted against their NEW, opposite truth - the shared field is
// UNTOUCHED, not merely wrong - so this block stays green under HARNESS_PARKED=1, proving the
// retirement rather than quietly losing the old probe's own audit trail.
//
//   ok('(P1) a NEW page opens ON in Arbor (plateau) and OFF in Flux, and remembers that choice from its first open', v.newPages === true, JSON.stringify({ arbor: base.arborNew, flux: base.fluxNew, arborSaved: base.arborSaved, fluxSaved: base.fluxSaved }));
//   ok('(P2) toggle, reload, and the SAME page keeps it - OFF in Arbor and ON in Flux (the saved value beats both the theme and "has text")', v.persists === true, JSON.stringify({ afterToggle: base.liveAfterToggle, aOff: base.aKeepsOffAfterReload, fluxDefault: base.fluxDefault, fluxOnKept: base.fluxOnKept }));
//   ok('(P3) a SECOND page keeps its OWN setting: A (turned off) and B (its own) each come back as they were', v.ownPerPage === true, JSON.stringify({ bOwn: base.bOwn, pair: base.pair }));
//   ok('(P4) a pre-existing page with text and no saved value opens OFF (in Arbor too), is saved as OFF, and a later change cannot flip it; a SHORT page is no longer ON (the 1-9-line rule is gone)', v.existingText === true, JSON.stringify({ old: base.oldWithText, saved: base.oldSaved, stillOff: base.oldStillOff, short: base.shortWithText }));
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  const SENTINEL = 'SENTINEL-UNTOUCHED';
  const untouched = async (fn) => {
    const s = fakeStorage(); const m = await boot(await bundle(), s);
    m.setWritingSettings({ typewriter: SENTINEL });
    await fn(m);
    return m.getWritingSettings().typewriter === SENTINEL;
  };
  pok('PARKED (was "(P1) a NEW page opens ON in Arbor and OFF in Flux" via the shared field) - the shared field is UNTOUCHED by enterPageTypewriter for a brand-new page, in either theme; the mirror is gone, not merely wrong',
    (await untouched(async (m) => { m.setTheme('plateau'); m.enterPageTypewriter('p-sentinel-a', true); }))
    && (await untouched(async (m) => { m.setTheme('flux'); m.enterPageTypewriter('p-sentinel-b', true); })));
  pok('PARKED (was "(P2) toggle, reload, and the SAME page keeps it" via the shared field) - the shared field is UNTOUCHED by enterPageTypewriter on reload, for a page with an already-saved value',
    await untouched(async (m) => { m.enterPageTypewriter('p-sentinel-c', false); }));
  pok('PARKED (was "(P3) a SECOND page keeps its OWN setting" via the shared field) - the shared field is UNTOUCHED by enterPageTypewriter for a second, different page',
    await untouched(async (m) => { m.enterPageTypewriter('p-sentinel-d', true); }));
  pok('PARKED (was "(P4) a pre-existing page with text opens OFF" via the shared field) - the shared field is UNTOUCHED by enterPageTypewriter for a pre-existing page that already holds text',
    await untouched(async (m) => { m.setTheme('plateau'); m.enterPageTypewriter('p-sentinel-e', false); }));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nTYPEWRITER-PAGE PARKED: PASS (${parkedChecks.length} checks) - HARNESS_PARKED=1 armed; P1-P4's old shared-field probes retired on purpose, successors in the main tally above.`
    : `\nTYPEWRITER-PAGE PARKED: FAIL - ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
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
// typewriter-scope (Fable, Oct 21) - every mutant below used to target an ORIGINAL verdict key
// (newPages/persists/ownPerPage/existingText). Those keys read the shared field enterPageTypewriter
// no longer mirrors into, so they are now UNCONDITIONALLY false regardless of mutation - a mutant
// "passing" against one of them proves nothing (guard-can-pass-while-blind), and two had drifted
// anchors besides (the refactor renamed an intermediate `on` variable out of existence). Retargeted
// to the PP ("per-page", typewriterForPage-based) keys the real P1-P4 successors above use; the
// 'freeWrite' mutants are untouched - that key was never shared-field-based and still measures
// what it always did.
const WS = 'store/writingSettings.ts';
await mutant('the theme default is ignored (every new page OFF)', { [WS]: swap('empty ? THEME_CONFIG[getTheme()].typewriterDefault : false', 'false') }, 'pureRead');
await mutant('Flux inherits Arbor\'s default (the table is read wrongly)', { [WS]: swap('THEME_CONFIG[getTheme()].typewriterDefault', 'THEME_CONFIG.plateau.typewriterDefault') }, 'pureRead');
await mutant('a toggle is not written to the page', { [WS]: swap('if (heldPageId != null) writePageTypewriter(heldPageId, on);', '') }, 'persistsPP');
await mutant('the saved value is ignored at mount (text pages always OFF)', { [WS]: swap('return saved ?? (empty', 'return (empty') }, 'persistsPP');
await mutant('every page shares ONE key', { [WS]: swap("const pageKey = (id: string) => `wrizo-typewriter-page-${id}`;", "const pageKey = (_id: string) => `wrizo-typewriter-page`;") }, 'ownPerPagePP');
await mutant('a page with text takes the theme default', { [WS]: swap('(empty ? THEME_CONFIG[getTheme()].typewriterDefault : false)', 'THEME_CONFIG[getTheme()].typewriterDefault') }, 'pureRead');
await mutant('the first open is not saved (the page does not remember until it is toggled)', { [WS]: swap('if (saved == null) writePageTypewriter(id, empty ? THEME_CONFIG[getTheme()].typewriterDefault : false);', '') }, 'newPagesPP');
await mutant('Free Write toggles write a page value (no held-page test)', { [WS]: swap('if (heldPageId != null) writePageTypewriter(heldPageId, on);', "writePageTypewriter(heldPageId ?? 'free', on);") }, 'freeWrite');
await mutant('a released page keeps receiving toggles', { [WS]: swap('return () => { if (heldPageId === id) heldPageId = null; };', 'return () => {};') }, 'freeWrite');

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' | ' + String(c.detail).slice(0, 300)));
}
console.log(failed === 0 ? `\nTYPEWRITER-PAGE VERIFY: PASS (${checks.length} checks)` : `\nTYPEWRITER-PAGE VERIFY: FAIL — ${failed}/${checks.length}`);
process.exit(failed === 0 ? 0 : 1);
