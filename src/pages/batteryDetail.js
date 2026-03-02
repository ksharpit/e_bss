// ============================================
// Battery Analytics Detail Page (Electica Exact)
// Matches battery_management_electica_dark reference
// ============================================
import { mockBatteries } from '../data/mockData.js';
import { icon } from '../components/icons.js';
import { Chart } from 'chart.js';

let sohChartInstance = null;
let socChartInstance = null;

export function renderBatteryDetail(container, batteryId) {
  const battery = mockBatteries.find(b => b.id === (batteryId || 'BAT-0001')) || mockBatteries[0];

  const swapHistory = [
    { date: 'Oct 24, 2023', time: '14:22', station: 'Koramangala Hub - S2', userId: '#USR-9902', inSoc: 12, outSoc: 100, duration: '45s' },
    { date: 'Oct 23, 2023', time: '09:15', station: 'Indiranagar Terminal', userId: '#USR-1284', inSoc: 28, outSoc: 100, duration: '52s' },
    { date: 'Oct 22, 2023', time: '18:40', station: 'Whitefield Station 4A', userId: '#USR-5501', inSoc: 8, outSoc: 100, duration: '38s' },
    { date: 'Oct 21, 2023', time: '11:02', station: 'JP Nagar Depot', userId: '#USR-0829', inSoc: 41, outSoc: 98, duration: '1m 12s' },
  ];

  container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">
      <!-- Top: Battery Info + Telemetry side-by-side -->
      <div style="display:grid;grid-template-columns:1fr 260px;gap:1.25rem;margin-bottom:1.25rem">
        
        <!-- Left: Battery Info + AI Insight -->
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <!-- Battery Info Card -->
          <div class="card" style="padding:1.25rem">
            <div style="display:flex;align-items:center;gap:1.25rem">
              <div style="width:48px;height:60px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:28px;color:#1e293b;font-variation-settings:'FILL' 1">battery_full</span>
              </div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
                  <span style="font-size:var(--font-sm);color:#64748b">ID:</span>
                  <h2 style="font-size:1.5rem;font-weight:700;color:#1e293b">#B-${battery.id.replace('BAT-', '')}</h2>
                  <span style="padding:3px 10px;border-radius:var(--radius-full);font-size:10px;font-weight:700;background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0">${battery.status === 'in-use' ? 'ACTIVE' : battery.status.toUpperCase()}</span>
                </div>
                <p style="font-size:var(--font-sm);color:#64748b;display:flex;align-items:center;gap:4px">
                  ${icon('location_on', '14px')} ${battery.stationId} - Bay S2
                </p>
              </div>
              <div style="display:flex;gap:8px;flex-shrink:0">
                <div style="padding:8px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;text-align:center;min-width:40px">
                  <span style="font-size:10px;font-weight:700;color:#1e293b;display:block">SOC</span>
                  <span style="font-size:var(--font-md);font-weight:700;color:#2563eb">${battery.soc}%</span>
                </div>
                <div style="padding:8px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;text-align:center;min-width:40px">
                  <span style="font-size:10px;font-weight:700;color:#1e293b;display:block">SOH</span>
                  <span style="font-size:var(--font-md);font-weight:700;color:#16a34a">${battery.health}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Predictive Insight -->
          <div class="card" style="padding:1.25rem">
            <div style="display:flex;align-items:center;gap:1rem">
              <div style="width:40px;height:40px;border-radius:50%;background:#eff6ff;border:1px solid #bfdbfe;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:20px;color:#2563eb;font-variation-settings:'FILL' 1">psychology</span>
              </div>
              <div style="flex:1;min-width:0">
                <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px">AI Predictive Insight</p>
                <h3 style="font-size:var(--font-md);font-weight:700;color:#1e293b;margin-bottom:4px">Potential Cell Imbalance Detected</h3>
                <p style="font-size:var(--font-sm);color:#64748b;line-height:1.4">ML models predict a 12.4% increase in internal resistance within the next 15-20 cycles. Recommend deep cycle calibration at the next maintenance window.</p>
              </div>
              <button class="btn btn-outline" style="white-space:nowrap;padding:8px 14px;font-size:var(--font-sm);flex-shrink:0">Schedule Inspection</button>
            </div>
          </div>
        </div>

        <!-- Right: Real-time Telemetry -->
        <div style="display:flex;flex-direction:column;gap:1rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:0">Real-time Telemetry</h3>

          <!-- Temperature -->
          <div class="card" style="padding:1rem;text-align:center">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Temperature</p>
            <h3 style="font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:2px">34.2°C</h3>
            <span style="font-size:var(--font-xs);font-weight:700;color:#16a34a">OPTIMAL</span>
            <div style="margin-top:8px;width:100%;height:5px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
              <div style="width:55%;height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:var(--radius-full)"></div>
            </div>
          </div>

          <!-- Voltage -->
          <div class="card" style="padding:1rem;text-align:center">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Voltage</p>
            <h3 style="font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:2px">52.4V</h3>
            <span style="font-size:var(--font-xs);font-weight:700;color:#2563eb">STABLE</span>
            <div style="margin-top:8px;width:100%;height:5px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
              <div style="width:75%;height:100%;background:#2563eb;border-radius:var(--radius-full)"></div>
            </div>
          </div>

          <!-- Internal Resistance -->
          <div class="card" style="padding:1rem;text-align:center">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Internal Resistance</p>
            <h3 style="font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:2px">12.5 mΩ</h3>
            <span style="font-size:var(--font-xs);font-weight:700;color:#f59e0b">+2% AVG</span>
          </div>
        </div>
      </div>

      <!-- Charts Row: SOH + SOC side by side -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
        <div class="card" style="padding:1.25rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b">Health Trend (SOH)</h3>
            <button class="btn btn-outline" style="padding:4px 10px;font-size:var(--font-xs);display:flex;align-items:center;gap:4px">
              Last 6 Months ${icon('expand_more', '14px')}
            </button>
          </div>
          <div style="height:140px"><canvas id="soh-chart"></canvas></div>
        </div>
        <div class="card" style="padding:1.25rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b">Efficiency Trend (SOC)</h3>
            <span style="display:flex;align-items:center;gap:6px;font-size:var(--font-xs);color:#64748b;font-weight:500">
              <span style="width:6px;height:6px;border-radius:50%;background:#10b981"></span> Performance
            </span>
          </div>
          <div style="height:140px"><canvas id="soc-efficiency-chart"></canvas></div>
        </div>
      </div>

      <!-- Swap History Table -->
      <div class="card" style="padding:1.25rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b">Swap History</h3>
          <button class="btn btn-outline" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:var(--font-sm)">
            ${icon('download', '14px')} Export CSV
          </button>
        </div>
        <table style="width:100%;text-align:left;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid #f1f5f9">
              <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Date & Time</th>
              <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Station</th>
              <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">User ID</th>
              <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;text-align:center">In (SOC)</th>
              <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;text-align:center">Out (SOC)</th>
              <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;text-align:right">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${swapHistory.map(s => `
              <tr style="border-bottom:1px solid #fafafa;transition:background 0.15s" onmouseover="this.style.background='rgba(59,130,246,0.02)'" onmouseout="this.style.background='transparent'">
                <td style="padding:12px;font-weight:600;color:#1e293b;font-size:var(--font-sm)">${s.date}<br><span style="font-size:var(--font-xs);color:#94a3b8;font-weight:400">${s.time}</span></td>
                <td style="padding:12px;color:#475569;font-weight:500;font-size:var(--font-sm)">${s.station}</td>
                <td style="padding:12px;font-family:monospace;font-size:var(--font-xs);color:#64748b">${s.userId}</td>
                <td style="padding:12px;text-align:center"><span style="padding:3px 10px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:#fef2f2;color:#ef4444;border:1px solid #fecaca">${s.inSoc}%</span></td>
                <td style="padding:12px;text-align:center"><span style="padding:3px 10px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0">${s.outSoc}%</span></td>
                <td style="padding:12px;text-align:right;font-weight:500;color:#475569;font-size:var(--font-sm)">${s.duration}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="padding:12px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f1f5f9;margin-top:4px">
          <span style="font-size:var(--font-xs);color:#94a3b8">Showing 4 of 412 swaps</span>
          <div style="display:flex;gap:4px">
            <button class="btn btn-outline" style="padding:5px 12px;font-size:var(--font-xs)">Prev</button>
            <button class="btn btn-primary" style="padding:5px 12px;font-size:var(--font-xs)">Next</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render SOH Chart
  setTimeout(() => {
    const sohCanvas = document.getElementById('soh-chart');
    if (sohCanvas) {
      if (sohChartInstance) sohChartInstance.destroy();
      const ctx = sohCanvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 140);
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.08)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

      sohChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
          datasets: [{
            data: [98, 97, 95, 93, 90, 87],
            borderColor: '#2563eb',
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#2563eb',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9, weight: '700' } } },
            y: { display: false, min: 80, max: 100 },
          },
        },
      });
    }

    // Render SOC Efficiency Chart
    const socCanvas = document.getElementById('soc-efficiency-chart');
    if (socCanvas) {
      if (socChartInstance) socChartInstance.destroy();
      socChartInstance = new Chart(socCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          datasets: [{
            data: [65, 72, 58, 80, 75, 90, 85],
            backgroundColor: '#10b981',
            borderRadius: 3,
            borderSkipped: false,
            barPercentage: 0.6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9, weight: '700' } } },
            y: { display: false },
          },
        },
      });
    }
  }, 150);
}
