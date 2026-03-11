# Electica BSS - Battery Swap Service Platform

A full-stack platform I built for managing electric vehicle battery swap operations. The system covers the entire lifecycle - from onboarding customers and managing swap stations, to real-time battery monitoring via IoT, to letting users swap batteries on the go.

This started as a dashboard project and grew into a complete three-app ecosystem that handles real operations end-to-end. It has since evolved from a flat-file JSON database to a full PostgreSQL + TimescaleDB + MQTT-powered production system with live ESP32 hardware integration.

**Live:** [https://bss.electica.in](https://bss.electica.in)

---

## What I Built

### Admin Dashboard (`src/`)
The central operations hub where everything comes together. 12+ fully interactive pages covering station monitoring, battery inventory, user management, revenue analytics, support ticket system, and system settings.

![Admin Dashboard]()

**Highlights:**
- Real-time station map with Leaflet.js markers (color-coded by status)
- Live battery telemetry from ESP32 BMS via MQTT (voltage, current, SOC, SOH, cell voltages, NTC/PDU temperatures)
- Battery temperature card shows average of NTC1-4 sensors, updates live
- Revenue analytics with Chart.js - bar charts, concentric doughnut charts, swap frequency heatmaps
- Interactive "New Station" modal with state/city cascading dropdowns, click-to-place map pins, and Nominatim reverse geocoding
- Full CRUD operations for stations, batteries, and users from the Settings page
- Battery fault/repair approval workflow with threaded conversations
- KYC approval/rejection workflow with automatic battery allocation
- CSV export that's context-aware (adapts to whichever page you're on)
- Toast notification system for all user actions

### Provider App (`provider-app/`)
Mobile-first app designed for field agents who go out and onboard new customers and manage batteries in the field.

**Highlights:**
- 3-step registration wizard with auto-formatted Aadhaar, PAN, and phone inputs
- Two-step KYC approval sheet - upload payment proof, take customer photo, then confirm
- Gated approval button that only activates once both documents are uploaded
- "New Requests" section that surfaces self-registered users needing physical verification
- Battery inventory view with status filters, search, SOC/health indicators, and live telemetry badges
- Battery fault reporting and repair request workflow (admin approval required)
- Support ticket system with threaded conversations
- Coral-themed premium UI with gradient hero cards and decorative elements

### User App (`user-app/`)
The customer-facing mobile app for managing batteries and performing swaps.

**Highlights:**
- Phone + OTP authentication flow (with pending approval handling for new users)
- Animated SVG battery gauge on the home screen (270-degree arc with CSS keyframe animation)
- QR scanner simulation with station selector and swap confirmation
- Full swap flow - creates swap record, updates both batteries, and charges INR 65
- Station finder with pod grid visualization (green/amber/red/gray status dots)
- Dark theme inspired by CRED's design language

---

## Tech Stack Evolution

I deliberately went with vanilla JavaScript - no React, no Angular, no frameworks. Just clean ES modules and Vite for bundling.

The backend has evolved significantly since the project started:

### Phase 1 - Prototype (json-server + flat file)
| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES Modules) |
| Bundler | Vite 7.x |
| API | json-server v1.0.0-beta.12 |
| Database | db.json (flat-file JSON) |
| Charts | Chart.js 4.x |
| Maps | Leaflet 1.9.4 |
| Icons | Google Material Symbols |

### Phase 2 - Production (current)
| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES Modules) |
| Bundler | Vite 7.x |
| API Server | Express 5 + JWT authentication |
| Database | PostgreSQL + TimescaleDB |
| IoT/Telemetry | MQTT (Mosquitto broker) + ESP32 WiFi modules |
| Charts | Chart.js 4.x |
| Maps | Leaflet 1.9.4 |
| Icons | Google Material Symbols |
| Hosting | AWS EC2 (Ubuntu 22.04) |
| Web Server | nginx |
| Process Manager | PM2 |
| CI/CD | GitHub Actions |

---

## Architecture

### Phase 1 - Prototype Architecture

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

### Phase 2 - Production Architecture (current)

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
              |  Express API   |
              |  Port: 3001    |
              |  JWT + CRUD    |
              +-------+--------+
                      |
         +------------+------------+
         |                         |
