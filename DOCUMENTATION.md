# Electica BSS Dashboard - Project Documentation

> **Electica** - Battery Swapping Station (BSS) Admin Dashboard
> Built for EV fleet operators to monitor stations, batteries, swaps, revenue, and customers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Vanilla JavaScript (ES Modules) |
| Build Tool | Vite 7.3.1 |
| Charts | Chart.js 4.5.1 |
| Maps | Leaflet.js 1.9.4 (CDN) |
| Routing | Custom hash-based SPA router |
| Styling | Plain CSS with design tokens |
| Backend API | json-server v4 on port 3001 (`db.json`) |
| Reverse Geocoding | OpenStreetMap Nominatim |

No frameworks. No TypeScript. No bundled UI library.

---

## Project Structure

```
BSS_AG/
├── index.html
├── package.json
└── src/
    ├── main.js                  # App entry - imports styles, registers routes
    ├── data/
    │   └── mockData.js          # All mock data (stations, batteries, pods, users)
    ├── components/
    │   ├── sidebar.js           # Nav sidebar with active-link tracking
    │   ├── header.js            # Top bar + New/Edit Station modal
    │   ├── icons.js             # Material icon helper
    │   ├── kpiCard.js           # Shared KPI card components
    │   ├── stationCard.js       # Station card for grid view
    │   ├── batteryTable.js      # Battery table rows
    │   ├── revenueChart.js      # Chart.js wrappers
    │   └── podStatusGrid.js     # Pod status visual grid
    ├── pages/
    │   ├── dashboard.js         # Main overview + Leaflet map
    │   ├── stations.js          # Stations list with KPI bar
    │   ├── stationDetail.js     # Individual station drill-down
    │   ├── inventory.js         # Battery inventory
    │   ├── batteryDetail.js     # Individual battery detail
    │   ├── revenue.js           # Revenue analytics + charts
    │   ├── swapBattery.js       # Initiate Swap flow (step 1)
    │   ├── swapConfirmation.js  # Swap Confirmation (step 2)
    │   ├── users.js             # Users / Customers list
    │   ├── userDetail.js        # Individual user detail
    │   ├── settings.js          # App settings
    │   └── support.js           # Support / help page
    ├── utils/
    │   ├── router.js            # Hash-based SPA router
    │   ├── helpers.js           # Shared utility functions
    │   ├── toast.js             # Toast notification system
    │   ├── csv.js               # CSV export utility
    │   └── chargingSimulator.js # Background battery charging simulation
    └── styles/
        ├── variables.css        # Design tokens (colors, fonts, spacing, radius)
        ├── reset.css            # CSS reset
        ├── layout.css           # App shell layout (sidebar + main)
        ├── components.css       # Shared component classes
        ├── pages.css            # Page-level layout grids
        └── charts.css           # Chart container styles
```

---

## Routing

Hash-based SPA routing via `src/utils/router.js`. All routes registered in `src/main.js`.

| Hash | Page | Param |
|------|------|-------|
| `#dashboard` | Dashboard overview | - |
| `#stations` | Stations list | - |
| `#station/<id>` | Station detail | `stationId` e.g. `BSS-001` |
| `#revenue` | Revenue analytics | - |
| `#inventory` | Battery inventory | - |
| `#battery-detail/<id>` | Battery detail | `batteryId` e.g. `BAT-0001` |
| `#swap` | Initiate Swap | - |
| `#swap-confirm` | Swap Confirmation | - |
| `#users` | Users / Customers | - |
| `#user-detail/<id>` | User detail | `userId` e.g. `USR-0001` |
| `#settings` | Settings | - |
| `#support` | Support | - |

Sub-page sidebar highlighting is handled by a `pageMap` in `sidebar.js`:

```js
const pageMap = {
  'user-detail':    'users',
  'station':        'stations',
  'battery-detail': 'inventory',
  'swap-confirm':   'swap'
};
```

---

## Design System

### Coral Theme

| Token | Value | Use |
|-------|-------|-----|
| `--accent` | `#D4654A` | Primary coral accent |
| `--accent-light` | `rgba(212,101,74,0.12)` | Backgrounds, chips |
| `--accent-border` | `rgba(212,101,74,0.25)` | Borders |

### Font Scale (variables.css)

