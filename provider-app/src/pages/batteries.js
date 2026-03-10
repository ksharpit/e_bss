// ============================================
// Provider Batteries Page - View all batteries
// Shows unallocated, station, and deployed batteries
// ============================================
import { apiFetch } from '../utils/apiFetch.js';
import { showToast } from '../utils/toast.js';

const statusConfig = {
  stock:     { label: 'In Stock',  icon: 'inventory_2', color: '#64748b', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.20)' },
  available: { label: 'Available', icon: 'check_circle', color: '#16a34a', bg: 'rgba(22,163,74,0.10)',   border: 'rgba(22,163,74,0.20)' },
  charging:  { label: 'Charging',  icon: 'bolt',         color: '#d97706', bg: 'rgba(217,119,6,0.10)',   border: 'rgba(217,119,6,0.20)' },
  deployed:  { label: 'Deployed',  icon: 'person',       color: '#D4654A', bg: 'rgba(212,101,74,0.10)',  border: 'rgba(212,101,74,0.20)' },
  in_use:    { label: 'In Use',    icon: 'person',       color: '#D4654A', bg: 'rgba(212,101,74,0.10)',  border: 'rgba(212,101,74,0.20)' },
  'in-use':  { label: 'In Use',    icon: 'person',       color: '#D4654A', bg: 'rgba(212,101,74,0.10)',  border: 'rgba(212,101,74,0.20)' },
  fault:     { label: 'Fault',     icon: 'warning',      color: '#dc2626', bg: 'rgba(220,38,38,0.10)',   border: 'rgba(220,38,38,0.20)' },
};

function socColor(soc) {
  if (soc >= 70) return '#16a34a';
  if (soc >= 30) return '#d97706';
  return '#dc2626';
}

function socLabel(soc) {
  if (soc >= 70) return 'Good';
  if (soc >= 30) return 'Medium';
  return 'Low';
}

function timeSince(iso) {
  if (!iso) return '';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export async function renderBatteries(container) {
  container.innerHTML = `<div class="loading">Loading batteries...</div>`;

  let batteries = [], stations = [], users = [];
  try {
    [batteries, stations, users] = await Promise.all([
      apiFetch('/batteries').then(r => r.json()),
      apiFetch('/stations').then(r => r.json()),
      apiFetch('/users').then(r => r.json()),
    ]);
  } catch {
    showToast('Cannot reach API', 'error');
    container.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">cloud_off</span><p class="empty-title">API unavailable</p></div>`;
    return;
  }

  // Build lookups
  const stationMap = {};
  stations.forEach(s => { stationMap[s.id] = s; });
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  // Sort: batteries with recent telemetry first, then by createdAt
  batteries.sort((a, b) => {
    const aTime = a.lastTelemetry || a.createdAt || '';
    const bTime = b.lastTelemetry || b.createdAt || '';
    return bTime > aTime ? 1 : bTime < aTime ? -1 : 0;
  });

  // Counts
  const stock     = batteries.filter(b => b.status === 'stock').length;
  const available = batteries.filter(b => b.status === 'available').length;
  const charging  = batteries.filter(b => b.status === 'charging').length;
  const deployed  = batteries.filter(b => b.status === 'deployed' || b.status === 'in_use' || b.status === 'in-use').length;
  const fault     = batteries.filter(b => b.status === 'fault').length;

  container.innerHTML = `
    <!-- Hero Stats -->
    <div class="hero-card fade-up">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">
        <div>
          <p class="hero-greeting">
            <span class="material-symbols-outlined" style="font-size:11px;vertical-align:middle;font-variation-settings:'FILL' 1">battery_full</span>
            Battery Inventory
          </p>
          <h2 class="hero-name">${batteries.length} Batteries</h2>
          <p class="hero-zone">${stock} unallocated · ${available + charging} at stations</p>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 10px;text-align:center;border:1px solid rgba(255,255,255,0.12)">
          <p style="font-size:1.125rem;font-weight:900;color:#fff;line-height:1">${stock}</p>
          <p style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px">Stock</p>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-val">${available}</div>
          <div class="hero-stat-lbl">Available</div>
        </div>
        <div class="hero-divider"></div>
        <div class="hero-stat">
          <div class="hero-stat-val" style="color:#fde68a">${charging}</div>
          <div class="hero-stat-lbl">Charging</div>
        </div>
        <div class="hero-divider"></div>
        <div class="hero-stat">
          <div class="hero-stat-val" style="color:#86efac">${deployed}</div>
          <div class="hero-stat-lbl">Deployed</div>
        </div>
        ${fault > 0 ? `
        <div class="hero-divider"></div>
        <div class="hero-stat">
          <div class="hero-stat-val" style="color:#fca5a5">${fault}</div>
          <div class="hero-stat-lbl">Fault</div>
        </div>` : ''}
      </div>
    </div>

    <!-- Search + Filters -->
    <div class="fade-up" style="margin-bottom:14px;animation-delay:0.05s">
      <div class="search-wrap">
        <span class="material-symbols-outlined">search</span>
        <input id="bat-search" class="search-input" type="search" placeholder="Search battery ID, station..." />
      </div>
      <div class="filter-tabs">
        ${[
          { label: 'All',       filter: 'all',       count: batteries.length },
          { label: 'Stock',     filter: 'stock',     count: stock },
          { label: 'Available', filter: 'available', count: available },
          { label: 'Charging',  filter: 'charging',  count: charging },
          { label: 'Deployed',  filter: 'deployed',  count: deployed },
          ...(fault > 0 ? [{ label: 'Fault', filter: 'fault', count: fault }] : []),
        ].map((t, i) => `<button class="filter-tab ${i === 0 ? 'active' : ''}" data-filter="${t.filter}">${t.label} <span style="opacity:0.6">${t.count}</span></button>`).join('')}
      </div>
    </div>

    <!-- Battery List -->
    <div class="section-label fade-up" style="animation-delay:0.07s">All Batteries</div>
    <div class="card" style="overflow:hidden;margin-bottom:18px" id="bat-list-card">
      ${renderList(batteries, 'all', stationMap, userMap)}
    </div>
  `;

  // Filtering
  const listCard = document.getElementById('bat-list-card');
  const searchInput = document.getElementById('bat-search');
  let activeFilter = 'all';

  function applyFilters() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    let filtered = [...batteries];
    if (activeFilter !== 'all') {
      if (activeFilter === 'deployed') {
        filtered = filtered.filter(b => b.status === 'deployed' || b.status === 'in_use' || b.status === 'in-use');
      } else {
        filtered = filtered.filter(b => b.status === activeFilter);
      }
    }
    if (q) {
      filtered = filtered.filter(b =>
        b.id.toLowerCase().includes(q) ||
        (b.stationName || '').toLowerCase().includes(q) ||
        (b.deviceId || '').toLowerCase().includes(q) ||
        (stationMap[b.stationId]?.name || '').toLowerCase().includes(q)
      );
    }
    listCard.innerHTML = renderList(filtered, activeFilter, stationMap, userMap);
  }

  searchInput?.addEventListener('input', applyFilters);

  container.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });
}

