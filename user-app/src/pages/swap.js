// ============================================
// Swap - QR Scan + Battery Swap Flow
// ============================================
import { showToast } from '../utils/toast.js';
import { API_BASE } from '../config.js';

const MOCK_DIST = { 'BSS-001': '0.8', 'BSS-002': '3.2', 'BSS-003': '7.1', 'BSS-004': '9.4', 'BSS-005': '2.1' };
const SWAP_FEE  = 65; // INR per swap (consistent with existing data)

export async function renderScan(container, userId, setTab) {
  // Load data
  let user = null, stations = [], batteries = [];
  try {
    [user, stations, batteries] = await Promise.all([
      fetch(`${API_BASE}/users/${userId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/stations`).then(r => r.json()),
      fetch(`${API_BASE}/batteries`).then(r => r.json()),
    ]);
  } catch {
    showToast('Cannot reach API', 'error');
  }

  if (!user) {
    container.innerHTML = `<div class="scan-page"><div class="loading">User not found.</div></div>`;
    return;
  }

  // Build per-station available battery map
  const stationBats = {};
  batteries.forEach(b => {
    if (!b.stationId) return;
    if (!stationBats[b.stationId]) stationBats[b.stationId] = [];
    if (b.status === 'available') stationBats[b.stationId].push(b);
  });

  const onlineStations = stations.filter(s => s.status === 'online');

  showQrScanner(container, user, onlineStations, stationBats, batteries, setTab);
}

// ── QR Scanner View ───────────────────────────────────────
function showQrScanner(container, user, onlineStations, stationBats, batteries, setTab) {
  container.innerHTML = `
    <div class="scan-page">
      <div class="scan-page-top">
        <p class="scan-title">Scan Station QR</p>
        <p class="scan-sub">Point your camera at the QR code on the station</p>
      </div>

      <!-- Animated viewfinder -->
      <div class="qr-viewfinder-wrap">
        <div class="qr-viewfinder">
          <div class="qr-corner tl"></div>
          <div class="qr-corner tr"></div>
          <div class="qr-corner bl"></div>
          <div class="qr-corner br"></div>
          <div class="qr-scan-line"></div>
          <div class="qr-inner">
            <span class="material-symbols-outlined">qr_code_2</span>
          </div>
        </div>
      </div>

      <!-- Demo station selector -->
      <div class="scan-demo-sheet">
        <p class="scan-demo-label">Demo - Select a Station</p>

        ${!user.batteryId ? `
        <div class="scan-no-battery">
          <span class="material-symbols-outlined">warning</span>
          No battery allocated to your account yet. Contact your provider.
        </div>` : ''}

        ${onlineStations.map(s => {
          const avail = stationBats[s.id]?.length || 0;
          const dist  = MOCK_DIST[s.id];
          return `
          <button class="scan-station-btn ${!user.batteryId ? 'disabled' : ''}"
            data-station="${s.id}" ${!user.batteryId ? 'disabled' : ''}>
            <div class="scan-station-icon">
              <span class="material-symbols-outlined">ev_station</span>
            </div>
            <div class="scan-station-info">
              <div class="scan-station-name">${s.name}</div>
              <div class="scan-station-loc">${s.location}${dist ? ' · ' + dist + ' km' : ''}</div>
            </div>
            ${avail > 0
              ? `<span class="scan-avail-chip">${avail} ready</span>`
              : `<span style="font-size:10px;font-weight:700;color:var(--text-soft)">Full</span>`}
          </button>`;
        }).join('')}

        ${onlineStations.length === 0 ? `
        <div style="text-align:center;padding:28px 0">
          <span class="material-symbols-outlined" style="font-size:36px;color:var(--text-soft);opacity:0.25;display:block;margin-bottom:8px">ev_station</span>
          <p style="font-size:var(--font-sm);color:var(--text-soft);font-weight:600">No online stations found</p>
        </div>` : ''}
      </div>
    </div>
  `;

  if (!user.batteryId) return;

  container.querySelectorAll('.scan-station-btn[data-station]').forEach(btn => {
    btn.addEventListener('click', () => {
      const stationId = btn.dataset.station;
      const station   = { id: stationId, ...getStationById(stationId, container) };
      const avail     = stationBats[stationId] || [];

      if (avail.length === 0) {
        showToast('No charged batteries available at this station', 'warning');
        return;
      }

      // Find user's current battery
      const userBat = batteries.find(b => b.id === user.batteryId);
      const newBat  = avail[0];

      showSwapConfirmation(container, user, station, userBat, newBat, batteries, setTab);
    });
  });
}

