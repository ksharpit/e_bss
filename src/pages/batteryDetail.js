// ============================================
// Battery Analytics Detail Page (Electica - Live API)
// High-quality card design, all data from API
// ============================================
import { icon } from '../components/icons.js';
import { apiFetch } from '../utils/apiFetch.js';
import { fmtCur } from '../utils/helpers.js';
import { Chart } from 'chart.js';

let sohChartInstance = null;

export async function renderBatteryDetail(container, batteryId) {
  container.innerHTML = `<div style="padding:3rem;text-align:center;color:#94a3b8;font-size:var(--font-md)">Loading battery analytics...</div>`;

  const bid = batteryId || 'BAT-0001';
  let battery = null, users = [], swaps = [], stations = [];

  try {
    [battery, users, swaps, stations] = await Promise.all([
      apiFetch(`/batteries/${bid}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      apiFetch('/users').then(r => r.json()),
      apiFetch('/swaps').then(r => r.json()),
      apiFetch('/stations').then(r => r.json()),
    ]);
  } catch {
    container.innerHTML = `<div style="padding:3rem;text-align:center;color:#ef4444;font-size:var(--font-md)">Battery "${bid}" not found or API unavailable.</div>`;
    return;
  }

  // Build lookups
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });
  const stationMap = {};
  stations.forEach(s => { stationMap[s.id] = s; });

  // Get swap history for this battery (as batteryOut or batteryIn)
  const batterySwaps = swaps
    .filter(s => s.batteryOut === bid || s.batteryIn === bid)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Determine location info
  let locationLabel = '';
  let locationIcon = 'location_on';
  let locationColor = '#64748b';
  if (battery.status === 'deployed' && battery.assignedTo) {
    const user = userMap[battery.assignedTo];
    locationLabel = user ? `${user.name} (${user.phone})` : battery.assignedTo;
    locationIcon = 'person';
    locationColor = '#D4654A';
  } else if (battery.stationId && stationMap[battery.stationId]) {
    locationLabel = stationMap[battery.stationId].name + ' - ' + stationMap[battery.stationId].location;
    locationIcon = 'ev_station';
    locationColor = '#D4654A';
  } else if (battery.stationName) {
    locationLabel = battery.stationName;
    locationIcon = 'ev_station';
    locationColor = '#D4654A';
  } else {
    locationLabel = 'Warehouse / Unassigned';
    locationIcon = 'warehouse';
    locationColor = '#94a3b8';
  }

  // Status badge styling - unified coral theme
  const statusMap = {
    'deployed': { label: 'DEPLOYED', bg: 'rgba(212,101,74,0.10)', color: '#D4654A', border: 'rgba(212,101,74,0.25)' },
    'available': { label: 'AVAILABLE', bg: 'rgba(212,101,74,0.07)', color: '#c75a3f', border: 'rgba(212,101,74,0.18)' },
    'charging': { label: 'CHARGING', bg: 'rgba(212,101,74,0.07)', color: '#D4654A', border: 'rgba(212,101,74,0.18)' },
    'in_use': { label: 'IN USE', bg: 'rgba(212,101,74,0.10)', color: '#D4654A', border: 'rgba(212,101,74,0.25)' },
    'in-use': { label: 'IN USE', bg: 'rgba(212,101,74,0.10)', color: '#D4654A', border: 'rgba(212,101,74,0.25)' },
    'stock': { label: 'IN STOCK', bg: 'rgba(212,101,74,0.05)', color: '#a8503a', border: 'rgba(212,101,74,0.12)' },
    'fault': { label: 'FAULT', bg: 'rgba(180,60,40,0.10)', color: '#b43c28', border: 'rgba(180,60,40,0.25)' },
    'retired': { label: 'RETIRED', bg: 'rgba(148,163,184,0.12)', color: '#64748b', border: 'rgba(148,163,184,0.25)' },
  };
  const st = statusMap[battery.status] || { label: battery.status.toUpperCase(), bg: 'rgba(212,101,74,0.07)', color: '#D4654A', border: 'rgba(212,101,74,0.18)' };

  // SOC color - coral gradient: high=coral, mid=warm coral, low=deep coral
  const socColor = battery.soc >= 70 ? '#D4654A' : battery.soc >= 30 ? '#c75a3f' : '#b43c28';
  const socLabel = battery.soc >= 70 ? 'Good' : battery.soc >= 30 ? 'Medium' : 'Low';

  // Health color - coral gradient
  const healthColor = battery.health >= 90 ? '#D4654A' : battery.health >= 70 ? '#c75a3f' : '#b43c28';
  const healthLabel = battery.health >= 90 ? 'Excellent' : battery.health >= 70 ? 'Good' : 'Degraded';

  // Temperature - coral gradient
  const temp = battery.temperature || 'N/A';
  const tempVal = typeof temp === 'number' ? temp : 0;
  const tempColor = tempVal <= 35 ? '#D4654A' : tempVal <= 45 ? '#c75a3f' : '#b43c28';
  const tempLabel = tempVal <= 35 ? 'OPTIMAL' : tempVal <= 45 ? 'WARM' : 'HOT';

  // Last swap time
  const lastSwapDate = battery.lastSwap ? new Date(battery.lastSwap) : null;
  const lastSwapStr = lastSwapDate ? lastSwapDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' at ' + lastSwapDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never';

  // Total revenue from this battery's swaps
  const totalRevenue = batterySwaps.reduce((sum, s) => sum + (s.amount || 0), 0);

  container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">

      <!-- Breadcrumb -->
      <nav style="display:flex;align-items:center;gap:6px;margin-bottom:1.25rem;font-size:var(--font-sm)">
        <a onclick="location.hash='#inventory'" style="color:#D4654A;font-weight:600;cursor:pointer;text-decoration:none;display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:8px;transition:background 0.2s" onmouseover="this.style.background='rgba(212,101,74,0.08)'" onmouseout="this.style.background='transparent'">
          <span class="material-symbols-outlined" style="font-size:16px">inventory_2</span> Battery Inventory
        </a>
        <span style="color:#cbd5e1;font-size:12px">›</span>
        <span style="color:#475569;font-weight:600">${battery.id}</span>
      </nav>

      <!-- Battery Identity Header Card -->
      <div class="card" style="padding:1.5rem;margin-bottom:1rem;box-shadow:none">
        <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap">
          <!-- Battery Icon -->
          <div style="width:56px;height:64px;background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:14px;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative">
            <span class="material-symbols-outlined" style="font-size:32px;color:#1e293b;font-variation-settings:'FILL' 1">battery_full</span>
            <div style="position:absolute;bottom:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:${st.color};display:flex;align-items:center;justify-content:center">
              <span class="material-symbols-outlined" style="font-size:10px;color:white">${battery.status === 'charging' ? 'bolt' : battery.status === 'deployed' ? 'person' : 'check'}</span>
            </div>
          </div>

          <!-- Battery Info -->
          <div style="flex:1;min-width:200px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
              <h2 style="font-size:1.5rem;font-weight:800;color:#1e293b;letter-spacing:-0.02em">${battery.id}</h2>
              <span style="padding:4px 12px;border-radius:var(--radius-full);font-size:10px;font-weight:700;background:${st.bg};color:${st.color};border:1px solid ${st.border};letter-spacing:0.05em">${st.label}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;color:${locationColor};font-size:var(--font-sm);font-weight:500">
              <span class="material-symbols-outlined" style="font-size:16px">${locationIcon}</span>
              ${locationLabel}
            </div>
            <p style="font-size:var(--font-xs);color:#94a3b8;margin-top:4px">${battery.deviceId ? `<span style="font-family:monospace;background:rgba(212,101,74,0.08);padding:2px 8px;border-radius:6px;color:#D4654A;font-weight:700;margin-right:8px">DI: ${battery.deviceId}</span>` : ''}Last swap: ${lastSwapStr}</p>
          </div>

          <!-- Quick Stats Chips -->
          <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap">
            <div style="padding:10px 18px;background:linear-gradient(135deg,rgba(30,41,59,0.04),rgba(30,41,59,0.01));border:1px solid #e2e8f0;border-radius:14px;text-align:center;min-width:60px">
              <span style="font-size:9px;font-weight:700;color:#94a3b8;display:block;margin-bottom:3px;letter-spacing:0.08em">CYCLES</span>
              <span style="font-size:1.1rem;font-weight:800;color:#1e293b">${battery.cycleCount || 0}</span>
              <span style="font-size:8px;font-weight:600;color:#94a3b8;display:block;margin-top:1px">Total</span>
            </div>
            <div style="padding:10px 18px;background:linear-gradient(135deg,rgba(212,101,74,0.06),rgba(212,101,74,0.02));border:1px solid rgba(212,101,74,0.15);border-radius:14px;text-align:center;min-width:60px">
              <span style="font-size:9px;font-weight:700;color:#94a3b8;display:block;margin-bottom:3px;letter-spacing:0.08em">SWAPS</span>
              <span style="font-size:1.1rem;font-weight:800;color:#D4654A">${batterySwaps.length}</span>
              <span style="font-size:8px;font-weight:600;color:#94a3b8;display:block;margin-top:1px">Recorded</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Metrics Row: Temp + Voltage + Revenue + SOH Chart -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 2fr;gap:1rem;margin-bottom:1rem">

        <!-- Temperature Card -->
        <div class="card" style="padding:1.25rem;text-align:center">
          <div style="width:44px;height:44px;border-radius:12px;background:${tempColor}12;display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
            <span class="material-symbols-outlined" style="font-size:22px;color:${tempColor}">thermostat</span>
          </div>
          <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Temperature</p>
          <h3 style="font-size:1.5rem;font-weight:800;color:#1e293b;margin-bottom:4px">${temp}°C</h3>
          <span style="padding:3px 10px;border-radius:var(--radius-full);font-size:9px;font-weight:700;background:${tempColor}15;color:${tempColor};border:1px solid ${tempColor}30">${tempLabel}</span>
          <div style="margin-top:10px;width:100%;height:6px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
            <div style="width:${Math.min(tempVal / 60 * 100, 100)}%;height:100%;background:${tempColor};border-radius:var(--radius-full);transition:width 0.5s"></div>
          </div>
        </div>

        <!-- SOC Gauge Card -->
        <div class="card" style="padding:1.25rem;text-align:center">
          <div style="width:44px;height:44px;border-radius:12px;background:${socColor}12;display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
            <span class="material-symbols-outlined" style="font-size:22px;color:${socColor}">battery_charging_full</span>
          </div>
          <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">State of Charge</p>
          <h3 style="font-size:1.5rem;font-weight:800;color:${socColor};margin-bottom:4px">${battery.soc}%</h3>
          <span style="padding:3px 10px;border-radius:var(--radius-full);font-size:9px;font-weight:700;background:${socColor}15;color:${socColor};border:1px solid ${socColor}30">${socLabel.toUpperCase()}</span>
          <div style="margin-top:10px;width:100%;height:6px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
            <div style="width:${battery.soc}%;height:100%;background:${socColor};border-radius:var(--radius-full);transition:width 0.5s"></div>
          </div>
        </div>

        <!-- Revenue Card -->
        <div class="card" style="padding:1.25rem;text-align:center">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(212,101,74,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
            <span class="material-symbols-outlined" style="font-size:22px;color:#D4654A">payments</span>
          </div>
          <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Total Revenue</p>
          <h3 style="font-size:1.5rem;font-weight:800;color:#1e293b;margin-bottom:4px">${fmtCur(totalRevenue)}</h3>
          <span style="padding:3px 10px;border-radius:var(--radius-full);font-size:9px;font-weight:700;background:rgba(212,101,74,0.08);color:#D4654A;border:1px solid rgba(212,101,74,0.2)">${batterySwaps.length} SWAPS</span>
          <div style="margin-top:10px;width:100%;height:6px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
            <div style="width:${Math.min(totalRevenue / 5000 * 100, 100)}%;height:100%;background:#D4654A;border-radius:var(--radius-full);transition:width 0.5s"></div>
          </div>
        </div>

        <!-- SOH Chart -->
        <div class="card" style="padding:1.25rem">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.75rem">
            <div>
              <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:2px">Health Trend (SOH)</h3>
              <p style="font-size:var(--font-xs);color:#94a3b8">Current: <strong style="color:${healthColor}">${battery.health}%</strong></p>
            </div>
            <span style="padding:4px 10px;border-radius:8px;font-size:10px;font-weight:700;background:${healthColor}12;color:${healthColor};border:1px solid ${healthColor}25">${healthLabel}</span>
          </div>
          <div style="height:140px;position:relative"><canvas id="soh-chart"></canvas></div>
        </div>
      </div>

      <!-- Live Telemetry Section (populated via API polling) -->
      <div id="telemetry-section" class="card" style="padding:1.5rem;margin-bottom:1rem;display:none">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite" id="telemetry-live-dot"></div>
            <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b">Live Telemetry</h3>
            <span id="telemetry-timestamp" style="font-size:var(--font-xs);color:#94a3b8"></span>
          </div>
          <span style="padding:4px 12px;border-radius:8px;font-size:10px;font-weight:700;background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2)" id="telemetry-badge">MQTT LIVE</span>
        </div>

        <!-- Pack Stats Row -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:1.25rem">
          <div style="padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Pack Voltage</p>
            <h4 id="tele-voltage" style="font-size:1.3rem;font-weight:800;color:#1e293b">-</h4>
            <span style="font-size:10px;color:#94a3b8">V</span>
          </div>
          <div style="padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Current</p>
            <h4 id="tele-current" style="font-size:1.3rem;font-weight:800;color:#1e293b">-</h4>
            <span style="font-size:10px;color:#94a3b8">A</span>
          </div>
          <div style="padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Capacity</p>
            <h4 style="font-size:1.3rem;font-weight:800;color:#1e293b"><span id="tele-cap">-</span><span style="font-size:0.7em;color:#94a3b8;font-weight:600"> / <span id="tele-cap-init">-</span></span></h4>
            <span style="font-size:10px;color:#94a3b8">Ah (avail / initial)</span>
          </div>
          <div style="padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Pod Temp</p>
            <h4 id="tele-podtemp" style="font-size:1.3rem;font-weight:800;color:#1e293b">-</h4>
            <span style="font-size:10px;color:#94a3b8">deg C</span>
          </div>
        </div>

        <!-- Cell Voltages -->
        <div style="margin-bottom:1.25rem">
          <h4 style="font-size:var(--font-sm);font-weight:700;color:#475569;margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px;color:#D4654A">electric_bolt</span>
            Cell Voltages (16S)
          </h4>
          <div id="cell-voltages-grid" style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px">
            ${Array.from({length:16}, (_, i) => `
              <div style="padding:8px 4px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;text-align:center">
                <p style="font-size:8px;font-weight:700;color:#94a3b8;margin-bottom:2px">C${i+1}</p>
                <p id="cell-v-${i}" style="font-size:12px;font-weight:800;color:#1e293b">-</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Temperature Sensors -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <h4 style="font-size:var(--font-sm);font-weight:700;color:#475569;margin-bottom:10px;display:flex;align-items:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:16px;color:#D4654A">thermostat</span>
              NTC Sensors (6)
            </h4>
            <div id="ntc-temps-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
              ${Array.from({length:6}, (_, i) => `
                <div style="padding:8px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;text-align:center">
                  <p style="font-size:8px;font-weight:700;color:#94a3b8;margin-bottom:2px">NTC${i+1}</p>
                  <p id="ntc-t-${i}" style="font-size:13px;font-weight:800;color:#1e293b">-</p>
                </div>
              `).join('')}
            </div>
          </div>
          <div>
            <h4 style="font-size:var(--font-sm);font-weight:700;color:#475569;margin-bottom:10px;display:flex;align-items:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:16px;color:#D4654A">memory</span>
              PDU Sensors (4)
            </h4>
            <div id="pdu-temps-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
              ${Array.from({length:4}, (_, i) => `
                <div style="padding:8px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;text-align:center">
                  <p style="font-size:8px;font-weight:700;color:#94a3b8;margin-bottom:2px">PDU${i+1}</p>
                  <p id="pdu-t-${i}" style="font-size:13px;font-weight:800;color:#1e293b">-</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      ${battery.status === 'deployed' && battery.assignedTo && userMap[battery.assignedTo] ? `
      <!-- Assigned User Card -->
      <div class="card" style="padding:1.25rem;margin-bottom:1rem;display:flex;align-items:center;gap:1.25rem">
        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#D4654A,#e8856c);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:var(--font-lg);font-weight:700;color:white">${userMap[battery.assignedTo].initials || battery.assignedTo.slice(-2)}</span>
        </div>
        <div style="flex:1;min-width:0">
          <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px">Assigned To</p>
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b">${userMap[battery.assignedTo].name}</h3>
          <p style="font-size:var(--font-sm);color:#64748b">${userMap[battery.assignedTo].phone} · ${userMap[battery.assignedTo].vehicle || 'Unknown Vehicle'}</p>
        </div>
        <div style="display:flex;gap:12px;flex-shrink:0">
          <div style="text-align:center;padding:6px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
            <span style="font-size:9px;font-weight:700;color:#94a3b8;display:block">KYC</span>
            <span style="font-size:var(--font-sm);font-weight:700;color:${userMap[battery.assignedTo].kycStatus === 'verified' ? '#D4654A' : '#a8503a'}">${(userMap[battery.assignedTo].kycStatus || 'pending').toUpperCase()}</span>
          </div>
          <div style="text-align:center;padding:6px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
            <span style="font-size:9px;font-weight:700;color:#94a3b8;display:block">SWAPS</span>
            <span style="font-size:var(--font-sm);font-weight:700;color:#1e293b">${userMap[battery.assignedTo].swapCount || 0}</span>
          </div>
          <div style="text-align:center;padding:6px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
            <span style="font-size:9px;font-weight:700;color:#94a3b8;display:block">SPENT</span>
            <span style="font-size:var(--font-sm);font-weight:700;color:#D4654A">${fmtCur(userMap[battery.assignedTo].totalSpent || 0)}</span>
          </div>
        </div>
        <button class="btn btn-outline" style="padding:8px 14px;font-size:var(--font-sm);flex-shrink:0" onclick="location.hash='#user-detail/${battery.assignedTo}'">View User</button>
      </div>
      ` : ''}

      <!-- Swap History Table -->
      <div class="card" style="padding:1.5rem">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem">
          <div>
            <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:2px">Swap History</h3>
            <p style="font-size:var(--font-xs);color:#94a3b8">${batterySwaps.length} swap${batterySwaps.length !== 1 ? 's' : ''} recorded for this battery</p>
          </div>
          <button class="btn btn-outline" id="battery-swap-export-btn" style="display:flex;align-items:center;gap:6px;padding:7px 14px;font-size:var(--font-sm)">
            ${icon('download', '14px')} Export CSV
          </button>
        </div>

        ${batterySwaps.length === 0 ? `
          <div style="padding:2.5rem;text-align:center;color:#94a3b8">
            <span class="material-symbols-outlined" style="font-size:40px;margin-bottom:8px;display:block;opacity:0.4">swap_horiz</span>
            <p style="font-size:var(--font-md);font-weight:600">No swap records found</p>
            <p style="font-size:var(--font-sm);margin-top:4px">This battery has no recorded swaps yet.</p>
          </div>
        ` : `
          <div style="overflow-x:auto">
            <table style="width:100%;text-align:left;border-collapse:collapse">
              <thead>
                <tr style="border-bottom:2px solid #f1f5f9">
                  <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Date & Time</th>
                  <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Station</th>
                  <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">User</th>
                  <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Direction</th>
                  <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;text-align:right">Amount</th>
                  <th style="padding:10px 12px;font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;text-align:center">Status</th>
                </tr>
              </thead>
              <tbody>
                ${batterySwaps.map(s => {
                  const ts = new Date(s.timestamp);
                  const dateStr = ts.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  const timeStr = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                  const user = userMap[s.userId];
                  const userName = user ? user.name : s.userId;
                  const direction = s.batteryOut === bid ? 'Swapped Out' : 'Swapped In';
                  const dirColor = s.batteryOut === bid ? '#b43c28' : '#D4654A';
                  const dirIcon = s.batteryOut === bid ? 'output' : 'input';
                  const stName = s.stationName || (stationMap[s.stationId] ? stationMap[s.stationId].name : s.stationId);
                  return `
                    <tr style="border-bottom:1px solid #f8fafc;transition:background 0.15s" onmouseover="this.style.background='rgba(212,101,74,0.03)'" onmouseout="this.style.background='transparent'">
                      <td style="padding:12px;font-weight:600;color:#1e293b;font-size:var(--font-sm)">${dateStr}<br><span style="font-size:var(--font-xs);color:#94a3b8;font-weight:400">${timeStr}</span></td>
                      <td style="padding:12px;color:#475569;font-weight:500;font-size:var(--font-sm)">${stName}</td>
                      <td style="padding:12px;font-size:var(--font-sm);color:#475569;font-weight:500">${userName}</td>
                      <td style="padding:12px">
                        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:${dirColor}10;color:${dirColor};border:1px solid ${dirColor}25">
                          <span class="material-symbols-outlined" style="font-size:12px">${dirIcon}</span> ${direction}
                        </span>
                      </td>
                      <td style="padding:12px;text-align:right;font-weight:700;color:#1e293b;font-size:var(--font-sm)">${fmtCur(s.amount || 0)}</td>
                      <td style="padding:12px;text-align:center">
                        <span style="padding:3px 10px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:${s.status === 'completed' ? 'rgba(212,101,74,0.08)' : 'rgba(212,101,74,0.05)'};color:${s.status === 'completed' ? '#D4654A' : '#a8503a'};border:1px solid ${s.status === 'completed' ? 'rgba(212,101,74,0.20)' : 'rgba(212,101,74,0.12)'}">${(s.status || 'completed').toUpperCase()}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div style="padding:12px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f1f5f9;margin-top:4px">
            <span style="font-size:var(--font-xs);color:#94a3b8">Showing ${batterySwaps.length} of ${batterySwaps.length} swaps · Total: ${fmtCur(totalRevenue)}</span>
          </div>
        `}
      </div>
    </div>
  `;

  // Battery swap history export
  document.getElementById('battery-swap-export-btn')?.addEventListener('click', async () => {
    const { downloadCsv } = await import('../utils/csv.js');
    const headers = ['Date', 'Time', 'Station', 'User', 'Direction', 'Amount', 'Status'];
    const rows = batterySwaps.map(s => {
      const ts = new Date(s.timestamp);
      const user = userMap[s.userId];
      return [
        ts.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        s.stationName || s.stationId,
        user ? user.name : s.userId,
        s.batteryOut === bid ? 'Swapped Out' : 'Swapped In',
        s.amount || 0,
        s.status || 'completed',
      ];
    });
    downloadCsv(`battery-${bid}-swaps`, headers, rows);
    const { showToast: toast } = await import('../utils/toast.js');
    toast('Swap history exported', 'success');
  });

  // SOH Chart
  setTimeout(() => {
    const sohCanvas = document.getElementById('soh-chart');
    if (!sohCanvas) return;
    if (sohChartInstance) sohChartInstance.destroy();

    const ctx = sohCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 140);
    gradient.addColorStop(0, 'rgba(212,101,74,0.18)');
    gradient.addColorStop(1, 'rgba(212,101,74,0)');

    // Generate realistic SOH degradation trend based on current health
    const currentHealth = battery.health || 95;
    const months = ['6 mo ago', '5 mo ago', '4 mo ago', '3 mo ago', '2 mo ago', 'Now'];
    const monthsFull = ['6 Months Ago', '5 Months Ago', '4 Months Ago', '3 Months Ago', '2 Months Ago', 'Current'];
    // Simulate degradation: health was higher in past months
    const sohValues = [];
    for (let i = 5; i >= 0; i--) {
      const degradation = Math.round(i * (100 - currentHealth) / 8);
      sohValues.push(Math.min(100, currentHealth + degradation));
    }

    sohChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          data: sohValues,
          borderColor: '#D4654A',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#D4654A',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#D4654A',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: function(context) {
              let el = document.getElementById('soh-tooltip');
              if (!el) {
                el = document.createElement('div');
                el.id = 'soh-tooltip';
                el.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;transition:opacity 0.15s;';
                document.body.appendChild(el);
              }
              const { tooltip } = context;
              if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }

              const i = tooltip.dataPoints[0].dataIndex;
              const val = sohValues[i];
              const prev = i > 0 ? sohValues[i - 1] : val;
              const delta = val - prev;
              const arrow = delta === 0 ? '-' : (delta > 0 ? '▲' : '▼');
              const trendColor = delta >= 0 ? '#D4654A' : '#b43c28';

              el.innerHTML = `
                <div style="background:#0f172a;color:white;border-radius:12px;padding:12px 18px;box-shadow:0 8px 24px rgba(0,0,0,0.4);min-width:140px">
                  <p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">${monthsFull[i]}</p>
                  <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:3px">
                    <span style="font-size:1.4rem;font-weight:800;color:#D4654A">${val}%</span>
                    <span style="font-size:11px;font-weight:700;color:${trendColor}">${arrow}${Math.abs(delta) > 0 ? ' ' + Math.abs(delta) + '%' : ''}</span>
                  </div>
                  <p style="font-size:10px;color:#475569">State of Health</p>
                </div>
              `;

              const rect = context.chart.canvas.getBoundingClientRect();
              el.style.opacity = '1';
              el.style.left = (rect.left + tooltip.caretX) + 'px';
              el.style.top = (rect.top + tooltip.caretY - 95) + 'px';
              el.style.transform = 'translateX(-50%)';
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9, weight: '700' } } },
          y: { display: false, min: Math.min(...sohValues) - 5, max: 102 },
        },
      },
    });
  }, 150);

  // Fetch latest telemetry and populate the live section
  async function loadTelemetry() {
    try {
      let t = null;
      try {
        const res = await apiFetch(`/telemetry/${bid}/latest`);
        if (res.ok) t = await res.json();
      } catch { /* API not available */ }

      // Demo fallback when no real telemetry exists
      if (!t || !t.time) {
        const baseV = 3.2 + (battery.soc / 100) * 1.0;
        t = {
          time: new Date().toISOString(),
          voltage: parseFloat((baseV * 16).toFixed(2)),
          currentDraw: parseFloat((-1.2 + Math.random() * 2.4).toFixed(3)),
          soc: battery.soc,
          soh: battery.health,
          cycleCount: battery.cycleCount || 0,
          capAvailable: parseFloat((40 + Math.random() * 5).toFixed(1)),
          capInitial: 48,
          podTemp: parseFloat((28 + Math.random() * 8).toFixed(1)),
          cellVoltages: Array.from({ length: 16 }, () => parseFloat((baseV + (Math.random() - 0.5) * 0.05).toFixed(3))),
          ntcTemps: Array.from({ length: 6 }, () => parseFloat((30 + Math.random() * 5).toFixed(1))),
          pduTemps: Array.from({ length: 4 }, () => parseFloat((32 + Math.random() * 6).toFixed(1))),
          _demo: true,
        };
      }

      // Show the section
      const section = document.getElementById('telemetry-section');
      if (section) section.style.display = 'block';

      // Timestamp
      const age = Math.round((Date.now() - new Date(t.time).getTime()) / 1000);
      const tsEl = document.getElementById('telemetry-timestamp');
      if (tsEl) {
        if (age < 60) tsEl.textContent = `${age}s ago`;
        else if (age < 3600) tsEl.textContent = `${Math.round(age/60)}m ago`;
        else tsEl.textContent = `${Math.round(age/3600)}h ago`;
      }

      // Stale check (> 5 min = offline) or demo mode
      const dot = document.getElementById('telemetry-live-dot');
      const badge = document.getElementById('telemetry-badge');
      if (t._demo) {
        if (dot) dot.style.background = '#f59e0b';
        if (badge) { badge.textContent = 'DEMO DATA'; badge.style.background = 'rgba(245,158,11,0.1)'; badge.style.color = '#f59e0b'; badge.style.borderColor = 'rgba(245,158,11,0.2)'; }
      } else if (age > 300) {
        if (dot) dot.style.background = '#94a3b8';
        if (badge) { badge.textContent = 'OFFLINE'; badge.style.background = 'rgba(148,163,184,0.1)'; badge.style.color = '#94a3b8'; badge.style.borderColor = 'rgba(148,163,184,0.2)'; }
      }

      // Pack stats
      const voltEl = document.getElementById('tele-voltage');
      const currEl = document.getElementById('tele-current');
      const capEl = document.getElementById('tele-cap');
      const podEl = document.getElementById('tele-podtemp');
      if (voltEl && t.voltage != null) voltEl.textContent = Number(t.voltage).toFixed(1);
      if (currEl && t.currentDraw != null) currEl.textContent = Number(t.currentDraw).toFixed(2);
      if (capEl && t.capAvailable != null) capEl.textContent = Number(t.capAvailable).toFixed(0);
      const capInitEl = document.getElementById('tele-cap-init');
      if (capInitEl && t.capInitial != null) capInitEl.textContent = Number(t.capInitial).toFixed(0);
      if (podEl && t.podTemp != null) podEl.textContent = Number(t.podTemp).toFixed(1);

      // Cell voltages
      if (t.cellVoltages && Array.isArray(t.cellVoltages)) {
        const minV = Math.min(...t.cellVoltages);
        const maxV = Math.max(...t.cellVoltages);
        t.cellVoltages.forEach((v, i) => {
          const el = document.getElementById(`cell-v-${i}`);
          if (el) {
            el.textContent = Number(v).toFixed(3);
            // Highlight imbalanced cells
            if (maxV - minV > 0.1 && (v === minV || v === maxV)) {
              el.style.color = v === minV ? '#b43c28' : '#22c55e';
            }
          }
        });
      }

      // NTC temps
      if (t.ntcTemps && Array.isArray(t.ntcTemps)) {
        t.ntcTemps.forEach((temp, i) => {
          const el = document.getElementById(`ntc-t-${i}`);
          if (el) {
            el.textContent = Number(temp).toFixed(1) + '\u00B0';
            if (temp > 55) el.style.color = '#b43c28';
            else if (temp > 40) el.style.color = '#d97706';
          }
        });
      }

      // PDU temps
      if (t.pduTemps && Array.isArray(t.pduTemps)) {
        t.pduTemps.forEach((temp, i) => {
          const el = document.getElementById(`pdu-t-${i}`);
          if (el) {
            el.textContent = Number(temp).toFixed(1) + '\u00B0';
            if (temp > 55) el.style.color = '#b43c28';
            else if (temp > 40) el.style.color = '#d97706';
          }
        });
      }
    } catch { /* telemetry not available yet */ }
  }

  // Initial load + poll every 10s
  loadTelemetry();
  const teleInterval = setInterval(loadTelemetry, 10000);

  // Cleanup interval on page navigation
  window.addEventListener('hashchange', () => clearInterval(teleInterval), { once: true });
}
