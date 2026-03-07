// ============================================
// Sidebar Component (Electica Exact)
// ============================================
import { icon, ICONS } from './icons.js';
import { clearToken, getAdminUser } from '../utils/apiFetch.js';

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-inner">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          ${icon('bolt', '22px')}
        </div>
        <span class="sidebar-brand-name">Electica</span>
        <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" title="Collapse sidebar"
          style="margin-left:auto;width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0"
          onmouseover="this.style.background='rgba(255,255,255,0.15)';this.style.color='rgba(255,255,255,0.9)'"
          onmouseout="this.style.background='rgba(255,255,255,0.08)';this.style.color='rgba(255,255,255,0.5)'">
          <span class="material-symbols-outlined" style="font-size:18px" id="sidebar-collapse-icon">menu_open</span>
        </button>
      </div>

      <nav class="sidebar-nav">
        <p class="sidebar-section-label">Main Menu</p>
        <a class="sidebar-link" href="#dashboard" data-page="dashboard" data-tooltip="Dashboard">
          ${icon(ICONS.dashboard)} <span class="sidebar-link-text">Dashboard</span>
        </a>
        <a class="sidebar-link" href="#stations" data-page="stations" data-tooltip="Stations">
          ${icon(ICONS.stations)} <span class="sidebar-link-text">Stations</span>
        </a>
        <a class="sidebar-link" href="#swap" data-page="swap" data-tooltip="Swap Battery">
          ${icon('battery_charging_full')} <span class="sidebar-link-text">Swap Battery</span>
        </a>
        <a class="sidebar-link" href="#inventory" data-page="inventory" data-tooltip="Batteries">
          ${icon(ICONS.batteries)} <span class="sidebar-link-text">Batteries</span>
        </a>
        <a class="sidebar-link" href="#revenue" data-page="revenue" data-tooltip="Revenue">
          ${icon(ICONS.revenue)} <span class="sidebar-link-text">Revenue</span>
        </a>
        <a class="sidebar-link" href="#users" data-page="users" data-tooltip="Users">
          ${icon('group')} <span class="sidebar-link-text">Users</span>
        </a>

        <p class="sidebar-section-label">System</p>
        <a class="sidebar-link" href="#settings" data-page="settings" data-tooltip="Settings">
          ${icon(ICONS.settings)} <span class="sidebar-link-text">Settings</span>
        </a>
        <a class="sidebar-link" href="#support" data-page="support" data-tooltip="Support">
          ${icon(ICONS.support)} <span class="sidebar-link-text">Support</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">
            <span style="font-size:var(--font-md);font-weight:600;color:#6b7280">${(() => { const u = getAdminUser(); return u ? u.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'SA'; })()}</span>
          </div>
          <div class="sidebar-user-info-text">
            <div class="sidebar-user-name">${getAdminUser()?.name || 'System Admin'}</div>
            <div class="sidebar-user-role">Admin</div>
          </div>
          <button id="sidebar-logout-btn" title="Logout"
            style="margin-left:auto;width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0"
            onmouseover="this.style.background='rgba(239,68,68,0.2)';this.style.color='#ef4444'"
            onmouseout="this.style.background='rgba(255,255,255,0.08)';this.style.color='rgba(255,255,255,0.5)'">
            <span class="material-symbols-outlined" style="font-size:18px">logout</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Sidebar collapse toggle
  document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => {
    const app = document.getElementById('app');
    const isCollapsed = app.classList.toggle('sidebar-collapsed');
    const collapseIcon = document.getElementById('sidebar-collapse-icon');
    if (collapseIcon) collapseIcon.textContent = isCollapsed ? 'menu' : 'menu_open';
  });

  // Logout
  document.getElementById('sidebar-logout-btn')?.addEventListener('click', () => {
    clearToken();
    window.location.reload();
  });

  updateActiveLink();
  window.addEventListener('hashchange', updateActiveLink);
}

function updateActiveLink() {
  const hash = window.location.hash || '#dashboard';
  const page = hash.split('/')[0].replace('#', '');
  // Map sub-pages to their parent sidebar entry
  const pageMap = { 'user-detail': 'users', 'station': 'stations', 'battery-detail': 'inventory', 'swap-confirm': 'swap' };
  const activePage = pageMap[page] || page;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const linkPage = link.getAttribute('data-page');
    link.classList.toggle('active', linkPage === activePage);
  });
}
