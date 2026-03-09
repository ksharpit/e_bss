# Electica BSS - Complete Platform Documentation

## Overview

Electica BSS (Battery Swap Station) is a full-stack platform for managing EV battery swapping operations. It consists of three front-end apps, a REST API backed by PostgreSQL + TimescaleDB, and an MQTT broker for real-time battery telemetry from ESP32 BMS modules.

**Live URL**: https://bss.electica.in

| App | Local Port | Production Path | Purpose |
|-----|-----------|-----------------|---------|
| Admin Dashboard | :5173 | `/` | System admin panel |
| Provider App | :5174 | `/provider/` | Field agent operations |
| User App | :5175 | `/app/` | End-user mobile app |
| API Server | :3001 | `/api/` | Express REST API |
| MQTT Broker | :1883 | `mqtt://51.20.91.7:1883` | Battery telemetry |

---

## Quick Start (Local Development)

```bash
# Terminal 1 - API server
npm run api

# Terminal 2 - Admin Dashboard
npm run dev

# Terminal 3 - Provider App
npm run dev:provider

# Terminal 4 - User App
npm run dev:user
```

Build all for production:
```bash
npm run build:all
```

---

## Project Structure

```
BSS_AG/
├── src/                        # Admin Dashboard
│   ├── main.js                 # Entry point + router
│   ├── config.js               # API base URL
│   ├── pages/
│   │   ├── login.js            # Admin login (glassmorphic)
│   │   ├── dashboard.js        # Overview + activity manager
│   │   ├── stations.js         # Station grid
│   │   ├── stationDetail.js    # Station detail view
│   │   ├── inventory.js        # Battery inventory + onboarding modal
│   │   ├── batteryDetail.js    # Battery detail + live telemetry
│   │   ├── revenue.js          # Revenue analytics + chart
│   │   ├── users.js            # Customer list + CSV export
│   │   ├── userDetail.js       # KYC approve/reject
│   │   ├── swapBattery.js      # Manual swap initiation
│   │   ├── swapConfirmation.js # Swap result
│   │   ├── settings.js         # Admin profile + system config
│   │   └── support.js          # Support tickets + fault approval
│   ├── components/
│   │   ├── sidebar.js          # Left navigation
│   │   ├── header.js           # Top bar
│   │   ├── icons.js            # Icon helper
│   │   ├── kpiCard.js          # Metric cards
│   │   ├── stationCard.js      # Station cards
│   │   ├── batteryTable.js     # Battery table
│   │   ├── revenueChart.js     # Revenue visualization
│   │   └── podStatusGrid.js    # Pod availability dots
│   ├── utils/
│   │   ├── apiFetch.js         # JWT auth wrapper
│   │   ├── router.js           # Hash-based SPA router
│   │   ├── helpers.js          # Currency, formatting, colors
│   │   ├── csv.js              # CSV export utility
│   │   ├── toast.js            # Toast notifications
│   │   └── chargingSimulator.js # Battery animation
│   └── styles/
│       ├── variables.css
│       ├── reset.css
│       ├── layout.css
│       ├── components.css
│       ├── charts.css
│       └── pages.css
│
├── provider-app/               # Provider App
│   ├── src/
│   │   ├── main.js             # Entry + overlay navigation
│   │   ├── config.js           # API base URL
│   │   ├── style.css           # Full stylesheet (coral theme)
│   │   ├── pages/
│   │   │   ├── login.js        # Agent login (glassmorphic)
│   │   │   ├── home.js         # Customer list + stats
│   │   │   ├── register.js     # 3-step user registration
│   │   │   ├── confirmation.js # Registration success
│   │   │   ├── customerDetail.js # Customer KYC actions
│   │   │   ├── resubmit.js     # KYC resubmission form
│   │   │   └── support.js      # Agent support + fault reports
│   │   └── utils/
│   │       ├── apiFetch.js     # JWT auth wrapper
│   │       ├── api.js          # User CRUD helpers
│   │       └── toast.js        # Toast notifications
│   ├── package.json
│   └── vite.config.js          # base: /provider/ in production
│
├── user-app/                   # User App
│   ├── src/
│   │   ├── main.js             # Entry + tab navigation
│   │   ├── config.js           # API base URL
│   │   ├── style.css           # Full stylesheet (emerald theme)
│   │   ├── pages/
│   │   │   ├── auth.js         # Phone + OTP login/register
│   │   │   ├── home.js         # Battery gauge + nearest station
│   │   │   ├── history.js      # Swap history list
│   │   │   ├── stations.js     # Station map + pod grid
│   │   │   ├── swap.js         # QR scanner + swap flow
│   │   │   └── profile.js      # User profile + support
│   │   └── utils/
│   │       ├── apiFetch.js     # JWT auth wrapper
│   │       └── toast.js        # Toast notifications
│   ├── package.json
│   └── vite.config.js          # base: /app/ in production
│
├── server/                     # Backend
│   ├── index.js                # Express API - PostgreSQL + JWT auth + MQTT init
│   ├── db.js                   # PostgreSQL connection pool + column mapping
│   ├── mqtt.js                 # MQTT subscriber - BMS telemetry processing
│   ├── schema.sql              # Full PostgreSQL + TimescaleDB schema
│   ├── migrate-from-json.js    # One-time db.json to PostgreSQL migration
│   ├── test-mqtt.js            # BMS telemetry simulator for testing
│   └── seed-auth.js            # One-time auth seeder
│
├── deploy/
│   ├── ecosystem.config.cjs    # PM2 config (.cjs for ESM compatibility)
│   ├── nginx.conf              # nginx routing
│   └── setup.sh                # EC2 setup (PostgreSQL + TimescaleDB + Mosquitto)
│
├── .github/workflows/
│   └── deploy.yml              # CI/CD pipeline
│
├── db.json                     # Legacy database (migrated to PostgreSQL)
├── package.json                # Root config
└── vite.config.js              # Admin Vite config
```

