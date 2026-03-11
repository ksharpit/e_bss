// ============================================
// Stations List Page - Live API battery data
// ============================================
import { createStationCard } from '../components/stationCard.js';
import { formatCurrency } from '../utils/helpers.js';
import { apiFetch } from '../utils/apiFetch.js';

// Map battery status → pod slot status for the station card dots
function batteryToPod(b) {
  const map = { available: 'ready', charging: 'charging', in_use: 'charging', fault: 'fault' };
  return { id: b.id, status: map[b.status] || 'empty', soc: b.soc };
}

// Real batteries at station + empty placeholder slots up to station.pods total
function buildPods(stationId, totalPods, batteries) {
  const real = batteries.filter(b => b.stationId === stationId).map(batteryToPod);
  const emptyCount = Math.max(0, totalPods - real.length);
  const empty = Array.from({ length: emptyCount }, (_, i) => ({ id: `e-${i}`, status: 'empty', soc: 0 }));
  return [...real, ...empty];
}

export async function renderStations(container) {
  container.innerHTML = `<div style="padding:3rem;text-align:center;color:#94a3b8;font-size:var(--font-md)">Loading stations...</div>`;

  let stations = [], batteries = [], allSwaps = [];
  try {
    [stations, batteries, allSwaps] = await Promise.all([
      apiFetch('/stations').then(r => r.json()),
      apiFetch('/batteries').then(r => r.json()),
      apiFetch('/swaps').then(r => r.json()),
    ]);
  } catch { /* render empty if API offline */ }

  // Compute real swaps today and revenue today per station from swap records
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySwaps = allSwaps.filter(s => s.timestamp?.startsWith(todayStr));
  const swapsByStation = {};
  const revByStation = {};
  todaySwaps.forEach(s => {
    swapsByStation[s.stationId] = (swapsByStation[s.stationId] || 0) + 1;
    revByStation[s.stationId] = (revByStation[s.stationId] || 0) + (Number(s.amount) || 0);
  });

  // Normalize with real data
  stations.forEach(s => {
    s.swapsToday = swapsByStation[s.id] || 0;
    s.revenueToday = revByStation[s.id] || 0;
  });

  // Build live pod map for all stations
  const livePods = {};
  stations.forEach(s => { livePods[s.id] = buildPods(s.id, s.pods, batteries); });

  const onlineCount      = stations.filter(s => s.status === 'online').length;
  const maintenanceCount = stations.filter(s => s.status === 'maintenance').length;
  const totalPods        = stations.reduce((a, s) => a + (s.pods || 0), 0);
  const totalSwaps       = todaySwaps.length;
  const totalRevenue     = todaySwaps.reduce((a, s) => a + (Number(s.amount) || 0), 0);
  const totalAvailable   = batteries.filter(b => b.status === 'available').length;

  // Extract unique cities from station locations
  const cities = [...new Set(stations.map(s => {
    const loc = s.location || '';
    // Get city: last segment after comma, or full string
    const parts = loc.split(',').map(p => p.trim());
    return parts[parts.length - 1] || 'Unknown';
  }))].filter(c => c && c !== 'Unknown').sort();

  const chipStyle = (active) => `padding:7px 16px;border-radius:var(--radius-full);border:1.5px solid ${active ? '#D4654A' : '#e2e8f0'};background:${active ? '#D4654A' : 'white'};color:${active ? 'white' : '#64748b'};font-size:var(--font-sm);font-weight:${active ? '700' : '600'};cursor:pointer;transition:all 0.18s`;

  container.innerHTML = `
    <div style="margin-bottom:1.25rem">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:0.75rem">
        <div>
          <h1 style="font-size:1.5rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin-bottom:3px">Swapping Stations</h1>
          <p style="font-size:var(--font-sm);color:#94a3b8;font-weight:500">${stations.length} stations · ${totalAvailable} batteries ready across network</p>
        </div>
        <div id="station-filters" style="display:flex;gap:6px;flex-wrap:wrap">
          <button data-filter="all" style="${chipStyle(true)}" class="sfilter-chip active">All (${stations.length})</button>
          <button data-filter="online" style="${chipStyle(false)}" class="sfilter-chip">Operational (${onlineCount})</button>
          <button data-filter="maintenance" style="${chipStyle(false)}" class="sfilter-chip">Maintenance (${maintenanceCount})</button>
        </div>
      </div>
      ${cities.length > 1 ? `
      <div id="city-filters" style="display:flex;gap:5px;flex-wrap:wrap;margin-top:10px">
        <button data-city="all" class="city-chip active"
          style="padding:5px 14px;border-radius:var(--radius-full);border:1.5px solid #D4654A;background:rgba(212,101,74,0.10);color:#D4654A;font-size:var(--font-xs);font-weight:700;cursor:pointer;transition:all 0.15s">All Cities</button>
        ${cities.map(c => `<button data-city="${c}" class="city-chip"
          style="padding:5px 14px;border-radius:var(--radius-full);border:1.5px solid #e2e8f0;background:white;color:#64748b;font-size:var(--font-xs);font-weight:600;cursor:pointer;transition:all 0.15s">${c}</button>`).join('')}
      </div>` : ''}
    </div>

    <div class="rev-kpi-grid" style="margin-bottom:1.25rem">
      <div class="rev-kpi-card">
        <div class="rev-kpi-decor"></div>
        <p class="rev-kpi-label">Online Stations</p>
        <h2 class="rev-kpi-value">${onlineCount}<span style="font-size:1rem;font-weight:500;color:#9ca3af;letter-spacing:0"> / ${stations.length}</span></h2>
        <span class="rev-badge rev-badge-up">↑ Operational</span>
      </div>
      <div class="rev-kpi-card">
        <p class="rev-kpi-label">Total Pods</p>
        <h2 class="rev-kpi-value">${totalPods}</h2>
        <span class="rev-badge rev-badge-up">↑ Active</span>
      </div>
      <div class="rev-kpi-card">
        <p class="rev-kpi-label">Swaps Today</p>
        <h2 class="rev-kpi-value">${totalSwaps}</h2>
        <span class="rev-badge rev-badge-track">Today</span>
      </div>
      <div class="rev-kpi-card">
        <p class="rev-kpi-label">Revenue Today</p>
        <h2 class="rev-kpi-value">${formatCurrency(totalRevenue)}</h2>
        <span class="rev-badge rev-badge-track">Today</span>
      </div>
    </div>

    <div id="station-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem">
      ${stations.map(s => createStationCard(s, livePods[s.id] || [])).join('')}
    </div>
  `;

  // --- Filter logic ---
  let activeStatus = 'all', activeCity = 'all';

  function applyFilters() {
    let filtered = stations;
    if (activeStatus !== 'all') filtered = filtered.filter(s => s.status === activeStatus);
    if (activeCity !== 'all') filtered = filtered.filter(s => (s.location || '').includes(activeCity));
    document.getElementById('station-grid').innerHTML =
      filtered.map(s => createStationCard(s, livePods[s.id] || [])).join('');
  }

  // Status filter chips
  document.getElementById('station-filters').addEventListener('click', e => {
    const chip = e.target.closest('.sfilter-chip');
    if (!chip) return;
    activeStatus = chip.dataset.filter;
    container.querySelectorAll('.sfilter-chip').forEach(c => {
      const on = c === chip;
      c.style.background  = on ? '#D4654A' : 'white';
      c.style.color       = on ? 'white'   : '#64748b';
      c.style.borderColor = on ? '#D4654A' : '#e2e8f0';
    });
    applyFilters();
  });

  // City filter chips
  document.getElementById('city-filters')?.addEventListener('click', e => {
    const chip = e.target.closest('.city-chip');
    if (!chip) return;
    activeCity = chip.dataset.city;
    container.querySelectorAll('.city-chip').forEach(c => {
      const on = c === chip;
      c.style.background  = on ? 'rgba(212,101,74,0.10)' : 'white';
      c.style.color       = on ? '#D4654A' : '#64748b';
      c.style.borderColor = on ? '#D4654A' : '#e2e8f0';
      c.style.fontWeight  = on ? '700' : '600';
    });
    applyFilters();
  });
}
