// ============================================
// Header Component (Electica)
// ============================================
import { icon, ICONS } from './icons.js';
import { showToast } from '../utils/toast.js';
import { apiFetch } from '../utils/apiFetch.js';

const pageTitles = {
  dashboard:        { title: 'Dashboard' },
  stations:         { title: 'Stations' },
  station:          { title: 'Station Detail' },
  revenue:          { title: 'Revenue' },
  inventory:        { title: 'Batteries' },
  'battery-detail': { title: 'Battery Analytics' },
  swap:             { title: 'Swap Battery' },
  'swap-confirm':   { title: 'Swap Confirmation' },
  users:            { title: 'Users' },
  'user-detail':    { title: 'User Detail' },
  settings:         { title: 'Settings' },
  support:          { title: 'Support' },
};

export function renderHeader() {
  const header = document.getElementById('header');
  header.innerHTML = `
    <div class="header-left">
      <h2 class="header-title" id="header-page-title">Dashboard</h2>
      <div class="header-divider"></div>
      <div class="header-search">
        ${icon(ICONS.search)}
        <input type="text" placeholder="Search infrastructure..." />
      </div>
    </div>
    <div class="header-right">
      <button class="btn-header btn-header-outline" id="header-export-btn">
        ${icon(ICONS.download)} Export
      </button>
      <button class="btn-header btn-header-primary" id="header-new-station-btn">
        ${icon('add')} New Station
      </button>
    </div>
  `;

  updateHeaderTitle();
  window.addEventListener('hashchange', updateHeaderTitle);

  // Wire header export - context-aware CSV export
  document.getElementById('header-export-btn')?.addEventListener('click', async () => {
    const hash = (window.location.hash || '#dashboard').split('/')[0].replace('#', '');
    try {
      const { downloadCsv, downloadMultiSectionCsv } = await import('../utils/csv.js');
      if (hash === 'dashboard') {
        // Comprehensive multi-section export
        showToast('Preparing full report...', 'info');
        const [stations, batteries, users, swaps, transactions] = await Promise.all([
          apiFetch('/stations').then(r => r.json()),
          apiFetch('/batteries').then(r => r.json()),
          apiFetch('/users').then(r => r.json()),
          apiFetch('/swaps').then(r => r.json()),
          apiFetch('/transactions').then(r => r.json()),
        ]);

        const todayStr = new Date().toISOString().slice(0, 10);
        const todaySwaps = swaps.filter(s => s.timestamp?.startsWith(todayStr));

        // Per-station revenue
        stations.forEach(st => {
          const stSwaps = swaps.filter(s => s.stationId === st.id);
          st._totalSwaps = stSwaps.length;
          st._totalRevenue = stSwaps.length * 65;
          st._swapsToday = todaySwaps.filter(s => s.stationId === st.id).length;
          st._revToday = st._swapsToday * 65;
        });

        const totalSwapRev = swaps.reduce((s, sw) => s + (sw.amount || 0), 0);
        const deposits = transactions.filter(t => t.type === 'security_deposit' && t.status === 'completed');
        const totalDepRev = deposits.reduce((s, t) => s + (t.amount || 0), 0);

        const sections = [
          // 1. Summary / Insights
          {
            title: 'SUMMARY',
            headers: ['Metric', 'Value'],
            rows: [
              ['Total Stations', stations.length],
              ['Online Stations', stations.filter(s => s.status === 'online').length],
              ['Total Batteries', batteries.length],
              ['Active Batteries', batteries.filter(b => b.status !== 'fault' && b.status !== 'retired').length],
              ['Faulty Batteries', batteries.filter(b => b.status === 'fault').length],
              ['Total Users', users.length],
              ['KYC Verified', users.filter(u => u.kycStatus === 'verified').length],
              ['KYC Pending', users.filter(u => u.kycStatus === 'pending').length],
              ['KYC Rejected', users.filter(u => u.kycStatus === 'rejected').length],
              ['Total Swaps', swaps.length],
              ['Swaps Today', todaySwaps.length],
              ['Total Swap Revenue', totalSwapRev],
              ['Total Deposit Revenue', totalDepRev],
              ['Total Revenue', totalSwapRev + totalDepRev],
              ['Report Generated', new Date().toLocaleString('en-IN')],
            ],
          },
          // 2. Stations
          {
            title: 'STATIONS',
            headers: ['Station ID', 'Name', 'Location', 'Status', 'Pods', 'Uptime %', 'Total Swaps', 'Total Revenue', 'Swaps Today', 'Revenue Today'],
            rows: stations.map(s => [
              s.id, s.name, s.location, s.status, s.pods, s.uptime,
              s._totalSwaps, s._totalRevenue, s._swapsToday, s._revToday,
            ]),
          },
          // 3. Batteries
          {
            title: 'BATTERIES',
            headers: ['Battery ID', 'Status', 'SOC %', 'Health %', 'Temperature', 'Cycles', 'Station ID', 'Assigned To'],
            rows: batteries.map(b => [
              b.id, b.status, b.soc, b.health, b.temperature || '',
              b.cycleCount || 0, b.stationId || '', b.assignedTo || '',
            ]),
          },
          // 4. Customers
          {
            title: 'CUSTOMERS',
            headers: ['User ID', 'Name', 'Phone', 'Vehicle', 'Vehicle Reg', 'KYC Status', 'Battery ID', 'Swap Count', 'Total Spent', 'Registered At'],
            rows: users.map(u => [
              u.id, u.name, u.phone, u.vehicle, u.vehicleId || '',
              u.kycStatus, u.batteryId || '', u.swapCount || 0,
              u.totalSpent || 0, u.registeredAt || '',
            ]),
          },
          // 5. Revenue by Station
          {
            title: 'REVENUE BY STATION',
            headers: ['Station ID', 'Station Name', 'Total Swaps', 'Total Revenue', 'Avg Revenue/Day', 'Share %'],
            rows: [...stations].sort((a, b) => b._totalRevenue - a._totalRevenue).map(s => {
              const totalAll = stations.reduce((sum, st) => sum + st._totalRevenue, 0);
              return [
                s.id, s.name, s._totalSwaps, s._totalRevenue,
                s._totalSwaps > 0 ? Math.round(s._totalRevenue / 30) : 0,
                totalAll > 0 ? Math.round(s._totalRevenue / totalAll * 100) + '%' : '0%',
              ];
            }),
          },
        ];

        downloadMultiSectionCsv('electica-full-report', sections);
      } else if (hash === 'stations') {
        const stations = await apiFetch('/stations').then(r => r.json());
        downloadCsv('stations', ['ID', 'Name', 'Location', 'Status', 'Pods', 'Uptime %'], stations.map(s => [s.id, s.name, s.location, s.status, s.pods, s.uptime]));
      } else if (hash === 'inventory') {
        const bats = await apiFetch('/batteries').then(r => r.json());
        downloadCsv('batteries', ['ID', 'Status', 'SOC', 'Health', 'Station', 'Assigned To'], bats.map(b => [b.id, b.status, b.soc, b.health, b.stationId || '', b.assignedTo || '']));
      } else if (hash === 'users') {
        const usrs = await apiFetch('/users').then(r => r.json());
        downloadCsv('users', ['ID', 'Name', 'Phone', 'Vehicle', 'Swaps', 'KYC'], usrs.map(u => [u.id, u.name, u.phone, u.vehicle, u.swapCount, u.kycStatus]));
      } else if (hash === 'revenue') {
        const sts = await apiFetch('/stations').then(r => r.json());
        downloadCsv('revenue', ['Station', 'Revenue Today', 'Revenue Month', 'Swaps Month'], sts.map(s => [s.name, s.revenueToday, s.revenueMonth, s.totalSwapsMonth]));
      } else {
        showToast('Export not available for this page', 'info');
        return;
      }
      showToast('CSV exported successfully', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  });
  document.getElementById('header-new-station-btn')?.addEventListener('click', () => {
    showNewStationModal();
  });

  // Header search
  const searchInput = document.querySelector('.header-search input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        const q = searchInput.value.trim().toUpperCase();
        if (q.startsWith('BSS') || q.startsWith('STA')) {
          location.hash = '#station/' + (q.startsWith('BSS') ? q : 'BSS-001');
        } else if (q.startsWith('BAT')) {
          location.hash = '#battery-detail/' + q;
        } else {
          showToast(`Searching for "${searchInput.value.trim()}"...`, 'info');
        }
        searchInput.value = '';
      }
    });
  }
}

