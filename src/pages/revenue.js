// ============================================
// Revenue Analytics (Electica Exact)
// Matches revenue_dashboard_electica_dark reference
// ============================================
import { mockStations, mockRevenueDaily, mockRevenueByStation } from '../data/mockData.js';
import { renderRevenueLineChart } from '../components/revenueChart.js';
import { icon } from '../components/icons.js';
import { formatCurrency, formatNumber } from '../utils/helpers.js';
import { Chart } from 'chart.js';

let revenueBarChartInstance = null;
let attributionDoughnutInstance = null;

export function renderRevenue(container) {
  const totalRevenue = mockRevenueByStation.reduce((sum, s) => sum + s.revenue, 0);
  const totalSwaps = mockRevenueByStation.reduce((sum, s) => sum + s.swaps, 0);
  const avgPerSwap = (totalRevenue / totalSwaps).toFixed(2);
  const avgPerStation = Math.round(totalRevenue / mockStations.length);
  const sorted = [...mockRevenueByStation].sort((a, b) => b.revenue - a.revenue);

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Revenue Dashboard</h1>
        <p class="page-desc" style="color:#2563eb;font-weight:500">Real-time financial performance and station analytics</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline">${icon('calendar_today', '16px')} Last 30 Days</button>
        <button class="btn btn-primary">${icon('download', '16px')} Export PDF</button>
      </div>
    </div>

    <!-- 4 Metric Cards with mini sparkline -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;margin-bottom:2.5rem">
      ${revMetricCard('TOTAL REVENUE', '$1.28M', '↑ 12.5%', 'up', 'Vs last month')}
      ${revMetricCard('AVG. REV / STATION', '$8,563', '↑ 4.2%', 'up', `${mockStations.length} Active`)}
      ${revMetricCard('REVENUE PER SWAP', '$14.20', '↑ 0.8%', 'up', 'Target: $15.00')}
      ${revMetricCard('MONTHLY GROWTH', '18.4%', '↗ On Track', 'optimal', 'Exceeding goals')}
    </div>

    <!-- Revenue Trend (monthly bar chart) + Attribution Doughnut -->
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:1.5rem;margin-bottom:2.5rem">
      <div class="card" style="padding:2rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
          <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b">Revenue Trend</h3>
          <div style="display:flex;gap:1rem;font-size:var(--font-sm);font-weight:500">
            <span style="display:flex;align-items:center;gap:6px;color:#64748b"><span style="width:8px;height:8px;border-radius:50%;background:#2563eb"></span> Revenue</span>
            <span style="display:flex;align-items:center;gap:6px;color:#64748b"><span style="width:8px;height:8px;border-radius:50%;background:#bfdbfe"></span> Projection</span>
          </div>
        </div>
        <div style="height:280px">
          <canvas id="rev-monthly-bar"></canvas>
        </div>
      </div>

      <div class="card" style="padding:2rem;display:flex;flex-direction:column">
        <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;margin-bottom:1.5rem">Attribution</h3>
        <div style="flex:1;position:relative;display:flex;align-items:center;justify-content:center">
          <canvas id="rev-attribution-doughnut" style="max-height:200px"></canvas>
          <div style="position:absolute;display:flex;flex-direction:column;align-items:center">
            <span style="font-size:2rem;font-weight:700;color:#1e293b">72%</span>
            <span style="font-size:var(--font-sm);font-weight:500;color:#94a3b8;text-transform:uppercase">Standard</span>
          </div>
        </div>
        <div style="margin-top:1.5rem;display:flex;flex-direction:column;gap:12px">
          ${attrItem('#2563eb', 'Standard Swap', '$924k')}
          ${attrItem('#93c5fd', 'Premium Boost', '$240k')}
          ${attrItem('#cbd5e1', 'Ad Revenue', '$120k')}
        </div>
      </div>
    </div>

    <!-- Top Performing Stations + Swap Frequency Heatmap -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2.5rem">
      <div class="card" style="padding:2rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
          <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b">Top Performing Stations</h3>
          <button style="color:#2563eb;font-size:var(--font-md);font-weight:600;cursor:pointer">View All</button>
        </div>
        ${topStation('MG Road Hub (BSS-001)', '₹42,850', 100)}
        ${topStation('Whitefield Depot (BSS-004)', '₹38,200', 89)}
        ${topStation('Koramangala Station (BSS-005)', '₹31,500', 74)}
        ${topStation('Electronic City (BSS-003)', '₹28,900', 68)}
      </div>

      <div class="card" style="padding:2rem">
        <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;margin-bottom:1.5rem">Swap Frequency Heatmap</h3>
        ${renderHeatmap()}
      </div>
    </div>

    <!-- Revenue Breakdown by Station Table -->
    <div class="card" style="margin-bottom:2.5rem">
      <div style="padding:2rem;display:flex;align-items:center;justify-content:space-between">
        <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b">Revenue Breakdown by Station</h3>
        <div style="display:flex;gap:4px">
          <button class="header-icon-btn">${icon('tune', '18px')}</button>
          <button class="header-icon-btn">${icon('more_vert', '18px')}</button>
        </div>
      </div>
      <table style="width:100%;text-align:left;border-collapse:collapse">
        <thead>
          <tr style="border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9">
            <th style="padding:16px 24px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Station ID</th>
            <th style="padding:16px 24px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Location</th>
            <th style="padding:16px 24px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Swap Count</th>
            <th style="padding:16px 24px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Efficiency</th>
            <th style="padding:16px 24px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Total Revenue</th>
            <th style="padding:16px 24px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Trend</th>
          </tr>
        </thead>
        <tbody>
          ${[
      { id: 'BSS-001', loc: 'MG Road, Bengaluru', swaps: '1,420', eff: 92, rev: '₹42,850.20', trendUp: true },
      { id: 'BSS-002', loc: 'Airport Road, Bengaluru', swaps: '1,102', eff: 88, rev: '₹38,200.00', trendUp: true },
      { id: 'BSS-005', loc: 'Koramangala, Bengaluru', swaps: '980', eff: 74, rev: '₹31,500.50', trendUp: false },
      { id: 'BSS-003', loc: 'Electronic City, Bengaluru', swaps: '840', eff: 82, rev: '₹28,900.15', trendUp: false },
    ].map(s => `
            <tr style="border-bottom:1px solid #fafafa;transition:background 0.15s" onmouseover="this.style.background='rgba(59,130,246,0.03)'" onmouseout="this.style.background='transparent'">
              <td style="padding:16px 24px;font-weight:600;color:#1e293b">${s.id}</td>
              <td style="padding:16px 24px;color:#64748b;font-weight:500">${s.loc}</td>
              <td style="padding:16px 24px;font-weight:500">${s.swaps}</td>
              <td style="padding:16px 24px">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:52px;height:6px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
                    <div style="height:100%;width:${s.eff}%;background:${s.eff >= 85 ? '#2563eb' : s.eff >= 75 ? '#f59e0b' : '#ef4444'};border-radius:var(--radius-full)"></div>
                  </div>
                  <span style="font-size:var(--font-md);font-weight:600">${s.eff}%</span>
                </div>
              </td>
              <td style="padding:16px 24px;font-weight:700;color:#1e293b">${s.rev}</td>
              <td style="padding:16px 24px">
                <span class="material-symbols-outlined" style="font-size:18px;color:${s.trendUp ? '#2563eb' : (s.eff >= 80 ? '#64748b' : '#ef4444')}">${s.trendUp ? 'trending_up' : (s.eff >= 80 ? 'arrow_forward' : 'trending_down')}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f1f5f9">
        <span style="font-size:var(--font-sm);color:#94a3b8">Showing 4 of 150 active stations</span>
        <div style="display:flex;gap:4px">
          <button class="btn btn-outline" style="padding:6px 14px;font-size:var(--font-sm)">Previous</button>
          <button class="btn btn-primary" style="padding:6px 14px;font-size:var(--font-sm)">Next</button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="app-footer">
      © 2024 Electica Enterprise Finance Management. All rights reserved.
      <div style="margin-top:8px;display:flex;gap:2rem;justify-content:center">
        <a href="#" style="text-transform:uppercase;font-size:var(--font-sm);letter-spacing:0.06em">Privacy Policy</a>
        <a href="#" style="text-transform:uppercase;font-size:var(--font-sm);letter-spacing:0.06em;color:#2563eb">Security</a>
        <a href="#" style="text-transform:uppercase;font-size:var(--font-sm);letter-spacing:0.06em;color:#2563eb">Support API</a>
      </div>
    </footer>
  `;

  // Render monthly bar chart
  setTimeout(() => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const revenue = [35, 38, 40, 42, 45, 50, 55, 62, 75, 88, 95, 92];
    const projection = [null, null, null, null, null, null, null, null, null, 85, 90, 95];

    const canvas1 = document.getElementById('rev-monthly-bar');
    if (canvas1) {
      if (revenueBarChartInstance) revenueBarChartInstance.destroy();
      revenueBarChartInstance = new Chart(canvas1.getContext('2d'), {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            { label: 'Revenue', data: revenue, backgroundColor: '#2563eb', borderRadius: 4, borderSkipped: false, barPercentage: 0.6 },
            { label: 'Projection', data: projection, backgroundColor: '#bfdbfe', borderRadius: 4, borderSkipped: false, barPercentage: 0.6, borderDash: [5, 5] },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', cornerRadius: 8, padding: 12 } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, weight: '700' } } },
            y: { display: false },
          },
        },
      });
    }

    // Attribution doughnut
    const canvas2 = document.getElementById('rev-attribution-doughnut');
    if (canvas2) {
      if (attributionDoughnutInstance) attributionDoughnutInstance.destroy();
      attributionDoughnutInstance = new Chart(canvas2.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Standard Swap', 'Premium Boost', 'Ad Revenue'],
          datasets: [{
            data: [924, 240, 120],
            backgroundColor: ['#2563eb', '#93c5fd', '#e2e8f0'],
            borderColor: '#ffffff',
            borderWidth: 4,
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '75%',
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', cornerRadius: 8, padding: 12 } },
        },
      });
    }
  }, 150);
}

