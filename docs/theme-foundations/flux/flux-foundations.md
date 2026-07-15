# Flux — theme foundations

**Place at:** `docs/theme-foundations/flux/flux-foundations.md`, joining the
Machina/Nomad/Volant folders. **Answers to:** `docs/theme-foundations/theme-arc.md`
(the arc doctrine, ratified 2026-07-14). **Status:** design FROZEN at RC-2
(2026-07-13); TH1 seam in fold, TH2 build armed on the post-merge spot-check.
**Normative visual reference:** `flux-rc2.html` (this folder) — where this
prose and the RC disagree, the RC wins. **Build law:** `docs/flux-theme-canon.md`
+ `docs/th2-flux-brief.md` — this document carries philosophy and rationale;
the canon carries the enforceable spec; they cross-reference, never fork.
**Consolidation note:** `docs/design/flux-rc2.html` should MOVE here (one
copy, this folder, per the foundations pattern) in the next docs touch, with
the canon's and ledger's pointers updated.

---

## 1. The territory

Flux is the third room. The arc names it plainly: *industrialization taken to
its dystopian end — the final throes of automation, humanity on life support,
signal loss. Terminal capture.* Its register is **agitation**, and its
relation to the writer is the arc's most double-edged line: **the room fights
entropy alongside you.**

**The culmination of capitalist utilitarianism.** Machina, the room before
this one, is the apparatus of capture — work perfected into instrument,
affect removed, the writer optimized into a professional. Flux is what that
logic produces when it runs all the way out: the city where everything was
captured, decoded, and monetized until the infrastructure itself began to
fail. Capital is the great deterritorializer — it dissolves every flow and
re-axiomatizes it as value — and Flux renders the end-state of that axiomatic
honestly: saturated, flickering, still extracting. The signage advertises
stores that have been rubble since the audit. The mascot waves at nobody. The
machine did not stop; it just stopped meaning anything.

**A transhumanist interface — reversed at the socket.** Flux's interface
fuses writer and machine more intimately than any other territory: the room
reads your keystrokes, the caret is a block of light, progress is signal
strength, publishing is *connecting to the network*. That is transhumanism's
grammar — but pointed the wrong way for a dystopia. Where terminal capture
dissolves the person into the apparatus, every fusion mechanic in Flux is
grafted to serve the human signal instead: the storm holds its breath when
you type, the lamp steadies under your hands, the Firewall keeps machine
prose out of the page, and orange — the arc's irreducible human thread —
appears only where a human acts. The apparatus was built to capture; this
room's apparatus has been rewired, component by component, into a
life-support system for the one thing it can't produce: a voice.

**Why anyone writes here.** Flux exists for the writer whose baseline needs
raising — the ADHD sci-fi writer who blares techno, who body-doubles with a
city, for whom silence is the enemy and Plateau's stillness reads as a blank
wall. Plateau removes stimulation until writing is the loudest thing in the
room; Flux raises ambient energy until writing feels like joining something
already moving. Terminal capture is not a warning delivered from outside; it
is a territory to write *from* — the line of flight is cut from the inside,
and the page is the smooth space carved out of the striated field.

**The thread, in this room.** Orange (`#FF9800`) is the arc's constant — the
human connection no amount of Difference can sever, theme-scoped in its
expression. Flux's expression is *scarce and burning*: exactly four places —
the prose caret, the sprint bar's completion surge, Connect, and the mark. In
a saturated world the human signal is rare, and rarity is precisely what
makes it unmistakable. The room may own teal, blue, and lime; orange is only
ever you.

**And back around.** Per the arc's load-bearing clause: no rank. The writer
who broadcasts from the safehouse tonight returns to Plateau's lamplight
tomorrow morning, and neither room outranks the other. Access follows the
arc's disclosure law — territories open with depth, carry no rank once open,
and no gating mechanic may ever solicit a target (M1 anti-gamification
guardrails govern).

**Doctrine in one line:** *the city is alive, the page is the eye of the
storm, and orange is you.*

## 2. The register, mechanized

"The room fights entropy alongside you" is not copy — it is implemented,
mechanic by mechanic:

