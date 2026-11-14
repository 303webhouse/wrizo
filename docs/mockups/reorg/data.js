/*
  Wrizo reorg prototype · made-up content only. A mockup, not app code.

  From the brief (section 6) and Fable's frames: the Project "Thesis", its Doc
  "Harbor Tolls, 1890 to 1912" with five Parts, two more Docs, one Board with no
  Doc ("Harbor map"), five more Projects, the Unfiled pieces, eleven assets and
  the page's words.

  What the frames give: the first four paragraphs and the last sentence of
  "3. Methods", seven short lines found by the search in Parts 2, 3 and 4, two
  lines of "Committee memo, draft", and the names of eight of the eleven assets.
  Everything else below is invented to fill the lists and the Parts
  (see NOT-RULED.md).

  The word "toll" is placed on purpose: twice in Sources, three times in Methods,
  twice in Findings, as frame P3-26A counts it ("7 in this doc"); twice in
  "Committee memo, draft" and in three Blocks, as frame P3-26A2 has it. It is also in
  the name of the Block "Toll totals by year" (frame P2-13B), so the search finds 13
  in Thesis where frame P3-26A2 counts 12.
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

    /* The page's words for a Doc with none of its own (frames, 3. Methods). */
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
            id: 'harbor-tolls', parts: 5, boards: 3, partHere: 3,
            /* Names, counts and tag boxes from frames P2-12C and P2-13A. */
            partList: [
              {
                name: 'Introduction', count: '620 words', words: 620,
                paras: [
                  'Between 1890 and 1912 every vessel that entered the harbour paid a due at the gate before it could unload. The sums were small, but they were written down each day, and most of the books survive.',
                  'This study asks what those books can tell us about the trade of a small port over twenty-two years. It does not ask what the port was worth. It asks how the trade rose and fell, and how far the record can be trusted.',
                  'Earlier accounts of the harbour rest on the board\u2019s printed annual returns. The returns are tidy and complete. They are also summaries, drawn up by clerks who had reasons to make a poor year look like a fair one.',
                  'The gate ledgers are a different kind of source. They were kept by the collectors themselves, line by line, as the vessels came in. No one expected them to be read again.',
                  'Setting the two side by side shows where the printed figures were rounded, where a bad month was spread across a good one, and where the collectors simply stopped writing.',
                  'The years chosen are not arbitrary. The first ledger opens in the spring of 1890, when the new gate was finished. The last closes in 1912, when the board gave up the gate and took its dues at the quay instead.',
                  'Three questions run through the Parts that follow. How much of the record is left? How was it sampled? And what does the sample show about the wet years of 1903 and 1904, when the trade fell hardest?',
                  'The second Part describes the sources and where they are kept. The third sets out the method and its limits. The fourth gives the findings, with a table for every claim.',
                  'A word on spelling. The ledgers write harbour, and so do the returns; the title of this study follows the catalogue of the archive, which does not. Both forms appear below without comment.',
                  'Nothing here settles the larger argument about the decline of the small ports. It adds one careful count to it.'
                ]
              },
              {
                name: 'Sources', count: '1,140 words', words: 1140, tag: { letter: 'S', colour: 'blue' },
                paras: [
                  'Two bodies of record survive, and they were made for different readers.',
                  'The first is the run of gate books. Today the toll ledgers are held in the customs shed, on the upper floor, in the order in which the last clerk left them. There are nineteen volumes, each of about two hundred pages.',
                  'Each volume covers a single year, from the first of April to the last day of March. Three years are missing altogether: 1896, 1899 and 1907. No note explains the gaps.',
                  'A collector entered every toll taken at the north gate on the day it was paid. He wrote the date, the name of the vessel, the name of its master, the cargo by weight and the sum.',
                  'The south gate kept no book of its own. Its takings were carried to the north gate each evening and entered there in a different hand, usually as a single line.',
                  'The second body of record is the harbour board\u2019s printed annual returns. A full set is bound in four volumes in the reading room. They give a total for each month and a short report from the board\u2019s secretary.',
                  'The returns were printed for the ratepayers, and they read like it. A fall in the takings is always explained, and the explanation is always the weather.',
                  'Beside these two there are loose papers: a bundle of letters about the lifeboat, a plan of the gate drawn in 1889, and the collectors\u2019 wage sheets for eleven of the years.',
                  'The wage sheets matter more than they seem to. They show which collector was on duty in a given week, and so whose hand, and whose habits, lie behind a given page.',
                  'All of this was read in the archive over two visits. Nothing was copied by machine. The pages are too fragile, and the archive does not allow it.',
                  'A list of every volume, with its shelf mark and its state, is given in the Bibliography.'
                ]
              },
              {
                name: 'Methods', count: '412 words', words: 412, tag: { letter: 'M', colour: 'yellow' },
                paras: [
                  'The toll ledgers survive for nineteen of the twenty-two years in question. Each entry gives the date, the vessel, its master, the cargo by weight and the sum collected at the gate.',
                  'I transcribed every tenth page of each ledger and checked the totals against the harbour board\u2019s printed annual returns. Where the two disagreed by more than a shilling, I read the whole month.',
                  'Three kinds of entry were left out: tolls waived for the lifeboat, tolls paid in kind, and the eleven pages damaged by water in the winter of 1903.',
                  'The sample is therefore smaller in the wet years, and the reader should weigh the figures for 1903 and 1904 with that in mind.',
                  'Every tenth page was chosen by counting from the first written page of each volume, not from the cover. Blank pages were counted but not replaced.',
                  'For each sampled page I copied the entries into a sheet with one row for a vessel and one column for each thing the collector wrote down. Sums were kept in shillings and pence and converted only at the end.',
                  'Where a hand could not be read, the entry was marked and left out of the totals. There are forty-one such entries, fewer than one in a hundred.',
                  'The check against the printed returns was made month by month. A sampled month was scaled up by ten and set beside the board\u2019s figure for the same month.',
                  'In most months the two agree to within a few shillings. In sixteen months they do not, and each of those months was read in full.',
                  'Reading a whole month takes most of a day. It was done for the sixteen months and for no others, so the full readings are not a sample of anything and are reported apart.',
                  'The wage sheets were used to name the collector behind each page. Where two hands share a page, the page is given to the hand that wrote the first line.',
                  'Every figure in the next Part is drawn from this sample, and each table says how many pages stand behind it.'
                ]
              },
              {
                name: 'Findings', count: '2,310 words', words: 2310, tag: { letter: 'F', colour: 'blue' },
                paras: [
                  'The sample holds 3,640 pages and a little over forty thousand entries. What follows is drawn from those and from nothing else.',
                  'From 1890 to 1902 the takings at the gate rise slowly, by about two parts in a hundred each year. The rise is steadier in the ledgers than in the printed returns, which round each month to the nearest pound.',
                  'Then the line breaks. Measured against the year before, the toll total falls by a third in 1903, and it does not recover its old level until 1909.',
                  'The printed returns show the same fall but spread it over two years. The ledgers put almost all of it in five months, from November 1903 to March 1904.',
                  'Those are the wet months. The secretary\u2019s reports blame the weather, and for once the ledgers bear him out: on the worst days no vessel came in at all.',
                  'The silence in the book is not always the weather. In January 1904 no toll was entered for eleven days, though the wage sheets show a collector on duty and the letters mention two coal boats unloading.',
                  'It is likely that the collector took the money and wrote nothing down. The sums involved are small, and the board never raised the matter.',
                  'Cargo tells a second story. Coal and timber hold steady through the wet years. Grain falls by half, and salt fish almost disappears from the book.',
                  'The vessels change as well. Before 1903 two in three are local, with masters whose names recur week after week. After 1905 fewer than half are.',
                  'The south gate\u2019s single evening line grows longer as the north gate\u2019s entries thin. By 1910 a third of the takings pass through it, which no printed return records.',
                  'None of this proves a decline in the trade of the port. It shows a change in who came, what they carried, and which gate they used.',
                  'The tables that follow give each of these counts by year, with the number of sampled pages beside it.'
                ]
              },
              {
                name: 'Bibliography', count: '38 entries', words: 38, tag: { letter: 'B', colour: 'grey' },
                paras: [
                  'Gate ledgers, north gate, 1890 to 1912. Nineteen volumes. Customs shed, upper floor, shelves 4 to 6.',
                  'Collectors\u2019 wage sheets, 1891 to 1908, with gaps. One box. Customs shed, upper floor, shelf 7.',
                  'Letters concerning the lifeboat station, 1898 to 1904. One bundle of twenty-three letters. Reading room, case C.',
                  'Plan of the north gate and its lodge, 1889. One sheet, ink on linen. Reading room, map drawer 2.',
                  'Harbour board. Printed annual returns, 1890 to 1912. Bound in four volumes. Reading room, open shelves.',
                  'Harbour board. Minutes of the monthly meetings, 1888 to 1913. Six volumes. Reading room, case A.',
                  'Harbour board. Rules for the collectors at the gates. Printed sheet, 1890.',
                  'A guide to the port and its trade, by a ratepayer. Pamphlet, 1901.',
                  'The weather diary of the lifeboat station, 1900 to 1906. Two notebooks. Reading room, case C.',
                  'Tide tables for the harbour, 1903 and 1904. Printed for the pilots.',
                  'Catalogue of the harbour archive. Typescript, kept at the reading room desk.',
                  'Notes on small ports and their records. Seminar paper, unpublished, in the author\u2019s keeping.'
                ]
              }
            ]
          }),
          /* Two of these lines are found by the search in frame P3-26A2. */
          doc('Committee memo, draft', 380, {
            paras: [
              'To the committee, ahead of the December meeting.',
              'The reading is done. For the north gate the toll series is complete for 19 years of the 22, and the three missing years are lost, not mislaid.',
              'One question is still open: whether tolls in kind can be valued at all. The ledgers record a sack of grain or a basket of fish and give no price.',
              'I propose to leave them out of the totals and to say so plainly in the third Part. A draft of that Part is attached.',
              'I would be glad of a ruling on the eleven damaged pages before the full draft is due.'
            ]
          }),
          doc('Viva notes', 95, {
            paras: [
              'Likely questions. Why every tenth page and not every fifth? Why trust the gate books over the printed returns?',
              'Have the table of the sixteen full months to hand. Know the wet-year figures without looking.',
              'Do not argue about the decline of the small ports. Say what the count shows and stop.'
            ]
          })
        ],
        boards: [
          { id: 'harbor-map', name: 'Harbor map', meta: '3 blocks \u00b7 a drawing' }
        ]
      },
      {
        id: 'grants', name: 'Grants', letters: 'GR', colour: 'grey', pinned: true,
        docs: [
          doc('Fund narrative', 1210, {
            paras: [
              'The project will finish the reading of nineteen gate ledgers and publish the counts in full.',
              'The money asked for covers two further visits to the archive and the cost of having the toll figures checked by a second reader.'
            ]
          }),
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
          doc('Notes on a toll gate', 890, {
            paras: [
              'The gate at the north end is two posts and a hut. The hut has one window, and the window faces the water, not the road.',
              'A toll is a small thing to pay and a large thing to record. The man in the hut wrote each one down for twenty-two years.',
              'Nobody thanked him for it. I am not sure anybody read it until now.'
            ]
          }),
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

    /* The Notebook: listed last in PROJECTS, pin off, not counted among the Projects.
       Pressing it opens its own list like any Project: its pages, each a one-Part Doc
       (Fable, Nov 14). The four pages are invented. */
    notebook: {
      id: 'notebook', name: 'Notebook', letters: 'NB', colour: 'pale', pinned: false, isNotebook: true,
      docs: [
        doc('Nov 12 \u00b7 Fog at the north gate', 164, {
          paras: [
            'Fog all morning. Could not see the far post from the hut.',
            'Thought about the collector on a day like this, with nothing coming in and the book open anyway.'
          ]
        }),
        doc('Nov 9 \u00b7 The clerk\u2019s hand', 221),
        doc('Nov 4 \u00b7 A day in the customs shed', 318),
        doc('Oct 30 \u00b7 What the returns leave out', 142, {
          paras: [
            'The returns leave out the days when nothing came. The ledgers do not: a blank line is still a line.',
            'Remember to count the blank days as days, not as missing toll entries.'
          ]
        })
      ],
      boards: []
    },

    /* DOCS pop-out, Recent (frame Ruled-7). */
    recent: [
      { project: 'thesis', doc: 'harbor-tolls' },
      { project: 'thesis', doc: 'committee-memo-draft' },
      { project: 'grants', doc: 'fund-narrative' }
    ],

    /* UNFILED pop-out (frame Ruled-6). Each opens on the page like any Doc. */
    unfiled: [
      { id: 'ferry-timetable', name: 'Ferry timetable', words: 38, date: 'Nov 3', parts: 1,
        paras: [
          'First boat out at six, last boat back at half past eight. No Sunday boat after October.'
        ] },
      { id: 'letter-to-the-archive', name: 'Letter to the archive', words: 211, date: 'Oct 29', parts: 1,
        paras: [
          'To the keeper of the harbour archive.',
          'I am writing to ask leave to read the gate ledgers for a second week in January, and to see the wage sheets again.'
        ] }
    ],

    /* The frame says "3 items"; the three names are invented. */
    trash: [
      { id: 'abstract-first-try', name: 'Abstract, first try', words: 180, date: 'Oct 21', from: 'thesis' },
      { id: 'tide-table', name: 'Tide table', words: 54, date: 'Oct 14', from: null },
      { id: 'postcard-draft', name: 'Postcard draft', words: 27, date: 'Oct 2', from: null }
    ],

    /* What "More kinds" lists is not ruled; three invented kinds. */
    moreKinds: ['Essay', 'Report', 'Letter'],

    /* The eleven assets of "Harbor Tolls, 1890 to 1912". part: the Part an asset is
       connected to (1 to 5), or null for one connected to the Doc and to no Part.
       Counts by Part from frame P2-13A (2, 3, 5); names from P2-13A2 and P2-13B.
       "Tide tables", "Eleven silent days" and "Plan of the north gate" are invented,
       and so is every date. order: 1 is the oldest. */
    assets: [
      { id: 'a01', doc: 'harbor-tolls', part: null, kind: 'PDF', name: 'Plan of the north gate, 1889', meta: 'imported \u00b7 1 page', added: 'Aug 28', order: 1 },
      { id: 'a02', doc: 'harbor-tolls', part: 2, kind: 'PDF', name: 'Harbour board returns, 1890 to 1912', meta: 'imported \u00b7 212 pages', added: 'Sep 2', order: 2 },
      { id: 'a03', doc: 'harbor-tolls', part: 2, kind: 'BOARD', name: 'Ledger survey', meta: '8 blocks', added: 'Sep 9', order: 3 },
      { id: 'a04', doc: 'harbor-tolls', part: 3, kind: 'BLOCK', name: 'Ledger sample sheet', board: 'Ledger survey', meta: 'on the board Ledger survey', added: 'Sep 12', order: 4 },
      { id: 'a05', doc: 'harbor-tolls', part: 3, kind: 'PDF', name: 'Harbour board returns, 1903', meta: 'imported \u00b7 14 pages', added: 'Sep 16', order: 5 },
      { id: 'a06', doc: 'harbor-tolls', part: 3, kind: 'BOARD', name: 'Method notes', meta: '6 blocks', added: 'Sep 21', order: 6 },
      { id: 'a07', doc: 'harbor-tolls', part: 4, kind: 'BLOCK', name: 'Toll totals by year', board: 'Chart drafts', meta: 'on the board Chart drafts', added: 'Sep 28', order: 7 },
      { id: 'a08', doc: 'harbor-tolls', part: 4, kind: 'BLOCK', name: 'Wet years', board: 'Chart drafts', meta: 'on the board Chart drafts', added: 'Oct 3', order: 8 },
      { id: 'a09', doc: 'harbor-tolls', part: 4, kind: 'BOARD', name: 'Chart drafts', meta: '9 blocks', added: 'Oct 5', order: 9 },
      { id: 'a10', doc: 'harbor-tolls', part: 4, kind: 'PDF', name: 'Tide tables, 1903 and 1904', meta: 'imported \u00b7 6 pages', added: 'Oct 11', order: 10 },
      { id: 'a11', doc: 'harbor-tolls', part: 4, kind: 'BLOCK', name: 'Eleven silent days', board: 'Chart drafts', meta: 'on the board Chart drafts', added: 'Oct 18', order: 11 }
    ],

    /* The Blocks, by Board: what the search reads, what a split shows beside the page,
       and what a Board on its own shows. Method notes and Harbor map are whole, from
       frames P3-23A and P3-NB-C. Ledger survey and Chart drafts carry the names of the
       BLOCK assets above; their other Blocks and every line on them are invented, and
       only three of each are here (they say eight and nine). "toll" is in four Blocks.
       colour: the Block's colour tag (blue or yellow), or none. */
    blocks: {
      'Ledger survey': [
        { title: 'Volumes', text: 'Nineteen, each of about two hundred pages.', colour: 'blue' },
        { title: 'Missing years', text: '1896, 1899 and 1907. No note explains the gaps.' },
        { title: 'Ledger sample sheet', text: 'One row for a vessel, one column for each thing the collector wrote.', colour: 'yellow' }
      ],
      /* All six as frame P3-23A draws them: names, words and colour tags. */
      'Method notes': [
        { title: 'Sampling rule', text: 'Every tenth page of each ledger.', colour: 'yellow' },
        { title: 'Check against returns', text: 'Totals set beside the board\u2019s printed annual returns.', colour: 'yellow' },
        { title: 'Left out', text: 'Lifeboat waivers, tolls in kind, pages damaged by water.', colour: 'yellow' },
        { title: 'Wet years', text: '1903 and 1904: a smaller sample.', colour: 'blue' },
        { title: 'Shilling rule', text: 'A gap over a shilling: read the whole month.' },
        { title: 'Open question', text: 'Were waivers logged at every gate?' }
      ],
      'Chart drafts': [
        { title: 'Toll totals by year', text: 'One bar for each year, 1890 to 1912.', colour: 'blue' },
        { title: 'Wet years', text: 'November 1903 to March 1904, shaded.', colour: 'blue' },
        { title: 'Eleven silent days', text: 'January 1904. A collector on duty and nothing written.' }
      ],
      /* All three as frame P3-NB-C draws them, with the places it gives them on the Board. */
      'Harbor map': [
        { title: 'North gate', text: 'Tolls taken here from 1890.', colour: 'blue', x: 80, y: 236 },
        { title: 'Customs shed', text: 'The ledgers were kept in its loft.', colour: 'yellow', x: 484, y: 126 },
        { title: 'Lifeboat station', text: 'Its tolls were waived.', x: 814, y: 266 }
      ]
    },

    /* What is drawn on a Board, under its Blocks, by Board: the inside of an SVG 1100 by 560.
       The harbour's shore, three dashed leads and the mole, as frame P3-NB-C draws them. */
    drawings: {
      'Harbor map':
        '<path d="M40 470 C 150 430, 190 330, 300 320 S 470 380, 560 300 S 640 140, 780 150 S 960 230, 1060 120" stroke="#3A4047" stroke-width="2.2"/>' +
        '<path d="M300 320 l-34 62 M560 300 l10 70 M780 150 l-44 -58" stroke="#525A62" stroke-width="1.4" stroke-dasharray="5 5"/>' +
        '<path d="M470 470 h150 v36 h-150z M505 470 v-30 h80 v30" stroke="#525A62" stroke-width="1.4"/>' +
        '<text x="478" y="528" font-family="IBM Plex Mono, monospace" font-size="11" fill="#525A62">the mole</text>'
    },

    /* The Back menu's PLAN tab: the ordered plan of the piece, by Doc. Invented: seven
       Blocks from the Boards above, in an order. */
    plan: {
      'harbor-tolls': [
        { board: 'Ledger survey', block: 'Volumes' },
        { board: 'Ledger survey', block: 'Missing years' },
        { board: 'Method notes', block: 'Sampling rule' },
        { board: 'Method notes', block: 'Left out' },
        { board: 'Chart drafts', block: 'Toll totals by year' },
        { board: 'Chart drafts', block: 'Wet years' },
        { board: 'Chart drafts', block: 'Eleven silent days' }
      ]
    },

    /* The Back menu's FEEDBACK tab, by Doc. Invented: two lines from the Consultant. */
    feedback: {
      'harbor-tolls': [
        { from: 'Consultant', part: 3, date: 'Nov 10', text: 'Say earlier why tolls paid in kind are left out. The reader meets the gap before the reason.' },
        { from: 'Consultant', part: 4, date: 'Nov 11', text: 'The eleven silent days carry a large claim. Name the letters that mention the two coal boats.' }
      ]
    }
  };
})();