function updateHeaderTitle() {
  const hash = window.location.hash || '#dashboard';
  const page = hash.split('/')[0].replace('#', '');
  const config = pageTitles[page] || pageTitles.dashboard;
  const titleEl = document.getElementById('header-page-title');
  if (titleEl) titleEl.textContent = config.title;
}

const CITY_DATA = {
  'Andhra Pradesh':       [{ name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
                           { name: 'Vijayawada',    lat: 16.5062, lng: 80.6480 },
                           { name: 'Tirupati',      lat: 13.6288, lng: 79.4192 }],
  'Arunachal Pradesh':    [{ name: 'Itanagar',      lat: 27.0844, lng: 93.6053 }],
  'Assam':                [{ name: 'Guwahati',      lat: 26.1445, lng: 91.7362 },
                           { name: 'Dibrugarh',     lat: 27.4728, lng: 94.9120 }],
  'Bihar':                [{ name: 'Patna',          lat: 25.6093, lng: 85.1376 },
                           { name: 'Gaya',           lat: 24.7955, lng: 84.9994 }],
  'Chhattisgarh':         [{ name: 'Raipur',         lat: 21.2514, lng: 81.6296 },
                           { name: 'Bilaspur',       lat: 22.0797, lng: 82.1409 }],
  'Delhi NCR':            [{ name: 'New Delhi',      lat: 28.6139, lng: 77.2090 },
                           { name: 'Gurugram',       lat: 28.4595, lng: 77.0266 },
                           { name: 'Noida',          lat: 28.5355, lng: 77.3910 }],
  'Goa':                  [{ name: 'Panaji',         lat: 15.4909, lng: 73.8278 },
                           { name: 'Margao',         lat: 15.2832, lng: 73.9862 }],
  'Gujarat':              [{ name: 'Ahmedabad',      lat: 23.0225, lng: 72.5714 },
                           { name: 'Surat',          lat: 21.1702, lng: 72.8311 },
                           { name: 'Vadodara',       lat: 22.3072, lng: 73.1812 },
                           { name: 'Rajkot',         lat: 22.3039, lng: 70.8022 }],
  'Haryana':              [{ name: 'Chandigarh',     lat: 30.7333, lng: 76.7794 },
                           { name: 'Faridabad',      lat: 28.4089, lng: 77.3178 },
                           { name: 'Karnal',         lat: 29.6857, lng: 76.9905 }],
  'Himachal Pradesh':     [{ name: 'Shimla',         lat: 31.1048, lng: 77.1734 },
                           { name: 'Manali',         lat: 32.2396, lng: 77.1887 }],
  'Jharkhand':            [{ name: 'Ranchi',         lat: 23.3441, lng: 85.3096 },
                           { name: 'Jamshedpur',     lat: 22.8046, lng: 86.2029 }],
  'Karnataka':            [{ name: 'Bengaluru',      lat: 12.9716, lng: 77.5946 },
                           { name: 'Mysuru',         lat: 12.2958, lng: 76.6394 },
                           { name: 'Hubli',          lat: 15.3647, lng: 75.1240 },
                           { name: 'Mangaluru',      lat: 12.9141, lng: 74.8560 }],
  'Kerala':               [{ name: 'Kochi',          lat: 9.9312,  lng: 76.2673 },
                           { name: 'Trivandrum',     lat: 8.5241,  lng: 76.9366 },
                           { name: 'Kozhikode',      lat: 11.2588, lng: 75.7804 }],
  'Madhya Pradesh':       [{ name: 'Bhopal',         lat: 23.2599, lng: 77.4126 },
                           { name: 'Indore',         lat: 22.7196, lng: 75.8577 },
                           { name: 'Jabalpur',       lat: 23.1815, lng: 79.9864 }],
  'Maharashtra':          [{ name: 'Mumbai',         lat: 19.0760, lng: 72.8777 },
                           { name: 'Pune',           lat: 18.5204, lng: 73.8567 },
                           { name: 'Nagpur',         lat: 21.1458, lng: 79.0882 },
                           { name: 'Nashik',         lat: 19.9975, lng: 73.7898 }],
  'Manipur':              [{ name: 'Imphal',         lat: 24.8170, lng: 93.9368 }],
  'Meghalaya':            [{ name: 'Shillong',       lat: 25.5788, lng: 91.8933 }],
  'Mizoram':              [{ name: 'Aizawl',         lat: 23.7271, lng: 92.7176 }],
  'Nagaland':             [{ name: 'Dimapur',        lat: 25.7069, lng: 93.7273 },
                           { name: 'Kohima',         lat: 25.6751, lng: 94.1086 }],
  'Odisha':               [{ name: 'Bhubaneswar',    lat: 20.2961, lng: 85.8245 },
                           { name: 'Cuttack',        lat: 20.4625, lng: 85.8830 }],
  'Punjab':               [{ name: 'Ludhiana',       lat: 30.9010, lng: 75.8573 },
                           { name: 'Amritsar',       lat: 31.6340, lng: 74.8723 },
                           { name: 'Jalandhar',      lat: 31.3260, lng: 75.5762 }],
  'Rajasthan':            [{ name: 'Jaipur',         lat: 26.9124, lng: 75.7873 },
                           { name: 'Jodhpur',        lat: 26.2389, lng: 73.0243 },
                           { name: 'Udaipur',        lat: 24.5854, lng: 73.7125 }],
  'Sikkim':               [{ name: 'Gangtok',        lat: 27.3389, lng: 88.6065 }],
  'Tamil Nadu':           [{ name: 'Chennai',        lat: 13.0827, lng: 80.2707 },
                           { name: 'Coimbatore',     lat: 11.0168, lng: 76.9558 },
                           { name: 'Madurai',        lat: 9.9252,  lng: 78.1198 }],
  'Telangana':            [{ name: 'Hyderabad',      lat: 17.3850, lng: 78.4867 },
                           { name: 'Warangal',       lat: 17.9784, lng: 79.5941 }],
  'Tripura':              [{ name: 'Agartala',       lat: 23.8315, lng: 91.2868 }],
  'Uttar Pradesh':        [{ name: 'Lucknow',        lat: 26.8467, lng: 80.9462 },
                           { name: 'Varanasi',       lat: 25.3176, lng: 82.9739 },
                           { name: 'Kanpur',         lat: 26.4499, lng: 80.3319 },
                           { name: 'Agra',           lat: 27.1767, lng: 78.0081 }],
  'Uttarakhand':          [{ name: 'Dehradun',       lat: 30.3165, lng: 78.0322 },
                           { name: 'Haridwar',       lat: 29.9457, lng: 78.1642 }],
  'West Bengal':          [{ name: 'Kolkata',        lat: 22.5726, lng: 88.3639 },
                           { name: 'Siliguri',       lat: 26.7271, lng: 88.3953 }],
  'Jammu & Kashmir':      [{ name: 'Srinagar',       lat: 34.0837, lng: 74.7973 },
                           { name: 'Jammu',          lat: 32.7266, lng: 74.8570 }],
  'Ladakh':               [{ name: 'Leh',            lat: 34.1526, lng: 77.5771 }],
  'Puducherry':           [{ name: 'Puducherry',     lat: 11.9416, lng: 79.8083 }],
  'Andaman & Nicobar':    [{ name: 'Port Blair',     lat: 11.6234, lng: 92.7265 }],
  'Chandigarh':           [{ name: 'Chandigarh',     lat: 30.7333, lng: 76.7794 }],
};

// Map Nominatim state names → our CITY_DATA keys
const STATE_ALIASES = {
  'national capital territory of delhi': 'Delhi NCR',
  'delhi': 'Delhi NCR',
  'nct of delhi': 'Delhi NCR',
  'jammu and kashmir': 'Jammu & Kashmir',
  'andaman and nicobar islands': 'Andaman & Nicobar',
  'andaman and nicobar': 'Andaman & Nicobar',
  'dadra and nagar haveli and daman and diu': 'Gujarat',
  'the government of national capital territory of delhi': 'Delhi NCR',
};

// Shared input style
const nsInput = `width:100%;padding:9px 12px;border:1.5px solid var(--border-color,#e2e8f0);border-radius:10px;font-size:var(--font-sm,13px);font-family:inherit;color:var(--text-primary,#0f172a);background:var(--bg-input,#fff);outline:none;transition:border-color 0.15s,box-shadow 0.15s;box-sizing:border-box`;
const nsFocus = `onfocus="this.style.borderColor='#D4654A';this.style.boxShadow='0 0 0 3px rgba(212,101,74,0.08)'" onblur="this.style.borderColor='var(--border-color,#e2e8f0)';this.style.boxShadow='none'"`;
const nsLabel = `font-size:var(--font-xs,11px);font-weight:700;color:var(--text-label,#64748b);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:5px`;

export function showNewStationModal(editStation = null) {
  const isEdit = !!editStation;
  document.getElementById('new-station-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'new-station-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: '9999',
  });

  overlay.innerHTML = `
    <div style="background:var(--bg-card,#fff);border-radius:16px;width:700px;max-width:95vw;box-shadow:0 24px 64px rgba(0,0,0,0.18);overflow:hidden;max-height:92vh;display:flex;flex-direction:column">
      <!-- Header -->
      <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--border-light,#e2e8f0);display:flex;align-items:center;gap:10px;flex-shrink:0">
        <span style="background:rgba(212,101,74,0.10);padding:5px;border-radius:8px;display:flex">
          <span class="material-symbols-outlined" style="font-size:18px;color:#D4654A;font-variation-settings:'FILL' 1">${isEdit ? 'edit_square' : 'add_business'}</span>
        </span>
        <h3 style="font-size:var(--font-md,15px);font-weight:700;color:var(--text-primary,#0f172a);flex:1">${isEdit ? 'Edit Station' : 'Set Up New Station'}</h3>
        <button id="new-station-close" style="background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;display:flex" onmouseover="this.style.background='var(--bg-hover-row,#f1f5f9)'" onmouseout="this.style.background='none'">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--text-muted,#94a3b8)">close</span>
        </button>
      </div>

      <!-- Body: Two columns -->
      <div style="display:flex;gap:0;flex:1;overflow:auto">
        <!-- Left: Form -->
        <div style="flex:1;padding:1.25rem;display:flex;flex-direction:column;gap:12px;min-width:0">
          <label style="display:block">
            <span style="${nsLabel}">Station Name</span>
            <input id="ns-name" type="text" placeholder="e.g. Hebbal Hub Station" value="${isEdit ? editStation.name : ''}" style="${nsInput}" ${nsFocus} />
          </label>
          <div style="display:flex;gap:10px">
            <label style="display:block;flex:1">
              <span style="${nsLabel}">State</span>
              <select id="ns-state" style="${nsInput};cursor:pointer;appearance:auto" ${nsFocus}>
                <option value="">Select state...</option>
                ${Object.keys(CITY_DATA).map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </label>
            <label style="display:block;flex:1">
              <span style="${nsLabel}">City</span>
              <select id="ns-city" style="${nsInput};cursor:pointer;appearance:auto" ${nsFocus} disabled>
                <option value="">Select city...</option>
              </select>
            </label>
          </div>
          <label style="display:block">
            <span style="${nsLabel}">Number of Pods</span>
            <input id="ns-pods" type="number" min="1" max="30" placeholder="e.g. 8" value="${isEdit ? editStation.pods : ''}" style="${nsInput}" ${nsFocus} />
          </label>

          <!-- Location info -->
          <div id="ns-location-info" style="padding:10px 12px;border-radius:10px;background:var(--bg-table-head,#f8fafc);border:1px solid var(--border-light,#e2e8f0);display:none">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span class="material-symbols-outlined" style="font-size:14px;color:#D4654A">location_on</span>
              <span style="font-size:var(--font-xs,11px);font-weight:700;color:var(--text-label,#64748b);text-transform:uppercase;letter-spacing:0.06em">Selected Location</span>
            </div>
            <p id="ns-address-text" style="font-size:var(--font-sm,13px);color:var(--text-primary,#0f172a);font-weight:600;margin:0 0 2px;line-height:1.4">-</p>
            <p id="ns-coords-text" style="font-size:var(--font-xs,11px);color:var(--text-muted,#94a3b8);font-family:monospace;margin:0">-</p>
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:auto;padding-top:8px">
            <button id="ns-cancel" style="padding:9px 18px;border:1.5px solid var(--border-color,#e2e8f0);border-radius:10px;background:transparent;font-size:var(--font-sm,13px);font-weight:600;color:var(--text-muted,#64748b);cursor:pointer;font-family:inherit;transition:all 0.15s"
              onmouseover="this.style.background='var(--bg-hover-row,#f1f5f9)'" onmouseout="this.style.background='transparent'">Cancel</button>
            <button id="ns-submit" style="padding:9px 22px;border:none;border-radius:10px;background:#D4654A;font-size:var(--font-sm,13px);font-weight:700;color:white;cursor:pointer;font-family:inherit;transition:all 0.15s;box-shadow:0 2px 8px rgba(212,101,74,0.25)"
              onmouseover="this.style.background='#c25a42';this.style.transform='translateY(-1px)'" onmouseout="this.style.background='#D4654A';this.style.transform='none'">${isEdit ? 'Save Changes' : 'Create Station'}</button>
          </div>
        </div>

        <!-- Right: Map -->
        <div style="width:300px;flex-shrink:0;border-left:1px solid var(--border-light,#e2e8f0);display:flex;flex-direction:column;background:#f1f5f9">
          <div style="padding:8px 12px;border-bottom:1px solid var(--border-light,#e2e8f0);display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:14px;color:#D4654A">map</span>
            <span style="font-size:var(--font-xs,11px);font-weight:700;color:var(--text-label,#64748b);text-transform:uppercase;letter-spacing:0.06em">Click map to set location</span>
          </div>
          <div id="ns-map" style="flex:1;min-height:320px"></div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // --- State variables ---
  let selectedLat = isEdit ? editStation.lat : null;
  let selectedLng = isEdit ? editStation.lng : null;
  let selectedCity = '', selectedState = '';
  let locationStr = isEdit ? (editStation.location || '') : '';
  let nsMap = null, nsMarker = null;

  // --- Close handlers ---
  const close = () => overlay.remove();
  overlay.querySelector('#new-station-close').addEventListener('click', close);
  overlay.querySelector('#ns-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // --- State → City cascade ---
  const stateSelect = overlay.querySelector('#ns-state');
  const citySelect  = overlay.querySelector('#ns-city');

  stateSelect.addEventListener('change', () => {
    selectedState = stateSelect.value;
    const cities = CITY_DATA[selectedState] || [];
    citySelect.innerHTML = '<option value="">Select city...</option>' +
      cities.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    citySelect.disabled = !selectedState;
    selectedCity = '';
    // Zoom map to state region
    if (nsMap && cities.length > 0) {
      const avg = cities.reduce((a, c) => ({ lat: a.lat + c.lat, lng: a.lng + c.lng }), { lat: 0, lng: 0 });
      nsMap.setView([avg.lat / cities.length, avg.lng / cities.length], 7, { animate: true });
    }
  });

  citySelect.addEventListener('change', () => {
    selectedCity = citySelect.value;
    const cities = CITY_DATA[selectedState] || [];
    const city = cities.find(c => c.name === selectedCity);
    if (city && nsMap) {
      nsMap.setView([city.lat, city.lng], 12, { animate: true });
      placePin(city.lat, city.lng);
      reverseGeocode(city.lat, city.lng);
    }
  });

  // --- Map pin placement ---
  function placePin(lat, lng) {
    selectedLat = lat;
    selectedLng = lng;
    const L = window.L;
    if (!L || !nsMap) return;

    if (nsMarker) {
      nsMarker.setLatLng([lat, lng]);
    } else {
      const pinHtml = `<div style="width:24px;height:24px;background:#D4654A;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 12px rgba(0,0,0,0.3)"></div>`;
      const pinIcon = L.divIcon({ html: pinHtml, className: '', iconSize: [24, 24], iconAnchor: [12, 24] });
      nsMarker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(nsMap);
      nsMarker.on('dragend', () => {
        const p = nsMarker.getLatLng();
        placePin(p.lat, p.lng);
        reverseGeocode(p.lat, p.lng);
      });
    }

    // Update coords display
    const coordsEl = overlay.querySelector('#ns-coords-text');
    const infoEl = overlay.querySelector('#ns-location-info');
    if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
    if (infoEl) infoEl.style.display = 'block';
  }

  // --- Set state/city dropdowns programmatically ---
  function setStateCity(state, city) {
    if (state === selectedState && city === selectedCity) return;
    selectedState = state;
    selectedCity = city;
    stateSelect.value = state;
    const cities = CITY_DATA[state] || [];
    citySelect.innerHTML = '<option value="">Select city...</option>' +
      cities.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    citySelect.disabled = false;
    citySelect.value = city;
  }

  // --- Instant: pick nearest city from CITY_DATA ---
  function autoSelectNearest(lat, lng) {
    let bestDist = Infinity, bestState = '', bestCity = '';
    for (const [state, cities] of Object.entries(CITY_DATA)) {
      for (const c of cities) {
        const d = Math.hypot(c.lat - lat, c.lng - lng);
        if (d < bestDist) { bestDist = d; bestState = state; bestCity = c.name; }
      }
    }
    if (bestDist < 3) setStateCity(bestState, bestCity);
  }

  // --- Resolve Nominatim state to CITY_DATA key ---
  function resolveState(nominatimState) {
    if (!nominatimState) return null;
    const lower = nominatimState.toLowerCase().trim();
    if (STATE_ALIASES[lower]) return STATE_ALIASES[lower];
    for (const key of Object.keys(CITY_DATA)) {
      if (key.toLowerCase() === lower) return key;
    }
    return null;
  }

  // --- Nominatim reverse geocoding ---
  let geoTimer = null;
  function reverseGeocode(lat, lng) {
    clearTimeout(geoTimer);
    // Instant fallback - nearest city by distance
    autoSelectNearest(lat, lng);
    geoTimer = setTimeout(async () => {
      const addrEl = overlay.querySelector('#ns-address-text');
      if (addrEl) addrEl.textContent = 'Resolving address...';
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`);
        const data = await res.json();
        const addr = data.address || {};

        // Use Nominatim state to accurately set the dropdown
        const resolvedState = resolveState(addr.state);
        if (resolvedState && CITY_DATA[resolvedState]) {
          const cities = CITY_DATA[resolvedState];
          // Pick nearest city within that state
          let best = cities[0], bestD = Infinity;
          for (const c of cities) {
            const d = Math.hypot(c.lat - lat, c.lng - lng);
            if (d < bestD) { bestD = d; best = c; }
          }
          setStateCity(resolvedState, best.name);
        }

        locationStr = [addr.road, addr.neighbourhood || addr.suburb, addr.city || addr.town || addr.village, addr.state]
          .filter(Boolean).join(', ');
        if (addrEl) addrEl.textContent = locationStr || data.display_name || `${selectedCity}, ${selectedState}`;
      } catch {
        locationStr = `${selectedCity}, ${selectedState}`;
        if (addrEl) addrEl.textContent = locationStr;
      }
    }, 400);
  }

  // --- Initialize Leaflet map ---
  function initModalMap() {
    const L = window.L;
    const mapEl = overlay.querySelector('#ns-map');
    if (!L || !mapEl) return;

    const initView = isEdit ? [editStation.lat, editStation.lng] : [20.5, 78.9];
    const initZoom = isEdit ? 13 : 5;
    nsMap = L.map(mapEl, { zoomControl: false }).setView(initView, initZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM',
      maxZoom: 19,
    }).addTo(nsMap);
    L.control.zoom({ position: 'bottomright' }).addTo(nsMap);

    // Click to place pin
    nsMap.on('click', (e) => {
      placePin(e.latlng.lat, e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    // In edit mode, place pin at existing location and detect state/city
    if (isEdit && editStation.lat && editStation.lng) {
      placePin(editStation.lat, editStation.lng);
      autoSelectNearest(editStation.lat, editStation.lng);
      const addrEl = overlay.querySelector('#ns-address-text');
      if (addrEl) addrEl.textContent = editStation.location || '-';
    }
  }

  // Load Leaflet if needed, then init map
  if (window.L) {
    setTimeout(initModalMap, 50);
  } else {
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
      script.onload = () => setTimeout(initModalMap, 50);
      document.head.appendChild(script);
    } else {
      const check = setInterval(() => {
        if (window.L) { clearInterval(check); initModalMap(); }
      }, 100);
    }
  }

  // --- Submit ---
  overlay.querySelector('#ns-submit').addEventListener('click', async () => {
    const name = overlay.querySelector('#ns-name').value.trim();
    const pods = parseInt(overlay.querySelector('#ns-pods').value) || 0;

    if (!name) { showToast('Please enter a station name', 'error'); return; }
    if (!isEdit && (!selectedState || !selectedCity)) { showToast('Please select a state and city', 'error'); return; }
    if (!pods) { showToast('Please enter the number of pods', 'error'); return; }
    if (selectedLat === null) { showToast('Please click the map to set a location', 'error'); return; }

    const submitBtn = overlay.querySelector('#ns-submit');
    submitBtn.textContent = isEdit ? 'Saving…' : 'Creating…';
    submitBtn.style.pointerEvents = 'none';

    if (isEdit) {
      // ── EDIT MODE: PATCH existing station ──
      try {
        const res = await apiFetch(`/stations/${editStation.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            location: locationStr || editStation.location,
            pods,
            lat: +selectedLat.toFixed(6),
            lng: +selectedLng.toFixed(6),
          }),
        });
        if (!res.ok) throw new Error('API error');
        showToast(`Station "${name}" updated successfully`, 'success');
        close();
        // Re-render settings page if we're on it
        if ((location.hash || '').startsWith('#settings')) {
          location.hash = '#settings';
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      } catch {
        showToast('Failed to update station - is the API running?', 'error');
        submitBtn.textContent = 'Save Changes';
        submitBtn.style.pointerEvents = 'auto';
      }
    } else {
      // ── CREATE MODE: POST new station ──
      const stationId = 'BSS-' + String(Date.now()).slice(-3);
      const newStation = {
        id: stationId,
        name,
        location: locationStr || `${selectedCity}, ${selectedState}`,
        status: 'maintenance',
        pods,
        totalSwapsToday: 0,
        totalSwapsMonth: 0,
        revenueToday: 0,
        revenueMonth: 0,
        uptime: 0,
        lat: +selectedLat.toFixed(6),
        lng: +selectedLng.toFixed(6),
      };

      try {
        const res = await apiFetch('/stations', {
          method: 'POST',
          body: JSON.stringify(newStation),
        });
        if (!res.ok) throw new Error('API error');
        showToast(`Station "${name}" created in ${selectedCity} with ${pods} pods`, 'success');
        close();
        setTimeout(() => { location.hash = '#station/' + stationId; }, 600);
      } catch {
        showToast('Failed to create station - is the API running?', 'error');
        submitBtn.textContent = 'Create Station';
        submitBtn.style.pointerEvents = 'auto';
      }
    }
  });
}
