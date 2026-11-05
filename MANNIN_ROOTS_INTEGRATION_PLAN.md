# Mannin Roots Feature Integration Plan

## 📋 Overview
Integrate the beautiful Lovable Mannin Roots customer experience into our current development/web app **WITHOUT** modifying existing admin features (Dashboard, Menu, Appointments).

**Current Status:** Admin dashboard works perfectly ✅  
**Goal:** Add customer-facing Mannin Roots features using Lovable's design

---

## 🎯 Features to Implement (from Lovable Codebase)

### **Pages:**
1. **Home Page** (`/roots/home`)
   - Category showcase (Dosai, Biryani, Meals, Parotta, Curry, Sweets)
   - Top kitchens near you
   - Popular dishes
   - Search box
   - Location-based delivery

2. **Search Page** (`/roots/search`)
   - Search by category or keywords
   - Filter by kitchen/restaurant
   - Browse dishes with prices and ratings

3. **Restaurant/Kitchen Page** (`/roots/r/:slug`)
   - Restaurant details
   - Menu items
   - Ratings and reviews
   - Prep time and delivery info

4. **Dish Detail Page** (`/roots/dish/:id`)
   - Full dish details
   - Ingredients and allergens
   - Reviews and ratings
   - Add to cart with quantity

5. **Cart Page** (`/roots/cart`)
   - Review items from multiple kitchens
   - Edit quantities
   - View pricing and fees
   - Checkout form

6. **Orders Page** (`/roots/orders`)
   - Order history
   - Order status tracking
   - Delivery estimates

7. **Account Page** (`/roots/account`)
   - User profile
   - Saved addresses
   - Payment methods
   - Order preferences

---

## 🏗️ Architecture

### **Multi-Language Support (Built-in)**
- English (en)
- Tamil (ta) ✨
- Telugu (te)
- Hindi (hi)
- Kannada (kn)
- Malayalam (ml)

### **Key Components (from Lovable)**
```
✅ AppShell - Main layout with header + bottom nav + cart bar
✅ Logo - Multi-language logo variants
✅ LanguageToggle - Language switcher
✅ BottomNav - Mobile navigation (Home, Search, Orders, Account)
✅ CartBar - Floating cart summary bar
✅ DishCard - Dish display card with add to cart
✅ RestaurantChip - Kitchen/restaurant selector
✅ SearchBox - Search functionality
```

### **Libraries to Add**
```json
{
  "@tanstack/react-start": "Full-stack React",
  "tailwindcss": "v4 - styling",
  "shadcn/ui (radix)": "UI components",
  "@tanstack/react-query": "Data fetching",
  "react-hook-form": "Form handling",
  "zod": "Validation",
  "lucide-react": "Icons",
  "sonner": "Toast notifications"
}
```

---

## 📁 Integration Steps

### **Step 1: Setup Routes Structure**
Create new route group `/roots/` in development/web:
```
src/pages/roots/
├── home.tsx         (Home with categories & top kitchens)
├── search.tsx       (Search & filter)
├── dish-[id].tsx    (Dish detail)
├── restaurant-[slug].tsx (Restaurant)
├── cart.tsx         (Shopping cart)
├── orders.tsx       (Order history)
└── account.tsx      (User profile)
```

### **Step 2: Import Lovable Components**
Extract and import from Lovable codebase:
```
src/components/roots/
├── app-shell.tsx
├── bottom-nav.tsx
├── cart-bar.tsx
├── dish-card.tsx
├── language-toggle.tsx
├── logo.tsx
├── restaurant-chip.tsx
└── search-box.tsx
```

### **Step 3: Integrate with Our API**
Connect to existing endpoints:
- `GET /api/menu` - Fetch dishes
- `POST /api/roots/orders` - Create orders
- `GET /api/roots/orders` - Fetch orders
- `PATCH /api/roots/orders/:id/advance` - Update status

