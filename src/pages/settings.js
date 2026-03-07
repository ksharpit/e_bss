// ============================================
// Settings Page (Electica)
// ============================================
import { icon } from '../components/icons.js';
import { showToast } from '../utils/toast.js';
import { showNewStationModal } from '../components/header.js';

import { apiFetch, getAdminUser, setAdminUser } from '../utils/apiFetch.js';

// ── Station card builder ────────────────────
function stationCard(s) {
  const online = s.status === 'online';
  return `
  <div class="dm-card" data-id="${s.id}" data-type="stations"
    style="background:white;border-radius:16px;border:1px solid ${online ? '#e8e8e8' : '#fde68a'};padding:1.25rem;position:relative;overflow:hidden;transition:all 0.2s">
    ${online ? '<div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(212,101,74,0.06) 0%,transparent 70%);pointer-events:none"></div>' : ''}
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:40px;height:40px;background:${online ? 'rgba(212,101,74,0.10)' : '#fef9ec'};border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span class="material-symbols-outlined" style="font-size:20px;color:${online ? '#D4654A' : '#d97706'};font-variation-settings:'FILL' 1">ev_station</span>
        </div>
        <div>
          <h4 style="font-size:var(--font-md);font-weight:700;color:#1e293b;line-height:1.2">${s.name}</h4>
          <p style="font-size:11px;color:#94a3b8;display:flex;align-items:center;gap:3px;margin-top:2px">
            <span class="material-symbols-outlined" style="font-size:12px;color:#cbd5e1">location_on</span> ${s.location || 'No location'}
          </p>
        </div>
      </div>
      <span style="font-family:monospace;font-size:9px;font-weight:700;color:#D4654A;background:rgba(212,101,74,0.08);padding:3px 8px;border-radius:6px;border:1px solid rgba(212,101,74,0.18);flex-shrink:0">${s.id}</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <div style="flex:1;text-align:center;padding:8px 6px;background:#f8fafc;border-radius:10px;border:1px solid #f1f5f9">
        <p style="font-size:1.05rem;font-weight:800;color:#1e293b">${s.pods || 0}</p>
        <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em">Pods</p>
      </div>
      <div style="flex:1;text-align:center;padding:8px 6px;background:#f8fafc;border-radius:10px;border:1px solid #f1f5f9">
        <p style="font-size:1.05rem;font-weight:800;color:#1e293b">${s.uptime || 0}%</p>
        <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em">Uptime</p>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #f1f5f9">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">Status</span>
        <button class="dm-status-toggle" data-id="${s.id}" data-status="${s.status}"
          style="display:flex;align-items:center;gap:6px;padding:5px 14px;border-radius:var(--radius-full);border:1.5px solid ${online ? '#bbf7d0' : '#fde68a'};background:${online ? '#f0fdf4' : '#fef9ec'};cursor:pointer;transition:all 0.2s;font-family:inherit">
          <span style="width:7px;height:7px;border-radius:50%;background:${online ? '#22c55e' : '#f59e0b'};${online ? 'animation:pulse 2s infinite' : ''}"></span>
          <span style="font-size:11px;font-weight:700;color:${online ? '#16a34a' : '#d97706'}">${online ? 'Online' : 'Maintenance'}</span>
        </button>
      </div>
      <button class="dm-edit-station-btn" data-id="${s.id}"
        style="background:rgba(212,101,74,0.08);color:#D4654A;border:1px solid rgba(212,101,74,0.20);border-radius:10px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s;font-family:inherit"
        onmouseover="this.style.background='#D4654A';this.style.color='white'" onmouseout="this.style.background='rgba(212,101,74,0.08)';this.style.color='#D4654A'">
        <span class="material-symbols-outlined" style="font-size:14px">edit</span> Edit
      </button>
      <button class="dm-delete-btn" data-id="${s.id}" data-type="stations" data-label="${s.name}"
        style="background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:10px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s;font-family:inherit"
        onmouseover="this.style.background='#ef4444';this.style.color='white'" onmouseout="this.style.background='#fef2f2';this.style.color='#ef4444'">
        <span class="material-symbols-outlined" style="font-size:14px">delete</span> Remove
      </button>
    </div>
  </div>`;
}

