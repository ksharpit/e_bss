// ============================================
// Customer Detail - Provider App (Premium)
// ============================================
import { showToast } from '../utils/toast.js';
import { API_BASE } from '../config.js';

const kycConfig = {
  verified: { dot: '#22c55e', label: 'KYC Verified', badgeClass: 'badge-green', avatarGrad: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', avatarColor: '#15803d' },
  pending:  { dot: '#f59e0b', label: 'KYC Pending',  badgeClass: 'badge-amber', avatarGrad: 'linear-gradient(135deg,#fef9c3,#fde68a)', avatarColor: '#92400e' },
  rejected: { dot: '#ef4444', label: 'KYC Rejected', badgeClass: 'badge-red',   avatarGrad: 'linear-gradient(135deg,#fee2e2,#fecaca)', avatarColor: '#b91c1c' },
};

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export async function renderCustomerDetail(container, userId, onBack, onResubmit, agent) {
  container.innerHTML = `<div class="loading">Loading customer...</div>`;

  let user = null, swaps = [], battery = null;
  try {
    [user, swaps] = await Promise.all([
      fetch(`${API_BASE}/users/${userId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/swaps?userId=${userId}`).then(r => r.json()),
    ]);
    if (user?.batteryId) {
      battery = await fetch(`${API_BASE}/batteries/${user.batteryId}`)
        .then(r => r.ok ? r.json() : null).catch(() => null);
    }
  } catch {
    showToast('Failed to load customer data', 'error');
  }

  if (!user) {
    container.innerHTML = `<p style="padding:20px;color:var(--text-soft)">Customer not found.</p>`;
    return;
  }

  const kyc   = kycConfig[user.kycStatus] || kycConfig.pending;
  const spent = swaps.reduce((s, x) => s + (x.amount || 0), 0);
  swaps.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  container.innerHTML = `
    <!-- Profile Hero -->
    <div style="background:linear-gradient(145deg,#D96A50,#9E3A2E);border-radius:var(--radius-lg);padding:22px 20px 20px;margin-bottom:14px;position:relative;overflow:hidden;box-shadow:0 10px 28px rgba(175,55,40,0.28)" class="fade-up">
      <div style="position:absolute;top:-40px;right:-20px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.06);pointer-events:none"></div>
      <div style="display:flex;align-items:center;gap:14px;position:relative;z-index:1">
        <div style="width:62px;height:62px;border-radius:18px;background:${kyc.avatarGrad};display:flex;align-items:center;justify-content:center;flex-shrink:0;border:2px solid rgba(255,255,255,0.30)">
          <span style="font-size:1.375rem;font-weight:900;color:${kyc.avatarColor}">${user.initials}</span>
        </div>
        <div style="flex:1;min-width:0">
          <h2 style="font-size:1.125rem;font-weight:900;color:#fff;letter-spacing:-0.02em;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.name}</h2>
          <p style="font-size:var(--font-xs);color:rgba(255,255,255,0.60);margin-bottom:7px">${user.phone} · ${user.vehicleId}</p>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="badge ${kyc.badgeClass}">${kyc.label}</span>
            <span style="font-size:10px;color:rgba(255,255,255,0.55);font-weight:600">
              <span class="material-symbols-outlined" style="font-size:10px;vertical-align:middle">two_wheeler</span>
              ${user.vehicle}
            </span>
          </div>
        </div>
      </div>
    </div>

    ${user.kycStatus === 'rejected' && user.rejectionReason ? `
    <div class="notice notice-red fade-up" style="animation-delay:0.03s">
      <span class="material-symbols-outlined">cancel</span>
      <p><b>Rejection Reason:</b> ${user.rejectionReason}</p>
    </div>` : ''}

    <!-- Action Buttons -->
    <div style="display:flex;gap:8px;margin-bottom:16px" class="fade-up">
      <button id="cd-call-btn" class="btn btn-ghost" style="width:auto;padding:12px 16px;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">call</span> Call
      </button>
      ${user.kycStatus === 'rejected' ? `
      <button id="cd-resubmit-btn" class="btn btn-primary" style="flex:1">
        <span class="material-symbols-outlined">refresh</span> Fix & Resubmit
      </button>` : user.kycStatus === 'pending' ? `
      <button id="cd-approve-btn" class="btn" style="flex:1;background:linear-gradient(145deg,#22c55e,#16a34a);color:#fff;box-shadow:0 6px 16px rgba(22,163,74,0.30)">
        <span class="material-symbols-outlined">verified</span> Approve KYC
      </button>
      <button id="cd-reject-btn" class="btn btn-ghost" style="width:auto;padding:12px 16px;flex-shrink:0;color:var(--red);border-color:var(--red-border)" title="Reject">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">cancel</span>
      </button>` : `
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:14px;background:var(--green-light);border:1.5px solid var(--green-border);font-size:var(--font-xs);font-weight:700;color:var(--green)">
        <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">verified</span>
        Verified · ${fmtDate(user.onboardedAt)}
      </div>`}
    </div>

    <!-- Battery & Onboarding -->
    <div class="section-label">Battery & Onboarding</div>
    <div class="card" style="padding:14px;margin-bottom:14px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${infoBox('battery_charging_full', 'Linked Battery', user.batteryId || 'Not allocated', !!user.batteryId)}
        ${infoBox('currency_rupee',        'Deposit',        user.depositPaid ? '₹3,000 paid' : 'Not paid', user.depositPaid)}
        ${infoBox('badge',                 'Customer ID',    user.id, false)}
        ${infoBox('calendar_today',        'Submitted',      fmtDate(user.kycSubmittedAt), false)}
      </div>
      ${battery ? `
      <div style="margin-top:12px;padding:12px;background:rgba(212,101,74,0.06);border:1px solid var(--coral-border);border-radius:10px">
        <p style="font-size:9px;font-weight:800;color:var(--coral);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Battery Details</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${battStat('Battery ID', battery.id)}
          ${battStat('SOC', battery.soc + '%')}
          ${battStat('Health', battery.health + '%')}
        </div>
      </div>` : ''}
    </div>

    <!-- KYC Documents -->
    <div class="section-label">KYC Documents</div>
    <div class="card" style="padding:0 14px;margin-bottom:14px">
      ${kycDocRow('credit_card', 'Aadhaar', user.aadhaar, user.kycStatus)}
      ${kycDocRow('badge',       'PAN Card', user.pan,    user.kycStatus)}
    </div>

    <!-- Swap History -->
    <div class="section-label">Swap History</div>
    <div class="card" style="overflow:hidden;margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border-light)">
        <span style="font-size:var(--font-xs);font-weight:800;color:var(--text-mid)">${swaps.length} total swaps</span>
        ${spent > 0 ? `<span style="font-size:var(--font-xs);font-weight:700;color:var(--green)">₹${spent.toLocaleString('en-IN')} spent</span>` : ''}
      </div>
      ${swaps.length === 0 ? `
      <div class="empty-state" style="padding:32px 24px">
        <span class="material-symbols-outlined">swap_horiz</span>
        <p class="empty-title">No swaps yet</p>
        <p>Swap history will appear here.</p>
      </div>` : swaps.slice(0, 5).map(s => {
        const isAlloc  = s.type === 'allocation';
        const iconName = isAlloc ? 'battery_charging_full' : 'swap_horiz';
        const iconBg   = isAlloc ? 'rgba(22,163,74,0.08)' : 'rgba(212,101,74,0.08)';
        const iconColor = isAlloc ? 'var(--green)' : 'var(--coral)';
        const label     = isAlloc ? 'Battery Allocation' : (s.stationName || '-');
        return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--border-light)">
        <div style="width:36px;height:36px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span class="material-symbols-outlined" style="font-size:17px;color:${iconColor};font-variation-settings:'FILL' 1">${iconName}</span>
        </div>
        <div style="flex:1;min-width:0">
          <p style="font-size:var(--font-sm);font-weight:600;color:var(--text);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</p>
          <p style="font-size:var(--font-xs);color:var(--text-soft);margin-bottom:2px">${fmtDateTime(s.timestamp)}</p>
          ${(s.batteryOut || s.batteryIn) ? `
          <div style="display:flex;align-items:center;gap:4px">
            ${s.batteryOut ? `<span style="font-family:monospace;font-size:9px;color:var(--text-soft);background:var(--bg);border:1px solid var(--border-light);padding:1px 5px;border-radius:4px">${s.batteryOut}</span><span class="material-symbols-outlined" style="font-size:9px;color:var(--text-soft)">arrow_forward</span>` : ''}
            ${s.batteryIn ? `<span style="font-family:monospace;font-size:9px;color:var(--coral);background:rgba(212,101,74,0.06);border:1px solid var(--coral-border);padding:1px 5px;border-radius:4px">${s.batteryIn}</span>` : ''}
          </div>` : ''}
        </div>
        <span style="font-size:var(--font-sm);font-weight:800;color:${isAlloc ? 'var(--green)' : 'var(--green)'}">
          ${isAlloc ? '<span style="font-size:10px;font-weight:700">Allocated</span>' : '₹' + s.amount}
        </span>
      </div>`;
      }).join('')}
    </div>
  `;

  document.getElementById('cd-call-btn')?.addEventListener('click', () => {
    showToast(`Calling ${user.name} at ${user.phone}...`, 'info');
  });

  document.getElementById('cd-resubmit-btn')?.addEventListener('click', () => {
    onResubmit(user);
  });

  document.getElementById('cd-approve-btn')?.addEventListener('click', () => {
    showApprovalSheet(container, user, userId, agent, onBack, onResubmit);
  });

  document.getElementById('cd-reject-btn')?.addEventListener('click', async () => {
    const reason = window.prompt(`Rejection reason for ${user.name}:`);
    if (!reason?.trim()) return;
    try {
      await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus: 'rejected', rejectionReason: reason.trim() }),
      });
      showToast(`KYC rejected for ${user.name}`, 'warning');
      renderCustomerDetail(container, userId, onBack, onResubmit, agent);
    } catch {
      showToast('Action failed - check API connection', 'error');
    }
  });
}

// ── Helpers ────────────────────────────────────────────────
function infoBox(iconName, label, value, highlight) {
  return `
  <div style="padding:10px;background:var(--bg);border:1px solid var(--border-light);border-radius:10px">
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">
      <span class="material-symbols-outlined" style="font-size:13px;color:${highlight ? 'var(--coral)' : 'var(--text-soft)'};font-variation-settings:'FILL' 1">${iconName}</span>
      <span style="font-size:9px;font-weight:700;color:var(--text-soft);text-transform:uppercase;letter-spacing:0.05em">${label}</span>
    </div>
    <p style="font-size:var(--font-sm);font-weight:700;color:${highlight ? 'var(--text)' : 'var(--text-mid)'};font-family:${['Customer ID','Linked Battery'].includes(label) ? 'monospace' : 'inherit'}">${value}</p>
  </div>`;
}

function battStat(label, value) {
  return `
  <div>
    <p style="font-size:9px;font-weight:700;color:var(--text-soft);text-transform:uppercase;margin-bottom:2px">${label}</p>
    <p style="font-size:var(--font-sm);font-weight:800;color:var(--text);font-family:monospace">${value}</p>
  </div>`;
}

function kycDocRow(iconName, label, masked, status) {
  const badgeClass = status === 'verified' ? 'badge-green' : status === 'pending' ? 'badge-amber' : 'badge-red';
  const lbl        = status === 'verified' ? 'Verified' : status === 'pending' ? 'Pending' : 'Rejected';
  return `
  <div class="review-row">
    <div class="review-icon">
      <span class="material-symbols-outlined">${iconName}</span>
    </div>
    <span class="review-label">${label}</span>
    <span class="review-value" style="flex:1;font-family:monospace">${masked || '-'}</span>
    <span class="badge ${badgeClass}">${lbl}</span>
  </div>`;
}

// ── Approval Sheet ─────────────────────────────────────────
function showApprovalSheet(container, user, userId, agent, onBack, onResubmit) {
  document.getElementById('approval-overlay')?.remove();

  const ov = document.createElement('div');
  ov.id = 'approval-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:999;background:rgba(15,23,42,0.55);backdrop-filter:blur(3px);display:flex;flex-direction:column;justify-content:flex-end';

  ov.innerHTML = `
    <div style="background:#fff;border-radius:24px 24px 0 0;max-height:90dvh;overflow-y:auto">
      <div style="width:36px;height:4px;border-radius:2px;background:#e2e8f0;margin:12px auto 0"></div>

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 12px;border-bottom:1px solid #f1f5f9">
        <div>
          <p style="font-size:1rem;font-weight:800;color:#1e293b;letter-spacing:-0.02em">Approve Customer</p>
          <p style="font-size:11px;color:#94a3b8;margin-top:2px">Complete both steps before confirming</p>
        </div>
        <button id="apv-close" style="width:32px;height:32px;border-radius:50%;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:18px;color:#64748b">close</span>
        </button>
      </div>

      <!-- Customer row -->
      <div style="display:flex;align-items:center;gap:10px;padding:12px 20px;background:#fafafa;border-bottom:1px solid #f1f5f9">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#fef9c3,#fde68a);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:0.875rem;font-weight:900;color:#92400e">${user.initials}</span>
        </div>
        <div>
          <p style="font-size:var(--font-sm);font-weight:700;color:#1e293b">${user.name}</p>
          <p style="font-size:11px;color:#94a3b8">${user.phone} · ${user.vehicle}</p>
        </div>
      </div>

      <!-- Step 1: Payment Proof -->
      <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div id="ind-1" style="width:28px;height:28px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;color:#64748b;transition:all 0.2s">1</div>
          <div>
            <p style="font-size:var(--font-sm);font-weight:700;color:#1e293b">Payment Proof</p>
            <p style="font-size:11px;color:#94a3b8;margin-top:1px">Upload screenshot or photo of INR 3,000 received</p>
          </div>
        </div>
        <input type="file" id="proof-input" accept="image/*,application/pdf" style="display:none">
        <div id="proof-zone" style="border:2px dashed #e2e8f0;border-radius:12px;padding:22px 16px;text-align:center;cursor:pointer;transition:all 0.2s">
          <span class="material-symbols-outlined" style="font-size:32px;color:#cbd5e1;display:block;margin-bottom:6px">upload_file</span>
          <p style="font-size:var(--font-xs);font-weight:600;color:#94a3b8">Tap to upload payment screenshot</p>
          <p style="font-size:10px;color:#cbd5e1;margin-top:3px">JPG, PNG or PDF accepted</p>
        </div>
        <div id="proof-preview" style="display:none;margin-top:10px"></div>
      </div>

      <!-- Step 2: Customer Photo -->
      <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div id="ind-2" style="width:28px;height:28px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;color:#64748b;transition:all 0.2s">2</div>
          <div>
            <p style="font-size:var(--font-sm);font-weight:700;color:#1e293b">Customer Photo</p>
            <p style="font-size:11px;color:#94a3b8;margin-top:1px">Selfie of customer receiving the allocated battery</p>
          </div>
        </div>
        <input type="file" id="photo-input" accept="image/*" capture="environment" style="display:none">
        <div id="photo-zone" style="border:2px dashed #e2e8f0;border-radius:12px;padding:22px 16px;text-align:center;cursor:pointer;transition:all 0.2s">
          <span class="material-symbols-outlined" style="font-size:32px;color:#cbd5e1;display:block;margin-bottom:6px">photo_camera</span>
          <p style="font-size:var(--font-xs);font-weight:600;color:#94a3b8">Tap to take photo or choose from gallery</p>
          <p style="font-size:10px;color:#cbd5e1;margin-top:3px">Customer must be visible with the battery</p>
        </div>
        <div id="photo-preview" style="display:none;margin-top:10px"></div>
      </div>

      <!-- Confirm -->
      <div style="padding:16px 20px 20px">
        <button id="apv-confirm"
          style="width:100%;padding:16px;border-radius:14px;border:none;background:linear-gradient(145deg,#22c55e,#16a34a);color:#fff;font-size:var(--font-sm);font-weight:800;cursor:not-allowed;opacity:0.35;pointer-events:none;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.2s,pointer-events 0s">
          <span class="material-symbols-outlined" style="font-size:18px">verified</span>
          Confirm &amp; Approve Customer
        </button>
        <p id="apv-hint" style="text-align:center;font-size:10px;color:#94a3b8;margin-top:8px">Upload payment proof &amp; customer photo to proceed</p>
      </div>
    </div>
  `;

  document.body.appendChild(ov);

  // Scope all queries to the overlay — avoids global ID conflicts
  const confirmBtn  = ov.querySelector('#apv-confirm');
  const hintEl      = ov.querySelector('#apv-hint');
  const proofInput  = ov.querySelector('#proof-input');
  const photoInput  = ov.querySelector('#photo-input');
  const proofZone   = ov.querySelector('#proof-zone');
  const photoZone   = ov.querySelector('#photo-zone');
  const proofPreview = ov.querySelector('#proof-preview');
  const photoPreview = ov.querySelector('#photo-preview');
  const ind1        = ov.querySelector('#ind-1');
  const ind2        = ov.querySelector('#ind-2');

  let proofFile = null, photoFile = null;
  let processing = false;

  function setReady(ready) {
    // Use pointer-events instead of disabled attribute — avoids browser click-block quirks
    confirmBtn.style.opacity       = ready ? '1'      : '0.35';
    confirmBtn.style.cursor        = ready ? 'pointer' : 'not-allowed';
    confirmBtn.style.pointerEvents = ready ? 'auto'   : 'none';
    if (hintEl) hintEl.style.display = ready ? 'none' : 'block';
  }

  function markStep(ind) {
    if (!ind) return;
    ind.style.background = 'rgba(212,101,74,0.12)';
    ind.style.color      = '#D4654A';
    ind.innerHTML        = `<span class="material-symbols-outlined" style="font-size:14px;font-variation-settings:'FILL' 1">check</span>`;
  }

  function showPreview(previewEl, zoneEl, file, ind) {
    if (!previewEl || !zoneEl) { setReady(!!(proofFile && photoFile)); return; }
    zoneEl.style.borderColor = 'rgba(212,101,74,0.40)';
    zoneEl.style.background  = 'rgba(212,101,74,0.03)';
    markStep(ind);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        previewEl.style.display = 'block';
        previewEl.innerHTML = `
          <div style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0">
            <img src="${ev.target.result}" style="width:100%;max-height:160px;object-fit:cover;display:block">
            <div style="padding:6px 10px;background:#f8fafc;display:flex;align-items:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:13px;color:#D4654A;font-variation-settings:'FILL' 1">check_circle</span>
              <span style="font-size:11px;color:#64748b;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${file.name}</span>
              <span style="font-size:10px;color:#94a3b8">${(file.size/1024).toFixed(0)} KB</span>
            </div>
          </div>`;
      };
      reader.readAsDataURL(file);
    } else {
      previewEl.style.display = 'block';
      previewEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
          <span class="material-symbols-outlined" style="font-size:20px;color:#D4654A">description</span>
          <span style="font-size:12px;color:#475569;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${file.name}</span>
          <span style="font-size:10px;color:#94a3b8">${(file.size/1024).toFixed(0)} KB</span>
        </div>`;
    }
    setReady(!!(proofFile && photoFile));
  }

  proofZone?.addEventListener('click', () => proofInput?.click());
  photoZone?.addEventListener('click', () => photoInput?.click());

  proofInput?.addEventListener('change', e => {
    proofFile = e.target.files[0] || null;
    if (proofFile) showPreview(proofPreview, proofZone, proofFile, ind1);
  });
  photoInput?.addEventListener('change', e => {
    photoFile = e.target.files[0] || null;
    if (photoFile) showPreview(photoPreview, photoZone, photoFile, ind2);
  });

  ov.querySelector('#apv-close')?.addEventListener('click', () => ov.remove());
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });

  // Confirm & run API calls
  confirmBtn?.addEventListener('click', async () => {
    if (processing || !(proofFile && photoFile)) return;
    processing = true;
    setReady(false);
    confirmBtn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Processing...`;

    try {
      const stockBats = await fetch('${API_BASE}/batteries?status=stock').then(r => r.json());
      if (!stockBats.length) {
        showToast('No stock batteries available!', 'error');
        processing = false;
        confirmBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">verified</span> Confirm &amp; Approve Customer`;
        setReady(true);
        return;
      }
      const bat          = stockBats[0];
      const now          = new Date().toISOString();
      const depositTxnId = `TXN-DP-${String(Date.now()).slice(-6)}`;

      await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kycStatus: 'verified', onboardedAt: now, depositPaid: true,
          depositTxnId, batteryId: bat.id, onboardedBy: agent?.id || null,
          depositProof:  { name: proofFile.name, size: Math.round(proofFile.size / 1024) + ' KB', uploadedAt: now },
          customerPhoto: { name: photoFile.name, size: Math.round(photoFile.size / 1024) + ' KB', uploadedAt: now },
        }),
      });
      await fetch(`${API_BASE}/batteries/${bat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'deployed', assignedTo: userId, stationId: null, stationName: null }),
      });
      await fetch('${API_BASE}/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: depositTxnId, userId, type: 'security_deposit',
          amount: 3000, mode: 'Cash', status: 'completed',
          timestamp: now, description: 'Security deposit - battery onboarding',
        }),
      });
      // Create swap/allocation record so it appears in all swap history views
      await fetch('${API_BASE}/swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `SWP-ALLOC-${String(Date.now()).slice(-8)}`,
          userId,
          stationId: null,
          stationName: 'Battery Allocation',
          batteryOut: null,
          batteryIn: bat.id,
          timestamp: now,
          amount: 0,
          transactionId: depositTxnId,
          status: 'completed',
          type: 'allocation',
        }),
      });

      ov.remove();
      showToast(`KYC approved! ${bat.id} allocated to ${user.name}`, 'success');
      renderCustomerDetail(container, userId, onBack, onResubmit, agent);
    } catch (err) {
      showToast('Approval failed — ' + (err.message || 'check API connection'), 'error');
      processing = false;
      confirmBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">verified</span> Confirm &amp; Approve Customer`;
      setReady(true);
    }
  });
}
