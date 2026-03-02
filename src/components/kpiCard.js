// ============================================
// KPI / Metric Card Component (Electica)
// ============================================
import { icon } from './icons.js';

/**
 * Render a square metric card (for dashboard 6-col grid)
 */
export function createMetricCard({ iconName, value, unit, label, sublabel, trend, trendType }) {
  const trendIcon = trendType === 'up' ? 'trending_up'
    : trendType === 'down' ? 'trending_down'
      : trendType === 'peak' ? 'bolt'
        : 'check_circle';

  const unitSpan = unit ? ` <span class="unit">${unit}</span>` : '';
  const sublabelHTML = sublabel ? `<span style="font-size:var(--font-md);font-weight:400;color:#6b7280;display:block;margin-top:2px">${sublabel}</span>` : '';

  return `
    <div class="metric-card">
      ${icon(iconName, '30px')}
      <h3 class="metric-value">${value}${unitSpan}</h3>
      ${sublabelHTML}
      <p class="metric-label">${label}</p>
      <div class="metric-trend ${trendType}">
        ${icon(trendIcon, '14px')}
        <span>${trend}</span>
      </div>
    </div>
  `;
}

/**
 * Render a horizontal KPI card (for detail pages)
 */
export function createKpiCard({ iconName, value, label, trend, trendType }) {
  const trendHTML = trend
    ? `<div class="metric-trend ${trendType}">
        ${icon(trendType === 'up' ? 'trending_up' : 'trending_down', '14px')}
        <span>${trend}</span>
      </div>`
    : '';

  return `
    <div class="kpi-card">
      <div class="kpi-top">
        <div class="kpi-icon">
          ${icon(iconName, '22px')}
        </div>
        ${trendHTML}
      </div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-label">${label}</div>
    </div>
  `;
}
