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