---

## Database (PostgreSQL + TimescaleDB)

**Connection**: `postgresql://electica:electica@localhost:5432/electica_bss`
**Schema file**: `server/schema.sql`

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `stations` | Swap stations | id, name, location, pods, lat/lng |
| `batteries` | Battery inventory | id, device_id (BMS), status, soc, health, voltage |
| `users` | Customers | id, name, phone, kycStatus, batteryId |
| `swaps` | Swap records | userId, stationId, batteryIn, batteryOut, fee |
| `transactions` | Financial records | userId, type, amount |
| `tickets` | Support tickets | type, status, batteryId, replies |
| `admins` | Admin accounts | username, passwordHash |
| `agents` | Provider agents | agentId, name, zone, passwordHash |
| `battery_telemetry` | TimescaleDB hypertable | time-series BMS data |

### Battery Telemetry Hypertable

Time-series table for real-time BMS data from ESP32 devices:

```sql
CREATE TABLE battery_telemetry (
    time            TIMESTAMPTZ NOT NULL,
    device_id       INTEGER NOT NULL,
    battery_id      TEXT,
    voltage         NUMERIC(7,3),      -- pack voltage
    current_draw    NUMERIC(12,3),     -- current in amps
    soc             NUMERIC(5,2),      -- state of charge %
    soh             NUMERIC(5,2),      -- state of health %
    cycle_count     INTEGER,
    cap_available   NUMERIC(10,2),     -- available capacity Ah
    cap_initial     NUMERIC(10,2),     -- initial capacity Ah
    pod_temp        NUMERIC(5,1),      -- pod temperature C
    cell_voltages   NUMERIC(6,4)[],    -- 16 cell voltages
    ntc_temps       NUMERIC(5,1)[],    -- 6 NTC temperature sensors
    pdu_temps       NUMERIC(5,1)[]     -- 4 PDU temperature sensors
);
```

