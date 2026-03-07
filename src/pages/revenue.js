// ============================================
// Revenue Dashboard - Live API Data
// Coral design system, arch bars, clean cards
// ============================================
import { icon } from '../components/icons.js';
import { apiFetch } from '../utils/apiFetch.js';
import { formatNumber, formatRevM, fmtCur, curSymbol } from '../utils/helpers.js';
import { Chart } from 'chart.js';

let revBarInstance = null;
let revDoughnutInstance = null;

export async function renderRevenue(container) {
  container.innerHTML = `<div style="padding:3rem;text-align:center;color:#94a3b8;font-size:var(--font-md)">Loading revenue data...</div>`;

  let stations = [], swaps = [], transactions = [];
  try {
    [stations, swaps, transactions] = await Promise.all([
      apiFetch('/stations').then(r => r.json()),
      apiFetch('/swaps').then(r => r.json()),
      apiFetch('/transactions').then(r => r.json()),
    ]);
  } catch {
    container.innerHTML = `<div style="padding:3rem;text-align:center;color:#ef4444;font-size:var(--font-md)">Failed to load revenue data from API.</div>`;
    return;
  }

  // ── Compute per-station revenue & swap counts from REAL swap records ──
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = now.toISOString().slice(0, 10);

  stations.forEach(st => {
    const stSwaps = swaps.filter(s => s.stationId === st.id);
    const monthSwaps = stSwaps.filter(s => new Date(s.timestamp) >= thirtyDaysAgo);
    const todaySwaps = stSwaps.filter(s => s.timestamp && s.timestamp.startsWith(today));
    st._swapsMonth = monthSwaps.length;
    st._swapsToday = todaySwaps.length;
    st._revenueMonth = monthSwaps.length * 65;
    st._revenueToday = todaySwaps.length * 65;
    st._allSwaps = stSwaps.length;
    st._allRevenue = stSwaps.length * 65;
  });

  const STATION_COLORS = ['#D4654A', 'rgba(212,101,74,0.70)', 'rgba(212,101,74,0.45)', 'rgba(212,101,74,0.25)', 'rgba(212,101,74,0.14)'];
  const sortedStations = [...stations].sort((a, b) => b._allRevenue - a._allRevenue);
  const maxRev = sortedStations.length > 0 ? sortedStations[0]._allRevenue : 1;

  // ── Deposit vs Swap revenue - from REAL transactions ──
  const depositTxns = transactions.filter(t => t.type === 'security_deposit' && t.status === 'completed');
  const totalDepositRevenue = depositTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalSwapRevenue = swaps.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalRevenue = totalDepositRevenue + totalSwapRevenue;

  const totalRevenueToday = stations.reduce((s, st) => s + st._revenueToday, 0);
  const totalSwapsToday = stations.reduce((s, st) => s + st._swapsToday, 0);

  // Attribution percentages
  const depositPct = totalRevenue > 0 ? Math.round(totalDepositRevenue / totalRevenue * 100) : 0;
  const swapPct = 100 - depositPct;

  // Build chart data
  const monthlyData = buildMonthlyTrend(swaps, transactions);
  const heatmapData = buildHeatmapData(swaps);

  container.innerHTML = `
    <!-- Header -->
    <div class="rev-header">
      <div>
        <h1 class="rev-title">Revenue Dashboard</h1>
        <p class="rev-subtitle">${stations.length} Stations · ${swaps.length} total swaps · ${formatRevM(totalRevenueToday)} today</p>
      </div>
      <div style="display:flex;align-items:center;gap:0.75rem">
        <button class="rev-btn-dark" id="revenue-export-btn">
          ${icon('download', '14px')} Export
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="rev-kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      ${kpiCard('Total Revenue', formatRevM(totalRevenue), swaps.length + ' swaps + ' + depositTxns.length + ' deposits', 'up', true)}
      ${kpiCard('Swap Revenue', formatRevM(totalSwapRevenue), swaps.length + ' x ' + fmtCur(65), 'up', false)}
      ${kpiCard('Deposit Revenue', formatRevM(totalDepositRevenue), depositTxns.length + ' x ' + fmtCur(3000), 'track', false)}
      ${kpiCard('Today', formatRevM(totalRevenueToday), totalSwapsToday + ' swaps today', 'track', false)}
    </div>

    <!-- Row 2: Trend Chart + Attribution -->
    <div class="rev-charts-row">

      <!-- Revenue Trend Bar Chart -->
      <div class="rev-card">
        <h3 class="rev-card-title">Revenue Trend (Monthly)</h3>
        <div style="height:280px;margin-top:1.25rem">
          <canvas id="rev-trend-bar"></canvas>
        </div>
      </div>

      <!-- Attribution Doughnut -->
      <div class="rev-card" style="display:flex;flex-direction:column">
        <h3 class="rev-card-title">Revenue Attribution</h3>
        <div class="rev-donut-wrap">
          <canvas id="rev-attribution"></canvas>
          <div class="rev-donut-center">
            <span class="rev-donut-pct">${swapPct}%</span>
            <span class="rev-donut-lbl">Swap Fee</span>
          </div>
        </div>
        <div class="rev-attr-legend">
          ${attrRow('rgba(212,101,74,0.30)', 'Swap Fee (' + fmtCur(65) + '/swap)', formatRevM(totalSwapRevenue))}
          ${attrRow('#D4654A', 'Deposit Fee (' + fmtCur(3000) + ')', formatRevM(totalDepositRevenue))}
        </div>
      </div>
    </div>

    <!-- Row 3: Top Stations + Heatmap -->
    <div class="rev-lower-row">

      <!-- Top Performing Stations -->
      <div class="rev-card">
        <div class="rev-card-header">
          <h3 class="rev-card-title">Top Performing Stations</h3>
          <span class="rev-link" onclick="location.hash='#stations'">View All</span>
        </div>
        <div>
          ${sortedStations.slice(0, 5).map((s, i) => topStationRow(s, maxRev, STATION_COLORS[i] ?? STATION_COLORS.at(-1))).join('')}
        </div>
      </div>

      <!-- Swap Frequency Heatmap -->
      <div class="rev-card">
        <h3 class="rev-card-title">Swap Frequency Heatmap</h3>
        <p style="font-size:var(--font-sm);color:var(--text-muted);margin:4px 0 12px">Last 4 weeks · swaps per day</p>
        ${renderHeatmap(heatmapData)}
      </div>
    </div>

    <!-- Revenue Breakdown Table -->
    <div class="rev-card rev-table-card">
      <div class="rev-card-header">
        <h3 class="rev-card-title">Revenue Breakdown by Station</h3>
        <button class="rev-sort-btn" id="rev-sort-btn" title="Sort by revenue">
          ${icon('swap_vert', '16px')}
          <span id="rev-sort-label">Revenue ↓</span>
        </button>
      </div>
      <table class="rev-table">
        <thead>
          <tr>
            <th>Station ID</th>
            <th>Location</th>
            <th>Swaps (All)</th>
            <th>Uptime</th>
            <th>Revenue (All)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="rev-table-body">
          ${sortedStations.map((s, i) => tableRow(s, STATION_COLORS[i % STATION_COLORS.length])).join('')}
        </tbody>
      </table>
    </div>

    <footer class="app-footer">
      ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#9ca3af')}
      Electica Enterprise Dashboard © 2026
    </footer>
  `;

  // Charts
  setTimeout(() => {
    buildTrendBar(monthlyData);
    buildAttributionDoughnut(swapPct, depositPct, totalSwapRevenue, totalDepositRevenue);
  }, 100);

  // ── Sort by revenue toggle ──
  const tableBody = document.getElementById('rev-table-body');
  const sortBtn = document.getElementById('rev-sort-btn');
  const sortLabel = document.getElementById('rev-sort-label');
  let sortAsc = false; // starts descending (highest first)

  sortBtn?.addEventListener('click', () => {
    sortAsc = !sortAsc;
    const sorted = [...sortedStations].sort((a, b) =>
      sortAsc ? a._allRevenue - b._allRevenue : b._allRevenue - a._allRevenue
    );
    tableBody.innerHTML = sorted.map((s, i) =>
      tableRow(s, STATION_COLORS[i % STATION_COLORS.length])
    ).join('');
    sortLabel.textContent = sortAsc ? 'Revenue ↑' : 'Revenue ↓';
  });

  // Revenue Export CSV
  document.getElementById('revenue-export-btn')?.addEventListener('click', async () => {
    const { downloadCsv } = await import('../utils/csv.js');
    const headers = ['Station ID', 'Station Name', 'Location', 'Swaps (All)', 'Revenue (All)', 'Swaps (Today)', 'Revenue (Today)', 'Uptime %', 'Status'];
    const rows = sortedStations.map(s => [
      s.id, s.name, s.location,
      s._allSwaps, s._allRevenue,
      s._swapsToday, s._revenueToday,
      s.uptime, s.status,
    ]);
    downloadCsv('revenue-breakdown', headers, rows);
    const { showToast: toast } = await import('../utils/toast.js');
    toast('Revenue report exported', 'success');
  });
}