- **Writing steadies the light.** The lamp's dying-bulb sputter pauses while
  keys are flowing and resumes on idle. Constant character, never
  behavior-contingent (a lamp that fails harder because of you is an anxiety
  machine); its one honest inverse is this alliance.
- **The storm holds its breath.** All TEXTURE events damp on the first
  keystroke (~0.45s to ~13%) and re-emerge slowly (~9s) — pauses to think are
  never punished by the room waking up at the writer.
- **The room answers the work.** The RESPONSE glow grows with sprint
  progress, eases (never snuffs) on deletion, and persists while typing —
  damping the feedback layer would kill the feedback.
- **The page is the only stable signal.** Nothing animates inside the prose
  column, ever; every glitch renders behind the page. In a room defined by
  signal loss, the manuscript is the one transmission that never drops.

## 3. Locked decisions

### 3.1 Lanes
| color | hex | lane |
|---|---|---|
| Orange | `#FF9800` | the writer — four places only (caret, surge, Connect, mark) |
| Lime | `#A6FF3D` | live — sprint fill, ~35% of texture events, celebration sparks |
| Electric blue | `#00C2FF` | system — active borders/focus, the bar's pulsing caret, readouts |
| Teal family | below | the world — including the glow at every progress level |

### 3.2 Tokens (RC-2)
ground `#04141A` · chrome `rgba(9,30,36,.9)` · rail `rgba(4,17,22,.78)` ·
line `#1D4A52` · line-active `#00C2FF` · signal-live `#A6FF3D` · page
`#0B2429` (border `#2A6A76`) / light `#EDF6F3` · ink `#E3F1EC`/`#14231F` ·
meta `#57D0F5`/`#0B7C9E` · muted `#8FB4AC`. Square corners, solid borders.

### 3.3 Typography — four slots, zero Figtree
chromeLabel **Rajdhani** (500/600/700, tracked uppercase) · contentLabel
**Chakra Petch** · proseSerif **Crimson Pro** (voice continuity across
themes) · proseSans **Chakra Petch**. Figtree survives only on the wordmark
stand-in — and the production mark is the hand-drawn logo, so effectively
nowhere. Rationale ledger: Courier Prime rejected (retro-tech, not
future-tech); Exo 2 rejected (futurism by flourish — template sci-fi);
Chakra chosen over the bench's Space Grotesk — character over
endurance-safety, with the endurance flag standing for the long-session
device verdict.

### 3.4 Lexicon (display projection; nouns; {one, many} pairs)
Docs (Pages) · Cache (Shelf) · Rack (Drawer) · Cartridge (Binder) · Nodes
(Boxes) · Circuit (Board) · Deck (Notebook) · Logs (Journal) · Schematic
(Plan) · Checkpoints (Milestones) · Overclock (Free write) · Safehouse
(Home) · Firewall (Voice Wall) · **Connect** (Publish — the single
sanctioned verb) · Script (unchanged). Canonical nouns persist in data,
routes, sync, search forever. Rationale worth keeping: *Connect* beat
*Broadcast* because broadcast is one-to-many performance — audience-pressure
at the exact moment a perfectionist brain looks for a reason not to ship —
while connect is joining the network; *Node* won on rhizome coherence
(Wrizo is write + rhizome; the Circuit holds Nodes); the Cache ▸ Rack ▸
Cartridge ladder scans physically (a hideout's cache holds racks of
cartridges). The Firewall speaks only when it acts — no persistent status
chip; the name appears on the blocking event, provenance surfaces at
Connect time.

### 3.5 Ambient doctrine — two classes, opposite damping
TEXTURE (the failing monitor) is random, narratively empty, damps while
typing. RESPONSE (the glow) persists while typing. Texture rationale:
**predictability collapse** — a legible loop becomes either invisible or an
itch; the standard is *interesting at a glance, boring to stare at*.
Dialect: **Signal Loss** at RC-2 rates as dial-center — tear-line storms
(7–12s, 3–5 lines), shear bands (9–15s), noise patches (8–14s), macroblock
clusters (2.6–4.8s), sync jumps ±4px (9–15s, 40% double), backlight dips
(10–17s, 50% double). All events sub-second, stochastic, behind the page;
the Ambiance dial (0–100) scales rate and opacity; dialect is vocabulary,
dial is rate.

