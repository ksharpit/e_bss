// ============================================
// Utility Helpers
// ============================================

// ── Currency config (shared across all pages) ──
const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.012 },
  EUR: { symbol: '€', rate: 0.011 },
};

export function getCurrency() {
  const code = localStorage.getItem('electica_currency') || 'INR';
  return CURRENCY_CONFIG[code] || CURRENCY_CONFIG.INR;
}

/** Currency symbol only */
export function curSymbol() {
  return getCurrency().symbol;
}

/** Format amount with conversion and locale (e.g. ₹3,250 or $39) */
export function fmtCur(amount) {
  const { symbol, rate } = getCurrency();
  const v = Math.round((Number(amount) || 0) * rate);
  return symbol + v.toLocaleString('en-IN');
}

/** Format large amounts abbreviated (e.g. ₹45.3K, $1.2M) */
export function formatRevM(n) {
  const { symbol, rate } = getCurrency();
  const v = Math.round((Number(n) || 0) * rate);
  if (v >= 1_000_000) return symbol + (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000) return symbol + (v / 1_000).toFixed(1) + 'K';
  return symbol + v;
}

/** Legacy alias - now currency-aware */
export function formatCurrency(amount) {
  return fmtCur(amount);
}

/**
 * Format large numbers with commas
 */
export function formatNumber(n) {
    return n.toLocaleString('en-IN');
}

/**
 * Create an HTML element from a string
 */
export function html(strings, ...values) {
    const template = document.createElement('template');
    template.innerHTML = strings.reduce((s, str, i) => s + str + (values[i] ?? ''), '');
    return template.content;
}

/**
 * Get the color class for SOC percentage
 */
export function socColorClass(soc) {
    if (soc >= 80) return 'success';
    if (soc >= 40) return 'primary';
    if (soc >= 20) return 'warning';
    return 'danger';
}

/**
 * Get SOC bar color
 */
export function socColor(soc) {
    if (soc >= 80) return '#198038';
    if (soc >= 40) return '#0f62fe';
    if (soc >= 20) return '#f59e0b';
    return '#da1e28';
}
