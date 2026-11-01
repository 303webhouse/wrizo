# Mode-Aware Editor — Build Brief ("the main writing interface")

## Principle (read first)
**Compose, don't rebuild.** This adapts the *existing* single writing surface — `WritingSession` → `ForwardOnlyEditor` + `useChromeFade` — into a **mode-parameterized shell**. Do NOT fork a second editor. Journal mode = today's forward-only behavior as-is; the other modes are the same surface re-skinned and re-behaved by a `mode` prop.

**Canonical feel reference:** the prototype `apps/desktop/scratch/wrizo-modes-hybrid.html` (Nick will drop it in, like v6). It demonstrates the dissolve, glow, progress bar, sealed-AI, drawer-open animation, and the formatting/pen drawer. **Where this brief and the prototype agree, the prototype is the source of truth for *feel*;** this brief adds the engineering, state, and the parts the prototype stubs. Build to match the prototype's behavior.

---

## The modes (this milestone)
| Mode | Stage | This milestone |
|---|---|---|
| **Journal** | generate | **LIVE.** Forward-only runway (the char→char→word→word→sentence strike, already shipped) + stylus overlay. AI **sealed**. Minimal capture rail. Pen-color bar. |
| **Drafting** | revise | **LIVE.** Free editing (normal text editing — the runway is OFF). Full tool rail (frames). AI frame **open**. Format bar. |
| **Formatting** | convention | **GREYED.** Tab visible but disabled; click → brief "coming soon." No rail/AI/tools. |
| **Workshop** | share | **GREYED.** Same. |

## Mode switcher
- Tabs in the top bar: **Journal · Drafting · Formatting · Workshop**, sub-labels (generate / revise / convention / share). Active tab filled **brass `#FF9800`**.
- Switching is a **lens change on the same document** — prose and caret stay put; only behavior + rails + bar change. **No navigation, no reload.**
- **Mode is per-document; persist the last-used mode per doc** (reopening restores it). Default: new journal scraps → Journal; project pages → Drafting. *(Sensible default — adjustable.)*

## Content model across modes (key invariant)
- The document's **canonical saved content is the CLEAN derived text** — struck content excluded (the existing `derivedText` / `run.struck` behavior). Don't break this; it's load-bearing.
- **Journal** renders the forward-only strike overlay during writing (struck runs visible, excluded from save).
- **Drafting** edits the clean text directly (free editing).
- **Journal → Drafting** presents the clean text for free editing. **Drafting → Journal** resumes forward-only on the current clean text. The strike overlay is a *Journal-session layer*, not part of the saved doc.

---

## Left rail — tools / organization / structure (per mode)
Look = the **solid bordered panel** style (square corners, solid borders). Fades on write (see engine).
- **Journal:** capture only — **Spark deck** (the 25-prompt pool), **Fragments** (session scraps), **Send → Drawer**. No structure or edit tools, by design.
- **Drafting:** **Structure** (outline / beats / scene cards) · **Pages** · **Notes & Worldbuilding** · **Find**.
  - **This milestone = the rail FRAME + labels + panels that open as stubs.** The deep internals (outline editing, notes, working Find) are *later briefs*. Build the rail and the openable shells; not the contents.

## Right rail — AI (the FRAME only, this milestone)
- Build the **shell**: collapsible right panel, same dock across modes.
- **Journal: SEALED** — the shuttered/barred closed edge with the "journal is yours alone" note. Not openable. (This is the spatial form of the one hard rule: no AI in Journal, ever.)
- **Drafting / Formatting / Workshop: OPEN** state — the panel with an **empty "assist" surface** (placeholder).
- **Drawer-open animation:** switching **FROM Journal TO any other mode** slides the AI panel open ("a tool brought onto the desk"). Going **TO Journal**, it seals.
- **Contents are deferred — build the frame, the sealed/open states, the drawer-open, the collapse/expand. No AI features yet.**

