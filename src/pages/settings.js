// ============================================
// Settings Page (Electica)
// ============================================
import { icon } from '../components/icons.js';
import { showToast } from '../utils/toast.js';

export function renderSettings(container) {
    container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-desc">Manage your system preferences and configuration</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
        <!-- Profile Settings -->
        <div class="card" style="padding:1.5rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
            ${icon('person', '20px', 'color:#2563eb')} Profile Settings
          </h3>
          <div style="display:flex;flex-direction:column;gap:1rem">
            <div>
              <label style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Full Name</label>
              <input type="text" value="Alex Morgan" style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);color:#1e293b;background:#f8fafc;font-family:inherit;box-sizing:border-box" />
            </div>
            <div>
              <label style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Email Address</label>
              <input type="email" value="alex.morgan@electica.in" style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);color:#1e293b;background:#f8fafc;font-family:inherit;box-sizing:border-box" />
            </div>
            <div>
              <label style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Role</label>
              <input type="text" value="System Admin" disabled style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);color:#64748b;background:#f1f5f9;font-family:inherit;box-sizing:border-box" />
            </div>
            <button id="save-profile-btn" class="btn btn-primary" style="width:fit-content;margin-top:8px">
              ${icon('save', '16px')} Save Changes
            </button>
          </div>
        </div>

        <!-- Notification Preferences -->
        <div class="card" style="padding:1.5rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
            ${icon('notifications', '20px', 'color:#2563eb')} Notification Preferences
          </h3>
          <div style="display:flex;flex-direction:column;gap:1rem">
            ${settingsToggle('swap-alerts', 'Swap Alerts', 'Get notified for every battery swap event', true)}
            ${settingsToggle('maintenance-alerts', 'Maintenance Alerts', 'Station maintenance and health warnings', true)}
            ${settingsToggle('revenue-reports', 'Revenue Reports', 'Daily revenue summary notifications', false)}
            ${settingsToggle('cell-imbalance', 'Cell Imbalance Alerts', 'AI-detected battery anomalies', true)}
            ${settingsToggle('email-digest', 'Weekly Email Digest', 'Consolidated weekly performance report', false)}
          </div>
        </div>
      </div>

      <!-- System Configuration -->
      <div class="card" style="padding:1.5rem;margin-bottom:1.25rem">
        <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
          ${icon('tune', '20px', 'color:#2563eb')} System Configuration
        </h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
          <div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:6px">Default Currency</p>
            <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);background:white;font-family:inherit;color:#1e293b">
              <option selected>₹ INR (Indian Rupee)</option>
              <option>$ USD (US Dollar)</option>
              <option>€ EUR (Euro)</option>
            </select>
          </div>
          <div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:6px">Timezone</p>
            <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);background:white;font-family:inherit;color:#1e293b">
              <option selected>IST (UTC+5:30)</option>
              <option>UTC (UTC+0:00)</option>
              <option>EST (UTC-5:00)</option>
            </select>
          </div>
          <div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
            <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:6px">Data Refresh Interval</p>
            <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);background:white;font-family:inherit;color:#1e293b">
              <option>5 seconds</option>
              <option selected>15 seconds</option>
              <option>30 seconds</option>
              <option>1 minute</option>
            </select>
          </div>
        </div>
      </div>

      <footer class="app-footer" style="margin-top:2rem">
        ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#9ca3af')}
        Electica Enterprise Dashboard © 2024
      </footer>
    </div>
  `;

    // Save profile button
    document.getElementById('save-profile-btn')?.addEventListener('click', () => {
        showToast('Profile settings saved successfully', 'success');
    });

    // Toggle switches
    container.querySelectorAll('.settings-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isOn = toggle.dataset.state === 'on';
            toggle.dataset.state = isOn ? 'off' : 'on';
            toggle.style.background = isOn ? '#e2e8f0' : '#2563eb';
            toggle.querySelector('.toggle-knob').style.transform = isOn ? 'translateX(0)' : 'translateX(20px)';
            const label = toggle.closest('.toggle-row').querySelector('.toggle-label').textContent;
            showToast(`${label} ${isOn ? 'disabled' : 'enabled'}`, isOn ? 'warning' : 'success');
        });
    });
}

function settingsToggle(id, label, desc, isOn) {
    return `
    <div class="toggle-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">
      <div>
        <span class="toggle-label" style="font-size:var(--font-md);font-weight:600;color:#1e293b">${label}</span>
        <p style="font-size:var(--font-sm);color:#64748b;margin-top:2px">${desc}</p>
      </div>
      <div class="settings-toggle" data-state="${isOn ? 'on' : 'off'}" style="width:44px;height:24px;border-radius:12px;background:${isOn ? '#2563eb' : '#e2e8f0'};cursor:pointer;padding:2px;transition:background 0.2s;flex-shrink:0">
        <div class="toggle-knob" style="width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.1);transition:transform 0.2s;transform:translateX(${isOn ? '20px' : '0'})"></div>
      </div>
    </div>
  `;
}
