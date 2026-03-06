// ============================================
// Provider App - Entry Point (Premium Redesign)
// ============================================
import './style.css';
import { renderHome }           from './pages/home.js';
import { renderRegister }       from './pages/register.js';
import { renderConfirmation }   from './pages/confirmation.js';
import { renderCustomerDetail } from './pages/customerDetail.js';
import { renderResubmit }       from './pages/resubmit.js';
import { showToast }            from './utils/toast.js';
import { API_BASE }             from './config.js';

const AGENT = { id: 'AGT-001', name: 'Ravi Mehta', zone: 'South Bangalore' };

let currentTab = 'home';
let overlay    = null; // { type: 'detail' | 'confirm' | 'resubmit', data: {} }

const app = document.getElementById('app');

function getAppBarConfig() {
  if (overlay?.type === 'detail')   return { back: true, title: 'Customer Detail' };
  if (overlay?.type === 'resubmit') return { back: true, title: 'Fix & Resubmit' };
  if (overlay?.type === 'confirm')  return { back: false, title: null };
  if (currentTab === 'register')    return { back: true,  title: 'Register Customer' };
  return { back: false, title: null };
}

function render() {
  const { back, title } = getAppBarConfig();
  const showNav = !overlay;

  app.innerHTML = `
    <div class="app-bar">
      ${back ? `<button class="app-bar-back" id="app-back"><span class="material-symbols-outlined">arrow_back</span></button>` : ''}
      ${title
        ? `<div style="flex:1"><div class="app-bar-title" style="font-size:var(--font-lg)">${title}</div></div>`
        : `<div class="app-bar-brand">
            <div class="app-bar-icon"><span class="material-symbols-outlined">bolt</span></div>
            <div>
              <div class="app-bar-title">Electica</div>
              <div class="app-bar-subtitle">Provider App · ${AGENT.zone}</div>
            </div>
           </div>`}
      <div class="app-bar-avatar">${AGENT.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
    </div>

    <div class="page" id="page-content"></div>

    ${showNav ? `
    <nav class="bottom-nav">
      <button class="nav-item ${currentTab === 'home' ? 'active' : ''}" data-tab="home">
        <span class="material-symbols-outlined">home</span>
        Home
      </button>
      <button class="nav-fab" id="nav-register-fab">
        <div class="nav-fab-circle"><span class="material-symbols-outlined">person_add</span></div>
        <span class="nav-fab-label">Register</span>
      </button>
      <button class="nav-item ${currentTab === 'profile' ? 'active' : ''}" data-tab="profile">
        <span class="material-symbols-outlined">account_circle</span>
        Profile
      </button>
    </nav>` : ''}
  `;

  document.getElementById('app-back')?.addEventListener('click', () => {
    overlay = null;
    if (currentTab === 'register') currentTab = 'home';
    render();
  });

  document.getElementById('nav-register-fab')?.addEventListener('click', () => {
    overlay = null; currentTab = 'register'; render();
  });

  app.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay = null; currentTab = btn.dataset.tab; render();
    });
  });

  renderPage();
}

function renderPage() {
  const content = document.getElementById('page-content');
  if (!content) return;

  if (overlay?.type === 'confirm') {
    renderConfirmation(
      content,
      overlay.data.userId, overlay.data.userName,
      () => { overlay = null; currentTab = 'register'; render(); },
      () => { overlay = null; currentTab = 'home';     render(); }
    );
    return;
  }
  if (overlay?.type === 'detail') {
    renderCustomerDetail(
      content,
      overlay.data.userId,
      () => { overlay = null; render(); },
      (user) => { overlay = { type: 'resubmit', data: { user } }; render(); },
      AGENT
    );
    return;
  }
  if (overlay?.type === 'resubmit') {
    renderResubmit(
      content,
      overlay.data.user,
      (userId, userName) => { overlay = { type: 'confirm', data: { userId, userName } }; render(); },
      () => { overlay = null; render(); }
    );
    return;
  }

  if (currentTab === 'home') {
    renderHome(content, AGENT, (userId) => { overlay = { type: 'detail', data: { userId } }; render(); });
  } else if (currentTab === 'register') {
    renderRegister(content, AGENT, (userId, userName) => {
      overlay = { type: 'confirm', data: { userId, userName } }; render();
    });
  } else if (currentTab === 'profile') {
    renderProfile(content);
  }
}

