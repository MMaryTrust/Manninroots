# Mannin — Supabase setup (free plan, minimal scope)

Only what the app already does: database tables, Supabase sign-in, row-level security and
one server function for creating accounts. No storage, realtime, AI, analytics, SMS or payments.

| File | What it does |
| --- | --- |
| `01_suvai.sql` | Mannin Suvai tables, business rules (locks, midnight delivery lock, append-only audit, server-side plan prices, auto follow-up) and access rules per role |
| `02_roots.sql` | Mannin Roots in its own `roots` schema: restaurants, dishes, orders, server-side checkout (`place_order`), token-guess lockout |
| `03_first_owner.sql` | Makes your own login the first Shop Owner |
| `functions/admin-users/` | Server function: approve a paid sign-up, create a staff login. Returns the temporary password once |

## Steps for the project owner
1. Create the project at supabase.com. Region: **Mumbai (ap-south-1)**. Keep the database password to yourself.
2. **SQL Editor** → paste and run `01_suvai.sql`, then `02_roots.sql`. Each runs as one transaction:
   if it fails, nothing is created. Send the error text to Claude.
3. **Project Settings → API → Exposed schemas** → add `roots` and save.
4. **Authentication → Users → Add user** with your own email (tick *Auto Confirm User*), then run
   `03_first_owner.sql` with your email filled in.
5. **Authentication → Providers → Email**: turn **off** "Allow new users to sign up"
   (accounts are only created by Admin approval).
6. Send Claude the **Project URL** and the **anon / public key** (Project Settings → API).
   Never send the `service_role` key.
7. Deploying the server function needs the Supabase CLI; Claude will walk through it when the app is connected.
   The function receives the service_role key from Supabase automatically, so you never paste it anywhere.

## Known limits (deliberate, pending approval)
- The Roots 5-minute SMS code is not checked by the server yet; that needs an SMS provider.
- Mannin Roots is a separate schema in the same project. A fully separate database would be a second
  free project; say if you want that.
