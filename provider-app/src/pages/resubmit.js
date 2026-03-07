// ============================================
// Resubmit KYC - for rejected customers
// ============================================
import { showToast } from '../utils/toast.js';
import { apiFetch } from '../utils/apiFetch.js';

const VEHICLES = [
  'Ather 450X', 'Ather 450S', 'Ola S1 Pro', 'Ola S1 Air',
  'Bounce Infinity E1', 'Hero Electric Optima', 'Hero Electric NYX',
  'TVS iQube S', 'Bajaj Chetak', 'Ampere Primus',
];

export function renderResubmit(container, user, onSuccess, onCancel) {
  container.innerHTML = `
    <!-- Rejection banner -->
    <div style="background:var(--red-light);border:1px solid var(--red-border);border-radius:var(--radius-sm);padding:12px 14px;display:flex;gap:10px;margin-bottom:16px">
      <span class="material-symbols-outlined" style="font-size:16px;color:var(--red);flex-shrink:0;margin-top:1px;font-variation-settings:'FILL' 1">cancel</span>
      <div>
        <p style="font-size:var(--font-sm);font-weight:700;color:var(--red);margin-bottom:2px">Previous KYC Rejected</p>
        <p style="font-size:var(--font-xs);color:var(--red);font-weight:500">${user.rejectionReason || 'No reason provided'}</p>
      </div>
    </div>

    <div class="card" style="padding:16px;margin-bottom:16px">
      <p class="section-label" style="margin-bottom:14px">Update & Resubmit for ${user.name}</p>

      <div class="form-group">
        <label class="form-label">Full Name <span class="req">*</span></label>
        <input id="rs-name" class="form-input" type="text" value="${user.name}" />
        <div class="form-error" id="rs-err-name" style="display:none"></div>
      </div>

      <div class="form-group">
        <label class="form-label">Mobile Number <span class="req">*</span></label>
        <input id="rs-phone" class="form-input" type="tel" value="${user.phone}" />
        <div class="form-error" id="rs-err-phone" style="display:none"></div>
      </div>

      <div class="form-group">
        <label class="form-label">Vehicle Model <span class="req">*</span></label>
        <div class="select-wrapper">
          <select id="rs-vehicle" class="form-select">
            ${VEHICLES.map(v => `<option value="${v}" ${user.vehicle === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Vehicle Registration No. <span class="req">*</span></label>
        <input id="rs-vehicleId" class="form-input" type="text" value="${user.vehicleId}" style="text-transform:uppercase" />
        <div class="form-error" id="rs-err-vehicleId" style="display:none"></div>
      </div>

      <div class="form-group">
        <label class="form-label">Aadhaar Number <span class="req">*</span></label>
        <input id="rs-aadhaar" class="form-input" type="text" inputmode="numeric" placeholder="1234 5678 9012" maxlength="14" />
        <div class="form-hint">Re-enter full 12-digit number to update</div>
        <div class="form-error" id="rs-err-aadhaar" style="display:none"></div>
      </div>

      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">PAN Card Number <span class="req">*</span></label>
        <input id="rs-pan" class="form-input" type="text" value="${user.pan}" maxlength="10" style="text-transform:uppercase;letter-spacing:0.05em" />
        <div class="form-error" id="rs-err-pan" style="display:none"></div>
      </div>
    </div>

    <div style="display:flex;gap:10px">
      <button class="btn btn-outline" id="rs-cancel" style="flex:0 0 auto;width:auto;padding:14px 18px">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <button class="btn btn-primary" id="rs-submit" style="flex:1">
        <span class="material-symbols-outlined">send</span> Resubmit KYC
      </button>
    </div>
  `;

  // Auto-format Aadhaar
  document.getElementById('rs-aadhaar').addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '').slice(0, 12);
    this.value = val.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  document.getElementById('rs-pan').addEventListener('input', function () {
    this.value = this.value.toUpperCase();
  });

  document.getElementById('rs-cancel').addEventListener('click', onCancel);

  document.getElementById('rs-submit').addEventListener('click', async () => {
    const name      = document.getElementById('rs-name').value.trim();
    const phone     = document.getElementById('rs-phone').value.trim();
    const vehicle   = document.getElementById('rs-vehicle').value;
    const vehicleId = document.getElementById('rs-vehicleId').value.trim().toUpperCase();
    const aadhaarRaw = document.getElementById('rs-aadhaar').value.replace(/\s/g, '');
    const pan        = document.getElementById('rs-pan').value.trim().toUpperCase();

    let valid = true;
    if (!name) { showErr('rs-err-name', 'Name is required'); valid = false; }
    if (!vehicleId || vehicleId.length < 5) { showErr('rs-err-vehicleId', 'Enter a valid reg. number'); valid = false; }
    if (aadhaarRaw.length !== 12 || !/^\d+$/.test(aadhaarRaw)) {
      showErr('rs-err-aadhaar', 'Enter a valid 12-digit Aadhaar number'); valid = false;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      showErr('rs-err-pan', 'PAN must be in format ABCDE1234F'); valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('rs-submit');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Submitting...`;

    try {
      const aadhaarMasked = `XXXX-XXXX-${aadhaarRaw.slice(-4)}`;
      const now = new Date().toISOString();

      const parts    = name.trim().split(' ');
      const initials = (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();

      await apiFetch(`/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          initials,
          phone: formatPhone(phone),
          vehicle,
          vehicleId,
          aadhaar:        aadhaarMasked,
          pan,
          kycStatus:      'pending',
          rejectionReason: null,
          kycSubmittedAt: now,
        }),
      });

      showToast(`KYC resubmitted for ${name}`, 'success');
      onSuccess(user.id, name);
    } catch {
      showToast('Resubmission failed - check API connection', 'error');
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">send</span> Resubmit KYC`;
    }
  });
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').replace(/^91/, '').slice(-10);
  return `+91 ${digits.slice(0, 5)}-${digits.slice(5)}`;
}
