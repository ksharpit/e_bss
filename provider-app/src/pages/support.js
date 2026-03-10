// ============================================
// Support - Help & Support Hub (Premium)
// ============================================
import { showToast } from '../utils/toast.js';
import { apiFetch, clearToken } from '../utils/apiFetch.js';

const TICKET_CATS = {
  swap_issue: 'Swap Issue',
  battery_problem: 'Battery Problem',
  billing: 'Billing & Payment',
  station_issue: 'Station Issue',
  app_bug: 'App Bug',
  other: 'Other',
};
const QUERY_CATS = {
  how_swap_works: 'How Swap Works',
  pricing: 'Pricing & Charges',
  deposit_refund: 'Deposit Refund',
  battery_health: 'Battery Health',
  station_availability: 'Station Availability',
  account: 'Account & KYC',
  other: 'Other',
};
const STATUS_BADGE = {
  open:     '<span class="badge badge-amber"><span class="material-symbols-outlined">schedule</span> Open</span>',
  resolved: '<span class="badge badge-green"><span class="material-symbols-outlined">check_circle</span> Resolved</span>',
  closed:   '<span class="badge badge-green"><span class="material-symbols-outlined">verified</span> Closed</span>',
};
const BATT_STATUS_LABEL = {
  deployed:  { icon: 'person',                bg: 'rgba(99,102,241,0.08)',   color: '#6366f1', label: 'Deployed' },
  available: { icon: 'ev_station',            bg: 'rgba(22,163,74,0.08)',    color: 'var(--green)', label: 'At Station' },
  charging:  { icon: 'battery_charging_full', bg: 'rgba(217,119,6,0.08)',    color: 'var(--amber)', label: 'Charging' },
  stock:     { icon: 'inventory_2',           bg: 'rgba(107,114,128,0.08)',  color: '#6b7280', label: 'In Stock' },
  fault:     { icon: 'warning',               bg: 'rgba(239,68,68,0.08)',    color: 'var(--red)', label: 'Faulty' },
};

function fmtTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export async function renderSupport(container, agent) {
  container.innerHTML = `<div class="loading">Loading support data...</div>`;

  let myUsers = [], allUsers = [], tickets = [], batteries = [];
  try {
    [myUsers, allUsers, tickets, batteries] = await Promise.all([
      apiFetch(`/users?onboardedBy=${agent.id}`).then(r => r.json()),
      apiFetch('/users').then(r => r.json()),
      apiFetch('/tickets').then(r => r.json()),
      apiFetch('/batteries').then(r => r.json()),
    ]);
  } catch {
    showToast('Cannot reach API - check server', 'error');
  }

  const myUserIds = new Set(myUsers.map(u => u.id));
  const PROVIDER_TYPES = new Set(['provider_ticket', 'fault_report', 'repair_request']);
  // Customer tickets: raised by users assigned to this agent
  const customerTickets = tickets.filter(t =>
    myUserIds.has(t.userId) && !PROVIDER_TYPES.has(t.type) && t.type !== 'admin_query'
  );
  // My tickets: raised by this provider to admin
  const myTickets = tickets.filter(t =>
    PROVIDER_TYPES.has(t.type) && t.agentId === agent.id
  );
  // Admin queries: sent by admin to this agent
  const adminQueries = tickets.filter(t =>
    t.type === 'admin_query' && t.targetAgentId === agent.id
  );
  const allMyTickets = [...customerTickets, ...myTickets, ...adminQueries];
  allMyTickets.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const openCustomerCount = customerTickets.filter(t => t.status === 'open').length;
  const openMyCount = myTickets.filter(t => t.status === 'open').length;
  const openAdminCount = adminQueries.filter(t => t.status === 'open').length;

  // All user map for battery display
  const userMap = {};
  allUsers.forEach(u => { userMap[u.id] = u.name; });

  // Non-fault batteries (for fault reporting)
  const reportableBatteries = batteries.filter(b => b.status !== 'fault' && b.status !== 'stock');
  // Fault batteries (for repair requests)
  const faultBatteries = batteries.filter(b => b.status === 'fault');

  const initials = agent.name.split(' ').map(w => w[0]).join('').slice(0, 2);

  container.innerHTML = `
    <!-- Agent Profile Hero -->
    <div class="support-profile-hero fade-up">
      <div class="support-profile-decor"></div>
      <div class="support-profile-content">
        <div class="support-profile-avatar">${initials}</div>
        <div class="support-profile-info">
          <h2 class="support-profile-name">${agent.name}</h2>
          <p class="support-profile-id">${agent.id}</p>
          <div class="support-profile-zone">
            <span class="material-symbols-outlined">location_on</span>
            ${agent.zone}
          </div>
        </div>
      </div>
      <div class="support-profile-row">
        <div class="support-profile-tag">
          <span class="material-symbols-outlined">business</span>
          Electica India Pvt. Ltd.
        </div>
        <div class="support-profile-tag">
          <span class="material-symbols-outlined">verified_user</span>
          Field Agent
        </div>
      </div>
    </div>

    <!-- Tickets Section with Filter Tabs -->
    <div class="support-section fade-up" style="animation-delay:0.04s">
      <div class="support-section-header">
        <div class="support-section-icon" style="background:rgba(217,119,6,0.08)">
          <span class="material-symbols-outlined" style="color:var(--amber)">confirmation_number</span>
        </div>
        <div>
          <div class="support-section-title">Tickets & Queries</div>
          <div class="support-section-sub">${allMyTickets.length} total</div>
        </div>
      </div>
      <div class="prov-filter-bar" id="ticket-filter-bar">
        <button class="prov-filter-tab active" data-filter="customer">
          Customers
          ${openCustomerCount > 0 ? `<span class="prov-filter-badge open">${openCustomerCount}</span>` : `<span class="prov-filter-badge">${customerTickets.length}</span>`}
        </button>
        <button class="prov-filter-tab" data-filter="mine">
          My Tickets
          ${openMyCount > 0 ? `<span class="prov-filter-badge open">${openMyCount}</span>` : `<span class="prov-filter-badge">${myTickets.length}</span>`}
        </button>
        <button class="prov-filter-tab" data-filter="admin">
          Admin
          ${openAdminCount > 0 ? `<span class="prov-filter-badge open">${openAdminCount}</span>` : `<span class="prov-filter-badge">${adminQueries.length}</span>`}
        </button>
      </div>
      <div id="tickets-list">
        ${customerTickets.length === 0
          ? `<div class="support-empty">
              <span class="material-symbols-outlined">inbox</span>
              <p>No customer tickets yet</p>
            </div>`
          : customerTickets.slice(0, 10).map(t => ticketItem(t, userMap, agent)).join('')}
        ${customerTickets.length > 10 ? `<div style="text-align:center;padding:10px 0 4px">
          <span style="font-size:var(--font-xs);color:var(--text-soft);font-weight:600">${customerTickets.length - 10} more</span>
        </div>` : ''}
      </div>
    </div>

    <!-- Contact Admin -->
    <div class="support-section fade-up" style="animation-delay:0.08s">
      <div class="support-section-header">
        <div class="support-section-icon" style="background:rgba(212,101,74,0.08)">
          <span class="material-symbols-outlined" style="color:var(--coral)">headset_mic</span>
        </div>
        <div>
          <div class="support-section-title">Contact Admin</div>
          <div class="support-section-sub">Raise issues or reach the admin team</div>
        </div>
      </div>
      <div class="action-row" id="action-raise-ticket">
        <div class="action-row-icon" style="background:rgba(212,101,74,0.08)">
          <span class="material-symbols-outlined" style="color:var(--coral)">edit_note</span>
        </div>
        <div class="action-row-text">
          <div class="action-row-label">Raise a Ticket</div>
          <div class="action-row-sub">Submit an issue or concern to admin</div>
        </div>
        <span class="material-symbols-outlined" style="font-size:17px;color:var(--text-soft)">chevron_right</span>
      </div>
      <div class="action-row" id="action-call">
        <div class="action-row-icon" style="background:rgba(22,163,74,0.08)">
          <span class="material-symbols-outlined" style="color:var(--green)">call</span>
        </div>
        <div class="action-row-text">
          <div class="action-row-label">Call Admin</div>
          <div class="action-row-sub">+91 1800-200-301</div>
        </div>
        <span class="material-symbols-outlined" style="font-size:17px;color:var(--text-soft)">chevron_right</span>
      </div>
      <div class="action-row" id="action-email">
        <div class="action-row-icon" style="background:rgba(99,102,241,0.08)">
          <span class="material-symbols-outlined" style="color:#6366f1">mail</span>
        </div>
        <div class="action-row-text">
          <div class="action-row-label">Email Admin</div>
          <div class="action-row-sub">admin@electica.in</div>
        </div>
        <span class="material-symbols-outlined" style="font-size:17px;color:var(--text-soft)">chevron_right</span>
      </div>
    </div>

    <!-- Report Faulty Battery -->
    <div class="support-section fade-up" style="animation-delay:0.12s">
      <div class="support-section-header">
        <div class="support-section-icon" style="background:rgba(239,68,68,0.08)">
          <span class="material-symbols-outlined" style="color:var(--red)">battery_alert</span>
        </div>
        <div>
          <div class="support-section-title">Report Faulty Battery</div>
          <div class="support-section-sub">Flag any battery for admin review</div>
        </div>
      </div>
      <div style="margin-bottom:12px">
        <label class="form-label">Search or select battery</label>
        <div class="input-wrap">
          <span class="material-symbols-outlined input-icon">search</span>
          <input id="fault-search" class="form-input with-icon" type="text" placeholder="Type battery ID (e.g. BAT-0015)..." autocomplete="off" />
        </div>
      </div>
      <div id="fault-battery-list" style="max-height:200px;overflow-y:auto;margin-bottom:12px">
        ${reportableBatteries.length === 0
          ? `<p style="font-size:var(--font-xs);color:var(--text-soft);text-align:center;padding:12px">No batteries to report</p>`
          : renderBatteryList(reportableBatteries, userMap, '')}
      </div>
      <div id="fault-selected" style="display:none;margin-bottom:12px"></div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Describe the fault <span class="req">*</span></label>
        <textarea id="fault-desc" class="form-input" rows="3" placeholder="e.g. Battery swollen, not charging, overheating, damaged connector..." style="resize:none;font-family:inherit"></textarea>
      </div>
      <button class="btn btn-primary" id="fault-submit" style="font-size:var(--font-sm);opacity:0.4;pointer-events:none">
        <span class="material-symbols-outlined">report</span> Submit Fault Report
      </button>
    </div>

    <!-- Request Battery Repair -->
    <div class="support-section fade-up" style="animation-delay:0.16s">
      <div class="support-section-header">
        <div class="support-section-icon" style="background:rgba(22,163,74,0.08)">
          <span class="material-symbols-outlined" style="color:var(--green)">build</span>
        </div>
        <div>
          <div class="support-section-title">Request Repair Approval</div>
          <div class="support-section-sub">Mark repaired batteries as healthy</div>
        </div>
        ${faultBatteries.length > 0 ? `<span class="support-count-badge" style="background:rgba(239,68,68,0.08);color:var(--red)">${faultBatteries.length}</span>` : ''}
      </div>
      ${faultBatteries.length === 0
        ? `<div class="support-empty">
            <span class="material-symbols-outlined">check_circle</span>
            <p>No faulty batteries in the system - all batteries are healthy</p>
          </div>`
        : `<div id="repair-list">
            ${faultBatteries.map(b => `
            <div class="fault-battery-row" data-id="${b.id}">
              <div class="fault-battery-icon">
                <span class="material-symbols-outlined">battery_alert</span>
              </div>
              <div class="fault-battery-info">
                <div class="fault-battery-id">${b.id}</div>
                <div class="fault-battery-meta">
                  Health ${b.health}% - Cycles ${b.cycleCount}
                  ${b.stationName ? ' - ' + b.stationName : ''}
                </div>
              </div>
              <button class="repair-btn" data-battery='${JSON.stringify({ id: b.id, health: b.health, soc: b.soc })}'>
                <span class="material-symbols-outlined">build</span>
                Repair
              </button>
            </div>`).join('')}
          </div>`}
    </div>

    <!-- Logout -->
    <div class="support-section fade-up" style="animation-delay:0.20s;padding:0;overflow:hidden">
      <div class="action-row" id="logout-btn" style="padding:16px 18px">
        <div class="action-row-icon" style="background:rgba(239,68,68,0.08)">
          <span class="material-symbols-outlined" style="color:var(--red)">logout</span>
        </div>
        <div class="action-row-text">
          <div class="action-row-label" style="color:var(--red)">Logout</div>
          <div class="action-row-sub">Sign out of your account</div>
        </div>
        <span class="material-symbols-outlined" style="font-size:17px;color:var(--text-soft)">chevron_right</span>
      </div>
    </div>

    <p style="text-align:center;font-size:var(--font-xs);color:var(--text-soft);font-weight:500;padding:14px 0 4px">
      Electica Provider App v1.0
    </p>
  `;

  // ── Wire events ──

  // ── Ticket lookup map ──
  const ticketMap = {};
  allMyTickets.forEach(t => { ticketMap[t.id] = t; });

  // ── Wire tappable tickets ──
  function wireTicketTaps() {
    container.querySelectorAll('.ticket-tappable').forEach(el => {
      el.addEventListener('click', () => {
        const t = ticketMap[el.dataset.ticketId];
        if (t) showReplySheet(container, agent, t, userMap);
      });
    });
  }
  wireTicketTaps();

  // ── Filter tabs for tickets ──
  let ticketFilter = 'customer';
  container.querySelectorAll('.prov-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      ticketFilter = tab.dataset.filter;
      container.querySelectorAll('.prov-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const list = document.getElementById('tickets-list');
      if (!list) return;
      const items = ticketFilter === 'admin' ? adminQueries
        : ticketFilter === 'mine' ? myTickets
        : customerTickets;
      const emptyMsg = ticketFilter === 'admin' ? 'No admin queries'
        : ticketFilter === 'mine' ? 'No tickets raised yet'
        : 'No customer tickets yet';
      list.innerHTML = items.length === 0
        ? `<div class="support-empty"><span class="material-symbols-outlined">inbox</span><p>${emptyMsg}</p></div>`
        : items.slice(0, 10).map(t => ticketItem(t, userMap, agent)).join('')
          + (items.length > 10 ? `<div style="text-align:center;padding:10px 0 4px"><span style="font-size:var(--font-xs);color:var(--text-soft);font-weight:600">${items.length - 10} more</span></div>` : '');
      wireTicketTaps();
    });
  });

  // Raise ticket to admin
  document.getElementById('action-raise-ticket')?.addEventListener('click', () => {
    showTicketSheet(container, agent);
  });

  // Call admin
  document.getElementById('action-call')?.addEventListener('click', () => {
    window.location.href = 'tel:+911800200301';
  });

  // Email admin
  document.getElementById('action-email')?.addEventListener('click', () => {
    window.location.href = 'mailto:admin@electica.in?subject=' +
      encodeURIComponent('Provider Issue - Agent ' + agent.id) +
      '&body=' + encodeURIComponent('Hi Admin,\n\nAgent: ' + agent.name + ' (' + agent.id + ')\nZone: ' + agent.zone + '\n\nPlease describe your concern below:\n\n');
  });

  // ── Fault report - battery search + selection ──
  let selectedFaultBattery = null;
  const faultList = document.getElementById('fault-battery-list');
  const faultSelected = document.getElementById('fault-selected');
  const faultSubmitBtn = document.getElementById('fault-submit');

  function updateFaultReady() {
    const desc = document.getElementById('fault-desc')?.value?.trim();
    const ready = !!(selectedFaultBattery && desc);
    faultSubmitBtn.style.opacity = ready ? '1' : '0.4';
    faultSubmitBtn.style.pointerEvents = ready ? 'auto' : 'none';
  }

  document.getElementById('fault-search')?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toUpperCase();
    faultList.innerHTML = renderBatteryList(reportableBatteries, userMap, q);
    wireBatterySelect();
  });

  document.getElementById('fault-desc')?.addEventListener('input', updateFaultReady);

  function wireBatterySelect() {
    faultList.querySelectorAll('.batt-select-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        const bat = reportableBatteries.find(b => b.id === id);
        if (!bat) return;
        selectedFaultBattery = bat;
        const sts = BATT_STATUS_LABEL[bat.status] || BATT_STATUS_LABEL.deployed;
        faultList.style.display = 'none';
        document.getElementById('fault-search').value = bat.id;
        faultSelected.style.display = 'block';
        faultSelected.innerHTML = `
          <div class="fault-selected-card">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
              <div style="width:36px;height:36px;border-radius:10px;background:${sts.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:17px;color:${sts.color};font-variation-settings:'FILL' 1">${sts.icon}</span>
              </div>
              <div style="min-width:0">
                <div style="font-size:var(--font-sm);font-weight:800;color:var(--text);font-family:monospace">${bat.id}</div>
                <div style="font-size:var(--font-xs);color:var(--text-soft)">
                  SOC ${bat.soc}% - Health ${bat.health}% - ${sts.label}
                  ${bat.stationName ? ' - ' + bat.stationName : ''}
                  ${bat.assignedTo ? ' - ' + (userMap[bat.assignedTo] || bat.assignedTo) : ''}
                </div>
              </div>
            </div>
            <button class="fault-change-btn" id="fault-change">Change</button>
          </div>`;
        document.getElementById('fault-change')?.addEventListener('click', () => {
          selectedFaultBattery = null;
          faultSelected.style.display = 'none';
          faultList.style.display = 'block';
          document.getElementById('fault-search').value = '';
          faultList.innerHTML = renderBatteryList(reportableBatteries, userMap, '');
          wireBatterySelect();
          updateFaultReady();
        });
        updateFaultReady();
      });
    });
  }
  wireBatterySelect();

  // Fault submit
  faultSubmitBtn?.addEventListener('click', async () => {
    if (!selectedFaultBattery) { showToast('Select a battery', 'error'); return; }
    const desc = document.getElementById('fault-desc')?.value?.trim();
    if (!desc) { showToast('Describe the fault', 'error'); return; }
    faultSubmitBtn.disabled = true;
    faultSubmitBtn.style.opacity = '0.5';
    faultSubmitBtn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Submitting...';
    try {
      await apiFetch('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'FLT-' + Date.now(),
          type: 'fault_report',
          batteryId: selectedFaultBattery.id,
          batteryStatus: selectedFaultBattery.status,
          agentId: agent.id,
          description: desc,
          status: 'open',
          timestamp: new Date().toISOString(),
        }),
      });
      showToast('Fault report submitted - admin will review', 'success');
      renderSupport(container, agent);
    } catch {
      showToast('Failed to submit report', 'error');
      faultSubmitBtn.disabled = false;
      faultSubmitBtn.style.opacity = '1';
      faultSubmitBtn.innerHTML = '<span class="material-symbols-outlined">report</span> Submit Fault Report';
    }
  });

  // ── Repair request buttons ──
  document.querySelectorAll('.repair-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const batData = JSON.parse(btn.dataset.battery);
      showRepairSheet(container, agent, batData);
    });
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearToken();
    window.location.reload();
  });
}

