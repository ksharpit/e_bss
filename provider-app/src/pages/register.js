// ============================================
// Register - New Customer Onboarding (Premium)
// ============================================
import { showToast } from '../utils/toast.js';
import { createUser, getNextUserId } from '../utils/api.js';

const VEHICLES = [
  'Ather 450X', 'Ather 450S', 'Ola S1 Pro', 'Ola S1 Air',
  'Bounce Infinity E1', 'Hero Electric Optima', 'Hero Electric NYX',
  'TVS iQube S', 'Bajaj Chetak', 'Ampere Primus',
];

let step = 1;
let formData = {};

export function renderRegister(container, agent, onSuccess) {
  step = 1; formData = {};
  renderStep(container, agent, onSuccess);
}

function renderStep(container, agent, onSuccess) {
  if (step === 1) renderStep1(container, agent, onSuccess);
  else if (step === 2) renderStep2(container, agent, onSuccess);
  else if (step === 3) renderStep3(container, agent, onSuccess);
}

// ── Step 1: Personal Details ──────────────────────────────
function renderStep1(container, agent, onSuccess) {
  container.innerHTML = `
    ${stepBar(1)}

    <div class="card" style="padding:18px;margin-bottom:14px">
      <p class="form-section">Personal Details</p>

      <div class="form-group">
        <label class="form-label">Full Name <span class="req">*</span></label>
        <div class="input-wrap">
          <span class="material-symbols-outlined input-icon">person</span>
          <input id="f-name" class="form-input with-icon" type="text" placeholder="e.g. Priya Sharma" value="${formData.name || ''}" autocomplete="name" />
        </div>
        <div class="form-error" id="err-name" style="display:none"></div>
      </div>

      <div class="form-group">
        <label class="form-label">Mobile Number <span class="req">*</span></label>
        <div class="input-wrap">
          <span class="material-symbols-outlined input-icon">call</span>
          <input id="f-phone" class="form-input with-icon" type="tel" placeholder="9876543210" value="${formData.phone || ''}" autocomplete="tel" />
        </div>
        <div class="form-hint">10-digit Indian mobile number</div>
        <div class="form-error" id="err-phone" style="display:none"></div>
      </div>

      <div class="form-group">
        <label class="form-label">Vehicle Model <span class="req">*</span></label>
        <div class="select-wrapper">
          <span class="material-symbols-outlined input-icon" style="z-index:1">two_wheeler</span>
          <select id="f-vehicle" class="form-select with-icon">
            <option value="">Select vehicle model</option>
            ${VEHICLES.map(v => `<option value="${v}" ${formData.vehicle === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="form-error" id="err-vehicle" style="display:none"></div>
      </div>

      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Vehicle Registration No. <span class="req">*</span></label>
        <div class="input-wrap">
          <span class="material-symbols-outlined input-icon">pin</span>
          <input id="f-vehicleId" class="form-input with-icon" type="text" placeholder="KA-01-EV-1234" value="${formData.vehicleId || ''}" style="text-transform:uppercase" />
        </div>
        <div class="form-error" id="err-vehicleId" style="display:none"></div>
      </div>
    </div>

    <button class="btn btn-primary" id="step1-next">
      <span class="material-symbols-outlined">arrow_forward</span> Continue to KYC Documents
    </button>
  `;

  document.getElementById('step1-next').addEventListener('click', () => {
    const name      = document.getElementById('f-name').value.trim();
    const phone     = document.getElementById('f-phone').value.trim();
    const vehicle   = document.getElementById('f-vehicle').value;
    const vehicleId = document.getElementById('f-vehicleId').value.trim().toUpperCase();
    let valid = true;
    if (!name)                  { showErr('err-name', 'Full name is required'); valid = false; }
    if (!isValidPhone(phone))   { showErr('err-phone', 'Enter a valid 10-digit mobile number'); valid = false; }
    if (!vehicle)               { showErr('err-vehicle', 'Select a vehicle model'); valid = false; }
    if (!vehicleId || vehicleId.length < 5) { showErr('err-vehicleId', 'Enter a valid registration number'); valid = false; }
    if (!valid) return;
    formData = { ...formData, name, phone: formatPhone(phone), vehicle, vehicleId };
    step = 2; renderStep(container, agent, onSuccess);
  });
}

// ── Step 2: KYC Documents ──────────────────────────────────
function renderStep2(container, agent, onSuccess) {
  container.innerHTML = `
    ${stepBar(2)}

    <div class="card" style="padding:18px;margin-bottom:14px">
      <p class="form-section">KYC Documents</p>

      <div class="form-group">
        <label class="form-label">Aadhaar Number <span class="req">*</span></label>
        <div class="input-wrap">
          <span class="material-symbols-outlined input-icon">credit_card</span>
          <input id="f-aadhaar" class="form-input with-icon" type="text" inputmode="numeric" placeholder="1234 5678 9012" maxlength="14" value="${formData.aadhaarRaw ? formData.aadhaarRaw.replace(/(\d{4})(?=\d)/g,'$1 ') : ''}" />
        </div>
        <div class="form-hint">12-digit Aadhaar - stored as XXXX-XXXX-XXXX</div>
        <div class="form-error" id="err-aadhaar" style="display:none"></div>
      </div>

      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">PAN Card Number <span class="req">*</span></label>
        <div class="input-wrap">
          <span class="material-symbols-outlined input-icon">badge</span>
          <input id="f-pan" class="form-input with-icon" type="text" placeholder="ABCDE1234F" maxlength="10" value="${formData.pan || ''}" style="text-transform:uppercase;letter-spacing:0.08em" />
        </div>
        <div class="form-hint">Format: ABCDE1234F</div>
        <div class="form-error" id="err-pan" style="display:none"></div>
      </div>
    </div>

    <div class="notice notice-coral">
      <span class="material-symbols-outlined">lock</span>
      <p>Document numbers are masked before storage. Physical documents must be verified in person before approving KYC.</p>
    </div>

    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" id="step2-back" style="width:auto;padding:15px 18px;flex-shrink:0">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <button class="btn btn-primary" id="step2-next" style="flex:1">
        <span class="material-symbols-outlined">arrow_forward</span> Review & Submit
      </button>
    </div>
  `;

  document.getElementById('f-aadhaar').addEventListener('input', function() {
    let v = this.value.replace(/\D/g,'').slice(0,12);
    this.value = v.replace(/(\d{4})(?=\d)/g,'$1 ');
  });
  document.getElementById('f-pan').addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });
  document.getElementById('step2-back').addEventListener('click', () => { step=1; renderStep(container,agent,onSuccess); });
  document.getElementById('step2-next').addEventListener('click', () => {
    const aadhaarRaw = document.getElementById('f-aadhaar').value.replace(/\s/g,'');
    const pan        = document.getElementById('f-pan').value.trim().toUpperCase();
    let valid = true;
    if (aadhaarRaw.length !== 12 || !/^\d+$/.test(aadhaarRaw)) { showErr('err-aadhaar', 'Enter a valid 12-digit Aadhaar'); valid = false; }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan))                  { showErr('err-pan', 'PAN must be in format ABCDE1234F'); valid = false; }
    if (!valid) return;
    formData = { ...formData, aadhaarRaw, aadhaar: `XXXX-XXXX-${aadhaarRaw.slice(-4)}`, pan };
    step = 3; renderStep(container, agent, onSuccess);
  });
}

// ── Step 3: Review & Submit ────────────────────────────────
function renderStep3(container, agent, onSuccess) {
  container.innerHTML = `
    ${stepBar(3)}

    <div class="card" style="padding:18px;margin-bottom:14px">
      <p class="form-section">Review Details</p>
      ${rRow('person',      'Name',       formData.name)}
      ${rRow('call',        'Mobile',     formData.phone)}
      ${rRow('two_wheeler', 'Vehicle',    formData.vehicle)}
      ${rRow('pin',         'Reg. No.',   formData.vehicleId)}
      ${rRow('credit_card', 'Aadhaar',    formData.aadhaar)}
      ${rRow('badge',       'PAN',        formData.pan)}
      ${rRow('badge',       'Agent',      agent.id, true)}
    </div>

    <div class="notice notice-amber">
      <span class="material-symbols-outlined">info</span>
      <p>KYC will be submitted as <b>Pending</b>. You can approve it immediately after verifying documents and collecting ₹3,000 deposit.</p>
    </div>

    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" id="step3-back" style="width:auto;padding:15px 18px;flex-shrink:0">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <button class="btn btn-primary" id="step3-submit" style="flex:1">
        <span class="material-symbols-outlined">send</span> Submit Application
      </button>
    </div>
  `;

  document.getElementById('step3-back').addEventListener('click', () => { step=2; renderStep(container,agent,onSuccess); });
  document.getElementById('step3-submit').addEventListener('click', async () => {
    const btn = document.getElementById('step3-submit');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Submitting...`;
    try {
      const userId   = await getNextUserId();
      const parts    = formData.name.trim().split(' ');
      const initials = (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
      const now      = new Date().toISOString();
      await createUser({
        id: userId, name: formData.name, initials,
        phone: formData.phone, vehicle: formData.vehicle, vehicleId: formData.vehicleId,
        batteryId: null, station: null, swapCount: 0, totalSpent: 0,
        kycStatus: 'pending', depositPaid: false, depositTxnId: null,
        aadhaar: formData.aadhaar, pan: formData.pan,
        onboardedBy: agent.id, onboardedAt: null, lastSwap: null, kycSubmittedAt: now,
      });
      showToast(`${formData.name} registered!`, 'success');
      onSuccess(userId, formData.name);
    } catch {
      showToast('Submission failed - check API connection', 'error');
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">send</span> Submit Application`;
    }
  });
}