**Policies**:
- Auto-compression after 7 days (reduces storage by ~90%)
- Retention policy: 90 days (older data auto-deleted)

### Column Mapping

API uses camelCase, PostgreSQL uses snake_case. Mapped via `server/db.js`:

```
deviceId    <-> device_id
stationId   <-> station_id
assignedTo  <-> assigned_to
kycStatus   <-> kyc_status
cycleCount  <-> cycle_count
currentDraw <-> current_draw
capAvailable <-> cap_available
```

---

## MQTT / IoT Architecture

### Overview

ESP32 WiFi modules in station pods read BMS (Battery Management System) data when a battery is inserted. Data is published via MQTT to the Electica server, which stores it in TimescaleDB and updates battery records in real-time.

### Connection Details

| Setting | Value |
|---------|-------|
| Broker | `mqtt://51.20.91.7:1883` |
| Protocol | MQTT v3.1.1 (TCP) |
| Auth | Anonymous (allow_anonymous true) |
| QoS | 1 (at least once) |
| Topic | `electica/battery/{deviceId}/telemetry` |
| Status Topic | `electica/battery/{deviceId}/status` |

### BMS Telemetry Payload (from ESP32)

```json
{
  "TS": 1741538400,
  "DI": 1,
  "Telemetry": {
    "Volt": 62.4,
    "Curr": -1.5,
    "Soc": 85000,
    "Soh": 95000,
    "Cycle": 128,
    "Cap_avail": 42.5,
    "Cap_init": 48,
    "Pod_temp": 32000
  },
  "cells_v": [3.90, 3.91, 3.89, ...],
  "Ntc_temp": [32000, 31000, 33000, 31500, 32500, 30000],
  "Pdu_temp": [33000, 34000, 32000, 35000]
}
```

### Field Reference

| Field | Type | Description | Scaling |
|-------|------|-------------|---------|
| TS | Integer | Unix timestamp | None |
| DI | Integer | BMS Device ID (unique per hardware) | None |
| Volt | Float | Pack voltage (16S) | None |
| Curr | Float | Current draw (amps) | /1 (TBD) |
| Soc | Integer | State of charge | /1000 = % |
| Soh | Integer | State of health | /1000 = % |
| Cycle | Integer | Cycle count | /1 (TBD) |
| Cap_avail | Float | Available capacity (Ah) | None |
| Cap_init | Float | Initial capacity (Ah) | None |
| Pod_temp | Integer | Pod temperature | /1000 = C |
| cells_v | Float[16] | 16 cell voltages | None |
| Ntc_temp | Integer[6] | 6 NTC temperature sensors | /1000 = C |
| Pdu_temp | Integer[4] | 4 PDU temperature sensors | /1000 = C |

**NOTE**: Scaling factors are defined in `server/mqtt.js` SCALE object. Some factors are pending finalization from the BMS datasheet.

### Auto-Discovery

When an unknown Device ID publishes telemetry:
1. Server detects device not in `deviceMap` cache
2. Auto-creates battery record: `BAT-XXXX` (next sequential number)
3. Sets status to `stock`, extracts initial capacity from first telemetry
4. Updates cache, battery appears in admin inventory immediately
5. Admin can later assign it to a station

No manual onboarding required - just power on the ESP32.

### Data Flow

```
ESP32 BMS -> MQTT Publish -> Mosquitto Broker -> server/mqtt.js
                                                      |
                                        ┌─────────────┼─────────────┐
                                        v             v              v
                                  battery_telemetry  batteries     console.log
                                  (hypertable)       (UPDATE soc,   (monitoring)
                                                      health, etc.)
```

### Admin Dashboard Display

**Inventory page** (`src/pages/inventory.js`):
- Shows Device ID (DI:xxx) next to battery status badge
- "Add Battery" modal for manual onboarding (fallback)

