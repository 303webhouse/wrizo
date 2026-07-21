# B3 — Projects as Seeded Boards · Fable's post-merge review · 2026-07-21

**Reviewed:** the eight-commit chain c08d938 → 1698acd → 34dee00 →
256ab7f → f33c809 → 5780952 → c38f9b2 → 5f64194, every message read
whole, with census verification on the two widest commits: S1
(c08d938 — seven files, all client: DeckWizard, engine, layout,
types, deckHint at localStorage, index.css, deskLexicon +321 carrying
all seven decks' strings) and S3 (34dee00 — exactly three files:
BoardEditor +81, Sliver +11, CreateProject +70, all additive call
sites into existing store functions). Zero persistence, sync,
migration, or server files anywhere — the zero-schema claim is
census-verified, not taken on faith. Depth per the standing
precedent: census + full chain, resting on three verification layers
upstream — the 59-check harness at both reference widths plus the
1099px legacy floor, the independent review's six hunted failure
classes (zero defects found; the engine proven genuinely generic
with no hidden per-deck branching), and CC's 51/52 third pass with
the one j4.mjs transient isolated and confirmed unrelated.

## Verdict

GREEN — no fold required. The ticket's own review cycle already did
the folding (c38f9b2). The deploy that preceded this review was
lawful: Nick's standing word, the manifest independently
re-enumerated before shipping. Item 40 now rests on Nick's sitting
alone.

## Rulings of record

1. The two-doors persistence asymmetry — SUSTAINED, and ratified as
   a pattern. Door 2 rides the debounced autosave because a direct
   save would race its in-flight write; door 1 saves directly
   because no mounted component exists yet to race. An asymmetry is
   lawful when it is diagnosed, reasoned, and disclosed in both
   files — and the generalized seed/flush race class note is the
   durable value here. The engine's purity (materializeDeck never
   touches persistence; callers own the one mutation via the
   ordinary boxes path) is what made the asymmetry safe to reason
   about at all.
2. The sliver-tool-count lineage's structural end — RATIFIED. The
   review fix didn't just re-derive three parked copies for the
   fifth tool; it ended the magic-number generation pattern by
   giving b3.mjs an ordered-labels roster check — the next ticket
   extends one precise list. And the generation-4 stale-pointer fix
   elevates a rule worth keeping: park live-successor pointers are
   part of what every fold verifies. A pointer to a check that never
   existed is a broken archive.
3. Character Study's never-one-character rule — RATIFIED. A wizard
   answer that would falsify the deck's own promise ("dealt
   pre-threaded") is excluded by design, not by luck. The
   hub-and-spoke count (three characters → four connections) was
   proven by the harness against the design's own math.
4. The one open item: "Start Here" wears brass. The brief said the
   hint earns no color in the orange lane; the build chose brass
   with explicit reasoning ("brass, not orange — no new color
   lane"). The house's th2 precedent grants brass to earned, evental
   moments; a hint resting between the deal and the first edit is
   the edge case, and the brief's own phrasing may have left the
   brass/orange distinction ambiguous — so this is a question, not a
   defect verdict. Nick's sitting rules it: if the hint reads as a
   quiet mark, it stands; if it reads as an at-rest glow in the
   action lane, b3.1 moves it to a muted ink tone — one token.
5. j4.mjs flake tracking opens at occurrence 1 (transient, clean
   twice in isolation, unrelated to B3's diff). The th2 rule stands:
   a third occurrence triggers a scheduled deflake pass, not
   another note.

## Close conditions for ledger item 40

1. This review on disk. 2. Nick's sitting — the brief's own DoD
walk (Blank standing first and untouched; two clickable questions
into Three-Act's nine cards; the hint dying on his first edit; a
card dragged, a card deleted, no protest; no deck offered anywhere
he didn't ask), plus two named looks: Character Study's
pre-threading (CC's own flag — the trickiest mechanic; deal three
characters and count four threads) and the Start Here color
question (Ruling 4 — his eye decides brass or ink).

— Fable, 2026-07-21
