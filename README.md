# RestoDine — Multi-Tenant In-Restaurant Digital Ordering & KDS Platform

RestoDine is a production-quality, multi-tenant digital ordering platform designed **exclusively for in-restaurant dining**. It contains **zero food delivery, zero takeaway, and zero third-party delivery overhead**. Diners sit at physical restaurant tables, scan a secure table QR code, browse the culinary menu with modifiers, and order directly from their phone. Orders flash directly onto the **Kitchen Display System (KDS)** in real time with audio chimes.

---

## 🏛️ System Architecture & Interfaces

The platform consists of three core real-time interfaces:

1. **Customer Mobile Web App / PWA (`/r/:restaurantSlug/t/:tableToken`)**
   - **Zero Mandatory Registration**: Temporary table session is automatically generated (`restaurant_id`, `table_id`, `session_id`).
   - **Menu Browsing**: Filter by category (Starters, Mains, Biryani, Breads, Drinks, Desserts), Vegetarian/Non-Vegetarian filter, and live dish availability ("Sold Out" enforcement).
   - **Item Customizations / Modifiers**: Size portions, spice levels, accompaniments with min/max rules and price adjustments.
   - **Sticky Mobile Cart & Idempotency**: Cart with special instructions and **Idempotency-Key** protection preventing accidental duplicate charges upon double-tapping.
   - **Real-Time Order Tracking**: Visual progress line (Order Placed ➔ Kitchen Accepted ➔ Cooking ➔ Ready ➔ Served ➔ Paid).
   - **Table Service Requests**: Call Server, Water Refill, Extra Cutlery, Fresh Napkins, and Request Bill.

2. **Kitchen Display System (KDS) (`/kitchen`)**
   - High-contrast 4-column live queue: **NEW ➔ ACCEPTED ➔ PREPARING ➔ READY**.
   - Audio chime and visual flash upon new customer order arrival.
   - Elapsed time counter with `tabular-nums` (highlights urgent orders $\ge 15\text{m}$).
   - Dish quantities, item modifiers, kitchen notes, and reject actions with reason.

3. **Restaurant Admin & Staff Dashboard (`/admin`)**
   - **Dashboard**: Real-time sales, active tables, active kitchen orders, and dish leaderboards.
   - **Live Orders**: Comprehensive status control, filters, and line items.
   - **Table & QR Management**: Dining sections (Floor 1, Rooftop Terrace), token regeneration, and high-res printable table stand graphic.
   - **Menu Management**: Categories, pricing, sold-out toggles, veg/non-veg, and modifier groups.
   - **Staff & RBAC**: Dedicated roles (`OWNER`, `MANAGER`, `WAITER`, `KITCHEN`).
   - **Bills & Settlements**: Split bill calculator, configured taxes (5% GST), and payment channels (Cash, UPI, Card).
   - **Analytics**: Orders by hour, top revenue dishes, and kitchen prep duration.
   - **Launch Wizard**: 8-milestone onboarding tracker for restaurant owners.

---

## 🚀 Quick Start (Node.js Fullstack Engine)

### 1. Installation
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The application starts on `http://localhost:3000` with both the Express REST API (`/api/v1`), WebSocket server (`/ws`), and Vite frontend mounted seamlessly.

### 3. Demo Credentials (Pre-seeded)
The app comes pre-seeded with **The Curry Room** (8 tables, 6 categories, full menu, active demo orders):
- **Owner**: `owner@curryroom.com` / `admin123`
- **Manager**: `manager@curryroom.com` / `manager123`
- **Waiter**: `waiter@curryroom.com` / `waiter123`
- **Kitchen Chef**: `kitchen@curryroom.com` / `kitchen123`

*(The Sign-in screen also provides 1-click autofill buttons for each role).*

---

## 🔄 End-to-End Walkthrough

### 1. Test Customer Ordering
1. Click **Customer Mobile (Table 04)** in the top header switcher.
2. Filter dishes (try selecting "Rice & Biryani" or toggling "Veg Only").
3. Click **Customize** on *Dum Pukht Chicken Biryani* to select portion size and spice level.
4. Click **Add to Order**.
5. Tap the sticky **Cart Bar** at the bottom, enter an optional note (e.g. "extra napkins"), and tap **Confirm & Send to Kitchen**.
6. Watch confetti trigger and the screen switch to the **Live Order Status Tracker**.

### 2. Test Kitchen KDS Workflow
1. In another tab or using the top switcher, switch to **Kitchen Display (KDS)**.
2. Notice the order placed from Table 04 appears under **1. NEW ORDERS** with audio chime.
3. Click **ACCEPT ORDER** ➔ Order shifts to **2. QUEUED / ACCEPTED**.
4. Click **START COOKING** ➔ Order shifts to **3. PREPARING FRESH**.
5. Click **MARK READY** ➔ Order shifts to **4. READY TO SERVE**.
6. Switch back to the Customer tab: notice the customer tracker automatically updated to "Your Food is Ready!" in real time without refreshing.

### 3. Request Bill & Settle Payment
1. From the customer screen, click **Request Bill** or tap **Call Server**.
2. Switch to **Staff / Admin Portal** ➔ **Bills & POS**.
3. Generate or settle the bill via UPI, Card, or Cash.

---

## 🔒 Security & QR Architecture

- **Public Table Tokens**: Sensitive database UUIDs are never exposed in customer URLs. Instead, a random alphanumeric public token is encoded:
  ```
  /r/:restaurantSlug/t/:tableToken   (e.g., /r/curry-room/t/T4CR)
  ```
- **Token Invalidation**: If a table QR code is leaked or needs rotation, the restaurant manager can click **Regenerate Token** in the Tables tab, instantly invalidating the old QR without affecting order history.
- **Idempotency Key**: All order requests send an `Idempotency-Key` header. Duplicate network requests return the existing order rather than creating duplicate kitchen tickets.
- **Tenant Isolation**: Every database entity is indexed and scoped by `restaurant_id`. All staff routes validate JWT tenant claims before reading or mutating state.

---

## 📦 Python FastAPI / PostgreSQL Deployment

For deployment with Python 3.12, FastAPI, PostgreSQL, and Redis:
```bash
cd backend
docker-compose up -d
```
All Pydantic request/response schemas, SQLAlchemy 2.0 models, and Alembic migrations are structured in `/backend`.