// ── Render battery list for search/select ──
function renderBatteryList(batteries, userMap, query) {
  let filtered = batteries;
  if (query) {
    filtered = batteries.filter(b =>
      b.id.toUpperCase().includes(query) ||
      (b.stationName || '').toUpperCase().includes(query) ||
      (userMap[b.assignedTo] || '').toUpperCase().includes(query)
    );
  }
  if (filtered.length === 0) {
    return `<p style="font-size:var(--font-xs);color:var(--text-soft);text-align:center;padding:14px">No batteries found</p>`;
  }
  return filtered.map(b => {
    const sts = BATT_STATUS_LABEL[b.status] || BATT_STATUS_LABEL.deployed;
    const owner = b.assignedTo ? (userMap[b.assignedTo] || b.assignedTo) : (b.stationName || '-');
    return `
    <div class="batt-select-row" data-id="${b.id}">
      <div class="batt-select-icon" style="background:${sts.bg}">
        <span class="material-symbols-outlined" style="color:${sts.color}">${sts.icon}</span>
      </div>
      <div class="batt-select-info">
        <span class="batt-select-id">${b.id}</span>
        <span class="batt-select-meta">${sts.label} - ${owner}</span>
      </div>
      <div class="batt-select-stats">
        <span style="color:var(--green)">SOC ${b.soc}%</span>
        <span style="color:${b.health < 85 ? 'var(--red)' : 'var(--text-soft)'}">HP ${b.health}%</span>
      </div>
    </div>`;
  }).join('');
}

