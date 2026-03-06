// ============================================
// Revenue Charts (Widget Redesign — Coral Palette)
// ============================================
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

let revenueChartInstance = null;
let stationBarChartInstance = null;
let doughnutChartInstance = null;
let loadBarChartInstance = null;
let concentricChartInstance = null;
let concentricOriginalColors = [];
let sparkLineInstance = null;

// ── Shared custom tooltip helpers ──
function getTooltipEl(id) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.className = 'rev-chart-tooltip';
        document.body.appendChild(el);
    }
    return el;
}
function positionTooltip(el, chart, tooltip) {
    const r = chart.canvas.getBoundingClientRect();
    el.style.left = (r.left + window.scrollX + tooltip.caretX + 20) + 'px';
    el.style.top  = (r.top  + window.scrollY + tooltip.caretY - el.offsetHeight - 8) + 'px';
    el.style.opacity = '1';
}

export function renderRevenueLineChart(canvasId, revenueDaily) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (revenueChartInstance) revenueChartInstance.destroy();

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(212, 101, 74, 0.10)');
    gradient.addColorStop(1, 'rgba(212, 101, 74, 0.00)');

    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: revenueDaily.map(d => d.date),
            datasets: [{
                label: 'Daily Revenue (₹)',
                data: revenueDaily.map(d => d.total),
                borderColor: '#D4654A',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#D4654A',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: ({ chart, tooltip }) => {
                        const el = getTooltipEl('rev-line-tt');
                        if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }
                        const dp = tooltip.dataPoints?.[0];
                        if (!dp) return;
                        el.innerHTML = `
                            <div class="rev-tt-month">${dp.label}</div>
                            <div class="rev-tt-value">₹${(dp.raw / 1000).toFixed(1)}<span class="rev-tt-unit">K</span></div>
                            <div class="rev-tt-sub">Daily Revenue</div>
                        `;
                        positionTooltip(el, chart, tooltip);
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 10, weight: '500' }, maxTicksLimit: 8 },
                },
                y: {
                    grid: { color: '#f0efec', drawBorder: false },
                    ticks: {
                        color: '#9ca3af', font: { size: 10, weight: '500' },
                        callback: v => '₹' + (v / 1000).toFixed(0) + 'K',
                    },
                },
            },
        },
    });
}

export function renderLoadBarChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (loadBarChartInstance) loadBarChartInstance.destroy();

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const mainGrid = [180, 220, 190, 250, 280, 320, 260];
    const solar = [60, 70, 55, 80, 100, 120, 90];

    loadBarChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Main Grid',
                    data: mainGrid,
                    backgroundColor: '#D4654A',
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7,
                },
                {
                    label: 'Solar Backup',
                    data: solar,
                    backgroundColor: 'rgba(212, 101, 74, 0.3)',
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: ({ chart, tooltip }) => {
                        const el = getTooltipEl('rev-load-tt');
                        if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }
                        const dps = tooltip.dataPoints || [];
                        const label = dps[0]?.label || '';
                        const mainV = dps.find(d => d.datasetIndex === 0)?.raw ?? 0;
                        const solarV = dps.find(d => d.datasetIndex === 1)?.raw ?? 0;
                        const total = mainV + solarV;
                        const gridPct = total > 0 ? Math.round((mainV / total) * 100) : 0;
                        el.innerHTML = `
                            <div class="rev-tt-month">${label}</div>
                            <div class="rev-tt-rows">
                                <div class="rev-tt-row">
                                    <span class="rev-tt-dot" style="background:#D4654A"></span>
                                    <span class="rev-tt-lbl">Main Grid</span>
                                    <span class="rev-tt-val">${mainV} kWh</span>
                                </div>
                                <div class="rev-tt-row">
                                    <span class="rev-tt-dot" style="background:rgba(212,101,74,0.35)"></span>
                                    <span class="rev-tt-lbl">Solar</span>
                                    <span class="rev-tt-val">${solarV} kWh</span>
                                </div>
                            </div>
                            <div class="rev-tt-track">
                                <div class="rev-tt-fill" style="width:${gridPct}%"></div>
                            </div>
                            <div class="rev-tt-sub">Grid ${gridPct}% · Solar ${100 - gridPct}%</div>
                        `;
                        positionTooltip(el, chart, tooltip);
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 10, weight: '700' } },
                },
                y: {
                    grid: { color: '#f0efec', drawBorder: false },
                    ticks: { display: false },
                },
            },
        },
    });
}

