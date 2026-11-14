/*
  Wrizo reorg prototype · made-up content only. A mockup, not app code.

  From the brief (section 6) and Fable's frames: the Project "Thesis", its Doc
  "Harbor Tolls, 1890 to 1912" with five Parts, two more Docs, one Board with no
  Doc ("Harbor map"), five more Projects, the Unfiled pieces and the page's words.
  The frames name only one Doc outside Thesis in each of Grants and New Project;
  every other Doc name below is invented to fill the lists (see NOT-RULED.md).
*/
(function () {
  'use strict';

  function slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function doc(name, words, more) {
    var d = { id: slug(name), name: name, parts: 1, words: words };
    if (more) { for (var k in more) { d[k] = more[k]; } }
    return d;
  }

  window.REORG_DATA = {

    /* The page's words, from the frames (3. Methods). */
    pageText: [
      'The toll ledgers survive for nineteen of the twenty-two years in question. Each entry gives the date, the vessel, its master, the cargo by weight and the sum collected at the gate.',
      'I transcribed every tenth page of each ledger and checked the totals against the harbour board\u2019s printed annual returns. Where the two disagreed by more than a shilling, I read the whole month.',
      'Three kinds of entry were left out: tolls waived for the lifeboat, tolls paid in kind, and the eleven pages damaged by water in the winter of 1903.',
      'The sample is therefore smaller in the wet years, and the reader should weigh the figures for 1903 and 1904 with that in mind.'
    ],

    /* Colours are the brief's four tags plus brass (frame Ruled-5). */
    projects: [
      {
        id: 'thesis', name: 'Thesis', letters: 'TH', colour: 'blue', pinned: true,
        docs: [
          doc('Harbor Tolls, 1890 to 1912', 4520, {
            id: 'harbor-tolls', parts: 5, boards: 3,
            partList: [
              { name: 'Introduction', count: '620 words' },
              { name: 'Sources', count: '1,140 words' },
              { name: 'Methods', count: '412 words' },
              { name: 'Findings', count: '2,310 words' },
              { name: 'Bibliography', count: '38 entries' }
            ],
            partHere: 3, partWords: 412
          }),
          doc('Committee memo, draft', 380),
          doc('Viva notes', 95)
        ],
        boards: [
          { id: 'harbor-map', name: 'Harbor map', meta: '3 blocks \u00b7 a drawing' }
        ]
      },
      {
        id: 'grants', name: 'Grants', letters: 'GR', colour: 'grey', pinned: true,
        docs: [
          doc('Fund narrative', 1210),
          doc('Letter of intent', 640),
          doc('Budget notes', 455),
          doc('Work plan, year one', 980),
          doc('Outcomes statement', 520),
          doc('Summary for the panel', 310),
          doc('Travel request', 190)
        ],
        boards: []
      },
      {
        id: 'essays', name: 'Essays', letters: 'ES', colour: 'yellow', pinned: true,
        docs: [
          doc('On keeping a ledger', 2140),
          doc('The ferry in winter', 1760),
          doc('Salt and paper', 1320),
          doc('A harbour at low tide', 2480),
          doc('Notes on a toll gate', 890),
          doc('The long count', 3050),
          doc('Small errors', 1110),
          doc('Reading other people\u2019s sums', 1640),
          doc('The lifeboat exemption', 2210),
          doc('Weights and measures', 1475),
          doc('After the flood', 1930),
          doc('What the dust keeps', 760)
        ],
        boards: []
      },
      {
        id: 'new-project', name: 'New Project', letters: 'NP', colour: 'pale', pinned: true,
        docs: [
          doc('Notes on the ledgers', 412)
        ],
        boards: []
      },
      {
        id: 'client-work', name: 'Client work', letters: 'CW', colour: 'grey', pinned: false,
        docs: [
          doc('Annual report, draft', 3380),
          doc('Museum panel text', 420),
          doc('Newsletter, spring', 870),
          doc('Catalogue entry', 260)
        ],
        boards: []
      },
      {
        id: 'old-drafts', name: 'Old drafts', letters: '', colour: 'pale', pinned: false,
        docs: [
          doc('Chapter two, first try', 2890),
          doc('Chapter two, second try', 3120),
          doc('Abstract, old', 240),
          doc('Proposal, second version', 1850),
          doc('Outline, abandoned', 330),
          doc('Seminar paper', 4410),
          doc('Reading notes, customs', 1290),
          doc('Reading notes, shipping', 1560),
          doc('Conference talk', 2230),
          doc('Talk, short version', 980),
          doc('Opening pages', 720),
          doc('Cut passages', 1940),
          doc('Tables, rough', 310),
          doc('Glossary', 450),
          doc('Timeline', 280),
          doc('Questions for the committee', 170),
          doc('Field trip notes', 1130),
          doc('Archive visit, day one', 640),
          doc('Archive visit, day two', 810),
          doc('Maps list', 120),
          doc('Thanks page', 90),
          doc('Title ideas', 60),
          doc('Loose ends', 540)
        ],
        boards: []
      }
    ],

    /* The Notebook: listed last in PROJECTS, pin off (brief, section 6 A). */
    notebook: { id: 'notebook', name: 'Notebook', letters: 'NB', colour: 'pale', pinned: false, isNotebook: true },

    /* DOCS pop-out, Recent (frame Ruled-7). */
    recent: [
      { project: 'thesis', doc: 'harbor-tolls' },
      { project: 'thesis', doc: 'committee-memo-draft' },
      { project: 'grants', doc: 'fund-narrative' }
    ],

    /* UNFILED pop-out (frame Ruled-6). */
    unfiled: [
      { id: 'ferry-timetable', name: 'Ferry timetable', words: 38, date: 'Nov 3' },
      { id: 'letter-to-the-archive', name: 'Letter to the archive', words: 211, date: 'Oct 29' }
    ],

    /* The frame says "3 items"; the three names are invented. */
    trash: [
      { id: 'abstract-first-try', name: 'Abstract, first try', words: 180, date: 'Oct 21', from: 'thesis' },
      { id: 'tide-table', name: 'Tide table', words: 54, date: 'Oct 14', from: null },
      { id: 'postcard-draft', name: 'Postcard draft', words: 27, date: 'Oct 2', from: null }
    ],

    /* What "More kinds" lists is not ruled; three invented kinds. */
    moreKinds: ['Essay', 'Report', 'Letter']
  };
})();
