# Electica BSS - Complete Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Admin Dashboard (src/)](#admin-dashboard)
7. [Provider App (provider-app/)](#provider-app)
8. [User App (user-app/)](#user-app)
9. [Design System](#design-system)
10. [Key Business Flows](#key-business-flows)
11. [Environment Configuration](#environment-configuration)
12. [Build & Deployment](#build--deployment)
13. [AWS EC2 Deployment Guide](#aws-ec2-deployment-guide)
14. [Local Development Setup](#local-development-setup)
15. [Future Update Guide](#future-update-guide)

---

## Project Overview

Electica BSS (Battery Swap Service) is a three-app ecosystem for managing electric vehicle battery swap operations:

- **Admin Dashboard** - Operations management portal for monitoring stations, batteries, users, revenue, and system health
- **Provider App** - Mobile-first app for field agents who onboard new customers and verify KYC
- **User App** - Mobile-first app for end customers to manage their battery, perform swaps, and view history

All three apps share a single REST API powered by json-server.

---

## Architecture

```
+-------------------+     +-------------------+     +-------------------+
|  Admin Dashboard  |     |   Provider App    |     |     User App      |
|   (Vite SPA)      |     |   (Vite SPA)      |     |   (Vite SPA)      |
|   Port: 5173      |     |   Port: 5174      |     |   Port: 5175      |
+--------+----------+     +--------+----------+     +--------+----------+
         |                         |                         |
         +------------+------------+------------+------------+
                      |
              +-------v--------+
              |   json-server  |
              |   Port: 3001   |
              |   (db.json)    |
              +----------------+
```

**Production (AWS EC2):**
```
                  +-------- nginx (port 80) ---------+
                  |                                   |
    /             |   /provider/      /app/     /api/ |
    |             |      |              |         |   |
  Admin           |   Provider       User     Proxy   |
  /var/www/       |   /var/www/      /var/www/  to    |
  electica/admin  |   electica/      electica/  :3001 |
                  |   provider       user              |
                  +-----------------------------------+
                  |      PM2 -> json-server :3001     |
                  +-----------------------------------+
```

---

## Tech Stack

| Component        | Technology                          |
|-----------------|--------------------------------------|
| Frontend        | Vanilla JavaScript (ES Modules)      |
| Bundler         | Vite 7.x                             |
| API Server      | json-server v1.0.0-beta.12           |
| Charts          | Chart.js 4.x                         |
| Maps            | Leaflet 1.9.4 (CDN)                  |
| Icons           | Google Material Symbols (CDN)        |
| Hosting         | AWS EC2 (Ubuntu 22.04)               |
| Web Server      | nginx                                |
| Process Manager | PM2                                  |
| Database        | db.json (flat-file JSON)             |

---

## Project Structure

```
BSS_AG/
├── src/                           # Admin Dashboard
│   ├── main.js                    # Entry point, hash-based router
│   ├── config.js                  # Environment-aware API base URL
│   ├── components/
│   │   ├── header.js              # Top bar, search, export, New Station modal
│   │   ├── sidebar.js             # Navigation sidebar
│   │   ├── revenueChart.js        # Chart.js revenue + concentric charts
│   │   ├── kpiCard.js             # Reusable KPI stat card
│   │   ├── stationCard.js         # Station card component
│   │   ├── batteryTable.js        # Battery table component
│   │   ├── podStatusGrid.js       # Pod status dot grid
│   │   └── icons.js               # SVG icon helpers
│   ├── pages/
│   │   ├── dashboard.js           # Main dashboard with 7 widgets + map + activity
│   │   ├── stations.js            # Station list with filters + KPI cards
│   │   ├── stationDetail.js       # Single station view with cabinet + chart + map
│   │   ├── inventory.js           # Battery inventory with search + filters
│   │   ├── batteryDetail.js       # Single battery detail page
│   │   ├── users.js               # User list with KYC filters
│   │   ├── userDetail.js          # User profile + KYC approve/reject
│   │   ├── revenue.js             # Revenue analytics with charts + heatmap
│   │   ├── settings.js            # System settings + data management (CRUD)
│   │   ├── support.js             # Support tickets page
│   │   ├── swapBattery.js         # Manual swap initiation
│   │   └── swapConfirmation.js    # Swap confirmation page
│   ├── services/
│   │   └── api.js                 # Central API helper (BASE URL from config)
│   ├── utils/
│   │   ├── router.js              # Hash-based SPA router
│   │   ├── chargingSimulator.js   # Background battery charge simulation
│   │   ├── helpers.js             # Date/format utilities
│   │   ├── csv.js                 # CSV export utility
│   │   └── toast.js               # Toast notification system
│   ├── styles/
│   │   ├── variables.css          # CSS custom properties (theme)
│   │   ├── layout.css             # Grid + page layout
│   │   └── components.css         # Component styles
│   └── data/
│       └── mock.js                # Fallback mock data
│
├── provider-app/                  # Provider (Field Agent) App
│   ├── src/
│   │   ├── main.js                # Entry point, overlay navigation
│   │   ├── config.js              # Environment-aware API base URL
│   │   ├── pages/
│   │   │   ├── home.js            # Customer list + stats + filters
│   │   │   ├── register.js        # 3-step onboarding wizard
│   │   │   ├── confirmation.js    # Registration success screen
│   │   │   ├── customerDetail.js  # Customer view + KYC approve/reject
│   │   │   └── resubmit.js        # Rejected KYC resubmission form
│   │   ├── utils/
│   │   │   └── api.js             # Helper functions (getUsers, createUser)
│   │   └── style.css              # Full provider app styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js             # Production base: /provider/
│
├── user-app/                      # User (Customer) App
│   ├── src/
│   │   ├── main.js                # Entry point, 5-tab navigation + auth
│   │   ├── config.js              # Environment-aware API base URL
│   │   ├── pages/
│   │   │   ├── auth.js            # Phone + OTP + registration flow
│   │   │   ├── home.js            # Battery gauge + stats + nearest station
│   │   │   ├── swap.js            # QR scanner + station select + swap flow
│   │   │   ├── history.js         # Swap timeline grouped by month
│   │   │   ├── stations.js        # Station list with pod grid
│   │   │   └── profile.js         # User profile + battery + KYC info
│   │   ├── utils/
│   │   │   └── helpers.js         # Shared utilities
│   │   └── style.css              # Full user app styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js             # Production base: /app/
│
├── deploy/                        # Deployment configs
│   ├── nginx.conf                 # nginx reverse proxy config
│   ├── ecosystem.config.js        # PM2 process config
│   └── setup.sh                   # EC2 initial setup script
│
├── db.json                        # JSON Server database
├── package.json                   # Root package.json with build scripts
├── index.html                     # Admin dashboard HTML entry
└── CHANGES.md                     # Changelog
```

---

## Database Schema

The `db.json` file contains 6 collections:

### stations (6 records)
```json
{
  "id": "BSS-001",
  "name": "Koramangala Hub",
  "location": "80 Feet Road, Koramangala",
  "status": "online",          // online | maintenance
  "pods": 8,
  "totalSwapsToday": 12,
  "totalSwapsMonth": 340,
  "revenueToday": 780,
  "revenueMonth": 22100,
  "uptime": 98.5,
  "lat": 12.9352,
  "lng": 77.6245
}
```

### batteries (45 records)
```json
{
  "id": "BAT-001",
  "stationId": "BSS-001",     // or null if deployed
  "status": "available",       // available | charging | deployed | stock | fault | retired
  "soc": 95,                   // State of Charge (0-100)
  "health": 98,
  "voltage": 51.2,
  "temperature": 32,
  "cycles": 120,
  "assignedTo": null,          // userId if deployed
  "lastSwap": "2025-01-15T10:30:00"
}
```

### users (27 records)
```json
{
  "id": "USR-001",
  "name": "Arjun Patel",
  "phone": "+91 98765 43210",
  "vehicleModel": "Ather 450X",
  "vehicleRegNo": "KA01AB1234",
  "kycStatus": "verified",     // verified | pending | rejected
  "aadhaar": "XXXX XXXX 1234",
  "pan": "ABCDE1234F",
  "batteryId": "BAT-010",
  "depositPaid": true,
  "onboardedAt": "2025-01-10T09:00:00",
  "rejectionReason": null,
  "registeredVia": "agent",    // agent | self
  "agentId": "AGT-001"
}
```

### swaps (102 records)
```json
{
  "id": "SWP-001",
  "userId": "USR-001",
  "stationId": "BSS-001",
  "batteryOut": "BAT-010",     // battery returned by user
  "batteryIn": "BAT-005",      // battery given to user
  "timestamp": "2025-01-15T10:30:00",
  "amount": 65,                // INR 65 per swap
  "type": "swap"               // swap | allocation
}
```

### transactions (92 records)
```json
{
  "id": "TXN-001",
  "userId": "USR-001",
  "type": "swap_fee",          // swap_fee | security_deposit
  "amount": 65,
  "timestamp": "2025-01-15T10:30:00",
  "description": "Battery swap at Koramangala Hub"
}
```

### tickets (0 records)
Support tickets and queries - initially empty.

---

## Admin Dashboard

### Pages

#### Dashboard (`src/pages/dashboard.js`)
The main operations overview with:
- **Greeting row** - time-based greeting, date, "Show Alerts" button
- **7 widget cards** in a responsive grid:
  - Total Stations (with online count badge)
  - Revenue Today (with mini bar chart)
  - System Uptime (dark card with circular progress ring)
  - Energy Dispensed (kWh with progress bar)
  - Active Batteries (with available/charging counts)
  - Swaps Today (with growth % gauge)
  - Total Pods Active (accent card)
- **Station Locations** - Leaflet map with station markers (color-coded by status)
- **Station Revenue** - Concentric doughnut chart + per-station revenue bars with hover sync. Shows decorative light-coral rings when revenue is zero
- **Activity Manager** - Real-time activity feed with filters:
  - Toggle filters: Swaps, Alerts, Verifications, Today Only
  - Shows recent swaps, maintenance alerts, KYC verifications

#### Stations (`src/pages/stations.js`)
- Filter chips: All / Operational / Maintenance + optional city filters
- 4 KPIs: Online Stations, Total Pods, Swaps Today, Revenue Today
- Station card grid with real-time pod status dots (green=available, amber=charging, red=fault, gray=empty)
- Click card to navigate to station detail

#### Station Detail (`src/pages/stationDetail.js`)
- Breadcrumb navigation
- Station header with status badge, ID, last sync time
- Action buttons: Remote Reboot, Maintenance Mode
- 3 KPIs: Revenue Today, Swaps Today, Energy Used
- Battery Cabinet grid (color-coded slots)
- Charger Monitoring (power consumption bar, energy dispensed, load factor)
- 7-day Revenue Trend bar chart with hover tooltips
- Station Location map (Leaflet)
- Recent Swaps transaction list

#### Inventory (`src/pages/inventory.js`)
- "Export CSV" button
- 6 KPIs: Total Batteries, With Customers, Available, Charging, In Stock, Fault/Retired
- Search bar + filter buttons (All/Deployed/Available/Charging/Stock/Fault)
- Battery table with: ID, Status badge, Location/User, SOC bar, Health %, Swaps, Cycles
- Click row to view battery detail

#### Battery Detail (`src/pages/batteryDetail.js`)
- Full battery specifications and metrics
- SOC and health gauges
- Assignment info (station or user)
- Swap history for this battery

#### Users (`src/pages/users.js`)
- 4 KPIs: Total Users, KYC Verified, Pending Review, Revenue Collected
- Search + KYC filter buttons (All/Verified/Pending/Rejected)
- User table: Avatar, Name/ID, Vehicle, Battery, Swaps, Spent, KYC status badge

#### User Detail (`src/pages/userDetail.js`)
- Profile header with avatar, name, KYC badge, phone, vehicle
- **KYC Approve** button: allocates stock battery, marks verified, creates INR 3000 deposit transaction
- **KYC Reject** button: prompts for reason, marks rejected
- Usage Summary: Total Swaps, Total Spent, Linked Battery, Onboarded date
- KYC Documents: Aadhaar/PAN display
- Swap History list
- Payment Summary card

#### Revenue (`src/pages/revenue.js`)
- 4 KPIs: Total Revenue, Swap Revenue, Deposit Revenue, Today
- Monthly Trend bar chart (stacked swap + deposit)
- Revenue Attribution doughnut chart (Swap % vs Deposit %)
- Top 5 Performing Stations list
- Swap Frequency Heatmap (4 weeks x 7 days, color intensity)
- Revenue Breakdown table (sortable by revenue)

#### Settings (`src/pages/settings.js`)
- Profile Settings (name, email, role)
- Notification Preferences (toggle switches)
- System Configuration (currency, timezone, refresh interval)
- Data Management with tabs:
  - **Stations**: Cards with pod/uptime, status toggle, edit/delete
  - **Batteries**: Filtered list, repair button (assign fault battery to station), delete
  - **Users**: List with KYC badge, delete
- Delete confirmation modal

### Components

#### Header (`src/components/header.js`)
- Dynamic page title
- Global search bar (searches station/battery IDs and user names)
- Context-aware Export button (CSV for current page)
- **New Station Modal** with:
  - Form: Station Name, State dropdown, City dropdown, Pod Count
  - Interactive Leaflet map (click to place pin, draggable marker)
  - State/City cascading dropdowns with `CITY_DATA` (10 states, 20+ cities)
  - Nominatim reverse geocoding (auto-fills address from pin location)
  - Works for both Create and Edit mode

#### Sidebar (`src/components/sidebar.js`)
- Navigation links: Dashboard, Stations, Revenue, Inventory, Users, Settings, Support
- Active state highlighting
- User avatar and name

#### Revenue Charts (`src/components/revenueChart.js`)
- `renderRevenueChart()` - 7-day bar chart with day labels
- `renderConcentricChart()` - Multi-ring doughnut showing per-station revenue
  - Hover interaction syncs with station list
  - Zero-state: shows decorative staggered rings in light coral tones

---

## Provider App

Mobile-first app for field agents (providers) who onboard customers.

### Navigation Pattern
- **Bottom nav** with 3 tabs: Home, Register (FAB), Profile
- **Overlay system**: `overlay = { type, data }` replaces current view
  - `detail` - Customer detail view
  - `confirm` - Registration success
  - `resubmit` - Rejected KYC resubmission

### Pages

#### Home (`provider-app/src/pages/home.js`)
- Agent greeting with time-based message
- KYC status breakdown: Total, Pending, Verified, Rejected
- Search + filter chips (All/Pending/Verified/Rejected)
- "New Requests" section for self-registered users needing physical verification
- Network overview stats
- Customer list with status indicators
- Click customer to open detail overlay

#### Register (`provider-app/src/pages/register.js`)
- **3-step wizard**:
  - Step 1: Personal Details (name, phone, vehicle model, registration number)
  - Step 2: KYC Documents (Aadhaar, PAN - auto-formatted with masks)
  - Step 3: Review all info and submit
- Creates new user with `kycStatus: "pending"`, `registeredVia: "agent"`
- Auto-formats: phone (+91 prefix), Aadhaar (XXXX XXXX pattern), PAN (uppercase)

#### Customer Detail (`provider-app/src/pages/customerDetail.js`)
- Full profile view with KYC status badge
- **Approval Sheet** (two-step modal):
  1. Upload payment proof (camera/gallery)
  2. Take customer photo
  3. Confirm approval
- **Approve flow**:
  - Finds available stock battery
  - PATCH user: `kycStatus: "verified"`, assigns `batteryId`, sets `depositPaid: true`
  - PATCH battery: `status: "deployed"`, `assignedTo: userId`
  - POST transaction: `type: "security_deposit"`, `amount: 3000`
  - POST swap: `type: "allocation"` record
- **Reject** button with reason capture
- **Resubmit** button for rejected users
- Battery details, KYC documents, swap history display

#### Confirmation (`provider-app/src/pages/confirmation.js`)
- Success screen after registration
- Shows customer ID, pending status
- "Register Another" or "Back to Dashboard" buttons

#### Resubmit (`provider-app/src/pages/resubmit.js`)
- Pre-filled form for rejected users to update KYC
- Shows rejection reason banner
- Editable: name, phone, vehicle, Aadhaar, PAN
- Resets status to pending on submit

### Agent Identity
Hard-coded in `main.js`:
```js
AGENT = { id: 'AGT-001', name: 'Ravi Mehta', zone: 'South Bangalore' }
```

---

## User App

Mobile-first app for end customers.

### Auth Flow
1. **Splash screen** (2.1s animation)
2. **Phone entry** (+91 prefix)
3. **OTP verification** (demo: any 6 digits accepted)
4. If user exists:
   - `verified` -> Main app
   - `pending` -> Pending approval screen with "Check Status" polling
   - `rejected` -> Rejected notice
5. If new user -> Registration form (name, phone, vehicle, Aadhaar, PAN)

### Navigation
- 5-tab bottom nav: Home, History, [Scan FAB], Stations, Profile
- Center scan button is elevated FAB

### Auth Storage
`localStorage` key: `electica_auth`
```json
{ "userId": "USR-001", "name": "Arjun Patel", "kycStatus": "verified" }
```

### Pages

#### Home (`user-app/src/pages/home.js`)
- Dark navy hero section with animated SVG battery gauge (270-degree arc)
- Battery SOC % display with animated fill
- Quick stats: Total Swaps, Total Spent
- Battery card: Health %, Cycles, Max Range
- Nearest Station with availability count and pod grid dots
- Recent Activity list
- "Scan QR to Swap" CTA button

#### Swap (`user-app/src/pages/swap.js`)
- QR scanner simulation (demo mode)
- Station selector dropdown with availability badges
- Swap confirmation sheet:
  - Battery flow: Old battery -> Station -> New battery
  - Battery health comparison
  - Payment: INR 65 swap fee
- **Swap processing**:
  - POST /swaps (new swap record)
  - PATCH old battery: `status: "charging"`, `stationId`, `assignedTo: null`
  - PATCH new battery: `status: "deployed"`, `assignedTo: userId`, `stationId: null`
  - PATCH user: `batteryId: newBatteryId`
- Success screen with transaction details

#### History (`user-app/src/pages/history.js`)
- Stats: Total Swaps, Total Spent, Avg Cost/Swap
- Timeline grouped by month
- Allocation cards (onboarding battery) and swap cards
- Shows battery in/out IDs, station names, amounts, timestamps

#### Stations (`user-app/src/pages/stations.js`)
- Station list sorted by: online status, availability, distance
- Pod grid visualization (green=available, amber=charging, red=fault, gray=empty)
- Status pills (online/offline/maintenance)
- Legend explaining pod colors
- Click card to open in Google Maps

#### Profile (`user-app/src/pages/profile.js`)
- Profile hero: name, phone, KYC badge, deposit status
- Vehicle details card
- Battery metrics card
- KYC documents display
- API connection check
- Logout with confirmation

---

## Design System

### Admin Dashboard
- **Primary color**: Coral `#D4654A`
- **Accent gradient**: `linear-gradient(145deg, #E8775C, #C4533A)`
- **Dark cards**: `#1a1a2e` background
- **Font**: System font stack
- Flex-row tables with consistent column layouts
- Toast notifications for actions

### Provider App
- **Primary**: Coral `#D4654A`
- **Hero gradient**: `linear-gradient(145deg, #D96A50, #9E3A2E)`
- **Success hero**: Green gradient
- Decorative pseudo-element circles on hero cards
- Key classes: `.hero-card`, `.customer-item`, `.badge`, `.btn-primary`, `.btn-ghost`, `.nav-fab`
- FAB register button elevated above nav bar

### User App
- **Primary**: Emerald green `#10b981`
- **Hero**: Dark navy `#0b1628` to `#1a2744`
- Animated SVG battery gauge (270-degree arc with CSS keyframe animation)
- Pod grid dots with color coding
- Bottom tab navigation with center FAB

---

## Key Business Flows

### 1. Customer Onboarding (Provider-side)

```
Provider registers customer (3-step form)
    -> User created with kycStatus: "pending"
    -> Provider reviews documents
    -> Provider approves:
        1. Find stock battery (status: "stock")
        2. PATCH user: kycStatus="verified", batteryId=BAT-XXX, depositPaid=true
        3. PATCH battery: status="deployed", assignedTo=USR-XXX
        4. POST transaction: type="security_deposit", amount=3000
        5. POST swap: type="allocation" (initial battery assignment)
    -> OR Provider rejects with reason
        -> Customer can resubmit updated KYC
```

### 2. Self-Registration (User-side)

```
User opens app -> Splash -> Enter phone
    -> New phone? -> Registration form -> User created (pending)
    -> Shows "Pending Approval" screen with Check Status polling
    -> Provider/Admin approves KYC (same flow as above)
    -> User refreshes -> Gets into main app
```

### 3. Battery Swap

```
User taps "Scan QR" -> Selects station -> Confirms swap
    -> System finds available battery at station
    -> POST /swaps: records the swap
    -> PATCH old battery: status="charging", back to station
    -> PATCH new battery: status="deployed", assigned to user
    -> PATCH user: batteryId = new battery
    -> Fee: INR 65 per swap
```

### 4. Admin KYC Approval

```
Admin goes to Users -> Clicks pending user -> User Detail page
    -> Click "Approve" -> Same flow as provider approval
    -> OR Click "Reject" -> Enter reason -> User marked rejected
```

### 5. Station Management

```
Admin clicks "+ New Station" in header
    -> Modal with form (Name, State, City, Pods)
    -> Interactive map: click to place pin, drag to adjust
    -> Nominatim reverse geocoding auto-fills address
    -> Submit: POST /stations with all fields
    -> Redirects to new station detail page

Edit station: Settings -> Stations tab -> Edit button -> Same modal (pre-filled)
Delete station: Settings -> Stations tab -> Delete -> Confirmation modal
```

---

## Environment Configuration

Each app has a `config.js` that auto-detects the environment:

```javascript
// src/config.js (same pattern in all 3 apps)
const isLocal = window.location.hostname === 'localhost'
             || window.location.hostname === '127.0.0.1';

export const API_BASE = isLocal
  ? 'http://localhost:3001'   // Local dev: direct to json-server
  : '/api';                    // Production: nginx proxies to json-server
```

All API calls across all 3 apps import `API_BASE` from their respective `config.js` and use it as the base URL for fetch requests. No hardcoded `localhost:3001` URLs exist in the codebase.

---

## Build & Deployment

### Package Scripts (root package.json)

```json
{
  "scripts": {
    "dev": "vite",                                          // Admin on :5173
    "dev:provider": "cd provider-app && npx vite --port 5174",
    "dev:user": "cd user-app && npx vite --port 5175",
    "api": "json-server --watch db.json --port 3001",
    "build": "vite build",                                  // Admin -> dist/
    "build:provider": "cd provider-app && npx vite build",  // -> provider-app/dist/
    "build:user": "cd user-app && npx vite build",          // -> user-app/dist/
    "build:all": "npm run build && npm run build:provider && npm run build:user",
    "preview": "vite preview"
  }
}
```

### Vite Configs

- **Admin** (`vite.config.js`): Not present (uses default base `/`)
- **Provider** (`provider-app/vite.config.js`): `base: '/provider/'` in production
- **User** (`user-app/vite.config.js`): `base: '/app/'` in production

### Build Output

```
npm run build:all
  -> dist/              (Admin Dashboard)
  -> provider-app/dist/ (Provider App)
  -> user-app/dist/     (User App)
```

---

## AWS EC2 Deployment Guide

### Server Details
- **EC2 Public IP**: `51.20.91.7`
- **OS**: Ubuntu 22.04 LTS
- **Key file**: `e-key.pem`

### Step 1 - Connect to Server

```bash
# Set key permissions (run once)
chmod 400 e-key.pem

# SSH with keep-alive to prevent disconnects
ssh -i e-key.pem -o ServerAliveInterval=60 -o ServerAliveCountMax=3 ubuntu@51.20.91.7
```

### Step 2 - Initial Server Setup (first time only)

Upload the setup script and run it:

```bash
# From your local machine (Git Bash):
scp -i e-key.pem deploy/setup.sh ubuntu@51.20.91.7:/tmp/
scp -i e-key.pem deploy/nginx.conf ubuntu@51.20.91.7:/tmp/electica-nginx.conf

# On the server:
chmod +x /tmp/setup.sh
/tmp/setup.sh
```

This installs: Node.js 20, nginx, PM2, and creates app directories.

### Step 3 - Build Locally

```bash
# On your local machine:
npm run build:all
```

### Step 4 - Upload Built Files

```bash
# From your local project directory (Git Bash):
scp -i e-key.pem -r dist/* ubuntu@51.20.91.7:/var/www/electica/admin/
scp -i e-key.pem -r provider-app/dist/* ubuntu@51.20.91.7:/var/www/electica/provider/
scp -i e-key.pem -r user-app/dist/* ubuntu@51.20.91.7:/var/www/electica/user/
scp -i e-key.pem db.json ubuntu@51.20.91.7:/var/www/electica/
scp -i e-key.pem deploy/ecosystem.config.js ubuntu@51.20.91.7:/var/www/electica/
```

### Step 5 - Start Services (first time)

```bash
# On the server:
cd /var/www/electica
npm init -y
npm install json-server@1.0.0-beta.12
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # Run the sudo command it outputs
```

### Step 6 - Verify

```
Admin Dashboard: http://51.20.91.7/
Provider App:    http://51.20.91.7/provider/
User App:        http://51.20.91.7/app/
```

### nginx Configuration (`deploy/nginx.conf`)

```nginx
server {
    listen 80;
    server_name _;

    # Admin Dashboard
    location / {
        root /var/www/electica/admin;
        try_files $uri $uri/ /index.html;
    }

    # Provider App
    location /provider/ {
        alias /var/www/electica/provider/;
        try_files $uri $uri/ /provider/index.html;
    }

    # User App
    location /app/ {
        alias /var/www/electica/user/;
        try_files $uri $uri/ /app/index.html;
    }

    # API Proxy to json-server
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;
}
```

### PM2 Configuration (`deploy/ecosystem.config.js`)

```javascript
module.exports = {
  apps: [{
    name: 'electica-api',
    script: 'npx',
    args: 'json-server db.json --port 3001 --host 0.0.0.0',
    cwd: '/var/www/electica',
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '200M',
  }],
};
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm

### Install Dependencies

```bash
# Root (Admin Dashboard + json-server)
npm install

# Provider App
cd provider-app && npm install && cd ..

# User App
cd user-app && npm install && cd ..
```

### Run All Services

Open 3 terminals:

```bash
# Terminal 1 - API Server
npx json-server db.json --port 3001

# Terminal 2 - Admin Dashboard
npm run dev
# Opens at http://localhost:5173

# Terminal 3 - Provider App
npm run dev:provider
# Opens at http://localhost:5174

# Terminal 4 - User App (optional)
npm run dev:user
# Opens at http://localhost:5175
```

### Quick Test Flow

1. Open Provider App (`:5174`) -> Register a new customer
2. Open Admin Dashboard (`:5173`) -> Users -> Approve the pending user
3. Open User App (`:5175`) -> Login with the customer's phone -> Perform a swap
4. Check Dashboard for updated stats

---

## Future Update Guide

When you make code changes and want to deploy:

### 1. Build locally

```bash
npm run build:all
```

### 2. Upload to server

```bash
# Upload Admin Dashboard
scp -i e-key.pem -r dist/* ubuntu@51.20.91.7:/var/www/electica/admin/

# Upload Provider App
scp -i e-key.pem -r provider-app/dist/* ubuntu@51.20.91.7:/var/www/electica/provider/

# Upload User App
scp -i e-key.pem -r user-app/dist/* ubuntu@51.20.91.7:/var/www/electica/user/
```

### 3. If you changed db.json structure

```bash
# Upload new database (WARNING: overwrites existing data)
scp -i e-key.pem db.json ubuntu@51.20.91.7:/var/www/electica/

# SSH in and restart the API
ssh -i e-key.pem -o ServerAliveInterval=60 ubuntu@51.20.91.7
pm2 restart electica-api
```

### 4. If you changed nginx config

```bash
scp -i e-key.pem deploy/nginx.conf ubuntu@51.20.91.7:/tmp/electica-nginx.conf
ssh -i e-key.pem -o ServerAliveInterval=60 ubuntu@51.20.91.7

# On server:
sudo cp /tmp/electica-nginx.conf /etc/nginx/sites-available/electica
sudo nginx -t && sudo systemctl reload nginx
```

### Useful Server Commands

```bash
# Check API status
pm2 list
pm2 logs electica-api

# Restart API
pm2 restart electica-api

# Check nginx status
sudo systemctl status nginx
sudo nginx -t

# View nginx error log
sudo tail -f /var/log/nginx/error.log
```

---

## Summary of Everything Built

| # | What was built | Key details |
|---|---------------|-------------|
| 1 | Admin Dashboard | 12 pages: Dashboard, Stations, Station Detail, Inventory, Battery Detail, Users, User Detail, Revenue, Settings, Support, Swap, Swap Confirm |
| 2 | Provider App | 5 pages: Home, Register (3-step), Customer Detail (with KYC approve/reject), Confirmation, Resubmit |
| 3 | User App | 6 pages: Auth (phone+OTP), Home (battery gauge), Swap (QR scanner), History (timeline), Stations (pod grid), Profile |
| 4 | Interactive Map | Leaflet maps on Dashboard (station locations) and Station Detail, plus New Station modal with clickable/draggable pins |
| 5 | New Station Modal | State/City cascading dropdowns (10 states, 20+ cities), interactive map, Nominatim reverse geocoding, create + edit modes |
| 6 | Chart.js Visualizations | Revenue bar charts, concentric doughnut (station revenue), monthly trends, attribution pie, swap frequency heatmap |
| 7 | KYC Approval Flow | Full flow: register -> pending -> approve (allocate battery + deposit) or reject -> resubmit |
| 8 | Battery Swap Flow | QR scan -> select station -> confirm -> API updates (swap record + battery status + user assignment) |
| 9 | Charging Simulator | Background process that gradually increases SOC of charging batteries |
| 10 | Data Management | Settings page with full CRUD for stations, batteries, users + repair workflow for fault batteries |
| 11 | CSV Export | Context-aware export from header (stations, inventory, users, revenue pages) |
| 12 | Environment Config | Auto-detect localhost vs production, all 82 hardcoded URLs replaced across 24+ files |
| 13 | AWS Deployment | nginx + PM2 on EC2, 3 apps served from single server, API proxy, auto-restart on reboot |
| 14 | Zero-state Styling | Revenue widget shows decorative light-coral rings and staggered bars when no revenue data |