// ── Battery list row ────────────────────────
function batteryListRow(b, userMap) {
  const statusConfig = {
    available: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Available' },
    charging:  { color: '#D4654A', bg: 'rgba(212,101,74,0.07)', border: 'rgba(212,101,74,0.20)', label: 'Charging' },
    in_use:    { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'In Use' },
    fault:     { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Fault' },
    deployed:  { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', label: 'Deployed' },
    retired:   { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'Retired' },
  };
  const cfg = statusConfig[b.status] || { color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', label: b.status };
  const user = b.assignedTo ? userMap[b.assignedTo] : null;
  const socColor = b.soc >= 70 ? '#16a34a' : b.soc >= 30 ? '#d97706' : '#ef4444';
  const isFault = b.status === 'fault' || b.status === 'retired';

  return `
  <div class="dm-card dm-list-item" data-id="${b.id}" data-type="batteries" data-status="${b.status}"
    style="background:white;border-radius:12px;border:1px solid ${isFault ? '#fecaca' : '#e8e8e8'};padding:12px 16px;display:flex;align-items:center;gap:14px;transition:all 0.15s">
    <div style="width:36px;height:36px;background:${cfg.bg};border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid ${cfg.border}">
      <span class="material-symbols-outlined" style="font-size:18px;color:${cfg.color};font-variation-settings:'FILL' 1">battery_full</span>
    </div>
    <div style="min-width:90px">
      <p style="font-size:var(--font-sm);font-weight:700;color:#1e293b;font-family:monospace">${b.id}</p>
      <span style="font-size:9px;font-weight:700;color:${cfg.color};text-transform:uppercase">${cfg.label}</span>
    </div>
    <div style="flex:1;display:flex;align-items:center;gap:6px">
      ${user
        ? `<span class="material-symbols-outlined" style="font-size:14px;color:#8b5cf6">person</span>
           <span style="font-size:var(--font-sm);color:#1e293b;font-weight:600">${user.name}</span>
           <span style="font-size:10px;color:#94a3b8;margin-left:2px">${user.phone || ''}</span>`
        : b.stationName
          ? `<span class="material-symbols-outlined" style="font-size:14px;color:#D4654A">ev_station</span>
             <span style="font-size:var(--font-sm);color:#1e293b;font-weight:600">${b.stationName}</span>
             <span style="font-size:10px;color:#94a3b8;margin-left:2px">${b.stationId || ''}</span>`
          : `<span class="material-symbols-outlined" style="font-size:14px;color:#cbd5e1">person</span>
             <span style="font-size:var(--font-sm);color:#94a3b8;font-weight:400">Not assigned</span>`
      }
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
      <div style="text-align:center;min-width:45px">
        <p style="font-size:var(--font-sm);font-weight:800;color:${socColor}">${b.soc ?? 0}%</p>
        <p style="font-size:8px;color:#94a3b8;font-weight:600">SOC</p>
      </div>
      <div style="text-align:center;min-width:45px">
        <p style="font-size:var(--font-sm);font-weight:700;color:#1e293b">${b.health ?? 0}%</p>
        <p style="font-size:8px;color:#94a3b8;font-weight:600">HEALTH</p>
      </div>
      ${isFault ? `
        <button class="dm-repair-btn" data-id="${b.id}"
          style="background:rgba(212,101,74,0.08);color:#D4654A;border:1px solid rgba(212,101,74,0.20);border-radius:8px;padding:5px 10px;font-size:10px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:3px;transition:all 0.15s;font-family:inherit"
          onmouseover="this.style.background='#D4654A';this.style.color='white'" onmouseout="this.style.background='rgba(212,101,74,0.08)';this.style.color='#D4654A'">
          <span class="material-symbols-outlined" style="font-size:13px">build</span> Repair
        </button>
      ` : ''}
      <button class="dm-delete-btn" data-id="${b.id}" data-type="batteries" data-label="${b.id}"
        style="background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:8px;padding:5px 10px;font-size:10px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:3px;transition:all 0.15s;font-family:inherit"
        onmouseover="this.style.background='#ef4444';this.style.color='white'" onmouseout="this.style.background='#fef2f2';this.style.color='#ef4444'">
        <span class="material-symbols-outlined" style="font-size:13px">delete</span> Remove
      </button>
    </div>
  </div>`;
}

// ── User list row ───────────────────────────
function userListRow(u) {
  const verified = u.kycStatus === 'verified';
  const initials = u.initials || (u.name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return `
  <div class="dm-card dm-list-item" data-id="${u.id}" data-type="users"
    style="background:white;border-radius:12px;border:1px solid #e8e8e8;padding:12px 16px;display:flex;align-items:center;gap:14px;transition:all 0.15s">
    <div style="width:36px;height:36px;background:linear-gradient(135deg,#D4654A,#e8845f);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white;font-size:12px;font-weight:800">${initials}</div>
    <div style="min-width:120px">
      <p style="font-size:var(--font-sm);font-weight:700;color:#1e293b">${u.name}</p>
      <p style="font-size:10px;color:#94a3b8">${u.phone || 'No phone'}</p>
    </div>
    <div style="flex:1;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:14px;color:#D4654A">electric_moped</span>
      <span style="font-size:var(--font-sm);color:#64748b">${u.vehicle || 'No vehicle'}</span>
      <span style="font-size:10px;color:#94a3b8;font-family:monospace">${u.vehicleId || ''}</span>
    </div>
    <div style="display:flex;align-items:center;gap:14px;flex-shrink:0">
      <div style="text-align:center;min-width:40px">
        <p style="font-size:var(--font-sm);font-weight:800;color:#D4654A">${u.swapCount || 0}</p>
        <p style="font-size:8px;color:#94a3b8;font-weight:600">SWAPS</p>
      </div>
      ${verified
        ? '<span style="display:flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:#16a34a;background:#f0fdf4;padding:3px 8px;border-radius:var(--radius-full);border:1px solid #bbf7d0"><span class="material-symbols-outlined" style="font-size:12px;font-variation-settings:\'FILL\' 1">verified</span>KYC</span>'
        : '<span style="font-size:10px;font-weight:600;color:#d97706;background:#fef9ec;padding:3px 8px;border-radius:var(--radius-full);border:1px solid #fde68a">Pending</span>'
      }
      <button class="dm-delete-btn" data-id="${u.id}" data-type="users" data-label="${u.name}"
        style="background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:8px;padding:5px 10px;font-size:10px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:3px;transition:all 0.15s;font-family:inherit"
        onmouseover="this.style.background='#ef4444';this.style.color='white'" onmouseout="this.style.background='#fef2f2';this.style.color='#ef4444'">
        <span class="material-symbols-outlined" style="font-size:13px">delete</span> Remove
      </button>
    </div>
  </div>`;
}

export async function renderSettings(container) {
    // Fetch live data
    let stations = [], batteries = [], users = [];
    try {
      [stations, batteries, users] = await Promise.all([
        apiFetch('/stations').then(r => r.json()),
        apiFetch('/batteries').then(r => r.json()),
        apiFetch('/users').then(r => r.json()),
      ]);
    } catch { /* offline fallback */ }

    // Build user lookup for battery → customer name
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    // Get current profile name from stored admin user
    const adminUser = getAdminUser() || {};
    const currentName = adminUser.name || 'System Admin';
    const currentEmail = adminUser.email || 'admin@electica.in';

    container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-desc">Manage your system preferences and configuration</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
        <!-- Profile Settings -->
        <div class="card" style="padding:1.5rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
            ${icon('person', '20px', 'color:#D4654A')} Profile Settings
          </h3>
          <div style="display:flex;flex-direction:column;gap:1rem">
            <div>
              <label style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Full Name</label>
              <input type="text" id="settings-name" value="${currentName}" style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);color:#1e293b;background:#f8fafc;font-family:inherit;box-sizing:border-box" />
            </div>
            <div>
              <label style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Email Address</label>
              <input type="email" id="settings-email" value="${currentEmail}" style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);color:#1e293b;background:#f8fafc;font-family:inherit;box-sizing:border-box" />
            </div>
            <div>
              <label style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Role</label>
              <input type="text" value="System Admin" disabled style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);color:#64748b;background:#f1f5f9;font-family:inherit;box-sizing:border-box" />
            </div>
            <button id="save-profile-btn" class="btn btn-primary" style="width:fit-content;margin-top:8px">
              ${icon('save', '16px')} Save Changes
            </button>
          </div>
        </div>

        <!-- Notification Preferences -->
        <div class="card" style="padding:1.5rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
            ${icon('notifications', '20px', 'color:#D4654A')} Notification Preferences
          </h3>
          <div style="display:flex;flex-direction:column;gap:1rem">
            ${settingsToggle('swap-alerts', 'Swap Alerts', 'Get notified for every battery swap event', true)}
            ${settingsToggle('maintenance-alerts', 'Maintenance Alerts', 'Station maintenance and health warnings', true)}
            ${settingsToggle('revenue-reports', 'Revenue Reports', 'Daily revenue summary notifications', false)}
            ${settingsToggle('email-digest', 'Weekly Email Digest', 'Consolidated weekly performance report', false)}
          </div>
          <div style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid #f1f5f9">
            <button id="generate-report-btn" class="btn btn-primary" style="width:100%;justify-content:center;display:flex;align-items:center;gap:8px">
              ${icon('summarize', '16px')} Generate Report
            </button>
          </div>
        </div>
      </div>

      <!-- System Configuration -->
      <div class="card" style="padding:1.5rem;margin-bottom:1.25rem">
        <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
          ${icon('tune', '20px', 'color:#D4654A')} System Configuration
        </h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
          <div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:6px">Default Currency</p>
            <select id="cfg-currency" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);background:white;font-family:inherit;color:#1e293b">
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD (US Dollar)</option>
              <option value="EUR">€ EUR (Euro)</option>
            </select>
          </div>
          <div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:6px">Timezone</p>
            <select id="cfg-timezone" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);background:white;font-family:inherit;color:#1e293b">
              <option value="IST">IST (UTC+5:30)</option>
              <option value="UTC">UTC (UTC+0:00)</option>
              <option value="EST">EST (UTC-5:00)</option>
            </select>
          </div>
          <div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:6px">Data Refresh Interval</p>
            <select id="cfg-refresh" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);background:white;font-family:inherit;color:#1e293b">
              <option value="5">5 seconds</option>
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Data Management (Admin) -->
      <div class="card" style="padding:1.5rem;margin-bottom:1.25rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px">
            ${icon('admin_panel_settings', '20px', 'color:#D4654A')} Data Management
          </h3>
          <span style="display:flex;align-items:center;gap:5px;font-size:var(--font-xs);color:#D4654A;font-weight:700;background:rgba(212,101,74,0.08);padding:5px 12px;border-radius:var(--radius-full);border:1px solid rgba(212,101,74,0.18)">
            <span class="material-symbols-outlined" style="font-size:14px">shield</span> Admin Access
          </span>
        </div>

        <!-- Tabs -->
        <div id="dm-tabs" style="display:flex;gap:4px;margin-bottom:1.25rem;border-bottom:2px solid #f1f5f9;padding-bottom:0">
          <button data-tab="stations" class="dm-tab active" style="padding:10px 20px;border:none;background:none;font-size:var(--font-sm);font-weight:700;color:#D4654A;cursor:pointer;border-bottom:2px solid #D4654A;margin-bottom:-2px;transition:all 0.15s;display:flex;align-items:center;gap:6px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:16px">ev_station</span> Stations <span class="dm-badge" style="background:rgba(212,101,74,0.10);color:#D4654A;padding:2px 9px;border-radius:var(--radius-full);font-size:10px;font-weight:800">${stations.length}</span>
          </button>
          <button data-tab="batteries" class="dm-tab" style="padding:10px 20px;border:none;background:none;font-size:var(--font-sm);font-weight:600;color:#94a3b8;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.15s;display:flex;align-items:center;gap:6px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:16px">battery_full</span> Batteries <span class="dm-badge" style="background:#f1f5f9;color:#94a3b8;padding:2px 9px;border-radius:var(--radius-full);font-size:10px;font-weight:800">${batteries.length}</span>
          </button>
          <button data-tab="users" class="dm-tab" style="padding:10px 20px;border:none;background:none;font-size:var(--font-sm);font-weight:600;color:#94a3b8;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.15s;display:flex;align-items:center;gap:6px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:16px">group</span> Users <span class="dm-badge" style="background:#f1f5f9;color:#94a3b8;padding:2px 9px;border-radius:var(--radius-full);font-size:10px;font-weight:800">${users.length}</span>
          </button>
        </div>

        <!-- Stations Grid -->
        <div id="dm-panel-stations" class="dm-panel">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem">
            ${stations.map(s => stationCard(s)).join('')}
          </div>
          ${stations.length === 0 ? '<p style="text-align:center;padding:2rem;color:#94a3b8;font-size:var(--font-sm)">No stations found</p>' : ''}
        </div>

        <!-- Batteries List -->
        <div id="dm-panel-batteries" class="dm-panel" style="display:none">
          <div id="dm-bat-filters" style="display:flex;gap:5px;margin-bottom:12px;background:var(--bg-table-head);border-radius:var(--radius-full);padding:3px;border:1px solid var(--border-light);width:fit-content">
            <button class="dm-bat-filter active" data-filter="all" style="padding:5px 14px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;cursor:pointer;border:1.5px solid #D4654A;background:rgba(212,101,74,0.10);color:#D4654A;transition:all 0.15s;font-family:inherit">All <span style="opacity:0.6">(${batteries.length})</span></button>
            <button class="dm-bat-filter" data-filter="deployed" style="padding:5px 14px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;cursor:pointer;border:1.5px solid transparent;background:rgba(212,101,74,0.06);color:#D4654A;transition:all 0.15s;font-family:inherit">Deployed <span style="opacity:0.6">(${batteries.filter(b=>b.status==='deployed').length})</span></button>
            <button class="dm-bat-filter" data-filter="available" style="padding:5px 14px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;cursor:pointer;border:1.5px solid transparent;background:rgba(212,101,74,0.06);color:#D4654A;transition:all 0.15s;font-family:inherit">Available <span style="opacity:0.6">(${batteries.filter(b=>b.status==='available').length})</span></button>
            <button class="dm-bat-filter" data-filter="charging" style="padding:5px 14px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;cursor:pointer;border:1.5px solid transparent;background:rgba(212,101,74,0.06);color:#D4654A;transition:all 0.15s;font-family:inherit">Charging <span style="opacity:0.6">(${batteries.filter(b=>b.status==='charging').length})</span></button>
            <button class="dm-bat-filter" data-filter="stock" style="padding:5px 14px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;cursor:pointer;border:1.5px solid transparent;background:rgba(212,101,74,0.06);color:#D4654A;transition:all 0.15s;font-family:inherit">Stock <span style="opacity:0.6">(${batteries.filter(b=>b.status==='stock').length})</span></button>
            <button class="dm-bat-filter" data-filter="fault" style="padding:5px 14px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;cursor:pointer;border:1.5px solid transparent;background:rgba(212,101,74,0.06);color:#D4654A;transition:all 0.15s;font-family:inherit">Fault <span style="opacity:0.6">(${batteries.filter(b=>b.status==='fault'||b.status==='retired').length})</span></button>
          </div>
          <div id="dm-bat-list" style="display:flex;flex-direction:column;gap:8px;max-height:500px;overflow-y:auto;padding-right:4px">
            ${batteries.map(b => batteryListRow(b, userMap)).join('')}
          </div>
          <div id="dm-bat-empty" style="display:none;text-align:center;padding:2rem;color:#94a3b8;font-size:var(--font-sm)">No batteries match this filter</div>
          ${batteries.length === 0 ? '<p style="text-align:center;padding:2rem;color:#94a3b8;font-size:var(--font-sm)">No batteries found</p>' : ''}
        </div>

        <!-- Users List -->
        <div id="dm-panel-users" class="dm-panel" style="display:none">
          <div style="display:flex;flex-direction:column;gap:8px;max-height:500px;overflow-y:auto;padding-right:4px">
            ${users.map(u => userListRow(u)).join('')}
          </div>
          ${users.length === 0 ? '<p style="text-align:center;padding:2rem;color:#94a3b8;font-size:var(--font-sm)">No users found</p>' : ''}
        </div>
      </div>

      <footer class="app-footer" style="margin-top:2rem">
        ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#9ca3af')}
        Electica Enterprise Dashboard © 2026
      </footer>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="dm-confirm-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;align-items:center;justify-content:center">
      <div style="background:white;border-radius:16px;padding:2rem;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);text-align:center">
        <div style="width:56px;height:56px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
          <span class="material-symbols-outlined" style="font-size:28px;color:#ef4444">warning</span>
        </div>
        <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:8px">Confirm Deletion</h3>
        <p id="dm-confirm-text" style="font-size:var(--font-sm);color:#64748b;margin-bottom:1.5rem">Are you sure?</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button id="dm-confirm-cancel" style="padding:10px 24px;border-radius:var(--radius-md);border:1px solid #e2e8f0;background:white;color:#64748b;font-size:var(--font-sm);font-weight:600;cursor:pointer;font-family:inherit">Cancel</button>
          <button id="dm-confirm-delete" style="padding:10px 24px;border-radius:var(--radius-md);border:none;background:#ef4444;color:white;font-size:var(--font-sm);font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px">delete</span> Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Repair Dropdown (fixed position, shared) -->
    <div id="dm-repair-popup" style="display:none;position:fixed;z-index:10000;background:white;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 12px 36px rgba(0,0,0,0.15);min-width:260px;padding:8px 0;max-height:280px;overflow-y:auto">
      <p style="padding:8px 14px 6px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em">Assign to Station & Start Charging</p>
      ${stations.map(s => `
        <button class="dm-repair-station" data-station="${s.id}" data-station-name="${s.name}"
          style="width:100%;text-align:left;padding:9px 14px;border:none;background:none;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;transition:background 0.12s"
          onmouseover="this.style.background='rgba(212,101,74,0.05)'" onmouseout="this.style.background='none'">
          <span class="material-symbols-outlined" style="font-size:16px;color:#D4654A">ev_station</span>
          <span style="flex:1">
            <span style="font-size:var(--font-sm);font-weight:600;color:#1e293b;display:block">${s.name}</span>
            <span style="font-size:10px;color:#94a3b8">${s.location || s.id}</span>
          </span>
          <span style="font-size:9px;font-weight:700;color:${s.status === 'online' ? '#16a34a' : '#d97706'};background:${s.status === 'online' ? '#f0fdf4' : '#fef9ec'};padding:2px 6px;border-radius:4px">${s.status === 'online' ? 'Online' : 'Maint.'}</span>
        </button>
      `).join('')}
      ${stations.length === 0 ? '<p style="padding:12px 14px;color:#94a3b8;font-size:var(--font-xs);text-align:center">No stations available</p>' : ''}
    </div>
  `;

    // ── Save profile → update sidebar + localStorage + server ──
    document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
        const newName = document.getElementById('settings-name')?.value?.trim();
        const newEmail = document.getElementById('settings-email')?.value?.trim();
        if (!newName) { showToast('Name cannot be empty', 'error'); return; }

        // Update sidebar DOM immediately
        const sidebarName = document.querySelector('.sidebar-user-name');
        const sidebarAvatar = document.querySelector('.sidebar-avatar span');
        if (sidebarName) sidebarName.textContent = newName;
        if (sidebarAvatar) sidebarAvatar.textContent = newName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

        // Persist to localStorage
        const stored = getAdminUser() || {};
        setAdminUser({ ...stored, name: newName, email: newEmail });

        // Persist to server so it survives re-login
        try {
            await apiFetch(`/admins/${stored.id || 'ADM-001'}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
        } catch { /* server update is best-effort */ }

        showToast('Profile settings saved', 'success');
    });

    // ── System config selects - restore saved + persist on change ──
    const cfgCurrency = document.getElementById('cfg-currency');
    const cfgTimezone = document.getElementById('cfg-timezone');
    const cfgRefresh = document.getElementById('cfg-refresh');
    if (cfgCurrency) cfgCurrency.value = localStorage.getItem('electica_currency') || 'INR';
    if (cfgTimezone) cfgTimezone.value = localStorage.getItem('electica_timezone') || 'IST';
    if (cfgRefresh) cfgRefresh.value = localStorage.getItem('electica_refresh_interval') || '15';
    cfgCurrency?.addEventListener('change', () => {
        localStorage.setItem('electica_currency', cfgCurrency.value);
        showToast('Currency updated to ' + cfgCurrency.value, 'success');
    });
    cfgTimezone?.addEventListener('change', () => {
        localStorage.setItem('electica_timezone', cfgTimezone.value);
        showToast('Timezone updated to ' + cfgTimezone.value, 'success');
    });
    cfgRefresh?.addEventListener('change', () => {
        localStorage.setItem('electica_refresh_interval', cfgRefresh.value);
        showToast('Refresh interval set to ' + cfgRefresh.value + 's', 'success');
    });

    // ── Generate Report ──
    document.getElementById('generate-report-btn')?.addEventListener('click', () => {
        const btn = document.getElementById('generate-report-btn');
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;animation:spin 0.6s linear infinite">progress_activity</span> Generating...';
        btn.style.pointerEvents = 'none';
        setTimeout(() => {
            // Build report CSV
            const rows = [['Metric', 'Value']];
            rows.push(['Total Stations', stations.length]);
            rows.push(['Online Stations', stations.filter(s => s.status === 'online').length]);
            rows.push(['Total Batteries', batteries.length]);
            rows.push(['Total Users', users.length]);
            rows.push(['Report Date', new Date().toLocaleDateString('en-IN')]);
            const csv = rows.map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'electica-report-' + new Date().toISOString().slice(0, 10) + '.csv';
            a.click(); URL.revokeObjectURL(url);
            btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px">summarize</span> Generate Report`;
            btn.style.pointerEvents = 'auto';
            showToast('Report generated and downloaded', 'success');
        }, 1200);
    });

    // ── Toggle switches ──
    container.querySelectorAll('.settings-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isOn = toggle.dataset.state === 'on';
            toggle.dataset.state = isOn ? 'off' : 'on';
            toggle.style.background = isOn ? '#e2e8f0' : '#D4654A';
            toggle.querySelector('.toggle-knob').style.transform = isOn ? 'translateX(0)' : 'translateX(20px)';
            const label = toggle.closest('.toggle-row').querySelector('.toggle-label').textContent;
            showToast(`${label} ${isOn ? 'disabled' : 'enabled'}`, isOn ? 'warning' : 'success');
        });
    });

    // ── Data Management Tabs ──
    document.getElementById('dm-tabs')?.addEventListener('click', e => {
        const tab = e.target.closest('.dm-tab');
        if (!tab) return;
        const target = tab.dataset.tab;
        container.querySelectorAll('.dm-tab').forEach(t => {
            const on = t === tab;
            t.style.color = on ? '#D4654A' : '#94a3b8';
            t.style.fontWeight = on ? '700' : '600';
            t.style.borderBottomColor = on ? '#D4654A' : 'transparent';
            const badge = t.querySelector('.dm-badge');
            if (badge) {
                badge.style.background = on ? 'rgba(212,101,74,0.10)' : '#f1f5f9';
                badge.style.color = on ? '#D4654A' : '#94a3b8';
            }
        });
        container.querySelectorAll('.dm-panel').forEach(p => p.style.display = 'none');
        document.getElementById(`dm-panel-${target}`).style.display = 'block';
    });

    // ── Battery status filter ──
    document.getElementById('dm-bat-filters')?.addEventListener('click', e => {
        const btn = e.target.closest('.dm-bat-filter');
        if (!btn) return;
        const filter = btn.dataset.filter;
        // Update active state
        container.querySelectorAll('.dm-bat-filter').forEach(b => b.style.borderColor = 'transparent');
        btn.style.borderColor = '#D4654A';
        // Filter batteries
        let filtered = [...batteries];
        if (filter !== 'all') {
            if (filter === 'fault') {
                filtered = filtered.filter(b => b.status === 'fault' || b.status === 'retired');
            } else {
                filtered = filtered.filter(b => b.status === filter);
            }
        }
        const list = document.getElementById('dm-bat-list');
        const empty = document.getElementById('dm-bat-empty');
        if (list) list.innerHTML = filtered.map(b => batteryListRow(b, userMap)).join('');
        if (empty) empty.style.display = filtered.length === 0 ? 'block' : 'none';
    });

    // ── Repair button: show fixed dropdown near button ──
    let repairBatId = null;
    const popup = document.getElementById('dm-repair-popup');

    function hideRepairPopup() {
        if (popup) popup.style.display = 'none';
        repairBatId = null;
    }

    container.addEventListener('click', e => {
        const repairBtn = e.target.closest('.dm-repair-btn');
        if (repairBtn) {
            const id = repairBtn.dataset.id;
            if (repairBatId === id && popup.style.display !== 'none') {
                hideRepairPopup();
                return;
            }
            repairBatId = id;
            // Set battery id on all station buttons
            popup.querySelectorAll('.dm-repair-station').forEach(b => b.dataset.bat = id);
            // Position near the repair button, flip up if not enough space below
            const rect = repairBtn.getBoundingClientRect();
            popup.style.display = 'block';
            const popupH = popup.offsetHeight;
            const spaceBelow = window.innerHeight - rect.bottom - 10;
            if (spaceBelow < popupH) {
                popup.style.top = Math.max(8, rect.top - popupH - 6) + 'px';
            } else {
                popup.style.top = (rect.bottom + 6) + 'px';
            }
            popup.style.left = Math.max(8, rect.right - popup.offsetWidth) + 'px';
            e.stopPropagation();
            return;
        }
        // Close popup if clicking outside
        if (!e.target.closest('#dm-repair-popup')) {
            hideRepairPopup();
        }
    });

    // ── Repair: assign fault battery to station as charging ──
    popup?.addEventListener('click', async e => {
        const stationBtn = e.target.closest('.dm-repair-station');
        if (!stationBtn) return;
        const batId = repairBatId;
        if (!batId) return;
        const stationId = stationBtn.dataset.station;
        const stationName = stationBtn.dataset.stationName;

        stationBtn.style.pointerEvents = 'none';
        stationBtn.style.opacity = '0.5';
        hideRepairPopup();

        try {
            const res = await apiFetch(`/batteries/${batId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'charging', stationId, stationName, assignedTo: null }),
            });
            if (!res.ok) throw new Error('Failed');

            // Update local data
            const bat = batteries.find(b => b.id === batId);
            if (bat) {
                bat.status = 'charging';
                bat.stationId = stationId;
                bat.stationName = stationName;
                bat.assignedTo = null;
            }

            // Re-render battery list with current filter
            const activeBtn = container.querySelector('.dm-bat-filter[style*="border-color: rgb(212, 101, 74)"]') ||
                              container.querySelector('.dm-bat-filter[style*="#D4654A"]');
            const currentFilter = activeBtn?.dataset?.filter || 'all';
            let filtered = [...batteries];
            if (currentFilter !== 'all') {
                if (currentFilter === 'fault') {
                    filtered = filtered.filter(b => b.status === 'fault' || b.status === 'retired');
                } else {
                    filtered = filtered.filter(b => b.status === currentFilter);
                }
            }
            const list = document.getElementById('dm-bat-list');
            const empty = document.getElementById('dm-bat-empty');
            if (list) list.innerHTML = filtered.map(b => batteryListRow(b, userMap)).join('');
            if (empty) empty.style.display = filtered.length === 0 ? 'block' : 'none';

            showToast(`${batId} repaired → Charging at ${stationName}`, 'success');
        } catch {
            stationBtn.style.pointerEvents = 'auto';
            stationBtn.style.opacity = '1';
            showToast(`Failed to repair ${batId}. Try again.`, 'error');
        }
    });

    // ── Station status toggle (online ↔ maintenance) ──
    container.addEventListener('click', async e => {
        const btn = e.target.closest('.dm-status-toggle');
        if (!btn) return;
        const id = btn.dataset.id;
        const current = btn.dataset.status;
        const newStatus = current === 'online' ? 'maintenance' : 'online';
        const online = newStatus === 'online';

        btn.dataset.status = newStatus;
        const dot = btn.querySelector('span[style*="border-radius:50%"]');
        const label = btn.querySelector('span[style*="font-size:11px"]');
        if (dot) { dot.style.background = online ? '#22c55e' : '#f59e0b'; dot.style.animation = online ? 'pulse 2s infinite' : 'none'; }
        if (label) { label.textContent = online ? 'Online' : 'Maintenance'; label.style.color = online ? '#16a34a' : '#d97706'; }
        btn.style.borderColor = online ? '#bbf7d0' : '#fde68a';
        btn.style.background = online ? '#f0fdf4' : '#fef9ec';

        const card = btn.closest('.dm-card');
        if (card) card.style.borderColor = online ? '#e8e8e8' : '#fde68a';

        try {
            const res = await apiFetch(`/stations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed');
            showToast(`Station ${id} set to ${newStatus}`, 'success');
        } catch {
            btn.dataset.status = current;
            showToast('Failed to update station status', 'error');
        }
    });

    // ── Edit Station button → open same modal as New Station ──
    container.addEventListener('click', e => {
        const btn = e.target.closest('.dm-edit-station-btn');
        if (!btn) return;
        const stationId = btn.dataset.id;
        const station = stations.find(s => s.id === stationId);
        if (station) showNewStationModal(station);
    });

    // ── Delete confirmation flow ──
    const overlay = document.getElementById('dm-confirm-overlay');
    const confirmText = document.getElementById('dm-confirm-text');
    const confirmCancel = document.getElementById('dm-confirm-cancel');
    const confirmDelete = document.getElementById('dm-confirm-delete');
    let pendingDelete = null;

    function showConfirm(type, id, label) {
        confirmText.innerHTML = `This will permanently remove <strong>${label}</strong> (${id}) from the system. This action cannot be undone.`;
        overlay.style.display = 'flex';
        pendingDelete = { type, id };
    }

    function hideConfirm() {
        overlay.style.display = 'none';
        pendingDelete = null;
    }

    confirmCancel?.addEventListener('click', hideConfirm);
    overlay?.addEventListener('click', e => { if (e.target === overlay) hideConfirm(); });

    confirmDelete?.addEventListener('click', async () => {
        if (!pendingDelete) return;
        const { type, id } = pendingDelete;
        confirmDelete.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;animation:spin 0.6s linear infinite">progress_activity</span> Deleting...';
        confirmDelete.style.pointerEvents = 'none';
        try {
            const res = await apiFetch(`/${type}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            const card = container.querySelector(`.dm-card[data-id="${id}"][data-type="${type}"]`);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95) translateX(20px)';
                setTimeout(() => card.remove(), 300);
            }
            const tab = container.querySelector(`.dm-tab[data-tab="${type}"]`);
            if (tab) {
                const badge = tab.querySelector('.dm-badge');
                if (badge) badge.textContent = Math.max(0, (parseInt(badge.textContent) || 0) - 1);
            }
            const tl = type === 'stations' ? 'Station' : type === 'batteries' ? 'Battery' : 'User';
            showToast(`${tl} ${id} removed successfully`, 'success');
        } catch {
            showToast(`Failed to delete ${id}. Please try again.`, 'error');
        }
        confirmDelete.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">delete</span> Delete';
        confirmDelete.style.pointerEvents = 'auto';
        hideConfirm();
    });

    container.addEventListener('click', e => {
        const btn = e.target.closest('.dm-delete-btn');
        if (!btn) return;
        showConfirm(btn.dataset.type, btn.dataset.id, btn.dataset.label);
    });
}

function settingsToggle(id, label, desc, isOn) {
    return `
    <div class="toggle-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">
      <div>
        <span class="toggle-label" style="font-size:var(--font-md);font-weight:600;color:#1e293b">${label}</span>
        <p style="font-size:var(--font-sm);color:#64748b;margin-top:2px">${desc}</p>
      </div>
      <div class="settings-toggle" data-state="${isOn ? 'on' : 'off'}" style="width:44px;height:24px;border-radius:12px;background:${isOn ? '#D4654A' : '#e2e8f0'};cursor:pointer;padding:2px;transition:background 0.2s;flex-shrink:0">
        <div class="toggle-knob" style="width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.1);transition:transform 0.2s;transform:translateX(${isOn ? '20px' : '0'})"></div>
      </div>
    </div>
  `;
}