| Token | Value | Use |
|-------|-------|-----|
| `--font-xs` | `0.625rem` | Labels, badges, table headers |
| `--font-sm` | `0.6875rem` | Secondary text |
| `--font-base` | `0.8125rem` | Body / table cells |
| `--font-md` | `0.875rem` | Section headings |
| `--font-lg` | `1.125rem` | Card titles |
| `--font-2xl` | `1.5rem` | Page KPI values |

### KPI Card Pattern

All pages use a unified `rev-kpi-card` pattern defined in `components.css`:

```
┌─────────────────────────────┐  ← rev-kpi-card (white, shadow, rounded-xl)
│                        ●●   │  ← rev-kpi-decor (coral circle, decorative)
│  LABEL (tiny, uppercase)    │  ← rev-kpi-label
│  2.25rem Bold Value         │  ← rev-kpi-value
│  [ Badge Pill ]             │  ← rev-badge (rev-badge-up / down / track)
└─────────────────────────────┘
```

Badge colors:
- `rev-badge-up` - green `#dcfce7 / #15803d` (positive metrics)
- `rev-badge-down` - red `#fef2f2 / #dc2626` (alerts)
- `rev-badge-track` - coral `var(--accent-light) / var(--accent)` (neutral tracking)

Grid class: `.rev-kpi-grid` - 4 equal columns, used on Dashboard, Stations, Revenue, Users.
Inventory uses inline override: `grid-template-columns: repeat(5, 1fr)`.

---

## Pages

### Dashboard (`#dashboard`)

- **KPI strip** - Active Stations, Live Batteries, Today's Swaps, Revenue Today (4 × `rev-kpi-card`)
- **Row 1** - Operations Today (swap activity), Alert Center (battery/station alerts)
- **Station Locations Map** - Leaflet.js map showing all 5 station pins with coral/amber markers, `fitBounds` to all coords
- **Row 2** - Global Operations widget grid (7 cards), Network Activity feed
- **Clickable widget cards** - each card navigates to its related page on click:
 - Revenue card → `#revenue`
 - Fleet Status → `#stations`
 - Battery Health → `#inventory`
 - Active Swaps → `#inventory`
 - Initiate Swap → `#swap`
 - Stations card → `#stations`

### Stations (`#stations`)

- **KPI bar** - Online Stations, Total Pods, Swaps Today, Revenue Today
- **Station grid** - `stationCard` components, each navigates to `#station/<id>` on click
- Station cards show: name, location, status badge, pod count, temperature, last sync

### Station Detail (`#station/<id>`)

- Breadcrumb: `Stations / {Station Name}`
- **KPI row** - 4 metric cards (Pods Available, Swaps Today, Revenue Today, Avg Swap Time)
- **Left column**: Pod Status Grid (visual cabinet layout), Recent Swap Activity (Indian names: Arjun Sharma, Priya Nair, Rahul Mehta, Sneha Patel)
- **Right column**: Revenue Trend mini-bar chart, Battery Levels list, Station Info card with Leaflet map
- **Battery table** - all batteries in this station with SOC bar, status, last swap time

### Inventory (`#inventory`)

- **KPI bar** - Total Batteries, Charged (≥80%), Deployed, In-Service, Critical (<20%)
- **Flex-row layout** (matches Users page design) - battery ID, location/user, SOC bar, health %, swaps, cycles, chevron
- Toolbar with search input + status filter pills (All, Available, Charging, Deployed, Fault, Stock)
- Row click → `#battery-detail/<id>`

### Battery Detail (`#battery-detail/<id>`)

- Breadcrumb: `Inventory / {Battery ID}`
- Full battery profile: SOC gauge, cycle count, health score, chemistry, temperature
- Charge history chart, deployment log
- **Coral theme** throughout - all status badges, metric cards, charts use coral palette

### Revenue (`#revenue`)

- **KPI strip** - Total Revenue, Avg / Swap, Top Station, Monthly Growth
- **Revenue chart** - Chart.js bar chart (7-day or 30-day toggle)
- **Station breakdown table** - per-station revenue, swap count, efficiency

### Initiate Swap (`#swap`)

- Station selection list with real-time ready battery counts (from `mockPods` data)
- Each station shows name, location, ready count synced with actual pod data
- Reserve button writes `window.__swapStation = {name, location, lat, lng}` and navigates to `#swap-confirm`
- **Live Coverage Map** - Leaflet map at bottom showing all station pins
- Battery ID format: `BAT-XXXX` (4-digit numeric, e.g. `BAT-8921`)

