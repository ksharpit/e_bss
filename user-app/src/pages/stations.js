// ============================================
// Stations - Find a Swap Station
// ============================================
import { showToast } from '../utils/toast.js';
import { API_BASE } from '../config.js';

const MOCK_DIST = { 'BSS-001': '0.8', 'BSS-002': '3.2', 'BSS-003': '7.1', 'BSS-004': '9.4', 'BSS-005': '2.1' };

export async function renderStations(container, userId) {
  container.innerHTML = `
    <div style="background:linear-gradient(160deg,#0b1628,#1a2744);padding:20px 16px 16px">
      <div class="loading">Finding stations...</div>
    </div>`;

  let stations = [], batteries = [], user = null;
  try {
    [stations, batteries, user] = await Promise.all([
      fetch(`${API_BASE}/stations`).then(r => r.json()),
      fetch(`${API_BASE}/batteries`).then(r => r.json()),
      fetch(`${API_BASE}/users/${userId}`).then(r => r.ok ? r.json() : null),
    ]);
  } catch {
    showToast('Cannot reach API', 'error');
  }

  // Build per-station battery stats
  const stationBats = {};
  batteries.forEach(b => {
    if (!b.stationId) return;
    if (!stationBats[b.stationId]) stationBats[b.stationId] = { available: 0, charging: 0, fault: 0, ids: [] };
    stationBats[b.stationId].ids.push(b.id);
    if (b.status === 'available') stationBats[b.stationId].available++;
    else if (b.status === 'charging') stationBats[b.stationId].charging++;
    else if (b.status === 'fault') stationBats[b.stationId].fault++;
  });

  // Sort: online with available batteries first, then by distance
  stations.sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (b.status === 'online' && a.status !== 'online') return 1;
    const aAvail = stationBats[a.id]?.available || 0;
    const bAvail = stationBats[b.id]?.available || 0;
    if (aAvail !== bAvail) return bAvail - aAvail;
    return parseFloat(MOCK_DIST[a.id] || 99) - parseFloat(MOCK_DIST[b.id] || 99);
  });

  const totalOnline    = stations.filter(s => s.status === 'online').length;
  const totalAvailable = Object.values(stationBats).reduce((s, v) => s + v.available, 0);

  container.innerHTML = `
    <!-- Header Hero -->
    <div style="background:var(--bg);padding:22px 16px 20px;position:relative;overflow:hidden">
      <div style="position:absolute;top:-50px;right:-30px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(201,169,110,0.10) 0%,transparent 70%);pointer-events:none"></div>
      <p style="font-size:var(--font-xs);color:var(--text-soft);font-weight:700;text-transform:uppercase;letter-spacing:0.10em;margin-bottom:14px;position:relative;z-index:1">Swap Stations</p>
      <div style="display:grid;grid-template-columns:1fr 1px 1fr;background:rgba(255,255,255,0.03);border-radius:14px;overflow:hidden;border:1px solid var(--border);position:relative;z-index:1">
        <div style="padding:14px;text-align:center">
          <div style="font-size:1.75rem;font-weight:900;color:var(--primary);line-height:1;margin-bottom:3px;letter-spacing:-0.04em">${totalOnline}</div>
          <div style="font-size:9px;font-weight:700;color:var(--text-soft);text-transform:uppercase;letter-spacing:0.10em">Online Now</div>
        </div>
        <div style="background:var(--border)"></div>
        <div style="padding:14px;text-align:center">
          <div style="font-size:1.75rem;font-weight:900;color:var(--gold);line-height:1;margin-bottom:3px;letter-spacing:-0.04em">${totalAvailable}</div>
          <div style="font-size:9px;font-weight:700;color:var(--text-soft);text-transform:uppercase;letter-spacing:0.10em">Batteries Ready</div>
        </div>
      </div>
    </div>

    <!-- Stations List -->
    <div style="padding:16px 16px 8px">
      ${stations.map(s => stationCard(s, stationBats[s.id] || {})).join('')}
    </div>

    <!-- Legend -->
    <div style="display:flex;align-items:center;gap:16px;padding:4px 16px 16px">
      ${legendItem('available', 'Available')}
      ${legendItem('charging',  'Charging')}
      ${legendItem('fault',     'Fault')}
      ${legendItem('empty',     'Empty slot')}
    </div>
  `;

  // Wire up Google Maps on card click
  container.querySelectorAll('.station-card[data-lat]').forEach(card => {
    card.addEventListener('click', () => {
      const lat  = card.dataset.lat;
      const lng  = card.dataset.lng;
      const name = card.dataset.name;
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query=${encodeURIComponent(name)}`, '_blank');
    });
  });
}

function stationCard(station, avail) {
  const { available = 0, charging = 0, fault = 0 } = avail;
  const isOnline = station.status === 'online';
  const dist     = MOCK_DIST[station.id];

  const statusIcon  = isOnline ? 'wifi'         : station.status === 'maintenance' ? 'construction' : 'wifi_off';
  const statusClass = isOnline ? 'online'        : station.status === 'maintenance' ? 'maintenance'  : 'offline';

  return `
  <div class="station-card ${!isOnline ? 'offline' : ''}" data-lat="${station.lat}" data-lng="${station.lng}" data-name="${station.name}" style="cursor:pointer">
    <div class="station-card-top">
      <div style="flex:1;min-width:0;margin-right:10px">
        <div class="station-name">${station.name}</div>
        <div class="station-location">
          <span class="material-symbols-outlined">location_on</span>
          ${station.location}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
        <span class="status-pill ${statusClass}">
          <span class="material-symbols-outlined">${statusIcon}</span>
          ${station.status.charAt(0).toUpperCase() + station.status.slice(1)}
        </span>
        ${dist ? `<span style="font-size:10px;color:var(--text-soft);font-weight:600">${dist} km away</span>` : ''}
      </div>
    </div>

    <div class="station-avail-row">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="station-avail-num" style="color:${available > 0 ? 'var(--primary-dark)' : 'var(--text-soft)'}">${available}</div>
        <div>
          <div style="font-size:var(--font-xs);font-weight:700;color:${available > 0 ? 'var(--primary-dark)' : 'var(--text-soft)'}">Available</div>
          <div class="station-avail-label">${station.pods} total pods</div>
        </div>
      </div>
      ${podGrid(avail, station.pods)}
    </div>

    ${isOnline && available > 0 ? `
    <div style="margin-top:12px;padding:10px 12px;background:var(--gold-light);border:1px solid var(--gold-border);border-radius:10px;display:flex;align-items:center;gap:8px">
      <span class="material-symbols-outlined" style="font-size:14px;color:var(--gold);font-variation-settings:'FILL' 1">check_circle</span>
      <span style="font-size:var(--font-xs);font-weight:700;color:var(--gold);flex:1">${available} ${available === 1 ? 'battery' : 'batteries'} ready for swap</span>
      <span class="material-symbols-outlined" style="font-size:14px;color:var(--gold)">open_in_new</span>
    </div>` : isOnline && charging > 0 ? `
    <div style="margin-top:12px;padding:10px 12px;background:var(--amber-light);border:1px solid var(--amber-border);border-radius:10px;display:flex;align-items:center;gap:8px">
      <span class="material-symbols-outlined" style="font-size:14px;color:var(--amber);font-variation-settings:'FILL' 1">bolt</span>
      <span style="font-size:var(--font-xs);font-weight:700;color:var(--amber);flex:1">${charging} ${charging === 1 ? 'battery' : 'batteries'} charging - check back soon</span>
      <span class="material-symbols-outlined" style="font-size:14px;color:var(--amber)">open_in_new</span>
    </div>` : `
    <div style="margin-top:12px;display:flex;align-items:center;gap:5px">
      <span class="material-symbols-outlined" style="font-size:13px;color:var(--text-soft)">open_in_new</span>
      <span style="font-size:var(--font-xs);color:var(--text-soft);font-weight:600">Tap to open in Google Maps</span>
    </div>`}
  </div>`;
}

function podGrid(avail, totalPods) {
  const { available = 0, charging = 0, fault = 0 } = avail;
  const occupied = Math.max(0, totalPods - available - charging - fault);
  const dots = [];
  for (let i = 0; i < available; i++) dots.push(`<div class="pod-dot available"></div>`);
  for (let i = 0; i < charging; i++) dots.push(`<div class="pod-dot charging"><span class="material-symbols-outlined">bolt</span></div>`);
  for (let i = 0; i < fault; i++) dots.push(`<div class="pod-dot fault"><span class="material-symbols-outlined">warning</span></div>`);
  for (let i = 0; i < occupied; i++) dots.push(`<div class="pod-dot empty"></div>`);
  return `<div class="pod-grid">${dots.slice(0, 10).join('')}</div>`;
}

function legendItem(type, label) {
  const dot = type === 'available'
    ? `<div style="width:10px;height:10px;border-radius:3px;background:rgba(16,185,129,0.15);border:1.5px solid rgba(16,185,129,0.30);"></div>`
    : type === 'charging'
    ? `<div style="width:10px;height:10px;border-radius:3px;background:rgba(245,158,11,0.12);border:1.5px solid rgba(245,158,11,0.28);"></div>`
    : type === 'fault'
    ? `<div style="width:10px;height:10px;border-radius:3px;background:var(--red-light);border:1.5px solid var(--red-border);"></div>`
    : `<div style="width:10px;height:10px;border-radius:3px;background:var(--border-light);border:1.5px solid var(--border);"></div>`;
  return `<div style="display:flex;align-items:center;gap:5px">${dot}<span style="font-size:10px;font-weight:600;color:var(--text-soft)">${label}</span></div>`;
}