function renderProfile(content) {
  content.innerHTML = `
    <!-- Agent Profile Hero -->
    <div style="background:linear-gradient(145deg,#D96A50,#9E3A2E);border-radius:20px;padding:28px 20px 24px;margin-bottom:16px;text-align:center;position:relative;overflow:hidden;box-shadow:0 12px 32px rgba(175,55,40,0.30)">
      <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>
      <div style="width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.30);display:flex;align-items:center;justify-content:center;margin:0 auto 14px">
        <span style="font-size:1.375rem;font-weight:900;color:#fff">${AGENT.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</span>
      </div>
      <h2 style="font-size:1.25rem;font-weight:800;color:#fff;margin-bottom:4px;letter-spacing:-0.02em">${AGENT.name}</h2>
      <p style="font-size:var(--font-xs);color:rgba(255,255,255,0.55);font-weight:600">${AGENT.id}</p>
      <div style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.20);border-radius:var(--radius-full);padding:4px 12px;margin-top:10px">
        <span class="material-symbols-outlined" style="font-size:12px;color:rgba(255,255,255,0.70);font-variation-settings:'FILL' 1">location_on</span>
        <span style="font-size:var(--font-xs);color:rgba(255,255,255,0.75);font-weight:600">${AGENT.zone}</span>
      </div>
    </div>

    <!-- Agent Details -->
    <div class="card" style="overflow:hidden;margin-bottom:14px">
      ${pRow('business',     'Provider', 'Electica India Pvt. Ltd.')}
      ${pRow('verified_user','Role',     'Field Onboarding Agent')}
      ${pRow('badge',        'Agent ID', AGENT.id)}
      ${pRow('location_on',  'Zone',     AGENT.zone)}
    </div>

    <!-- System -->
    <div class="section-label">System</div>
    <div class="card" style="overflow:hidden;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border-light);cursor:pointer" id="api-check">
        <div style="width:34px;height:34px;border-radius:10px;background:rgba(99,102,241,0.09);display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:17px;color:#6366f1;font-variation-settings:'FILL' 1">sync</span>
        </div>
        <span style="flex:1;font-size:var(--font-sm);font-weight:600;color:var(--text)">Check API Connection</span>
        <span class="material-symbols-outlined" style="font-size:16px;color:var(--text-soft)">chevron_right</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px">
        <div style="width:34px;height:34px;border-radius:10px;background:rgba(212,101,74,0.09);display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:17px;color:var(--coral);font-variation-settings:'FILL' 1">support_agent</span>
        </div>
        <span style="flex:1;font-size:var(--font-sm);font-weight:600;color:var(--text)">Contact Support</span>
        <span class="material-symbols-outlined" style="font-size:16px;color:var(--text-soft)">chevron_right</span>
      </div>
    </div>

    <p style="text-align:center;font-size:var(--font-xs);color:var(--text-soft);font-weight:500;padding-bottom:8px">
      Electica Provider App v1.0 · Admin on :5173
    </p>
  `;

  document.getElementById('api-check')?.addEventListener('click', async () => {
    try {
      const r = await fetch('${API_BASE}/users?_limit=1');
      if (r.ok) showToast('API connected - json-server on :3001', 'success');
    } catch {
      showToast('Cannot reach API - is json-server running?', 'error');
    }
  });
}

function pRow(iconName, label, value) {
  return `
  <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--border-light)">
    <span class="material-symbols-outlined" style="font-size:18px;color:var(--coral);font-variation-settings:'FILL' 1;flex-shrink:0">${iconName}</span>
    <span style="font-size:var(--font-xs);color:var(--text-soft);font-weight:600;width:72px;flex-shrink:0">${label}</span>
    <span style="font-size:var(--font-sm);font-weight:600;color:var(--text)">${value}</span>
  </div>`;
}

render();
