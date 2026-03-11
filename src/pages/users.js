// ============================================
// Users / Customers Page - Live API
// ============================================
import { icon } from '../components/icons.js';
import { apiFetch } from '../utils/apiFetch.js';
import { downloadCsv } from '../utils/csv.js';
import { showToast } from '../utils/toast.js';
import { fmtCur, formatRevM } from '../utils/helpers.js';

const kycColors = {
  verified: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', dot: '#22c55e', label: 'Verified' },
  pending:  { bg: '#fefce8', color: '#a16207', border: '#fde68a', dot: '#f59e0b', label: 'Pending'  },
  rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444', label: 'Rejected' },
};

function rowHTML(u) {
  const kyc = kycColors[u.kycStatus] || kycColors.pending;
  const spentStr = u.totalSpent > 0 ? fmtCur(u.totalSpent) : '-';
  return `
  <div class="user-row" data-user-id="${u.id}"
       style="display:flex;align-items:center;gap:16px;padding:14px 1.5rem;border-bottom:1px solid var(--border-light);cursor:pointer;transition:all 0.15s"
       onmouseover="this.style.background='var(--bg-hover-row)';this.querySelector('.user-chevron').style.opacity='1'" onmouseout="this.style.background='transparent';this.querySelector('.user-chevron').style.opacity='0.3'">
    <!-- Avatar -->
    <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,rgba(212,101,74,0.12),rgba(212,101,74,0.06));display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(212,101,74,0.10)">
      <span style="font-size:var(--font-sm);font-weight:800;color:#D4654A;letter-spacing:-0.02em">${u.initials}</span>
    </div>
    <!-- Name + ID -->
    <div style="min-width:140px;flex:1.2">
      <p style="font-size:var(--font-base);font-weight:700;color:var(--text-primary);letter-spacing:-0.01em">${u.name}</p>
      <p style="font-size:var(--font-xs);color:var(--text-label);font-family:monospace;margin-top:1px">${u.id}</p>
    </div>
    <!-- Vehicle -->
    <div style="min-width:120px;flex:1">
      <p style="font-size:var(--font-sm);font-weight:600;color:var(--text-primary)">${u.vehicle}</p>
      <p style="font-size:var(--font-xs);color:var(--text-label);margin-top:1px">${u.vehicleId}</p>
    </div>
    <!-- Battery -->
    <div style="min-width:90px">
      ${u.batteryId
        ? `<span style="font-family:monospace;font-size:var(--font-xs);font-weight:700;color:#D4654A;background:rgba(212,101,74,0.06);padding:4px 10px;border-radius:8px;border:1px solid rgba(212,101,74,0.12);display:inline-block">${u.batteryId}</span>`
        : `<span style="font-size:var(--font-xs);color:var(--text-label)">-</span>`}
    </div>
    <!-- Swaps -->
    <div style="min-width:60px;text-align:center">
      <p style="font-size:var(--font-md);font-weight:800;color:var(--text-primary)">${u.swapCount}</p>
      <p style="font-size:9px;font-weight:600;color:var(--text-label);text-transform:uppercase;letter-spacing:0.04em">swaps</p>
    </div>
    <!-- Spent -->
    <div style="min-width:80px;text-align:right">
      <p style="font-size:var(--font-md);font-weight:800;color:var(--text-primary)">${spentStr}</p>
      <p style="font-size:9px;font-weight:600;color:var(--text-label);text-transform:uppercase;letter-spacing:0.04em">spent</p>
    </div>
    <!-- KYC -->
    <div style="min-width:80px;text-align:center">
      <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:${kyc.bg};color:${kyc.color};border:1px solid ${kyc.border}">
        <span style="width:5px;height:5px;border-radius:50%;background:${kyc.dot}"></span>${kyc.label}
      </span>
    </div>
    <!-- Chevron -->
    <span class="material-symbols-outlined user-chevron" style="font-size:16px;color:var(--text-muted);opacity:0.3;transition:opacity 0.15s;flex-shrink:0">chevron_right</span>
  </div>`;
}

function attachEvents(container) {
  container.querySelectorAll('.user-row').forEach(row => {
    row.addEventListener('click', () => { location.hash = '#user-detail/' + row.dataset.userId; });
  });
}

