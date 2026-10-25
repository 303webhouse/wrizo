// MACHINA FORMS - THE LOGIC HALF (browserless; Fable's brief Oct 24, Downloads\machina-guided-build-brief.md §1; frames m7 / m8 of Downloads\machina-guided-mockups.zip).
// WRITTEN BEFORE THE BUILD (red until src/decks/formCounts.ts and the Forms order exist). The Forms panel is the deck library in Machina's dress; its data is two things the REAL registry already knows:
//   COUNTS  the block count at the right of each row - a RANGE where the deal question changes it (6-9, 5-7...) - computed from the deck's own deal(), not typed in. The oracle here is the MOCKUP's own column.
//   ORDER   the groups (FICTION - WORLD - SCREEN - ACADEMIC - BUSINESS - NEWSROOM - YOUR FILES) and the order of the rows inside them, as the mockup draws them.
// The module's contract (src/decks/formCounts.ts):  export function blockRangeLabel(deck: DeckDefinition): string   ("8", "6–9", "" for a deck that deals one block per picked page)
//                                                    export const FORMS_GROUPS: readonly { group: string; room: DeckRoom; decks: readonly string[] }[]    the Machina groups, in order, each with its deck ids in order
// Run (repo root):  node apps/desktop/scripts/harness/machina-forms-logic.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.env.MF_REPO || join(here, '..', '..', '..', '..'));
const DESKTOP = join(REPO, 'apps', 'desktop');
const SRC = join(DESKTOP, 'src');
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + String(detail).slice(0, 240) : '')); };