// ─── Build monthly trend from swap + deposit records ───
function buildMonthlyTrend(swaps, transactions) {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('en-US', { month: 'short' });
    months.push({ key, label, swapRev: 0, depositRev: 0 });
  }
  swaps.forEach(s => {
    if (!s.timestamp) return;
    const key = s.timestamp.slice(0, 7);
    const month = months.find(m => m.key === key);
    if (month) month.swapRev += (s.amount || 0);
  });
  const deposits = transactions.filter(t => t.type === 'security_deposit' && t.status === 'completed');
  deposits.forEach(t => {
    if (!t.timestamp) return;
    const key = t.timestamp.slice(0, 7);
    const month = months.find(m => m.key === key);
    if (month) month.depositRev += (t.amount || 0);
  });
  return months;
}

// ─── Build heatmap data from actual swaps ───
function buildHeatmapData(swaps) {
  const now = new Date();
  const weeks = [];

  // Build 4 weeks: week 0 = most recent, week 3 = oldest
  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (w * 7 + 6));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - (w * 7));
    weekEnd.setHours(23, 59, 59, 999);
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    weeks.push({ label, days: Array(7).fill(0), start: weekStart, end: weekEnd });
  }

  swaps.forEach(s => {
    if (!s.timestamp) return;
    const d = new Date(s.timestamp);
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays >= 28) return;
    const week = Math.floor(diffDays / 7);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0...Sun=6
    if (weeks[week]) weeks[week].days[day]++;
  });

  // Reverse so oldest week is first (top row)
  weeks.reverse();
  return weeks;
}

