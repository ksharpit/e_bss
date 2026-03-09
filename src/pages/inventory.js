// ============================================
// Battery Inventory Page (Electica) - Flex-Row Design
// Matches Users page layout pattern
// ============================================
import { icon, ICONS } from '../components/icons.js';
import { apiFetch } from '../utils/apiFetch.js';
import { downloadCsv } from '../utils/csv.js';

/* ── Status config ── */
const statusConfig = {
  deployed:  { label: 'Deployed',  bg: 'rgba(212,101,74,0.10)', color: '#D4654A', border: 'rgba(212,101,74,0.25)', dot: '#D4654A' },
  available: { label: 'Available', bg: 'rgba(212,101,74,0.06)', color: '#c75a3f', border: 'rgba(212,101,74,0.18)', dot: '#c75a3f' },
  charging:  { label: 'Charging',  bg: 'rgba(212,101,74,0.06)', color: '#D4654A', border: 'rgba(212,101,74,0.18)', dot: '#e8856c' },
  in_use:    { label: 'In Use',    bg: 'rgba(212,101,74,0.10)', color: '#D4654A', border: 'rgba(212,101,74,0.25)', dot: '#D4654A' },
  'in-use':  { label: 'In Use',    bg: 'rgba(212,101,74,0.10)', color: '#D4654A', border: 'rgba(212,101,74,0.25)', dot: '#D4654A' },
  stock:     { label: 'In Stock',  bg: 'rgba(148,163,184,0.10)', color: '#64748b', border: 'rgba(148,163,184,0.20)', dot: '#94a3b8' },
  fault:     { label: 'Fault',     bg: 'rgba(180,60,40,0.08)',   color: '#b43c28', border: 'rgba(180,60,40,0.20)',   dot: '#b43c28' },
  retired:   { label: 'Retired',   bg: 'rgba(148,163,184,0.08)', color: '#64748b', border: 'rgba(148,163,184,0.18)', dot: '#94a3b8' },
};

/* ── SOC bar color (coral palette) ── */
function socBarColor(soc) {
  if (soc >= 70) return '#D4654A';
  if (soc >= 30) return '#c75a3f';
  return '#b43c28';
}