export function renderStationBarChart(canvasId, revenueByStation) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (stationBarChartInstance) stationBarChartInstance.destroy();

    stationBarChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: revenueByStation.map(s => s.stationId),
            datasets: [{
                label: 'Revenue (₹)',
                data: revenueByStation.map(s => s.revenue),
                backgroundColor: 'rgba(212, 101, 74, 0.15)',
                borderColor: '#D4654A',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: ({ chart, tooltip }) => {
                        const el = getTooltipEl('rev-stn-tt');
                        if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }
                        const dp = tooltip.dataPoints?.[0];
                        if (!dp) return;
                        el.innerHTML = `
                            <div class="rev-tt-month">${dp.label}</div>
                            <div class="rev-tt-value">₹${(dp.raw / 1000).toFixed(1)}<span class="rev-tt-unit">K</span></div>
                            <div class="rev-tt-sub">Monthly Revenue</div>
                        `;
                        positionTooltip(el, chart, tooltip);
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#525252', font: { size: 11, weight: '600' } },
                },
                y: {
                    grid: { color: '#f0efec', drawBorder: false },
                    ticks: {
                        color: '#9ca3af', font: { size: 10, weight: '500' },
                        callback: v => '₹' + (v / 1000).toFixed(0) + 'K',
                    },
                },
            },
        },
    });
}

export function renderPodDoughnutChart(canvasId, pods) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (doughnutChartInstance) doughnutChartInstance.destroy();

    const counts = { charging: 0, ready: 0, empty: 0, fault: 0 };
    pods.forEach(p => counts[p.status]++);

    doughnutChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Charging', 'Available', 'Empty', 'Fault'],
            datasets: [{
                data: [counts.charging, counts.ready, counts.empty, counts.fault],
                backgroundColor: ['rgba(212,101,74,0.4)', '#D4654A', '#eae8e4', '#ef4444'],
                borderColor: '#ffffff',
                borderWidth: 3,
                spacing: 2,
                borderRadius: 4,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#6b7280', font: { size: 11, weight: '500' }, padding: 16, usePointStyle: true, pointStyleWidth: 8 },
                },
                tooltip: {
                    enabled: false,
                    external: ({ chart, tooltip }) => {
                        const statusColors = { 'Charging': '#D4654A', 'Available': '#22c55e', 'Empty': '#9ca3af', 'Fault': '#ef4444' };
                        const el = getTooltipEl('rev-pod-tt');
                        if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }
                        const dp = tooltip.dataPoints?.[0];
                        if (!dp) return;
                        const label = dp.label;
                        const val = dp.raw;
                        const total = dp.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = Math.round((val / total) * 100);
                        const clr = statusColors[label] || '#D4654A';
                        el.innerHTML = `
                            <div class="rev-tt-header">
                                <span class="rev-tt-month">${label}</span>
                                <span class="rev-tt-mom neutral">${pct}%</span>
                            </div>
                            <div class="rev-tt-value" style="color:${clr}">${val}<span class="rev-tt-unit"> pods</span></div>
                            <div class="rev-tt-track">
                                <div class="rev-tt-fill" style="width:${pct}%;background:${clr}"></div>
                            </div>
                        `;
                        positionTooltip(el, chart, tooltip);
                    },
                },
            },
        },
    });
}

