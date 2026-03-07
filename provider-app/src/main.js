// ============================================
// Provider App - Entry Point (Premium Redesign)
// ============================================
import './style.css';
import { renderHome }           from './pages/home.js';
import { renderRegister }       from './pages/register.js';
import { renderConfirmation }   from './pages/confirmation.js';
import { renderCustomerDetail } from './pages/customerDetail.js';
import { renderResubmit }       from './pages/resubmit.js';
import { renderSupport }        from './pages/support.js';
import { renderLogin }          from './pages/login.js';
import { showToast }            from './utils/toast.js';
import { getToken, getAgent, clearToken, apiFetch } from './utils/apiFetch.js';

let AGENT = null;
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
      <div class="app-bar-avatar" id="app-bar-avatar" style="cursor:pointer">${AGENT.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
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
      <button class="nav-item ${currentTab === 'support' ? 'active' : ''}" data-tab="support">
        <span class="material-symbols-outlined">support_agent</span>
        Support
      </button>
    </nav>` : ''}
  `;

  document.getElementById('app-bar-avatar')?.addEventListener('click', () => {
    overlay = null; currentTab = 'support'; render();
  });

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
  } else if (currentTab === 'support') {
    renderSupport(content, AGENT);
  }
}

// --- Auth gate ---
function boot() {
  const token = getToken();
  const agent = getAgent();

  if (!token || !agent) {
    app.innerHTML = '<div class="page" id="page-content"></div>';
    const content = document.getElementById('page-content');
    renderLogin(content, (agentData) => {
      AGENT = agentData;
      render();
    });
  } else {
    AGENT = agent;
    render();
  }
}

boot();