function revMetricCard(label, value, trend, trendType, sublabel) {
  const trendColor = trendType === 'up' ? '#059669' : trendType === 'optimal' ? '#2563eb' : '#64748b';

  return `
    <div class="card" style="padding:1.5rem;display:flex;flex-direction:column;justify-content:flex-end;min-height:160px;position:relative;overflow:hidden">
      <div style="position:absolute;top:12px;right:12px;width:72px;height:36px;opacity:0.15">
        <svg viewBox="0 0 72 36" fill="none">
          <path d="M0 30 Q12 28 18 25 T36 18 T54 8 T72 12" stroke="#2563eb" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${label}</p>
      <h3 style="font-size:2rem;font-weight:700;color:#1e293b;line-height:1">${value}</h3>
      <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
        <span style="font-size:var(--font-sm);font-weight:600;color:${trendColor}">${trend}</span>
      </div>
      <p style="font-size:var(--font-sm);font-weight:500;color:#94a3b8;margin-top:2px">${sublabel}</p>
    </div>
  `;
}

function attrItem(color, label, value) {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:10px;height:10px;border-radius:50%;background:${color}"></span>
        <span style="font-size:var(--font-md);font-weight:500;color:#64748b">${label}</span>
      </div>
      <span style="font-size:var(--font-md);font-weight:700;color:#1e293b">${value}</span>
    </div>
  `;
}

function topStation(name, revenue, pct) {
  return `
    <div style="margin-bottom:1.25rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:var(--font-md);font-weight:600;color:#1e293b">${name}</span>
        <span style="font-size:var(--font-md);font-weight:700;color:#1e293b">${revenue}</span>
      </div>
      <div style="width:100%;height:6px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
        <div style="height:100%;width:${pct}%;background:#2563eb;border-radius:var(--radius-full)"></div>
      </div>
    </div>
  `;
}

function renderHeatmap() {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const rows = 4; // 4 time slots
  const cells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 7; c++) {
      const intensity = Math.random();
      let bg;
      if (intensity > 0.75) bg = '#1d4ed8';
      else if (intensity > 0.5) bg = '#3b82f6';
      else if (intensity > 0.3) bg = '#93c5fd';
      else bg = '#dbeafe';
      cells.push(bg);
    }
  }

  return `
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:1rem">
      ${cells.map(bg => `<div style="aspect-ratio:1;background:${bg};border-radius:6px"></div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;padding:0 4px">
      ${days.map(d => `<span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">${d}</span>`).join('')}
    </div>
  `;
}
