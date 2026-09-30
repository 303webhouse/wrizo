# PUB0 — SURVEY, NO CODE
### INK · 2026-09-30 · per `docs/publish/pub-committee-pass.md` §7's own PUB0 row

**Scope, verbatim from §7:** *"Survey, no code: bundle budget; S25 share-sheet file types; WordPress
CORS on a test site; Substack editor URL; font licences; the named-dependency brief."* This file
covers each in order. **PUB1 follows Batch Eight**, per Fable's word.

---

## 1 · BUNDLE BUDGET

**Measured, not guessed.** Today's `apps/desktop` production build (`pnpm run build:web`, already
built at `dist-web/`): the app's own JS is **584 KB** (`assets/index-*.js`, uncompressed — no gzip
step in this build), and `dist-web/` as a whole is **2.1 MB**, almost entirely bundled font files
(Chakra Petch, Courier Prime and others, `.woff`/`.woff2`). No `chunkSizeWarningLimit` or
`manualChunks` is set in `vite.config.ts` today — there is no existing budget to inherit.

**The four PUB dependencies do not land in that number as approved.** `fflate` (PUB1, ~800 KB
unpacked, but a tiny compression library — its actual minified/tree-shaken footprint is a few KB)
ships in the base bundle since PUB1's `.wzo` format needs it immediately. `pdf-lib` + `@pdf-lib/
fontkit` (PUB7) and `pdfjs-dist` (PUB7, **dev/test only** per the ticket's own note) are each many
MB unpacked (§6 below) — **the survey's own recommendation is that PUB7/PUB8 reach these through a
dynamic `import()`** (a Publish-only code path, not the app's every-launch path), so their weight
never taxes TTFK or F1 resume. This is not yet built or ruled; it is this survey's proposal for
whoever briefs PUB7.

**Proposed budget (a number for the desk to ratify, not yet a law):** the APP'S OWN bundle (what
loads on every launch, unchanged by Publish) stays under **1 MB** JS, uncompressed — headroom over
today's 584 KB for PUB1–PUB6's engine/marks/DOCX/deliver/EPUB code, all of which are small,
dependency-light, string-and-DOM work. PUB7/PUB8's PDF path is unbounded by that number **because
it is not in it**, gated behind the dynamic import above. **Unmeasured: gzip/brotli-over-the-wire
size** — Railway serves the built app; nothing in this repo measures compressed transfer size today,
so the 584 KB / 1 MB figures above are uncompressed byte counts, not what actually crosses the wire.

---

## 2 · ANDROID SHARE-SHEET FILE TYPES (S25)

**Researched** (Android's own developer docs; not measured on hardware — no S25 in hand this
session). Android's share sheet is driven by `Intent.ACTION_SEND` with a MIME type and the file
itself passed as `Intent.EXTRA_STREAM` (a content URI, via `FileProvider` — a raw `file://` URI is
refused by modern Android). **The share sheet does not restrict file types itself**; it shows
whichever installed apps declare an intent-filter matching the MIME type given. So **every PUB
export format is shareable** as long as the correct MIME string is sent:

| Format | MIME type |
|---|---|
| `.md` / `.txt` (PUB2) | `text/markdown` / `text/plain` |
| `.html` (PUB2) | `text/html` |
| `.docx` (PUB3) | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `.epub` (PUB6) | `application/epub+zip` |
| `.pdf` (PUB7/PUB8) | `application/pdf` |
| `.fdx` (PUB8) | `application/xml` (no registered FDX-specific MIME; Final Draft itself accepts `application/octet-stream` too) |
| `.wzo` (PUB1) | no standard MIME exists — **propose `application/vnd.wrizo.wzo+zip`** (a vendor MIME, since a `.wzo` is disclosed elsewhere as a zip container); a share-sheet app that doesn't recognise it still offers "Save to Drive"/"Files" generically |

**The step for Nick's S25, concretely:** the Electron/Chromium share path is `navigator.share()`
(Web Share API) with a `File` in its `files` array, or — if that API is unavailable in this build's
Chromium/Electron combination — Android's own share intent via a Capacitor/Cordova-style bridge if
Wrizo ever ships as a native Android shell (**not measured whether it does today**; this survey
found no Android-specific shell code in `apps/desktop` or elsewhere in the repo, only Electron for
desktop). **This is the item this survey could not close**: whether "Share…" on an Android device
means the OS Web Share API from a mobile browser tab, or a native share intent from an installed
app, is a platform-shape question this repo's own code does not yet answer, and PUB4 ("Share…")
needs that answered before it can pick an implementation.

---

## 3 · WORDPRESS CORS ON A TEST SITE

**Researched, NOT measured against a live site — no WordPress test site exists yet for this repo to
probe, and a production probe needs an announcement first (the house law: announce before sending
any request to a real service).** By WordPress's own documented default (the REST API's
`rest_send_cors_headers()`, wired in since WP 4.4), a self-hosted WordPress **returns
`Access-Control-Allow-Origin: *` for anonymous GET requests to `/wp-json/`**, and echoes the
request's own `Origin` header when one is sent — this is a deliberate design choice (WordPress
core's own stated reasoning: the REST API's security model is nonce/cookie-authentication, not
origin-restriction), not a misconfiguration a site owner has to opt into.

