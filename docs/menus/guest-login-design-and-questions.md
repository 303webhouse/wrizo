# GUEST LOGIN FOR BETA TESTERS — DESIGN, SCHEMA NEEDS, AND NICK'S QUESTIONS
### PLAN desk · 2026-09-30 · **design** · the invite-code gate itself is INK's; this is the guest account it admits

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `ff6acfd`. Line numbers are a courtesy.
> **Nothing here is a build, no schema is written, and there is no mockup.**
> **Context, as relayed:** public sign-up is closing until launch; sign-up meanwhile is by invite code
> (INK's). **This document does not design that gate** — it designs the ACCOUNT a beta-tester's invite
> link admits them to, which is a different shape (passwordless, temporary, one tap).

---

## §0 · HIS WORDS, VERBATIM

> *"2. Yes, but I would like two new login options: a guest login for beta testers, and a mock user
> account filled with every kind of writing project we're attempting to make the app usable full
> including the journal, various writing projects, a screenplay, and connected boards for each
> project (we can build this later if it would be better to wait until all the major
> features/architecture updates are in)"*

**Two asks. The guest login is this document's whole subject (§1–§7). The mock/sample account is
explicitly "build this later" — §8 is a short note, not a design.**

## §1 · WHAT EXISTS — measured against the tree, not assumed

- **`POST /auth/register` requires BOTH `email` and `password`** (`auth.ts:30-38`) and the table itself
  enforces it: `apps/server/migrations/001_init.sql:6-11` — **`email text unique not null`, `pass_hash
  text not null`.** **There is no passwordless path anywhere in the server today.**
- **Invite checking EXISTED and was deliberately dropped**, per the code's own comment: *"Wrizo is
  open — the writing-gate (HomeFlow) is the membership filter, not an invite. (Invite check dropped;
  passwordless/email-first is a later backlog lift.)"* **That backlog line is what this brief and
  INK's invite-code gate both cash in, from two different ends.**
- **No account-wide "last active" timestamp exists.** `projects.last_activity_at` is per-project; `users`
  has none. **No cron or scheduled job exists anywhere in the server** (confirmed by a source scan) —
  **any time-based rule here must be computed lazily, the same shape this desk's Shelf-aging design
  just used**, not a background timer.
- **The Tutor has a per-minute RATE limit (`rateLimit(10, 60_000)`, `tutor.ts:42`) but NO usage
  BUDGET.** Token usage is already threaded through each response (`usage: { inputTokens,
  outputTokens }`, TU2 S2/S5) but **nothing accumulates or checks it against any cap.** Tutor
  conversations live as jsonb (`journal_entries.tutor`, `projects.tutor`) — **not a table a count can
  be read from cheaply; a budget needs its OWN counter.**
- **No account-settings endpoint exists to change email or password after creation.** `authRouter` has
  exactly four routes: `/register`, `/login`, `/logout`, `/me`. **An "upgrade" path is new server work,
  not a reuse of something already there** — small, but not free.
- **Publish's own five laws (PUB-A1–A5, ratified 2026-09-30) already bound the risk a temporary account
  could pose:** *"every send lands as a draft — nothing goes live from Wrizo."* **A guest cannot
  accidentally publish anything live, by a law that exists independent of this brief.**

## §2 · THE GUEST ACCOUNT — passwordless, one tap, real account semantics underneath

**A guest is a REAL `users` row** — it syncs, it has its own session, it uses `/sync` and the Tutor
like any account — **not the existing account-less local-storage mode** (F2's "no account required"
path). *Measured reason for the distinction: Nick's own words name a beta TESTER, which implies
testing the real, synced product, and an invite LINK implies a server-side identity the link
activates — a purely local guest would leave no trace for a beta program to learn from.*

### ⚠ THE NOT-NULL FORK — a schema question, laid out rather than assumed
**`email` and `pass_hash` are NOT NULL at the column level**, so a passwordless, email-less account
needs one of two shapes:
| | what it is | cost |
|---|---|---|
| **(A) SYNTHESIZE — LEAN** | the server mints a unique placeholder email (`guest+<id>@guest.wrizo.app`) and a random, never-disclosed password hash on creation; both constraints are satisfied; **zero change to `email`/`pass_hash`** | the placeholder email must never be used to send real mail, and the login form must never accept it — both are already true (nothing emails a guest; login by email/password is a different door the guest never uses, §4) |
| **(B) RELAX THE COLUMNS** — drop `NOT NULL` on both, allow `email`/`pass_hash` to be null for a guest row | **a schema change to EXISTING columns**, a different and slightly riskier class of change than every additive-nullable-column this house has done so far (item 201, 181, 204, the Library) — it touches a constraint on a table every login already depends on | avoided unless Nick prefers it; this desk's lean is (A), which needs no touch to `001_init.sql`'s two existing columns at all |
**This desk's lean: (A).** *It is the smaller, safer change, and it costs nothing a writer or a real
sign-up will ever see.*

### The account, the fields it needs
**⛔ SCHEMA QUESTION FOR NICK, NO DEFAULT (Q1) — ONE migration, four small additive columns on
`users`** (the house's own additive-nullable recipe, the same shape as `page_defaults`/`shelved`):
- **`is_guest boolean not null default false`** — *existing rows are unaffected (the `shelved` precedent:
  a boolean default is lawful when it changes nothing for rows that already exist).*
- **`guest_expires_at timestamptz null`** — set on creation (§3); null for every non-guest account.
- **`last_active_at timestamptz null`** — stamped on each `/sync` push *(not every request — cheap,
  and `/sync` is the one endpoint virtually every real session hits regularly)* — **used to EXTEND a
  guest's expiry (§3), and useful beyond guests as a general account fact, named here because this is
  where the need first arises.**
- **`tutor_turns_used integer not null default 0`** — the budget counter (§5).
**The plain-English question:** *"To let a beta tester's account know when it's about to expire, and to
cap how much it can use the Tutor, Wrizo needs four small additions to the account table. None of them
change what exists for a real account. Is that OK?"* **No default — a schema word is his alone.**

### Creation — the one-tap act
**The invite LINK itself is INK's token; what it hands to the server is a single call:
`POST /auth/guest` with the invite token, no form fields at all** — **the server creates the row (§2's
fields), opens the session immediately, and the writer lands straight on the writing surface** — *the
same door F2's account-less Arrival already opens, so the FIRST KEYSTROKE experience is unchanged; the
only difference is that this session is already a real, syncing account.* **One invite token, one
guest account** — *reusing a link after its guest account exists re-opens THAT account's session
(so a tester who loses their browser can use the same link to get back in), never mints a second one.*
**Reconciled, named for INK, not designed here:** *the invite-code gate and the guest link are the same
mechanism seen from two angles — a normal invite code gates `/auth/register`'s FORM; a guest link
skips the form entirely. Whether they are literally the same token type or two is INK's shape to
choose; this brief only needs the ONE fact above (a token → `POST /auth/guest`).*

## §3 · HOW LONG, AND WHAT COUNTS AS ACTIVITY

*(Duration is a number, not a schema shape — it gets a default, per Fable's instruction.)*
- **DEFAULT: 30 days from creation, extended by activity.** `guest_expires_at` is set to
  `created_at + 30 days` at creation; **each `/sync` push with content since the writer's last visit
  moves it forward to `now + 30 days`** *(the same "sliding window on last edit" shape this desk's
  Shelf design just used, computed lazily — no cron)*. **"Activity" = a push that actually changes
  something** (`applyCollection`'s own `changed` flag, already computed for every push) — *opening the
  app without writing does not reset the clock, the same reading Nick gave the Shelf's 90 days.*
- **At expiry:** the session is refused on its next request (`requireAuth`'s own 401, extended with one
  check: `is_guest && guest_expires_at < now` → 401 with a reason, never a silent logout mid-keystroke)
  **and a LOGGED-OUT writer sees one plain sentence on return: *"This guest account has expired. Create
  a free account to keep writing — your work is saved until <date>."*** *(A grace window before data is
  ever touched — named, not designed to a number here; it is this desk's lean, not a schema fact, so no
  question is owed for IT specifically — see §4's own grace note.)*
- **The rival, named:** *a FIXED 14-day window, no extension* — simpler to reason about for a beta
  program's own tracking, and matches "beta tester" more than "indefinite guest." **Its cost:** *a
  tester who comes back after two weeks of silence loses their account mid-use, which reads as a bug to
  someone who was never told the clock was running.* **This desk leans to the sliding window because
  nothing in his words asks for a hard beta-program boundary, and a surprise expiry is the worse
  failure.**

## §4 · UPGRADING TO A FULL ACCOUNT, KEEPING THE WORK

**DEFAULT: yes, any time before expiry (and for a defined grace window after, §3) — and it keeps
EVERYTHING, because it is literally the SAME account.** *This is the point worth stating plainly: a
guest's upgrade is NOT a migration.* Nothing moves, nothing re-syncs, nothing can be partially lost —
the `users.id` never changes, so every `journal_entries`/`drawers`/`projects` row the guest already
wrote already belongs to the account that is about to get a real email and password.
- **The act: ONE NEW endpoint, `POST /auth/claim`** (`email`, `password`, while signed in as a guest) —
  **sets `email`/`pass_hash` on the SAME row, clears `is_guest` and `guest_expires_at`.** *Confirmed:
  no such "change my credentials" endpoint exists today for ANY account (§1) — this is new work either
  way, small (one handler, the same validation `/register` already has), not a reuse.*
- **A grace window past expiry, so a late-returning tester can still claim their work rather than
  losing it outright — DEFAULT: 14 days past `guest_expires_at`, read-only** *(the session may open
  `/auth/claim` and nothing else; every other route keeps refusing)*. **After the grace window: this
  desk does NOT propose auto-deletion** — *that is a retention/deletion policy question with its own
  honesty obligations (item 201's tombstone law exists for exactly this kind of permanence), and it is
  not this brief's to assume one way or the other. Flagged, not decided.*
- **The rival, named:** *upgrade requires leaving the guest window entirely and starting a normal
  `/register` on a FRESH account, then an explicit "import my guest work" act* — **its cost is real
  data-loss risk (a writer who skips the import step loses everything) for no benefit this desk can
  find, since the same-row approach has none of that risk.** **Not adopted.**

## §5 · THE TUTOR BUDGET

**DEFAULT (a number, not a schema shape): 75 Tutor turns, for the life of the guest account** — *a
flat lifetime cap, not a daily or weekly allowance.* **Why flat, not daily:** *the no-cron finding
(§1) means a "resets each day" rule would need the SAME lazy-latch machinery this desk's Shelf
design built for a reason that doesn't apply here — a cost cap doesn't need to forgive yesterday's
usage the way an organizational state does, and a flat cap is simply a counter that increments and is
checked, the cheapest honest shape.* **75 is a guess tuned to "enough to really try the Tutor across
a real writing session," not a measurement — Fable or Nick may want a different number; the SHAPE
(one counter, checked before each Tutor call) is this desk's design, the NUMBER is a dial.**
- **Enforcement:** `POST /api/tutor` checks `is_guest && tutor_turns_used >= cap` BEFORE calling the
  model, refuses with a plain sentence (*"This guest account's Tutor turns are used up. Create a free
  account to keep using it."*) **— never silently drops the request, never degrades to a worse model**
  *(the standing law the DeepSeek-fallback memory already names: a quiet degrade is acceptable for an
  OUTAGE, not for a deliberate cap a writer doesn't know exists yet).* **`tutor_turns_used` increments
  AFTER a successful response**, so a failed call never counts against the budget.
- **What counts as a turn:** *one writer message and the Tutor's one reply — the same unit the 20-message
  per-page ceiling (found in passing by the source pass, §11) already uses, so the budget and the
  existing ceiling speak the same language.*
- **No budget UI nags mid-write** — *the Tutor panel shows nothing about the budget until it is
  reached, per the standing law that the app does not notice a writer is stuck or interrupt
  unprompted; the refusal sentence IS the first and only mention.*

## §6 · WHAT A GUEST SEES THAT A WRITER DOESN'T

- **One quiet account-status line, in Settings only** — *"Guest account · expires <date> · Create a
  free account"* — **never chrome-wide, never a banner on the writing surface** *(page primacy; the
  minimal-interface law Nick stated for strip menus extends naturally to this: one line, one place, not
  a persistent nag).* **This is an ACCOUNT fact, not a writing-content count, so the no-ambient-count
  law (A14/A18, written against counts of cards/pages) does not forbid it** — *named so a reviewer does
  not read this as the same class of thing that law was written to stop.*
- **No invite-generation.** *A guest cannot create or share invite links of their own* — **lean, not his
  word**; the rival (lets a tester invite a friend) is a real beta-growth lever, but it is INK's gate
  to extend, not this brief's to assume into existence.
- **Publish: local exports yes, external connections no.** *A guest may use the Press and produce
  files (Word, PDF, e-book) — nothing in that path reaches another service.* **A guest may NOT connect
  WordPress or X** — *those need a durable identity for the security review the ruling already
  requires (slate: "WordPress sign-in stays on your device only, after a security review") and a
  guest's device-local credential has nowhere permanent to live once the account expires.* **Lean, not
  his word; reversible with no cost if he disagrees — it is a UI gate on an existing door, not a new
  one.**
- **Everything else is identical** — *the Library, the Shelf, Drawers, the Journal, every writing
  surface, every theme: a guest IS a writer, for as long as the account lives.* **No feature is
  degraded to prove a point about "guest-ness."**

## §7 · §Q · FOR NICK

- **Q1 — the account table (schema, no default).** *As §2 states it: four small additions to the
  account table, none of which change anything for an existing account. Is that OK?*
- **Calls, recorded, not schema, each with a default and a named rival — vetoable:**
  - **Duration:** 30 days, sliding on real activity (§3). *Rival: a fixed 14 days.*
  - **Upgrade:** any time before expiry, plus a 14-day read-only grace window to claim (§4).
  - **Tutor budget:** 75 turns, lifetime, flat (§5).
  - **What a guest sees:** one quiet status line; no invite-generation; local exports yes, external
    publishing connections no (§6).

## §8 · A SHORT NOTE — THE SAMPLE ACCOUNT, BUILT LATER

**Not designed here, per his own words ("we can build this later").** **The content list he named is
recorded so it is not lost between now and then:** *a Journal with real entries, several writing
projects of different kinds, a screenplay, and connected boards for each project — "to make the app
usable full."* **The one connection worth naming now, so the two features are not built twice:**
whatever authoring system eventually produces Nick's own mock/demo account (a fixture, hand-built or
scripted, that creates a realistic Journal + projects + a screenplay + connected boards for one
internal account) is **the same machinery a future "Start with samples" offer on the guest's first
screen would call** — *a new guest, instead of a blank page, could be offered a copy of that same
seeded content, so a beta tester sees a populated app instead of an empty one on their very first tap.*
**That offer is not designed here** — it is named as the reason the sample account is worth building
with reuse in mind, not as a second ticket this brief is quietly opening.

## §9 · WHAT THIS DESIGN DOES NOT DO
**No mockup, no code, no harness, no schema written.** **The invite-code gate itself** — INK's. **The
sample/mock account** — explicitly deferred by his own words (§8). **A deletion policy for an expired,
never-claimed guest account past its grace window** — flagged in §4, not decided.