// ─── NEW: Concentric Circles (Station Revenue) ───
export function renderConcentricChart(canvasId, stations) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (concentricChartInstance) concentricChartInstance.destroy();

    const sortedStations = [...stations].sort((a, b) => (b._revToday || 0) - (a._revToday || 0));
    const totalRev = sortedStations.reduce((sum, s) => sum + (s._revToday || 0), 0);
    const isZero = totalRev === 0;

    const colors = [
        '#D4654A',
        'rgba(212, 101, 74, 0.7)',
        'rgba(212, 101, 74, 0.45)',
        'rgba(212, 101, 74, 0.25)',
        'rgba(212, 101, 74, 0.12)',
    ];
    const zeroColors = [
        'rgba(212, 101, 74, 0.14)',
        'rgba(212, 101, 74, 0.11)',
        'rgba(212, 101, 74, 0.08)',
        'rgba(212, 101, 74, 0.06)',
        'rgba(212, 101, 74, 0.04)',
    ];

    const datasets = sortedStations.map((s, i) => {
        const c = isZero ? zeroColors[i] || zeroColors[zeroColors.length - 1] : colors[i] || colors[colors.length - 1];
        if (isZero) {
            // Show decorative staggered rings when no revenue
            const placeholderVal = 60 - i * 8;
            return {
                label: s.name,
                data: [placeholderVal, 100 - placeholderVal],
                backgroundColor: [c, 'rgba(0,0,0,0.02)'],
                borderWidth: 0,
                borderRadius: 10,
                spacing: 1,
            };
        }
        return {
            label: s.name,
            data: [(s._revToday || 0), Math.max(...sortedStations.map(st => st._revToday || 0)) - (s._revToday || 0)],
            backgroundColor: [c, 'rgba(0,0,0,0.03)'],
            borderWidth: 0,
            borderRadius: 10,
            spacing: 1,
        };
    });

    // Store original colors for highlight/reset
    concentricOriginalColors = datasets.map(ds => [...ds.backgroundColor]);

    concentricChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Revenue', 'Remaining'],
            datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '25%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: ({ chart, tooltip }) => {
                        const el = getTooltipEl('rev-concentric-tt');
                        if (tooltip.opacity === 0) { el.style.opacity = '0'; return; }
                        const dp = tooltip.dataPoints?.[0];
                        if (!dp || dp.dataIndex !== 0) { el.style.opacity = '0'; return; }
                        const station = sortedStations[dp.datasetIndex];
                        if (!station) { el.style.opacity = '0'; return; }
                        el.innerHTML = `
                            <div class="rev-tt-month">${station.name}</div>
                            <div class="rev-tt-value">₹${((station._revToday || 0) / 1000).toFixed(1)}<span class="rev-tt-unit">K</span></div>
                            <div class="rev-tt-sub">Revenue Today · ${station.id}</div>
                        `;
                        positionTooltip(el, chart, tooltip);
                    },
                },
            },
        },
    });
}

// Highlight a single ring, dim all others
export function highlightConcentricRing(index) {
    if (!concentricChartInstance) return;
    const datasets = concentricChartInstance.data.datasets;
    datasets.forEach((ds, i) => {
        if (i === index) {
            ds.backgroundColor = [...concentricOriginalColors[i]];
        } else {
            ds.backgroundColor = ['rgba(212,101,74,0.06)', 'rgba(0,0,0,0.02)'];
        }
    });
    concentricChartInstance.update('none');
}

// Reset all rings to original colors
export function resetConcentricChart() {
    if (!concentricChartInstance) return;
    const datasets = concentricChartInstance.data.datasets;
    datasets.forEach((ds, i) => {
        ds.backgroundColor = [...concentricOriginalColors[i]];
    });
    concentricChartInstance.update('none');
}

// ─── NEW: Sparkline Mini Chart ───
export function renderSparkLine(canvasId, dataPoints) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (sparkLineInstance) sparkLineInstance.destroy();

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 40);
    gradient.addColorStop(0, 'rgba(212, 101, 74, 0.15)');
    gradient.addColorStop(1, 'rgba(212, 101, 74, 0.00)');

    sparkLineInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map((_, i) => i),
            datasets: [{
                data: dataPoints,
                borderColor: '#D4654A',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 3,
                pointHoverBackgroundColor: '#D4654A',
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                x: { display: false },
                y: { display: false },
            },
            elements: {
                line: { borderCapStyle: 'round' },
            },
        },
    });
}
