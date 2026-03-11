// ============================================
// User Detail Page - Live API
// ============================================
import { icon } from '../components/icons.js';
import { showToast } from '../utils/toast.js';
import { apiFetch } from '../utils/apiFetch.js';
import { fmtCur } from '../utils/helpers.js';

const kycColors = {
  verified: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', dot: '#22c55e', label: 'Verified' },
  pending:  { bg: '#fefce8', color: '#a16207', border: '#fde68a', dot: '#f59e0b', label: 'Pending'  },
  rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444', label: 'Rejected' },
};

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export async function renderUserDetail(container, userId) {
  container.innerHTML = `<div style="padding:3rem;text-align:center;color:#94a3b8;font-size:var(--font-md)">Loading customer...</div>`;

  let user, swaps = [];
  try {
    [user, swaps] = await Promise.all([
      apiFetch(`/users/${userId}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/swaps?userId=${userId}`).then(r => r.json()),
    ]);
  } catch {
    const { mockUsers } = await import('../data/mockData.js');
    user = mockUsers.find(u => u.id === userId);
    swaps = user?.swapHistory?.map(s => ({
      id: s.id, stationName: s.station, batteryIn: s.batteryId,
      timestamp: s.date, transactionId: '-', amount: s.amount,
    })) || [];
  }

  if (!user) {
    container.innerHTML = '<p style="padding:2rem;color:#64748b">User not found.</p>';
    return;
  }

  const kyc = kycColors[user.kycStatus] || kycColors.pending;
  // sort swaps newest first
  swaps.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const swapOnlyCount  = swaps.filter(s => s.type !== 'allocation').length;
  const totalSwapSpent = swaps.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

  container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">

      <!-- Breadcrumb -->
      <nav style="display:flex;align-items:center;gap:6px;margin-bottom:1.25rem;font-size:var(--font-sm)">
        <a onclick="location.hash='#users'" style="color:#64748b;font-weight:500;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background 0.15s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">Users</a>
        <span style="color:#cbd5e1">/</span>
        <span style="color:#D4654A;font-weight:600;padding:4px 8px">${user.name}</span>
      </nav>

      <!-- Profile Header -->
      <div class="card" style="padding:1.5rem;margin-bottom:1.25rem">
        <div style="display:flex;align-items:center;gap:1.5rem">
          <div style="width:64px;height:64px;border-radius:50%;background:rgba(212,101,74,0.12);border:2px solid rgba(212,101,74,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-size:1.375rem;font-weight:700;color:#D4654A">${user.initials}</span>
          </div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
              <h2 style="font-size:1.375rem;font-weight:700;color:#1e293b">${user.name}</h2>
              <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:var(--radius-full);font-size:10px;font-weight:700;background:${kyc.bg};color:${kyc.color};border:1px solid ${kyc.border}">
                <span style="width:5px;height:5px;border-radius:50%;background:${kyc.dot}"></span> KYC ${kyc.label}
              </span>
            </div>
            <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
              <span style="font-size:var(--font-sm);color:#64748b;display:flex;align-items:center;gap:5px">${icon('badge', '14px', 'color:#94a3b8')} ${user.id}</span>
              <span style="font-size:var(--font-sm);color:#64748b;display:flex;align-items:center;gap:5px">${icon('phone', '14px', 'color:#94a3b8')} ${user.phone}</span>
              <span style="font-size:var(--font-sm);color:#64748b;display:flex;align-items:center;gap:5px">${icon('electric_scooter', '14px', 'color:#94a3b8')} ${user.vehicle} · ${user.vehicleId}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            ${(user.kycStatus === 'pending' || user.kycStatus === 'rejected') ? `
            <button id="ud-approve-btn" style="padding:8px 16px;border-radius:var(--radius-md);background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;font-size:var(--font-sm);font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">${icon('verified', '16px', 'color:#16a34a')} Approve KYC</button>
            <button id="ud-reject-btn" style="padding:8px 16px;border-radius:var(--radius-md);background:#fef2f2;color:#dc2626;border:1px solid #fecaca;font-size:var(--font-sm);font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">${icon('cancel', '16px', 'color:#dc2626')} Reject</button>
            ` : ''}
            <button id="ud-contact-btn" style="padding:8px 16px;border-radius:var(--radius-md);background:rgba(212,101,74,0.08);color:#D4654A;border:1px solid rgba(212,101,74,0.20);font-size:var(--font-sm);font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">${icon('call', '16px', 'color:#D4654A')} Contact</button>
          </div>
        </div>

        ${user.kycStatus === 'rejected' && user.rejectionReason ? `
        <div style="margin-top:1rem;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;display:flex;align-items:center;gap:8px">
          ${icon('cancel', '16px', 'color:#dc2626')}
          <span style="font-size:var(--font-sm);color:#dc2626;font-weight:600">Rejection reason: ${user.rejectionReason}</span>
        </div>` : ''}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">

        <!-- Usage Summary -->
        <div class="card" style="padding:1.5rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:1rem;display:flex;align-items:center;gap:8px">
            ${icon('analytics', '18px', 'color:#D4654A')} Usage Summary
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${statBox('swap_horiz',           'Total Swaps',     swapOnlyCount,                              '#D4654A')}
            ${statBox('currency_rupee',        'Total Spent',     totalSwapSpent > 0 ? fmtCur(totalSwapSpent) : '-', '#16a34a')}
            ${statBox('battery_charging_full', 'Linked Battery',  user.batteryId || 'Not assigned',         '#D4654A')}
            ${statBox('ev_station',            'Onboarded',       user.onboardedAt ? fmtDate(user.onboardedAt) : 'Not yet', '#64748b')}
          </div>
        </div>

        <!-- KYC Documents -->
        <div class="card" style="padding:1.5rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:1rem;display:flex;align-items:center;gap:8px">
            ${icon('shield', '18px', 'color:#D4654A')} KYC Documents
          </h3>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${kycDoc('Aadhaar Card', user.aadhaar, user.kycStatus, 'credit_card')}
            ${kycDoc('PAN Card',     user.pan,     user.kycStatus, 'badge')}
          </div>
          ${user.kycStatus === 'verified' ? `
          <div style="margin-top:1rem;padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="display:flex;align-items:center;gap:8px">
              ${icon('verified', '16px', 'color:#16a34a')}
              <span style="font-size:var(--font-sm);color:#16a34a;font-weight:600">All documents verified · Deposit TXN: ${user.depositTxnId || '-'}</span>
            </div>
            <span style="font-size:var(--font-xs);color:#16a34a;font-weight:500;white-space:nowrap">${icon('schedule', '13px', 'color:#16a34a;vertical-align:middle')} ${fmtTime(user.onboardedAt)}</span>
          </div>` : user.kycStatus === 'pending' ? `
          <div style="margin-top:1rem;padding:10px 14px;background:#fefce8;border:1px solid #fde68a;border-radius:10px;display:flex;align-items:center;gap:8px">
            ${icon('pending', '16px', 'color:#a16207')}
            <span style="font-size:var(--font-sm);color:#a16207;font-weight:600">Documents uploaded - awaiting provider review</span>
          </div>` : `
          <div style="margin-top:1rem;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;display:flex;align-items:center;gap:8px">
            ${icon('cancel', '16px', 'color:#dc2626')}
            <span style="font-size:var(--font-sm);color:#dc2626;font-weight:600">KYC rejected - user needs to resubmit</span>
          </div>`}
        </div>
      </div>

      <!-- Swap History -->
      <div class="card" style="padding:0;overflow:hidden;margin-bottom:1.25rem">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px">
            ${icon('swap_horiz', '18px', 'color:#D4654A')} Swap History
          </h3>
          <span style="font-size:var(--font-xs);font-weight:700;color:#D4654A;background:var(--accent-10);border:1px solid rgba(212,101,74,0.18);padding:4px 12px;border-radius:var(--radius-full)">${swapOnlyCount} swap${swapOnlyCount !== 1 ? 's' : ''}${swaps.length > swapOnlyCount ? ' · 1 allocation' : ''}</span>
        </div>

        ${swaps.length === 0 ? `
        <div style="padding:2.5rem;text-align:center;color:#94a3b8">
          <span class="material-symbols-outlined" style="font-size:28px;display:block;margin-bottom:6px;opacity:0.5">swap_horiz</span>
          No swaps recorded yet
        </div>` : `
        <div style="display:flex;flex-direction:column">
          ${swaps.map((s, idx) => {
            const isAlloc = s.type === 'allocation';
            return `
          <div style="display:flex;align-items:center;gap:14px;padding:14px 1.5rem;border-top:${idx === 0 ? 'none' : '1px solid var(--border-light)'};transition:background 0.15s"
               onmouseover="this.style.background='var(--bg-hover-row)'" onmouseout="this.style.background='transparent'">
            <!-- Icon -->
            <div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${isAlloc ? 'rgba(34,197,94,0.08)' : 'var(--accent-10)'};border:1px solid ${isAlloc ? 'rgba(34,197,94,0.15)' : 'rgba(212,101,74,0.12)'}">
              <span class="material-symbols-outlined" style="font-size:17px;color:${isAlloc ? '#16a34a' : '#D4654A'};font-variation-settings:'FILL' 1">${isAlloc ? 'battery_charging_full' : 'swap_horiz'}</span>
            </div>
            <!-- Event + ID -->
            <div style="min-width:130px">
              <div style="font-size:var(--font-sm);font-weight:700;color:var(--text-primary)">${isAlloc ? 'Battery Allocation' : s.stationName || 'Battery Swap'}</div>
              <div style="font-size:var(--font-xs);color:var(--text-muted);font-family:monospace;margin-top:1px">${s.id}</div>
            </div>
            <!-- Battery Flow -->
            <div style="flex:1;display:flex;align-items:center;gap:6px;justify-content:center">
              ${isAlloc ? `
              <span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em">Received</span>
              <span style="font-family:monospace;font-size:var(--font-sm);font-weight:700;color:#16a34a;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);padding:3px 10px;border-radius:6px">${s.batteryIn || '-'}</span>
              ` : `
              ${s.batteryOut ? `<span style="font-family:monospace;font-size:var(--font-sm);font-weight:600;color:var(--text-muted);background:var(--bg-table-head);padding:3px 10px;border-radius:6px;border:1px solid var(--border-color)">${s.batteryOut}</span>
              <span class="material-symbols-outlined" style="font-size:14px;color:#D4654A">arrow_forward</span>` : ''}
              <span style="font-family:monospace;font-size:var(--font-sm);font-weight:700;color:#D4654A;background:var(--accent-10);border:1px solid rgba(212,101,74,0.15);padding:3px 10px;border-radius:6px">${s.batteryIn || '-'}</span>
              `}
            </div>
            <!-- Date & Time -->
            <div style="text-align:right;min-width:100px;flex-shrink:0">
              <div style="font-size:var(--font-sm);color:var(--text-secondary);font-weight:500">${fmtTime(s.timestamp)}</div>
            </div>
            <!-- Amount -->
            <div style="text-align:right;min-width:64px;flex-shrink:0">
              ${isAlloc
                ? `<span style="font-size:var(--font-xs);font-weight:700;color:#16a34a;background:rgba(34,197,94,0.08);padding:3px 10px;border-radius:var(--radius-full);border:1px solid rgba(34,197,94,0.12)">Free</span>`
                : `<span style="font-size:var(--font-md);font-weight:800;color:var(--text-primary)">${fmtCur(s.amount || 0)}</span>`
              }
            </div>
          </div>`;
          }).join('')}
        </div>
        `}
      </div>

      <!-- Payment Summary -->
      <div class="card" style="padding:1.5rem;margin-bottom:1.25rem">
        <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:1rem;display:flex;align-items:center;gap:8px">
          ${icon('payments', '18px', 'color:#D4654A')} Payment Summary
        </h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem">
          <div style="padding:1rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#86efac;text-transform:uppercase;margin-bottom:4px">Swap Payments</p>
            <p style="font-size:1.375rem;font-weight:800;color:#16a34a">${totalSwapSpent > 0 ? fmtCur(totalSwapSpent) : '-'}</p>
          </div>
          <div style="padding:1rem;background:rgba(212,101,74,0.07);border:1px solid rgba(212,101,74,0.18);border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#D4654A;text-transform:uppercase;margin-bottom:4px;opacity:0.7">Security Deposit</p>
            <p style="font-size:1.375rem;font-weight:800;color:#D4654A">${user.depositPaid ? fmtCur(3000) : '-'}</p>
          </div>
          <div style="padding:1rem;background:rgba(212,101,74,0.07);border:1px solid rgba(212,101,74,0.18);border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#D4654A;text-transform:uppercase;margin-bottom:4px;opacity:0.7">Rate / Swap</p>
            <p style="font-size:1.375rem;font-weight:800;color:#D4654A">${fmtCur(65)}</p>
          </div>
          <div style="padding:1rem;background:#f8fafc;border:1px solid #f1f5f9;border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">Last Swap</p>
            <p style="font-size:var(--font-md);font-weight:700;color:#1e293b">${fmtDate(user.lastSwap)}</p>
          </div>
        </div>
      </div>

      <footer class="app-footer" style="margin-top:2rem">
        ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#9ca3af')}
        Electica Enterprise Dashboard © 2026
      </footer>
    </div>
  `;

  document.getElementById('ud-contact-btn')?.addEventListener('click', () => {
    showToast(`Calling ${user.phone}...`, 'info');
  });

  document.getElementById('ud-approve-btn')?.addEventListener('click', approveKYC);
  document.getElementById('ud-reject-btn')?.addEventListener('click', rejectKYC);

  async function approveKYC() {
    const btn = document.getElementById('ud-approve-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

    try {
      // 1. Find an available stock battery
      const stockBats = await apiFetch('/batteries?status=stock').then(r => r.json());
      if (!stockBats.length) {
        showToast('No stock batteries available for allocation!', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = `${icon('verified', '16px', 'color:#16a34a')} Approve KYC`; }
        return;
      }
      const battery = stockBats[0];
      const now = new Date().toISOString();
      const depositTxnId = `TXN-DP-${String(Date.now()).slice(-6)}`;

      // 2. Mark user as verified + record deposit + assign battery
      await apiFetch(`/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kycStatus: 'verified',
          onboardedAt: now,
          depositPaid: true,
          depositTxnId,
          batteryId: battery.id,
        }),
      });

      // 3. Mark battery as deployed, assigned to this user
      await apiFetch(`/batteries/${battery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'deployed',
          assignedTo: userId,
          stationId: null,
          stationName: null,
        }),
      });

      // 4. Record the security deposit transaction
      await apiFetch('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: depositTxnId,
          userId,
          type: 'security_deposit',
          amount: 3000,
          mode: 'Cash',
          status: 'completed',
          timestamp: now,
          description: 'Security deposit - battery onboarding',
        }),
      });

      // 5. Create allocation swap record visible everywhere
      await apiFetch('/swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `SWP-ALLOC-${String(Date.now()).slice(-8)}`,
          userId,
          stationId: null,
          stationName: 'Battery Allocation',
          batteryOut: null,
          batteryIn: battery.id,
          timestamp: now,
          amount: 0,
          transactionId: depositTxnId,
          status: 'completed',
          type: 'allocation',
        }),
      });

      showToast(`KYC approved! ${battery.id} allocated to ${user.name}`, 'success');
      renderUserDetail(container, userId);
    } catch {
      showToast('Approval failed - check API connection', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = `${icon('verified', '16px', 'color:#16a34a')} Approve KYC`; }
    }
  }

  async function rejectKYC() {
    const reason = window.prompt(`Rejection reason for ${user.name}:`);
    if (!reason?.trim()) return;

    try {
      await apiFetch(`/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus: 'rejected', rejectionReason: reason.trim() }),
      });
      showToast(`KYC rejected for ${user.name}`, 'warning');
      renderUserDetail(container, userId);
    } catch {
      showToast('Action failed - check API connection', 'error');
    }
  }
}