**Battery Detail page** (`src/pages/batteryDetail.js`):
- DI chip in header showing BMS Device ID
- Live Telemetry section with 10-second polling:
  - Pack Voltage, Current, Capacity (avail/initial), Pod Temp
  - 16-cell voltage grid (8x2) with imbalance highlighting (red=min, green=max)
  - 6 NTC sensor temperatures (3x2 grid)
  - 4 PDU sensor temperatures (4x1 grid)
- Status badges:
  - Green "MQTT LIVE" - data received within 5 minutes
  - Gray "OFFLINE" - no data for >5 minutes
  - Amber "DEMO DATA" - no real telemetry, showing simulated values

### Testing Without Hardware

```bash
# Simulate BMS telemetry from any machine
node server/test-mqtt.js mqtt://51.20.91.7:1883 {deviceId}

# Example: simulate device 777
node server/test-mqtt.js mqtt://51.20.91.7:1883 777
```

Publishes realistic battery data every 5 seconds. Auto-discovers as new battery if device ID is unknown.

---

## API Server

**File**: `server/index.js`
**Runtime**: Node.js with Express 5, runs on port 3001
**Database**: PostgreSQL via `pg` pool (`server/db.js`)
**Auth**: JWT (jsonwebtoken) + bcryptjs password hashing
**MQTT**: Initializes mqtt.js subscriber on startup

### Authentication Endpoints (Public)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/admin/login` | `{ username, password }` | Admin login, returns JWT + user |
| POST | `/auth/agent/login` | `{ agentId, password }` | Agent login, returns JWT + agent |
| POST | `/auth/user/send-otp` | `{ phone }` | Send OTP (demo: always succeeds) |
| POST | `/auth/user/verify-otp` | `{ phone, otp }` | Verify OTP (demo: any 6 digits) |
| POST | `/auth/user/register` | `{ name, phone, vehicle }` | Register new user |
| GET | `/auth/me` | - | Validate token |

### Telemetry Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/telemetry/:batteryId` | Get telemetry history (last 100 records) |
| GET | `/telemetry/:batteryId/latest` | Get latest telemetry record |

### Protected CRUD Endpoints (require Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:collection` | List items (supports query filters, _sort, _order, _limit, _start) |
| GET | `/:collection/:id` | Get single item |
| POST | `/:collection` | Create item |
| PATCH | `/:collection/:id` | Partial update |
| PUT | `/:collection/:id` | Full replace |
| DELETE | `/:collection/:id` | Delete item |

**Available Collections**: `stations`, `batteries`, `users`, `swaps`, `transactions`, `tickets`, `agents`

**JWT Secret**: Set via `JWT_SECRET` env variable (default provided for dev)
**Token Expiry**: 24 hours

---

## Authentication Flow

### Admin Dashboard
- Login with username/password at `#login`
- Token stored in `localStorage` as `electica_admin_token`
- Admin user data stored as `electica_admin_user` (JSON)
- All API calls use `apiFetch()` which attaches `Authorization: Bearer {token}`
- 401 responses clear token and redirect to login

### Provider App
- Login with Agent ID/password
- Token stored as `electica_agent_token`
- Agent data stored as `electica_agent_data` (JSON)
- 401 responses trigger page reload (back to login)

### User App
- Splash screen (2.1s) then auth screen
- Phone number entry, then OTP verification (demo: any 6-digit code works)
- New users: register with name/phone/vehicle, get `kycStatus: pending`
- Pending users: see approval status screen with "Check Status" polling
- Verified users: access full app
- Token stored as `electica_user_token`
- Auth data stored as `electica_auth` (userId, name, kycStatus)

---

## Key Business Flows

### KYC Approval (Admin + Provider)
1. User registers via User App or Provider App (status: `pending`)
2. Provider sees pending user in customer list
3. Admin or Provider approves:
   - GET `/batteries?status=stock` - find available battery
   - PATCH `/users/{id}` - set kycStatus: verified, onboardedAt, depositPaid: true, batteryId
   - PATCH `/batteries/{id}` - set status: deployed, assignedTo: userId
   - POST `/transactions` - security_deposit of 3000 INR
