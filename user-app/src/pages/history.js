// ============================================
// History - Premium Swap Timeline (CRED Dark)
// ============================================
import { showToast } from '../utils/toast.js';
import { apiFetch } from '../utils/apiFetch.js';

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function monthKey(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
function relativeDay(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return fmtDate(iso);
}

export async function renderHistory(container, userId) {
  container.innerHTML = `
    <div class="history-hero">
      <div class="loading">Loading history...</div>
    </div>`;

  let swaps = [];
  try {
    swaps = await apiFetch(`/swaps?userId=${userId}`)
      .then(r => r.json());
    swaps.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch {
    showToast('Cannot reach API', 'error');
  }

  const swapOnly   = swaps.filter(s => s.type !== 'allocation');
  const swapCount  = swapOnly.length;
  const totalSpent = swapOnly.reduce((s, x) => s + (x.amount || 0), 0);
  const avgCost    = swapCount ? Math.round(totalSpent / swapCount) : 0;

  // Group by month
  const byMonth = {};
  swaps.forEach(s => {
    const key = monthKey(s.timestamp);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(s);
  });

  container.innerHTML = `
    <!-- Stats Hero -->
    <div class="history-hero fade-up">
      <div style="position:relative;z-index:1">
        <p style="font-size:var(--font-xs);color:var(--text-soft);font-weight:700;text-transform:uppercase;letter-spacing:0.10em;margin-bottom:16px">Swap History</p>
        <div class="history-stat-grid">
          <div class="history-stat">
            <div class="history-stat-val">${swapCount}</div>
            <div class="history-stat-lbl">Swaps</div>
          </div>
          <div class="history-stat-div"></div>
          <div class="history-stat">
            <div class="history-stat-val" style="color:var(--gold)">₹${totalSpent.toLocaleString('en-IN')}</div>
            <div class="history-stat-lbl">Spent</div>
          </div>
          <div class="history-stat-div"></div>
          <div class="history-stat">
            <div class="history-stat-val" style="color:var(--primary)">₹${avgCost}</div>
            <div class="history-stat-lbl">Avg/Swap</div>
          </div>
        </div>
      </div>
    </div>

    ${swaps.length === 0 ? `
    <div class="empty-state" style="padding:60px 24px">
      <span class="material-symbols-outlined">swap_horiz</span>
      <p style="font-size:var(--font-md);font-weight:700;color:var(--text-mid);margin-bottom:6px">No swaps yet</p>
      <p>Your swap history will appear here after your first battery swap.</p>
    </div>` : Object.entries(byMonth).map(([month, list]) => `
    <div>
      <div class="history-month-header">${month} <span style="color:var(--text-soft);font-weight:600">(${list.length})</span></div>
      ${list.map(s => {
        const isAlloc = s.type === 'allocation';
        return isAlloc ? allocCard(s) : swapCard(s);
      }).join('')}
    </div>`).join('')}
  `;
}

function allocCard(s) {
  return `
  <div style="margin:0 16px 10px;background:var(--surface);border-radius:16px;border:1px solid rgba(34,211,164,0.15);overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px 10px">
      <div style="width:40px;height:40px;border-radius:12px;background:rgba(34,211,164,0.10);border:1px solid rgba(34,211,164,0.20);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:20px;color:var(--primary);font-variation-settings:'FILL' 1">battery_charging_full</span>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:var(--font-sm);font-weight:800;color:var(--text);letter-spacing:-0.02em">Battery Allocated</div>
        <div style="font-size:var(--font-xs);color:var(--text-soft);font-weight:500;margin-top:1px">${relativeDay(s.timestamp)} · ${fmtTime(s.timestamp)}</div>
      </div>
      <div style="background:rgba(34,211,164,0.12);border:1px solid rgba(34,211,164,0.22);padding:4px 10px;border-radius:999px">
        <span style="font-size:10px;font-weight:800;color:var(--primary);letter-spacing:0.03em">ONBOARDING</span>
      </div>
    </div>

    <!-- Battery received -->
    <div style="padding:0 16px 14px;margin-left:52px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:10px;color:var(--text-soft);font-weight:600">Received</span>
        <div style="display:flex;align-items:center;gap:6px;background:rgba(34,211,164,0.08);border:1px solid rgba(34,211,164,0.18);padding:4px 10px;border-radius:8px">
          <span class="material-symbols-outlined" style="font-size:13px;color:var(--primary);font-variation-settings:'FILL' 1">battery_full</span>
          <span style="font-family:monospace;font-size:11px;font-weight:700;color:var(--primary);letter-spacing:0.02em">${s.batteryIn || '-'}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function swapCard(s) {
  return `
  <div style="margin:0 16px 10px;background:var(--surface);border-radius:16px;border:1px solid var(--border);overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
    <!-- Header: station + amount -->
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px 10px">
      <div style="width:40px;height:40px;border-radius:12px;background:rgba(201,169,110,0.10);border:1px solid rgba(201,169,110,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:19px;color:var(--gold);font-variation-settings:'FILL' 1">ev_station</span>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:var(--font-sm);font-weight:800;color:var(--text);letter-spacing:-0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.stationName || '-'}</div>
        <div style="font-size:var(--font-xs);color:var(--text-soft);font-weight:500;margin-top:1px">${relativeDay(s.timestamp)} · ${fmtTime(s.timestamp)}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:var(--font-md);font-weight:900;color:var(--gold);letter-spacing:-0.03em">₹${s.amount}</div>
      </div>
    </div>

    <!-- Battery flow: OUT → IN -->
    <div style="padding:0 16px 14px;margin-left:52px">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        ${s.batteryOut ? `
        <div style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:4px 10px;border-radius:8px">
          <span class="material-symbols-outlined" style="font-size:13px;color:var(--text-soft);font-variation-settings:'FILL' 1">battery_alert</span>
          <span style="font-family:monospace;font-size:11px;font-weight:600;color:var(--text-soft);letter-spacing:0.02em">${s.batteryOut}</span>
        </div>
        <span class="material-symbols-outlined" style="font-size:14px;color:var(--gold)">arrow_forward</span>` : ''}
        ${s.batteryIn ? `
        <div style="display:flex;align-items:center;gap:5px;background:rgba(34,211,164,0.08);border:1px solid rgba(34,211,164,0.18);padding:4px 10px;border-radius:8px">
          <span class="material-symbols-outlined" style="font-size:13px;color:var(--primary);font-variation-settings:'FILL' 1">battery_full</span>
          <span style="font-family:monospace;font-size:11px;font-weight:700;color:var(--primary);letter-spacing:0.02em">${s.batteryIn}</span>
        </div>` : ''}
      </div>
    </div>
  </div>`;
}
