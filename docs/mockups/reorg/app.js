/*
  Wrizo reorg prototype · Machina · a mockup, not app code.
  Milestone 1: the shell, the left rail and a Project's own list (brief, section 6 A).
  Milestone 2: moving between Parts (6 B) and the Front menu's Parts tab (6 C).

  Plain JavaScript, no build. State lives in memory; a reload starts over.
  Every screen state carries a tag (RULED, PROPOSED, NOT RULED) in the corner.
  Things the brief does not state are tagged NOT RULED on screen and listed in
  NOT-RULED.md.

  The page's rectangle is never set from here. Only what is inside the page
  (the Part she is in) scrolls.
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
  /* The Project she is in, or null while she is in an Unfiled piece. */
  function projHere() { return S.here.project ? proj(S.here.project) : null; }
  function docHere() {
    var p = projHere();
    return p ? docIn(p, S.here.doc) : unfiledDoc(S.here.doc);
  }
  /* Every Doc has Parts. A Doc drawn without them is one Part with no name. */
  function partsOf(d) {
    if (!d.partList) {
      d.partList = [{
        name: '', words: d.words, count: plural(d.words, 'word', 'words'),
        paras: d.paras ? d.paras : (d.isNew ? [] : D.pageText.slice())
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
    var pins = D.projects.filter(function (p) { return p.pinned && p.id !== S.here.project; });
    if (D.notebook.pinned && S.here.project !== 'notebook') { pins.push(D.notebook); }
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
  /* A Part's small tag box (frame P2-13A), or an empty place of the same size. */
  function ptagHtml(part) {
    var c = part.tag ? COLOURS[part.tag.colour] : null;
    return c ? '<span class="ptag" style="background: ' + c.panel + '; color: ' + c.ink + '">' + esc(part.tag.letter) + '</span>' : '<span class="ptag none"></span>';
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

  function renderBar() {
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
      '<span class="bar-spring"></span><div class="stages">';
    STAGES.forEach(function (s) {
      h += '<button type="button" class="stage-btn' + (s === S.stage ? ' is-here' : '') + '" data-act="stage" data-id="' + s + '"' + (s === S.stage ? ' aria-current="true"' : '') + '>' + s + '</button>';
    });
    h += '</div><span class="bar-cmd">&gt;<span>Ctrl+.</span></span>';
    el.bar.innerHTML = h;
  }

  /* The Part's place in the top bar drops a list of all Parts (frame P2-12C). */
  function renderDrop() {
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
    b += '<button type="button" class="new-row h40" data-act="new-board" data-id="' + (S.here.project || '') + '" data-from="docs"><span class="plus" aria-hidden="true">+</span><span class="grow">Board</span><span class="row-meta">no doc yet</span></button>';
    b += groupHead('RECENT');
    D.recent.forEach(function (r) {
      var p = r.project ? proj(r.project) : null;
      var d = r.project ? (p ? docIn(p, r.doc) : null) : unfiledDoc(r.doc);
      if (!d) { return; }
      var here = (r.project || null) === (S.here.project || null) && r.doc === S.here.doc;
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
    var here = p.id === S.here.project;
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

    /* Box settings act only on the Project she is in (Fable, Nov 14). */
    var target = projHere(), open = S.boxOpen && !!target;
    var foot = '<button type="button" class="box-foot" data-act="box-toggle" aria-expanded="' + open + '">' +
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
      var open = S.fileFor === u.id, here = !S.here.project && S.here.doc === u.id;
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
    var count = plural(p.docs.length, 'doc', 'docs') + (p.boards.length ? ' \u00b7 ' + plural(p.boards.length, 'board', 'boards') : '');
    var b = '<div class="new-pair">' +
      '<button type="button" class="new-row" data-act="new-doc" data-id="blank" data-pid="' + p.id + '"><span class="plus" aria-hidden="true">+</span>New doc</button>' +
      '<span class="new-pair-div"></span>' +
      '<button type="button" class="new-row" data-act="new-board" data-id="' + p.id + '"><span class="plus" aria-hidden="true">+</span>New board</button></div>';
    b += groupHead('DOCS \u00b7 ' + p.docs.length);
    if (!p.docs.length) { b += '<div class="quiet-line">No docs here yet.</div>'; }
    p.docs.forEach(function (d) {
      var here = p.id === S.here.project && d.id === S.here.doc;
      var meta = plural(d.parts, 'Part', 'Parts') + ' \u00b7 ' + plural(d.words, 'word', 'words') + (d.boards ? ' \u00b7 ' + plural(d.boards, 'board', 'boards') : '');
      b += '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) +
        '<button type="button" class="row-main" data-act="open-doc" data-pid="' + p.id + '" data-id="' + d.id + '"><span class="row-name">' + esc(d.name) + '</span><span class="row-meta">' + meta + '</span></button></div>';
    });
    b += groupHead('BOARDS WITH NO DOC \u00b7 ' + p.boards.length);
    if (!p.boards.length) { b += '<div class="quiet-line">No boards here yet.</div>'; }
    p.boards.forEach(function (bd) {
      b += '<div class="row"><span class="kind-tag">BOARD</span>' +
        '<button type="button" class="row-main" data-act="later" data-note="The Board itself opens in milestone 5 (F)."><span class="row-name">' + esc(bd.name) + '</span><span class="row-meta">' + esc(bd.meta) + '</span></button>' +
        '<button type="button" class="chip-btn" data-act="later" data-mark="PROPOSED" data-note="Connect Doc on a Board\u2019s row is proposed, and does nothing until milestone 5 (F).">Connect Doc</button></div>';
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
    var newest = S.assetOrder === 'newest';
    var rows = newest ? list.slice().reverse() : list;
    var h = '<div class="part-assets">';
    if (!rows.length) { return h + '<div class="exp-none">No assets connected to this Part.</div></div>'; }
    if (rows.length > 1) {
      h += '<div class="exp-head"><span>' + (newest ? 'NEWEST FIRST' : 'OLDEST FIRST') + '</span>' +
        '<button type="button" data-act="asset-order">' + (newest ? 'Oldest first' : 'Newest first') + '</button></div>';
    }
    h += '<div class="exp-list" data-keep="exp-' + i + '">';
    rows.forEach(function (a) {
      h += '<button type="button" class="exp-row" data-act="later" data-note="Opening an asset comes with the split screen, milestone 4 (E)." title="' + esc(a.name) + '">' +
        '<span class="exp-kind">' + a.kind + '</span><span class="exp-name">' + esc(a.name) + '</span><span class="exp-date">' + esc(a.added) + '</span></button>';
    });
    return h + '</div></div>';
  }

  /* The Front menu (frames P2-13A, P2-13B). TEXT and INK are named in the frames; what they offer is milestone 6. */
  function frontMenu() {
    var d = docHere(), parts = partsOf(d), b = '';
    if (S.front.tab === 'parts') {
      b += '<button type="button" class="new-row h38" data-act="new-part"><span class="plus" aria-hidden="true">+</span>New part</button>';
      parts.forEach(function (part, n) {
        var i = n + 1, here = i === d.partHere, list = assetsOf(d, i);
        var pressed = S.back.open && S.back.tab === 'assets' && S.back.part === i;
        var say = plural(list.length, 'connected asset', 'connected assets') + ': open them in the Back menu';
        var name = part.name || 'Part ' + i;
        b += '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) +
          '<span class="part-num">' + i + '</span>' + ptagHtml(part) +
          '<button type="button" class="row-main" data-act="go-part" data-id="' + i + '"' + (here ? ' aria-current="true"' : '') + '><span class="row-name">' + esc(name) + '</span><span class="row-meta">' + esc(part.count) + '</span></button>' +
          (list.length ? '<button type="button" class="marker" data-act="marker" data-id="' + i + '" aria-pressed="' + pressed + '" aria-label="' + say + '" title="' + say + '">' + svg('link', 13, 1.5) + list.length + '</button>' : '') +
          '<button type="button" class="part-toggle" data-act="part-toggle" data-id="' + i + '" aria-expanded="' + !!part.open + '" aria-label="Show the assets connected to ' + esc(name) + ' here" title="Show its connected assets here">' + (part.open ? 'v' : '&rsaquo;') + '</button></div>';
        if (part.open) { b += partAssets(i, list); }
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
      '<button type="button" class="chip-btn" data-act="later" data-note="Opening an asset comes with the split screen, milestone 4 (E).">Open</button></div>';
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

  function backMenu() {
    var d = docHere(), b = '';
    if (S.back.tab === 'assets') { b = backAssets(d); }
    else {
      b += groupHead(S.back.tab.toUpperCase(), 'NOT RULED');
      b += '<div class="quiet-line">This tab, and the search field in every tab, come in milestone 3 (D).</div>';
    }
    return '<section class="menu menu-back" aria-label="Back menu">' + tabsRow('back-tab', ['PLAN', 'ASSETS', 'FEEDBACK'], S.back.tab) +
      '<div class="menu-body" data-keep="back-' + S.back.tab + '-' + (S.back.part || 'all') + '">' + b + '</div></section>';
  }

  function renderMenus() {
    var h = '<button type="button" class="handle handle-front' + (S.front.open ? ' is-open' : '') + '" data-act="front" aria-expanded="' + S.front.open + '" aria-label="Front menu" title="Front menu">' + (S.front.open ? '&rsaquo;' : '&lsaquo;') + '</button>' +
      '<button type="button" class="handle handle-back' + (S.back.open ? ' is-open' : '') + '" data-act="back" aria-expanded="' + S.back.open + '" aria-label="Back menu" title="Back menu">' + (S.back.open ? '&lsaquo;' : '&rsaquo;') + '</button>';
    if (S.front.open) { h += frontMenu(); }
    if (S.back.open) { h += backMenu(); }
    swap(el.menus, h);
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
    part.paras.forEach(function (t) { h += '<p>' + esc(t) + '</p>'; });
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

  /* ---------- marking ---------- */

  function renderTag() {
    var marks = [], bits = [], d = docHere(), pins = railPins().length, p;
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
    if (S.partsDrop) { say('RULED', 'B \u00b7 The Part\u2019s place in the top bar drops the list of all Parts (P2-12C)'); }
    if (S.front.open) {
      if (S.front.tab === 'parts') {
        say('RULED', 'C \u00b7 Front menu, Parts tab: a marker with a count, and a toggle on each Part (P2-13A)' +
          (partsOf(d).some(function (x) { return x.open; }) ? '; a Part expanded in place (ruled Nov 14, no frame)' : ''));
      } else { say('NOT RULED', 'Front menu, ' + S.front.tab.toUpperCase() + ' tab: milestone 6 (G)'); }
    }
    if (S.back.open) {
      if (S.back.tab !== 'assets') { say('NOT RULED', 'Back menu, ' + S.back.tab.toUpperCase() + ' tab: milestone 3 (D)'); }
      else if (S.back.part) { say('RULED', 'C \u00b7 Back menu, ASSETS connected to one Part (P2-13A2)'); }
      else { say('NOT RULED', 'Back menu, ASSETS, all of the Doc\u2019s assets: the grouping is a guess'); }
    }
    if (!bits.length) {
      say('RULED', 'A \u00b7 ' + (!pins ? 'The rail with no pins (Ruled-3)' : S.pinView === 'boxes' ? 'The rail at rest, pins as boxes (Ruled-1)' : 'The rail at rest, pins as a list (Ruled-2)'));
      say('RULED', 'B \u00b7 One Part on the page: arrows on its scrollbar, the line at its foot, its place in the top bar (P2-12D)');
    }
    if (!S.here.project) { say('PROPOSED', 'In no Project: the rail\u2019s top box is empty and reads Unfiled'); }
    if (d.isNew) { say('NOT RULED', 'A new Doc on the page: where it lands and its name are guesses'); }

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

  function render() { renderBar(); renderRail(); renderPop(); renderMenus(); renderPage(); renderDrop(); renderTag(); }

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
    back: function () {
      S.back.open = !S.back.open;
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
      if (S.back.open && S.back.tab === 'assets' && S.back.part === i) { S.back.part = null; }
      else { S.back.open = true; S.back.tab = 'assets'; S.back.part = i; }
    },
    'show-all': function () { S.back.part = null; },
    'part-toggle': function (t) {
      var part = partsOf(docHere())[parseInt(t.getAttribute('data-id'), 10) - 1];
      part.open = !part.open;
    },
    'asset-order': function () { S.assetOrder = S.assetOrder === 'oldest' ? 'newest' : 'oldest'; },

    /* DOCS and a Project's own list */
    'more-kinds': function () { S.moreKinds = !S.moreKinds; },
    'open-doc': function (t) { openDoc(t.getAttribute('data-pid'), t.getAttribute('data-id')); },
    'new-doc': function (t) {
      var pid = t.getAttribute('data-pid') || S.here.project, p = pid ? proj(pid) : null, kind = t.getAttribute('data-id');
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
      if (t.getAttribute('data-from') === 'docs') { openPop({ kind: 'list', id: p.id }); }
      note('NOT RULED', '\u201c' + name + '\u201d was made in ' + p.name + ' with no Doc. Its name is a guess. The Board itself opens in milestone 5 (F).');
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
    if (e.key === 'Escape' && stepBack()) { render(); }
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

  /* The page sits in the middle of the room right of the rail: left 415 in a 1366 window. */
  function place() {
    var w = Math.max(shell.clientWidth, 1366);
    shell.style.setProperty('--page-left', Math.round(84 + (w - 84 - 620) / 2) + 'px');
  }
  window.addEventListener('resize', function () { place(); renderDrop(); syncThumb(); });
  window.addEventListener('load', syncThumb);
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) { document.fonts.ready.then(syncThumb); }

  /* Doors for the checklist: index.html#docs and the like open one state directly. */
  function applyHash() {
    var h = (location.hash || '').replace('#', ''), end = false, sc;
    if (!h) { return; }
    openPop(null);
    S.partsDrop = false;
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
    else if (h === 'assets') { S.back.open = true; S.back.tab = 'assets'; S.back.part = null; }
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
