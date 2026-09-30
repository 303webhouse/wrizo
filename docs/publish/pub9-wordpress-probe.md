# PUB9 probe — WordPress drafts from the browser + Substack's editor URL — Cloud lane, 2026-09-30

**STATUS: REPORT ONLY. No product code.** Everything ran on a throwaway cloud machine against a
**disposable** WordPress built for this probe. No real site, no real account, no production, no
secrets. Substack was only visited signed out; nothing was posted.

**Ordered by:** Fable (task 2 of 3). It closes two items that `docs/publish/pub0-survey.md` §7
left owed:
- item 2: a live WordPress probe;
- item 3: Substack's editor URL, which is closed here as far as it can be without an account (see
  Part 4).

It feeds PUB9 (WordPress draft) and PUB4 (Substack copy) in `docs/publish/pub-committee-pass.md`
§7.

**Setup:**
- WordPress **7.1.2** (the current release), with the SQLite Database Integration plugin 3.0.2,
  served by PHP 8.4. Two test users: an Administrator and a Contributor.
- Local HTTPS fronts, so the site looks like a normal HTTPS host. A second front **drops the
  `Authorization` header**, to imitate hosts that do that.
- A stand-in "Wrizo" page on a **different site** (`https://wrizo.test:5443`) calls WordPress
  from a real Chromium browser. It logs every address it is asked for.
- The environment type is set to `production` for every case.

Evidence is in `docs/publish/evidence/pub9/`. Per Fable's rule, **every `Authorization` header
and every application password is redacted there** (`Basic ‹redacted›`, `password=‹redacted›`),
throwaway ones included. Before commit, the files were checked against all 8 throwaway secrets in
36 encodings: none present.

---

## FOR NICK (plain English — the short version)

**Yes, it works.** Wrizo, running in a browser, can save a piece as a **draft** on a writer's own
WordPress site. No server of ours is involved, and the writer doesn't have to change anything on
their site. Measured, in a real browser, from a different website.

**What the writer needs:**
- a self-hosted WordPress site on **https**;
- an account on it that can write posts;
- one click on WordPress's own **"Yes, I approve of this connection"** screen.

WordPress.com sites are different and come later.

**The one real safety catch** (Fable asked me to look):
- When the writer approves, WordPress sends the new password back to Wrizo **inside the web
  address**.
- Wrizo can wipe it from the address bar at once. I measured that working.
- **But the browser still keeps the original address, password included, in its history.** I
  measured that too.
- **The fix, also measured:** the moment the writer lands back in Wrizo, Wrizo uses that password
  once to make a **fresh** one, then **cancels the one that travelled in the address**. Anything
  left in history is then dead; I checked it's refused.

**Drafts only is Wrizo's job.** If asked, WordPress will happily publish straight to the public
site from an admin account. So Wrizo must only ever send "draft". Alternatively the writer can
connect a lower-level "Contributor" account, which WordPress itself stops from publishing.

**Substack:**
- There's **no official "new post" web address**, and **no way to post for the writer**. Substack's
  official developer API (January 2026) only reads public profile facts.
- So Wrizo does what the plan already says: **copy the piece, formatted, and open the writer's
  Substack Posts page**, where they click **Create → Article** and paste.

**One optional choice for you** (it doesn't block anything):

| # | Question | My recommendation |
|---|---|---|
| 1 | When a writer connects WordPress, should Wrizo's setup guide suggest a separate **Contributor** account (WordPress itself then refuses to publish, but the post's byline is that account), or just use their **own** account? | **Their own account by default**, with Wrizo enforcing drafts only; offer "Contributor" in the guide as the extra-safe option. |

**One optional check** (only if you have a Substack account): while signed in, open
`https://YOURNAME.substack.com/publish/post` and tell me whether a blank editor opens. If it does,
Wrizo can skip two clicks. It's not documented, so we wouldn't rely on it either way.

---

## Part 1 · WordPress: can a browser app create a DRAFT? (measured)

Every case below ran from `https://wrizo.test:5443` (a different site) in Chromium, with
`fetch(…, { mode: 'cors', credentials: 'omit' })` and an `Authorization: Basic …` header. Full
records are in `evidence/pub9/results.json`; every request line is in
`evidence/pub9/wp-front-requests.jsonl`.

