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

// ── Step Bar (Premium) ──────────────────────────────
function stepBar(current) {
  const steps = [
    { label: 'Personal', icon: 'person' },
    { label: 'KYC Docs', icon: 'verified_user' },
    { label: 'Review', icon: 'fact_check' },
  ];
  let html = '<div class="step-bar-premium slide-up">';
  steps.forEach((s, i) => {
    const n   = i + 1;
    const cls = n < current ? 'done' : n === current ? 'active' : 'inactive';
    html += `<div class="step-node-p">
      <div class="step-dot-p ${cls}">${n < current
        ? `<span class="material-symbols-outlined" style="font-size:15px;font-variation-settings:'FILL' 1">check</span>`
        : `<span class="material-symbols-outlined" style="font-size:15px;font-variation-settings:'FILL' 1">${s.icon}</span>`
      }</div>
      <span class="step-label-p ${cls}">${s.label}</span>
    </div>`;
    if (i < steps.length - 1) {
      const connCls = n < current ? 'done' : n === current ? 'active' : '';
      html += `<div class="step-connector-p ${connCls}"></div>`;
    }
  });
  html += '</div>';
  return html;
}

// ── Step Header ─────────────────────────────────────
function stepHeader(icon, title, sub) {
  return `
  <div class="reg-step-header slide-up" style="animation-delay:0.05s">
    <div class="reg-step-header-content">
      <div class="reg-step-icon">
        <span class="material-symbols-outlined">${icon}</span>
      </div>
      <div>
        <div class="reg-step-title">${title}</div>
        <div class="reg-step-sub">${sub}</div>
      </div>
    </div>
  </div>`;
}

// ── Step 1: Personal Details ──────────────────────────────
function renderStep1(container, agent, onSuccess) {
  container.innerHTML = `
    ${stepBar(1)}
    ${stepHeader('person_add', 'Personal Details', 'Customer identity and vehicle information')}

    <div class="reg-form-card slide-up" style="animation-delay:0.10s">
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

      <div style="height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent);margin:4px 0 18px"></div>

      <div class="form-group">
        <label class="form-label">
          <span class="material-symbols-outlined" style="font-size:12px;vertical-align:middle;margin-right:3px;color:var(--coral)">two_wheeler</span>
          Vehicle Model <span class="req">*</span>
        </label>
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

    <button class="btn btn-primary slide-up" id="step1-next" style="animation-delay:0.15s">
      Continue to KYC
      <span class="material-symbols-outlined">arrow_forward</span>
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
    ${stepHeader('verified_user', 'KYC Documents', 'Government-issued identity verification')}

    <div class="reg-form-card slide-up" style="animation-delay:0.10s">
      <div class="form-group">
        <label class="form-label">
          <span class="material-symbols-outlined" style="font-size:12px;vertical-align:middle;margin-right:3px;color:var(--coral)">credit_card</span>
          Aadhaar Number <span class="req">*</span>
        </label>
        <div class="input-wrap">
          <span class="material-symbols-outlined input-icon">credit_card</span>
          <input id="f-aadhaar" class="form-input with-icon" type="text" inputmode="numeric" placeholder="1234 5678 9012" maxlength="14" value="${formData.aadhaarRaw ? formData.aadhaarRaw.replace(/(\d{4})(?=\d)/g,'$1 ') : ''}" />
        </div>
        <div class="form-hint">12-digit Aadhaar - stored as XXXX-XXXX-XXXX</div>
        <div class="form-error" id="err-aadhaar" style="display:none"></div>
      </div>

      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">
          <span class="material-symbols-outlined" style="font-size:12px;vertical-align:middle;margin-right:3px;color:var(--coral)">badge</span>
          PAN Card Number <span class="req">*</span>
        </label>
        <div class="input-wrap">
          <span class="material-symbols-outlined input-icon">badge</span>
          <input id="f-pan" class="form-input with-icon" type="text" placeholder="ABCDE1234F" maxlength="10" value="${formData.pan || ''}" style="text-transform:uppercase;letter-spacing:0.08em" />
        </div>
        <div class="form-hint">Format: ABCDE1234F</div>
        <div class="form-error" id="err-pan" style="display:none"></div>
      </div>
    </div>

    <div class="notice notice-coral slide-up" style="animation-delay:0.12s">
      <span class="material-symbols-outlined">lock</span>
      <p>Document numbers are masked before storage. Physical documents must be verified in person before approving KYC.</p>
    </div>

    <div style="display:flex;gap:10px" class="slide-up" style="animation-delay:0.15s">
      <button class="btn btn-ghost" id="step2-back" style="width:auto;padding:15px 18px;flex-shrink:0">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <button class="btn btn-primary" id="step2-next" style="flex:1">
        Review & Submit
        <span class="material-symbols-outlined">arrow_forward</span>
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
    ${stepHeader('fact_check', 'Review & Submit', 'Verify all details before submission')}

    <div class="reg-form-card slide-up" style="animation-delay:0.10s">
      <div class="review-tile-grid">
        ${tile('person',      'Full Name',    formData.name)}
        ${tile('call',        'Mobile',       formData.phone)}
        ${tile('two_wheeler', 'Vehicle',      formData.vehicle)}
        ${tile('pin',         'Registration', formData.vehicleId, true)}
        ${tile('credit_card', 'Aadhaar',      formData.aadhaar, true)}
        ${tile('badge',       'PAN Card',     formData.pan, true)}
      </div>

      <div style="margin-top:14px;padding:12px 14px;background:rgba(212,101,74,0.05);border:1px solid rgba(212,101,74,0.15);border-radius:10px;display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:9px;background:rgba(212,101,74,0.10);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span class="material-symbols-outlined" style="font-size:15px;color:var(--coral);font-variation-settings:'FILL' 1">support_agent</span>
        </div>
        <div>
          <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-soft);margin-bottom:2px">Onboarding Agent</p>
          <p style="font-size:var(--font-sm);font-weight:700;color:var(--text)">${agent.name} <span style="font-size:var(--font-xs);color:var(--text-soft);font-family:monospace">${agent.id}</span></p>
        </div>
      </div>
    </div>

    <div class="notice notice-amber slide-up" style="animation-delay:0.12s">
      <span class="material-symbols-outlined">info</span>
      <p>KYC will be submitted as <b>Pending</b>. You can approve it immediately after verifying documents and collecting the <b>INR 3,000</b> security deposit.</p>
    </div>

    <div style="display:flex;gap:10px" class="slide-up" style="animation-delay:0.15s">
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
function tile(iconName, label, value, mono = false) {
  return `
  <div class="review-tile">
    <div class="review-tile-icon">
      <span class="material-symbols-outlined">${iconName}</span>
    </div>
    <div class="review-tile-label">${label}</div>
    <div class="review-tile-value" style="${mono ? 'font-family:monospace;letter-spacing:0.04em' : ''}">${value || '-'}</div>
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
