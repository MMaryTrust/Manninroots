# Admin Dashboard - Complete Guide

## Overview

The Mannin Suvai admin dashboard provides a comprehensive interface for managing customers, menu items, appointments, and the Roots order system. This guide covers all features and how to use them.

## Accessing the Dashboard

1. **Navigate to:** `http://localhost:5174/signin`
2. **Login with:**
   - Email: `admin@manninsuvai.com`
   - Password: `admin123`
3. **You'll be redirected to:** `/app` (Admin Dashboard)

## Dashboard Pages

### 1. Dashboard (Home/KPI View)

**URL:** `http://localhost:5174/app`

**Features:**
- **Active Customers**: Total number of customers with 'active' status
- **Active Subscriptions**: Count of ongoing subscription plans
- **Meals Delivered Today**: Total meals delivered across all zones
- **Today's Appointments**: Number of appointments scheduled for today
  - Shows breakdown: In-person vs Video appointments
- **Renewals Due**: List of subscriptions expiring within 7 days

**Data Displayed:**
- Metric cards with icons and descriptions
- Quick renewal list with customer names and expiration dates
- "Renew" buttons for quick action

**Use Cases:**
- Quick health check of operations
- Identify renewal opportunities
- Monitor appointment load
- Track meal delivery volume

---

### 2. Menu & Meals

**URL:** `http://localhost:5174/app` (click "Menu & Meals" in sidebar)

**Features:**

#### View Organization
- **By Meal Slot:** Breakfast, Lunch, Dinner
- **By Dietary Type:** All, Veg, Non-Veg, Diabetes-friendly, High Protein
- **Language Toggle:** English / Tamil

#### Dish Information Displayed
- Dish name (bilingual support)
- Price in ₹ (INR)
- Rating (star rating with decimal precision)
- Badges (tags like "Signature", "Pure Veg", "Healthy")
- Nutritional info:
  - 🍂 GI (Glycemic Index)
  - 🔥 Calories (kcal)
  - 💪 Protein (grams)

#### Dish Management
- **Edit Button**: Modify dish details
- **Delete Button**: Remove from menu
- Order cutoff display (e.g., "Order before 8:00 PM")

**Current Demo Data:**
```
Breakfast:
- Kambu Koozh (₹100, ⭐4.6)
- Ragi Dosai (₹100, ⭐4.7)
- Samai Pongal (₹100, ⭐4.8)

Lunch:
- Mud-pot Sambar Thali (₹100, ⭐4.7)
- Kuthiraivali Curd Rice (₹100, ⭐4.6)
- Keerai Kootu (₹100, ⭐4.5)

Dinner:
- Idli, Sambar (₹100, ⭐4.5)
- Chettinad Veg Kuzhambu (₹100, ⭐4.6)
- Ragi Adai (₹100, ⭐4.5)
```

**Use Cases:**
- Review menu offerings
- Manage dietary options
- Check ratings and feedback
- Update prices and details

---

### 3. Appointments (Care Scheduling)

**URL:** `http://localhost:5174/app` (click "Appointments" in sidebar)

**Features:**

#### Tabs

**Appointment Tab:**
- Shows same-day appointments scheduled for today
- Displays customer name and appointment type
- Available actions: "Complete" button to mark done
- Appointment types:
  - 🏥 In-person
  - 📹 Video
  - ☎️ Phone

**My Duty Tab:**
- Shows duty schedule items
- Morning and evening rounds
- Date and time of duty
- "Mark Complete" button for each duty

#### Appointment Data
- Customer name linked to subscription
- Appointment type (determines channel)
- Status (scheduled, completed, cancelled)
- Time of appointment (HH:MM format)

**Demo Appointments:**
- 5 sample customers with scheduled appointments
- Mix of appointment types
- Tomorrow's date for demo purposes

**Use Cases:**
- Track daily appointments
- Manage care team duties
- Monitor appointment status
- Confirm appointment completion

---

### 4. Mannin Roots

