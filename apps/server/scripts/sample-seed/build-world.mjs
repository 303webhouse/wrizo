// BUILD THE SAMPLE WORLD (Fable's sample-seed-rules.md). Input: the content file's text. Output: the records the app WOULD have pushed (drawers, projects/sets, journal entries incl.
// boards/pages/scripts/trash, story plans) + a report. It drives the app's own store (app-store.mjs) - createDrawer, createBinder, createBoardPage, the deck engine,
// addChildren, graftTo, saveScriptDoc, addFact - so a row is exactly the row the app writes. It never opens a database or a network connection.
//
// Rules in force (sample-seed-rules.md): 1 parenthetical notes are DATA (lifted off the text); 2 "the deck's prompt stands" = an empty body; 3 harness drops are LISTED
// (report.harnessDrops); 4 the deck registry is read live and the build FAILS if a deck has no board; 5 decks are dealt by the app's engine; 6 kindled = the writer's words,
// lit = `lit: true`, empty = untouched; 7 child cards use parentId and sit after their step; 8 page header attributes (template, kind, style guide, tags, starred, origin);
// 9 the "Martha" variant is left exactly as written; 10 words_written is reported, never lowered (the caller decides); 11 the thesis celebration firing is accepted.
import { parseContent, parseHeading, parseCardRows, parseTable, cleanBody, CONTENT_MD5 } from './parse-content.mjs';
import { loadAppStore } from './app-store.mjs';
import { createHash } from 'node:crypto';

const norm = (s) => String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const wordCount = (t) => { const m = String(t ?? '').trim().match(/\S+/g); return m ? m.length : 0; };
const stripParen = (s) => s.replace(/\s*\([^()]*\)\s*$/, '').trim();

/** The day-offset timestamps: the sample's writing life, ending a few days before "now". */
const day = (iso, h = 9, m = 0) => new Date(`${iso}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`).toISOString();