### **Step 4: Add Data & Utilities**
Lovable utilities to integrate:
```
src/lib/
├── cart.ts          (useCart hook - localStorage + state)
├── i18n.ts          (useI18n hook - multi-language)
├── data.ts          (Dish/Restaurant data fetching)
├── location.ts      (Location detection)
├── translations.ts  (Language strings)
└── lang-detect.ts   (Auto-detect language)
```

### **Step 5: Styling**
Apply Lovable's Tailwind + Radix design:
- Use existing color tokens from our styles.css
- Add new components from shadcn/ui
- Maintain mobile-first responsive design

---

## ✅ What Stays Unchanged

**Admin Features (100% intact):**
- ✅ Admin Login & Authentication
- ✅ Dashboard (KPI metrics)
- ✅ Menu & Meals Management
- ✅ Appointments Scheduling
- ✅ Roots Orders Management (Staff view)
- ✅ All API endpoints
- ✅ Database schema

**Navigation:**
- Keep sidebar for admin
- Separate `/roots/` routes for customer experience
- Login determines which view (admin vs customer)

---

## 🎨 Key Design Features

### **From Lovable:**
```
✨ Bottom navigation (mobile-first)
✨ Floating cart bar
✨ Multi-language logos and text
✨ Category showcase with images
✨ Top kitchens carousel
✨ Dish cards with ratings
✨ Location-based delivery
✨ Toast notifications for actions
✨ Responsive mobile design
```

### **Color Scheme (Our existing):**
- Primary: Forest Green (#1B4A44)
- Accent: Warm Gold (#AD7C2A)
- Clay: Earth Orange (#B8573A)
- Maintains consistency with admin design

---

## 📊 Implementation Timeline

**Phase 1: Foundation (2-3 hours)**
- [ ] Setup route structure
- [ ] Extract components from Lovable
- [ ] Add required dependencies
- [ ] Setup data fetching utilities

**Phase 2: Pages (3-4 hours)**
- [ ] Home page with categories
- [ ] Search page
- [ ] Dish detail page
- [ ] Restaurant page

**Phase 3: Shopping (2-3 hours)**
- [ ] Cart functionality
- [ ] Checkout flow
- [ ] Order confirmation

**Phase 4: Account (1-2 hours)**
- [ ] Order history page
- [ ] Account settings
- [ ] Saved addresses

**Phase 5: Integration (1-2 hours)**
- [ ] Connect to our API
- [ ] Test order flow end-to-end
- [ ] Deploy and verify

---

## 🚀 Expected Outcome

**Customer Experience (Mannin Roots):**
1. User visits `/roots`
2. Sees home page with categories and popular dishes
3. Searches or browses restaurants
4. Adds items to cart (max 3 restaurants)
5. Checkout with phone number
6. Order placed via our API
7. Track order status

**Admin Experience (Unchanged):**
1. User visits `/app` (admin dashboard)
2. Full access to Dashboard, Menu, Appointments, Orders
3. Manage orders, customers, staff
4. Everything works as-is ✅

---

## 📦 Deliverables

✅ Complete Mannin Roots customer experience  
✅ Multi-language support (Tamil + 5 others)  
✅ Shopping cart & checkout  
✅ Order tracking  
✅ Beautiful Lovable design  
✅ All integrated with our backend API  
✅ Admin features completely preserved  

---

## 🔗 Integration Points

**API Connections:**
```
GET /api/menu
  └─> Fetch all dishes for home/search

GET /api/roots/catalog
  └─> Get restaurants & organized dishes

POST /api/roots/orders
  └─> Create new order

GET /api/roots/orders
  └─> Customer's order history

PATCH /api/roots/orders/:id/advance
  └─> Update order status (admin only)
```

---

## ✨ Ready to Implement?

This plan:
- ✅ Preserves all existing admin features
- ✅ Adds beautiful customer experience from Lovable
- ✅ Uses our existing backend (no changes needed)
- ✅ Implements multi-language support
- ✅ Maintains design consistency

**Next Step:** Extract and integrate components from Lovable codebase!