### 3.6 The glow
Radial teal pool behind the page: opacity `.1 + g×.52`, scale `.5 + g×.85`
on sprint progress g; **teal at every progress level** (the orange hue-drift
was killed on lane-purity grounds — the glow is the room's light, the bar is
the work's meter); 4.3s sputter cycle plus jittered deep sputters; 600ms
ease-down on deletion; completion is a teal brightness bloom.

### 3.7 Sprint bar and the surge
Lime fill, electric-blue caret pulsing at 1.8s; crossing the self-set goal
fires the ignition sweep — white-hot left-to-right, the bar hands off to
orange, fourteen sparks, calm orange rest. *You earn the orange.* Binding:
**predictable, never variable** (identical every time; variable reward
schedules are the slot-machine pattern and are banned), one-shot ≤1.6s,
peripheral, no sound v1, reduced-motion falls back to a crossfade.
Checkpoints remain read-only coverage facts and never surge; one celebration
grammar app-wide, B4 the finish authority.

**Errata (TH2 R1):** the app's bar is a repeating lap, not this doc's
single-goal demo — "calm orange rest" means for the celebrate window; each
new lap charges lime afresh.

### 3.8 Chrome, prefs, caret
All chrome and page metadata fade on active writing (~0.7s to ~5%), return
on idle or pointer intent (W1 dissolve machinery, shared constants); the
**celebrate-summon rule** overrides the bottom-bar fade ~2.5s at the surge —
dopamine is never delivered to an empty room. In flow you *feel* progress
(glow); at rest you *read* it (bar). Cross-theme prefs: Voice (serif|sans),
Page (dark|light), Fade (on|off). Wide orange block caret (blink 1.05s,
≈0.48 × line-height) riding W2's `caretOffset`.

### 3.9 Hard floors
Nothing flashes above 3Hz at any dial position · `prefers-reduced-motion`
zeroes the ambient layers · dial 0 = fully static Flux · zero-schema · no
scores, streaks, or solicited targets · one celebration grammar.

## 4. Decision log (five rounds to freeze)

1. **Concept** — full committee double-pass on Nick's brief; three mockups
   (Undercurrent / Signal / Overload); Signal chosen as center; circuits as
   first ambient idea.
2. **Revision bench** (Architects + cognition/ADHD seats) — lexicon
   revisions landed (Docs; the Cache/Rack flip; Node over Bit; **Connect
   over Broadcast** — Nick beat the committee twice this round); Chakra path
   opened; lime bar with pulsing blue caret; metadata dissolve; mandate for
   a more chaotic background.
3. **Glitch rounds** — circuitry retired for the failing-monitor language;
   three dialects (Vertical Hold / Macroblock / Signal Loss); Signal Loss
   chosen; the progress lamp added with the bulb-sputter character and the
   steadies-while-typing alliance; the type specimen settled Chakra; the
   Firewall status chip cut (guard speaks only when it acts).
4. **RC-1** — event rates calmed ~1.6× (Nick's calibration: start quieter
   than the concept demands); lime re-homed structurally after the chip's
   removal; chrome fade ratified cross-theme with the Fade pref and the
   celebrate-summon rule; block caret restored.
5. **RC-2 (freeze)** — content labels to Chakra (zero Figtree); the glow's
   orange hue-drift removed (teal always). Frozen; canon and briefs cut;
   TH1 built.

## 5. Status and horizon

TH1 (the seam) is in fold against Fable's review; TH2 (this theme, as data)
arms on the post-merge spot-check. Owed at the hardware gate: glitch feel at
real refresh rates and S25 battery draw, Chakra's long-session endurance
read, the surge's reward-vs-interruption read, fade-and-summon feel,
≥1700px stability. Dial-center tuning is a build-and-verdict matter, not a
design reopen. The anti-paste rail remains its own ticket; the Firewall
event chip binds to whatever the Voice Wall blocks today. Per the arc doc,
the app-bones overhaul precedes the wider theme rollout — this document is
an input to that overhaul, and `theme-arc.md` owns the sequencing.

— Fable · frozen at RC-2 · the room fights entropy alongside you
