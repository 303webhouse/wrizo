// TOOLS #10 ITEM 8 - THE RAIL POP-OUTS USE THE TOOLS STRIP'S SLIDE-AND-FADE - THE BROWSERLESS HALF (docs: polish-10-brief.md item 8). cascade-motion.mjs is the DOM half (a box turn). Source only here:
//   M  the motion is the Tools strip's own tokens - --drawer-dur / --drawer-ease, the short --drawer-dur-reduced fade under reduced motion - never a second set of numbers
//   X  closing is an EXIT, not a vanish: Cascade.tsx keeps the layers drawn for the exit (data-leaving), inert, for the token's own length, and `state` (the announcements, Escape) is untouched
//   S  it is overlay-only: no layout property animates (no width / height / margin in the new rules), and the dock's own collapse rule still wins after the entry (backwards fill, not forwards)
// Every check has a mutant whose landing is asserted.
//
// Run (repo root, browserless):  node apps/desktop/scripts/harness/cascade-motion-source.mjs     (CM_REPO=<worktree> to read another checkout)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.env.CM_REPO || join(here, '..', '..', '..', '..'));
const SRC = join(REPO, 'apps', 'desktop', 'src');
const read = (f) => (existsSync(join(SRC, f)) ? readFileSync(join(SRC, f), 'utf8').replace(/\r\n/g, '\n') : '');
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + String(detail).slice(0, 200) : '')); };

const css = read('index.css');
const rules = (() => { const a = css.indexOf('/* TOOLS #10 item 8 - the rail pop-outs'); const b = css.indexOf('.wz-cascade-panel-head{', a); return a >= 0 && b > a ? css.slice(a, b) : ''; })();
const cascade = strip(read('components/Cascade.tsx'));
const escExit = strip(read('store/escapeExit.ts'));
const menusDrawers = strip(read('store/menusDrawers.ts'));

