// PHASE 1 - ONE DRAWER AT A TIME, AT EVERY WIDTH (Fable, Oct 12). Browserless and REAL: the shipped store/menusDrawers.ts is bundled with esbuild and run.
// The page's two hands - the Tools drawer (left, 'tools') and the Tutor drawer (right, 'tutor') - are mutually exclusive whatever the room: opening either closes the other through
// the other's own registered close path. The far-left cascade keeps its width-measured law against the Tools drawer (here, with no document, "the band holds both": they coexist).
// The browser half is drawers-p1-live.mjs L7 (1100 / 1280 / 1400).
//
// Run: node scripts/harness/one-drawer.mjs   (from apps/desktop)
import { readFileSync, existsSync } from 'node:fs';
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

async function load(overrides = {}) {
  const res = await build({
    stdin: { contents: "export * from './store/menusDrawers';", resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    plugins: [{ name: 'ov', setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (a) => {
        const rel = relative(SRC, a.path).split('\\').join('/');
        const text = noCR(readFileSync(a.path, 'utf8'));
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}#m${Math.random()}`);
}
const swap = (from, to) => (t) => { if (!t.includes(from)) throw new Error(`mutation anchor missing: ${from.slice(0, 60)}`); return t.replace(from, () => to); };

// each drawer as the app has it: a believed-open flag, a close path registered, an announcement from its own "open" state
function rig(m) {
  const s = { tools: false, tutor: false, cascade: false, closes: [] };
  for (const id of ['tools', 'tutor', 'cascade']) m.registerDrawer(id, () => { s.closes.push(id); s[id] = false; m.noteClosed(id); });
  const open = (id) => { s[id] = true; m.requestOpen(id); };
  const close = (id) => { s[id] = false; m.noteClosed(id); };
  return { s, open, close };
}
// A fake document in which the band holds neither drawer's fallback width together (band 20px < tools 200 + cascade 300): the width law answers NO, so a missed cascade is VISIBLE.
const fakeDocument = () => ({
  querySelector: (sel) => {
    const box = (b) => ({ getBoundingClientRect: () => ({ ...b, right: b.left + b.width, bottom: b.top + b.height }) });
    if (sel.includes('.mode-page')) return box({ left: 100, top: 0, width: 500, height: 500 });
    if (sel === '.desk-frame-strip') return box({ left: 0, top: 0, width: 80, height: 500 });
    return null;   // the open drawers' own boxes: not mounted - the fallbacks apply
  },
});
function scenario(m) {
  const r = rig(m); const out = {};
  r.open('tools');
  r.open('tutor'); out.toolsThenTutor = { tools: r.s.tools, tutor: r.s.tutor, closes: [...r.s.closes] };
  r.s.closes.length = 0; r.open('tools'); out.tutorThenTools = { tools: r.s.tools, tutor: r.s.tutor, closes: [...r.s.closes] };
  // closing one by hand, then opening the other, must NOT call a stale close on the one already shut
  r.close('tools'); r.s.closes.length = 0; r.open('tutor'); out.afterManualClose = { tools: r.s.tools, tutor: r.s.tutor, closes: [...r.s.closes] };
  // the tutor alone, and reopening itself, closes nothing
  r.close('tutor'); r.s.closes.length = 0; r.open('tutor'); out.tutorAlone = { tutor: r.s.tutor, closes: [...r.s.closes] };
  // the cascade vs the Tools drawer is the OLD width-measured law: with no document ("the band holds both") they coexist, exactly as before
  r.close('tutor'); r.s.closes.length = 0; r.open('tools'); r.open('cascade'); out.cascadeWithTools = { tools: r.s.tools, cascade: r.s.cascade, closes: [...r.s.closes] };
  // the cascade does not touch the Tutor (it is not one of the two hands' business)
  r.close('tools'); r.close('cascade'); r.s.closes.length = 0; r.open('tutor'); r.open('cascade'); out.cascadeWithTutor = { tutor: r.s.tutor, cascade: r.s.cascade, closes: [...r.s.closes] };
  // THE SEQUENCE FABLE FOUND (Oct 12): the cascade opens, the Tutor opens (openDrawer becomes 'tutor'), then Tools opens. Tools closes the Tutor - and, where the band cannot hold the Tools drawer and
  // the cascade, the width law must STILL see the cascade standing and close it. (Run under a document whose band says NO; the case above keeps the no-document "room" answer.)
  r.close('tutor'); r.close('cascade'); r.close('tools'); r.s.closes.length = 0;
  globalThis.document = fakeDocument();
  try { r.open('cascade'); r.open('tutor'); r.open('tools'); } finally { delete globalThis.document; }
  out.cascadeTutorTools = { tools: r.s.tools, tutor: r.s.tutor, cascade: r.s.cascade, closes: [...r.s.closes] };
  return out;
}
function verdict(o) {
  return {
    toolsThenTutor: o.toolsThenTutor.tools === false && o.toolsThenTutor.tutor === true && o.toolsThenTutor.closes.join() === 'tools',
    tutorThenTools: o.tutorThenTools.tutor === false && o.tutorThenTools.tools === true && o.tutorThenTools.closes.join() === 'tutor',
    afterManualClose: o.afterManualClose.tutor === true && o.afterManualClose.closes.length === 0,
    tutorAlone: o.tutorAlone.tutor === true && o.tutorAlone.closes.length === 0,
    cascadeSeen: o.cascadeTutorTools.tools === true && o.cascadeTutorTools.tutor === false && o.cascadeTutorTools.cascade === false && o.cascadeTutorTools.closes.includes('tutor') && o.cascadeTutorTools.closes.includes('cascade'),
    cascadeKept: o.cascadeWithTools.tools === true && o.cascadeWithTools.cascade === true && o.cascadeWithTools.closes.length === 0
      && o.cascadeWithTutor.tutor === true && o.cascadeWithTutor.cascade === true && o.cascadeWithTutor.closes.length === 0,
  };
}

const base = scenario(await load());
const v = verdict(base);
ok('(O1) opening the TUTOR while the Tools drawer is open closes the Tools drawer, through its own registered close path - at any width (no measuring is involved)', v.toolsThenTutor, JSON.stringify(base.toolsThenTutor));
ok('(O2) and the reverse: opening the Tools drawer while the Tutor is open closes the Tutor', v.tutorThenTools, JSON.stringify(base.tutorThenTools));
ok('(O3) no stale close: after the writer closes one by hand, opening the other calls nothing on the one already shut', v.afterManualClose, JSON.stringify(base.afterManualClose));
ok('(O4) a drawer opening with no rival standing closes nothing', v.tutorAlone, JSON.stringify(base.tutorAlone));
ok('(O5) the far-left CASCADE keeps its own width-measured law and is none of the Tutor\'s business: with room it coexists with the Tools drawer, and opening it closes nothing of the Tutor\'s', v.cascadeKept, JSON.stringify({ a: base.cascadeWithTools, b: base.cascadeWithTutor }));
{
  const tutor = read('components/Tutor.tsx'), sliver = read('components/Sliver.tsx');
  const layoutAnnounce = /useLayoutEffect\(\(\) => \{\n\s*if \(open\) requestOpen\('tutor'\);/.test(tutor) && /useLayoutEffect\(\(\) => \{\n\s*if \(open\) requestOpen\('tools'\);/.test(sliver);
  ok('(O7) both announcements are LAYOUT effects, so the hand-over lands before paint - there is no single frame with both hands open', layoutAnnounce, JSON.stringify({ layoutAnnounce }));
  const tutorAnnounces = /if \(open\) requestOpen\('tutor'\);\n\s*else noteClosed\('tutor'\);\n\s*\}, \[open\]\);\n\s*useEffect\(\(\) => registerDrawer\('tutor', \(\) => setOpen\(false\)\), \[\]\);/.test(tutor)
    && /import \{ requestOpen, noteClosed, registerDrawer \} from '\.\.\/store\/menusDrawers';/.test(tutor);
  const sliverStill = /if \(open\) requestOpen\('tools'\);\n\s*else noteClosed\('tools'\);/.test(sliver) && /registerDrawer\('tools', \(\) => setOpen\(false\)\)/.test(sliver);
  ok('(O5b) the sequence cascade -> Tutor -> Tools: Tools closes the Tutor AND the width law still sees the cascade standing and closes it where the band cannot hold both (the check tests the store\'s own record of what stands, not only the most recent opener)', v.cascadeSeen, JSON.stringify(base.cascadeTutorTools));
ok('(O6) the Tutor announces from an EFFECT keyed on its open state (so every path that opens it announces) and registers its own close path; the Tools drawer still does the same', tutorAnnounces && sliverStill, JSON.stringify({ tutorAnnounces, sliverStill }));
}

async function mutant(name, overrides, which) {
  let o;
  try { o = scenario(await load(overrides)); } catch (e) {
    if (/mutation anchor missing/.test(String(e))) { ok(`(M) ${name}: THE MUTATION LANDED`, false, 'anchor missing'); return; }
    ok(`(M) ${name}: the proof goes RED`, false, 'CRASHED, which is not evidence: ' + String(e).slice(0, 140)); return;
  }
  ok(`(M) ${name}: the proof goes RED`, verdict(o)[which] === false, JSON.stringify(verdict(o)));
}
const MD = 'store/menusDrawers.ts';
await mutant('the pair is no longer exclusive (the rival is not closed)', { [MD]: swap('if (stands.has(rival)) { stands.delete(rival); closers.get(rival)?.(); yielded = rival; }', '') }, 'toolsThenTutor');
await mutant('the exclusion becomes the width-measured law again (only when the band cannot hold both)', { [MD]: swap("if (stands.has(rival)) { stands.delete(rival); closers.get(rival)?.(); yielded = rival; }", "if (stands.has(rival) && !canCoexist()) { stands.delete(rival); closers.get(rival)?.(); yielded = rival; }") }, 'toolsThenTutor');
await mutant('a close by hand is never noted (the store believes the drawer still stands)', { [MD]: swap('  stands.delete(id);\n  if (openDrawer === id)', '  if (openDrawer === id)') }, 'afterManualClose');
await mutant('the width law tests only the most recent opener again (openDrawer === other)', { [MD]: swap('mustClose = stands.has(other) && !canCoexist() ? other : null;', 'mustClose = openDrawer === other && !canCoexist() ? other : null;') }, 'cascadeSeen');
await mutant('an opening drawer is never recorded as standing (the rival can never be found)', { [MD]: swap('  stands.add(id);\n  openDrawer = id;', '  openDrawer = id;') }, 'toolsThenTutor');

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' | ' + String(c.detail).slice(0, 300)));
}
console.log(failed === 0 ? `\nONE-DRAWER VERIFY: PASS (${checks.length} checks)` : `\nONE-DRAWER VERIFY: FAIL - ${failed}/${checks.length}`);
process.exit(failed === 0 ? 0 : 1);
