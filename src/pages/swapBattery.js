// ============================================
// Swap Battery / Initiate Swap Page (Electica - Coral Theme)
// ============================================
import { icon } from '../components/icons.js';
import { showToast } from '../utils/toast.js';
import { mockPods } from '../data/mockData.js';

export function renderSwapBattery(container) {
  // Real ready counts from actual pod data
  const ksReady = (mockPods['BSS-005'] || []).filter(p => p.status === 'ready').length;
  const wfReady = (mockPods['BSS-004'] || []).filter(p => p.status === 'ready').length;

  container.innerHTML = `
    <div style="padding-bottom:2rem">

      <!-- Breadcrumb -->
      <nav style="display:flex;align-items:center;gap:6px;margin-bottom:1.25rem;font-size:var(--font-sm)">
        <a onclick="location.hash='#dashboard'" style="color:#64748b;font-weight:500;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background 0.15s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">Dashboard</a>
        <span style="color:#cbd5e1">/</span>
        <a onclick="location.hash='#swap'" style="color:#D4654A;font-weight:600;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background 0.15s" onmouseover="this.style.background='rgba(212,101,74,0.08)'" onmouseout="this.style.background='transparent'">Initiate Swap</a>
      </nav>

      <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:2rem">

        <!-- Left Column: Vehicle Unit + Scan QR -->
        <div style="display:flex;flex-direction:column;gap:1.5rem">

          <!-- Vehicle Unit Card -->
          <div class="card" style="padding:2rem">
            <p style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Vehicle Unit</p>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
              <h2 style="font-size:1.75rem;font-weight:700;color:#1e293b">#EL-8842</h2>
              <span style="padding:4px 14px;border-radius:var(--radius-full);font-size:var(--font-sm);font-weight:700;background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0">Active</span>
            </div>

            <!-- Current Battery -->
            <div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:16px;padding:1.5rem;margin-bottom:1.5rem">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <span style="font-size:var(--font-md);font-weight:600;color:#1e293b">Current Battery</span>
                <span style="font-family:monospace;font-size:var(--font-sm);color:#94a3b8">BAT-8921</span>
              </div>
              <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px">
                <h3 style="font-size:3rem;font-weight:700;color:#1e293b">18%</h3>
                <span style="font-size:var(--font-md);font-weight:700;color:#ef4444">Critical</span>
              </div>
              <div style="width:100%;height:8px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden;margin-bottom:12px">
                <div style="width:18%;height:100%;background:#ef4444;border-radius:var(--radius-full)"></div>
              </div>
              <p style="font-size:var(--font-sm);color:#94a3b8;display:flex;align-items:center;gap:6px">
                ${icon('warning', '14px', 'color:#f59e0b')} Est. range: 4.2 km
              </p>
            </div>

            <!-- Health / Temp Pills -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border:1px solid #f1f5f9;border-radius:12px">
                ${icon('health_and_safety', '20px', 'color:#94a3b8')}
                <div>
                  <span style="font-size:var(--font-sm);color:#64748b">Health</span>
                  <p style="font-size:var(--font-lg);font-weight:700;color:#1e293b">94%</p>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border:1px solid #f1f5f9;border-radius:12px">
                ${icon('thermostat', '20px', 'color:#94a3b8')}
                <div>
                  <span style="font-size:var(--font-sm);color:#64748b">Temp</span>
                  <p style="font-size:var(--font-lg);font-weight:700;color:#1e293b">32°C</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Scan Station QR -->
          <div id="scan-qr-area" style="border:2px dashed #e2e8f0;border-radius:16px;padding:2.5rem;text-align:center;cursor:pointer;transition:border-color 0.2s" onmouseover="this.style.borderColor='rgba(212,101,74,0.4)'" onmouseout="this.style.borderColor='#e2e8f0'">
            <div style="width:56px;height:56px;margin:0 auto 16px;background:rgba(212,101,74,0.10);border-radius:12px;display:flex;align-items:center;justify-content:center">
              <span class="material-symbols-outlined" style="font-size:28px;color:#D4654A">qr_code_scanner</span>
            </div>
            <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:4px">Scan Station QR</h3>
            <p style="font-size:var(--font-md);color:#94a3b8">Scan code at the station to pair instantly</p>
          </div>
        </div>

        <!-- Right Column: Nearby Stations -->
        <div>
          <div style="margin-bottom:1.5rem">
            <h2 style="font-size:1.5rem;font-weight:700;color:#1e293b">Nearby Stations</h2>
            <p style="font-size:var(--font-md);color:#64748b;margin-top:4px">Select a station to reserve a swap slot.</p>
          </div>

          <!-- Station Cards (list view) -->
          <div id="sb-station-list">

            <!-- Station 1: Koramangala Hub (Recommended) -->
            <div class="card" style="padding:1.5rem;margin-bottom:1rem;border:1px solid rgba(212,101,74,0.2)">
              <div style="display:flex;align-items:flex-start;gap:16px">
                <div style="width:44px;height:44px;background:rgba(212,101,74,0.10);border:1px solid rgba(212,101,74,0.25);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span class="material-symbols-outlined" style="font-size:22px;color:#D4654A;font-variation-settings:'FILL' 1">ev_station</span>
                </div>
                <div style="flex:1">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                    <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b">Koramangala Hub</h3>
                    <span style="padding:4px 12px;border-radius:var(--radius-full);font-size:10px;font-weight:700;background:#D4654A;color:white">RECOMMENDED</span>
                  </div>
                  <p style="font-size:var(--font-sm);color:#94a3b8;display:flex;align-items:center;gap:8px">
                    ${icon('navigation', '12px', 'color:#D4654A')} 0.6 km <span style="color:#cbd5e1">•</span> 3 mins drive
                  </p>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-top:1rem;align-items:end">
                <div>
                  <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Status</p>
                  <p style="font-size:var(--font-md);font-weight:600;color:#16a34a;display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:#22c55e"></span> Available</p>
                </div>
                <div>
                  <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Batteries</p>
                  <p style="font-size:var(--font-md);font-weight:600;color:#1e293b">${ksReady} Ready</p>
                </div>
                <div>
                  <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Queue</p>
                  <p style="font-size:var(--font-md);font-weight:600;color:#1e293b">Empty</p>
                </div>
                <button class="sb-reserve-btn" data-station="Koramangala Hub" data-location="Koramangala, Bengaluru" data-lat="12.9352" data-lng="77.6245" style="padding:10px 24px;border-radius:var(--radius-md);background:#D4654A;color:white;font-size:var(--font-md);font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(212,101,74,0.25);cursor:pointer;transition:all 0.2s;border:none" onmouseover="this.style.background='#c05a3f'" onmouseout="this.style.background='#D4654A'">
                  Reserve Slot
                </button>
              </div>
            </div>

            <!-- Station 2: Whitefield Station (Busy) -->
            <div class="card" style="padding:1.5rem;margin-bottom:1rem;border:1px solid #e2e8f0">
              <div style="display:flex;align-items:flex-start;gap:16px">
                <div style="width:44px;height:44px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span class="material-symbols-outlined" style="font-size:22px;color:#64748b;font-variation-settings:'FILL' 1">ev_station</span>
                </div>
                <div style="flex:1">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                    <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b">Whitefield Station</h3>
                    <span style="padding:4px 12px;border-radius:var(--radius-full);font-size:10px;font-weight:700;background:#fef2f2;color:#ef4444;border:1px solid #fecaca">Busy</span>
                  </div>
                  <p style="font-size:var(--font-sm);color:#94a3b8;display:flex;align-items:center;gap:8px">
                    ${icon('navigation', '12px', 'color:#D4654A')} 2.1 km <span style="color:#cbd5e1">•</span> 8 mins drive
                  </p>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:1rem;align-items:end">
                <div>
                  <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Wait Time</p>
                  <p style="font-size:var(--font-md);font-weight:600;color:#1e293b">~2 min</p>
                </div>
                <div>
                  <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Batteries</p>
                  <p style="font-size:var(--font-md);font-weight:600;color:#1e293b">${wfReady} Ready</p>
                </div>
                <button class="sb-reserve-btn" data-station="Whitefield Station" data-location="Whitefield, Bengaluru" data-lat="12.9698" data-lng="77.7500" class="btn btn-outline" style="padding:10px 24px;cursor:pointer;border-radius:var(--radius-md);background:white;color:#D4654A;border:1.5px solid #D4654A;font-size:var(--font-md);font-weight:600;transition:all 0.2s" onmouseover="this.style.background='rgba(212,101,74,0.07)'" onmouseout="this.style.background='white'">Select</button>
              </div>
            </div>

            <!-- Station 3: Indiranagar Depot (Maintenance) -->
            <div class="card" style="padding:1.5rem;margin-bottom:1.5rem;border:1px solid #e2e8f0;opacity:0.7">
              <div style="display:flex;align-items:flex-start;gap:16px">
                <div style="width:44px;height:44px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span class="material-symbols-outlined" style="font-size:22px;color:#94a3b8;font-variation-settings:'FILL' 1">ev_station</span>
                </div>
                <div style="flex:1">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                    <h3 style="font-size:var(--font-lg);font-weight:700;color:#64748b">Indiranagar Depot</h3>
                    <span style="padding:4px 12px;border-radius:var(--radius-full);font-size:10px;font-weight:700;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0">Maintenance</span>
                  </div>
                  <p style="font-size:var(--font-sm);color:#94a3b8;display:flex;align-items:center;gap:8px">
                    ${icon('navigation', '12px', 'color:#94a3b8')} 4.5 km <span style="color:#cbd5e1">•</span> 15 mins drive
                  </p>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:1rem;align-items:end">
                <div>
                  <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Status</p>
                  <p style="font-size:var(--font-md);font-weight:500;color:#94a3b8">Closed</p>
                </div>
                <div>
                  <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Batteries</p>
                  <p style="font-size:var(--font-md);font-weight:500;color:#94a3b8">0 Ready</p>
                </div>
                <button style="padding:10px 24px;opacity:0.5;cursor:not-allowed;border-radius:var(--radius-md);background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0;font-size:var(--font-md);font-weight:600" disabled>Unavailable</button>
              </div>
            </div>
          </div>

          <!-- Live Coverage Map -->
          <div class="card" style="padding:1.5rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
              <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:8px">
                <span style="background:rgba(212,101,74,0.10);padding:4px;border-radius:6px;display:flex">${icon('map', '18px', 'color:#D4654A')}</span>
                Live Coverage Map
              </h3>
            </div>
            <div id="sb-coverage-map" style="width:100%;height:200px;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;z-index:1"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('scan-qr-area')?.addEventListener('click', () => {
    showToast('QR scanner activated - point camera at station code', 'info');
  });

  // Reserve / Select buttons - store selected station + navigate
  document.querySelectorAll('.sb-reserve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.__swapStation = {
        name:     btn.dataset.station,
        location: btn.dataset.location,
        lat:      parseFloat(btn.dataset.lat),
        lng:      parseFloat(btn.dataset.lng),
      };
      location.hash = '#swap-confirm';
    });
  });

  initCoverageMap('sb-coverage-map', false);
}

function initCoverageMap(containerId, large) {
  const stations = [
    { lat: 12.9352, lng: 77.6245, name: 'Koramangala Hub',    status: 'available' },
    { lat: 12.9698, lng: 77.7500, name: 'Whitefield Station', status: 'busy' },
    { lat: 12.9716, lng: 77.5946, name: 'Indiranagar Depot',  status: 'maintenance' },
  ];

  function createMap() {
    const L = window.L;
    const mapEl = document.getElementById(containerId);
    if (!mapEl) return;
    mapEl.innerHTML = '';
    const map = L.map(mapEl, { zoomControl: large }).setView([12.9500, 77.6600], large ? 13 : 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    if (!large) L.control.zoom({ position: 'bottomright' }).addTo(map);
    stations.forEach(s => {
      const clr = s.status === 'available' ? '#D4654A' : s.status === 'busy' ? '#f59e0b' : '#94a3b8';
      const markerHtml = `<div style="width:22px;height:22px;background:${clr};border:2.5px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.25)"></div>`;
      const markerIcon = L.divIcon({ html: markerHtml, className: '', iconSize: [22, 22], iconAnchor: [11, 22] });
      L.marker([s.lat, s.lng], { icon: markerIcon }).addTo(map).bindPopup(`<b style="color:#0f172a">${s.name}</b>`);
    });
  }

  if (window.L) { createMap(); return; }
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css'; link.rel = 'stylesheet';
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
