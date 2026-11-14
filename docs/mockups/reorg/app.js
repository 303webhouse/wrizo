/*
  Wrizo reorg prototype · Machina · a mockup, not app code.
  Milestone 1: the shell, the left rail and a Project's own list (brief, section 6 A).

  Plain JavaScript, no build. State lives in memory; a reload starts over.
  Every screen state carries a tag (RULED, PROPOSED, NOT RULED) in the corner.
  Things the brief does not state are tagged NOT RULED on screen and listed in
  NOT-RULED.md.
*/
(function () {
  'use strict';

  var D = window.REORG_DATA;
  var shell = document.getElementById('shell');
  var el = {
    bar: document.getElementById('bar'),
    rail: document.getElementById('rail'),
    pop: document.getElementById('pop'),
    page: document.getElementById('page'),
    foot: document.getElementById('foot'),
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
    here: { project: 'thesis', doc: 'harbor-tolls' },
    stage: 'BUILD',
    pinView: 'boxes',          // 'boxes' | 'list'
    pop: null,                 // null | { kind: 'docs' | 'projects' | 'unfiled' | 'theme' | 'settings' | 'list', id }
    boxOpen: false,            // PROJECTS: the box settings drop-down
    boxFor: 'thesis',          // PROJECTS: whose box the settings edit
    trashOpen: false,          // UNFILED: inside the Trash
    fileFor: null,             // UNFILED: the row whose "File" list is open
    moreKinds: false,          // DOCS: "More kinds" opened
    defaults: { typewriter: false, progress: true },
    theme: { dark: false, quiet: false },
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
  function docHere() { return docIn(proj(S.here.project), S.here.doc); }
  function railPins() {
    var pins = D.projects.filter(function (p) { return p.pinned && p.id !== S.here.project; });
    if (D.notebook.pinned) { pins.push(D.notebook); }
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
    settings: '<path d="M3 6h14M3 14h14"/><circle cx="7" cy="6" r="2"/><circle cx="13" cy="14" r="2"/>',
    list: '<path d="M3 5.5h14M3 10h14M3 14.5h14"/>',
    boxes: '<path d="M4 4h5v5h-5zM11 4h5v5h-5zM4 11h5v5h-5zM11 11h5v5h-5z"/>',
    file: '<path d="M4 4h12v12h-12z"/><path d="M10 7v6M7 10h6"/>',
    trash: '<path d="M4 6h12M8 6V4h4v2M5.5 6l1 10.5h7l1-10.5"/>'
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

  /* ---------- the top bar ---------- */

  function renderBar() {
    var p = proj(S.here.project), d = docHere();
    var place = d.partList ? 'Part ' + d.partHere + ' of ' + d.parts + ' \u00b7 ' + d.partList[d.partHere - 1].name : 'Part 1 of ' + d.parts;
    var h = '<span class="brand">WRIZO<span class="brand-mark"></span></span>' +
      '<span class="bar-div" aria-hidden="true"></span>' +
      '<button type="button" class="crumb crumb-project" data-act="later" data-note="Renaming from the top bar is not part of milestone 1.">' + esc(p.name) + '</button>' +
      '<span class="crumb-sep" aria-hidden="true">/</span>' +
      '<button type="button" class="crumb crumb-doc" data-act="later" data-note="Renaming from the top bar is not part of milestone 1.">' + esc(d.name) + '</button>' +
      '<span class="crumb-sep" aria-hidden="true">/</span>' +
      '<button type="button" class="crumb crumb-part" data-act="later" data-note="The list of Parts drops from here in milestone 2 (B).">' + esc(place) + '</button>' +
      '<span class="bar-spring"></span><div class="stages">';
    STAGES.forEach(function (s) {
      h += '<button type="button" class="stage-btn' + (s === S.stage ? ' is-here' : '') + '" data-act="stage" data-id="' + s + '"' + (s === S.stage ? ' aria-current="true"' : '') + '>' + s + '</button>';
    });
    h += '</div><span class="bar-cmd">&gt;<span>Ctrl+.</span></span>';
    el.bar.innerHTML = h;
  }

  /* ---------- the left rail (frames Ruled-1, Ruled-2, Ruled-3) ---------- */

  function isList(id) { return !!S.pop && S.pop.kind === 'list' && S.pop.id === id; }

  function railItem(kind, label, height) {
    var open = !!S.pop && S.pop.kind === kind;
    return '<button type="button" class="rail-item h' + height + (open ? ' is-open' : '') + '" data-act="pop" data-kind="' + kind + '" aria-expanded="' + open + '">' +
      svg(kind, 20, 1.2) + '<span class="rail-label">' + label + '</span></button>';
  }

  function renderRail() {
    var here = proj(S.here.project), pins = railPins(), h = '';
    h += '<button type="button" class="rail-here' + (isList(here.id) ? ' is-open' : '') + '" data-act="list" data-id="' + here.id + '" aria-expanded="' + isList(here.id) + '" aria-label="' + esc(here.name) + ', the Project you are in">' +
      '<span class="rail-here-bar"></span>' + boxHtml(here, '38', 'rail') + '<span class="rail-label lit">' + esc(here.name) + '</span></button>';
    h += '<div class="rail-rule"></div>';
    if (pins.length) {
      h += '<div class="rail-gap"></div><div class="pins">';
      if (S.pinView === 'boxes') {
        h += '<div class="pins-grid">';
        pins.forEach(function (p) {
          h += '<button type="button" class="pin-btn' + (isList(p.id) ? ' is-open' : '') + '" data-act="' + (p.isNotebook ? 'notebook' : 'list') + '" data-id="' + p.id + '" aria-expanded="' + isList(p.id) + '" aria-label="' + esc(p.name) + '" title="' + esc(p.name) + '">' + boxHtml(p, '34', 'rail') + '</button>';
        });
        h += '</div>';
      } else {
        pins.forEach(function (p) {
          h += '<button type="button" class="pin-row' + (isList(p.id) ? ' is-open' : '') + '" data-act="' + (p.isNotebook ? 'notebook' : 'list') + '" data-id="' + p.id + '" aria-expanded="' + isList(p.id) + '">' + boxHtml(p, '24', 'rail') + '<span class="rail-label">' + esc(p.name) + '</span></button>';
        });
      }
      h += '</div><div class="pin-switch">' +
        '<button type="button" data-act="pin-view" data-id="list" aria-label="Show pins as a list" aria-pressed="' + (S.pinView === 'list') + '">' + svg('list', 14, '2.0') + '</button>' +
        '<button type="button" data-act="pin-view" data-id="boxes" aria-label="Show pins as boxes" aria-pressed="' + (S.pinView === 'boxes') + '">' + svg('boxes', 14, '2.0') + '</button>' +
        '</div><div class="rail-rule"></div>';
    }
    h += railItem('docs', 'Docs', 58) + railItem('projects', 'Projects', 58) + railItem('unfiled', 'Unfiled', 58);
    h += '<div class="rail-spring"></div><div class="rail-rule"></div>';
    h += railItem('theme', 'Theme', 54) + railItem('settings', 'Settings', 54);
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
    b += '<button type="button" class="new-row h40" data-act="new-board" data-id="' + S.here.project + '" data-from="docs"><span class="plus" aria-hidden="true">+</span><span class="grow">Board</span><span class="row-meta">no doc yet</span></button>';
    b += groupHead('RECENT');
    D.recent.forEach(function (r) {
      var p = proj(r.project), d = p && docIn(p, r.doc);
      if (!d) { return; }
      var here = r.project === S.here.project && r.doc === S.here.doc;
      b += '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) +
        '<button type="button" class="row-main" data-act="open-doc" data-pid="' + p.id + '" data-id="' + d.id + '"><span class="row-name">' + esc(d.name) + '</span>' +
        '<span class="row-meta">' + esc(p.name) + ' \u00b7 ' + plural(d.words, 'word', 'words') + '</span></button></div>';
    });
    b += groupHead('PAGE DEFAULTS \u00b7 EVERY DOC');
    b += switchRow('Typewriter mode', 'defaults', 'typewriter') + switchRow('Progress bars', 'defaults', 'progress');
    return popShell('DOCS', '', b);
  }

  /* PROJECTS (frames Ruled-4 and Ruled-5). */
  function projectRow(p) {
    var here = p.id === S.here.project;
    var picked = S.boxOpen && S.boxFor === p.id;
    var meta = p.isNotebook ? 'the journal' : plural(p.docs.length, 'doc', 'docs');
    return '<div class="row' + (here ? ' is-here' : '') + '">' + hereBar(here) +
      '<button type="button" class="box-pick' + (picked ? ' is-picked' : '') + '" data-act="box-for" data-id="' + p.id + '" aria-label="Box settings for ' + esc(p.name) + '" title="Box settings for ' + esc(p.name) + '">' + boxHtml(p, '30', 'panel') + '</button>' +
      '<button type="button" class="row-main" data-act="' + (p.isNotebook ? 'notebook' : 'list') + '" data-id="' + p.id + '" data-from="projects"><span class="row-name">' + esc(p.name) + '</span><span class="row-meta">' + meta + '</span></button>' +
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
    /* The Notebook: listed last, pin off. */
    b += projectRow(D.notebook);

    var target = proj(S.boxFor) || proj(S.here.project);
    var foot = '<button type="button" class="box-foot" data-act="box-toggle" aria-expanded="' + S.boxOpen + '">' +
      '<span class="box-foot-caret" aria-hidden="true">' + (S.boxOpen ? 'v' : '&rsaquo;') + '</span>' +
      '<span class="box-foot-label">BOX SETTINGS</span><span class="box-foot-name">' + esc(target.name) + '</span></button>';
    if (S.boxOpen) {
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
        (target.picture ? '<button type="button" class="chip-btn" data-act="no-picture">NO PICTURE</button>' : '') + '</div></div>';
    }
    return popShell('ALL PROJECTS', String(D.projects.length), b, foot);
  }

  /* UNFILED (frame Ruled-6). */
  function popUnfiled() {
    if (S.trashOpen) { return popTrash(); }
    var b = groupHead('WRITING WITH NO PROJECT \u00b7 ' + D.unfiled.length);
    if (!D.unfiled.length) { b += '<div class="quiet-line">Nothing is unfiled.</div>'; }
    D.unfiled.forEach(function (u) {
      var open = S.fileFor === u.id;
      b += '<div class="row">' +
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

  /* A Project's own list: its Docs, then its Boards with no Doc (look from frame P3-NB-B). */
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
        '<button type="button" class="chip-btn" data-act="later" data-mark="PROPOSED" data-note="This button is drawn in frame P3-NB-B; the brief does not name it. Connect Doc is built in milestone 5 (F).">CONNECT</button></div>';
    });
    return popShell(p.name, count, b);
  }

  /* THEME and SETTINGS: the brief names them on the rail and says no more. Guesses, tagged. */
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
  function popSettings() {
    var full = !!document.fullscreenElement;
    var b = groupHead('THE APP', 'NOT RULED');
    b += '<div class="set-row"><span>Full screen</span>' +
      '<button type="button" class="switch" role="switch" aria-checked="' + full + '" aria-label="Full screen" data-act="fullscreen">' +
      '<span' + (full ? '' : ' class="is-set"') + '>OFF</span><span' + (full ? ' class="is-set"' : '') + '>ON</span></button></div>';
    b += '<div class="quiet-line">A guess from the vision note (the rails, D): what belongs to the whole app sits here. Page defaults are in DOCS, as the brief rules.</div>';
    return popShell('SETTINGS', '', b);
  }

  function renderPop() {
    var h = '';
    if (S.pop) {
      switch (S.pop.kind) {
        case 'docs': h = popDocs(); break;
        case 'projects': h = popProjects(); break;
        case 'unfiled': h = popUnfiled(); break;
        case 'theme': h = popTheme(); break;
        case 'settings': h = popSettings(); break;
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

  /* ---------- the page and the line under it ---------- */

  function renderPage() {
    var d = docHere(), h = '';
    if (d.isNew) {
      h = '<p><span class="caret" aria-hidden="true"></span></p>';
    } else {
      h = '<h1>' + esc(d.partList ? d.partHere + '. ' + d.partList[d.partHere - 1].name : d.name) + '</h1>';
      D.pageText.forEach(function (t) { h += '<p>' + esc(t) + '</p>'; });
    }
    el.page.innerHTML = h;

    var words = d.isNew ? 0 : (d.partWords || d.words);
    var bits = [
      plural(words, 'word', 'words'),
      (Math.round(words / 26) / 10) + ' pages',
      '~' + Math.ceil(words / 230) + ' min read',
      'Part ' + (d.partHere || 1) + ' of ' + d.parts,
      'no goal set'
    ];
    el.foot.innerHTML = bits.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('<span aria-hidden="true">\u00b7</span>');
  }

  /* ---------- marking ---------- */

  function renderTag() {
    var mark = 'RULED', text = '', pins = railPins().length;
    if (!S.pop) {
      text = !pins ? 'The rail with no pins (frame Ruled-3)' :
        S.pinView === 'boxes' ? 'The rail at rest, pins as boxes (frame Ruled-1)' : 'The rail at rest, pins as a list (frame Ruled-2)';
    } else {
      switch (S.pop.kind) {
        case 'docs': text = 'DOCS pop-out (frame Ruled-7, the Board door from P3-NB-A)' + (S.moreKinds ? '. The kinds under More kinds are not ruled.' : ''); break;
        case 'projects': text = S.boxOpen ? 'PROJECTS pop-out, box settings open (frame Ruled-5)' : 'PROJECTS pop-out (frame Ruled-4)'; break;
        case 'unfiled':
          if (S.trashOpen) { mark = 'NOT RULED'; text = 'Inside the Trash: no frame, a guess'; }
          else { text = 'UNFILED pop-out (frame Ruled-6)' + (S.fileFor ? '. The File list is not ruled.' : ''); }
          break;
        case 'list': text = 'A Project\u2019s own list (look from frame P3-NB-B)'; break;
        case 'theme': mark = 'NOT RULED'; text = 'THEME pop-out: the brief names it and no more'; break;
        case 'settings': mark = 'NOT RULED'; text = 'SETTINGS pop-out: the brief names it and no more'; break;
      }
    }
    if (docHere().isNew) { mark = 'NOT RULED'; text += ' \u00b7 A new Doc on the page: where it lands and its name are guesses'; }
    el.tag.innerHTML = tag(mark) + '<span>A \u00b7 ' + esc(text) + '</span>';
  }

  var toastTimer = null;
  function note(mark, text) {
    el.toast.innerHTML = (mark ? tag(mark) : '') + esc(text);
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, 5200);
  }

  function render() { renderBar(); renderRail(); renderPop(); renderPage(); renderTag(); }

  /* ---------- acts ---------- */

  function openPop(pop) {
    S.pop = pop; S.boxOpen = false; S.boxFor = S.here.project; S.trashOpen = false; S.fileFor = null; S.moreKinds = false;
  }
  function togglePop(pop) {
    var same = S.pop && S.pop.kind === pop.kind && (S.pop.id || '') === (pop.id || '');
    openPop(same ? null : pop);
  }
  /* Esc closes the innermost open thing first. */
  function stepBack() {
    if (!S.pop) { return false; }
    if (S.fileFor) { S.fileFor = null; }
    else if (S.trashOpen) { S.trashOpen = false; }
    else if (S.boxOpen) { S.boxOpen = false; }
    else if (S.moreKinds) { S.moreKinds = false; }
    else { S.pop = null; }
    return true;
  }
  function openDoc(pid, did) {
    var moved = pid !== S.here.project;
    S.here = { project: pid, doc: did };
    D.recent = [{ project: pid, doc: did }].concat(D.recent.filter(function (r) { return !(r.project === pid && r.doc === did); })).slice(0, 3);
    openPop(null);
    if (moved) { note('NOT RULED', 'Opening a Doc from another Project moves you into that Project. The brief does not say so.'); }
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
    notebook: function () { note('', 'The Notebook is listed, pin off, as ruled. It is not built in this prototype.'); },
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

    /* DOCS and a Project's own list */
    'more-kinds': function () { S.moreKinds = !S.moreKinds; },
    'open-doc': function (t) { openDoc(t.getAttribute('data-pid'), t.getAttribute('data-id')); },
    'new-doc': function (t) {
      var p = proj(t.getAttribute('data-pid') || S.here.project), kind = t.getAttribute('data-id');
      var name = uniqueName(kind === 'blank' ? 'Untitled doc' : 'Untitled ' + kind, p.docs.map(function (d) { return d.name; }));
      var d = { id: 'doc-' + (++S.counter), name: name, parts: 1, words: 0, isNew: true };
      p.docs.push(d);
      openDoc(p.id, d.id);
      note('NOT RULED', '\u201c' + name + '\u201d was made in ' + p.name + ' and opened. Where a new Doc lands and what it is called are guesses.');
    },
    'new-board': function (t) {
      var p = proj(t.getAttribute('data-id'));
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
    'box-toggle': function () { S.boxOpen = !S.boxOpen; },
    'box-for': function (t) {
      S.boxFor = t.getAttribute('data-id'); S.boxOpen = true;
      note('NOT RULED', 'Pressing a Project\u2019s box here picks it for BOX SETTINGS. The frames show only the Project you are in.');
    },
    'no-letters': function () { proj(S.boxFor).letters = ''; },
    colour: function (t) { proj(S.boxFor).colour = t.getAttribute('data-id'); },
    'own-colour': function () {
      var p = proj(S.boxFor);
      el.colour.value = COLOURS[p.colour] ? COLOURS[p.colour].panel.toLowerCase() : p.colour;
      el.colour.click();
      return false;
    },
    picture: function () { el.picture.value = ''; el.picture.click(); return false; },
    'no-picture': function () { proj(S.boxFor).picture = null; },

    /* UNFILED */
    'unfiled-open': function () { note('NOT RULED', 'Not built: the brief does not say where an Unfiled piece opens, or what the rail\u2019s top box shows then. A question for Fable.'); },
    file: function (t) { var id = t.getAttribute('data-id'); S.fileFor = S.fileFor === id ? null : id; },
    'file-into': function (t) {
      var id = t.getAttribute('data-id'), pid = t.getAttribute('data-pid');
      var u = D.unfiled.filter(function (x) { return x.id === id; })[0];
      var p = pid === '__new' ? newProject() : proj(pid);
      D.unfiled = D.unfiled.filter(function (x) { return x.id !== id; });
      p.docs.push({ id: u.id, name: u.name, parts: 1, words: u.words });
      S.fileFor = null;
      note('', '\u201c' + u.name + '\u201d is filed in ' + p.name + '.');
    },
    trash: function (t) {
      var id = t.getAttribute('data-id');
      var u = D.unfiled.filter(function (x) { return x.id === id; })[0];
      D.unfiled = D.unfiled.filter(function (x) { return x.id !== id; });
      D.trash.unshift({ id: u.id, name: u.name, words: u.words, date: u.date, from: null });
      S.fileFor = null;
      note('', '\u201c' + u.name + '\u201d is in the Trash.');
    },
    'trash-open': function () { S.trashOpen = true; S.fileFor = null; },
    'trash-close': function () { S.trashOpen = false; },
    restore: function (t) {
      var id = t.getAttribute('data-id');
      var x = D.trash.filter(function (y) { return y.id === id; })[0];
      D.trash = D.trash.filter(function (y) { return y.id !== id; });
      var p = x.from && proj(x.from);
      if (p) { p.docs.push({ id: x.id, name: x.name, parts: 1, words: x.words }); }
      else { D.unfiled.push({ id: x.id, name: x.name, words: x.words, date: x.date }); }
      note('', '\u201c' + x.name + '\u201d is back in ' + (p ? p.name : 'Unfiled') + '.');
    },
    'delete': function (t) {
      var id = t.getAttribute('data-id');
      D.trash = D.trash.filter(function (y) { return y.id !== id; });
    }
  };

  shell.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) {
      /* A click on the room or the page closes an open pop-out. */
      if (S.pop && !e.target.closest('.pop') && !e.target.closest('.rail') && !e.target.closest('.offstage')) { openPop(null); render(); }
      return;
    }
    var fn = ACT[t.getAttribute('data-act')];
    if (fn && fn(t) !== false) { render(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && stepBack()) { render(); }
  });

  /* Box settings: the letters, her own colour, her picture. Held in memory only. */
  shell.addEventListener('input', function (e) {
    var p = proj(S.boxFor);
    if (e.target.id === 'letters') {
      p.letters = e.target.value.toUpperCase().slice(0, 2);
      renderRail();
      var rows = el.pop.querySelectorAll('.box-pick[data-id="' + p.id + '"]');
      for (var i = 0; i < rows.length; i++) { rows[i].innerHTML = boxHtml(p, '30', 'panel'); }
      paintPictures(el.pop);
    } else if (e.target === el.colour && /^#[0-9a-f]{6}$/i.test(el.colour.value)) {
      p.colour = el.colour.value;
      render();
    }
  });
  el.picture.addEventListener('change', function () {
    var f = el.picture.files && el.picture.files[0];
    if (!f || !/^image\//.test(f.type)) { return; }
    var reader = new FileReader();
    reader.onload = function () {
      proj(S.boxFor).picture = String(reader.result);
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
  window.addEventListener('resize', place);

  /* Doors for the checklist: index.html#docs and the like open one state directly. */
  function applyHash() {
    var h = (location.hash || '').replace('#', '');
    if (!h) { return; }
    openPop(null);
    if (h === 'pins-list') { S.pinView = 'list'; }
    else if (h === 'pins-boxes') { S.pinView = 'boxes'; }
    else if (h === 'day-one') {
      D.projects.forEach(function (p) { p.pinned = false; });
      D.notebook.pinned = false;
      S.here = { project: 'new-project', doc: 'notes-on-the-ledgers' };
    }
    else if (h === 'docs' || h === 'projects' || h === 'unfiled' || h === 'theme' || h === 'settings') { openPop({ kind: h }); }
    else if (h === 'box') { openPop({ kind: 'projects' }); S.boxOpen = true; }
    else if (h === 'trash') { openPop({ kind: 'unfiled' }); S.trashOpen = true; }
    else if (h === 'list') { openPop({ kind: 'list', id: S.here.project }); }
    else if (h.indexOf('list-') === 0 && proj(h.slice(5)) && !proj(h.slice(5)).isNotebook) { openPop({ kind: 'list', id: h.slice(5) }); }
    render();
  }
  window.addEventListener('hashchange', applyHash);

  place();
  render();
  applyHash();
})();
