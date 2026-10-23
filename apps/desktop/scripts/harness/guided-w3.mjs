// W3 / W11a - GUIDED PATHS, wave 1 (Fable's build brief Oct 23: docs/guided-paths/w3-w4-build-brief.md; content: docs/guided-paths/w3-deck-content.md; frames: board-kinds-final 06 / 08 / 09).
// A dealt Tier 1 step is a QUESTION, not text: the card's body is EMPTY, the question rides as `prompt`, `deckStep` names the step; the question shows as a placeholder while the card has no
// body; a "?" at the title's end opens one sentence + one example + "more -> Tutor" (which STAGES an ask, never sends). Six new Tier 1 decks, the Fifteen Beats' Novel answer, Feature Story's
// (1)/(2) titles, and the empty board's starter row says Presets.
//
// SCHEMA CHANGE: NONE. Two optional additive fields inside the board's own `boxes` jsonb (Box.prompt, Box.deckStep - the fontFace / seq / onCanvas precedent), written only by a NEW deal.
//
//   PART 1 (browserless; this file)  the real modules bundled with esbuild against a fake browser + the real sources and stylesheet read as text:
//     DC  deal         every deck x every answer deals EMPTY bodies, each card with a prompt and a deckStep whose content exists; the doc <-> content.ts census (every question / "?" / example, byte-equal
//                      to the Wrizors' doc); variants (Worldbuilding, Grant, Feature Story, the Fifteen Beats' step 8); titles equal the doc's (the (1)/(2) ruling); counts and drops per answer
//     LY  layout       no two dealt cards overlap, all on the page; the Story Circle is a ring threaded closed
//     BX  box          the engine writes the two fields only when a spec carries them; promptToShow's rules (empty body only, text cards only, never a ported mirror); kindled
//     NT  not text     NOTHING reads `.prompt` outside a short allow-list (so it is never exported, copied, counted, synced as body or read by the Tutor as the writer's words); the copy whitelist omits it
//     SH  the "?"      the popover is a portal anchored at the "?", focus moves in, Esc returns focus to the "?", "more" stages without sending (no api import, no fetch), the pointer machine stands down
//     ST  staging      stageTutorAsk dispatches one event carrying the ask; the Tutor's listener stages (composer text, caret) and never sends
//     WD  words        Arbor "?" / "more" / "The Tutor"; Flux "[?]" / "MORE" / "The Operator"; no Arbor noun in a Flux deck string; no "Templates" on the board's starter row
//     CS  stylesheet   the placeholder is a pseudo-element of data-prompt (never text); olive on Arbor at >= 4.5:1 (not the frame's 2.9:1 #8f9a58), the readout line on Flux; brass only on hover / open
//   Every check has a mutant, its landing asserted. PART 2 (guided-w3-part2.mjs, a box turn) is the live app: pseudo-element content, first keystroke, the "?" at the title's end, the anchored
//   popover, Esc focus, "more" staging, no leak into export / copy / count.
//
// Run: node scripts/harness/guided-w3.mjs   (from apps/desktop; browserless)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const DOC = path.resolve(DESKTOP, '..', '..', 'docs', 'guided-paths', 'w3-deck-content.md');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const readRaw = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- the real modules, bundled against a fake browser ----------------------------------------------------------------------------------------------------------------------------
let nonce = 0;
async function load(over0 = {}) {
  nonce += 1;
  // graftsOf is stubbed in every bundle (kindled reads it; the real one walks persisted entries): globalThis.__GRAFTS is the fixture the check sets
  const over = { 'store/grafts.ts': () => 'export function graftsOf() { return globalThis.__GRAFTS; }', ...over0 };
  const lines = [
    `export const __n = ${nonce};`,
    "export { deskTerm } from './store/deskLexicon';",
    "export { DECKS } from './decks/library';",
    "export { materializeDeck } from './decks/engine';",
    "export * from './decks/content';",
    "export * from './store/guided';",
    "export { stageTutorAsk, TUTOR_STAGE_EVENT } from './store/tutorStage';",
    "export { createJournalPage } from './store/persistence';",
  ];
  const res = await build({
    stdin: { contents: lines.join('\n'), resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', nodePaths: [path.join(DESKTOP, 'node_modules')],
    external: ['@fontsource/*', '@fontsource-variable/*'],
    plugins: [{ name: 'ov', setup(b) { b.onLoad({ filter: /\.ts$/ }, (args) => {
      const rel = path.relative(SRC, args.path).split('\\').join('/');
      const text = noCR(fs.readFileSync(args.path, 'utf8'));
      return { contents: over[rel] ? over[rel](text) : text, loader: 'ts' };
    }); } }],
  });
  const map = new Map();
  const sent = [];
  globalThis.__sent = sent;
  globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } };
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent(e) { sent.push(e); return true; }, matchMedia: () => ({ matches: false }) };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  const M = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
  return { M, sent };
}
async function tryLoad(over) { try { return await load(over); } catch (e) { return { err: String((e && e.message) || e).split('\n')[0].slice(0, 220) }; } }