function renderList(batteries, filter, stationMap, userMap) {
  if (!batteries.length) {
    const msgs = {
      all: 'No batteries found',
      stock: 'No batteries in stock',
      available: 'No available batteries',
      charging: 'No batteries charging',
      deployed: 'No deployed batteries',
      fault: 'No faulty batteries',
    };
    return `<div class="empty-state"><span class="material-symbols-outlined">battery_unknown</span><p class="empty-title">${msgs[filter] || msgs.all}</p></div>`;
  }

  return batteries.map(b => {
    const st = statusConfig[b.status] || statusConfig.stock;
    const soc = Number(b.soc) || 0;

    // Location info
    let location = '';
    if (b.status === 'deployed' || b.status === 'in_use' || b.status === 'in-use') {
      const user = userMap[b.assignedTo];
      location = user ? user.name : (b.assignedTo || 'Customer');
    } else if (b.stationId && stationMap[b.stationId]) {
      location = stationMap[b.stationId].name;
    } else if (b.stationName) {
      location = b.stationName;
    } else {
      location = 'Warehouse';
    }

    const liveAge = timeSince(b.lastTelemetry);
    const isLive = b.lastTelemetry && (Date.now() - new Date(b.lastTelemetry).getTime()) < 300000;

    return `
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border);transition:background 0.15s;cursor:default"
         onmouseover="this.style.background='rgba(0,0,0,0.02)'" onmouseout="this.style.background='transparent'">
      <!-- Battery icon with status dot -->
      <div style="position:relative;flex-shrink:0">
        <div style="width:42px;height:42px;border-radius:12px;background:${st.bg};border:1px solid ${st.border};display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:20px;color:${st.color};font-variation-settings:'FILL' 1">battery_full</span>
        </div>
        ${isLive ? `<div style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #fff"></div>` : ''}
      </div>

      <!-- Battery info -->
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          <span style="font-size:14px;font-weight:800;color:var(--text);font-family:monospace">${b.id}</span>
          ${b.deviceId ? `<span style="font-size:9px;font-weight:700;color:var(--text-soft);font-family:monospace;background:rgba(0,0,0,0.04);padding:1px 5px;border-radius:4px">DI:${b.deviceId}</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-soft)">
          <span class="material-symbols-outlined" style="font-size:13px">${b.status === 'deployed' ? 'person' : b.stationId ? 'ev_station' : 'warehouse'}</span>
          ${location}
        </div>
        ${liveAge ? `<div style="font-size:10px;color:${isLive ? '#22c55e' : 'var(--text-soft)'};margin-top:2px;display:flex;align-items:center;gap:3px">
          ${isLive ? '<span style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block"></span>' : ''}
          ${isLive ? 'Live' : 'Last'}: ${liveAge}
        </div>` : ''}
      </div>

      <!-- SOC + Status -->
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
        <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;background:${st.bg};color:${st.color};border:1px solid ${st.border}">
          <span class="material-symbols-outlined" style="font-size:11px">${st.icon}</span> ${st.label}
        </span>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:40px;height:4px;background:rgba(0,0,0,0.06);border-radius:99px;overflow:hidden">
            <div style="width:${soc}%;height:100%;background:${socColor(soc)};border-radius:99px"></div>
          </div>
          <span style="font-size:12px;font-weight:800;color:${socColor(soc)}">${soc}%</span>
        </div>
        <span style="font-size:9px;color:var(--text-soft)">Health: ${Number(b.health || 0).toFixed(0)}%</span>
      </div>
    </div>`;
  }).join('');
}
