# Deploy — Writer Studio on Railway (W3)

The web build deploys to Railway as a single Node service that serves the built
renderer and the `/auth` + `/api` endpoints, backed by a Railway Postgres.

> **Secrets rule:** secret *values* live only in Railway env vars and an untracked
> `apps/server/.env` for local dev. Never write a secret value into any file in
> this repo, commit, log, or doc. This file lists env vars by **name only**.

## Project layout on Railway

- **Project:** `writer-studio` (a NEW project on the owner's account — never the
  trading-hub / pandoras-box project, and never a service inside it).
- **Services:**
  - `Postgres` — a NEW Railway Postgres instance (provisioned via `railway add -d postgres`).
  - `writer-studio-app` — the Node web service built from this repo.

## Build & start (config-as-code)

`railway.json` at the repo root drives the app service:

- **Builder:** NIXPACKS (auto-detects pnpm from `pnpm-lock.yaml`; pnpm pinned via
  the root `packageManager` field).
- **Build command:**
  `pnpm install --prod=false && pnpm --filter @writer-studio/desktop build:web && pnpm --filter @writer-studio/server build`
  (`--prod=false` forces devDependencies — vite/typescript — to install even though
  `NODE_ENV=production` is set for runtime.)
  - `build:web` emits `apps/desktop/dist-web` (Electron's `dist/` is untouched).
  - the server build emits `apps/server/dist`.
- **Start command:** `node apps/server/dist/index.js`
  - serves `apps/desktop/dist-web` at `/` with SPA fallback, plus `/auth/*`,
    `/api/*`, and `/healthz`.
- **Healthcheck path:** `/healthz`.

Migrations run automatically on boot when the `users` table is absent
(`apps/server/migrations/001_init.sql`).

## Environment variables (set on the `writer-studio-app` service)

| Name | Notes |
|---|---|
| `DATABASE_URL` | Reference the Postgres service's internal URL: `${{Postgres.DATABASE_URL}}`. Not a typed-in secret. |
| `SESSION_SECRET` | 32+ random bytes. Generate, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. **Owner-set secret.** |
| `INVITE_CODE` | The registration gate handed to testers. **Owner-set secret.** |
| `NODE_ENV` | `production` (enables secure cookies + `trust proxy` + Postgres TLS). |

`PORT` is provided automatically by Railway; the server reads `process.env.PORT`.

## Steps performed / to perform

1. **Create project + Postgres** (done): `railway init --name writer-studio`,
   then `railway add -d postgres`.
2. **Create the app service** (done): `railway add --service writer-studio-app`.
3. **Set non-secret env** (done): `NODE_ENV=production`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
4. **Set secret env** (owner): `SESSION_SECRET`, `INVITE_CODE` — via the Railway
   dashboard or `railway variables --service writer-studio-app --set NAME=VALUE`.
5. **Deploy:** `railway up --service writer-studio-app` (uploads the repo;
   `node_modules`, `dist`, `dist-web`, and `.env` are gitignored and not uploaded —
   Railway installs and builds fresh).
6. **Public domain:** `railway domain` generates `https://<app>.up.railway.app`.
7. **Verify:** `GET /healthz` returns 200; register with the invite code; write a
   sprint on mobile data; confirm the row in Postgres.

## Local dev against this database

`apps/server/.env` (untracked) holds `DATABASE_URL` (the Postgres **public** proxy
URL, `DATABASE_PUBLIC_URL`), a local `SESSION_SECRET`, a local `INVITE_CODE`,
`PORT=3000`, and `NODE_ENV=development`. Run `pnpm --filter @writer-studio/server build`
then `node apps/server/dist/index.js`.