const motionOk = (c) => /\.wz-cascade-panel, \.wz-cascade-survey\{ animation:wz-cascade-in var\(--drawer-dur\) var\(--drawer-ease\) backwards; \}/.test(c)
  && /\[data-leaving='true'\][^{]*\{ animation:wz-cascade-out var\(--drawer-dur\) var\(--drawer-ease\) forwards; pointer-events:none; \}/.test(c)
  && /@media \(prefers-reduced-motion:reduce\)\{[^@]*animation-name:wz-cascade-fade-in; animation-duration:var\(--drawer-dur-reduced\);[^}]*\}\s*\.wz-cascade-panel\[data-leaving='true'\][^{]*\{ animation-name:wz-cascade-fade-out; animation-duration:var\(--drawer-dur-reduced\);/.test(c)
  && /@keyframes wz-cascade-in\{ from\{ opacity:0; transform:translateX\(-28px\); \} to\{ opacity:1; transform:none; \} \}/.test(c) && /@keyframes wz-cascade-out/.test(c);
const exitOk = (t) => /const lastOpen = useRef<CascadeState \| null>\(null\);/.test(t) && /if \(state\.category !== null\) lastOpen\.current = state;/.test(t)
  && /setTimeout\(\(\) => \{ setLeaving\(null\); lastOpen\.current = null; \}, cascadeExitMs\(\)\)/.test(t) && /const view = state\.category !== null \? state : leaving;/.test(t)
  && /data-leaving=\{isLeaving \? 'true' : undefined\}/.test(t) && /getPropertyValue\(reduced \? '--drawer-dur-reduced' : '--drawer-dur'\)/.test(t)
  && /if \(cascadeOccupiesBand\) requestOpen\('cascade'\);/.test(t);   // the announcements still read the real state
const overlayOk = (c) => !/(width|height|margin|padding|top|left)\s*:/.test(c.replace(/animation[^;{}]*;/g, '').replace(/@keyframes[^{]*\{[\s\S]*?\}\s*\}/g, '')) && !/(forwards|both)[^}]*wz-cascade-in/.test(c) && /wz-cascade-in var\(--drawer-dur\) var\(--drawer-ease\) backwards/.test(c);

// L - an EXITING pop-out is not an open one: the Esc-exit (store/escapeExit.ts waits to see whether the popup closed on the Esc) and the two-drawer band measure (store/menusDrawers.ts) must not count it. Found by escexit.mjs S3, which went red:
//     the panel was still drawn 60 ms after Esc, the Esc was read as "not the popup's", and it also left the writing surface.
const leavingOk = (e, m) => /'\.wz-cascade-panel:not\(\[data-leaving\]\)'/.test(e) && /measuredWidth\('\.wz-cascade-panel\[data-visible="true"\]:not\(\[data-leaving\]\)'/.test(m);
ok('L: an EXITING pop-out is not an open one - the Esc-exit popup list and the two-drawer band measure both skip [data-leaving] (escexit S3 found the Esc leaving the page when they did not)', leavingOk(escExit, menusDrawers), '');
ok('M: the pop-outs and their surveys slide out from the rail AND fade in on the Tools strip\'s own tokens (--drawer-dur / --drawer-ease), slide back and fade out on close, and take only the short fade under reduced motion', motionOk(rules), `${rules.length} chars`);
ok('X: closing is an exit - the layers stay drawn (data-leaving, inert) for the token\'s own length, read from --drawer-dur / --drawer-dur-reduced, while `state` (the two-drawer announcements, Escape) is untouched', exitOk(cascade), '');
ok('S: overlay only - no layout property is declared in the new rules, and the entry fills backwards (the dock\'s own collapse rule governs after it)', overlayOk(rules), '');

const muts = [
  ['the slide uses its own literal duration', rules, (t) => t.replace('wz-cascade-in var(--drawer-dur) var(--drawer-ease) backwards', 'wz-cascade-in 400ms ease backwards'), motionOk],
  ['reduced motion keeps the slide', rules, (t) => t.replace('animation-name:wz-cascade-fade-in;', ''), motionOk],
  ['closing vanishes (no exit timer)', cascade, (t) => t.replace('}, cascadeExitMs());', '}, 0);'), exitOk],
  ['the layers are drawn from the live state only (no lag on close)', cascade, (t) => t.replace('const view = state.category !== null ? state : leaving;', 'const view = state;'), exitOk],
  ['the announcements move off the real state', cascade, (t) => t.replace("if (cascadeOccupiesBand) requestOpen('cascade');", "if (view_ok) requestOpen('cascade');"), exitOk],
  ['the entry fills forwards (it would pin the opacity over the dock collapse)', rules, (t) => t.replace('wz-cascade-in var(--drawer-dur) var(--drawer-ease) backwards', 'wz-cascade-in var(--drawer-dur) var(--drawer-ease) forwards'), overlayOk],
  ['the slide animates the width', rules, (t) => t.replace('.wz-cascade-panel[data-leaving=\'true\'], .wz-cascade-panel[data-leaving=\'true\'] ~ .wz-cascade-survey{ animation:wz-cascade-out', '.wz-cascade-panel{ width:10px; } .wz-cascade-panel[data-leaving=\'true\'], .wz-cascade-panel[data-leaving=\'true\'] ~ .wz-cascade-survey{ animation:wz-cascade-out'), overlayOk],
  ['the Esc-exit counts the exiting panel again', escExit, (t) => t.replace("'.wz-cascade-panel:not([data-leaving])'", "'.wz-cascade-panel'"), (t) => leavingOk(t, menusDrawers)],
  ['the band measure counts the exiting panel again', menusDrawers, (t) => t.replace(':not([data-leaving])', ''), (t) => leavingOk(escExit, t)],
];
for (const [name, text, mutate, pred] of muts) {
  const next = mutate(text);
  ok(`MUTANT: ${name} - its check must go RED (the mutation LANDED: the real source passes)`, next !== text && pred(text) && !pred(next), '');
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nCASCADE-MOTION-SOURCE VERIFY: PASS (${checks.length} checks)` : `\nCASCADE-MOTION-SOURCE VERIFY: FAIL - ${bad}/${checks.length} failed`);
process.exit(bad === 0 ? 0 : 1);
