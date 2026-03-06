// ============================================
// Confirmation - KYC Submitted (Premium)
// ============================================

export function renderConfirmation(container, userId, userName, onRegisterAnother, onGoHome) {
  container.innerHTML = `
    <!-- Success Hero -->
    <div class="success-hero fade-up">
      <div class="success-pulse">
        <span class="material-symbols-outlined">check_circle</span>
      </div>
      <h2 style="font-size:1.375rem;font-weight:900;color:var(--green);margin-bottom:8px;letter-spacing:-0.02em">
        Application Submitted!
      </h2>
      <p style="font-size:var(--font-sm);color:#15803d;opacity:0.85;line-height:1.6;max-width:270px;margin:0 auto">
        <b>${userName}</b>'s KYC is under review.<br>
        Verify documents in person to approve.
      </p>
    </div>

    <!-- Details -->
    <div class="card" style="padding:4px 16px 4px;margin-bottom:20px" class="fade-up">
      <p class="form-section" style="margin-top:14px">Application Details</p>
      ${detailRow('badge',        'Customer ID', userId,               true)}
      ${detailRow('schedule',     'KYC Status',  'Pending Review',     false)}
      ${detailRow('battery_full', 'Battery',     'Pending Allocation', false)}
      ${detailRow('info',         'Next Step',   'Verify docs & collect ₹3,000 deposit', false)}
    </div>

    <!-- CTA Buttons -->
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-primary" id="conf-new">
        <span class="material-symbols-outlined">person_add</span> Register Another Customer
      </button>
      <button class="btn btn-outline" id="conf-home">
        <span class="material-symbols-outlined">home</span> Back to Dashboard
      </button>
    </div>
  `;

  document.getElementById('conf-new').addEventListener('click', onRegisterAnother);
  document.getElementById('conf-home').addEventListener('click', onGoHome);
}

function detailRow(iconName, label, value, mono) {
  return `
  <div class="review-row">
    <div class="review-icon">
      <span class="material-symbols-outlined">${iconName}</span>
    </div>
    <span class="review-label">${label}</span>
    <span class="review-value" style="font-family:${mono ? 'monospace' : 'inherit'}">${value}</span>
  </div>`;
}
