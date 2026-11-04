# Mannin Suvai & Roots - Admin Setup Guide

## Quick Start

Your admin account has been created and is ready to use!

### Admin Login Credentials
```
Email:    admin@manninsuvai.com
Password: admin123
```

---

## Running the Application

### 1. Start the API Server
```bash
cd development/api
npm run dev
```
- Runs on: `http://localhost:3001`
- Uses in-memory PGlite database
- Auto-migrates schema on startup
- Auto-seeds demo data (enabled by DEV_SEED=1)

### 2. Start the Web App
```bash
cd development/web
npm run dev
```
- Runs on: `http://localhost:5174`
- Development server with hot reload
- Proxies `/api` to `http://localhost:3001`

### 3. Open in Browser
```
http://localhost:5174
```

---

## Accessing the Application

### Public Pages (No Login Required)
- **Home**: `/` - Welcome page with hero, plans overview
- **Plans**: `/plans` - Subscription plan details
- **Menu**: `/menu` - Dish menu listings
- **Sign In**: `/signin` - Admin login page

### Admin-Only Pages (Login Required)

#### 1. Mannin Roots (Order Management)
- **URL**: `http://localhost:5174/roots`
- **Access**: Admin & Owner only
- **Features**:
  - Kitchen selector
  - Browse restaurants and dishes
  - Add to cart (max 3 restaurants per cart)
  - Checkout with phone number
  - View order history at `/roots/orders`

#### 2. Staff Dashboard (Admin Area)
- **URL**: `http://localhost:5174/app`
- **Access**: Admin & Owner only
- **Features**:
  - Roots order queue
  - Order status tracking (New → Preparing → Out for delivery → Delivered)
  - Order advancement controls
  - Staff account management (in future stages)

---

## Login Flow

1. Navigate to **`http://localhost:5174/signin`**
2. Enter email: **`admin@manninsuvai.com`**
3. Enter password: **`admin123`**
4. Click "Sign in"
5. You'll be redirected to the dashboard or requested page

### What Happens on Login
- ✅ API validates email and password
- ✅ API checks that user role is 'admin' or 'owner'
- ✅ JWT token is issued and stored in httpOnly cookie
- ✅ Frontend stores user info in context
- ✅ You can now access `/roots`, `/app`, and `/roots/orders`

---

## Available Admin Users

### Production Admin Account (Created for You)
```
Name:     Mannin Admin
Email:    admin@manninsuvai.com
Password: admin123
Role:     Admin
```

### Demo/Test Admin Account
```
Name:     Kavitha Rajan
Email:    admin@mannin.test
Password: admin123
Role:     Admin
```

### Owner Account (Full Access)
```
Name:     Meenakshi Sundaram
Email:    owner@mannin.test
Password: admin123
Role:     Owner
```

---

## Features by Role

| Feature | Admin | Owner | Other Roles |
|---------|:-----:|:-----:|:-----------:|
| Mannin Roots Access | ✅ | ✅ | ❌ |
| Staff Dashboard | ✅ | ✅ | ❌ |
| View Orders | ✅ | ✅ | ❌ |
| Update Order Status | ✅ | ✅ | ❌ |
| Sign In to App | ✅ | ✅ | ❌ |
| Public Pages | ✅ | ✅ | ✅ |

**Other roles** (Doctor, Kitchen, Rider, Customer, Manager) cannot log in and will see:
```
"Only administrators can access this application"
```

---

## Database Configuration

### Current Setup (Development)
- **Database**: PGlite (in-memory)
- **Port**: Not applicable (in-process)
- **Data Persistence**: No (resets on server restart)
- **Configuration**: Automatic

### .env File Location
```
development/api/.env
```

### Environment Variables
```bash
JWT_SECRET=your-secret-key-change-in-production-12345
SEED_PASSWORD=admin123
WEB_ORIGIN=http://localhost:5174
PORT=3001
DEV_SEED=1
```

---

## Common Tasks

### Test Admin Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@manninsuvai.com","password":"admin123"}'
```

### Add a New Admin User
```bash
cd development/api
node --env-file=.env scripts/add-admin-user.js
```
Then edit the script to change the email and password.

### Verify API Health
```bash
curl http://localhost:3001/api/health
```

### View Seeded Data
Login as admin and check:
- **Plans**: 5 subscription plans
- **Dishes**: 10 menu items
- **Restaurants**: 6 restaurants with 3 dishes each
- **Demo Users**: 9 user accounts with different roles

---

## Testing the Full Feature

### Manual Test Scenario
1. ✅ Start both servers
2. ✅ Go to `http://localhost:5174`
3. ✅ Click "Sign in" 
4. ✅ Enter admin@manninsuvai.com / admin123
5. ✅ You should see the dashboard
6. ✅ Navigate to "Mannin Roots" link
7. ✅ Browse restaurants and dishes
8. ✅ Add items to cart
9. ✅ Proceed to checkout
10. ✅ View order in `/roots/orders`

### Automated Tests
```bash
# API tests (8 tests)
cd development/api
npm test

# Web smoke tests (12 checks)
cd development/web
SEED_PASSWORD=admin123 node tests/smoke.mjs
```

---

## Security Features

✅ **Server-side role enforcement** - Admin check happens on API before JWT issuance
✅ **Client-side protection** - Frontend guards prevent unauthorized route access
✅ **HTTPOnly cookies** - JWT token cannot be accessed via JavaScript (XSS protection)
✅ **CSRF protection** - SameSite=Lax cookie policy
✅ **Password hashing** - bcryptjs 10 rounds
✅ **Audit logging** - All login attempts recorded
✅ **Account status** - Suspended accounts cannot log in

---

## Troubleshooting

### API Server Won't Start
```bash
# Check if port 3001 is in use
lsof -i :3001
# Kill the process if needed
kill -9 <PID>
```

### Login Says "Email or password is incorrect"
- ✅ Verify email spelling: `admin@manninsuvai.com`
- ✅ Verify password: `admin123`
- ✅ Check database has seeded (check API logs)
- ✅ Restart API server to ensure fresh seed

### Can't Access /roots or /app
- Ensure you're logged in as admin/owner
- Check browser console for errors
- Verify JWT cookie is set: Developer Tools → Application → Cookies

### CORS Error
- Verify WEB_ORIGIN=http://localhost:5174 in .env
- Restart API server after changing .env

---

## Next Steps

### Stage 2 Features (Coming Soon)
- User registration and sign-up
- Payment token management
- Customer profile management
- Care member tracking
- Doctor consultations
- Appointment scheduling
- Kitchen prep sheets
- Delivery management
- Finance reporting
- Audit dashboard

### Production Deployment
Before going live:
1. ✅ Change JWT_SECRET to a strong random string
2. ✅ Set NODE_ENV=production
3. ✅ Use hosted PostgreSQL (not PGlite)
4. ✅ Set up HTTPS/SSL
5. ✅ Create admin users securely
6. ✅ Enable rate limiting
7. ✅ Set up monitoring and logging
8. ✅ Configure backups

---

## Support

For issues or questions:
- Check logs: `npm run dev` output
- Review ADMIN_LOGIN_FEATURE.md for technical details
- Check database with: `SELECT * FROM users;` (after connecting to database)

---

**Setup Date**: 2026-11-04
**Admin User**: admin@manninsuvai.com
**Status**: ✅ Ready to Use
