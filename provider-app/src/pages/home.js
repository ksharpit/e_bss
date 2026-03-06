// ============================================
// Home - Agent Dashboard (Premium Redesign)
// ============================================
import { showToast } from '../utils/toast.js';
import { API_BASE } from '../config.js';

const kycBadge = {
  verified: `<span class="badge badge-green"><span class="material-symbols-outlined">verified</span> Verified</span>`,
  pending:  `<span class="badge badge-amber"><span class="material-symbols-outlined">schedule</span> Pending</span>`,
  rejected: `<span class="badge badge-red"><span class="material-symbols-outlined">cancel</span> Rejected</span>`,
};

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: 'wb_sunny' };
  if (h < 17) return { text: 'Good afternoon', icon: 'light_mode' };
  return { text: 'Good evening', icon: 'nights_stay' };
}

export async function renderHome(container, agent, onOpenCustomer) {
  container.innerHTML = `<div class="loading">Loading your workspace...</div>`;

  let myUsers = [], allUsers = [], pendingAll = [];
  try {
    [myUsers, allUsers, pendingAll] = await Promise.all([
      fetch(`${API_BASE}/users?onboardedBy=${agent.id}`).then(r => r.json()),
      fetch(`${API_BASE}/users`).then(r => r.json()),
      fetch(`${API_BASE}/users?kycStatus=pending`).then(r => r.json()),
    ]);
  } catch {
    showToast('Cannot reach API - check json-server on :3001', 'error');
  }

  // Self-registered from user app: pending + no agent assigned yet
  const incomingReqs = pendingAll.filter(u => !u.onboardedBy);

  const total    = myUsers.length;
  const verified = myUsers.filter(u => u.kycStatus === 'verified').length;
  const pending  = myUsers.filter(u => u.kycStatus === 'pending').length;
  const rejected = myUsers.filter(u => u.kycStatus === 'rejected').length;
  const g        = greeting();

  // Sort: rejected first, then pending, then verified; newest within each
  myUsers.sort((a, b) => {
    const o = { rejected: 0, pending: 1, verified: 2 };
    if (o[a.kycStatus] !== o[b.kycStatus]) return o[a.kycStatus] - o[b.kycStatus];
    return new Date(b.kycSubmittedAt || 0) - new Date(a.kycSubmittedAt || 0);
  });

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });

  container.innerHTML = `
    <!-- Hero Card -->
    <div class="hero-card fade-up">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">
        <div>
          <p class="hero-greeting">
            <span class="material-symbols-outlined" style="font-size:11px;vertical-align:middle;font-variation-settings:'FILL' 1">${g.icon}</span>
            ${g.text}
          </p>
          <h2 class="hero-name">${agent.name}</h2>
          <p class="hero-zone">${agent.zone} · ${today}</p>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 10px;text-align:center;border:1px solid rgba(255,255,255,0.12)">
          <p style="font-size:1.125rem;font-weight:900;color:#fff;line-height:1">${pending + rejected}</p>
          <p style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px">Action</p>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-val">${total}</div>
          <div class="hero-stat-lbl">Total</div>
        </div>
        <div class="hero-divider"></div>
        <div class="hero-stat">
          <div class="hero-stat-val" style="color:#fde68a">${pending}</div>
          <div class="hero-stat-lbl">Pending</div>
        </div>
        <div class="hero-divider"></div>
        <div class="hero-stat">
          <div class="hero-stat-val" style="color:#86efac">${verified}</div>
          <div class="hero-stat-lbl">Verified</div>
        </div>
      </div>
    </div>

    ${rejected > 0 ? `
    <div class="status-banner banner-red fade-up" style="animation-delay:0.05s">
      <span class="material-symbols-outlined">cancel</span>
      <div class="status-banner-text">
        <strong>${rejected} application${rejected > 1 ? 's' : ''} rejected</strong> - tap to fix & resubmit
      </div>
      <span class="material-symbols-outlined" style="font-size:16px;opacity:0.6">chevron_right</span>
    </div>` : pending > 0 ? `
    <div class="status-banner banner-amber fade-up" style="animation-delay:0.05s">
      <span class="material-symbols-outlined">pending</span>
      <div class="status-banner-text">
        <strong>${pending} customer${pending > 1 ? 's' : ''}</strong> awaiting KYC review
      </div>
    </div>` : total > 0 ? `
    <div class="status-banner banner-green fade-up" style="animation-delay:0.05s">
      <span class="material-symbols-outlined">verified</span>
      <div class="status-banner-text">All customers verified - great work!</div>
    </div>` : ''}

    <!-- Incoming Self-Registered Requests -->
    ${incomingReqs.length > 0 ? `
    <div class="section-label fade-up" style="animation-delay:0.07s;display:flex;align-items:center;gap:8px">
      New Requests
      <span style="background:var(--coral);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:999px;letter-spacing:0.04em">${incomingReqs.length} NEW</span>
    </div>
    <div class="card fade-up" style="overflow:hidden;margin-bottom:16px;border:1.5px solid rgba(212,101,74,0.30);animation-delay:0.08s">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(212,101,74,0.07);border-bottom:1px solid rgba(212,101,74,0.15)">
        <span class="material-symbols-outlined" style="font-size:15px;color:var(--coral);font-variation-settings:'FILL' 1">notification_important</span>
        <span style="font-size:var(--font-xs);font-weight:700;color:var(--coral)">Users registered via app — awaiting your physical verification &amp; INR 3,000 deposit collection</span>
      </div>
      ${incomingReqs.map(u => `
      <div class="customer-item status-pending" data-id="${u.id}" data-incoming="1">
        <div class="customer-avatar status-pending">${u.initials || u.name.slice(0,2).toUpperCase()}</div>
        <div style="flex:1;min-width:0">
          <div class="customer-name">${u.name}</div>
          <div class="customer-sub">${u.phone}</div>
          <div class="customer-vehicle">
            <span class="material-symbols-outlined">two_wheeler</span>
            ${u.vehicle || '-'}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span class="badge badge-amber"><span class="material-symbols-outlined">schedule</span> Pending</span>
          <span style="font-size:10px;color:var(--text-soft)">${fmtDate(u.kycSubmittedAt)}</span>
        </div>
        <span class="material-symbols-outlined" style="font-size:17px;color:var(--text-soft);margin-left:4px">chevron_right</span>
      </div>`).join('')}
    </div>` : ''}

    <!-- Search + Filters -->
    <div class="fade-up" style="margin-bottom:14px;animation-delay:0.08s">
      <div class="search-wrap">
        <span class="material-symbols-outlined">search</span>
        <input id="home-search" class="search-input" type="search" placeholder="Search name or phone..." />
      </div>
      <div class="filter-tabs">
        ${[
          { label: 'All',      filter: 'all',      count: total },
          { label: 'Pending',  filter: 'pending',  count: pending },
          { label: 'Verified', filter: 'verified', count: verified },
          { label: 'Rejected', filter: 'rejected', count: rejected },
        ].map((t, i) => `<button class="filter-tab ${i === 0 ? 'active' : ''}" data-filter="${t.filter}">${t.label} <span style="opacity:0.6">${t.count}</span></button>`).join('')}
      </div>
    </div>

    <!-- Customer List -->
    <div class="section-label">My Customers (${total})</div>
    <div class="card" style="overflow:hidden;margin-bottom:18px" id="customer-list-card">
      ${renderList(myUsers, 'all')}
    </div>

    <!-- Network Overview -->
    <div class="section-label">Network Overview</div>
    <div class="net-grid fade-up" style="margin-bottom:4px;animation-delay:0.12s">
      ${netStat('group',        'Total Customers',    allUsers.length,                                  '#6366f1', 'rgba(99,102,241,0.10)')}
      ${netStat('verified_user','Verified',           allUsers.filter(u=>u.kycStatus==='verified').length, '#16a34a', 'rgba(22,163,74,0.10)')}
      ${netStat('schedule',     'Pending KYC',        allUsers.filter(u=>u.kycStatus==='pending').length,  '#d97706', 'rgba(217,119,6,0.10)')}
      ${netStat('battery_full', 'Batteries Out',      allUsers.filter(u=>u.batteryId).length,              '#D4654A', 'rgba(212,101,74,0.10)')}
    </div>
  `;

  const listCard    = document.getElementById('customer-list-card');
  const searchInput = document.getElementById('home-search');
  let   activeFilter = 'all';

  function applyFilters() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    let filtered = myUsers;
    if (activeFilter !== 'all') filtered = filtered.filter(u => u.kycStatus === activeFilter);
    if (q) filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(q) || u.phone.includes(q)
    );
    listCard.innerHTML = renderList(filtered, activeFilter);
    wireItems(listCard);
  }

  function wireItems(scope) {
    scope.querySelectorAll('.customer-item').forEach(el => {
      el.addEventListener('click', () => onOpenCustomer(el.dataset.id));
    });
  }
  wireItems(listCard);

  // Wire incoming request cards
  container.querySelectorAll('.customer-item[data-incoming]').forEach(el => {
    el.addEventListener('click', () => onOpenCustomer(el.dataset.id));
  });

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

