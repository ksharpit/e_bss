// ============================================
// Battery Table Component (Electica)
// ============================================
import { icon, ICONS } from './icons.js';
import { socColor } from '../utils/helpers.js';

export function renderBatteryTable(batteries, filters = {}) {
  let filtered = [...batteries];

  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(b => b.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(b =>
      b.id.toLowerCase().includes(q) ||
      b.stationId.toLowerCase().includes(q) ||
      b.podId.toLowerCase().includes(q)
    );
  }

  const rows = filtered.map(b => `
    <tr style="cursor:pointer;transition:background 0.15s" onclick="location.hash='#battery-detail/${b.id}'" onmouseover="this.style.background='rgba(37,99,235,0.02)'" onmouseout="this.style.background='transparent'">
      <td class="bold">${b.id}</td>
      <td>${b.stationId}</td>
      <td>${b.podId}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="soc-bar"><div class="soc-fill" style="width:${b.soc}%;background:${socColor(b.soc)}"></div></div>
          <span style="font-weight:600">${b.soc}%</span>
        </div>
      </td>
      <td style="color:${b.health >= 90 ? 'var(--color-success)' : b.health >= 70 ? 'var(--color-warning)' : 'var(--color-danger)'};font-weight:700">${b.health}%</td>
      <td>${b.swapCount.toLocaleString()}</td>
      <td>
        <span class="badge ${b.status === 'in-use' ? 'online' : b.status === 'charging' ? 'charging' : b.status === 'available' ? 'available' : b.status === 'retired' ? 'fault' : 'empty'}">
          <span class="badge-dot"></span>
          ${b.status.replace('-', ' ')}
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Battery ID</th>
            <th>Station</th>
            <th>Pod</th>
            <th>SOC</th>
            <th>Health</th>
            <th>Swaps</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