+--------v--------+       +-------v--------+
|   PostgreSQL    |       | MQTT Broker    |
|  + TimescaleDB  |       | (Mosquitto)    |
|                 |       |  Port: 1883    |
|  - stations     |       +-------+--------+
|  - batteries    |               |
|  - users        |       +-------v--------+
|  - swaps        |       | ESP32 Modules  |
|  - transactions |       | (BMS Telemetry)|
|  - tickets      |       +----------------+
|  - telemetry    |
|    (hypertable) |
+-----------------+
```

In production, nginx serves all three apps from a single EC2 instance and proxies `/api/` requests to the Express server running under PM2.

---

## IoT / Battery Telemetry

ESP32 WiFi modules in swap station pods read BMS (Lithion) data when a battery is inserted and publish telemetry via MQTT.

**Data flow:**
1. ESP32 reads BMS data (pack voltage, current, SOC, SOH, 16 cell voltages, 6 NTC temps, 4 PDU temps)
2. Publishes JSON to `esp32/data` topic (or `ET/MS/T` for MQTT team firmware)
3. Server subscribes, normalizes payload, inserts into TimescaleDB hypertable
4. Server sends ACK back to ESP32 (on `esp32/ack/{deviceId}` and `ER/CM/R`)
5. Admin/Provider dashboards poll `/telemetry/:batteryId/latest` for live display
6. Unknown device IDs auto-create battery records (auto-discovery)

**ESP32 firmware payload format (lowercase, pre-scaled):**
```json
{
  "ts": 1710000000,
  "device_id": "ESP32_BMS_01",
  "telemetry": {
    "pack_v": 64.43,
    "pack_i": 1.72,
    "soc": 83,
    "soh": 92,
    "cycle": 130,
    "cap_avail": 30,
    "cap_init": 48,
    "pod_temp": 33
  },
  "cells_v": [4.012, 4.051, ...],
  "ntc_temp": [35, 31, ...],
  "pdu_temp": [35, 36, 37, 38]
}
```

**Legacy MQTT team payload format (uppercase, variable scaling):**

Different BMS devices send values at different scales. The server auto-detects which scaling to apply.

Example 1 - raw values (device 2):
```json
{
  "TS": 130, "DI": 2,
  "Telemetry": {
    "Volt": 4798, "Curr": 256, "Soc": 6818, "Soh": 25600,
    "Cycle": 0, "Cap_avail": 15, "Cap_init": 0, "Pod_temp": 8448
  },
  "cells_v": [3.012, 3.051, ...],
  "Ntc_temp": [30000, 31000, 32000, 33000, 0, 0],
  "Pdu_temp": [438, 438, 438, 438]
}
```

Example 2 - mixed scaling (device 3):
```json
{
  "TS": 185, "DI": 3,
  "Telemetry": {
    "Volt": 44040, "Curr": 0, "Soc": 100, "Soh": 100,
    "Cycle": 0, "Cap_avail": 22, "Cap_init": 1280, "Pod_temp": 34
  },
  "cells_v": [0, 0, 3.59, 4.07, 4.064, ...],
  "Ntc_temp": [32.2, 32.1, 32.3, 32.3],
  "Pdu_temp": [34.2, 32.3, 32.8, 0]
}
```

**Auto-detect scaling (3-tier system):**

The MQTT team uses multiple BMS firmware versions across devices, each with different scaling. The server auto-detects based on value ranges:

| Field | > 10000 | > 100 (or > 200) | <= 100 (or <= 200) |
|-------|---------|-------------------|---------------------|
| Voltage | /1000 (44040 -> 44.04V) | /100 (4798 -> 47.98V) | pass through (48.66V) |
| Current | /1000 | /100 (256 -> 2.56A) | pass through (2.56A) |
| SOC | - | /100 (6818 -> 68.18%) | pass through (100%) |
| SOH | - | /1000 (25600 -> 25.6%) | pass through (100%) |
| Pod_temp | - | /1000 if > 200 (8448 -> 8.4C) | pass through (34C) |
| NTC/PDU temps | - | /1000 if > 200 (438 -> 0.438C) | pass through (32.8C) |
| Capacity | - | /100 if > 200 (1280 -> 12.8 Ah) | pass through (22 Ah) |

ESP32 firmware format (lowercase keys) values are always pre-scaled - no division needed.

**Zero-value protection:** BMS sometimes sends all-zero readings during initialization or communication gaps. Three layers of protection:
1. Server drops zero readings before DB insert
2. SQL uses `NULLIF` to prevent zero overwrite of good battery values
3. Frontend guards against displaying zero values

---

## Database

### Phase 1 - Flat File (db.json)
All data originally lived in `db.json` with 6 collections:

| Collection | Records | Description |
|-----------|---------|-------------|
| stations | 6 | Swap stations with location, pods, revenue |
| batteries | 45 | Battery inventory with SOC, health, status |
| users | 27 | Customers with KYC info, vehicle, battery assignment |
| swaps | 102 | Swap transaction records |
| transactions | 92 | Financial transactions (swaps + deposits) |
| tickets | 0 | Support tickets |

### Phase 2 - PostgreSQL + TimescaleDB (current)
Migrated to PostgreSQL for production reliability and TimescaleDB for time-series telemetry data.

**Connection:** `postgresql://electica:electica@localhost:5432/electica_bss`