// ─── KPI Card ───
function kpiCard(label, value, badge, badgeType, hasDecor) {
  const badgeClass = badgeType === 'up' ? 'rev-badge-up' : badgeType === 'down' ? 'rev-badge-down' : 'rev-badge-track';
  return `
    <div class="rev-kpi-card">
      ${hasDecor ? '<div class="rev-kpi-decor"></div>' : ''}
      <p class="rev-kpi-label">${label}</p>
      <h2 class="rev-kpi-value">${value}</h2>
      <span class="rev-badge ${badgeClass}">${badge}</span>
    </div>
  `;
}

// ─── Attribution Legend Row ───
function attrRow(color, label, value) {
  return `
    <div class="rev-attr-row">
      <div style="display:flex;align-items:center;gap:0.625rem">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></span>
        <span style="font-size:var(--font-md);color:var(--text-secondary);font-weight:500">${label}</span>
      </div>
      <span style="font-size:var(--font-md);font-weight:700;color:var(--text-primary)">${value}</span>
    </div>
  `;
}

// ─── Top Station Row ───
function topStationRow(station, maxRev, color) {
  const rev = station._allRevenue;
  const pct = maxRev > 0 ? Math.round((rev / maxRev) * 100) : 0;
  return `
    <div class="rev-station-item" style="cursor:pointer" onclick="location.hash='#station/${station.id}'">
      <div class="rev-station-row">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:10px;height:10px;border-radius:3px;background:${color};flex-shrink:0"></span>
          <span style="font-size:var(--font-md);font-weight:600;color:var(--text-primary)">${station.name}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:var(--font-xs);color:var(--text-muted)">${station._allSwaps} swaps</span>
          <span style="font-size:var(--font-md);font-weight:700;color:var(--text-primary)">${fmtCur(rev)}</span>
        </div>
      </div>
      <div class="rev-station-bar">
        <div class="rev-station-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>
  `;
}

