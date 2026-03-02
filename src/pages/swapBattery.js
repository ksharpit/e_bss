// ============================================
// Swap Battery / Initiate Swap Page (Electica Exact)
// Matches swap_battery reference screenshot
// ============================================
import { icon } from '../components/icons.js';
import { showToast } from '../utils/toast.js';

export function renderSwapBattery(container) {
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:2rem;padding-bottom:2rem">
      
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
              <span style="font-family:monospace;font-size:var(--font-sm);color:#94a3b8">BAT-8921-X</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px">
              <h3 style="font-size:3rem;font-weight:700;color:#1e293b">18%</h3>
              <span style="font-size:var(--font-md);font-weight:700;color:#ef4444">Critical</span>
            </div>
            <div style="width:100%;height:8px;background:#f1f5f9;border-radius:var(--radius-full);overflow:hidden;margin-bottom:12px">
              <div style="width:18%;height:100%;background:#ef4444;border-radius:var(--radius-full)"></div>
            </div>
            <p style="font-size:var(--font-sm);color:#94a3b8;display:flex;align-items:center;gap:6px">
              ${icon('warning', '14px', 'color:#f59e0b')} Est. range: 4.2 miles
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
        <div id="scan-qr-area" style="border:2px dashed #e2e8f0;border-radius:16px;padding:2.5rem;text-align:center;cursor:pointer;transition:border-color 0.2s" onmouseover="this.style.borderColor='#93c5fd'" onmouseout="this.style.borderColor='#e2e8f0'">
          <div style="width:56px;height:56px;margin:0 auto 16px;background:#f1f5f9;border-radius:12px;display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="font-size:28px;color:#64748b">qr_code_scanner</span>
          </div>
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:4px">Scan Station QR</h3>
          <p style="font-size:var(--font-md);color:#94a3b8">Scan code at the station to pair instantly</p>
        </div>
      </div>

      <!-- Right Column: Nearby Stations -->
      <div>
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.5rem">
          <div>
            <h2 style="font-size:1.5rem;font-weight:700;color:#1e293b">Nearby Stations</h2>
            <p style="font-size:var(--font-md);color:#64748b;margin-top:4px">Select a station to reserve a swap slot.</p>
          </div>
          <div style="display:flex;border:1px solid #e2e8f0;border-radius:var(--radius-md);overflow:hidden">
            <button style="padding:8px 16px;font-size:var(--font-sm);font-weight:600;background:white;color:#1e293b;border:none;cursor:pointer;border-right:1px solid #e2e8f0">List View</button>
            <button style="padding:8px 16px;font-size:var(--font-sm);font-weight:500;background:#f8fafc;color:#64748b;border:none;cursor:pointer">Map View</button>
          </div>
        </div>

        <!-- Station 1: Koramangala Hub (Recommended) -->
        <div class="card" style="padding:1.5rem;margin-bottom:1rem;border:1px solid #e2e8f0">
          <div style="display:flex;align-items:flex-start;gap:16px">
            <div style="width:44px;height:44px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span class="material-symbols-outlined" style="font-size:22px;color:#2563eb;font-variation-settings:'FILL' 1">ev_station</span>
            </div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b">Koramangala Hub</h3>
                <span style="padding:4px 12px;border-radius:var(--radius-full);font-size:10px;font-weight:700;background:#1e40af;color:white">RECOMMENDED</span>
              </div>
              <p style="font-size:var(--font-sm);color:#94a3b8;display:flex;align-items:center;gap:8px">
                ${icon('navigation', '12px', 'color:#2563eb')} 0.6 km <span style="color:#cbd5e1">•</span> 3 mins drive
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
              <p style="font-size:var(--font-md);font-weight:600;color:#1e293b">12 Ready</p>
            </div>
            <div>
              <p style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:2px">Queue</p>
              <p style="font-size:var(--font-md);font-weight:600;color:#1e293b">Empty</p>
            </div>
            <button onclick="location.hash='#swap-confirm'" style="padding:10px 24px;border-radius:var(--radius-md);background:#2563eb;color:white;font-size:var(--font-md);font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(37,99,235,0.2);cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
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
                ${icon('navigation', '12px', 'color:#2563eb')} 2.1 km <span style="color:#cbd5e1">•</span> 8 mins drive
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
              <p style="font-size:var(--font-md);font-weight:600;color:#1e293b">4 Ready</p>
            </div>
            <button class="btn btn-outline" style="padding:10px 24px;cursor:pointer" onclick="location.hash='#swap-confirm'">Select</button>
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
            <button class="btn btn-outline" style="padding:10px 24px;opacity:0.5;cursor:not-allowed" disabled>Unavailable</button>
          </div>
        </div>

        <!-- Live Coverage Map -->
        <div class="card" style="padding:1.5rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:8px">
              <span style="background:#eff6ff;padding:4px;border-radius:6px;display:flex">${icon('map', '18px', 'color:#2563eb')}</span>
              Live Coverage Map
            </h3>
            <button style="color:#2563eb;font-size:var(--font-sm);font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px">Expand ${icon('open_in_new', '14px', 'color:#2563eb')}</button>
          </div>
          <div style="width:100%;aspect-ratio:16/7;border-radius:12px;overflow:hidden;background:#f1f5f9;border:1px solid #e2e8f0;position:relative">
            <div style="position:absolute;top:35%;left:45%;width:12px;height:12px;border-radius:50%;background:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,0.2);animation:pulse 2s infinite;z-index:2"></div>
            <div style="position:absolute;top:25%;left:60%;width:8px;height:8px;border-radius:50%;background:#94a3b8;z-index:2"></div>
            <div style="position:absolute;top:55%;left:70%;width:8px;height:8px;border-radius:50%;background:#94a3b8;z-index:2"></div>
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 30%,#f1f5f9 60%,#e2e8f0 100%);opacity:0.8"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Wire interactive elements
  document.getElementById('scan-qr-area')?.addEventListener('click', () => {
    showToast('QR scanner activated — point camera at station code', 'info');
  });

  // View toggle tabs
  container.querySelectorAll('[style*="border-right:1px solid #e2e8f0"], [style*="background:#f8fafc"]').forEach(btn => {
    if (btn.tagName === 'BUTTON' && (btn.textContent.includes('List') || btn.textContent.includes('Map'))) {
      btn.addEventListener('click', () => {
        showToast(`Switched to ${btn.textContent.trim()}`, 'info');
      });
    }
  });
}