function renderList(users, filter) {
  if (!users.length) {
    const msgs = { all: 'No customers yet', pending: 'No pending customers', verified: 'None verified yet', rejected: 'No rejected customers' };
    return `<div class="empty-state"><span class="material-symbols-outlined">group_add</span><p class="empty-title">${msgs[filter] || msgs.all}</p><p>Tap Register to onboard a new customer.</p></div>`;
  }
  return users.map(u => `
    <div class="customer-item status-${u.kycStatus}" data-id="${u.id}">
      <div class="customer-avatar status-${u.kycStatus}">${u.initials}</div>
      <div style="flex:1;min-width:0">
        <div class="customer-name">${u.name}</div>
        <div class="customer-sub">${u.phone}</div>
        <div class="customer-vehicle">
          <span class="material-symbols-outlined">two_wheeler</span>
          ${u.vehicle}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        ${kycBadge[u.kycStatus] || kycBadge.pending}
        <span style="font-size:10px;color:var(--text-soft)">${fmtDate(u.kycSubmittedAt)}</span>
      </div>
      <span class="material-symbols-outlined" style="font-size:17px;color:var(--text-soft);margin-left:4px">chevron_right</span>
    </div>`).join('');
}

function netStat(iconName, label, value, color, bg) {
  return `
  <div class="net-stat">
    <div class="net-stat-icon" style="background:${bg}">
      <span class="material-symbols-outlined" style="color:${color}">${iconName}</span>
    </div>
    <div>
      <div class="net-stat-val">${value}</div>
      <div class="net-stat-lbl">${label}</div>
    </div>
  </div>`;
}