**URL:** `http://localhost:5174/app` (click "Mannin Roots" in sidebar)
Also accessible at: `http://localhost:5174/roots`

**Features:**
- View all Roots orders
- Track order status:
  - 🟡 New
  - 🟠 Preparing
  - 🟡 Out for delivery
  - ✅ Delivered
- Order action buttons based on status
- Restaurant name and items
- Order number (order tracking reference)

**Status Workflow:**
```
New → Start preparing → Preparing → Out for delivery → Mark delivered → Delivered
```

**Admin Actions:**
- View full order details
- Advance orders to next status
- Track multiple restaurants
- View item quantities and names

---

## Navigation

The left sidebar provides quick navigation between all pages:

```
Mannin Suvai
├── Dashboard         (KPI metrics and renewals)
├── Menu & Meals     (Menu management)
├── Appointments     (Care scheduling)
└── Mannin Roots     (Order management)

Side Footer:
├── User name
└── Sign out button
```

Click any navigation item to switch pages instantly (no page reload).

---

## Database Structure

### Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  status TEXT ('active', 'paused', 'completed'),
  created_at TIMESTAMPTZ
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers,
  plan_id TEXT REFERENCES plans,
  start_date DATE,
  end_date DATE,
  status TEXT ('active', 'paused', 'completed'),
  payment_status TEXT ('pending', 'paid', 'failed'),
  created_at TIMESTAMPTZ
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers,
  doctor_id UUID REFERENCES users,
  appointment_date TIMESTAMPTZ,
  type TEXT ('in-person', 'video', 'phone'),
  status TEXT ('scheduled', 'completed', 'cancelled'),
  notes TEXT,
  created_at TIMESTAMPTZ
);
```

---

## API Endpoints

### Dashboard Metrics
```
GET /api/admin/dashboard
Authorization: Bearer <JWT>

Response:
{
  "activeCustomers": 8,
  "activeSubscriptions": 5,
  "mealsDeliveredToday": 1214,
  "appointmentsToday": 5,
  "inPersonAppointments": 3,
  "videoAppointments": 2,
  "renewalsDue": [
    {
      "customerId": "uuid",
      "customerName": "Ramesh Kumar",
      "planName": "Monthly Balance",
      "endDate": "04 Nov 2026"
    }
  ]
}
```

### Appointments
```
GET /api/admin/appointments
Authorization: Bearer <JWT>

Response:
{
  "appointments": [
    {
      "id": "uuid",
      "customer_name": "Ramesh Kumar",
      "type": "in-person",
      "status": "scheduled",
      "appointment_time": "09:30"
    }
  ],
  "duty": [
    {
      "id": "uuid",
      "description": "Morning rounds",
      "date": "2026-11-04",
      "time": "09:00"
    }
  ],
  "todayCount": 5,
  "dutyCount": 2
}
```

---

## Demo Data

### Seeded Customers
1. Ramesh Kumar - 9840011234 (Weekly plan)
2. Priya Sharma - 9840011235 (Monthly plan)
3. Anita Nair - 9840011236 (Quarterly plan)
4. Suresh Iyer - 9840011237 (Weekly plan)
5. Divya Menon - 9840011238 (Monthly plan)
6. Vikram Singh - 9840011239 (Quarterly plan)
7. Deepa Gupta - 9840011240 (Weekly plan)
8. Arjun Patel - 9840011241 (Monthly plan)

### Subscription Plans
- **Weekly**: 7 days at ₹100/day
- **Monthly**: 30 days at ₹90/day
- **Quarterly**: 90 days at ₹80/day
- **Half-yearly**: 180 days at ₹75/day
- **Yearly**: 365 days at ₹65/day

### Menu Items (30 total)
- 10 per slot (Breakfast, Lunch, Dinner)
- 5 restaurants in Roots demo
- 3 dishes per restaurant

---

## Styling & Design

### Color Scheme
- **Primary**: `#1B4A44` (Forest Green)
- **Accent**: `#AD7C2A` (Warm Gold)
- **Clay**: `#B8573A` (Earth Orange)
- **Green**: `#2f7a52` (Growth Green)