| Table | Description |
|-------|-------------|
| stations | Swap stations with location, pods, revenue |
| batteries | Battery inventory with device_id, SOC, health, status |
| users | Customers with KYC, vehicle, battery assignment |
| swaps | Swap transaction records |
| transactions | Financial transactions (swaps + deposits) |
| tickets | Support tickets with JSONB replies for threaded conversations |
| admins | Admin accounts (bcrypt hashed passwords) |
| agents | Provider agent accounts |
| battery_telemetry | TimescaleDB hypertable - time-series BMS data |

**TimescaleDB policies:** Auto-compression after 7 days, retention: 90 days.

**Migration:** One-time script `server/migrate-from-json.js` transferred all data from db.json to PostgreSQL.

**Payment model:** INR 65 flat fee per swap, INR 3,000 refundable security deposit on onboarding.

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

### Battery Fault/Repair (admin approval workflow)
1. Provider reports a faulty battery via Support page
2. Admin reviews and approves - battery status changes to "fault"
3. Provider repairs the battery and submits a repair request
4. Admin approves repair, selects station - battery goes back to "charging"
5. Both sides can chat via threaded replies throughout
6. Provider cannot self-resolve fault/repair tickets - admin approval is required

### Auto-Discovery
When an unknown ESP32 device sends telemetry, the server automatically creates a new battery record (BAT-XXXX) and maps the device_id. No manual onboarding needed for new hardware.

---

## Project Structure

```
BSS_AG/
├── src/                           # Admin Dashboard
│   ├── main.js                    # Entry point + hash-based SPA router
│   ├── config.js                  # Environment-aware API base URL
│   ├── components/                # Reusable UI components
│   ├── pages/                     # 12+ page modules
│   ├── services/                  # API helper
│   ├── utils/                     # Router, helpers, toast, CSV
│   └── styles/                    # CSS with design tokens
│
├── provider-app/                  # Provider (Field Agent) App
│   └── src/
│       ├── main.js                # Overlay navigation pattern
│       ├── pages/                 # Home, Register, Batteries, Support, etc.
│       └── utils/                 # API helpers
│
├── user-app/                      # User (Customer) App
│   └── src/
│       ├── main.js                # 5-tab navigation + auth flow
│       ├── pages/                 # Auth, Home, Swap, History, Stations, Profile
│       └── utils/                 # Shared helpers
│
├── server/                        # Backend (Phase 2)
│   ├── index.js                   # Express 5 + JWT auth + PostgreSQL CRUD
│   ├── db.js                      # pg Pool + camelCase/snake_case mapping
│   ├── mqtt.js                    # MQTT subscriber + telemetry processing
│   ├── schema.sql                 # Full PostgreSQL + TimescaleDB schema
│   ├── seed-auth.js               # Seed admin/agent accounts
│   ├── test-mqtt.js               # BMS telemetry simulator
│   ├── migrate-from-json.js       # One-time db.json to PostgreSQL migration
│   └── migrate-*.sql              # Incremental database migration scripts
│
├── deploy/                        # Deployment configs
│   ├── ecosystem.config.cjs       # PM2 process config
│   └── setup.sh                   # EC2 initial setup script
│
├── ESP32_MQTT/                    # ESP32 firmware documentation
│   ├── MQTT_Setup_Guide.md        # MQTT broker setup instructions
│   └── Broker_to_ESP32_Commands.md # ESP32 command reference
│
├── .github/workflows/deploy.yml   # CI/CD - auto-deploy on push to master
├── db.json                        # Original flat-file database (Phase 1)
└── package.json                   # Root scripts for build + dev
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with TimescaleDB extension
- Mosquitto MQTT broker (for live telemetry)

### Install

```bash
# Root (Admin Dashboard + API Server)
npm install

# Provider App
cd provider-app && npm install && cd ..

# User App
cd user-app && npm install && cd ..
```

### Database Setup

```bash
# Create database and user
sudo -u postgres psql -c "CREATE USER electica WITH PASSWORD 'electica';"
sudo -u postgres psql -c "CREATE DATABASE electica_bss OWNER electica;"

