# Identity draft 1 · technical appendix (Fable, Nov 4, 2026)

**For:** Read's P2 build. **Status:** an appendix to the SIGNED identity draft 1. It fixes implementation details only, changes nothing the signed text says, and may be extended without a new version.

| Item | Value |
|---|---|
| Issuer (production) | `https://writer-studio-app-production.up.railway.app` |
| Issuer (staging) | Write's staging address, named when the staging environment exists (it's built with the identity slice) |
| Discovery document | `<issuer>/.well-known/openid-configuration` |
| Public keys (JWKS) | the `jwks_uri` named in the discovery document (`<issuer>/.well-known/jwks.json`) |
| Flow | authorization code + PKCE (S256); `response_type=code` |
| ID-token signing algorithm | **ES256** (P-256), one algorithm only. The account-deleted event uses the same keys and algorithm, with `kid` in its header. |
| Scopes Read asks for | `openid email wrizo.theme` (`openid` → `sub` + `adult`; `email` → `email` + `email_verified`; `wrizo.theme` → `theme`) |
| The `theme` claim | **ONE nested object:** `"theme": { "id": "plateau", "room": "clock", "page": "light", "cast": null, "switches": { "plateau": { "leafFlutter": false } } }`. `cast` is null outside Machina; `switches` lists only the switches turned OFF. |
| Other claims | `sub` (pairwise for Read), `adult` (always `true`), `email`, `email_verified` (`false` until Write verifies addresses), plus the standard `iss`, `aud`, `exp`, `iat`, `nonce` |
| Token lifetimes | ID token ≤ 1 h; access token ≤ 1 h; no refresh tokens (see below) |
| `userinfo` | `<issuer>/oauth/userinfo`; it returns the same claims (Read refreshes the theme there) |
| The deletion event's `v1` | base64url (no padding) of the raw 64-byte `r‖s` ES256 signature, as in a JWS. Not DER. |
| Read's client | **Confidential**: a client secret plus PKCE. Token-endpoint auth = **`client_secret_basic`**. Write mints Read's client id + secret **per environment** (staging, production) and gives them to Nick, who types them into Read's Railway variables himself. They're never pasted into a chat, doc, repo or log. |
| Refresh tokens | **None** (no `offline_access`). Read keeps its own session after sign-in. It refreshes the theme at each sign-in and, at most once a day when Read opens, by a silent re-authorisation (`prompt=none`). A `login_required` answer just keeps the last theme. Fewer long-lived tokens means less to steal. |
| Key rotation | Write publishes a new signing key in the JWKS **at least 1 hour before** signing with it. Read re-fetches the discovery document and the JWKS at most once a minute, and **trusts a removed key for at most 10 minutes** (not an hour), so an emergency removal takes effect within 10 minutes. |
| Write → Read server calls (export §8b: destinations + import) | Write's server sends a **short-lived bearer token it signs** (ES256, the same keys, `kid` in the header): `iss` = Write; `aud` = Read's client id; `sub` = the writer's pairwise `sub` for Read; `scope` = `read.publish`; **`exp` ≤ 5 minutes**; a unique **`jti`, which Read rejects if it has seen it before inside the token's lifetime** (no replay). Write mints one only while the writer is signed in and has pressed Publish. It's server to server: no cookies, no CORS. Read verifies it like an ID token. |
