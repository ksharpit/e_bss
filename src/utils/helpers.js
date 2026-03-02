// ============================================
// Utility Helpers
// ============================================

/**
 * Format number as Indian Rupee currency
 */
export function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
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