/* ── Single battery row ── */
function rowHTML(b) {
  const st = statusConfig[b.status] || statusConfig.stock;
  const swapCount = b._swapCount ?? b.cycleCount ?? 0;

  // Location display
  let locationMain, locationSub;
  if (b.status === 'deployed') {
    locationMain = b._userName || b.assignedTo || '-';
    locationSub = b._userPhone || '';
  } else if (b.status === 'stock') {
    locationMain = 'Warehouse';
    locationSub = 'Unallocated';
  } else {
    locationMain = b._stationName || b.stationName || '-';
    locationSub = b.stationId || '';
  }

  return `
  <div class="bat-row" data-bat-id="${b.id}"
       style="display:flex;align-items:center;gap:14px;padding:10px 1.25rem;border-bottom:1px solid var(--border-light);cursor:pointer;transition:all 0.15s"
       onmouseover="this.style.background='var(--bg-hover-row)';this.querySelector('.bat-chevron').style.opacity='1'" onmouseout="this.style.background='transparent';this.querySelector('.bat-chevron').style.opacity='0.3'">
    <!-- Battery ID + Status -->
    <div style="min-width:120px;flex:1">
      <p style="font-size:var(--font-base);font-weight:700;color:var(--text-primary);letter-spacing:-0.01em;font-family:monospace">${b.id}</p>
      <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
        <span style="display:inline-flex;align-items:center;gap:3px;padding:1px 7px;border-radius:var(--radius-full);font-size:10px;font-weight:700;background:${st.bg};color:${st.color};border:1px solid ${st.border}">
          <span style="width:4px;height:4px;border-radius:50%;background:${st.dot}"></span>${st.label}
        </span>
        ${b.deviceId ? `<span style="font-size:9px;font-weight:700;color:#94a3b8;font-family:monospace">DI:${b.deviceId}</span>` : ''}
      </div>
    </div>
    <!-- Location / User -->
    <div style="min-width:130px;flex:1.2">
      <p style="font-size:var(--font-sm);font-weight:600;color:var(--text-primary)">${locationMain}</p>
      <p style="font-size:10px;color:var(--text-label);margin-top:1px">${locationSub}</p>
    </div>
    <!-- SOC -->
    <div style="min-width:100px;flex:0.8">
      <div style="display:flex;align-items:center;gap:6px">
        <div style="flex:1;height:5px;background:var(--border-light);border-radius:99px;overflow:hidden;max-width:60px">
          <div style="width:${b.soc}%;height:100%;background:${socBarColor(b.soc)};border-radius:99px;transition:width 0.4s"></div>
        </div>
        <span style="font-size:var(--font-sm);font-weight:700;color:var(--text-primary)">${b.soc}%</span>
      </div>
      <p style="font-size:9px;font-weight:600;color:var(--text-label);text-transform:uppercase;letter-spacing:0.04em;margin-top:1px">SOC</p>
    </div>
    <!-- Health -->
    <div style="min-width:55px;text-align:center">
      <p style="font-size:var(--font-md);font-weight:800;color:${b.health >= 90 ? '#D4654A' : b.health >= 70 ? '#c75a3f' : '#b43c28'}">${b.health}%</p>
      <p style="font-size:9px;font-weight:600;color:var(--text-label);text-transform:uppercase;letter-spacing:0.04em">Health</p>
    </div>
    <!-- Swaps -->
    <div style="min-width:50px;text-align:center">
      <p style="font-size:var(--font-md);font-weight:800;color:var(--text-primary)">${swapCount}</p>
      <p style="font-size:9px;font-weight:600;color:var(--text-label);text-transform:uppercase;letter-spacing:0.04em">Swaps</p>
    </div>
    <!-- Cycles -->
    <div style="min-width:50px;text-align:center">
      <p style="font-size:var(--font-md);font-weight:800;color:var(--text-primary)">${b.cycleCount || 0}</p>
      <p style="font-size:9px;font-weight:600;color:var(--text-label);text-transform:uppercase;letter-spacing:0.04em">Cycles</p>
    </div>
    <!-- Chevron -->
    <span class="material-symbols-outlined bat-chevron" style="font-size:16px;color:var(--text-muted);opacity:0.3;transition:opacity 0.15s;flex-shrink:0">chevron_right</span>
  </div>`;
}

/* ── Filter button helper ── */
function filterBtn(val, label, count) {
  return `<button class="bat-filter-btn" data-filter="${val}"
    style="padding:5px 14px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;cursor:pointer;border:1.5px solid transparent;transition:all 0.15s;background:rgba(212,101,74,0.06);color:#D4654A">
    ${label} <span style="opacity:0.6">(${count})</span>
  </button>`;
}

/* ── Attach row click events ── */
function attachEvents(container) {
  container.querySelectorAll('.bat-row').forEach(row => {
    row.addEventListener('click', () => { location.hash = '#battery-detail/' + row.dataset.batId; });
  });
}

/* ── Filter + render logic ── */
function filterBatteries(batteries, status, search) {
  let filtered = [...batteries];
  if (status && status !== 'all') {
    if (status === 'fault') {
      filtered = filtered.filter(b => b.status === 'fault' || b.status === 'retired');
    } else {
      filtered = filtered.filter(b => b.status === status);
    }
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(b =>
      b.id.toLowerCase().includes(q) ||
      (b._userName || '').toLowerCase().includes(q) ||
      (b._stationName || '').toLowerCase().includes(q) ||
      (b.stationName || '').toLowerCase().includes(q) ||
      (b.assignedTo || '').toLowerCase().includes(q)
    );
  }
  return filtered;
}

