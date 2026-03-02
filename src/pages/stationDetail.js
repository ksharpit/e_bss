// ============================================
// Station Detail Page (Electica Exact)
// Matches station_management_electica_dark reference
// ============================================
import { mockStations, mockPods } from '../data/mockData.js';
import { icon } from '../components/icons.js';
import { socColor, formatCurrency } from '../utils/helpers.js';
import { showToast } from '../utils/toast.js';

export function renderStationDetail(container, stationId) {
  const station = mockStations.find(s => s.id === stationId);
  if (!station) { container.innerHTML = '<p>Station not found.</p>'; return; }

  const pods = mockPods[stationId] || [];
  const totalPods = pods.length || 8;

  // Build 16-slot cabinet grid (like reference has 8x2 = 16 slots)
  const cabinetSlots = [];
  for (let i = 0; i < 16; i++) {
    const pod = pods[i];
    if (pod) {
      if (pod.status === 'ready') {
        cabinetSlots.push({ id: String(i + 1).padStart(2, '0'), status: 'available', soc: pod.soc + '%', iconName: 'battery_full', color: 'blue' });
      } else if (pod.status === 'charging') {
        cabinetSlots.push({ id: 'CHG', status: 'charging', soc: '--', iconName: 'battery_charging_80', color: 'slate' });
      } else if (pod.status === 'fault') {
        cabinetSlots.push({ id: String(i + 1).padStart(2, '0'), status: 'fault', soc: 'ERR', iconName: 'error', color: 'rose' });
      } else {
        cabinetSlots.push({ id: String(i + 1).padStart(2, '0'), status: 'empty', soc: '', iconName: 'add', color: 'dashed' });
      }
    } else {
      // Alternate between available, charging, and empty to match reference variety
      const r = Math.random();
      if (r > 0.6) {
        const soc = Math.floor(Math.random() * 8 + 93);
        cabinetSlots.push({ id: String(i + 1).padStart(2, '0'), status: 'available', soc: soc + '%', iconName: 'battery_full', color: 'blue' });
      } else if (r > 0.3) {
        cabinetSlots.push({ id: 'CHG', status: 'charging', soc: '--', iconName: 'battery_charging_80', color: 'slate' });
      } else {
        cabinetSlots.push({ id: String(i + 1).padStart(2, '0'), status: 'empty', soc: '', iconName: 'add', color: 'dashed' });
      }
    }
  }

  const swapUsers = [
    { name: 'John Doe', initials: 'JD', color: '#dbeafe', textColor: '#1d4ed8', batteryId: 'BATT-X882', type: 'Standard', typeBg: '#f1f5f9', typeColor: '#475569', revenue: '$4.50', time: '12:45 PM' },
    { name: 'Alice Miller', initials: 'AM', color: '#f3e8ff', textColor: '#7c3aed', batteryId: 'BATT-Z441', type: 'High-Cap', typeBg: '#faf5ff', typeColor: '#7c3aed', revenue: '$6.20', time: '12:32 PM' },
    { name: 'Robert King', initials: 'RK', color: '#dbeafe', textColor: '#1d4ed8', batteryId: 'BATT-X210', type: 'Standard', typeBg: '#f1f5f9', typeColor: '#475569', revenue: '$4.50', time: '12:18 PM' },
    { name: 'Sarah Tan', initials: 'ST', color: '#dbeafe', textColor: '#1d4ed8', batteryId: 'BATT-Y111', type: 'Standard', typeBg: '#f1f5f9', typeColor: '#475569', revenue: '$4.50', time: '11:55 AM' },
  ];

  container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">
    <!-- Station Header — matches reference exactly -->
    <div style="display:flex;flex-direction:column;gap:8px;padding-bottom:16px;border-bottom:1px solid rgba(226,232,240,0.6);margin-bottom:2rem">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:1rem">
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:16px">
            <h1 style="font-size:1.875rem;font-weight:700;color:#1e293b">${station.name}</h1>
            <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe">
              <span style="width:6px;height:6px;border-radius:50%;background:#3b82f6;animation:pulse 2s infinite"></span>
              Operational
            </span>
          </div>
          <p style="font-size:var(--font-md);color:#64748b;font-weight:500;display:flex;align-items:center;gap:8px">
            <span style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:var(--font-sm);font-family:monospace;color:#475569">ID: ${station.id}</span>
            <span style="color:#cbd5e1">•</span>
            <span style="display:flex;align-items:center;gap:4px;font-size:var(--font-sm)">${icon('sync', '14px')} Last synced: 2 mins ago</span>
          </p>
        </div>
        <div style="display:flex;gap:12px">
          <button class="btn btn-outline" id="remote-reboot-btn">Remote Reboot</button>
          <button id="maintenance-mode-btn" style="padding:10px 20px;border-radius:var(--radius-md);background:#0f172a;color:white;font-size:var(--font-md);font-weight:600;box-shadow:0 4px 12px rgba(15,23,42,0.1);cursor:pointer">Maintenance Mode</button>
        </div>
      </div>
    </div>

    <!-- 4 KPI Cards -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
      ${stationKpiCard('payments', 'Revenue Today', '$428.50', '+12.5%', 'up')}
      ${stationKpiCard('swap_horiz', 'Swaps Today', '142', '+8.2%', 'up')}
      ${stationKpiCard('timer', 'Avg Swap Time', '42s', 'Stable', 'neutral')}
      ${stationKpiCard('bolt', 'Energy Used', '1.2 MWh', '+4.1%', 'up')}
    </div>

    <!-- Battery Cabinet Grid (2/3) + Charger Monitoring (1/3) -->
    <div style="display:grid;grid-template-columns:1fr 320px;gap:1.5rem;margin-bottom:1.5rem">
      <!-- Battery Cabinet Grid -->
      <div class="card" style="padding:2rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem">
          <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:12px">
            <span style="background:#eff6ff;padding:6px;border-radius:var(--radius-md);color:#2563eb;display:flex">${icon('grid_view', '20px')}</span>
            Battery Cabinet Grid
          </h3>
          <div style="display:flex;gap:16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8">
            <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#3b82f6"></span> Available</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#94a3b8"></span> Charging</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#f43f5e"></span> Fault</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#e2e8f0"></span> Empty</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:10px">
          ${cabinetSlots.map(slot => cabinetCell(slot)).join('')}
        </div>
      </div>

      <!-- Charger Monitoring -->
      <div class="card" style="padding:2rem">
        <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:12px;margin-bottom:2rem">
          <span style="background:#eff6ff;padding:6px;border-radius:var(--radius-md);color:#2563eb;display:flex">${icon('bolt', '20px')}</span>
          Charger Monitoring
        </h3>
        
        <!-- Total Power Consumption -->
        <div style="margin-bottom:1.5rem">
          <div style="display:flex;justify-content:space-between;font-size:var(--font-md);margin-bottom:8px">
            <span style="color:#64748b;font-weight:500">Total Power Consumption</span>
            <span style="font-weight:700;color:#0f172a">12.4 kW</span>
          </div>
          <div style="width:100%;height:10px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
            <div style="width:65%;height:100%;background:#2563eb;border-radius:var(--radius-full);box-shadow:0 0 10px rgba(37,99,235,0.4)"></div>
          </div>
        </div>

        <!-- Energy Dispensed / Load Factor -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:1.5rem">
          <div style="padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9">
            <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">Energy Dispensed</p>
            <p style="font-size:1.5rem;font-weight:700;color:#0f172a">142 <span style="font-size:var(--font-md);font-weight:400;color:#64748b">kWh</span></p>
          </div>
          <div style="padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9">
            <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">Load Factor</p>
            <p style="font-size:1.5rem;font-weight:700;color:#0f172a">88.2<span style="font-size:var(--font-md);font-weight:400;color:#64748b">%</span></p>
          </div>
        </div>

        <!-- Active Charges -->
        <div style="padding-top:1rem;border-top:1px solid #f1f5f9">
          <p style="font-size:var(--font-sm);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px">Active Charges</p>
          ${chargeSlot('A1', 'Fast Charging', '22m remaining', 70)}
          ${chargeSlot('B3', 'Deep Charging', '1h 12m remaining', 25)}
        </div>
      </div>
    </div>

    <!-- Recent Swap Transactions (2/3) + Revenue Trend + Station Location (1/3) -->
    <div style="display:grid;grid-template-columns:1fr 320px;gap:1.5rem;margin-bottom:1.5rem">
      <!-- Recent Swap Transactions -->
      <div class="card" style="padding:2rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem">
          <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:12px">
            <span style="background:#eff6ff;padding:6px;border-radius:var(--radius-md);color:#2563eb;display:flex">${icon('history', '20px')}</span>
            Recent Swap Transactions
          </h3>
          <button style="color:#2563eb;font-size:var(--font-md);font-weight:600;cursor:pointer">View All</button>
        </div>
        <table style="width:100%;text-align:left;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid #f1f5f9">
              <th style="padding-bottom:16px;padding-left:8px;font-size:var(--font-sm);font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">User</th>
              <th style="padding-bottom:16px;font-size:var(--font-sm);font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Battery ID</th>
              <th style="padding-bottom:16px;font-size:var(--font-sm);font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Type</th>
              <th style="padding-bottom:16px;text-align:right;font-size:var(--font-sm);font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Revenue</th>
              <th style="padding-bottom:16px;text-align:right;font-size:var(--font-sm);font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Time</th>
            </tr>
          </thead>
          <tbody>
            ${swapUsers.map(u => `
              <tr style="border-bottom:1px solid #fafafa;transition:background 0.15s" onmouseover="this.style.background='rgba(59,130,246,0.03)'" onmouseout="this.style.background='transparent'">
                <td style="padding:16px 8px">
                  <div style="display:flex;align-items:center;gap:12px">
                    <div style="width:32px;height:32px;border-radius:50%;background:${u.color};border:1px solid ${u.color};display:flex;align-items:center;justify-content:center">
                      <span style="font-size:10px;font-weight:700;color:${u.textColor}">${u.initials}</span>
                    </div>
                    <span style="font-size:var(--font-md);font-weight:600;color:#334155">${u.name}</span>
                  </div>
                </td>
                <td style="padding:16px 0;font-family:monospace;font-size:var(--font-sm);color:#64748b">${u.batteryId}</td>
                <td style="padding:16px 0"><span style="padding:4px 10px;border-radius:var(--radius-full);font-size:10px;font-weight:700;background:${u.typeBg};color:${u.typeColor};border:1px solid ${u.typeBg === '#faf5ff' ? '#e9d5ff' : '#e2e8f0'}">${u.type}</span></td>
                <td style="padding:16px 0;text-align:right;font-weight:700;color:#334155">${u.revenue}</td>
                <td style="padding:16px 0;text-align:right;font-size:var(--font-sm);color:#64748b;font-weight:500">${u.time}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Right column: Revenue Trend + Station Location -->
      <div style="display:flex;flex-direction:column;gap:2rem">
        <!-- Revenue Trend -->
        <div class="card" style="padding:2rem">
          <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:12px;margin-bottom:2rem">
            <span style="background:#eff6ff;padding:6px;border-radius:var(--radius-md);color:#2563eb;display:flex">${icon('monitoring', '20px')}</span>
            Revenue Trend
          </h3>
          <div style="height:160px;display:flex;align-items:flex-end;justify-content:space-between;gap:8px;padding:0 8px">
            ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
    const heights = [40, 55, 45, 70, 60, 85, 95];
    const isActive = i === 6;
    return `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer" class="bar-group">
                  <div style="width:100%;background:${isActive ? '#2563eb' : '#e2e8f0'};border-radius:3px 3px 0 0;height:${heights[i]}%;transition:background 0.2s;${isActive ? 'box-shadow:0 4px 12px rgba(37,99,235,0.2)' : ''}" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='${isActive ? '#2563eb' : '#e2e8f0'}'"></div>
                  <span style="font-size:10px;font-weight:700;color:${isActive ? '#2563eb' : '#94a3b8'}">${day}</span>
                </div>
              `;
  }).join('')}
          </div>
          <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between">
            <div>
              <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">Weekly Total</p>
              <p style="font-size:var(--font-xl);font-weight:700;color:#0f172a">$2,842</p>
            </div>
            <div style="text-align:right">
              <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">Avg / Day</p>
              <p style="font-size:var(--font-xl);font-weight:700;color:#0f172a">$406</p>
            </div>
          </div>
        </div>

        <!-- Station Location -->
        <div class="card" style="padding:2rem">
          <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:12px;margin-bottom:2rem">
            <span style="background:#eff6ff;padding:6px;border-radius:var(--radius-md);color:#2563eb;display:flex">${icon('location_on', '20px')}</span>
            Station Location
          </h3>
          <div style="position:relative;width:100%;aspect-ratio:16/10;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#f1f5f9">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;display:flex;flex-direction:column;align-items:center">
              <div style="background:white;border:1px solid #e2e8f0;border-radius:var(--radius-md);padding:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);white-space:nowrap;margin-bottom:-4px;z-index:2">
                <p style="font-size:var(--font-sm);font-weight:700;color:#0f172a">${station.name}</p>
                <p style="font-size:10px;color:#64748b">${station.location}</p>
              </div>
              <span class="material-symbols-outlined" style="font-size:48px;color:#2563eb;font-variation-settings:'FILL' 1">location_on</span>
            </div>
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 50%,#f8fafc 100%)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="app-footer" style="margin-top:2rem">
      ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#94a3b8')}
      Electica Enterprise Dashboard © 2024
      <div style="margin-top:8px;display:flex;gap:2rem;justify-content:center">
        <a href="#">Documentation</a>
        <a href="#">API Reference</a>
        <a href="#">Support</a>
        <a href="#">Privacy Policy</a>
      </div>
    </footer>
    </div>
  `;

  // Wire station detail buttons
  document.getElementById('remote-reboot-btn')?.addEventListener('click', () => {
    showToast('Remote reboot initiated — station will restart in 30s', 'success');
  });
  document.getElementById('maintenance-mode-btn')?.addEventListener('click', () => {
    showToast('⚠️ Station entering maintenance mode — swaps paused', 'warning');
  });
}

function stationKpiCard(iconName, label, value, trend, trendType) {
  const trendColor = trendType === 'up' ? '#059669' : trendType === 'neutral' ? '#64748b' : '#2563eb';
  const trendBg = trendType === 'up' ? '#ecfdf5' : trendType === 'neutral' ? '#f8fafc' : '#eff6ff';
  const trendBorder = trendType === 'up' ? '#a7f3d0' : trendType === 'neutral' ? '#f1f5f9' : '#bfdbfe';
  const trendIcon = trendType === 'up' ? 'trending_up' : trendType === 'neutral' ? 'remove' : 'trending_up';

  return `
    <div style="background:white;border:1px solid #f1f5f9;border-radius:16px;padding:1.25rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 4px 20px -2px rgba(0,0,0,0.05);transition:all 0.2s;cursor:pointer" onmouseover="this.style.boxShadow='0 8px 30px -4px rgba(0,0,0,0.1)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='0 4px 20px -2px rgba(0,0,0,0.05)';this.style.transform='none'">
      <div style="background:#eff6ff;padding:12px;border-radius:50%;margin-bottom:12px">
        <span class="material-symbols-outlined" style="font-size:22px;color:#2563eb;font-variation-settings:'FILL' 1">${iconName}</span>
      </div>
      <p style="font-size:var(--font-md);color:#64748b;font-weight:500;margin-bottom:4px">${label}</p>
      <h3 style="font-size:1.875rem;font-weight:700;color:#1e293b;margin-bottom:8px">${value}</h3>
      <span style="font-size:var(--font-sm);font-weight:700;display:inline-flex;align-items:center;gap:4px;background:${trendBg};color:${trendColor};padding:4px 8px;border-radius:var(--radius-full);border:1px solid ${trendBorder}">
        <span class="material-symbols-outlined" style="font-size:12px">${trendIcon}</span> ${trend}
      </span>
    </div>
  `;
}

function cabinetCell(slot) {
  if (slot.status === 'available') {
    return `
      <div style="aspect-ratio:1;border:1px solid #bfdbfe;background:rgba(59,130,246,0.03);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;cursor:pointer;transition:all 0.2s;box-shadow:0 1px 2px rgba(0,0,0,0.05)" onmouseover="this.style.background='#dbeafe';this.style.transform='scale(1.05)'" onmouseout="this.style.background='rgba(59,130,246,0.03)';this.style.transform='none'">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;margin-bottom:2px">${slot.id}</span>
        <span class="material-symbols-outlined" style="font-size:24px;color:#2563eb;font-variation-settings:'FILL' 1">battery_full</span>
        <span style="font-size:10px;font-weight:700;color:#1d4ed8;margin-top:2px">${slot.soc}</span>
      </div>
    `;
  }
  if (slot.status === 'charging') {
    return `
      <div style="aspect-ratio:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;cursor:pointer;transition:all 0.2s;box-shadow:0 1px 2px rgba(0,0,0,0.05)" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;margin-bottom:2px">${slot.id}</span>
        <span class="material-symbols-outlined" style="font-size:24px;color:#94a3b8;animation:pulse 2s infinite">battery_charging_80</span>
        <span style="font-size:10px;font-weight:700;color:#64748b;margin-top:2px">${slot.soc}</span>
      </div>
    `;
  }
  if (slot.status === 'fault') {
    return `
      <div style="aspect-ratio:1;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;cursor:pointer;transition:all 0.2s;box-shadow:0 1px 2px rgba(0,0,0,0.05)">
        <span style="font-size:10px;font-weight:700;color:#fca5a5;margin-bottom:2px">${slot.id}</span>
        <span class="material-symbols-outlined" style="font-size:24px;color:#ef4444;font-variation-settings:'FILL' 1">error</span>
        <span style="font-size:10px;font-weight:700;color:#dc2626;margin-top:2px">${slot.soc}</span>
      </div>
    `;
  }
  // empty
  return `
    <div style="aspect-ratio:1;background:rgba(248,250,252,0.5);border:2px dashed #e2e8f0;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;cursor:pointer;transition:border-color 0.2s" onmouseover="this.style.borderColor='#cbd5e1'" onmouseout="this.style.borderColor='#e2e8f0'">
      <span style="font-size:10px;font-weight:700;color:#cbd5e1;margin-bottom:2px">${slot.id}</span>
      <span class="material-symbols-outlined" style="font-size:24px;color:#cbd5e1">add</span>
    </div>
  `;
}

function chargeSlot(slotId, label, remaining, pct) {
  return `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:1rem">
      <div style="width:40px;height:40px;border-radius:var(--radius-md);background:white;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--font-md);color:#334155;box-shadow:0 1px 2px rgba(0,0,0,0.05)">${slotId}</div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;font-size:var(--font-sm);margin-bottom:8px">
          <span style="font-weight:600;color:#334155">${label}</span>
          <span style="color:#94a3b8">${remaining}</span>
        </div>
        <div style="width:100%;height:6px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
          <div style="width:${pct}%;height:100%;background:#3b82f6;border-radius:var(--radius-full)"></div>
        </div>
      </div>
    </div>
  `;
}
