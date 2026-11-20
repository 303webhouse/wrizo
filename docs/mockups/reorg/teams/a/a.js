/*
  Wrizo reorg · Machina · Team A, "The quiet desk" · a mockup, not app code.

  One of two competing redesigns of the prototype's look (the Wrizors' two-teams brief, Nov 20, 2026).
  The look changes. The content and the places do not.

  This file draws four states of the prototype again, with the same made-up content:
    #build   BUILD, Part 3 Methods            #sprint  the same, in SPRINT
    #split   "Open beside" on Ledger sample sheet      #dark    the same as #build, dark room
  It reads the prototype's data.js and stage-table.js as they are and edits neither.
  The prototype's app.js is one closed script that draws into its own page, so it cannot be
  imported as a library; the few small helpers below (escaping, the stage table's cells) are
  written again here in the same way.

  Team A's bet: an overwhelmed writer needs fewer things on screen at once. Show the page and
  the one menu she is using. Bring everything else back the instant she asks.

  Not redrawn here (they work as in the prototype, and each says so when pressed): the search
  and its results, a Board on its own, FINALIZE's whole-Doc page, the insides of the rail's
  drawers beyond their first screen.

  State lives in memory; a reload starts over. Nothing is saved.
*/
(function () {
  'use strict';

  var D = window.REORG_DATA, T = window.REORG_STAGE_TABLE || null;
  var shell = document.getElementById('shell');
  var el = {};
  ['bar', 'rail', 'pop', 'menus', 'page', 'foot', 'beside', 'drop', 'changed', 'float', 'chip', 'tip', 'toast'].forEach(function (k) {
    el[k] = document.getElementById(k);
  });
  el.rnpop = document.getElementById('rn-pop');

  var PROJECT = D.projects[0];            // Thesis
  var DOC = PROJECT.docs[0];              // Harbor Tolls, 1890 to 1912
  var PARTS = DOC.partList;

  var STAGES = (function () {
    var list = T && T.stages ? T.stages.filter(function (s) { return s && s.key && s.shown !== false; }).map(function (s) { return s.key; }) : [];
    return list.length ? list : ['SPRINT', 'BUILD', 'EDIT', 'FINALIZE'];
  })();
  var STAGE_ROWS = [['front', 'TEXT'], ['front', 'INK'], ['front', 'PARTS'], ['front', 'THE SESSION'],
    ['back', 'PLAN'], ['back', 'ASSETS'], ['back', 'FEEDBACK']];

  /* PROPOSED sort of the PARTS tab's offers into two levels. The acts that work on the Part she is in sit
     with that Part: three in a row, the rest under "More". Every other offer of the tab works on the whole
     Doc and sits at the tab's head. The three are the only Part acts offered in both BUILD and EDIT, so
     they keep the same spot in both stages. */
  var PART_ACTS = ['Split here', 'Join', 'Move', 'Name', 'Level', 'Colour', 'Make it its own Doc'];
  var PART_MAIN = ['Split here', 'Join', 'Move'];
  var SESSION_SLOTS = ['The goal', 'The timer', 'Progress'];

  var S;
  function fresh() {
    return {
      stage: 'BUILD',
      prevStage: null,
      dark: false,
      notes: true,                 // the review notes layer
      typing: false,               // SPRINT: the chrome goes faint as she types
      pin: false,                  // "Keep both open"
      front: { open: true, tab: 'parts' },
      back: { open: false, tab: 'assets', part: null, others: false },
      order: 'oldest',
      openParts: {},               // a Part's toggle, once she has pressed it; the Part she is in starts open
      pop: null,                   // a rail drawer: { kind, id }
      more: null,                  // the open "More" list, by its id
      partsDrop: false,
      changed: false,
      split: null,                 // { id, x }
      sw: { progress: true, quiet: false }
    };
  }
  S = fresh();
  var MORE = {};                   // what each "More" list holds, filled as the screen is drawn

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function plural(n, one, many) { return num(n) + ' ' + (n === 1 ? one : many); }
  function assetsOf(i) {
    return D.assets.filter(function (a) { return a.doc === DOC.id && (i === undefined || a.part === i); })
      .sort(function (x, y) { return x.order - y.order; });
  }
  function assetById(id) {
    for (var i = 0; i < D.assets.length; i++) { if (D.assets[i].id === id) { return D.assets[i]; } }
    return null;
  }
  function partLabel(i) { return 'Part ' + i + ' \u00b7 ' + PARTS[i - 1].name; }
  function isOpen(i) { return i in S.openParts ? S.openParts[i] : i === DOC.partHere; }

  var ICON = {
    docs: '<path d="M5.5 2.5h6l3 3v12h-9z"/><path d="M11.5 2.5v3h3"/>',
    projects: '<path d="M3.5 3.5h9v9h-9z"/><path d="M7.5 7.5h9v9h-9z"/>',
    unfiled: '<path d="M3 11.5l2-6h10l2 6v4.5h-14z"/><path d="M3 11.5h4l1 2h4l1-2h4"/>',
    theme: '<circle cx="10" cy="10" r="6.5"/><path d="M10 3.5v13"/>',
    controls: '<path d="M3 6h14M3 14h14"/><circle cx="7" cy="6" r="2"/><circle cx="13" cy="14" r="2"/>',
    list: '<path d="M3 5.5h14M3 10h14M3 14.5h14"/>',
    boxes: '<path d="M4 4h5v5h-5zM11 4h5v5h-5zM4 11h5v5h-5zM11 11h5v5h-5z"/>',
    file: '<path d="M4 4h12v12h-12z"/><path d="M10 7v6M7 10h6"/>',
    trash: '<path d="M4 6h12M8 6V4h4v2M5.5 6l1 10.5h7l1-10.5"/>',
    up: '<path d="M5 12.5l5-5 5 5"/>',
    down: '<path d="M5 7.5l5 5 5-5"/>',
    right: '<path d="M7.5 4.5l5.5 5.5-5.5 5.5"/>',
    left: '<path d="M12.5 4.5l-5.5 5.5 5.5 5.5"/>',
    search: '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.5 12.5l4.5 4.5"/>',
    link: '<path d="M8.2 11.8l3.6-3.6"/><path d="M9.6 6.4l1.3-1.3a3 3 0 014.2 4.2l-1.3 1.3"/><path d="M10.4 13.6l-1.3 1.3a3 3 0 01-4.2-4.2l1.3-1.3"/>',
    split: '<path d="M3 4.5h14v11h-14z"/><path d="M10 4.5v11"/>',
    changed: '<path d="M10 3v7M6.5 6.5h7M6.5 15h7"/>',
    cmd: '<path d="M4 6l5 4-5 4"/><path d="M11 15h6"/>',
    block: '<path d="M3.5 6h13v8h-13z"/>',
    pin: '<path d="M7.5 3.5h5l.5 5 2 2.5h-10l2-2.5z"/><path d="M10 11v5.5"/>',
    dots: '<circle cx="10" cy="4.5" r="1.1"/><circle cx="10" cy="10" r="1.1"/><circle cx="10" cy="15.5" r="1.1"/>'
  };
  function svg(name, size, width, cls) {
    return '<svg aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + ' width="' + size + '" height="' + size + '" viewBox="0 0 20 20" fill="' + (name === 'dots' ? 'currentColor' : 'none') +
      '" stroke="currentColor" stroke-width="' + (width || 1.5) + '">' + ICON[name] + '</svg>';
  }
  var KIND_ICON = { PDF: 'docs', BOARD: 'boxes', BLOCK: 'block', DOC: 'docs' };
  function kind(k) { return '<span class="kind">' + svg(KIND_ICON[k] || 'docs', 11, 1.7) + k + '</span>'; }
  function links(n) { return '<span class="links">' + svg('link', 13, 1.5) + '<span>' + n + '</span></span>'; }

  /* A Part's colour tag: the first letter of its name on the Part's colour. No colour, no tag.
     where: 'bar' (the dark bar), 'page' (the page is paper in both rooms), or nothing (a panel). */
  function ptag(part, where) {
    var c = part && part.tag ? part.tag.colour : null;
    if (!c) { return where ? '' : '<span class="ptag none" aria-hidden="true"></span>'; }
    return '<span class="ptag ptag-' + c + (where ? ' on-' + where : '') + '" aria-hidden="true">' + esc(part.name.charAt(0).toUpperCase()) + '</span>';
  }
  function tint(part) { return ' tint-' + (part && part.tag ? part.tag.colour : 'none'); }
  function hereBar() { return '<span class="here-bar" aria-hidden="true"></span>'; }

  /* A review note: a small dashed flag. mark: 'NR' NOT RULED · 'P' PROPOSED · 'D' [DATA]. */
  function rn(mark, text, cls, style) {
    var word = mark === 'NR' ? 'NOT RULED' : mark === 'P' ? 'PROPOSED' : '[DATA]';
    return '<button type="button" class="rn' + (cls ? ' ' + cls : '') + '"' + (style ? ' style="' + style + '"' : '') +
      ' data-rn="' + esc(text) + '" data-mark="' + word + '" aria-label="Review note, ' + word + ': ' + esc(text) + '">' + mark + '</button>';
  }

  /* ---------- the stage table ---------- */

  function stageOf(key) {
    var list = T && T.stages ? T.stages : [];
    for (var i = 0; i < list.length; i++) { if (list[i] && list[i].key === key) { return list[i]; } }
    return { key: key };
  }
  function stageCell(menu, row, key) {
    var r = T && T.onAPage && T.onAPage[menu] ? T.onAPage[menu][row] : null, c = r ? r[key] : null;
    if (!c) { return { offers: [], note: '' }; }
    return {
      offers: (c.offers || []).map(function (o) { return typeof o === 'string' ? { say: o } : o; })
        .filter(function (o) { return o && typeof o.say === 'string' && o.say; }),
      note: c.note || ''
    };
  }
  function splitOffered() { return stageOf(S.stage).split !== false; }
  function sameSay(a, b) { return !!a && !!b && a.say.trim().toLowerCase() === b.say.trim().toLowerCase(); }
  function findSay(list, o) {
    for (var i = 0; i < list.length; i++) { if (sameSay(list[i], o)) { return list[i]; } }
    return null;
  }
  function rowDiff(menu, row, from, to) {
    var a = stageCell(menu, row, from), b = stageCell(menu, row, to), out = { gained: [], lost: [] };
    b.offers.forEach(function (o) { if (!findSay(a.offers, o)) { out.gained.push(o); } });
    a.offers.forEach(function (o) { if (!findSay(b.offers, o)) { out.lost.push(o); } });
    return out;
  }

  /* An offer as a button. off: not offered in this stage, faded in place. */
  function offerBtn(say, off, detail, cls) {
    return '<button type="button" class="btn' + (cls ? ' ' + cls : '') + '" data-act="offer" data-say="' + esc(say) + '"' +
      (detail ? ' data-tip="' + esc(detail) + '"' : '') + (off ? ' disabled' : '') + '>' + esc(say) + '</button>';
  }
  /* "More": the rest of a group, one click away. With nothing under it in this stage, it fades in place. */
  function moreBtn(id, items) {
    MORE[id] = items;
    var open = S.more === id;
    return '<button type="button" class="more" data-act="more" data-id="' + id + '" data-anchor="' + id + '" aria-haspopup="menu" aria-expanded="' + open + '"' +
      (items.length ? '' : ' disabled') + '>More' + svg('down', 10, 2) + '</button>';
  }
  function asItems(offers) { return offers.map(function (o) { return { say: o.say, detail: o.detail || '' }; }); }

  /* ---------- the top bar: two zones ---------- */

  function renderBar() {
    var part = PARTS[DOC.partHere - 1];
    var place = 'Part ' + DOC.partHere + ' of ' + PARTS.length + ' \u00b7 ' + part.name;
    var sep = '<span class="crumb-sep" aria-hidden="true">' + svg('right', 10, 2) + '</span>';
    var h = '<span class="brand"><span class="brand-word">WRIZO<span class="brand-mark"></span></span></span>' +
      /* Left, where I am: wide to narrow. The Project is Level 3, the Doc Level 2, the Part Level 1. */
      '<nav class="where" aria-label="Where you are">' +
      '<button type="button" class="crumb crumb-project" data-act="list" data-id="' + PROJECT.id + '" data-tip="The Project you are in"><span>' + esc(PROJECT.name) + '</span></button>' + sep +
      '<button type="button" class="crumb crumb-doc" data-act="later" data-note="Renaming from the top bar is not part of this prototype."><span>' + esc(DOC.name) + '</span></button>' + sep +
      '<button type="button" class="crumb crumb-part' + (S.partsDrop ? ' is-open' : '') + '" data-act="parts-drop" aria-expanded="' + S.partsDrop + '" data-tip="All the Parts of this doc">' +
      ptag(part, 'bar') + '<span>' + esc(place) + '</span><span class="crumb-v" aria-hidden="true">' + svg('down', 10, 2) + '</span></button>' +
      rn('P', 'The top bar has two zones. Left, where I am: Project, then Doc, then Part, each a level stronger, and the Part wears its colour tag. Right, the stages.') +
      '</nav><span class="bar-spring"></span>' +
      /* Right, the stages. The strip keeps its own NOT RULED tag, always in view (Fable's ruling). */
      '<div class="stages' + (S.split ? ' is-faded' : '') + '"' + (S.split ? ' data-tip="In a split you stay in ' + S.stage + '. Close the asset\u2019s side to change stage."' : '') + '>' +
      '<span class="stages-tag" data-tip="The stages, and what each one offers, are NOT RULED."><span class="tag">NOT RULED</span></span>';
    STAGES.forEach(function (s) {
      var st = stageOf(s);
      h += '<button type="button" class="stage-btn' + (s === S.stage ? ' is-here' : '') + '" data-act="stage" data-id="' + esc(s) + '"' + (s === S.stage ? ' aria-current="true"' : '') +
        (S.split ? ' disabled' : st.job ? ' data-tip="' + esc(st.job) + '"' : '') + '>' + esc(s) + '</button>';
    });
    h += '</div><span class="bar-div" aria-hidden="true"></span><div class="bar-tools">' +
      '<button type="button" class="bar-icon" data-act="changed" aria-expanded="' + S.changed + '" aria-label="What changed" data-tip="What changed">' + svg('changed', 16, 1.6) + '</button>' +
      '<button type="button" class="bar-icon" data-act="later" data-note="The command line is drawn as in the frames and does nothing in this prototype." aria-label="Command line, Ctrl+." data-tip="Command line|Ctrl+.">' + svg('cmd', 16, 1.6) + '</button>' +
      '<button type="button" class="bar-icon" data-act="search-bar" aria-label="Search, Ctrl+F" data-tip="Search|Ctrl+F">' + svg('search', 16, 1.6) + '</button>' +
      rn('P', 'What changed, the command line and search are icons. Their words and keys show when one is pointed at or reached with the Tab key.') +
      '</div>';
    el.bar.innerHTML = h;
  }

  /* The Part's place in the top bar drops the list of all Parts. */
  function renderDrop() {
    if (!S.partsDrop) { el.drop.innerHTML = ''; return; }
    var crumb = el.bar.querySelector('.crumb-part');
    var left = crumb ? Math.max(0, crumb.offsetLeft - 14) : 384;
    var h = '<section class="drop" aria-label="Parts of this doc" style="left: ' + left + 'px"><div class="drop-head head2">Parts of this doc</div>';
    PARTS.forEach(function (part, n) {
      var i = n + 1, here = i === DOC.partHere;
      h += '<button type="button" class="drop-row' + (here ? ' is-here' : '') + '" data-act="go-part" data-id="' + i + '"' + (here ? ' aria-current="true"' : '') + '>' + (here ? hereBar() : '') +
        '<span class="part-num">' + i + '</span>' + ptag(part) + '<span class="drop-name">' + esc(part.name) + '</span>' +
        '<span class="facts num">' + esc(part.count) + '</span></button>';
    });
    el.drop.innerHTML = h + '</section>';
  }

  /* ---------- the left rail ---------- */

  var RAIL_TINT = { pale: '#C3C8CD', grey: '#9AA1A8', blue: '#8FA9C4', yellow: '#CDB75A', brass: '#FF9800' };
  var PANEL_TINT = { pale: ['#C9CED3', '#1C1C1C'], grey: ['#6A727B', '#FFFFFF'], blue: ['#41658A', '#FFFFFF'], yellow: ['#B9A03A', '#1C1C1C'], brass: ['#FF9800', '#1C1C1C'] };
  function box(p, size, where) {
    var bg = where === 'rail' ? RAIL_TINT[p.colour] : PANEL_TINT[p.colour][0];
    var ink = where === 'rail' ? '#1E262E' : PANEL_TINT[p.colour][1];
    return '<span class="box box-' + size + '" style="background-color: ' + bg + '; color: ' + ink + '">' + esc(p.letters || '') + '</span>';
  }
  function isPop(kind, id) { return !!S.pop && S.pop.kind === kind && (S.pop.id || '') === (id || ''); }
  function railItem(kind, label, height) {
    var open = isPop(kind);
    return '<button type="button" class="rail-item h' + height + (open ? ' is-open' : '') + '" data-act="pop" data-id="' + kind + '" aria-expanded="' + open + '">' +
      svg(kind, 20, 1.2) + '<span class="rail-label">' + label + '</span></button>';
  }
  function renderRail() {
    var open = isPop('list', PROJECT.id);
    var h = '<button type="button" class="rail-here' + (open ? ' is-open' : '') + '" data-act="list" data-id="' + PROJECT.id + '" aria-expanded="' + open + '" aria-label="' + esc(PROJECT.name) + ', the Project you are in">' +
      '<span class="rail-here-bar"></span>' + box(PROJECT, '38', 'rail') + '<span class="rail-label lit">' + esc(PROJECT.name) + '</span></button>' +
      '<div class="rail-rule"></div><div class="rail-gap"></div><div class="pins"><div class="pins-grid">';
    D.projects.filter(function (p) { return p.pinned && p.id !== PROJECT.id; }).forEach(function (p) {
      var on = isPop('list', p.id);
      h += '<button type="button" class="pin-btn' + (on ? ' is-open' : '') + '" data-act="list" data-id="' + p.id + '" aria-expanded="' + on + '" aria-label="' + esc(p.name) + '" data-tip="' + esc(p.name) + '">' + box(p, '34', 'rail') + '</button>';
    });
    h += '</div></div><div class="pin-switch">' +
      '<button type="button" data-act="later" data-note="The pins as a list are in the prototype (index.html#pins-list). Not redrawn here." aria-label="Show pins as a list" aria-pressed="false">' + svg('list', 14, '2.0') + '</button>' +
      '<button type="button" data-act="later" data-note="The pins are shown as boxes." aria-label="Show pins as boxes" aria-pressed="true">' + svg('boxes', 14, '2.0') + '</button>' +
      '</div><div class="rail-rule"></div>' +
      railItem('docs', 'Docs', 58) + railItem('projects', 'Projects', 58) + railItem('unfiled', 'Unfiled', 58) +
      '<div class="rail-spring"></div><div class="rail-rule"></div>' +
      railItem('theme', 'Theme', 54) + railItem('controls', 'Controls', 54);
    el.rail.innerHTML = h;
  }

  /* ---------- the rail's drawers: the same places and words, in the three levels ---------- */

  var UNDRAWN = 'This place works as in the prototype. Team A redrew its first screen only.';
  function popShell(title, body, foot) {
    return '<section class="pop" aria-label="' + esc(title) + '"><div class="pop-head"><span class="pop-title">' + esc(title) + '</span></div>' +
      '<div class="pop-body">' + body + '</div>' + (foot || '') + '</section>';
  }
  function groupHead(text, extra) { return '<div class="group-head"><span class="head2">' + esc(text) + '</span>' + (extra || '') + '</div>'; }
  function newRow(label, meta) {
    return '<button type="button" class="new-row" data-act="later" data-note="' + UNDRAWN + '"><span class="plus" aria-hidden="true">+</span><span class="grow">' + esc(label) + '</span>' +
      (meta ? '<span class="facts">' + esc(meta) + '</span>' : '') + '</button>';
  }
  function switchRow(label, key, on, act) {
    return '<div class="set-row"><span>' + esc(label) + '</span>' +
      '<button type="button" class="switch" role="switch" aria-checked="' + on + '" aria-label="' + esc(label) + '" data-act="' + (act || 'switch') + '" data-id="' + key + '">' +
      '<span' + (on ? '' : ' class="is-set"') + '>OFF</span><span' + (on ? ' class="is-set"' : '') + '>ON</span></button></div>';
  }
  function docRow(p, d, meta) {
    var here = d.id === DOC.id;
    return '<div class="row' + (here ? ' is-here' : '') + '">' + (here ? hereBar() : '') +
      '<button type="button" class="row-main" data-act="open-doc" data-id="' + d.id + '"><span class="row-name">' + esc(d.name) + '</span>' +
      '<span class="facts">' + esc(meta) + '</span></button></div>';
  }
  function popDocs() {
    var b = groupHead('New doc') + newRow('Blank') + newRow('Screenplay') + newRow('Research paper') + newRow('More kinds') +
      groupHead('Or start with a board') + newRow('Board', 'no doc yet') + groupHead('Recent');
    D.recent.forEach(function (r) {
      var p = D.projects.filter(function (x) { return x.id === r.project; })[0];
      var d = p ? p.docs.filter(function (x) { return x.id === r.doc; })[0] : null;
      if (d) { b += docRow(p, d, p.name + ' \u00b7 ' + plural(d.words, 'word', 'words')); }
    });
    b += groupHead('Page defaults \u00b7 every doc') + switchRow('Progress bars', 'progress', S.sw.progress);
    return popShell('DOCS', b);
  }
  function projectRow(p) {
    var here = p.id === PROJECT.id;
    return '<div class="row' + (here ? ' is-here' : '') + '">' + (here ? hereBar() : '') + box(p, '30', 'panel') +
      '<button type="button" class="row-main" data-act="list" data-id="' + p.id + '"><span class="row-name">' + esc(p.name) + '</span>' +
      '<span class="facts">' + (p.isNotebook ? 'the journal \u00b7 ' : '') + plural(p.docs.length, 'doc', 'docs') + '</span></button>' +
      '<button type="button" class="icon-btn" data-act="later" data-note="' + UNDRAWN + '" aria-pressed="' + !!p.pinned + '" aria-label="' + (p.pinned ? 'Unpin from the rail' : 'Pin to the rail') + '" data-tip="' + (p.pinned ? 'Unpin from the rail' : 'Pin to the rail') + '">' +
      '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M7.5 3.5h5l.5 5 2 2.5h-10l2-2.5z" fill="' + (p.pinned ? 'currentColor' : 'none') + '"/><path d="M10 11v5.5"/></svg></button></div>';
  }
  function popProjects() {
    var b = newRow('New project');
    D.projects.forEach(function (p) { b += projectRow(p); });
    b += projectRow(D.notebook);
    var foot = '<button type="button" class="pop-foot" data-act="later" data-note="' + UNDRAWN + ' Box settings open here, for the Project you are in (index.html#box).">' +
      svg('right', 10, 2) + '<span class="grow">Box settings</span><span class="facts">' + esc(PROJECT.name) + '</span></button>';
    return popShell('ALL PROJECTS', b, foot);
  }
  function popUnfiled() {
    var b = groupHead('Writing with no Project \u00b7 ' + D.unfiled.length);
    D.unfiled.forEach(function (u) {
      b += '<div class="row"><button type="button" class="row-main" data-act="later" data-note="' + UNDRAWN + '"><span class="row-name">' + esc(u.name) + '</span>' +
        '<span class="facts">' + plural(u.words, 'word', 'words') + ' \u00b7 ' + esc(u.date) + '</span></button>' +
        '<button type="button" class="icon-btn" data-act="later" data-note="' + UNDRAWN + '" aria-label="File in a Project" data-tip="File in a Project">' + svg('file', 16, 1.3) + '</button>' +
        '<button type="button" class="icon-btn" data-act="later" data-note="' + UNDRAWN + '" aria-label="Move to the Trash" data-tip="Move to the Trash">' + svg('trash', 16, 1.3) + '</button></div>';
    });
    var foot = '<button type="button" class="pop-foot" data-act="later" data-note="' + UNDRAWN + ' (index.html#trash)">' + svg('trash', 16, 1.3) +
      '<span class="grow">Trash</span><span class="facts">' + plural(D.trash.length, 'item', 'items') + '</span>' + svg('right', 10, 2) + '</button>';
    return popShell('UNFILED', b, foot);
  }
  function popList(p) {
    var b = '<div class="new-pair">' + newRow('New doc') + newRow('New board') + '</div>' + groupHead('Docs \u00b7 ' + p.docs.length);
    p.docs.forEach(function (d) {
      b += docRow(p, d, plural(d.parts, 'Part', 'Parts') + ' \u00b7 ' + plural(d.words, 'word', 'words') + (d.boards ? ' \u00b7 ' + plural(d.boards, 'board', 'boards') : ''));
    });
    b += groupHead('Boards with no Doc \u00b7 ' + p.boards.length);
    if (!p.boards.length) { b += '<div class="quiet-line">No boards here yet.</div>'; }
    p.boards.forEach(function (bd) {
      b += '<div class="row"><button type="button" class="row-main" data-act="later" data-note="' + UNDRAWN + ' (index.html#board)"><span class="row-name">' + esc(bd.name) + '</span>' +
        '<span class="facts">' + kind('BOARD') + ' \u00b7 ' + esc(bd.meta) + '</span></button>' +
        '<button type="button" class="btn sm" data-act="later" data-note="' + UNDRAWN + ' (index.html#board-connect)">Connect Doc</button></div>';
    });
    return popShell(p.name, b);
  }
  function popTheme() {
    var b = groupHead('Theme', rn('NR', 'THEME: the brief names it on the rail and no more. A guess, as in the prototype. Here the Dark switch works: it is the way into the dark room.'));
    b += '<div class="row is-here">' + hereBar() + '<div class="row-main"><span class="row-name">Machina</span><span class="facts">the theme you are in</span></div></div>';
    ['Arbor', 'Flux'].forEach(function (t) {
      b += '<div class="row"><button type="button" class="row-main" data-act="later" data-note="This prototype is Machina only."><span class="row-name">' + t + '</span></button></div>';
    });
    b += groupHead('Machina \u00b7 every doc') + switchRow('Dark', 'dark', S.dark, 'dark') + switchRow('Distraction free', 'quiet', S.sw.quiet);
    return popShell('THEME', b);
  }
  function popControls() {
    var b = groupHead('The app', rn('NR', 'CONTROLS: the brief names it on the rail and no more. A guess, as in the prototype.'));
    b += '<div class="set-row"><span>Full screen</span><button type="button" class="switch" role="switch" aria-checked="false" aria-label="Full screen" data-act="later" data-note="' + UNDRAWN + '">' +
      '<span class="is-set">OFF</span><span>ON</span></button></div>';
    return popShell('CONTROLS', b);
  }
  function renderPop() {
    var h = '', p;
    if (S.pop) {
      if (S.pop.kind === 'docs') { h = popDocs(); }
      else if (S.pop.kind === 'projects') { h = popProjects(); }
      else if (S.pop.kind === 'unfiled') { h = popUnfiled(); }
      else if (S.pop.kind === 'theme') { h = popTheme(); }
      else if (S.pop.kind === 'controls') { h = popControls(); }
      else if (S.pop.kind === 'list') {
        p = S.pop.id === 'notebook' ? D.notebook : D.projects.filter(function (x) { return x.id === S.pop.id; })[0];
        h = p ? popList(p) : '';
      }
    }
    el.pop.innerHTML = h;
  }

  /* ---------- the two side menus: one open at a time (PROPOSED) ---------- */

  function tabsRow(menu, tabs, on) {
    var h = '<div class="tabs" role="tablist">';
    tabs.forEach(function (t) {
      var id = t.toLowerCase();
      h += '<button type="button" role="tab" class="tab' + (id === on ? ' is-on' : '') + '" data-act="' + menu + '-tab" data-id="' + id + '" aria-selected="' + (id === on) + '">' + t + '</button>';
    });
    /* The way to two menus at once: the pin, or Alt+\. */
    h += '<span class="grow"></span>' +
      rn('D', 'Keep both open. Until the app closes it needs nothing saved. If it should still be so tomorrow, that is one new saved setting: [DATA], Nick decides.') +
      '<button type="button" class="icon-btn pin-both" data-act="pin" data-menu="' + menu + '" aria-pressed="' + S.pin + '" aria-label="Keep both open" data-tip="Keep both open|Alt+\\">' + svg('pin', 15, 1.4) + '</button>';
    return h + '</div>';
  }

  /* The widest level of a tab: the Doc, its facts, and the tools that act on the whole Doc. */
  function docHead(facts, acts, flag) {
    return '<div class="lvl-doc"><div class="lvl-doc-name">' + esc(DOC.name) + '</div><div class="facts">' + facts + '</div>' +
      (acts ? '<div class="acts">' + acts + '</div>' : '') + (flag || '') + '</div>';
  }

  /* A Part expanded in place: its connected assets, up to four showing, oldest first, with the flip. */
  function partAssets(i, list) {
    var rows = S.order === 'newest' ? list.slice().reverse() : list, off = !splitOffered();
    var h = '<div class="pa-list" data-keep="pa-' + i + '">';
    rows.forEach(function (a) {
      h += '<div class="pa-row"><div class="pa-main"><span class="pa-name">' + esc(a.name) + '</span>' +
        '<span class="facts">' + kind(a.kind) + ' \u00b7 <span class="num">' + esc(a.added) + '</span></span></div>' +
        '<button type="button" class="btn sm" data-act="open-beside" data-id="' + a.id + '"' + (off ? ' disabled' : '') + '>Open beside</button></div>';
    });
    h += '</div>';
    if (off) { h += '<div class="guide">No split screen in ' + esc(S.stage) + '.</div>'; }
    return h;
  }

  function partsTab() {
    var cell = stageCell('front', 'PARTS', S.stage), offers = cell.offers;
    var newPart = offers.filter(function (o) { return o.act === 'new-part'; })[0];
    var docRest = offers.filter(function (o) { return o.act !== 'new-part' && PART_ACTS.indexOf(o.say) === -1; });
    var partRest = offers.filter(function (o) { return PART_ACTS.indexOf(o.say) !== -1 && PART_MAIN.indexOf(o.say) === -1; });
    var total = assetsOf().length;
    var h = docHead(
      '<span class="num">' + PARTS.length + '</span> Parts \u00b7 <span class="num">' + num(DOC.words) + '</span> words \u00b7 ' + links(total).replace('class="links"', 'class="links" style="vertical-align: -2px"'),
      '<button type="button" class="btn" data-act="new-part"' + (newPart ? (newPart.detail ? ' data-tip="' + esc(newPart.detail) + '"' : '') : ' disabled') + '><span class="plus" aria-hidden="true">+</span>New part</button>' +
      moreBtn('doc', asItems(docRest)),
      rn('NR', 'What PARTS offers in ' + S.stage + ' is one cell of the stage table, and every cell is NOT RULED.' + (cell.note ? ' The table\u2019s aside: \u201c' + cell.note + '\u201d' : '') +
        ' Team A sorted the offers into two levels: the whole Doc here, the Part she is in beside that Part. The sort is a guess.', 'tr')
    );
    h += '<div class="list-head"><span class="facts">Connected assets \u00b7 ' + (S.order === 'newest' ? 'newest first' : 'oldest first') + '</span>' +
      '<button type="button" class="textbtn" data-act="order">' + (S.order === 'newest' ? 'Oldest first' : 'Newest first') + '</button></div>';
    PARTS.forEach(function (part, n) {
      var i = n + 1, here = i === DOC.partHere, list = assetsOf(i), open = isOpen(i) && list.length > 0;
      var pressed = S.back.open && S.back.tab === 'assets' && (S.back.part === i || (here && !S.back.part));
      var say = plural(list.length, 'connected asset', 'connected assets') + ': open them in the Back menu';
      h += '<div class="pgroup' + (here ? ' is-here' + tint(part) : '') + '"><div class="prow">' + (here ? hereBar() : '') +
        '<span class="part-num">' + i + '</span>' + ptag(part) +
        '<button type="button" class="prow-main" data-act="go-part" data-id="' + i + '"' + (here ? ' aria-current="true"' : '') + '><span class="prow-name">' + esc(part.name) + '</span>' +
        '<span class="facts num">' + esc(part.count) + '</span></button>' +
        (list.length ? '<button type="button" class="marker" data-act="marker" data-id="' + i + '" aria-pressed="' + pressed + '" aria-label="' + say + '" data-tip="' + say + '">' + links(list.length) + '</button>' +
          '<button type="button" class="part-toggle" data-act="part-toggle" data-id="' + i + '" aria-expanded="' + open + '" aria-label="Show the assets connected to ' + esc(part.name) + ' here" data-tip="Show its connected assets here">' + svg(open ? 'down' : 'right', 11, 2) + '</button>'
          : '<span class="part-toggle none"></span>') + '</div>';
      if (here) {
        /* This Part's own acts sit with the Part: three and "More". Not offered in this stage: faded in place. */
        h += '<div class="pacts">';
        PART_MAIN.forEach(function (say2) {
          var o = findSay(offers, { say: say2 });
          h += offerBtn(say2, !o, o && o.detail);
        });
        h += moreBtn('part', asItems(partRest)) + '<span class="grow"></span>' +
          rn('P', 'Three acts for the Part she is in, and \u201cMore\u201d for the rest (' + (partRest.length ? partRest.map(function (o) { return o.say; }).join(', ') : 'nothing in ' + S.stage) + '). ' +
            'Split here, Join and Move are the three Part acts offered in both BUILD and EDIT, so they keep one spot in both. ' +
            'An act that is not offered in this stage fades where it stands, so nothing below it moves.') +
          '</div>';
      }
      if (open) { h += partAssets(i, list); }
      h += '</div>';
    });
    return h;
  }

  /* TEXT and INK: what the stage offers, as plain rows. */
  function plainTab(row) {
    var cell = stageCell('front', row, S.stage), h = '';
    h += docHead('<span class="num">' + PARTS.length + '</span> Parts \u00b7 <span class="num">' + num(DOC.words) + '</span> words', '',
      rn('NR', 'What ' + row + ' offers in ' + S.stage + ' is one cell of the stage table, and every cell is NOT RULED.' + (cell.note ? ' The table\u2019s aside: \u201c' + cell.note + '\u201d' : ''), 'tr'));
    if (!cell.offers.length) { h += '<div class="quiet-line">' + esc(cell.note || 'Nothing.') + '</div>'; }
    cell.offers.forEach(function (o) {
      h += '<button type="button" class="opt-row" data-act="offer" data-say="' + esc(o.say) + '"' + (o.detail ? ' data-tip="' + esc(o.detail) + '"' : '') + '><span>' + esc(o.say) + '</span>' + svg('right', 10, 2) + '</button>';
    });
    return h;
  }

  /* The session: at the Front menu's foot, under every tab. Its three keep their spots in every stage. */
  function sessionFoot() {
    var cell = stageCell('front', 'THE SESSION', S.stage), h;
    if (!cell.offers.length) { return ''; }
    h = '<div class="session"><div class="head2">The session</div><div class="acts">';
    SESSION_SLOTS.forEach(function (say) {
      var o = findSay(cell.offers, { say: say });
      h += offerBtn(say, !o, o && o.detail, 'sm');
    });
    cell.offers.forEach(function (o) {
      if (SESSION_SLOTS.indexOf(o.say) === -1) { h += offerBtn(o.say, false, o.detail, 'sm'); }
    });
    return h + '</div>' + rn('NR', 'What the session offers in ' + S.stage + ' is one cell of the stage table: NOT RULED. \u201cProgress\u201d is a PROPOSED word; the Wrizors choose it after Nick\u2019s walk.', 'tr') + '</div>';
  }

  function frontMenu() {
    var tab = S.front.tab, b = tab === 'parts' ? partsTab() : plainTab(tab.toUpperCase());
    return '<section class="menu menu-front" aria-label="Front menu">' + tabsRow('front', ['TEXT', 'INK', 'PARTS'], tab) +
      '<div class="menu-body" data-keep="front-' + tab + '">' + b + '</div>' + sessionFoot() + '</section>';
  }

  /* One asset's row: its name (Level 2), its kind and size (Level 3), and one visible act, "Open beside".
     "Open" is on the row's own menu and on Shift+Enter. strong: a row of the Part she is in. */
  function assetRow(a) {
    var off = !splitOffered(), id = 'row-' + a.id, open = S.more === id;
    if (a.kind === 'BOARD') { MORE[id] = [{ say: 'Open', detail: 'the Board on its own', act: 'open-board' }, { say: 'Open beside', act: 'open-beside', id: a.id }]; }
    return '<div class="arow"><div class="arow-main"><span class="arow-name">' + esc(a.name) + '</span>' +
      '<span class="facts">' + kind(a.kind) + ' \u00b7 ' + esc(a.meta) + '</span></div>' +
      '<button type="button" class="btn sm" data-act="open-beside" data-id="' + a.id + '"' + (a.kind === 'BOARD' ? ' data-alt="open-board"' : '') +
      (off ? ' disabled data-tip="No split screen in ' + esc(S.stage) + '"' : ' data-tip="Open beside the page' + (a.kind === 'BOARD' ? '|Shift+Enter: Open' : '') + '"') + '>Open beside</button>' +
      (a.kind === 'BOARD' ? '<button type="button" class="icon-btn" data-act="more" data-id="' + id + '" data-anchor="' + id + '" aria-haspopup="menu" aria-expanded="' + open + '" aria-label="More for ' + esc(a.name) + '" data-tip="More">' + svg('dots', 14, 0) + '</button>'
        : '<span class="icon-gap"></span>') + '</div>';
  }
  function assetGroup(i, here) {
    var part = i ? PARTS[i - 1] : null, list = assetsOf(i);
    var h = '<div class="agroup' + (here ? ' is-here' + tint(part) : '') + '"><div class="ahead">' + (here ? hereBar() : '') + (part ? ptag(part) : '<span class="ptag none"></span>') +
      '<span class="ahead-name">' + esc(part ? partLabel(i) : 'Connected to no Part') + '</span>' + links(list.length) + '</div>';
    if (!list.length) { h += '<div class="quiet-line">No assets connected to this Part.</div>'; }
    list.forEach(function (a) { h += assetRow(a); });
    return h + '</div>';
  }

  /* ASSETS: wide to narrow. The Doc and its tools; then this Part's assets, under the Part's colour;
     then "Other Parts", folded. */
  function assetsTab() {
    var cell = stageCell('back', 'ASSETS', S.stage), offers = cell.offers.slice(), all = assetsOf(), first, rest, h, others = 0, n;
    first = findSay(offers, { say: 'Connect' }) || offers[0] || null;
    rest = offers.filter(function (o) { return o !== first; });
    h = docHead(links(all.length).replace('class="links"', 'class="links" style="vertical-align: -2px"') + ' connected assets',
      (first ? offerBtn(first.say, false, first.detail) : '') + moreBtn('assets', asItems(rest)),
      rn('NR', 'What ASSETS offers in ' + S.stage + ' is one cell of the stage table: NOT RULED.' + (cell.note ? ' The table\u2019s aside: \u201c' + cell.note + '\u201d' : '') +
        ' Which offer shows and which sit under \u201cMore\u201d is Team A\u2019s guess.', 'tr'));
    if (!splitOffered()) { h += '<div class="guide" style="padding-top: 8px; border-bottom: 1px solid var(--line)">No split screen in ' + esc(S.stage) + '.</div>'; }
    if (S.back.part) {
      /* Pressed from a Part's marker: the list filtered to that Part, with the way back to all. */
      h += '<div class="filter-head' + tint(PARTS[S.back.part - 1]) + '">' + ptag(PARTS[S.back.part - 1]) +
        '<span class="filter-text"><span class="facts">Connected to</span><span class="filter-name">' + esc(partLabel(S.back.part)) + '</span></span>' +
        '<button type="button" class="textbtn" data-act="show-all">Show all ' + all.length + '</button></div>';
      n = assetsOf(S.back.part);
      if (!n.length) { h += '<div class="quiet-line">No assets connected to this Part.</div>'; }
      n.forEach(function (a) { h += assetRow(a); });
      return h;
    }
    h += assetGroup(DOC.partHere, true);
    all.forEach(function (a) { if (a.part !== DOC.partHere) { others++; } });
    if (others) {
      h += '<button type="button" class="fold-row" data-act="others" aria-expanded="' + S.back.others + '">' + svg(S.back.others ? 'down' : 'right', 11, 2, 'chev') +
        '<span class="head2 grow">Other Parts</span>' + links(others) + '</button>';
      if (S.back.others) {
        PARTS.forEach(function (part, k) {
          if (k + 1 !== DOC.partHere && assetsOf(k + 1).length) { h += assetGroup(k + 1, false); }
        });
        if (assetsOf(null).length) { h += assetGroup(null, false); }
      }
    }
    return h;
  }
  function planTab() {
    var cell = stageCell('back', 'PLAN', S.stage), rows = D.plan[DOC.id] || [];
    var h = docHead('The plan of this doc \u00b7 <span class="num">' + rows.length + '</span>',
      cell.offers.slice(0, 3).map(function (o) { return offerBtn(o.say, false, o.detail); }).join('') + moreBtn('plan', asItems(cell.offers.slice(3))),
      rn('NR', 'What PLAN offers in ' + S.stage + ' is one cell of the stage table: NOT RULED.' + (cell.note ? ' The table\u2019s aside: \u201c' + cell.note + '\u201d' : '') +
        ' Team A did not tune this tab: the first three offers show, the rest sit under \u201cMore\u201d. The rows are made up and nothing can be done to them.', 'tr'));
    rows.forEach(function (row, n) {
      h += '<div class="arow"><span class="part-num">' + (n + 1) + '</span><div class="arow-main"><span class="arow-name">' + esc(row.block) + '</span>' +
        '<span class="facts">' + kind('BLOCK') + ' \u00b7 on the board ' + esc(row.board) + '</span></div></div>';
    });
    return h;
  }
  function feedbackTab() {
    var cell = stageCell('back', 'FEEDBACK', S.stage), rows = D.feedback[DOC.id] || [];
    var h = '<div class="lvl-doc"><div class="lvl-doc-name">The Consultant</div><div class="acts" style="margin-top: 5px">' +
      cell.offers.slice(0, 3).map(function (o) { return offerBtn(o.say, false, o.detail); }).join('') + (cell.offers.length > 3 ? moreBtn('feedback', asItems(cell.offers.slice(3))) : '') + '</div>' +
      rn('NR', 'What the Consultant offers in ' + S.stage + ' is one cell of the stage table: NOT RULED.' + (cell.note ? ' The table\u2019s aside: \u201c' + cell.note + '\u201d' : ''), 'tr') + '</div>';
    h += '<div class="sub-head"><span class="head2">Feedback on this doc</span><span class="facts num">' + rows.length + '</span></div>';
    if (!rows.length) { h += '<div class="quiet-line">No feedback on this doc yet.</div>'; }
    rows.forEach(function (f) {
      h += '<div class="arow wrap"><div class="arow-main"><span class="arow-name">' + esc(f.text) + '</span>' +
        '<span class="facts" style="display: flex; align-items: center; gap: 6px; margin-top: 3px">' + ptag(PARTS[f.part - 1]) + esc(f.from) + ' \u00b7 Part ' + f.part + ' \u00b7 <span class="num">' + esc(f.date) + '</span></span></div></div>';
    });
    return h;
  }
  function backMenu() {
    var tab = S.back.tab, b = tab === 'assets' ? assetsTab() : tab === 'plan' ? planTab() : feedbackTab();
    return '<section class="menu menu-back" aria-label="Back menu">' + tabsRow('back', ['PLAN', 'ASSETS', 'FEEDBACK'], tab) +
      '<div class="search-slot"><label class="search-field">' + svg('search', 15, 1.6) +
      '<input class="search-door" type="text" spellcheck="false" autocomplete="off" aria-label="Search" placeholder="Search"></label></div>' +
      '<div class="menu-body" data-keep="back-' + tab + '-' + (S.back.part || 'all') + '">' + b + '</div></section>';
  }

  /* Replace a container's markup and keep the scroll of every list inside it. */
  function swap(boxEl, html) {
    var keep = {}, nodes = boxEl.querySelectorAll('[data-keep]'), i, k;
    for (i = 0; i < nodes.length; i++) { keep[nodes[i].getAttribute('data-keep')] = nodes[i].scrollTop; }
    boxEl.innerHTML = html;
    nodes = boxEl.querySelectorAll('[data-keep]');
    for (i = 0; i < nodes.length; i++) {
      k = nodes[i].getAttribute('data-keep');
      if (keep[k]) { nodes[i].scrollTop = keep[k]; }
    }
  }

  function renderMenus() {
    var h = '', ft = S.front.tab.toUpperCase(), bt = S.back.tab.toUpperCase();
    /* In a split both menus and their handles are gone, as ruled. */
    if (!S.split) {
      if (S.front.open) {
        h += '<button type="button" class="handle handle-front" data-act="front" aria-expanded="true" aria-label="Front menu" data-tip="Front menu|Alt+[">' + svg('right', 10, 2) + '</button>' + frontMenu();
      } else {
        /* Folded: the handle says which tab it holds, and one click brings the menu back. */
        h += '<button type="button" class="fold fold-front" data-act="front" aria-expanded="false" aria-label="Front menu, on ' + ft + '" data-tip="Front menu|Alt+[">' + svg('left', 10, 2) + '<span>' + ft + '</span></button>';
      }
      if (S.back.open) {
        h += '<button type="button" class="handle handle-back" data-act="back" aria-expanded="true" aria-label="Back menu" data-tip="Back menu|Alt+]">' + svg('left', 10, 2) + '</button>' + backMenu();
      } else {
        h += '<button type="button" class="fold fold-back" data-act="back" aria-expanded="false" aria-label="Back menu, on ' + bt + '" data-tip="Back menu|Alt+]"><span>' + bt + '</span>' + svg('right', 10, 2) + '</button>';
      }
      if (!S.front.open || !S.back.open) {
        h += rn('P', 'One side menu open at a time. Opening one folds the other to its handle, and the handle says which tab it holds. The pin in a menu\u2019s head, or Alt+\\, keeps both open.',
          'abs', S.front.open ? 'top: 114px; left: calc(var(--page-left) + 626px)' : 'top: 114px; right: calc(100% - var(--page-left) + 6px)');
      }
    }
    swap(el.menus, h);
  }

  /* ---------- the page: the same words, the same rectangle ---------- */

  function arrowBtn(step) {
    var to = DOC.partHere + step, ok = to >= 1 && to <= PARTS.length;
    var label = ok ? (step < 0 ? 'Previous Part: ' : 'Next Part: ') + to + ', ' + PARTS[to - 1].name : (step < 0 ? 'No Part before this one' : 'No Part after this one');
    return '<button type="button" class="part-arrow ' + (step < 0 ? 'up' : 'down') + '" data-act="part-step" data-id="' + step + '" aria-label="' + esc(label) + '" data-tip="' + esc(label) + '"' + (ok ? '' : ' disabled') + '>' +
      svg(step < 0 ? 'up' : 'down', 14, 1.6) + '</button>';
  }
  function renderPage() {
    var i = DOC.partHere, part = PARTS[i - 1], prev = PARTS[i - 2], next = PARTS[i], key = String(i);
    /* The page is drawn again only when the Part changes, so her caret and her scroll stay where they are. */
    if (el.page.getAttribute('data-key') === key) { return; }
    var h = '<div class="part-scroll" id="part-scroll">' +
      /* The Part's colour tag stands in the page's left margin, beside the heading. It is not one of her words. */
      (part.tag ? '<span class="page-tag">' + ptag(part, 'page') + '</span>' : '') +
      '<h1>' + esc(i + '. ' + part.name) + '</h1>' +
      '<div class="page-words" id="page-words" contenteditable="true" spellcheck="false" role="textbox" aria-multiline="true" aria-label="' + esc(part.name) + '">' +
      part.paras.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' +
      '<div class="part-foot">' +
      (prev ? '<button type="button" data-act="go-part" data-id="' + (i - 1) + '">&lsaquo; ' + (i - 1) + ' \u00b7 ' + esc(prev.name) + '</button>' : '<span></span>') +
      '<span>end of Part ' + i + '</span>' +
      (next ? '<button type="button" data-act="go-part" data-id="' + (i + 1) + '">Next \u00b7 ' + (i + 1) + ' \u00b7 ' + esc(next.name) + ' &rsaquo;</button>' : '<span></span>') +
      '</div></div>' +
      '<span class="part-track" aria-hidden="true"></span><span class="part-thumb" id="part-thumb" aria-hidden="true"></span>' + arrowBtn(-1) + arrowBtn(1);
    el.page.innerHTML = h;
    el.page.setAttribute('data-key', key);
    syncThumb();
  }
  function syncThumb() {
    var sc = document.getElementById('part-scroll'), th = document.getElementById('part-thumb');
    if (!sc || !th) { return; }
    var room = sc.scrollHeight - sc.clientHeight, track = el.page.clientHeight - 80;
    if (room <= 0 || track <= 0) { th.style.display = 'none'; return; }
    var size = Math.max(24, Math.round(track * sc.clientHeight / sc.scrollHeight));
    th.style.display = 'block';
    th.style.height = size + 'px';
    th.style.top = (40 + Math.round((track - size) * sc.scrollTop / room)) + 'px';
  }
  el.page.addEventListener('scroll', syncThumb, true);

  /* The readout under the page. Whole pages, as the page-break marks count them: "page 2 of 3". */
  function renderFoot() {
    var i = DOC.partHere, part = PARTS[i - 1], words = part.words || 0;
    var pages = Math.max(1, Math.ceil(words / 260));
    var pageLine = i === 3 ? 'page 2 of 3' : 'page 1 of ' + pages;
    var bits = [
      '<span>' + esc(part.count) + '</span>',
      '<span>' + pageLine + '</span>',
      '<span>~' + Math.ceil(words / 230) + ' min read</span>',
      ptag(part, 'foot') + '<span>Part ' + i + ' of ' + PARTS.length + '</span>',
      '<span>' + plural(DOC.words, 'word', 'words') + ' in the doc</span>'
    ];
    el.foot.innerHTML = bits.join('<span aria-hidden="true">\u00b7</span>') +
      rn('NR', '\u201cpage 2 of 3\u201d is the brief\u2019s own example, drawn as given, in place of \u201c1.6 pages\u201d. The page-break marks spec was not in this lane\u2019s reading folder, ' +
        'so what the two numbers count is not worked out here, and the line for the other Parts (\u201cpage 1 of N\u201d, at 260 words a page) is a guess.');
  }

  /* ---------- the split screen ---------- */

  var SPLIT_MIN = 725, ASSET_MIN = 336;
  function splitX() {
    var w = Math.max(shell.clientWidth, 1366);
    var x = S.split.x === null || S.split.x === undefined ? Math.round(84 + (w - 84) / 2) : S.split.x;
    return Math.max(SPLIT_MIN, Math.min(w - ASSET_MIN, x));
  }
  /* The page's place: the middle of the room right of the rail or, in a split, the middle of its own side.
     Its size and its top are never set from here. */
  function place() {
    var w = Math.max(shell.clientWidth, 1366), x;
    if (S.split) {
      x = splitX();
      shell.style.setProperty('--split-x', x + 'px');
      shell.style.setProperty('--page-left', Math.round(100 + (x - SPLIT_MIN) / 2) + 'px');
    } else {
      shell.style.setProperty('--page-left', Math.round(84 + (w - 84 - 620) / 2) + 'px');
    }
  }
  function blkHtml(board, i) {
    var b = D.blocks[board][i], c = b.colour ? PANEL_TINT[b.colour][0] : null;
    return '<div class="blk">' + (c ? '<span class="blk-bar' + (b.colour === 'yellow' ? ' edged' : '') + '" style="background: ' + c + '"></span>' : '') +
      '<span class="blk-title">' + esc(b.title) + '</span>' +
      '<span class="blk-text" contenteditable="true" spellcheck="false" role="textbox" aria-label="The words of the block ' + esc(b.title) + '">' + esc(b.text) + '</span></div>';
  }
  function besideBody(a) {
    var list, i, at = -1, h, pages;
    if (a.kind === 'BOARD') {
      list = D.blocks[a.name] || [];
      h = '<div class="blk-grid">';
      for (i = 0; i < list.length; i++) { h += blkHtml(a.name, i); }
      return h + '</div>';
    }
    if (a.kind === 'BLOCK') {
      list = D.blocks[a.board] || [];
      for (i = 0; i < list.length; i++) { if (list[i].title === a.name) { at = i; } }
      return at === -1 ? '<div class="quiet-line" style="padding-top: 20px">This block is not drawn in this prototype.</div>' : '<div class="blk-grid">' + blkHtml(a.board, at) + '</div>';
    }
    pages = /(\d+) pages/.exec(a.meta);
    h = '<div class="sheet"><div class="sheet-kicker">page 1' + (pages ? ' of ' + pages[1] : '') + '</div><h2>' + esc(a.name) + '</h2>';
    [100, 96, 100, 88, 100, 94, 62, 0, 100, 91, 100, 97, 70].forEach(function (wd) {
      h += wd ? '<span class="sheet-line" style="width: ' + wd + '%"></span>' : '<span class="sheet-gap"></span>';
    });
    return h + '</div>';
  }
  function renderBeside() {
    if (!S.split) { swap(el.beside, ''); return; }
    var a = assetById(S.split.id), part = a.part ? PARTS[a.part - 1] : null, open = S.more === 'beside';
    MORE.beside = assetsOf().map(function (x) {
      return { say: x.name, detail: x.kind + ' \u00b7 ' + (x.part ? 'Part ' + x.part : 'no Part'), act: 'open-beside', id: x.id, on: x.id === a.id };
    });
    MORE.beside.head = 'Connected to this doc \u00b7 ' + MORE.beside.length;
    /* The asset's side wears the colour of the Part it is connected to: this Part, its asset, its page. */
    var h = '<section class="beside" aria-label="Beside the page: ' + esc(a.name) + '">' +
      '<div class="beside-head' + (part ? tint(part) : '') + '">' + (part ? ptag(part) : '') +
      '<button type="button" class="beside-name" data-act="more" data-id="beside" data-anchor="beside" aria-haspopup="menu" aria-expanded="' + open + '" data-tip="The assets connected to this doc">' +
      '<span>' + esc(a.name) + '</span>' + svg('down', 10, 2) + '</button>' +
      '<span class="facts beside-meta">' + kind(a.kind) + ' \u00b7 ' + esc(a.meta) + ' \u00b7 ' + (a.part ? 'connected to ' + esc(partLabel(a.part)) : 'connected to no Part') + '</span>' +
      rn('NR', 'The asset\u2019s name drops the list of the Doc\u2019s connected assets, to swap without leaving the split: Fable\u2019s proposal, NOT RULED, as in the prototype. ' +
        'New here: the head wears the tint and tag of the Part the asset is connected to.') +
      '<button type="button" class="btn sm" data-act="split-close" aria-label="Close the asset\u2019s side" data-tip="Close the asset\u2019s side">Close</button></div>' +
      '<div class="beside-body" data-keep="beside-' + a.id + '">' + besideBody(a) + '</div></section>' +
      '<span class="grip" id="grip" role="separator" tabindex="0" aria-orientation="vertical" aria-label="Drag to change the split" data-tip="Drag to change the split"><span></span><span></span></span>';
    swap(el.beside, h);
  }

  /* ---------- "What changed with this stage" (Nick's review panel) ---------- */

  function renderChanged() {
    if (!S.changed) { el.changed.innerHTML = ''; return; }
    var to = S.stage, i = STAGES.indexOf(to);
    var from = S.prevStage && S.prevStage !== to ? S.prevStage : STAGES[i > 0 ? i - 1 : 1];
    var h = '<section class="changed" aria-label="What changed with this stage"><div class="changed-head"><span class="head2 grow">What changed with this stage</span>' +
      rn('NR', 'This panel is Nick\u2019s review tool, not the product, so it is drawn as a note: a dashed edge. It lists what each menu gained and lost. The panel in the prototype says more (index.html#changed).') +
      '<button type="button" class="btn sm" data-act="changed">Close</button></div>' +
      '<div class="changed-sub"><span class="changed-key">' + esc(to) + '</span><span class="facts">against ' + esc(from) + '</span></div><div class="changed-body">';
    STAGE_ROWS.forEach(function (r) {
      var d = rowDiff(r[0], r[1], from, to);
      if (!d.gained.length && !d.lost.length) { return; }
      h += '<div class="changed-row"><span class="changed-tab">' + esc(r[1]) + '</span><ul>';
      d.gained.forEach(function (o) { h += '<li><span class="sign" aria-hidden="true">+</span><span>' + esc(o.say) + '</span></li>'; });
      d.lost.forEach(function (o) { h += '<li class="lose"><span class="sign" aria-hidden="true">\u2212</span><span>' + esc(o.say) + '</span></li>'; });
      h += '</ul></div>';
    });
    el.changed.innerHTML = h + '</div></section>';
  }

  /* ---------- "More" lists, words on hover, review notes ---------- */

  function at(node) {
    var sr = shell.getBoundingClientRect(), r = node.getBoundingClientRect();
    return { left: r.left - sr.left, top: r.top - sr.top, right: r.right - sr.left, bottom: r.bottom - sr.top, width: r.width, height: r.height };
  }
  function renderFloat() {
    var anchor = S.more ? shell.querySelector('[data-anchor="' + S.more + '"]') : null, items = S.more ? MORE[S.more] : null, r, left, top, h;
    if (!anchor || !items || !items.length) { S.more = null; el.float.innerHTML = ''; return; }
    r = at(anchor);
    left = Math.max(4, Math.min(r.left, shell.clientWidth - 240));
    top = r.bottom + 3;
    h = '<div class="float" role="menu" style="left: ' + Math.round(left) + 'px; top: ' + Math.round(top) + 'px">';
    if (items.head) { h += '<div class="float-head head2">' + esc(items.head) + '</div>'; }
    items.forEach(function (it) {
      h += '<button type="button" role="menuitem" class="float-row' + (it.on ? ' is-on' : '') + '" data-act="' + (it.act || 'offer') + '" data-id="' + esc(it.id || '') + '" data-say="' + esc(it.say) + '">' +
        '<span>' + esc(it.say) + '</span>' + (it.detail ? '<span class="facts">' + esc(it.detail) + '</span>' : '') + '</button>';
    });
    el.float.innerHTML = h + '</div>';
  }
  function showTip(node) {
    var bits = (node.getAttribute('data-tip') || '').split('|'), r, w, left, top;
    if (!bits[0]) { return; }
    el.tip.innerHTML = esc(bits[0]) + (bits[1] ? '<kbd>' + esc(bits[1]) + '</kbd>' : '');
    el.tip.hidden = false;
    r = at(node); w = el.tip.offsetWidth;
    left = Math.max(4, Math.min(r.left + r.width / 2 - w / 2, shell.clientWidth - w - 4));
    top = r.bottom + 6;
    if (top + 30 > shell.clientHeight) { top = r.top - 34; }
    el.tip.style.left = Math.round(left) + 'px';
    el.tip.style.top = Math.round(top) + 'px';
  }
  function hideTip() { el.tip.hidden = true; }
  var rnPinned = null;
  function showRn(node) {
    var r, left, top;
    el.rnpop.innerHTML = '<b>' + esc(node.getAttribute('data-mark')) + ' \u00b7 review note</b>' + esc(node.getAttribute('data-rn'));
    el.rnpop.hidden = false;
    r = at(node);
    left = Math.max(4, Math.min(r.left, shell.clientWidth - 280));
    top = r.bottom + 5;
    if (top + el.rnpop.offsetHeight > shell.clientHeight - 4) { top = Math.max(4, r.top - el.rnpop.offsetHeight - 5); }
    el.rnpop.style.left = Math.round(left) + 'px';
    el.rnpop.style.top = Math.round(top) + 'px';
  }
  function hideRn() { rnPinned = null; el.rnpop.hidden = true; }
  /* The switch for the review notes layer: one key, F2. */
  function renderChip() {
    var n = shell.querySelectorAll('.rn').length;
    el.chip.innerHTML = '<button type="button" class="notes-chip' + (S.split ? ' in-split' : '') + '" data-act="notes" aria-pressed="' + S.notes + '" ' +
      'data-tip="Review notes: NR is NOT RULED, P is PROPOSED, D is [DATA]|F2">Review notes ' + (S.notes ? 'on \u00b7 <span class="num">' + n + '</span>' : 'off') + '<kbd>F2</kbd></button>';
  }
  var toastTimer = null;
  function note(mark, text) {
    el.toast.innerHTML = (mark ? '<span class="tag">' + esc(mark) + '</span>' : '') + esc(text);
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, 5200);
  }

  function render() {
    MORE = {};
    place();
    shell.classList.toggle('is-dark', S.dark);
    shell.classList.toggle('notes-off', !S.notes);
    shell.classList.toggle('is-typing', S.typing && S.stage === 'SPRINT');
    renderBar(); renderRail(); renderPop(); renderMenus(); renderPage(); renderFoot(); renderBeside();
    renderDrop(); renderChanged(); renderFloat(); renderChip();
    hideTip();
  }

  /* ---------- acts ---------- */

  function toggleMenu(which) {
    var m = S[which], other = S[which === 'front' ? 'back' : 'front'];
    m.open = !m.open;
    if (m.open && !S.pin) { other.open = false; }       // one at a time: opening one folds the other
    if (!m.open) { S.pin = false; }
  }
  function openMenu(which) { if (!S[which].open) { toggleMenu(which); } }
  function openSearch() {
    if (S.split) { note('NOT RULED', 'In a split the search opens over the asset\u2019s side in the prototype (index.html#split-search). Team A did not redraw it.'); return; }
    openMenu('back');
    render();
    var f = el.menus.querySelector('.search-door');
    if (f) { f.focus(); }
  }

  function act(a, t) {
    var id = t.getAttribute('data-id'), i, say;
    if (a !== 'more') { S.more = null; }       // any other act closes an open "More" list
    switch (a) {
      case 'stage':
        if (S.split || id === S.stage) { break; }
        S.prevStage = S.stage; S.stage = id; S.typing = false; S.more = null;
        if (id === 'FINALIZE') { note('NOT RULED', 'In FINALIZE the prototype draws the whole Doc in one read-only scroll. Team A did not redraw that page: the menus change here, the page stays on one Part.'); }
        break;
      case 'front': toggleMenu('front'); break;
      case 'back': toggleMenu('back'); break;
      case 'pin':
        S.pin = !S.pin;
        if (S.pin) { S.front.open = true; S.back.open = true; }
        else { S.front.open = t.getAttribute('data-menu') === 'front'; S.back.open = !S.front.open; }
        break;
      case 'front-tab': S.front.tab = id; break;
      case 'back-tab': S.back.tab = id; S.back.part = null; break;
      case 'go-part': DOC.partHere = parseInt(id, 10); S.partsDrop = false; S.back.part = null; S.more = null; break;
      case 'part-step':
        i = DOC.partHere + parseInt(id, 10);
        if (i >= 1 && i <= PARTS.length) { DOC.partHere = i; S.back.part = null; S.more = null; }
        break;
      case 'part-toggle': i = parseInt(id, 10); S.openParts[i] = !isOpen(i); break;
      case 'marker':
        i = parseInt(id, 10);
        if (S.back.open && S.back.tab === 'assets' && (S.back.part === i || (i === DOC.partHere && !S.back.part))) {
          if (S.back.part) { S.back.part = null; } else { toggleMenu('back'); }
        } else {
          S.back.tab = 'assets'; S.back.part = i === DOC.partHere ? null : i; openMenu('back');
        }
        break;
      case 'order': S.order = S.order === 'newest' ? 'oldest' : 'newest'; break;
      case 'others': S.back.others = !S.back.others; break;
      case 'show-all': S.back.part = null; break;
      case 'new-part': note('', '\u201cNew part\u201d adds \u201cUntitled part\u201d after the last Part and goes to it, as in the prototype. Not redrawn here.'); break;
      case 'offer':
        say = t.getAttribute('data-say');
        note('NOT RULED', '\u201c' + say + '\u201d is offered in ' + S.stage + ' (the stage table). What it does is not part of this prototype.');
        break;
      case 'more': S.more = S.more === id ? null : id; break;
      case 'open-beside':
        if (!splitOffered()) { note('NOT RULED', (stageOf(S.stage).splitNote || 'No split screen in ' + S.stage + '.') + ' Change stage to open it beside the page.'); break; }
        S.split = { id: id, x: S.split ? S.split.x : null }; S.pop = null; S.partsDrop = false; S.changed = false;
        break;
      case 'open-board': note('', '\u201cOpen\u201d opens the Board on its own, as in the prototype (index.html#board). Team A did not redraw the Board.'); break;
      case 'split-close': S.split = null; S.more = null; break;
      case 'pop': S.pop = isPop(id) ? null : { kind: id }; break;
      case 'list': S.pop = isPop('list', id) ? null : { kind: 'list', id: id }; break;
      case 'open-doc':
        /* The Docs drawer closes when a Doc opens. */
        if (id === DOC.id) { S.pop = null; }
        else { note('', 'Opening another Doc works as in the prototype, and closes this drawer. Team A redrew this Doc only.'); }
        break;
      case 'switch': S.sw[id] = !S.sw[id]; break;
      case 'dark': S.dark = !S.dark; break;
      case 'parts-drop': S.partsDrop = !S.partsDrop; break;
      case 'changed': S.changed = !S.changed; break;
      case 'notes': S.notes = !S.notes; hideRn(); break;
      case 'search-bar': openSearch(); return;
      case 'later': note(t.getAttribute('data-mark') || '', t.getAttribute('data-note') || ''); break;
    }
    render();
  }

  document.addEventListener('click', function (e) {
    var flag = e.target.closest('.rn'), t;
    if (flag) { if (rnPinned === flag) { hideRn(); } else { showRn(flag); rnPinned = flag; } return; }
    hideRn();
    if (e.target.closest('#toast')) { el.toast.hidden = true; return; }
    t = e.target.closest('[data-act]');
    if (t && !t.disabled) { act(t.getAttribute('data-act'), t); return; }
    /* A click anywhere else closes what is open over the desk: a "More" list, the Parts drop, a rail drawer. */
    var dirty = false;
    if (S.more && !e.target.closest('.float')) { S.more = null; dirty = true; }
    if (S.partsDrop && !e.target.closest('.drop')) { S.partsDrop = false; dirty = true; }
    if (S.pop && !e.target.closest('.pop') && !e.target.closest('.rail')) { S.pop = null; dirty = true; }
    if (dirty) { render(); }
  });

  /* Words on hover and on keyboard focus, at once: no delay, no motion. */
  document.addEventListener('mouseover', function (e) {
    var flag = e.target.closest('.rn'), t = e.target.closest('[data-tip]');
    if (flag && !rnPinned) { showRn(flag); }
    if (t) { showTip(t); }
  });
  document.addEventListener('mouseout', function (e) {
    var flag = e.target.closest('.rn'), t = e.target.closest('[data-tip]');
    if (flag && !rnPinned) { el.rnpop.hidden = true; }
    if (t) { hideTip(); }
  });
  document.addEventListener('focusin', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (e.target.classList && e.target.classList.contains('rn') && !rnPinned) { showRn(e.target); }
    if (t && e.target.matches(':focus-visible')) { showTip(t); }
    if (e.target.classList && e.target.classList.contains('search-door')) {
      note('', 'The search opens here, in the Back menu\u2019s place, as in the prototype (index.html#search). Team A did not redraw its results.');
    }
  });
  document.addEventListener('focusout', function (e) {
    if (e.target.classList && e.target.classList.contains('rn') && !rnPinned) { el.rnpop.hidden = true; }
    hideTip();
  });

  document.addEventListener('keydown', function (e) {
    var t;
    if (e.key === 'F2') { e.preventDefault(); S.notes = !S.notes; hideRn(); render(); return; }
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.code === 'BracketLeft') { e.preventDefault(); if (!S.split) { toggleMenu('front'); render(); } return; }
      if (e.code === 'BracketRight') { e.preventDefault(); if (!S.split) { toggleMenu('back'); render(); } return; }
      if (e.code === 'Backslash') {
        e.preventDefault();
        if (!S.split) { S.pin = !S.pin; if (S.pin) { S.front.open = true; S.back.open = true; } else { S.back.open = false; } render(); }
        return;
      }
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); openSearch(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '.') { e.preventDefault(); note('', 'The command line is drawn as in the frames and does nothing in this prototype.'); return; }
    /* On a Board's row, Shift+Enter is the row's other act: "Open". */
    if (e.key === 'Enter' && e.shiftKey) {
      t = e.target.closest ? e.target.closest('[data-alt]') : null;
      if (t) { e.preventDefault(); act(t.getAttribute('data-alt'), t); return; }
    }
    if (e.key === 'Escape') {
      /* Esc closes the innermost open thing first. It never closes a side menu or the split. */
      if (!el.rnpop.hidden) { hideRn(); return; }
      if (S.more) { S.more = null; }
      else if (S.partsDrop) { S.partsDrop = false; }
      else if (S.changed) { S.changed = false; }
      else if (S.pop) { S.pop = null; }
      else { return; }
      render();
    }
  });

  /* SPRINT: as she types, the chrome goes faint, with a cut. Moving the mouse brings it back. */
  var fadeFrom = null;
  el.page.addEventListener('input', function (e) {
    if (e.target.id !== 'page-words') { return; }
    var ps = e.target.querySelectorAll('p'), out = [], k;
    for (k = 0; k < ps.length; k++) { out.push(ps[k].textContent); }
    if (out.length) { PARTS[DOC.partHere - 1].paras = out; }
    if (S.stage === 'SPRINT') { S.typing = true; fadeFrom = null; shell.classList.add('is-typing'); }
  });
  document.addEventListener('pointermove', function (e) {
    if (!S.typing) { return; }
    if (!fadeFrom) { fadeFrom = { x: e.clientX, y: e.clientY }; return; }
    if (Math.abs(e.clientX - fadeFrom.x) + Math.abs(e.clientY - fadeFrom.y) > 12) { S.typing = false; shell.classList.remove('is-typing'); }
  });

  /* The grip: the page is never squeezed under its own 620 px, and the grip stops there. */
  document.addEventListener('pointerdown', function (e) {
    if (!S.split || !e.target.closest || !e.target.closest('#grip')) { return; }
    var left = shell.getBoundingClientRect().left;
    function move(ev) { S.split.x = ev.clientX - left; place(); }
    function up() { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    e.preventDefault();
  });

  window.addEventListener('resize', function () { place(); renderDrop(); renderFloat(); syncThumb(); });
  window.addEventListener('load', syncThumb);
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) { document.fonts.ready.then(function () { syncThumb(); renderDrop(); renderFloat(); }); }

  /* ---------- doors: index.html#build and the like open one state directly ---------- */
  function applyHash() {
    var h = (location.hash || '').replace('#', '');
    S = fresh();
    DOC.partHere = 3;
    switch (h) {
      case 'sprint': S.stage = 'SPRINT'; break;
      case 'sprint-typing': S.stage = 'SPRINT'; S.typing = true; break;
      case 'split': S.split = { id: 'a04', x: null }; break;
      case 'dark': S.dark = true; break;
      case 'build-assets': S.front.open = false; S.back.open = true; break;
      case 'build-both': S.pin = true; S.back.open = true; break;
      case 'desk': S.front.open = false; break;
      case 'more': S.more = 'part'; break;
      case 'other-parts': S.front.open = false; S.back.open = true; S.back.others = true; break;
      case 'docs': S.pop = { kind: 'docs' }; break;
      case 'notes-off': S.notes = false; break;
      case 'edit': S.stage = 'EDIT'; break;
      case 'changed': S.stage = 'EDIT'; S.prevStage = 'BUILD'; S.changed = true; break;
    }
    el.page.removeAttribute('data-key');
    render();
  }
  window.addEventListener('hashchange', applyHash);
  applyHash();
})();
