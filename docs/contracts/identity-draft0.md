# Contract: one Wrizo account for Write and Read · DRAFT 0

**Status:** draft 0, rev e (Fable, Nov 1, 2026, 2:25 am: the email claim; `theme.room`; §5b "at the desk"). NOT signed. Read mocks against it; nothing touches production until Nick signs draft 1.
**Owner:** Fable (Write side). **Consumer:** SOCIAL (Wrizo | Read, `303webhouse/wrizo-read`).
**Nick's rulings this rests on:** one account for both apps; a writer can sign up from either side (Oct 29); the writer's theme follows them into Read (Oct 31); theme switches are saved to the account so they follow the writer into Read (Oct 31).

## 1. Shape
- **Write's server is the identity provider.** The flow is a standard OAuth 2.0 authorization-code flow with PKCE, with OpenID Connect-style ID tokens.
- **Read never sees or stores a Wrizo password.** It only receives tokens. Read holds no Write database credentials and makes no direct database calls.
- **Signing up from Read** sends the person to Write's own sign-up page and back. There is one sign-up form, and Write owns it. Opening sign-up to the public is Nick's separate call; it is closed today.
- **Signing in from Read** works the same way: "Continue with Wrizo" goes to Write's sign-in page and returns with a code.

## 2. What Read receives (the claims)
| Claim | Meaning | Status |
|---|---|---|
| `sub` | A stable id for this person, **minted for Read only** (a pairwise id). It is never Write's database id. It never changes. | agreed |
| `theme.id` | The writer's current Write theme (`plateau`/Arbor, `machina`, `flux`, …). | agreed |
| `theme.room` | The writer's **Room** setting: `clock` (follow the clock), `light` (always day) or `dark` (always night). Nick, Nov 1. **Unset = `clock`.** On `clock` the room is day 07:00–19:00 in the viewer's local time and night otherwise; Read applies the same rule on its own clock. Write sets the resolved room as `data-room` (`light`/`dark`) on the root. A theme whose redesign hasn't shipped ignores the room and follows `page`, as today. | agreed (Nick, Nov 1) |
| `theme.page` | Page: Light / Dark (the existing cross-theme pref). | agreed |
| `theme.cast` | Machina's Cool / Neutral, when the theme is Machina. | agreed |
| `theme.switches` | The writer's per-theme "wow" switches (`{ themeId: { switchKey: false } }`; only the switches turned off are listed). | agreed (Nick, Oct 31: on the account) |
| pen name / public name | Who owns it, Write or Read. | **OPEN (Nick, deferred)** |
| age / class signal | Whether Write collects anything at sign-up and passes it on, or whether Read handles it entirely. | **OPEN (Nick, deferred)** |
| `email` + `email_verified` | The writer's sign-in address, for **account notices only** (Nick's Read ruling D20: stored under Read's retention, deleted with the account, shown to no one). **`email_verified` is `false` for every account today:** Write sends no email yet, so it has never verified an address. It becomes `true` only after Write gains a verification step (planned with the "forgot password" email). Read must not treat an unverified address as proof of anything. | agreed (Nick, D20) |

- The claims are **read-only for Read**. Read never writes back to Write's settings.
- They're fresh at every sign-in, plus a `userinfo` endpoint Read may call to refresh the theme after a writer changes it in Write.

## 3. Sessions and endings
- Access tokens are short-lived (≤ 1 hour); refresh tokens can be revoked.
- Signing out of one app does not sign the person out of the other.
- **Account deletion propagates.** When an account is deleted in Write, Write sends Read a signed "account deleted" event for that `sub`, and Read deletes that person's data under its own retention rules.
- Read can't delete a Write account. A "delete my account" request in Read sends the person to Write.

## 4. Security
- The client secret and the signing keys live only in Railway variables. **Never in either repo, a chat, a doc or a log** (both repos are public).
- Redirect addresses are an exact allowlist. Tokens are never put in URLs after the code exchange.
- Read's lanes test against a **mock identity provider** with fake users. They are never given real accounts or real tokens.

## 5b. "At the desk" presence (Nick approved, Nov 1, 2026)
- **Opt-in, off by default.** It's a Write setting, `presenceAtDesk: true`, saved to the account. Only the "on" value is stored.
- When it's on, Write tells Read **one coarse fact**: `at_desk: true` while a writing surface is open and the writer has typed in the last 10 minutes. Write sends it under the writer's own sign-in, on change and as a refresh at most every 5 minutes.
- **Read treats it as false** when it hasn't been refreshed for 10 minutes, or when the writer signs out or turns the setting off.
- **Never sent:** words, counts, titles, which page, keystroke timing, or how long. Read never shows a duration or a number, and shows the state only inside the writer's own guilds.
- Turning it off stops it at once. Write sends one `at_desk: false` and nothing more.

## 5. Not in this contract (planned)
- **The notes feed** (Nick, Oct 31: "as a writer, I want to see the comments a piece of mine has received while I'm actively working on it in Wrizo"). This is a third, separate contract, `notes-feed-draft0.md`, after export v1 is signed: Read → Write, read-only. See export-v1-draft0 §6.

## 6. Versioning
This is draft 0. Draft 1 resolves the OPEN rows and is what Nick signs. After signing, a breaking change needs a new version, and both apps support the old version for one release.
