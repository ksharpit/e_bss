// ============================================
// Revenue Charts (Electica Blue)
// ============================================
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

let revenueChartInstance = null;
let stationBarChartInstance = null;
let doughnutChartInstance = null;
let loadBarChartInstance = null;

export function renderRevenueLineChart(canvasId, revenueDaily) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (revenueChartInstance) revenueChartInstance.destroy();

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(15, 98, 254, 0.08)');
    gradient.addColorStop(1, 'rgba(15, 98, 254, 0.00)');

    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: revenueDaily.map(d => d.date),
            datasets: [{
                label: 'Daily Revenue (₹)',
                data: revenueDaily.map(d => d.total),
                borderColor: '#0f62fe',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#0f62fe',
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
                    backgroundColor: '#1e293b',
                    titleColor: '#fff',
                    bodyColor: 'rgba(255,255,255,0.8)',
                    borderColor: 'transparent',
                    borderWidth: 0,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: ctx => `Revenue: ₹${ctx.parsed.y.toLocaleString('en-IN')}`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 10, weight: '500' }, maxTicksLimit: 8 },
                },
                y: {
                    grid: { color: '#f3f4f6', drawBorder: false },
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
                    backgroundColor: '#0f62fe',
                    borderRadius: 4,
                    borderSkipped: false,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7,
                },
                {
                    label: 'Solar Backup',
                    data: solar,
                    backgroundColor: '#93c5fd',
                    borderRadius: 4,
                    borderSkipped: false,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#fff',
                    bodyColor: 'rgba(255,255,255,0.8)',
                    cornerRadius: 8, padding: 12,
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 10, weight: '700' } },
                },
                y: {
                    grid: { color: '#f3f4f6', drawBorder: false },
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
                backgroundColor: 'rgba(15, 98, 254, 0.15)',
                borderColor: '#0f62fe',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#fff',
                    bodyColor: 'rgba(255,255,255,0.8)',
                    cornerRadius: 8, padding: 12, displayColors: false,
                    callbacks: { label: ctx => `Revenue: ₹${ctx.parsed.y.toLocaleString('en-IN')}` },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#525252', font: { size: 11, weight: '600' } },
                },
                y: {
                    grid: { color: '#f3f4f6', drawBorder: false },
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
                backgroundColor: ['#94a3b8', '#3b82f6', '#e2e8f0', '#ef4444'],
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
            },
        },
    });
}
