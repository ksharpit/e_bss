// ============================================
// BSS Dashboard — Mock Data
// ============================================

// Helper: random number in range
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Stations ───
export const stations = [
  {
    id: 'BSS-001',
    name: 'Central Hub Station',
    location: 'MG Road, Bengaluru',
    status: 'online',
    pods: 8,
    totalSwapsToday: 47,
    totalSwapsMonth: 1284,
    revenueToday: 14100,
    revenueMonth: 385200,
    uptime: 99.2,
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: 'BSS-002',
    name: 'Airport Road Station',
    location: 'Airport Road, Bengaluru',
    status: 'online',
    pods: 10,
    totalSwapsToday: 62,
    totalSwapsMonth: 1756,
    revenueToday: 18600,
    revenueMonth: 526800,
    uptime: 98.7,
    lat: 12.9497,
    lng: 77.6689,
  },
  {
    id: 'BSS-003',
    name: 'Electronic City Station',
    location: 'Electronic City, Bengaluru',
    status: 'online',
    pods: 6,
    totalSwapsToday: 31,
    totalSwapsMonth: 892,
    revenueToday: 9300,
    revenueMonth: 267600,
    uptime: 97.5,
    lat: 12.8399,
    lng: 77.6770,
  },
  {
    id: 'BSS-004',
    name: 'Whitefield Depot',
    location: 'Whitefield, Bengaluru',
    status: 'maintenance',
    pods: 8,
    totalSwapsToday: 12,
    totalSwapsMonth: 634,
    revenueToday: 3600,
    revenueMonth: 190200,
    uptime: 87.3,
    lat: 12.9698,
    lng: 77.7500,
  },
  {
    id: 'BSS-005',
    name: 'Koramangala Station',
    location: 'Koramangala, Bengaluru',
    status: 'online',
    pods: 7,
    totalSwapsToday: 39,
    totalSwapsMonth: 1105,
    revenueToday: 11700,
    revenueMonth: 331500,
    uptime: 99.8,
    lat: 12.9352,
    lng: 77.6245,
  },
];

// ─── Generate Pods for each Station ───
const podStatuses = ['charging', 'ready', 'empty', 'fault'];
const podWeights = [0.35, 0.40, 0.18, 0.07]; // probability weights

function pickWeightedStatus() {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < podStatuses.length; i++) {
    cum += podWeights[i];
    if (r <= cum) return podStatuses[i];
  }
  return 'empty';
}

export const stationPods = {};
stations.forEach((station) => {
  const pods = [];
  for (let p = 1; p <= station.pods; p++) {
    const podId = `POD-${station.id.split('-')[1]}-${String(p).padStart(2, '0')}`;
    const status = pickWeightedStatus();
    pods.push({
      id: podId,
      stationId: station.id,
      slotNumber: p,
      status,
      batteryId: status !== 'empty' ? `BAT-${String(rand(1, 80)).padStart(4, '0')}` : null,
      soc: status === 'ready' ? rand(85, 100) : status === 'charging' ? rand(20, 75) : status === 'fault' ? rand(5, 30) : 0,
      health: status !== 'empty' ? rand(78, 100) : null,
      temperature: status !== 'empty' ? rand(28, 42) : null,
    });
  }
  stationPods[station.id] = pods;
});

// ─── Batteries ───
const batteryStatuses = ['In Use', 'Charging', 'Available', 'Retired'];
export const batteries = [];
for (let i = 1; i <= 80; i++) {
  const id = `BAT-${String(i).padStart(4, '0')}`;
  const stationIdx = rand(0, stations.length - 1);
  const station = stations[stationIdx];
  const podIdx = rand(0, station.pods - 1);
  const statusIdx = i <= 70 ? rand(0, 2) : 3; // last 10 retired
  batteries.push({
    id,
    stationId: station.id,
    stationName: station.name,
    podId: `POD-${station.id.split('-')[1]}-${String(podIdx + 1).padStart(2, '0')}`,
    soc: statusIdx === 3 ? rand(0, 10) : rand(15, 100),
    health: statusIdx === 3 ? rand(40, 65) : rand(75, 100),
    swapCount: rand(20, 500),
    status: batteryStatuses[statusIdx],
    lastSwap: `${rand(1, 28)} Feb 2026`,
    cycleCount: rand(50, 800),
  });
}

// ─── Revenue Data (last 30 days) ───
export const revenueDaily = [];
const today = new Date(2026, 2, 2); // March 2, 2026
for (let d = 29; d >= 0; d--) {
  const date = new Date(today);
  date.setDate(date.getDate() - d);
  const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const total = rand(40000, 75000);
  revenueDaily.push({
    date: label,
    total,
    stationBreakdown: stations.map((s) => ({
      stationId: s.id,
      amount: Math.round(total * (s.revenueMonth / stations.reduce((a, st) => a + st.revenueMonth, 0)) * (0.8 + Math.random() * 0.4)),
    })),
  });
}

// Per-station monthly revenue for bar charts
export const revenueByStation = stations.map((s) => ({
  stationId: s.id,
  name: s.name,
  revenue: s.revenueMonth,
  swaps: s.totalSwapsMonth,
  perSwap: Math.round(s.revenueMonth / s.totalSwapsMonth),
}));