## Formatting / pen drawer (top of the page)
Fades on write (chrome).
- **Drafting / Formatting / Workshop — format bar:** **Bold, Italic, Underline, indent/outdent, list** must actually work on the free-edit surface. Plus **heading, quote, and a "⋯ more"** affordance as **stubs** for sub-menus (sub-menu contents later). Goal is ~90% of basic formatting eventually; this milestone = the working core + the bar/sub-menu frame. *(Not Word — deliberately minimal.)*
- **Journal — pen bar:** **three ink colors (black, red, blue)** that set the stylus ink color, plus a **nib/tip selector as a stub** (ink styles later). Build the area + the three colors + the selector stub.

---

## Push-back-to-writing engine (extends `useChromeFade`)
Three coordinated behaviors. The prototype shows all three.

1. **Dissolve on write.** Any keystroke recedes the chrome:
   - left rail, right rail, format/pen bar → a **faint floor (default ~8% opacity)**, non-interactive while dissolved.
   - **top bar → 0% (fully gone) by default.**
2. **Return timing (FIXED product behavior).** After writing **stops**, wait **3 minutes**, then fade the chrome back in **slowly over ~2 minutes**. Passive idle = slow return; don't nag a thinking writer.
   - ⚠️ The prototype's **Preview/Real toggle was a demo affordance — do NOT ship it.** The real durations are 3 min / 2 min, fixed.
3. **Explicit summon (escape hatch) — confirmed.** Rolling the cursor to the **edges of the page** (where the rails / top bar live), or pressing **`Esc`**, fades the chrome back in **quickly** (~0.4s) and cancels the slow timer. Crucially, **casual pointer movement over the page does NOT summon the menus** — only a deliberate reach to an edge does — so the menus can never pop up and nag a writer mid-thought. That's the point: the menus are never a procrastination surface during flow; they return fast *only* when the writer reaches for them. Re-dissolves on the next keystroke.

**Glow (ambient ember behind the page).** Tied to the progress bar; grows as the session accumulates, **eased** so early words give visible warmth. The solid panels occlude it at rest, so it **blooms as the chrome fades** during writing. Brighter with momentum.

**Progress bar (under the page).** Default metric = **word count toward a soft, configurable session goal**; the glow tracks the same fraction (eased). **Stays visible while writing** — it's *feedback*, not chrome.

---

## Settings (real — behind the gear in the top bar). Build the toggles + persistence.
- **Progress:** Words / Time (first-word-to-now in a session) / Off (hides the bar; glow still warms quietly). Must be **disable-able**.
- **Fade depth:** Partial (faint floor) / Full (0%).
- **Top bar:** Dissolve (0%, default) / Dim (stays visible + clickable).
- Return timing is **fixed, not a setting.** Word/time goals: pick sane defaults (e.g. a soft word target); expose for tuning later.

---

## Explicitly NOT this milestone (defer; log in `docs/backlog.md`)
- AI features / contents — **frame only.**
- Deep left-rail contents (Structure internals, Notes, working Find) — **frames/stubs only.**
- Format sub-menu contents; nib/ink styles.
- Drawers (the 3-level IA) — separate brief.
- The "What do you write?" post-signup prompt.
- Cross-mode promotion gestures (fragment → Drafting beat; "send to Journal" to re-diverge) — designed, build later.

## Suggested phasing
1. **Mode switcher + the two live modes' core behaviors** — Journal forward-only (as-is), Drafting free-edit — on the existing surface. **Hardware-test here before layering chrome.**
2. **Dissolve / glow / progress engine** + the settings toggles.
3. **The rails** (frames) + **AI frame** (sealed / open / drawer-open) + **formatting/pen drawer.**

(Order is a suggestion — but get Journal+Drafting switching working and hardware-validated first.)

## Hardware gate
Before building chrome on top, validate on a **real tablet (touch + stylus) and a phone**: mode-switching, Journal forward-only runway, Drafting free-edit, the pen bar with stylus, and the dissolve. **The editor just had an IME bug fixed — confirm mode-switching doesn't reintroduce soft-keyboard input issues.**

## Working environment
- Adapt `WritingSession` / `ForwardOnlyEditor` / `useChromeFade` — **do not fork a new editor.**
- Standard PowerShell edit pattern; `git --no-pager`; log deferrals to `docs/backlog.md`.
- `tsc` + `build:web` must pass; existing surfaces (HOME gate, Desk) stay working.
- Reference prototype: `apps/desktop/scratch/wrizo-modes-hybrid.html`.
