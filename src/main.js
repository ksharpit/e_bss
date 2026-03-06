// ============================================
// BSS Dashboard — Main Entry Point
// ============================================

// ─── Styles ───
import './styles/variables.css';
import './styles/reset.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/charts.css';
import './styles/pages.css';

// ─── Components ───
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';

// ─── Pages ───
import { renderDashboard } from './pages/dashboard.js';
import { renderStationDetail } from './pages/stationDetail.js';
import { renderStations } from './pages/stations.js';
import { renderRevenue } from './pages/revenue.js';
import { renderInventory } from './pages/inventory.js';
import { renderBatteryDetail } from './pages/batteryDetail.js';
import { renderSwapBattery } from './pages/swapBattery.js';
import { renderSwapConfirmation } from './pages/swapConfirmation.js';
import { renderSettings } from './pages/settings.js';
import { renderSupport } from './pages/support.js';
import { renderUsers } from './pages/users.js';
import { renderUserDetail } from './pages/userDetail.js';

// ─── Router ───
import { registerRoute, initRouter } from './utils/router.js';

// ─── Services ───
import { startChargingSimulator } from './utils/chargingSimulator.js';

// ─── Initialize App ───
function init() {
  const mainContent = document.getElementById('main-content');

  // Render shell components
  renderSidebar();
  renderHeader();

  // Register routes (pass container to each page renderer)
  registerRoute('#dashboard', () => renderDashboard(mainContent));
  registerRoute('#stations', () => renderStations(mainContent));
  registerRoute('#station', (stationId) => renderStationDetail(mainContent, stationId));
  registerRoute('#revenue', () => renderRevenue(mainContent));
  registerRoute('#inventory', () => renderInventory(mainContent));
  registerRoute('#battery-detail', (batteryId) => renderBatteryDetail(mainContent, batteryId));
  registerRoute('#swap', () => renderSwapBattery(mainContent));
  registerRoute('#swap-confirm', () => renderSwapConfirmation(mainContent));
  registerRoute('#settings', () => renderSettings(mainContent));
  registerRoute('#support', () => renderSupport(mainContent));
  registerRoute('#users', () => renderUsers(mainContent));
  registerRoute('#user-detail', (userId) => renderUserDetail(mainContent, userId));

  // Start router
  initRouter('#dashboard');

  // Start background charging simulation
  startChargingSimulator();
}

// Boot when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
