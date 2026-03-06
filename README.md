# Electica BSS - Battery Swap Service Platform

A full-stack platform I built for managing electric vehicle battery swap operations. The system covers the entire lifecycle - from onboarding customers and managing swap stations, to letting users swap batteries on the go.

This started as a dashboard project and grew into a complete three-app ecosystem that handles real operations end-to-end.

**Live Demo:** [http://51.20.91.7](http://51.20.91.7)

---

## What I Built

### Admin Dashboard
The central operations hub where everything comes together. 12 fully interactive pages covering station monitoring, battery inventory, user management, revenue analytics, and system settings.

![Admin Dashboard]()

**Highlights:**
- Real-time station map with Leaflet.js markers (color-coded by status)
- Revenue analytics with Chart.js - bar charts, concentric doughnut charts, swap frequency heatmaps
- Interactive "New Station" modal with state/city cascading dropdowns, click-to-place map pins, and Nominatim reverse geocoding
- Full CRUD operations for stations, batteries, and users from the Settings page
- KYC approval/rejection workflow with automatic battery allocation
- CSV export that's context-aware (adapts to whichever page you're on)
- Background charging simulator that gradually charges batteries and auto-updates status
- Toast notification system for all user actions

### Provider App (Field Agent)
Mobile-first app designed for field agents who go out and onboard new customers.

**Highlights:**
- 3-step registration wizard with auto-formatted Aadhaar, PAN, and phone inputs
- Two-step KYC approval sheet - upload payment proof, take customer photo, then confirm
- Gated approval button that only activates once both documents are uploaded
- "New Requests" section that surfaces self-registered users needing physical verification
- Coral-themed premium UI with gradient hero cards and decorative elements

### User App (Customer)
The customer-facing mobile app for managing batteries and performing swaps.

**Highlights:**
- Phone + OTP authentication flow (with pending approval handling for new users)
- Animated SVG battery gauge on the home screen (270-degree arc with CSS keyframe animation)
- QR scanner simulation with station selector and swap confirmation
- Full swap flow - creates swap record, updates both batteries, and charges INR 65
- Station finder with pod grid visualization (green/amber/red/gray status dots)
- Dark theme inspired by CRED's design language

---

## Tech Stack

I deliberately went with vanilla JavaScript - no React, no Angular, no frameworks. Just clean ES modules, Vite for bundling, and a flat-file JSON database.

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES Modules) |
| Bundler | Vite 7.x |
| API | json-server v1.0.0-beta.12 |
| Charts | Chart.js 4.x |
| Maps | Leaflet 1.9.4 |
| Icons | Google Material Symbols |
| Hosting | AWS EC2 (Ubuntu 22.04) |
| Web Server | nginx |
| Process Manager | PM2 |

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

In production, nginx serves all three apps from a single EC2 instance and proxies `/api/` requests to json-server running under PM2.

---

## Key Business Flows

### Customer Onboarding
1. Provider registers customer through the 3-step form (or customer self-registers via the User App)
2. Customer created with `kycStatus: "pending"`
3. Provider/Admin reviews documents and approves
4. System automatically finds a stock battery, assigns it, and records the INR 3,000 security deposit
5. Customer can now log in and start swapping

### Battery Swap
1. User opens the app and taps the center "Scan" FAB
2. Selects a nearby station with available batteries
3. Confirms the swap (sees old vs new battery details, health comparison, INR 65 fee)
4. System creates the swap record, moves the old battery back to the station for charging, assigns the new battery to the user

### Admin KYC Management
- Approve: allocates stock battery + creates deposit transaction
- Reject: captures reason, customer can resubmit updated documents via Provider App

---

## Project Structure

```
BSS_AG/
├── src/                           # Admin Dashboard
│   ├── main.js                    # Entry point + hash-based SPA router
│   ├── config.js                  # Environment-aware API base URL
│   ├── components/                # Reusable UI components
│   ├── pages/                     # 12 page modules
│   ├── services/                  # API helper
│   ├── utils/                     # Router, helpers, toast, CSV, charging sim
│   └── styles/                    # CSS with design tokens
│
├── provider-app/                  # Provider (Field Agent) App
│   └── src/
│       ├── main.js                # Overlay navigation pattern
│       ├── pages/                 # Home, Register, CustomerDetail, etc.
│       └── utils/                 # API helpers
│
├── user-app/                      # User (Customer) App
│   └── src/
│       ├── main.js                # 5-tab navigation + auth flow
│       ├── pages/                 # Auth, Home, Swap, History, Stations, Profile
│       └── utils/                 # Shared helpers
│
├── deploy/                        # nginx, PM2, and setup configs
├── db.json                        # JSON Server database (flat-file)
└── package.json                   # Root scripts for build + dev
```

---

## Getting Started

### Prerequisites
- Node.js 18+

### Install

```bash
# Root (Admin Dashboard + json-server)
npm install

# Provider App
cd provider-app && npm install && cd ..

# User App
cd user-app && npm install && cd ..
```

### Run Locally

```bash
# Terminal 1 - API Server
npx json-server db.json --port 3001

# Terminal 2 - Admin Dashboard (http://localhost:5173)
npm run dev

# Terminal 3 - Provider App (http://localhost:5174)
npm run dev:provider

# Terminal 4 - User App (http://localhost:5175)
npm run dev:user
```

### Build for Production

```bash
npm run build:all
```

This outputs:
- `dist/` - Admin Dashboard
- `provider-app/dist/` - Provider App
- `user-app/dist/` - User App

---

## Deployment

The platform runs on AWS EC2 with nginx serving all three SPAs and proxying API requests to json-server (managed by PM2).

```bash
# Build locally
npm run build:all

# Upload to server
scp -i e-key.pem -r dist/* ubuntu@<EC2_IP>:/var/www/electica/admin/
scp -i e-key.pem -r provider-app/dist/* ubuntu@<EC2_IP>:/var/www/electica/provider/
scp -i e-key.pem -r user-app/dist/* ubuntu@<EC2_IP>:/var/www/electica/user/
```

Check `deploy/` folder for the full nginx config, PM2 ecosystem file, and initial setup script.

---

## Database

All data lives in `db.json` with 6 collections:

| Collection | Records | Description |
|-----------|---------|-------------|
| stations | 6 | Swap stations with location, pods, revenue |
| batteries | 45 | Battery inventory with SOC, health, status |
| users | 27 | Customers with KYC info, vehicle, battery assignment |
| swaps | 102 | Swap transaction records |
| transactions | 92 | Financial transactions (swaps + deposits) |
| tickets | 0 | Support tickets |

Payment model: INR 65 flat fee per swap, INR 3,000 refundable security deposit on onboarding.

---

## Quick Test Flow

1. Open Provider App (`:5174`) - Register a new customer
2. Open Admin Dashboard (`:5173`) - Go to Users, approve the pending customer
3. Open User App (`:5175`) - Log in with the customer's phone number, do a swap
4. Check the Dashboard for updated stats

---

## What I Learned Building This

- Building a multi-app ecosystem with a shared API taught me a lot about state consistency across different frontends
- Going framework-free forced me to think about routing, state management, and component patterns from scratch
- The Leaflet integration with Nominatim reverse geocoding was a fun challenge - especially making the click-to-place pin work smoothly
- Setting up nginx to serve three SPAs from one server with proper SPA fallbacks took some trial and error
- The charging simulator running in the background and auto-updating battery status was a neat touch that made the demo feel alive

---

## License

This project was built as part of my work at Electica Energy. All rights reserved.
