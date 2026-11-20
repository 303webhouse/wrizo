// REORG PHASE 3 - THE PARTS UNDERNEATH, BROWSERLESS (Fable, Nov 19, 3:55 pm; apps/desktop/src/reorg/parts.ts). No browser, no box: the real parts.ts is transpiled and run against an in-memory store that LOGS EVERY WRITE IN ORDER, so the
// laws that live in the ORDER of writes are checked on the real source, and each is given a mutant (a text rewrite of parts.ts) that must turn its own check red.
//   SJ    split then join returns the SAME text byte for byte, at EVERY offset of a text matrix (plain, marks, CRLF, emoji across the cut, a 20k text)
//   NL-S  nothing lost under sync, split: after EVERY write of a split, the tail words are in a stored live row and so are the head words (the tail is written first)
//   NL-J  nothing lost under sync, join: after EVERY write of a join, both halves are in a stored live row (the Part above gets the words first, the emptied Part is soft-deleted second)
//   SN    a cut never lands between the two halves of an emoji
//   RO    a re-order never changes a word: every Part's text, ink and cards are untouched by moves, levels, colours, names and limits; the order is the one asked for
//   RUN   a Part moves WITH its subsections; a level change shifts them with it; no Part is ever drawn deeper than one under the Part above, and the first is always level 0
//   KEY   a name, level, colour or limit is a key INSIDE pageSettings, ABSENT (never null) on a Part that never chose; a blank name clears; a colour outside the fixed set is refused
//   DEF   "Set as my default" never carries a Part's own name, level, colour or limit (pageDefaults strips all four)
//   JR    a join refuses a Part that carries ink, cards, links or a Tutor thread (with a reason), rather than dropping them; and the first Part cannot be joined upward
//   UN    undo of a split and of a join restores the exact earlier text, and is refused when either half changed since
//   OD    "make it its own Doc": the new set is written FIRST, then the Parts move; the run keeps its order and rebased levels; the only Part of a Doc is refused; the count of Parts and every text are conserved
//   ED    a split (or a new Part) on a page the APP filed (an auto-set) or nobody filed gives ONE Doc with TWO Parts: the set is written first, in the same Drawer, and nothing else in the old set moves; a made set gets no new set
//   NP    a new Part follows the Part asked for (after its subsections), is deeper only when asked, and a Doc with no Part starts at level 0
//   BOLD  a cut inside a styled run (bold, italic, underline, strike, a font span, nested) closes the style at the cut and reopens it in the tail; a join gives the text back byte for byte; the cut never lands inside a mark (Fable, Nov 20)
//   COL   PART_COLORS is the slots a to f (each theme draws its own six); an old clay, amber, moss, teal, slate or plum is READ as its slot and never written back (Fable, Nov 20)
//   TOMB  a card deleted from a Part's page (a tombstone, or a purge marker) is not carried by the Part: a join is not refused for it; a live card still refuses (ARBOR's T11 report, Nov 20)
// Run: node scripts/harness/reorg-parts-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const SRC = new URL('../../src/reorg/parts.ts', import.meta.url);
const PAGEDEF = new URL('../../src/store/pageDefaults.ts', import.meta.url);
const lf = (s) => s.split('\r\n').join('\n');   // a checkout may be CRLF: the mutants' anchors are LF
const partsText = lf(fs.readFileSync(SRC, 'utf8'));

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const FALLBACK = { margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' } };

// ---- the in-memory store: every write is logged IN ORDER, with a hook after each --------------------------------------------------------------------
function makeStore() {
  const S = { rows: [], projects: [], seq: 0, clock: 0, log: [], onWrite: null, defaults: null };
  const iso = () => new Date(Date.UTC(2026, 0, 1, 0, 0, S.clock++)).toISOString();
  const live = () => S.rows.filter((r) => !r.deletedAt);
  const note = (op, id, extra = {}) => { S.log.push({ op, id, ...extra }); if (S.onWrite) S.onWrite(op, id); };
  const api = {
    getJournalEntries: () => live().map(clone),
    getJournalEntry: (id) => { const r = live().find((x) => x.id === id); return r ? clone(r) : null; },
    getJournalEntryIncludingDeleted: (id) => { const r = S.rows.find((x) => x.id === id); return r ? clone(r) : null; },
    saveJournalEntry: (e) => { const row = clone(e); row.updatedAt = iso(); const i = S.rows.findIndex((x) => x.id === row.id); if (i >= 0) S.rows[i] = row; else S.rows.push(row); note('save', row.id, { text: row.text }); },
    softDeleteEntry: (id) => { const r = S.rows.find((x) => x.id === id); if (!r) return; r.deletedAt = iso(); note('delete', id); },
    restoreEntry: (id) => { const r = S.rows.find((x) => x.id === id); if (r) { delete r.deletedAt; note('restore', id); } },
    createBinderPage: (docId, pageType) => { const e = { id: `p${(S.seq += 1)}`, text: '', projectId: docId, pageType, source: 'page', origin: 'project', pageSettings: { ...FALLBACK, size: 11 }, createdAt: iso(), updatedAt: iso() }; S.rows.push(e); note('create', e.id); return clone(e); },
    createBinder: (title, kind, drawerId, type = 'creative') => { const p = { id: `d${(S.seq += 1)}`, title: title.trim() || 'Untitled', type, kind, storyPlanId: null, createdAt: iso(), updatedAt: iso(), ...(drawerId ? { drawerId } : {}) }; S.projects.push(p); note('project', p.id); return clone(p); },
    getProject: (id) => { const p = S.projects.find((x) => x.id === id); return p ? clone(p) : null; },
    getSystemKind: () => null, isPairedPlanBoard: () => false, flushNow: () => {},
    // place.ts reorderSections, verbatim in behaviour: write orderIndex only where it changes
    reorderSections: (ids) => { let n = 0; ids.forEach((id, i) => { const e = api.getJournalEntry(id); if (!e || e.orderIndex === i) return; api.saveJournalEntry({ ...e, orderIndex: i }); n += 1; }); return n; },
    firstPlainLine: (t) => { for (const l of String(t).split('\n')) { const s = l.replace(/[*_#>]/g, '').trim(); if (s) return s; } return undefined; },
    getUserPageDefaults: () => S.defaults,
    isAutoSet: (p) => !!p && (p.id.startsWith('top-set-') || p.id.startsWith('auto-set-')),
  };
  return { S, api };
}

const MARKRUNS = (() => { const o = ts.transpileModule(lf(fs.readFileSync(new URL('../../src/store/markRuns.ts', import.meta.url), 'utf8')), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText; const m = { exports: {} }; new Function('module', 'exports', o)(m, m.exports); return m.exports; })();
function load(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const { S, api } = makeStore();
  const mods = {
    '../types': { PAGE_SETTINGS_FALLBACK: FALLBACK }, '../store/markRuns': MARKRUNS, '../store/boxTombstones': { liveBoxes: (b) => (b ?? []).filter((x) => !x.deletedAt && !x.purgedAt) },
    '../store/persistence': api, '../store/persistence/restore': api, '../store/place': api, '../store/entryText': api, '../store/pageDefaults': api, '../store/wordCount': { wordCount: (t) => { const s = String(t ?? '').trim(); return s ? s.split(/\s+/).length : 0; } },
  };
  const module = { exports: {} };
  new Function('require', 'exports', 'module', out)((p) => { if (!(p in mods)) throw new Error('unstubbed import ' + p); return mods[p]; }, module.exports, module);
  return { P: module.exports, S, api };
}

// ---- helpers ----------------------------------------------------------------------------------------------------------------------------------------
const DOC = 'doc1';
function fixture(src, texts, levels) {
  const L = load(src);
  L.S.projects.push({ id: DOC, title: 'The Doc', type: 'creative', kind: 'book', storyPlanId: null, createdAt: 'x', updatedAt: 'x', drawerId: 'dr1' });
  const ids = [];
  texts.forEach((t, i) => {
    const e = L.api.createBinderPage(DOC, 'manuscript');
    L.api.saveJournalEntry({ ...L.api.getJournalEntry(e.id), text: t, orderIndex: i, ...(levels && levels[i] ? { pageSettings: { ...FALLBACK, size: 11, level: levels[i] } } : {}) });
    ids.push(e.id);
  });
  L.ids = ids; L.S.log.length = 0;
  return L;
}
const textOf = (L, id) => (L.api.getJournalEntry(id) || {}).text;
const orderNames = (L) => L.P.partsOfDoc(DOC).map((p) => p.id);
const levelsOf = (L) => L.P.partsOfDoc(DOC).map((p) => p.level);
const liveTexts = (L) => L.api.getJournalEntries().filter((e) => e.projectId === DOC).map((e) => e.text);
const holds = (L, s) => !s || liveTexts(L).some((t) => t.includes(s));
const lcg = (seed) => { let x = seed >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; };

const MATRIX = {
  plain: 'Hello world\nsecond line here\n\nthird paragraph, with words.\n',
  marks: '# A heading\n**bold** and _italic_ words\n- a bullet\n> a quote\n',
  crlf: 'one\r\ntwo\r\n\r\nthree',
  emoji: 'a \u{1F600} b \u{1F680}\u{1F680} c \u{1F468}‍\u{1F469} d',
  tiny: 'x',
};
{ const r = lcg(7); let big = ''; while (big.length < 20000) big += 'word' + Math.floor(r() * 1000) + (r() < 0.1 ? '\n' : ' '); MATRIX.big = big; }

// ---- every check, as one function of the source under test, so a mutant runs the SAME checks on rewritten source ----------------------------------------
function suite(src) {
  const R = {};
  // SJ: split then join, byte for byte, at every offset (the big text at 400 offsets)
  {
    let all = true, count = 0, first = null;
    for (const [name, text] of Object.entries(MATRIX)) {
      const offs = text.length > 2000 ? Array.from({ length: 400 }, (_, i) => Math.floor((i * text.length) / 400)).concat([0, text.length]) : Array.from({ length: text.length + 1 }, (_, i) => i);
      for (const off of offs) {
        const L = fixture(src, [text, 'next']);
        const r = L.P.splitPart(L.ids[0], off);
        if (!r.ok) { all = false; first = first || { name, off, why: 'split refused' }; continue; }
        const j = L.P.joinPart(r.tailId);
        const back = textOf(L, L.ids[0]);
        count += 1;
        if (!j.ok || back !== text || orderNames(L).join() !== [L.ids[0], L.ids[1]].join()) { all = false; first = first || { name, off, back: String(back).slice(0, 40), j }; }
      }
    }
    // a Part with subsections: the tail sits right below the head (reading order), a join puts it back, and the subsections never move
    const C = fixture(src, ['Head and tail words here', 'child one', 'sibling'], [0, 1, 0]);
    const cs = C.P.splitPart(C.ids[0], 9);
    const afterSplit = cs.ok ? orderNames(C).map((id) => textOf(C, id)).join('|') : '';
    const cj = cs.ok ? C.P.joinPart(cs.tailId) : null;
    const runOk = cs.ok && afterSplit === 'Head and |tail words here|child one|sibling' && !!cj && cj.ok && cj.keepId === C.ids[0] && textOf(C, C.ids[0]) === 'Head and tail words here' && orderNames(C).join() === C.ids.join();
    R.SJ = { pass: all && runOk && count > 500, detail: JSON.stringify({ count, first, runOk }) };
  }
  // SN: a cut never lands inside a surrogate pair
  {
    let bad = null;
    const t = MATRIX.emoji;
    for (let off = 0; off <= t.length; off += 1) {
      const L = fixture(src, [t]);
      const r = L.P.splitPart(L.ids[0], off); if (!r.ok) continue;
      const head = textOf(L, L.ids[0]), tail = textOf(L, r.tailId);
      const hi = head.length ? head.charCodeAt(head.length - 1) : 0, lo = tail.length ? tail.charCodeAt(0) : 0;
      if ((hi >= 0xD800 && hi <= 0xDBFF) || (lo >= 0xDC00 && lo <= 0xDFFF)) bad = bad || { off };
    }
    R.SN = { pass: bad === null, detail: JSON.stringify(bad) };
  }
  // BOLD (Fable, Nov 20: "a cut inside bold closes the style at the cut and reopens it in the tail"): the cut never leaves a marker open on one side and orphaned on the other
  {
    const CASES = [
      ['She said **a very bold| word** today.', 'She said **a very bold**', ' **word** today.'],
      ['She said **a very bo|ld word** today.', 'She said **a very bo**', '**ld word** today.'],
      ['**outer *inner wo|rds* more** after', '**outer *inner wo***', '***rds* more** after'],
      ['***both at| once*** here', '***both at***', ' ***once*** here'],
      ['z [in a| face]{.font-serif} w', 'z [in a]{.font-serif}', ' [face]{.font-serif} w'],
      ['x ~~struck out| words~~ y', 'x ~~struck out~~', ' ~~words~~ y'],
      ['a __under li|ned__ b', 'a __under li__', '__ned__ b'],
      ['soft *italic wo|rds here* end', 'soft *italic wo*', '*rds here* end'],
      // outside a run: nothing is added
      ['**bold**| and more', '**bold**', ' and more'],
      ['one **b** two| three', 'one **b** two', ' three'],
      ['plain words| only', 'plain words', ' only'],
      // at the very edge of a run, or inside a marker itself: the cut moves out of the run, never into its mark
      ['go **|bold word** now', 'go ', '**bold word** now'],
      ['go *|*bold word** now', 'go ', '**bold word** now'],
      ['go **bold word|** now', 'go **bold word**', ' now'],
      ['go **bold word*|* now', 'go **bold word**', ' now'],
      // a styled run never crosses a line: the cut in the second line leaves the first alone
      ['**a\nb|c** d', '**a\nb', 'c** d'],
    ];
    const bad = []; let n = 0;
    const X = load(src).P;
    for (const [spec, wantHead, wantTail] of CASES) {
      const at = spec.indexOf('|'), text = spec.slice(0, at) + spec.slice(at + 1);
      const r = X.splitText(text, at);
      n += 1;
      if (r.head !== wantHead || r.tail !== wantTail) bad.push({ spec, head: r.head, tail: r.tail });
      if (X.joinText(r.head, r.tail) !== text) bad.push({ spec, join: X.joinText(r.head, r.tail) });
    }
    // every offset of every styled line: the join gives the text back, byte for byte, and each half has its marks in pairs
    const LINES = CASES.map((c) => c[0].replace('|', '')).concat(['**a** and _b_ and ~~c~~ and __d__ end', 'k ***x _y_ z*** m']);
    let cuts = 0;
    for (const text of LINES) {
      for (let off = 0; off <= text.length; off += 1) {
        const r = X.splitText(text, off); cuts += 1;
        if (X.joinText(r.head, r.tail) !== text) bad.push({ text, off, join: X.joinText(r.head, r.tail) });
        const dangling = (s) => s.split('\n').some((ln) => { const runs = MARKRUNS.readMarks(ln); return /\*\*\*\*|(^|\s)\*\*(\s|$)/.test(ln) && runs.length === 0; });
        if (!text.includes('\n') && (dangling(r.head) || dangling(r.tail))) bad.push({ text, off, dangling: [r.head, r.tail] });
      }
    }
    // through the store: the two Parts hold the closed and the reopened halves, a join gives the text back, an undo gives it back
    const T = 'She said **a very bo|ld word** today.', cut = T.indexOf('|'), whole = T.replace('|', '');
    const L = fixture(src, [whole, 'next']);
    const sp = L.P.splitPart(L.ids[0], cut);
    const stored = sp.ok ? [textOf(L, L.ids[0]), textOf(L, sp.tailId)] : [];
    const jn = sp.ok ? L.P.joinPart(sp.tailId) : null;
    const afterJoin = textOf(L, L.ids[0]);
    const L2 = fixture(src, [whole, 'next']);
    const sp2 = L2.P.splitPart(L2.ids[0], cut);
    const undone = sp2.ok && L2.P.undoSplit(sp2.token) ? textOf(L2, L2.ids[0]) : null;
    const NAT = '**a** **b**', LN = fixture(src, [NAT, 'next']);
    const spn = LN.P.splitPart(LN.ids[0], 5);
    const natUndo = spn.ok && LN.P.undoSplit(spn.token) ? textOf(LN, LN.ids[0]) : null;
    const natJoin = X.joinText('**a**', ' **b**');
    const viaStore = natUndo === NAT && natJoin === '**a b**' && sp.ok && stored[0] === 'She said **a very bo**' && stored[1] === '**ld word** today.' && !!jn && jn.ok && afterJoin === whole && undone === whole;
    R.BOLD = { pass: bad.length === 0 && viaStore && n === CASES.length && cuts > 100, detail: JSON.stringify({ bad: bad.slice(0, 3), viaStore, stored, afterJoin, undone, cuts }) };
  }
  // COL (Fable, Nov 20: "PART_COLORS becomes slots a-f; each theme draws its own six; read any old clay...plum name once and map it to a slot")
  {
    const X = load(src).P;
    const slots = JSON.stringify(X.PART_COLORS) === JSON.stringify(['a', 'b', 'c', 'd', 'e', 'f']);
    const accepts = X.isPartColor('a') && X.isPartColor('f') && !X.isPartColor('clay') && !X.isPartColor('g') && !X.isPartColor('#ff0000');
    const LEGACY = { clay: 'a', amber: 'b', moss: 'c', teal: 'd', slate: 'e', plum: 'f', a: 'a', c: 'c', f: 'f', chartreuse: null, '#ff0000': null };
    const L = fixture(src, ['one', 'two']);
    const read = {};
    for (const [old, want] of Object.entries(LEGACY)) {
      L.api.saveJournalEntry({ ...L.api.getJournalEntry(L.ids[0]), pageSettings: { ...FALLBACK, size: 11, color: old } });
      const writes = L.S.log.length;
      read[old] = { got: L.P.partsOfDoc(DOC)[0].color, want, wrote: L.S.log.length - writes };
    }
    const mapped = Object.values(read).every((r) => r.got === r.want && r.wrote === 0);
    // writing: a slot is stored as the slot; an old name is not written back
    const L3 = fixture(src, ['one']);
    L3.P.setPartColor(L3.ids[0], 'c'); const stored = L3.api.getJournalEntry(L3.ids[0]).pageSettings.color;
    const refusedOld = L3.P.setPartColor(L3.ids[0], 'clay') === false && L3.api.getJournalEntry(L3.ids[0]).pageSettings.color === 'c';
    // a Part carrying an old name, split: the tail takes no colour (a per-Part fact, as before)
    R.COL = { pass: slots && accepts && mapped && stored === 'c' && refusedOld, detail: JSON.stringify({ slots, accepts, read, stored, refusedOld }) };
  }
  // TOMB (ARBOR's report, Nov 20: box-tombstones T11 reads parts.ts's raw `.boxes`): a card deleted from a Part's page is a tombstone, hidden from every reader; the Part does not carry it, so a join is not refused for it
  {
    const mk = (boxes) => { const L = fixture(src, ['above words', 'below words']); L.api.saveJournalEntry({ ...L.api.getJournalEntry(L.ids[1]), boxes }); return L; };
    const dead = mk([{ id: 'b1', kind: 'note', text: 'gone', x: 0, y: 0, deletedAt: '2026-01-01T00:00:00.000Z' }]);
    const purged = mk([{ id: 'b1', purgedAt: '2026-01-01T00:00:00.000Z' }]);
    const live = mk([{ id: 'b1', kind: 'note', text: 'here', x: 0, y: 0 }]);
    const mixed = mk([{ id: 'b1', kind: 'note', text: 'gone', x: 0, y: 0, deletedAt: '2026-01-01T00:00:00.000Z' }, { id: 'b2', kind: 'note', text: 'here', x: 0, y: 0 }]);
    const carries = (L) => (L.P.partsOfDoc(DOC)[1] || {}).carries;
    const cs = { dead: carries(dead), purged: carries(purged), live: carries(live), mixed: carries(mixed) };   // read BEFORE any join (a join soft-deletes the Part it joins)
    const dj = dead.P.joinPart(dead.ids[1]);
    const lj = live.P.joinPart(live.ids[1]);
    const mj = mixed.P.joinPart(mixed.ids[1]);
    R.TOMB = {
      pass: cs.dead === false && cs.purged === false && cs.live === true && cs.mixed === true && dj.ok === true && lj.ok === false && lj.reason === 'carries' && mj.ok === false,
      detail: JSON.stringify({ cs, dj: dj.ok, lj, mj: mj.ok }),
    };
  }
  // NL-S: after every write of a split, the tail words and the head words are both in a stored live row
  {
    const text = MATRIX.plain, off = 12;
    const L = fixture(src, [text, 'next']);
    const head = text.slice(0, off), tail = text.slice(off);
    const seen = []; let lost = null;
    L.S.onWrite = (op, id) => { const h = holds(L, tail) && holds(L, head); seen.push({ op, id, h }); if (!h && !lost) lost = { op, id }; };
    const r = L.P.splitPart(L.ids[0], off);
    R['NL-S'] = { pass: r.ok && seen.length >= 3 && lost === null && textOf(L, L.ids[0]) === head && textOf(L, r.tailId) === tail, detail: JSON.stringify({ lost, writes: seen.length }) };
  }
  // NL-J: after every write of a join, both halves are in a stored live row
  {
    const L = fixture(src, ['The first part. ', 'The second part, below.']);
    const seen = []; let lost = null;
    L.S.onWrite = (op, id) => { const h = holds(L, 'The first part. ') && holds(L, 'The second part, below.'); seen.push({ op, id, h }); if (!h && !lost) lost = { op, id }; };
    const j = L.P.joinPart(L.ids[1]);
    const gone = L.api.getJournalEntryIncludingDeleted(L.ids[1]);
    R['NL-J'] = { pass: j.ok && lost === null && seen.length >= 2 && textOf(L, L.ids[0]) === 'The first part. The second part, below.' && !!gone && !!gone.deletedAt && gone.text === 'The second part, below.', detail: JSON.stringify({ lost, writes: seen.length, j }) };
  }
  // RO + RUN: moves, levels, colours, names, limits write no word; runs move together; levels are clamped
  {
    const texts = ['A one', 'B two', 'C three', 'D four', 'E five', 'F six'];
    const L = fixture(src, texts, [0, 1, 2, 0, 1, 1]);
    const ink = [{ x: 1 }]; const cards = [{ id: 'bx' }];
    const row = L.api.getJournalEntry(L.ids[2]); L.api.saveJournalEntry({ ...row, strokes: ink, boxes: cards });
    const before = Object.fromEntries(L.ids.map((id) => [id, JSON.stringify({ t: textOf(L, id), s: (L.api.getJournalEntry(id) || {}).strokes, b: (L.api.getJournalEntry(id) || {}).boxes })]));
    const lv0 = levelsOf(L).join('');
    // move Part A (with B and C under it) to the end
    L.P.movePart(DOC, L.ids[0], 3);
    const o1 = orderNames(L).map((id) => L.ids.indexOf(id)).join('');
    const lv1 = levelsOf(L).join('');
    // move Part F to the very front (level must come down to 0)
    L.P.movePart(DOC, L.ids[5], 0);
    const o2 = orderNames(L).map((id) => L.ids.indexOf(id)).join('');
    const lv2 = levelsOf(L).join('');
    L.P.setPartColor(L.ids[1], 'moss'); L.P.renamePart(L.ids[1], '  Chapter   One '); L.P.setPartLimit(L.ids[1], { unit: 'words', max: 500 }); L.P.setPartLevel(DOC, L.ids[4], 0);
    const after = Object.fromEntries(L.ids.map((id) => [id, JSON.stringify({ t: textOf(L, id), s: (L.api.getJournalEntry(id) || {}).strokes, b: (L.api.getJournalEntry(id) || {}).boxes })]));
    R.RO = { pass: Object.keys(before).every((k) => before[k] === after[k]), detail: JSON.stringify({ before, after }).slice(0, 300) };
    // the first move: D E F, then A B C (the run, with its levels 0 1 2 intact); F ends first after the second
    R['RUN-move'] = { pass: lv0 === '012011' && o1 === '345012' && lv1 === '011012' && o2 === '534012' && lv2.startsWith('0'), detail: JSON.stringify({ lv0, o1, lv1, o2, lv2 }) };
    // levels clamp: a level cannot be deeper than one under the Part above, and the first Part is 0
    const M = fixture(src, ['a', 'b', 'c'], [2, 2, 2]);
    const eff = levelsOf(M).join('');
    const want = M.P.setPartLevel(DOC, M.ids[2], 2);
    const first = M.P.setPartLevel(DOC, M.ids[0], 2);
    R['RUN-clamp'] = { pass: eff === '012' && want === 2 && first === 0 && levelsOf(M)[0] === 0, detail: JSON.stringify({ eff, want, first }) };
    // a level change shifts the subsections with it
    const N = fixture(src, ['a', 'b', 'c', 'd', 'e'], [0, 1, 2, 2, 0]);
    N.P.setPartLevel(DOC, N.ids[1], 0);
    R['RUN-shift'] = { pass: levelsOf(N).join('') === '00110' && N.P.setPartLevel(DOC, 'nope', 1) === null, detail: JSON.stringify(levelsOf(N)) };
  }
  // KEY
  {
    const L = fixture(src, ['One two three four five six seven eight', 'second']);
    const [a, b] = L.ids;
    const untouched = L.api.getJournalEntry(b).pageSettings;
    const noKeys = !('name' in untouched) && !('level' in untouched) && !('color' in untouched) && !('lengthLimit' in untouched);
    const fw = L.P.partsOfDoc(DOC)[0];
    L.P.renamePart(a, '  The   Opening ');
    const named = L.api.getJournalEntry(a).pageSettings.name;
    L.P.renamePart(a, '   ');
    const cleared = L.api.getJournalEntry(a).pageSettings;
    // ORIGINAL, SUPERSEDED Nov 20 (Fable: PART_COLORS is the slots a-f; the old colour names are read as slots, never written). The check stands on the slot below:
    // L.P.setPartColor(a, 'plum'); const col1 = L.api.getJournalEntry(a).pageSettings.color;
    L.P.setPartColor(a, 'f'); const col1 = L.api.getJournalEntry(a).pageSettings.color;
    const bad = L.P.setPartColor(a, '#ff0000'); const col2 = L.api.getJournalEntry(a).pageSettings.color;
    L.P.setPartColor(a, null); const col3 = L.api.getJournalEntry(a).pageSettings;
    L.P.setPartLimit(a, { unit: 'words', max: 800.7 }); const lim = L.api.getJournalEntry(a).pageSettings.lengthLimit;
    const badLim = L.P.setPartLimit(a, { unit: 'pages', max: 3 });
    L.P.setPartLimit(a, null); const lim2 = L.api.getJournalEntry(a).pageSettings;
    const noop = L.P.renamePart(b, '');   // no name to clear: writes nothing
    const writesAfter = L.S.log.length;
    L.P.renamePart(b, ''); L.P.setPartColor(b, null);
    const untouchedStill = L.api.getJournalEntry(b).pageSettings === undefined || JSON.stringify(L.api.getJournalEntry(b).pageSettings) === JSON.stringify(untouched);
    R.KEY = {
      // ORIGINAL, SUPERSEDED Nov 20 (Fable: PART_COLORS is the slots a-f; the old colour names are read as slots, never written). The check stands on the slot below:
      // pass: noKeys && fw.name === 'One two three four five six...' && fw.named === false && named === 'The Opening' && !('name' in cleared) && col1 === 'plum' && bad === false && col2 === 'plum' && !('color' in col3)
      pass: noKeys && fw.name === 'One two three four five six...' && fw.named === false && named === 'The Opening' && !('name' in cleared) && col1 === 'f' && bad === false && col2 === 'f' && !('color' in col3)
        && lim && lim.max === 800 && lim.unit === 'words' && badLim === false && !('lengthLimit' in lim2) && noop === false && L.S.log.length === writesAfter && untouchedStill
        && JSON.stringify(L.api.getJournalEntry(a).pageSettings).indexOf('null') < 0,
      detail: JSON.stringify({ noKeys, first: fw.name, named, cleared, col1, bad, col2, lim, badLim, noop }),
    };
  }
  // JR
  {
    const L = fixture(src, ['top', 'inked', 'cards', 'plain']);
    const put = (i, patch) => L.api.saveJournalEntry({ ...L.api.getJournalEntry(L.ids[i]), ...patch });
    put(1, { strokes: [{ p: 1 }] }); put(2, { boxes: [{ id: 'b' }] });
    const r1 = L.P.joinPart(L.ids[1]), r2 = L.P.joinPart(L.ids[2]), r0 = L.P.joinPart(L.ids[0]), r4 = L.P.joinPart('nope');
    const stillThere = L.P.partsOfDoc(DOC).length === 4 && textOf(L, L.ids[0]) === 'top';
    const r3 = L.P.joinPart(L.ids[3]);
    R.JR = { pass: r1.ok === false && r1.reason === 'carries' && r2.ok === false && r2.reason === 'carries' && r0.ok === false && r0.reason === 'first' && r4.ok === false && r4.reason === 'unknown' && stillThere && r3.ok === true, detail: JSON.stringify({ r1, r2, r0, r3 }) };
  }
  // UN
  {
    const L = fixture(src, ['Alpha beta gamma delta', 'second']);
    const sp = L.P.splitPart(L.ids[0], 11);
    const edited = (() => { const e = L.api.getJournalEntry(sp.tailId); L.api.saveJournalEntry({ ...e, text: e.text + '!' }); return L.P.undoSplit(sp.token); })();
    const e2 = L.api.getJournalEntry(sp.tailId); L.api.saveJournalEntry({ ...e2, text: sp.token.tail });
    const undone = L.P.undoSplit(sp.token);
    const afterSplitUndo = textOf(L, L.ids[0]);
    const M = fixture(src, ['One. ', 'Two.']);
    const jn = M.P.joinPart(M.ids[1]);
    const jEdited = (() => { const e = M.api.getJournalEntry(M.ids[0]); M.api.saveJournalEntry({ ...e, text: e.text + 'x' }); const r = M.P.undoJoin(jn.token); M.api.saveJournalEntry({ ...M.api.getJournalEntry(M.ids[0]), text: 'One. Two.' }); return r; })();
    const jUndo = M.P.undoJoin(jn.token);
    R.UN = {
      pass: sp.ok && edited === false && undone === true && afterSplitUndo === 'Alpha beta gamma delta' && jEdited === false && jUndo === true && textOf(M, M.ids[0]) === 'One. ' && textOf(M, M.ids[1]) === 'Two.' && M.P.partsOfDoc(DOC).length === 2,
      detail: JSON.stringify({ edited, undone, afterSplitUndo, jEdited, jUndo }),
    };
  }
  // OD
  {
    const L = fixture(src, ['Front', 'Act one', 'Scene a', 'Beat x', 'Act two'], [0, 1, 2, 2, 0]);
    const textsBefore = L.ids.map((id) => textOf(L, id));
    const res = L.P.makeOwnDoc(L.ids[1]);
    const newDocFirst = res.ok && L.S.log.findIndex((l) => l.op === 'project') >= 0 && L.S.log.findIndex((l) => l.op === 'project') < L.S.log.findIndex((l) => l.op === 'save');
    const moved = res.ok ? L.P.partsOfDoc(res.docId) : [];
    const left = L.P.partsOfDoc(DOC);
    const only = fixture(src, ['alone']).P.makeOwnDoc(L.ids[0]);
    const lone = fixture(src, ['alone']); const loneRes = lone.P.makeOwnDoc(lone.ids[0]);
    const proj = res.ok ? L.api.getProject(res.docId) : null;
    void only;
    R.OD = {
      pass: res.ok && newDocFirst && moved.length === 3 && moved.map((p) => p.level).join('') === '011' && moved.map((p) => textOf(L, p.id)).join('|') === 'Act one|Scene a|Beat x'
        && left.length === 2 && left.map((p) => textOf(L, p.id)).join('|') === 'Front|Act two' && L.ids.map((id) => textOf(L, id)).join('|') === textsBefore.join('|')
        && loneRes.ok === false && loneRes.reason === 'only-part' && !!proj && proj.drawerId === 'dr1' && proj.title === 'Act one',
      detail: JSON.stringify({ res, newDocFirst, moved: moved.map((p) => [p.name, p.level]), left: left.map((p) => p.name), loneRes, proj }),
    };
  }
  // NP
  {
    const L = fixture(src, ['a', 'b', 'c'], [0, 1, 0]);
    const x = L.P.newPart(DOC, { afterId: L.ids[0], name: 'Inserted' });   // follows a AND a's subsection b, at a's level
    const y = L.P.newPart(DOC, { afterId: L.ids[0], level: 1, name: 'Sub' });   // deeper: the first subsection of a
    const z = L.P.newPart(DOC);   // the end
    const w = L.P.newPart('empty-doc-id');
    const E = fixture(src, []); const e1 = E.P.newPart(DOC, { level: 2, name: 'First' });
    const names = L.P.partsOfDoc(DOC).map((p) => p.name);
    R.NP = { pass: !!x && !!y && !!z && w === null && names.join('|') === 'a|Sub|b|Inserted|c|Untitled' && levelsOf(L).join('') === '011000' && !!e1 && levelsOf(E).join('') === '0', detail: JSON.stringify({ names, lv: levelsOf(L), e: levelsOf(E) }) };
  }
  // ED
  {
    const mk = () => {
      const L = load(src);
      L.S.projects.push({ id: 'auto-set-dr1', title: 'Drawer One', type: 'creative', storyPlanId: null, createdAt: 'x', updatedAt: 'x', drawerId: 'dr1' });
      const a = L.api.createBinderPage('auto-set-dr1', 'manuscript'); const b = L.api.createBinderPage('auto-set-dr1', 'manuscript');
      L.api.saveJournalEntry({ ...L.api.getJournalEntry(a.id), text: 'Loose page words here and there' });
      L.api.saveJournalEntry({ ...L.api.getJournalEntry(b.id), text: 'Another loose page' });
      L.S.log.length = 0;
      return { L, a: a.id, b: b.id };
    };
    // a page in an auto-set: ONE Doc, TWO Parts, the Drawer kept, the set first, the neighbour and the app's set untouched
    const { L, a, b } = mk();
    const autoBefore = JSON.stringify(L.api.getProject('auto-set-dr1')), bBefore = JSON.stringify(L.api.getJournalEntry(b));
    const projects0 = L.S.projects.length;
    const r = L.P.splitPart(a, 10);
    const moved = L.api.getJournalEntry(a);
    const doc = r.ok ? L.api.getProject(moved.projectId) : null;
    const parts = doc ? L.P.partsOfDoc(doc.id) : [];
    const firstProject = L.S.log.findIndex((l) => l.op === 'project'), firstEntryWrite = L.S.log.findIndex((l) => l.op === 'create' || l.op === 'save');
    const autoStill = L.P.partsOfDoc('auto-set-dr1');
    const autoOk = r.ok && !!doc && moved.projectId !== 'auto-set-dr1' && doc.drawerId === 'dr1' && doc.title === 'Loose page words here and there' && parts.length === 2 && L.S.projects.length === projects0 + 1
      && firstProject >= 0 && firstProject < firstEntryWrite && autoBefore === JSON.stringify(L.api.getProject('auto-set-dr1')) && bBefore === JSON.stringify(L.api.getJournalEntry(b)) && autoStill.length === 1 && autoStill[0].id === b;
    // a page in NO set: its own Doc too, in no Drawer
    const N = load(src);
    N.api.saveJournalEntry({ id: 'loose1', text: 'A loose page with words in it', projectId: null, source: 'page', origin: 'loose', createdAt: 'y', updatedAt: 'y' });
    const rn = N.P.splitPart('loose1', 8);
    const nd = rn.ok ? N.api.getProject(N.api.getJournalEntry('loose1').projectId) : null;
    const noSetOk = rn.ok && !!nd && nd.drawerId === undefined && N.P.partsOfDoc(nd.id).length === 2;
    // a page in a set the writer made: no new set
    const M = fixture(src, ['Made set page words']);
    const rm = M.P.splitPart(M.ids[0], 4);
    const madeOk = rm.ok && M.S.log.every((l) => l.op !== 'project') && M.P.partsOfDoc(DOC).length === 2;
    // a new Part grown from an app-filed page is its Doc's second Part; with no page to grow from, an app-made set is refused
    const G = mk();
    const nid = G.L.P.newPart(null, { afterId: G.a, name: 'Second' });
    const gd = nid ? G.L.api.getProject(G.L.api.getJournalEntry(G.a).projectId) : null;
    const newOk = !!nid && !!gd && G.L.P.partsOfDoc(gd.id).length === 2 && G.L.P.partsOfDoc('auto-set-dr1').length === 1 && G.L.P.newPart('auto-set-dr1') === null;
    R.ED = { pass: autoOk && noSetOk && madeOk && newOk, detail: JSON.stringify({ autoOk, noSetOk, madeOk, newOk, parts: parts.map((p) => p.name) }) };
  }
  return R;
}

// ---- baseline: every check green on the real source ------------------------------------------------------------------------------------------------
const base = suite(partsText);
const KEYS = ['SJ', 'SN', 'NL-S', 'NL-J', 'RO', 'RUN-move', 'RUN-clamp', 'RUN-shift', 'KEY', 'JR', 'UN', 'OD', 'NP', 'ED', 'BOLD', 'COL', 'TOMB'];
for (const k of KEYS) ok(`${k} on the real parts.ts`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');

// DEF: pageDefaults strips a Part's own facts at the door (a source read: the strip is one destructure)
const defText = lf(fs.readFileSync(PAGEDEF, 'utf8'));
const defStrips = (t) => { const m = /const \{([^}]*)\.\.\.dress\s*\} = v as PageSettings/.exec(t); return !!m && ['name', 'level', 'color', 'lengthLimit'].every((k) => new RegExp(`(^|[\\s,])${k}(,|\\s|$)`).test(m[1])); };
ok('DEF pageDefaults strips name, level, color and lengthLimit (the Part\'s own facts) from the writer\'s default dress', defStrips(defText), '');

// ---- mutants: each rewrite of parts.ts must land exactly once and turn its own check red -----------------------------------------------------------------
const MUT = [
  ['the split writes the SHORTENED source before the tail', 'NL-S', (t) => t.replace('  saveJournalEntry(row);\n', () => '').replace("  if (again) saveJournalEntry({ ...again, text: head });", () => "  if (again) saveJournalEntry({ ...again, text: head });\n  saveJournalEntry(row);")],
  ['the join soft-deletes the emptied Part BEFORE the words are appended', 'NL-J', (t) => t.replace("  saveJournalEntry({ ...aboveE, text: joinText(above, below) });\n  if (between) between();\n  softDeleteEntry(partId);", () => "  softDeleteEntry(partId);\n  if (between) between();\n  saveJournalEntry({ ...aboveE, text: joinText(above, below) });")],
  // ORIGINAL, SUPERSEDED Nov 20 (joinText now heals a styled seam, so its one-line body is gone; the mutant stands on the line that carries the lower Part's words):
  // ['the join drops the lower Part\'s words', 'SJ', (t) => t.replace('export const joinText = (above: string, below: string): string => above + below;', () => 'export const joinText = (above: string, below: string): string => above;')],
  ['the join drops the lower Part\'s words', 'SJ', (t) => t.replace('const plain = above + below;', () => 'const plain = above;')],
  ['a cut inside a styled run reopens nothing in the tail', 'BOLD', (t) => t.replace('tail: tSpace + openers + t.slice(tSpace.length)', () => 'tail: t')],
  ['the closing marks go after the head\'s trailing space', 'BOLD', (t) => t.replace('head: h.slice(0, h.length - hSpace.length) + closers + hSpace', () => 'head: h + closers')],
  ['a join leaves the seam of a split in a styled run', 'BOLD', (t) => t.replace('return across.length === peeled.length && across.every((m, i) => m === peeled[i]) ? healed : plain;', () => 'return plain;')],
  ['a cut may land inside a run\'s own mark', 'BOLD', (t) => t.replace('if (p > r.open && p <= o1) { p = r.open; again = true; } else if (p >= c1 && p < c2) { p = c2; again = true; }', () => '')],
  ['an undo joins by the halves, not by the whole it was cut from', 'BOLD', (t) => t.replace('text: t.whole ?? joinText(t.head, t.tail)', () => 'text: joinText(t.head, t.tail)')],
  ['a join is refused for a deleted card too (the raw read)', 'TOMB', (t) => t.replace('liveBoxes(e.boxes).length > 0', () => '!!(e.boxes && e.boxes.length)')],
  ['an old colour name is read as no colour', 'COL', (t) => t.replace("{ clay: 'a', amber: 'b', moss: 'c', teal: 'd', slate: 'e', plum: 'f' }", () => '{}')],
  ['an old colour name is written back', 'COL', (t) => t.replace('if (color !== null && !isPartColor(color)) return false;', () => '')],
  ['the slots stop at e', 'COL', (t) => t.replace("['a', 'b', 'c', 'd', 'e', 'f'] as const", () => "['a', 'b', 'c', 'd', 'e'] as const")],
  ['a cut may land between the halves of an emoji', 'SN', (t) => t.replace('if (a >= 0xD800 && a <= 0xDBFF && b >= 0xDC00 && b <= 0xDFFF) return o - 1;', () => '')],
  ['a move leaves the subsections behind', 'RUN-move', (t) => t.replace('const [s, t] = runOf(parts.map(p => p.level), i);\n  const run = parts.slice(s, t);\n  const rest', () => 'const s = i, t = i + 1;\n  const run = parts.slice(s, t);\n  const rest')],
  ['a level may be set deeper than one under the Part above', 'RUN-clamp', (t) => t.replace('const cap = i === 0 ? 0 : Math.min(MAX_PART_LEVEL, parts[i - 1].level + 1);\n  const want', () => 'const cap = MAX_PART_LEVEL;\n  const want')],
  ['a level change leaves the subsections where they were', 'RUN-shift', (t) => t.replace("  const [s, t] = runOf(parts.map(p => p.level), i);\n  parts.slice(s, t).forEach(p => patchKeys(p.id, { level:", () => "  const [s, t] = [i, i + 1];\n  parts.slice(s, t).forEach(p => patchKeys(p.id, { level:")],
  ['a removed key is written as null', 'KEY', (t) => t.replace('if (v === undefined) delete next[k]; else next[k] = v;', () => 'next[k] = v === undefined ? null : v;')],
  ['any colour string is accepted', 'KEY', (t) => t.replace("export const isPartColor = (v: unknown): v is PartColor => typeof v === 'string' && (PART_COLORS as readonly string[]).includes(v);", () => "export const isPartColor = (v: unknown): v is PartColor => typeof v === 'string';")],
  ['a join drops ink and cards without a word', 'JR', (t) => t.replace("  if (carriesMore(me)) return { ok: false, reason: 'carries' };\n", () => '')],
  ['the undo forces the join back even when a half changed', 'UN', (t) => t.replace('if (!src || !tail || src.text !== t.head || tail.text !== t.tail) return false;', () => 'if (!src || !tail) return false;')],
  ['a split puts the tail after the whole run of the source, below its subsections', 'SJ', (t) => t.replace('  placeRun(docId, [born.id], partId);', () => '  { const rl = me ? runOf(parts.map(p => p.level), me.index)[1] : parts.length; placeRun(docId, [born.id], parts[Math.max(0, rl - 1)]?.id ?? partId); }')],
  ['a split adds the tail to the page\'s own set even when the app made it', 'ED', (t) => t.replace("const doc = ensureDoc(partId);\n  if (!doc.ok) return { ok: false, reason: 'unknown' };\n  const docId = doc.docId;", () => 'const docId = first.projectId as string;')],
  ['a new Part grown from an app-filed page joins that set as a sibling', 'ED', (t) => t.replace("if (from && (!set || isAutoSet(set))) { const r = ensureDoc(from.id); if (!r.ok) return null; docId = r.docId; }", () => 'if (from && from.projectId) docId = from.projectId;')],
  ['ensureDoc makes a new set even for a set the writer made', 'ED', (t) => t.replace('if (set && !isAutoSet(set)) return { ok: true, docId: set.id, created: false };', () => '')],
  ['ensureDoc forgets the Drawer', 'ED', (t) => t.replace('set ? set.drawerId : undefined', () => 'undefined')],
  ['make-it-its-own-Doc keeps the old levels', 'OD', (t) => t.replace('const lvl = Math.max(0, p.level - run[0].level);', () => 'const lvl = p.level;')],
  ['a new Part follows the run\'s top, splitting its subsections from it', 'NP', (t) => t.replace("if (after && level <= after.level) { const end = runOf(parts.map(p => p.level), after.index)[1]; place = parts[end - 1].id; }", () => '')],
];
for (const [name, key, fn] of MUT) {
  const before = partsText, after = fn(partsText);
  const landed = after !== before;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, JSON.stringify({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}
{ // the DEF mutant: one of the four keys left out of the strip
  const after = defText.replace(/(\{[^}]*), lengthLimit, \.\.\.dress(\s*\})/, '$1, ...dress$2');
  ok('MUT pageDefaults forgets lengthLimit: it LANDED and DEF goes RED', after !== defText && !defStrips(after), '');
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-PARTS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-PARTS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