// ── Ticket item renderer ──
function ticketItem(t, userMap, agent) {
  const isTicket = t.type === 'ticket';
  const isFault = t.type === 'fault_report';
  const isRepair = t.type === 'repair_request';
  const isProviderTicket = t.type === 'provider_ticket';
  const isAdminQuery = t.type === 'admin_query';
  const catLabel = isAdminQuery ? (t.subject || 'Admin Concern')
                 : isTicket ? (TICKET_CATS[t.category] || t.category)
                 : isFault ? 'Battery Fault' + (t.batteryId ? ' - ' + t.batteryId : '')
                 : isRepair ? 'Repair Request' + (t.batteryId ? ' - ' + t.batteryId : '')
                 : isProviderTicket ? (t.category || 'Provider Issue')
                 : (QUERY_CATS[t.category] || t.category);
  const typeIcon = isAdminQuery ? 'admin_panel_settings'
                 : isFault ? 'battery_alert'
                 : isRepair ? 'build'
                 : isProviderTicket ? 'support_agent'
                 : isTicket ? 'confirmation_number' : 'chat_bubble';
  const typeBg = isAdminQuery ? 'rgba(8,145,178,0.08)'
               : isFault ? 'rgba(239,68,68,0.08)'
               : isRepair ? 'rgba(22,163,74,0.08)'
               : isProviderTicket ? 'rgba(212,101,74,0.08)'
               : isTicket ? 'rgba(217,119,6,0.08)' : 'rgba(99,102,241,0.08)';
  const typeColor = isAdminQuery ? '#0891b2'
                  : isFault ? 'var(--red)'
                  : isRepair ? 'var(--green)'
                  : isProviderTicket ? 'var(--coral)'
                  : isTicket ? 'var(--amber)' : '#6366f1';
  const sourceLabel = isAdminQuery ? 'Admin'
                    : (userMap[t.userId] || t.userId || agent.name);
  const descSnippet = t.description ? ` - ${t.description.slice(0, 50)}${t.description.length > 50 ? '...' : ''}` : '';
  const hasReplies = Array.isArray(t.replies) && t.replies.length > 0;
  return `
  <div class="ticket-item ticket-tappable" data-ticket-id="${t.id}" style="cursor:pointer">
    <div class="ticket-icon" style="background:${typeBg}">
      <span class="material-symbols-outlined" style="color:${typeColor}">${typeIcon}</span>
    </div>
    <div class="ticket-info">
      <div class="ticket-title">${catLabel}</div>
      <div class="ticket-meta">${sourceLabel} - ${fmtTime(t.timestamp)}${descSnippet}</div>
      ${hasReplies ? `<div style="font-size:10px;color:var(--coral);font-weight:700;margin-top:2px">${t.replies.length} repl${t.replies.length === 1 ? 'y' : 'ies'}</div>` : ''}
    </div>
    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
      ${STATUS_BADGE[t.status] || STATUS_BADGE.open}
      <span class="material-symbols-outlined" style="font-size:16px;color:var(--text-soft)">chevron_right</span>
    </div>
  </div>`;
}

