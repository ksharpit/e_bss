// ============================================
// Header Component (Electica)
// ============================================
import { icon, ICONS } from './icons.js';
import { showToast } from '../utils/toast.js';

const pageTitles = {
  dashboard: { title: 'Global Operations', breadcrumb: '' },
  stations: { title: 'Stations', breadcrumb: '' },
  station: { title: 'Station Detail', breadcrumb: '' },
  revenue: { title: 'Revenue', breadcrumb: '' },
  inventory: { title: 'Inventory', breadcrumb: '' },
  'battery-detail': { title: 'Battery Analytics', breadcrumb: '' },
  swap: { title: 'Initiate Swap', breadcrumb: '' },
  'swap-confirm': { title: 'Swap Confirmation', breadcrumb: '' },
  settings: { title: 'Settings', breadcrumb: '' },
  support: { title: 'Help & Support', breadcrumb: '' },
};

export function renderHeader() {
  const header = document.getElementById('header');
  header.innerHTML = `
    <div class="header-left">
      <h2 class="header-title" id="header-page-title">Global Operations</h2>
      <div class="header-divider"></div>
      <div class="header-search">
        ${icon(ICONS.search)}
        <input type="text" placeholder="Search infrastructure..." />
      </div>
    </div>
    <div class="header-right">
      <button class="header-icon-btn" id="header-notifications-btn">
        ${icon(ICONS.notifications, '22px')}
        <span class="header-notification-dot"></span>
      </button>
      <button class="btn-header btn-header-outline" id="header-export-btn">
        ${icon(ICONS.download)} Export
      </button>
      <button class="btn-header btn-header-primary" id="header-new-station-btn">
        ${icon('add')} New Station
      </button>
    </div>
  `;

  updateHeaderTitle();
  window.addEventListener('hashchange', updateHeaderTitle);

  // Wire header buttons
  document.getElementById('header-export-btn')?.addEventListener('click', () => {
    showToast('Dashboard report exported as PDF', 'success');
  });
  document.getElementById('header-notifications-btn')?.addEventListener('click', () => {
    showToast('3 new alerts: 1 maintenance, 1 cell imbalance, 1 swap anomaly', 'info');
    const dot = document.querySelector('.header-notification-dot');
    if (dot) dot.style.display = 'none';
  });
  document.getElementById('header-new-station-btn')?.addEventListener('click', () => {
    showToast('New station wizard — feature coming soon!', 'info');
  });

  // Header search
  const searchInput = document.querySelector('.header-search input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        const q = searchInput.value.trim().toUpperCase();
        if (q.startsWith('BSS') || q.startsWith('STA')) {
          location.hash = '#station/' + (q.startsWith('BSS') ? q : 'BSS-001');
        } else if (q.startsWith('BAT')) {
          location.hash = '#battery-detail/' + q;
        } else {
          showToast(`Searching for "${searchInput.value.trim()}"...`, 'info');
        }
        searchInput.value = '';
      }
    });
  }
}

function updateHeaderTitle() {
  const hash = window.location.hash || '#dashboard';
  const page = hash.split('/')[0].replace('#', '');
  const config = pageTitles[page] || pageTitles.dashboard;
  const titleEl = document.getElementById('header-page-title');
  if (titleEl) titleEl.textContent = config.title;
}
