// ============================================
// Station Card Component (Electica)
// ============================================
import { icon, ICONS } from './icons.js';
import { formatCurrency } from '../utils/helpers.js';

export function createStationCard(station) {
  const statusClass = station.status === 'online' ? 'operational' : station.status;

  return `
    <div class="station-card" onclick="location.hash='#station/${station.id}'">
      <div class="station-card-header">
        <div>
          <span class="station-id">${station.id}</span>
          <h3 class="station-name" style="margin-top:8px">${station.name}</h3>
          <div class="station-location">
            ${icon(ICONS.location, '14px')}
            ${station.location}
          </div>
        </div>
        <span class="badge ${statusClass}">
          <span class="badge-dot"></span>
          ${station.status === 'online' ? 'Operational' : station.status}
        </span>
      </div>
      <div class="station-stats">
        <div class="station-stat">
          <div class="station-stat-value">${station.totalPods}</div>
          <div class="station-stat-label">Pods</div>
        </div>
        <div class="station-stat">
          <div class="station-stat-value">${station.swapsToday}</div>
          <div class="station-stat-label">Swaps Today</div>
        </div>
        <div class="station-stat">
          <div class="station-stat-value">${formatCurrency(station.revenueToday)}</div>
          <div class="station-stat-label">Revenue Today</div>
        </div>
      </div>
    </div>
  `;
}
