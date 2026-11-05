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
| Token lifetimes | ID token ≤ 1 h; access token ≤ 1 h; refresh token revocable |
| `userinfo` | `<issuer>/oauth/userinfo`; it returns the same claims (Read refreshes the theme there) |