function getStationById(id, container) {
  // Re-extract from button text as fallback
  const btn = container.querySelector(`.scan-station-btn[data-station="${id}"]`);
  return {
    name: btn?.querySelector('.scan-station-name')?.textContent || id,
    location: btn?.querySelector('.scan-station-loc')?.textContent?.split('·')[0]?.trim() || '',
  };
}

// ── Swap Confirmation Sheet ───────────────────────────────
function showSwapConfirmation(container, user, station, userBat, newBat, batteries, setTab) {
  // Fetch full station data for name
  fetch(`${API_BASE}/stations/${station.id}`)
    .then(r => r.ok ? r.json() : { name: station.name, location: station.location, id: station.id })
    .then(fullStation => {
      buildSwapSheet(container, user, fullStation, userBat, newBat, batteries, setTab);
    })
    .catch(() => buildSwapSheet(container, user, station, userBat, newBat, batteries, setTab));
}

function buildSwapSheet(container, user, station, userBat, newBat, batteries, setTab) {
  // Remove any existing overlay
  document.getElementById('swap-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'swap-overlay';
  overlay.className = 'swap-overlay';

  const oldSocColor = userBat ? (userBat.soc > 60 ? '#10b981' : userBat.soc > 30 ? '#f59e0b' : '#ef4444') : '#94a3b8';
  const newSocColor = '#10b981';

  overlay.innerHTML = `
    <div class="swap-sheet">
      <div class="swap-handle"></div>
      <div class="swap-header">
        <span class="swap-header-title">Confirm Battery Swap</span>
        <button class="swap-close" id="swap-close-btn">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Station info -->
      <div style="padding:14px 20px 0;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border-light);padding-bottom:14px">
        <div style="width:38px;height:38px;border-radius:12px;background:var(--gold-light);border:1px solid var(--gold-border);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span class="material-symbols-outlined" style="font-size:19px;color:var(--gold);font-variation-settings:'FILL' 1">ev_station</span>
        </div>
        <div>
          <div style="font-size:var(--font-sm);font-weight:800;color:var(--text)">${station.name}</div>
          <div style="font-size:var(--font-xs);color:var(--text-soft);font-weight:500">${station.location || ''}</div>
        </div>
        <span style="margin-left:auto;font-size:10px;font-weight:800;color:var(--gold);background:var(--gold-light);border:1px solid var(--gold-border);padding:2px 9px;border-radius:999px">Scanned</span>
      </div>

      <!-- Battery flow diagram -->
      <div class="swap-flow">
        <div class="swap-box from">
          <span class="swap-box-icon material-symbols-outlined">battery_low</span>
          <div class="swap-box-label">Your Battery</div>
          <div class="swap-box-id">${userBat?.id || '-'}</div>
          <div class="swap-box-soc">${userBat ? userBat.soc + '% charged' : 'N/A'}</div>
        </div>
        <div class="swap-arrow">
          <span class="material-symbols-outlined">swap_horiz</span>
        </div>
        <div class="swap-box to">
          <span class="swap-box-icon material-symbols-outlined">battery_full</span>
          <div class="swap-box-label">New Battery</div>
          <div class="swap-box-id">${newBat?.id || '-'}</div>
          <div class="swap-box-soc">${newBat ? newBat.soc + '% charged' : 'N/A'}</div>
        </div>
      </div>

      <!-- Swap details -->
      <div class="swap-details">
        <div class="swap-row">
          <span class="swap-row-label">
            <span class="material-symbols-outlined">health_and_safety</span>
            Battery Health
          </span>
          <span class="swap-row-value" style="color:var(--primary-dark)">${newBat?.health || '--'}% Good</span>
        </div>
        <div class="swap-row">
          <span class="swap-row-label">
            <span class="material-symbols-outlined">payments</span>
            Payment Method
          </span>
          <span class="swap-row-value">UPI / Wallet</span>
        </div>
        <div class="swap-row">
          <span class="swap-row-label">
            <span class="material-symbols-outlined">receipt</span>
            Swap Fee
          </span>
          <span class="swap-row-value total">INR ${SWAP_FEE}</span>
        </div>
      </div>

      <button class="swap-pay-btn" id="swap-pay-btn">
        <span class="material-symbols-outlined">currency_rupee</span>
        Pay INR ${SWAP_FEE} and Swap
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('swap-close-btn')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('swap-pay-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('swap-pay-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Processing payment...`;

    try {
      const txnId = await processSwap(user, station, userBat, newBat);
      overlay.remove();
      showSwapSuccess(container, user, station, userBat, newBat, setTab, txnId);
    } catch (err) {
      showToast('Swap failed - ' + (err.message || 'please try again'), 'error');
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">currency_rupee</span> Pay INR ${SWAP_FEE} and Swap`;
    }
  });
}