| Case | What was tried | Result |
|---|---|---|
| C1 | `GET /wp-json/` (no login) — discovery | **200**. The index advertises `authentication → application-passwords → endpoints → authorization` = the site's `/wp-admin/authorize-application.php` |
| C2 | `POST /wp-json/wp/v2/posts`, `status:'draft'`, **Administrator** app password | **201**, `status: "draft"`, `link: …/?p=5` |
| C2b | Read it back (`?context=edit`) | Still `draft`; **title and content byte-identical** to what was sent |
| C3 | Same, **Contributor** app password | **201**, `draft` |
| C3b | Read it back | **Every word identical.** One markup change: WordPress's filter rewrote `<hr …/>` as `<hr … />` (a space before the slash) |
| C4 | `status:'publish'`, **Contributor** | **403** `rest_cannot_publish` — "Sorry, you are not allowed to publish posts in this post type." |
| C5 | `status:'publish'`, **Administrator** | **201**, `status: "publish"`: **it went live**. WordPress does not enforce "drafts only"; Wrizo must |
| C6 | Wrong application password | **401** `rest_cannot_create` — "Sorry, you are not allowed to create posts as this user." |
| C7 | No `Authorization` header | **401** `rest_cannot_create` (same words as C6) |
| C8 | Host that **strips** `Authorization` | **401** `rest_cannot_create` (same again) |
| C8b | Same host, `/?rest_route=/wp/v2/posts` | **401**: the fallback route doesn't bring the header back |
| C8c | Same host, `?_envelope=1` | HTTP 200, but the envelope says **401**. Doesn't help either |
| C8d | Same host, `GET /wp/v2/users/me` | **401** `rest_not_logged_in` |
| C9 | HTTPS Wrizo → **http://** WordPress | **Blocked by the browser before sending**: `TypeError: Failed to fetch`. Console: "Mixed Content: … This request has been blocked; the content must be served over HTTPS." |
| C10 | Plain-http WordPress, production, **valid** app password (server-to-server, to see WordPress's own answer) | **401** `rest_cannot_create`. Discovery lists **no** authentication (`[]`), because WordPress turns app passwords off on http production sites (`wp_is_application_passwords_supported()`: `is_ssl() \|\| 'local' === wp_get_environment_type()`) |

Also checked by hand with the same fronts:
- a wrong password on `GET /wp/v2/users/me` → `rest_not_logged_in`;
- the writer's normal **login** password used instead of an app password → `rest_not_logged_in`.

WordPress's docs agree that app passwords "cannot be used to log into wp-admin", and the reverse
holds too.

### The preflight (exact, C2)

The browser sent one `OPTIONS` before the `POST`:

```
request   Origin: https://wrizo.test:5443
          Access-Control-Request-Method: POST
          Access-Control-Request-Headers: authorization,content-type
response  200
          Access-Control-Allow-Origin: https://wrizo.test:5443        (the caller's own origin, echoed)
          Access-Control-Allow-Credentials: true
          Access-Control-Allow-Methods: OPTIONS, GET, POST, PUT, PATCH, DELETE
          Access-Control-Allow-Headers: Authorization, X-WP-Nonce, Content-Disposition, Content-MD5, Content-Type
          Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages, Link
          Vary: Origin
```

The `POST` then returned **201** with the same `Access-Control-Allow-*` headers and
`Location: …/wp-json/wp/v2/posts/5`. Nothing on the WordPress side had to be configured. The
preflight looked the same on the stripping host, on `?rest_route=`, and for `GET`/`DELETE` on the
application-passwords routes.

**Correction to PUB0 §3:** PUB0 expected `Access-Control-Allow-Origin: *` on anonymous GETs.
Measured: WordPress **echoes the caller's origin** with `Access-Control-Allow-Credentials: true`
and `Vary: Origin`, on anonymous and authenticated requests alike. PUB0's conclusion stands:
cross-site works with no change to the writer's site.

### What Wrizo's call should look like (for the PUB9 builder)

```js
// Discovery first (C1): find the REST root and the authorize URL; never hard-code wp-admin paths.
//   try `${site}/wp-json/`, then `${site}/?rest_route=/` (sites without pretty permalinks).
await fetch(`${restRoot}wp/v2/posts`, {
  method: 'POST',
  mode: 'cors',
  credentials: 'omit',                 // never send the writer's WordPress cookies
  headers: {
    Authorization: 'Basic ' + base64Utf8(`${userLogin}:${appPassword}`),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ title, content /* block HTML */, status: 'draft' }),  // always 'draft'
});
// Then check the reply says status === 'draft' before telling the writer "Saved as a draft".
```

- **Drafts only is Wrizo's law (PUB-A2), not WordPress's.**
  - C5 shows an Administrator's app password publishes if asked.
  - So: always send `status:'draft'`; never send a status on later updates; and confirm the
    returned `status` is `draft`.
- **The draft link:** the reply's `link` (`…/?p=ID`) previews it. The editor is
  `${site}/wp-admin/post.php?post=ID&action=edit`.
- **Words in order (the testing law):**
  - For an Administrator, the round trip was byte-identical.
  - For a Contributor, WordPress's HTML filter normalised one tag (`<hr …/>` → `<hr … />`), but
    no word changed.
  - So the PUB9 harness should compare **words in order**, not bytes. Separately, Wrizo's block
    HTML writer should emit `<hr … />` (with the space), so both roles round-trip exactly.

### What Wrizo can tell the writer when something fails

The trap: **a wrong password, a revoked password, a login password, and a host that strips the
header all give the same `401`** (C6–C8, plus the hand checks). Wrizo can still narrow it down in
three cheap steps:

| Check | If it fails | Plain words for the writer |
|---|---|---|
| 1. Is the site address `https://`? | C9: the browser blocks it | "Your site needs a secure (https) address before Wrizo can send drafts to it." |
| 2. `GET /wp-json/`: does `authentication` list `application-passwords`? | C10 (`[]`), or a security plugin / host has turned them off | "Your site has app passwords turned off. Your host or a security plugin may control this." |
| 3. `GET /wp/v2/users/me` with the saved password → 200? | 401 (C8d / hand checks) | "WordPress didn't accept the connection. Either it was removed (Users → Profile → Application Passwords), or your host is dropping the login header: in WordPress, open **Tools → Site Health**. If it says **'The authorization header is missing'**, ask your host to fix it, or reconnect." |
| — | `403 rest_cannot_publish` | Never seen by a writer: Wrizo only sends drafts |
| — | `TypeError` on an https site | "Your site (or a security plugin) blocked the connection." (Not measured; see Part 5.) |

About that Site Health check: WordPress 7.1.2 ships it (`get_test_authorization_header()`). On
Apache it also writes the fix into its own permalink rules itself:
`RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]`
(`wp-includes/class-wp-rewrite.php`). So "Settings → Permalinks → Save" is often the cure. The
WordPress Application Passwords wiki gives the host-side fixes (`CGIPassAuth On`, `SetEnvIf`).

---

## Part 2 · The "Authorize Application" connect flow, and the password in the address (Fable's adjustment 3)

This is how a writer connects without copying passwords by hand. Wrizo sends them to the site's
authorize page (from discovery, C1), with:
- `app_name=Wrizo`;
- `app_id=<Wrizo's fixed UUID>`;
- `success_url=<Wrizo's return page>`.

**Measured:**

| Case | What happened |
|---|---|
| A0 | Signed out → sent to `wp-login.php`, which keeps `redirect_to` and comes back to the approval screen after sign-in |
| A1 | **What the writer sees** (`evidence/pub9/authorize-application-screen.png`): "An application would like to connect to your account. Would you like to give the application identifying itself as **Wrizo** access to your account? You should only do this if you trust the application in question." Below it: a name box (pre-filled "Wrizo") and **Yes, I approve of this connection** / **No, I do not approve of this connection**. WordPress even shows where it will send them: `…/wp-return.html?site_url=…&user_login=probe-admin&password=[------]` |
| A2 | **Approve → the new application password comes back in `success_url`'s QUERY STRING:** `https://wrizo.test:5443/wp-return.html?site_url=https%3A%2F%2Fwp.test%3A8443&user_login=probe-admin&password=‹redacted›` (24 letters/digits in six groups of four). **It reached the Wrizo-side server in the request line** (`evidence/pub9/wrizo-origin-requests.jsonl`, redacted) |
| A2 | The return page's first script ran `history.replaceState(null, '', location.pathname)` → the **address bar became `https://wrizo.test:5443/wp-return.html`**, clean |
| **A7** | **But the browser's History database still holds the arrival address with the password** (full Chromium, persistent profile, canary value): `…/wp-return.html?site_url=…&user_login=probe-admin&password=‹canary›`, next to the clean one (`evidence/pub9/history-check.txt`). Wiping the address bar is necessary, **not sufficient** |
| A3 | **Rotate on arrival works:** with the travelled password, Wrizo can `GET …/users/me/application-passwords/introspect` (200: name "Wrizo", our `app_id`), then `POST …/users/me/application-passwords` (201: a **fresh** password, same `app_id`), then, **with the fresh one**, `DELETE …/application-passwords/<uuid of the travelled one>` (200, `deleted: true`). **The travelled password is then refused: 401 `rest_not_logged_in`** |
| A8 | Wrizo's own one-time value survives the trip: `success_url=…/wp-return.html?state=st-…` came back as `?state=st-…&site_url=…&user_login=…&password=‹redacted›`, and on reject as `?state=st-…&success=false` (`evidence/pub9/state-check.json`) |
| A6 | **Reject** → `…/wp-return.html?success=false` (WordPress appends it when no `reject_url` is given) |
| A5 | A plain-**http** `success_url` on a production site is refused: "The URL must be served over a secure connection." (WordPress allows http only for `127.0.0.1` / `[::1]` or a `local` environment: `wp_is_authorize_application_redirect_url_valid()`) |
| A4 | A curiosity, **not a fix**. With a `success_url` ending in `#connect`, WordPress's approval **script** glues the values on after the `#`: `…/wp-return.html#connect?site_url=…&password=‹redacted›`. Browsers never send the part after `#` to a server, so the Wrizo-side server saw only `/wp-return.html`. But WordPress's **no-script** path uses `add_query_arg()`, which puts them *before* the `#`; this is undocumented; and it still lands in history. Don't rely on it |

**Why it matters:**
- An application password carries **the whole account's API powers**.
  - It can't sign in to wp-admin.
  - But an Administrator's can do nearly anything WordPress's API allows. **Measured:** with the
    probe Administrator's app password, `POST /wp/v2/users` created a **new Administrator
    account** (201).
- An address holding it can end up in:
  - browser history (measured, A7);
  - Wrizo's own server (measured on the stand-in, A2). Wrizo's Express server has no request
    logger today (`apps/server/src/index.ts`).
  - Railway's edge "HTTP logs", which record each request's path. Railway's docs don't say
    whether the query string is kept, so **assume it may be**.

### The proposal: the return-page contract (for the PUB9 builder)

1. **Before leaving Wrizo:**
   - make a one-time random `state` and keep it on the device;
   - send the writer to the discovered authorize URL with `app_name=Wrizo`, Wrizo's fixed
     `app_id`, and `success_url=https://<wrizo>/connect/wordpress?state=<state>` (A8);
   - leave out `reject_url`: WordPress then appends `success=false` (A6).
2. **The return page is plain and quiet:**
   - served with `Referrer-Policy: no-referrer` and `Cache-Control: no-store`;
   - loads nothing from any other site before step 3.
3. **Strip it from the address bar at once** (Fable's proposal):
   - the first script reads `site_url`, `user_login` and `password` into memory;
   - it then calls `history.replaceState(null, '', location.pathname)` immediately (measured
     clean, A2).
4. **Check it's ours:**
   - `state` must match and be unused;
   - `site_url` must be `https://` and the same site the writer typed.
   - Otherwise: store nothing, and say "That connection didn't start here."
   - This stops a crafted link from planting someone else's site, which would send the writer's
     drafts there.
5. **Rotate on arrival** (A3):
   - introspect;
   - create a fresh password with the same `app_id`;
   - delete the travelled one using the fresh one;
   - keep **only the fresh one, on the device only** (ratified slate 9).
   - If any step fails, keep the travelled one and tell the writer plainly that they can remove
     old connections under **Users → Profile → Application Passwords**.
6. **Never log it:**
   - no `console.*`;
   - no error-reporter breadcrumbs or analytics on this route;
   - never sent to Wrizo's server.
   - Wrizo's server must never gain a request logger that records query strings on this path.
7. **Say what's left, honestly.** The travelled address may remain in browser history (A7) and
   possibly in Railway's edge log. After step 5, the password in it is already cancelled (A3d).
   That is why **rotation is the real fix, and stripping is hygiene**.

---

## Part 3 · What the writer must set up (checklist, from the measurements)

1. **A self-hosted WordPress, 5.6 or later** (app passwords arrived in 5.6; measured on 7.1.2).
2. **An https address.**
   - Over http, a production site turns app passwords off (C10).
   - Wrizo, itself on https, can't reach an http site anyway (C9).
   - WordPress also refuses an http return address (A5).
3. **An account that can write posts.**
   - **Their own account** (simplest). Drafts only is then Wrizo's promise (C5).
   - **Or a Contributor account** made for Wrizo. WordPress itself then refuses to publish
     (C4), but the byline is that account's, and Contributors can't upload images (images are
     deferred anyway).
4. **App passwords not switched off.**
   - Some hosts and security plugins turn them off. Wrizo detects this (Part 1, check 2).
   - A site behind a browser password box (common on staging sites) is refused by WordPress
     itself: "Your website appears to use Basic Authentication, which is not currently
     compatible with application passwords."
5. **The login header reaching WordPress.** **Tools → Site Health** should say "The Authorization
   header is working as expected". If not: Settings → Permalinks → Save, or ask the host.
6. **Nothing blocking other sites' requests.** A firewall or security plugin *could* strip the
   CORS headers measured above. Not measured; see Part 5.
7. **WordPress.com is a different road** (a later ticket, PUB9b).
   - It uses OAuth2 through `public-api.wordpress.com`, with Wrizo registered as an app.
   - WordPress.com's docs: application passwords "are never used directly with
     `public-api.wordpress.com` endpoints" and suit "applications that only access your own
     WordPress.com sites".

---

## Part 4 · Substack's new-post editor URL

**Answer: there is no documented new-post address.** Undocumented, `/publish/post` may exist, but
it **cannot be confirmed without an account**. Evidence: `evidence/pub9/substack-checks.txt`.

- **Signed-out checks** (2026-09-30):
  - `https://on.substack.com/publish/post` → 302 to sign-in, with `redirect=%2Fpublish%2Fpost`.
  - **Control:** a made-up `…/publish/zzz-not-a-real-page-9431` does exactly the same.
  - So every `/publish/*` path goes to sign-in, real or not. The redirect proves nothing about the
    editor.
  - `https://substack.com/publish/post` → 404. `https://substack.com/home` → 302 to `/`.
- **Substack's help centre, all 387 articles** (via its public article feed; the web pages refuse
  automated visits):
  - **no article gives `/publish/post`**;
  - the documented dashboard pages are `https://your.substack.com/publish/home` and
    `https://your.substack.com/publish/posts`;
  - the documented steps: "Go to your publication's Dashboard, click on "Create" and select
    "Article"" (article 360037831771, updated 2026-09-29), and "select "Create" from either the
    Home or Posts tabs" (29152946791188, updated 2026-09-30).
- **No posting API.** Substack's Developer API Terms (last updated 8 January 2026) grant only
  public profile data (name, LinkedIn URL, subscriber count, bestseller status, profile and
  publication URL). Nothing creates or publishes a post.

**What Wrizo can rely on (PUB4):**
- **Copy for Substack** (formatted text to the clipboard), plus **Open Substack**.
- **Open Substack** goes to `https://<publication>.substack.com/publish/posts` if the writer has
  told Wrizo their publication address once (the `*.substack.com` address works even for custom
  domains). Otherwise it goes to `https://substack.com/`, where signed-in writers reach "Publisher
  dashboard" from their profile menu.
- **The Posts tab is chosen over Home** because it lists drafts, which is where the pasted piece
  will live; Home opens on a stats overview.
- The writer then clicks **Create → Article** and pastes. Two clicks, both documented.
- **Correction to PUB0 §4:** prefer the documented `/publish/posts` over `substack.com/home`.
  Signed out, `substack.com/home` just bounces to `/`, and signed in it was never verified.

---

## Part 5 · What this probe did not cover (named, not guessed)

- **Real hosts.**
  - Header stripping was *simulated* by a front that drops the header.
  - Shared hosting (Apache CGI/FastCGI), Cloudflare and other firewalls, and specific security
    plugins weren't tested.
  - The Site Health test is the writer's check for these.
- **Other browsers.** Only Chromium. Firefox and Safari handling of history after
  `replaceState` wasn't measured, which is one more reason rotation (A3) is the fix.
- **A WordPress on the writer's own computer or home network.** Chrome's local-network rules may
  add a permission prompt. Not measured.
- **WordPress.com** (OAuth) was not probed.
- **Substack signed in.** Whether `/publish/post` opens a blank editor is the one-minute check in
  Nick's card.

---

## Sources (fetched 2026-09-30)

- WordPress core 7.1.2 source, read directly:
  - `wp-includes/user.php` (`wp_is_application_passwords_supported`);
  - `wp-admin/includes/user.php` (`wp_is_authorize_application_redirect_url_valid`);
  - `wp-admin/authorize-application.php` and `wp-admin/js/auth-app.js` (how the return address is
    built);
  - `wp-admin/includes/class-wp-site-health.php` (`get_test_authorization_header`);
  - `wp-includes/class-wp-rewrite.php` (the `HTTP_AUTHORIZATION` rule).
- Application Passwords integration guide (WordPress core team):
  https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/
  - "Three GET variables will be appended when they are passed back (`site_url`, `user_login`,
    and `password`)";
  - discovery via the REST index's `authentication` key;
  - "`success_url` … will generate an error if they use a `http://` rather than `https://`
    protocol".