export async function renderUsers(container) {
  container.innerHTML = `<div style="padding:3rem;text-align:center;color:#94a3b8;font-size:var(--font-md)">Loading customers...</div>`;

  let users = [];
  try {
    users = await apiFetch('/users').then(r => r.json());
  } catch {
    const { mockUsers } = await import('../data/mockData.js');
    users = mockUsers;
  }

  const totalSpent  = users.reduce((s, u) => s + (Number(u.totalSpent) || 0), 0);
  const verifiedCnt = users.filter(u => u.kycStatus === 'verified').length;
  const pendingCnt  = users.filter(u => u.kycStatus === 'pending').length;
  const rejectedCnt = users.filter(u => u.kycStatus === 'rejected').length;

  const filterBtn = (val, label, count, color, bg) =>
    `<button class="kyc-filter-btn" data-filter="${val}"
      style="padding:5px 14px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;cursor:pointer;border:1.5px solid transparent;transition:all 0.15s;background:${bg};color:${color}">
      ${label} <span style="opacity:0.75">(${count})</span>
    </button>`;

  container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">
      <div class="page-header">
        <div>
          <h1 class="page-title">Users & Customers</h1>
          <p class="page-desc">${users.length} registered riders · ${formatRevM(totalSpent)} total collected</p>
        </div>
      </div>

      <div class="rev-kpi-grid" style="margin-bottom:1.25rem">
        <div class="rev-kpi-card">
          <div class="rev-kpi-decor"></div>
          <p class="rev-kpi-label">Total Users</p>
          <h2 class="rev-kpi-value">${users.length}</h2>
          <span class="rev-badge rev-badge-track">Registered</span>
        </div>
        <div class="rev-kpi-card">
          <p class="rev-kpi-label">KYC Verified</p>
          <h2 class="rev-kpi-value">${verifiedCnt}</h2>
          <span class="rev-badge rev-badge-up">↑ Onboarded</span>
        </div>
        <div class="rev-kpi-card">
          <p class="rev-kpi-label">Pending Review</p>
          <h2 class="rev-kpi-value">${pendingCnt}</h2>
          <span class="rev-badge" style="background:#fefce8;color:#a16207">Awaiting</span>
        </div>
        <div class="rev-kpi-card">
          <p class="rev-kpi-label">Revenue Collected</p>
          <h2 class="rev-kpi-value">${formatRevM(totalSpent)}</h2>
          <span class="rev-badge rev-badge-up">↑ ${fmtCur(65)} / swap</span>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <!-- Toolbar -->
        <div style="padding:1rem 1.5rem;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <h3 style="font-size:var(--font-md);font-weight:700;color:var(--text-primary);margin-right:auto;display:flex;align-items:center;gap:8px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#D4654A;font-variation-settings:'FILL' 1">group</span>
            All Customers
          </h3>

          <div style="position:relative">
            <span class="material-symbols-outlined" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--text-label)">search</span>
            <input id="user-search" type="text" placeholder="Search name or ID…"
              style="padding:7px 12px 7px 34px;border:1px solid var(--border-color);border-radius:var(--radius-full);font-size:var(--font-sm);color:var(--text-primary);background:var(--bg-input);width:220px;outline:none;font-family:inherit;transition:border-color 0.15s,box-shadow 0.15s"
              onfocus="this.style.borderColor='#D4654A';this.style.boxShadow='0 0 0 3px rgba(212,101,74,0.08)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
          </div>

          <button id="users-export-btn" class="btn btn-outline" style="display:flex;align-items:center;gap:6px;padding:6px 14px;font-size:var(--font-xs)">
            ${icon('download', '14px')} Export CSV
          </button>

          <div style="display:flex;gap:5px;background:var(--bg-table-head);border-radius:var(--radius-full);padding:3px;border:1px solid var(--border-light)">
            ${filterBtn('all',      'All',      users.length, '#D4654A', 'rgba(212,101,74,0.10)')}
            ${filterBtn('verified', 'Verified', verifiedCnt,  '#16a34a', '#f0fdf4')}
            ${filterBtn('pending',  'Pending',  pendingCnt,   '#a16207', '#fefce8')}
            ${filterBtn('rejected', 'Rejected', rejectedCnt,  '#dc2626', '#fef2f2')}
          </div>
        </div>

        <!-- Column Headers -->
        <div style="display:flex;align-items:center;gap:16px;padding:8px 1.5rem;background:var(--bg-table-head);border-bottom:1px solid var(--border-light)">
          <span style="width:40px;flex-shrink:0"></span>
          <span style="min-width:140px;flex:1.2;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Customer</span>
          <span style="min-width:120px;flex:1;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Vehicle</span>
          <span style="min-width:90px;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Battery</span>
          <span style="min-width:60px;text-align:center;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Swaps</span>
          <span style="min-width:80px;text-align:right;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">Spent</span>
          <span style="min-width:80px;text-align:center;font-size:var(--font-xs);font-weight:700;color:var(--text-label);text-transform:uppercase;letter-spacing:0.06em">KYC</span>
          <span style="width:16px;flex-shrink:0"></span>
        </div>

        <div id="users-table-body">${users.map(rowHTML).join('')}</div>

        <div id="users-empty" style="display:none;padding:3rem;text-align:center;color:#94a3b8">
          <span class="material-symbols-outlined" style="font-size:32px;display:block;margin-bottom:8px">search_off</span>
          No customers match your search
        </div>
      </div>

      <footer class="app-footer" style="margin-top:2rem">
        ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#9ca3af')}
        Electica Enterprise Dashboard © 2026
      </footer>
    </div>
  `;

  attachEvents(container);

  let activeFilter = 'all';

  function applyFilter() {
    const query = document.getElementById('user-search').value.trim().toLowerCase();
    let filtered = users;
    if (activeFilter !== 'all') filtered = filtered.filter(u => u.kycStatus === activeFilter);
    if (query) filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(query) || u.id.toLowerCase().includes(query)
    );
    document.getElementById('users-table-body').innerHTML = filtered.map(rowHTML).join('');
    document.getElementById('users-empty').style.display = filtered.length === 0 ? 'block' : 'none';
    attachEvents(container);
  }

  document.getElementById('user-search').addEventListener('input', applyFilter);

  container.querySelectorAll('.kyc-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      container.querySelectorAll('.kyc-filter-btn').forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = '#D4654A';
      applyFilter();
    });
  });

  container.querySelector('.kyc-filter-btn[data-filter="all"]').style.borderColor = '#D4654A';

  // Export CSV
  document.getElementById('users-export-btn')?.addEventListener('click', () => {
    const headers = ['User ID', 'Name', 'Phone', 'Vehicle', 'Vehicle Reg', 'KYC Status', 'Battery', 'Swaps', 'Total Spent', 'Registered'];
    const rows = users.map(u => [
      u.id, u.name, u.phone, u.vehicle, u.vehicleId || '',
      u.kycStatus, u.batteryId || '', u.totalSwaps || 0,
      u.totalSpent || 0, u.registeredAt || '',
    ]);
    downloadCsv('users-list', headers, rows);
    showToast('Users exported', 'success');
  });
}