/* ── Main render ── */
export async function renderInventory(container) {
  container.innerHTML = `<div style="padding:3rem;text-align:center;color:#94a3b8;font-size:var(--font-md)">Loading inventory...</div>`;

  let batteries = [], users = [], swaps = [], stations = [];
  try {
    [batteries, users, swaps, stations] = await Promise.all([
      apiFetch('/batteries').then(r => r.json()),
      apiFetch('/users').then(r => r.json()),
      apiFetch('/swaps').then(r => r.json()),
      apiFetch('/stations').then(r => r.json()),
    ]);
  } catch {
    const { mockBatteries } = await import('../data/mockData.js');
    batteries = mockBatteries;
  }

  // Build lookups
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });
  const stationMap = {};
  stations.forEach(s => { stationMap[s.id] = s; });

  // Enrich batteries
  batteries.forEach(b => {
    if (b.assignedTo && userMap[b.assignedTo]) {
      b._userName = userMap[b.assignedTo].name;
      b._userPhone = userMap[b.assignedTo].phone;
    }
    if (b.stationId && stationMap[b.stationId]) {
      b._stationName = stationMap[b.stationId].name;
    }
    b._swapCount = swaps.filter(s => s.batteryOut === b.id || s.batteryIn === b.id).length;
  });

  const deployed  = batteries.filter(b => b.status === 'deployed').length;
  const available = batteries.filter(b => b.status === 'available').length;
  const charging  = batteries.filter(b => b.status === 'charging').length;
  const stock     = batteries.filter(b => b.status === 'stock').length;
  const fault     = batteries.filter(b => b.status === 'fault' || b.status === 'retired').length;
  const atStation = available + charging;

  container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">
      <div class="page-header">
        <div>
          <h1 class="page-title">Battery Inventory</h1>
          <p class="page-desc">${batteries.length} total · ${atStation} at stations · ${deployed} with customers · ${stock} in stock</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" id="add-battery-btn" style="display:flex;align-items:center;gap:6px">${icon(ICONS.plus || 'add', '16px')} Add Battery</button>
          <button class="btn btn-outline" id="inventory-export-btn" style="display:flex;align-items:center;gap:6px">${icon(ICONS.download)} Export CSV</button>
        </div>
      </div>

      <div class="rev-kpi-grid" style="grid-template-columns:repeat(6,1fr);margin-bottom:1.25rem">
        <div class="rev-kpi-card">
          <div class="rev-kpi-decor"></div>
          <p class="rev-kpi-label">Total Batteries</p>
          <h2 class="rev-kpi-value">${batteries.length}</h2>
          <span class="rev-badge rev-badge-track">All Units</span>
        </div>
        <div class="rev-kpi-card">
          <p class="rev-kpi-label">With Customers</p>
          <h2 class="rev-kpi-value">${deployed}</h2>
          <span class="rev-badge rev-badge-up">Deployed</span>
        </div>
        <div class="rev-kpi-card">
          <p class="rev-kpi-label">Available</p>
          <h2 class="rev-kpi-value">${available}</h2>
          <span class="rev-badge rev-badge-up">Ready</span>
        </div>
        <div class="rev-kpi-card">
          <p class="rev-kpi-label">Charging</p>
          <h2 class="rev-kpi-value">${charging}</h2>
          <span class="rev-badge" style="background:rgba(212,101,74,0.08);color:#D4654A">At Station</span>
        </div>
        <div class="rev-kpi-card">
          <p class="rev-kpi-label">In Stock</p>
          <h2 class="rev-kpi-value">${stock}</h2>
          <span class="rev-badge rev-badge-track">Warehouse</span>
        </div>
        <div class="rev-kpi-card">
          <p class="rev-kpi-label">Fault / Retired</p>
          <h2 class="rev-kpi-value">${fault}</h2>
          <span class="rev-badge rev-badge-down">${fault} units</span>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <!-- Toolbar -->
        <div style="padding:0.75rem 1.25rem;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <h3 style="font-size:var(--font-md);font-weight:700;color:var(--text-primary);margin-right:auto;display:flex;align-items:center;gap:8px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#D4654A;font-variation-settings:'FILL' 1">battery_full</span>
            All Batteries
          </h3>

          <div style="position:relative">
            <span class="material-symbols-outlined" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--text-label)">search</span>
            <input id="battery-search" type="text" placeholder="Search ID, station, user…"
              style="padding:7px 12px 7px 34px;border:1px solid var(--border-color);border-radius:var(--radius-full);font-size:var(--font-sm);color:var(--text-primary);background:var(--bg-input);width:220px;outline:none;font-family:inherit;transition:border-color 0.15s,box-shadow 0.15s"
              onfocus="this.style.borderColor='#D4654A';this.style.boxShadow='0 0 0 3px rgba(212,101,74,0.08)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
          </div>

          <div style="display:flex;gap:5px;background:var(--bg-table-head);border-radius:var(--radius-full);padding:3px;border:1px solid var(--border-light)">
            ${filterBtn('all',       'All',       batteries.length)}
            ${filterBtn('deployed',  'Deployed',  deployed)}
            ${filterBtn('available', 'Available', available)}
            ${filterBtn('charging',  'Charging',  charging)}
            ${filterBtn('stock',     'Stock',     stock)}
            ${filterBtn('fault',     'Fault',     fault)}
          </div>
        </div>

        <!-- Column Headers -->
        <div style="display:flex;align-items:center;gap:14px;padding:7px 1.25rem;background:var(--bg-table-head);border-bottom:1px solid var(--border-light)">
          <span style="min-width:120px;flex:1;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Battery</span>
          <span style="min-width:130px;flex:1.2;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Location / User</span>
          <span style="min-width:100px;flex:0.8;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">SOC</span>
          <span style="min-width:55px;text-align:center;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Health</span>
          <span style="min-width:50px;text-align:center;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Swaps</span>
          <span style="min-width:50px;text-align:center;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Cycles</span>
          <span style="width:16px;flex-shrink:0"></span>
        </div>

        <div id="battery-table-body">${batteries.map(rowHTML).join('')}</div>

        <div id="battery-empty" style="display:none;padding:2.5rem;text-align:center;color:#94a3b8">
          <span class="material-symbols-outlined" style="font-size:32px;display:block;margin-bottom:8px">search_off</span>
          No batteries match your search
        </div>
      </div>
    </div>
  `;

  attachEvents(container);

  let activeFilter = 'all';

  function applyFilter() {
    const query = document.getElementById('battery-search').value.trim().toLowerCase();
    const filtered = filterBatteries(batteries, activeFilter, query);
    document.getElementById('battery-table-body').innerHTML = filtered.map(rowHTML).join('');
    document.getElementById('battery-empty').style.display = filtered.length === 0 ? 'block' : 'none';
    attachEvents(container);
  }

  document.getElementById('battery-search').addEventListener('input', applyFilter);

  container.querySelectorAll('.bat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      container.querySelectorAll('.bat-filter-btn').forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = '#D4654A';
      applyFilter();
    });
  });

  // Activate "All" filter by default
  container.querySelector('.bat-filter-btn[data-filter="all"]').style.borderColor = '#D4654A';

  // Export CSV
  document.getElementById('inventory-export-btn')?.addEventListener('click', () => {
    const headers = ['Battery ID', 'Status', 'SOC %', 'Health %', 'Cycles', 'Swaps', 'Location/User', 'Station'];
    const rows = batteries.map(b => [
      b.id,
      b.status,
      b.soc,
      b.health,
      b.cycleCount || 0,
      b._swapCount || 0,
      b.status === 'deployed' ? (b._userName || b.assignedTo || '') : (b._stationName || b.stationId || 'Warehouse'),
      b._stationName || b.stationName || '',
    ]);
    downloadCsv('battery-inventory', headers, rows);
  });

  // Add Battery - onboarding modal
  document.getElementById('add-battery-btn')?.addEventListener('click', () => {
    // Generate next battery ID
    const nums = batteries.map(b => parseInt(b.id.replace('BAT-', ''), 10)).filter(n => !isNaN(n));
    const nextNum = nums.length ? Math.max(...nums) + 1 : 1;
    const nextId = `BAT-${String(nextNum).padStart(4, '0')}`;

    const overlay = document.createElement('div');
    overlay.id = 'add-battery-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px)';
    overlay.innerHTML = `
      <div style="width:440px;max-width:92vw;background:white;border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,0.2);overflow:hidden;animation:cardIn 0.3s ease-out">
        <div style="padding:24px 28px 0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <div>
              <h2 style="font-size:18px;font-weight:800;color:#1e293b">Onboard New Battery</h2>
              <p style="font-size:12px;color:#94a3b8;margin-top:2px">Register a physical battery into the system</p>
            </div>
            <button id="close-add-battery" style="background:none;border:none;cursor:pointer;padding:4px;border-radius:8px;transition:background 0.15s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
              <span class="material-symbols-outlined" style="font-size:20px;color:#94a3b8">close</span>
            </button>
          </div>

          <div style="display:flex;flex-direction:column;gap:16px">
            <div>
              <label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:5px">Battery ID</label>
              <input id="new-bat-id" type="text" value="${nextId}" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:monospace;font-weight:700;color:#1e293b;background:#f8fafc;outline:none;box-sizing:border-box" />
            </div>
            <div>
              <label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:5px">BMS Device ID <span style="color:#D4654A">*</span></label>
              <input id="new-bat-device-id" type="number" placeholder="e.g. 1 (DI field from BMS)" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;color:#1e293b;background:white;outline:none;box-sizing:border-box;transition:border-color 0.15s" onfocus="this.style.borderColor='#D4654A'" onblur="this.style.borderColor='#e2e8f0'" />
              <p style="font-size:10px;color:#94a3b8;margin-top:4px">Physical hardware ID printed on the BMS board or QR label</p>
            </div>
            <div>
              <label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:5px">Assign to Station</label>
              <select id="new-bat-station" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;color:#1e293b;background:white;outline:none;box-sizing:border-box;cursor:pointer">
                <option value="">None (warehouse stock)</option>
                ${stations.map(s => `<option value="${s.id}">${s.name} (${s.id})</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:5px">Initial Status</label>
              <select id="new-bat-status" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;color:#1e293b;background:white;outline:none;box-sizing:border-box;cursor:pointer">
                <option value="stock">Stock (warehouse)</option>
                <option value="available">Available (at station)</option>
                <option value="charging">Charging</option>
              </select>
            </div>
          </div>
        </div>

        <div id="add-bat-error" style="display:none;margin:12px 28px 0;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#ef4444;font-size:13px;font-weight:500"></div>

        <div style="padding:20px 28px;display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button id="cancel-add-battery" class="btn btn-outline" style="padding:10px 20px">Cancel</button>
          <button id="confirm-add-battery" class="btn btn-primary" style="padding:10px 24px;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px">add</span> Onboard Battery
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();
    document.getElementById('close-add-battery').addEventListener('click', closeModal);
    document.getElementById('cancel-add-battery').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    document.getElementById('confirm-add-battery').addEventListener('click', async () => {
      const batId = document.getElementById('new-bat-id').value.trim();
      const deviceId = document.getElementById('new-bat-device-id').value.trim();
      const stationId = document.getElementById('new-bat-station').value;
      const status = document.getElementById('new-bat-status').value;
      const errorEl = document.getElementById('add-bat-error');

      if (!batId) { errorEl.textContent = 'Battery ID is required'; errorEl.style.display = 'block'; return; }
      if (!deviceId) { errorEl.textContent = 'BMS Device ID is required for MQTT telemetry'; errorEl.style.display = 'block'; return; }

      // Check for duplicate device ID
      if (batteries.some(b => String(b.deviceId) === deviceId)) {
        errorEl.textContent = `Device ID ${deviceId} is already registered to another battery`;
        errorEl.style.display = 'block';
        return;
      }

      const btn = document.getElementById('confirm-add-battery');
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;animation:spin 1s linear infinite">progress_activity</span> Saving...';

      try {
        const stName = stationId ? stations.find(s => s.id === stationId)?.name || '' : null;
        const body = {
          id: batId,
          deviceId: parseInt(deviceId, 10),
          stationId: stationId || null,
          stationName: stName,
          status,
          assignedTo: null,
          soc: 0,
          health: 100,
          cycleCount: 0,
          temperature: 0,
        };

        const res = await apiFetch('/batteries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create battery');
        }

        closeModal();
        const { showToast } = await import('../utils/toast.js');
        showToast(`Battery ${batId} onboarded (Device ID: ${deviceId})`, 'success');
        renderInventory(container); // refresh
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">add</span> Onboard Battery';
      }
    });
  });
}
