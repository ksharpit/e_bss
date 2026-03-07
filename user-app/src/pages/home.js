// ============================================
// Home - Battery Dashboard
// ============================================
import { showToast } from '../utils/toast.js';
import { apiFetch } from '../utils/apiFetch.js';

const MOCK_DIST = { 'BSS-001': '0.8', 'BSS-002': '3.2', 'BSS-003': '7.1', 'BSS-004': '9.4', 'BSS-005': '2.1' };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return 'Today, ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function fmtDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export async function renderHome(container, userId, setTab) {
  container.innerHTML = `
    <div class="hero-dark">
      <div class="loading">Loading your battery...</div>
    </div>`;

  let user = null, battery = null, stations = [], recentSwaps = [], allBatteries = [];
  try {
    [user, stations, allBatteries] = await Promise.all([
      apiFetch(`/users/${userId}`).then(r => r.ok ? r.json() : null),
      apiFetch('/stations').then(r => r.json()),
      apiFetch('/batteries').then(r => r.json()),
    ]);
    if (user?.batteryId) {
      [battery, recentSwaps] = await Promise.all([
        apiFetch(`/batteries/${user.batteryId}`).then(r => r.ok ? r.json() : null),
        apiFetch(`/swaps?userId=${userId}`).then(r => r.json()).then(arr => arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3)),
      ]);
    }
  } catch {
    showToast('Cannot reach API - check json-server on :3001', 'error');
  }

  if (!user) {
    container.innerHTML = `<div class="hero-dark"><div class="loading">User not found. Check USER_ID in main.js.</div></div>`;
    return;
  }

  // Compute nearest station with available batteries
  const onlineStations = stations.filter(s => s.status === 'online');
  const stationAvail = {};
  allBatteries.forEach(b => {
    if (b.stationId) {
      if (!stationAvail[b.stationId]) stationAvail[b.stationId] = { available: 0, charging: 0, fault: 0 };
      if (b.status === 'available') stationAvail[b.stationId].available++;
      else if (b.status === 'charging') stationAvail[b.stationId].charging++;
      else if (b.status === 'fault') stationAvail[b.stationId].fault++;
    }
  });

  // Sort by mocked distance, prioritise stations with available batteries
  const sortedStations = [...onlineStations].sort((a, b) => {
    const av = (stationAvail[a.id]?.available || 0) > 0 ? 0 : 1;
    const bv = (stationAvail[b.id]?.available || 0) > 0 ? 0 : 1;
    if (av !== bv) return av - bv;
    return parseFloat(MOCK_DIST[a.id] || 99) - parseFloat(MOCK_DIST[b.id] || 99);
  });
  const nearest = sortedStations[0];
  const nearestAvail = nearest ? (stationAvail[nearest.id]?.available || 0) : 0;

  container.innerHTML = `
    <!-- Dark Hero with Battery Gauge -->
    <div class="hero-dark">
      <div class="hero-top-row">
        <div>
          <p class="hero-greeting-text">${greeting()}</p>
          <p class="hero-user-name">${user.name.split(' ')[0]}</p>
        </div>
        <div class="online-chip">
          <span class="online-dot"></span> Live
        </div>
      </div>

      ${battery ? `
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;margin:8px 0 14px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);position:relative;z-index:1">
        <span class="material-symbols-outlined" style="font-size:20px;color:var(--gold);font-variation-settings:'FILL' 1">two_wheeler</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--font-sm);font-weight:700;color:rgba(255,255,255,0.85);letter-spacing:-0.01em">${user.vehicle}</div>
          <div style="font-size:var(--font-xs);color:rgba(255,255,255,0.35);margin-top:1px">${battery.id} · Last swap ${fmtDate(battery.lastSwap)}</div>
        </div>
        <div style="padding:4px 10px;border-radius:20px;background:rgba(34,211,164,0.12);border:1px solid rgba(34,211,164,0.2)">
          <span style="font-size:var(--font-xs);font-weight:800;color:#22D3A4">${battery.soc}%</span>
        </div>
      </div>` : `
      <div style="text-align:center;padding:28px 20px;position:relative;z-index:1">
        <span class="material-symbols-outlined" style="font-size:40px;color:rgba(255,255,255,0.12);display:block;margin-bottom:8px">battery_unknown</span>
        <p style="color:rgba(255,255,255,0.30);font-size:var(--font-sm);font-weight:600">No battery allocated yet</p>
      </div>`}

      <button class="swap-cta" id="home-swap-cta">
        <span class="material-symbols-outlined">qr_code_scanner</span>
        Scan QR to Swap
        <span class="material-symbols-outlined" style="margin-left:auto;opacity:0.7">arrow_forward</span>
      </button>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats fade-up">
      <div class="quick-stat">
        <div class="quick-stat-icon" style="background:var(--gold-light)">
          <span class="material-symbols-outlined" style="color:var(--gold)">swap_horiz</span>
        </div>
        <div>
          <div class="quick-stat-val">${user.swapCount ?? 0}</div>
          <div class="quick-stat-lbl">Total Swaps</div>
        </div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-icon" style="background:var(--gold-light)">
          <span class="material-symbols-outlined" style="color:var(--gold)">currency_rupee</span>
        </div>
        <div>
          <div class="quick-stat-val">₹${(user.totalSpent ?? 0).toLocaleString('en-IN')}</div>
          <div class="quick-stat-lbl">Total Spent</div>
        </div>
      </div>
    </div>

    ${battery ? `
    <!-- Battery Card -->
    <div class="section fade-up-2">
      <div class="batt-card">
        <div style="padding:22px 20px 18px;display:flex;align-items:center;gap:16px;position:relative;z-index:2">
          <!-- SVG Ring -->
          <div style="position:relative;width:86px;height:86px;flex-shrink:0">
            <svg class="batt-ring-glow" viewBox="0 0 86 86" style="width:86px;height:86px;transform:rotate(-90deg)">
              <circle cx="43" cy="43" r="34" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="7"/>
              <circle class="batt-ring-fill" cx="43" cy="43" r="34" fill="none" stroke="url(#homeSocGrad)" stroke-width="7" stroke-linecap="round"
                      stroke-dasharray="${Math.round(2 * Math.PI * 34)}" stroke-dashoffset="${Math.round(2 * Math.PI * 34 * (1 - battery.soc / 100))}"/>
              <defs>
                <linearGradient id="homeSocGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#22D3A4"/>
                  <stop offset="50%" stop-color="#7dd8b5"/>
                  <stop offset="100%" stop-color="#D4B878"/>
                </linearGradient>
              </defs>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <span id="batt-soc-num" style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.03em;line-height:1">0%</span>
              <span style="font-size:7.5px;font-weight:700;color:rgba(255,255,255,0.30);text-transform:uppercase;letter-spacing:0.1em;margin-top:2px">Charge</span>
            </div>
          </div>
          <!-- Range + Bar -->
          <div style="flex:1">
            <div style="font-size:var(--font-xs);color:rgba(255,255,255,0.35);font-weight:600;margin-bottom:3px;letter-spacing:0.03em">${battery.id}</div>
            <div style="display:flex;align-items:baseline;gap:5px;margin-bottom:10px">
              <span class="batt-range-num" id="batt-range-num">0</span>
              <span style="font-size:var(--font-sm);font-weight:700;color:rgba(255,255,255,0.40)">km range</span>
            </div>
            <div class="batt-bar-wrap">
              <div class="batt-bar-fill" id="batt-bar-fill" style="width:0%"></div>
            </div>
          </div>
        </div>
        <!-- Stats Footer -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid rgba(255,255,255,0.06);padding:14px 0;position:relative;z-index:2">
          <div style="text-align:center;border-right:1px solid rgba(255,255,255,0.06)">
            <div style="font-size:var(--font-xs);color:rgba(255,255,255,0.30);font-weight:600;margin-bottom:4px">Health</div>
            <div class="batt-stat-val" style="color:#22D3A4">${battery.health}%</div>
          </div>
          <div style="text-align:center;border-right:1px solid rgba(255,255,255,0.06)">
            <div style="font-size:var(--font-xs);color:rgba(255,255,255,0.30);font-weight:600;margin-bottom:4px">Cycles</div>
            <div class="batt-stat-val" style="color:#D4B878">${battery.cycleCount || '-'}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:var(--font-xs);color:rgba(255,255,255,0.30);font-weight:600;margin-bottom:4px">Max Range</div>
            <div class="batt-stat-val" style="color:rgba(255,255,255,0.65)">75 km</div>
          </div>
        </div>
      </div>
    </div>` : ''}

    <!-- Nearest Station -->
    ${nearest ? `
    <div class="section fade-up-2">
      <div class="section-header">
        <span class="section-title">Nearest Station</span>
        <span class="section-link" id="see-all-stations">See all</span>
      </div>
      <div class="station-card" id="nearest-station-card" data-lat="${nearest.lat}" data-lng="${nearest.lng}">
        <div class="station-card-top">
          <div>
            <div class="station-name">${nearest.name}</div>
            <div class="station-location">
              <span class="material-symbols-outlined">location_on</span>
              ${nearest.location}
            </div>
          </div>
          <div class="station-dist-chip">
            <span class="material-symbols-outlined">near_me</span>
            ${MOCK_DIST[nearest.id] || '?'} km
          </div>
        </div>
        <div class="station-avail-row">
          <div class="station-avail-count">
            <div class="station-avail-num">${nearestAvail}</div>
            <div>
              <div style="font-size:var(--font-xs);font-weight:700;color:var(--primary)">Available</div>
              <div class="station-avail-label">batteries ready</div>
            </div>
          </div>
          ${podGrid(stationAvail[nearest.id] || {}, nearest.pods)}
        </div>
        <div style="display:flex;align-items:center;gap:5px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border-light)">
          <span class="material-symbols-outlined" style="font-size:13px;color:var(--gold);font-variation-settings:'FILL' 1">directions</span>
          <span style="font-size:var(--font-xs);font-weight:700;color:var(--gold)">Get Directions in Google Maps</span>
          <span class="material-symbols-outlined" style="font-size:13px;color:var(--gold);margin-left:auto">open_in_new</span>
        </div>
      </div>
    </div>` : ''}

    <!-- Recent Swaps -->
    ${recentSwaps.length > 0 ? `
    <div class="section fade-up-3">
      <div class="section-header">
        <span class="section-title">Recent Activity</span>
        <span class="section-link" id="see-history">View all</span>
      </div>
      <div style="background:var(--card);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow-sm);overflow:hidden;margin-bottom:16px">
        ${recentSwaps.map((s, i) => `
        <div class="history-item">
          <div class="history-item-icon">
            <span class="material-symbols-outlined">swap_horiz</span>
          </div>
          <div style="flex:1;min-width:0">
            <div class="history-item-name">${s.stationName}</div>
            <div class="history-item-date">${fmtDateTime(s.timestamp)}</div>
          </div>
          <div>
            <div class="history-amount">₹${s.amount}</div>
            <div class="history-amount-sub">Completed</div>
          </div>
        </div>`).join('')}
      </div>
    </div>` : ''}
  `;

  document.getElementById('home-swap-cta')?.addEventListener('click', () => setTab('scan'));
  document.getElementById('see-all-stations')?.addEventListener('click', () => setTab('stations'));
  document.getElementById('see-history')?.addEventListener('click', () => setTab('history'));
  document.getElementById('nearest-station-card')?.addEventListener('click', () => {
    const card = document.getElementById('nearest-station-card');
    const lat  = card?.dataset.lat;
    const lng  = card?.dataset.lng;
    if (lat && lng) window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  });

  // Animate battery card: bar fill + number count-up
  if (battery) {
    const targetSoc   = battery.soc;
    const targetRange = Math.round(targetSoc * 0.75);
    const barEl       = document.getElementById('batt-bar-fill');
    const socEl       = document.getElementById('batt-soc-num');
    const rangeEl     = document.getElementById('batt-range-num');
    const duration    = 1400;
    let start = null;

    // Kick off bar width after a frame so the transition triggers
    requestAnimationFrame(() => { if (barEl) barEl.style.width = targetSoc + '%'; });

    // Count up SOC% and range
    function tick(ts) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const curSoc   = Math.round(ease * targetSoc);
      const curRange = Math.round(ease * targetRange);
      if (socEl)   socEl.textContent   = curSoc + '%';
      if (rangeEl) rangeEl.textContent = curRange;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
}

function podGrid(avail, totalPods) {
  const { available = 0, charging = 0, fault = 0 } = avail;
  const occupied = totalPods - available - charging - fault;
  const dots = [];
  for (let i = 0; i < available; i++) dots.push(`<div class="pod-dot available"></div>`);
  for (let i = 0; i < charging; i++) dots.push(`<div class="pod-dot charging"><span class="material-symbols-outlined">bolt</span></div>`);
  for (let i = 0; i < fault; i++) dots.push(`<div class="pod-dot fault"><span class="material-symbols-outlined">warning</span></div>`);
  for (let i = 0; i < Math.max(0, occupied); i++) dots.push(`<div class="pod-dot empty"></div>`);
  return `<div class="pod-grid">${dots.join('')}</div>`;
}