**What this means for PUB9's draft-post call:** a **GET** to a public WordPress REST endpoint should
work cross-origin from Wrizo's own domain without any server-side change on the writer's WordPress
install. **A POST that creates a draft is a different case**: it needs the writer's own
authentication (WordPress.com OAuth for 9b, or an Application Password / cookie+nonce for
self-hosted 9), and **authenticated cross-origin POSTs are where CORS actually bites** — a
self-hosted site's default CORS header does not by itself guarantee a credentialed POST succeeds
from Wrizo's origin; that depends on the specific auth method PUB9 picks (Application Passwords,
the method WordPress.com and modern self-hosted installs both support, uses `Authorization:
Basic`, which does not require a cookie and is not blocked by the default CORS header once the
header is present). **Recommendation: PUB9's own S0 spins up a disposable local WordPress
install (Docker, or one of the free hosted trial sites) and proves an authenticated draft-post
call from a real browser context before that ticket's build starts** — this survey could not
run that live check without a target to point at and an announced probe.

---

## 4 · SUBSTACK EDITOR URL

**NOT CONFIRMED — flagged, not invented.** Substack's own support docs (`support.substack.com`,
`on.substack.com`) describe the "New post" flow only as a dashboard button-click ("From your
Substack dashboard, creating a new post is straightforward by clicking the 'New post' button to
open the editor"); neither page states a stable, linkable URL pattern for opening the editor
directly (e.g. pre-filled or deep-linked). The pass's own §12 already says Substack has no API for
posting — Wrizo's plan is "copy your piece ready to paste and open Substack for you," so PUB4 needs
only a URL that lands the writer at *a* new post — not one that pre-fills content (there is no API
path for that; the writer pastes). **This survey's finding: use `https://substack.com/home` (the
writer's own dashboard, which resolves to their publication once signed in) as the safe fallback
`window.open` target, NOT a guessed `/publish/post` URL this survey found no source confirming.**
**Owed:** a five-minute manual check with a real Substack account, at whatever point PUB4 is
briefed, to confirm the dashboard URL still opens a "New post" affordance without extra
clicks — cheap to verify live, not safe to assert from documentation alone.

---

## 5 · FONT LICENCES

**Confirmed.** PUB7 names Tinos and Arimo (vendored, per §7's own row) as the prose PDF's serif/
sans faces. Both are members of Google's **Croscore** font family (with Cousine, monospace, not
named by PUB7 but from the same family) — Google-shipped, **Apache License 2.0**, originally
licensed from Ascender Corporation. Apache 2.0 permits embedding, redistribution and modification
with attribution and a copy of the license; it imposes no copyleft and is compatible with a closed
or open desktop app either way. **Both are metric-compatible substitutes**: Arimo for Arial, Tinos
for Times New Roman — the reason PUB7 chose them (a PDF that renders identically without shipping
Microsoft's own licensed fonts). **Clear to vendor as planned; no licensing blocker.**

---

## 6 · THE NAMED-DEPENDENCY BRIEF

**All four ratified by Nick ("Approved"). Read from the npm registry directly** (not from search
summaries, which conflated `pdf-lib` with a community fork, `@cantoo/pdf-lib` — the ticket names
`pdf-lib` itself):

| Package | Version (latest) | License | Unpacked size | Role |
|---|---|---|---|---|
| `fflate` | 0.8.3 | MIT | ~797 KB | PUB1 — `.wzo`'s zip container |
| `pdf-lib` | 1.17.1 | MIT | ~18.6 MB | PUB7 — prose PDF generation |
| `@pdf-lib/fontkit` | 1.1.1 | MIT | ~4.3 MB | PUB7 — custom font embedding (pdf-lib's own required sister module) |
| `pdfjs-dist` | 6.3.289 | Apache-2.0 | ~33.2 MB | PUB7/PUB8, **tests only** per the ticket — rendering a produced PDF back to pixels to verify it, never shipped to a writer's device |

**Every licence is permissive (MIT or Apache-2.0) — no copyleft, no blocker, all four clear to
install as approved.** **The unpacked sizes above are registry totals (source, docs, multiple
build targets, source maps included) — NOT what a tree-shaken, minified bundle actually ships.**
`pdf-lib`'s own docs cite a browser UMD build far smaller than its unpacked total; this survey did
not measure the real minified-and-gzipped delta each adds to a Publish-only chunk, because that
number only exists once PUB7 is actually built and bundled — it belongs to PUB7's own S0, not this
survey. **`pdfjs-dist` being dev-only is the one load-bearing fact from this table for §1's bundle
budget: it must never appear in a `dependencies` field a production build packs, only
`devDependencies`, and PUB7's brief should say so explicitly rather than leave it to the installer's
judgment.**

---

## 7 · WHAT THIS SURVEY DID NOT CLOSE (owed, named)

1. **§2** — whether "Share…" on Android means the Web Share API or a native share intent; no
   Android shell exists in this repo today to answer it from source.
2. **§3** — a live, announced probe against a real (even disposable) WordPress install, proving an
   authenticated draft-post call, not just the documented default CORS header.
3. **§4** — a five-minute manual check of Substack's dashboard URL with a real account.
4. **§1** — compressed (gzip/brotli) transfer size, and the real minified PUB7 PDF-path delta once
   it exists to measure.

None of these block PUB1 (Batch Eight's own next step); they are each named against the ticket
that needs them (PUB4, PUB9, PUB7) so nothing is discovered mid-build instead of here.
