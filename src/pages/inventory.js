// ============================================
// Battery Inventory Page (Electica)
// ============================================
import { mockBatteries } from '../data/mockData.js';
import { renderBatteryTable } from '../components/batteryTable.js';
import { createMetricCard } from '../components/kpiCard.js';
import { icon, ICONS } from '../components/icons.js';

export function renderInventory(container) {
  const inUse = mockBatteries.filter(b => b.status === 'in-use').length;
  const charging = mockBatteries.filter(b => b.status === 'charging').length;
  const available = mockBatteries.filter(b => b.status === 'available').length;
  const retired = mockBatteries.filter(b => b.status === 'retired').length;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Battery Inventory</h1>
        <p class="page-desc">Track and manage all batteries across stations</p>
      </div>
      <button class="btn btn-outline">${icon(ICONS.download)} Export CSV</button>
    </div>

    <!-- Summary Metric Cards (5-col) -->
    <div class="metric-grid" style="grid-template-columns:repeat(5,1fr)">
      ${createMetricCard({ iconName: 'inventory_2', value: mockBatteries.length, label: 'Total Batteries', trend: 'All', trendType: 'neutral' })}
      ${createMetricCard({ iconName: 'directions_bike', value: inUse, label: 'In Use', trend: inUse + ' active', trendType: 'up' })}
      ${createMetricCard({ iconName: 'battery_charging_full', value: charging, label: 'Charging', trend: 'Active', trendType: 'optimal' })}
      ${createMetricCard({ iconName: 'battery_full', value: available, label: 'Available', trend: 'Ready', trendType: 'up' })}
      ${createMetricCard({ iconName: 'battery_alert', value: retired, label: 'Retired', trend: retired + ' units', trendType: 'down' })}
    </div>

    <!-- Search + Filters -->
    <div class="inventory-controls">
      <div class="inventory-search">
        ${icon(ICONS.search, '18px')}
        <input type="text" id="battery-search" placeholder="Search by Battery ID, Station..." />
      </div>
      <div class="filter-bar" id="battery-filters">
        <button class="filter-chip active" data-filter="all">All (${mockBatteries.length})</button>
        <button class="filter-chip" data-filter="in-use">In Use (${inUse})</button>
        <button class="filter-chip" data-filter="charging">Charging (${charging})</button>
        <button class="filter-chip" data-filter="available">Available (${available})</button>
        <button class="filter-chip" data-filter="retired">Retired (${retired})</button>
      </div>
    </div>

    <!-- Battery Table -->
    <div class="card" style="overflow:hidden" id="battery-table-card">
      ${renderBatteryTable(mockBatteries)}
    </div>
  `;

  // Filtering
  let currentFilter = 'all';
  let currentSearch = '';

  function updateTable() {
    const cardEl = document.getElementById('battery-table-card');
    cardEl.innerHTML = renderBatteryTable(mockBatteries, { status: currentFilter, search: currentSearch });
  }

  document.getElementById('battery-filters').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    currentFilter = chip.dataset.filter;
    document.querySelectorAll('#battery-filters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    updateTable();
  });

  document.getElementById('battery-search').addEventListener('input', e => {
    currentSearch = e.target.value;
    updateTable();
  });
}
