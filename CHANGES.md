# Electica BSS — Development Log

## Project Overview

Three-app Battery Swap System (BSS) built with Vanilla JS + Vite + json-server.

| App | Port | Theme | Purpose |
|-----|------|-------|---------|
| Admin Dashboard | :5173 | Blue/indigo | Network-wide analytics, station monitoring |
| Provider App | :5174 | Coral `#D4654A` | Field agent: onboard & approve customers |
| User App | :5175 | CRED dark gold `#C9A96E` | End-user: swap battery, view history |

**API:** json-server on `:3001` — `db.json` at project root

---

## Features Built

### 1. User App — Full Flow

#### Auth & Registration (`user-app/src/pages/auth.js`)
- Phone + OTP login (10-digit normalisation, `+91` formatting)
- **New user self-registration** — form: name, vehicle, vehicle ID, Aadhaar (auto-formatted `XXXX-XXXX-XXXX`), PAN
- POSTs new user with `kycStatus: 'pending'`, `onboardedBy: null`, `kycSubmittedAt: new Date().toISOString()`
- Pending users routed to pending screen; verified users routed to main app

#### Pending Approval Screen (`user-app/src/main.js`)
- Shown when `kycStatus === 'pending'` in localStorage
- Step tracker: Created → KYC submitted → Provider review → Deposit → Battery allocation
- "Check Approval Status" polls API; on verified → navigates to home

#### QR Scan + Swap (`user-app/src/pages/swap.js`)
- Animated QR viewfinder (corner brackets + scan line)
- Demo station selector: shows online stations, available battery count, distance
- Disabled if user has no battery allocated (`!user.batteryId`)
- **Swap Confirmation Sheet** (bottom overlay): station info, battery flow diagram (old → new), health, fee (INR 65)
- **processSwap()** — 4 API calls:
  1. `POST /swaps` — creates swap record
  2. `PATCH /batteries/{oldBat}` — status: charging, back to station
  3. `PATCH /batteries/{newBat}` — status: deployed, assigned to user
  4. `PATCH /users/{userId}` — updates batteryId, swapCount, totalSpent, lastSwap
- Success screen: station, new battery ID, charge %, amount paid, transaction ID

#### CRED Dark Theme (`user-app/src/style.css`)
- `--bg: #0D0D0F`, `--card: #17171C`, `--gold: #C9A96E`
- Battery green `#22D3A4` kept **only** for semantic indicators (SOC, health, pod dots)
- Gold for all UI chrome: nav active, CTA buttons, app bar icon, history amounts, KYC badge
- Dark auth card, dark swap sheet, dark QR scanner demo sheet
- Tight typography: `letter-spacing: -0.04em` to `-0.06em` on headings
- Center scan FAB (PhonePe-style) in bottom nav

---

### 2. Provider App — Approval Flow

#### New Requests Section (`provider-app/src/pages/home.js`)
- Fetches all `kycStatus=pending` users; filters `!u.onboardedBy` (self-registered via user app)
- Displays "New Requests" section at top with coral alert banner:
  > "Users registered via app — awaiting your physical verification & INR 3,000 deposit collection"
- Each card: name, phone, vehicle, submission date, chevron → opens customer detail

#### Approval Sheet (`provider-app/src/pages/customerDetail.js`)
- Replaces single "Approve KYC" button with a 2-step gated modal
- **Step 1 — Payment Proof**: dashed upload zone (`upload_file` icon), accepts JPG/PNG/PDF, shows thumbnail preview + filename + size, step indicator turns coral ✓
- **Step 2 — Customer Photo**: camera zone (`photo_camera` icon), `capture="environment"` for mobile camera, same preview behaviour
- "Confirm & Approve Customer" button: starts with `pointer-events:none; opacity:0.35` — activates only when **both** uploads complete
- Uses `ov.querySelector()` (scoped) instead of `document.getElementById()` — avoids global ID conflicts
- On confirm runs 3 API calls:
  1. `PATCH /users/{id}` — kycStatus: verified, depositPaid: true, batteryId, onboardedBy, depositProof metadata, customerPhoto metadata
  2. `PATCH /batteries/{id}` — status: deployed, assignedTo: userId
  3. `POST /transactions` — security_deposit, INR 3,000, mode: Cash
- `onboardedBy: agent.id` set on approval so user moves from "New Requests" to "My Customers"

#### Agent passed through (`provider-app/src/main.js`)
- `AGENT` object passed to `renderCustomerDetail(..., AGENT)` so `onboardedBy` is correctly set

---

### 3. Data — Stock Batteries

5 new batteries added for customer onboarding allocation:

| ID | Status | SOC | Health | Cycles |
|----|--------|-----|--------|--------|
| BAT-0041 | stock | 100% | 100% | 0 |
| BAT-0042 | stock | 100% | 100% | 0 |
| BAT-0043 | stock | 100% | 100% | 0 |
| BAT-0044 | stock | 100% | 100% | 0 |
| BAT-0045 | stock | 100% | 100% | 0 |

Approval flow fetches `GET /batteries?status=stock` and allocates the first result.

> **Note:** json-server loads `db.json` into memory on startup. If batteries were added to the file while the server was running, add them via the API or restart json-server.

---

## Complete User Journey

```
User App                          Provider App
─────────────────────────────────────────────────────
1. New user opens app
2. Enters phone → no account found
3. Fills registration form
   (name, vehicle, Aadhaar, PAN)
4. Account created: kycStatus=pending
5. Sees pending approval screen
                                  6. Provider opens app
                                  7. "New Requests" section shows user
                                  8. Provider taps user → Customer Detail
                                  9. Taps "Approve KYC"
                                 10. Approval Sheet opens
                                 11. Uploads payment proof (INR 3,000 screenshot)
                                 12. Takes customer photo with battery
                                 13. Taps "Confirm & Approve"
                                 14. Battery allocated, user verified
5b. User taps "Check Approval"
    → kycStatus now verified
    → Full app unlocked
16. User taps Scan (center FAB)
17. Selects station from list
18. Swap confirmation sheet shown
19. Taps "Pay INR 65 and Swap"
20. Battery swapped, history updated
```

---

## Key Files

```
BSS_AG/
├── db.json                              ← Single data store (json-server)
├── user-app/src/
│   ├── main.js                          ← App shell, auth routing, pending screen, scan FAB
│   ├── style.css                        ← CRED dark theme (complete)
│   └── pages/
│       ├── auth.js                      ← Login + registration flow
│       ├── swap.js                      ← QR scan + swap confirmation + success
│       ├── home.js                      ← Dashboard, quick stats, battery status
│       ├── stations.js                  ← Station finder, pod grid, Google Maps link
│       ├── history.js                   ← Swap timeline
│       └── profile.js                   ← User profile, KYC status
└── provider-app/src/
    ├── main.js                          ← Agent routing, AGENT const, overlay nav
    └── pages/
        ├── home.js                      ← My Customers + New Requests sections
        ├── customerDetail.js            ← Customer view + 2-step approval sheet
        ├── register.js                  ← Agent-side new customer registration
        ├── confirmation.js              ← Post-registration confirmation
        └── resubmit.js                  ← Fix & resubmit rejected KYC
```

---

## Running the Project

```bash
# Terminal 1 — API
npx json-server --watch db.json --port 3001

# Terminal 2 — Admin Dashboard
cd src && npx vite --port 5173

# Terminal 3 — Provider App
cd provider-app && npm run dev   # :5174

# Terminal 4 — User App
cd user-app && npm run dev       # :5175
```