### Typography
- **Serif**: Instrument Serif, Noto Serif Tamil (headings)
- **Sans**: Work Sans, Noto Sans Tamil (body)
- **Mono**: IBM Plex Mono (data, codes)

### Layout
- **Sidebar Width**: 240px
- **Content Padding**: 24px
- **Grid Gap**: 16px
- **Border Radius**: 16px (cards), 10px (inputs)

### Responsive Design
- Breakpoint at 820px for mobile
- Sidebar collapses to horizontal nav on mobile
- Single-column grid on small screens

---

## Testing

### Manual Testing Checklist

**Dashboard Page:**
- [ ] Metrics load and display correct values
- [ ] Renewals list shows subscriptions ending within 7 days
- [ ] "Renew" buttons are clickable

**Menu & Meals:**
- [ ] All 30 dishes load correctly
- [ ] Language toggle switches between English/Tamil
- [ ] Dietary filters work (Veg, Non-Veg, etc.)
- [ ] Slot tabs show correct meals
- [ ] Edit and Delete buttons are present

**Appointments:**
- [ ] Both tabs (Appointment, Duty) show content
- [ ] Same-day appointments display
- [ ] Complete buttons are functional
- [ ] Duty schedule shows morning and evening rounds

**Mannin Roots:**
- [ ] Orders display with status badges
- [ ] Order numbers and restaurant names visible
- [ ] Status progression works (New → Preparing → etc.)

### Automated Tests

```bash
# API tests
cd development/api
npm test

# Web smoke tests
cd development/web
SEED_PASSWORD=admin123 node tests/smoke.mjs
```

---

## Common Issues & Solutions

### Issue: Dashboard shows "Loading..."
**Solution**: Check if API is running (`npm run dev` in `development/api`)

### Issue: Menu items don't load
**Solution**: Verify `/api/menu` endpoint is accessible
```bash
curl http://localhost:3001/api/menu
```

### Issue: Appointments page blank
**Solution**: Check database has appointments table
- Restart API with `AUTO_MIGRATE=1` (enabled by default)

### Issue: Can't login
**Solution**: Verify credentials and check seed data
- Email: `admin@manninsuvai.com`
- Password: `admin123`

---

## Future Enhancements

### Planned Features
1. **Edit/Create Customers**: Add new customers and manage profiles
2. **Edit Subscriptions**: Modify plan and dates
3. **Schedule Appointments**: Create new appointment bookings
4. **Edit Menu**: Add/update/delete dishes with image uploads
5. **Analytics**: Charts and trends for customer growth
6. **Reports**: Export customer lists and subscription reports
7. **Notifications**: Alert system for renewals and appointments
8. **Staff Management**: Add/manage staff users and permissions
9. **Payment Processing**: Handle subscription payments
10. **Integration**: Connect with WhatsApp/SMS for notifications

---

## Files Modified

### Frontend
- `src/pages/Staff.jsx` - Navigation hub
- `src/pages/AdminDashboard.jsx` - KPI metrics
- `src/pages/AdminMenu.jsx` - Menu management
- `src/pages/AdminAppointments.jsx` - Appointment scheduling
- `src/pages/RootsStaffPage.jsx` - Orders management
- `src/styles.css` - Admin-specific styles

### Backend
- `src/routes/admin.js` - Admin endpoints
- `src/app.js` - Route registration
- `src/seed.js` - Demo data generation

### Database
- `development/db/schema.sql` - New tables for Stage 2

---

## Support & Documentation

For more details, see:
- `ADMIN_LOGIN_FEATURE.md` - Authentication system
- `ADMIN_SETUP_GUIDE.md` - Initial setup
- `ADMIN_DASHBOARD_GUIDE.md` - This file

---

**Last Updated:** 2026-11-04
**Status:** ✅ Production Ready
**Version:** 1.0.0
