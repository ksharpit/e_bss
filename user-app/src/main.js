// ============================================
// Electica User App - Entry Point
// ============================================
import './style.css';
import { renderHome }     from './pages/home.js';
import { renderHistory }  from './pages/history.js';
import { renderStations } from './pages/stations.js';
import { renderProfile }  from './pages/profile.js';
import { renderAuth }     from './pages/auth.js';
import { renderScan }     from './pages/swap.js';
import { showToast }      from './utils/toast.js';
import { API_BASE }       from './config.js';

const AUTH_KEY  = 'electica_auth';
let currentTab  = 'home';
let USER_ID     = null;

const app = document.getElementById('app');

const NAV_LEFT = [
  { id: 'home',    icon: 'home',         label: 'Home'    },
  { id: 'history', icon: 'receipt_long', label: 'History' },
];
const NAV_RIGHT = [
  { id: 'stations', icon: 'ev_station',     label: 'Stations' },
  { id: 'profile',  icon: 'account_circle', label: 'Profile'  },
];

// ── Auth helpers ──────────────────────────────────────────
function getAuth()  { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } }
function saveAuth(data) { localStorage.setItem(AUTH_KEY, JSON.stringify(data)); }
function clearAuth() { localStorage.removeItem(AUTH_KEY); }

// ── Splash screen ─────────────────────────────────────────
function showSplash(onDone) {
  const splash = document.createElement('div');
  splash.className = 'splash-screen';
  splash.innerHTML = `
    <div class="splash-glow"></div>
    <div class="splash-logo">
      <span class="material-symbols-outlined">bolt</span>
    </div>
    <div class="splash-brand-text">Electica</div>
    <div class="splash-tagline-text">Power your ride, anytime</div>
    <div class="splash-loader">
      <div class="splash-dot"></div>
      <div class="splash-dot"></div>
      <div class="splash-dot"></div>
    </div>
  `;
  document.body.appendChild(splash);

  setTimeout(() => {
    splash.classList.add('exit');
    setTimeout(() => { splash.remove(); onDone(); }, 450);
  }, 2100);
}

// ── Auth screen ───────────────────────────────────────────
function showAuthScreen() {
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'min-height:100dvh;display:flex;flex-direction:column';
  app.appendChild(wrap);

  renderAuth(
    wrap,
    // onSuccess - verified user
    (userId, name) => {
      saveAuth({ userId, name, kycStatus: 'verified' });
      USER_ID    = userId;
      currentTab = 'home';
      renderMainApp();
    },
    // onPending - new or pending user
    (userId, name) => {
      saveAuth({ userId, name, kycStatus: 'pending' });
      USER_ID = userId;
      renderPendingWrapper(userId);
    },
  );
}

// ── Logout ────────────────────────────────────────────────
function logout() {
  clearAuth();
  USER_ID    = null;
  currentTab = 'home';
  showAuthScreen();
}

// ── Pending Approval Screen ───────────────────────────────
function renderPendingWrapper(userId) {
  app.innerHTML = `
    <div class="pending-screen">
      <div class="pending-glow"></div>

      <div class="pending-icon-wrap">
        <span class="material-symbols-outlined">pending_actions</span>
      </div>

      <h2 class="pending-title">Application Under Review</h2>
      <p class="pending-sub">
        Your Electica account is being reviewed by your provider.
        You'll be notified once approved.
      </p>

      <div class="pending-steps">
        <div class="pending-step">
          <div class="pending-step-icon done">
            <span class="material-symbols-outlined">check</span>
          </div>
          <span class="pending-step-text done-text">Account created successfully</span>
        </div>
        <div class="pending-step">
          <div class="pending-step-icon done">
            <span class="material-symbols-outlined">check</span>
          </div>
          <span class="pending-step-text done-text">KYC documents submitted</span>
        </div>
        <div class="pending-step">
          <div class="pending-step-icon wait">
            <span class="material-symbols-outlined">progress_activity</span>
          </div>
          <span class="pending-step-text wait-text">Provider review in progress</span>
        </div>
        <div class="pending-step">
          <div class="pending-step-icon todo">
            <span class="material-symbols-outlined">currency_rupee</span>
          </div>
          <span class="pending-step-text">Security deposit collection (INR 3,000)</span>
        </div>
        <div class="pending-step">
          <div class="pending-step-icon todo">
            <span class="material-symbols-outlined">battery_full</span>
          </div>
          <span class="pending-step-text">Battery allocation - app activated</span>
        </div>
      </div>

      <button class="pending-refresh-btn" id="pending-refresh">
        <span class="material-symbols-outlined">refresh</span>
        Check Approval Status
      </button>

      <button class="pending-logout-btn" id="pending-logout">
        Sign out
      </button>
    </div>
  `;

  document.getElementById('pending-refresh')?.addEventListener('click', async () => {
    const btn = document.getElementById('pending-refresh');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Checking...`;

    try {
      const user = await fetch(`${API_BASE}/users/${userId}`).then(r => r.ok ? r.json() : null);
      if (!user) throw new Error('User not found');

      if (user.kycStatus === 'verified') {
        saveAuth({ userId, name: user.name, kycStatus: 'verified' });
        showToast('Account approved! Welcome to Electica.', 'success');
        setTimeout(() => { currentTab = 'home'; renderMainApp(); }, 800);
      } else {
        showToast('Still under review - please check back later', 'info');
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined">refresh</span> Check Approval Status`;
      }
    } catch {
      showToast('Cannot reach server', 'error');
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">refresh</span> Check Approval Status`;
    }
  });

  document.getElementById('pending-logout')?.addEventListener('click', () => {
    if (window.confirm('Sign out of Electica?')) logout();
  });
}