// ─── Recent Activity ───
const activityTypes = [
  {
    type: 'swap', icon: 'swap', templates: [
      (s, b) => `Battery <strong>${b}</strong> swapped at <strong>${s}</strong>`,
      (s, b) => `Swap completed - <strong>${b}</strong> at <strong>${s}</strong>`,
    ]
  },
  {
    type: 'charge', icon: 'charge', templates: [
      (s, b) => `<strong>${b}</strong> fully charged at <strong>${s}</strong>`,
      (s, b) => `Charging complete for <strong>${b}</strong> (${s})`,
    ]
  },
  {
    type: 'alert', icon: 'alert', templates: [
      (s) => `Temperature warning at <strong>${s}</strong>`,
      (s) => `High load detected at <strong>${s}</strong>`,
    ]
  },
  {
    type: 'error', icon: 'error', templates: [
      (s, b) => `Fault detected on <strong>${b}</strong> at <strong>${s}</strong>`,
    ]
  },
];

export const recentActivity = [];
for (let i = 0; i < 15; i++) {
  const at = activityTypes[rand(0, 3)];
  const station = stations[rand(0, 4)];
  const battery = `BAT-${String(rand(1, 80)).padStart(4, '0')}`;
  const template = at.templates[rand(0, at.templates.length - 1)];
  const minutesAgo = i * rand(3, 12);
  recentActivity.push({
    type: at.type,
    icon: at.icon,
    html: template(station.name, battery),
    time: minutesAgo === 0 ? 'Just now' : minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m ago`,
  });
}

// ─── Swap History for Station Detail ───
export function getSwapHistory(stationId) {
  const history = [];
  for (let i = 0; i < 20; i++) {
    history.push({
      id: `SWP-${String(rand(10000, 99999))}`,
      batteryId: `BAT-${String(rand(1, 80)).padStart(4, '0')}`,
      time: `${rand(1, 28)} Feb, ${String(rand(6, 22)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`,
      socBefore: rand(5, 25),
      socAfter: rand(85, 100),
      revenue: rand(200, 400),
      duration: `${rand(2, 6)} min`,
    });
  }
  return history;
}

// ─── Aggregated KPIs ───
export const kpi = {
  totalStations: stations.length,
  totalPods: stations.reduce((a, s) => a + s.pods, 0),
  activeBatteries: batteries.filter((b) => b.status !== 'Retired').length,
  totalSwapsToday: stations.reduce((a, s) => a + s.totalSwapsToday, 0),
  revenueToday: stations.reduce((a, s) => a + s.revenueToday, 0),
  revenueMonth: stations.reduce((a, s) => a + s.revenueMonth, 0),
  avgUptime: +(stations.reduce((a, s) => a + s.uptime, 0) / stations.length).toFixed(1),
};

// ─── Compatibility Aliases (used by page modules) ───
export const mockStations = stations.map(s => ({
  ...s,
  totalPods: s.pods,
  swapsToday: s.totalSwapsToday,
}));
export const mockKPIs = { ...kpi, swapsToday: kpi.totalSwapsToday };
export const mockPods = stationPods;
export const mockRevenueDaily = revenueDaily;
export const mockRecentActivity = recentActivity;
export const mockBatteries = batteries.map(b => ({
  ...b,
  status: b.status.toLowerCase(),
}));
export const mockRevenueByStation = revenueByStation;

// Generate swap history keyed by stationId
export const mockSwapHistory = {};
stations.forEach(s => {
  mockSwapHistory[s.id] = getSwapHistory(s.id);
});

// ─── Users / Customers ───
const indianNames = [
  { name: 'Arjun Sharma',   initials: 'AS' },
  { name: 'Priya Nair',     initials: 'PN' },
  { name: 'Rahul Mehta',    initials: 'RM' },
  { name: 'Sneha Patel',    initials: 'SP' },
  { name: 'Vikram Reddy',   initials: 'VR' },
  { name: 'Ananya Iyer',    initials: 'AI' },
  { name: 'Kiran Joshi',    initials: 'KJ' },
  { name: 'Divya Krishnan', initials: 'DK' },
  { name: 'Rohan Gupta',    initials: 'RG' },
  { name: 'Meera Pillai',   initials: 'MP' },
  { name: 'Suresh Rao',     initials: 'SR' },
  { name: 'Kavita Singh',   initials: 'KS' },
];

const vehicleModels = ['Ola S1 Pro', 'Ather 450X', 'Bounce Infinity E1', 'Yulu Miracle', 'Hero Electric Optima'];
const kycStatuses = ['verified', 'verified', 'verified', 'pending', 'rejected'];

export const mockUsers = indianNames.map((u, i) => {
  const swapCount = rand(5, 120);
  const battery = batteries[rand(0, 69)];
  const station = stations[rand(0, 4)];
  const swapHistory = [];
  for (let s = 0; s < Math.min(swapCount, 10); s++) {
    const d = new Date(2026, 2, rand(1, 3));
    d.setDate(d.getDate() - s * rand(1, 5));
    swapHistory.push({
      id: `SWP-${rand(10000, 99999)}`,
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      station: stations[rand(0, 4)].name,
      batteryId: `BAT-${String(rand(1, 80)).padStart(4, '0')}`,
      amount: 65,
      status: 'paid',
    });
  }
  return {
    id: `USR-${String(i + 1).padStart(4, '0')}`,
    name: u.name,
    initials: u.initials,
    phone: `+91 ${rand(70000, 99999)}${rand(10000, 99999)}`,
    vehicle: vehicleModels[i % vehicleModels.length],
    vehicleId: `KA-${rand(10, 99)}-EV-${rand(1000, 9999)}`,
    batteryId: battery.id,
    station: station.name,
    swapCount,
    totalSpent: swapCount * 65,
    lastSwap: swapHistory[0]?.date || '—',
    kycStatus: kycStatuses[i % kycStatuses.length],
    aadhaar: `XXXX-XXXX-${rand(1000, 9999)}`,
    pan: `XXXXX${rand(1000, 9999)}X`,
    swapHistory,
  };
});
