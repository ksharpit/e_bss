// ============================================
// Station Detail Page (Electica — Coral Theme)
// ============================================
import { icon } from '../components/icons.js';
import { showToast } from '../utils/toast.js';
import { API_BASE } from '../config.js';

// Battery status → cabinet slot status
function batteryToSlot(b) {
  const label = b.id.replace('BAT-', '');         // e.g. "0015"
  if (b.status === 'available')
    return { id: label, status: 'available', soc: b.soc + '%' };
  if (b.status === 'charging' || b.status === 'in_use')
    return { id: label, status: 'charging',  soc: b.soc + '%' };
  if (b.status === 'fault')
    return { id: label, status: 'fault',     soc: 'ERR' };
  return   { id: label, status: 'empty',     soc: '' };
}

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}


export async function renderStationDetail(container, stationId) {
  container.innerHTML = `<div style="padding:3rem;text-align:center;color:#94a3b8;font-size:var(--font-md)">Loading station…</div>`;

  let station = null;
  try {
    station = await fetch(`${API_BASE}/stations/${stationId}`).then(r => r.ok ? r.json() : null);
  } catch { /* API offline */ }
  if (!station) { container.innerHTML = '<p style="padding:3rem;text-align:center;color:#94a3b8">Station not found.</p>'; return; }
  // Normalize field names (db.json uses totalSwapsToday)
  if (station.swapsToday == null && station.totalSwapsToday != null) station.swapsToday = station.totalSwapsToday;

  // Fetch batteries at this station + recent swaps (no allocations — those happen physically at onboarding)
  let batteries = [], swaps = [];
  try {
    [batteries, swaps] = await Promise.all([
      fetch(`${API_BASE}/batteries?stationId=${stationId}`).then(r => r.json()),
      fetch(`${API_BASE}/swaps?stationId=${stationId}`).then(r => r.json()),
    ]);
    swaps = swaps.filter(s => s.type !== 'allocation')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch { /* render with empty data if API offline */ }

  // Compute real revenue/swaps today from swap records
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySwaps = swaps.filter(s => s.timestamp?.startsWith(todayStr));
  station.swapsToday = todaySwaps.length;
  station.revenueToday = todaySwaps.length * 65;
  const recentSwaps = swaps.slice(0, 8);

  // Build cabinet slots from real batteries + empty fillers
  const realSlots  = batteries.map(b => batteryToSlot(b));
  const emptyCount = Math.max(0, station.pods - realSlots.length);
  const emptySlots = Array.from({ length: emptyCount }, (_, i) => ({
    id: String(realSlots.length + i + 1).padStart(2, '0'),
    status: 'empty', soc: '',
  }));
  const cabinetSlots = [...realSlots, ...emptySlots];
  const gridCols     = Math.max(4, Math.ceil(cabinetSlots.length / 2));

  const readyCount    = batteries.filter(b => b.status === 'available').length;
  const chargingCount = batteries.filter(b => b.status === 'charging' || b.status === 'in_use').length;

  // Energy and power derived from real data
  const energyDispensed = (station.swapsToday * 2).toFixed(1);          // 2 kWh per swap
  const powerKW         = +(chargingCount * 1.2).toFixed(1);             // each battery charges at ~1.2 kW
  const powerBarPct     = Math.min(100, Math.round(powerKW / 15 * 100)); // 15 kW station capacity
  const loadFactor      = Math.round(chargingCount / Math.max(1, station.pods) * 100);

  container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">

    <!-- Breadcrumb -->
    <nav style="display:flex;align-items:center;gap:6px;margin-bottom:1rem;font-size:var(--font-sm)">
      <a onclick="location.hash='#stations'" style="color:#D4654A;font-weight:600;cursor:pointer;text-decoration:none;display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:6px;transition:background 0.15s" onmouseover="this.style.background='rgba(212,101,74,0.08)'" onmouseout="this.style.background='transparent'">
        <span class="material-symbols-outlined" style="font-size:14px">ev_station</span> Stations
      </a>
      <span style="color:#cbd5e1;font-size:12px">/</span>
      <span style="color:#64748b;font-weight:500">${station.name}</span>
    </nav>

    <!-- Station Header -->
    <div style="display:flex;flex-direction:column;gap:8px;padding-bottom:14px;border-bottom:1px solid rgba(226,232,240,0.6);margin-bottom:1.25rem">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:1rem">
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:16px">
            <h1 style="font-size:1.875rem;font-weight:700;color:#1e293b">${station.name}</h1>
            <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:rgba(212,101,74,0.10);color:#D4654A;border:1px solid rgba(212,101,74,0.25)">
              <span style="width:6px;height:6px;border-radius:50%;background:#D4654A;animation:pulse 2s infinite"></span>
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
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem">
      ${stationKpiCard('payments',   'Revenue Today', '₹' + station.revenueToday.toLocaleString('en-IN'), '+12.5%', 'up')}
      ${stationKpiCard('swap_horiz', 'Swaps Today',   String(station.swapsToday),                         '+8.2%',  'up')}
      ${stationKpiCard('bolt',       'Energy Used',   `${energyDispensed} kWh`,                          '+4.1%',  'up')}
    </div>

    <!-- Battery Cabinet Grid + Charger Monitoring -->
    <div style="display:grid;grid-template-columns:1fr 320px;gap:1rem;margin-bottom:1rem;align-items:start">

      <!-- Battery Cabinet Grid -->
      <div class="card" style="padding:1.5rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px">
            <span style="background:rgba(212,101,74,0.10);padding:6px;border-radius:var(--radius-md);color:#D4654A;display:flex">${icon('grid_view', '20px')}</span>
            Battery Cabinet - ${readyCount} ready · ${chargingCount} charging
          </h3>
          <div style="display:flex;gap:16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8">
            <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#22c55e"></span> Available</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#D4654A"></span> Charging</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#ef4444"></span> Fault</span>
            <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#e2e8f0"></span> Empty</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(${gridCols},1fr);grid-auto-rows:72px;gap:6px">
          ${cabinetSlots.map(slot => cabinetCell(slot)).join('')}
        </div>
      </div>

      <!-- Charger Monitoring -->
      <div class="card" style="padding:1.5rem;display:flex;flex-direction:column">
        <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1rem">
          <span style="background:rgba(212,101,74,0.10);padding:6px;border-radius:var(--radius-md);color:#D4654A;display:flex">${icon('bolt', '20px')}</span>
          Charger Monitoring
        </h3>

        <!-- Total Power Consumption -->
        <div style="margin-bottom:1rem">
          <div style="display:flex;justify-content:space-between;font-size:var(--font-md);margin-bottom:8px">
            <span style="color:#64748b;font-weight:500">Total Power Consumption</span>
            <span style="font-weight:700;color:#0f172a">${powerKW} kW</span>
          </div>
          <div style="width:100%;height:10px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
            <div style="width:${powerBarPct}%;height:100%;background:#D4654A;border-radius:var(--radius-full);box-shadow:0 0 10px rgba(212,101,74,0.4)"></div>
          </div>
        </div>

        <!-- Energy Dispensed / Load Factor -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1rem">
          <div style="padding:12px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9">
            <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">Energy Dispensed</p>
            <p style="font-size:1.4rem;font-weight:700;color:#0f172a">${energyDispensed} <span style="font-size:var(--font-md);font-weight:400;color:#64748b">kWh</span></p>
          </div>
          <div style="padding:12px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9">
            <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">Load Factor</p>
            <p style="font-size:1.4rem;font-weight:700;color:#0f172a">${loadFactor}<span style="font-size:var(--font-md);font-weight:400;color:#64748b">%</span></p>
          </div>
        </div>

      </div>
    </div>

    <!-- Revenue Trend + Station Location — Side by Side -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">

      <!-- Revenue Trend -->
      <div class="card" style="padding:1.5rem;display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
          <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px">
            <span style="background:rgba(212,101,74,0.10);padding:6px;border-radius:var(--radius-md);color:#D4654A;display:flex">${icon('monitoring', '20px')}</span>
            Revenue Trend
          </h3>
          <span style="font-size:var(--font-xs);font-weight:700;background:#f5f4f2;color:#6f6f6f;padding:4px 12px;border-radius:var(--radius-full);border:1px solid #eae8e4">This Week</span>
        </div>
        <!-- Bar Chart -->
        <div style="height:180px;display:flex;align-items:flex-end;gap:10px;padding:0 8px" id="sd-trend-bars">
          ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
            const pxH    = [54, 76, 63, 99, 84, 135, 153];
            const vals   = [320, 418, 345, 540, 462, 658, 752];
            const isActive = i === 6;
            return `
              <div class="sd-trend-col" data-day="${day}" data-val="${vals[i]}" data-active="${isActive}"
                   style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer">
                <div class="sd-trend-bar"
                     style="width:100%;height:${pxH[i]}px;background:${isActive ? 'linear-gradient(180deg,#D4654A,#e8856c)' : '#f0ece9'};border-radius:6px 6px 2px 2px;transition:all 0.25s ease;${isActive ? 'box-shadow:0 4px 16px rgba(212,101,74,0.25)' : ''}"></div>
                <span style="font-size:10px;font-weight:${isActive ? '800' : '600'};color:${isActive ? '#D4654A' : '#a8a8a8'};letter-spacing:0.02em">${day.substring(0,3)}</span>
              </div>
            `;
          }).join('')}
        </div>
        <!-- Stats Footer -->
        <div style="margin-top:1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="background:#faf9f7;border-radius:12px;padding:14px 16px;border:1px solid #f0efec">
            <p style="font-size:9px;font-weight:700;color:#a8a8a8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Weekly Total</p>
            <p style="font-size:1.375rem;font-weight:800;color:#1a1a1a;letter-spacing:-0.02em">₹2,842</p>
          </div>
          <div style="background:#faf9f7;border-radius:12px;padding:14px 16px;border:1px solid #f0efec">
            <p style="font-size:9px;font-weight:700;color:#a8a8a8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">Avg / Day</p>
            <p style="font-size:1.375rem;font-weight:800;color:#1a1a1a;letter-spacing:-0.02em">₹406</p>
          </div>
        </div>
      </div>

      <!-- Station Location -->
      <div class="card" style="padding:0;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem 1rem">
          <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px">
            <span style="background:rgba(212,101,74,0.10);padding:6px;border-radius:var(--radius-md);color:#D4654A;display:flex">${icon('location_on', '20px')}</span>
            Station Location
          </h3>
          <span style="font-size:var(--font-xs);font-weight:600;color:#6f6f6f">${station.lat.toFixed(4)}°N, ${station.lng.toFixed(4)}°E</span>
        </div>
        <div id="sd-map-${station.id}" style="flex:1;min-height:240px;z-index:1"></div>
        <div style="padding:12px 1.5rem;background:#faf9f7;border-top:1px solid #f0efec;display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;border-radius:8px;background:var(--accent-10);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span class="material-symbols-outlined" style="font-size:14px;color:#D4654A">location_on</span>
          </span>
          <span style="font-size:var(--font-sm);color:#525252;font-weight:600">${station.location}</span>
        </div>
      </div>

    </div>

    <!-- Recent Swap Transactions — Full Width Card-List -->
    <div class="card" style="padding:0;margin-bottom:1rem;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem 1rem">
        <h3 style="font-size:var(--font-xl);font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
          <span style="background:var(--accent-10);padding:6px;border-radius:var(--radius-md);color:#D4654A;display:flex">${icon('history', '20px')}</span>
          Recent Swaps
        </h3>
        <span style="font-size:var(--font-xs);font-weight:700;background:var(--accent-10);color:#D4654A;border:1px solid rgba(212,101,74,0.18);padding:4px 12px;border-radius:var(--radius-full)">${swaps.length} swap${swaps.length !== 1 ? 's' : ''}</span>
      </div>
      ${recentSwaps.length === 0 ? `
        <div style="padding:3rem;text-align:center;color:#94a3b8">
          <span class="material-symbols-outlined" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.5">swap_horiz</span>
          <p style="font-weight:600;font-size:var(--font-md)">No swaps recorded yet</p>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column">
          ${recentSwaps.map((s, idx) => `
          <div style="display:flex;align-items:center;gap:14px;padding:14px 1.5rem;border-top:${idx === 0 ? '1px solid var(--border-color)' : '1px solid var(--border-light)'};cursor:pointer;transition:background 0.15s"
               onclick="location.hash='#user-detail/${s.userId}'"
               onmouseover="this.style.background='var(--bg-hover-row)'" onmouseout="this.style.background='transparent'">
            <!-- Icon -->
            <div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--accent-10);border:1px solid rgba(212,101,74,0.12)">
              <span class="material-symbols-outlined" style="font-size:17px;color:#D4654A;font-variation-settings:'FILL' 1">swap_horiz</span>
            </div>
            <!-- Swap ID + User -->
            <div style="min-width:120px">
              <div style="font-size:var(--font-sm);font-weight:700;color:var(--text-primary)">${s.userId}</div>
              <div style="font-size:var(--font-xs);color:var(--text-muted);font-family:monospace;margin-top:1px">${s.id}</div>
            </div>
            <!-- Battery Flow -->
            <div style="flex:1;display:flex;align-items:center;gap:6px;justify-content:center">
              ${s.batteryOut ? `<span style="font-family:monospace;font-size:var(--font-sm);font-weight:600;color:var(--text-muted);background:var(--bg-table-head);padding:3px 10px;border-radius:6px;border:1px solid var(--border-color)">${s.batteryOut}</span>
              <span class="material-symbols-outlined" style="font-size:14px;color:#D4654A">arrow_forward</span>` : ''}
              <span style="font-family:monospace;font-size:var(--font-sm);font-weight:700;color:#D4654A;background:var(--accent-10);border:1px solid rgba(212,101,74,0.15);padding:3px 10px;border-radius:6px">${s.batteryIn || '—'}</span>
            </div>
            <!-- Date & Time -->
            <div style="text-align:right;min-width:100px;flex-shrink:0">
              <div style="font-size:var(--font-sm);color:var(--text-secondary);font-weight:500">${fmtDate(s.timestamp)}, ${fmtTime(s.timestamp)}</div>
            </div>
            <!-- Amount -->
            <div style="text-align:right;min-width:64px;flex-shrink:0">
              <span style="font-size:var(--font-md);font-weight:800;color:var(--text-primary)">₹${s.amount}</span>
            </div>
          </div>`).join('')}
        </div>
      `}
    </div>

    <!-- Footer -->
    <footer class="app-footer">
      ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#94a3b8')}
      Electica Enterprise Dashboard © 2024
    </footer>

    </div>
  `;

  document.getElementById('remote-reboot-btn')?.addEventListener('click', () => {
    showToast('Remote reboot initiated - station will restart in 30s', 'success');
  });
  document.getElementById('maintenance-mode-btn')?.addEventListener('click', () => {
    showToast('Station entering maintenance mode - swaps paused', 'warning');
  });

  // ── Revenue Trend tooltip ──
  const trendTT = document.createElement('div');
  trendTT.style.cssText = [
    'position:fixed',
    'background:#111',
    'color:white',
    'padding:8px 14px',
    'border-radius:10px',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity 0.15s',
    'z-index:9999',
    'transform:translate(-50%,-110%)',
    'white-space:nowrap',
    'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
  ].join(';');
  document.body.appendChild(trendTT);

  container.querySelectorAll('.sd-trend-col').forEach(col => {
    const bar = col.querySelector('.sd-trend-bar');
    const isActive = col.dataset.active === 'true';
    col.addEventListener('mouseenter', () => {
      bar.style.background = 'linear-gradient(180deg,#D4654A,#e8856c)';
      bar.style.boxShadow = '0 4px 16px rgba(212,101,74,0.3)';
      bar.style.transform = 'scaleY(1.04)';
      bar.style.transformOrigin = 'bottom';
      trendTT.innerHTML = `
        <div style="font-size:10px;font-weight:600;color:#9ca3af;margin-bottom:3px">${col.dataset.day}</div>
        <div style="font-size:15px;font-weight:700;color:#D4654A">₹${parseInt(col.dataset.val).toLocaleString()}</div>
      `;
      const r = bar.getBoundingClientRect();
      trendTT.style.left = (r.left + r.width / 2) + 'px';
      trendTT.style.top  = r.top + 'px';
      trendTT.style.opacity = '1';
    });
    col.addEventListener('mouseleave', () => {
      bar.style.background = isActive ? 'linear-gradient(180deg,#D4654A,#e8856c)' : '#f0ece9';
      bar.style.boxShadow  = isActive ? '0 4px 16px rgba(212,101,74,0.25)' : 'none';
      bar.style.transform = 'none';
      trendTT.style.opacity = '0';
    });
  });


  // ── Leaflet OpenStreetMap ──
  initStationMap(`sd-map-${station.id}`, station.lat, station.lng, station.name, station.location);
}

function stationKpiCard(iconName, label, value, trend, trendType) {
  const trendColor  = trendType === 'up' ? '#059669' : trendType === 'neutral' ? '#64748b' : '#D4654A';
  const trendBg     = trendType === 'up' ? '#ecfdf5' : trendType === 'neutral' ? '#f8fafc'  : 'rgba(212,101,74,0.10)';
  const trendBorder = trendType === 'up' ? '#a7f3d0' : trendType === 'neutral' ? '#f1f5f9'  : 'rgba(212,101,74,0.25)';
  const trendIcon   = trendType === 'up' ? 'trending_up' : trendType === 'neutral' ? 'remove' : 'trending_up';

  return `
    <div style="background:white;border:1px solid #f1f5f9;border-radius:16px;padding:1.25rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 4px 20px -2px rgba(0,0,0,0.05);transition:all 0.2s;cursor:pointer" onmouseover="this.style.boxShadow='0 8px 30px -4px rgba(0,0,0,0.1)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='0 4px 20px -2px rgba(0,0,0,0.05)';this.style.transform='none'">
      <div style="background:rgba(212,101,74,0.10);padding:12px;border-radius:50%;margin-bottom:10px">
        <span class="material-symbols-outlined" style="font-size:22px;color:#D4654A;font-variation-settings:'FILL' 1">${iconName}</span>
      </div>
      <p style="font-size:var(--font-md);color:#64748b;font-weight:500;margin-bottom:4px">${label}</p>
      <h3 style="font-size:1.75rem;font-weight:700;color:#1e293b;margin-bottom:8px">${value}</h3>
      <span style="font-size:var(--font-sm);font-weight:700;display:inline-flex;align-items:center;gap:4px;background:${trendBg};color:${trendColor};padding:4px 8px;border-radius:var(--radius-full);border:1px solid ${trendBorder}">
        <span class="material-symbols-outlined" style="font-size:12px">${trendIcon}</span> ${trend}
      </span>
    </div>
  `;
}

function cabinetCell(slot) {
  if (slot.status === 'available') {
    return `
      <div style="border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.05);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='rgba(34,197,94,0.12)';this.style.transform='scale(1.05)'" onmouseout="this.style.background='rgba(34,197,94,0.05)';this.style.transform='none'">
        <span style="font-size:9px;font-weight:700;color:#94a3b8;margin-bottom:1px">${slot.id}</span>
        <span class="material-symbols-outlined" style="font-size:18px;color:#22c55e;font-variation-settings:'FILL' 1">battery_full</span>
        <span style="font-size:9px;font-weight:700;color:#16a34a;margin-top:1px">${slot.soc}</span>
      </div>
    `;
  }
  if (slot.status === 'charging') {
    return `
      <div style="background:rgba(212,101,74,0.12);border:1.5px solid #D4654A;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(212,101,74,0.18)" onmouseover="this.style.background='rgba(212,101,74,0.20)'" onmouseout="this.style.background='rgba(212,101,74,0.12)'">
        <span style="font-size:9px;font-weight:700;color:rgba(212,101,74,0.6);margin-bottom:1px">${slot.id}</span>
        <span class="material-symbols-outlined" style="font-size:18px;color:#D4654A;font-variation-settings:'FILL' 1;animation:pulse 1.5s infinite">battery_charging_80</span>
        <span style="font-size:9px;font-weight:700;color:#D4654A;margin-top:1px">${slot.soc}</span>
      </div>
    `;
  }
  if (slot.status === 'fault') {
    return `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px;cursor:pointer;transition:all 0.2s">
        <span style="font-size:9px;font-weight:700;color:#fca5a5;margin-bottom:1px">${slot.id}</span>
        <span class="material-symbols-outlined" style="font-size:18px;color:#ef4444;font-variation-settings:'FILL' 1">error</span>
        <span style="font-size:9px;font-weight:700;color:#dc2626;margin-top:1px">${slot.soc}</span>
      </div>
    `;
  }
  // empty
  return `
    <div style="background:rgba(248,250,252,0.5);border:2px dashed #e2e8f0;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px;cursor:pointer;transition:border-color 0.2s" onmouseover="this.style.borderColor='#cbd5e1'" onmouseout="this.style.borderColor='#e2e8f0'">
      <span style="font-size:9px;font-weight:700;color:#cbd5e1;margin-bottom:1px">${slot.id}</span>
      <span class="material-symbols-outlined" style="font-size:18px;color:#cbd5e1">add</span>
    </div>
  `;
}

function initStationMap(containerId, lat, lng, name, location) {
  const mapEl = document.getElementById(containerId);
  if (!mapEl) return;

  function createMap() {
    const L = window.L;
    mapEl.innerHTML = '';
    const map = L.map(mapEl, { zoomControl: false }).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const markerHtml = `<div style="width:26px;height:26px;background:#D4654A;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(212,101,74,0.5)"></div>`;
    const customIcon = L.divIcon({ html: markerHtml, className: '', iconSize: [26, 26], iconAnchor: [13, 26] });
    L.marker([lat, lng], { icon: customIcon }).addTo(map)
      .bindPopup(`<b style="color:#0f172a">${name}</b><br><span style="color:#64748b;font-size:12px">${location}</span>`);
  }

  if (window.L) { createMap(); return; }

  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  if (!document.getElementById('leaflet-js')) {
    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = createMap;
    document.head.appendChild(script);
  } else {
    document.getElementById('leaflet-js').addEventListener('load', createMap);
  }
}
