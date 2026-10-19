// REVISE SPELLING — the browser's own spell-check, on in Revise ONLY.
// Nick: "Red squiggles for typos/misspellings, olive green squiggles for grammar
// errors, and only when the User is in Revise mode". This file covers the SPELLING
// half (red, the browser's own); grammar (olive) is a later item through TUTOR's S0.
//
// WHAT IS ASSERTED, AND WHY THE ATTRIBUTE. The squiggle is painted by the browser
// and is not in the DOM, so no check can see it. What the product controls is the
// `spellcheck` attribute on the writing surface, and that is exactly what changed
// (ForwardOnlyEditor used to hardcode false). The check reads BOTH the attribute and
// the live `.spellcheck` property, per mode, on the real page.
//
// A DRIVER CAN LIE BY DOING NOTHING: every mode read is preceded by a control that the
// mode switch actually LANDED (the strip tab reads active) — otherwise "Free Write
// reads false" would pass on a page that never left Revise's opposite. Modes are
// reached through the strip's own tabs (data-mode-key, the contract marker).
//
// Run: node scripts/harness/revspell.mjs   (from apps/desktop, dist-web built).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

let s1Succ = null;   // S1's successor verdict, kept for its parked record (PAGE TEMPLATES, Fable Oct 17)
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fixtures ADOPTED from item112a.mjs (the standing law: adopt, do not re-derive).
const freshDesk = async (app, width, height) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};
const freshProsePage = async (app, width, height) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (prose)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'prose page framed' });
  await app.emulateDpr(1, width, height);
  await sleep(300);
};

// Probe first, never assume: a missing tab yields null and a FAILED check, not an abort.
const enterMode = async (app, key) => {
  const had = await app.evalJs(`!!document.querySelector('.desk-mode-tab[data-mode-key="${key}"]')`);
  if (had) await app.evalJs(`document.querySelector('.desk-mode-tab[data-mode-key="${key}"]').click()`);
  await sleep(450);
  return had;
};
const readSurface = (app, key) => app.evalJs(`(() => {
  const tab = document.querySelector('.desk-mode-tab[data-mode-key="${key}"]');
  const ed = document.querySelector('.forward-only-editor');
  return {
    tabActive: !!tab && tab.classList.contains('active') && tab.getAttribute('aria-selected') === 'true',
    editorPresent: !!ed,
    attr: ed ? ed.getAttribute('spellcheck') : null,
    prop: ed ? ed.spellcheck : null,
    editable: ed ? ed.isContentEditable : null,
  };
})()`);

// ---- the STATIC census (browserless): which hosts ever turn spell-check on -------
const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
function walk(dir, acc = []) {
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name);
    if (n.isDirectory()) walk(p, acc); else if (/\.(ts|tsx)$/.test(n.name)) acc.push(p);
  }
  return acc;
}
const srcFiles = walk(SRC);
const sites = [];
for (const f of srcFiles) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/\bspellCheck\b/.test(line) && !/^\s*\/\//.test(line) && !/^\s*\*/.test(line)) sites.push(`${path.relative(SRC, f).replace(/\\/g, '/')}:${line.trim()}`);
  });
}
const truthy = sites.filter((s) => !/spellCheck=\{false\}/.test(s));
ok('S0: COVERAGE — the census read the whole client (> 100 source files), so the site list below means something and not blindness',
  srcFiles.length > 100, `files=${srcFiles.length}`);
// ---- PARKED - SUPERSEDED by Fable's ruling of Oct 17 (page-templates, ledger 87): the Title Page sheet (components/TitlePageSheet.tsx) is a form of short fields, not a prose editor host. Spell-check is ON for its TITLE (the writer's own words,
// like the page) and OFF for its AUTHOR, CONTACT and WORD LINE (names, addresses, a count). The claim "no editor host hardcodes it off" still holds for every PROSE host; it does not hold for those three fields, by design.
// Kept VERBATIM below and no longer run; the successor says exactly that.
//
// ok('S1: NO editor host hardcodes spellCheck={false} any more — the one that did (ForwardOnlyEditor) is now mode-driven, so nothing forces the checker off in Revise',
//   !sites.some((s) => /spellCheck=\{false\}/.test(s)), JSON.stringify(sites));
const falseSites = sites.filter((s) => /spellCheck=\{false\}/.test(s));
const falseFields = falseSites.map((s) => (/data-field="([a-z]+)"/.exec(s) || [])[1] || null).sort();
const sheetSrc = fs.readFileSync(path.join(SRC, 'components/TitlePageSheet.tsx'), 'utf8').split('\n');
const titleLine = sheetSrc.find((l) => /data-field="title"/.test(l)) || null;   // the liveness read: the title field is really there, and is read by its own line
s1Succ = falseSites.length === 3 && falseSites.every((s) => s.startsWith('components/TitlePageSheet.tsx:')) && JSON.stringify(falseFields) === JSON.stringify(['author', 'contact', 'words']) && !!titleLine && !/spellCheck/.test(titleLine);
ok('S1 [page-templates successor]: no PROSE editor host hardcodes spellCheck={false}; the ONLY hardcoded-off sites are the Title Page sheet AUTHOR, CONTACT and WORD LINE fields (data-field author, contact, words), and its TITLE field carries no spellCheck attribute at all, so spell-check is ON for the title',
  s1Succ, JSON.stringify({ falseSites, falseFields, titleLine: titleLine && titleLine.trim() }));
