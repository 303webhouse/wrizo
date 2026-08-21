# ITEM 83 — CENSUS SUPPLEMENT: THE BOARD COUNSEL PANEL, AS BUILT
### menus lane · 2026-08-17 · the disk-check BD4 declared owed
### amends: Pass 4's BD4 · authority: Fable's ruling 4 on the disclosure-v4 ratification

**WHY THIS EXISTS.** Pass 4's BD4 named its own gap and refused to close it by
inference: *"the census records the Tutor mounting on boards but not what its
panel shows there today. A disk-check is owed before the lock — a small census
supplement naming the board panel's current contents — so BD4 lands on fact,
not inference."* This is that check, performed against `main` @ `1ef1659` by
direct source read (no browser; the machine's suite lane had priority).

**Phase law, unchanged:** inventory only. What follows is what the disk holds.

---

## §1 · WHAT THE BOARD PASSES TO THE TUTOR

`BoardEditor.tsx` mounts the Tutor with four props and no board-specific
gate:

```
<Tutor entry={initialEntry} project={project}
       pageText={initialEntry.text} pageKind="board" />
```

`pageText` on a board is the board entry's own `text` field — the board's own
words, the thing `boardTitle()` reads its first line from. The board's CARDS
are not in `text`; they live in `entry.boxes` (jsonb).

## §2 · WHAT THE PANEL RENDERS THERE

**The full Tutor.** Conversation, composer, Send, lenses. There is no
board branch that withholds any of it. Every `pageKind === 'board'` test in
`Tutor.tsx` governs something else:

- the panel's measured width (`pageKind === 'board'` skips the FX18 measure);
- the Consistency lens's SCOPE (below);
- the two anchor class names.

The Bible section's gate is `entry.projectId`, not `pageKind` — a board in a
project shows it; a loose board does not.

## §3 · WHAT TRAVELS ON A BOARD SEND — the load-bearing fact

The send is one call:

```
apiTutorChat(history, delta ?? undefined, bible ?? undefined)
```

- `history` — the conversation's own messages (the writer's typed words);
- `delta` — `assembleTutorDelta(pageText, lastRead)`, i.e. the new text of the
  BOARD'S OWN `entry.text` since the Tutor last read it;
- `bible` — assembled at send time only, absent when empty.

**Board card text NEVER travels.** `entry.boxes` is read into exactly one
place, `consistencyScope`, which is passed to `computeConsistencyObservations`
(`store/tutorConsistency.ts`) — a pure local computation with **no `fetch`, no
XHR, no network call of any kind** (verified by grep over that module). The
board's pinned-page texts read there are read live and never leave the device.

## §4 · WHAT THIS AMENDS IN BD4 — three corrections

**(a) "Pre-sentence, the panel's conversation is absent" was a DESIGN
CANDIDATE, never the built state.** Today the conversation is present and
sending on boards. BD4's frame law describes what the panel *should* do; it
does not describe what it *does*. The pass reads as though it were reporting
the disk, and it was not.

**(b) A board's own text ALREADY rides to a model, under v3.** The delta of
`entry.text` travels on every board send. BD4's premise — *"no board text
rides to a model until Nick ratifies a disclosure-v4 sentence"* — is therefore
already false for the board's own words, and was false when Pass 4 was
written. It remains TRUE for the cards, which is the reading that survives.

**(c) The v1 programmatic Map was never gated by the sentence at all.** Its
contents (cards linked to no page, unpinned pages LISTED never counted;
empty-lane notes; a connections view) are computed in-app and send nothing. No
disclosure can gate a payload that does not exist. The Map is blocked by being
UNBUILT — a different blocker, and one no ratification lifts.

## §5 · BD4'S SCOPE, RESTATED to what the gate actually governs

The gate over board counsel governs exactly one thing: **board content sent
beyond the disclosure's base clause.** Concretely, under candidate B:

| board payload | status |
|---|---|
| the board's own `entry.text` delta | BASE clause ("this page's recent changes", reading *this page* as the surface you're on) — no button obligation |
| the programmatic Map | never on the wire; needs no disclosure; needs building |
| card text (`entry.boxes`) | NOT sent today. If a counsel ever sends it, that counsel's BUTTON must name it and send only that, only then |

Nothing on a board currently travels beyond base. There is, today, no board
counsel that "reads more" — so there is nothing for a board button to name
yet, and the mechanism has nothing to bite on until one is built.

## §6 · WHAT REMAINS TRUE IN BD4, unamended

Grip presence follows content existence (a grip that opens onto nothing lawful
is the null test failed). Absence is categorical, not disabled (G3). The
item-84 lane owns whatever contents eventually mount; this lane owns the frame
and the gate's enforcement in it. The Map's own shape as ratified-suggested.

---

*— the menus lane, 2026-08-17. Landed on Fable's ruling 4 ("the word is
GIVEN"). BD4 unblocks on this amendment with its scope as restated in §5.*