### Swap Confirmation (`#swap-confirm`)

- Breadcrumb: `Dashboard / Initiate Swap / Confirmation` (all links clickable)
- Reads `window.__swapStation` to display the previously selected station name + coordinates
- User shown: **Arjun Sharma** (Indian name)
- Station map showing selected station pin
- Confirm / Cancel actions

### Users (`#users`)

- **KPI bar** - Total Users, KYC Verified, Total Swaps, Revenue Collected
- **Customers table** - columns: User (avatar + name + ID), Vehicle, Battery ID, Swaps, Spent, KYC status, View button
- KYC badges: Verified (green), Pending (amber), Rejected (red)
- Row or View button → `#user-detail/<id>`

### User Detail (`#user-detail/<id>`)

- Breadcrumb: `Users / {User Name}`
- **Profile header** - coral avatar with initials, name, KYC badge, phone, vehicle info
- **Usage Summary** - 4 stat boxes: Total Swaps, Total Spent, Linked Battery, Frequent Station
- **KYC Documents** - Aadhaar card (masked: `XXXX-XXXX-1234`) + PAN card, upload status, verification date
- **Swap History table** - Swap ID, Station, Battery, Date, Amount (₹65 each)
- **Payment Summary** - Total Paid, Rate per Swap (₹65), Last Swap Date

### Settings (`#settings`)

- **Profile Settings** - editable name, email (updates sidebar avatar/name on save)
- **Notification Preferences** - toggle switches for swap alerts, maintenance alerts, revenue reports, email digest
- **System Configuration** - currency, timezone, refresh interval dropdowns
- **Data Management** (Admin) - tabbed panel with:
 - **Stations tab**: grid of station cards with status toggle (online/maintenance), **Edit** button (opens same modal as "+ New Station" with pre-filled values + map), Remove button
 - **Batteries tab**: list with status filter pills (All, Deployed, Available, Charging, Stock, Fault), **Repair** button on fault batteries (fixed-position dropdown to assign to station & start charging), Remove button
 - **Users tab**: user list with KYC badge, Remove button
- **Generate Report** - downloads CSV with system metrics
- Delete confirmation modal with animation

### Support (`#support`)

- FAQ accordion, contact form, ticket submission

---

## Data Layer - Live API (`json-server` on port 3001)

All data is served from `db.json` via json-server. Fallback to `src/data/mockData.js` when API is offline.

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /stations` | GET | List all stations |
| `GET /stations/:id` | GET | Single station |
| `PATCH /stations/:id` | PATCH | Update station (name, location, pods, status, lat, lng) |
| `POST /stations` | POST | Create new station |
| `DELETE /stations/:id` | DELETE | Remove station |
| `GET /batteries` | GET | List all batteries |
| `GET /batteries?stationId=X` | GET | Batteries at a station |
| `GET /batteries?status=charging` | GET | Filter by status |
| `PATCH /batteries/:id` | PATCH | Update battery (soc, status, stationId) |
| `DELETE /batteries/:id` | DELETE | Remove battery |
| `GET /users` | GET | List all users |
| `DELETE /users/:id` | DELETE | Remove user |
| `GET /swaps` | GET | List all swap records |
| `GET /swaps?stationId=X` | GET | Swaps at a station |

### Station Schema

```js
{ id: 'BSS-001', name: 'Koramangala Hub', location: 'Koramangala, Bengaluru',
  lat: 12.9352, lng: 77.6245, status: 'online', pods: 12,
  totalSwapsToday: 0, totalSwapsMonth: 0, revenueToday: 0, revenueMonth: 0, uptime: 98 }
```

### Battery Schema

```js
{ id: 'BAT-0001', stationId: 'BSS-001', stationName: 'Koramangala Hub',
  status: 'available' | 'charging' | 'deployed' | 'fault' | 'stock' | 'retired',
  soc: 95, health: 92, cycleCount: 120, temperature: 34, assignedTo: 'USR-0001' | null,
  lastSwap: '2026-03-01T10:00:00' }
```

### User Schema

```js
{ id: 'USR-0001', name: 'Arjun Sharma', initials: 'AS',
  phone: '+91-98765-XXXXX', vehicle: 'Ather 450X', vehicleId: 'KA-01-EV-XXXX',
  batteryId: 'BAT-XXXX', swapCount: 45, totalSpent: 2925,
  kycStatus: 'verified' | 'pending' | 'rejected',
  aadhaar: 'XXXX-XXXX-XXXX', pan: 'ABCDE1234F' }
