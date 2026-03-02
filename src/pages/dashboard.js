// ============================================
// Dashboard Page (Electica Exact)
// Matches global_dashboard_electica_light reference
// ============================================
import { mockStations, mockKPIs, mockRevenueDaily, mockPods } from '../data/mockData.js';
import { createMetricCard } from '../components/kpiCard.js';
import { renderLoadBarChart } from '../components/revenueChart.js';
import { icon } from '../components/icons.js';
import { formatCurrency, formatNumber } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

export function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard Overview</h1>
        <p class="page-desc">Real-time infrastructure health and commercial performance.</p>
      </div>
      <div class="time-tabs">
        <button class="time-tab active">24H</button>
        <button class="time-tab">7D</button>
        <button class="time-tab">30D</button>
      </div>
    </div>

    <!-- 6-Column Metric Grid -->
    <div class="metric-grid">
      ${createMetricCard({ iconName: 'ev_station', value: mockKPIs.totalStations, label: 'Total Stations', trend: '4 online', trendType: 'up' })}
      ${createMetricCard({ iconName: 'battery_charging_full', value: mockKPIs.activeBatteries, label: 'Active Batteries', trend: '87.5%', trendType: 'up' })}
      ${createMetricCard({ iconName: 'swap_horiz', value: mockKPIs.swapsToday, label: 'Swaps Today', trend: '+18.1%', trendType: 'up' })}
      ${createMetricCard({ iconName: 'payments', value: '₹' + formatNumber(mockKPIs.revenueToday), label: 'Revenue Today', trend: '+12.4%', trendType: 'up' })}
      ${createMetricCard({ iconName: 'bolt', value: mockKPIs.totalPods, label: 'Total Pods', sublabel: 'active', trend: 'Online', trendType: 'optimal' })}
      ${createMetricCard({ iconName: 'health_and_safety', value: mockKPIs.avgUptime + '%', label: 'Avg Uptime', trend: 'Optimal', trendType: 'optimal' })}
    </div>

    <!-- Infrastructure Load Analysis + Regional Distribution -->
    <div class="content-sidebar">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Infrastructure Load Analysis</div>
            <div class="card-subtitle">Energy consumption across main grid and renewable backups</div>
          </div>
          <div class="chart-legend">
            <div class="chart-legend-item"><div class="chart-legend-dot" style="background:#0f62fe"></div> Main Grid</div>
            <div class="chart-legend-item"><div class="chart-legend-dot" style="background:#93c5fd"></div> Solar Backup</div>
          </div>
        </div>
        <div class="card-body">
          <div class="chart-container" style="height:260px">
            <canvas id="dashboard-load-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Regional Distribution</div>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:1.5rem">
          ${renderRegion('KORAMANGALA', 35, '#0f62fe')}
          ${renderRegion('WHITEFIELD', 28, '#0f62fe')}
          ${renderRegion('ELECTRONIC CITY', 22, '#0f62fe')}
          ${renderRegion('OTHER AREAS', 15, '#d1d5db')}
          <button style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-md);font-size:var(--font-sm);font-weight:700;color:#525252;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;transition:all var(--transition-fast);background:white" id="view-geography-btn" onmouseover="this.style.borderColor='#0f62fe';this.style.color='#0f62fe'" onmouseout="this.style.borderColor='var(--border-color)';this.style.color='#525252'">
            View Detailed Geography
          </button>
        </div>
      </div>
    </div>

    <!-- Active Station Status Table -->
    <div class="card full-width-section">
      <div class="card-header">
        <div class="card-title">Active Station Status</div>
        <span class="card-link" style="cursor:pointer" onclick="location.hash='#stations'">View All Activity ${icon('arrow_forward', '14px')}</span>
      </div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Station</th>
              <th>Location</th>
              <th>Inventory</th>
              <th>Health</th>
              <th>Status</th>
              <th>Revenue Today</th>
            </tr>
          </thead>
          <tbody>
            ${mockStations.map(s => stationRow(s)).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <footer class="app-footer">
      ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#9ca3af')}
      Electica Enterprise Dashboard © 2024
    </footer>
  `;

  setTimeout(() => renderLoadBarChart('dashboard-load-chart'), 100);

  // Time tabs
  container.querySelectorAll('.time-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.time-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      showToast(`Showing ${tab.textContent} data`, 'info');
    });
  });

  // View Geography
  document.getElementById('view-geography-btn')?.addEventListener('click', () => {
    showToast('Detailed geography view — Bangalore zone breakdown', 'info');
  });
}

function renderRegion(name, pct, color) {
  return `
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:var(--font-sm);font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em">${name}</span>
        <span style="font-size:var(--font-md);font-weight:700;color:#111827">${pct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>
  `;
}

function stationRow(station) {
  const pods = station.totalPods || station.pods;
  const totalSlots = pods + 5;
  const pct = Math.round((pods / totalSlots) * 100);
  const isOnline = station.status === 'online';
  const revenue = station.revenueToday;

  return `
    <tr style="cursor:pointer;transition:background 0.15s" onclick="location.hash='#station/${station.id}'" onmouseover="this.style.background='rgba(37,99,235,0.02)'" onmouseout="this.style.background='transparent'">
      <td class="bold">${station.name}</td>
      <td style="font-weight:500;color:#6b7280">${station.location}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:80px;height:6px;background:#f3f4f6;border-radius:var(--radius-full);overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${pct > 60 ? '#0f62fe' : '#f59e0b'};border-radius:var(--radius-full)"></div>
          </div>
          <span style="font-size:var(--font-sm);font-weight:600;color:#6b7280">${pods}/${totalSlots}</span>
        </div>
      </td>
      <td>
        <span class="badge ${isOnline ? 'operational' : 'maintenance'}">
          <span class="badge-dot"></span>
          ${isOnline ? 'Optimal' : 'Warning'}
        </span>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:7px;height:7px;border-radius:50%;background:${isOnline ? '#22c55e' : '#f59e0b'}"></span>
          <span style="font-size:var(--font-md);color:#525252;font-weight:500">${isOnline ? 'Online' : 'Maintenance'}</span>
        </div>
      </td>
      <td style="font-weight:700;color:#111827">₹${revenue.toLocaleString('en-IN')}</td>
    </tr>
  `;
}
