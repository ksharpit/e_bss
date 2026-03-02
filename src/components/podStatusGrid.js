// ============================================
// Pod Status Grid Component (Electica)
// ============================================
import { icon } from './icons.js';

const statusIcons = {
  charging: 'battery_charging_full',
  ready: 'battery_full',
  empty: 'battery_0_bar',
  fault: 'report_problem',
};

export function renderPodGrid(pods) {
  const gridHTML = pods.map(pod => {
    const podIcon = statusIcons[pod.status] || 'battery_unknown';
    const socText = pod.status === 'empty' ? '—' : `${pod.soc}%`;

    return `
      <div class="pod-slot ${pod.status}" title="Pod ${pod.id} — ${pod.status}">
        ${icon(podIcon, '22px')}
        <span class="pod-slot-id">${pod.id.split('-').pop()}</span>
        <span class="pod-slot-soc">${socText}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="pod-grid">${gridHTML}</div>
    <div style="display:flex;gap:var(--space-lg);margin-top:var(--space-base);flex-wrap:wrap;">
      <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--electica-blue)"></div> Charging</div>
      <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--color-success)"></div> Available</div>
      <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--color-danger)"></div> Fault</div>
      <div class="chart-legend-item"><div class="chart-legend-dot" style="background:#d1d5db"></div> Empty</div>
    </div>
  `;
}
