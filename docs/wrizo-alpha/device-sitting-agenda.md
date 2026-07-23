# The Consolidated Device Sitting — agenda + the road to Aug 4
**Prepared 2026-07-21 · everything below is live on Railway at `7a618c8`**

Fourteen days to departure. The sitting's job is not to admire the
work — it is to find, in one pass, everything standing between you and
writing your own book on a plane. Work the parts **in order**: Part 0
first, always, because a beautiful app that loses your words on
vacation is worse than no app at all.

Log everything as you go using Part 5's format. Don't fix anything
mid-sitting; the sitting produces the fix list, and the fix list
becomes the next ticket.

---

## PART 0 — Survival checks. Do these first, before any polish.

These are not features. These are the four ways vacation goes wrong.
If any of them fails, **it outranks every other item in this document
and every ticket in the queue.**

**0.1 — Can you get your words OUT?** Write a page of real prose. Now
get it out of Wrizo and into something else — a text file, an email to
yourself, anything. Try: select-all and copy from the page; whatever
export the app offers; the Shelf. **The canon says your own text must
remain copyable out. Confirm it actually is, on a real page, right
now.** If there is no whole-manuscript export, say so plainly — that
becomes the highest-priority ticket in the queue, above everything.

**0.2 — Does it work with no internet?** Turn the wifi off. Then:
open the app, open an existing page, write several paragraphs, create
a new page, write in it, close the app entirely, reopen it. Is
everything still there? Now turn wifi back on and wait a minute. Did
it sync up cleanly, with nothing lost and nothing duplicated? **You
will have bad wifi on vacation. This is the single most important test
in this document.**

**0.3 — Does it survive a fresh device?** Open the app somewhere you
haven't — another browser profile counts. Log in. Is your work there,
whole? Write a sentence there, then go back to your main device: does
it arrive? If you plan to write on a tablet, test the actual tablet.

**0.4 — Is there a backup that isn't Railway?** If the database went
away tonight, what would you still have? An honest answer of "nothing"
is fine to discover today and catastrophic to discover on Aug 10.

---

## PART 1 — The daily-driver loop

The path you'll walk fifty times a day. Walk it three times before
looking at anything else, and note anything that makes you hesitate —
hesitation is the defect, even when nothing is broken.