// ─── Heatmap with large cells, hover highlight, week labels ───
function renderHeatmap(weeks) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const allVals = weeks.flatMap(w => w.days);
  const maxVal = Math.max(...allVals, 1);

  function cellLevel(v) {
    const intensity = v / maxVal;
    if (intensity > 0.75) return 4;
    if (intensity > 0.5) return 3;
    if (intensity > 0.2) return 2;
    if (intensity > 0) return 1;
    return 0;
  }

  let rows = '';
  weeks.forEach(week => {
    rows += `<div class="hm-row">`;
    rows += `<span class="hm-week-label">${week.label}</span>`;
    week.days.forEach(v => {
      const lvl = cellLevel(v);
      rows += `<div class="hm-cell hm-lvl-${lvl}" title="${v} swaps">${v > 0 ? v : ''}</div>`;
    });
    rows += `</div>`;
  });

  // Day labels row
  let dayRow = `<div class="hm-row">`;
  dayRow += `<span class="hm-week-label"></span>`;
  dayLabels.forEach(d => {
    dayRow += `<span class="hm-day-label">${d}</span>`;
  });
  dayRow += `</div>`;

  // Color legend
  const legend = `
    <div class="hm-legend">
      <span class="hm-legend-text">Less</span>
      <span class="hm-legend-swatch hm-lvl-0"></span>
      <span class="hm-legend-swatch hm-lvl-1"></span>
      <span class="hm-legend-swatch hm-lvl-2"></span>
      <span class="hm-legend-swatch hm-lvl-3"></span>
      <span class="hm-legend-swatch hm-lvl-4"></span>
      <span class="hm-legend-text">More</span>
    </div>
  `;

  return `
    <div class="hm-grid">
      ${rows}
      ${dayRow}
    </div>
    ${legend}
  `;
}

// ─── Table Row ───
function tableRow(station, color) {
  const isOnline = station.status === 'online';
  const eff = Math.round(station.uptime || 0);
  return `
    <tr class="rev-table-row" onclick="location.hash='#station/${station.id}'" style="cursor:pointer">
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:8px;height:8px;border-radius:2px;background:${color};flex-shrink:0"></span>
          <span style="font-weight:700;color:var(--text-primary)">${station.id}</span>
        </div>
      </td>
      <td>${station.location}</td>
      <td>${formatNumber(station._allSwaps)}</td>
      <td>
        <div class="rev-eff-bar">
          <div class="rev-eff-track">
            <div class="rev-eff-fill" style="width:${eff}%;background:${color}"></div>
          </div>
          <span style="font-size:var(--font-sm);font-weight:700;color:var(--text-primary)">${eff}%</span>
        </div>
      </td>
      <td style="font-weight:700;color:var(--text-primary)">${fmtCur(station._allRevenue)}</td>
      <td>
        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:${isOnline ? '#dcfce7' : '#fef9c3'};color:${isOnline ? '#16a34a' : '#ca8a04'};border:1px solid ${isOnline ? '#bbf7d0' : '#fde047'}">${isOnline ? 'Online' : station.status.charAt(0).toUpperCase() + station.status.slice(1)}</span>
      </td>
    </tr>
  `;
}