// ── Bottom sheet: Raise ticket to admin ──
function showTicketSheet(container, agent) {
  const existing = document.getElementById('support-sheet');
  if (existing) existing.remove();

  const sheet = document.createElement('div');
  sheet.id = 'support-sheet';
  sheet.className = 'sheet-overlay';
  sheet.innerHTML = `
    <div class="sheet-content">
      <div class="sheet-handle"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="width:44px;height:44px;border-radius:13px;background:rgba(212,101,74,0.08);display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:21px;color:var(--coral);font-variation-settings:'FILL' 1">edit_note</span>
        </div>
        <div>
          <h3 style="font-size:var(--font-lg);font-weight:800;color:var(--text);letter-spacing:-0.02em">Raise a Ticket</h3>
          <p style="font-size:var(--font-xs);color:var(--text-soft)">Admin will respond within 24 hours</p>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Category <span class="req">*</span></label>
        <div class="select-wrapper">
          <select id="pticket-cat" class="form-select">
            <option value="customer_issue">Customer Issue</option>
            <option value="battery_concern">Battery Concern</option>
            <option value="station_problem">Station Problem</option>
            <option value="commission">Commission & Payouts</option>
            <option value="app_issue">App Issue</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Describe the issue <span class="req">*</span></label>
        <textarea id="pticket-desc" class="form-input" rows="4" placeholder="Explain your concern in detail..." style="resize:none;font-family:inherit"></textarea>
      </div>

      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" id="pticket-cancel" style="width:auto;padding:14px 20px;flex-shrink:0">Cancel</button>
        <button class="btn btn-primary" id="pticket-submit" style="flex:1">
          <span class="material-symbols-outlined">send</span> Submit
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(sheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.remove(); });
  document.getElementById('pticket-cancel')?.addEventListener('click', () => sheet.remove());

  document.getElementById('pticket-submit')?.addEventListener('click', async () => {
    const desc = document.getElementById('pticket-desc')?.value?.trim();
    const cat = document.getElementById('pticket-cat')?.value;
    if (!desc) { showToast('Describe your issue', 'error'); return; }
    const btn = document.getElementById('pticket-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Submitting...';
    try {
      await apiFetch('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'PTK-' + Date.now(),
          type: 'provider_ticket',
          agentId: agent.id,
          category: cat,
          description: desc,
          status: 'open',
          timestamp: new Date().toISOString(),
        }),
      });
      sheet.remove();
      showToast('Ticket submitted to admin', 'success');
      renderSupport(container, agent);
    } catch {
      showToast('Failed to submit ticket', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">send</span> Submit';
    }
  });
}

// ── Bottom sheet: Repair request ──
function showRepairSheet(container, agent, bat) {
  const existing = document.getElementById('repair-sheet');
  if (existing) existing.remove();

  const sheet = document.createElement('div');
  sheet.id = 'repair-sheet';
  sheet.className = 'sheet-overlay';
  sheet.innerHTML = `
    <div class="sheet-content">
      <div class="sheet-handle"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="width:44px;height:44px;border-radius:13px;background:rgba(22,163,74,0.08);display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:21px;color:var(--green);font-variation-settings:'FILL' 1">build</span>
        </div>
        <div>
          <h3 style="font-size:var(--font-lg);font-weight:800;color:var(--text);letter-spacing:-0.02em">Repair Approval</h3>
          <p style="font-size:var(--font-xs);color:var(--text-soft)">Request admin to mark battery as healthy</p>
        </div>
      </div>

      <div style="padding:14px;background:var(--bg);border:1px solid var(--border-light);border-radius:12px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:40px;height:40px;border-radius:11px;background:rgba(239,68,68,0.08);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="font-size:19px;color:var(--red);font-variation-settings:'FILL' 1">battery_alert</span>
          </div>
          <div>
            <p style="font-size:var(--font-sm);font-weight:800;font-family:monospace;color:var(--text)">${bat.id}</p>
            <p style="font-size:var(--font-xs);color:var(--text-soft)">SOC ${bat.soc}% - Health ${bat.health}% - Currently marked as Faulty</p>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Repair notes <span class="req">*</span></label>
        <textarea id="repair-desc" class="form-input" rows="3" placeholder="Describe what was repaired (e.g. connector replaced, cells reconditioned...)" style="resize:none;font-family:inherit"></textarea>
      </div>

      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" id="repair-cancel" style="width:auto;padding:14px 20px;flex-shrink:0">Cancel</button>
        <button class="btn" id="repair-submit" style="flex:1;background:linear-gradient(145deg,#22c55e,#16a34a);color:#fff;box-shadow:0 6px 16px rgba(22,163,74,0.30)">
          <span class="material-symbols-outlined">verified</span> Request Approval
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(sheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.remove(); });
  document.getElementById('repair-cancel')?.addEventListener('click', () => sheet.remove());

  document.getElementById('repair-submit')?.addEventListener('click', async () => {
    const desc = document.getElementById('repair-desc')?.value?.trim();
    if (!desc) { showToast('Describe the repair done', 'error'); return; }
    const btn = document.getElementById('repair-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Submitting...';
    try {
      await apiFetch('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'RPR-' + Date.now(),
          type: 'repair_request',
          batteryId: bat.id,
          agentId: agent.id,
          description: desc,
          status: 'open',
          timestamp: new Date().toISOString(),
        }),
      });
      sheet.remove();
      showToast('Repair request submitted - admin will review', 'success');
      renderSupport(container, agent);
    } catch {
      showToast('Failed to submit request', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">verified</span> Request Approval';
    }
  });
}