function statBox(iconName, label, value, color) {
  return `
  <div style="padding:12px;background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
      <span class="material-symbols-outlined" style="font-size:14px;color:${color};font-variation-settings:'FILL' 1">${iconName}</span>
      <span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em">${label}</span>
    </div>
    <p style="font-size:var(--font-md);font-weight:700;color:#1e293b">${value}</p>
  </div>`;
}

function kycDoc(docName, maskedNumber, status, iconName) {
  const s = status === 'verified'
    ? 'background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a'
    : status === 'pending'
    ? 'background:#fefce8;border:1px solid #fde68a;color:#a16207'
    : 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626';
  const label = status === 'verified' ? 'Verified' : status === 'pending' ? 'Under Review' : 'Rejected';
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
    <div style="display:flex;align-items:center;gap:10px">
      <span class="material-symbols-outlined" style="font-size:20px;color:#D4654A;font-variation-settings:'FILL' 1">${iconName}</span>
      <div>
        <p style="font-size:var(--font-sm);font-weight:600;color:#1e293b">${docName}</p>
        <p style="font-size:var(--font-xs);font-family:monospace;color:#94a3b8">${maskedNumber || '-'}</p>
      </div>
    </div>
    <span style="padding:3px 10px;border-radius:var(--radius-full);font-size:10px;font-weight:700;${s}">${label}</span>
  </div>`;
}