// ── Helpers ────────────────────────────────────────────────
function stepBar(current) {
  const steps = ['Personal', 'KYC Docs', 'Review'];
  let html = '<div class="step-bar">';
  steps.forEach((s, i) => {
    const n   = i + 1;
    const cls = n < current ? 'done' : n === current ? 'active' : 'inactive';
    html += `<div class="step-node">
      <div class="step-dot ${cls}">${n < current ? `<span class="material-symbols-outlined" style="font-size:14px;font-variation-settings:'FILL' 1">check</span>` : n}</div>
      <span class="step-node-label ${cls}">${s}</span>
    </div>`;
    if (i < steps.length - 1) html += `<div class="step-connector ${n < current ? 'done' : ''}"></div>`;
  });
  html += '</div>';
  return html;
}

function rRow(iconName, label, value, muted = false) {
  return `
  <div class="review-row">
    <div class="review-icon" style="${muted ? 'background:var(--border-light)' : ''}">
      <span class="material-symbols-outlined" style="${muted ? 'color:var(--text-soft)' : ''}">${iconName}</span>
    </div>
    <span class="review-label">${label}</span>
    <span class="review-value" style="font-family:${['Aadhaar','PAN','Agent','Reg. No.'].includes(label)?'monospace':'inherit'};${muted?'color:var(--text-soft)':''}">${value||'-'}</span>
  </div>`;
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function isValidPhone(p) {
  return /^\+?91?\s?[6-9]\d{9}$|^[6-9]\d{9}$/.test(p.replace(/[\s\-]/g,''));
}
function formatPhone(raw) {
  const d = raw.replace(/\D/g,'').replace(/^91/,'').slice(-10);
  return `+91 ${d.slice(0,5)}-${d.slice(5)}`;
}
