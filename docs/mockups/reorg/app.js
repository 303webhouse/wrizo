/*
  Wrizo reorg prototype · Machina · a mockup, not app code.
  Milestone 1: the shell, the left rail and a Project's own list (brief, section 6 A).
  Milestone 2: moving between Parts (6 B) and the Front menu's Parts tab (6 C).
  Milestone 3: the Back menu's three tabs, the search, and find and replace (6 D).
  Milestone 4: the split screen (6 E).
  Milestone 5: a Board on its own (6 F).

  Plain JavaScript, no build. State lives in memory; a reload starts over.
  Every screen state carries a tag (RULED, PROPOSED, NOT RULED) in the corner.
  Things the brief does not state are tagged NOT RULED on screen and listed in
  NOT-RULED.md.

  The page's size is never set from here, and its place only by place(): the middle
  of the room, or, in a split, the middle of the page's side. Only what is inside
  the page (the Part she is in) scrolls.
*/
(function () {
  'use strict';

  var D = window.REORG_DATA;
  var shell = document.getElementById('shell');
  var el = {
    bar: document.getElementById('bar'),
    rail: document.getElementById('rail'),
    pop: document.getElementById('pop'),
    menus: document.getElementById('menus'),
    page: document.getElementById('page'),
    foot: document.getElementById('foot'),
    beside: document.getElementById('beside'),
    board: document.getElementById('board'),
    drop: document.getElementById('drop'),
    toast: document.getElementById('toast'),
    tag: document.getElementById('state-tag'),
    colour: document.getElementById('pick-colour'),
    picture: document.getElementById('pick-picture')
  };

  /* Each colour: on a light panel (the brief's tag colours) and on the dark rail (the frames' tints). */
  var COLOURS = {
    pale:   { name: 'pale grey', panel: '#C9CED3', rail: '#C3C8CD', ink: '#1C1C1C' },
    grey:   { name: 'grey',      panel: '#6A727B', rail: '#9AA1A8', ink: '#FFFFFF' },
    blue:   { name: 'blue',      panel: '#41658A', rail: '#8FA9C4', ink: '#FFFFFF' },
    yellow: { name: 'yellow',    panel: '#B9A03A', rail: '#CDB75A', ink: '#1C1C1C' },
    brass:  { name: 'brass',     panel: '#FF9800', rail: '#FF9800', ink: '#1C1C1C' }
  };
  var COLOUR_ORDER = ['pale', 'grey', 'blue', 'yellow', 'brass'];
  var STAGES = ['SPRINT', 'BUILD', 'EDIT', 'FINALIZE'];

  var S = {
    here: { project: 'thesis', doc: 'harbor-tolls' },   // project: null while she is in an Unfiled piece
    prev: null,                // the Doc she was in before this one
    stage: 'BUILD',
    pinView: 'boxes',          // 'boxes' | 'list'
    pop: null,                 // null | { kind: 'docs' | 'projects' | 'unfiled' | 'theme' | 'controls' | 'list', id }
    boxOpen: false,            // PROJECTS: the box settings drop-down (the Project she is in, no other)
    trashOpen: false,          // UNFILED: inside the Trash
    fileFor: null,             // UNFILED: the row whose "File" list is open
    moreKinds: false,          // DOCS: "More kinds" opened
    defaults: { typewriter: false, progress: true },
    theme: { dark: false, quiet: false },
    partsDrop: false,          // the list of Parts dropped from the top bar
    front: { open: false, tab: 'parts' },                // 'text' | 'ink' | 'parts'
    back: { open: false, tab: 'assets', part: null },    // 'plan' | 'assets' | 'feedback'; part: ASSETS filtered to one Part
    assetOrder: 'oldest',      // a Part's connected assets, expanded in place: 'oldest' | 'newest' first
    /* The split screen: what is beside the page, or null. what: { kind: 'asset', id } (one of the
       Doc's assets), { kind: 'board', name } (a Board by its name) or { kind: 'doc', pid, did }
       (a second Doc, read-only). x: where the asset's side starts, in px, or null for half.
       drop: the list under the asset's name. pop: the Block popped out, { board, i }. */
    split: null,
    /* A Board on its own, or null: { pid, name, view, at, connect, pop }. pid: the Project it is in.
       view: 'open' | 'plan' | 'flip' | 'walk' | 'storyboard' | 'thumbnails'. at: the Block the Flip view
       is on. connect: the Connect Doc list is open. pop: the Block popped out, { board, i }.
       The Doc she was in stays in S.here, and the page stays where it is, under the Board. */
    board: null,
    /* The search takes the Back menu's place. Two separate choices (Fable, Nov 14):
       reach: 'doc' | 'project' | 'all', and kind: null (the words) | 'plan' | 'assets' | 'feedback'. */
    search: {
      open: false,
      wasOpen: false,          // was the Back menu open before the search took its place
      reach: 'doc',
      kind: null,
      q: '',
      cur: null,               // the key of the result she is on
      more: {},                // groups opened past their first two rows
      replaceOpen: false,
      repl: '',
      undo: [],                // the Doc's words before each replace
      focus: null,             // after the next render, put the caret in: 'select' | 'end' (the search field) | 'with'
      jump: false              // after the next render, bring the result she is on into view
    },
    counter: 0
  };

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function plural(n, one, many) { return num(n) + ' ' + (n === 1 ? one : many); }
  function proj(id) {
    if (id === 'notebook') { return D.notebook; }
    for (var i = 0; i < D.projects.length; i++) { if (D.projects[i].id === id) { return D.projects[i]; } }
    return null;
  }
  function docIn(p, id) {
    for (var i = 0; i < p.docs.length; i++) { if (p.docs[i].id === id) { return p.docs[i]; } }
    return null;
  }
  function unfiledDoc(id) {
    for (var i = 0; i < D.unfiled.length; i++) { if (D.unfiled[i].id === id) { return D.unfiled[i]; } }
    return null;
  }
  /* The id of the Project she is in: the Board's while she is on a Board, else the Doc's. Null in an Unfiled piece. */
  function nowPid() { return S.board ? S.board.pid : S.here.project; }
  /* The Project she is in, or null while she is in an Unfiled piece. */
  function projHere() { var id = nowPid(); return id ? proj(id) : null; }
  /* The Doc on the page. On a Board it is the Doc she left, still on the page under the Board. */
  function docHere() {
    var p = S.here.project ? proj(S.here.project) : null;
    return p ? docIn(p, S.here.doc) : unfiledDoc(S.here.doc);
  }
  /* Every Doc has Parts. A Doc drawn without them is one Part with no name. */
  function partsOf(d) {
    if (!d.partList) {
      d.partList = [{
        name: '', words: d.words, count: plural(d.words, 'word', 'words'),
        paras: d.paras ? d.paras : (d.isNew ? [] : D.pageText.slice()),
        filler: !d.paras && !d.isNew   // the same four paragraphs under another name: searched only while she is in it
      }];
    }
    if (!d.partHere) { d.partHere = 1; }
    d.parts = d.partList.length;
    return d.partList;
  }
  function partLabel(d, i) {
    var part = partsOf(d)[i - 1];
    return 'Part ' + i + (part.name ? ' \u00b7 ' + part.name : '');
  }
  /* A Doc's assets, oldest first. i: one Part (1, 2, ...), null for those connected to no Part, or left out for all. */
  function assetsOf(d, i) {
    return D.assets.filter(function (a) {
      return a.doc === d.id && (i === undefined || a.part === i);
    }).sort(function (x, y) { return x.order - y.order; });
  }
  function railPins() {
    var pins = D.projects.filter(function (p) { return p.pinned && p.id !== nowPid(); });
    if (D.notebook.pinned && nowPid() !== 'notebook') { pins.push(D.notebook); }
    return pins;
  }
  function uniqueName(base, taken) {
    var name = base, n = 2;
    while (taken.indexOf(name) !== -1) { name = base + ' ' + n; n++; }
    return name;
  }
  function inkFor(hex) {
    function lin(v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    var L = 0.2126 * lin(parseInt(hex.substr(1, 2), 16)) + 0.7152 * lin(parseInt(hex.substr(3, 2), 16)) + 0.0722 * lin(parseInt(hex.substr(5, 2), 16));
    return L > 0.2 ? '#1C1C1C' : '#FFFFFF';
  }

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
    search: '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.5 12.5l4.5 4.5"/>',
    link: '<path d="M8.2 11.8l3.6-3.6"/><path d="M9.6 6.4l1.3-1.3a3 3 0 014.2 4.2l-1.3 1.3"/><path d="M10.4 13.6l-1.3 1.3a3 3 0 01-4.2-4.2l1.3-1.3"/>'
  };
  function svg(name, size, width) {
    return '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="' + width + '">' + ICON[name] + '</svg>';
  }
  function pinSvg(size, filled) {
    return '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M7.5 3.5h5l.5 5 2 2.5h-10l2-2.5z" fill="' + (filled ? 'currentColor' : 'none') + '"/><path d="M10 11v5.5"/></svg>';
  }
  function tag(mark) {
    var cls = mark === 'RULED' ? 'tag-ruled' : mark === 'PROPOSED' ? 'tag-proposed' : 'tag-not';
    return '<span class="tag ' + cls + '">' + mark + '</span>';
  }

  /* A Project's box: letters on a colour, or her picture. where: 'rail' | 'panel'. */
  function boxHtml(p, size, where) {
    var c = COLOURS[p.colour], bg, ink;
    if (c) { bg = where === 'rail' ? c.rail : c.panel; ink = where === 'rail' ? '#1E262E' : c.ink; }
    else { bg = p.colour; ink = inkFor(p.colour); }
    return '<span class="box box-' + size + '" style="background-color: ' + bg + '; color: ' + ink + '"' +
      (p.picture ? ' data-pic="' + p.id + '"' : '') + '>' + (p.picture ? '' : esc(p.letters || '')) + '</span>';
  }
  function paintPictures(root) {
    var nodes = root.querySelectorAll('[data-pic]');
    for (var i = 0; i < nodes.length; i++) {
      var p = proj(nodes[i].getAttribute('data-pic'));
      if (p && p.picture) { nodes[i].style.backgroundImage = 'url("' + p.picture + '")'; }
    }
  }
  /* A Part's colour tag (frame P2-13A): the first letter of its name on the Part's colour.
     A Part with no colour has no box, only an empty place of the same size (Fable, Nov 14). */
  function ptagHtml(part) {
    var c = part.tag ? COLOURS[part.tag.colour] : null;
    return c ? '<span class="ptag" style="background: ' + c.panel + '; color: ' + c.ink + '">' + esc((part.name || '').charAt(0).toUpperCase()) + '</span>' : '<span class="ptag none"></span>';
  }
  /* Replace a container's markup and keep the scroll of every list inside it. */
  function swap(box, html) {
    var keep = {}, nodes = box.querySelectorAll('[data-keep]'), i, k;
    for (i = 0; i < nodes.length; i++) { keep[nodes[i].getAttribute('data-keep')] = nodes[i].scrollTop; }
    box.innerHTML = html;
    nodes = box.querySelectorAll('[data-keep]');
    for (i = 0; i < nodes.length; i++) {
      k = nodes[i].getAttribute('data-keep');
      if (keep[k]) { nodes[i].scrollTop = keep[k]; }
    }
  }

  /* ---------- the top bar ---------- */

  /* The Board's view options, which stand where the stage buttons stand (section 6 F). */
  var VIEWS = ['Open', 'Plan', 'Flip', 'Walk', 'Storyboard', 'Thumbnails'];

  /* The Docs of a Project that a Board serves: those it is an asset of. */
  function boardDocs(p, name) {
    return p.docs.filter(function (d) {
      return D.assets.some(function (a) { return a.kind === 'BOARD' && a.name === name && a.doc === d.id; });
    });
  }
  /* The top bar on a Board (frames P3-NB-C, P3-NB-D). The frames still draw the four stages there and call
     the button "Connect to a doc"; the brief rules otherwise, and the brief wins: the writing stages belong
     to the page only, so the Board's view options stand in their place, and the button reads "Connect Doc".
     The button stands where the frames put it, on the left, after the Board's place in the bar. */
  function boardBar() {
    var b = S.board, p = proj(b.pid), docs = boardDocs(p, b.name);
    var place = 'Board \u00b7 ' + (!docs.length ? 'no doc yet' : docs.length === 1 ? docs[0].name : docs.length + ' docs');
    var h = '<span class="brand">WRIZO<span class="brand-mark"></span></span>' +
      '<span class="bar-div" aria-hidden="true"></span>' +
      '<button type="button" class="crumb crumb-project" data-act="later" data-note="Renaming from the top bar is not part of this prototype.">' + esc(p.name) + '</button>' +
      '<span class="crumb-sep" aria-hidden="true">/</span>' +
      '<button type="button" class="crumb crumb-doc" data-act="later" data-note="Renaming from the top bar is not part of this prototype.">' + esc(b.name) + '</button>' +
      '<span class="crumb-sep" aria-hidden="true">/</span>' +
      '<button type="button" class="crumb crumb-part" data-act="later" data-note="This line says which Docs the Board serves.">' + esc(place) + '</button>' +
      /* Connect Doc stands where the frames put it: on the left, after the Board's name and place (Nick,
         Nov 14, after seeing it both there and beside the views). Once the Board has a Doc it stays, as a
         plus sign in a square box. */
      '<button type="button" class="connect-btn' + (docs.length ? ' is-icon' : '') + (b.connect ? ' is-open' : '') + '" data-act="connect-drop" aria-expanded="' + !!b.connect + '"' +
      (docs.length ? ' aria-label="Connect Doc" title="Connect Doc: connect this board to another doc">+' : '>' + svg('link', 13, 1.5) + 'Connect Doc') + '</button>' +
      '<span class="bar-spring"></span>' +
      '<div class="stages views" role="group" aria-label="The Board\u2019s views">';
    VIEWS.forEach(function (v) {
      var id = v.toLowerCase();
      h += '<button type="button" class="stage-btn' + (id === b.view ? ' is-here' : '') + '" data-act="board-view" data-id="' + id + '"' + (id === b.view ? ' aria-current="true"' : '') + '>' + v + '</button>';
    });
    h += '</div><span class="bar-cmd">&gt;<span>Ctrl+.</span></span>' +
      '<button type="button" class="bar-search" data-act="later" data-mark="NOT RULED" data-note="Search from a Board is not built: the brief does not say what it looks in there." aria-label="Search" title="Search (Ctrl+F)">' +
      svg('search', 14, 1.6) + '<span>Ctrl+F</span></button>';
    return h;
  }

  function renderBar() {
    if (S.board) { el.bar.innerHTML = boardBar(); return; }
    var p = projHere(), d = docHere(), parts = partsOf(d), part = parts[d.partHere - 1];
    var place = 'Part ' + d.partHere + ' of ' + parts.length + (part.name ? ' \u00b7 ' + part.name : '');
    var h = '<span class="brand">WRIZO<span class="brand-mark"></span></span>' +
      '<span class="bar-div" aria-hidden="true"></span>' +
      '<button type="button" class="crumb crumb-project" data-act="later" data-note="Renaming from the top bar is not part of this prototype.">' + esc(p ? p.name : 'Unfiled') + '</button>' +
      '<span class="crumb-sep" aria-hidden="true">/</span>' +
      '<button type="button" class="crumb crumb-doc" data-act="later" data-note="Renaming from the top bar is not part of this prototype.">' + esc(d.name) + '</button>' +
      '<span class="crumb-sep" aria-hidden="true">/</span>' +
      '<button type="button" class="crumb crumb-part' + (S.partsDrop ? ' is-open' : '') + '" data-act="parts-drop" aria-expanded="' + S.partsDrop + '" title="All the Parts of this doc">' + esc(place) +
      (S.partsDrop ? '<span class="crumb-v" aria-hidden="true">v</span>' : '') + '</button>' +
      '<span class="bar-spring"></span>' +
      /* In a split the stage buttons fade and she stays in her stage, which stays readable (section 6 E). */
      '<div class="stages' + (S.split ? ' is-faded' : '') + '"' + (S.split ? ' title="In a split you stay in ' + S.stage + '. Close either side to change stage."' : '') + '>';
    STAGES.forEach(function (s) {
      h += '<button type="button" class="stage-btn' + (s === S.stage ? ' is-here' : '') + '" data-act="stage" data-id="' + s + '"' + (s === S.stage ? ' aria-current="true"' : '') + (S.split ? ' disabled' : '') + '>' + s + '</button>';
    });
    h += '</div><span class="bar-cmd">&gt;<span>Ctrl+.</span></span>';
    /* The top bar's search button (frame P3-26A). It and Ctrl+F open the same search. */
    h += '<button type="button" class="bar-search' + (S.search.open ? ' is-open' : '') + '" data-act="search-bar" aria-label="Search" aria-expanded="' + S.search.open + '" title="Search (Ctrl+F)">' +
      svg('search', 14, 1.6) + '<span>Ctrl+F</span></button>';
    el.bar.innerHTML = h;
  }

  /* The Part's place in the top bar drops a list of all Parts (frame P2-12C). */
  function renderDrop() {
    if (S.board) { el.drop.innerHTML = S.board.connect ? connectList() : ''; return; }
    if (!S.partsDrop) { el.drop.innerHTML = ''; return; }
    var d = docHere(), parts = partsOf(d), crumb = el.bar.querySelector('.crumb-part');
    var left = crumb ? Math.max(0, crumb.offsetLeft - 14) : 384;
    var h = '<section class="drop" aria-label="Parts of this doc" style="left: ' + left + 'px"><div class="drop-head">PARTS OF THIS DOC</div>';
    parts.forEach(function (part, n) {
      var i = n + 1, here = i === d.partHere;
      h += '<button type="button" class="drop-row' + (here ? ' is-here' : '') + '" data-act="go-part" data-id="' + i + '"' + (here ? ' aria-current="true"' : '') + '>' + hereBar(here) +
        '<span class="part-num">' + i + '</span><span class="drop-name">' + esc(part.name || 'Part ' + i) + '</span>' +
        '<span class="row-meta">' + esc(part.count) + '</span></button>';
    });
    el.drop.innerHTML = h + '</section>';
  }

  /* ---------- the left rail (frames Ruled-1, Ruled-2, Ruled-3) ---------- */

  function isList(id) { return !!S.pop && S.pop.kind === 'list' && S.pop.id === id; }

  function railItem(kind, label, height) {
    var open = !!S.pop && S.pop.kind === kind;
    return '<button type="button" class="rail-item h' + height + (open ? ' is-open' : '') + '" data-act="pop" data-kind="' + kind + '" aria-expanded="' + open + '">' +
      svg(kind, 20, 1.2) + '<span class="rail-label">' + label + '</span></button>';
  }

  function renderRail() {
    var here = projHere(), pins = railPins(), h = '';
    if (here) {
      h += '<button type="button" class="rail-here' + (isList(here.id) ? ' is-open' : '') + '" data-act="list" data-id="' + here.id + '" aria-expanded="' + isList(here.id) + '" aria-label="' + esc(here.name) + ', the Project you are in">' +
        '<span class="rail-here-bar"></span>' + boxHtml(here, '38', 'rail') + '<span class="rail-label lit">' + esc(here.name) + '</span></button>';
    } else {
      /* In no Project: an empty box labelled Unfiled (PROPOSED, Fable, Nov 14). */
      h += '<button type="button" class="rail-here" data-act="unfiled-box" aria-label="Unfiled: you are in no Project">' +
        '<span class="rail-here-bar"></span><span class="box box-38 box-empty"></span><span class="rail-label lit">Unfiled</span></button>';
    }
    h += '<div class="rail-rule"></div>';
    if (pins.length) {
      h += '<div class="rail-gap"></div><div class="pins">';
      if (S.pinView === 'boxes') {
        h += '<div class="pins-grid">';
        pins.forEach(function (p) {
          h += '<button type="button" class="pin-btn' + (isList(p.id) ? ' is-open' : '') + '" data-act="list" data-id="' + p.id + '" aria-expanded="' + isList(p.id) + '" aria-label="' + esc(p.name) + '" title="' + esc(p.name) + '">' + boxHtml(p, '34', 'rail') + '</button>';
        });
        h += '</div>';
      } else {
        pins.forEach(function (p) {
          h += '<button type="button" class="pin-row' + (isList(p.id) ? ' is-open' : '') + '" data-act="list" data-id="' + p.id + '" aria-expanded="' + isList(p.id) + '">' + boxHtml(p, '24', 'rail') + '<span class="rail-label">' + esc(p.name) + '</span></button>';
        });
      }
      h += '</div><div class="pin-switch">' +
        '<button type="button" data-act="pin-view" data-id="list" aria-label="Show pins as a list" aria-pressed="' + (S.pinView === 'list') + '">' + svg('list', 14, '2.0') + '</button>' +
        '<button type="button" data-act="pin-view" data-id="boxes" aria-label="Show pins as boxes" aria-pressed="' + (S.pinView === 'boxes') + '">' + svg('boxes', 14, '2.0') + '</button>' +
        '</div><div class="rail-rule"></div>';
    }
    h += railItem('docs', 'Docs', 58) + railItem('projects', 'Projects', 58) + railItem('unfiled', 'Unfiled', 58);
    h += '<div class="rail-spring"></div><div class="rail-rule"></div>';
    h += railItem('theme', 'Theme', 54) + railItem('controls', 'Controls', 54);
    el.rail.innerHTML = h;
    paintPictures(el.rail);
  }

  /* ---------- pop-outs ---------- */

  function popShell(title, count, body, foot) {
    return '<section class="pop" aria-label="' + esc(title) + '">' +
      '<div class="pop-head"><span class="pop-title">' + esc(title) + '</span><span class="pop-count">' + esc(count) + '</span></div>' +
      '<div class="pop-body">' + body + '</div>' + (foot || '') + '</section>';
  }
  function groupHead(text, mark) {
    return '<div class="group-head"><span>' + esc(text) + '</span>' + (mark ? tag(mark) : '') + '</div>';
  }
  function switchRow(label, group, key) {
    var on = S[group][key];
    return '<div class="set-row"><span>' + esc(label) + '</span>' +
      '<button type="button" class="switch" role="switch" aria-checked="' + on + '" aria-label="' + esc(label) + '" data-act="switch" data-group="' + group + '" data-id="' + key + '">' +
      '<span' + (on ? '' : ' class="is-set"') + '>OFF</span><span' + (on ? ' class="is-set"' : '') + '>ON</span></button></div>';
  }
  function hereBar(on) { return on ? '<span class="here-bar"></span>' : ''; }

  /* DOCS (frame Ruled-7; the Board door from P3-NB-A). */
  function popDocs() {
    var b = groupHead('NEW DOC');
    [['blank', 'Blank'], ['screenplay', 'Screenplay'], ['research paper', 'Research paper']].forEach(function (k) {
      b += '<button type="button" class="new-row" data-act="new-doc" data-id="' + k[0] + '"><span class="plus" aria-hidden="true">+</span>' + k[1] + '</button>';
    });
    b += '<button type="button" class="new-row" data-act="more-kinds" aria-expanded="' + S.moreKinds + '"><span class="plus" aria-hidden="true">+</span><span class="grow">More kinds ' + (S.moreKinds ? 'v' : '&rsaquo;') + '</span>' + (S.moreKinds ? tag('NOT RULED') : '') + '</button>';
    if (S.moreKinds) {
      D.moreKinds.forEach(function (k) {
        b += '<button type="button" class="new-row sub-kind" data-act="new-doc" data-id="' + esc(k.toLowerCase()) + '"><span class="plus" aria-hidden="true">+</span>' + esc(k) + '</button>';
      });
    }
    b += groupHead('OR START WITH A BOARD');
    b += '<button type="button" class="new-row h40" data-act="new-board" data-id="' + (nowPid() || '') + '" data-from="docs"><span class="plus" aria-hidden="true">+</span><span class="grow">Board</span><span class="row-meta">no doc yet</span></button>';
    b += groupHead('RECENT');
    D.recent.forEach(function (r) {
      var p = r.project ? proj(r.project) : null;
      var d = r.project ? (p ? docIn(p, r.doc) : null) : unfiledDoc(r.doc);
      if (!d) { return; }
      var here = !S.board && (r.project || null) === (S.here.project || null) && r.doc === S.here.doc;
      b += '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) +
        '<button type="button" class="row-main" data-act="open-doc" data-pid="' + (p ? p.id : '') + '" data-id="' + d.id + '"><span class="row-name">' + esc(d.name) + '</span>' +
        '<span class="row-meta">' + esc(p ? p.name : 'Unfiled') + ' \u00b7 ' + plural(d.words, 'word', 'words') + '</span></button></div>';
    });
    b += groupHead('PAGE DEFAULTS \u00b7 EVERY DOC');
    b += switchRow('Typewriter mode', 'defaults', 'typewriter') + switchRow('Progress bars', 'defaults', 'progress');
    return popShell('DOCS', '', b);
  }

  /* PROJECTS (frames Ruled-4 and Ruled-5). */
  function projectRow(p) {
    var here = p.id === nowPid();
    var meta = (p.isNotebook ? 'the journal \u00b7 ' : '') + plural(p.docs.length, 'doc', 'docs');
    return '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) +
      '<span class="row-box" data-box="' + p.id + '">' + boxHtml(p, '30', 'panel') + '</span>' +
      '<button type="button" class="row-main" data-act="list" data-id="' + p.id + '" data-from="projects"><span class="row-name">' + esc(p.name) + '</span><span class="row-meta">' + meta + '</span></button>' +
      '<button type="button" class="icon-btn" data-act="pin" data-id="' + p.id + '" aria-pressed="' + !!p.pinned + '" aria-label="' + (p.pinned ? 'Unpin from the rail' : 'Pin to the rail') + '" title="' + (p.pinned ? 'Unpin from the rail' : 'Pin to the rail') + '">' + pinSvg(16, p.pinned) + '</button></div>';
  }
  function popProjects() {
    var pinned = D.projects.filter(function (p) { return p.pinned; });
    var loose = D.projects.filter(function (p) { return !p.pinned; });
    var b = '<button type="button" class="new-row h38" data-act="new-project"><span class="plus" aria-hidden="true">+</span>New project</button>';
    if (pinned.length) {
      b += '<div class="pin-head">' + pinSvg(13, true) + '<span>' + pinned.length + '</span></div>';
      pinned.forEach(function (p) { b += projectRow(p); });
    }
    if (loose.length) {
      b += '<div class="pin-head">' + pinSvg(13, false) + '<span>' + loose.length + '</span></div>';
      loose.forEach(function (p) { b += projectRow(p); });
    }
    /* The Notebook: listed last, not counted among the Projects; its pin works. */
    b += projectRow(D.notebook);

    /* Box settings act only on the Project she is in; in no Project they are not shown (Fable, Nov 14). */
    var target = projHere(), open = S.boxOpen && !!target;
    var foot = !target ? '' : '<button type="button" class="box-foot" data-act="box-toggle" aria-expanded="' + open + '">' +
      '<span class="box-foot-caret" aria-hidden="true">' + (open ? 'v' : '&rsaquo;') + '</span>' +
      '<span class="box-foot-label">BOX SETTINGS</span><span class="box-foot-name">' + esc(target ? target.name : 'no project') + '</span></button>';
    if (open) {
      foot += '<div class="box-editor">' +
        '<div class="box-line"><span class="box-line-label">LETTERS</span>' +
        '<input class="letters" id="letters" type="text" maxlength="2" spellcheck="false" autocomplete="off" aria-label="Letters on the box" value="' + esc(target.letters || '') + '">' +
        '<button type="button" class="chip-btn" data-act="no-letters">NO LETTERS</button></div>' +
        '<div class="box-line"><span class="box-line-label">COLOUR</span><span class="swatches">';
      COLOUR_ORDER.forEach(function (key) {
        var c = COLOURS[key];
        foot += '<button type="button" class="swatch" data-act="colour" data-id="' + key + '" aria-label="Colour: ' + c.name + '" title="' + c.name + '" aria-pressed="' + (target.colour === key) + '" style="background: ' + c.panel + '"></button>';
      });
      foot += '</span></div>' +
        '<div class="box-line"><span class="box-line-label"></span><button type="button" class="chip-btn" data-act="own-colour">YOUR OWN COLOUR</button></div>' +
        '<div class="box-line"><span class="box-line-label">PICTURE</span><button type="button" class="chip-btn" data-act="picture">CHOOSE A PICTURE</button>' +
        (target.picture ? '<button type="button" class="chip-btn" data-act="no-picture">NO PICTURE</button>' : '') + '</div>' +
        '<div class="box-hint">For the Project you are in. To change another Project\u2019s box, go into that Project.</div></div>';
    }
    return popShell('ALL PROJECTS', String(D.projects.length), b, foot);
  }

  /* UNFILED (frame Ruled-6). */
  function popUnfiled() {
    if (S.trashOpen) { return popTrash(); }
    var b = groupHead('WRITING WITH NO PROJECT \u00b7 ' + D.unfiled.length);
    if (!D.unfiled.length) { b += '<div class="quiet-line">Nothing is unfiled.</div>'; }
    D.unfiled.forEach(function (u) {
      var open = S.fileFor === u.id, here = !S.board && !S.here.project && S.here.doc === u.id;
      b += '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) +
        '<button type="button" class="row-main" data-act="unfiled-open" data-id="' + u.id + '"><span class="row-name">' + esc(u.name) + '</span><span class="row-meta">' + plural(u.words, 'word', 'words') + ' \u00b7 ' + esc(u.date) + '</span></button>' +
        '<button type="button" class="icon-btn edged" data-act="file" data-id="' + u.id + '" aria-expanded="' + open + '" aria-label="File in a Project" title="File in a Project">' + svg('file', 16, 1.2) + '</button>' +
        '<button type="button" class="icon-btn edged" data-act="trash" data-id="' + u.id + '" aria-label="Move to the Trash" title="Move to the Trash">' + svg('trash', 16, 1.2) + '</button></div>';
      if (open) {
        b += '<div class="sub"><div class="sub-head"><span>FILE IN</span>' + tag('NOT RULED') + '</div>';
        D.projects.forEach(function (p) {
          b += '<button type="button" class="sub-row" data-act="file-into" data-id="' + u.id + '" data-pid="' + p.id + '">' + esc(p.name) + '</button>';
        });
        b += '<button type="button" class="sub-row link" data-act="file-into" data-id="' + u.id + '" data-pid="__new"><span class="plus" aria-hidden="true">+</span>A new project</button></div>';
      }
    });
    var foot = '<div class="pop-divider"></div>' +
      '<button type="button" class="trash-foot" data-act="trash-open">' + svg('trash', 18, 1.2) + '<span class="grow">Trash</span><span class="row-meta" style="font-size: 11px">' + plural(D.trash.length, 'item', 'items') + ' &rsaquo;</span></button>';
    return popShell('UNFILED', String(D.unfiled.length), b, foot);
  }

  /* Inside the Trash: not drawn in any frame. A guess, tagged. */
  function popTrash() {
    var b = '<button type="button" class="new-row" data-act="trash-close"><span class="plus" aria-hidden="true">&lsaquo;</span>Unfiled</button>';
    b += groupHead('IN THE TRASH \u00b7 ' + D.trash.length, 'NOT RULED');
    if (!D.trash.length) { b += '<div class="quiet-line">The Trash is empty.</div>'; }
    D.trash.forEach(function (t) {
      var from = t.from && proj(t.from) ? proj(t.from).name : 'Unfiled';
      b += '<div class="row"><div class="row-main"><span class="row-name">' + esc(t.name) + '</span><span class="row-meta">' + esc(from) + ' \u00b7 ' + esc(t.date) + '</span></div>' +
        '<button type="button" class="chip-btn" data-act="restore" data-id="' + t.id + '">RESTORE</button>' +
        '<button type="button" class="icon-btn edged" data-act="delete" data-id="' + t.id + '" aria-label="Delete for good" title="Delete for good">' + svg('trash', 16, 1.2) + '</button></div>';
    });
    return popShell('TRASH', String(D.trash.length), b);
  }

  /* A Project's own list: its Docs, then its Boards with no Doc (look from frame P3-NB-B).
     The Notebook opens the same way: its pages, each a one-Part Doc. */
  function popList(p) {
    /* A Board that has been connected to a Doc stays in its Project, and leaves this list of Boards with no Doc. */
    var loose = p.boards.filter(function (bd) { return !boardDocs(p, bd.name).length; });
    var count = plural(p.docs.length, 'doc', 'docs') + (loose.length ? ' \u00b7 ' + plural(loose.length, 'board', 'boards') : '');
    var b = '<div class="new-pair">' +
      '<button type="button" class="new-row" data-act="new-doc" data-id="blank" data-pid="' + p.id + '"><span class="plus" aria-hidden="true">+</span>New doc</button>' +
      '<span class="new-pair-div"></span>' +
      '<button type="button" class="new-row" data-act="new-board" data-id="' + p.id + '"><span class="plus" aria-hidden="true">+</span>New board</button></div>';
    b += groupHead('DOCS \u00b7 ' + p.docs.length);
    if (!p.docs.length) { b += '<div class="quiet-line">No docs here yet.</div>'; }
    p.docs.forEach(function (d) {
      var here = !S.board && p.id === S.here.project && d.id === S.here.doc;
      var meta = plural(d.parts, 'Part', 'Parts') + ' \u00b7 ' + plural(d.words, 'word', 'words') + (d.boards ? ' \u00b7 ' + plural(d.boards, 'board', 'boards') : '');
      b += '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) +
        '<button type="button" class="row-main" data-act="open-doc" data-pid="' + p.id + '" data-id="' + d.id + '"><span class="row-name">' + esc(d.name) + '</span><span class="row-meta">' + meta + '</span></button>' +
        /* A second Doc beside the page, read-only (section 6 E). Where the button sits is not ruled. */
        '<button type="button" class="chip-btn" data-act="doc-beside" data-pid="' + p.id + '" data-id="' + d.id + '" title="Open beside the page, to read">Open beside</button></div>';
    });
    b += groupHead('BOARDS WITH NO DOC \u00b7 ' + loose.length);
    if (!loose.length) { b += '<div class="quiet-line">No boards here yet.</div>'; }
    loose.forEach(function (bd) {
      var here = !!S.board && S.board.pid === p.id && S.board.name === bd.name;
      var to = ' data-act="open-board" data-pid="' + p.id + '" data-name="' + esc(bd.name) + '"';
      /* The row opens the Board on its own. Its button (PROPOSED) opens it with the Connect Doc list already down. */
      b += '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) + '<span class="kind-tag">BOARD</span>' +
        '<button type="button" class="row-main"' + to + (here ? ' aria-current="true"' : '') + '><span class="row-name">' + esc(bd.name) + '</span><span class="row-meta">' + esc(bd.meta) + '</span></button>' +
        '<button type="button" class="chip-btn"' + to + ' data-connect="1">Connect Doc</button></div>';
    });
    return popShell(p.name, count, b);
  }

  /* THEME and CONTROLS: the brief names them on the rail and says no more. Guesses, tagged.
     CONTROLS is Machina's word for the rail's last item (correction to the brief, Nov 14). */
  function popTheme() {
    var b = groupHead('THEME', 'NOT RULED');
    b += '<div class="row is-here">' + hereBar(true) + '<div class="row-main"><span class="row-name">Machina</span><span class="row-meta">the theme you are in</span></div></div>';
    ['Arbor', 'Flux'].forEach(function (t) {
      b += '<div class="row"><button type="button" class="row-main" data-act="later" data-note="This prototype is Machina only."><span class="row-name">' + t + '</span></button></div>';
    });
    b += groupHead('MACHINA \u00b7 EVERY DOC');
    b += switchRow('Dark', 'theme', 'dark') + switchRow('Distraction free', 'theme', 'quiet');
    b += '<div class="quiet-line">A guess from the vision note (the rails, D). The two switches flip here and change nothing else.</div>';
    return popShell('THEME', '', b);
  }
  function popControls() {
    var full = !!document.fullscreenElement;
    var b = groupHead('THE APP', 'NOT RULED');
    b += '<div class="set-row"><span>Full screen</span>' +
      '<button type="button" class="switch" role="switch" aria-checked="' + full + '" aria-label="Full screen" data-act="fullscreen">' +
      '<span' + (full ? '' : ' class="is-set"') + '>OFF</span><span' + (full ? ' class="is-set"' : '') + '>ON</span></button></div>';
    b += '<div class="quiet-line">A guess from the vision note (the rails, D): what belongs to the whole app sits here. Page defaults are in DOCS, as the brief rules.</div>';
    return popShell('CONTROLS', '', b);
  }

  function renderPop() {
    var h = '';
    if (S.pop) {
      switch (S.pop.kind) {
        case 'docs': h = popDocs(); break;
        case 'projects': h = popProjects(); break;
        case 'unfiled': h = popUnfiled(); break;
        case 'theme': h = popTheme(); break;
        case 'controls': h = popControls(); break;
        case 'list': h = popList(proj(S.pop.id)); break;
      }
    }
    var body = el.pop.querySelector('.pop-body');
    var keep = body ? body.scrollTop : 0;
    var sameKind = el.pop.getAttribute('data-kind') === (S.pop ? S.pop.kind + ':' + (S.pop.id || '') : '');
    el.pop.innerHTML = h;
    el.pop.setAttribute('data-kind', S.pop ? S.pop.kind + ':' + (S.pop.id || '') : '');
    if (sameKind && keep) { body = el.pop.querySelector('.pop-body'); if (body) { body.scrollTop = keep; } }
    paintPictures(el.pop);
  }

  /* ---------- the two side menus ---------- */

  function tabsRow(act, tabs, on) {
    var h = '<div class="tabs" role="tablist">';
    tabs.forEach(function (t) {
      var id = t.toLowerCase();
      h += '<button type="button" role="tab" class="tab' + (id === on ? ' is-on' : '') + '" data-act="' + act + '" data-id="' + id + '" aria-selected="' + (id === on) + '">' + t + '</button>';
    });
    return h + '</div>';
  }

  /* A Part expanded in place: its connected assets, up to four showing, oldest first,
     with the flip to newest first (Nick, Nov 14). */
  function partAssets(i, list) {
    var rows = S.assetOrder === 'newest' ? list.slice().reverse() : list;
    var h = '<div class="part-assets"><div class="exp-list" data-keep="exp-' + i + '">';
    rows.forEach(function (a) {
      h += '<button type="button" class="exp-row" data-act="open-beside" data-id="' + a.id + '" title="Open beside the page: ' + esc(a.name) + '">' +
        '<span class="exp-kind">' + a.kind + '</span><span class="exp-name">' + esc(a.name) + '</span><span class="exp-date">' + esc(a.added) + '</span></button>';
    });
    return h + '</div></div>';
  }

  /* The Front menu (frames P2-13A, P2-13B). TEXT and INK are named in the frames; what they offer is milestone 6. */
  function frontMenu() {
    var d = docHere(), parts = partsOf(d), b = '';
    if (S.front.tab === 'parts') {
      b += '<button type="button" class="new-row h38" data-act="new-part"><span class="plus" aria-hidden="true">+</span>New part</button>';
      /* One oldest or newest choice for all Parts, shown once at the top of the list (Fable, Nov 14). */
      if (assetsOf(d).some(function (a) { return a.part; })) {
        b += '<div class="exp-head"><span>CONNECTED ASSETS \u00b7 ' + (S.assetOrder === 'newest' ? 'NEWEST FIRST' : 'OLDEST FIRST') + '</span>' +
          '<button type="button" data-act="asset-order">' + (S.assetOrder === 'newest' ? 'Oldest first' : 'Newest first') + '</button></div>';
      }
      parts.forEach(function (part, n) {
        var i = n + 1, here = i === d.partHere, list = assetsOf(d, i);
        var pressed = S.back.open && !S.search.open && S.back.tab === 'assets' && S.back.part === i;
        var say = plural(list.length, 'connected asset', 'connected assets') + ': open them in the Back menu';
        var name = part.name || 'Part ' + i;
        b += '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) +
          '<span class="part-num">' + i + '</span>' + ptagHtml(part) +
          '<button type="button" class="row-main" data-act="go-part" data-id="' + i + '"' + (here ? ' aria-current="true"' : '') + '><span class="row-name">' + esc(name) + '</span><span class="row-meta">' + esc(part.count) + '</span></button>' +
          (list.length ? '<button type="button" class="marker" data-act="marker" data-id="' + i + '" aria-pressed="' + pressed + '" aria-label="' + say + '" title="' + say + '">' + svg('link', 13, 1.5) + list.length + '</button>' : '') +
          (list.length ? '<button type="button" class="part-toggle" data-act="part-toggle" data-id="' + i + '" aria-expanded="' + !!part.open + '" aria-label="Show the assets connected to ' + esc(name) + ' here" title="Show its connected assets here">' + (part.open ? 'v' : '&rsaquo;') + '</button>' : '<span class="part-toggle none"></span>') +
          '</div>';
        if (part.open && list.length) { b += partAssets(i, list); }
      });
    } else {
      b += groupHead(S.front.tab.toUpperCase(), 'NOT RULED');
      b += '<div class="quiet-line">The frames name this tab. What it offers in each stage is the stage table: milestone 6 (G).</div>';
    }
    return '<section class="menu menu-front" aria-label="Front menu">' + tabsRow('front-tab', ['TEXT', 'INK', 'PARTS'], S.front.tab) +
      '<div class="menu-body" data-keep="front-' + S.front.tab + '">' + b + '</div></section>';
  }

  function assetRow(a) {
    return '<div class="row wrap"><span class="kind-tag">' + a.kind + '</span>' +
      '<div class="row-main"><span class="row-name">' + esc(a.name) + '</span><span class="row-meta">' + esc(a.meta) + '</span></div>' +
      '<span class="row-chips">' +
      /* A Board can also open on its own (section 6 F). */
      (a.kind === 'BOARD' ? '<button type="button" class="chip-btn" data-act="open-board" data-name="' + esc(a.name) + '" title="Open the Board on its own">Open</button>' : '') +
      '<button type="button" class="chip-btn" data-act="open-beside" data-id="' + a.id + '" title="Open beside the page">Open beside</button></span></div>';
  }

  /* The Back menu's ASSETS tab: all of the Doc's assets, or those connected to one Part (frame P2-13A2). */
  function backAssets(d) {
    var all = assetsOf(d), parts = partsOf(d), b = '', list;
    if (!all.length) { return '<div class="quiet-line">No assets are connected to this doc.</div>'; }
    if (S.back.part) {
      list = assetsOf(d, S.back.part);
      b += '<div class="filter-head">' + ptagHtml(parts[S.back.part - 1]) +
        '<span class="filter-text"><span class="filter-label">Connected to</span><span class="filter-name">' + esc(partLabel(d, S.back.part)) + '</span></span>' +
        '<button type="button" class="filter-all" data-act="show-all">Show all ' + all.length + '</button></div>';
      if (!list.length) { b += '<div class="quiet-line">No assets connected to this Part.</div>'; }
      list.forEach(function (a) { b += assetRow(a); });
      return b;
    }
    b += groupHead('ALL ASSETS OF THIS DOC \u00b7 ' + all.length, 'NOT RULED');
    parts.forEach(function (part, n) {
      list = assetsOf(d, n + 1);
      if (!list.length) { return; }
      b += groupHead(partLabel(d, n + 1).toUpperCase() + ' \u00b7 ' + list.length);
      list.forEach(function (a) { b += assetRow(a); });
    });
    list = assetsOf(d, null);
    if (list.length) {
      b += groupHead('CONNECTED TO NO PART \u00b7 ' + list.length);
      list.forEach(function (a) { b += assetRow(a); });
    }
    return b;
  }

  /* The Back menu's PLAN tab: the ordered plan of the piece. The rows are made up;
     what the tab offers in each stage is the stage table, milestone 6. */
  function backPlan(d) {
    var rows = D.plan[d.id] || [], b = groupHead('THE PLAN OF THIS DOC \u00b7 ' + rows.length, 'NOT RULED');
    if (!rows.length) { return b + '<div class="quiet-line">Nothing is in this doc\u2019s plan.</div>'; }
    rows.forEach(function (row, n) {
      b += '<div class="row"><span class="part-num">' + (n + 1) + '</span><span class="kind-tag">BLOCK</span>' +
        '<div class="row-main"><span class="row-name">' + esc(row.block) + '</span><span class="row-meta">on the board ' + esc(row.board) + '</span></div></div>';
    });
    return b + '<div class="quiet-line">The rows are made up. What the plan lets her do in each stage is the stage table: milestone 6 (G).</div>';
  }

  /* The Back menu's FEEDBACK tab. The Consultant, Machina's AI helper, lives inside it. */
  function backFeedback(d) {
    var rows = D.feedback[d.id] || [], b = groupHead('CONSULTANT', 'NOT RULED');
    b += '<button type="button" class="new-row" data-act="later" data-mark="NOT RULED" data-note="What the Consultant offers in each stage is the stage table: milestone 6 (G).">' +
      '<span class="plus" aria-hidden="true">+</span>Ask the Consultant</button>';
    b += groupHead('FEEDBACK ON THIS DOC \u00b7 ' + rows.length);
    if (!rows.length) { b += '<div class="quiet-line">No feedback on this doc yet.</div>'; }
    rows.forEach(function (f) {
      b += '<div class="row wrap"><div class="row-main"><span class="row-name">' + esc(f.text) + '</span>' +
        '<span class="row-meta">' + esc(f.from) + ' \u00b7 Part ' + f.part + ' \u00b7 ' + esc(f.date) + '</span></div></div>';
    });
    return b;
  }

  /* A search field sits in every Back menu tab. A click into it turns the whole menu into the search menu. */
  function searchDoor() {
    return '<div class="search-slot"><label class="search-field">' + svg('search', 15, 1.6) +
      '<input class="search-door" type="text" spellcheck="false" autocomplete="off" aria-label="Search" placeholder="Search"></label></div>';
  }

  function backMenu() {
    if (S.search.open) { return searchMenu(); }
    var d = docHere();
    var b = S.back.tab === 'assets' ? backAssets(d) : S.back.tab === 'plan' ? backPlan(d) : backFeedback(d);
    return '<section class="menu menu-back" aria-label="Back menu">' + tabsRow('back-tab', ['PLAN', 'ASSETS', 'FEEDBACK'], S.back.tab) + searchDoor() +
      '<div class="menu-body" data-keep="back-' + S.back.tab + '-' + (S.back.part || 'all') + '">' + b + '</div></section>';
  }

  function renderMenus() {
    /* The caret stays in the search field, or in "Replace with", across a render. */
    var act = document.activeElement, keepId = null, a = 0, z = 0, want, node;
    if (act && el.menus.contains(act) && (act.id === 'search-q' || act.id === 'replace-with')) {
      keepId = act.id; a = act.selectionStart; z = act.selectionEnd;
    }
    var h = '';
    if (S.board) {
      /* On a Board the two handles sit at the Board's outer edges (frame P3-NB-C). A Board gets the same two
         menus; what they offer there is the stage table, milestone 6. */
      h = '<button type="button" class="handle handle-front on-board" data-act="later" data-mark="NOT RULED" data-note="A Board gets the same two menus. What they offer on a Board is the stage table: milestone 6 (G)." aria-label="Front menu" title="Front menu">&rsaquo;</button>' +
        '<button type="button" class="handle handle-back on-board" data-act="later" data-mark="NOT RULED" data-note="A Board gets the same two menus. What they offer on a Board is the stage table: milestone 6 (G)." aria-label="Back menu" title="Back menu">&lsaquo;</button>';
    } else if (S.split) {
      /* In a split both menu handles are gone, and the menus with them (Nick, Nov 14). They come
         back as she left them when she closes either side. Only the search can open, laid over
         the asset's side (Fable's proposal, not ruled). */
      if (S.search.open) { h = searchMenu(); }
    } else {
      h = '<button type="button" class="handle handle-front' + (S.front.open ? ' is-open' : '') + '" data-act="front" aria-expanded="' + S.front.open + '" aria-label="Front menu" title="Front menu">' + (S.front.open ? '&rsaquo;' : '&lsaquo;') + '</button>' +
        '<button type="button" class="handle handle-back' + (S.back.open ? ' is-open' : '') + '" data-act="back" aria-expanded="' + S.back.open + '" aria-label="Back menu" title="Back menu">' + (S.back.open ? '&lsaquo;' : '&rsaquo;') + '</button>';
      if (S.front.open) { h += frontMenu(); }
      if (S.back.open) { h += backMenu(); }
    }
    swap(el.menus, h);

    want = S.search.focus === 'with' ? 'replace-with' : S.search.focus ? 'search-q' : keepId;
    node = want ? document.getElementById(want) : null;
    if (node) {
      node.focus();
      try {
        if (S.search.focus === 'select') { node.select(); }
        else if (S.search.focus) { node.setSelectionRange(node.value.length, node.value.length); }
        else { node.setSelectionRange(a, z); }
      } catch (err) { /* a field that cannot hold a selection: leave the caret where the browser puts it */ }
    }
    S.search.focus = null;
  }

  /* ---------- search, and find and replace (D) ---------- */

  /* Two rows, two separate choices (Fable, Nov 14). REACH is how far she looks: the frame's three
     (P3-26A). KINDS is what she looks in: one for each Back menu tab she can come from, or none
     of them for the words themselves. */
  var REACH = [['doc', 'THIS DOC'], ['project', 'THIS PROJECT'], ['all', 'EVERYTHING']];
  var KINDS = [['plan', 'PLAN'], ['assets', 'ASSETS'], ['feedback', 'FEEDBACK']];
  var WIDEN = { doc: 'project', project: 'all' };
  var R = null;   // what the open search found, worked out once for each render

  function reachOk(reach) { return reach !== 'project' || !!projHere(); }
  function reachName(reach) {
    for (var i = 0; i < REACH.length; i++) { if (REACH[i][0] === reach) { return REACH[i][1]; } }
    return '';
  }
  /* Ruled: the words in THIS DOC (P3-26A) and in THIS PROJECT (P3-26A2), and ASSETS in THIS PROJECT.
     What every other pairing of the two rows looks in is a guess. */
  function pairRuled(reach, kind) { return kind ? kind === 'assets' && reach === 'project' : reach !== 'all'; }
  function isHere(pid, did) { return (pid || null) === (S.here.project || null) && did === S.here.doc; }

  /* Where q is in text: upper and lower case alike, no two overlapping. */
  function findAll(text, q) {
    var out = [], lo = text.toLowerCase(), ql = q.toLowerCase(), at = lo.indexOf(ql);
    while (at !== -1) { out.push(at); at = lo.indexOf(ql, at + ql.length); }
    return out;
  }
  /* A text with every found word marked. curAt: where the result she is on starts, or -1. */
  function markAll(text, q, curAt) {
    var h = '', from = 0;
    findAll(text, q).forEach(function (at) {
      h += esc(text.slice(from, at)) + '<mark' + (at === curAt ? ' class="is-cur" id="hit-cur"' : '') + '>' + esc(text.slice(at, at + q.length)) + '</mark>';
      from = at + q.length;
    });
    return h + esc(text.slice(from));
  }
  /* A few words either side of one found word (the look of frame P3-26A's rows). */
  function snippet(text, at, len) {
    var from = Math.max(0, at - 22), to = Math.min(text.length, at + len + 30), sp;
    if (from > 0) { sp = text.indexOf(' ', from); if (sp !== -1 && sp < at) { from = sp + 1; } }
    if (to < text.length) { sp = text.lastIndexOf(' ', to); if (sp > at + len) { to = sp; } }
    return (from > 0 ? '\u2026' : '') + esc(text.slice(from, at)) + '<mark>' + esc(text.slice(at, at + len)) + '</mark>' +
      esc(text.slice(at + len, to).replace(/[\s,;:]+$/, '')) + (to < text.length ? '\u2026' : '');
  }
  /* Every place q is in a Doc's words. pid: its Project's id, or null for an Unfiled piece. */
  function docHits(pid, d, q) {
    var out = [];
    partsOf(d).forEach(function (part, n) {
      part.paras.forEach(function (t, k) {
        findAll(t, q).forEach(function (at) {
          out.push({
            type: 'word', pid: pid || null, did: d.id, part: n + 1, para: k, at: at, len: q.length, text: t,
            key: 'w|' + (pid || '') + '|' + d.id + '|' + (n + 1) + '|' + k + '|' + at
          });
        });
      });
    });
    return out;
  }
  /* A Project's Boards by name: those connected to its Docs, then those with no Doc. */
  function boardsOf(p) {
    var names = [];
    D.assets.forEach(function (a) {
      if (a.kind === 'BOARD' && docIn(p, a.doc) && names.indexOf(a.name) === -1) { names.push(a.name); }
    });
    p.boards.forEach(function (b) { if (names.indexOf(b.name) === -1) { names.push(b.name); } });
    return names;
  }
  function blockOf(board, title) {
    var list = D.blocks[board] || [];
    for (var i = 0; i < list.length; i++) { if (list[i].title === title) { return list[i]; } }
    return null;
  }
  /* One row for a Block with q in its name or in its words, or null. */
  function blockHit(board, block, q) {
    var inText = findAll(block.text, q);
    if (!inText.length && !findAll(block.title, q).length) { return null; }
    return { type: 'block', board: board, html: markAll(block.title, q, -1) + ' \u00b7 ' + (inText.length ? snippet(block.text, inText[0], q.length) : esc(block.text)) };
  }

  function runSearch() {
    if (!reachOk(S.search.reach)) { S.search.reach = 'doc'; }
    var q = S.search.q.trim(), reach = S.search.reach, kind = S.search.kind, d = docHere(), p = projHere(), i;
    var r = { q: q.length >= 2 ? q : '', reach: reach, kind: kind, groups: [], here: [], byKey: {}, total: 0, cur: null, say: '', widen: null };
    function reg(list) { list.forEach(function (h) { r.byKey[h.key] = h; }); return list; }
    function count(groups) { var n = 0; groups.forEach(function (g) { n += g.rows.length; }); return n; }
    /* A named head (a Project, Unfiled) over its groups, when they found anything. */
    function under(name, groups) {
      var n = count(groups);
      if (n) { r.groups.push({ head: name + ' \u00b7 ' + n, top: true, rows: [] }); r.groups = r.groups.concat(groups); }
    }
    function blockRows(name) {
      var out = [];
      (D.blocks[name] || []).forEach(function (b) { var h = blockHit(name, b, r.q); if (h) { out.push(h); } });
      return out;
    }
    function boardGroups(names) {
      var out = [];
      names.forEach(function (name) {
        var list = blockRows(name);
        if (list.length) { out.push({ head: 'BOARD \u00b7 ' + name + ' \u00b7 ' + plural(list.length, 'block', 'blocks'), rows: list }); }
      });
      return out;
    }
    /* One Doc's words. The Docs that only repeat the four filler paragraphs are searched only while she is in them. */
    function docGroups(pid, d2) {
      var mine = isHere(pid, d2.id), parts = partsOf(d2), hits;
      if (parts[0].filler && !mine) { return []; }
      hits = mine ? r.here : reg(docHits(pid, d2, r.q));
      return hits.length ? [{ head: 'DOC \u00b7 ' + d2.name + ' \u00b7 ' + hits.length, rows: hits, label: parts.length > 1, cap: 'd|' + (pid || '') + '|' + d2.id }] : [];
    }
    /* One Doc's plan: the Blocks in it, in their order. */
    function planGroups(d2, head) {
      var rows = [];
      (D.plan[d2.id] || []).forEach(function (row, n) {
        var b = blockOf(row.board, row.block), h = b ? blockHit(row.board, b, r.q) : null;
        if (h) { h.type = 'plan'; h.n = n + 1; rows.push(h); }
      });
      return rows.length ? [{ head: head + ' \u00b7 ' + rows.length, rows: rows }] : [];
    }
    function feedbackGroups(d2, head) {
      var rows = [];
      (D.feedback[d2.id] || []).forEach(function (f) {
        var at = findAll(f.text, r.q);
        if (at.length) { rows.push({ type: 'feedback', html: esc(f.from) + ', on Part ' + f.part + ' \u00b7 ' + snippet(f.text, at[0], r.q.length) }); }
      });
      return rows.length ? [{ head: head + ' \u00b7 ' + rows.length, rows: rows }] : [];
    }
    /* Assets: the names of the imported files of these Docs and of these Boards, then the Blocks on the Boards. */
    function assetGroups(docs, names) {
      var out = [], rows = [];
      D.assets.forEach(function (a) {
        var mine = docs.some(function (x) { return x.id === a.doc; });
        if (a.kind === 'PDF' && mine && findAll(a.name, r.q).length) { rows.push({ type: 'asset', id: a.id, html: 'PDF: ' + markAll(a.name, r.q, -1) }); }
      });
      if (rows.length) { out.push({ head: 'IMPORTED \u00b7 ' + rows.length, rows: rows }); }
      rows = [];
      names.forEach(function (name) {
        if (findAll(name, r.q).length) { rows.push({ type: 'board', board: name, html: 'Board: ' + markAll(name, r.q, -1) }); }
      });
      if (rows.length) { out.push({ head: 'BOARDS \u00b7 ' + rows.length, rows: rows }); }
      return out.concat(boardGroups(names));
    }
    /* One Project, or the Notebook, in what she chose to look in. The words: its Docs, then its Boards (frame P3-26A2). */
    function inProject(pp) {
      var out = [];
      if (kind === 'assets') { return assetGroups(pp.docs, boardsOf(pp)); }
      pp.docs.forEach(function (d2) {
        out = out.concat(kind === 'plan' ? planGroups(d2, 'PLAN \u00b7 ' + d2.name) : kind === 'feedback' ? feedbackGroups(d2, 'FEEDBACK \u00b7 ' + d2.name) : docGroups(pp.id, d2));
      });
      return kind ? out : out.concat(boardGroups(boardsOf(pp)));
    }
    function inUnfiled() {
      var out = [];
      if (kind === 'assets') { return assetGroups(D.unfiled, []); }
      D.unfiled.forEach(function (u) {
        out = out.concat(kind === 'plan' ? planGroups(u, 'PLAN \u00b7 ' + u.name) : kind === 'feedback' ? feedbackGroups(u, 'FEEDBACK \u00b7 ' + u.name) : docGroups(null, u));
      });
      return out;
    }

    if (!r.q) { return r; }
    if (!kind) { r.here = reg(docHits(S.here.project, d, r.q)); }

    if (reach === 'doc') {
      if (kind === 'plan') { r.groups = planGroups(d, 'THE PLAN OF THIS DOC'); }
      else if (kind === 'assets') {
        r.groups = assetGroups([d], assetsOf(d).filter(function (a) { return a.kind === 'BOARD'; }).map(function (a) { return a.name; }));
      }
      else if (kind === 'feedback') { r.groups = feedbackGroups(d, 'FEEDBACK ON THIS DOC'); }
      else {
        partsOf(d).forEach(function (part, n) {
          var list = r.here.filter(function (h) { return h.part === n + 1; });
          if (list.length) { r.groups.push({ head: 'PART ' + (n + 1) + (part.name ? ' \u00b7 ' + part.name : '') + ' \u00b7 ' + list.length, rows: list }); }
        });
      }
    } else if (reach === 'project') {
      r.groups = inProject(p);
    } else {
      D.projects.concat([D.notebook]).forEach(function (pp) { under(pp.name, inProject(pp)); });
      under('Unfiled', inUnfiled());
    }
    r.total = count(r.groups);
    r.say = num(r.total) + (reach === 'doc' ? ' in this doc' : reach === 'project' ? ' in ' + p.name : ' everywhere');

    r.widen = WIDEN[reach] || null;
    if (r.widen && !reachOk(r.widen)) { r.widen = 'all'; }

    /* The result she is on: the one she pressed, or else the first in the Part she is in (frame P3-26A). */
    r.cur = (S.search.cur && r.byKey[S.search.cur]) || null;
    if (r.cur && !isHere(r.cur.pid, r.cur.did)) { r.cur = null; }
    for (i = 0; !r.cur && i < r.here.length; i++) { if (r.here[i].part === d.partHere) { r.cur = r.here[i]; } }
    return r;
  }

  function hitRow(row, g) {
    var cur, can;
    if (row.type === 'word') {
      cur = !!R.cur && R.cur.key === row.key;
      can = S.search.replaceOpen && isHere(row.pid, row.did);
      return '<div class="hit' + (cur ? ' is-here' : '') + '">' + hereBar(cur) +
        '<button type="button" class="hit-main" data-act="hit" data-key="' + esc(row.key) + '"' + (cur ? ' aria-current="true"' : '') + '>' +
        (g.label ? 'Part ' + row.part + ' \u00b7 ' : '') + snippet(row.text, row.at, row.len) + '</button>' +
        (can ? '<button type="button" class="chip-btn" data-act="replace-one" data-key="' + esc(row.key) + '"' + (S.search.repl ? '' : ' disabled title="Type what to put in its place first"') + '>Replace</button>' : '') +
        '</div>';
    }
    if (row.type === 'feedback') {
      return '<div class="hit"><button type="button" class="hit-main" data-act="later" data-note="Going from a line of feedback to its place in the doc is not part of this prototype.">' + row.html + '</button></div>';
    }
    /* A Block, a Board or an imported file: it opens beside the page (section 6 E). */
    return '<div class="hit"><button type="button" class="hit-main" data-act="hit-beside"' +
      (row.type === 'asset' ? ' data-id="' + row.id + '"' : ' data-board="' + esc(row.board) + '"') + ' title="Open beside the page">' +
      (row.type === 'plan' ? row.n + ' \u00b7 ' : row.type === 'block' ? 'Block: ' : '') + row.html + '</button></div>';
  }

  /* The search menu: the whole Back menu, once she is in its search field (results as frames P3-26A, P3-26A2). */
  function searchMenu() {
    var p = projHere(), reach = S.search.reach, kind = S.search.kind, b = '', n, ready;
    var name = p ? p.name : 'this Project';
    var LINE = {
      words: { doc: 'The words of this doc, by Part', project: 'Docs and Boards in ' + name, all: 'Every Project, the Notebook and Unfiled' },
      plan: { doc: 'The plan of this doc', project: 'The plans of the docs in ' + name, all: 'Every plan' },
      assets: { doc: 'Assets connected to this doc', project: 'Assets in this Project' + (p ? ': ' + p.name : ''), all: 'Assets in every Project' },
      feedback: { doc: 'Feedback on this doc', project: 'Feedback on the docs in ' + name, all: 'All feedback' }
    };
    var line = LINE[kind || 'words'][reach];
    /* In a split the search lies over the asset's side (Fable's proposal, not ruled). */
    var h = '<section class="menu menu-back is-search' + (S.split ? ' over-beside' : '') + '" aria-label="Search">' +
      '<div class="search-top"><button type="button" class="search-back" data-act="search-close" title="Close the search (Esc)">&lsaquo; ' + (S.search.wasOpen && !S.split ? S.back.tab.toUpperCase() : 'Close') + '</button>' +
      '<span class="pop-title">SEARCH</span></div>' +
      '<div class="search-head"><label class="search-field is-live">' + svg('search', 15, 1.6) +
      '<input id="search-q" type="text" spellcheck="false" autocomplete="off" aria-label="Search" placeholder="Search" value="' + esc(S.search.q) + '">' +
      '<span class="search-count">' + (R.q ? esc(R.say) : '') + '</span></label>' +
      '<div class="scopes" role="group" aria-label="How far to look">';
    REACH.forEach(function (s) {
      h += '<button type="button" class="scope" data-act="reach" data-id="' + s[0] + '" aria-pressed="' + (s[0] === reach) + '"' + (reachOk(s[0]) ? '' : ' disabled title="You are in no Project"') + '>' + s[1] + '</button>';
    });
    h += '</div><div class="scopes" role="group" aria-label="What to look in: press again for the words themselves">';
    KINDS.forEach(function (s) {
      h += '<button type="button" class="scope" data-act="kind" data-id="' + s[0] + '" aria-pressed="' + (s[0] === kind) + '" title="' + (s[0] === kind ? 'Press again to look in the words themselves' : 'Look in ' + s[1]) + '">' + s[1] + '</button>';
    });
    h += '</div><div class="scope-line"><span class="grow">' + esc(line) + '</span>' + (pairRuled(reach, kind) ? '' : tag('NOT RULED')) + '</div></div>';

    /* Find and Replace: offered only once the search has found something in the Doc she is in
       (and kept while there is a replace to undo). */
    if (R.here.length || S.search.undo.length) {
      h += '<button type="button" class="replace-line" data-act="replace-toggle" aria-expanded="' + S.search.replaceOpen + '">' +
        '<span class="box-foot-caret" aria-hidden="true">' + (S.search.replaceOpen ? 'v' : '&rsaquo;') + '</span>' +
        '<span class="box-foot-label">FIND AND REPLACE</span><span class="box-foot-name">in this doc</span></button>';
      if (S.search.replaceOpen) {
        n = R.here.length; ready = n > 0 && S.search.repl !== '';
        h += '<div class="replace-box">' +
          '<label class="search-field"><span class="replace-label">WITH</span>' +
          '<input id="replace-with" type="text" spellcheck="false" autocomplete="off" aria-label="Replace with" placeholder="Replace with" value="' + esc(S.search.repl) + '"></label>' +
          '<div class="replace-acts"><button type="button" class="chip-btn solid" data-act="replace-all"' + (ready ? '' : ' disabled') + '>Replace all ' + n + ' in this doc</button>' +
          (S.search.undo.length ? '<button type="button" class="chip-btn" data-act="replace-undo" title="Undo the last replace">Undo</button>' : '') + '</div>' +
          '<div class="replace-acts"><button type="button" class="chip-btn" disabled aria-disabled="true">Replace across ' + esc(p ? p.name : 'a Project') + '</button><span class="later">later</span></div>' +
          '<div class="box-hint">One by one: press Replace on a row below. Only the words of the doc you are in can be replaced.</div></div>';
      }
    }

    if (!R.q) {
      b = '<div class="quiet-line">' + (S.search.q.trim().length === 1 ? 'Two letters or more.' : 'Type a word to search. ' + esc(line) + '.') + '</div>';
    } else {
      if (!R.total) { b += '<div class="quiet-line">Nothing found for \u201c' + esc(R.q) + '\u201d.</div>'; }
      R.groups.forEach(function (g) {
        var rows = g.rows, more = 0, first;
        b += '<div class="hit-head' + (g.top ? ' top' : '') + '">' + esc(g.head) + '</div>';
        /* Out in the Project, a Doc shows two rows and a line for the rest (frame P3-26A2). The result she is on is never hidden. */
        if (g.cap && !S.search.more[g.cap] && rows.length > 2) {
          first = R.cur && g.rows.indexOf(R.cur) > 1 ? [R.cur] : [];
          rows = first.concat(g.rows.filter(function (x) { return first.indexOf(x) === -1; })).slice(0, 2);
          more = g.rows.length - 2;
        }
        rows.forEach(function (row) { b += hitRow(row, g); });
        if (more) { b += '<button type="button" class="hit-more" data-act="more" data-id="' + esc(g.cap) + '">+ ' + more + ' more in this doc</button>'; }
      });
      if (R.widen) {
        b += '<button type="button" class="hit-widen" data-act="reach" data-id="' + R.widen + '">' + (reach === 'project' ? 'Still not here? ' : 'Not here? ') + 'Widen to ' + reachName(R.widen) + ' &rsaquo;</button>';
      }
    }
    return h + '<div class="menu-body" data-keep="search-' + reach + '-' + (kind || 'words') + '">' + b + '</div></section>';
  }

  /* from: the Back menu tab she came from ('plan' | 'assets' | 'feedback'), or 'bar' for the top bar and Ctrl+F.
     The top bar starts in the words of THIS DOC; ASSETS starts in the assets of THIS PROJECT (both ruled);
     PLAN and FEEDBACK start in the plan and the feedback of THIS DOC. */
  function openSearch(from) {
    var kind = from === 'plan' || from === 'assets' || from === 'feedback' ? from : null;
    if (!S.search.open) {
      S.search.wasOpen = S.back.open;
      S.search.kind = kind;
      S.search.reach = kind === 'assets' && reachOk('project') ? 'project' : 'doc';
      S.search.cur = null; S.search.more = {};
    }
    S.search.open = true;
    S.back.open = true;
    S.search.focus = 'select';
  }
  /* Closing the search gives the Back menu back as it was: on its tab, or closed. */
  function closeSearch() {
    if (!S.search.open) { return; }
    S.search.open = false;
    S.back.open = S.search.wasOpen;
    if (!S.back.open) { S.back.part = null; }
    S.search.q = ''; S.search.cur = null; S.search.more = {};
    S.search.replaceOpen = false; S.search.repl = '';
  }
  /* Enter in the search field: the next result in the Doc she is in (Shift+Enter: the one before). */
  function stepHit(dir) {
    if (!R || !R.here.length) { return false; }
    var n = R.here.length, at = R.cur ? R.here.indexOf(R.cur) : -1;
    var next = R.here[at === -1 ? (dir > 0 ? 0 : n - 1) : (at + dir + n) % n];
    goPart(next.part);
    S.search.cur = next.key; S.search.jump = true;
    return true;
  }
  /* Replace, inside the Doc she is in and nowhere else. Each press is one step to undo.
     A found word that starts with a capital keeps it: "Tolls" becomes "Dues" (PROPOSED, Fable, Nov 14). */
  function replaceHits(hits) {
    var d = docHere(), parts = partsOf(d), q = R.q, repl = S.search.repl;
    S.search.undo.push({ doc: d, paras: parts.map(function (part) { return part.paras.slice(); }), n: hits.length });
    hits.slice().sort(function (x, y) { return y.at - x.at; }).forEach(function (h) {
      var t = parts[h.part - 1].paras[h.para], was = t.charAt(h.at), put = repl;
      if (was !== was.toLowerCase() && put.charAt(0) === put.charAt(0).toLowerCase()) { put = put.charAt(0).toUpperCase() + put.slice(1); }
      parts[h.part - 1].paras[h.para] = t.slice(0, h.at) + put + t.slice(h.at + h.len);
    });
    S.search.cur = null;
    note('', (hits.length === 1 ? 'Replaced one' : 'Replaced ' + hits.length + ' in this doc') + ': \u201c' + q + '\u201d is now \u201c' + repl + '\u201d.');
  }

  /* ---------- the page: one Part at a time, and the line under it ---------- */

  function arrowBtn(d, step) {
    var parts = partsOf(d), to = d.partHere + step, ok = to >= 1 && to <= parts.length;
    var label = ok ? (step < 0 ? 'Previous Part: ' : 'Next Part: ') + to + (parts[to - 1].name ? ', ' + parts[to - 1].name : '')
      : (step < 0 ? 'No Part before this one' : 'No Part after this one');
    return '<button type="button" class="part-arrow ' + (step < 0 ? 'up' : 'down') + '" data-act="part-step" data-id="' + step + '" aria-label="' + esc(label) + '" title="' + esc(label) + '"' + (ok ? '' : ' disabled') + '>' +
      svg(step < 0 ? 'up' : 'down', 14, 1.6) + '</button>';
  }
  /* The quiet line at the Part's foot: previous · "end of Part 3" · next (frame P2-12D). */
  function partFoot(d, i) {
    var parts = partsOf(d), prev = parts[i - 2], next = parts[i];
    return '<div class="part-foot">' +
      (prev ? '<button type="button" data-act="go-part" data-id="' + (i - 1) + '">&lsaquo; ' + (i - 1) + (prev.name ? ' \u00b7 ' + esc(prev.name) : '') + '</button>' : '<span></span>') +
      '<span>end of Part ' + i + '</span>' +
      (next ? '<button type="button" class="next" data-act="go-part" data-id="' + (i + 1) + '">Next \u00b7 ' + (i + 1) + (next.name ? ' \u00b7 ' + esc(next.name) : '') + ' &rsaquo;</button>' : '<span></span>') +
      '</div>';
  }

  function renderPage() {
    var d = docHere(), parts = partsOf(d), i = d.partHere, part = parts[i - 1], n = parts.length;
    var key = (S.here.project || '') + '/' + d.id + '/' + i;
    var old = document.getElementById('part-scroll');
    var keep = old && el.page.getAttribute('data-key') === key ? old.scrollTop : 0;
    var h = '<div class="part-scroll" id="part-scroll">';
    if (!(d.isNew && n === 1)) { h += '<h1>' + esc(part.name ? i + '. ' + part.name : d.name) + '</h1>'; }
    if (!part.paras.length) { h += '<p><span class="caret" aria-hidden="true"></span></p>'; }
    /* While the search is over her Doc's words, each found word on the page is marked (#F6ECBE).
       The mark changes no letter's width, so her words do not re-wrap. */
    var marks = R && R.here.length ? R.q : '';
    var cur = marks && R.cur && R.cur.part === i ? R.cur : null;
    part.paras.forEach(function (t, k) {
      h += '<p>' + (marks ? markAll(t, marks, cur && cur.para === k ? cur.at : -1) : esc(t)) + '</p>';
    });
    if (n > 1) { h += partFoot(d, i); }
    h += '</div>';
    /* The Part's own scrollbar, capped by the two arrows (frame P2-12D). */
    h += '<span class="part-track" aria-hidden="true"></span><span class="part-thumb" id="part-thumb" aria-hidden="true"></span>';
    h += arrowBtn(d, -1) + arrowBtn(d, 1);
    el.page.innerHTML = h;
    el.page.setAttribute('data-key', key);
    document.getElementById('part-scroll').scrollTop = keep;
    syncThumb();

    var words = part.words || 0;
    var bits = [
      part.count || plural(words, 'word', 'words'),
      (Math.round(words / 26) / 10) + ' pages',
      '~' + Math.ceil(words / 230) + ' min read',
      'Part ' + i + ' of ' + n,
      n > 1 ? plural(d.words, 'word', 'words') + ' in the doc' : 'no goal set'
    ];
    el.foot.innerHTML = bits.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('<span aria-hidden="true">\u00b7</span>');
  }

  /* The thumb shows how far down the Part she is. The page itself never scrolls or moves. */
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
  el.page.addEventListener('pointerdown', function (e) {
    if (e.target.id !== 'part-thumb') { return; }
    var sc = document.getElementById('part-scroll');
    var startY = e.clientY, startTop = sc.scrollTop;
    var travel = Math.max(1, el.page.clientHeight - 80 - e.target.offsetHeight);
    var scale = (sc.scrollHeight - sc.clientHeight) / travel;
    function move(ev) { sc.scrollTop = startTop + (ev.clientY - startY) * scale; }
    function up() { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    e.preventDefault();
  });
  el.page.addEventListener('click', function (e) {
    if (!e.target.classList || !e.target.classList.contains('part-track')) { return; }
    var sc = document.getElementById('part-scroll'), th = document.getElementById('part-thumb');
    if (!sc || !th) { return; }
    var below = e.clientY > th.getBoundingClientRect().bottom;
    sc.scrollTop += (below ? 1 : -1) * Math.round(sc.clientHeight * 0.9);
  });

  /* ---------- the split screen (E, frame P3-23A) ---------- */

  var SPLIT_MIN = 725;   // the asset's side can start no further left: rail 84 + 16 + the page's 620 + 5
  var ASSET_MIN = 336;   // nor be narrower than one Block and its margins (a guess)

  /* Where the asset's side starts: at half of the room right of the rail, or where she dragged the grip to. */
  function splitX() {
    var w = Math.max(shell.clientWidth, 1366);
    var x = S.split.x === null ? Math.round(84 + (w - 84) / 2) : S.split.x;
    return Math.max(SPLIT_MIN, Math.min(w - ASSET_MIN, x));
  }
  function openSplit(what) {
    S.split = { what: what, x: S.split ? S.split.x : null, drop: false, pop: null };
    S.partsDrop = false;
    S.board = null;   // a split is the page and something beside it: it takes her off a Board, back to the page
  }
  function assetById(id) {
    for (var i = 0; i < D.assets.length; i++) { if (D.assets[i].id === id) { return D.assets[i]; } }
    return null;
  }
  /* Is what was beside the page still there? (A piece can be filed or go to the Trash meanwhile.) */
  function splitOk() {
    var w = S.split.what, p;
    if (w.kind === 'asset') { return !!assetById(w.id); }
    if (w.kind === 'doc') { p = w.pid ? proj(w.pid) : null; return !!(w.pid ? p && docIn(p, w.did) : unfiledDoc(w.did)); }
    return true;
  }
  /* What a Board says of itself: "6 blocks". */
  function boardMeta(name) {
    var found = null, i;
    for (i = 0; i < D.assets.length; i++) { if (D.assets[i].kind === 'BOARD' && D.assets[i].name === name) { return D.assets[i].meta; } }
    D.projects.concat([D.notebook]).forEach(function (p) {
      p.boards.forEach(function (b) { if (b.name === name) { found = b.meta; } });
    });
    return found || plural((D.blocks[name] || []).length, 'block', 'blocks');
  }
  /* What is beside the page. */
  function besideInfo() {
    var w = S.split.what, d = docHere(), a, p, d2, where;
    if (w.kind === 'doc') {
      p = w.pid ? proj(w.pid) : null;
      d2 = p ? docIn(p, w.did) : unfiledDoc(w.did);
      return { type: 'doc', tag: 'DOC', name: d2.name, doc: d2, pid: w.pid || null, key: 'doc-' + d2.id, meta: plural(partsOf(d2).length, 'Part', 'Parts') + ' \u00b7 read-only' };
    }
    if (w.kind === 'board') {
      a = assetsOf(d).filter(function (x) { return x.kind === 'BOARD' && x.name === w.name; })[0];
      where = a ? (a.part ? 'connected to Part ' + a.part : 'connected to no Part') : 'not connected to this doc';
      return { type: 'board', tag: 'BOARD', name: w.name, board: w.name, id: a ? a.id : null, key: 'board-' + w.name, meta: boardMeta(w.name) + ' \u00b7 ' + where };
    }
    a = assetById(w.id);
    where = a.part ? 'connected to Part ' + a.part : 'connected to no Part';
    if (a.kind === 'BOARD') { return { type: 'board', tag: 'BOARD', name: a.name, board: a.name, id: a.id, key: 'board-' + a.name, meta: a.meta + ' \u00b7 ' + where }; }
    if (a.kind === 'BLOCK') { return { type: 'block', tag: 'BLOCK', name: a.name, board: a.board, id: a.id, key: a.id, meta: a.meta + ' \u00b7 ' + where }; }
    return { type: 'pdf', tag: 'PDF', name: a.name, id: a.id, key: a.id, meta: a.meta + ' \u00b7 ' + where };
  }

  /* One Block (frame P3-23A): its colour tag down the left edge, its name, its words. Its words can be
     written in where they stand: a click puts the caret there. A yellow tag gets a 1 px #6A727B edge. */
  function blkHtml(board, i, popped) {
    var b = D.blocks[board][i], c = b.colour ? COLOURS[b.colour] : null;
    return '<div class="blk' + (popped ? ' is-popped' : '') + '" data-board="' + esc(board) + '" data-i="' + i + '"' + (popped ? '' : ' title="Click its words to write in them. Double click its empty area to pop it out."') + '>' +
      (c ? '<span class="blk-bar' + (b.colour === 'yellow' ? ' edged' : '') + '" style="background: ' + c.panel + '"></span>' : '') +
      '<span class="blk-title">' + esc(b.title) + '</span>' +
      '<span class="blk-text" contenteditable="true" spellcheck="false" role="textbox" aria-label="The words of the block ' + esc(b.title) + '">' + esc(b.text) + '</span></div>';
  }
  function besideBody(info) {
    var h = '', list, i, at = -1, n, d2, parts, same, pages;
    if (info.type === 'board') {
      list = D.blocks[info.board] || [];
      if (!list.length) { return '<div class="quiet-line">No blocks on this board yet.</div>'; }
      h = '<div class="blk-grid">';
      for (i = 0; i < list.length; i++) { h += blkHtml(info.board, i); }
      h += '</div>';
      n = parseInt(boardMeta(info.board), 10);
      if (n > list.length) { h += '<div class="quiet-line">' + list.length + ' of its ' + n + ' blocks are drawn in this prototype.</div>'; }
      return h;
    }
    if (info.type === 'block') {
      list = D.blocks[info.board] || [];
      for (i = 0; i < list.length; i++) { if (list[i].title === info.name) { at = i; } }
      return at === -1 ? '<div class="quiet-line">This block is not drawn in this prototype.</div>' : '<div class="blk-grid">' + blkHtml(info.board, at) + '</div>';
    }
    if (info.type === 'pdf') {
      pages = /(\d+) pages/.exec(info.meta);
      h = '<div class="sheet"><div class="sheet-kicker"><span>PAGE 1' + (pages ? ' OF ' + pages[1] : '') + '</span>' + tag('NOT RULED') + '</div><h2>' + esc(info.name) + '</h2>';
      [100, 96, 100, 88, 100, 94, 62, 0, 100, 91, 100, 97, 70].forEach(function (wd) {
        h += wd ? '<span class="sheet-line" style="width: ' + wd + '%"></span>' : '<span class="sheet-gap"></span>';
      });
      return h + '<div class="sheet-note">An imported file is read here, not changed. Its own pages are not drawn in this prototype.</div></div>';
    }
    /* A second Doc, read-only: all its Parts in one scroll. The Part she is writing never opens twice. */
    d2 = info.doc; parts = partsOf(d2); same = isHere(info.pid, d2.id);
    h = '<div class="sheet doc">';
    parts.forEach(function (part, k) {
      var j = k + 1;
      if (same && j === docHere().partHere) {
        h += '<div class="sheet-held">' + esc(partLabel(d2, j)) + ' is on the page. The Part you are writing never opens twice.</div>';
        return;
      }
      h += '<h2>' + esc(part.name ? j + '. ' + part.name : d2.name) + '</h2>';
      if (!part.paras.length) { h += '<p class="sheet-empty">Nothing written here yet.</p>'; }
      part.paras.forEach(function (t) { h += '<p>' + esc(t) + '</p>'; });
    });
    return h + '</div>';
  }
  /* The asset's name drops the list of the Doc's connected assets, so she can swap without leaving the split
     (Fable's proposal, not ruled). */
  function besideDrop(info) {
    var all = assetsOf(docHere());
    var h = '<div class="beside-drop" aria-label="The assets connected to this doc">' +
      '<div class="beside-drop-head"><span>CONNECTED TO THIS DOC \u00b7 ' + all.length + '</span>' + tag('NOT RULED') + '</div>' +
      '<div class="beside-drop-body" data-keep="beside-drop">';
    if (!all.length) { h += '<div class="quiet-line">No assets are connected to this doc.</div>'; }
    all.forEach(function (a) {
      var on = info.id === a.id;
      h += '<button type="button" class="beside-row' + (on ? ' is-on' : '') + '" data-act="open-beside" data-id="' + a.id + '"' + (on ? ' aria-current="true"' : '') + '>' +
        '<span class="kind-tag">' + a.kind + '</span><span class="beside-row-name">' + esc(a.name) + '</span>' +
        '<span class="row-meta">' + (a.part ? 'Part ' + a.part : 'no Part') + '</span></button>';
    });
    return h + '</div></div>';
  }
  /* A Block popped out: only the asset's side fades, the page stays lit. Esc closes it, never the split. */
  function blkPop(pop) {
    var b = (D.blocks[pop.board] || [])[pop.i];
    if (!b) { return ''; }
    return '<div class="blk-scrim" data-act="blk-unpop"></div>' +
      '<div class="blk-pop" role="dialog" aria-label="The block ' + esc(b.title) + ', popped out">' + blkHtml(pop.board, pop.i, true) +
      '<div class="blk-pop-foot"><span>on the board ' + esc(pop.board) + '</span>' +
      '<button type="button" class="chip-btn" data-act="blk-unpop" title="Close the pop-out (Esc)">CLOSE</button></div></div>';
  }

  function renderBeside() {
    if (!S.split) { swap(el.beside, ''); return; }
    var info = besideInfo();
    var h = '<button type="button" class="chip-btn side-close" data-act="split-close-page" title="Close the page\u2019s side" aria-label="Close the page\u2019s side">CLOSE</button>' +
      '<section class="beside" aria-label="Beside the page: the ' + info.tag.toLowerCase() + ' ' + esc(info.name) + '">' +
      '<div class="beside-head"><span class="kind-tag">' + info.tag + '</span>' +
      '<button type="button" class="beside-name" data-act="beside-drop" aria-expanded="' + !!S.split.drop + '" title="The assets connected to this doc">' +
      '<span>' + esc(info.name) + '</span><span class="beside-v" aria-hidden="true">v</span></button>' +
      '<span class="beside-meta">' + esc(info.meta) + '</span>' +
      '<button type="button" class="chip-btn" data-act="split-close" title="Close the asset\u2019s side" aria-label="Close the asset\u2019s side">CLOSE</button></div>' +
      (S.split.drop ? besideDrop(info) : '') +
      '<div class="beside-body" data-keep="beside-' + esc(info.key) + '">' + besideBody(info) + '</div>' +
      (S.split.pop ? blkPop(S.split.pop) : '') + '</section>' +
      '<span class="grip" id="grip" role="separator" tabindex="0" aria-orientation="vertical" aria-label="Drag to change the split" title="Drag to change the split"><span></span><span></span></span>';
    swap(el.beside, h);
  }

  /* ---------- a Board on its own (F, frames P3-NB-C and P3-NB-D) ---------- */

  /* The Project a Board is in, found by the Board's name. */
  function boardPid(name) {
    var all = D.projects.concat([D.notebook]);
    for (var i = 0; i < all.length; i++) { if (boardsOf(all[i]).indexOf(name) !== -1) { return all[i].id; } }
    return null;
  }
  /* Opening a Board on its own replaces the page as the surface. The page is not taken away: it stays
     where it is, under the Board, and the chip over the Board goes back to it as she left it. */
  function openBoard(pid, name, connect) {
    closeSearch();
    openPop(null);
    S.split = null;
    S.partsDrop = false;
    S.board = { pid: pid, name: name, view: 'open', at: 0, connect: !!connect, pop: null };
  }
  /* The Board becomes one of that Doc's assets. It stays in its Project and can serve more than one Doc. */
  function connectBoard(p, d, name) {
    var meta = boardMeta(name), order = 0;
    D.assets.forEach(function (a) { order = Math.max(order, a.order); });
    D.assets.push({ id: 'asset-' + (++S.counter), doc: d.id, part: null, kind: 'BOARD', name: name, meta: meta, added: 'Nov 14', order: order + 1 });
    d.boards = (d.boards || 0) + 1;
  }
  /* The Flip view: to the Block before (-1) or the next one (1). False at either end. */
  function stepFlip(dir) {
    var b = S.board, n = (D.blocks[b.name] || []).length, at = Math.max(0, Math.min(n - 1, b.at + dir));
    if (at === b.at) { return false; }
    b.at = at;
  }
  /* Connect Doc, pressed: this Project's Docs, then "A new doc" (frame P3-NB-D). */
  function connectList() {
    var b = S.board, p = proj(b.pid), docs = boardDocs(p, b.name), btn = el.bar.querySelector('.connect-btn');
    var left = btn ? Math.min(btn.offsetLeft, Math.max(shell.clientWidth, 1366) - 328) : 372;
    /* The Docs she opened most lately come first (Nick, Nov 14); the rest follow in the Project's own order. */
    var lately = [], rest;
    D.recent.forEach(function (r) {
      var d = r.project === p.id ? docIn(p, r.doc) : null;
      if (d && lately.indexOf(d) === -1) { lately.push(d); }
    });
    rest = p.docs.filter(function (d) { return lately.indexOf(d) === -1; });
    var h = '<section class="drop connect" aria-label="Connect this board to a doc" style="left: ' + left + 'px">' +
      '<div class="drop-head">CONNECT THIS BOARD TO \u00b7 DOCS IN ' + esc(p.name.toUpperCase()) + '</div>';
    if (!p.docs.length) { h += '<div class="quiet-line">No docs here yet.</div>'; }
    /* The Docs are on a scroll of their own, so "A new doc" is always in reach under them. */
    else { h += '<div class="connect-list" data-keep="connect-list">'; }
    lately.concat(rest).forEach(function (d, k) {
      var on = docs.indexOf(d) !== -1;
      h += '<button type="button" class="connect-row' + (on ? ' is-on' : '') + '" data-act="connect-to" data-id="' + d.id + '"' + (on ? ' aria-disabled="true"' : '') + '>' +
        '<span class="connect-main"><span class="row-name">' + esc(d.name) + '</span>' +
        '<span class="row-meta">' + plural(partsOf(d).length, 'Part', 'Parts') + ' \u00b7 ' + plural(d.words, 'word', 'words') + '</span></span>' +
        '<span class="row-meta">' + (on ? 'connected' : k < lately.length ? 'recent' : '') + '</span></button>';
    });
    if (p.docs.length) { h += '</div>'; }
    return h + '<button type="button" class="new-row h38" data-act="connect-new"><span class="plus" aria-hidden="true">+</span>A new doc</button>' +
      '<div class="connect-foot">It becomes one of that doc\u2019s assets. The board stays in ' + esc(p.name) + ', and it can serve more than one doc.</div></section>';
  }

  var VIEW_NOTE = {
    plan: 'PLAN: the Blocks as an ordered list.',
    flip: 'FLIP: one Block at a time.',
    walk: 'WALK: the Blocks one under another, to read down through.',
    storyboard: 'STORYBOARD: the Blocks as frames in a row, each under an empty picture.',
    thumbnails: 'THUMBNAILS: the Blocks small, by name. Double click one to pop it out.'
  };
  function boardBody(b, list) {
    var h = '', at;
    /* Only the Open view is drawn in a frame. What the other five show is a guess. */
    if (b.view !== 'open') { h += '<div class="board-note">' + tag('NOT RULED') + '<span>' + VIEW_NOTE[b.view] + ' What this view shows is a guess.</span></div>'; }
    if (!list.length) { return h + '<div class="quiet-line">No blocks on this board yet.</div>'; }
    if (b.view === 'open') {
      /* Blocks where she left them, over the Board's drawing (frame P3-NB-C). A Block with no place of its own is set out in rows. */
      h += '<div class="board-open">';
      if (D.drawings[b.name]) { h += '<svg class="board-drawing" aria-hidden="true" width="1100" height="560" viewBox="0 0 1100 560" fill="none">' + D.drawings[b.name] + '</svg>'; }
      list.forEach(function (blk, k) {
        var x = blk.x !== undefined ? blk.x : 40 + (k % 4) * 262, y = blk.y !== undefined ? blk.y : 40 + Math.floor(k / 4) * 128;
        h += '<div class="board-at" style="left: ' + x + 'px; top: ' + y + 'px">' + blkHtml(b.name, k) + '</div>';
      });
      return h + '</div>';
    }
    if (b.view === 'plan') {
      h += '<div class="board-col" data-keep="board-plan">';
      list.forEach(function (blk, k) { h += '<div class="board-step"><span class="part-num">' + (k + 1) + '</span>' + blkHtml(b.name, k) + '</div>'; });
      return h + '</div>';
    }
    if (b.view === 'walk') {
      h += '<div class="board-col walk" data-keep="board-walk">';
      list.forEach(function (blk, k) { h += blkHtml(b.name, k); });
      return h + '</div>';
    }
    if (b.view === 'flip') {
      at = Math.max(0, Math.min(list.length - 1, b.at));
      return h + '<div class="board-flip">' +
        '<button type="button" class="flip-btn" data-act="board-step" data-id="-1" aria-label="The Block before"' + (at > 0 ? '' : ' disabled') + '>&lsaquo;</button>' +
        blkHtml(b.name, at) +
        '<button type="button" class="flip-btn" data-act="board-step" data-id="1" aria-label="The next Block"' + (at < list.length - 1 ? '' : ' disabled') + '>&rsaquo;</button></div>' +
        '<div class="board-count">' + (at + 1) + ' of ' + list.length + '</div>';
    }
    if (b.view === 'storyboard') {
      h += '<div class="board-strip" data-keep="board-strip">';
      list.forEach(function (blk, k) {
        h += '<div class="board-frame"><span class="board-frame-n">' + (k + 1) + '</span><span class="board-frame-pic"></span>' + blkHtml(b.name, k) + '</div>';
      });
      return h + '</div>';
    }
    h += '<div class="board-thumbs" data-keep="board-thumbs">';
    list.forEach(function (blk, k) {
      var c = blk.colour ? COLOURS[blk.colour] : null;
      h += '<div class="blk thumb" data-board="' + esc(b.name) + '" data-i="' + k + '" title="Double click to pop it out">' +
        (c ? '<span class="blk-bar' + (blk.colour === 'yellow' ? ' edged' : '') + '" style="background: ' + c.panel + '"></span>' : '') +
        '<span class="blk-title">' + esc(blk.title) + '</span></div>';
    });
    return h + '</div>';
  }

  function renderBoard() {
    shell.classList.toggle('on-board', !!S.board);
    /* The page stays where it is, under the Board; it is only kept out of the keyboard's way meanwhile. */
    el.page.setAttribute('aria-hidden', S.board ? 'true' : 'false');
    el.page.inert = !!S.board;
    if (!S.board) { swap(el.board, ''); return; }
    var b = S.board, p = proj(b.pid), d = docHere(), list = D.blocks[b.name] || [], docs = boardDocs(p, b.name);
    var n = parseInt(boardMeta(b.name), 10) || list.length;
    var h = '<button type="button" class="chip-btn back-chip" data-act="board-back" title="Back to the page, as you left it">&lsaquo; ' + esc(d.name) + ' \u00b7 Part ' + d.partHere + '</button>' +
      '<section class="board" aria-label="Board: ' + esc(b.name) + '">' + boardBody(b, list) + (b.pop ? blkPop(b.pop) : '') + '</section>';
    swap(el.board, h);
    /* The line under the Board (frame P3-NB-C). */
    var bits = [plural(n, 'block', 'blocks')];
    if (D.drawings[b.name]) { bits.push('1 drawing'); }
    bits.push('in ' + p.name);
    bits.push(docs.length ? 'connected to ' + plural(docs.length, 'doc', 'docs') : 'not connected to a doc');
    if (n > list.length) { bits.push('only ' + list.length + ' drawn in this prototype'); }
    el.foot.innerHTML = bits.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('<span aria-hidden="true">\u00b7</span>');
  }

  /* ---------- marking ---------- */

  function renderTag() {
    var marks = [], bits = [], d = docHere(), pins = railPins().length, p, info;
    function say(mark, text) { marks.push(mark); bits.push(text); }

    if (S.pop) {
      switch (S.pop.kind) {
        case 'docs': say('RULED', 'A \u00b7 DOCS pop-out (Ruled-7, the Board door from P3-NB-A)' + (S.moreKinds ? '; the kinds under More kinds are not ruled' : '')); break;
        case 'projects': say('RULED', 'A \u00b7 ' + (S.boxOpen && projHere() ? 'PROJECTS pop-out, box settings open for the Project she is in (Ruled-5)' : 'PROJECTS pop-out (Ruled-4)')); break;
        case 'unfiled':
          if (S.trashOpen) { say('NOT RULED', 'A \u00b7 Inside the Trash: no frame, a guess'); }
          else { say('RULED', 'A \u00b7 UNFILED pop-out (Ruled-6)' + (S.fileFor ? '; the File list is not ruled' : '')); }
          break;
        case 'list':
          p = proj(S.pop.id);
          say('RULED', 'A \u00b7 ' + (p.isNotebook ? 'The Notebook\u2019s own list, like any Project\u2019s' : 'A Project\u2019s own list (look from P3-NB-B)') + (p.boards.length ? '; Connect Doc on a Board\u2019s row is PROPOSED' : ''));
          break;
        case 'theme': say('NOT RULED', 'A \u00b7 THEME pop-out: the brief names it and no more'); break;
        case 'controls': say('NOT RULED', 'A \u00b7 CONTROLS pop-out: the brief names it and no more'); break;
      }
    }
    if (S.board) {
      p = proj(S.board.pid);
      say('RULED', 'F \u00b7 A Board on its own: its view options stand where the stage buttons stand, Connect Doc on the left after the Board\u2019s name and place (P3-NB-C, with the brief\u2019s words; the button\u2019s place kept by Nick, Nov 14)');
      if (S.board.connect) { say('RULED', 'Connect Doc pressed: this Project\u2019s Docs, recent ones first on a scroll, and \u201cA new doc\u201d (P3-NB-D; Nick, Nov 14)'); }
      if (boardDocs(p, S.board.name).length) { say('RULED', 'once the Board has a Doc, Connect Doc stays as a plus sign in a square box (Nick, Nov 14)'); }
      if (S.board.view !== 'open') { say('NOT RULED', 'what the ' + S.board.view.toUpperCase() + ' view shows is a guess'); }
      if (S.board.pop) { say('RULED', 'a Block popped out, the Board faded behind it'); }
    }
    if (S.partsDrop) { say('RULED', 'B \u00b7 The Part\u2019s place in the top bar drops the list of all Parts (P2-12C)'); }
    if (S.split) {
      info = besideInfo();
      say('RULED', 'E \u00b7 Split screen: the asset on the right from half, a grip to drag, the page never under 620, both menu handles gone, the stage buttons faded (P3-23A, as ruled Nov 14)');
      if (info.type === 'doc') { say('NOT RULED', 'a second Doc beside the page is read-only (ruled); how it looks there is a guess'); }
      if (info.type === 'pdf') { say('NOT RULED', 'how an imported file looks beside the page is a guess'); }
      if (S.split.pop) { say('RULED', 'a Block popped out: only the asset\u2019s side fades, and Esc closes it, never the split'); }
      if (S.split.drop) { say('NOT RULED', 'the asset\u2019s name drops the Doc\u2019s connected assets (Fable\u2019s proposal)'); }
    }
    if (S.front.open && !S.split && !S.board) {
      if (S.front.tab === 'parts') {
        say('RULED', 'C \u00b7 Front menu, Parts tab: a marker with a count, and a toggle on each Part that has something connected (P2-13A)' +
          (partsOf(d).some(function (x) { return x.open; }) ? '; a Part expanded in place (ruled Nov 14, no frame)' : ''));
      } else { say('NOT RULED', 'Front menu, ' + S.front.tab.toUpperCase() + ' tab: milestone 6 (G)'); }
    }
    if (S.search.open) {
      say('PROPOSED', 'D \u00b7 The search menu: how far (THIS DOC, THIS PROJECT, EVERYTHING) and what (PLAN, ASSETS, FEEDBACK) are two separate choices');
      if (!S.search.kind && S.search.reach === 'doc') { say('RULED', 'the words of THIS DOC (results as P3-26A)'); }
      else if (!S.search.kind && S.search.reach === 'project') { say('RULED', 'the words of THIS PROJECT: its Docs and Boards (results as P3-26A2)'); }
      else if (pairRuled(S.search.reach, S.search.kind)) { say('RULED', 'ASSETS in THIS PROJECT (ruled Nov 14, no frame; how its list looks is a guess)'); }
      else { say('NOT RULED', 'what ' + (S.search.kind ? S.search.kind.toUpperCase() + ' in ' : '') + reachName(S.search.reach) + ' looks in is a guess'); }
      if (S.split) { say('NOT RULED', 'in a split the search lies over the asset\u2019s side (Fable\u2019s proposal)'); }
      if (S.search.replaceOpen && R && (R.here.length || S.search.undo.length)) {
        say('RULED', 'D \u00b7 Find and Replace: all, or one by one in the list, in the Doc she is in; across a Project greyed, \u201clater\u201d');
      }
    } else if (S.back.open && !S.split && !S.board) {
      if (S.back.tab !== 'assets') { say('NOT RULED', 'D \u00b7 Back menu, ' + S.back.tab.toUpperCase() + ' tab, with the search field every tab has: the tab is ruled, what it lists is made up'); }
      else if (S.back.part) { say('RULED', 'C \u00b7 Back menu, ASSETS connected to one Part (P2-13A2)'); }
      else { say('NOT RULED', 'Back menu, ASSETS, all of the Doc\u2019s assets: the grouping is a guess'); }
    }
    if (!bits.length) {
      say('RULED', 'A \u00b7 ' + (!pins ? 'The rail with no pins (Ruled-3)' : S.pinView === 'boxes' ? 'The rail at rest, pins as boxes (Ruled-1)' : 'The rail at rest, pins as a list (Ruled-2)'));
      say('RULED', 'B \u00b7 One Part on the page: arrows on its scrollbar, the line at its foot, its place in the top bar (P2-12D)');
    }
    if (!nowPid()) { say('PROPOSED', 'In no Project: the rail\u2019s top box is empty and reads Unfiled'); }
    if (d.isNew && !S.board) { say('NOT RULED', 'A new Doc on the page: where it lands and its name are guesses'); }

    var mark = marks.indexOf('NOT RULED') !== -1 ? 'NOT RULED' : marks.indexOf('PROPOSED') !== -1 ? 'PROPOSED' : 'RULED';
    el.tag.innerHTML = tag(mark) + '<span>' + esc(bits.join(' \u00b7 ')) + '</span>';
  }

  var toastTimer = null;
  function note(mark, text) {
    el.toast.innerHTML = (mark ? tag(mark) : '') + esc(text);
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, 5200);
  }

  function render() {
    if (S.split && !splitOk()) { S.split = null; }
    place();
    R = S.search.open ? runSearch() : null;
    renderBar(); renderRail(); renderPop(); renderMenus(); renderPage(); renderBeside(); renderBoard(); renderDrop(); renderTag();
    if (S.search.jump) { S.search.jump = false; showCur(); }
  }
  /* Bring the result she is on into view: on the page (inside the Part, which is all that scrolls) and in the list. */
  function showCur() {
    var m = document.getElementById('hit-cur'), sc = document.getElementById('part-scroll');
    if (m && sc) { sc.scrollTop = Math.max(0, m.offsetTop - Math.round(sc.clientHeight / 3)); syncThumb(); }
    var row = el.menus.querySelector('.hit.is-here'), body = row ? row.parentNode : null;
    if (!body) { return; }
    if (row.offsetTop < body.scrollTop) { body.scrollTop = row.offsetTop; }
    else if (row.offsetTop + row.offsetHeight > body.scrollTop + body.clientHeight) { body.scrollTop = row.offsetTop + row.offsetHeight - body.clientHeight; }
  }

  /* ---------- acts ---------- */

  function openPop(pop) {
    S.pop = pop; S.boxOpen = false; S.trashOpen = false; S.fileFor = null; S.moreKinds = false;
  }
  function togglePop(pop) {
    var same = S.pop && S.pop.kind === pop.kind && (S.pop.id || '') === (pop.id || '');
    openPop(same ? null : pop);
  }
  /* Esc closes the innermost open thing first. The two side menus close by their handles. */
  function stepBack() {
    if (S.partsDrop) { S.partsDrop = false; return true; }
    /* In a split, Esc closes the popped-out Block first, then the list under the asset's name. It never closes the split. */
    if (S.split && S.split.pop) { S.split.pop = null; return true; }
    if (S.split && S.split.drop) { S.split.drop = false; return true; }
    /* On a Board: the popped-out Block first, then the Connect Doc list. */
    if (S.board && S.board.pop) { S.board.pop = null; return true; }
    if (S.board && S.board.connect) { S.board.connect = false; return true; }
    /* The search: first its replace box, then the search itself. A rail pop-out goes first unless she is in the search. */
    var act = document.activeElement, inSearch = !!(act && act.closest && act.closest('.menu-back'));
    if (S.search.open && (inSearch || !S.pop)) {
      if (S.search.replaceOpen) { S.search.replaceOpen = false; S.search.focus = 'end'; }
      else { closeSearch(); }
      return true;
    }
    if (!S.pop) { return false; }
    if (S.fileFor) { S.fileFor = null; }
    else if (S.trashOpen) { S.trashOpen = false; }
    else if (S.boxOpen) { S.boxOpen = false; }
    else if (S.moreKinds) { S.moreKinds = false; }
    else { S.pop = null; }
    return true;
  }
  /* pid: a Project's id, or null (or '') for an Unfiled piece, which opens on the page like any Doc. */
  function openDoc(pid, did) {
    pid = pid || null;
    var moved = pid !== (S.here.project || null);
    if (moved || did !== S.here.doc) { S.prev = { project: S.here.project, doc: S.here.doc }; }
    S.here = { project: pid, doc: did };
    D.recent = [{ project: pid, doc: did }].concat(D.recent.filter(function (r) { return !((r.project || null) === pid && r.doc === did); })).slice(0, 3);
    openPop(null);
    S.partsDrop = false;
    S.back.part = null;
    S.split = null;   // opening other work ends a split: the new Doc opens alone (not ruled)
    S.board = null;   // and takes her off a Board
    if (!pid) { note('PROPOSED', 'An Unfiled piece opens on the page like any Doc. You are in no Project, so the rail\u2019s top box is empty and reads Unfiled.'); }
    else if (moved) { note('NOT RULED', 'Opening a Doc from another Project moves you into that Project. The brief does not say so.'); }
  }
  /* Back to the Doc she was in before, when the piece she is in goes to the Trash. */
  function goBack() {
    var p = S.prev && S.prev.project ? proj(S.prev.project) : null;
    var ok = S.prev && (S.prev.project ? (p && docIn(p, S.prev.doc)) : unfiledDoc(S.prev.doc));
    S.here = ok ? S.prev : { project: 'thesis', doc: 'harbor-tolls' };
    S.prev = null;
    S.partsDrop = false;
    S.back.part = null;
  }
  function goPart(i) {
    var d = docHere(), n = partsOf(d).length;
    d.partHere = Math.min(n, Math.max(1, i));
    S.partsDrop = false;
  }
  function newProject() {
    var name = uniqueName('Untitled project', D.projects.map(function (p) { return p.name; }));
    var p = { id: 'project-' + (++S.counter), name: name, letters: '', colour: 'pale', pinned: false, docs: [], boards: [] };
    D.projects.push(p);
    return p;
  }

  var ACT = {
    pop: function (t) { togglePop({ kind: t.getAttribute('data-kind') }); },
    list: function (t) {
      togglePop({ kind: 'list', id: t.getAttribute('data-id') });
      if (t.getAttribute('data-from') === 'projects') { note('NOT RULED', 'A Project\u2019s name in ALL PROJECTS opens its own list, as its box on the rail does. The brief does not say so.'); }
    },
    'unfiled-box': function () {
      togglePop({ kind: 'unfiled' });
      note('NOT RULED', 'Pressing the empty box opens UNFILED. What the box shows is proposed; what it does when pressed is a guess.');
    },
    'pin-view': function (t) { S.pinView = t.getAttribute('data-id'); },
    stage: function (t) {
      S.stage = t.getAttribute('data-id');
      note('NOT RULED', 'The stages are milestone 6 (G). For now the button only marks the stage you are in.');
    },
    later: function (t) { note(t.getAttribute('data-mark') || '', t.getAttribute('data-note')); },
    'switch': function (t) {
      var g = t.getAttribute('data-group'), k = t.getAttribute('data-id');
      S[g][k] = !S[g][k];
    },
    fullscreen: function () {
      if (document.fullscreenElement) { document.exitFullscreen(); }
      else if (document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen(); }
    },

    /* Moving between Parts (B) */
    'parts-drop': function () { S.partsDrop = !S.partsDrop; },
    'go-part': function (t) { goPart(parseInt(t.getAttribute('data-id'), 10)); },
    'part-step': function (t) { goPart(docHere().partHere + parseInt(t.getAttribute('data-id'), 10)); },

    /* The two side menus (C) */
    front: function () { S.front.open = !S.front.open; },
    /* The Back menu's handle. While the search has the menu's place, the handle closes both. */
    back: function () {
      if (S.search.open) { closeSearch(); S.back.open = false; }
      else { S.back.open = !S.back.open; }
      if (!S.back.open) { S.back.part = null; }
    },
    'front-tab': function (t) { S.front.tab = t.getAttribute('data-id'); },
    'back-tab': function (t) {
      S.back.tab = t.getAttribute('data-id');
      if (S.back.tab !== 'assets') { S.back.part = null; }
    },
    'new-part': function () {
      var d = docHere(), parts = partsOf(d);
      var name = uniqueName('Untitled part', parts.map(function (x) { return x.name; }));
      parts.push({ name: name, words: 0, count: '0 words', paras: [] });
      d.parts = parts.length;
      d.partHere = parts.length;
      note('NOT RULED', '\u201c' + name + '\u201d was added after the last Part and opened. Where a new Part lands and what it is called are guesses.');
    },
    /* A Part's marker opens the Back menu's ASSETS tab filtered to that Part. Pressed again, it takes the filter off. */
    marker: function (t) {
      var i = parseInt(t.getAttribute('data-id'), 10);
      var searching = S.search.open;
      closeSearch();
      if (!searching && S.back.open && S.back.tab === 'assets' && S.back.part === i) { S.back.part = null; }
      else { S.back.open = true; S.back.tab = 'assets'; S.back.part = i; }
    },
    'show-all': function () { S.back.part = null; },
    'part-toggle': function (t) {
      var part = partsOf(docHere())[parseInt(t.getAttribute('data-id'), 10) - 1];
      part.open = !part.open;
    },
    'asset-order': function () { S.assetOrder = S.assetOrder === 'oldest' ? 'newest' : 'oldest'; },

    /* The search, and find and replace (D) */
    'search-bar': function () {
      if (S.search.open) { closeSearch(); }
      else { openSearch('bar'); }
    },
    'search-close': function () { closeSearch(); },
    reach: function (t) {
      S.search.reach = t.getAttribute('data-id');
      S.search.cur = null; S.search.more = {};
      S.search.focus = 'end';
    },
    /* PLAN, ASSETS or FEEDBACK; pressed again, back to the words themselves. */
    kind: function (t) {
      var k = t.getAttribute('data-id');
      S.search.kind = S.search.kind === k ? null : k;
      S.search.cur = null; S.search.more = {};
      S.search.focus = 'end';
    },
    more: function (t) { S.search.more[t.getAttribute('data-id')] = true; },
    /* A found word, pressed: go to its Part and bring it into view. In another Doc: open that Doc there. */
    hit: function (t) {
      var h = R && R.byKey[t.getAttribute('data-key')];
      if (!h) { return false; }
      if (!isHere(h.pid, h.did)) {
        openDoc(h.pid, h.did);
        note('NOT RULED', 'A result in another Doc opens that Doc at the found word, and the search stays open. The brief does not say so.');
      }
      goPart(h.part);
      S.search.cur = h.key; S.search.jump = true;
    },
    'replace-toggle': function () {
      S.search.replaceOpen = !S.search.replaceOpen;
      S.search.focus = S.search.replaceOpen ? 'with' : 'end';
    },
    'replace-one': function (t) {
      var h = R && R.byKey[t.getAttribute('data-key')];
      if (!h || !isHere(h.pid, h.did) || S.search.repl === '') { return false; }
      replaceHits([h]);
    },
    'replace-all': function () {
      if (!R || !R.here.length || S.search.repl === '') { return false; }
      replaceHits(R.here);
    },
    'replace-undo': function () {
      var u = S.search.undo.pop();
      if (!u) { return false; }
      partsOf(u.doc).forEach(function (part, n) { if (u.paras[n]) { part.paras = u.paras[n]; } });
      S.search.cur = null;
      note('NOT RULED', 'Undone: ' + (u.n === 1 ? 'one replace' : u.n + ' replaces') + ' in \u201c' + u.doc.name + '\u201d. An Undo button here is a guess.');
    },

    /* The split screen (E) */
    'open-beside': function (t) { openSplit({ kind: 'asset', id: t.getAttribute('data-id') }); },
    /* A Block, a Board or an imported file found by the search. */
    'hit-beside': function (t) {
      var id = t.getAttribute('data-id');
      openSplit(id ? { kind: 'asset', id: id } : { kind: 'board', name: t.getAttribute('data-board') });
    },
    'doc-beside': function (t) {
      openSplit({ kind: 'doc', pid: t.getAttribute('data-pid') || null, did: t.getAttribute('data-id') });
      openPop(null);
      note('NOT RULED', 'A second Doc beside the page is read-only (ruled). Where \u201cOpen beside\u201d sits and how the Doc looks there are guesses.');
    },
    'beside-drop': function () { S.split.drop = !S.split.drop; },
    'split-close': function () { S.split = null; },
    /* Closing the page's side. The brief says she can close either side; what is left then is not said. */
    'split-close-page': function () {
      var info = besideInfo();
      if (info.type === 'doc') {
        openDoc(info.pid, info.doc.id);
        note('NOT RULED', 'The page\u2019s side closed, so the Doc that was beside it is now on the page. What is left when the page\u2019s side closes is a guess.');
        return;
      }
      if (info.type === 'board' && boardPid(info.board)) {
        openBoard(boardPid(info.board), info.board);
        note('NOT RULED', 'The page\u2019s side closed, so the Board that was beside it is now on its own. What is left when the page\u2019s side closes is a guess.');
        return;
      }
      note('NOT RULED', 'Closing the page\u2019s side would leave the ' + { BOARD: 'Board', BLOCK: 'Block', PDF: 'imported file' }[info.tag] + ' on its own. For a Block or an imported file the brief does not say what that is.');
      return false;
    },
    'blk-unpop': function () {
      if (S.split) { S.split.pop = null; }
      if (S.board) { S.board.pop = null; }
    },

    /* A Board on its own (F) */
    'open-board': function (t) {
      var name = t.getAttribute('data-name'), pid = t.getAttribute('data-pid') || boardPid(name);
      if (!pid || !proj(pid)) { note('NOT RULED', 'This Board is in no Project here, so it cannot open on its own in this prototype.'); return false; }
      openBoard(pid, name, !!t.getAttribute('data-connect'));
    },
    /* Back to the page, as she left it: the same Doc, Part, scroll and stage. */
    'board-back': function () { S.board = null; },
    'board-view': function (t) {
      S.board.view = t.getAttribute('data-id');
      S.board.pop = null; S.board.connect = false;
    },
    'board-step': function (t) { return stepFlip(parseInt(t.getAttribute('data-id'), 10)); },
    'connect-drop': function () { S.board.connect = !S.board.connect; S.board.pop = null; },
    'connect-to': function (t) {
      var b = S.board, p = proj(b.pid), d = docIn(p, t.getAttribute('data-id'));
      if (!d || boardDocs(p, b.name).indexOf(d) !== -1) { return false; }
      connectBoard(p, d, b.name);
      b.connect = false;
      note('NOT RULED', '\u201c' + b.name + '\u201d is now one of the assets of \u201c' + d.name + '\u201d, connected to the Doc and to no Part. It stays in ' + p.name + '. Which Part it joins, and that you stay on the Board, are guesses.');
    },
    'connect-new': function () {
      var b = S.board, p = proj(b.pid);
      var name = uniqueName('Untitled doc', p.docs.map(function (x) { return x.name; }));
      var d = { id: 'doc-' + (++S.counter), name: name, parts: 1, words: 0, isNew: true };
      p.docs.push(d);
      connectBoard(p, d, b.name);
      b.connect = false;
      note('NOT RULED', '\u201c' + name + '\u201d was made in ' + p.name + ' and \u201c' + b.name + '\u201d is one of its assets. You stay on the Board. The new Doc\u2019s name, and that it does not open, are guesses.');
    },

    /* DOCS and a Project's own list */
    'more-kinds': function () { S.moreKinds = !S.moreKinds; },
    'open-doc': function (t) { openDoc(t.getAttribute('data-pid'), t.getAttribute('data-id')); },
    'new-doc': function (t) {
      var pid = t.getAttribute('data-pid') || nowPid(), p = pid ? proj(pid) : null, kind = t.getAttribute('data-id');
      var taken = (p ? p.docs : D.unfiled).map(function (d) { return d.name; });
      var name = uniqueName(kind === 'blank' ? 'Untitled doc' : 'Untitled ' + kind, taken);
      var d = { id: 'doc-' + (++S.counter), name: name, parts: 1, words: 0, isNew: true };
      if (p) { p.docs.push(d); }
      else { d.date = 'Nov 14'; D.unfiled.push(d); }
      openDoc(p ? p.id : null, d.id);
      note('NOT RULED', '\u201c' + name + '\u201d was made in ' + (p ? p.name : 'Unfiled, because you are in no Project,') + ' and opened. Where a new Doc lands and what it is called are guesses.');
    },
    'new-board': function (t) {
      var p = proj(t.getAttribute('data-id'));
      if (!p) { note('NOT RULED', 'Not built: you are in no Project, and the brief does not say where a new Board lands then.'); return; }
      var name = uniqueName('Untitled board', p.boards.map(function (b) { return b.name; }));
      p.boards.push({ id: 'board-' + (++S.counter), name: name, meta: '0 blocks' });
      openBoard(p.id, name);
      note('NOT RULED', '\u201c' + name + '\u201d was made in ' + p.name + ' with no Doc, and opened on its own. Its name, and that it opens at once, are guesses.');
    },

    /* PROJECTS */
    'new-project': function () {
      var p = newProject();
      note('NOT RULED', '\u201c' + p.name + '\u201d was made: no letters, pale grey, not pinned. The brief does not say how a new Project starts.');
    },
    pin: function (t) { var p = proj(t.getAttribute('data-id')); p.pinned = !p.pinned; },
    'box-toggle': function () {
      if (!projHere()) { note('NOT RULED', 'Box settings act only on the Project you are in, and you are in none. What shows here then is a guess.'); return; }
      S.boxOpen = !S.boxOpen;
    },
    'no-letters': function () { var p = projHere(); if (p) { p.letters = ''; } },
    colour: function (t) { var p = projHere(); if (p) { p.colour = t.getAttribute('data-id'); } },
    'own-colour': function () {
      var p = projHere();
      if (!p) { return false; }
      el.colour.value = COLOURS[p.colour] ? COLOURS[p.colour].panel.toLowerCase() : p.colour;
      el.colour.click();
      return false;
    },
    picture: function () { el.picture.value = ''; el.picture.click(); return false; },
    'no-picture': function () { var p = projHere(); if (p) { p.picture = null; } },

    /* UNFILED */
    'unfiled-open': function (t) { openDoc(null, t.getAttribute('data-id')); },
    file: function (t) { var id = t.getAttribute('data-id'); S.fileFor = S.fileFor === id ? null : id; },
    'file-into': function (t) {
      var id = t.getAttribute('data-id'), pid = t.getAttribute('data-pid');
      var u = unfiledDoc(id);
      var p = pid === '__new' ? newProject() : proj(pid);
      var inIt = !S.here.project && S.here.doc === id;
      D.unfiled = D.unfiled.filter(function (x) { return x.id !== id; });
      p.docs.push(u);
      S.fileFor = null;
      if (inIt) { S.here = { project: p.id, doc: id }; }
      note(inIt ? 'NOT RULED' : '', '\u201c' + u.name + '\u201d is filed in ' + p.name + '.' + (inIt ? ' You were in it, so you are now in ' + p.name + '. The brief does not say so.' : ''));
    },
    trash: function (t) {
      var id = t.getAttribute('data-id');
      var u = unfiledDoc(id);
      var inIt = !S.here.project && S.here.doc === id;
      D.unfiled = D.unfiled.filter(function (x) { return x.id !== id; });
      D.trash.unshift({ id: u.id, name: u.name, words: u.words, date: u.date, from: null, doc: u });
      S.fileFor = null;
      if (inIt) { goBack(); }
      note(inIt ? 'NOT RULED' : '', '\u201c' + u.name + '\u201d is in the Trash.' + (inIt ? ' You were in it, so you are back in the Doc you were in before. The brief does not say so.' : ''));
    },
    'trash-open': function () { S.trashOpen = true; S.fileFor = null; },
    'trash-close': function () { S.trashOpen = false; },
    restore: function (t) {
      var id = t.getAttribute('data-id');
      var x = D.trash.filter(function (y) { return y.id === id; })[0];
      D.trash = D.trash.filter(function (y) { return y.id !== id; });
      var p = x.from && proj(x.from);
      var back = x.doc || { id: x.id, name: x.name, parts: 1, words: x.words, date: x.date };
      if (p) { p.docs.push(back); }
      else { D.unfiled.push(back); }
      note('', '\u201c' + x.name + '\u201d is back in ' + (p ? p.name : 'Unfiled') + '.');
    },
    'delete': function (t) {
      var id = t.getAttribute('data-id');
      D.trash = D.trash.filter(function (y) { return y.id !== id; });
    }
  };

  shell.addEventListener('click', function (e) {
    if (!e.target.closest) { return; }
    if (e.target.closest('.toast')) { el.toast.hidden = true; return; }
    var t = e.target.closest('[data-act]');
    var dirty = false;
    /* A click anywhere else closes the list of Parts. */
    if (S.partsDrop && !e.target.closest('.drop') && !e.target.closest('.crumb-part')) { S.partsDrop = false; dirty = true; }
    /* And the list under the asset's name, in a split. */
    if (S.split && S.split.drop && !e.target.closest('.beside-drop') && !e.target.closest('.beside-name')) { S.split.drop = false; dirty = true; }
    /* And the Connect Doc list, on a Board. */
    if (S.board && S.board.connect && !e.target.closest('.connect') && !e.target.closest('.connect-btn')) { S.board.connect = false; dirty = true; }
    if (!t) {
      /* A click on the room, the page or a side menu closes an open pop-out. */
      if (S.pop && !e.target.closest('.pop') && !e.target.closest('.rail') && !e.target.closest('.offstage')) { openPop(null); dirty = true; }
      if (dirty) { render(); }
      return;
    }
    var fn = ACT[t.getAttribute('data-act')];
    if (fn && fn(t) !== false) { dirty = true; }
    if (dirty) { render(); }
  });

  document.addEventListener('keydown', function (e) {
    /* Ctrl+F opens the same search as the top bar's button, in the Doc she is in. Pressed again, it goes back to the field. */
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      if (S.board) { note('NOT RULED', 'Search from a Board is not built: the brief does not say what it looks in there.'); return; }
      openSearch('bar');
      render();
      return;
    }
    /* The Flip view, from the keyboard: the arrow keys go to the Block before and the next one. */
    if (S.board && S.board.view === 'flip' && !S.board.pop && !S.board.connect && !S.pop && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
        !(e.target && e.target.classList && e.target.classList.contains('blk-text'))) {
      if (stepFlip(e.key === 'ArrowLeft' ? -1 : 1) !== false) { e.preventDefault(); render(); }
      return;
    }
    if (e.key === 'Enter' && e.target && e.target.id === 'search-q') {
      e.preventDefault();
      if (stepHit(e.shiftKey ? -1 : 1)) { render(); }
      return;
    }
    /* A Block's words are one run of text: Enter ends the writing instead of breaking the line. */
    if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('blk-text')) {
      e.preventDefault();
      e.target.blur();
      return;
    }
    /* The grip, from the keyboard: the arrow keys move the split. */
    if (S.split && e.target && e.target.id === 'grip' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      S.split.x = splitX() + (e.key === 'ArrowLeft' ? -16 : 16);
      place();
      return;
    }
    if (e.key === 'Escape' && stepBack()) { render(); }
  });

  /* A double click on a Block's empty area pops it out. On its words it selects a word, as anywhere. */
  shell.addEventListener('dblclick', function (e) {
    var on = S.board || S.split;
    if (!on || !e.target.closest) { return; }
    var blk = e.target.closest('.blk');
    if (!blk || blk.classList.contains('is-popped') || e.target.closest('.blk-text')) { return; }
    on.pop = { board: blk.getAttribute('data-board'), i: parseInt(blk.getAttribute('data-i'), 10) };
    if (S.board) { S.board.connect = false; }
    if (window.getSelection) { window.getSelection().removeAllRanges(); }
    render();
  });
  /* Writing in a Block's words, where they stand. Nothing is drawn again, so the caret stays put. */
  shell.addEventListener('input', function (e) {
    if (!e.target.classList || !e.target.classList.contains('blk-text')) { return; }
    var blk = e.target.closest('.blk');
    var b = blk ? (D.blocks[blk.getAttribute('data-board')] || [])[parseInt(blk.getAttribute('data-i'), 10)] : null;
    if (b) { b.text = e.target.textContent; }
  });
  /* The grip: drag it to change the split. It stops where the page would be squeezed under its own 620 px. */
  shell.addEventListener('pointerdown', function (e) {
    if (!S.split || !e.target.closest || !e.target.closest('.grip')) { return; }
    var off = e.clientX - splitX();
    function move(ev) { S.split.x = ev.clientX - off; place(); }
    function up() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      if (S.split) { S.split.x = splitX(); }
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    e.preventDefault();
  });

  /* The moment she clicks into a tab's search field, the whole Back menu becomes the search menu,
     on the scope of the tab she came from. (After the click has finished, so the field is not swapped under it.) */
  el.menus.addEventListener('focusin', function (e) {
    if (!e.target.classList || !e.target.classList.contains('search-door')) { return; }
    var from = S.back.tab;
    setTimeout(function () {
      if (S.search.open || !S.back.open) { return; }
      openSearch(from);
      render();
    }, 0);
  });
  /* Typing in the search field, or in "Replace with". The caret is kept across the render. */
  el.menus.addEventListener('input', function (e) {
    if (e.target.id === 'search-q') {
      S.search.q = e.target.value; S.search.cur = null; S.search.more = {};
      render();
    } else if (e.target.id === 'replace-with') {
      S.search.repl = e.target.value;
      render();
    }
  });

  /* Box settings: the letters, her own colour, her picture. Held in memory only. */
  shell.addEventListener('input', function (e) {
    var p = projHere();
    if (!p) { return; }
    if (e.target.id === 'letters') {
      p.letters = e.target.value.toUpperCase().slice(0, 2);
      renderRail();
      var rows = el.pop.querySelectorAll('.row-box[data-box="' + p.id + '"]');
      for (var i = 0; i < rows.length; i++) { rows[i].innerHTML = boxHtml(p, '30', 'panel'); }
      paintPictures(el.pop);
    } else if (e.target === el.colour && /^#[0-9a-f]{6}$/i.test(el.colour.value)) {
      p.colour = el.colour.value;
      render();
    }
  });
  el.picture.addEventListener('change', function () {
    var f = el.picture.files && el.picture.files[0], p = projHere();
    if (!p || !f || !/^image\//.test(f.type)) { return; }
    var reader = new FileReader();
    reader.onload = function () {
      p.picture = String(reader.result);
      render();
      note('NOT RULED', 'A picture takes the place of the colour and the letters. The frames show the button, not the result.');
    };
    reader.readAsDataURL(f);
  });
  document.addEventListener('fullscreenchange', function () { render(); });

  /* The page sits in the middle of the room right of the rail: left 415 in a 1366 window.
     In a split it sits in the middle of its own side, which starts 16 px right of the rail and
     ends 5 px short of the asset's side (frame P3-23A: left 100 at half in a 1366 window). */
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
  window.addEventListener('resize', function () { place(); renderDrop(); syncThumb(); });
  window.addEventListener('load', syncThumb);
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) { document.fonts.ready.then(syncThumb); }

  /* Doors for the checklist: index.html#docs and the like open one state directly. */
  function applyHash() {
    var h = (location.hash || '').replace('#', ''), end = false, sc;
    if (!h) { return; }
    openPop(null);
    closeSearch();
    S.partsDrop = false;
    S.split = null;
    S.board = null;
    if (h === 'pins-list') { S.pinView = 'list'; }
    else if (h === 'pins-boxes') { S.pinView = 'boxes'; }
    else if (h === 'day-one') {
      D.projects.forEach(function (p) { p.pinned = false; });
      D.notebook.pinned = false;
      S.here = { project: 'new-project', doc: 'notes-on-the-ledgers' };
    }
    else if (h === 'docs' || h === 'projects' || h === 'unfiled' || h === 'theme' || h === 'controls') { openPop({ kind: h }); }
    else if (h === 'box') { openPop({ kind: 'projects' }); S.boxOpen = true; }
    else if (h === 'trash') { openPop({ kind: 'unfiled' }); S.trashOpen = true; }
    else if (h === 'list') { openPop({ kind: 'list', id: S.here.project || 'thesis' }); }
    else if (h.indexOf('list-') === 0 && proj(h.slice(5))) { openPop({ kind: 'list', id: h.slice(5) }); }
    else if (h === 'unfiled-piece' && unfiledDoc('ferry-timetable')) { openDoc(null, 'ferry-timetable'); }
    else if (h === 'parts-drop') { S.partsDrop = true; }
    else if (h === 'part-end') { end = true; }
    else if (h === 'front') { S.front.open = true; S.front.tab = 'parts'; }
    else if (h === 'parts-expanded') {
      S.front.open = true; S.front.tab = 'parts';
      partsOf(docHere()).forEach(function (part, n) { part.open = n >= 1 && n <= 3; });
    }
    else if (h === 'marker') {
      S.front.open = true; S.front.tab = 'parts';
      S.back.open = true; S.back.tab = 'assets'; S.back.part = docHere().partHere;
    }
    else if (h === 'assets' || h === 'plan' || h === 'feedback') { closeSearch(); S.back.open = true; S.back.tab = h; S.back.part = null; }
    else if (h === 'search' || h === 'search-project' || h === 'search-everything' || h === 'replace') {
      closeSearch();
      openSearch('bar');
      S.search.q = 'toll';
      if (h === 'search-project' && reachOk('project')) { S.search.reach = 'project'; }
      if (h === 'search-everything') { S.search.reach = 'all'; }
      if (h === 'replace') { S.search.replaceOpen = true; S.search.repl = 'due'; }
    }
    /* The split screen (E). These doors start from the thesis Doc. */
    else if (h.indexOf('split') === 0) {
      if (!docIn(proj('thesis'), 'harbor-tolls')) { render(); return; }
      S.here = { project: 'thesis', doc: 'harbor-tolls' };
      if (h === 'split-doc') { openSplit({ kind: 'doc', pid: 'thesis', did: 'committee-memo-draft' }); }
      else if (h === 'split-same-doc') { openSplit({ kind: 'doc', pid: 'thesis', did: 'harbor-tolls' }); }
      else if (h === 'split-pdf') { openSplit({ kind: 'asset', id: 'a05' }); }
      else if (h === 'split-block') { openSplit({ kind: 'asset', id: 'a04' }); }
      else { openSplit({ kind: 'asset', id: 'a06' }); }
      if (h === 'split-pop') { S.split.pop = { board: 'Method notes', i: 2 }; }
      if (h === 'split-drop') { S.split.drop = true; }
      if (h === 'split-search') { openSearch('bar'); S.search.q = 'toll'; }
    }
    /* A Board on its own (F). These doors open the Board "Harbor map" in Thesis. */
    else if (h.indexOf('board') === 0) {
      if (!proj('thesis')) { render(); return; }
      openBoard('thesis', 'Harbor map', h === 'board-connect');
      if (h === 'board-connected' && docIn(proj('thesis'), 'harbor-tolls') && !boardDocs(proj('thesis'), 'Harbor map').length) {
        connectBoard(proj('thesis'), docIn(proj('thesis'), 'harbor-tolls'), 'Harbor map');
      }
      if (h === 'board-pop') { S.board.pop = { board: 'Harbor map', i: 1 }; }
      if (VIEWS.map(function (v) { return 'board-' + v.toLowerCase(); }).indexOf(h) !== -1) { S.board.view = h.slice(6); }
    }
    else if (h === 'search-assets' || h === 'search-plan' || h === 'search-feedback') {
      closeSearch();
      S.back.open = true; S.back.tab = h.slice(7); S.back.part = null;
      openSearch(S.back.tab);
      S.search.q = 'toll';
    }
    render();
    if (end) {
      sc = document.getElementById('part-scroll');
      if (sc) { sc.scrollTop = sc.scrollHeight; syncThumb(); }
    }
  }
  window.addEventListener('hashchange', applyHash);

  place();
  render();
  applyHash();
})();
