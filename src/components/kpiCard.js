// ============================================
// KPI / Metric Card Component (Electica)
// Unified rev-kpi-card style across all pages
// ============================================

/**
 * Render a KPI card matching the Revenue page style.
 * Uses: .rev-kpi-card, .rev-kpi-decor, .rev-kpi-label, .rev-kpi-value, .rev-badge
 */
export function createMetricCard({ value, label, trend, trendType, decor = false }) {
  const badgeClass = trendType === 'up' || trendType === 'optimal'
    ? 'rev-badge-up'
    : trendType === 'down'
    ? 'rev-badge-down'
    : 'rev-badge-track';

  return `
    <div class="rev-kpi-card">
      ${decor ? '<div class="rev-kpi-decor"></div>' : ''}
      <p class="rev-kpi-label">${label}</p>
      <h2 class="rev-kpi-value">${value}</h2>
      <span class="rev-badge ${badgeClass}">${trend}</span>
    </div>
  `;
}

/**
 * Render a horizontal KPI card (used in station/battery detail pages).
 */
export function createKpiCard({ value, label, trend, trendType }) {
  const badgeClass = trendType === 'up' ? 'rev-badge-up'
    : trendType === 'down' ? 'rev-badge-down'
    : 'rev-badge-track';

  const trendHTML = trend
    ? `<span class="rev-badge ${badgeClass}" style="margin-top:auto">${trend}</span>`
    : '';

  return `
    <div class="rev-kpi-card" style="display:flex;flex-direction:column;gap:4px">
      <p class="rev-kpi-label">${label}</p>
      <h2 class="rev-kpi-value" style="font-size:1.75rem">${value}</h2>
      ${trendHTML}
    </div>
  `;
}
