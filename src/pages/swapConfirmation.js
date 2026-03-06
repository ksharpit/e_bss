// ============================================
// Swap Confirmation Page (Electica — Coral Theme)
// ============================================
import { icon } from '../components/icons.js';
import { showToast } from '../utils/toast.js';

export function renderSwapConfirmation(container) {
  // Read selected station from swapBattery page (fallback to defaults)
  const sel = window.__swapStation || { name: 'Koramangala Hub', location: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 };

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav style="display:flex;align-items:center;gap:6px;margin-bottom:1.25rem;font-size:var(--font-sm)">
      <a onclick="location.hash='#dashboard'" style="color:#64748b;font-weight:500;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background 0.15s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">Dashboard</a>
      <span style="color:#cbd5e1">/</span>
      <a onclick="location.hash='#swap'" style="color:#64748b;font-weight:500;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background 0.15s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">Initiate Swap</a>
      <span style="color:#cbd5e1">/</span>
      <a onclick="location.hash='#swap-confirm'" style="color:#D4654A;font-weight:600;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background 0.15s" onmouseover="this.style.background='rgba(212,101,74,0.08)'" onmouseout="this.style.background='transparent'">Swap Confirmation</a>
      <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
        <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite"></span>
        <span style="font-size:var(--font-sm);font-weight:600;color:#1e293b">SYSTEM ONLINE</span>
      </div>
    </nav>

    <!-- Title + Session ID -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem">
      <div>
        <h1 style="font-size:1.875rem;font-weight:700;color:#1e293b;margin-bottom:6px">Confirm Battery Swap</h1>
        <p style="font-size:var(--font-md);color:#64748b">Review session details and authorize slot unlock for rider.</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:4px">Session ID</p>
        <span style="font-family:monospace;font-size:var(--font-lg);font-weight:700;color:#1e293b;padding:8px 16px;border:2px solid #1e293b;border-radius:var(--radius-md)">#SWAP-8821-XJ</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:2rem">

      <!-- Left: Station Location + Map -->
      <div>
        <div class="card" style="padding:2rem;margin-bottom:1.5rem;overflow:hidden">
          <!-- Station Label -->
          <div style="display:flex;align-items:center;gap:12px;background:rgba(212,101,74,0.07);border:1px solid rgba(212,101,74,0.18);border-radius:12px;padding:12px 20px;margin-bottom:1.5rem;width:fit-content">
            <span class="material-symbols-outlined" style="font-size:18px;color:#D4654A;font-variation-settings:'FILL' 1">location_on</span>
            <div>
              <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em">Station Location</p>
              <p style="font-size:var(--font-md);font-weight:700;color:#1e293b">${sel.name} • Bay 04</p>
            </div>
          </div>

          <!-- Map (Leaflet) -->
          <div id="sc-station-map" style="width:100%;height:240px;border-radius:12px;overflow:hidden;border:2px solid #e2e8f0;box-shadow:inset 0 2px 8px rgba(0,0,0,0.04);margin-bottom:1.5rem;z-index:1"></div>

          <!-- Station Footer Stats -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:16px;align-items:center;padding-top:1rem;border-top:1px solid #f1f5f9">
            <div>
              <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Distance</p>
              <p style="font-size:var(--font-md);font-weight:600;color:#1e293b;display:flex;align-items:center;gap:4px">${icon('navigation', '14px', 'color:#D4654A')} On-site</p>
            </div>
            <div>
              <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Status</p>
              <p style="font-size:var(--font-md);font-weight:600;color:#16a34a;display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:#22c55e"></span> Operational</p>
            </div>
            <div>
              <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Availability</p>
              <p style="font-size:var(--font-md);font-weight:600;color:#1e293b"><span style="color:#D4654A;font-weight:700">8</span> / 12 Packs</p>
            </div>
            <button id="view-feed-btn" style="color:#D4654A;font-size:var(--font-sm);font-weight:600;cursor:pointer;background:none;border:none">View Feed</button>
          </div>
        </div>
      </div>

      <!-- Right: Incoming Return + New Assignment -->
      <div style="display:flex;flex-direction:column;gap:1.5rem">

        <!-- Incoming Return -->
        <div class="card" style="padding:2rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
            <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b">INCOMING RETURN</h3>
            <span style="padding:6px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-sm);font-weight:600;color:#64748b">A-04</span>
          </div>

          <!-- Rider Info -->
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid #f1f5f9">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(212,101,74,0.10);display:flex;align-items:center;justify-content:center">
              <span class="material-symbols-outlined" style="font-size:24px;color:#D4654A;font-variation-settings:'FILL' 1">person</span>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <h4 style="font-size:var(--font-lg);font-weight:700;color:#1e293b">Arjun Sharma</h4>
              </div>
              <p style="font-size:var(--font-sm);color:#64748b;display:flex;align-items:center;gap:4px">
                ID: <span style="font-family:monospace">#RIDER-9921</span>
              </p>
              <p style="font-size:var(--font-sm);color:#D4654A;font-weight:500;display:flex;align-items:center;gap:4px;margin-top:2px">
                ${icon('verified', '14px', 'color:#D4654A')} Verified Member
              </p>
            </div>
          </div>

          <!-- Returning Pack -->
          <div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:12px;padding:1.5rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <p style="font-size:var(--font-sm);font-weight:600;color:#1e293b;display:flex;align-items:center;gap:6px">
                ${icon('battery_alert', '16px', 'color:#64748b')} RETURNING PACK
              </p>
              <span style="font-family:monospace;font-size:10px;color:#94a3b8;padding:2px 8px;border:1px solid #e2e8f0;border-radius:4px">SN: BAT-882-A</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px">
              <h3 style="font-size:2.25rem;font-weight:700;color:#1e293b">12%</h3>
              <span style="font-size:var(--font-md);font-weight:700;color:#ef4444">Low Charge</span>
            </div>
            <div style="width:100%;height:6px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden">
              <div style="width:12%;height:100%;background:#ef4444;border-radius:var(--radius-full)"></div>
            </div>
          </div>
        </div>

        <!-- New Assignment -->
        <div class="card" style="padding:1.25rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.875rem">
            <h3 style="font-size:var(--font-xl);font-weight:700;color:#1e293b">NEW ASSIGNMENT</h3>
            <span style="padding:4px 12px;border-radius:var(--radius-md);font-size:var(--font-sm);font-weight:700;background:#D4654A;color:white">B-02</span>
          </div>

          <!-- Compact SOC banner -->
          <div style="display:flex;align-items:center;gap:14px;background:rgba(212,101,74,0.07);border:1px solid rgba(212,101,74,0.18);border-radius:12px;padding:12px 16px;margin-bottom:0.875rem">
            <span class="material-symbols-outlined" style="font-size:32px;color:#D4654A;font-variation-settings:'FILL' 1">battery_full</span>
            <div>
              <div style="display:flex;align-items:baseline;gap:8px">
                <span style="font-size:1.75rem;font-weight:700;color:#1e293b">98%</span>
                <span style="font-size:var(--font-sm);font-weight:700;color:#16a34a">Ready</span>
              </div>
              <p style="font-size:10px;color:#94a3b8;font-weight:600;margin-top:2px">L-ION · Slot B-02</p>
            </div>
          </div>

          <!-- Assignment Details -->
          <div style="display:flex;flex-direction:column;gap:8px;padding-top:0.875rem;border-top:1px solid #f1f5f9">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:var(--font-sm);color:#64748b">Assignment Slot</span>
              <span style="font-size:var(--font-sm);font-weight:700;color:#1e293b">B-02</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:var(--font-sm);color:#64748b">Health (SOH)</span>
              <span style="font-size:var(--font-sm);font-weight:700;color:#16a34a;display:flex;align-items:center;gap:4px">${icon('check_circle', '14px', 'color:#16a34a')} 100%</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:var(--font-sm);color:#64748b">Est. Range</span>
              <span style="font-size:var(--font-sm);font-weight:700;color:#1e293b">85 km</span>
            </div>
          </div>
        </div>

        <!-- Confirm Button -->
        <button id="authorize-swap-btn" style="width:100%;padding:16px;border-radius:var(--radius-md);background:#D4654A;color:white;font-size:var(--font-lg);font-weight:700;box-shadow:0 4px 16px rgba(212,101,74,0.30);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px" onmouseover="this.style.background='#c05a3f'" onmouseout="this.style.background='#D4654A'">
          ${icon('check_circle', '22px')} Authorize Swap
        </button>
      </div>
    </div>
  `;

  document.getElementById('authorize-swap-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('authorize-swap-btn');
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:22px;animation:spin 1s linear infinite">autorenew</span> Processing...';
    btn.style.background = '#64748b';
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:22px">check_circle</span> Swap Authorized!';
      btn.style.background = '#D4654A';
      showToast('✅ Swap completed successfully! Battery BAT-882-A returned, BAT-098-B assigned', 'success', 5000);
      setTimeout(() => location.hash = '#dashboard', 2500);
    }, 1500);
  });

  document.getElementById('view-feed-btn')?.addEventListener('click', () => {
    showToast('Station camera feed loading...', 'info');
  });

  // Leaflet map — selected station
  initConfirmMap('sc-station-map', sel.lat, sel.lng, `${sel.name} • Bay 04`);
}

function initConfirmMap(containerId, lat, lng, label) {
  function createMap() {
    const L = window.L;
    const mapEl = document.getElementById(containerId);
    if (!mapEl) return;
    mapEl.innerHTML = '';
    const map = L.map(mapEl, { zoomControl: false }).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const markerHtml = `<div style="width:26px;height:26px;background:#D4654A;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(212,101,74,0.5)"></div>`;
    const markerIcon = L.divIcon({ html: markerHtml, className: '', iconSize: [26, 26], iconAnchor: [13, 26] });
    L.marker([lat, lng], { icon: markerIcon }).addTo(map)
      .bindPopup(`<b style="color:#0f172a">${label}</b>`).openPopup();
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

// Spin animation for loading state
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }';
if (!document.querySelector('style[data-spin]')) {
  spinStyle.setAttribute('data-spin', '');
  document.head.appendChild(spinStyle);
}
