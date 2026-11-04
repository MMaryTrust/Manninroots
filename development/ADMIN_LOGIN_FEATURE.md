# Admin-Only Login Feature Implementation

## Overview
Implemented a role-based access control system where only **admin** and **owner** roles can log in and access both Mannin Suvai (dashboard) and Mannin Roots (order management) applications.

## Changes Made

### 1. API Authentication (`development/api/src/routes/auth.js`)
**Added admin role enforcement in the `/login` endpoint:**
- Added role validation after password verification
- Only allows users with `owner` or `admin` roles
- Returns 403 error with message "Only administrators can access this application" for non-admin users
- Maintains all other auth functionality (JWT token, cookie, audit logging)

```javascript
const ADMIN_ROLES = ['owner', 'admin'];
if (!ADMIN_ROLES.includes(u.role)) {
  return reply.code(403).send({ error: 'Only administrators can access this application' });
}
```

### 2. Frontend Authentication Guard (`development/web/src/App.jsx`)
**Created `AdminOnly` component:**
- Works like `RequireAuth` but also validates user role
- Checks if user has 'admin' or 'owner' role
- Shows "Access Denied" message for non-admin authenticated users
- Redirects to sign-in for unauthenticated users

```javascript
function AdminOnly({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <p className="wrap sec">Loading…</p>;
  if (!user) return <Navigate to="/signin" state={{ from: loc.pathname }} replace />;
  const ADMIN_ROLES = ['owner', 'admin'];
  if (!ADMIN_ROLES.includes(user.role)) {
    return <div className="wrap sec">
      <h1 className="serif">Access Denied</h1>
      <p>Only administrators can access this area.</p>
      <Link className="btn" to="/">Home</Link>
    </div>;
  }
  return children;
}
```

### 3. Route Protection (`development/web/src/App.jsx`)
**Updated all protected routes to use `AdminOnly`:**
- `/roots` - Mannin Roots catalog and ordering (admin-only)
- `/roots/orders` - View order history (admin-only)
- `/app/*` - Staff dashboard including order queue (admin-only)

Before:
```javascript
<Route path="/roots" element={<Roots />} />
<Route path="/app/*" element={<RequireAuth><Staff /></RequireAuth>} />
```

After:
```javascript
<Route path="/roots" element={<AdminOnly><Roots /></AdminOnly>} />
<Route path="/app/*" element={<AdminOnly><Staff /></AdminOnly>} />
```

### 4. Sign-In Page UI (`development/web/src/pages/SignIn.jsx`)
**Added admin-only notice:**
- Displays message "Admin access only. Please sign in with your administrator account."
- Guides users that only administrators can log in

### 5. Environment Configuration
**Created `.env` file for API:**
```
JWT_SECRET=your-secret-key-change-in-production-12345
SEED_PASSWORD=test_password_123
WEB_ORIGIN=http://localhost:5174
PORT=3001
DEV_SEED=1
```

**Updated `package.json` scripts:**
- All npm scripts now use `--env-file=.env` flag
- Ensures environment variables are loaded properly

## Access Rules Summary

| Role | Public Pages | Roots | Staff App |
|------|--------------|-------|-----------|
| Admin | ✅ | ✅ | ✅ |
| Owner | ✅ | ✅ | ✅ |
| Doctor | ✅ | ❌ | ❌ |
| Manager | ✅ | ❌ | ❌ |
| Kitchen | ✅ | ❌ | ❌ |
| Rider | ✅ | ❌ | ❌ |
| Customer | ✅ | ❌ | ❌ |

## Demo Credentials

The system uses the seeded test users. Only these can log in:
- **Admin:** `admin@mannin.test` (password: `test_password_123`)
- **Owner:** `owner@mannin.test` (password: `test_password_123`)

Other users (doctor, kitchen, rider, customer, etc.) will receive an error: "Only administrators can access this application"

## Testing Instructions

### 1. Manual Testing
1. Start the API server: `cd development/api && npm run dev`
2. Start the web app: `cd development/web && npm run dev`
3. Visit `http://localhost:5174`
4. Try accessing `/roots` or `/app` → redirects to sign-in
5. Sign in as `admin@mannin.test` with password `test_password_123`
6. After sign-in, can access Roots and Staff dashboard
7. Try signing in as `customer@mannin.test` → get error "Only administrators can access this application"

### 2. Automated Testing
Run the smoke tests:
```bash
cd development/web
SEED_PASSWORD=test_password_123 node tests/smoke.mjs
```

Run API tests:
```bash
cd development/api
npm test
```

## Security Features

1. **Server-side enforcement:** Role check happens on API login before issuing JWT
2. **Client-side protection:** Frontend guards prevent unauthorized route access
3. **Multiple layers:** Both API and frontend validate admin role
4. **Audit logging:** All login attempts logged in audit_log table
5. **Clear error messages:** Users understand why they can't log in
6. **Status check:** Account status must be 'active' (existing feature)

## Public Pages Still Accessible

The following pages remain public (no login required):
- `/` - Home page
- `/plans` - Plan details
- `/menu` - Menu items
- `/signin` - Login page

These pages are shown in the PublicShell, which includes navigation and footer.

## Database User Roles

The system supports these roles defined in the schema:
- `owner` - Full system access, finance admin (admin-only)
- `admin` - System administrator (admin-only)
- `doctorAdmin` - Doctor administrator (cannot log in)
- `doctor` - Healthcare provider (cannot log in)
- `manager` - Operations manager (cannot log in)
- `kitchen` - Kitchen staff (cannot log in)
- `rider` - Delivery rider (cannot log in)
- `customer` - Customer/end user (cannot log in)

Only `owner` and `admin` roles can log in.

## Future Enhancements

1. Role-based feature access within admin dashboard
2. Different admin levels (e.g., doctorAdmin for doctor features)
3. Password reset and management features
4. Multi-factor authentication (MFA)
5. Session timeout and security controls
6. Admin user management interface for creating/editing users