// ── Process Swap (API calls) ──────────────────────────────
async function processSwap(user, station, oldBat, newBat) {
  const now = new Date().toISOString();
  const txnId = 'TXN-SW-' + Date.now();

  // 1. Create swap record
  const swapRes = await fetch(`${API_BASE}/swaps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'SWP-' + Date.now(),
      userId: user.id,
      stationId: station.id,
      stationName: station.name,
      batteryOut: oldBat?.id || null,
      batteryIn: newBat?.id || null,
      timestamp: now,
      amount: SWAP_FEE,
      transactionId: txnId,
      status: 'completed',
      type: 'swap',
    }),
  });
  if (!swapRes.ok) throw new Error('Failed to create swap record — check json-server');

  // 2. Update old battery - return to station for charging
  if (oldBat) {
    await fetch(`${API_BASE}/batteries/${oldBat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stationId: station.id,
        stationName: station.name,
        status: 'charging',
        assignedTo: null,
        soc: oldBat.soc,
        lastSwap: now,
      }),
    });
  }

  // 3. Update new battery - deploy to user
  if (newBat) {
    await fetch(`${API_BASE}/batteries/${newBat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stationId: null,
        stationName: null,
        status: 'deployed',
        assignedTo: user.id,
        lastSwap: now,
      }),
    });
  }

  // 4. Update user record
  await fetch(`${API_BASE}/users/${user.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batteryId: newBat?.id || user.batteryId,
      swapCount: (user.swapCount || 0) + 1,
      totalSpent: (user.totalSpent || 0) + SWAP_FEE,
      lastSwap: now,
    }),
  });

  return txnId;
}

// ── Success Screen ────────────────────────────────────────
function showSwapSuccess(container, user, station, oldBat, newBat, setTab, txnId) {
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  container.innerHTML = `
    <div class="swap-success-page">
      <div class="swap-success-glow"></div>

      <div class="swap-success-ring">
        <span class="material-symbols-outlined">check_circle</span>
      </div>

      <p class="swap-success-title">Swap Successful!</p>
      <p class="swap-success-sub">Your new battery is ready. Enjoy the ride!</p>

      <div class="swap-success-card">
        <div class="swap-success-row">
          <span class="swap-success-row-label">Station</span>
          <span class="swap-success-row-value">${station.name}</span>
        </div>
        <div class="swap-success-row">
          <span class="swap-success-row-label">New Battery</span>
          <span class="swap-success-row-value">${newBat?.id || '-'}</span>
        </div>
        <div class="swap-success-row">
          <span class="swap-success-row-label">Charge</span>
          <span class="swap-success-row-value" style="color:#34d399">${newBat?.soc || '--'}%</span>
        </div>
        <div class="swap-success-row">
          <span class="swap-success-row-label">Amount Paid</span>
          <span class="swap-success-row-value">INR ${SWAP_FEE}</span>
        </div>
        <div class="swap-success-row">
          <span class="swap-success-row-label">Time</span>
          <span class="swap-success-row-value">Today, ${now}</span>
        </div>
        <div class="swap-success-row">
          <span class="swap-success-row-label">Txn ID</span>
          <span class="swap-success-row-value" style="font-family:monospace;font-size:11px">${txnId}</span>
        </div>
      </div>

      <button class="swap-home-btn" id="go-home-btn">
        <span class="material-symbols-outlined">home</span>
        Go to Home
      </button>
    </div>
  `;

  document.getElementById('go-home-btn')?.addEventListener('click', () => setTab('home'));
}
