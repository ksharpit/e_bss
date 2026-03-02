// ============================================
// Stations List Page (Electica)
// ============================================
import { mockStations } from '../data/mockData.js';
import { createStationCard } from '../components/stationCard.js';

export function renderStations(container) {
  const onlineCount = mockStations.filter(s => s.status === 'online').length;
  const maintenanceCount = mockStations.filter(s => s.status === 'maintenance').length;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Swapping Stations</h1>
        <p class="page-desc">${mockStations.length} stations · ${onlineCount} operational</p>
      </div>
      <div class="filter-bar" id="station-filters">
        <button class="filter-chip active" data-filter="all">All (${mockStations.length})</button>
        <button class="filter-chip" data-filter="online">Operational (${onlineCount})</button>
        <button class="filter-chip" data-filter="maintenance">Maintenance (${maintenanceCount})</button>
      </div>
    </div>

    <div class="station-grid" id="station-grid">
      ${mockStations.map(s => createStationCard(s)).join('')}
    </div>
  `;

  // Filter logic
  document.getElementById('station-filters').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const filter = chip.dataset.filter;

    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const filtered = filter === 'all' ? mockStations : mockStations.filter(s => s.status === filter);
    document.getElementById('station-grid').innerHTML = filtered.map(s => createStationCard(s)).join('');
  });
}
