// ============================================
// Profile - User Account
// ============================================
import { showToast } from '../utils/toast.js';
import { API_BASE } from '../config.js';

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function renderProfile(container, userId, onLogout, onLoaded) {
  container.innerHTML = `
    <div class="profile-hero">
      <div class="loading">Loading profile...</div>
    </div>`;

  let user = null, battery = null;
  try {
    user = await fetch(`${API_BASE}/users/${userId}`).then(r => r.ok ? r.json() : null);
    if (user?.batteryId) {
      battery = await fetch(`${API_BASE}/batteries/${user.batteryId}`)
        .then(r => r.ok ? r.json() : null).catch(() => null);
    }
  } catch {
    showToast('Cannot reach API', 'error');
  }

  if (!user) {
    container.innerHTML = `<div class="profile-hero"><p class="loading">User not found.</p></div>`;
    return;
  }

  if (onLoaded) onLoaded(user.initials || user.name.slice(0, 2).toUpperCase());


  const kycClass = user.kycStatus === 'verified' ? 'kyc-verified' : user.kycStatus === 'pending' ? 'kyc-pending' : 'kyc-rejected';
  const kycIcon  = user.kycStatus === 'verified' ? 'verified_user' : user.kycStatus === 'pending' ? 'schedule' : 'cancel';
  const kycLabel = user.kycStatus === 'verified' ? 'KYC Verified' : user.kycStatus === 'pending' ? 'KYC Pending' : 'KYC Rejected';

  container.innerHTML = `
    <!-- Profile Hero -->
    <div class="profile-hero fade-up">
      <div class="profile-avatar-ring">
        <span>${user.initials}</span>
      </div>
      <h2 class="profile-name">${user.name}</h2>
      <p class="profile-phone">${user.phone}</p>
      <div class="profile-badges">
        <span class="kyc-badge ${kycClass}">
          <span class="material-symbols-outlined">${kycIcon}</span>
          ${kycLabel}
        </span>
        ${user.depositPaid ? `
        <span class="kyc-badge" style="background:var(--gold-light);color:var(--gold);border:1px solid var(--gold-border)">
          <span class="material-symbols-outlined">shield</span>
          Deposit Paid
        </span>` : ''}
      </div>
    </div>

    <div style="padding:16px 16px 0">

      <!-- Vehicle & Account -->
      <p style="font-size:var(--font-xs);font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-soft);margin-bottom:10px">Vehicle</p>
      <div class="info-card fade-up" style="margin-bottom:16px">
        ${infoRow('two_wheeler',    'var(--gold-light)',     'var(--gold)',           'Vehicle',     user.vehicle)}
        ${infoRow('pin',            'var(--indigo-light)',   'var(--indigo)',          'Reg. No.',    user.vehicleId, true)}
        ${infoRow('calendar_today', 'var(--primary-light)',  'var(--primary)',         'Member Since', fmtDate(user.onboardedAt))}
        ${infoRow('badge',          'var(--border-light)',   'var(--text-soft)',       'Customer ID', user.id, true)}
      </div>

      <!-- Battery -->
      <p style="font-size:var(--font-xs);font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-soft);margin-bottom:10px">Battery</p>
      <div class="info-card fade-up-2" style="margin-bottom:16px">
        ${battery
          ? `${infoRow('battery_charging_full', 'var(--primary-light)', 'var(--primary)', 'Battery ID', battery.id, true)}
             ${infoRow('speed',                 'var(--gold-light)',    'var(--gold)',    'SOC',        battery.soc + '%')}
             ${infoRow('health_and_safety',     'var(--indigo-light)',  'var(--indigo)',  'Health',     battery.health + '%')}
             ${infoRow('autorenew',             'var(--border-light)',  'var(--text-soft)', 'Cycles',   battery.cycleCount || '-')}`
          : `<div style="padding:28px;text-align:center">
              <span class="material-symbols-outlined" style="font-size:32px;color:var(--text-soft);opacity:0.3;display:block;margin-bottom:8px">battery_unknown</span>
              <p style="font-size:var(--font-sm);color:var(--text-soft);font-weight:600">No battery allocated yet</p>
            </div>`}
      </div>

      <!-- KYC Documents -->
      <p style="font-size:var(--font-xs);font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-soft);margin-bottom:10px">KYC Documents</p>
      <div class="info-card fade-up-3" style="margin-bottom:16px">
        ${infoRow('credit_card', 'var(--indigo-light)', 'var(--indigo)', 'Aadhaar', user.aadhaar || '-', true)}
        ${infoRow('badge',       'var(--gold-light)',    'var(--gold)',   'PAN Card', user.pan || '-', true)}
      </div>

      <!-- System -->
      <p style="font-size:var(--font-xs);font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-soft);margin-bottom:10px">Account</p>
      <div class="info-card fade-up-3" style="margin-bottom:16px">
        <div id="api-check-row" class="info-row" style="cursor:pointer">
          <div class="info-row-icon" style="background:var(--indigo-light)">
            <span class="material-symbols-outlined" style="color:var(--indigo)">sync</span>
          </div>
          <span class="info-row-label">Check API Connection</span>
          <span class="material-symbols-outlined" style="font-size:16px;color:var(--text-soft)">chevron_right</span>
        </div>
        ${infoRow('person_outline', 'var(--surface-2)', 'var(--text-soft)', 'Onboarded By', user.onboardedBy || '-', false)}
      </div>

      <!-- Sign Out -->
      <div class="info-card fade-up-3" style="margin-bottom:24px;overflow:hidden">
        <div class="logout-row" id="logout-btn">
          <div class="logout-row-icon">
            <span class="material-symbols-outlined">logout</span>
          </div>
          <span style="flex:1;font-size:var(--font-sm);font-weight:700;color:var(--red)">Sign Out</span>
          <span class="material-symbols-outlined" style="font-size:16px;color:var(--red);opacity:0.5">chevron_right</span>
        </div>
      </div>

      <p style="text-align:center;font-size:var(--font-xs);color:var(--text-soft);padding-bottom:8px;letter-spacing:0.05em">
        Electica v1.0
      </p>
    </div>
  `;

  document.getElementById('api-check-row')?.addEventListener('click', async () => {
    try {
      const r = await fetch(`${API_BASE}/users?_limit=1`);
      if (r.ok) showToast('API connected - json-server on :3001', 'success');
    } catch {
      showToast('Cannot reach API - is json-server running?', 'error');
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (window.confirm('Sign out of Electica?')) onLogout();
  });
}

function infoRow(icon, bg, color, label, value, mono = false) {
  return `
  <div class="info-row">
    <div class="info-row-icon" style="background:${bg}">
      <span class="material-symbols-outlined" style="color:${color}">${icon}</span>
    </div>
    <span class="info-row-label">${label}</span>
    <span class="info-row-value${mono ? ' mono' : ''}">${value}</span>
  </div>`;
}