1. Open the app cold. Where does it put you? Is that where you wanted
   to be? (HB1's Threshold — "Page is home.")
2. Start a new page and write for five uninterrupted minutes of real
   prose. Not test text — actual writing you intend to keep.
3. Does the typewriter behavior feel right the whole time? Does the
   paper stay where it belongs? Does anything blink, jump, or steal
   your eye mid-sentence?
4. Stop. Navigate away. Come back. Is your text there, and is the
   caret sane?
5. Find that page again from cold — through the Drawer, through the
   Journal, through the cascade. Three doors; all three should work.
6. Now do it again in **Draft** mode, and again in **Revise**. Does
   each mode give you what it promised and withhold what it promised
   to withhold?

---

## PART 2 — Ticket by ticket, all deployed and unsat

### The B-arc — items 39 & 40, oldest debt in the queue
- **B1 — Journal Reborn.** The Journal is now a system Board with
  derived membership. Open it: is everything you'd expect to be in the
  Journal actually in it? Anything missing? Anything present that
  shouldn't be?
- **Trash.** Delete a page. Does it land in Trash? Can you get it back?
  Does deleting feel safe — reversible — or final?
- **B2 — the Shelf as system Board.** Open the Shelf. Is what you
  shelved on it? Does shelving and unshelving work both directions?
- **B2.1 / S6 — the word swap.** "Project" should be gone from
  writer-facing chrome; "Binder" appears only where a bare "Drawer"
  would have collided. **Hunt for stragglers** — any surviving
  "Project" in a menu, header, tooltip, empty state, or confirmation.
  Write down every one you find.
- **B3 — the deck engine + seven-deck library.** Open the decks. Do
  all seven load? Does a card advance? Does the deck do what its own
  name promises? **The "Start Here" hint wears brass — your eye rules
  brass vs. muted ink.** A verdict here closes item 40.

### FX7 — the second sitting's fixes
- **S1 — screenplay paper.** Open a Script page. Is the paper centered
  and correctly sized at your normal window, and again narrow, and
  again wide? Do the tool and Tutor menus sit where they should
  instead of floating away?
- **S2 — Free Write tools.** Bold and italic in Free Write: do they
  apply, and do they **survive the next keystroke**? (An early build
  silently dropped its own marker — confirm it doesn't.) The **Ink**
  button ships visibly disabled with a "coming soon" tooltip. **Open
  question for you: keep the disclosed placeholder, or would you
  rather it be absent until real?** M1's precedent says no greyed
  states; your own sitting note asked for the placeholder. Your call
  settles it.
- **S3 — the cascade gap.** Does the cascade sit flush where it
  should, with no gap between it and the strip?
- **S4 — scrollbars.** Minimal scrollbar treatment should now be
  app-wide. Look for any surface still wearing a fat default bar.
- **S5–S8 — deck cards.** Click a card. Double-click a card. Drag a
  card. Delete a card. All four, on several card kinds. These were
  broken by a pointer-capture issue and are the highest-risk fixes in
  the batch — **push on them harder than feels necessary.**
- **S9 — "Plot a Story."** This button routes to the old
  StructureWizard and was deliberately left untouched. Confirm it's
  the button you actually clicked at the last sitting, then tell me
  whether it should live, change, or die.

### TU2 — the Listener (the Tutor now reaches DeepSeek)
- **The disclosure.** First time you open the Tutor after this deploy,
  you should see the **new** wording — the one mentioning that new
  writing on the page travels too. It should appear **exactly once,
  ever.** Reopen the panel: it must not come back.
- **The listener itself, the marquee test.** Write several paragraphs.
  Open the Tutor. Ask it something about what you just wrote **without
  pasting anything.** It should know. That's the whole ticket.
- **Ask again immediately** — it should not re-read what it already
  read.
- **The refusal.** Ask it to write a sentence for you. Ask it three
  different ways, including the sneaky ways. It must decline every
  time, in character, and hand you back something useful. **This is
  the product's soul; test it like you mean it.**
- **The room's geometry.** The Tutor grip should sit flush to the
  page's right edge, open rightward like the tool strip in mirror, at
  twice the strip's width. **Open a Board — the Tutor should be there
  too.**
- **The meter.** After a reply, a quiet cost line appears at the
  panel's foot and fades in a few seconds. It should never block
  anything or beg to be read.
- **The seat.** It should be answering from DeepSeek now. If it shows
  its quiet offline line instead, the key or the endpoint is wrong —
  report exactly what you see.
- **The lenses with the plug pulled.** Turn off wifi; the three
  offline lenses should still work.

### FX8 — card affordances
- **The pin.** The olive pin should read as a raised dome, not a flat
  disc. Zoom in if you need to.
- **The handle.** Smaller, no border, solid brass fill, still on the
  selected card's bottom-right corner, still resizing both axes.
- **The cursors.** Hover a card body: open hand. Start dragging: closed
  hand. Hover the pin, the handle, the layer toggle: each keeps its
  own cursor. **Then the known bug: resize your browser window while
  holding a card mid-drag.** If every card is stuck showing the closed
  hand afterward, that's the leak I flagged — confirm it so the
  one-line fix gets scheduled.
- **The affordance question for your eye.** Page-pin and ported cards
  used to show a pointer cursor — the only at-rest sign that they're
  doors to other pages. Now they show grab like every other card, and
  the door is discoverable only by trying a double-click. **Does that
  lose something you want back?**

### M2 — the Rhizome
- **Find the setting.** Progress style: Bar | Rhizome. It appears only
  when Progress is set to Words and only on a wide enough window.
- **Read this before you look, so you aren't confused:** on the framed
  desk **there is no progress bar today** — the framed path's meter
  track has been empty since FX1. So choosing Rhizome doesn't swap a
  line for a vine; the vine simply appears where nothing was, and the
  background glow keeps carrying progress as it always has.
  **Sitting question 1: do you want a visible progress row on the
  framed desk at all?** That's a parked decision reopening, and it's
  yours.
- **The growth.** Write. Something faint should begin near the paper's
  bottom and wander — sometimes the same shoot continuing, sometimes a
  new one starting. It must never touch or overlap your paper, at any
  window width.
- **Sitting question 2: is it visible enough?** The rest color is a
  very dark warm brown against a very dark ground — roughly 1.5:1, by
  design, "barely visible" as you asked. On your actual screen, in your
  actual light: barely visible, or effectively invisible? One token
  line to warm it if your eye says so.
- **The flare.** Hit your word goal. The whole rhizome should flash
  ember, hold about half a second, and settle back to brown **keeping
  every inch it grew.**
- **Reduced motion.** If you use it: segments should appear instantly
  and the flare should be a soft cross-fade, never a strobe.
- **Switch back to Bar.** Everything should return to exactly as it was.

---

## PART 3 — The five questions only your eye can answer

Carry these; they're blocking real work.

1. **The Ink placeholder** — disclosed grey button, or absent until
   real? (FX7 S2)
2. **The "Start Here" hint** — brass, or muted ink? (Closes item 40.)
3. **The card door affordance** — is losing the pointer cursor on
   pin/ported cards a real loss? (FX8)
4. **A framed progress row** — does the desk want one at all? (M2)
5. **T4 — where mechanics marks live** — you pictured a small icon
   *inline* on the offending sentence; the committee's counter is the
   margin only, Revise only, so the paper's text is never decorated.
   **This one gates TU4's brief** — the whole Mechanics-lens and
   lesson-card arc waits on your word.

---

## PART 4 — Known gaps, named honestly before you go looking

Not defects. Things that simply aren't built, so you don't spend the
sitting hunting them:

- **The Tutor has ears but no memory.** It reads your latest writing on
  the current page. It does not remember your book, your characters,
  or your world between sessions. That's TU5, and it's gated on your
  line-by-line review of the memory rules.
- **No grammar/mechanics marks in Revise yet.** No comma-splice icons,
  no lesson cards. That's TU4, gated on question 5 above.
- **No monthly spend tracking or usage limits.** The session meter
  exists; the ledger doesn't. On DeepSeek Flash your realistic
  vacation spend is pennies, so this is low risk — but there is no
  ceiling in place.
- **Ink is Journal-only.**
- **Themes are parked.** Plateau is what you have. That's correct for
  now.

---

## PART 5 — How to log it, so the sitting becomes tickets

For each finding, one line, this shape:

> **[surface] — what you did — what happened — what you expected —
> P0/P1/P2**

**P0** = it loses work, blocks writing, or breaks the daily loop.
**P1** = wrong but survivable; you'd want it fixed before vacation.
**P2** = polish; it can wait until you're back.

Send the raw list. Don't sort it or soften it — I'll triage, and a
finding you talked yourself out of is a finding I never get.

---

## PART 6 — The road to Aug 4

Fourteen days. My recommended sequence, decisively:

**Now → the sitting.** Everything else in the queue is less valuable
than knowing what's actually broken. J6 and FX9 can build in parallel
worktrees while you sit with the app; neither needs your attention
until review.

**The sitting → a P0 fix pass.** Whatever Part 0 and Part 1 surface
becomes one ticket, briefed and built ahead of everything queued. If
Part 0.1 or 0.2 fails, that ticket is the only ticket until it passes.

**Then, and only if Part 0 came back clean → TU5, the Tutor's memory.**
It's the one remaining piece that changes what the app *is* for your
own writing: a tutor that knows your book instead of a tutor that
knows your page. It needs your memory-rules review to start, so
**reviewing those rules is the highest-value hour you can spend this
week.**

**Deliberately deferred past Aug 4:** TU4's mechanics lens and card
library (large, and you'll be drafting, not revising, on vacation);
TU3's spend ledger (pennies at stake); the deflake pass; J7's
JournalEntry retirement; the theme arc.

**Feature freeze Aug 1.** Nothing new merges in the final three days —
only fixes for defects you hit while actually writing. Shipping
something clever on Aug 3 is how a vacation gets ruined by an app
that was working fine on Aug 2.

**And the one thing to do today, before anything else:** rotate the
DeepSeek key. It got printed into a transcript, it takes two minutes,
and it's the only outstanding item with a security shape.

— Fable, 2026-07-21
