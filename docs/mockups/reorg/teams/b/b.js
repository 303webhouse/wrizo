/*
  Team B · "The organised cockpit" · Machina · a mockup, not app code.

  The prototype's own scripts (../../stage-table.js, ../../data.js, ../../app.js) run first, untouched.
  They draw every place and handle every click, key and door. This file only re-dresses what they
  have drawn: each time app.js redraws a container, the dress below runs over it.

  How it stays out of the prototype's way
  - It never changes app.js's state. A press here is either one of app.js's own acts (the same
    data-act the prototype uses) or one of four things of Team B's own, held in memory in B below.
  - Nothing is saved. Density, the review notes switch and Dark last until a reload. [DATA] none.
  - It never sets the page's place or size. It adds a small tag inside the page's heading and
    rewrites the line under the page; that is all it does to the page.

  Team B's own keys: F9 hides or shows the review notes; F8 switches Comfortable and Compact.
  Team B's own doors: #dark, #compact, #notes-off, #build-docs (state 1 with the Docs drawer open).
  #build, #sprint and #split are the prototype's own doors (#split then opens "Ledger sample sheet",
  as the two-teams brief asks).
*/
(function () {
  'use strict';

  var D = window.REORG_DATA, T = window.REORG_STAGE_TABLE || null;
  var root = document.documentElement, shell = document.getElementById('shell');
  if (!D || !shell) { return; }
  function $(id) { return document.getElementById(id); }
  var el = {
    bar: $('bar'), pop: $('pop'), menus: $('menus'), page: $('page'), foot: $('foot'), beside: $('beside'),
    board: $('board'), drop: $('drop'), changed: $('changed'), tag: $('state-tag'), toast: $('toast'), notes: $('b-notes')
  };

  /* Team B's own state. In memory only: a reload starts over. */
  var B = {
    density: 'comfortable',   // 'comfortable' | 'compact' (PROPOSED; not saved)
    notes: true,              // the review notes layer: on by default, F9 switches it
    notesOpen: false,         // the strip, opened to read every note
    dark: false,              // the dark room, in step with THEME's own Dark switch
    more: null,               // the "More" list that is open, by its id
    focusMore: false,
    scroll: {},               // where each list in the two menus is scrolled to
    lastPart: null,           // the Part the Assets list last showed as hers
    doc: null
  };

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function plural(n, one, many) { return num(n) + ' ' + (n === 1 ? one : many); }

  /* Signs, drawn square-cut on a 20 px grid. Each sits beside its word, never in its place. */
  var I = {
    search: '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.5 12.5l4.5 4.5"/>',
    link: '<path d="M8.2 11.8l3.6-3.6"/><path d="M9.6 6.4l1.3-1.3a3 3 0 014.2 4.2l-1.3 1.3"/><path d="M10.4 13.6l-1.3 1.3a3 3 0 01-4.2-4.2l1.3-1.3"/>',
    down: '<path d="M5 7.5l5 5 5-5"/>',
    right: '<path d="M7.5 5l5 5-5 5"/>',
    plus: '<path d="M10 4v12M4 10h12"/>',
    changed: '<path d="M4 6.5h11M12.5 4L15 6.5 12.5 9"/><path d="M16 13.5H5M7.5 11L5 13.5 7.5 16"/>',
    prompt: '<path d="M4 6l4 4-4 4"/><path d="M10.5 14.5H16"/>',
    setup: '<path d="M5 2.5h10v15H5z"/><path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3"/>',
    kind: '<path d="M4 6.5h9v11H4z"/><path d="M7 6.5v-4h9v11h-3"/>',
    guide: '<path d="M4.5 3h11v14h-11z"/><path d="M7.5 3v14M10 7h3M10 10h3"/>',
    split: '<path d="M4 3h12v4.5H4zM4 12.5h12V17H4z"/><path d="M2.5 10h3M8.5 10h3M14.5 10h3"/>',
    join: '<path d="M10 2.5v5M7.5 5L10 7.5 12.5 5"/><path d="M10 17.5v-5M7.5 15l2.5-2.5 2.5 2.5"/><path d="M4 10h12"/>',
    move: '<path d="M7 16V4M4.5 6.5L7 4l2.5 2.5"/><path d="M13 4v12M10.5 13.5L13 16l2.5-2.5"/>',
    own: '<path d="M5.5 2.5h6l3 3v12h-9z"/><path d="M8 11.5h4.5M10.5 9.5l2 2-2 2"/>',
    name: '<path d="M3.5 15L7 5h1l3.5 10M4.9 11.5h5.2"/><path d="M15.5 4v12M14 4h3M14 16h3"/>',
    level: '<path d="M3 5h14M7 10h10M11 15h6"/>',
    colour: '<path d="M4 4h12v12H4z"/><path d="M4 10.5h12M10 10.5V16"/>',
    goal: '<circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="2.5"/>',
    timer: '<circle cx="10" cy="11" r="5.5"/><path d="M10 8v3l2 1.5M8 3h4"/>',
    progress: '<path d="M4 16v-5M8 16V7M12 16V9M16 16V4"/>',
    counts: '<path d="M4 6h12M4 10h12M4 14h7"/>',
    byboard: '<path d="M3.5 4H8v4.5H3.5zM3.5 11.5H8V16H3.5z"/><path d="M11 6.5h6M11 13.5h6"/>',
    board: '<path d="M3.5 3.5h13v13h-13z"/><path d="M3.5 10h13M10 3.5v13"/>',
    block: '<path d="M3.5 5.5h13v9h-13z"/><path d="M6 8.5h5"/>',
    file: '<path d="M5.5 2.5h6l3 3v12h-9z"/><path d="M11.5 2.5v3h3"/>',
    read: '<path d="M2.5 10s3-5 7.5-5 7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5z"/><circle cx="10" cy="10" r="2"/>',
    beside: '<path d="M3 4h14v12H3z"/><path d="M10 4v12"/>',
    open: '<path d="M8.5 4.5H4V16h11.5v-4.5"/><path d="M11.5 3.5h5v5M16.5 3.5l-7 7"/>',
    order: '<path d="M6 4v12M3.5 13.5L6 16l2.5-2.5"/><path d="M11 6h6M11 10h4.5M11 14h3"/>'
  };
  function ico(name, size) {
    return I[name] ? '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' + I[name] + '</svg>' : '';
  }
  /* The sign that goes with an offer of the stage table, by its words. An offer with no sign shows its words alone. */
  var SAY = {
    'page setup': 'setup', 'kind': 'kind', 'style guide': 'guide',
    'split here': 'split', 'join': 'join', 'move': 'move', 'make it its own doc': 'own',
    'name': 'name', 'level': 'level', 'colour': 'colour', 'colours': 'colour',
    'the goal': 'goal', 'the timer': 'timer', 'progress': 'progress', 'what the goal counts': 'counts',
    'connect': 'link', 'the list by board': 'byboard', 'open the board': 'board',
    'open to read': 'read', 'open to read: what comes next': 'read', 'find across the doc': 'search'
  };
  var KIND = { PDF: 'file', BOARD: 'board', BLOCK: 'block', DOC: 'file' };

  /* The PARTS tab's offers, sorted by what they act on (group names PROPOSED): the whole Doc, or the Part
     she is in (its structure, its look). An offer of another stage that is none of these goes in a group
     named for that stage. */
  var DOC = ['page setup', 'kind', 'style guide'];
  var STRUCT = ['split here', 'join', 'move', 'make it its own doc'];
  var LOOK = ['name', 'level', 'colour'];
  /* ASSETS: the act a writer reaches for first leads (tying an asset to a Part), then the table's order. */
  var FIRST = { 'back/ASSETS': ['connect', 'the list by board'] };

  function key(o) { return o.say.trim().toLowerCase(); }
  function tagHtml(part) {
    var c = part && part.tag ? part.tag.colour : null;
    return c ? '<span class="b-tag c-' + esc(c) + '">' + esc((part.name || '').charAt(0).toUpperCase()) + '</span>' : '<span class="b-tag none"></span>';
  }
  function tint(part) { return 'b-tint-' + (part && part.tag ? part.tag.colour : 'none'); }
  function kindHtml(kind) { return '<span class="b-kind">' + ico(KIND[kind] || 'file', 11) + '<span>' + esc(kind) + '</span></span>'; }
  function partLabel(d, i) {
    var part = d.partList[i - 1];
    return 'Part ' + i + (part && part.name ? ' \u00b7 ' + part.name : '');
  }

  /* ---------- what app.js has on screen, read back from what it drew and from its data ---------- */

  function onBoard() { return shell.classList.contains('on-board'); }
  /* The Doc on the page: found in the data by the names app.js wrote in the top bar. */
  function docNow() {
    var dn = el.bar.querySelector('.crumb-doc'), pn = el.bar.querySelector('.crumb-project'), all, i, j, found = null;
    if (dn && pn && !onBoard()) {
      all = D.projects.concat([D.notebook]);
      for (i = 0; i < all.length && !found; i++) {
        if (all[i].name !== pn.textContent) { continue; }
        for (j = 0; j < all[i].docs.length; j++) { if (all[i].docs[j].name === dn.textContent) { found = all[i].docs[j]; break; } }
      }
      for (i = 0; i < D.unfiled.length && !found; i++) { if (D.unfiled[i].name === dn.textContent) { found = D.unfiled[i]; } }
      if (found && found.partList) { B.doc = found; }
    }
    if (!B.doc) {
      D.projects.forEach(function (p) { p.docs.forEach(function (d) { if (d.id === 'harbor-tolls' && d.partList) { B.doc = d; } }); });
    }
    return B.doc;
  }
  function stageNow() {
    var b = el.bar.querySelector('.stage-btn.is-here[data-act="stage"]');
    if (b) { B.stage = b.getAttribute('data-id'); }
    return B.stage || 'BUILD';
  }
  function stageOf(k) {
    var list = T && T.stages ? T.stages : [];
    for (var i = 0; i < list.length; i++) { if (list[i] && list[i].key === k) { return list[i]; } }
    return { key: k };
  }
  function assetsOf(d, i) {
    return D.assets.filter(function (a) { return a.doc === d.id && (i === undefined || a.part === i); })
      .sort(function (x, y) { return x.order - y.order; });
  }

  /* One cell of the stage table: { offers: [{ say, new, detail, act }], note }. */
  function cell(menu, row, k) {
    var r = T && T.onAPage && T.onAPage[menu] ? T.onAPage[menu][row] : null, c = r ? r[k] : null;
    if (!c) { return { offers: [], note: '' }; }
    return {
      offers: (c.offers || []).map(function (o) { return typeof o === 'string' ? { say: o } : o; })
        .filter(function (o) { return o && typeof o.say === 'string' && o.say && o.act !== 'new-part'; }),
      note: c.note || ''
    };
  }
  function find(list, o) {
    for (var i = 0; i < list.length; i++) { if (key(list[i]) === key(o)) { return list[i]; } }
    return null;
  }
  /* What a tab offers in a stage, each with "on" (offered now). keep: BUILD's full set keeps its places in
     every stage, and what this stage does not offer is drawn faint where it stands, so nothing jumps
     ("same place, every time"). Anything this stage adds comes after. */
  function items(menu, row, stage, keep) {
    var now = cell(menu, row, stage).offers, master = keep ? cell(menu, row, 'BUILD').offers : [], out, first;
    out = master.map(function (o) { var live = find(now, o); return { o: live || o, on: !!live }; });
    now.forEach(function (o) { if (!find(master, o)) { out.push({ o: o, on: true }); } });
    first = FIRST[menu + '/' + row];
    if (first) {
      out.sort(function (x, y) {
        var a = first.indexOf(key(x.o)), b = first.indexOf(key(y.o));
        return (a === -1 ? 99 : a) - (b === -1 ? 99 : b);
      });
    }
    return out;
  }

  /* ---------- the pieces of a zone ---------- */

  function offerBtn(menu, row, it, lead, stage, cls) {
    var o = it.o, say = esc(o.say), sign = ico(SAY[key(o)], 13), role = cls === 'b-mi' ? ' role="menuitem"' : '';
    if (!it.on) {
      return '<button type="button" class="' + cls + '"' + role + ' disabled title="' + say + ': not offered in ' + esc(stage) + '">' + sign + '<span>' + say + '</span></button>';
    }
    return '<button type="button" class="' + cls + (lead ? ' is-lead' : '') + '"' + role + ' data-act="offer" data-menu="' + menu + '" data-row="' + esc(row) + '" data-say="' + say + '"' +
      (o.new ? ' data-new="1"' : '') + ' title="' + esc(o.say + (o.detail ? ': ' + o.detail : '')) + '">' + sign + '<span>' + say + '</span></button>';
  }
  /* "More" (PROPOSED word): a group's rarer acts, one press away. live: is anything in it offered now. */
  function moreHtml(id, list, live, up) {
    var open = B.more === id && live;
    return '<span class="b-more"><button type="button" class="b-morebtn" data-b="more" data-id="' + id + '" aria-haspopup="true" aria-expanded="' + open + '"' +
      (live ? ' title="More"' : ' disabled title="Nothing more is offered in this stage"') + '><span>More</span>' + ico('down', 11) + '</button>' +
      (open ? '<span class="b-menu' + (up ? ' up' : '') + '" role="menu">' + list.join('') + '</span>' : '') + '</span>';
  }
  /* A row of tools: the first max show, the first one offered leads, the rest go under "More". */
  function tools(menu, row, list, max, id, stage, up) {
    var vis = list.slice(0, max), rest = list.slice(max), lead = -1, h = '', m = '';
    vis.forEach(function (it, k) { if (lead === -1 && it.on) { lead = k; } });
    vis.forEach(function (it, k) { h += offerBtn(menu, row, it, k === lead, stage, 'b-btn'); });
    if (rest.length) {
      m = moreHtml(id, rest.map(function (it) { return offerBtn(menu, row, it, false, stage, 'b-mi'); }), rest.some(function (it) { return it.on; }), up);
    }
    return { row: h, more: m };
  }
  function group(name, body, o) {
    o = o || {};
    return '<div class="b-group' + (o.cls ? ' ' + o.cls : '') + '"><div class="b-ghead' + (o.head ? ' ' + o.head : '') + '">' + (o.pre || '') +
      '<span class="b-gname">' + esc(name) + '</span>' + (o.count !== undefined ? '<span class="b-count">' + o.count + '</span>' : '') +
      '<span class="b-grow"></span>' + (o.post || '') + '</div>' + body + '</div>';
  }
  function toolsBody(t, c) {
    if (!T) { return '<div class="b-line">stage-table.js did not load. Look in it for a slip (a missing comma or quote), then reload.</div>'; }
    return t.row ? '<div class="b-tools">' + t.row + '</div>' : '<div class="b-line">' + esc(c.note || 'Nothing.') + '</div>';
  }
  /* One shape for "how many assets are connected to this Part", in the Parts list and on the Assets group.
     Pressed in either place it does the same thing: the Back menu's ASSETS, connected to that Part. */
  function linkChip(i, n, pressed) {
    var say = plural(n, 'connected asset', 'connected assets') + ': show them alone in the Back menu';
    return '<button type="button" class="b-links" data-act="marker" data-id="' + i + '" aria-pressed="' + !!pressed + '" aria-label="' + say + '" title="' + say + '">' + ico('link', 12) + '<span>' + n + '</span></button>';
  }
  /* Wrap a flat run of heads and rows (as app.js writes its lists) into boxed groups, one for each head. */
  function boxify(body) {
    var kids = Array.prototype.slice.call(body.children), g = null;
    kids.forEach(function (k) {
      if (k.classList.contains('b-group')) { g = null; return; }
      var head = k.classList.contains('group-head') || k.classList.contains('pin-head');
      if (head || !g) { g = document.createElement('div'); g.className = 'b-group'; body.insertBefore(g, k); }
      if (head) { k.classList.add('b-ghead'); }
      g.appendChild(k);
    });
  }

  /* ---------- the top bar: where she is, wide to narrow · the stages · three quiet tools ---------- */

  function dressBar() {
    var cp = el.bar.querySelector('.crumb-part'), d, parts, part, utils, n;
    if (!cp || cp.hasAttribute('data-b')) { return; }
    cp.setAttribute('data-b', '1');
    d = docNow();
    if (!onBoard() && d) {
      parts = d.partList; part = parts[d.partHere - 1];
      /* The Part's place wears the Part's colour: the same lettered tag as in the Parts list. */
      cp.innerHTML = tagHtml(part) + '<span class="b-crumb-place">Part ' + d.partHere + ' of ' + parts.length + '</span>' +
        (part.name ? '<span class="b-crumb-dot" aria-hidden="true">\u00b7</span><span class="b-crumb-name">' + esc(part.name) + '</span>' : '') + ico('down', 12);
    }
    utils = document.createElement('div');
    utils.className = 'b-utils';
    n = el.bar.querySelector('.changed-btn');
    if (n) { n.innerHTML = ico('changed', 14) + '<span class="b-word">What changed</span>'; utils.appendChild(n); }
    n = el.bar.querySelector('.bar-cmd');
    if (n) {
      n.innerHTML = ico('prompt', 14) + '<span class="b-word">Command line</span><span class="b-key">Ctrl+.</span>';
      n.title = 'Command line (Ctrl+.)';
      utils.appendChild(n);
    }
    n = el.bar.querySelector('.bar-search');
    if (n) { n.innerHTML = ico('search', 14) + '<span class="b-word">Search</span><span class="b-key">Ctrl+F</span>'; utils.appendChild(n); }
    el.bar.appendChild(utils);
  }

  /* The list of Parts under the top bar: the same tags, and it hangs from where the Part's place now is. */
  function dressDrop() {
    var drop = el.drop.querySelector('.drop'), cp = el.bar.querySelector('.crumb-part'), d = docNow(), rows, i;
    if (!drop || drop.hasAttribute('data-b') || drop.classList.contains('connect') || !d) { return; }
    drop.setAttribute('data-b', '1');
    if (cp) { drop.style.left = Math.max(0, cp.offsetLeft - 14) + 'px'; }
    rows = drop.querySelectorAll('.drop-row[data-act="go-part"]');
    for (i = 0; i < rows.length; i++) {
      var part = d.partList[parseInt(rows[i].getAttribute('data-id'), 10) - 1], num0 = rows[i].querySelector('.part-num');
      if (part && num0) { num0.insertAdjacentHTML('afterend', tagHtml(part)); }
      if (part && rows[i].classList.contains('is-here')) { rows[i].classList.add(tint(part)); }
    }
  }

  /* ---------- the page: a small tag on its heading, and the line under it ---------- */

  function dressPage() {
    var sc = $('part-scroll'), d = docNow(), secs, h1, k;
    if (!sc || sc.hasAttribute('data-b') || !d) { return; }
    sc.setAttribute('data-b', '1');
    if (sc.classList.contains('is-whole')) {
      secs = sc.querySelectorAll('.whole-part');
      for (k = 0; k < secs.length; k++) {
        h1 = secs[k].querySelector('h1');
        if (h1 && d.partList[k] && d.partList[k].tag) { h1.insertAdjacentHTML('afterbegin', tagHtml(d.partList[k])); }
      }
      return;
    }
    h1 = sc.querySelector('h1');
    /* The heading wears the Part's tag. The page's colour never changes. */
    if (h1 && d.partList[d.partHere - 1] && d.partList[d.partHere - 1].tag) { h1.insertAdjacentHTML('afterbegin', tagHtml(d.partList[d.partHere - 1])); }
  }
  /* Whole pages, as Nick approved for the page-break marks: "page 1 of 2", never "1.6 pages".
     Worked out as the prototype works its pages out (260 words to a page); the page she is on follows the scroll. */
  function pageBit() {
    var d = docNow(), sc = $('part-scroll'), whole, words, pages, room, at;
    if (!d) { return ''; }
    whole = !!sc && sc.classList.contains('is-whole');
    words = whole ? d.words : (d.partList[d.partHere - 1].words || 0);
    pages = Math.max(1, Math.ceil(words / 260));
    room = sc ? sc.scrollHeight - sc.clientHeight : 0;
    at = Math.min(pages, 1 + Math.floor((room > 0 ? sc.scrollTop / room : 0) * pages));
    return 'page ' + at + ' of ' + pages;
  }
  function dressFoot() {
    var d = docNow(), first = el.foot.firstElementChild, parts, i, part, n, words, bits;
    if (onBoard() || !d || (first && first.classList.contains('b-lead'))) { return; }
    parts = d.partList; i = d.partHere; part = parts[i - 1]; n = parts.length; words = part.words || 0;
    bits = [
      '<span class="b-lead">' + esc(part.count || plural(words, 'word', 'words')) + '</span>',
      '<span id="b-pageno">' + pageBit() + '</span>',
      '<span>~' + Math.ceil(words / 230) + ' min read</span>',
      '<span>Part ' + i + ' of ' + n + '</span>',
      '<span>' + (n > 1 ? plural(d.words, 'word', 'words') + ' in the doc' : 'no goal set') + '</span>'
    ];
    el.foot.innerHTML = bits.join('<span aria-hidden="true">\u00b7</span>');
  }
  el.page.addEventListener('scroll', function () {
    var p = $('b-pageno'), t;
    if (!p) { return; }
    t = pageBit();
    if (p.textContent !== t) { p.textContent = t; }
  }, true);

  /* ---------- the Front menu ---------- */

  function expHtml(i, list, newest) {
    var rows = newest ? list.slice().reverse() : list;
    var h = '<div class="b-exp"><div class="b-exp-list" data-keep="exp-' + i + '">';
    rows.forEach(function (a) {
      h += '<button type="button" class="b-exp-row" data-act="open-beside" data-id="' + a.id + '" title="Open beside the page: ' + esc(a.name) + '">' +
        kindHtml(a.kind) + '<span class="b-exp-name">' + esc(a.name) + '</span><span class="b-exp-date">' + esc(a.added) + '</span></button>';
    });
    return h + '</div></div>';
  }
  /* PARTS, wide to narrow: this doc's tools · the doc's Parts · the tools of the Part she is in. */
  function partsBody(front, d, stage) {
    var parts = d.partList, here = d.partHere, part = parts[here - 1], h = '', b = '';
    var st = [], lk = [], dc = [], only = [], tDoc, tSt, tLk, tOnly, c = cell('front', 'PARTS', stage);
    var newPart = !!front.querySelector('[data-act="new-part"]');
    var orderHead = front.querySelector('.menu-body > .exp-head'), newest = !!orderHead && /NEWEST/.test(orderHead.textContent);
    function sub(name, t) {
      return '<div class="b-sub"><div class="b-sublabel"><span>' + name + '</span><span class="b-grow"></span>' + t.more + '</div><div class="b-tools">' + t.row + '</div></div>';
    }
    items('front', 'PARTS', stage, true).forEach(function (it) {
      var k = key(it.o);
      (STRUCT.indexOf(k) !== -1 ? st : LOOK.indexOf(k) !== -1 ? lk : DOC.indexOf(k) !== -1 ? dc : only).push(it);
    });
    dc.sort(function (x, y) { return DOC.indexOf(key(x.o)) - DOC.indexOf(key(y.o)); });
    st.sort(function (x, y) { return STRUCT.indexOf(key(x.o)) - STRUCT.indexOf(key(y.o)); });
    lk.sort(function (x, y) { return LOOK.indexOf(key(x.o)) - LOOK.indexOf(key(y.o)); });
    tDoc = tools('front', 'PARTS', dc, 3, 'f-doc', stage);
    tSt = tools('front', 'PARTS', st, 3, 'f-struct', stage);
    tLk = tools('front', 'PARTS', lk, 3, 'f-look', stage);
    tOnly = tools('front', 'PARTS', only, 4, 'f-only', stage);

    if (!T || dc.length) { h += group('This doc', toolsBody(tDoc, c), { post: tDoc.more }); }
    /* What only this stage offers (FINALIZE: what goes out) is not hidden among the faint ones. */
    if (only.length) { h += group('Only in ' + stage, toolsBody(tOnly, c), { post: tOnly.more }); }

    /* "New part" is the one main act of this zone. Where a stage does not offer it, it keeps its place, faint. */
    b = orderHead ? '<div class="b-order"><span>Connected assets: <b>' + (newest ? 'newest first' : 'oldest first') + '</b></span>' +
      '<button type="button" class="b-quietbtn" data-act="asset-order" title="Flip the order of every Part\u2019s connected assets">' + ico('order', 12) + '<span>' + (newest ? 'Oldest first' : 'Newest first') + '</span></button></div>' : '';
    parts.forEach(function (pt, n) {
      var i = n + 1, on = i === here, list = assetsOf(d, i), name = pt.name || 'Part ' + i;
      var mk = front.querySelector('.marker[data-id="' + i + '"]'), pressed = !!mk && mk.getAttribute('aria-pressed') === 'true';
      b += '<div class="b-prow' + (on ? ' is-here ' + tint(pt) : '') + '">' + (on ? '<span class="here-bar"></span>' : '') +
        '<span class="b-num">' + i + '</span>' + tagHtml(pt) +
        '<button type="button" class="b-prow-main" data-act="go-part" data-id="' + i + '"' + (on ? ' aria-current="true"' : '') + '><span class="b-pname">' + esc(name) + '</span><span class="b-fact mono">' + esc(pt.count) + '</span></button>' +
        (list.length ? linkChip(i, list.length, pressed) : '') +
        (list.length ? '<button type="button" class="b-toggle" data-act="part-toggle" data-id="' + i + '" aria-expanded="' + !!pt.open + '" aria-label="Show the assets connected to ' + esc(name) + ' here" title="Show its connected assets here">' + ico(pt.open ? 'down' : 'right', 13) + '</button>' : '<span class="b-toggle none"></span>') +
        '</div>';
      if (pt.open && list.length) { b += expHtml(i, list, newest); }
    });
    h += group('Parts of this doc', b, {
      cls: 'b-parts', count: parts.length,
      post: '<button type="button" class="b-btn is-solid"' + (newPart ? ' data-act="new-part" title="New part"' : ' disabled title="New part: not offered in ' + esc(stage) + '"') + '>' + ico('plus', 12) + '<span>New part</span></button>'
    });

    /* The tools of the Part she is in sit under that Part's own colour, not in a band at the top. */
    if (st.length || lk.length) {
      h += '<div class="b-group b-thispart ' + tint(part) + '"><div class="b-ghead is-tinted">' + tagHtml(part) + '<span class="b-gname">' + esc(partLabel(d, here)) + '</span></div>' +
        (st.length ? sub('Structure', tSt) : '') + (lk.length ? sub('Look', tLk) : '') + '</div>';
    }
    return h;
  }
  function sessionHtml(stage) {
    var t = tools('front', 'THE SESSION', items('front', 'THE SESSION', stage, true), 3, 'f-session', stage, true);
    return group('The session', toolsBody(t, cell('front', 'THE SESSION', stage)), { post: t.more });
  }
  function dressFront(front, d, stage) {
    var on = front.querySelector('.tab.is-on'), tab = on ? on.getAttribute('data-id') : 'parts';
    var body = front.querySelector('.menu-body'), ses = front.querySelector('.session'), row, t;
    if (!body) { return; }
    if (tab === 'parts') {
      body.innerHTML = partsBody(front, d, stage);
    } else {
      row = tab.toUpperCase();
      t = tools('front', row, items('front', row, stage, false), 4, 'f-' + tab, stage);
      body.innerHTML = group(tab.charAt(0).toUpperCase() + tab.slice(1), toolsBody(t, cell('front', row, stage)), { post: t.more });
    }
    if (ses) { ses.innerHTML = sessionHtml(stage); }
  }

  /* ---------- the Back menu ---------- */

  /* An asset as a compact card: its kind and name, then its facts and its one act. A Board's second
     act ("Open", on its own) is under "More" on the card. */
  function cardHtml(a, hers, splitOk, stage) {
    var more = '';
    if (a.kind === 'BOARD') {
      more = moreHtml('card-' + a.id, ['<button type="button" class="b-mi" role="menuitem" data-act="open-board" data-name="' + esc(a.name) + '" title="Open the Board on its own">' +
        ico('open', 13) + '<span>Open</span><span class="b-mi-fact">the Board on its own</span></button>'], true);
    }
    return '<div class="b-card"><div class="b-card-top">' + kindHtml(a.kind) + '<span class="b-card-name">' + esc(a.name) + '</span></div>' +
      '<div class="b-card-foot"><span class="b-fact" title="' + esc(a.meta) + '">' + esc(a.meta) + '</span>' + more +
      '<button type="button" class="b-btn' + (hers ? ' is-solid' : '') + '" data-act="open-beside" data-id="' + a.id + '"' +
      (splitOk ? ' title="Open beside the page"' : ' disabled title="No split screen in ' + esc(stage) + ' (the stage table, Q25)"') + '>' + ico('beside', 13) + '<span>Open beside</span></button></div></div>';
  }
  /* ASSETS, wide to narrow: the doc's tools · a group for each Part, in the doc's order · each asset a card.
     The group of the Part she is in wears that Part's tint, with brass on top. */
  function assetsBody(back, d, stage) {
    var all = assetsOf(d), parts = d.partList, splitOk = stageOf(stage).split !== false;
    var t = tools('back', 'ASSETS', items('back', 'ASSETS', stage, false), 2, 'b-assets', stage);
    var fh = back.querySelector('.filter-head'), fn = fh ? fh.querySelector('.filter-name') : null, m = fn ? /Part (\d+)/.exec(fn.textContent) : null;
    var only = m ? parseInt(m[1], 10) : null;
    var h = group('Assets of this doc', toolsBody(t, cell('back', 'ASSETS', stage)), { count: all.length, post: t.more });
    function agroup(i) {
      var list = assetsOf(d, i), pt = i ? parts[i - 1] : null, on = i === d.partHere, cards = '';
      if (!list.length && only !== i) { return ''; }
      list.forEach(function (a) { cards += cardHtml(a, on, splitOk, stage); });
      if (!list.length) { cards = '<div class="b-line">No assets connected to this Part.</div>'; }
      return '<div class="b-agroup' + (on ? ' is-here' : '') + ' ' + tint(pt) + '"><div class="b-ghead b-ahead' + (on ? ' is-here is-tinted' : '') + '">' +
        (on ? '<span class="here-bar"></span>' : '') + tagHtml(pt) +
        (only ? '<span class="b-filter-label">Connected to</span>' : '') +
        '<span class="b-gname">' + esc(i ? partLabel(d, i) : 'Connected to no Part') + '</span><span class="b-grow"></span>' +
        (only ? '<button type="button" class="b-quietbtn" data-act="show-all">Show all ' + all.length + '</button>'
          : i ? linkChip(i, list.length, false)
          : '<span class="b-count" title="' + plural(list.length, 'asset', 'assets') + '">' + list.length + '</span>') +
        '</div>' + cards + '</div>';
    }
    if (!all.length) { return h + '<div class="b-group"><div class="b-line">No assets are connected to this doc.</div></div>'; }
    if (only) { return h + agroup(only); }
    parts.forEach(function (pt, n) { h += agroup(n + 1); });
    return h + agroup(null);
  }
  function dressBack(back, d, stage) {
    var on = back.querySelector('.tab.is-on'), tab = on ? on.getAttribute('data-id') : 'assets';
    var body = back.querySelector('.menu-body'), band, row, t;
    if (!body) { return; }
    if (tab === 'assets') { body.innerHTML = assetsBody(back, d, stage); return; }
    /* PLAN and FEEDBACK: the stage's offers as a tools group, then the prototype's own rows, boxed. */
    band = body.querySelector('.stage-band');
    if (band) { band.parentNode.removeChild(band); }
    body.classList.add('b-' + tab);
    boxify(body);
    row = tab.toUpperCase();
    t = tools('back', row, items('back', row, stage, false), 3, 'b-' + tab, stage);
    body.insertAdjacentHTML('afterbegin', group(tab === 'feedback' ? 'The Consultant' : 'Plan', toolsBody(t, cell('back', row, stage)), { post: t.more, cls: tab === 'feedback' ? 'is-help' : '' }));
  }

  function dressMenus() {
    var front = el.menus.querySelector('.menu-front'), back = el.menus.querySelector('.menu-back');
    var d = docNow(), stage = stageNow(), nodes, i, k, body, hers, id;
    if (!d) { return; }
    if (front && !front.hasAttribute('data-b')) { front.setAttribute('data-b', '1'); dressFront(front, d, stage); }
    if (back && !back.hasAttribute('data-b')) {
      back.setAttribute('data-b', '1');
      if (!back.classList.contains('is-search')) { dressBack(back, d, stage); }
    }
    /* Each list goes back to where she had scrolled it. */
    nodes = el.menus.querySelectorAll('[data-keep]');
    for (i = 0; i < nodes.length; i++) {
      k = nodes[i].getAttribute('data-keep');
      if (B.scroll[k]) { nodes[i].scrollTop = B.scroll[k]; }
    }
    /* When she moves to another Part, the Assets list shows that Part's group (a cut, no motion). */
    hers = back ? back.querySelector('.b-agroup.is-here') : null;
    body = back ? back.querySelector('.menu-body') : null;
    id = d.id + '/' + d.partHere;
    if (hers && body) {
      if (B.lastPart !== id && (hers.offsetTop < body.scrollTop || hers.offsetTop + hers.offsetHeight > body.scrollTop + body.clientHeight)) {
        body.scrollTop = Math.max(0, hers.offsetTop - 8);
        B.scroll[body.getAttribute('data-keep')] = body.scrollTop;
      }
      B.lastPart = id;
    }
    /* An open "More" is brought into view inside its list, and takes the keyboard. */
    var open = el.menus.querySelector('.b-menu'), first;
    if (open && open.scrollIntoView) { open.scrollIntoView({ block: 'nearest' }); }
    if (B.focusMore) {
      B.focusMore = false;
      first = open ? open.querySelector('.b-mi:not([disabled])') : null;
      if (first) { first.focus(); }
    }
  }
  el.menus.addEventListener('scroll', function (e) {
    var k = e.target.getAttribute ? e.target.getAttribute('data-keep') : null;
    if (k) { B.scroll[k] = e.target.scrollTop; }
  }, true);

  /* ---------- pop-outs: boxed groups; Density in CONTROLS; Dark in THEME ---------- */

  function dressPop() {
    var pop = el.pop.querySelector('.pop'), body = pop ? pop.querySelector('.pop-body') : null, kind = el.pop.getAttribute('data-kind') || '';
    if (!pop || !body || pop.hasAttribute('data-b')) { return; }
    pop.setAttribute('data-b', '1');
    boxify(body);
    if (kind.indexOf('controls') === 0) {
      /* The density switch (PROPOSED). It is not saved: it lasts until a reload. */
      body.insertAdjacentHTML('beforeend', '<div class="b-group"><div class="group-head b-ghead"><span>DENSITY</span><span class="tag tag-proposed">PROPOSED</span></div>' +
        '<div class="set-row"><span>The two side menus</span><span class="b-seg" role="group" aria-label="Density">' +
        '<button type="button" data-b="density" data-id="comfortable" aria-pressed="' + (B.density === 'comfortable') + '">Comfortable</button>' +
        '<button type="button" data-b="density" data-id="compact" aria-pressed="' + (B.density === 'compact') + '">Compact</button></span></div>' +
        '<div class="quiet-line">Team B. Not saved: it lasts until a reload. F8 switches it.</div></div>');
    }
    if (kind.indexOf('theme') === 0) {
      body.insertAdjacentHTML('beforeend', '<div class="b-group"><div class="quiet-line">Team B: here Dark does change the room. The page keeps its light tone (NOT RULED). Not saved.</div></div>');
    }
  }

  /* ---------- the split: the asset's side says which Part it belongs to, in that Part's colour ---------- */

  function dressBeside() {
    var head = el.beside.querySelector('.beside-head'), d = docNow(), kt, meta, m, text;
    if (!head || head.hasAttribute('data-b') || !d) { return; }
    head.setAttribute('data-b', '1');
    kt = head.querySelector('.kind-tag');
    if (kt) { kt.outerHTML = kindHtml(kt.textContent); }
    meta = head.querySelector('.beside-meta');
    text = meta ? meta.textContent : '';
    m = /^(.*)connected to Part (\d+)$/.exec(text);
    if (m && d.partList[parseInt(m[2], 10) - 1]) {
      meta.innerHTML = '<span>' + esc(m[1]) + 'connected to</span><span class="b-conn">' + tagHtml(d.partList[parseInt(m[2], 10) - 1]) + '<span>' + esc(partLabel(d, parseInt(m[2], 10))) + '</span></span>';
    } else if (meta) {
      meta.innerHTML = '<span>' + esc(text) + '</span>';
    }
  }

  /* ---------- review notes: one strip, one quiet hand. On by default; F9 switches the whole layer. ---------- */

  function notesList() {
    var out = [], mark = el.tag.querySelector('.tag'), text = el.tag.querySelector('span:last-child'), stage = stageNow(), fresh = [];
    var front = el.menus.querySelector('.menu-front'), back = el.menus.querySelector('.menu-back:not(.is-search)'), tab, c;
    /* The prototype's own note for this state: what was its corner legend. */
    if (mark && text && text !== mark) { out.push({ mark: mark.textContent, text: text.textContent }); }
    /* The stage table's asides, which stood as captions under the bands ("Everything."), and what it sets
       in bold as new with the reorg, which wore a blue edge. Read from the table, so what is under "More" counts too. */
    function aside(menu, row, label) {
      var r = T && T.onAPage && T.onAPage[menu] ? T.onAPage[menu][row] : null, raw = r && r[stage] ? r[stage].offers || [] : [];
      raw.forEach(function (o) { if (o && o.new && o.say) { fresh.push(o.say); } });
      c = cell(menu, row, stage);
      if (c.note) { out.push({ mark: 'NOT RULED', text: label + ' in ' + stage + ', the stage table\u2019s aside: \u201c' + c.note + '\u201d' }); }
    }
    if (front) {
      tab = front.querySelector('.tab.is-on');
      if (tab) { aside('front', tab.textContent, tab.textContent); }
      if (front.querySelector('.session')) { aside('front', 'THE SESSION', 'THE SESSION'); }
    }
    if (back) {
      tab = back.querySelector('.tab.is-on');
      if (tab) { aside('back', tab.textContent, tab.textContent); }
    }
    if (fresh.length) { out.push({ mark: 'NOT RULED', text: 'New with the reorg, by the stage table (it was a blue edge): ' + fresh.join(', ') + '.' }); }
    if (front || back) {
      out.push({ mark: 'NOT RULED', text: 'Team B\u2019s dress: each side menu gives 8 px to a gutter beside the page, and the page gives none; tools a stage does not offer keep their place, faint; an asset\u2019s second act sits under More.' });
    }
    if (stage === 'SPRINT' && !onBoard()) {
      out.push({ mark: 'NOT RULED', text: 'SPRINT here: as she types the chrome goes faint in one cut, with no fade (Machina has no motion). This strip stays lit, as the corner note did.' });
    }
    if (!onBoard()) {
      out.push({ mark: 'NOT RULED', text: 'The readout\u2019s \u201c' + pageBit() + '\u201d is whole pages worked out from the word count (260 words to a page). No page-break marks are drawn.' });
    }
    if (B.dark) { out.push({ mark: 'NOT RULED', text: 'The dark room: the brief gives the light room only. These dark values are Team B\u2019s (PAIRS.md), and the page keeps its light tone.' }); }
    out.push({ mark: 'PROPOSED', text: 'Team B\u2019s words (WORDS.md): This doc, Structure, Look, More, Command line, Review notes; in CONTROLS: Density, Comfortable, Compact.' });
    out.push({ mark: 'PROPOSED', text: 'Nothing new is saved [DATA: none]. Density (F8), Dark and these notes (F9) last until a reload.' });
    return out;
  }
  function tagOf(mark) {
    return '<span class="tag ' + (mark === 'RULED' ? 'tag-ruled' : mark === 'PROPOSED' ? 'tag-proposed' : 'tag-not') + '">' + esc(mark) + '</span>';
  }
  function drawNotes() {
    var list, h;
    el.notes.className = 'b-notes' + (el.beside.querySelector('.beside') ? ' in-split' : '');
    if (!B.notes) {
      el.notes.innerHTML = '<div class="b-notes-off"><button type="button" data-b="notes-on" title="Show the review notes (F9)">Review notes are off \u00b7 F9</button></div>';
      return;
    }
    list = notesList();
    h = '';
    if (B.notesOpen) {
      h += '<div class="b-notes-list" role="region" aria-label="Review notes">';
      list.forEach(function (n) { h += '<div class="b-note">' + tagOf(n.mark) + '<span>' + esc(n.text) + '</span></div>'; });
      h += '<div class="b-notes-foot"><button type="button" data-b="notes-off">Hide every review note (F9)</button></div></div>';
    }
    h += '<button type="button" class="b-notes-bar" data-b="notes-open" aria-expanded="' + B.notesOpen + '" title="' + (B.notesOpen ? 'Close the review notes' : 'Read the review notes') + '">' +
      '<span class="b-notes-title">Review notes</span><span class="b-notes-n">' + list.length + '</span>' +
      '<span class="b-notes-first">' + (list.length ? tagOf(list[0].mark) + ' ' + esc(list[0].text) : '') + '</span>' +
      '<span class="b-notes-key">' + (B.notesOpen ? 'close' : 'read all') + ' \u00b7 F9 hides</span></button>';
    el.notes.innerHTML = h;
  }

  /* ---------- the dress, run after every redraw by app.js ---------- */

  var busy = false;
  function step(fn) { try { fn(); } catch (err) { if (window.console) { console.error('Team B dress:', err); } } }
  function dress() {
    if (busy) { return; }
    busy = true;
    root.classList.toggle('b-dark', B.dark);
    root.classList.toggle('b-compact', B.density === 'compact');
    root.classList.toggle('b-notes-off', !B.notes);
    [dressBar, dressPage, dressFoot, dressMenus, dressPop, dressBeside, dressDrop, drawNotes].forEach(step);
    busy = false;
  }
  var mo = new MutationObserver(function () { dress(); mo.takeRecords(); });
  [el.bar, el.pop, el.menus, el.page, el.foot, el.beside, el.board, el.drop, el.changed, el.tag].forEach(function (n) {
    if (n) { mo.observe(n, { childList: true }); }
  });

  /* Ask app.js to draw again, changing nothing of its own (it redraws on this event). */
  function redraw() { document.dispatchEvent(new Event('fullscreenchange')); }
  function later(fn) { setTimeout(fn, 0); }
  /* One of app.js's own acts, pressed for her: the same data-act its own buttons carry. */
  function act(name, attrs) {
    var b = document.createElement('button'), k;
    b.type = 'button';
    b.setAttribute('data-act', name);
    for (k in (attrs || {})) { b.setAttribute(k, attrs[k]); }
    b.style.display = 'none';
    shell.appendChild(b);
    b.click();
    shell.removeChild(b);
  }

  function setDensity(v) { B.density = v === 'compact' ? 'compact' : 'comfortable'; redraw(); }
  function setNotes(on) { B.notes = !!on; if (!on) { B.notesOpen = false; } dress(); }
  /* Dark goes through THEME's own switch, so the switch and the room agree. */
  function setDark(on) { if (B.dark !== !!on) { act('switch', { 'data-group': 'theme', 'data-id': 'dark' }); } }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) { return; }
    var t = e.target.closest('[data-b]'), kind = t ? t.getAttribute('data-b') : '';
    if (e.target.closest('[data-act="switch"][data-group="theme"][data-id="dark"]')) { B.dark = !B.dark; }
    if (kind === 'more') {
      B.more = B.more === t.getAttribute('data-id') ? null : t.getAttribute('data-id');
      B.focusMore = !!B.more;
      later(redraw);
      return;
    }
    /* Any other press closes an open "More". */
    if (B.more) { B.more = null; later(redraw); }
    if (kind === 'density') { B.density = t.getAttribute('data-id'); later(redraw); }
    else if (kind === 'notes-open') { B.notesOpen = !B.notesOpen; drawNotes(); }
    else if (kind === 'notes-off') { setNotes(false); }
    else if (kind === 'notes-on') { setNotes(true); }
    else if (B.notesOpen && !e.target.closest('.b-notes')) { B.notesOpen = false; drawNotes(); }
  }, true);

  window.addEventListener('keydown', function (e) {
    if (e.key === 'F9') { e.preventDefault(); setNotes(!B.notes); return; }
    if (e.key === 'F8') { e.preventDefault(); setDensity(B.density === 'compact' ? 'comfortable' : 'compact'); return; }
    if (e.key === 'Escape' && B.more) { B.more = null; e.stopImmediatePropagation(); redraw(); return; }
    if (e.key === 'Escape' && B.notesOpen) { B.notesOpen = false; e.stopImmediatePropagation(); drawNotes(); }
  }, true);

  /* ---------- doors ---------- */

  /* State 1 of the two-teams brief: BUILD, Part 3, the Front menu on PARTS and the Back menu on ASSETS. */
  function stateOne() {
    var hf, hb;
    if (stageNow() !== 'BUILD') { act('stage', { 'data-id': 'BUILD' }); }
    /* Only a handle that is there and shut is pressed: none is there in a split or on a Board. */
    hf = el.menus.querySelector('.handle-front:not(.on-board)');
    if (hf && !hf.classList.contains('is-open')) { act('front'); }
    hb = el.menus.querySelector('.handle-back:not(.on-board)');
    if (hb && !hb.classList.contains('is-open')) { act('back'); }
    act('front-tab', { 'data-id': 'parts' });
    act('back-tab', { 'data-id': 'assets' });
    act('show-all');
    el.toast.hidden = true;
  }
  var OWN = ['', 'build', 'sprint', 'split', 'dark', 'compact', 'notes-off', 'build-docs'];
  function door() {
    var h = (location.hash || '').replace('#', '');
    if (h === '' || h === 'dark' || h === 'compact' || h === 'notes-off' || h === 'build-docs') { stateOne(); }
    /* All five zones at once, as in Nick's screenshot: state 1 with the Docs drawer open. For a wide window. */
    if (h === 'build-docs' && !el.pop.querySelector('.pop')) { act('pop', { 'data-kind': 'docs' }); }
    /* The prototype's own #split opens "Method notes". The brief asks for "Open beside" on "Ledger sample sheet". */
    if (h === 'split') { act('open-beside', { 'data-id': 'a04' }); }
    if (OWN.indexOf(h) !== -1) {
      setDark(h === 'dark');
      B.density = h === 'compact' ? 'compact' : 'comfortable';
      B.notes = h !== 'notes-off';
      B.notesOpen = false;
      B.more = null;
    }
    redraw();
  }
  window.addEventListener('hashchange', door);
  door();
  dress();
})();
