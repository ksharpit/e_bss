// ============================================
// Dashboard Page (Widget Redesign)
// Bento grid with widget cards inspired by modern financial dashboards
// ============================================
import { mockRevenueDaily } from '../data/mockData.js';
import { API_BASE } from '../config.js';
import { renderConcentricChart, highlightConcentricRing, resetConcentricChart } from '../components/revenueChart.js';
import { icon } from '../components/icons.js';
import { formatNumber } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

export async function renderDashboard(container) {
  const today = new Date();
  const dayNum = today.getDate();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });

  // Fetch real data from API
  let activeBatteries  = 0;
  let availableCount   = 0;
  let chargingCount    = 0;
  let batteryHealthPct = 0;
  let recentSwaps      = [];
  let alertActivities  = [];
  let verificationActivities = [];
  let stations         = [];
  let allSwaps         = [];
  try {
    const [batteries, swaps, verifiedUsers, stationsData] = await Promise.all([
      fetch(`${API_BASE}/batteries`).then(r => r.json()),
      fetch(`${API_BASE}/swaps`).then(r => r.json()),
      fetch(`${API_BASE}/users?kycStatus=verified`).then(r => r.json()),
      fetch(`${API_BASE}/stations`).then(r => r.json()),
    ]);
    stations = stationsData;
    allSwaps = swaps;
    activeBatteries   = batteries.filter(b => b.status !== 'fault').length;
    availableCount    = batteries.filter(b => b.status === 'available').length;
    chargingCount     = batteries.filter(b => b.status === 'charging').length;
    batteryHealthPct  = +((activeBatteries / batteries.length) * 100).toFixed(1);
    recentSwaps       = swaps
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);
    // Build alert items from fault batteries
    alertActivities = batteries.filter(b => b.status === 'fault').map(b => ({
      type: 'alert', iconName: 'warning',
      html: `Battery fault detected: <b>${b.id}</b> at <b>${b.stationName || 'Warehouse'}</b>`,
      time: 'Active',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    }));
    // Build verification items from recently verified users
    verificationActivities = verifiedUsers
      .filter(u => u.onboardedAt)
      .sort((a, b) => new Date(b.onboardedAt) - new Date(a.onboardedAt))
      .slice(0, 5)
      .map(u => ({
        type: 'verification', iconName: 'verified_user',
        html: `<b>${u.name}</b> KYC verified — <b>${u.batteryId || 'battery pending'}</b> allocated`,
        time: new Date(u.onboardedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        timestamp: u.onboardedAt,
        userId: u.id,
      }));
  } catch { /* fall back to mock values above */ }

  // Add maintenance station alerts
  alertActivities.push(
    ...stations.filter(s => s.status === 'maintenance').map(s => ({
      type: 'alert', iconName: 'build',
      html: `<b>${s.name}</b> is currently in maintenance mode`,
      time: 'Active',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    }))
  );

  // Combine swap + alert activities, newest first
  const swapActivities = recentSwaps.map(s => ({
    type: 'swap', iconName: 'swap_horiz',
    html: `<b>${s.userId}</b> swapped at <b>${s.stationName}</b> - ${s.batteryIn} issued`,
    time: new Date(s.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    timestamp: s.timestamp,
    stationId: s.stationId,
  }));
  const activities = [...swapActivities, ...alertActivities, ...verificationActivities]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  // Compute derived values from real station data
  const totalStations = stations.length;
  const onlineCount   = stations.filter(s => s.status === 'online').length;
  const totalPods     = stations.reduce((a, s) => a + (s.pods || 0), 0);
  const avgUptime     = totalStations > 0
    ? +(stations.reduce((a, s) => a + (s.uptime || 0), 0) / totalStations).toFixed(1)
    : 0;

  // Swaps today/yesterday from real swap records
  const todayDateStr     = new Date().toISOString().slice(0, 10);
  const yesterdayDateStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const todaySwapsList   = allSwaps.filter(s => s.timestamp?.startsWith(todayDateStr));
  const yesterdaySwapList = allSwaps.filter(s => s.timestamp?.startsWith(yesterdayDateStr));
  const swapsToday       = todaySwapsList.length;
  const totalRevenue     = swapsToday * 65; // Real: swap count × ₹65

  // Compute per-station revenue from real swap records
  stations.forEach(st => {
    const stSwapsToday = todaySwapsList.filter(s => s.stationId === st.id);
    st._revToday = stSwapsToday.length * 65;
  });
  const swapGrowth       = yesterdaySwapList.length > 0
    ? +(((swapsToday - yesterdaySwapList.length) / yesterdaySwapList.length) * 100).toFixed(1)
    : 0;
  const swapGrowthAbs    = Math.abs(swapGrowth);

  const uptimeCircumference = 2 * Math.PI * 42;
  const uptimeOffset = uptimeCircumference - (uptimeCircumference * avgUptime / 100);
  const swapGrowthCirc = 2 * Math.PI * 34;
  const swapGrowthOffset = swapGrowthCirc - (swapGrowthCirc * Math.min(swapGrowthAbs, 100) / 100);

  // Energy dispensed today (kWh) — 2 kWh per swap
  const energyToday    = (swapsToday * 2).toFixed(1);
  const energyCapacity = totalPods * 2 * 3;   // daily capacity: pods * 2 kWh * 3 cycles
  const energyPct      = Math.min(100, Math.round((energyToday / energyCapacity) * 100));

  // Mini bar data for revenue widget
  const miniBars = mockRevenueDaily.slice(-12).map(d => d.total);
  const maxBar = Math.max(...miniBars);

  container.innerHTML = `
    <!-- Greeting Row -->
    <div class="greeting-row">
      <div class="greeting-left">
        <div class="greeting-date-circle">${dayNum}</div>
        <div class="greeting-day-info">
          <span class="greeting-day-name">${dayName},</span>
          <span class="greeting-month">${monthName}</span>
        </div>
        <button class="greeting-cta" id="show-tasks-btn">
          Show Alerts ${icon('arrow_forward', '18px')}
        </button>
      </div>
      <div class="greeting-right">
        <div class="greeting-title">Hey, Welcome back! 👋</div>
        <div class="greeting-subtitle">Here's your BSS overview for today.</div>
      </div>
    </div>

    <!-- Main Widget Grid (Row 1: 4 widgets) -->
    <div class="widget-grid">
      
      <!-- Widget 1: Total Stations -->
      <div class="widget-card">
        <div class="widget-header">
          <div class="widget-icon">
            ${icon('ev_station', '22px')}
          </div>
          <div class="widget-badge">
            ${icon('radio_button_checked', '10px')} ${onlineCount} Online
          </div>
        </div>
        <div class="widget-value">${totalStations}</div>
        <div class="widget-label">Total Stations</div>
        <div class="widget-sublabel">Active in Bengaluru region</div>
        <div class="widget-actions">
          <button class="widget-action-btn widget-action-btn-fill" onclick="location.hash='#stations'">View All</button>
          <button class="widget-action-btn widget-action-btn-outline" onclick="location.hash='#swap'">Swap</button>
        </div>
      </div>

      <!-- Widget 2: Revenue Today -->
      <div class="widget-card" style="cursor:pointer" onclick="location.hash='#revenue'" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div class="widget-header">
          <div class="widget-icon">
            ${icon('payments', '22px')}
          </div>
          <div class="widget-badge">Today</div>
        </div>
        <div class="widget-value">₹${formatNumber(totalRevenue)}</div>
        <div class="widget-label">Revenue Today</div>
        <div class="mini-bars" id="revenue-mini-bars">
          ${miniBars.map(v => `<div class="mini-bar" style="height:${Math.max((v / maxBar) * 100, 8)}%;background:var(--accent);opacity:${0.4 + (v / maxBar) * 0.6}"></div>`).join('')}
        </div>
      </div>

      <!-- Widget 3: System Uptime (Dark Card) -->
      <div class="widget-card widget-card-dark" style="cursor:pointer" onclick="location.hash='#stations'" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div class="widget-header">
          <div class="widget-icon">
            ${icon('lock', '20px')}
          </div>
          <span style="font-size:var(--font-sm);color:rgba(255,255,255,0.5);font-weight:600">System Health</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;margin-top:0.25rem">
          <div class="circular-progress circular-progress-lg">
            <svg viewBox="0 0 100 100">
              <circle class="track" cx="50" cy="50" r="42" style="stroke:rgba(255,255,255,0.1)"/>
              <circle class="fill" cx="50" cy="50" r="42"
                stroke-dasharray="${uptimeCircumference}"
                stroke-dashoffset="${uptimeOffset}" />
            </svg>
            <div class="circular-progress-label">
              <div class="circular-progress-value" style="color:white">${avgUptime}%</div>
              <div class="circular-progress-unit" style="color:rgba(255,255,255,0.5)">uptime</div>
            </div>
          </div>
        </div>
        <div style="margin-top:0.5rem;text-align:center">
          <span style="font-size:var(--font-xs);color:rgba(255,255,255,0.4);font-weight:600">All systems nominal</span>
        </div>
      </div>

      <!-- Widget 4: Energy Dispensed -->
      <div class="widget-card" style="cursor:pointer" onclick="location.hash='#inventory'" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div class="widget-header">
          <div class="widget-icon">
            ${icon('electric_meter', '22px')}
          </div>
          <div class="widget-badge">Today</div>
        </div>
        <div class="widget-value">${energyToday}</div>
        <div class="widget-label">kWh Dispensed</div>
        <div style="margin-top:0.5rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:var(--font-xs);font-weight:600;color:var(--text-muted)">${energyPct}% of capacity</span>
          </div>
          <div style="height:6px;background:#f3f4f6;border-radius:var(--radius-full);overflow:hidden">
            <div style="height:100%;width:${energyPct}%;background:var(--accent);border-radius:var(--radius-full);transition:width 0.6s ease"></div>
          </div>
        </div>
      </div>

      <!-- Widget 5: Active Batteries -->
      <div class="widget-card" style="cursor:pointer" onclick="location.hash='#inventory'" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div class="widget-header">
          <div class="widget-icon">
            ${icon('battery_charging_full', '22px')}
          </div>
          <div class="widget-badge">${icon('trending_up', '12px')} ${batteryHealthPct}%</div>
        </div>
        <div class="widget-value">${activeBatteries}</div>
        <div class="widget-label">Active Batteries</div>
        <div style="margin-top:0.5rem;display:flex;gap:0.5rem">
          <span style="font-size:var(--font-xs);padding:3px 8px;border-radius:var(--radius-full);background:var(--color-success-bg);color:var(--color-success);font-weight:700">Available: ${availableCount}</span>
          <span style="font-size:var(--font-xs);padding:3px 8px;border-radius:var(--radius-full);background:var(--accent-light);color:var(--accent);font-weight:700">Charging: ${chargingCount}</span>
        </div>
      </div>

      <!-- Widget 6: Swaps Today -->
      <div class="widget-card" style="cursor:pointer" onclick="location.hash='#swap'" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div class="widget-header">
          <div class="widget-icon">
            ${icon('swap_horiz', '22px')}
          </div>
          <span style="font-size:var(--font-sm);color:var(--text-muted);font-weight:600">Today</span>
        </div>
        <div style="display:flex;align-items:center;gap:1rem">
          <div>
            <div class="widget-value">${swapsToday}</div>
            <div class="widget-label">Swaps Today</div>
          </div>
          <div class="circular-progress" style="width:60px;height:60px">
            <svg viewBox="0 0 80 80" style="width:60px;height:60px">
              <circle class="track" cx="40" cy="40" r="34"/>
              <circle class="fill" cx="40" cy="40" r="34"
                stroke-dasharray="${swapGrowthCirc}"
                stroke-dashoffset="${swapGrowthOffset}" />
            </svg>
            <div class="circular-progress-label">
              <div class="circular-progress-value" style="font-size:var(--font-sm);color:${swapGrowth >= 0 ? 'var(--color-success)' : 'var(--color-error, #ef4444)'}">${swapGrowth >= 0 ? '+' : ''}${swapGrowth}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Widget 7: Total Energy (Accent Card) -->
      <div class="widget-card widget-card-accent" style="cursor:pointer" onclick="location.hash='#stations'" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div class="widget-header">
          <div class="widget-icon">
            ${icon('bolt', '22px')}
          </div>
        </div>
        <div class="widget-value">${totalPods}</div>
        <div class="widget-label">Total Pods Active</div>
        <div style="margin-top:0.5rem;font-size:var(--font-sm);color:rgba(255,255,255,0.8);font-weight:500">${onlineCount === totalStations ? 'All stations operational' : `${onlineCount}/${totalStations} stations online`}</div>
      </div>

    </div>

    <!-- Row 1.5: Station Locations Map -->
    <div class="widget-card" style="padding:1.25rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <div class="card-title" style="display:flex;align-items:center;gap:8px">
          <span style="background:rgba(212,101,74,0.10);padding:4px;border-radius:6px;display:flex">${icon('map', '18px', 'color:#D4654A')}</span>
          Station Locations
        </div>
        <button onclick="location.hash='#stations'" style="background:none;border:none;cursor:pointer;color:#D4654A;font-size:var(--font-sm);font-weight:600;display:flex;align-items:center;gap:4px">${icon('arrow_forward', '14px', 'color:#D4654A')} View All</button>
      </div>
      <div id="dashboard-station-map" style="width:100%;height:220px;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;z-index:1"></div>
    </div>

    <!-- Row 2: Station Revenue + Activity Manager -->
    <div class="widget-grid" style="grid-template-columns: 1fr 1fr;align-items:stretch">

      <!-- Station Revenue: Chart + Per-Station Breakdown -->
      <div class="widget-card" style="padding:1.25rem">
        <div class="widget-header" style="margin-bottom:1rem">
          <div class="card-title">Station Revenue</div>
          <div class="time-tabs">
            <button class="time-tab active">24H</button>
            <button class="time-tab">7D</button>
            <button class="time-tab">30D</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:center">
          <div style="aspect-ratio:1;max-height:240px;margin:0 auto;width:100%">
            <canvas id="dashboard-concentric-chart"></canvas>
          </div>
          <div class="station-rev-list" style="display:flex;flex-direction:column;gap:0.75rem">
            ${(() => {
              const totalRev = stations.reduce((sum, st) => sum + (st._revToday || 0), 0);
              const isZero = totalRev === 0;
              return [...stations].sort((a, b) => (b._revToday || 0) - (a._revToday || 0)).map((s, i) => {
                const maxRev = Math.max(...stations.map(st => st._revToday || 0), 1);
                const pct = maxRev > 0 ? Math.round(((s._revToday || 0) / maxRev) * 100) : 0;
                const share = totalRev > 0 ? Math.round(((s._revToday || 0) / totalRev) * 100) : 0;
                const colors = ['#D4654A', 'rgba(212,101,74,0.7)', 'rgba(212,101,74,0.45)', 'rgba(212,101,74,0.25)', 'rgba(212,101,74,0.12)'];
                const zeroColors = ['rgba(212,101,74,0.18)', 'rgba(212,101,74,0.14)', 'rgba(212,101,74,0.10)', 'rgba(212,101,74,0.08)', 'rgba(212,101,74,0.06)'];
                const dotColor = isZero ? zeroColors[i] : colors[i];
                const barColor = isZero ? zeroColors[i] : colors[i];
                const barWidth = isZero ? Math.max(12, 60 - i * 10) : pct;
                const nameColor = isZero ? 'var(--text-muted)' : 'var(--text-primary)';
                const valColor = isZero ? '#cbd5e1' : 'var(--text-primary)';
                const pctColor = isZero ? '#d1d5db' : 'var(--text-muted)';
                return `
                <div class="station-rev-row" data-station-index="${i}" data-station-id="${s.id}" style="cursor:pointer;padding:0.5rem 0.625rem;border-radius:var(--radius-md);transition:all 0.2s ease">
                  <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:5px">
                    <span style="width:10px;height:10px;border-radius:3px;background:${dotColor};flex-shrink:0"></span>
                    <span style="font-size:var(--font-sm);font-weight:600;color:${nameColor};flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</span>
                    <span style="font-size:var(--font-sm);font-weight:700;color:${valColor}">₹${((s._revToday || 0) / 1000).toFixed(1)}K</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:0.5rem">
                    <div style="flex:1;height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden">
                      <div style="height:100%;width:${barWidth}%;background:${barColor};border-radius:3px;transition:width 0.6s ease"></div>
                    </div>
                    <span style="font-size:var(--font-xs);font-weight:700;color:${pctColor};min-width:28px;text-align:right">${share}%</span>
                  </div>
                </div>`;
              }).join('');
            })()}
            <div style="padding-top:0.5rem;border-top:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:var(--font-sm);font-weight:600;color:var(--text-muted)">Total Today</span>
              <span style="font-size:var(--font-base);font-weight:700;color:${totalRevenue === 0 ? '#cbd5e1' : 'var(--text-primary)'}">₹${formatNumber(totalRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Manager -->
      <div class="activity-section">
        <div class="activity-header">
          <div class="activity-title">Activity Manager</div>
          <button style="background:none;border:none;cursor:pointer;color:var(--text-muted);display:flex;align-items:center;gap:4px;font-size:var(--font-sm);font-weight:600">
            ${icon('tune', '16px')} Filters
          </button>
        </div>
        <div class="activity-filters">
          <div class="activity-filter active" data-filter="swap">Swaps <span class="close-x">×</span></div>
          <div class="activity-filter active" data-filter="alert">Alerts <span class="close-x">×</span></div>
          <div class="activity-filter active" data-filter="verification">Verifications <span class="close-x">×</span></div>
          <div class="activity-filter" data-filter="today">Today <span class="close-x">×</span></div>
        </div>
        <ul class="activity-list" id="activity-list">
          ${activities.length === 0
            ? `<li style="padding:1.5rem;text-align:center;color:#94a3b8;font-size:var(--font-sm)">No recent activity</li>`
            : activities.map(a => `
                <li class="activity-item" data-type="${a.type}" data-timestamp="${a.timestamp}"
                    ${a.stationId ? `style="cursor:pointer" onclick="location.hash='#station/${a.stationId}'"` : a.userId ? `style="cursor:pointer" onclick="location.hash='#user-detail/${a.userId}'"` : ''}>
                  <div class="activity-icon ${a.type}">
                    ${icon(a.iconName, '18px')}
                  </div>
                  <div class="activity-content">
                    <div class="activity-text">${a.html}</div>
                  </div>
                  <div class="activity-time">${a.time}</div>
                </li>`).join('')
          }
        </ul>
      </div>
    </div>

    <footer class="app-footer">
      ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#9ca3af')}
      Electica Enterprise Dashboard © 2024
    </footer>
  `;

  // Render charts
  setTimeout(() => {
    renderConcentricChart('dashboard-concentric-chart', stations);
  }, 100);

  // Station locations map
  initDashboardMap(stations);

  // Wire station revenue row hover ↔ chart sync
  const revRows = container.querySelectorAll('.station-rev-row');
  revRows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      const idx = parseInt(row.dataset.stationIndex);
      revRows.forEach(r => {
        if (r === row) {
          r.style.background = 'var(--accent-light)';
          r.style.transform = 'scale(1.02)';
        } else {
          r.style.opacity = '0.4';
        }
      });
      highlightConcentricRing(idx);
    });
    row.addEventListener('mouseleave', () => {
      revRows.forEach(r => {
        r.style.background = '';
        r.style.transform = '';
        r.style.opacity = '';
      });
      resetConcentricChart();
    });
    row.addEventListener('click', () => {
      location.hash = '#station/' + row.dataset.stationId;
    });
  });

  // Wire time tabs
  container.querySelectorAll('.time-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tab.closest('.time-tabs').querySelectorAll('.time-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      showToast(`Showing ${tab.textContent} data`, 'info');
    });
  });

  // Wire activity filters — real type-based filtering
  function applyActivityFilters() {
    const active = new Set(
      [...container.querySelectorAll('.activity-filter.active')].map(c => c.dataset.filter)
    );
    const todayStr = new Date().toISOString().slice(0, 10);
    container.querySelectorAll('#activity-list .activity-item').forEach(item => {
      const typeMatch = active.has(item.dataset.type);
      const dateMatch = !active.has('today') || (item.dataset.timestamp || '').startsWith(todayStr);
      item.style.display = (typeMatch && dateMatch) ? '' : 'none';
    });
  }
  container.querySelectorAll('.activity-filter').forEach(f => {
    f.addEventListener('click', () => {
      f.classList.toggle('active');
      applyActivityFilters();
    });
  });

  // Show alerts — scroll to activity manager with only alerts filter active
  document.getElementById('show-tasks-btn')?.addEventListener('click', () => {
    const section = container.querySelector('.activity-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Activate only the alerts filter
      container.querySelectorAll('.activity-filter').forEach(f => {
        if (f.dataset.filter === 'alert') f.classList.add('active');
        else f.classList.remove('active');
      });
      applyActivityFilters();
    }
  });

}