4. Rejected users can be re-approved from admin (userDetail.js) or resubmitted from provider (resubmit.js)

### Battery Swap (User App)
1. User scans QR or selects station
2. Picks available battery from station
3. System executes:
   - POST `/swaps` - log swap record
   - PATCH old battery - status: charging, assign to station
   - PATCH new battery - status: deployed, assignedTo: user
   - PATCH user - update batteryId
4. Swap fee: 65 INR per swap

### Battery Onboarding (Automatic via MQTT)
1. ESP32 powers on in station pod, reads BMS data
2. Publishes to `electica/battery/{deviceId}/telemetry`
3. Server auto-discovers unknown device, creates BAT-XXXX record
4. Battery appears in admin inventory with real-time SOC, health, temperature
5. Admin assigns to station when ready

### Battery Fault/Repair (Provider + Admin)
1. Provider reports fault via support (creates `fault_report` ticket)
2. Admin approves in support panel:
   - PATCH battery status to `fault`
   - Resolve ticket
3. Provider submits `repair_request` ticket after repair
4. Admin approves repair:
   - PATCH battery status to `charging`, reassign to station
   - Resolve ticket

---

## Design Systems

### Admin Dashboard
- Theme: Dark sidebar (#0f172a), light content area
- Login: Glassmorphic dark card with floating orbs, particles, noise texture
- Charts: Chart.js for revenue analytics
- Icons: Google Material Symbols Outlined

### Provider App
- Primary: Coral `#D4654A`
- Gradient: `linear-gradient(145deg, #E8775C, #C4533A)`
- Hero cards: `linear-gradient(145deg, #D96A50, #9E3A2E)`
- Login: Glassmorphic dark card (matching admin quality)
- Layout: Mobile-first with bottom tab navigation + FAB
- Key classes: `.hero-card`, `.customer-item`, `.badge`, `.btn-primary`, `.nav-fab`

### User App
- Primary: Emerald green `#10b981`
- Hero: Dark navy `#0b1628` to `#1a2744`
- Battery gauge: 270-degree SVG arc with animated dashoffset
- Layout: Mobile-first with 5-tab bottom navigation + center FAB
- Pod grid: Status dots (green=available, amber=charging, red=fault, gray=empty)

---

## Admin Dashboard Pages

| Route | Page | Features |
|-------|------|----------|
| `#dashboard` | Dashboard | KPI cards, activity manager (swaps/alerts/verifications) |
| `#stations` | Stations | Station grid, status indicators, search |
| `#station/:id` | Station Detail | Pod grid, battery list, revenue stats |
| `#inventory` | Batteries | Battery table, status filters, Device ID display, Add Battery modal, CSV export |
| `#battery-detail/:id` | Battery Detail | SOC gauge, health chart, live telemetry (voltage, current, capacity, temps, 16 cells, NTC/PDU sensors), swap history |
| `#revenue` | Revenue | Chart.js line chart, CSV export, currency-aware |
| `#users` | Users | Customer list, search, CSV export |
| `#user-detail/:id` | User Detail | KYC status, approve/reject, battery assignment |
| `#swap` | Swap Battery | Station + user + battery selection |
| `#swap-confirm` | Swap Confirm | Swap result details |
| `#settings` | Settings | Profile (persists to server), system config (currency/timezone/refresh) |
| `#support` | Support | Ticket list, fault/repair approval workflow |

---

## Deployment

### AWS Infrastructure

| Service | Details |
|---------|---------|
| EC2 | Ubuntu 22.04, t3.micro (1.9GB RAM), IP: 51.20.91.7 |
| PostgreSQL 16 | + TimescaleDB extension, database: electica_bss |
| Mosquitto | MQTT broker on port 1883 (anonymous allowed) |
| nginx | Reverse proxy + static files on port 80 |
| PM2 | Process manager for Express API |
| Domain | bss.electica.in |

### EC2 Setup (One-time)

Run `deploy/setup.sh` on a fresh Ubuntu 22.04 instance:
- Installs Node.js 20, nginx, PM2
- Installs PostgreSQL 16 + TimescaleDB
- Installs Mosquitto MQTT broker (port 1883)
- Creates electica_bss database with electica user
- Enables TimescaleDB extension

Post-setup:
```bash
# Run schema
sudo -u postgres psql -d electica_bss -f /var/www/electica/server/schema.sql

# Migrate existing data (one-time)
cd /var/www/electica && node server/migrate-from-json.js

# Start API
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup

# Open port 1883 in EC2 Security Group for MQTT
```

### CI/CD Pipeline (GitHub Actions)

Triggered on push to `master`:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (root + provider-app + user-app)
4. Build all 3 apps (`vite build`)
5. SCP built files + server code to EC2
6. Install production dependencies
7. Run schema migration (idempotent)
8. Restart API via PM2

### nginx Configuration
```
/           -> /var/www/electica/admin/     (Admin Dashboard)
/provider/  -> /var/www/electica/provider/  (Provider App)
/app/       -> /var/www/electica/user/      (User App)
/api/       -> proxy to localhost:3001      (Express API)
```

### PM2 Configuration
```javascript
// deploy/ecosystem.config.cjs (must be .cjs due to "type":"module" in package.json)
module.exports = {
  apps: [{
    name: 'electica-api',
    script: 'server/index.js',
    cwd: '/var/www/electica',
    instances: 1,
    autorestart: true,
    max_memory_restart: '200M',
  }]
};
```

### GitHub Secrets Required
- `EC2_SSH_KEY` - SSH private key for EC2 access
- `EC2_HOST` - EC2 public IP address

---

## Dependencies

### Production (root)

| Package | Version | Purpose |
|---------|---------|---------|
| bcryptjs | ^3.0.3 | Password hashing |
| chart.js | ^4.5.1 | Revenue charts |
| cors | ^2.8.6 | CORS middleware |
| express | ^5.2.1 | REST API framework |
| jsonwebtoken | ^9.0.3 | JWT authentication |
| pg | ^8.20.0 | PostgreSQL client |
| mqtt | ^5.15.0 | MQTT client for BMS telemetry |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^7.3.1 | Build tool + dev server |

---

## Login Credentials (Demo)

### Admin Dashboard
- Username: `admin`
- Password: `admin123`

### Provider App
- Agent ID: `AGT-001`
- Password: `agent123`

### User App
- Any phone number + any 6-digit OTP

---

## Environment Configuration

All 3 apps auto-detect local vs production:

```javascript
// src/config.js (same pattern in all 3 apps)
const isLocal = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';

export const API_BASE = isLocal
  ? 'http://localhost:3001'
  : '/api';
```

---

## Utility Functions

### Currency Formatting (`src/utils/helpers.js`)
- `getCurrency()` - Returns active currency code (INR/USD/EUR)
- `curSymbol()` - Returns currency symbol only
- `fmtCur(amount)` - Format with conversion + locale
- `formatRevM(n)` - Abbreviated format (e.g. 45.3K, 1.2M)

### CSV Export (`src/utils/csv.js`)
- `downloadCsv(filename, headers, rows)` - Single-section CSV
- `downloadMultiSectionCsv(filename, sections)` - Multi-section CSV report

### Router (`src/utils/router.js`)
- `registerRoute(hash, renderFn)` - Register route handler
- `navigate(hash)` - Navigate to hash
- `initRouter(defaultRoute)` - Initialize hash-based router

### Toast Notifications (`*/utils/toast.js`)
- `showToast(message, type, duration)` - Show toast (success/error/warning)
