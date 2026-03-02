// ============================================
// Sidebar Component (Electica Exact)
// ============================================
import { icon, ICONS } from './icons.js';

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-inner">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          ${icon('bolt', '22px')}
        </div>
        <span class="sidebar-brand-name">Electica</span>
      </div>

      <nav class="sidebar-nav">
        <p class="sidebar-section-label">Main Menu</p>
        <a class="sidebar-link" href="#dashboard" data-page="dashboard">
          ${icon(ICONS.dashboard)} Dashboard
        </a>
        <a class="sidebar-link" href="#stations" data-page="stations">
          ${icon(ICONS.stations)} Stations
        </a>
        <a class="sidebar-link" href="#swap" data-page="swap">
          ${icon('battery_charging_full')} Swap Battery
        </a>
        <a class="sidebar-link" href="#inventory" data-page="inventory">
          ${icon(ICONS.batteries)} Batteries
        </a>
        <a class="sidebar-link" href="#revenue" data-page="revenue">
          ${icon(ICONS.revenue)} Revenue
        </a>

        <p class="sidebar-section-label">System</p>
        <a class="sidebar-link" href="#settings" data-page="settings">
          ${icon(ICONS.settings)} Settings
        </a>
        <a class="sidebar-link" href="#support" data-page="support">
          ${icon(ICONS.support)} Support
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">
            <span style="font-size:var(--font-md);font-weight:600;color:#6b7280">AM</span>
          </div>
          <div>
            <div class="sidebar-user-name">Alex Morgan</div>
            <div class="sidebar-user-role">System Admin</div>
          </div>
        </div>
      </div>
    </div>
  `;

  updateActiveLink();
  window.addEventListener('hashchange', updateActiveLink);
}

function updateActiveLink() {
  const hash = window.location.hash || '#dashboard';
  const page = hash.split('/')[0].replace('#', '');
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const linkPage = link.getAttribute('data-page');
    link.classList.toggle('active', linkPage === page);
  });
}
