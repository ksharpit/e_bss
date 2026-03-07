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
    <div class="reg-form-card fade-up" style="animation-delay:0.05s">
      <div class="review-tile-grid">
        ${detailTile('badge',        'Customer ID',   userId,               true)}
        ${detailTile('schedule',     'KYC Status',    'Pending Review',     false)}
        ${detailTile('battery_full', 'Battery',       'Pending Allocation', false)}
        ${detailTile('info',         'Next Step',     'Verify & collect INR 3,000', false)}
      </div>
    </div>

    <!-- CTA Buttons -->
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:6px" class="fade-up" style="animation-delay:0.10s">
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

function detailTile(iconName, label, value, mono) {
  return `
  <div class="review-tile">
    <div class="review-tile-icon">
      <span class="material-symbols-outlined">${iconName}</span>
    </div>
    <div class="review-tile-label">${label}</div>
    <div class="review-tile-value" style="${mono ? 'font-family:monospace;letter-spacing:0.04em' : ''}">${value}</div>
  </div>`;
}