// ── Main app shell ────────────────────────────────────────
function renderMainApp() {
  app.innerHTML = `
    <div class="app-bar">
      <div class="app-bar-brand">
        <div class="app-bar-icon">
          <span class="material-symbols-outlined">bolt</span>
        </div>
        <div>
          <div class="app-bar-title">Electica</div>
          <div class="app-bar-subtitle">Battery Swap Network</div>
        </div>
      </div>
      <div class="app-bar-avatar" id="nav-avatar" style="cursor:pointer;position:relative"><span class="material-symbols-outlined" style="font-size:18px;color:#fff;font-variation-settings:'FILL' 1">help</span></div>
    </div>

    <!-- Help & Support Menu -->
    <div id="avatar-menu" style="display:none;position:fixed;top:62px;right:max(16px,calc(50% - 224px));width:250px;background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.45);z-index:999;overflow:hidden;animation:fadeUp .2s ease">
      <div style="padding:14px 16px 10px;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="material-symbols-outlined" style="font-size:18px;color:var(--gold);font-variation-settings:'FILL' 1">help</span>
          <span style="font-size:var(--font-md);font-weight:800;color:var(--text)">Help & Support</span>
        </div>
        <p style="font-size:var(--font-xs);color:var(--text-soft);margin-top:4px">We're here to help you 24/7</p>
      </div>
      <div style="padding:6px">
        <button class="avatar-menu-item" id="help-raise-ticket">
          <span class="material-symbols-outlined" style="font-size:18px;color:var(--gold)">confirmation_number</span>
          <div style="text-align:left"><span style="display:block">Raise a Ticket</span><span style="font-size:var(--font-xs);color:var(--text-soft);font-weight:500">Report an issue or request</span></div>
        </button>
        <button class="avatar-menu-item" id="help-raise-query">
          <span class="material-symbols-outlined" style="font-size:18px;color:var(--primary)">chat_bubble</span>
          <div style="text-align:left"><span style="display:block">Raise a Query</span><span style="font-size:var(--font-xs);color:var(--text-soft);font-weight:500">Ask about swaps or billing</span></div>
        </button>
        <button class="avatar-menu-item" id="help-call-support">
          <span class="material-symbols-outlined" style="font-size:18px;color:var(--indigo)">call</span>
          <div style="text-align:left"><span style="display:block">Call Support</span><span style="font-size:var(--font-xs);color:var(--text-soft);font-weight:500">+91 1800-200-3001</span></div>
        </button>
        <button class="avatar-menu-item" id="help-email">
          <span class="material-symbols-outlined" style="font-size:18px;color:#D4654A">mail</span>
          <div style="text-align:left"><span style="display:block">Email Us</span><span style="font-size:var(--font-xs);color:var(--text-soft);font-weight:500">support@electica.in</span></div>
        </button>
        <div style="height:1px;background:var(--border);margin:4px 8px"></div>
        <button class="avatar-menu-item" id="help-faq">
          <span class="material-symbols-outlined" style="font-size:18px;color:var(--text-soft)">menu_book</span>
          <span>FAQs & Help Center</span>
        </button>
      </div>
    </div>

    <!-- Bottom Sheet Overlay -->
    <div id="help-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;transition:opacity .2s" onclick="this.style.display='none';document.getElementById('help-sheet').style.transform='translateY(100%)'"></div>
    <div id="help-sheet" style="position:fixed;bottom:0;left:50%;transform:translate(-50%,100%);width:100%;max-width:480px;max-height:85vh;background:var(--card);border-radius:20px 20px 0 0;z-index:1001;transition:transform .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;overflow:hidden">
      <div style="padding:12px 0 8px;display:flex;justify-content:center"><div style="width:36px;height:4px;border-radius:4px;background:var(--border)"></div></div>
      <div id="help-sheet-content" style="flex:1;overflow-y:auto;padding:0 20px 24px"></div>
    </div>

    <div class="page" id="page-content"></div>

    <nav class="bottom-nav">
      ${NAV_LEFT.map(n => `
        <button class="nav-item ${currentTab === n.id ? 'active' : ''}" data-tab="${n.id}">
          <span class="material-symbols-outlined">${n.icon}</span>
          ${n.label}
        </button>`).join('')}

      <div class="nav-scan-wrap" id="nav-scan-wrap">
        <button class="nav-scan-btn" id="nav-scan-btn" title="Scan QR to Swap">
          <span class="material-symbols-outlined">qr_code_scanner</span>
        </button>
        <span class="nav-scan-label${currentTab === 'scan' ? ' active' : ''}">Scan</span>
      </div>

      ${NAV_RIGHT.map(n => `
        <button class="nav-item ${currentTab === n.id ? 'active' : ''}" data-tab="${n.id}">
          <span class="material-symbols-outlined">${n.icon}</span>
          ${n.label}
        </button>`).join('')}
    </nav>
  `;

  // Wire nav tabs
  app.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      renderMainApp();
    });
  });

  // Wire center scan button
  document.getElementById('nav-scan-wrap')?.addEventListener('click', () => {
    currentTab = 'scan';
    renderMainApp();
  });

  renderPage();

  // Wire help & support menu
  const avatarBtn = document.getElementById('nav-avatar');
  const avatarMenu = document.getElementById('avatar-menu');
  const helpOverlay = document.getElementById('help-overlay');
  const helpSheet = document.getElementById('help-sheet');
  const helpSheetContent = document.getElementById('help-sheet-content');

  function openSheet() { helpOverlay.style.display = 'block'; helpSheet.style.transform = 'translate(-50%,0)'; }
  function closeSheet() { helpSheet.style.transform = 'translate(-50%,100%)'; setTimeout(() => { helpOverlay.style.display = 'none'; }, 300); }

  if (avatarBtn && avatarMenu) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      avatarMenu.style.display = avatarMenu.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', (e) => {
      if (!avatarMenu.contains(e.target) && e.target !== avatarBtn) avatarMenu.style.display = 'none';
    });

    // ── Raise Ticket ──
    document.getElementById('help-raise-ticket')?.addEventListener('click', () => {
      avatarMenu.style.display = 'none';
      helpSheetContent.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:var(--gold-light);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="font-size:20px;color:var(--gold);font-variation-settings:'FILL' 1">confirmation_number</span>
          </div>
          <div>
            <h3 style="font-size:var(--font-lg);font-weight:800;color:var(--text)">Raise a Ticket</h3>
            <p style="font-size:var(--font-xs);color:var(--text-soft)">Our team will respond within 2 hours</p>
          </div>
        </div>
        <label style="font-size:var(--font-xs);font-weight:700;color:var(--text-soft);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Category</label>
        <select id="ticket-category" style="width:100%;padding:12px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:var(--font-sm);font-weight:600;margin-bottom:14px;outline:none;appearance:none">
          <option value="swap_issue">Swap Issue</option>
          <option value="battery_problem">Battery Problem</option>
          <option value="billing">Billing & Payment</option>
          <option value="station_issue">Station Issue</option>
          <option value="app_bug">App Bug</option>
          <option value="other">Other</option>
        </select>
        <label style="font-size:var(--font-xs);font-weight:700;color:var(--text-soft);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Describe your issue</label>
        <textarea id="ticket-desc" rows="4" placeholder="Tell us what happened..." style="width:100%;padding:12px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:var(--font-sm);font-family:inherit;resize:none;outline:none;box-sizing:border-box"></textarea>
        <button id="ticket-submit" style="width:100%;margin-top:14px;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#D4B878,#A8874A);color:#fff;font-size:var(--font-md);font-weight:800;cursor:pointer;letter-spacing:-0.01em">Submit Ticket</button>
      `;
      openSheet();
      document.getElementById('ticket-submit')?.addEventListener('click', async () => {
        const desc = document.getElementById('ticket-desc')?.value?.trim();
        const cat = document.getElementById('ticket-category')?.value;
        if (!desc) { showToast('Please describe your issue', 'error'); return; }
        try {
          await fetch(`${API_BASE}/tickets`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'TKT-' + Date.now(), userId: USER_ID, type: 'ticket', category: cat, description: desc, status: 'open', timestamp: new Date().toISOString() })
          });
          closeSheet();
          showToast('Ticket submitted — our team will reach out within 2 hours', 'success');
        } catch { showToast('Failed to submit ticket', 'error'); }
      });
    });

    // ── Raise Query ──
    document.getElementById('help-raise-query')?.addEventListener('click', () => {
      avatarMenu.style.display = 'none';
      helpSheetContent.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:var(--primary-light);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="font-size:20px;color:var(--primary);font-variation-settings:'FILL' 1">chat_bubble</span>
          </div>
          <div>
            <h3 style="font-size:var(--font-lg);font-weight:800;color:var(--text)">Raise a Query</h3>
            <p style="font-size:var(--font-xs);color:var(--text-soft)">Ask us anything about swaps, billing or your account</p>
          </div>
        </div>
        <label style="font-size:var(--font-xs);font-weight:700;color:var(--text-soft);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Topic</label>
        <select id="query-topic" style="width:100%;padding:12px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:var(--font-sm);font-weight:600;margin-bottom:14px;outline:none;appearance:none">
          <option value="how_swap_works">How does battery swap work?</option>
          <option value="pricing">Swap pricing & charges</option>
          <option value="deposit_refund">Security deposit refund</option>
          <option value="battery_health">Battery health & range</option>
          <option value="station_availability">Station availability</option>
          <option value="account">Account & KYC</option>
          <option value="other">Other question</option>
        </select>
        <label style="font-size:var(--font-xs);font-weight:700;color:var(--text-soft);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Your question</label>
        <textarea id="query-desc" rows="3" placeholder="Type your question here..." style="width:100%;padding:12px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:var(--font-sm);font-family:inherit;resize:none;outline:none;box-sizing:border-box"></textarea>
        <button id="query-submit" style="width:100%;margin-top:14px;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--primary),#1ab88a);color:#fff;font-size:var(--font-md);font-weight:800;cursor:pointer;letter-spacing:-0.01em">Submit Query</button>
      `;
      openSheet();
      document.getElementById('query-submit')?.addEventListener('click', async () => {
        const desc = document.getElementById('query-desc')?.value?.trim();
        const topic = document.getElementById('query-topic')?.value;
        if (!desc) { showToast('Please type your question', 'error'); return; }
        try {
          await fetch(`${API_BASE}/tickets`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'QRY-' + Date.now(), userId: USER_ID, type: 'query', category: topic, description: desc, status: 'open', timestamp: new Date().toISOString() })
          });
          closeSheet();
          showToast('Query submitted — you will receive a response via SMS shortly', 'success');
        } catch { showToast('Failed to submit query', 'error'); }
      });
    });

    // ── Call Support ──
    document.getElementById('help-call-support')?.addEventListener('click', () => {
      avatarMenu.style.display = 'none';
      window.location.href = 'tel:+911800200301';
    });

    // ── Email Us ──
    document.getElementById('help-email')?.addEventListener('click', () => {
      avatarMenu.style.display = 'none';
      window.location.href = 'mailto:support@electica.in?subject=' + encodeURIComponent('Support Request — Customer ' + USER_ID) + '&body=' + encodeURIComponent('Hi Electica Support,\n\nCustomer ID: ' + USER_ID + '\n\nPlease describe your issue below:\n\n');
    });

    // ── FAQs ──
    document.getElementById('help-faq')?.addEventListener('click', () => {
      avatarMenu.style.display = 'none';
      const faqs = [
        { q: 'How does a battery swap work?', a: 'Visit any Electica station, scan the QR code, deposit your discharged battery in an empty slot, and collect a fully charged battery. The whole process takes under 60 seconds.' },
        { q: 'How much does a swap cost?', a: 'Each battery swap costs ₹65. The amount is deducted from your wallet or charged to your linked payment method instantly.' },
        { q: 'What is the security deposit?', a: 'A one-time refundable deposit of ₹3,000 is collected during onboarding. This covers the battery asset and is fully refunded when you return the battery and close your account.' },
        { q: 'How do I check my battery health?', a: 'Go to your Profile tab and scroll to the Battery section. You can see your current charge level (SOC), battery health percentage, and cycle count.' },
        { q: 'What range can I expect on a full charge?', a: 'A fully charged battery (100%) provides approximately 75 km of range. Actual range varies based on riding speed, terrain, and vehicle condition.' },
        { q: 'What if a station has no available batteries?', a: 'The Stations tab shows real-time availability. If your nearest station is out of stock, the app will show nearby alternatives with available batteries.' },
        { q: 'How do I get a refund for a failed swap?', a: 'If a swap fails or you are charged incorrectly, raise a ticket from the Help menu. Refunds are processed within 24-48 hours to your original payment method.' },
        { q: 'Can I use any Electica station?', a: 'Yes! Your Electica account works across all stations in our network. Simply scan the QR code at any station to swap.' },
      ];
      helpSheetContent.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:var(--surface-2);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="font-size:20px;color:var(--text-mid);font-variation-settings:'FILL' 1">menu_book</span>
          </div>
          <div>
            <h3 style="font-size:var(--font-lg);font-weight:800;color:var(--text)">FAQs & Help Center</h3>
            <p style="font-size:var(--font-xs);color:var(--text-soft)">${faqs.length} frequently asked questions</p>
          </div>
        </div>
        ${faqs.map((f, i) => `
          <div class="faq-item" style="border:1px solid var(--border);border-radius:12px;margin-bottom:8px;overflow:hidden">
            <button class="faq-toggle" data-i="${i}" style="width:100%;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;background:transparent;border:none;cursor:pointer;text-align:left">
              <span style="font-size:var(--font-sm);font-weight:700;color:var(--text);flex:1;padding-right:10px">${f.q}</span>
              <span class="material-symbols-outlined faq-chevron" style="font-size:16px;color:var(--text-soft);transition:transform .2s">expand_more</span>
            </button>
            <div class="faq-answer" style="max-height:0;overflow:hidden;transition:max-height .3s ease">
              <div style="padding:0 16px 14px;font-size:var(--font-sm);color:var(--text-soft);line-height:1.6">${f.a}</div>
            </div>
          </div>
        `).join('')}
      `;
      openSheet();
      helpSheetContent.querySelectorAll('.faq-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const answer = btn.nextElementSibling;
          const chevron = btn.querySelector('.faq-chevron');
          const isOpen = answer.style.maxHeight !== '0px' && answer.style.maxHeight !== '';
          helpSheetContent.querySelectorAll('.faq-answer').forEach(a => a.style.maxHeight = '0px');
          helpSheetContent.querySelectorAll('.faq-chevron').forEach(c => c.style.transform = 'rotate(0deg)');
          if (!isOpen) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
            chevron.style.transform = 'rotate(180deg)';
          }
        });
      });
    });
  }
}

function setTab(tab) { currentTab = tab; renderMainApp(); }

function renderPage() {
  const content = document.getElementById('page-content');
  if (!content) return;

  if      (currentTab === 'home')     renderHome(content, USER_ID, setTab);
  else if (currentTab === 'history')  renderHistory(content, USER_ID);
  else if (currentTab === 'stations') renderStations(content, USER_ID);
  else if (currentTab === 'scan')     renderScan(content, USER_ID, setTab);
  else if (currentTab === 'profile')  renderProfile(content, USER_ID, logout);
}

// ── Bootstrap ─────────────────────────────────────────────
showSplash(async () => {
  const auth = getAuth();
  if (auth?.userId) {
    USER_ID = auth.userId;
    if (auth.kycStatus === 'pending') {
      renderPendingWrapper(auth.userId);
    } else {
      renderMainApp();
    }
  } else {
    showAuthScreen();
  }
});