# Enable TimescaleDB and run schema
sudo -u postgres psql -d electica_bss -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
sudo -u postgres psql -d electica_bss -f server/schema.sql

# Seed admin/agent accounts
node server/seed-auth.js

# Optional - migrate data from db.json (one-time)
node server/migrate-from-json.js
```

### Run Locally

```bash
# Terminal 1 - API Server (http://localhost:3001)
npm run api

# Terminal 2 - Admin Dashboard (http://localhost:5173)
npm run dev

# Terminal 3 - Provider App (http://localhost:5174)
npm run dev:provider

# Terminal 4 - User App (http://localhost:5175)
npm run dev:user

# Optional - MQTT telemetry simulator
node server/test-mqtt.js
```

### Default Credentials

| App | Login | Password |
|-----|-------|----------|
| Admin Dashboard | admin | admin123 |
| Provider App | AGT-001 (Ravi Mehta, South Bangalore) | agent123 |
| Provider App | AGT-002 (Priya Sharma, North Bangalore) | agent123 |

### Build for Production

```bash
npm run build:all
```

This outputs:
- `dist/` - Admin Dashboard
- `provider-app/dist/` - Provider App
- `user-app/dist/` - User App

---

## Quick Test Flow

1. Open Provider App (`:5174`) - Register a new customer
2. Open Admin Dashboard (`:5173`) - Go to Users, approve the pending customer
3. Open User App (`:5175`) - Log in with the customer's phone number, do a swap
4. Check the Dashboard for updated stats

---

## Deployment (AWS EC2)

CI/CD via GitHub Actions - auto-deploys on push to master.

**Infrastructure:**
- EC2 t3.micro (Ubuntu 22.04) at `51.20.91.7`
- Domain: `bss.electica.in` (HTTPS via Let's Encrypt)
- nginx serves Admin at `/`, Provider at `/provider/`, User at `/app/`
- PM2 manages the Express API server
- PostgreSQL + TimescaleDB for persistent data
- Mosquitto MQTT broker for IoT telemetry

**Manual deploy:**
```bash
npm run build:all
scp -i e-key.pem -r dist/* ubuntu@51.20.91.7:/var/www/electica/admin/
scp -i e-key.pem -r provider-app/dist/* ubuntu@51.20.91.7:/var/www/electica/provider/
scp -i e-key.pem -r user-app/dist/* ubuntu@51.20.91.7:/var/www/electica/user/
```

**SSH access:**
```bash
ssh -i e-key.pem ubuntu@51.20.91.7
```

Check `deploy/` folder for the full nginx config, PM2 ecosystem file, and initial setup script.

---

## What I Learned Building This

- Building a multi-app ecosystem with a shared API taught me a lot about state consistency across different frontends
- Going framework-free forced me to think about routing, state management, and component patterns from scratch
- The Leaflet integration with Nominatim reverse geocoding was a fun challenge - especially making the click-to-place pin work smoothly
- Setting up nginx to serve three SPAs from one server with proper SPA fallbacks took some trial and error
- The charging simulator running in the background and auto-updating battery status was a neat touch that made the demo feel alive
- Migrating from json-server to PostgreSQL + Express taught me about proper database schema design, column mapping (camelCase/snake_case), and JWT authentication
- Integrating real ESP32 hardware via MQTT was a major step - handling two different payload formats (ESP32 firmware vs MQTT team), normalizing data, and dealing with zero-value BMS readings during communication gaps
- The biggest MQTT challenge was that different BMS devices from the same team send values at completely different scales (one sends Volt:4798 meaning /100, another sends Volt:44040 meaning /1000, and a third sends Volt:48.66 pre-scaled). Building a 3-tier auto-detection system that handles all variants without config was a satisfying problem to solve
- TimescaleDB hypertables with auto-compression and retention policies showed me how time-series databases differ from regular relational storage
- Building the battery auto-discovery flow (unknown device IDs automatically create battery records) made the hardware onboarding seamless
- The three-layer zero-value protection (server drop, SQL NULLIF, frontend guard) was born from debugging real BMS hardware quirks
- PostgreSQL JSONB columns for ticket replies required explicit JSON.stringify() before passing to the pg driver - JS arrays don't auto-serialize to JSONB, they get misinterpreted as PostgreSQL arrays
- Building the fault/repair approval workflow taught me about multi-party ticket systems where the originator (provider) cannot resolve their own request - only admin can approve, but both sides need to chat throughout the process

---

## License

This project was built as part of my work at Electica Energy. All rights reserved.