// ─── Trend Bar Chart - stacked swap + deposit revenue ───
function buildTrendBar(monthlyData) {
  const canvas = document.getElementById('rev-trend-bar');
  if (!canvas) return;
  if (revBarInstance) revBarInstance.destroy();

  const labels = monthlyData.map(m => m.label);
  const swapData = monthlyData.map(m => Math.round(m.swapRev / 1000));
  const depositData = monthlyData.map(m => Math.round(m.depositRev / 1000));
  const n = labels.length;

  // Colors: base, faded, highlighted
  const swapBase = 'rgba(212,101,74,0.30)';
  const swapFaded = 'rgba(212,101,74,0.10)';
  const swapHi = 'rgba(212,101,74,0.45)';
  const depBase = '#D4654A';
  const depFaded = 'rgba(212,101,74,0.18)';
  const depHi = '#D4654A';

  const swapColors = Array(n).fill(swapBase);
  const depColors = Array(n).fill(depBase);

  const externalTooltip = ({ chart, tooltip }) => {
    let el = document.getElementById('rev-bar-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rev-bar-tooltip';
      el.className = 'rev-chart-tooltip';
      document.body.appendChild(el);
    }

    if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }

    const dp = tooltip.dataPoints[0];
    const idx = dp.dataIndex;
    const swapK = swapData[idx];
    const depK = depositData[idx];
    const totalK = swapK + depK;

    el.innerHTML = `
      <div class="rev-tt-header">
        <span class="rev-tt-month">${labels[idx]}</span>
      </div>
      <div class="rev-tt-value">${curSymbol()}${totalK}<span class="rev-tt-unit">K</span></div>
      <div class="rev-tt-rows">
        <div class="rev-tt-row">
          <span class="rev-tt-dot" style="background:rgba(212,101,74,0.35)"></span>
          <span class="rev-tt-lbl">Swap Fee</span>
          <span class="rev-tt-val">${curSymbol()}${swapK}K</span>
        </div>
        <div class="rev-tt-row">
          <span class="rev-tt-dot" style="background:#D4654A"></span>
          <span class="rev-tt-lbl">Deposit Fee</span>
          <span class="rev-tt-val">${curSymbol()}${depK}K</span>
        </div>
      </div>
    `;

    const rect = chart.canvas.getBoundingClientRect();
    el.style.left = (rect.left + window.scrollX + tooltip.caretX + 20) + 'px';
    el.style.top  = (rect.top  + window.scrollY + tooltip.caretY - el.offsetHeight - 8) + 'px';
    el.style.opacity = '1';
  };

  revBarInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Swap Revenue',
          data: swapData,
          backgroundColor: swapColors,
          borderRadius: { topLeft: 2, topRight: 2, bottomLeft: 2, bottomRight: 2 },
          borderSkipped: false,
          barPercentage: 0.92,
          categoryPercentage: 0.95,
        },
        {
          label: 'Deposit Revenue',
          data: depositData,
          backgroundColor: depColors,
          borderRadius: { topLeft: 20, topRight: 20, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false,
          barPercentage: 0.92,
          categoryPercentage: 0.95,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      onHover: (_evt, activeEls) => {
        if (activeEls.length > 0) {
          const idx = activeEls[0].index;
          for (let i = 0; i < n; i++) {
            swapColors[i] = i === idx ? swapHi : swapFaded;
            depColors[i] = i === idx ? depHi : depFaded;
          }
        } else {
          for (let i = 0; i < n; i++) {
            swapColors[i] = swapBase;
            depColors[i] = depBase;
          }
        }
        revBarInstance.update('none');
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external: externalTooltip },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#9ca3af', font: { size: 11, weight: '500' } },
        },
        y: {
          stacked: true,
          display: false,
        },
      },
    },
  });

  // Reset colors when mouse leaves the canvas entirely
  canvas.addEventListener('mouseleave', () => {
    for (let i = 0; i < n; i++) {
      swapColors[i] = swapBase;
      depColors[i] = depBase;
    }
    revBarInstance.update('none');
  });
}

// ─── Attribution Doughnut - Deposit Fee vs Swap Fee ───
function buildAttributionDoughnut(swapPct, depositPct, swapRev, depositRev) {
  const canvas = document.getElementById('rev-attribution');
  if (!canvas) return;
  if (revDoughnutInstance) revDoughnutInstance.destroy();

  const attrLabels = ['Swap Fee (' + fmtCur(65) + ')', 'Deposit Fee (' + fmtCur(3000) + ')'];
  const attrVals = [formatRevM(swapRev), formatRevM(depositRev)];
  const attrClrs = ['rgba(212,101,74,0.30)', '#D4654A'];

  const externalTooltip = ({ chart, tooltip }) => {
    let el = document.getElementById('rev-attr-tt');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rev-attr-tt';
      el.className = 'rev-chart-tooltip';
      document.body.appendChild(el);
    }
    if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }
    const dp = tooltip.dataPoints?.[0];
    if (!dp) return;
    const idx = dp.dataIndex;
    const val = dp.raw;
    const total = dp.dataset.data.reduce((a, b) => a + b, 0);
    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
    el.innerHTML = `
      <div class="rev-tt-header">
        <span class="rev-tt-month">${attrLabels[idx]}</span>
        <span class="rev-tt-mom ${idx === 0 ? 'up' : 'neutral'}">${pct}%</span>
      </div>
      <div class="rev-tt-value">${attrVals[idx]}</div>
      <div class="rev-tt-track">
        <div class="rev-tt-fill" style="width:${pct}%;background:${attrClrs[idx]}"></div>
      </div>
      <div class="rev-tt-sub">${pct}% of total revenue</div>
    `;
    const r = chart.canvas.getBoundingClientRect();
    el.style.left = (r.right + window.scrollX + 12) + 'px';
    el.style.top  = (r.top  + window.scrollY + r.height / 2 - el.offsetHeight / 2) + 'px';
    el.style.opacity = '1';
  };

  revDoughnutInstance = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: attrLabels,
      datasets: [{
        data: [swapPct, depositPct],
        backgroundColor: ['rgba(212,101,74,0.30)', '#D4654A'],
        borderWidth: 0,
        borderRadius: 4,
        spacing: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '74%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external: externalTooltip },
      },
    },
  });
}