export async function buildWorld(md, opts = {}) {
  const md5 = createHash('md5').update(Buffer.from(md.replace(/\r\n?/g, '\n'), 'utf8')).digest('hex');
  const report = { md5, md5Matches: md5 === CONTENT_MD5, rows: {}, words: {}, harnessDrops: [], notes: [], failures: [] };
  const fail = (m) => { report.failures.push(m); };
  const app = opts.app || await loadAppStore();
  const secs = parseContent(md);
  const sec = (n) => secs.find((s) => s.n === n);
  const itemOf = (s, no) => s.items.find((i) => i.no === no);
  const newId = () => app.generateId();

  // ---- the live deck registry (rule 4) ----------------------------------------------------------------------------------------------------------------------------------------
  const deckByName = (name) => {
    const want = norm(name.replace(/\s+preset$/i, ''));
    return app.DECKS.find((d) => norm(app.deskTerm(d.nameTerm)) === want) || app.DECKS.find((d) => want.includes(norm(app.deskTerm(d.nameTerm))) || norm(app.deskTerm(d.nameTerm)).includes(want));
  };
  const boardsOfDeck = new Map();   // deck id -> board titles
  const answerFor = (deck, word) => {
    if (!deck.questions.length || deck.questions[0].kind === 'pages') return {};
    if (!word) return {};
    const q = deck.questions[0];
    const o = q.options.find((x) => norm(app.deskTerm(x.labelTerm)) === norm(word));
    if (!o) { fail(`deck ${deck.id}: no option "${word}" (has ${q.options.map((x) => app.deskTerm(x.labelTerm)).join('/')})`); return {}; }
    return { [q.id]: o.id };
  };

  // ---- sets, drawers, pages ---------------------------------------------------------------------------------------------------------------------------------------------------
  const world = { drawers: {}, sets: {}, boards: {}, pages: {}, pagesByTitle: new Map(), cards: new Map() };
  const mkDrawerAndSet = (drawerName, setName, kind, type, when) => {
    const d = app.createDrawer(drawerName);
    const set = app.createBinder(setName, kind, d.id, type);
    world.drawers[drawerName] = d; world.sets[drawerName] = set;
    return { d, set };
  };

  // ordering: one running index per set so the Pages pop-out's Order is the writer's order
  const orderCounter = new Map();
  const nextOrder = (setId) => { const n = (orderCounter.get(setId) ?? 0) + 1; orderCounter.set(setId, n); return n; };

  /** Turn a content page body into the text the app stores. */
  const bodyText = (lines, { title, headings, kind }) => {
    const clean = cleanBody(lines);
    const out = [];
    for (let l of clean) {
      if (/^\*\(opening paragraph[^)]*\)\*\s*/.test(l)) { l = l.replace(/^\*\(opening paragraph[^)]*\)\*\s*/, ''); report.notes.push('opening-paragraph marker lifted'); }
      const hm = /^\*\*([^*].*?[^*]|[^*])\*\*$/.exec(l.trim());
      if (headings && hm) l = `## ${hm[1]}`;
      out.push(l);
    }
    let text = out.join('\n');
    if (kind === 'journal') return text;
    if (title) text = headings ? `# ${title}\n\n${text}` : `${title}\n\n${text}`;
    return text;
  };

  const pageItems = [];   // every created page, for the report
  const mkPage = ({ key, title, text, set, mode, template, pageKind, styleGuide, face, tags, starred, importedAt, origin, createdAt, pageType, deletedAt, strokes, orderIndex }) => {
    const pageSettings = {};
    if (template) pageSettings.template = template;
    if (pageKind) pageSettings.kind = pageKind;
    if (styleGuide) pageSettings.styleGuide = styleGuide;
    if (face) pageSettings.face = face;
    const seed = {
      text, createdAt, origin: origin ?? (set ? 'project' : 'journal'), source: 'page',
      ...(set ? { projectId: set.id } : {}),
      ...(pageType ? { pageType } : {}),
      ...(tags?.length ? { tags } : {}),
      ...(starred ? { starred: true } : {}),
      ...(deletedAt ? { deletedAt } : {}),
      ...(strokes ? { strokes } : {}),
      ...(orderIndex != null ? { orderIndex } : set ? { orderIndex: nextOrder(set.id) } : {}),
    };
    const e = app.createJournalPage(seed);
    if (Object.keys(pageSettings).length || importedAt) {
      const fresh = app.getJournalEntryIncludingDeleted(e.id);
      app.saveJournalEntry({ ...fresh, ...(Object.keys(pageSettings).length ? { pageSettings: { ...(fresh.pageSettings ?? {}), ...pageSettings } } : {}), ...(importedAt ? { importedAt } : {}) });
    }
    world.pages[key] = e.id;
    const arr = world.pagesByTitle.get(norm(title)) ?? []; arr.push({ key, id: e.id, drawer: set?.title }); world.pagesByTitle.set(norm(title), arr);
    pageItems.push({ key, title, words: wordCount(text) });
    return e;
  };

  // ---- decks -> boards --------------------------------------------------------------------------------------------------------------------------------------------------------
  /** Group an item's table lines into labelled tables: [{ label, rows }]. */
  const tablesOf = (body) => {
    const out = []; let label = ''; let cur = null;
    for (const l of body) {
      if (/^\|/.test(l)) { if (!cur) { cur = { label, lines: [] }; out.push(cur); } cur.lines.push(l); }
      else { cur = null; if (l.trim()) label = l.trim(); }
    }
    return out.map((t) => ({ label: t.label, rows: parseCardRows(t.lines) }));
  };

  const mkDeckBoard = ({ boardTitle, deckName, answerWord, set, tableRows, childTable, parentTitle, pageIds, createdAt }) => {
    const deck = deckByName(deckName);
    if (!deck) { fail(`no deck "${deckName}" in the registry`); return null; }
    const answers = answerFor(deck, answerWord);
    if (deck.id === 'from-my-pages') answers[deck.questions[0].id] = pageIds.join(',');
    const board = app.createBoardPage(set.id, boardTitle);
    const deal = app.materializeDeck(deck, answers, []);
    let boxes = deal.boxes;
    const texts = boxes.filter((b) => b.kind === 'text');
    // match rows to dealt cards by title, in order of occurrence (two "Source & Quote" cards, two "Scene Card"s)
    const used = new Set();
    const titleOfBox = (b) => (b.text || '').split('\n')[0];
    const bareOf = (t) => t.replace(/^Scene \d+:\s*/, '').replace(/\s*\(\d+\)\s*$/, '');
    const cardFor = (rowTitle) => {
      const want = norm(rowTitle);
      return texts.find((b) => !used.has(b.id) && (norm(titleOfBox(b)) === want || norm(bareOf(titleOfBox(b))) === want));
    };
    let nKindled = 0; let nLit = 0; let nEmpty = 0;
    for (const row of tableRows || []) {
      if (!/^\d+$/.test(String(row.n ?? '').trim()) && row.n != null) continue;   // "4-12 | ... | empty": the remaining cards stay as dealt
      const b = cardFor(row.title);
      if (!b) { fail(`board "${boardTitle}": no dealt card titled "${row.title}"`); continue; }
      used.add(b.id);
      if (row.kind === 'empty' || row.state === 'empty') { nEmpty++; continue; }
      b.text = `${titleOfBox(b)}\n${row.text}`;
      nKindled++;
      if (row.lit) { b.lit = true; nLit++; }
    }
    texts.forEach((b) => { if (!used.has(b.id)) nEmpty++; });
    // child cards under a step (rule 7): addChildren makes the parentId/seq/lane structure; the writer's title and words go on top
    if (childTable?.rows?.length) {
      const parent = texts.find((b) => norm(titleOfBox(b)) === norm(parentTitle));
      if (!parent) fail(`board "${boardTitle}": no parent step "${parentTitle}"`);
      else {
        const word = app.childWordOf(deck.id);
        const q = word ? app.deskTerm(`kidQ_${word}`) : '';
        const made = app.addChildren(boxes, parent.id, childTable.rows.length, { title: word || 'Scene', question: q, newId });
        boxes = made.boxes;
        // CLEAR SPACE (Fable, Oct 29): addChildren stacks the children over the parent's neighbours; a card must never cover another. They go in a row BELOW the whole grid, one column per
        // child, on the deck's own column x-positions. The clearance (0.17 of the page width) is generous because a card draws taller than its stored height once it carries a graft chip.
        {
          const tops = boxes.filter((b) => b.kind === 'text' && !b.parentId);
          const xs = [...new Set(tops.map((b) => b.x))].sort((a, b) => a - b);
          const bottom = Math.max(...tops.map((b) => b.y + b.h));
          made.added.forEach((c, i) => { c.x = xs[i % xs.length]; c.y = bottom + 0.17 + Math.floor(i / xs.length) * (parent.h + 0.02); });
        }
        made.added.forEach((c, i) => { const r = childTable.rows[i]; c.text = `${r.title}\n${r.text}`; world.cards.set(`${boardTitle}::${norm(r.title)}`, { boardKey: boardTitle, boxId: c.id }); });
        report.rows.childCards = (report.rows.childCards ?? 0) + made.added.length;
      }
    }
    boxes = app.withHomeView(boxes, app.doorHome('preset').homeView, newId);
    app.saveBoardBoxes(board.id, boxes);
    world.boards[boardTitle] = { id: board.id, deck: deck.id, boxes };
    // cards by "<board> · <card>" for the graft table (duplicates addressed "(n)")
    const seen = new Map();
    for (const b of boxes.filter((x) => x.kind === 'text')) {
      const t = norm(bareOf(titleOfBox(b))); const n = (seen.get(t) ?? 0) + 1; seen.set(t, n);
      world.cards.set(`${boardTitle}::${t}#${n}`, { boardKey: boardTitle, boxId: b.id });
      world.cards.set(`${boardTitle}::${norm(titleOfBox(b))}`, { boardKey: boardTitle, boxId: b.id });
    }
    (boardsOfDeck.get(deck.id) ?? boardsOfDeck.set(deck.id, []).get(deck.id)).push(boardTitle);
    report.rows.boards = (report.rows.boards ?? 0) + 1;
    report.rows[`board:${boardTitle}`] = `${deck.id} (${deal.dealtIds.length} cards; kindled ${nKindled}, lit ${nLit}, untouched ${nEmpty})`;
    return { board, deal, boxes, deck };
  };

  // ---- §1 THE FERRY LETTERS -----------------------------------------------------------------------------------------------------------------------------------------------------
  const s1 = sec(1);
  const { set: set1 } = mkDrawerAndSet('The Ferry Letters', 'Draft one', 'book', 'creative');
  const t11 = tablesOf(itemOf(s1, '1.1').body);
  mkDeckBoard({ boardTitle: 'Three-Act', deckName: 'Three-Act Structure', answerWord: 'Novel', set: set1, tableRows: t11[0].rows, childTable: t11[1], parentTitle: 'Midpoint Reversal' });
  // Cast: the self cards by character, then the two Relationship cards
  {
    const rows = tablesOf(itemOf(s1, '1.2').body).flatMap((t) => t.rows);
    mkDeckBoard({ boardTitle: 'Cast', deckName: 'Character Study', answerWord: 'Three', set: set1, tableRows: rows.map((r) => ({ ...r, n: null })) });
  }
  mkDeckBoard({ boardTitle: 'Harrow Sound', deckName: 'Worldbuilding', answerWord: 'Other', set: set1, tableRows: tablesOf(itemOf(s1, '1.3').body)[0].rows.map((r) => ({ ...r, n: null })) });
  // the W3 decks' small boards (1.7) and 'From my pages' (built after the pages exist)
  const sub = (s, name) => s.items.find((i) => i.sub && norm(i.heading).includes(norm(name)));
  const smallBoards = [];
  const addSmall = (s, set, title, deckName, ans) => {
    const it = sub(s, title); if (!it) { fail(`no sub-board "${title}"`); return; }
    smallBoards.push({ s, set, title: parseHeading(it.rawLine.replace(/\*\*/g, '')).title || title, deckName, ans, it });
  };
  addSmall(s1, set1, "Hero's Journey", "Hero's Journey", 'Novel');
  addSmall(s1, set1, 'Story Circle', 'Story Circle', null);
  addSmall(s1, set1, 'Fifteen Beats', 'Feature Screenplay', 'Novel');
  addSmall(s1, set1, 'Scene', 'Scene–Sequel', 'One');
  for (const sb of smallBoards) {
    const rows = parseCardRows(sb.it.body);
    mkDeckBoard({ boardTitle: sb.title, deckName: sb.deckName, answerWord: sb.ans, set: sb.set, tableRows: rows });
  }

  // pages of the novel: act order, then writing order
  const actRank = (attrs) => (/Act III/.test(attrs[0]) ? 3 : /Act II/.test(attrs[0]) ? 2 : /Act I/.test(attrs[0]) ? 1 : 4);
  const pageDefs1 = s1.items.filter((i) => i.level === 4 && /^Page:/.test(i.heading)).map((i, idx) => ({ i, idx, h: parseHeading(i.heading.replace(/^Page:\s*/, '')) }));
  pageDefs1.sort((a, b) => actRank(a.h.attrs) - actRank(b.h.attrs) || a.idx - b.idx);
  const base1 = new Date('2026-09-02T08:00:00.000Z').getTime();
  pageDefs1.forEach(({ i, h }, k) => {
    const research = h.attrs.some((a) => /Research page kind/i.test(a));
    const imported = h.attrs.some((a) => /imported stamp/i.test(a));
    const loose = h.attrs.some((a) => /^loose/i.test(a));
    mkPage({
      key: `n:${h.title}`, title: h.title.replace(/\s*\(not placed\)\s*$/, ''), set: set1, tags: h.tags, starred: h.starred,
      text: bodyText(i.body, { title: h.title.replace(/\s*\(not placed\)\s*$/, ''), headings: false }),
      pageKind: research ? 'research' : undefined, importedAt: imported ? day('2026-09-20', 10) : undefined,
      origin: loose ? 'journal' : 'project', createdAt: new Date(base1 + k * 86400000 * 2).toISOString(),
    });
  });
  // the Bible (seven facts)
  {
    const bibleLines = itemOf(s1, '1.5').body.filter((l) => /^\d+\.\s/.test(l)).map((l) => l.replace(/^\d+\.\s*/, '').replace(/\*/g, ''));
    if (bibleLines.length !== 7) fail(`Bible: ${bibleLines.length} facts, expected 7`);
    bibleLines.forEach((f) => app.addFact(set1.id, f));
    report.rows.bibleFacts = bibleLines.length;
  }
  // From my pages: one card per page, in the writer's order
  {
    const order = ['The six o\'clock ferry', 'Chapel Lane', 'The blue boat', 'The fog', 'The kettle scene', 'Skerry Point', 'The lamp room', 'Tuesday'];
    const ids = order.map((t) => { const p = world.pagesByTitle.get(norm(t)); if (!p) { fail(`From my pages: no page "${t}"`); return null; } return p[0].id; }).filter(Boolean);
    const made = mkDeckBoard({ boardTitle: 'From my pages', deckName: 'From my pages', answerWord: null, set: set1, tableRows: [], pageIds: ids });
    if (made) for (const g of made.deal.grafts) app.graftTo({ entryId: made.board.id, boxId: g.boxId }, { entryId: g.entryId });
  }

  // ---- §2 LOW WATER ------------------------------------------------------------------------------------------------------------------------------------------------------------
  const s2 = sec(2);
  const { set: set2 } = mkDrawerAndSet('Low Water', 'Draft one', 'screenplay', 'creative');
  mkDeckBoard({ boardTitle: 'Beat sheet', deckName: 'Feature Screenplay', answerWord: 'Feature', set: set2, tableRows: tablesOf(itemOf(s2, '2.1').body)[0].rows });
  const scriptDoc = (lines) => {
    const els = []; const L = cleanBody(lines);
    let i = 0;
    const isScene = (l) => /^(INT\.|EXT\.|INT\.?\/EXT\.|I\/E\.)/.test(l);
    const isTrans = (l) => /^(FADE IN:|FADE OUT\.?|CUT TO:|SMASH CUT TO:|DISSOLVE TO:|.*\bTO:)$/.test(l);
    const isCue = (l) => /^[A-Z][A-Z0-9 .'’\-]*(\s*\((CONT'D|CONT’D|V\.O\.|O\.S\.|O\.C\.)\))?$/.test(l) && !isScene(l) && !isTrans(l);
    while (i < L.length) {
      const l = L[i];
      if (!l.trim()) { i++; continue; }
      // the opening "FADE IN:" is dropped (Fable, Oct 29): a script opens on its first scene heading, so the app does not have to make an empty one above a leading transition
      if (els.length === 0 && /^FADE IN:?$/.test(l.trim())) { i++; continue; }
      if (isScene(l)) { els.push(app.newElement('scene', l)); i++; continue; }
      if (isTrans(l)) { els.push(app.newElement('transition', l)); i++; continue; }
      if (isCue(l) && i + 1 < L.length && L[i + 1].trim()) {
        els.push(app.newElement('character', l)); i++;
        while (i < L.length && L[i].trim()) {
          const t = L[i];
          els.push(app.newElement(/^\(.*\)$/.test(t) ? 'paren' : 'dialogue', t)); i++;
        }
        continue;
      }
      // an action paragraph: the lines up to the next blank
      const para = []; while (i < L.length && L[i].trim()) { para.push(L[i]); i++; }
      els.push(app.newElement('action', para.join(' ')));
    }
    return { v: 1, scenes: app.groupIntoScenes(els) };
  };
  const mkScript = (key, title, body, k) => {
    const doc = scriptDoc(body);
    const e = mkPage({ key, title, text: '', set: set2, pageType: 'script', createdAt: day(`2026-10-${String(2 + k).padStart(2, '0')}`, 9) });
    app.saveScriptDoc(e.id, doc);
    // the page is TITLED by its text's first line, and a script's text is the shadow of its scenes: the title goes in front of the shadow (the page still opens on the first scene heading)
    const saved = app.getJournalEntryIncludingDeleted(e.id);
    app.saveJournalEntry({ ...saved, text: `${title}\n\n${saved.text}` });
    return { e, doc };
  };
  const mkTitlePage = (key, set, body, createdAt, fields) => {
    const text = app.serializeTitlePage(fields);
    return mkPage({ key, title: key.replace(/^t:/, ''), text, set, template: 'title', createdAt });
  };
  mkTitlePage('t:Title page', set2, null, day('2026-10-01', 9), { contact: ['First draft · Harrow, October'], words: 'an original screenplay', title: 'LOW WATER', author: '[the sample writer]' });
  const sc1 = mkScript('s:LOW WATER', 'LOW WATER', itemOf(s2, '2.2').body, 1);
  const sc2 = mkScript('s:LOW WATER — sequence two', 'LOW WATER — sequence two', itemOf(s2, '2.5').body, 4);
  mkPage({ key: 'p:Pitch notes', title: 'Pitch notes', set: set2, tags: ['pitch'], text: bodyText(itemOf(s2, '2.4').body, { title: 'Pitch notes' }), createdAt: day('2026-09-28', 20) });
  report.rows.scriptScenes = sc1.doc.scenes.length + sc2.doc.scenes.length;

  // ---- §3 THE THESIS -----------------------------------------------------------------------------------------------------------------------------------------------------------
  const s3 = sec(3);
  const { set: set3 } = mkDrawerAndSet('Thesis', 'Chapters', 'thesis', 'academic');
  const t31 = tablesOf(itemOf(s3, '3.1').body);
  mkDeckBoard({ boardTitle: 'Thesis plan', deckName: 'Thesis / Dissertation', answerWord: 'Humanities', set: set3, tableRows: t31[0].rows, childTable: t31[1], parentTitle: 'Chapter One' });
  for (const t of ['IMRaD: the count', 'Argument: the refusal']) {
    const it = sub(s3, t); if (!it) { fail(`no sub-board ${t}`); continue; }
    mkDeckBoard({ boardTitle: t, deckName: /IMRaD/i.test(t) ? 'Research Paper (IMRaD)' : 'Argumentative Essay', answerWord: /IMRaD/i.test(t) ? null : 'Short', set: set3, tableRows: parseCardRows(it.body) });
  }
  const chicago = { pageKind: 'research', styleGuide: 'chicago' };
  const outlineText = (body) => cleanBody(body).filter((l) => l.trim()).map((l) => l.replace(/^(\t*)- /, '$1')).join('\n');
  const biblioText = (body) => cleanBody(body).filter((l) => l.trim()).join('\n');
  const thesisOrder = [
    ['3.2', 'Title page'], ['3.3', 'Outline'], ['3.3b', null], ['3.4', null], ['3.5', null], ['3.5b', null], ['3.6', 'Bibliography'], ['3.7', null],
  ];
  thesisOrder.forEach(([no], k) => {
    const it = itemOf(s3, no); const h = parseHeading(it.heading.replace(/^\d+(\.\d+)?[a-z]?\s+/, '').replace(/^The page\s*/, ''));
    const createdAt = new Date(new Date('2026-08-20T09:00:00.000Z').getTime() + k * 86400000 * 4).toISOString();
    if (no === '3.2') {
      mkPage({ key: 't:Title page@thesis', title: 'Title page', set: set3, template: 'title', createdAt,
        text: app.serializeTitlePage({ contact: ['A thesis submitted for the degree of Master of Arts', 'Department of English', '[the sample university]', 'October'], words: '', title: 'THE HOUR REPLACES THE DAY: Railway timetables and the shape of time in the mid-Victorian novel', author: '[the sample writer]' }) });
    } else if (no === '3.3') mkPage({ key: 'p:Outline', title: 'Outline', set: set3, template: 'outline', text: outlineText(it.body), createdAt });
    else if (no === '3.6') mkPage({ key: 'p:Bibliography', title: 'Bibliography', set: set3, template: 'bibliography', text: biblioText(it.body), createdAt });
    else if (no === '3.7') mkPage({ key: `p:${h.title}`, title: h.title, set: set3, tags: h.tags, text: bodyText(it.body, { title: h.title }), createdAt });
    else mkPage({ key: `p:${h.title}`, title: h.title, set: set3, tags: h.tags, ...chicago, text: bodyText(it.body, { title: h.title, headings: true }), createdAt });
  });

  // ---- §4 THE GRANT ------------------------------------------------------------------------------------------------------------------------------------------------------------
  const s4 = sec(4);
  const { set: set4 } = mkDrawerAndSet('Lamp Room Readers', 'Proposal', 'proposal', 'professional');
  mkDeckBoard({ boardTitle: 'Grant', deckName: 'Grant Application', answerWord: 'Foundation', set: set4, tableRows: tablesOf(itemOf(s4, '4.1').body)[0].rows });
  { const it = sub(s4, 'Bread box'); if (!it) fail('no sub-board Bread box'); else mkDeckBoard({ boardTitle: 'Bread box', deckName: 'Business Proposal', answerWord: null, set: set4, tableRows: parseCardRows(it.body) }); }
  const crimson = { name: 'Crimson Pro', generic: 'serif', source: 'bundled' };
  ['4.2', '4.3', '4.4', '4.5', '4.6', '4.7'].forEach((no, k) => {
    const it = itemOf(s4, no); const h = parseHeading(it.heading.replace(/^\d+(\.\d+)?[a-z]?\s+/, '').replace(/^The page\s*/, ''));
    const createdAt = new Date(new Date('2026-09-14T09:00:00.000Z').getTime() + k * 86400000 * 2).toISOString();
    if (no === '4.7') { mkPage({ key: `p:${h.title}`, title: h.title, set: set4, template: 'outline', tags: h.tags, text: outlineText(it.body), createdAt }); return; }
    let text = bodyText(it.body, { title: no === '4.2' ? null : h.title, headings: no === '4.2' });
    if (no === '4.2') {
      // the title line is a heading; the face stretches over it as a font span (Figtree), the page face is Crimson Pro
      text = text.replace(/^## (.*)$/m, (_m, t) => `# [${t.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}]{.font-figtree}`);
      report.harnessDrops.push({ tag: 'size span (opening paragraph at 14 pt)', why: 'the selection-size span is not on main yet; the paragraph is stored at the page size' });
    }
    if (no === '4.4') report.harnessDrops.push({ tag: 'Revise error mark (the doubled "with with")', why: 'a local-only mark, not stored; the doubled word is in the text' });
    mkPage({ key: `p:${h.title}`, title: h.title, set: set4, tags: h.tags, text, createdAt, face: no === '4.2' ? crimson : undefined });
  });

  // ---- §5 THE FEATURE STORY -----------------------------------------------------------------------------------------------------------------------------------------------------
  const s5 = sec(5);
  const { set: set5 } = mkDrawerAndSet('The Last Keeper', 'Feature', 'article', 'professional');
  mkDeckBoard({ boardTitle: 'Feature', deckName: 'Feature Story', answerWord: 'Profile', set: set5, tableRows: tablesOf(itemOf(s5, '5.1').body)[0].rows });
  ['5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9'].forEach((no, k) => {
    const it = itemOf(s5, no); const h = parseHeading(it.heading.replace(/^\d+(\.\d+)?[a-z]?\s+/, '').replace(/^The page\s*/, ''));
    const research = h.attrs.some((a) => /Research kind/i.test(a)); const imported = h.attrs.some((a) => /Import stamp/i.test(a));
    mkPage({ key: `p:${h.title}`, title: h.title, set: set5, tags: h.tags, pageKind: research ? 'research' : undefined, importedAt: imported ? day('2026-10-05', 11) : undefined,
      text: bodyText(it.body, { title: h.title, headings: false }), createdAt: new Date(new Date('2026-10-03T09:00:00.000Z').getTime() + k * 86400000).toISOString() });
  });
  report.harnessDrops.push({ tag: 'quotation "— source" slot (Source pages)', why: 'the slot is not live; the quotations are kept as quotations' });
  report.harnessDrops.push({ tag: 'Import stamp (Source: the harbour notice / the coastguard notice)', why: 'stored as importedAt; the quiet "Imported" tag is checked only where the header shows it' });
  report.harnessDrops.push({ tag: 'the source-page dock beside the story', why: 'the dock has not shipped' });

  // ---- §6 THE JOURNAL, §7 THE TRASH ------------------------------------------------------------------------------------------------------------------------------------------------
  const s6 = sec(6);
  const jdays = { '6.1': '2026-10-19', '6.2': '2026-10-20', '6.3': '2026-10-21', '6.4': '2026-10-22', '6.6': '2026-10-24', '6.6b': '2026-10-25' };
  for (const [no, d] of Object.entries(jdays)) {
    const it = itemOf(s6, no); const h = parseHeading(it.heading.replace(/^\d+(\.\d+)?[a-z]?\s+/, ''));
    mkPage({ key: `j:${no}`, title: `Journal ${no}`, set: null, tags: h.tags, origin: 'journal', text: bodyText(it.body, { kind: 'journal' }), createdAt: day(d, 6, 40), orderIndex: undefined });
  }
  // the ink card (rule: a short stroke list, a dozen polylines)
  {
    const P = (pts) => ({ points: pts.map(([x, y]) => ({ x, y, p: 0.5 })) });
    const strokes = [
      P([[0.10, 0.50], [0.18, 0.46], [0.26, 0.47], [0.34, 0.44]]),                // the quay
      P([[0.34, 0.44], [0.36, 0.40], [0.40, 0.38], [0.43, 0.41], [0.41, 0.45], [0.36, 0.45]]),   // Skerry Point
      P([[0.43, 0.41], [0.52, 0.36], [0.60, 0.33]]),                                // the channel to Holm
      P([[0.60, 0.33], [0.64, 0.28], [0.70, 0.27], [0.72, 0.32], [0.67, 0.35], [0.61, 0.34]]),  // Holm
      P([[0.45, 0.50], [0.47, 0.52]]), P([[0.46, 0.50], [0.46, 0.53]]),             // the sandbank: crosses
      P([[0.50, 0.52], [0.52, 0.54]]), P([[0.51, 0.52], [0.51, 0.55]]),
      P([[0.55, 0.53], [0.57, 0.55]]), P([[0.56, 0.53], [0.56, 0.56]]),
      P([[0.08, 0.60], [0.30, 0.64], [0.55, 0.62], [0.80, 0.66]]),                 // the shore line
    ];
    mkPage({ key: 'j:ink', title: 'Sound, from memory', set: null, origin: 'journal', text: 'Sound, from memory', strokes, createdAt: day('2026-10-23', 7, 10) });
    report.rows.inkStrokes = strokes.length;
  }
  {
    const it = itemOf(sec(7), '7.1'); const h = parseHeading(it.heading.replace(/^\d+(\.\d+)?[a-z]?\s+/, ''));
    mkPage({ key: 'j:trash', title: 'Journal Friday (deleted)', set: null, tags: h.tags, origin: 'journal', text: bodyText(it.body, { kind: 'journal' }), createdAt: day('2026-10-23', 6, 40), deletedAt: day('2026-10-24', 8, 5) });
  }

  // ---- §8 THE GRAFTS (the page's side) -------------------------------------------------------------------------------------------------------------------------------------------
  {
    const rows = parseTable(itemOf(sec(8), '8.1').body).slice(1);
    let n = 0;
    const findPage = (name) => { const t = norm(stripParen(name.replace(/\*/g, ''))); const a = world.pagesByTitle.get(t); if (!a || a.length !== 1) { fail(`graft: page "${name}" ${a ? 'is ambiguous' : 'not found'}`); return null; } return a[0].id; };
    const findCard = (ref) => {
      const cleaned = ref.replace(/\*/g, '').trim();
      const [b, ...rest] = cleaned.split(' · ');
      const cardTitle = rest.join(' · ');
      if (!cardTitle) return null;
      const occ = /\((\d)\)\s*$/.exec(cardTitle);
      const t = norm(cardTitle.replace(/\s*\(\d\)\s*$/, ''));
      const boardKey = Object.keys(world.boards).find((k) => norm(k) === norm(b));
      if (!boardKey) { fail(`graft: no board "${b}"`); return null; }
      const hit = world.cards.get(`${boardKey}::${t}${occ ? `#${occ[1]}` : '#1'}`) || world.cards.get(`${boardKey}::${t}`);
      if (!hit) { fail(`graft: no card "${cardTitle}" on "${boardKey}"`); return null; }
      return { entryId: world.boards[boardKey].id, boxId: hit.boxId };
    };
    for (const r of rows) {
      const [pageCell, toCell, kindCell] = r;
      if (/none/i.test(toCell)) continue;
      const pageNames = pageCell.split(';').map((s) => s.trim()).filter(Boolean);
      const targets = toCell.split(';').map((s) => s.trim()).filter(Boolean);
      const kinds = kindCell.replace(/\([^)]*\)/g, '').split(';').map((s) => s.trim());
      targets.forEach((tg, i) => {
        const kind = kinds[i] ?? kinds[kinds.length - 1] ?? '';
        const cardToPage = /^card/i.test(kind);
        for (const pn of pageNames) {
          const pid = findPage(pn); if (!pid) continue;
          let made = null;
          if (/·/.test(tg)) {
            const c = findCard(tg); if (!c) continue;
            made = cardToPage ? app.graftTo({ entryId: c.entryId, boxId: c.boxId }, { entryId: pid }) : app.graftTo({ entryId: pid }, c);
          } else {
            const other = findPage(tg); if (!other) continue;
            made = app.graftTo({ entryId: pid }, { entryId: other });
          }
          if (made) n++; else fail(`graft not made: "${pn}" -> "${tg}" (${kind})`);
        }
      });
    }
    report.rows.grafts = n;
  }

  // ---- the rule-4 gate: every deck in the live registry has a board ----------------------------------------------------------------------------------------------------------------
  for (const d of app.DECKS) if (!boardsOfDeck.has(d.id)) fail(`rule 4: deck "${d.id}" has no board`);
  report.decksCovered = app.DECKS.map((d) => ({ deck: d.id, boards: boardsOfDeck.get(d.id) ?? [] }));

  // ---- what the app would push ------------------------------------------------------------------------------------------------------------------------------------------------------
  const dirty = app.getDirtyRecords();
  const isSys = (e) => !!app.getSystemKind(e);
  const records = {
    drawers: dirty.drawers,
    projects: dirty.projects,
    journalEntries: dirty.journalEntries.filter((e) => !isSys(e)),
    storyPlans: dirty.storyPlans,
  };
  report.systemBoardsDropped = dirty.journalEntries.filter(isSys).length;
  for (const [k, v] of Object.entries(records)) report.rows[k] = v.length;
  // the measured seeded count: whitespace tokens of `text` (what the server counts) and of the whole content (cards and labels too)
  report.words.pageText = records.journalEntries.reduce((n, e) => n + wordCount(e.text), 0);
  report.words.cardText = records.journalEntries.reduce((n, e) => n + (e.boxes ?? []).filter((b) => b.kind === 'text').reduce((m, b) => m + wordCount(b.text), 0), 0);
  report.words.bible = records.projects.reduce((n, p) => n + ((p.tutor?.facts ?? []).reduce((m, f) => m + wordCount(f.text), 0)), 0);
  report.words.total = report.words.pageText + report.words.cardText + report.words.bible;
  return { records, report, world };
}