- REST API authentication handbook:
  https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/
- Application Passwords (advanced administration):
  https://developer.wordpress.org/advanced-administration/security/application-passwords/
  - "available when requests are served over HTTPS";
  - "cannot be used to log into wp-admin";
  - revoking under Users → Profile.
- Header stripping fixes: https://github.com/WordPress/application-passwords/wiki/Basic-Authorization-Header----Missing
- WordPress.com REST API, getting started: https://developer.wordpress.com/docs/api/getting-started/
- Railway logs (HTTP logs record method, path, status): https://docs.railway.com/observability/logs
- Substack help centre feed: https://support.substack.com/api/v2/help_center/en-us/articles.json
  - articles 360037831771, 29152946791188, 15754587436820.
- Substack Developer API Terms of Use: https://substack.com/api-tos

## Evidence files (`docs/publish/evidence/pub9/`)

| File | What it is |
|---|---|
| `setup.sh` | How the disposable WordPress was built (passwords generated at run time, never printed) |
| `router.php`, `proxies.mjs` | The `php -S` router, and the local TLS fronts: normal, header-stripping, and the Wrizo stand-in that logs request lines |
| `site/probe.html`, `site/wp-return.html` | The stand-in Wrizo page, and the return page demonstrating strip-at-once |
| `pub9-probe.mjs` | Cases C1–C10 and A0–A6; writes `results.json` (redacted at the source) |
| `history-check.mjs`, `history-check.txt` | A7: the History database after `replaceState` (canary value) |
| `state-check.mjs`, `state-check.json` | A8: Wrizo's `state` survives approve and reject |
| `results.json` | Every case's status, error code and message, and headers (redacted) |
| `wp-front-requests.jsonl` | Every REST / authorize request at the WordPress front: preflights and CORS headers (redacted) |
| `wrizo-origin-requests.jsonl` | What the Wrizo-side server received (passwords redacted) |
| `authorize-application-screen.png` | The approval screen the writer sees (WordPress shows only a `[------]` placeholder) |
| `substack-checks.txt` | Signed-out requests with controls, the help-centre scan, and the Developer API terms |