// ── Bottom sheet: Ticket conversation thread ──
function showReplySheet(container, agent, ticket, userMap) {
  const existing = document.getElementById('reply-sheet');
  if (existing) existing.remove();

  const isAdminQuery = ticket.type === 'admin_query';
  const isFault = ticket.type === 'fault_report';
  const isRepair = ticket.type === 'repair_request';
  const isProviderTicket = ticket.type === 'provider_ticket';
  const catLabel = isAdminQuery ? (ticket.subject || 'Admin Concern')
    : isFault ? 'Battery Fault' + (ticket.batteryId ? ' - ' + ticket.batteryId : '')
    : isRepair ? 'Repair Request' + (ticket.batteryId ? ' - ' + ticket.batteryId : '')
    : (TICKET_CATS[ticket.category] || QUERY_CATS[ticket.category] || ticket.category || 'Ticket');
  const iconName = isAdminQuery ? 'admin_panel_settings' : isFault ? 'battery_alert' : isRepair ? 'build' : 'confirmation_number';
  const iconColor = isAdminQuery ? '#0891b2' : isFault ? 'var(--red)' : isRepair ? 'var(--green)' : 'var(--amber)';
  const iconBg = isAdminQuery ? 'rgba(8,145,178,0.08)' : isFault ? 'rgba(239,68,68,0.08)' : isRepair ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.08)';

  // Provider is the originator for: provider_ticket, fault_report, repair_request
  const providerIsOriginator = isProviderTicket || isFault || isRepair;
  // Provider can only resolve general provider_tickets, NOT fault_report or repair_request (admin approval required)
  const canResolve = isProviderTicket && ticket.status === 'open';
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  // Build conversation thread
  const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
  // First message is the original description
  const originSender = isAdminQuery ? 'Admin'
    : (ticket.userId ? (userMap[ticket.userId] || ticket.userId) : agent.name);
  const originRole = isAdminQuery ? 'admin' : (ticket.userId ? 'user' : 'agent');

  function msgBubble(sender, role, text, time, isMe) {
    const bgColor = isMe ? 'var(--coral-light)' : 'var(--bg)';
    const borderColor = isMe ? 'var(--coral-border)' : 'var(--border-light)';
    const roleIcon = role === 'admin' ? 'admin_panel_settings' : role === 'agent' ? 'support_agent' : 'person';
    const roleColor = role === 'admin' ? '#0891b2' : role === 'agent' ? 'var(--coral)' : '#6366f1';
    return `
    <div style="padding:12px;background:${bgColor};border:1px solid ${borderColor};border-radius:12px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span class="material-symbols-outlined" style="font-size:14px;color:${roleColor}">${roleIcon}</span>
        <span style="font-size:var(--font-xs);font-weight:700;color:${roleColor}">${sender}</span>
        <span style="font-size:10px;color:var(--text-soft);margin-left:auto">${time}</span>
      </div>
      <div style="font-size:var(--font-sm);color:var(--text);line-height:1.5">${text}</div>
    </div>`;
  }

  let threadHtml = '';
  // Original message
  if (ticket.description) {
    threadHtml += msgBubble(originSender, originRole, ticket.description, fmtTime(ticket.timestamp), originRole === 'agent');
  }
  // Replies
  replies.forEach(r => {
    const isMe = r.from === agent.id;
    threadHtml += msgBubble(r.name || r.from, r.role || 'unknown', r.text, fmtTime(r.timestamp), isMe);
  });

  const sheet = document.createElement('div');
  sheet.id = 'reply-sheet';
  sheet.className = 'sheet-overlay';
  sheet.innerHTML = `
    <div class="sheet-content" style="max-height:88vh;display:flex;flex-direction:column">
      <div class="sheet-handle"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-shrink:0">
        <div style="width:44px;height:44px;border-radius:13px;background:${iconBg};display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:21px;color:${iconColor};font-variation-settings:'FILL' 1">${iconName}</span>
        </div>
        <div style="flex:1;min-width:0">
          <h3 style="font-size:var(--font-lg);font-weight:800;color:var(--text);letter-spacing:-0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${catLabel}</h3>
          <p style="font-size:var(--font-xs);color:var(--text-soft)">${isResolved ? 'Resolved' : 'Open conversation'}</p>
        </div>
        ${isResolved
          ? '<span class="badge badge-green" style="flex-shrink:0"><span class="material-symbols-outlined">check_circle</span> Resolved</span>'
          : '<span class="badge badge-amber" style="flex-shrink:0"><span class="material-symbols-outlined">schedule</span> Open</span>'}
      </div>

      <!-- Conversation thread -->
      <div style="flex:1;overflow-y:auto;margin-bottom:14px;padding:2px" id="reply-thread">
        ${threadHtml || '<p style="text-align:center;color:var(--text-soft);font-size:var(--font-xs);padding:16px">No messages</p>'}
      </div>

      ${isResolved ? `
        <div style="text-align:center;padding:10px 0;color:var(--text-soft);font-size:var(--font-xs);font-weight:600">
          This ticket has been resolved
        </div>
      ` : `
        <!-- Reply input -->
        <div style="flex-shrink:0">
          <div style="display:flex;gap:8px;align-items:flex-end">
            <textarea id="reply-text" class="form-input" rows="2" placeholder="Type your reply..." style="resize:none;font-family:inherit;flex:1"></textarea>
            <button class="btn btn-primary" id="reply-send" style="width:auto;padding:12px 16px;flex-shrink:0;height:fit-content">
              <span class="material-symbols-outlined">send</span>
            </button>
          </div>
          ${canResolve ? `
            <button class="btn btn-ghost" id="reply-resolve" style="width:100%;margin-top:10px;color:var(--green);border-color:var(--green-border)">
              <span class="material-symbols-outlined">check_circle</span> Mark as Resolved
            </button>
          ` : ''}
        </div>
      `}
    </div>
  `;

  document.body.appendChild(sheet);
  // Scroll thread to bottom
  const thread = document.getElementById('reply-thread');
  if (thread) thread.scrollTop = thread.scrollHeight;

  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.remove(); });

  // Send reply (adds to replies array, does NOT resolve)
  document.getElementById('reply-send')?.addEventListener('click', async () => {
    const text = document.getElementById('reply-text')?.value?.trim();
    if (!text) { showToast('Type a reply first', 'error'); return; }

    const btn = document.getElementById('reply-send');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span>';

    const newReply = {
      from: agent.id,
      name: agent.name,
      role: 'agent',
      text,
      timestamp: new Date().toISOString(),
    };
    const updatedReplies = [...replies, newReply];

    try {
      await apiFetch(`/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replies: updatedReplies }),
      });
      sheet.remove();
      showToast('Reply sent', 'success');
      renderSupport(container, agent);
    } catch {
      showToast('Failed to send reply', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">send</span>';
    }
  });

  // Resolve (only for tickets provider originated)
  document.getElementById('reply-resolve')?.addEventListener('click', async () => {
    const btn = document.getElementById('reply-resolve');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Resolving...';
    try {
      await apiFetch(`/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', resolvedAt: new Date().toISOString() }),
      });
      sheet.remove();
      showToast('Ticket resolved', 'success');
      renderSupport(container, agent);
    } catch {
      showToast('Failed to resolve', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Mark as Resolved';
    }
  });
}