// ---- the ORACLE: the mockup's own Forms list (m7 / m8) - group, then name -> the count column as drawn
const MOCK = [
  ['FICTION', [['three-act', '6–9'], ['hero-journey', '8–12'], ['story-circle', '8'], ['character-study', '2–4 ×'], ['scene-sequel', '6–30']]],
  ['WORLD', [['worldbuilding', '7']]],
  ['SCREEN', [['feature-screenplay', '15']]],
  ['ACADEMIC', [['thesis', '9'], ['argument-essay', '5–7'], ['research-paper', '5']]],
  ['BUSINESS', [['grant', '6'], ['business-proposal', '7']]],
  ['NEWSROOM', [['feature-story', null]]],     // below the mockup's fold: its count is not drawn - the module's own figure is checked for sanity only
  ['YOUR FILES', [['from-my-pages', '']]],     // one block per picked page: no count
];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const pnpmDir = join(REPO, 'node_modules', '.pnpm');
const esb = join(pnpmDir, readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)), 'node_modules', 'esbuild', 'bin', 'esbuild');
const tmps = [];
async function load(entryText) {
  mkdirSync(join(DESKTOP, 'node_modules', '.cache'), { recursive: true });
  const tmp = mkdtempSync(join(DESKTOP, 'node_modules', '.cache', 'wz-mf-')); tmps.push(tmp);
  const entry = join(tmp, 'entry.ts');
  (await import('node:fs')).writeFileSync(entry, entryText);
  const out = join(tmp, 'bundle.mjs');
  execFileSync(process.execPath, [esb, entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`, '--log-level=error', '--external:@fontsource/*', '--external:@fontsource-variable/*',
    '--define:import.meta.env.DEV=false', '--define:import.meta.env.PROD=true'], { stdio: 'pipe', cwd: DESKTOP });
  globalThis.window = globalThis; globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() {}, removeItem() {} };
  return import(pathToFileURL(out).href + `?t=${Date.now()}`);
}
const SRCP = SRC.replace(/\\/g, '/');
const modulePath = join(SRC, 'decks', 'formCounts.ts');
let m = null, err = '';
if (existsSync(modulePath)) { try { m = await load(`export * from '${SRCP}/decks/formCounts'; export { DECKS } from '${SRCP}/decks/library';`); } catch (e) { err = String(e.message || e).split('\n')[0]; } } else err = 'src/decks/formCounts.ts does not exist (red, as written)';
ok('(premise) src/decks/formCounts.ts exists and bundles with the real registry', !!m, err);

const byId = (id) => (m && m.DECKS ? m.DECKS.find((d) => d.id === id) : null);
// C1 - the counts column, row by row, against the mockup
for (const [, rows] of MOCK) for (const [id, want] of rows) {
  if (want === null) continue;
  const d = byId(id);
  const got = m && d ? m.blockRangeLabel(d) : null;
  ok(`C1: ${id} reads "${want}" in the count column (the mockup's own figure, computed here from the deck's deal())`, got === want, String(got));
}
{
  const d = byId('feature-story'); const got = m && d ? m.blockRangeLabel(d) : null;
  ok('C1: Feature Story (below the mockup\'s fold) reads a real count computed from its deal (a number or a range, never empty)', typeof got === 'string' && /^\d+(–\d+)?$/.test(got), String(got));
}
// C2 - the groups and their order
{
  const g = m ? m.FORMS_GROUPS : null;
  ok('C2: the groups are FICTION · WORLD · SCREEN · ACADEMIC · BUSINESS · NEWSROOM · YOUR FILES, in that order', !!g && same(g.map((x) => x.group), MOCK.map(([name]) => name)), JSON.stringify(g && g.map((x) => x.group)));
  ok('C2: the rows inside each group are in the mockup\'s order', !!g && MOCK.every(([name, rows]) => { const x = g.find((y) => y.group === name); return !!x && same(x.decks, rows.map(([id]) => id)); }), JSON.stringify(g && g.map((x) => x.decks)));
  const all = g ? g.flatMap((x) => x.decks) : [];
  const registry = m && m.DECKS ? m.DECKS.map((d) => d.id) : [];
  ok('C2: EVERY registered deck is listed exactly once (nothing the library knows is left out, nothing is listed twice, nothing is invented)', registry.length === 14 && all.length === registry.length && new Set(all).size === all.length && registry.every((id) => all.includes(id)), JSON.stringify({ missing: registry.filter((id) => !all.includes(id)), extra: all.filter((id) => !registry.includes(id)) }));
  ok('C2: each group maps onto the registry\'s own room of its decks (the rooms are Machina\'s group labels\' source: fiction, speculative, screen, academy, business, newsroom, every)', !!g && g.every((x) => x.decks.every((id) => { const d = byId(id); return !!d && d.room === x.room; })), JSON.stringify(g && g.map((x) => x.room)));
}
// C3 - Machina's WORD for pages is FILES (train #7 red 6, Oct 25): every string the From-my-pages row and its question and the librarian's pick can say under Machina says "files", never "pages" - the canonical
// Arbor words fall through to Machina where no override exists, and Forms now draws them (the YOUR FILES row). Written red first: Machina overrides none of these six before this fix.
{
  let lex = null, lexErr = '';
  try { lex = await load(`export { deskTerm } from '${SRCP}/store/deskLexicon';`); } catch (e) { lexErr = String(e.message || e).split('\n')[0]; }
  ok('(premise) the real lexicon bundles', !!lex && typeof lex.deskTerm === 'function', lexErr);
  const IDS = ['deckNameFromMyPages', 'deckFromMyPagesQPrompt', 'deckFromMyPagesNone', 'helpWhyFromMyPages', 'helpCoverFromMyPages'];
  for (const id of IDS) {
    const w = lex ? lex.deskTerm(id, 'machina') : '';
    ok(`C3: Machina's ${id} says "files" and not "pages" ("${w}")`, !!w && /\bfiles?\b/i.test(w) && !/\bpages?\b/i.test(w), w);
  }
  const canon = lex ? lex.deskTerm('deckNameFromMyPages', 'plateau') : '';
  ok('C3 control: Arbor keeps "pages" (the canonical word is untouched - the override is Machina\'s alone)', /pages/.test(canon), canon);
}
for (const t of tmps) rmSync(t, { recursive: true, force: true });
const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nMACHINA-FORMS-LOGIC VERIFY: PASS (${checks.length} checks)` : `\nMACHINA-FORMS-LOGIC VERIFY: FAIL - ${bad}/${checks.length} failed`);
process.exit(bad === 0 ? 0 : 1);