// ---- the Wrizors' doc, parsed independently of the generator that wrote content.ts ------------------------------------------------------------------------------------------------------
const SECTIONS = {
  '1.1': ['three-act', ['hook', 'inciting', 'threshold', 'complications', 'midpoint', 'darkest', 'climax', 'resolution', 'final-image']],
  '1.2': ['feature-screenplay', ['opening-image', 'theme-stated', 'set-up', 'catalyst', 'debate', 'break-into-two', 'b-story', 'fun-and-games', 'midpoint', 'bad-guys', 'all-is-lost', 'dark-night', 'break-into-three', 'finale', 'final-image']],
  '1.3': ['character-study', ['want-need', 'wound', 'contradiction', 'voice', 'relationship']],
  '1.4': ['worldbuilding', ['rules', 'history', 'places', 'cultures', 'power', 'language', 'iceberg']],
  '1.5': ['thesis', ['question', 'methodology', 'lit-review', 'evidence', 'citation', 'chapter-one', 'chapter-two', 'chapter-three', 'conclusion', 'introduction', 'methods', 'results', 'discussion']],
  '1.6': ['grant', ['need', 'objectives', 'methods', 'evaluation', 'budget', 'alignment']],
  '1.7': ['feature-story', ['nut-graf', 'lede-a', 'lede-b', 'lede-c', 'source-1', 'source-2', 'scene-1', 'scene-2', 'kicker-a', 'kicker-b']],
  '2.1': ['hero-journey', ['ordinary-world', 'call', 'refusal', 'mentor', 'threshold', 'tests', 'approach', 'ordeal', 'reward', 'road-back', 'resurrection', 'return']],
  '2.2': ['story-circle', ['you', 'need', 'go', 'search', 'find', 'take', 'return', 'change']],
  '2.3': ['scene-sequel', ['goal', 'conflict', 'disaster', 'reaction', 'dilemma', 'decision']],
  '2.4': ['argument-essay', ['claim', 'counterclaim', 'evidence-1', 'evidence-2', 'evidence-3', 'synthesis', 'so-what']],
  '2.5': ['research-paper', ['introduction', 'methods', 'results', 'discussion', 'abstract']],
  '2.6': ['business-proposal', ['problem', 'solution', 'market', 'ask', 'timeline', 'budget', 'objections']],
  '2.7': ['from-my-pages', ['page', 'gaps']],
};
function parseDoc() {
  const md = noCR(fs.readFileSync(DOC, 'utf8'));
  const out = {}; let cur = null; let ix = 0;
  for (const line of md.split('\n')) {
    const h = /^### (\d\.\d) /.exec(line);
    if (h) { cur = SECTIONS[h[1]] ? h[1] : null; ix = 0; continue; }
    if (/^## /.test(line)) { cur = null; continue; }
    if (!cur || !line.startsWith('|')) continue;
    const c = line.split('|').slice(1, -1).map((x) => x.trim());
    if (c.length < 5 || c[0] === '#' || c[1] === 'Title' || /^-+$/.test(c[0])) continue;
    const [deck, ids] = SECTIONS[cur];
    const id = ids[ix++];
    let q = c[2];
    if (/ \*\(/.test(q)) { const v = {}; for (const part of q.split(' \u00b7 ')) { const m = /^(.*?)\s*\*\((.+?)\)\*$/.exec(part.trim()); v[m[2] === 'science fiction' ? 'sf' : m[2]] = m[1]; } q = v; }
    (out[deck] = out[deck] || {})[id] = { title: c[1], q, e: c[3], x: c[4] };
  }
  return out;
}

// ---- helpers over the real decks -----------------------------------------------------------------------------------------------------------------------------------------------------
const combos = (deck) => deck.questions.reduce((acc, q) => acc.flatMap((a) => (q.kind === 'pages' ? [{ ...a, [q.id]: 'pg-a,pg-b,pg-c' }] : q.options.map((o) => ({ ...a, [q.id]: o.id })))), [{}]);
const rectsOverlap = (a, b) => a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9;
const sentences = (s) => (s.match(/[.!?]["\u201d\u2019)]?(?=\s+[A-Z"\u201c(]|$)/g) || []).length;
const NEW_DECKS = ['hero-journey', 'story-circle', 'scene-sequel', 'argument-essay', 'research-paper', 'business-proposal'];
const FORBID = /\b(boards?|pages?|links?|grafts?|grafted|shelf|schematics?|drawers?|journals?|settings|themes?|tutor|sections?|binder)\b/i;
const KEEP_FLUX = {   // the live decks' own pre-existing strings the Flux census already reviewed (flux-v2.mjs KEEP) - not part of W3
  deckWorldbuildingHistoryBody: 1, deckScreenplayThemeStatedTitle: 1, deckScreenplayBStoryBody: 1,
};

// ---- the suite: every check, over a loaded bundle and a source reader (so a mutant can reach both) --------------------------------------------------------------------------------------
function suite(M, read, doc) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  const decks = M.DECKS;
  const byId = Object.fromEntries(decks.map((d) => [d.id, d]));
  const deal = (id, answers) => M.materializeDeck(byId[id], answers, []);
  const cardsOf = (id, answers) => deal(id, answers).boxes.filter((b) => b.kind === 'text');

  // DC1 - every deck x every answer: empty bodies, a prompt, a deckStep that names real content
  const bad = [];
  let dealt = 0;
  for (const d of decks) for (const a of combos(d)) for (const b of cardsOf(d.id, a)) {
    dealt += 1;
    const nl = (b.text || '').indexOf('\n');
    const body = nl < 0 ? '' : b.text.slice(nl + 1);
    const content = b.deckStep && M.DECK_CONTENT[b.deckStep.deck] && M.DECK_CONTENT[b.deckStep.deck][b.deckStep.step];
    if (body !== '' || !b.prompt || !b.deckStep || b.deckStep.deck !== d.id || !content) bad.push(`${d.id} ${JSON.stringify(a)} ${(b.text || '').split('\n')[0]}`);
  }
  keep('DC1', dealt > 150 && bad.length === 0, bad.slice(0, 3).join(' | ') || `${dealt} cards dealt across every deck and answer`);

  // DC2 - the census over the doc: every step has a question, a "?" sentence and an example, and content.ts equals the doc byte for byte (including variants)
  const missing = []; let steps = 0;
  for (const [deck, rows] of Object.entries(doc)) for (const [id, row] of Object.entries(rows)) {
    steps += 1;
    const got = M.DECK_CONTENT[deck] && M.DECK_CONTENT[deck][id];
    const wantQ = deck === 'feature-screenplay' && id === 'fun-and-games' ? got && got.q : row.q;   // the one softening the doc names is checked separately (DC5)
    if (!got || !same(got.q, wantQ) || got.e !== row.e || got.x !== row.x || !got.e || !got.x || !got.q) missing.push(`${deck}.${id}`);
  }
  keep('DC2', steps === 112 && missing.length === 0, missing.slice(0, 4).join(', ') || `${steps} steps equal the doc`);

  // DC3 - the doc's word diet: a question is one question; a "?" sentence is one sentence; an example is two sentences or fewer
  const diet = [];
  for (const [deck, rows] of Object.entries(M.DECK_CONTENT)) for (const [id, c] of Object.entries(rows)) {
    for (const qq of typeof c.q === 'string' ? [c.q] : Object.values(c.q)) if (!qq.endsWith('?') || (qq.match(/\?/g) || []).length !== 1) diet.push(`${deck}.${id} q`);
    if (sentences(c.e) !== 1) diet.push(`${deck}.${id} e (${sentences(c.e)})`);
    if (sentences(c.x) > 2 || sentences(c.x) < 1) diet.push(`${deck}.${id} x (${sentences(c.x)})`);
  }
  keep('DC3', diet.length === 0, diet.slice(0, 4).join(', '));

  // DC4 - every content step of every deck is dealt under some answer, and every dealt step has content (the two directions of the census)
  const gaps = [];
  for (const d of decks) {
    const dealtSteps = new Set(); for (const a of combos(d)) for (const b of cardsOf(d.id, a)) if (b.deckStep) dealtSteps.add(b.deckStep.step);
    for (const id of Object.keys(M.DECK_CONTENT[d.id] || {})) if (!dealtSteps.has(id) && !(d.id === 'from-my-pages' && id === 'gaps')) gaps.push(`${d.id}.${id} never dealt`);   // the doc's 'gaps' row is the local Gaps readout (W5): content for its "?", not a card
    for (const id of dealtSteps) if (!(M.DECK_CONTENT[d.id] || {})[id]) gaps.push(`${d.id}.${id} no content`);
  }
  keep('DC4', decks.length === 14 && gaps.length === 0, gaps.slice(0, 4).join(', ') || `${decks.length} decks`);

  // DC5 - the question varies where the doc says it does
  const q = (id, a, step) => (cardsOf(id, a).find((b) => b.deckStep && b.deckStep.step === step) || {}).prompt;
  const rulesQ = ['fantasy', 'sf', 'other'].map((g) => q('worldbuilding', { genre: g }, 'rules'));
  const align = ['foundation', 'government', 'corporate'].map((g) => q('grant', { funder: g }, 'alignment'));
  const nut = ['profile', 'trend', 'investigative'].map((g) => q('feature-story', { kind: g }, 'nut-graf'));
  const fun = ['feature', 'pilot', 'novel'].map((g) => q('feature-screenplay', { form: g }, 'fun-and-games'));
  const distinct = (xs) => new Set(xs).size === xs.length && xs.every(Boolean);
  keep('DC5', distinct(rulesQ) && distinct(align) && distinct(nut) && fun[0] === fun[1] && fun[0] !== fun[2] && !/trailer/.test(fun[2]) && /trailer/.test(fun[0]),
    JSON.stringify({ rules: distinct(rulesQ), align: distinct(align), nut: distinct(nut), fun }));

  // DC6 - the titles the cards wear equal the doc's (the (1)/(2) ruling included; a composed title keeps the doc's name after its "Character A: " / "Scene 2: " prefix)
  const wrong = [];
  for (const d of decks.filter((x) => x.id !== 'from-my-pages')) {   // (From my pages' card titles are the writer's own pages' - FM1)
    for (const a of combos(d)) for (const b of cardsOf(d.id, a).filter((x) => x.deckStep)) {   // a card with no deckStep is DC1's finding, not a crash here
      const t = (b.text || '').split('\n')[0];
      const want = doc[d.id] && doc[d.id][b.deckStep.step] && doc[d.id][b.deckStep.step].title;
      const bare = d.id === 'character-study' ? (b.deckStep.step === 'relationship' ? t.replace(/: [A-D] \u2194 [A-D]$/, '') : t.replace(/^Character [A-D]: /, '')) : d.id === 'scene-sequel' ? t.replace(/^Scene \d+: /, '') : t;
      if (want !== undefined && bare !== want) wrong.push(`${d.id}.${b.deckStep.step}: "${bare}" (doc: "${want}")`);
    }
  }
  keep('DC6', wrong.length === 0, [...new Set(wrong)].slice(0, 3).join(' | '));

  // DC7 - counts and drops per answer (the doc's own numbers)
  const names = (id, a) => cardsOf(id, a).map((b) => (b.deckStep || {}).step);
  const hero = names('hero-journey', { format: 'novel' }), heroS = names('hero-journey', { format: 'short-story' });
  const arg = names('argument-essay', { length: 'full' }), argS = names('argument-essay', { length: 'short' });
  const counts = {
    hero: hero.length === 12 && heroS.length === 8 && ['refusal', 'approach', 'reward', 'road-back'].every((s) => hero.includes(s) && !heroS.includes(s)),
    circle: cardsOf('story-circle', {}).length === 8,
    scene: [1, 3, 5].every((n, i) => cardsOf('scene-sequel', { count: ['one', 'three', 'five'][i] }).length === n * 6),
    arg: arg.length === 7 && argS.length === 5 && ['counterclaim', 'evidence-3'].every((s) => arg.includes(s) && !argS.includes(s)),
    paper: cardsOf('research-paper', {}).length === 5 && names('research-paper', {}).at(-1) === 'abstract',
    proposal: cardsOf('business-proposal', {}).length === 7,
    beats: ['feature', 'pilot', 'novel'].every((f) => cardsOf('feature-screenplay', { form: f }).length === 15),
    threeAct: [9, 8, 6].every((n, i) => cardsOf('three-act', { format: ['novel', 'novella', 'short-story'][i] }).length === n),
  };
  keep('DC7', Object.values(counts).every(Boolean), JSON.stringify(counts));

  // DC8 - the Fifteen Beats deal the same fifteen cards in the same places for all three answers (a Novel answer only softens step 8's words)
  const geo = (f) => cardsOf('feature-screenplay', { form: f }).map((b) => [(b.deckStep || {}).step, b.x, b.y, b.w, b.h, (b.text || '').split('\n')[0]]);
  keep('DC8', same(geo('feature'), geo('novel')) && same(geo('feature'), geo('pilot')), 'the Novel answer changed more than a question');

  // LY1 - no two dealt cards overlap and every card sits on the page, in every deck and answer; LY2 - the Story Circle is a ring of eight threaded closed
  const clash = [];
  for (const d of decks) for (const a of combos(d)) {
    const cs = cardsOf(d.id, a);
    for (let i = 0; i < cs.length; i++) {
      if (cs[i].x < 0 || cs[i].y < 0 || cs[i].x + cs[i].w > 1.0001 || cs[i].y + cs[i].h > 0.95) clash.push(`${d.id} off-page ${(cs[i].text || '').split('\n')[0]}`);
      for (let j = i + 1; j < cs.length; j++) if (rectsOverlap(cs[i], cs[j])) clash.push(`${d.id} ${JSON.stringify(a)} overlap`);
    }
  }
  keep('LY1', clash.length === 0, [...new Set(clash)].slice(0, 3).join(' | '));
  const ring = deal('story-circle', {});
  const threads = ring.boxes.filter((b) => b.kind === 'connection');
  const cs = ring.boxes.filter((b) => b.kind === 'text');
  const degree = (id) => threads.filter((t) => t.connA === id || t.connB === id).length;
  keep('LY2', cs.length === 8 && threads.length === 8 && cs.every((c) => degree(c.id) === 2), `${cs.length} cards, ${threads.length} threads`);

  // BX1 - the engine writes the two fields only when a spec carries them: a guided deal's cards have both; its threads neither; a spec without them deals byte-identically to before W3
  const guidedCards = deal('three-act', { format: 'novel' }).boxes;
  const plain = M.materializeDeck({ id: 'x', room: 'fiction', nameTerm: 'deckNameThreeAct', questions: [], deal: () => [{ key: 'a', title: 'T', body: 'B', x: 0.1, y: 0.1, w: 0.2, h: 0.1 }] }, {}, []).boxes[0];
  const ring2 = ring.boxes.filter((b) => b.kind === 'connection');
  keep('BX1', guidedCards.every((b) => b.prompt && b.deckStep && b.text.endsWith('\n')) && ring2.every((b) => !('prompt' in b) && !('deckStep' in b)) && !('prompt' in plain) && !('deckStep' in plain) && plain.text === 'T\nB',
    JSON.stringify(Object.keys(plain)));

  // BX2 - promptToShow: only a text card with a prompt, no body, not a ported mirror; the writer's words (even one) hide it, whitespace does not; delete the words and it returns
  const P = (b) => M.promptToShow({ kind: 'text', prompt: 'Q?', ...b });
  keep('BX2', P({ text: 'Hook\n' }) === 'Q?' && P({ text: 'Hook' }) === 'Q?' && P({ text: 'Hook\n   \n' }) === 'Q?' && P({ text: 'Hook\nA' }) === null && P({ text: 'Hook\n\nA' }) === null
    && P({ text: 'Hook\n', sourceEntryId: 'e1' }) === null && P({ text: 'Hook\n', kind: 'ink' }) === null && P({ text: 'Hook\n', prompt: undefined }) === null && P({ text: 'Hook\nA' }) === null && P({ text: 'Hook\n' }) === 'Q?',
    'promptToShow rules');

  // BX3 - kindled: the body has the writer's words OR the card has a graft to a page (Pages / Sources / Boards); a graft to another CARD does not count
  const withGrafts = (g) => { globalThis.__GRAFTS = { Cards: [], Sources: [], Boards: [], Pages: [], sharedTags: [], ...g }; };
  withGrafts({});
  const k0 = M.kindled('b1', { id: 'c1', text: 'Hook\n' });
  const k1 = M.kindled('b1', { id: 'c1', text: 'Hook\nShe waits.' });
  withGrafts({ Pages: [{}] }); const k2 = M.kindled('b1', { id: 'c1', text: 'Hook\n' });
  withGrafts({ Cards: [{}] }); const k3 = M.kindled('b1', { id: 'c1', text: 'Hook\n' });
  withGrafts({ Sources: [{}] }); const k4 = M.kindled('b1', { id: 'c1', text: 'Hook\n' });
  keep('BX3', /graftsOf\(\{ entryId: boardId, boxId: box\.id \}, boxes\)/.test(read('store/guided.ts')) && k0 === false && k1 === true && k2 === true && k3 === false && k4 === true, JSON.stringify([k0, k1, k2, k3, k4]));

  // NT1 - THE PLACEHOLDER IS NEVER THE WRITER'S WORDS: the question lives in `prompt` (never in `text`), and no module outside a short allow-list reads `.prompt` - every reader of the writer's words
  // (export, copy, the word count, the Tutor's page text, sync) reads `text`. An allow-list that grows is a decision, made here.
  const ALLOW = new Set(['components/BoardEditor.tsx', 'store/guided.ts', 'decks/engine.ts', 'decks/guided.ts', 'decks/types.ts', 'types/index.ts']);
  const walk = (dir) => fs.readdirSync(path.join(SRC, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name).split('\\').join('/')]));
  const readers = walk('.').filter((f) => /\.(ts|tsx)$/.test(f) && !ALLOW.has(f)).filter((f) => /\b(?:box|b|card|popupBox|x|c)\??\.prompt\b/.test(read(f)));
  const textHasPrompt = guidedCards.every((b) => !b.text.includes(b.prompt));
  keep('NT1', readers.length === 0 && textHasPrompt, readers.join(', ') || 'no stray reader');
  // NT2 - a copy carries nothing by default: the copy whitelist (persistence.ts copyCardToBoard) names neither field
  const copyBody = (/const copy: Box = \{[\s\S]*?copiedFromBoardId: sourceBoardId,\s*\};/.exec(read('store/persistence.ts')) || [''])[0];
  keep('NT2', copyBody.length > 100 && !/\bprompt\b/.test(copyBody) && !/\bdeckStep\b/.test(copyBody), copyBody.length ? 'whitelist is clean' : 'copy whitelist not found');
  // NT3 - on the card face the question is an ATTRIBUTE (data-prompt), never a child text node
  const be = read('components/BoardEditor.tsx');
  keep('NT3', /data-prompt=\{prompt \?\? undefined\}/.test(be) && !/\{prompt\}/.test(be.slice(be.indexOf('function BoardTextBox'), be.indexOf('function BoardCardPopup'))), 'data-prompt attribute on the face; no prompt text node');

  // SH - the "?" popover
  const sh = read('components/StepHelp.tsx');
  keep('SH1', /createPortal\(/.test(sh) && /role="dialog"/.test(sh) && /getBoundingClientRect\(\)/.test(sh) && /aria-haspopup="dialog"/.test(sh) && /aria-expanded=\{open\}/.test(sh) && /board-step-help/.test(sh) && /board-step-pop/.test(sh),
    'portal + dialog role + anchored at the glyph rect + aria on the glyph');
  const esc = /const onKey = \(e: KeyboardEvent\) => \{[\s\S]*?\};/.exec(sh);
  keep('SH2', !!esc && /Escape/.test(esc[0]) && /close\(true\)/.test(esc[0]) && /returnFocus\) btnRef\.current\?\.focus/.test(sh) && /addEventListener\('keydown', onKey, true\)/.test(sh) && /moreRef\.current\?\.focus/.test(sh),
    'Esc closes in the capture phase and returns focus to the glyph; opening focuses "more"');
  const moreFn = (/const more = \(\) => \{[\s\S]*?\};/.exec(sh) || [''])[0];
  keep('SH3', /stageTutorAsk\(t\('deckStepHelpAsk'\)/.test(moreFn) && !/fetch|apiTutor|send\(/.test(sh) && !/from '\.\.\/store\/api|tutorMeter|apiTutorChat/.test(sh), 'more only stages: no fetch, no api import, no send');
  keep('SH4', /target\.closest\('\.board-layer-toggle, \.board-step-help'\)\) return;/.test(be) && /hitEl\?\.closest\('\.board-handle, \.board-step-help, \.board-step-pop'\)\) return;/.test(be), 'the pointer machine stands down for the glyph; a double-click on it opens nothing');
  keep('SH5', /box\.kind === 'text' && box\.deckStep && !box\.sourceEntryId && <StepHelp box=\{box\} \/>/.test(be), 'the glyph shows on a dealt text card only, never a ported mirror');

  // ST - staging
  M.stageTutorAsk('What does Climax do?');
  const ev = (globalThis.__sent || []).filter((e) => e.type === M.TUTOR_STAGE_EVENT);
  const tut = read('components/Tutor.tsx');
  const onStage = (/const onStage = \(e: Event\) => \{[\s\S]*?\n    \};/.exec(tut) || [''])[0];
  keep('ST1', ev.length === 1 && ev[0].detail && ev[0].detail.text === 'What does Climax do?' && M.TUTOR_STAGE_EVENT === 'wrizo:tutor-stage', JSON.stringify(ev.map((e) => e.detail)));
  keep('ST2', onStage.length > 50 && /setComposerText\(text\)/.test(onStage) && /setStageTick/.test(onStage) && /setOpen\(true\)/.test(onStage) && /setArmedSelection\(null\)/.test(onStage) && !/send\(|fetch|apiTutorChat|appendTutorMessage/.test(onStage)
    && /addEventListener\(TUTOR_STAGE_EVENT, onStage\)/.test(tut), 'the Tutor stages the ask in its composer and sends nothing');

  // WD - words
  const T = (id, th) => M.deskTerm(id, th);
  keep('WD1', T('deckStepHelpGlyph', 'plateau') === '?' && T('deckStepHelpMore', 'plateau') === 'more' && T('deckStepHelpGlyph', 'flux') === '[?]' && T('deckStepHelpMore', 'flux') === 'MORE'
    && T('tutorTitle', 'plateau') === 'The Tutor' && T('tutorTitle', 'flux') === 'The Operator' && T('deckStepHelpAsk', 'plateau').replace('{step}', 'Climax') === 'What does Climax do?',
    JSON.stringify([T('deckStepHelpGlyph', 'flux'), T('deckStepHelpMore', 'flux'), T('tutorTitle', 'flux')]));
  const lex = read('store/deskLexicon.ts');
  const ids = [...lex.slice(lex.indexOf('const CANONICAL'), lex.indexOf('const OVERRIDES')).matchAll(/^  ([A-Za-z0-9]+): '(?:[^'\\]|\\.)*',?\s*(?:\/\/.*)?$/gm)].map((m) => m[1]);
  const w3 = ids.filter((i) => /^deck(Name(HeroJourney|StoryCircle|SceneSequel|ArgumentEssay|ResearchPaper|BusinessProposal|FromMyPages)|Hero|Circle|SceneSequel|Argument|Imrad|Proposal|RoomEvery|StepHelp|ScreenplayOptNovel|FeatureStory(Source|Scene)(One|Two)Title)/.test(i));
  const nouns = w3.filter((i) => FORBID.test(T(i, 'flux') || '') && !KEEP_FLUX[i]);
  keep('WD2', w3.length > 60 && nouns.length === 0, nouns.join(', ') || `${w3.length} W3 strings, none an Arbor noun under Flux`);
  keep('WD3', !/templates?/i.test(T('beginLoadDeck', 'plateau')) && !/templates?/i.test(T('beginLoadDeck', 'flux')) && T('beginLoadDeck', 'plateau') === 'Presets', `${T('beginLoadDeck', 'plateau')} / ${T('beginLoadDeck', 'flux')}`);
  keep('WD4', T('deckNameFromMyPages', 'plateau') === 'From my pages' && T('deckNameFromMyPages', 'flux') === 'From my docs' && T('deckScreenplayQPrompt', 'plateau') === 'What is this for?' && T('deckScreenplayOptNovel', 'plateau') === 'Novel',
    `${T('deckNameFromMyPages', 'flux')} / ${T('deckScreenplayQPrompt', 'plateau')}`);

  // FM1 - FROM MY PAGES: one card per picked page, IN THE ORDER PICKED, titled with the page's own title (or first words), body empty, each recorded for a graft to ITS page (the engine only records it)
  const pgs = [['pg-b', 'Beta scene\nShe counts the cups.'], ['pg-a', 'Alpha'], ['pg-c', '']];
  for (const [id, text] of pgs) M.createJournalPage({ id, text, origin: 'journal', source: 'page' });
  const fm = M.materializeDeck(byId['from-my-pages'], { pages: 'pg-b,pg-a,pg-c' }, []);
  const fmCards = fm.boxes.filter((b) => b.kind === 'text');
  const fmTitles = fmCards.map((b) => b.text.split('\n')[0]);
  const none = M.materializeDeck(byId['from-my-pages'], { pages: '' }, []).boxes.length;
  keep('FM1', fmCards.length === 3 && same(fmTitles.slice(0, 2), ['Beta scene', 'Alpha']) && fmTitles[2].length > 0 && fmCards.every((b) => b.text.endsWith('\n') && b.deckStep?.deck === 'from-my-pages' && b.deckStep?.step === 'page' && b.prompt === M.stepQuestion('from-my-pages', 'page'))
    && same(fm.grafts.map((g) => g.entryId), ['pg-b', 'pg-a', 'pg-c']) && same(fm.grafts.map((g) => g.boxId), fmCards.map((b) => b.id)) && none === 0 && M.stepQuestion('from-my-pages', 'page') === 'What does this part do for the whole?', JSON.stringify({ fmTitles, grafts: fm.grafts.length, none }));
  // FM2 - IT SHOWS ONLY: the deck file reads one page record and writes nothing (no store verb but getJournalEntry); the board grafts through the ordinary Grafts path, in ONE setBoxes
  const fmSrc = read('decks/library/fromMyPages.ts');
  const imports = [...fmSrc.matchAll(/^import .* from '(.*)';$/gm)].map((m) => m[0]);
  keep('FM2', imports.some((i) => /\{ getJournalEntry \} from '\.\.\/\.\.\/store\/persistence'/.test(i)) && !/\b(?:save|patch|upsert|reorder|move|update|set|add|remove|delete)[A-Z]\w*\(/.test(fmSrc.replace(/\/\/.*$/gm, '')) && /graftTo\(\{ entryId: id, boxId: g\.boxId \}, \{ entryId: g\.entryId \}, withCards\)/.test(be) && /setBoxes\(prev => \[\.\.\.prev, \.\.\.result\.boxes, \.\.\.graftConnections\]\)/.test(be), imports.join(' | '));
  // FM3 - the door: the library offers From my pages only where there are pages to pick (a board's own door); the new-project door passes none, so the deck is absent there; a preset (a NEW board) never lists it
  const wiz = read('components/DeckWizard.tsx'), cp = read('pages/CreateProject.tsx'), sp = read('components/SectionsPopout.tsx');
  keep('FM3', /const visibleDecks = decks\.filter\(d => !asksForPages\(d\) \|\| \(pagesFor \? pagesFor\(\)\.length > 0 : false\)\);/.test(wiz) && /decksByRoom\(visibleDecks\)/.test(wiz) && /question\.kind === 'pages' &&/.test(wiz) && !/pagesFor/.test(cp)
    && /DECKS\.filter\(deck => !deck\.questions\.some\(q => q\.kind === 'pages'\)\)\.map/.test(sp) && /pagesFor=\{\(\) => searchGraftables\('', \{ entryId: id \}, boxesRef\.current\)\.Pages\.filter\(r => !r\.placeDiffers\)/.test(be), 'the library, the new-project door, the Presets list and the board door');

  // CS - the stylesheet
  const css = read('index.css');
  const rules = []; { const re = /([^{}]+)\{([^{}]*)\}/g; let m; while ((m = re.exec(css))) rules.push({ sel: m[1].trim().replace(/\/\*[\s\S]*?\*\//g, '').trim(), body: m[2] }); }
  const rule = (sel) => rules.find((x) => x.sel.replace(/\s+/g, ' ') === sel);
  const base = rule(".board-text[data-prompt]::after, .board-popup-editor[data-prompt][data-body-empty='true']::after");
  const arbor = rule(":root:not([data-theme='flux']) .board-text[data-prompt]::after, :root:not([data-theme='flux']) .board-popup-editor[data-prompt][data-body-empty='true']::after");
  const flux = rule("[data-theme='flux'] .board-text[data-prompt]::after, [data-theme='flux'] .board-popup-editor[data-prompt][data-body-empty='true']::after");
  keep('CS1', !!base && /content:\s*attr\(data-prompt\)/.test(base.body) && /user-select:\s*none/.test(base.body) && !!flux && /content:\s*'> ' attr\(data-prompt\) ' \\25AE'/.test(flux.body) && !!arbor && /color:\s*var\(--badge-on-card\)/.test(arbor.body),
    base ? 'placeholder rules present' : 'no placeholder rule');
  const tokIn = (sel, name) => { const i = css.indexOf(sel); const b = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i)); const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(b); return m && m[1]; };
  const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const cr = (a, b) => { const [p, q] = [lum(hx(a)), lum(hx(b))].sort((x, y) => y - x); return (p + 0.05) / (q + 0.05); };
  const rootCss = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')) + 1);
  const olive = (/--badge-on-card:\s*(#[0-9a-fA-F]{6})/.exec(css) || [])[1];
  const stock = (/--card-stock:\s*(#[0-9a-fA-F]{6})/.exec(css) || [])[1];
  const fluxMeta = tokIn(":root[data-theme='flux'] {", 'ink-on-card-meta'), fluxStock = tokIn(":root[data-theme='flux'] {", 'card-stock');
  keep('CS2', !!olive && !!stock && cr(olive, stock) >= 4.5 && !!fluxMeta && !!fluxStock && cr(fluxMeta, fluxStock) >= 4.5, `Arbor olive ${olive} on ${stock}: ${olive && stock ? cr(olive, stock).toFixed(2) : '?'}; Flux ${fluxMeta} on ${fluxStock}: ${fluxMeta && fluxStock ? cr(fluxMeta, fluxStock).toFixed(2) : '?'}`);
  const w3css = css.slice(css.lastIndexOf('/*', css.indexOf('W3 / W11a - guided paths')), css.indexOf('BM1 — the Board'));
  const help = rule('.board-step-help'), helpOn = rule(".board-step-help:hover, .board-step-help[data-open='true'], .board-step-help:focus-visible");
  keep('CS3', !!help && /color:\s*var\(--badge-on-card\)/.test(help.body) && !!helpOn && /color:\s*var\(--choice\)/.test(helpOn.body) && !/var\(--brass\)/.test(w3css.replace(/\/\*[\s\S]*?\*\//g, '')) && !/#8f9a58/i.test(w3css.replace(/\/\*[\s\S]*?\*\//g, '')),
    'olive at rest, --choice on hover / open, no brass, no #8f9a58');
  void rootCss;
  return r;
}

// ---- mutants: each reaches the real source (the bundle or the text a pin reads), its LANDING asserted, and must redden exactly the checks it names -----------------------------------------------------
const MUT = [
  { name: 'the engine stops copying the prompt', file: 'decks/engine.ts', find: 'if (spec.prompt) box.prompt = spec.prompt;', to: '', red: ['BX1', 'DC1'] },
  { name: 'the engine stops copying the step key', file: 'decks/engine.ts', find: 'if (spec.deckStep) box.deckStep = spec.deckStep;', to: '', red: ['BX1', 'DC1'] },
  { name: 'a dealt card carries a body again', file: 'decks/guided.ts', find: "return { title, body: ''", to: "return { title, body: 'old body'", red: ['DC1'] },
  { name: 'promptToShow ignores the body', file: 'store/guided.ts', find: "return bodyIsEmpty(box.text) ? box.prompt : null;", to: 'return box.prompt;', red: ['BX2'] },
  { name: 'promptToShow shows on a ported mirror', file: 'store/guided.ts', find: "box.kind !== 'text' || box.sourceEntryId || !box.prompt", to: "box.kind !== 'text' || !box.prompt", red: ['BX2'] },
  { name: 'kindled counts a graft to a card', file: 'store/guided.ts', find: 'g.Pages.length + g.Sources.length + g.Boards.length > 0', to: 'g.Pages.length + g.Sources.length + g.Boards.length + g.Cards.length > 0', red: ['BX3'] },
  { name: 'kindled ignores the writer\'s text', file: 'store/guided.ts', find: 'if (hasWriterText(box)) return true;', to: '', red: ['BX3'] },
  { name: 'a step loses its "?" sentence', file: 'decks/content.ts', find: /"e": "The hook is the first image or line that makes a reader need the next one\."/, to: '"e": ""', red: ['DC2', 'DC3'] },
  { name: 'a question drifts from the doc', file: 'decks/content.ts', find: 'What is the first thing that makes this world feel off?', to: 'What is the first thing that feels off?', red: ['DC2'] },
  { name: 'a question becomes two', file: 'decks/content.ts', find: 'What happens that the ordinary world can\'t absorb?', to: 'What happens? Why can\'t the world absorb it?', red: ['DC2', 'DC3'] },
  { name: 'Worldbuilding ignores the genre', file: 'decks/library/worldbuilding.ts', find: "deskTerm('deckWorldbuildingRulesTitle'), genre)", to: "deskTerm('deckWorldbuildingRulesTitle'))", red: ['DC5'] },
  { name: 'Feature Story loses the Nut Graf variant', file: 'decks/library/featureStory.ts', find: "deskTerm('deckFeatureStoryNutGrafTitle'), kind)", to: "deskTerm('deckFeatureStoryNutGrafTitle'))", red: ['DC5'] },
  { name: 'the Novel answer stops softening step 8', file: 'decks/library/featureScreenplay.ts', find: "const variant = form === 'novel' ? 'novel' : 'screen';", to: "const variant = 'screen';", red: ['DC5'] },
  { name: 'Feature Story loses its (1)', file: 'store/deskLexicon.ts', find: "deckFeatureStorySourceOneTitle: 'Source & Quote (1)',", to: "deckFeatureStorySourceOneTitle: 'Source & Quote',", red: ['DC6'] },
  { name: 'a Thesis chapter is renamed', file: 'store/deskLexicon.ts', find: "deckThesisChapterOneTitle: 'Chapter One',", to: "deckThesisChapterOneTitle: 'Chapter 1',", red: ['DC6'] },
  { name: 'Hero\'s Journey keeps Refusal in the short story', file: 'decks/library/heroJourney.ts', find: "const SHORT = ['ordinary-world', 'call', 'mentor',", to: "const SHORT = ['ordinary-world', 'call', 'refusal', 'mentor',", red: ['DC7'] },
  { name: 'the Short essay keeps Evidence (3)', file: 'decks/library/argumentEssay.ts', find: "const SHORT = ['claim', 'evidence-1', 'evidence-2', 'synthesis', 'so-what'];", to: "const SHORT = ['claim', 'evidence-1', 'evidence-2', 'evidence-3', 'synthesis', 'so-what'];", red: ['DC7'] },
  { name: 'the Abstract is no longer dealt last', file: 'decks/library/researchPaper.ts', find: /\['abstract', deskTerm\('deckImradAbstractTitle'\)\],\n/, to: '', red: ['DC7', 'DC4'] },
  { name: 'the Novel answer moves a card', file: 'decks/library/featureScreenplay.ts', find: 'x: colX(colIndex, COLS, 0.02, 0.015),', to: 'x: colX(colIndex, COLS, 0.02, 0.015) + (form === \'novel\' ? 0.01 : 0),', red: ['DC8'] },
  { name: 'two scene columns collide', file: 'decks/library/sceneSequel.ts', find: 'x: colX(first + s, cols, marginX, gap), y: rowY(row), w, h: CARD_H,', to: 'x: colX(first, cols, marginX, gap), y: rowY(row), w, h: CARD_H,', red: ['LY1'] },
  { name: 'the Story Circle stops closing', file: 'decks/library/storyCircle.ts', find: 'threadTo: [STEPS[(i + 1) % STEPS.length][0]],', to: 'threadTo: i + 1 < STEPS.length ? [STEPS[i + 1][0]] : [],', red: ['LY2'] },
  { name: 'a reader of .prompt appears outside the allow-list', file: 'store/tutorStage.ts', find: 'export function stageTutorAsk(text: string): void {', to: 'export function stageTutorAsk(text: string, box?: { prompt?: string }): void {\n  void (box && box.prompt);', red: ['NT1'] },
  { name: 'the prompt goes into the card text', file: 'decks/engine.ts', find: 'text: `${spec.title}\\n${spec.body}`,', to: 'text: `${spec.title}\\n${spec.body}${spec.prompt ?? \'\'}`,', red: ['NT1', 'DC1'] },
  { name: 'the copy whitelist carries the prompt', file: 'store/persistence.ts', find: '    copiedFromBoardId: sourceBoardId,\n  };', to: '    ...(box.prompt !== undefined ? { prompt: box.prompt } : {}),\n    copiedFromBoardId: sourceBoardId,\n  };', red: ['NT2'] },
  { name: 'the placeholder becomes a text node', file: 'components/BoardEditor.tsx', find: '      data-prompt={prompt ?? undefined}\n', to: '      data-x={prompt ?? undefined}\n', red: ['NT3'] },
  { name: 'the popover loses its portal', file: 'components/StepHelp.tsx', find: 'createPortal(', to: '(', red: ['SH1'] },
  { name: 'Esc stops returning focus', file: 'components/StepHelp.tsx', find: 'close(true);\n    };\n    const onDown', to: 'close(false);\n    };\n    const onDown', red: ['SH2'] },
  { name: 'more sends', file: 'components/StepHelp.tsx', find: "stageTutorAsk(t('deckStepHelpAsk').replace('{step}', title || step.step));", to: "stageTutorAsk(t('deckStepHelpAsk').replace('{step}', title || step.step)); void fetch('/api/tutor');", red: ['SH3'] },
  { name: 'the pointer machine stops standing down for the glyph', file: 'components/BoardEditor.tsx', find: "target.closest('.board-layer-toggle, .board-step-help')) return;", to: "target.closest('.board-layer-toggle')) return;", red: ['SH4'] },
  { name: 'the glyph shows on a ported mirror', file: 'components/BoardEditor.tsx', find: "box.kind === 'text' && box.deckStep && !box.sourceEntryId && <StepHelp", to: "box.kind === 'text' && box.deckStep && <StepHelp", red: ['SH5'] },
  { name: 'staging stops carrying the ask', file: 'store/tutorStage.ts', find: 'new CustomEvent(TUTOR_STAGE_EVENT, { detail: { text } })', to: 'new CustomEvent(TUTOR_STAGE_EVENT, { detail: {} })', red: ['ST1'] },
  { name: 'the Tutor sends what was staged', file: 'components/Tutor.tsx', find: '      setComposerText(text);\n      setStageTick((n) => n + 1);\n    };\n    window.addEventListener(TUTOR_STAGE_EVENT', to: '      setComposerText(text);\n      void send();\n      setStageTick((n) => n + 1);\n    };\n    window.addEventListener(TUTOR_STAGE_EVENT', red: ['ST2'] },
  { name: 'Flux loses its [?]', file: 'store/deskLexicon.ts', find: "deckStepHelpGlyph: '[?]',", to: "deckStepHelpGlyph: '?',", red: ['WD1'] },
  { name: 'a Flux deck string says Page', file: 'store/deskLexicon.ts', find: "deckNameFromMyPages: 'From my docs',", to: "deckNameFromMyPages: 'From my pages',", red: ['WD2', 'WD4'] },
  { name: 'the starter row says Templates again', file: 'store/deskLexicon.ts', find: "beginLoadDeck: 'Presets',", to: "beginLoadDeck: 'Templates',", red: ['WD3'] },
  { name: 'the Arbor question goes back to the frame olive', file: 'index.css', find: ":root:not([data-theme='flux']) .board-text[data-prompt]::after,\n:root:not([data-theme='flux']) .board-popup-editor[data-prompt][data-body-empty='true']::after{ color:var(--badge-on-card); }", to: ":root:not([data-theme='flux']) .board-text[data-prompt]::after,\n:root:not([data-theme='flux']) .board-popup-editor[data-prompt][data-body-empty='true']::after{ color:#8f9a58; }", red: ['CS1', 'CS3'] },
  { name: 'the "?" turns brass at rest', file: 'index.css', find: 'border:1px solid var(--badge-on-card); background:transparent; color:var(--badge-on-card);', to: 'border:1px solid var(--brass); background:transparent; color:var(--brass);', red: ['CS3'] },
  { name: 'From my pages reorders the pages', file: 'decks/library/fromMyPages.ts', find: ".split(',').filter(Boolean)", to: ".split(',').filter(Boolean).sort()", red: ['FM1'] },
  { name: 'the engine stops recording the graft', file: 'decks/engine.ts', find: 'specs.forEach(spec => { if (spec.graftTo)', to: 'specs.forEach(spec => { if (false && spec.graftTo)', red: ['FM1'] },
  { name: 'From my pages writes a page', file: 'decks/library/fromMyPages.ts', find: "import { getJournalEntry } from '../../store/persistence';", to: "import { getJournalEntry, saveJournalEntry } from '../../store/persistence';\nvoid saveJournalEntry;", red: ['FM2'] },
  { name: 'the board stops grafting the cards', file: 'components/BoardEditor.tsx', find: 'const made = graftTo({ entryId: id, boxId: g.boxId }, { entryId: g.entryId }, withCards);', to: 'const made = null as ReturnType<typeof graftTo>;', red: ['FM2'] },
  { name: 'the library offers From my pages with no pages', file: 'components/DeckWizard.tsx', find: "(pagesFor ? pagesFor().length > 0 : false)", to: "(pagesFor ? true : true)", red: ['FM3'] },
  { name: 'a preset lists From my pages', file: 'components/SectionsPopout.tsx', find: "DECKS.filter(deck => !deck.questions.some(q => q.kind === 'pages')).map(", to: "DECKS.filter(deck => !!deck).map(", red: ['FM3'] },
  { name: 'the new-project door offers pages', file: 'pages/CreateProject.tsx', find: "<DeckWizard decks={DECKS} onDeal={onDeckDealt}", to: "<DeckWizard decks={DECKS} pagesFor={() => []} onDeal={onDeckDealt}", red: ['FM3'] },
  { name: 'the placeholder becomes real content', file: 'index.css', find: '  content:attr(data-prompt); display:block; margin-top:2px;', to: '  content:"x"; display:block; margin-top:2px;', red: ['CS1'] },
];

// ---- run -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const doc = parseDoc();
const baseLoad = await tryLoad({});
if (baseLoad.err) { ok('the real modules bundle against a fake browser', false, baseLoad.err); } else {
  const rd = (over) => (rel) => { const t = readRaw(rel); return over[rel] ? over[rel](t) : t; };
  const base = suite(baseLoad.M, rd({}), doc);
  for (const [k, v] of Object.entries(base)) ok(k, v.pass, v.detail);
  ok('the suite ran every check it names', Object.keys(base).length >= 24, `${Object.keys(base).length} checks`);

  let landed = 0; let killed = 0;
  for (const m of MUT) {
    let did = false;
    const over = { [m.file]: (text) => { const out = typeof m.find === 'string' ? text.replace(m.find, () => m.to) : text.replace(m.find, m.to); if (out !== text) did = true; return out; } };
    const L = await tryLoad(over);
    // a mutant that breaks the BUNDLE (a compile error) is killed by a crash, not a check - counted separately and said so
    let red = [];
    let how = 'checks';
    if (L.err) { how = 'CRASH'; red = ['(bundle)']; } else {
      let res; try { res = suite(L.M, rd(over), doc); } catch (e) { res = { '(suite crash)': { pass: false } }; }
      red = Object.entries(res).filter(([, v]) => !v.pass).map(([k]) => k);
    }
    if (!did) { ok(`mutant "${m.name}" LANDED`, false, `no match for the find text in ${m.file}`); continue; }
    landed += 1;
    const hit = m.red.every((k) => red.includes(k));
    if (hit && how === 'checks') killed += 1;
    ok(`mutant "${m.name}" is KILLED by a check (reddens: ${red.join(', ') || 'none'})`, hit && how === 'checks', hit ? (how === 'CRASH' ? 'crashed the bundle - not evidence' : '') : `expected ${m.red.join(', ')}; got ${red.join(', ') || 'none'}`);
  }
  ok(`all ${MUT.length} mutations landed and ${MUT.length} were killed`, landed === MUT.length && killed === MUT.length, `${landed} landed / ${killed} killed`);
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass && !c.detail ? '' : c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nGUIDED-W3 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nGUIDED-W3 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
