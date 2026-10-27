// MACHINA STEP - THE BROWSERLESS HALF (TOOLS #9; brief section 3). machina-step.mjs is the DOM half (a box turn). Here, source only: the words, the one-way wiring (Machina alone gets the readout, the keys hint, the cut), and the dress
// rules the brief forbids anything else in (no shadow, no radius, no transition, no animation). Every check has a mutant whose landing is asserted.
//   W   the Machina words  - Note / Block n / m / "{n} of {m} filled" / the keys hint / Agenda     G  the wiring: Walk draws the readout and keys only when handed a readout; the board hands it only under Machina; the step is a cut under Machina
//   D   the dress          - the Machina Step CSS names no shadow (but none), no radius (but 0), no transition / animation (but none), keeps the rail's counter and the carrier on the current notch only
//   O   the other themes   - the canonical words for the new keys are the unchanged defaults (deckFactKind is empty, so the Plans fact stands alone)
//
// Run (repo root, browserless):  node apps/desktop/scripts/harness/machina-step-source.mjs     (MS_REPO=<worktree> to read another checkout)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.env.MS_REPO || join(here, '..', '..', '..', '..'));
const SRC = join(REPO, 'apps', 'desktop', 'src');
const read = (f) => (existsSync(join(SRC, f)) ? readFileSync(join(SRC, f), 'utf8').replace(/\r\n/g, '\n') : '');
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + String(detail).slice(0, 200) : '')); };

const lex = read('store/deskLexicon.ts');
const walk = strip(read('components/Walk.tsx'));
const board = strip(read('components/BoardEditor.tsx'));
const css = read('index.css');
const stepCss = (() => { const a = css.indexOf('/* ---- MACHINA STEP (TOOLS #9'); const b = css.indexOf("[data-theme='machina'] .wz-thumb-fact", a); return a >= 0 && b > a ? css.slice(a, css.indexOf('\n', b)) : ''; })();
const machinaBlock = (() => { const a = lex.indexOf('  machina: {'); return a >= 0 ? lex.slice(a) : ''; })();
const canonical = (() => { const a = lex.indexOf("  deckFact: '{n} of {m} begun'"); return a >= 0 ? lex.slice(a, a + 700) : ''; })();

const wordsOk = (t) => /walkNotes: 'Note'/.test(t) && /walkBlockOf: 'Block \{n\} \/ \{m\}'/.test(t) && /deckFact: '\{n\} of \{m\} filled'/.test(t) && /walkKeysHint: '← → Step · Esc Plan'/.test(t) && /deckFactKind: 'Agenda'/.test(t) && /walkReadoutAgenda: 'Agenda'/.test(t) && /walkReadoutPlan: 'Plan'/.test(t);
const wiringOk = (w, b) => /\{p\.readout && \(\s*<div className="walk-readout">/.test(w) && /\{p\.readout && <span className="walk-keys">/.test(w) && /const reduced = !!p\.still \|\|/.test(w)
  && /readout=\{theme === 'machina' \? machinaReadout : undefined\}/.test(b) && /still=\{theme === 'machina'\}/.test(b) && /if \(theme !== 'machina'\) return undefined;/.test(b);
const dressOk = (c) => c.length > 500 && !/box-shadow:(?!none)/.test(c.replace(/box-shadow:none/g, 'box-shadow:none ')) && !/border-radius:(?!0)/.test(c) && !/transition:(?!none)/.test(c) && !/animation:(?!none)/.test(c) && !/translate|rotate|scale\(/.test(c)
  && /counter-reset:notch/.test(c) && /counter-increment:notch/.test(c) && /\[data-state='current'\]::before[^{]*\{[^}]*background:var\(--choice\)/.test(c) && /data-kindled='true'\]::before\{[^}]*background:var\(--signal-live\)/.test(c);
const otherOk = (t) => /deckFactKind: '',/.test(t) && /walkReadoutAgenda: 'Deck'/.test(t);

ok('W: the Machina words - Note, Block {n} / {m}, "{n} of {m} filled", "← → Step · Esc Plan", the Agenda kind and readout words (the brief\'s lexicon)', wordsOk(machinaBlock), '');
ok('G: the wiring - the Walk draws the readout and the keys hint ONLY when handed a readout, takes the cut when told it is still; the board hands both over ONLY under Machina', wiringOk(walk, board), '');
ok('D: the Machina Step CSS - no shadow, no radius, no transition, no animation, no transform; the rail is counted (01..) and the carrier is the current notch only (kindled = --signal-live)', dressOk(stepCss), `${stepCss.length} chars`);
ok('O: the other themes keep the defaults - the new canonical keys leave the Plans fact alone (deckFactKind is empty) and the readout words are plain', otherOk(canonical.length ? lex : ''), '');

const muts = [
  ['Note reverts to Notes', machinaBlock, (t) => t.replace("walkNotes: 'Note'", "walkNotes: 'Notes'"), wordsOk],
  ['the fact stops saying filled', machinaBlock, (t) => t.replace("'{n} of {m} filled'", "'{n} of {m} begun'"), wordsOk],
  ['the readout is drawn for every theme', walk, (t) => t.replace('{p.readout && (\n            <div className="walk-readout">', '{true && (\n            <div className="walk-readout">'), (t) => wiringOk(t, board)],
  ['the board hands the readout over under every theme', board, (t) => t.replace("readout={theme === 'machina' ? machinaReadout : undefined}", 'readout={machinaReadout}'), (t) => wiringOk(walk, t)],
  ['the step still swipes under Machina', walk, (t) => t.replace('const reduced = !!p.still ||', 'const reduced = false ||'), (t) => wiringOk(t, board)],
  ['the Block gains a drop shadow', stepCss, (t) => t.replace("padding:26px 30px; background:var(--chrome-surface); border:1px solid var(--ink-border-strong); }", "padding:26px 30px; background:var(--chrome-surface); border:1px solid var(--ink-border-strong); box-shadow:0 4px 12px #000; }"), dressOk],
  ['the notch eases', stepCss, (t) => t.replace('[data-theme=\'machina\'] .walk-mark{ position:relative;', '[data-theme=\'machina\'] .walk-mark{ transition:background .2s ease; position:relative;'), dressOk],
  ['the rail loses its numbers', stepCss, (t) => t.replace('counter-increment:notch;', ''), dressOk],
  ['the Plans fact leaks Machina\'s kind word to the others', canonical, (t) => t.replace("deckFactKind: '',", "deckFactKind: 'Agenda',"), (t) => otherOk(t)],
];
for (const [name, text, mutate, pred] of muts) {
  const next = mutate(text);
  ok(`MUTANT: ${name} - its check must go RED (the mutation LANDED: the real source passes)`, next !== text && (pred === otherOk || pred(text) || true) && (() => { try { return pred(text) && !pred(next); } catch { return false; } })(), '');
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nMACHINA-STEP-SOURCE VERIFY: PASS (${checks.length} checks)` : `\nMACHINA-STEP-SOURCE VERIFY: FAIL - ${bad}/${checks.length} failed`);
process.exit(bad === 0 ? 0 : 1);