function initDashboardMap(stations) {
  const stationCoords = stations.map(s => ({
    lat: s.lat, lng: s.lng, name: s.name, status: s.status,
  }));

  function createMap() {
    const L = window.L;
    const mapEl = document.getElementById('dashboard-station-map');
    if (!mapEl) return;
    mapEl.innerHTML = '';
    const bounds = stationCoords.map(s => [s.lat, s.lng]);
    const map = L.map(mapEl, { zoomControl: false }).fitBounds(bounds, { padding: [20, 20] });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    stationCoords.forEach(s => {
      const clr = s.status === 'online' ? '#D4654A' : '#f59e0b';
      const html = `<div style="width:20px;height:20px;background:${clr};border:2.5px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.25)"></div>`;
      const markerIcon = L.divIcon({ html, className: '', iconSize: [20, 20], iconAnchor: [10, 20] });
      L.marker([s.lat, s.lng], { icon: markerIcon }).addTo(map)
        .bindPopup(`<b style="color:#0f172a">${s.name}</b>`);
    });
  }

  if (window.L) { createMap(); return; }
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css'; link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  if (!document.getElementById('leaflet-js')) {
    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = createMap;
    document.head.appendChild(script);
  } else {
    document.getElementById('leaflet-js').addEventListener('load', createMap);
  }
}

