# Mannin — development

Working copy for further building (root of the repo is the stable snapshot).

## Run
    npm start        # http://localhost:5173 (Node built-ins only, no install)
    npm test         # end-to-end smoke test; needs the server running and Chrome at
                     # C:/Program Files/Google/Chrome/Application/chrome.exe (Node 24+)

## Layout
- `index.html`, `css/`, `js/` — front end (ES modules; `js/store.js` is the local data store)
- `supabase/` — SQL + `admin-users` function; see `supabase/README.md` for backend setup
- `tests/e2e.mjs` — 74 checks over Chrome DevTools Protocol

## Status
- Front end runs on local storage in demo mode; Supabase is not connected yet.
- `DEMO_MODE` in `js/config.js` must be `false` before any real deployment.
- Pending: connect Supabase (URL + anon key), SMS code check for Roots, payments.

## New stack: React + Fastify + PostgreSQL (stage 1)

The plain-JS prototype above stays as the behaviour reference. The production stack lives beside it:

| Folder | What |
| --- | --- |
| `web/` | React 19 + Vite + React Router. Talks only to `/api` (Vite proxies to Fastify in dev) |
| `api/` | Fastify 5 API: auth (JWT in httpOnly cookie, bcrypt), plans, menu, Roots catalog + server-side checkout |
| `db/schema.sql` | Plain PostgreSQL schema (no Supabase auth/RLS). Access rules live in the API |

### Run it
    # API (in-process PGlite, data lost on restart; good for local work)
    cd api && JWT_SECRET=dev-secret SEED_PASSWORD=<demo password> DEV_SEED=1 node src/server.js
    # Web
    cd web && npm run dev            # http://localhost:5174

### Use a hosted PostgreSQL
Copy `api/.env.example` to `api/.env` (never commit it), put your connection string in `DATABASE_URL`, then:

    cd api && node --env-file=.env scripts/seed.js     # applies db/schema.sql and loads demo data
    node --env-file=.env src/server.js

### Tests
    cd api && npm test                                  # 8 API tests on PGlite (auth, pricing, 3-restaurant cap, token lockout, AU rate, status flow)
    cd web && SEED_PASSWORD=<same> node tests/smoke.mjs # 12 browser checks; API + web must be running

### Ported so far / still to port
- Done: sign-in, plans, menu, Mannin Roots (kitchen-first browse, cart, server-priced checkout, my orders), staff Roots order queue.
- Next (stage 2): sign-up + payment approval, customers/care members, doctor consultations, appointments, kitchen prep sheet, deliveries, finance, audit screens, staff user admin (replaces the Supabase `admin-users` function).
- Not built: SMS code, online payments, deployment config.