ok('S2: the only sites that can turn the checker ON are ForwardOnlyEditor (spellCheck={mode === \'revise\'}, gated) and JournalEntry.tsx (a pre-existing, untouched `spellCheck`; see the report — an unmounted component as far as a source search shows) — a THIRD host that enables it fails this run',
  truthy.length === 2
    && truthy.some((s) => s.startsWith('components/ForwardOnlyEditor.tsx:') && s.includes("spellCheck={mode === 'revise'}"))
    && truthy.some((s) => s.startsWith('pages/JournalEntry.tsx:')),
  JSON.stringify(truthy));

await withHarness(async (app) => {
  await freshProsePage(app, 1366, 768);

  // Free Write is the page's default mode; assert it as READ, then re-assert after a round trip.
  const fwHad = await enterMode(app, 'freewrite');
  const fw = await readSurface(app, 'freewrite');
  ok('S3 CONTROL: the Free Write tab exists and the switch LANDED (tab active + aria-selected) — so the reads below are about Free Write and not about a page that never moved',
    fwHad && fw.tabActive && fw.editorPresent, JSON.stringify({ fwHad, fw }));
  ok('S4: Free Write — spellcheck is OFF (attribute "false", property false) — a forward-only draft does not nag',
    fw.attr === 'false' && fw.prop === false, JSON.stringify(fw));

  const drHad = await enterMode(app, 'draft');
  const dr = await readSurface(app, 'draft');
  ok('S5 CONTROL: the Draft tab exists and the switch LANDED', drHad && dr.tabActive && dr.editorPresent, JSON.stringify({ drHad, dr }));
  ok('S6: Draft — spellcheck is OFF (Nick scoped the squiggle to Revise only)',
    dr.attr === 'false' && dr.prop === false, JSON.stringify(dr));

  const rvHad = await enterMode(app, 'revise');
  const rv = await readSurface(app, 'revise');
  ok('S7 CONTROL: the Revise tab exists and the switch LANDED', rvHad && rv.tabActive && rv.editorPresent, JSON.stringify({ rvHad, rv }));
  ok('S8: Revise — spellcheck is ON (attribute "true", property true, surface still editable) — the browser paints its own red squiggle',
    rv.attr === 'true' && rv.prop === true && rv.editable === true, JSON.stringify(rv));

  await enterMode(app, 'draft');
  const back = await readSurface(app, 'draft');
  ok('S9: leaving Revise turns it OFF again (Revise -> Draft) — it is per-mode, not a sticky page setting',
    back.tabActive && back.attr === 'false' && back.prop === false, JSON.stringify(back));

  await enterMode(app, 'freewrite');
  const back2 = await readSurface(app, 'freewrite');
  ok('S10: and Revise -> Draft -> Free Write is off at the end too — the round trip ends where it began',
    back2.tabActive && back2.attr === 'false' && back2.prop === false, JSON.stringify(back2));
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  // ---- PARKED - SUPERSEDED (page-templates, Fable Oct 17): this file now parks ONE check, S1 (above); the claim below, that it parks nothing, is no longer true. Kept VERBATIM.
  //
  // console.log('\nREVSPELL PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: nothing ever asserted the spellcheck attribute (it was a hardcoded false), so no earlier check is falsified.');
  console.log(`\nREVSPELL PARKED: ${s1Succ === true ? 'PASS' : 'FAIL'} (1 check) — HARNESS_PARKED=1 armed; ONE park: S1's "no editor host hardcodes spellCheck={false}" no longer holds for the Title Page sheet's author, contact and word-line fields (spell-check ON for the title, OFF for those three - Fable's ruling, Oct 17); its successor is the live S1 [page-templates successor].`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nREVSPELL VERIFY: PASS (${checks.length} checks)`
  : `\nREVSPELL VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
