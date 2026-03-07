// ============================================
// Support Page - Admin Ticket Supervision
// ============================================
import { icon } from '../components/icons.js';
import { showToast } from '../utils/toast.js';
import { apiFetch } from '../utils/apiFetch.js';

const TICKET_CATS = {
  swap_issue: 'Swap Issue', battery_problem: 'Battery Problem',
  billing: 'Billing & Payment', station_issue: 'Station Issue',
  app_bug: 'App Bug', other: 'Other',
};
const QUERY_CATS = {
  how_swap_works: 'How Swap Works', pricing: 'Pricing & Charges',
  deposit_refund: 'Deposit Refund', battery_health: 'Battery Health',
  station_availability: 'Station Availability', account: 'Account & KYC', other: 'Other',
};
const PROVIDER_CATS = {
  customer_issue: 'Customer Issue', battery_concern: 'Battery Concern',
  station_problem: 'Station Problem', commission: 'Commission & Payouts',
  app_issue: 'App Issue', other: 'Other',
};

function fmtTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status) {
  const map = {
    open:     { bg: '#fef3c7', color: '#d97706', icon: 'schedule',     label: 'Open' },
    resolved: { bg: '#dcfce7', color: '#16a34a', icon: 'check_circle', label: 'Resolved' },
    closed:   { bg: '#e0e7ff', color: '#4f46e5', icon: 'verified',     label: 'Closed' },
  };
  const s = map[status] || map.open;
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${s.bg};color:${s.color}">
    <span class="material-symbols-outlined" style="font-size:13px">${s.icon}</span>${s.label}
  </span>`;
}

export async function renderSupport(container) {
  container.innerHTML = `<div style="max-width:100%;overflow:hidden">
    <div class="page-header"><div>
      <h1 class="page-title">Support & Tickets</h1>
      <p class="page-desc">Supervise tickets, respond to providers, and track resolution</p>
    </div></div>
    <div style="display:flex;align-items:center;justify-content:center;padding:3rem">
      <span class="material-symbols-outlined" style="font-size:28px;color:#94a3b8;animation:spin 1s linear infinite">progress_activity</span>
    </div>
  </div>`;

  let tickets = [], users = [], agents = [];
  try {
    const results = await Promise.all([
      apiFetch('/tickets').then(r => r.json()),
      apiFetch('/users').then(r => r.json()),
      apiFetch('/agents').then(r => r.json()),
    ]);
    tickets = Array.isArray(results[0]) ? results[0] : [];
    users = Array.isArray(results[1]) ? results[1] : [];
    agents = Array.isArray(results[2]) ? results[2] : [];
  } catch {
    showToast('Failed to load support data', 'error');
  }

  tickets.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });
  const agentMap = {};
  agents.forEach(a => { agentMap[a.id] = a; });

  // Categorize tickets
  const userTickets = tickets.filter(t => t.type === 'ticket' || t.type === 'query');
  const providerTickets = tickets.filter(t => t.type === 'provider_ticket' || t.type === 'fault_report' || t.type === 'repair_request');
  const adminQueries = tickets.filter(t => t.type === 'admin_query');

  const openUser = userTickets.filter(t => t.status === 'open').length;
  const openProvider = providerTickets.filter(t => t.status === 'open').length;
  const openAdmin = adminQueries.filter(t => t.status === 'open').length;
  const totalOpen = openUser + openProvider + openAdmin;

  container.innerHTML = `
  <div style="max-width:100%;overflow:hidden">
    <div class="page-header">
      <div>
        <h1 class="page-title">Support & Tickets</h1>
        <p class="page-desc">Supervise tickets, respond to providers, and track resolution</p>
      </div>
      <button class="btn btn-primary" id="admin-send-query-btn" style="flex-shrink:0">
        ${icon('send', '16px')} Send Query to Provider
      </button>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
      ${statCard('Total Tickets', tickets.length, 'confirmation_number', '#D4654A', 'rgba(212,101,74,0.08)')}
      ${statCard('Open', totalOpen, 'schedule', '#d97706', '#fef3c7')}
      ${statCard('User Tickets', userTickets.length, 'person', '#6366f1', 'rgba(99,102,241,0.08)')}
      ${statCard('Admin Queries', adminQueries.length, 'admin_panel_settings', '#0891b2', 'rgba(8,145,178,0.08)')}
    </div>

    <!-- Ticket list card -->
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:1.5rem">
      <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:12px">
        <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px">
          ${icon('inbox', '20px', 'color:#D4654A')} All Tickets
        </h3>
        <div style="flex:1"></div>
        <div id="ticket-filters" style="display:flex;gap:6px">
          <button class="adm-filter-tab active" data-filter="all">All <span class="adm-filter-count">${tickets.length}</span></button>
          <button class="adm-filter-tab" data-filter="user">User Tickets <span class="adm-filter-count" style="${openUser > 0 ? 'background:#fef3c7;color:#d97706' : ''}">${openUser > 0 ? openUser + ' open' : userTickets.length}</span></button>
          <button class="adm-filter-tab" data-filter="provider">Provider <span class="adm-filter-count" style="${openProvider > 0 ? 'background:#fef3c7;color:#d97706' : ''}">${openProvider > 0 ? openProvider + ' open' : providerTickets.length}</span></button>
          <button class="adm-filter-tab" data-filter="admin">Admin Queries <span class="adm-filter-count" style="${openAdmin > 0 ? 'background:#fef3c7;color:#d97706' : ''}">${openAdmin > 0 ? openAdmin + ' open' : adminQueries.length}</span></button>
        </div>
      </div>
      <div id="ticket-list-body" style="max-height:520px;overflow-y:auto">
        ${tickets.length === 0
          ? emptyState('No tickets yet', 'Tickets from users and providers will appear here')
          : tickets.map(t => ticketRow(t, userMap, agentMap)).join('')}
      </div>
    </div>

    <!-- Bottom row: FAQ + System Status -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
      <div class="card" style="padding:1.5rem">
        <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
          ${icon('help', '20px', 'color:#D4654A')} FAQ
        </h3>
        <div style="display:flex;flex-direction:column;gap:8px" id="faq-list">
          ${faqItem('How do I add a new swap station?', 'Navigate to Dashboard, click "+ New Station" in the header, fill in station details including location, capacity, and pod configuration.')}
          ${faqItem('What does cell imbalance mean?', 'Cell imbalance indicates voltage differences between individual cells in a battery pack. If detected, schedule an inspection via Battery Analytics.')}
          ${faqItem('What are the battery health thresholds?', 'Above 90% SOH = green (Optimal). 70-90% = yellow (Warning). Below 70% = red (Critical) and recommended for retirement.')}
        </div>
      </div>
      <div class="card" style="padding:1.5rem">
        <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
          ${icon('monitoring', '20px', 'color:#D4654A')} System Status
        </h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          ${statusItem('API Gateway', 'Operational', 'success')}
          ${statusItem('Database', 'Operational', 'success')}
          ${statusItem('IoT Bridge', 'Degraded', 'warning')}
          ${statusItem('Analytics', 'Operational', 'success')}
        </div>
      </div>
    </div>

    <footer class="app-footer" style="margin-top:2rem">
      ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#9ca3af')}
      Electica Enterprise Dashboard
    </footer>
  </div>`;

  // ── Filter tabs ──
  let activeFilter = 'all';
  container.querySelectorAll('.adm-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeFilter = tab.dataset.filter;
      container.querySelectorAll('.adm-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterTickets();
    });
  });

  function filterTickets() {
    const body = document.getElementById('ticket-list-body');
    if (!body) return;
    let filtered = tickets;
    if (activeFilter === 'user') filtered = userTickets;
    else if (activeFilter === 'provider') filtered = providerTickets;
    else if (activeFilter === 'admin') filtered = adminQueries;
    body.innerHTML = filtered.length === 0
      ? emptyState('No tickets', 'No tickets in this category')
      : filtered.map(t => ticketRow(t, userMap, agentMap)).join('');
    wireTicketRows();
  }

  // ── Ticket row click -> open detail modal ──
  const ticketMap = {};
  tickets.forEach(t => { ticketMap[t.id] = t; });

  function wireTicketRows() {
    container.querySelectorAll('.adm-ticket-row[data-ticket-id]').forEach(row => {
      row.addEventListener('click', () => {
        const t = ticketMap[row.dataset.ticketId];
        if (t) showTicketDetailModal(container, t, userMap, agentMap);
      });
    });
  }
  wireTicketRows();

  // ── Send query to provider ──
  document.getElementById('admin-send-query-btn')?.addEventListener('click', () => {
    showAdminQueryModal(container, agents);
  });

  // ── FAQ accordion ──
  container.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => {
      const answer = item.querySelector('.faq-answer');
      const chevron = item.querySelector('.faq-chevron');
      const isOpen = answer.style.maxHeight !== '0px' && answer.style.maxHeight !== '';
      container.querySelectorAll('.faq-answer').forEach(a => { a.style.maxHeight = '0px'; a.style.padding = '0 12px'; });
      container.querySelectorAll('.faq-chevron').forEach(c => c.style.transform = 'rotate(0deg)');
      if (!isOpen) {
        answer.style.maxHeight = '200px';
        answer.style.padding = '8px 12px 12px';
        chevron.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// ── Ticket row renderer ──
function ticketRow(t, userMap, agentMap) {
  const typeConfig = {
    ticket:          { icon: 'confirmation_number', color: '#d97706', bg: '#fef3c7', label: 'User Ticket' },
    query:           { icon: 'chat_bubble',         color: '#6366f1', bg: 'rgba(99,102,241,0.08)', label: 'User Query' },
    provider_ticket: { icon: 'support_agent',       color: '#D4654A', bg: 'rgba(212,101,74,0.08)', label: 'Provider Ticket' },
    fault_report:    { icon: 'battery_alert',       color: '#ef4444', bg: '#fef2f2', label: 'Fault Report' },
    repair_request:  { icon: 'build',               color: '#16a34a', bg: '#dcfce7', label: 'Repair Request' },
    admin_query:     { icon: 'admin_panel_settings', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', label: 'Admin Query' },
  };
  const cfg = typeConfig[t.type] || typeConfig.ticket;

  const catLabel = t.type === 'ticket' ? (TICKET_CATS[t.category] || t.category || '-')
    : t.type === 'query' ? (QUERY_CATS[t.category] || t.category || '-')
    : t.type === 'provider_ticket' ? (PROVIDER_CATS[t.category] || t.category || '-')
    : t.type === 'fault_report' ? 'Battery Fault' + (t.batteryId ? ' - ' + t.batteryId : '')
    : t.type === 'repair_request' ? 'Repair' + (t.batteryId ? ' - ' + t.batteryId : '')
    : t.type === 'admin_query' ? (t.subject || 'Admin Concern')
    : '-';

  // Source info
  let sourceLabel = '';
  if (t.userId && userMap[t.userId]) {
    const u = userMap[t.userId];
    sourceLabel = `<span style="color:#6366f1"><span class="material-symbols-outlined" style="font-size:13px;vertical-align:-2px">person</span> ${u.name}</span>`;
  }
  if (t.agentId && agentMap[t.agentId]) {
    const a = agentMap[t.agentId];
    const prefix = sourceLabel ? ' / ' : '';
    sourceLabel += `${prefix}<span style="color:#D4654A"><span class="material-symbols-outlined" style="font-size:13px;vertical-align:-2px">support_agent</span> ${a.name}</span>`;
  }
  if (t.type === 'admin_query' && t.targetAgentId && agentMap[t.targetAgentId]) {
    sourceLabel = `<span style="color:#0891b2"><span class="material-symbols-outlined" style="font-size:13px;vertical-align:-2px">arrow_forward</span> To: ${agentMap[t.targetAgentId].name}</span>`;
  }

  const replyCount = Array.isArray(t.replies) ? t.replies.length : 0;

  return `
  <div class="adm-ticket-row" data-ticket-id="${t.id}" style="display:flex;align-items:center;gap:14px;padding:14px 1.5rem;border-bottom:1px solid var(--border-light);transition:background 0.15s;cursor:pointer"
    onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
    <div style="width:38px;height:38px;border-radius:11px;background:${cfg.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <span class="material-symbols-outlined" style="font-size:18px;color:${cfg.color}">${cfg.icon}</span>
    </div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
        <span style="font-size:var(--font-md);font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${catLabel}</span>
        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:${cfg.bg};color:${cfg.color};white-space:nowrap">${cfg.label}</span>
      </div>
      <div style="font-size:var(--font-xs);color:#94a3b8;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${sourceLabel}
        <span>${fmtTime(t.timestamp)}</span>
        ${t.description ? `<span style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#64748b">${t.description}</span>` : ''}
        ${replyCount > 0 ? `<span style="color:#D4654A;font-weight:700">${replyCount} repl${replyCount === 1 ? 'y' : 'ies'}</span>` : ''}
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
      ${statusBadge(t.status)}
      <span class="material-symbols-outlined" style="font-size:16px;color:#cbd5e1">chevron_right</span>
    </div>
  </div>`;
}

// ── Stat card ──
function statCard(label, value, iconName, color, bg) {
  return `
  <div class="card" style="padding:1.25rem;display:flex;align-items:center;gap:14px">
    <div style="width:44px;height:44px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <span class="material-symbols-outlined" style="font-size:22px;color:${color}">${iconName}</span>
    </div>
    <div>
      <div style="font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-0.02em">${value}</div>
      <div style="font-size:var(--font-xs);color:#94a3b8;font-weight:600">${label}</div>
    </div>
  </div>`;
}

// ── Empty state ──
function emptyState(title, desc) {
  return `<div style="text-align:center;padding:3rem 1rem;color:#94a3b8">
    <span class="material-symbols-outlined" style="font-size:36px;margin-bottom:8px;display:block">inbox</span>
    <p style="font-weight:700;font-size:var(--font-md);margin-bottom:4px">${title}</p>
    <p style="font-size:var(--font-sm)">${desc}</p>
  </div>`;
}

// ── Admin query modal ──
function showAdminQueryModal(container, agents) {
  const existing = document.getElementById('admin-query-modal');
  if (existing) existing.remove();

  let selectedAgentId = agents.length > 0 ? agents[0].id : null;

  const overlay = document.createElement('div');
  overlay.id = 'admin-query-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)';

  function agentCards() {
    return agents.map(a => {
      const initials = a.name.split(' ').map(w => w[0]).join('').slice(0, 2);
      const sel = a.id === selectedAgentId;
      return `<div class="aq-agent-card" data-id="${a.id}" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;cursor:pointer;transition:all 0.15s;border:2px solid ${sel ? '#0891b2' : '#e2e8f0'};background:${sel ? 'rgba(8,145,178,0.04)' : '#fff'}">
        <div style="width:36px;height:36px;border-radius:50%;background:${sel ? '#0891b2' : '#f1f5f9'};color:${sel ? '#fff' : '#64748b'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0">${initials}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700;color:#1e293b">${a.name}</div>
          <div style="font-size:12px;color:#94a3b8">${a.id} - ${a.zone}</div>
        </div>
        ${sel ? '<span class="material-symbols-outlined" style="font-size:20px;color:#0891b2;font-variation-settings:\'FILL\' 1">check_circle</span>' : ''}
      </div>`;
    }).join('');
  }

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:2rem;width:480px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,0.15)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:1.5rem">
        <div style="width:44px;height:44px;border-radius:13px;background:rgba(8,145,178,0.08);display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:22px;color:#0891b2">send</span>
        </div>
        <div>
          <h3 style="font-size:18px;font-weight:800;color:#1e293b;letter-spacing:-0.02em">Send Query to Provider</h3>
          <p style="font-size:12px;color:#94a3b8">This will appear in the provider's Support tab</p>
        </div>
        <button id="aq-close" style="margin-left:auto;width:32px;height:32px;border-radius:10px;border:none;background:#f1f5f9;cursor:pointer;display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:18px;color:#94a3b8">close</span>
        </button>
      </div>

      <div style="margin-bottom:1rem">
        <label style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:8px">Select Provider</label>
        <div id="aq-agent-list" style="display:flex;flex-direction:column;gap:8px;max-height:160px;overflow-y:auto">
          ${agentCards()}
        </div>
      </div>

      <div style="margin-bottom:1rem">
        <label style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Subject</label>
        <input id="aq-subject" type="text" placeholder="Brief subject line..." style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;color:#1e293b;background:#f8fafc;box-sizing:border-box;outline:none" />
      </div>

      <div style="margin-bottom:1.25rem">
        <label style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Message</label>
        <textarea id="aq-message" rows="4" placeholder="Describe your concern or query in detail..." style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;color:#1e293b;background:#f8fafc;resize:vertical;box-sizing:border-box;outline:none"></textarea>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="aq-cancel" style="padding:10px 20px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;font-weight:600;font-size:14px;cursor:pointer">Cancel</button>
        <button id="aq-submit" class="btn btn-primary" style="padding:10px 24px">
          <span class="material-symbols-outlined" style="font-size:16px">send</span> Send Query
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Wire agent card selection
  function wireAgentCards() {
    overlay.querySelectorAll('.aq-agent-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedAgentId = card.dataset.id;
        document.getElementById('aq-agent-list').innerHTML = agentCards();
        wireAgentCards();
      });
    });
  }
  wireAgentCards();

  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('aq-close')?.addEventListener('click', () => overlay.remove());
  document.getElementById('aq-cancel')?.addEventListener('click', () => overlay.remove());

  document.getElementById('aq-submit')?.addEventListener('click', async () => {
    if (!selectedAgentId) { showToast('Select a provider', 'warning'); return; }
    const subject = document.getElementById('aq-subject')?.value?.trim();
    const message = document.getElementById('aq-message')?.value?.trim();
    if (!subject) { showToast('Enter a subject', 'warning'); return; }
    if (!message) { showToast('Enter a message', 'warning'); return; }

    const btn = document.getElementById('aq-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;animation:spin 1s linear infinite">progress_activity</span> Sending...';

    try {
      await apiFetch('/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'AQ-' + Date.now(),
          type: 'admin_query',
          targetAgentId: selectedAgentId,
          subject,
          description: message,
          status: 'open',
          timestamp: new Date().toISOString(),
        }),
      });
      overlay.remove();
      showToast('Query sent to provider', 'success');
      renderSupport(container);
    } catch {
      showToast('Failed to send query', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">send</span> Send Query';
    }
  });
}

// ── FAQ ──
function faqItem(question, answer) {
  return `
  <div class="faq-item" style="border:1px solid #f1f5f9;border-radius:10px;overflow:hidden">
    <div class="faq-question" style="padding:12px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-weight:600;font-size:var(--font-md);color:#1e293b;transition:background 0.15s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
      ${question}
      <span class="material-symbols-outlined faq-chevron" style="font-size:18px;color:#94a3b8;transition:transform 0.2s">expand_more</span>
    </div>
    <div class="faq-answer" style="max-height:0px;overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease;padding:0 12px;font-size:var(--font-sm);color:#64748b;line-height:1.5">${answer}</div>
  </div>`;
}

// ── Ticket detail modal with conversation thread ──
function showTicketDetailModal(container, ticket, userMap, agentMap) {
  const existing = document.getElementById('ticket-detail-modal');
  if (existing) existing.remove();

  const typeConfig = {
    ticket:          { icon: 'confirmation_number', color: '#d97706', bg: '#fef3c7', label: 'User Ticket' },
    query:           { icon: 'chat_bubble',         color: '#6366f1', bg: 'rgba(99,102,241,0.08)', label: 'User Query' },
    provider_ticket: { icon: 'support_agent',       color: '#D4654A', bg: 'rgba(212,101,74,0.08)', label: 'Provider Ticket' },
    fault_report:    { icon: 'battery_alert',       color: '#ef4444', bg: '#fef2f2', label: 'Fault Report' },
    repair_request:  { icon: 'build',               color: '#16a34a', bg: '#dcfce7', label: 'Repair Request' },
    admin_query:     { icon: 'admin_panel_settings', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', label: 'Admin Query' },
  };
  const cfg = typeConfig[ticket.type] || typeConfig.ticket;
  const isAdminQuery = ticket.type === 'admin_query';
  const isFaultReport = ticket.type === 'fault_report';
  const isRepairRequest = ticket.type === 'repair_request';
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
  // Admin can resolve tickets they originated (admin_query)
  const canResolve = isAdminQuery && ticket.status === 'open';
  // Admin can approve fault reports and repair requests
  const canApproveFault = isFaultReport && ticket.status === 'open' && ticket.batteryId;
  const canApproveRepair = isRepairRequest && ticket.status === 'open' && ticket.batteryId;

  const catLabel = ticket.type === 'ticket' ? (TICKET_CATS[ticket.category] || ticket.category || '-')
    : ticket.type === 'query' ? (QUERY_CATS[ticket.category] || ticket.category || '-')
    : ticket.type === 'provider_ticket' ? (PROVIDER_CATS[ticket.category] || ticket.category || '-')
    : ticket.type === 'fault_report' ? 'Battery Fault' + (ticket.batteryId ? ' - ' + ticket.batteryId : '')
    : ticket.type === 'repair_request' ? 'Repair' + (ticket.batteryId ? ' - ' + ticket.batteryId : '')
    : isAdminQuery ? (ticket.subject || 'Admin Concern')
    : '-';

  // Build conversation thread
  const replies = Array.isArray(ticket.replies) ? ticket.replies : [];

  // Determine original sender
  let originSender = 'Unknown';
  let originRole = 'user';
  if (isAdminQuery) {
    originSender = 'Admin';
    originRole = 'admin';
  } else if (ticket.userId && userMap[ticket.userId]) {
    originSender = userMap[ticket.userId].name || ticket.userId;
    originRole = 'user';
  } else if (ticket.agentId && agentMap[ticket.agentId]) {
    originSender = agentMap[ticket.agentId].name || ticket.agentId;
    originRole = 'agent';
  }

  // Target info for admin queries
  let targetInfo = '';
  if (isAdminQuery && ticket.targetAgentId && agentMap[ticket.targetAgentId]) {
    targetInfo = `<div style="font-size:12px;color:#0891b2;margin-bottom:12px;display:flex;align-items:center;gap:4px">
      <span class="material-symbols-outlined" style="font-size:14px">arrow_forward</span>
      Sent to: ${agentMap[ticket.targetAgentId].name} (${ticket.targetAgentId})
    </div>`;
  }

  function msgBubble(sender, role, text, time) {
    const roleIcon = role === 'admin' ? 'admin_panel_settings' : role === 'agent' ? 'support_agent' : 'person';
    const roleColor = role === 'admin' ? '#0891b2' : role === 'agent' ? '#D4654A' : '#6366f1';
    const bgColor = role === 'admin' ? 'rgba(8,145,178,0.04)' : role === 'agent' ? 'rgba(212,101,74,0.04)' : '#f8fafc';
    const borderColor = role === 'admin' ? 'rgba(8,145,178,0.15)' : role === 'agent' ? 'rgba(212,101,74,0.15)' : '#e2e8f0';
    return `
    <div style="padding:12px;background:${bgColor};border:1px solid ${borderColor};border-radius:12px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span class="material-symbols-outlined" style="font-size:14px;color:${roleColor}">${roleIcon}</span>
        <span style="font-size:12px;font-weight:700;color:${roleColor}">${sender}</span>
        <span style="font-size:10px;color:#94a3b8;margin-left:auto">${time}</span>
      </div>
      <div style="font-size:14px;color:#1e293b;line-height:1.5">${text}</div>
    </div>`;
  }

  let threadHtml = '';
  if (ticket.description) {
    threadHtml += msgBubble(originSender, originRole, ticket.description, fmtTime(ticket.timestamp));
  }
  replies.forEach(r => {
    threadHtml += msgBubble(r.name || r.from, r.role || 'unknown', r.text, fmtTime(r.timestamp));
  });

  const overlay = document.createElement('div');
  overlay.id = 'ticket-detail-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)';

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:0;width:540px;max-width:94vw;max-height:85vh;box-shadow:0 20px 60px rgba(0,0,0,0.15);display:flex;flex-direction:column;overflow:hidden">
      <!-- Header -->
      <div style="padding:1.5rem 1.5rem 1rem;border-bottom:1px solid #f1f5f9;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:13px;background:${cfg.bg};display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="font-size:22px;color:${cfg.color}">${cfg.icon}</span>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <h3 style="font-size:16px;font-weight:800;color:#1e293b;letter-spacing:-0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${catLabel}</h3>
              <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:${cfg.bg};color:${cfg.color};white-space:nowrap">${cfg.label}</span>
            </div>
            <p style="font-size:12px;color:#94a3b8">${fmtTime(ticket.timestamp)} - ${ticket.id}</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            ${statusBadge(ticket.status)}
            <button id="td-close" style="width:32px;height:32px;border-radius:10px;border:none;background:#f1f5f9;cursor:pointer;display:flex;align-items:center;justify-content:center">
              <span class="material-symbols-outlined" style="font-size:18px;color:#94a3b8">close</span>
            </button>
          </div>
        </div>
        ${targetInfo}
      </div>

      <!-- Conversation thread -->
      <div style="flex:1;overflow-y:auto;padding:1rem 1.5rem" id="td-thread">
        ${threadHtml || '<p style="text-align:center;color:#94a3b8;padding:2rem;font-size:14px">No messages</p>'}
      </div>

      <!-- Reply area -->
      ${isResolved ? `
        <div style="padding:1rem 1.5rem;border-top:1px solid #f1f5f9;text-align:center">
          <span style="font-size:12px;color:#94a3b8;font-weight:600">This ticket has been resolved</span>
        </div>
      ` : `
        <div style="padding:1rem 1.5rem;border-top:1px solid #f1f5f9;flex-shrink:0">
          <div style="display:flex;gap:8px;align-items:flex-end">
            <textarea id="td-reply-text" rows="2" placeholder="Type a reply..." style="flex:1;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;color:#1e293b;background:#f8fafc;resize:none;outline:none;box-sizing:border-box;font-family:inherit"></textarea>
            <button id="td-reply-send" class="btn btn-primary" style="padding:10px 16px;flex-shrink:0;height:fit-content">
              ${icon('send', '16px')}
            </button>
          </div>
          ${canResolve ? `
            <button id="td-resolve" style="width:100%;margin-top:10px;padding:10px;border:1px solid #bbf7d0;border-radius:10px;background:#f0fdf4;color:#16a34a;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:16px">check_circle</span> Mark as Resolved
            </button>
          ` : ''}
          ${canApproveFault ? `
            <button id="td-approve-fault" style="width:100%;margin-top:10px;padding:10px;border:1px solid #fecaca;border-radius:10px;background:#fef2f2;color:#dc2626;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:16px">battery_alert</span> Approve - Mark Battery as Faulty
            </button>
          ` : ''}
          ${canApproveRepair ? `
            <button id="td-approve-repair" style="width:100%;margin-top:10px;padding:10px;border:1px solid #bbf7d0;border-radius:10px;background:#f0fdf4;color:#16a34a;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:16px">build</span> Approve Repair - Reassign Battery
            </button>
          ` : ''}
        </div>
      `}
    </div>
  `;

  document.body.appendChild(overlay);
  // Scroll thread to bottom
  const thread = document.getElementById('td-thread');
  if (thread) thread.scrollTop = thread.scrollHeight;

  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('td-close')?.addEventListener('click', () => overlay.remove());

  // Send reply (adds to replies, does NOT resolve)
  document.getElementById('td-reply-send')?.addEventListener('click', async () => {
    const text = document.getElementById('td-reply-text')?.value?.trim();
    if (!text) { showToast('Type a reply first', 'warning'); return; }

    const btn = document.getElementById('td-reply-send');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;animation:spin 1s linear infinite">progress_activity</span>`;

    const newReply = {
      from: 'admin',
      name: 'Admin',
      role: 'admin',
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
      overlay.remove();
      showToast('Reply sent', 'success');
      renderSupport(container);
    } catch {
      showToast('Failed to send reply', 'error');
      btn.disabled = false;
      btn.innerHTML = `${icon('send', '16px')}`;
    }
  });

  // Resolve (only for admin_query tickets admin originated)
  document.getElementById('td-resolve')?.addEventListener('click', async () => {
    const btn = document.getElementById('td-resolve');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;animation:spin 1s linear infinite">progress_activity</span> Resolving...';
    try {
      await apiFetch(`/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', resolvedAt: new Date().toISOString() }),
      });
      overlay.remove();
      showToast('Ticket resolved', 'success');
      renderSupport(container);
    } catch {
      showToast('Failed to resolve', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">check_circle</span> Mark as Resolved';
    }
  });

  // Approve fault report - mark battery as faulty
  document.getElementById('td-approve-fault')?.addEventListener('click', async () => {
    const btn = document.getElementById('td-approve-fault');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;animation:spin 1s linear infinite">progress_activity</span> Approving...';
    try {
      // Mark battery as faulty
      await apiFetch(`/batteries/${ticket.batteryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'fault' }),
      });
      // Resolve the ticket
      await apiFetch(`/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          approvedBy: 'admin',
          resolvedAt: new Date().toISOString(),
        }),
      });
      overlay.remove();
      showToast('Battery ' + ticket.batteryId + ' marked as faulty', 'success');
      renderSupport(container);
    } catch {
      showToast('Failed to approve fault', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">battery_alert</span> Approve - Mark Battery as Faulty';
    }
  });

  // Approve repair - show station picker, reassign battery
  document.getElementById('td-approve-repair')?.addEventListener('click', async () => {
    const btn = document.getElementById('td-approve-repair');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;animation:spin 1s linear infinite">progress_activity</span> Loading stations...';

    let stations = [];
    try {
      stations = await apiFetch('/stations').then(r => r.json());
    } catch {
      showToast('Failed to load stations', 'error');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">build</span> Approve Repair - Reassign Battery';
      return;
    }

    // Replace button with station picker
    const pickerArea = btn.parentElement;
    btn.outerHTML = `
      <div id="repair-station-picker" style="margin-top:10px;padding:12px;border:1px solid #bbf7d0;border-radius:12px;background:#f0fdf4">
        <label style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Assign to Station</label>
        <select id="repair-station-select" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;color:#1e293b;background:#fff;margin-bottom:8px;outline:none">
          ${stations.map(s => `<option value="${s.id}" data-name="${s.name}">${s.name} (${s.id})</option>`).join('')}
        </select>
        <button id="repair-confirm-btn" class="btn btn-primary" style="width:100%;padding:10px;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:16px">check_circle</span> Confirm Repair Approval
        </button>
      </div>
    `;

    document.getElementById('repair-confirm-btn')?.addEventListener('click', async () => {
      const select = document.getElementById('repair-station-select');
      const stationId = select.value;
      const stationName = select.options[select.selectedIndex]?.dataset.name || stationId;

      const confirmBtn = document.getElementById('repair-confirm-btn');
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;animation:spin 1s linear infinite">progress_activity</span> Processing...';

      try {
        // Reassign battery to station as charging
        await apiFetch(`/batteries/${ticket.batteryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'charging',
            stationId,
            stationName,
            assignedTo: null,
          }),
        });
        // Resolve the ticket
        await apiFetch(`/tickets/${ticket.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'resolved',
            approvedBy: 'admin',
            resolvedAt: new Date().toISOString(),
          }),
        });
        overlay.remove();
        showToast('Repair approved - ' + ticket.batteryId + ' reassigned to ' + stationName, 'success');
        renderSupport(container);
      } catch {
        showToast('Failed to approve repair', 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">check_circle</span> Confirm Repair Approval';
      }
    });
  });
}

function statusItem(name, status, type) {
  const colors = {
    success: { bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
    warning: { bg: '#fefce8', color: '#a16207', dot: '#f59e0b' },
    error:   { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  };
  const c = colors[type];
  return `
  <div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;display:flex;align-items:center;justify-content:space-between">
    <span style="font-weight:600;color:#1e293b;font-size:var(--font-md)">${name}</span>
    <span style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:${c.bg};color:${c.color}">
      <span style="width:6px;height:6px;border-radius:50%;background:${c.dot}"></span> ${status}
    </span>
  </div>`;
}