```

---

## Components

### `sidebar.js`

- Renders nav links: Dashboard, Stations, Revenue, Inventory, Initiate Swap, Users, Settings, Support
- `updateActiveLink()` - highlights active link based on current hash, uses `pageMap` for sub-pages

### `kpiCard.js`

Two exports:

- **`createMetricCard({ value, label, trend, trendType, decor })`** - standard `rev-kpi-card` for top-of-page KPI grids
- **`createKpiCard({ value, label, trend, trendType })`** - same card style, used in detail pages

### `icons.js`

```js
icon('bolt', '16px', 'color:#D4654A')
// → <span class="material-symbols-outlined" style="...">bolt</span>
```

Uses Google Material Symbols (loaded in `index.html`).

### `revenueChart.js`

Chart.js wrapper for bar/line charts used on Revenue page and Station Detail mini-chart.

### `podStatusGrid.js`

Visual grid of pod slots (charged, in-use, empty, fault) used in Station Detail.

### `header.js`

- Renders top bar with search, Export button, "+ New Station" button
- **`showNewStationModal(editStation?)`** - exported, dual-purpose modal:
 - **Create mode** (no arg): empty form + India overview map
 - **Edit mode** (pass station object): pre-filled name, pods, map zoomed to station with pin, state/city auto-detected
 - Two-column layout: form (left) + interactive Leaflet map (right)
 - State → City cascading dropdowns covering all Indian states (28 states + 8 UTs)
 - Click map to place/move pin, Nominatim reverse geocoding for address
 - Create mode POSTs new station; Edit mode PATCHes existing station
- **CSV Export** - context-aware: exports stations, batteries, users, or revenue CSV based on current page

---

## Cross-Page State

| Key | Set by | Read by | Purpose |
|-----|--------|---------|---------|
| `window.__swapStation` | `swapBattery.js` on Reserve click | `swapConfirmation.js` on load | Pass selected station across pages |

---

## Maps (Leaflet.js)

Loaded from CDN in `index.html`. Singleton guard prevents duplicate script loads:

```js
if (!document.getElementById('leaflet-js')) {
  const script = document.createElement('script');
  script.id = 'leaflet-js';
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  // ...
}
```

Maps used on:
- **Dashboard** - `initDashboardMap()`: all stations, `fitBounds`, coral/amber markers
- **Station Detail** - single station pin
- **Initiate Swap** - all stations live coverage map
- **Swap Confirmation** - selected station pin
- **New/Edit Station Modal** - interactive click-to-place pin, draggable marker, Nominatim reverse geocoding

---

## Charging Simulator (`src/utils/chargingSimulator.js`)

Background service started from `main.js` on app boot.

- **Tick interval**: every 30 seconds
- Fetches all batteries with `status: "charging"` from the API
- Increments SOC by ~0.56% per tick (reaches 100% in 1.5 hours)
- When SOC reaches 100%, auto-PATCHes status to `"available"`
- Silent failure - does not disrupt the UI if API is offline

```
SOC increment per tick = 100 / (90 minutes × 2 ticks/min) ≈ 0.56%
Total ticks to 100%: ~180 ticks = 90 minutes = 1.5 hours
```

### Admin Repair Flow

1. In **Settings → Data Management → Batteries tab**, fault batteries show a "Repair" button
2. Clicking Repair opens a fixed-position dropdown listing all stations
3. Selecting a station PATCHes the battery: `{ status: 'charging', stationId, stationName }`
4. The charging simulator picks it up and gradually charges to 100%
5. At 100%, status auto-flips to `"available"`

---

## Payment Model

- **Rate**: ₹65 per battery swap (flat)
- All swap history entries use `amount: 65`
- Revenue calculations: `totalSpent = swapCount × 65`
- Dashboard revenue badge: "↑ ₹65 / swap"

---

## Running the Project

```bash
npm install

# Terminal 1 - Start json-server API
npx json-server db.json --port 3001

# Terminal 2 - Start Vite dev server
npm run dev       # http://localhost:5173
```

### Other Commands

```bash
npm run build     # production build → dist/
npm run preview   # preview production build
```

### API Data

All data is persisted in `db.json` at the project root. json-server provides full CRUD (GET, POST, PUT, PATCH, DELETE) for all top-level keys: `stations`, `batteries`, `users`, `swaps`.
